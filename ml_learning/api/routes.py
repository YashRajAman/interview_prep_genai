"""
API Routes for the ML Learning Platform.
"""

from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse, Response
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from api.code_runner import execute_code
from api.playground_session import session_manager
import json
import os
import atexit

router = APIRouter()
atexit.register(session_manager.cleanup_all)

# Load topics data
CONTENT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "content")
TOPICS_DIR = os.path.join(CONTENT_DIR, "topics")
NOTEBOOKS_DIR = os.path.join(CONTENT_DIR, "notebooks")
_topics_cache = None


def load_topics():
    """Load the master topics registry."""
    global _topics_cache
    if _topics_cache is not None:
        return _topics_cache

    topics_file = os.path.join(CONTENT_DIR, "topics.json")
    if os.path.exists(topics_file):
        with open(topics_file, "r", encoding="utf-8") as f:
            _topics_cache = json.load(f)
            return _topics_cache
    return {"levels": []}


def get_single_topic(level_id: str, topic_id: str):
    """Load a single topic from individual file or master registry."""
    # Check individual modular file first
    indiv_file = os.path.join(TOPICS_DIR, f"{topic_id}.json")
    if os.path.exists(indiv_file):
        try:
            with open(indiv_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    # Fall back to master topics.json
    topics = load_topics()
    for level in topics.get("levels", []):
        if level_id and level.get("id") != level_id:
            continue
        for topic in level.get("topics", []):
            if topic.get("id") == topic_id:
                return topic
    return None


class CodeExecutionRequest(BaseModel):
    code: str
    timeout: int = 10


class QuizSubmission(BaseModel):
    topic_id: str
    answers: dict  # {question_index: selected_answer}


@router.get("/topics")
async def get_topics():
    """Get all topics organized by level."""
    topics = load_topics()
    return JSONResponse(content=topics)


@router.get("/topic/{level_id}/{topic_id}")
async def get_topic(level_id: str, topic_id: str):
    """Get a specific topic's full content."""
    topic = get_single_topic(level_id, topic_id)
    if topic:
        return JSONResponse(content=topic)
    return JSONResponse(content={"error": "Topic not found"}, status_code=404)


@router.post("/run-code")
async def run_code(request: CodeExecutionRequest):
    """Execute Python code in sandbox."""
    result = execute_code(request.code, request.timeout)
    return JSONResponse(content=result)


@router.post("/check-quiz")
async def check_quiz(submission: QuizSubmission):
    """Check quiz answers and return results."""
    topic = get_single_topic("", submission.topic_id)
    quiz = topic.get("quiz", []) if topic else []

    if not quiz:
        # Fall back search through all levels
        topics = load_topics()
        for level in topics.get("levels", []):
            for t in level.get("topics", []):
                if t.get("id") == submission.topic_id:
                    quiz = t.get("quiz", [])
                    break
            if quiz:
                break

    results = {}
    correct_count = 0
    total = len(quiz)

    for q_idx_str, answer in submission.answers.items():
        clean_str = q_idx_str.lower().lstrip("q").lstrip("_").lstrip("uestion")
        try:
            q_idx = int(clean_str)
            if q_idx > 0 and q_idx == len(quiz) and 0 not in [int(k) for k in submission.answers.keys() if k.isdigit()]:
                q_idx -= 1
        except ValueError:
            continue

        if 0 <= q_idx < len(quiz):
            question = quiz[q_idx]
            is_correct = answer == question.get("correct")
            results[q_idx_str] = {
                "correct": is_correct,
                "correct_answer": question.get("correct"),
                "explanation": question.get("explanation", "")
            }
            if is_correct:
                correct_count += 1

    return JSONResponse(content={
        "results": results,
        "score": correct_count,
        "total": total,
        "percentage": round((correct_count / total) * 100) if total > 0 else 0
    })


# ============================================================
# Downloadable Jupyter Notebook Routes (.ipynb)
# ============================================================

@router.get("/notebooks")
async def list_notebooks():
    """List all available pre-built Jupyter Notebooks by level."""
    catalog_path = os.path.join(NOTEBOOKS_DIR, "index.json")
    if os.path.exists(catalog_path):
        with open(catalog_path, "r", encoding="utf-8") as f:
            return JSONResponse(content=json.load(f))
    return JSONResponse(content={"notebooks": []})


@router.get("/notebook/{level_id}/{topic_id}")
async def download_notebook(level_id: str, topic_id: str):
    """Download a specific topic notebook (.ipynb)."""
    nb_path = os.path.join(NOTEBOOKS_DIR, level_id, f"{topic_id}.ipynb")
    if not os.path.exists(nb_path):
        nb_path = os.path.join(NOTEBOOKS_DIR, f"{topic_id}.ipynb")

    if os.path.exists(nb_path):
        return FileResponse(
            path=nb_path,
            filename=f"{topic_id}.ipynb",
            media_type="application/x-ipynb+json"
        )
    return JSONResponse(content={"error": "Notebook not found"}, status_code=404)


@router.get("/notebooks/download-all")
async def download_all_notebooks():
    """Download all 40 topic notebooks as a ZIP bundle."""
    zip_path = os.path.join(NOTEBOOKS_DIR, "ml_odyssey_all_notebooks.zip")
    if os.path.exists(zip_path):
        return FileResponse(
            path=zip_path,
            filename="ml_odyssey_all_notebooks.zip",
            media_type="application/zip"
        )
    return JSONResponse(content={"error": "Bundle not found"}, status_code=404)


# ============================================================
# Interactive Jupyter Playground Routes & Session Management
# ============================================================

class PlaygroundStartRequest(BaseModel):
    session_id: Optional[str] = None


class PlaygroundExecuteRequest(BaseModel):
    code: str
    cell_id: Optional[str] = None
    timeout: Optional[int] = 30
    theme: Optional[str] = None


class PlaygroundThemeRequest(BaseModel):
    theme: str


@router.post("/playground/session/start")
async def start_playground_session(payload: Optional[PlaygroundStartRequest] = None):
    """
    Create a new interactive notebook session with an isolated temporary environment.
    """
    sid = payload.session_id if payload else None
    session = session_manager.start_session(sid)
    return JSONResponse(content={
        "status": "ready",
        "session_id": session.session_id,
        "created_at": session.created_at,
        "environment_dir": session.working_dir
    })


@router.post("/playground/session/{session_id}/execute")
async def execute_playground_cell(session_id: str, payload: PlaygroundExecuteRequest):
    """
    Execute a code cell within the session's isolated persistent kernel.
    Variables and imports persist across cells in the same session.
    """
    session = session_manager.get_session(session_id)
    if not session:
        # Auto-recreate session if it expired
        session = session_manager.start_session(session_id)

    timeout = payload.timeout or 30
    res = session.execute(payload.code, timeout=timeout, theme=payload.theme)
    return JSONResponse(content=res)


@router.post("/playground/session/{session_id}/theme")
async def set_playground_theme(session_id: str, payload: PlaygroundThemeRequest):
    """
    Update the active Matplotlib rendering theme for the session.
    """
    session = session_manager.get_session(session_id)
    if not session:
        session = session_manager.start_session(session_id)

    ok = session.set_theme(payload.theme)
    return JSONResponse(content={"status": "theme_ok" if ok else "failed", "theme": payload.theme})


@router.post("/playground/session/{session_id}/interrupt")
async def interrupt_playground_kernel(session_id: str):
    """
    Interrupt the currently running execution in the session's kernel.
    """
    session = session_manager.get_session(session_id)
    if not session:
        return JSONResponse(content={"error": "Session not found"}, status_code=404)

    ok = session.interrupt()
    return JSONResponse(content={"status": "interrupted" if ok else "failed"})


@router.post("/playground/session/{session_id}/restart")
async def restart_playground_kernel(session_id: str):
    """
    Restart the session kernel (clears variables and state) while keeping the same session ID.
    """
    session = session_manager.get_session(session_id)
    if not session:
        session = session_manager.start_session(session_id)
    else:
        session.restart()

    return JSONResponse(content={"status": "restarted", "session_id": session_id})


@router.delete("/playground/session/{session_id}")
async def end_playground_session(session_id: str):
    """
    End the notebook session: terminates the kernel process and permanently deletes
    the isolated temporary environment directory from disk.
    """
    deleted = session_manager.end_session(session_id)
    return JSONResponse(content={
        "status": "ended",
        "session_id": session_id,
        "environment_deleted": deleted
    })


@router.post("/playground/session/{session_id}/heartbeat")
async def playground_heartbeat(session_id: str):
    """
    Keep-alive heartbeat for active notebook sessions.
    """
    session = session_manager.get_session(session_id)
    if session:
        return JSONResponse(content={"status": "alive"})
    return JSONResponse(content={"status": "expired"}, status_code=404)


class PlaygroundDownloadRequest(BaseModel):
    title: Optional[str] = "notebook"
    format: Optional[str] = "ipynb"  # "ipynb" or "py"
    cells: List[Dict[str, Any]] = []


@router.post("/playground/download")
async def download_playground_notebook(payload: PlaygroundDownloadRequest):
    """
    Generate and download a Jupyter Notebook (.ipynb) or Python script (.py).
    """
    title = payload.title or "ml_notebook"
    safe_title = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in title)

    if payload.format == "py":
        parts = [f"# %% [markdown]\n# # {title}\n# Generated from ML Odyssey Interactive Playground\n"]
        for c in payload.cells:
            ctype = c.get("cell_type", "code")
            src = c.get("source", "")
            if ctype == "markdown":
                md_lines = ["# " + line for line in src.split("\n")]
                parts.append("# %% [markdown]\n" + "\n".join(md_lines) + "\n")
            else:
                parts.append("# %%\n" + src + "\n")
        content = "\n".join(parts)
        return Response(
            content=content,
            media_type="text/x-python",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.py"'}
        )

    # Otherwise format as genuine .ipynb (v4.5)
    nb_cells = []
    for idx, c in enumerate(payload.cells):
        ctype = c.get("cell_type", "code")
        src = c.get("source", "")
        if isinstance(src, list):
            lines = src
        else:
            lines = [l + "\n" for l in src.split("\n")]
            if lines and lines[-1].endswith("\n"):
                lines[-1] = lines[-1][:-1]

        if ctype == "markdown":
            nb_cells.append({
                "cell_type": "markdown",
                "metadata": {},
                "source": lines
            })
        else:
            outputs = []
            out = c.get("output")
            if out:
                if out.get("stdout"):
                    outputs.append({
                        "output_type": "stream",
                        "name": "stdout",
                        "text": [l + "\n" for l in out["stdout"].split("\n")]
                    })
                if out.get("stderr"):
                    outputs.append({
                        "output_type": "stream",
                        "name": "stderr",
                        "text": [l + "\n" for l in out["stderr"].split("\n")]
                    })
                if out.get("plots"):
                    for p in out["plots"]:
                        outputs.append({
                            "output_type": "display_data",
                            "data": {
                                "image/png": p,
                                "text/plain": ["<Figure size ...>"]
                            },
                            "metadata": {}
                        })
                if out.get("result"):
                    outputs.append({
                        "output_type": "execute_result",
                        "execution_count": idx + 1,
                        "data": {
                            "text/plain": [str(out["result"])]
                        },
                        "metadata": {}
                    })

            nb_cells.append({
                "cell_type": "code",
                "execution_count": idx + 1,
                "metadata": {},
                "outputs": outputs,
                "source": lines
            })

    nb_data = {
        "cells": nb_cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3 (ML Odyssey)",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python",
                "version": "3.10"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }

    return Response(
        content=json.dumps(nb_data, indent=2),
        media_type="application/x-ipynb+json",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.ipynb"'}
    )


@router.post("/playground/upload")
async def upload_playground_notebook(file: UploadFile = File(...)):
    """
    Parse an uploaded .ipynb file and return its cells.
    """
    try:
        content_bytes = await file.read()
        filename = file.filename or "uploaded_notebook.ipynb"

        if filename.endswith(".py"):
            text = content_bytes.decode("utf-8")
            cells = [{"cell_type": "code", "source": text}]
            return JSONResponse(content={"title": filename.replace(".py", ""), "cells": cells})

        data = json.loads(content_bytes.decode("utf-8"))
        raw_cells = data.get("cells", [])
        parsed_cells = []
        for c in raw_cells:
            ctype = c.get("cell_type", "code")
            src = c.get("source", "")
            if isinstance(src, list):
                src = "".join(src)
            parsed_cells.append({
                "cell_type": ctype,
                "source": src
            })

        title = filename.replace(".ipynb", "")
        return JSONResponse(content={"title": title, "cells": parsed_cells})
    except Exception as e:
        return JSONResponse(content={"error": f"Failed to parse notebook: {e}"}, status_code=400)


# Pre-built Notebook Starter Templates
NOTEBOOK_TEMPLATES = {
    "pandas-exploration": {
        "id": "pandas-exploration",
        "title": "Data Exploration with Pandas & Seaborn",
        "description": "Learn to inspect, aggregate, and visualize real-world datasets with DataFrames.",
        "cells": [
            {
                "cell_type": "markdown",
                "source": "# 📊 Exploring Data with Pandas & Seaborn\n\nWelcome to your interactive notebook! In this playground, you can test functions, inspect DataFrames, and visualize data.\n\nRun the cells below in order using `Shift + Enter`."
            },
            {
                "cell_type": "code",
                "source": "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\n# Configure styling\nsns.set_theme(style='darkgrid')\nprint('Libraries imported successfully!')"
            },
            {
                "cell_type": "code",
                "source": "# Generate a realistic dataset of tech product customers\nnp.random.seed(42)\nn = 250\n\ndf = pd.DataFrame({\n    'age': np.random.randint(18, 65, size=n),\n    'income': np.random.normal(75000, 22000, size=n).round(-2),\n    'device': np.random.choice(['iOS', 'Android', 'Web'], size=n, p=[0.45, 0.40, 0.15]),\n    'purchases': np.random.poisson(lam=4.2, size=n),\n    'satisfaction': np.random.uniform(1.0, 5.0, size=n).round(1)\n})\n\n# Display the top rows (notice how DataFrames render as styled tables!)\ndf.head(8)"
            },
            {
                "cell_type": "code",
                "source": "# Compute summary statistics across all numeric columns\ndf.describe().round(2)"
            },
            {
                "cell_type": "code",
                "source": "# Grouping & Aggregations: Average spending & purchases by device type\ndf.groupby('device')[['income', 'purchases', 'satisfaction']].mean().round(2)"
            },
            {
                "cell_type": "code",
                "source": "# Visualize Income vs Purchases with Matplotlib & Seaborn\nplt.figure(figsize=(9, 5))\nsns.scatterplot(\n    data=df,\n    x='income',\n    y='purchases',\n    hue='device',\n    size='satisfaction',\n    sizes=(30, 200),\n    palette='viridis',\n    alpha=0.85\n)\nplt.title('Customer Spending vs Purchase Volume by Device', fontsize=14, pad=12)\nplt.xlabel('Estimated Annual Income ($)', fontsize=11)\nplt.ylabel('Monthly Purchases', fontsize=11)\nplt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')\nplt.tight_layout()\nplt.show()"
            }
        ]
    },
    "sklearn-classification": {
        "id": "sklearn-classification",
        "title": "Scikit-Learn Classification & Evaluation",
        "description": "Train Random Forest and Logistic Regression classifiers on the Iris dataset.",
        "cells": [
            {
                "cell_type": "markdown",
                "source": "# 🤖 Machine Learning Classification with Scikit-Learn\n\nTrain and evaluate models using `train_test_split`, `RandomForestClassifier`, and evaluation metrics."
            },
            {
                "cell_type": "code",
                "source": "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\nfrom sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.metrics import classification_report, confusion_matrix, accuracy_score\n\n# Load dataset\niris = load_iris(as_frame=True)\nX = iris.data\ny = iris.target\nprint(f'Dataset shape: {X.shape}, Classes: {iris.target_names}')\nX.head()"
            },
            {
                "cell_type": "code",
                "source": "# Split into 80% train and 20% test subsets\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.20, random_state=42, stratify=y\n)\nprint(f'Train shape: {X_train.shape}, Test shape: {X_test.shape}')"
            },
            {
                "cell_type": "code",
                "source": "# Train Random Forest Classifier\nclf = RandomForestClassifier(n_estimators=100, random_state=42)\nclf.fit(X_train, y_train)\n\ny_pred = clf.predict(X_test)\nacc = accuracy_score(y_test, y_pred)\nprint(f'Random Forest Test Accuracy: {acc * 100:.2f}%\\n')\nprint(classification_report(y_test, y_pred, target_names=iris.target_names))"
            },
            {
                "cell_type": "code",
                "source": "# Plot Feature Importances\nimportances = pd.Series(clf.feature_importances_, index=X.columns).sort_values(ascending=True)\n\nplt.figure(figsize=(8, 4))\nimportances.plot(kind='barh', color='#7c5cff', edgecolor='white', alpha=0.9)\nplt.title('Random Forest Feature Importances', fontsize=13)\nplt.xlabel('Importance Score')\nplt.grid(axis='x', linestyle='--', alpha=0.5)\nplt.tight_layout()\nplt.show()"
            }
        ]
    },
    "kmeans-clustering": {
        "id": "kmeans-clustering",
        "title": "K-Means Clustering & Elbow Method",
        "description": "Unsupervised pattern discovery and finding optimal cluster count K.",
        "cells": [
            {
                "cell_type": "markdown",
                "source": "# 🔍 Unsupervised Clustering with K-Means\n\nDiscover natural groupings without labels and visualize centroids."
            },
            {
                "cell_type": "code",
                "source": "import numpy as np\nimport matplotlib.pyplot as plt\nfrom sklearn.datasets import make_blobs\nfrom sklearn.cluster import KMeans\n\n# Generate synthetic 2D data clusters\nX, _ = make_blobs(n_samples=350, centers=4, cluster_std=0.85, random_state=42)\nprint(f'Generated {len(X)} points.')"
            },
            {
                "cell_type": "code",
                "source": "# The Elbow Method: Evaluate inertia for k = 1 to 8\ninertias = []\nK_range = range(1, 9)\n\nfor k in K_range:\n    km = KMeans(n_clusters=k, n_init=10, random_state=42)\n    km.fit(X)\n    inertias.append(km.inertia_)\n\nplt.figure(figsize=(8, 4))\nplt.plot(K_range, inertias, 'o-', color='#00d4aa', linewidth=2, markersize=8)\nplt.title('The Elbow Method for Optimal K', fontsize=13)\nplt.xlabel('Number of Clusters (K)')\nplt.ylabel('Inertia (Sum of Squared Distances)')\nplt.grid(True, linestyle='--', alpha=0.5)\nplt.show()"
            },
            {
                "cell_type": "code",
                "source": "# Fit final model with optimal K=4 and visualize clusters\noptimal_km = KMeans(n_clusters=4, n_init=10, random_state=42)\nlabels = optimal_km.fit_predict(X)\ncentroids = optimal_km.cluster_centers_\n\nplt.figure(figsize=(9, 5))\nplt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', s=35, alpha=0.8)\nplt.scatter(centroids[:, 0], centroids[:, 1], c='red', marker='X', s=200, edgecolors='white', label='Centroids')\nplt.title('K-Means Clustered Data with Centroids (K=4)', fontsize=14)\nplt.legend()\nplt.tight_layout()\nplt.show()"
            }
        ]
    },
    "linear-regression": {
        "id": "linear-regression",
        "title": "Linear Regression & Gradient Descent",
        "description": "Fit linear regression lines and compute Mean Squared Error & R² score.",
        "cells": [
            {
                "cell_type": "markdown",
                "source": "# 📈 Linear Regression Playground\n\nExplore single and multi-variable linear regression."
            },
            {
                "cell_type": "code",
                "source": "import numpy as np\nimport matplotlib.pyplot as plt\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.metrics import mean_squared_error, r2_score\n\n# Generate synthetic data with noise: y = 2.5 * x + 5.0 + noise\nnp.random.seed(42)\nX = np.linspace(0, 10, 60).reshape(-1, 1)\ny = 2.5 * X.squeeze() + 5.0 + np.random.normal(0, 2.5, size=60)\n\n# Fit Linear Regression\nmodel = LinearRegression()\nmodel.fit(X, y)\n\ny_pred = model.predict(X)\nr2 = r2_score(y, y_pred)\nmse = mean_squared_error(y, y_pred)\n\nprint(f'Learned Slope (w): {model.coef_[0]:.3f} (True: 2.5)')\nprint(f'Learned Intercept (b): {model.intercept_:.3f} (True: 5.0)')\nprint(f'R² Score: {r2:.4f}, MSE: {mse:.4f}')"
            },
            {
                "cell_type": "code",
                "source": "# Visualize Regression Line and Residuals\nplt.figure(figsize=(9, 5))\nplt.scatter(X, y, color='#00d4aa', alpha=0.8, label='Actual Data Points')\nplt.plot(X, y_pred, color='#ff6b6b', linewidth=2.5, label=f'Model Line: y = {model.coef_[0]:.2f}x + {model.intercept_:.2f}')\n\n# Draw residual lines for a few points\nfor i in range(0, len(X), 4):\n    plt.plot([X[i], X[i]], [y[i], y_pred[i]], 'gray', linestyle=':', alpha=0.6)\n\nplt.title('Linear Regression Fit with Residual Errors', fontsize=14)\nplt.xlabel('Input Feature (X)')\nplt.ylabel('Target Value (y)')\nplt.legend()\nplt.grid(True, linestyle='--', alpha=0.4)\nplt.tight_layout()\nplt.show()"
            }
        ]
    },
    "blank": {
        "id": "blank",
        "title": "Blank Notebook",
        "description": "Start fresh with a clean, empty Python notebook canvas.",
        "cells": [
            {
                "cell_type": "markdown",
                "source": "# 🧪 My Machine Learning Experiment\n\nUse this notebook to explore custom Python code, test ML models, or import your own datasets."
            },
            {
                "cell_type": "code",
                "source": "import numpy as np\nimport pandas as pd\nimport matplotlib.pyplot as plt\n\nprint('Playground ready! Enter your code here.')"
            }
        ]
    }
}


@router.get("/playground/templates")
async def get_playground_templates():
    """
    Return available starter notebook templates.
    """
    templates_summary = [
        {
            "id": t["id"],
            "title": t["title"],
            "description": t["description"]
        }
        for t in NOTEBOOK_TEMPLATES.values()
    ]
    return JSONResponse(content={"templates": templates_summary})


@router.get("/playground/templates/{template_id}")
async def get_playground_template_detail(template_id: str):
    """
    Get full cells for a specific template.
    """
    template = NOTEBOOK_TEMPLATES.get(template_id)
    if template:
        return JSONResponse(content=template)
    return JSONResponse(content={"error": "Template not found"}, status_code=404)

