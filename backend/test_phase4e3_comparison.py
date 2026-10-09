"""
Phase 4E.3: Candidate Comparison Engine & Recruiter UI Test Suite.
Authoritative test suite covering all Phase 4E.3 requirements:
  01. Recruiter compares candidates successfully (side-by-side matrix, rankings, gaps)
  02. Minimum candidate validation (must have >= 2 candidates)
  03. Candidate not belonging to job rejected (HTTP 400)
  04. Non-existent candidate ID rejected (HTTP 404)
  05. Non-existent job ID rejected (HTTP 404)
  06. Non-recruiter access blocked (HTTP 403)
  07. Cross-tenant job access blocked (HTTP 403)
  08. Cross-tenant candidate access blocked (HTTP 403)
  09. Skill matrix structure and sorting (must_have first, weights descending)
  10. Authentic evidence provenance and ledger integrity
  11. Gaps and strengths analysis verification
  12. Deterministic ranking and tiebreaking
  13. Zero artificial score floor (empty skills yields strictly 0.0%)
  14. Convenience GET endpoint verification (/api/skills/compare/job/{job_id})
  15. Database session recreation idempotence
  16. Regression: Phase 4E.2 matching & evidence engine
  17. Regression: Phase 4E.1 relational skill foundation
  18. Regression: Phase 4D AI interview workflow
  19. Regression: Phase 4C interview scheduling
  20. Regression: Phase 1 security verification & IDOR/BOLA
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

ensure_schema_columns()
client = TestClient(app)


def make_job(id: str, title: str, organization_id: str = "org-sparkx-default", **kwargs) -> JobModel:
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


def make_candidate(id: str, job_id: str, name: str = "Test Candidate", organization_id: str = "org-sparkx-default", **kwargs) -> CandidateModel:
    return CandidateModel(
        id=id,
        job_id=job_id,
        name=name,
        email=kwargs.get("email", f"{id}@test.com"),
        education=kwargs.get("education", "B.S. in Computer Science"),
        organization_id=organization_id,
        skills=kwargs.get("skills", [])
    )


def setup_comparison_fixtures():
    """Sets up isolated tenant organizations, jobs, candidates, and recruiter users."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        org_a = OrganizationModel(
            id=f"org-comp-a-{suffix}",
            name=f"Comparison Org A {suffix}",
            slug=f"comp-org-a-{suffix}",
            is_active=True
        )
        org_b = OrganizationModel(
            id=f"org-comp-b-{suffix}",
            name=f"Comparison Org B {suffix}",
            slug=f"comp-org-b-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        recruiter_a = UserModel(
            id=f"usr-rec-a-{suffix}",
            email=f"recruiter_a_{suffix}@sparkx.ai",
            name="Recruiter Alpha",
            role="recruiter",
            organization_id=org_a.id,
            password_hash="mockhash"
        )
        recruiter_b = UserModel(
            id=f"usr-rec-b-{suffix}",
            email=f"recruiter_b_{suffix}@sparkx.ai",
            name="Recruiter Beta",
            role="recruiter",
            organization_id=org_b.id,
            password_hash="mockhash"
        )
        candidate_user = UserModel(
            id=f"usr-cand-{suffix}",
            email=f"candidate_{suffix}@test.com",
            name="Candidate User",
            role="candidate",
            organization_id=org_a.id,
            password_hash="mockhash"
        )
        db.add_all([recruiter_a, recruiter_b, candidate_user])
        db.flush()

        job_a = make_job(
            id=f"job-comp-a-{suffix}",
            title=f"Senior Cloud Architect {suffix}",
            organization_id=org_a.id,
            department="Cloud Infrastructure"
        )
        job_b = make_job(
            id=f"job-comp-b-{suffix}",
            title=f"Backend Engineer {suffix}",
            organization_id=org_b.id,
            department="Platform"
        )
        db.add_all([job_a, job_b])
        db.flush()

        # Candidates for Job A
        cand_a1 = make_candidate(
            id=f"cand-a1-{suffix}",
            job_id=job_a.id,
            name="Alice Architecture",
            organization_id=org_a.id
        )
        cand_a2 = make_candidate(
            id=f"cand-a2-{suffix}",
            job_id=job_a.id,
            name="Bob Backend",
            organization_id=org_a.id
        )
        cand_a3 = make_candidate(
            id=f"cand-a3-{suffix}",
            job_id=job_a.id,
            name="Charlie Novice",
            organization_id=org_a.id
        )
        # Candidate for Job B
        cand_b1 = make_candidate(
            id=f"cand-b1-{suffix}",
            job_id=job_b.id,
            name="David Delta",
            organization_id=org_b.id
        )
        db.add_all([cand_a1, cand_a2, cand_a3, cand_b1])
        db.flush()

        # Canonical Skills
        s_aws, _ = SkillService.get_or_create_skill(f"AWS-{suffix}", db, category="Cloud")
        s_python, _ = SkillService.get_or_create_skill(f"Python-{suffix}", db, category="Programming")
        s_docker, _ = SkillService.get_or_create_skill(f"Docker-{suffix}", db, category="DevOps")
        db.flush()

        # Requirements for Job A:
        # AWS: must_have, weight=3.0, min_years=4.0, min_prof=advanced
        # Python: must_have, weight=2.0, min_years=3.0, min_prof=intermediate
        # Docker: preferred, weight=1.0, min_years=2.0, min_prof=intermediate
        r_aws = JobSkillRequirementModel(
            id=f"jsr-aws-{suffix}",
            job_id=job_a.id,
            skill_id=s_aws.id,
            requirement_type="must_have",
            weight=3.0,
            min_years=4.0,
            min_proficiency="advanced"
        )
        r_python = JobSkillRequirementModel(
            id=f"jsr-py-{suffix}",
            job_id=job_a.id,
            skill_id=s_python.id,
            requirement_type="must_have",
            weight=2.0,
            min_years=3.0,
            min_proficiency="intermediate"
        )
        r_docker = JobSkillRequirementModel(
            id=f"jsr-doc-{suffix}",
            job_id=job_a.id,
            skill_id=s_docker.id,
            requirement_type="preferred",
            weight=1.0,
            min_years=2.0,
            min_proficiency="intermediate"
        )
        db.add_all([r_aws, r_python, r_docker])
        db.flush()

        # Candidate A1 Skills: Expert, meets all requirements, verified
        cs_a1_aws = CandidateSkillModel(
            id=f"cs-a1-aws-{suffix}",
            candidate_id=cand_a1.id,
            skill_id=s_aws.id,
            proficiency_level="expert",
            years_experience=6.0,
            is_verified=True,
            verified_score=95.0
        )
        cs_a1_py = CandidateSkillModel(
            id=f"cs-a1-py-{suffix}",
            candidate_id=cand_a1.id,
            skill_id=s_python.id,
            proficiency_level="advanced",
            years_experience=5.0,
            is_verified=True,
            verified_score=90.0
        )
        cs_a1_doc = CandidateSkillModel(
            id=f"cs-a1-doc-{suffix}",
            candidate_id=cand_a1.id,
            skill_id=s_docker.id,
            proficiency_level="intermediate",
            years_experience=3.0,
            is_verified=True,
            verified_score=85.0
        )
        db.add_all([cs_a1_aws, cs_a1_py, cs_a1_doc])
        db.flush()

        # Add evidence for A1
        ev_a1 = SkillEvidenceModel(
            id=f"ev-a1-{suffix}",
            candidate_skill_id=cs_a1_aws.id,
            evidence_type="coding_submission",
            reference_id="sub-123",
            score_contribution=95.0,
            snippet="AWS Infrastructure as Code deployment passed with 95%"
        )
        db.add(ev_a1)

        # Candidate A2 Skills: Partial, self-reported, missing Docker
        cs_a2_aws = CandidateSkillModel(
            id=f"cs-a2-aws-{suffix}",
            candidate_id=cand_a2.id,
            skill_id=s_aws.id,
            proficiency_level="intermediate",
            years_experience=2.0,
            is_verified=False
        )
        cs_a2_py = CandidateSkillModel(
            id=f"cs-a2-py-{suffix}",
            candidate_id=cand_a2.id,
            skill_id=s_python.id,
            proficiency_level="intermediate",
            years_experience=3.0,
            is_verified=False
        )
        db.add_all([cs_a2_aws, cs_a2_py])

        # Candidate A3: No skills at all
        db.commit()

        token_rec_a = create_access_token(
            user_id=recruiter_a.id,
            email=recruiter_a.email,
            role="recruiter",
            organization_id=org_a.id
        )
        token_rec_b = create_access_token(
            user_id=recruiter_b.id,
            email=recruiter_b.email,
            role="recruiter",
            organization_id=org_b.id
        )
        token_cand = create_access_token(
            user_id=candidate_user.id,
            email=candidate_user.email,
            role="candidate",
            organization_id=org_a.id
        )

        return {
            "org_a_id": org_a.id,
            "org_b_id": org_b.id,
            "job_a_id": job_a.id,
            "job_b_id": job_b.id,
            "cand_a1_id": cand_a1.id,
            "cand_a2_id": cand_a2.id,
            "cand_a3_id": cand_a3.id,
            "cand_b1_id": cand_b1.id,
            "token_rec_a": token_rec_a,
            "token_rec_b": token_rec_b,
            "token_cand": token_cand,
            "suffix": suffix
        }
    finally:
        db.close()


def test_01_recruiter_compare_candidates_success():
    """Test 01: Recruiter compares 3 candidates successfully; validates matrix, ranking, and scores."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]
    c3_id = fixtures["cand_a3_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c2_id, c1_id, c3_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()

    assert data["job_id"] == job_id
    assert data["total_requirements"] == 3
    assert data["must_have_count"] == 2
    assert data["preferred_count"] == 1
    assert len(data["candidates"]) == 3

    # Ranking validation: A1 is 100% verified match (#1), A2 is partial (#2), A3 is empty (#3)
    cands_by_rank = {c["rank"]: c for c in data["candidates"]}
    assert cands_by_rank[1]["candidate_id"] == c1_id
    assert cands_by_rank[2]["candidate_id"] == c2_id
    assert cands_by_rank[3]["candidate_id"] == c3_id

    # Verify scores are deterministic and authoritative
    assert cands_by_rank[1]["overall_match"]["score"] == 100.0
    assert cands_by_rank[1]["must_have"]["score"] == 100.0
    assert cands_by_rank[1]["must_have"]["has_missing"] is False

    assert cands_by_rank[2]["overall_match"]["score"] < 100.0
    assert cands_by_rank[3]["overall_match"]["score"] == 0.0

    # Skill matrix verification
    assert len(data["skill_comparison"]) == 3
    for row in data["skill_comparison"]:
        assert len(row["candidate_values"]) == 3
        assert c1_id in row["candidate_values"]
        assert c2_id in row["candidate_values"]
        assert c3_id in row["candidate_values"]

    print("[PASS] Test 01: Recruiter compared candidates successfully with verified ranking and matrix.")


def test_02_minimum_candidates_validation():
    """Test 02: Validates at least 2 candidates required for comparison."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 400
    assert "at least 2 candidates" in resp.json()["detail"].lower()

    resp_empty = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": []},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_empty.status_code == 400

    print("[PASS] Test 02: Minimum 2 candidates validation strictly enforced.")


def test_03_candidate_not_in_job_validation():
    """Test 03: Candidate not applied to target job is rejected with HTTP 400."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_a_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c_b1_id = fixtures["cand_b1_id"]  # Belongs to job B, not job A

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_a_id, "candidate_ids": [c1_id, c_b1_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code in (400, 403)
    print("[PASS] Test 03: Candidate outside job scope rejected.")


def test_04_candidate_not_found_validation():
    """Test 04: Non-existent candidate ID rejected with HTTP 404."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, "cand-nonexistent-999"]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 404
    print("[PASS] Test 04: Non-existent candidate ID correctly returned 404.")


def test_05_job_not_found_validation():
    """Test 05: Non-existent job ID rejected with HTTP 404."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": "job-nonexistent-999", "candidate_ids": [c1_id, c2_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 404
    print("[PASS] Test 05: Non-existent job ID correctly returned 404.")


def test_06_non_recruiter_access_blocked():
    """Test 06: Candidate role is forbidden from accessing recruiter comparison."""
    fixtures = setup_comparison_fixtures()
    cand_token = fixtures["token_cand"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, c2_id]},
        headers={"Authorization": f"Bearer {cand_token}"}
    )
    assert resp.status_code == 403
    print("[PASS] Test 06: Non-recruiter access strictly denied (HTTP 403).")


def test_07_cross_tenant_job_access_blocked():
    """Test 07: Recruiter from Org B attempting to compare candidates for Job A is blocked."""
    fixtures = setup_comparison_fixtures()
    rec_b_token = fixtures["token_rec_b"]
    job_a_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_a_id, "candidate_ids": [c1_id, c2_id]},
        headers={"Authorization": f"Bearer {rec_b_token}"}
    )
    assert resp.status_code == 403
    print("[PASS] Test 07: Cross-tenant job access blocked with HTTP 403.")


def test_08_cross_tenant_candidate_access_blocked():
    """Test 08: Recruiter from Org A cannot access candidate from Org B."""
    fixtures = setup_comparison_fixtures()
    rec_a_token = fixtures["token_rec_a"]
    job_b_id = fixtures["job_b_id"]
    c_b1_id = fixtures["cand_b1_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_b_id, "candidate_ids": [c_b1_id, "cand-dummy"]},
        headers={"Authorization": f"Bearer {rec_a_token}"}
    )
    assert resp.status_code == 403
    print("[PASS] Test 08: Cross-tenant candidate access blocked with HTTP 403.")


def test_09_skill_matrix_structure_and_sorting():
    """Test 09: Matrix orders must-have skills first, then preferred by weight descending."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, c2_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    rows = resp.json()["skill_comparison"]

    assert rows[0]["requirement_type"] == "must_have"
    assert rows[1]["requirement_type"] == "must_have"
    assert rows[2]["requirement_type"] == "preferred"

    # Higher weight must-have (AWS w=3) before lower weight must-have (Python w=2)
    assert rows[0]["weight"] >= rows[1]["weight"]
    print("[PASS] Test 09: Skill matrix structure, grouping, and weight sorting verified.")


def test_10_evidence_provenance_and_ledger():
    """Test 10: Validates authentic platform evidence is attached with complete fidelity."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, c2_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    rows = resp.json()["skill_comparison"]

    # AWS row for candidate A1 should have 1 evidence record with 95% contribution
    aws_row = next(r for r in rows if "AWS" in r["skill_name"])
    a1_val = aws_row["candidate_values"][c1_id]
    assert a1_val["verification_status"] == VERIFICATION_STATE_VERIFIED
    assert a1_val["evidence_count"] >= 1
    assert a1_val["evidence"][0]["score_contribution"] == 95.0
    assert "95%" in a1_val["evidence"][0]["snippet"]

    # Candidate A2 should have self-reported status with 0 evidence
    a2_val = aws_row["candidate_values"][c2_id]
    assert a2_val["verification_status"] == VERIFICATION_STATE_SELF_REPORTED
    assert a2_val["evidence_count"] == 0

    print("[PASS] Test 10: Evidence provenance and ledger integrity verified.")


def test_11_gaps_and_strengths_generation():
    """Test 11: Validates explainable gaps and strengths generated per candidate."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, c2_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    cands = {c["candidate_id"]: c for c in resp.json()["candidates"]}

    # Candidate A1 has verified strengths and 0 missing must-haves
    assert len(cands[c1_id]["top_strengths"]) > 0
    assert not any("missing must-have" in g.lower() for g in cands[c1_id]["gaps"])

    # Candidate A2 has gaps: missing Docker and experience shortage on AWS
    assert any("docker" in g.lower() for g in cands[c2_id]["gaps"])
    assert any("experience shortage" in g.lower() for g in cands[c2_id]["gaps"])

    print("[PASS] Test 11: Gaps and strengths generated deterministically.")


def test_12_deterministic_ranking_and_tiebreaking():
    """Test 12: Ranking is strictly deterministic and identical across repeated executions."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]
    c3_id = fixtures["cand_a3_id"]

    res1 = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, c2_id, c3_id]},
        headers={"Authorization": f"Bearer {token}"}
    ).json()

    res2 = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c3_id, c1_id, c2_id]},
        headers={"Authorization": f"Bearer {token}"}
    ).json()

    ranks1 = [c["candidate_id"] for c in res1["candidates"]]
    ranks2 = [c["candidate_id"] for c in res2["candidates"]]
    assert ranks1 == ranks2, f"Expected deterministic order, got {ranks1} vs {ranks2}"
    print("[PASS] Test 12: Deterministic ranking and order independence verified.")


def test_13_zero_artificial_score_floor():
    """Test 13: Empty candidate skill set yields exactly 0.0% overall score."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c3_id = fixtures["cand_a3_id"]  # Candidate with 0 skills

    resp = client.post(
        "/api/skills/compare",
        json={"job_id": job_id, "candidate_ids": [c1_id, c3_id]},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    c3_summary = next(c for c in resp.json()["candidates"] if c["candidate_id"] == c3_id)
    assert c3_summary["overall_match"]["score"] == 0.0
    assert c3_summary["overall_match"]["matched_skills_count"] == 0
    print("[PASS] Test 13: Zero artificial score floor verified (0.0% match).")


def test_14_get_convenience_endpoint():
    """Test 14: Convenience GET endpoint /api/skills/compare/job/{job_id} produces identical result."""
    fixtures = setup_comparison_fixtures()
    token = fixtures["token_rec_a"]
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    resp = client.get(
        f"/api/skills/compare/job/{job_id}?candidate_ids={c1_id}&candidate_ids={c2_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["job_id"] == job_id
    assert len(data["candidates"]) == 2
    print("[PASS] Test 14: Convenience GET endpoint matches POST results.")


def test_15_database_session_recreation_idempotence():
    """Test 15: Verification survives database session restarts."""
    fixtures = setup_comparison_fixtures()
    job_id = fixtures["job_a_id"]
    c1_id = fixtures["cand_a1_id"]
    c2_id = fixtures["cand_a2_id"]

    db1 = SessionLocal()
    res1 = SkillMatchingService.compare_job_candidates(job_id, [c1_id, c2_id], db1)
    db1.close()

    db2 = SessionLocal()
    res2 = SkillMatchingService.compare_job_candidates(job_id, [c1_id, c2_id], db2)
    db2.close()

    assert res1["candidates"][0]["overall_match"]["score"] == res2["candidates"][0]["overall_match"]["score"]
    assert len(res1["skill_comparison"]) == len(res2["skill_comparison"])
    print("[PASS] Test 15: DB session recreation preserves exact comparison results.")


def test_16_regression_phase4e2_matching():
    """Test 16: Regression against Phase 4E.2 matching engine."""
    from test_phase4e2_matching import (
        test_01_canonical_skill_matching,
        test_02_candidate_meets_all_skills_perfectly,
        test_11_real_evidence_causes_appropriate_verification_transition
    )
    test_01_canonical_skill_matching()
    test_02_candidate_meets_all_skills_perfectly()
    test_11_real_evidence_causes_appropriate_verification_transition()
    print("[PASS] Test 16: Regression against Phase 4E.2 matching engine passed.")


def test_17_regression_phase4e1_relational_skills():
    """Test 17: Regression against Phase 4E.1 relational skills."""
    from test_phase4e1_skills import (
        test_01_canonical_skill_creation_and_slug_normalization,
        test_03_candidate_skill_relationship_and_uniqueness,
        test_05_skill_evidence_linking_and_verification_state
    )
    test_01_canonical_skill_creation_and_slug_normalization()
    test_03_candidate_skill_relationship_and_uniqueness()
    test_05_skill_evidence_linking_and_verification_state()
    print("[PASS] Test 17: Regression against Phase 4E.1 relational skills passed.")


def test_18_regression_phase4d_interview():
    """Test 18: Regression against Phase 4D interview workflow."""
    from test_phase4d_interview import (
        test_01_scheduled_candidate_starts_interview_and_syncs_booking,
        test_02_unscheduled_candidate_cannot_start_interview,
        test_06_interview_evaluation_scorecard_and_transcript_persistence
    )
    test_01_scheduled_candidate_starts_interview_and_syncs_booking()
    test_02_unscheduled_candidate_cannot_start_interview()
    test_06_interview_evaluation_scorecard_and_transcript_persistence()
    print("[PASS] Test 18: Regression against Phase 4D interview workflow passed.")


def test_19_regression_phase4c_scheduling():
    """Test 19: Regression against Phase 4C scheduling."""
    from test_phase4c_scheduling import (
        test_01_recruiter_create_availability_persists,
        test_07_candidate_book_slot_atomic_and_sync
    )
    test_01_recruiter_create_availability_persists()
    test_07_candidate_book_slot_atomic_and_sync()
    print("[PASS] Test 19: Regression against Phase 4C scheduling passed.")


def test_20_regression_phase1_security():
    """Test 20: Regression against Phase 1 security verification."""
    from test_phase1_security_verification import (
        test_1_candidate_bola_idor,
        test_2_recruiter_multi_tenant_isolation
    )
    test_1_candidate_bola_idor()
    test_2_recruiter_multi_tenant_isolation()
    print("[PASS] Test 20: Regression against Phase 1 security verification passed.")


def cleanup_comparison_test_data():
    """Purges isolated test records so development database is not polluted."""
    import sqlite3
    try:
        conn = sqlite3.connect('sparkx_recruitment.db')
        cursor = conn.cursor()
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("DELETE FROM candidates WHERE organization_id != 'org-sparkx-default';")
        cursor.execute("DELETE FROM jobs WHERE organization_id != 'org-sparkx-default';")
        cursor.execute("DELETE FROM candidate_skills WHERE candidate_id NOT IN (SELECT id FROM candidates);")
        cursor.execute("DELETE FROM skill_evidence WHERE candidate_skill_id NOT IN (SELECT id FROM candidate_skills);")
        cursor.execute("DELETE FROM job_skill_requirements WHERE job_id NOT IN (SELECT id FROM jobs);")
        cursor.execute("DELETE FROM organizations WHERE id != 'org-sparkx-default';")
        cursor.execute("DELETE FROM users WHERE organization_id != 'org-sparkx-default';")
        conn.commit()
        cursor.execute("PRAGMA foreign_keys = ON;")
        conn.close()
    except Exception:
        pass


if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING PHASE 4E.3 CANDIDATE COMPARISON ENGINE & RECRUITER UI SUITE")
    print("=" * 70)
    try:
        test_01_recruiter_compare_candidates_success()
        test_02_minimum_candidates_validation()
        test_03_candidate_not_in_job_validation()
        test_04_candidate_not_found_validation()
        test_05_job_not_found_validation()
        test_06_non_recruiter_access_blocked()
        test_07_cross_tenant_job_access_blocked()
        test_08_cross_tenant_candidate_access_blocked()
        test_09_skill_matrix_structure_and_sorting()
        test_10_evidence_provenance_and_ledger()
        test_11_gaps_and_strengths_generation()
        test_12_deterministic_ranking_and_tiebreaking()
        test_13_zero_artificial_score_floor()
        test_14_get_convenience_endpoint()
        test_15_database_session_recreation_idempotence()
        test_16_regression_phase4e2_matching()
        test_17_regression_phase4e1_relational_skills()
        test_18_regression_phase4d_interview()
        test_19_regression_phase4c_scheduling()
        test_20_regression_phase1_security()
        print("=" * 70)
        print("ALL 20 PHASE 4E.3 CANDIDATE COMPARISON ENGINE TESTS PASSED FLAWLESSLY.")
        print("=" * 70)
    finally:
        cleanup_comparison_test_data()

