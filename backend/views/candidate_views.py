"""
(V) Candidate Views - HTTP Presentation & Route Endpoints for Candidates
Protected by Role-Based Access Control: Recruiter-only management & Candidate resource ownership.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from database import get_db
from schemas import CandidateApply, CandidateResponse, CandidateStatusUpdate, CandidateScheduleRequest, EmailSendRequest, CandidateApplicationItem
from controllers.candidate_controller import CandidateController
from models.db_models import UserModel
from auth_dependencies import get_current_user, require_recruiter, get_optional_current_user

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateResponse])
def get_candidates(current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: lists all candidate records with hiring telemetry and scores."""
    return CandidateController.get_all_candidates(db)

@router.get("/my-applications", response_model=List[CandidateApplicationItem])
def get_my_applications(email: Optional[str] = None, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Authenticated access to candidate applications.
    Enforces resource ownership: Candidates only receive applications matching their authenticated token email.
    """
    if current_user.role == "candidate":
        if email and email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: You cannot view another candidate's applications.")
        target_email = current_user.email
    else:
        target_email = email or current_user.email
    return CandidateController.get_candidate_applications(target_email, db)

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Fetch candidate dossier.
    Recruiters have full visibility. Candidates may only view their own record.
    """
    cand = CandidateController.get_candidate_by_id(candidate_id, db)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if current_user.role == "candidate":
        if cand.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(status_code=403, detail="Access denied: You cannot view another candidate's profile.")
        # Scrub private internal recruiter scores for candidate view
        cand.match_score = 0
        cand.recruiter_score = None
        cand.coding_score = None
        cand.match_details = None

    return cand

@router.post("/apply", response_model=CandidateResponse)
def apply(payload: CandidateApply, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit application tied to the authenticated user."""
    if current_user.role == "candidate":
        payload.email = current_user.email
        if not payload.name:
            payload.name = current_user.name

    cand, err = CandidateController.apply_candidate(payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return cand

@router.patch("/{candidate_id}/status")
def update_status(candidate_id: str, payload: CandidateStatusUpdate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: update hiring pipeline stage, notes, or score."""
    success = CandidateController.update_status(candidate_id, payload, db)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": f"Candidate {candidate_id} status updated to {payload.status}"}

@router.post("/{candidate_id}/schedule", response_model=CandidateResponse)
def schedule_interview(candidate_id: str, payload: CandidateScheduleRequest, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: schedule interview slot and advance candidate to assessment."""
    cand, err = CandidateController.schedule_interview(candidate_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return cand

@router.post("/{candidate_id}/send-email")
def send_email(candidate_id: str, payload: EmailSendRequest, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: dispatch candidate interview and offer emails."""
    email_event, err = CandidateController.send_email_notification(candidate_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return {"status": "sent", "email": email_event}

@router.post("/parse-resume")
async def parse_resume(file: Optional[UploadFile] = File(None), raw_text: Optional[str] = Form(None), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    file_bytes = None
    filename = None
    if file:
        file_bytes = await file.read()
        filename = file.filename
    res = CandidateController.parse_resume_content(file_bytes=file_bytes, filename=filename, raw_text=raw_text)
    return res
