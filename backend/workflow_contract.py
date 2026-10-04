"""
(C) SparkX Authoritative Workflow Contract
Single source of truth for the 4-dimensional hiring state architecture.
Dimensions:
  1. stage               - Where candidate is in the pipeline
  2. assessment_status   - Technical test lifecycle
  3. interview_status    - Video/interview scheduling & execution lifecycle
  4. hiring_decision     - Recruiter committee verdict
"""
from typing import Tuple, Optional, Dict, Any, List

# ── 1. Pipeline Stages ────────────────────────────────────────────────────────
STAGE_APPLIED = "applied"
STAGE_SCREENING = "screening"
STAGE_ASSESSMENT = "assessment"
STAGE_INTERVIEW = "interview"
STAGE_REVIEW = "review"
STAGE_COMPLETED = "completed"

VALID_STAGES = [
    STAGE_APPLIED,
    STAGE_SCREENING,
    STAGE_ASSESSMENT,
    STAGE_INTERVIEW,
    STAGE_REVIEW,
    STAGE_COMPLETED,
]

# ── 2. Assessment Lifecycle ───────────────────────────────────────────────────
ASSESS_NOT_INVITED = "not_invited"
ASSESS_INVITED = "invited"
ASSESS_IN_PROGRESS = "in_progress"
ASSESS_SUBMITTED = "submitted"
ASSESS_EVALUATED = "evaluated"
ASSESS_EXPIRED = "expired"

VALID_ASSESSMENT_STATUSES = [
    ASSESS_NOT_INVITED,
    ASSESS_INVITED,
    ASSESS_IN_PROGRESS,
    ASSESS_SUBMITTED,
    ASSESS_EVALUATED,
    ASSESS_EXPIRED,
]

# ── 3. Interview Lifecycle ────────────────────────────────────────────────────
INTERVIEW_NOT_SCHEDULED = "not_scheduled"
INTERVIEW_SCHEDULED = "scheduled"
INTERVIEW_IN_PROGRESS = "in_progress"
INTERVIEW_COMPLETED = "completed"
INTERVIEW_CANCELLED = "cancelled"

VALID_INTERVIEW_STATUSES = [
    INTERVIEW_NOT_SCHEDULED,
    INTERVIEW_SCHEDULED,
    INTERVIEW_IN_PROGRESS,
    INTERVIEW_COMPLETED,
    INTERVIEW_CANCELLED,
]

# ── 4. Hiring Decision ────────────────────────────────────────────────────────
DECISION_UNDECIDED = "undecided"
DECISION_SHORTLISTED = "shortlisted"
DECISION_SELECTED = "selected"
DECISION_REJECTED = "rejected"

VALID_HIRING_DECISIONS = [
    DECISION_UNDECIDED,
    DECISION_SHORTLISTED,
    DECISION_SELECTED,
    DECISION_REJECTED,
]

# Terminal final decisions (immutable without authorized reopening)
FINAL_DECISIONS = [DECISION_SELECTED, DECISION_REJECTED]

def is_final_decision(decision: str) -> bool:
    """Returns True if the decision is a terminal final decision (selected or rejected)."""
    return (decision or "").lower().strip() in FINAL_DECISIONS

# ── 5. State Transition Guard Rules ──────────────────────────────────────────

# Permitted stage transitions
ALLOWED_STAGE_TRANSITIONS: Dict[str, List[str]] = {
    STAGE_APPLIED: [STAGE_SCREENING],
    STAGE_SCREENING: [STAGE_ASSESSMENT, STAGE_INTERVIEW, STAGE_REVIEW],
    STAGE_ASSESSMENT: [STAGE_INTERVIEW, STAGE_REVIEW],
    STAGE_INTERVIEW: [STAGE_REVIEW],
    STAGE_REVIEW: [STAGE_INTERVIEW, STAGE_COMPLETED],
    STAGE_COMPLETED: [], # Terminal stage: cannot regress through ordinary controls; requires authorized reopening
}

# Permitted assessment transitions
ALLOWED_ASSESSMENT_TRANSITIONS: Dict[str, List[str]] = {
    ASSESS_NOT_INVITED: [ASSESS_INVITED],
    ASSESS_INVITED: [ASSESS_INVITED, ASSESS_IN_PROGRESS, ASSESS_EXPIRED], # Self-loop for idempotent re-invite
    ASSESS_IN_PROGRESS: [ASSESS_SUBMITTED, ASSESS_EXPIRED],
    ASSESS_SUBMITTED: [ASSESS_EVALUATED],
    ASSESS_EVALUATED: [], # Terminal assessment state
    ASSESS_EXPIRED: [ASSESS_INVITED], # Re-invitation after expiry
}

# Permitted interview transitions
ALLOWED_INTERVIEW_TRANSITIONS: Dict[str, List[str]] = {
    INTERVIEW_NOT_SCHEDULED: [INTERVIEW_SCHEDULED],
    INTERVIEW_SCHEDULED: [INTERVIEW_SCHEDULED, INTERVIEW_IN_PROGRESS, INTERVIEW_CANCELLED], # Self-loop for reschedule
    INTERVIEW_IN_PROGRESS: [INTERVIEW_COMPLETED, INTERVIEW_CANCELLED],
    INTERVIEW_COMPLETED: [], # Terminal interview state
    INTERVIEW_CANCELLED: [INTERVIEW_SCHEDULED],
}

# Permitted decision transitions
ALLOWED_DECISION_TRANSITIONS: Dict[str, List[str]] = {
    DECISION_UNDECIDED: [DECISION_SHORTLISTED, DECISION_SELECTED, DECISION_REJECTED],
    DECISION_SHORTLISTED: [DECISION_UNDECIDED, DECISION_SELECTED, DECISION_REJECTED],
    DECISION_SELECTED: [], # Terminal: cannot overwrite without authorized reopening
    DECISION_REJECTED: [], # Terminal: cannot overwrite without authorized reopening
}

def validate_stage_transition(current: str, target: str, current_decision: str = None, candidate: Any = None) -> Tuple[bool, Optional[str]]:
    current = (current or STAGE_APPLIED).lower().strip()
    target = (target or "").lower().strip()
    dec = (current_decision or "").lower().strip()

    # CRITICAL: Prevent ordinary regression of finalized applications
    if dec in FINAL_DECISIONS and target != STAGE_COMPLETED and current != target:
        return False, f"Cannot alter stage of an application with a recorded final decision ('{dec}'). Finalized applications cannot regress through ordinary controls. Use authorized Reopen Application."

    if current == STAGE_COMPLETED and target != STAGE_COMPLETED:
        return False, "Cannot move a completed application backward through ordinary controls. Use authorized Reopen Application."

    if target not in VALID_STAGES:
        return False, f"Invalid stage '{target}'. Must be one of: {VALID_STAGES}"
    if current == target:
        return True, None

    # Cross-dimensional validation guards
    if candidate:
        if getattr(candidate, "interview_status", "") == INTERVIEW_COMPLETED and target in [STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT]:
            return False, f"Illegal regression: Candidate interview has already been completed; cannot regress stage to '{target}'."
        if getattr(candidate, "assessment_status", "") in [ASSESS_EVALUATED, ASSESS_SUBMITTED] and target in [STAGE_APPLIED, STAGE_SCREENING]:
            return False, f"Illegal regression: Candidate technical assessment is already {candidate.assessment_status}; cannot regress stage to '{target}'."
        if getattr(candidate, "hiring_decision", "") in FINAL_DECISIONS and target in [STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT, STAGE_INTERVIEW]:
            return False, f"Illegal transition: Candidate application is finalized with decision '{candidate.hiring_decision}'; cannot move stage to '{target}'."

    allowed = ALLOWED_STAGE_TRANSITIONS.get(current, [])
    if target not in allowed:
        return False, f"Illegal stage transition from '{current}' to '{target}'"
    return True, None

def validate_assessment_transition(current: str, target: str, candidate: Any = None) -> Tuple[bool, Optional[str]]:
    current = (current or ASSESS_NOT_INVITED).lower()
    target = (target or "").lower()
    if target not in VALID_ASSESSMENT_STATUSES:
        return False, f"Invalid assessment status '{target}'. Must be one of: {VALID_ASSESSMENT_STATUSES}"
    if current == target:
        return True, None

    # Cross-dimensional validation guards
    if candidate:
        if getattr(candidate, "hiring_decision", "") in FINAL_DECISIONS:
            return False, f"Cannot alter assessment: Candidate application has a recorded final decision ('{candidate.hiring_decision}')."
        if getattr(candidate, "interview_status", "") == INTERVIEW_COMPLETED:
            return False, "Cannot alter assessment: Candidate interview is already completed."
        if getattr(candidate, "stage", "") == STAGE_COMPLETED:
            return False, "Cannot alter assessment: application is completed."

    allowed = ALLOWED_ASSESSMENT_TRANSITIONS.get(current, [])
    if target not in allowed:
        return False, f"Illegal assessment status transition from '{current}' to '{target}'"
    return True, None

def validate_interview_transition(current: str, target: str) -> Tuple[bool, Optional[str]]:
    current = (current or INTERVIEW_NOT_SCHEDULED).lower()
    target = (target or "").lower()
    if target not in VALID_INTERVIEW_STATUSES:
        return False, f"Invalid interview status '{target}'. Must be one of: {VALID_INTERVIEW_STATUSES}"
    if current == target:
        return True, None
    allowed = ALLOWED_INTERVIEW_TRANSITIONS.get(current, [])
    if target not in allowed:
        return False, f"Illegal interview status transition from '{current}' to '{target}'"
    return True, None

def validate_decision_transition(current: str, target: str) -> Tuple[bool, Optional[str]]:
    current = (current or DECISION_UNDECIDED).lower().strip()
    target = (target or "").lower().strip()

    # CRITICAL: Prevent ordinary regression or reset of final decisions
    if current in FINAL_DECISIONS and current != target:
        return False, f"Final hiring decision ('{current}') is immutable and cannot be overwritten through standard decision controls. Use authorized Reopen Application with mandatory audit reason."

    if target not in VALID_HIRING_DECISIONS:
        return False, f"Invalid hiring decision '{target}'. Must be one of: {VALID_HIRING_DECISIONS}"
    if current == target:
        return True, None
    allowed = ALLOWED_DECISION_TRANSITIONS.get(current, [])
    if target not in allowed:
        return False, f"Illegal hiring decision transition from '{current}' to '{target}'"
    return True, None

def validate_reopen_application(current_stage: str, current_decision: str, reason: str) -> Tuple[bool, Optional[str]]:
    """
    Validates controlled reopening:
    1. Application must be finalized (decision in FINAL_DECISIONS or stage == STAGE_COMPLETED).
    2. Reopen reason is strictly mandatory (minimum 10 characters).
    """
    dec = (current_decision or "").lower().strip()
    stg = (current_stage or "").lower().strip()

    if dec not in FINAL_DECISIONS and stg != STAGE_COMPLETED:
        return False, "Application is not in a finalized state. Reopening is only permitted for completed/finalized applications."

    clean_reason = (reason or "").strip()
    if not clean_reason or len(clean_reason) < 10:
        return False, "A detailed reopening justification is mandatory (minimum 10 characters required for audit trail)."

    return True, None

def validate_transition(dimension: str, current: str, target: str) -> Tuple[bool, Optional[str]]:
    dim = (dimension or "").lower().strip()
    if dim in ["stage", "stages"]:
        return validate_stage_transition(current, target)
    elif dim in ["assessment", "assessment_status"]:
        return validate_assessment_transition(current, target)
    elif dim in ["interview", "interview_status"]:
        return validate_interview_transition(current, target)
    elif dim in ["decision", "hiring_decision"]:
        return validate_decision_transition(current, target)
    return False, f"Unknown workflow dimension '{dimension}'"

# ── 6. Legacy Read-Only Projections ──────────────────────────────────────────
# Used ONLY to satisfy legacy external clients without polluting core state
def project_legacy_status(stage: str, *args, **kwargs) -> str:
    """Project the authoritative 4D state onto legacy 'status' string."""
    decision = None
    if len(args) == 1:
        decision = args[0]
    elif len(args) >= 3:
        decision = args[2]
    else:
        decision = kwargs.get("decision") or kwargs.get("hiring_decision") or kwargs.get("final_decision")

    if decision == DECISION_REJECTED:
        return "Rejected"
    if decision == DECISION_SELECTED:
        return "Selected"
    if decision == DECISION_SHORTLISTED:
        return "Shortlisted"
    
    stage_map = {
        STAGE_APPLIED: "Applied",
        STAGE_SCREENING: "Screening",
        STAGE_ASSESSMENT: "Under Review",
        STAGE_INTERVIEW: "Interview",
        STAGE_REVIEW: "Evaluated",
        STAGE_COMPLETED: "Completed"
    }
    return stage_map.get(stage, "Under Review")

def project_legacy_final_decision(stage: str = None, decision: str = None, *args, **kwargs) -> str:
    """Project the authoritative decision onto legacy 'final_decision' string."""
    dec = decision or kwargs.get("hiring_decision")
    if not dec and args:
        dec = args[-1]
    if dec == DECISION_REJECTED:
        return "Rejected"
    if dec == DECISION_SELECTED:
        return "Selected"
    if dec == DECISION_SHORTLISTED:
        return "Shortlisted"
    return "Under Review"

def normalize_legacy_candidate_fields(raw_status: str, raw_decision: str, has_slot: bool, has_coding: bool) -> Dict[str, str]:
    """
    Deterministic backfill logic for existing database rows:
    Splits old overloaded strings into the 4 new decoupled dimensions.
    """
    s = (raw_status or "").strip().lower()
    d = (raw_decision or "").strip().lower()

    # 1. Determine decision
    if "reject" in d or "reject" in s:
        decision = DECISION_REJECTED
    elif "select" in d or "select" in s or "offer" in d or "offer" in s:
        decision = DECISION_SELECTED
    elif "shortlist" in d or "shortlist" in s:
        decision = DECISION_SHORTLISTED
    else:
        decision = DECISION_UNDECIDED

    # 2. Determine interview status
    if has_slot or "interview" in s or "interview" in d or "scheduled" in s:
        interview = INTERVIEW_SCHEDULED
    else:
        interview = INTERVIEW_NOT_SCHEDULED

    # 3. Determine assessment status
    if has_coding:
        assess = ASSESS_EVALUATED
    elif "assessment" in s:
        assess = ASSESS_INVITED
    else:
        assess = ASSESS_NOT_INVITED

    # 4. Determine stage
    if decision in [DECISION_SELECTED, DECISION_REJECTED]:
        stage = STAGE_COMPLETED
    elif interview == INTERVIEW_SCHEDULED:
        stage = STAGE_INTERVIEW
    elif assess in [ASSESS_EVALUATED, ASSESS_SUBMITTED]:
        stage = STAGE_REVIEW
    elif assess in [ASSESS_INVITED, ASSESS_IN_PROGRESS]:
        stage = STAGE_ASSESSMENT
    elif "screening" in s or "under review" in s:
        stage = STAGE_SCREENING
    else:
        stage = STAGE_APPLIED

    return {
        "stage": stage,
        "assessment_status": assess,
        "interview_status": interview,
        "hiring_decision": decision,
    }
