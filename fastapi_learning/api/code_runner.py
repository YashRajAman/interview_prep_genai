"""
Safe code execution module for the FastAPI Learning Platform.
Executes user Python code in a sandboxed subprocess with timeout.
Supports FastAPI TestClient execution for API testing.
"""

import subprocess
import tempfile
import os
import sys
import json
import re

ALLOWED_IMPORTS = {
    # Standard library
    'math', 'random', 'statistics', 'collections', 'itertools', 'functools',
    'json', 'csv', 're', 'string', 'textwrap', 'datetime', 'time',
    'enum', 'typing', 'dataclasses', 'abc', 'contextlib', 'uuid',
    'pathlib', 'io', 'base64', 'hashlib', 'secrets', 'copy',
    # FastAPI ecosystem
    'fastapi', 'starlette', 'pydantic', 'pydantic_settings',
    'sqlalchemy', 'httpx', 'uvicorn', 'jose', 'passlib',
    'multipart', 'orjson',
}

FORBIDDEN_PATTERNS = [
    r'\bos\.system\b',
    r'\bos\.popen\b',
    r'\bsubprocess\b',
    r'\beval\b',
    r'\bexec\b',
    r'\b__import__\b',
    r'\bopen\s*\(',
    r'\bshutil\b',
    r'\bsocket\b',
    r'\bctypes\b',
    r'\bsys\.exit\b',
    r'\bquit\b',
    r'\bexit\b',
    r'\bimportlib\b',
    r'\bpickle\b',
    r'\bmarshal\b',
    r'\bcompile\b',
]


def validate_code(code: str) -> tuple[bool, str]:
    """Validate code for safety before execution."""
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, code):
            return False, f"Forbidden pattern detected: {pattern}. This operation is not allowed in the sandbox."
    return True, "OK"


def execute_code(code: str, timeout: int = 15, test_requests: list = None) -> dict:
    """
    Execute Python code in a sandboxed subprocess.
    
    If test_requests is provided, the code is expected to define a FastAPI `app`.
    TestClient will be used to make HTTP requests against it.
    Otherwise, simple stdout/stderr capture is used.
    """
    is_valid, msg = validate_code(code)
    if not is_valid:
        return {
            "success": False,
            "stdout": "",
            "stderr": msg,
            "http_responses": [],
        }

    # Build the wrapper
    if test_requests:
        wrapper = build_testclient_wrapper(code, test_requests, timeout)
    else:
        wrapper = build_simple_wrapper(code)

    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='/tmp') as f:
            f.write(wrapper)
            f.flush()
            temp_path = f.name

        result = subprocess.run(
            [sys.executable, temp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd='/tmp'
        )

        # Parse the result
        full_output = result.stdout
        if "__RESULT_JSON__" in full_output:
            json_str = full_output.split("__RESULT_JSON__")[1]
            parsed = json.loads(json_str)
            return {
                "success": not bool(parsed.get("stderr", "")),
                "stdout": parsed.get("stdout", ""),
                "stderr": parsed.get("stderr", ""),
                "http_responses": parsed.get("http_responses", []),
            }
        else:
            return {
                "success": False,
                "stdout": result.stdout,
                "stderr": result.stderr or "Unknown execution error",
                "http_responses": [],
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"⏱️ Execution timed out after {timeout} seconds. Check for infinite loops.",
            "http_responses": [],
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "http_responses": [],
        }
    finally:
        try:
            os.unlink(temp_path)
        except Exception:
            pass


def build_simple_wrapper(code: str) -> str:
    """Build wrapper for simple stdout/stderr capture."""
    escaped_code = code.replace('"""', '\\"\\"\\"')
    return f'''
import sys, io, json

_old_stdout = sys.stdout
_old_stderr = sys.stderr
_captured_stdout = io.StringIO()
_captured_stderr = io.StringIO()
sys.stdout = _captured_stdout
sys.stderr = _captured_stderr

try:
    exec("""{escaped_code}""")
except Exception as e:
    print(f"Error: {{type(e).__name__}}: {{e}}", file=_captured_stderr)

sys.stdout = _old_stdout
sys.stderr = _old_stderr

result = {{
    "stdout": _captured_stdout.getvalue(),
    "stderr": _captured_stderr.getvalue(),
    "http_responses": []
}}
print("__RESULT_JSON__" + json.dumps(result))
'''


def build_testclient_wrapper(code: str, test_requests: list, timeout: int) -> str:
    """Build wrapper for FastAPI TestClient execution."""
    escaped_code = code.replace('"""', '\\"\\"\\"')
    requests_json = json.dumps(test_requests)
    return f'''
import sys, io, json

_captured_stdout = io.StringIO()
_captured_stderr = io.StringIO()
sys.stdout = _captured_stdout
sys.stderr = _captured_stderr

_http_responses = []

try:
    # Execute user code (defines `app`)
    exec("""{escaped_code}""")

    # Check if app is defined
    _app = locals().get("app")
    if _app is None:
        raise NameError("No 'app' variable found. Define a FastAPI app instance.")

    # Import TestClient and make requests
    from fastapi.testclient import TestClient
    _client = TestClient(_app)

    _requests = {requests_json}

    for _req in _requests:
        _method = _req.get("method", "GET").lower()
        _path = _req.get("path", "/")
        _json_body = _req.get("json")
        _headers = _req.get("headers")
        _params = _req.get("params")

        # Build kwargs — only pass non-None values
        # GET/DELETE/HEAD don't accept json param in httpx/TestClient
        _kwargs = {{}}
        if _json_body is not None and _method in ("post", "put", "patch"):
            _kwargs["json"] = _json_body
        if _headers is not None:
            _kwargs["headers"] = _headers
        if _params is not None:
            _kwargs["params"] = _params

        _response = getattr(_client, _method)(_path, **_kwargs)

        _resp_body = None
        try:
            _resp_body = _response.json()
        except Exception:
            _resp_body = _response.text

        _http_responses.append({{
            "request": {{"method": _req.get("method", "GET").upper(), "path": _path}},
            "status_code": _response.status_code,
            "headers": dict(_response.headers),
            "body": _resp_body,
        }})

except Exception as e:
    print(f"Error: {{type(e).__name__}}: {{e}}", file=_captured_stderr)

sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

result = {{
    "stdout": _captured_stdout.getvalue(),
    "stderr": _captured_stderr.getvalue(),
    "http_responses": _http_responses
}}
print("__RESULT_JSON__" + json.dumps(result, default=str))
'''
