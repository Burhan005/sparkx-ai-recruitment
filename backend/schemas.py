from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

class JobCreate(BaseModel):
    title: str
    department: str
    location: str = "Remote"
    min_experience_years: int = 2
    education: str
    languages: List[str] = ["English"]
    required_skills: List[str]
    optional_criteria: Optional[str] = None
    description: str
    questions: Optional[List[Dict[str, Any]]] = None
    coding_assessment: Optional[Dict[str, Any]] = None

class JobResponse(JobCreate):
    id: str
    status: str
    applicants_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CandidateApply(BaseModel):
    job_id: str
    name: str
    email: str
    phone: Optional[str] = None
    experience_years: float
    education: str
    skills: List[str]
    resume_summary: Optional[str] = None
    fraud_flags: Optional[List[str]] = []

class CandidateStatusUpdate(BaseModel):
    status: str # Shortlisted | Rejected | Under Review | Evaluated
    hr_notes: Optional[str] = ""

class CandidateResponse(BaseModel):
    id: str
    job_id: str
    name: str
    email: str
    phone: Optional[str]
    applied_date: str
    status: str
    match_score: int
    experience_years: float
    education: str
    skills: List[str]
    resume_summary: Optional[str]
    fraud_flags: List[str]
    integrity_score: int
    integrity_risk: str
    integrity_events: List[Dict[str, Any]]
    scores: Dict[str, Any]
    interview_summary: Optional[str]
    evidence_snippets: List[Dict[str, Any]]
    skill_gaps: Optional[Dict[str, Any]]
    hr_notes: Optional[str]
    final_decision: Optional[str]

    class Config:
        from_attributes = True

class AdaptiveQuestionRequest(BaseModel):
    question_prompt: str
    candidate_answer: str
    ideal_keywords: Optional[List[str]] = []
    follow_up_vague: Optional[str] = None
    follow_up_expert: Optional[str] = None

class AdaptiveQuestionResponse(BaseModel):
    needs_follow_up: bool
    follow_up_question: Optional[str] = None
    quality: str
    feedback: str

class TelemetryEventCreate(BaseModel):
    candidate_id: str
    timestamp: str
    event_type: str
    description: str
    severity: str = "medium"

class EvaluationRequest(BaseModel):
    candidate_id: str
    job_id: str
    transcript: List[Dict[str, Any]]
    integrity_score: int
    integrity_events: List[Dict[str, Any]]
    code_score: int = 90

# ─── Auth Schemas ─────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "candidate"  # "recruiter" or "candidate"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    token: str

    class Config:
        from_attributes = True

