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
        scheduled_slot = payload.scheduled_at or "Upcoming slot"

        subject = f"[SPARKX CONFIRMED] AI Video Interview: {job_title}"
        body = (
            f"Dear {candidate.name},\n\n"
            f"Your AI Video Interview for the position of {job_title} has been officially confirmed!\n\n"
            f"INTERVIEW DETAILS:\n"
            f"• Position: {job_title}\n"
            f"• Scheduled Time: {scheduled_slot}\n"
            f"• Candidate Portal URL: http://localhost:3000\n"
            f"• Recruiter Notes: {payload.notes or 'None'}\n\n"
            f"HOW TO JOIN:\n"
            f"1. Log in to your SparkX Candidate Portal at http://localhost:3000.\n"
            f"2. Navigate to 'AI Interview Room' at your confirmed time.\n"
            f"3. Ensure your webcam, microphone, and a quiet environment are ready.\n\n"
            f"Best regards,\n"
            f"SparkX AI Recruitment Team"
        )

        html = f"""
        <div style="font-family: Arial, sans-serif; background-color: #070A12; color: #FFFFFF; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 800; color: #818cf8;">SparkX AI Recruitment</span>
          </div>
          <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">AI Video Interview Confirmed</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>{candidate.name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Your AI Video Interview for <strong>{job_title}</strong> has been officially confirmed.</p>
          
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <div style="margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Confirmed Slot</span>
              <div style="color: #38bdf8; font-size: 18px; font-weight: 700; margin-top: 4px;">{scheduled_slot}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Target Position</span>
              <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-top: 4px;">{job_title}</div>
            </div>
            {f'<div style="margin-bottom: 8px;"><span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Recruiter Notes</span><div style="color: #e2e8f0; font-size: 13px; margin-top: 4px;">{payload.notes}</div></div>' if payload.notes else ''}
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:3000" style="background: linear-gradient(135deg, #6366f1, #9333ea); color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Launch Candidate Portal</a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            <strong>Instructions:</strong> Please log in at your scheduled time and ensure your camera and microphone permissions are enabled.
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">SparkX AI Recruitment Intelligence Platform</p>
        </div>
        """

        email_event = {
            "id": f"eml-{uuid.uuid4().hex[:6]}",
            "type": "interview_invitation",
            "subject": subject,
            "sent_at": now_str,
            "recipient": candidate.email,
            "body": body
        }

        logs = list(candidate.email_logs or [])
        logs.append(email_event)
        candidate.email_logs = logs

        # Dispatch live SMTP email with plaintext + HTML
        send_email(email_event["recipient"], email_event["subject"], email_event["body"], html)

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
        scheduled_slot = candidate.interview_scheduled_at or "Upcoming Slot"

        if payload.template_type == "interview_invitation":
            subject = f"[SPARKX INTERVIEW] Invitation for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"You are invited to an AI Video Interview for the position of {job_title} at SparkX AI.\n\n"
                f"• Scheduled Slot: {scheduled_slot}\n"
                f"• Portal URL: http://localhost:3000\n\n"
                f"{payload.custom_message or 'Please log in to your candidate portal at the scheduled time.'}\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        elif payload.template_type == "interview_reminder":
            subject = f"[SPARKX REMINDER] Upcoming AI Interview for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"This is a reminder for your upcoming AI Video Interview for {job_title}.\n\n"
                f"• Scheduled Time: {scheduled_slot}\n"
                f"• Portal URL: http://localhost:3000\n\n"
                f"{payload.custom_message or 'Please ensure your camera and microphone are ready before joining.'}\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        elif payload.template_type == "offer_letter":
            subject = f"[SPARKX OFFER] Official Offer Letter: {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"Congratulations! We are delighted to officially offer you the position of {job_title} at SparkX AI.\n\n"
                f"{payload.custom_message or 'Our recruitment team was highly impressed with your interview performance and technical competencies.'}\n\n"
                f"Please log in to your candidate portal at http://localhost:3000 to view your dossier.\n\n"
                f"Warm regards,\nSparkX AI Talent Acquisition"
            )
        else:
            subject = f"[SPARKX UPDATE] Application Status for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"{payload.custom_message or f'Thank you for your interest in the {job_title} position. This is an update regarding your application status.'}\n\n"
                f"Portal URL: http://localhost:3000\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )

        html = f"""
        <div style="font-family: Arial, sans-serif; background-color: #070A12; color: #FFFFFF; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
          <h2 style="color: #818cf8; margin-top: 0; font-size: 20px;">SparkX AI Recruitment Notification</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>{candidate.name}</strong>,</p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin: 20px 0; color: #e2e8f0; font-size: 14px; line-height: 1.6; white-space: pre-line;">
            {body}
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="http://localhost:3000" style="background: linear-gradient(135deg, #6366f1, #9333ea); color: #ffffff; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Candidate Portal</a>
          </div>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center;">SparkX AI Recruitment Intelligence Platform</p>
        </div>
        """

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

        # Dispatch live SMTP email with plaintext + HTML
        send_email(email_event["recipient"], email_event["subject"], email_event["body"], html)

        if payload.template_type == "offer_letter":
            candidate.final_decision = "Offered"
            candidate.status = "Offered"
        elif payload.template_type == "rejection_notice":
            candidate.final_decision = "Rejected"
            candidate.status = "Rejected"

        db.commit()
        db.refresh(candidate)
        return email_event, None