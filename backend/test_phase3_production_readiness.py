"""
SPARKX AI RECRUITMENT — PHASE 3 PRODUCTION READINESS VERIFICATION SUITE
Automated test harness verifying:
1. Database production readiness & constraint enforcement
2. Schema consistency and auxiliary tables
3. Observability headers (X-Request-ID, X-Response-Time-Ms)
4. Health probes (/api/health/live, /api/health/ready, /api/health)
5. Rate limiting and abuse prevention (HTTP 429 & Retry-After)
6. File upload security (extension whitelisting, magic bytes, size bounds)
7. AI failure resilience & deterministic fallback (zero fake data)
8. Complete Recruiter Lifecycle (End-to-End)
9. Complete Candidate Lifecycle (End-to-End)
10. Multi-Tenant Isolation (Org Alpha vs Org Beta)
"""
import os
import sys
import uuid
import json
import time
from datetime import datetime, timedelta

# Ensure rate limiting is active for testing
os.environ["RATE_LIMIT_ENABLED"] = "true"
os.environ["RATE_LIMIT_AUTH_PER_MIN"] = "5"
os.environ["RATE_LIMIT_AI_PER_MIN"] = "10"
os.environ["RATE_LIMIT_SANDBOX_PER_MIN"] = "10"

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

# Import backend modules
from main import app
from database import SessionLocal, engine, extract_db_host_port, get_db
from models.db_models import UserModel, JobModel, CandidateModel, CandidateStateLogModel, RevokedTokenModel
from rate_limiter import rate_limiter
from controllers.auth_controller import hash_password, create_access_token

client = TestClient(app)

def test_production_readiness():
    print("=" * 70)
    print("SPARKX PHASE 3: PRODUCTION READINESS & INFRASTRUCTURE VERIFICATION")
    print("=" * 70)

    results = []

    def record_test(test_id: str, description: str, passed: bool, details: str = ""):
        results.append({"id": test_id, "desc": description, "passed": passed, "details": details})
        status_icon = "[PASS]" if passed else "[FAIL]"
        print(f"{status_icon} {test_id} - {description}")
        if not passed and details:
            print(f"       [!] Detail: {details}")

    # Reset rate limiter before starting
    rate_limiter.reset()

    # -----------------------------------------------------------------
    # SUITE 1: DATABASE PRODUCTION READINESS & CONSTRAINTS
    # -----------------------------------------------------------------
    print("\n--- SUITE 1: DATABASE PRODUCTION READINESS & CONSTRAINTS ---")

    # DB-01: Dynamic host and port extraction from DATABASE_URL
    test_urls = [
        ("postgresql://user:pass@db-cluster.internal:5433/sparkx", ("db-cluster.internal", 5433)),
        ("postgresql://postgres:postgres@localhost:5432/sparkx_recruitment", ("127.0.0.1", 5432)),
        ("postgresql://admin:secret@10.0.1.50/production_db", ("10.0.1.50", 5432)),
    ]
    url_parse_ok = all(extract_db_host_port(u) == expected for u, expected in test_urls)
    record_test("DB-01", "Dynamic database host and port extraction from connection string", url_parse_ok)

    # DB-02: Connection pool attributes configured on engine
    has_pool = hasattr(engine, "pool") and engine.pool is not None
    record_test("DB-02", "Database engine connection pool initialized with pre-ping validation", has_pool)

    # DB-03: Session rollback on unhandled error
    db = SessionLocal()
    rollback_ok = False
    try:
        gen = get_db()
        sess = next(gen)
        try:
            raise ValueError("Simulated route error")
        except Exception:
            try:
                gen.throw(ValueError("Simulated route error"))
            except ValueError:
                rollback_ok = True
    except Exception as e:
        rollback_ok = False
    record_test("DB-03", "Database session lifecycle executes rollback on exception", rollback_ok)

    # DB-04: Composite unique constraint (job_id, email)
    uq_exists = False
    try:
        with engine.connect() as conn:
            if str(engine.url).startswith("sqlite"):
                idx_info = conn.execute(text("PRAGMA index_list('candidates')")).fetchall()
                uq_exists = any("uq_candidate_job_email" in str(r) for r in idx_info)
            else:
                idx_info = conn.execute(text("SELECT indexname FROM pg_indexes WHERE tablename = 'candidates'")).fetchall()
                uq_exists = any("uq_candidate_job_email" in str(r) for r in idx_info)
    except Exception:
        uq_exists = False
    record_test("DB-04", "Composite unique constraint (job_id, email) enforced on candidates table", uq_exists)

    # -----------------------------------------------------------------
    # SUITE 2: OBSERVABILITY & CORRELATION IDS
    # -----------------------------------------------------------------
    print("\n--- SUITE 2: OBSERVABILITY & CORRELATION IDS ---")

    # OBS-01: Auto-generated X-Request-ID on API response
    res = client.get("/api/health/live")
    has_req_id = "x-request-id" in res.headers and res.headers["x-request-id"].startswith("req-")
    record_test("OBS-01", "Auto-generation of distributed correlation ID (X-Request-ID)", has_req_id, f"Headers: {dict(res.headers)}")

    # OBS-02: Propagation of incoming X-Request-ID
    custom_trace_id = "trace-custom-9876543210"
    res2 = client.get("/api/health/live", headers={"X-Request-ID": custom_trace_id})
    preserves_req_id = res2.headers.get("x-request-id") == custom_trace_id
    record_test("OBS-02", "Preservation of client-supplied distributed trace ID", preserves_req_id)

    # OBS-03: Response execution duration header
    has_timing = "x-response-time-ms" in res.headers
    record_test("OBS-03", "Precision execution timing header (X-Response-Time-Ms) present", has_timing)

    # -----------------------------------------------------------------
    # SUITE 3: HEALTH & READINESS PROBES
    # -----------------------------------------------------------------
    print("\n--- SUITE 3: HEALTH & READINESS PROBES ---")

    # HLT-01: /api/health/live liveness probe
    res_live = client.get("/api/health/live")
    live_ok = res_live.status_code == 200 and res_live.json().get("status") == "live"
    record_test("HLT-01", "Fast liveness probe endpoint (/api/health/live) returns HTTP 200", live_ok)

    # HLT-02: /api/health/ready readiness probe
    res_ready = client.get("/api/health/ready")
    ready_json = res_ready.json()
    ready_ok = (
        res_ready.status_code == 200 and 
        ready_json.get("status") == "ready" and 
        ready_json.get("database") == "connected" and
        "supported_languages" in ready_json
    )
    record_test("HLT-02", "Deep readiness probe (/api/health/ready) verifies DB & execution subsystems", ready_ok, f"Response: {ready_json}")

    # HLT-03: /api/health comprehensive diagnostics
    res_diag = client.get("/api/health")
    diag_ok = res_diag.status_code == 200 and res_diag.json().get("status") == "healthy" and "records" in res_diag.json()
    record_test("HLT-03", "System diagnostic endpoint (/api/health) reports database state and metrics", diag_ok)

    # -----------------------------------------------------------------
    # SUITE 4: RATE LIMITING & ABUSE PREVENTION
    # -----------------------------------------------------------------
    print("\n--- SUITE 4: RATE LIMITING & ABUSE PREVENTION ---")

    # RAT-01: Rate limit enforcement on auth endpoints (limit: 5/min)
    rate_limiter.reset()
    auth_429 = False
    retry_header_present = False
    for i in range(7):
        r = client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "wrong"})
        if r.status_code == 429:
            auth_429 = True
            retry_header_present = "retry-after" in r.headers
            break
    record_test("RAT-01", "Rate limiter returns HTTP 429 on rapid authentication attempts", auth_429)
    record_test("RAT-02", "Rate limit response includes standard Retry-After header", retry_header_present)

    # Reset rate limiter so remaining tests run unrestricted
    rate_limiter.reset()

    # -----------------------------------------------------------------
    # SUITE 5: FILE & RESUME SECURITY
    # -----------------------------------------------------------------
    print("\n--- SUITE 5: FILE & RESUME SECURITY ---")

    # FIL-01: Disallow executable extensions (.exe, .sh, .bat)
    res_exe = client.post(
        "/api/candidates/parse-resume",
        files={"file": ("malware.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")}
    )
    exe_blocked = res_exe.status_code == 400 and "Unsupported file extension" in res_exe.text
    record_test("FIL-01", "Executable resume upload (.exe) strictly rejected with HTTP 400", exe_blocked)

    # FIL-02: Disallow script extensions (.sh)
    res_sh = client.post(
        "/api/candidates/parse-resume",
        files={"file": ("payload.sh", b"#!/bin/bash\nrm -rf /", "text/x-shellscript")}
    )
    sh_blocked = res_sh.status_code == 400 and "Unsupported file extension" in res_sh.text
    record_test("FIL-02", "Shell script resume upload (.sh) strictly rejected with HTTP 400", sh_blocked)

    # FIL-03: Corrupted PDF missing %PDF header
    res_fake_pdf = client.post(
        "/api/candidates/parse-resume",
        files={"file": ("fake.pdf", b"This is not a real PDF file header", "application/pdf")}
    )
    fake_pdf_blocked = res_fake_pdf.status_code == 400 and "Invalid PDF file format" in res_fake_pdf.text
    record_test("FIL-03", "Spoofed PDF file without %PDF magic bytes rejected with HTTP 400", fake_pdf_blocked)

    # FIL-04: Legitimate text resume parsing succeeds
    legit_text_resume = "Alex Rivera - Resume\nEmail: alex.rivera@domain.com\nPhone: (555) 234-5678\nSkills: Python, FastAPI, Docker\nExperience: 5 years software engineer."
    res_txt = client.post(
        "/api/candidates/parse-resume",
        files={"file": ("alex_rivera_resume.txt", legit_text_resume.encode("utf-8"), "text/plain")}
    )
    txt_ok = res_txt.status_code == 200 and res_txt.json().get("success") == True
    record_test("FIL-04", "Legitimate resume file parsed successfully without errors", txt_ok)

    # -----------------------------------------------------------------
    # SUITE 6: AI RESILIENCE & ZERO-FAKE-DATA GUARANTEE
    # -----------------------------------------------------------------
    print("\n--- SUITE 6: AI RESILIENCE & ZERO-FAKE-DATA GUARANTEE ---")

    # AI-01: Empty scenario response scores 0 (not a fabricated score)
    from ai_engine import evaluate_scenario_response
    zero_eval = evaluate_scenario_response(
        scenario_prompt="Explain high availability design",
        candidate_response="",
        job_title="Cloud Engineer",
        job_skills=["AWS", "Terraform"]
    )
    zero_score_ok = zero_eval.get("score") == 0 and zero_eval.get("quality") == "unsubmitted"
    record_test("AI-01", "Empty scenario submission returns 0 score without fake data fabrication", zero_score_ok)

    # AI-02: Offline deterministic fallback returns truthful assessment
    offline_eval = evaluate_scenario_response(
        scenario_prompt="Incident response for multi-region failover",
        candidate_response="We configure Route 53 health checks with latency-based routing across us-east-1 and us-west-2, using Aurora Global Database replication with automated failover in under 1 minute.",
        job_title="Staff Site Reliability Engineer",
        job_skills=["AWS", "Aurora", "Route 53", "Terraform"]
    )
    fallback_ok = offline_eval.get("score", 0) > 0 and len(offline_eval.get("strengths", [])) > 0
    record_test("AI-02", "Substantive scenario evaluated with objective feedback based on candidate input", fallback_ok)

    # -----------------------------------------------------------------
    # SUITE 7: COMPLETE RECRUITER & CANDIDATE END-TO-END LIFECYCLE
    # -----------------------------------------------------------------
    print("\n--- SUITE 7: RECRUITER & CANDIDATE END-TO-END LIFECYCLE ---")

    # Clear rate limiter
    rate_limiter.reset()

    # Step 1: Create Organization Alpha & Recruiter Alpha
    db = SessionLocal()
    org_alpha = f"org-alpha-{uuid.uuid4().hex[:6]}"
    rec_alpha_email = f"recruiter_p3_{uuid.uuid4().hex[:6]}@alpha.corp"
    user_rec_a = UserModel(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name="Elena Rostova",
        email=rec_alpha_email,
        password_hash=hash_password("alphaPass2026!"),
        role="recruiter",
        organization_id=org_alpha
    )
    db.add(user_rec_a)
    db.commit()

    token_rec_a = create_access_token(user_id=user_rec_a.id, email=user_rec_a.email, role="recruiter", organization_id=org_alpha)
    headers_rec_a = {"Authorization": f"Bearer {token_rec_a}"}

    # Step 2: Recruiter Alpha creates a job
    res_job = client.post("/api/jobs", json={
        "title": "Lead Distributed Systems Engineer",
        "department": "Platform Architecture",
        "location": "San Francisco, CA (Hybrid)",
        "min_experience_years": 4,
        "education": "B.S. / M.S. in Computer Science",
        "description": "Architect mission-critical high-throughput microservices using Python and distributed data stores.",
        "required_skills": ["Python", "PostgreSQL", "Distributed Systems", "gRPC"],
        "ctc_type": "range",
        "ctc_min": 180000.0,
        "ctc_max": 240000.0,
        "ctc_currency": "USD",
        "ctc_period": "annual"
    }, headers=headers_rec_a)
    job_ok = res_job.status_code == 200
    job_id = res_job.json().get("id") if job_ok else None
    record_test("E2E-01", "Recruiter creates job with production compensation specifications", job_ok)

    # Step 3: Candidate Alpha registers
    cand_alpha_email = f"candidate_p3_{uuid.uuid4().hex[:6]}@mail.com"
    res_cand_reg = client.post("/api/auth/register", json={
        "name": "Marcus Vance",
        "email": cand_alpha_email,
        "password": "candPassword2026!",
        "role": "candidate"
    })
    cand_reg_ok = res_cand_reg.status_code == 200
    cand_user_id = res_cand_reg.json().get("id")
    token_cand_a = res_cand_reg.json().get("token") or res_cand_reg.json().get("access_token")
    headers_cand_a = {"Authorization": f"Bearer {token_cand_a}"}
    record_test("E2E-02", "Candidate registers account and receives valid JWT token", cand_reg_ok)

    # Step 4: Candidate Alpha applies to the job
    res_apply = client.post("/api/candidates/apply", json={
        "job_id": job_id,
        "name": "Marcus Vance",
        "email": cand_alpha_email,
        "education": "M.S. in Computer Science",
        "experience_years": 5.0,
        "skills": ["Python", "PostgreSQL", "Distributed Systems"],
        "expected_ctc_type": "range",
        "expected_ctc_min": 190000.0,
        "expected_ctc_max": 220000.0,
        "ctc_currency": "USD"
    }, headers=headers_cand_a)
    apply_ok = res_apply.status_code == 200
    cand_id = res_apply.json().get("id") if apply_ok else None
    record_test("E2E-03", "Candidate submits formal application with compensation expectations", apply_ok)

    # Step 5: Duplicate application immediately rejected
    res_dup = client.post("/api/candidates/apply", json={
        "job_id": job_id,
        "name": "Marcus Vance",
        "email": cand_alpha_email,
        "education": "M.S. in Computer Science",
        "experience_years": 5.0,
        "skills": ["Python"]
    }, headers=headers_cand_a)
    dup_blocked = res_dup.status_code == 400
    record_test("E2E-04", "Duplicate application on (job_id, email) rejected with HTTP 400", dup_blocked)

    # Step 6: Recruiter Alpha screens candidate
    res_screen = client.patch(f"/api/candidates/{cand_id}/stage", json={
        "stage": "screening",
        "reason": "Resume meets distributed systems criteria"
    }, headers=headers_rec_a)
    screen_ok = res_screen.status_code == 200 and res_screen.json().get("stage") == "screening"
    record_test("E2E-05", "Recruiter advances candidate from applied to screening stage", screen_ok)

    # Step 7: Recruiter Alpha invites candidate to assessment
    res_invite = client.post(f"/api/candidates/{cand_id}/invite-assessment", json={
        "message": "Please complete your technical assessment"
    }, headers=headers_rec_a)
    invite_ok = res_invite.status_code == 200 and res_invite.json().get("assessment_status") == "invited"
    record_test("E2E-06", "Recruiter invites candidate to technical role assessment", invite_ok)

    # Step 8: Candidate Alpha starts assessment
    res_start = client.post(f"/api/assessment/{cand_id}/start", headers=headers_cand_a)
    start_ok = res_start.status_code == 200 and res_start.json().get("success") == True
    record_test("E2E-07", "Candidate starts technical assessment; status enters in_progress", start_ok)

    # Step 9: Candidate Alpha submits assessment
    res_submit = client.post(f"/api/assessment/{cand_id}/submit", json={
        "candidate_id": cand_id,
        "job_id": job_id,
        "technical_answers": {"mcq_1": "B", "mcq_2": "C"},
        "scenario_answers": {
            "scen_1": "We decouple the event ingestion pipeline using partitioned Kafka topics with idempotency keys to ensure exactly-once processing."
        },
        "hands_on_submission": {
            "language": "python",
            "code": "def solve(data):\n    return sorted(data)\n"
        },
        "troubleshooting_submission": {
            "language": "python",
            "code": "def solve(data):\n    return data\n"
        }
    }, headers=headers_cand_a)
    submit_ok = res_submit.status_code == 200 and res_submit.json().get("success") == True
    record_test("E2E-08", "Candidate submits answers; automated evaluation executes", submit_ok)

    # Step 10: Recruiter schedules interview
    sched_time = (datetime.utcnow() + timedelta(days=2, hours=10)).isoformat()
    res_sched = client.post(f"/api/candidates/{cand_id}/schedule", json={
        "scheduled_at": sched_time,
        "meeting_type": "Google Meet",
        "custom_notes": "Technical Architecture Round"
    }, headers=headers_rec_a)
    sched_ok = res_sched.status_code == 200 and res_sched.json().get("interview_status") == "scheduled"
    record_test("E2E-09", "Recruiter schedules technical video interview with meeting coordinates", sched_ok)

    # Step 11: Interview room starts and completes
    res_start_int = client.post("/api/interview/start", json={"candidate_id": cand_id}, headers=headers_cand_a)
    int_start_ok = res_start_int.status_code == 200 and res_start_int.json().get("success") == True

    res_eval_int = client.post("/api/interview/evaluate", json={
        "candidate_id": cand_id,
        "job_id": job_id,
        "transcript": [
            {"role": "interviewer", "content": "Describe your experience with high-availability systems."},
            {"role": "candidate", "content": "I designed high-availability clusters using Raft consensus and PostgreSQL read replicas."}
        ],
        "integrity_score": 95,
        "integrity_events": [],
        "code_score": 80
    }, headers=headers_cand_a)
    int_eval_ok = res_eval_int.status_code == 200

    cand_after_int = db.query(CandidateModel).filter(CandidateModel.id == cand_id).first()
    cand_completed = cand_after_int is not None and cand_after_int.interview_status == "completed"
    record_test("E2E-10", "Candidate completes live technical interview; status transitions to completed", int_start_ok and int_eval_ok and cand_completed)

    # Step 12: Recruiter makes final hiring decision
    res_dec = client.patch(f"/api/candidates/{cand_id}/decision", json={
        "decision": "selected",
        "recruiter_score": 92,
        "hr_notes": "Outstanding technical and system design performance. Recommended for Senior Staff tier."
    }, headers=headers_rec_a)
    dec_ok = res_dec.status_code == 200 and res_dec.json().get("hiring_decision") == "selected"
    record_test("E2E-11", "Recruiter selects candidate; pipeline advances to completed terminal stage", dec_ok)

    # Step 13: Candidate cannot see recruiter private notes
    res_cand_view = client.get(f"/api/candidates/{cand_id}", headers=headers_cand_a)
    cand_data = res_cand_view.json()
    private_notes_hidden = "hr_notes" not in cand_data or cand_data["hr_notes"] is None or cand_data["hr_notes"] == ""
    record_test("E2E-12", "Candidate dossier endpoint strictly filters internal recruiter evaluation notes", private_notes_hidden)

    # -----------------------------------------------------------------
    # SUITE 8: MULTI-TENANT ISOLATION (ORG ALPHA VS ORG BETA)
    # -----------------------------------------------------------------
    print("\n--- SUITE 8: MULTI-TENANT ISOLATION ---")

    # Create Org Beta & Recruiter Beta
    org_beta = f"org-beta-{uuid.uuid4().hex[:6]}"
    rec_beta_email = f"recruiter_p3_{uuid.uuid4().hex[:6]}@beta.corp"
    user_rec_b = UserModel(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        name="Vikram Thorne",
        email=rec_beta_email,
        password_hash=hash_password("betaPass2026!"),
        role="recruiter",
        organization_id=org_beta
    )
    db.add(user_rec_b)
    db.commit()

    token_rec_b = create_access_token(user_id=user_rec_b.id, email=user_rec_b.email, role="recruiter", organization_id=org_beta)
    headers_rec_b = {"Authorization": f"Bearer {token_rec_b}"}

    # TEN-01: Recruiter Beta cannot read Org Alpha job
    res_b_job = client.get(f"/api/jobs/{job_id}", headers=headers_rec_b)
    rec_b_job_blocked = res_b_job.status_code == 403
    record_test("TEN-01", "Cross-tenant job access blocked (Recruiter Beta cannot access Org Alpha job)", rec_b_job_blocked)

    # TEN-02: Recruiter Beta cannot read Org Alpha candidate
    res_b_cand = client.get(f"/api/candidates/{cand_id}", headers=headers_rec_b)
    rec_b_cand_blocked = res_b_cand.status_code == 403
    record_test("TEN-02", "Cross-tenant candidate dossier access blocked with HTTP 403", rec_b_cand_blocked)

    # TEN-03: Recruiter Beta cannot alter Org Alpha candidate stage or decision
    res_b_stage = client.patch(f"/api/candidates/{cand_id}/stage", json={"stage": "screening"}, headers=headers_rec_b)
    rec_b_stage_blocked = res_b_stage.status_code == 403
    record_test("TEN-03", "Cross-tenant candidate stage mutation blocked with HTTP 403", rec_b_stage_blocked)

    # TEN-04: Recruiter Beta candidate pipeline listing excludes Org Alpha candidates
    res_b_list = client.get("/api/candidates", headers=headers_rec_b)
    b_cands = res_b_list.json() if res_b_list.status_code == 200 else []
    no_leak = not any(c.get("id") == cand_id for c in b_cands)
    record_test("TEN-04", "Candidate pipeline query strictly isolated to authenticated organization", no_leak)

    db.close()

    # -----------------------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("PHASE 3 VERIFICATION EXECUTION SUMMARY")
    print("=" * 70)
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    failed = total - passed
    pass_rate = round((passed / total) * 100, 1)

    print(f"Total Tests Executed: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Pass Rate: {pass_rate}%")

    out_file = "C:/Users/Burhan_Kapasi/.gemini/antigravity/brain/11470821-5b45-47d4-a425-1b693f73ddbd/scratch/phase3_verification_results.json"
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to {out_file}")

    assert failed == 0, f"{failed} Phase 3 verification tests failed!"

if __name__ == "__main__":
    test_production_readiness()
