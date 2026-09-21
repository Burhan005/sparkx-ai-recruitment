"""
(V) Job Views - HTTP Presentation & Route Endpoints for Jobs
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import JobCreate, JobResponse, JobMatchRequest, JobMatchResponse, BatchJobMatchRequest, BatchJobMatchResponse
from controllers.job_controller import JobController

from auth_dependencies import require_recruiter
from models.db_models import UserModel

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return JobController.get_all_jobs(db)

@router.post("/batch-match")
def batch_match(payload: BatchJobMatchRequest, db: Session = Depends(get_db)):
    return JobController.batch_match_jobs(payload, db)

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = JobController.get_job_by_id(job_id, db)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/match", response_model=JobMatchResponse)
def match_job(job_id: str, payload: JobMatchRequest, db: Session = Depends(get_db)):
    res, err = JobController.match_candidate_to_job(job_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return res

@router.post("", response_model=JobResponse)
def create_job(payload: JobCreate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: Post a new job requirement."""
    return JobController.create_new_job(payload, db)

