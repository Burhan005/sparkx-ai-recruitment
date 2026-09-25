"""
Automated Comprehensive Test Suite for SparkX Production Compensation & CTC Engine
Covers:
1. Decimal precision & floating point drift prevention
2. Comparison engine: inclusive boundaries, range overlap, fixed, starting_from
3. Currency mismatch handling
4. Pydantic schema validation & error states
5. Job creation & update with compensation
6. Historical application compensation integrity
7. Independent expectations across multiple job applications
8. Backend query filtering by compensation relationship
9. Ask SparkX structured compensation intelligence
"""
import sys
import os
from decimal import Decimal

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from services.compensation_service import (
    calculate_compensation_comparison,
    format_job_compensation,
    format_candidate_expectation,
    calculate_job_compensation_metrics,
    RELATIONSHIP_WITHIN_RANGE,
    RELATIONSHIP_ABOVE_RANGE,
    RELATIONSHIP_BELOW_RANGE,
    RELATIONSHIP_PARTIAL_OVERLAP,
    RELATIONSHIP_EXPECTATION_UNAVAILABLE,
    RELATIONSHIP_JOB_UNAVAILABLE,
    RELATIONSHIP_CURRENCY_MISMATCH
)
from schemas import JobCreate, JobUpdate, CandidateApply
from database import SessionLocal, Base, engine, ensure_schema_columns
from models.db_models import JobModel, CandidateModel, UserModel
from controllers.job_controller import JobController
from controllers.candidate_controller import CandidateController
from controllers.copilot_controller import CopilotController
from schemas import CopilotQueryRequest

ensure_schema_columns()

def test_decimal_precision():
    """Ensure exact arithmetic without binary floating point drift."""
    res = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min=Decimal("10.1"),
        job_ctc_max=Decimal("15.3"),
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min=Decimal("10.1"),
        cand_exp_max=Decimal("10.3"),
        cand_currency="INR"
    )
    assert res["relationship"] == RELATIONSHIP_WITHIN_RANGE
    assert res["is_within_budget"] is True
    print("  ✓ Decimal precision verified without floating point drift")

def test_inclusive_boundaries():
    """Exact boundary match (Job 8-10, Candidate 10) must be within_range."""
    res = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min="8.0",
        job_ctc_max="10.0",
        job_currency="INR",
        cand_exp_type="fixed",
        cand_exp_min="10.0",
        cand_exp_max="10.0",
        cand_currency="INR"
    )
    assert res["relationship"] == RELATIONSHIP_WITHIN_RANGE
    assert res["is_within_budget"] is True
    print("  ✓ Inclusive boundary match (Job 8-10, Cand 10) verified as within_range")

def test_partial_overlap():
    """Candidate range 10-12 on Job 8-10 overlaps but extends above: must be partial_overlap."""
    res = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min="8.0",
        job_ctc_max="10.0",
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min="10.0",
        cand_exp_max="12.0",
        cand_currency="INR"
    )
    assert res["relationship"] == RELATIONSHIP_PARTIAL_OVERLAP
    assert res["is_partial_overlap"] is True
    print("  ✓ Partial overlap (Job 8-10, Cand 10-12) verified as partial_overlap")

def test_above_range():
    """Candidate range 11-12 on Job 8-10 is strictly above: must be above_range."""
    res = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min="8.0",
        job_ctc_max="10.0",
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min="11.0",
        cand_exp_max="12.0",
        cand_currency="INR"
    )
    assert res["relationship"] == RELATIONSHIP_ABOVE_RANGE
    assert res["is_above_budget"] is True
    print("  ✓ Above range (Job 8-10, Cand 11-12) verified as above_range")

def test_below_range():
    """Candidate range 5-7 on Job 8-10 is strictly below: must be below_range."""
    res = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min="8.0",
        job_ctc_max="10.0",
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min="5.0",
        cand_exp_max="7.0",
        cand_currency="INR"
    )
    assert res["relationship"] == RELATIONSHIP_BELOW_RANGE
    assert res["is_below_budget"] is True
    print("  ✓ Below range (Job 8-10, Cand 5-7) verified as below_range")

def test_starting_from():
    """Job starting from 8 LPA."""
    res1 = calculate_compensation_comparison(
        job_ctc_type="starting_from",
        job_ctc_min="8.0",
        job_ctc_max=None,
        job_currency="INR",
        cand_exp_type="fixed",
        cand_exp_min="10.0",
        cand_exp_max="10.0",
        cand_currency="INR"
    )
    assert res1["relationship"] == RELATIONSHIP_WITHIN_RANGE

    res2 = calculate_compensation_comparison(
        job_ctc_type="starting_from",
        job_ctc_min="8.0",
        job_ctc_max=None,
        job_currency="INR",
        cand_exp_type="fixed",
        cand_exp_min="6.0",
        cand_exp_max="6.0",
        cand_currency="INR"
    )
    assert res2["relationship"] == RELATIONSHIP_BELOW_RANGE
    print("  ✓ Starting from baseline logic verified")

def test_currency_mismatch():
    """Different currencies must return currency_mismatch without guessing exchange rate."""
    res = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min="10.0",
        job_ctc_max="15.0",
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min="50.0",
        cand_exp_max="60.0",
        cand_currency="USD"
    )
    assert res["relationship"] == RELATIONSHIP_CURRENCY_MISMATCH
    print("  ✓ Currency mismatch guard (INR vs USD) verified")

def test_missing_values():
    """Unprovided values return clean unavailable states."""
    res1 = calculate_compensation_comparison(
        job_ctc_type="range",
        job_ctc_min="10.0",
        job_ctc_max="15.0",
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min=None,
        cand_exp_max=None,
        cand_currency="INR"
    )
    assert res1["relationship"] == RELATIONSHIP_EXPECTATION_UNAVAILABLE

    res2 = calculate_compensation_comparison(
        job_ctc_type=None,
        job_ctc_min=None,
        job_ctc_max=None,
        job_currency="INR",
        cand_exp_type="range",
        cand_exp_min="10.0",
        cand_exp_max="12.0",
        cand_currency="INR"
    )
    assert res2["relationship"] == RELATIONSHIP_JOB_UNAVAILABLE
    print("  ✓ Missing expectation and job compensation states verified")

def test_pydantic_validation():
    """Validation guards against negative and inverted values."""
    # Negative CTC rejected
    try:
        JobCreate(
            title="Test Role",
            department="Engineering",
            education="B.Tech",
            required_skills=["Python"],
            description="Test",
            ctc_min=-5.0,
            ctc_max=10.0
        )
        assert False, "Failed to reject negative ctc_min"
    except ValueError:
        pass

    # Min > Max rejected
    try:
        JobCreate(
            title="Test Role",
            department="Engineering",
            education="B.Tech",
            required_skills=["Python"],
            description="Test",
            ctc_type="range",
            ctc_min=15.0,
            ctc_max=10.0
        )
        assert False, "Failed to reject ctc_min > ctc_max"
    except ValueError:
        pass

    # Candidate Min > Max rejected
    try:
        CandidateApply(
            job_id="job-1",
            name="Test",
            email="test@sparkx.ai",
            experience_years=3.0,
            education="B.Tech",
            skills=["Python"],
            expected_ctc_type="range",
            expected_ctc_min=20.0,
            expected_ctc_max=10.0
        )
        assert False, "Failed to reject candidate expected_ctc_min > max"
    except ValueError:
        pass

    print("  ✓ Pydantic validation rejects negative, inverted, and malformed CTC specifications")

def test_job_edit_preserves_candidate_expectation():
    """
    CRITICAL CONSTRAINT: Changing job budget from 8-10 to 10-14 must NOT overwrite
    candidate's submitted expectation of 9 LPA.
    """
    db = SessionLocal()
    try:
        # Create Job with 8-10 LPA
        job_payload = JobCreate(
            title="Integrity Test Engineer",
            department="Engineering",
            education="B.Tech",
            required_skills=["Python", "FastAPI"],
            description="Testing historical compensation preservation.",
            ctc_type="range",
            ctc_min=8.0,
            ctc_max=10.0,
            ctc_currency="INR"
        )
        job = JobController.create_new_job(job_payload, db)
        job_id = job.id

        # Candidate applies with 9 LPA expectation
        cand_payload = CandidateApply(
            job_id=job_id,
            name="Rohan Verma",
            email=f"rohan.{job_id}@test.ai",
            experience_years=4.0,
            education="B.Tech in CS",
            skills=["Python", "FastAPI"],
            current_ctc=7.5,
            expected_ctc_type="fixed",
            expected_ctc_min=9.0,
            expected_ctc_max=9.0,
            ctc_currency="INR"
        )
        cand, err = CandidateController.apply_candidate(cand_payload, db)
        assert err is None
        cand_id = cand.id

        # Verify initial state: Candidate 9 LPA is within 8-10 LPA
        retrieved_cand = CandidateController.get_candidate_by_id(cand_id, db)
        assert float(retrieved_cand.expected_ctc_min) == 9.0
        assert retrieved_cand.compensation_analysis["relationship"] == RELATIONSHIP_WITHIN_RANGE

        # Recruiter updates Job budget to 10-14 LPA
        update_payload = JobUpdate(
            ctc_min=10.0,
            ctc_max=14.0
        )
        updated_job, err = JobController.update_job(job_id, update_payload, db)
        assert err is None
        assert float(updated_job.ctc_min) == 10.0
        assert float(updated_job.ctc_max) == 14.0

        # Retrieve Candidate again: submitted expectation MUST STILL BE 9.0 LPA!
        cand_after_update = CandidateController.get_candidate_by_id(cand_id, db)
        assert float(cand_after_update.expected_ctc_min) == 9.0, "Candidate expectation was incorrectly mutated!"
        assert float(cand_after_update.expected_ctc_max) == 9.0

        # But dynamic comparison against new budget (10-14) must now be below_range!
        assert cand_after_update.compensation_analysis["relationship"] == RELATIONSHIP_BELOW_RANGE
        print("  ✓ Historical integrity verified: Job CTC change leaves candidate expectation intact and recalculates relationship")

    finally:
        try:
            db.query(CandidateModel).filter(CandidateModel.id == cand_id).delete()
            db.query(JobModel).filter(JobModel.id == job_id).delete()
            db.commit()
        except Exception:
            db.rollback()
        db.close()

def test_multiple_applications_independent_expectations():
    """A candidate applying to two different jobs retains independent expectations for each."""
    db = SessionLocal()
    try:
        j1 = JobController.create_new_job(JobCreate(
            title="Junior Role",
            department="Engineering",
            education="B.Tech",
            required_skills=["Python"],
            description="Role 1",
            ctc_min=6.0,
            ctc_max=8.0
        ), db)

        j2 = JobController.create_new_job(JobCreate(
            title="Senior Role",
            department="Engineering",
            education="B.Tech",
            required_skills=["Python", "System Design"],
            description="Role 2",
            ctc_min=16.0,
            ctc_max=22.0
        ), db)

        shared_email = f"multi.apply.{j1.id}@test.ai"

        # Apply to Job 1 expecting 7 LPA
        app1, _ = CandidateController.apply_candidate(CandidateApply(
            job_id=j1.id,
            name="Priya Patel",
            email=shared_email,
            experience_years=5.0,
            education="B.Tech",
            skills=["Python"],
            expected_ctc_type="fixed",
            expected_ctc_min=7.0,
            expected_ctc_max=7.0
        ), db)

        # Apply to Job 2 expecting 18 LPA
        app2, _ = CandidateController.apply_candidate(CandidateApply(
            job_id=j2.id,
            name="Priya Patel",
            email=shared_email,
            experience_years=5.0,
            education="B.Tech",
            skills=["Python", "System Design"],
            expected_ctc_type="range",
            expected_ctc_min=18.0,
            expected_ctc_max=20.0
        ), db)

        # Check candidate's application history
        my_apps = CandidateController.get_candidate_applications(shared_email, db)
        assert len(my_apps) == 2

        app_map = {a["job_id"]: a for a in my_apps}
        assert app_map[j1.id]["expected_ctc_min"] == 7.0
        assert app_map[j2.id]["expected_ctc_min"] == 18.0
        print("  ✓ Multi-job application independence verified: Distinct expectations preserved per application")

    finally:
        try:
            db.query(CandidateModel).filter(CandidateModel.email == shared_email).delete()
            db.query(JobModel).filter(JobModel.id.in_([j1.id, j2.id])).delete()
            db.commit()
        except Exception:
            db.rollback()
        db.close()

def test_backend_compensation_filtering():
    """Recruiter can filter candidates by compensation relationship."""
    db = SessionLocal()
    try:
        job = JobController.create_new_job(JobCreate(
            title="Filter Test Role",
            department="Engineering",
            education="B.Tech",
            required_skills=["React"],
            description="Filter testing",
            ctc_min=10.0,
            ctc_max=12.0
        ), db)

        # Candidate A: Within range (11 LPA)
        CandidateController.apply_candidate(CandidateApply(
            job_id=job.id,
            name="Candidate Within",
            email=f"within.{job.id}@test.ai",
            experience_years=3.0,
            education="B.Tech",
            skills=["React"],
            expected_ctc_min=11.0,
            expected_ctc_max=11.0,
            expected_ctc_type="fixed"
        ), db)

        # Candidate B: Above budget (15 LPA)
        CandidateController.apply_candidate(CandidateApply(
            job_id=job.id,
            name="Candidate Above",
            email=f"above.{job.id}@test.ai",
            experience_years=7.0,
            education="B.Tech",
            skills=["React"],
            expected_ctc_min=15.0,
            expected_ctc_max=15.0,
            expected_ctc_type="fixed"
        ), db)

        # Filter by within_range
        within_cands = CandidateController.get_all_candidates(
            db, job_id=job.id, compensation_status="within_range"
        )
        assert len(within_cands) == 1
        assert within_cands[0].name == "Candidate Within"

        # Filter by above_range
        above_cands = CandidateController.get_all_candidates(
            db, job_id=job.id, compensation_status="above_range"
        )
        assert len(above_cands) == 1
        assert above_cands[0].name == "Candidate Above"
        print("  ✓ Backend filtering by compensation relationship (within_range, above_range) verified")

    finally:
        try:
            db.query(CandidateModel).filter(CandidateModel.job_id == job.id).delete()
            db.query(JobModel).filter(JobModel.id == job.id).delete()
            db.commit()
        except Exception:
            db.rollback()
        db.close()

def test_copilot_compensation_query():
    """Ask SparkX understands compensation questions with real database grounding."""
    db = SessionLocal()
    try:
        req = CopilotQueryRequest(
            query="Which candidates have expected CTC within the advertised range?",
            user_role="recruiter"
        )
        res = CopilotController.process_query(req, db)
        assert "database_facts" in res
        assert "metrics" in res
        assert len(res["database_facts"]) > 0
        print("  ✓ Ask SparkX compensation copilot query verified with real database grounding")

    finally:
        db.close()

def run_all_tests():
    print("=" * 70)
    print("SPARKX PRODUCTION COMPENSATION & CTC ENGINE TEST SUITE")
    print("=" * 70)

    test_decimal_precision()
    test_inclusive_boundaries()
    test_partial_overlap()
    test_above_range()
    test_below_range()
    test_starting_from()
    test_currency_mismatch()
    test_missing_values()
    test_pydantic_validation()
    test_job_edit_preserves_candidate_expectation()
    test_multiple_applications_independent_expectations()
    test_backend_compensation_filtering()
    test_copilot_compensation_query()

    print("=" * 70)
    print("ALL 13 COMPENSATION ENGINE TESTS PASSED (100% SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    run_all_tests()
