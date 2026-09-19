"""
(C) Job Controller - Handles business logic for company requirements & question banks
"""
import uuid
from sqlalchemy.orm import Session
from models.db_models import JobModel
from schemas import JobCreate
from ai_engine import generate_job_questions

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
    def create_new_job(payload: JobCreate, db: Session):
        job_id = f"job-{uuid.uuid4().hex[:6]}"
        questions = payload.questions
        if not questions:
            questions = generate_job_questions(
                payload.title,
                payload.required_skills,
                payload.min_experience_years
            )

        new_job = JobModel(
            id=job_id,
            title=payload.title,
            department=payload.department,
            location=payload.location,
            min_experience_years=payload.min_experience_years,
            experience=f"{payload.min_experience_years}+ years",
            education=payload.education,
            languages=payload.languages,
            required_skills=payload.required_skills,
            optional_criteria=payload.optional_criteria,
            description=payload.description,
            questions=questions,
            coding_assessment=payload.coding_assessment or {
                "title": f"{payload.title} Practical Task",
                "language": "javascript",
                "instructions": "Implement the core data handler function.",
                "initialCode": "function handler(data) {\n  return data;\n}"
            },
            status="Active"
        )

        db.add(new_job)
        db.commit()
        db.refresh(new_job)
        new_job.applicants_count = 0
        return new_job
