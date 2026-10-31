"""
ML Learning Platform — FastAPI Application
A comprehensive, interactive machine learning learning platform.
"""

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse, HTMLResponse
from api.routes import router as api_router
import json
import os

app = FastAPI(title="ML Learning Platform", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# Templates
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main SPA shell."""
    return templates.TemplateResponse(request=request, name="index.html")


# Include API routes
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
