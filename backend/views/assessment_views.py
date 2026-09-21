"""
(V) Assessment Views - HTTP Endpoints for 4-Category Technical Assessments
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import CodeRunRequest, CodeRunResponse, AssessmentSubmitRequest, AssessmentSubmitResponse
from controllers.assessment_controller import AssessmentController

from auth_dependencies import get_current_user
from models.db_models import UserModel, CandidateModel

router = APIRouter(prefix="/api/assessment", tags=["Technical Assessment"])

@router.get("/{candidate_id}")
def get_assessment(candidate_id: str, job_id: str = None, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Candidate & Recruiter access to tailored 4-category challenge bundle.
    Verifies candidate resource ownership: candidates can only fetch their own assessment.
    """
    if current_user.role == "candidate":
        cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate record not found")
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: You cannot access another candidate's assessment.")

    is_recruiter = (current_user.role == "recruiter")
    res, err = AssessmentController.get_candidate_assessment(candidate_id, job_id, db, is_recruiter=is_recruiter)
    if err:
        status_code = 403 if ("restricted" in err.lower() or "screening" in err.lower()) else 404
        raise HTTPException(status_code=status_code, detail=err)
    return res

@router.post("/run-code", response_model=CodeRunResponse)
def run_code(payload: CodeRunRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Execute Python code in isolated sandbox (requires authenticated session)."""
    return AssessmentController.run_code_sandbox(payload, db)

@router.post("/{candidate_id}/submit", response_model=AssessmentSubmitResponse)
def submit_assessment(candidate_id: str, payload: AssessmentSubmitRequest, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Submit candidate assessment bundle.
    Verifies candidate resource ownership and recruiter scheduling authorization.
    """
    if current_user.role == "candidate":
        cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate record not found")
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: You cannot submit an assessment for another candidate.")

    res, err = AssessmentController.submit_candidate_assessment(candidate_id, payload, db)
    if err:
        status_code = 403 if ("restricted" in err.lower() or "screening" in err.lower() or "already" in err.lower()) else 404
        raise HTTPException(status_code=status_code, detail=err)
    return res
