"""
End-to-End Test Suite for SparkX Authoritative 4-Dimensional Hiring Workflow Architecture
Tests:
1. Pure FSM transition validation rules
2. Legacy projections correctness & idempotency
3. Database persistence of all 4 dimensions & timestamps
4. Audit log generation for every state mutation
5. Assessment lifecycle: not_invited -> invited -> in_progress -> submitted -> evaluated
6. Interview lifecycle: not_scheduled -> scheduled -> in_progress -> completed
7. Decoupled hiring decisions: Shortlisting does not overwrite stage; Evaluation does not auto-shortlist
"""
import sys
import os
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from workflow_contract import (
    STAGE_APPLIED, STAGE_SCREENING, STAGE_ASSESSMENT, STAGE_INTERVIEW, STAGE_REVIEW, STAGE_COMPLETED,
    ASSESS_NOT_INVITED, ASSESS_INVITED, ASSESS_IN_PROGRESS, ASSESS_SUBMITTED, ASSESS_EVALUATED, ASSESS_EXPIRED,
    INTERVIEW_NOT_SCHEDULED, INTERVIEW_SCHEDULED, INTERVIEW_IN_PROGRESS, INTERVIEW_COMPLETED, INTERVIEW_CANCELLED,
    DECISION_UNDECIDED, DECISION_SHORTLISTED, DECISION_SELECTED, DECISION_REJECTED,
    validate_transition, project_legacy_status, project_legacy_final_decision
)
from database import SessionLocal
from models.db_models import JobModel, CandidateModel
from schemas import (
    CandidateApply, CandidateScheduleRequest, AssessmentSubmitRequest, EvaluationRequest
)
from controllers.candidate_controller import CandidateController
from controllers.assessment_controller import AssessmentController
from controllers.interview_controller import InterviewController

def run_tests():
    print("=" * 70)
    print("RUNNING AUTHORITATIVE WORKFLOW STATE ARCHITECTURE TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------------------
    # TEST 1: Pure FSM Transition Rules
    # -------------------------------------------------------------------------
    print("\n--- TEST 1: FSM State Transition Contract Validation ---")
    
    # Valid forward stage transitions
    assert validate_transition("stage", STAGE_APPLIED, STAGE_SCREENING)[0] is True
    assert validate_transition("stage", STAGE_SCREENING, STAGE_ASSESSMENT)[0] is True
    assert validate_transition("stage", STAGE_ASSESSMENT, STAGE_INTERVIEW)[0] is True
    assert validate_transition("stage", STAGE_INTERVIEW, STAGE_REVIEW)[0] is True
    assert validate_transition("stage", STAGE_REVIEW, STAGE_COMPLETED)[0] is True
    print("✓ Valid forward stage transitions pass")

    # Invalid stage skip: cannot jump directly from applied to review
    assert validate_transition("stage", STAGE_APPLIED, STAGE_REVIEW)[0] is False
    assert validate_transition("stage", STAGE_APPLIED, "unknown_stage")[0] is False
    # Backward stage transitions allowed
    assert validate_transition("stage", STAGE_INTERVIEW, STAGE_ASSESSMENT)[0] is True
    print("✓ Stage boundary & regression rules pass")

    # Assessment lifecycle transitions
    assert validate_transition("assessment", ASSESS_NOT_INVITED, ASSESS_INVITED)[0] is True
    assert validate_transition("assessment", ASSESS_INVITED, ASSESS_IN_PROGRESS)[0] is True
    assert validate_transition("assessment", ASSESS_IN_PROGRESS, ASSESS_SUBMITTED)[0] is True
    assert validate_transition("assessment", ASSESS_SUBMITTED, ASSESS_EVALUATED)[0] is True
    # Cannot jump from not_invited straight to evaluated
    assert validate_transition("assessment", ASSESS_NOT_INVITED, ASSESS_EVALUATED)[0] is False
    # Cannot regress from evaluated to not_invited
    assert validate_transition("assessment", ASSESS_EVALUATED, ASSESS_NOT_INVITED)[0] is False
    print("✓ Assessment lifecycle transition enforcement pass")

    # Interview lifecycle transitions
    assert validate_transition("interview", INTERVIEW_NOT_SCHEDULED, INTERVIEW_SCHEDULED)[0] is True
    assert validate_transition("interview", INTERVIEW_SCHEDULED, INTERVIEW_IN_PROGRESS)[0] is True
    assert validate_transition("interview", INTERVIEW_IN_PROGRESS, INTERVIEW_COMPLETED)[0] is True
    assert validate_transition("interview", INTERVIEW_SCHEDULED, INTERVIEW_CANCELLED)[0] is True
    # Cannot start an unscheduled interview
    assert validate_transition("interview", INTERVIEW_NOT_SCHEDULED, INTERVIEW_IN_PROGRESS)[0] is False
    print("✓ Interview lifecycle transition enforcement pass")

    # -------------------------------------------------------------------------
    # TEST 2: Legacy Projections Determinism
    # -------------------------------------------------------------------------
    print("\n--- TEST 2: Legacy Projections Correctness ---")
    # Applied
    assert project_legacy_status(STAGE_APPLIED, ASSESS_NOT_INVITED, INTERVIEW_NOT_SCHEDULED, DECISION_UNDECIDED) == "Applied"
    # Assessment stage
    assert project_legacy_status(STAGE_ASSESSMENT, ASSESS_IN_PROGRESS, INTERVIEW_NOT_SCHEDULED, DECISION_UNDECIDED) == "Under Review"
    # Interview stage
    assert project_legacy_status(STAGE_INTERVIEW, ASSESS_EVALUATED, INTERVIEW_SCHEDULED, DECISION_UNDECIDED) == "Interview"
    # Overriding shortlisted decision projection on status
    assert project_legacy_status(STAGE_REVIEW, ASSESS_EVALUATED, INTERVIEW_COMPLETED, DECISION_SHORTLISTED) == "Shortlisted"
    # Shortlisted decision projection
    assert project_legacy_final_decision(STAGE_INTERVIEW, DECISION_SHORTLISTED) == "Shortlisted"
    # Selected decision projection
    assert project_legacy_final_decision(STAGE_COMPLETED, DECISION_SELECTED) == "Selected"
    # Undecided in screening
    assert project_legacy_final_decision(STAGE_SCREENING, DECISION_UNDECIDED) == "Under Review"
    print("✓ Projections produce backwards-compatible strings without mutating authoritative columns")

    # -------------------------------------------------------------------------
    # TEST 3: Database Persistence & Full Lifecycle Integration
    # -------------------------------------------------------------------------
    print("\n--- TEST 3: Full End-to-End Candidate Lifecycle in Database ---")
    db = SessionLocal()
    try:
        # Create or fetch a test job
        job = db.query(JobModel).first()
        if not job:
            job = JobModel(
                title="Workflow Test Engineer",
                department="Engineering",
                role_type="Technical",
                status="Active"
            )
            db.add(job)
            db.commit()
            db.refresh(job)

        test_email = f"wf_test_{int(datetime.now().timestamp())}@example.com"
        
        # 3.1: Apply candidate
        apply_payload = CandidateApply(
            job_id=job.id,
            name="Workflow Test Candidate",
            email=test_email,
            phone="+1234567890",
            experience_years=5,
            education="B.S. in Computer Science",
            skills=["Python", "React", "PostgreSQL", "FastAPI"]
        )
        cand, err = CandidateController.apply_candidate(apply_payload, db)
        assert err is None, f"Failed to apply: {err}"
        assert cand.id is not None
        assert cand.stage == STAGE_APPLIED
        assert cand.assessment_status == ASSESS_NOT_INVITED
        assert cand.interview_status == INTERVIEW_NOT_SCHEDULED
        assert cand.hiring_decision == DECISION_UNDECIDED
        print(f"✓ Step 3.1: Applied candidate created (ID: {cand.id}) with initial 4D state")

        # Verify initial audit log
        logs = CandidateController.get_state_logs(cand.id, db)
        assert len(logs) >= 1
        assert logs[0].dimension == "stage"
        assert logs[0].to_value == "applied"
        print(f"✓ Initial audit log verified: {logs[0].dimension} -> {logs[0].to_value}")

        # 3.2: Move to Screening
        cand, err = CandidateController.update_stage(
            candidate_id=cand.id,
            new_stage=STAGE_SCREENING,
            notes="Passed resume screening",
            changed_by="recruiter@sparkx.ai",
            db=db
        )
        assert err is None, f"Failed to update stage: {err}"
        assert cand.stage == STAGE_SCREENING
        print("✓ Step 3.2: Stage advanced to 'screening'")

        # 3.3: Idempotent Assessment Invitation
        cand, err = CandidateController.invite_assessment(
            candidate_id=cand.id,
            custom_message="Inviting to coding sandbox",
            changed_by="recruiter@sparkx.ai",
            db=db
        )
        assert err is None, f"Failed to invite assessment: {err}"
        assert cand.stage == STAGE_ASSESSMENT
        assert cand.assessment_status == ASSESS_INVITED
        assert cand.assessment_invited_at is not None
        first_invite_time = cand.assessment_invited_at
        
        # Call invite again to verify idempotency
        cand_reinvited, err2 = CandidateController.invite_assessment(
            candidate_id=cand.id,
            changed_by="recruiter@sparkx.ai",
            db=db
        )
        assert err2 is None
        assert cand_reinvited.assessment_status == ASSESS_INVITED
        assert cand_reinvited.assessment_invited_at == first_invite_time
        print("✓ Step 3.3: Assessment invitation is idempotent and recorded timestamp")

        # 3.4: Candidate starts assessment
        success, err = AssessmentController.start_assessment(cand.id, db)
        assert success is True, f"Failed to start assessment: {err}"
        db.refresh(cand)
        assert cand.assessment_status == ASSESS_IN_PROGRESS
        assert cand.assessment_started_at is not None
        print("✓ Step 3.4: Assessment started -> 'in_progress'")

        # 3.5: Candidate submits assessment
        submit_payload = AssessmentSubmitRequest(
            candidate_id=cand.id,
            job_id=job.id,
            category_scores={"technical": 90, "scenario": 85, "hands_on": 95, "troubleshooting": 88, "overall": 91},
            answers={
                "hands_on": {"code": "def solve(): return 42", "language": "python"},
                "troubleshooting": {"code": "def fix(): return True", "language": "python"}
            }
        )
        submit_res, err = AssessmentController.submit_candidate_assessment(cand.id, submit_payload, db)
        assert err is None, f"Failed to submit assessment: {err}"
        db.refresh(cand)
        assert cand.assessment_status == ASSESS_EVALUATED
        assert cand.assessment_evaluated_at is not None
        assert cand.coding_score is not None
        # Crucial architectural constraint: assessment submission must NOT mutate hiring decision
        assert cand.hiring_decision == DECISION_UNDECIDED
        # Stage must have advanced to review
        assert cand.stage == STAGE_REVIEW
        print("✓ Step 3.5: Assessment evaluated (Score: 91/100). Hiring decision remained undecided.")

        # 3.6: Recruiter schedules interview
        schedule_payload = CandidateScheduleRequest(
            scheduled_at="Tomorrow 2:00 PM",
            notes="Technical architecture interview",
            meeting_url="https://meet.google.com/abc-defg-hij"
        )
        cand, err = CandidateController.schedule_interview(cand.id, schedule_payload, db)
        assert err is None, f"Failed to schedule interview: {err}"
        assert cand.stage == STAGE_INTERVIEW
        assert cand.interview_status == INTERVIEW_SCHEDULED
        assert cand.interview_scheduled_at is not None
        assert cand.interview_meeting_url == "https://meet.google.com/abc-defg-hij"
        # Decision must still be undecided
        assert cand.hiring_decision == DECISION_UNDECIDED
        print("✓ Step 3.6: Interview scheduled. Stage is 'interview', decision is undecided.")

        # 3.7: Interview starts
        success, err = InterviewController.start_interview(cand.id, db)
        assert success is True, f"Failed to start interview: {err}"
        db.refresh(cand)
        assert cand.interview_status == INTERVIEW_IN_PROGRESS
        assert cand.interview_started_at is not None
        print("✓ Step 3.7: Interview started -> 'in_progress'")

        # 3.8: Interview concludes & evaluation submitted
        eval_payload = EvaluationRequest(
            candidate_id=cand.id,
            job_id=job.id,
            transcript=[
                {"role": "assistant", "content": "Tell me about your experience with systems design."},
                {"role": "candidate", "content": "I built distributed microservices with FastAPI and event queues."}
            ],
            integrity_score=95,
            integrity_events=[],
            code_score=90
        )
        eval_res, err = InterviewController.evaluate_session(eval_payload, db)
        assert err is None, f"Failed to evaluate interview: {err}"
        db.refresh(cand)
        assert cand.interview_status == INTERVIEW_COMPLETED
        assert cand.interview_completed_at is not None
        assert cand.stage == STAGE_REVIEW
        # Crucial architectural constraint: Interview evaluation must NOT auto-shortlist
        assert cand.hiring_decision == DECISION_UNDECIDED
        print("✓ Step 3.8: Interview completed -> Stage 'review'. Decision remained undecided.")

        # 3.9: Recruiter explicitly shortlists candidate
        cand, err = CandidateController.update_hiring_decision(
            candidate_id=cand.id,
            decision=DECISION_SHORTLISTED,
            reason="Top 5% technical test and interview performance.",
            changed_by="lead_recruiter@sparkx.ai",
            db=db
        )
        assert err is None, f"Failed to shortlist: {err}"
        assert cand.hiring_decision == DECISION_SHORTLISTED
        # Stage is still 'review', NOT overwritten by 'shortlisted'
        assert cand.stage == STAGE_REVIEW
        print("✓ Step 3.9: Candidate shortlisted. Stage preserved as 'review' (orthogonal dimensions).")

        # 3.10: Final Selection & Stage Completion
        cand, err = CandidateController.update_hiring_decision(
            candidate_id=cand.id,
            decision=DECISION_SELECTED,
            reason="Offer approved for Senior Engineer role.",
            changed_by="hiring_manager@sparkx.ai",
            db=db
        )
        assert err is None
        cand, err = CandidateController.update_stage(
            candidate_id=cand.id,
            new_stage=STAGE_COMPLETED,
            notes="Workflow concluded.",
            changed_by="hiring_manager@sparkx.ai",
            db=db
        )
        assert err is None
        assert cand.hiring_decision == DECISION_SELECTED
        assert cand.stage == STAGE_COMPLETED
        print("✓ Step 3.10: Final decision 'selected', stage 'completed'.")

        # 3.11: Verify Complete Audit Log Trail
        final_logs = CandidateController.get_state_logs(cand.id, db)
        print(f"\n--- TEST 4: Audit Log Trail Verification ({len(final_logs)} log entries) ---")
        for log in final_logs:
            actor = getattr(log, 'changed_by', getattr(log, 'actor_email', 'system'))
            reason = getattr(log, 'notes', getattr(log, 'reason', ''))
            print(f"  • [{log.created_at}] Dim: {log.dimension:<18} | {str(log.from_value):<14} -> {str(log.to_value):<14} | Actor: {str(actor):<24} | Notes: {str(reason)}")
        
        # Verify log coverage for all 4 dimensions
        logged_dimensions = {l.dimension for l in final_logs}
        assert "stage" in logged_dimensions
        assert "assessment_status" in logged_dimensions or "assessment" in logged_dimensions
        assert "interview_status" in logged_dimensions or "interview" in logged_dimensions
        assert "hiring_decision" in logged_dimensions or "decision" in logged_dimensions
        print("\n✓ All 4 dimensions have persistent audit logs with timestamps and actors!")

    finally:
        try:
            if 'cand' in locals() and cand and cand.id:
                CandidateController.delete_candidate(cand.id, db) if hasattr(CandidateController, 'delete_candidate') else None
                from models.db_models import CandidateStateLogModel, IntegrityLogModel
                db.query(CandidateStateLogModel).filter(CandidateStateLogModel.candidate_id == cand.id).delete()
                db.query(IntegrityLogModel).filter(IntegrityLogModel.candidate_id == cand.id).delete()
                db.query(CandidateModel).filter(CandidateModel.id == cand.id).delete()
                db.commit()
        except Exception:
            db.rollback()
        db.close()

    print("\n" + "=" * 70)
    print("🎉 ALL STATE ARCHITECTURE TESTS PASSED WITH 100% INTEGRITY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
