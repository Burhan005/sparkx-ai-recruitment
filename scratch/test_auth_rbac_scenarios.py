import sys
import os
import time
import json
import threading
import urllib.request
import urllib.error

# Add backend directory to sys.path
sys.path.insert(0, r"C:\Sparkx\sparkx-ai-recruitment\backend")

import uvicorn
from main import app
from database import SessionLocal
import models
from controllers.auth_controller import create_access_token, hash_password

PORT = 8009
BASE_URL = f"http://127.0.0.1:{PORT}/api"

def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=PORT, log_level="error")
    server = uvicorn.Server(config)
    server.run()

def http_request(method, endpoint, headers=None, body=None):
    url = f"{BASE_URL}{endpoint}" if not endpoint.startswith("http") else endpoint
    req_headers = headers.copy() if headers else {}
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode("utf-8")
            if "Content-Type" not in req_headers:
                req_headers["Content-Type"] = "application/json"
        elif isinstance(body, str):
            data = body.encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return status, parsed
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content
        return e.code, parsed
    except Exception as e:
        return 0, str(e)

def setup_test_users():
    db = SessionLocal()
    try:
        # 1. Candidate User A
        cand_a = db.query(models.UserModel).filter(models.UserModel.email == "test_cand_a@sparkx.ai").first()
        if not cand_a:
            cand_a = models.UserModel(
                id="user-cand-a-001",
                name="Candidate Alpha",
                email="test_cand_a@sparkx.ai",
                password_hash=hash_password("Pass123!"),
                role="candidate"
            )
            db.add(cand_a)
            db.commit()
            db.refresh(cand_a)

        # 2. Candidate User B
        cand_b = db.query(models.UserModel).filter(models.UserModel.email == "test_cand_b@sparkx.ai").first()
        if not cand_b:
            cand_b = models.UserModel(
                id="user-cand-b-002",
                name="Candidate Beta",
                email="test_cand_b@sparkx.ai",
                password_hash=hash_password("Pass123!"),
                role="candidate"
            )
            db.add(cand_b)
            db.commit()
            db.refresh(cand_b)

        # 3. Recruiter User
        rec = db.query(models.UserModel).filter(models.UserModel.email == "test_recruiter@sparkx.ai").first()
        if not rec:
            rec = models.UserModel(
                id="user-rec-001",
                name="Recruiter Admin",
                email="test_recruiter@sparkx.ai",
                password_hash=hash_password("Pass123!"),
                role="recruiter"
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)

        # 4. Candidate application for B
        cand_b_app = db.query(models.CandidateModel).filter(models.CandidateModel.email == "test_cand_b@sparkx.ai").first()
        if not cand_b_app:
            cand_b_app = models.CandidateModel(
                id="cand-record-b-999",
                job_id="job-101",
                company_name="SparkX Technologies",
                name="Candidate Beta",
                email="test_cand_b@sparkx.ai",
                status="Applied",
                final_decision="Applied",
                match_score=75.0,
                experience_years=3.0,
                education="BS CS",
                skills=["Python", "FastAPI"]
            )
            db.add(cand_b_app)
            db.commit()
            db.refresh(cand_b_app)

        token_cand_a = create_access_token(cand_a.id, cand_a.email, cand_a.role)
        token_cand_b = create_access_token(cand_b.id, cand_b.email, cand_b.role)
        token_rec = create_access_token(rec.id, rec.email, rec.role)

        return {
            "cand_a": cand_a,
            "token_cand_a": token_cand_a,
            "cand_b": cand_b,
            "token_cand_b": token_cand_b,
            "cand_b_app_id": cand_b_app.id,
            "rec": rec,
            "token_rec": token_rec,
        }
    finally:
        db.close()

def main():
    print("================================================================================")
    print("STARTING END-TO-END AUTHENTICATION, RBAC & SECURITY AUDIT TEST (SCENARIOS A - N)")
    print("================================================================================")

    # Start server in thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for server readiness
    ready = False
    for _ in range(30):
        code, _ = http_request("GET", "/health")
        if code == 200:
            ready = True
            break
        time.sleep(0.3)

    if not ready:
        print("[FAIL] Server failed to start on port", PORT)
        sys.exit(1)

    print(f"[OK] Server running and ready on port {PORT}\n")

    users = setup_test_users()
    token_cand_a = users["token_cand_a"]
    token_cand_b = users["token_cand_b"]
    token_rec = users["token_rec"]
    cand_b_app_id = users["cand_b_app_id"]
    forged_token = "spk.eyJ1aWQiOiJmYWtlIiwic3ViIjoiZmFrZUBlbWFpbC5jb20iLCJyb2xlIjoicmVjcnVpdGVyIn0.fake_signature_abc123"

    passed_count = 0
    total_tests = 14

    # --------------------------------------------------------------------------
    # Scenario A: Unauthenticated request to GET /api/candidates -> 401
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/candidates")
    print(f"Scenario A [GET /candidates without token] -> Status: {code}")
    assert code == 401, f"Expected 401, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Unauthenticated request strictly rejected with 401 Unauthorized\n")

    # --------------------------------------------------------------------------
    # Scenario B: Candidate token accessing GET /api/candidates -> 403
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/candidates", headers={"Authorization": f"Bearer {token_cand_a}"})
    print(f"Scenario B [GET /candidates with Candidate token] -> Status: {code}")
    assert code == 403, f"Expected 403, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Candidate accessing candidate pipeline strictly rejected with 403 Forbidden\n")

    # --------------------------------------------------------------------------
    # Scenario C: Recruiter token accessing GET /api/candidates -> 200
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/candidates", headers={"Authorization": f"Bearer {token_rec}"})
    print(f"Scenario C [GET /candidates with Recruiter token] -> Status: {code}")
    assert code == 200, f"Expected 200, got {code}: {data}"
    assert isinstance(data, list), "Expected list of candidates"
    passed_count += 1
    print(f"  [PASS] Recruiter successfully retrieved candidate pipeline ({len(data)} candidates)\n")

    # --------------------------------------------------------------------------
    # Scenario D: Unauthenticated request to POST /api/jobs -> 401
    # --------------------------------------------------------------------------
    job_payload = {
        "title": "Test Security Role",
        "department": "Engineering",
        "location": "Remote",
        "min_experience_years": 3,
        "education": "BS",
        "languages": ["English"],
        "required_skills": ["Python", "FastAPI"],
        "optional_criteria": "Security mindset",
        "description": "Secure job creation test",
        "questions": []
    }
    code, data = http_request("POST", "/jobs", body=job_payload)
    print(f"Scenario D [POST /jobs without token] -> Status: {code}")
    assert code == 401, f"Expected 401, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Unauthenticated job creation strictly rejected with 401 Unauthorized\n")

    # --------------------------------------------------------------------------
    # Scenario E: Candidate token accessing POST /api/jobs -> 403
    # --------------------------------------------------------------------------
    code, data = http_request("POST", "/jobs", headers={"Authorization": f"Bearer {token_cand_a}"}, body=job_payload)
    print(f"Scenario E [POST /jobs with Candidate token] -> Status: {code}")
    assert code == 403, f"Expected 403, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Candidate job creation strictly rejected with 403 Forbidden\n")

    # --------------------------------------------------------------------------
    # Scenario F: Recruiter token accessing POST /api/jobs -> 200 or 201
    # --------------------------------------------------------------------------
    code, data = http_request("POST", "/jobs", headers={"Authorization": f"Bearer {token_rec}"}, body=job_payload)
    print(f"Scenario F [POST /jobs with Recruiter token] -> Status: {code}")
    assert code in (200, 201), f"Expected 200/201, got {code}: {data}"
    assert data.get("title") == "Test Security Role"
    passed_count += 1
    print(f"  [PASS] Recruiter authorized to create job (Job ID: {data.get('id')})\n")

    # --------------------------------------------------------------------------
    # Scenario G: Unauthenticated request to GET /api/auth/me -> 401
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/auth/me")
    print(f"Scenario G [GET /auth/me without token] -> Status: {code}")
    assert code == 401, f"Expected 401, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Unauthenticated session resolution rejected with 401 Unauthorized\n")

    # --------------------------------------------------------------------------
    # Scenario H: Valid candidate token to GET /api/auth/me -> 200 with role candidate
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/auth/me", headers={"Authorization": f"Bearer {token_cand_a}"})
    print(f"Scenario H [GET /auth/me with Candidate token] -> Status: {code}")
    assert code == 200, f"Expected 200, got {code}: {data}"
    assert data.get("role") == "candidate", f"Expected role 'candidate', got {data.get('role')}"
    assert data.get("email") == "test_cand_a@sparkx.ai"
    passed_count += 1
    print(f"  [PASS] Verified candidate identity: {data.get('name')} (Role: {data.get('role')})\n")

    # --------------------------------------------------------------------------
    # Scenario I: Valid recruiter token to GET /api/auth/me -> 200 with role recruiter
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/auth/me", headers={"Authorization": f"Bearer {token_rec}"})
    print(f"Scenario I [GET /auth/me with Recruiter token] -> Status: {code}")
    assert code == 200, f"Expected 200, got {code}: {data}"
    assert data.get("role") == "recruiter", f"Expected role 'recruiter', got {data.get('role')}"
    assert data.get("email") == "test_recruiter@sparkx.ai"
    passed_count += 1
    print(f"  [PASS] Verified recruiter identity: {data.get('name')} (Role: {data.get('role')})\n")

    # --------------------------------------------------------------------------
    # Scenario J: Invalid / forged token to GET /api/auth/me -> 401
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
    print(f"Scenario J [GET /auth/me with Forged token] -> Status: {code}")
    assert code == 401, f"Expected 401, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Forged token cryptographically rejected with 401 Unauthorized\n")

    # --------------------------------------------------------------------------
    # Scenario K: Candidate A accessing Candidate B's profile via GET /api/candidates/{id} -> 403
    # --------------------------------------------------------------------------
    code, data = http_request("GET", f"/candidates/{cand_b_app_id}", headers={"Authorization": f"Bearer {token_cand_a}"})
    print(f"Scenario K [Candidate A accessing Candidate B profile] -> Status: {code}")
    assert code == 403, f"Expected 403, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Cross-candidate data access strictly blocked with 403 Forbidden\n")

    # --------------------------------------------------------------------------
    # Scenario L: Candidate A accessing own applications via GET /api/candidates/my-applications -> 200
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/candidates/my-applications?email=test_cand_a@sparkx.ai", headers={"Authorization": f"Bearer {token_cand_a}"})
    print(f"Scenario L [Candidate A accessing own applications] -> Status: {code}")
    assert code == 200, f"Expected 200, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Candidate successfully retrieved own applications with 200 OK\n")

    # --------------------------------------------------------------------------
    # Scenario M: Candidate A trying to access Candidate B's applications -> 403
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/candidates/my-applications?email=test_cand_b@sparkx.ai", headers={"Authorization": f"Bearer {token_cand_a}"})
    print(f"Scenario M [Candidate A attempting to read Candidate B applications] -> Status: {code}")
    assert code == 403, f"Expected 403, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Cross-user applications request strictly blocked with 403 Forbidden\n")

    # --------------------------------------------------------------------------
    # Scenario N: Unauthenticated request to GET /api/candidates/my-applications -> 401
    # --------------------------------------------------------------------------
    code, data = http_request("GET", "/candidates/my-applications?email=test_cand_a@sparkx.ai")
    print(f"Scenario N [Unauthenticated GET /candidates/my-applications] -> Status: {code}")
    assert code == 401, f"Expected 401, got {code}: {data}"
    passed_count += 1
    print("  [PASS] Unauthenticated applications request strictly rejected with 401 Unauthorized\n")

    print("================================================================================")
    print(f"ALL {passed_count}/{total_tests} SECURITY & RBAC AUDIT SCENARIOS PASSED WITH ZERO ERRORS!")
    print("================================================================================")

if __name__ == "__main__":
    main()
