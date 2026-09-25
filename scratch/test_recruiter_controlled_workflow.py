import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, r"C:\Sparkx\sparkx-ai-recruitment\backend")

from database import SessionLocal
import models
import schemas
from controllers.assessment_controller import AssessmentController
from controllers.candidate_controller import CandidateController

def run_comprehensive_workflow_verification():
    db = SessionLocal()
    print("================================================================================")
    print("STARTING END-TO-END RECRUITER-CONTROLLED ASSESSMENT & PRIVACY VERIFICATION TEST")
    print("================================================================================")

    # Pick or create a candidate in initial "Applied" state
    cand = db.query(models.CandidateModel).filter(models.CandidateModel.email == "test_screening_candidate@example.com").first()
    if cand:
        db.delete(cand)
        db.commit()

    # Step 1: Candidate Applies
    print("\n--- STEP 1: Candidate Submits Application ---")
    apply_payload = schemas.CandidateApply(
        job_id="job-101",
        name="Test Screening Applicant",
        email="test_screening_candidate@example.com",
        phone="+1 555-0199",
        experience_years=4.0,
        education="B.S. Computer Science",
        skills=["Python", "FastAPI", "React", "PostgreSQL"],
        resume_summary="Senior software engineer experienced in cloud applications.",
        resume_filename="resume_test.pdf",
        resume_text="Senior software engineer experienced in cloud applications with 4 years Python and React."
    )
    new_cand, err = CandidateController.apply_candidate(apply_payload, db)
    assert err is None, f"Application creation failed: {err}"
    assert new_cand is not None
    cand_id = new_cand.id
    cand_email = new_cand.email
    print(f"[PASS] Candidate created: ID={cand_id}, Status={new_cand.status}, FinalDecision={new_cand.final_decision}")
    assert new_cand.status == "Applied"
    assert new_cand.interview_scheduled_at is None

    # Step 2: Test Direct Unauthorized Assessment Access BEFORE Recruiter Approval
    print("\n--- STEP 2: Testing Unauthorized Candidate Assessment Access (Locked Stage) ---")
    get_res, auth_err = AssessmentController.get_candidate_assessment(cand_id, new_cand.job_id, db)
    print(f"  GET Assessment Result: {get_res}")
    print(f"  GET Assessment Error: {auth_err}")
    assert get_res is None, "SECURITY FAILURE: Unauthorized candidate was able to fetch assessment bundle!"
    assert auth_err is not None and ("restricted" in auth_err.lower() or "screening" in auth_err.lower()), f"Unexpected auth error: {auth_err}"
    print("  [PASS] Direct GET /api/assessment/{id} strictly rejected by backend authorization check.")

    # Test Direct Unauthorized Assessment Submission BEFORE Recruiter Approval
    submit_payload = schemas.AssessmentSubmitRequest(
        candidate_id=cand_id,
        job_id=new_cand.job_id,
        technical_answers={"q1": "A"},
        scenario_answers={"q2": "Scaling response"}
    )
    submit_res, submit_auth_err = AssessmentController.submit_candidate_assessment(cand_id, submit_payload, db)
    print(f"  POST Assessment Submit Result: {submit_res}")
    print(f"  POST Assessment Submit Error: {submit_auth_err}")
    assert submit_res is None, "SECURITY FAILURE: Unauthorized candidate was able to submit assessment!"
    assert submit_auth_err is not None and ("restricted" in submit_auth_err.lower() or "not authorized" in submit_auth_err.lower() or "screening" in submit_auth_err.lower()), f"Unexpected auth error: {submit_auth_err}"
    print("  [PASS] Direct POST /api/assessment/{id}/submit strictly rejected by backend authorization check.")

    # Step 3: Verify Candidate Applications API Privacy (No Score Leaks)
    print("\n--- STEP 3: Verifying Candidate Applications API (/api/candidates/my-applications) ---")
    cand_apps = CandidateController.get_candidate_applications(cand_email, db)
    assert len(cand_apps) > 0, "No applications found for candidate"
    app_item = cand_apps[0]
    print(f"  Candidate View Application Status: {app_item['status']}")
    print(f"  Candidate View Assessment Status: {app_item['assessment_status']}")
    print(f"  Candidate View match_score: {app_item['match_score']}")
    print(f"  Candidate View recruiter_score: {app_item['recruiter_score']}")
    print(f"  Candidate View coding_score: {app_item['coding_score']}")
    print(f"  Candidate View match_details: {app_item['match_details']}")

    assert app_item['match_score'] is None, "PRIVACY FAILURE: match_score leaked to candidate API!"
    assert app_item['recruiter_score'] is None, "PRIVACY FAILURE: recruiter_score leaked to candidate API!"
    assert app_item['coding_score'] is None, "PRIVACY FAILURE: coding_score leaked to candidate API!"
    assert app_item['match_details'] is None or app_item['match_details'] == {}, "PRIVACY FAILURE: match_details leaked to candidate API!"
    assert app_item['assessment_status'] == "Pending", f"Expected Pending assessment status, got {app_item['assessment_status']}"
    print("  [PASS] Candidate Applications API strictly scrubs all internal scores (match, recruiter, coding).")

    # Step 4: Verify Recruiter Can View Matching & Candidate Details
    print("\n--- STEP 4: Verifying Recruiter Screening Visibility ---")
    db.expire_all()
    recruiter_cand = db.query(models.CandidateModel).filter(models.CandidateModel.id == cand_id).first()
    print(f"  Recruiter View Match Score: {recruiter_cand.match_score}")
    print(f"  Recruiter View Status: {recruiter_cand.status}")
    assert recruiter_cand.match_score is not None, "Recruiter cannot view resume match score!"
    assert recruiter_cand.status == "Applied"
    print("  [PASS] Recruiter maintains full visibility of candidate profile and resume match score.")

    # Step 5: Recruiter Explicitly Advances Candidate / Schedules Evaluation
    print("\n--- STEP 5: Recruiter Explicitly Invites / Advances Candidate ---")
    schedule_payload = schemas.CandidateScheduleRequest(
        scheduled_at="2026-09-25 14:00 UTC",
        notes="Candidate cleared screening. Evaluation scheduled.",
        meeting_url="https://meet.google.com/spk-test-inv"
    )
    scheduled_cand, sched_err = CandidateController.schedule_interview(cand_id, schedule_payload, db)
    assert sched_err is None, f"Scheduling failed: {sched_err}"
    print(f"  Candidate status after scheduling: {scheduled_cand.interview_status}, Slot: {scheduled_cand.interview_scheduled_at}")
    assert scheduled_cand.interview_scheduled_at == "2026-09-25 14:00 UTC"

    # Step 6: Authorized Candidate Accesses & Submits Assessment
    print("\n--- STEP 6: Authorized Candidate Accesses Assessment ---")
    auth_get_res, auth_get_err = AssessmentController.get_candidate_assessment(cand_id, new_cand.job_id, db)
    assert auth_get_err is None, f"Authorized candidate got error: {auth_get_err}"
    assert auth_get_res is not None, "Authorized candidate failed to receive bundle"
    assert "bundle" in auth_get_res
    print("  [PASS] Authorized candidate successfully retrieves assessment bundle.")

    print("\n--- STEP 7: Authorized Candidate Submits Assessment ---")
    full_submission = schemas.AssessmentSubmitRequest(
        candidate_id=cand_id,
        job_id=new_cand.job_id,
        technical_answers={"q1": "A"},
        scenario_answers={"scen1": "Architected resilient distributed cache with Redis."},
        hands_on_submission={"language": "python", "code": "def solve(): return True", "test_results": [{"passed": True}]},
        troubleshooting_submission={"language": "python", "code": "def fix(): return True", "test_results": [{"passed": True}]}
    )
    submit_success_res, submit_success_err = AssessmentController.submit_candidate_assessment(cand_id, full_submission, db)
    assert submit_success_err is None, f"Submission returned error: {submit_success_err}"
    assert submit_success_res is not None
    print(f"  Submission Success: {submit_success_res.success}")
    print(f"  Scores Exposed to Candidate: {submit_success_res.scores}")
    print(f"  Message: {submit_success_res.message}")
    assert submit_success_res.scores is None, "PRIVACY FAILURE: Scores exposed in submit response!"
    assert submit_success_res.status == "Under Review"
    print("  [PASS] Candidate sees submission confirmation only; zero scores leaked.")

    # Step 8: Verify Duplicate Submission Attempt is Blocked
    print("\n--- STEP 8: Testing Duplicate Submission Attempt ---")
    dup_res, dup_err = AssessmentController.submit_candidate_assessment(cand_id, full_submission, db)
    print(f"  Duplicate submit error: {dup_err}")
    assert dup_res is None, "SECURITY FAILURE: Duplicate submission allowed!"
    assert dup_err is not None and "already" in dup_err.lower()
    print("  [PASS] Duplicate submission correctly rejected by backend.")

    # Step 9: Verify Automated Scores Stored and Status Moved to "Under Review"
    print("\n--- STEP 9: Verifying Post-Assessment Storage & Under Review Status ---")
    db.expire_all()
    under_review_cand = db.query(models.CandidateModel).filter(models.CandidateModel.id == cand_id).first()
    print(f"  Candidate DB Status: {under_review_cand.status}")
    print(f"  Candidate Automated Coding Score: {under_review_cand.coding_score}")
    print(f"  Candidate Category Scores: {under_review_cand.assessment_data.get('category_scores')}")
    assert under_review_cand.status == "Under Review"
    assert under_review_cand.coding_score is not None
    assert under_review_cand.assessment_data.get("is_completed") is True
    print("  [PASS] Automated score stored internally; application moved to Under Review.")

    # Step 10: Recruiter Evaluates Candidate & Sets Separate Recruiter Score
    print("\n--- STEP 10: Recruiter Reviews Automated Score and Updates Decision ---")
    recruiter_update = schemas.CandidateStatusUpdate(
        status="Shortlisted",
        hr_notes="Solid demonstration of distributed caching principles in scenario.",
        recruiter_score=94
    )
    update_ok = CandidateController.update_status(cand_id, recruiter_update, db)
    assert update_ok is True
    db.expire_all()
    final_cand = db.query(models.CandidateModel).filter(models.CandidateModel.id == cand_id).first()
    print(f"  Final Decision: {final_cand.final_decision}")
    print(f"  Recruiter Score: {final_cand.recruiter_score}")
    print(f"  Automated Coding Score (Preserved): {final_cand.coding_score}")
    assert final_cand.status == "Shortlisted"
    assert final_cand.recruiter_score == 94
    assert final_cand.coding_score == under_review_cand.coding_score
    print("  [PASS] Recruiter evaluation score (94) and automated assessment score are distinct and preserved.")

    # Step 11: Candidate Views Applications Post-Recruiter Decision
    print("\n--- STEP 11: Candidate Fetches Applications After Shortlisting ---")
    final_cand_apps = CandidateController.get_candidate_applications(cand_email, db)
    final_app = final_cand_apps[0]
    print(f"  Candidate Status: {final_app['status']}")
    print(f"  Assessment Status: {final_app['assessment_status']}")
    print(f"  Recruiter Score Visible to Candidate: {final_app['recruiter_score']}")
    print(f"  Coding Score Visible to Candidate: {final_app['coding_score']}")
    print(f"  Match Score Visible to Candidate: {final_app['match_score']}")
    assert final_app['status'] == "Shortlisted"
    assert final_app['assessment_status'] == "Completed"
    assert final_app['recruiter_score'] is None, "PRIVACY FAILURE: recruiter_score leaked!"
    assert final_app['coding_score'] is None, "PRIVACY FAILURE: coding_score leaked!"
    assert final_app['match_score'] is None, "PRIVACY FAILURE: match_score leaked!"
    print("  [PASS] Candidate view reflects updated stage (Shortlisted, Completed) without score leakage.")

    # Cleanup test candidate
    db.delete(final_cand)
    db.commit()
    db.close()

    print("\n================================================================================")
    print("ALL 11 END-TO-END WORKFLOW & PRIVACY VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("================================================================================")

if __name__ == "__main__":
    run_comprehensive_workflow_verification()
