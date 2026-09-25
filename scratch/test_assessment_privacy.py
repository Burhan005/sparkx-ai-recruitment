import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, r"C:\Sparkx\sparkx-ai-recruitment\backend")

from database import SessionLocal
import models
import schemas
from controllers.assessment_controller import AssessmentController
from controllers.candidate_controller import CandidateController

def test_assessment_privacy_and_workflow():
    db = SessionLocal()
    candidates = db.query(models.CandidateModel).all()
    assert len(candidates) > 0, "No candidates found"
    
    test_cand = candidates[0]
    cand_id = test_cand.id
    cand_email = test_cand.email
    print(f"[TEST] Using candidate: {cand_id} ({test_cand.name}, email: {cand_email})")

    # 1. Simulate Candidate Submitting Assessment
    submission_payload = schemas.AssessmentSubmitRequest(
        candidate_id=cand_id,
        job_id=test_cand.job_id,
        bundle_id="bundle-test",
        technical_answers={"tech-1": "A", "tech-2": "C"},
        scenario_answer="We scaled with Redis cluster and read replicas.",
        hands_on={"language": "python", "code": "def solve(): return True", "test_results": [{"passed": True}]},
        troubleshooting={"language": "python", "code": "def fix(): return True", "test_results": [{"passed": True}]}
    )

    submit_response, err = AssessmentController.submit_candidate_assessment(cand_id, submission_payload, db)
    assert err is None, f"Submission returned error: {err}"
    
    print("\n[CHECK 1] Candidate Assessment Submission Response:")
    print(f"  Success: {submit_response.success}")
    print(f"  Message: {submit_response.message}")
    print(f"  Scores visible to candidate: {submit_response.scores}")
    print(f"  Feedback summary: {submit_response.feedback_summary}")

    assert submit_response.success is True
    assert "Assessment submitted successfully" in submit_response.message
    assert submit_response.scores is None, "CRITICAL ERROR: scores leaked to candidate on submit!"
    assert submit_response.feedback_summary is None, "CRITICAL ERROR: feedback summary leaked to candidate!"
    print("  -> PASSED: Zero scores exposed to candidate upon submission.")

    # 2. Candidate retrieving assessment bundle after completion
    cand_get_response, err = AssessmentController.get_candidate_assessment(cand_id, test_cand.job_id, db)
    assert err is None, f"Get assessment returned error: {err}"
    print("\n[CHECK 2] Candidate calling GET /api/assessment/{id}:")
    print(f"  is_completed: {cand_get_response.get('is_completed')}")
    print(f"  category_scores: {cand_get_response.get('category_scores')}")
    assert cand_get_response.get("is_completed") is True
    assert cand_get_response.get("category_scores") == {}, "CRITICAL ERROR: category scores exposed to candidate in GET assessment!"
    print("  -> PASSED: Category scores stripped for candidate caller.")

    # 3. Candidate retrieving their applications
    cand_apps = CandidateController.get_candidate_applications(cand_email, db)
    print("\n[CHECK 3] Candidate calling GET /api/candidates/my-applications:")
    matching_app = next((a for a in cand_apps if (a.get("candidate_id") if isinstance(a, dict) else getattr(a, "candidate_id", None)) == cand_id), cand_apps[0])
    app_status = matching_app.get("status") if isinstance(matching_app, dict) else matching_app.status
    assess_status = matching_app.get("assessment_status") if isinstance(matching_app, dict) else matching_app.assessment_status
    coding_score = matching_app.get("coding_score") if isinstance(matching_app, dict) else matching_app.coding_score
    print(f"  Application status: {app_status}")
    print(f"  Assessment status: {assess_status}")
    print(f"  Coding score visible: {coding_score}")
    assert assess_status == "Completed"
    assert app_status == "Under Review", f"Status should be Under Review, got {app_status}"
    assert coding_score is None, "CRITICAL ERROR: coding_score leaked to candidate in my-applications!"
    print("  -> PASSED: Internal score stripped from candidate application view, status is Under Review.")

    # 4. Recruiter retrieves candidates list
    db.expire_all()
    updated_cand = db.query(models.CandidateModel).filter(models.CandidateModel.id == cand_id).first()
    print("\n[CHECK 4] Recruiter Backend Storage Verification:")
    print(f"  Recruiter sees coding_score: {updated_cand.coding_score}")
    print(f"  Recruiter sees assessment_data is_completed: {updated_cand.assessment_data.get('is_completed') if updated_cand.assessment_data else False}")
    print(f"  Recruiter sees category_scores: {updated_cand.assessment_data.get('category_scores') if updated_cand.assessment_data else {}}")
    assert updated_cand.coding_score is not None
    assert updated_cand.assessment_data.get("is_completed") is True
    print("  -> PASSED: Recruiter has full access to automated score and category-level results.")

    # 5. Recruiter updates candidate status & assigns Recruiter Evaluation Score
    print("\n[CHECK 5] Recruiter updates candidate status to 'Shortlisted' with Recruiter Score 92:")
    status_update_payload = schemas.CandidateStatusUpdate(
        status="Shortlisted",
        hr_notes="Strong scenario rationale and clear troubleshooting approach.",
        recruiter_score=92
    )
    status_success = CandidateController.update_status(
        cand_id,
        status_update_payload,
        db
    )
    assert status_success is True, "Update status failed"
    
    db.expire_all()
    after_recruiter_action = db.query(models.CandidateModel).filter(models.CandidateModel.id == cand_id).first()
    print(f"  Updated status: {after_recruiter_action.status}")
    print(f"  Final decision: {after_recruiter_action.final_decision}")
    print(f"  Automated coding_score preserved: {after_recruiter_action.coding_score}")
    print(f"  Recruiter evaluation score: {after_recruiter_action.recruiter_score}")

    assert after_recruiter_action.status == "Shortlisted"
    assert after_recruiter_action.recruiter_score == 92
    assert after_recruiter_action.coding_score == updated_cand.coding_score, "CRITICAL ERROR: automated coding_score was overwritten!"
    print("  -> PASSED: Recruiter evaluation score saved separately; automated score preserved intact.")

    print("\n================ ALL PRIVACY & RECRUITER WORKFLOW TESTS PASSED ================\n")
    db.close()

if __name__ == "__main__":
    test_assessment_privacy_and_workflow()
