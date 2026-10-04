"""
SPARKX ADVANCED CODING ASSESSMENT — EXECUTION HARNESS & OUTPUT EVALUATOR
Provides:
1. ExecutionMode enum (FUNCTION, STDIN)
2. LanguageExecutionAdapter: Generates robust, production-grade, data-driven
   driver wrappers for function-style problems and prepares stdin/stdout execution.
   Strictly ZERO hardcoded problem names; works generically across all supported languages.
3. Deterministic output comparison with JSON deep equality, float tolerance,
   and newline/whitespace normalization (strictly ZERO AI fuzzy matching).
4. Delimited machine-comparable result extraction.
"""
import os
import re
import json
import math
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple, Union


class ExecutionMode(str, Enum):
    FUNCTION = "function"
    STDIN = "stdin"


DELIMITER_START = "___SPARKX_RES_START___"
DELIMITER_END = "___SPARKX_RES_END___"


def compare_outputs(actual: Any, expected: Any, float_tolerance: float = 1e-6) -> Tuple[bool, Optional[str]]:
    """
    Deterministic output comparison:
    1. Direct string equality after stripping trailing whitespace and normalizing CRLF to LF.
    2. Deep JSON structure comparison if both expected and actual are valid JSON.
    3. Floating point comparison with configurable epsilon tolerance.
    4. Numeric string equality (e.g. "5" == 5).
    5. Returns (is_match: bool, error_description: Optional[str]).
    """
    if actual is None and expected is None:
        return True, None

    # String normalization
    norm_actual = str(actual).replace("\r\n", "\n").strip()
    norm_expected = str(expected).replace("\r\n", "\n").strip()

    if norm_actual == norm_expected:
        return True, None

    # Check case-insensitive trim for simple outputs (e.g. "true" vs "True")
    if norm_actual.lower() == norm_expected.lower() and norm_expected.lower() in ("true", "false", "null", "none"):
        return True, None

    # Check quote-stripped equality for string outputs (e.g. '"olleh"' vs 'olleh' or "'olleh'")
    if norm_actual.strip("'\"") == norm_expected.strip("'\""):
        return True, None

    # Check numeric comparison if both are numbers
    try:
        f_act = float(norm_actual)
        f_exp = float(norm_expected)
        if math.isclose(f_act, f_exp, rel_tol=float_tolerance, abs_tol=float_tolerance):
            return True, None
    except (ValueError, TypeError):
        pass

    # Attempt JSON deep comparison
    actual_json = None
    expected_json = None

    try:
        actual_json = json.loads(norm_actual)
    except Exception:
        try:
            import ast
            actual_json = ast.literal_eval(norm_actual)
        except Exception:
            pass

    try:
        expected_json = json.loads(norm_expected)
    except Exception:
        try:
            import ast
            expected_json = ast.literal_eval(norm_expected)
        except Exception:
            pass

    if actual_json is not None and expected_json is not None:
        def _deep_equal(a: Any, b: Any) -> bool:
            if isinstance(a, (int, float)) and isinstance(b, (int, float)):
                if isinstance(a, bool) or isinstance(b, bool):
                    return a is b
                return math.isclose(float(a), float(b), rel_tol=float_tolerance, abs_tol=float_tolerance)
            elif isinstance(a, list) and isinstance(b, list):
                if len(a) != len(b):
                    return False
                return all(_deep_equal(x, y) for x, y in zip(a, b))
            elif isinstance(a, dict) and isinstance(b, dict):
                if set(a.keys()) != set(b.keys()):
                    return False
                return all(_deep_equal(a[k], b[k]) for k in a)
            else:
                return a == b

        if _deep_equal(actual_json, expected_json):
            return True, None

    # Mismatch explanation
    err = f"Expected '{norm_expected}', got '{norm_actual}'"
    return False, err


def extract_delimited_output(stdout: str) -> Tuple[str, str]:
    """
    Extracts serialized function return value from between DELIMITER_START and DELIMITER_END.
    Returns (cleaned_result, console_logs).
    If delimiters are not present, returns (stdout.strip(), stdout).
    """
    if not stdout:
        return "", ""

    if DELIMITER_START in stdout and DELIMITER_END in stdout:
        parts = stdout.split(DELIMITER_START, 1)
        console_before = parts[0]
        after_start = parts[1].split(DELIMITER_END, 1)
        delimited_content = after_start[0].strip()
        console_after = after_start[1] if len(after_start) > 1 else ""
        console_clean = (console_before + console_after).strip()
        return delimited_content, console_clean

    return stdout.strip(), stdout


class LanguageExecutionAdapter:
    """
    Language-aware driver adapter that wraps candidate code with an executable harness
    for function-style problems or sets up standard stdin/stdout execution.
    Completely data-driven: no hardcoded problem names.
    """

    @classmethod
    def generate_harness(
        cls,
        code: str,
        language: str,
        test_input: Any,
        mode: Union[ExecutionMode, str] = ExecutionMode.FUNCTION,
        entry_point: Optional[str] = None,
        function_signature: Optional[Dict[str, Any]] = None,
        schema_ddl: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Transforms candidate code into an executable program.
        Returns: (adapted_source_code: str, stdin_data: str)
        """
        lang = (language or "python").lower().strip()
        clean_code = (code or "").strip()
        raw_input_str = test_input if isinstance(test_input, str) else json.dumps(test_input) if test_input is not None else ""

        mode_str = mode.value if isinstance(mode, ExecutionMode) else str(mode).lower()

        if mode_str == "stdin":
            # STDIN mode: pass candidate code as-is; pass input directly to stdin
            return clean_code, raw_input_str

        # FUNCTION mode: generate language-specific driver
        if lang == "python":
            return cls._generate_python_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "javascript":
            return cls._generate_js_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "typescript":
            return cls._generate_ts_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "java":
            return cls._generate_java_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang in ("cpp", "c"):
            return cls._generate_cpp_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "go":
            return cls._generate_go_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "rust":
            return cls._generate_rust_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "swift":
            return cls._generate_swift_harness(clean_code, raw_input_str, entry_point, function_signature)
        elif lang == "sql":
            return cls._generate_sql_harness(clean_code, schema_ddl)
        else:
            # Fallback to stdin mode for unrecognized languages
            return clean_code, raw_input_str

    @classmethod
    def _generate_python_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = json.dumps(raw_input)

        driver = f"""# === SPARKX AUTOGENERATED TEST HARNESS ===
import sys
import json
import inspect

{code}

__SPARKX_RES_START__ = "{DELIMITER_START}"
__SPARKX_RES_END__ = "{DELIMITER_END}"

def __sparkx_driver():
    raw_str = {escaped_input}
    parsed_arg = None
    try:
        parsed_arg = json.loads(raw_str)
    except Exception:
        try:
            import ast
            parsed_arg = ast.literal_eval(raw_str)
        except Exception:
            parsed_arg = raw_str.strip()

    # Locate entry point
    target_fn = globals().get("{ep}")
    if not target_fn or not callable(target_fn):
        sol_cls = globals().get("Solution")
        if sol_cls and inspect.isclass(sol_cls):
            try:
                sol_inst = sol_cls()
                if hasattr(sol_inst, "{ep}") and callable(getattr(sol_inst, "{ep}")):
                    target_fn = getattr(sol_inst, "{ep}")
                elif hasattr(sol_inst, "solve") and callable(getattr(sol_inst, "solve")):
                    target_fn = getattr(sol_inst, "solve")
                elif hasattr(sol_inst, "solution") and callable(getattr(sol_inst, "solution")):
                    target_fn = getattr(sol_inst, "solution")
            except Exception:
                pass

    if not target_fn or not callable(target_fn):
        for candidate_name in ["solution", "solve"]:
            cand = globals().get(candidate_name)
            if cand and callable(cand):
                target_fn = cand
                break

    if not target_fn or not callable(target_fn):
        # Scan user-defined callables
        for name, val in list(globals().items()):
            if callable(val) and not name.startswith("_") and val not in (json.loads, sys.exit):
                target_fn = val
                break

    if not target_fn or not callable(target_fn):
        sys.stderr.write("SparkX Execution Error: No entry-point function '{ep}' or 'solve' found in submission.\\n")
        sys.exit(1)

    try:
        sig = inspect.signature(target_fn)
        param_count = len(sig.parameters)

        if isinstance(parsed_arg, (list, tuple)) and param_count == len(parsed_arg) and param_count > 1:
            res = target_fn(*parsed_arg)
        elif isinstance(parsed_arg, dict) and param_count > 1 and all(k in parsed_arg for k in sig.parameters.keys()):
            res = target_fn(**parsed_arg)
        elif param_count == 0:
            res = target_fn()
        else:
            res = target_fn(parsed_arg)

        sys.stdout.write(f"\\n{{__SPARKX_RES_START__}}\\n")
        sys.stdout.write(json.dumps(res, default=str))
        sys.stdout.write(f"\\n{{__SPARKX_RES_END__}}\\n")
    except Exception as e:
        import traceback
        sys.stderr.write(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    __sparkx_driver()
"""
        return driver, ""

    @classmethod
    def _generate_js_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = json.dumps(raw_input)

        driver = f"""// === SPARKX AUTOGENERATED JS HARNESS ===
const fs = require('fs');

{code}

const __SPARKX_RES_START__ = "{DELIMITER_START}";
const __SPARKX_RES_END__ = "{DELIMITER_END}";

(function __sparkx_driver() {{
  const rawStr = {escaped_input};
  let parsedArg;
  try {{
    parsedArg = JSON.parse(rawStr);
  }} catch (e) {{
    parsedArg = rawStr.trim();
  }}

  let targetFn = null;
  if (typeof {ep} === 'function') targetFn = {ep};
  else if (typeof solution === 'function') targetFn = solution;
  else if (typeof solve === 'function') targetFn = solve;
  else if (typeof module !== 'undefined' && module.exports) {{
    if (typeof module.exports.{ep} === 'function') targetFn = module.exports.{ep};
    else if (typeof module.exports.solution === 'function') targetFn = module.exports.solution;
    else if (typeof module.exports.solve === 'function') targetFn = module.exports.solve;
    else if (typeof module.exports === 'function') targetFn = module.exports;
  }}

  if (!targetFn && typeof Solution === 'function') {{
    try {{
      const inst = new Solution();
      if (typeof inst.{ep} === 'function') targetFn = inst.{ep}.bind(inst);
      else if (typeof inst.solve === 'function') targetFn = inst.solve.bind(inst);
      else if (typeof inst.solution === 'function') targetFn = inst.solution.bind(inst);
    }} catch (e) {{}}
  }}

  if (!targetFn) {{
    process.stderr.write("SparkX Execution Error: No entry-point function '{ep}' or 'solve' found in submission.\\n");
    process.exit(1);
  }}

  try {{
    let res;
    if (Array.isArray(parsedArg) && targetFn.length > 1 && targetFn.length === parsedArg.length) {{
      res = targetFn(...parsedArg);
    }} else if (targetFn.length === 0) {{
      res = targetFn();
    }} else {{
      res = targetFn(parsedArg);
    }}

    process.stdout.write("\\n" + __SPARKX_RES_START__ + "\\n");
    process.stdout.write(JSON.stringify(res));
    process.stdout.write("\\n" + __SPARKX_RES_END__ + "\\n");
  }} catch (err) {{
    process.stderr.write(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }}
}})();
"""
        return driver, ""

    @classmethod
    def _generate_ts_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = json.dumps(raw_input)

        driver = f"""// === SPARKX AUTOGENERATED TS HARNESS ===
{code}

declare var process: any;

(function __sparkx_driver() {{
  const rawStr = {escaped_input};
  let parsedArg: any;
  try {{
    parsedArg = JSON.parse(rawStr);
  }} catch (e) {{
    parsedArg = typeof rawStr === 'string' ? rawStr.trim() : rawStr;
  }}

  let targetFn: any = null;
  try {{
    targetFn = eval("typeof " + "{ep}" + " !== 'undefined' ? " + "{ep}" + " : null");
  }} catch (e) {{}}
  if (!targetFn) {{
    try {{
      targetFn = eval("typeof solve !== 'undefined' ? solve : null");
    }} catch (e) {{}}
  }}
  if (!targetFn) {{
    try {{
      targetFn = eval("typeof solution !== 'undefined' ? solution : null");
    }} catch (e) {{}}
  }}

  if (!targetFn) {{
    process.stderr.write("SparkX Execution Error: No entry-point function '{ep}' found in submission.\\n");
    process.exit(1);
  }}

  try {{
    let res: any;
    if (Array.isArray(parsedArg) && targetFn.length > 1 && targetFn.length === parsedArg.length) {{
      res = targetFn(...parsedArg);
    }} else if (targetFn.length === 0) {{
      res = targetFn();
    }} else {{
      res = targetFn(parsedArg);
    }}

    console.log("\\n{DELIMITER_START}\\n" + JSON.stringify(res) + "\\n{DELIMITER_END}");
  }} catch (err) {{
    process.stderr.write(err && (err as any).stack ? (err as any).stack : String(err));
    process.exit(1);
  }}
}})();
"""
        return driver, ""

    @classmethod
    def _generate_java_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        """
        Java in Judge0 requires Main class.
        If candidate wrote 'public class Main' with main(), pass as-is with stdin.
        Otherwise wraps candidate's Solution class (or methods) with a dynamic reflection Main driver.
        """
        if "public static void main" in code and "class Main" in code:
            return code, raw_input

        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"

        adapted = re.sub(r"\bpublic\s+class\s+Solution\b", "class Solution", code)
        if "class Solution" not in adapted:
            adapted = f"class Solution {{\n{adapted}\n}}"

        escaped_input = raw_input.replace("\\", "\\\\").replace('"', '\\"')

        harness = f"""import java.util.*;
import java.io.*;
import java.lang.reflect.*;

{adapted}

public class Main {{
    public static void main(String[] args) {{
        try {{
            String raw = "{escaped_input}";
            Method targetMethod = null;
            for (Method m : Solution.class.getDeclaredMethods()) {{
                if (!m.isSynthetic()) {{
                    if ("{ep}".equals(m.getName()) || "solve".equals(m.getName()) || "solution".equals(m.getName()) || targetMethod == null) {{
                        targetMethod = m;
                        if ("{ep}".equals(m.getName())) break;
                    }}
                }}
            }}
            if (targetMethod == null) {{
                System.err.println("SparkX Execution Error: No target method found in Solution class.");
                System.exit(1);
            }}
            targetMethod.setAccessible(true);
            Class<?>[] ptypes = targetMethod.getParameterTypes();
            Object[] callArgs = parseArgs(raw, ptypes);
            Object inst = Modifier.isStatic(targetMethod.getModifiers()) ? null : Solution.class.getDeclaredConstructor().newInstance();
            Object result = targetMethod.invoke(inst, callArgs);
            System.out.println("\\n{DELIMITER_START}");
            if (result != null && result.getClass().isArray()) {{
                if (result instanceof int[]) System.out.println(Arrays.toString((int[]) result));
                else if (result instanceof long[]) System.out.println(Arrays.toString((long[]) result));
                else if (result instanceof double[]) System.out.println(Arrays.toString((double[]) result));
                else if (result instanceof boolean[]) System.out.println(Arrays.toString((boolean[]) result));
                else System.out.println(Arrays.deepToString((Object[]) result));
            }} else {{
                System.out.println(result != null ? result.toString() : "null");
            }}
            System.out.println("{DELIMITER_END}");
        }} catch (Exception e) {{
            e.printStackTrace();
            System.exit(1);
        }}
    }}

    private static Object[] parseArgs(String raw, Class<?>[] ptypes) {{
        if (ptypes.length == 0) return new Object[0];
        String s = raw.trim();
        List<String> tokens = new ArrayList<>();
        if (ptypes.length > 1 && s.startsWith("[") && s.endsWith("]")) {{
            s = s.substring(1, s.length() - 1).trim();
        }}
        int depth = 0;
        StringBuilder cur = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {{
            char c = s.charAt(i);
            if (c == '[' || c == '{{' || c == '(') depth++;
            else if (c == ']' || c == '}}' || c == ')') depth--;
            else if (c == ',' && depth == 0) {{
                tokens.add(cur.toString().trim());
                cur = new StringBuilder();
                continue;
            }}
            cur.append(c);
        }}
        if (cur.length() > 0) tokens.add(cur.toString().trim());

        Object[] args = new Object[ptypes.length];
        for (int i = 0; i < ptypes.length; i++) {{
            String t = i < tokens.size() ? tokens.get(i) : "";
            args[i] = convertToken(t, ptypes[i]);
        }}
        return args;
    }}

    private static Object convertToken(String t, Class<?> target) {{
        t = t.trim();
        if (target == int.class || target == Integer.class) {{
            return Integer.parseInt(t.replaceAll("[^0-9-]", ""));
        }} else if (target == long.class || target == Long.class) {{
            return Long.parseLong(t.replaceAll("[^0-9-]", ""));
        }} else if (target == double.class || target == Double.class) {{
            return Double.parseDouble(t);
        }} else if (target == boolean.class || target == Boolean.class) {{
            return Boolean.parseBoolean(t);
        }} else if (target == String.class) {{
            return t.replace("\\\"", "");
        }} else if (target == int[].class) {{
            String inner = t.replaceAll("[\\\\[\\\\]]", "").trim();
            if (inner.isEmpty()) return new int[0];
            String[] parts = inner.split(",");
            int[] arr = new int[parts.length];
            for (int j = 0; j < parts.length; j++) arr[j] = Integer.parseInt(parts[j].trim());
            return arr;
        }}
        return t;
    }}
}}
"""
        return harness, ""

    @classmethod
    def _generate_cpp_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        if "int main(" in code or "main()" in code:
            return code, raw_input

        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = raw_input.replace("\\", "\\\\").replace('"', '\\"')

        # Inspect if Solution class or standalone function
        is_solution_class = "class Solution" in code

        # Inspect parameters from signature or regex
        param_types = []
        if function_signature and function_signature.get("params"):
            param_types = [p.get("type", "int") for p in function_signature["params"]]
        else:
            m = re.search(rf'([a-zA-Z0-9_:<>*&]+)\s+{re.escape(ep)}\s*\(([^)]*)\)', code)
            if not m:
                m = re.search(r'([a-zA-Z0-9_:<>*&]+)\s+solve\s*\(([^)]*)\)', code)
            if m:
                raw_params = m.group(2).strip()
                if raw_params:
                    parts = raw_params.split(",")
                    for part in parts:
                        tokens = part.strip().split()
                        if len(tokens) >= 2:
                            param_types.append(tokens[0])
                        elif len(tokens) == 1:
                            param_types.append(tokens[0])

        if not param_types:
            param_types = ["int", "int"]

        # Build token conversions
        conv_lines = []
        call_args = []
        for i, ptype in enumerate(param_types):
            var_name = f"arg_{i}"
            call_args.append(var_name)
            ptype_lower = ptype.lower()
            if "int" in ptype_lower:
                conv_lines.append(f"    int {var_name} = tokens.size() > {i} ? std::stoi(tokens[{i}]) : 0;")
            elif "long" in ptype_lower:
                conv_lines.append(f"    long long {var_name} = tokens.size() > {i} ? std::stoll(tokens[{i}]) : 0;")
            elif "double" in ptype_lower or "float" in ptype_lower:
                conv_lines.append(f"    double {var_name} = tokens.size() > {i} ? std::stod(tokens[{i}]) : 0.0;")
            elif "string" in ptype_lower:
                conv_lines.append(f"    std::string {var_name} = tokens.size() > {i} ? tokens[{i}] : \"\";")
            else:
                conv_lines.append(f"    int {var_name} = tokens.size() > {i} ? std::stoi(tokens[{i}]) : 0;")

        conv_code = "\n".join(conv_lines)
        call_str = ", ".join(call_args)

        invoke_line = f"    Solution sol;\n    auto res = sol.{ep}({call_str});" if is_solution_class else f"    auto res = {ep}({call_str});"

        harness = f"""#include <iostream>
#include <string>
#include <vector>
#include <sstream>

{code}

std::vector<std::string> parse_tokens(const std::string& raw) {{
    std::vector<std::string> tokens;
    std::string s = raw;
    if (!s.empty() && s.front() == '[') s = s.substr(1);
    if (!s.empty() && s.back() == ']') s.pop_back();
    std::stringstream ss(s);
    std::string token;
    while (std::getline(ss, token, ',')) {{
        size_t first = token.find_first_not_of(" \\t\\n\\r");
        size_t last = token.find_last_not_of(" \\t\\n\\r");
        if (first != std::string::npos && last != std::string::npos) {{
            tokens.push_back(token.substr(first, (last - first + 1)));
        }}
    }}
    return tokens;
}}

int main() {{
    std::string raw = "{escaped_input}";
    auto tokens = parse_tokens(raw);
{conv_code}
{invoke_line}
    std::cout << "\\n{DELIMITER_START}\\n";
    std::cout << res << "\\n";
    std::cout << "{DELIMITER_END}\\n";
    return 0;
}}
"""
        return harness, ""

    @classmethod
    def _generate_go_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        if "func main(" in code:
            return code, raw_input

        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = raw_input.replace("\\", "\\\\").replace('"', '\\"')

        # Strip any existing package declaration so package main is guaranteed at line 1
        clean_user_code = re.sub(r'^\s*package\s+\w+\s*', '', code).strip()

        # Inspect parameters count
        param_count = 2
        if function_signature and function_signature.get("params"):
            param_count = len(function_signature["params"])
        else:
            m = re.search(rf'func\s+{re.escape(ep)}\s*\(([^)]*)\)', code)
            if not m:
                m = re.search(r'func\s+solve\s*\(([^)]*)\)', code)
            if m:
                raw_p = m.group(1).strip()
                if raw_p:
                    param_count = len(raw_p.split(","))

        conversions = []
        call_args = []
        for i in range(param_count):
            var_name = f"arg{i}"
            call_args.append(var_name)
            conversions.append(f"""    var {var_name} int
    if len(tokens) > {i} {{
        {var_name}, _ = strconv.Atoi(tokens[{i}])
    }}""")

        conv_code = "\n".join(conversions)
        call_str = ", ".join(call_args)

        harness = f"""package main

import (
    "fmt"
    "strconv"
    "strings"
)

{clean_user_code}

func parseTokens(raw string) []string {{
    s := strings.TrimSpace(raw)
    s = strings.TrimPrefix(s, "[")
    s = strings.TrimSuffix(s, "]")
    parts := strings.Split(s, ",")
    var res []string
    for _, p := range parts {{
        trimmed := strings.TrimSpace(p)
        if len(trimmed) > 0 {{
            res = append(res, trimmed)
        }}
    }}
    return res
}}

func main() {{
    raw := "{escaped_input}"
    tokens := parseTokens(raw)
{conv_code}
    res := {ep}({call_str})
    fmt.Printf("\\n{DELIMITER_START}\\n%v\\n{DELIMITER_END}\\n", res)
}}
"""
        return harness, ""

    @classmethod
    def _generate_rust_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        if "fn main(" in code:
            return code, raw_input

        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = raw_input.replace("\\", "\\\\").replace('"', '\\"')

        param_count = 2
        if function_signature and function_signature.get("params"):
            param_count = len(function_signature["params"])
        else:
            m = re.search(rf'fn\s+{re.escape(ep)}\s*\(([^)]*)\)', code)
            if not m:
                m = re.search(r'fn\s+solve\s*\(([^)]*)\)', code)
            if m:
                raw_p = m.group(1).strip()
                if raw_p:
                    param_count = len(raw_p.split(","))

        conversions = []
        call_args = []
        for i in range(param_count):
            var_name = f"arg_{i}"
            call_args.append(var_name)
            conversions.append(f"    let {var_name}: i32 = tokens.get({i}).and_then(|s| s.parse().ok()).unwrap_or(0);")

        conv_code = "\n".join(conversions)
        call_str = ", ".join(call_args)

        harness = f"""{code}

fn parse_tokens(raw: &str) -> Vec<String> {{
    let mut s = raw.trim();
    if s.starts_with('[') {{ s = &s[1..]; }}
    if s.ends_with(']') {{ s = &s[..s.len() - 1]; }}
    s.split(',')
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .collect()
}}

fn main() {{
    let raw = "{escaped_input}";
    let tokens = parse_tokens(raw);
{conv_code}
    let res = {ep}({call_str});
    println!("\\n{DELIMITER_START}\\n{{:?}}\\n{DELIMITER_END}\\n", res);
}}
"""
        return harness, ""

    @classmethod
    def _generate_swift_harness(
        cls,
        code: str,
        raw_input: str,
        entry_point: Optional[str],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str]:
        if "CommandLine.arguments" in code or "readLine()" in code:
            return code, raw_input

        ep = entry_point or (function_signature.get("name") if function_signature else "") or "solve"
        escaped_input = json.dumps(raw_input)

        # Inspect parameter labels and types
        params_info = []
        if function_signature and function_signature.get("params"):
            for p in function_signature["params"]:
                params_info.append((p.get("name", "arg"), p.get("type", "Int")))
        else:
            m = re.search(rf'func\s+{re.escape(ep)}\s*\(([^)]*)\)', code)
            if not m:
                m = re.search(r'func\s+solve\s*\(([^)]*)\)', code)
            if m:
                raw_p = m.group(1).strip()
                if raw_p:
                    for part in raw_p.split(","):
                        if ":" in part:
                            label, typ = part.split(":", 1)
                            params_info.append((label.strip(), typ.strip()))

        if not params_info:
            params_info = [("a", "Int"), ("b", "Int")]

        call_args = []
        for i, (label, typ) in enumerate(params_info):
            call_args.append(f"{label}: (arr[{i}] as! {typ})")
        call_str = ", ".join(call_args)

        harness = f"""import Foundation

{code}

let __SPARKX_RES_START__ = "{DELIMITER_START}"
let __SPARKX_RES_END__ = "{DELIMITER_END}"

func __sparkx_driver() {{
    let rawStr = {escaped_input}
    guard let data = rawStr.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data, options: []),
          let arr = json as? [Any], arr.count >= {len(params_info)} else {{
        return
    }}
    let res = {ep}({call_str})
    print("\\n\\(__SPARKX_RES_START__)\\n")
    print(res)
    print("\\n\\(__SPARKX_RES_END__)\\n")
}}

__sparkx_driver()
"""
        return harness, ""

    @classmethod
    def _generate_sql_harness(cls, query: str, schema_ddl: Optional[str]) -> Tuple[str, str]:
        full_sql = ""
        if schema_ddl and schema_ddl.strip():
            full_sql += schema_ddl.strip() + "\n\n"
        full_sql += query.strip()
        if not full_sql.endswith(";"):
            full_sql += ";"
        return full_sql, ""
