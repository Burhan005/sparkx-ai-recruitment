"""
(V) Resume Views - HTTP API Endpoints for AI Resume Studio.
Exposes real database-driven resume creation, editing, tailoring, versioning,
and grounded AI assistance for authenticated candidates.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import UserModel
from auth_dependencies import require_candidate
from schemas import (
    ResumeCreateRequest, ResumeUpdateRequest, ResumeResponse,
    ResumeAIAssistRequest, ResumeAIAssistResponse,
    ResumeMatchAnalysisRequest, ResumeMatchAnalysisResponse
)
from controllers.resume_controller import ResumeController

router = APIRouter(prefix="/api/resumes", tags=["AI Resume Studio"])


@router.get("", response_model=List[ResumeResponse])
def list_candidate_resumes(
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """List all saved resumes owned by the authenticated candidate."""
    return ResumeController.list_resumes(db, current_user)


@router.get("/init-from-profile")
def init_resume_from_profile(
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Generate a structured draft resume from the candidate's verified profile data."""
    return ResumeController.init_from_profile(db, current_user)


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_candidate_resume(
    payload: ResumeCreateRequest,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Create a new resume document in the database."""
    res, err, code = ResumeController.create_resume(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_candidate_resume(
    resume_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Retrieve a specific resume document, enforcing ownership server-side."""
    res, err, code = ResumeController.get_resume(db, resume_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.put("/{resume_id}", response_model=ResumeResponse)
def update_candidate_resume(
    resume_id: str,
    payload: ResumeUpdateRequest,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Update an existing resume or persist a versioned checkpoint."""
    res, err, code = ResumeController.update_resume(db, resume_id, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
def delete_candidate_resume(
    resume_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Delete a resume document owned by the candidate."""
    success, err, code = ResumeController.delete_resume(db, resume_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return {"success": True, "message": "Resume deleted successfully"}


@router.get("/{resume_id}/versions", response_model=List[ResumeResponse])
def get_resume_versions(
    resume_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """List all version checkpoints associated with this resume."""
    versions, err, code = ResumeController.list_versions(db, resume_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return versions


@router.post("/{resume_id}/sync-profile", status_code=status.HTTP_200_OK)
def sync_resume_to_candidate_profile(
    resume_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Sync resume contact info, summary, education, and skills to candidate's primary profile."""
    success, err, code = ResumeController.sync_to_profile(db, resume_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return {"success": True, "message": "Profile synced with resume data"}


@router.post("/ai-assist", response_model=ResumeAIAssistResponse)
def assist_resume_ai(
    payload: ResumeAIAssistRequest,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """
    Executes grounded AI resume refinement (wording, summary, keywords, tailoring, audit).
    Anti-hallucination guardrails enforced server-side.
    """
    res, err, code = ResumeController.ai_assist(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.get("/{resume_id}/export")
def export_candidate_resume(
    resume_id: str,
    format: str = Query("txt", pattern="^(txt|markdown|json)$"),
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Export the candidate's resume in formatted text, markdown, or JSON."""
    res, err, code = ResumeController.get_resume(db, resume_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)

    if format == "json":
        return JSONResponse(content=res)

    # Format text / markdown
    lines = []
    contact = res.get("contact_info", {})
    full_name = contact.get("full_name") or current_user.name
    lines.append(f"# {full_name}")
    if contact.get("headline"):
        lines.append(f"**{contact['headline']}**")
    
    contact_parts = [p for p in [contact.get("email"), contact.get("phone"), contact.get("location")] if p]
    if contact_parts:
        lines.append(" | ".join(contact_parts))
    lines.append("")

    if res.get("summary"):
        lines.append("## Professional Summary")
        lines.append(res["summary"])
        lines.append("")

    if res.get("skills"):
        lines.append("## Core Skills")
        lines.append(", ".join(res["skills"]))
        lines.append("")

    if res.get("experience"):
        lines.append("## Professional Experience")
        for pos in res["experience"]:
            title = pos.get("title", "")
            comp = pos.get("company", "")
            dates = f"{pos.get('start_date', '')} - {pos.get('end_date', 'Present')}"
            lines.append(f"### {title} - {comp} ({dates})")
            if pos.get("location"):
                lines.append(f"*{pos['location']}*")
            for b in pos.get("bullets", []):
                lines.append(f"- {b}")
            lines.append("")

    if res.get("education"):
        lines.append("## Education")
        for edu in res["education"]:
            deg = edu.get("degree", "")
            inst = edu.get("institution", "")
            yr = edu.get("graduation_year", "")
            lines.append(f"- **{deg}**, {inst} ({yr})")
        lines.append("")

    if res.get("projects"):
        lines.append("## Projects")
        for proj in res["projects"]:
            lines.append(f"### {proj.get('name', '')}")
            if proj.get("description"):
                lines.append(proj["description"])
            for b in proj.get("bullets", []):
                lines.append(f"- {b}")
            lines.append("")

    if res.get("certifications"):
        lines.append("## Certifications")
        for cert in res["certifications"]:
            lines.append(f"- **{cert.get('name', '')}** - {cert.get('issuer', '')} ({cert.get('issue_date', '')})")
        lines.append("")

    if res.get("languages"):
        lines.append("## Languages")
        lang_strs = [f"{l.get('language', '')} ({l.get('proficiency', 'Proficient')})" for l in res["languages"] if l.get('language')]
        if lang_strs:
            lines.append(", ".join(lang_strs))
            lines.append("")

    if res.get("awards"):
        lines.append("## Awards & Honors")
        for award in res["awards"]:
            title = award.get("title", "")
            issuer = award.get("issuer", "")
            dt = award.get("date", "")
            lines.append(f"- **{title}** - {issuer} ({dt})" if dt else f"- **{title}** - {issuer}")
            if award.get("description"):
                lines.append(f"  {award['description']}")
        lines.append("")

    if res.get("volunteering"):
        lines.append("## Volunteer & Leadership Experience")
        for vol in res["volunteering"]:
            role = vol.get("role", "")
            org = vol.get("organization", "")
            dates = f"{vol.get('start_date', '')} - {vol.get('end_date', 'Present')}"
            lines.append(f"### {role} - {org} ({dates})")
            if vol.get("description"):
                lines.append(vol["description"])
            for b in vol.get("bullets", []):
                lines.append(f"- {b}")
            lines.append("")

    content = "\n".join(lines)
    return PlainTextResponse(
        content=content,
        headers={"Content-Disposition": f"attachment; filename=\"{res['title'].replace(' ', '_')}.{ 'md' if format == 'markdown' else 'txt'}\""}
    )


# ─── AI Resume ↔ Job Description Match Analyzer Endpoints ──────────────────

@router.post("/match-analyzer", response_model=ResumeMatchAnalysisResponse)
def analyze_resume_match(
    payload: ResumeMatchAnalysisRequest,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """
    Executes authoritative AI Resume ↔ Job Description Match Analysis.
    Compares candidate's resume against job requisition criteria, computes deterministic scores,
    extracts traceable evidence snippets, and persists analysis for candidate review.
    """
    res, err, code = ResumeController.analyze_match(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.post("/{resume_id}/match-analyzer", response_model=ResumeMatchAnalysisResponse)
def analyze_specific_resume_match(
    resume_id: str,
    payload: ResumeMatchAnalysisRequest,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """
    Executes match analysis specifically for {resume_id} against the target job.
    Enforces candidate ownership server-side.
    """
    payload.resume_id = resume_id
    res, err, code = ResumeController.analyze_match(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.get("/match-analyzer/history", response_model=List[ResumeMatchAnalysisResponse])
def get_match_analyses_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Lists persisted match analysis history for the authenticated candidate."""
    res, err, code = ResumeController.list_analyses(db, current_user, limit=limit)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.get("/match-analyzer/{analysis_id}", response_model=ResumeMatchAnalysisResponse)
def get_match_analysis(
    analysis_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Retrieves a specific persisted match analysis, enforcing candidate ownership."""
    res, err, code = ResumeController.get_analysis(db, analysis_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.get("/{resume_id}/match-analyzer/job/{job_id}", response_model=ResumeMatchAnalysisResponse)
def get_latest_resume_job_analysis(
    resume_id: str,
    job_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """
    Retrieves the latest persisted match analysis between a specific resume and job.
    Allows candidate to reopen a previously computed analysis without re-running.
    """
    res, err, code = ResumeController.get_latest_analysis_for_job(db, resume_id, job_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.delete("/match-analyzer/{analysis_id}")
def delete_match_analysis(
    analysis_id: str,
    current_user: UserModel = Depends(require_candidate),
    db: Session = Depends(get_db)
):
    """Deletes a persisted match analysis record owned by the candidate."""
    success, err, code = ResumeController.delete_analysis(db, analysis_id, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return {"success": True, "message": "Match analysis deleted successfully"}

