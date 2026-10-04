"""
═══════════════════════════════════════════════════════════════════════════════
SPARKX PHASE 4B.1 AUTOMATED VERIFICATION SUITE
Product Integrity, Zero Fake Data & Tenancy Architecture Remediation
═══════════════════════════════════════════════════════════════════════════════
"""
import sys
import os
import uuid
from datetime import datetime, timedelta

# Ensure backend directory is in python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from main import app
from database import SessionLocal, engine, Base
from models.db_models import (
    UserModel, JobModel, CandidateModel, AssessmentModel,
    CodingProblemModel, OrganizationModel, RevokedTokenModel
)
from controllers.auth_controller import create_access_token, hash_password
from services.organization_service import (
    ensure_organization, get_organization_details, update_organization
)

client = TestClient(app)

PASSED_COUNT = 0
FAILED_COUNT = 0

def record(test_id: str, desc: str, passed: bool, detail: str = ""):
    global PASSED_COUNT, FAILED_COUNT
    status_str = "[PASS]" if passed else "[FAIL]"
    print(f" {status_str} {test_id}: {desc}")
    if not passed and detail:
        print(f"        Error: {detail}")
    if passed:
        PASSED_COUNT += 1
    else:
        FAILED_COUNT += 1

def run_all_tests():
    global PASSED_COUNT, FAILED_COUNT
    print("\n" + "=" * 78)
    print(" SPARKX PHASE 4B.1: PRODUCT INTEGRITY & TENANCY VERIFICATION SUITE")
    print("=" * 78 + "\n")

    db: Session = SessionLocal()
    unique_suffix = uuid.uuid4().hex[:6]
    org_alpha_id = f"org-alpha-{unique_suffix}"
    org_beta_id = f"org-beta-{unique_suffix}"

    try:
        # ── Setup Organizations ──
        org_alpha = ensure_organization(db, org_alpha_id, name="Alpha Corp Remediation", slug=f"alpha-corp-{unique_suffix}")
        org_beta = ensure_organization(db, org_beta_id, name="Beta Corp Remediation", slug=f"beta-corp-{unique_suffix}")

        # ── Setup Recruiters & Candidates ──
        recruiter_a = UserModel(
            id=f"usr-rec-a-{unique_suffix}",
            name="Recruiter Alpha",
            email=f"recruiter.alpha.{unique_suffix}@alpha.com",
            password_hash=hash_password("Password123!"),
            role="recruiter",
            organization_id=org_alpha_id
        )
        recruiter_b = UserModel(
            id=f"usr-rec-b-{unique_suffix}",
            name="Recruiter Beta",
            email=f"recruiter.beta.{unique_suffix}@beta.com",
            password_hash=hash_password("Password123!"),
            role="recruiter",
            organization_id=org_beta_id
        )
        candidate_a = UserModel(
            id=f"usr-cand-a-{unique_suffix}",
            name="Candidate Alice",
            email=f"alice.{unique_suffix}@candidate.com",
            password_hash=hash_password("Password123!"),
            role="candidate",
            organization_id="org-sparkx-default"
        )
        candidate_b = UserModel(
            id=f"usr-cand-b-{unique_suffix}",
            name="Candidate Bob",
            email=f"bob.{unique_suffix}@candidate.com",
            password_hash=hash_password("Password123!"),
            role="candidate",
            organization_id="org-sparkx-default"
        )
        db.add_all([recruiter_a, recruiter_b, candidate_a, candidate_b])
        db.commit()

        # ── Setup Jobs ──
        job_a = JobModel(
            id=f"job-a-{unique_suffix}",
            title="Senior Backend Engineer Alpha",
            organization_id=org_alpha_id,
            department="Engineering",
            location="Remote",
            min_experience_years=3,
            education="Bachelor's",
            description="Developing scalable cloud services at Alpha Corp.",
            required_skills=["Python", "FastAPI", "PostgreSQL"],
            status="Active"
        )
        job_b = JobModel(
            id=f"job-b-{unique_suffix}",
            title="Senior Frontend Engineer Beta",
            organization_id=org_beta_id,
            department="Product",
            location="New York",
            min_experience_years=4,
            education="Bachelor's",
            description="Developing client web applications at Beta Corp.",
            required_skills=["React", "TypeScript", "Tailwind"],
            status="Active"
        )
        db.add_all([job_a, job_b])
        db.commit()

        token_rec_a = create_access_token(recruiter_a.id, recruiter_a.email, "recruiter", org_alpha_id)
        token_rec_b = create_access_token(recruiter_b.id, recruiter_b.email, "recruiter", org_beta_id)
        token_cand_a = create_access_token(candidate_a.id, candidate_a.email, "candidate", "org-sparkx-default")
        token_cand_b = create_access_token(candidate_b.id, candidate_b.email, "candidate", "org-sparkx-default")

        headers_a = {"Authorization": f"Bearer {token_rec_a}"}
        headers_b = {"Authorization": f"Bearer {token_rec_b}"}
        headers_cand_a = {"Authorization": f"Bearer {token_cand_a}"}
        headers_cand_b = {"Authorization": f"Bearer {token_cand_b}"}

        # ═════════════════════════════════════════════════════════════════════
        # 1. SCORE INTEGRITY TESTS (NULL & ZERO PRESERVATION)
        # ═════════════════════════════════════════════════════════════════════

        # Candidate with purely un-evaluated metrics (all null/None)
        cand_null = CandidateModel(
            id=f"cand-null-{unique_suffix}",
            user_id=candidate_a.id,
            job_id=job_a.id,
            organization_id=org_alpha_id,
            name="Unevaluated Candidate",
            email=f"unevaluated.{unique_suffix}@test.com",
            education="B.S. CS",
            status="applied",
            stage="applied",
            match_score=0,          # uncalculated/null-equivalent baseline
            coding_score=None,      # not taken
            recruiter_score=None,   # not scored
            interview_status="not_scheduled",
            scores={}
        )
        # Candidate with legitimate score 0 (taken, but scored exact zero)
        cand_zero = CandidateModel(
            id=f"cand-zero-{unique_suffix}",
            user_id=candidate_b.id,
            job_id=job_a.id,
            organization_id=org_alpha_id,
            name="Zero Score Candidate",
            email=f"zero.{unique_suffix}@test.com",
            education="B.S. CS",
            status="assessment",
            stage="assessment",
            match_score=0,
            coding_score=0,         # scored 0%
            recruiter_score=0,      # scored 0
            interview_status="completed",
            scores={"overall": 0, "technicalScore": 0, "scenarioScore": 0}
        )
        db.add_all([cand_null, cand_zero])
        db.commit()

        # Test PI-01: Null candidate does not fabricate 75 or 85 in API response
        res_null = client.get(f"/api/candidates/{cand_null.id}", headers=headers_a)
        assert res_null.status_code == 200, f"Expected 200, got {res_null.status_code}"
        data_null = res_null.json()
        assert data_null.get("coding_score") is None or data_null.get("coding_score") == 0, "Fabricated coding score detected!"
        assert data_null.get("recruiter_score") is None, "Fabricated recruiter score detected!"
        record("PI-01", "Unevaluated candidate preserves null/absent assessment and interview scores", True)

        # Test PI-02: Legitimate zero scores are preserved without fallback substitution
        res_zero = client.get(f"/api/candidates/{cand_zero.id}", headers=headers_a)
        assert res_zero.status_code == 200, f"Expected 200, got {res_zero.status_code}"
        data_zero = res_zero.json()
        assert data_zero.get("coding_score") == 0, f"Expected coding_score 0, got {data_zero.get('coding_score')}"
        assert data_zero.get("recruiter_score") == 0, f"Expected recruiter_score 0, got {data_zero.get('recruiter_score')}"
        assert data_zero.get("match_score") == 0, f"Expected match_score 0, got {data_zero.get('match_score')}"
        record("PI-02", "Genuine zero scores (0%) are preserved without artificial fallback floors", True)

        # ═════════════════════════════════════════════════════════════════════
        # 2. TENANCY MODEL & RECONCILIATION VERIFICATION
        # ═════════════════════════════════════════════════════════════════════

        # Test TM-01: OrganizationModel exists, persists, and relationships resolve
        org_alpha_db = db.query(OrganizationModel).filter(OrganizationModel.id == org_alpha_id).first()
        assert org_alpha_db is not None, "OrganizationModel record not found!"
        assert org_alpha_db.name == "Alpha Corp Remediation"
        assert len(org_alpha_db.jobs) >= 1, "Organization -> Jobs relationship failed!"
        assert len(org_alpha_db.users) >= 1, "Organization -> Users relationship failed!"
        assert len(org_alpha_db.candidates) >= 2, "Organization -> Candidates relationship failed!"
        record("TM-01", "OrganizationModel table, records, and relationships verified", True)

        # Test TM-02: Organization service details and live metric aggregation
        org_details = get_organization_details(db, org_alpha_id)
        assert org_details is not None
        assert org_details["id"] == org_alpha_id
        assert org_details["job_count"] >= 1
        assert org_details["candidate_count"] >= 2
        record("TM-02", "Organization live telemetry and metrics service verified", True)

        # Test TM-03: Recruiter retrieves current organization via GET /api/organizations/current
        res_org_curr = client.get("/api/organizations/current", headers=headers_a)
        assert res_org_curr.status_code == 200, f"Expected 200, got {res_org_curr.status_code}"
        data_org_curr = res_org_curr.json()
        assert data_org_curr["id"] == org_alpha_id
        assert data_org_curr["name"] == "Alpha Corp Remediation"
        record("TM-03", "Recruiter retrieves authoritative organization via API", True)

        # Test TM-04: Recruiter updates current organization via PUT /api/organizations/current
        res_org_update = client.put(
            "/api/organizations/current",
            json={"name": "Alpha Corp Global Inc.", "domain": "alphacorp.com"},
            headers=headers_a
        )
        assert res_org_update.status_code == 200, f"Expected 200, got {res_org_update.status_code}"
        assert res_org_update.json()["name"] == "Alpha Corp Global Inc."
        assert res_org_update.json()["domain"] == "alphacorp.com"
        record("TM-04", "Recruiter updates organization metadata authoritatively", True)

        # ═════════════════════════════════════════════════════════════════════
        # 3. TENANCY ISOLATION & AUTHORIZATION BOUNDARIES
        # ═════════════════════════════════════════════════════════════════════

        # Test TI-01: Recruiter A cannot view or update Recruiter B's organization
        res_cross_org = client.get(f"/api/organizations/{org_beta_id}", headers=headers_a)
        assert res_cross_org.status_code == 403, f"Expected 403 Forbidden, got {res_cross_org.status_code}"
        record("TI-01", "Cross-tenant organization profile lookup strictly blocked (403)", True)

        # Test TI-02: Recruiter A cannot access Job B in Org Beta
        res_cross_job = client.get(f"/api/jobs/{job_b.id}", headers=headers_a)
        assert res_cross_job.status_code == 403, f"Expected 403 Forbidden, got {res_cross_job.status_code}"
        record("TI-02", "Cross-tenant job access strictly blocked (403)", True)

        # Test TI-03: Recruiter A cannot access Candidate in Org Beta
        cand_in_b = CandidateModel(
            id=f"cand-b-{unique_suffix}",
            user_id=candidate_b.id,
            job_id=job_b.id,
            organization_id=org_beta_id,
            name="Beta Candidate",
            email=f"cand.beta.{unique_suffix}@test.com",
            education="M.S. EE",
            status="screening"
        )
        db.add(cand_in_b)
        db.commit()

        res_cross_cand = client.get(f"/api/candidates/{cand_in_b.id}", headers=headers_a)
        assert res_cross_cand.status_code == 403, f"Expected 403 Forbidden, got {res_cross_cand.status_code}"
        record("TI-03", "Cross-tenant candidate dossier access strictly blocked (403)", True)

        # Test TI-04: Recruiter A listing candidates only receives Org Alpha candidates
        res_cands_list = client.get("/api/candidates", headers=headers_a)
        assert res_cands_list.status_code == 200
        for c in res_cands_list.json():
            assert c.get("organization_id") == org_alpha_id, f"Candidate {c.get('id')} leaked across tenants!"
        record("TI-04", "Candidate pipeline list strictly tenant-scoped to recruiter's organization", True)

        # Test TI-05: Recruiter A creating coding problem is automatically bound to Org Alpha
        res_create_prob = client.post(
            "/api/assessment/problems",
            json={
                "title": f"Custom Tenant Problem {unique_suffix}",
                "problem_statement": "Implement tenant isolated solver.",
                "difficulty": "Easy",
                "execution_mode": "function",
                "function_name": "solve",
                "function_signature": {"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"},
                "test_cases": [{"input_data": "5", "expected_output": "5", "is_hidden": False}]
            },
            headers=headers_a
        )
        assert res_create_prob.status_code == 201, f"Expected 201 Created, got {res_create_prob.status_code}"
        prob_data = res_create_prob.json()
        assert prob_data["organization_id"] == org_alpha_id, "Coding problem not bound to recruiter organization!"
        record("TI-05", "Authoring coding problem authoritatively inherits recruiter tenant ID", True)

        # Test TI-06: Recruiter B cannot view or modify Recruiter A's custom coding problem
        res_cross_prob = client.get(f"/api/assessment/problems/{prob_data['id']}", headers=headers_b)
        assert res_cross_prob.status_code == 403, f"Expected 403 Forbidden, got {res_cross_prob.status_code}"
        record("TI-06", "Cross-tenant custom coding problem access strictly blocked (403)", True)

        # Test TI-07: Candidate A cannot access Candidate B's application or state logs
        res_cand_priv = client.get(f"/api/candidates/{cand_zero.id}/audit-logs", headers=headers_cand_a)
        assert res_cand_priv.status_code in [401, 403], f"Expected 401/403, got {res_cand_priv.status_code}"
        record("TI-07", "Candidate cannot access private state logs of other applicants", True)

        # Test TI-08: Organization ownership survives database reload and transactions
        db.expire_all()
        reloaded_job = db.query(JobModel).filter(JobModel.id == job_a.id).first()
        assert reloaded_job.organization_id == org_alpha_id
        assert reloaded_job.organization.name == "Alpha Corp Global Inc."
        record("TI-08", "Organization ownership and relationships survive database reload", True)

    except Exception as e:
        record("ERR", "Exception during test execution", False, str(e))
    finally:
        db.close()

    print("\n" + "=" * 78)
    print(f" PHASE 4B.1 VERIFICATION RESULTS: {PASSED_COUNT} PASSED, {FAILED_COUNT} FAILED")
    print("=" * 78 + "\n")
    return FAILED_COUNT == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
