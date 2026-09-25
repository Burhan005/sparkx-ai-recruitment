"""
(C) Job Controller - Handles business logic for company requirements & question banks
"""
import uuid
from sqlalchemy.orm import Session
from models.db_models import JobModel
from schemas import JobCreate, JobUpdate, JobMatchRequest, BatchJobMatchRequest
from ai_engine import generate_job_questions, calculate_resume_job_match
from services.compensation_service import format_job_compensation

class JobController:
    @staticmethod
    def _enrich_job(j: JobModel) -> JobModel:
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
        return j

    @staticmethod
    def get_all_jobs(db: Session, skip: int = 0, limit: int = 100):
        jobs = db.query(JobModel).offset(skip).limit(limit).all()
        for j in jobs:
            JobController._enrich_job(j)
        return jobs

    @staticmethod
    def get_job_by_id(job_id: str, db: Session):
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        return JobController._enrich_job(job) if job else None

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
    def create_new_job(payload: JobCreate, db: Session):
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

        new_job = JobModel(
            id=job_id,
            title=payload.title,
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
        JobController._enrich_job(new_job)
        return new_job


    @staticmethod
    def update_job(job_id: str, payload: JobUpdate, db: Session):
        """
        Recruiter-only: Updates existing job specification & compensation budget.
        CRITICAL ARCHITECTURAL GUARANTEE: Does NOT mutate candidate-submitted expectations.
        Historical candidate application records remain 100% intact.
        """
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            return None, "Job not found"

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
        JobController._enrich_job(job)
        return job, None


