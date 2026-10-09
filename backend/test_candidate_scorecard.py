"""
Candidate Scorecard: Production Verification & Forensic Test Suite (Phase 4E.7)

Verifies:
  1. Scorecard aggregation structure adheres strictly to CandidateScorecardResponse contract.
  2. Verified skill classification (>= 70% evidence score or manual recruiter verification -> VERIFIED).
  3. Evidenced skill classification (< 70% preliminary evidence -> EVIDENCED).
  4. Claimed skill classification (candidate self-reported, 0 evidence -> CLAIMED).
  5. Missing skill classification (job requirement exists, candidate has 0 claims and 0 evidence -> MISSING).
  6. Cross-assessment evidence aggregation (Coding, MCQ, Interview evidence correctly grouped with source titles).
  7. Deterministic formula calculation:
       Fit Score = Σ(weight * multiplier * factor) / Σ(weight * multiplier) * 100
       Must-Have = 2.0x, Preferred = 1.0x; Verified = 1.0, Evidenced = 0.65, Claimed = 0.25, Missing = 0.0.
       Verification that recalculation on same DB state produces 100% reproducible, identical values.
  8. Multi-tenant security isolation (Recruiter in Org B cannot access Org A candidate).
  9. Candidate BOLA/IDOR isolation (Candidate A cannot access Candidate B's scorecard; candidate can access own).
  10. Partial/incomplete recruitment lifecycle handling without fake or fabricated data.
  11. Empty requirements state handling (Job with 0 skill requirements).
  12. Actionable skill gap generation with context-aware mitigation recommendations.
"""
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel,
    SkillModel, SkillAliasModel, CandidateSkillModel,
    JobSkillRequirementModel, SkillEvidenceModel,
    CodingProblemModel, MCQQuestionModel
)
from services.skill_service import SkillService
from services.skill_matching_service import SkillMatchingService, VERIFICATION_PASS_THRESHOLD
from services.skill_passport_service import SkillPassportService
from services.candidate_scorecard_service import CandidateScorecardService

# Ensure DB schema is up to date
ensure_schema_columns()


def setup_scorecard_test_env():
    """Sets up isolated tenant organizations, jobs, candidates, and recruiter users with unique UUID suffix."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        
        # Org Alpha
        org_a = OrganizationModel(
            id=f"org-sc-a-{suffix}",
            name=f"Scorecard Org Alpha {suffix}",
            slug=f"sc-alpha-{suffix}",
            is_active=True
        )
        # Org Beta (Competitor / isolated tenant)
        org_b = OrganizationModel(
            id=f"org-sc-b-{suffix}",
            name=f"Scorecard Org Beta {suffix}",
            slug=f"sc-beta-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        # Recruiter Alpha
        recruiter_a = UserModel(
            id=f"usr-sc-rec-a-{suffix}",
            name="Recruiter Alpha",
            email=f"rec_a_{suffix}@alpha.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_a.id
        )
        # Recruiter Beta
        recruiter_b = UserModel(
            id=f"usr-sc-rec-b-{suffix}",
            name="Recruiter Beta",
            email=f"rec_b_{suffix}@beta.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_b.id
        )
        db.add_all([recruiter_a, recruiter_b])
        db.flush()

        # Target Job in Org Alpha
        job_a = JobModel(
            id=f"job-sc-a-{suffix}",
            organization_id=org_a.id,
            title="Senior Backend Systems Engineer",
            department="Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            description="Systems engineering",
            required_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes"],
            status="Active"
        )
        db.add(job_a)
        db.flush()

        # User accounts for Candidates
        user_alice = UserModel(
            id=f"usr-cand-alice-{suffix}",
            name="Alice Engineer",
            email=f"alice_{suffix}@example.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_a.id
        )
        user_bob = UserModel(
            id=f"usr-cand-bob-{suffix}",
            name="Bob Developer",
            email=f"bob_{suffix}@example.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_a.id
        )
        db.add_all([user_alice, user_bob])
        db.flush()

        # Candidates in Org Alpha linked to user accounts
        cand_alice = CandidateModel(
            id=f"cand-sc-alice-{suffix}",
            user_id=user_alice.id,
            organization_id=org_a.id,
            job_id=job_a.id,
            name="Alice Engineer",
            email=user_alice.email,
            education="B.S. in Computer Science",
            stage="interview",
            status="Active"
        )
        cand_bob = CandidateModel(
            id=f"cand-sc-bob-{suffix}",
            user_id=user_bob.id,
            organization_id=org_a.id,
            job_id=job_a.id,
            name="Bob Developer",
            email=user_bob.email,
            education="B.S. in Computer Science",
            stage="applied",
            status="Active"
        )
        db.add_all([cand_alice, cand_bob])
        db.flush()

        # Canonical Skills via SkillService
        skill_python, _ = SkillService.get_or_create_skill("Python", db=db, category="Backend Development")
        skill_fastapi, _ = SkillService.get_or_create_skill("FastAPI", db=db, category="Web Frameworks")
        skill_postgres, _ = SkillService.get_or_create_skill("PostgreSQL", db=db, category="Databases")
        skill_docker, _ = SkillService.get_or_create_skill("Docker", db=db, category="DevOps")
        skill_k8s, _ = SkillService.get_or_create_skill("Kubernetes", db=db, category="DevOps")

        # Job Skill Requirements for job_a:
        # Must-Have: Python (weight 2.0), FastAPI (weight 1.5), PostgreSQL (weight 1.0)
        # Preferred: Docker (weight 1.0), Kubernetes (weight 0.8)
        req_python = JobSkillRequirementModel(
            id=f"req-py-{suffix}",
            job_id=job_a.id,
            skill_id=skill_python.id,
            requirement_type="must_have",
            weight=2.0,
            min_years=3.0,
            min_proficiency="intermediate"
        )
        req_fastapi = JobSkillRequirementModel(
            id=f"req-fa-{suffix}",
            job_id=job_a.id,
            skill_id=skill_fastapi.id,
            requirement_type="must_have",
            weight=1.5,
            min_years=2.0,
            min_proficiency="intermediate"
        )
        req_postgres = JobSkillRequirementModel(
            id=f"req-pg-{suffix}",
            job_id=job_a.id,
            skill_id=skill_postgres.id,
            requirement_type="must_have",
            weight=1.0,
            min_years=2.0,
            min_proficiency="intermediate"
        )
        req_docker = JobSkillRequirementModel(
            id=f"req-dk-{suffix}",
            job_id=job_a.id,
            skill_id=skill_docker.id,
            requirement_type="preferred",
            weight=1.0,
            min_years=1.0,
            min_proficiency="basic"
        )
        req_k8s = JobSkillRequirementModel(
            id=f"req-k8s-{suffix}",
            job_id=job_a.id,
            skill_id=skill_k8s.id,
            requirement_type="preferred",
            weight=0.8,
            min_years=1.0,
            min_proficiency="basic"
        )
        db.add_all([req_python, req_fastapi, req_postgres, req_docker, req_k8s])
        db.commit()

        return {
            "suffix": suffix,
            "org_a_id": org_a.id,
            "org_b_id": org_b.id,
            "recruiter_a": {"id": recruiter_a.id, "role": "recruiter", "organization_id": org_a.id},
            "recruiter_b": {"id": recruiter_b.id, "role": "recruiter", "organization_id": org_b.id},
            "cand_alice": {"id": cand_alice.id, "user_id": user_alice.id, "role": "candidate", "organization_id": org_a.id},
            "cand_bob": {"id": cand_bob.id, "user_id": user_bob.id, "role": "candidate", "organization_id": org_a.id},
            "job_a_id": job_a.id,
            "skill_ids": {
                "python": skill_python.id,
                "fastapi": skill_fastapi.id,
                "postgres": skill_postgres.id,
                "docker": skill_docker.id,
                "k8s": skill_k8s.id
            }
        }
    finally:
        db.close()


def test_scorecard_aggregation_structure():
    """Test 1: Scorecard aggregation returns complete CandidateScorecardResponse contract."""
    print("Running Test 1: Scorecard aggregation structure...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=env["cand_alice"]["id"],
            job_id=env["job_a_id"],
            db=db,
            current_user=env["recruiter_a"]
        )

        assert scorecard is not None, "Scorecard should not be None"
        assert scorecard["candidate_id"] == env["cand_alice"]["id"]
        assert scorecard["job_id"] == env["job_a_id"]
        assert scorecard["job_title"] == "Senior Backend Systems Engineer"
        assert scorecard["organization_id"] == env["org_a_id"]
        assert "summary" in scorecard
        assert "skill_evaluations" in scorecard
        assert "skill_gaps" in scorecard
        assert "evidence_summary" in scorecard
        assert "generated_at" in scorecard
        
        # Check summary contract
        s = scorecard["summary"]
        assert s["total_required_skills"] == 3  # Python, FastAPI, Postgres
        assert s["total_preferred_skills"] == 2  # Docker, Kubernetes
        assert s["total_job_skills"] == 5
        assert isinstance(s["overall_fit_score"], (int, float))
        assert s["fit_tier"] in ["STRONG_FIT", "GOOD_FIT", "MODERATE_FIT", "LIMITED_FIT"]
        print("  [PASS] Passed: Complete CandidateScorecardResponse payload generated")
    finally:
        db.close()


def test_verified_vs_evidenced_vs_claimed_vs_missing():
    """Test 2-5: Precise classification of VERIFIED, EVIDENCED, CLAIMED, and MISSING skills."""
    print("Running Tests 2-5: Skill status classification matrix...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        suffix = env["suffix"]
        cand_id = env["cand_alice"]["id"]
        skills = env["skill_ids"]

        # 1. Python: VERIFIED via 85% coding submission
        cs_py = CandidateSkillModel(
            id=f"cs-py-{suffix}",
            candidate_id=cand_id,
            skill_id=skills["python"],
            proficiency_level="expert",
            years_experience=4.0,
            is_verified=False
        )
        db.add(cs_py)
        db.flush()

        prob = CodingProblemModel(
            id=f"prob-py-{suffix}",
            title="Async Event Loop Queue",
            slug=f"async-queue-{suffix}",
            problem_statement="Implement an asynchronous queue",
            difficulty="Medium"
        )
        db.add(prob)
        db.flush()

        ev_py = SkillEvidenceModel(
            id=f"ev-py-{suffix}",
            candidate_skill_id=cs_py.id,
            evidence_type="CODING_CHALLENGE",
            reference_id=prob.id,
            score_contribution=85.0,  # >= 70% -> VERIFIED
            snippet="All 10 test cases passed with 12ms latency."
        )
        db.add(ev_py)

        # 2. FastAPI: EVIDENCED via 55% preliminary quiz (< 70%)
        cs_fa = CandidateSkillModel(
            id=f"cs-fa-{suffix}",
            candidate_id=cand_id,
            skill_id=skills["fastapi"],
            proficiency_level="intermediate",
            years_experience=2.0,
            is_verified=False
        )
        db.add(cs_fa)
        db.flush()

        ev_fa = SkillEvidenceModel(
            id=f"ev-fa-{suffix}",
            candidate_skill_id=cs_fa.id,
            evidence_type="MCQ_ASSESSMENT",
            reference_id=f"mcq-fa-{suffix}",
            score_contribution=55.0,  # < 70% -> EVIDENCED
            snippet="Basic route decorators understood; dependency injection missed."
        )
        db.add(ev_fa)

        # 3. PostgreSQL: CLAIMED (self-reported, 0 evidence)
        cs_pg = CandidateSkillModel(
            id=f"cs-pg-{suffix}",
            candidate_id=cand_id,
            skill_id=skills["postgres"],
            proficiency_level="intermediate",
            years_experience=3.0,
            is_verified=False
        )
        db.add(cs_pg)

        # 4. Docker: MISSING (In job requirement, but candidate has 0 claims and 0 evidence)
        # 5. Kubernetes: MISSING (In job requirement, but candidate has 0 claims and 0 evidence)

        db.commit()

        # Generate Scorecard
        scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=cand_id,
            job_id=env["job_a_id"],
            db=db,
            current_user=env["recruiter_a"]
        )

        eval_map = {item["skill_name"]: item for item in scorecard["skill_evaluations"]}

        # Check Python -> VERIFIED
        assert eval_map["Python"]["status"] == "VERIFIED", f"Python should be VERIFIED, got {eval_map['Python']['status']}"
        assert eval_map["Python"]["evidence_strength"] == "STRONG"
        assert len(eval_map["Python"]["evidence"]) == 1

        # Check FastAPI -> EVIDENCED
        assert eval_map["FastAPI"]["status"] == "EVIDENCED", f"FastAPI should be EVIDENCED, got {eval_map['FastAPI']['status']}"
        assert eval_map["FastAPI"]["evidence_strength"] == "MODERATE"

        # Check PostgreSQL -> CLAIMED
        assert eval_map["PostgreSQL"]["status"] == "CLAIMED", f"PostgreSQL should be CLAIMED, got {eval_map['PostgreSQL']['status']}"
        assert eval_map["PostgreSQL"]["evidence_strength"] == "NONE"

        # Check Docker -> MISSING
        assert eval_map["Docker"]["status"] == "MISSING", f"Docker should be MISSING, got {eval_map['Docker']['status']}"

        # Check Kubernetes -> MISSING
        assert eval_map["Kubernetes"]["status"] == "MISSING", f"Kubernetes should be MISSING, got {eval_map['Kubernetes']['status']}"

        # Check summary counts
        s = scorecard["summary"]
        assert s["verified_required_count"] == 1  # Python
        assert s["evidenced_required_count"] == 1  # FastAPI
        assert s["claimed_required_count"] == 1    # Postgres
        assert s["missing_required_count"] == 0
        assert s["missing_preferred_count"] == 2   # Docker, Kubernetes
        assert s["total_verified_skills"] == 1
        assert s["total_evidenced_skills"] == 1
        assert s["total_claimed_skills"] == 1
        assert s["total_missing_skills"] == 2

        print("  [PASS] Passed: Strict status partitioning (VERIFIED, EVIDENCED, CLAIMED, MISSING)")
    finally:
        db.close()


def test_cross_assessment_evidence_aggregation():
    """Test 6: Cross-assessment evidence correctly aggregates Coding, MCQ, Interview, and Recruiter proofs."""
    print("Running Test 6: Cross-assessment evidence aggregation...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        suffix = env["suffix"]
        cand_id = env["cand_alice"]["id"]
        py_skill_id = env["skill_ids"]["python"]

        cs_py = CandidateSkillModel(
            id=f"cs-multi-py-{suffix}",
            candidate_id=cand_id,
            skill_id=py_skill_id,
            proficiency_level="expert",
            years_experience=5.0
        )
        db.add(cs_py)
        db.flush()

        # Evidence 1: Coding Challenge
        ev1 = SkillEvidenceModel(
            id=f"ev-code-{suffix}",
            candidate_skill_id=cs_py.id,
            evidence_type="CODING_CHALLENGE",
            reference_id=f"code-ref-{suffix}",
            score_contribution=92.0,
            snippet="Binary search tree inversion completed in 4 minutes."
        )
        # Evidence 2: MCQ Assessment
        ev2 = SkillEvidenceModel(
            id=f"ev-mcq-{suffix}",
            candidate_skill_id=cs_py.id,
            evidence_type="MCQ_ASSESSMENT",
            reference_id=f"mcq-ref-{suffix}",
            score_contribution=85.0,
            snippet="Scored 9/10 on Python GIL and asyncio questions."
        )
        # Evidence 3: AI Speech Interview
        ev3 = SkillEvidenceModel(
            id=f"ev-interview-{suffix}",
            candidate_skill_id=cs_py.id,
            evidence_type="AI_INTERVIEW",
            reference_id=f"int-ref-{suffix}",
            score_contribution=78.0,
            snippet="Clearly articulated generator pipeline architecture."
        )
        db.add_all([ev1, ev2, ev3])
        db.commit()

        scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=cand_id,
            job_id=env["job_a_id"],
            db=db,
            current_user=env["recruiter_a"]
        )

        eval_map = {item["skill_name"]: item for item in scorecard["skill_evaluations"]}
        py_eval = eval_map["Python"]

        assert py_eval["evidence_count"] == 3, f"Expected 3 evidence items, got {py_eval['evidence_count']}"
        assert py_eval["status"] == "VERIFIED"
        assert len(py_eval["evidence"]) == 3
        
        # Check source title formatting
        evidence_sources = [ev["evidence_type"] for ev in py_eval["evidence"]]
        assert "CODING_CHALLENGE" in evidence_sources
        assert "MCQ_ASSESSMENT" in evidence_sources
        assert "AI_INTERVIEW" in evidence_sources

        # Check evidence summary
        ev_sum = scorecard["evidence_summary"]
        assert ev_sum["total_evidence_records"] == 3
        assert ev_sum["coding_evidence_count"] == 1
        assert ev_sum["mcq_evidence_count"] == 1
        assert ev_sum["interview_evidence_count"] == 1

        print("  [PASS] Passed: Cross-assessment evidence aggregation across all modal channels")
    finally:
        db.close()


def test_deterministic_scoring_formula():
    """Test 7: Formula reproduces exact score calculation consistently across repeated executions."""
    print("Running Test 7: Deterministic formula calculation...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        suffix = env["suffix"]
        cand_id = env["cand_alice"]["id"]
        skills = env["skill_ids"]

        # Requirements:
        # Python: weight 2.0, must_have (mult = 2.0). Effective weight = 4.0
        # FastAPI: weight 1.5, must_have (mult = 2.0). Effective weight = 3.0
        # Postgres: weight 1.0, must_have (mult = 2.0). Effective weight = 2.0
        # Docker: weight 1.0, preferred (mult = 1.0). Effective weight = 1.0
        # Kubernetes: weight 0.8, preferred (mult = 1.0). Effective weight = 0.8
        # Total effective weight = 4.0 + 3.0 + 2.0 + 1.0 + 0.8 = 10.8

        # Satisfactions:
        # Python: VERIFIED -> factor 1.0 -> 4.0 * 1.0 = 4.0
        # FastAPI: EVIDENCED -> factor 0.65 -> 3.0 * 0.65 = 1.95
        # Postgres: CLAIMED -> factor 0.25 -> 2.0 * 0.25 = 0.50
        # Docker: MISSING -> factor 0.0 -> 1.0 * 0.0 = 0.0
        # Kubernetes: MISSING -> factor 0.0 -> 0.8 * 0.0 = 0.0
        # Total satisfaction = 4.0 + 1.95 + 0.50 = 6.45
        # Expected fit score = (6.45 / 10.8) * 100 = 59.7222... -> round to 59.7

        cs_py = CandidateSkillModel(
            id=f"cs-det-py-{suffix}", candidate_id=cand_id, skill_id=skills["python"]
        )
        cs_fa = CandidateSkillModel(
            id=f"cs-det-fa-{suffix}", candidate_id=cand_id, skill_id=skills["fastapi"]
        )
        cs_pg = CandidateSkillModel(
            id=f"cs-det-pg-{suffix}", candidate_id=cand_id, skill_id=skills["postgres"]
        )
        db.add_all([cs_py, cs_fa, cs_pg])
        db.flush()

        # Python verified
        ev_py = SkillEvidenceModel(
            id=f"ev-det-py-{suffix}", candidate_skill_id=cs_py.id,
            evidence_type="CODING_CHALLENGE", score_contribution=80.0
        )
        # FastAPI evidenced
        ev_fa = SkillEvidenceModel(
            id=f"ev-det-fa-{suffix}", candidate_skill_id=cs_fa.id,
            evidence_type="MCQ_ASSESSMENT", score_contribution=60.0
        )
        db.add_all([ev_py, ev_fa])
        db.commit()

        # Run 5 times in succession
        scores = []
        for i in range(5):
            res = CandidateScorecardService.get_scorecard(
                candidate_id=cand_id,
                job_id=env["job_a_id"],
                db=db,
                current_user=env["recruiter_a"]
            )
            scores.append(res["summary"]["overall_fit_score"])

        # Check identical results
        assert all(s == scores[0] for s in scores), f"Scores differed across runs: {scores}"
        assert abs(scores[0] - 59.7) < 0.1, f"Expected ~59.7%, got {scores[0]}%"
        assert res["summary"]["fit_tier"] == "MODERATE_FIT"  # 50.0 <= score < 65.0

        print("  [PASS] Passed: Deterministic scoring formula is 100% reproducible and matches mathematical derivation")
    finally:
        db.close()


def test_cross_tenant_security():
    """Test 8: Cross-tenant isolation (Recruiter B cannot access Recruiter A's candidate scorecard)."""
    print("Running Test 8: Cross-tenant isolation security...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        # Recruiter B attempts to view Alice (in Org A)
        forbidden_triggered = False
        try:
            CandidateScorecardService.get_scorecard(
                candidate_id=env["cand_alice"]["id"],
                job_id=env["job_a_id"],
                db=db,
                current_user=env["recruiter_b"]  # Belongs to Org B
            )
        except PermissionError:
            forbidden_triggered = True

        assert forbidden_triggered, "Expected PermissionError when cross-tenant recruiter attempts access"
        print("  [PASS] Passed: Tenant boundaries strictly guarded (Cross-tenant access forbidden)")
    finally:
        db.close()


def test_candidate_bola_security():
    """Test 9: Candidate BOLA/IDOR isolation (Candidate Bob cannot view Candidate Alice's scorecard)."""
    print("Running Test 9: Candidate BOLA/IDOR isolation...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        # Candidate Bob tries to access Candidate Alice's scorecard
        user_bob = {
            "id": env["cand_bob"]["user_id"],
            "role": "candidate",
            "candidate_id": env["cand_bob"]["id"],
            "organization_id": env["org_a_id"]
        }

        bola_blocked = False
        try:
            CandidateScorecardService.get_scorecard(
                candidate_id=env["cand_alice"]["id"],
                job_id=env["job_a_id"],
                db=db,
                current_user=user_bob
            )
        except PermissionError:
            bola_blocked = True

        assert bola_blocked, "Expected PermissionError when Candidate Bob accesses Candidate Alice's scorecard"

        # Candidate Alice viewing her OWN scorecard succeeds
        user_alice = {
            "id": env["cand_alice"]["user_id"],
            "role": "candidate",
            "candidate_id": env["cand_alice"]["id"],
            "organization_id": env["org_a_id"]
        }
        own_scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=env["cand_alice"]["id"],
            job_id=env["job_a_id"],
            db=db,
            current_user=user_alice
        )
        assert own_scorecard is not None
        assert own_scorecard["candidate_id"] == env["cand_alice"]["id"]

        print("  [PASS] Passed: Candidate BOLA/IDOR isolation enforced; candidates can only access their own scorecard")
    finally:
        db.close()


def test_incomplete_lifecycle_and_zero_hardcoding():
    """Test 10-11: Incomplete lifecycle handles lack of evidence without hallucination or mock data."""
    print("Running Tests 10-11: Incomplete lifecycle & zero hardcoding...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        # Candidate Bob has 0 claims and 0 evidence
        scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=env["cand_bob"]["id"],
            job_id=env["job_a_id"],
            db=db,
            current_user=env["recruiter_a"]
        )

        assert scorecard["summary"]["overall_fit_score"] == 0.0
        assert scorecard["summary"]["fit_tier"] == "LIMITED_FIT"
        assert scorecard["summary"]["total_verified_skills"] == 0
        assert scorecard["summary"]["total_evidenced_skills"] == 0
        assert scorecard["summary"]["total_claimed_skills"] == 0
        assert scorecard["summary"]["total_missing_skills"] == 5
        assert scorecard["evidence_summary"]["total_evidence_records"] == 0

        # Create a job with 0 skill requirements
        suffix = env["suffix"]
        empty_job = JobModel(
            id=f"job-empty-{suffix}",
            organization_id=env["org_a_id"],
            title="Junior Exploratory Intern",
            department="Exploration",
            location="Remote",
            education="High School Diploma",
            description="Exploratory role",
            required_skills=[],
            status="Active"
        )
        db.add(empty_job)
        db.commit()

        scorecard_empty = CandidateScorecardService.get_scorecard(
            candidate_id=env["cand_bob"]["id"],
            job_id=empty_job.id,
            db=db,
            current_user=env["recruiter_a"]
        )

        assert scorecard_empty["summary"]["total_job_skills"] == 0
        assert scorecard_empty["summary"]["overall_fit_score"] == 0.0
        assert len(scorecard_empty["skill_evaluations"]) == 0
        assert len(scorecard_empty["skill_gaps"]) == 0

        print("  [PASS] Passed: Zero hardcoding and incomplete lifecycle return authentic, un-hallucinated empty states")
    finally:
        db.close()


def test_actionable_skill_gaps_generation():
    """Test 12: Evidence-based skill gap detection and contextual mitigation generation."""
    print("Running Test 12: Evidence-based skill gap detection...")
    env = setup_scorecard_test_env()
    db = SessionLocal()
    try:
        suffix = env["suffix"]
        cand_id = env["cand_alice"]["id"]
        skills = env["skill_ids"]

        # Python: Claimed but 0 evidence -> MUST_HAVE_UNVERIFIED
        cs_py = CandidateSkillModel(
            id=f"cs-gap-py-{suffix}", candidate_id=cand_id, skill_id=skills["python"]
        )
        # FastAPI: Missing completely -> CRITICAL_MUST_HAVE_MISSING
        # Docker: Missing preferred -> PREFERRED_MISSING
        db.add(cs_py)
        db.commit()

        scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=cand_id,
            job_id=env["job_a_id"],
            db=db,
            current_user=env["recruiter_a"]
        )

        gaps = scorecard["skill_gaps"]
        assert len(gaps) > 0

        gap_map = {g["skill_name"]: g for g in gaps}

        # Check Python gap
        assert "Python" in gap_map
        assert gap_map["Python"]["gap_type"] == "MUST_HAVE_UNVERIFIED"
        assert "Verify self-reported claim through" in gap_map["Python"]["mitigation_recommendation"]

        # Check FastAPI gap
        assert "FastAPI" in gap_map
        assert gap_map["FastAPI"]["gap_type"] == "CRITICAL_MUST_HAVE_MISSING"
        assert "Assign focused assessment" in gap_map["FastAPI"]["mitigation_recommendation"]

        # Check Docker gap
        assert "Docker" in gap_map
        assert gap_map["Docker"]["gap_type"] == "PREFERRED_MISSING"

        print("  [PASS] Passed: Actionable evidence-based skill gaps generated with mitigation recommendations")
    finally:
        db.close()


def run_all_scorecard_tests():
    print("=" * 70)
    print("SPARKX CANDIDATE SCORECARD VERIFICATION SUITE (PHASE 4E.7)")
    print("=" * 70)

    test_scorecard_aggregation_structure()
    test_verified_vs_evidenced_vs_claimed_vs_missing()
    test_cross_assessment_evidence_aggregation()
    test_deterministic_scoring_formula()
    test_cross_tenant_security()
    test_candidate_bola_security()
    test_incomplete_lifecycle_and_zero_hardcoding()
    test_actionable_skill_gaps_generation()

    print("=" * 70)
    print("ALL 12 CANDIDATE SCORECARD TEST SCENARIOS PASSED WITH ZERO DEFECTS")
    print("=" * 70)


if __name__ == "__main__":
    run_all_scorecard_tests()
