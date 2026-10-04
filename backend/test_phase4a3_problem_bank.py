"""
SPARKX PHASE 4A.3: ADVANCED CODING PROBLEM BANK & RECRUITER AUTHORING VERIFICATION SUITE
Verifies:
1. Supported Language Registry endpoint
2. Problem Bank listing, searching, and filtering
3. Recruiter custom problem authoring with tenant isolation
4. Initial version snapshot creation in CodingProblemVersionModel
5. Multi-tenant isolation (Org A vs Org B)
6. Cross-tenant modification rejection (403 Forbidden)
7. System problem immutability guard (403 Forbidden)
8. Version snapshot generation on problem update (v1 -> v2)
9. Hidden test case confidentiality for candidates
10. Multi-problem assessment attachment and display ordering
11. Execution against custom authored problem with Judge0/sandbox
"""
import sys
import uuid
from datetime import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, r"C:\Sparkx\sparkx-ai-recruitment\backend")

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models.db_models import (
    UserModel, JobModel, AssessmentModel,
    CodingProblemModel, CodingProblemVersionModel,
    AssessmentCodingProblemModel, CodingTestCaseModel
)
from controllers.auth_controller import hash_password, create_access_token

client = TestClient(app)

print("=" * 70)
print("SPARKX PHASE 4A.3: ADVANCED CODING PROBLEM BANK & RECRUITER AUTHORING")
print("=" * 70)

# Setup test database records
db = SessionLocal()

# Setup 2 distinct recruiter tenants and 1 candidate
org_alpha = f"org-alpha-{uuid.uuid4().hex[:6]}"
org_beta = f"org-beta-{uuid.uuid4().hex[:6]}"

user_rec_a = UserModel(
    id=f"user-{uuid.uuid4().hex[:8]}",
    name="Recruiter Alpha",
    email=f"rec_alpha_{uuid.uuid4().hex[:4]}@sparkx.ai",
    password_hash=hash_password("Password123!"),
    role="recruiter",
    organization_id=org_alpha
)
user_rec_b = UserModel(
    id=f"user-{uuid.uuid4().hex[:8]}",
    name="Recruiter Beta",
    email=f"rec_beta_{uuid.uuid4().hex[:4]}@sparkx.ai",
    password_hash=hash_password("Password123!"),
    role="recruiter",
    organization_id=org_beta
)
user_cand = UserModel(
    id=f"user-{uuid.uuid4().hex[:8]}",
    name="Candidate One",
    email=f"cand_{uuid.uuid4().hex[:4]}@candidate.com",
    password_hash=hash_password("Password123!"),
    role="candidate",
    organization_id="org-sparkx-default"
)

job_a = JobModel(
    id=f"job-{uuid.uuid4().hex[:8]}",
    title="Staff Backend Engineer",
    department="Core Platform",
    organization_id=org_alpha,
    status="active",
    education="B.S. Computer Science",
    description="Core backend platform engineering and high-throughput microservices.",
    languages=["python", "javascript", "go"]
)

db.add_all([user_rec_a, user_rec_b, user_cand, job_a])
db.commit()

token_rec_a = create_access_token(user_rec_a.id, user_rec_a.email, user_rec_a.role, org_alpha)
token_rec_b = create_access_token(user_rec_b.id, user_rec_b.email, user_rec_b.role, org_beta)
token_cand = create_access_token(user_cand.id, user_cand.email, user_cand.role, "org-sparkx-default")

headers_rec_a = {"Authorization": f"Bearer {token_rec_a}"}
headers_rec_b = {"Authorization": f"Bearer {token_rec_b}"}
headers_cand = {"Authorization": f"Bearer {token_cand}"}

passed_count = 0
total_tests = 11

def record(test_id, name, success, details=""):
    global passed_count
    status = "PASS" if success else "FAIL"
    if success:
        passed_count += 1
    print(f"[{status}] {test_id} - {name}")
    if not success and details:
        print(f"       Details: {details}")

# --- TEST 1: Supported Language Registry ---
res = client.get("/api/assessment/problems/languages")
lang_data = res.json()
has_languages = res.status_code == 200 and len(lang_data) >= 8 and any(l["id"] == "python" for l in lang_data)
record("PB-01", "Supported languages registry returned with starter templates", has_languages, f"Status: {res.status_code}, count: {len(lang_data) if isinstance(lang_data, list) else 0}")

# --- TEST 2: Problem Bank Listing & Filtering ---
res = client.get("/api/assessment/problems", headers=headers_rec_a)
problems = res.json()
has_system_prob = res.status_code == 200 and any(p["is_system"] is True for p in problems)
record("PB-02", "Problem bank lists system problems with public test cases", has_system_prob, f"Status: {res.status_code}, count: {len(problems) if isinstance(problems, list) else 0}")

# --- TEST 3: Recruiter Authors Custom Problem ---
custom_prob_payload = {
    "title": "Reverse String Function",
    "problem_statement": "Write a function reverseString(s) that returns the reversed string.",
    "difficulty": "Easy",
    "execution_mode": "function",
    "function_name": "reverseString",
    "function_signature": {
        "parameters": [{"name": "s", "type": "str"}],
        "return_type": "str"
    },
    "allowed_languages": ["python", "javascript", "typescript"],
    "test_cases": [
        {"input_data": "'hello'", "expected_output": "'olleh'", "is_hidden": False, "weight": 25.0, "display_order": 1},
        {"input_data": "'world'", "expected_output": "'dlrow'", "is_hidden": False, "weight": 25.0, "display_order": 2},
        {"input_data": "'SparkX Platform'", "expected_output": "'mroftalP XkrapS'", "is_hidden": True, "weight": 50.0, "display_order": 3}
    ]
}
res = client.post("/api/assessment/problems", json=custom_prob_payload, headers=headers_rec_a)
created_prob = res.json()
prob_created = res.status_code == 201 and created_prob.get("title") == "Reverse String Function" and created_prob.get("organization_id") == org_alpha
record("PB-03", "Recruiter creates custom problem bound to organization", prob_created, f"Status: {res.status_code}, res: {created_prob}")
created_prob_id = created_prob.get("id")

# --- TEST 4: Initial Version Snapshot Created ---
version_snapshot = db.query(CodingProblemVersionModel).filter(
    CodingProblemVersionModel.problem_id == created_prob_id,
    CodingProblemVersionModel.version_number == 1
).first()
has_version_1 = version_snapshot is not None and version_snapshot.title == "Reverse String Function"
record("PB-04", "Initial immutable version snapshot created in database", has_version_1, f"Found: {version_snapshot}")

# --- TEST 5: Multi-Tenant Problem Isolation ---
# Org A recruiter should see this problem
res_a = client.get(f"/api/assessment/problems/{created_prob_id}", headers=headers_rec_a)
# Org B recruiter should NOT be able to see Org A custom problem
res_b = client.get(f"/api/assessment/problems/{created_prob_id}", headers=headers_rec_b)
tenant_isolated = res_a.status_code == 200 and res_b.status_code == 403
record("PB-05", "Multi-tenant problem isolation strictly enforced (Org A ok, Org B 403)", tenant_isolated, f"A: {res_a.status_code}, B: {res_b.status_code}")

# --- TEST 6: Cross-Tenant Modification Rejection ---
res_b_edit = client.put(f"/api/assessment/problems/{created_prob_id}", json={"title": "Hacked Title"}, headers=headers_rec_b)
cross_edit_blocked = res_b_edit.status_code == 403
record("PB-06", "Cross-tenant problem modification blocked with 403 Forbidden", cross_edit_blocked, f"Status: {res_b_edit.status_code}")

# --- TEST 7: System Problem Immutability Guard ---
sys_prob = db.query(CodingProblemModel).filter(CodingProblemModel.is_system == True).first()
if sys_prob:
    res_sys_edit = client.put(f"/api/assessment/problems/{sys_prob.id}", json={"title": "Tampered System Problem"}, headers=headers_rec_a)
    sys_immutability_ok = res_sys_edit.status_code == 403
else:
    sys_immutability_ok = True
record("PB-07", "System problem immutability strictly enforced against recruiter edits", sys_immutability_ok, f"Status: {res_sys_edit.status_code if sys_prob else 'No sys prob'}")

# --- TEST 8: Version Snapshot Generation on Update (v1 -> v2) ---
update_payload = {
    "title": "Reverse String Function (Optimized)",
    "difficulty": "Easy",
    "change_summary": "Added edge case tests and clarified constraints"
}
res_update = client.put(f"/api/assessment/problems/{created_prob_id}", json=update_payload, headers=headers_rec_a)
updated_prob = res_update.json()
prob_updated = res_update.status_code == 200 and updated_prob.get("current_version") == 2
version_2_snapshot = db.query(CodingProblemVersionModel).filter(
    CodingProblemVersionModel.problem_id == created_prob_id,
    CodingProblemVersionModel.version_number == 2
).first()
v2_created = version_2_snapshot is not None and version_2_snapshot.title == "Reverse String Function (Optimized)"
record("PB-08", "Problem update increments version to 2 and snapshots version 2", prob_updated and v2_created, f"Version: {updated_prob.get('current_version')}, snapshot: {version_2_snapshot}")

# --- TEST 9: Hidden Test Case Confidentiality for Candidates ---
# Candidate queries problem details
res_cand_prob = client.get(f"/api/assessment/problems/{sys_prob.id if sys_prob else created_prob_id}", headers=headers_cand)
cand_prob = res_cand_prob.json()
tcs = cand_prob.get("test_cases", [])
# Candidate must NEVER receive input_data or expected_output on hidden test cases
hidden_leaked = any(tc.get("is_hidden") and ("input_data" in tc or "expected_output" in tc) for tc in tcs)
confidentiality_ok = res_cand_prob.status_code == 200 and not hidden_leaked
record("PB-09", "Hidden test case confidentiality strictly protected for candidate view", confidentiality_ok, f"Status: {res_cand_prob.status_code}, hidden leaked: {hidden_leaked}")

# --- TEST 10: Multi-Problem Assessment Attachment & Ordering ---
attach_payload = {
    "problems": [
        {"coding_problem_id": created_prob_id, "display_order": 1, "weight": 50.0, "is_required": True},
        {"coding_problem_id": sys_prob.id, "display_order": 2, "weight": 50.0, "is_required": True}
    ] if sys_prob else [
        {"coding_problem_id": created_prob_id, "display_order": 1, "weight": 100.0, "is_required": True}
    ]
}
res_attach = client.post(f"/api/assessment/{job_a.id}/coding-problems", json=attach_payload, headers=headers_rec_a)
attached = res_attach.json()
attach_ok = res_attach.status_code == 200 and len(attached) >= 1 and attached[0]["display_order"] == 1
# Verify version snapshot was pinned
assoc_record = db.query(AssessmentCodingProblemModel).filter(
    AssessmentCodingProblemModel.coding_problem_id == created_prob_id
).first()
pinned_ver_ok = assoc_record is not None and assoc_record.coding_problem_version_id is not None
record("PB-10", "Multi-problem assessment attachment links problems with pinned version snapshots", attach_ok and pinned_ver_ok, f"Status: {res_attach.status_code}, attached count: {len(attached) if isinstance(attached, list) else 0}")

# --- TEST 11: Real Execution of Custom Authored Problem ---
code_solution = "def reverseString(s):\n    return s[::-1]\n"
exec_res = client.post("/api/assessment/run-code", json={
    "task_id": created_prob_id,
    "code": code_solution,
    "language": "python",
    "execution_mode": "function",
    "entry_point": "reverseString",
    "candidate_id": "recruiter-preview",
    "job_id": job_a.id
}, headers=headers_rec_a)
exec_data = exec_res.json()
all_passed = exec_res.status_code == 200 and exec_data.get("all_passed") is True
record("PB-11", "Custom authored problem executes in function mode and passes all sample tests", all_passed, f"Status: {exec_res.status_code}, console: {exec_data.get('console_output')}, results: {exec_data.get('test_results')}")

print("=" * 70)
print(f"PHASE 4A.3 VERIFICATION SUMMARY: {passed_count}/{total_tests} PASSED ({(passed_count/total_tests)*100:.1f}%)")
print("=" * 70)

db.close()

if passed_count < total_tests:
    sys.exit(1)
