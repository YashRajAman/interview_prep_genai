"""
ML Odyssey — Jupyter Notebook Generator
Converts curriculum topics into structured, fully-featured Jupyter Notebooks (.ipynb)
for all 40 topics across Novice, Beginner, Intermediate, Advanced, and Professional.
"""

import os
import glob
import json
import zipfile

NOTEBOOKS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "content", "notebooks")
TOPICS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "content", "topics")


def make_notebook(title, description, level_name, sections, code_starter, code_title):
    """Create a standard Jupyter Notebook v4 dict."""
    cells = []

    # 1. Header Markdown Cell
    header_md = [
        f"# {title}\n",
        f"**Level:** {level_name.capitalize()} | **Interactive Machine Learning Curriculum**\n\n",
        f"> {description}\n\n",
        "---\n\n",
        "### 📖 Conceptual Foundations\n"
    ]

    for sec in sections:
        stype = sec.get("type", "text")
        stitle = sec.get("title", "")
        scontent = sec.get("content") or sec.get("text") or sec.get("body") or ""

        if stype == "hero":
            continue
        elif stype == "table":
            headers = sec.get("headers", [])
            rows = sec.get("rows", [])
            if headers and rows:
                if stitle:
                    header_md.append(f"\n#### {stitle}\n\n")
                header_md.append("| " + " | ".join(headers) + " |\n")
                header_md.append("| " + " | ".join(["---"] * len(headers)) + " |\n")
                for r in rows:
                    header_md.append("| " + " | ".join(str(c) for c in r) + " |\n")
                header_md.append("\n")
        else:
            if stitle:
                header_md.append(f"\n#### {stitle}\n\n")
            if scontent:
                header_md.append(scontent + "\n\n")

    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line if line.endswith("\n") else line + "\n" for line in header_md]
    })

    # 2. Main Code Example Cell
    code_source = ["# %matplotlib inline\n"]
    if code_starter:
        code_lines = code_starter.strip().split("\n")
        code_source.extend([l + "\n" for l in code_lines])
    else:
        code_source.append("# Python code playground\nimport numpy as np\nimport matplotlib.pyplot as plt\nprint('Playground ready!')\n")

    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": code_source
    })

    # 3. Practice & Exploration Challenges
    practice_md = [
        "---\n\n",
        "### 🎯 Hands-On Experiments & Challenges\n",
        "1. **Experiment with parameters:** Modify the hyperparameters or dataset sizes in the cell above.\n",
        "2. **Add visual diagnostics:** Plot loss curves or feature distributions using Matplotlib/Seaborn.\n",
        "3. **Test with new data:** Try running the model on synthetic noisy data or custom inputs.\n"
    ]
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": practice_md
    })

    # 4. Scratchpad Code Cell
    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "# Your custom experiment code here:\n",
            "\n"
        ]
    })

    return {
        "cells": cells,
        "metadata": {
            "language_info": {
                "name": "python",
                "version": "3.11"
            },
            "kernelspec": {
                "name": "python3",
                "display_name": "Python 3",
                "language": "python"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }


def build_all_notebooks():
    """Scan all topic files and generate organized .ipynb notebooks."""
    os.makedirs(NOTEBOOKS_DIR, exist_ok=True)

    topic_files = sorted(glob.glob(os.path.join(TOPICS_DIR, "*.json")))
    print(f"Generating Jupyter Notebooks for {len(topic_files)} topics...")

    generated = []

    for fpath in topic_files:
        with open(fpath, "r", encoding="utf-8") as f:
            topic = json.load(f)

        tid = topic.get("id")
        title = topic.get("title", tid)
        desc = topic.get("description", "")
        level = topic.get("level", "general")

        level_dir = os.path.join(NOTEBOOKS_DIR, level)
        os.makedirs(level_dir, exist_ok=True)

        content = topic.get("content", {})
        sections = content.get("sections", []) if isinstance(content, dict) else []

        # Find code starter
        code_obj = topic.get("code") or (content.get("code_example") if isinstance(content, dict) else None) or topic.get("code_example") or {}
        code_starter = code_obj.get("starter") or code_obj.get("code") or ""
        code_title = code_obj.get("description") or code_obj.get("title") or "Interactive Python Code"

        nb_dict = make_notebook(title, desc, level, sections, code_starter, code_title)

        out_name = f"{tid}.ipynb"
        out_path = os.path.join(level_dir, out_name)
        with open(out_path, "w", encoding="utf-8") as out_f:
            json.dump(nb_dict, out_f, indent=2)

        # Also place in root notebooks dir for quick flat access
        flat_path = os.path.join(NOTEBOOKS_DIR, out_name)
        with open(flat_path, "w", encoding="utf-8") as flat_f:
            json.dump(nb_dict, flat_f, indent=2)

        generated.append({
            "id": tid,
            "title": title,
            "level": level,
            "filename": out_name,
            "path": f"/api/notebook/{level}/{tid}"
        })

    # Create master zip bundle
    zip_path = os.path.join(NOTEBOOKS_DIR, "ml_odyssey_all_notebooks.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(NOTEBOOKS_DIR):
            for file in files:
                if file.endswith(".ipynb"):
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, NOTEBOOKS_DIR)
                    zipf.write(full_p, rel_p)

    print(f"Successfully generated {len(generated)} notebooks and master ZIP at {zip_path}")

    # Write catalog
    catalog_path = os.path.join(NOTEBOOKS_DIR, "index.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump({"notebooks": generated}, f, indent=2)


if __name__ == "__main__":
    build_all_notebooks()

