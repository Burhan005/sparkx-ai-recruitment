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

    # Compensation updates
    ctc_type: Optional[str] = None
    ctc_min: Optional[float] = None
    ctc_max: Optional[float] = None
    ctc_currency: Optional[str] = None
    ctc_period: Optional[str] = None
    variable_pay_min: Optional[float] = None
    variable_pay_max: Optional[float] = None

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
    relational_skills: Optional[List[Dict[str, Any]]] = None

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
    rationale_category: Optional[str] = None
    rationale_note: Optional[str] = None
    evidence_references: Optional[List[str]] = []
    job_id: Optional[str] = None

class CandidateReopenRequest(BaseModel):
    reason: str

class AssessmentInviteRequest(BaseModel):
    custom_message: Optional[str] = ""

class PipelineStatsResponse(BaseModel):
    total_candidates: int
    stage_counts: Dict[str, int]
    assessment_counts: Dict[str, int]
    interview_counts: Dict[str, int]
    decision_counts: Dict[str, int]
    evaluated_candidates: Optional[int] = 0

class BulkCandidateActionRequest(BaseModel):
    candidate_ids: List[str]
    action: str # "update_stage" | "update_decision" | "invite_assessment"
    stage: Optional[str] = None
    decision: Optional[str] = None
    notes: Optional[str] = ""
    rejection_reason: Optional[str] = None
    rejection_category: Optional[str] = None
    custom_message: Optional[str] = ""

class BulkCandidateFailureItem(BaseModel):
    candidate_id: str
    candidate_name: Optional[str] = None
    reason: str

class BulkCandidateActionResponse(BaseModel):
    action: str
    total_requested: int
    success_count: int
    failure_count: int
    successful_candidate_ids: List[str]
    failures: List[BulkCandidateFailureItem]

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
    interview_transcript: Optional[List[Dict[str, Any]]] = []
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

    # Phase 4E.1 Relational Skills
    relational_skills: Optional[List[Dict[str, Any]]] = None

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


# ─── PHASE 4E.1: RELATIONAL SKILL ARCHITECTURE SCHEMAS ─────────────────────────

class SkillBase(BaseModel):
    name: str
    slug: Optional[str] = None
    category: Optional[str] = "General Competencies"
    description: Optional[str] = None
    is_active: bool = True

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SkillEvidenceItem(BaseModel):
    id: str
    evidence_type: str
    reference_id: Optional[str] = None
    score_contribution: Optional[float] = 0.0
    snippet: Optional[str] = None
    created_at: Optional[str] = None

class CandidateSkillItem(BaseModel):
    candidate_skill_id: str
    skill_id: str
    name: str
    slug: str
    category: Optional[str] = "General Competencies"
    proficiency_level: Optional[str] = "unspecified"
    years_experience: Optional[float] = 0.0
    is_verified: bool = False
    verified_score: Optional[float] = None
    verification_source: Optional[str] = None
    evidence_count: int = 0
    evidence: Optional[List[SkillEvidenceItem]] = []

class JobSkillRequirementItem(BaseModel):
    job_skill_requirement_id: str
    skill_id: str
    name: str
    slug: str
    category: Optional[str] = "General Competencies"
    requirement_type: str = "must_have"
    weight: float = 1.0
    min_years: Optional[float] = 0.0
    min_proficiency: Optional[str] = "intermediate"

class CandidateSkillsSyncRequest(BaseModel):
    skills: List[str]

class JobSkillRequirementsSyncRequest(BaseModel):
    skills: List[str]
    requirement_types: Optional[Dict[str, str]] = None
    weights: Optional[Dict[str, float]] = None

class SkillEvidenceCreate(BaseModel):
    evidence_type: str # "resume" | "coding_submission" | "mcq_submission" | "interview" | "certification"
    reference_id: Optional[str] = None
    score_contribution: Optional[float] = 0.0
    snippet: Optional[str] = None

class SkillAliasCreate(BaseModel):
    alias: str

class SkillAliasResponse(BaseModel):
    id: str
    skill_id: str
    alias: str
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True


# ─── Phase 4E.2: Multi-Skill Matching & Evidence Verification Schemas ────────

class SkillMatchItem(BaseModel):
    skill_id: str
    skill_name: str
    slug: str
    category: Optional[str] = "General Competencies"
    requirement_type: str = "must_have"
    weight: float = 1.0
    required_years: float = 0.0
    candidate_years: float = 0.0
    required_proficiency: str = "intermediate"
    candidate_proficiency: str = "unspecified"
    status: str  # "verified_match" | "satisfied" | "partially_satisfied" | "missing" | "unsatisfied"
    verification_status: str  # "VERIFIED" | "PARTIALLY_VERIFIED" | "SELF_REPORTED" | "not_applicable"
    experience_satisfied: bool = False
    proficiency_satisfied: bool = False
    satisfaction_score: float = 0.0
    weighted_contribution: float = 0.0
    max_possible_contribution: float = 1.0
    evidence_count: int = 0
    evidence: Optional[List[SkillEvidenceItem]] = []
    explanation: str = ""

class SkillCategoryBreakdown(BaseModel):
    score: float = 0.0
    matched: int = 0
    total: int = 0
    has_missing: bool = False

class SkillOverallMatch(BaseModel):
    score: float = 0.0
    status: str = "no_match"
    has_missing_must_have: bool = False
    matched_skills_count: int = 0
    total_skills_count: int = 0

class CandidateJobMatchResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    overall_match: SkillOverallMatch
    must_have: SkillCategoryBreakdown
    preferred: SkillCategoryBreakdown
    skills: List[SkillMatchItem] = []
    evaluated_at: Optional[str] = None

class BatchJobCandidateMatchResponse(BaseModel):
    job_id: str
    job_title: str
    total_candidates: int
    candidates: List[CandidateJobMatchResponse] = []


# ─── Phase 4E.3: Candidate Comparison Engine Schemas ──────────────────────────

class CandidateComparisonRequest(BaseModel):
    job_id: str
    candidate_ids: List[str]

class CandidateComparisonSummaryItem(BaseModel):
    candidate_id: str
    candidate_name: str
    email: Optional[str] = None
    stage: Optional[str] = None
    overall_match: SkillOverallMatch
    must_have: SkillCategoryBreakdown
    preferred: SkillCategoryBreakdown
    rank: int
    assessment_status: Optional[str] = None
    interview_status: Optional[str] = None
    hiring_decision: Optional[str] = None
    gaps: List[str] = []
    top_strengths: List[str] = []
    # Phase 4E.8 Scorecard Dimensions
    scorecard_fit_score: Optional[float] = None
    scorecard_fit_tier: Optional[str] = None
    required_skill_coverage: Optional[float] = None
    preferred_skill_coverage: Optional[float] = None
    verified_evidence_count: Optional[int] = 0
    mitigation_recommendations: Optional[List[Dict[str, Any]]] = []

class SkillComparisonCandidateValue(BaseModel):
    candidate_id: str
    candidate_name: str
    status: str  # "verified_match" | "satisfied" | "partially_satisfied" | "missing" | "unsatisfied"
    verification_status: str  # "VERIFIED" | "PARTIALLY_VERIFIED" | "SELF_REPORTED" | "not_applicable"
    satisfaction_score: float = 0.0
    candidate_years: float = 0.0
    candidate_proficiency: str = "unspecified"
    experience_satisfied: bool = False
    proficiency_satisfied: bool = False
    evidence_count: int = 0
    evidence: Optional[List[Any]] = []
    explanation: str = ""
    # Phase 4E.8 Evidence Matrix Dimensions
    scorecard_status: Optional[str] = None  # "VERIFIED" | "EVIDENCED" | "CLAIMED" | "MISSING"
    evidence_strength: Optional[str] = None  # "HIGH" | "MEDIUM" | "LOW" | "NONE"
    supported_sources: Optional[List[str]] = []
    recency_label: Optional[str] = None
    latest_evidence_timestamp: Optional[str] = None

class SkillComparisonMatrixRow(BaseModel):
    skill_id: str
    skill_name: str
    slug: str
    category: Optional[str] = "General Competencies"
    requirement_type: str = "must_have"
    weight: float = 1.0
    required_years: float = 0.0
    required_proficiency: str = "intermediate"
    candidate_values: Dict[str, SkillComparisonCandidateValue] = {}

class CandidateComparisonResponse(BaseModel):
    job_id: str
    job_title: str
    department: Optional[str] = None
    organization_id: Optional[str] = None
    total_requirements: int = 0
    must_have_count: int = 0
    preferred_count: int = 0
    candidates: List[CandidateComparisonSummaryItem] = []
    skill_comparison: List[SkillComparisonMatrixRow] = []
    meaningful_differences: List[str] = []
    honest_ties: List[str] = []
    comparison_summary: Optional[str] = None
    evaluated_at: Optional[str] = None


# ─── Phase 4E.5: Advanced Assessment Builder Schemas ──────────────────────────

class AssessmentBuilderCreate(BaseModel):
    job_id: str
    title: str
    description: Optional[str] = None
    duration_minutes: int = 45
    passing_score: int = 70
    max_attempts: int = 1
    deadline_days: Optional[int] = None
    randomize_questions: bool = False
    allow_review: bool = True
    allow_unanswered: bool = True
    allow_resume: bool = True

class AssessmentBuilderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    passing_score: Optional[int] = None
    max_attempts: Optional[int] = None
    deadline_days: Optional[int] = None
    randomize_questions: Optional[bool] = None
    allow_review: Optional[bool] = None
    allow_unanswered: Optional[bool] = None
    allow_resume: Optional[bool] = None

class AssessmentQuestionItem(BaseModel):
    id: str # association id
    question_type: str # "mcq" | "coding"
    question_id: str # question id
    title: str
    difficulty: str
    category: Optional[str] = None
    skills: List[str] = []
    display_order: int
    weight: float
    is_required: bool
    options_count: Optional[int] = None
    test_cases_count: Optional[int] = None

class AssessmentBuilderDetailResponse(BaseModel):
    id: str
    job_id: str
    job_title: Optional[str] = None
    organization_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str # "draft" | "published" | "archived"
    version: int = 1
    duration_minutes: int = 45
    passing_score: int = 70
    max_attempts: int = 1
    deadline_days: Optional[int] = None
    randomize_questions: bool = False
    allow_review: bool = True
    allow_unanswered: bool = True
    allow_resume: bool = True
    total_questions: int = 0
    total_mcqs: int = 0
    total_coding: int = 0
    total_points: float = 0.0
    questions: List[AssessmentQuestionItem] = []
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None

class AssessmentQuestionAttachRequest(BaseModel):
    question_type: str # "mcq" | "coding"
    question_id: str
    display_order: Optional[int] = None
    weight: Optional[float] = None
    is_required: bool = True

class AssessmentQuestionReorderItem(BaseModel):
    question_type: str # "mcq" | "coding"
    question_id: str
    display_order: int
    weight: Optional[float] = None

class AssessmentQuestionReorderRequest(BaseModel):
    items: List[AssessmentQuestionReorderItem]

class QuestionAutoSelectRule(BaseModel):
    question_type: str = "mcq" # "mcq" | "coding" | "any"
    category: Optional[str] = None # "technical" | "scenario" | "troubleshooting"
    difficulty: Optional[str] = None # "Easy" | "Medium" | "Hard"
    skill_slug: Optional[str] = None # e.g. "python" or canonical id "skl-python"
    count: int = 1
    weight: Optional[float] = None

class QuestionAutoSelectRequest(BaseModel):
    rules: List[QuestionAutoSelectRule]
    clear_existing: bool = False

class AssessmentValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    total_questions: int = 0
    total_mcqs: int = 0
    total_coding: int = 0
    total_points: float = 0.0

class UnifiedQuestionBankItem(BaseModel):
    id: str
    question_type: str # "mcq" | "coding"
    title: str
    question_text: str
    difficulty: str
    category: Optional[str] = None
    skills: List[str] = []
    is_system: bool = False
    is_active: bool = True
    options_count: Optional[int] = None
    test_cases_count: Optional[int] = None
    created_at: Optional[datetime] = None

class QuestionCreateUnified(BaseModel):
    question_type: str # "mcq" | "coding"
    title: str
    question_text: str # For coding, this is problem_statement
    category: Optional[str] = "technical" # technical, scenario, troubleshooting
    difficulty: str = "Medium" # Easy, Medium, Hard
    explanation: Optional[str] = None
    skills: List[str] = []
    skill_ids: Optional[List[str]] = []
    # MCQ specific:
    options: Optional[List[MCQOptionCreate]] = None
    # Coding specific:
    slug: Optional[str] = None
    execution_mode: Optional[str] = "function"
    function_name: Optional[str] = "solve"
    function_signature: Optional[Dict[str, Any]] = None
    time_limit_sec: Optional[float] = 5.0
    memory_limit_mb: Optional[float] = 128.0
    allowed_languages: Optional[List[str]] = ["python", "javascript", "sql"]
    starter_code: Optional[Dict[str, str]] = None
    test_cases: Optional[List[CodingTestCaseCreate]] = None


# ─── VERIFIED SKILL PASSPORT SCHEMAS ──────────────────────────────────────────

class PassportEvidenceItem(BaseModel):
    id: str
    evidence_type: str # "coding_submission" | "mcq_submission" | "assessment" | "interview" | "resume" | "recruiter_verification"
    source_title: str
    reference_id: Optional[str] = None
    score_contribution: Optional[float] = 0.0
    evidence_strength: str = "SUPPORTING" # "STRONG" | "MODERATE" | "SUPPORTING"
    snippet: Optional[str] = None
    created_at: Optional[str] = None
    recency_label: str = "Recently"
    is_verified_source: bool = False

class PassportSkillItem(BaseModel):
    candidate_skill_id: str
    skill_id: str
    name: str
    skill_name: Optional[str] = None
    slug: str
    category: str = "General Competencies"
    proficiency_level: str = "unspecified"
    years_experience: float = 0.0
    verification_status: str = "CLAIMED" # "VERIFIED" | "EVIDENCED" | "CLAIMED"
    is_verified: bool = False
    verified_score: Optional[float] = None
    verification_source: Optional[str] = None
    evidence_count: int = 0
    evidence_strength: Optional[str] = "NONE"
    latest_evidence_date: Optional[str] = None
    recency_label: str = "No evidence"
    evidence: List[PassportEvidenceItem] = []
    summary_explanation: str = ""

class PassportCategorySummary(BaseModel):
    category: str
    total_skills: int = 0
    total: Optional[int] = 0
    verified_skills: int = 0
    verified: Optional[int] = 0
    evidenced_skills: int = 0
    evidenced: Optional[int] = 0
    claimed_skills: Optional[int] = 0
    claimed: Optional[int] = 0
    verification_percentage: Optional[float] = 0.0

class CandidateSkillPassportResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    job_id: Optional[str] = None
    job_title: Optional[str] = None
    applied_date: Optional[str] = None
    total_skills: int = 0
    verified_skills_count: int = 0
    evidenced_skills_count: int = 0
    claimed_skills_count: int = 0
    total_evidence_count: int = 0
    verification_rate: float = 0.0
    verification_index: Optional[float] = 0.0
    categories: List[PassportCategorySummary] = []
    skills: List[PassportSkillItem] = []
    generated_at: str

class ManualSkillVerificationRequest(BaseModel):
    notes: Optional[str] = "Recruiter manual verification"
    score: Optional[float] = 100.0


# ─── EVIDENCE-BASED CANDIDATE SCORECARD SCHEMAS (PHASE 4E.7) ─────────────────

class ScorecardEvidenceItem(BaseModel):
    id: str
    evidence_type: str
    source_title: str
    reference_id: Optional[str] = None
    score_contribution: Optional[float] = 0.0
    evidence_strength: str = "SUPPORTING"
    snippet: Optional[str] = None
    created_at: Optional[str] = None
    recency_label: str = "Recently"
    artifact_url: Optional[str] = None

class ScorecardSkillEvaluation(BaseModel):
    skill_id: str
    skill_name: str
    slug: str
    category: str = "General Competencies"
    requirement_type: str = "must_have"
    weight: float = 1.0
    status: str
    verification_status: str
    candidate_years: float = 0.0
    required_years: float = 0.0
    candidate_proficiency: str = "unspecified"
    required_proficiency: str = "intermediate"
    evidence_count: int = 0
    evidence_strength: str = "NONE"
    supported_sources: List[str] = []
    latest_evidence_timestamp: Optional[str] = None
    recency_label: str = "No evidence"
    evidence: List[ScorecardEvidenceItem] = []
    reason: str = ""

class ScorecardFitSummary(BaseModel):
    total_required_skills: int = 0
    verified_required_count: int = 0
    evidenced_required_count: int = 0
    claimed_required_count: int = 0
    missing_required_count: int = 0
    
    total_preferred_skills: int = 0
    verified_preferred_count: int = 0
    evidenced_preferred_count: int = 0
    claimed_preferred_count: int = 0
    missing_preferred_count: int = 0

    total_job_skills: int = 0
    total_verified_skills: int = 0
    total_evidenced_skills: int = 0
    total_claimed_skills: int = 0
    total_missing_skills: int = 0

    required_skill_coverage: float = 0.0
    preferred_skill_coverage: float = 0.0
    overall_fit_score: float = 0.0
    fit_tier: str = "MODERATE_FIT"
    scoring_formula: str = ""

class ScorecardSkillGapItem(BaseModel):
    skill_name: str
    category: str
    requirement_type: str
    gap_type: str
    evidence_count: int = 0
    current_status: str
    mitigation_recommendation: str

class ScorecardEvidenceSummary(BaseModel):
    total_evidence_records: int = 0
    coding_evidence_count: int = 0
    mcq_evidence_count: int = 0
    interview_evidence_count: int = 0
    recruiter_verified_count: int = 0
    latest_evidence_date: Optional[str] = None
    latest_recency_label: str = "No evidence"

class CandidateScorecardResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_stage: str = "applied"
    job_id: str
    job_title: str
    job_department: Optional[str] = None
    organization_id: str
    summary: ScorecardFitSummary
    skill_evaluations: List[ScorecardSkillEvaluation]
    skill_gaps: List[ScorecardSkillGapItem]
    evidence_summary: ScorecardEvidenceSummary
    generated_at: str


# ======================================================================
# PHASE 4E.9 — EVIDENCE-BASED HIRING DECISION SCHEMAS
# ======================================================================

class DecisionContextScorecardSummary(BaseModel):
    fit_score: float = 0.0
    fit_tier: str = "MODERATE_FIT"
    fit_tier_label: str = "Moderate Fit"
    must_have_coverage: float = 0.0
    preferred_coverage: float = 0.0
    verified_evidence_count: int = 0
    evidenced_count: int = 0
    claimed_count: int = 0
    missing_count: int = 0
    total_requirements: int = 0

class DecisionEvidenceItem(BaseModel):
    skill_name: str
    category: str = "General"
    importance: str = "required" # "required" | "preferred"
    status: str = "VERIFIED" # "VERIFIED" | "EVIDENCED" | "CLAIMED"
    proficiency: Optional[str] = None
    years_of_experience: Optional[float] = 0.0
    evidence_sources: List[str] = []
    evidence_count: int = 0
    recency_label: str = "No evidence"
    highlights: List[str] = []

class DecisionGapItem(BaseModel):
    skill_name: str
    importance: str = "required"
    status: str = "MISSING" # "MISSING" | "CLAIMED" | "EVIDENCED"
    required_proficiency: Optional[str] = "intermediate"
    candidate_proficiency: Optional[str] = "unspecified"
    mitigation_recommendation: str = ""

class DecisionHistoryItem(BaseModel):
    id: str
    candidate_id: str
    from_decision: Optional[str] = None
    to_decision: str
    changed_by: str
    changed_by_name: Optional[str] = None
    rationale_category: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None

class GroundedRationaleOption(BaseModel):
    id: str
    label: str
    type: str # "positive" | "caution" | "gap"
    grounded_evidence: Optional[str] = None

class CandidateDecisionContextResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: Optional[str] = None
    job_id: str
    job_title: str
    department: Optional[str] = None
    current_stage: str
    current_decision: str
    recruiter_score: Optional[int] = None
    is_final_decision: bool = False
    is_reopened: bool = False
    reopened_at: Optional[str] = None
    reopened_by: Optional[str] = None
    reopen_reason: Optional[str] = None
    previous_final_decision: Optional[str] = None
    scorecard: DecisionContextScorecardSummary
    strongest_evidence: List[DecisionEvidenceItem] = []
    material_gaps: List[DecisionGapItem] = []
    decision_history: List[DecisionHistoryItem] = []
    allowed_transitions: List[str] = []
    grounded_rationale_options: List[GroundedRationaleOption] = []
    comparison_context: Optional[Dict[str, Any]] = None
    rejection_category: Optional[str] = None
    rejection_reason: Optional[str] = None
    hr_notes: Optional[str] = None

class DecisionAssistantRequest(BaseModel):
    query: str
    job_id: Optional[str] = None
    cohort_candidate_ids: Optional[List[str]] = None

class EvidenceCitationItem(BaseModel):
    skill_name: str
    status: str # "VERIFIED" | "EVIDENCED" | "CLAIMED" | "MISSING"
    requirement_type: str # "must_have" | "preferred"
    evidence_count: int = 0
    evidence_strength: str = "NONE" # "STRONG" | "MODERATE" | "SUPPORTING" | "NONE"
    sources: List[str] = []
    reason: Optional[str] = None

class DecisionAssistantResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    query: str
    answer: str
    authoritative_score: float
    fit_tier: str
    must_have_coverage: float
    preferred_coverage: float
    status_breakdown: Dict[str, int]
    cited_evidence: List[EvidenceCitationItem] = []
    material_gaps: List[Dict[str, Any]] = []
    cohort_comparison: Optional[Dict[str, Any]] = None
    provider: str
    is_live_llm: bool = True
    limitations_disclaimer: str
