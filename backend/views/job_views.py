from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    JobCreate, JobUpdate, JobResponse, JobMatchRequest, JobMatchResponse,
    BatchJobMatchRequest, BatchJobMatchResponse, JobStatusUpdate,
    JobDecisionAssistantRequest, JobDecisionAssistantResponse,
    JobDescriptionGenerateRequest, JobDescriptionRefineRequest, JobDescriptionDraft,
    JobSkillRequirementSyncRequest, JobSkillRequirementSyncResponse
)
from controllers.job_controller import JobController
from services.recruiter_decision_assistant_service import RecruiterDecisionAssistantService
from services.job_description_builder_service import JobDescriptionBuilderService

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
    is_recruiter = current_user and current_user.role == "recruiter"
    org_id = current_user.organization_id if is_recruiter else None
    effective_status = status if is_recruiter else (status if (status and status.lower() != "draft") else "Active")
    return JobController.get_all_jobs(db, skip=skip, limit=limit, status_filter=effective_status, organization_id=org_id)

@router.post("/batch-match")
def batch_match(
    payload: BatchJobMatchRequest,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return JobController.batch_match_jobs(payload, db, current_user=current_user)

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, current_user: Optional[UserModel] = Depends(get_optional_current_user), db: Session = Depends(get_db)):
    job = JobController.get_job_by_id(job_id, db)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == "Draft" and (not current_user or current_user.role != "recruiter"):
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
def match_job(
    job_id: str,
    payload: JobMatchRequest,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    job = JobController.get_job_by_id(job_id, db)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == "Draft" and (not current_user or current_user.role != "recruiter"):
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user and current_user.role == "recruiter":
        user_org = getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        job_org = getattr(job, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if user_org != job_org:
            raise HTTPException(status_code=403, detail="Cross-tenant access forbidden: Job belongs to another organization.")

    res, err = JobController.match_candidate_to_job(job_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return res

@router.post("", response_model=JobResponse)
def create_job(payload: JobCreate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: Post a new job requirement tied to recruiter's organization."""
    return JobController.create_new_job(payload, db, organization_id=current_user.organization_id)


# ─── Phase 4G: Recruiter AI Decision Assistant (Job Pool Scope) ───────────────

@router.post("/{job_id}/decision-assistant", response_model=JobDecisionAssistantResponse)
def query_job_decision_assistant(
    job_id: str,
    payload: JobDecisionAssistantRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Evidence-grounded pool-wide AI decision assistant for job requisitions.
    Answers candidate alignment, talent distribution, and unverified skill gap questions across the applicant cohort.
    Strictly enforces tenant isolation, prompt-injection defense, and authoritative scorecard grounding.
    """
    return RecruiterDecisionAssistantService.answer_job_query(
        job_id=job_id,
        recruiter_query=payload.query,
        current_user=current_user,
        db=db,
        limit=payload.limit or 10,
        filter_stage=payload.filter_stage
    )


# ─── Phase 4H: AI Job Description Builder ─────────────────────────────────────

@router.post("/generate-description", response_model=JobDescriptionDraft)
def generate_job_description(
    payload: JobDescriptionGenerateRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Synthesize structured, production-grade job description draft
    grounded in recruiter input and database skill taxonomy.
    """
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Job title is required.")
    if not payload.department or not payload.department.strip():
        raise HTTPException(status_code=400, detail="Department is required.")
    return JobDescriptionBuilderService.generate_job_description(payload, db, current_user)


@router.post("/refine-description", response_model=JobDescriptionDraft)
def refine_job_description(
    payload: JobDescriptionRefineRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Contextually refine an existing job description draft
    (improve clarity, make actionable, separate qualifications, inclusive wording, etc.).
    """
    if not payload.current_description or not payload.current_description.strip():
        raise HTTPException(status_code=400, detail="Current job description text is required for refinement.")
    return JobDescriptionBuilderService.refine_job_description(payload, db, current_user)


@router.post("/{job_id}/sync-skills", response_model=JobSkillRequirementSyncResponse)
def sync_job_skills(
    job_id: str,
    payload: JobSkillRequirementSyncRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Synchronizes approved must-have and preferred skill requirements into JobSkillRequirementModel.
    Enforces tenant isolation and backward compatibility with JobModel.required_skills.
    """
    try:
        return JobDescriptionBuilderService.sync_job_skills(job_id, payload.skills, db, current_user)
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync skills: {str(e)}")




