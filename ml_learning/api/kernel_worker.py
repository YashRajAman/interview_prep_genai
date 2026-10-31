"""
ML Odyssey — Interactive Kernel Worker Process
Uses IPython InteractiveShell for 100% Jupyter fidelity.
Executes inside an isolated environment directory.
Captures stdout, stderr, DataFrame HTML, and Matplotlib figures.
Supports dynamic multi-theme rendering (Dark, Light, Cyberpunk, Emerald, Sunset, Nord).
"""

import sys
import os
import io
import json
import base64
import traceback

# Configure matplotlib to non-interactive Agg backend before any other imports
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
except ImportError:
    plt = None

# Multi-Theme Definitions for Matplotlib rendering
THEME_CONFIGS = {
    "dark": {
        "is_dark": True,
        "fig": "#13172e",
        "ax": "#1a203c",
        "spine": "#334155",
        "label": "#e2e8f0",
        "title": "#f8fafc",
        "text": "#f8fafc",
        "tick": "#cbd5e1",
        "grid": "#262f4d",
    },
    "light": {
        "is_dark": False,
        "fig": "#ffffff",
        "ax": "#f8fafc",
        "spine": "#cbd5e1",
        "label": "#334155",
        "title": "#0f172a",
        "text": "#0f172a",
        "tick": "#475569",
        "grid": "#e2e8f0",
    },
    "cyberpunk": {
        "is_dark": True,
        "fig": "#140b2e",
        "ax": "#1f1245",
        "spine": "#582899",
        "label": "#c4b5fd",
        "title": "#f5f3ff",
        "text": "#f5f3ff",
        "tick": "#c4b5fd",
        "grid": "#3b1b68",
    },
    "emerald": {
        "is_dark": True,
        "fig": "#0b221c",
        "ax": "#12332a",
        "spine": "#225a4a",
        "label": "#a7f3d0",
        "title": "#ecfdf5",
        "text": "#ecfdf5",
        "tick": "#a7f3d0",
        "grid": "#174236",
    },
    "sunset": {
        "is_dark": True,
        "fig": "#201a17",
        "ax": "#2c2420",
        "spine": "#57463c",
        "label": "#fde68a",
        "title": "#fffbeb",
        "text": "#fffbeb",
        "tick": "#fde68a",
        "grid": "#3f332c",
    },
    "nord": {
        "is_dark": True,
        "fig": "#242933",
        "ax": "#2e3440",
        "spine": "#434c5e",
        "label": "#d8dee9",
        "title": "#eceff4",
        "text": "#eceff4",
        "tick": "#d8dee9",
        "grid": "#3b4252",
    }
}

CURRENT_THEME = "dark"


def apply_theme(theme_name: str):
    """Configure matplotlib with the selected aesthetic theme."""
    global CURRENT_THEME
    if plt is None:
        return
    t = THEME_CONFIGS.get(theme_name, THEME_CONFIGS["dark"])
    CURRENT_THEME = theme_name if theme_name in THEME_CONFIGS else "dark"
    try:
        if t["is_dark"]:
            plt.style.use('dark_background')
        else:
            plt.style.use('default')

        plt.rcParams.update({
            'figure.facecolor': t["fig"],
            'axes.facecolor': t["ax"],
            'axes.edgecolor': t["spine"],
            'axes.labelcolor': t["label"],
            'axes.titlecolor': t["title"],
            'text.color': t["text"],
            'xtick.color': t["tick"],
            'ytick.color': t["tick"],
            'grid.color': t["grid"],
            'grid.alpha': 0.6,
            'figure.autolayout': True
        })
    except Exception:
        pass


apply_theme("dark")

# Initialize IPython InteractiveShell
from IPython.core.interactiveshell import InteractiveShell
from IPython.utils.capture import capture_output

shell = InteractiveShell.instance()
shell.colors = 'NoColor'

# Global capture lists for the current cell
_captured_plots = []
_captured_html_outputs = []


def _adjust_figure_contrast(fig):
    """
    Harmonize figure text, labels, ticks, and frames with the currently active theme.
    Ensures maximum readability whether in Light, Dark, Cyberpunk, Emerald, Sunset, or Nord mode.
    """
    t = THEME_CONFIGS.get(CURRENT_THEME, THEME_CONFIGS["dark"])
    try:
        fig.set_facecolor(t["fig"])
        for ax in fig.axes:
            ax_face = ax.get_facecolor()
            # If default white or transparent or opposite theme color, harmonize
            if t["is_dark"]:
                if ax_face in ((1.0, 1.0, 1.0, 1.0), 'white', '#ffffff', (0.0, 0.0, 0.0, 0.0)):
                    ax.set_facecolor(t["ax"])
            else:
                if ax_face in ((0.0, 0.0, 0.0, 1.0), 'black', '#000000', (0.0, 0.0, 0.0, 0.0)):
                    ax.set_facecolor(t["ax"])

            # Set title and labels
            ax.title.set_color(t["title"])
            ax.xaxis.label.set_color(t["label"])
            ax.yaxis.label.set_color(t["label"])

            # Set ticks
            ax.tick_params(colors=t["tick"], which='both')

            # Harmonize spines
            for spine in ax.spines.values():
                spine.set_edgecolor(t["spine"])

            # Harmonize legend
            legend = ax.get_legend()
            if legend:
                frame = legend.get_frame()
                frame.set_facecolor(t["ax"])
                frame.set_edgecolor(t["spine"])
                for txt in legend.get_texts():
                    txt.set_color(t["text"])

        if hasattr(fig, '_suptitle') and fig._suptitle:
            fig._suptitle.set_color(t["title"])
    except Exception:
        pass


def _capture_figures():
    """Capture all currently open matplotlib figures as base64 PNGs and close them."""
    plots = []
    if plt is None:
        return plots
    t = THEME_CONFIGS.get(CURRENT_THEME, THEME_CONFIGS["dark"])
    try:
        fignums = plt.get_fignums()
        for num in fignums:
            fig = plt.figure(num)
            _adjust_figure_contrast(fig)
            buf = io.BytesIO()
            fig.savefig(
                buf,
                format='png',
                dpi=100,
                bbox_inches='tight',
                facecolor=t["fig"],
                edgecolor='none'
            )
            buf.seek(0)
            plots.append(base64.b64encode(buf.read()).decode('utf-8'))
            buf.close()
        plt.close('all')
    except Exception as e:
        print(f"[Kernel] Error capturing plot: {e}", file=sys.stderr)
    return plots


def _patched_show(*args, **kwargs):
    """Intercept plt.show() to save figures inline into cell output."""
    global _captured_plots
    _captured_plots.extend(_capture_figures())


if plt is not None:
    plt.show = _patched_show


# Custom %matplotlib line magic to prevent NotImplementedError in headless mode
def _custom_matplotlib_magic(line):
    """Handle %matplotlib inline / %matplotlib notebook smoothly."""
    if plt is not None:
        try:
            import matplotlib
            matplotlib.use('Agg')
        except Exception:
            pass
    return "Agg backend ready (inline plots enabled)"


shell.register_magic_function(_custom_matplotlib_magic, 'line', 'matplotlib')


def format_dataframe_html(val):
    """If val is a pandas DataFrame or Series, render it as clean HTML table."""
    if val is None:
        return None
    val_type = type(val).__name__
    if hasattr(val, 'to_html') and val_type in ('DataFrame', 'Series'):
        try:
            return val.to_html(classes='dataframe notebook-table', border=0)
        except Exception:
            pass
    return None


def execute_cell(code: str, theme: str = None) -> dict:
    """
    Execute cell code inside IPython InteractiveShell.
    Captures stdout, stderr, execution result, HTML tables, and figures.
    """
    global _captured_plots, _captured_html_outputs
    _captured_plots = []
    _captured_html_outputs = []

    if theme and theme != CURRENT_THEME:
        apply_theme(theme)

    if not code or not code.strip():
        return {
            "success": True,
            "stdout": "",
            "stderr": "",
            "result": None,
            "result_html": None,
            "plots": []
        }

    with capture_output(display=True) as cap:
        exec_result = shell.run_cell(code)

    # Capture any plots rendered during execution or remaining open
    _captured_plots.extend(_capture_figures())

    # Check for rich outputs from IPython display() calls
    for out in cap.outputs:
        data = getattr(out, 'data', {})
        if isinstance(data, dict):
            if 'text/html' in data:
                _captured_html_outputs.append(data['text/html'])
            if 'image/png' in data and data['image/png'] not in _captured_plots:
                _captured_plots.append(data['image/png'])

    # Format cell return expression
    result_val = exec_result.result
    result_repr = None
    result_html = None

    if result_val is not None:
        result_html = format_dataframe_html(result_val)
        try:
            result_repr = repr(result_val)
        except Exception:
            result_repr = str(result_val)

    if _captured_html_outputs:
        combined_html = "".join(_captured_html_outputs)
        if result_html:
            combined_html += result_html
        result_html = combined_html

    stdout_text = cap.stdout or ""
    stderr_text = cap.stderr or ""

    # If execution failed, get error message
    success = exec_result.success
    if not success and exec_result.error_in_exec:
        err_msg = str(exec_result.error_in_exec)
        if not stderr_text and not stdout_text:
            stderr_text = err_msg

    return {
        "success": success,
        "stdout": stdout_text,
        "stderr": stderr_text,
        "result": result_repr,
        "result_html": result_html,
        "plots": _captured_plots
    }


def reset_kernel():
    """Reset the shell namespace while preserving core helpers."""
    global shell, _captured_plots, _captured_html_outputs
    _captured_plots = []
    _captured_html_outputs = []
    if plt is not None:
        try:
            plt.close('all')
        except Exception:
            pass
    shell.reset(new_session=True)
    shell.register_magic_function(_custom_matplotlib_magic, 'line', 'matplotlib')
    apply_theme(CURRENT_THEME)


def main():
    """Main worker loop reading JSON lines from stdin."""
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(line_buffering=True)

    for line in sys.stdin:
        line_str = line.strip()
        if not line_str:
            continue

        try:
            req = json.loads(line_str)
        except Exception as e:
            res = {"success": False, "stderr": f"Invalid JSON request: {e}"}
            print(json.dumps(res), flush=True)
            continue

        action = req.get("action", "execute")

        if action == "exit":
            break
        elif action == "reset":
            reset_kernel()
            print(json.dumps({"status": "reset_ok", "success": True}), flush=True)
        elif action == "theme":
            theme_name = req.get("theme", "dark")
            apply_theme(theme_name)
            print(json.dumps({"status": "theme_ok", "theme": CURRENT_THEME}), flush=True)
        elif action == "execute":
            code = req.get("code", "")
            theme = req.get("theme", None)
            res = execute_cell(code, theme=theme)
            print(json.dumps(res), flush=True)
        elif action == "ping":
            print(json.dumps({"status": "pong", "success": True}), flush=True)
        else:
            print(json.dumps({"success": False, "stderr": f"Unknown action: {action}"}), flush=True)


if __name__ == "__main__":
    main()
