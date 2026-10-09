"""
(V) Candidate Views - HTTP Presentation & Route Endpoints for Candidates
Protected by Role-Based Access Control: Recruiter-only management & Candidate resource ownership.
"""
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    CandidateApply, CandidateResponse, CandidateStatusUpdate, CandidateScheduleRequest,
    EmailSendRequest, CandidateApplicationItem, CandidateStageUpdate, HiringDecisionUpdate,
    AssessmentInviteRequest, ExpectedUpdateDateRequest, CandidateUpdateNotificationRequest,
    CandidateReopenRequest, PipelineStatsResponse, BulkCandidateActionRequest, BulkCandidateActionResponse,
    CandidateScorecardResponse, CandidateComparisonRequest, CandidateComparisonResponse,
    CandidateDecisionContextResponse, DecisionHistoryItem
)
from controllers.candidate_controller import CandidateController
from services.candidate_scorecard_service import CandidateScorecardService
from services.candidate_decision_service import CandidateDecisionService
from models.db_models import UserModel, CandidateModel, JobModel
from auth_dependencies import (
    get_current_user, require_recruiter, get_optional_current_user,
    verify_candidate_ownership, verify_recruiter_tenant
)

router = APIRouter(prefix="/api/candidates", tags=["Candidates"])

def _get_candidate_guarded(candidate_id: str, current_user: UserModel, db: Session) -> CandidateModel:
    cand = CandidateController.get_candidate_by_id(candidate_id, db)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, cand)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, cand, "candidate")
    return cand

@router.get("/pipeline-summary", response_model=PipelineStatsResponse)
def get_pipeline_summary(
    job_id: Optional[str] = None,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Authoritative database-driven pipeline summary and counts across all 4 independent dimensions:
    stage, assessment_status, interview_status, hiring_decision.
    Scoped strictly to the recruiter's organization and optional job filter.
    """
    return CandidateController.get_pipeline_summary(
        db,
        organization_id=current_user.organization_id,
        job_id=job_id
    )

@router.post("/bulk-action", response_model=BulkCandidateActionResponse)
def execute_bulk_action(
    payload: BulkCandidateActionRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Process batch candidate actions with atomic per-candidate validation,
    transition guards, tenant verification, and state audit history logging.
    """
    result, err = CandidateController.execute_bulk_action(
        payload=payload.dict(),
        changed_by=current_user.email,
        db=db,
        organization_id=current_user.organization_id
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return result

@router.get("/recruiter/update-timeline")
def get_recruiter_update_timeline(
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: lists candidates by expected update timeline
    (due today, due tomorrow, upcoming, overdue, completed, awaiting date) for recruiter's tenant.
    """
    return CandidateController.get_update_timeline(db, organization_id=current_user.organization_id)

@router.get("", response_model=List[CandidateResponse])
def get_candidates(
    skip: int = 0,
    limit: int = 100,
    job_id: Optional[str] = None,
    stage: Optional[str] = None,
    assessment_status: Optional[str] = None,
    interview_status: Optional[str] = None,
    hiring_decision: Optional[str] = None,
    compensation_status: Optional[str] = None,
    min_expected_ctc: Optional[float] = None,
    max_expected_ctc: Optional[float] = None,
    q: Optional[str] = None,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: lists all candidate records with hiring telemetry, compensation analysis, and query filtering for recruiter's tenant."""
    return CandidateController.get_all_candidates(
        db,
        skip=skip,
        limit=limit,
        job_id=job_id,
        stage=stage,
        assessment_status=assessment_status,
        interview_status=interview_status,
        hiring_decision=hiring_decision,
        compensation_status=compensation_status,
        min_expected_ctc=min_expected_ctc,
        max_expected_ctc=max_expected_ctc,
        q=q,
        organization_id=current_user.organization_id
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
    Recruiters have full visibility within their tenant. Candidates may only view their own record.
    """
    cand = _get_candidate_guarded(candidate_id, current_user, db)
    
    if current_user.role == "candidate":
        # Scrub private internal recruiter scores, notes, and compensation analysis for candidate view
        db.expunge(cand)
        cand.match_score = 0
        cand.recruiter_score = None
        cand.coding_score = None
        cand.match_details = None
        cand.compensation_analysis = None
        cand.hr_notes = None
        cand.rejection_reason = None
        cand.rejection_category = None

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
        status_code = status.HTTP_404_NOT_FOUND if err == "Job not found" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=err)
    return cand

@router.patch("/{candidate_id}/status")
def update_status(candidate_id: str, payload: CandidateStatusUpdate, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: update hiring pipeline stage, notes, or score."""
    _get_candidate_guarded(candidate_id, current_user, db)
    success = CandidateController.update_status(candidate_id, payload, db, organization_id=current_user.organization_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": f"Candidate {candidate_id} status updated to {payload.status}"}

@router.post("/{candidate_id}/schedule", response_model=CandidateResponse)
def schedule_interview(candidate_id: str, payload: CandidateScheduleRequest, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: schedule interview slot and advance candidate to assessment."""
    _get_candidate_guarded(candidate_id, current_user, db)
    cand, err = CandidateController.schedule_interview(candidate_id, payload, db)
    if err:
        raise HTTPException(status_code=404, detail=err)
    return cand

@router.post("/{candidate_id}/send-email")
def send_email(candidate_id: str, payload: EmailSendRequest, current_user: UserModel = Depends(require_recruiter), db: Session = Depends(get_db)):
    """Recruiter-only: dispatch candidate interview and offer emails."""
    _get_candidate_guarded(candidate_id, current_user, db)
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
    _get_candidate_guarded(candidate_id, current_user, db)
    cand, err = CandidateController.invite_assessment(
        candidate_id=candidate_id,
        custom_message=payload.custom_message,
        changed_by=current_user.email,
        db=db,
        organization_id=current_user.organization_id
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return cand

@router.post("/{candidate_id}/expected-update-date", response_model=CandidateResponse)
def set_expected_update_date(
    candidate_id: str,
    payload: ExpectedUpdateDateRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: sets the post-interview expected update date.
    Stores timeline state, resets reminder flags, and informs candidate.
    """
    _get_candidate_guarded(candidate_id, current_user, db)
    cand, err = CandidateController.set_expected_update_date(
        candidate_id=candidate_id,
        expected_update_date=payload.expected_update_date,
        update_notes=payload.update_notes or "",
        notify_candidate=payload.notify_candidate if payload.notify_candidate is not None else True,
        db=db
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return cand

@router.post("/{candidate_id}/send-recruiter-update", response_model=CandidateResponse)
def send_recruiter_update(
    candidate_id: str,
    payload: CandidateUpdateNotificationRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: dispatches an active status/decision update communication to the candidate.
    Updates candidate timeline state to 'update_sent' and stops future reminders.
    """
    _get_candidate_guarded(candidate_id, current_user, db)
    cand, err = CandidateController.send_recruiter_update(
        candidate_id=candidate_id,
        message=payload.message,
        timeline_status=payload.timeline_status or "update_sent",
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
    _get_candidate_guarded(candidate_id, current_user, db)
    cand, err = CandidateController.update_stage(
        candidate_id=candidate_id,
        new_stage=payload.stage,
        notes=payload.notes or "",
        changed_by=current_user.email,
        db=db,
        organization_id=current_user.organization_id
    )
    if err:
        raise HTTPException(status_code=400, detail=err)
    return cand

@router.get("/{candidate_id}/decision-context", response_model=CandidateDecisionContextResponse)
def get_candidate_decision_context(
    candidate_id: str,
    job_id: Optional[str] = Query(None, description="Optional target requisition ID"),
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Retrieve authoritative, evidence-backed decision context for candidate."""
    _get_candidate_guarded(candidate_id, current_user, db)
    return CandidateDecisionService.get_decision_context(
        candidate_id=candidate_id,
        job_id=job_id,
        db=db,
        current_user=current_user
    )

@router.get("/{candidate_id}/decision-history", response_model=List[DecisionHistoryItem])
def get_candidate_decision_history(
    candidate_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Retrieve immutable decision audit history ledger for candidate."""
    _get_candidate_guarded(candidate_id, current_user, db)
    return CandidateDecisionService.get_decision_history(
        candidate_id=candidate_id,
        db=db,
        current_user=current_user
    )

@router.patch("/{candidate_id}/decision", response_model=CandidateResponse)
def update_decision(
    candidate_id: str,
    payload: HiringDecisionUpdate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter-only: Record evidence-based hiring decision without regressing pipeline stage."""
    _get_candidate_guarded(candidate_id, current_user, db)
    return CandidateDecisionService.record_decision(
        candidate_id=candidate_id,
        payload=payload,
        db=db,
        current_user=current_user
    )

@router.post("/{candidate_id}/reopen", response_model=CandidateResponse)
def reopen_application(
    candidate_id: str,
    payload: CandidateReopenRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Controlled, audited application reopening for finalized candidates.
    Requires minimum 10-character reason, resets final decision to 'undecided', moves stage to 'review',
    and logs audit history.
    """
    _get_candidate_guarded(candidate_id, current_user, db)
    cand, err = CandidateController.reopen_application(
        candidate_id=candidate_id,
        reason=payload.reason,
        changed_by=current_user.email,
        db=db,
        organization_id=current_user.organization_id
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
    _get_candidate_guarded(candidate_id, current_user, db)
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
        # Validate allowed resume extensions
        allowed_exts = (".pdf", ".docx", ".doc", ".txt")
        ext = os.path.splitext(filename)[1].lower()
        if not ext or ext not in allowed_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file extension '{ext}'. Only .pdf, .docx, and .txt files are accepted for resume parsing."
            )

        # Read with size boundary guard
        file_bytes = await file.read(MAX_RESUME_BYTES + 1)
        if len(file_bytes) > MAX_RESUME_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Resume file exceeds the maximum allowed limit of 10MB."
            )
        # Validate magic bytes for PDF format
        if ext == ".pdf" and not file_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file format. The file is corrupted or not a valid PDF document."
            )

    res = CandidateController.parse_resume_content(file_bytes=file_bytes, filename=filename, raw_text=raw_text)
    return res


@router.get("/{candidate_id}/jobs/{job_id}/scorecard", response_model=CandidateScorecardResponse)
def get_candidate_job_scorecard(
    candidate_id: str,
    job_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Phase 4E.7: Evidence-Based Candidate Scorecard contextual to Candidate + Job.
    Derived exclusively from persisted database requirements and platform evidence.
    Enforces multi-tenant isolation and BOLA/IDOR protection.
    """
    try:
        return CandidateScorecardService.get_scorecard(
            candidate_id=candidate_id,
            job_id=job_id,
            db=db,
            current_user=current_user
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate scorecard: {str(e)}")


@router.get("/{candidate_id}/scorecard", response_model=CandidateScorecardResponse)
def get_candidate_default_scorecard(
    candidate_id: str,
    job_id: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Convenience endpoint: Resolves scorecard for candidate's active applied job if job_id not provided.
    """
    cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    target_job_id = job_id or cand.job_id
    if not target_job_id:
        raise HTTPException(status_code=400, detail="Candidate does not have an associated job_id and none was provided")

    try:
        return CandidateScorecardService.get_scorecard(
            candidate_id=candidate_id,
            job_id=target_job_id,
            db=db,
            current_user=current_user
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate scorecard: {str(e)}")


# ─── Phase 4E.8: Evidence-Based Candidate Comparison Endpoints ─────────────────

@router.post("/compare", response_model=CandidateComparisonResponse)
def compare_candidates_endpoint(
    payload: CandidateComparisonRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Compares 2 or more candidates side-by-side against a specific job opening.
    Enforces multi-tenant organization boundary and job association.
    Produces deterministic, evidence-backed candidate ranking, gaps, and skill matrix.
    """
    try:
        return CandidateScorecardService.compare_candidates(
            job_id=payload.job_id,
            candidate_ids=payload.candidate_ids,
            db=db,
            current_user=current_user
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison evaluation failed: {str(e)}")


@router.get("/compare/jobs/{job_id}", response_model=CandidateComparisonResponse)
def compare_candidates_by_job_get(
    job_id: str,
    candidate_ids: List[str] = Query(..., description="List of candidate IDs to compare"),
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Convenience GET endpoint for candidate comparison.
    """
    payload = CandidateComparisonRequest(job_id=job_id, candidate_ids=candidate_ids)
    return compare_candidates_endpoint(payload=payload, current_user=current_user, db=db)


