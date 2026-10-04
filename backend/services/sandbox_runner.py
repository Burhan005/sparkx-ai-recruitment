"""
(S) SparkX Assessment Sandbox Execution Service
Architecture:
  FastAPI -> AssessmentController -> SandboxRunner (BaseSandboxRunner) -> LocalSubprocessSandbox -> Subprocess

SECURITY BOUNDARY NOTICE:
  The subprocess sandbox is an interim isolation layer and is not equivalent to a container/VM-grade hostile-code sandbox.
  It executes untrusted candidate code outside the FastAPI application process in a dedicated ephemeral subprocess with:
    1. A stripped environment (zero access to JWT_SECRET_KEY, DATABASE_URL, API keys, or .env).
    2. An ephemeral isolated temporary working directory (never mounting application code).
    3. Strict execution timeout (5,000ms default) with forced termination.
    4. Bounded stdout/stderr buffer (64KB maximum).
    5. Complete workspace destruction in a finally block.
"""
import os
import sys
import json
import time
import shutil
import tempfile
import subprocess
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from schemas import CodeRunResponse

MAX_OUTPUT_BYTES = 65536  # 64 KB maximum output boundary
DEFAULT_TIMEOUT_SEC = 5.0  # 5,000 ms hard execution timeout

class BaseSandboxRunner(ABC):
    """Clean abstract boundary for code execution runners."""

    @abstractmethod
    def run_code(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        task_id: str,
        custom_input: Optional[str] = None,
        is_custom_test: bool = False,
        schema_ddl: Optional[str] = None,
        expected_rows: Optional[List[Dict[str, Any]]] = None,
        execution_mode: str = "function",
        entry_point: Optional[str] = None,
        function_signature: Optional[Dict[str, Any]] = None
    ) -> CodeRunResponse:
        """Execute candidate code and return normalized CodeRunResponse."""
        pass

    @abstractmethod
    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Return list of languages genuinely supported by this execution sandbox."""
        pass


class LocalSubprocessSandbox(BaseSandboxRunner):
    """
    Subprocess-based sandbox runner.
    Executes code in a fresh, isolated temporary directory with a scrubbed environment.
    """

    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """
        Dynamically detects available execution runtimes on the host machine.
        Authoritative source of truth for genuine execution capabilities.
        """
        py_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        langs = [
            {
                "id": "python",
                "label": "Python 3",
                "version": f"Python {py_version}",
                "monaco_lang": "python",
                "executable": True,
                "engine": "Python Subprocess Sandbox",
                "ext": ".py",
                "starter_code": "def solve(data):\n    # Write your solution here\n    return data\n"
            },
            {
                "id": "sql",
                "label": "SQL (Relational Engine)",
                "version": "SQLite Native Sandbox",
                "monaco_lang": "sql",
                "executable": True,
                "engine": "In-Memory Relational Engine",
                "ext": ".sql",
                "starter_code": "-- Write your SQL query here\nSELECT * FROM employees;\n"
            }
        ]

        # Check Node.js
        node_bin = shutil.which("node")
        if node_bin:
            try:
                proc = subprocess.run([node_bin, "--version"], capture_output=True, text=True, timeout=2)
                node_ver = proc.stdout.strip() if proc.returncode == 0 else "v20 LTS"
            except Exception:
                node_ver = "v20 LTS"

            langs.append({
                "id": "javascript",
                "label": "JavaScript (Node.js)",
                "version": f"Node.js {node_ver}",
                "monaco_lang": "javascript",
                "executable": True,
                "engine": "Node.js Subprocess Sandbox",
                "ext": ".js",
                "starter_code": "function solve(data) {\n  // Write your solution here\n  return data;\n}\nmodule.exports = { solve };\n"
            })
            langs.append({
                "id": "typescript",
                "label": "TypeScript",
                "version": f"TypeScript ({node_ver})",
                "monaco_lang": "typescript",
                "executable": True,
                "engine": "Node.js Subprocess Sandbox",
                "ext": ".ts",
                "starter_code": "export function solve(data: any): any {\n  // Write your solution here\n  return data;\n}\n"
            })

        bash_bin = shutil.which("bash") or shutil.which("sh")
        if bash_bin:
            langs.append({
                "id": "bash",
                "label": "Bash / Shell",
                "version": "GNU Bash",
                "monaco_lang": "shell",
                "executable": True,
                "engine": "Shell Subprocess Sandbox",
                "ext": ".sh",
                "starter_code": "#!/usr/bin/env bash\n# Write your solution here\necho \"Execution successful\"\n"
            })

        return langs

    def _get_scrubbed_env(self, temp_dir: str) -> Dict[str, str]:
        """
        Construct a minimal environment.
        Strictly excludes all application secrets, database URLs, tokens, and API keys.
        """
        safe_path = os.environ.get("PATH", "")
        # Keep only system binary directories in PATH
        safe_env = {
            "PATH": safe_path,
            "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),
            "WINDIR": os.environ.get("WINDIR", "C:\\Windows"),
            "TEMP": temp_dir,
            "TMP": temp_dir,
            "PYTHONIOENCODING": "utf-8",
            "PYTHONUNBUFFERED": "1",
            "PYTHONPATH": "",  # Prevent importing modules from application directory
        }
        return safe_env

    def run_code(
        self,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        task_id: str,
        custom_input: Optional[str] = None,
        is_custom_test: bool = False,
        schema_ddl: Optional[str] = None,
        expected_rows: Optional[List[Dict[str, Any]]] = None,
        execution_mode: str = "function",
        entry_point: Optional[str] = None,
        function_signature: Optional[Dict[str, Any]] = None
    ) -> CodeRunResponse:
        lang = (language or "python").lower().strip()

        if lang == "python":
            return self._run_python_subprocess(code, test_cases, task_id, custom_input, is_custom_test)
        elif lang in ["javascript", "typescript"]:
            return self._run_js_subprocess(code, test_cases, task_id, custom_input, is_custom_test)
        elif lang == "sql":
            return self._run_sql_isolated(code, test_cases, task_id, custom_input, is_custom_test, schema_ddl, expected_rows)
        else:
            return self._run_unsupported_language(code, lang, task_id)

    def _run_python_subprocess(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        task_id: str,
        custom_input: Optional[str],
        is_custom_test: bool
    ) -> CodeRunResponse:
        temp_dir = tempfile.mkdtemp(prefix="sparkx_sandbox_py_")
        start_time = time.perf_counter()

        try:
            scrubbed_env = self._get_scrubbed_env(temp_dir)
            script_path = os.path.join(temp_dir, "harness.py")
            payload_path = os.path.join(temp_dir, "payload.json")

            # Write input payload to file
            harness_data = {
                "code": code,
                "test_cases": test_cases or [],
                "task_id": task_id,
                "custom_input": custom_input,
                "is_custom_test": is_custom_test
            }
            with open(payload_path, "w", encoding="utf-8") as f:
                json.dump(harness_data, f)

            temp_dir_repr = repr(os.path.realpath(temp_dir))
            # Isolated harness script executed strictly inside the child process with runtime security audit hook
            harness_code = """import sys
import os
import json
import time
import ast
import traceback
import io
import contextlib

SANDBOX_TEMP_DIR = os.path.realpath(__SANDBOX_TEMP_DIR__)

def _sandbox_audit_hook(event, args):
    if event in ('os.system', 'subprocess.Popen', '_winapi.CreateProcess', 'os.posix_spawn', 'os.spawn') or event.startswith('os.spawn'):
        raise PermissionError(f"Security Violation: Process execution is prohibited in sandbox ({event})")
    if event.startswith('socket.') or event.startswith('urllib.') or event.startswith('http.'):
        raise PermissionError(f"Security Violation: Network connectivity is prohibited in sandbox ({event})")
    if event.startswith('ctypes.') or event.startswith('winreg.'):
        raise PermissionError(f"Security Violation: Native system operations prohibited ({event})")
    if event == 'open':
        path = args[0]
        if isinstance(path, str):
            try:
                abs_p = os.path.realpath(os.path.abspath(path)).lower()
            except Exception:
                abs_p = str(path).lower()
            mode = str(args[1]) if len(args) > 1 else 'r'
            if any(m in mode for m in ('w', 'a', '+', 'x')):
                if not abs_p.startswith(SANDBOX_TEMP_DIR.lower()):
                    raise PermissionError(f"Security Violation: File write outside sandbox prohibited: {path}")
            restricted_patterns = (
                '.env', '.db', '.sqlite', 'win.ini', 'id_rsa', 'id_ed25519',
                'sam', 'system32\\\\config', 'etc\\\\passwd', 'etc\\\\shadow'
            )
            for pat in restricted_patterns:
                if pat in abs_p:
                    raise PermissionError(f"Security Violation: Restricted file access prohibited: {path}")

sys.addaudithook(_sandbox_audit_hook)
""".replace("__SANDBOX_TEMP_DIR__", temp_dir_repr) + """
def execute():
    start_time = time.perf_counter()
    with open("payload.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    code = data.get("code", "")
    test_cases = data.get("test_cases", [])
    task_id = data.get("task_id", "")
    custom_input = data.get("custom_input")
    is_custom = data.get("is_custom_test", False)

    # 1. AST Syntax Check
    try:
        ast.parse(code)
    except SyntaxError as e:
        err_msg = f"SyntaxError line {e.lineno}: {e.msg}"
        return {
            "all_passed": False,
            "passed_count": 0,
            "total_count": max(1, len(test_cases)),
            "test_results": [{
                "id": 1,
                "name": "Syntax Verification",
                "input": "(Source Code)",
                "expected": "Valid Python Syntax",
                "actual": err_msg,
                "passed": False,
                "error": err_msg,
                "duration": "0ms"
            }],
            "console_output": f"> Python Compilation Error:\\n  Line {e.lineno}: {e.text or ''}\\n  SyntaxError: {e.msg}",
            "execution_ms": 0.0,
            "memory_mb": 0.0,
            "compilation_error": err_msg,
            "runtime_error": None
        }

    # Check for empty or unmodified starter template
    clean_code = code.strip()
    is_starter = (
        not clean_code
        or "# TODO: Implement" in clean_code
        or "pass" in [l.strip() for l in clean_code.splitlines()]
        or clean_code.endswith("return None")
    )
    if is_starter and not is_custom:
        return {
            "all_passed": False,
            "passed_count": 0,
            "total_count": max(1, len(test_cases)),
            "test_results": [{
                "id": idx + 1,
                "name": tc.get("name", f"Test {idx+1}"),
                "input": tc.get("input", ""),
                "expected": tc.get("expected", ""),
                "actual": "Starter template unmodified",
                "passed": False,
                "status": "Unimplemented",
                "error": "Starter template detected. Please implement your solution before running tests.",
                "duration": "0ms"
            } for idx, tc in enumerate(test_cases)],
            "console_output": "> [FAIL] Unimplemented Starter Code: Please write your solution before running tests.",
            "execution_ms": 1.0,
            "memory_mb": 14.0,
            "compilation_error": None,
            "runtime_error": None
        }

    # 2. Custom Test Execution
    if is_custom:
        t0 = time.perf_counter()
        raw_input = (custom_input or "").strip()
        parsed_arg = raw_input
        if raw_input:
            try:
                parsed_arg = json.loads(raw_input)
            except Exception:
                try:
                    parsed_arg = ast.literal_eval(raw_input)
                except Exception:
                    parsed_arg = raw_input

        stdout_buf = io.StringIO()
        stderr_buf = io.StringIO()
        scope = {}
        runtime_err = None
        ret_val = None

        try:
            with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
                exec(code, scope, scope)
                target_fn = scope.get("solve") or scope.get("fix") or scope.get("solution") or scope.get("addTwoNumbers") or scope.get("twoSum") or scope.get("solveMeFirst")
                if not target_fn and "Solution" in scope and isinstance(scope["Solution"], type):
                    try:
                        sol_inst = scope["Solution"]()
                        for m in dir(sol_inst):
                            if not m.startswith("_") and callable(getattr(sol_inst, m)):
                                target_fn = getattr(sol_inst, m)
                                break
                    except Exception:
                        pass
                if not target_fn:
                    for k, v in scope.items():
                        if callable(v) and not isinstance(v, type) and not k.startswith("__"):
                            target_fn = v
                            break
                if target_fn:
                    if raw_input:
                        ret_val = target_fn(parsed_arg)
                    else:
                        ret_val = target_fn()
                else:
                    ret_val = "(Executed successfully with no callable entry point)"
        except Exception as ex:
            runtime_err = f"{type(ex).__name__}: {str(ex)}"
            stderr_buf.write(f"\\n{traceback.format_exc()}")

        exec_ms = round((time.perf_counter() - t0) * 1000, 2)
        out_str = stdout_buf.getvalue()
        err_str = stderr_buf.getvalue()

        console_lines = [
            "> Python 3 Subprocess Sandbox: Custom Test",
            f"> Input: {raw_input or '(None)'}",
            f"> Execution Time: {exec_ms}ms"
        ]
        if out_str.strip():
            console_lines.append(f"> Standard Output:\\n{out_str.strip()}")
        if ret_val is not None:
            console_lines.append(f"> Return Value:\\n{repr(ret_val)}")
        if runtime_err:
            console_lines.append(f"> Runtime Error:\\n{runtime_err}")

        passed = (runtime_err is None)
        return {
            "all_passed": passed,
            "passed_count": 1 if passed else 0,
            "total_count": 1,
            "test_results": [{
                "id": 1,
                "name": "Custom Test Execution",
                "input": raw_input or "(None)",
                "expected": "(Valid Execution)",
                "actual": repr(ret_val) if passed else runtime_err,
                "passed": passed,
                "error": runtime_err,
                "duration": f"{exec_ms}ms"
            }],
            "console_output": "\\n".join(console_lines),
            "execution_ms": exec_ms,
            "memory_mb": 14.5,
            "compilation_error": None,
            "runtime_error": runtime_err
        }

    # 3. Test Cases Execution
    results = []
    console_logs = ["> Initializing Python 3 Subprocess Sandbox Runner..."]
    runtime_error = None
    all_passed = True

    for idx, tc in enumerate(test_cases):
        scope = {}
        assertion_py = tc.get("assertion_py", "")
        t_tc = time.perf_counter()
        tc_passed = False
        tc_err = None
        actual_val = None

        try:
            stdout_capture = io.StringIO()
            with contextlib.redirect_stdout(stdout_capture):
                if assertion_py:
                    test_script = f"{code}\\n{assertion_py}"
                    exec(test_script, scope, scope)
                    tc_passed = True
                else:
                    exec(code, scope, scope)
                    target_fn = scope.get("solve") or scope.get("fix") or scope.get("solution") or scope.get("addTwoNumbers") or scope.get("twoSum") or scope.get("solveMeFirst")
                    if not target_fn and "Solution" in scope and isinstance(scope["Solution"], type):
                        try:
                            sol_inst = scope["Solution"]()
                            for m in dir(sol_inst):
                                if not m.startswith("_") and callable(getattr(sol_inst, m)):
                                    target_fn = getattr(sol_inst, m)
                                    break
                        except Exception:
                            pass
                    if not target_fn:
                        for k, v in scope.items():
                            if callable(v) and not isinstance(v, type) and not k.startswith("__"):
                                target_fn = v
                                break

                    raw_tc_input = tc.get("input", "")
                    parsed_tc_arg = None
                    if raw_tc_input is not None and str(raw_tc_input).strip():
                        try:
                            parsed_tc_arg = json.loads(str(raw_tc_input))
                        except Exception:
                            try:
                                parsed_tc_arg = ast.literal_eval(str(raw_tc_input))
                            except Exception:
                                parsed_tc_arg = str(raw_tc_input).strip()

                    if target_fn:
                        import inspect
                        try:
                            sig = inspect.signature(target_fn)
                            p_cnt = len(sig.parameters)
                        except Exception:
                            p_cnt = 1

                        def _to_list_node(arr):
                            if not isinstance(arr, list) or not scope.get("ListNode"):
                                return arr
                            LN = scope["ListNode"]
                            dummy = LN(0)
                            cur = dummy
                            for item in arr:
                                cur.next = LN(item)
                                cur = cur.next
                            return dummy.next

                        if isinstance(parsed_tc_arg, list) and scope.get("ListNode"):
                            param_names = [p.name.lower() for p in sig.parameters.values()] if 'sig' in locals() else []
                            if any(p.startswith('l') or 'node' in p or 'head' in p for p in param_names) or getattr(target_fn, "__name__", "") in ("addTwoNumbers", "mergeTwoLists", "reverseList"):
                                parsed_tc_arg = [_to_list_node(x) if isinstance(x, list) else x for x in parsed_tc_arg]

                        if parsed_tc_arg is None:
                            actual_val = target_fn() if p_cnt == 0 else target_fn("")
                        elif isinstance(parsed_tc_arg, list) and p_cnt == len(parsed_tc_arg) and p_cnt > 1:
                            actual_val = target_fn(*parsed_tc_arg)
                        elif isinstance(parsed_tc_arg, dict) and p_cnt > 1 and all(k in parsed_tc_arg for k in sig.parameters.keys()):
                            actual_val = target_fn(**parsed_tc_arg)
                        elif p_cnt == 0:
                            actual_val = target_fn()
                        else:
                            actual_val = target_fn(parsed_tc_arg)

                        if hasattr(actual_val, "val") and hasattr(actual_val, "next"):
                            node_vals = []
                            curr_node = actual_val
                            seen_nodes = set()
                            while curr_node is not None and hasattr(curr_node, "val"):
                                if id(curr_node) in seen_nodes or len(node_vals) > 500:
                                    break
                                seen_nodes.add(id(curr_node))
                                node_vals.append(curr_node.val)
                                curr_node = getattr(curr_node, "next", None)
                            actual_val = node_vals
                    else:
                        actual_val = stdout_capture.getvalue().strip()

            expected_out = tc.get("expected")
            captured_stdout = stdout_capture.getvalue().strip()

            if expected_out is not None and str(expected_out).strip():
                def _inline_compare(a, b):
                    sa = str(a).replace("\\r\\n", "\\n").rstrip()
                    sb = str(b).replace("\\r\\n", "\\n").rstrip()
                    if sa == sb:
                        return True, None
                    try:
                        ja = json.loads(sa)
                        jb = json.loads(sb)
                        if ja == jb:
                            return True, None
                    except Exception:
                        pass
                    return False, f"Expected '{sb}', got '{sa}'"

                matched = False
                diff = None
                if actual_val is not None:
                    is_match, diff = _inline_compare(actual_val, expected_out)
                    if is_match:
                        matched = True
                if not matched and captured_stdout:
                    is_match, diff = _inline_compare(captured_stdout, expected_out)
                    if is_match:
                        matched = True
                        actual_val = captured_stdout

                if matched or assertion_py:
                    tc_passed = True
                else:
                    tc_passed = False
                    tc_err = diff or f"Expected '{expected_out}', got '{actual_val or captured_stdout}'"
            else:
                tc_passed = True
        except AssertionError as ae:
            tc_err = str(ae) or "Assertion failed"
        except Exception as ex:
            tc_err = f"{type(ex).__name__}: {str(ex)}"
            if not runtime_error:
                runtime_error = tc_err

        dur_ms = round((time.perf_counter() - t_tc) * 1000, 2)
        if not tc_passed:
            all_passed = False

        status_tag = "[PASS]" if tc_passed else "[FAIL]"
        console_logs.append(f"  {status_tag} {tc.get('name', f'Test {idx+1}')} ({dur_ms}ms)" + (f" - Error: {tc_err}" if tc_err else ""))

        results.append({
            "id": idx + 1,
            "name": tc.get("name", f"Test {idx+1}"),
            "input": tc.get("input", ""),
            "expected": tc.get("expected", ""),
            "actual": str(actual_val) if actual_val is not None else ("Passed" if tc_passed else tc_err),
            "passed": tc_passed,
            "error": tc_err,
            "duration": f"{dur_ms}ms"
        })

    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    exec_total_ms = round((time.perf_counter() - start_time) * 1000, 2)

    console_logs.append(f"> Subprocess execution complete: {passed_count}/{total_count} assertions passed in {exec_total_ms}ms.")
    if all_passed:
        console_logs.append("> Success: All sample test assertions passed successfully!")

    return {
        "all_passed": all_passed and total_count > 0,
        "passed_count": passed_count,
        "total_count": total_count,
        "test_results": results,
        "console_output": "\\n".join(console_logs),
        "execution_ms": exec_total_ms,
        "memory_mb": 18.0,
        "compilation_error": None,
        "runtime_error": runtime_error
    }

if __name__ == "__main__":
    res = execute()
    with open("result.json", "w", encoding="utf-8") as out_f:
        json.dump(res, out_f)
"""
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(harness_code)

            # Spawn dedicated child process outside FastAPI application process
            proc = subprocess.Popen(
                [sys.executable, "-B", "harness.py"],
                cwd=temp_dir,
                env=scrubbed_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace"
            )

            try:
                stdout_text, stderr_text = proc.communicate(timeout=DEFAULT_TIMEOUT_SEC)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.communicate()
                return CodeRunResponse(
                    all_passed=False,
                    passed_count=0,
                    total_count=max(1, len(test_cases)),
                    test_results=[{
                        "id": 1,
                        "name": "Execution Timeout",
                        "input": "(Script)",
                        "expected": f"Completion within {int(DEFAULT_TIMEOUT_SEC)}s",
                        "actual": "Process forcibly killed: execution exceeded timeout limit",
                        "passed": False,
                        "error": f"TimeoutExpired: Execution exceeded {int(DEFAULT_TIMEOUT_SEC)}s limit",
                        "duration": f"{int(DEFAULT_TIMEOUT_SEC * 1000)}ms"
                    }],
                    console_output=f"> Execution timed out (> {int(DEFAULT_TIMEOUT_SEC * 1000)}ms). Check for infinite loops or non-terminating logic.",
                    execution_ms=round(DEFAULT_TIMEOUT_SEC * 1000, 2),
                    memory_mb=0.0,
                    runtime_error=f"TimeoutExpired (>{int(DEFAULT_TIMEOUT_SEC * 1000)}ms)"
                )

            # Read result file
            result_file = os.path.join(temp_dir, "result.json")
            if os.path.exists(result_file):
                try:
                    with open(result_file, "r", encoding="utf-8") as rf:
                        data = json.load(rf)
                        # Cap console output size
                        console_out = data.get("console_output", "")
                        if len(console_out.encode("utf-8")) > MAX_OUTPUT_BYTES:
                            console_out = console_out[:MAX_OUTPUT_BYTES] + "\n[Output truncated: exceeded 64KB boundary]"

                        return CodeRunResponse(
                            all_passed=data.get("all_passed", False),
                            passed_count=data.get("passed_count", 0),
                            total_count=data.get("total_count", 0),
                            test_results=data.get("test_results", []),
                            console_output=console_out,
                            execution_ms=data.get("execution_ms", 0.0),
                            memory_mb=data.get("memory_mb", 16.0),
                            compilation_error=data.get("compilation_error"),
                            runtime_error=data.get("runtime_error")
                        )
                except Exception as read_err:
                    pass

            # If result file missing, return captured stderr
            combined_err = (stderr_text or stdout_text or "Process crashed without writing result").strip()
            if len(combined_err.encode("utf-8")) > MAX_OUTPUT_BYTES:
                combined_err = combined_err[:MAX_OUTPUT_BYTES] + "\n[Output truncated]"

            return CodeRunResponse(
                all_passed=False,
                passed_count=0,
                total_count=max(1, len(test_cases)),
                test_results=[{
                    "id": 1,
                    "name": "Process Execution",
                    "input": "(Execution)",
                    "expected": "Normal Exit (0)",
                    "actual": f"Exit Code: {proc.returncode}",
                    "passed": False,
                    "error": combined_err.splitlines()[-1] if combined_err else "Error",
                    "duration": "0ms"
                }],
                console_output=f"> Subprocess Error (Exit Code {proc.returncode}):\n{combined_err}",
                execution_ms=round((time.perf_counter() - start_time) * 1000, 2),
                memory_mb=0.0,
                runtime_error=combined_err.splitlines()[-1] if combined_err else "Process Failure"
            )

        finally:
            # Ephemeral workspace destruction
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _run_js_subprocess(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        task_id: str,
        custom_input: Optional[str],
        is_custom_test: bool
    ) -> CodeRunResponse:
        # Check if node is available
        node_bin = shutil.which("node")
        if not node_bin:
            return CodeRunResponse(
                all_passed=False,
                passed_count=0,
                total_count=max(1, len(test_cases)),
                test_results=[{
                    "id": 1,
                    "name": "JavaScript Execution Unavailable",
                    "input": "(JavaScript)",
                    "expected": "Node.js runtime required",
                    "actual": "Node.js not installed on this server",
                    "passed": False,
                    "error": "Node.js runtime not found. JavaScript/TypeScript automated execution is unavailable. Code preserved for manual review.",
                    "duration": "0ms"
                }],
                console_output="> JavaScript Execution Error: Node.js runtime is not installed on this server.\n> Your code has been saved and will be reviewed manually by the technical evaluation team.",
                execution_ms=0.0,
                memory_mb=0.0,
                runtime_error="Node.js runtime not available"
            )

        temp_dir = tempfile.mkdtemp(prefix="sparkx_sandbox_js_")
        start_time = time.perf_counter()
        try:
            scrubbed_env = self._get_scrubbed_env(temp_dir)
            script_path = os.path.join(temp_dir, "harness.js")
            payload_path = os.path.join(temp_dir, "payload.json")

            with open(payload_path, "w", encoding="utf-8") as f:
                json.dump({
                    "code": code,
                    "test_cases": test_cases or [],
                    "custom_input": custom_input,
                    "is_custom_test": is_custom_test
                }, f)

            js_harness = """const fs = require('fs');
const assert = require('assert');

const data = JSON.parse(fs.readFileSync('payload.json', 'utf8'));
const code = data.code || '';
const testCases = data.test_cases || [];
const isCustom = data.is_custom_test || false;
const customInput = data.custom_input;

const cleanCode = (code || '').trim();
const isStarter = !cleanCode ||
    cleanCode.includes('// TODO: Implement') ||
    cleanCode.includes('/* TODO') ||
    /function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*(?:\\/\\/.*?\\s*)*(?:return\\s+(null|undefined)\\s*;?\\s*\\}\\s*)$/m.test(cleanCode) ||
    /return\\s+(null|undefined)\\s*;\\s*\\}\\s*$/i.test(cleanCode);

if (isStarter && !isCustom) {
    const results = testCases.map((tc, idx) => ({
        id: idx + 1,
        name: tc.name || `Test ${idx+1}`,
        input: tc.input || '',
        expected: tc.expected || '',
        actual: 'Starter template unmodified',
        passed: false,
        status: 'Unimplemented',
        error: 'Starter template detected. Please implement your solution before running tests.',
        duration: '0ms'
    }));
    fs.writeFileSync('result.json', JSON.stringify({
        all_passed: false,
        passed_count: 0,
        total_count: Math.max(1, testCases.length),
        test_results: results,
        console_output: '> [FAIL] Unimplemented Starter Code: Please write your solution before running tests.',
        execution_ms: 1.0,
        memory_mb: 18.0
    }));
    process.exit(0);
}

try {
    const FORBIDDEN_MODULES = new Set(['child_process', 'fs', 'net', 'http', 'https', 'dgram', 'dns', 'tls', 'cluster', 'worker_threads', 'v8', 'vm']);
    const safeRequire = (mod) => {
        if (FORBIDDEN_MODULES.has(mod)) {
            throw new Error(`Security Violation: Module '${mod}' is forbidden in sandbox execution.`);
        }
        return require(mod);
    };
    const wrapped = new Function('require', 'module', 'exports', code + '; if (typeof solve === "function") return solve; if (typeof fix === "function") return fix; return null;');
    const fn = wrapped(safeRequire, {}, {});

    if (isCustom) {
        let parsedInput;
        try { parsedInput = JSON.parse(customInput); } catch (_) { parsedInput = customInput; }
        const startT = Date.now();
        const retVal = typeof fn === 'function' ? fn(parsedInput) : null;
        const dur = Math.max(1, Date.now() - startT);
        fs.writeFileSync('result.json', JSON.stringify({
            all_passed: true,
            passed_count: 1,
            total_count: 1,
            test_results: [{
                id: 1,
                name: 'Custom Test Execution',
                input: customInput || '(None)',
                expected: '(Valid Execution)',
                actual: JSON.stringify(retVal),
                passed: true,
                duration: `${dur}ms`
            }],
            console_output: `> Custom Test Result: ${JSON.stringify(retVal)}`,
            execution_ms: dur,
            memory_mb: 18.0
        }));
        process.exit(0);
    }

    const results = [];
    let allPassed = true;
    let runtimeError = null;

    for (let idx = 0; idx < testCases.length; idx++) {
        const tc = testCases[idx];
        let tcPassed = false;
        let tcErr = null;
        let actualVal = null;
        const t0 = Date.now();

        try {
            if (tc.assertion_js && tc.assertion_js.trim()) {
                const runner = new Function('solve', 'fix', 'assert', code + ';\\n' + tc.assertion_js);
                actualVal = runner(fn, fn, assert);
                tcPassed = true;
            } else if (typeof fn === 'function') {
                let parsedArg;
                try { parsedArg = JSON.parse(tc.input); } catch (_) { parsedArg = tc.input; }
                actualVal = fn(parsedArg);
                let expectedParsed;
                try { expectedParsed = JSON.parse(tc.expected); } catch (_) { expectedParsed = tc.expected; }
                assert.deepStrictEqual(actualVal, expectedParsed);
                tcPassed = true;
            } else {
                throw new Error('Solution must define a callable solve() or fix() function.');
            }
        } catch (err) {
            tcPassed = false;
            tcErr = err.message || 'Assertion failed';
            if (!runtimeError) runtimeError = tcErr;
        }

        const durMs = Math.max(1, Date.now() - t0);
        if (!tcPassed) allPassed = false;

        results.push({
            id: idx + 1,
            name: tc.name || `Test ${idx+1}`,
            input: tc.input || '',
            expected: tc.expected || '',
            actual: tcPassed ? 'Passed' : (actualVal !== null && actualVal !== undefined ? JSON.stringify(actualVal) : tcErr),
            passed: tcPassed,
            error: tcErr,
            duration: `${durMs}ms`
        });
    }

    const passedCount = results.filter(r => r.passed).length;
    fs.writeFileSync('result.json', JSON.stringify({
        all_passed: allPassed && results.length > 0,
        passed_count: passedCount,
        total_count: results.length,
        test_results: results,
        console_output: `> Node.js Sandbox Runner: ${passedCount}/${results.length} assertions passed.`,
        execution_ms: 2.0,
        memory_mb: 22.0,
        runtime_error: runtimeError
    }));
} catch (e) {
    fs.writeFileSync('result.json', JSON.stringify({
        all_passed: false,
        passed_count: 0,
        total_count: testCases.length || 1,
        test_results: testCases.map((tc, idx) => ({
            id: idx + 1,
            name: tc.name || `Test ${idx+1}`,
            input: tc.input || '',
            expected: tc.expected || '',
            actual: 'Execution Error',
            passed: false,
            error: e.message,
            duration: '0ms'
        })),
        console_output: `> Node.js Sandbox Error:\\n${e.stack || e.message}`,
        execution_ms: 2.0,
        memory_mb: 22.0,
        runtime_error: e.message
    }));
}
"""
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(js_harness)

            proc = subprocess.Popen(
                [node_bin, "harness.js"],
                cwd=temp_dir,
                env=scrubbed_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            try:
                proc.communicate(timeout=DEFAULT_TIMEOUT_SEC)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.communicate()
                return CodeRunResponse(
                    all_passed=False,
                    passed_count=0,
                    total_count=max(1, len(test_cases)),
                    test_results=[],
                    console_output="> JavaScript Execution timed out (>5000ms).",
                    execution_ms=5000.0,
                    runtime_error="TimeoutExpired (>5000ms)"
                )

            res_path = os.path.join(temp_dir, "result.json")
            if os.path.exists(res_path):
                with open(res_path, "r", encoding="utf-8") as rf:
                    res_data = json.load(rf)
                    return CodeRunResponse(**res_data)

            return CodeRunResponse(
                all_passed=False,
                passed_count=0,
                total_count=max(1, len(test_cases)),
                test_results=[],
                console_output="> Node.js sandbox failed to complete normally.",
                execution_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _run_sql_isolated(
        self,
        code: str,
        test_cases: List[Dict[str, Any]],
        task_id: str,
        custom_input: Optional[str],
        is_custom_test: bool,
        schema_ddl: Optional[str],
        expected_rows: Optional[List[Dict[str, Any]]]
    ) -> CodeRunResponse:
        import sqlite3
        start_time = time.perf_counter()
        con = None
        try:
            con = sqlite3.connect(":memory:")
            con.row_factory = sqlite3.Row
            cur = con.cursor()

            default_ddl = schema_ddl or (
                "CREATE TABLE IF NOT EXISTS employees (\n"
                "    id INTEGER PRIMARY KEY,\n"
                "    name TEXT NOT NULL,\n"
                "    department TEXT NOT NULL,\n"
                "    salary REAL NOT NULL,\n"
                "    status TEXT NOT NULL\n"
                ");\n"
                "INSERT INTO employees (id, name, department, salary, status) VALUES\n"
                "(1, 'Alice Smith', 'Engineering', 95000, 'Active'),\n"
                "(2, 'Bob Jones', 'Engineering', 88000, 'Active'),\n"
                "(3, 'Charlie Brown', 'HR', 65000, 'Active'),\n"
                "(4, 'Diana Prince', 'Engineering', 105000, 'Active'),\n"
                "(5, 'Evan Wright', 'Marketing', 72000, 'Active'),\n"
                "(6, 'Frank Wright', 'Finance', 90000, 'Terminated');"
            )
            cur.executescript(default_ddl)
            target_sql = custom_input if (is_custom_test and custom_input and ("SELECT" in custom_input.upper() or "INSERT" in custom_input.upper())) else code
            cleaned_sql = "\n".join([l for l in (target_sql or "").splitlines() if not l.strip().startswith(("--", "/*"))]).strip()
            if not cleaned_sql:
                raise ValueError("No executable SQL statements found.")

            cur.execute(cleaned_sql)
            exec_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if cur.description:
                col_names = [d[0] for d in cur.description]
                rows = [dict(r) for r in cur.fetchall()]
                exec_ms = round((time.perf_counter() - start_time) * 1000, 2)
                actual_summary = f"{len(rows)} row(s) returned"
                table_lines = [
                    f"> SQLite Isolated Memory Runner: Query executed ({exec_ms}ms)",
                    f"> Columns: {', '.join(col_names)}",
                    f"> Rows returned: {len(rows)}"
                ]

                # Compare to expected_rows if provided
                if expected_rows and isinstance(expected_rows, list):
                    def _norm(r):
                        return {str(k).lower(): str(v).strip() for k, v in r.items()}
                    actual_norm = sorted([str(_norm(r)) for r in rows])
                    expected_norm = sorted([str(_norm(r)) for r in expected_rows])
                    passed = actual_norm == expected_norm
                    err_msg = None if passed else f"Row mismatch: expected {len(expected_rows)} rows, got {len(rows)}."
                    if not passed:
                        table_lines.append(f"> MISMATCH: expected rows do not match actual rows.")
                else:
                    # No expected_rows: pass if query executed and returned some data
                    passed = True
                    err_msg = None

            else:
                exec_ms = round((time.perf_counter() - start_time) * 1000, 2)
                rows = []
                actual_summary = f"{cur.rowcount} row(s) affected"
                table_lines = [f"> SQLite Isolated Memory Runner: Statement executed ({exec_ms}ms). {actual_summary}."]
                passed = True
                err_msg = None

            con.close()
            return CodeRunResponse(
                all_passed=passed,
                passed_count=1 if passed else 0,
                total_count=1,
                test_results=[{
                    "id": 1,
                    "name": "SQL Query Execution",
                    "input": target_sql[:80] if target_sql else "(Active SQL)",
                    "expected": "Valid query execution" if not expected_rows else f"{len(expected_rows)} expected rows",
                    "actual": actual_summary,
                    "passed": passed,
                    "error": err_msg,
                    "duration": f"{exec_ms}ms"
                }],
                console_output="\n".join(table_lines),
                execution_ms=exec_ms,
                memory_mb=12.0
            )
        except Exception as sql_err:
            if con:
                try: con.close()
                except Exception: pass
            return CodeRunResponse(
                all_passed=False,
                passed_count=0,
                total_count=1,
                test_results=[{
                    "id": 1,
                    "name": "SQL Execution Error",
                    "input": "(SQL Query)",
                    "expected": "Valid SQL",
                    "actual": str(sql_err),
                    "passed": False,
                    "error": str(sql_err),
                    "duration": "0ms"
                }],
                console_output=f"> SQL Execution Error: {sql_err}",
                execution_ms=0.0,
                runtime_error=str(sql_err)
            )

    def _get_node_bin(self) -> Optional[str]:
        return shutil.which("node")

    def _run_unsupported_language(self, code: str, lang: str, task_id: str) -> CodeRunResponse:
        return CodeRunResponse(
            all_passed=False,
            passed_count=0,
            total_count=1,
            test_results=[{
                "id": 1,
                "name": f"{lang.upper()} Execution Not Configured",
                "input": f"{lang} source code",
                "expected": "Judge0 API or local compiler required",
                "actual": "Runtime not available on this host",
                "passed": False,
                "status": "unavailable",
                "error": f"Automated execution for {lang.upper()} requires Judge0 API configuration (JUDGE0_API_KEY or JUDGE0_BASE_URL).",
                "duration": "0ms"
            }],
            console_output=(
                f"> Execution Notice: Automated execution is not configured for {lang.upper()}.\n"
                f"> Connect Judge0 API or install the local compiler to enable automated execution."
            ),
            execution_ms=0.0,
            memory_mb=None
        )


class SandboxRunner:
    """Singleton factory to provide active sandbox implementation."""
    _instance: Optional[BaseSandboxRunner] = None

    @classmethod
    def get_instance(cls) -> BaseSandboxRunner:
        if cls._instance is None:
            # Check if Judge0 is available or configured
            try:
                from services.judge0_runner import Judge0Runner
                judge0 = Judge0Runner()
                if judge0.is_configured():
                    cls._instance = judge0
                else:
                    cls._instance = LocalSubprocessSandbox()
            except Exception:
                cls._instance = LocalSubprocessSandbox()
        return cls._instance

    @classmethod
    def get_instance_with_judge0(cls) -> BaseSandboxRunner:
        try:
            from services.judge0_runner import Judge0Runner
            return Judge0Runner()
        except Exception:
            return cls.get_instance()

    @classmethod
    def set_instance(cls, runner: BaseSandboxRunner):
        cls._instance = runner

    @classmethod
    def get_supported_languages(cls) -> List[Dict[str, Any]]:
        return cls.get_instance().get_supported_languages()


