"""
(V) Candidate Views - HTTP Presentation & Route Endpoints for Candidates
Protected by Role-Based Access Control: Recruiter-only management & Candidate resource ownership.
"""
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    CandidateApply, CandidateResponse, CandidateStatusUpdate, CandidateScheduleRequest,
    EmailSendRequest, CandidateApplicationItem, CandidateStageUpdate, HiringDecisionUpdate,
    AssessmentInviteRequest
)
from controllers.candidate_controller import CandidateController
from models.db_models import UserModel
from auth_dependencies import get_current_user, require_recruiter, get_optional_current_user

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateResponse])
def get_candidates(
    skip: int = 0,
    limit: int = 100,
    job_id: Optional[str] = None,
    compensation_status: Optional[str] = None,
    min_expected_ctc: Optional[float] = None,
    max_expected_ctc: Optional[float] = None,
    q: Optional[str] = None,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: lists all candidate records with hiring telemetry, compensation analysis, and query filtering."""
    return CandidateController.get_all_candidates(
        db,
        skip=skip,
        limit=limit,
        job_id=job_id,
        compensation_status=compensation_status,
        min_expected_ctc=min_expected_ctc,
        max_expected_ctc=max_expected_ctc,
        q=q
    )

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
        # Scrub private internal recruiter scores and compensation analysis for candidate view
        cand.match_score = 0
        cand.recruiter_score = None
        cand.coding_score = None
        cand.match_details = None
        cand.compensation_analysis = None

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

@router.post("/{candidate_id}/invite-assessment", response_model=CandidateResponse)
def invite_assessment(
    candidate_id: str,
    payload: AssessmentInviteRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Idempotently invite candidate to technical assessment."""
    cand, err = CandidateController.invite_assessment(
        candidate_id=candidate_id,
        custom_message=payload.custom_message,
        changed_by=current_user.email,
        db=db
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return cand

@router.patch("/{candidate_id}/stage", response_model=CandidateResponse)
def update_stage(
    candidate_id: str,
    payload: CandidateStageUpdate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Authoritative pipeline stage transition with transition guards."""
    cand, err = CandidateController.update_stage(
        candidate_id=candidate_id,
        new_stage=payload.stage,
        notes=payload.notes or "",
        changed_by=current_user.email,
        db=db
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return cand

@router.patch("/{candidate_id}/decision", response_model=CandidateResponse)
def update_decision(
    candidate_id: str,
    payload: HiringDecisionUpdate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Record hiring decision without regressing pipeline stage."""
    cand, err = CandidateController.update_hiring_decision(
        candidate_id=candidate_id,
        new_decision=payload.decision,
        recruiter_score=payload.recruiter_score,
        rejection_reason=payload.rejection_reason,
        rejection_category=payload.rejection_category,
        hr_notes=payload.hr_notes or "",
        changed_by=current_user.email,
        db=db
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return cand

@router.get("/{candidate_id}/audit-logs")
def get_audit_logs(
    candidate_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Retrieve state transition audit log history."""
    logs = CandidateController.get_state_logs(candidate_id, db)
    return [
        {
            "id": l.id,
            "candidate_id": l.candidate_id,
            "dimension": l.dimension,
            "from_value": l.from_value,
            "to_value": l.to_value,
            "changed_by": l.changed_by,
            "notes": l.notes,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in logs
    ]

MAX_RESUME_BYTES = 10 * 1024 * 1024  # 10MB limit

@router.post("/parse-resume")
async def parse_resume(file: Optional[UploadFile] = File(None), raw_text: Optional[str] = Form(None), current_user: Optional[UserModel] = Depends(get_optional_current_user)):
    file_bytes = None
    filename = None
    if file:
        filename = os.path.basename(file.filename or "resume.pdf")
        # Read with size boundary guard
        file_bytes = await file.read(MAX_RESUME_BYTES + 1)
        if len(file_bytes) > MAX_RESUME_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Resume file exceeds the maximum allowed limit of 10MB."
            )
        # Validate magic bytes for PDF format
        if filename.lower().endswith(".pdf") and not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file format. The file is corrupted or not a valid PDF document."
            )

    res = CandidateController.parse_resume_content(file_bytes=file_bytes, filename=filename, raw_text=raw_text)
    return res
