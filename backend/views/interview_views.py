"""
(V) Interview Views - HTTP Presentation & Route Endpoints for AI Interview & Telemetry
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import AdaptiveQuestionRequest, AdaptiveQuestionResponse, TelemetryEventCreate, EvaluationRequest
from controllers.interview_controller import InterviewController

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.post("/adaptive-question", response_model=AdaptiveQuestionResponse)
def adaptive_question(payload: AdaptiveQuestionRequest):
    return InterviewController.process_adaptive_question(payload)

@router.post("/telemetry")
def record_telemetry(payload: TelemetryEventCreate, db: Session = Depends(get_db)):
    event_id = InterviewController.record_telemetry(payload, db)
    return {"status": "recorded", "event_id": event_id}

@router.post("/evaluate")
def evaluate(payload: EvaluationRequest, db: Session = Depends(get_db)):
    evaluation, err = InterviewController.evaluate_session(payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return evaluation
