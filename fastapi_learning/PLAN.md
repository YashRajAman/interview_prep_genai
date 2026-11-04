# FastAPI Learning Platform — Master Plan

> **Goal:** A comprehensive, interactive FastAPI learning platform modeled after the ML Odyssey architecture. Learners progress from beginner to professional through reading, interactive API exploration, live code execution, and quizzes.

---

## 1. Architecture Overview

### 1.1 Existing Pattern (ML Odyssey Reference)

The ML Odyssey platform (`ml_learning/`) follows this architecture:

```
ml_learning/
├── app.py                 # FastAPI app: mounts static, serves index.html, includes /api router
├── api/
│   ├── __init__.py
│   ├── routes.py           # REST endpoints: /topics, /topic/{id}, /run-code, /check-quiz
│   ├── code_runner.py      # Sandboxed subprocess Python executor with matplotlib capture
│   └── playground_session.py  # Persistent kernel sessions for interactive playground
├── content/
│   ├── topics.json         # Master registry of all levels & topics (metadata only)
│   └── topics/             # Individual topic JSON files (full content: read, interact, code, quiz)
├── static/
│   ├── css/style.css       # Theme system with 6 visual themes
│   ├── js/
│   │   ├── app.js          # Main SPA controller, routing, content rendering
│   │   ├── quiz-engine.js  # Quiz rendering, submission, grading
│   │   ├── code-playground.js  # CodeMirror editor + execution UI
│   │   ├── playground.js   # Interactive playground sessions
│   │   ├── visualizations.js   # Canvas-based interactive simulations
│   │   └── progress.js     # LocalStorage progress tracking
│   └── vendor/katex/       # Local KaTeX for math rendering
└── templates/
    └── index.html          # SPA shell with nav, content drawer, script loading
```

### 1.2 FastAPI Learning Platform Design

```
fastapi_learning/
├── app.py                  # FastAPI app: same pattern as ml_learning
├── api/
│   ├── __init__.py
│   ├── routes.py           # REST endpoints: /topics, /topic/{id}, /run-code, /check-quiz, /api-explorer
│   ├── code_runner.py      # Sandboxed executor with TestClient support for FastAPI apps
│   └── playground_session.py  # (Phase 2) Persistent sessions
├── content/
│   ├── topics.json         # Master registry
│   └── topics/             # Individual topic JSON files
├── static/
│   ├── css/style.css       # Adapted theme system (FastAPI palette)
│   └── js/
│       ├── app.js          # SPA controller
│       ├── quiz-engine.js  # Quiz engine (reused pattern)
│       ├── code-playground.js  # CodeMirror + TestClient execution
│       ├── api-explorer.js # Interactive HTTP request/response visualizer
│       └── progress.js     # LocalStorage progress tracking
├── templates/
│   └── index.html          # SPA shell
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── PLAN.md                 # This file
└── CHECKPOINT.md           # Cross-session progress tracking
```

### 1.3 Root Index Landing Page

A separate page at the repository root that links to all learning pathways:

```
interview_prep_genai/
├── index.html              # Landing page with pathway cards (ML Odyssey, FastAPI Backend, ...)
├── ml_learning/            # ML Odyssey pathway (existing)
└── fastapi_learning/        # FastAPI Backend pathway (this plan)
```

The landing page is a standalone static HTML file (no backend needed). It displays pathway cards with descriptions, topic counts, and links. Styled to match the ML Odyssey visual identity.

---

## 2. Curriculum Mapping

The `fastapi-complete-guide.md` has 26 sections. These map to a 5-level curriculum with 26 topics:

### Level 1: Foundations (5 Topics) — *Getting Started with FastAPI*

| #  | Topic ID              | Title                              | Guide Section | Interactive Feature                          |
|----|----------------------|------------------------------------|---------------|---------------------------------------------|
| 1.1| `why-fastapi`         | Why FastAPI                         | §1            | Framework comparison table (interactive)     |
| 1.2| `first-app`          | Installation & First App           | §2            | Live uvicorn startup simulation              |
| 1.3| `http-methods`       | Path Operations & HTTP Methods     | §3            | HTTP method explorer (click to see CRUD map) |
| 1.4| `path-params`        | Path Parameters                    | §4            | URL path matcher visualizer                  |
| 1.5| `query-params`       | Query Parameters                   | §5            | Query string builder with validation preview  |

### Level 2: Data Handling & Validation (6 Topics) — *Request/Response Mastery*

| #  | Topic ID              | Title                              | Guide Section | Interactive Feature                          |
|----|----------------------|------------------------------------|---------------|---------------------------------------------|
| 2.1| `request-body`       | Request Body & Pydantic Models      | §6            | JSON body builder → Pydantic model preview    |
| 2.2| `pydantic-validation`| Deep Validation with Pydantic v2    | §7            | Live validation playground (type, error)      |
| 2.3| `response-models`   | Response Models & Status Codes      | §8            | Status code reference + response filter demo |
| 2.4| `error-handling`    | Errors & Exception Handlers         | §9            | Error flow diagram + exception chain builder  |
| 2.5| `cookies-headers`    | Cookies, Headers & Form Data        | §10           | Header/cookie inspector panel                 |
| 2.6| `file-uploads`      | File Uploads                        | §11           | Upload simulation (size/type validation flow)  |

### Level 3: Async & Architecture (5 Topics) — *Core Framework Concepts*

| #  | Topic ID              | Title                              | Guide Section | Interactive Feature                          |
|----|----------------------|------------------------------------|---------------|---------------------------------------------|
| 3.1| `async-vs-sync`     | Async vs Sync — How FastAPI Runs Code| §12          | Event loop visualizer (concurrent vs blocking)|
| 3.2| `middleware-cors`   | Middleware, CORS & Gzip             | §13           | Middleware chain order visualizer             |
| 3.3| `dependency-injection`| Dependency Injection System       | §14           | Dependency graph builder (sub-deps visualized) |
| 3.4| `background-tasks`  | Background Tasks                    | §15           | Task queue animation (response → background)  |
| 3.5| `lifespan`          | Application Lifespan (Startup/Shutdown)| §16        | Lifecycle timeline (startup → serve → shutdown)|

### Level 4: Security & Database (3 Topics) — *Production Building Blocks*

| #  | Topic ID              | Title                              | Guide Section | Interactive Feature                          |
|----|----------------------|------------------------------------|---------------|---------------------------------------------|
| 4.1| `jwt-auth`           | Security: OAuth2 + JWT Authentication| §17          | JWT token inspector (decode payload)          |
| 4.2| `sqlalchemy-database`| Databases: SQLAlchemy 2.0 + Alembic | §18           | CRUD operation flow on schema diagram         |
| 4.3| `db-relationships`  | Database Relationships              | §19           | Relationship diagram (1:1, 1:N, N:M builder) |

### Level 5: Testing & Production (7 Topics) — *Shipping to Production*

| #  | Topic ID              | Title                              | Guide Section | Interactive Feature                          |
|----|----------------------|------------------------------------|---------------|---------------------------------------------|
| 5.1| `testing`           | Testing (pytest + httpx)           | §20           | Test runner simulation (green/red results)    |
| 5.2| `routers-structure` | Routers & Modular Project Structure| §21           | Project structure drag-and-drop organizer     |
| 5.3| `websockets`        | WebSockets                          | §22           | WebSocket connection simulator (echo/broadcast)|
| 5.4| `configuration`     | Configuration & Settings           | §23           | .env file editor → Settings object preview    |
| 5.5| `docker-deployment` | Docker & Docker Compose Deployment | §24           | Container architecture diagram                |
| 5.6| `production-patterns`| Production Patterns                | §25           | Production checklist (interactive toggle)     |
| 5.7| `professional-checklist`| Professional Checklist & Resources| §26          | Final checklist with scoring                   |

**Total: 26 topics across 5 levels**

---

## 3. Interactive Features

Each topic includes up to 4 interactive layers (same pattern as ML Odyssey):

### 3.1 Read & Learn
- In-depth conceptual theory adapted from the guide
- Code blocks with syntax highlighting
- Real-world analogies and callout boxes
- KaTeX for any mathematical notation

### 3.2 Play & Interact
- Canvas-based or DOM-based interactive visualizations
- Topic-specific interactive component (see curriculum table above)
- Parameter sliders, dropdowns, and immediate visual feedback

### 3.3 Code Playground
- CodeMirror editor with Python syntax highlighting
- Backend execution via sandboxed subprocess
- **Key difference from ML Odyssey:** Instead of matplotlib plot capture, the runner uses `TestClient` to execute FastAPI apps and captures HTTP responses (status code, headers, JSON body)

### 3.4 Quiz & Assessment
- 5 multiple-choice questions per topic
- Instant feedback with pedagogical explanations
- Progress tracking via localStorage

### 3.5 API Explorer (FastAPI-specific feature)
- A dedicated interactive component where learners construct HTTP requests (method, path, headers, body) and see the response
- For topics that define a FastAPI app in the playground, the API explorer sends real requests via the backend TestClient
- Visualizes: request headers, response status, response headers, response body (formatted JSON)

---

## 4. Code Runner Design (FastAPI TestClient)

### 4.1 Problem

ML Odyssey's code runner executes Python code and captures matplotlib plots. FastAPI learning needs a different execution model: learners write FastAPI app code, and the runner uses `TestClient` to make HTTP requests against the app.

### 4.2 Solution

Extend the sandboxed subprocess executor to:

1. **Allow FastAPI-related imports:** `fastapi`, `pydantic`, `starlette`, `httpx`, `uvicorn`, `sqlalchemy`, `databases`, `orjson`, `python-multipart`
2. **Inject TestClient boilerplate:** After the user's code (which defines an `app`), automatically import and instantiate `TestClient`
3. **Capture HTTP responses:** If the user's code includes special directives (comments like `# GET /items`), the runner executes those requests via TestClient and captures the response
4. **Return structured results:** Instead of plots, return an array of HTTP responses with status code, headers, and body

### 4.3 Code Playground Execution Format

The learner writes FastAPI code in the editor:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
```

The runner wraps this and executes test requests:

```python
# --- User code above ---
from fastapi.testclient import TestClient

client = TestClient(app)

# Auto-generated test requests (from topic challenge spec)
requests = [
    {"method": "GET", "path": "/"},
    {"method": "GET", "path": "/items/42?q=hello"},
]

results = []
for req in requests:
    response = getattr(client, req["method"].lower())(req["path"])
    results.append({
        "status_code": response.status_code,
        "headers": dict(response.headers),
        "body": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
    })

print(json.dumps(results, indent=2, default=str))
```

### 4.4 Safety Considerations

- Same subprocess sandbox with timeout
- Allow-list for imports (extended for FastAPI ecosystem)
- No network access (TestClient runs in-process, no real HTTP server)
- No filesystem writes beyond temp dir
- Forbidden patterns still apply (os.system, subprocess, etc.)

### 4.5 Fallback: Simple Code Execution

For topics that don't define a FastAPI app (e.g., Pydantic validation demos, configuration examples), the runner falls back to simple stdout/stderr capture (same as ML Odyssey).

---

## 5. Topic JSON Schema

Each topic follows a JSON schema adapted from ML Odyssey:

```json
{
  "id": "why-fastapi",
  "title": "Why FastAPI",
  "level": "foundations",
  "level_id": 1,
  "order": 1,
  "icon": "rocket",
  "summary": "Understand what makes FastAPI different...",
  "estimated_minutes": 15,
  "read": {
    "sections": [
      {
        "type": "heading",
        "content": "Why FastAPI"
      },
      {
        "type": "paragraph",
        "content": "FastAPI is a modern web framework..."
      },
      {
        "type": "code",
        "language": "python",
        "content": "from fastapi import FastAPI\napp = FastAPI()"
      },
      {
        "type": "callout",
        "variant": "info",
        "content": "FastAPI is based on Starlette (ASGI) and Pydantic (validation)."
      },
      {
        "type": "table",
        "headers": ["Feature", "Benefit"],
        "rows": [
          ["Type hints", "Editor autocompletion, fewer bugs"],
          ["Auto docs", "Swagger UI and ReDoc out of the box"]
        ]
      }
    ]
  },
  "interact": {
    "type": "framework-comparison",
    "config": { ... }
  },
  "code_challenge": {
    "title": "Create your first FastAPI app",
    "description": "Write a FastAPI app with a GET / endpoint that returns {'message': 'Hello FastAPI'}",
    "starter_code": "from fastapi import FastAPI\n\napp = FastAPI()\n\n# Write your route here\n",
    "test_requests": [
      {"method": "GET", "path": "/"}
    ],
    "expected_results": [
      {"status_code": 200, "body_contains": {"message": "Hello FastAPI"}}
    ],
    "hints": [
      "Use @app.get('/') decorator",
      "Return a dict with 'message' key"
    ]
  },
  "quiz": [
    {
      "question": "What are FastAPI's two foundational libraries?",
      "options": ["Django and Flask", "Starlette and Pydantic", "NumPy and Pandas", "Flask and Requests"],
      "correct": 1,
      "explanation": "FastAPI is built on Starlette (ASGI framework) and Pydantic (data validation)."
    }
  ]
}
```

---

## 6. Implementation Phases & Checkpoints

### Phase 1: Foundation & Structure (Tasks #1, #2, #3, #7)

- [x] Create PLAN.md (this document)
- [ ] Create root index landing page (`/index.html`)
- [ ] Scaffold `fastapi_learning/` directory structure
- [ ] Create `app.py` (FastAPI app shell, mount static, serve template)
- [ ] Create `api/__init__.py`, `api/routes.py` (stub endpoints)
- [ ] Create `requirements.txt`
- [ ] Create `templates/index.html` (SPA shell)
- [ ] Create placeholder `static/css/style.css`
- [ ] Create placeholder `static/js/app.js`
- [ ] Create `CHECKPOINT.md` with initial state

**Checkpoint 1:** App runs, serves a blank page, API stubs respond.

### Phase 2: Content & Code Runner (Tasks #4, #5)

- [ ] Build `api/code_runner.py` with TestClient support
- [ ] Create `content/topics.json` master registry
- [ ] Create all 26 topic JSON files in `content/topics/`
- [ ] Implement `/api/topics`, `/api/topic/{id}`, `/api/run-code`, `/api/check-quiz` routes

**Checkpoint 2:** All topics load via API, code runner executes FastAPI TestClient code.

### Phase 3: Frontend (Task #6)

- [ ] Build full `index.html` SPA shell (nav, content drawer, loading)
- [ ] Build `static/css/style.css` (theme system adapted from ML Odyssey)
- [ ] Build `static/js/app.js` (routing, content rendering, topic navigation)
- [ ] Build `static/js/quiz-engine.js` (quiz rendering, grading)
- [ ] Build `static/js/code-playground.js` (CodeMirror + TestClient execution UI)
- [ ] Build `static/js/api-explorer.js` (HTTP request/response visualizer)
- [ ] Build `static/js/progress.js` (localStorage tracking)

**Checkpoint 3:** Full SPA works, all 4 interactive layers functional for every topic.

### Phase 4: Polish & Docker (Future)

- [ ] Dockerfile and docker-compose.yml
- [ ] Theme polish, responsive design
- [ ] Additional interactive visualizations per topic
- [ ] Content review and expansion

---

## 7. Design Decisions

### 7.1 Why reuse the ML Odyssey architecture?
- Proven, working pattern with 33 topics
- Same SPA + FastAPI backend approach works perfectly for FastAPI learning
- CodeMirror, KaTeX, theme system, progress tracking are all reusable
- The quiz engine is directly portable

### 7.2 Why TestClient instead of a real uvicorn server?
- TestClient runs the app in-process (no port conflicts, no network needed)
- Faster, simpler, and deterministic
- Captures the full HTTP response (status, headers, body)
- Still tests the real FastAPI stack (routing, validation, middleware)
- Safer for sandboxed execution (no exposed ports)

### 7.3 How much coding can we support?
- **Full FastAPI app code execution** via TestClient — learners can write complete FastAPI apps with routes, dependencies, middleware, and test them
- **Pydantic model validation** — standalone Pydantic model code runs directly
- **Database topics** — SQLite in-memory via TestClient dependency overrides
- **Auth topics** — JWT token creation/verification runs in-process
- **Testing topics** — pytest assertions run via the sandbox
- **WebSocket topics** — TestClient supports WebSocket testing
- **Limitation:** No real network calls (httpx to external services), no real database connections (use SQLite in-memory), no actual uvicorn server startup

### 7.4 Code execution safety
- Subprocess with timeout (default 15 seconds for FastAPI tests)
- Import allow-list extended: `fastapi`, `starlette`, `pydantic`, `pydantic_settings`, `sqlalchemy`, `httpx`, `uvicorn`, `jose`, `passlib`
- Forbidden patterns: os.system, subprocess, socket, open(), eval, exec, __import__
- No network access (TestClient uses in-process ASGI transport)

---

## 8. File-by-File Implementation Notes

### `app.py`
- Identical pattern to `ml_learning/app.py`
- Mount `/static`, serve `index.html` at `/`, include `/api` router
- Title: "FastAPI Learning Platform"

### `api/routes.py`
- `GET /api/topics` — return topics.json registry
- `GET /api/topic/{level_id}/{topic_id}` — return individual topic JSON
- `POST /api/run-code` — execute code with TestClient support
- `POST /api/check-quiz` — grade quiz answers
- (Future) `POST /api/api-explorer` — execute custom HTTP request against user-defined app

### `api/code_runner.py`
- Same sandboxed subprocess pattern as ML Odyssey
- Extended ALLOWED_IMPORTS for FastAPI ecosystem
- Detect if user code defines an `app` variable (FastAPI instance)
- If `app` exists and topic has `test_requests`, inject TestClient code
- Capture HTTP responses as structured JSON
- Fallback to simple stdout capture for non-FastAPI code

### `content/topics.json`
- Master registry with level metadata and topic summaries
- Same structure as ML Odyssey: `{levels: [{id, title, topics: [{id, title, summary, icon}]}]}`

### `content/topics/*.json`
- One file per topic (26 files total)
- Full content: read sections, interact config, code challenge, quiz

### `static/css/style.css`
- Adapted from ML Odyssey theme system
- FastAPI color palette (teal/green accents matching FastAPI branding)
- Same dark-first theme approach with theme selector

### `static/js/app.js`
- SPA controller: handles routing between home/levels/topic/playground/progress
- Renders topic content (read sections, interact component, code playground, quiz)
- Manages content drawer (curriculum tree)
- Same module pattern as ML Odyssey

---

## 9. Dependencies

```
fastapi
uvicorn[standard]
pydantic
pydantic-settings
sqlalchemy
python-multipart
python-jose[cryptography]
passlib[bcrypt]
httpx
pytest
jinja2
```

Note: These are the same dependencies the learner's FastAPI code will use. The platform itself only needs `fastapi`, `uvicorn`, `jinja2` to serve the SPA.

---

*This plan is a living document. Update CHECKPOINT.md at each phase completion.*
