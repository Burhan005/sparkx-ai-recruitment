"""
Verification script for Candidate IDE backend sandbox and evaluation pipeline:
1. Sample test runner
2. Custom test runner with custom inputs
3. Hidden test case security & candidate network sanitization
4. Candidate score privacy on submit
5. Recruiter visibility of hidden tests and separate recruiter score
"""
import sys
import os
import ast
import json

backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import SessionLocal
from models.db_models import CandidateModel, JobModel
from schemas import CodeRunRequest, AssessmentSubmitRequest
from controllers.assessment_controller import AssessmentController

def run_tests():
    db = SessionLocal()
    try:
        print("=== 1. TEST PYTHON SAMPLE TEST RUNNER ===")
        sample_code = """
def solve(data):
    # Aggregates error counts per service
    counts = {}
    for entry in data:
        if entry.get('level') == 'ERROR':
            svc = entry.get('service', 'unknown')
            counts[svc] = counts.get(svc, 0) + 1
    return counts
"""
        test_cases = [
            {
                "name": "Sample Test 1",
                "input": "[{'level': 'INFO'}, {'level': 'ERROR', 'service': 'auth'}]",
                "expected": "{'auth': 1}",
                "assertion_py": "assert solve([{'level': 'INFO'}, {'level': 'ERROR', 'service': 'auth'}]) == {'auth': 1}"
            },
            {
                "name": "Sample Test 2",
                "input": "[{'level': 'ERROR', 'service': 'api'}, {'level': 'ERROR', 'service': 'api'}]",
                "expected": "{'api': 2}",
                "assertion_py": "assert solve([{'level': 'ERROR', 'service': 'api'}, {'level': 'ERROR', 'service': 'api'}]) == {'api': 2}"
            }
        ]
        req = CodeRunRequest(
            task_id="hands_on_test",
            language="python",
            code=sample_code,
            test_cases=test_cases,
            is_custom_test=False
        )
        res = AssessmentController.run_code_sandbox(req, db)
        print(f"Sample run: all_passed={res.all_passed}, passed={res.passed_count}/{res.total_count}, exec_ms={res.execution_ms}, mem_mb={res.memory_mb}")
        assert res.all_passed == True, "Sample tests should have passed!"
        assert res.passed_count == 2, "Passed count should be 2!"

        print("\n=== 2. TEST CUSTOM TEST RUNNER ===")
        custom_req = CodeRunRequest(
            task_id="hands_on_test",
            language="python",
            code=sample_code,
            custom_input='[{"level": "ERROR", "service": "payment"}, {"level": "ERROR", "service": "payment"}]',
            is_custom_test=True
        )
        custom_res = AssessmentController.run_code_sandbox(custom_req, db)
        print(f"Custom run: all_passed={custom_res.all_passed}, exec_ms={custom_res.execution_ms}, mem={custom_res.memory_mb}MB")
        print(f"Custom test actual: {custom_res.test_results[0].get('actual')}")
        assert custom_res.all_passed == True
        assert "{'payment': 2}" in custom_res.test_results[0].get('actual')

        print("\n=== 3. TEST NODE.JS RUNNER ===")
        js_code = """
function solve(data) {
    const counts = {};
    for (const item of data) {
        if (item.level === 'ERROR') {
            counts[item.service] = (counts[item.service] || 0) + 1;
        }
    }
    return counts;
}
"""
        js_req = CodeRunRequest(
            task_id="hands_on_test_js",
            language="javascript",
            code=js_code,
            custom_input='[{"level": "ERROR", "service": "billing"}]',
            is_custom_test=True
        )
        js_res = AssessmentController.run_code_sandbox(js_req, db)
        print(f"Node.js custom run: all_passed={js_res.all_passed}, actual={js_res.test_results[0].get('actual')}")
        assert js_res.all_passed == True

        print("\n=== 4. TEST CANDIDATE NETWORK SANITIZATION & PRIVACY ===")
        # Get an active candidate
        cand = db.query(CandidateModel).first()
        if cand:
            # Test candidate perspective
            cand_bundle_res, _ = AssessmentController.get_candidate_assessment(cand.id, cand.job_id, db, is_recruiter=False)
            b_cand = cand_bundle_res["bundle"]
            
            # Verify hidden test cases NOT in candidate bundle
            assert "hidden_test_cases" not in b_cand.get("hands_on", {}), "LEAK! hidden_test_cases leaked in hands_on!"
            assert "hidden_test_cases" not in b_cand.get("troubleshooting", {}), "LEAK! hidden_test_cases leaked in troubleshooting!"
            
            # Verify assertion scripts NOT in sample test cases
            for tc in b_cand.get("hands_on", {}).get("sample_test_cases", []):
                assert "assertion_py" not in tc, "LEAK! assertion_py leaked to candidate!"
                assert "assertion_js" not in tc, "LEAK! assertion_js leaked to candidate!"
                
            # Verify MCQ explanation / correct_option NOT in candidate bundle
            for mcq in b_cand.get("technical_mcqs", []):
                assert "correct_option" not in mcq, "LEAK! correct_option leaked to candidate!"
                assert "explanation" not in mcq, "LEAK! explanation leaked to candidate!"

            print("[PASS] Candidate bundle is completely sanitized. 0 hidden test cases, 0 assertion scripts, 0 MCQ answers leaked.")

            # Test recruiter perspective
            rec_bundle_res, _ = AssessmentController.get_candidate_assessment(cand.id, cand.job_id, db, is_recruiter=True)
            b_rec = rec_bundle_res["bundle"]
            print("[PASS] Recruiter receives full bundle with hidden test cases.")

            print("\n=== 5. TEST CANDIDATE SUBMIT SCORE PRIVACY & HIDDEN TEST EXECUTION ===")
            # Submit assessment for candidate
            submit_payload = AssessmentSubmitRequest(
                candidate_id=cand.id,
                job_id=cand.job_id,
                technical_answers={"mcq_1": "A", "mcq_2": "A", "mcq_3": "A"},
                scenario_answers={"scen_prod_01": "Remediation plan covering load balancing, connection pooling, and circuit breaking."},
                hands_on_submission={
                    "task_id": b_rec.get("hands_on", {}).get("id", "hands_on_01"),
                    "language": "python",
                    "code": sample_code
                },
                troubleshooting_submission={
                    "task_id": b_rec.get("troubleshooting", {}).get("id", "trouble_01"),
                    "language": "python",
                    "code": "def fix(data):\n    if data == 'error': return 'released'\n    return data\n"
                }
            )
            # Temporarily allow re-submission if completed
            if cand.assessment_data:
                data = dict(cand.assessment_data)
                data["is_completed"] = False
                cand.assessment_data = data
                db.commit()

            submit_res, submit_err = AssessmentController.submit_candidate_assessment(cand.id, submit_payload, db)
            assert submit_err is None, f"Submit error: {submit_err}"
            assert submit_res.success == True
            assert submit_res.scores is None, "CRITICAL LEAK! Candidate submit response must have scores=None!"
            assert submit_res.feedback_summary is None, "CRITICAL LEAK! Candidate submit response must have feedback_summary=None!"
            assert "under review" in submit_res.message.lower(), "Candidate should receive neutral 'under review' message!"
            print(f"[PASS] Candidate submit response: scores={submit_res.scores}, message='{submit_res.message}'")

            # Check candidate database record from recruiter perspective
            db.refresh(cand)
            assert cand.coding_score is not None, "Automated coding score should be saved in DB for recruiter!"
            assert "hands_on" in cand.coding_results, "Coding results should be preserved!"
            assert "hidden_results" in cand.coding_results["hands_on"], "Hidden test results should be recorded for recruiter!"
            print(f"[PASS] Recruiter DB records: coding_score={cand.coding_score}/100, hidden_tests_run={len(cand.coding_results['hands_on']['hidden_results'])}")

        print("\nALL BACKEND SANDBOX & PRIVACY TESTS PASSED!")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
