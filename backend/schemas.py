from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

class JobCreate(BaseModel):
    title: str
    company_name: Optional[str] = "SparkX Technologies"
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
    coding_difficulty: Optional[str] = "Mid-Level"
    assessment_pool: Optional[Dict[str, Any]] = None

class JobResponse(JobCreate):
    id: str
    status: str
    applicants_count: Optional[int] = 0

    class Config:
        from_attributes = True

class CandidateApply(BaseModel):
    job_id: str
    company_name: Optional[str] = "SparkX Technologies"
    name: str
    email: str
    phone: Optional[str] = None
    experience_years: float
    education: str
    skills: List[str]
    resume_summary: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_text: Optional[str] = None
    fraud_flags: Optional[List[str]] = []

class CandidateStatusUpdate(BaseModel):
    status: str # Shortlisted | Rejected | Under Review | Evaluated | Interview | Selected
    hr_notes: Optional[str] = ""

class CandidateResponse(BaseModel):
    id: str
    job_id: str
    company_name: Optional[str] = "SparkX Technologies"
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
    resume_filename: Optional[str] = None
    resume_text: Optional[str] = None
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
    interview_scheduled_at: Optional[str] = None
    interview_meeting_url: Optional[str] = None
    interview_status: Optional[str] = "Applied"
    email_logs: Optional[List[Dict[str, Any]]] = []
    assessment_data: Optional[Dict[str, Any]] = None
    coding_language: Optional[str] = None
    coding_score: Optional[int] = 0
    coding_submission: Optional[str] = None
    coding_results: Optional[Dict[str, Any]] = None

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
    score: Optional[int] = None
    engine: Optional[str] = "live_llm"

class AIConfigRequest(BaseModel):
    provider: str = "gemini"
    api_key: str

class AIStatusResponse(BaseModel):
    active: bool
    provider: str
    model: str
    has_key: bool
    mode: str

class CandidateQuestionsRequest(BaseModel):
    job_id: str
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"
    candidate_skills: Optional[List[str]] = []
    experience_years: Optional[float] = 2.0

class CandidateQuestionsResponse(BaseModel):
    candidate_name: str
    role_title: str
    questions: List[Dict[str, Any]]

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

# ─── Scheduling & Email Schemas ───────────────────────────────────────────────
class CandidateScheduleRequest(BaseModel):
    scheduled_at: str  # ISO string or formatted "2026-09-20 14:00"
    notes: Optional[str] = ""
    meeting_url: Optional[str] = None

class EmailSendRequest(BaseModel):
    template_type: str  # "interview_invitation" | "interview_reminder" | "offer_letter" | "rejection_notice"
    custom_message: Optional[str] = ""

# ─── Auth & Profile Schemas ───────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "candidate"  # "recruiter" or "candidate"
    admin_code: Optional[str] = None  # Required if role == "recruiter"
    
    # Optional Candidate Profile Fields
    phone: Optional[str] = None
    job_role: Optional[str] = None
    experience_years: Optional[float] = 0.0
    skills: Optional[List[str]] = []
    education: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_summary: Optional[str] = None
    resume_text: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    job_role: Optional[str] = None
    experience_years: Optional[float] = None
    skills: Optional[List[str]] = None
    education: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_summary: Optional[str] = None
    resume_text: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    token: str
    phone: Optional[str] = None
    job_role: Optional[str] = None
    experience_years: Optional[float] = 0.0
    skills: Optional[List[str]] = []
    education: Optional[str] = None
    resume_filename: Optional[str] = None
    resume_summary: Optional[str] = None
    resume_text: Optional[str] = None

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    reset_code: str
    new_password: str

class CandidateApplicationItem(BaseModel):
    id: str
    job_id: str
    job_title: str
    company_name: str
    department: str
    location: str
    applied_date: str
    status: str
    final_decision: str
    match_score: int
    experience_years: float
    skills: List[str]
    resume_filename: Optional[str] = None
    resume_summary: Optional[str] = None
    interview_scheduled_at: Optional[str] = None
    interview_meeting_url: Optional[str] = None
    interview_status: Optional[str] = "Applied"

# ─── 4-Category Technical Assessment Schemas ─────────────────────────────────
class CodeRunRequest(BaseModel):
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    task_id: str
    category: str = "hands_on"  # "hands_on" | "troubleshooting"
    language: str = "javascript" # "python" | "javascript" | "java" | "cpp" | "typescript"
    code: str

class CodeRunResponse(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    test_results: List[Dict[str, Any]]
    console_output: str
    execution_ms: float

class AssessmentSubmitRequest(BaseModel):
    candidate_id: str
    job_id: str
    technical_answers: Dict[str, str] = {} # question_id -> chosen option (e.g. 'A')
    scenario_answers: Dict[str, str] = {}  # question_id -> written solution text
    hands_on_submission: Optional[Dict[str, Any]] = None # task_id, language, code, test_results
    troubleshooting_submission: Optional[Dict[str, Any]] = None # task_id, language, code, test_results

class AssessmentSubmitResponse(BaseModel):
    success: bool
    candidate_id: str
    scores: Dict[str, Any]
    status: str
    final_decision: str
    feedback_summary: str

