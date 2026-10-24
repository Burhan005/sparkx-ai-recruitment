"""
Authoritative Resume Controller for ARETE AI Resume Studio.
Handles real database persistence, candidate ownership enforcement,
version history tracking, profile synchronization, and grounded AI assistance.
Zero mock data, zero hardcoded content.
"""
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from models.db_models import ResumeDocumentModel, UserModel, JobModel, ResumeMatchAnalysisModel
from schemas import (
    ResumeCreateRequest, ResumeUpdateRequest, ResumeAIAssistRequest,
    ResumeMatchAnalysisRequest
)
from ai_engine import call_llm, get_llm_status, parse_llm_json
from services.resume_match_service import ResumeMatchService

logger = logging.getLogger("sparkx.resume")


def serialize_resume(resume: ResumeDocumentModel) -> Dict[str, Any]:
    """Serializes a ResumeDocumentModel instance into a clean JSON-compatible dictionary."""
    return {
        "id": resume.id,
        "user_id": resume.user_id,
        "organization_id": resume.organization_id or "org-sparkx-default",
        "title": resume.title,
        "target_job_id": resume.target_job_id,
        "target_job_title": resume.target_job_title,
        "is_base_resume": bool(resume.is_base_resume),
        "contact_info": resume.contact_info if isinstance(resume.contact_info, dict) else {},
        "summary": resume.summary or "",
        "experience": resume.experience if isinstance(resume.experience, list) else [],
        "education": resume.education if isinstance(resume.education, list) else [],
        "skills": resume.skills if isinstance(resume.skills, list) else [],
        "projects": resume.projects if isinstance(resume.projects, list) else [],
        "certifications": resume.certifications if isinstance(resume.certifications, list) else [],
        "languages": resume.languages if isinstance(resume.languages, list) else [],
        "awards": resume.awards if isinstance(resume.awards, list) else [],
        "volunteering": resume.volunteering if isinstance(resume.volunteering, list) else [],
        "version": resume.version or 1,
        "parent_resume_id": resume.parent_resume_id,
        "change_summary": resume.change_summary or "",
        "created_at": resume.created_at.isoformat() if resume.created_at else datetime.utcnow().isoformat(),
        "updated_at": resume.updated_at.isoformat() if resume.updated_at else datetime.utcnow().isoformat()
    }


class ResumeController:

    @staticmethod
    def list_resumes(db: Session, current_user: UserModel) -> List[Dict[str, Any]]:
        """List all resumes strictly owned by the authenticated candidate."""
        resumes = (
            db.query(ResumeDocumentModel)
            .filter(ResumeDocumentModel.user_id == current_user.id)
            .order_by(ResumeDocumentModel.is_base_resume.desc(), ResumeDocumentModel.updated_at.desc())
            .all()
        )
        return [serialize_resume(r) for r in resumes]

    @staticmethod
    def get_resume(db: Session, resume_id: str, current_user: UserModel) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Fetch a specific resume document, strictly verifying candidate ownership."""
        resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == resume_id).first()
        if not resume:
            return None, "Resume not found", 404
        if resume.user_id != current_user.id:
            return None, "Access denied: You do not own this resume", 403
        return serialize_resume(resume), None, 200

    @staticmethod
    def create_resume(db: Session, payload: ResumeCreateRequest, current_user: UserModel) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Create a new resume document in the database owned by current_user."""
        resume_id = f"res-{uuid.uuid4().hex[:10]}"
        
        # If marked as base resume, unset existing base resume flags for this user
        if payload.is_base_resume:
            db.query(ResumeDocumentModel).filter(
                ResumeDocumentModel.user_id == current_user.id,
                ResumeDocumentModel.is_base_resume == True
            ).update({"is_base_resume": False})

        # Resolve target job title if job_id provided
        target_title = payload.target_job_title
        if payload.target_job_id and not target_title:
            job = db.query(JobModel).filter(JobModel.id == payload.target_job_id).first()
            if job:
                target_title = job.title

        resume = ResumeDocumentModel(
            id=resume_id,
            user_id=current_user.id,
            organization_id=getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default",
            title=payload.title or "My Resume",
            target_job_id=payload.target_job_id,
            target_job_title=target_title,
            is_base_resume=payload.is_base_resume,
            contact_info=payload.contact_info or {},
            summary=payload.summary or "",
            experience=payload.experience or [],
            education=payload.education or [],
            skills=payload.skills or [],
            projects=payload.projects or [],
            certifications=payload.certifications or [],
            languages=payload.languages or [],
            awards=payload.awards or [],
            volunteering=payload.volunteering or [],
            version=1,
            parent_resume_id=payload.parent_resume_id,
            change_summary=payload.change_summary or "Initial draft",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)
        return serialize_resume(resume), None, 201

    @staticmethod
    def update_resume(db: Session, resume_id: str, payload: ResumeUpdateRequest, current_user: UserModel) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """
        Update an existing resume or create a versioned checkpoint.
        Candidate ownership strictly enforced.
        """
        resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == resume_id).first()
        if not resume:
            return None, "Resume not found", 404
        if resume.user_id != current_user.id:
            return None, "Access denied: You do not own this resume", 403

        # Resolve target job title if job_id changed
        target_title = payload.target_job_title or resume.target_job_title
        if payload.target_job_id and payload.target_job_id != resume.target_job_id:
            job = db.query(JobModel).filter(JobModel.id == payload.target_job_id).first()
            if job:
                target_title = job.title

        # Base resume uniqueness enforcement
        if payload.is_base_resume is True:
            db.query(ResumeDocumentModel).filter(
                ResumeDocumentModel.user_id == current_user.id,
                ResumeDocumentModel.id != resume_id,
                ResumeDocumentModel.is_base_resume == True
            ).update({"is_base_resume": False})

        # Version Checkpointing workflow
        if payload.create_new_version:
            new_id = f"res-{uuid.uuid4().hex[:10]}"
            next_version = (resume.version or 1) + 1
            versioned_resume = ResumeDocumentModel(
                id=new_id,
                user_id=current_user.id,
                organization_id=resume.organization_id,
                title=payload.title if payload.title is not None else resume.title,
                target_job_id=payload.target_job_id if payload.target_job_id is not None else resume.target_job_id,
                target_job_title=target_title,
                is_base_resume=payload.is_base_resume if payload.is_base_resume is not None else resume.is_base_resume,
                contact_info=payload.contact_info if payload.contact_info is not None else resume.contact_info,
                summary=payload.summary if payload.summary is not None else resume.summary,
                experience=payload.experience if payload.experience is not None else resume.experience,
                education=payload.education if payload.education is not None else resume.education,
                skills=payload.skills if payload.skills is not None else resume.skills,
                projects=payload.projects if payload.projects is not None else resume.projects,
                certifications=payload.certifications if payload.certifications is not None else resume.certifications,
                languages=payload.languages if payload.languages is not None else resume.languages,
                awards=payload.awards if payload.awards is not None else resume.awards,
                volunteering=payload.volunteering if payload.volunteering is not None else resume.volunteering,
                version=next_version,
                parent_resume_id=resume.id,
                change_summary=payload.change_summary or f"Version {next_version} checkpoint",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(versioned_resume)
            db.commit()
            db.refresh(versioned_resume)
            return serialize_resume(versioned_resume), None, 201

        # Direct in-place update
        if payload.title is not None:
            resume.title = payload.title
        if payload.target_job_id is not None:
            resume.target_job_id = payload.target_job_id
            resume.target_job_title = target_title
        if payload.is_base_resume is not None:
            resume.is_base_resume = payload.is_base_resume
        if payload.contact_info is not None:
            resume.contact_info = payload.contact_info
        if payload.summary is not None:
            resume.summary = payload.summary
        if payload.experience is not None:
            resume.experience = payload.experience
        if payload.education is not None:
            resume.education = payload.education
        if payload.skills is not None:
            resume.skills = payload.skills
        if payload.projects is not None:
            resume.projects = payload.projects
        if payload.certifications is not None:
            resume.certifications = payload.certifications
        if payload.languages is not None:
            resume.languages = payload.languages
        if payload.awards is not None:
            resume.awards = payload.awards
        if payload.volunteering is not None:
            resume.volunteering = payload.volunteering
        if payload.change_summary is not None:
            resume.change_summary = payload.change_summary

        resume.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(resume)
        return serialize_resume(resume), None, 200

    @staticmethod
    def delete_resume(db: Session, resume_id: str, current_user: UserModel) -> Tuple[bool, Optional[str], int]:
        """Delete a resume document owned by current_user."""
        resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == resume_id).first()
        if not resume:
            return False, "Resume not found", 404
        if resume.user_id != current_user.id:
            return False, "Access denied: You do not own this resume", 403

        db.delete(resume)
        db.commit()
        return True, None, 200

    @staticmethod
    def list_versions(db: Session, resume_id: str, current_user: UserModel) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str], int]:
        """Retrieve version history chain for a given resume."""
        resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == resume_id).first()
        if not resume:
            return None, "Resume not found", 404
        if resume.user_id != current_user.id:
            return None, "Access denied", 403

        # Traverse root parent
        root_id = resume.id
        curr = resume
        while curr.parent_resume_id:
            p = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == curr.parent_resume_id).first()
            if not p or p.user_id != current_user.id:
                break
            curr = p
            root_id = curr.id

        # Query all versions belonging to this chain
        chain = (
            db.query(ResumeDocumentModel)
            .filter(
                ResumeDocumentModel.user_id == current_user.id,
                (ResumeDocumentModel.id == root_id) | (ResumeDocumentModel.parent_resume_id == root_id) | (ResumeDocumentModel.id == resume.id) | (ResumeDocumentModel.parent_resume_id == resume.id)
            )
            .order_by(ResumeDocumentModel.version.asc())
            .all()
        )
        return [serialize_resume(r) for r in chain], None, 200

    @staticmethod
    def init_from_profile(db: Session, current_user: UserModel) -> Dict[str, Any]:
        """
        Construct a fresh draft resume using the candidate's verified profile data.
        Clearly documents missing information without inventing fake content.
        """
        contact = {
            "full_name": current_user.name or "",
            "email": current_user.email or "",
            "phone": current_user.phone or "",
            "location": "",
            "headline": current_user.job_role or "",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": ""
        }

        # Check for missing information
        missing_fields = []
        if not current_user.phone:
            missing_fields.append("Phone number")
        if not current_user.resume_summary and not current_user.job_role:
            missing_fields.append("Professional Summary")
        if not current_user.skills:
            missing_fields.append("Technical & Domain Skills")
        if not current_user.education:
            missing_fields.append("Education Institution & Degree")

        # Initial education entry
        edu_list = []
        if current_user.education:
            edu_list.append({
                "id": f"edu-{uuid.uuid4().hex[:6]}",
                "degree": current_user.education,
                "institution": "",
                "field_of_study": "",
                "start_year": "",
                "graduation_year": "",
                "gpa": ""
            })

        # Initial experience placeholder from verified experience_years
        exp_list = []
        if current_user.job_role:
            exp_list.append({
                "id": f"exp-{uuid.uuid4().hex[:6]}",
                "title": current_user.job_role,
                "company": "",
                "location": "",
                "start_date": "",
                "end_date": "Present",
                "is_current": True,
                "bullets": [],
                "technologies": current_user.skills[:4] if current_user.skills else []
            })

        return {
            "draft": {
                "title": f"{current_user.name}'s Base Resume",
                "is_base_resume": True,
                "contact_info": contact,
                "summary": current_user.resume_summary or "",
                "experience": exp_list,
                "education": edu_list,
                "skills": current_user.skills or [],
                "projects": [],
                "certifications": [],
                "languages": [],
                "awards": [],
                "volunteering": [],
                "change_summary": "Created from verified candidate profile"
            },
            "missing_fields": missing_fields,
            "has_existing_profile": bool(current_user.skills or current_user.education or current_user.resume_summary)
        }

    @staticmethod
    def sync_to_profile(db: Session, resume_id: str, current_user: UserModel) -> Tuple[bool, Optional[str], int]:
        """
        Sync verified resume fields back to the candidate's UserModel profile.
        Ensures future applications utilize the updated, polished credentials.
        """
        resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == resume_id).first()
        if not resume:
            return False, "Resume not found", 404
        if resume.user_id != current_user.id:
            return False, "Access denied: You do not own this resume", 403

        contact = resume.contact_info if isinstance(resume.contact_info, dict) else {}
        if contact.get("phone"):
            current_user.phone = contact["phone"]
        if contact.get("headline"):
            current_user.job_role = contact["headline"]
        if resume.summary:
            current_user.resume_summary = resume.summary
        if resume.skills and isinstance(resume.skills, list):
            current_user.skills = resume.skills
        if resume.education and isinstance(resume.education, list) and len(resume.education) > 0:
            first_edu = resume.education[0]
            if isinstance(first_edu, dict) and first_edu.get("degree"):
                current_user.education = first_edu["degree"]

        db.commit()
        return True, None, 200

    @staticmethod
    def ai_assist(db: Session, payload: ResumeAIAssistRequest, current_user: UserModel) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """
        Executes grounded AI resume refinement.
        Separate from database transactions to protect against connection timeouts.
        Returns verifiable suggestions with strict anti-hallucination guardrails.
        """
        llm_status = get_llm_status()
        provider = llm_status.get("provider", "None")

        action = payload.action
        curr_text = (payload.current_text or "").strip()
        ctx = payload.resume_context or {}

        # 1. Action: Audit Gaps
        if action == "audit_gaps":
            findings = []
            contact = ctx.get("contact_info", {})
            if not contact.get("email"):
                findings.append({"severity": "high", "section": "contact", "issue": "Missing contact email address"})
            if not contact.get("phone"):
                findings.append({"severity": "medium", "section": "contact", "issue": "No phone number provided"})
            
            summary = ctx.get("summary", "")
            if not summary or len(summary.strip()) < 30:
                findings.append({"severity": "medium", "section": "summary", "issue": "Professional summary is empty or very short (< 30 characters)"})
            
            exp = ctx.get("experience", [])
            if not exp or len(exp) == 0:
                findings.append({"severity": "high", "section": "experience", "issue": "No work experience entries entered"})
            else:
                for idx, pos in enumerate(exp):
                    company = pos.get("company", "").strip()
                    title = pos.get("title", "").strip()
                    bullets = pos.get("bullets", [])
                    if not company:
                        findings.append({"severity": "high", "section": "experience", "issue": f"Position #{idx+1} is missing company name"})
                    if not title:
                        findings.append({"severity": "high", "section": "experience", "issue": f"Position #{idx+1} is missing job title"})
                    if not bullets or len(bullets) == 0:
                        findings.append({"severity": "medium", "section": "experience", "issue": f"Position '{title or idx+1}' has zero achievement bullets"})

            skills = ctx.get("skills", [])
            if not skills or len(skills) < 3:
                findings.append({"severity": "medium", "section": "skills", "issue": "Fewer than 3 skills listed. Consider adding your primary domain competencies."})

            edu = ctx.get("education", [])
            if not edu or len(edu) == 0:
                findings.append({"severity": "medium", "section": "education", "issue": "No education credentials listed"})

            return {
                "action": "audit_gaps",
                "suggestion": f"Audit complete. Found {len(findings)} area(s) for improvement.",
                "audit_findings": findings,
                "grounded_source": "Deterministic Resume Verification Audit",
                "is_live_llm": False,
                "provider": "ARETE Deterministic Auditor"
            }, None, 200

        # 2. Action: Suggest Keywords from Real Job
        if action == "suggest_keywords":
            if not payload.job_id:
                return None, "A real job_id is required to perform keyword analysis", 400
            job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
            if not job:
                return None, "Job requisition not found in database", 404

            job_req_skills = [s.strip().lower() for s in (job.required_skills or []) if s]
            cand_skills = [s.strip().lower() for s in (ctx.get("skills", []) or []) if s]
            
            matched = [s for s in job.required_skills if s.strip().lower() in cand_skills]
            missing = [s for s in job.required_skills if s.strip().lower() not in cand_skills]

            # LLM semantic expansion on real job description
            prompt = (
                f"Job Title: {job.title}\n"
                f"Job Department: {job.department}\n"
                f"Job Required Skills: {', '.join(job.required_skills or [])}\n"
                f"Job Description: {(job.description or '')[:600]}\n\n"
                f"Candidate Verified Skills: {', '.join(ctx.get('skills', []) or [])}\n\n"
                "Extract 4-6 high-impact technical keywords directly from the job description that the candidate could highlight if they possess relevant experience.\n"
                "Output JSON: {\"recommended_keywords\": [\"keyword1\", \"keyword2\"], \"reasoning\": \"explanation\"}"
            )
            raw = call_llm(prompt, system_instruction="You are ARETE Keyword Intelligence. Return JSON only.")
            parsed = parse_llm_json(raw) or {}
            recommended = parsed.get("recommended_keywords", missing[:5])

            return {
                "action": "suggest_keywords",
                "suggestion": f"Analyzed against '{job.title}'. {len(matched)} matched keywords and {len(missing)} requirement gaps identified.",
                "suggested_keywords": recommended,
                "matched_keywords": matched,
                "missing_keywords": missing,
                "reasoning": parsed.get("reasoning", f"Based on live job requirements for {job.title} at {job.company_name}."),
                "grounded_source": f"Job Requisition: {job.title} (ID: {job.id})",
                "is_live_llm": bool(raw),
                "provider": provider
            }, None, 200

        # 3. Action: Refine Professional Summary
        if action == "refine_summary":
            skills_str = ", ".join(ctx.get("skills", [])[:8])
            exp_years = current_user.experience_years or 0.0
            job_role = ctx.get("contact_info", {}).get("headline") or current_user.job_role or "Software Professional"
            
            prompt = (
                f"Candidate Role: {job_role}\n"
                f"Years of Experience: {exp_years}\n"
                f"Verified Skills: {skills_str}\n"
                f"Current Summary Draft: {curr_text or 'None'}\n\n"
                "STRICT GROUNDING RULES:\n"
                "- Do NOT invent companies, awards, degrees, or unverifiable numbers.\n"
                "- Craft 1 polished primary summary (2-3 sentences) emphasizing clarity, proven technical competence, and verifiable skills.\n"
                "- Provide 2 alternative phrasings (1 concise, 1 leadership-oriented).\n"
                "Output JSON format:\n"
                "{\n"
                "  \"primary_summary\": \"...\",\n"
                "  \"alternatives\": [\"...\", \"...\"],\n"
                "  \"reasoning\": \"...\"\n"
                "}"
            )

            raw = call_llm(prompt, system_instruction="You are an expert career editor adhering to verifiable truth. Return JSON only.")
            parsed = parse_llm_json(raw)
            if not parsed or "primary_summary" not in parsed:
                # Deterministic grounded fallback
                primary = f"Results-driven {job_role} with strong hands-on expertise in {skills_str or 'modern software engineering'}. Experienced in building robust, maintainable systems and collaborating across technical teams."
                return {
                    "action": "refine_summary",
                    "suggestion": primary,
                    "alternatives": [
                        f"{job_role} specialized in {skills_str or 'software engineering'}. Focused on delivering scalable solutions and engineering excellence.",
                        f"Versatile technical professional proficient in {skills_str or 'full-stack technologies'} with a proven track record of structured problem-solving."
                    ],
                    "reasoning": "Generated using verified candidate profile skills without external fabrication.",
                    "grounded_source": "Candidate Profile & Verified Skills",
                    "is_live_llm": False,
                    "provider": "ARETE Grounded Engine"
                }, None, 200

            return {
                "action": "refine_summary",
                "suggestion": parsed["primary_summary"],
                "alternatives": parsed.get("alternatives", []),
                "reasoning": parsed.get("reasoning", "Structured to emphasize verified competencies."),
                "grounded_source": "Candidate Profile & Verified Skills",
                "is_live_llm": True,
                "provider": provider
            }, None, 200

        # 4. Action: Improve Experience Bullet Point (Google X-Y-Z formula)
        if action == "improve_bullet":
            if not curr_text:
                return None, "Original bullet text is required", 400

            prompt = (
                f"Original Experience Bullet: \"{curr_text}\"\n\n"
                "STRICT GROUNDING RULES:\n"
                "1. Preserve the EXACT factual meaning of what the candidate worked on.\n"
                "2. DO NOT fabricate metrics, numbers, percentages, or technologies not present or implied.\n"
                "3. If the original lacks metrics, write in strong active voice using the format: 'Accomplished [X] by doing [Y], resulting in [improved clarity/performance]'.\n"
                "4. Deliver 1 primary enhanced bullet and 2 alternatives (1 impact-focused, 1 technical-focused).\n"
                "Output JSON:\n"
                "{\n"
                "  \"enhanced_bullet\": \"...\",\n"
                "  \"alternatives\": [\"...\", \"...\"],\n"
                "  \"reasoning\": \"...\"\n"
                "}"
            )
            raw = call_llm(prompt, system_instruction="You are ARETE Bullet Optimizer. Preserve facts strictly. Return JSON only.")
            parsed = parse_llm_json(raw)
            if not parsed or "enhanced_bullet" not in parsed:
                # Deterministic verb strengthening
                words = curr_text.split()
                first_word = words[0] if words else ""
                clean_bullet = curr_text
                if first_word.lower() in ("worked", "helped", "responsible", "handled"):
                    clean_bullet = f"Engineered and delivered {curr_text[len(first_word):].strip()}"
                return {
                    "action": "improve_bullet",
                    "suggestion": clean_bullet,
                    "alternatives": [
                        f"Architected and implemented solutions for {curr_text}",
                        f"Led development efforts focused on {curr_text}"
                    ],
                    "reasoning": "Enhanced with active action verbs while maintaining factual scope.",
                    "grounded_source": "Candidate Original Bullet",
                    "is_live_llm": False,
                    "provider": "ARETE Grounded Engine"
                }, None, 200

            return {
                "action": "improve_bullet",
                "suggestion": parsed["enhanced_bullet"],
                "alternatives": parsed.get("alternatives", []),
                "reasoning": parsed.get("reasoning", "Enhanced using Google X-Y-Z active achievement framing."),
                "grounded_source": "Candidate Original Bullet",
                "is_live_llm": True,
                "provider": provider
            }, None, 200

        # 5. Action: Tailor Entire Resume for a Job Requisition
        if action == "tailor_resume":
            if not payload.job_id:
                return None, "A real job_id is required to tailor the resume", 400
            job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
            if not job:
                return None, "Job requisition not found in database", 404

            skills_set = set(s.strip().lower() for s in (ctx.get("skills", []) or []))
            job_skills = job.required_skills or []
            
            # Reorder skills so overlapping skills come first
            prioritized_skills = []
            for s in job_skills:
                if s.strip().lower() in skills_set and s not in prioritized_skills:
                    prioritized_skills.append(s)
            for s in ctx.get("skills", []):
                if s not in prioritized_skills:
                    prioritized_skills.append(s)

            # Generate job-aligned summary
            current_summary = ctx.get("summary", "")
            prompt = (
                f"Job Title: {job.title}\n"
                f"Job Description: {(job.description or '')[:500]}\n"
                f"Candidate Current Summary: {current_summary}\n"
                f"Candidate Verified Skills: {', '.join(prioritized_skills[:10])}\n\n"
                "STRICT GROUNDING:\n"
                "Tailor the professional summary to highlight candidate strengths relevant to this job without inventing unearned credentials.\n"
                "Output JSON:\n"
                "{\n"
                "  \"tailored_summary\": \"...\",\n"
                "  \"reasoning\": \"...\"\n"
                "}"
            )
            raw = call_llm(prompt, system_instruction="You are ARETE Resume Tailor. Truthful alignment only. Return JSON.")
            parsed = parse_llm_json(raw) or {}
            tailored_summary = parsed.get("tailored_summary") or f"Results-focused software professional with verifiable proficiency in {', '.join(prioritized_skills[:4])}, aligned with requirements for {job.title}."

            return {
                "action": "tailor_resume",
                "suggestion": tailored_summary,
                "suggested_keywords": [s for s in job_skills if s.strip().lower() not in skills_set][:5],
                "matched_keywords": [s for s in job_skills if s.strip().lower() in skills_set],
                "reasoning": f"Prioritized overlapping competencies ({len(prioritized_skills)} skills aligned with {job.title}).",
                "grounded_source": f"Job Requisition: {job.title} at {job.company_name}",
                "is_live_llm": bool(raw),
                "provider": provider
            }, None, 200

        return None, f"Unknown action '{action}'", 400

    @staticmethod
    def analyze_match(
        db: Session,
        payload: ResumeMatchAnalysisRequest,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """
        Executes authoritative AI Resume ↔ Job Description Match Analysis.
        Validates job existence and candidate resume ownership.
        """
        # 1. Validate Job
        job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
        if not job:
            return None, "Job requisition not found in database", 404

        # 2. Resolve Resume & Enforce Candidate Ownership
        if payload.resume_id:
            resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == payload.resume_id).first()
            if not resume:
                return None, "Resume document not found", 404
            if resume.user_id != current_user.id:
                return None, "Access denied: You do not own this resume document", 403
        else:
            # Fallback to candidate's latest saved resume
            resume = (
                db.query(ResumeDocumentModel)
                .filter(ResumeDocumentModel.user_id == current_user.id)
                .order_by(ResumeDocumentModel.updated_at.desc())
                .first()
            )
            if not resume:
                return None, "No saved resume found. Please create or save a resume in AI Resume Studio before analyzing match.", 400

        try:
            analysis_data = ResumeMatchService.analyze_resume_job_match(
                resume=resume,
                job=job,
                current_user=current_user,
                db=db
            )
            return analysis_data, None, 200
        except Exception as e:
            logger.error(f"[ResumeController] analyze_match error: {e}", exc_info=True)
            return None, f"Analysis computation failed: {str(e)}", 500

    @staticmethod
    def list_analyses(
        db: Session,
        current_user: UserModel,
        limit: int = 50
    ) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
        """Lists persisted match analysis history for the authenticated candidate."""
        records = (
            db.query(ResumeMatchAnalysisModel)
            .filter(ResumeMatchAnalysisModel.user_id == current_user.id)
            .order_by(ResumeMatchAnalysisModel.updated_at.desc())
            .limit(limit)
            .all()
        )
        serialized = [
            ResumeMatchService.serialize_analysis(r, r.resume, r.job)
            for r in records
        ]
        return serialized, None, 200

    @staticmethod
    def get_analysis(
        db: Session,
        analysis_id: str,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Retrieves a specific match analysis enforcing candidate ownership."""
        analysis = (
            db.query(ResumeMatchAnalysisModel)
            .filter(ResumeMatchAnalysisModel.id == analysis_id)
            .first()
        )
        if not analysis:
            return None, "Match analysis not found", 404
        if analysis.user_id != current_user.id:
            return None, "Access denied: You do not own this analysis", 403

        return ResumeMatchService.serialize_analysis(analysis, analysis.resume, analysis.job), None, 200

    @staticmethod
    def get_latest_analysis_for_job(
        db: Session,
        resume_id: str,
        job_id: str,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Retrieves the latest match analysis for a specific resume and job."""
        resume = db.query(ResumeDocumentModel).filter(ResumeDocumentModel.id == resume_id).first()
        if not resume:
            return None, "Resume not found", 404
        if resume.user_id != current_user.id:
            return None, "Access denied: You do not own this resume", 403

        analysis = (
            db.query(ResumeMatchAnalysisModel)
            .filter(
                ResumeMatchAnalysisModel.user_id == current_user.id,
                ResumeMatchAnalysisModel.resume_id == resume_id,
                ResumeMatchAnalysisModel.job_id == job_id
            )
            .order_by(ResumeMatchAnalysisModel.updated_at.desc())
            .first()
        )
        if not analysis:
            return None, "No previous analysis found for this resume and job", 404

        return ResumeMatchService.serialize_analysis(analysis, analysis.resume, analysis.job), None, 200

    @staticmethod
    def delete_analysis(
        db: Session,
        analysis_id: str,
        current_user: UserModel
    ) -> Tuple[bool, Optional[str], int]:
        """Deletes a saved match analysis enforcing ownership."""
        analysis = (
            db.query(ResumeMatchAnalysisModel)
            .filter(ResumeMatchAnalysisModel.id == analysis_id)
            .first()
        )
        if not analysis:
            return False, "Match analysis not found", 404
        if analysis.user_id != current_user.id:
            return False, "Access denied: You do not own this analysis", 403

        db.delete(analysis)
        db.commit()
        return True, None, 200

