"""
(C) Candidate Controller - Screening, resume parsing, interview scheduling, and email dispatch
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel
from schemas import CandidateApply, CandidateStatusUpdate, CandidateScheduleRequest, EmailSendRequest
from email_service import send_email

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
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Initial automated confirmation email
        initial_email = {
            "id": f"eml-{uuid.uuid4().hex[:6]}",
            "type": "application_received",
            "subject": f"Application Received — {job.title} at SparkX AI",
            "sent_at": now_str,
            "recipient": payload.email,
            "body": f"Dear {payload.name},\n\nThank you for applying for the position of {job.title}. Your resume has been parsed and matched against our core competency benchmarks (Match Score: {match_score}%).\n\nNext Step: Your profile is ready for your AI Video Interview session.\n\nBest regards,\nSparkX AI Talent Acquisition Team"
        }

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
            final_decision="Pending Interview",
            interview_status="Applied",
            email_logs=[initial_email]
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

    @staticmethod
    def schedule_interview(candidate_id: str, payload: CandidateScheduleRequest, db: Session):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        candidate.interview_scheduled_at = payload.scheduled_at
        candidate.interview_status = "Interview Scheduled"

        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        job_title = candidate.job.title if candidate.job else "Target Role"

        email_event = {
            "id": f"eml-{uuid.uuid4().hex[:6]}",
            "type": "interview_invitation",
            "subject": f"CONFIRMED: SparkX AI Video Interview for {job_title}",
            "sent_at": now_str,
            "recipient": candidate.email,
            "body": f"Dear {candidate.name},\n\nYour AI Video Interview for {job_title} has been scheduled for {payload.scheduled_at}.\n\nInstructions:\n1. Log in to your SparkX Candidate Portal at your scheduled slot.\n2. Ensure your webcam and microphone are active.\n\nNotes from Recruiter: {payload.notes or 'None'}\n\nBest regards,\nSparkX Recruitment Hub"
        }

        logs = list(candidate.email_logs or [])
        logs.append(email_event)
        candidate.email_logs = logs

        # Dispatch live SMTP email (or dev telemetry log)
        send_email(email_event["recipient"], email_event["subject"], email_event["body"])

        db.commit()
        db.refresh(candidate)
        return candidate, None

    @staticmethod
    def send_email_notification(candidate_id: str, payload: EmailSendRequest, db: Session):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        job_title = candidate.job.title if candidate.job else "Open Role"

        subject_map = {
            "interview_invitation": f"Interview Invitation — {job_title}",
            "interview_reminder": f"Reminder: AI Interview Scheduled — {job_title}",
            "offer_letter": f"🎉 OFFICIAL OFFER: {job_title} at SparkX AI",
            "rejection_notice": f"Update regarding your application for {job_title}"
        }

        subject = subject_map.get(payload.template_type, f"Update regarding {job_title}")
        body = payload.custom_message or f"Dear {candidate.name},\n\nThis is an official update regarding your application for {job_title}.\n\nBest regards,\nSparkX AI Recruitment Team"

        email_event = {
            "id": f"eml-{uuid.uuid4().hex[:6]}",
            "type": payload.template_type,
            "subject": subject,
            "sent_at": now_str,
            "recipient": candidate.email,
            "body": body
        }

        logs = list(candidate.email_logs or [])
        logs.append(email_event)
        candidate.email_logs = logs

        # Dispatch live SMTP email (or dev telemetry log)
        send_email(email_event["recipient"], email_event["subject"], email_event["body"])

        if payload.template_type == "offer_letter":
            candidate.final_decision = "Offered"
            candidate.status = "Offered"
        elif payload.template_type == "rejection_notice":
            candidate.final_decision = "Rejected"
            candidate.status = "Rejected"

        db.commit()
        db.refresh(candidate)
        return email_event, None