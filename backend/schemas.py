from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional, Dict, Any

VALID_CTC_TYPES = {"fixed", "range", "starting_from"}
VALID_CANDIDATE_CTC_TYPES = {"fixed", "range"}
VALID_CURRENCIES = {"INR", "USD", "EUR", "GBP"}
VALID_PERIODS = {"annual", "monthly"}

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
    assessment_version: Optional[int] = 1
    competency_blueprint: Optional[Dict[str, Any]] = None

    # Authoritative Employer Compensation Specification
    ctc_type: Optional[str] = "range" # "fixed" | "range" | "starting_from"
    ctc_min: Optional[float] = None
    ctc_max: Optional[float] = None
    ctc_currency: Optional[str] = "INR"
    ctc_period: Optional[str] = "annual"
    variable_pay_min: Optional[float] = None
    variable_pay_max: Optional[float] = None

    @model_validator(mode="after")
    def validate_job_compensation(self):
        if self.ctc_currency:
            self.ctc_currency = self.ctc_currency.upper().strip()
            if self.ctc_currency not in VALID_CURRENCIES:
                raise ValueError(f"Invalid currency '{self.ctc_currency}'. Supported currencies: {', '.join(sorted(VALID_CURRENCIES))}")

        if self.ctc_period:
            self.ctc_period = self.ctc_period.lower().strip()
            if self.ctc_period not in VALID_PERIODS:
                raise ValueError(f"Invalid ctc_period '{self.ctc_period}'. Supported periods: annual, monthly")

        if self.ctc_type:
            self.ctc_type = self.ctc_type.lower().strip()
            if self.ctc_type not in VALID_CTC_TYPES:
                raise ValueError(f"Invalid ctc_type '{self.ctc_type}'. Supported types: fixed, range, starting_from")

        # Bounds validation
        if self.ctc_min is not None and self.ctc_min < 0:
            raise ValueError("ctc_min cannot be negative")
        if self.ctc_max is not None and self.ctc_max < 0:
            raise ValueError("ctc_max cannot be negative")

        if self.ctc_type == "fixed":
            if self.ctc_min is not None and self.ctc_max is None:
                self.ctc_max = self.ctc_min
            elif self.ctc_max is not None and self.ctc_min is None:
                self.ctc_min = self.ctc_max
            elif self.ctc_min is not None and self.ctc_max is not None:
                if self.ctc_min != self.ctc_max:
                    raise ValueError(f"For fixed CTC, ctc_min ({self.ctc_min}) and ctc_max ({self.ctc_max}) must be identical")
        elif self.ctc_type == "range":
            if self.ctc_min is not None and self.ctc_max is not None:
                if self.ctc_min > self.ctc_max:
                    raise ValueError(f"ctc_min ({self.ctc_min}) cannot be greater than ctc_max ({self.ctc_max})")

        # Variable pay validation
        if self.variable_pay_min is not None and self.variable_pay_min < 0:
            raise ValueError("variable_pay_min cannot be negative")
        if self.variable_pay_max is not None and self.variable_pay_max < 0:
            raise ValueError("variable_pay_max cannot be negative")
        if self.variable_pay_min is not None and self.variable_pay_max is not None:
            if self.variable_pay_min > self.variable_pay_max:
                raise ValueError("variable_pay_min cannot be greater than variable_pay_max")

        return self

class JobUpdate(BaseModel):
    title: Optional[str] = None
    company_name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    min_experience_years: Optional[int] = None
    education: Optional[str] = None
    languages: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    optional_criteria: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[Dict[str, Any]]] = None
    coding_assessment: Optional[Dict[str, Any]] = None
    coding_difficulty: Optional[str] = None
    assessment_pool: Optional[Dict[str, Any]] = None
    assessment_version: Optional[int] = None
    competency_blueprint: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

    # Compensation updates
    ctc_type: Optional[str] = None
    ctc_min: Optional[float] = None
    ctc_max: Optional[float] = None
    ctc_currency: Optional[str] = None
    ctc_period: Optional[str] = None
    variable_pay_min: Optional[float] = None
    variable_pay_max: Optional[float] = None

    @model_validator(mode="after")
    def validate_job_update_compensation(self):
        if self.ctc_currency:
            self.ctc_currency = self.ctc_currency.upper().strip()
            if self.ctc_currency not in VALID_CURRENCIES:
                raise ValueError(f"Invalid currency '{self.ctc_currency}'. Supported currencies: {', '.join(sorted(VALID_CURRENCIES))}")

        if self.ctc_period:
            self.ctc_period = self.ctc_period.lower().strip()
            if self.ctc_period not in VALID_PERIODS:
                raise ValueError(f"Invalid ctc_period '{self.ctc_period}'. Supported periods: annual, monthly")

        if self.ctc_type:
            self.ctc_type = self.ctc_type.lower().strip()
            if self.ctc_type not in VALID_CTC_TYPES:
                raise ValueError(f"Invalid ctc_type '{self.ctc_type}'. Supported types: fixed, range, starting_from")

        if self.ctc_min is not None and self.ctc_min < 0:
            raise ValueError("ctc_min cannot be negative")
        if self.ctc_max is not None and self.ctc_max < 0:
            raise ValueError("ctc_max cannot be negative")

        if self.ctc_type == "fixed":
            if self.ctc_min is not None and self.ctc_max is None:
                self.ctc_max = self.ctc_min
            elif self.ctc_max is not None and self.ctc_min is None:
                self.ctc_min = self.ctc_max
            elif self.ctc_min is not None and self.ctc_max is not None and self.ctc_min != self.ctc_max:
                raise ValueError(f"For fixed CTC, ctc_min ({self.ctc_min}) and ctc_max ({self.ctc_max}) must be identical")
        elif self.ctc_type == "range":
            if self.ctc_min is not None and self.ctc_max is not None and self.ctc_min > self.ctc_max:
                raise ValueError(f"ctc_min ({self.ctc_min}) cannot be greater than ctc_max ({self.ctc_max})")

        return self

class JobResponse(JobCreate):
    id: str
    status: str
    applicants_count: Optional[int] = 0
    formatted_compensation: Optional[str] = "Compensation not specified"

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

    # Authoritative Candidate Application Compensation Expectations
    current_ctc: Optional[float] = None
    expected_ctc_type: Optional[str] = "range" # "fixed" | "range"
    expected_ctc_min: Optional[float] = None
    expected_ctc_max: Optional[float] = None
    ctc_currency: Optional[str] = "INR"

    @model_validator(mode="after")
    def validate_candidate_compensation(self):
        if self.ctc_currency:
            self.ctc_currency = self.ctc_currency.upper().strip()
            if self.ctc_currency not in VALID_CURRENCIES:
                raise ValueError(f"Invalid currency '{self.ctc_currency}'. Supported currencies: {', '.join(sorted(VALID_CURRENCIES))}")

        if self.expected_ctc_type:
            self.expected_ctc_type = self.expected_ctc_type.lower().strip()
            if self.expected_ctc_type not in VALID_CANDIDATE_CTC_TYPES:
                raise ValueError(f"Invalid expected_ctc_type '{self.expected_ctc_type}'. Supported: fixed, range")

        if self.current_ctc is not None and self.current_ctc < 0:
            raise ValueError("current_ctc cannot be negative")
        if self.expected_ctc_min is not None and self.expected_ctc_min < 0:
            raise ValueError("expected_ctc_min cannot be negative")
        if self.expected_ctc_max is not None and self.expected_ctc_max < 0:
            raise ValueError("expected_ctc_max cannot be negative")

        if self.expected_ctc_type == "fixed":
            if self.expected_ctc_min is not None and self.expected_ctc_max is None:
                self.expected_ctc_max = self.expected_ctc_min
            elif self.expected_ctc_max is not None and self.expected_ctc_min is None:
                self.expected_ctc_min = self.expected_ctc_max
            elif self.expected_ctc_min is not None and self.expected_ctc_max is not None and self.expected_ctc_min != self.expected_ctc_max:
                raise ValueError(f"For exact/fixed expected CTC, min and max must be identical")
        elif self.expected_ctc_type == "range":
            if self.expected_ctc_min is not None and self.expected_ctc_max is not None and self.expected_ctc_min > self.expected_ctc_max:
                raise ValueError(f"expected_ctc_min ({self.expected_ctc_min}) cannot be greater than expected_ctc_max ({self.expected_ctc_max})")

        return self

class CandidateStatusUpdate(BaseModel):
    status: str # Legacy string adapter
    hr_notes: Optional[str] = ""
    recruiter_score: Optional[int] = None
    rejection_reason: Optional[str] = None
    rejection_category: Optional[str] = None

class CandidateStageUpdate(BaseModel):
    stage: str # applied | screening | assessment | interview | review | completed
    notes: Optional[str] = ""

class HiringDecisionUpdate(BaseModel):
    decision: str # undecided | shortlisted | selected | rejected
    recruiter_score: Optional[int] = None
    rejection_reason: Optional[str] = None
    rejection_category: Optional[str] = None
    hr_notes: Optional[str] = ""

class AssessmentInviteRequest(BaseModel):
    custom_message: Optional[str] = ""

class CandidateResponse(BaseModel):
    id: str
    job_id: str
    job_title: Optional[str] = "Applied Position"
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
    recruiter_score: Optional[int] = None
    rejection_reason: Optional[str] = None
    rejection_category: Optional[str] = None
    interview_scheduled_at: Optional[str] = None
    interview_meeting_url: Optional[str] = None
    interview_status: Optional[str] = "not_scheduled"
    email_logs: Optional[List[Dict[str, Any]]] = []
    assessment_data: Optional[Dict[str, Any]] = None
    coding_language: Optional[str] = None
    coding_score: Optional[int] = 0
    coding_submission: Optional[str] = None
    coding_results: Optional[Dict[str, Any]] = None
    match_details: Optional[Dict[str, Any]] = None

    # Authoritative Candidate Application Compensation Expectations
    current_ctc: Optional[float] = None
    expected_ctc_type: Optional[str] = "range"
    expected_ctc_min: Optional[float] = None
    expected_ctc_max: Optional[float] = None
    ctc_currency: Optional[str] = "INR"
    compensation_analysis: Optional[Dict[str, Any]] = None

    # Authoritative 4-Dimensional State Fields
    stage: Optional[str] = "applied"
    assessment_status: Optional[str] = "not_invited"
    assessment_invited_at: Optional[Any] = None
    assessment_started_at: Optional[Any] = None
    assessment_submitted_at: Optional[Any] = None
    assessment_evaluated_at: Optional[Any] = None
    interview_started_at: Optional[Any] = None
    interview_completed_at: Optional[Any] = None
    hiring_decision: Optional[str] = "undecided"
    stage_updated_at: Optional[Any] = None
    decision_updated_at: Optional[Any] = None

    # Expected Update Date & Timeline Telemetry
    expected_update_date: Optional[str] = None
    update_notes: Optional[str] = None
    update_status: Optional[str] = "not_set"
    update_sent_at: Optional[Any] = None
    reminder_sent_flags: Optional[Dict[str, Any]] = None

    # Assessment Versioning
    assessment_version: Optional[int] = 1
    assessment_blueprint: Optional[Dict[str, Any]] = None

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
    code_score: Optional[int] = 0

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
    name: Optional[str] = "Applicant"
    email: Optional[str] = None
    job_id: str
    job_title: str
    company_name: str
    department: str
    location: str
    applied_date: str
    status: str
    final_decision: str
    match_score: Optional[int] = None
    experience_years: float
    skills: List[str]
    resume_filename: Optional[str] = None
    resume_summary: Optional[str] = None
    interview_scheduled_at: Optional[str] = None
    interview_meeting_url: Optional[str] = None
    scores: Optional[Dict[str, Any]] = None
    skill_gaps: Optional[Dict[str, Any]] = None
    stage: Optional[str] = "screening"
    assessment_status: Optional[str] = "none"
    interview_status: Optional[str] = "none"
    hiring_decision: Optional[str] = "undecided"
    assessment_invited_at: Optional[str] = None
    assessment_started_at: Optional[str] = None
    assessment_submitted_at: Optional[str] = None
    assessment_evaluated_at: Optional[str] = None
    interview_started_at: Optional[str] = None
    interview_completed_at: Optional[str] = None
    stage_updated_at: Optional[str] = None
    decision_updated_at: Optional[str] = None
    coding_score: Optional[int] = None
    recruiter_score: Optional[int] = None
    rejection_reason: Optional[str] = None
    rejection_category: Optional[str] = None
    hr_notes: Optional[str] = ""
    match_details: Optional[Dict[str, Any]] = None
    # Authoritative Candidate Application Compensation Expectations
    current_ctc: Optional[float] = None
    expected_ctc_type: Optional[str] = "range"
    expected_ctc_min: Optional[float] = None
    expected_ctc_max: Optional[float] = None
    ctc_currency: Optional[str] = "INR"
    job_budget_formatted: Optional[str] = None
    candidate_expectation_formatted: Optional[str] = None
    expected_update_date: Optional[str] = None
    update_notes: Optional[str] = None
    update_status: Optional[str] = "not_set"
    update_sent_at: Optional[str] = None

class ExpectedUpdateDateRequest(BaseModel):
    expected_update_date: str # "YYYY-MM-DD"
    update_notes: Optional[str] = ""
    notify_candidate: Optional[bool] = True

class CandidateUpdateNotificationRequest(BaseModel):
    message: str
    timeline_status: Optional[str] = "update_sent"

class StudioAssessmentGenerateRequest(BaseModel):
    job_id: str
    mcq_count: Optional[int] = 5
    interview_q_count: Optional[int] = 3
    include_hands_on: Optional[bool] = None
    difficulty: Optional[str] = None

class SupportedLanguageItem(BaseModel):
    id: str
    label: str
    version: str
    monaco_lang: str
    executable: bool
    engine: str
    ext: str
    starter_code: Optional[str] = None

class InterviewStartRequest(BaseModel):
    candidate_id: str


# ─── Resume-to-Job Matching Schemas ──────────────────────────────────────────
class JobMatchRequest(BaseModel):
    candidate_id: Optional[str] = None
    name: Optional[str] = "Candidate"
    skills: Optional[List[str]] = []
    experience_years: Optional[float] = 0.0
    job_role: Optional[str] = ""
    resume_summary: Optional[str] = ""
    resume_text: Optional[str] = ""
    education: Optional[str] = ""

class JobMatchResponse(BaseModel):
    job_id: str
    job_title: str
    match_score: int
    category_scores: Dict[str, Any] = {}
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    experience_relevance: str = ""
    role_alignment: str = ""
    explanation: str = ""

class BatchJobMatchRequest(BaseModel):
    candidate_id: Optional[str] = None
    name: Optional[str] = "Candidate"
    skills: Optional[List[str]] = []
    experience_years: Optional[float] = 0.0
    job_role: Optional[str] = ""
    resume_summary: Optional[str] = ""
    resume_text: Optional[str] = ""
    education: Optional[str] = ""
    candidate: Optional[Dict[str, Any]] = None

class BatchJobMatchResponse(BaseModel):
    matches: Dict[str, JobMatchResponse]



# ─── 4-Category Technical Assessment Schemas ─────────────────────────────────
class CodeRunRequest(BaseModel):
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    task_id: str
    category: str = "hands_on"  # "hands_on" | "troubleshooting"
    language: str = "javascript" # "python" | "javascript" | "java" | "cpp" | "typescript"
    code: str
    test_cases: Optional[List[Dict[str, Any]]] = None
    custom_input: Optional[str] = None
    is_custom_test: Optional[bool] = False

class CodeRunResponse(BaseModel):
    all_passed: bool
    passed_count: int
    total_count: int
    test_results: List[Dict[str, Any]]
    console_output: str
    execution_ms: float
    memory_mb: Optional[float] = 28.5
    compilation_error: Optional[str] = None
    runtime_error: Optional[str] = None

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
    status: str
    final_decision: str
    scores: Optional[Dict[str, Any]] = None
    feedback_summary: Optional[str] = None
    message: Optional[str] = "Assessment submitted successfully."

class CopilotQueryRequest(BaseModel):
    query: str
    candidate_id: Optional[str] = None
    job_id: Optional[str] = None
    user_role: Optional[str] = "recruiter" # "candidate" | "recruiter"
    user_email: Optional[str] = None
    user_name: Optional[str] = None

class CopilotQueryResponse(BaseModel):
    text: str
    database_facts: Optional[List[str]] = []
    metrics: Optional[List[str]] = []
    ai_interpretation: Optional[str] = ""
    uncertainty: Optional[str] = ""
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None


