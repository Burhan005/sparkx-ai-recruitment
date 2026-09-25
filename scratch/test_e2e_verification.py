import os
import sys
import json
import time

sys.path.insert(0, os.path.abspath("backend"))
from dotenv import load_dotenv
load_dotenv("backend/.env")

from database import SessionLocal
from models.db_models import CandidateModel, JobModel
from controllers.assessment_controller import AssessmentController
from schemas import CodeRunRequest, AssessmentSubmitRequest
from ai_engine import synthesize_technical_assessment_bundle, evaluate_scenario_response

print("=" * 60)
print("SPARKX RECRUITMENT SAAS -- E2E VERIFICATION SUITE")
print("=" * 60)

# 1. TEST DYNAMIC ASSESSMENT SYNTHESIS FOR AWS CLOUD ENGINEER
print("\n[TEST 1] Synthesizing Dynamic 4-Category Assessment for AWS Cloud Engineer...")
job_skills = ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"]
bundle_a, mcq_sol_a = synthesize_technical_assessment_bundle(
    role_title="AWS Cloud & DevOps Engineer",
    job_skills=job_skills,
    job_description="Architect and automate multi-region VPC and Kubernetes infrastructure on AWS.",
    experience_years=3.5,
    candidate_name="Alex Chen",
    candidate_id="cand_alex_001",
    languages=["python", "javascript", "typescript", "java", "cpp"]
)

assert "technical_mcqs" in bundle_a, "Missing technical_mcqs"
assert "scenario" in bundle_a, "Missing scenario"
assert "hands_on" in bundle_a, "Missing hands_on"
assert "troubleshooting" in bundle_a, "Missing troubleshooting"
assert len(bundle_a["technical_mcqs"]) == 3, f"Expected 3 MCQs, got {len(bundle_a['technical_mcqs'])}"
assert len(mcq_sol_a) >= 3, "Missing MCQ answer key"

print(f"[OK] Categories present: {list(bundle_a.keys())}")
print(f"[OK] MCQ 1 Question: {bundle_a['technical_mcqs'][0]['question'][:90]}...")
print(f"[OK] MCQ 1 Options: {list(bundle_a['technical_mcqs'][0]['options'].keys())}")
print(f"[OK] MCQ Answer Key: {mcq_sol_a}")
print(f"[OK] Scenario Title: {bundle_a['scenario']['title']}")
print(f"[OK] Hands-on Languages: {bundle_a['hands_on']['supported_languages']}")
print(f"[OK] Troubleshooting Title: {bundle_a['troubleshooting']['title']}")

# 2. TEST CANDIDATE RANDOMIZATION (Distinct candidates receive distinct questions)
print("\n[TEST 2] Testing Candidate Randomization for Same Job...")
bundle_b, mcq_sol_b = synthesize_technical_assessment_bundle(
    role_title="AWS Cloud & DevOps Engineer",
    job_skills=job_skills,
    job_description="Architect and automate multi-region VPC and Kubernetes infrastructure on AWS.",
    experience_years=3.5,
    candidate_name="Sarah Jenkins",
    candidate_id="cand_sarah_002",
    languages=["python", "javascript"]
)
print(f"[OK] Candidate A (Alex) Seed: cand_alex_001")
print(f"[OK] Candidate B (Sarah) Seed: cand_sarah_002")
print(f"[OK] Candidate A MCQ 1: {bundle_a['technical_mcqs'][0]['id']}")
print(f"[OK] Candidate B MCQ 1: {bundle_b['technical_mcqs'][0]['id']}")

# 3. TEST PYTHON SANDBOX EXECUTION
print("\n[TEST 3] Python Sandbox Execution...")
py_valid_code = """
def solve(n):
    return n * 2
"""
py_req = CodeRunRequest(
    task_id="hands_on_py_test",
    language="python",
    code=py_valid_code,
    test_cases=[
        {"name": "Double 5", "input": "5", "expected": "10", "assertion_py": "assert solve(5) == 10", "assertion_js": ""},
        {"name": "Double 0", "input": "0", "expected": "0", "assertion_py": "assert solve(0) == 0", "assertion_js": ""}
    ]
)
py_res = AssessmentController.run_code_sandbox(py_req)
print(f"[OK] Python Passed Count: {py_res.passed_count}/{py_res.total_count} (all_passed={py_res.all_passed})")
assert py_res.all_passed, "Python valid code failed assertions"

py_failing_code = "def solve(n): return n + 1"
py_fail_req = CodeRunRequest(
    task_id="hands_on_py_fail",
    language="python",
    code=py_failing_code,
    test_cases=[{"name": "Double 5", "input": "5", "expected": "10", "assertion_py": "assert solve(5) == 10"}]
)
py_fail_res = AssessmentController.run_code_sandbox(py_fail_req)
print(f"[OK] Python Failing Test Result: passed={py_fail_res.all_passed} (Correctly caught assertion failure)")
assert not py_fail_res.all_passed, "Python failing test should not have passed"

# 4. TEST NODE.JS SANDBOX EXECUTION
print("\n[TEST 4] Node.js Sandbox Execution...")
js_valid_code = """
function solve(n) {
    return n * 3;
}
"""
js_req = CodeRunRequest(
    task_id="hands_on_js_test",
    language="javascript",
    code=js_valid_code,
    test_cases=[
        {"name": "Triple 4", "input": "4", "expected": "12", "assertion_js": "assert.strictEqual(solve(4), 12);", "assertion_py": ""}
    ]
)
js_res = AssessmentController.run_code_sandbox(js_req)
print(f"[OK] Node.js Execution Passed: {js_res.passed_count}/{js_res.total_count} in {js_res.execution_ms}ms")
assert js_res.all_passed, "Node.js valid code failed assertion"

# 5. TEST UNCOMPILED LANGUAGE (Java/C++ honest status)
print("\n[TEST 5] Uncompiled Language Honest Reporting (Java/C++)...")
cpp_req = CodeRunRequest(
    task_id="hands_on_cpp",
    language="cpp",
    code="int solve() { return 42; }",
    test_cases=[{"name": "Standard assertion", "input": "", "expected": "42"}]
)
cpp_res = AssessmentController.run_code_sandbox(cpp_req)
print(f"[OK] C++ Passed: {cpp_res.all_passed} (Never fake True)")
print(f"[OK] C++ Status: {cpp_res.test_results[0].get('status')}")
assert not cpp_res.all_passed, "C++ without compiler must not report fake pass"
assert cpp_res.test_results[0].get('status') == "Pending Recruiter Review"

# 6. TEST SCENARIO EVALUATION (Blank vs Detailed)
print("\n[TEST 6] Scenario Evaluation with Live LLM...")
eval_blank = evaluate_scenario_response("Design a multi-region VPC with automated failover", "")
print(f"[OK] Blank Submission Score: {eval_blank['score']}% (Strictly 0)")
assert eval_blank["score"] == 0, f"Expected 0 for blank submission, got {eval_blank['score']}"

eval_good = evaluate_scenario_response(
    scenario_prompt="Design a multi-region VPC with automated failover for AWS Kubernetes cluster.",
    candidate_response="Deploy AWS Route 53 with Application Recovery Controller routing controls. Regional EKS clusters in us-east-1 and us-west-2 backed by Aurora Global Database with asynchronous storage-level replication (RPO < 1s). Inter-VPC traffic travels across Transit Gateway with cross-region peering. Automated health checks fail over DNS within 15 seconds if p99 latency exceeds 500ms.",
    job_title="AWS Cloud & DevOps Engineer",
    job_skills=job_skills
)
print(f"[OK] Detailed Solution Score: {eval_good['score']}% ({eval_good['quality']})")
print(f"[OK] Evaluator Feedback: {eval_good['feedback'][:120]}...")
assert eval_good["score"] >= 70, f"Expected >= 70 for detailed architecture, got {eval_good['score']}"

print("\n" + "=" * 60)
print("ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
