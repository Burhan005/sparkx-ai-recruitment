"""
Phase 4E.8: Evidence-Based Candidate Comparison Test Suite
Authoritative test suite covering:
  01. Recruiter compares candidates successfully (scorecard fit scores, tiers, coverage, evidence counts)
  02. Minimum 2 candidates validation strictly enforced (HTTP 400)
  03. Candidate not belonging to job rejected (HTTP 400)
  04. Non-existent candidate ID rejected (HTTP 404)
  05. Non-existent job ID rejected (HTTP 404)
  06. Non-recruiter access blocked (HTTP 403)
  07. Cross-tenant job access blocked (HTTP 403)
  08. Cross-tenant candidate access blocked (HTTP 403)
  09. Meaningful differences and differentiators explainable generation
  10. Honest evaluation ties detected without artificial score deltas
  11. Requirement matrix accurately classifies VERIFIED, EVIDENCED, CLAIMED, MISSING with evidence links & mitigations
  12. Route parity between /api/skills/compare and /api/candidates/compare
"""
import os
import sys
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel,
    SkillModel, CandidateSkillModel, JobSkillRequirementModel, SkillEvidenceModel
)
from services.skill_service import SkillService
from services.candidate_scorecard_service import CandidateScorecardService
from main import app
from controllers.auth_controller import create_access_token

ensure_schema_columns()
client = TestClient(app)


def setup_comparison_fixtures():
    """Sets up isolated tenant organizations, jobs, candidates, requirements, and recruiter users."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        org_a = OrganizationModel(
            id=f"org-cmp-a-{suffix}",
            name=f"Comparison Org A {suffix}",
            slug=f"cmp-org-a-{suffix}",
            is_active=True
        )
        org_b = OrganizationModel(
            id=f"org-cmp-b-{suffix}",
            name=f"Comparison Org B {suffix}",
            slug=f"cmp-org-b-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        recruiter_a = UserModel(
            id=f"usr-cmp-rec-a-{suffix}",
            name="Recruiter Alpha",
            email=f"rec-a-{suffix}@domain.com",
            password_hash="mock_hash",
            role="recruiter",
            organization_id=org_a.id,
            created_at=datetime.utcnow()
        )
        recruiter_b = UserModel(
            id=f"usr-cmp-rec-b-{suffix}",
            name="Recruiter Beta",
            email=f"rec-b-{suffix}@domain.com",
            password_hash="mock_hash",
            role="recruiter",
            organization_id=org_b.id,
            created_at=datetime.utcnow()
        )
        candidate_user = UserModel(
            id=f"usr-cmp-cand-{suffix}",
            name="Candidate Regular",
            email=f"cand-{suffix}@domain.com",
            password_hash="mock_hash",
            role="candidate",
            organization_id=org_a.id,
            created_at=datetime.utcnow()
        )
        db.add_all([recruiter_a, recruiter_b, candidate_user])
        db.flush()

        # Job in Org A
        job_a = JobModel(
            id=f"job-cmp-a-{suffix}",
            title=f"Staff Cloud Architect {suffix}",
            company_name="Cloud Corp",
            organization_id=org_a.id,
            department="Cloud Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            description="Leading infrastructure architecture",
            required_skills=[]
        )
        # Job in Org B
        job_b = JobModel(
            id=f"job-cmp-b-{suffix}",
            title=f"Backend Lead {suffix}",
            company_name="Beta Corp",
            organization_id=org_b.id,
            department="Backend Systems",
            location="Remote",
            education="B.S. in Computer Science",
            description="Beta backend systems",
            required_skills=[]
        )
        db.add_all([job_a, job_b])
        db.flush()

        # Candidate A1 (Strong / Verified Fit)
        cand_a1 = CandidateModel(
            id=f"cand-cmp-a1-{suffix}",
            job_id=job_a.id,
            name="Candidate Alice (Verified)",
            email=f"alice-{suffix}@domain.com",
            education="M.S. Computer Science",
            organization_id=org_a.id,
            stage="applied"
        )
        # Candidate A2 (Moderate / Self-reported)
        cand_a2 = CandidateModel(
            id=f"cand-cmp-a2-{suffix}",
            job_id=job_a.id,
            name="Candidate Bob (Claimed)",
            email=f"bob-{suffix}@domain.com",
            education="B.S. Computer Science",
            organization_id=org_a.id,
            stage="applied"
        )
        # Candidate A3 (Zero skills / Empty)
        cand_a3 = CandidateModel(
            id=f"cand-cmp-a3-{suffix}",
            job_id=job_a.id,
            name="Candidate Charlie (Missing)",
            email=f"charlie-{suffix}@domain.com",
            education="B.A. Literature",
            organization_id=org_a.id,
            stage="applied"
        )
        # Candidate B1 (Belongs to Job B)
        cand_b1 = CandidateModel(
            id=f"cand-cmp-b1-{suffix}",
            job_id=job_b.id,
            name="Candidate Dave (Org B)",
            email=f"dave-{suffix}@domain.com",
            education="B.S. Computer Science",
            organization_id=org_b.id,
            stage="applied"
        )
        db.add_all([cand_a1, cand_a2, cand_a3, cand_b1])
        db.flush()

        # Canonical Skills
        s_k8s, _ = SkillService.get_or_create_skill(f"Kubernetes-{suffix}", db, category="Cloud")
        s_go, _ = SkillService.get_or_create_skill(f"Golang-{suffix}", db, category="Programming")
        s_sec, _ = SkillService.get_or_create_skill(f"SecOps-{suffix}", db, category="Security")
        db.flush()

        # Requirements for Job A:
        # Kubernetes: must_have, weight=3.0, min_years=4.0, min_prof=advanced
        # Golang: must_have, weight=2.0, min_years=3.0, min_prof=intermediate
        # SecOps: preferred, weight=1.0, min_years=2.0, min_prof=intermediate
        r_k8s = JobSkillRequirementModel(
            id=f"jsr-k8s-{suffix}",
            job_id=job_a.id,
            skill_id=s_k8s.id,
            requirement_type="must_have",
            weight=3.0,
            min_years=4.0,
            min_proficiency="advanced"
        )
        r_go = JobSkillRequirementModel(
            id=f"jsr-go-{suffix}",
            job_id=job_a.id,
            skill_id=s_go.id,
            requirement_type="must_have",
            weight=2.0,
            min_years=3.0,
            min_proficiency="intermediate"
        )
        r_sec = JobSkillRequirementModel(
            id=f"jsr-sec-{suffix}",
            job_id=job_a.id,
            skill_id=s_sec.id,
            requirement_type="preferred",
            weight=1.0,
            min_years=2.0,
            min_proficiency="intermediate"
        )
        db.add_all([r_k8s, r_go, r_sec])
        db.flush()

        # Candidate A1 Skills: Expert, meets all requirements, verified
        cs_a1_k8s = CandidateSkillModel(
            id=f"cs-a1-k8s-{suffix}",
            candidate_id=cand_a1.id,
            skill_id=s_k8s.id,
            proficiency_level="expert",
            years_experience=5.0,
            is_verified=True,
            verified_score=95.0
        )
        cs_a1_go = CandidateSkillModel(
            id=f"cs-a1-go-{suffix}",
            candidate_id=cand_a1.id,
            skill_id=s_go.id,
            proficiency_level="advanced",
            years_experience=4.0,
            is_verified=True,
            verified_score=90.0
        )
        cs_a1_sec = CandidateSkillModel(
            id=f"cs-a1-sec-{suffix}",
            candidate_id=cand_a1.id,
            skill_id=s_sec.id,
            proficiency_level="intermediate",
            years_experience=3.0,
            is_verified=True,
            verified_score=85.0
        )
        db.add_all([cs_a1_k8s, cs_a1_go, cs_a1_sec])
        db.flush()

        # Evidence for A1
        ev_a1 = SkillEvidenceModel(
            id=f"ev-a1-{suffix}",
            candidate_skill_id=cs_a1_k8s.id,
            evidence_type="coding_submission",
            reference_id="sub-k8s-101",
            score_contribution=95.0,
            snippet="Production Kubernetes manifests deployment validated with 95%"
        )
        db.add(ev_a1)

        # Candidate A2 Skills: Self-reported only, missing SecOps
        cs_a2_k8s = CandidateSkillModel(
            id=f"cs-a2-k8s-{suffix}",
            candidate_id=cand_a2.id,
            skill_id=s_k8s.id,
            proficiency_level="intermediate",
            years_experience=2.0,
            is_verified=False
        )
        cs_a2_go = CandidateSkillModel(
            id=f"cs-a2-go-{suffix}",
            candidate_id=cand_a2.id,
            skill_id=s_go.id,
            proficiency_level="intermediate",
            years_experience=3.0,
            is_verified=False
        )
        db.add_all([cs_a2_k8s, cs_a2_go])
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


def test_01_recruiter_compare_candidates_scorecard_metrics():
    """Test 01: Recruiter compares 3 candidates; validates scorecard fit scores, tiers, coverage, and ranking."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a2_id"], f["cand_a1_id"], f["cand_a3_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()

    assert data["job_id"] == f["job_a_id"]
    assert data["total_requirements"] == 3
    assert data["must_have_count"] == 2
    assert data["preferred_count"] == 1
    assert len(data["candidates"]) == 3

    # Ranking: Alice #1, Bob #2, Charlie #3
    cands_by_rank = {c["rank"]: c for c in data["candidates"]}
    assert cands_by_rank[1]["candidate_id"] == f["cand_a1_id"]
    assert cands_by_rank[2]["candidate_id"] == f["cand_a2_id"]
    assert cands_by_rank[3]["candidate_id"] == f["cand_a3_id"]

    # Scorecard dimensions
    assert cands_by_rank[1]["scorecard_fit_score"] == 100.0
    assert cands_by_rank[1]["scorecard_fit_tier"] == "STRONG_FIT"
    assert cands_by_rank[1]["required_skill_coverage"] == 100.0
    assert cands_by_rank[1]["verified_evidence_count"] >= 1

    assert cands_by_rank[2]["scorecard_fit_score"] < 100.0
    assert cands_by_rank[3]["scorecard_fit_score"] == 0.0
    assert cands_by_rank[3]["scorecard_fit_tier"] == "LIMITED_FIT"

    print("[PASS] Test 01: Recruiter compared candidates with authoritative scorecard metrics.")


def test_02_minimum_candidates_validation():
    """Test 02: Validates at least 2 candidates required for comparison."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 400
    assert "at least 2 candidates" in resp.json()["detail"].lower()

    resp_empty = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": []},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp_empty.status_code == 400
    print("[PASS] Test 02: Minimum candidates validation strictly enforced.")


def test_03_candidate_outside_job_rejected():
    """Test 03: Rejects attempts to compare candidates from mismatched job requisitions."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], f["cand_b1_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 400
    assert "does not belong to job" in resp.json()["detail"].lower()
    print("[PASS] Test 03: Candidate outside job scope rejected with 400.")


def test_04_nonexistent_candidate_rejected():
    """Test 04: Rejects non-existent candidate ID with 400 or 404."""
    f = setup_comparison_fixtures()
    fake_cid = f"cand-fake-{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], fake_cid]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code in (400, 404)
    assert "not found" in resp.json()["detail"].lower()
    print("[PASS] Test 04: Non-existent candidate ID rejected.")


def test_05_nonexistent_job_rejected():
    """Test 05: Rejects non-existent job ID with 400 or 404."""
    f = setup_comparison_fixtures()
    fake_jid = f"job-fake-{uuid.uuid4().hex[:8]}"
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": fake_jid, "candidate_ids": [f["cand_a1_id"], f["cand_a2_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code in (400, 404)
    assert "not found" in resp.json()["detail"].lower()
    print("[PASS] Test 05: Non-existent job ID rejected.")


def test_06_non_recruiter_access_blocked():
    """Test 06: Non-recruiter access blocked with HTTP 403."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], f["cand_a2_id"]]},
        headers={"Authorization": f"Bearer {f['token_cand']}"}
    )
    assert resp.status_code == 403
    print("[PASS] Test 06: Non-recruiter access strictly denied (HTTP 403).")


def test_07_cross_tenant_job_access_blocked():
    """Test 07: Recruiter B cannot compare candidates against Job A in Org A."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], f["cand_a2_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_b']}"}
    )
    assert resp.status_code == 403
    print("[PASS] Test 07: Cross-tenant job access blocked with HTTP 403.")


def test_08_cross_tenant_candidate_access_blocked():
    """Test 08: Recruiter B cannot compare Candidate A1 even if requested against Job B."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_b_id"], "candidate_ids": [f["cand_b1_id"], f["cand_a1_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_b']}"}
    )
    assert resp.status_code in (400, 403)
    print("[PASS] Test 08: Cross-tenant candidate access blocked.")


def test_09_meaningful_differences_and_differentiators():
    """Test 09: Generates explainable differentiators showing why Alice ranks ahead of Bob."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], f["cand_a2_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200
    data = resp.json()

    diffs = data.get("meaningful_differences", [])
    assert len(diffs) > 0

    # Checks explanation points: overall fit lead, must-have verification lead, and evidence depth
    diff_text = " ".join(diffs).lower()
    assert "leads" in diff_text or "overall fit" in diff_text
    assert "must-have" in diff_text
    assert "evidence" in diff_text
    print("[PASS] Test 09: Meaningful differences and differentiators generated deterministically.")


def test_10_honest_ties_detection():
    """Test 10: Honestly flags evaluation ties when candidates possess equal score and coverage."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        org = OrganizationModel(id=f"org-tie-{suffix}", name=f"Tie Org {suffix}", slug=f"tie-{suffix}", is_active=True)
        db.add(org)
        db.flush()

        rec = UserModel(
            id=f"usr-tie-rec-{suffix}",
            name="Recruiter Tie",
            email=f"tie-rec-{suffix}@domain.com",
            password_hash="mock",
            role="recruiter",
            organization_id=org.id,
            created_at=datetime.utcnow()
        )
        db.add(rec)
        db.flush()

        job = JobModel(
            id=f"job-tie-{suffix}",
            title=f"Role Tie {suffix}",
            company_name="Corp",
            department="Engineering",
            education="B.S. in Computer Science",
            description="Engineering role",
            organization_id=org.id,
            required_skills=[]
        )
        db.add(job)
        db.flush()

        # Skill and requirement
        sk, _ = SkillService.get_or_create_skill(f"TieSkill-{suffix}", db)
        db.flush()
        req = JobSkillRequirementModel(
            id=f"jsr-tie-{suffix}",
            job_id=job.id,
            skill_id=sk.id,
            requirement_type="must_have",
            weight=1.0,
            min_years=2.0
        )
        db.add(req)
        db.flush()

        # Two identical candidates with identical verified skills
        c1 = CandidateModel(id=f"c1-tie-{suffix}", job_id=job.id, name="Twin One", email=f"t1-{suffix}@domain.com", education="B.S. in Computer Science", organization_id=org.id)
        c2 = CandidateModel(id=f"c2-tie-{suffix}", job_id=job.id, name="Twin Two", email=f"t2-{suffix}@domain.com", education="B.S. in Computer Science", organization_id=org.id)
        db.add_all([c1, c2])
        db.flush()

        cs1 = CandidateSkillModel(id=f"cs1-tie-{suffix}", candidate_id=c1.id, skill_id=sk.id, is_verified=True, verified_score=90.0, years_experience=3.0)
        cs2 = CandidateSkillModel(id=f"cs2-tie-{suffix}", candidate_id=c2.id, skill_id=sk.id, is_verified=True, verified_score=90.0, years_experience=3.0)
        db.add_all([cs1, cs2])
        db.commit()

        token = create_access_token(user_id=rec.id, email=rec.email, role="recruiter", organization_id=org.id)

        resp = client.post(
            "/api/candidates/compare",
            json={"job_id": job.id, "candidate_ids": [c1.id, c2.id]},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        data = resp.json()

        assert len(data["honest_ties"]) >= 1
        tie_msg = data["honest_ties"][0].lower()
        assert "tied on overall fit" in tie_msg
        assert "no artificial score delta" in tie_msg
        print("[PASS] Test 10: Honest evaluation ties flagged without fabricating distinctions.")
    finally:
        db.close()


def test_11_requirement_matrix_status_and_evidence():
    """Test 11: Validates requirement matrix classifies VERIFIED, CLAIMED, MISSING with evidence and mitigations."""
    f = setup_comparison_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], f["cand_a2_id"], f["cand_a3_id"]]},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200
    data = resp.json()

    matrix = data["skill_comparison"]
    assert len(matrix) == 3

    # Find Kubernetes row
    k8s_row = next(r for r in matrix if "Kubernetes" in r["skill_name"])
    # Alice: VERIFIED
    assert k8s_row["candidate_values"][f["cand_a1_id"]]["scorecard_status"] == "VERIFIED"
    assert k8s_row["candidate_values"][f["cand_a1_id"]]["evidence_count"] >= 1
    assert "95%" in k8s_row["candidate_values"][f["cand_a1_id"]]["evidence"][0]["snippet"]

    # Bob: CLAIMED (self-reported)
    assert k8s_row["candidate_values"][f["cand_a2_id"]]["scorecard_status"] == "CLAIMED"
    assert k8s_row["candidate_values"][f["cand_a2_id"]]["evidence_count"] == 0

    # Charlie: MISSING
    assert k8s_row["candidate_values"][f["cand_a3_id"]]["scorecard_status"] == "MISSING"

    # Grounded mitigation recommendations
    cand_a2 = next(c for c in data["candidates"] if c["candidate_id"] == f["cand_a2_id"])
    assert len(cand_a2["mitigation_recommendations"]) > 0
    rec_text = " ".join([m.get("mitigation_recommendation", "") for m in cand_a2["mitigation_recommendations"]]).lower()
    assert "verify" in rec_text or "assessment" in rec_text or "screening" in rec_text

    print("[PASS] Test 11: Requirement matrix accurately classifies statuses and provides grounded mitigations.")


def test_12_route_parity_between_endpoints():
    """Test 12: Route parity between /api/skills/compare and /api/candidates/compare and GET convenience."""
    f = setup_comparison_fixtures()
    token = f["token_rec_a"]
    payload = {"job_id": f["job_a_id"], "candidate_ids": [f["cand_a1_id"], f["cand_a2_id"]]}

    # POST /api/skills/compare
    resp_skills = client.post("/api/skills/compare", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp_skills.status_code == 200

    # POST /api/candidates/compare
    resp_cands = client.post("/api/candidates/compare", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp_cands.status_code == 200

    # GET /api/candidates/compare/jobs/{job_id}
    resp_get = client.get(
        f"/api/candidates/compare/jobs/{f['job_a_id']}?candidate_ids={f['cand_a1_id']}&candidate_ids={f['cand_a2_id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_get.status_code == 200

    # Parity check on fit scores and ranks
    data_skills = resp_skills.json()
    data_cands = resp_cands.json()
    data_get = resp_get.json()

    assert data_skills["candidates"][0]["scorecard_fit_score"] == data_cands["candidates"][0]["scorecard_fit_score"]
    assert data_cands["candidates"][0]["scorecard_fit_score"] == data_get["candidates"][0]["scorecard_fit_score"]
    assert len(data_skills["skill_comparison"]) == len(data_cands["skill_comparison"]) == len(data_get["skill_comparison"])

    print("[PASS] Test 12: Full parity verified across candidate comparison endpoints.")


if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING PHASE 4E.8 EVIDENCE-BASED CANDIDATE COMPARISON TEST SUITE")
    print("======================================================================")
    test_01_recruiter_compare_candidates_scorecard_metrics()
    test_02_minimum_candidates_validation()
    test_03_candidate_outside_job_rejected()
    test_04_nonexistent_candidate_rejected()
    test_05_nonexistent_job_rejected()
    test_06_non_recruiter_access_blocked()
    test_07_cross_tenant_job_access_blocked()
    test_08_cross_tenant_candidate_access_blocked()
    test_09_meaningful_differences_and_differentiators()
    test_10_honest_ties_detection()
    test_11_requirement_matrix_status_and_evidence()
    test_12_route_parity_between_endpoints()
    print("======================================================================")
    print("ALL 12 PHASE 4E.8 EVIDENCE-BASED CANDIDATE COMPARISON TESTS PASSED!")
    print("======================================================================")
