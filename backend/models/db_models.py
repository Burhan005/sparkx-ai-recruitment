"""
(M) Models Package - Database Models & Data Schemas
"""
from database import Base
from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    company_name = Column(String, default="SparkX Technologies")
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
    
    # Authoritative Employer Compensation Specification (Production-Safe Numeric)
    ctc_type = Column(String, default="range", nullable=True) # "fixed" | "range" | "starting_from"
    ctc_min = Column(Numeric(10, 2), nullable=True)
    ctc_max = Column(Numeric(10, 2), nullable=True)
    ctc_currency = Column(String, default="INR", nullable=True)
    ctc_period = Column(String, default="annual", nullable=True) # "annual" | "monthly"
    variable_pay_min = Column(Numeric(10, 2), nullable=True)
    variable_pay_max = Column(Numeric(10, 2), nullable=True)

    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    candidates = relationship("CandidateModel", back_populates="job", cascade="all, delete-orphan")


class CandidateModel(Base):
    __tablename__ = "candidates"
    __table_args__ = (
        UniqueConstraint("job_id", "email", name="uq_candidate_job_email"),
    )

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    company_name = Column(String, default="SparkX Technologies")
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
    skill_gaps = Column(JSON, default=dict)

    # Human Decisions & Recruiter Evaluation
    hr_notes = Column(Text, default="")
    final_decision = Column(String, default="Under Review")
    recruiter_score = Column(Integer, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    rejection_category = Column(String, nullable=True)
    
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

    # Concurrency control
    version = Column(Integer, default=1, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobModel", back_populates="candidates")
    user = relationship("UserModel", back_populates="applications", foreign_keys=[user_id])
    state_logs = relationship("CandidateStateLogModel", back_populates="candidate", cascade="all, delete-orphan")

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
