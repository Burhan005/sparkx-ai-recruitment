"""
Phase 4B.2: Authoritative MCQ Question Bank & Recruiter Authoring Test Suite.
Verifies end-to-end database-backed MCQ authoring, tenancy isolation, assessment attachment,
candidate confidentiality, authoritative backend evaluation, score integrity, and DB persistence.
"""
import uuid
from datetime import datetime
from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    UserModel, JobModel, CandidateModel, AssessmentModel,
    MCQQuestionModel, MCQOptionModel, AssessmentMCQModel, MCQSubmissionModel,
    sanitize_mcq_for_candidate, can_access_mcq, can_modify_mcq
)
from controllers.assessment_controller import AssessmentController
from schemas import AssessmentSubmitRequest

# Ensure schema is ready
ensure_schema_columns()


def setup_test_users():
    """Create isolated recruiter users from distinct organizations for multi-tenant testing."""
    db = SessionLocal()
    try:
        org1_id = f"org-mcq-a-{uuid.uuid4().hex[:6]}"
        org2_id = f"org-mcq-b-{uuid.uuid4().hex[:6]}"

        recruiter_a = UserModel(
            id=f"rec-mcq-a-{uuid.uuid4().hex[:6]}",
            name="Recruiter Alpha",
            email=f"recruiter_a_{uuid.uuid4().hex[:6]}@alphacorp.com",
            password_hash="hash_a",
            role="recruiter",
            organization_id=org1_id
        )
        recruiter_b = UserModel(
            id=f"rec-mcq-b-{uuid.uuid4().hex[:6]}",
            name="Recruiter Beta",
            email=f"recruiter_b_{uuid.uuid4().hex[:6]}@betacorp.com",
            password_hash="hash_b",
            role="recruiter",
            organization_id=org2_id
        )
        candidate = UserModel(
            id=f"cand-mcq-{uuid.uuid4().hex[:6]}",
            name="Candidate Gamma",
            email=f"candidate_{uuid.uuid4().hex[:6]}@gmail.com",
            password_hash="hash_c",
            role="candidate",
            organization_id=org1_id
        )
        db.add_all([recruiter_a, recruiter_b, candidate])
        db.commit()
        db.refresh(recruiter_a)
        db.refresh(recruiter_b)
        db.refresh(candidate)
        return recruiter_a, recruiter_b, candidate, org1_id, org2_id
    finally:
        db.close()


def test_01_seed_system_mcqs_idempotent():
    """Test 01: Verify system MCQs are seeded and idempotent."""
    db = SessionLocal()
    try:
        AssessmentController.seed_system_mcqs(db)
        count_1 = db.query(MCQQuestionModel).filter(MCQQuestionModel.is_system == True).count()
        assert count_1 >= 16, f"Expected at least 16 system MCQs, got {count_1}"

        # Re-run seeding to verify idempotency
        AssessmentController.seed_system_mcqs(db)
        count_2 = db.query(MCQQuestionModel).filter(MCQQuestionModel.is_system == True).count()
        assert count_2 == count_1, "Seeding must be strictly idempotent"

        # Check options for a sample system question
        sample_q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == "mcq-py-gil").first()
        assert sample_q is not None, "System question mcq-py-gil must exist"
        assert len(sample_q.options) == 4, "System question must have 4 options"
        correct_opts = [opt for opt in sample_q.options if opt.is_correct]
        assert len(correct_opts) == 1, "Exactly one option must be marked correct"
        assert correct_opts[0].option_key == "B", "Correct option for GIL question must be B"
        print("[PASS] Test 01: Seed system MCQs idempotent and properly populated.")
    finally:
        db.close()


def test_02_recruiter_create_custom_mcq():
    """Test 02: Recruiter authors a custom MCQ with authoritative options."""
    recruiter_a, _, _, org1_id, _ = setup_test_users()
    db = SessionLocal()
    try:
        payload = {
            "question_text": "What is the primary benefit of Redis in a distributed caching tier?",
            "category": "technical",
            "difficulty": "Medium",
            "explanation": "Redis provides in-memory sub-millisecond key-value operations with atomic data structures.",
            "skills": ["redis", "caching", "backend"],
            "options": [
                {"option_key": "A", "option_text": "Provides cold tape backup for archived logs", "is_correct": False},
                {"option_key": "B", "option_text": "Sub-millisecond in-memory read/write performance with rich data structures", "is_correct": True},
                {"option_key": "C", "option_text": "Executes CSS animations directly on the client GPU", "is_correct": False},
                {"option_key": "D", "option_text": "Compiles TypeScript into machine bytecode ahead of time", "is_correct": False}
            ]
        }
        res, err, status = AssessmentController.create_mcq_question(db, payload, recruiter_a)
        assert status == 200, f"Expected 200, got {status}: {err}"
        assert res is not None
        assert res["organization_id"] == org1_id
        assert res["is_system"] is False
        assert res["correct_option"] == "B"
        assert len(res["options"]) == 4

        # Verify DB record
        db_q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == res["id"]).first()
        assert db_q is not None
        assert db_q.question_text == payload["question_text"]
        print(f"[PASS] Test 02: Recruiter created custom MCQ {res['id']}.")
    finally:
        db.close()


def test_03_authoring_validation_errors():
    """Test 03: Verify strict backend validation on authoring (missing text, missing options, multiple correct)."""
    recruiter_a, _, _, _, _ = setup_test_users()
    db = SessionLocal()
    try:
        # Case A: Empty question text
        res, err, status = AssessmentController.create_mcq_question(db, {"question_text": "", "options": []}, recruiter_a)
        assert status == 400
        assert "required" in err.lower()

        # Case B: Less than 2 options
        res, err, status = AssessmentController.create_mcq_question(db, {
            "question_text": "Valid prompt?",
            "options": [{"option_key": "A", "option_text": "Single option", "is_correct": True}]
        }, recruiter_a)
        assert status == 400
        assert "at least 2 options" in err.lower()

        # Case C: Zero correct options
        res, err, status = AssessmentController.create_mcq_question(db, {
            "question_text": "Valid prompt?",
            "options": [
                {"option_key": "A", "option_text": "Opt 1", "is_correct": False},
                {"option_key": "B", "option_text": "Opt 2", "is_correct": False}
            ]
        }, recruiter_a)
        assert status == 400
        assert "exactly 1 correct answer" in err.lower()

        # Case D: Multiple correct options
        res, err, status = AssessmentController.create_mcq_question(db, {
            "question_text": "Valid prompt?",
            "options": [
                {"option_key": "A", "option_text": "Opt 1", "is_correct": True},
                {"option_key": "B", "option_text": "Opt 2", "is_correct": True}
            ]
        }, recruiter_a)
        assert status == 400
        assert "exactly 1 correct answer" in err.lower()

        print("[PASS] Test 03: Authoring validation correctly rejects invalid MCQ payloads.")
    finally:
        db.close()


def test_04_recruiter_update_custom_mcq():
    """Test 04: Recruiter updates a custom MCQ and verifies version increment."""
    recruiter_a, _, _, _, _ = setup_test_users()
    db = SessionLocal()
    try:
        # Create
        create_payload = {
            "question_text": "Initial Draft Question Prompt",
            "options": [
                {"option_key": "A", "option_text": "Answer A", "is_correct": True},
                {"option_key": "B", "option_text": "Answer B", "is_correct": False}
            ]
        }
        created, _, _ = AssessmentController.create_mcq_question(db, create_payload, recruiter_a)
        q_id = created["id"]

        # Update
        update_payload = {
            "question_text": "Refined and Final Question Prompt",
            "difficulty": "Hard",
            "explanation": "Updated explanation for new answer",
            "options": [
                {"option_key": "A", "option_text": "Revised Answer A", "is_correct": False},
                {"option_key": "B", "option_text": "Revised Answer B", "is_correct": True}
            ]
        }
        updated, err, status = AssessmentController.update_mcq_question(db, q_id, update_payload, recruiter_a)
        assert status == 200, f"Expected 200, got {status}: {err}"
        assert updated["question_text"] == "Refined and Final Question Prompt"
        assert updated["difficulty"] == "Hard"
        assert updated["correct_option"] == "B"
        assert updated["current_version"] == 2

        print(f"[PASS] Test 04: MCQ updated to version {updated['current_version']}.")
    finally:
        db.close()


def test_05_archive_delete_custom_mcq():
    """Test 05: Soft delete / archive custom MCQ."""
    recruiter_a, _, _, _, _ = setup_test_users()
    db = SessionLocal()
    try:
        payload = {
            "question_text": "Temporary MCQ to be archived",
            "options": [
                {"option_key": "A", "option_text": "A", "is_correct": True},
                {"option_key": "B", "option_text": "B", "is_correct": False}
            ]
        }
        created, _, _ = AssessmentController.create_mcq_question(db, payload, recruiter_a)
        q_id = created["id"]

        ok, msg, status = AssessmentController.delete_mcq_question(db, q_id, recruiter_a)
        assert status == 200 and ok is True

        # Verify soft-deleted
        db_q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == q_id).first()
        assert db_q is not None
        assert db_q.is_active is False

        # Verify filtered out by default list
        active_list = AssessmentController.list_mcq_questions(db, recruiter_a, is_active=True)
        assert not any(q["id"] == q_id for q in active_list)
        print(f"[PASS] Test 05: Question {q_id} archived successfully.")
    finally:
        db.close()


def test_06_tenant_isolation_mcq_bank():
    """Test 06: Cross-tenant isolation - Recruiter B cannot view, modify, or delete Recruiter A's custom MCQ."""
    recruiter_a, recruiter_b, _, _, _ = setup_test_users()
    db = SessionLocal()
    try:
        payload = {
            "question_text": "Proprietary internal architecture question for Alpha Corp",
            "options": [
                {"option_key": "A", "option_text": "Correct Option", "is_correct": True},
                {"option_key": "B", "option_text": "Wrong Option", "is_correct": False}
            ]
        }
        created, _, _ = AssessmentController.create_mcq_question(db, payload, recruiter_a)
        q_id = created["id"]

        # Recruiter B tries to get Recruiter A's question
        res, err, status = AssessmentController.get_mcq_question(db, q_id, recruiter_b)
        assert status == 403, f"Expected 403 Forbidden, got {status}"

        # Recruiter B tries to update Recruiter A's question
        res, err, status = AssessmentController.update_mcq_question(db, q_id, {"question_text": "Hacked"}, recruiter_b)
        assert status == 403, f"Expected 403 Forbidden, got {status}"

        # Recruiter B tries to delete Recruiter A's question
        ok, err, status = AssessmentController.delete_mcq_question(db, q_id, recruiter_b)
        assert status == 403, f"Expected 403 Forbidden, got {status}"

        # Recruiter B lists questions: custom question of A must NOT appear
        b_list = AssessmentController.list_mcq_questions(db, recruiter_b)
        assert not any(q["id"] == q_id for q in b_list), "Recruiter B must not see Recruiter A's custom questions"

        print("[PASS] Test 06: Strict multi-tenant isolation verified (403 on cross-tenant read/update/delete).")
    finally:
        db.close()


def test_07_system_mcq_immutability():
    """Test 07: Recruiters cannot modify or delete platform system MCQs."""
    recruiter_a, _, _, _, _ = setup_test_users()
    db = SessionLocal()
    try:
        sys_q_id = "mcq-py-gil"
        # Try update
        res, err, status = AssessmentController.update_mcq_question(db, sys_q_id, {"question_text": "Modified"}, recruiter_a)
        assert status == 403, f"Expected 403 on system MCQ edit, got {status}"

        # Try delete
        ok, err, status = AssessmentController.delete_mcq_question(db, sys_q_id, recruiter_a)
        assert status == 403, f"Expected 403 on system MCQ delete, got {status}"

        print("[PASS] Test 07: System MCQs are strictly immutable by recruiters.")
    finally:
        db.close()


def test_08_assessment_mcq_attachment():
    """Test 08: Attach database-backed MCQs to a Job/Assessment with weights and display order."""
    recruiter_a, _, _, org1_id, _ = setup_test_users()
    db = SessionLocal()
    try:
        # Create Job
        job = JobModel(
            id=f"job-mcq-{uuid.uuid4().hex[:6]}",
            title="Senior Backend Engineer",
            organization_id=org1_id,
            department="Engineering",
            education="B.S.",
            description="Role with DB MCQs"
        )
        db.add(job)
        db.commit()

        # Create Custom MCQ
        payload_mcq = {
            "question_text": "Custom DB Question 1",
            "options": [
                {"option_key": "A", "option_text": "Opt A", "is_correct": True},
                {"option_key": "B", "option_text": "Opt B", "is_correct": False}
            ]
        }
        custom_q, _, _ = AssessmentController.create_mcq_question(db, payload_mcq, recruiter_a)

        # Attach 2 MCQs: 1 System, 1 Custom
        attach_payload = {
            "mcqs": [
                {"mcq_question_id": "mcq-py-gil", "display_order": 1, "weight": 2.0, "is_required": True},
                {"mcq_question_id": custom_q["id"], "display_order": 2, "weight": 3.0, "is_required": True}
            ]
        }
        res, err, status = AssessmentController.attach_assessment_mcqs(db, job.id, attach_payload, recruiter_a)
        assert status == 200, f"Expected 200, got {status}: {err}"
        assert res["attached_count"] == 2

        # Verify retrieval of attached MCQs
        attached_list, err, status = AssessmentController.get_assessment_mcqs(db, job.id, recruiter_a)
        assert status == 200
        assert len(attached_list) == 2
        assert attached_list[0]["id"] == "mcq-py-gil"
        assert attached_list[0]["weight"] == 2.0
        assert attached_list[1]["id"] == custom_q["id"]
        assert attached_list[1]["weight"] == 3.0

        print(f"[PASS] Test 08: Successfully attached {len(attached_list)} DB MCQs to assessment.")
    finally:
        db.close()


def test_09_cross_tenant_mcq_attachment_blocked():
    """Test 09: Recruiter B cannot attach Recruiter A's custom MCQ to their assessment."""
    recruiter_a, recruiter_b, _, org1_id, org2_id = setup_test_users()
    db = SessionLocal()
    try:
        # Recruiter A creates custom MCQ
        custom_q, _, _ = AssessmentController.create_mcq_question(db, {
            "question_text": "Alpha Secret MCQ",
            "options": [{"option_key": "A", "option_text": "A", "is_correct": True}, {"option_key": "B", "option_text": "B", "is_correct": False}]
        }, recruiter_a)

        # Recruiter B creates Job
        job_b = JobModel(
            id=f"job-b-{uuid.uuid4().hex[:6]}",
            title="Beta Job",
            organization_id=org2_id,
            department="Engineering",
            education="B.S.",
            description="Beta role"
        )
        db.add(job_b)
        db.commit()

        # Recruiter B tries to attach Recruiter A's custom question
        res, err, status = AssessmentController.attach_assessment_mcqs(db, job_b.id, {
            "mcqs": [{"mcq_question_id": custom_q["id"], "display_order": 1, "weight": 1.0}]
        }, recruiter_b)

        assert status == 403, f"Expected 403 on cross-tenant attach, got {status}: {err}"
        print("[PASS] Test 09: Cross-tenant question attachment strictly rejected (403).")
    finally:
        db.close()


def test_10_candidate_bundle_confidentiality():
    """Test 10: Candidate bundle receives configured questions without correct_option or explanation."""
    recruiter_a, _, candidate_user, org1_id, _ = setup_test_users()
    db = SessionLocal()
    try:
        # Create Job and attach MCQ
        job = JobModel(
            id=f"job-cand-conf-{uuid.uuid4().hex[:6]}",
            title="Software Developer",
            organization_id=org1_id,
            department="Engineering",
            education="B.S.",
            description="Job with confidential MCQs"
        )
        cand_model = CandidateModel(
            id=f"cand-record-{uuid.uuid4().hex[:6]}",
            user_id=candidate_user.id,
            job_id=job.id,
            organization_id=org1_id,
            name="Confidential Candidate",
            email=candidate_user.email,
            education="B.S. Computer Science",
            stage="Technical Assessment",
            assessment_status="invited"
        )
        db.add_all([job, cand_model])
        db.commit()

        # Attach system question and custom question
        custom_q, _, _ = AssessmentController.create_mcq_question(db, {
            "question_text": "Secret Custom Algorithm question",
            "explanation": "Confidential internal rationale",
            "options": [{"option_key": "A", "option_text": "Ans A", "is_correct": True}, {"option_key": "B", "option_text": "Ans B", "is_correct": False}]
        }, recruiter_a)

        AssessmentController.attach_assessment_mcqs(db, job.id, {
            "mcqs": [
                {"mcq_question_id": "mcq-py-gil", "display_order": 1, "weight": 1.0},
                {"mcq_question_id": custom_q["id"], "display_order": 2, "weight": 1.0}
            ]
        }, recruiter_a)

        # Candidate fetches assessment bundle
        res, err = AssessmentController.get_candidate_assessment(cand_model.id, job.id, db, is_recruiter=False)
        assert err is None
        bundle = res["bundle"]
        mcqs = bundle.get("technical_mcqs", [])
        assert len(mcqs) >= 2

        for q in mcqs:
            assert "correct_option" not in q, f"LEAK: correct_option found in candidate bundle: {q}"
            assert "correct_answer" not in q, f"LEAK: correct_answer found in candidate bundle: {q}"
            assert "explanation" not in q, f"LEAK: explanation found in candidate bundle: {q}"
            # Verify options exist as a map
            assert isinstance(q.get("options"), dict), "Options must be a dict"
            assert "A" in q["options"] and "B" in q["options"]

        print("[PASS] Test 10: Candidate assessment bundle is strictly sanitized (0 answers leaked).")
    finally:
        db.close()


def test_11_authoritative_backend_evaluation_correct():
    """Test 11: Candidate submits correct answer -> evaluated correctly against DB with MCQSubmissionModel record."""
    recruiter_a, _, candidate_user, org1_id, _ = setup_test_users()
    db = SessionLocal()
    try:
        job = JobModel(
            id=f"job-eval-c-{uuid.uuid4().hex[:6]}",
            title="Backend Engineer",
            organization_id=org1_id,
            department="Engineering",
            education="B.S.",
            description="Eval test"
        )
        cand = CandidateModel(
            id=f"cand-eval-c-{uuid.uuid4().hex[:6]}",
            user_id=candidate_user.id,
            job_id=job.id,
            organization_id=org1_id,
            name="Evaluating Candidate",
            email=candidate_user.email,
            education="B.S. Computer Science",
            stage="Technical Assessment",
            assessment_status="invited"
        )
        db.add_all([job, cand])
        db.commit()

        # Attach system question (GIL: B is correct)
        AssessmentController.attach_assessment_mcqs(db, job.id, {
            "mcqs": [{"mcq_question_id": "mcq-py-gil", "display_order": 1, "weight": 1.0}]
        }, recruiter_a)

        # Prepare bundle
        AssessmentController.get_candidate_assessment(cand.id, job.id, db, is_recruiter=False)

        # Candidate submits correct answer "B"
        submit_payload = AssessmentSubmitRequest(
            candidate_id=cand.id,
            job_id=job.id,
            technical_answers={"mcq-py-gil": "B"},
            scenario_answers={"scenario_1": "We use profiling and metrics."},
            hands_on_submission={"language": "python", "code": "def solve(x): return x"}
        )
        res, err = AssessmentController.submit_candidate_assessment(cand.id, submit_payload, db)
        assert err is None
        assert res.success is True
        db.refresh(cand)
        assert cand.assessment_data["category_scores"]["technical"] == 100, f"Expected 100% for 1/1 correct, got {cand.assessment_data['category_scores']['technical']}"

        # Verify MCQSubmissionModel persisted in DB
        db.commit()
        db_sub = db.query(MCQSubmissionModel).filter(
            MCQSubmissionModel.candidate_id == cand.id,
            MCQSubmissionModel.mcq_question_id == "mcq-py-gil"
        ).first()
        assert db_sub is not None, "MCQSubmissionModel record must exist in DB"
        assert db_sub.selected_option_key == "B"
        assert db_sub.is_correct is True
        assert db_sub.points_earned == 1.0

        print("[PASS] Test 11: Candidate correct answer evaluated and persisted in MCQSubmissionModel.")
    finally:
        db.close()


def test_12_authoritative_backend_evaluation_zero_preserved():
    """Test 12: Candidate submits incorrect answer -> authentic 0 score strictly preserved (zero score floor)."""
    recruiter_a, _, candidate_user, org1_id, _ = setup_test_users()
    db = SessionLocal()
    try:
        job = JobModel(
            id=f"job-eval-z-{uuid.uuid4().hex[:6]}",
            title="Backend Engineer",
            organization_id=org1_id,
            department="Engineering",
            education="B.S.",
            description="Zero score test"
        )
        cand = CandidateModel(
            id=f"cand-eval-z-{uuid.uuid4().hex[:6]}",
            user_id=candidate_user.id,
            job_id=job.id,
            organization_id=org1_id,
            name="Zero Candidate",
            email=candidate_user.email,
            education="B.S. Computer Science",
            stage="Technical Assessment",
            assessment_status="invited"
        )
        db.add_all([job, cand])
        db.commit()

        # Attach system question (GIL: correct is B)
        AssessmentController.attach_assessment_mcqs(db, job.id, {
            "mcqs": [{"mcq_question_id": "mcq-py-gil", "display_order": 1, "weight": 1.0}]
        }, recruiter_a)

        AssessmentController.get_candidate_assessment(cand.id, job.id, db, is_recruiter=False)

        # Candidate submits WRONG answer "D"
        submit_payload = AssessmentSubmitRequest(
            candidate_id=cand.id,
            job_id=job.id,
            technical_answers={"mcq-py-gil": "D"},
            scenario_answers={"scenario_1": "Test answer"},
            hands_on_submission={"language": "python", "code": "def solve(x): return x"}
        )
        res, err = AssessmentController.submit_candidate_assessment(cand.id, submit_payload, db)
        assert err is None
        assert res.success is True
        db.refresh(cand)
        # Score must be EXACTLY 0, not inflated to 35, 70, or 75
        assert cand.assessment_data["category_scores"]["technical"] == 0, f"Expected 0% for 0/1 correct, got {cand.assessment_data['category_scores']['technical']}"

        # Verify MCQSubmissionModel persisted
        db.commit()
        db_sub = db.query(MCQSubmissionModel).filter(
            MCQSubmissionModel.candidate_id == cand.id,
            MCQSubmissionModel.mcq_question_id == "mcq-py-gil"
        ).first()
        assert db_sub is not None
        assert db_sub.selected_option_key == "D"
        assert db_sub.is_correct is False
        assert db_sub.points_earned == 0.0

        print("[PASS] Test 12: Zero score is genuinely preserved with zero artificial score floors.")
    finally:
        db.close()


def test_13_historical_integrity_and_session_reload():
    """Test 13: Historical evaluation survives DB session recreation and later question edits."""
    recruiter_a, _, candidate_user, org1_id, _ = setup_test_users()
    db = SessionLocal()
    try:
        # Create Job and Custom MCQ
        job = JobModel(
            id=f"job-hist-{uuid.uuid4().hex[:6]}",
            title="Cloud Architect",
            organization_id=org1_id,
            department="Cloud",
            education="B.S.",
            description="Historical integrity"
        )
        cand = CandidateModel(
            id=f"cand-hist-{uuid.uuid4().hex[:6]}",
            user_id=candidate_user.id,
            job_id=job.id,
            organization_id=org1_id,
            name="History Candidate",
            email=candidate_user.email,
            education="B.S. Computer Science",
            stage="Technical Assessment",
            assessment_status="invited"
        )
        db.add_all([job, cand])
        db.commit()

        # Create custom MCQ: "A" is correct
        q_data, _, _ = AssessmentController.create_mcq_question(db, {
            "question_text": "Original Version Question",
            "options": [
                {"option_key": "A", "option_text": "Original Correct Answer", "is_correct": True},
                {"option_key": "B", "option_text": "Original Wrong Answer", "is_correct": False}
            ]
        }, recruiter_a)
        q_id = q_data["id"]

        AssessmentController.attach_assessment_mcqs(db, job.id, {
            "mcqs": [{"mcq_question_id": q_id, "display_order": 1, "weight": 1.0}]
        }, recruiter_a)

        AssessmentController.get_candidate_assessment(cand.id, job.id, db, is_recruiter=False)

        # Candidate submits option "A" (which was correct at time of submission)
        submit_payload = AssessmentSubmitRequest(
            candidate_id=cand.id,
            job_id=job.id,
            technical_answers={q_id: "A"},
            scenario_answers={},
            hands_on_submission={"language": "python", "code": "def solve(): pass"}
        )
        res, err = AssessmentController.submit_candidate_assessment(cand.id, submit_payload, db)
        assert err is None
        db.refresh(cand)
        assert cand.assessment_data["category_scores"]["technical"] == 100
        db.commit()

        # Later, recruiter edits the question to make "B" the correct answer!
        AssessmentController.update_mcq_question(db, q_id, {
            "question_text": "Modified Question Later",
            "options": [
                {"option_key": "A", "option_text": "Now Incorrect", "is_correct": False},
                {"option_key": "B", "option_text": "Now Correct", "is_correct": True}
            ]
        }, recruiter_a)
        db.commit()
        cand_id = str(cand.id)
    finally:
        db.close()

    # Reopen completely fresh DB session
    new_db = SessionLocal()
    try:
        # Re-fetch candidate submission: must still be 100% and is_correct=True
        persisted_sub = new_db.query(MCQSubmissionModel).filter(
            MCQSubmissionModel.candidate_id == cand_id,
            MCQSubmissionModel.mcq_question_id == q_id
        ).first()
        assert persisted_sub is not None
        assert persisted_sub.selected_option_key == "A"
        assert persisted_sub.is_correct is True, "Candidate's historical submission outcome must remain intact!"

        # Candidate's completed assessment report
        cand_reload = new_db.query(CandidateModel).filter(CandidateModel.id == cand_id).first()
        assert cand_reload.assessment_data["category_scores"]["technical"] == 100
        print("[PASS] Test 13: Historical evaluation survives DB session recreation and question edits.")
    finally:
        new_db.close()


def test_14_candidate_cannot_author_mcq():
    """Test 14: Candidates cannot call recruiter MCQ authoring or deletion endpoints."""
    _, _, candidate_user, _, _ = setup_test_users()
    db = SessionLocal()
    try:
        # Candidate tries to create MCQ
        res, err, status = AssessmentController.create_mcq_question(db, {"question_text": "Candidate MCQ"}, candidate_user)
        assert status == 403, f"Expected 403, got {status}"

        # Candidate tries to delete MCQ
        ok, err, status = AssessmentController.delete_mcq_question(db, "mcq-py-gil", candidate_user)
        assert status == 403, f"Expected 403, got {status}"

        # Candidate tries to attach MCQ
        res, err, status = AssessmentController.attach_assessment_mcqs(db, "any-id", {"mcqs": []}, candidate_user)
        assert status == 403, f"Expected 403, got {status}"

        print("[PASS] Test 14: Non-recruiter access strictly denied (403).")
    finally:
        db.close()


if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING PHASE 4B.2 MCQ BANK & AUTHORING VERIFICATION SUITE")
    print("======================================================================\n")
    test_01_seed_system_mcqs_idempotent()
    test_02_recruiter_create_custom_mcq()
    test_03_authoring_validation_errors()
    test_04_recruiter_update_custom_mcq()
    test_05_archive_delete_custom_mcq()
    test_06_tenant_isolation_mcq_bank()
    test_07_system_mcq_immutability()
    test_08_assessment_mcq_attachment()
    test_09_cross_tenant_mcq_attachment_blocked()
    test_10_candidate_bundle_confidentiality()
    test_11_authoritative_backend_evaluation_correct()
    test_12_authoritative_backend_evaluation_zero_preserved()
    test_13_historical_integrity_and_session_reload()
    test_14_candidate_cannot_author_mcq()
    print("\n======================================================================")
    print("ALL 14 PHASE 4B.2 MCQ BANK TESTS PASSED FLAWLESSLY.")
    print("======================================================================")
