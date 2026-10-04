from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import JobCreate, JobUpdate, JobResponse, JobMatchRequest, JobMatchResponse, BatchJobMatchRequest, BatchJobMatchResponse, JobStatusUpdate
from controllers.job_controller import JobController

from auth_dependencies import require_recruiter, get_optional_current_user
from models.db_models import UserModel

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

@router.get("", response_model=List[JobResponse])
def get_jobs(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch jobs. If authenticated as a recruiter, automatically scopes to recruiter's organization.
    For candidates and public discovery, returns available jobs.
    """
    org_id = current_user.organization_id if (current_user and current_user.role == "recruiter") else None
    return JobController.get_all_jobs(db, skip=skip, limit=limit, status_filter=status, organization_id=org_id)

@router.post("/batch-match")
def batch_match(payload: BatchJobMatchRequest, db: Session = Depends(get_db)):
    return JobController.batch_match_jobs(payload, db)

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, current_user: Optional[UserModel] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    job = JobController.get_job_by_id(job_id, db)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user and current_user.role == "recruiter":
        user_org = getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        job_org = getattr(job, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if user_org != job_org:
            raise HTTPException(status_code=403, detail="Cross-tenant access forbidden: Job belongs to another organization.")
    return job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: str, payload: JobUpdate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: Update an existing job requirement and compensation budget with tenant isolation."""
    job, err = JobController.update_job(job_id, payload, db, organization_id=current_user.organization_id)
    if err:
        status_code = 403 if "Cross-tenant" in err else 404
        raise HTTPException(status_code=status_code, detail=err)
    return job

@router.post("/{job_id}/status", response_model=JobResponse)
def change_job_status(job_id: str, payload: JobStatusUpdate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """
    Recruiter-only: Manage job lifecycle state (Active, Paused, Closed) with tenant isolation.
    Preserves all historical candidates, applications, and evaluation evidence.
    """
    job, err = JobController.change_job_status(
        job_id=job_id,
        new_status=payload.status,
        closure_reason=payload.closure_reason,
        recruiter_email=current_user.email,
        db=db,
        organization_id=current_user.organization_id
    )
    if err:
        status_code = 403 if "Cross-tenant" in err else 400
        raise HTTPException(status_code=status_code, detail=err)
    return job

@router.post("/{job_id}/match", response_model=JobMatchResponse)
def match_job(job_id: str, payload: JobMatchRequest, db: Session = Depends(get_db)):
    res, err = JobController.match_candidate_to_job(job_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return res

@router.post("", response_model=JobResponse)
def create_job(payload: JobCreate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: Post a new job requirement tied to recruiter's organization."""
    return JobController.create_new_job(payload, db, organization_id=current_user.organization_id)


