# The Complete FastAPI Backend Guide — Beginner to Professional

> **One file. Everything.** Covers: setup → routing → validation → auth → databases → testing → deployment → production-grade patterns.
> Last updated: 2026-11-04. Target versions: **FastAPI 0.115+**, **Pydantic v2**, **SQLAlchemy 2.x**, **Python 3.11+**.

---

## Table of Contents

1. [Why FastAPI](#1-why-fastapi)
2. [Installation & First App](#2-installation--first-app)
3. [Path Operations & HTTP Methods](#3-path-operations--http-methods)
4. [Path Parameters](#4-path-parameters)
5. [Query Parameters](#5-query-parameters)
6. [Request Body & Pydantic Models](#6-request-body--pydantic-models)
7. [Deep Validation with Pydantic v2](#7-deep-validation-with-pydantic-v2)
8. [Response Models & Status Codes](#8-response-models--status-codes)
9. [Errors & Exception Handlers](#9-errors--exception-handlers)
10. [Cookies, Headers & Form Data](#10-cookies-headers--form-data)
11. [File Uploads](#11-file-uploads)
12. [Async vs Sync — How FastAPI Runs Your Code](#12-async-vs-sync--how-fastapi-runs-your-code)
13. [Middleware, CORS & Gzip](#13-middleware-cors--gzip)
14. [Dependency Injection System](#14-dependency-injection-system)
15. [Background Tasks](#15-background-tasks)
16. [Application Lifespan (Startup/Shutdown)](#16-application-lifespan-startupshutdown)
17. [Security: OAuth2 + JWT Authentication](#17-security-oauth2--jwt-authentication)
18. [Databases: SQLAlchemy 2.0 (Async) + Alembic](#18-databases-sqlalchemy-20-async--alembic)
19. [Database Relationships](#19-database-relationships)
20. [Testing (pytest + httpx)](#20-testing-pytest--httpx)
21. [Routers & Modular Project Structure](#21-routers--modular-project-structure)
22. [WebSockets](#22-websockets)
23. [Configuration & Settings (pydantic-settings)](#23-configuration--settings-pydantic-settings)
24. [Docker & Docker Compose Deployment](#24-docker--docker-compose-deployment)
25. [Production Patterns](#25-production-patterns)
26. [Professional Checklist & Resources](#26-professional-checklist--resources)

---

## 1. Why FastAPI

FastAPI is a modern, high-performance web framework for building APIs with Python, based on **Starlette** (ASGI) and **Pydantic** (data validation).

| Feature | Benefit |
|---|---|
| Type hints everywhere | Editor autocompletion, fewer bugs |
| Automatic request validation | Invalid data never reaches your logic |
| Auto-generated docs | Swagger UI and ReDoc out of the box |
| Async-native (ASGI) | Very high concurrency on IO-bound work |
| Dependency injection | Clean, testable, reusable components |

Performance: on par with Node.js/Go frameworks for typical API workloads. Speed is mostly determined by your database calls anyway — FastAPI just doesn't get in the way.

**When to pick something else:** you need server-rendered HTML as the main deliverable (Django), or a tiny micro-service (Flask is fine too). For pure APIs, FastAPI is the default choice in modern Python.

---

## 2. Installation & First App

### 2.1 Install

```bash
# Core
pip install fastapi uvicorn[standard]

# Or with everything you'll eventually want
pip install fastapi uvicorn[standard] pydantic pydantic-settings \
    sqlalchemy alembic asyncpg psycopg[binary] \
    python-multipart python-jose[cryptography] passlib[bcrypt] \
    httpx pytest pytest-asyncio redis
```

> `python-multipart` is required for forms and file uploads. `python-jose` + `passlib` for JWT + password hashing. `asyncpg` = async PostgreSQL driver; `psycopg` (v3) = sync driver.

### 2.2 Minimal app — `main.py`

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}
```

### 2.3 Run it

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- `main` = the file `main.py` (module name).
- `app` = the FastAPI instance inside it.
- `--reload` = auto-restart on code change (dev only!).
- Production: `uvicorn main:app --workers 4` (no `--reload`).

### 2.4 Interactive docs (free, always)

| URL | What |
|---|---|
| `http://localhost:8000/docs` | Swagger UI (interactive "try it" buttons) |
| `http://localhost:8000/redoc` | ReDoc (cleaner reference docs) |
| `http://localhost:8000/openapi.json` | The raw OpenAPI schema |

You can customize them:

```python
app = FastAPI(
    title="Task Manager API",
    description="A production-grade task management API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
```

You can even add per-route descriptions that show up in the docs:

```python
@app.get("/items/{item_id}", summary="Read one item", description="Returns a single item by its ID.", tags=["items"])
def read_item(item_id: int):
    return {"item_id": item_id}
```

---

## 3. Path Operations & HTTP Methods

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/items")            # read
def list_items(): ...

@app.post("/items")           # create
def create_item(): ...

@app.put("/items/{item_id}")  # full replace
def replace_item(item_id: int): ...

@app.patch("/items/{item_id}")  # partial update
def update_item(item_id: int): ...

@app.delete("/items/{item_id}")  # delete
def delete_item(item_id: int): ...

@app.options("/items")        # preflight
@app.head("/items")           # headers only
def items_meta(): ...
```

Rules of thumb: **POST = create, GET = read, PUT/PATCH = update, DELETE = delete.** Use plural nouns (`/items`, not `/getItems`). Status codes: `200` OK, `201` Created, `204` No Content, `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `422` validation error (FastAPI's default), `500` server error.

---

## 4. Path Parameters

```python
@app.get("/users/{user_id}")
def read_user(user_id: int):
    return {"user_id": user_id}
```

- `{}` in the path declares a parameter.
- The **type annotation** (`int`) drives validation. `"abc"` → automatic `422 Unprocessable Entity` with a detailed error body.

### 4.1 Ordering matters (static first)

```python
@app.get("/users/me")          # declared BEFORE /users/{user_id}
def read_me():
    return {"user_id": "current"}

@app.get("/users/{user_id}")
def read_user(user_id: str):
    return {"user_id": user_id}
```

`/users/me` must be declared before `/users/{user_id}`, or FastAPI matches `me` as the parameter.

### 4.2 Enum path params

```python
from enum import Enum

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"

@app.get("/models/{model_name}")
def get_model(model_name: ModelName):
    if model_name is ModelName.alexnet:
        return {"model": model_name, "message": "deep learning FTW"}
    return {"model": model_name}
```

Values outside the enum → `422`. In the docs UI it renders as a dropdown.

### 4.3 Path converter (regex)

```python
from fastapi import Path

@app.get("/files/{file_path:path}")
def read_file(file_path: str):
    return {"file_path": file_path}   # /files/home/user/a.txt → file_path="home/user/a.txt"
```

The `:path` converter allows slashes. Note it can open you up to **path traversal** (`../`) — sanitize or reject `..` segments if the value touches your filesystem.

---

## 5. Query Parameters

```python
@app.get("/items/")
def read_items(skip: int = 0, limit: int = 10, q: str | None = None):
    return {"skip": skip, "limit": limit, "q": q}
```

Call: `GET /items/?skip=20&limit=5&q=phone`

- Parameters **not** in the path are query params.
- Defaults make them optional; `q: str | None = None` is optional-and-nullable.
- Required query param: `q: str` (no default).

### 5.1 Query validation

```python
from fastapi import Query

@app.get("/items/")
def read_items(
    q: str | None = Query(default=None, min_length=3, max_length=50, pattern="^fixedquery$"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
):
    ...
```

- `Query(...)` adds constraints: `min_length`, `max_length`, `pattern` (regex), `ge` (>=), `gt` (>), `le`, `lt`.
- Violations → `422` with per-field messages.
- `Query(...)` with `...` (Ellipsis) = **required**: `q: str = Query(...)`.

### 5.2 Alias & docs metadata

```python
@app.get("/items/")
def read_items(
    q: str | None = Query(
        default=None,
        alias="item-query",          # client must send ?item-query=...
        title="Search string",
        description="Search items by keyword",
        deprecated=False,
        include_in_schema=True,
    ),
):
    ...
```

If you need both alias and Python name, keep the param name and use `alias=`.

### 5.3 List query params

```python
from typing import Annotated
from fastapi import Query

@app.get("/items/")
def read_items(tags: Annotated[list[str] | None, Query()] = None):
    return {"tags": tags}
```

`GET /items/?tags=red&tags=blue` → `{"tags": ["red", "blue"]}`.

### 5.4 `Annotated` style (the modern, recommended way)

Instead of `tags: list[str] = Query(...)`, prefer:

```python
from typing import Annotated
from fastapi import Query

@app.get("/items/")
def read_items(
    q: Annotated[str | None, Query(min_length=3, max_length=50)] = None,
):
    ...
```

This is FastAPI's current recommended style: metadata lives in the annotation, the default stays at `= None`.

---

## 6. Request Body & Pydantic Models

A **request body** is data sent by the client (e.g., JSON from POST/PUT). Declare it with a Pydantic model.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@app.post("/items/")
def create_item(item: Item):
    item_dict = item.model_dump()
    if item.tax is not None:
        item_dict.update({"price_with_tax": item.price + item.tax})
    return item_dict
```

- Pydantic v2 methods: `model_dump()` (dict), `model_dump_json()`, `model_validate(data)`, `model_validate_json(json_str)`.
- **Extra fields are ignored by default** (Pydantic v2 default). To forbid them, see §7.4.

### 6.1 Body + path + query together

```python
@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item, q: str | None = None):
    return {"item_id": item_id, **item.model_dump(), "q": q}
```

FastAPI figures out what goes where: path `{}` → path param; Pydantic type → body; everything else → query.

### 6.2 Multiple body params (embed)

```python
class User(BaseModel):
    username: str
    full_name: str | None = None

@app.put("/users/{user_id}")
def update_user(user_id: int, user: User, importance: int):
    ...
```

Here `user` and `importance` are both body params → they become one JSON object `{"user": {...}, "importance": 5}`. If you want the client to send `User` directly as the root body, use `Body(embed=True)` on the other param (or just declare one body model — recommended).

### 6.3 Nested models

```python
from pydantic import BaseModel

class Image(BaseModel):
    url: str
    name: str

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None
    tags: list[str] = []
    image: Image | None = None   # nested model
```

Body:

```json
{
  "name": "Foo",
  "price": 50.2,
  "tags": ["a", "b"],
  "image": {"url": "http://example.com/1.png", "name": "main"}
}
```

---

## 7. Deep Validation with Pydantic v2

### 7.1 Field constraints

```python
from pydantic import BaseModel, Field, HttpUrl, EmailStr

class Item(BaseModel):
    name: str
    description: str | None = Field(
        default=None, title="The description", max_length=300
    )
    price: float = Field(gt=0, description="Price must be > 0")
    tax: float | None = None
    tags: list[str] = []
```

Common constraints: `gt, ge, lt, le`, `min_length, max_length`, `pattern` (regex), `max_digits, decimal_places`, `multiple_of`, `min_items/max_items` (deprecated → use `min_length/max_length` on collections in v2).

### 7.2 Special types

```python
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, HttpUrl, EmailStr, SecretStr

class User(BaseModel):
    id: UUID
    email: EmailStr                 # needs `pip install email-validator`
    signup_ts: datetime | None
    birth_date: date | None
    website: HttpUrl | None         # validated URL
    password: SecretStr             # never printed in repr/logs
```

### 7.3 Field validators

```python
from pydantic import BaseModel, field_validator

class User(BaseModel):
    username: str
    password1: str
    password2: str

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        assert v.isalnum(), "must be alphanumeric"
        return v

    @field_validator("password2")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password1" in info.data and v != info.data["password1"]:
            raise ValueError("passwords do not match")
        return v
```

Also `@model_validator` for whole-model checks:

```python
from pydantic import BaseModel, model_validator

class Item(BaseModel):
    start: int
    end: int

    @model_validator(mode="after")
    def check_order(self):
        if self.end < self.start:
            raise ValueError("end must be >= start")
        return self
```

### 7.4 Model config — strictness, aliases, JSON schema

```python
from pydantic import BaseModel, ConfigDict

class Item(BaseModel):
    model_config = ConfigDict(
        extra="forbid",          # reject unknown fields ('ignore' is default, 'allow' keeps them)
        str_strip_whitespace=True,
        validate_default=True,
        populate_by_name=True,   # allow field names in addition to aliases
    )

    name: str = Field(alias="itemName")
```

`extra="forbid"` is a **great production default**: clients get `422` for typos instead of silently dropping data.

### 7.5 Partial updates with `model_dump(exclude_unset=True)`

```python
class ItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None

@app.patch("/items/{item_id}")
def update_item(item_id: int, item_update: ItemUpdate):
    stored = {"name": "old", "description": "old", "price": 1.0}
    update_data = item_update.model_dump(exclude_unset=True)  # only fields the client sent
    stored.update(update_data)
    return stored
```

`exclude_unset=True` only includes fields actually provided in the request — the standard pattern for PATCH.

### 7.6 Custom error shape for 422

```python
from fastapi import Request, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "validation_failed", "details": exc.errors()},
    )
```

---

## 8. Response Models & Status Codes

### 8.1 Response model

```python
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr

class UserIn(BaseModel):
    username: str
    password: str
    email: EmailStr
    full_name: str | None = None

class UserOut(BaseModel):
    username: str
    email: EmailStr
    full_name: str | None = None

@app.post("/users/", response_model=UserOut)
def create_user(user: UserIn):
    # `password` never leaves the server — response is filtered to UserOut
    return user
```

- `response_model` **filters and validates** the outgoing data — perfect for hiding secrets (`password_hash`) and keeping responses consistent.
- Use `response_model_exclude={"password"}` / `response_model_include={...}` for ad-hoc filtering.

### 8.2 Status codes

```python
from fastapi import FastAPI, status

@app.post("/items/", status_code=status.HTTP_201_CREATED)
def create_item(): ...

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int): ...

@app.get("/items/{item_id}", status_code=status.HTTP_200_OK)
def read_item(item_id: int): ...
```

`status.HTTP_*` constants avoid magic numbers. Return `Response(status_code=204)` explicitly for empty 204s.

### 8.3 Response headers & media type

```python
from fastapi import Response

@app.get("/items/")
def read_items(response: Response):
    response.headers["X-Total-Count"] = "42"
    return [{"name": "a"}]
```

### 8.4 Plain responses & files

```python
from fastapi import Response
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse, FileResponse, StreamingResponse
import io

@app.get("/text", response_class=PlainTextResponse)
def get_text():
    return "plain text"

@app.get("/download")
def download():
    return FileResponse("/path/to/report.pdf", filename="report.pdf")

@app.get("/stream")
def stream():
    def gen():
        for i in range(5):
            yield f"chunk {i}\n"
    return StreamingResponse(io.StringIO("".join(gen())), media_type="text/plain")
```

Use `StreamingResponse` for large files/SSE — don't buffer GBs in memory.

---

## 9. Errors & Exception Handlers

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/items/{item_id}")
def read_item(item_id: int):
    if item_id < 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"item_id": item_id}
```

### 9.1 Custom headers and error payloads

```python
raise HTTPException(
    status_code=418,
    detail="I'm a teapot",
    headers={"X-Error": "teapot"},   # e.g. {"WWW-Authenticate": "Bearer"} for 401s
)
```

### 9.2 Reusable app-level handlers

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})

@app.exception_handler(Exception)   # safety net; log properly!
async def unhandled_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
```

**Rule:** catch expected failures (validation → 422, missing → 404, auth → 401/403); let truly unexpected ones become 500s — and log them with a traceback.

---

## 10. Cookies, Headers & Form Data

```python
from fastapi import Cookie, Header, Form

@app.get("/read-cookie/")
def read_cookie(session_id: str | None = Cookie(default=None)):
    return {"session_id": session_id}

@app.get("/read-header/")
def read_header(
    user_agent: Annotated[str | None, Header(convert_underscores=False)] = None,
    x_custom: Annotated[str | None, Header(alias="X-Custom")] = None,
):
    return {"user_agent": user_agent, "x_custom": x_custom}
```

- `Cookie(...)` reads request cookies; set cookies via `response.set_cookie(...)`.
- `Header(...)` reads headers; `convert_underscores=False` stops auto-conversion of `_` → `-`.

### 10.1 Forms

```python
from fastapi import Form

@app.post("/login/")
def login(username: Annotated[str, Form()], password: Annotated[str, Form()]):
    return {"username": username}
```

`Form(...)` expects `application/x-www-form-urlencoded` (normal HTML form posts). **Requires `python-multipart`.**

---

## 11. File Uploads

```python
from fastapi import UploadFile, File

@app.post("/files/")
async def create_file(file: Annotated[bytes, File()]):
    return {"file_size": len(file)}

@app.post("/upload/")
async def create_upload_file(file: UploadFile):
    contents = await file.read()          # bytes — careful, whole file in memory
    return {"filename": file.filename, "content_type": file.content_type}
```

`UploadFile` (vs raw `bytes`) gives: `filename`, `content_type`, `file` (a SpooledTemporaryFile), `await file.read(size)`, `await file.seek(0)`, `await file.write(data)`. Spooled = in memory until ~1MB, then on disk.

### 11.1 Save safely (stream, validate)

```python
import uuid, shutil
from fastapi import UploadFile, HTTPException
from pathlib import Path

UPLOAD_DIR = Path("uploads")
ALLOWED = {"image/png", "image/jpeg", "application/pdf"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB

@app.post("/upload/")
async def upload(file: UploadFile):
    if file.content_type not in ALLOWED:
        raise HTTPException(415, "Unsupported file type")
    ext = Path(file.filename).suffix
    dest = UPLOAD_DIR / f"{uuid.uuid4()}{ext}"
    size = 0
    with dest.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_BYTES:
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "File too large")
            f.write(chunk)
    return {"saved_as": dest.name, "size": size}
```

**Never** trust `file.filename` (path traversal, weird names) — generate your own names; validate content type **and** size; prefer streaming writes.

---

## 12. Async vs Sync — How FastAPI Runs Your Code

FastAPI runs on an ASGI event loop.

- `async def` path operation → runs **on the event loop** (single thread, many concurrent requests).
- `def` path operation → runs in a **threadpool** (anyio, default 40 threads).

```python
import asyncio, time

@app.get("/async")
async def async_route():
    await asyncio.sleep(2)      # non-blocking: event loop serves others meanwhile
    return {"ok": True}

@app.get("/sync")
def sync_route():
    time.sleep(2)               # blocking, but in a threadpool
    return {"ok": True}
```

**Guidelines:**

1. **Pure async I/O** (httpx, asyncpg, aioredis, motor) → use `async def`.
2. **CPU-heavy** work (image processing, ML inference, big loops) → `def` (threadpool) or better a **process pool / task queue** (§25.7). Never run CPU-bound code on the event loop.
3. **Blocking sync I/O** (`requests`, `time.sleep`, `psycopg2`) → use `def` so it runs in the threadpool; calling it inside `async def` blocks the loop and kills concurrency.
4. Don't mix carelessly: awaiting sync calls in async routes is the #1 FastAPI performance bug.

---

## 13. Middleware, CORS & Gzip

### 13.1 Middleware basics

```python
from fastapi import FastAPI, Request
import time

app = FastAPI()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
    return response
```

Middleware runs **around** every request: before and after. Order of execution = reverse of registration for "before" phase (last registered runs first).

### 13.2 CORS

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://myapp.com", "https://admin.myapp.com"],
    allow_credentials=True,          # needed if browser sends cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

For development you can use `allow_origins=["*"]`, but **never with `allow_credentials=True`** in production — browsers reject it anyway. Prefer explicit origins.

### 13.3 Gzip

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)  # compress responses > 1000 bytes
```

---

## 14. Dependency Injection System

The killer feature. Declare a dependency once, inject it anywhere.

```python
from typing import Annotated
from fastapi import Depends, FastAPI

app = FastAPI()

class CommonQueryParams:
    def __init__(self, q: str | None = None, skip: int = 0, limit: int = 100):
        self.q, self.skip, self.limit = q, skip, limit

@app.get("/items/")
def read_items(commons: Annotated[CommonQueryParams, Depends()]):
    return {"q": commons.q, "skip": commons.skip, "limit": commons.limit}
```

- Dependencies can be **functions or classes** (classes = cleaner for multiple values).
- A dependency is called once per request and its return value cached for that request (same dependency used 3 times → 1 call).

### 14.1 Sub-dependencies

```python
def query_extractor(q: str | None = None):
    return q

def query_or_default(q: Annotated[str, Depends(query_extractor)] = None):
    if not q:
        return "default"
    return q

@app.get("/items/")
def read_items(q: Annotated[str, Depends(query_or_default)]):
    return {"q": q}
```

### 14.2 `yield` dependencies — setup/teardown

```python
from typing import AsyncGenerator, Annotated
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:   # e.g. created in §18
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

This pattern guarantees commit on success, rollback on error — use it for every database dependency.

### 14.3 Dependency scopes — `scope="request"` (shared per request)

```python
from fastapi import Depends

class Pagination:
    def __init__(self, skip: int = 0, limit: int = 100):
        self.skip, self.limit = skip, limit

DepPagination = Annotated[Pagination, Depends(scope="request")]

@app.get("/items/")
def read_items(p: DepPagination): ...

@app.get("/items/count/")
def read_count(p: DepPagination): ...
```

Without `scope="request"`, each endpoint gets its own instance; with it, one instance per request across all endpoints that use it.

### 14.4 Dependencies on a whole router

```python
from fastapi import APIRouter, Depends, HTTPException

async def verify_token(x_token: Annotated[str | None, Header()] = None):
    if x_token != "secret":
        raise HTTPException(403, "Invalid token")

router = APIRouter(dependencies=[Depends(verify_token)])

@router.get("/protected/")
def protected():
    return {"ok": True}
```

Every route under `router` now requires the token — great for admin routes or shared guards.

---

## 15. Background Tasks

For work that must happen after the response is sent (send email, log, update cache):

```python
from fastapi import BackgroundTasks

def send_email(email: str, message: str):
    ...  # runs after response is sent

@app.post("/send-notification/{email}")
async def send_notification(email: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(send_email, email, message="hello")
    return {"message": "Notification queued"}
```

**Limitations:** runs in the same process (killed if the worker dies), no retries, no scheduling, unknown completion. For real work use a task queue — **Celery / arq / taskiq / RQ** (§25.7).

---

## 16. Application Lifespan (Startup/Shutdown)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine("postgresql+asyncpg://user:pass@db:5432/appdb", pool_size=10)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(lifespan=lifespan)
```

Old-style `on_event("startup")` / `on_event("shutdown")` are **deprecated** — use `lifespan`. Typical startup: create engine/pools, run DB connectivity check, warm caches. Shutdown: close pools, flush logs.

---

## 17. Security: OAuth2 + JWT Authentication

### 17.1 The plan

1. Client sends `POST /login` with username + password.
2. Server verifies (bcrypt hash comparison) and returns a **JWT access token**.
3. Client sends `Authorization: Bearer <token>` on subsequent requests.
4. Server decodes token, loads current user, enforces permissions.

JWT (JSON Web Token) = signed payload `{sub: user_id, exp: ...}`. Anyone can read it; only the server can create/verify it. **Stateless** — no session storage needed.

### 17.2 Setup

```bash
pip install python-jose[cryptography] passlib[bcrypt] python-multipart
```

### 17.3 Password hashing (passlib + bcrypt)

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### 17.4 JWT create/decode

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

SECRET_KEY = "change-me-in-env-var"   # long random string in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
```

### 17.5 Current-user dependency

```python
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")  # shows in Swagger UI as Authorize

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None or (sub := payload.get("sub")) is None:
        raise credentials_exception
    # load user from DB here; raise 401 if missing
    user = {"username": sub}          # placeholder
    if user is None:
        raise credentials_exception
    return user

CurrentUser = Annotated[dict, Depends(get_current_user)]

@app.get("/users/me")
def read_users_me(current_user: CurrentUser):
    return current_user
```

### 17.6 Login endpoint (form data → token)

```python
from fastapi import Form

@app.post("/login")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(form_data.username, form_data.password)  # DB lookup + verify_password
    if not user:
        raise HTTPException(401, "Incorrect username or password", headers={"WWW-Authenticate": "Bearer"})
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
```

`OAuth2PasswordRequestForm` expects form fields `username` and `password`. In Swagger UI, click **Authorize** → login form appears.

### 17.7 Scopes / roles

Put roles in the token and check them in dependencies:

```python
def create_access_token(data: dict, scopes: list[str]) -> str:
    to_encode = data.copy()
    to_encode.update({"scopes": scopes, "exp": ...})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class RoleChecker:
    def __init__(self, allowed: list[str]): self.allowed = allowed
    def __call__(self, user: CurrentUser):
        if user["role"] not in self.allowed:
            raise HTTPException(403, "Insufficient permissions")

require_admin = Depends(RoleChecker(["admin"]))

@app.delete("/users/{user_id}", dependencies=[require_admin])
def delete_user(user_id: int): ...
```

### 17.8 Refresh tokens & security hardening

- **Short-lived access tokens** (15–60 min) + **longer-lived refresh tokens** (days). `/refresh` rotates the refresh token and issues a new access token. Store refresh tokens server-side (DB/Redis) to allow revocation.
- Add `aud` (audience) and `iss` (issuer) claims for defense in depth.
- Move `SECRET_KEY` to env/config (§23). Rotate keys periodically.
- Never put passwords or sensitive PII in JWT payloads — they're readable by anyone.

### 17.9 HTTPS & cookies

For browser apps, prefer **secure, HttpOnly, SameSite cookies** over localStorage for tokens (XSS-proof). Set `secure=True, httponly=True, samesite="lax"` on `response.set_cookie(...)`.

---

## 18. Databases: SQLAlchemy 2.0 (Async) + Alembic

### 18.1 Setup

```bash
pip install sqlalchemy asyncpg alembic
```

### 18.2 Engine + session factory (sync SQLite — fine for learning)

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})  # sqlite only
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass
```

### 18.3 The same, async PostgreSQL (production style)

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = "postgresql+asyncpg://app:secret@localhost:5432/appdb"

engine = create_async_engine(DATABASE_URL, pool_size=10, max_overflow=20, pool_pre_ping=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass
```

`pool_pre_ping=True` validates connections before use — prevents "server closed connection" errors from stale pooled connections.

### 18.4 Models

```python
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

`Mapped[...] + mapped_column()` is SQLAlchemy 2.x style — full type safety and autocomplete.

### 18.5 CRUD with async session

```python
from typing import Annotated
from sqlalchemy import select
from fastapi import Depends, HTTPException

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

DbDep = Annotated[AsyncSession, Depends(get_db)]

@app.post("/users/", response_model=UserOut, status_code=201)
async def create_user(user_in: UserIn, db: DbDep):
    user = User(username=user_in.username, email=user_in.email,
                hashed_password=hash_password(user_in.password))
    db.add(user)
    await db.flush()          # get user.id without committing (commit happens in get_db)
    return user

@app.get("/users/", response_model=list[UserOut])
async def list_users(db: DbDep, skip: int = 0, limit: int = 100):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

@app.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: DbDep):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user
```

**Key async points:** `await db.execute(select(...))`, `.scalars().all()`, `await db.get(Model, id)`. There's **no** `db.query()` in async — use `select()`.

### 18.6 Alembic migrations (never `Base.metadata.create_all` in production)

```bash
alembic init migrations
# edit alembic.ini: sqlalchemy.url = postgresql+asyncpg://app:secret@localhost:5432/appdb
# edit migrations/env.py: set target_metadata = Base.metadata

alembic revision --autogenerate -m "create users table"
alembic upgrade head
alembic downgrade -1
alembic history
```

`env.py` for async:

```python
import asyncio
from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config

def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
    )

    async def run():
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()

    asyncio.run(run())
```

Flow: change model → `alembic revision --autogenerate -m "..."` → review the generated file → `alembic upgrade head`.

---

## 19. Database Relationships

### 19.1 One-to-many

```python
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    items: Mapped[list["Item"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner: Mapped["User"] = relationship(back_populates="items")
```

`cascade="all, delete-orphan"` → deleting a user deletes their items.

### 19.2 Loading related data — selectinload / joinedload

```python
from sqlalchemy.orm import selectinload

result = await db.execute(
    select(User).options(selectinload(User.items)).where(User.id == user_id)
)
user = result.scalar_one_or_none()
```

- `selectinload` → second query for all related rows (fast, avoids N+1).
- `joinedload` → one query with JOIN.
- Without either → lazy loading, which **fails in async** ("MissingGreenlet") or causes N+1 in sync. Always eager-load what the response needs.

### 19.3 Many-to-many

```python
from sqlalchemy import Table, Column, ForeignKey

item_tag = Table(
    "item_tag",
    Base.metadata,
    Column("item_id", ForeignKey("items.id"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id"), primary_key=True),
)

class Tag(Base):
    __tablename__ = "tags"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    items: Mapped[list["Item"]] = relationship(secondary=item_tag, back_populates="tags")

class Item(Base):
    ...
    tags: Mapped[list[Tag]] = relationship(secondary=item_tag, back_populates="items")
```

### 19.4 The N+1 problem — an example

```python
# BAD: 1 query for users + 1 per user for items
users = (await db.execute(select(User))).scalars().all()
for u in users:
    print(u.items)   # lazy loads each time

# GOOD
users = (await db.execute(select(User).options(selectinload(User.items)))).scalars().all()
```

---

## 20. Testing (pytest + httpx)

### 20.1 TestClient

```python
from fastapi.testclient import TestClient

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}

def test_create_item():
    r = client.post("/items/", json={"name": "foo", "price": 10})
    assert r.status_code == 201
    assert r.json()["name"] == "foo"

def test_validation_error():
    r = client.post("/items/", json={"name": "foo"})   # missing price
    assert r.status_code == 422
```

`TestClient` wraps httpx and runs your app in-process — no server needed. It **does support async** routes via anyio.

### 20.2 Database-per-test with dependency override

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

TEST_DATABASE_URL = "sqlite://"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False},
                       poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_create_user(client):
    r = client.post("/users/", json={"username": "u1", "email": "u1@x.com", "password": "pw123456"})
    assert r.status_code == 201
```

`dependency_overrides` is the canonical way to swap DB / auth for tests. Use `StaticPool` so the in-memory SQLite DB is shared between sessions.

### 20.3 Async tests

```python
import pytest

@pytest.mark.anyio
async def test_async_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.get("/items/")
    assert r.status_code == 200
```

Add `anyio_backend = "asyncio"` in `conftest.py`, or run async tests through TestClient instead — simpler for most cases.

### 20.4 Testing authenticated endpoints

```python
def test_protected(client):
    r = client.get("/users/me")                      # no token → 401
    assert r.status_code == 401
    token = client.post("/login", data={"username": "u", "password": "p"}).json()["access_token"]
    r = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
```

---

## 21. Routers & Modular Project Structure

### 21.1 APIRouter

```python
# routers/items.py
from fastapi import APIRouter, Depends

router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(verify_token)],   # e.g. everything requires auth
    responses={404: {"description": "Not found"}},
)

@router.get("/")
def list_items(): ...

@router.get("/{item_id}")
def get_item(item_id: int): ...
```

```python
# main.py
from fastapi import FastAPI
from routers import items, users

app = FastAPI()
app.include_router(items.router)
app.include_router(users.router)
```

`prefix` adds a path prefix to every route; `tags` group them in the docs.

### 21.2 Professional project layout

```
app/
├── main.py              # creates app, includes routers, lifespan
├── config.py            # Settings (§23)
├── database.py          # engine, session, Base, get_db
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   └── item.py
├── schemas/             # Pydantic models (in/out)
│   ├── __init__.py
│   ├── user.py
│   └── item.py
├── routers/             # API endpoints per resource
│   ├── __init__.py
│   ├── users.py
│   └── items.py
├── crud/                # (optional) DB access functions
│   ├── __init__.py
│   └── user.py
├── core/                # security, deps, exceptions
│   ├── security.py
│   └── deps.py
└── tests/
    ├── conftest.py
    └── test_users.py
```

Rules: **schemas (Pydantic) ≠ models (SQLAlchemy)** — never return ORM objects directly without a response model; routers stay thin (parse → call service/crud → respond); business logic lives in `crud/`/`services/`, not in endpoints.

---

## 22. WebSockets

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        pass   # client disconnected
```

**Key points:**

- `await websocket.accept()` before sending.
- Always wrap `receive_*` in `try/except WebSocketDisconnect`.
- FastAPI runs the endpoint as a **separate task per connection** — no blocking calls inside.

### 22.1 Connection manager (broadcast)

```python
from collections import defaultdict

class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, room: str, ws: WebSocket):
        await ws.accept()
        self.active[room].append(ws)

    def disconnect(self, room: str, ws: WebSocket):
        self.active[room].remove(ws)

    async def broadcast(self, room: str, message: str):
        for ws in self.active[room][:]:
            await ws.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{room}")
async def room_ws(websocket: WebSocket, room: str):
    await manager.connect(room, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(room, data)
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)
```

**Scaling:** in-memory managers only broadcast within one process. Multi-worker → use **Redis pub/sub** or a broker (NATS, Kafka) to fan out across workers.

---

## 23. Configuration & Settings (pydantic-settings)

Never hardcode secrets. One `Settings` object, everywhere.

```bash
pip install pydantic-settings
```

```python
# config.py
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DEBUG: bool = False

@lru_cache
def get_settings() -> Settings:
    return Settings()

SettingsDep = Annotated[Settings, Depends(get_settings)]
```

`.env`:

```bash
DATABASE_URL=postgresql+asyncpg://app:secret@db:5432/appdb
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
DEBUG=false
```

Usage in a route:

```python
@app.get("/info")
def info(settings: SettingsDep):
    return {"debug": settings.DEBUG}
```

`.env` must be in `.gitignore`. In production, inject env vars via Docker/Kubernetes instead of a file. `@lru_cache` on `get_settings` avoids re-parsing `.env` per request.

---

## 24. Docker & Docker Compose Deployment

### 24.1 Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /code

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

Build & run:

```bash
docker build -t myapp .
docker run -p 8000:8000 --env-file .env myapp
```

### 24.2 Multi-stage (smaller, safer image)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 24.3 docker-compose.yml (app + Postgres + Redis)

```yaml
services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    command: sh -c "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4"

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7

volumes:
  pgdata:
```

```bash
docker compose up --build
docker compose exec app alembic revision --autogenerate -m "init"
```

**Notable details:** Postgres healthcheck prevents app starting before DB is ready; migrations run at container start (`alembic upgrade head`) — the common pattern, though many prefer a separate release step/job.

---

## 25. Production Patterns

### 25.1 Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

@app.get("/")
def root():
    logger.info("root called")
    return {"ok": True}
```

Structured JSON logs (for ELK/Cloudwatch) via `structlog` or `python-json-logger`. In production also: request-ID middleware, correlation IDs propagated to logs, never log passwords/tokens/PII.

### 25.2 Pagination

```python
@app.get("/items/", response_model=list[ItemOut])
async def list_items(db: DbDep, skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=1000)):
    result = await db.execute(select(Item).offset(skip).limit(limit).order_by(Item.id))
    return result.scalars().all()
```

Cursor-based (keyset) pagination performs better on large tables: `WHERE id > :cursor ORDER BY id LIMIT :n`.

### 25.3 API versioning

- **Path**: `/v1/items`, `/v2/items` — explicit, simplest, recommended.
- Or `APIRouter(prefix="/v1")` per version; keep old versions alive with clear sunset headers (`Sunset`, `Deprecation`).

### 25.4 Rate limiting (slowapi — Redis-backed)

```bash
pip install slowapi
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/items/")
@limiter.limit("100/minute")
def list_items(request: Request):
    ...
```

Key by user ID instead of IP for authenticated routes. For serious scale, use Redis-backed limits or an API gateway (Kong, nginx).

### 25.5 Caching with Redis

```python
import redis.asyncio as redis
from fastapi import Depends

redis_client = redis.Redis(host="redis", decode_responses=True)

@app.get("/hot-items")
async def hot_items():
    cached = await redis_client.get("hot-items")
    if cached:
        return json.loads(cached)
    data = expensive_query()
    await redis_client.set("hot-items", json.dumps(data), ex=60)  # 60s TTL
    return data
```

Cache at the service layer, not the endpoint. Always set TTLs; invalidate on writes for the affected keys.

### 25.6 Validation & safety quick list

- Validate everything: path, query, body, files (type + size + streaming).
- Use `extra="forbid"` on input models.
- Parameterize DB access via ORM — never string-format SQL.
- Return generic 500s; log details server-side.
- Set security headers (CSP, X-Content-Type-Options, etc.) via middleware.
- Rate-limit auth endpoints (brute-force protection).

### 25.7 Long-running & CPU-heavy work

Don't do it in the request path. Options:

1. **Background tasks** (§15) — fire-and-forget, in-process. Simple but fragile.
2. **Task queue (Celery / arq / taskiq / RQ)** — retries, scheduling, result backends, workers scaled independently. Default choice for email, reports, ML inference, ETL.
3. **Process pools** for CPU-bound sync work called from `def` endpoints.

Example with **arq** (lightweight, async-native):

```bash
pip install arq
```

```python
# worker.py
async def send_email(ctx, to: str, subject: str):
    ...  # send

class WorkerSettings:
    functions = [send_email]
```

```python
# endpoint
@app.post("/notify/")
async def notify(to: str):
    await arq_pool.enqueue_job("send_email", to, "Hello")
    return {"queued": True}
```

### 25.8 Serving static files & templates

```python
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/page")
def page(request: Request):
    return templates.TemplateResponse("page.html", {"request": request, "title": "Hi"})
```

Mount at a sub-path, never at `/` first (it would shadow routes).

### 25.9 Multiple apps mounted

```python
subapi = FastAPI()

@subapi.get("/health")
def health():
    return {"status": "ok"}

app.mount("/internal", subapi)
```

`GET /internal/health` → works. Common for internal health/admin apps.

---

## 26. Professional Checklist & Resources

### Before shipping

- [ ] All secrets in env / secret manager — zero hardcoded values
- [ ] `DEBUG=false`, `--reload` off, multiple uvicorn workers
- [ ] Alembic migrations in CI; DB migrations reviewed, never auto-applied blindly
- [ ] HTTPS everywhere (TLS termination at reverse proxy/load balancer)
- [ ] CORS locked to real origins; `allow_credentials` consistent
- [ ] Auth: short-lived JWTs, bcrypt passwords, rate-limited login
- [ ] Input validation: `extra="forbid"`, file type/size checks, no raw SQL
- [ ] Error shape consistent; 500s logged with tracebacks; nothing sensitive leaked
- [ ] Pagination on all list endpoints; indexes on filtered columns
- [ ] Tests: unit + integration; dependency overrides for DB
- [ ] Observability: structured logs, request IDs, health endpoint, metrics (Prometheus)
- [ ] Docker image minimal; non-root user; healthchecks
- [ ] `pyproject.toml`/`requirements.txt` pinned; CI running lint (ruff) + tests

### Common commands cheat sheet

```bash
uvicorn main:app --reload                      # dev
uvicorn main:app --workers 4                   # prod
alembic revision --autogenerate -m "msg"       # new migration
alembic upgrade head                           # apply migrations
pytest -v                                      # run tests
docker compose up --build                      # full stack
```

### Keep learning

- Official docs: `https://fastapi.tiangolo.com` (excellent)
- SQLAlchemy 2.0 docs: `https://docs.sqlalchemy.org`
- Pydantic v2 docs: `https://docs.pydantic.dev`
- Real-world reference architecture (opinionated, production-style): `full-stack-fastapi-template` on GitHub

---

*End of guide. Build small, then adopt one advanced section at a time — auth → database → testing → deployment.*
