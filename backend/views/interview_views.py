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
    AIConfigRequest, AIStatusResponse, InterviewStartRequest
)
from controllers.interview_controller import InterviewController
from ai_engine import get_llm_status, set_llm_api_key

from auth_dependencies import get_current_user, require_recruiter
from models.db_models import UserModel, CandidateModel

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
    """Generate or retrieve tailored interview questions with ownership verification."""
    if current_user.role == "candidate":
        if not payload.candidate_id:
            raise HTTPException(status_code=400, detail="candidate_id required")
        cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate record not found")
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: Cannot access another candidate's interview questions.")
        if cand.interview_status not in ["scheduled", "in_progress"] and not cand.interview_scheduled_at:
            raise HTTPException(status_code=403, detail="Interview access restricted: You do not have a scheduled interview.")

    return InterviewController.generate_candidate_questions(payload, db)

@router.post("/start")
def start_interview(payload: InterviewStartRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Candidate or Recruiter starts interview session.
    Transitions interview_status from scheduled to in_progress.
    """
    if current_user.role == "candidate":
        cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate record not found")
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: Cannot start interview for another candidate.")
        if cand.interview_status not in ["scheduled", "in_progress"] and not cand.interview_scheduled_at:
            raise HTTPException(status_code=403, detail="Interview access restricted: Candidate is not scheduled for an interview.")

    success, err = InterviewController.start_interview(payload.candidate_id, db)
    if not success:
        raise HTTPException(status_code=400, detail=err)
    return {"success": True, "message": "Interview session started"}

@router.post("/adaptive-question", response_model=AdaptiveQuestionResponse)
def adaptive_question(payload: AdaptiveQuestionRequest, current_user: UserModel = Depends(get_current_user)):
    return InterviewController.process_adaptive_question(payload)

@router.post("/telemetry")
def record_telemetry(payload: TelemetryEventCreate, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate record not found")
    if current_user.role == "candidate":
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: Cannot record telemetry for another candidate.")
    event_id = InterviewController.record_telemetry(payload, db)
    return {"status": "recorded", "event_id": event_id}

@router.post("/evaluate")
def evaluate(payload: EvaluationRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "candidate":
        cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate record not found")
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: Cannot submit evaluation for another candidate.")
        if cand.interview_status not in ["scheduled", "in_progress"]:
            raise HTTPException(status_code=400, detail="Interview is not in progress or scheduled.")

    evaluation, err = InterviewController.evaluate_session(payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return evaluation
