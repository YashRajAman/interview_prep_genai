"""
Safe code execution module for the ML Learning Platform.
Executes user Python code in a sandboxed subprocess with timeout.
"""

import subprocess
import tempfile
import os
import sys
import base64
import re
import json

ALLOWED_IMPORTS = {
    'math', 'random', 'statistics', 'collections', 'itertools', 'functools',
    'json', 'csv', 're', 'string', 'textwrap', 'datetime', 'time',
    'numpy', 'pandas', 'sklearn', 'matplotlib', 'scipy',
}

FORBIDDEN_PATTERNS = [
    r'\bos\.system\b',
    r'\bsubprocess\b',
    r'\beval\b',
    r'\bexec\b',
    r'\b__import__\b',
    r'\bopen\s*\(',
    r'\bshutil\b',
    r'\bsocket\b',
    r'\brequests\b',
    r'\burllib\b',
    r'\bhttp\b',
    r'\bctypes\b',
    r'\bsys\.exit\b',
    r'\bquit\b',
    r'\bexit\b',
]


def validate_code(code: str) -> tuple[bool, str]:
    """Validate code for safety before execution."""
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, code):
            return False, f"Forbidden pattern detected: {pattern}. This operation is not allowed in the sandbox."
    return True, "OK"


def execute_code(code: str, timeout: int = 10) -> dict:
    """
    Execute Python code in a sandboxed subprocess.
    Returns dict with stdout, stderr, and any generated plot images (base64).
    """
    is_valid, msg = validate_code(code)
    if not is_valid:
        return {
            "success": False,
            "stdout": "",
            "stderr": msg,
            "plots": []
        }

    # Wrap code to capture matplotlib plots
    wrapper = '''
import sys
import io
import base64
import json

# Redirect to capture output
_old_stdout = sys.stdout
_old_stderr = sys.stderr
_captured_stdout = io.StringIO()
_captured_stderr = io.StringIO()
sys.stdout = _captured_stdout
sys.stderr = _captured_stderr

_plots = []

try:
    # Check if matplotlib is used and patch plt.show()
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        _original_show = plt.show
        def _capture_show(*args, **kwargs):
            for fig_num in plt.get_fignums():
                fig = plt.figure(fig_num)
                buf = io.BytesIO()
                fig.savefig(buf, format='png', dpi=100, bbox_inches='tight',
                           facecolor='#161b33', edgecolor='none')
                buf.seek(0)
                _plots.append(base64.b64encode(buf.read()).decode('utf-8'))
                buf.close()
            plt.close('all')
        plt.show = _capture_show
    except ImportError:
        pass

    # Execute user code
    exec("""''' + code.replace('"""', '\\"\\"\\"') + '''""")

    # Capture any remaining matplotlib figures
    try:
        import matplotlib.pyplot as plt
        if plt.get_fignums():
            _capture_show()
    except (ImportError, NameError):
        pass

except Exception as e:
    print(f"Error: {type(e).__name__}: {e}", file=_captured_stderr)

sys.stdout = _old_stdout
sys.stderr = _old_stderr

result = {
    "stdout": _captured_stdout.getvalue(),
    "stderr": _captured_stderr.getvalue(),
    "plots": _plots
}
print("__RESULT_JSON__" + json.dumps(result))
'''

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
                "success": not bool(parsed["stderr"]),
                "stdout": parsed["stdout"],
                "stderr": parsed["stderr"],
                "plots": parsed["plots"]
            }
        else:
            return {
                "success": False,
                "stdout": result.stdout,
                "stderr": result.stderr or "Unknown execution error",
                "plots": []
            }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"⏱️ Execution timed out after {timeout} seconds. Check for infinite loops.",
            "plots": []
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution error: {str(e)}",
            "plots": []
        }
    finally:
        try:
            os.unlink(temp_path)
        except:
            pass
