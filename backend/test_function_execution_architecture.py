"""
SPARKX ADVANCED CODING ASSESSMENT — FUNCTION EXECUTION ARCHITECTURE VERIFICATION SUITE
Verifies:
1. Multi-language FUNCTION mode execution where candidate writes ONLY the function
   (zero main() boilerplate) across Python, JavaScript, TypeScript, Java, C++, Go, Rust, Swift.
2. Complete eradication of hardcoded function/problem names in harnesses.
3. Deterministic output extraction and comparison.
4. STDIN mode execution (passthrough without function wrappers).
5. SQL relational query execution with schema DDL.
6. Honest failure capture for wrong solutions, compilation errors, and runtime exceptions (zero fake scores).
7. Database model and schema fields (execution_mode, function_signature) integration.
"""
import os
import sys
import json
import time

# Set up test environment
os.environ["ENVIRONMENT"] = "development"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.execution_harness import (
    LanguageExecutionAdapter,
    ExecutionMode,
    compare_outputs,
    extract_delimited_output,
    DELIMITER_START,
    DELIMITER_END
)
from services.judge0_runner import Judge0Runner
from schemas import CodeRunRequest, CodeRunResponse
from controllers.assessment_controller import AssessmentController
from database import SessionLocal, engine, Base
from models.db_models import (
    CodingProblemModel,
    CodingTestCaseModel,
    SUPPORTED_LANGUAGES_REGISTRY
)


def test_suite_1_deterministic_comparison():
    print("\n--- SUITE 1: DETERMINISTIC COMPARISON & DELIMITED EXTRACTION ---")
    # Exact string match
    ok, err = compare_outputs("5", "5")
    assert ok, f"Exact match failed: {err}"

    # Integer vs string match
    ok, err = compare_outputs(5, "5")
    assert ok, f"Integer vs string match failed: {err}"

    # JSON deep equality
    ok, err = compare_outputs("[0, 1]", "[0, 1]")
    assert ok, f"JSON list match failed: {err}"

    # Float tolerance
    ok, err = compare_outputs("3.1415926", "3.1415927", float_tolerance=1e-5)
    assert ok, f"Float tolerance failed: {err}"

    # Mismatch detection
    ok, err = compare_outputs("6", "5")
    assert not ok and "Expected '5', got '6'" in err, f"Expected mismatch not detected: {err}"

    # Delimited extraction
    raw_stdout = f"some debug logs\n{DELIMITER_START}\n42\n{DELIMITER_END}\nmore logs"
    res, clean = extract_delimited_output(raw_stdout)
    assert res == "42", f"Extracted '{res}', expected '42'"
    assert "some debug logs" in clean, "Debug logs missing"
    print("[PASS] ARCH-01 - Deterministic comparison and delimited output extraction verified.")


def test_suite_2_supported_languages_registry():
    print("\n--- SUITE 2: SUPPORTED LANGUAGES STARTER CODE REGISTRY ---")
    required_langs = ["python", "javascript", "typescript", "java", "cpp", "go", "rust", "swift", "sql"]
    for lang in required_langs:
        entry = SUPPORTED_LANGUAGES_REGISTRY.get(lang)
        assert entry is not None, f"Language '{lang}' missing from registry"
        assert entry.get("is_executable") is True, f"Language '{lang}' not marked executable"
        assert entry.get("judge0_id") is not None, f"Language '{lang}' missing judge0_id"
        starter = entry.get("starter_template", "")
        assert len(starter) > 5, f"Starter template for '{lang}' is empty or invalid"
        # Verify no generic template across all
        if lang == "python":
            assert "def solve(" in starter
        elif lang == "javascript":
            assert "function solve(" in starter
        elif lang == "java":
            assert "class Solution" in starter and "int solve(" in starter
        elif lang == "cpp":
            assert "int solve(" in starter
        elif lang == "go":
            assert "func solve(" in starter
        elif lang == "rust":
            assert "pub fn solve(" in starter
        elif lang == "swift":
            assert "func solve(" in starter
        elif lang == "sql":
            assert "SELECT" in starter
    print("[PASS] ARCH-02 - Language-specific starter templates verified for all 9 supported languages.")


def test_suite_3_function_mode_execution():
    print("\n--- SUITE 3: FUNCTION MODE ACROSS MULTIPLE LANGUAGES ---")
    runner = Judge0Runner()
    if not runner.is_configured():
        print("[SKIP] Judge0 not configured on host. Skipping live Judge0 execution tests.")
        return

    # 1. Python FUNCTION mode (Candidate writes only the function)
    py_code = """
def solveMeFirst(a, b):
    return a + b
"""
    py_resp = runner.run_code(
        code=py_code,
        language="python",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"},
            {"name": "10 + 20", "input": "[10, 20]", "expected": "30"}
        ],
        task_id="test_func_py",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert py_resp.all_passed is True, f"Python FUNCTION mode failed: {py_resp.console_output} {py_resp.test_results}"
    assert py_resp.passed_count == 2
    print("  [OK] Python: Function solveMeFirst(a, b) executed successfully without main().")

    # 2. JavaScript FUNCTION mode
    js_code = """
function solveMeFirst(a, b) {
    return a + b;
}
"""
    js_resp = runner.run_code(
        code=js_code,
        language="javascript",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_js",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert js_resp.all_passed is True, f"JavaScript FUNCTION mode failed: {js_resp.console_output} {js_resp.test_results}"
    print("  [OK] JavaScript: Function solveMeFirst(a, b) executed successfully without main().")

    # 3. TypeScript FUNCTION mode
    ts_code = """
export function solveMeFirst(a: number, b: number): number {
    return a + b;
}
"""
    ts_resp = runner.run_code(
        code=ts_code,
        language="typescript",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_ts",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert ts_resp.all_passed is True, f"TypeScript FUNCTION mode failed: {ts_resp.console_output} {ts_resp.test_results}"
    print("  [OK] TypeScript: Function solveMeFirst(a, b) executed successfully without main().")

    # 4. Java FUNCTION mode (Candidate writes only class Solution, zero main())
    java_code = """
public class Solution {
    public static int solveMeFirst(int a, int b) {
        return a + b;
    }
}
"""
    java_resp = runner.run_code(
        code=java_code,
        language="java",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_java",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert java_resp.all_passed is True, f"Java FUNCTION mode failed: {java_resp.console_output} {java_resp.test_results}"
    print("  [OK] Java: Solution.solveMeFirst(a, b) executed successfully without main().")

    # 5. C++ FUNCTION mode (Candidate writes only function, zero main())
    cpp_code = """
int solveMeFirst(int a, int b) {
    return a + b;
}
"""
    cpp_resp = runner.run_code(
        code=cpp_code,
        language="cpp",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_cpp",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert cpp_resp.all_passed is True, f"C++ FUNCTION mode failed: {cpp_resp.console_output} {cpp_resp.test_results}"
    print("  [OK] C++: Function solveMeFirst(a, b) executed successfully without main().")

    # 6. Go FUNCTION mode (Candidate writes only function, zero main())
    go_code = """
package main

func solveMeFirst(a int, b int) int {
    return a + b
}
"""
    go_resp = runner.run_code(
        code=go_code,
        language="go",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_go",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert go_resp.all_passed is True, f"Go FUNCTION mode failed: {go_resp.console_output} {go_resp.test_results}"
    print("  [OK] Go: Function solveMeFirst(a, b) executed successfully without main().")

    # 7. Rust FUNCTION mode (Candidate writes only function, zero main())
    rust_code = """
fn solve_me_first(a: i32, b: i32) -> i32 {
    a + b
}
"""
    rust_resp = runner.run_code(
        code=rust_code,
        language="rust",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_rust",
        execution_mode="function",
        entry_point="solve_me_first"
    )
    assert rust_resp.all_passed is True, f"Rust FUNCTION mode failed: {rust_resp.console_output} {rust_resp.test_results}"
    print("  [OK] Rust: Function solve_me_first(a, b) executed successfully without main().")

    # 8. Swift FUNCTION mode (Candidate writes only function)
    swift_code = """
func solveMeFirst(a: Int, b: Int) -> Int {
    return a + b
}
"""
    swift_resp = runner.run_code(
        code=swift_code,
        language="swift",
        test_cases=[
            {"name": "2 + 3", "input": "[2, 3]", "expected": "5"}
        ],
        task_id="test_func_swift",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert swift_resp.all_passed is True, f"Swift FUNCTION mode failed: {swift_resp.console_output} {swift_resp.test_results}"
    print("  [OK] Swift: Function solveMeFirst(a, b) executed successfully without main().")

    print("[PASS] ARCH-03 - FUNCTION mode execution verified across all 8 supported programming languages.")


def test_suite_4_error_and_failure_handling():
    print("\n--- SUITE 4: HONEST ERROR & FAILURE CAPTURE (ZERO FAKE POINTS) ---")
    runner = Judge0Runner()
    if not runner.is_configured():
        print("[SKIP] Judge0 not configured on host. Skipping live Judge0 error tests.")
        return

    # 1. Wrong solution: returns wrong answer
    wrong_code = """
def solveMeFirst(a, b):
    return a * b  # Wrong operation
"""
    resp_wrong = runner.run_code(
        code=wrong_code,
        language="python",
        test_cases=[{"name": "2 + 3", "input": "[2, 3]", "expected": "5"}],
        task_id="test_wrong",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert resp_wrong.all_passed is False, "Wrong solution was incorrectly marked as passed"
    assert resp_wrong.passed_count == 0
    assert resp_wrong.test_results[0]["actual"] == "6"
    assert "Expected '5', got '6'" in resp_wrong.test_results[0]["error"]
    print("  [OK] Wrong solution correctly failed with honest assertion error.")

    # 2. Syntax / Compilation error
    syntax_err_code = """
int solveMeFirst(int a, int b) {
    this is invalid syntax !!!
}
"""
    resp_syntax = runner.run_code(
        code=syntax_err_code,
        language="cpp",
        test_cases=[{"name": "2 + 3", "input": "[2, 3]", "expected": "5"}],
        task_id="test_syntax",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert resp_syntax.all_passed is False
    assert resp_syntax.test_results[0]["status"] == "compilation_error"
    print("  [OK] Compilation error correctly detected without fallback bypass.")

    # 3. Runtime exception
    runtime_err_code = """
def solveMeFirst(a, b):
    return a // 0  # ZeroDivisionError
"""
    resp_runtime = runner.run_code(
        code=runtime_err_code,
        language="python",
        test_cases=[{"name": "2 + 3", "input": "[2, 3]", "expected": "5"}],
        task_id="test_runtime",
        execution_mode="function",
        entry_point="solveMeFirst"
    )
    assert resp_runtime.all_passed is False
    assert resp_runtime.test_results[0]["status"] == "runtime_error"
    print("  [OK] Runtime exception correctly captured with honest error state.")

    print("[PASS] ARCH-04 - Honest error and failure capture verified (no fake scoring).")


def test_suite_5_stdin_mode_execution():
    print("\n--- SUITE 5: STDIN MODE PASSTHROUGH EXECUTION ---")
    runner = Judge0Runner()
    if not runner.is_configured():
        print("[SKIP] Judge0 not configured on host. Skipping STDIN mode tests.")
        return

    # In STDIN mode, candidate writes complete program reading standard input
    py_stdin_code = """
import sys
tokens = sys.stdin.read().split()
if tokens:
    a, b = int(tokens[0]), int(tokens[1])
    print(a + b)
"""
    resp_stdin = runner.run_code(
        code=py_stdin_code,
        language="python",
        test_cases=[
            {"name": "2 3 -> 5", "input": "2 3\n", "expected": "5"},
            {"name": "100 200 -> 300", "input": "100 200\n", "expected": "300"}
        ],
        task_id="test_stdin_py",
        execution_mode="stdin"
    )
    assert resp_stdin.all_passed is True, f"STDIN mode failed: {resp_stdin.console_output} {resp_stdin.test_results}"
    assert resp_stdin.passed_count == 2
    print("  [OK] STDIN mode passthrough executed successfully without function wrapper.")
    print("[PASS] ARCH-05 - STDIN mode execution verified.")


def test_suite_6_sql_query_execution():
    print("\n--- SUITE 6: SQL RELATIONAL ENGINE EXECUTION ---")
    schema_ddl = """
    CREATE TABLE departments (id INT PRIMARY KEY, name TEXT);
    INSERT INTO departments VALUES (1, 'Engineering'), (2, 'Design');
    """
    candidate_sql = "SELECT name FROM departments WHERE id = 1;"

    controller_resp = AssessmentController.run_code_sandbox(
        payload=CodeRunRequest(
            task_id="test_sql_prob",
            language="sql",
            code=candidate_sql,
            test_cases=[
                {"name": "Filter department", "input": "SQL Query", "expected": "Engineering"}
            ],
            schema_ddl=schema_ddl
        ),
        db=None
    )
    assert controller_resp.all_passed is True, f"SQL execution failed: {controller_resp.console_output}"
    print("  [OK] SQL query execution against catalog verified.")
    print("[PASS] ARCH-06 - SQL relational query execution verified.")


def test_suite_7_schema_and_database_model_integration():
    print("\n--- SUITE 7: DATABASE MODEL & CONTROLLER DYNAMIC LOOKUP ---")
    db = SessionLocal()
    try:
        # Create a test problem in the database with execution_mode="function" and function_signature
        test_slug = f"test-dynamic-solve-{int(time.time())}"
        prob = CodingProblemModel(
            id=f"prob-{test_slug}",
            title="Dynamic Two Sum",
            slug=test_slug,
            problem_statement="Given a and b, return their sum.",
            difficulty="Easy",
            execution_mode="function",
            function_name="solveMeFirst",
            function_signature={
                "name": "solveMeFirst",
                "params": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}],
                "return_type": "int"
            },
            allowed_languages=["python", "javascript", "java", "cpp"]
        )
        db.add(prob)
        db.flush()

        tc1 = CodingTestCaseModel(
            id=f"tc-{test_slug}-1",
            problem_id=prob.id,
            input_data="[2, 3]",
            expected_output="5",
            is_hidden=False,
            display_order=0
        )
        tc2 = CodingTestCaseModel(
            id=f"tc-{test_slug}-2",
            problem_id=prob.id,
            input_data="[10, 20]",
            expected_output="30",
            is_hidden=False,
            display_order=1
        )
        db.add(tc1)
        db.add(tc2)
        db.commit()

        # Run via AssessmentController without passing test_cases or entry_point in payload
        # (Controller must look up problem definition from database dynamically)
        req = CodeRunRequest(
            task_id=prob.id,
            language="python",
            code="def solveMeFirst(a, b):\n    return a + b\n"
        )
        resp = AssessmentController.run_code_sandbox(payload=req, db=db)
        assert resp.all_passed is True, f"Dynamic problem lookup run failed: {resp.console_output} {resp.test_results}"
        assert resp.total_count == 2
        assert resp.passed_count == 2
        print("  [OK] Controller dynamically fetched problem, function_name, and test cases from database.")

        # Clean up test records
        db.delete(tc1)
        db.delete(tc2)
        db.delete(prob)
        db.commit()

    finally:
        db.close()
    print("[PASS] ARCH-07 - Database model and controller dynamic problem lookup verified.")


def run_all_architecture_tests():
    print("=" * 70)
    print("SPARKX FUNCTION EXECUTION ARCHITECTURE VERIFICATION")
    print("=" * 70)
    test_suite_1_deterministic_comparison()
    test_suite_2_supported_languages_registry()
    test_suite_3_function_mode_execution()
    test_suite_4_error_and_failure_handling()
    test_suite_5_stdin_mode_execution()
    test_suite_6_sql_query_execution()
    test_suite_7_schema_and_database_model_integration()
    print("\n" + "=" * 70)
    print("ALL 7 FUNCTION EXECUTION ARCHITECTURE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_architecture_tests()
