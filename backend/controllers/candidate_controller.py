"""
(C) Candidate Controller - Screening, resume parsing, interview scheduling, and email dispatch
"""
import os
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel
from schemas import CandidateApply, CandidateStatusUpdate, CandidateScheduleRequest, EmailSendRequest
from email_service import send_email, create_ics_calendar_event, parse_slot_to_datetime
from ai_engine import calculate_resume_job_match

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

        # Authoritative, context-aware resume-to-job matching analysis
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
            "name": payload.name,
            "skills": payload.skills or [],
            "experience_years": payload.experience_years or 0.0,
            "job_role": getattr(payload, "job_role", "") or "",
            "education": payload.education or "",
            "resume_summary": payload.resume_summary or "",
            "resume_text": payload.resume_text or ""
        }

        match_result = calculate_resume_job_match(job_data, candidate_data)
        match_score = match_result.get("match_score", 0)
        match_details = match_result

        comp_name = getattr(job, "company_name", "SparkX Technologies") or payload.company_name or "SparkX Technologies"
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Check if candidate has already applied for this job
        existing = db.query(CandidateModel).filter(
            CandidateModel.job_id == job.id,
            CandidateModel.email == payload.email.strip().lower()
        ).first()

        if existing:
            # Update existing application with latest resume/details
            existing.name = payload.name
            existing.phone = payload.phone or existing.phone
            existing.skills = payload.skills
            existing.experience_years = payload.experience_years
            existing.education = payload.education
            existing.match_score = match_score
            existing.match_details = match_details
            existing.company_name = comp_name
            if payload.resume_summary:
                existing.resume_summary = payload.resume_summary
            if payload.resume_filename:
                existing.resume_filename = payload.resume_filename
            if payload.resume_text:
                existing.resume_text = payload.resume_text
            db.commit()
            db.refresh(existing)
            return existing, None

        cand_id = f"cand-{uuid.uuid4().hex[:6]}"

        # Initial automated confirmation email
        initial_email = {
            "id": f"eml-{uuid.uuid4().hex[:6]}",
            "type": "application_received",
            "subject": f"Application Received — {job.title} at {comp_name}",
            "sent_at": now_str,
            "recipient": payload.email,
            "body": f"Dear {payload.name},\n\nThank you for applying for the position of {job.title} at {comp_name}. Your application and resume have been received and placed in our recruiter screening pipeline.\n\nYour application is currently Under Review.\n\nBest regards,\nSparkX AI Talent Acquisition Team"
        }

        new_candidate = CandidateModel(
            id=cand_id,
            job_id=job.id,
            company_name=comp_name,
            name=payload.name,
            email=payload.email.strip().lower(),
            phone=payload.phone,
            match_score=match_score,
            match_details=match_details,
            experience_years=payload.experience_years,
            education=payload.education,
            skills=payload.skills,
            resume_summary=payload.resume_summary or "Candidate profile extracted.",
            resume_filename=payload.resume_filename,
            resume_text=payload.resume_text,
            fraud_flags=payload.fraud_flags or [],
            status="Applied",
            final_decision="Applied",
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

        # Status normalization to the 6 shared standard statuses:
        # "Applied", "Under Review", "Shortlisted", "Interview", "Selected", "Rejected"
        raw_status = payload.status.strip().lower()
        status_map = {
            "applied": "Applied",
            "screening": "Applied",
            "under review": "Under Review",
            "evaluated": "Under Review",
            "shortlisted": "Shortlisted",
            "interview": "Interview",
            "interview scheduled": "Interview",
            "scheduled": "Interview",
            "selected": "Selected",
            "offered": "Selected",
            "offer": "Selected",
            "rejected": "Rejected"
        }
        canonical_status = status_map.get(raw_status, payload.status.strip())

        # ONE shared status reflected for both candidate and recruiter
        candidate.status = canonical_status
        candidate.final_decision = canonical_status

        if canonical_status == "Interview":
            candidate.interview_status = "Interview Scheduled"
            if not candidate.interview_scheduled_at:
                candidate.interview_scheduled_at = "Upcoming Slot"
            if not candidate.interview_meeting_url:
                short_id = candidate.id.replace("cand-", "")[:6]
                candidate.interview_meeting_url = f"https://meet.google.com/spk-{short_id[:3]}-{short_id[3:] or 'rec'}"
        elif canonical_status == "Applied":
            candidate.interview_status = "Applied"
            candidate.interview_scheduled_at = None
            candidate.interview_meeting_url = None
        elif canonical_status == "Selected":
            candidate.interview_status = "Offer Sent"
        elif canonical_status == "Rejected":
            candidate.interview_status = "Rejected"

        if payload.hr_notes is not None:
            candidate.hr_notes = payload.hr_notes

        if payload.recruiter_score is not None:
            candidate.recruiter_score = payload.recruiter_score

        if payload.rejection_reason is not None:
            candidate.rejection_reason = payload.rejection_reason

        if payload.rejection_category is not None:
            candidate.rejection_category = payload.rejection_category

        db.commit()
        return True

    @staticmethod
    def get_candidate_applications(email: str, db: Session):
        clean_email = email.strip().lower()
        applications = db.query(CandidateModel).filter(CandidateModel.email.ilike(clean_email)).order_by(CandidateModel.created_at.desc()).all()
        result = []
        for app in applications:
            job = app.job
            comp_name = app.company_name or (job.company_name if job else "SparkX Technologies")
            disp_status = app.status or app.final_decision or "Under Review"

            assess_data = app.assessment_data or {}
            is_assess_completed = bool(assess_data.get("is_completed") or (app.coding_score is not None and app.coding_score > 0) or (app.status and app.status not in ["Applied", "Screening"]))
            assess_status = "Completed" if is_assess_completed else "Pending"

            result.append({
                "id": app.id,
                "job_id": app.job_id,
                "job_title": job.title if job else "Technical Role",
                "company_name": comp_name,
                "department": job.department if job else "Engineering",
                "location": job.location if job else "Remote",
                "applied_date": app.applied_date,
                "status": disp_status,
                "final_decision": disp_status,
                "match_score": None,
                "experience_years": app.experience_years,
                "skills": app.skills or [],
                "resume_filename": app.resume_filename,
                "resume_summary": app.resume_summary,
                "interview_scheduled_at": app.interview_scheduled_at,
                "interview_meeting_url": app.interview_meeting_url,
                "interview_status": app.interview_status or "Applied",
                "assessment_status": assess_status,
                "coding_score": None,
                "recruiter_score": None,
                "rejection_reason": app.rejection_reason,
                "rejection_category": app.rejection_category,
                "hr_notes": app.hr_notes,
                "match_details": None
            })
        return result

    @staticmethod
    def schedule_interview(candidate_id: str, payload: CandidateScheduleRequest, db: Session):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        candidate.interview_scheduled_at = payload.scheduled_at
        candidate.interview_status = "Interview Scheduled"

        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        job_title = candidate.job.title if candidate.job else "Target Position"
        job_skills = candidate.job.required_skills if (candidate.job and candidate.job.required_skills) else (candidate.skills or [])
        skills_str = ", ".join(job_skills) if job_skills else "Job Competencies"
        scheduled_slot = payload.scheduled_at or "Upcoming slot"
        notes_clean = payload.notes.strip() if payload.notes else ""
        notes_line = f"\n• Recruiter Notes: {notes_clean}" if notes_clean else ""

        # Determine dynamic or recruiter-supplied Google Meet conference credentials
        custom_url = (payload.meeting_url or "").strip()
        if custom_url:
            meet_url = custom_url
            clean_part = custom_url.split("?")[0].rstrip("/")
            meet_code = clean_part.split("/")[-1] if "/" in clean_part else custom_url
        else:
            short_id = candidate.id.replace("cand-", "")[:6]
            meet_code = f"spk-{short_id[:3]}-{short_id[3:] or 'rec'}"
            meet_url = f"https://meet.google.com/{meet_code}"

        candidate.interview_meeting_url = meet_url
        pin_code = f"{abs(hash(candidate.id)) % 900000 + 100000}"

        subject = f"[SPARKX CONFIRMED] AI Video Interview: {job_title}"
        body = (
            f"Dear {candidate.name},\n\n"
            f"Your AI Video Interview for the position of {job_title} has been officially confirmed!\n\n"
            f"INTERVIEW DETAILS:\n"
            f"• Target Position: {job_title}\n"
            f"• Assessed Competencies: {skills_str}\n"
            f"• Scheduled Slot: {scheduled_slot}{notes_line}\n\n"
            f"VIDEO CONFERENCE CREDENTIALS:\n"
            f"• Platform: Google Meet\n"
            f"• Direct Video Link: {meet_url}\n"
            f"• Meeting ID: {meet_code}\n"
            f"• Access Passcode / PIN: {pin_code}\n"
            f"• SparkX AI Candidate Portal: http://localhost:3000\n\n"
            f"HOW TO JOIN:\n"
            f"1. To join via Google Meet: Click {meet_url} at your scheduled time (Passcode: {pin_code}).\n"
            f"2. To join via SparkX AI Portal: Log in at http://localhost:3000 and enter 'AI Interview Room'.\n"
            f"3. Ensure your webcam, microphone, and a quiet environment are ready.\n\n"
            f"Best regards,\n"
            f"SparkX AI Recruitment Team"
        )

        html = f"""
        <div style="font-family: Arial, sans-serif; background-color: #070A12; color: #FFFFFF; padding: 32px; border-radius: 16px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 800; color: #818cf8; font-family: Arial, sans-serif;">SparkX AI Recruitment</span>
          </div>
          <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-family: Arial, sans-serif;">AI Video Interview Confirmed</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">Hello <strong>{candidate.name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">Your interview for <strong>{job_title}</strong> has been officially scheduled.</p>
          
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <div style="margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; font-family: Arial, sans-serif;">Confirmed Slot</span>
              <div style="color: #38bdf8; font-size: 18px; font-weight: 700; margin-top: 4px; font-family: Arial, sans-serif;">{scheduled_slot}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; font-family: Arial, sans-serif;">Target Position</span>
              <div style="color: #ffffff; font-size: 15px; font-weight: 600; margin-top: 4px; font-family: Arial, sans-serif;">{job_title}</div>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; font-family: Arial, sans-serif;">Assessed Competencies</span>
              <div style="color: #a5b4fc; font-size: 13px; font-weight: 500; margin-top: 4px; font-family: Arial, sans-serif;">{skills_str}</div>
            </div>
            {f'<div style="margin-bottom: 8px;"><span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; font-family: Arial, sans-serif;">Recruiter Notes</span><div style="color: #e2e8f0; font-size: 13px; margin-top: 4px; font-family: Arial, sans-serif;">{notes_clean}</div></div>' if notes_clean else ''}
          </div>

          <!-- Video Conference Credentials Box -->
          <div style="background-color: #1e293b; border: 1px solid #475569; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <div style="font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.5px; font-family: Arial, sans-serif;">Google Meet Conference Access</div>
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px; font-family: Arial, sans-serif;">• <strong>Meeting Link:</strong> <a href="{meet_url}" target="_blank" style="color: #60a5fa; text-decoration: underline;">{meet_url}</a></div>
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px; font-family: Arial, sans-serif;">• <strong>Meeting ID:</strong> <span style="font-family: monospace; color: #facc15; font-weight: bold;">{meet_code}</span></div>
            <div style="font-size: 13px; color: #cbd5e1; font-family: Arial, sans-serif;">• <strong>Passcode / PIN:</strong> <span style="font-family: monospace; color: #4ade80; font-weight: bold;">{pin_code}</span></div>
          </div>

          <!-- Bulletproof Action Buttons Table Layout -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0; text-align: center;">
            <tr>
              <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="padding: 6px 8px;">
                      <a href="{meet_url}" target="_blank" style="background-color: #1a73e8; color: #ffffff; padding: 13px 22px; border-radius: 10px; text-decoration: none; font-family: Arial, sans-serif; font-weight: bold; font-size: 13px; display: inline-block; line-height: 1.2; text-align: center; border: 1px solid #1a73e8; min-width: 160px; box-sizing: border-box;">📹 Join Google Meet</a>
                    </td>
                    <td align="center" style="padding: 6px 8px;">
                      <a href="http://localhost:3000" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 13px 22px; border-radius: 10px; text-decoration: none; font-family: Arial, sans-serif; font-weight: bold; font-size: 13px; display: inline-block; line-height: 1.2; text-align: center; border: 1px solid #4f46e5; min-width: 160px; box-sizing: border-box;">⚡ Launch SparkX Portal</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; font-family: Arial, sans-serif;">
            <strong>Instructions:</strong> You can join via Google Meet (enter Passcode: {pin_code} if prompted) or directly through the SparkX AI Portal. Ensure camera and microphone permissions are enabled.
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center; font-family: Arial, sans-serif;">SparkX AI Recruitment Intelligence Platform</p>
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

        # Generate automatic iCalendar (.ics) meeting invite with Google Meet integration
        start_dt = parse_slot_to_datetime(scheduled_slot)
        organizer = os.environ.get("SMTP_FROM_EMAIL", "bkapasi472@rku.ac.in")
        ics_data = create_ics_calendar_event(
            event_id=candidate.id,
            summary=f"SparkX AI Video Interview: {job_title}",
            description=f"AI Video Interview for {job_title} at SparkX AI.\nAssessed Competencies: {skills_str}\nGoogle Meet Call: {meet_url}\nMeeting ID: {meet_code} | Passcode: {pin_code}\nPortal URL: http://localhost:3000\n{notes_line}",
            start_dt=start_dt,
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            organizer_email=organizer,
            meet_url=meet_url
        )

        # Dispatch live SMTP email with plaintext + HTML + automatic Meeting Invite (.ics) to candidate
        send_email(
            email_event["recipient"], 
            email_event["subject"], 
            email_event["body"], 
            html, 
            ics_content=ics_data
        )

        # Also dispatch an interview invite confirmation copy to the recruiter's Gmail inbox
        if organizer and organizer.lower() != candidate.email.strip().lower():
            recruiter_subject = f"[RECRUITER SCHEDULED] Interview with {candidate.name}: {job_title}"
            send_email(
                organizer,
                recruiter_subject,
                email_event["body"],
                html,
                ics_content=ics_data
            )

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
        if candidate.interview_meeting_url:
            meet_url = candidate.interview_meeting_url
            clean_part = meet_url.split("?")[0].rstrip("/")
            meet_code = clean_part.split("/")[-1] if "/" in clean_part else meet_url
        else:
            meet_code = f"spk-{candidate.id[-4:]}-rec"
            meet_url = f"https://meet.google.com/{meet_code}"

        if payload.template_type == "interview_invitation":
            subject = f"[SPARKX INTERVIEW] Invitation for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"You are invited to an AI Video Interview for the position of {job_title} at SparkX AI.\n\n"
                f"• Scheduled Slot: {scheduled_slot}\n"
                f"• Google Meet Link: {meet_url}\n"
                f"• SparkX Portal URL: http://localhost:3000\n\n"
                f"{payload.custom_message or 'Please join at the scheduled time using the link above.'}\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        elif payload.template_type == "interview_reminder":
            subject = f"[SPARKX REMINDER] Upcoming AI Interview for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"This is a reminder for your upcoming AI Video Interview for {job_title}.\n\n"
                f"• Scheduled Time: {scheduled_slot}\n"
                f"• Google Meet Link: {meet_url}\n"
                f"• SparkX Portal URL: http://localhost:3000\n\n"
                f"{payload.custom_message or 'Please ensure your camera and microphone are ready before joining.'}\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        elif payload.template_type == "offer_letter":
            subject = f"[SPARKX OFFER] Official Offer Letter: {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"Congratulations! We are delighted to officially offer you the position of {job_title} at SparkX AI.\n\n"
                f"{payload.custom_message or 'Our recruitment team was highly impressed with your interview performance and technical competencies.'}\n\n"
                f"Please log in to your candidate portal at http://localhost:3000 to view your formal offer details.\n\n"
                f"Warmest regards,\nSparkX AI Talent Acquisition"
            )
        elif payload.template_type == "rejection_notice":
            subject = f"[SPARKX NOTICE] Update on your application for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"Thank you for your interest in the position of {job_title} at SparkX AI and for taking the time to participate in our recruitment assessment.\n\n"
                f"After careful consideration of all applications, we regret to inform you that we will not be moving forward with your candidacy for this position at this time.\n\n"
                f"{payload.custom_message or 'Our hiring team reviewed your qualifications thoroughly; however, we have chosen to advance candidates whose immediate background more directly aligns with the specific requirements of this opening.'}\n\n"
                f"We genuinely appreciate your time, effort, and interest in SparkX AI. We will keep your resume on file for future opportunities that match your expertise.\n\n"
                f"We wish you the very best in your professional endeavors.\n\n"
                f"Sincerely,\nSparkX AI Talent Acquisition Team"
            )
        else:
            subject = f"[SPARKX UPDATE] Application Status for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"{payload.custom_message or f'Thank you for your interest in the {job_title} position. This is an update regarding your application status.'}\n\n"
                f"Portal URL: http://localhost:3000\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )

        # Status badge for HTML card
        status_badge_color = "#4f46e5"
        status_badge_text = "Application Update"
        if payload.template_type == "offer_letter":
            status_badge_color = "#059669"
            status_badge_text = "Official Offer"
        elif payload.template_type == "rejection_notice":
            status_badge_color = "#e11d48"
            status_badge_text = "Application Decision"

        html = f"""
        <div style="font-family: Arial, sans-serif; background-color: #070A12; color: #FFFFFF; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #1e293b;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
            <tr>
              <td align="left">
                <span style="font-size: 18px; font-weight: 800; color: #818cf8; font-family: Arial, sans-serif;">SparkX AI Recruitment</span>
              </td>
              <td align="right">
                <span style="background-color: {status_badge_color}; color: #ffffff; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; font-family: Arial, sans-serif; display: inline-block;">{status_badge_text}</span>
              </td>
            </tr>
          </table>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">Hello <strong>{candidate.name}</strong>,</p>
          <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 20px 0; color: #e2e8f0; font-size: 14px; line-height: 1.7; white-space: pre-line; font-family: Arial, sans-serif;">
            {body}
          </div>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; text-align: center;">
            <tr>
              <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="background-color: #4f46e5; border-radius: 10px;">
                      <a href="http://localhost:3000" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 13px 28px; border-radius: 10px; text-decoration: none; font-family: Arial, sans-serif; font-weight: bold; font-size: 13px; display: inline-block; text-align: center; border: 1px solid #4f46e5;">Open Candidate Portal</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
          <p style="color: #64748b; font-size: 11px; text-align: center; font-family: Arial, sans-serif;">SparkX AI Recruitment Intelligence Platform</p>
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

    @staticmethod
    def parse_resume_content(file_bytes: bytes = None, filename: str = None, raw_text: str = None):
        import re
        extracted_text = ""
        if file_bytes:
            fn = (filename or "").lower()
            if fn.endswith(".pdf") or file_bytes.startswith(b"%PDF"):
                try:
                    import io
                    import pypdf
                    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                    pages = [p.extract_text() for p in reader.pages if p.extract_text()]
                    extracted_text = "\n".join(pages).strip()
                except Exception as e:
                    print(f"[CandidateController] PDF extract error: {e}")
            if not extracted_text:
                try:
                    extracted_text = file_bytes.decode("utf-8", errors="ignore").strip()
                except Exception:
                    pass
        elif raw_text:
            extracted_text = raw_text.strip()

        if not extracted_text:
            return {"success": False, "error": "Could not extract text from resume"}

        text = extracted_text
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        # Email
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        email = email_match.group(0) if email_match else ""

        # Phone
        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else ""

        # Name
        name = ""
        name_line_match = re.search(r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s*[-–—]\s*Resume', text, re.MULTILINE)
        if name_line_match:
            name = name_line_match.group(1)
        else:
            for l in lines[:4]:
                if "@" not in l and "http" not in l and len(l.split()) in (2, 3) and not any(ch.isdigit() for ch in l):
                    name = l
                    break
            if not name and email:
                name = email.split("@")[0].replace(".", " ").replace("_", " ").title()

        # Experience
        current_year = 2026
        ranges = re.findall(r'\b(20\d\d)\s*[-–—to]+\s*(present|current|now|20\d\d)\b', text.lower())
        total_exp = 0.0
        for s_yr, e_yr in ranges:
            start = int(s_yr)
            end = current_year if e_yr in ("present", "current", "now") else int(e_yr)
            if end >= start:
                total_exp += (end - start)
        if total_exp == 0.0:
            exp_m = re.search(r'(\d+)\+?\s*years?', text.lower())
            if exp_m:
                total_exp = float(exp_m.group(1))

        # Education
        edu_list = []
        edu_terms = [
            "Master of Accounting", "Bachelor of Science in Finance", "Certified Public Accountant (CPA)",
            "CPA", "Master of Business Administration (MBA)", "B.Tech in Computer Science",
            "M.Tech", "B.S. in Computer Science", "B.Com", "M.Com", "Bachelor", "Master", "PhD"
        ]
        for term in edu_terms:
            if re.search(r'\b' + re.escape(term) + r'\b', text, re.I):
                if term not in edu_list:
                    edu_list.append(term)
        education = ", ".join(edu_list[:3]) if edu_list else "Bachelor's Degree"

        # Role
        role = ""
        role_match = re.search(r'(?:Senior|Lead|Principal|Staff|Associate)?\s*(?:Financial Controller & Tax Auditor|Financial Controller|Tax Auditor|Cloud Engineer|Software Engineer|Full-Stack Engineer|Data Scientist|Accountant)', text, re.I)
        if role_match:
            role = role_match.group(0).strip()

        # Skills Extraction with Typo Normalization (e.g., docket -> Docker)
        skills = []
        competency_section = re.search(r'(?:Core Competencies|Skills|Technical Skills)\s*([\s\S]*?)(?:Professional Experience|Experience|Education|$)', text, re.I)
        if competency_section:
            raw_skills = competency_section.group(1)
            for line in raw_skills.splitlines():
                line = line.strip().strip("•-*")
                if line and len(line) < 40 and not line.lower().startswith("professional"):
                    parts = re.split(r'[/,;]', line)
                    for p in parts:
                        clean_p = p.strip()
                        if clean_p and len(clean_p) > 1:
                            try:
                                from backend.ai_engine import normalize_skill_name
                                normalized_p = normalize_skill_name(clean_p)
                            except Exception:
                                normalized_p = clean_p
                            if normalized_p and normalized_p not in skills:
                                skills.append(normalized_p)

        summary = ""
        sum_match = re.search(r'(?:Strategic|Experienced|Certified|Senior|Dedicated)[\s\S]*?\.\s*(?=[A-Z][a-z]+ [A-Z]|\n\n)', text)
        if sum_match:
            summary = sum_match.group(0).strip().replace("\n", " ")

        return {
            "success": True,
            "data": {
                "name": name,
                "email": email,
                "phone": phone,
                "experience_years": round(total_exp, 1),
                "education": education,
                "job_role": role,
                "skills": skills,
                "resume_summary": summary[:400] if summary else text[:300],
                "resume_text": text
            }
        }