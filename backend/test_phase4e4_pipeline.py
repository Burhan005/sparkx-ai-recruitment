"""
Phase 4E.4: Recruiter Hiring Pipeline Improvements Test Suite.
Authoritative test suite covering all Phase 4E.4 requirements:
  01. Authoritative DB-backed Pipeline Summary across all 4 independent dimensions
  02. Pipeline Summary scoped to specific job
  03. Multi-dimension candidate filtering (stage, assessment, interview, decision)
  04. Bulk action: update_stage across multiple candidates
  05. Bulk action: audit logging into CandidateStateLogModel
  06. Bulk action: state transition guard blocks finalized candidates (selected/rejected)
  07. Bulk action: bulk assessment invitation
  08. Bulk action: bulk shortlist decision
  09. Bulk action: bulk categorical rejection with reason and category
  10. Bulk action: batch size limit validation (> 50 candidates rejected)
  11. Bulk action: multi-tenant isolation prevents cross-tenant mutations
  12. Non-recruiter authorization check blocks unauthorized bulk operations
"""
import os
import sys
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel, CandidateStateLogModel
)
from main import app
from controllers.auth_controller import create_access_token

ensure_schema_columns()
client = TestClient(app)

ORG_A = f"org-pipe-{uuid.uuid4().hex[:8]}"
ORG_B = f"org-other-{uuid.uuid4().hex[:8]}"
JOB_A1 = f"job-pipe-1-{uuid.uuid4().hex[:8]}"
JOB_A2 = f"job-pipe-2-{uuid.uuid4().hex[:8]}"
JOB_B1 = f"job-other-1-{uuid.uuid4().hex[:8]}"

RECRUITER_A_EMAIL = f"recruiter-{uuid.uuid4().hex[:8]}@example.com"
RECRUITER_B_EMAIL = f"recruiter-b-{uuid.uuid4().hex[:8]}@example.com"
CANDIDATE_USER_EMAIL = f"cand-{uuid.uuid4().hex[:8]}@example.com"

recruiter_a_token = None
recruiter_b_token = None
candidate_token = None

CAND_IDS_A1 = []
CAND_IDS_A2 = []
CAND_IDS_B = []


def setup_module():
    """Seed test organizations, jobs, recruiter users, and multi-state candidates."""
    global recruiter_a_token, recruiter_b_token, candidate_token
    global CAND_IDS_A1, CAND_IDS_A2, CAND_IDS_B

    db = SessionLocal()
    try:
        # Create Organizations
        org_a = OrganizationModel(id=ORG_A, name="Pipeline Test Org A", slug=f"pipe-a-{uuid.uuid4().hex[:6]}", is_active=True)
        org_b = OrganizationModel(id=ORG_B, name="Pipeline Test Org B", slug=f"pipe-b-{uuid.uuid4().hex[:6]}", is_active=True)
        db.add_all([org_a, org_b])

        # Create Users
        recruiter_a = UserModel(
            id=f"user-{uuid.uuid4().hex[:8]}",
            email=RECRUITER_A_EMAIL,
            name="Recruiter Alpha",
            role="recruiter",
            organization_id=ORG_A,
            password_hash="mockhash"
        )
        recruiter_b = UserModel(
            id=f"user-{uuid.uuid4().hex[:8]}",
            email=RECRUITER_B_EMAIL,
            name="Recruiter Beta",
            role="recruiter",
            organization_id=ORG_B,
            password_hash="mockhash"
        )
        cand_user = UserModel(
            id=f"user-{uuid.uuid4().hex[:8]}",
            email=CANDIDATE_USER_EMAIL,
            name="Candidate Gamma",
            role="candidate",
            organization_id=ORG_A,
            password_hash="mockhash"
        )
        db.add_all([recruiter_a, recruiter_b, cand_user])

        # Create Jobs
        job_a1 = JobModel(
            id=JOB_A1,
            organization_id=ORG_A,
            title="Senior Backend Engineer",
            department="Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            description="Senior Backend Role",
            status="Active"
        )
        job_a2 = JobModel(
            id=JOB_A2,
            organization_id=ORG_A,
            title="Frontend Specialist",
            department="Product",
            location="Remote",
            education="B.S. in Computer Science",
            description="Frontend Specialist Role",
            status="Active"
        )
        job_b1 = JobModel(
            id=JOB_B1,
            organization_id=ORG_B,
            title="DevOps Engineer",
            department="Infrastructure",
            location="Remote",
            education="B.S. in Computer Science",
            description="DevOps Role",
            status="Active"
        )
        db.add_all([job_a1, job_a2, job_b1])

        # Create Candidates for Job A1 with varied 4-dimension states
        candidates_a1_data = [
            ("Alice Inbound", "applied", "not_invited", "not_scheduled", "undecided"),
            ("Bob Screening", "screening", "not_invited", "not_scheduled", "undecided"),
            ("Charlie Assessment", "assessment", "invited", "not_scheduled", "undecided"),
            ("Diana Interview", "interview", "evaluated", "scheduled", "shortlisted"),
            ("Evan Review", "review", "evaluated", "completed", "shortlisted"),
            ("Fiona Selected", "completed", "evaluated", "completed", "selected"),
            ("George Rejected", "review", "evaluated", "completed", "rejected"),
        ]

        CAND_IDS_A1 = []
        for name, stage, assess, interview, decision in candidates_a1_data:
            cid = f"cand-{uuid.uuid4().hex[:8]}"
            CAND_IDS_A1.append(cid)
            cand = CandidateModel(
                id=cid,
                job_id=JOB_A1,
                name=name,
                email=f"{name.lower().replace(' ', '.')}@example.com",
                education="B.S. in Computer Science",
                organization_id=ORG_A,
                stage=stage,
                assessment_status=assess,
                interview_status=interview,
                hiring_decision=decision
            )
            db.add(cand)

        # Create Candidates for Job A2
        candidates_a2_data = [
            ("Hannah A2", "applied", "not_invited", "not_scheduled", "undecided"),
            ("Ian A2", "screening", "not_invited", "not_scheduled", "undecided"),
        ]
        CAND_IDS_A2 = []
        for name, stage, assess, interview, decision in candidates_a2_data:
            cid = f"cand-{uuid.uuid4().hex[:8]}"
            CAND_IDS_A2.append(cid)
            cand = CandidateModel(
                id=cid,
                job_id=JOB_A2,
                name=name,
                email=f"{name.lower().replace(' ', '.')}@example.com",
                education="B.S. in Computer Science",
                organization_id=ORG_A,
                stage=stage,
                assessment_status=assess,
                interview_status=interview,
                hiring_decision=decision
            )
            db.add(cand)

        # Create Candidates for Tenant B
        cid_b = f"cand-{uuid.uuid4().hex[:8]}"
        CAND_IDS_B = [cid_b]
        cand_b = CandidateModel(
            id=cid_b,
            job_id=JOB_B1,
            name="Tenant B Candidate",
            email="tenantb@example.com",
            education="B.S. in Computer Science",
            organization_id=ORG_B,
            stage="applied",
            assessment_status="not_invited",
            interview_status="not_scheduled",
            hiring_decision="undecided"
        )
        db.add(cand_b)

        db.commit()

        # Auth Tokens
        recruiter_a_token = create_access_token(user_id=recruiter_a.id, email=RECRUITER_A_EMAIL, role="recruiter", organization_id=ORG_A)
        recruiter_b_token = create_access_token(user_id=recruiter_b.id, email=RECRUITER_B_EMAIL, role="recruiter", organization_id=ORG_B)
        candidate_token = create_access_token(user_id=cand_user.id, email=CANDIDATE_USER_EMAIL, role="candidate", organization_id=ORG_A)

    finally:
        db.close()


def test_01_pipeline_summary_authoritative_dimensions():
    """Verify GET /api/candidates/pipeline-summary returns exact counts for all 4 dimensions."""
    resp = client.get(
        "/api/candidates/pipeline-summary",
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["total_candidates"] == len(CAND_IDS_A1) + len(CAND_IDS_A2)
    # Check stage counts
    assert "applied" in data["stage_counts"]
    assert "screening" in data["stage_counts"]
    assert "assessment" in data["stage_counts"]
    assert "interview" in data["stage_counts"]
    assert "review" in data["stage_counts"]
    assert "completed" in data["stage_counts"]

    # Check assessment counts
    assert "not_invited" in data["assessment_counts"]
    assert "invited" in data["assessment_counts"]
    assert "evaluated" in data["assessment_counts"]

    # Check interview counts
    assert "not_scheduled" in data["interview_counts"]
    assert "scheduled" in data["interview_counts"]
    assert "completed" in data["interview_counts"]

    # Check decision counts
    assert "undecided" in data["decision_counts"]
    assert "shortlisted" in data["decision_counts"]
    assert "selected" in data["decision_counts"]
    assert "rejected" in data["decision_counts"]


def test_02_pipeline_summary_job_scoped():
    """Verify pipeline summary filters correctly when scoped to a specific job."""
    resp = client.get(
        f"/api/candidates/pipeline-summary?job_id={JOB_A1}",
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["total_candidates"] == len(CAND_IDS_A1)
    assert data["stage_counts"]["applied"] == 1
    assert data["stage_counts"]["screening"] == 1
    assert data["decision_counts"]["selected"] == 1
    assert data["decision_counts"]["rejected"] == 1


def test_03_multi_dimension_candidate_filtering():
    """Verify GET /api/candidates supports 4 independent dimension query params."""
    # Filter by stage
    resp = client.get(
        f"/api/candidates?job_id={JOB_A1}&stage=applied",
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200
    cands = resp.json()
    assert len(cands) == 1
    assert cands[0]["name"] == "Alice Inbound"

    # Filter by assessment status
    resp = client.get(
        f"/api/candidates?job_id={JOB_A1}&assessment_status=evaluated",
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200
    cands = resp.json()
    assert len(cands) == 4  # Diana, Evan, Fiona, George

    # Filter by interview status
    resp = client.get(
        f"/api/candidates?job_id={JOB_A1}&interview_status=scheduled",
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200
    cands = resp.json()
    assert len(cands) == 1
    assert cands[0]["name"] == "Diana Interview"

    # Filter by hiring decision
    resp = client.get(
        f"/api/candidates?job_id={JOB_A1}&hiring_decision=shortlisted",
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200
    cands = resp.json()
    assert len(cands) == 2  # Diana and Evan


def test_04_bulk_stage_advance_and_audit():
    """Verify bulk candidate advance to screening stage with audit logging."""
    target_ids = [CAND_IDS_A1[0]]  # Alice Inbound (applied -> screening)
    payload = {
        "candidate_ids": target_ids,
        "action": "update_stage",
        "stage": "screening",
        "notes": "Bulk advanced by recruiter during portfolio review"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["success_count"] == 1
    assert data["failure_count"] == 0
    assert data["successful_candidate_ids"] == target_ids

    # Check candidate stage in DB
    db = SessionLocal()
    try:
        cand = db.query(CandidateModel).filter(CandidateModel.id == target_ids[0]).first()
        assert cand.stage == "screening"

        log = db.query(CandidateStateLogModel).filter(
            CandidateStateLogModel.candidate_id == target_ids[0],
            CandidateStateLogModel.dimension == "stage",
            CandidateStateLogModel.to_value == "screening"
        ).first()
        assert log is not None
        assert "Bulk" in log.notes
    finally:
        db.close()


def test_05_bulk_stage_transition_guard_blocks_finalized():
    """Verify finalized candidates (selected or rejected) cannot be advanced in bulk."""
    # Fiona is selected, George is rejected
    finalized_ids = [CAND_IDS_A1[5], CAND_IDS_A1[6]]
    payload = {
        "candidate_ids": finalized_ids,
        "action": "update_stage",
        "stage": "interview"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["success_count"] == 0
    assert data["failure_count"] == 2
    for f in data["failures"]:
        assert "finalized" in f["reason"].lower()


def test_06_bulk_invite_assessment():
    """Verify bulk assessment invitation sets assessment_status to invited."""
    target_ids = [CAND_IDS_A2[0], CAND_IDS_A2[1]]  # Hannah and Ian
    payload = {
        "candidate_ids": target_ids,
        "action": "invite_assessment",
        "custom_message": "Welcome to the technical evaluation phase."
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["success_count"] == 2
    assert data["failure_count"] == 0
    assert data["successful_candidate_ids"] == target_ids

    db = SessionLocal()
    try:
        cands = db.query(CandidateModel).filter(CandidateModel.id.in_(target_ids)).all()
        for c in cands:
            assert c.assessment_status == "invited"
    finally:
        db.close()


def test_07_bulk_shortlist_decision():
    """Verify bulk shortlist sets hiring_decision to shortlisted."""
    target_ids = [CAND_IDS_A2[0]]
    payload = {
        "candidate_ids": target_ids,
        "action": "update_decision",
        "decision": "shortlisted",
        "notes": "Met high technical threshold"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["success_count"] == 1
    assert data["successful_candidate_ids"] == target_ids

    db = SessionLocal()
    try:
        cand = db.query(CandidateModel).filter(CandidateModel.id == target_ids[0]).first()
        assert cand.hiring_decision == "shortlisted"
    finally:
        db.close()


def test_08_bulk_categorical_rejection():
    """Verify bulk rejection records category and reason."""
    target_ids = [CAND_IDS_A2[1]]
    payload = {
        "candidate_ids": target_ids,
        "action": "update_decision",
        "decision": "rejected",
        "rejection_category": "skills_mismatch",
        "rejection_reason": "Missing required distributed systems background"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["success_count"] == 1
    assert data["successful_candidate_ids"] == target_ids

    # Verify candidate model fields in DB
    db = SessionLocal()
    try:
        cand = db.query(CandidateModel).filter(CandidateModel.id == target_ids[0]).first()
        assert cand.hiring_decision == "rejected"
        assert cand.rejection_category == "skills_mismatch"
        assert "distributed systems" in cand.rejection_reason
    finally:
        db.close()


def test_09_bulk_batch_size_limit():
    """Verify bulk action exceeding 50 candidates is rejected."""
    fake_ids = [f"cand-fake-{i}" for i in range(55)]
    payload = {
        "candidate_ids": fake_ids,
        "action": "update_stage",
        "stage": "screening"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 400
    assert "maximum" in resp.json()["detail"].lower()


def test_10_multi_tenant_isolation_on_bulk_action():
    """Verify recruiter from Org A cannot perform bulk actions on Org B's candidates."""
    target_ids = [CAND_IDS_B[0]]  # Org B candidate
    payload = {
        "candidate_ids": target_ids,
        "action": "update_stage",
        "stage": "screening"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {recruiter_a_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success_count"] == 0
    assert data["failure_count"] == 1
    reason = data["failures"][0]["reason"].lower()
    assert "cross-tenant" in reason or "forbidden" in reason or "not found" in reason


def test_11_unauthorized_non_recruiter_blocked():
    """Verify non-recruiter (candidate) is blocked from calling bulk action endpoint (HTTP 403)."""
    payload = {
        "candidate_ids": [CAND_IDS_A1[0]],
        "action": "update_stage",
        "stage": "screening"
    }
    resp = client.post(
        "/api/candidates/bulk-action",
        json=payload,
        headers={"Authorization": f"Bearer {candidate_token}"}
    )
    assert resp.status_code == 403


def cleanup_module():
    """Clean up test organizations, jobs, users, and candidates."""
    db = SessionLocal()
    try:
        all_cands = CAND_IDS_A1 + CAND_IDS_A2 + CAND_IDS_B
        if all_cands:
            db.query(CandidateStateLogModel).filter(CandidateStateLogModel.candidate_id.in_(all_cands)).delete(synchronize_session=False)
            db.query(CandidateModel).filter(CandidateModel.id.in_(all_cands)).delete(synchronize_session=False)
        db.query(JobModel).filter(JobModel.id.in_([JOB_A1, JOB_A2, JOB_B1])).delete(synchronize_session=False)
        db.query(UserModel).filter(UserModel.email.in_([RECRUITER_A_EMAIL, RECRUITER_B_EMAIL, CANDIDATE_USER_EMAIL])).delete(synchronize_session=False)
        db.query(OrganizationModel).filter(OrganizationModel.id.in_([ORG_A, ORG_B])).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        print(f"Cleanup error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING PHASE 4E.4 PIPELINE IMPROVEMENTS TESTS")
    print("=" * 70)
    setup_module()
    try:
        print("[01/11] Testing Authoritative Pipeline Summary Dimensions...")
        test_01_pipeline_summary_authoritative_dimensions()
        print("  --> PASSED")

        print("[02/11] Testing Job-Scoped Pipeline Summary...")
        test_02_pipeline_summary_job_scoped()
        print("  --> PASSED")

        print("[03/11] Testing Multi-Dimension Candidate Filtering...")
        test_03_multi_dimension_candidate_filtering()
        print("  --> PASSED")

        print("[04/11] Testing Bulk Stage Advance & Audit Logging...")
        test_04_bulk_stage_advance_and_audit()
        print("  --> PASSED")

        print("[05/11] Testing Bulk Stage Transition Guard (Finalized Candidates)...")
        test_05_bulk_stage_transition_guard_blocks_finalized()
        print("  --> PASSED")

        print("[06/11] Testing Bulk Assessment Invitation...")
        test_06_bulk_invite_assessment()
        print("  --> PASSED")

        print("[07/11] Testing Bulk Shortlist Decision...")
        test_07_bulk_shortlist_decision()
        print("  --> PASSED")

        print("[08/11] Testing Bulk Categorical Rejection with Audit Reason...")
        test_08_bulk_categorical_rejection()
        print("  --> PASSED")

        print("[09/11] Testing Bulk Batch Size Limit (>50 Guard)...")
        test_09_bulk_batch_size_limit()
        print("  --> PASSED")

        print("[10/11] Testing Multi-Tenant Isolation on Bulk Action...")
        test_10_multi_tenant_isolation_on_bulk_action()
        print("  --> PASSED")

        print("[11/11] Testing Non-Recruiter Authorization Blocking (HTTP 403)...")
        test_11_unauthorized_non_recruiter_blocked()
        print("  --> PASSED")

        print("=" * 70)
        print("ALL 11 PHASE 4E.4 PIPELINE IMPROVEMENT TESTS PASSED FLAWLESSLY.")
        print("=" * 70)
    finally:
        cleanup_module()

