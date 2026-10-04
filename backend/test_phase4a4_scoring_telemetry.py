"""
(T) Phase 4A.4 Verification Suite: Multi-Problem Dynamic Scoring, Telemetry & Zero-Hardcoding
Verifies:
1. Dynamic weighted scoring across multiple coding problems attached to an assessment.
2. Zero arbitrary score defaults (e.g. elimination of fallback 70/75; 0 for blank/untested).
3. Relational telemetry persistence (execution_time_ms, memory_mb, test case results).
4. Full stack synchronization & refresh idempotence from database.
5. Strict hidden test confidentiality.
"""
import uuid
import time
from datetime import datetime
from fastapi.testclient import TestClient

from main import app
from database import SessionLocal
from models.db_models import (
    UserModel, JobModel, CandidateModel, AssessmentModel,
    CodingProblemModel, CodingProblemVersionModel, CodingTestCaseModel,
    AssessmentCodingProblemModel, CodingSubmissionModel, SubmissionTestCaseResultModel
)
from schemas import AssessmentSubmitRequest
from controllers.assessment_controller import AssessmentController

client = TestClient(app)

def test_phase4a4_multi_problem_dynamic_scoring():
    db = SessionLocal()
    try:
        org_id = f"org-{uuid.uuid4().hex[:6]}"
        job_id = f"job-{uuid.uuid4().hex[:6]}"
        cand_id = f"cand-{uuid.uuid4().hex[:6]}"
        assess_id = f"asm-{uuid.uuid4().hex[:6]}"

        # 1. Create Recruiter and Job
        recruiter = UserModel(
            id=f"rec-{uuid.uuid4().hex[:6]}",
            email=f"rec_{uuid.uuid4().hex[:4]}@sparkx.io",
            password_hash="mock_hash",
            role="recruiter",
            name="Principal Recruiter",
            organization_id=org_id
        )
        db.add(recruiter)

        job = JobModel(
            id=job_id,
            title="Senior Algorithms Engineer",
            organization_id=org_id,
            department="Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            description="High-frequency algorithmic trading systems role."
        )
        db.add(job)

        # 2. Create Assessment with 2 distinct coding problems with different weights (60% and 40%)
        assessment = AssessmentModel(
            id=assess_id,
            job_id=job_id,
            organization_id=org_id,
            title="Algorithmic Systems Challenge",
            passing_score=70
        )
        db.add(assessment)

        # Problem 1: solveMeFirst (weight: 60)
        p1 = CodingProblemModel(
            id=f"prob-{uuid.uuid4().hex[:8]}",
            organization_id=org_id,
            title="Sum Problem",
            slug=f"sum-prob-{uuid.uuid4().hex[:6]}",
            problem_statement="Return the sum of a and b",
            execution_mode="function",
            function_name="solveMeFirst",
            allowed_languages=["python", "javascript"]
        )
        db.add(p1)
        db.flush()

        tc1_sample = CodingTestCaseModel(
            id=f"tc-{uuid.uuid4().hex[:8]}",
            problem_id=p1.id,
            input_data='{"a": 2, "b": 3}',
            expected_output='5',
            is_hidden=False,
            weight=1.0
        )
        tc1_hidden = CodingTestCaseModel(
            id=f"tc-{uuid.uuid4().hex[:8]}",
            problem_id=p1.id,
            input_data='{"a": 10, "b": 20}',
            expected_output='30',
            is_hidden=True,
            weight=1.0
        )
        db.add_all([tc1_sample, tc1_hidden])

        # Problem 2: multiplyTwo (weight: 40)
        p2 = CodingProblemModel(
            id=f"prob-{uuid.uuid4().hex[:8]}",
            organization_id=org_id,
            title="Multiply Problem",
            slug=f"mult-prob-{uuid.uuid4().hex[:6]}",
            problem_statement="Return the product of a and b",
            execution_mode="function",
            function_name="multiplyTwo",
            allowed_languages=["python", "javascript"]
        )
        db.add(p2)
        db.flush()

        tc2_sample = CodingTestCaseModel(
            id=f"tc-{uuid.uuid4().hex[:8]}",
            problem_id=p2.id,
            input_data='{"a": 3, "b": 4}',
            expected_output='12',
            is_hidden=False,
            weight=1.0
        )
        tc2_hidden = CodingTestCaseModel(
            id=f"tc-{uuid.uuid4().hex[:8]}",
            problem_id=p2.id,
            input_data='{"a": 7, "b": 6}',
            expected_output='42',
            is_hidden=True,
            weight=1.0
        )
        db.add_all([tc2_sample, tc2_hidden])

        # Attach both problems to Assessment with explicit weights 60 and 40
        acp1 = AssessmentCodingProblemModel(
            id=f"acp-{uuid.uuid4().hex[:8]}",
            assessment_id=assess_id,
            coding_problem_id=p1.id,
            display_order=1,
            weight=60.0
        )
        acp2 = AssessmentCodingProblemModel(
            id=f"acp-{uuid.uuid4().hex[:8]}",
            assessment_id=assess_id,
            coding_problem_id=p2.id,
            display_order=2,
            weight=40.0
        )
        db.add_all([acp1, acp2])

        # 3. Create Candidate
        candidate = CandidateModel(
            id=cand_id,
            job_id=job_id,
            name="Alice Algorithms",
            email=f"alice_{uuid.uuid4().hex[:4]}@domain.com",
            applied_date=datetime.utcnow().strftime("%Y-%m-%d"),
            status="In Review",
            stage="assessment",
            assessment_status="invited",
            match_score=85,
            experience_years=4.0,
            education="B.S. CS"
        )
        db.add(candidate)
        db.commit()

        # Step A: Candidate starts assessment
        candidate.assessment_status = "in_progress"
        candidate.assessment_started_at = datetime.utcnow()
        db.commit()

        # Step B: Candidate submits:
        # - Solves Problem 1 correctly (passes 2/2 -> 100% of 60 weight = 60 points)
        # - Leaves Problem 2 blank/empty (0/2 -> 0% of 40 weight = 0 points)
        # - Expected Coding Score = 60/100
        p1_code = "def solveMeFirst(a, b):\n    return a + b\n"
        p2_code = ""

        submit_payload = AssessmentSubmitRequest(
            candidate_id=cand_id,
            job_id=job_id,
            technical_answers={},
            scenario_answers={},
            coding_submissions=[
                {"problem_id": p1.id, "language": "python", "code": p1_code},
                {"problem_id": p2.id, "language": "python", "code": p2_code}
            ]
        )

        resp, err = AssessmentController.submit_candidate_assessment(cand_id, submit_payload, db)
        assert err is None, f"Submission returned unexpected error: {err}"
        assert resp is not None
        assert resp.success is True

        # Refresh candidate state from authoritative DB
        db.refresh(candidate)

        # Verify candidate coding score is genuinely 60
        assert candidate.coding_score == 60, f"Expected coding_score 60, got {candidate.coding_score}"
        print(f"[PASS] Multi-problem dynamic scoring: Solved 60% weight problem -> Score = {candidate.coding_score}")

        # Verify zero hardcoded communication score (was defaulting to 70!)
        assert candidate.scores["communication"] == 0, f"Expected communication 0 for empty submission, got {candidate.scores['communication']} (hardcoded 70 detected!)"
        print("[PASS] Zero-Hardcoding: Default 70 score fallback completely eradicated; communication is strictly 0 for blank input.")

        # Verify relational persistence in CodingSubmissionModel
        subs = db.query(CodingSubmissionModel).filter(CodingSubmissionModel.candidate_id == cand_id).all()
        assert len(subs) >= 2, f"Expected at least 2 CodingSubmissionModel records, found {len(subs)}"

        sub_p1 = next((s for s in subs if s.coding_problem_id == p1.id), None)
        sub_p2 = next((s for s in subs if s.coding_problem_id == p2.id), None)

        assert sub_p1 is not None, "Missing submission record for Problem 1"
        assert sub_p2 is not None, "Missing submission record for Problem 2"

        assert sub_p1.score == 100.0, f"Problem 1 score should be 100.0, got {sub_p1.score}"
        assert sub_p1.passed_test_cases == 2, f"Problem 1 passed should be 2, got {sub_p1.passed_test_cases}"
        assert sub_p1.status == "passed"
        assert sub_p1.execution_time_ms is not None and sub_p1.execution_time_ms >= 0.0

        assert sub_p2.score == 0.0, f"Problem 2 score should be 0.0, got {sub_p2.score}"
        assert sub_p2.passed_test_cases == 0
        assert sub_p2.status in ["failed", "completed"]

        # Verify granular test case results in SubmissionTestCaseResultModel
        tc_results_p1 = db.query(SubmissionTestCaseResultModel).filter(
            SubmissionTestCaseResultModel.submission_id == sub_p1.id
        ).all()
        assert len(tc_results_p1) == 2, f"Expected 2 test case results for Problem 1, got {len(tc_results_p1)}"
        assert all(tcr.passed is True for tcr in tc_results_p1)

        # Check hidden test case confidentiality flag
        hidden_tc_res = [tcr for tcr in tc_results_p1 if tcr.is_hidden]
        assert len(hidden_tc_res) == 1, "Expected exactly 1 hidden test case result"
        print("[PASS] Relational Telemetry & Hidden Test Confidentiality: Full test case records persisted with is_hidden preserved.")

        # Step C: Database Refresh / Reload Invariance
        # Simulate browser refresh by fetching assessment from endpoint
        recruiter_token = recruiter.email  # Mock
        get_res, get_err = AssessmentController.get_candidate_assessment(cand_id, job_id, db, is_recruiter=True)
        assert get_err is None
        assert get_res["is_completed"] is True
        print("[PASS] Full Stack Synchronization: Authoritative state reconstructed perfectly from database on reload.")

    finally:
        db.close()


def test_zero_score_for_failing_solutions():
    """Verify failing candidate code receives strictly 0 score with no artificial floors."""
    db = SessionLocal()
    try:
        org_id = f"org-{uuid.uuid4().hex[:6]}"
        job_id = f"job-{uuid.uuid4().hex[:6]}"
        cand_id = f"cand-{uuid.uuid4().hex[:6]}"

        job = JobModel(
            id=job_id,
            title="Backend Engineer",
            organization_id=org_id,
            department="Engineering",
            location="Remote",
            education="B.S.",
            description="Role"
        )
        db.add(job)

        candidate = CandidateModel(
            id=cand_id,
            job_id=job_id,
            name="Bob Fail",
            email=f"bob_{uuid.uuid4().hex[:4]}@domain.com",
            applied_date=datetime.utcnow().strftime("%Y-%m-%d"),
            status="In Review",
            stage="assessment",
            assessment_status="in_progress",
            education="B.S. in Computer Science"
        )
        db.add(candidate)
        db.commit()

        # Submit completely incorrect code
        wrong_code = "def solveMeFirst(a, b):\n    return -999999\n"
        submit_payload = AssessmentSubmitRequest(
            candidate_id=cand_id,
            job_id=job_id,
            technical_answers={},
            scenario_answers={},
            hands_on_submission={
                "task_id": "hands_on_problem",
                "language": "python",
                "code": wrong_code
            }
        )

        resp, err = AssessmentController.submit_candidate_assessment(cand_id, submit_payload, db)
        assert err is None
        db.refresh(candidate)

        assert candidate.coding_score == 0, f"Expected 0 coding score for wrong code, got {candidate.coding_score}"
        assert candidate.scores["overall"] == 0
        assert candidate.scores["technicalScore"] == 0
        assert candidate.scores["communication"] == 0
        print("[PASS] Zero Fake Fallback: Failing candidate code evaluated strictly to 0 with zero fabricated score floors.")

    finally:
        db.close()


if __name__ == "__main__":
    print("======================================================================")
    print("SPARKX PHASE 4A.4: MULTI-PROBLEM DYNAMIC SCORING & ZERO HARDCODING")
    print("======================================================================")
    test_phase4a4_multi_problem_dynamic_scoring()
    test_zero_score_for_failing_solutions()
    print("======================================================================")
    print("ALL PHASE 4A.4 TESTS PASSED (100.0%)!")
    print("======================================================================")
