"""
SparkX Scheduling Controller (Phase 4C)
Authoritative controller for recruiter availability, slot reservations,
concurrency-safe bookings (409 Conflict), rescheduling, and cancellations.
Synchronizes with CandidateModel and workflow state machine.
"""
import uuid
from datetime import datetime
from typing import Tuple, Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.db_models import (
    RecruiterAvailabilityModel, AvailabilityBlockModel,
    InterviewBookingModel, CandidateModel, JobModel, UserModel
)
from schemas import (
    RecruiterAvailabilityCreate, RecruiterAvailabilityUpdate,
    AvailabilityBlockCreate, InterviewBookingRequest,
    InterviewRescheduleRequest, InterviewCancellationRequest
)
from services.scheduling_service import (
    SchedulingService, parse_local_to_utc, format_utc_to_local, get_safe_zoneinfo
)
from workflow_contract import (
    STAGE_INTERVIEW, STAGE_REVIEW, STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT,
    INTERVIEW_SCHEDULED, INTERVIEW_CANCELLED, INTERVIEW_COMPLETED,
    is_final_decision, project_legacy_status, project_legacy_final_decision
)
from controllers.candidate_controller import CandidateController, log_state_change


def serialize_availability(avail: RecruiterAvailabilityModel) -> Dict[str, Any]:
    return {
        "id": avail.id,
        "organization_id": avail.organization_id,
        "recruiter_id": avail.recruiter_id,
        "job_id": avail.job_id,
        "available_date": avail.available_date,
        "start_time": avail.start_time,
        "end_time": avail.end_time,
        "timezone": avail.timezone,
        "slot_duration_minutes": avail.slot_duration_minutes,
        "buffer_minutes": avail.buffer_minutes,
        "is_active": avail.is_active,
        "blocks": [
            {
                "id": blk.id,
                "availability_id": blk.availability_id,
                "start_time": blk.start_time,
                "end_time": blk.end_time,
                "reason": blk.reason,
                "created_at": blk.created_at.isoformat() if blk.created_at else None
            }
            for blk in (avail.blocks or [])
        ],
        "created_at": avail.created_at.isoformat() if avail.created_at else None,
        "updated_at": avail.updated_at.isoformat() if avail.updated_at else None
    }


def serialize_booking(booking: InterviewBookingModel, target_tz: Optional[str] = None) -> Dict[str, Any]:
    tz_to_use = target_tz or booking.timezone or "UTC"
    loc_date, loc_start, _ = format_utc_to_local(booking.start_time_utc, tz_to_use)
    _, loc_end, _ = format_utc_to_local(booking.end_time_utc, tz_to_use)

    return {
        "id": booking.id,
        "organization_id": booking.organization_id,
        "job_id": booking.job_id,
        "job_title": booking.job.title if booking.job else "Position",
        "candidate_id": booking.candidate_id,
        "candidate_name": booking.candidate.name if booking.candidate else "Candidate",
        "candidate_email": booking.candidate.email if booking.candidate else "",
        "recruiter_id": booking.recruiter_id,
        "start_time_utc": booking.start_time_utc.isoformat() + "Z",
        "end_time_utc": booking.end_time_utc.isoformat() + "Z",
        "local_date": loc_date,
        "local_start_time": loc_start,
        "local_end_time": loc_end,
        "timezone": tz_to_use,
        "status": booking.status,
        "meeting_url": booking.meeting_url or f"/interview/{booking.candidate_id}",
        "notes": booking.notes,
        "cancellation_reason": booking.cancellation_reason,
        "cancelled_by": booking.cancelled_by,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "updated_at": booking.updated_at.isoformat() if booking.updated_at else None
    }


class SchedulingController:

    # ═════════════════════════════════════════════════════════════════════════
    # RECRUITER AVAILABILITY CRUD
    # ═════════════════════════════════════════════════════════════════════════

    @staticmethod
    def create_availability(
        db: Session,
        payload: RecruiterAvailabilityCreate,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can define interview availability", 403

        org_id = current_user.organization_id
        if not org_id:
            return None, "Recruiter must belong to an organization", 400

        # Validate start < end
        try:
            start_parts = [int(p) for p in payload.start_time.split(":")[:2]]
            end_parts = [int(p) for p in payload.end_time.split(":")[:2]]
            if (start_parts[0], start_parts[1]) >= (end_parts[0], end_parts[1]):
                return None, "Availability start time must be earlier than end time", 400
        except Exception:
            return None, "Invalid start or end time format (must be HH:MM)", 400

        # Validate date
        try:
            datetime.strptime(payload.available_date.strip(), "%Y-%m-%d")
        except Exception:
            return None, "Invalid available_date format (must be YYYY-MM-DD)", 400

        duration = payload.slot_duration_minutes or 30
        if duration not in [15, 30, 45, 60]:
            return None, "Interview duration must be 15, 30, 45, or 60 minutes", 400

        buffer_min = payload.buffer_minutes if payload.buffer_minutes is not None else 15
        if buffer_min not in [0, 5, 10, 15, 20, 30]:
            buffer_min = 15

        avail_id = f"avail-{uuid.uuid4().hex[:8]}"
        avail = RecruiterAvailabilityModel(
            id=avail_id,
            organization_id=org_id,
            recruiter_id=current_user.id,
            job_id=payload.job_id,
            available_date=payload.available_date.strip(),
            start_time=payload.start_time.strip(),
            end_time=payload.end_time.strip(),
            timezone=payload.timezone.strip() if payload.timezone else "UTC",
            slot_duration_minutes=duration,
            buffer_minutes=buffer_min,
            is_active=True
        )
        db.add(avail)
        db.flush()

        # Add optional blocked periods
        if payload.blocks:
            for blk in payload.blocks:
                b_start = [int(p) for p in blk.start_time.split(":")[:2]]
                b_end = [int(p) for p in blk.end_time.split(":")[:2]]
                if (b_start[0], b_start[1]) >= (b_end[0], b_end[1]):
                    db.rollback()
                    return None, f"Block start time {blk.start_time} must be earlier than end time {blk.end_time}", 400
                db.add(AvailabilityBlockModel(
                    id=f"blk-{uuid.uuid4().hex[:8]}",
                    availability_id=avail.id,
                    start_time=blk.start_time.strip(),
                    end_time=blk.end_time.strip(),
                    reason=blk.reason or "Unavailable / Busy"
                ))

        db.commit()
        db.refresh(avail)
        return serialize_availability(avail), None, 201

    @staticmethod
    def list_availabilities(
        db: Session,
        current_user: UserModel,
        job_id: Optional[str] = None,
        date_str: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not current_user or current_user.role != "recruiter":
            return []

        query = db.query(RecruiterAvailabilityModel).filter(
            RecruiterAvailabilityModel.organization_id == current_user.organization_id,
            RecruiterAvailabilityModel.is_active == True
        )
        if job_id:
            query = query.filter(
                or_(
                    RecruiterAvailabilityModel.job_id == job_id,
                    RecruiterAvailabilityModel.job_id == None
                )
            )
        if date_str:
            query = query.filter(RecruiterAvailabilityModel.available_date == date_str)

        items = query.order_by(
            RecruiterAvailabilityModel.available_date.asc(),
            RecruiterAvailabilityModel.start_time.asc()
        ).all()
        return [serialize_availability(a) for a in items]

    @staticmethod
    def update_availability(
        db: Session,
        availability_id: str,
        payload: RecruiterAvailabilityUpdate,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can update availability", 403

        avail = db.query(RecruiterAvailabilityModel).filter(
            RecruiterAvailabilityModel.id == availability_id
        ).first()
        if not avail:
            return None, "Availability window not found", 404

        if avail.organization_id != current_user.organization_id:
            return None, "Access denied: Availability belongs to another organization", 403

        if payload.start_time:
            avail.start_time = payload.start_time.strip()
        if payload.end_time:
            avail.end_time = payload.end_time.strip()
        if payload.timezone:
            avail.timezone = payload.timezone.strip()
        if payload.slot_duration_minutes:
            avail.slot_duration_minutes = payload.slot_duration_minutes
        if payload.buffer_minutes is not None:
            avail.buffer_minutes = payload.buffer_minutes
        if payload.is_active is not None:
            avail.is_active = payload.is_active

        if payload.blocks is not None:
            db.query(AvailabilityBlockModel).filter(
                AvailabilityBlockModel.availability_id == avail.id
            ).delete()
            for blk in payload.blocks:
                db.add(AvailabilityBlockModel(
                    id=f"blk-{uuid.uuid4().hex[:8]}",
                    availability_id=avail.id,
                    start_time=blk.start_time.strip(),
                    end_time=blk.end_time.strip(),
                    reason=blk.reason or "Unavailable / Busy"
                ))

        avail.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(avail)
        return serialize_availability(avail), None, 200

    @staticmethod
    def delete_availability(
        db: Session,
        availability_id: str,
        current_user: UserModel
    ) -> Tuple[bool, Optional[str], int]:
        if not current_user or current_user.role != "recruiter":
            return False, "Only recruiters can delete availability", 403

        avail = db.query(RecruiterAvailabilityModel).filter(
            RecruiterAvailabilityModel.id == availability_id
        ).first()
        if not avail:
            return False, "Availability window not found", 404

        if avail.organization_id != current_user.organization_id:
            return False, "Access denied: Availability belongs to another organization", 403

        # Soft delete
        avail.is_active = False
        avail.updated_at = datetime.utcnow()
        db.commit()
        return True, None, 200

    @staticmethod
    def add_block(
        db: Session,
        availability_id: str,
        payload: AvailabilityBlockCreate,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can add unavailable blocks", 403

        avail = db.query(RecruiterAvailabilityModel).filter(
            RecruiterAvailabilityModel.id == availability_id
        ).first()
        if not avail:
            return None, "Availability window not found", 404

        if avail.organization_id != current_user.organization_id:
            return None, "Access denied", 403

        b_start = [int(p) for p in payload.start_time.split(":")[:2]]
        b_end = [int(p) for p in payload.end_time.split(":")[:2]]
        if (b_start[0], b_start[1]) >= (b_end[0], b_end[1]):
            return None, "Block start time must be earlier than end time", 400

        block = AvailabilityBlockModel(
            id=f"blk-{uuid.uuid4().hex[:8]}",
            availability_id=avail.id,
            start_time=payload.start_time.strip(),
            end_time=payload.end_time.strip(),
            reason=payload.reason or "Unavailable / Busy"
        )
        db.add(block)
        db.commit()
        db.refresh(avail)
        return serialize_availability(avail), None, 201

    # ═════════════════════════════════════════════════════════════════════════
    # DYNAMIC SLOT GENERATION
    # ═════════════════════════════════════════════════════════════════════════

    @staticmethod
    def get_slots(
        db: Session,
        current_user: Optional[UserModel],
        job_id: Optional[str] = None,
        candidate_id: Optional[str] = None,
        timezone: str = "UTC",
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
        target_org_id = None
        target_job_id = job_id

        if candidate_id:
            cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
            if cand:
                target_org_id = cand.organization_id
                target_job_id = target_job_id or cand.job_id
                # Check candidate ownership if user is a candidate
                if current_user and current_user.role == "candidate":
                    if cand.email.strip().lower() != current_user.email.strip().lower() and cand.user_id != current_user.id:
                        return [], "Access denied: cannot view slots for another candidate", 403

        if not target_org_id and current_user and current_user.organization_id:
            target_org_id = current_user.organization_id

        if not target_org_id:
            return [], "Unable to resolve tenant organization for slot generation", 400

        slots = SchedulingService.generate_available_slots(
            db=db,
            organization_id=target_org_id,
            job_id=target_job_id,
            target_timezone=timezone or "UTC",
            from_date=from_date,
            to_date=to_date
        )
        return slots, None, 200

    # ═════════════════════════════════════════════════════════════════════════
    # CANDIDATE SELF-SCHEDULING & ATOMIC BOOKING
    # ═════════════════════════════════════════════════════════════════════════

    @staticmethod
    def book_slot(
        db: Session,
        payload: InterviewBookingRequest,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
        if not cand:
            return None, "Candidate not found", 404

        # Authorization: candidate can book their own slot; recruiter can book for their candidate
        if current_user.role == "candidate":
            if cand.email.strip().lower() != current_user.email.strip().lower() and cand.user_id != current_user.id:
                return None, "Access denied: cannot book interview for another candidate", 403
        elif current_user.role == "recruiter":
            if cand.organization_id != current_user.organization_id:
                return None, "Access denied: Candidate belongs to another organization", 403

        # Check finalized decision
        if is_final_decision(cand.hiring_decision):
            return None, f"Cannot schedule interview: application is finalized with decision '{cand.hiring_decision}'", 400

        # Check existing active booking
        existing_booking = db.query(InterviewBookingModel).filter(
            InterviewBookingModel.candidate_id == cand.id,
            InterviewBookingModel.status.in_(["scheduled", "in_progress"])
        ).first()
        if existing_booking:
            return None, "Candidate already has an active interview scheduled. Use reschedule instead.", 400

        # Parse UTC start and end
        try:
            clean_s = payload.start_time_utc.replace("Z", "").split("+")[0]
            start_dt_utc = datetime.fromisoformat(clean_s)
            clean_e = payload.end_time_utc.replace("Z", "").split("+")[0]
            end_dt_utc = datetime.fromisoformat(clean_e)
        except Exception:
            return None, "Invalid ISO start or end time format", 400

        if start_dt_utc >= end_dt_utc:
            return None, "Interview start time must be earlier than end time", 400

        now_utc = datetime.utcnow()
        if start_dt_utc <= now_utc:
            return None, "Cannot book an interview slot in the past", 400

        # ATOMIC CONFLICT / DOUBLE-BOOKING CHECK
        recruiter_id = None
        if payload.availability_id:
            avail = db.query(RecruiterAvailabilityModel).filter(
                RecruiterAvailabilityModel.id == payload.availability_id
            ).first()
            if avail:
                recruiter_id = avail.recruiter_id

        has_conflict = SchedulingService.check_slot_conflict(
            db=db,
            organization_id=cand.organization_id,
            start_time_utc=start_dt_utc,
            end_time_utc=end_dt_utc,
            recruiter_id=recruiter_id
        )
        if has_conflict:
            return None, "409 Conflict: This slot has just been reserved by another candidate or is no longer available. Please select another slot.", 409

        # Generate meeting URL
        meeting_url = f"/interview/{cand.id}"

        # Create InterviewBookingModel record
        booking_id = f"ibook-{uuid.uuid4().hex[:8]}"
        booking = InterviewBookingModel(
            id=booking_id,
            organization_id=cand.organization_id,
            job_id=cand.job_id,
            candidate_id=cand.id,
            recruiter_id=recruiter_id,
            availability_id=payload.availability_id,
            start_time_utc=start_dt_utc,
            end_time_utc=end_dt_utc,
            timezone=payload.timezone or "UTC",
            status="scheduled",
            meeting_url=meeting_url,
            notes=payload.notes or ""
        )
        db.add(booking)

        # Synchronize with CandidateModel
        _, _, loc_formatted = format_utc_to_local(start_dt_utc, payload.timezone or "UTC")
        prev_slot = cand.interview_scheduled_at
        cand.interview_scheduled_at = loc_formatted
        cand.interview_status = INTERVIEW_SCHEDULED
        cand.interview_meeting_url = meeting_url

        if cand.stage in [STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT, STAGE_REVIEW]:
            old_stage = cand.stage
            cand.stage = STAGE_INTERVIEW
            cand.stage_updated_at = datetime.utcnow()
            cand.status = project_legacy_status(cand.stage, cand.hiring_decision)
            CandidateController.log_state_change(
                candidate_id=cand.id,
                dimension="stage",
                from_val=old_stage,
                to_val=STAGE_INTERVIEW,
                changed_by="candidate" if current_user.role == "candidate" else "recruiter",
                notes=f"Interview self-scheduled for {loc_formatted}",
                db=db
            )

        CandidateController.log_state_change(
            candidate_id=cand.id,
            dimension="interview_status",
            from_val="not_scheduled",
            to_val=INTERVIEW_SCHEDULED,
            changed_by="candidate" if current_user.role == "candidate" else "recruiter",
            notes=f"Interview self-scheduled slot: {loc_formatted} ({payload.timezone})",
            db=db
        )

        db.commit()
        db.refresh(booking)
        return serialize_booking(booking, payload.timezone), None, 201

    # ═════════════════════════════════════════════════════════════════════════
    # RESCHEDULING & CANCELLATION
    # ═════════════════════════════════════════════════════════════════════════

    @staticmethod
    def reschedule_interview(
        db: Session,
        payload: InterviewRescheduleRequest,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        # Find active booking
        query = db.query(InterviewBookingModel).filter(
            InterviewBookingModel.status == "scheduled"
        )
        if payload.booking_id:
            query = query.filter(InterviewBookingModel.id == payload.booking_id)
        elif payload.candidate_id:
            query = query.filter(InterviewBookingModel.candidate_id == payload.candidate_id)
        else:
            return None, "booking_id or candidate_id is required", 400

        current_booking = query.first()
        if not current_booking:
            return None, "No active scheduled interview found to reschedule", 404

        cand = current_booking.candidate
        if not cand:
            return None, "Associated candidate record not found", 404

        # Authorization
        if current_user.role == "candidate":
            if cand.email.strip().lower() != current_user.email.strip().lower() and cand.user_id != current_user.id:
                return None, "Access denied: cannot reschedule another candidate's interview", 403
        elif current_user.role == "recruiter":
            if current_booking.organization_id != current_user.organization_id:
                return None, "Access denied", 403

        # Parse new start and end UTC
        try:
            clean_s = payload.new_start_time_utc.replace("Z", "").split("+")[0]
            start_dt_utc = datetime.fromisoformat(clean_s)
            clean_e = payload.new_end_time_utc.replace("Z", "").split("+")[0]
            end_dt_utc = datetime.fromisoformat(clean_e)
        except Exception:
            return None, "Invalid ISO start or end time format", 400

        if start_dt_utc >= end_dt_utc:
            return None, "Start time must be earlier than end time", 400

        if start_dt_utc <= datetime.utcnow():
            return None, "Cannot reschedule an interview to a past time", 400

        # Concurrency check excluding the current booking
        has_conflict = SchedulingService.check_slot_conflict(
            db=db,
            organization_id=current_booking.organization_id,
            start_time_utc=start_dt_utc,
            end_time_utc=end_dt_utc,
            recruiter_id=current_booking.recruiter_id,
            exclude_booking_id=current_booking.id
        )
        if has_conflict:
            return None, "409 Conflict: The newly selected slot is already booked or unavailable.", 409

        # Mark old booking as rescheduled
        current_booking.status = "rescheduled"
        current_booking.updated_at = datetime.utcnow()

        # Create new booking
        new_booking_id = f"ibook-{uuid.uuid4().hex[:8]}"
        new_booking = InterviewBookingModel(
            id=new_booking_id,
            organization_id=current_booking.organization_id,
            job_id=current_booking.job_id,
            candidate_id=current_booking.candidate_id,
            recruiter_id=current_booking.recruiter_id,
            availability_id=current_booking.availability_id,
            start_time_utc=start_dt_utc,
            end_time_utc=end_dt_utc,
            timezone=payload.timezone or current_booking.timezone,
            status="scheduled",
            meeting_url=current_booking.meeting_url,
            notes=current_booking.notes,
            rescheduled_from_id=current_booking.id
        )
        current_booking.rescheduled_to_id = new_booking_id
        db.add(new_booking)

        # Synchronize candidate
        _, _, loc_formatted = format_utc_to_local(start_dt_utc, payload.timezone or current_booking.timezone)
        prev_slot = cand.interview_scheduled_at
        cand.interview_scheduled_at = loc_formatted

        CandidateController.log_state_change(
            candidate_id=cand.id,
            dimension="interview_status",
            from_val=INTERVIEW_SCHEDULED,
            to_val=INTERVIEW_SCHEDULED,
            changed_by="candidate" if current_user.role == "candidate" else "recruiter",
            notes=f"Interview rescheduled from {prev_slot} to {loc_formatted}",
            db=db
        )

        db.commit()
        db.refresh(new_booking)
        return serialize_booking(new_booking, payload.timezone or current_booking.timezone), None, 200

    @staticmethod
    def cancel_interview(
        db: Session,
        payload: InterviewCancellationRequest,
        current_user: UserModel
    ) -> Tuple[bool, Optional[str], int]:
        query = db.query(InterviewBookingModel).filter(
            InterviewBookingModel.status == "scheduled"
        )
        if payload.booking_id:
            query = query.filter(InterviewBookingModel.id == payload.booking_id)
        elif payload.candidate_id:
            query = query.filter(InterviewBookingModel.candidate_id == payload.candidate_id)
        else:
            return False, "booking_id or candidate_id is required", 400

        booking = query.first()
        if not booking:
            return False, "Active scheduled interview booking not found", 404

        cand = booking.candidate
        if not cand:
            return False, "Candidate record not found", 404

        # Authorization
        if current_user.role == "candidate":
            if cand.email.strip().lower() != current_user.email.strip().lower() and cand.user_id != current_user.id:
                return False, "Access denied: cannot cancel another candidate's interview", 403
        elif current_user.role == "recruiter":
            if booking.organization_id != current_user.organization_id:
                return False, "Access denied", 403

        booking.status = "cancelled"
        booking.cancellation_reason = payload.reason or "Cancelled by user"
        booking.cancelled_by = current_user.role
        booking.cancelled_at = datetime.utcnow()
        booking.updated_at = datetime.utcnow()

        # Update candidate model
        cand.interview_status = INTERVIEW_CANCELLED
        cand.interview_scheduled_at = None
        cand.interview_meeting_url = None
        CandidateController.log_state_change(
            candidate_id=cand.id,
            dimension="interview_status",
            from_val=INTERVIEW_SCHEDULED,
            to_val=INTERVIEW_CANCELLED,
            changed_by=current_user.role,
            notes=f"Interview cancelled: {payload.reason or 'User request'}",
            db=db
        )

        db.commit()
        return True, None, 200

    @staticmethod
    def get_my_interviews(
        db: Session,
        current_user: UserModel
    ) -> List[Dict[str, Any]]:
        if not current_user:
            return []

        if current_user.role == "candidate":
            # Match candidate record by email or user_id
            cands = db.query(CandidateModel).filter(
                or_(
                    CandidateModel.email.ilike(current_user.email.strip()),
                    CandidateModel.user_id == current_user.id
                )
            ).all()
            cand_ids = [c.id for c in cands]
            bookings = db.query(InterviewBookingModel).filter(
                InterviewBookingModel.candidate_id.in_(cand_ids)
            ).order_by(InterviewBookingModel.start_time_utc.desc()).all()
            return [serialize_booking(b) for b in bookings]
        elif current_user.role == "recruiter":
            bookings = db.query(InterviewBookingModel).filter(
                InterviewBookingModel.organization_id == current_user.organization_id
            ).order_by(InterviewBookingModel.start_time_utc.desc()).all()
            return [serialize_booking(b) for b in bookings]
        return []
