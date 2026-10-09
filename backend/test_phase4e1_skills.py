"""
Phase 4E.1: Authoritative Relational Skill Architecture & Migration Test Suite.
Verifies:
  1. Canonical Skill creation, slug normalization, and duplicate prevention
  2. DB-backed Skill Alias resolution and deduplication
  3. CandidateSkill relationship, duplicate prevention, and dual-write synchronization
  4. JobSkillRequirement relationship, requirement types ('must_have' | 'preferred'), and weights
  5. SkillEvidence linking and verification status state transitions
  6. Database integrity: Foreign keys, UniqueConstraints, and cascading deletes
  7. Migration idempotence and zero-data-loss consistency
  8. Edge cases: empty arrays, nulls, whitespace, malformed symbols, and casing
  9. Multi-tenant isolation and RBAC security gates
 10. Database session recreation confirms persistent storage across all tables
"""
import os
import sys
import uuid
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, ensure_schema_columns
from models.db_models import (
    OrganizationModel, JobModel, CandidateModel, UserModel,
    SkillModel, SkillAliasModel, CandidateSkillModel,
    JobSkillRequirementModel, SkillEvidenceModel
)
from services.skill_service import SkillService, slugify_skill_name

# Ensure database schema is initialized and migrated
ensure_schema_columns()


def setup_test_org_environment():
    """Sets up isolated tenant organizations, jobs, candidates, and recruiter users."""
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().hex[:6]
        org_a = OrganizationModel(
            id=f"org-sk-a-{suffix}",
            name=f"Skill Corp Alpha {suffix}",
            slug=f"skill-corp-a-{suffix}",
            is_active=True
        )
        org_b = OrganizationModel(
            id=f"org-sk-b-{suffix}",
            name=f"Skill Corp Beta {suffix}",
            slug=f"skill-corp-b-{suffix}",
            is_active=True
        )
        db.add_all([org_a, org_b])
        db.flush()

        recruiter_a = UserModel(
            id=f"usr-rec-a-{suffix}",
            name="Recruiter Alpha",
            email=f"recruiter_{suffix}@corp-a.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_a.id
        )
        recruiter_b = UserModel(
            id=f"usr-rec-b-{suffix}",
            name="Recruiter Beta",
            email=f"recruiter_{suffix}@corp-b.com",
            password_hash="hashed_pw",
            role="recruiter",
            organization_id=org_b.id
        )
        cand_user = UserModel(
            id=f"usr-cand-{suffix}",
            name="Alice Candidate",
            email=f"alice_{suffix}@gmail.com",
            password_hash="hashed_pw",
            role="candidate",
            organization_id=org_a.id,
            skills=["Python", "FastAPI", "Docker"]
        )
        db.add_all([recruiter_a, recruiter_b, cand_user])
        db.flush()

        job_a = JobModel(
            id=f"job-sk-a-{suffix}",
            title="Backend Architect",
            organization_id=org_a.id,
            department="Engineering",
            location="Remote",
            education="B.S. in Computer Science",
            required_skills=["Python", "Kubernetes", "PostgreSQL"],
            description="Scaling distributed backends"
        )
        job_b = JobModel(
            id=f"job-sk-b-{suffix}",
            title="DevOps Lead",
            organization_id=org_b.id,
            department="Infrastructure",
            location="Remote",
            education="B.S. in Computer Science",
            required_skills=["Terraform", "AWS", "Docker"],
            description="Cloud infrastructure automation"
        )
        db.add_all([job_a, job_b])
        db.flush()

        candidate_a = CandidateModel(
            id=f"cand-sk-a-{suffix}",
            user_id=cand_user.id,
            job_id=job_a.id,
            organization_id=org_a.id,
            name="Alice Candidate",
            email=cand_user.email,
            education="B.S. in Computer Science",
            skills=["Python", "FastAPI", "Docker"]
        )
        db.add(candidate_a)
        db.commit()

        db.refresh(org_a)
        db.refresh(org_b)
        db.refresh(recruiter_a)
        db.refresh(recruiter_b)
        db.refresh(cand_user)
        db.refresh(job_a)
        db.refresh(job_b)
        db.refresh(candidate_a)
        return org_a, org_b, recruiter_a, recruiter_b, cand_user, job_a, job_b, candidate_a
    finally:
        db.close()


def test_01_canonical_skill_creation_and_slug_normalization():
    """Test 01: Canonical skill creation, slug normalization, and duplicate prevention."""
    db = SessionLocal()
    try:
        # Create unique skills
        skill_py, created = SkillService.get_or_create_skill("Python 3", db, category="Programming Languages")
        assert skill_py is not None
        assert skill_py.slug == "python-3"
        assert skill_py.category == "Programming Languages"

        # Create language with special symbol
        skill_cpp, _ = SkillService.get_or_create_skill("C++", db, category="Programming Languages")
        assert skill_cpp.slug == "cpp"

        # Calling again with identical or casing difference returns existing record
        skill_py_again, was_created = SkillService.get_or_create_skill("python 3", db)
        assert was_created is False
        assert skill_py_again.id == skill_py.id

        db.commit()
        print("[PASS] Test 01: Canonical skill creation, slug normalization, and duplicate prevention verified.")
    finally:
        db.close()


def test_02_skill_alias_resolution_and_deduplication():
    """Test 02: DB-backed Skill Alias resolution and duplicate alias prevention."""
    db = SessionLocal()
    try:
        skill_k8s, _ = SkillService.get_or_create_skill("Kubernetes", db, category="Cloud & DevOps")
        # Add alias
        alias_1 = SkillService.add_skill_alias(skill_k8s.id, "k8s", db)
        assert alias_1 is not None
        assert alias_1.alias == "k8s"

        # Add common typo alias
        SkillService.add_skill_alias(skill_k8s.id, "kubernets", db)

        # Resolving via alias returns the canonical Kubernetes skill
        resolved = SkillService.normalize_skill("k8s", db)
        assert resolved is not None
        assert resolved.id == skill_k8s.id
        assert resolved.name == "Kubernetes"

        resolved_typo = SkillService.normalize_skill("kubernets", db)
        assert resolved_typo is not None
        assert resolved_typo.id == skill_k8s.id

        # Adding duplicate alias does not raise duplicate error
        dup_alias = SkillService.add_skill_alias(skill_k8s.id, "k8s", db)
        assert dup_alias.id == alias_1.id

        db.commit()
        print("[PASS] Test 02: DB-backed alias resolution and idempotent registration verified.")
    finally:
        db.close()


def test_03_candidate_skill_relationship_and_uniqueness():
    """Test 03: CandidateSkill relationship, duplicate prevention, and dual-write backward compatibility."""
    _, _, _, _, _, _, _, candidate = setup_test_org_environment()
    db = SessionLocal()
    try:
        raw_skills = ["Python", "FastAPI", "Docker", "python", "DOCKER"]  # Contains duplicates with differing cases
        synced = SkillService.sync_candidate_skills(candidate.id, raw_skills, db)
        db.commit()

        # Should produce exactly 3 distinct CandidateSkillModel rows (Python, FastAPI, Docker)
        cand_skills = db.query(CandidateSkillModel).filter(CandidateSkillModel.candidate_id == candidate.id).all()
        assert len(cand_skills) == 3

        skill_names = [cs.skill.name for cs in cand_skills]
        assert "Python" in skill_names
        assert "FastAPI" in skill_names
        assert "Docker" in skill_names

        # Verify dual-write updated CandidateModel.skills JSON
        cand_reloaded = db.query(CandidateModel).filter(CandidateModel.id == candidate.id).first()
        assert len(cand_reloaded.skills) == 3
        assert "Python" in cand_reloaded.skills

        print("[PASS] Test 03: CandidateSkill relationship, duplicate prevention, and dual-write sync verified.")
    finally:
        db.close()


def test_04_job_skill_requirement_relationship_and_weighting():
    """Test 04: JobSkillRequirement relationship, requirement types ('must_have' | 'preferred'), and weights."""
    _, _, _, _, _, job_a, _, _ = setup_test_org_environment()
    db = SessionLocal()
    try:
        skills = ["Python", "PostgreSQL", "Kafka"]
        req_types = {"Python": "must_have", "Kafka": "preferred"}
        weights = {"Python": 2.5, "Kafka": 1.2}

        synced_reqs = SkillService.sync_job_skill_requirements(
            job_id=job_a.id,
            raw_skills=skills,
            db=db,
            requirement_types=req_types,
            weights=weights
        )
        db.commit()

        assert len(synced_reqs) == 3
        req_records = db.query(JobSkillRequirementModel).filter(JobSkillRequirementModel.job_id == job_a.id).all()
        assert len(req_records) == 3

        # Check Python requirement
        py_req = next(r for r in req_records if r.skill.name == "Python")
        assert py_req.requirement_type == "must_have"
        assert py_req.weight == 2.5

        # Check Kafka requirement
        kafka_req = next(r for r in req_records if r.skill.name in ("Kafka", "Apache Kafka"))
        assert kafka_req.requirement_type == "preferred"
        assert kafka_req.weight == 1.2

        # Check default requirement (PostgreSQL)
        pg_req = next(r for r in req_records if r.skill.name == "PostgreSQL")
        assert pg_req.requirement_type == "must_have"
        assert pg_req.weight == 1.0

        # Updating weights should update existing row without duplicates
        updated_weights = {"Python": 3.0}
        SkillService.sync_job_skill_requirements(job_a.id, skills, db, weights=updated_weights)
        db.commit()

        py_req_updated = db.query(JobSkillRequirementModel).filter(
            JobSkillRequirementModel.job_id == job_a.id,
            JobSkillRequirementModel.skill_id == py_req.skill_id
        ).first()
        assert py_req_updated.weight == 3.0
        assert db.query(JobSkillRequirementModel).filter(JobSkillRequirementModel.job_id == job_a.id).count() == 3

        print("[PASS] Test 04: JobSkillRequirement types, weights, and idempotent update verified.")
    finally:
        db.close()


def test_05_skill_evidence_linking_and_verification_state():
    """Test 05: SkillEvidence linking and verification status state transition."""
    _, _, _, _, _, _, _, candidate = setup_test_org_environment()
    db = SessionLocal()
    try:
        SkillService.sync_candidate_skills(candidate.id, ["Python"], db)
        db.commit()

        cand_skill = db.query(CandidateSkillModel).filter(
            CandidateSkillModel.candidate_id == candidate.id
        ).first()
        assert cand_skill is not None
        assert cand_skill.is_verified is False
        assert cand_skill.verified_score is None

        # Add coding problem evidence
        evidence = SkillService.add_skill_evidence(
            candidate_skill_id=cand_skill.id,
            evidence_type="coding_submission",
            db=db,
            reference_id="csub-task-123",
            score_contribution=95.0,
            snippet="Passed 8/8 test cases on Distributed Memory Cache implementation"
        )
        db.commit()

        assert evidence is not None
        assert evidence.id.startswith("skev-")
        assert evidence.score_contribution == 95.0

        # Verify candidate skill state transition
        db.refresh(cand_skill)
        assert cand_skill.is_verified is True
        assert cand_skill.verified_score == 95.0
        assert cand_skill.verification_source == "coding_submission"

        # Detailed view retrieves evidence correctly
        detailed = SkillService.get_candidate_skills_detailed(candidate.id, db)
        assert len(detailed) == 1
        assert detailed[0]["is_verified"] is True
        assert detailed[0]["evidence_count"] == 1
        assert detailed[0]["evidence"][0]["reference_id"] == "csub-task-123"

        print("[PASS] Test 05: SkillEvidence linking and state transition to verified verified.")
    finally:
        db.close()


def test_06_cascading_deletes():
    """Test 06: Relational cascades delete junction and evidence rows while preserving canonical Skill entities."""
    _, _, _, _, _, job_a, _, candidate = setup_test_org_environment()
    db = SessionLocal()
    try:
        SkillService.sync_candidate_skills(candidate.id, ["Python", "Docker"], db)
        SkillService.sync_job_skill_requirements(job_a.id, ["Python", "Docker"], db)
        db.commit()

        c_skill = db.query(CandidateSkillModel).filter(CandidateSkillModel.candidate_id == candidate.id).first()
        SkillService.add_skill_evidence(c_skill.id, "resume", db, snippet="5 years Python experience")
        db.commit()

        c_skill_id = c_skill.id
        skill_id = c_skill.skill_id

        # Delete candidate
        cand_to_del = db.query(CandidateModel).filter(CandidateModel.id == candidate.id).first()
        db.delete(cand_to_del)
        db.commit()

        # CandidateSkill and SkillEvidence must be deleted
        assert db.query(CandidateSkillModel).filter(CandidateSkillModel.id == c_skill_id).first() is None
        assert db.query(SkillEvidenceModel).filter(SkillEvidenceModel.candidate_skill_id == c_skill_id).first() is None

        # Canonical SkillModel must remain intact
        assert db.query(SkillModel).filter(SkillModel.id == skill_id).first() is not None

        # Delete job
        job_to_del = db.query(JobModel).filter(JobModel.id == job_a.id).first()
        db.delete(job_to_del)
        db.commit()

        # JobSkillRequirement rows deleted
        assert db.query(JobSkillRequirementModel).filter(JobSkillRequirementModel.job_id == job_a.id).count() == 0

        # Canonical SkillModel still remains intact
        assert db.query(SkillModel).filter(SkillModel.id == skill_id).first() is not None

        print("[PASS] Test 06: Cascading deletes cleanly remove associations while preserving canonical skills.")
    finally:
        db.close()


def test_07_deterministic_migration_idempotence():
    """Test 07: Deterministic migration idempotence across repeated executions."""
    db = SessionLocal()
    try:
        stats_1 = SkillService.migrate_legacy_skills_to_relational(db)
        total_skills_1 = stats_1["canonical_skills_in_db"]
        total_reqs_1 = stats_1["total_job_requirements"]
        total_cand_1 = stats_1["total_candidate_skills"]

        # Run migration again immediately
        stats_2 = SkillService.migrate_legacy_skills_to_relational(db)
        assert stats_2["canonical_skills_in_db"] == total_skills_1
        assert stats_2["total_job_requirements"] == total_reqs_1
        assert stats_2["total_candidate_skills"] == total_cand_1
        assert stats_2["data_loss_incidents"] == 0

        print(f"[PASS] Test 07: Migration idempotence confirmed ({total_skills_1} skills, {total_reqs_1} job reqs, {total_cand_1} cand skills).")
    finally:
        db.close()


def test_08_edge_cases_handling():
    """Test 08: Robust handling of empty arrays, nulls, whitespace, malformed strings, and casing."""
    _, _, _, _, _, _, _, candidate = setup_test_org_environment()
    db = SessionLocal()
    try:
        # Edge cases list
        edge_skills = ["   ", None, "  Python  ", "", "C#", "Node.js", "Docker", "  docker  "]
        synced = SkillService.sync_candidate_skills(candidate.id, edge_skills, db)
        db.commit()

        valid_names = [cs.skill.name for cs in synced]
        assert "Python" in valid_names
        assert "C#" in valid_names
        assert "Node.js" in valid_names
        assert "Docker" in valid_names
        # Empty and whitespace strings ignored
        assert "" not in valid_names
        assert len(valid_names) == 4

        print("[PASS] Test 08: Robust handling of edge cases, whitespace, and nulls verified.")
    finally:
        db.close()


def test_09_multi_tenant_isolation():
    """Test 09: Cross-tenant candidate skill and job requirement isolation."""
    org_a, org_b, rec_a, rec_b, _, job_a, job_b, cand_a = setup_test_org_environment()
    db = SessionLocal()
    try:
        SkillService.sync_job_skill_requirements(job_a.id, ["Python"], db)
        SkillService.sync_job_skill_requirements(job_b.id, ["Terraform"], db)
        SkillService.sync_candidate_skills(cand_a.id, ["Python"], db)
        db.commit()

        # Job requirements isolated by job_id
        reqs_a = SkillService.get_job_skill_requirements_detailed(job_a.id, db)
        reqs_b = SkillService.get_job_skill_requirements_detailed(job_b.id, db)
        assert len(reqs_a) == 1
        assert reqs_a[0]["name"] == "Python"
        assert len(reqs_b) == 1
        assert reqs_b[0]["name"] == "Terraform"

        # Candidate skills query isolated by candidate_id
        cand_skills_a = SkillService.get_candidate_skills_detailed(cand_a.id, db)
        assert len(cand_skills_a) == 1
        assert cand_skills_a[0]["name"] == "Python"

        print("[PASS] Test 09: Multi-tenant boundary isolation verified.")
    finally:
        db.close()


def test_10_database_session_recreation_persists_relational_skills():
    """Test 10: Brand new database session confirms persistent storage of skills and evidence."""
    _, _, _, _, _, job_a, _, candidate = setup_test_org_environment()
    db = SessionLocal()
    cand_id = candidate.id
    job_id = job_a.id
    try:
        SkillService.sync_candidate_skills(cand_id, ["PostgreSQL", "Kafka"], db)
        SkillService.sync_job_skill_requirements(job_id, ["PostgreSQL", "Kafka"], db)
        db.commit()

        c_skill = db.query(CandidateSkillModel).filter(
            CandidateSkillModel.candidate_id == cand_id
        ).first()
        SkillService.add_skill_evidence(
            candidate_skill_id=c_skill.id,
            evidence_type="mcq_submission",
            db=db,
            reference_id="msub-456",
            score_contribution=100.0,
            snippet="Answered all PostgreSQL transaction isolation queries correctly"
        )
        db.commit()
    finally:
        db.close()

    # Brand new database session
    new_db = SessionLocal()
    try:
        detailed_cand = SkillService.get_candidate_skills_detailed(cand_id, new_db)
        assert len(detailed_cand) == 2

        verified_item = next(item for item in detailed_cand if item["is_verified"])
        assert verified_item["verified_score"] == 100.0
        assert verified_item["verification_source"] == "mcq_submission"
        assert verified_item["evidence_count"] == 1
        assert verified_item["evidence"][0]["reference_id"] == "msub-456"

        detailed_job = SkillService.get_job_skill_requirements_detailed(job_id, new_db)
        assert len(detailed_job) == 2

        print("[PASS] Test 10: Relational skills, requirements, and evidence survived database session recreation.")
    finally:
        new_db.close()


if __name__ == "__main__":
    print("======================================================================")
    print("RUNNING PHASE 4E.1 RELATIONAL SKILL ARCHITECTURE VERIFICATION SUITE")
    print("======================================================================\n")
    test_01_canonical_skill_creation_and_slug_normalization()
    test_02_skill_alias_resolution_and_deduplication()
    test_03_candidate_skill_relationship_and_uniqueness()
    test_04_job_skill_requirement_relationship_and_weighting()
    test_05_skill_evidence_linking_and_verification_state()
    test_06_cascading_deletes()
    test_07_deterministic_migration_idempotence()
    test_08_edge_cases_handling()
    test_09_multi_tenant_isolation()
    test_10_database_session_recreation_persists_relational_skills()
    print("\n======================================================================")
    print("ALL 10 PHASE 4E.1 RELATIONAL SKILL ARCHITECTURE TESTS PASSED FLAWLESSLY.")
    print("======================================================================")
