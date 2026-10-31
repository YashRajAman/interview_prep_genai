"""
API Routes for the ML Learning Platform.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
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

    return JSONResponse(content={"error": "Topic not found"}, status_code=404)
