"""
(C) Job Controller - Handles business logic for company requirements & question banks
"""
import uuid
from sqlalchemy.orm import Session
from models.db_models import JobModel
from schemas import JobCreate, JobUpdate, JobMatchRequest, BatchJobMatchRequest
from ai_engine import generate_job_questions, calculate_resume_job_match
from services.compensation_service import format_job_compensation
from services.organization_service import ensure_organization

class JobController:
    @staticmethod
    def _enrich_job(j: JobModel, db: Session = None) -> JobModel:
        if j:
            j.applicants_count = len(j.candidates) if hasattr(j, "candidates") and j.candidates else 0
            j.formatted_compensation = format_job_compensation(
                ctc_min=j.ctc_min,
                ctc_max=j.ctc_max,
                ctc_type=j.ctc_type or "range",
                ctc_currency=j.ctc_currency or "INR",
                ctc_period=j.ctc_period or "annual",
                variable_min=j.variable_pay_min,
                variable_max=j.variable_pay_max
            )
            if db:
                from services.skill_service import SkillService
                try:
                    j.relational_skills = SkillService.get_job_skill_requirements_detailed(j.id, db)
                except Exception:
                    j.relational_skills = []
        return j

    @staticmethod
    def get_all_jobs(db: Session, skip: int = 0, limit: int = 100, status_filter: str = None, organization_id: str = None):
        query = db.query(JobModel)
        if organization_id:
            query = query.filter(JobModel.organization_id == organization_id)
        if status_filter and status_filter.strip().lower() != "all":
            valid_statuses = ["Active", "Paused", "Closed"]
            norm = next((s for s in valid_statuses if s.lower() == status_filter.strip().lower()), None)
            if norm:
                query = query.filter(JobModel.status == norm)
        jobs = query.offset(skip).limit(limit).all()
        for j in jobs:
            JobController._enrich_job(j, db)
        return jobs

    @staticmethod
    def get_job_by_id(job_id: str, db: Session):
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        return JobController._enrich_job(job, db) if job else None

    @staticmethod
    def match_candidate_to_job(job_id: str, payload: JobMatchRequest, db: Session):
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            return None, "Job not found"

        job_data = {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "description": job.description,
            "required_skills": job.required_skills or [],
            "min_experience_years": job.min_experience_years or 0,
            "education": job.education or "",
            "optional_criteria": job.optional_criteria or ""
        }
        candidate_data = {
            "name": payload.name or "Candidate",
            "skills": payload.skills or [],
            "experience_years": payload.experience_years or 0.0,
            "job_role": payload.job_role or "",
            "resume_summary": payload.resume_summary or "",
            "resume_text": payload.resume_text or "",
            "education": payload.education or ""
        }

        match_res = calculate_resume_job_match(job_data, candidate_data)
        return match_res, None

    @staticmethod
    def batch_match_jobs(payload: BatchJobMatchRequest, db: Session):
        jobs = db.query(JobModel).all()
        cand = payload.candidate if isinstance(payload.candidate, dict) else {}
        candidate_data = {
            "name": (payload.name if payload.name != "Candidate" else None) or cand.get("name") or "Candidate",
            "skills": payload.skills or cand.get("skills") or [],
            "experience_years": payload.experience_years or cand.get("experience_years") or 0.0,
            "job_role": payload.job_role or cand.get("job_role") or "",
            "resume_summary": payload.resume_summary or cand.get("resume_summary") or "",
            "resume_text": payload.resume_text or cand.get("resume_text") or "",
            "education": payload.education or cand.get("education") or ""
        }

        results = {}
        for job in jobs:
            job_data = {
                "id": job.id,
                "title": job.title,
                "department": job.department,
                "description": job.description,
                "required_skills": job.required_skills or [],
                "min_experience_years": job.min_experience_years or 0,
                "education": job.education or "",
                "optional_criteria": job.optional_criteria or ""
            }
            results[job.id] = calculate_resume_job_match(job_data, candidate_data)

        return {"matches": results}

    @staticmethod
    def create_new_job(payload: JobCreate, db: Session, organization_id: str = "org-sparkx-default"):
        job_id = f"job-{uuid.uuid4().hex[:6]}"
        questions = payload.questions
        if not questions:
            questions = generate_job_questions(
                payload.title,
                payload.required_skills,
                payload.min_experience_years
            )

        from ai_engine import classify_job_domain
        is_coding, domain_cat, _ = classify_job_domain(payload.title, payload.required_skills, payload.description)

        # Don't inject generic hardcoded assessment data.
        # coding_assessment comes from the recruiter via Studio or from the payload directly.
        # If not provided, leave it empty — the AI engine will generate dynamically per candidate.
        final_assessment = payload.coding_assessment or {"is_coding": is_coding, "domain_category": domain_cat}

        org = organization_id or getattr(payload, "organization_id", None) or "org-sparkx-default"
        ensure_organization(db, org, name=payload.company_name or "SparkX Technologies")

        new_job = JobModel(
            id=job_id,
            title=payload.title,
            company_name=payload.company_name or "SparkX Technologies",
            organization_id=org,
            department=payload.department,
            location=payload.location,
            min_experience_years=payload.min_experience_years,
            experience=f"{payload.min_experience_years}+ years",
            education=payload.education,
            languages=payload.languages if is_coding else [],
            required_skills=payload.required_skills,
            optional_criteria=payload.optional_criteria,
            description=payload.description,
            questions=questions,
            coding_assessment=final_assessment,
            coding_difficulty=payload.coding_difficulty if is_coding else None,
            assessment_pool=payload.assessment_pool or {},
            assessment_version=payload.assessment_version or 1,
            competency_blueprint=payload.competency_blueprint or {},
            # Production-safe compensation persistence
            ctc_type=payload.ctc_type or "range",
            ctc_min=payload.ctc_min,
            ctc_max=payload.ctc_max,
            ctc_currency=(payload.ctc_currency or "INR").upper(),
            ctc_period=(payload.ctc_period or "annual").lower(),
            variable_pay_min=payload.variable_pay_min,
            variable_pay_max=payload.variable_pay_max,
            status="Active"
        )

        db.add(new_job)
        db.commit()
        db.refresh(new_job)

        # Authoritative Phase 4E.1 Relational Skill Requirements Sync
        from services.skill_service import SkillService
        if payload.required_skills:
            SkillService.sync_job_skill_requirements(new_job.id, payload.required_skills, db)
            db.commit()
            db.refresh(new_job)

        JobController._enrich_job(new_job, db)
        return new_job


    @staticmethod
    def update_job(job_id: str, payload: JobUpdate, db: Session, organization_id: str = None):
        """
        Recruiter-only: Updates existing job specification & compensation budget.
        Enforces tenant isolation: verifies recruiter's organization matches job's organization.
        """
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            return None, "Job not found"

        if organization_id:
            job_org = getattr(job, "organization_id", "org-sparkx-default") or "org-sparkx-default"
            if job_org != organization_id:
                return None, "Cross-tenant access forbidden: Job belongs to another organization."

        update_data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)

        for field, value in update_data.items():
            if hasattr(job, field):
                if field == "ctc_currency" and value:
                    setattr(job, field, str(value).upper().strip())
                elif field == "ctc_period" and value:
                    setattr(job, field, str(value).lower().strip())
                elif field == "ctc_type" and value:
                    setattr(job, field, str(value).lower().strip())
                else:
                    setattr(job, field, value)

        db.commit()
        db.refresh(job)

        # Authoritative Phase 4E.1 Relational Skill Requirements Sync on update
        if "required_skills" in update_data and update_data["required_skills"] is not None:
            from services.skill_service import SkillService
            SkillService.sync_job_skill_requirements(job.id, update_data["required_skills"], db)
            db.commit()
            db.refresh(job)

        JobController._enrich_job(job, db)
        return job, None

    @staticmethod
    def change_job_status(job_id: str, new_status: str, closure_reason: str = None, recruiter_email: str = None, db: Session = None, organization_id: str = None):
        """
        Recruiter-only: Updates single authoritative job lifecycle state (Active, Paused, Closed).
        Enforces tenant isolation and preserves all historical candidate applications & assessments.
        """
        from datetime import datetime
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            return None, "Job not found"

        if organization_id:
            job_org = getattr(job, "organization_id", "org-sparkx-default") or "org-sparkx-default"
            if job_org != organization_id:
                return None, "Cross-tenant access forbidden: Job belongs to another organization."

        valid_statuses = ["Active", "Paused", "Closed"]
        normalized_status = next((s for s in valid_statuses if s.lower() == (new_status or "").lower()), None)
        if not normalized_status:
            return None, f"Invalid status '{new_status}'. Valid statuses: Active, Paused, Closed"

        job.status = normalized_status

        if normalized_status == "Closed":
            job.closed_at = datetime.utcnow()
            job.closed_by = recruiter_email or "recruiter"
            if closure_reason:
                job.closure_reason = closure_reason
        elif normalized_status == "Paused":
            job.paused_at = datetime.utcnow()
        elif normalized_status == "Active":
            pass

        db.commit()
        db.refresh(job)
        JobController._enrich_job(job)
        return job, None



