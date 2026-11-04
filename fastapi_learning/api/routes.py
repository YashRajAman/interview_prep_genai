"""
API Routes for the FastAPI Learning Platform.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from api.code_runner import execute_code
import json
import os

router = APIRouter()

# Load topics data
CONTENT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "content")
TOPICS_DIR = os.path.join(CONTENT_DIR, "topics")
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
    timeout: int = 15
    test_requests: Optional[list] = None  # [{method, path, json, headers}]


class QuizSubmission(BaseModel):
    topic_id: str
    answers: dict  # {question_index: selected_answer}


@router.get("/topics")
async def get_topics():
    """Get all topics organized by level."""
    topics = load_topics()
    return JSONResponse(content=topics)


@router.get("/topic/{topic_id}")
async def get_topic_by_id(topic_id: str):
    """Get a specific topic's full content by topic_id alone."""
    topic = get_single_topic("", topic_id)
    if topic:
        return JSONResponse(content=topic)
    return JSONResponse(content={"error": "Topic not found"}, status_code=404)


@router.get("/topic/{level_id}/{topic_id}")
async def get_topic(level_id: str, topic_id: str):
    """Get a specific topic's full content."""
    topic = get_single_topic(level_id, topic_id)
    if topic:
        return JSONResponse(content=topic)
    return JSONResponse(content={"error": "Topic not found"}, status_code=404)


@router.post("/run-code")
async def run_code(request: CodeExecutionRequest):
    """Execute Python/FastAPI code in sandbox."""
    result = execute_code(
        request.code,
        request.timeout,
        test_requests=request.test_requests,
    )
    return JSONResponse(content=result)


@router.post("/check-quiz")
async def check_quiz(submission: QuizSubmission):
    """Check quiz answers and return results."""
    topic = get_single_topic("", submission.topic_id)
    quiz = topic.get("quiz", []) if topic else []

    if not quiz:
        return JSONResponse(content={"error": "Quiz not found", "results": [], "score": 0}, status_code=404)

    results = []
    correct_count = 0
    for i, question in enumerate(quiz):
        user_answer = submission.answers.get(str(i))
        is_correct = user_answer == question["correct"]
        if is_correct:
            correct_count += 1
        results.append({
            "question_index": i,
            "correct": is_correct,
            "correct_answer": question["correct"],
            "explanation": question.get("explanation", ""),
        })

    return JSONResponse(content={
        "results": results,
        "score": correct_count,
        "total": len(quiz),
        "percentage": round((correct_count / len(quiz)) * 100) if quiz else 0,
    })


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "platform": "fastapi_learning"}
