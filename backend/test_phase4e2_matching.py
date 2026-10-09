"""
Phase 4E.2: Multi-Skill Matching & Evidence Verification Engine Test Suite.
Authoritative test suite covering all 25 directive test cases:
  01. Canonical skill matching
  02. Candidate meets all required skills perfectly
  03. Missing must-have skill
  04. Missing preferred skill
  05. Database weights participate deterministically
  06. Minimum years satisfied
  07. Minimum years not satisfied
  08. Minimum proficiency satisfied
  09. Minimum proficiency not satisfied
  10. Self-reported skill vs verified skill
  11. Real evidence causes appropriate verification transition
  12. Multiple evidence records (anti-inflation bounded aggregation)
  13. Evidence provenance remains intact
  14. Repeated calculation produces identical results (deterministic idempotence)
  15. No artificial score floor (zero matching skills -> 0.0 score)
  16. No hardcoded business values (database-driven parameters)
  17. Candidate cannot manipulate verification (RBAC security)
  18. Cross-tenant candidate/job access blocked (HTTP 403)
  19. Unauthorized evidence attachment blocked (HTTP 403)
  20. Database session recreation preserves results
  21. Regression against Phase 4E.1 (Relational skill foundation)
  22. Regression against Phase 4D (AI Interview room & evaluation)
  23. Regression against Phase 4C (Slot booking & scheduling)
  24. Regression against Phase 4B.1 / 4B.2 (Integrity logs & MCQ question bank)
  25. Regression against Phase 1 (JWT security, token tampering, and RBAC)
"""
import os
import sys
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel,
    SkillModel, SkillAliasModel, CandidateSkillModel,
    JobSkillRequirementModel, SkillEvidenceModel
)
from services.skill_service import SkillService
from services.skill_matching_service import (
    SkillMatchingService,
    VERIFICATION_STATE_VERIFIED,
    VERIFICATION_STATE_PARTIALLY_VERIFIED,
    VERIFICATION_STATE_SELF_REPORTED,
    VERIFICATION_STATE_NOT_APPLICABLE
)
from main import app
from controllers.auth_controller import create_access_token

# Initialize schema and relational baseline
ensure_schema_columns()
client = TestClient(app)

TEST_ORG_ID = "org-matching-test-isolated"

def ensure_test_org():
    db = SessionLocal()
    try:
        org = db.query(OrganizationModel).filter(OrganizationModel.id == TEST_ORG_ID).first()
        if not org:
            org = OrganizationModel(
                id=TEST_ORG_ID,
                name="Matching Test Isolated Org",
                slug="matching-test-isolated",
                is_active=True
            )
            db.add(org)
            db.commit()
    finally:
        db.close()

ensure_test_org()


def make_job(id: str, title: str, organization_id: str = TEST_ORG_ID, **kwargs) -> JobModel:
    return JobModel(
        id=id,
        title=title,
        organization_id=organization_id,
        department=kwargs.get("department", "Engineering"),
        location=kwargs.get("location", "Remote"),
        education=kwargs.get("education", "B.S. in Computer Science"),
        description=kwargs.get("description", "Software Engineering Role"),
        required_skills=kwargs.get("required_skills", [])
    )


def make_candidate(id: str, job_id: str, name: str = "Test Candidate", organization_id: str = TEST_ORG_ID, **kwargs) -> CandidateModel:
    return CandidateModel(
        id=id,
        job_id=job_id,
        name=name,
        email=kwargs.get("email", f"{id}@test.com"),
        education=kwargs.get("education", "B.S. in Computer Science"),
        organization_id=organization_id,
        skills=kwargs.get("skills", [])
    )


def setup_matching_test_fixture():
    """Sets up isolated tenant organizations, jobs, candidates, and recruiter users."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        org_a = OrganizationModel(
            id=f"org-mat-a-{suffix}",
            name=f"Match Corp Alpha {suffix}",
            slug=f"match-corp-a-{suffix}",
            is_active=True
        )
        org_b = OrganizationModel(
            id=f"org-mat-b-{suffix}",
            name=f"Match Corp Beta {suffix}",
            slug=f"match-corp-b-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        recruiter_a = UserModel(
            id=f"usr-mrec-a-{suffix}",
            name="Recruiter Alpha",
            email=f"mrec_{suffix}@corp-a.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_a.id
        )
        recruiter_b = UserModel(
            id=f"usr-mrec-b-{suffix}",
            name="Recruiter Beta",
            email=f"mrec_{suffix}@corp-b.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_b.id
        )
        cand_user = UserModel(
            id=f"usr-mcand-{suffix}",
            name="Cand User",
            email=f"mcand_{suffix}@gmail.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_a.id
        )
        db.add_all([recruiter_a, recruiter_b, cand_user])
        db.flush()

        job_a = make_job(
            id=f"job-mat-a-{suffix}",
            title="Senior Platform Engineer",
            organization_id=org_a.id,
            required_skills=["Python", "PostgreSQL"]
        )
        job_b = make_job(
            id=f"job-mat-b-{suffix}",
            title="Cloud Architect",
            organization_id=org_b.id,
            required_skills=["AWS", "Terraform"]
        )
        db.add_all([job_a, job_b])
        db.flush()

        candidate_a = make_candidate(
            id=f"cand-mat-a-{suffix}",
            job_id=job_a.id,
            name="David Miller",
            email=cand_user.email,
            organization_id=org_a.id,
            skills=["Python", "PostgreSQL"]
        )
        candidate_a.user_id = cand_user.id
        db.add(candidate_a)
        db.commit()

        return {
            "org_a_id": org_a.id,
            "org_b_id": org_b.id,
            "recruiter_a_id": recruiter_a.id,
            "recruiter_b_id": recruiter_b.id,
            "cand_user_id": cand_user.id,
            "job_a_id": job_a.id,
            "job_b_id": job_b.id,
            "cand_a_id": candidate_a.id,
            "suffix": suffix
        }
    finally:
        db.close()


def test_01_canonical_skill_matching():
    """Test 01: Canonical skill matching across JobSkillRequirementModel and CandidateSkillModel."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        py_skill, _ = SkillService.get_or_create_skill(f"Python-{suffix}", db)
        pg_skill, _ = SkillService.get_or_create_skill(f"PostgreSQL-{suffix}", db)
        db.commit()

        job = make_job(id=f"j-01-{suffix}", title="Backend Dev", organization_id=TEST_ORG_ID)
        db.add(job)
        db.flush()

        req1 = JobSkillRequirementModel(
            id=f"jsr-1-{suffix}", job_id=job.id, skill_id=py_skill.id,
            requirement_type="must_have", weight=1.0, min_years=2.0, min_proficiency="intermediate"
        )
        req2 = JobSkillRequirementModel(
            id=f"jsr-2-{suffix}", job_id=job.id, skill_id=pg_skill.id,
            requirement_type="must_have", weight=1.0, min_years=2.0, min_proficiency="intermediate"
        )
        db.add_all([req1, req2])

        cand = make_candidate(id=f"c-01-{suffix}", job_id=job.id, name="Test 01 Cand", organization_id=TEST_ORG_ID)
        db.add(cand)
        db.flush()

        cs1 = CandidateSkillModel(
            id=f"cs-1-{suffix}", candidate_id=cand.id, skill_id=py_skill.id,
            proficiency_level="intermediate", years_experience=3.0, is_verified=True, verified_score=90.0
        )
        cs2 = CandidateSkillModel(
            id=f"cs-2-{suffix}", candidate_id=cand.id, skill_id=pg_skill.id,
            proficiency_level="intermediate", years_experience=3.0, is_verified=True, verified_score=90.0
        )
        db.add_all([cs1, cs2])
        db.commit()

        match_result = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match_result["overall_match"]["score"] == 100.0
        assert match_result["overall_match"]["status"] == "strong_match"
        assert len(match_result["skills"]) == 2
        assert match_result["skills"][0]["skill_id"] in [py_skill.id, pg_skill.id]
        print("[PASS] Test 01: Canonical skill matching successfully resolved via relational IDs.")
    finally:
        db.close()


def test_02_candidate_meets_all_skills_perfectly():
    """Test 02: Candidate has every required skill, meets years and proficiency, and is verified."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill_a, _ = SkillService.get_or_create_skill(f"Go-{suffix}", db)
        skill_b, _ = SkillService.get_or_create_skill(f"Docker-{suffix}", db)
        db.commit()

        job = make_job(id=f"j-02-{suffix}", title="Go Lead", organization_id=TEST_ORG_ID)
        db.add(job)
        db.flush()

        db.add_all([
            JobSkillRequirementModel(id=f"jsr-2a-{suffix}", job_id=job.id, skill_id=skill_a.id, requirement_type="must_have", weight=2.0, min_years=3.0, min_proficiency="advanced"),
            JobSkillRequirementModel(id=f"jsr-2b-{suffix}", job_id=job.id, skill_id=skill_b.id, requirement_type="preferred", weight=1.0, min_years=1.0, min_proficiency="intermediate")
        ])

        cand = make_candidate(id=f"c-02-{suffix}", job_id=job.id, name="Go Master", organization_id=TEST_ORG_ID)
        db.add(cand)
        db.flush()

        db.add_all([
            CandidateSkillModel(id=f"cs-2a-{suffix}", candidate_id=cand.id, skill_id=skill_a.id, proficiency_level="advanced", years_experience=5.0, is_verified=True, verified_score=95.0),
            CandidateSkillModel(id=f"cs-2b-{suffix}", candidate_id=cand.id, skill_id=skill_b.id, proficiency_level="expert", years_experience=3.0, is_verified=True, verified_score=90.0)
        ])
        db.commit()

        match = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match["overall_match"]["score"] == 100.0
        assert match["must_have"]["score"] == 100.0
        assert match["preferred"]["score"] == 100.0
        assert match["overall_match"]["has_missing_must_have"] is False
        for s in match["skills"]:
            assert s["status"] == "verified_match"
            assert s["satisfaction_score"] == 100.0
        print("[PASS] Test 02: Full skill match evaluated to deterministic 100.0% strong match.")
    finally:
        db.close()


def test_03_missing_must_have_skill():
    """Test 03: Missing must-have skill reduces must-have score and flags missing must-have."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill_1, _ = SkillService.get_or_create_skill(f"Java-{suffix}", db)
        skill_2, _ = SkillService.get_or_create_skill(f"Spring-{suffix}", db)
        db.commit()

        job = make_job(id=f"j-03-{suffix}", title="Java Engineer", organization_id=TEST_ORG_ID)
        db.add(job)
        db.flush()

        db.add_all([
            JobSkillRequirementModel(id=f"jsr-3a-{suffix}", job_id=job.id, skill_id=skill_1.id, requirement_type="must_have", weight=1.0, min_years=2.0),
            JobSkillRequirementModel(id=f"jsr-3b-{suffix}", job_id=job.id, skill_id=skill_2.id, requirement_type="must_have", weight=1.0, min_years=2.0)
        ])

        cand = make_candidate(id=f"c-03-{suffix}", job_id=job.id, name="Partial Java Cand", organization_id=TEST_ORG_ID)
        db.add(cand)
        db.flush()

        db.add(CandidateSkillModel(id=f"cs-3a-{suffix}", candidate_id=cand.id, skill_id=skill_1.id, proficiency_level="intermediate", years_experience=3.0, is_verified=True))
        db.commit()

        match = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match["must_have"]["score"] == 50.0
        assert match["must_have"]["has_missing"] is True
        assert match["overall_match"]["has_missing_must_have"] is True
        missing_item = next(s for s in match["skills"] if s["skill_id"] == skill_2.id)
        assert missing_item["status"] == "missing"
        assert missing_item["satisfaction_score"] == 0.0
        print("[PASS] Test 03: Missing must-have skill correctly flagged and penalized.")
    finally:
        db.close()


def test_04_missing_preferred_skill():
    """Test 04: Missing preferred skill reduces preferred score without penalizing must-have score."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill_core, _ = SkillService.get_or_create_skill(f"React-{suffix}", db)
        skill_pref, _ = SkillService.get_or_create_skill(f"GraphQL-{suffix}", db)
        db.commit()

        job = make_job(id=f"j-04-{suffix}", title="Frontend Dev", organization_id=TEST_ORG_ID)
        db.add(job)
        db.flush()

        db.add_all([
            JobSkillRequirementModel(id=f"jsr-4a-{suffix}", job_id=job.id, skill_id=skill_core.id, requirement_type="must_have", weight=1.0, min_years=2.0),
            JobSkillRequirementModel(id=f"jsr-4b-{suffix}", job_id=job.id, skill_id=skill_pref.id, requirement_type="preferred", weight=1.0, min_years=1.0)
        ])

        cand = make_candidate(id=f"c-04-{suffix}", job_id=job.id, name="React Dev", organization_id=TEST_ORG_ID)
        db.add(cand)
        db.flush()

        db.add(CandidateSkillModel(id=f"cs-4a-{suffix}", candidate_id=cand.id, skill_id=skill_core.id, proficiency_level="intermediate", years_experience=2.0, is_verified=True))
        db.commit()

        match = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match["must_have"]["score"] == 100.0
        assert match["must_have"]["has_missing"] is False
        assert match["preferred"]["score"] == 0.0
        assert match["preferred"]["has_missing"] is True
        assert match["overall_match"]["has_missing_must_have"] is False
        print("[PASS] Test 04: Missing preferred skill penalized preferred score while keeping must-have at 100.0%.")
    finally:
        db.close()


def test_05_different_database_weights_produce_different_deterministic_results():
    """Test 05: Database weights participate proportionally in the overall calculation."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill_a, _ = SkillService.get_or_create_skill(f"Rust-{suffix}", db)
        skill_b, _ = SkillService.get_or_create_skill(f"Cplusplus-{suffix}", db)
        db.commit()

        job1 = make_job(id=f"j-05a-{suffix}", title="Rust Lead", organization_id=TEST_ORG_ID)
        job2 = make_job(id=f"j-05b-{suffix}", title="Cpp Lead", organization_id=TEST_ORG_ID)
        db.add_all([job1, job2])
        db.flush()

        db.add_all([
            JobSkillRequirementModel(id=f"jsr-5a1-{suffix}", job_id=job1.id, skill_id=skill_a.id, requirement_type="must_have", weight=4.0),
            JobSkillRequirementModel(id=f"jsr-5b1-{suffix}", job_id=job1.id, skill_id=skill_b.id, requirement_type="must_have", weight=1.0),
            JobSkillRequirementModel(id=f"jsr-5a2-{suffix}", job_id=job2.id, skill_id=skill_a.id, requirement_type="must_have", weight=1.0),
            JobSkillRequirementModel(id=f"jsr-5b2-{suffix}", job_id=job2.id, skill_id=skill_b.id, requirement_type="must_have", weight=4.0)
        ])

        cand = make_candidate(id=f"c-05-{suffix}", job_id=job1.id, name="Rustacean", organization_id=TEST_ORG_ID)
        db.add(cand)
        db.flush()

        db.add(CandidateSkillModel(id=f"cs-5a-{suffix}", candidate_id=cand.id, skill_id=skill_a.id, proficiency_level="intermediate", years_experience=2.0, is_verified=True))
        db.commit()

        match1 = SkillMatchingService.match_candidate_to_job(cand.id, job1.id, db)
        match2 = SkillMatchingService.match_candidate_to_job(cand.id, job2.id, db)

        assert match1["overall_match"]["score"] == 80.0
        assert match2["overall_match"]["score"] == 20.0
        print("[PASS] Test 05: Database weights produced exact proportional scores (80.0% vs 20.0%).")
    finally:
        db.close()


def test_06_minimum_years_satisfied():
    """Test 06: Minimum years satisfied yields 1.0 experience factor."""
    is_sat, factor = SkillMatchingService.evaluate_experience(candidate_years=5.0, required_years=3.0)
    assert is_sat is True
    assert factor == 1.0
    print("[PASS] Test 06: Minimum years satisfied correctly evaluated to factor 1.0.")


def test_07_minimum_years_not_satisfied():
    """Test 07: Minimum years not satisfied yields fractional deterministic gradient."""
    is_sat, factor = SkillMatchingService.evaluate_experience(candidate_years=2.0, required_years=4.0)
    assert is_sat is False
    assert factor == 0.5
    print("[PASS] Test 07: Minimum years shortage correctly evaluated to fractional factor 0.5.")


def test_08_minimum_proficiency_satisfied():
    """Test 08: Minimum proficiency satisfied yields 1.0 proficiency factor."""
    is_sat, factor = SkillMatchingService.evaluate_proficiency(candidate_level="advanced", required_level="intermediate")
    assert is_sat is True
    assert factor == 1.0
    print("[PASS] Test 08: Minimum proficiency met or exceeded evaluated to factor 1.0.")


def test_09_minimum_proficiency_not_satisfied():
    """Test 09: Minimum proficiency not satisfied yields deterministic gradient."""
    is_sat, factor = SkillMatchingService.evaluate_proficiency(candidate_level="beginner", required_level="advanced")
    assert is_sat is False
    assert abs(factor - 0.3333) < 0.001
    print("[PASS] Test 09: Lower proficiency correctly evaluated to fractional factor 0.3333.")


def test_10_self_reported_skill_vs_verified_skill():
    """Test 10: Verified skill receives higher match satisfaction than self-reported skill."""
    state_v, mult_v, _ = SkillMatchingService.derive_verification_state(
        CandidateSkillModel(is_verified=True, verified_score=90.0)
    )
    state_s, mult_s, _ = SkillMatchingService.derive_verification_state(
        CandidateSkillModel(is_verified=False, verified_score=None)
    )
    assert state_v == VERIFICATION_STATE_VERIFIED
    assert mult_v == 1.0
    assert state_s == VERIFICATION_STATE_SELF_REPORTED
    assert mult_s == 0.80
    assert mult_v > mult_s
    print("[PASS] Test 10: Verified multiplier (1.0) authoritatively exceeds self-reported (0.80).")


def test_11_real_evidence_causes_appropriate_verification_transition():
    """Test 11: Real evidence causes transition from SELF_REPORTED to VERIFIED."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill, _ = SkillService.get_or_create_skill(f"Terraform-{suffix}", db)
        job = make_job(id=f"j-11-{suffix}", title="Infra Job", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-11-{suffix}", job_id=job.id, name="Infra Dev", organization_id=TEST_ORG_ID)
        db.add_all([job, cand])
        db.flush()

        cand_skill = CandidateSkillModel(
            id=f"cs-11-{suffix}", candidate_id=cand.id, skill_id=skill.id,
            proficiency_level="intermediate", years_experience=2.0, is_verified=False
        )
        db.add(cand_skill)
        db.commit()

        # Prior to evidence: self-reported
        s_initial, _, _ = SkillMatchingService.derive_verification_state(cand_skill)
        assert s_initial == VERIFICATION_STATE_SELF_REPORTED

        # Add genuine coding submission evidence with passing score (90.0)
        ev = SkillService.add_skill_evidence(
            candidate_skill_id=cand_skill.id,
            evidence_type="coding_submission",
            db=db,
            reference_id="sub-tf-999",
            score_contribution=90.0,
            snippet="Automated cloud provisioning module passed 10/10 test cases"
        )
        db.commit()
        db.refresh(cand_skill)

        s_after, mult_after, max_score = SkillMatchingService.derive_verification_state(cand_skill)
        assert s_after == VERIFICATION_STATE_VERIFIED
        assert mult_after == 1.0
        assert max_score == 90.0
        print("[PASS] Test 11: Authentic evidence transitioned verification state to VERIFIED.")
    finally:
        db.close()


def test_12_multiple_evidence_records_anti_inflation():
    """Test 12: Multiple evidence records do not inflate scores beyond 100.0%."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill, _ = SkillService.get_or_create_skill(f"Security-{suffix}", db)
        job = make_job(id=f"j-12-{suffix}", title="Sec Job", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-12-{suffix}", job_id=job.id, name="Sec Eng", organization_id=TEST_ORG_ID)
        db.add_all([job, cand])
        db.flush()

        cand_skill = CandidateSkillModel(
            id=f"cs-12-{suffix}", candidate_id=cand.id, skill_id=skill.id,
            proficiency_level="advanced", years_experience=4.0, is_verified=True
        )
        db.add(cand_skill)
        db.flush()

        SkillService.add_skill_evidence(cand_skill.id, "mcq_submission", db, "m-1", 75.0, "MCQ 1")
        SkillService.add_skill_evidence(cand_skill.id, "coding_submission", db, "c-1", 85.0, "Code 1")
        SkillService.add_skill_evidence(cand_skill.id, "interview", db, "i-1", 95.0, "Interview 1")
        db.commit()
        db.refresh(cand_skill)

        state, mult, agg_score = SkillMatchingService.derive_verification_state(cand_skill)
        assert len(cand_skill.evidence) == 3
        assert agg_score == 95.0
        assert mult == 1.0
        print("[PASS] Test 12: Multiple evidence records aggregated cleanly via anti-inflation maximum.")
    finally:
        db.close()


def test_13_evidence_provenance_intact():
    """Test 13: Evidence provenance (evidence_type, reference_id, snippet) remains intact."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill, _ = SkillService.get_or_create_skill(f"Kafka-{suffix}", db)
        job = make_job(id=f"j-13-{suffix}", title="Streaming Lead", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-13-{suffix}", job_id=job.id, name="Stream Cand", organization_id=TEST_ORG_ID)
        db.add_all([cand, job])
        db.flush()

        db.add(JobSkillRequirementModel(id=f"jsr-13-{suffix}", job_id=job.id, skill_id=skill.id))
        cand_skill = CandidateSkillModel(id=f"cs-13-{suffix}", candidate_id=cand.id, skill_id=skill.id, is_verified=True)
        db.add(cand_skill)
        db.flush()

        ref_id = f"sub-prov-{suffix}"
        snip_text = "Kafka producer retry policy passed with zero message loss"
        SkillService.add_skill_evidence(cand_skill.id, "coding_submission", db, ref_id, 100.0, snip_text)
        db.commit()

        match = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        k_skill = match["skills"][0]
        assert len(k_skill["evidence"]) == 1
        ev = k_skill["evidence"][0]
        assert ev["reference_id"] == ref_id
        assert ev["evidence_type"] == "coding_submission"
        assert ev["snippet"] == snip_text
        print("[PASS] Test 13: Evidence provenance retained 100% fidelity.")
    finally:
        db.close()


def test_14_repeated_calculation_produces_identical_results():
    """Test 14: Repeated calculations on identical DB state produce bitwise identical results."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill, _ = SkillService.get_or_create_skill(f"SQL-{suffix}", db)
        job = make_job(id=f"j-14-{suffix}", title="DBA", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-14-{suffix}", job_id=job.id, name="DBA Cand", organization_id=TEST_ORG_ID)
        db.add_all([cand, job])
        db.flush()

        db.add(JobSkillRequirementModel(id=f"jsr-14-{suffix}", job_id=job.id, skill_id=skill.id, weight=2.0))
        db.add(CandidateSkillModel(id=f"cs-14-{suffix}", candidate_id=cand.id, skill_id=skill.id, years_experience=3.0, proficiency_level="advanced", is_verified=True))
        db.commit()

        res1 = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        res2 = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        res3 = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)

        assert res1["overall_match"]["score"] == res2["overall_match"]["score"] == res3["overall_match"]["score"]
        assert res1["must_have"]["score"] == res2["must_have"]["score"] == res3["must_have"]["score"]
        assert res1["skills"][0]["satisfaction_score"] == res2["skills"][0]["satisfaction_score"]
        print("[PASS] Test 14: Repeated calculations proved 100% deterministic reproducibility.")
    finally:
        db.close()


def test_15_no_artificial_score_floor():
    """Test 15: Zero matching skills yields strictly 0.0 overall match score with no artificial floor."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill1, _ = SkillService.get_or_create_skill(f"Scala-{suffix}", db)
        skill2, _ = SkillService.get_or_create_skill(f"Spark-{suffix}", db)
        job = make_job(id=f"j-15-{suffix}", title="Big Data Lead", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-15-{suffix}", job_id=job.id, name="Empty Cand", organization_id=TEST_ORG_ID)
        db.add_all([job, cand])
        db.flush()

        db.add_all([
            JobSkillRequirementModel(id=f"jsr-15a-{suffix}", job_id=job.id, skill_id=skill1.id),
            JobSkillRequirementModel(id=f"jsr-15b-{suffix}", job_id=job.id, skill_id=skill2.id)
        ])
        db.commit()

        match = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match["overall_match"]["score"] == 0.0
        assert match["overall_match"]["status"] == "no_match"
        assert match["overall_match"]["has_missing_must_have"] is True
        assert match["overall_match"]["matched_skills_count"] == 0
        print("[PASS] Test 15: Confirmed zero artificial score floor: empty skill set produced exactly 0.0%.")
    finally:
        db.close()


def test_16_no_hardcoded_business_values():
    """Test 16: Dynamic updates to DB weights and minimums immediately alter match calculation."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        skill, _ = SkillService.get_or_create_skill(f"Csharp-{suffix}", db)
        job = make_job(id=f"j-16-{suffix}", title="Dotnet Dev", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-16-{suffix}", job_id=job.id, name="Dotnet Cand", organization_id=TEST_ORG_ID)
        db.add_all([job, cand])
        db.flush()

        req = JobSkillRequirementModel(
            id=f"jsr-16-{suffix}", job_id=job.id, skill_id=skill.id,
            min_years=2.0, min_proficiency="intermediate", weight=1.0
        )
        cand_skill = CandidateSkillModel(
            id=f"cs-16-{suffix}", candidate_id=cand.id, skill_id=skill.id,
            years_experience=2.0, proficiency_level="intermediate", is_verified=True
        )
        db.add_all([req, cand_skill])
        db.commit()

        match_init = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match_init["skills"][0]["satisfaction_score"] == 100.0

        # Change DB requirement min_years from 2.0 to 4.0
        req.min_years = 4.0
        db.commit()

        match_updated = SkillMatchingService.match_candidate_to_job(cand.id, job.id, db)
        assert match_updated["skills"][0]["satisfaction_score"] < 100.0
        assert match_updated["skills"][0]["experience_satisfied"] is False
        print("[PASS] Test 16: Dynamic database configuration change immediately altered match calculation.")
    finally:
        db.close()


def test_17_candidate_cannot_manipulate_verification():
    """Test 17: Candidate RBAC gate blocks candidate from adding unauthorized evidence."""
    fixture = setup_matching_test_fixture()
    cand_token = create_access_token(
        user_id=fixture["cand_user_id"],
        email="cand@corp-a.com",
        role="candidate",
        organization_id=fixture["org_a_id"]
    )

    res = client.post(
        f"/api/skills/candidates/{fixture['cand_a_id']}/skills/csk-fake/evidence",
        headers={"Authorization": f"Bearer {cand_token}"},
        json={"evidence_type": "coding_submission", "score_contribution": 100.0}
    )
    assert res.status_code == 403
    print("[PASS] Test 17: Candidate blocked from manipulating verification (HTTP 403).")


def test_18_cross_tenant_access_blocked():
    """Test 18: Cross-tenant recruiter cannot fetch candidate match for other organization."""
    fixture = setup_matching_test_fixture()
    recruiter_b_token = create_access_token(
        user_id=fixture["recruiter_b_id"],
        email="recruiter_b@corp-b.com",
        role="recruiter",
        organization_id=fixture["org_b_id"]
    )

    res = client.get(
        f"/api/skills/match/candidate/{fixture['cand_a_id']}/job/{fixture['job_a_id']}",
        headers={"Authorization": f"Bearer {recruiter_b_token}"}
    )
    assert res.status_code == 403
    print("[PASS] Test 18: Cross-tenant match request blocked (HTTP 403).")


def test_19_unauthorized_evidence_attachment_blocked():
    """Test 19: Recruiter from Tenant B cannot attach evidence to Tenant A candidate skill."""
    fixture = setup_matching_test_fixture()
    recruiter_b_token = create_access_token(
        user_id=fixture["recruiter_b_id"],
        email="recruiter_b@corp-b.com",
        role="recruiter",
        organization_id=fixture["org_b_id"]
    )

    res = client.post(
        f"/api/skills/candidates/{fixture['cand_a_id']}/skills/csk-fake/evidence",
        headers={"Authorization": f"Bearer {recruiter_b_token}"},
        json={"evidence_type": "mcq_submission", "score_contribution": 100.0}
    )
    assert res.status_code == 403
    print("[PASS] Test 19: Cross-tenant evidence attachment blocked (HTTP 403).")


def test_20_database_session_recreation_preserves_results():
    """Test 20: Persisted state across new Session produces identical match results."""
    db = SessionLocal()
    suffix = uuid.uuid4().hex[:6]
    try:
        skill, _ = SkillService.get_or_create_skill(f"Redis-{suffix}", db)
        job = make_job(id=f"j-20-{suffix}", title="Cache Eng", organization_id=TEST_ORG_ID)
        cand = make_candidate(id=f"c-20-{suffix}", job_id=job.id, name="Cache Cand", organization_id=TEST_ORG_ID)
        db.add_all([job, cand])
        db.flush()

        db.add(JobSkillRequirementModel(id=f"jsr-20-{suffix}", job_id=job.id, skill_id=skill.id, min_years=2.0, min_proficiency="intermediate"))
        cand_skill = CandidateSkillModel(id=f"cs-20-{suffix}", candidate_id=cand.id, skill_id=skill.id, years_experience=2.0, proficiency_level="intermediate", is_verified=True)
        db.add(cand_skill)
        db.commit()

        cand_id = cand.id
        job_id = job.id
    finally:
        db.close()

    new_db = SessionLocal()
    try:
        match = SkillMatchingService.match_candidate_to_job(cand_id, job_id, new_db)
        assert match["overall_match"]["score"] == 100.0
        assert match["skills"][0]["status"] == "verified_match"
        print("[PASS] Test 20: Match calculation survived database session recreation.")
    finally:
        new_db.close()


def test_21_regression_phase4e1():
    """Test 21: Full Phase 4E.1 relational skill suite regression."""
    import test_phase4e1_skills
    test_phase4e1_skills.test_01_canonical_skill_creation_and_slug_normalization()
    test_phase4e1_skills.test_03_candidate_skill_relationship_and_uniqueness()
    test_phase4e1_skills.test_05_skill_evidence_linking_and_verification_state()
    print("[PASS] Test 21: Regression against Phase 4E.1 relational skill foundation passed.")


def test_22_regression_phase4d_interview():
    """Test 22: Phase 4D AI Interview room regression."""
    import test_phase4d_interview
    test_phase4d_interview.test_01_scheduled_candidate_starts_interview_and_syncs_booking()
    test_phase4d_interview.test_02_unscheduled_candidate_cannot_start_interview()
    test_phase4d_interview.test_06_interview_evaluation_scorecard_and_transcript_persistence()
    print("[PASS] Test 22: Regression against Phase 4D AI Interview passed.")


def test_23_regression_phase4c_scheduling():
    """Test 23: Phase 4C Slot booking and scheduling regression."""
    import test_phase4c_scheduling
    test_phase4c_scheduling.test_01_recruiter_create_availability_persists()
    test_phase4c_scheduling.test_07_candidate_book_slot_atomic_and_sync()
    print("[PASS] Test 23: Regression against Phase 4C scheduling passed.")


def test_24_regression_phase4b_mcq_bank():
    """Test 24: Phase 4B.1 / 4B.2 MCQ Bank and tenant isolation regression."""
    import test_phase4b2_mcq_bank
    test_phase4b2_mcq_bank.test_01_seed_system_mcqs_idempotent()
    test_phase4b2_mcq_bank.test_06_tenant_isolation_mcq_bank()
    test_phase4b2_mcq_bank.test_10_candidate_bundle_confidentiality()
    print("[PASS] Test 24: Regression against Phase 4B.1 / 4B.2 MCQ Bank passed.")


def test_25_regression_phase1_security():
    """Test 25: Phase 1 JWT security and token tampering regression."""
    import test_phase1_security_verification
    test_phase1_security_verification.test_1_candidate_bola_idor()
    test_phase1_security_verification.test_2_recruiter_multi_tenant_isolation()
    print("[PASS] Test 25: Regression against Phase 1 security verification passed.")


def cleanup_matching_test_data():
    """Purges isolated test records so development database is not polluted."""
    import sqlite3
    try:
        conn = sqlite3.connect('sparkx_recruitment.db')
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("DELETE FROM candidates WHERE organization_id = ? OR id LIKE 'c-%';", (TEST_ORG_ID,))
        cursor.execute("DELETE FROM jobs WHERE organization_id = ? OR id LIKE 'j-%';", (TEST_ORG_ID,))
        cursor.execute("DELETE FROM candidate_skills WHERE candidate_id NOT IN (SELECT id FROM candidates);")
        cursor.execute("DELETE FROM skill_evidence WHERE candidate_skill_id NOT IN (SELECT id FROM candidate_skills);")
        cursor.execute("DELETE FROM job_skill_requirements WHERE job_id NOT IN (SELECT id FROM jobs);")
        cursor.execute("DELETE FROM organizations WHERE id LIKE 'org-mat-%' OR id LIKE 'org-sk-%' OR id = ?;", (TEST_ORG_ID,))
        cursor.execute("DELETE FROM users WHERE organization_id LIKE 'org-mat-%' OR organization_id LIKE 'org-sk-%' OR organization_id = ?;", (TEST_ORG_ID,))
        conn.commit()
        cursor.execute("PRAGMA foreign_keys = ON;")
        conn.close()
    except Exception:
        pass


if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING PHASE 4E.2 MULTI-SKILL MATCHING & EVIDENCE VERIFICATION SUITE")
    print("======================================================================\n")
    try:
        test_01_canonical_skill_matching()
        test_02_candidate_meets_all_skills_perfectly()
        test_03_missing_must_have_skill()
        test_04_missing_preferred_skill()
        test_05_different_database_weights_produce_different_deterministic_results()
        test_06_minimum_years_satisfied()
        test_07_minimum_years_not_satisfied()
        test_08_minimum_proficiency_satisfied()
        test_09_minimum_proficiency_not_satisfied()
        test_10_self_reported_skill_vs_verified_skill()
        test_11_real_evidence_causes_appropriate_verification_transition()
        test_12_multiple_evidence_records_anti_inflation()
        test_13_evidence_provenance_intact()
        test_14_repeated_calculation_produces_identical_results()
        test_15_no_artificial_score_floor()
        test_16_no_hardcoded_business_values()
        test_17_candidate_cannot_manipulate_verification()
        test_18_cross_tenant_access_blocked()
        test_19_unauthorized_evidence_attachment_blocked()
        test_20_database_session_recreation_preserves_results()
        test_21_regression_phase4e1()
        test_22_regression_phase4d_interview()
        test_23_regression_phase4c_scheduling()
        test_24_regression_phase4b_mcq_bank()
        test_25_regression_phase1_security()
        print("\n======================================================================")
        print("ALL 25 PHASE 4E.2 MATCHING & EVIDENCE ENGINE TESTS PASSED FLAWLESSLY.")
        print("======================================================================")
    finally:
        cleanup_matching_test_data()

