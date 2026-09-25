from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
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
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    candidates = relationship("CandidateModel", back_populates="job", cascade="all, delete-orphan")


class CandidateModel(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    applied_date = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    status = Column(String, default="Screening") # Screening | Interviewing | Evaluated | Shortlisted | Rejected
    match_score = Column(Integer, default=0)
    experience_years = Column(Float, default=0.0)
    education = Column(String, nullable=False)
    skills = Column(JSON, default=list)
    resume_summary = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True)
    fraud_flags = Column(JSON, default=list)
    
    # Telemetry & Integrity
    integrity_score = Column(Integer, default=100)
    integrity_risk = Column(String, default="Low") # Low | Medium | High
    integrity_events = Column(JSON, default=list)

    # Evaluation & Scorecard
    scores = Column(JSON, default=dict) # { jobSkills, technicalScore, communication, problemSolving, overall }
    interview_summary = Column(Text, nullable=True)
    evidence_snippets = Column(JSON, default=list)
    skill_gaps = Column(JSON, default=dict) # { strongSkills, missingSkills, recommendations, readiness }

    # Human-in-the-Loop Decisions (Slide 14 & 17)
    hr_notes = Column(Text, default="")
    final_decision = Column(String, default="Pending Interview")
    
    # Real-time Scheduling & Email Telemetry
    interview_scheduled_at = Column(String, nullable=True)
    interview_meeting_url = Column(String, nullable=True)
    interview_status = Column(String, default="Applied")
    email_logs = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("JobModel", back_populates="candidates")


class IntegrityLogModel(Base):
    __tablename__ = "integrity_logs"

    id = Column(String, primary_key=True, index=True)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    timestamp = Column(String, nullable=False)
    event_type = Column(String, nullable=False) # TAB_SWITCH | MULTIPLE_FACES | FACE_LOST | etc.
    description = Column(Text, nullable=False)
    severity = Column(String, default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
