"""
(V) Assessment Views - HTTP Endpoints for 4-Category Technical Assessments
Protected by Role-Based Access Control and strict ownership verification.
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    CodeRunRequest, CodeRunResponse, AssessmentSubmitRequest, AssessmentSubmitResponse,
    AssessmentBuilderCreate, AssessmentBuilderUpdate, AssessmentQuestionAttachRequest,
    AssessmentQuestionReorderRequest, QuestionAutoSelectRequest, QuestionCreateUnified
)
from controllers.assessment_controller import AssessmentController
from ai_engine import generate_studio_assessment_config

from auth_dependencies import (
    get_current_user, get_optional_current_user, require_recruiter,
    verify_candidate_ownership, verify_recruiter_tenant
)
from models.db_models import UserModel, CandidateModel, JobModel

router = APIRouter(prefix="/api/assessment", tags=["Technical Assessment"])

# ─── 1. Static Infrastructure & Studio Configuration Endpoints ───────────────

@router.get("/supported-languages")
def get_supported_languages():
    """
    Authoritative source of available programming languages genuinely supported
    by the backend execution sandbox and Judge0 infrastructure.
    Publicly accessible so Monaco editor and preview modes can inspect language capabilities.
    """
    from models.db_models import SUPPORTED_LANGUAGES_REGISTRY
    catalog = []
    for lang_id, meta in SUPPORTED_LANGUAGES_REGISTRY.items():
        catalog.append({
            "id": lang_id,
            "label": meta["label"],
            "version": f"Judge0 CE (ID: {meta['judge0_id']})",
            "monaco_lang": meta["monaco_lang"],
            "executable": meta.get("is_executable", True),
            "engine": meta.get("engine", "Judge0 Execution Engine"),
            "ext": meta["ext"],
            "starter_code": meta.get("starter_template", "")
        })
    return catalog


@router.get("/studio/job/{job_id}")
def get_studio_config_for_job(
    job_id: str,
    mcq_count: int = 5,
    interview_q_count: int = 3,
    difficulty: Optional[str] = "Mid-Level",
    force_refresh: bool = False,
    _t: Optional[str] = None,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Generate a domain-appropriate Assessment Studio configuration for a recruiter.
    Uses real job data (title, department, description, skills) to determine what
    evaluation methods and competencies are appropriate. Recruiter controls question counts.
    Enforces tenant isolation: recruiter may only generate studio for their organization's jobs.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    verify_recruiter_tenant(current_user, job, "job")

    config = generate_studio_assessment_config(
        job_title=job.title,
        department=job.department or "Engineering",
        job_description=job.description or "",
        required_skills=job.required_skills or [],
        job_id=job.id,
        mcq_count=mcq_count,
        interview_q_count=interview_q_count,
        difficulty=difficulty or (job.coding_difficulty or "Mid-Level"),
        force_refresh=force_refresh
    )
    return config


@router.post("/run-code", response_model=CodeRunResponse)
def run_code(
    payload: CodeRunRequest,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Execute Python, JS, SQL code in isolated sandbox."""
    if payload.candidate_id:
        if payload.candidate_id in ["preview", "recruiter-preview", "demo-recruiter-preview"]:
            if current_user and current_user.role == "recruiter" and payload.job_id:
                job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
                if job:
                    verify_recruiter_tenant(current_user, job, "job")
        else:
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required. Missing Bearer token.")
            cand = db.query(CandidateModel).filter(
                (CandidateModel.id == payload.candidate_id) |
                (CandidateModel.user_id == payload.candidate_id)
            ).first()
            if not cand and current_user.role == "candidate":
                cand = db.query(CandidateModel).filter(
                    (CandidateModel.user_id == current_user.id) |
                    (CandidateModel.email == current_user.email)
                ).first()
            if not cand and current_user.role == "recruiter":
                if payload.job_id:
                    job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
                    if job:
                        verify_recruiter_tenant(current_user, job, "job")
            elif not cand:
                raise HTTPException(status_code=404, detail="Candidate not found")
            elif current_user.role == "candidate":
                verify_candidate_ownership(current_user, cand)
            elif current_user.role == "recruiter":
                verify_recruiter_tenant(current_user, cand, "candidate")
    elif not current_user:
        raise HTTPException(status_code=401, detail="Authentication required. Missing Bearer token.")
    return AssessmentController.run_code_sandbox(payload, db)


# ─── 2. External Coding Platform Integration Endpoints ─────────────────────
# (Must be registered BEFORE wildcard /{candidate_id} to prevent path hijacking)

@router.get("/external/platforms")
def get_external_platforms(current_user: UserModel = Depends(get_current_user)):
    """List supported external coding assessment platforms and configuration status."""
    from services.external_assessment import ExternalAssessmentService
    return ExternalAssessmentService.get_configured_platforms()


@router.get("/external/questions")
def search_external_questions(
    platform: str = "hackerrank",
    query: str = "",
    difficulty: str = "",
    limit: int = 100,
    current_user: UserModel = Depends(get_current_user)
):
    """Search/browse question catalog from external coding platforms."""
    from services.external_assessment import ExternalAssessmentService
    return ExternalAssessmentService.search_questions(platform=platform, query=query, difficulty=difficulty, limit=limit)


@router.post("/external/create")
def create_external_assessment(
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter creates an external coding assessment session (HackerRank, LeetCode, CodeSignal)
    for a specific candidate.
    """
    from services.external_assessment import ExternalAssessmentService

    candidate_id = payload.get("candidate_id")
    platform = payload.get("platform", "hackerrank")
    job_id = payload.get("job_id")
    question_ids = payload.get("question_ids", [])

    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id is required")

    cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    verify_recruiter_tenant(current_user, cand, "candidate")

    job = db.query(JobModel).filter(JobModel.id == (job_id or cand.job_id)).first()
    job_title = job.title if job else (cand.job_title if hasattr(cand, "job_title") else "Applied Role")

    session_info = ExternalAssessmentService.create_candidate_assessment(
        platform=platform,
        candidate_id=candidate_id,
        candidate_email=cand.email,
        candidate_name=cand.name,
        job_title=job_title,
        question_ids=question_ids
    )

    if not session_info.get("success"):
        raise HTTPException(status_code=400, detail=session_info.get("error", "Failed to create external assessment"))

    cand.external_assessment_platform = platform
    cand.external_assessment_id = session_info.get("test_id")
    cand.external_assessment_url = session_info.get("invite_url")
    cand.external_assessment_result = session_info
    cand.assessment_status = "invited"
    db.commit()

    return session_info


@router.post("/external/{candidate_id}/sync")
def sync_external_assessment_result(
    candidate_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Synchronizes genuine verified score from external platform (e.g. HackerRank Work API).
    """
    from services.external_assessment import ExternalAssessmentService

    cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    verify_recruiter_tenant(current_user, cand, "candidate")

    if not cand.external_assessment_platform:
        raise HTTPException(status_code=400, detail="Candidate does not have an external assessment configured")

    res = ExternalAssessmentService.sync_candidate_result(
        platform=cand.external_assessment_platform,
        test_id=cand.external_assessment_id or "",
        candidate_email=cand.email
    )

    cand.external_assessment_result = res
    cand.external_assessment_synced_at = datetime.utcnow()

    # If score is completed, reflect in coding_score
    if res.get("score") is not None:
        cand.coding_score = int(res["score"])
        cand.assessment_status = "evaluated"

    db.commit()
    return {"success": True, "result": res}


@router.get("/external/{candidate_id}/result")
def get_external_assessment_result(
    candidate_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get stored external assessment result for candidate. Enforces ownership for candidates and tenant isolation for recruiters."""
    cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, cand)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, cand, "candidate")

    return {
        "platform": cand.external_assessment_platform,
        "test_id": cand.external_assessment_id,
        "url": cand.external_assessment_url,
        "result": cand.external_assessment_result,
        "synced_at": cand.external_assessment_synced_at.isoformat() if cand.external_assessment_synced_at else None
    }


# ─── 2.5 Coding Problem Bank & Recruiter Authoring Endpoints ────────────────

@router.get("/problems/languages")
def get_supported_coding_languages():
    """Return registry of supported languages with starter templates."""
    return AssessmentController.get_supported_coding_languages()


@router.get("/problems")
def list_coding_problems(
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    execution_mode: Optional[str] = None,
    is_system: Optional[bool] = None,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """List coding problems with multi-tenant filtering, search, and public test cases."""
    return AssessmentController.list_coding_problems(
        db=db,
        current_user=current_user,
        difficulty=difficulty,
        search=search,
        execution_mode=execution_mode,
        is_system=is_system
    )


@router.post("/problems", status_code=201)
def create_coding_problem(
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter authors a custom coding problem with tenant isolation, initial snapshot, and test cases."""
    res, err, status_code = AssessmentController.create_coding_problem(
        db=db,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.get("/problems/{problem_id}")
def get_coding_problem(
    problem_id: str,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Get coding problem details with version history and confidential test case protection."""
    res, err, status_code = AssessmentController.get_coding_problem(
        db=db,
        problem_id=problem_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.put("/problems/{problem_id}")
def update_coding_problem(
    problem_id: str,
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Update custom coding problem, generating immutable version snapshot."""
    res, err, status_code = AssessmentController.update_coding_problem(
        db=db,
        problem_id=problem_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.delete("/problems/{problem_id}")
def delete_coding_problem(
    problem_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Soft delete custom coding problem enforcing tenant boundaries."""
    success, err, status_code = AssessmentController.delete_coding_problem(
        db=db,
        problem_id=problem_id,
        current_user=current_user
    )
    if not success:
        raise HTTPException(status_code=status_code, detail=err)
    return {"success": True, "message": err}


@router.get("/{assessment_id}/coding-problems")
def get_assessment_coding_problems(
    assessment_id: str,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Fetch attached coding problems for an assessment or job."""
    res, err, status_code = AssessmentController.get_assessment_coding_problems(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/{assessment_id}/coding-problems")
def attach_assessment_coding_problems(
    assessment_id: str,
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Attach and order multiple coding problems to an assessment."""
    problems_list = payload.get("problems", [])
    res, err, status_code = AssessmentController.attach_assessment_coding_problems(
        db=db,
        assessment_id=assessment_id,
        problems_payload=problems_list,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


# ═════════════════════════════════════════════════════════════════════════════
# PHASE 4E.5: ADVANCED ASSESSMENT BUILDER ENDPOINTS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/builder/assessments")
def list_builder_assessments(
    job_id: Optional[str] = None,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """List recruiter's assessments filtered by job and multi-tenant boundary."""
    res, err, status_code = AssessmentController.list_builder_assessments(
        db=db,
        current_user=current_user,
        job_id=job_id
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/builder/assessments")
def create_builder_assessment(
    payload: AssessmentBuilderCreate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Create a new draft assessment for a job."""
    res, err, status_code = AssessmentController.create_builder_assessment(
        db=db,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.get("/builder/assessments/{assessment_id}")
def get_builder_assessment(
    assessment_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Get full assessment configuration, attached questions, and validation state."""
    res, err, status_code = AssessmentController.get_builder_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.put("/builder/assessments/{assessment_id}")
def update_builder_assessment(
    assessment_id: str,
    payload: AssessmentBuilderUpdate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Update settings for an assessment draft."""
    res, err, status_code = AssessmentController.update_builder_assessment(
        db=db,
        assessment_id=assessment_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/builder/assessments/{assessment_id}/questions")
def attach_builder_question(
    assessment_id: str,
    payload: AssessmentQuestionAttachRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Attach an MCQ or coding question to the assessment."""
    res, err, status_code = AssessmentController.attach_builder_question(
        db=db,
        assessment_id=assessment_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.delete("/builder/assessments/{assessment_id}/questions/{question_type}/{question_id}")
def remove_builder_question(
    assessment_id: str,
    question_type: str,
    question_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Remove a question association from the assessment."""
    res, err, status_code = AssessmentController.remove_builder_question(
        db=db,
        assessment_id=assessment_id,
        question_type=question_type,
        question_id=question_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.put("/builder/assessments/{assessment_id}/questions/reorder")
def reorder_builder_questions(
    assessment_id: str,
    payload: AssessmentQuestionReorderRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Reorder and adjust point weights of attached questions."""
    res, err, status_code = AssessmentController.reorder_builder_questions(
        db=db,
        assessment_id=assessment_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/builder/assessments/{assessment_id}/auto-select")
def auto_select_builder_questions(
    assessment_id: str,
    payload: QuestionAutoSelectRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Rule-based question auto-selection from authoritative DB question bank."""
    res, err, status_code = AssessmentController.auto_select_builder_questions(
        db=db,
        assessment_id=assessment_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/builder/assessments/{assessment_id}/validate")
def validate_builder_assessment(
    assessment_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Run full validation checks against assessment configuration."""
    res, err, status_code = AssessmentController.validate_builder_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/builder/assessments/{assessment_id}/publish")
def publish_builder_assessment(
    assessment_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Validate, create immutable version snapshot, and publish assessment."""
    res, err, status_code = AssessmentController.publish_builder_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/builder/assessments/{assessment_id}/archive")
def archive_builder_assessment(
    assessment_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Archive assessment so no new candidates can be assigned."""
    res, err, status_code = AssessmentController.archive_builder_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.get("/builder/assessments/{assessment_id}/preview")
def preview_builder_assessment(
    assessment_id: str,
    as_candidate: bool = False,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Preview assessment with recruiter solutions or sanitized candidate perspective."""
    res, err, status_code = AssessmentController.preview_builder_assessment(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user,
        as_candidate=as_candidate
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.get("/questions")
def list_unified_question_bank(
    question_type: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Query unified question repository (MCQs & Coding) across tenant and system libraries."""
    res, err, status_code = AssessmentController.list_unified_question_bank(
        db=db,
        current_user=current_user,
        question_type=question_type,
        difficulty=difficulty,
        category=category,
        skill=skill,
        search=search
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/questions", status_code=201)
def create_unified_question(
    payload: QuestionCreateUnified,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Author a new question (MCQ or Coding) with relational skill linking."""
    res, err, status_code = AssessmentController.create_unified_question(
        db=db,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


# ─── 3. Candidate Assessment Session Endpoints (Wildcards) ───────────────────

@router.get("/{candidate_id}")
def get_assessment(
    candidate_id: str,
    job_id: str = None,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate & Recruiter access to tailored 4-category challenge bundle.
    Verifies candidate resource ownership: candidates can only fetch their own assessment.
    Recruiters can preview role assessments via preview IDs without authentication blocks.
    """
    is_recruiter = (current_user and current_user.role == "recruiter")
    is_preview = candidate_id in ["preview", "recruiter-preview", "demo-recruiter-preview"]

    if is_preview:
        if is_recruiter and job_id:
            job = db.query(JobModel).filter(JobModel.id == job_id).first()
            if job:
                verify_recruiter_tenant(current_user, job, "job")
        res, err = AssessmentController.get_candidate_assessment(candidate_id, job_id, db, is_recruiter=True)
        if err:
            raise HTTPException(status_code=404, detail=err)
        return res

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Missing Bearer token."
        )

    cand = db.query(CandidateModel).filter(
        (CandidateModel.id == candidate_id) |
        (CandidateModel.user_id == candidate_id)
    ).first()
    if not cand and current_user.role == "candidate":
        cand = db.query(CandidateModel).filter(
            (CandidateModel.user_id == current_user.id) |
            (CandidateModel.email == current_user.email)
        ).first()
    if not cand and is_recruiter:
        res, err = AssessmentController.get_candidate_assessment("recruiter-preview", job_id, db, is_recruiter=True)
        if err:
            raise HTTPException(status_code=404, detail=err)
        return res
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate record not found")
    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, cand)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, cand, "candidate")

    res, err = AssessmentController.get_candidate_assessment(candidate_id, job_id, db, is_recruiter=is_recruiter)
    if err:
        status_code = 403 if ("restricted" in err.lower() or "screening" in err.lower() or "draft" in err.lower()) else 404
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/{candidate_id}/start")
def start_assessment(
    candidate_id: str,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate starts assessment session.
    Transitions assessment_status from invited to in_progress.
    """
    if candidate_id in ["preview", "recruiter-preview", "demo-recruiter-preview"]:
        return {"success": True, "message": "Preview assessment started"}

    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Missing Bearer token."
        )

    cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate record not found")
    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, cand)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, cand, "candidate")

    success, err = AssessmentController.start_assessment(candidate_id, db)
    if not success:
        raise HTTPException(status_code=400, detail=err)
    return {"success": True, "message": "Assessment started"}


@router.post("/{candidate_id}/submit", response_model=AssessmentSubmitResponse)
def submit_assessment(
    candidate_id: str,
    payload: AssessmentSubmitRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit candidate assessment bundle.
    Verifies candidate resource ownership and recruiter scheduling authorization.
    """
    cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate record not found")
    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, cand)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, cand, "candidate")

    res, err = AssessmentController.submit_candidate_assessment(candidate_id, payload, db)
    if err:
        status_code = 403 if ("restricted" in err.lower() or "screening" in err.lower() or "already" in err.lower()) else 404
        raise HTTPException(status_code=status_code, detail=err)
    return res


# ═════════════════════════════════════════════════════════════════════════════
# ADVANCED MCQ QUESTION BANK & AUTHORING ROUTES (PHASE 4B.2)
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/mcq-questions")
def list_mcq_questions(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    skill: Optional[str] = None,
    is_system: Optional[bool] = None,
    is_active: Optional[bool] = None,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """List MCQ questions with multi-tenant filtering, search, category, and skill filters."""
    return AssessmentController.list_mcq_questions(
        db=db,
        current_user=current_user,
        category=category,
        difficulty=difficulty,
        search=search,
        skill=skill,
        is_system=is_system,
        is_active=is_active
    )


@router.post("/mcq-questions", status_code=201)
def create_mcq_question(
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter authors a custom MCQ question with options, correct answer, and tenant isolation."""
    res, err, status_code = AssessmentController.create_mcq_question(
        db=db,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.get("/mcq-questions/{question_id}")
def get_mcq_question(
    question_id: str,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Get single MCQ question details with options and tenant protection."""
    res, err, status_code = AssessmentController.get_mcq_question(
        db=db,
        question_id=question_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.put("/mcq-questions/{question_id}")
def update_mcq_question(
    question_id: str,
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Update custom MCQ question enforcing tenant ownership."""
    res, err, status_code = AssessmentController.update_mcq_question(
        db=db,
        question_id=question_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.delete("/mcq-questions/{question_id}")
def delete_mcq_question(
    question_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Soft delete / archive custom MCQ question enforcing tenant boundaries."""
    success, err, status_code = AssessmentController.delete_mcq_question(
        db=db,
        question_id=question_id,
        current_user=current_user
    )
    if not success:
        raise HTTPException(status_code=status_code, detail=err)
    return {"success": True, "message": err}


@router.get("/{assessment_id}/mcqs")
def get_assessment_mcqs(
    assessment_id: str,
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Fetch attached MCQs for an assessment or job."""
    res, err, status_code = AssessmentController.get_assessment_mcqs(
        db=db,
        assessment_id=assessment_id,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


@router.post("/{assessment_id}/mcqs")
def attach_assessment_mcqs(
    assessment_id: str,
    payload: dict,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Attach database-backed MCQs to an assessment with ordering and weights."""
    res, err, status_code = AssessmentController.attach_assessment_mcqs(
        db=db,
        assessment_id=assessment_id,
        payload=payload,
        current_user=current_user
    )
    if err:
        raise HTTPException(status_code=status_code, detail=err)
    return res


