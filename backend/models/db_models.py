"""
(M) Models Package - Database Models & Data Schemas
"""
from database import Base
from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey, UniqueConstraint, Numeric, Boolean, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Dict, Any, List, Optional

class OrganizationModel(Base):
    """
    Authoritative Organization / Tenant Entity.
    Guarantees strict tenant isolation across jobs, candidates, assessments, and users.
    """
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, index=True) # e.g. "org-sparkx-default", "org-alpha", or UUID
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    domain = Column(String, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Tenant-scoped relationships
    users = relationship("UserModel", back_populates="organization", foreign_keys="UserModel.organization_id")
    jobs = relationship("JobModel", back_populates="organization", foreign_keys="JobModel.organization_id")
    candidates = relationship("CandidateModel", back_populates="organization", foreign_keys="CandidateModel.organization_id")
    assessments = relationship("AssessmentModel", back_populates="organization", foreign_keys="AssessmentModel.organization_id")
    coding_problems = relationship("CodingProblemModel", back_populates="organization", foreign_keys="CodingProblemModel.organization_id")
    mcq_questions = relationship("MCQQuestionModel", back_populates="organization", foreign_keys="MCQQuestionModel.organization_id")
    recruiter_availabilities = relationship("RecruiterAvailabilityModel", back_populates="organization", foreign_keys="RecruiterAvailabilityModel.organization_id")
    interview_bookings = relationship("InterviewBookingModel", back_populates="organization", foreign_keys="InterviewBookingModel.organization_id")


class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company_name = Column(String, default="SparkX Technologies")
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="SET NULL"), default="org-sparkx-default", nullable=True, index=True)
    department = Column(String, nullable=False)
    location = Column(String, default="Remote")
    min_experience_years = Column(Integer, default=2)
    experience = Column(String, default="2-4 years")
    education = Column(String, nullable=False)
    languages = Column(JSON, default=list)
    required_skills = Column(JSON, default=list)
    optional_criteria = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    questions = Column(JSON, default=list)
    coding_assessment = Column(JSON, default=dict)
    coding_difficulty = Column(String, default="Mid-Level")
    assessment_pool = Column(JSON, default=dict)
    assessment_version = Column(Integer, default=1)
    competency_blueprint = Column(JSON, default=dict)
    
    # Authoritative Employer Compensation Specification (Production-Safe Numeric)
    ctc_type = Column(String, default="range", nullable=True) # "fixed" | "range" | "starting_from"
    ctc_min = Column(Numeric(10, 2), nullable=True)
    ctc_max = Column(Numeric(10, 2), nullable=True)
    ctc_currency = Column(String, default="INR", nullable=True)
    ctc_period = Column(String, default="annual", nullable=True) # "annual" | "monthly"
    variable_pay_min = Column(Numeric(10, 2), nullable=True)
    variable_pay_max = Column(Numeric(10, 2), nullable=True)

    # Single Authoritative Job Lifecycle State ("Active" | "Paused" | "Closed")
    status = Column(String, default="Active", index=True)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(String, nullable=True)
    closure_reason = Column(Text, nullable=True) # e.g. "Position Filled", "Hiring Completed", "Requisition Cancelled"
    paused_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("OrganizationModel", back_populates="jobs", foreign_keys=[organization_id])
    candidates = relationship("CandidateModel", back_populates="job", cascade="all, delete-orphan")
    assessments = relationship("AssessmentModel", back_populates="job", cascade="all, delete-orphan")
    interview_bookings = relationship("InterviewBookingModel", back_populates="job", cascade="all, delete-orphan")
    skill_requirements = relationship("JobSkillRequirementModel", back_populates="job", cascade="all, delete-orphan")


class CandidateModel(Base):
    __tablename__ = "candidates"
    __table_args__ = (
        UniqueConstraint("job_id", "email", name="uq_candidate_job_email"),
    )

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    company_name = Column(String, default="SparkX Technologies")
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="SET NULL"), default="org-sparkx-default", nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    applied_date = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    status = Column(String, default="Screening")
    match_score = Column(Integer, default=0)
    experience_years = Column(Float, default=0.0)
    education = Column(String, nullable=False)
    skills = Column(JSON, default=list)
    resume_summary = Column(Text, nullable=True)
    resume_filename = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    fraud_flags = Column(JSON, default=list)
    match_details = Column(JSON, default=dict)

    # Authoritative Candidate Application Compensation Expectations (Production-Safe Numeric)
    current_ctc = Column(Numeric(10, 2), nullable=True)
    expected_ctc_type = Column(String, default="range", nullable=True) # "fixed" | "range"
    expected_ctc_min = Column(Numeric(10, 2), nullable=True)
    expected_ctc_max = Column(Numeric(10, 2), nullable=True)
    ctc_currency = Column(String, default="INR", nullable=True)
    
    # 4-Category Technical Assessment Data & Code Submissions
    assessment_data = Column(JSON, default=dict)
    coding_language = Column(String, nullable=True)
    coding_score = Column(Integer, default=0)
    coding_submission = Column(Text, nullable=True)
    coding_results = Column(JSON, default=dict)

    # Telemetry & Integrity
    integrity_score = Column(Integer, default=100)
    integrity_risk = Column(String, default="Low")
    integrity_events = Column(JSON, default=list)

    # Evaluation & Scorecard
    scores = Column(JSON, default=dict)
    interview_summary = Column(Text, nullable=True)
    evidence_snippets = Column(JSON, default=list)
    interview_transcript = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=dict)

    # Human Decisions & Recruiter Evaluation
    hr_notes = Column(Text, default="")
    final_decision = Column(String, default="Under Review")
    recruiter_score = Column(Integer, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    rejection_category = Column(String, nullable=True)
    rationale_category = Column(String, nullable=True)
    rationale_note = Column(Text, nullable=True)
    
    # Real-time Scheduling & Email Telemetry
    interview_scheduled_at = Column(String, nullable=True)
    interview_meeting_url = Column(String, nullable=True)
    interview_status = Column(String, default="not_scheduled", index=True)
    email_logs = Column(JSON, default=list)

    # Authoritative 4-Dimensional State Architecture
    stage = Column(String, default="applied", index=True)
    assessment_status = Column(String, default="not_invited", index=True)
    assessment_invited_at = Column(DateTime, nullable=True)
    assessment_started_at = Column(DateTime, nullable=True)
    assessment_submitted_at = Column(DateTime, nullable=True)
    assessment_evaluated_at = Column(DateTime, nullable=True)
    interview_started_at = Column(DateTime, nullable=True)
    interview_completed_at = Column(DateTime, nullable=True)
    hiring_decision = Column(String, default="undecided", index=True)
    stage_updated_at = Column(DateTime, default=datetime.utcnow)
    decision_updated_at = Column(DateTime, nullable=True)

    # Post-Interview Recruiter Expected Update Date & Timeline Telemetry
    expected_update_date = Column(String, nullable=True) # "YYYY-MM-DD"
    update_notes = Column(Text, nullable=True)
    update_status = Column(String, default="not_set", index=True) # "not_set" | "expected_update_date_set" | "update_sent" | "timeline_changed" | "update_overdue"
    update_sent_at = Column(DateTime, nullable=True)
    reminder_sent_flags = Column(JSON, default=dict) # {"due_tomorrow": bool, "due_today": bool}

    # Assessment Versioning & Immutability Snapshot
    assessment_version = Column(Integer, default=1, nullable=False)
    assessment_blueprint = Column(JSON, default=dict)

    # External Assessment Platform Integration
    external_assessment_platform = Column(String, nullable=True) # "hackerrank" | "leetcode" | "codesignal"
    external_assessment_id = Column(String, nullable=True)
    external_assessment_url = Column(String, nullable=True)
    external_assessment_result = Column(JSON, nullable=True)
    external_assessment_synced_at = Column(DateTime, nullable=True)

    # Controlled Reopening & Final-Decision Immutability Audit Fields
    reopened_at = Column(DateTime, nullable=True)
    reopened_by = Column(String, nullable=True)
    reopen_reason = Column(Text, nullable=True)
    previous_final_decision = Column(String, nullable=True)

    # Concurrency control
    version = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobModel", back_populates="candidates")
    organization = relationship("OrganizationModel", back_populates="candidates", foreign_keys=[organization_id])
    user = relationship("UserModel", back_populates="applications", foreign_keys=[user_id])
    state_logs = relationship("CandidateStateLogModel", back_populates="candidate", cascade="all, delete-orphan")
    coding_submissions = relationship("CodingSubmissionModel", back_populates="candidate", cascade="all, delete-orphan")
    mcq_submissions = relationship("MCQSubmissionModel", back_populates="candidate", cascade="all, delete-orphan")
    interview_bookings = relationship("InterviewBookingModel", back_populates="candidate", cascade="all, delete-orphan")
    candidate_skills = relationship("CandidateSkillModel", back_populates="candidate", cascade="all, delete-orphan")

    @property
    def job_title(self) -> str:
        return self.job.title if self.job else "Applied Position"


class CandidateStateLogModel(Base):
    __tablename__ = "candidate_state_logs"

    id = Column(String, primary_key=True, index=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False, index=True)
    dimension = Column(String, nullable=False)  # "stage" | "assessment_status" | "interview_status" | "hiring_decision"
    from_value = Column(String, nullable=True)
    to_value = Column(String, nullable=False)
    changed_by = Column(String, default="system")
    notes = Column(Text, nullable=True)
    rationale_category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("CandidateModel", back_populates="state_logs")


class IntegrityLogModel(Base):
    __tablename__ = "integrity_logs"

    id = Column(String, primary_key=True, index=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    timestamp = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="candidate") # "recruiter" or "candidate"
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="SET NULL"), default="org-sparkx-default", nullable=True, index=True)
    
    # Candidate Profile Fields (Populated via Resume Upload & Onboarding)
    phone = Column(String, nullable=True)
    job_role = Column(String, nullable=True)
    experience_years = Column(Float, default=0.0)
    skills = Column(JSON, default=list)
    education = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)
    resume_summary = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True)
    
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    reset_token_attempts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("OrganizationModel", back_populates="users", foreign_keys=[organization_id])
    applications = relationship("CandidateModel", back_populates="user", foreign_keys="CandidateModel.user_id")


class RevokedTokenModel(Base):
    __tablename__ = "revoked_tokens"

    id = Column(String, primary_key=True, index=True)
    token_jti = Column(String, unique=True, index=True, nullable=False)
    revoked_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)


class RecruiterInvitationModel(Base):
    __tablename__ = "recruiter_invitations"

    id = Column(String, primary_key=True, index=True)
    invite_code = Column(String, unique=True, index=True, nullable=False)
    created_by = Column(String, nullable=True)
    recipient_email = Column(String, nullable=True)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ═════════════════════════════════════════════════════════════════════════════
# ADVANCED CODING ASSESSMENT RELATIONAL ENTITIES (PHASE 4A.1)
# ═════════════════════════════════════════════════════════════════════════════

class AssessmentModel(Base):
    """
    Represents an assessment configuration assigned to a Job.
    Supports modular sections (MCQs, Scenario, Coding Problems) and versioning.
    """
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, index=True) # e.g. "asm-5f8a1b"
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="SET NULL"), default="org-sparkx-default", nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=45)
    passing_score = Column(Integer, default=70)
    is_active = Column(Boolean, default=True, index=True)
    version = Column(Integer, default=1, nullable=False)
    status = Column(String, default="draft", index=True) # "draft" | "published" | "archived"
    created_by = Column(String, nullable=True)
    max_attempts = Column(Integer, default=1)
    deadline_days = Column(Integer, nullable=True)
    randomize_questions = Column(Boolean, default=False)
    allow_review = Column(Boolean, default=True)
    allow_unanswered = Column(Boolean, default=True)
    allow_resume = Column(Boolean, default=True)
    published_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job = relationship("JobModel", back_populates="assessments")
    organization = relationship("OrganizationModel", back_populates="assessments", foreign_keys=[organization_id])
    sections = relationship("AssessmentSectionModel", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentSectionModel.display_order")
    coding_problems = relationship("AssessmentCodingProblemModel", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentCodingProblemModel.display_order")
    mcq_questions = relationship("AssessmentMCQModel", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentMCQModel.display_order")
    submissions = relationship("CodingSubmissionModel", back_populates="assessment", cascade="all, delete-orphan")
    mcq_submissions = relationship("MCQSubmissionModel", back_populates="assessment", cascade="all, delete-orphan")
    versions = relationship("AssessmentVersionModel", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentVersionModel.version_number.desc()")
    audit_logs = relationship("AssessmentAuditLogModel", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentAuditLogModel.created_at.desc()")


class AssessmentVersionModel(Base):
    """
    Immutable versioned snapshot of an Assessment.
    Generated on publication to guarantee that candidates invited to a specific version
    always experience the exact frozen questions, test cases, and scoring rules.
    """
    __tablename__ = "assessment_versions"
    __table_args__ = (
        UniqueConstraint("assessment_id", "version_number", name="uq_assessment_version"),
        Index("ix_assessment_versions_asm_ver", "assessment_id", "version_number"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "asv-1a2b3c"
    assessment_id = Column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=45)
    passing_score = Column(Integer, default=70)
    max_attempts = Column(Integer, default=1)
    deadline_days = Column(Integer, nullable=True)
    randomize_questions = Column(Boolean, default=False)
    allow_review = Column(Boolean, default=True)
    allow_unanswered = Column(Boolean, default=True)
    allow_resume = Column(Boolean, default=True)
    snapshot_data = Column(JSON, nullable=False) # Frozen blueprint: all MCQs, options, coding problems, test cases, weights
    published_by = Column(String, nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="versions")


class AssessmentAuditLogModel(Base):
    """
    Immutable audit ledger recording all Assessment Builder and Question lifecycle operations.
    """
    __tablename__ = "assessment_audit_logs"
    __table_args__ = (
        Index("ix_assessment_audit_logs_asm_created", "assessment_id", "created_at"),
        Index("ix_assessment_audit_logs_org", "organization_id"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "aal-1a2b3c"
    organization_id = Column(String, nullable=True, index=True)
    assessment_id = Column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=True, index=True)
    action = Column(String, nullable=False) # "created" | "updated" | "published" | "archived" | "question_added" | "question_removed" | "auto_selected" | "reordered"
    performed_by = Column(String, nullable=False)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="audit_logs")



class AssessmentSectionModel(Base):
    """
    Represents a discrete section within an assessment.
    Validated types: 'technical_mcqs' | 'scenario' | 'coding' | 'troubleshooting'
    """
    __tablename__ = "assessment_sections"

    id = Column(String, primary_key=True, index=True) # e.g. "sec-3c9f2a"
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    section_type = Column(String, nullable=False) # technical_mcqs | scenario | coding | troubleshooting
    display_order = Column(Integer, default=0)
    weight_percentage = Column(Float, default=25.0)
    config = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="sections")


class CodingProblemModel(Base):
    """
    Represents an authoritative coding problem definition.
    Can be platform-provided (is_system=True) or recruiter-created (tied to organization_id).
    """
    __tablename__ = "coding_problems"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_coding_problem_org_slug"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "prob-7a1b2c"
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True) # None or "system" for platform bank; org-xxx for custom
    is_system = Column(Boolean, default=False, index=True)
    title = Column(String, nullable=False, index=True)
    slug = Column(String, nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    difficulty = Column(String, default="Medium", index=True) # Easy | Medium | Hard
    constraints = Column(Text, nullable=True)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    execution_mode = Column(String, default="function", index=True) # "function" | "stdin"
    function_name = Column(String, default="solve")
    function_signature = Column(JSON, default=dict)
    time_limit_sec = Column(Float, default=5.0)
    memory_limit_mb = Column(Float, default=128.0)
    allowed_languages = Column(JSON, default=list) # e.g. ["python", "javascript", "sql", "java", "cpp"]
    starter_code = Column(JSON, default=dict) # {"python": "def solve(data):\n    pass\n"}
    solution_template = Column(Text, nullable=True)
    current_version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("OrganizationModel", back_populates="coding_problems", foreign_keys=[organization_id])
    versions = relationship("CodingProblemVersionModel", back_populates="problem", cascade="all, delete-orphan", order_by="CodingProblemVersionModel.version_number")
    test_cases = relationship("CodingTestCaseModel", back_populates="problem", cascade="all, delete-orphan", order_by="CodingTestCaseModel.display_order")
    assessment_associations = relationship("AssessmentCodingProblemModel", back_populates="problem", cascade="all, delete-orphan")
    submissions = relationship("CodingSubmissionModel", back_populates="problem", cascade="all, delete-orphan")


class CodingProblemVersionModel(Base):
    """
    Immutable snapshot/version of a CodingProblem.
    Guarantees active candidate assessments are never altered when recruiters edit problems.
    """
    __tablename__ = "coding_problem_versions"
    __table_args__ = (
        UniqueConstraint("problem_id", "version_number", name="uq_problem_version"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "cpv-1e2f3a"
    problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    problem_statement = Column(Text, nullable=False)
    difficulty = Column(String, default="Medium")
    constraints = Column(Text, nullable=True)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    execution_mode = Column(String, default="function") # "function" | "stdin"
    function_name = Column(String, default="solve")
    function_signature = Column(JSON, default=dict)
    time_limit_sec = Column(Float, default=5.0)
    memory_limit_mb = Column(Float, default=128.0)
    allowed_languages = Column(JSON, default=list)
    starter_code = Column(JSON, default=dict)
    change_summary = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    problem = relationship("CodingProblemModel", back_populates="versions")
    test_cases = relationship("CodingTestCaseModel", back_populates="problem_version", cascade="all, delete-orphan")
    assessment_associations = relationship("AssessmentCodingProblemModel", back_populates="problem_version")
    submissions = relationship("CodingSubmissionModel", back_populates="problem_version")


class AssessmentCodingProblemModel(Base):
    """
    Association entity supporting Assessment -> N Coding Problems with ordering, weights, and version snapshots.
    """
    __tablename__ = "assessment_coding_problems"
    __table_args__ = (
        UniqueConstraint("assessment_id", "coding_problem_id", name="uq_assessment_coding_problem"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "acp-9a8b7c"
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False, index=True)
    coding_problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=False, index=True)
    coding_problem_version_id = Column(String, ForeignKey("coding_problem_versions.id"), nullable=True, index=True)
    display_order = Column(Integer, default=0)
    weight = Column(Float, default=100.0) # Scoring weight/points
    is_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="coding_problems")
    problem = relationship("CodingProblemModel", back_populates="assessment_associations")
    problem_version = relationship("CodingProblemVersionModel", back_populates="assessment_associations")


class CodingTestCaseModel(Base):
    """
    Discrete test case entity supporting public/sample test cases and hidden evaluation test cases.
    Confidentiality: Hidden test cases are strictly filtered before returning candidate payloads.
    """
    __tablename__ = "coding_test_cases"

    id = Column(String, primary_key=True, index=True) # e.g. "tc-4d5e6f"
    problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=False, index=True)
    problem_version_id = Column(String, ForeignKey("coding_problem_versions.id"), nullable=True, index=True)
    input_data = Column(Text, nullable=False) # Formatted argument or stdin input
    expected_output = Column(Text, nullable=False) # Expected return value or stdout
    is_hidden = Column(Boolean, default=False, index=True) # False = public sample, True = secret grading
    weight = Column(Float, default=1.0)
    display_order = Column(Integer, default=0)
    explanation = Column(Text, nullable=True) # Explanation for sample test cases
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    problem = relationship("CodingProblemModel", back_populates="test_cases")
    problem_version = relationship("CodingProblemVersionModel", back_populates="test_cases")
    submission_results = relationship("SubmissionTestCaseResultModel", back_populates="test_case", cascade="all, delete-orphan")


class CodingSubmissionModel(Base):
    """
    Candidate submission for a specific coding problem within an assessment.
    Preserves historical submission attempts with execution telemetry and scores.
    """
    __tablename__ = "coding_submissions"

    id = Column(String, primary_key=True, index=True) # e.g. "sub-2b3c4d"
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False, index=True)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=True, index=True)
    coding_problem_id = Column(String, ForeignKey("coding_problems.id"), nullable=True, index=True)
    coding_problem_version_id = Column(String, ForeignKey("coding_problem_versions.id"), nullable=True, index=True)
    language = Column(String, nullable=False) # "python" | "javascript" | "sql" | "java" | "cpp" | etc.
    source_code = Column(Text, nullable=False)
    status = Column(String, default="pending", index=True) # "pending" | "evaluating" | "completed" | "failed" | "error"
    passed_test_cases = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    score = Column(Float, default=0.0) # 0.0 to 100.0 or scaled score
    execution_time_ms = Column(Float, nullable=True)
    memory_mb = Column(Float, nullable=True)
    compiler_output = Column(Text, nullable=True)
    runtime_error = Column(Text, nullable=True)
    is_best_submission = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    candidate = relationship("CandidateModel", back_populates="coding_submissions")
    assessment = relationship("AssessmentModel", back_populates="submissions")
    problem = relationship("CodingProblemModel", back_populates="submissions")
    problem_version = relationship("CodingProblemVersionModel", back_populates="submissions")
    test_case_results = relationship("SubmissionTestCaseResultModel", back_populates="submission", cascade="all, delete-orphan", order_by="SubmissionTestCaseResultModel.id")


class SubmissionTestCaseResultModel(Base):
    """
    Granular test-case execution outcome associated with a CodingSubmission.
    Confidentiality: For hidden test cases, actual_output is strictly filtered from candidate views.
    """
    __tablename__ = "submission_test_case_results"

    id = Column(String, primary_key=True, index=True) # e.g. "tcr-8a9b0c"
    submission_id = Column(String, ForeignKey("coding_submissions.id"), nullable=False, index=True)
    test_case_id = Column(String, ForeignKey("coding_test_cases.id"), nullable=True, index=True)
    passed = Column(Boolean, nullable=False)
    actual_output = Column(Text, nullable=True)
    execution_time_ms = Column(Float, nullable=True)
    memory_mb = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    is_hidden = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("CodingSubmissionModel", back_populates="test_case_results")
    test_case = relationship("CodingTestCaseModel", back_populates="submission_results")


# ═════════════════════════════════════════════════════════════════════════════
# ADVANCED MCQ ASSESSMENT RELATIONAL ENTITIES (PHASE 4B.2)
# ═════════════════════════════════════════════════════════════════════════════

class MCQQuestionModel(Base):
    """
    Represents an authoritative MCQ question definition.
    Can be platform-provided (is_system=True) or recruiter-authored (tied to organization_id).
    Options, correct answers, and explanations are stored authoritatively in the DB.
    """
    __tablename__ = "mcq_questions"

    id = Column(String, primary_key=True, index=True) # e.g. "mcq-7a1b2c" or "mcq-py-gil"
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True) # None or "system" for platform bank; org-xxx for custom
    is_system = Column(Boolean, default=False, index=True)
    question_text = Column(Text, nullable=False)
    category = Column(String, default="technical", index=True) # "technical" | "domain" | "scenario" | "aptitude"
    difficulty = Column(String, default="Medium", index=True) # "Easy" | "Medium" | "Hard"
    explanation = Column(Text, nullable=True)
    skills = Column(JSON, default=list) # e.g. ["python", "concurrency"]
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(String, nullable=True)
    current_version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("OrganizationModel", back_populates="mcq_questions", foreign_keys=[organization_id])
    options = relationship("MCQOptionModel", back_populates="question", cascade="all, delete-orphan", order_by="MCQOptionModel.display_order")
    assessment_associations = relationship("AssessmentMCQModel", back_populates="question", cascade="all, delete-orphan")
    submissions = relationship("MCQSubmissionModel", back_populates="question")


class MCQOptionModel(Base):
    """
    Represents a structured option for an MCQQuestion.
    Authoritative correctness (is_correct) is strictly maintained server-side.
    """
    __tablename__ = "mcq_options"

    id = Column(String, primary_key=True, index=True) # e.g. "opt-4d5e6f"
    question_id = Column(String, ForeignKey("mcq_questions.id"), nullable=False, index=True)
    option_key = Column(String, nullable=False) # "A", "B", "C", "D"
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False, index=True)
    display_order = Column(Integer, default=0)

    question = relationship("MCQQuestionModel", back_populates="options")


class AssessmentMCQModel(Base):
    """
    Association entity supporting Assessment -> N MCQs with ordering, weights, and required flags.
    """
    __tablename__ = "assessment_mcq_questions"
    __table_args__ = (
        UniqueConstraint("assessment_id", "mcq_question_id", name="uq_assessment_mcq_question"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "amcq-9a8b7c"
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=False, index=True)
    mcq_question_id = Column(String, ForeignKey("mcq_questions.id"), nullable=False, index=True)
    display_order = Column(Integer, default=0)
    weight = Column(Float, default=1.0) # Scoring weight/points
    is_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("AssessmentModel", back_populates="mcq_questions")
    question = relationship("MCQQuestionModel", back_populates="assessment_associations")


class MCQSubmissionModel(Base):
    """
    Candidate response for a specific MCQ within an assessment.
    Preserves historical responses and authoritative evaluation outcome.
    """
    __tablename__ = "mcq_submissions"

    id = Column(String, primary_key=True, index=True) # e.g. "msub-1a2b3c"
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False, index=True)
    assessment_id = Column(String, ForeignKey("assessments.id"), nullable=True, index=True)
    mcq_question_id = Column(String, ForeignKey("mcq_questions.id"), nullable=False, index=True)
    selected_option_key = Column(String, nullable=True) # e.g. "B"
    is_correct = Column(Boolean, nullable=False)
    points_earned = Column(Float, default=0.0)
    points_possible = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("CandidateModel", back_populates="mcq_submissions")
    assessment = relationship("AssessmentModel", back_populates="mcq_submissions")
    question = relationship("MCQQuestionModel", back_populates="submissions")


# ─── PHASE 4C: INTERVIEW AVAILABILITY & SCHEDULING MODELS ─────────────────────

class RecruiterAvailabilityModel(Base):
    """
    Recruiter-defined working availability windows for interview scheduling.
    Stored with authoritative tenant boundary and timezone metadata.
    """
    __tablename__ = "recruiter_availability"

    id = Column(String, primary_key=True, index=True) # e.g. "avail-1a2b3c"
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    recruiter_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True) # Optional job restriction
    available_date = Column(String, nullable=False, index=True) # "YYYY-MM-DD"
    start_time = Column(String, nullable=False) # "HH:MM" e.g. "09:00"
    end_time = Column(String, nullable=False) # "HH:MM" e.g. "17:00"
    timezone = Column(String, default="UTC", nullable=False) # e.g. "Asia/Kolkata", "UTC"
    slot_duration_minutes = Column(Integer, default=30, nullable=False) # 15, 30, 45, 60
    buffer_minutes = Column(Integer, default=15, nullable=False) # 0, 15, 30
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("OrganizationModel", back_populates="recruiter_availabilities", foreign_keys=[organization_id])
    recruiter = relationship("UserModel", foreign_keys=[recruiter_id])
    job = relationship("JobModel", foreign_keys=[job_id])
    blocks = relationship("AvailabilityBlockModel", back_populates="availability", cascade="all, delete-orphan")
    bookings = relationship("InterviewBookingModel", back_populates="availability")


class AvailabilityBlockModel(Base):
    """
    Periods within a recruiter's availability window marked unavailable (e.g. lunch, team sync).
    """
    __tablename__ = "availability_blocks"

    id = Column(String, primary_key=True, index=True) # e.g. "block-1a2b3c"
    availability_id = Column(String, ForeignKey("recruiter_availability.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(String, nullable=False) # "HH:MM" e.g. "13:00"
    end_time = Column(String, nullable=False) # "HH:MM" e.g. "14:00"
    reason = Column(String, default="Unavailable / Busy", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    availability = relationship("RecruiterAvailabilityModel", back_populates="blocks")


class InterviewBookingModel(Base):
    """
    Authoritative database record of a booked interview slot.
    Guarantees atomic reservation, multi-tenant boundaries, and conflict prevention.
    """
    __tablename__ = "interview_bookings"
    __table_args__ = (
        Index("ix_interview_bookings_org_slot", "organization_id", "start_time_utc", "status"),
        Index("ix_interview_bookings_cand_status", "candidate_id", "status"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "ibook-1a2b3c"
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    recruiter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    availability_id = Column(String, ForeignKey("recruiter_availability.id", ondelete="SET NULL"), nullable=True, index=True)
    
    start_time_utc = Column(DateTime, nullable=False, index=True) # Authoritative UTC instant
    end_time_utc = Column(DateTime, nullable=False, index=True)   # Authoritative UTC instant
    timezone = Column(String, default="UTC", nullable=False)      # Timezone chosen during booking
    
    status = Column(String, default="scheduled", nullable=False, index=True) # "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled"
    meeting_url = Column(String, nullable=True) # e.g. "/interview/{candidate_id}" or Meet URL
    notes = Column(Text, default="", nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_by = Column(String, nullable=True) # "candidate" | "recruiter" | "system"
    cancelled_at = Column(DateTime, nullable=True)
    
    rescheduled_from_id = Column(String, ForeignKey("interview_bookings.id", ondelete="SET NULL"), nullable=True)
    rescheduled_to_id = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("OrganizationModel", back_populates="interview_bookings", foreign_keys=[organization_id])
    job = relationship("JobModel", back_populates="interview_bookings", foreign_keys=[job_id])
    candidate = relationship("CandidateModel", back_populates="interview_bookings", foreign_keys=[candidate_id])
    recruiter = relationship("UserModel", foreign_keys=[recruiter_id])
    availability = relationship("RecruiterAvailabilityModel", back_populates="bookings", foreign_keys=[availability_id])


# ─── PHASE 4E.1: RELATIONAL SKILL ARCHITECTURE MODELS ─────────────────────────

class SkillModel(Base):
    """
    Canonical Skill Entity.
    Defines unique canonical skills, slugs, categories, and active states.
    Prevents duplicate canonical entries while serving as the authoritative root
    for candidate skills, job requirements, and evidence.
    """
    __tablename__ = "skills"

    id = Column(String, primary_key=True, index=True) # e.g. "skl-python" or "skl-1a2b3c"
    name = Column(String, nullable=False, index=True) # Display Name: e.g. "Python", "Docker"
    slug = Column(String, unique=True, index=True, nullable=False) # Normalized: e.g. "python", "docker"
    category = Column(String, nullable=True, index=True) # e.g. "Programming Languages", "Cloud & DevOps"
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    candidate_skills = relationship("CandidateSkillModel", back_populates="skill", cascade="all, delete-orphan")
    job_requirements = relationship("JobSkillRequirementModel", back_populates="skill", cascade="all, delete-orphan")
    aliases = relationship("SkillAliasModel", back_populates="skill", cascade="all, delete-orphan")


class SkillAliasModel(Base):
    """
    Canonical DB-backed skill aliases and common typos (e.g. 'pyhton' -> Python, 'k8s' -> Kubernetes).
    Eliminates hardcoded in-memory dictionaries and scatter throughout frontend/backend.
    """
    __tablename__ = "skill_aliases"
    __table_args__ = (
        UniqueConstraint("skill_id", "alias", name="uq_skill_alias"),
        Index("ix_skill_aliases_alias", "alias"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "ska-1a2b3c"
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    alias = Column(String, nullable=False) # normalized lowercase alias string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    skill = relationship("SkillModel", back_populates="aliases")


class CandidateSkillModel(Base):
    """
    Relational association between a Candidate (Application) and a Skill.
    Enforces uniqueness so a candidate cannot have duplicate entries for the same skill.
    Stores proficiency level, years experience, verification status, and score.
    """
    __tablename__ = "candidate_skills"
    __table_args__ = (
        UniqueConstraint("candidate_id", "skill_id", name="uq_candidate_skill"),
        Index("ix_candidate_skills_cand_skill", "candidate_id", "skill_id"),
        Index("ix_candidate_skills_verified", "is_verified"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "csk-1a2b3c"
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    proficiency_level = Column(String, default="unspecified", nullable=True) # "unspecified" | "beginner" | "intermediate" | "advanced" | "expert"
    years_experience = Column(Float, default=0.0, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False, index=True)
    verified_score = Column(Float, nullable=True) # 0 to 100
    verification_source = Column(String, nullable=True) # "resume" | "coding_submission" | "mcq_submission" | "interview" | "certification" | "self_reported"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    candidate = relationship("CandidateModel", back_populates="candidate_skills")
    skill = relationship("SkillModel", back_populates="candidate_skills")
    evidence = relationship("SkillEvidenceModel", back_populates="candidate_skill", cascade="all, delete-orphan")


class JobSkillRequirementModel(Base):
    """
    Relational association between a Job opening and required/preferred skills.
    Enforces uniqueness so a job cannot have duplicate requirements for the same skill.
    Supports requirement type (must_have vs preferred), scoring weights, and minimum criteria.
    """
    __tablename__ = "job_skill_requirements"
    __table_args__ = (
        UniqueConstraint("job_id", "skill_id", name="uq_job_skill_requirement"),
        Index("ix_job_skill_requirements_job_skill", "job_id", "skill_id"),
        Index("ix_job_skill_requirements_type", "requirement_type"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "jsr-1a2b3c"
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_type = Column(String, default="must_have", nullable=False, index=True) # "must_have" | "preferred"
    weight = Column(Float, default=1.0, nullable=False) # Scoring weight/multiplier
    min_years = Column(Float, default=0.0, nullable=True)
    min_proficiency = Column(String, default="intermediate", nullable=True) # "beginner" | "intermediate" | "advanced" | "expert"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    job = relationship("JobModel", back_populates="skill_requirements")
    skill = relationship("SkillModel", back_populates="job_requirements")


class SkillEvidenceModel(Base):
    """
    Substantiating evidence linking a candidate skill to legitimate performance records.
    Extensible across resume excerpts, coding problem submissions, MCQ submissions, and interview answers.
    """
    __tablename__ = "skill_evidence"
    __table_args__ = (
        Index("ix_skill_evidence_cand_skill", "candidate_skill_id"),
        Index("ix_skill_evidence_type", "evidence_type"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "skev-1a2b3c"
    candidate_skill_id = Column(String, ForeignKey("candidate_skills.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_type = Column(String, nullable=False, index=True) # "resume" | "coding_submission" | "mcq_submission" | "interview" | "certification" | "assessment"
    reference_id = Column(String, nullable=True, index=True) # ID of submission, question, or booking
    score_contribution = Column(Float, default=0.0, nullable=True)
    snippet = Column(Text, nullable=True) # verbatim excerpt or explanation
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    candidate_skill = relationship("CandidateSkillModel", back_populates="evidence")


class QuestionSkillModel(Base):
    """
    Relational association linking questions (mcq or coding) to canonical SkillModel.
    Supports skill relevancy weighting and category association.
    """
    __tablename__ = "question_skills"
    __table_args__ = (
        UniqueConstraint("question_type", "question_id", "skill_id", name="uq_question_skill"),
        Index("ix_question_skills_skill", "skill_id"),
        Index("ix_question_skills_q", "question_type", "question_id"),
    )

    id = Column(String, primary_key=True, index=True) # e.g. "qsk-1a2b3c"
    question_type = Column(String, nullable=False, index=True) # "mcq" | "coding"
    question_id = Column(String, nullable=False, index=True) # MCQQuestionModel.id or CodingProblemModel.id
    skill_id = Column(String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    relevance_weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    skill = relationship("SkillModel")


# ─── AUTHORITATIVE SUPPORTED LANGUAGES REGISTRY ──────────────────────────────

SUPPORTED_LANGUAGES_REGISTRY = {
    "python": {
        "id": "python",
        "label": "Python 3",
        "monaco_lang": "python",
        "ext": ".py",
        "judge0_id": 71,
        "is_executable": True,
        "engine": "Local Subprocess / Judge0",
        "starter_template": "def solve(data):\n    # Write your solution here\n    pass\n"
    },
    "javascript": {
        "id": "javascript",
        "label": "JavaScript (Node.js)",
        "monaco_lang": "javascript",
        "ext": ".js",
        "judge0_id": 63,
        "is_executable": True,
        "engine": "Node.js Sandbox / Judge0",
        "starter_template": "function solve(data) {\n  // Write your solution here\n  return data;\n}\nmodule.exports = { solve };\n"
    },
    "typescript": {
        "id": "typescript",
        "label": "TypeScript",
        "monaco_lang": "typescript",
        "ext": ".ts",
        "judge0_id": 74,
        "is_executable": True,
        "engine": "Node.js Sandbox / Judge0",
        "starter_template": "export function solve(data: any): any {\n  // Write your solution here\n  return data;\n}\n"
    },
    "sql": {
        "id": "sql",
        "label": "SQL (Relational Engine)",
        "monaco_lang": "sql",
        "ext": ".sql",
        "judge0_id": 82,
        "is_executable": True,
        "engine": "In-Memory Relational Engine",
        "starter_template": "-- Write your SQL query here\nSELECT * FROM employees;\n"
    },
    "java": {
        "id": "java",
        "label": "Java (OpenJDK 17)",
        "monaco_lang": "java",
        "ext": ".java",
        "judge0_id": 62,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "public class Solution {\n    public static int solve(int a, int b) {\n        // Write your solution here\n        return 0;\n    }\n}\n"
    },
    "cpp": {
        "id": "cpp",
        "label": "C++ (GCC)",
        "monaco_lang": "cpp",
        "ext": ".cpp",
        "judge0_id": 54,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "#include <iostream>\n\nint solve(int a, int b) {\n    // Write your solution here\n    return 0;\n}\n"
    },
    "go": {
        "id": "go",
        "label": "Go (Golang)",
        "monaco_lang": "go",
        "ext": ".go",
        "judge0_id": 60,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "package main\n\nfunc solve(a int, b int) int {\n    // Write your solution here\n    return 0\n}\n"
    },
    "rust": {
        "id": "rust",
        "label": "Rust",
        "monaco_lang": "rust",
        "ext": ".rs",
        "judge0_id": 73,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "pub fn solve(a: i32, b: i32) -> i32 {\n    // Write your solution here\n    0\n}\n"
    },
    "c": {
        "id": "c",
        "label": "C (GCC)",
        "monaco_lang": "c",
        "ext": ".c",
        "judge0_id": 50,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "#include <stdio.h>\n\nint solve(int a, int b) {\n    // Write your solution here\n    return 0;\n}\n"
    },
    "csharp": {
        "id": "csharp",
        "label": "C# (.NET)",
        "monaco_lang": "csharp",
        "ext": ".cs",
        "judge0_id": 51,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "public class Solution {\n    public static int Solve(int a, int b) {\n        // Write your solution here\n        return 0;\n    }\n}\n"
    },
    "ruby": {
        "id": "ruby",
        "label": "Ruby",
        "monaco_lang": "ruby",
        "ext": ".rb",
        "judge0_id": 72,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "def solve(a, b)\n    # Write your solution here\n    0\nend\n"
    },
    "php": {
        "id": "php",
        "label": "PHP",
        "monaco_lang": "php",
        "ext": ".php",
        "judge0_id": 68,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "<?php\nfunction solve($a, $b) {\n    // Write your solution here\n    return 0;\n}\n"
    },
    "kotlin": {
        "id": "kotlin",
        "label": "Kotlin",
        "monaco_lang": "kotlin",
        "ext": ".kt",
        "judge0_id": 78,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "fun solve(a: Int, b: Int): Int {\n    // Write your solution here\n    return 0\n}\n"
    },
    "swift": {
        "id": "swift",
        "label": "Swift",
        "monaco_lang": "swift",
        "ext": ".swift",
        "judge0_id": 83,
        "is_executable": True,
        "engine": "Judge0 Remote Engine",
        "starter_template": "func solve(a: Int, b: Int) -> Int {\n    // Write your solution here\n    return 0\n}\n"
    }
}


# ─── TENANT ISOLATION & SECURITY HELPERS ──────────────────────────────────────

def can_access_problem(org_id: Optional[str], problem: CodingProblemModel) -> bool:
    """
    Check if organization can view/access a coding problem.
    System/platform problems are globally accessible; custom problems are isolated to tenant.
    """
    if not problem:
        return False
    if problem.is_system or not problem.organization_id or problem.organization_id == "system":
        return True
    return bool(org_id and problem.organization_id == org_id)


def can_modify_problem(org_id: Optional[str], problem: CodingProblemModel) -> bool:
    """
    Check if organization can edit or delete a coding problem.
    System problems can never be modified by recruiters; custom problems require exact tenant match.
    """
    if not problem:
        return False
    if problem.is_system or problem.organization_id in (None, "", "system"):
        return False
    return bool(org_id and problem.organization_id == org_id)


# ─── CONFIDENTIALITY & SANITIZATION SERIALIZERS ──────────────────────────────

def sanitize_test_case_for_candidate(tc: CodingTestCaseModel) -> Dict[str, Any]:
    """
    Serializes a test case for candidate consumption.
    Strictly filters expected_output, input_data, and explanation if is_hidden is True.
    """
    if tc.is_hidden:
        return {
            "id": tc.id,
            "problem_id": tc.problem_id,
            "is_hidden": True,
            "display_order": tc.display_order,
            "weight": tc.weight
        }
    return {
        "id": tc.id,
        "problem_id": tc.problem_id,
        "is_hidden": False,
        "input_data": tc.input_data,
        "expected_output": tc.expected_output,
        "explanation": tc.explanation,
        "display_order": tc.display_order,
        "weight": tc.weight
    }


def sanitize_test_case_result_for_candidate(tcr: SubmissionTestCaseResultModel) -> Dict[str, Any]:
    """
    Serializes a test case execution result for candidate consumption.
    Strictly masks actual_output and error details for hidden test cases.
    """
    if tcr.is_hidden:
        return {
            "id": tcr.id,
            "submission_id": tcr.submission_id,
            "test_case_id": tcr.test_case_id,
            "passed": tcr.passed,
            "is_hidden": True,
            "execution_time_ms": tcr.execution_time_ms
        }
    return {
        "id": tcr.id,
        "submission_id": tcr.submission_id,
        "test_case_id": tcr.test_case_id,
        "passed": tcr.passed,
        "actual_output": tcr.actual_output,
        "execution_time_ms": tcr.execution_time_ms,
        "error_message": tcr.error_message,
        "is_hidden": False
    }


def can_access_mcq(org_id: Optional[str], question: MCQQuestionModel) -> bool:
    """
    Check if organization can view/access an MCQ question.
    System questions are globally readable; custom questions are isolated to tenant.
    """
    if not question:
        return False
    if question.is_system or not question.organization_id or question.organization_id in ("system", "org-sparkx-default"):
        return True
    return bool(org_id and question.organization_id == org_id)


def can_modify_mcq(org_id: Optional[str], question: MCQQuestionModel) -> bool:
    """
    Check if organization can edit or delete an MCQ question.
    System questions cannot be modified by recruiters; custom questions require exact tenant match.
    """
    if not question:
        return False
    if question.is_system or question.organization_id in (None, "", "system"):
        return False
    return bool(org_id and question.organization_id == org_id)


def sanitize_mcq_for_candidate(q: MCQQuestionModel) -> Dict[str, Any]:
    """
    Serializes an MCQ question for candidate consumption.
    Strictly filters out is_correct, correct_option, and explanation to prevent answer leakage.
    """
    sorted_options = sorted(q.options, key=lambda opt: opt.display_order) if q.options else []
    options_dict = {opt.option_key: opt.option_text for opt in sorted_options}
    return {
        "id": q.id,
        "question": q.question_text,
        "difficulty": q.difficulty,
        "category": q.category,
        "skills": q.skills or [],
        "options": options_dict
    }


