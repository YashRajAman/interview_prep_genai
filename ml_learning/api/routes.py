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


def load_topics():
    """Load the master topics registry."""
    with open(os.path.join(CONTENT_DIR, "topics.json"), "r") as f:
        return json.load(f)


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
    topics = load_topics()
    for level in topics["levels"]:
        if level["id"] == level_id:
            for topic in level["topics"]:
                if topic["id"] == topic_id:
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
    topics = load_topics()
    for level in topics["levels"]:
        for topic in level["topics"]:
            if topic["id"] == submission.topic_id:
                quiz = topic.get("quiz", [])
                results = {}
                correct_count = 0
                total = len(quiz)

                for q_idx_str, answer in submission.answers.items():
                    q_idx = int(q_idx_str)
                    if q_idx < len(quiz):
                        question = quiz[q_idx]
                        is_correct = answer == question["correct"]
                        results[q_idx_str] = {
                            "correct": is_correct,
                            "correct_answer": question["correct"],
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
