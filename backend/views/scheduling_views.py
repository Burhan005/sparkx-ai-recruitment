"""
(V) Scheduling Views - HTTP Presentation & Route Endpoints for Interview Availability & Scheduling (Phase 4C)
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import UserModel
from auth_dependencies import get_current_user, require_recruiter
from schemas import (
    RecruiterAvailabilityCreate, RecruiterAvailabilityUpdate,
    RecruiterAvailabilityResponse, AvailabilityBlockCreate,
    InterviewSlot, InterviewBookingRequest, InterviewBookingResponse,
    InterviewRescheduleRequest, InterviewCancellationRequest
)
from controllers.scheduling_controller import SchedulingController

router = APIRouter(prefix="/api/scheduling", tags=["Interview Scheduling"])


# ── Recruiter Availability Endpoints ──────────────────────────────────────────

@router.get("/availability", response_model=List[RecruiterAvailabilityResponse])
def list_availability(
    job_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter lists active availability windows within their organization."""
    return SchedulingController.list_availabilities(db, current_user, job_id=job_id, date_str=date)


@router.post("/availability", response_model=RecruiterAvailabilityResponse, status_code=status.HTTP_201_CREATED)
def create_availability(
    payload: RecruiterAvailabilityCreate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter creates a new working availability window with optional blocked intervals."""
    res, err, code = SchedulingController.create_availability(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.put("/availability/{availability_id}", response_model=RecruiterAvailabilityResponse)
def update_availability(
    availability_id: str,
    payload: RecruiterAvailabilityUpdate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter updates their availability window or blocked intervals."""
    res, err, code = SchedulingController.update_availability(db, availability_id, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


@router.delete("/availability/{availability_id}")
def delete_availability(
    availability_id: str,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter archives/deactivates an availability window."""
    ok, err, code = SchedulingController.delete_availability(db, availability_id, current_user)
    if not ok:
        raise HTTPException(status_code=code, detail=err)
    return {"success": True, "message": "Availability window archived"}


@router.post("/availability/{availability_id}/block", response_model=RecruiterAvailabilityResponse, status_code=status.HTTP_201_CREATED)
def add_availability_block(
    availability_id: str,
    payload: AvailabilityBlockCreate,
    current_user: UserModel = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    """Recruiter marks a sub-period unavailable (e.g. lunch or meeting)."""
    res, err, code = SchedulingController.add_block(db, availability_id, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return res


# ── Slot Query & Self-Scheduling Endpoints ────────────────────────────────────

@router.get("/slots", response_model=List[InterviewSlot])
def get_available_slots(
    job_id: Optional[str] = Query(None),
    candidate_id: Optional[str] = Query(None),
    timezone: Optional[str] = Query("UTC"),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate or recruiter fetches real database-calculated available interview slots
    accounting for availability windows, blocked periods, and existing active bookings.
    """
    slots, err, code = SchedulingController.get_slots(
        db=db,
        current_user=current_user,
        job_id=job_id,
        candidate_id=candidate_id,
        timezone=timezone or "UTC",
        from_date=from_date,
        to_date=to_date
    )
    if err:
        raise HTTPException(status_code=code, detail=err)
    return slots


@router.post("/book", response_model=InterviewBookingResponse, status_code=status.HTTP_201_CREATED)
def book_interview_slot(
    payload: InterviewBookingRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Candidate self-schedules or recruiter books an interview slot atomically.
    Guarantees conflict protection (409 Conflict) and database synchronization.
    """
    booking, err, code = SchedulingController.book_slot(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return booking


@router.post("/reschedule", response_model=InterviewBookingResponse)
def reschedule_interview(
    payload: InterviewRescheduleRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atomically reschedules an active interview slot, releasing the old slot and reserving the new one.
    """
    booking, err, code = SchedulingController.reschedule_interview(db, payload, current_user)
    if err:
        raise HTTPException(status_code=code, detail=err)
    return booking


@router.post("/cancel")
def cancel_interview(
    payload: InterviewCancellationRequest,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancels an active scheduled interview and releases the slot.
    """
    ok, err, code = SchedulingController.cancel_interview(db, payload, current_user)
    if not ok:
        raise HTTPException(status_code=code, detail=err)
    return {"success": True, "message": "Interview cancelled successfully"}


@router.get("/my-interviews", response_model=List[InterviewBookingResponse])
def get_my_interviews(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch active and historical interview bookings for the authenticated user."""
    return SchedulingController.get_my_interviews(db, current_user)
