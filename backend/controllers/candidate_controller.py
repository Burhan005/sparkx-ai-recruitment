"""
(C) Candidate Controller - Handles screening, resume parsing, match score, and HR decisions
"""
import uuid
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel
from schemas import CandidateApply, CandidateStatusUpdate

class CandidateController:
    @staticmethod
    def get_all_candidates(db: Session):
        return db.query(CandidateModel).all()

    @staticmethod
    def get_candidate_by_id(candidate_id: str, db: Session):
        return db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()

    @staticmethod
    def apply_candidate(payload: CandidateApply, db: Session):
        job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
        if not job:
            return None, "Job not found"

        # Automated screening & matching algorithm
        req_skills = [s.lower() for s in (job.required_skills or [])]
        cand_skills = [s.lower() for s in payload.skills]
        matches = sum(1 for req in req_skills if any(req in cs or cs in req for cs in cand_skills))
        
        score = int((matches / max(1, len(req_skills))) * 70)
        score += 25 if payload.experience_years >= job.min_experience_years else 10
        match_score = min(98, max(35, score))

        cand_id = f"cand-{uuid.uuid4().hex[:6]}"
        new_candidate = CandidateModel(
            id=cand_id,
            job_id=job.id,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            match_score=match_score,
            experience_years=payload.experience_years,
            education=payload.education,
            skills=payload.skills,
            resume_summary=payload.resume_summary or "Candidate profile extracted.",
            fraud_flags=payload.fraud_flags or [],
            status="Screening",
            final_decision="Pending Interview"
        )

        db.add(new_candidate)
        db.commit()
        db.refresh(new_candidate)
        return new_candidate, None

    @staticmethod
    def update_status(candidate_id: str, payload: CandidateStatusUpdate, db: Session):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return False

        candidate.final_decision = payload.status
        candidate.status = "Rejected" if payload.status == "Rejected" else "Evaluated"
        if payload.hr_notes:
            candidate.hr_notes = payload.hr_notes

        db.commit()
        return True
