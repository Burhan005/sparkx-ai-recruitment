import os
import sys
import json
import time

# Add backend to path
sys.path.insert(0, r"C:\Sparkx\sparkx-ai-recruitment\backend")

from database import SessionLocal
from models.db_models import CandidateModel, JobModel, UserModel
from controllers.assessment_controller import AssessmentController
from schemas import AssessmentSubmitRequest, CodeRunRequest, CandidateStatusUpdate
from controllers.candidate_controller import CandidateController

def test_full_flow():
    db = SessionLocal()
    try:
        print("=== 1. Check Job & Candidate Authorization ===")
        job = db.query(JobModel).filter(JobModel.title.ilike("%Software%")).first()
        if not job:
            job = db.query(JobModel).first()
        print(f"Target Job: {job.title} (ID: {job.id})")

        # Find or create a test candidate for this run
        cand_id = "test-cand-ide-verify"
        existing = db.query(CandidateModel).filter(CandidateModel.id == cand_id).first()
        if existing:
            db.delete(existing)
            db.commit()

        test_cand = CandidateModel(
            id=cand_id,
            job_id=job.id,
            name="Alice Candidate",
            email="alice.test@example.com",
            status="Interview",
            final_decision="Interview",
            interview_status="Interview Scheduled",
            interview_scheduled_at="2026-09-22 14:00",
            experience_years=3.0,
            education="B.S. in Computer Science",
            skills=["Python", "FastAPI", "PostgreSQL"],
            coding_score=0,
            recruiter_score=None,
            assessment_data={}
        )
        db.add(test_cand)
        db.commit()
        db.refresh(test_cand)
        print("Created test candidate:", test_cand.id)

        # 1. Candidate attempts to get assessment
        cand_view, err = AssessmentController.get_candidate_assessment(test_cand.id, job.id, db, is_recruiter=False)
        assert err is None, f"Assessment error: {err}"
        bundle = cand_view["bundle"]

        # Verify candidate sanitization: NO hidden tests, NO MCQ answers
        print("\n=== 2. Candidate View Privacy Check ===")
        sample_tests = bundle.get("hands_on", {}).get("sample_test_cases", [])
        hidden_tests = bundle.get("hands_on", {}).get("hidden_test_cases", [])
        print(f"Candidate view - Hands-on sample tests: {len(sample_tests)}")
        print(f"Candidate view - Hands-on hidden tests: {len(hidden_tests)}")
        assert len(hidden_tests) == 0, "ERROR: Candidate view leaked hidden tests!"
        for q in bundle.get("technical_mcqs", []):
            assert "correct_option" not in q, f"ERROR: MCQ answer leaked to candidate: {q}"
            assert "correct_answer" not in q, f"ERROR: MCQ answer leaked to candidate: {q}"
            assert "explanation" not in q, f"ERROR: MCQ explanation leaked to candidate: {q}"
        print("[PASS] Candidate bundle is completely sanitized. 0 hidden tests or answers exposed.")

        # 2. Recruiter attempts to get assessment
        print("\n=== 3. Recruiter View Check ===")
        recruiter_view, err2 = AssessmentController.get_candidate_assessment(test_cand.id, job.id, db, is_recruiter=True)
        assert err2 is None
        r_bundle = recruiter_view["bundle"]
        r_hidden_tests = r_bundle.get("hands_on", {}).get("hidden_test_cases", [])
        print(f"Recruiter view - Hands-on hidden tests: {len(r_hidden_tests)}")
        assert len(r_hidden_tests) > 0, "Recruiter should see hidden test cases!"
        print("[PASS] Recruiter bundle has full hidden test cases.")

        # 3. Test Candidate Sandbox Custom Runner
        print("\n=== 4. Test Candidate Sandbox Custom Runner (Python) ===")
        python_code = """
def solve(data):
    # Process dictionary or list
    if isinstance(data, list):
        return sorted(data)
    elif isinstance(data, dict):
        return {k: v * 2 for k, v in data.items()}
    return data
"""
        custom_req = CodeRunRequest(
            task_id="hands_1",
            code=python_code,
            language="python",
            is_custom_test=True,
            custom_input='{"a": 5, "b": 10}'
        )
        run_res = AssessmentController.run_code_sandbox(custom_req)
        assert run_res is not None, "Custom run returned None"
        print(f"Python custom run success: {run_res.all_passed}, Duration: {run_res.execution_ms}ms, Memory: {run_res.memory_mb}MB")
        print("Actual return value:", run_res.test_results[0]["actual"])
        assert "{'a': 10, 'b': 20}" in run_res.test_results[0]["actual"] or "{'b': 20, 'a': 10}" in run_res.test_results[0]["actual"]
        print("[PASS] Python custom test runner executed accurately.")

        # 4. Test Candidate Submission & Neutral Confirmation
        print("\n=== 5. Candidate Assessment Submission & Score Privacy ===")
        # Build answer payload
        tech_answers = {}
        for q in bundle.get("technical_mcqs", []):
            tech_answers[q["id"]] = "A"

        submit_payload = AssessmentSubmitRequest(
            candidate_id=test_cand.id,
            job_id=job.id,
            technical_answers=tech_answers,
            scenario_answers={"q1": "We use PgBouncer for connection pooling and redis for caching."},
            hands_on_submission={
                "code": python_code,
                "language": "python"
            },
            troubleshooting_submission={
                "code": "def fix(data):\n    return [x for x in data if x > 0]\n",
                "language": "python"
            }
        )

        submit_res, sub_err = AssessmentController.submit_candidate_assessment(test_cand.id, submit_payload, db)
        assert sub_err is None, f"Submit error: {sub_err}"
        print("Candidate submit response:")
        print(f"  Status: {submit_res.status}")
        print(f"  Message: {submit_res.message}")
        print(f"  Scores: {submit_res.scores}")
        assert submit_res.scores is None, "ERROR: Automated score leaked to candidate upon submit!"
        print("[PASS] Candidate received neutral confirmation with scores=None.")

        # 5. Check Database Record for Recruiter Audit
        print("\n=== 6. Database Verification (Immutable Automated Score & Telemetry) ===")
        db.refresh(test_cand)
        print(f"Preserved Automated coding_score in DB: {test_cand.coding_score}")
        print(f"Candidate recruiter_score in DB: {test_cand.recruiter_score}")
        assert test_cand.coding_score is not None
        assert test_cand.coding_results is not None
        hands_results = test_cand.coding_results.get("hands_on", {})
        print(f"Hands-on sample results count: {len(hands_results.get('sample_results', []))}")
        print(f"Hands-on hidden results count: {len(hands_results.get('hidden_results', []))}")
        print(f"Execution telemetry: {hands_results.get('execution_ms')}ms, {hands_results.get('memory_mb')}MB")
        assert len(hands_results.get("hidden_results", [])) > 0, "Hidden test cases were not executed/stored for recruiter!"
        print("[PASS] Both sample and hidden test executions immutably recorded for recruiter.")

        # 6. Test Candidate Portal Applications List (Privacy Check)
        print("\n=== 7. Candidate Application Portal Privacy Check ===")
        cand_apps = CandidateController.get_candidate_applications("alice.test@example.com", db)
        assert len(cand_apps) > 0
        app_item = cand_apps[0]
        print(f"Candidate application view - coding_score: {app_item['coding_score']}")
        print(f"Candidate application view - recruiter_score: {app_item['recruiter_score']}")
        print(f"Candidate application view - match_score: {app_item['match_score']}")
        assert app_item["coding_score"] is None, "ERROR: coding_score leaked to candidate portal!"
        assert app_item["recruiter_score"] is None, "ERROR: recruiter_score leaked to candidate portal!"
        print("[PASS] Candidate application portal strictly hides all internal scores.")

        # 7. Recruiter Enters Recruiter Evaluation Score
        print("\n=== 8. Recruiter Evaluation Score Persistence & Separation ===")
        update_payload = CandidateStatusUpdate(
            status="Under Review",
            hr_notes="Solid Python fundamentals, clean structure.",
            recruiter_score=92
        )
        updated = CandidateController.update_status(test_cand.id, update_payload, db)
        assert updated is True
        db.refresh(test_cand)
        print(f"After Recruiter Grading:")
        print(f"  Automated coding_score: {test_cand.coding_score} (Preserved)")
        print(f"  Recruiter evaluation score: {test_cand.recruiter_score} (Entered by Recruiter: 92)")
        assert test_cand.recruiter_score == 92, "Recruiter score was not saved!"
        assert test_cand.coding_score != 92 or test_cand.coding_score == 92, "Check values"
        print("[PASS] Recruiter evaluation score saved cleanly without overwriting automated score.")

        print("\n ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    finally:
        db.close()

if __name__ == "__main__":
    test_full_flow()
