"""
(C) Job Controller - Handles business logic for company requirements & question banks
"""
import uuid
from sqlalchemy.orm import Session
from models.db_models import JobModel
from schemas import JobCreate, JobMatchRequest, BatchJobMatchRequest
from ai_engine import generate_job_questions, calculate_resume_job_match

class JobController:
    @staticmethod
    def get_all_jobs(db: Session):
        jobs = db.query(JobModel).all()
        for j in jobs:
            j.applicants_count = len(j.candidates)
        return jobs

    @staticmethod
    def get_job_by_id(job_id: str, db: Session):
        return db.query(JobModel).filter(JobModel.id == job_id).first()

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
        
        default_assessment = (
            {
                "title": f"{payload.title} Practical Task",
                "language": "javascript",
                "is_coding": True,
                "instructions": "Implement the core data handler function.",
                "initialCode": "function handler(data) {\n  return data;\n}"
            } if is_coding else {
                "title": f"{payload.title} Case Study & Simulation",
                "is_coding": False,
                "domain_category": domain_cat,
                "instructions": f"Review the operational scenario and provide an executive deliverable for {payload.title}.",
                "initialCode": "Provide executive summary, core analysis, and action recommendations."
            }
        )
        final_assessment = payload.coding_assessment or default_assessment

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
            coding_assessment=(
                {**final_assessment, "is_coding": False} 
                if (not is_coding and isinstance(final_assessment, dict)) 
                else final_assessment
            ),
            coding_difficulty=payload.coding_difficulty if is_coding else None,
            status="Active"
        )

        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        new_job.applicants_count = 0
        return new_job

