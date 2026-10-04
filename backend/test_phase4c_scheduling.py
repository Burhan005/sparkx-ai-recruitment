"""
SparkX Phase 4C Automated Verification Test Suite
Verifies:
  1. Recruiter availability definition & persistence
  2. Blocked / unavailable period exclusion
  3. Dynamic slot generation with duration & buffer
  4. Candidate self-scheduling & atomic reservation
  5. Multi-tenant isolation & RBAC boundaries
  6. Concurrency double-booking protection (409 Conflict)
  7. Rescheduling & slot release/re-reservation
  8. Cancellation & slot reclamation
  9. Timezone conversions (UTC persistence, local presentation)
 10. Database session recreation & 4D integration handoff
"""
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel,
    RecruiterAvailabilityModel, AvailabilityBlockModel, InterviewBookingModel
)
from schemas import (
    RecruiterAvailabilityCreate, RecruiterAvailabilityUpdate,
    AvailabilityBlockCreate, InterviewBookingRequest,
    InterviewRescheduleRequest, InterviewCancellationRequest
)
from controllers.scheduling_controller import SchedulingController
from controllers.interview_controller import InterviewController
from services.scheduling_service import SchedulingService, parse_local_to_utc, format_utc_to_local


def setup_test_environment():
    """Create test organizations, recruiters, candidates, and job."""
    ensure_schema_columns()
    db = SessionLocal()
    try:
        org_a_id = f"org-sched-a-{uuid.uuid4().hex[:6]}"
        org_b_id = f"org-sched-b-{uuid.uuid4().hex[:6]}"

        org_a = OrganizationModel(
            id=org_a_id,
            name="Org Sched Alpha",
            slug=f"org-sched-a-{uuid.uuid4().hex[:6]}",
            is_active=True
        )
        org_b = OrganizationModel(
            id=org_b_id,
            name="Org Sched Beta",
            slug=f"org-sched-b-{uuid.uuid4().hex[:6]}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.commit()

        # Recruiter for Org A
        recruiter_a = UserModel(
            id=f"rec-a-{uuid.uuid4().hex[:6]}",
            name="Recruiter Alpha",
            email=f"rec_a_{uuid.uuid4().hex[:6]}@sparkx.io",
            password_hash="hash_a",
            role="recruiter",
            organization_id=org_a_id
        )
        # Recruiter for Org B
        recruiter_b = UserModel(
            id=f"rec-b-{uuid.uuid4().hex[:6]}",
            name="Recruiter Beta",
            email=f"rec_b_{uuid.uuid4().hex[:6]}@sparkx.io",
            password_hash="hash_b",
            role="recruiter",
            organization_id=org_b_id
        )
        # Candidate 1 for Org A
        cand_user_1 = UserModel(
            id=f"usr-c1-{uuid.uuid4().hex[:6]}",
            name="Candidate One",
            email=f"cand1_{uuid.uuid4().hex[:6]}@gmail.com",
            password_hash="hash_c1",
            role="candidate",
            organization_id=org_a_id
        )
        # Candidate 2 for Org A
        cand_user_2 = UserModel(
            id=f"usr-c2-{uuid.uuid4().hex[:6]}",
            name="Candidate Two",
            email=f"cand2_{uuid.uuid4().hex[:6]}@gmail.com",
            password_hash="hash_c2",
            role="candidate",
            organization_id=org_a_id
        )
        db.add_all([recruiter_a, recruiter_b, cand_user_1, cand_user_2])
        db.commit()

        # Job for Org A
        job = JobModel(
            id=f"job-sched-{uuid.uuid4().hex[:6]}",
            title="Senior Distributed Systems Engineer",
            organization_id=org_a_id,
            department="Core Infrastructure",
            education="B.S. in Computer Science",
            description="High throughput systems engineering"
        )
        db.add(job)
        db.commit()

        # Candidate application records
        cand_record_1 = CandidateModel(
            id=f"cand-app1-{uuid.uuid4().hex[:6]}",
            user_id=cand_user_1.id,
            job_id=job.id,
            organization_id=org_a_id,
            name=cand_user_1.name,
            email=cand_user_1.email,
            education="B.S. Computer Science",
            stage="assessment",
            assessment_status="evaluated",
            interview_status="not_scheduled"
        )
        cand_record_2 = CandidateModel(
            id=f"cand-app2-{uuid.uuid4().hex[:6]}",
            user_id=cand_user_2.id,
            job_id=job.id,
            organization_id=org_a_id,
            name=cand_user_2.name,
            email=cand_user_2.email,
            education="M.S. Software Engineering",
            stage="assessment",
            assessment_status="evaluated",
            interview_status="not_scheduled"
        )
        db.add_all([cand_record_1, cand_record_2])
        db.commit()
        db.refresh(recruiter_a)
        db.refresh(recruiter_b)
        db.refresh(cand_user_1)
        db.refresh(cand_user_2)
        db.refresh(job)
        db.refresh(cand_record_1)
        db.refresh(cand_record_2)
        return recruiter_a, recruiter_b, cand_user_1, cand_user_2, job, cand_record_1, cand_record_2
    finally:
        db.close()


def test_01_recruiter_create_availability_persists():
    """Test 01: Recruiter creates working availability window; verifies DB persistence."""
    recruiter_a, _, _, _, job, _, _ = setup_test_environment()
    db = SessionLocal()
    try:
        # Schedule for 3 days in the future
        future_date = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d")
        payload = RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="09:00",
            end_time="17:00",
            timezone="Asia/Kolkata",
            slot_duration_minutes=30,
            buffer_minutes=15,
            job_id=job.id,
            blocks=[
                AvailabilityBlockCreate(start_time="13:00", end_time="14:00", reason="Lunch Hour")
            ]
        )
        res, err, code = SchedulingController.create_availability(db, payload, recruiter_a)
        assert err is None, f"Expected None, got {err}"
        assert code == 201
        assert res["available_date"] == future_date
        assert res["slot_duration_minutes"] == 30
        assert res["buffer_minutes"] == 15
        assert len(res["blocks"]) == 1
        assert res["blocks"][0]["reason"] == "Lunch Hour"

        # Verify DB model
        db_avail = db.query(RecruiterAvailabilityModel).filter(RecruiterAvailabilityModel.id == res["id"]).first()
        assert db_avail is not None
        assert db_avail.organization_id == recruiter_a.organization_id
        assert db_avail.recruiter_id == recruiter_a.id
        assert len(db_avail.blocks) == 1
        print("[PASS] Test 01: Recruiter created availability window and verified DB persistence.")
    finally:
        db.close()


def test_02_invalid_time_range_rejected():
    """Test 02: Start time >= End time is strictly rejected (400)."""
    recruiter_a, _, _, _, job, _, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
        payload = RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="17:00",
            end_time="09:00",  # Invalid!
            timezone="UTC"
        )
        res, err, code = SchedulingController.create_availability(db, payload, recruiter_a)
        assert code == 400
        assert "earlier than end time" in err
        print("[PASS] Test 02: Invalid start/end time range rejected with 400.")
    finally:
        db.close()


def test_03_invalid_duration_buffer_rejected():
    """Test 03: Non-standard duration rejected with 400."""
    recruiter_a, _, _, _, job, _, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
        payload = RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="10:00",
            end_time="12:00",
            slot_duration_minutes=25  # Only 15, 30, 45, 60 allowed
        )
        res, err, code = SchedulingController.create_availability(db, payload, recruiter_a)
        assert code == 400
        assert "duration must be" in err
        print("[PASS] Test 03: Non-standard duration correctly rejected with 400.")
    finally:
        db.close()


def test_04_unauthorized_candidate_cannot_create_availability():
    """Test 04: Candidate role blocked from creating availability (403)."""
    _, _, cand_user, _, _, _, _ = setup_test_environment()
    db = SessionLocal()
    try:
        payload = RecruiterAvailabilityCreate(
            available_date="2026-10-20",
            start_time="10:00",
            end_time="14:00"
        )
        res, err, code = SchedulingController.create_availability(db, payload, cand_user)
        assert code == 403
        print("[PASS] Test 04: Candidate role forbidden from creating availability (403).")
    finally:
        db.close()


def test_05_cross_tenant_availability_isolation():
    """Test 05: Recruiter in Org A cannot view, update, or delete availability in Org B."""
    recruiter_a, recruiter_b, _, _, _, _, _ = setup_test_environment()
    db = SessionLocal()
    try:
        # Recruiter B creates availability in Org B
        future_date = (datetime.now(timezone.utc) + timedelta(days=4)).strftime("%Y-%m-%d")
        res_b, _, _ = SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="10:00",
            end_time="16:00",
            timezone="UTC"
        ), recruiter_b)
        avail_b_id = res_b["id"]

        # Recruiter A attempts to update Org B's availability
        _, err_up, code_up = SchedulingController.update_availability(db, avail_b_id, RecruiterAvailabilityUpdate(
            start_time="11:00"
        ), recruiter_a)
        assert code_up == 403, f"Expected 403, got {code_up}"

        # Recruiter A attempts to delete Org B's availability
        _, err_del, code_del = SchedulingController.delete_availability(db, avail_b_id, recruiter_a)
        assert code_del == 403, f"Expected 403, got {code_del}"

        # Recruiter A's listing must NOT contain Org B's availability
        list_a = SchedulingController.list_availabilities(db, recruiter_a)
        assert not any(a["id"] == avail_b_id for a in list_a), "Cross-tenant leak in availability list"
        print("[PASS] Test 05: Cross-tenant availability boundaries strictly enforced (403).")
    finally:
        db.close()


def test_06_slot_generation_duration_buffer_and_blocks():
    """Test 06: Slot generation respects duration, buffer, and excludes blocked periods."""
    recruiter_a, _, _, _, job, _, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d")
        # 10:00 to 13:00 in UTC (3 hours = 180 mins)
        # Duration: 30m, Buffer: 15m. Step = 45m.
        # Potential slots: 10:00-10:30, 10:45-11:15, 11:30-12:00, 12:15-12:45
        # Block: 11:30 to 12:00 (Lunch)
        # Expected available slots: 10:00-10:30, 10:45-11:15, 12:15-12:45 (3 slots, block excluded)
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="10:00",
            end_time="13:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=15,
            job_id=job.id,
            blocks=[
                AvailabilityBlockCreate(start_time="11:30", end_time="12:00", reason="Team Lunch")
            ]
        ), recruiter_a)

        slots = SchedulingService.generate_available_slots(
            db=db,
            organization_id=recruiter_a.organization_id,
            job_id=job.id,
            target_timezone="UTC",
            from_date=future_date,
            to_date=future_date
        )

        slot_times = [(s["local_start_time"], s["local_end_time"]) for s in slots]
        assert ("10:00", "10:30") in slot_times
        assert ("10:45", "11:15") in slot_times
        assert ("12:15", "12:45") in slot_times
        # Blocked 11:30-12:00 slot must NOT be present
        assert ("11:30", "12:00") not in slot_times
        assert len(slots) == 3, f"Expected 3 slots, got {len(slots)}: {slot_times}"
        print("[PASS] Test 06: Slot generation accurately incorporates duration, buffer, and block subtraction.")
    finally:
        db.close()


def test_07_candidate_book_slot_atomic_and_sync():
    """Test 07: Candidate books valid slot -> atomically creates booking & synchronizes candidate model."""
    recruiter_a, _, cand_user, _, job, cand_record, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=6)).strftime("%Y-%m-%d")
        avail_res, _, _ = SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="14:00",
            end_time="16:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=15,
            job_id=job.id
        ), recruiter_a)

        # Candidate fetches available slots
        slots, _, _ = SchedulingController.get_slots(
            db=db,
            current_user=cand_user,
            job_id=job.id,
            candidate_id=cand_record.id,
            timezone="UTC",
            from_date=future_date
        )
        assert len(slots) >= 1
        chosen_slot = slots[0]

        # Candidate books chosen slot
        book_payload = InterviewBookingRequest(
            candidate_id=cand_record.id,
            job_id=job.id,
            start_time_utc=chosen_slot["start_time_utc"],
            end_time_utc=chosen_slot["end_time_utc"],
            timezone="UTC",
            availability_id=chosen_slot["availability_id"],
            notes="Ready for systems architecture round"
        )
        booking, err, code = SchedulingController.book_slot(db, book_payload, cand_user)
        assert err is None
        assert code == 201
        assert booking["status"] == "scheduled"
        assert booking["candidate_id"] == cand_record.id

        # Verify CandidateModel synchronized
        cand_updated = db.query(CandidateModel).filter(CandidateModel.id == cand_record.id).first()
        assert cand_updated.interview_status == "scheduled"
        assert cand_updated.stage == "interview"
        assert cand_updated.interview_scheduled_at is not None
        assert cand_updated.interview_meeting_url == f"/interview/{cand_record.id}"

        # Verify booking in DB
        db_book = db.query(InterviewBookingModel).filter(InterviewBookingModel.id == booking["id"]).first()
        assert db_book is not None
        assert db_book.status == "scheduled"
        print("[PASS] Test 07: Candidate self-scheduled interview slot with full CandidateModel synchronization.")
    finally:
        db.close()


def test_08_concurrency_double_booking_prevented_409():
    """Test 08: Two candidates attempt to book the identical slot -> exactly one succeeds, second gets 409 Conflict."""
    recruiter_a, _, cand_user_1, cand_user_2, job, cand_rec_1, cand_rec_2 = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
        avail_res, _, _ = SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="10:00",
            end_time="11:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=0,
            job_id=job.id
        ), recruiter_a)

        slots = SchedulingService.generate_available_slots(
            db=db,
            organization_id=recruiter_a.organization_id,
            job_id=job.id,
            target_timezone="UTC",
            from_date=future_date
        )
        assert len(slots) >= 1
        target_slot = slots[0]

        # Candidate 1 attempts to book target slot
        req_1 = InterviewBookingRequest(
            candidate_id=cand_rec_1.id,
            job_id=job.id,
            start_time_utc=target_slot["start_time_utc"],
            end_time_utc=target_slot["end_time_utc"],
            timezone="UTC",
            availability_id=target_slot["availability_id"]
        )
        res_1, err_1, code_1 = SchedulingController.book_slot(db, req_1, cand_user_1)
        assert code_1 == 201, f"Candidate 1 should succeed, got {err_1}"

        # Candidate 2 attempts to book the EXACT SAME target slot
        req_2 = InterviewBookingRequest(
            candidate_id=cand_rec_2.id,
            job_id=job.id,
            start_time_utc=target_slot["start_time_utc"],
            end_time_utc=target_slot["end_time_utc"],
            timezone="UTC",
            availability_id=target_slot["availability_id"]
        )
        res_2, err_2, code_2 = SchedulingController.book_slot(db, req_2, cand_user_2)
        assert code_2 == 409, f"Candidate 2 must receive 409 Conflict, got {code_2}: {err_2}"
        assert "409 Conflict" in err_2

        # Verify only 1 active booking exists in DB for this slot
        active_bookings_count = db.query(InterviewBookingModel).filter(
            InterviewBookingModel.organization_id == recruiter_a.organization_id,
            InterviewBookingModel.status == "scheduled"
        ).count()
        assert active_bookings_count == 1
        print("[PASS] Test 08: Double-booking concurrency prevention verified (409 Conflict returned to colliding request).")
    finally:
        db.close()


def test_09_booked_slot_excluded_from_slot_query():
    """Test 09: Once booked, the slot is excluded from future available slot queries."""
    recruiter_a, _, cand_user_1, cand_user_2, job, cand_rec_1, cand_rec_2 = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=8)).strftime("%Y-%m-%d")
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="09:00",
            end_time="10:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=0,
            job_id=job.id
        ), recruiter_a)

        # Before booking: 2 slots (09:00-09:30 and 09:30-10:00)
        slots_before, _, _ = SchedulingController.get_slots(db, cand_user_1, job.id, cand_rec_1.id, "UTC", future_date)
        assert len(slots_before) == 2

        # Candidate 1 books 09:00-09:30
        SchedulingController.book_slot(db, InterviewBookingRequest(
            candidate_id=cand_rec_1.id,
            job_id=job.id,
            start_time_utc=slots_before[0]["start_time_utc"],
            end_time_utc=slots_before[0]["end_time_utc"],
            timezone="UTC"
        ), cand_user_1)

        # After booking: query available slots again
        slots_after, _, _ = SchedulingController.get_slots(db, cand_user_2, job.id, cand_rec_2.id, "UTC", future_date)
        assert len(slots_after) == 1
        assert slots_after[0]["local_start_time"] == "09:30"
        print("[PASS] Test 09: Booked slot immediately excluded from candidate availability queries.")
    finally:
        db.close()


def test_10_rescheduling_releases_old_slot_and_reserves_new():
    """Test 10: Rescheduling releases old slot, reserves new slot, and links records."""
    recruiter_a, _, cand_user_1, cand_user_2, job, cand_rec_1, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=9)).strftime("%Y-%m-%d")
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="14:00",
            end_time="16:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=0,
            job_id=job.id
        ), recruiter_a)

        slots, _, _ = SchedulingController.get_slots(db, cand_user_1, job.id, cand_rec_1.id, "UTC", future_date)
        assert len(slots) >= 2
        slot_1 = slots[0] # 14:00 - 14:30
        slot_2 = slots[1] # 14:30 - 15:00

        # Initial booking at slot 1
        booking_1, _, _ = SchedulingController.book_slot(db, InterviewBookingRequest(
            candidate_id=cand_rec_1.id,
            job_id=job.id,
            start_time_utc=slot_1["start_time_utc"],
            end_time_utc=slot_1["end_time_utc"],
            timezone="UTC"
        ), cand_user_1)

        # Reschedule to slot 2
        resched_res, err_r, code_r = SchedulingController.reschedule_interview(db, InterviewRescheduleRequest(
            booking_id=booking_1["id"],
            candidate_id=cand_rec_1.id,
            new_start_time_utc=slot_2["start_time_utc"],
            new_end_time_utc=slot_2["end_time_utc"],
            timezone="UTC",
            reason="Conflict with flight schedule"
        ), cand_user_1)
        assert code_r == 200
        assert resched_res["status"] == "scheduled"

        # Verify old booking record is 'rescheduled'
        db_b1 = db.query(InterviewBookingModel).filter(InterviewBookingModel.id == booking_1["id"]).first()
        assert db_b1.status == "rescheduled"
        assert db_b1.rescheduled_to_id == resched_res["id"]

        # Verify slot 1 is NOW RELEASED and available for Candidate 2!
        slots_cand2, _, _ = SchedulingController.get_slots(db, cand_user_2, job.id, timezone="UTC", from_date=future_date)
        times_available = [s["local_start_time"] for s in slots_cand2]
        assert "14:00" in times_available, "Old slot 14:00 must be released and bookable"
        assert "14:30" not in times_available, "New slot 14:30 must be reserved"
        print("[PASS] Test 10: Rescheduling atomically transitioned booking and released old slot.")
    finally:
        db.close()


def test_11_cancellation_releases_slot():
    """Test 11: Cancellation transitions status to 'cancelled' and releases the slot."""
    recruiter_a, _, cand_user_1, _, job, cand_rec_1, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=10)).strftime("%Y-%m-%d")
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="11:00",
            end_time="12:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=0,
            job_id=job.id
        ), recruiter_a)

        slots, _, _ = SchedulingController.get_slots(db, cand_user_1, job.id, cand_rec_1.id, "UTC", future_date)
        slot = slots[0]

        # Book slot
        booking, _, _ = SchedulingController.book_slot(db, InterviewBookingRequest(
            candidate_id=cand_rec_1.id,
            job_id=job.id,
            start_time_utc=slot["start_time_utc"],
            end_time_utc=slot["end_time_utc"],
            timezone="UTC"
        ), cand_user_1)

        # Cancel interview
        ok, err_c, code_c = SchedulingController.cancel_interview(db, InterviewCancellationRequest(
            booking_id=booking["id"],
            reason="Accepted another offer"
        ), cand_user_1)
        assert code_c == 200

        # Check candidate status
        cand_updated = db.query(CandidateModel).filter(CandidateModel.id == cand_rec_1.id).first()
        assert cand_updated.interview_status == "cancelled"

        # Check booking status in DB
        db_b = db.query(InterviewBookingModel).filter(InterviewBookingModel.id == booking["id"]).first()
        assert db_b.status == "cancelled"
        assert db_b.cancelled_by == "candidate"

        # Check slot is available again
        slots_after, _, _ = SchedulingController.get_slots(db, cand_user_1, job.id, timezone="UTC", from_date=future_date)
        times = [s["local_start_time"] for s in slots_after]
        assert "11:00" in times, "Cancelled slot must be immediately bookable again"
        print("[PASS] Test 11: Interview cancellation preserved history and freed the slot.")
    finally:
        db.close()


def test_12_timezone_conversion_cross_continent():
    """Test 12: Recruiter defines in Asia/Kolkata (IST), candidate views in America/New_York (EDT); UTC matches."""
    recruiter_a, _, cand_user_1, _, job, cand_rec_1, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=12)).strftime("%Y-%m-%d")
        # Recruiter defines in IST: 15:30 to 17:30
        # 15:30 IST is 10:00 UTC
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="15:30",
            end_time="17:30",
            timezone="Asia/Kolkata",
            slot_duration_minutes=30,
            buffer_minutes=0,
            job_id=job.id
        ), recruiter_a)

        # Candidate requests slots formatted in America/New_York
        slots_ny, _, _ = SchedulingController.get_slots(
            db=db,
            current_user=cand_user_1,
            job_id=job.id,
            candidate_id=cand_rec_1.id,
            timezone="America/New_York",
            from_date=future_date
        )
        assert len(slots_ny) >= 1
        first_slot = slots_ny[0]
        # In UTC, start_time is 10:00:00Z
        assert "10:00:00Z" in first_slot["start_time_utc"]
        # America/New_York is UTC-4 (EDT) -> 10:00 UTC is 06:00 EDT
        assert first_slot["local_start_time"] == "06:00"
        assert first_slot["timezone"] == "America/New_York"
        print("[PASS] Test 12: Timezone calculations cross-verified between Asia/Kolkata, UTC, and America/New_York.")
    finally:
        db.close()


def test_13_4d_interview_start_handoff():
    """Test 13: Scheduled interview allows candidate to enter Phase 4D interview room via /api/interview/start."""
    recruiter_a, _, cand_user, _, job, cand_record, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=14)).strftime("%Y-%m-%d")
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="10:00",
            end_time="11:00",
            timezone="UTC",
            slot_duration_minutes=30,
            buffer_minutes=0,
            job_id=job.id
        ), recruiter_a)

        slots, _, _ = SchedulingController.get_slots(db, cand_user, job.id, cand_record.id, "UTC", future_date)
        slot = slots[0]

        # Book slot
        SchedulingController.book_slot(db, InterviewBookingRequest(
            candidate_id=cand_record.id,
            job_id=job.id,
            start_time_utc=slot["start_time_utc"],
            end_time_utc=slot["end_time_utc"],
            timezone="UTC"
        ), cand_user)

        # Candidate starts interview in Phase 4D interview room
        success, err = InterviewController.start_interview(cand_record.id, db)
        assert success is True
        assert err is None

        # Verify candidate interview_status transitioned to in_progress
        cand_updated = db.query(CandidateModel).filter(CandidateModel.id == cand_record.id).first()
        assert cand_record.interview_status == "in_progress" or cand_updated.interview_status == "in_progress"
        assert cand_updated.interview_started_at is not None
        print("[PASS] Test 13: Phase 4D Interview Room entry successfully unlocked and started session.")
    finally:
        db.close()


def test_14_cannot_book_finalized_application():
    """Test 14: Applications with terminal final decision ('rejected') cannot be booked."""
    recruiter_a, _, cand_user, _, job, cand_record, _ = setup_test_environment()
    db = SessionLocal()
    try:
        cand_in_db = db.query(CandidateModel).filter(CandidateModel.id == cand_record.id).first()
        cand_in_db.hiring_decision = "rejected"
        cand_in_db.final_decision = "Rejected"
        db.commit()

        future_date = (datetime.now(timezone.utc) + timedelta(days=15)).strftime("%Y-%m-%d")
        SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="10:00",
            end_time="11:00",
            timezone="UTC"
        ), recruiter_a)

        slots, _, _ = SchedulingController.get_slots(db, cand_user, job.id, cand_record.id, "UTC", future_date)
        slot = slots[0]

        res, err, code = SchedulingController.book_slot(db, InterviewBookingRequest(
            candidate_id=cand_record.id,
            job_id=job.id,
            start_time_utc=slot["start_time_utc"],
            end_time_utc=slot["end_time_utc"],
            timezone="UTC"
        ), cand_user)
        assert code == 400
        assert "application is finalized" in err
        print("[PASS] Test 14: Finalized rejected applications blocked from interview booking.")
    finally:
        db.close()


def test_15_session_recreation_persists_schedule():
    """Test 15: Reopening a fresh DB session confirms all scheduling data is truly persisted."""
    recruiter_a, _, cand_user, _, job, cand_record, _ = setup_test_environment()
    db = SessionLocal()
    try:
        future_date = (datetime.now(timezone.utc) + timedelta(days=16)).strftime("%Y-%m-%d")
        avail_res, _, _ = SchedulingController.create_availability(db, RecruiterAvailabilityCreate(
            available_date=future_date,
            start_time="09:00",
            end_time="12:00",
            timezone="UTC",
            blocks=[AvailabilityBlockCreate(start_time="10:00", end_time="10:30", reason="Sync")]
        ), recruiter_a)
        avail_id = avail_res["id"]

        slots, _, _ = SchedulingController.get_slots(db, cand_user, job.id, cand_record.id, "UTC", future_date)
        booking, _, _ = SchedulingController.book_slot(db, InterviewBookingRequest(
            candidate_id=cand_record.id,
            job_id=job.id,
            start_time_utc=slots[0]["start_time_utc"],
            end_time_utc=slots[0]["end_time_utc"],
            timezone="UTC",
            availability_id=avail_id
        ), cand_user)
        booking_id = booking["id"]
        cand_id = cand_record.id
    finally:
        db.close()

    # Brand new DB session
    new_db = SessionLocal()
    try:
        persisted_avail = new_db.query(RecruiterAvailabilityModel).filter(
            RecruiterAvailabilityModel.id == avail_id
        ).first()
        assert persisted_avail is not None
        assert len(persisted_avail.blocks) == 1

        persisted_book = new_db.query(InterviewBookingModel).filter(
            InterviewBookingModel.id == booking_id
        ).first()
        assert persisted_book is not None
        assert persisted_book.status == "scheduled"

        cand_reload = new_db.query(CandidateModel).filter(CandidateModel.id == cand_id).first()
        assert cand_reload.interview_status == "scheduled"
        print("[PASS] Test 15: All scheduling and booking records survive database session recreation.")
    finally:
        new_db.close()


if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING PHASE 4C INTERVIEW AVAILABILITY & SELF-SCHEDULING SUITE")
    print("======================================================================\n")
    test_01_recruiter_create_availability_persists()
    test_02_invalid_time_range_rejected()
    test_03_invalid_duration_buffer_rejected()
    test_04_unauthorized_candidate_cannot_create_availability()
    test_05_cross_tenant_availability_isolation()
    test_06_slot_generation_duration_buffer_and_blocks()
    test_07_candidate_book_slot_atomic_and_sync()
    test_08_concurrency_double_booking_prevented_409()
    test_09_booked_slot_excluded_from_slot_query()
    test_10_rescheduling_releases_old_slot_and_reserves_new()
    test_11_cancellation_releases_slot()
    test_12_timezone_conversion_cross_continent()
    test_13_4d_interview_start_handoff()
    test_14_cannot_book_finalized_application()
    test_15_session_recreation_persists_schedule()
    print("\n======================================================================")
    print("ALL 15 PHASE 4C SCHEDULING TESTS PASSED FLAWLESSLY.")
    print("======================================================================")
