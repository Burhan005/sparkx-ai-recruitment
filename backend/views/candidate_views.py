"""
(V) Candidate Views - HTTP Presentation & Route Endpoints for Candidates
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import CandidateApply, CandidateResponse, CandidateStatusUpdate
from controllers.candidate_controller import CandidateController

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    return CandidateController.get_all_candidates(db)

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
