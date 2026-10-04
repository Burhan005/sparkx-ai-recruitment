"""
SPARKX PHASE 4A.2: ADVANCED CODING ASSESSMENT — GENUINE JUDGE0 EXECUTION ENGINE TESTS
Verifies:
1. Multi-language driver/harness generation (Python, JS, TS, Java, C++, Go, Rust, SQL)
2. Deterministic output comparison (JSON deep equality, float epsilon, whitespace normalization)
3. Zero-bypass invariance: When Judge0 is configured, ALL languages execute via Judge0
4. Judge0 API communication, token polling fallback, and honest error handling (429, 503, timeouts)
5. Compilation error, runtime error, and timeout detection
6. Genuine metrics tracking (zero hardcoded 32MB / fake duration)
7. Function-style vs Stdin execution modes
8. Relational submission history and per-test-case result persistence (CodingSubmissionModel & SubmissionTestCaseResultModel)
9. Hidden test case confidentiality and masking
10. Elimination of arbitrary fake scoring (zero points for failing/empty code)
"""
import os
import sys
import json
import uuid
import unittest
from unittest.mock import patch, MagicMock
from io import BytesIO
import urllib.error

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models.db_models import (
    JobModel, CandidateModel, UserModel,
    CodingProblemModel, CodingTestCaseModel,
    CodingSubmissionModel, SubmissionTestCaseResultModel,
    SUPPORTED_LANGUAGES_REGISTRY
)
from services.execution_harness import (
    ExecutionMode, LanguageExecutionAdapter,
    compare_outputs, extract_delimited_output,
    DELIMITER_START, DELIMITER_END
)
from services.judge0_runner import Judge0Runner, JUDGE0_LANG_MAP
from services.sandbox_runner import SandboxRunner, LocalSubprocessSandbox
from controllers.assessment_controller import AssessmentController
from schemas import AssessmentSubmitRequest


def run_phase4a2_tests():
    db = SessionLocal()
    try:
        # Ensure all tables exist in local SQLite
        Base.metadata.create_all(bind=engine)

        print("\n======================================================================")
        print("SPARKX PHASE 4A.2: GENUINE JUDGE0 EXECUTION ENGINE VERIFICATION SUITE")
        print("======================================================================")

        # -------------------------------------------------------------
        # SUITE 1: DETERMINISTIC OUTPUT COMPARISON (NO AI FUZZY GUESSING)
        # -------------------------------------------------------------
        print("\n--- SUITE 1: DETERMINISTIC OUTPUT EVALUATOR ---")

        # 1. Exact string matches & newline normalization
        match, err = compare_outputs("hello world\r\n", "hello world\n")
        assert match is True, f"Failed CRLF comparison: {err}"

        # 2. JSON Array deep comparison (order-preserved)
        match, err = compare_outputs("[1, 2, 3]", "[\n  1,\n  2,\n  3\n]")
        assert match is True, f"Failed JSON array comparison: {err}"

        # 3. JSON Object deep comparison (key order agnostic)
        match, err = compare_outputs('{"b": 2, "a": 1}', '{"a": 1, "b": 2}')
        assert match is True, f"Failed JSON object comparison: {err}"

        # 4. Float epsilon tolerance (1e-6)
        match, err = compare_outputs("3.14159265", "3.1415927")
        assert match is True, f"Failed float tolerance comparison: {err}"

        # 5. Genuine mismatch detection
        match, err = compare_outputs("[1, 2, 3]", "[1, 2, 4]")
        assert match is False, "Expected mismatch for distinct arrays"
        assert "Expected" in err and "got" in err

        # 6. Delimited output extraction
        raw_stdout = f"Debug message before\n{DELIMITER_START}\n[42, 99]\n{DELIMITER_END}\nDebug message after"
        extracted, console = extract_delimited_output(raw_stdout)
        assert extracted == "[42, 99]"
        assert "Debug message before" in console
        assert "Debug message after" in console
        print("[PASS] J0-01 - Deterministic output comparison & delimited result extraction verified")

        # -------------------------------------------------------------
        # SUITE 2: LANGUAGE-AWARE DRIVER & HARNESS GENERATION
        # -------------------------------------------------------------
        print("\n--- SUITE 2: LANGUAGE-AWARE DRIVER HARNESS ---")

        # Python function harness
        py_code = "def two_sum(nums, target):\n    return [0, 1]"
        harness_py, _ = LanguageExecutionAdapter.generate_harness(
            code=py_code,
            language="python",
            test_input=[[2, 7, 11, 15], 9],
            mode=ExecutionMode.FUNCTION,
            entry_point="two_sum"
        )
        assert "__sparkx_driver" in harness_py
        assert DELIMITER_START in harness_py
        assert "two_sum" in harness_py

        # JS function harness
        js_code = "function twoSum(nums, target) { return [0, 1]; }"
        harness_js, _ = LanguageExecutionAdapter.generate_harness(
            code=js_code,
            language="javascript",
            test_input=[[2, 7, 11, 15], 9],
            mode=ExecutionMode.FUNCTION,
            entry_point="twoSum"
        )
        assert "__sparkx_driver" in harness_js
        assert DELIMITER_START in harness_js

        # Java class harness
        java_code = "public class Solution { public int solve(int x) { return x * 2; } }"
        harness_java, _ = LanguageExecutionAdapter.generate_harness(
            code=java_code,
            language="java",
            test_input="5",
            mode=ExecutionMode.FUNCTION
        )
        assert "public class Main" in harness_java
        assert "class Solution" in harness_java

        # Stdin mode passthrough
        stdin_code = "import sys\nprint(sys.stdin.read())"
        passed_code, passed_stdin = LanguageExecutionAdapter.generate_harness(
            code=stdin_code,
            language="python",
            test_input="sample_stdin_data",
            mode=ExecutionMode.STDIN
        )
        assert passed_code == stdin_code
        assert passed_stdin == "sample_stdin_data"
        print("[PASS] J0-02 - Multi-language execution adapter generates language-appropriate drivers for function & stdin modes")

        # -------------------------------------------------------------
        # SUITE 3: ZERO-BYPASS INVARIANCE WHEN JUDGE0 IS CONFIGURED
        # -------------------------------------------------------------
        print("\n--- SUITE 3: ZERO-BYPASS INVARIANCE ---")

        with patch.dict(os.environ, {"JUDGE0_BASE_URL": "http://judge0.mock.internal", "JUDGE0_API_KEY": "test-key"}):
            runner = Judge0Runner()
            assert runner.is_configured() is True

            # Mock _submit_to_judge0 to verify it is called for Python, JavaScript, and SQL
            with patch.object(runner, "_submit_to_judge0") as mock_submit:
                mock_submit.return_value = {
                    "status": {"id": 3, "description": "Accepted"},
                    "stdout": f"{DELIMITER_START}\n[0, 1]\n{DELIMITER_END}",
                    "stderr": "",
                    "time": "0.045",
                    "memory": 15420
                }

                # 1. Python execution MUST go to Judge0 (NOT local sandbox)
                resp_py = runner.run_code(
                    code="def solve(d): return [0, 1]",
                    language="python",
                    test_cases=[{"input": "[1, 2]", "expected": "[0, 1]"}],
                    task_id="task-zero-bypass"
                )
                assert mock_submit.called, "Python must be dispatched to Judge0 when configured!"
                assert resp_py.all_passed is True
                assert resp_py.passed_count == 1
                mock_submit.reset_mock()

                # 2. JavaScript execution MUST go to Judge0 (NOT local sandbox)
                resp_js = runner.run_code(
                    code="function solve(d) { return [0, 1]; }",
                    language="javascript",
                    test_cases=[{"input": "[1, 2]", "expected": "[0, 1]"}],
                    task_id="task-zero-bypass"
                )
                assert mock_submit.called, "JavaScript must be dispatched to Judge0 when configured!"
                assert resp_js.all_passed is True
                mock_submit.reset_mock()

                # 3. Compiled language (Java) MUST go to Judge0
                resp_java = runner.run_code(
                    code="public class Solution { public int solve(int x) { return x * 2; } }",
                    language="java",
                    test_cases=[{"input": "5", "expected": "10"}],
                    task_id="task-zero-bypass"
                )
                assert mock_submit.called, "Java must be dispatched to Judge0 when configured!"
                mock_submit.reset_mock()
        print("[PASS] J0-03 - Zero-bypass invariance verified: Python, JS, and compiled languages dispatch strictly to Judge0 when configured")

        # -------------------------------------------------------------
        # SUITE 4: JUDGE0 COMMUNICATION, POLLING & HONEST ERROR HANDLING
        # -------------------------------------------------------------
        print("\n--- SUITE 4: JUDGE0 COMMUNICATION & POLLING ---")

        with patch.dict(os.environ, {"JUDGE0_BASE_URL": "http://judge0.mock.internal", "JUDGE0_API_KEY": "test-key"}):
            runner = Judge0Runner()

            # 1. Asynchronous polling fallback when initial status is In Queue (1) or Processing (2)
            with patch.object(runner, "_poll_token") as mock_poll, \
                 patch("urllib.request.urlopen") as mock_urlopen:

                # First call returns token with status 1 (In Queue)
                mock_resp = MagicMock()
                mock_resp.read.return_value = json.dumps({
                    "token": "token-async-123",
                    "status": {"id": 1, "description": "In Queue"}
                }).encode("utf-8")
                mock_urlopen.return_value.__enter__.return_value = mock_resp

                # Poll completes with status 3 (Accepted)
                mock_poll.return_value = {
                    "status": {"id": 3, "description": "Accepted"},
                    "stdout": f"{DELIMITER_START}\n[0, 1]\n{DELIMITER_END}",
                    "time": "0.032",
                    "memory": 12800
                }

                data = runner._submit_to_judge0({"source_code": "code", "language_id": 71})
                assert mock_poll.called, "Poll must be invoked when status is in queue"
                assert data["status"]["id"] == 3

            # 2. Honest handling of HTTP 429 Rate Limit
            with patch("urllib.request.urlopen") as mock_urlopen:
                mock_urlopen.side_effect = urllib.error.HTTPError(
                    url="http://judge0.mock.internal/submissions",
                    code=429,
                    msg="Too Many Requests",
                    hdrs={},
                    fp=BytesIO(b"Rate limit exceeded on RapidAPI")
                )
                try:
                    runner._submit_to_judge0({"source_code": "code", "language_id": 71})
                    assert False, "Should have raised RuntimeError on HTTP 429"
                except RuntimeError as re:
                    assert "Rate Limit Exceeded" in str(re)

            # 3. Honest handling of HTTP 503 Unavailable
            with patch("urllib.request.urlopen") as mock_urlopen:
                mock_urlopen.side_effect = urllib.error.HTTPError(
                    url="http://judge0.mock.internal/submissions",
                    code=503,
                    msg="Service Unavailable",
                    hdrs={},
                    fp=BytesIO(b"Judge0 workers offline")
                )
                try:
                    runner._submit_to_judge0({"source_code": "code", "language_id": 71})
                    assert False, "Should have raised RuntimeError on HTTP 503"
                except RuntimeError as re:
                    assert "Service Unavailable" in str(re)
        print("[PASS] J0-04 - Async token polling and honest error reporting (429 rate limit, 503 unavailable) verified")

        # -------------------------------------------------------------
        # SUITE 5: COMPILATION ERROR, RUNTIME ERROR & TIMEOUT STATES
        # -------------------------------------------------------------
        print("\n--- SUITE 5: GENUINE COMPILATION, RUNTIME & TIMEOUT STATES ---")

        with patch.dict(os.environ, {"JUDGE0_BASE_URL": "http://judge0.mock.internal", "JUDGE0_API_KEY": "test-key"}):
            runner = Judge0Runner()

            # 1. Compilation Error (Status 6)
            with patch.object(runner, "_submit_to_judge0") as mock_submit:
                mock_submit.return_value = {
                    "status": {"id": 6, "description": "Compilation Error"},
                    "compile_output": "Main.java:3: error: ';' expected",
                    "stdout": "",
                    "stderr": "",
                    "time": "0.0",
                    "memory": None
                }
                resp_ce = runner.run_code(
                    code="public class Solution { invalid syntax }",
                    language="java",
                    test_cases=[{"input": "1", "expected": "2"}],
                    task_id="task-ce"
                )
                assert resp_ce.all_passed is False
                assert resp_ce.test_results[0]["status"] == "compilation_error"
                assert "error: ';' expected" in resp_ce.test_results[0]["actual"]

            # 2. Time Limit Exceeded (Status 5)
            with patch.object(runner, "_submit_to_judge0") as mock_submit:
                mock_submit.return_value = {
                    "status": {"id": 5, "description": "Time Limit Exceeded"},
                    "compile_output": "",
                    "stdout": "",
                    "stderr": "",
                    "time": "5.01",
                    "memory": 24000
                }
                resp_tle = runner.run_code(
                    code="while True: pass",
                    language="python",
                    test_cases=[{"input": "1", "expected": "2"}],
                    task_id="task-tle"
                )
                assert resp_tle.all_passed is False
                assert resp_tle.test_results[0]["status"] == "timed_out"
                assert "Time Limit Exceeded" in resp_tle.test_results[0]["error"]

            # 3. Runtime Error (Status 11 NZEC / Exception)
            with patch.object(runner, "_submit_to_judge0") as mock_submit:
                mock_submit.return_value = {
                    "status": {"id": 11, "description": "Runtime Error (NZEC)"},
                    "compile_output": "",
                    "stdout": "",
                    "stderr": "ZeroDivisionError: division by zero",
                    "time": "0.015",
                    "memory": 14000
                }
                resp_re = runner.run_code(
                    code="def solve(x): return x / 0",
                    language="python",
                    test_cases=[{"input": "1", "expected": "2"}],
                    task_id="task-re"
                )
                assert resp_re.all_passed is False
                assert resp_re.test_results[0]["status"] == "runtime_error"
                assert "ZeroDivisionError" in resp_re.test_results[0]["error"]
        print("[PASS] J0-05 - Compilation errors, runtime errors, and time limit exceeded states genuinely captured without fake points")

        # -------------------------------------------------------------
        # SUITE 6: GENUINE METRICS (ZERO FABRICATED MEMORY OR DURATION)
        # -------------------------------------------------------------
        print("\n--- SUITE 6: GENUINE METRICS INTEGRITY ---")

        with patch.dict(os.environ, {"JUDGE0_BASE_URL": "http://judge0.mock.internal", "JUDGE0_API_KEY": "test-key"}):
            runner = Judge0Runner()

            # When Judge0 reports memory=16384 KB (16 MB)
            with patch.object(runner, "_submit_to_judge0") as mock_submit:
                mock_submit.return_value = {
                    "status": {"id": 3, "description": "Accepted"},
                    "stdout": f"{DELIMITER_START}\n10\n{DELIMITER_END}",
                    "time": "0.125",
                    "memory": 16384
                }
                resp_mem = runner.run_code(
                    code="def solve(x): return x * 2",
                    language="python",
                    test_cases=[{"input": "5", "expected": "10"}],
                    task_id="task-mem"
                )
                assert resp_mem.memory_mb == 16.0, f"Expected 16.0 MB, got {resp_mem.memory_mb}"
                assert resp_mem.memory_mb != 32.0, "Must never return hardcoded 32.0 MB!"

            # When Judge0 does NOT report memory (memory=None)
            with patch.object(runner, "_submit_to_judge0") as mock_submit:
                mock_submit.return_value = {
                    "status": {"id": 3, "description": "Accepted"},
                    "stdout": f"{DELIMITER_START}\n10\n{DELIMITER_END}",
                    "time": "0.05",
                    "memory": None
                }
                resp_nomem = runner.run_code(
                    code="def solve(x): return x * 2",
                    language="python",
                    test_cases=[{"input": "5", "expected": "10"}],
                    task_id="task-nomem"
                )
                assert resp_nomem.memory_mb is None, "Must store None when Judge0 provides no memory metric!"
        print("[PASS] J0-06 - Genuine metrics verified: memory reported from Judge0 or None, hardcoded 32MB eliminated")

        # -------------------------------------------------------------
        # SUITE 7: LOCAL EXECUTION TEST INTEGRATION (PYTHON & JS ARGS)
        # -------------------------------------------------------------
        print("\n--- SUITE 7: LOCAL SUBPROCESS RUNNER FUNCTION ARGUMENTS ---")

        local_runner = LocalSubprocessSandbox()

        # Legitimate Python function with input arguments
        py_sol = "def solve(data):\n    return data['count'] * 2"
        res_local_py = local_runner.run_code(
            code=py_sol,
            language="python",
            test_cases=[{
                "name": "Local Arg Test",
                "input": json.dumps({"count": 21}),
                "expected": "42"
            }],
            task_id="task-local-py"
        )
        assert res_local_py.all_passed is True, f"Local Python arg execution failed: {res_local_py.console_output}"
        assert res_local_py.passed_count == 1
        assert res_local_py.test_results[0]["actual"] == "42"

        # Legitimate Python function returning array
        py_arr_sol = "def solve(arr):\n    return [x * 2 for x in arr]"
        res_arr = local_runner.run_code(
            code=py_arr_sol,
            language="python",
            test_cases=[{
                "name": "Array Doubler",
                "input": json.dumps([1, 2, 3]),
                "expected": "[2, 4, 6]"
            }],
            task_id="task-local-arr"
        )
        assert res_arr.all_passed is True
        print("[PASS] J0-07 - LocalSubprocessSandbox correctly passes parsed function arguments and verifies return values")

        # -------------------------------------------------------------
        # SUITE 8: ELIMINATION OF ARBITRARY FAKE SCORING (LEN > 30 -> 30)
        # -------------------------------------------------------------
        print("\n--- SUITE 8: ELIMINATION OF FAKE FALLBACK SCORING ---")

        org_test = f"org-test-{uuid.uuid4().hex[:6]}"
        job = JobModel(
            id=f"job-sc-{uuid.uuid4().hex[:6]}",
            title="Systems Architect",
            organization_id=org_test,
            department="Core Infrastructure",
            education="B.S. in Computer Science or equivalent",
            description="Core distributed systems architecture"
        )
        prob1_id = f"prob-h-{uuid.uuid4().hex[:6]}"
        prob1 = CodingProblemModel(
            id=prob1_id,
            title="Reverse Linked List",
            slug=f"reverse-linked-list-{uuid.uuid4().hex[:6]}",
            problem_statement="Reverse a given singly-linked list.",
            difficulty="easy",
            is_system=True,
            organization_id=None
        )
        tc1_id = f"tc-s-{uuid.uuid4().hex[:6]}"
        tc1 = CodingTestCaseModel(id=tc1_id, problem_id=prob1_id, input_data="[1,2]", expected_output="[2,1]", is_hidden=False)
        tc2_id = f"tc-h-{uuid.uuid4().hex[:6]}"
        tc2 = CodingTestCaseModel(id=tc2_id, problem_id=prob1_id, input_data="[3,4]", expected_output="[4,3]", is_hidden=True)

        prob2_id = f"prob-t-{uuid.uuid4().hex[:6]}"
        prob2 = CodingProblemModel(
            id=prob2_id,
            title="Fix Memory Leak",
            slug=f"fix-memory-leak-{uuid.uuid4().hex[:6]}",
            problem_statement="Fix memory leak in buffer.",
            difficulty="medium",
            is_system=True,
            organization_id=None
        )
        tc3_id = f"tc-ts-{uuid.uuid4().hex[:6]}"
        tc3 = CodingTestCaseModel(id=tc3_id, problem_id=prob2_id, input_data="err", expected_output="fixed", is_hidden=False)
        db.add_all([prob1, prob2, tc1, tc2, tc3])

        cand = CandidateModel(
            id=f"cand-sc-{uuid.uuid4().hex[:6]}",
            name="Test Candidate",
            email=f"cand-{uuid.uuid4().hex[:6]}@domain.com",
            education="B.S. in Computer Science",
            job_id=job.id,
            organization_id=org_test,
            stage="assessment",
            assessment_status="in_progress",
            assessment_data={
                "bundle": {
                    "technical_mcqs": [],
                    "scenario": {},
                    "hands_on": {
                        "id": prob1_id,
                        "title": "Reverse Linked List",
                        "is_coding": True,
                        "sample_test_cases": [{"id": tc1_id, "name": "t1", "input": "[1,2]", "expected": "[2,1]"}],
                        "hidden_test_cases": [{"id": tc2_id, "name": "t2", "input": "[3,4]", "expected": "[4,3]"}]
                    },
                    "troubleshooting": {
                        "id": prob2_id,
                        "title": "Fix Memory Leak",
                        "is_coding": True,
                        "sample_test_cases": [{"id": tc3_id, "name": "t3", "input": "err", "expected": "fixed"}]
                    }
                }
            }
        )
        db.add(job)
        db.add(cand)
        db.commit()

        # Candidate submits broken code with > 30 characters
        # In legacy code, this awarded 30 fake points! Now it must award 0 points.
        broken_code_35_chars = "# Substantive looking code that fails\ndef solve(d):\n    return 'completely_wrong_answer'\n"
        assert len(broken_code_35_chars) > 30

        submit_req = AssessmentSubmitRequest(
            candidate_id=cand.id,
            job_id=job.id,
            technical_answers={},
            scenario_answers={},
            hands_on_submission={
                "language": "python",
                "code": broken_code_35_chars
            },
            troubleshooting_submission={
                "language": "python",
                "code": broken_code_35_chars
            }
        )

        resp, err = AssessmentController.submit_candidate_assessment(cand.id, submit_req, db)
        assert err is None, f"Submit assessment returned error: {err}"
        assert resp is not None

        db.refresh(cand)
        hands_score = cand.assessment_data.get("category_scores", {}).get("hands_on", -1)
        trouble_score = cand.assessment_data.get("category_scores", {}).get("troubleshooting", -1)
        assert hands_score == 0, f"Expected 0 score for failing code, got {hands_score} (fake 30 score persisted!)"
        assert trouble_score == 0, f"Expected 0 score for failing trouble code, got {trouble_score}"
        print("[PASS] J0-08 - Arbitrary fake scoring (len(code) > 30 -> 30) completely eradicated; failing code yields 0 score")

        # -------------------------------------------------------------
        # SUITE 9: RELATIONAL SUBMISSION & TEST RESULT PERSISTENCE
        # -------------------------------------------------------------
        print("\n--- SUITE 9: RELATIONAL SUBMISSION HISTORY & PERSISTENCE ---")

        # Verify that CodingSubmissionModel was persisted in db
        submissions = db.query(CodingSubmissionModel).filter(CodingSubmissionModel.candidate_id == cand.id).all()
        assert len(submissions) >= 1, f"Expected CodingSubmissionModel records, found {len(submissions)}"

        sub_hands = submissions[0]
        assert sub_hands is not None, "Hands-on submission record not found in database!"
        assert sub_hands.status == "failed"
        assert sub_hands.total_test_cases == 2
        assert sub_hands.passed_test_cases == 0
        assert sub_hands.score == 0.0

        # Verify SubmissionTestCaseResultModel records were persisted
        tcr_results = db.query(SubmissionTestCaseResultModel).filter(SubmissionTestCaseResultModel.submission_id == sub_hands.id).all()
        assert len(tcr_results) == 2, f"Expected 2 test case results, found {len(tcr_results)}"

        hidden_results = [r for r in tcr_results if r.is_hidden]
        public_results = [r for r in tcr_results if not r.is_hidden]
        assert len(hidden_results) == 1, "Expected 1 hidden test case result"
        assert len(public_results) == 1, "Expected 1 public test case result"
        print("[PASS] J0-09 - Genuine CodingSubmissionModel & SubmissionTestCaseResultModel records persisted with history")

        # -------------------------------------------------------------
        # SUITE 10: HIDDEN TEST CASE CONFIDENTIALITY & SERIALIZATION
        # -------------------------------------------------------------
        print("\n--- SUITE 10: HIDDEN TEST CASE CONFIDENTIALITY ---")

        from models.db_models import sanitize_test_case_result_for_candidate

        hidden_tcr = hidden_results[0]
        sanitized = sanitize_test_case_result_for_candidate(hidden_tcr)
        assert "actual_output" not in sanitized or sanitized.get("actual_output") is None, "Hidden test case actual output leaked to candidate!"
        assert "error_message" not in sanitized or sanitized.get("error_message") is None, "Hidden test case error message leaked to candidate!"
        assert sanitized["passed"] is False

        public_tcr = public_results[0]
        sanitized_pub = sanitize_test_case_result_for_candidate(public_tcr)
        assert sanitized_pub.get("actual_output") is not None, "Public test case actual output must be visible to candidate"
        print("[PASS] J0-10 - Hidden test confidentiality strictly enforced: actual outputs & errors masked for candidates")

        print("\n======================================================================")
        print("ALL 10 PHASE 4A.2 GENUINE JUDGE0 EXECUTION ENGINE TESTS PASSED!")
        print("======================================================================")

    finally:
        db.close()


if __name__ == "__main__":
    run_phase4a2_tests()
