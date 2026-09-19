"""
(C) Interview Controller - Handles adaptive cross-questioning, telemetry events, and AI evaluation
"""
import uuid
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel, IntegrityLogModel
from schemas import AdaptiveQuestionRequest, TelemetryEventCreate, EvaluationRequest
from ai_engine import evaluate_adaptive_answer, calculate_scorecard_and_gap

class InterviewController:
    @staticmethod
    def process_adaptive_question(payload: AdaptiveQuestionRequest):
        return evaluate_adaptive_answer(
            prompt=payload.question_prompt,
            answer=payload.candidate_answer,
            ideal_keywords=payload.ideal_keywords or [],
            follow_up_vague=payload.follow_up_vague,
            follow_up_expert=payload.follow_up_expert
        )

    @staticmethod
    def record_telemetry(payload: TelemetryEventCreate, db: Session):
        log_id = f"ev-{uuid.uuid4().hex[:6]}"
        event = IntegrityLogModel(
            id=log_id,
            candidate_id=payload.candidate_id,
            timestamp=payload.timestamp,
            event_type=payload.event_type,
            description=payload.description,
            severity=payload.severity
        )
        db.add(event)
        db.commit()
        return log_id

    @staticmethod
    def evaluate_session(payload: EvaluationRequest, db: Session):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
        job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()

        if not candidate or not job:
            return None, "Candidate or Job not found"

        evaluation = calculate_scorecard_and_gap(
            job_skills=job.required_skills or [],
            candidate_skills=candidate.skills or [],
            transcript=payload.transcript,
            integrity_score=payload.integrity_score,
            code_score=payload.code_score
        )

        risk = "Low"
        if payload.integrity_score < 60:
            risk = "High"
        elif payload.integrity_score < 80:
            risk = "Medium"

        # Update candidate record
        candidate.scores = evaluation["scores"]
        candidate.interview_summary = evaluation["interview_summary"]
        candidate.evidence_snippets = evaluation["evidence_snippets"]
        candidate.skill_gaps = evaluation["skill_gaps"]
        candidate.integrity_score = payload.integrity_score
        candidate.integrity_risk = risk
        candidate.integrity_events = payload.integrity_events
        candidate.status = "Evaluated"
        candidate.final_decision = "Shortlisted" if evaluation["scores"]["overall"] >= 80 and risk == "Low" else "Under Review"

        db.commit()
        return evaluation, None
