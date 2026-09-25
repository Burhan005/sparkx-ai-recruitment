"""
(C) Interview Controller - Handles adaptive cross-questioning, telemetry events, and AI evaluation
"""
import uuid
from datetime import datetime
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel, IntegrityLogModel
from schemas import AdaptiveQuestionRequest, TelemetryEventCreate, EvaluationRequest, CandidateQuestionsRequest
from ai_engine import evaluate_adaptive_answer, calculate_scorecard_and_gap, synthesize_candidate_interview_questions
from workflow_contract import (
    validate_transition, project_legacy_status, project_legacy_final_decision,
    STAGE_INTERVIEW, STAGE_REVIEW
)
from controllers.candidate_controller import log_state_change

class InterviewController:
    @staticmethod
    def start_interview(candidate_id: str, db: Session) -> Tuple[bool, Optional[str]]:
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return False, "Candidate not found"

        # Check if interview is already in progress or completed
        if candidate.interview_status in ["in_progress", "completed"]:
            return True, None

        # Authorize: candidate must be scheduled (or invited)
        if candidate.interview_status not in ["scheduled", "invited"]:
            if not candidate.interview_scheduled_at:
                return False, "Interview access restricted: Candidate has not been scheduled for an interview."

        can_trans, err = validate_transition("interview_status", candidate.interview_status or "scheduled", "in_progress")
        if not can_trans:
            return False, err

        old_interview_status = candidate.interview_status or "scheduled"
        candidate.interview_status = "in_progress"
        candidate.interview_started_at = datetime.utcnow()
        log_state_change(
            db=db,
            candidate_id=candidate.id,
            dimension="interview_status",
            from_state=old_interview_status,
            to_state="in_progress",
            triggered_by="candidate",
            reason="Candidate joined and started the interview room session"
        )

        # Ensure stage reflects interview
        if candidate.stage != STAGE_INTERVIEW:
            old_stage = candidate.stage
            candidate.stage = STAGE_INTERVIEW
            candidate.stage_updated_at = datetime.utcnow()
            log_state_change(
                db=db,
                candidate_id=candidate.id,
                dimension="stage",
                from_state=old_stage,
                to_state=STAGE_INTERVIEW,
                triggered_by="candidate",
                reason="Interview session in progress"
            )

        # Update legacy projections without mutating hiring_decision
        candidate.status = project_legacy_status(candidate.stage, candidate.assessment_status, candidate.interview_status, candidate.hiring_decision)
        candidate.final_decision = project_legacy_final_decision(candidate.stage, candidate.hiring_decision)

        db.commit()
        db.refresh(candidate)
        return True, None

    @staticmethod
    def generate_candidate_questions(payload: CandidateQuestionsRequest, db: Session):
        job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
        cand = None
        if payload.candidate_id:
            cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()

        role_title = job.title if job else "Software Engineer"
        job_skills = job.required_skills if (job and job.required_skills) else []
        cand_name = cand.name if cand else (payload.candidate_name or "Candidate")
        cand_skills = cand.skills if (cand and cand.skills) else (payload.candidate_skills or [])
        exp_years = cand.experience_years if cand else (payload.experience_years or 2.0)
        cand_id = cand.id if cand else payload.candidate_id

        if job and job.questions and len(job.questions) > 0:
            questions = job.questions
        else:
            questions = synthesize_candidate_interview_questions(
                role_title=role_title,
                job_skills=job_skills,
                candidate_name=cand_name,
                candidate_skills=cand_skills,
                experience_years=exp_years,
                candidate_id=cand_id
            )

        return {
            "candidate_name": cand_name,
            "role_title": role_title,
            "questions": questions
        }

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

        # Interview status -> completed
        old_interview_status = candidate.interview_status or "in_progress"
        candidate.interview_status = "completed"
        candidate.interview_completed_at = datetime.utcnow()
        log_state_change(
            db=db,
            candidate_id=candidate.id,
            dimension="interview_status",
            from_state=old_interview_status,
            to_state="completed",
            triggered_by="system",
            reason="AI interview session concluded and evaluated"
        )

        # Advance stage to review if in interview stage
        if candidate.stage == STAGE_INTERVIEW:
            old_stage = candidate.stage
            candidate.stage = STAGE_REVIEW
            candidate.stage_updated_at = datetime.utcnow()
            log_state_change(
                db=db,
                candidate_id=candidate.id,
                dimension="stage",
                from_state=old_stage,
                to_state=STAGE_REVIEW,
                triggered_by="system",
                reason="Interview completed; application in review stage"
            )

        # IMPORTANT: Do NOT mutate candidate.hiring_decision! Human recruiter committee decides.
        # Project legacy projections
        candidate.status = project_legacy_status(candidate.stage, candidate.assessment_status, candidate.interview_status, candidate.hiring_decision)
        candidate.final_decision = project_legacy_final_decision(candidate.stage, candidate.hiring_decision)

        db.commit()
        db.refresh(candidate)
        return evaluation, None

