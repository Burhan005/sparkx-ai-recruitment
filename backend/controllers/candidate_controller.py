"""
(C) Candidate Controller - Screening, resume parsing, interview scheduling, and email dispatch
"""
import os
import uuid
from datetime import datetime, timedelta
from sqlalchemy import or_
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel, CandidateStateLogModel, UserModel
from schemas import (
    CandidateApply, CandidateStatusUpdate, CandidateScheduleRequest, 
    EmailSendRequest, CandidateStageUpdate, HiringDecisionUpdate, AssessmentInviteRequest
)
from email_service import send_email, create_ics_calendar_event, parse_slot_to_datetime
from ai_engine import calculate_resume_job_match
from google_meet_service import is_google_connected, create_google_meet_event
from services.compensation_service import (
    analyze_candidate_application,
    format_job_compensation,
    format_candidate_expectation
)
from workflow_contract import (
    STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT, STAGE_INTERVIEW, STAGE_REVIEW, STAGE_COMPLETED,
    ASSESS_NOT_INVITED, ASSESS_INVITED, ASSESS_IN_PROGRESS, ASSESS_SUBMITTED, ASSESS_EVALUATED,
    INTERVIEW_NOT_SCHEDULED, INTERVIEW_SCHEDULED, INTERVIEW_IN_PROGRESS, INTERVIEW_COMPLETED,
    DECISION_UNDECIDED, DECISION_SHORTLISTED, DECISION_SELECTED, DECISION_REJECTED,
    validate_stage_transition, validate_decision_transition,
    project_legacy_status, project_legacy_final_decision
)

class CandidateController:
    @staticmethod
    def _enrich_candidate(c: CandidateModel) -> CandidateModel:
        if c:
            job = getattr(c, "job", None)
            c.compensation_analysis = analyze_candidate_application(c, job)
        return c

    @staticmethod
    def get_all_candidates(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        job_id: str = None,
        compensation_status: str = None,
        min_expected_ctc: float = None,
        max_expected_ctc: float = None,
        q: str = None
    ):
        query = db.query(CandidateModel)
        if job_id and job_id != "ALL":
            query = query.filter(CandidateModel.job_id == job_id)
        if q and q.strip():
            term = f"%{q.strip()}%"
            query = query.filter(or_(CandidateModel.name.ilike(term), CandidateModel.email.ilike(term)))
        if min_expected_ctc is not None:
            query = query.filter(CandidateModel.expected_ctc_min >= min_expected_ctc)
        if max_expected_ctc is not None:
            query = query.filter(CandidateModel.expected_ctc_max <= max_expected_ctc)

        candidates = query.all()
        for c in candidates:
            CandidateController._enrich_candidate(c)

        if compensation_status and compensation_status != "All":
            norm_status = compensation_status.lower().strip()
            candidates = [
                c for c in candidates
                if c.compensation_analysis and (
                    c.compensation_analysis["relationship"] == norm_status or
                    norm_status in c.compensation_analysis["relationship"]
                )
            ]

        return candidates[skip : skip + limit]

    @staticmethod
    def get_candidate_by_id(candidate_id: str, db: Session):
        cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        return CandidateController._enrich_candidate(cand) if cand else None

    @staticmethod
    def log_state_change(
        candidate_id: str = None,
        dimension: str = None,
        from_val: str = None,
        to_val: str = None,
        changed_by: str = None,
        notes: str = None,
        db: Session = None,
        *,
        from_value: str = None,
        to_value: str = None,
        from_state: str = None,
        to_state: str = None,
        triggered_by: str = None,
        reason: str = None,
        **kwargs
    ):
        f_val = from_val if from_val is not None else (from_value if from_value is not None else from_state)
        t_val = to_val if to_val is not None else (to_value if to_value is not None else to_state)
        actor = changed_by or triggered_by or "system"
        note = notes if notes is not None else (reason if reason is not None else "")
        session = db or kwargs.get("session")
        c_id = candidate_id or kwargs.get("candidate_id")
        dim = dimension or kwargs.get("dimension")
        if not session or not c_id:
            return
        try:
            log_entry = CandidateStateLogModel(
                id=f"stlog-{uuid.uuid4().hex[:8]}",
                candidate_id=c_id,
                dimension=dim,
                from_value=f_val,
                to_value=t_val,
                changed_by=actor,
                notes=note,
                created_at=datetime.utcnow()
            )
            session.add(log_entry)
        except Exception as e:
            print(f"[StateAudit] Warning: Could not log state change: {e}")

    @staticmethod
    def get_state_logs(candidate_id: str, db: Session):
        return db.query(CandidateStateLogModel).filter(CandidateStateLogModel.candidate_id == candidate_id).order_by(CandidateStateLogModel.created_at.desc()).all()

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
        match_details = match_result.get("match_details", {})

        comp_name = getattr(job, "company_name", "SparkX Technologies") or payload.company_name or "SparkX Technologies"
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        # Check if candidate has already applied for this job
        existing = db.query(CandidateModel).filter(
            CandidateModel.job_id == job.id,
            CandidateModel.email == payload.email.strip().lower()
        ).first()

        matching_user = db.query(UserModel).filter(UserModel.email == payload.email.strip().lower()).first()

        if existing:
            # Update existing application with latest resume/details
            if not existing.user_id and matching_user:
                existing.user_id = matching_user.id
            existing.version = (existing.version or 1) + 1
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
            # Candidate application compensation persistence
            if payload.current_ctc is not None:
                existing.current_ctc = payload.current_ctc
            if payload.expected_ctc_min is not None:
                existing.expected_ctc_min = payload.expected_ctc_min
            if payload.expected_ctc_max is not None:
                existing.expected_ctc_max = payload.expected_ctc_max
            if payload.expected_ctc_type:
                existing.expected_ctc_type = payload.expected_ctc_type
            if payload.ctc_currency:
                existing.ctc_currency = payload.ctc_currency.upper()
            db.commit()
            db.refresh(existing)
            CandidateController._enrich_candidate(existing)
            return existing, None

        cid = f"cand-{uuid.uuid4().hex[:6]}"
        job_title = job.title if job else "Technical Role"

        # Initial automated confirmation email
        initial_email = {
            "type": "application_received",
            "subject": f"Application Received: {job_title}",
            "sent_at": now_str,
            "recipient": payload.email,
            "body": (
                f"Hello {payload.name},\n\n"
                f"Thank you for applying to the {job_title} position at SparkX Technologies.\n"
                f"Our recruitment committee is reviewing your application against role requirements.\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        }

        new_candidate = CandidateModel(
            id=cid,
            user_id=matching_user.id if matching_user else None,
            version=1,
            job_id=payload.job_id,
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
            # Authoritative Candidate Application Compensation Expectations
            current_ctc=payload.current_ctc,
            expected_ctc_type=payload.expected_ctc_type or "range",
            expected_ctc_min=payload.expected_ctc_min,
            expected_ctc_max=payload.expected_ctc_max,
            ctc_currency=(payload.ctc_currency or "INR").upper(),
            # Authoritative 4-Dimensional State Fields
            stage=STAGE_APPLIED,
            assessment_status=ASSESS_NOT_INVITED,
            interview_status=INTERVIEW_NOT_SCHEDULED,
            hiring_decision=DECISION_UNDECIDED,
            stage_updated_at=datetime.utcnow(),
            decision_updated_at=None,
            # Read-only legacy projections
            status=project_legacy_status(STAGE_APPLIED, DECISION_UNDECIDED),
            final_decision=project_legacy_final_decision(STAGE_APPLIED, DECISION_UNDECIDED),
            email_logs=[initial_email]
        )

        db.add(new_candidate)
        CandidateController.log_state_change(
            candidate_id=cid,
            dimension="stage",
            from_val=None,
            to_val=STAGE_APPLIED,
            changed_by="candidate",
            notes="Application submitted",
            db=db
        )
        db.commit()
        db.refresh(new_candidate)
        CandidateController._enrich_candidate(new_candidate)
        return new_candidate, None

    @staticmethod
    def update_stage(candidate_id: str, new_stage: str, notes: str = "", changed_by: str = "recruiter", db: Session = None):
        """Authoritatively advance or adjust the application stage with FSM transition guards."""
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        norm_stage = new_stage.lower().strip()
        valid, err = validate_stage_transition(candidate.stage, norm_stage)
        if not valid:
            return None, err

        old_stage = candidate.stage
        candidate.stage = norm_stage
        candidate.stage_updated_at = datetime.utcnow()
        candidate.version = (candidate.version or 1) + 1
        # Update legacy read projection
        candidate.status = project_legacy_status(candidate.stage, candidate.hiring_decision)

        CandidateController.log_state_change(
            candidate_id=candidate.id,
            dimension="stage",
            from_val=old_stage,
            to_val=norm_stage,
            changed_by=changed_by,
            notes=notes,
            db=db
        )
        db.commit()
        db.refresh(candidate)
        return candidate, None

    @staticmethod
    def update_hiring_decision(
        candidate_id: str,
        new_decision: str = None,
        recruiter_score: Optional[int] = None,
        rejection_reason: Optional[str] = None,
        rejection_category: Optional[str] = None,
        hr_notes: Optional[str] = None,
        changed_by: str = "recruiter",
        db: Session = None,
        *,
        decision: str = None,
        reason: str = None,
        **kwargs
    ):
        """Authoritatively record a hiring decision without corrupting transient workflow stages."""
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        target_decision = new_decision or decision or ""
        norm_decision = target_decision.lower().strip()
        valid, err = validate_decision_transition(candidate.hiring_decision, norm_decision)
        if not valid:
            return None, err

        if reason and not rejection_reason and norm_decision == DECISION_REJECTED:
            rejection_reason = reason
        if reason and not hr_notes:
            hr_notes = reason

        old_decision = candidate.hiring_decision
        candidate.hiring_decision = norm_decision
        candidate.decision_updated_at = datetime.utcnow()
        candidate.version = (candidate.version or 1) + 1

        if recruiter_score is not None:
            candidate.recruiter_score = recruiter_score
        if rejection_reason is not None:
            candidate.rejection_reason = rejection_reason
        if rejection_category is not None:
            candidate.rejection_category = rejection_category
        if hr_notes is not None:
            candidate.hr_notes = hr_notes

        # Terminal decisions (selected, rejected) finalize the pipeline stage to completed
        if norm_decision in [DECISION_SELECTED, DECISION_REJECTED]:
            candidate.stage = STAGE_COMPLETED
            candidate.stage_updated_at = datetime.utcnow()

        # Update legacy read projections
        candidate.status = project_legacy_status(candidate.stage, candidate.hiring_decision)
        candidate.final_decision = project_legacy_final_decision(candidate.stage, candidate.hiring_decision)

        CandidateController.log_state_change(
            candidate_id=candidate.id,
            dimension="hiring_decision",
            from_val=old_decision,
            to_val=norm_decision,
            changed_by=changed_by,
            notes=rejection_reason or hr_notes or "",
            db=db
        )
        db.commit()
        db.refresh(candidate)
        return candidate, None

    @staticmethod
    def invite_assessment(candidate_id: str, custom_message: str = "", changed_by: str = "recruiter", db: Session = None):
        """
        Idempotent assessment invitation:
        Enables candidate technical assessment access, records invitation timestamp,
        advances pipeline stage to 'assessment', and dispatches notification.
        """
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        # Idempotency check: if already invited or further along, return safely without resetting
        if candidate.assessment_status in [ASSESS_INVITED, ASSESS_IN_PROGRESS, ASSESS_SUBMITTED, ASSESS_EVALUATED]:
            return candidate, None

        old_status = candidate.assessment_status
        candidate.assessment_status = ASSESS_INVITED
        candidate.assessment_invited_at = datetime.utcnow()

        # Advance stage to assessment if currently in applied or screening
        if candidate.stage in [STAGE_APPLIED, STAGE_SCREENING]:
            candidate.stage = STAGE_ASSESSMENT
            candidate.stage_updated_at = datetime.utcnow()
            candidate.status = project_legacy_status(candidate.stage, candidate.hiring_decision)

        CandidateController.log_state_change(
            candidate_id=candidate.id,
            dimension="assessment_status",
            from_val=old_status,
            to_val=ASSESS_INVITED,
            changed_by=changed_by,
            notes=custom_message or "Technical assessment invitation",
            db=db
        )

        job_title = candidate.job.title if candidate.job else "Target Role"
        try:
            send_email(
                to_email=candidate.email,
                subject=f"[SparkX] Technical Assessment Invitation: {job_title}",
                body_text=(
                    f"Hello {candidate.name},\n\n"
                    f"You have been officially invited to complete the technical assessment for {job_title}.\n"
                    f"Please log in to your SparkX portal and navigate to 'Role Assessment' to begin your assessment.\n\n"
                    f"{custom_message}\n\n"
                    f"Best regards,\nSparkX AI Recruitment Team"
                )
            )
        except Exception as e:
            print(f"[Warning] Failed to send assessment invitation email: {e}")

        db.commit()
        db.refresh(candidate)
        return candidate, None

    @staticmethod
    def update_status(candidate_id: str, payload: CandidateStatusUpdate, db: Session):
        """Legacy compatibility adapter: routes legacy status strings to decoupled dimensions."""
        raw_status = (payload.status or "").strip().lower()
        
        # Decision mappings
        if raw_status in ["selected", "offered", "offer"]:
            cand, _ = CandidateController.update_hiring_decision(
                candidate_id, DECISION_SELECTED, payload.recruiter_score, 
                payload.rejection_reason, payload.rejection_category, payload.hr_notes, "recruiter", db
            )
            return bool(cand)
        elif raw_status == "rejected":
            cand, _ = CandidateController.update_hiring_decision(
                candidate_id, DECISION_REJECTED, payload.recruiter_score, 
                payload.rejection_reason, payload.rejection_category, payload.hr_notes, "recruiter", db
            )
            return bool(cand)
        elif raw_status == "shortlisted":
            cand, _ = CandidateController.update_hiring_decision(
                candidate_id, DECISION_SHORTLISTED, payload.recruiter_score, 
                payload.rejection_reason, payload.rejection_category, payload.hr_notes, "recruiter", db
            )
            return bool(cand)
        
        # Stage mappings
        stage_map = {
            "applied": STAGE_APPLIED,
            "screening": STAGE_SCREENING,
            "assessment": STAGE_ASSESSMENT,
            "under review": STAGE_REVIEW,
            "evaluated": STAGE_REVIEW,
            "interview": STAGE_INTERVIEW,
            "interview scheduled": STAGE_INTERVIEW,
            "scheduled": STAGE_INTERVIEW
        }
        target_stage = stage_map.get(raw_status, STAGE_SCREENING)
        cand, _ = CandidateController.update_stage(candidate_id, target_stage, payload.hr_notes or "", "recruiter", db)
        return bool(cand)

    @staticmethod
    def get_candidate_applications(email: str, db: Session):
        """Authoritative candidate application list: reads exact persisted states (zero heuristics)."""
        clean_email = email.strip().lower()
        applications = db.query(CandidateModel).filter(CandidateModel.email.ilike(clean_email)).order_by(CandidateModel.created_at.desc()).all()
        result = []
        for app in applications:
            job = app.job
            comp_name = app.company_name or (job.company_name if job else "SparkX Technologies")

            result.append({
                "id": app.id,
                "name": app.name,
                "email": app.email,
                "job_id": app.job_id,
                "job_title": job.title if job else "Technical Role",
                "company_name": comp_name,
                "department": job.department if job else "Engineering",
                "location": job.location if job else "Remote",
                "applied_date": app.applied_date,
                # 4 Decoupled Authoritative Dimensions
                "stage": app.stage or STAGE_APPLIED,
                "assessment_status": app.assessment_status or ASSESS_NOT_INVITED,
                "assessment_invited_at": app.assessment_invited_at.isoformat() if app.assessment_invited_at else None,
                "assessment_started_at": app.assessment_started_at.isoformat() if app.assessment_started_at else None,
                "assessment_submitted_at": app.assessment_submitted_at.isoformat() if app.assessment_submitted_at else None,
                "assessment_evaluated_at": app.assessment_evaluated_at.isoformat() if app.assessment_evaluated_at else None,
                "interview_status": app.interview_status or INTERVIEW_NOT_SCHEDULED,
                "interview_scheduled_at": app.interview_scheduled_at,
                "interview_meeting_url": app.interview_meeting_url,
                "interview_started_at": app.interview_started_at.isoformat() if app.interview_started_at else None,
                "interview_completed_at": app.interview_completed_at.isoformat() if app.interview_completed_at else None,
                "hiring_decision": app.hiring_decision or DECISION_UNDECIDED,
                # Read-only legacy projections
                "status": project_legacy_status(app.stage, app.hiring_decision),
                "final_decision": project_legacy_final_decision(app.stage, app.hiring_decision),
                "match_score": None,
                "experience_years": app.experience_years,
                "skills": app.skills or [],
                "resume_filename": app.resume_filename,
                "resume_summary": app.resume_summary,
                "scores": app.scores or {},
                "skill_gaps": app.skill_gaps or {},
                "coding_score": None,
                "recruiter_score": None,
                "rejection_reason": app.rejection_reason,
                "rejection_category": app.rejection_category,
                "hr_notes": app.hr_notes,
                "match_details": None,
                # Candidate-facing compensation context (zero private recruiter leakage)
                "current_ctc": float(app.current_ctc) if app.current_ctc is not None else None,
                "expected_ctc_type": app.expected_ctc_type or "range",
                "expected_ctc_min": float(app.expected_ctc_min) if app.expected_ctc_min is not None else None,
                "expected_ctc_max": float(app.expected_ctc_max) if app.expected_ctc_max is not None else None,
                "ctc_currency": app.ctc_currency or "INR",
                "job_budget_formatted": format_job_compensation(
                    job.ctc_min if job else None,
                    job.ctc_max if job else None,
                    job.ctc_type if job else "range",
                    job.ctc_currency if job else "INR"
                ),
                "candidate_expectation_formatted": format_candidate_expectation(
                    app.expected_ctc_min,
                    app.expected_ctc_max,
                    app.expected_ctc_type,
                    app.ctc_currency or "INR"
                ),
                # Post-Interview Update Date & Timeline Telemetry
                "expected_update_date": app.expected_update_date,
                "update_notes": app.update_notes,
                "update_status": app.update_status or "not_set",
                "update_sent_at": app.update_sent_at.isoformat() if app.update_sent_at else None,
                "reminder_sent_flags": app.reminder_sent_flags or {}
            })
        return result

    @staticmethod
    def set_expected_update_date(
        candidate_id: str,
        expected_update_date: str,
        update_notes: str,
        notify_candidate: bool,
        db: Session
    ):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        clean_date = (expected_update_date or "").strip()
        try:
            datetime.strptime(clean_date, "%Y-%m-%d")
        except ValueError:
            return None, "Invalid date format. Expected YYYY-MM-DD."

        prev_date = candidate.expected_update_date
        candidate.expected_update_date = clean_date
        candidate.update_notes = update_notes or ""

        # Set status: timeline_changed if modified, otherwise expected_update_date_set
        new_status = "timeline_changed" if (prev_date and prev_date != clean_date) else "expected_update_date_set"
        candidate.update_status = new_status
        candidate.reminder_sent_flags = {"due_tomorrow": False, "due_today": False}

        CandidateController.log_state_change(
            db=db,
            candidate_id=candidate.id,
            dimension="update_status",
            from_val=prev_date or "none",
            to_val=clean_date,
            changed_by="recruiter",
            notes=f"Expected update date set to {clean_date}. Notes: {update_notes or 'None'}"
        )

        if notify_candidate and candidate.email:
            try:
                job_title = candidate.job.title if candidate.job else "Applied Position"
                subj = f"[SPARKX TIMELINE] Update Timeline for {job_title}"
                portal_url = os.environ.get("FRONTEND_BASE_URL", "http://localhost:5173")
                body = (
                    f"Dear {candidate.name},\n\n"
                    f"Thank you for interviewing with our team for {job_title}.\n\n"
                    f"Our evaluation team is actively reviewing your interview and assessment performance.\n"
                    f"• Expected Next Decision / Feedback Date: {clean_date}\n\n"
                )
                if update_notes:
                    body += f"Message from Hiring Team:\n{update_notes}\n\n"
                body += f"You can track your application status at: {portal_url}\n\nBest regards,\nSparkX Talent Acquisition"
                
                send_email(
                    to_email=candidate.email,
                    subject=subj,
                    body_text=body,
                    background=True
                )
                logs = list(candidate.email_logs or [])
                logs.append({
                    "id": f"mail-{uuid.uuid4().hex[:6]}",
                    "type": "timeline_update",
                    "sent_at": datetime.utcnow().isoformat(),
                    "recipient": candidate.email,
                    "subject": subj,
                    "expected_update_date": clean_date,
                    "notes": update_notes
                })
                candidate.email_logs = logs
            except Exception as mail_err:
                print(f"[Warning] Failed to send candidate timeline notification: {mail_err}")

        db.commit()
        db.refresh(candidate)
        return candidate, None

    @staticmethod
    def send_recruiter_update(
        candidate_id: str,
        message: str,
        timeline_status: str,
        db: Session
    ):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        candidate.update_status = timeline_status or "update_sent"
        candidate.update_sent_at = datetime.utcnow()
        candidate.reminder_sent_flags = {"due_tomorrow": True, "due_today": True}

        if candidate.email:
            try:
                job_title = candidate.job.title if candidate.job else "Applied Position"
                subj = f"[SPARKX UPDATE] Hiring Status for {job_title}"
                send_email(
                    to_email=candidate.email,
                    subject=subj,
                    body_text=message,
                    background=True
                )
                logs = list(candidate.email_logs or [])
                logs.append({
                    "id": f"mail-{uuid.uuid4().hex[:6]}",
                    "type": "recruiter_update",
                    "sent_at": datetime.utcnow().isoformat(),
                    "recipient": candidate.email,
                    "subject": subj,
                    "message": message
                })
                candidate.email_logs = logs
            except Exception as mail_err:
                print(f"[Warning] Failed to send recruiter update email: {mail_err}")

        CandidateController.log_state_change(
            db=db,
            candidate_id=candidate.id,
            dimension="update_status",
            from_val=candidate.update_status,
            to_val="update_sent",
            changed_by="recruiter",
            notes=message[:120] if message else "Recruiter update dispatched"
        )

        db.commit()
        db.refresh(candidate)
        return candidate, None

    @staticmethod
    def get_update_timeline(db: Session) -> Dict[str, Any]:
        today = datetime.utcnow().date()
        candidates = db.query(CandidateModel).all()

        due_today = []
        due_tomorrow = []
        upcoming = []
        overdue = []
        completed = []
        awaiting_update_date = []

        dirty = False
        for c in candidates:
            is_post_interview = (
                c.interview_status == "completed" or 
                c.stage in [STAGE_REVIEW, STAGE_COMPLETED] or 
                getattr(c, "interview_completed_at", None) is not None
            )

            if not c.expected_update_date:
                if is_post_interview and getattr(c, "hiring_decision", DECISION_UNDECIDED) == DECISION_UNDECIDED:
                    awaiting_update_date.append({
                        "id": c.id,
                        "name": c.name,
                        "email": c.email,
                        "job_id": c.job_id,
                        "job_title": c.job_title,
                        "stage": c.stage,
                        "interview_status": c.interview_status,
                        "interview_completed_at": c.interview_completed_at.isoformat() if c.interview_completed_at else None,
                        "update_status": "awaiting_update_date"
                    })
                continue

            try:
                exp_date = datetime.strptime(c.expected_update_date, "%Y-%m-%d").date()
                delta_days = (exp_date - today).days
            except Exception:
                continue

            cand_info = {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "job_id": c.job_id,
                "job_title": c.job_title,
                "stage": c.stage,
                "interview_status": c.interview_status,
                "expected_update_date": c.expected_update_date,
                "days_remaining": delta_days,
                "update_notes": c.update_notes,
                "update_status": c.update_status,
                "update_sent_at": c.update_sent_at.isoformat() if c.update_sent_at else None,
                "hiring_decision": c.hiring_decision
            }

            if c.update_status == "update_sent" or c.hiring_decision in [DECISION_SELECTED, DECISION_REJECTED]:
                completed.append(cand_info)
            elif delta_days < 0:
                cand_info["update_status"] = "update_overdue"
                if c.update_status != "update_overdue":
                    c.update_status = "update_overdue"
                    dirty = True
                overdue.append(cand_info)
            elif delta_days == 0:
                cand_info["update_status"] = "due_today"
                flags = dict(c.reminder_sent_flags or {})
                if not flags.get("due_today"):
                    flags["due_today"] = True
                    c.reminder_sent_flags = flags
                    dirty = True
                due_today.append(cand_info)
            elif delta_days == 1:
                cand_info["update_status"] = "due_tomorrow"
                flags = dict(c.reminder_sent_flags or {})
                if not flags.get("due_tomorrow"):
                    flags["due_tomorrow"] = True
                    c.reminder_sent_flags = flags
                    dirty = True
                due_tomorrow.append(cand_info)
            else:
                upcoming.append(cand_info)

        if dirty:
            try:
                db.commit()
            except Exception:
                db.rollback()

        return {
            "summary": {
                "due_today_count": len(due_today),
                "due_tomorrow_count": len(due_tomorrow),
                "upcoming_count": len(upcoming),
                "overdue_count": len(overdue),
                "completed_count": len(completed),
                "awaiting_date_count": len(awaiting_update_date)
            },
            "due_today": due_today,
            "due_tomorrow": due_tomorrow,
            "upcoming": upcoming,
            "overdue": overdue,
            "completed": completed,
            "awaiting_update_date": awaiting_update_date
        }

    @staticmethod
    def schedule_interview(candidate_id: str, payload: CandidateScheduleRequest, db: Session):
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        previous_slot = candidate.interview_scheduled_at
        old_interview_status = candidate.interview_status
        is_reschedule = bool(previous_slot and old_interview_status == INTERVIEW_SCHEDULED)

        candidate.interview_scheduled_at = payload.scheduled_at
        candidate.interview_status = INTERVIEW_SCHEDULED

        # Progress pipeline stage to 'interview' if currently in an earlier stage or review
        if candidate.stage in [STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT, STAGE_REVIEW]:
            old_stage = candidate.stage
            candidate.stage = STAGE_INTERVIEW
            candidate.stage_updated_at = datetime.utcnow()
            candidate.status = project_legacy_status(candidate.stage, candidate.hiring_decision)
            CandidateController.log_state_change(
                candidate_id=candidate.id,
                dimension="stage",
                from_val=old_stage,
                to_val=STAGE_INTERVIEW,
                changed_by="recruiter",
                notes=f"Interview {'rescheduled' if is_reschedule else 'scheduled'} for {payload.scheduled_at}",
                db=db
            )

        CandidateController.log_state_change(
            candidate_id=candidate.id,
            dimension="interview_status",
            from_val=old_interview_status or INTERVIEW_NOT_SCHEDULED,
            to_val=INTERVIEW_SCHEDULED,
            changed_by="recruiter",
            notes=f"Interview rescheduled from {previous_slot} to {payload.scheduled_at}" if is_reschedule else f"Interview scheduled for {payload.scheduled_at}",
            db=db
        )

        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        job_title = candidate.job.title if candidate.job else "Target Position"
        job_skills = candidate.job.required_skills if (candidate.job and candidate.job.required_skills) else (candidate.skills or [])
        skills_str = ", ".join(job_skills) if job_skills else "Job Competencies"
        scheduled_slot = payload.scheduled_at or "Upcoming slot"
        notes_clean = payload.notes.strip() if payload.notes else ""
        notes_line = f"\n• Recruiter Notes: {notes_clean}" if notes_clean else ""

        # Determine dynamic meeting credentials — real Google Meet or Jitsi fallback
        custom_url = (payload.meeting_url or "").strip()
        meet_provider = "jitsi"  # default fallback
        meet_code = ""
        google_event_link = ""

        if custom_url:
            # Recruiter explicitly provided a URL (could be Meet, Jitsi, or any platform)
            meet_url = custom_url
            clean_part = custom_url.split("?")[0].rstrip("/")
            meet_code = clean_part.split("/")[-1] if "/" in clean_part else custom_url
            if "meet.google.com" in custom_url:
                meet_provider = "google_meet"
            elif "meet.jit.si" in custom_url or "jitsi" in custom_url.lower():
                meet_provider = "jitsi"
            else:
                meet_provider = "custom"
        elif is_google_connected():
            # Google account connected — create a REAL Google Meet event via Calendar API
            start_dt = parse_slot_to_datetime(scheduled_slot)
            end_dt = start_dt + timedelta(minutes=45)
            organizer_email = os.environ.get("SMTP_FROM_EMAIL", "")

            success, meet_result = create_google_meet_event(
                summary=f"SparkX AI Interview: {job_title} — {candidate.name}",
                description=(
                    f"AI Video Interview for {job_title}\n"
                    f"Candidate: {candidate.name} ({candidate.email})\n"
                    f"Assessed Competencies: {skills_str}\n"
                    f"{notes_line}"
                ),
                start_dt=start_dt,
                end_dt=end_dt,
                attendee_emails=[candidate.email, organizer_email],
            )

            if success and meet_result.get("meet_url"):
                meet_url = meet_result["meet_url"]
                meet_code = meet_result.get("meet_id", "")
                google_event_link = meet_result.get("html_link", "")
                meet_provider = "google_meet"
                print(f"[Google Meet] Created real meeting: {meet_url}")
            else:
                # Google API failed — fall back to Jitsi
                error_msg = meet_result.get("error", "Unknown error") if isinstance(meet_result, dict) else str(meet_result)
                print(f"[Google Meet] Calendar API failed ({error_msg}), falling back to Jitsi")
                cand_clean = (candidate.id or "candidate").replace("cand-", "")[:10]
                meet_url = f"https://meet.jit.si/SparkX-Interview-{cand_clean}"
                meet_code = ""
                meet_provider = "jitsi"
        else:
            # No Google connected and no custom URL — use Jitsi instant room
            cand_clean = (candidate.id or "candidate").replace("cand-", "")[:10]
            meet_url = f"https://meet.jit.si/SparkX-Interview-{cand_clean}"
            meet_code = ""
            meet_provider = "jitsi"

        candidate.interview_meeting_url = meet_url

        # Build provider-aware email content
        if meet_provider == "google_meet":
            platform_name = "Google Meet"
            platform_icon = "📹"
            join_instruction = f"Click the Google Meet link below at your scheduled time to join."
            credentials_block = (
                f"VIDEO CONFERENCE CREDENTIALS:\n"
                f"• Platform: Google Meet\n"
                f"• Direct Video Link: {meet_url}\n"
                f"• Meeting Code: {meet_code}\n"
            )
            if google_event_link:
                credentials_block += f"• Google Calendar Event: {google_event_link}\n"
        elif meet_provider == "jitsi":
            platform_name = "SparkX Video Room (Jitsi)"
            platform_icon = "🎥"
            join_instruction = f"Click the video link below to join. No login required — works in any browser."
            credentials_block = (
                f"VIDEO CONFERENCE CREDENTIALS:\n"
                f"• Platform: SparkX Video Room (Jitsi — HD Video, no login needed)\n"
                f"• Direct Video Link: {meet_url}\n"
            )
        else:
            platform_name = "Video Conference"
            platform_icon = "🎥"
            join_instruction = f"Click the meeting link below at your scheduled time."
            credentials_block = (
                f"VIDEO CONFERENCE CREDENTIALS:\n"
                f"• Meeting Link: {meet_url}\n"
            )

        subject = f"[SPARKX RESCHEDULED] AI Video Interview: {job_title}" if is_reschedule else f"[SPARKX CONFIRMED] AI Video Interview: {job_title}"
        body = (
            f"Dear {candidate.name},\n\n"
            f"Your AI Video Interview for the position of {job_title} has been officially {'rescheduled to a revised time slot' if is_reschedule else 'confirmed'}!\n\n"
            f"INTERVIEW DETAILS:\n"
            f"• Target Position: {job_title}\n"
            f"• Assessed Competencies: {skills_str}\n"
            f"• Scheduled Slot: {scheduled_slot}{notes_line}\n\n"
            f"{credentials_block}\n"
            f"HOW TO JOIN:\n"
            f"1. {join_instruction}\n"
            f"2. Meeting Link: {meet_url}\n"
            f"3. Ensure your webcam, microphone, and a quiet environment are ready.\n\n"
            f"Best regards,\n"
            f"SparkX AI Recruitment Team"
        )

        # Provider-aware credential box color
        cred_bg = "#1a73e8" if meet_provider == "google_meet" else "#7c3aed"
        cred_label = f"{platform_name} Conference Access"

        html = f"""
        <div style="font-family: Arial, sans-serif; background-color: #070A12; color: #FFFFFF; padding: 32px; border-radius: 16px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;">
          <div style="margin-bottom: 20px;">
            <span style="font-size: 20px; font-weight: 800; color: #818cf8; font-family: Arial, sans-serif;">SparkX AI Recruitment</span>
          </div>
          <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-family: Arial, sans-serif;">{'AI Video Interview Rescheduled' if is_reschedule else 'AI Video Interview Confirmed'}</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">Hello <strong>{candidate.name}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">Your interview for <strong>{job_title}</strong> has been officially {'rescheduled to an updated time slot' if is_reschedule else 'scheduled'}.</p>
          
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
            <div style="font-size: 11px; text-transform: uppercase; color: #38bdf8; font-weight: bold; margin-bottom: 10px; letter-spacing: 0.5px; font-family: Arial, sans-serif;">{cred_label}</div>
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px; font-family: Arial, sans-serif;">• <strong>Platform:</strong> {platform_name}</div>
            <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px; font-family: Arial, sans-serif;">• <strong>Meeting Link:</strong> <a href="{meet_url}" target="_blank" style="color: #60a5fa; text-decoration: underline;">{meet_url}</a></div>
            {f'<div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px; font-family: Arial, sans-serif;">• <strong>Meeting Code:</strong> <span style="font-family: monospace; color: #facc15; font-weight: bold;">{meet_code}</span></div>' if meet_code else ''}
          </div>

          <!-- Action Buttons -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0; text-align: center;">
            <tr>
              <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                  <tr>
                    <td align="center" style="padding: 6px 8px;">
                      <a href="{meet_url}" target="_blank" style="background-color: {cred_bg}; color: #ffffff; padding: 13px 22px; border-radius: 10px; text-decoration: none; font-family: Arial, sans-serif; font-weight: bold; font-size: 13px; display: inline-block; line-height: 1.2; text-align: center; min-width: 160px; box-sizing: border-box;">{platform_icon} Join {platform_name}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; font-family: Arial, sans-serif;">
            <strong>Instructions:</strong> {join_instruction} Ensure camera and microphone permissions are enabled.
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
        organizer = os.environ.get("SMTP_FROM_EMAIL", "")
        ics_data = create_ics_calendar_event(
            event_id=candidate.id,
            summary=f"SparkX AI Video Interview: {job_title}",
            description=f"AI Video Interview for {job_title} at SparkX AI.\nAssessed Competencies: {skills_str}\nGoogle Meet Call: {meet_url}\nMeeting Code: {meet_code}\nPortal URL: {os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')}\n{notes_line}",
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
            meet_line = f"• Meeting Link: {meet_url}\n"
        else:
            meet_code = "Pending schedule"
            meet_url = ""
            meet_line = "• Meeting Link: To be shared prior to interview\n"

        if payload.template_type == "interview_invitation":
            subject = f"[SPARKX INTERVIEW] Invitation for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"You are invited to an AI Video Interview for the position of {job_title} at SparkX AI.\n\n"
                f"• Scheduled Slot: {scheduled_slot}\n"
                f"{meet_line}"
                f"• SparkX Portal URL: {os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')}\n\n"
                f"{payload.custom_message or 'Please join at the scheduled time using the link above.'}\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        elif payload.template_type == "interview_reminder":
            subject = f"[SPARKX REMINDER] Upcoming AI Interview for {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"This is a reminder for your upcoming AI Video Interview for {job_title}.\n\n"
                f"• Scheduled Time: {scheduled_slot}\n"
                f"{meet_line}"
                f"• SparkX Portal URL: {os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')}\n\n"
                f"{payload.custom_message or 'Please ensure your camera and microphone are ready before joining.'}\n\n"
                f"Best regards,\nSparkX AI Recruitment Team"
            )
        elif payload.template_type == "offer_letter":
            subject = f"[SPARKX OFFER] Official Offer Letter: {job_title}"
            body = (
                f"Dear {candidate.name},\n\n"
                f"Congratulations! We are delighted to officially offer you the position of {job_title} at SparkX AI.\n\n"
                f"{payload.custom_message or 'Our recruitment team was highly impressed with your interview performance and technical competencies.'}\n\n"
                f"Please log in to your candidate portal at {os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')} to view your formal offer details.\n\n"
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
                f"Portal URL: {os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')}\n\n"
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
                      <a href="{os.environ.get('FRONTEND_BASE_URL', 'http://localhost:5173')}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 13px 28px; border-radius: 10px; text-decoration: none; font-family: Arial, sans-serif; font-weight: bold; font-size: 13px; display: inline-block; text-align: center; border: 1px solid #4f46e5;">Open Candidate Portal</a>
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
            CandidateController.update_hiring_decision(
                candidate_id=candidate.id,
                new_decision=DECISION_SELECTED,
                notes="Offer letter sent via email notification",
                changed_by="recruiter",
                db=db
            )
        elif payload.template_type == "rejection_notice":
            CandidateController.update_hiring_decision(
                candidate_id=candidate.id,
                new_decision=DECISION_REJECTED,
                notes="Rejection notice sent via email notification",
                changed_by="recruiter",
                db=db
            )
        else:
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
        current_year = datetime.now().year
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

log_state_change = CandidateController.log_state_change