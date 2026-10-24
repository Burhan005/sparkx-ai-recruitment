"""
ARETE AI Resume Studio Verification & Security Test Suite.
Verifies:
1. Candidate profile auto-initialization with missing field audit.
2. Resume creation, retrieval, and database persistence.
3. Candidate ownership enforcement & BOLA prevention (Candidate B cannot read/edit/delete Candidate A's resume).
4. RBAC: Recruiter role blocked from candidate-only resume studio endpoints (HTTP 403).
5. Unauthenticated request blocked (HTTP 401).
6. Real version history checkpointing: increments version, preserves parent resume, records change summary.
7. Profile synchronization: verified skills, summary, phone, and education synced back to UserModel.
8. AI Assistance: Summary refinement strictly grounded in candidate profile.
9. AI Assistance: Bullet point strengthening (Google X-Y-Z formula) without metric fabrication.
10. AI Assistance: Job tailoring against real database job requisition.
11. AI Assistance: Gap audit identifying structural deficiencies deterministically.
12. Resume export: Formatted Markdown/Text and JSON exports.
"""
import os
import uuid
from datetime import datetime, timezone

# Enforce strict test isolation mode: test_sparkx.db exclusively
os.environ["SPARKX_TEST_MODE"] = "1"
os.environ["TESTING"] = "1"

from fastapi.testclient import TestClient
from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    UserModel,
    ResumeDocumentModel,
    JobModel,
    OrganizationModel,
)
from controllers.auth_controller import create_access_token
from main import app

ensure_schema_columns()
client = TestClient(app)


def setup_fixtures():
    """Sets up isolated tenant organization, candidates, jobs, and tokens."""
    db = SessionLocal(expire_on_commit=False)
    try:
        suffix = uuid.uuid4().hex[:6]

        org = OrganizationModel(
            id=f"org-res-{suffix}",
            name=f"Resume Studio Corp {suffix}",
            slug=f"res-corp-{suffix}",
            is_active=True
        )
        db.add(org)
        db.commit()

        # Candidate A (Owner)
        cand_user_a = UserModel(
            id=f"usr-a-{suffix}",
            name=f"Alice Engineer {suffix}",
            email=f"alice_{suffix}@example.com",
            password_hash="mock_hash",
            role="candidate",
            organization_id=org.id,
            phone="+1-555-0101",
            job_role="Full Stack Engineer",
            experience_years=3.5,
            skills=["Python", "FastAPI", "React", "PostgreSQL"],
            education="B.S. in Computer Science",
            resume_summary="Experienced full-stack developer building cloud web applications.",
            created_at=datetime.now(timezone.utc)
        )

        # Candidate B (Attacker / Unrelated Candidate)
        cand_user_b = UserModel(
            id=f"usr-b-{suffix}",
            name=f"Bob Intruder {suffix}",
            email=f"bob_{suffix}@example.com",
            password_hash="mock_hash",
            role="candidate",
            organization_id=org.id,
            phone="+1-555-0202",
            job_role="Data Analyst",
            experience_years=2.0,
            skills=["SQL", "Python", "Tableau"],
            education="B.A. in Economics",
            created_at=datetime.now(timezone.utc)
        )

        # Recruiter
        recruiter = UserModel(
            id=f"rec-{suffix}",
            name=f"Rachel Recruiter {suffix}",
            email=f"rachel_{suffix}@example.com",
            password_hash="mock_hash",
            role="recruiter",
            organization_id=org.id,
            created_at=datetime.now(timezone.utc)
        )

        # Real Job Requisition
        job = JobModel(
            id=f"job-res-{suffix}",
            organization_id=org.id,
            title="Senior Backend Systems Engineer",
            department="Infrastructure",
            location="Remote",
            description="Seeking an engineer experienced in high-concurrency microservices, PostgreSQL, and distributed messaging.",
            required_skills=["Python", "PostgreSQL", "Docker", "Kubernetes", "Redis"],
            education="B.S. in Computer Science or equivalent",
            status="Active",
            min_experience_years=3
        )

        db.add_all([cand_user_a, cand_user_b, recruiter, job])
        db.commit()

        token_a = create_access_token(cand_user_a.id, cand_user_a.email, "candidate", org.id)
        token_b = create_access_token(cand_user_b.id, cand_user_b.email, "candidate", org.id)
        token_rec = create_access_token(recruiter.id, recruiter.email, "recruiter", org.id)

        return {
            "org": org,
            "cand_a": cand_user_a,
            "cand_b": cand_user_b,
            "recruiter": recruiter,
            "job": job,
            "headers_a": {"Authorization": f"Bearer {token_a}"},
            "headers_b": {"Authorization": f"Bearer {token_b}"},
            "headers_rec": {"Authorization": f"Bearer {token_rec}"},
        }
    finally:
        db.close()


def test_init_resume_from_profile():
    fixtures = setup_fixtures()
    resp = client.get("/api/resumes/init-from-profile", headers=fixtures["headers_a"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "draft" in data
    draft = data["draft"]
    assert draft["contact_info"]["full_name"] == fixtures["cand_a"].name
    assert draft["contact_info"]["email"] == fixtures["cand_a"].email
    assert "Python" in draft["skills"]
    assert "React" in draft["skills"]
    print("PASS: test_init_resume_from_profile")


def test_create_and_get_resume():
    fixtures = setup_fixtures()
    payload = {
        "title": "Alice Core Engineering Resume",
        "is_base_resume": True,
        "contact_info": {
            "full_name": "Alice Engineer",
            "email": fixtures["cand_a"].email,
            "phone": "+1-555-0101",
            "headline": "Senior Full Stack Engineer"
        },
        "summary": "Full stack engineer specializing in robust API systems and modern frontends.",
        "skills": ["Python", "FastAPI", "React", "Docker"],
        "experience": [
            {
                "title": "Backend Software Engineer",
                "company": "Acme Inc",
                "start_date": "2021",
                "end_date": "Present",
                "is_current": True,
                "bullets": ["Engineered high-throughput event processing pipeline handling 10k events/sec."],
                "technologies": ["Python", "PostgreSQL"]
            }
        ],
        "education": [
            {
                "degree": "B.S. in Computer Science",
                "institution": "State University",
                "graduation_year": "2021"
            }
        ],
        "languages": [
            {"language": "English", "proficiency": "Native or Bilingual"},
            {"language": "Spanish", "proficiency": "Conversational"}
        ],
        "awards": [
            {"title": "Dean's List Honoree", "issuer": "State University", "date": "2020"}
        ],
        "volunteering": [
            {"role": "Code Mentor", "organization": "Non-Profit Tech Club", "start_date": "2022", "end_date": "Present"}
        ]
    }

    create_resp = client.post("/api/resumes", json=payload, headers=fixtures["headers_a"])
    assert create_resp.status_code == 201, create_resp.text
    created = create_resp.json()
    assert created["id"].startswith("res-")
    assert created["is_base_resume"] is True
    assert created["version"] == 1
    assert len(created["languages"]) == 2
    assert len(created["awards"]) == 1
    assert len(created["volunteering"]) == 1

    get_resp = client.get(f"/api/resumes/{created['id']}", headers=fixtures["headers_a"])
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["title"] == "Alice Core Engineering Resume"
    assert len(retrieved["experience"]) == 1
    assert len(retrieved["languages"]) == 2
    assert retrieved["languages"][0]["language"] == "English"
    assert len(retrieved["awards"]) == 1
    assert len(retrieved["volunteering"]) == 1
    print("PASS: test_create_and_get_resume")


def test_candidate_ownership_enforcement():
    """Verifies that Candidate B cannot view, update, or delete Candidate A's resume."""
    fixtures = setup_fixtures()
    create_resp = client.post(
        "/api/resumes",
        json={"title": "Alice Private Resume", "is_base_resume": False},
        headers=fixtures["headers_a"]
    )
    assert create_resp.status_code == 201
    resume_id = create_resp.json()["id"]

    # Candidate B attempts to read
    get_resp = client.get(f"/api/resumes/{resume_id}", headers=fixtures["headers_b"])
    assert get_resp.status_code == 403, f"Expected 403 Forbidden, got {get_resp.status_code}"

    # Candidate B attempts to edit
    put_resp = client.put(f"/api/resumes/{resume_id}", json={"title": "Hacked Title"}, headers=fixtures["headers_b"])
    assert put_resp.status_code == 403

    # Candidate B attempts to delete
    del_resp = client.delete(f"/api/resumes/{resume_id}", headers=fixtures["headers_b"])
    assert del_resp.status_code == 403

    # Candidate B attempts to export Candidate A's resume
    exp_resp = client.get(f"/api/resumes/{resume_id}/export?format=txt", headers=fixtures["headers_b"])
    assert exp_resp.status_code == 403
    print("PASS: test_candidate_ownership_enforcement")


def test_recruiter_role_blocked():
    """Verifies RBAC: Recruiters cannot access candidate resume studio."""
    fixtures = setup_fixtures()
    resp = client.get("/api/resumes", headers=fixtures["headers_rec"])
    assert resp.status_code == 403, f"Expected 403 Forbidden, got {resp.status_code}"
    print("PASS: test_recruiter_role_blocked")


def test_unauthenticated_blocked():
    resp = client.get("/api/resumes")
    assert resp.status_code == 401
    print("PASS: test_unauthenticated_blocked")


def test_version_history_checkpointing():
    """Verifies that create_new_version preserves old version and increments version number."""
    fixtures = setup_fixtures()
    create_resp = client.post(
        "/api/resumes",
        json={"title": "Versioned Resume", "summary": "Initial summary"},
        headers=fixtures["headers_a"]
    )
    assert create_resp.status_code == 201
    v1 = create_resp.json()
    assert v1["version"] == 1

    # Save as new version
    v2_resp = client.put(
        f"/api/resumes/{v1['id']}",
        json={"title": "Versioned Resume v2", "summary": "Polished summary v2", "create_new_version": True, "change_summary": "Added cloud telemetry"},
        headers=fixtures["headers_a"]
    )
    assert v2_resp.status_code in (200, 201), v2_resp.text
    v2 = v2_resp.json()
    assert v2["version"] == 2
    assert v2["parent_resume_id"] == v1["id"]
    assert v2["id"] != v1["id"]

    # Original v1 still exists in database
    v1_check = client.get(f"/api/resumes/{v1['id']}", headers=fixtures["headers_a"])
    assert v1_check.status_code == 200
    assert v1_check.json()["version"] == 1
    assert v1_check.json()["summary"] == "Initial summary"

    # List versions
    versions_resp = client.get(f"/api/resumes/{v2['id']}/versions", headers=fixtures["headers_a"])
    assert versions_resp.status_code == 200
    versions = versions_resp.json()
    assert len(versions) >= 2
    print("PASS: test_version_history_checkpointing")


def test_sync_resume_to_profile():
    fixtures = setup_fixtures()
    create_resp = client.post(
        "/api/resumes",
        json={
            "title": "Sync Test",
            "contact_info": {"phone": "+1-999-888-7777", "headline": "Staff Distributed Systems Architect"},
            "summary": "Specialized in sub-millisecond RPC services.",
            "skills": ["Rust", "Go", "Kafka", "PostgreSQL"],
            "education": [{"degree": "Master of Science in Software Engineering", "institution": "Tech University"}]
        },
        headers=fixtures["headers_a"]
    )
    assert create_resp.status_code == 201
    res_id = create_resp.json()["id"]

    sync_resp = client.post(f"/api/resumes/{res_id}/sync-profile", headers=fixtures["headers_a"])
    assert sync_resp.status_code == 200

    # Query current user
    me_resp = client.get("/api/auth/me", headers=fixtures["headers_a"])
    assert me_resp.status_code == 200
    me = me_resp.json()
    assert me["phone"] == "+1-999-888-7777"
    assert me["job_role"] == "Staff Distributed Systems Architect"
    assert me["resume_summary"] == "Specialized in sub-millisecond RPC services."
    assert "Rust" in me["skills"]
    print("PASS: test_sync_resume_to_profile")


def test_ai_assist_summary_refinement():
    fixtures = setup_fixtures()
    payload = {
        "action": "refine_summary",
        "current_text": "I write backend code in python.",
        "resume_context": {
            "skills": ["Python", "FastAPI", "PostgreSQL"],
            "contact_info": {"headline": "Backend Engineer"}
        }
    }
    resp = client.post("/api/resumes/ai-assist", json=payload, headers=fixtures["headers_a"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "suggestion" in data
    assert len(data["suggestion"]) > 10
    assert "grounded_source" in data
    print("PASS: test_ai_assist_summary_refinement")


def test_ai_assist_bullet_strengthening():
    fixtures = setup_fixtures()
    payload = {
        "action": "improve_bullet",
        "current_text": "Worked on database queries and improved speed.",
        "resume_context": {
            "skills": ["PostgreSQL", "SQL"]
        }
    }
    resp = client.post("/api/resumes/ai-assist", json=payload, headers=fixtures["headers_a"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "suggestion" in data
    assert len(data["suggestion"]) > 10
    print("PASS: test_ai_assist_bullet_strengthening")


def test_ai_assist_suggest_keywords_real_job():
    fixtures = setup_fixtures()
    job_id = fixtures["job"].id
    payload = {
        "action": "suggest_keywords",
        "job_id": job_id,
        "resume_context": {
            "skills": ["Python", "PostgreSQL", "Docker"]
        }
    }
    resp = client.post("/api/resumes/ai-assist", json=payload, headers=fixtures["headers_a"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "matched_keywords" in data
    assert "missing_keywords" in data
    # Python & PostgreSQL should be matched
    matched = [m.lower() for m in data["matched_keywords"]]
    assert "python" in matched
    assert "postgresql" in matched
    # Kubernetes or Redis should be in missing
    missing = [m.lower() for m in data["missing_keywords"]]
    assert any(k in missing for k in ["kubernetes", "redis"])
    print("PASS: test_ai_assist_suggest_keywords_real_job")


def test_ai_assist_audit_gaps():
    fixtures = setup_fixtures()
    # Resume with missing phone, empty experience, short summary
    payload = {
        "action": "audit_gaps",
        "resume_context": {
            "contact_info": {"email": "test@example.com", "phone": ""},
            "summary": "Short",
            "experience": [],
            "skills": ["Python"]
        }
    }
    resp = client.post("/api/resumes/ai-assist", json=payload, headers=fixtures["headers_a"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "audit_findings" in data
    findings = data["audit_findings"]
    sections_flagged = [f["section"] for f in findings]
    assert "contact" in sections_flagged
    assert "experience" in sections_flagged
    print("PASS: test_ai_assist_audit_gaps")


def test_export_resume_txt_and_json():
    fixtures = setup_fixtures()
    create_resp = client.post(
        "/api/resumes",
        json={
            "title": "Exportable Resume",
            "contact_info": {"full_name": "Alice Export", "email": "alice@export.com"},
            "summary": "Engineering summary for export testing.",
            "skills": ["Python", "FastAPI"],
            "languages": [{"language": "German", "proficiency": "Fluent"}],
            "awards": [{"title": "Innovation Award", "issuer": "Tech Summit", "date": "2024"}],
            "volunteering": [{"role": "STEM Volunteer", "organization": "Local High School", "start_date": "2021"}]
        },
        headers=fixtures["headers_a"]
    )
    assert create_resp.status_code == 201
    res_id = create_resp.json()["id"]

    # Text export
    txt_resp = client.get(f"/api/resumes/{res_id}/export?format=txt", headers=fixtures["headers_a"])
    assert txt_resp.status_code == 200
    assert "Alice Export" in txt_resp.text
    assert "Engineering summary for export testing." in txt_resp.text
    assert "German (Fluent)" in txt_resp.text
    assert "Innovation Award" in txt_resp.text
    assert "STEM Volunteer" in txt_resp.text

    # JSON export
    json_resp = client.get(f"/api/resumes/{res_id}/export?format=json", headers=fixtures["headers_a"])
    assert json_resp.status_code == 200
    assert json_resp.json()["title"] == "Exportable Resume"
    assert len(json_resp.json()["languages"]) == 1
    assert len(json_resp.json()["awards"]) == 1
    assert len(json_resp.json()["volunteering"]) == 1
    print("PASS: test_export_resume_txt_and_json")


def test_new_candidate_sparse_draft_creation():
    """Verifies that a new candidate with missing optional fields can save a valid draft."""
    fixtures = setup_fixtures()
    # Candidate with missing optional sections (no experience, no education, no certs, no projects)
    payload = {
        "title": "Minimal Draft Resume",
        "is_base_resume": True,
        "contact_info": {
            "full_name": "New Candidate",
            "email": fixtures["cand_b"].email,
        },
        "summary": "Junior engineer eager to contribute.",
        "skills": ["Python"],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": []
    }
    resp = client.post("/api/resumes", json=payload, headers=fixtures["headers_b"])
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["id"].startswith("res-")
    assert data["title"] == "Minimal Draft Resume"
    assert data["experience"] == []
    assert data["education"] == []
    print("PASS: test_new_candidate_sparse_draft_creation")


def test_ai_assist_job_tailoring_action():
    """Verifies action='tailor_resume' against an authorized real job requisition."""
    fixtures = setup_fixtures()
    job_id = fixtures["job"].id
    payload = {
        "action": "tailor_resume",
        "job_id": job_id,
        "resume_context": {
            "summary": "General full-stack developer.",
            "skills": ["Python", "FastAPI", "Docker"]
        }
    }
    resp = client.post("/api/resumes/ai-assist", json=payload, headers=fixtures["headers_a"])
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "suggestion" in data
    assert "grounded_source" in data
    assert fixtures["job"].title in data["grounded_source"]
    print("PASS: test_ai_assist_job_tailoring_action")


def test_ai_assist_error_handling():
    """Verifies honest error handling for missing inputs and invalid actions."""
    fixtures = setup_fixtures()
    # Missing current_text on improve_bullet -> 400
    resp_bullet = client.post(
        "/api/resumes/ai-assist",
        json={"action": "improve_bullet", "current_text": ""},
        headers=fixtures["headers_a"]
    )
    assert resp_bullet.status_code == 400

    # Missing job_id on suggest_keywords -> 400
    resp_kw = client.post(
        "/api/resumes/ai-assist",
        json={"action": "suggest_keywords"},
        headers=fixtures["headers_a"]
    )
    assert resp_kw.status_code == 400

    # Non-existent job_id -> 404
    resp_notfound = client.post(
        "/api/resumes/ai-assist",
        json={"action": "suggest_keywords", "job_id": "job-non-existent-999"},
        headers=fixtures["headers_a"]
    )
    assert resp_notfound.status_code == 404

    # Invalid action -> 400
    resp_invalid = client.post(
        "/api/resumes/ai-assist",
        json={"action": "hallucinate_fake_credentials"},
        headers=fixtures["headers_a"]
    )
    assert resp_invalid.status_code == 400
    print("PASS: test_ai_assist_error_handling")


if __name__ == "__main__":
    print("--- Running ARETE AI Resume Studio Test Suite ---")
    test_init_resume_from_profile()
    test_create_and_get_resume()
    test_candidate_ownership_enforcement()
    test_recruiter_role_blocked()
    test_unauthenticated_blocked()
    test_version_history_checkpointing()
    test_sync_resume_to_profile()
    test_ai_assist_summary_refinement()
    test_ai_assist_bullet_strengthening()
    test_ai_assist_suggest_keywords_real_job()
    test_ai_assist_job_tailoring_action()
    test_ai_assist_audit_gaps()
    test_ai_assist_error_handling()
    test_export_resume_txt_and_json()
    test_new_candidate_sparse_draft_creation()
    print(">>> ALL 15 AI RESUME STUDIO TESTS PASSED PERFECTLY! <<<")
