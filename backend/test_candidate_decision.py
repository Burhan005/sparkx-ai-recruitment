"""
(C) SparkX AI Recruitment Platform
Phase 4E.9 — Evidence-Based Hiring Decision Verification Suite

Comprehensive test suite verifying:
1. Decision context retrieval grounded in Phase 4E.7 Scorecards
2. Valid 4D state transitions (UNDECIDED -> SHORTLISTED -> SELECTED / REJECTED)
3. Final decision protection & terminal immutability
4. Controlled reopening with mandatory audit justification
5. Rationale category & note persistence in audit ledgers
6. Decision history retrieval and ordering
7. Multi-tenant isolation & BOLA/IDOR protection
8. Incomplete evidence and zero-requirement edge cases
9. Zero-hardcoding integrity
10. Regression safety across Phase 4E.7 and Phase 4E.8
"""
import os
import uuid
from datetime import datetime

# Enforce strict test isolation mode: test_sparkx.db exclusively
os.environ["SPARKX_TEST_MODE"] = "1"
os.environ["TESTING"] = "1"

from fastapi.testclient import TestClient
from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    UserModel,
    CandidateModel,
    JobModel,
    OrganizationModel,
    JobSkillRequirementModel,
    CandidateSkillModel,
    SkillModel,
    SkillEvidenceModel,
    CandidateStateLogModel,
)
from services.skill_service import SkillService
from services.candidate_scorecard_service import CandidateScorecardService
from services.candidate_decision_service import CandidateDecisionService
from controllers.auth_controller import create_access_token
from main import app

ensure_schema_columns()
client = TestClient(app)


def setup_decision_fixtures():
    """Sets up isolated tenant organizations, recruiters, candidates, jobs, and evidence."""
    db = SessionLocal(expire_on_commit=False)
    try:
        suffix = uuid.uuid4().hex[:6]

        org_a = OrganizationModel(
            id=f"org-dec-a-{suffix}",
            name=f"Decision Corp A {suffix}",
            slug=f"dec-corp-a-{suffix}",
            is_active=True
        )
        org_b = OrganizationModel(
            id=f"org-dec-b-{suffix}",
            name=f"Decision Corp B {suffix}",
            slug=f"dec-corp-b-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        recruiter_a = UserModel(
            id=f"usr-dec-rec-a-{suffix}",
            name="Recruiter Alpha",
            email=f"rec-a-{suffix}@decisioncorp.com",
            password_hash="mock_hash",
            role="recruiter",
            organization_id=org_a.id,
            created_at=datetime.utcnow()
        )
        recruiter_b = UserModel(
            id=f"usr-dec-rec-b-{suffix}",
            name="Recruiter Beta",
            email=f"rec-b-{suffix}@decisioncorp.com",
            password_hash="mock_hash",
            role="recruiter",
            organization_id=org_b.id,
            created_at=datetime.utcnow()
        )
        candidate_user = UserModel(
            id=f"usr-dec-cand-{suffix}",
            name="Candidate Regular",
            email=f"cand-{suffix}@gmail.com",
            password_hash="mock_hash",
            role="candidate",
            organization_id=org_a.id,
            created_at=datetime.utcnow()
        )
        db.add_all([recruiter_a, recruiter_b, candidate_user])
        db.flush()

        job_a = JobModel(
            id=f"job-dec-a-{suffix}",
            title="Senior Distributed Systems Architect",
            organization_id=org_a.id,
            department="Infrastructure",
            location="Remote",
            min_experience_years=5.0,
            experience="5+ years",
            education="B.S. in Computer Science or equivalent",
            description="Architect resilient distributed consensus engines and stream processing clusters.",
            status="Active",
            required_skills=["Distributed Systems", "Go", "Kubernetes", "PostgreSQL"],
            created_at=datetime.utcnow()
        )
        job_b = JobModel(
            id=f"job-dec-b-{suffix}",
            title="Cross-Tenant Security Engineer",
            organization_id=org_b.id,
            department="Security",
            location="Remote",
            min_experience_years=3.0,
            experience="3+ years",
            education="B.S. Computer Science",
            description="Tenant isolation and pen-testing.",
            status="Active",
            required_skills=["AppSec"],
            created_at=datetime.utcnow()
        )
        job_empty = JobModel(
            id=f"job-dec-empty-{suffix}",
            title="General Intern (Zero Reqs)",
            organization_id=org_a.id,
            department="Operations",
            location="Remote",
            min_experience_years=0.0,
            experience="0 years",
            education="High School or equivalent",
            description="Entry level general duties.",
            status="Active",
            required_skills=[],
            created_at=datetime.utcnow()
        )
        db.add_all([job_a, job_b, job_empty])
        db.flush()

        # Candidates under Job A
        # Candidate 1: High-fit candidate with strong verified evidence
        cand_strong = CandidateModel(
            id=f"cand-dec-1-{suffix}",
            name="Siddharth Mehta",
            email=f"siddharth-{suffix}@example.com",
            organization_id=org_a.id,
            job_id=job_a.id,
            user_id=candidate_user.id,
            experience_years=6.0,
            education="M.S. Computer Science",
            stage="interview",
            assessment_status="evaluated",
            interview_status="completed",
            hiring_decision="undecided",
            coding_score=92,
            match_score=88,
            created_at=datetime.utcnow()
        )

        # Candidate 2: Moderate candidate with unverified claims
        cand_moderate = CandidateModel(
            id=f"cand-dec-2-{suffix}",
            name="Ananya Sharma",
            email=f"ananya-{suffix}@example.com",
            organization_id=org_a.id,
            job_id=job_a.id,
            experience_years=2.0,
            education="B.Tech Computer Science",
            stage="screening",
            assessment_status="not_invited",
            interview_status="not_scheduled",
            hiring_decision="undecided",
            match_score=55,
            created_at=datetime.utcnow()
        )

        # Candidate 3: Candidate under empty-req job
        cand_empty = CandidateModel(
            id=f"cand-dec-3-{suffix}",
            name="Rohan Verma",
            email=f"rohan-{suffix}@example.com",
            organization_id=org_a.id,
            job_id=job_empty.id,
            experience_years=1.0,
            education="B.A. General",
            stage="applied",
            assessment_status="not_invited",
            interview_status="not_scheduled",
            hiring_decision="undecided",
            match_score=40,
            created_at=datetime.utcnow()
        )

        # Candidate in Tenant B
        cand_b = CandidateModel(
            id=f"cand-dec-b-{suffix}",
            name="Bob Martin",
            email=f"bob-{suffix}@example.com",
            organization_id=org_b.id,
            job_id=job_b.id,
            experience_years=4.0,
            education="B.S. Cybersecurity",
            stage="screening",
            assessment_status="not_invited",
            interview_status="not_scheduled",
            hiring_decision="undecided",
            created_at=datetime.utcnow()
        )

        db.add_all([cand_strong, cand_moderate, cand_empty, cand_b])
        db.flush()

        # Canonical skills
        skill_dist, _ = SkillService.get_or_create_skill("Distributed Systems", db, category="Architecture")
        skill_go, _ = SkillService.get_or_create_skill("Go", db, category="Languages")
        skill_k8s, _ = SkillService.get_or_create_skill("Kubernetes", db, category="DevOps")
        skill_pg, _ = SkillService.get_or_create_skill("PostgreSQL", db, category="Databases")

        # Job requirements
        reqs = [
            JobSkillRequirementModel(
                id=f"req-dec-1-{suffix}",
                job_id=job_a.id,
                skill_id=skill_dist.id,
                requirement_type="must_have",
                min_years=4.0,
                min_proficiency="advanced",
                weight=2.0
            ),
            JobSkillRequirementModel(
                id=f"req-dec-2-{suffix}",
                job_id=job_a.id,
                skill_id=skill_go.id,
                requirement_type="must_have",
                min_years=3.0,
                min_proficiency="intermediate",
                weight=2.0
            ),
            JobSkillRequirementModel(
                id=f"req-dec-3-{suffix}",
                job_id=job_a.id,
                skill_id=skill_k8s.id,
                requirement_type="preferred",
                min_years=2.0,
                min_proficiency="intermediate",
                weight=1.0
            ),
            JobSkillRequirementModel(
                id=f"req-dec-4-{suffix}",
                job_id=job_a.id,
                skill_id=skill_pg.id,
                requirement_type="preferred",
                min_years=2.0,
                min_proficiency="intermediate",
                weight=1.0
            ),
        ]
        db.add_all(reqs)
        db.flush()

        # Candidate skills & direct evidence for cand_strong
        cs_dist = CandidateSkillModel(
            id=f"cs-dec-1-{suffix}",
            candidate_id=cand_strong.id,
            skill_id=skill_dist.id,
            proficiency_level="expert",
            years_experience=6.0,
            is_verified=True,
            verified_score=95.0
        )
        cs_go = CandidateSkillModel(
            id=f"cs-dec-2-{suffix}",
            candidate_id=cand_strong.id,
            skill_id=skill_go.id,
            proficiency_level="advanced",
            years_experience=4.0,
            is_verified=True,
            verified_score=92.0
        )
        db.add_all([cs_dist, cs_go])
        db.flush()

        ev_dist = SkillEvidenceModel(
            id=f"ev-dec-1-{suffix}",
            candidate_skill_id=cs_dist.id,
            evidence_type="interview",
            score_contribution=95.0,
            snippet="Technical Architecture Panel: Scored 95% in distributed systems"
        )
        ev_go = SkillEvidenceModel(
            id=f"ev-dec-2-{suffix}",
            candidate_skill_id=cs_go.id,
            evidence_type="coding_submission",
            score_contribution=92.0,
            snippet="Go Concurrency Benchmark: Passed all test cases (92/100)"
        )
        db.add_all([ev_dist, ev_go])

        # Candidate skills for cand_moderate (only self-reported claims)
        cs_mod = CandidateSkillModel(
            id=f"cs-dec-mod-{suffix}",
            candidate_id=cand_moderate.id,
            skill_id=skill_go.id,
            proficiency_level="intermediate",
            years_experience=1.5,
            is_verified=False
        )
        db.add(cs_mod)

        db.commit()

        token_rec_a = create_access_token(recruiter_a.id, recruiter_a.email, "recruiter", org_a.id)
        token_rec_b = create_access_token(recruiter_b.id, recruiter_b.email, "recruiter", org_b.id)
        token_cand = create_access_token(candidate_user.id, candidate_user.email, "candidate", org_a.id)

        return {
            "org_a": org_a,
            "org_b": org_b,
            "recruiter_a": recruiter_a,
            "recruiter_b": recruiter_b,
            "candidate_user": candidate_user,
            "job_a": job_a,
            "job_b": job_b,
            "job_empty": job_empty,
            "cand_strong": cand_strong,
            "cand_moderate": cand_moderate,
            "cand_empty": cand_empty,
            "cand_b": cand_b,
            "token_rec_a": token_rec_a,
            "token_rec_b": token_rec_b,
            "token_cand": token_cand,
        }
    finally:
        db.close()


def test_01_retrieve_candidate_decision_context():
    """Verify recruiter can retrieve complete, grounded decision context."""
    f = setup_decision_fixtures()
    resp = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["candidate_id"] == f["cand_strong"].id
    assert data["job_id"] == f["job_a"].id
    assert data["current_decision"] == "undecided"
    assert data["is_final_decision"] is False
    assert "scorecard" in data
    assert data["scorecard"]["fit_score"] > 0
    assert data["scorecard"]["must_have_coverage"] == 100.0
    assert len(data["strongest_evidence"]) >= 2
    assert len(data["allowed_transitions"]) > 0
    assert "shortlisted" in data["allowed_transitions"]
    assert "selected" in data["allowed_transitions"]
    assert "rejected" in data["allowed_transitions"]
    print(" [PASS] Test 01: Complete decision context retrieved with authoritative scorecard metrics.")


def test_02_valid_undecided_to_shortlisted_transition():
    """Verify transition from UNDECIDED to SHORTLISTED."""
    f = setup_decision_fixtures()
    resp = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={
            "decision": "shortlisted",
            "recruiter_score": 85,
            "rationale_category": "strong_fit",
            "rationale_note": "Candidate demonstrates high technical competency in core Go systems.",
            "hr_notes": "Progressing to final executive review."
        },
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200, resp.text
    cand_data = resp.json()
    assert cand_data["hiring_decision"] == "shortlisted"
    # Stage should NOT be finalized to completed yet
    assert cand_data["stage"] != "completed"
    print(" [PASS] Test 02: Valid UNDECIDED -> SHORTLISTED transition executed safely.")


def test_03_valid_shortlisted_to_selected_transition():
    """Verify transition from SHORTLISTED to SELECTED concludes application to completed."""
    f = setup_decision_fixtures()
    # First move to shortlisted
    client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "shortlisted"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )

    # Then move to selected
    resp = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={
            "decision": "selected",
            "recruiter_score": 95,
            "rationale_category": "full_must_have",
            "rationale_note": "Unanimous committee approval; issuing formal offer letter."
        },
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200, resp.text
    cand_data = resp.json()
    assert cand_data["hiring_decision"] == "selected"
    assert cand_data["stage"] == "completed"
    print(" [PASS] Test 03: Valid SHORTLISTED -> SELECTED transition finalized pipeline to completed.")


def test_04_valid_rejection_transition():
    """Verify rejection transition with audited category and reason."""
    f = setup_decision_fixtures()
    resp = client.patch(
        f"/api/candidates/{f['cand_moderate'].id}/decision",
        json={
            "decision": "rejected",
            "rejection_category": "skills_mismatch",
            "rejection_reason": "Insufficient verified hands-on experience in distributed systems.",
            "rationale_category": "missing_must_have"
        },
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200, resp.text
    cand_data = resp.json()
    assert cand_data["hiring_decision"] == "rejected"
    assert cand_data["stage"] == "completed"
    print(" [PASS] Test 04: Valid rejection transition recorded with compliance classification.")


def test_05_invalid_transition_rejected():
    """Verify illegal transitions are rejected by the workflow state machine."""
    f = setup_decision_fixtures()
    # Lock candidate into selected
    client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "selected"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )

    # Attempt illegal regression from SELECTED to SHORTLISTED without reopening
    resp = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "shortlisted"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 400
    assert "cannot be overwritten through standard decision controls" in resp.json()["detail"].lower()
    print(" [PASS] Test 05: Illegal transition from terminal decision blocked with HTTP 400.")


def test_06_final_decision_protection():
    """Verify terminal decisions (selected, rejected) are protected from accidental mutation."""
    f = setup_decision_fixtures()
    client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "rejected", "rejection_category": "other", "rejection_reason": "Role filled."},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )

    # Attempt to change to selected
    resp = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "selected"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 400
    assert "immutable" in resp.json()["detail"].lower()
    print(" [PASS] Test 06: Terminal immutability strictly guarded against in-place overwrites.")


def test_07_authorized_reopening_flow():
    """Verify finalized application can only be corrected through controlled, audited reopening."""
    f = setup_decision_fixtures()
    # Finalize application
    client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "selected"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )

    # Invalid reopen attempt (less than 10 characters)
    bad_reopen = client.post(
        f"/api/candidates/{f['cand_strong'].id}/reopen",
        json={"reason": "short"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert bad_reopen.status_code == 400
    assert "minimum 10 characters" in bad_reopen.json()["detail"]

    # Valid reopen attempt
    valid_reopen = client.post(
        f"/api/candidates/{f['cand_strong'].id}/reopen",
        json={"reason": "Candidate provided revised compensation requirement within headcount band."},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert valid_reopen.status_code == 200
    cand_data = valid_reopen.json()
    assert cand_data["hiring_decision"] == "undecided"
    assert cand_data["stage"] == "review"

    # Context reflects reopening history
    ctx = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    ).json()
    assert ctx["is_reopened"] is True
    assert ctx["previous_final_decision"] == "selected"
    assert "revised compensation" in ctx["reopen_reason"]
    print(" [PASS] Test 07: Authorized reopening resets final state to review with compliance audit trail.")


def test_08_decision_rationale_persistence_and_audit():
    """Verify decision rationale and notes are persisted into the immutable audit ledger."""
    f = setup_decision_fixtures()
    resp = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={
            "decision": "shortlisted",
            "recruiter_score": 88,
            "rationale_category": "strong_fit",
            "rationale_note": "Evaluated against Q3 distributed infrastructure blueprint.",
            "hr_notes": "Internal evaluation note"
        },
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200

    db = SessionLocal()
    try:
        log = (
            db.query(CandidateStateLogModel)
            .filter(
                CandidateStateLogModel.candidate_id == f["cand_strong"].id,
                CandidateStateLogModel.dimension == "hiring_decision"
            )
            .order_by(CandidateStateLogModel.created_at.desc())
            .first()
        )
        assert log is not None
        assert log.from_value == "undecided"
        assert log.to_value == "shortlisted"
        assert log.changed_by == f["recruiter_a"].email
        assert "distributed infrastructure" in log.notes
        assert log.rationale_category == "strong_fit"
    finally:
        db.close()
    print(" [PASS] Test 08: Decision rationale and structured notes persisted in CandidateStateLogModel.")


def test_09_decision_history_endpoint():
    """Verify GET /api/candidates/{candidate_id}/decision-history returns chronological events."""
    f = setup_decision_fixtures()
    # Step 1: Shortlist
    client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "shortlisted", "rationale_category": "strong_fit", "rationale_note": "Passed round 1"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    # Step 2: Select
    client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "selected", "rationale_category": "full_must_have", "rationale_note": "Passed committee"},
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )

    resp = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-history",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200
    history = resp.json()
    assert len(history) >= 2
    assert history[0]["to_decision"] == "selected"
    assert history[1]["to_decision"] == "shortlisted"
    print(" [PASS] Test 09: Decision history endpoint returns chronological, auditable records.")


def test_10_evidence_context_sourced_from_scorecard():
    """Verify decision context matches authoritative Phase 4E.7 calculations."""
    f = setup_decision_fixtures()
    ctx = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    ).json()

    # Compare directly to CandidateScorecardService
    db = SessionLocal()
    try:
        sc = CandidateScorecardService.get_scorecard(
            f["cand_strong"].id,
            f["job_a"].id,
            db,
            f["recruiter_a"]
        )
        assert ctx["scorecard"]["fit_score"] == sc["summary"]["overall_fit_score"]
        assert ctx["scorecard"]["fit_tier"] == sc["summary"]["fit_tier"]
        assert ctx["scorecard"]["must_have_coverage"] == sc["summary"]["required_skill_coverage"]
    finally:
        db.close()
    print(" [PASS] Test 10: Decision context metrics derived directly from authoritative Scorecard service.")


def test_11_cross_tenant_access_rejection():
    """Verify recruiter from Org B cannot access or decide for Candidate in Org A."""
    f = setup_decision_fixtures()
    # Attempt context retrieval across tenants
    resp = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_b']}"}
    )
    assert resp.status_code == 403
    assert "cross-tenant" in resp.json()["detail"].lower()

    # Attempt decision mutation across tenants
    resp2 = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "selected"},
        headers={"Authorization": f"Bearer {f['token_rec_b']}"}
    )
    assert resp2.status_code == 403
    assert "cross-tenant" in resp2.json()["detail"].lower()
    print(" [PASS] Test 11: Cross-tenant access blocked with HTTP 403 Forbidden.")


def test_12_candidate_bola_idor_rejection():
    """Verify candidate cannot view recruiter decision context or mutate hiring decisions."""
    f = setup_decision_fixtures()
    resp = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_cand']}"}
    )
    assert resp.status_code == 403

    resp2 = client.patch(
        f"/api/candidates/{f['cand_strong'].id}/decision",
        json={"decision": "selected"},
        headers={"Authorization": f"Bearer {f['token_cand']}"}
    )
    assert resp2.status_code == 403
    print(" [PASS] Test 12: Candidate role blocked from decision endpoints with HTTP 403.")


def test_13_unauthorized_non_recruiter_access():
    """Verify unauthenticated requests return 401."""
    f = setup_decision_fixtures()
    resp = client.get(f"/api/candidates/{f['cand_strong'].id}/decision-context")
    assert resp.status_code in [401, 403]
    print(" [PASS] Test 13: Unauthenticated access blocked.")


def test_14_candidate_job_relationship_validation():
    """Verify querying decision context with a mismatched job ID returns 400."""
    f = setup_decision_fixtures()
    resp = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context?job_id={f['job_empty'].id}",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 400
    assert "did not apply to target job opening" in resp.json()["detail"]
    print(" [PASS] Test 14: Mismatched job opening rejected with HTTP 400 Bad Request.")


def test_15_empty_decision_history():
    """Verify candidates without historical decisions return clean empty list."""
    f = setup_decision_fixtures()
    resp = client.get(
        f"/api/candidates/{f['cand_moderate'].id}/decision-history",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200
    assert resp.json() == []
    print(" [PASS] Test 15: Candidate with no previous transitions returns empty decision history.")


def test_16_candidate_with_incomplete_evidence():
    """Verify candidate with unverified claims shows unverified status without synthetic scores."""
    f = setup_decision_fixtures()
    ctx = client.get(
        f"/api/candidates/{f['cand_moderate'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    ).json()

    assert ctx["scorecard"]["verified_evidence_count"] == 0
    assert ctx["scorecard"]["must_have_coverage"] < 50.0
    # Must have material gaps flagged
    assert len(ctx["material_gaps"]) > 0
    print(" [PASS] Test 16: Incomplete evidence handled truthfully without fabricated scores.")


def test_17_job_with_zero_requirements():
    """Verify job with zero requirements handles scoring cleanly without divide-by-zero."""
    f = setup_decision_fixtures()
    ctx = client.get(
        f"/api/candidates/{f['cand_empty'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    ).json()

    assert ctx["scorecard"]["total_requirements"] == 0
    assert ctx["scorecard"]["fit_score"] == 0.0
    assert ctx["material_gaps"] == []
    print(" [PASS] Test 17: Requisition with zero requirements handled safely without divide-by-zero.")


def test_18_zero_hardcoding_verification():
    """Verify dynamic business payload integrity: no hardcoded mock candidate values."""
    f = setup_decision_fixtures()
    ctx = client.get(
        f"/api/candidates/{f['cand_strong'].id}/decision-context",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    ).json()

    assert ctx["candidate_name"] == f["cand_strong"].name
    assert ctx["job_title"] == f["job_a"].title
    assert ctx["department"] == f["job_a"].department
    print(" [PASS] Test 18: Zero hardcoding verified; all payload values derived from database records.")


def test_19_regression_phase4e7_scorecard():
    """Verify Phase 4E.7 scorecard endpoints remain 100% operational."""
    f = setup_decision_fixtures()
    resp = client.get(
        f"/api/candidates/{f['cand_strong'].id}/jobs/{f['job_a'].id}/scorecard",
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200
    sc = resp.json()
    assert sc["summary"]["overall_fit_score"] > 0
    assert len(sc["skill_evaluations"]) == 4
    print(" [PASS] Test 19: Phase 4E.7 Scorecard regression verified 100% operational.")


def test_20_regression_phase4e8_comparison():
    """Verify Phase 4E.8 comparison endpoints remain 100% operational."""
    f = setup_decision_fixtures()
    resp = client.post(
        "/api/candidates/compare",
        json={
            "job_id": f["job_a"].id,
            "candidate_ids": [f["cand_strong"].id, f["cand_moderate"].id]
        },
        headers={"Authorization": f"Bearer {f['token_rec_a']}"}
    )
    assert resp.status_code == 200
    cmp = resp.json()
    assert len(cmp["candidates"]) == 2
    assert cmp["candidates"][0]["rank"] == 1
    assert cmp["candidates"][0]["candidate_id"] == f["cand_strong"].id
    print(" [PASS] Test 20: Phase 4E.8 Candidate Comparison regression verified 100% operational.")


if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING PHASE 4E.9 EVIDENCE-BASED HIRING DECISION TEST SUITE")
    print("======================================================================")
    test_01_retrieve_candidate_decision_context()
    test_02_valid_undecided_to_shortlisted_transition()
    test_03_valid_shortlisted_to_selected_transition()
    test_04_valid_rejection_transition()
    test_05_invalid_transition_rejected()
    test_06_final_decision_protection()
    test_07_authorized_reopening_flow()
    test_08_decision_rationale_persistence_and_audit()
    test_09_decision_history_endpoint()
    test_10_evidence_context_sourced_from_scorecard()
    test_11_cross_tenant_access_rejection()
    test_12_candidate_bola_idor_rejection()
    test_13_unauthorized_non_recruiter_access()
    test_14_candidate_job_relationship_validation()
    test_15_empty_decision_history()
    test_16_candidate_with_incomplete_evidence()
    test_17_job_with_zero_requirements()
    test_18_zero_hardcoding_verification()
    test_19_regression_phase4e7_scorecard()
    test_20_regression_phase4e8_comparison()
    print("======================================================================")
    print("ALL 20 PHASE 4E.9 EVIDENCE-BASED HIRING DECISION TESTS PASSED!")
    print("======================================================================")
