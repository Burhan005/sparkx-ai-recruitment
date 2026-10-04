from pydantic import BaseModel, EmailStr, model_validator
from typing import List, Optional, Dict, Any

VALID_CTC_TYPES = {"fixed", "range", "starting_from"}
VALID_CANDIDATE_CTC_TYPES = {"fixed", "range"}
VALID_CURRENCIES = {"INR", "USD", "EUR", "GBP"}
VALID_PERIODS = {"annual", "monthly"}

class JobCreate(BaseModel):
    title: str
    company_name: Optional[str] = "SparkX Technologies"
    organization_id: Optional[str] = "org-sparkx-default"
    department: str
    location: str = "Remote"
    min_experience_years: int = 2
    education: Optional[str] = "Bachelor's Degree or Equivalent"
    languages: List[str] = ["English"]
    required_skills: Optional[List[str]] = []
    optional_criteria: Optional[str] = None
    description: Optional[str] = ""
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
    status: Optional[str] = None # "Active" | "Paused" | "Closed"
    closure_reason: Optional[str] = None

class JobStatusUpdate(BaseModel):
    status: str # "Active" | "Paused" | "Closed"
    closure_reason: Optional[str] = None

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

class CandidateReopenRequest(BaseModel):
    reason: str

class AssessmentInviteRequest(BaseModel):
    custom_message: Optional[str] = ""

class CandidateResponse(BaseModel):
    id: str
    job_id: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    organization_id: Optional[str] = "org-sparkx-default"
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

    # Controlled Reopening Telemetry
    reopened_at: Optional[Any] = None
    reopened_by: Optional[str] = None
    reopen_reason: Optional[str] = None
    previous_final_decision: Optional[str] = None

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
    organization_id: Optional[str] = "org-sparkx-default"
    
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
    organization_id: Optional[str] = "org-sparkx-default"
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
    execution_mode: Optional[str] = "function" # "function" | "stdin"
    entry_point: Optional[str] = None
    function_signature: Optional[Dict[str, Any]] = None
    schema_ddl: Optional[str] = None

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
    coding_submissions: Optional[List[Dict[str, Any]]] = None # Multi-problem submissions: [{problem_id, language, code, ...}]

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

class ExternalPlatformQuestion(BaseModel):
    id: str
    platform: str
    title: str
    difficulty: str
    type: Optional[str] = "coding"
    url: Optional[str] = None

class ExternalAssessmentCreate(BaseModel):
    platform: str
    candidate_id: str
    job_id: Optional[str] = None
    question_ids: List[str] = []

class ExternalAssessmentResult(BaseModel):
    platform: str
    test_id: Optional[str] = None
    candidate_id: str
    status: str
    score: Optional[int] = None
    max_score: Optional[int] = 100
    details: Optional[Dict[str, Any]] = None


# ═════════════════════════════════════════════════════════════════════════════
# ADVANCED CODING ASSESSMENT SCHEMAS (PHASE 4A.1)
# ═════════════════════════════════════════════════════════════════════════════

class CodingTestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False
    weight: float = 1.0
    display_order: int = 0
    explanation: Optional[str] = None


class CodingTestCaseCreate(CodingTestCaseBase):
    pass


class CodingTestCasePublicResponse(BaseModel):
    id: str
    problem_id: str
    is_hidden: bool = False
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    explanation: Optional[str] = None
    display_order: int = 0
    weight: float = 1.0


class CodingTestCaseDetailResponse(CodingTestCaseBase):
    id: str
    problem_id: str
    created_at: Optional[datetime] = None


class CodingProblemBase(BaseModel):
    title: str
    slug: str
    problem_statement: str
    difficulty: str = "Medium"
    constraints: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    execution_mode: str = "function" # "function" | "stdin"
    function_name: str = "solve"
    function_signature: Optional[Dict[str, Any]] = None
    time_limit_sec: float = 5.0
    memory_limit_mb: float = 128.0
    allowed_languages: List[str] = ["python", "javascript", "sql"]
    starter_code: Dict[str, str] = {}
    solution_template: Optional[str] = None


class CodingProblemCreate(CodingProblemBase):
    is_system: bool = False


class CodingProblemUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    problem_statement: Optional[str] = None
    difficulty: Optional[str] = None
    constraints: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    execution_mode: Optional[str] = None
    function_name: Optional[str] = None
    function_signature: Optional[Dict[str, Any]] = None
    time_limit_sec: Optional[float] = None
    memory_limit_mb: Optional[float] = None
    allowed_languages: Optional[List[str]] = None
    starter_code: Optional[Dict[str, str]] = None
    solution_template: Optional[str] = None
    is_active: Optional[bool] = None


class CodingProblemResponse(CodingProblemBase):
    id: str
    organization_id: Optional[str] = None
    is_system: bool = False
    current_version: int = 1
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    test_cases: Optional[List[CodingTestCasePublicResponse]] = []


class CodingProblemVersionResponse(BaseModel):
    id: str
    problem_id: str
    version_number: int
    title: str
    problem_statement: str
    difficulty: str
    constraints: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    execution_mode: str = "function"
    function_name: str
    function_signature: Optional[Dict[str, Any]] = None
    time_limit_sec: float
    memory_limit_mb: float
    allowed_languages: List[str]
    starter_code: Dict[str, str]
    change_summary: Optional[str] = None
    created_at: Optional[datetime] = None


class AssessmentSectionCreate(BaseModel):
    title: str
    section_type: str # technical_mcqs | scenario | coding | troubleshooting
    display_order: int = 0
    weight_percentage: float = 25.0
    config: Optional[Dict[str, Any]] = {}


class AssessmentSectionResponse(BaseModel):
    id: str
    assessment_id: str
    title: str
    section_type: str
    display_order: int
    weight_percentage: float
    config: Optional[Dict[str, Any]] = {}
    created_at: Optional[datetime] = None


class AssessmentCodingProblemLink(BaseModel):
    coding_problem_id: str
    coding_problem_version_id: Optional[str] = None
    display_order: int = 0
    weight: float = 100.0
    is_required: bool = True


class AssessmentCreate(BaseModel):
    job_id: str
    title: str
    description: Optional[str] = None
    duration_minutes: int = 45
    passing_score: int = 70
    sections: Optional[List[AssessmentSectionCreate]] = []
    coding_problems: Optional[List[AssessmentCodingProblemLink]] = []
    mcqs: Optional[List[AssessmentMCQLink]] = []


class AssessmentResponse(BaseModel):
    id: str
    job_id: str
    organization_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    duration_minutes: int = 45
    passing_score: int = 70
    is_active: bool = True
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SubmissionTestCaseResultResponse(BaseModel):
    id: str
    submission_id: str
    test_case_id: str
    passed: bool
    actual_output: Optional[str] = None
    execution_time_ms: Optional[float] = None
    memory_mb: Optional[float] = None
    error_message: Optional[str] = None
    is_hidden: bool = False
    created_at: Optional[datetime] = None


class CodingSubmissionCreate(BaseModel):
    assessment_id: Optional[str] = None
    coding_problem_id: str
    coding_problem_version_id: Optional[str] = None
    language: str
    source_code: str


class CodingSubmissionResponse(BaseModel):
    id: str
    candidate_id: str
    assessment_id: Optional[str] = None
    coding_problem_id: str
    coding_problem_version_id: Optional[str] = None
    language: str
    source_code: str
    status: str
    passed_test_cases: int = 0
    total_test_cases: int = 0
    score: float = 0.0
    execution_time_ms: Optional[float] = None
    memory_mb: Optional[float] = None
    compiler_output: Optional[str] = None
    runtime_error: Optional[str] = None
    is_best_submission: bool = False
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    test_case_results: Optional[List[SubmissionTestCaseResultResponse]] = []


# ═════════════════════════════════════════════════════════════════════════════
# ORGANIZATION / TENANCY SCHEMAS (PHASE 4B.1)
# ═════════════════════════════════════════════════════════════════════════════

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    user_count: Optional[int] = 0
    job_count: Optional[int] = 0
    candidate_count: Optional[int] = 0

    class Config:
        from_attributes = True

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None


# ═════════════════════════════════════════════════════════════════════════════
# MCQ QUESTION BANK & AUTHORING SCHEMAS (PHASE 4B.2)
# ═════════════════════════════════════════════════════════════════════════════

class MCQOptionCreate(BaseModel):
    option_key: str # "A", "B", "C", "D"
    option_text: str
    is_correct: bool = False
    display_order: int = 0


class MCQOptionResponse(BaseModel):
    id: str
    question_id: str
    option_key: str
    option_text: str
    is_correct: Optional[bool] = None # Masked for candidates
    display_order: int

    class Config:
        from_attributes = True


class MCQQuestionCreate(BaseModel):
    question_text: str
    category: str = "technical"
    difficulty: str = "Medium"
    explanation: Optional[str] = None
    skills: List[str] = []
    options: List[MCQOptionCreate]
    is_system: bool = False


class MCQQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    explanation: Optional[str] = None
    skills: Optional[List[str]] = None
    options: Optional[List[MCQOptionCreate]] = None
    is_active: Optional[bool] = None


class MCQQuestionResponse(BaseModel):
    id: str
    organization_id: Optional[str] = None
    is_system: bool = False
    question_text: str
    category: str = "technical"
    difficulty: str = "Medium"
    explanation: Optional[str] = None
    skills: List[str] = []
    is_active: bool = True
    current_version: int = 1
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    options: List[MCQOptionResponse] = []

    class Config:
        from_attributes = True


class AssessmentMCQLink(BaseModel):
    mcq_question_id: str
    display_order: int = 0
    weight: float = 1.0
    is_required: bool = True
    question: Optional[MCQQuestionResponse] = None


class AssessmentMCQAttachRequest(BaseModel):
    mcqs: List[AssessmentMCQLink]


# ─── PHASE 4C: INTERVIEW AVAILABILITY & SCHEDULING SCHEMAS ───────────────────

class AvailabilityBlockCreate(BaseModel):
    start_time: str # "HH:MM" e.g. "13:00"
    end_time: str   # "HH:MM" e.g. "14:00"
    reason: Optional[str] = "Unavailable / Busy"

class AvailabilityBlockResponse(BaseModel):
    id: str
    availability_id: str
    start_time: str
    end_time: str
    reason: str
    created_at: Optional[str] = None

class RecruiterAvailabilityCreate(BaseModel):
    available_date: str # "YYYY-MM-DD"
    start_time: str     # "HH:MM" e.g. "09:00"
    end_time: str       # "HH:MM" e.g. "17:00"
    timezone: Optional[str] = "UTC" # e.g. "Asia/Kolkata", "UTC"
    slot_duration_minutes: Optional[int] = 30
    buffer_minutes: Optional[int] = 15
    job_id: Optional[str] = None
    blocks: Optional[List[AvailabilityBlockCreate]] = []

class RecruiterAvailabilityUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    timezone: Optional[str] = None
    slot_duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None
    is_active: Optional[bool] = None
    blocks: Optional[List[AvailabilityBlockCreate]] = None

class RecruiterAvailabilityResponse(BaseModel):
    id: str
    organization_id: str
    recruiter_id: str
    job_id: Optional[str] = None
    available_date: str
    start_time: str
    end_time: str
    timezone: str
    slot_duration_minutes: int
    buffer_minutes: int
    is_active: bool
    blocks: List[AvailabilityBlockResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class InterviewSlot(BaseModel):
    slot_id: str
    availability_id: str
    recruiter_id: str
    start_time_utc: str # ISO UTC
    end_time_utc: str   # ISO UTC
    local_start_time: str
    local_end_time: str
    local_date: str
    timezone: str
    duration_minutes: int
    is_available: bool = True

class InterviewBookingRequest(BaseModel):
    candidate_id: str
    job_id: str
    start_time_utc: str # ISO UTC e.g. "2026-10-15T09:00:00Z"
    end_time_utc: str   # ISO UTC e.g. "2026-10-15T09:30:00Z"
    timezone: Optional[str] = "UTC"
    notes: Optional[str] = ""
    availability_id: Optional[str] = None

class InterviewRescheduleRequest(BaseModel):
    booking_id: Optional[str] = None
    candidate_id: Optional[str] = None
    new_start_time_utc: str
    new_end_time_utc: str
    timezone: Optional[str] = "UTC"
    reason: Optional[str] = ""

class InterviewCancellationRequest(BaseModel):
    booking_id: Optional[str] = None
    candidate_id: Optional[str] = None
    reason: Optional[str] = ""

class InterviewBookingResponse(BaseModel):
    id: str
    organization_id: str
    job_id: str
    job_title: Optional[str] = None
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    recruiter_id: Optional[str] = None
    start_time_utc: str
    end_time_utc: str
    local_start_time: Optional[str] = None
    local_end_time: Optional[str] = None
    local_date: Optional[str] = None
    timezone: str
    status: str
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


