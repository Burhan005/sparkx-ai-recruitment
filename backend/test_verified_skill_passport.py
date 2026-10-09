"""
Verified Skill Passport: Production Verification & Regression Test Suite.
Verifies:
  1. Candidate skill passport generation from relational tables.
  2. Verification status distinction: VERIFIED (>= 70% or recruiter verified) vs EVIDENCED vs CLAIMED (0 evidence).
  3. Deterministic evidence strength (STRONG, MODERATE, SUPPORTING) and recency calculation.
  4. Cross-assessment evidence aggregation (Coding, MCQ, Interview, Recruiter).
  5. Authorization & BOLA/IDOR security (Candidate A cannot view Candidate B, cross-tenant isolation).
  6. Recruiter manual skill verification endpoint and audit trail.
  7. End-to-end integration: Assessment execution -> Evidence linked -> Passport reflects verified status.
"""
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel,
    SkillModel, SkillAliasModel, CandidateSkillModel,
    JobSkillRequirementModel, SkillEvidenceModel,
    CodingProblemModel, MCQQuestionModel, CodingSubmissionModel
)
from services.skill_service import SkillService
from services.skill_matching_service import SkillMatchingService, VERIFICATION_PASS_THRESHOLD
from services.skill_passport_service import SkillPassportService

# Ensure DB schema is in sync
ensure_schema_columns()


def setup_passport_test_env():
    """Sets up isolated tenant organizations, jobs, candidates, and recruiter users, returning IDs."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        
        # Org Alpha
        org_a = OrganizationModel(
            id=f"org-psp-a-{suffix}",
            name=f"Passport Org Alpha {suffix}",
            slug=f"psp-alpha-{suffix}",
            is_active=True
        )
        # Org Beta
        org_b = OrganizationModel(
            id=f"org-psp-b-{suffix}",
            name=f"Passport Org Beta {suffix}",
            slug=f"psp-beta-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        # Recruiter Alpha
        recruiter_a = UserModel(
            id=f"usr-rec-a-{suffix}",
            name="Recruiter Alpha",
            email=f"recruiter_a_{suffix}@alpha.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_a.id
        )
        # Recruiter Beta
        recruiter_b = UserModel(
            id=f"usr-rec-b-{suffix}",
            name="Recruiter Beta",
            email=f"recruiter_b_{suffix}@beta.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_b.id
        )
        # Candidate User 1 (Alice)
        user_c1 = UserModel(
            id=f"usr-cand-1-{suffix}",
            name="Alice Candidate",
            email=f"alice_{suffix}@test.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_a.id
        )
        # Candidate User 2 (Bob)
        user_c2 = UserModel(
            id=f"usr-cand-2-{suffix}",
            name="Bob Candidate",
            email=f"bob_{suffix}@test.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_a.id
        )
        # Candidate User 3 (Charlie - Org Beta)
        user_c3 = UserModel(
            id=f"usr-cand-3-{suffix}",
            name="Charlie Candidate",
            email=f"charlie_{suffix}@test.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_b.id
        )
        db.add_all([recruiter_a, recruiter_b, user_c1, user_c2, user_c3])
        db.flush()

        job_a = JobModel(
            id=f"job-psp-a-{suffix}",
            title="Senior Full-Stack Engineer",
            organization_id=org_a.id,
            department="Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            required_skills=["Python", "React", "Docker"],
            description="Full-stack product development",
            status="active"
        )
        job_b = JobModel(
            id=f"job-psp-b-{suffix}",
            title="DevOps Lead",
            organization_id=org_b.id,
            department="Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            required_skills=["Docker", "Kubernetes"],
            description="Infrastructure engineering",
            status="active"
        )
        db.add_all([job_a, job_b])
        db.flush()

        cand_1 = CandidateModel(
            id=f"cand-psp-1-{suffix}",
            user_id=user_c1.id,
            name="Alice Candidate",
            email=user_c1.email,
            organization_id=org_a.id,
            job_id=job_a.id,
            education="B.S. in Computer Science",
            stage="applied"
        )
        cand_2 = CandidateModel(
            id=f"cand-psp-2-{suffix}",
            user_id=user_c2.id,
            name="Bob Candidate",
            email=user_c2.email,
            organization_id=org_a.id,
            job_id=job_a.id,
            education="B.S. in Computer Science",
            stage="applied"
        )
        cand_3 = CandidateModel(
            id=f"cand-psp-3-{suffix}",
            user_id=user_c3.id,
            name="Charlie Candidate",
            email=user_c3.email,
            organization_id=org_b.id,
            job_id=job_b.id,
            education="B.S. in Computer Science",
            stage="applied"
        )
        db.add_all([cand_1, cand_2, cand_3])
        db.commit()

        return {
            "suffix": suffix,
            "org_a_id": org_a.id,
            "org_b_id": org_b.id,
            "recruiter_a_id": recruiter_a.id,
            "recruiter_b_id": recruiter_b.id,
            "user_c1_id": user_c1.id,
            "user_c2_id": user_c2.id,
            "user_c3_id": user_c3.id,
            "cand_1_id": cand_1.id,
            "cand_2_id": cand_2.id,
            "cand_3_id": cand_3.id,
            "job_a_id": job_a.id,
            "job_b_id": job_b.id
        }
    finally:
        db.close()


def test_passport_generation_and_status_distinction():
    """Verifies passport generation with accurate distinction among VERIFIED, EVIDENCED, and CLAIMED."""
    print("\n--- Test 1: Passport Generation & Status Distinction ---")
    env = setup_passport_test_env()
    db = SessionLocal()
    try:
        cand_id = env["cand_1_id"]
        
        # Create canonical skills across categories
        sk_python, _ = SkillService.get_or_create_skill("Python", db, category="backend")
        sk_react, _ = SkillService.get_or_create_skill("React", db, category="frontend")
        sk_docker, _ = SkillService.get_or_create_skill("Docker", db, category="devops")
        
        # 1. Skill with STRONG verified evidence (Score 90 >= 70 threshold)
        cs_python = CandidateSkillModel(
            id=f"csk-py-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            skill_id=sk_python.id,
            proficiency_level="advanced",
            is_verified=True,
            verified_score=90.0,
            verification_source="coding_submission"
        )
        db.add(cs_python)
        db.flush()

        ev_python = SkillEvidenceModel(
            id=f"ev-{uuid.uuid4().hex[:8]}",
            candidate_skill_id=cs_python.id,
            evidence_type="coding_submission",
            reference_id="prob-py-01",
            score_contribution=90.0,
            snippet="def two_sum(nums, target): return hash_map",
            created_at=datetime.now(timezone.utc)
        )
        db.add(ev_python)

        # 2. Skill with preliminary evidence below pass threshold (Score 55 < 70) -> EVIDENCED
        cs_react = CandidateSkillModel(
            id=f"csk-re-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            skill_id=sk_react.id,
            proficiency_level="intermediate",
            is_verified=False,
            verified_score=55.0,
            verification_source="mcq_response"
        )
        db.add(cs_react)
        db.flush()

        ev_react = SkillEvidenceModel(
            id=f"ev-{uuid.uuid4().hex[:8]}",
            candidate_skill_id=cs_react.id,
            evidence_type="mcq_response",
            reference_id="mcq-react-01",
            score_contribution=55.0,
            snippet="Candidate selected partial answer for useEffect lifecycle",
            created_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(ev_react)

        # 3. Skill with 0 evidence -> CLAIMED
        cs_docker = CandidateSkillModel(
            id=f"csk-dk-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            skill_id=sk_docker.id,
            proficiency_level="beginner",
            is_verified=False,
            verified_score=None,
            verification_source="self_reported"
        )
        db.add(cs_docker)
        
        db.commit()

        # Generate passport via SkillPassportService
        passport = SkillPassportService.get_candidate_passport(cand_id, db)
        
        assert passport is not None, "Passport should not be None"
        assert passport["candidate_id"] == cand_id
        assert passport["total_skills"] == 3, f"Expected 3 skills, got {passport['total_skills']}"
        assert passport["verified_skills_count"] == 1, f"Expected 1 verified skill, got {passport['verified_skills_count']}"
        assert passport["evidenced_skills_count"] == 1, f"Expected 1 evidenced skill, got {passport['evidenced_skills_count']}"
        assert passport["claimed_skills_count"] == 1, f"Expected 1 claimed skill, got {passport['claimed_skills_count']}"
        
        # Verification Index = (1 verified / 3 total) * 100 = 33.3%
        assert passport["verification_index"] == 33.3, f"Expected 33.3%, got {passport['verification_index']}"
        
        # Check skill items
        skill_map = {s["skill_name"]: s for s in passport["skills"]}
        assert "Python" in skill_map
        assert "React" in skill_map
        assert "Docker" in skill_map
        
        py_item = skill_map["Python"]
        assert py_item["verification_status"] == "VERIFIED"
        assert py_item["is_verified"] is True
        assert py_item["evidence_count"] == 1
        assert py_item["evidence_strength"] == "STRONG"
        assert len(py_item["evidence"]) == 1
        assert py_item["evidence"][0]["evidence_strength"] == "STRONG"
        
        react_item = skill_map["React"]
        assert react_item["verification_status"] == "EVIDENCED"
        assert react_item["is_verified"] is False
        assert react_item["evidence_count"] == 1
        assert react_item["evidence_strength"] in ("MODERATE", "SUPPORTING")
        
        docker_item = skill_map["Docker"]
        assert docker_item["verification_status"] == "CLAIMED"
        assert docker_item["is_verified"] is False
        assert docker_item["evidence_count"] == 0
        assert docker_item["evidence_strength"] == "NONE"
        assert len(docker_item["evidence"]) == 0

        # Check Category Summary Breakdown
        cat_map = {c["category"]: c for c in passport["categories"]}
        assert len(cat_map) >= 1
        gen_cat = cat_map.get("General Competencies") or next(iter(cat_map.values()))
        assert gen_cat["total"] == 3
        assert gen_cat["verified"] == 1
        assert gen_cat["evidenced"] == 1
        assert gen_cat["claimed"] == 1
        assert gen_cat["verification_percentage"] == 33.3

        print(" [PASS] Test 1: Verified, Evidenced, and Claimed statuses computed accurately.")
    finally:
        db.close()


def test_cross_assessment_evidence_aggregation_and_recency():
    """Verifies aggregation of diverse evidence sources (Coding, MCQ, Interview) with correct recency."""
    print("\n--- Test 2: Cross-Assessment Evidence Aggregation & Recency ---")
    env = setup_passport_test_env()
    db = SessionLocal()
    try:
        cand_id = env["cand_2_id"]
        
        # Create Problems and MCQ in DB to test dynamic source title resolution
        prob = CodingProblemModel(
            id=f"prob-{uuid.uuid4().hex[:6]}",
            title="LRU Cache Implementation",
            slug=f"lru-cache-{uuid.uuid4().hex[:4]}",
            problem_statement="Implement LRU Cache with get and put methods",
            difficulty="Medium",
            allowed_languages=["python"]
        )
        mcq = MCQQuestionModel(
            id=f"mcq-{uuid.uuid4().hex[:6]}",
            question_text="Python GIL & Multiprocessing question",
            difficulty="Hard",
            category="technical",
            skills=["python"]
        )
        db.add_all([prob, mcq])
        db.flush()

        # Add single skill 'Python' with MULTIPLE cross-assessment evidence pieces
        sk_py, _ = SkillService.get_or_create_skill("Python", db, category="backend")
        cs_py = CandidateSkillModel(
            id=f"csk-py2-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            skill_id=sk_py.id,
            proficiency_level="advanced",
            is_verified=True,
            verified_score=100.0,
            verification_source="coding_submission"
        )
        db.add(cs_py)
        db.flush()
        
        now = datetime.now(timezone.utc)
        
        # Evidence 1: Coding problem completed today (Score 100) -> STRONG
        ev_code = SkillEvidenceModel(
            id=f"ev-c-{uuid.uuid4().hex[:8]}",
            candidate_skill_id=cs_py.id,
            evidence_type="coding_submission",
            reference_id=prob.id,
            score_contribution=100.0,
            snippet="class LRUCache: pass",
            created_at=now - timedelta(hours=2)
        )
        # Evidence 2: MCQ completed 5 days ago (Score 80) -> MODERATE
        ev_mcq = SkillEvidenceModel(
            id=f"ev-m-{uuid.uuid4().hex[:8]}",
            candidate_skill_id=cs_py.id,
            evidence_type="mcq_response",
            reference_id=mcq.id,
            score_contribution=80.0,
            snippet="Candidate correctly analyzed race conditions in threads vs processes",
            created_at=now - timedelta(days=5)
        )
        # Evidence 3: AI Interview completed 40 days ago (Score 75) -> MODERATE
        ev_interview = SkillEvidenceModel(
            id=f"ev-i-{uuid.uuid4().hex[:8]}",
            candidate_skill_id=cs_py.id,
            evidence_type="interview_evaluation",
            reference_id=f"room-{uuid.uuid4().hex[:6]}",
            score_contribution=75.0,
            snippet="Articulated asynchronous I/O and event loop mechanics clearly",
            created_at=now - timedelta(days=40)
        )
        db.add_all([ev_code, ev_mcq, ev_interview])
        db.commit()

        passport = SkillPassportService.get_candidate_passport(cand_id, db)
        assert len(passport["skills"]) == 1
        py_skill = passport["skills"][0]
        
        assert py_skill["verification_status"] == "VERIFIED"
        assert py_skill["evidence_count"] == 3
        # Evidence items should be sorted descending by created_at
        assert len(py_skill["evidence"]) == 3
        
        ev_items = py_skill["evidence"]
        # Most recent: Coding submission
        assert ev_items[0]["evidence_type"] == "coding_submission"
        assert "LRU Cache" in ev_items[0]["source_title"]
        assert ev_items[0]["recency_label"].lower() == "today"
        assert ev_items[0]["evidence_strength"] == "STRONG"
        
        # Second: MCQ
        assert ev_items[1]["evidence_type"] == "mcq_response"
        assert ("Technical MCQ" in ev_items[1]["source_title"] or "GIL" in ev_items[1]["source_title"])
        assert ("days ago" in ev_items[1]["recency_label"].lower() or "week" in ev_items[1]["recency_label"].lower())
        assert ev_items[1]["evidence_strength"] in ("STRONG", "MODERATE")

        # Third: Interview
        assert ev_items[2]["evidence_type"] == "interview_evaluation"
        assert ("Interview" in ev_items[2]["source_title"])
        assert ("month" in ev_items[2]["recency_label"].lower() or "days ago" in ev_items[2]["recency_label"].lower())
        assert ev_items[2]["evidence_strength"] in ("STRONG", "MODERATE")

        print(" [PASS] Test 2: Cross-assessment evidence aggregation and recency resolved.")
    finally:
        db.close()


def test_recruiter_manual_skill_verification():
    """Verifies recruiter manual verification flow, audit tracking, and tenant isolation."""
    print("\n--- Test 3: Recruiter Manual Skill Verification ---")
    env = setup_passport_test_env()
    db = SessionLocal()
    try:
        cand_id = env["cand_1_id"]
        recruiter_a = db.query(UserModel).filter_by(id=env["recruiter_a_id"]).first()
        recruiter_b = db.query(UserModel).filter_by(id=env["recruiter_b_id"]).first()
        
        # Candidate 1 claims 'System Architecture' with 0 evidence
        sk_sys, _ = SkillService.get_or_create_skill("System Architecture", db, category="architecture")
        cs_sys = CandidateSkillModel(
            id=f"csk-sys-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            skill_id=sk_sys.id,
            proficiency_level="intermediate",
            is_verified=False,
            verified_score=None
        )
        db.add(cs_sys)
        db.commit()

        # Recruiter B (Org B) attempts to manually verify Candidate 1 (Org A) -> MUST FAIL (cross-tenant)
        try:
            SkillPassportService.verify_candidate_skill_manually(
                candidate_id=cand_id,
                candidate_skill_id=cs_sys.id,
                notes="External recruiter approval attempt",
                score=95.0,
                recruiter=recruiter_b,
                db=db
            )
            assert False, "Should have raised PermissionError for cross-tenant verification"
        except PermissionError:
            db.rollback()
            print(" [PASS] Cross-tenant manual verification strictly rejected with PermissionError.")

        # Recruiter A (Org A) verifies Candidate 1 (Org A) -> MUST SUCCEED
        verified_item = SkillPassportService.verify_candidate_skill_manually(
            candidate_id=cand_id,
            candidate_skill_id=cs_sys.id,
            notes="Verified via live system design whiteboard round",
            score=92.0,
            recruiter=recruiter_a,
            db=db
        )

        assert verified_item is not None
        assert verified_item["is_verified"] is True
        assert verified_item["verified_score"] == 92.0
        
        # Check database records
        db_cs = db.query(CandidateSkillModel).filter(CandidateSkillModel.id == cs_sys.id).first()
        assert db_cs.is_verified is True
        assert db_cs.verification_source == "recruiter_verification"
        assert db_cs.verified_score == 92.0
        
        # Check evidence record
        db_ev = db.query(SkillEvidenceModel).filter(
            SkillEvidenceModel.candidate_skill_id == cs_sys.id,
            SkillEvidenceModel.evidence_type == "recruiter_verification"
        ).first()
        assert db_ev is not None
        assert db_ev.score_contribution == 92.0
        assert db_ev.reference_id == recruiter_a.id
        assert "live system design whiteboard" in db_ev.snippet

        print(" [PASS] Test 3: Recruiter manual verification and audit trail persisted.")
    finally:
        db.close()


def test_auth_and_bola_security():
    """Verifies BOLA/IDOR protection: Candidate A cannot view Candidate B's passport."""
    print("\n--- Test 4: BOLA/IDOR & Authorization Security ---")
    from views.skill_views import get_candidate_skill_passport
    from fastapi import HTTPException
    
    env = setup_passport_test_env()
    db = SessionLocal()
    try:
        cand_1_id = env["cand_1_id"]
        cand_2_id = env["cand_2_id"]
        cand_3_id = env["cand_3_id"]
        user_c1 = db.query(UserModel).filter_by(id=env["user_c1_id"]).first()
        user_c2 = db.query(UserModel).filter_by(id=env["user_c2_id"]).first()
        recruiter_a = db.query(UserModel).filter_by(id=env["recruiter_a_id"]).first()
        recruiter_b = db.query(UserModel).filter_by(id=env["recruiter_b_id"]).first()

        # Case 1: Candidate C1 accesses their own passport -> Allowed
        p1 = get_candidate_skill_passport(candidate_id=cand_1_id, current_user=user_c1, db=db)
        p1_id = p1.candidate_id if hasattr(p1, "candidate_id") else p1["candidate_id"]
        assert p1_id == cand_1_id

        # Case 2: Candidate C1 attempts to access Candidate C2's passport -> MUST RAISE 403 FORBIDDEN
        try:
            get_candidate_skill_passport(candidate_id=cand_2_id, current_user=user_c1, db=db)
            assert False, "Should have raised 403 Forbidden for cross-candidate access"
        except HTTPException as exc:
            assert exc.status_code == 403
            assert "authorized" in exc.detail.lower() or "access denied" in exc.detail.lower()

        # Case 3: Recruiter A (Org A) attempts to access Candidate 3 (Org B) -> MUST RAISE 404/403
        try:
            get_candidate_skill_passport(candidate_id=cand_3_id, current_user=recruiter_a, db=db)
            assert False, "Should have raised 404 Not Found for cross-tenant candidate lookup"
        except HTTPException as exc:
            assert exc.status_code in (403, 404)

        # Case 4: Recruiter A (Org A) accesses Candidate 1 (Org A) -> Allowed
        p_rec = get_candidate_skill_passport(candidate_id=cand_1_id, current_user=recruiter_a, db=db)
        p_rec_id = p_rec.candidate_id if hasattr(p_rec, "candidate_id") else p_rec["candidate_id"]
        assert p_rec_id == cand_1_id

        print(" [PASS] Test 4: BOLA/IDOR & Multi-tenant boundary checks strictly enforced.")
    finally:
        db.close()


def test_end_to_end_assessment_to_passport_flow():
    """End-to-end integration: Candidate submits real code -> Evidence linked -> Passport reflects verified status."""
    print("\n--- Test 5: End-to-End Assessment -> Evidence -> Passport Flow ---")
    env = setup_passport_test_env()
    db = SessionLocal()
    try:
        cand_id = env["cand_1_id"]
        
        # 1. Candidate self-reports 'Go' (initially Claimed, 0 evidence)
        sk_go, _ = SkillService.get_or_create_skill("Go", db, category="backend")
        cs_go = CandidateSkillModel(
            id=f"csk-go-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            skill_id=sk_go.id,
            proficiency_level="beginner",
            is_verified=False,
            verified_score=None
        )
        db.add(cs_go)
        db.commit()

        initial_passport = SkillPassportService.get_candidate_passport(cand_id, db)
        go_initial = next(s for s in initial_passport["skills"] if s["skill_name"] == "Go")
        assert go_initial["verification_status"] == "CLAIMED"
        assert go_initial["is_verified"] is False
        assert go_initial["evidence_count"] == 0

        # 2. Problem with skill tag 'Go'
        prob = CodingProblemModel(
            id=f"prob-go-{uuid.uuid4().hex[:6]}",
            title="Concurrent Worker Pool in Go",
            slug=f"worker-pool-{uuid.uuid4().hex[:4]}",
            problem_statement="Implement worker pool using channels and goroutines",
            difficulty="Hard",
            allowed_languages=["go"]
        )
        db.add(prob)
        db.commit()

        # 3. Create realistic submission record
        sub = CodingSubmissionModel(
            id=f"sub-{uuid.uuid4().hex[:6]}",
            candidate_id=cand_id,
            coding_problem_id=prob.id,
            language="go",
            source_code="func workerPool(tasks <-chan Task) { ... }",
            status="completed",
            score=88.0,
            passed_test_cases=5,
            total_test_cases=5
        )
        db.add(sub)
        db.commit()

        # Candidate executes and passes problem with score 88.0%
        # AssessmentController/SkillMatchingService links coding evidence
        SkillMatchingService.link_coding_evidence(
            candidate_id=cand_id,
            problem_id_or_slug=prob.id,
            language="Go",
            score=88.0,
            submission_id=sub.id,
            db=db,
            snippet="func workerPool(tasks <-chan Task) { ... }"
        )
        db.commit()

        # 4. Re-fetch passport: 'Go' must now be VERIFIED with evidence item attached!
        updated_passport = SkillPassportService.get_candidate_passport(cand_id, db)
        go_updated = next(s for s in updated_passport["skills"] if s["skill_name"] == "Go")
        
        assert go_updated["verification_status"] == "VERIFIED"
        assert go_updated["is_verified"] is True
        assert go_updated["evidence_count"] == 1
        assert go_updated["evidence_strength"] == "STRONG"
        assert "Concurrent Worker Pool" in go_updated["evidence"][0]["source_title"]
        assert go_updated["evidence"][0]["score_contribution"] == 88.0
        assert "workerPool" in go_updated["evidence"][0]["snippet"]

        print(" [PASS] Test 5: Realistic Assessment Submission -> Verified Skill Passport E2E flow verified.")
    finally:
        db.close()


def run_all():
    print("======================================================================")
    print("VERIFIED SKILL PASSPORT TEST SUITE")
    print("======================================================================")
    test_passport_generation_and_status_distinction()
    test_cross_assessment_evidence_aggregation_and_recency()
    test_recruiter_manual_skill_verification()
    test_auth_and_bola_security()
    test_end_to_end_assessment_to_passport_flow()
    print("\n======================================================================")
    print("ALL VERIFIED SKILL PASSPORT TESTS PASSED FLAWLESSLY!")
    print("======================================================================")


if __name__ == "__main__":
    run_all()
