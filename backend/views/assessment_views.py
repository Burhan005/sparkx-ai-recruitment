"""
(V) Assessment Views - HTTP Endpoints for 4-Category Technical Assessments
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import CodeRunRequest, CodeRunResponse, AssessmentSubmitRequest, AssessmentSubmitResponse
from controllers.assessment_controller import AssessmentController

router = APIRouter(prefix="/api/assessment", tags=["Technical Assessment"])

@router.get("/{candidate_id}")
def get_assessment(candidate_id: str, job_id: str = None, db: Session = Depends(get_db)):
    res, err = AssessmentController.get_candidate_assessment(candidate_id, job_id, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return res

@router.post("/run-code", response_model=CodeRunResponse)
def run_code(payload: CodeRunRequest, db: Session = Depends(get_db)):
    return AssessmentController.run_code_sandbox(payload, db)

@router.post("/{candidate_id}/submit", response_model=AssessmentSubmitResponse)
def submit_assessment(candidate_id: str, payload: AssessmentSubmitRequest, db: Session = Depends(get_db)):
    res, err = AssessmentController.submit_candidate_assessment(candidate_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return res
