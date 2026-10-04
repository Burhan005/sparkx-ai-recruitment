"""
SparkX Authoritative Scheduling Engine (Phase 4C)
Handles timezone-aware slot generation, block subtraction, overlap checks, and UTC persistence.
Zero hardcoded data — 100% database-driven.
"""
from datetime import datetime, timedelta, date, time as dt_time, timezone
try:
    import zoneinfo
except ImportError:
    zoneinfo = None
try:
    from dateutil import tz as dateutil_tz
except ImportError:
    dateutil_tz = None
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models.db_models import (
    RecruiterAvailabilityModel, AvailabilityBlockModel,
    InterviewBookingModel, CandidateModel, JobModel, UserModel
)


def get_safe_tz(tz_name: Optional[str]):
    """Safely resolve an IANA timezone via dateutil/zoneinfo or fall back to UTC."""
    if not tz_name or not tz_name.strip() or tz_name.strip().upper() == "UTC":
        return timezone.utc
    cleaned = tz_name.strip()
    if dateutil_tz:
        try:
            resolved = dateutil_tz.gettz(cleaned)
            if resolved is not None:
                return resolved
        except Exception:
            pass
    if zoneinfo:
        try:
            return zoneinfo.ZoneInfo(cleaned)
        except Exception:
            pass
    return timezone.utc


get_safe_zoneinfo = get_safe_tz


def parse_local_to_utc(date_str: str, time_str: str, tz_name: str) -> datetime:
    """
    Combine date (YYYY-MM-DD) and time (HH:MM) in a local timezone,
    and return an exact naive UTC datetime.
    """
    tz = get_safe_tz(tz_name)
    y, m, d = [int(p) for p in date_str.strip().split("-")]
    hh, mm = [int(p) for p in time_str.strip().split(":")[:2]]
    local_dt = datetime(y, m, d, hh, mm, 0, tzinfo=tz)
    utc_dt = local_dt.astimezone(timezone.utc)
    return utc_dt.replace(tzinfo=None)


def format_utc_to_local(utc_dt: datetime, target_tz_name: str) -> Tuple[str, str, str]:
    """
    Convert a naive UTC datetime into (local_date, local_start_time, local_formatted).
    """
    tz = get_safe_tz(target_tz_name)
    aware_utc = utc_dt.replace(tzinfo=timezone.utc)
    local_dt = aware_utc.astimezone(tz)
    local_date = local_dt.strftime("%Y-%m-%d")
    local_time = local_dt.strftime("%H:%M")
    local_formatted = local_dt.strftime("%Y-%m-%d %H:%M")
    return local_date, local_time, local_formatted


class SchedulingService:
    @staticmethod
    def generate_available_slots(
        db: Session,
        organization_id: str,
        job_id: Optional[str] = None,
        recruiter_id: Optional[str] = None,
        target_timezone: str = "UTC",
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Derive available interview slots from persisted RecruiterAvailabilityModel,
        subtracting AvailabilityBlockModel and existing active InterviewBookingModel records.
        """
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        today_str = now_utc.strftime("%Y-%m-%d")

        query = db.query(RecruiterAvailabilityModel).filter(
            RecruiterAvailabilityModel.organization_id == organization_id,
            RecruiterAvailabilityModel.is_active == True,
            RecruiterAvailabilityModel.available_date >= (from_date or today_str)
        )
        if to_date:
            query = query.filter(RecruiterAvailabilityModel.available_date <= to_date)
        if recruiter_id:
            query = query.filter(RecruiterAvailabilityModel.recruiter_id == recruiter_id)
        if job_id:
            # Matches availability explicitly for this job OR organization-wide (job_id IS NULL)
            query = query.filter(
                or_(
                    RecruiterAvailabilityModel.job_id == job_id,
                    RecruiterAvailabilityModel.job_id == None
                )
            )

        availabilities = query.order_by(
            RecruiterAvailabilityModel.available_date.asc(),
            RecruiterAvailabilityModel.start_time.asc()
        ).all()

        available_slots = []

        for avail in availabilities:
            avail_tz = avail.timezone or "UTC"
            duration = avail.slot_duration_minutes or 30
            buffer_min = avail.buffer_minutes or 0

            # Convert availability window to UTC
            try:
                window_start_utc = parse_local_to_utc(avail.available_date, avail.start_time, avail_tz)
                window_end_utc = parse_local_to_utc(avail.available_date, avail.end_time, avail_tz)
            except Exception:
                continue

            # Parse blocked intervals for this availability window in UTC
            blocked_intervals_utc: List[Tuple[datetime, datetime]] = []
            for blk in avail.blocks:
                try:
                    b_start_utc = parse_local_to_utc(avail.available_date, blk.start_time, avail_tz)
                    b_end_utc = parse_local_to_utc(avail.available_date, blk.end_time, avail_tz)
                    if b_end_utc > b_start_utc:
                        blocked_intervals_utc.append((b_start_utc, b_end_utc))
                except Exception:
                    continue

            # Query existing active bookings for this recruiter/org on this date range
            existing_bookings = db.query(InterviewBookingModel).filter(
                InterviewBookingModel.organization_id == organization_id,
                InterviewBookingModel.status.in_(["scheduled", "in_progress"]),
                InterviewBookingModel.end_time_utc > window_start_utc,
                InterviewBookingModel.start_time_utc < window_end_utc
            )
            if avail.recruiter_id:
                existing_bookings = existing_bookings.filter(
                    or_(
                        InterviewBookingModel.recruiter_id == avail.recruiter_id,
                        InterviewBookingModel.recruiter_id == None
                    )
                )
            booked_intervals_utc = [(b.start_time_utc, b.end_time_utc) for b in existing_bookings.all()]

            # Step through availability window generating discrete slots
            curr_slot_start = window_start_utc
            step_delta = timedelta(minutes=duration + buffer_min)
            slot_duration = timedelta(minutes=duration)

            while curr_slot_start + slot_duration <= window_end_utc:
                curr_slot_end = curr_slot_start + slot_duration

                # 1. Past check: discard slots that have already begun
                if curr_slot_start <= now_utc:
                    curr_slot_start += step_delta
                    continue

                # 2. Blocked periods check: discard if slot overlaps any block
                is_blocked = False
                for (b_start, b_end) in blocked_intervals_utc:
                    if curr_slot_start < b_end and curr_slot_end > b_start:
                        is_blocked = True
                        break
                if is_blocked:
                    curr_slot_start += step_delta
                    continue

                # 3. Existing booking overlap check
                is_booked = False
                for (bk_start, bk_end) in booked_intervals_utc:
                    # An active booking conflicts if slot overlaps with the booking or its buffer
                    if curr_slot_start < bk_end and curr_slot_end > bk_start:
                        is_booked = True
                        break
                if is_booked:
                    curr_slot_start += step_delta
                    continue

                # Convert slot to requested target timezone for presentation
                loc_date, loc_start, _ = format_utc_to_local(curr_slot_start, target_timezone)
                _, loc_end, _ = format_utc_to_local(curr_slot_end, target_timezone)

                slot_key = f"slot-{avail.id}-{curr_slot_start.strftime('%Y%m%d%H%M')}"

                available_slots.append({
                    "slot_id": slot_key,
                    "availability_id": avail.id,
                    "recruiter_id": avail.recruiter_id,
                    "start_time_utc": curr_slot_start.isoformat() + "Z",
                    "end_time_utc": curr_slot_end.isoformat() + "Z",
                    "local_date": loc_date,
                    "local_start_time": loc_start,
                    "local_end_time": loc_end,
                    "timezone": target_timezone,
                    "duration_minutes": duration,
                    "is_available": True
                })

                curr_slot_start += step_delta

        return available_slots

    @staticmethod
    def check_slot_conflict(
        db: Session,
        organization_id: str,
        start_time_utc: datetime,
        end_time_utc: datetime,
        recruiter_id: Optional[str] = None,
        exclude_booking_id: Optional[str] = None
    ) -> bool:
        """
        Returns True if an overlapping active booking already exists in the database.
        """
        query = db.query(InterviewBookingModel).filter(
            InterviewBookingModel.organization_id == organization_id,
            InterviewBookingModel.status.in_(["scheduled", "in_progress"]),
            InterviewBookingModel.start_time_utc < end_time_utc,
            InterviewBookingModel.end_time_utc > start_time_utc
        )
        if recruiter_id:
            query = query.filter(
                or_(
                    InterviewBookingModel.recruiter_id == recruiter_id,
                    InterviewBookingModel.recruiter_id == None
                )
            )
        if exclude_booking_id:
            query = query.filter(InterviewBookingModel.id != exclude_booking_id)

        return query.first() is not None
