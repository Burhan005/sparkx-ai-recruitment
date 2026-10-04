"""
(S) Judge0 Multi-Language Execution Runner — Phase 4A.2 Production Implementation
Extends BaseSandboxRunner to provide genuine multi-language code execution
via Judge0 API (self-hosted or cloud / RapidAPI).

Strict Architectural Rules Enforced:
1. Zero Bypass: When Judge0 is configured, ALL languages execute through Judge0 (no silent local bypass).
2. Function-style Problem Support: LanguageExecutionAdapter generates executable harnesses.
3. Deterministic Output Comparison: Deterministic JSON & string comparison (zero AI fuzzy matching).
4. Genuine Metrics: Captures actual time & memory from Judge0 (never hardcodes or fabricates metrics).
5. Robust Communication: Fast synchronous check with token polling fallback and bounded retry for transient faults.
6. Honest Error Reporting: Captures real compilation_error, runtime_error, timed_out, and infrastructure states.
"""
import os
import json
import time
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple

from schemas import CodeRunResponse
from services.sandbox_runner import BaseSandboxRunner, LocalSubprocessSandbox
from services.execution_harness import (
    LanguageExecutionAdapter, ExecutionMode,
    extract_delimited_output, compare_outputs
)
from models.db_models import SUPPORTED_LANGUAGES_REGISTRY

# Authoritative Judge0 CE Language IDs
JUDGE0_LANG_MAP = {
    "c": 50,           # C (GCC 9.2.0)
    "cpp": 54,         # C++ (GCC 9.2.0)
    "csharp": 51,      # C# (Mono 6.6.0.161)
    "java": 62,        # Java (OpenJDK 13.0.1)
    "python": 71,      # Python (3.8.1)
    "javascript": 63,  # JavaScript (Node.js 12.14.0)
    "typescript": 74,  # TypeScript (3.7.4)
    "go": 60,          # Go (1.13.5)
    "rust": 73,        # Rust (1.40.0)
    "php": 68,         # PHP (7.4.1)
    "ruby": 72,        # Ruby (2.7.0)
    "kotlin": 78,      # Kotlin (1.3.70)
    "swift": 83,       # Swift (5.2.3)
    "bash": 46,        # Bash (5.0.0)
    "sql": 82,         # SQL (SQLite 3.27.2)
}


class Judge0Runner(BaseSandboxRunner):
    """
    Executes code against Judge0 API.
    Env vars:
      JUDGE0_BASE_URL: e.g. "http://localhost:2358" or "https://judge0-ce.p.rapidapi.com"
      JUDGE0_API_KEY: RapidAPI key or custom X-Auth-Token (optional for self-hosted)
      JUDGE0_HOST: RapidAPI host header (optional)
      JUDGE0_TIMEOUT: Socket timeout in seconds (default 15.0)
    """

    def __init__(self):
        self.local_sandbox = LocalSubprocessSandbox()
        self.base_url = os.environ.get("JUDGE0_BASE_URL", "https://ce.judge0.com").rstrip("/")
        self.api_key = os.environ.get("JUDGE0_API_KEY", "")
        self.rapidapi_host = os.environ.get("JUDGE0_HOST", "judge0-ce.p.rapidapi.com")
        self.timeout_sec = float(os.environ.get("JUDGE0_TIMEOUT", "15.0"))
        self.poll_interval = 0.4
        self.max_poll_retries = 12

    def is_configured(self) -> bool:
        return bool(self.base_url or self.api_key)

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SparkX-Recruitment/2.0"
        }
        if self.api_key:
            if "rapidapi" in (self.base_url or "").lower() or (self.rapidapi_host and not self.base_url):
                headers["X-RapidAPI-Key"] = self.api_key
                headers["X-RapidAPI-Host"] = self.rapidapi_host
            else:
                headers["X-Auth-Token"] = self.api_key
        return headers

    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """
        Returns languages that are supported by the Judge0 execution ecosystem.
        All languages in SUPPORTED_LANGUAGES_REGISTRY are returned with their Monaco specs.
        """
        catalog = []
        for lang_id, meta in SUPPORTED_LANGUAGES_REGISTRY.items():
            catalog.append({
                "id": lang_id,
                "label": meta["label"],
                "version": f"Judge0 CE (ID: {meta['judge0_id']})",
                "monaco_lang": meta["monaco_lang"],
                "executable": True,
                "engine": meta.get("engine", "Judge0 Execution Engine"),
                "ext": meta["ext"],
                "starter_code": meta["starter_template"]
            })
        return catalog

    def _decode_judge0_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Safely decodes base64-encoded fields returned by Judge0."""
        for key in ("stdout", "stderr", "compile_output", "message"):
            val = data.get(key)
            if val is not None and isinstance(val, str) and val.strip():
                try:
                    decoded = base64.b64decode(val).decode("utf-8", errors="replace")
                    data[key] = decoded
                except Exception:
                    pass
        return data

    def _submit_to_judge0(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Submits code to Judge0 using base64_encoded=true for full character & error diagnostic safety.
        Uses POST /submissions?base64_encoded=true&wait=true for fast response.
        If status is In Queue (1) or Processing (2), falls back to async token polling.
        """
        base = self.base_url or "https://judge0-ce.p.rapidapi.com"
        endpoint = f"{base}/submissions?base64_encoded=true&wait=true"
        headers = self._get_headers()

        # Encode text fields as base64
        b64_payload = dict(payload)
        if "source_code" in b64_payload and b64_payload["source_code"] is not None:
            b64_payload["source_code"] = base64.b64encode(str(b64_payload["source_code"]).encode("utf-8")).decode("utf-8")
        if "stdin" in b64_payload and b64_payload["stdin"] is not None:
            b64_payload["stdin"] = base64.b64encode(str(b64_payload["stdin"]).encode("utf-8")).decode("utf-8")

        payload_bytes = json.dumps(b64_payload).encode("utf-8")

        req = urllib.request.Request(endpoint, data=payload_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="replace")[:200]
            if he.code == 429:
                raise RuntimeError(f"Judge0 Rate Limit Exceeded (HTTP 429): {err_body}")
            elif he.code in (401, 403):
                raise RuntimeError(f"Judge0 Authentication Failed (HTTP {he.code}): Check JUDGE0_API_KEY")
            elif he.code >= 500:
                raise RuntimeError(f"Judge0 Service Unavailable (HTTP {he.code}): {err_body}")
            else:
                raise RuntimeError(f"Judge0 HTTP {he.code}: {err_body}")
        except urllib.error.URLError as ue:
            raise RuntimeError(f"Judge0 Connection Error: {str(ue.reason)}")
        except Exception as ex:
            raise RuntimeError(f"Judge0 Submission Failed: {str(ex)}")

        token = data.get("token")
        status_info = data.get("status") or {}
        status_id = status_info.get("id", 0)

        # If status is still In Queue (1) or Processing (2), poll the token
        if status_id in (1, 2) and token:
            data = self._poll_token(base, token, headers)

        return self._decode_judge0_data(data)

    def _poll_token(self, base_url: str, token: str, headers: Dict[str, str]) -> Dict[str, Any]:
        """
        Polls GET /submissions/{token}?base64_encoded=true until execution finishes or retries expire.
        """
        poll_endpoint = f"{base_url}/submissions/{token}?base64_encoded=true"
        for _ in range(self.max_poll_retries):
            time.sleep(self.poll_interval)
            try:
                poll_req = urllib.request.Request(poll_endpoint, headers=headers, method="GET")
                with urllib.request.urlopen(poll_req, timeout=self.timeout_sec) as resp:
                    poll_data = json.loads(resp.read().decode("utf-8"))
                    p_status = (poll_data.get("status") or {}).get("id", 0)
                    if p_status >= 3:
                        return poll_data
            except Exception:
                pass

        # If still in queue after polling limit, return the last poll data or timed out
        return {"status": {"id": 5, "description": "Polling Timeout Exceeded"}, "stderr": "Judge0 execution polling timed out"}

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

        # STRICT ZERO-BYPASS RULE:
        # If Judge0 is NOT configured, allow LocalSubprocessSandbox ONLY for locally installed runtimes.
        # For compiled languages when Judge0 is not configured, return honest UNAVAILABLE status.
        if not self.is_configured():
            local_ids = {l["id"] for l in self.local_sandbox.get_supported_languages()}
            if lang in local_ids and not (lang in ["javascript", "typescript"] and not self.local_sandbox._get_node_bin()):
                return self.local_sandbox.run_code(
                    code=code,
                    language=lang,
                    test_cases=test_cases,
                    task_id=task_id,
                    custom_input=custom_input,
                    is_custom_test=is_custom_test,
                    schema_ddl=schema_ddl,
                    expected_rows=expected_rows,
                    execution_mode=execution_mode,
                    entry_point=entry_point,
                    function_signature=function_signature
                )

            # Compiled language without Judge0 and without local compiler -> Honest response
            return CodeRunResponse(
                all_passed=False,
                passed_count=0,
                total_count=max(1, len(test_cases)),
                test_results=[{
                    "id": 1,
                    "name": f"{lang.upper()} Execution Not Configured",
                    "input": "(Code)",
                    "expected": "Judge0 API or local compiler required",
                    "actual": "Judge0 not configured",
                    "passed": False,
                    "status": "unavailable",
                    "error": f"Automated execution for {lang.upper()} requires Judge0 API configuration (JUDGE0_API_KEY or JUDGE0_BASE_URL). Code is preserved for evaluation.",
                    "duration": "0ms"
                }],
                console_output=f"> Execution Notice: {lang.upper()} execution engine is not configured on this host. Submission preserved.",
                execution_ms=0.0,
                memory_mb=None
            )

        # ─── GENUINE JUDGE0 EXECUTION PATH (NO BYPASS) ───────────────────────────
        judge0_lang_id = JUDGE0_LANG_MAP.get(lang)
        if not judge0_lang_id:
            return self.local_sandbox._run_unsupported_language(code, lang, task_id)

        if not is_custom_test and test_cases is not None and len(test_cases) == 0:
            return CodeRunResponse(
                all_passed=True,
                passed_count=0,
                total_count=0,
                test_results=[],
                console_output="",
                execution_ms=0.0,
                memory_mb=None
            )

        cases_to_run = (
            [{"name": "Custom Test", "input": custom_input or "", "expected": ""}]
            if is_custom_test
            else (test_cases if test_cases else [{"name": "Execution", "input": "", "expected": ""}])
        )

        results = []
        all_passed = True
        console_logs = [f"> Dispatching {lang.upper()} execution to Judge0 Engine (Language ID: {judge0_lang_id}, Mode: {execution_mode})..."]
        total_time_ms = 0.0
        max_mem_kb: Optional[int] = None
        global_compilation_err: Optional[str] = None
        global_runtime_err: Optional[str] = None

        t0_all = time.perf_counter()

        for idx, tc in enumerate(cases_to_run):
            inp = tc.get("input", "")
            exp = tc.get("expected", "")
            tc_name = tc.get("name", f"Test {idx+1}")

            # Generate language-aware driver harness for function-style problems or passthrough for STDIN
            adapted_code, stdin_data = LanguageExecutionAdapter.generate_harness(
                code=code,
                language=lang,
                test_input=inp,
                mode=execution_mode,
                entry_point=entry_point,
                function_signature=function_signature,
                schema_ddl=schema_ddl
            )

            payload = {
                "source_code": adapted_code,
                "language_id": judge0_lang_id,
                "stdin": stdin_data if stdin_data else (str(inp) if (inp is not None and execution_mode == "stdin") else ""),
                "cpu_time_limit": 5.0,
                "memory_limit": 128000
            }

            try:
                data = self._submit_to_judge0(payload)
            except Exception as ex:
                # Judge0 communication error
                all_passed = False
                err_text = str(ex)
                results.append({
                    "id": idx + 1,
                    "name": tc_name,
                    "input": str(inp),
                    "expected": str(exp),
                    "actual": err_text,
                    "passed": False,
                    "status": "error",
                    "error": err_text,
                    "duration": "0ms"
                })
                console_logs.append(f"  [ERROR] {tc_name}: {err_text}")
                continue

            # Process Judge0 response
            status_info = data.get("status") or {}
            status_id = status_info.get("id", 0)
            status_desc = status_info.get("description", "Unknown")

            raw_stdout = data.get("stdout") or ""
            raw_stderr = data.get("stderr") or ""
            compile_out = data.get("compile_output") or ""

            # Track genuine metrics
            tc_time_sec = float(data.get("time") or 0.0)
            tc_time_ms = round(tc_time_sec * 1000, 2)
            total_time_ms += tc_time_ms

            tc_mem = data.get("memory")
            if tc_mem is not None:
                mem_kb = int(tc_mem)
                max_mem_kb = max(max_mem_kb or 0, mem_kb)

            tc_passed = False
            tc_status = "failed"
            tc_err = None
            actual_out = ""

            if compile_out.strip() or status_id == 6:
                # Compilation Error
                tc_status = "compilation_error"
                tc_err = compile_out.strip() or "Compilation Error"
                actual_out = tc_err
                global_compilation_err = tc_err
            elif status_id == 5:
                # Time Limit Exceeded
                tc_status = "timed_out"
                tc_err = f"Time Limit Exceeded: {status_desc}"
                actual_out = tc_err
            elif status_id in (7, 8, 9, 10, 11, 12) or raw_stderr.strip():
                # Runtime Error
                tc_status = "runtime_error"
                tc_err = raw_stderr.strip() or f"Runtime Error ({status_desc})"
                actual_out = tc_err
                if not global_runtime_err:
                    global_runtime_err = tc_err
            else:
                # Execution succeeded cleanly — extract result and evaluate
                extracted_result, console_output = extract_delimited_output(raw_stdout)
                actual_out = extracted_result

                if is_custom_test:
                    tc_passed = True
                    tc_status = "passed"
                elif exp is not None and str(exp).strip():
                    is_match, mismatch_reason = compare_outputs(actual_out, exp)
                    tc_passed = is_match
                    tc_status = "passed" if tc_passed else "failed"
                    if not tc_passed:
                        tc_err = mismatch_reason or "Output mismatch"
                else:
                    # No expected output provided: pass if executed without error
                    tc_passed = True
                    tc_status = "passed"

            if not tc_passed:
                all_passed = False

            results.append({
                "id": idx + 1,
                "name": tc_name,
                "input": str(inp),
                "expected": str(exp),
                "actual": actual_out,
                "passed": tc_passed,
                "status": tc_status,
                "error": tc_err,
                "duration": f"{tc_time_ms}ms"
            })

            tag = "[PASS]" if tc_passed else f"[{tc_status.upper()}]"
            console_logs.append(f"  {tag} {tc_name} ({tc_time_ms}ms) - Output: {str(actual_out)[:80]}")

        elapsed_total = round((time.perf_counter() - t0_all) * 1000, 2)
        passed_count = sum(1 for r in results if r["passed"])

        # Genuine memory in MB if reported by Judge0, otherwise None
        mem_mb = round(max_mem_kb / 1024.0, 2) if max_mem_kb is not None else None

        return CodeRunResponse(
            all_passed=all_passed and len(results) > 0,
            passed_count=passed_count,
            total_count=len(results),
            test_results=results,
            console_output="\n".join(console_logs),
            execution_ms=elapsed_total,
            memory_mb=mem_mb
        )
