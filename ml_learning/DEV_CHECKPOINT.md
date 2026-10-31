# ML Odyssey — Development Checkpoint

> **Last updated:** 2026-10-30 18:25 IST
> **Status:** ✅ All 7/7 tasks complete. End-to-end testing passed.
> **Next step:** None — project is ready for use.

---

## Project Overview

**ML Odyssey** is an interactive machine learning learning platform built as a FastAPI SPA.
Users read content, interact with visualizations, write code in a playground, and take quizzes.
Progress is tracked in localStorage.

**Tech stack:** FastAPI + Jinja2 (backend), vanilla HTML/CSS/JS (frontend), CodeMirror (code editor),
Canvas 2D API (visualizations). No frontend framework — pure vanilla JS modules.

## Architecture

```
ml_learning/
├── app.py                      # FastAPI app — serves index.html + mounts /static
├── requirements.txt            # fastapi, uvicorn, jinja2, restrictedpython, etc.
├── DEV_CHECKPOINT.md           # THIS FILE — read this first when resuming
├── content/
│   └── topics.json             # 213KB — 5 levels, 33 topics, full content + quizzes
├── api/
│   ├── __init__.py
│   ├── routes.py              # GET /api/topics, GET /api/topic/{level}/{topic}, POST /api/run-code, POST /api/check-quiz
│   └── code_runner.py         # Sandboxed Python execution with matplotlib plot capture
├── templates/
│   └── index.html             # SPA shell — loads all CSS/JS, has nav + #app-content
└── static/
    ├── css/
    │   └── style.css           # ✅ DONE — 2559 lines, dark theme, all UI components styled
    └── js/
        ├── progress.js         # ✅ DONE — 427 lines, localStorage progress tracking (window.ProgressTracker)
        ├── quiz-engine.js      # ✅ DONE — 542 lines, quiz rendering + answer checking (window.QuizEngine)
        ├── code-playground.js  # ✅ DONE — 360 lines, CodeMirror + API execution (window.CodePlayground)
        ├── visualizations.js   # ✅ DONE — 1880 lines, canvas visualizations + interactive exercises (window.Visualizations)
        └── app.js              # ❌ TODO — main SPA router/controller (window.App)
```

## Task Progress

| # | Task | Status | File | Lines |
|---|------|--------|------|-------|
| 1 | style.css — dark theme | ✅ Done | static/css/style.css | 2559 |
| 2 | progress.js — localStorage tracking | ✅ Done | static/js/progress.js | 427 |
| 3 | quiz-engine.js — quiz rendering | ✅ Done | static/js/quiz-engine.js | 542 |
| 4 | code-playground.js — CodeMirror + execution | ✅ Done | static/js/code-playground.js | 360 |
| 5 | visualizations.js — canvas visualizations | ✅ Done | static/js/visualizations.js | 1880 |
| 6 | app.js — SPA router/controller | ✅ Done | static/js/app.js | 1410 |
| 7 | End-to-end testing | ✅ Done | — | — |

## What Remains

### Task 6: Create `static/js/app.js`

This is the main SPA controller that ties everything together. It needs to:

1. **Fetch topics** from `/api/topics` on load
2. **Implement routing** — hash-based or state-based routes:
   - `home` — landing page with hero, stats, feature grid, level overview
   - `levels` — grid of all levels with topic counts and progress
   - `level/{id}` — level detail page showing all topics in that level
   - `topic/{levelId}/{topicId}` — topic detail view with tabs (Content, Interactive, Code, Quiz)
   - `progress` — progress dashboard with overall + per-level breakdown
3. **Render content sections** — parse `topic.content.sections` array and render each type:
   - `hero` → large title block
   - `text` → markdown-like paragraphs (supports `**bold**` via `<strong>`, lists, etc.)
   - `callout` → boxed callout with style-specific colors (definition, key-takeaway, warning, example, comparison)
   - `visualization` → call `Visualizations.render(id, container)`
4. **Render interactive exercises** — if topic has `interactive`, render a tab/section calling `Visualizations.renderInteractive(interactive, container, onComplete)`
5. **Render code playground** — if topic has `code`, render a tab/section calling `CodePlayground.init(codeData, container, onComplete)`
6. **Render quiz** — if topic has `quiz`, render a tab/section calling `QuizEngine.renderQuiz(topic, container, onComplete)`
7. **Navigation** — handle nav link clicks (Home, Levels, Progress), update active state
8. **Progress tracking** — call `ProgressTracker.markTopicStarted()` when visiting a topic, `markTopicCompleted()` when all sections done, update nav progress bar
9. **Toast notifications** — helper function to show toasts (success, error, info)
10. **Loading states** — show/hide the loading screen, handle API errors

### Key Integration Points

The existing modules expose these APIs that app.js must call:

```javascript
// Progress tracking
ProgressTracker.getData()
ProgressTracker.markTopicStarted(levelId, topicId)
ProgressTracker.markTopicCompleted(levelId, topicId)
ProgressTracker.isTopicCompleted(levelId, topicId)
ProgressTracker.saveQuizResult(levelId, topicId, score, total, percentage)
ProgressTracker.markCodeCompleted(levelId, topicId)
ProgressTracker.markInteractiveCompleted(levelId, topicId)
ProgressTracker.getLevelProgress(levelId, totalTopicsInLevel)
ProgressTracker.getOverallProgress(totalTopics)
ProgressTracker.getDetailedProgress(allLevels)
ProgressTracker.resetProgress()
ProgressTracker.updateNavProgress(totalTopics)
ProgressTracker.getCompletedTopicIds()

// Quiz
QuizEngine.renderQuiz(topic, container, onComplete)  // onComplete(percentage)

// Code playground
CodePlayground.init(codeData, container, onComplete)  // codeData = { starter, description }, onComplete()

// Visualizations
Visualizations.render(vizId, container)
Visualizations.renderInteractive(interactiveData, container, onComplete)  // onComplete()
```

### Content Structure Reference

Section types in `topic.content.sections`: `hero`, `text`, `callout` (styles: definition, key-takeaway, warning, example, comparison), `visualization`

Visualization IDs: `traditional-vs-ml`, `linear-regression-fit`, `gradient-descent-3d`, `decision-boundary`

Interactive types: `sorting-exercise`, `classification-game`, `statistics-calculator`, `coin-flip-simulator`

### Task 7: End-to-End Testing

```bash
cd /home/aman/learning/gitrepos/interview_prep_genai/ml_learning
pip install -r requirements.txt
python app.py
# Open http://localhost:8000
```

Verify:
- Home page loads with hero + level cards
- Clicking a level shows its topics
- Clicking a topic shows content sections
- Visualization canvas renders
- Interactive exercises work (drag-drop, buttons)
- Code playground runs Python and shows output
- Quiz renders, accepts answers, shows results
- Progress bar in nav updates
- Progress page shows detailed breakdown

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/topics` | Get all levels + topics (full registry) |
| GET | `/api/topic/{level_id}/{topic_id}` | Get single topic full content |
| POST | `/api/run-code` | Execute Python code (body: `{code, timeout}`) → `{success, stdout, stderr, plots[]}` |
| POST | `/api/check-quiz` | Check quiz answers (body: `{topic_id, answers}`) → `{results, score, total, percentage}` |

## Content Overview (topics.json)

5 levels, 33 topics:
- **Novice** (5): What is ML, Types of ML, Understanding Data, Math Foundations, Probability
- **Beginner** (7): Linear Regression, Gradient Descent, Logistic Regression, KNN, Decision Trees, Model Eval, Train/Test Split
- **Intermediate** (7): Feature Engineering, SVM, Ensemble Methods, Boosting, K-Means, PCA, ML Pipeline
- **Advanced** (7): Neural Networks, Backpropagation, CNN, RNN/LSTM, Transfer Learning, Regularization, Hyperparameter Tuning
- **Professional** (7): Transformers, NLP Pipeline, GANs, Model Deployment, MLOps, Ethics/Bias, Reinforcement Learning

## Key Design Decisions

- **No frontend framework** — vanilla JS with module pattern (global objects on window)
- **localStorage** for progress (no user accounts)
- **Sandboxed subprocess** for code execution (not in-process) with timeout + forbidden patterns
- **Canvas 2D API** for all visualizations (no D3/Chart.js dependency)
- **CodeMirror 5** loaded via CDN for code editor
- **Dark theme** with level-specific accent colors (novice #00d4aa, beginner #4dabf7, intermediate #ffd43b, advanced #ff8c42, professional #ff5757)

## How to Resume

1. Read this file (`DEV_CHECKPOINT.md`)
2. Create `static/js/app.js` using the integration points above
3. Install deps: `pip install -r requirements.txt`
4. Run: `python app.py` or `uvicorn app:app --reload`
5. Open http://localhost:8000 and verify all features work
