"""
(V) Skill Views - HTTP REST Endpoints for Canonical Skills, Job Requirements, and Candidate Skills.
Protected by Role-Based Access Control and strict Multi-Tenant Organization Isolation.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from database import get_db
from models.db_models import SkillModel, SkillAliasModel, CandidateModel, JobModel, UserModel, CandidateSkillModel
from schemas import (
    SkillResponse, SkillCreate, CandidateSkillItem,
    JobSkillRequirementItem, CandidateSkillsSyncRequest, JobSkillRequirementsSyncRequest,
    SkillEvidenceItem, SkillEvidenceCreate, SkillAliasCreate, SkillAliasResponse,
    CandidateJobMatchResponse, BatchJobCandidateMatchResponse,
    CandidateComparisonRequest, CandidateComparisonResponse,
    CandidateSkillPassportResponse, ManualSkillVerificationRequest
)
from services.skill_service import SkillService, slugify_skill_name
from services.skill_matching_service import SkillMatchingService
from services.skill_passport_service import SkillPassportService
from auth_dependencies import (
    get_current_user, require_recruiter, get_optional_current_user,
    verify_candidate_ownership, verify_recruiter_tenant
)

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.get("", response_model=List[SkillResponse])
def get_canonical_skills(
    q: Optional[str] = Query(None, description="Search query across skill name or slug"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Public/authenticated lookup for canonical skills.
    Powers recruiter autocomplete, job skill tagging, and candidate profile tagging.
    """
    query = db.query(SkillModel).filter(SkillModel.is_active == True)
    if category and category.strip():
        query = query.filter(func.lower(SkillModel.category) == category.strip().lower())
    if q and q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(SkillModel.name).ilike(term),
                SkillModel.slug.ilike(term)
            )
        )
    return query.order_by(SkillModel.name.asc()).limit(limit).all()


@router.post("", response_model=SkillResponse)
def create_skill(
    payload: SkillCreate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Creates a canonical skill or returns existing if already registered.
    Prevents duplicate skills and normalizes slugs deterministically.
    """
    skill, _ = SkillService.get_or_create_skill(
        raw_name=payload.name,
        db=db,
        category=payload.category,
        description=payload.description
    )
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/candidates/{candidate_id}", response_model=List[CandidateSkillItem])
def get_candidate_skills(
    candidate_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the authoritative relational skills and evidence for a candidate application.
    Enforces resource ownership: candidate may only view their own; recruiter restricted to tenant.
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, candidate)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, candidate, "candidate")

    return SkillService.get_candidate_skills_detailed(candidate_id, db)


@router.put("/candidates/{candidate_id}", response_model=List[CandidateSkillItem])
def sync_candidate_skills(
    candidate_id: str,
    payload: CandidateSkillsSyncRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes candidate skills into the relational CandidateSkillModel table.
    Enforces resource ownership.
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, candidate)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, candidate, "candidate")

    SkillService.sync_candidate_skills(candidate_id, payload.skills, db)
    db.commit()
    return SkillService.get_candidate_skills_detailed(candidate_id, db)


@router.get("/jobs/{job_id}", response_model=List[JobSkillRequirementItem])
def get_job_skill_requirements(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetches authoritative relational skill requirements for a job opening.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return SkillService.get_job_skill_requirements_detailed(job_id, db)


@router.put("/jobs/{job_id}", response_model=List[JobSkillRequirementItem])
def sync_job_skill_requirements(
    job_id: str,
    payload: JobSkillRequirementsSyncRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Synchronizes a job's required skills with requirement types and weights.
    Enforces tenant isolation: recruiter must belong to job's organization.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    verify_recruiter_tenant(current_user, job, "job")

    SkillService.sync_job_skill_requirements(
        job_id=job_id,
        raw_skills=payload.skills,
        db=db,
        requirement_types=payload.requirement_types,
        weights=payload.weights
    )
    db.commit()
    return SkillService.get_job_skill_requirements_detailed(job_id, db)


@router.get("/categories", response_model=List[str])
def get_skill_categories(
    db: Session = Depends(get_db)
):
    """Returns list of distinct skill categories registered in the database."""
    cats = (
        db.query(SkillModel.category)
        .filter(SkillModel.category.isnot(None), SkillModel.category != "")
        .distinct()
        .order_by(SkillModel.category.asc())
        .all()
    )
    return [c[0] for c in cats if c[0]]


@router.post("/candidates/{candidate_id}/skills/{candidate_skill_id}/evidence", response_model=SkillEvidenceItem)
def add_skill_evidence(
    candidate_id: str,
    candidate_skill_id: str,
    payload: SkillEvidenceCreate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Attaches verified evidence (coding problem submission, MCQ, interview)
    to a candidate skill. Automatically updates candidate_skill.is_verified to True.
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    verify_recruiter_tenant(current_user, candidate, "candidate")

    cand_skill = db.query(CandidateSkillModel).filter(
        CandidateSkillModel.id == candidate_skill_id,
        CandidateSkillModel.candidate_id == candidate_id
    ).first()
    if not cand_skill:
        raise HTTPException(status_code=404, detail="Candidate skill association not found")

    evidence = SkillService.add_skill_evidence(
        candidate_skill_id=candidate_skill_id,
        evidence_type=payload.evidence_type,
        db=db,
        reference_id=payload.reference_id,
        score_contribution=payload.score_contribution or 0.0,
        snippet=payload.snippet
    )
    db.commit()
    return {
        "id": evidence.id,
        "evidence_type": evidence.evidence_type,
        "reference_id": evidence.reference_id,
        "score_contribution": evidence.score_contribution,
        "snippet": evidence.snippet,
        "created_at": evidence.created_at.isoformat() if evidence.created_at else None
    }


@router.get("/{skill_id}/aliases", response_model=List[SkillAliasResponse])
def get_skill_aliases(
    skill_id: str,
    db: Session = Depends(get_db)
):
    """Returns registered DB-backed aliases for a canonical skill."""
    skill = db.query(SkillModel).filter(SkillModel.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    aliases = db.query(SkillAliasModel).filter(SkillAliasModel.skill_id == skill_id).all()
    return aliases


@router.post("/{skill_id}/aliases", response_model=SkillAliasResponse)
def add_skill_alias(
    skill_id: str,
    payload: SkillAliasCreate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Registers a new DB-backed alias for a canonical skill.
    Prevents duplicates idempotently.
    """
    skill = db.query(SkillModel).filter(SkillModel.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    alias_record = SkillService.add_skill_alias(skill_id, payload.alias, db)
    db.commit()
    db.refresh(alias_record)
    return alias_record


# ─── Multi-Skill Matching & Evidence Verification Endpoints (Phase 4E.2) ───

@router.get("/match/candidate/{candidate_id}/job/{job_id}", response_model=CandidateJobMatchResponse)
def get_candidate_job_match(
    candidate_id: str,
    job_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes and returns the authoritative, deterministic multi-skill match breakdown
    between a candidate application and a specific job opening.
    Enforces RBAC and multi-tenant isolation.
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, candidate)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, candidate, "candidate")
        verify_recruiter_tenant(current_user, job, "job")

    try:
        return SkillMatchingService.match_candidate_to_job(
            candidate_id=candidate_id,
            job_id=job_id,
            db=db
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/match/candidate/{candidate_id}", response_model=CandidateJobMatchResponse)
def get_candidate_applied_job_match(
    candidate_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes match for a candidate against the specific job they applied to (candidate.job_id).
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if not candidate.job_id:
        raise HTTPException(status_code=400, detail="Candidate is not associated with a job opening")

    job = db.query(JobModel).filter(JobModel.id == candidate.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Associated job opening not found")

    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, candidate)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, candidate, "candidate")
        verify_recruiter_tenant(current_user, job, "job")

    return SkillMatchingService.match_candidate_to_job(
        candidate_id=candidate_id,
        job_id=candidate.job_id,
        db=db
    )


@router.get("/match/job/{job_id}/candidates", response_model=BatchJobCandidateMatchResponse)
def get_job_candidates_match(
    job_id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Evaluates all candidates for a job opening using the authoritative matching engine.
    Returns ranked candidates sorted deterministically by match score descending.
    Enforces multi-tenant organization boundary.
    """
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    verify_recruiter_tenant(current_user, job, "job")

    return SkillMatchingService.match_job_candidates(
        job_id=job_id,
        db=db,
        limit=limit
    )


# ─── Candidate Comparison Endpoints (Phase 4E.3) ──────────────────────────────

@router.post("/compare", response_model=CandidateComparisonResponse)
def compare_candidates(
    payload: CandidateComparisonRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Compares 2 or more candidates side-by-side against a specific job opening.
    Enforces multi-tenant organization boundary on both job and all candidates.
    Produces deterministic, evidence-backed candidate ranking, gaps, and skill matrix.
    """
    if not payload.candidate_ids or len(payload.candidate_ids) < 2:
        raise HTTPException(status_code=400, detail="Comparison requires at least 2 candidates")

    job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Enforce recruiter belongs to job organization
    verify_recruiter_tenant(current_user, job, "job")

    # Enforce recruiter belongs to organization of all submitted candidates
    candidates = db.query(CandidateModel).filter(CandidateModel.id.in_(payload.candidate_ids)).all()
    if len(candidates) < len(payload.candidate_ids):
        found_ids = {c.id for c in candidates}
        missing_ids = [cid for cid in payload.candidate_ids if cid not in found_ids]
        raise HTTPException(status_code=404, detail=f"Candidate(s) not found: {', '.join(missing_ids)}")

    for cand in candidates:
        verify_recruiter_tenant(current_user, cand, "candidate")
        if cand.job_id != payload.job_id:
            raise HTTPException(
                status_code=400,
                detail=f"Candidate '{cand.id}' does not belong to job '{payload.job_id}'"
            )

    try:
        return SkillMatchingService.compare_job_candidates(
            job_id=payload.job_id,
            candidate_ids=payload.candidate_ids,
            db=db
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison evaluation failed: {str(e)}")


@router.get("/compare/job/{job_id}", response_model=CandidateComparisonResponse)
def compare_job_candidates_get(
    job_id: str,
    candidate_ids: List[str] = Query(..., description="List of candidate IDs to compare"),
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Convenience GET endpoint for candidate comparison.
    """
    payload = CandidateComparisonRequest(job_id=job_id, candidate_ids=candidate_ids)
    return compare_candidates(payload=payload, current_user=current_user, db=db)


# ─── VERIFIED SKILL PASSPORT REST ENDPOINTS ───────────────────────────────────

@router.get("/passport/my-passport", response_model=CandidateSkillPassportResponse)
def get_my_skill_passport(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate-only: Fetches the authenticated candidate's own Verified Skill Passport.
    Resolves candidate record by authenticated user ID or email.
    """
    candidate = None
    if current_user.email:
        candidate = db.query(CandidateModel).filter(
            func.lower(CandidateModel.email) == current_user.email.strip().lower()
        ).order_by(CandidateModel.applied_date.desc()).first()

    if not candidate and current_user.id:
        candidate = db.query(CandidateModel).filter(
            CandidateModel.user_id == current_user.id
        ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="No candidate profile or application found for your account. Please submit an application to generate your Skill Passport."
        )

    try:
        return SkillPassportService.get_candidate_passport(candidate.id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Skill Passport: {str(e)}")


@router.get("/passport/{candidate_id}", response_model=CandidateSkillPassportResponse)
def get_candidate_skill_passport(
    candidate_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the authoritative Verified Skill Passport for a specific candidate.
    Protected by strict RBAC and multi-tenant isolation:
    - Candidate role: May ONLY access their own passport (BOLA/IDOR protection).
    - Recruiter role: May only access candidates within their organization.
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found")

    if current_user.role == "candidate":
        verify_candidate_ownership(current_user, candidate)
    elif current_user.role == "recruiter":
        verify_recruiter_tenant(current_user, candidate, "candidate")

    try:
        return SkillPassportService.get_candidate_passport(candidate_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Skill Passport: {str(e)}")


@router.post("/passport/{candidate_id}/verify/{candidate_skill_id}")
def verify_candidate_skill_manually(
    candidate_id: str,
    candidate_skill_id: str,
    payload: ManualSkillVerificationRequest,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """
    Recruiter-only: Attaches authoritative recruiter verification to a candidate skill.
    Enforces multi-tenant isolation: recruiter must belong to the candidate's organization.
    """
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found")

    verify_recruiter_tenant(current_user, candidate, "candidate")

    try:
        result = SkillPassportService.verify_candidate_skill_manually(
            candidate_id=candidate_id,
            candidate_skill_id=candidate_skill_id,
            notes=payload.notes or "Recruiter manual verification",
            score=payload.score or 100.0,
            recruiter=current_user,
            db=db
        )
        db.commit()
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Manual skill verification failed: {str(e)}")



