"""
(V) Interview Views - HTTP Presentation & Route Endpoints for AI Interview & Telemetry
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    AdaptiveQuestionRequest, AdaptiveQuestionResponse, 
    TelemetryEventCreate, EvaluationRequest,
    CandidateQuestionsRequest, CandidateQuestionsResponse,
    AIConfigRequest, AIStatusResponse
)
from controllers.interview_controller import InterviewController
from ai_engine import get_llm_status, set_llm_api_key

from auth_dependencies import get_current_user, require_recruiter
from models.db_models import UserModel

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.get("/ai-status", response_model=AIStatusResponse)
def ai_status():
    """Returns current active LLM status, provider, and active model."""
    return get_llm_status()

@router.post("/ai-config")
def update_ai_config(payload: AIConfigRequest, current_user: UserModel = Depends(require_recruiter)):
    """Recruiter-only: Sets new API key (Gemini, Groq, OpenAI), tests connection, and updates configuration."""
    res = set_llm_api_key(payload.provider, payload.api_key)
    return {
        **res,
        "status": get_llm_status()
    }

@router.post("/candidate-questions", response_model=CandidateQuestionsResponse)
def candidate_questions(payload: CandidateQuestionsRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    return InterviewController.generate_candidate_questions(payload, db)

@router.post("/adaptive-question", response_model=AdaptiveQuestionResponse)
def adaptive_question(payload: AdaptiveQuestionRequest, current_user: UserModel = Depends(get_current_user)):
    return InterviewController.process_adaptive_question(payload)

@router.post("/telemetry")
def record_telemetry(payload: TelemetryEventCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    event_id = InterviewController.record_telemetry(payload, db)
    return {"status": "recorded", "event_id": event_id}

@router.post("/evaluate")
def evaluate(payload: EvaluationRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    evaluation, err = InterviewController.evaluate_session(payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return evaluation
