"""
SPARKX — PHASE 1 CRITICAL SECURITY REMEDIATION VERIFICATION SUITE
Comprehensive automated test suite covering:
1. Candidate BOLA / IDOR Verification
2. Recruiter Multi-Tenant Isolation Verification
3. Untrusted Code Execution Isolation Verification
4. Database Integrity & Duplicate Application Guard Verification
5. Workflow State Consistency & 4D State Transition Verification
6. Production Database Fallback Prevention Verification
7. Core Recruitment End-to-End Workflow Regression Verification
"""
import os
import sys
import uuid
import json
from datetime import datetime
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import get_db, SessionLocal
from models.db_models import UserModel, CandidateModel, JobModel
from controllers.auth_controller import hash_password, create_access_token
from services.sandbox_runner import SandboxRunner, LocalSubprocessSandbox
from schemas import CodeRunRequest

client = TestClient(app)

def setup_test_data():
    db = SessionLocal()
    try:
        # Create Org A and Org B Users
        # Recruiter A (Org A)
        recruiter_a = db.query(UserModel).filter(UserModel.email == "test_recruiter_a@org-a.com").first()
        if not recruiter_a:
            recruiter_a = UserModel(
                id=f"user-{uuid.uuid4().hex[:8]}",
                name="Recruiter Alpha",
                email="test_recruiter_a@org-a.com",
                password_hash=hash_password("Password123!"),
                role="recruiter",
                organization_id="org-alpha",
                created_at=datetime.utcnow()
            )
            db.add(recruiter_a)

        # Recruiter B (Org B)
        recruiter_b = db.query(UserModel).filter(UserModel.email == "test_recruiter_b@org-b.com").first()
        if not recruiter_b:
            recruiter_b = UserModel(
                id=f"user-{uuid.uuid4().hex[:8]}",
                name="Recruiter Beta",
                email="test_recruiter_b@org-b.com",
                password_hash=hash_password("Password123!"),
                role="recruiter",
                organization_id="org-beta",
                created_at=datetime.utcnow()
            )
            db.add(recruiter_b)

        # Candidate A
        candidate_user_a = db.query(UserModel).filter(UserModel.email == "test_cand_a@domain.com").first()
        if not candidate_user_a:
            candidate_user_a = UserModel(
                id=f"user-{uuid.uuid4().hex[:8]}",
                name="Candidate Alice",
                email="test_cand_a@domain.com",
                password_hash=hash_password("Password123!"),
                role="candidate",
                organization_id="org-sparkx-default",
                created_at=datetime.utcnow()
            )
            db.add(candidate_user_a)

        # Candidate B
        candidate_user_b = db.query(UserModel).filter(UserModel.email == "test_cand_b@domain.com").first()
        if not candidate_user_b:
            candidate_user_b = UserModel(
                id=f"user-{uuid.uuid4().hex[:8]}",
                name="Candidate Bob",
                email="test_cand_b@domain.com",
                password_hash=hash_password("Password123!"),
                role="candidate",
                organization_id="org-sparkx-default",
                created_at=datetime.utcnow()
            )
            db.add(candidate_user_b)

        db.commit()

        # Create Job A (in Org Alpha)
        job_a = db.query(JobModel).filter(JobModel.title == "Alpha Backend Engineer").first()
        if not job_a:
            job_a = JobModel(
                id=f"job-{uuid.uuid4().hex[:8]}",
                title="Alpha Backend Engineer",
                company_name="Alpha Corp",
                organization_id="org-alpha",
                department="Engineering",
                location="Remote",
                min_experience_years=3,
                education="Bachelor's in Computer Science",
                languages=["python"],
                required_skills=["Python", "FastAPI"],
                description="Engineering job at Alpha",
                status="Active"
            )
            db.add(job_a)

        # Create Job B (in Org Beta)
        job_b = db.query(JobModel).filter(JobModel.title == "Beta Frontend Engineer").first()
        if not job_b:
            job_b = JobModel(
                id=f"job-{uuid.uuid4().hex[:8]}",
                title="Beta Frontend Engineer",
                company_name="Beta Corp",
                organization_id="org-beta",
                department="Frontend",
                location="Remote",
                min_experience_years=2,
                education="Bachelor's in Computer Science",
                languages=["javascript"],
                required_skills=["JavaScript", "React"],
                description="Engineering job at Beta",
                status="Active"
            )
            db.add(job_b)

        db.commit()

        # Create Candidate Application A (Alice applied to Job A in Org Alpha)
        cand_a = db.query(CandidateModel).filter(CandidateModel.email == "test_cand_a@domain.com", CandidateModel.job_id == job_a.id).first()
        if not cand_a:
            cand_a = CandidateModel(
                id=f"cand-{uuid.uuid4().hex[:8]}",
                user_id=candidate_user_a.id,
                name="Candidate Alice",
                email="test_cand_a@domain.com",
                job_id=job_a.id,
                organization_id="org-alpha",
                stage="assessment",
                assessment_status="invited",
                interview_status="scheduled",
                interview_scheduled_at="2026-10-01T10:00:00Z",
                hiring_decision="undecided",
                skills=["Python", "FastAPI"],
                experience_years=3.0,
                education="BS CS"
            )
            db.add(cand_a)

        # Create Candidate Application B (Bob applied to Job B in Org Beta)
        cand_b = db.query(CandidateModel).filter(CandidateModel.email == "test_cand_b@domain.com", CandidateModel.job_id == job_b.id).first()
        if not cand_b:
            cand_b = CandidateModel(
                id=f"cand-{uuid.uuid4().hex[:8]}",
                user_id=candidate_user_b.id,
                name="Candidate Bob",
                email="test_cand_b@domain.com",
                job_id=job_b.id,
                organization_id="org-beta",
                stage="screening",
                assessment_status="not_invited",
                interview_status="not_scheduled",
                hiring_decision="undecided",
                skills=["JavaScript", "React"],
                experience_years=2.0,
                education="BS SE"
            )
            db.add(cand_b)

        db.commit()

        return {
            "recruiter_a_token": create_access_token(user_id=recruiter_a.id, email=recruiter_a.email, role="recruiter", organization_id="org-alpha"),
            "recruiter_b_token": create_access_token(user_id=recruiter_b.id, email=recruiter_b.email, role="recruiter", organization_id="org-beta"),
            "candidate_a_token": create_access_token(user_id=candidate_user_a.id, email=candidate_user_a.email, role="candidate", organization_id="org-sparkx-default"),
            "candidate_b_token": create_access_token(user_id=candidate_user_b.id, email=candidate_user_b.email, role="candidate", organization_id="org-sparkx-default"),
            "job_a_id": job_a.id,
            "job_b_id": job_b.id,
            "cand_a_id": cand_a.id,
            "cand_b_id": cand_b.id,
        }
    finally:
        db.close()


def test_1_candidate_bola_idor():
    """Verify Candidate A cannot access or tamper with Candidate B's resources."""
    data = setup_test_data()
    cand_a_headers = {"Authorization": f"Bearer {data['candidate_a_token']}"}
    cand_b_id = data["cand_b_id"]
    cand_a_id = data["cand_a_id"]

    # 1. Dossier Access
    res = client.get(f"/api/candidates/{cand_b_id}", headers=cand_a_headers)
    assert res.status_code == 403, f"Expected 403 for candidate accessing other candidate dossier, got {res.status_code}"

    # 2. Candidate accessing own dossier succeeds
    res_own = client.get(f"/api/candidates/{cand_a_id}", headers=cand_a_headers)
    assert res_own.status_code == 200, f"Expected 200 for own dossier, got {res_own.status_code}"

    # 3. Assessment Fetch
    res_assess = client.get(f"/api/assessment/{cand_b_id}", headers=cand_a_headers)
    assert res_assess.status_code == 403, f"Expected 403 for other candidate assessment fetch, got {res_assess.status_code}"

    # 4. Assessment Start
    res_start = client.post(f"/api/assessment/{cand_b_id}/start", headers=cand_a_headers)
    assert res_start.status_code == 403, f"Expected 403 for other candidate assessment start, got {res_start.status_code}"

    # 5. Assessment Submit
    res_submit = client.post(
        f"/api/assessment/{cand_b_id}/submit",
        json={"candidate_id": cand_b_id, "job_id": data["job_b_id"], "technical_answers": {}},
        headers=cand_a_headers
    )
    assert res_submit.status_code == 403, f"Expected 403 for other candidate assessment submit, got {res_submit.status_code}"

    # 6. Interview Questions
    res_iq = client.post(
        "/api/interview/candidate-questions",
        json={"job_id": data["job_b_id"], "candidate_id": cand_b_id, "job_role": "Engineer", "experience_level": "Mid", "skills": []},
        headers=cand_a_headers
    )
    assert res_iq.status_code == 403, f"Expected 403 for other candidate interview questions, got {res_iq.status_code}"

    # 7. Interview Start
    res_istart = client.post(
        "/api/interview/start",
        json={"candidate_id": cand_b_id},
        headers=cand_a_headers
    )
    assert res_istart.status_code == 403, f"Expected 403 for other candidate interview start, got {res_istart.status_code}"

    # 8. My applications with impersonated email parameter
    res_apps = client.get("/api/candidates/my-applications?email=test_cand_b@domain.com", headers=cand_a_headers)
    assert res_apps.status_code == 403, f"Expected 403 for impersonating another email in my-applications, got {res_apps.status_code}"

    print("[PASS] Test 1: Candidate BOLA/IDOR strictly blocked with 403 across all candidate endpoints.")


def test_2_recruiter_multi_tenant_isolation():
    """Verify Recruiter A (Org Alpha) cannot view or tamper with Org Beta resources."""
    data = setup_test_data()
    rec_a_headers = {"Authorization": f"Bearer {data['recruiter_a_token']}"}
    job_b_id = data["job_b_id"]
    cand_b_id = data["cand_b_id"]

    # 1. Job Access: Recruiter A attempting to access Job B (in Org Beta)
    res_job = client.get(f"/api/jobs/{job_b_id}", headers=rec_a_headers)
    assert res_job.status_code == 403, f"Expected 403 for cross-tenant job get, got {res_job.status_code}"

    # 2. Job Update: Recruiter A attempting to modify Job B
    res_update_job = client.put(f"/api/jobs/{job_b_id}", json={"department": "Hacked"}, headers=rec_a_headers)
    assert res_update_job.status_code == 403, f"Expected 403 for cross-tenant job update, got {res_update_job.status_code}"

    # 3. Job Status: Recruiter A attempting to change status of Job B
    res_status_job = client.post(f"/api/jobs/{job_b_id}/status", json={"status": "Closed"}, headers=rec_a_headers)
    assert res_status_job.status_code == 403, f"Expected 403 for cross-tenant job status change, got {res_status_job.status_code}"

    # 4. Job List: Recruiter A list only contains Org Alpha jobs
    res_jobs_list = client.get("/api/jobs", headers=rec_a_headers)
    assert res_jobs_list.status_code == 200
    returned_jobs = res_jobs_list.json()
    assert all(j.get("organization_id") == "org-alpha" for j in returned_jobs), "Recruiter A received jobs outside Org Alpha!"

    # 5. Studio Config: Recruiter A requesting studio config for Job B
    res_studio = client.get(f"/api/assessment/studio/job/{job_b_id}", headers=rec_a_headers)
    assert res_studio.status_code == 403, f"Expected 403 for cross-tenant studio config, got {res_studio.status_code}"

    # 6. Candidate Access: Recruiter A attempting to view Candidate B (in Org Beta)
    res_cand = client.get(f"/api/candidates/{cand_b_id}", headers=rec_a_headers)
    assert res_cand.status_code == 403, f"Expected 403 for cross-tenant candidate get, got {res_cand.status_code}"

    # 7. Candidate Mutation: Recruiter A attempting to transition Candidate B's stage
    res_stage = client.patch(f"/api/candidates/{cand_b_id}/stage", json={"stage": "assessment"}, headers=rec_a_headers)
    assert res_stage.status_code == 403, f"Expected 403 for cross-tenant stage update, got {res_stage.status_code}"

    # 8. Candidate Invite: Recruiter A attempting to invite Candidate B to assessment
    res_invite = client.post(f"/api/candidates/{cand_b_id}/invite-assessment", json={"custom_message": "test"}, headers=rec_a_headers)
    assert res_invite.status_code == 403, f"Expected 403 for cross-tenant assessment invite, got {res_invite.status_code}"

    # 9. Candidate List: Recruiter A candidate list only contains Org Alpha candidates
    res_cand_list = client.get("/api/candidates", headers=rec_a_headers)
    assert res_cand_list.status_code == 200
    returned_cands = res_cand_list.json()
    assert all(c.get("organization_id") == "org-alpha" for c in returned_cands), "Recruiter A received candidates outside Org Alpha!"

    print("[PASS] Test 2: Recruiter multi-tenant isolation strictly verified across jobs, studio, and candidate pipeline.")


def test_3_untrusted_code_execution_isolation():
    """Verify code execution sandbox blocks subprocess, sockets, and filesystem escapes."""
    runner = LocalSubprocessSandbox()

    # Scenario A: Spawning subprocess (calc/cmd/powershell)
    attack_proc = """
import subprocess
def solve():
    p = subprocess.Popen(['cmd.exe'], stdout=subprocess.PIPE)
    return 'Escaped'
"""
    res = runner.run_code(code=attack_proc, language="python", test_cases=[{"input": "", "expected": "ok"}], task_id="task-test")
    assert not res.all_passed
    assert "PermissionError" in (res.runtime_error or "") or "Security Violation" in (res.console_output or "") or any("Security Violation" in (r.get("error") or "") for r in res.test_results)
    print("  [OK] Child process execution blocked")

    # Scenario B: Socket/network access
    attack_socket = """
import socket
def solve():
    s = socket.socket()
    s.connect(('1.1.1.1', 80))
    return 'Connected'
"""
    res_sock = runner.run_code(code=attack_socket, language="python", test_cases=[{"input": "", "expected": "ok"}], task_id="task-test")
    assert not res_sock.all_passed
    assert "PermissionError" in (res_sock.runtime_error or "") or "Security Violation" in (res_sock.console_output or "") or any("Security Violation" in (r.get("error") or "") for r in res_sock.test_results)
    print("  [OK] Network socket connection blocked")

    # Scenario C: File system escape (read .env or win.ini)
    attack_fs = """
def solve():
    with open('C:/Windows/win.ini', 'r') as f:
        return f.read()[:50]
"""
    res_fs = runner.run_code(code=attack_fs, language="python", test_cases=[{"input": "", "expected": "ok"}], task_id="task-test")
    assert not res_fs.all_passed
    assert "PermissionError" in (res_fs.runtime_error or "") or "Security Violation" in (res_fs.console_output or "") or any("Security Violation" in (r.get("error") or "") for r in res_fs.test_results)
    print("  [OK] Sensitive filesystem read blocked")

    # Scenario D: Legitimate Python code passes sample tests
    legit_code = """
def solve(n):
    return n * 2
"""
    res_legit = runner.run_code(
        code=legit_code,
        language="python",
        test_cases=[
            {"id": 1, "name": "Test 1", "input": "5", "assertion_py": "assert solve(5) == 10", "expected": "10"},
            {"id": 2, "name": "Test 2", "input": "0", "assertion_py": "assert solve(0) == 0", "expected": "0"}
        ],
        task_id="task-test"
    )
    assert res_legit.all_passed, f"Legitimate code failed: {res_legit.console_output}"
    assert res_legit.passed_count == 2
    print("  [OK] Legitimate code executes and verifies genuine test assertions")

    print("[PASS] Test 3: Untrusted code execution sandbox verified (host isolation intact).")


def test_4_duplicate_application_guard():
    """Verify duplicate applications are rejected at both controller and DB index level."""
    data = setup_test_data()
    cand_a_headers = {"Authorization": f"Bearer {data['candidate_a_token']}"}
    job_a_id = data["job_a_id"]

    # Candidate Alice is already in 'assessment' stage for Job A.
    # Attempting to re-apply should return 400 Bad Request.
    res_dup = client.post(
        "/api/candidates/apply",
        json={
            "job_id": job_a_id,
            "name": "Candidate Alice",
            "email": "test_cand_a@domain.com",
            "skills": ["Python"],
            "experience_years": 3.0,
            "education": "BS CS"
        },
        headers=cand_a_headers
    )
    assert res_dup.status_code == 400, f"Expected 400 for duplicate application, got {res_dup.status_code}"
    assert "already submitted" in res_dup.json().get("detail", "").lower()
    print("[PASS] Test 4: Duplicate application guard verified.")


def test_5_workflow_state_consistency():
    """Verify 4D workflow state transitions and transition guards."""
    data = setup_test_data()
    rec_a_headers = {"Authorization": f"Bearer {data['recruiter_a_token']}"}
    cand_a_id = data["cand_a_id"]

    # Candidate Alice is currently in stage: 'assessment'.
    # Valid transition: advance to 'interview'
    res_adv = client.patch(
        f"/api/candidates/{cand_a_id}/stage",
        json={"stage": "interview", "notes": "Passed technical assessment"},
        headers=rec_a_headers
    )
    assert res_adv.status_code == 200, f"Expected 200 for valid stage advance, got {res_adv.status_code}"
    cand_updated = res_adv.json()
    assert cand_updated["stage"] == "interview"

    # Invalid transition: attempting to regress to 'applied' from 'interview' without reopening
    res_invalid = client.patch(
        f"/api/candidates/{cand_a_id}/stage",
        json={"stage": "applied", "notes": "Regression attempt"},
        headers=rec_a_headers
    )
    assert res_invalid.status_code == 400, f"Expected 400 for invalid regression, got {res_invalid.status_code}"

    print("[PASS] Test 5: 4D workflow state consistency and transition guards verified.")


def test_6_production_sqlite_fallback_prevention():
    """Verify that in production mode, PostgreSQL failure raises a fatal RuntimeError."""
    test_script = """
import os
import sys

os.environ["ENVIRONMENT"] = "production"
os.environ["DATABASE_URL"] = "postgresql://invalid_user:invalid_pwd@127.0.0.1:5432/nonexistent_db"

try:
    import database
    print("FAIL: Expected RuntimeError in production mode")
    sys.exit(1)
except RuntimeError as e:
    if "FATAL DATABASE ERROR" in str(e) and "Silent SQLite fallback is strictly prohibited" in str(e):
        print("PASS: Caught expected fatal RuntimeError")
        sys.exit(0)
    else:
        print(f"FAIL: Unexpected error message: {e}")
        sys.exit(2)
except Exception as ex:
    print(f"FAIL: Unexpected exception: {type(ex)}: {ex}")
    sys.exit(3)
"""
    import subprocess
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    proc = subprocess.run([sys.executable, "-c", test_script], capture_output=True, text=True, cwd=backend_dir)
    assert proc.returncode == 0, f"Production fallback prevention test failed:\nStdout: {proc.stdout}\nStderr: {proc.stderr}"
    print("[PASS] Test 6: Production SQLite fallback prevention verified (RuntimeError raised).")


def test_7_core_recruitment_regression():
    """Verify standard recruitment core workflows complete end-to-end without regression."""
    # 1. Recruiter creates a new Job
    db = SessionLocal()
    try:
        rec = db.query(UserModel).filter(UserModel.email == "test_recruiter_a@org-a.com").first()
        rec_token = create_access_token(user_id=rec.id, email=rec.email, role="recruiter", organization_id="org-alpha")
        rec_headers = {"Authorization": f"Bearer {rec_token}"}
    finally:
        db.close()

    job_title = f"Regression Engineer {uuid.uuid4().hex[:4]}"
    res_create_job = client.post(
        "/api/jobs",
        json={
            "title": job_title,
            "department": "Engineering",
            "location": "Remote",
            "min_experience_years": 2,
            "education": "Bachelor's in CS",
            "languages": ["python"],
            "required_skills": ["Python", "Algorithms"],
            "description": "Core recruitment regression verification role",
            "company_name": "Alpha Corp"
        },
        headers=rec_headers
    )
    assert res_create_job.status_code == 200, f"Job creation failed: {res_create_job.text}"
    created_job = res_create_job.json()
    new_job_id = created_job["id"]
    assert created_job["organization_id"] == "org-alpha"

    # 2. Candidate registers and logs in
    cand_email = f"cand_regression_{uuid.uuid4().hex[:4]}@domain.com"
    res_reg = client.post(
        "/api/auth/register",
        json={
            "name": "Regression Candidate",
            "email": cand_email,
            "password": "Password123!",
            "role": "candidate"
        }
    )
    assert res_reg.status_code == 200, f"Registration failed: {res_reg.text}"
    cand_token = res_reg.json()["token"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}

    # 3. Candidate applies for the newly created job
    res_apply = client.post(
        "/api/candidates/apply",
        json={
            "job_id": new_job_id,
            "name": "Regression Candidate",
            "email": cand_email,
            "skills": ["Python", "Algorithms"],
            "experience_years": 2.5,
            "education": "BS in CS"
        },
        headers=cand_headers
    )
    assert res_apply.status_code == 200, f"Application failed: {res_apply.text}"
    new_cand = res_apply.json()
    new_cand_id = new_cand["id"]
    assert new_cand["organization_id"] == "org-alpha"
    assert new_cand["stage"] == "applied"

    # 4. Recruiter views candidate in pipeline
    res_get_cand = client.get(f"/api/candidates/{new_cand_id}", headers=rec_headers)
    assert res_get_cand.status_code == 200

    # 5. Recruiter invites candidate to assessment
    res_invite = client.post(
        f"/api/candidates/{new_cand_id}/invite-assessment",
        json={"custom_message": "Welcome to technical evaluation"},
        headers=rec_headers
    )
    assert res_invite.status_code == 200
    assert res_invite.json()["assessment_status"] == "invited"

    # 6. Candidate starts assessment
    res_start = client.post(f"/api/assessment/{new_cand_id}/start", headers=cand_headers)
    assert res_start.status_code == 200

    # 7. Candidate submits assessment
    res_submit = client.post(
        f"/api/assessment/{new_cand_id}/submit",
        json={
            "candidate_id": new_cand_id,
            "job_id": new_job_id,
            "technical_answers": {"q1": "A"}
        },
        headers=cand_headers
    )
    assert res_submit.status_code == 200

    # 8. Recruiter advances candidate to interview stage and schedules interview
    res_stage = client.patch(
        f"/api/candidates/{new_cand_id}/stage",
        json={"stage": "interview", "notes": "Passed assessment"},
        headers=rec_headers
    )
    assert res_stage.status_code == 200

    res_sched = client.post(
        f"/api/candidates/{new_cand_id}/schedule",
        json={"scheduled_at": "2026-10-05 14:00", "notes": "Technical Round"},
        headers=rec_headers
    )
    assert res_sched.status_code == 200
    assert res_sched.json()["interview_status"] == "scheduled"

    # 9. Candidate starts interview and records evaluation
    res_istart = client.post("/api/interview/start", json={"candidate_id": new_cand_id}, headers=cand_headers)
    assert res_istart.status_code == 200

    res_eval = client.post(
        "/api/interview/evaluate",
        json={
            "candidate_id": new_cand_id,
            "job_id": new_job_id,
            "transcript": [{"role": "assistant", "content": "Question"}, {"role": "user", "content": "Answer"}],
            "integrity_score": 95,
            "integrity_events": []
        },
        headers=cand_headers
    )
    assert res_eval.status_code == 200

    # 10. Recruiter records final decision
    res_dec = client.patch(
        f"/api/candidates/{new_cand_id}/decision",
        json={"decision": "selected", "recruiter_score": 92, "hr_notes": "Strong candidate hire recommendation"},
        headers=rec_headers
    )
    assert res_dec.status_code == 200
    final_cand = res_dec.json()
    assert final_cand["hiring_decision"] == "selected"
    assert final_cand["stage"] == "completed"

    print("[PASS] Test 7: Core end-to-end recruitment lifecycle verified without regression.")


if __name__ == "__main__":
    print("=" * 70)
    print("STARTING SPARKX PHASE 1 SECURITY VERIFICATION SUITE")
    print("=" * 70)
    test_1_candidate_bola_idor()
    test_2_recruiter_multi_tenant_isolation()
    test_3_untrusted_code_execution_isolation()
    test_4_duplicate_application_guard()
    test_5_workflow_state_consistency()
    test_6_production_sqlite_fallback_prevention()
    test_7_core_recruitment_regression()
    print("=" * 70)
    print("ALL PHASE 1 SECURITY AND INTEGRITY TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)
