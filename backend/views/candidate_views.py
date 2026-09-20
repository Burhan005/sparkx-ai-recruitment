"""
(V) Candidate Views - HTTP Presentation & Route Endpoints for Candidates
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import CandidateApply, CandidateResponse, CandidateStatusUpdate, CandidateScheduleRequest, EmailSendRequest, CandidateApplicationItem
from controllers.candidate_controller import CandidateController

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    return CandidateController.get_all_candidates(db)

@router.get("/my-applications", response_model=List[CandidateApplicationItem])
def get_my_applications(email: str, db: Session = Depends(get_db)):
    return CandidateController.get_candidate_applications(email, db)

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    cand = CandidateController.get_candidate_by_id(candidate_id, db)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand

@router.post("/apply", response_model=CandidateResponse)
def apply(payload: CandidateApply, db: Session = Depends(get_db)):
    cand, err = CandidateController.apply_candidate(payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return cand

@router.patch("/{candidate_id}/status")
def update_status(candidate_id: str, payload: CandidateStatusUpdate, db: Session = Depends(get_db)):
    success = CandidateController.update_status(candidate_id, payload, db)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": f"Candidate {candidate_id} status updated to {payload.status}"}

@router.post("/{candidate_id}/schedule", response_model=CandidateResponse)
def schedule_interview(candidate_id: str, payload: CandidateScheduleRequest, db: Session = Depends(get_db)):
    cand, err = CandidateController.schedule_interview(candidate_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return cand

@router.post("/{candidate_id}/send-email")
def send_email(candidate_id: str, payload: EmailSendRequest, db: Session = Depends(get_db)):
    email_event, err = CandidateController.send_email_notification(candidate_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return {"status": "sent", "email": email_event}
