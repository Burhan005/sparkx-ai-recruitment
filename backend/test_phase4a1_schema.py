"""
SPARKX PHASE 4A.1: ADVANCED CODING ASSESSMENT SCHEMA & DATA FOUNDATION TESTS
Verifies:
1. Assessment creation and association with jobs
2. Modular assessment sections (MCQs, Scenario, Coding, Troubleshooting)
3. Multiple coding problems per assessment (N-problem support)
4. System problem bank vs. organization-owned problems
5. Multi-tenant isolation at problem and assessment level
6. Coding problem versioning and immutable assessment snapshots
7. Public vs. hidden test case segregation and candidate serialization confidentiality
8. Candidate submission history and lifecycle status tracking
9. Granular test-case execution results with hidden outcome masking
10. Supported languages registry integrity
11. Backward compatibility with existing JSON fields and 4D workflow
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database import engine, SessionLocal, Base
from models.db_models import (
    JobModel, CandidateModel, UserModel,
    AssessmentModel, AssessmentSectionModel,
    CodingProblemModel, CodingProblemVersionModel,
    AssessmentCodingProblemModel, CodingTestCaseModel,
    CodingSubmissionModel, SubmissionTestCaseResultModel,
    SUPPORTED_LANGUAGES_REGISTRY,
    can_access_problem, can_modify_problem,
    sanitize_test_case_for_candidate,
    sanitize_test_case_result_for_candidate
)

def test_phase4a1_schema_foundation():
    db: Session = SessionLocal()
    try:
        # Create all tables cleanly
        Base.metadata.create_all(bind=engine)

        org_alpha = f"org-alpha-{uuid.uuid4().hex[:6]}"
        org_beta = f"org-beta-{uuid.uuid4().hex[:6]}"

        # -------------------------------------------------------------
        # SUITE 1: ASSESSMENT & MODULAR SECTIONS
        # -------------------------------------------------------------
        print("\n--- SUITE 1: ASSESSMENT & MODULAR SECTIONS ---")

        # 1. Create a Job
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        job = JobModel(
            id=job_id,
            title="Senior Distributed Systems Engineer",
            organization_id=org_alpha,
            department="Core Infrastructure",
            location="Remote",
            min_experience_years=5,
            education="B.S. in Computer Science or equivalent",
            description="Build high-throughput distributed event streaming systems."
        )
        db.add(job)
        db.commit()

        # 2. Create Assessment linked to Job
        assessment_id = f"asm-{uuid.uuid4().hex[:8]}"
        assessment = AssessmentModel(
            id=assessment_id,
            job_id=job.id,
            organization_id=org_alpha,
            title="Staff Systems Engineering Technical Evaluation",
            description="4-part comprehensive evaluation covering core concepts, architectural judgment, and algorithmic coding.",
            duration_minutes=60,
            passing_score=75,
            is_active=True,
            version=1
        )
        db.add(assessment)
        db.commit()

        assert assessment.id == assessment_id
        assert assessment.job_id == job.id
        assert assessment.organization_id == org_alpha
        print("[PASS] SCH-01 - Assessment created and bound to JobModel with valid organization_id")

        # 3. Create Modular Assessment Sections
        sec_mcq = AssessmentSectionModel(
            id=f"sec-{uuid.uuid4().hex[:8]}",
            assessment_id=assessment.id,
            title="Distributed Systems & Concurrency MCQs",
            section_type="technical_mcqs",
            display_order=1,
            weight_percentage=20.0,
            config={"question_count": 10, "time_limit_min": 15}
        )
        sec_scenario = AssessmentSectionModel(
            id=f"sec-{uuid.uuid4().hex[:8]}",
            assessment_id=assessment.id,
            title="Cluster Partition Architecture Scenario",
            section_type="scenario",
            display_order=2,
            weight_percentage=20.0,
            config={"scenario_type": "distributed_consensus"}
        )
        sec_coding = AssessmentSectionModel(
            id=f"sec-{uuid.uuid4().hex[:8]}",
            assessment_id=assessment.id,
            title="Algorithmic Coding Problems",
            section_type="coding",
            display_order=3,
            weight_percentage=40.0,
            config={"problem_count": 2, "time_limit_min": 35}
        )
        sec_debug = AssessmentSectionModel(
            id=f"sec-{uuid.uuid4().hex[:8]}",
            assessment_id=assessment.id,
            title="Memory Leak & Deadlock Troubleshooting",
            section_type="troubleshooting",
            display_order=4,
            weight_percentage=20.0,
            config={"bug_category": "concurrency"}
        )
        db.add_all([sec_mcq, sec_scenario, sec_coding, sec_debug])
        db.commit()

        # Refresh assessment and verify relationship
        db.refresh(assessment)
        assert len(assessment.sections) == 4
        assert [s.section_type for s in assessment.sections] == ["technical_mcqs", "scenario", "coding", "troubleshooting"]
        print("[PASS] SCH-02 - AssessmentSectionModel correctly tracks distinct section types and display ordering")

        # -------------------------------------------------------------
        # SUITE 2: CODING PROBLEMS & MULTI-PROBLEM ASSOCIATIONS (N-PROBLEMS)
        # -------------------------------------------------------------
        print("\n--- SUITE 2: CODING PROBLEMS & N-PROBLEM ASSOCIATIONS ---")

        # 1. System-owned problem (platform problem bank)
        sys_prob_id = f"prob-{uuid.uuid4().hex[:8]}"
        sys_problem = CodingProblemModel(
            id=sys_prob_id,
            organization_id=None,
            is_system=True,
            title="LRU Cache with O(1) Operations",
            slug=f"lru-cache-{uuid.uuid4().hex[:4]}",
            problem_statement="Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
            difficulty="Medium",
            constraints="1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5",
            function_name="LRUCache",
            time_limit_sec=2.0,
            memory_limit_mb=128.0,
            allowed_languages=["python", "javascript", "java", "cpp", "go"],
            starter_code={
                "python": "class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n",
                "javascript": "class LRUCache {\n  constructor(capacity) {}\n}\n"
            },
            current_version=1,
            is_active=True
        )
        db.add(sys_problem)

        # 2. Organization-owned custom problem (Org Alpha)
        org_prob_id = f"prob-{uuid.uuid4().hex[:8]}"
        org_problem = CodingProblemModel(
            id=org_prob_id,
            organization_id=org_alpha,
            is_system=False,
            title="Custom In-House Token Bucket Rate Limiter",
            slug=f"token-bucket-{uuid.uuid4().hex[:4]}",
            problem_statement="Implement the proprietary burst token rate limiter according to Org Alpha specifications.",
            difficulty="Hard",
            constraints="Timestamps are monotonically increasing millisecond integers.",
            function_name="allow_request",
            time_limit_sec=3.0,
            memory_limit_mb=64.0,
            allowed_languages=["python", "go"],
            starter_code={"python": "def allow_request(tokens, timestamp):\n    pass\n"},
            current_version=1,
            is_active=True,
            created_by="lead_architect@alpha.corp"
        )
        db.add(org_problem)
        db.commit()

        # 3. Associate BOTH problems with the single Assessment (N-problem support!)
        link1 = AssessmentCodingProblemModel(
            id=f"acp-{uuid.uuid4().hex[:8]}",
            assessment_id=assessment.id,
            coding_problem_id=sys_problem.id,
            display_order=1,
            weight=50.0,
            is_required=True
        )
        link2 = AssessmentCodingProblemModel(
            id=f"acp-{uuid.uuid4().hex[:8]}",
            assessment_id=assessment.id,
            coding_problem_id=org_problem.id,
            display_order=2,
            weight=50.0,
            is_required=True
        )
        db.add_all([link1, link2])
        db.commit()

        db.refresh(assessment)
        assert len(assessment.coding_problems) == 2
        assert assessment.coding_problems[0].coding_problem_id == sys_problem.id
        assert assessment.coding_problems[1].coding_problem_id == org_problem.id
        print("[PASS] SCH-03 - Single Assessment successfully associates N distinct coding problems (System + Custom)")

        # -------------------------------------------------------------
        # SUITE 3: TENANT ISOLATION AT PROBLEM LEVEL
        # -------------------------------------------------------------
        print("\n--- SUITE 3: TENANT ISOLATION AT PROBLEM LEVEL ---")

        # Global system problem accessible by Org Alpha and Org Beta
        assert can_access_problem(org_alpha, sys_problem) is True
        assert can_access_problem(org_beta, sys_problem) is True

        # System problem can NEVER be modified by any recruiter
        assert can_modify_problem(org_alpha, sys_problem) is False
        assert can_modify_problem(org_beta, sys_problem) is False

        # Custom Org Alpha problem accessible only by Org Alpha
        assert can_access_problem(org_alpha, org_problem) is True
        assert can_access_problem(org_beta, org_problem) is False

        # Custom Org Alpha problem modifiable only by Org Alpha
        assert can_modify_problem(org_alpha, org_problem) is True
        assert can_modify_problem(org_beta, org_problem) is False
        print("[PASS] SCH-04 - Multi-tenant isolation verified: System problems globally readable but immutable; custom problems strictly tenant-bound")

        # -------------------------------------------------------------
        # SUITE 4: CODING PROBLEM VERSIONING & IMMUTABILITY SNAPSHOTS
        # -------------------------------------------------------------
        print("\n--- SUITE 4: PROBLEM VERSIONING & IMMUTABILITY ---")

        # Create Version 1 snapshot of sys_problem
        v1_id = f"cpv-{uuid.uuid4().hex[:8]}"
        version1 = CodingProblemVersionModel(
            id=v1_id,
            problem_id=sys_problem.id,
            version_number=1,
            title=sys_problem.title,
            problem_statement=sys_problem.problem_statement,
            difficulty=sys_problem.difficulty,
            constraints=sys_problem.constraints,
            function_name=sys_problem.function_name,
            time_limit_sec=sys_problem.time_limit_sec,
            memory_limit_mb=sys_problem.memory_limit_mb,
            allowed_languages=sys_problem.allowed_languages,
            starter_code=sys_problem.starter_code,
            change_summary="Initial stable release"
        )
        db.add(version1)
        db.commit()

        # Bind link1 to version 1 snapshot
        link1.coding_problem_version_id = version1.id
        db.commit()

        # Simulate recruiter modifying the problem definition (e.g. changing title and constraints)
        sys_problem.title = "LRU Cache with Thread-Safe Concurrency"
        sys_problem.constraints = "Updated constraints: 1 <= capacity <= 50000"
        sys_problem.current_version = 2
        db.commit()

        # Verify that the assessment association still references the frozen Version 1 snapshot!
        db.refresh(link1)
        assert link1.problem_version.version_number == 1
        assert link1.problem_version.title == "LRU Cache with O(1) Operations"
        assert "3000" in link1.problem_version.constraints
        print("[PASS] SCH-05 - Problem versioning snapshot protects in-flight assessments from unexpected upstream problem mutations")

        # -------------------------------------------------------------
        # SUITE 5: TEST CASE SEGREGATION & CONFIDENTIALITY
        # -------------------------------------------------------------
        print("\n--- SUITE 5: TEST CASE SEGREGATION & CONFIDENTIALITY ---")

        # Create public sample test case
        tc_pub = CodingTestCaseModel(
            id=f"tc-{uuid.uuid4().hex[:8]}",
            problem_id=sys_problem.id,
            problem_version_id=version1.id,
            input_data='["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]',
            expected_output='[null, null, null, 1]',
            is_hidden=False,
            weight=1.0,
            display_order=1,
            explanation="Initial key 1 is retrieved after put operations."
        )

        # Create hidden grading test case (confidential!)
        tc_hidden = CodingTestCaseModel(
            id=f"tc-{uuid.uuid4().hex[:8]}",
            problem_id=sys_problem.id,
            problem_version_id=version1.id,
            input_data='["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]',
            expected_output='[null, null, 1, null, -1, 2]',
            is_hidden=True,
            weight=2.0,
            display_order=2,
            explanation=None
        )
        db.add_all([tc_pub, tc_hidden])
        db.commit()

        # Test candidate serialization: hidden test MUST NEVER reveal input_data, expected_output, or explanation!
        pub_dict = sanitize_test_case_for_candidate(tc_pub)
        assert pub_dict["is_hidden"] is False
        assert pub_dict["input_data"] is not None
        assert pub_dict["expected_output"] == '[null, null, null, 1]'

        hidden_dict = sanitize_test_case_for_candidate(tc_hidden)
        assert hidden_dict["is_hidden"] is True
        assert "input_data" not in hidden_dict
        assert "expected_output" not in hidden_dict
        assert "explanation" not in hidden_dict
        print("[PASS] SCH-06 - Hidden test case segregation verified: server keeps expected outputs confidential from candidate payloads")

        # -------------------------------------------------------------
        # SUITE 6: CANDIDATE SUBMISSION HISTORY & TEST CASE RESULTS
        # -------------------------------------------------------------
        print("\n--- SUITE 6: SUBMISSION HISTORY & GRANULAR RESULTS ---")

        # Create a candidate user and candidate application
        cand_user_id = f"usr-{uuid.uuid4().hex[:8]}"
        cand_user = UserModel(
            id=cand_user_id,
            name="Elena Rostova",
            email=f"elena_{uuid.uuid4().hex[:6]}@domain.com",
            password_hash="hashed_pw_2026",
            role="candidate"
        )
        db.add(cand_user)

        cand_id = f"cand-{uuid.uuid4().hex[:8]}"
        candidate = CandidateModel(
            id=cand_id,
            user_id=cand_user.id,
            job_id=job.id,
            organization_id=org_alpha,
            name=cand_user.name,
            email=cand_user.email,
            education="M.S. Software Engineering",
            stage="assessment",
            assessment_status="in_progress"
        )
        db.add(candidate)
        db.commit()

        # Submission Attempt 1 (Failed / Buggy code)
        sub1_id = f"sub-{uuid.uuid4().hex[:8]}"
        sub1 = CodingSubmissionModel(
            id=sub1_id,
            candidate_id=candidate.id,
            assessment_id=assessment.id,
            coding_problem_id=sys_problem.id,
            coding_problem_version_id=version1.id,
            language="python",
            source_code="class LRUCache:\n    def __init__(self, cap):\n        pass\n    def get(self, k): return -1\n",
            status="completed",
            passed_test_cases=0,
            total_test_cases=2,
            score=0.0,
            execution_time_ms=18.5,
            memory_mb=14.2,
            is_best_submission=False
        )
        db.add(sub1)
        db.commit()

        # Add granular test case results for Submission 1
        tcr1_pub = SubmissionTestCaseResultModel(
            id=f"tcr-{uuid.uuid4().hex[:8]}",
            submission_id=sub1.id,
            test_case_id=tc_pub.id,
            passed=False,
            actual_output='[null, null, null, -1]',
            execution_time_ms=4.2,
            error_message="Assertion failed: expected 1 got -1",
            is_hidden=False
        )
        tcr1_hidden = SubmissionTestCaseResultModel(
            id=f"tcr-{uuid.uuid4().hex[:8]}",
            submission_id=sub1.id,
            test_case_id=tc_hidden.id,
            passed=False,
            actual_output='[null, null, -1, null, -1, -1]',
            execution_time_ms=3.8,
            error_message="Output mismatch",
            is_hidden=True
        )
        db.add_all([tcr1_pub, tcr1_hidden])
        db.commit()

        # Submission Attempt 2 (Correct Solution)
        sub2_id = f"sub-{uuid.uuid4().hex[:8]}"
        sub2 = CodingSubmissionModel(
            id=sub2_id,
            candidate_id=candidate.id,
            assessment_id=assessment.id,
            coding_problem_id=sys_problem.id,
            coding_problem_version_id=version1.id,
            language="python",
            source_code="from collections import OrderedDict\nclass LRUCache(OrderedDict):\n    def __init__(self, cap): self.cap = cap\n",
            status="completed",
            passed_test_cases=2,
            total_test_cases=2,
            score=100.0,
            execution_time_ms=12.1,
            memory_mb=14.8,
            is_best_submission=True
        )
        db.add(sub2)
        db.commit()

        tcr2_pub = SubmissionTestCaseResultModel(
            id=f"tcr-{uuid.uuid4().hex[:8]}",
            submission_id=sub2.id,
            test_case_id=tc_pub.id,
            passed=True,
            actual_output='[null, null, null, 1]',
            execution_time_ms=3.1,
            is_hidden=False
        )
        tcr2_hidden = SubmissionTestCaseResultModel(
            id=f"tcr-{uuid.uuid4().hex[:8]}",
            submission_id=sub2.id,
            test_case_id=tc_hidden.id,
            passed=True,
            actual_output='[null, null, 1, null, -1, 2]',
            execution_time_ms=2.9,
            is_hidden=True
        )
        db.add_all([tcr2_pub, tcr2_hidden])
        db.commit()

        # Verify Submission History
        db.refresh(candidate)
        assert len(candidate.coding_submissions) == 2
        assert candidate.coding_submissions[0].score == 0.0
        assert candidate.coding_submissions[1].score == 100.0
        assert candidate.coding_submissions[1].is_best_submission is True
        print("[PASS] SCH-07 - Candidate submission history preserved across iterative problem attempts")

        # Verify Test Case Result Confidentiality for Hidden Tests
        tcr_cand_view = sanitize_test_case_result_for_candidate(tcr2_hidden)
        assert tcr_cand_view["is_hidden"] is True
        assert tcr_cand_view["passed"] is True
        assert "actual_output" not in tcr_cand_view
        assert "error_message" not in tcr_cand_view
        print("[PASS] SCH-08 - Candidate view strictly scrubs actual outputs and diffs for hidden test case execution results")

        # -------------------------------------------------------------
        # SUITE 7: LANGUAGE REGISTRY INTEGRITY
        # -------------------------------------------------------------
        print("\n--- SUITE 7: SUPPORTED LANGUAGE REGISTRY ---")

        assert "python" in SUPPORTED_LANGUAGES_REGISTRY
        assert "javascript" in SUPPORTED_LANGUAGES_REGISTRY
        assert "sql" in SUPPORTED_LANGUAGES_REGISTRY
        assert "java" in SUPPORTED_LANGUAGES_REGISTRY
        assert "cpp" in SUPPORTED_LANGUAGES_REGISTRY
        assert "go" in SUPPORTED_LANGUAGES_REGISTRY
        assert "rust" in SUPPORTED_LANGUAGES_REGISTRY

        # Confirm Judge0 ID mapping integrity
        assert SUPPORTED_LANGUAGES_REGISTRY["python"]["judge0_id"] == 71
        assert SUPPORTED_LANGUAGES_REGISTRY["java"]["judge0_id"] == 62
        assert SUPPORTED_LANGUAGES_REGISTRY["cpp"]["judge0_id"] == 54
        assert SUPPORTED_LANGUAGES_REGISTRY["go"]["judge0_id"] == 60
        assert SUPPORTED_LANGUAGES_REGISTRY["rust"]["judge0_id"] == 73
        print("[PASS] SCH-09 - Authoritative language registry contains verified Judge0 IDs and starter code templates")

        # -------------------------------------------------------------
        # SUITE 8: BACKWARD COMPATIBILITY & ZERO REGRESSION INVARIANCE
        # -------------------------------------------------------------
        print("\n--- SUITE 8: BACKWARD COMPATIBILITY INVARIANCE ---")

        # Verify CandidateModel and JobModel still have their JSON columns intact
        assert hasattr(job, "assessment_pool")
        assert hasattr(job, "coding_assessment")
        assert hasattr(candidate, "assessment_data")
        assert hasattr(candidate, "coding_results")
        assert hasattr(candidate, "coding_submission")
        assert hasattr(candidate, "coding_score")

        # Verify 4D workflow state consistency
        assert candidate.stage == "assessment"
        assert candidate.assessment_status == "in_progress"
        assert candidate.interview_status == "not_scheduled"
        assert candidate.hiring_decision == "undecided"
        print("[PASS] SCH-10 - Backward compatibility preserved: all existing JSON columns and 4D workflow states remain intact")

        print("\n==============================================================")
        print("ALL 10 PHASE 4A.1 SCHEMA & DATA FOUNDATION TESTS PASSED!")
        print("==============================================================")

    finally:
        db.close()

if __name__ == "__main__":
    test_phase4a1_schema_foundation()
