--
-- PostgreSQL database dump
--

\restrict NVUZBlQYABwyLz2gf5tNxRMoJDIZsMUjarfs2hDhWiH50UNH3dllgtjMHbLC1mm

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assessment_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_audit_logs (
    id character varying NOT NULL,
    organization_id character varying,
    assessment_id character varying,
    action character varying NOT NULL,
    performed_by character varying NOT NULL,
    details json,
    created_at timestamp without time zone
);


--
-- Name: assessment_coding_problems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_coding_problems (
    id character varying NOT NULL,
    assessment_id character varying NOT NULL,
    coding_problem_id character varying NOT NULL,
    coding_problem_version_id character varying,
    display_order integer,
    weight double precision,
    is_required boolean,
    created_at timestamp without time zone
);


--
-- Name: assessment_mcq_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_mcq_questions (
    id character varying NOT NULL,
    assessment_id character varying NOT NULL,
    mcq_question_id character varying NOT NULL,
    display_order integer,
    weight double precision,
    is_required boolean,
    created_at timestamp without time zone
);


--
-- Name: assessment_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_sections (
    id character varying NOT NULL,
    assessment_id character varying NOT NULL,
    title character varying NOT NULL,
    section_type character varying NOT NULL,
    display_order integer,
    weight_percentage double precision,
    config json,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: assessment_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_versions (
    id character varying NOT NULL,
    assessment_id character varying NOT NULL,
    version_number integer NOT NULL,
    title character varying NOT NULL,
    description text,
    duration_minutes integer,
    passing_score integer,
    max_attempts integer,
    deadline_days integer,
    randomize_questions boolean,
    allow_review boolean,
    allow_unanswered boolean,
    allow_resume boolean,
    snapshot_data json NOT NULL,
    published_by character varying,
    published_at timestamp without time zone
);


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessments (
    id character varying NOT NULL,
    job_id character varying NOT NULL,
    organization_id character varying,
    title character varying NOT NULL,
    description text,
    duration_minutes integer,
    passing_score integer,
    is_active boolean,
    version integer NOT NULL,
    status character varying,
    created_by character varying,
    max_attempts integer,
    deadline_days integer,
    randomize_questions boolean,
    allow_review boolean,
    allow_unanswered boolean,
    allow_resume boolean,
    published_at timestamp without time zone,
    archived_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: assistant_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assistant_audit_logs (
    id character varying NOT NULL,
    organization_id character varying,
    user_id character varying,
    candidate_id character varying,
    job_id character varying NOT NULL,
    query_preview character varying(255) NOT NULL,
    request_id character varying,
    provider character varying,
    validation_status character varying,
    evidence_count integer,
    created_at timestamp without time zone
);


--
-- Name: availability_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.availability_blocks (
    id character varying NOT NULL,
    availability_id character varying NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    reason character varying NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: candidate_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_skills (
    id character varying NOT NULL,
    candidate_id character varying NOT NULL,
    skill_id character varying NOT NULL,
    proficiency_level character varying,
    years_experience double precision,
    is_verified boolean NOT NULL,
    verified_score double precision,
    verification_source character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: candidate_state_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_state_logs (
    id character varying NOT NULL,
    candidate_id character varying NOT NULL,
    dimension character varying NOT NULL,
    from_value character varying,
    to_value character varying NOT NULL,
    changed_by character varying,
    notes text,
    rationale_category character varying,
    created_at timestamp without time zone
);


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id character varying NOT NULL,
    user_id character varying,
    job_id character varying NOT NULL,
    company_name character varying,
    organization_id character varying,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    applied_date character varying,
    status character varying,
    match_score integer,
    experience_years double precision,
    education character varying NOT NULL,
    skills json,
    resume_summary text,
    resume_filename character varying,
    resume_text text,
    fraud_flags json,
    match_details json,
    current_ctc numeric(10,2),
    expected_ctc_type character varying,
    expected_ctc_min numeric(10,2),
    expected_ctc_max numeric(10,2),
    ctc_currency character varying,
    assessment_data json,
    coding_language character varying,
    coding_score integer,
    coding_submission text,
    coding_results json,
    integrity_score integer,
    integrity_risk character varying,
    integrity_events json,
    scores json,
    interview_summary text,
    evidence_snippets json,
    interview_transcript json,
    skill_gaps json,
    hr_notes text,
    final_decision character varying,
    recruiter_score integer,
    rejection_reason text,
    rejection_category character varying,
    rationale_category character varying,
    rationale_note text,
    interview_scheduled_at character varying,
    interview_meeting_url character varying,
    interview_status character varying,
    email_logs json,
    stage character varying,
    assessment_status character varying,
    assessment_invited_at timestamp without time zone,
    assessment_started_at timestamp without time zone,
    assessment_submitted_at timestamp without time zone,
    assessment_evaluated_at timestamp without time zone,
    interview_started_at timestamp without time zone,
    interview_completed_at timestamp without time zone,
    hiring_decision character varying,
    stage_updated_at timestamp without time zone,
    decision_updated_at timestamp without time zone,
    expected_update_date character varying,
    update_notes text,
    update_status character varying,
    update_sent_at timestamp without time zone,
    reminder_sent_flags json,
    assessment_version integer NOT NULL,
    assessment_blueprint json,
    external_assessment_platform character varying,
    external_assessment_id character varying,
    external_assessment_url character varying,
    external_assessment_result json,
    external_assessment_synced_at timestamp without time zone,
    reopened_at timestamp without time zone,
    reopened_by character varying,
    reopen_reason text,
    previous_final_decision character varying,
    version integer NOT NULL,
    created_at timestamp without time zone
);


--
-- Name: coding_problem_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coding_problem_versions (
    id character varying NOT NULL,
    problem_id character varying NOT NULL,
    version_number integer NOT NULL,
    title character varying NOT NULL,
    problem_statement text NOT NULL,
    difficulty character varying,
    constraints text,
    input_format text,
    output_format text,
    execution_mode character varying,
    function_name character varying,
    function_signature json,
    time_limit_sec double precision,
    memory_limit_mb double precision,
    allowed_languages json,
    starter_code json,
    change_summary character varying,
    created_at timestamp without time zone
);


--
-- Name: coding_problems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coding_problems (
    id character varying NOT NULL,
    organization_id character varying,
    is_system boolean,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    problem_statement text NOT NULL,
    difficulty character varying,
    constraints text,
    input_format text,
    output_format text,
    execution_mode character varying,
    function_name character varying,
    function_signature json,
    time_limit_sec double precision,
    memory_limit_mb double precision,
    allowed_languages json,
    starter_code json,
    solution_template text,
    current_version integer NOT NULL,
    is_active boolean,
    created_by character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: coding_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coding_submissions (
    id character varying NOT NULL,
    candidate_id character varying NOT NULL,
    assessment_id character varying,
    coding_problem_id character varying,
    coding_problem_version_id character varying,
    language character varying NOT NULL,
    source_code text NOT NULL,
    status character varying,
    passed_test_cases integer,
    total_test_cases integer,
    score double precision,
    execution_time_ms double precision,
    memory_mb double precision,
    compiler_output text,
    runtime_error text,
    is_best_submission boolean,
    created_at timestamp without time zone,
    completed_at timestamp without time zone
);


--
-- Name: coding_test_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coding_test_cases (
    id character varying NOT NULL,
    problem_id character varying NOT NULL,
    problem_version_id character varying,
    input_data text NOT NULL,
    expected_output text NOT NULL,
    is_hidden boolean,
    weight double precision,
    display_order integer,
    explanation text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: integrity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrity_logs (
    id character varying NOT NULL,
    candidate_id character varying NOT NULL,
    "timestamp" character varying NOT NULL,
    event_type character varying NOT NULL,
    description text NOT NULL,
    severity character varying,
    created_at timestamp without time zone
);


--
-- Name: interview_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_bookings (
    id character varying NOT NULL,
    organization_id character varying NOT NULL,
    job_id character varying NOT NULL,
    candidate_id character varying NOT NULL,
    recruiter_id character varying,
    availability_id character varying,
    start_time_utc timestamp without time zone NOT NULL,
    end_time_utc timestamp without time zone NOT NULL,
    timezone character varying NOT NULL,
    status character varying NOT NULL,
    meeting_url character varying,
    notes text,
    cancellation_reason text,
    cancelled_by character varying,
    cancelled_at timestamp without time zone,
    rescheduled_from_id character varying,
    rescheduled_to_id character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: job_skill_requirements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_skill_requirements (
    id character varying NOT NULL,
    job_id character varying NOT NULL,
    skill_id character varying NOT NULL,
    requirement_type character varying NOT NULL,
    weight double precision NOT NULL,
    min_years double precision,
    min_proficiency character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id character varying NOT NULL,
    title character varying NOT NULL,
    company_name character varying,
    organization_id character varying,
    department character varying NOT NULL,
    location character varying,
    min_experience_years integer,
    experience character varying,
    education character varying NOT NULL,
    languages json,
    required_skills json,
    optional_criteria text,
    description text NOT NULL,
    questions json,
    coding_assessment json,
    coding_difficulty character varying,
    assessment_pool json,
    assessment_version integer,
    competency_blueprint json,
    ctc_type character varying,
    ctc_min numeric(10,2),
    ctc_max numeric(10,2),
    ctc_currency character varying,
    ctc_period character varying,
    variable_pay_min numeric(10,2),
    variable_pay_max numeric(10,2),
    status character varying,
    closed_at timestamp without time zone,
    closed_by character varying,
    closure_reason text,
    paused_at timestamp without time zone,
    created_at timestamp without time zone
);


--
-- Name: mcq_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcq_options (
    id character varying NOT NULL,
    question_id character varying NOT NULL,
    option_key character varying NOT NULL,
    option_text text NOT NULL,
    is_correct boolean NOT NULL,
    display_order integer
);


--
-- Name: mcq_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcq_questions (
    id character varying NOT NULL,
    organization_id character varying,
    is_system boolean,
    question_text text NOT NULL,
    category character varying,
    difficulty character varying,
    explanation text,
    skills json,
    is_active boolean,
    created_by character varying,
    current_version integer NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: mcq_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mcq_submissions (
    id character varying NOT NULL,
    candidate_id character varying NOT NULL,
    assessment_id character varying,
    mcq_question_id character varying NOT NULL,
    selected_option_key character varying,
    is_correct boolean NOT NULL,
    points_earned double precision,
    points_possible double precision,
    created_at timestamp without time zone
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id character varying NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    domain character varying,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: question_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_skills (
    id character varying NOT NULL,
    question_type character varying NOT NULL,
    question_id character varying NOT NULL,
    skill_id character varying NOT NULL,
    relevance_weight double precision,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: recruiter_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruiter_availability (
    id character varying NOT NULL,
    organization_id character varying NOT NULL,
    recruiter_id character varying NOT NULL,
    job_id character varying,
    available_date character varying NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    timezone character varying NOT NULL,
    slot_duration_minutes integer NOT NULL,
    buffer_minutes integer NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: recruiter_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruiter_invitations (
    id character varying NOT NULL,
    invite_code character varying NOT NULL,
    created_by character varying,
    recipient_email character varying,
    used_at timestamp without time zone,
    created_at timestamp without time zone
);


--
-- Name: resume_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_documents (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    organization_id character varying,
    title character varying NOT NULL,
    target_job_id character varying,
    target_job_title character varying,
    is_base_resume boolean,
    contact_info json,
    summary text,
    experience json,
    education json,
    skills json,
    projects json,
    certifications json,
    languages json,
    awards json,
    volunteering json,
    version integer,
    parent_resume_id character varying,
    change_summary character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: resume_match_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resume_match_analyses (
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    resume_id character varying NOT NULL,
    job_id character varying NOT NULL,
    resume_version integer NOT NULL,
    match_score double precision NOT NULL,
    status character varying NOT NULL,
    summary_verdict text NOT NULL,
    category_scores json,
    skill_breakdown json,
    experience_alignment json,
    education_alignment json,
    role_alignment json,
    recommendations json,
    limitations json,
    is_live_llm boolean,
    provider character varying,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: revoked_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revoked_tokens (
    id character varying NOT NULL,
    token_jti character varying NOT NULL,
    revoked_at timestamp without time zone,
    expires_at timestamp without time zone NOT NULL
);


--
-- Name: skill_aliases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_aliases (
    id character varying NOT NULL,
    skill_id character varying NOT NULL,
    alias character varying NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: skill_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_evidence (
    id character varying NOT NULL,
    candidate_skill_id character varying NOT NULL,
    evidence_type character varying NOT NULL,
    reference_id character varying,
    score_contribution double precision,
    snippet text,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id character varying NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    category character varying,
    description text,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: submission_test_case_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submission_test_case_results (
    id character varying NOT NULL,
    submission_id character varying NOT NULL,
    test_case_id character varying,
    passed boolean NOT NULL,
    actual_output text,
    execution_time_ms double precision,
    memory_mb double precision,
    error_message text,
    is_hidden boolean,
    created_at timestamp without time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    role character varying,
    organization_id character varying,
    phone character varying,
    job_role character varying,
    experience_years double precision,
    skills json,
    education character varying,
    resume_filename character varying,
    resume_summary text,
    resume_text text,
    reset_token character varying,
    reset_token_expiry timestamp without time zone,
    reset_token_attempts integer,
    created_at timestamp without time zone
);


--
-- Data for Name: assessment_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_audit_logs (id, organization_id, assessment_id, action, performed_by, details, created_at) FROM stdin;
aal-7567c686	org-bld-13a6f09e	asm-c4245b0f	created	usr-cd70b4ca	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-182731fc"}	2026-10-06 14:08:49.828942
aal-2a599058	org-bld-836fe916	asm-e9711f34	created	usr-3d81e05b	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-bd298050"}	2026-10-06 14:09:46.860198
aal-cce18460	org-bld-c1c76e87	asm-a976259d	created	usr-0e777201	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-2a25025d"}	2026-10-06 14:10:12.92844
aal-d0b98308	org-bld-d6cba057	asm-f2be8b47	created	usr-823f92ea	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-b6cbd28c"}	2026-10-06 15:41:02.02256
aal-f120ea78	org-bld-d6cba057	asm-f2be8b47	question_added	usr-823f92ea	{"type": "mcq", "question_id": "mcq-d634a99e"}	2026-10-06 15:41:02.242225
aal-d66c1651	org-bld-d6cba057	asm-f2be8b47	question_added	usr-823f92ea	{"type": "coding", "question_id": "prob-241e6856"}	2026-10-06 15:41:02.348253
aal-d9b032cd	org-bld-d6cba057	asm-f2be8b47	reordered	usr-823f92ea	{"count": 2}	2026-10-06 15:41:02.450817
aal-dafd1b86	org-bld-d6cba057	asm-f2be8b47	published	usr-823f92ea	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 15:41:02.558571
aal-fd222d1b	org-bld-216eb2c0	asm-2406aaf8	created	usr-20a3b886	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-150ae1c0"}	2026-10-06 15:42:05.123552
aal-b91f9f59	org-bld-216eb2c0	asm-2406aaf8	question_added	usr-20a3b886	{"type": "mcq", "question_id": "mcq-4771ab31"}	2026-10-06 15:42:05.378156
aal-cbc37644	org-bld-216eb2c0	asm-2406aaf8	question_added	usr-20a3b886	{"type": "coding", "question_id": "prob-c22a7e23"}	2026-10-06 15:42:05.429605
aal-cf7eea13	org-bld-216eb2c0	asm-2406aaf8	reordered	usr-20a3b886	{"count": 2}	2026-10-06 15:42:05.495535
aal-745ecd70	org-bld-216eb2c0	asm-2406aaf8	published	usr-20a3b886	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 15:42:05.578952
aal-8c9e208e	org-bld-216eb2c0	asm-2406aaf8	archived	usr-20a3b886	{"version": 1}	2026-10-06 15:42:05.721631
aal-0c000056	org-bld-db73aa25	asm-d14f8e40	created	usr-3b4dc790	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-0357c205"}	2026-10-06 15:45:28.580783
aal-8dffe7cf	org-bld-db73aa25	asm-d14f8e40	question_added	usr-3b4dc790	{"type": "mcq", "question_id": "mcq-96216456"}	2026-10-06 15:45:28.870106
aal-2d22159a	org-bld-db73aa25	asm-d14f8e40	question_added	usr-3b4dc790	{"type": "coding", "question_id": "prob-602d07cc"}	2026-10-06 15:45:28.932749
aal-305071a8	org-bld-db73aa25	asm-d14f8e40	reordered	usr-3b4dc790	{"count": 2}	2026-10-06 15:45:29.018935
aal-90d9996c	org-bld-db73aa25	asm-d14f8e40	published	usr-3b4dc790	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 15:45:29.125369
aal-a9d74297	org-bld-db73aa25	asm-d14f8e40	archived	usr-3b4dc790	{"version": 1}	2026-10-06 15:45:29.288591
aal-b2b9445d	org-bld-bb3d5555	asm-1d0babd8	created	usr-7c4b8719	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-c4642fae"}	2026-10-06 15:53:34.074248
aal-40af7c35	org-bld-bb3d5555	asm-1d0babd8	question_added	usr-7c4b8719	{"type": "mcq", "question_id": "mcq-6a5e24b9"}	2026-10-06 15:53:34.34167
aal-4029bc11	org-bld-bb3d5555	asm-1d0babd8	question_added	usr-7c4b8719	{"type": "coding", "question_id": "prob-1cd64002"}	2026-10-06 15:53:34.400634
aal-dae391e6	org-bld-bb3d5555	asm-1d0babd8	reordered	usr-7c4b8719	{"count": 2}	2026-10-06 15:53:34.480481
aal-bf78a319	org-bld-bb3d5555	asm-1d0babd8	published	usr-7c4b8719	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 15:53:34.62614
aal-d217ceaa	org-bld-bb3d5555	asm-1d0babd8	archived	usr-7c4b8719	{"version": 1}	2026-10-06 15:53:34.853555
aal-46a99dc6	org-sparkx-default	asm-89f49ae8	created	usr-admin01	{"title": "Role Assessment", "job_id": "job-101"}	2026-10-06 15:55:13.815118
aal-c076094c	org-bld-80f25fe3	asm-077a3c73	created	usr-55c1abc9	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-ad55d09f"}	2026-10-06 16:08:11.843471
aal-eed54c22	org-bld-80f25fe3	asm-077a3c73	question_added	usr-55c1abc9	{"type": "mcq", "question_id": "mcq-3ad66834"}	2026-10-06 16:08:12.401052
aal-91ba5a96	org-bld-80f25fe3	asm-077a3c73	question_added	usr-55c1abc9	{"type": "coding", "question_id": "prob-43de42ab"}	2026-10-06 16:08:12.584075
aal-a798ff92	org-bld-80f25fe3	asm-077a3c73	reordered	usr-55c1abc9	{"count": 2}	2026-10-06 16:08:12.840197
aal-bbba81e9	org-bld-80f25fe3	asm-077a3c73	published	usr-55c1abc9	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 16:08:13.14285
aal-d2d3cbd9	org-bld-80f25fe3	asm-077a3c73	archived	usr-55c1abc9	{"version": 1}	2026-10-06 16:08:13.544276
aal-e5fc3e1a	org-sparkx-default	asm-3b05c858	created	usr-admin01	{"title": "Senior Financial Controller & Tax Auditor Assessment", "job_id": "job-e12be8"}	2026-10-06 16:20:44.30189
aal-d194b006	org-bld-309d750e	asm-d41d4fee	created	usr-6c799320	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-41f8ac36"}	2026-10-06 16:26:30.602246
aal-ec87e9af	org-bld-309d750e	asm-d41d4fee	question_added	usr-6c799320	{"type": "mcq", "question_id": "mcq-1fca480e"}	2026-10-06 16:26:30.928645
aal-355d1b25	org-bld-309d750e	asm-d41d4fee	question_added	usr-6c799320	{"type": "coding", "question_id": "prob-514d12d4"}	2026-10-06 16:26:31.023159
aal-94195579	org-bld-309d750e	asm-d41d4fee	reordered	usr-6c799320	{"count": 2}	2026-10-06 16:26:31.126781
aal-550716f8	org-bld-309d750e	asm-d41d4fee	published	usr-6c799320	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 16:26:31.230219
aal-a5f7b9ca	org-bld-309d750e	asm-d41d4fee	archived	usr-6c799320	{"version": 1}	2026-10-06 16:26:31.40034
aal-b100c360	org-bld-01c813e7	asm-3f68a9c1	created	usr-0de1e6ea	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-063e16bd"}	2026-10-06 16:51:45.549039
aal-8e334dbb	org-bld-01c813e7	asm-3f68a9c1	question_added	usr-0de1e6ea	{"type": "mcq", "question_id": "mcq-fb50dfd2"}	2026-10-06 16:51:45.920297
aal-7616f931	org-bld-01c813e7	asm-3f68a9c1	question_added	usr-0de1e6ea	{"type": "coding", "question_id": "prob-022fb13c"}	2026-10-06 16:51:46.060769
aal-ec85c527	org-bld-01c813e7	asm-3f68a9c1	reordered	usr-0de1e6ea	{"count": 2}	2026-10-06 16:51:46.179705
aal-dd01585b	org-bld-01c813e7	asm-3f68a9c1	published	usr-0de1e6ea	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-06 16:51:46.288947
aal-d5eba629	org-bld-01c813e7	asm-3f68a9c1	archived	usr-0de1e6ea	{"version": 1}	2026-10-06 16:51:46.455296
aal-aa854a74	org-sparkx-default	asm-3b05c858	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-rev-rec"}	2026-10-07 03:37:27.444643
aal-6c367de3	org-sparkx-default	asm-3b05c858	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-audit-risk"}	2026-10-07 03:37:29.06122
aal-9d414bb5	org-sparkx-default	asm-3b05c858	reordered	usr-admin01	{"count": 2}	2026-10-07 03:37:31.291154
aal-0a465b6e	org-sparkx-default	asm-3b05c858	reordered	usr-admin01	{"count": 2}	2026-10-07 03:37:31.877664
aal-f3411577	org-sparkx-default	asm-3b05c858	reordered	usr-admin01	{"count": 2}	2026-10-07 03:37:32.062581
aal-6c3ae77a	org-sparkx-default	asm-3b05c858	reordered	usr-admin01	{"count": 2}	2026-10-07 03:37:32.228363
aal-7e479f5a	org-sparkx-default	asm-3b05c858	reordered	usr-admin01	{"count": 2}	2026-10-07 03:37:32.384374
aal-42f5ad68	org-sparkx-default	asm-3b05c858	reordered	usr-admin01	{"count": 2}	2026-10-07 03:37:32.614738
aal-9f73dd4a	org-sparkx-default	asm-3b05c858	question_removed	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-rev-rec"}	2026-10-07 03:37:34.194808
aal-7d38beb2	org-sparkx-default	asm-3b05c858	question_removed	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-audit-risk"}	2026-10-07 03:37:36.429178
aal-935cb296	org-sparkx-default	asm-3b05c858	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-rev-rec"}	2026-10-07 03:40:19.780666
aal-f35e878c	org-sparkx-default	asm-3b05c858	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-audit-risk"}	2026-10-07 03:40:20.712637
aal-0bee9dbc	org-sparkx-default	asm-3b05c858	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-sox404-weakness"}	2026-10-07 03:40:21.715004
aal-5e843091	org-sparkx-default	asm-3b05c858	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-fin-variance-ebitda"}	2026-10-07 03:40:23.917884
aal-8a6b193a	org-bld-bbc879d8	asm-8376331e	created	usr-0a6e4164	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-33c692ed"}	2026-10-07 03:44:51.269419
aal-e9a722ca	org-bld-bbc879d8	asm-8376331e	question_added	usr-0a6e4164	{"type": "mcq", "question_id": "mcq-d3628f23"}	2026-10-07 03:44:51.575312
aal-28012488	org-bld-bbc879d8	asm-8376331e	question_added	usr-0a6e4164	{"type": "coding", "question_id": "prob-6d52a924"}	2026-10-07 03:44:51.644538
aal-3569bc45	org-bld-bbc879d8	asm-8376331e	reordered	usr-0a6e4164	{"count": 2}	2026-10-07 03:44:51.764303
aal-eed5716d	org-bld-bbc879d8	asm-8376331e	published	usr-0a6e4164	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-07 03:44:51.901048
aal-5c20b0eb	org-bld-bbc879d8	asm-8376331e	archived	usr-0a6e4164	{"version": 1}	2026-10-07 03:44:52.108303
aal-9be6d850	org-bld-299018f0	asm-3c9cd23c	created	usr-e649e6ca	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-5c79e8f7"}	2026-10-07 03:50:08.148085
aal-38db6c08	org-bld-299018f0	asm-3c9cd23c	question_added	usr-e649e6ca	{"type": "mcq", "question_id": "mcq-8873b8ef"}	2026-10-07 03:50:08.433385
aal-2452c562	org-bld-299018f0	asm-3c9cd23c	question_added	usr-e649e6ca	{"type": "coding", "question_id": "prob-43a8cc0c"}	2026-10-07 03:50:08.53127
aal-dc832337	org-bld-299018f0	asm-3c9cd23c	reordered	usr-e649e6ca	{"count": 2}	2026-10-07 03:50:08.644334
aal-0dd5915a	org-bld-299018f0	asm-3c9cd23c	published	usr-e649e6ca	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-07 03:50:08.748267
aal-27e441fe	org-bld-299018f0	asm-3c9cd23c	archived	usr-e649e6ca	{"version": 1}	2026-10-07 03:50:08.963345
aal-7261ad6e	org-bld-6ab4dd51	asm-5486c8d2	created	usr-0e8f70e9	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-08d1a7b9"}	2026-10-07 04:19:26.291931
aal-d1e81811	org-bld-6ab4dd51	asm-5486c8d2	question_added	usr-0e8f70e9	{"type": "mcq", "question_id": "mcq-659280cb"}	2026-10-07 04:19:26.439898
aal-92addc12	org-bld-6ab4dd51	asm-5486c8d2	question_added	usr-0e8f70e9	{"type": "coding", "question_id": "prob-73dc970c"}	2026-10-07 04:19:26.483741
aal-7f91e728	org-bld-6ab4dd51	asm-5486c8d2	reordered	usr-0e8f70e9	{"count": 2}	2026-10-07 04:19:26.535298
aal-e4f02233	org-bld-6ab4dd51	asm-5486c8d2	published	usr-0e8f70e9	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-07 04:19:26.598929
aal-691a6692	org-bld-6ab4dd51	asm-5486c8d2	archived	usr-0e8f70e9	{"version": 1}	2026-10-07 04:19:26.719166
aal-ad866246	org-bld-f9c0766c	asm-1effe538	created	usr-c9b6537a	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-173249c6"}	2026-10-07 05:18:29.522913
aal-d50da46d	org-bld-f9c0766c	asm-1effe538	question_added	usr-c9b6537a	{"type": "mcq", "question_id": "mcq-4c7ce843"}	2026-10-07 05:18:29.659991
aal-8f0ce56c	org-bld-f9c0766c	asm-1effe538	question_added	usr-c9b6537a	{"type": "coding", "question_id": "prob-e63cc727"}	2026-10-07 05:18:29.717276
aal-24155931	org-bld-f9c0766c	asm-1effe538	reordered	usr-c9b6537a	{"count": 2}	2026-10-07 05:18:29.762835
aal-9c108ba6	org-bld-f9c0766c	asm-1effe538	published	usr-c9b6537a	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-07 05:18:29.850833
aal-60efd837	org-bld-f9c0766c	asm-1effe538	archived	usr-c9b6537a	{"version": 1}	2026-10-07 05:18:30.116297
aal-7ff8655f	org-sparkx-default	asm-1a01fd27	created	usr-admin01	{"title": "Senior Financial Controller & Tax Auditor Assessment", "job_id": "job-102"}	2026-10-07 05:25:44.235047
aal-27517410	org-bld-221b5760	asm-ebf9f75b	created	usr-dfb19537	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-f0cb24c9"}	2026-10-08 03:23:25.309429
aal-bac86399	org-bld-221b5760	asm-ebf9f75b	question_added	usr-dfb19537	{"type": "mcq", "question_id": "mcq-215d2dc4"}	2026-10-08 03:23:25.554658
aal-fc841dc4	org-bld-221b5760	asm-ebf9f75b	question_added	usr-dfb19537	{"type": "coding", "question_id": "prob-b5bec3ae"}	2026-10-08 03:23:25.658721
aal-95d787e2	org-bld-221b5760	asm-ebf9f75b	reordered	usr-dfb19537	{"count": 2}	2026-10-08 03:23:25.763981
aal-8634fc7e	org-bld-221b5760	asm-ebf9f75b	published	usr-dfb19537	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-08 03:23:25.887327
aal-c318e39b	org-bld-221b5760	asm-ebf9f75b	archived	usr-dfb19537	{"version": 1}	2026-10-08 03:23:26.116013
aal-6b527355	org-bld-465cc1fd	asm-fb821b55	created	usr-0421d754	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-f36b025f"}	2026-10-08 04:31:22.027835
aal-255b8939	org-bld-465cc1fd	asm-fb821b55	question_added	usr-0421d754	{"type": "mcq", "question_id": "mcq-821be67d"}	2026-10-08 04:31:22.254118
aal-2f6dfa01	org-bld-465cc1fd	asm-fb821b55	question_added	usr-0421d754	{"type": "coding", "question_id": "prob-d45b69d3"}	2026-10-08 04:31:22.302365
aal-cadf17ba	org-bld-465cc1fd	asm-fb821b55	reordered	usr-0421d754	{"count": 2}	2026-10-08 04:31:22.371979
aal-c78412b5	org-bld-465cc1fd	asm-fb821b55	published	usr-0421d754	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-08 04:31:22.450915
aal-087359ff	org-bld-465cc1fd	asm-fb821b55	archived	usr-0421d754	{"version": 1}	2026-10-08 04:31:22.564625
aal-5dac2d0d	org-bld-4087d76a	asm-98bc7d97	created	usr-39ef1dc0	{"title": "Senior Backend Technical Assessment", "job_id": "job-bld-596336b9"}	2026-10-08 08:35:12.378892
aal-43991998	org-bld-4087d76a	asm-98bc7d97	question_added	usr-39ef1dc0	{"type": "mcq", "question_id": "mcq-8182cfe2"}	2026-10-08 08:35:12.554068
aal-2463c394	org-bld-4087d76a	asm-98bc7d97	question_added	usr-39ef1dc0	{"type": "coding", "question_id": "prob-7b7f0dd7"}	2026-10-08 08:35:12.617302
aal-c7d09965	org-bld-4087d76a	asm-98bc7d97	reordered	usr-39ef1dc0	{"count": 2}	2026-10-08 08:35:12.693582
aal-5403bda3	org-bld-4087d76a	asm-98bc7d97	published	usr-39ef1dc0	{"version": 1, "total_mcqs": 1, "total_coding": 1}	2026-10-08 08:35:12.883515
aal-f6be8b0f	org-bld-4087d76a	asm-98bc7d97	archived	usr-39ef1dc0	{"version": 1}	2026-10-08 08:35:13.031907
aal-e98384c6	org-sparkx-default	asm-89f49ae8	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-react-hooks"}	2026-10-09 17:53:47.717779
aal-c73a36d0	org-sparkx-default	asm-89f49ae8	question_removed	usr-admin01	{"type": "mcq", "question_id": "mcq-react-hooks"}	2026-10-09 17:53:49.801377
aal-79699cf5	org-sparkx-default	asm-075f1d60	created	usr-admin01	{"title": "Role Assessment", "job_id": "job-5cd562"}	2026-10-09 18:00:41.552231
aal-4b9a19f5	org-sparkx-default	asm-075f1d60	question_added	usr-admin01	{"type": "mcq", "question_id": "mcq-aws-iam-least-privilege"}	2026-10-13 08:19:57.499338
\.


--
-- Data for Name: assessment_coding_problems; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_coding_problems (id, assessment_id, coding_problem_id, coding_problem_version_id, display_order, weight, is_required, created_at) FROM stdin;
acp-683899d9	asm-0de8dcf8	prob-d76120d9	cpv-d12ab5a7	1	50	t	2026-09-30 16:33:00.79177
acp-688e72ed	asm-0de8dcf8	prob-3879c7bb	\N	2	50	t	2026-09-30 16:33:00.791778
acp-bfc44f9b	asm-86bf8fb1	prob-cce465e5	cpv-23304087	1	50	t	2026-09-30 16:48:20.60979
acp-e268774d	asm-86bf8fb1	prob-9dd7f0ff	\N	2	50	t	2026-09-30 16:48:20.609794
acp-1a16bc6c	asm-b1ac189f	prob-97a99bea	cpv-3c10367a	1	50	t	2026-09-30 16:55:30.276615
acp-379a93ce	asm-b1ac189f	prob-9b13a0f8	\N	2	50	t	2026-09-30 16:55:30.276617
acp-f4a107fb	asm-a425024c	prob-20e517fe	cpv-26480d15	1	50	t	2026-09-30 17:29:13.570635
acp-7411bf89	asm-a425024c	prob-78c3b3cb	\N	2	50	t	2026-09-30 17:29:13.570642
acp-6f4d932f	asm-9f911120	prob-dfaa9cf5	cpv-b13b4e5b	1	50	t	2026-09-30 17:39:42.010965
acp-22485b6d	asm-9f911120	prob-5987d374	\N	2	50	t	2026-09-30 17:39:42.010968
acp-0295ad44	asm-1a726471	prob-596bf1d6	cpv-014be28d	1	50	t	2026-09-30 17:48:11.712239
acp-68f37b75	asm-1a726471	prob-3865b5b0	\N	2	50	t	2026-09-30 17:48:11.712242
acp-8e77ca61	asm-7d2ad281	prob-a1af1685	cpv-36afb933	1	50	t	2026-09-30 18:09:09.7643
acp-7a647674	asm-7d2ad281	prob-d1a6229c	\N	2	50	t	2026-09-30 18:09:09.764304
acp-7a669937	asm-8e278974	prob-41af94e1	cpv-5f08d900	1	50	t	2026-09-30 18:20:43.406354
acp-348473c0	asm-8e278974	prob-d7b11b52	\N	2	50	t	2026-09-30 18:20:43.406368
acp-355ce331	asm-b5ebc791	prob-94fb0155	cpv-f5ae4392	1	50	t	2026-09-30 18:37:24.194254
acp-05005e49	asm-b5ebc791	prob-947585b4	\N	2	50	t	2026-09-30 18:37:24.194257
acp-5957b137	asm-429e2663	prob-f0c880f7	cpv-8ec34730	1	50	t	2026-10-01 03:26:00.803957
acp-c500900a	asm-429e2663	prob-98575a07	\N	2	50	t	2026-10-01 03:26:00.80396
acp-2a1cea26	asm-f4f7c070	prob-257d0d23	cpv-d353d702	1	50	t	2026-10-01 03:33:04.699176
acp-2ddec506	asm-f4f7c070	prob-36a85962	\N	2	50	t	2026-10-01 03:33:04.699179
acp-66dcf265	asm-257ab699	prob-adce1497	cpv-5dca1956	1	50	t	2026-10-01 03:38:43.519794
acp-f0fc527b	asm-257ab699	prob-a7face02	\N	2	50	t	2026-10-01 03:38:43.519797
acp-4170ddd8	asm-39884349	prob-b7bf785d	cpv-4e346796	1	50	t	2026-10-01 03:46:43.835206
acp-f6ef1e34	asm-39884349	prob-d76120d9	\N	2	50	t	2026-10-01 03:46:43.83754
acp-151ef012	asm-551d3f47	prob-b333f700	cpv-ec53e69d	1	50	t	2026-10-01 03:48:43.003679
acp-970fb767	asm-551d3f47	prob-d76120d9	\N	2	50	t	2026-10-01 03:48:43.005788
acp-ddbce989	asm-6edb1e8f	prob-798451b6	cpv-8e9f8210	1	50	t	2026-10-01 03:54:24.35558
acp-bae20380	asm-6edb1e8f	prob-fbad295a	\N	2	50	t	2026-10-01 03:54:24.355582
acp-e09ce55d	asm-1ff68f6f	prob-4522f1dd	cpv-fe844897	1	50	t	2026-10-01 03:55:12.230515
acp-afc5808e	asm-1ff68f6f	prob-d76120d9	\N	2	50	t	2026-10-01 03:55:12.232083
acp-eb676d06	asm-5cb1fe0c	prob-c209bfae	cpv-2e25f091	1	50	t	2026-10-01 04:50:57.656589
acp-717a8db7	asm-5cb1fe0c	prob-58e7de18	\N	2	50	t	2026-10-01 04:50:57.656592
acp-86c9956c	asm-91a59a93	prob-4f75cb7b	cpv-37da72bd	1	50	t	2026-10-01 05:10:34.445416
acp-278bdfcf	asm-91a59a93	prob-d76120d9	\N	2	50	t	2026-10-01 05:10:34.452686
acp-261134de	asm-60518c	prob-69386c73	\N	1	60	t	2026-10-01 05:16:05.278103
acp-7bb91004	asm-60518c	prob-bdd819c1	\N	2	40	t	2026-10-01 05:16:05.278105
acp-1fac1e88	asm-5c3650	prob-a55994ac	\N	1	60	t	2026-10-01 05:16:56.331341
acp-0e20a689	asm-5c3650	prob-73061b1f	\N	2	40	t	2026-10-01 05:16:56.33135
acp-e947fd2b	asm-01cd69	prob-9d605df5	\N	1	60	t	2026-10-01 05:17:17.764639
acp-338d4617	asm-01cd69	prob-0b2113ae	\N	2	40	t	2026-10-01 05:17:17.764641
acp-de2b9a8e	asm-06dd16	prob-b4e081fc	\N	1	60	t	2026-10-01 05:17:38.383894
acp-2924745e	asm-06dd16	prob-adbddc32	\N	2	40	t	2026-10-01 05:17:38.383897
acp-ad8a82ec	asm-b8e4cf83	prob-494c81b2	cpv-c112c436	1	50	t	2026-10-01 05:28:52.832594
acp-48e5421c	asm-b8e4cf83	prob-2e2d2291	\N	2	50	t	2026-10-01 05:28:52.832597
acp-4a710f40	asm-75b3ac8d	prob-135ad7a5	cpv-1857024a	1	50	t	2026-10-01 05:29:24.684228
acp-502b701c	asm-75b3ac8d	prob-d76120d9	\N	2	50	t	2026-10-01 05:29:24.686012
acp-bb03b0f6	asm-f509fe	prob-dca6e531	\N	1	60	t	2026-10-01 05:29:28.574694
acp-8c9f5f9c	asm-f509fe	prob-b6ad9ef9	\N	2	40	t	2026-10-01 05:29:28.574696
acp-21cf2ea4	asm-153351c2	prob-bb662231	cpv-84766e54	1	50	t	2026-10-04 06:29:19.72027
acp-940836a2	asm-153351c2	prob-f61b11a9	\N	2	50	t	2026-10-04 06:29:19.720282
acp-5da124ef	asm-b6875782	prob-63d4c9cb	cpv-46eb8eca	1	50	t	2026-10-04 06:29:54.10508
acp-a62bd51e	asm-b6875782	prob-d76120d9	\N	2	50	t	2026-10-04 06:29:54.108024
acp-4d5c9ba5	asm-2de3d7	prob-e1007f9a	\N	1	60	t	2026-10-04 06:29:58.369806
acp-f4780df7	asm-2de3d7	prob-969f89d2	\N	2	40	t	2026-10-04 06:29:58.369811
acp-b118fdf8	asm-c5e55f19	prob-8090ddc9	cpv-14e673e1	1	50	t	2026-10-04 06:46:24.025025
acp-1a7b1506	asm-c5e55f19	prob-f7ce6a48	\N	2	50	t	2026-10-04 06:46:24.025028
acp-0e4f9bba	asm-aedc3b3f	prob-e3ab629f	cpv-c711fb32	1	50	t	2026-10-04 06:46:57.156424
acp-d617c353	asm-aedc3b3f	prob-d76120d9	\N	2	50	t	2026-10-04 06:46:57.15857
acp-6fd610b0	asm-07bec8	prob-ff4b43c5	\N	1	60	t	2026-10-04 06:47:01.195135
acp-1b769dc7	asm-07bec8	prob-0cf1c145	\N	2	40	t	2026-10-04 06:47:01.195137
acp-43da1068	asm-3323f4c5	prob-91aac793	cpv-45e998a7	1	50	t	2026-10-04 07:09:49.940666
acp-3ba01545	asm-3323f4c5	prob-52873358	\N	2	50	t	2026-10-04 07:09:49.940669
acp-8e83b1da	asm-0d25dbd7	prob-38c4271f	cpv-36fb4b40	1	50	t	2026-10-04 07:10:29.386434
acp-8d20bd7f	asm-0d25dbd7	prob-d76120d9	\N	2	50	t	2026-10-04 07:10:29.388124
acp-61f0c14a	asm-36c704	prob-8964a623	\N	1	60	t	2026-10-04 07:10:33.402278
acp-f3c1b4f1	asm-36c704	prob-9f1555bf	\N	2	40	t	2026-10-04 07:10:33.40228
acp-ba45ea17	asm-f4c74cfc	prob-2f1add36	cpv-bed20b69	1	50	t	2026-10-04 07:43:15.249819
acp-c7071cdd	asm-f4c74cfc	prob-95722abf	\N	2	50	t	2026-10-04 07:43:15.249823
acp-c4f60792	asm-49ac45ea	prob-91d54784	cpv-d4abe139	1	50	t	2026-10-04 07:43:51.423664
acp-38e2d6ef	asm-49ac45ea	prob-d76120d9	\N	2	50	t	2026-10-04 07:43:51.42683
acp-af5c9881	asm-4c753f	prob-38d3c4ca	\N	1	60	t	2026-10-04 07:43:56.375226
acp-3c1de28a	asm-4c753f	prob-b6780273	\N	2	40	t	2026-10-04 07:43:56.37523
acp-00e71bcb	asm-acc6eb4f	prob-ee5adf4d	cpv-01db32a7	1	50	t	2026-10-04 08:12:35.110955
acp-0a97827a	asm-acc6eb4f	prob-37c5fccf	\N	2	50	t	2026-10-04 08:12:35.110958
acp-d75593bd	asm-b55ae644	prob-388107c0	cpv-abdb1444	1	50	t	2026-10-04 08:13:11.274799
acp-5d42e95b	asm-b55ae644	prob-d76120d9	\N	2	50	t	2026-10-04 08:13:11.27764
acp-139536ec	asm-74a76f	prob-c6686b57	\N	1	60	t	2026-10-04 08:13:16.060304
acp-6e0dd27f	asm-74a76f	prob-ca36cf28	\N	2	40	t	2026-10-04 08:13:16.060307
acp-e593d0df	asm-41b96d37	prob-98c11bf2	cpv-4228908e	1	50	t	2026-10-04 08:15:25.626471
acp-d07301af	asm-41b96d37	prob-c2ebc14f	\N	2	50	t	2026-10-04 08:15:25.626474
acp-4af9d5fe	asm-4e859760	prob-b9dfa6aa	cpv-d408aede	1	50	t	2026-10-04 08:16:00.364849
acp-bdf88d06	asm-4e859760	prob-d76120d9	\N	2	50	t	2026-10-04 08:16:00.366909
acp-23d74138	asm-599463	prob-dcdeaa04	\N	1	60	t	2026-10-04 08:16:05.54377
acp-e04c0f39	asm-599463	prob-a53035e9	\N	2	40	t	2026-10-04 08:16:05.543773
acp-6802eb8d	asm-d1b77486	prob-4193c980	cpv-ea4c7ab9	1	50	t	2026-10-04 08:22:42.893399
acp-b5c1d9f8	asm-d1b77486	prob-e72812aa	\N	2	50	t	2026-10-04 08:22:42.893403
acp-fcfb741b	asm-81b6603f	prob-19a521b1	cpv-73ab3fab	1	50	t	2026-10-04 08:23:21.098443
acp-61374942	asm-81b6603f	prob-d76120d9	\N	2	50	t	2026-10-04 08:23:21.107744
acp-a8c35855	asm-4fe259	prob-3a4faade	\N	1	60	t	2026-10-04 08:23:32.237756
acp-c897bd76	asm-4fe259	prob-e4e940d8	\N	2	40	t	2026-10-04 08:23:32.237767
acp-ea0ccdb3	asm-f2be8b47	prob-241e6856	\N	1	80	t	2026-10-06 15:41:02.353844
acp-a63e66d4	asm-2406aaf8	prob-c22a7e23	\N	1	80	t	2026-10-06 15:42:05.433939
acp-39494668	asm-d14f8e40	prob-602d07cc	\N	1	80	t	2026-10-06 15:45:28.93629
acp-639c2187	asm-1d0babd8	prob-1cd64002	\N	1	80	t	2026-10-06 15:53:34.404489
acp-feeedba9	asm-077a3c73	prob-43de42ab	\N	1	80	t	2026-10-06 16:08:12.598058
acp-908e1442	asm-d41d4fee	prob-514d12d4	\N	1	80	t	2026-10-06 16:26:31.028763
acp-3b2ed110	asm-3f68a9c1	prob-022fb13c	\N	1	80	t	2026-10-06 16:51:46.068385
acp-7db43454	asm-8376331e	prob-6d52a924	\N	1	80	t	2026-10-07 03:44:51.650113
acp-458b6406	asm-3c9cd23c	prob-43a8cc0c	\N	1	80	t	2026-10-07 03:50:08.534286
acp-90051392	asm-f400657d	prob-6bd8fe28	cpv-d300890e	1	50	t	2026-10-07 04:17:44.160137
acp-ad44b033	asm-f400657d	prob-23a76d94	\N	2	50	t	2026-10-07 04:17:44.16014
acp-d2760d75	asm-c42b2db7	prob-655978f3	cpv-212301f0	1	50	t	2026-10-07 04:17:54.093531
acp-58a4ef33	asm-c42b2db7	prob-d76120d9	\N	2	50	t	2026-10-07 04:17:54.098797
acp-5cdc1a64	asm-e7b07e	prob-971d3f13	\N	1	60	t	2026-10-07 04:17:59.317386
acp-aa206a8f	asm-e7b07e	prob-11996613	\N	2	40	t	2026-10-07 04:17:59.317389
acp-bee90c2d	asm-5486c8d2	prob-73dc970c	\N	1	80	t	2026-10-07 04:19:26.486787
acp-5f931a57	asm-aebc20	prob-789a60db	\N	1	60	t	2026-10-07 05:01:14.334532
acp-bf167c41	asm-aebc20	prob-fafbb6e4	\N	2	40	t	2026-10-07 05:01:14.334537
acp-42ed970a	asm-17a35e	prob-d8bfacfe	\N	1	60	t	2026-10-07 05:10:21.475353
acp-8736249d	asm-17a35e	prob-f00fa4ae	\N	2	40	t	2026-10-07 05:10:21.475355
acp-fe7fb832	asm-46fcf07c	prob-0eeaad3d	cpv-8e869edb	1	50	t	2026-10-07 05:16:41.761412
acp-15df6c5c	asm-46fcf07c	prob-98ab70fc	\N	2	50	t	2026-10-07 05:16:41.761415
acp-4bee395a	asm-5ba16443	prob-ef709f17	cpv-2388563e	1	50	t	2026-10-07 05:16:50.8827
acp-bb909386	asm-5ba16443	prob-d76120d9	\N	2	50	t	2026-10-07 05:16:50.884196
acp-39ca23b4	asm-98268c	prob-75bfd2e7	\N	1	60	t	2026-10-07 05:16:55.831183
acp-b684995f	asm-98268c	prob-ea9cdf0b	\N	2	40	t	2026-10-07 05:16:55.831185
acp-4106e582	asm-1effe538	prob-e63cc727	\N	1	80	t	2026-10-07 05:18:29.719404
acp-5dedec83	asm-1ca8594b	prob-86eeca7f	cpv-14db15c5	1	50	t	2026-10-08 03:21:16.07008
acp-e68585b7	asm-1ca8594b	prob-e188a2f8	\N	2	50	t	2026-10-08 03:21:16.070083
acp-011e5f94	asm-ec19c0d2	prob-310cba66	cpv-d1cccf53	1	50	t	2026-10-08 03:21:26.365675
acp-2382da6e	asm-ec19c0d2	prob-d76120d9	\N	2	50	t	2026-10-08 03:21:26.367695
acp-3b92d595	asm-eb88fe	prob-c7feddd6	\N	1	60	t	2026-10-08 03:21:32.276807
acp-22cd7b33	asm-eb88fe	prob-26152780	\N	2	40	t	2026-10-08 03:21:32.276813
acp-91a2d623	asm-ebf9f75b	prob-b5bec3ae	\N	1	80	t	2026-10-08 03:23:25.66572
acp-0e748c4e	asm-9cbe81b8	prob-15741b01	cpv-7cedcf11	1	50	t	2026-10-08 04:27:52.7135
acp-1ee0a894	asm-9cbe81b8	prob-b1479441	\N	2	50	t	2026-10-08 04:27:52.713508
acp-eb0e23e5	asm-b399f8fd	prob-ecece3d4	cpv-74d62e60	1	50	t	2026-10-08 04:28:39.90483
acp-fce6e149	asm-b399f8fd	prob-d76120d9	\N	2	50	t	2026-10-08 04:28:39.908107
acp-1f8f7631	asm-412b98	prob-65f4c8c7	\N	1	60	t	2026-10-08 04:28:47.985055
acp-6a8a8040	asm-412b98	prob-4ee07061	\N	2	40	t	2026-10-08 04:28:47.985058
acp-e8a26135	asm-fb821b55	prob-d45b69d3	\N	1	80	t	2026-10-08 04:31:22.304859
acp-b9347eb8	asm-1d88d467	prob-673e17c7	cpv-3b51547e	1	50	t	2026-10-08 08:31:22.409347
acp-bb72250a	asm-1d88d467	prob-6ce8bc20	\N	2	50	t	2026-10-08 08:31:22.40935
acp-62c36824	asm-e3364896	prob-2ea39745	cpv-6a4100e5	1	50	t	2026-10-08 08:32:08.713584
acp-1a36e111	asm-e3364896	prob-d76120d9	\N	2	50	t	2026-10-08 08:32:08.716388
acp-789e23d3	asm-6ac6ee	prob-949a1c9b	\N	1	60	t	2026-10-08 08:32:15.605141
acp-8408b333	asm-6ac6ee	prob-37d7c3c9	\N	2	40	t	2026-10-08 08:32:15.605145
acp-4fc777c0	asm-98bc7d97	prob-7b7f0dd7	\N	1	80	t	2026-10-08 08:35:12.619667
acp-80013e49	asm-dfedec	prob-54909183	\N	1	60	t	2026-10-08 08:59:47.200436
acp-558811ef	asm-dfedec	prob-12b46bc8	\N	2	40	t	2026-10-08 08:59:47.200445
\.


--
-- Data for Name: assessment_mcq_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_mcq_questions (id, assessment_id, mcq_question_id, display_order, weight, is_required, created_at) FROM stdin;
amcq-e6fe3112	asm-bd393ce2	mcq-py-gil	1	2	t	2026-10-04 07:04:47.930549
amcq-2cec6ed1	asm-bd393ce2	mcq-ba723bd5	2	3	t	2026-10-04 07:04:47.930552
amcq-32eb5096	asm-930d93ef	mcq-py-gil	1	2	t	2026-10-04 07:05:23.630721
amcq-d427c81b	asm-930d93ef	mcq-a5b70895	2	3	t	2026-10-04 07:05:23.630723
amcq-4baaa564	asm-10b226db	mcq-py-gil	1	1	t	2026-10-04 07:05:23.809744
amcq-1af4fd7a	asm-10b226db	mcq-86dd0b9c	2	1	t	2026-10-04 07:05:23.809747
amcq-19d10d03	asm-c0b76d02	mcq-py-gil	1	1	t	2026-10-04 07:05:25.075223
amcq-61eb4f8f	asm-b7e16dfc	mcq-py-gil	1	2	t	2026-10-04 07:05:56.664897
amcq-9d478f38	asm-b7e16dfc	mcq-f21a5d73	2	3	t	2026-10-04 07:05:56.6649
amcq-7d9321c8	asm-cf126333	mcq-py-gil	1	1	t	2026-10-04 07:05:56.785995
amcq-cb494ef6	asm-cf126333	mcq-d86cd5c1	2	1	t	2026-10-04 07:05:56.785997
amcq-910ee49f	asm-855ac91b	mcq-py-gil	1	1	t	2026-10-04 07:05:57.83473
amcq-ba078fa0	asm-0db80194	mcq-py-gil	1	2	t	2026-10-04 07:07:09.348717
amcq-7b74c663	asm-0db80194	mcq-b487ed2c	2	3	t	2026-10-04 07:07:09.34872
amcq-3a775929	asm-5b45b359	mcq-py-gil	1	1	t	2026-10-04 07:07:09.470811
amcq-31d90c03	asm-5b45b359	mcq-d068a9c4	2	1	t	2026-10-04 07:07:09.470813
amcq-5d19326a	asm-25caf944	mcq-py-gil	1	1	t	2026-10-04 07:07:10.565773
amcq-11b28f75	asm-64a0ea4b	mcq-py-gil	1	1	t	2026-10-04 07:07:14.029853
amcq-7384d624	asm-382b0587	mcq-4a38fde4	1	1	t	2026-10-04 07:07:16.312192
amcq-1fdf615a	asm-c9369f30	mcq-py-gil	1	2	t	2026-10-04 07:07:40.568194
amcq-59bf9251	asm-c9369f30	mcq-e5e3a317	2	3	t	2026-10-04 07:07:40.568197
amcq-261c9376	asm-502772d2	mcq-py-gil	1	1	t	2026-10-04 07:07:40.672488
amcq-3ad303e5	asm-502772d2	mcq-8ab5d489	2	1	t	2026-10-04 07:07:40.672491
amcq-82512025	asm-6e80d515	mcq-py-gil	1	1	t	2026-10-04 07:07:42.053872
amcq-1b8c031d	asm-9052f576	mcq-py-gil	1	1	t	2026-10-04 07:07:45.719099
amcq-fcce178b	asm-835b69a3	mcq-e79d273e	1	1	t	2026-10-04 07:07:48.168819
amcq-03a058e0	asm-87fc6f76	mcq-py-gil	1	2	t	2026-10-04 07:10:40.520511
amcq-d6d4ac11	asm-87fc6f76	mcq-37acb184	2	3	t	2026-10-04 07:10:40.520513
amcq-10896891	asm-2de486ea	mcq-py-gil	1	1	t	2026-10-04 07:10:40.635763
amcq-56f111f9	asm-2de486ea	mcq-f03ece41	2	1	t	2026-10-04 07:10:40.635765
amcq-817edc3e	asm-4a39b437	mcq-py-gil	1	1	t	2026-10-04 07:10:41.809682
amcq-8dff03dc	asm-8fe763ce	mcq-py-gil	1	1	t	2026-10-04 07:10:45.204488
amcq-8d553f16	asm-502310a9	mcq-5e594f6c	1	1	t	2026-10-04 07:10:47.527356
amcq-67caac6a	asm-9707f7b2	mcq-py-gil	1	2	t	2026-10-04 07:44:05.760201
amcq-37427765	asm-9707f7b2	mcq-df1b3d12	2	3	t	2026-10-04 07:44:05.760207
amcq-419c6b92	asm-1e96134e	mcq-py-gil	1	1	t	2026-10-04 07:44:06.045874
amcq-325dfc15	asm-1e96134e	mcq-e85365e9	2	1	t	2026-10-04 07:44:06.045886
amcq-657ed51b	asm-c556d554	mcq-py-gil	1	1	t	2026-10-04 07:44:07.317635
amcq-b558c97c	asm-6b986719	mcq-py-gil	1	1	t	2026-10-04 07:44:10.690829
amcq-04cdd641	asm-b94ea1ae	mcq-7f4113a1	1	1	t	2026-10-04 07:44:12.895631
amcq-35da138f	asm-86d5494a	mcq-py-gil	1	2	t	2026-10-04 08:13:26.770398
amcq-74ca09ab	asm-86d5494a	mcq-b431394f	2	3	t	2026-10-04 08:13:26.770402
amcq-51414183	asm-9a6cf34c	mcq-py-gil	1	1	t	2026-10-04 08:13:27.212308
amcq-1d20007c	asm-9a6cf34c	mcq-12ad3d9c	2	1	t	2026-10-04 08:13:27.212311
amcq-184bb01e	asm-7f6b2fd2	mcq-py-gil	1	1	t	2026-10-04 08:13:28.394115
amcq-ad258a58	asm-986b96a6	mcq-py-gil	1	1	t	2026-10-04 08:13:32.169748
amcq-8528ae3e	asm-2828bfc3	mcq-25cfcd8f	1	1	t	2026-10-04 08:13:34.602002
amcq-2bfed8ea	asm-aedf36c7	mcq-py-gil	1	2	t	2026-10-04 08:16:16.705792
amcq-f350cf6d	asm-aedf36c7	mcq-273b1460	2	3	t	2026-10-04 08:16:16.7058
amcq-a08582a2	asm-ee40b66c	mcq-py-gil	1	1	t	2026-10-04 08:16:17.023304
amcq-e5283b8e	asm-ee40b66c	mcq-977e5347	2	1	t	2026-10-04 08:16:17.023307
amcq-0998bcf6	asm-c1abb8c4	mcq-py-gil	1	1	t	2026-10-04 08:16:18.499
amcq-be458b58	asm-e2a3bc6f	mcq-py-gil	1	1	t	2026-10-04 08:16:22.1771
amcq-2ba764b6	asm-678602ea	mcq-a3a2db61	1	1	t	2026-10-04 08:16:24.447793
amcq-989b72ac	asm-8c81ace5	mcq-py-gil	1	2	t	2026-10-04 08:23:53.720347
amcq-87e6228c	asm-8c81ace5	mcq-c25f78ca	2	3	t	2026-10-04 08:23:53.72036
amcq-a2ead9a2	asm-4ccbe759	mcq-py-gil	1	1	t	2026-10-04 08:23:54.536809
amcq-f24c1b27	asm-4ccbe759	mcq-4bcc8434	2	1	t	2026-10-04 08:23:54.536827
amcq-19795a18	asm-7c6d28c9	mcq-py-gil	1	1	t	2026-10-04 08:23:57.473369
amcq-6bc32fcd	asm-63142c09	mcq-py-gil	1	1	t	2026-10-04 08:24:01.615175
amcq-03a77699	asm-e6922d09	mcq-8023be9a	1	1	t	2026-10-04 08:24:04.316796
amcq-061265ff	asm-b864669b	mcq-py-gil	1	2	t	2026-10-04 15:11:00.057836
amcq-87a2fdcc	asm-b864669b	mcq-d3a4b772	2	3	t	2026-10-04 15:11:00.057846
amcq-24de2b74	asm-99352276	mcq-py-gil	1	1	t	2026-10-04 15:11:00.555393
amcq-8a8df7e8	asm-99352276	mcq-dfe3b50a	2	1	t	2026-10-04 15:11:00.555409
amcq-5074d386	asm-2ceda548	mcq-py-gil	1	1	t	2026-10-04 15:11:01.914084
amcq-101b16d8	asm-a353d70f	mcq-py-gil	1	1	t	2026-10-04 15:11:05.402535
amcq-7a29d60c	asm-e2597096	mcq-a37e6d7b	1	1	t	2026-10-04 15:11:08.083625
amcq-3ca7c05e	asm-335d9a3f	mcq-py-gil	1	2	t	2026-10-05 03:25:20.365854
amcq-f1ee0874	asm-335d9a3f	mcq-1886e4ab	2	3	t	2026-10-05 03:25:20.365862
amcq-f3aa7e85	asm-c9d09119	mcq-py-gil	1	1	t	2026-10-05 03:25:20.672608
amcq-4b1c8036	asm-c9d09119	mcq-abe0a779	2	1	t	2026-10-05 03:25:20.672612
amcq-71b59513	asm-748cd038	mcq-py-gil	1	1	t	2026-10-05 03:25:22.076213
amcq-a53a73bb	asm-8574ac74	mcq-py-gil	1	1	t	2026-10-05 03:25:25.865016
amcq-f61a7f4e	asm-856a4ad8	mcq-146682b9	1	1	t	2026-10-05 03:25:28.461028
amcq-a68e60c1	asm-c07ad409	mcq-py-gil	1	1	t	2026-10-05 04:08:05.425576
amcq-da1726e4	asm-c07ad409	mcq-6ff37998	2	1	t	2026-10-05 04:08:05.425581
amcq-d5c389af	asm-62c18c09	mcq-py-gil	1	2	t	2026-10-05 04:39:19.399966
amcq-4d9f2098	asm-62c18c09	mcq-e15e7499	2	3	t	2026-10-05 04:39:19.399969
amcq-bf6dd9af	asm-145e49d9	mcq-py-gil	1	1	t	2026-10-05 04:39:19.506804
amcq-84f7c028	asm-145e49d9	mcq-5da74e40	2	1	t	2026-10-05 04:39:19.506807
amcq-addbcc75	asm-2d9366a4	mcq-py-gil	1	1	t	2026-10-05 04:39:20.899892
amcq-ce5f8cf4	asm-39e12638	mcq-py-gil	1	2	t	2026-10-05 04:40:05.826189
amcq-05abdaae	asm-39e12638	mcq-32654713	2	3	t	2026-10-05 04:40:05.826192
amcq-c1ba8716	asm-b30466ea	mcq-py-gil	1	1	t	2026-10-05 04:40:05.940578
amcq-97f404ef	asm-b30466ea	mcq-4697403e	2	1	t	2026-10-05 04:40:05.940581
amcq-8e519f5d	asm-9d152b10	mcq-py-gil	1	1	t	2026-10-05 04:40:07.24269
amcq-e98ebd8e	asm-c3a7bf3f	mcq-py-gil	1	1	t	2026-10-05 04:56:33.92544
amcq-3baf45bf	asm-c3a7bf3f	mcq-04c2d67f	2	1	t	2026-10-05 04:56:33.925447
amcq-4f6dc031	asm-f671da01	mcq-py-gil	1	2	t	2026-10-05 04:56:47.602742
amcq-7a2268e4	asm-f671da01	mcq-4fff68a6	2	3	t	2026-10-05 04:56:47.602744
amcq-aa68066f	asm-f0ebb648	mcq-py-gil	1	1	t	2026-10-05 04:56:47.697175
amcq-7eefcd92	asm-f0ebb648	mcq-04cbddc1	2	1	t	2026-10-05 04:56:47.697177
amcq-903a582b	asm-a950d1a6	mcq-py-gil	1	1	t	2026-10-05 04:56:48.770553
amcq-43fb7dab	asm-ab876e94	mcq-py-gil	1	2	t	2026-10-05 04:58:40.911871
amcq-3a412f60	asm-ab876e94	mcq-5558088b	2	3	t	2026-10-05 04:58:40.911873
amcq-7ab5ebcb	asm-77e6a387	mcq-py-gil	1	1	t	2026-10-05 04:58:41.01094
amcq-17e29dd3	asm-77e6a387	mcq-7b9f04e9	2	1	t	2026-10-05 04:58:41.010942
amcq-6ca801d2	asm-249dca0f	mcq-py-gil	1	1	t	2026-10-05 04:58:41.992789
amcq-424e6901	asm-bd681cdb	mcq-py-gil	1	1	t	2026-10-05 04:58:45.122888
amcq-a6cd60e5	asm-271478e7	mcq-900a4470	1	1	t	2026-10-05 04:58:47.508437
amcq-6813f397	asm-4d64b637	mcq-py-gil	1	1	t	2026-10-06 03:29:14.590847
amcq-adbc5516	asm-4d64b637	mcq-7ebb40f6	2	1	t	2026-10-06 03:29:14.590853
amcq-fc7a7529	asm-185d7d03	mcq-py-gil	1	1	t	2026-10-06 03:45:12.294694
amcq-3b3452e5	asm-185d7d03	mcq-d0dca3d8	2	1	t	2026-10-06 03:45:12.294703
amcq-8b60b46c	asm-7f061759	mcq-py-gil	1	1	t	2026-10-06 05:31:43.913771
amcq-bcab4031	asm-7f061759	mcq-2e1cba9f	2	1	t	2026-10-06 05:31:43.913777
amcq-cb37d85f	asm-f2be8b47	mcq-d634a99e	2	20	t	2026-10-06 15:41:02.246502
amcq-d0182e5a	asm-2406aaf8	mcq-4771ab31	2	20	t	2026-10-06 15:42:05.382771
amcq-e60bc81c	asm-626c4819	mcq-py-gil	1	1	t	2026-10-06 15:42:59.742435
amcq-568ca278	asm-626c4819	mcq-4a7ec242	2	1	t	2026-10-06 15:42:59.74244
amcq-dbe7ce9a	asm-a3fc7214	mcq-py-gil	1	1	t	2026-10-06 15:45:14.11395
amcq-338acfd2	asm-a3fc7214	mcq-f0ec8ae8	2	1	t	2026-10-06 15:45:14.113955
amcq-cad1b833	asm-d14f8e40	mcq-96216456	2	20	t	2026-10-06 15:45:28.87433
amcq-c39e2565	asm-1d0babd8	mcq-6a5e24b9	2	20	t	2026-10-06 15:53:34.347629
amcq-79fe47f1	asm-d2296e74	mcq-py-gil	1	1	t	2026-10-06 15:54:24.36942
amcq-f0a2b1c7	asm-d2296e74	mcq-3dce9ed7	2	1	t	2026-10-06 15:54:24.369426
amcq-3423ff2c	asm-077a3c73	mcq-3ad66834	2	20	t	2026-10-06 16:08:12.416586
amcq-93e6285d	asm-d41d4fee	mcq-1fca480e	2	20	t	2026-10-06 16:26:30.937091
amcq-3fab1f61	asm-3f68a9c1	mcq-fb50dfd2	2	20	t	2026-10-06 16:51:45.930936
amcq-1527036c	asm-3b05c858	mcq-fin-rev-rec	1	1	t	2026-10-07 03:40:19.799146
amcq-9067ff86	asm-3b05c858	mcq-fin-audit-risk	2	1	t	2026-10-07 03:40:20.729123
amcq-a5821dab	asm-3b05c858	mcq-fin-sox404-weakness	3	1	t	2026-10-07 03:40:21.736712
amcq-7218a2c9	asm-3b05c858	mcq-fin-variance-ebitda	4	1	t	2026-10-07 03:40:23.941561
amcq-a2664e2e	asm-8376331e	mcq-d3628f23	2	20	t	2026-10-07 03:44:51.583444
amcq-5fd57b83	asm-3c9cd23c	mcq-8873b8ef	2	20	t	2026-10-07 03:50:08.436037
amcq-4b3290ec	asm-79857ec4	mcq-py-gil	1	2	t	2026-10-07 04:18:09.027851
amcq-82628c22	asm-79857ec4	mcq-8f319afe	2	3	t	2026-10-07 04:18:09.027854
amcq-716dc0b7	asm-598085f3	mcq-py-gil	1	1	t	2026-10-07 04:18:09.165467
amcq-2d138fcd	asm-598085f3	mcq-cfbe2b92	2	1	t	2026-10-07 04:18:09.16547
amcq-79a7c6b1	asm-b77d9549	mcq-py-gil	1	1	t	2026-10-07 04:18:10.995725
amcq-ffecc0a6	asm-612dcef9	mcq-py-gil	1	1	t	2026-10-07 04:18:15.674916
amcq-f5f79758	asm-63fd69a8	mcq-85b27bf0	1	1	t	2026-10-07 04:18:18.386169
amcq-f456d0c6	asm-c013768e	mcq-py-gil	1	1	t	2026-10-07 04:19:01.984429
amcq-b2ec01f1	asm-c013768e	mcq-ba0eb850	2	1	t	2026-10-07 04:19:01.984477
amcq-1d691478	asm-5486c8d2	mcq-659280cb	2	20	t	2026-10-07 04:19:26.442614
amcq-444b656a	asm-b66e8345	mcq-py-gil	1	2	t	2026-10-07 05:17:05.093934
amcq-2ff837d7	asm-b66e8345	mcq-a93cab74	2	3	t	2026-10-07 05:17:05.093937
amcq-1c39ef05	asm-36d6cd0d	mcq-py-gil	1	1	t	2026-10-07 05:17:05.198398
amcq-44c679a7	asm-36d6cd0d	mcq-3f6148d2	2	1	t	2026-10-07 05:17:05.1984
amcq-45cdc1a2	asm-50ce9e91	mcq-py-gil	1	1	t	2026-10-07 05:17:07.011417
amcq-e28a8808	asm-58184ad1	mcq-py-gil	1	1	t	2026-10-07 05:17:11.592194
amcq-ab9768fa	asm-b6673e8a	mcq-6a55e1f6	1	1	t	2026-10-07 05:17:14.581809
amcq-31e77769	asm-2bcc9abc	mcq-py-gil	1	1	t	2026-10-07 05:18:05.263189
amcq-10a4588a	asm-2bcc9abc	mcq-a65de4b8	2	1	t	2026-10-07 05:18:05.263196
amcq-c0f1238a	asm-1effe538	mcq-4c7ce843	2	20	t	2026-10-07 05:18:29.66232
amcq-9d99ff0a	asm-051e52c4	mcq-py-gil	1	2	t	2026-10-08 03:21:42.939201
amcq-a9e8dd4e	asm-051e52c4	mcq-734aec55	2	3	t	2026-10-08 03:21:42.939204
amcq-373937b6	asm-563e463c	mcq-py-gil	1	1	t	2026-10-08 03:21:43.044633
amcq-3cb6d62e	asm-563e463c	mcq-28821ab9	2	1	t	2026-10-08 03:21:43.044635
amcq-4db5390a	asm-5fd54194	mcq-py-gil	1	1	t	2026-10-08 03:21:43.994021
amcq-b0ccc802	asm-f3624d58	mcq-py-gil	1	1	t	2026-10-08 03:21:47.60839
amcq-0a5d35e1	asm-8c12fb84	mcq-64117aa4	1	1	t	2026-10-08 03:21:50.378544
amcq-60d12247	asm-9cccd064	mcq-py-gil	1	1	t	2026-10-08 03:22:54.788823
amcq-9f4f9bc4	asm-9cccd064	mcq-b6893cbe	2	1	t	2026-10-08 03:22:54.788836
amcq-45c72045	asm-ebf9f75b	mcq-215d2dc4	2	20	t	2026-10-08 03:23:25.561726
amcq-ded85cd3	asm-4849e6d8	mcq-py-gil	1	2	t	2026-10-08 04:29:02.636062
amcq-9655be17	asm-4849e6d8	mcq-c3b5d8ee	2	3	t	2026-10-08 04:29:02.636065
amcq-842fdd84	asm-246bae88	mcq-py-gil	1	1	t	2026-10-08 04:29:02.79502
amcq-3fa2c9df	asm-246bae88	mcq-98935e91	2	1	t	2026-10-08 04:29:02.795026
amcq-09ed81f7	asm-76726ebb	mcq-py-gil	1	1	t	2026-10-08 04:29:04.383231
amcq-107cf2ea	asm-1b189f88	mcq-py-gil	1	1	t	2026-10-08 04:29:10.69867
amcq-bb24d328	asm-f6ca33e1	mcq-e84cf1eb	1	1	t	2026-10-08 04:29:13.571192
amcq-bb3d81fb	asm-ee327261	mcq-py-gil	1	1	t	2026-10-08 04:30:43.940607
amcq-cdc48b61	asm-ee327261	mcq-8921a476	2	1	t	2026-10-08 04:30:43.940609
amcq-14224fae	asm-fb821b55	mcq-821be67d	2	20	t	2026-10-08 04:31:22.256824
amcq-59c8c535	asm-8241d4e5	mcq-py-gil	1	2	t	2026-10-08 08:32:27.652408
amcq-fcdbea17	asm-8241d4e5	mcq-7179f078	2	3	t	2026-10-08 08:32:27.652414
amcq-375d4302	asm-e9973feb	mcq-py-gil	1	1	t	2026-10-08 08:32:27.855223
amcq-59f6d301	asm-e9973feb	mcq-59308555	2	1	t	2026-10-08 08:32:27.855229
amcq-4578d230	asm-6e1dbd95	mcq-py-gil	1	1	t	2026-10-08 08:32:29.283804
amcq-b00794fc	asm-0b238938	mcq-py-gil	1	1	t	2026-10-08 08:32:32.791598
amcq-adf5c13b	asm-edea2991	mcq-307fd8c8	1	1	t	2026-10-08 08:32:35.480227
amcq-844c06fd	asm-5e1ec400	mcq-py-gil	1	1	t	2026-10-08 08:34:09.665102
amcq-c5340d22	asm-5e1ec400	mcq-c1516133	2	1	t	2026-10-08 08:34:09.665105
amcq-754c2e52	asm-98bc7d97	mcq-8182cfe2	2	20	t	2026-10-08 08:35:12.557357
amcq-a9c2e09d	asm-075f1d60	mcq-aws-iam-least-privilege	1	1	t	2026-10-13 08:19:57.564386
\.


--
-- Data for Name: assessment_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_sections (id, assessment_id, title, section_type, display_order, weight_percentage, config, created_at, updated_at) FROM stdin;
sec-ded465ec	asm-0de8dcf8	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 16:33:00.715493	2026-09-30 16:33:00.715499
sec-779d5064	asm-0de8dcf8	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 16:33:00.715501	2026-09-30 16:33:00.715503
sec-4e68e528	asm-0de8dcf8	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 16:33:00.715505	2026-09-30 16:33:00.715506
sec-45724ad4	asm-0de8dcf8	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 16:33:00.715508	2026-09-30 16:33:00.71551
sec-2398170c	asm-86bf8fb1	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 16:48:20.581263	2026-09-30 16:48:20.581266
sec-310ce29b	asm-86bf8fb1	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 16:48:20.581267	2026-09-30 16:48:20.581268
sec-848dd294	asm-86bf8fb1	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 16:48:20.581269	2026-09-30 16:48:20.58127
sec-bc514bb1	asm-86bf8fb1	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 16:48:20.581271	2026-09-30 16:48:20.581272
sec-9a5bfaed	asm-b1ac189f	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 16:55:30.230311	2026-09-30 16:55:30.230317
sec-e9af2c2d	asm-b1ac189f	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 16:55:30.23032	2026-09-30 16:55:30.230325
sec-e1c3d5e4	asm-b1ac189f	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 16:55:30.230327	2026-09-30 16:55:30.23033
sec-d2793cfc	asm-b1ac189f	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 16:55:30.230331	2026-09-30 16:55:30.230333
sec-e05ffe84	asm-a425024c	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 17:29:13.506666	2026-09-30 17:29:13.50667
sec-8e0d3066	asm-a425024c	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 17:29:13.506672	2026-09-30 17:29:13.506673
sec-0a85d062	asm-a425024c	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 17:29:13.506675	2026-09-30 17:29:13.506676
sec-6e1f93b5	asm-a425024c	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 17:29:13.506677	2026-09-30 17:29:13.506678
sec-1ca4e4f6	asm-9f911120	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 17:39:41.984156	2026-09-30 17:39:41.984162
sec-6ee778fb	asm-9f911120	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 17:39:41.984163	2026-09-30 17:39:41.984164
sec-7ab022c6	asm-9f911120	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 17:39:41.984166	2026-09-30 17:39:41.984167
sec-cd6f16f6	asm-9f911120	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 17:39:41.984168	2026-09-30 17:39:41.984169
sec-f4ef35fa	asm-1a726471	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 17:48:11.688445	2026-09-30 17:48:11.688448
sec-8dda82c3	asm-1a726471	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 17:48:11.688449	2026-09-30 17:48:11.68845
sec-214a7868	asm-1a726471	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 17:48:11.688451	2026-09-30 17:48:11.688451
sec-4ff1c4e7	asm-1a726471	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 17:48:11.688452	2026-09-30 17:48:11.688453
sec-bbbb9ae9	asm-7d2ad281	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 18:09:09.733761	2026-09-30 18:09:09.733765
sec-f1a22669	asm-7d2ad281	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 18:09:09.733767	2026-09-30 18:09:09.733769
sec-2ab73e90	asm-7d2ad281	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 18:09:09.73377	2026-09-30 18:09:09.733772
sec-479e303b	asm-7d2ad281	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 18:09:09.733773	2026-09-30 18:09:09.733774
sec-715d0cb6	asm-8e278974	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 18:20:43.309161	2026-09-30 18:20:43.309178
sec-b572eb9a	asm-8e278974	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 18:20:43.309186	2026-09-30 18:20:43.309191
sec-ee2d1021	asm-8e278974	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 18:20:43.309198	2026-09-30 18:20:43.309203
sec-04b287f3	asm-8e278974	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 18:20:43.30921	2026-09-30 18:20:43.309215
sec-4204532f	asm-b5ebc791	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-09-30 18:37:24.095603	2026-09-30 18:37:24.095615
sec-bb0fc4d6	asm-b5ebc791	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-09-30 18:37:24.095617	2026-09-30 18:37:24.095617
sec-c264946a	asm-b5ebc791	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-09-30 18:37:24.095618	2026-09-30 18:37:24.095619
sec-b1d792cc	asm-b5ebc791	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-09-30 18:37:24.09562	2026-09-30 18:37:24.095621
sec-b719676b	asm-429e2663	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-01 03:26:00.780765	2026-10-01 03:26:00.780769
sec-7afd6170	asm-429e2663	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-01 03:26:00.780771	2026-10-01 03:26:00.780772
sec-920d7cba	asm-429e2663	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-01 03:26:00.780773	2026-10-01 03:26:00.780775
sec-564be2c0	asm-429e2663	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-01 03:26:00.780776	2026-10-01 03:26:00.780777
sec-d8da47f5	asm-f4f7c070	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-01 03:33:04.676051	2026-10-01 03:33:04.676061
sec-cb0036aa	asm-f4f7c070	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-01 03:33:04.676063	2026-10-01 03:33:04.676065
sec-f5e398f5	asm-f4f7c070	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-01 03:33:04.676066	2026-10-01 03:33:04.676068
sec-8b8b2075	asm-f4f7c070	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-01 03:33:04.676069	2026-10-01 03:33:04.676072
sec-eca9646b	asm-257ab699	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-01 03:38:43.488814	2026-10-01 03:38:43.488817
sec-7b6d1996	asm-257ab699	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-01 03:38:43.488818	2026-10-01 03:38:43.488819
sec-e356ab04	asm-257ab699	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-01 03:38:43.48882	2026-10-01 03:38:43.488821
sec-dcdb530d	asm-257ab699	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-01 03:38:43.488822	2026-10-01 03:38:43.488823
sec-91383751	asm-6edb1e8f	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-01 03:54:24.33271	2026-10-01 03:54:24.332713
sec-05117ab7	asm-6edb1e8f	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-01 03:54:24.332714	2026-10-01 03:54:24.332715
sec-75399272	asm-6edb1e8f	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-01 03:54:24.332716	2026-10-01 03:54:24.332717
sec-64e5ee5b	asm-6edb1e8f	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-01 03:54:24.332719	2026-10-01 03:54:24.33272
sec-3f783e53	asm-5cb1fe0c	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-01 04:50:57.582143	2026-10-01 04:50:57.58215
sec-8aba5e27	asm-5cb1fe0c	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-01 04:50:57.582153	2026-10-01 04:50:57.582155
sec-7d3d3324	asm-5cb1fe0c	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-01 04:50:57.582157	2026-10-01 04:50:57.582159
sec-aaa16542	asm-5cb1fe0c	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-01 04:50:57.582161	2026-10-01 04:50:57.582163
sec-b5830778	asm-b8e4cf83	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-01 05:28:52.781773	2026-10-01 05:28:52.781776
sec-79b3ca34	asm-b8e4cf83	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-01 05:28:52.781777	2026-10-01 05:28:52.781778
sec-37e86a21	asm-b8e4cf83	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-01 05:28:52.781779	2026-10-01 05:28:52.78178
sec-6a196bea	asm-b8e4cf83	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-01 05:28:52.781781	2026-10-01 05:28:52.781782
sec-482cb829	asm-153351c2	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 06:29:19.666475	2026-10-04 06:29:19.666479
sec-9125d8c3	asm-153351c2	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 06:29:19.66648	2026-10-04 06:29:19.666482
sec-a479d299	asm-153351c2	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 06:29:19.666483	2026-10-04 06:29:19.666484
sec-1ee93c09	asm-153351c2	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 06:29:19.666484	2026-10-04 06:29:19.666485
sec-34caf4fc	asm-c5e55f19	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 06:46:23.999137	2026-10-04 06:46:23.99914
sec-cf6c4450	asm-c5e55f19	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 06:46:23.999141	2026-10-04 06:46:23.999142
sec-7237875b	asm-c5e55f19	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 06:46:23.999143	2026-10-04 06:46:23.999144
sec-cb0ddbd2	asm-c5e55f19	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 06:46:23.999145	2026-10-04 06:46:23.999145
sec-5fbd5ac3	asm-3323f4c5	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 07:09:49.91774	2026-10-04 07:09:49.917743
sec-dbb5f5ca	asm-3323f4c5	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 07:09:49.917744	2026-10-04 07:09:49.917745
sec-84cb54dd	asm-3323f4c5	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 07:09:49.917746	2026-10-04 07:09:49.917747
sec-a841aeee	asm-3323f4c5	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 07:09:49.917748	2026-10-04 07:09:49.917748
sec-1584f06d	asm-f4c74cfc	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 07:43:15.196579	2026-10-04 07:43:15.196584
sec-5419425e	asm-f4c74cfc	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 07:43:15.196586	2026-10-04 07:43:15.196587
sec-4bd0f9a7	asm-f4c74cfc	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 07:43:15.196589	2026-10-04 07:43:15.196591
sec-fb1174b5	asm-f4c74cfc	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 07:43:15.196592	2026-10-04 07:43:15.196593
sec-f5483411	asm-acc6eb4f	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 08:12:35.063863	2026-10-04 08:12:35.063868
sec-d7c16bd4	asm-acc6eb4f	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 08:12:35.06387	2026-10-04 08:12:35.063872
sec-adc3f971	asm-acc6eb4f	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 08:12:35.063874	2026-10-04 08:12:35.063875
sec-1a2cea19	asm-acc6eb4f	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 08:12:35.063877	2026-10-04 08:12:35.063879
sec-a8c80e18	asm-41b96d37	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 08:15:25.569896	2026-10-04 08:15:25.569899
sec-54a911d9	asm-41b96d37	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 08:15:25.569901	2026-10-04 08:15:25.569902
sec-d64c3689	asm-41b96d37	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 08:15:25.569903	2026-10-04 08:15:25.569904
sec-179d99d5	asm-41b96d37	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 08:15:25.569905	2026-10-04 08:15:25.569906
sec-d2af20a7	asm-d1b77486	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-04 08:22:42.790178	2026-10-04 08:22:42.79018
sec-a524d19c	asm-d1b77486	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-04 08:22:42.790182	2026-10-04 08:22:42.790183
sec-c5117247	asm-d1b77486	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-04 08:22:42.790183	2026-10-04 08:22:42.790184
sec-4d4a7fae	asm-d1b77486	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-04 08:22:42.790185	2026-10-04 08:22:42.790186
sec-ca65bef0	asm-f400657d	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-07 04:17:44.134985	2026-10-07 04:17:44.134987
sec-6416a54d	asm-f400657d	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-07 04:17:44.134988	2026-10-07 04:17:44.134989
sec-9e9713aa	asm-f400657d	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-07 04:17:44.13499	2026-10-07 04:17:44.134991
sec-dc917e78	asm-f400657d	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-07 04:17:44.134991	2026-10-07 04:17:44.134992
sec-8d54353e	asm-46fcf07c	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-07 05:16:41.731985	2026-10-07 05:16:41.731987
sec-1479bad0	asm-46fcf07c	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-07 05:16:41.731989	2026-10-07 05:16:41.731989
sec-989740b2	asm-46fcf07c	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-07 05:16:41.731991	2026-10-07 05:16:41.731991
sec-81ba7861	asm-46fcf07c	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-07 05:16:41.731992	2026-10-07 05:16:41.731993
sec-3d35484e	asm-1ca8594b	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-08 03:21:16.020926	2026-10-08 03:21:16.020929
sec-0a3cc570	asm-1ca8594b	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-08 03:21:16.020931	2026-10-08 03:21:16.020932
sec-6ff8c68e	asm-1ca8594b	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-08 03:21:16.020933	2026-10-08 03:21:16.020934
sec-cd1d6433	asm-1ca8594b	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-08 03:21:16.020935	2026-10-08 03:21:16.020936
sec-7c93fa2c	asm-9cbe81b8	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-08 04:27:52.597307	2026-10-08 04:27:52.597316
sec-aa7bc34b	asm-9cbe81b8	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-08 04:27:52.597319	2026-10-08 04:27:52.597322
sec-27b7d62b	asm-9cbe81b8	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-08 04:27:52.597325	2026-10-08 04:27:52.597327
sec-51826ad2	asm-9cbe81b8	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-08 04:27:52.597329	2026-10-08 04:27:52.59733
sec-360dc598	asm-1d88d467	Distributed Systems & Concurrency MCQs	technical_mcqs	1	20	{"question_count": 10, "time_limit_min": 15}	2026-10-08 08:31:22.37655	2026-10-08 08:31:22.376553
sec-a62a2369	asm-1d88d467	Cluster Partition Architecture Scenario	scenario	2	20	{"scenario_type": "distributed_consensus"}	2026-10-08 08:31:22.376554	2026-10-08 08:31:22.376555
sec-b97e982d	asm-1d88d467	Algorithmic Coding Problems	coding	3	40	{"problem_count": 2, "time_limit_min": 35}	2026-10-08 08:31:22.376556	2026-10-08 08:31:22.376557
sec-638abc42	asm-1d88d467	Memory Leak & Deadlock Troubleshooting	troubleshooting	4	20	{"bug_category": "concurrency"}	2026-10-08 08:31:22.376558	2026-10-08 08:31:22.376559
\.


--
-- Data for Name: assessment_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_versions (id, assessment_id, version_number, title, description, duration_minutes, passing_score, max_attempts, deadline_days, randomize_questions, allow_review, allow_unanswered, allow_resume, snapshot_data, published_by, published_at) FROM stdin;
asv-d512c8f0	asm-f2be8b47	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-d634a99e", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-241e6856", "title": "Array Maximum Subarray", "slug": "max-sub-e8bdb4", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-a8faa206", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-761a23bc", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-d634a99e": "B"}, "published_at": "2026-10-06T15:41:02.557758"}	usr-823f92ea	2026-10-06 15:41:02.557793
asv-3038324e	asm-2406aaf8	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-4771ab31", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-c22a7e23", "title": "Array Maximum Subarray", "slug": "max-sub-082148", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-b404cf36", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-43ad96ea", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-4771ab31": "B"}, "published_at": "2026-10-06T15:42:05.577816"}	usr-20a3b886	2026-10-06 15:42:05.577864
asv-8714f0f7	asm-d14f8e40	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-96216456", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-602d07cc", "title": "Array Maximum Subarray", "slug": "max-sub-ba2c9b", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-49210660", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-cd5bb461", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-96216456": "B"}, "published_at": "2026-10-06T15:45:29.124495"}	usr-3b4dc790	2026-10-06 15:45:29.124532
asv-be7028c8	asm-1d0babd8	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-6a5e24b9", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-1cd64002", "title": "Array Maximum Subarray", "slug": "max-sub-804541", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-3ddb9045", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-6d38748f", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-6a5e24b9": "B"}, "published_at": "2026-10-06T15:53:34.625149"}	usr-7c4b8719	2026-10-06 15:53:34.625206
asv-8969fab7	asm-077a3c73	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-3ad66834", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-43de42ab", "title": "Array Maximum Subarray", "slug": "max-sub-0833e3", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-1c8850ea", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-ae69837d", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-3ad66834": "B"}, "published_at": "2026-10-06T16:08:13.139002"}	usr-55c1abc9	2026-10-06 16:08:13.139144
asv-175d3dfe	asm-d41d4fee	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-1fca480e", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-514d12d4", "title": "Array Maximum Subarray", "slug": "max-sub-f518f4", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-6b372022", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-e67e4e23", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-1fca480e": "B"}, "published_at": "2026-10-06T16:26:31.229008"}	usr-6c799320	2026-10-06 16:26:31.229043
asv-376556d7	asm-3f68a9c1	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-fb50dfd2", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-022fb13c", "title": "Array Maximum Subarray", "slug": "max-sub-86a222", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-e0c5d159", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-e903575a", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-fb50dfd2": "B"}, "published_at": "2026-10-06T16:51:46.287871"}	usr-0de1e6ea	2026-10-06 16:51:46.287934
asv-cb650209	asm-8376331e	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-d3628f23", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-6d52a924", "title": "Array Maximum Subarray", "slug": "max-sub-59d416", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-8bf0bbf9", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-9500274f", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-d3628f23": "B"}, "published_at": "2026-10-07T03:44:51.898897"}	usr-0a6e4164	2026-10-07 03:44:51.898986
asv-dc5bb637	asm-3c9cd23c	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-8873b8ef", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-43a8cc0c", "title": "Array Maximum Subarray", "slug": "max-sub-56d60e", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-74f1d412", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-c247cd0b", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-8873b8ef": "B"}, "published_at": "2026-10-07T03:50:08.747584"}	usr-e649e6ca	2026-10-07 03:50:08.747612
asv-105c98e0	asm-5486c8d2	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-659280cb", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-73dc970c", "title": "Array Maximum Subarray", "slug": "max-sub-292c06", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-ebc96bd2", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-a7c3a338", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-659280cb": "B"}, "published_at": "2026-10-07T04:19:26.598041"}	usr-0e8f70e9	2026-10-07 04:19:26.598071
asv-59db89e0	asm-1effe538	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-4c7ce843", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-e63cc727", "title": "Array Maximum Subarray", "slug": "max-sub-0661d5", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-1ac745e7", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-0d539616", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-4c7ce843": "B"}, "published_at": "2026-10-07T05:18:29.849604"}	usr-c9b6537a	2026-10-07 05:18:29.849679
asv-69f31f17	asm-ebf9f75b	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-215d2dc4", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-b5bec3ae", "title": "Array Maximum Subarray", "slug": "max-sub-5602e1", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-7deacb01", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-222730ba", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-215d2dc4": "B"}, "published_at": "2026-10-08T03:23:25.885664"}	usr-dfb19537	2026-10-08 03:23:25.885725
asv-fd68a18b	asm-fb821b55	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-821be67d", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-d45b69d3", "title": "Array Maximum Subarray", "slug": "max-sub-0a5b27", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-5993cac0", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-df1eb1f3", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-821be67d": "B"}, "published_at": "2026-10-08T04:31:22.450186"}	usr-0421d754	2026-10-08 04:31:22.450224
asv-ef93c057	asm-98bc7d97	1	Senior Backend Technical Assessment	Comprehensive engineering evaluation for Python backends.	60	75	1	7	t	t	f	t	{"version": 1, "title": "Senior Backend Technical Assessment", "description": "Comprehensive engineering evaluation for Python backends.", "duration_minutes": 60, "passing_score": 75, "max_attempts": 1, "deadline_days": 7, "randomize_questions": true, "allow_review": true, "allow_unanswered": false, "allow_resume": true, "technical_mcqs": [{"id": "mcq-8182cfe2", "question": "What does the Global Interpreter Lock (GIL) do in CPython?", "difficulty": "Medium", "category": "technical", "skills": ["python"], "options": {"A": "Allows multi-threaded native C extensions only", "B": "Ensures only one thread executes Python bytecode at a time", "C": "Manages database connection pools"}, "correct_option": "B", "explanation": "The GIL synchronizes thread execution preventing race conditions on memory allocation.", "weight": 20.0, "display_order": 2, "is_required": true}], "coding_problems": [{"id": "prob-7b7f0dd7", "title": "Array Maximum Subarray", "slug": "max-sub-855979", "problem_statement": "Given an array of integers, return the maximum contiguous sum.", "difficulty": "Medium", "constraints": null, "input_format": null, "output_format": null, "execution_mode": "function", "function_name": "solve", "function_signature": {}, "time_limit_sec": 5.0, "memory_limit_mb": 128.0, "allowed_languages": ["python", "javascript"], "starter_code": {}, "weight": 80.0, "display_order": 1, "is_required": true, "sample_test_cases": [{"id": "tc-c084d176", "input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6", "is_hidden": false, "weight": 1.0}], "hidden_test_cases": [{"id": "tc-98dc019d", "input": "[1]", "expected": "1", "is_hidden": true, "weight": 1.0}]}], "mcq_solutions": {"mcq-8182cfe2": "B"}, "published_at": "2026-10-08T08:35:12.882840"}	usr-39ef1dc0	2026-10-08 08:35:12.882868
\.


--
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessments (id, job_id, organization_id, title, description, duration_minutes, passing_score, is_active, version, status, created_by, max_attempts, deadline_days, randomize_questions, allow_review, allow_unanswered, allow_resume, published_at, archived_at, created_at, updated_at) FROM stdin;
asm-89f49ae8	job-101	org-sparkx-default	Role Assessment		45	70	t	1	draft	usr-admin01	1	7	f	t	t	t	\N	\N	2026-10-06 15:55:13.814518	2026-10-09 17:53:49.801241
asm-3b05c858	job-e12be8	org-sparkx-default	Senior Financial Controller & Tax Auditor Assessment	Assessment for Senior Financial Controller & Tax Auditor	45	70	t	1	draft	usr-admin01	1	7	f	t	t	t	\N	\N	2026-10-06 16:20:44.301589	2026-10-07 03:40:23.917842
asm-1a01fd27	job-102	org-sparkx-default	Senior Financial Controller & Tax Auditor Assessment	Assessment for Senior Financial Controller & Tax Auditor	45	70	t	1	draft	usr-admin01	1	7	f	t	t	t	\N	\N	2026-10-07 05:25:44.234441	2026-10-07 05:25:44.234452
asm-075f1d60	job-5cd562	org-sparkx-default	Role Assessment	Assessment for AWS Cloud Engineer 	45	70	t	1	draft	usr-admin01	1	7	f	t	t	t	\N	\N	2026-10-09 18:00:41.551395	2026-10-13 08:19:57.499258
\.


--
-- Data for Name: assistant_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assistant_audit_logs (id, organization_id, user_id, candidate_id, job_id, query_preview, request_id, provider, validation_status, evidence_count, created_at) FROM stdin;
\.


--
-- Data for Name: availability_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.availability_blocks (id, availability_id, start_time, end_time, reason, created_at) FROM stdin;
blk-e1439355	avail-d4439838	13:00	14:00	Lunch Hour	2026-10-04 07:37:56.28218
blk-308a8196	avail-2530435e	11:30	12:00	Team Lunch	2026-10-04 07:37:57.368116
blk-31a5c901	avail-b6ef5f68	11:30	12:00	Team Lunch	2026-10-04 07:38:21.993098
blk-8f67901e	avail-2282712d	11:30	12:00	Team Lunch	2026-10-04 07:38:56.234751
blk-60456843	avail-420a2e18	11:30	12:00	Team Lunch	2026-10-04 07:39:06.649037
blk-2d492e82	avail-41459ad8	13:00	14:00	Lunch Hour	2026-10-04 07:40:44.87976
blk-ee1b9876	avail-8a4baaec	11:30	12:00	Team Lunch	2026-10-04 07:40:45.923033
blk-d3060bce	avail-7482f29d	13:00	14:00	Lunch Hour	2026-10-04 07:41:30.240969
blk-125f66f2	avail-815fcf89	11:30	12:00	Team Lunch	2026-10-04 07:41:31.294944
blk-846f2c40	avail-fc2a68dd	10:00	10:30	Sync	2026-10-04 07:41:34.314152
blk-4a467bf1	avail-926b4a02	13:00	14:00	Lunch Hour	2026-10-04 07:42:09.182002
blk-d041f92c	avail-6f9beea3	11:30	12:00	Team Lunch	2026-10-04 07:42:10.763723
blk-106d18b2	avail-bbc8eb61	10:00	10:30	Sync	2026-10-04 07:42:14.602105
blk-87d90a87	avail-97a503d1	13:00	14:00	Lunch Hour	2026-10-04 07:44:17.141186
blk-c169e5e1	avail-aae2b423	11:30	12:00	Team Lunch	2026-10-04 07:44:18.881487
blk-2938c0a9	avail-4eb1384c	10:00	10:30	Sync	2026-10-04 07:44:22.64753
blk-cf8da0e7	avail-debd05ba	13:00	14:00	Lunch Hour	2026-10-04 08:13:40.754424
blk-1f31c714	avail-74304309	11:30	12:00	Team Lunch	2026-10-04 08:13:43.042643
blk-eb697769	avail-8f10a075	10:00	10:30	Sync	2026-10-04 08:13:48.104688
blk-f68c21be	avail-e446e951	13:00	14:00	Lunch Hour	2026-10-04 08:16:29.248345
blk-d0cfb60c	avail-89364e9f	11:30	12:00	Team Lunch	2026-10-04 08:16:31.324027
blk-2128f927	avail-ab6c77cf	10:00	10:30	Sync	2026-10-04 08:16:37.492149
blk-56f3c3af	avail-851e6ee5	13:00	14:00	Lunch Hour	2026-10-04 08:24:09.855194
blk-6f76e0d3	avail-04db8d2f	11:30	12:00	Team Lunch	2026-10-04 08:24:16.851332
blk-0527e6af	avail-3c262f29	10:00	10:30	Sync	2026-10-04 08:24:33.805319
blk-884f7580	avail-395043f6	13:00	14:00	Lunch Hour	2026-10-04 15:10:07.782501
blk-f529b4a3	avail-d8b100d9	11:30	12:00	Team Lunch	2026-10-04 15:10:24.739333
blk-05136320	avail-117a8d17	10:00	10:30	Sync	2026-10-04 15:10:50.294978
blk-b8fc9b17	avail-532fb46a	13:00	14:00	Lunch Hour	2026-10-05 03:22:46.646852
blk-0b85b2ad	avail-dcc4a01c	11:30	12:00	Team Lunch	2026-10-05 03:23:07.256289
blk-511c78f1	avail-6f06cb67	10:00	10:30	Sync	2026-10-05 03:23:41.867833
blk-b2f6e83e	avail-bdb3d94d	13:00	14:00	Lunch Hour	2026-10-05 04:08:01.393377
blk-6c078106	avail-5fa9f0d4	13:00	14:00	Lunch Hour	2026-10-05 04:27:52.697056
blk-3a44c41a	avail-02c0df78	11:30	12:00	Team Lunch	2026-10-05 04:28:03.754392
blk-f205adca	avail-9308d510	10:00	10:30	Sync	2026-10-05 04:28:23.318277
blk-62586e41	avail-b499c636	13:00	14:00	Lunch Hour	2026-10-05 04:56:29.414366
blk-22533fd5	avail-4f07a07e	13:00	14:00	Lunch Hour	2026-10-06 03:29:09.591712
blk-304ed520	avail-ea09d4dc	13:00	14:00	Lunch Hour	2026-10-06 03:44:33.924185
blk-0cb2422d	avail-790ef2e2	13:00	14:00	Lunch Hour	2026-10-06 03:45:06.272409
blk-f609aafc	avail-50e917f1	13:00	14:00	Lunch Hour	2026-10-06 03:52:46.763641
blk-4a8f8d84	avail-27c26e5d	13:00	14:00	Lunch Hour	2026-10-06 04:01:38.581695
blk-91831fd5	avail-462f4d64	13:00	14:00	Lunch Hour	2026-10-06 04:13:38.126976
blk-77f90618	avail-ae6faee8	13:00	14:00	Lunch Hour	2026-10-06 05:31:24.1916
blk-3b2a1a81	avail-e6610c72	13:00	14:00	Lunch Hour	2026-10-06 05:31:42.017292
blk-53982d9e	avail-be96d5e4	13:00	14:00	Lunch Hour	2026-10-06 15:42:32.842948
blk-7e9864ff	avail-a77ab778	13:00	14:00	Lunch Hour	2026-10-06 15:42:58.345406
blk-d5c09aad	avail-dcdb1305	13:00	14:00	Lunch Hour	2026-10-06 15:45:12.337138
blk-b0573aad	avail-e9c4d58c	13:00	14:00	Lunch Hour	2026-10-06 15:54:04.484704
blk-41139f3f	avail-1d24bbef	13:00	14:00	Lunch Hour	2026-10-06 15:54:22.972792
blk-5977205e	avail-e32c86c4	13:00	14:00	Lunch Hour	2026-10-06 16:08:47.314747
blk-5b632680	avail-f3665fdb	13:00	14:00	Lunch Hour	2026-10-06 16:26:58.228488
blk-1e732d9f	avail-87d3994a	13:00	14:00	Lunch Hour	2026-10-07 03:16:38.693505
blk-88b31238	avail-7833b8f9	13:00	14:00	Lunch Hour	2026-10-07 03:45:28.477109
blk-6efb3623	avail-53af700a	13:00	14:00	Lunch Hour	2026-10-07 04:18:24.185075
blk-1d08518e	avail-f23ea650	11:30	12:00	Team Lunch	2026-10-07 04:18:27.811609
blk-e3619609	avail-f7169c0f	10:00	10:30	Sync	2026-10-07 04:18:35.305972
blk-724ae1ab	avail-921a207a	13:00	14:00	Lunch Hour	2026-10-07 04:18:59.025294
blk-1bfad1d8	avail-dd74a6c4	13:00	14:00	Lunch Hour	2026-10-07 04:19:18.05413
blk-be96e035	avail-4e3c2901	13:00	14:00	Lunch Hour	2026-10-07 05:17:19.698157
blk-2f0d673e	avail-73942080	11:30	12:00	Team Lunch	2026-10-07 05:17:24.662999
blk-3cd4a32b	avail-038e3631	10:00	10:30	Sync	2026-10-07 05:17:35.172393
blk-440bfde0	avail-3913274a	13:00	14:00	Lunch Hour	2026-10-07 05:18:02.468407
blk-65a589a1	avail-1eb19d02	13:00	14:00	Lunch Hour	2026-10-07 05:18:21.048773
blk-4372bd6a	avail-0b84e7de	13:00	14:00	Lunch Hour	2026-10-08 03:21:55.836621
blk-e1a1cb7c	avail-a83d96de	11:30	12:00	Team Lunch	2026-10-08 03:22:01.100591
blk-54ffbbd5	avail-cac9cd4d	10:00	10:30	Sync	2026-10-08 03:22:14.457319
blk-c31dfb11	avail-095a798e	13:00	14:00	Lunch Hour	2026-10-08 03:22:50.302339
blk-b83c2954	avail-0c84fef5	13:00	14:00	Lunch Hour	2026-10-08 03:23:14.730402
blk-5d665f4e	avail-bc52591e	13:00	14:00	Lunch Hour	2026-10-08 04:29:20.707742
blk-bc7fa034	avail-2ad6d325	11:30	12:00	Team Lunch	2026-10-08 04:29:31.123468
blk-53584fa3	avail-93a44dc4	10:00	10:30	Sync	2026-10-08 04:29:52.464111
blk-c298fab7	avail-5936a3ff	13:00	14:00	Lunch Hour	2026-10-08 04:30:40.789905
blk-162cd905	avail-f5482029	13:00	14:00	Lunch Hour	2026-10-08 04:31:05.716727
blk-3c59d9c7	avail-366e63ee	13:00	14:00	Lunch Hour	2026-10-08 08:32:43.356085
blk-ef0d74f3	avail-1022ede6	11:30	12:00	Team Lunch	2026-10-08 08:32:57.256542
blk-32fb9223	avail-63d75589	10:00	10:30	Sync	2026-10-08 08:33:14.137619
blk-b151601d	avail-014da86b	13:00	14:00	Lunch Hour	2026-10-08 08:34:02.071734
blk-d848b797	avail-c0a3bfbb	13:00	14:00	Lunch Hour	2026-10-08 08:34:45.073999
\.


--
-- Data for Name: candidate_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidate_skills (id, candidate_id, skill_id, proficiency_level, years_experience, is_verified, verified_score, verification_source, created_at, updated_at) FROM stdin;
csk-b25d3b10	cand-002	skl-4731ca21	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.451335	2026-10-04 14:59:12.451337
csk-3827f83c	cand-002	skl-d79c8bea	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.451868	2026-10-04 14:59:12.45187
csk-132e82ae	cand-002	skl-d745e8fa	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.452444	2026-10-04 14:59:12.452446
csk-360cba49	cand-002	skl-00d5add2	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.452933	2026-10-04 14:59:12.452935
csk-37d5d071	cand-002	skl-60936493	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.453429	2026-10-04 14:59:12.453431
csk-27dbe209	cand-002	skl-f0f25337	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.453926	2026-10-04 14:59:12.453928
csk-8d1eb19e	cand-004	skl-4731ca21	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.455117	2026-10-04 14:59:12.455119
csk-73f7e6d8	cand-004	skl-d79c8bea	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.455798	2026-10-04 14:59:12.4558
csk-36c275ee	cand-004	skl-96829365	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.456555	2026-10-04 14:59:12.456558
csk-1df0a82e	cand-004	skl-60936493	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.457132	2026-10-04 14:59:12.457135
csk-6c0cd283	cand-004	skl-ffa694c7	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.457753	2026-10-04 14:59:12.457754
csk-a380ae9e	cand-004	skl-2af8abbb	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.458264	2026-10-04 14:59:12.458266
csk-a657ea5e	cand-005	skl-4731ca21	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.459534	2026-10-04 14:59:12.459536
csk-92121911	cand-005	skl-d79c8bea	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.460045	2026-10-04 14:59:12.460047
csk-5ac8df2f	cand-005	skl-d745e8fa	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.460526	2026-10-04 14:59:12.460527
csk-4d1e6490	cand-005	skl-966f6cf1	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.460997	2026-10-04 14:59:12.460999
csk-0463a18b	cand-005	skl-ceb79f63	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.462919	2026-10-04 14:59:12.462921
csk-d068a1ce	cand-005	skl-ffa694c7	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.463396	2026-10-04 14:59:12.463398
csk-012568bd	cand-005	skl-fc68bd8c	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.464038	2026-10-04 14:59:12.464041
csk-7f437bc2	cand-006	skl-d745e8fa	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.465818	2026-10-04 14:59:12.46582
csk-1b8f0e3d	cand-006	skl-00d5add2	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.466371	2026-10-04 14:59:12.466373
csk-c3777d35	cand-006	skl-f0f25337	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.466907	2026-10-04 14:59:12.466909
csk-807f4b62	cand-006	skl-c0ce67ac	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.467405	2026-10-04 14:59:12.467407
csk-99c979f0	cand-006	skl-05d17853	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.469877	2026-10-04 14:59:12.469879
csk-91ed10e1	cand-006	skl-091886fa	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.471717	2026-10-04 14:59:12.471718
csk-2fa9aac2	cand-0db7e4	skl-a4be5efc	unspecified	0	f	\N	self_reported	2026-10-04 14:59:12.475526	2026-10-04 14:59:12.475528
\.


--
-- Data for Name: candidate_state_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidate_state_logs (id, candidate_id, dimension, from_value, to_value, changed_by, notes, rationale_category, created_at) FROM stdin;
stlog-2231a3a2	cand-002	stage	applied	interview	admin@sparkx.ai		\N	2026-09-23 08:23:53.776391
stlog-33a777e1	cand-004	stage	applied	interview	admin@sparkx.ai		\N	2026-09-23 08:23:54.905334
stlog-1a945086	cand-005	stage	applied	interview	admin@sparkx.ai		\N	2026-09-23 08:23:55.966845
stlog-fb99184b	cand-006	stage	applied	interview	admin@sparkx.ai		\N	2026-09-23 08:23:57.014159
stlog-8255c007	cand-002	stage	interview	assessment	admin@sparkx.ai		\N	2026-09-23 10:13:31.177137
stlog-46912042	cand-002	assessment_status	not_invited	invited	admin@sparkx.ai	Technical assessment invitation	\N	2026-09-23 10:13:31.271926
stlog-38f1ed11	cand-0db7e4	stage	applied	screening	admin@sparkx.ai		\N	2026-09-23 16:45:31.606152
stlog-4bc7954e	cand-002	stage	assessment	screening	admin@sparkx.ai		\N	2026-09-23 16:45:36.766425
stlog-5df862db	cand-004	stage	interview	screening	admin@sparkx.ai		\N	2026-09-23 16:45:39.659651
stlog-6831790e	cand-002	stage	screening	completed	admin@sparkx.ai		\N	2026-09-23 16:45:49.214854
stlog-0b9d4754	cand-004	stage	screening	completed	admin@sparkx.ai		\N	2026-09-23 16:45:54.939699
stlog-0e6075a1	cand-004	stage	screening	completed	admin@sparkx.ai		\N	2026-09-23 16:45:54.952638
stlog-137b065c	cand-0db7e4	stage	screening	completed	admin@sparkx.ai		\N	2026-09-23 16:45:56.624014
stlog-96fdd800	cand-005	stage	review	completed	admin@sparkx.ai		\N	2026-09-23 16:45:57.762232
stlog-c30d95c4	cand-ec8c01	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:25:38.558398
stlog-304d5ae8	cand-fda8a0	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:25:40.08195
stlog-07ecf64c	cand-f4b4e2	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:25:40.573372
stlog-8a83ea1d	cand-726731	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:25:41.593778
stlog-4f54c9a5	cand-32f499	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:25:42.090531
stlog-40b8070d	cand-0db7e4	stage	completed	review	admin@sparkx.ai		\N	2026-09-23 17:36:50.350551
stlog-37023d01	cand-43fc90	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:36:58.290303
stlog-01a46b9c	cand-b0bcb8	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:36:59.776322
stlog-9a19fc0a	cand-51fef4	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:37:00.200396
stlog-5464f2a1	cand-3a14a5	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:37:01.257057
stlog-b2f7dad9	cand-dcc6e0	stage	\N	applied	candidate	Application submitted	\N	2026-09-23 17:37:01.778307
stlog-06662d72	cand-0db7e4	stage	review	interview	admin@sparkx.ai		\N	2026-09-23 17:41:01.281352
stlog-848f3e95	cand-285a28	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:13:54.111872
stlog-e199962f	cand-2bc364	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:13:55.559066
stlog-70a228fb	cand-2f9738	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:13:56.030915
stlog-9dafd6b3	cand-1a98d5	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:13:56.933081
stlog-62d80ed3	cand-b965a4	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:13:57.395721
stlog-a1d154c0	cand-55da47	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:58:43.162623
stlog-ae8696cb	cand-cfbf3a	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:58:44.514568
stlog-a8b53369	cand-ce4df6	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:58:44.954999
stlog-035a94af	cand-340e1a	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:58:45.868798
stlog-5f5398ca	cand-278334	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 03:58:46.330867
stlog-eb9e8c98	cand-7d8d1d	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 04:55:34.013288
stlog-728bed68	cand-9058b1	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 04:55:35.566509
stlog-f654962e	cand-338378	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 04:55:36.089032
stlog-a852023a	cand-a8b7e0	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 04:55:37.088119
stlog-07ca57a9	cand-2765aa	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 04:55:37.524573
stlog-eb9b4a97	cand-716a4e	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 05:39:48.356071
stlog-0d60b0d5	cand-716a4e	stage	applied	screening	admin@sparkx.ai		\N	2026-09-24 06:11:18.598129
stlog-d99337e2	cand-716a4e	stage	screening	interview	recruiter	Interview scheduled for 2026-09-24 11:45	\N	2026-09-24 06:23:54.771961
stlog-6ea67aaf	cand-716a4e	interview_status	not_scheduled	scheduled	recruiter	Interview scheduled for 2026-09-24 11:45	\N	2026-09-24 06:23:54.772063
stlog-40edf3ad	cand-716a4e	interview_status	not_scheduled	scheduled	recruiter	Interview scheduled for 2026-09-24 00:15	\N	2026-09-24 06:31:43.66116
stlog-124d0d34	cand-906002	stage	\N	applied	candidate	Application submitted	\N	2026-09-24 11:17:31.20228
stlog-34844c72	cand-906002	stage	applied	screening	admin@sparkx.ai		\N	2026-09-24 11:18:00.621515
stlog-d6baf2f8	cand-906002	stage	screening	interview	recruiter	Interview scheduled for 2026-09-25 17:00	\N	2026-09-24 11:19:15.152078
stlog-2d521756	cand-906002	interview_status	not_scheduled	scheduled	recruiter	Interview scheduled for 2026-09-25 17:00	\N	2026-09-24 11:19:15.15221
stlog-60196824	cand-716a4e	stage	interview	review	admin@sparkx.ai		\N	2026-09-24 12:46:45.47854
stlog-c6ba444a	cand-0db7e4	stage	interview	assessment	admin@sparkx.ai		\N	2026-09-24 12:46:47.244444
stlog-e03cc704	cand-0db7e4	assessment_status	not_invited	invited	admin@sparkx.ai	Technical assessment invitation	\N	2026-09-24 12:46:47.309531
stlog-6a99540a	cand-906002	interview_status	scheduled	scheduled	recruiter	Interview rescheduled from 2026-09-25 17:00 to 2026-09-25 18:40	\N	2026-09-24 12:47:17.998681
stlog-b618d7bb	cand-906002	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-09-24 13:22:13.379955
stlog-1cacfab0	cand-906002	assessment_status	not_invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-09-24 13:35:04.69652
stlog-387393ab	cand-906002	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-09-24 13:35:06.070386
stlog-c1d718bd	cand-906002	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-09-24 13:35:06.258239
stlog-b3c33965	cand-906002	stage	interview	review	system	Interview completed; application in review stage	\N	2026-09-24 13:35:06.258592
stlog-a53d049c	cand-906002	hiring_decision	undecided	rejected	admin@sparkx.ai		\N	2026-09-24 13:36:17.25182
stlog-8b3e0477	cand-004	stage	interview	assessment	admin@sparkx.ai		\N	2026-09-24 16:08:35.884593
stlog-52461074	cand-002	stage	assessment	interview	admin@sparkx.ai		\N	2026-09-24 16:08:38.127775
stlog-ee75867d	cand-716a4e	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-09-24 16:17:36.780827
stlog-4620258a	cand-716a4e	stage	review	interview	candidate	Interview session in progress	\N	2026-09-24 16:17:36.781374
stlog-c950186f	cand-716a4e	interview_status	in_progress	scheduled	recruiter	Interview scheduled for 2026-09-24 00:15	\N	2026-09-25 05:45:14.937533
stlog-28b76e3f	cand-004	stage	assessment	screening	admin@sparkx.ai		\N	2026-09-25 05:51:18.115392
stlog-92a99b1c	cand-002	stage	interview	assessment	admin@sparkx.ai		\N	2026-09-25 05:51:21.062289
stlog-ee8a591d	cand-716a4e	stage	interview	assessment	admin@sparkx.ai		\N	2026-09-25 05:51:34.927203
stlog-b65bb1d6	cand-716a4e	assessment_status	not_invited	invited	admin@sparkx.ai	Technical assessment invitation	\N	2026-09-25 05:51:35.059061
stlog-e81e4e13	cand-002	stage	assessment	review	admin@sparkx.ai		\N	2026-09-25 05:51:41.645522
stlog-ae1b7818	cand-005	stage	review	assessment	admin@sparkx.ai		\N	2026-09-25 05:51:44.474565
stlog-6491a798	cand-716a4e	stage	assessment	screening	admin@sparkx.ai		\N	2026-09-25 05:51:48.719689
stlog-0e309ecc	cand-716a4e	stage	screening	assessment	admin@sparkx.ai		\N	2026-09-25 05:51:50.144682
stlog-1ece8593	cand-006	stage	completed	review	admin@sparkx.ai		\N	2026-09-25 05:51:56.104957
stlog-18e73208	cand-006	stage	review	completed	admin@sparkx.ai		\N	2026-09-25 05:51:57.695731
stlog-d7f47988	cand-906002	stage	completed	screening	admin@sparkx.ai		\N	2026-09-25 05:52:07.725094
stlog-227a2705	cand-906002	stage	screening	completed	admin@sparkx.ai		\N	2026-09-25 05:52:11.167349
stlog-adfe408b	cand-005	stage	assessment	interview	admin@sparkx.ai		\N	2026-09-25 11:13:44.834996
stlog-4b8acca4	cand-02d9b1	stage	\N	applied	candidate	Application submitted	\N	2026-09-27 18:47:32.404321
stlog-bccd0fb7	cand-02d9b1	stage	applied	interview	recruiter	Interview scheduled for 2026-09-29 14:00	\N	2026-09-27 18:51:08.711501
stlog-3697a227	cand-02d9b1	interview_status	not_scheduled	scheduled	recruiter	Interview scheduled for 2026-09-29 14:00	\N	2026-09-27 18:51:08.711967
stlog-13f1be05	cand-02d9b1	interview_status	scheduled	scheduled	recruiter	Interview rescheduled from 2026-09-29 14:00 to 2026-09-29 14:00	\N	2026-09-27 18:52:38.64783
stlog-b8a40afa	cand-02d9b1	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-09-27 18:56:41.68935
stlog-f84f9983	cand-02d9b1	assessment_status	not_invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-09-27 19:01:51.514161
stlog-a335d6e9	cand-02d9b1	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-09-27 19:01:51.516161
stlog-47a3cb81	cand-02d9b1	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-09-27 19:01:51.576045
stlog-62ebf706	cand-02d9b1	stage	interview	review	system	Interview completed; application in review stage	\N	2026-09-27 19:01:51.576306
stlog-3dde7970	cand-02d9b1	hiring_decision	undecided	rejected	admin@sparkx.ai	Not completed assesment and lack of technical skills 	\N	2026-09-27 19:03:17.540175
stlog-bc2435fb	cand-002	stage	review	interview	admin@sparkx.ai		\N	2026-09-28 16:38:50.163082
stlog-2973a867	cand-005	stage	interview	review	admin@sparkx.ai		\N	2026-09-28 16:38:51.841122
stlog-d23376ad	cand-002	stage	interview	assessment	admin@sparkx.ai		\N	2026-09-28 16:38:53.365485
stlog-4cbf11a1	cand-716a4e	stage	assessment	interview	admin@sparkx.ai		\N	2026-09-28 16:38:54.790284
stlog-79950487	cand-716a4e	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-09-29 04:46:26.883447
stlog-a0f60c3a	cand-716a4e	assessment_status	invited	in_progress	candidate	Candidate started the assessment session	\N	2026-09-29 04:47:45.466033
stlog-4db3225d	cand-app1-a72cd3	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-11 14:00	\N	2026-10-05 03:23:12.266375
stlog-fa43b3e3	cand-app1-a72cd3	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-11 14:00 (UTC)	\N	2026-10-05 03:23:12.266661
stlog-d2f4abe8	cand-app1-cbd7d4	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 10:00	\N	2026-10-05 03:23:15.726718
stlog-bce0d824	cand-app1-cbd7d4	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 10:00 (UTC)	\N	2026-10-05 03:23:15.726769
stlog-2570e520	cand-app1-776270	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-13 09:00	\N	2026-10-05 03:23:19.341216
stlog-e5059dbb	cand-app1-776270	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-13 09:00 (UTC)	\N	2026-10-05 03:23:19.341325
stlog-bb11b22f	cand-app1-c05568	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-14 14:00	\N	2026-10-05 03:23:23.633292
stlog-a66b3929	cand-app1-c05568	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-14 14:00 (UTC)	\N	2026-10-05 03:23:23.633346
stlog-53c8df61	cand-app1-c05568	interview_status	scheduled	scheduled	candidate	Interview rescheduled from 2026-10-14 14:00 to 2026-10-14 14:30	\N	2026-10-05 03:23:23.698922
stlog-217ebb63	cand-app1-383725	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-15 11:00	\N	2026-10-05 03:23:27.311246
stlog-36776d2a	cand-app1-383725	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-15 11:00 (UTC)	\N	2026-10-05 03:23:27.311496
stlog-bcfbcb15	cand-app1-383725	interview_status	scheduled	cancelled	candidate	Interview cancelled: Accepted another offer	\N	2026-10-05 03:23:27.347453
stlog-72e8eaf2	cand-app1-8e5887	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-19 10:00	\N	2026-10-05 03:23:34.86882
stlog-d0a98c2f	cand-app1-8e5887	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-19 10:00 (UTC)	\N	2026-10-05 03:23:34.868973
stlog-56858083	cand-app1-8e5887	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 03:23:34.898156
stlog-ff72b964	cand-app1-8a8f33	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-21 09:00	\N	2026-10-05 03:23:41.903973
stlog-8517b362	cand-app1-8a8f33	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-21 09:00 (UTC)	\N	2026-10-05 03:23:41.904041
stlog-674c88fa	cand-rec-a-a657b1	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-07 10:00	\N	2026-10-05 03:23:57.411696
stlog-5eb49efb	cand-rec-a-a657b1	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-07 10:00 (UTC)	\N	2026-10-05 03:23:57.41207
stlog-9a145c84	cand-rec-a-a657b1	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 03:23:57.462186
stlog-f0a7a9bb	cand-rec-a-50efba	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 14:00	\N	2026-10-05 03:24:17.996807
stlog-478838e6	cand-rec-a-50efba	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 14:00 (UTC)	\N	2026-10-05 03:24:17.996985
stlog-2afcfaf0	cand-rec-a-50efba	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 03:24:18.049035
stlog-9aeffae8	cand-rec-a-50efba	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-05 03:24:18.103097
stlog-f007e474	cand-rec-a-50efba	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-05 03:24:18.10326
stlog-997ffdcf	cand-rec-a-1786f9	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 16:00	\N	2026-10-05 03:24:26.124869
stlog-6950db7b	cand-rec-a-1786f9	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 16:00 (UTC)	\N	2026-10-05 03:24:26.124991
stlog-da5d0e3c	cand-rec-a-1786f9	interview_status	scheduled	cancelled	candidate	Interview cancelled: Candidate requested cancellation	\N	2026-10-05 03:24:26.171208
stlog-77e8a3f6	cand-eval-c-2ed16b	assessment_status	invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 03:25:23.401897
stlog-0af1058f	cand-eval-c-2ed16b	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 31/100	\N	2026-10-05 03:25:25.61416
stlog-de574182	cand-eval-z-be2419	assessment_status	invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 03:25:26.854358
stlog-24f2feeb	cand-eval-z-be2419	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-05 03:25:28.250139
stlog-4a8034bd	cand-hist-60dba5	assessment_status	invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 03:25:30.914345
stlog-71c9c861	cand-hist-60dba5	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 25/100	\N	2026-10-05 03:25:32.235035
stlog-a35e7566	cand-a27e1f	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:25:53.596957
stlog-af38839e	cand-f18a30	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:26:34.685768
stlog-64085e26	cand-c2303a	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:26:37.68385
stlog-a5eb5c53	cand-ee30eb	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:26:38.930103
stlog-c56bfe46	cand-b08769	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:26:41.032249
stlog-8421df01	cand-c77b38	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:26:42.326755
stlog-19c2b77e	cand-80a1eeab	stage	assessment	interview	test_recruiter_a@org-a.com	Passed technical assessment	\N	2026-10-05 03:27:11.229597
stlog-7264b717	cand-f1814e	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 03:27:15.623477
stlog-d39737cf	cand-f1814e	assessment_status	not_invited	invited	test_recruiter_a@org-a.com	Welcome to technical evaluation	\N	2026-10-05 03:27:15.861344
stlog-dd723d92	cand-f1814e	assessment_status	invited	in_progress	candidate	Candidate started the assessment session	\N	2026-10-05 03:27:15.935869
stlog-31323e21	cand-f1814e	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 03:27:16.00126
stlog-094145a9	cand-f1814e	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-05 03:27:16.016044
stlog-9cb977ef	cand-f1814e	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-05 03:27:16.016381
stlog-19013901	cand-f1814e	stage	review	interview	test_recruiter_a@org-a.com	Passed assessment	\N	2026-10-05 03:27:16.118362
stlog-b319a8a2	cand-f1814e	interview_status	not_scheduled	scheduled	recruiter	Interview scheduled for 2026-10-05 14:00	\N	2026-10-05 03:27:16.203544
stlog-14a1e3b1	cand-f1814e	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 03:27:18.047598
stlog-aa44140f	cand-f1814e	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-05 03:27:18.123668
stlog-f47e142e	cand-f1814e	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-05 03:27:18.124018
stlog-241549da	cand-f1814e	hiring_decision	undecided	selected	test_recruiter_a@org-a.com	Strong candidate hire recommendation	\N	2026-10-05 03:27:18.204341
stlog-68f2ec77	cand-rec-a-2c9325	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-07 10:00	\N	2026-10-05 04:07:55.718551
stlog-216fcde3	cand-rec-a-2c9325	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-07 10:00 (UTC)	\N	2026-10-05 04:07:55.718671
stlog-63d04d26	cand-rec-a-2c9325	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:07:55.757118
stlog-9e702932	cand-rec-a-7454ec	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 14:00	\N	2026-10-05 04:07:59.361092
stlog-2fb16b18	cand-rec-a-7454ec	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 14:00 (UTC)	\N	2026-10-05 04:07:59.361235
stlog-36f9460a	cand-rec-a-7454ec	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:07:59.39758
stlog-e22a312d	cand-rec-a-7454ec	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-05 04:07:59.4326
stlog-515f3d86	cand-rec-a-7454ec	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-05 04:07:59.432786
stlog-3698bb5d	cand-app1-5ee65c	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-11 14:00	\N	2026-10-05 04:08:03.257907
stlog-0a26b154	cand-app1-5ee65c	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-11 14:00 (UTC)	\N	2026-10-05 04:08:03.257974
stlog-f09bc2cd	cand-rec-a-f508fe	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-07 10:00	\N	2026-10-05 04:27:08.648508
stlog-77eb392b	cand-rec-a-f508fe	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-07 10:00 (UTC)	\N	2026-10-05 04:27:08.648624
stlog-b29d41b6	cand-rec-a-f508fe	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:27:08.687821
stlog-6df48325	cand-rec-a-b7f1df	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 14:00	\N	2026-10-05 04:27:19.870981
stlog-b164b73b	cand-rec-a-b7f1df	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 14:00 (UTC)	\N	2026-10-05 04:27:19.871064
stlog-3681eea6	cand-rec-a-b7f1df	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:27:19.890967
stlog-aa220787	cand-rec-a-b7f1df	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-05 04:27:19.916246
stlog-0689a1ca	cand-rec-a-b7f1df	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-05 04:27:19.91635
stlog-02c334d1	cand-rec-a-58a354	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 16:00	\N	2026-10-05 04:27:24.480607
stlog-630d1e24	cand-rec-a-58a354	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 16:00 (UTC)	\N	2026-10-05 04:27:24.480767
stlog-f535f4b2	cand-rec-a-58a354	interview_status	scheduled	cancelled	candidate	Interview cancelled: Candidate requested cancellation	\N	2026-10-05 04:27:24.519278
stlog-11188f06	cand-app1-27b77e	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-11 14:00	\N	2026-10-05 04:28:06.764507
stlog-737e7cb9	cand-app1-27b77e	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-11 14:00 (UTC)	\N	2026-10-05 04:28:06.764621
stlog-3c4db15e	cand-app1-51c91a	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 10:00	\N	2026-10-05 04:28:09.045862
stlog-d741ccfb	cand-app1-51c91a	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 10:00 (UTC)	\N	2026-10-05 04:28:09.045977
stlog-4002aa05	cand-app1-73ddd5	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-13 09:00	\N	2026-10-05 04:28:11.104206
stlog-d8c1bbf2	cand-app1-73ddd5	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-13 09:00 (UTC)	\N	2026-10-05 04:28:11.104267
stlog-b5896165	cand-app1-28f116	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-14 14:00	\N	2026-10-05 04:28:13.188537
stlog-c8b5dbc9	cand-app1-28f116	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-14 14:00 (UTC)	\N	2026-10-05 04:28:13.1886
stlog-336e7bd6	cand-app1-28f116	interview_status	scheduled	scheduled	candidate	Interview rescheduled from 2026-10-14 14:00 to 2026-10-14 14:30	\N	2026-10-05 04:28:13.225772
stlog-b9a2774a	cand-app1-61d96e	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-15 11:00	\N	2026-10-05 04:28:15.34435
stlog-ee444552	cand-app1-61d96e	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-15 11:00 (UTC)	\N	2026-10-05 04:28:15.344466
stlog-a6f45383	cand-app1-61d96e	interview_status	scheduled	cancelled	candidate	Interview cancelled: Accepted another offer	\N	2026-10-05 04:28:15.39566
stlog-ebf680b1	cand-app1-9d7ead	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-19 10:00	\N	2026-10-05 04:28:19.322067
stlog-14708512	cand-app1-9d7ead	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-19 10:00 (UTC)	\N	2026-10-05 04:28:19.322126
stlog-0b1b896a	cand-app1-9d7ead	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:28:19.366069
stlog-2c6f7121	cand-app1-a47726	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-21 09:00	\N	2026-10-05 04:28:23.363438
stlog-5709a129	cand-app1-a47726	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-21 09:00 (UTC)	\N	2026-10-05 04:28:23.363549
stlog-501953e3	cand-rec-a-154e43	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-07 10:00	\N	2026-10-05 04:56:22.063738
stlog-00a87736	cand-rec-a-154e43	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-07 10:00 (UTC)	\N	2026-10-05 04:56:22.06389
stlog-bd98c877	cand-rec-a-154e43	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:56:22.112186
stlog-7cc37436	cand-rec-a-303539	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 14:00	\N	2026-10-05 04:56:27.223706
stlog-8230f8c4	cand-rec-a-303539	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 14:00 (UTC)	\N	2026-10-05 04:56:27.223823
stlog-680f9e55	cand-rec-a-303539	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:56:27.260806
stlog-f3570d3a	cand-rec-a-303539	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-05 04:56:27.298813
stlog-a0a69435	cand-rec-a-303539	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-05 04:56:27.299024
stlog-aba82f76	cand-app1-f81a48	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-11 14:00	\N	2026-10-05 04:56:31.53684
stlog-c4f15532	cand-app1-f81a48	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-11 14:00 (UTC)	\N	2026-10-05 04:56:31.5369
stlog-37ee0db6	cand-eval-c-19c11c	assessment_status	invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 04:58:42.892
stlog-7a3d8a46	cand-eval-c-19c11c	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 31/100	\N	2026-10-05 04:58:45.021253
stlog-d92a0aa9	cand-eval-z-54797e	assessment_status	invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 04:58:46.00193
stlog-29b4697d	cand-eval-z-54797e	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-05 04:58:47.357362
stlog-e650bda8	cand-hist-1ed33c	assessment_status	invited	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 04:58:49.392731
stlog-3fa8da16	cand-hist-1ed33c	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 25/100	\N	2026-10-05 04:58:50.529695
stlog-756cba72	cand-80a1eeab	stage	interview	interview	test_recruiter_a@org-a.com	Passed technical assessment	\N	2026-10-05 04:59:00.94817
stlog-724b56ec	cand-a1b6ca	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 04:59:03.993184
stlog-27416f06	cand-a1b6ca	assessment_status	not_invited	invited	test_recruiter_a@org-a.com	Welcome to technical evaluation	\N	2026-10-05 04:59:04.106491
stlog-3d5193df	cand-a1b6ca	assessment_status	invited	in_progress	candidate	Candidate started the assessment session	\N	2026-10-05 04:59:04.159608
stlog-4ec6cdb7	cand-a1b6ca	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-05 04:59:04.198405
stlog-7370aaef	cand-a1b6ca	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-05 04:59:04.224107
stlog-3c804154	cand-a1b6ca	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-05 04:59:04.224237
stlog-b9f2cbdf	cand-a1b6ca	stage	review	interview	test_recruiter_a@org-a.com	Passed assessment	\N	2026-10-05 04:59:04.281399
stlog-87a2e316	cand-a1b6ca	interview_status	not_scheduled	scheduled	recruiter	Interview scheduled for 2026-10-05 14:00	\N	2026-10-05 04:59:04.339998
stlog-53c4ed80	cand-a1b6ca	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-05 04:59:06.308637
stlog-057979c1	cand-a1b6ca	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-05 04:59:06.37685
stlog-8439af1a	cand-a1b6ca	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-05 04:59:06.376964
stlog-d5191ec6	cand-a1b6ca	hiring_decision	undecided	selected	test_recruiter_a@org-a.com	Strong candidate hire recommendation	\N	2026-10-05 04:59:06.430109
stlog-4e330863	cand-f6b361	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 04:59:22.294088
stlog-6653e986	cand-420021	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 04:59:24.986746
stlog-7405b798	cand-83ee8d	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 04:59:25.908462
stlog-a2043b13	cand-12616e	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 04:59:27.649069
stlog-8a8720ae	cand-5ae9fd	stage	\N	applied	candidate	Application submitted	\N	2026-10-05 04:59:28.473603
stlog-9d1b3066	cand-rec-a-978794	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 03:29:03.958312
stlog-4e5f20c5	cand-rec-a-978794	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 03:29:03.958361
stlog-cc42730e	cand-rec-a-978794	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:29:03.99676
stlog-b3608447	cand-rec-a-1b7789	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 03:29:07.600282
stlog-35af6159	cand-rec-a-1b7789	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 03:29:07.600322
stlog-e5c11f2b	cand-rec-a-1b7789	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:29:07.660458
stlog-f504b7b9	cand-rec-a-1b7789	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 03:29:07.681867
stlog-830b5a17	cand-rec-a-1b7789	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 03:29:07.681966
stlog-99fd2b27	cand-app1-d7d6ef	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 03:29:11.248923
stlog-c011b0f0	cand-app1-d7d6ef	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 03:29:11.248961
stlog-37f205ab	cand-rec-a-005fe6	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 03:44:25.411984
stlog-8b6a0c20	cand-rec-a-005fe6	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 03:44:25.412126
stlog-42ee3550	cand-rec-a-005fe6	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:44:25.470068
stlog-87bbdaeb	cand-rec-a-513aed	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 03:44:31.213463
stlog-1da59f8d	cand-rec-a-513aed	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 03:44:31.213523
stlog-6e8f3a5f	cand-rec-a-513aed	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:44:31.243263
stlog-2a5afa75	cand-rec-a-513aed	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 03:44:31.286465
stlog-9e2243eb	cand-rec-a-513aed	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 03:44:31.286593
stlog-f13bc658	cand-app1-a72479	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 03:44:36.827338
stlog-732b734a	cand-app1-a72479	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 03:44:36.827444
stlog-9b8d923e	cand-rec-a-ff925c	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 03:44:58.342058
stlog-2fc65628	cand-rec-a-ff925c	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 03:44:58.342177
stlog-e1373c3e	cand-rec-a-ff925c	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:44:58.370311
stlog-f2a1cdbc	cand-rec-a-760681	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 03:45:03.561534
stlog-5fa0646a	cand-rec-a-760681	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 03:45:03.561652
stlog-94cb27cb	cand-rec-a-760681	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:45:03.608803
stlog-83088fd9	cand-rec-a-760681	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 03:45:03.66017
stlog-76e56651	cand-rec-a-760681	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 03:45:03.660326
stlog-e5fb3e33	cand-app1-339e13	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 03:45:09.035759
stlog-975646bd	cand-app1-339e13	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 03:45:09.035883
stlog-1b39c019	cand-rec-a-abc84c	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 03:52:45.196835
stlog-6ea7b20a	cand-rec-a-abc84c	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 03:52:45.196903
stlog-43448a53	cand-rec-a-abc84c	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:52:45.247123
stlog-532f46a6	cand-rec-a-4f8705	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 03:52:46.269422
stlog-145fc505	cand-rec-a-4f8705	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 03:52:46.269465
stlog-9816c1e5	cand-rec-a-4f8705	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 03:52:46.298947
stlog-c13d8c71	cand-rec-a-4f8705	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 03:52:46.328411
stlog-1d817607	cand-rec-a-4f8705	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 03:52:46.328487
stlog-b3ec9c06	cand-app1-f7a908	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 03:52:47.15212
stlog-580086cc	cand-app1-f7a908	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 03:52:47.152173
stlog-c329c237	cand-rec-a-af78f0	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 04:01:35.393397
stlog-e178d9b2	cand-rec-a-af78f0	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 04:01:35.393487
stlog-e094418d	cand-rec-a-af78f0	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 04:01:35.443925
stlog-418d781b	cand-rec-a-f9da14	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 04:01:37.328228
stlog-84d920b3	cand-rec-a-f9da14	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 04:01:37.328369
stlog-3ba15c38	cand-rec-a-f9da14	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 04:01:37.376356
stlog-64936df3	cand-rec-a-f9da14	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 04:01:37.417245
stlog-5cafb14b	cand-rec-a-f9da14	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 04:01:37.417452
stlog-6fd494b2	cand-app1-4b1aef	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 04:01:39.446593
stlog-7b74b5be	cand-app1-4b1aef	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 04:01:39.446763
stlog-6aff4af0	cand-rec-a-2a7246	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 04:13:36.663986
stlog-5360c9c8	cand-rec-a-2a7246	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 04:13:36.664138
stlog-a734f24f	cand-rec-a-2a7246	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 04:13:36.699218
stlog-96ce3944	cand-rec-a-857c1f	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 04:13:37.577189
stlog-4a5b997f	cand-rec-a-857c1f	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 04:13:37.577361
stlog-e80cf830	cand-rec-a-857c1f	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 04:13:37.611528
stlog-8256ef75	cand-rec-a-857c1f	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 04:13:37.631988
stlog-c5e66037	cand-rec-a-857c1f	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 04:13:37.63208
stlog-c297415d	cand-app1-998c5b	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 04:13:38.622394
stlog-1f764efe	cand-app1-998c5b	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 04:13:38.622493
stlog-5028773a	cand-rec-a-a1457c	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 05:31:22.283297
stlog-a438fd81	cand-rec-a-a1457c	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 05:31:22.283384
stlog-42c2a76e	cand-rec-a-a1457c	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 05:31:22.351648
stlog-b786f985	cand-rec-a-7263eb	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 05:31:23.331819
stlog-54816151	cand-rec-a-7263eb	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 05:31:23.331981
stlog-6b5e3b5e	cand-rec-a-7263eb	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 05:31:23.39406
stlog-01f9b45b	cand-rec-a-7263eb	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 05:31:23.499399
stlog-fed562ad	cand-rec-a-7263eb	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 05:31:23.499494
stlog-f5b65047	cand-app1-2dbc33	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 05:31:24.800059
stlog-9eec29b9	cand-app1-2dbc33	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 05:31:24.800139
stlog-7268353a	cand-rec-a-75b072	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 05:31:39.92031
stlog-50a95946	cand-rec-a-75b072	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 05:31:39.920385
stlog-f1bad852	cand-rec-a-75b072	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 05:31:39.955386
stlog-1e5e1752	cand-rec-a-bb2dbc	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 05:31:41.189889
stlog-66fcbbb1	cand-rec-a-bb2dbc	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 05:31:41.190057
stlog-a45c87b5	cand-rec-a-bb2dbc	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 05:31:41.253048
stlog-f2d263d8	cand-rec-a-bb2dbc	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 05:31:41.30795
stlog-deb4c541	cand-rec-a-bb2dbc	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 05:31:41.308105
stlog-64c6d6ef	cand-app1-3ed97a	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 05:31:42.864536
stlog-928fdf2d	cand-app1-3ed97a	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 05:31:42.864667
stlog-fa6d69d5	cand-rec-a-b036fa	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 15:42:30.822174
stlog-8f208d3a	cand-rec-a-b036fa	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 15:42:30.822364
stlog-f09c5add	cand-rec-a-b036fa	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:42:30.849583
stlog-11940872	cand-rec-a-8526e5	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 15:42:32.135377
stlog-ae1a097f	cand-rec-a-8526e5	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 15:42:32.135425
stlog-475abaab	cand-rec-a-8526e5	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:42:32.16033
stlog-394bd8c5	cand-rec-a-8526e5	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 15:42:32.190708
stlog-1fe90bd5	cand-rec-a-8526e5	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 15:42:32.190798
stlog-4661e5ad	cand-app1-53611a	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 15:42:33.571322
stlog-66dbf7ac	cand-app1-53611a	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 15:42:33.571483
stlog-92d6b0e9	cand-rec-a-84e988	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 15:42:56.90451
stlog-704c7e8f	cand-rec-a-84e988	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 15:42:56.904559
stlog-97cb7c12	cand-rec-a-84e988	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:42:56.928783
stlog-7a7b3d16	cand-rec-a-1b8293	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 15:42:57.788004
stlog-3280d40c	cand-rec-a-1b8293	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 15:42:57.788053
stlog-a9bb8a75	cand-rec-a-1b8293	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:42:57.814162
stlog-a98e1303	cand-rec-a-1b8293	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 15:42:57.843319
stlog-d131a99d	cand-rec-a-1b8293	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 15:42:57.843401
stlog-90a76309	cand-app1-31a958	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 15:42:58.958374
stlog-0088b3fe	cand-app1-31a958	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 15:42:58.958426
stlog-cd470c59	cand-rec-a-decfed	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 15:45:10.246556
stlog-cfcf40b9	cand-rec-a-decfed	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 15:45:10.246656
stlog-e3708181	cand-rec-a-decfed	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:45:10.280594
stlog-6df0bb40	cand-rec-a-dc9174	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 15:45:11.577992
stlog-44ba989a	cand-rec-a-dc9174	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 15:45:11.578051
stlog-27896761	cand-rec-a-dc9174	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:45:11.60173
stlog-441b1b2f	cand-rec-a-dc9174	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 15:45:11.627556
stlog-17c3b75e	cand-rec-a-dc9174	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 15:45:11.627644
stlog-b5664e2b	cand-app1-0661f9	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 15:45:13.178431
stlog-adc2be96	cand-app1-0661f9	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 15:45:13.17849
stlog-c8653b4c	cand-rec-a-bd822b	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 15:54:01.99701
stlog-89cc3478	cand-rec-a-bd822b	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 15:54:01.997071
stlog-d09493d1	cand-rec-a-bd822b	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:54:02.030173
stlog-5179d886	cand-rec-a-9f854d	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 15:54:03.588374
stlog-06d096e8	cand-rec-a-9f854d	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 15:54:03.588412
stlog-e39adc66	cand-rec-a-9f854d	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:54:03.612154
stlog-80102035	cand-rec-a-9f854d	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 15:54:03.64102
stlog-7845d08f	cand-rec-a-9f854d	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 15:54:03.641181
stlog-5880f285	cand-app1-cee708	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 15:54:05.278453
stlog-0da3dfb3	cand-app1-cee708	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 15:54:05.278501
stlog-39882f20	cand-rec-a-a7e8d8	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 15:54:20.848201
stlog-4524e64d	cand-rec-a-a7e8d8	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 15:54:20.848257
stlog-53a36a84	cand-rec-a-a7e8d8	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:54:20.899183
stlog-79a62458	cand-rec-a-c8e711	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 15:54:22.00763
stlog-9dc1a901	cand-rec-a-c8e711	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 15:54:22.007671
stlog-6dcf5c8e	cand-rec-a-c8e711	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 15:54:22.321304
stlog-9979b61f	cand-rec-a-c8e711	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 15:54:22.358877
stlog-5c9632ac	cand-rec-a-c8e711	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 15:54:22.35909
stlog-d5fd2058	cand-app1-5396b7	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 15:54:23.733005
stlog-07fcffd7	cand-app1-5396b7	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 15:54:23.733092
stlog-8c185904	cand-rec-a-323ce5	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 16:08:40.97607
stlog-4aca1e01	cand-rec-a-323ce5	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 16:08:40.976336
stlog-4a606df1	cand-rec-a-323ce5	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 16:08:41.080798
stlog-bb8c553f	cand-rec-a-506bc0	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 16:08:44.741015
stlog-edc0dd88	cand-rec-a-506bc0	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 16:08:44.741467
stlog-86a43465	cand-rec-a-506bc0	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 16:08:44.813694
stlog-7814bf02	cand-rec-a-506bc0	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 16:08:44.888941
stlog-285db02e	cand-rec-a-506bc0	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 16:08:44.889336
stlog-38a56bee	cand-app1-6a2f8b	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 16:08:49.333324
stlog-78aaf4d8	cand-app1-6a2f8b	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 16:08:49.333445
stlog-fc7aa94b	cand-rec-a-ef5bfd	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-08 10:00	\N	2026-10-06 16:26:56.212561
stlog-bd8b3b7c	cand-rec-a-ef5bfd	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-08 10:00 (UTC)	\N	2026-10-06 16:26:56.212652
stlog-75ea0950	cand-rec-a-ef5bfd	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 16:26:56.268417
stlog-b0841b1c	cand-rec-a-d7c0da	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 14:00	\N	2026-10-06 16:26:57.491624
stlog-fb5a4b6c	cand-rec-a-d7c0da	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 14:00 (UTC)	\N	2026-10-06 16:26:57.491716
stlog-f3a4e432	cand-rec-a-d7c0da	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-06 16:26:57.514832
stlog-03b246c3	cand-rec-a-d7c0da	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-06 16:26:57.544236
stlog-c838f77e	cand-rec-a-d7c0da	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-06 16:26:57.544317
stlog-d6692e31	cand-app1-9e77a0	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-12 14:00	\N	2026-10-06 16:26:58.8833
stlog-3d0d93f3	cand-app1-9e77a0	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-12 14:00 (UTC)	\N	2026-10-06 16:26:58.883553
stlog-e291814c	cand-rec-a-3e23ba	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 10:00	\N	2026-10-07 03:16:36.751721
stlog-13fcdde4	cand-rec-a-3e23ba	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 10:00 (UTC)	\N	2026-10-07 03:16:36.751907
stlog-5de18c82	cand-rec-a-3e23ba	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-07 03:16:36.806804
stlog-865dfb32	cand-rec-a-24983e	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-10 14:00	\N	2026-10-07 03:16:37.972775
stlog-4680b85d	cand-rec-a-24983e	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-10 14:00 (UTC)	\N	2026-10-07 03:16:37.972906
stlog-f40c7df1	cand-rec-a-24983e	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-07 03:16:38.025769
stlog-3940d2da	cand-rec-a-24983e	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-07 03:16:38.065617
stlog-d7754b0b	cand-rec-a-24983e	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-07 03:16:38.065827
stlog-a0b3c13c	cand-app1-09339f	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-13 14:00	\N	2026-10-07 03:16:39.297833
stlog-d4d45aa5	cand-app1-09339f	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-13 14:00 (UTC)	\N	2026-10-07 03:16:39.297972
stlog-7342d72b	cand-rec-a-dfe12c	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-09 10:00	\N	2026-10-07 03:45:27.220113
stlog-699bc421	cand-rec-a-dfe12c	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-09 10:00 (UTC)	\N	2026-10-07 03:45:27.220164
stlog-98a2420d	cand-rec-a-dfe12c	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-07 03:45:27.247468
stlog-c1e904e5	cand-rec-a-811c87	stage	applied	interview	candidate	Interview self-scheduled for 2026-10-10 14:00	\N	2026-10-07 03:45:28.08796
stlog-6a390473	cand-rec-a-811c87	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-10 14:00 (UTC)	\N	2026-10-07 03:45:28.088015
stlog-b075795f	cand-rec-a-811c87	interview_status	scheduled	in_progress	candidate	Candidate joined and started the interview room session	\N	2026-10-07 03:45:28.10957
stlog-1c6f6d25	cand-rec-a-811c87	interview_status	in_progress	completed	system	AI interview session concluded and evaluated	\N	2026-10-07 03:45:28.145518
stlog-62e748bd	cand-rec-a-811c87	stage	interview	review	system	Interview completed; application in review stage	\N	2026-10-07 03:45:28.14561
stlog-242f72b5	cand-app1-16072c	stage	assessment	interview	candidate	Interview self-scheduled for 2026-10-13 14:00	\N	2026-10-07 03:45:28.878485
stlog-15d75d4c	cand-app1-16072c	interview_status	not_scheduled	scheduled	candidate	Interview self-scheduled slot: 2026-10-13 14:00 (UTC)	\N	2026-10-07 03:45:28.878521
stlog-bbe7c733	cand-4d50db	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-07 05:01:14.389407
stlog-1481fe36	cand-4d50db	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 15/100	\N	2026-10-07 05:01:17.106617
stlog-9a3804b3	cand-4d50db	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-07 05:01:17.106864
stlog-e4f05d85	cand-237f5e	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-07 05:10:21.513768
stlog-4e69425d	cand-237f5e	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 15/100	\N	2026-10-07 05:10:23.969036
stlog-dcee189a	cand-237f5e	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-07 05:10:23.96925
stlog-c9e5c27b	cand-d800f0	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-07 05:10:24.07054
stlog-a27a08d0	cand-d800f0	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-07 05:10:24.09167
stlog-2a7b13e9	cand-d800f0	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-07 05:10:24.091869
stlog-dc13f533	cand-005	stage	review	interview	admin@sparkx.ai		\N	2026-10-09 19:11:32.133033
stlog-e276f840	cand-8a4f2a	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-07 05:16:55.87175
stlog-c3e48cbd	cand-8a4f2a	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 15/100	\N	2026-10-07 05:16:58.439184
stlog-368ef0f7	cand-8a4f2a	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-07 05:16:58.439291
stlog-51b6b7e9	cand-f4b257	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-07 05:16:58.586082
stlog-74104a6e	cand-f4b257	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-07 05:16:58.598851
stlog-f460e866	cand-f4b257	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-07 05:16:58.598956
stlog-a59d6859	cand-879a48	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-08 03:21:32.388773
stlog-6884a49d	cand-879a48	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 15/100	\N	2026-10-08 03:21:35.148822
stlog-27714b8d	cand-879a48	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-08 03:21:35.149095
stlog-1a97afcc	cand-7cbad7	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-08 03:21:35.223001
stlog-26ede958	cand-7cbad7	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-08 03:21:35.24928
stlog-a57d64d3	cand-7cbad7	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-08 03:21:35.249469
stlog-2af2e6b6	cand-910000	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-08 04:28:48.085504
stlog-dd463e53	cand-910000	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 15/100	\N	2026-10-08 04:28:50.629441
stlog-2351adf9	cand-910000	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-08 04:28:50.629563
stlog-97e9df6e	cand-a02266	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-08 04:28:50.758695
stlog-9445d5ec	cand-a02266	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-08 04:28:50.773849
stlog-9ae14570	cand-a02266	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-08 04:28:50.773951
stlog-05c1b925	cand-4a8086	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-08 08:32:15.687957
stlog-9878007a	cand-4a8086	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 15/100	\N	2026-10-08 08:32:18.611398
stlog-93deb925	cand-4a8086	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-08 08:32:18.611468
stlog-a2484f0c	cand-5ed83b	assessment_status	in_progress	submitted	candidate	Candidate submitted assessment answers and practical work	\N	2026-10-08 08:32:18.739431
stlog-e8c35a97	cand-5ed83b	assessment_status	submitted	evaluated	system	Automated evaluation completed with score 0/100	\N	2026-10-08 08:32:18.750914
stlog-6870e177	cand-5ed83b	stage	assessment	review	system	Assessment evaluated; application in review stage	\N	2026-10-08 08:32:18.750984
stlog-418d5f55	cand-005	stage	interview	review	admin@sparkx.ai		\N	2026-10-09 19:11:37.642154
stlog-52b83a5f	cand-716a4e	stage	interview	review	admin@sparkx.ai		\N	2026-10-09 19:11:42.991721
stlog-5c60f632	cand-716a4e	stage	review	interview	admin@sparkx.ai		\N	2026-10-09 19:11:47.275632
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidates (id, user_id, job_id, company_name, organization_id, name, email, phone, applied_date, status, match_score, experience_years, education, skills, resume_summary, resume_filename, resume_text, fraud_flags, match_details, current_ctc, expected_ctc_type, expected_ctc_min, expected_ctc_max, ctc_currency, assessment_data, coding_language, coding_score, coding_submission, coding_results, integrity_score, integrity_risk, integrity_events, scores, interview_summary, evidence_snippets, interview_transcript, skill_gaps, hr_notes, final_decision, recruiter_score, rejection_reason, rejection_category, rationale_category, rationale_note, interview_scheduled_at, interview_meeting_url, interview_status, email_logs, stage, assessment_status, assessment_invited_at, assessment_started_at, assessment_submitted_at, assessment_evaluated_at, interview_started_at, interview_completed_at, hiring_decision, stage_updated_at, decision_updated_at, expected_update_date, update_notes, update_status, update_sent_at, reminder_sent_flags, assessment_version, assessment_blueprint, external_assessment_platform, external_assessment_id, external_assessment_url, external_assessment_result, external_assessment_synced_at, reopened_at, reopened_by, reopen_reason, previous_final_decision, version, created_at) FROM stdin;
cand-002	\N	job-101	SparkX Technologies	org-sparkx-default	Neha Patel	neha.patel@techmail.in	+91 98111 22334	2026-09-18	Under Review	86	3.2	B.E. Information Technology, Pune University (2023)	["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Tailwind CSS"]	Full-Stack Engineer with 3.2+ years designing cloud microservices, responsive web dashboards, and AI-assisted workflows.\n\nKey Achievements & Production Deliverables:\n• Built scalable RESTful services using FastAPI and PostgreSQL, supporting 20k+ daily active frontend sessions.\n• Developed rich analytics dashboards with React, TypeScript, and Tailwind CSS, improving recruiter operational efficiency by 35%.\n• Integrated client-side streaming consumption via ReadableStream APIs to render real-time AI responses with zero UI stutter.\n• Collaborated on containerized deployments using Docker and GitHub Actions for continuous zero-downtime releases.	\N	\N	[]	{}	19.50	range	22.00	26.00	INR	{}	\N	0	\N	{}	88	Low	[{"id": "e1", "timestamp": "00:08", "type": "FACE_VERIFIED", "description": "Face verified at interview start."}, {"id": "e2", "timestamp": "04:12", "type": "TAB_SWITCH", "description": "Window lost focus for 2.4 seconds (candidate returned promptly)."}]	{"jobSkills": 84, "technicalScore": 82, "communication": 92, "problemSolving": 85, "overall": 86}	Strong full-stack fundamentals and exceptionally articulate communicator. Slightly less experience in deep PyTorch internals, but demonstrates fast learning ability.	[{"question": "How would you architect a low-latency LLM agent pipeline?", "answer": "I would use FastAPI with asynchronous endpoints, streaming tokens directly to the React frontend using ReadableStream readers.", "aiInsight": "Clean frontend-to-backend data flow explanation."}]	[]	{"missingSkills": ["PyTorch model fine-tuning", "Advanced Vector Indexing (HNSW)"], "strongSkills": ["React", "FastAPI", "REST APIs", "Clean Code Architecture"], "recommendations": ["Complete Deep Learning Foundations on Hugging Face / PyTorch.", "Practice implementing RAG with vector search indexing."], "readiness": "Hire-and-Develop (Trainable within 30 days)"}		Under Review	\N	\N	\N	\N	\N	Upcoming Slot	https://meet.google.com/spk-002-rec	not_scheduled	[]	assessment	evaluated	2026-09-23 10:13:31.271837	\N	\N	\N	\N	\N	undecided	2026-09-28 16:38:53.365423	\N	\N	\N	not_set	\N	{}	1	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	9	2026-09-19 15:41:12.278716
cand-004	\N	job-101	SparkX Technologies	org-sparkx-default	Priya Nair	priya.nair@techinnovations.io	+91 97654 32109	2026-09-19	Screening	89	3.5	B.Tech Computer Science, BITS Pilani (2022)	["Python", "FastAPI", "Docker", "PostgreSQL", "LangChain", "Kubernetes"]	Cloud Backend & AI Systems Engineer with 3.5+ years building distributed API gateways, asynchronous message queues, and production LLM orchestration.\n\nKey Achievements & Production Deliverables:\n• Architected scalable microservices handling large-scale text ingestion and vector indexing using Python, FastAPI, and PostgreSQL.\n• Containerized multi-agent LLM pipelines with Docker and Kubernetes, reducing compute resource consumption by 28%.\n• Designed robust database schemas, transactional integrity checks, and high-concurrency connection pooling.	\N	\N	[]	{}	21.00	range	24.00	28.00	INR	{}	\N	0	\N	{}	100	Low	[]	{"jobSkills": 88, "technicalScore": 87, "communication": 91, "problemSolving": 89, "overall": 89}	\N	[]	[]	{}		Selected	\N	\N	\N	\N	\N	Tomorrow, 02:30 PM	https://meet.google.com/spk-aixr-rec	scheduled	[]	screening	evaluated	\N	\N	\N	\N	\N	\N	undecided	2026-09-25 05:51:18.115194	\N	\N	\N	not_set	\N	{}	1	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	5	2026-09-19 15:41:12.288289
cand-005	\N	job-101	SparkX Technologies	org-sparkx-default	Vikram Malhotra	vikram.malhotra@cloudai.dev	+91 98450 11223	2026-09-17	Evaluated	92	4.8	M.Tech AI & Data Systems, IIIT Hyderabad (2021)	["Python", "FastAPI", "React", "PyTorch", "pgvector", "LangChain", "System Design"]	Lead ML Platform Engineer with 4.8+ years designing scalable agentic workflows, high-frequency inference endpoints, and vector search systems.\n\nKey Achievements & Production Deliverables:\n• Designed real-time LLM inference pipelines delivering streaming token output with sub-90ms time-to-first-token (TTFT).\n• Implemented custom HNSW vector indices on pgvector with periodic re-indexing and memory caching layers.\n• Authored system design specifications for enterprise AI platforms handling multi-modal document and audio inputs.	\N	\N	[]	{}	32.00	range	36.00	42.00	INR	{}	\N	0	\N	{}	100	Low	[]	{"jobSkills": 93, "technicalScore": 91, "communication": 90, "problemSolving": 92, "overall": 92}	\N	[]	[]	{}		Rejected	\N	Candidate did not meet role requirements at this time.	Assessment Performance	\N	\N	\N	\N	completed	[]	review	evaluated	\N	\N	\N	\N	\N	\N	undecided	2026-10-09 19:11:37.642041	\N	\N	\N	not_set	\N	{}	1	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	7	2026-09-19 15:41:12.288297
cand-006	\N	job-102	SparkX Technologies	org-sparkx-default	Kavita Sen	kavita.sen@frontendlab.org	+91 99887 66554	2026-09-16	Completed	96	4	B.E. Computer Engineering, Delhi Technological University (2022)	["React", "TypeScript", "Tailwind CSS", "Canvas API", "Web Speech API", "Micro-frontends"]	Staff Frontend & Systems Engineer with 4.0+ years architecting high-frequency telemetry dashboards, real-time video canvases, and accessible design systems.\n\nKey Achievements & Production Deliverables:\n• Architected 60fps real-time computer vision overlays using Web Workers, OffscreenCanvas, and double-buffered render pipelines.\n• Built comprehensive enterprise design systems in React and Tailwind CSS with strict WCAG 2.1 AA accessibility standards.\n• Reduced frontend bundle sizes by 45% through aggressive code-splitting and dynamic route-based asset delivery.	\N	\N	[]	{}	24.50	range	28.00	32.00	INR	{}	\N	0	\N	{}	98	Low	[{"id": "e1", "timestamp": "00:10", "type": "FACE_VERIFIED", "description": "Identity confirmed at session start."}, {"id": "e2", "timestamp": "05:22", "type": "FOCUS_MAINTAINED", "description": "Continuous single-person engagement throughout assessment."}]	{"jobSkills": 96, "technicalScore": 95, "communication": 94, "problemSolving": 92, "overall": 95}	Exceptional UI architecture mastery. Demonstrated custom WebRTC hook implementation and 60fps canvas bounding box calculations with zero lag. Clear communicator and team player.	[{"question": "How do you ensure smooth 60fps rendering with real-time video overlay and Canvas?", "answer": "We offload vision landmark inferences to a Web Worker using OffscreenCanvas and bind render cycles strictly to requestAnimationFrame with double-buffered layers.", "aiInsight": "Candidate demonstrated pristine systems-level frontend performance engineering."}]	[]	{"missingSkills": [], "strongSkills": ["React", "Canvas API", "Performance Optimization", "Accessibility"], "recommendations": ["Ready to mentor junior frontend engineers."], "readiness": "Senior Ready"}		Offered	\N	\N	\N	\N	\N	Completed (2026-09-18)	https://meet.google.com/spk-006-rec	completed	[]	completed	evaluated	\N	\N	\N	\N	\N	\N	accepted	2026-09-25 05:51:57.695659	\N	\N	\N	not_set	\N	{}	1	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	3	2026-09-19 15:41:12.288301
cand-0db7e4	usr-7547759d	job-101	SparkX Technologies	org-sparkx-default	Burhan Kapasi	bkapasi472@rku.ac.in	7201888684	2026-09-19	Under Review	45	3	Btech IT 	["React Python Node"]	Candidate profile extracted.	\N	\N	[]	{}	\N	range	\N	\N	INR	{}	\N	0	\N	{}	100	Low	[]	{}	\N	[]	[]	{}		Selected	\N	\N	\N	\N	\N	Upcoming Slot	https://meet.google.com/spk-0db-7e4	Offer Sent	[{"id": "eml-cf6483", "type": "application_received", "subject": "Application Received \\u2014 Senior AI / Full-Stack Engineer at SparkX AI", "sent_at": "2026-09-19 16:09 UTC", "recipient": "bkapasi472@rku.ac.in", "body": "Dear Burhan Kapasi,\\n\\nThank you for applying for the position of Senior AI / Full-Stack Engineer. Your resume has been parsed and matched against our core competency benchmarks (Match Score: 45%).\\n\\nNext Step: Your profile is ready for your AI Video Interview session.\\n\\nBest regards,\\nSparkX AI Talent Acquisition Team"}]	assessment	invited	2026-09-24 12:46:47.309439	\N	\N	\N	\N	\N	undecided	2026-09-24 12:46:47.244313	\N	\N	\N	not_set	\N	{}	1	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	6	2026-09-19 16:09:45.934318
\.


--
-- Data for Name: coding_problem_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_problem_versions (id, problem_id, version_number, title, problem_statement, difficulty, constraints, input_format, output_format, execution_mode, function_name, function_signature, time_limit_sec, memory_limit_mb, allowed_languages, starter_code, change_summary, created_at) FROM stdin;
cpv-d12ab5a7	prob-d76120d9	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 16:33:00.830744
cpv-23304087	prob-cce465e5	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 16:48:20.624107
cpv-3c10367a	prob-97a99bea	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 16:55:30.300972
cpv-26480d15	prob-20e517fe	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 17:29:13.600589
cpv-b13b4e5b	prob-dfaa9cf5	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 17:39:42.023246
cpv-014be28d	prob-596bf1d6	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 17:48:11.723353
cpv-36afb933	prob-a1af1685	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 18:09:09.788507
cpv-5f08d900	prob-41af94e1	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 18:20:43.452789
cpv-f5ae4392	prob-94fb0155	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-09-30 18:37:24.225741
cpv-8ec34730	prob-f0c880f7	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-01 03:26:00.815507
cpv-d353d702	prob-257d0d23	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-01 03:33:04.709857
cpv-5dca1956	prob-adce1497	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-01 03:38:43.532657
cpv-a6075683	prob-b7bf785d	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Medium	\N	\N	\N	function	solve	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-01 03:46:43.533843
cpv-4e346796	prob-b7bf785d	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	solve	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-01 03:46:43.666254
cpv-45ce320b	prob-b333f700	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-01 03:48:42.852017
cpv-ec53e69d	prob-b333f700	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-01 03:48:42.937014
cpv-8e9f8210	prob-798451b6	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-01 03:54:24.366736
cpv-71a97d09	prob-4522f1dd	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-01 03:55:12.062306
cpv-fe844897	prob-4522f1dd	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-01 03:55:12.156777
cpv-2e25f091	prob-c209bfae	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-01 04:50:57.673047
cpv-31ad24f7	prob-4f75cb7b	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-01 05:10:34.258088
cpv-37da72bd	prob-4f75cb7b	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-01 05:10:34.345728
cpv-c112c436	prob-494c81b2	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-01 05:28:52.844718
cpv-05636ff6	prob-135ad7a5	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-01 05:29:24.505919
cpv-1857024a	prob-135ad7a5	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-01 05:29:24.598245
cpv-84766e54	prob-bb662231	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 06:29:19.741926
cpv-2ebf8546	prob-63d4c9cb	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 06:29:53.973671
cpv-46eb8eca	prob-63d4c9cb	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 06:29:54.049865
cpv-71d1579e	prob-62c38cdf	1	Custom Tenant Problem ed25bb	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 06:45:10.362709
cpv-26fe838c	prob-a9baa6a8	1	Custom Tenant Problem 0ba159	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 06:45:31.34716
cpv-14e673e1	prob-8090ddc9	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 06:46:24.037223
cpv-79a9f5a4	prob-e3ab629f	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 06:46:57.035586
cpv-c711fb32	prob-e3ab629f	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 06:46:57.110378
cpv-a72a59df	prob-d8ee37e1	1	Custom Tenant Problem f80d69	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 06:47:06.83097
cpv-45e998a7	prob-91aac793	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 07:09:49.952551
cpv-c382a5c3	prob-38c4271f	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 07:10:29.26028
cpv-36fb4b40	prob-38c4271f	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 07:10:29.337457
cpv-1e519b27	prob-afebc829	1	Custom Tenant Problem 4fb773	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 07:10:38.874819
cpv-bed20b69	prob-2f1add36	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 07:43:15.275485
cpv-c44449a4	prob-91d54784	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 07:43:51.298276
cpv-d4abe139	prob-91d54784	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 07:43:51.37623
cpv-a234cb45	prob-d9c5c5da	1	Custom Tenant Problem 2f7877	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 07:44:02.817038
cpv-01db32a7	prob-ee5adf4d	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 08:12:35.125534
cpv-77314e54	prob-388107c0	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 08:13:11.05433
cpv-abdb1444	prob-388107c0	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 08:13:11.192306
cpv-f257af1f	prob-89072de3	1	Custom Tenant Problem f8201c	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 08:13:23.698878
cpv-4228908e	prob-98c11bf2	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 08:15:25.642303
cpv-1212b21f	prob-b9dfa6aa	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 08:16:00.16347
cpv-d408aede	prob-b9dfa6aa	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 08:16:00.283172
cpv-eaace343	prob-3c5bd6dd	1	Custom Tenant Problem 72d630	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 08:16:13.419725
cpv-ea4c7ab9	prob-4193c980	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-04 08:22:42.920397
cpv-193eefa9	prob-19a521b1	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-04 08:23:20.6947
cpv-73ab3fab	prob-19a521b1	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-04 08:23:20.928583
cpv-d208c45c	prob-30d1abdb	1	Custom Tenant Problem c383bb	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 08:23:49.16677
cpv-bb0e1ee6	prob-1ae9521e	1	Custom Tenant Problem f32301	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-04 15:13:04.225701
cpv-9c203f94	prob-2470f6cc	1	Custom Tenant Problem 9ad743	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-05 03:24:59.743071
cpv-d300890e	prob-6bd8fe28	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-07 04:17:44.171894
cpv-ccb67b51	prob-655978f3	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-07 04:17:53.831212
cpv-212301f0	prob-655978f3	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-07 04:17:53.991161
cpv-2282850f	prob-6990b0d3	1	Custom Tenant Problem 6d9f61	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-07 04:18:06.20003
cpv-8e869edb	prob-0eeaad3d	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-07 05:16:41.774578
cpv-45d558c0	prob-ef709f17	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-07 05:16:50.748356
cpv-2388563e	prob-ef709f17	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-07 05:16:50.811699
cpv-99b1d497	prob-4a85a14e	1	Custom Tenant Problem 9880d3	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-07 05:17:02.651774
cpv-14db15c5	prob-86eeca7f	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-08 03:21:16.089935
cpv-988258a8	prob-310cba66	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-08 03:21:26.219404
cpv-d1cccf53	prob-310cba66	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-08 03:21:26.299468
cpv-46b82888	prob-043390e4	1	Custom Tenant Problem 8c8a93	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-08 03:21:39.917809
cpv-7cedcf11	prob-15741b01	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-08 04:27:52.769395
cpv-89993c76	prob-ecece3d4	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-08 04:28:39.679941
cpv-74d62e60	prob-ecece3d4	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-08 04:28:39.795737
cpv-490be401	prob-3aa709e6	1	Custom Tenant Problem d45b72	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-08 04:28:58.139463
cpv-3b51547e	prob-673e17c7	1	LRU Cache with O(1) Operations	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	1 <= capacity <= 3000, 0 <= key <= 10^4, 0 <= value <= 10^5	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	Initial stable release	2026-10-08 08:31:22.427118
cpv-43cb8947	prob-2ea39745	1	Reverse String Function	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Initial recruiter authored version	2026-10-08 08:32:08.540234
cpv-6a4100e5	prob-2ea39745	2	Reverse String Function (Optimized)	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	Added edge case tests and clarified constraints	2026-10-08 08:32:08.648874
cpv-eff36d9f	prob-ee2ca853	1	Custom Tenant Problem 336167	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	Initial recruiter authored version	2026-10-08 08:32:23.823341
\.


--
-- Data for Name: coding_problems; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_problems (id, organization_id, is_system, title, slug, problem_statement, difficulty, constraints, input_format, output_format, execution_mode, function_name, function_signature, time_limit_sec, memory_limit_mb, allowed_languages, starter_code, solution_template, current_version, is_active, created_by, created_at, updated_at) FROM stdin;
prob-d76120d9	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-3d4c	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 16:33:00.753262	2026-09-30 16:33:00.942986
prob-3879c7bb	org-alpha-cdf8d3	f	Custom In-House Token Bucket Rate Limiter	token-bucket-ac28	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 16:33:00.753277	2026-09-30 16:33:00.753279
prob-h-f39799	\N	t	Reverse Linked List	reverse-linked-list-980770	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 16:47:42.922531	2026-09-30 16:47:42.922536
prob-t-4fdeb6	\N	t	Fix Memory Leak	fix-memory-leak-9d243a	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 16:47:42.92254	2026-09-30 16:47:42.922542
prob-h-477711	\N	t	Reverse Linked List	reverse-linked-list-6e8873	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 16:48:10.720052	2026-09-30 16:48:10.720056
prob-t-fa0359	\N	t	Fix Memory Leak	fix-memory-leak-320ee2	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 16:48:10.720059	2026-09-30 16:48:10.720061
prob-cce465e5	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-2aa8	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 16:48:20.59464	2026-09-30 16:48:20.651157
prob-9dd7f0ff	org-alpha-0489df	f	Custom In-House Token Bucket Rate Limiter	token-bucket-bc4d	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 16:48:20.594644	2026-09-30 16:48:20.594645
prob-h-5021ee	\N	t	Reverse Linked List	reverse-linked-list-75c613	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 16:55:19.103734	2026-09-30 16:55:19.103737
prob-t-188f23	\N	t	Fix Memory Leak	fix-memory-leak-a0cf02	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 16:55:19.10374	2026-09-30 16:55:19.10374
prob-97a99bea	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-083a	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 16:55:30.253277	2026-09-30 16:55:30.337202
prob-9b13a0f8	org-alpha-b62ec0	f	Custom In-House Token Bucket Rate Limiter	token-bucket-fa79	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 16:55:30.253281	2026-09-30 16:55:30.253281
prob-h-024aa2	\N	t	Reverse Linked List	reverse-linked-list-2ad71d	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:01:12.331292	2026-09-30 17:01:12.331295
prob-t-7b4f9a	\N	t	Fix Memory Leak	fix-memory-leak-33f972	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:01:12.331297	2026-09-30 17:01:12.331298
prob-h-376188	\N	t	Reverse Linked List	reverse-linked-list-c36016	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:18:41.73051	2026-09-30 17:18:41.730523
prob-t-21b5c8	\N	t	Fix Memory Leak	fix-memory-leak-5ee6f4	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:18:41.730533	2026-09-30 17:18:41.730537
prob-h-a1c727	\N	t	Reverse Linked List	reverse-linked-list-bf21a9	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:28:59.656983	2026-09-30 17:28:59.656987
prob-t-b427a1	\N	t	Fix Memory Leak	fix-memory-leak-d7428e	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:28:59.656991	2026-09-30 17:28:59.656992
prob-20e517fe	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-b26e	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 17:29:13.540047	2026-09-30 17:29:13.654816
prob-78c3b3cb	org-alpha-26bfc6	f	Custom In-House Token Bucket Rate Limiter	token-bucket-b4d9	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 17:29:13.540054	2026-09-30 17:29:13.540055
prob-h-2d4d18	\N	t	Reverse Linked List	reverse-linked-list-2c487e	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:39:32.237468	2026-09-30 17:39:32.237479
prob-t-9b2f77	\N	t	Fix Memory Leak	fix-memory-leak-3349e6	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:39:32.237485	2026-09-30 17:39:32.237486
prob-dfaa9cf5	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-2042	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 17:39:41.997145	2026-09-30 17:39:42.046493
prob-5987d374	org-alpha-240684	f	Custom In-House Token Bucket Rate Limiter	token-bucket-4234	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 17:39:41.99715	2026-09-30 17:39:41.997151
prob-h-9742f4	\N	t	Reverse Linked List	reverse-linked-list-00a818	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:47:58.576282	2026-09-30 17:47:58.576285
prob-t-ca23c3	\N	t	Fix Memory Leak	fix-memory-leak-00057d	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 17:47:58.576287	2026-09-30 17:47:58.576287
prob-596bf1d6	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-e850	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 17:48:11.69983	2026-09-30 17:48:11.743667
prob-3865b5b0	org-alpha-5e1180	f	Custom In-House Token Bucket Rate Limiter	token-bucket-2b93	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 17:48:11.699835	2026-09-30 17:48:11.699836
prob-h-61043d	\N	t	Reverse Linked List	reverse-linked-list-aebb7d	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:09:00.811426	2026-09-30 18:09:00.81143
prob-t-bcdc6c	\N	t	Fix Memory Leak	fix-memory-leak-1bcfa8	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:09:00.811435	2026-09-30 18:09:00.811437
prob-a1af1685	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-f5ff	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 18:09:09.749026	2026-09-30 18:09:09.819412
prob-d1a6229c	org-alpha-88799c	f	Custom In-House Token Bucket Rate Limiter	token-bucket-77e8	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 18:09:09.749033	2026-09-30 18:09:09.749034
prob-h-f3f378	\N	t	Reverse Linked List	reverse-linked-list-017cd7	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:20:24.163059	2026-09-30 18:20:24.163062
prob-t-e41d87	\N	t	Fix Memory Leak	fix-memory-leak-0bd02b	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:20:24.163065	2026-09-30 18:20:24.163065
prob-41af94e1	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-394c	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 18:20:43.357657	2026-09-30 18:20:43.528138
prob-d7b11b52	org-alpha-b11a6e	f	Custom In-House Token Bucket Rate Limiter	token-bucket-3273	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 18:20:43.357681	2026-09-30 18:20:43.357686
prob-h-318b5c	\N	t	Reverse Linked List	reverse-linked-list-8c91ee	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:30:11.468798	2026-09-30 18:30:11.468811
prob-t-a9a832	\N	t	Fix Memory Leak	fix-memory-leak-504c7f	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:30:11.468824	2026-09-30 18:30:11.468829
prob-h-697327	\N	t	Reverse Linked List	reverse-linked-list-a31389	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:37:07.840312	2026-09-30 18:37:07.840317
prob-t-855460	\N	t	Fix Memory Leak	fix-memory-leak-0727da	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-09-30 18:37:07.840323	2026-09-30 18:37:07.840324
prob-94fb0155	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-e8b9	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-09-30 18:37:24.16997	2026-09-30 18:37:24.270744
prob-947585b4	org-alpha-cbef7b	f	Custom In-House Token Bucket Rate Limiter	token-bucket-ba28	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-09-30 18:37:24.169975	2026-09-30 18:37:24.169976
prob-h-f56550	\N	t	Reverse Linked List	reverse-linked-list-880fca	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:25:45.558189	2026-10-01 03:25:45.558192
prob-t-e8d541	\N	t	Fix Memory Leak	fix-memory-leak-426f5b	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:25:45.558195	2026-10-01 03:25:45.558195
prob-f0c880f7	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-f9ad	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-01 03:26:00.793605	2026-10-01 03:26:00.835556
prob-98575a07	org-alpha-14631a	f	Custom In-House Token Bucket Rate Limiter	token-bucket-080a	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-01 03:26:00.79361	2026-10-01 03:26:00.793611
prob-h-4ad257	\N	t	Reverse Linked List	reverse-linked-list-8b5d4f	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:32:55.208057	2026-10-01 03:32:55.208059
prob-t-ab50b8	\N	t	Fix Memory Leak	fix-memory-leak-5eb5ce	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:32:55.208061	2026-10-01 03:32:55.208062
prob-257d0d23	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-244d	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-01 03:33:04.688178	2026-10-01 03:33:04.727622
prob-36a85962	org-alpha-625a5d	f	Custom In-House Token Bucket Rate Limiter	token-bucket-0341	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-01 03:33:04.688182	2026-10-01 03:33:04.688183
prob-adce1497	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-ef2c	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-01 03:38:43.502881	2026-10-01 03:38:43.555608
prob-a7face02	org-alpha-ea1415	f	Custom In-House Token Bucket Rate Limiter	token-bucket-0bbc	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-01 03:38:43.502885	2026-10-01 03:38:43.502886
prob-h-3bde4a	\N	t	Reverse Linked List	reverse-linked-list-bb0e44	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:38:49.988033	2026-10-01 03:38:49.988035
prob-t-f50ec4	\N	t	Fix Memory Leak	fix-memory-leak-a916c5	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:38:49.988038	2026-10-01 03:38:49.988039
prob-b7bf785d	org-alpha-decfe3	f	Reverse String Function (Optimized)	reverse-string-function-1c33	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	solve	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-9f695031	2026-10-01 03:46:43.529109	2026-10-01 03:46:43.663655
prob-b333f700	org-alpha-fa74ed	f	Reverse String Function (Optimized)	reverse-string-function-d698	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-b220bec5	2026-10-01 03:48:42.848639	2026-10-01 03:48:42.934358
prob-798451b6	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-66af	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-01 03:54:24.345087	2026-10-01 03:54:24.38333
prob-fbad295a	org-alpha-0af02a	f	Custom In-House Token Bucket Rate Limiter	token-bucket-eb3c	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-01 03:54:24.345091	2026-10-01 03:54:24.345092
prob-h-6954bc	\N	t	Reverse Linked List	reverse-linked-list-b0d627	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:54:30.908043	2026-10-01 03:54:30.908046
prob-t-23d65b	\N	t	Fix Memory Leak	fix-memory-leak-e4b076	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 03:54:30.908049	2026-10-01 03:54:30.908049
prob-4522f1dd	org-alpha-ac945e	f	Reverse String Function (Optimized)	reverse-string-function-5d57	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-12a1b1fc	2026-10-01 03:55:12.058005	2026-10-01 03:55:12.154061
prob-c209bfae	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-f383	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-01 04:50:57.634216	2026-10-01 04:50:57.696841
prob-58e7de18	org-alpha-a840fb	f	Custom In-House Token Bucket Rate Limiter	token-bucket-2fc0	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-01 04:50:57.634224	2026-10-01 04:50:57.634225
prob-h-8b557f	\N	t	Reverse Linked List	reverse-linked-list-00b370	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 05:07:38.557865	2026-10-01 05:07:38.55787
prob-t-589d2e	\N	t	Fix Memory Leak	fix-memory-leak-286208	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 05:07:38.557874	2026-10-01 05:07:38.557875
prob-4f75cb7b	org-alpha-9934d6	f	Reverse String Function (Optimized)	reverse-string-function-43e8	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-12b6959d	2026-10-01 05:10:34.255066	2026-10-01 05:10:34.342467
prob-69386c73	org-ea7ebe	f	Sum Problem	sum-prob-e6b762	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:16:05.252779	2026-10-01 05:16:05.252783
prob-bdd819c1	org-ea7ebe	f	Multiply Problem	mult-prob-f5416b	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:16:05.270802	2026-10-01 05:16:05.270814
prob-a55994ac	org-fbc9c0	f	Sum Problem	sum-prob-9575a1	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:16:56.296857	2026-10-01 05:16:56.296861
prob-73061b1f	org-fbc9c0	f	Multiply Problem	mult-prob-d5f481	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:16:56.327397	2026-10-01 05:16:56.327399
prob-9d605df5	org-200e04	f	Sum Problem	sum-prob-2b205a	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:17:17.752111	2026-10-01 05:17:17.752115
prob-0b2113ae	org-200e04	f	Multiply Problem	mult-prob-e16759	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:17:17.759141	2026-10-01 05:17:17.759146
prob-b4e081fc	org-5b0556	f	Sum Problem	sum-prob-db3e31	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:17:38.375611	2026-10-01 05:17:38.375614
prob-adbddc32	org-5b0556	f	Multiply Problem	mult-prob-344c07	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:17:38.381433	2026-10-01 05:17:38.381434
prob-494c81b2	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-c46f	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-01 05:28:52.820532	2026-10-01 05:28:52.870314
prob-2e2d2291	org-alpha-b0ead8	f	Custom In-House Token Bucket Rate Limiter	token-bucket-41df	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-01 05:28:52.820536	2026-10-01 05:28:52.820537
prob-h-8ceb5b	\N	t	Reverse Linked List	reverse-linked-list-b5487d	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 05:28:54.440679	2026-10-01 05:28:54.440682
prob-t-d38256	\N	t	Fix Memory Leak	fix-memory-leak-bc8255	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-01 05:28:54.440684	2026-10-01 05:28:54.440685
prob-135ad7a5	org-alpha-7587cd	f	Reverse String Function (Optimized)	reverse-string-function-58f8	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-e9fb1e5e	2026-10-01 05:29:24.503456	2026-10-01 05:29:24.596144
prob-dca6e531	org-126608	f	Sum Problem	sum-prob-c568e0	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:29:28.565029	2026-10-01 05:29:28.565031
prob-b6ad9ef9	org-126608	f	Multiply Problem	mult-prob-820ede	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-01 05:29:28.571991	2026-10-01 05:29:28.571992
prob-bb662231	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-b115	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 06:29:19.686921	2026-10-04 06:29:19.777036
prob-f61b11a9	org-alpha-04e008	f	Custom In-House Token Bucket Rate Limiter	token-bucket-7312	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 06:29:19.686925	2026-10-04 06:29:19.686926
prob-h-0e8f2a	\N	t	Reverse Linked List	reverse-linked-list-6e596d	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 06:29:21.772835	2026-10-04 06:29:21.772838
prob-t-df5b97	\N	t	Fix Memory Leak	fix-memory-leak-cecb23	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 06:29:21.77284	2026-10-04 06:29:21.772841
prob-63d4c9cb	org-alpha-17bd94	f	Reverse String Function (Optimized)	reverse-string-function-4928	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-6b9c9368	2026-10-04 06:29:53.969606	2026-10-04 06:29:54.047454
prob-e1007f9a	org-45f0b8	f	Sum Problem	sum-prob-3343e1	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 06:29:58.355586	2026-10-04 06:29:58.355589
prob-969f89d2	org-45f0b8	f	Multiply Problem	mult-prob-eb11e6	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 06:29:58.364591	2026-10-04 06:29:58.364593
prob-62c38cdf	org-alpha-ed25bb	f	Custom Tenant Problem ed25bb	custom-tenant-problem-ed25bb-ef09	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-ed25bb	2026-10-04 06:45:10.359959	2026-10-04 06:45:10.359962
prob-a9baa6a8	org-alpha-0ba159	f	Custom Tenant Problem 0ba159	custom-tenant-problem-0ba159-61e2	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-0ba159	2026-10-04 06:45:31.343892	2026-10-04 06:45:31.343896
prob-8090ddc9	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-4975	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 06:46:24.012771	2026-10-04 06:46:24.059016
prob-f7ce6a48	org-alpha-393c50	f	Custom In-House Token Bucket Rate Limiter	token-bucket-1e13	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 06:46:24.012775	2026-10-04 06:46:24.012775
prob-h-d0d23a	\N	t	Reverse Linked List	reverse-linked-list-548acc	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 06:46:25.485798	2026-10-04 06:46:25.485801
prob-t-2c2dcf	\N	t	Fix Memory Leak	fix-memory-leak-fb410d	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 06:46:25.485803	2026-10-04 06:46:25.485804
prob-e3ab629f	org-alpha-0c28e9	f	Reverse String Function (Optimized)	reverse-string-function-03c3	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-41abd1a8	2026-10-04 06:46:57.033024	2026-10-04 06:46:57.107965
prob-ff4b43c5	org-00ab20	f	Sum Problem	sum-prob-6f301d	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 06:47:01.187085	2026-10-04 06:47:01.187088
prob-0cf1c145	org-00ab20	f	Multiply Problem	mult-prob-94f2e9	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 06:47:01.192355	2026-10-04 06:47:01.192356
prob-d8ee37e1	org-alpha-f80d69	f	Custom Tenant Problem f80d69	custom-tenant-problem-f80d69-23b7	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-f80d69	2026-10-04 06:47:06.828595	2026-10-04 06:47:06.828598
prob-91aac793	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-7a1a	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 07:09:49.928973	2026-10-04 07:09:49.974786
prob-52873358	org-alpha-93f852	f	Custom In-House Token Bucket Rate Limiter	token-bucket-ee2a	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 07:09:49.928977	2026-10-04 07:09:49.928978
prob-h-59b705	\N	t	Reverse Linked List	reverse-linked-list-368594	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 07:09:51.418729	2026-10-04 07:09:51.418732
prob-t-7fa8d0	\N	t	Fix Memory Leak	fix-memory-leak-ccff64	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 07:09:51.418734	2026-10-04 07:09:51.418735
prob-38c4271f	org-alpha-bc8211	f	Reverse String Function (Optimized)	reverse-string-function-9e68	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-3fbfddd6	2026-10-04 07:10:29.256082	2026-10-04 07:10:29.335138
prob-8964a623	org-38b2e2	f	Sum Problem	sum-prob-3195b9	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 07:10:33.392373	2026-10-04 07:10:33.392376
prob-9f1555bf	org-38b2e2	f	Multiply Problem	mult-prob-ffa228	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 07:10:33.399301	2026-10-04 07:10:33.399303
prob-afebc829	org-alpha-4fb773	f	Custom Tenant Problem 4fb773	custom-tenant-problem-4fb773-6e91	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-4fb773	2026-10-04 07:10:38.872365	2026-10-04 07:10:38.872368
prob-2f1add36	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-b4a2	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 07:43:15.229914	2026-10-04 07:43:15.325924
prob-95722abf	org-alpha-5fed0b	f	Custom In-House Token Bucket Rate Limiter	token-bucket-3239	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 07:43:15.229922	2026-10-04 07:43:15.229924
prob-h-3b0851	\N	t	Reverse Linked List	reverse-linked-list-bca7c2	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 07:43:17.809678	2026-10-04 07:43:17.809682
prob-t-878487	\N	t	Fix Memory Leak	fix-memory-leak-956220	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 07:43:17.809687	2026-10-04 07:43:17.809689
prob-91d54784	org-alpha-6c8147	f	Reverse String Function (Optimized)	reverse-string-function-37a1	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-6c1d6f38	2026-10-04 07:43:51.295637	2026-10-04 07:43:51.37306
prob-38d3c4ca	org-c66949	f	Sum Problem	sum-prob-81696d	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 07:43:56.364528	2026-10-04 07:43:56.364531
prob-b6780273	org-c66949	f	Multiply Problem	mult-prob-f0ea7d	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 07:43:56.37146	2026-10-04 07:43:56.371461
prob-d9c5c5da	org-alpha-2f7877	f	Custom Tenant Problem 2f7877	custom-tenant-problem-2f7877-135c	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-2f7877	2026-10-04 07:44:02.812809	2026-10-04 07:44:02.812815
prob-ee5adf4d	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-3eae	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 08:12:35.095289	2026-10-04 08:12:35.163828
prob-37c5fccf	org-alpha-3d4842	f	Custom In-House Token Bucket Rate Limiter	token-bucket-22d4	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 08:12:35.095295	2026-10-04 08:12:35.095296
prob-h-ecec74	\N	t	Reverse Linked List	reverse-linked-list-e1175b	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 08:12:37.309489	2026-10-04 08:12:37.309492
prob-t-6df882	\N	t	Fix Memory Leak	fix-memory-leak-dadbc9	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 08:12:37.309497	2026-10-04 08:12:37.309499
prob-388107c0	org-alpha-8349e2	f	Reverse String Function (Optimized)	reverse-string-function-4e91	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-2069dc99	2026-10-04 08:13:11.050766	2026-10-04 08:13:11.189085
prob-c6686b57	org-1ac7ae	f	Sum Problem	sum-prob-987ec7	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 08:13:16.049649	2026-10-04 08:13:16.049653
prob-ca36cf28	org-1ac7ae	f	Multiply Problem	mult-prob-545663	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 08:13:16.05731	2026-10-04 08:13:16.057312
prob-89072de3	org-alpha-f8201c	f	Custom Tenant Problem f8201c	custom-tenant-problem-f8201c-c845	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-f8201c	2026-10-04 08:13:23.693794	2026-10-04 08:13:23.693804
prob-98c11bf2	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-4233	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 08:15:25.601542	2026-10-04 08:15:25.700311
prob-c2ebc14f	org-alpha-d8dd5b	f	Custom In-House Token Bucket Rate Limiter	token-bucket-3f89	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 08:15:25.601548	2026-10-04 08:15:25.601549
prob-h-b9868a	\N	t	Reverse Linked List	reverse-linked-list-d65b50	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 08:15:27.78122	2026-10-04 08:15:27.781223
prob-t-27cdec	\N	t	Fix Memory Leak	fix-memory-leak-9e3ebd	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 08:15:27.781228	2026-10-04 08:15:27.781229
prob-b9dfa6aa	org-alpha-99b7fb	f	Reverse String Function (Optimized)	reverse-string-function-b56b	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-27b22659	2026-10-04 08:16:00.158253	2026-10-04 08:16:00.280359
prob-dcdeaa04	org-dc3c65	f	Sum Problem	sum-prob-889641	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 08:16:05.526629	2026-10-04 08:16:05.526633
prob-a53035e9	org-dc3c65	f	Multiply Problem	mult-prob-616fba	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 08:16:05.537652	2026-10-04 08:16:05.537657
prob-3c5bd6dd	org-alpha-72d630	f	Custom Tenant Problem 72d630	custom-tenant-problem-72d630-d4a3	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-72d630	2026-10-04 08:16:13.416978	2026-10-04 08:16:13.416981
prob-4193c980	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-7367	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-04 08:22:42.813976	2026-10-04 08:22:42.965374
prob-e72812aa	org-alpha-74ad45	f	Custom In-House Token Bucket Rate Limiter	token-bucket-052a	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-04 08:22:42.813985	2026-10-04 08:22:42.813987
prob-h-5a655b	\N	t	Reverse Linked List	reverse-linked-list-b71943	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 08:22:45.232293	2026-10-04 08:22:45.232297
prob-t-b74853	\N	t	Fix Memory Leak	fix-memory-leak-4e9f2f	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-04 08:22:45.232302	2026-10-04 08:22:45.232304
prob-19a521b1	org-alpha-6e6a67	f	Reverse String Function (Optimized)	reverse-string-function-e0c7	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-df8cf466	2026-10-04 08:23:20.686681	2026-10-04 08:23:20.918885
prob-3a4faade	org-850c4e	f	Sum Problem	sum-prob-e2c0ff	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 08:23:32.182981	2026-10-04 08:23:32.182997
prob-e4e940d8	org-850c4e	f	Multiply Problem	mult-prob-cfeaa2	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-04 08:23:32.21988	2026-10-04 08:23:32.219891
prob-30d1abdb	org-alpha-c383bb	f	Custom Tenant Problem c383bb	custom-tenant-problem-c383bb-b8d9	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-c383bb	2026-10-04 08:23:49.154411	2026-10-04 08:23:49.154426
prob-1ae9521e	org-alpha-f32301	f	Custom Tenant Problem f32301	custom-tenant-problem-f32301-960c	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-f32301	2026-10-04 15:13:04.213407	2026-10-04 15:13:04.213415
prob-2470f6cc	org-alpha-9ad743	f	Custom Tenant Problem 9ad743	custom-tenant-problem-9ad743-b646	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-9ad743	2026-10-05 03:24:59.71752	2026-10-05 03:24:59.717529
prob-80272c95	org-bld-b6c7db09	f	Array Maximum Subarray	max-sub-05e2a6	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 14:07:50.602317	2026-10-06 14:07:50.602321
prob-6fec7666	org-bld-13a6f09e	f	Array Maximum Subarray	max-sub-0fbaf4	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 14:08:49.157103	2026-10-06 14:08:49.15711
prob-cb4237ab	org-bld-836fe916	f	Array Maximum Subarray	max-sub-748ad8	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 14:09:46.736365	2026-10-06 14:09:46.736367
prob-aaa6e7d8	org-bld-c1c76e87	f	Array Maximum Subarray	max-sub-91ef8e	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 14:10:12.742719	2026-10-06 14:10:12.742722
prob-241e6856	org-bld-d6cba057	f	Array Maximum Subarray	max-sub-e8bdb4	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 15:41:01.869619	2026-10-06 15:41:01.869622
prob-c22a7e23	org-bld-216eb2c0	f	Array Maximum Subarray	max-sub-082148	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 15:42:04.972099	2026-10-06 15:42:04.972102
prob-602d07cc	org-bld-db73aa25	f	Array Maximum Subarray	max-sub-ba2c9b	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 15:45:28.343053	2026-10-06 15:45:28.343055
prob-1cd64002	org-bld-bb3d5555	f	Array Maximum Subarray	max-sub-804541	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 15:53:33.89263	2026-10-06 15:53:33.892634
prob-43de42ab	org-bld-80f25fe3	f	Array Maximum Subarray	max-sub-0833e3	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 16:08:11.391457	2026-10-06 16:08:11.391471
prob-514d12d4	org-bld-309d750e	f	Array Maximum Subarray	max-sub-f518f4	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 16:26:30.232828	2026-10-06 16:26:30.232839
prob-022fb13c	org-bld-01c813e7	f	Array Maximum Subarray	max-sub-86a222	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-06 16:51:45.069661	2026-10-06 16:51:45.06967
prob-6d52a924	org-bld-bbc879d8	f	Array Maximum Subarray	max-sub-59d416	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 03:44:50.920887	2026-10-07 03:44:50.920896
prob-43a8cc0c	org-bld-299018f0	f	Array Maximum Subarray	max-sub-56d60e	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 03:50:07.95471	2026-10-07 03:50:07.954713
prob-6bd8fe28	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-2208	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-07 04:17:44.148661	2026-10-07 04:17:44.193012
prob-23a76d94	org-alpha-ff1c85	f	Custom In-House Token Bucket Rate Limiter	token-bucket-aeb6	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-07 04:17:44.148665	2026-10-07 04:17:44.148666
prob-h-8a1c8c	\N	t	Reverse Linked List	reverse-linked-list-b6607d	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 04:17:45.991108	2026-10-07 04:17:45.991111
prob-t-319aa2	\N	t	Fix Memory Leak	fix-memory-leak-361679	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 04:17:45.991113	2026-10-07 04:17:45.991114
prob-655978f3	org-alpha-76cbc4	f	Reverse String Function (Optimized)	reverse-string-function-07f6	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-dfe7d8aa	2026-10-07 04:17:53.827141	2026-10-07 04:17:53.985666
prob-971d3f13	org-773852	f	Sum Problem	sum-prob-e19461	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 04:17:59.307112	2026-10-07 04:17:59.30718
prob-11996613	org-773852	f	Multiply Problem	mult-prob-bb7b03	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 04:17:59.312841	2026-10-07 04:17:59.312842
prob-6990b0d3	org-alpha-6d9f61	f	Custom Tenant Problem 6d9f61	custom-tenant-problem-6d9f61-6e4e	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-6d9f61	2026-10-07 04:18:06.190094	2026-10-07 04:18:06.190106
prob-73dc970c	org-bld-6ab4dd51	f	Array Maximum Subarray	max-sub-292c06	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 04:19:26.201513	2026-10-07 04:19:26.201515
prob-h-2bd6eb	\N	t	Reverse Linked List	reverse-linked-list-b47579	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:01:06.28071	2026-10-07 05:01:06.280713
prob-t-ac7f44	\N	t	Fix Memory Leak	fix-memory-leak-9b980b	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:01:06.280717	2026-10-07 05:01:06.280718
prob-789a60db	org-a00b11	f	Sum Problem	sum-prob-68ecec	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:01:14.255626	2026-10-07 05:01:14.25563
prob-fafbb6e4	org-a00b11	f	Multiply Problem	mult-prob-c51e8f	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:01:14.328886	2026-10-07 05:01:14.328889
prob-h-822de9	\N	t	Reverse Linked List	reverse-linked-list-37ad8f	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:04:43.842006	2026-10-07 05:04:43.842009
prob-t-1bbea3	\N	t	Fix Memory Leak	fix-memory-leak-86318d	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:04:43.842012	2026-10-07 05:04:43.842013
prob-h-a28bbf	\N	t	Reverse Linked List	reverse-linked-list-dac45f	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:08:15.636002	2026-10-07 05:08:15.636005
prob-t-671028	\N	t	Fix Memory Leak	fix-memory-leak-1048c6	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:08:15.636008	2026-10-07 05:08:15.636009
prob-d8bfacfe	org-cb96b1	f	Sum Problem	sum-prob-b97f5e	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:10:21.467978	2026-10-07 05:10:21.46798
prob-f00fa4ae	org-cb96b1	f	Multiply Problem	mult-prob-64039f	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:10:21.472807	2026-10-07 05:10:21.472809
prob-0eeaad3d	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-b4a7	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-07 05:16:41.746878	2026-10-07 05:16:41.804406
prob-98ab70fc	org-alpha-8ac318	f	Custom In-House Token Bucket Rate Limiter	token-bucket-df53	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-07 05:16:41.746885	2026-10-07 05:16:41.746886
prob-h-685367	\N	t	Reverse Linked List	reverse-linked-list-2880f2	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:16:44.331479	2026-10-07 05:16:44.331482
prob-t-67fdd6	\N	t	Fix Memory Leak	fix-memory-leak-fe4694	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-07 05:16:44.331485	2026-10-07 05:16:44.331486
prob-ef709f17	org-alpha-1f9a75	f	Reverse String Function (Optimized)	reverse-string-function-304d	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-07949a5e	2026-10-07 05:16:50.745919	2026-10-07 05:16:50.809738
prob-75bfd2e7	org-c0793f	f	Sum Problem	sum-prob-25bdaf	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:16:55.78055	2026-10-07 05:16:55.780553
prob-ea9cdf0b	org-c0793f	f	Multiply Problem	mult-prob-1a9411	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:16:55.828178	2026-10-07 05:16:55.828181
prob-4a85a14e	org-alpha-9880d3	f	Custom Tenant Problem 9880d3	custom-tenant-problem-9880d3-9523	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-9880d3	2026-10-07 05:17:02.646857	2026-10-07 05:17:02.646862
prob-e63cc727	org-bld-f9c0766c	f	Array Maximum Subarray	max-sub-0661d5	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-07 05:18:29.420458	2026-10-07 05:18:29.42046
prob-86eeca7f	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-4cd6	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-08 03:21:16.039561	2026-10-08 03:21:16.122634
prob-e188a2f8	org-alpha-79ad53	f	Custom In-House Token Bucket Rate Limiter	token-bucket-cf1d	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-08 03:21:16.039565	2026-10-08 03:21:16.039566
prob-h-4f90a2	\N	t	Reverse Linked List	reverse-linked-list-1fc12a	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 03:21:18.227816	2026-10-08 03:21:18.22782
prob-t-ae8757	\N	t	Fix Memory Leak	fix-memory-leak-2fc24e	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 03:21:18.227822	2026-10-08 03:21:18.227823
prob-310cba66	org-alpha-decd65	f	Reverse String Function (Optimized)	reverse-string-function-a48d	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-ece9225b	2026-10-08 03:21:26.216627	2026-10-08 03:21:26.297421
prob-c7feddd6	org-8c94cc	f	Sum Problem	sum-prob-8a699b	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 03:21:32.256001	2026-10-08 03:21:32.256009
prob-26152780	org-8c94cc	f	Multiply Problem	mult-prob-ed6158	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 03:21:32.269362	2026-10-08 03:21:32.269366
prob-043390e4	org-alpha-8c8a93	f	Custom Tenant Problem 8c8a93	custom-tenant-problem-8c8a93-03b4	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-8c8a93	2026-10-08 03:21:39.910131	2026-10-08 03:21:39.910141
prob-b5bec3ae	org-bld-221b5760	f	Array Maximum Subarray	max-sub-5602e1	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 03:23:25.116247	2026-10-08 03:23:25.11625
prob-a29bcb	\N	f	LRU Cache Implementation	lru-cache-929c	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:05:30.187178	2026-10-08 04:05:30.18718
prob-1c750a	\N	f	LRU Cache Implementation	lru-cache-f1bc	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:05:47.90731	2026-10-08 04:05:47.907311
prob-10ce0b	\N	f	LRU Cache Implementation	lru-cache-5b45	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:06:39.070451	2026-10-08 04:06:39.070453
prob-527d79	\N	f	LRU Cache Implementation	lru-cache-cfe7	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:06:51.860548	2026-10-08 04:06:51.86055
prob-6ea388	\N	f	LRU Cache Implementation	lru-cache-071b	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:07:05.9459	2026-10-08 04:07:05.945903
prob-1f5270	\N	f	LRU Cache Implementation	lru-cache-0d41	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:07:35.233023	2026-10-08 04:07:35.233025
prob-0971fa	\N	f	LRU Cache Implementation	lru-cache-4ebc	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:07:49.078659	2026-10-08 04:07:49.078661
prob-go-05126b	\N	f	Concurrent Worker Pool in Go	worker-pool-6c11	Implement worker pool using channels and goroutines	Hard	\N	\N	\N	function	solve	{}	5	128	["go"]	{}	\N	1	t	\N	2026-10-08 04:07:49.401563	2026-10-08 04:07:49.401565
prob-3f0f22	\N	f	LRU Cache Implementation	lru-cache-eced	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:24:55.814988	2026-10-08 04:24:55.814991
prob-go-c4bb76	\N	f	Concurrent Worker Pool in Go	worker-pool-72c9	Implement worker pool using channels and goroutines	Hard	\N	\N	\N	function	solve	{}	5	128	["go"]	{}	\N	1	t	\N	2026-10-08 04:24:56.361676	2026-10-08 04:24:56.36168
prob-25b8ae	\N	f	LRU Cache Implementation	lru-cache-5749	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:25:17.708554	2026-10-08 04:25:17.708557
prob-go-1df0ad	\N	f	Concurrent Worker Pool in Go	worker-pool-f72d	Implement worker pool using channels and goroutines	Hard	\N	\N	\N	function	solve	{}	5	128	["go"]	{}	\N	1	t	\N	2026-10-08 04:25:18.502826	2026-10-08 04:25:18.502829
prob-488ebb	\N	f	LRU Cache Implementation	lru-cache-41e8	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:26:11.048184	2026-10-08 04:26:11.048187
prob-go-431aeb	\N	f	Concurrent Worker Pool in Go	worker-pool-745b	Implement worker pool using channels and goroutines	Hard	\N	\N	\N	function	solve	{}	5	128	["go"]	{}	\N	1	t	\N	2026-10-08 04:26:11.851368	2026-10-08 04:26:11.851379
prob-15741b01	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-8d5c	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-08 04:27:52.647044	2026-10-08 04:27:52.852294
prob-b1479441	org-alpha-972b72	f	Custom In-House Token Bucket Rate Limiter	token-bucket-bb5b	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-08 04:27:52.647056	2026-10-08 04:27:52.647058
prob-h-180991	\N	t	Reverse Linked List	reverse-linked-list-256ec8	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 04:27:55.687159	2026-10-08 04:27:55.687162
prob-t-48b78b	\N	t	Fix Memory Leak	fix-memory-leak-b82385	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 04:27:55.687164	2026-10-08 04:27:55.687165
prob-ecece3d4	org-alpha-160f82	f	Reverse String Function (Optimized)	reverse-string-function-63d8	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-fa4f947a	2026-10-08 04:28:39.677045	2026-10-08 04:28:39.793706
prob-65f4c8c7	org-ed23c6	f	Sum Problem	sum-prob-6dc399	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 04:28:47.970245	2026-10-08 04:28:47.970251
prob-4ee07061	org-ed23c6	f	Multiply Problem	mult-prob-db9b00	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 04:28:47.980267	2026-10-08 04:28:47.980271
prob-3aa709e6	org-alpha-d45b72	f	Custom Tenant Problem d45b72	custom-tenant-problem-d45b72-8d2a	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-d45b72	2026-10-08 04:28:58.136017	2026-10-08 04:28:58.136021
prob-d45b69d3	org-bld-465cc1fd	f	Array Maximum Subarray	max-sub-0a5b27	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 04:31:21.820789	2026-10-08 04:31:21.820791
prob-e16fbd	\N	f	LRU Cache Implementation	lru-cache-1e72	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 04:31:48.621816	2026-10-08 04:31:48.621819
prob-go-61ab79	\N	f	Concurrent Worker Pool in Go	worker-pool-7b3f	Implement worker pool using channels and goroutines	Hard	\N	\N	\N	function	solve	{}	5	128	["go"]	{}	\N	1	t	\N	2026-10-08 04:31:49.131413	2026-10-08 04:31:49.131414
prob-py-7d9ff4	\N	f	Async Event Loop Queue	async-queue-7d9ff4	Implement an asynchronous queue	Medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:24:31.63308	2026-10-08 08:24:31.633082
prob-py-c5df1f	\N	f	Async Event Loop Queue	async-queue-c5df1f	Implement an asynchronous queue	Medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:28:07.4953	2026-10-08 08:28:07.495308
prob-py-cf71a9	\N	f	Async Event Loop Queue	async-queue-cf71a9	Implement an asynchronous queue	Medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:28:47.270067	2026-10-08 08:28:47.270078
prob-py-16ebf2	\N	f	Async Event Loop Queue	async-queue-16ebf2	Implement an asynchronous queue	Medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:29:25.209397	2026-10-08 08:29:25.2094
prob-py-abbb35	\N	f	Async Event Loop Queue	async-queue-abbb35	Implement an asynchronous queue	Medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:29:48.317686	2026-10-08 08:29:48.317698
prob-673e17c7	\N	t	LRU Cache with Thread-Safe Concurrency	lru-cache-f086	Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.	Medium	Updated constraints: 1 <= capacity <= 50000	\N	\N	function	LRUCache	{}	2	128	["python", "javascript", "java", "cpp", "go"]	{"python": "class LRUCache:\\n    def __init__(self, capacity: int):\\n        pass\\n", "javascript": "class LRUCache {\\n  constructor(capacity) {}\\n}\\n"}	\N	2	t	\N	2026-10-08 08:31:22.391927	2026-10-08 08:31:22.457001
prob-6ce8bc20	org-alpha-04b108	f	Custom In-House Token Bucket Rate Limiter	token-bucket-ddba	Implement the proprietary burst token rate limiter according to Org Alpha specifications.	Hard	Timestamps are monotonically increasing millisecond integers.	\N	\N	function	allow_request	{}	3	64	["python", "go"]	{"python": "def allow_request(tokens, timestamp):\\n    pass\\n"}	\N	1	t	lead_architect@alpha.corp	2026-10-08 08:31:22.391932	2026-10-08 08:31:22.391933
prob-h-9d06ba	\N	t	Reverse Linked List	reverse-linked-list-5be77e	Reverse a given singly-linked list.	easy	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:31:24.350062	2026-10-08 08:31:24.350065
prob-t-762e8f	\N	t	Fix Memory Leak	fix-memory-leak-4ec7bf	Fix memory leak in buffer.	medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:31:24.350067	2026-10-08 08:31:24.350068
prob-2ea39745	org-alpha-54cbfd	f	Reverse String Function (Optimized)	reverse-string-function-657a	Write a function reverseString(s) that returns the reversed string.	Easy	\N	\N	\N	function	reverseString	{"parameters": [{"name": "s", "type": "str"}], "return_type": "str"}	5	128	["python", "javascript", "typescript"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n"}	\N	2	t	user-08dd1acd	2026-10-08 08:32:08.533733	2026-10-08 08:32:08.646261
prob-949a1c9b	org-6db990	f	Sum Problem	sum-prob-db6667	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 08:32:15.586474	2026-10-08 08:32:15.586477
prob-37d7c3c9	org-6db990	f	Multiply Problem	mult-prob-e0dd4a	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 08:32:15.598154	2026-10-08 08:32:15.598156
prob-ee2ca853	org-alpha-336167	f	Custom Tenant Problem 336167	custom-tenant-problem-336167-f9a6	Implement tenant isolated solver.	Easy	\N	\N	\N	function	solve	{"name": "solve", "args": [{"name": "n", "type": "int"}], "return_type": "int"}	5	128	["python", "javascript", "typescript", "java", "cpp"]	{"python": "def solve(data):\\n    # Write your solution here\\n    pass\\n", "javascript": "function solve(data) {\\n  // Write your solution here\\n  return data;\\n}\\nmodule.exports = { solve };\\n", "typescript": "export function solve(data: any): any {\\n  // Write your solution here\\n  return data;\\n}\\n", "java": "public class Solution {\\n    public static int solve(int a, int b) {\\n        // Write your solution here\\n        return 0;\\n    }\\n}\\n", "cpp": "#include <iostream>\\n\\nint solve(int a, int b) {\\n    // Write your solution here\\n    return 0;\\n}\\n"}	\N	1	t	usr-rec-a-336167	2026-10-08 08:32:23.818778	2026-10-08 08:32:23.818783
prob-7b7f0dd7	org-bld-4087d76a	f	Array Maximum Subarray	max-sub-855979	Given an array of integers, return the maximum contiguous sum.	Medium	\N	\N	\N	function	solve	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 08:35:12.223907	2026-10-08 08:35:12.223919
prob-2014b2	\N	f	LRU Cache Implementation	lru-cache-7f40	Implement LRU Cache with get and put methods	Medium	\N	\N	\N	function	solve	{}	5	128	["python"]	{}	\N	1	t	\N	2026-10-08 08:35:57.717498	2026-10-08 08:35:57.717501
prob-go-b01d6f	\N	f	Concurrent Worker Pool in Go	worker-pool-8d87	Implement worker pool using channels and goroutines	Hard	\N	\N	\N	function	solve	{}	5	128	["go"]	{}	\N	1	t	\N	2026-10-08 08:35:58.159212	2026-10-08 08:35:58.159214
prob-py-98cf61	\N	f	Async Event Loop Queue	async-queue-98cf61	Implement an asynchronous queue	Medium	\N	\N	\N	function	solve	{}	5	128	[]	{}	\N	1	t	\N	2026-10-08 08:36:01.786965	2026-10-08 08:36:01.786967
prob-54909183	org-7742f2	f	Sum Problem	sum-prob-98bb65	Return the sum of a and b	Medium	\N	\N	\N	function	solveMeFirst	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 08:59:47.136041	2026-10-08 08:59:47.136047
prob-12b46bc8	org-7742f2	f	Multiply Problem	mult-prob-fcec2a	Return the product of a and b	Medium	\N	\N	\N	function	multiplyTwo	{}	5	128	["python", "javascript"]	{}	\N	1	t	\N	2026-10-08 08:59:47.186775	2026-10-08 08:59:47.186785
\.


--
-- Data for Name: coding_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_submissions (id, candidate_id, assessment_id, coding_problem_id, coding_problem_version_id, language, source_code, status, passed_test_cases, total_test_cases, score, execution_time_ms, memory_mb, compiler_output, runtime_error, is_best_submission, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: coding_test_cases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coding_test_cases (id, problem_id, problem_version_id, input_data, expected_output, is_hidden, weight, display_order, explanation, created_at, updated_at) FROM stdin;
tc-1d90f8bb	prob-d76120d9	cpv-d12ab5a7	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 16:33:00.963845	2026-09-30 16:33:00.963852
tc-2c45fa76	prob-d76120d9	cpv-d12ab5a7	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 16:33:00.963854	2026-09-30 16:33:00.963856
tc-s-7559e3	prob-h-f39799	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 16:47:42.934773	2026-09-30 16:47:42.934776
tc-h-aabd83	prob-h-f39799	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 16:47:42.934778	2026-09-30 16:47:42.934779
tc-ts-31f388	prob-t-4fdeb6	\N	err	fixed	f	1	0	\N	2026-09-30 16:47:42.93478	2026-09-30 16:47:42.934781
tc-s-9e1c75	prob-h-477711	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 16:48:10.735463	2026-09-30 16:48:10.735465
tc-h-55bec5	prob-h-477711	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 16:48:10.735467	2026-09-30 16:48:10.735469
tc-ts-b8ff35	prob-t-fa0359	\N	err	fixed	f	1	0	\N	2026-09-30 16:48:10.73547	2026-09-30 16:48:10.735471
tc-e1162336	prob-cce465e5	cpv-23304087	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 16:48:20.683145	2026-09-30 16:48:20.68315
tc-7768e17f	prob-cce465e5	cpv-23304087	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 16:48:20.683153	2026-09-30 16:48:20.683156
tc-s-4cb32a	prob-h-5021ee	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 16:55:19.11418	2026-09-30 16:55:19.114182
tc-h-42eb83	prob-h-5021ee	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 16:55:19.114184	2026-09-30 16:55:19.114185
tc-ts-c654a0	prob-t-188f23	\N	err	fixed	f	1	0	\N	2026-09-30 16:55:19.114187	2026-09-30 16:55:19.114188
tc-7461366e	prob-97a99bea	cpv-3c10367a	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 16:55:30.351308	2026-09-30 16:55:30.351311
tc-c0e72f3d	prob-97a99bea	cpv-3c10367a	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 16:55:30.351312	2026-09-30 16:55:30.351313
tc-s-e7959c	prob-h-024aa2	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 17:01:12.347891	2026-09-30 17:01:12.347893
tc-h-5fd3b0	prob-h-024aa2	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 17:01:12.347896	2026-09-30 17:01:12.347897
tc-ts-76e691	prob-t-7b4f9a	\N	err	fixed	f	1	0	\N	2026-09-30 17:01:12.347898	2026-09-30 17:01:12.347899
tc-s-6f36ee	prob-h-376188	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 17:18:41.743865	2026-09-30 17:18:41.743869
tc-h-8fd8cf	prob-h-376188	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 17:18:41.743871	2026-09-30 17:18:41.743873
tc-ts-ba9b51	prob-t-21b5c8	\N	err	fixed	f	1	0	\N	2026-09-30 17:18:41.743874	2026-09-30 17:18:41.743876
tc-s-31321d	prob-h-a1c727	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 17:28:59.669347	2026-09-30 17:28:59.669353
tc-h-c02387	prob-h-a1c727	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 17:28:59.669357	2026-09-30 17:28:59.669359
tc-ts-3962e7	prob-t-b427a1	\N	err	fixed	f	1	0	\N	2026-09-30 17:28:59.669363	2026-09-30 17:28:59.669365
tc-b237493f	prob-20e517fe	cpv-26480d15	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 17:29:13.683976	2026-09-30 17:29:13.683981
tc-4095842b	prob-20e517fe	cpv-26480d15	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 17:29:13.683983	2026-09-30 17:29:13.683985
tc-s-c96e9a	prob-h-2d4d18	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 17:39:32.245879	2026-09-30 17:39:32.245882
tc-h-9a9ba8	prob-h-2d4d18	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 17:39:32.245884	2026-09-30 17:39:32.245885
tc-ts-b8e550	prob-t-9b2f77	\N	err	fixed	f	1	0	\N	2026-09-30 17:39:32.245886	2026-09-30 17:39:32.245887
tc-c1529272	prob-dfaa9cf5	cpv-b13b4e5b	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 17:39:42.05681	2026-09-30 17:39:42.056814
tc-60cbfeac	prob-dfaa9cf5	cpv-b13b4e5b	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 17:39:42.056815	2026-09-30 17:39:42.056816
tc-s-bbcdad	prob-h-9742f4	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 17:47:58.583067	2026-09-30 17:47:58.58307
tc-h-89c4cf	prob-h-9742f4	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 17:47:58.583071	2026-09-30 17:47:58.583072
tc-ts-570611	prob-t-ca23c3	\N	err	fixed	f	1	0	\N	2026-09-30 17:47:58.583073	2026-09-30 17:47:58.583074
tc-afecd3e8	prob-596bf1d6	cpv-014be28d	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 17:48:11.753346	2026-09-30 17:48:11.753349
tc-89f3cbf4	prob-596bf1d6	cpv-014be28d	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 17:48:11.75335	2026-09-30 17:48:11.753351
tc-s-c5cdb6	prob-h-61043d	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 18:09:00.82753	2026-09-30 18:09:00.827534
tc-h-481b2f	prob-h-61043d	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 18:09:00.827537	2026-09-30 18:09:00.827538
tc-ts-5df3bb	prob-t-bcdc6c	\N	err	fixed	f	1	0	\N	2026-09-30 18:09:00.82754	2026-09-30 18:09:00.827542
tc-67393ce4	prob-a1af1685	cpv-36afb933	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 18:09:09.831399	2026-09-30 18:09:09.831403
tc-f160e7dc	prob-a1af1685	cpv-36afb933	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 18:09:09.831405	2026-09-30 18:09:09.831406
tc-s-aafc3b	prob-h-f3f378	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 18:20:24.172365	2026-09-30 18:20:24.172367
tc-h-be3ba8	prob-h-f3f378	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 18:20:24.172368	2026-09-30 18:20:24.172369
tc-ts-cc3f6b	prob-t-e41d87	\N	err	fixed	f	1	0	\N	2026-09-30 18:20:24.17237	2026-09-30 18:20:24.172371
tc-44763519	prob-41af94e1	cpv-5f08d900	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 18:20:43.565937	2026-09-30 18:20:43.565952
tc-40e6034a	prob-41af94e1	cpv-5f08d900	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 18:20:43.56596	2026-09-30 18:20:43.565965
tc-s-3f67fd	prob-h-318b5c	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 18:30:11.531974	2026-09-30 18:30:11.531987
tc-h-b485ac	prob-h-318b5c	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 18:30:11.531994	2026-09-30 18:30:11.531999
tc-ts-0ec4c2	prob-t-a9a832	\N	err	fixed	f	1	0	\N	2026-09-30 18:30:11.532005	2026-09-30 18:30:11.532009
tc-s-6c1fbf	prob-h-697327	\N	[1,2]	[2,1]	f	1	0	\N	2026-09-30 18:37:07.85928	2026-09-30 18:37:07.859284
tc-h-800ce7	prob-h-697327	\N	[3,4]	[4,3]	t	1	0	\N	2026-09-30 18:37:07.859287	2026-09-30 18:37:07.859289
tc-ts-3b5244	prob-t-855460	\N	err	fixed	f	1	0	\N	2026-09-30 18:37:07.859292	2026-09-30 18:37:07.859294
tc-7b5db3a2	prob-94fb0155	cpv-f5ae4392	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-09-30 18:37:24.286652	2026-09-30 18:37:24.286655
tc-1fef0a48	prob-94fb0155	cpv-f5ae4392	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-09-30 18:37:24.286657	2026-09-30 18:37:24.286658
tc-s-ec89fc	prob-h-f56550	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-01 03:25:45.570873	2026-10-01 03:25:45.570881
tc-h-fe6869	prob-h-f56550	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-01 03:25:45.570883	2026-10-01 03:25:45.570884
tc-ts-5b8b89	prob-t-e8d541	\N	err	fixed	f	1	0	\N	2026-10-01 03:25:45.570885	2026-10-01 03:25:45.570885
tc-0f15e8b9	prob-f0c880f7	cpv-8ec34730	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-01 03:26:00.844383	2026-10-01 03:26:00.844386
tc-c561d51f	prob-f0c880f7	cpv-8ec34730	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-01 03:26:00.844387	2026-10-01 03:26:00.844388
tc-s-c4362e	prob-h-4ad257	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-01 03:32:55.214982	2026-10-01 03:32:55.214983
tc-h-23ff15	prob-h-4ad257	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-01 03:32:55.214985	2026-10-01 03:32:55.214986
tc-ts-d0311f	prob-t-ab50b8	\N	err	fixed	f	1	0	\N	2026-10-01 03:32:55.214987	2026-10-01 03:32:55.214987
tc-be714f30	prob-257d0d23	cpv-d353d702	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-01 03:33:04.736103	2026-10-01 03:33:04.736105
tc-773a5e91	prob-257d0d23	cpv-d353d702	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-01 03:33:04.736106	2026-10-01 03:33:04.736107
tc-3d41e759	prob-adce1497	cpv-5dca1956	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-01 03:38:43.565468	2026-10-01 03:38:43.565471
tc-fa8dad63	prob-adce1497	cpv-5dca1956	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-01 03:38:43.565472	2026-10-01 03:38:43.565473
tc-s-fc1633	prob-h-3bde4a	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-01 03:38:49.997533	2026-10-01 03:38:49.997536
tc-h-307c26	prob-h-3bde4a	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-01 03:38:49.997537	2026-10-01 03:38:49.997538
tc-ts-9d130a	prob-t-f50ec4	\N	err	fixed	f	1	0	\N	2026-10-01 03:38:49.997539	2026-10-01 03:38:49.99754
tc-f4e4c66f	prob-b7bf785d	cpv-a6075683	'hello'	'olleh'	f	25	1	\N	2026-10-01 03:46:43.536116	2026-10-01 03:46:43.536119
tc-26dca013	prob-b7bf785d	cpv-a6075683	'world'	'dlrow'	f	25	2	\N	2026-10-01 03:46:43.53612	2026-10-01 03:46:43.536121
tc-373c3318	prob-b7bf785d	cpv-a6075683	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-01 03:46:43.536121	2026-10-01 03:46:43.536122
tc-d7d69f4b	prob-b333f700	cpv-45ce320b	'hello'	'olleh'	f	25	1	\N	2026-10-01 03:48:42.853433	2026-10-01 03:48:42.853435
tc-847e5db9	prob-b333f700	cpv-45ce320b	'world'	'dlrow'	f	25	2	\N	2026-10-01 03:48:42.853437	2026-10-01 03:48:42.853438
tc-33a811bb	prob-b333f700	cpv-45ce320b	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-01 03:48:42.853439	2026-10-01 03:48:42.853439
tc-a71f7434	prob-798451b6	cpv-8e9f8210	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-01 03:54:24.390968	2026-10-01 03:54:24.390971
tc-1be3490b	prob-798451b6	cpv-8e9f8210	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-01 03:54:24.390972	2026-10-01 03:54:24.390973
tc-s-7de3d3	prob-h-6954bc	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-01 03:54:30.914072	2026-10-01 03:54:30.914074
tc-h-6aaf4f	prob-h-6954bc	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-01 03:54:30.914076	2026-10-01 03:54:30.914077
tc-ts-66b3cc	prob-t-23d65b	\N	err	fixed	f	1	0	\N	2026-10-01 03:54:30.914078	2026-10-01 03:54:30.914079
tc-ba385eac	prob-4522f1dd	cpv-71a97d09	'hello'	'olleh'	f	25	1	\N	2026-10-01 03:55:12.063601	2026-10-01 03:55:12.063604
tc-a7949bea	prob-4522f1dd	cpv-71a97d09	'world'	'dlrow'	f	25	2	\N	2026-10-01 03:55:12.063605	2026-10-01 03:55:12.063606
tc-82b29e6e	prob-4522f1dd	cpv-71a97d09	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-01 03:55:12.063607	2026-10-01 03:55:12.063608
tc-9ca7f10d	prob-c209bfae	cpv-2e25f091	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-01 04:50:57.708405	2026-10-01 04:50:57.708409
tc-b4544452	prob-c209bfae	cpv-2e25f091	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-01 04:50:57.70841	2026-10-01 04:50:57.708411
tc-s-11ad91	prob-h-8b557f	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-01 05:07:38.603968	2026-10-01 05:07:38.603974
tc-h-85189d	prob-h-8b557f	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-01 05:07:38.60398	2026-10-01 05:07:38.603983
tc-ts-f49635	prob-t-589d2e	\N	err	fixed	f	1	0	\N	2026-10-01 05:07:38.603987	2026-10-01 05:07:38.60399
tc-7d8738fb	prob-4f75cb7b	cpv-31ad24f7	'hello'	'olleh'	f	25	1	\N	2026-10-01 05:10:34.259756	2026-10-01 05:10:34.25976
tc-1ad370d1	prob-4f75cb7b	cpv-31ad24f7	'world'	'dlrow'	f	25	2	\N	2026-10-01 05:10:34.259762	2026-10-01 05:10:34.259764
tc-58e1eb3c	prob-4f75cb7b	cpv-31ad24f7	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-01 05:10:34.259766	2026-10-01 05:10:34.259767
tc-b96f6127	prob-69386c73	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-01 05:16:05.273153	2026-10-01 05:16:05.273159
tc-845afe66	prob-69386c73	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-01 05:16:05.273162	2026-10-01 05:16:05.273163
tc-cd089d65	prob-bdd819c1	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-01 05:16:05.28327	2026-10-01 05:16:05.283273
tc-0e6e620c	prob-bdd819c1	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-01 05:16:05.283274	2026-10-01 05:16:05.283275
tc-b8475429	prob-a55994ac	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-01 05:16:56.32815	2026-10-01 05:16:56.328152
tc-c1226df3	prob-a55994ac	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-01 05:16:56.328153	2026-10-01 05:16:56.328154
tc-8283f510	prob-73061b1f	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-01 05:16:56.334946	2026-10-01 05:16:56.334948
tc-ecf34a00	prob-73061b1f	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-01 05:16:56.334949	2026-10-01 05:16:56.33495
tc-e8c3dfb3	prob-9d605df5	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-01 05:17:17.76096	2026-10-01 05:17:17.760965
tc-1b7d85b0	prob-9d605df5	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-01 05:17:17.760968	2026-10-01 05:17:17.76097
tc-a6dcb2bb	prob-0b2113ae	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-01 05:17:17.768172	2026-10-01 05:17:17.768174
tc-3c25f64c	prob-0b2113ae	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-01 05:17:17.768176	2026-10-01 05:17:17.768176
tc-dcb78c31	prob-b4e081fc	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-01 05:17:38.382011	2026-10-01 05:17:38.382013
tc-a743c639	prob-b4e081fc	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-01 05:17:38.382014	2026-10-01 05:17:38.382015
tc-4816a0d5	prob-adbddc32	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-01 05:17:38.386888	2026-10-01 05:17:38.38689
tc-c25e686a	prob-adbddc32	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-01 05:17:38.386892	2026-10-01 05:17:38.386893
tc-b91fe2de	prob-494c81b2	cpv-c112c436	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-01 05:28:52.878754	2026-10-01 05:28:52.878757
tc-3d10eedf	prob-494c81b2	cpv-c112c436	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-01 05:28:52.878758	2026-10-01 05:28:52.87876
tc-s-aec7d1	prob-h-8ceb5b	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-01 05:28:54.45899	2026-10-01 05:28:54.458992
tc-h-3bf603	prob-h-8ceb5b	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-01 05:28:54.458993	2026-10-01 05:28:54.458994
tc-ts-b86bcf	prob-t-d38256	\N	err	fixed	f	1	0	\N	2026-10-01 05:28:54.458995	2026-10-01 05:28:54.458996
tc-b68bc889	prob-135ad7a5	cpv-05636ff6	'hello'	'olleh'	f	25	1	\N	2026-10-01 05:29:24.506967	2026-10-01 05:29:24.506969
tc-4d55713d	prob-135ad7a5	cpv-05636ff6	'world'	'dlrow'	f	25	2	\N	2026-10-01 05:29:24.50697	2026-10-01 05:29:24.506971
tc-16d1f1f4	prob-135ad7a5	cpv-05636ff6	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-01 05:29:24.506972	2026-10-01 05:29:24.506972
tc-864c831f	prob-dca6e531	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-01 05:29:28.572757	2026-10-01 05:29:28.572759
tc-11481819	prob-dca6e531	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-01 05:29:28.57276	2026-10-01 05:29:28.572761
tc-f6a7cd43	prob-b6ad9ef9	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-01 05:29:28.577797	2026-10-01 05:29:28.577799
tc-8f797420	prob-b6ad9ef9	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-01 05:29:28.5778	2026-10-01 05:29:28.577801
tc-6a6867c6	prob-bb662231	cpv-84766e54	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 06:29:19.789187	2026-10-04 06:29:19.789195
tc-7ec02c07	prob-bb662231	cpv-84766e54	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 06:29:19.789196	2026-10-04 06:29:19.789197
tc-s-f6624f	prob-h-0e8f2a	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 06:29:21.779675	2026-10-04 06:29:21.779677
tc-h-d34535	prob-h-0e8f2a	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 06:29:21.779678	2026-10-04 06:29:21.779679
tc-ts-6dddd2	prob-t-df5b97	\N	err	fixed	f	1	0	\N	2026-10-04 06:29:21.77968	2026-10-04 06:29:21.779681
tc-0ea0b697	prob-63d4c9cb	cpv-2ebf8546	'hello'	'olleh'	f	25	1	\N	2026-10-04 06:29:53.974957	2026-10-04 06:29:53.974959
tc-26331c32	prob-63d4c9cb	cpv-2ebf8546	'world'	'dlrow'	f	25	2	\N	2026-10-04 06:29:53.97496	2026-10-04 06:29:53.974961
tc-ceadfa88	prob-63d4c9cb	cpv-2ebf8546	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 06:29:53.974962	2026-10-04 06:29:53.974963
tc-3c328e2e	prob-e1007f9a	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 06:29:58.365564	2026-10-04 06:29:58.365567
tc-f27f00a5	prob-e1007f9a	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 06:29:58.365569	2026-10-04 06:29:58.36557
tc-1fa8523a	prob-969f89d2	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 06:29:58.375401	2026-10-04 06:29:58.375405
tc-4edaf99b	prob-969f89d2	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 06:29:58.375406	2026-10-04 06:29:58.375407
tc-55982e99	prob-62c38cdf	cpv-71d1579e	5	5	f	1	1	\N	2026-10-04 06:45:10.364378	2026-10-04 06:45:10.364381
tc-46555756	prob-a9baa6a8	cpv-26fe838c	5	5	f	1	1	\N	2026-10-04 06:45:31.348975	2026-10-04 06:45:31.348977
tc-1d0317ae	prob-8090ddc9	cpv-14e673e1	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 06:46:24.068004	2026-10-04 06:46:24.068007
tc-7532fe98	prob-8090ddc9	cpv-14e673e1	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 06:46:24.068008	2026-10-04 06:46:24.068009
tc-s-fa2b49	prob-h-d0d23a	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 06:46:25.495413	2026-10-04 06:46:25.495414
tc-h-e3fda6	prob-h-d0d23a	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 06:46:25.495416	2026-10-04 06:46:25.495417
tc-ts-5fb693	prob-t-2c2dcf	\N	err	fixed	f	1	0	\N	2026-10-04 06:46:25.495418	2026-10-04 06:46:25.495419
tc-19a8d666	prob-e3ab629f	cpv-79a9f5a4	'hello'	'olleh'	f	25	1	\N	2026-10-04 06:46:57.03726	2026-10-04 06:46:57.037263
tc-162f401b	prob-e3ab629f	cpv-79a9f5a4	'world'	'dlrow'	f	25	2	\N	2026-10-04 06:46:57.037264	2026-10-04 06:46:57.037265
tc-708d2414	prob-e3ab629f	cpv-79a9f5a4	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 06:46:57.037265	2026-10-04 06:46:57.037266
tc-7b70ed1f	prob-ff4b43c5	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 06:47:01.193065	2026-10-04 06:47:01.193067
tc-81655a02	prob-ff4b43c5	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 06:47:01.193068	2026-10-04 06:47:01.193069
tc-571697cd	prob-0cf1c145	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 06:47:01.198044	2026-10-04 06:47:01.198046
tc-0f89ccc4	prob-0cf1c145	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 06:47:01.198047	2026-10-04 06:47:01.198048
tc-6a8ec041	prob-d8ee37e1	cpv-a72a59df	5	5	f	1	1	\N	2026-10-04 06:47:06.83264	2026-10-04 06:47:06.832647
tc-e91a0501	prob-91aac793	cpv-45e998a7	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 07:09:49.985303	2026-10-04 07:09:49.985306
tc-5d3d7194	prob-91aac793	cpv-45e998a7	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 07:09:49.985307	2026-10-04 07:09:49.985308
tc-s-e4deb4	prob-h-59b705	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 07:09:51.4258	2026-10-04 07:09:51.425802
tc-h-984e8c	prob-h-59b705	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 07:09:51.425804	2026-10-04 07:09:51.425804
tc-ts-244420	prob-t-7fa8d0	\N	err	fixed	f	1	0	\N	2026-10-04 07:09:51.425805	2026-10-04 07:09:51.425806
tc-9ce77b4a	prob-38c4271f	cpv-c382a5c3	'hello'	'olleh'	f	25	1	\N	2026-10-04 07:10:29.262577	2026-10-04 07:10:29.26258
tc-50a9ef80	prob-38c4271f	cpv-c382a5c3	'world'	'dlrow'	f	25	2	\N	2026-10-04 07:10:29.262582	2026-10-04 07:10:29.262584
tc-caa2485a	prob-38c4271f	cpv-c382a5c3	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 07:10:29.262585	2026-10-04 07:10:29.262586
tc-ecfd4c4d	prob-8964a623	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 07:10:33.400326	2026-10-04 07:10:33.400328
tc-6cf4d1e6	prob-8964a623	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 07:10:33.400329	2026-10-04 07:10:33.40033
tc-ff4ac413	prob-9f1555bf	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 07:10:33.405422	2026-10-04 07:10:33.405425
tc-c0bb1dfe	prob-9f1555bf	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 07:10:33.405427	2026-10-04 07:10:33.405428
tc-2abc8bda	prob-afebc829	cpv-1e519b27	5	5	f	1	1	\N	2026-10-04 07:10:38.876025	2026-10-04 07:10:38.876027
tc-015cc3cf	prob-2f1add36	cpv-bed20b69	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 07:43:15.340784	2026-10-04 07:43:15.340787
tc-0a326485	prob-2f1add36	cpv-bed20b69	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 07:43:15.340789	2026-10-04 07:43:15.340791
tc-s-d7dbcb	prob-h-3b0851	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 07:43:17.822649	2026-10-04 07:43:17.822654
tc-h-4cc6bc	prob-h-3b0851	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 07:43:17.822656	2026-10-04 07:43:17.822658
tc-ts-4e9edc	prob-t-878487	\N	err	fixed	f	1	0	\N	2026-10-04 07:43:17.822659	2026-10-04 07:43:17.822661
tc-7ecfd47f	prob-91d54784	cpv-c44449a4	'hello'	'olleh'	f	25	1	\N	2026-10-04 07:43:51.300412	2026-10-04 07:43:51.300416
tc-ca823379	prob-91d54784	cpv-c44449a4	'world'	'dlrow'	f	25	2	\N	2026-10-04 07:43:51.300417	2026-10-04 07:43:51.300418
tc-6b254f36	prob-91d54784	cpv-c44449a4	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 07:43:51.300419	2026-10-04 07:43:51.30042
tc-9a07f672	prob-38d3c4ca	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 07:43:56.372178	2026-10-04 07:43:56.37218
tc-0cc70f41	prob-38d3c4ca	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 07:43:56.372181	2026-10-04 07:43:56.372182
tc-28b2c511	prob-b6780273	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 07:43:56.378988	2026-10-04 07:43:56.378991
tc-8233890e	prob-b6780273	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 07:43:56.378992	2026-10-04 07:43:56.378993
tc-85bc46fb	prob-d9c5c5da	cpv-a234cb45	5	5	f	1	1	\N	2026-10-04 07:44:02.819043	2026-10-04 07:44:02.819046
tc-7c8eac7b	prob-ee5adf4d	cpv-01db32a7	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 08:12:35.177937	2026-10-04 08:12:35.177941
tc-52ab9bb8	prob-ee5adf4d	cpv-01db32a7	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 08:12:35.177942	2026-10-04 08:12:35.177943
tc-s-122134	prob-h-ecec74	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 08:12:37.32485	2026-10-04 08:12:37.324856
tc-h-4a0412	prob-h-ecec74	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 08:12:37.32486	2026-10-04 08:12:37.324863
tc-ts-3b45cc	prob-t-6df882	\N	err	fixed	f	1	0	\N	2026-10-04 08:12:37.324865	2026-10-04 08:12:37.324867
tc-846c9a2b	prob-388107c0	cpv-77314e54	'hello'	'olleh'	f	25	1	\N	2026-10-04 08:13:11.057723	2026-10-04 08:13:11.057726
tc-4d902439	prob-388107c0	cpv-77314e54	'world'	'dlrow'	f	25	2	\N	2026-10-04 08:13:11.057727	2026-10-04 08:13:11.057729
tc-6826552c	prob-388107c0	cpv-77314e54	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 08:13:11.05773	2026-10-04 08:13:11.057731
tc-e51a6d13	prob-c6686b57	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 08:13:16.058076	2026-10-04 08:13:16.058078
tc-b9bdfd29	prob-c6686b57	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 08:13:16.05808	2026-10-04 08:13:16.058081
tc-329bdf91	prob-ca36cf28	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 08:13:16.065198	2026-10-04 08:13:16.0652
tc-8c44a3b9	prob-ca36cf28	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 08:13:16.065201	2026-10-04 08:13:16.065202
tc-1f41877b	prob-89072de3	cpv-f257af1f	5	5	f	1	1	\N	2026-10-04 08:13:23.701706	2026-10-04 08:13:23.701712
tc-0ce4b679	prob-98c11bf2	cpv-4228908e	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 08:15:25.714305	2026-10-04 08:15:25.714309
tc-04f55f2c	prob-98c11bf2	cpv-4228908e	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 08:15:25.71431	2026-10-04 08:15:25.714311
tc-s-7a14d6	prob-h-b9868a	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 08:15:27.794539	2026-10-04 08:15:27.794544
tc-h-84ff26	prob-h-b9868a	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 08:15:27.794547	2026-10-04 08:15:27.794549
tc-ts-4908f3	prob-t-27cdec	\N	err	fixed	f	1	0	\N	2026-10-04 08:15:27.794551	2026-10-04 08:15:27.794553
tc-fd169964	prob-b9dfa6aa	cpv-1212b21f	'hello'	'olleh'	f	25	1	\N	2026-10-04 08:16:00.165562	2026-10-04 08:16:00.165565
tc-5d6df16f	prob-b9dfa6aa	cpv-1212b21f	'world'	'dlrow'	f	25	2	\N	2026-10-04 08:16:00.165567	2026-10-04 08:16:00.165568
tc-3ec2fe71	prob-b9dfa6aa	cpv-1212b21f	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 08:16:00.165569	2026-10-04 08:16:00.16557
tc-faeae9e5	prob-dcdeaa04	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 08:16:05.539334	2026-10-04 08:16:05.539337
tc-fa5f2a45	prob-dcdeaa04	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 08:16:05.539339	2026-10-04 08:16:05.539341
tc-29aea480	prob-a53035e9	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 08:16:05.54744	2026-10-04 08:16:05.547443
tc-ba8122e8	prob-a53035e9	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 08:16:05.547445	2026-10-04 08:16:05.547446
tc-23744115	prob-3c5bd6dd	cpv-eaace343	5	5	f	1	1	\N	2026-10-04 08:16:13.421025	2026-10-04 08:16:13.421027
tc-9de03ebf	prob-4193c980	cpv-ea4c7ab9	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-04 08:22:42.980609	2026-10-04 08:22:42.980612
tc-dd6fa1ab	prob-4193c980	cpv-ea4c7ab9	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-04 08:22:42.980613	2026-10-04 08:22:42.980614
tc-s-754fe2	prob-h-5a655b	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-04 08:22:45.244696	2026-10-04 08:22:45.244702
tc-h-92d22c	prob-h-5a655b	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-04 08:22:45.244706	2026-10-04 08:22:45.244708
tc-ts-95e21c	prob-t-b74853	\N	err	fixed	f	1	0	\N	2026-10-04 08:22:45.244711	2026-10-04 08:22:45.244713
tc-ee09f9f1	prob-19a521b1	cpv-193eefa9	'hello'	'olleh'	f	25	1	\N	2026-10-04 08:23:20.700186	2026-10-04 08:23:20.700192
tc-701a7f56	prob-19a521b1	cpv-193eefa9	'world'	'dlrow'	f	25	2	\N	2026-10-04 08:23:20.700196	2026-10-04 08:23:20.700198
tc-ac165dc6	prob-19a521b1	cpv-193eefa9	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-04 08:23:20.700201	2026-10-04 08:23:20.700204
tc-2c941cd0	prob-3a4faade	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-04 08:23:32.224488	2026-10-04 08:23:32.224509
tc-195af104	prob-3a4faade	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-04 08:23:32.224517	2026-10-04 08:23:32.224522
tc-8af3a077	prob-e4e940d8	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-04 08:23:32.255277	2026-10-04 08:23:32.255303
tc-75a6382e	prob-e4e940d8	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-04 08:23:32.255316	2026-10-04 08:23:32.255321
tc-42a654f2	prob-30d1abdb	cpv-d208c45c	5	5	f	1	1	\N	2026-10-04 08:23:49.173165	2026-10-04 08:23:49.173177
tc-0052b7bc	prob-1ae9521e	cpv-bb0e1ee6	5	5	f	1	1	\N	2026-10-04 15:13:04.230662	2026-10-04 15:13:04.230671
tc-135eaa35	prob-2470f6cc	cpv-9c203f94	5	5	f	1	1	\N	2026-10-05 03:24:59.758741	2026-10-05 03:24:59.758752
tc-5181cb08	prob-80272c95	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 14:07:50.612617	2026-10-06 14:07:50.612621
tc-3edaf4ab	prob-80272c95	\N	[1]	1	t	1	2	\N	2026-10-06 14:07:50.612623	2026-10-06 14:07:50.612624
tc-f586b590	prob-6fec7666	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 14:08:49.167514	2026-10-06 14:08:49.167523
tc-c40dea60	prob-6fec7666	\N	[1]	1	t	1	2	\N	2026-10-06 14:08:49.167528	2026-10-06 14:08:49.167531
tc-af9c974d	prob-cb4237ab	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 14:09:46.739379	2026-10-06 14:09:46.739381
tc-ce09e19c	prob-cb4237ab	\N	[1]	1	t	1	2	\N	2026-10-06 14:09:46.739383	2026-10-06 14:09:46.739384
tc-5f3efa35	prob-aaa6e7d8	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 14:10:12.745921	2026-10-06 14:10:12.745923
tc-d7fcbd16	prob-aaa6e7d8	\N	[1]	1	t	1	2	\N	2026-10-06 14:10:12.745925	2026-10-06 14:10:12.745926
tc-a8faa206	prob-241e6856	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 15:41:01.874681	2026-10-06 15:41:01.874687
tc-761a23bc	prob-241e6856	\N	[1]	1	t	1	2	\N	2026-10-06 15:41:01.874691	2026-10-06 15:41:01.874693
tc-b404cf36	prob-c22a7e23	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 15:42:04.975876	2026-10-06 15:42:04.97588
tc-43ad96ea	prob-c22a7e23	\N	[1]	1	t	1	2	\N	2026-10-06 15:42:04.975882	2026-10-06 15:42:04.975884
tc-49210660	prob-602d07cc	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 15:45:28.349706	2026-10-06 15:45:28.34971
tc-cd5bb461	prob-602d07cc	\N	[1]	1	t	1	2	\N	2026-10-06 15:45:28.349712	2026-10-06 15:45:28.349713
tc-3ddb9045	prob-1cd64002	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 15:53:33.895984	2026-10-06 15:53:33.895987
tc-6d38748f	prob-1cd64002	\N	[1]	1	t	1	2	\N	2026-10-06 15:53:33.895988	2026-10-06 15:53:33.895989
tc-1c8850ea	prob-43de42ab	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 16:08:11.40569	2026-10-06 16:08:11.405764
tc-ae69837d	prob-43de42ab	\N	[1]	1	t	1	2	\N	2026-10-06 16:08:11.405885	2026-10-06 16:08:11.405898
tc-6b372022	prob-514d12d4	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 16:26:30.336918	2026-10-06 16:26:30.336924
tc-e67e4e23	prob-514d12d4	\N	[1]	1	t	1	2	\N	2026-10-06 16:26:30.336928	2026-10-06 16:26:30.33693
tc-e0c5d159	prob-022fb13c	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-06 16:51:45.180867	2026-10-06 16:51:45.180874
tc-e903575a	prob-022fb13c	\N	[1]	1	t	1	2	\N	2026-10-06 16:51:45.180878	2026-10-06 16:51:45.180881
tc-8bf0bbf9	prob-6d52a924	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-07 03:44:51.005076	2026-10-07 03:44:51.00508
tc-9500274f	prob-6d52a924	\N	[1]	1	t	1	2	\N	2026-10-07 03:44:51.005083	2026-10-07 03:44:51.005084
tc-74f1d412	prob-43a8cc0c	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-07 03:50:08.019362	2026-10-07 03:50:08.019365
tc-c247cd0b	prob-43a8cc0c	\N	[1]	1	t	1	2	\N	2026-10-07 03:50:08.019366	2026-10-07 03:50:08.019367
tc-0b9467b7	prob-6bd8fe28	cpv-d300890e	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-07 04:17:44.202035	2026-10-07 04:17:44.202041
tc-8b111db0	prob-6bd8fe28	cpv-d300890e	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-07 04:17:44.202044	2026-10-07 04:17:44.202049
tc-s-a16729	prob-h-8a1c8c	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-07 04:17:45.997589	2026-10-07 04:17:45.997591
tc-h-48ed4b	prob-h-8a1c8c	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-07 04:17:45.997593	2026-10-07 04:17:45.997594
tc-ts-b5e111	prob-t-319aa2	\N	err	fixed	f	1	0	\N	2026-10-07 04:17:45.997595	2026-10-07 04:17:45.997596
tc-a8d02039	prob-655978f3	cpv-ccb67b51	'hello'	'olleh'	f	25	1	\N	2026-10-07 04:17:53.833353	2026-10-07 04:17:53.833358
tc-e7fa7d7b	prob-655978f3	cpv-ccb67b51	'world'	'dlrow'	f	25	2	\N	2026-10-07 04:17:53.83336	2026-10-07 04:17:53.833361
tc-bc47a186	prob-655978f3	cpv-ccb67b51	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-07 04:17:53.833363	2026-10-07 04:17:53.833364
tc-660b3739	prob-971d3f13	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-07 04:17:59.313703	2026-10-07 04:17:59.313705
tc-6535794e	prob-971d3f13	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-07 04:17:59.313706	2026-10-07 04:17:59.313707
tc-01b410d8	prob-11996613	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-07 04:17:59.319493	2026-10-07 04:17:59.319495
tc-a7bea25c	prob-11996613	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-07 04:17:59.319496	2026-10-07 04:17:59.319497
tc-433a187b	prob-6990b0d3	cpv-2282850f	5	5	f	1	1	\N	2026-10-07 04:18:06.20502	2026-10-07 04:18:06.205028
tc-ebc96bd2	prob-73dc970c	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-07 04:19:26.204693	2026-10-07 04:19:26.204696
tc-a7c3a338	prob-73dc970c	\N	[1]	1	t	1	2	\N	2026-10-07 04:19:26.204697	2026-10-07 04:19:26.204698
tc-s-3804f9	prob-h-2bd6eb	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-07 05:01:06.325537	2026-10-07 05:01:06.32554
tc-h-5ee383	prob-h-2bd6eb	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-07 05:01:06.325542	2026-10-07 05:01:06.325544
tc-ts-6ccefd	prob-t-ac7f44	\N	err	fixed	f	1	0	\N	2026-10-07 05:01:06.325546	2026-10-07 05:01:06.325547
tc-07437055	prob-789a60db	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-07 05:01:14.330305	2026-10-07 05:01:14.330308
tc-63a9a8e1	prob-789a60db	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-07 05:01:14.330311	2026-10-07 05:01:14.330312
tc-6b40fafe	prob-fafbb6e4	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-07 05:01:14.342172	2026-10-07 05:01:14.342175
tc-eefdaa18	prob-fafbb6e4	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-07 05:01:14.342178	2026-10-07 05:01:14.342179
tc-s-7b602a	prob-h-822de9	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-07 05:04:43.848094	2026-10-07 05:04:43.848096
tc-h-8e1d7c	prob-h-822de9	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-07 05:04:43.848098	2026-10-07 05:04:43.848099
tc-ts-289e7d	prob-t-1bbea3	\N	err	fixed	f	1	0	\N	2026-10-07 05:04:43.8481	2026-10-07 05:04:43.8481
tc-s-c53e82	prob-h-a28bbf	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-07 05:08:15.642586	2026-10-07 05:08:15.642588
tc-h-d441ba	prob-h-a28bbf	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-07 05:08:15.64259	2026-10-07 05:08:15.64259
tc-ts-f7ede6	prob-t-671028	\N	err	fixed	f	1	0	\N	2026-10-07 05:08:15.642591	2026-10-07 05:08:15.642592
tc-5d0c5eb5	prob-d8bfacfe	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-07 05:10:21.473487	2026-10-07 05:10:21.473488
tc-a8e2c06f	prob-d8bfacfe	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-07 05:10:21.47349	2026-10-07 05:10:21.473491
tc-75d0cb39	prob-f00fa4ae	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-07 05:10:21.478199	2026-10-07 05:10:21.478201
tc-4ae609c3	prob-f00fa4ae	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-07 05:10:21.478206	2026-10-07 05:10:21.478206
tc-be07a95e	prob-0eeaad3d	cpv-8e869edb	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-07 05:16:41.819806	2026-10-07 05:16:41.81981
tc-ff766152	prob-0eeaad3d	cpv-8e869edb	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-07 05:16:41.819812	2026-10-07 05:16:41.819813
tc-s-2cfba8	prob-h-685367	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-07 05:16:44.338059	2026-10-07 05:16:44.338061
tc-h-6f6aee	prob-h-685367	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-07 05:16:44.338063	2026-10-07 05:16:44.338064
tc-ts-e3b848	prob-t-67fdd6	\N	err	fixed	f	1	0	\N	2026-10-07 05:16:44.338065	2026-10-07 05:16:44.338066
tc-207980c3	prob-ef709f17	cpv-45d558c0	'hello'	'olleh'	f	25	1	\N	2026-10-07 05:16:50.749358	2026-10-07 05:16:50.74937
tc-39a4863e	prob-ef709f17	cpv-45d558c0	'world'	'dlrow'	f	25	2	\N	2026-10-07 05:16:50.749371	2026-10-07 05:16:50.749372
tc-0415fe8d	prob-ef709f17	cpv-45d558c0	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-07 05:16:50.749372	2026-10-07 05:16:50.749373
tc-774d0206	prob-75bfd2e7	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-07 05:16:55.829195	2026-10-07 05:16:55.829198
tc-6426e503	prob-75bfd2e7	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-07 05:16:55.8292	2026-10-07 05:16:55.829201
tc-d62ec961	prob-ea9cdf0b	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-07 05:16:55.83339	2026-10-07 05:16:55.833392
tc-a4655dd0	prob-ea9cdf0b	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-07 05:16:55.833394	2026-10-07 05:16:55.833395
tc-f692554d	prob-4a85a14e	cpv-99b1d497	5	5	f	1	1	\N	2026-10-07 05:17:02.654066	2026-10-07 05:17:02.654071
tc-1ac745e7	prob-e63cc727	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-07 05:18:29.422698	2026-10-07 05:18:29.4227
tc-0d539616	prob-e63cc727	\N	[1]	1	t	1	2	\N	2026-10-07 05:18:29.422702	2026-10-07 05:18:29.422702
tc-2d1fad87	prob-86eeca7f	cpv-14db15c5	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-08 03:21:16.135435	2026-10-08 03:21:16.135437
tc-caff8334	prob-86eeca7f	cpv-14db15c5	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-08 03:21:16.135439	2026-10-08 03:21:16.13544
tc-s-1058c0	prob-h-4f90a2	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-08 03:21:18.235608	2026-10-08 03:21:18.235612
tc-h-7aaf84	prob-h-4f90a2	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-08 03:21:18.235614	2026-10-08 03:21:18.235615
tc-ts-b79a5b	prob-t-ae8757	\N	err	fixed	f	1	0	\N	2026-10-08 03:21:18.235617	2026-10-08 03:21:18.235618
tc-47797d78	prob-310cba66	cpv-988258a8	'hello'	'olleh'	f	25	1	\N	2026-10-08 03:21:26.221211	2026-10-08 03:21:26.221214
tc-761cdd73	prob-310cba66	cpv-988258a8	'world'	'dlrow'	f	25	2	\N	2026-10-08 03:21:26.221215	2026-10-08 03:21:26.221216
tc-3087b34b	prob-310cba66	cpv-988258a8	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-08 03:21:26.221216	2026-10-08 03:21:26.221217
tc-6f51fa10	prob-c7feddd6	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-08 03:21:32.272117	2026-10-08 03:21:32.27213
tc-b36a7566	prob-c7feddd6	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-08 03:21:32.272133	2026-10-08 03:21:32.272135
tc-7e4ac6b1	prob-26152780	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-08 03:21:32.284332	2026-10-08 03:21:32.284341
tc-ebc61220	prob-26152780	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-08 03:21:32.284344	2026-10-08 03:21:32.284345
tc-c9f78253	prob-043390e4	cpv-46b82888	5	5	f	1	1	\N	2026-10-08 03:21:39.922129	2026-10-08 03:21:39.922137
tc-7deacb01	prob-b5bec3ae	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-08 03:23:25.12017	2026-10-08 03:23:25.120173
tc-222730ba	prob-b5bec3ae	\N	[1]	1	t	1	2	\N	2026-10-08 03:23:25.120176	2026-10-08 03:23:25.120177
tc-0da1b856	prob-15741b01	cpv-7cedcf11	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-08 04:27:52.888127	2026-10-08 04:27:52.888133
tc-3e52654a	prob-15741b01	cpv-7cedcf11	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-08 04:27:52.888136	2026-10-08 04:27:52.888138
tc-s-792f25	prob-h-180991	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-08 04:27:55.697627	2026-10-08 04:27:55.69763
tc-h-08402b	prob-h-180991	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-08 04:27:55.697631	2026-10-08 04:27:55.697632
tc-ts-ac4973	prob-t-48b78b	\N	err	fixed	f	1	0	\N	2026-10-08 04:27:55.697633	2026-10-08 04:27:55.697634
tc-e6dae6d4	prob-ecece3d4	cpv-89993c76	'hello'	'olleh'	f	25	1	\N	2026-10-08 04:28:39.683689	2026-10-08 04:28:39.683694
tc-541f94dd	prob-ecece3d4	cpv-89993c76	'world'	'dlrow'	f	25	2	\N	2026-10-08 04:28:39.683696	2026-10-08 04:28:39.683697
tc-0f775b0b	prob-ecece3d4	cpv-89993c76	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-08 04:28:39.683698	2026-10-08 04:28:39.683699
tc-a3d1cc0e	prob-65f4c8c7	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-08 04:28:47.981913	2026-10-08 04:28:47.981917
tc-0d659536	prob-65f4c8c7	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-08 04:28:47.981919	2026-10-08 04:28:47.981921
tc-32fc426b	prob-4ee07061	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-08 04:28:48.013056	2026-10-08 04:28:48.013066
tc-969a9b90	prob-4ee07061	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-08 04:28:48.013073	2026-10-08 04:28:48.013076
tc-e3ddf15a	prob-3aa709e6	cpv-490be401	5	5	f	1	1	\N	2026-10-08 04:28:58.140788	2026-10-08 04:28:58.140791
tc-5993cac0	prob-d45b69d3	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-08 04:31:21.823541	2026-10-08 04:31:21.823543
tc-df1eb1f3	prob-d45b69d3	\N	[1]	1	t	1	2	\N	2026-10-08 04:31:21.823544	2026-10-08 04:31:21.823545
tc-b2f7ae9e	prob-673e17c7	cpv-3b51547e	["LRUCache", "put", "put", "get"]\n[[2], [1, 1], [2, 2], [1]]	[null, null, null, 1]	f	1	1	Initial key 1 is retrieved after put operations.	2026-10-08 08:31:22.469844	2026-10-08 08:31:22.469847
tc-48270b53	prob-673e17c7	cpv-3b51547e	["LRUCache", "put", "get", "put", "get", "get"]\n[[1], [2, 1], [2], [3, 2], [2], [3]]	[null, null, 1, null, -1, 2]	t	2	2	\N	2026-10-08 08:31:22.469848	2026-10-08 08:31:22.469849
tc-s-763c60	prob-h-9d06ba	\N	[1,2]	[2,1]	f	1	0	\N	2026-10-08 08:31:24.362741	2026-10-08 08:31:24.362743
tc-h-d123b7	prob-h-9d06ba	\N	[3,4]	[4,3]	t	1	0	\N	2026-10-08 08:31:24.362745	2026-10-08 08:31:24.362745
tc-ts-8b5aed	prob-t-762e8f	\N	err	fixed	f	1	0	\N	2026-10-08 08:31:24.362746	2026-10-08 08:31:24.362747
tc-14950d0a	prob-2ea39745	cpv-43cb8947	'hello'	'olleh'	f	25	1	\N	2026-10-08 08:32:08.543315	2026-10-08 08:32:08.543323
tc-8375bcb7	prob-2ea39745	cpv-43cb8947	'world'	'dlrow'	f	25	2	\N	2026-10-08 08:32:08.543326	2026-10-08 08:32:08.543328
tc-4bf5eefb	prob-2ea39745	cpv-43cb8947	'SparkX Platform'	'mroftalP XkrapS'	t	50	3	\N	2026-10-08 08:32:08.54333	2026-10-08 08:32:08.543332
tc-b9424d0b	prob-949a1c9b	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-08 08:32:15.600144	2026-10-08 08:32:15.60015
tc-4272ef76	prob-949a1c9b	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-08 08:32:15.600153	2026-10-08 08:32:15.600155
tc-944d8d30	prob-37d7c3c9	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-08 08:32:15.613279	2026-10-08 08:32:15.613283
tc-32fd9690	prob-37d7c3c9	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-08 08:32:15.613285	2026-10-08 08:32:15.613287
tc-46ff608e	prob-ee2ca853	cpv-eff36d9f	5	5	f	1	1	\N	2026-10-08 08:32:23.825275	2026-10-08 08:32:23.82528
tc-c084d176	prob-7b7f0dd7	\N	[-2,1,-3,4,-1,2,1,-5,4]	6	f	1	1	\N	2026-10-08 08:35:12.234082	2026-10-08 08:35:12.234085
tc-98dc019d	prob-7b7f0dd7	\N	[1]	1	t	1	2	\N	2026-10-08 08:35:12.234087	2026-10-08 08:35:12.234088
tc-2bbc4d0c	prob-54909183	\N	{"a": 2, "b": 3}	5	f	1	0	\N	2026-10-08 08:59:47.190299	2026-10-08 08:59:47.190308
tc-801a859b	prob-54909183	\N	{"a": 10, "b": 20}	30	t	1	0	\N	2026-10-08 08:59:47.190314	2026-10-08 08:59:47.190318
tc-143a1657	prob-12b46bc8	\N	{"a": 3, "b": 4}	12	f	1	0	\N	2026-10-08 08:59:47.209914	2026-10-08 08:59:47.209924
tc-f535211e	prob-12b46bc8	\N	{"a": 7, "b": 6}	42	t	1	0	\N	2026-10-08 08:59:47.209931	2026-10-08 08:59:47.209935
\.


--
-- Data for Name: integrity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.integrity_logs (id, candidate_id, "timestamp", event_type, description, severity, created_at) FROM stdin;
ev-330797	cand-rec-a-5737d2	2026-10-05T03:24:14.093686+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-05 03:24:14.095278
ev-5025c9	cand-rec-a-00f7a5	2026-10-05T04:27:17.970606+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-05 04:27:17.972479
ev-9fffe4	cand-rec-a-13f4e2	2026-10-07T04:18:43.493477+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-07 04:18:43.494599
ev-62021b	cand-rec-a-4f6b42	2026-10-07T05:17:43.325743+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-07 05:17:43.32736
ev-e162d8	cand-rec-a-854291	2026-10-08T03:22:23.605938+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-08 03:22:23.607542
ev-257e91	cand-rec-a-e346b1	2026-10-08T04:30:06.455717+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-08 04:30:06.457338
ev-8f2bc2	cand-rec-a-33c3f5	2026-10-08T08:33:26.269985+00:00	tab_switch	Candidate switched browser tab for 4 seconds	medium	2026-10-08 08:33:26.270739
\.


--
-- Data for Name: interview_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interview_bookings (id, organization_id, job_id, candidate_id, recruiter_id, availability_id, start_time_utc, end_time_utc, timezone, status, meeting_url, notes, cancellation_reason, cancelled_by, cancelled_at, rescheduled_from_id, rescheduled_to_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_skill_requirements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_skill_requirements (id, job_id, skill_id, requirement_type, weight, min_years, min_proficiency, created_at, updated_at) FROM stdin;
jsr-407710a8	job-101	skl-91160f99	must_have	1	0	intermediate	2026-10-04 14:59:11.971352	2026-10-24 10:04:34.524827
jsr-78566710	job-101	skl-ffa694c7	must_have	1	0	intermediate	2026-10-04 14:59:11.976931	2026-10-24 10:04:34.525548
jsr-7ae6a9ab	job-101	skl-d745e8fa	must_have	1	0	intermediate	2026-10-04 14:59:11.969005	2026-10-24 10:04:34.523996
jsr-8b5a286b	job-101	skl-d79c8bea	must_have	1	0	intermediate	2026-10-04 14:59:11.968059	2026-10-24 10:04:34.522804
jsr-953080ab	job-101	skl-fc68bd8c	must_have	1	0	intermediate	2026-10-04 14:59:11.979896	2026-10-24 10:04:34.527777
jsr-b8d41069	job-101	skl-4731ca21	must_have	1	0	intermediate	2026-10-04 14:59:11.966681	2026-10-24 10:04:34.520457
jsr-cd2372b7	job-101	skl-60936493	must_have	1	0	intermediate	2026-10-04 14:59:11.977512	2026-10-24 10:04:34.526221
jsr-0e9cc715	job-102	skl-be40daab	must_have	1	0	intermediate	2026-10-04 14:59:11.995114	2026-10-24 10:04:34.547282
jsr-1c99a17b	job-102	skl-f0f25337	must_have	1	0	intermediate	2026-10-04 14:59:11.987234	2026-10-24 10:04:34.54216
jsr-231dd648	job-102	skl-d745e8fa	must_have	1	0	intermediate	2026-10-04 14:59:11.981823	2026-10-24 10:04:34.539724
jsr-93b9cfae	job-102	skl-c0ce67ac	must_have	1	0	intermediate	2026-10-04 14:59:11.990445	2026-10-24 10:04:34.54363
jsr-befe9ca9	job-102	skl-38450fae	must_have	1	0	intermediate	2026-10-04 14:59:11.985012	2026-10-24 10:04:34.541006
jsr-c6c60bf5	job-102	skl-e7cb3758	must_have	1	0	intermediate	2026-10-04 14:59:11.99292	2026-10-24 10:04:34.545709
jsr-acbe5128	job-5cd562	skl-96829365	must_have	1	0	intermediate	2026-10-04 14:59:11.996728	2026-10-24 10:04:34.555926
jsr-b14663a2	job-5cd562	skl-5fbef91d	must_have	1	0	intermediate	2026-10-04 14:59:11.996242	2026-10-24 10:04:34.554285
jsr-e88d9032	job-5cd562	skl-2af8abbb	must_have	1	0	intermediate	2026-10-04 14:59:11.997308	2026-10-24 10:04:34.556999
jsr-07f36fe8	job-e12be8	skl-7685788b	must_have	1	0	intermediate	2026-10-04 14:59:12.008869	2026-10-24 10:04:34.567196
jsr-4e0a76d4	job-e12be8	skl-7c5e9366	must_have	1	0	intermediate	2026-10-04 14:59:12.003691	2026-10-24 10:04:34.565459
jsr-5517a3ff	job-e12be8	skl-2e8ee8da	must_have	1	0	intermediate	2026-10-04 14:59:12.00618	2026-10-24 10:04:34.566356
jsr-ab116c2a	job-e12be8	skl-0201dc5a	must_have	1	0	intermediate	2026-10-04 14:59:12.001494	2026-10-24 10:04:34.564381
jsr-ece1dbff	job-e12be8	skl-be6424ca	must_have	1	0	intermediate	2026-10-04 14:59:11.998923	2026-10-24 10:04:34.563046
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, title, company_name, organization_id, department, location, min_experience_years, experience, education, languages, required_skills, optional_criteria, description, questions, coding_assessment, coding_difficulty, assessment_pool, assessment_version, competency_blueprint, ctc_type, ctc_min, ctc_max, ctc_currency, ctc_period, variable_pay_min, variable_pay_max, status, closed_at, closed_by, closure_reason, paused_at, created_at) FROM stdin;
job-101	Senior AI / Full-Stack Engineer	SparkX Technologies	org-sparkx-default	AI Research & Product	Bengaluru, India (Hybrid)	3	3-6 years	B.Tech / M.Tech in CS, AI, or equivalent	["English", "Hindi"]	["Python", "FastAPI", "React", "PyTorch / Transformers", "LangChain", "PostgreSQL", "System Design"]	Experience with WebRTC, real-time proctoring, or vector databases (Pinecone/Milvus).	Design and implement scalable generative AI pipelines, LLM-based agent systems, and robust full-stack web applications with FastAPI and React.	[{"id": "iq_f6626a", "type": "Security, Governance & Compliance \\u2014 PostgreSQL", "prompt": "How do you systematically audit and enforce security, data privacy, and principle-of-least-privilege across PostgreSQL implementations in your Senior AI / Full-Stack Engineer duties?", "rubric": ["Security by design", "Compliance posture", "Vulnerability remediation", "Threat modeling"], "follow_up_vague": "What specific compliance or threat vector concerned you most in that deployment?", "follow_up_expert": "How do you continuously verify that access controls and configurations have not drifted over time?"}, {"id": "iq_2a841f", "type": "Resource & Performance Optimization \\u2014 PyTorch / Transformers", "prompt": "Detail a scenario where you identified and eliminated significant latency, compute bottlenecks, or resource waste within a PyTorch / Transformers pipeline as a Senior AI / Full-Stack Engineer.", "rubric": ["Performance profiling", "Resource efficiency", "Bottleneck resolution", "Quantitative gains"], "follow_up_vague": "What profiling tools and benchmark metrics did you use to pinpoint the bottleneck?", "follow_up_expert": "What were the before-and-after p99 latency or cost figures following your intervention?"}, {"id": "iq_abb99c", "type": "Scalability & Quality Engineering \\u2014 FastAPI", "prompt": "When standardizing FastAPI practices across an organization, what automated quality gates, linting/verification pipelines, or peer review standards do you mandate as a Senior AI / Full-Stack Engineer?", "rubric": ["Automated verification", "Quality standards", "Maintainability", "Continuous improvement"], "follow_up_vague": "How did you balance developer or operational velocity against strict compliance gates?", "follow_up_expert": "What was the measurable decrease in production defect or revision rate after rolling out these standards?"}]	{"title": "Real-time Telemetry Debounce & Event Aggregator", "language": "javascript", "instructions": "Implement an integrity log aggregator that collapses consecutive duplicate suspicious events within a 3-second window to prevent alert fatigue for HR.", "initialCode": "// Implement aggregateSuspiciousEvents(events)\\n// Each event: { type: string, timestamp: number }\\n// Return filtered events where duplicates within 3000ms are combined.\\n\\nfunction aggregateSuspiciousEvents(events) {\\n  if (!events || events.length === 0) return [];\\n  const result = [];\\n  let lastEvent = null;\\n  for (const ev of events) {\\n    if (!lastEvent || ev.type !== lastEvent.type || (ev.timestamp - lastEvent.timestamp) > 3000) {\\n      result.push({ ...ev, count: 1 });\\n      lastEvent = ev;\\n    } else {\\n      result[result.length - 1].count += 1;\\n    }\\n  }\\n  return result;\\n}\\n\\nconsole.log(aggregateSuspiciousEvents([\\n  { type: 'TAB_SWITCH', timestamp: 1000 },\\n  { type: 'TAB_SWITCH', timestamp: 2500 },\\n  { type: 'FACE_LOST', timestamp: 6000 }\\n]));", "testCases": [{"name": "Debounce consecutive tab switches (<3s)", "input": "2 identical events at 1s and 2.5s", "expected": "1 aggregated event (count: 2)"}, {"name": "Separate distinct events", "input": "Events separated by 5s", "expected": "2 distinct events"}]}	Mid-Level	{"domain": "technical", "is_coding": true, "technical_mcqs": [{"id": "mcq_d75ab5", "question": "What is the primary objective of automated regression testing and linting when standardizing PostgreSQL codebases?", "options": {"A": "Eliminate the need for developer documentation and system architecture diagrams.", "B": "Increase compile time to justify additional cloud spending.", "C": "Guarantee that no security audits will ever be required.", "D": "Prevent regressions, enforce consistency, and catch bugs before deployment."}, "correct_option": "D", "explanation": "Continuous automated validation catches regressions early in the lifecycle and ensures code maintainability.", "difficulty": "Mid-Level"}, {"id": "mcq_15eb03", "question": "Which architectural approach best ensures high availability and horizontal scalability when designing systems around PyTorch / Transformers?", "options": {"A": "Manual server provisioning whenever traffic thresholds are exceeded.", "B": "Stateless processing nodes coupled with decoupled messaging and managed persistence.", "C": "Synchronous tight coupling between all external microservices.", "D": "A monolithic single-node instance storing all transactional state in local memory."}, "correct_option": "B", "explanation": "Stateless architectures and asynchronous decoupling allow workloads to scale horizontally under dynamic traffic.", "difficulty": "Mid-Level"}, {"id": "mcq_ba3d5a", "question": "In a Senior AI / Full-Stack Engineer role, an unexplained regression or performance drop is observed in the FastAPI pipeline. What is the recommended first diagnostic action?", "options": {"A": "Roll back all company-wide deployments indiscriminately without investigation.", "B": "Isolate the component, inspect distributed traces/logs, and identify the root cause before taking corrective action.", "C": "Silently suppress client-facing exceptions and wait for off-peak hours.", "D": "Immediately scale compute resources 10x without examining error logs."}, "correct_option": "B", "explanation": "Systematic root cause analysis via observability data prevents compounding errors during an incident.", "difficulty": "Mid-Level"}, {"id": "mcq_8d2654", "question": "How should a Senior AI / Full-Stack Engineer approach technical debt and refactoring within a critical Python system?", "options": {"A": "Ignore all technical debt until the entire system suffers an unrecoverable crash.", "B": "Halt all feature delivery indefinitely to rewrite the system from scratch without tests.", "C": "Prioritize high-risk bottlenecks with test coverage and incremental refactoring.", "D": "Delegate all architecture refactoring exclusively to junior interns."}, "correct_option": "C", "explanation": "Pragmatic, test-driven incremental refactoring minimizes regression risk while continually reducing technical debt.", "difficulty": "Mid-Level"}, {"id": "mcq_fa7ae7", "question": "When handling sensitive customer data or compliance requirements within LangChain, which security model should a Senior AI / Full-Stack Engineer enforce?", "options": {"A": "Storing sensitive tokens in public configuration files.", "B": "Granting administrative privileges to all internal team members for convenience.", "C": "Relying solely on network firewalls without authenticating internal microservice calls.", "D": "Zero-trust architecture with end-to-end encryption and principle-of-least-privilege RBAC."}, "correct_option": "D", "explanation": "Zero-trust and least-privilege RBAC are the universal security standard for modern enterprise deployments.", "difficulty": "Mid-Level"}], "scenario": {"id": "scenario_fd54bc", "title": "Critical Escalation \\u2014 PostgreSQL in Senior AI / Full-Stack Engineer", "prompt": "You are a Senior AI / Full-Stack Engineer. A critical issue in PostgreSQL has downstream impact on organizational compliance and user experience. You have 48 hours before an executive leadership review. Detail your prioritization, mitigation, root cause investigation, and stakeholder communication plan.", "guidance": "Strong answers reference domain-specific standards for PostgreSQL, risk methodology, escalation protocols, and a structured remediation plan.", "difficulty": "Mid-Level", "ideal_keywords": ["postgresql", "root cause", "mitigation", "stakeholder", "escalation", "framework"]}, "hands_on": {"id": "hands_on_62d8f4", "title": "Practical Task \\u2014 Coding for Senior AI / Full-Stack Engineer", "is_coding": true, "task_type": "coding", "instructions": "Using your knowledge of Python, FastAPI, React, PyTorch / Transformers, LangChain, complete a practical task relevant to the Senior AI / Full-Stack Engineer role demonstrating actual day-to-day proficiency. Document your approach, methodology, assumptions, and deliverable.", "difficulty": "Mid-Level", "deliverable_description": "Complete solution demonstrating mastery of PostgreSQL in a realistic Senior AI / Full-Stack Engineer scenario.", "supported_languages": ["python", "sql", "javascript"], "starter_code": {"python": "# Senior AI / Full-Stack Engineer Solution\\ndef solve(data):\\n    pass\\n"}, "sample_test_cases": [{"name": "Basic case", "input": "sample_input", "expected": "expected_output"}], "hidden_test_cases": [{"name": "Edge case", "input": "edge_input", "expected": "edge_output"}]}, "domain_rationale": "Classified as technical based on job title 'Senior AI / Full-Stack Engineer', skills (Python, FastAPI, React, PyTorch / Transformers, LangChain), and description.", "supported_eval_types": ["coding_challenge", "external_platforms", "mcq_knowledge", "scenario_judgment", "interview_questions"], "external_platform": "leetcode", "external_questions": [{"id": "hr_solve_me_first", "platform": "hackerrank", "title": "Solve Me First", "difficulty": "Easy", "type": "warmup", "url": "https://www.hackerrank.com/challenges/solve-me-first"}, {"id": "lc_add_two_numbers", "platform": "leetcode", "title": "2. Add Two Numbers", "difficulty": "Medium", "type": "linked_list", "url": "https://leetcode.com/problems/add-two-numbers/"}], "troubleshooting": {"id": "trouble_101", "title": "Debug Memory Leak in Inference Pipeline", "is_coding": true, "bug_description": "Fix the tensor memory leak by ensuring tensors are detached.", "difficulty": "Medium", "broken_code": {"python": "def fix(data):\\n    return data\\n"}, "sample_test_cases": [{"name": "Sample 1", "input": "[1, 2, 3]", "expected": "[1, 2, 3]"}]}}	1	{}	range	20.00	30.00	INR	annual	\N	\N	Active	2026-09-27 19:06:49.288604	admin@sparkx.ai	Position FIlled	2026-10-09 19:15:09.283558	2026-09-19 15:41:12.220814
job-102	Frontend Software Engineer (React & UX)	SparkX Technologies	org-sparkx-default	Core Experience	Remote (India)	2	2-4 years	B.Tech / BCA / MCA or equivalent portfolio	["English"]	["React", "TypeScript / JavaScript", "Tailwind CSS", "Canvas API", "State Management", "Performance Optimization"]	Experience with Web Speech API, Chart.js, or micro-frontends.	Build ultra-responsive, accessible user interfaces for candidate video assessment and recruiter dashboards with Tailwind CSS, React, and Canvas APIs.	[{"id": "iq_1", "type": "Core Competency \\u2014 React", "prompt": "Describe the most complex challenge you resolved using React in a Frontend Software Engineer (React & UX) role. What was your methodology?", "rubric": ["React", "Structured problem-solving", "Measurable outcome", "Stakeholder impact"], "follow_up_vague": "How exactly was React applied?", "follow_up_expert": "How did you ensure the React solution was scalable?"}, {"id": "iq_2", "type": "Cross-Functional \\u2014 TypeScript / JavaScript", "prompt": "Describe coordinating stakeholders to deliver a critical outcome involving TypeScript / JavaScript under constraints in a Frontend Software Engineer (React & UX) context.", "rubric": ["TypeScript / JavaScript", "Stakeholder management", "Communication under pressure", "Delivery"], "follow_up_vague": "What made this coordination difficult?", "follow_up_expert": "What systemic improvements followed?"}, {"id": "iq_3", "type": "Operational Failure & Root Cause", "prompt": "Walk through the most significant failure you handled as a Frontend Software Engineer (React & UX). What was your investigation and what changed?", "rubric": ["Root cause identification", "Corrective action", "Preventive controls", "Leadership communication"], "follow_up_vague": "What early warnings did you miss?", "follow_up_expert": "How did you redesign the process to prevent recurrence?"}]	{"title": "Custom React Hook: useMediaStream", "language": "javascript", "instructions": "Write a safe camera stream hook logic with error handling for NotFoundError and NotAllowedError.", "initialCode": "// Write stream initialization logic with camera permission handling\\nasync function initCameraStream(videoElement) {\\n  try {\\n    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });\\n    if (videoElement) {\\n      videoElement.srcObject = stream;\\n    }\\n    return { success: true, stream };\\n  } catch (err) {\\n    if (err.name === 'NotAllowedError') {\\n      return { success: false, error: 'Camera/Mic permission denied by user' };\\n    }\\n    return { success: false, error: err.message };\\n  }\\n}", "testCases": [{"name": "Handles camera permission denial cleanly", "input": "NotAllowedError", "expected": "Returns descriptive error message"}]}	Mid-Level	{"domain": "technical", "is_coding": true, "technical_mcqs": [{"id": "mcq_1", "question": "What is the primary responsibility of a Frontend Software Engineer (React & UX) when overseeing React?", "options": {"A": "Delegate all React decisions without oversight.", "B": "Ensure React activities align with organizational standards and compliance.", "C": "Address React issues only when externally escalated.", "D": "Apply React practices only during annual reviews."}, "correct_option": "B", "explanation": "A Frontend Software Engineer (React & UX) proactively governs React in alignment with organizational and regulatory requirements.", "difficulty": "Mid-Level"}, {"id": "mcq_2", "question": "When TypeScript / JavaScript produces an unexpected result in a Frontend Software Engineer (React & UX) context, what is the correct first step?", "options": {"A": "Ignore if variance is below a threshold.", "B": "Immediately escalate without investigation.", "C": "Conduct root cause analysis before corrective action.", "D": "Apply the previous resolution without review."}, "correct_option": "C", "explanation": "Root cause analysis ensures corrective actions address underlying causes rather than symptoms.", "difficulty": "Mid-Level"}, {"id": "mcq_3", "question": "What most distinguishes high performance in a Frontend Software Engineer (React & UX) role handling React, TypeScript / JavaScript, Tailwind CSS, Canvas API, State Management under deadline?", "options": {"A": "Completing tasks quickly by skipping documentation.", "B": "Applying domain frameworks while maintaining quality, traceability, and stakeholder communication.", "C": "Delegating critical decisions to avoid accountability.", "D": "Waiting for instructions in ambiguous situations."}, "correct_option": "B", "explanation": "High performers in Frontend Software Engineer (React & UX) demonstrate structured thinking and domain expertise under pressure.", "difficulty": "Senior"}], "scenario": {"id": "scenario_1", "title": "Critical Escalation \\u2014 React in Frontend Software Engineer (React & UX)", "prompt": "You are a Frontend Software Engineer (React & UX). A critical issue in React has downstream impact on TypeScript / JavaScript and organizational compliance. You have 48 hours before a senior leadership review. Detail your prioritization, mitigation, root cause investigation, and stakeholder communication plan.", "guidance": "Strong answers reference domain-specific standards for React and TypeScript / JavaScript, risk methodology, escalation protocols, and a structured remediation plan.", "difficulty": "Senior", "ideal_keywords": ["react", "typescript / javascript", "root cause", "mitigation", "stakeholder", "escalation", "framework"]}, "hands_on": {"id": "hands_on_1", "title": "Practical Task \\u2014 Coding for Frontend Software Engineer (React & UX)", "is_coding": true, "task_type": "coding", "instructions": "Using your knowledge of React, TypeScript / JavaScript, Tailwind CSS, Canvas API, State Management, complete a practical task relevant to the Frontend Software Engineer (React & UX) role demonstrating actual day-to-day proficiency. Document your approach, methodology, assumptions, and deliverable.", "difficulty": "{difficulty}", "deliverable_description": "Complete solution demonstrating mastery of React in a realistic Frontend Software Engineer (React & UX) scenario.", "supported_languages": ["javascript", "typescript"], "starter_code": {"python": "# Frontend Software Engineer (React & UX) Solution\\ndef solve(data):\\n    pass\\n"}, "sample_test_cases": [{"name": "Basic case", "input": "sample_input", "expected": "expected_output"}], "hidden_test_cases": [{"name": "Edge case", "input": "edge_input", "expected": "edge_output"}]}, "domain_rationale": "Classified as technical based on job title 'Frontend Software Engineer (React & UX)', skills (React, TypeScript / JavaScript, Tailwind CSS, Canvas API, State Management), and description.", "supported_eval_types": ["coding_challenge", "external_platforms", "mcq_knowledge", "scenario_judgment", "interview_questions"], "external_platform": "hackerrank", "external_questions": [{"id": "hr_simple_array_sum", "platform": "hackerrank", "title": "Simple Array Sum", "difficulty": "Easy", "type": "warmup", "url": "https://www.hackerrank.com/challenges/simple-array-sum"}, {"id": "hr_diagonal_difference", "platform": "hackerrank", "title": "Diagonal Difference", "difficulty": "Easy", "type": "arrays", "url": "https://www.hackerrank.com/challenges/diagonal-difference"}]}	1	{}	range	12.00	18.00	INR	annual	\N	\N	Active	\N	\N	\N	\N	2026-09-19 15:41:12.220822
job-5cd562	AWS Cloud Engineer 	SparkX Technologies	org-sparkx-default	Engineering & Innovation	Ahmedabad	1	1+ years	B.Tech / B.E. / M.Tech in Computer Science, Data Science or related	["English", "Hindi"]	["AWS", "Docker", "Kubernetes"]	Hands-on experience with real-time video/audio telemetry or WebRTC.	Lead the engineering architecture of next-generation enterprise AI interview and assessment automation.	[{"id": "gen-q1", "type": "Technical Competence", "prompt": "In the context of AWS Cloud Engineer , how do you leverage AWS in production to handle high throughput, concurrency, and reliability?", "idealKeywords": ["aws", "concurrency", "optimization", "monitoring", "latency", "async", "cache"], "followUpVague": "You mentioned utilizing AWS, but what specific architectural bottlenecks did you encounter, and how did you measure performance improvements?", "followUpExpert": "Given your deep familiarity with AWS, how would you architect automated failover and zero-downtime deployments under sudden traffic spikes?"}, {"id": "gen-q2", "type": "System Architecture", "prompt": "How would you integrate AWS with Docket while maintaining data consistency, modular separation, and secure access control?", "idealKeywords": ["api", "contract", "schema", "validation", "security", "token", "encryption", "docket"], "followUpVague": "Could you specify the protocol, data formats, and error handling mechanisms you would establish between these components?", "followUpExpert": "What caching or eventual consistency strategy would you adopt if Docket experiences network partitions or backpressure?"}, {"id": "gen-q3", "type": "Adaptive Behavioral & Problem Solving", "prompt": "Walk me through a challenging production bug or unexpected outage you investigated in your past 1+ years of work. What was your root-cause analysis process?", "idealKeywords": ["root cause", "post-mortem", "logs", "telemetry", "tracing", "remediation", "prevention"], "followUpVague": "What specific observability tools or telemetry metrics pointed you to the root cause rather than guessing?", "followUpExpert": "What automated guardrails or alert thresholds did your team introduce afterwards to guarantee that exact failure mode never recurs?"}]	{"title": "AWS Cloud Engineer  - Core Architecture Task", "language": "javascript", "instructions": "Implement an optimized data handler validating AWS payload consistency and edge latency constraints.", "initialCode": "// Implement candidate challenge\\nfunction validatePayload(input) {\\n  if (!input) return { valid: false };\\n  return { valid: true, timestamp: Date.now() };\\n}", "testCases": [{"name": "Validates non-empty input", "input": "{ role: 'AI Eng' }", "expected": "{ valid: true }"}]}	Mid-Level	{}	1	{}	range	16.00	24.00	INR	annual	\N	\N	Active	\N	\N	\N	\N	2026-09-19 16:35:54.76104
job-e12be8	Senior Financial Controller & Tax Auditor	SparkX Technologies	org-sparkx-default	Finance & Accounting	New York, NY (Hybrid)	5	5+ years	Master of Accounting / CPA	["English"]	["GAAP", "Financial Reconciliation", "Corporate Tax", "Internal Auditing", "Variance Analysis"]	\N	Lead quarterly GAAP/IFRS balance sheet reconciliations, month-end ledger audits, variance audits, and corporate tax compliance.	[{"type": "Asynchronous Event Streaming", "prompt": "How do you design asynchronous background processing between GAAP and distributed worker queues to guarantee at-least-once message processing without data duplication?", "ideal_keywords": ["gaap", "queue", "idempotency", "ack", "worker", "retry", "dead letter queue", "event"], "follow_up_vague": "What specific idempotency keys or transaction boundaries did you establish to prevent duplicate writes?", "follow_up_expert": "If worker nodes crash midway through execution, how does your consumer group rebalance without message starvation?", "id": "q1"}, {"type": "Distributed System Architecture", "prompt": "How do you design modular communication between GAAP services and Financial Reconciliation backends while enforcing strict schema contracts and security boundaries?", "ideal_keywords": ["financial reconciliation", "api contract", "grpc", "rest", "schema", "validation", "token", "security", "isolation"], "follow_up_vague": "What serialization protocol and error retry policies did you configure between GAAP and Financial Reconciliation?", "follow_up_expert": "What eventual consistency or saga pattern did you implement when Financial Reconciliation encounters a network partition?", "id": "q2"}, {"type": "Concurrency Race Conditions & Deadlocks", "prompt": "Have you ever debugged an elusive race condition, thread deadlock, or resource leak that only appeared in production under load? How did you isolate it?", "ideal_keywords": ["race condition", "deadlock", "thread dump", "profiler", "mutex", "atomic", "heap dump", "reproduction"], "follow_up_vague": "How did you reproduce the bug in a staging environment when it only surfaced intermittently in production?", "follow_up_expert": "What defensive programming or immutable data structures did you introduce to structurally eliminate that race condition?", "id": "q3"}]	{"title": "Senior Financial Controller & Tax Auditor Practical Task", "language": "javascript", "instructions": "Implement the core data handler function.", "initialCode": "function handler(data) {\\n  return data;\\n}"}	Mid-Level	{}	1	{}	range	18.00	25.00	INR	annual	\N	\N	Active	\N	\N	\N	\N	2026-09-20 05:09:32.840179
\.


--
-- Data for Name: mcq_options; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mcq_options (id, question_id, option_key, option_text, is_correct, display_order) FROM stdin;
opt-mcq-py-gil-a	mcq-py-gil	A	It enables full parallel CPU execution across multiple physical cores using threading.Thread.	f	1
opt-mcq-py-gil-b	mcq-py-gil	B	It prevents multiple native threads from executing Python bytecode simultaneously, making threading effective for I/O-bound tasks but not CPU-bound tasks.	t	2
opt-mcq-py-gil-c	mcq-py-gil	C	It automatically converts recursive function calls into iterative loops to prevent stack overflows.	f	3
opt-mcq-py-gil-d	mcq-py-gil	D	It forces all database connections to serialize onto a single shared socket connection.	f	4
opt-mcq-py-generators-a	mcq-py-generators	A	Generators compress the data using gzip before storing it in memory.	f	1
opt-mcq-py-generators-b	mcq-py-generators	B	Generators evaluate lazily on-demand, consuming O(1) memory instead of allocating memory for all 10 million objects up-front.	t	2
opt-mcq-py-generators-c	mcq-py-generators	C	Generators bypass Python's type checking system for faster execution.	f	3
opt-mcq-py-generators-d	mcq-py-generators	D	Generators automatically distribute database rows across multiple GPU tensor cores.	f	4
opt-mcq-sql-indexing-a	mcq-sql-indexing	A	SELECT * FROM jobs WHERE company_id = 'c1' AND created_at >= '2026-01-01'	f	1
opt-mcq-sql-indexing-b	mcq-sql-indexing	B	SELECT * FROM jobs WHERE company_id = 'c1' AND status = 'Active'	f	2
opt-mcq-sql-indexing-c	mcq-sql-indexing	C	SELECT * FROM jobs WHERE created_at >= '2026-01-01' AND status = 'Active'	t	3
opt-mcq-sql-indexing-d	mcq-sql-indexing	D	SELECT * FROM jobs WHERE company_id = 'c1' AND created_at = '2026-02-01' AND status = 'Active'	f	4
opt-mcq-db-acid-a	mcq-db-acid	A	Dirty reads are prevented; non-repeatable reads and phantom reads can still occur.	t	1
opt-mcq-db-acid-b	mcq-db-acid	B	All anomalies including phantom reads are completely eliminated.	f	2
opt-mcq-db-acid-c	mcq-db-acid	C	Dirty reads and non-repeatable reads are both prevented; only serialization anomalies occur.	f	3
opt-mcq-db-acid-d	mcq-db-acid	D	No anomalies are prevented without an explicit table-level lock.	f	4
opt-mcq-react-reconciliation-a	mcq-react-reconciliation	A	React will throw an uncaught runtime syntax exception during compilation.	f	1
opt-mcq-react-reconciliation-b	mcq-react-reconciliation	B	Component internal state (like input focus or form state) will be incorrectly mapped to adjacent items, causing subtle visual and data bugs.	t	2
opt-mcq-react-reconciliation-c	mcq-react-reconciliation	C	It disables browser CSS grid rendering completely.	f	3
opt-mcq-react-reconciliation-d	mcq-react-reconciliation	D	It forces React to bypass the Virtual DOM and directly manipulate the DOM synchronously.	f	4
opt-mcq-react-hooks-a	mcq-react-hooks	A	Running React in StrictMode during development.	f	1
opt-mcq-react-hooks-b	mcq-react-hooks	B	Omitting a mutable state variable or prop from the hook's dependency array, causing the hook function to capture older values from previous render scopes.	t	2
opt-mcq-react-hooks-c	mcq-react-hooks	C	Using TypeScript interfaces instead of types.	f	3
opt-mcq-react-hooks-d	mcq-react-hooks	D	Calling setState inside an event handler instead of inside requestAnimationFrame.	f	4
opt-mcq-web-perf-a	mcq-web-perf	A	Loading all CSS stylesheets asynchronously using JavaScript eval.	f	1
opt-mcq-web-perf-b	mcq-web-perf	B	Reserving aspect-ratio bounding boxes or explicit width/height dimensions for dynamic images, video containers, and ad slots.	t	2
opt-mcq-web-perf-c	mcq-web-perf	C	Converting all SVG icons into high-resolution uncompressed BMP files.	f	3
opt-mcq-web-perf-d	mcq-web-perf	D	Rendering the entire page inside an HTML5 iframe with zero margins.	f	4
opt-mcq-api-idempotency-a	mcq-api-idempotency	A	To encrypt the request payload using AES-256 before transmission.	f	1
opt-mcq-api-idempotency-b	mcq-api-idempotency	B	To ensure that if a client retries a timed-out network request, the server executes the mutation exactly once and returns the cached result without duplicate processing.	t	2
opt-mcq-api-idempotency-c	mcq-api-idempotency	C	To authenticate the user without requiring a bearer token or session cookie.	f	3
opt-mcq-api-idempotency-d	mcq-api-idempotency	D	To force the API gateway to compress the HTTP response using brotli.	f	4
opt-mcq-aws-iam-least-privilege-a	mcq-aws-iam-least-privilege	A	Hardcode AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the Docker container environment variables.	f	1
opt-mcq-aws-iam-least-privilege-b	mcq-aws-iam-least-privilege	B	Attach an IAM Role via EC2 Instance Profile or EKS IRSA (IAM Roles for Service Accounts) to dynamically retrieve short-lived STS credentials without storing long-lived keys.	t	2
opt-mcq-aws-iam-least-privilege-c	mcq-aws-iam-least-privilege	C	Store AWS root account credentials in a plain JSON config file mounted via an NFS share.	f	3
opt-mcq-aws-iam-least-privilege-d	mcq-aws-iam-least-privilege	D	Create a shared IAM User with AdministratorAccess and distribute its credentials across git submodules.	f	4
opt-mcq-aws-vpc-architecture-a	mcq-aws-vpc-architecture	A	Attach an Internet Gateway directly to the private subnet routing table.	f	1
opt-mcq-aws-vpc-architecture-b	mcq-aws-vpc-architecture	B	Place a NAT Gateway in a public subnet with an Elastic IP, and route 0.0.0.0/0 traffic from the private subnet route table to this NAT Gateway.	t	2
opt-mcq-aws-vpc-architecture-c	mcq-aws-vpc-architecture	C	Assign public IPv4 addresses to every private backend container.	f	3
opt-mcq-aws-vpc-architecture-d	mcq-aws-vpc-architecture	D	Disable the VPC firewall and bridge all traffic onto AWS Direct Connect.	f	4
opt-mcq-docker-multistage-a	mcq-docker-multistage	A	They allow running multiple isolated Linux operating systems inside a single container instance.	f	1
opt-mcq-docker-multistage-b	mcq-docker-multistage	B	They separate the build environment (compilers, SDKs, devDependencies) from the lean runtime image, minimizing image size and attack surface.	t	2
opt-mcq-docker-multistage-c	mcq-docker-multistage	C	They automatically encrypt all HTTP traffic between Docker containers using TLS.	f	3
opt-mcq-docker-multistage-d	mcq-docker-multistage	D	They bypass Docker daemon socket permissions by executing directly in host kernel space.	f	4
opt-mcq-k8s-probes-a	mcq-k8s-probes	A	Liveness probes trigger container restarts when an unrecoverable deadlock occurs, while failed Readiness probes temporarily remove the Pod from Service endpoints without restarting it.	t	1
opt-mcq-k8s-probes-b	mcq-k8s-probes	B	Readiness probes terminate the node immediately, while Liveness probes only send an email alert.	f	2
opt-mcq-k8s-probes-c	mcq-k8s-probes	C	Liveness probes are strictly evaluated during cluster initial boot, while Readiness probes only run during shutdown.	f	3
opt-mcq-k8s-probes-d	mcq-k8s-probes	D	They are completely identical and interchangeable aliases within the Kubernetes API spec.	f	4
opt-mcq-k8s-deployments-vs-statefulsets-a	mcq-k8s-deployments-vs-statefulsets	A	StatefulSets provide stable, unique network identifiers (ordinal pod names), dedicated PersistentVolume claims per replica, and ordered graceful deployment and scaling.	t	1
opt-mcq-k8s-deployments-vs-statefulsets-b	mcq-k8s-deployments-vs-statefulsets	B	Deployments do not support CPU or memory resource limits.	f	2
opt-mcq-k8s-deployments-vs-statefulsets-c	mcq-k8s-deployments-vs-statefulsets	C	StatefulSets run exclusively on AWS bare-metal instances without requiring kubelet.	f	3
opt-mcq-k8s-deployments-vs-statefulsets-d	mcq-k8s-deployments-vs-statefulsets	D	Deployments cannot attach any storage volumes whatsoever.	f	4
opt-mcq-aws-s3-consistency-a	mcq-aws-s3-consistency	A	Eventual consistency with a mandatory 15-minute propagation delay across availability zones.	f	1
opt-mcq-aws-s3-consistency-b	mcq-aws-s3-consistency	B	Strong read-after-write consistency for PUTs and DELETEs of objects in all AWS Regions across all buckets.	t	2
opt-mcq-aws-s3-consistency-c	mcq-aws-s3-consistency	C	Read-uncommitted consistency requiring explicit conditional locks before each read.	f	3
opt-mcq-aws-s3-consistency-d	mcq-aws-s3-consistency	D	Strict linearizability across multi-cloud replication only.	f	4
opt-mcq-docker-caching-a	mcq-docker-caching	A	Because Docker cannot read source code if third-party packages are copied second.	f	1
opt-mcq-docker-caching-b	mcq-docker-caching	B	To leverage Docker's layer cache so that heavy dependency installations are skipped if package manifests have not changed, speeding up build times.	t	2
opt-mcq-docker-caching-c	mcq-docker-caching	C	To prevent source files from overwriting system kernel headers.	f	3
opt-mcq-docker-caching-d	mcq-docker-caching	D	To enable automatic git commit verification during container compilation.	f	4
opt-mcq-cloud-alb-nlb-a	mcq-cloud-alb-nlb	A	When advanced HTTP/HTTPS path-based and host-header routing rules are required.	f	1
opt-mcq-cloud-alb-nlb-b	mcq-cloud-alb-nlb	B	When ultra-low latency, extreme millions-of-requests-per-second throughput at Layer 4 (TCP/UDP), and static IP allocations are required.	t	2
opt-mcq-cloud-alb-nlb-c	mcq-cloud-alb-nlb	C	When terminating WebSocket connections with custom HTTP response headers.	f	3
opt-mcq-cloud-alb-nlb-d	mcq-cloud-alb-nlb	D	When routing traffic directly to AWS Lambda serverless functions.	f	4
opt-b594feb6	mcq-234daaa2	A	Provides cold tape backup for archived logs	f	1
opt-84005c10	mcq-234daaa2	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-fff43d9d	mcq-234daaa2	C	Executes CSS animations directly on the client GPU	f	3
opt-a356a478	mcq-234daaa2	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-aa6643d2	mcq-5b721ac4	A	Revised Answer A	f	1
opt-4178d28e	mcq-5b721ac4	B	Revised Answer B	t	2
opt-4013c46a	mcq-abb8692c	A	A	t	1
opt-a2c42715	mcq-abb8692c	B	B	f	2
opt-4fefd1ba	mcq-af0b58db	A	Correct Option	t	1
opt-663d61b7	mcq-af0b58db	B	Wrong Option	f	2
opt-0b2df68b	mcq-ba723bd5	A	Opt A	t	1
opt-428b89a9	mcq-ba723bd5	B	Opt B	f	2
opt-1e14b0cb	mcq-d9944da4	A	A	t	1
opt-864235da	mcq-d9944da4	B	B	f	2
opt-7fc60d8f	mcq-7a76622f	A	Provides cold tape backup for archived logs	f	1
opt-8bda2f0c	mcq-7a76622f	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-78fd261b	mcq-7a76622f	C	Executes CSS animations directly on the client GPU	f	3
opt-e6c20dc8	mcq-7a76622f	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-ed091ff3	mcq-9f85e02b	A	Revised Answer A	f	1
opt-786f6205	mcq-9f85e02b	B	Revised Answer B	t	2
opt-163f9af5	mcq-61a3e163	A	A	t	1
opt-9653cae2	mcq-61a3e163	B	B	f	2
opt-2d932710	mcq-1ca5079f	A	Correct Option	t	1
opt-79f12c61	mcq-1ca5079f	B	Wrong Option	f	2
opt-898eb6b1	mcq-a5b70895	A	Opt A	t	1
opt-bc4e277c	mcq-a5b70895	B	Opt B	f	2
opt-9458ffd6	mcq-d9417237	A	A	t	1
opt-b386bc9f	mcq-d9417237	B	B	f	2
opt-1d92ed54	mcq-86dd0b9c	A	Ans A	t	1
opt-19e9dc20	mcq-86dd0b9c	B	Ans B	f	2
opt-a319ebe9	mcq-50dd94d8	A	Provides cold tape backup for archived logs	f	1
opt-d6a18815	mcq-50dd94d8	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-4d42d39a	mcq-50dd94d8	C	Executes CSS animations directly on the client GPU	f	3
opt-034f17a3	mcq-50dd94d8	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-f4d7210d	mcq-f7743c17	A	Revised Answer A	f	1
opt-7d59135f	mcq-f7743c17	B	Revised Answer B	t	2
opt-d406a690	mcq-70caff71	A	A	t	1
opt-811d5232	mcq-70caff71	B	B	f	2
opt-3164a842	mcq-2dafccc2	A	Correct Option	t	1
opt-7bbe783c	mcq-2dafccc2	B	Wrong Option	f	2
opt-a4f27fd9	mcq-f21a5d73	A	Opt A	t	1
opt-b6a6c1d5	mcq-f21a5d73	B	Opt B	f	2
opt-31d95727	mcq-a85c0939	A	A	t	1
opt-e0356525	mcq-a85c0939	B	B	f	2
opt-0c1fbeb0	mcq-d86cd5c1	A	Ans A	t	1
opt-22c14883	mcq-d86cd5c1	B	Ans B	f	2
opt-b22911c0	mcq-d6d6e130	A	Provides cold tape backup for archived logs	f	1
opt-b6d387c3	mcq-d6d6e130	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-b70325e6	mcq-d6d6e130	C	Executes CSS animations directly on the client GPU	f	3
opt-4c951a83	mcq-d6d6e130	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-39d87bcb	mcq-67f225e9	A	Revised Answer A	f	1
opt-bca7957b	mcq-67f225e9	B	Revised Answer B	t	2
opt-e9ecd57f	mcq-4052033e	A	A	t	1
opt-b8ebcfae	mcq-4052033e	B	B	f	2
opt-052ac9df	mcq-d3526da7	A	Correct Option	t	1
opt-079828be	mcq-d3526da7	B	Wrong Option	f	2
opt-461e68bd	mcq-b487ed2c	A	Opt A	t	1
opt-1726a75a	mcq-b487ed2c	B	Opt B	f	2
opt-4d1a73ba	mcq-b42d2c75	A	A	t	1
opt-a1240c9d	mcq-b42d2c75	B	B	f	2
opt-0bfca45a	mcq-d068a9c4	A	Ans A	t	1
opt-559d1708	mcq-d068a9c4	B	Ans B	f	2
opt-632dd2f0	mcq-4a38fde4	A	Now Incorrect	f	1
opt-49b74009	mcq-4a38fde4	B	Now Correct	t	2
opt-d1621276	mcq-d5e204bf	A	Provides cold tape backup for archived logs	f	1
opt-dbb57b64	mcq-d5e204bf	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-77572cb1	mcq-d5e204bf	C	Executes CSS animations directly on the client GPU	f	3
opt-7288cab9	mcq-d5e204bf	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-14dac8d0	mcq-dd839107	A	Revised Answer A	f	1
opt-42bc4e93	mcq-dd839107	B	Revised Answer B	t	2
opt-9900e910	mcq-4696467b	A	A	t	1
opt-e6ce49be	mcq-4696467b	B	B	f	2
opt-713fb705	mcq-c9a3281c	A	Correct Option	t	1
opt-fe52cbd3	mcq-c9a3281c	B	Wrong Option	f	2
opt-19948e49	mcq-e5e3a317	A	Opt A	t	1
opt-ccf91fa3	mcq-e5e3a317	B	Opt B	f	2
opt-f98cfef6	mcq-8d266022	A	A	t	1
opt-d7b10f14	mcq-8d266022	B	B	f	2
opt-0fae33a9	mcq-8ab5d489	A	Ans A	t	1
opt-53a608ad	mcq-8ab5d489	B	Ans B	f	2
opt-8c197862	mcq-e79d273e	A	Now Incorrect	f	1
opt-7e09c6d9	mcq-e79d273e	B	Now Correct	t	2
opt-d2ea07cc	mcq-118a0e24	A	Provides cold tape backup for archived logs	f	1
opt-44ba755b	mcq-118a0e24	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-e843e336	mcq-118a0e24	C	Executes CSS animations directly on the client GPU	f	3
opt-48789f75	mcq-118a0e24	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-9082a6b8	mcq-ea394d19	A	Revised Answer A	f	1
opt-fc1c990c	mcq-ea394d19	B	Revised Answer B	t	2
opt-6dc5eb6b	mcq-d8ace826	A	A	t	1
opt-985a963c	mcq-d8ace826	B	B	f	2
opt-25fab032	mcq-4c3eb69f	A	Correct Option	t	1
opt-d70eeaa3	mcq-4c3eb69f	B	Wrong Option	f	2
opt-8d46b9f7	mcq-37acb184	A	Opt A	t	1
opt-5b4c4a75	mcq-37acb184	B	Opt B	f	2
opt-1d92cb16	mcq-54907cb0	A	A	t	1
opt-0c3c53c2	mcq-54907cb0	B	B	f	2
opt-f4c8524e	mcq-f03ece41	A	Ans A	t	1
opt-6430059f	mcq-f03ece41	B	Ans B	f	2
opt-6375da79	mcq-5e594f6c	A	Now Incorrect	f	1
opt-3d38e5d7	mcq-5e594f6c	B	Now Correct	t	2
opt-799cbf5b	mcq-3a9c470d	A	Provides cold tape backup for archived logs	f	1
opt-ee921b70	mcq-3a9c470d	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-5afcf478	mcq-3a9c470d	C	Executes CSS animations directly on the client GPU	f	3
opt-498c8596	mcq-3a9c470d	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-3dec9286	mcq-155d7053	A	Revised Answer A	f	1
opt-7908d60b	mcq-155d7053	B	Revised Answer B	t	2
opt-a4b15979	mcq-238628d5	A	A	t	1
opt-5f410ff3	mcq-238628d5	B	B	f	2
opt-4482630e	mcq-c2336183	A	Correct Option	t	1
opt-8e9b5f92	mcq-c2336183	B	Wrong Option	f	2
opt-d18672c1	mcq-df1b3d12	A	Opt A	t	1
opt-591330cb	mcq-df1b3d12	B	Opt B	f	2
opt-52db739a	mcq-411946dd	A	A	t	1
opt-8f0e2841	mcq-411946dd	B	B	f	2
opt-e3c1ef13	mcq-e85365e9	A	Ans A	t	1
opt-588ab13b	mcq-e85365e9	B	Ans B	f	2
opt-30ab5ceb	mcq-7f4113a1	A	Now Incorrect	f	1
opt-e93aa411	mcq-7f4113a1	B	Now Correct	t	2
opt-4340d013	mcq-f5d4f649	A	Provides cold tape backup for archived logs	f	1
opt-cf656796	mcq-f5d4f649	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-07c59fce	mcq-f5d4f649	C	Executes CSS animations directly on the client GPU	f	3
opt-9f449124	mcq-f5d4f649	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-f5110e9b	mcq-bcf3c172	A	Revised Answer A	f	1
opt-d10d851c	mcq-bcf3c172	B	Revised Answer B	t	2
opt-642eecac	mcq-a70c1aaa	A	A	t	1
opt-36817523	mcq-a70c1aaa	B	B	f	2
opt-1f1a6e4b	mcq-47b33628	A	Correct Option	t	1
opt-d25aaeb7	mcq-47b33628	B	Wrong Option	f	2
opt-be28cab4	mcq-b431394f	A	Opt A	t	1
opt-f6d02897	mcq-b431394f	B	Opt B	f	2
opt-24e9051a	mcq-d55070f1	A	A	t	1
opt-8451893e	mcq-d55070f1	B	B	f	2
opt-81b4445f	mcq-12ad3d9c	A	Ans A	t	1
opt-444e4feb	mcq-12ad3d9c	B	Ans B	f	2
opt-406fb541	mcq-25cfcd8f	A	Now Incorrect	f	1
opt-cda207a1	mcq-25cfcd8f	B	Now Correct	t	2
opt-882a5043	mcq-aa986755	A	Provides cold tape backup for archived logs	f	1
opt-67383e14	mcq-aa986755	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-a71c4557	mcq-aa986755	C	Executes CSS animations directly on the client GPU	f	3
opt-58c3d52d	mcq-aa986755	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-8274b557	mcq-a4751744	A	Revised Answer A	f	1
opt-1c9103ae	mcq-a4751744	B	Revised Answer B	t	2
opt-e8d573b4	mcq-6b7c42b3	A	A	t	1
opt-743f4921	mcq-6b7c42b3	B	B	f	2
opt-d1e3b3d0	mcq-c96e1dc9	A	Correct Option	t	1
opt-199825a9	mcq-c96e1dc9	B	Wrong Option	f	2
opt-2bc3fb2b	mcq-273b1460	A	Opt A	t	1
opt-f76d3455	mcq-273b1460	B	Opt B	f	2
opt-9f563f5f	mcq-4f077601	A	A	t	1
opt-f6436e6f	mcq-4f077601	B	B	f	2
opt-46d23a9d	mcq-977e5347	A	Ans A	t	1
opt-600f5d81	mcq-977e5347	B	Ans B	f	2
opt-5c8ec763	mcq-a3a2db61	A	Now Incorrect	f	1
opt-5b18058c	mcq-a3a2db61	B	Now Correct	t	2
opt-0aee2212	mcq-0073f9fe	A	Provides cold tape backup for archived logs	f	1
opt-bbccd158	mcq-0073f9fe	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-17861b22	mcq-0073f9fe	C	Executes CSS animations directly on the client GPU	f	3
opt-1c97594d	mcq-0073f9fe	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-e68e7ba6	mcq-31fa03a4	A	Revised Answer A	f	1
opt-272ae93f	mcq-31fa03a4	B	Revised Answer B	t	2
opt-3dbaf2a6	mcq-42ba54ff	A	A	t	1
opt-1bc17bb8	mcq-42ba54ff	B	B	f	2
opt-5cf65285	mcq-acdb867b	A	Correct Option	t	1
opt-c2a7eea1	mcq-acdb867b	B	Wrong Option	f	2
opt-526b8489	mcq-c25f78ca	A	Opt A	t	1
opt-53799178	mcq-c25f78ca	B	Opt B	f	2
opt-edbaad07	mcq-6053b96f	A	A	t	1
opt-07a121ec	mcq-6053b96f	B	B	f	2
opt-fad6dc81	mcq-4bcc8434	A	Ans A	t	1
opt-9c032e72	mcq-4bcc8434	B	Ans B	f	2
opt-b9f9b8b0	mcq-8023be9a	A	Now Incorrect	f	1
opt-2daf03b3	mcq-8023be9a	B	Now Correct	t	2
opt-b160a39d	mcq-9e54fd50	A	Provides cold tape backup for archived logs	f	1
opt-17a68d90	mcq-9e54fd50	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-ea8d485f	mcq-9e54fd50	C	Executes CSS animations directly on the client GPU	f	3
opt-e2055112	mcq-9e54fd50	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-1c8364e5	mcq-601dfb49	A	Revised Answer A	f	1
opt-66043efd	mcq-601dfb49	B	Revised Answer B	t	2
opt-4de673a6	mcq-663d5fff	A	A	t	1
opt-0f57a723	mcq-663d5fff	B	B	f	2
opt-239825bf	mcq-f0b341b3	A	Correct Option	t	1
opt-1d6e4513	mcq-f0b341b3	B	Wrong Option	f	2
opt-99f69002	mcq-d3a4b772	A	Opt A	t	1
opt-5b4f0e13	mcq-d3a4b772	B	Opt B	f	2
opt-ffedf828	mcq-cd7575db	A	A	t	1
opt-8cd57618	mcq-cd7575db	B	B	f	2
opt-cbda71d3	mcq-dfe3b50a	A	Ans A	t	1
opt-e60da087	mcq-dfe3b50a	B	Ans B	f	2
opt-633e5cfd	mcq-a37e6d7b	A	Now Incorrect	f	1
opt-c809c3cd	mcq-a37e6d7b	B	Now Correct	t	2
opt-05199420	mcq-af1f9546	A	Provides cold tape backup for archived logs	f	1
opt-c9833c3f	mcq-af1f9546	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-48bc5c0e	mcq-af1f9546	C	Executes CSS animations directly on the client GPU	f	3
opt-c02599d2	mcq-af1f9546	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-1b78bdcc	mcq-0a020ba3	A	Revised Answer A	f	1
opt-2953426d	mcq-0a020ba3	B	Revised Answer B	t	2
opt-42750b0e	mcq-b02442b4	A	A	t	1
opt-7274be81	mcq-b02442b4	B	B	f	2
opt-9c42720e	mcq-b167344d	A	Correct Option	t	1
opt-2b6b909a	mcq-b167344d	B	Wrong Option	f	2
opt-9119a0a1	mcq-1886e4ab	A	Opt A	t	1
opt-1d2040ea	mcq-1886e4ab	B	Opt B	f	2
opt-7fda6a9f	mcq-1ae026f8	A	A	t	1
opt-4e9bc7a2	mcq-1ae026f8	B	B	f	2
opt-2ad01196	mcq-abe0a779	A	Ans A	t	1
opt-27b40a7c	mcq-abe0a779	B	Ans B	f	2
opt-277807c8	mcq-146682b9	A	Now Incorrect	f	1
opt-70b1fddc	mcq-146682b9	B	Now Correct	t	2
opt-96dc2f2b	mcq-6ac9005d	A	Correct Option	t	1
opt-5a1091b9	mcq-6ac9005d	B	Wrong Option	f	2
opt-2921f484	mcq-6ff37998	A	Ans A	t	1
opt-63db9ba7	mcq-6ff37998	B	Ans B	f	2
opt-c076d148	mcq-0848750f	A	Provides cold tape backup for archived logs	f	1
opt-7349c9a2	mcq-0848750f	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-db1f8e18	mcq-0848750f	C	Executes CSS animations directly on the client GPU	f	3
opt-0428c427	mcq-0848750f	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-d66f59a3	mcq-2237604c	A	Revised Answer A	f	1
opt-5ba95f9c	mcq-2237604c	B	Revised Answer B	t	2
opt-5b87901f	mcq-db806c69	A	A	t	1
opt-1f49cabe	mcq-db806c69	B	B	f	2
opt-314f90eb	mcq-92aa16f1	A	Correct Option	t	1
opt-88a0c83e	mcq-92aa16f1	B	Wrong Option	f	2
opt-2050d1ea	mcq-e15e7499	A	Opt A	t	1
opt-f69de315	mcq-e15e7499	B	Opt B	f	2
opt-2bc9ffb9	mcq-628ea6bd	A	A	t	1
opt-e71e41be	mcq-628ea6bd	B	B	f	2
opt-96cabf0b	mcq-5da74e40	A	Ans A	t	1
opt-2de9033d	mcq-5da74e40	B	Ans B	f	2
opt-8ac88f5e	mcq-419965ff	A	Provides cold tape backup for archived logs	f	1
opt-793a1f4c	mcq-419965ff	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-290df5ba	mcq-419965ff	C	Executes CSS animations directly on the client GPU	f	3
opt-552dd857	mcq-419965ff	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-4e284a7c	mcq-8a72797b	A	Revised Answer A	f	1
opt-53e7504f	mcq-8a72797b	B	Revised Answer B	t	2
opt-d433c2b4	mcq-6376a1de	A	A	t	1
opt-f883eb93	mcq-6376a1de	B	B	f	2
opt-527b3e78	mcq-b0b33153	A	Correct Option	t	1
opt-78cafcb5	mcq-b0b33153	B	Wrong Option	f	2
opt-c784a944	mcq-32654713	A	Opt A	t	1
opt-d31a4070	mcq-32654713	B	Opt B	f	2
opt-ac0f978a	mcq-69b1f615	A	A	t	1
opt-032d634e	mcq-69b1f615	B	B	f	2
opt-d2e85f5a	mcq-4697403e	A	Ans A	t	1
opt-560408aa	mcq-4697403e	B	Ans B	f	2
opt-9d951368	mcq-1f977038	A	Correct Option	t	1
opt-c51e0c9d	mcq-1f977038	B	Wrong Option	f	2
opt-5f1f08f5	mcq-04c2d67f	A	Ans A	t	1
opt-90768e1a	mcq-04c2d67f	B	Ans B	f	2
opt-30867ebe	mcq-aabaab41	A	Provides cold tape backup for archived logs	f	1
opt-31de7af8	mcq-aabaab41	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-a8b0e09b	mcq-aabaab41	C	Executes CSS animations directly on the client GPU	f	3
opt-2baa5635	mcq-aabaab41	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-5c37e961	mcq-dc6d3b00	A	Revised Answer A	f	1
opt-e44e22f6	mcq-dc6d3b00	B	Revised Answer B	t	2
opt-856bba05	mcq-35b27c75	A	A	t	1
opt-4dd0b971	mcq-35b27c75	B	B	f	2
opt-27fc648b	mcq-6712658e	A	Correct Option	t	1
opt-52c4bb4f	mcq-6712658e	B	Wrong Option	f	2
opt-45c2b0d8	mcq-4fff68a6	A	Opt A	t	1
opt-5aa5c8d4	mcq-4fff68a6	B	Opt B	f	2
opt-32cd8d8e	mcq-ffd8d78e	A	A	t	1
opt-f44f9a90	mcq-ffd8d78e	B	B	f	2
opt-066a99ce	mcq-04cbddc1	A	Ans A	t	1
opt-fd545944	mcq-04cbddc1	B	Ans B	f	2
opt-13b94c39	mcq-34371455	A	Provides cold tape backup for archived logs	f	1
opt-9177b49a	mcq-34371455	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-c5bac9a0	mcq-34371455	C	Executes CSS animations directly on the client GPU	f	3
opt-36a601a1	mcq-34371455	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-6eb7d73f	mcq-37345934	A	Revised Answer A	f	1
opt-4f8387b7	mcq-37345934	B	Revised Answer B	t	2
opt-4e5fab2f	mcq-91ec2707	A	A	t	1
opt-e176c24d	mcq-91ec2707	B	B	f	2
opt-bec6fe1c	mcq-f67bd627	A	Correct Option	t	1
opt-8d5e7a8b	mcq-f67bd627	B	Wrong Option	f	2
opt-ee359c3d	mcq-5558088b	A	Opt A	t	1
opt-f2e9c0e7	mcq-5558088b	B	Opt B	f	2
opt-2cf43e2d	mcq-59a4dfbc	A	A	t	1
opt-7340623c	mcq-59a4dfbc	B	B	f	2
opt-46b6f1f3	mcq-7b9f04e9	A	Ans A	t	1
opt-70e55d8d	mcq-7b9f04e9	B	Ans B	f	2
opt-b44a352a	mcq-900a4470	A	Now Incorrect	f	1
opt-ea2e3c26	mcq-900a4470	B	Now Correct	t	2
opt-171d792a	mcq-4f77169d	A	Correct Option	t	1
opt-a33e9682	mcq-4f77169d	B	Wrong Option	f	2
opt-3c45d6ea	mcq-7ebb40f6	A	Ans A	t	1
opt-14b65932	mcq-7ebb40f6	B	Ans B	f	2
opt-7831a3ac	mcq-27fdfc6f	A	Correct Option	t	1
opt-49f74690	mcq-27fdfc6f	B	Wrong Option	f	2
opt-e851d97a	mcq-d0dca3d8	A	Ans A	t	1
opt-03542c2a	mcq-d0dca3d8	B	Ans B	f	2
opt-42c9d24c	mcq-ab83ebed	A	Correct Option	t	1
opt-3406b789	mcq-ab83ebed	B	Wrong Option	f	2
opt-79fca7cb	mcq-2e1cba9f	A	Ans A	t	1
opt-dfce998d	mcq-2e1cba9f	B	Ans B	f	2
opt-92b33049	mcq-4678d1bf	A	Allows multi-threaded native C extensions only	f	1
opt-1977e369	mcq-4678d1bf	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-a51cdc08	mcq-4678d1bf	C	Manages database connection pools	f	3
opt-7efa1336	mcq-d32ddca8	A	Allows multi-threaded native C extensions only	f	1
opt-828862df	mcq-d32ddca8	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-1cf8f9ce	mcq-d32ddca8	C	Manages database connection pools	f	3
opt-c59ea63c	mcq-f8904cb5	A	Allows multi-threaded native C extensions only	f	1
opt-da6983a9	mcq-f8904cb5	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-25777b40	mcq-f8904cb5	C	Manages database connection pools	f	3
opt-c7fcee10	mcq-4ff7f273	A	Using the @dependency decorator	f	1
opt-7028f021	mcq-4ff7f273	B	Using Depends() in parameter defaults	t	2
opt-0ee4b551	mcq-4ff7f273	C	Injecting via app.state exclusively	f	3
opt-13973f82	mcq-0478c961	A	Allows multi-threaded native C extensions only	f	1
opt-653cc149	mcq-0478c961	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-bb18a8a3	mcq-0478c961	C	Manages database connection pools	f	3
opt-7583cd1a	mcq-a34a6375	A	Using the @dependency decorator	f	1
opt-040b955a	mcq-a34a6375	B	Using Depends() in parameter defaults	t	2
opt-a4a47994	mcq-a34a6375	C	Injecting via app.state exclusively	f	3
opt-59a5abd9	mcq-d634a99e	A	Allows multi-threaded native C extensions only	f	1
opt-c434cfc0	mcq-d634a99e	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-3a1f343f	mcq-d634a99e	C	Manages database connection pools	f	3
opt-74536eb1	mcq-a85dc3a6	A	Using the @dependency decorator	f	1
opt-2b1b6308	mcq-a85dc3a6	B	Using Depends() in parameter defaults	t	2
opt-d44ac5d2	mcq-a85dc3a6	C	Injecting via app.state exclusively	f	3
opt-6518045c	mcq-4771ab31	A	Allows multi-threaded native C extensions only	f	1
opt-8e4b2b67	mcq-4771ab31	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-605c951e	mcq-4771ab31	C	Manages database connection pools	f	3
opt-fade7c9a	mcq-bf88ec7c	A	Using the @dependency decorator	f	1
opt-318a92ee	mcq-bf88ec7c	B	Using Depends() in parameter defaults	t	2
opt-042eff6d	mcq-bf88ec7c	C	Injecting via app.state exclusively	f	3
opt-bb5d4aa6	mcq-f5452076	A	Correct Option	t	1
opt-a565d41a	mcq-f5452076	B	Wrong Option	f	2
opt-f31d8aef	mcq-4a7ec242	A	Ans A	t	1
opt-966f45db	mcq-4a7ec242	B	Ans B	f	2
opt-ba5439e0	mcq-c5a41d43	A	Correct Option	t	1
opt-a9f174b5	mcq-c5a41d43	B	Wrong Option	f	2
opt-352cae64	mcq-f0ec8ae8	A	Ans A	t	1
opt-ddf62b82	mcq-f0ec8ae8	B	Ans B	f	2
opt-45f1c82d	mcq-96216456	A	Allows multi-threaded native C extensions only	f	1
opt-f7b3fe4b	mcq-96216456	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-d462d418	mcq-96216456	C	Manages database connection pools	f	3
opt-9188f59a	mcq-ce728134	A	Using the @dependency decorator	f	1
opt-8b574d1a	mcq-ce728134	B	Using Depends() in parameter defaults	t	2
opt-a09e5418	mcq-ce728134	C	Injecting via app.state exclusively	f	3
opt-cbc63311	mcq-6a5e24b9	A	Allows multi-threaded native C extensions only	f	1
opt-17d1603a	mcq-6a5e24b9	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-664123ae	mcq-6a5e24b9	C	Manages database connection pools	f	3
opt-45010f5c	mcq-eb0a5cd7	A	Using the @dependency decorator	f	1
opt-c71e8ea2	mcq-eb0a5cd7	B	Using Depends() in parameter defaults	t	2
opt-cd382e04	mcq-eb0a5cd7	C	Injecting via app.state exclusively	f	3
opt-bf705716	mcq-20741fe7	A	Correct Option	t	1
opt-772b5308	mcq-20741fe7	B	Wrong Option	f	2
opt-f5897c8d	mcq-3dce9ed7	A	Ans A	t	1
opt-c8499441	mcq-3dce9ed7	B	Ans B	f	2
opt-f94339c8	mcq-3ad66834	A	Allows multi-threaded native C extensions only	f	1
opt-b8eacd76	mcq-3ad66834	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-b833f4e2	mcq-3ad66834	C	Manages database connection pools	f	3
opt-6dc3915e	mcq-185961a9	A	Using the @dependency decorator	f	1
opt-a5916b29	mcq-185961a9	B	Using Depends() in parameter defaults	t	2
opt-44d9626d	mcq-185961a9	C	Injecting via app.state exclusively	f	3
opt-122d647b	mcq-1fca480e	A	Allows multi-threaded native C extensions only	f	1
opt-bc4ee924	mcq-1fca480e	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-46f4d172	mcq-1fca480e	C	Manages database connection pools	f	3
opt-a093cff0	mcq-f4ac8b0a	A	Using the @dependency decorator	f	1
opt-55f7bd7f	mcq-f4ac8b0a	B	Using Depends() in parameter defaults	t	2
opt-5c612832	mcq-f4ac8b0a	C	Injecting via app.state exclusively	f	3
opt-mcq-fin-rev-rec-a	mcq-fin-rev-rec	A	Only after the contract has been completely fulfilled and final payment is received.	f	1
opt-mcq-fin-rev-rec-b	mcq-fin-rev-rec	B	Only to the extent it is highly probable that a significant reversal in cumulative revenue recognized will not occur when the uncertainty is resolved.	t	2
opt-mcq-fin-rev-rec-c	mcq-fin-rev-rec	C	It must always be included immediately at the maximum contractually stated value regardless of uncertainty.	f	3
opt-mcq-fin-rev-rec-d	mcq-fin-rev-rec	D	It must be amortized straight-line over a mandatory 5-year statutory period.	f	4
opt-mcq-fin-lease-ifrs16-a	mcq-fin-lease-ifrs16	A	Off-balance sheet as periodic rental expense in operating expenses without any asset or liability recognition.	f	1
opt-mcq-fin-lease-ifrs16-b	mcq-fin-lease-ifrs16	B	Recognize a Right-of-Use (ROU) asset and a lease liability measured at the present value of future lease payments discounted using the incremental borrowing rate.	t	2
opt-mcq-fin-lease-ifrs16-c	mcq-fin-lease-ifrs16	C	As a contingent liability disclosed only in the footnotes until the lease reaches 50% maturity.	f	3
opt-mcq-fin-lease-ifrs16-d	mcq-fin-lease-ifrs16	D	At historical cost as fixed property, plant, and equipment with no corresponding financial liability.	f	4
opt-mcq-fin-tax-deferred-a	mcq-fin-tax-deferred	A	When accounting income is permanently higher than tax income; recognized unconditionally forever.	f	1
opt-mcq-fin-tax-deferred-b	mcq-fin-tax-deferred	B	When deductible temporary differences exist; recognized only to the extent probable that taxable profit will be available against which it can be utilized.	t	2
opt-mcq-fin-tax-deferred-c	mcq-fin-tax-deferred	C	When tax rates increase unexpectedly in foreign jurisdictions; recognized as an extraordinary gain in P&L.	f	3
opt-mcq-fin-tax-deferred-d	mcq-fin-tax-deferred	D	Only when the company is in liquidation and files an immediate tax refund claim.	f	4
opt-mcq-fin-audit-risk-a	mcq-fin-audit-risk	A	Increase Detection Risk by reducing substantive audit procedures and relying on management representations.	f	1
opt-mcq-fin-audit-risk-b	mcq-fin-audit-risk	B	Lower Detection Risk by expanding the nature, timing, and extent of substantive testing and increasing sample sizes.	t	2
opt-mcq-fin-audit-risk-c	mcq-fin-audit-risk	C	Immediately issue an adverse audit opinion without performing substantive testing.	f	3
opt-mcq-fin-audit-risk-d	mcq-fin-audit-risk	D	Double the Inherent Risk assessment to mathematically balance the equation.	f	4
opt-mcq-fin-transfer-pricing-a	mcq-fin-transfer-pricing	A	Cost-plus 0% to minimize customs duties in all jurisdictions.	f	1
opt-mcq-fin-transfer-pricing-b	mcq-fin-transfer-pricing	B	The Arm's Length Principle: transactions must be priced as if they occurred between independent, unrelated entities under comparable market circumstances.	t	2
opt-mcq-fin-transfer-pricing-c	mcq-fin-transfer-pricing	C	Total tax elimination by routing all intellectual property royalties to tax havens with zero economic substance.	f	3
opt-mcq-fin-transfer-pricing-d	mcq-fin-transfer-pricing	D	Mandatory consolidation under the parent entity's domestic tax code without local documentation.	f	4
opt-mcq-fin-sox404-weakness-a	mcq-fin-sox404-weakness	A	A significant deficiency always requires a restatement of prior period financial statements, while a material weakness does not.	f	1
opt-mcq-fin-sox404-weakness-b	mcq-fin-sox404-weakness	B	A material weakness is a deficiency, or combination thereof, such that there is a reasonable possibility that a material misstatement will not be prevented or detected on a timely basis.	t	2
opt-mcq-fin-sox404-weakness-c	mcq-fin-sox404-weakness	C	A material weakness only applies to cash fraud committed by executive officers.	f	3
opt-mcq-fin-sox404-weakness-d	mcq-fin-sox404-weakness	D	A significant deficiency is disclosed to the SEC, whereas a material weakness is handled exclusively internally by management.	f	4
opt-mcq-fin-variance-ebitda-a	mcq-fin-variance-ebitda	A	Depreciating older equipment faster than straight-line schedules.	f	1
opt-mcq-fin-variance-ebitda-b	mcq-fin-variance-ebitda	B	Decomposing the $2M shortfall into Volume Variance, Price/Mix Variance, Cost of Goods Sold (COGS) Input Cost Variance, and Operating Expense (OpEx) Variance.	t	2
opt-mcq-fin-variance-ebitda-c	mcq-fin-variance-ebitda	C	Reallocating interest expense and tax provisions from financing activities.	f	3
opt-mcq-fin-variance-ebitda-d	mcq-fin-variance-ebitda	D	Amortizing intangible assets through other comprehensive income (OCI).	f	4
opt-mcq-fin-cashflow-indirect-a	mcq-fin-cashflow-indirect	A	Both increases are added back to Net Income.	f	1
opt-mcq-fin-cashflow-indirect-b	mcq-fin-cashflow-indirect	B	Increase in Accounts Receivable is deducted (cash not collected), while increase in Accounts Payable is added back (cash payment postponed).	t	2
opt-mcq-fin-cashflow-indirect-c	mcq-fin-cashflow-indirect	C	Increase in Accounts Receivable is added, while increase in Accounts Payable is deducted.	f	3
opt-mcq-fin-cashflow-indirect-d	mcq-fin-cashflow-indirect	D	Both increases are classified under Cash Flow from Financing Activities.	f	4
opt-mcq-fin-impairment-ias36-a	mcq-fin-impairment-ias36	A	Historical cost less accumulated depreciation and replacement cost.	f	1
opt-mcq-fin-impairment-ias36-b	mcq-fin-impairment-ias36	B	Fair Value less costs of disposal, and Value in Use (discounted present value of expected future cash flows).	t	2
opt-mcq-fin-impairment-ias36-c	mcq-fin-impairment-ias36	C	Current liquidation auction value and book value of equity.	f	3
opt-mcq-fin-impairment-ias36-d	mcq-fin-impairment-ias36	D	Insurable replacement value and statutory tax depreciable base.	f	4
opt-mcq-fin-ecl-ifrs9-a	mcq-fin-ecl-ifrs9	A	Losses are only recognized when an actual legal bankruptcy or payment default has occurred (incurred loss model).	f	1
opt-mcq-fin-ecl-ifrs9-b	mcq-fin-ecl-ifrs9	B	Stage 1 recognizes 12-month ECL; Stage 2 (significant increase in credit risk) and Stage 3 (credit-impaired) recognize Lifetime ECL.	t	2
opt-mcq-fin-ecl-ifrs9-c	mcq-fin-ecl-ifrs9	C	A flat 1% general provision is deducted from all receivables regardless of individual creditworthiness.	f	3
opt-mcq-fin-ecl-ifrs9-d	mcq-fin-ecl-ifrs9	D	All credit loss evaluations are deferred until maturity of the underlying instrument.	f	4
opt-mcq-fin-working-capital-a	mcq-fin-working-capital	A	CCC = Days Sales Outstanding (DSO) - Days Inventory Outstanding (DIO) + Days Payables Outstanding (DPO); indicates longer asset freeze.	f	1
opt-mcq-fin-working-capital-b	mcq-fin-working-capital	B	CCC = Days Inventory Outstanding (DIO) + Days Sales Outstanding (DSO) - Days Payables Outstanding (DPO); a decreasing CCC indicates faster liquidity conversion and superior working capital management.	t	2
opt-mcq-fin-working-capital-c	mcq-fin-working-capital	C	CCC = Quick Ratio × Current Ratio; indicates higher debt leverage.	f	3
opt-mcq-fin-working-capital-d	mcq-fin-working-capital	D	CCC = Net Profit Margin ÷ Total Asset Turnover; indicates DuPont return on equity.	f	4
opt-mcq-fin-consolidation-nci-a	mcq-fin-consolidation-nci	A	As a current liability due within 12 months to outside minority shareholders.	f	1
opt-mcq-fin-consolidation-nci-b	mcq-fin-consolidation-nci	B	Within total equity, but presented separately from the equity of the parent company's shareholders.	t	2
opt-mcq-fin-consolidation-nci-c	mcq-fin-consolidation-nci	C	As an off-balance sheet contingent commitment disclosed only in notes.	f	3
opt-mcq-fin-consolidation-nci-d	mcq-fin-consolidation-nci	D	Deducted directly from goodwill on the asset side of the balance sheet.	f	4
opt-mcq-fin-tax-ifric23-a	mcq-fin-tax-ifric23	A	Only after the tax authority has formally initiated a criminal tax evasion prosecution.	f	1
opt-mcq-fin-tax-ifric23-b	mcq-fin-tax-ifric23	B	If the entity concludes it is NOT probable that the taxation authority will accept an uncertain tax treatment, using either the most likely amount or the expected value method.	t	2
opt-mcq-fin-tax-ifric23-c	mcq-fin-tax-ifric23	C	Whenever the effective tax rate drops below 15% globally.	f	3
opt-mcq-fin-tax-ifric23-d	mcq-fin-tax-ifric23	D	Only when the tax filing is older than 7 statutory limitation years.	f	4
opt-mcq-fin-forensic-audit-a	mcq-fin-forensic-audit	A	Days Sales Outstanding (DSO) increasing substantially while industry peers are flat, paired with uncollected receivables concentrated in the final week of the fiscal year.	t	1
opt-mcq-fin-forensic-audit-b	mcq-fin-forensic-audit	B	A decrease in administrative travel expenses following remote work policy adoption.	f	2
opt-mcq-fin-forensic-audit-c	mcq-fin-forensic-audit	C	Consistent payment of declared dividends from retained earnings.	f	3
opt-mcq-fin-forensic-audit-d	mcq-fin-forensic-audit	D	Early vendor invoice payments to capture 2/10 net 30 cash discount terms.	f	4
opt-mcq-fin-cost-breakeven-a	mcq-fin-cost-breakeven	A	$1,200,000	f	1
opt-mcq-fin-cost-breakeven-b	mcq-fin-cost-breakeven	B	$3,000,000	t	2
opt-mcq-fin-cost-breakeven-c	mcq-fin-cost-breakeven	C	$2,000,000	f	3
opt-mcq-fin-cost-breakeven-d	mcq-fin-cost-breakeven	D	$4,500,000	f	4
opt-67d53259	mcq-fb50dfd2	A	Allows multi-threaded native C extensions only	f	1
opt-90be11ca	mcq-fb50dfd2	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-b7109bff	mcq-fb50dfd2	C	Manages database connection pools	f	3
opt-33cc67a8	mcq-d900442a	A	Using the @dependency decorator	f	1
opt-9a7ee441	mcq-d900442a	B	Using Depends() in parameter defaults	t	2
opt-6cc8011c	mcq-d900442a	C	Injecting via app.state exclusively	f	3
opt-d3804eca	mcq-d3628f23	A	Allows multi-threaded native C extensions only	f	1
opt-1b044b0c	mcq-d3628f23	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-149f5df0	mcq-d3628f23	C	Manages database connection pools	f	3
opt-62a8374a	mcq-23591e07	A	Using the @dependency decorator	f	1
opt-ffb949ff	mcq-23591e07	B	Using Depends() in parameter defaults	t	2
opt-e1a13268	mcq-23591e07	C	Injecting via app.state exclusively	f	3
opt-25004355	mcq-8873b8ef	A	Allows multi-threaded native C extensions only	f	1
opt-039c4117	mcq-8873b8ef	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-db848219	mcq-8873b8ef	C	Manages database connection pools	f	3
opt-6e9e2759	mcq-468147d8	A	Using the @dependency decorator	f	1
opt-5c34bfb9	mcq-468147d8	B	Using Depends() in parameter defaults	t	2
opt-1b095914	mcq-468147d8	C	Injecting via app.state exclusively	f	3
opt-7a5df174	mcq-4ce4da17	A	Provides cold tape backup for archived logs	f	1
opt-63b7445a	mcq-4ce4da17	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-7c67d834	mcq-4ce4da17	C	Executes CSS animations directly on the client GPU	f	3
opt-c04a13d8	mcq-4ce4da17	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-2b76c52d	mcq-6b1bce6d	A	Revised Answer A	f	1
opt-00ebc347	mcq-6b1bce6d	B	Revised Answer B	t	2
opt-23fa516c	mcq-133f3795	A	A	t	1
opt-f607505a	mcq-133f3795	B	B	f	2
opt-09d3ca5b	mcq-ac29e2aa	A	Correct Option	t	1
opt-bfc3da86	mcq-ac29e2aa	B	Wrong Option	f	2
opt-b236adc0	mcq-8f319afe	A	Opt A	t	1
opt-6af9bf5b	mcq-8f319afe	B	Opt B	f	2
opt-7c5c53cd	mcq-deece213	A	A	t	1
opt-48a445da	mcq-deece213	B	B	f	2
opt-90595ed3	mcq-cfbe2b92	A	Ans A	t	1
opt-7d774d61	mcq-cfbe2b92	B	Ans B	f	2
opt-5b6e8f3f	mcq-85b27bf0	A	Now Incorrect	f	1
opt-2900c1e7	mcq-85b27bf0	B	Now Correct	t	2
opt-f0a5d9f8	mcq-4c0759ba	A	Correct Option	t	1
opt-e7976e01	mcq-4c0759ba	B	Wrong Option	f	2
opt-209703ae	mcq-ba0eb850	A	Ans A	t	1
opt-2192bf3f	mcq-ba0eb850	B	Ans B	f	2
opt-96dc6414	mcq-659280cb	A	Allows multi-threaded native C extensions only	f	1
opt-a9ab4b95	mcq-659280cb	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-1b333855	mcq-659280cb	C	Manages database connection pools	f	3
opt-8142b393	mcq-acf74f4c	A	Using the @dependency decorator	f	1
opt-78b88322	mcq-acf74f4c	B	Using Depends() in parameter defaults	t	2
opt-99584e75	mcq-acf74f4c	C	Injecting via app.state exclusively	f	3
opt-f8909bbd	mcq-aaadd92d	A	Provides cold tape backup for archived logs	f	1
opt-7f026236	mcq-aaadd92d	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-d7d2346d	mcq-aaadd92d	C	Executes CSS animations directly on the client GPU	f	3
opt-cc92c32e	mcq-aaadd92d	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-b9951a39	mcq-1119d836	A	Revised Answer A	f	1
opt-a18ddae1	mcq-1119d836	B	Revised Answer B	t	2
opt-6f74f859	mcq-8ee36a7a	A	A	t	1
opt-6c8766cb	mcq-8ee36a7a	B	B	f	2
opt-9070018d	mcq-c0c4cfe3	A	Correct Option	t	1
opt-b3332a18	mcq-c0c4cfe3	B	Wrong Option	f	2
opt-273a4703	mcq-a93cab74	A	Opt A	t	1
opt-ca1e527c	mcq-a93cab74	B	Opt B	f	2
opt-1f1d0efc	mcq-12bad280	A	A	t	1
opt-2166bbfd	mcq-12bad280	B	B	f	2
opt-4661148c	mcq-3f6148d2	A	Ans A	t	1
opt-62b127ed	mcq-3f6148d2	B	Ans B	f	2
opt-abbfc236	mcq-6a55e1f6	A	Now Incorrect	f	1
opt-42ffaea3	mcq-6a55e1f6	B	Now Correct	t	2
opt-d2b9e1ca	mcq-10de6e9d	A	Correct Option	t	1
opt-4f7c13dc	mcq-10de6e9d	B	Wrong Option	f	2
opt-d7787f4d	mcq-a65de4b8	A	Ans A	t	1
opt-f6ce685d	mcq-a65de4b8	B	Ans B	f	2
opt-7d4c05ff	mcq-4c7ce843	A	Allows multi-threaded native C extensions only	f	1
opt-634eadae	mcq-4c7ce843	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-bd644aa5	mcq-4c7ce843	C	Manages database connection pools	f	3
opt-ac4af720	mcq-c2361c2c	A	Using the @dependency decorator	f	1
opt-c960c69a	mcq-c2361c2c	B	Using Depends() in parameter defaults	t	2
opt-ec046a51	mcq-c2361c2c	C	Injecting via app.state exclusively	f	3
opt-1d94a0d3	mcq-d1a1dcaa	A	Provides cold tape backup for archived logs	f	1
opt-efc9b195	mcq-d1a1dcaa	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-219e1514	mcq-d1a1dcaa	C	Executes CSS animations directly on the client GPU	f	3
opt-68e8c1ce	mcq-d1a1dcaa	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-055d404e	mcq-2693910e	A	Revised Answer A	f	1
opt-38bc183c	mcq-2693910e	B	Revised Answer B	t	2
opt-0ef958ab	mcq-e061709e	A	A	t	1
opt-44d91442	mcq-e061709e	B	B	f	2
opt-4b72cc4a	mcq-6f0d25de	A	Correct Option	t	1
opt-07d5b890	mcq-6f0d25de	B	Wrong Option	f	2
opt-d48183fb	mcq-734aec55	A	Opt A	t	1
opt-f35f6709	mcq-734aec55	B	Opt B	f	2
opt-ca8a4cc6	mcq-c23309c6	A	A	t	1
opt-edc291e1	mcq-c23309c6	B	B	f	2
opt-4b708bb2	mcq-28821ab9	A	Ans A	t	1
opt-a8d3289a	mcq-28821ab9	B	Ans B	f	2
opt-ddffd046	mcq-64117aa4	A	Now Incorrect	f	1
opt-1469bd4f	mcq-64117aa4	B	Now Correct	t	2
opt-7e601dcf	mcq-dd461510	A	Correct Option	t	1
opt-1828a5a7	mcq-dd461510	B	Wrong Option	f	2
opt-17be91eb	mcq-b6893cbe	A	Ans A	t	1
opt-1907409b	mcq-b6893cbe	B	Ans B	f	2
opt-ead946a2	mcq-215d2dc4	A	Allows multi-threaded native C extensions only	f	1
opt-21eff75d	mcq-215d2dc4	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-0fc0e667	mcq-215d2dc4	C	Manages database connection pools	f	3
opt-ea208dc1	mcq-2d7939f8	A	Using the @dependency decorator	f	1
opt-c8cd76a6	mcq-2d7939f8	B	Using Depends() in parameter defaults	t	2
opt-31a9d1ea	mcq-2d7939f8	C	Injecting via app.state exclusively	f	3
opt-2c7a22fc	mcq-d74bc5cb	A	Provides cold tape backup for archived logs	f	1
opt-05dea38d	mcq-d74bc5cb	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-6e880cd0	mcq-d74bc5cb	C	Executes CSS animations directly on the client GPU	f	3
opt-9ee4fbbb	mcq-d74bc5cb	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-1b7861f2	mcq-b7ab0297	A	Revised Answer A	f	1
opt-641f7291	mcq-b7ab0297	B	Revised Answer B	t	2
opt-061c4b9d	mcq-23b36e1e	A	A	t	1
opt-ab317e1a	mcq-23b36e1e	B	B	f	2
opt-fed9be29	mcq-eaa4bf1c	A	Correct Option	t	1
opt-5882c7b9	mcq-eaa4bf1c	B	Wrong Option	f	2
opt-834effb4	mcq-c3b5d8ee	A	Opt A	t	1
opt-367aff81	mcq-c3b5d8ee	B	Opt B	f	2
opt-d2102179	mcq-361abb85	A	A	t	1
opt-098ad405	mcq-361abb85	B	B	f	2
opt-e2ce388c	mcq-98935e91	A	Ans A	t	1
opt-5d06e383	mcq-98935e91	B	Ans B	f	2
opt-7d218d2d	mcq-e84cf1eb	A	Now Incorrect	f	1
opt-7fd11b64	mcq-e84cf1eb	B	Now Correct	t	2
opt-49cbd3f4	mcq-2656b41d	A	Correct Option	t	1
opt-aacead00	mcq-2656b41d	B	Wrong Option	f	2
opt-3458bff2	mcq-8921a476	A	Ans A	t	1
opt-33c15be2	mcq-8921a476	B	Ans B	f	2
opt-3d5717c7	mcq-821be67d	A	Allows multi-threaded native C extensions only	f	1
opt-3bb788e1	mcq-821be67d	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-c6f9b1ad	mcq-821be67d	C	Manages database connection pools	f	3
opt-910c0adf	mcq-fe5d802b	A	Using the @dependency decorator	f	1
opt-da290a57	mcq-fe5d802b	B	Using Depends() in parameter defaults	t	2
opt-8279a0d0	mcq-fe5d802b	C	Injecting via app.state exclusively	f	3
opt-b8d97a88	mcq-f98f0c9f	A	Provides cold tape backup for archived logs	f	1
opt-ff7b5cd5	mcq-f98f0c9f	B	Sub-millisecond in-memory read/write performance with rich data structures	t	2
opt-edc83274	mcq-f98f0c9f	C	Executes CSS animations directly on the client GPU	f	3
opt-38a5b3ca	mcq-f98f0c9f	D	Compiles TypeScript into machine bytecode ahead of time	f	4
opt-94edc347	mcq-fd0129d6	A	Revised Answer A	f	1
opt-20c1bcfc	mcq-fd0129d6	B	Revised Answer B	t	2
opt-64808f0c	mcq-d3ff4c05	A	A	t	1
opt-ba34a5e4	mcq-d3ff4c05	B	B	f	2
opt-eba8b9ca	mcq-0ea044f7	A	Correct Option	t	1
opt-d0ccc77d	mcq-0ea044f7	B	Wrong Option	f	2
opt-1096271a	mcq-7179f078	A	Opt A	t	1
opt-49e2bb9e	mcq-7179f078	B	Opt B	f	2
opt-a125d7b8	mcq-05e43c85	A	A	t	1
opt-1a0cc5ba	mcq-05e43c85	B	B	f	2
opt-f63ad00c	mcq-59308555	A	Ans A	t	1
opt-34020777	mcq-59308555	B	Ans B	f	2
opt-6ad44349	mcq-307fd8c8	A	Now Incorrect	f	1
opt-b023dc7a	mcq-307fd8c8	B	Now Correct	t	2
opt-cfbd874f	mcq-9db819d7	A	Correct Option	t	1
opt-28654899	mcq-9db819d7	B	Wrong Option	f	2
opt-b86d5d0b	mcq-c1516133	A	Ans A	t	1
opt-28a9bdd3	mcq-c1516133	B	Ans B	f	2
opt-73240886	mcq-8182cfe2	A	Allows multi-threaded native C extensions only	f	1
opt-dd7f9bc2	mcq-8182cfe2	B	Ensures only one thread executes Python bytecode at a time	t	2
opt-bae65a22	mcq-8182cfe2	C	Manages database connection pools	f	3
opt-0c88ba68	mcq-fb99431e	A	Using the @dependency decorator	f	1
opt-77adf424	mcq-fb99431e	B	Using Depends() in parameter defaults	t	2
opt-8b31111b	mcq-fb99431e	C	Injecting via app.state exclusively	f	3
\.


--
-- Data for Name: mcq_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mcq_questions (id, organization_id, is_system, question_text, category, difficulty, explanation, skills, is_active, created_by, current_version, created_at, updated_at) FROM stdin;
mcq-py-gil	\N	t	In standard CPython, how does the Global Interpreter Lock (GIL) affect multithreaded performance?	technical	Mid-Level	CPython's GIL ensures thread safety by allowing only one native thread to execute Python bytecode at a time. It excels at concurrent I/O waits, while CPU-bound parallel workloads require multiprocessing or native C extensions.	["python", "backend", "concurrency", "fastapi"]	t	system	1	2026-10-04 06:58:55.823561	2026-10-04 06:58:55.823564
mcq-py-generators	\N	t	Why is using a generator expression or 'yield' preferred over list comprehensions when streaming 10 million database rows?	technical	Mid-Level	Generators produce items one at a time on-demand via the iterator protocol, maintaining minimal memory overhead (O(1)) rather than allocating space for the entire collection.	["python", "backend", "performance"]	t	system	1	2026-10-04 06:58:55.827228	2026-10-04 06:58:55.827231
mcq-sql-indexing	\N	t	Given a composite B-Tree index on (company_id, created_at, status), which of the following queries CANNOT efficiently utilize this index?	technical	Mid-Level	B-Tree composite indexes follow the leftmost prefix rule. A query filtering only on created_at and status without specifying the leading column (company_id) cannot use the composite index efficiently.	["sql", "database", "postgresql", "backend"]	t	system	1	2026-10-04 06:58:55.828981	2026-10-04 06:58:55.828983
mcq-db-acid	\N	t	Under PostgreSQL's default READ COMMITTED transaction isolation level, which phenomenon is prevented, and which can still occur?	technical	Senior	READ COMMITTED guarantees that any data read was committed prior to the query start (no dirty reads). However, concurrent commits can cause subsequent SELECTs in the same transaction to see newly committed rows (non-repeatable or phantom reads).	["sql", "database", "system design", "backend"]	t	system	1	2026-10-04 06:58:55.82977	2026-10-04 06:58:55.829772
mcq-react-reconciliation	\N	t	What is the primary danger of using array indices as 'key' props in dynamic React lists that support reordering or item deletion?	technical	Mid-Level	React's reconciliation algorithm uses 'key' to identify which items have changed, been added, or removed. Index keys mutate when items are inserted or deleted, causing React to associate existing subtrees and local state with the wrong data item.	["react", "frontend", "javascript", "typescript"]	t	system	1	2026-10-04 06:58:55.830517	2026-10-04 06:58:55.830519
mcq-react-hooks	\N	t	In React 18, what causes a 'stale closure' inside a useEffect or useCallback hook?	technical	Mid-Level	JavaScript closures capture variable references from the scope in which they were created. If dependencies aren't declared, the callback retains the variables from the initial render and never sees updated values.	["react", "frontend", "javascript", "typescript"]	t	system	1	2026-10-04 06:58:55.831296	2026-10-04 06:58:55.831297
mcq-web-perf	\N	t	Which of the following practices most effectively reduces Cumulative Layout Shift (CLS) on a rich dashboard?	technical	Mid-Level	CLS measures unexpected layout shifts. Reserving exact dimensions or aspect ratios ensures the browser reserves the layout geometry before assets or asynchronous streams finish loading.	["react", "frontend", "performance", "javascript"]	t	system	1	2026-10-04 06:58:55.832215	2026-10-04 06:58:55.832217
mcq-api-idempotency	\N	t	In financial or recruitment payment APIs, what is the purpose of an 'Idempotency-Key' HTTP header in POST requests?	technical	Mid-Level	An idempotency key allows clients to safely retry requests without fear of accidentally processing the same operation twice (e.g. charging a card or submitting double applications).	["api", "system design", "backend", "cloud"]	t	system	1	2026-10-04 06:58:55.833344	2026-10-04 06:58:55.833353
mcq-aws-iam-least-privilege	\N	t	When running containerized microservices on AWS (e.g. on EC2 or EKS), what is the AWS best practice for granting temporary permissions to access S3 or DynamoDB?	technical	Mid-Level	IAM Roles for Service Accounts (IRSA) and Instance Profiles use the AWS Security Token Service (STS) to issue temporary, rotating credentials, eliminating the high security risk of static long-lived access keys.	["aws", "cloud", "iam", "security", "devops"]	t	system	1	2026-10-04 06:58:55.834613	2026-10-04 06:58:55.834615
mcq-aws-vpc-architecture	\N	t	In a production AWS VPC design, how should private backend microservices initiate outbound connections to external APIs while remaining unreachable from the public internet?	technical	Mid-Level	A NAT Gateway residing in a public subnet translates outbound traffic from private instances to its Elastic IP, allowing private workloads to pull updates or reach external APIs without accepting inbound internet connections.	["aws", "cloud", "networking", "vpc", "security"]	t	system	1	2026-10-04 06:58:55.835604	2026-10-04 06:58:55.835606
mcq-docker-multistage	\N	t	Why are Docker multi-stage builds considered essential for deploying production container images?	technical	Mid-Level	Multi-stage builds leave behind compilers, header files, and build tools in temporary intermediate stages, copying only the compiled artifacts into a minimal runtime image (e.g. Alpine or Distroless).	["docker", "docket", "containers", "devops", "cloud"]	t	system	1	2026-10-04 06:58:55.836375	2026-10-04 06:58:55.836377
mcq-k8s-probes	\N	t	What is the critical distinction between a Kubernetes 'Liveness Probe' and a 'Readiness Probe'?	technical	Senior	Liveness probes detect deadlocks or fatal crashes and restart the container. Readiness probes detect whether the pod is ready to accept incoming network traffic, gracefully isolating overloaded or warming pods.	["kubernetes", "k8s", "cloud", "devops", "containers"]	t	system	1	2026-10-04 06:58:55.837174	2026-10-04 06:58:55.837176
mcq-k8s-deployments-vs-statefulsets	\N	t	When deploying a stateful clustered workload (like Kafka, Elasticsearch, or PostgreSQL) on Kubernetes, why is a StatefulSet preferred over a standard Deployment?	technical	Senior	StatefulSets maintain sticky identity for each pod (pod-0, pod-1) and bind dedicated persistent storage volumes that persist across rescheduling, essential for distributed stateful systems.	["kubernetes", "k8s", "cloud", "database", "devops"]	t	system	1	2026-10-04 06:58:55.837933	2026-10-04 06:58:55.837934
mcq-aws-s3-consistency	\N	t	What consistency model does Amazon S3 guarantee for PUT and DELETE requests of new and existing objects?	technical	Mid-Level	Amazon S3 provides strong read-after-write consistency for PUTs and DELETEs of objects in all AWS regions automatically, without changes to performance or availability.	["aws", "cloud", "storage", "s3", "system design"]	t	system	1	2026-10-04 06:58:55.838667	2026-10-04 06:58:55.838669
mcq-docker-caching	\N	t	In a Dockerfile, why is it best practice to copy dependency manifest files (like package.json or requirements.txt) and run dependency installation BEFORE copying the rest of the application source code?	technical	Mid-Level	Docker caches each build layer. Placing infrequently changing files (dependency manifests) before frequently changing files (source code) avoids invalidating the cache on every code change.	["docker", "docket", "devops", "ci/cd", "containers"]	t	system	1	2026-10-04 06:58:55.839424	2026-10-04 06:58:55.839426
mcq-cloud-alb-nlb	\N	t	When architecting traffic routing on AWS, under which scenario should an engineer choose a Network Load Balancer (NLB) over an Application Load Balancer (ALB)?	technical	Senior	NLB operates at the transport layer (Layer 4) for extreme throughput, sub-millisecond latencies, and provides static Anycast IP addresses, whereas ALB operates at Layer 7 (HTTP/HTTPS).	["aws", "cloud", "networking", "devops", "system design"]	t	system	1	2026-10-04 06:58:55.840182	2026-10-04 06:58:55.840183
mcq-1ae026f8	org-mcq-a-5ec1de	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-748bb2	1	2026-10-05 03:25:20.458436	2026-10-05 03:25:20.458444
mcq-234daaa2	org-mcq-a-06cca4	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-8a9632	1	2026-10-04 07:04:47.650293	2026-10-04 07:04:47.650295
mcq-5b721ac4	org-mcq-a-0425b8	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-4e1b22	2	2026-10-04 07:04:47.701741	2026-10-04 07:04:47.713976
mcq-abb8692c	org-mcq-a-bdae06	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-4d5330	1	2026-10-04 07:04:47.745444	2026-10-04 07:04:47.756696
mcq-af0b58db	org-mcq-a-3e9df3	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-c55448	1	2026-10-04 07:04:47.832177	2026-10-04 07:04:47.832179
mcq-ba723bd5	org-mcq-a-6849a2	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-ed0787	1	2026-10-04 07:04:47.911236	2026-10-04 07:04:47.911238
mcq-d9944da4	org-mcq-a-5e6122	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-00a5cd	1	2026-10-04 07:04:47.983784	2026-10-04 07:04:47.983786
mcq-7a76622f	org-mcq-a-adcd52	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-9f7ac1	1	2026-10-04 07:05:23.317186	2026-10-04 07:05:23.317189
mcq-9f85e02b	org-mcq-a-1bfb99	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-c3e6c8	2	2026-10-04 07:05:23.363784	2026-10-04 07:05:23.376165
mcq-61a3e163	org-mcq-a-2ae21b	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-190d26	1	2026-10-04 07:05:23.400579	2026-10-04 07:05:23.410062
mcq-1ca5079f	org-mcq-a-6cc864	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-1979e1	1	2026-10-04 07:05:23.500738	2026-10-04 07:05:23.500742
mcq-a5b70895	org-mcq-a-01fafa	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-084ed3	1	2026-10-04 07:05:23.610373	2026-10-04 07:05:23.610376
mcq-d9417237	org-mcq-a-d74ffb	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-4631a0	1	2026-10-04 07:05:23.743267	2026-10-04 07:05:23.743271
mcq-86dd0b9c	org-mcq-a-4c5db1	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-0774e6	1	2026-10-04 07:05:23.795771	2026-10-04 07:05:23.795774
mcq-50dd94d8	org-mcq-a-87cfef	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-6dbebd	1	2026-10-04 07:05:56.362097	2026-10-04 07:05:56.362099
mcq-f7743c17	org-mcq-a-267ec8	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-122ea0	2	2026-10-04 07:05:56.409354	2026-10-04 07:05:56.422229
mcq-70caff71	org-mcq-a-67a073	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-1eba56	1	2026-10-04 07:05:56.447241	2026-10-04 07:05:56.456736
mcq-2dafccc2	org-mcq-a-b22179	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-9b3dc4	1	2026-10-04 07:05:56.573049	2026-10-04 07:05:56.573053
mcq-f21a5d73	org-mcq-a-78c984	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-eb6c4c	1	2026-10-04 07:05:56.645937	2026-10-04 07:05:56.64594
mcq-a85c0939	org-mcq-a-8554e5	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-6f24f8	1	2026-10-04 07:05:56.715195	2026-10-04 07:05:56.715198
mcq-d86cd5c1	org-mcq-a-a1f55c	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-26dba3	1	2026-10-04 07:05:56.772881	2026-10-04 07:05:56.772884
mcq-d6d6e130	org-mcq-a-592d3b	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-b74743	1	2026-10-04 07:07:09.124775	2026-10-04 07:07:09.124777
mcq-67f225e9	org-mcq-a-602215	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-101029	2	2026-10-04 07:07:09.174744	2026-10-04 07:07:09.186729
mcq-4052033e	org-mcq-a-f7f6af	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-74f2be	1	2026-10-04 07:07:09.212728	2026-10-04 07:07:09.222275
mcq-d3526da7	org-mcq-a-44813c	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-73afe2	1	2026-10-04 07:07:09.26204	2026-10-04 07:07:09.262046
mcq-b487ed2c	org-mcq-a-5bfac4	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-39409c	1	2026-10-04 07:07:09.327313	2026-10-04 07:07:09.327316
mcq-b42d2c75	org-mcq-a-9df7f0	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-1dc441	1	2026-10-04 07:07:09.405927	2026-10-04 07:07:09.405929
mcq-d068a9c4	org-mcq-a-c22344	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-686fcf	1	2026-10-04 07:07:09.457538	2026-10-04 07:07:09.457541
mcq-4a38fde4	org-mcq-a-db7641	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-c223d3	2	2026-10-04 07:07:16.299598	2026-10-04 07:07:18.975981
mcq-d5e204bf	org-mcq-a-281370	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-1b993e	1	2026-10-04 07:07:40.308649	2026-10-04 07:07:40.308652
mcq-dd839107	org-mcq-a-a37d9b	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-c57f71	2	2026-10-04 07:07:40.360208	2026-10-04 07:07:40.371995
mcq-4696467b	org-mcq-a-759efb	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-50e3f5	1	2026-10-04 07:07:40.399167	2026-10-04 07:07:40.410766
mcq-c9a3281c	org-mcq-a-da443c	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-19df07	1	2026-10-04 07:07:40.467066	2026-10-04 07:07:40.467069
mcq-e5e3a317	org-mcq-a-9482c7	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-cb3b42	1	2026-10-04 07:07:40.550149	2026-10-04 07:07:40.550153
mcq-8d266022	org-mcq-a-270102	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-708cad	1	2026-10-04 07:07:40.608392	2026-10-04 07:07:40.608395
mcq-8ab5d489	org-mcq-a-9fa22b	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-c011a4	1	2026-10-04 07:07:40.657758	2026-10-04 07:07:40.657761
mcq-e79d273e	org-mcq-a-e552fa	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-bf6aef	2	2026-10-04 07:07:48.155658	2026-10-04 07:07:50.900078
mcq-118a0e24	org-mcq-a-2ca95c	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-7642f7	1	2026-10-04 07:10:40.295476	2026-10-04 07:10:40.295479
mcq-ea394d19	org-mcq-a-0ddbb1	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-40fb06	2	2026-10-04 07:10:40.34265	2026-10-04 07:10:40.354732
mcq-d8ace826	org-mcq-a-306b54	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-caadb2	1	2026-10-04 07:10:40.388276	2026-10-04 07:10:40.398304
mcq-4c3eb69f	org-mcq-a-7f6c37	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-502a58	1	2026-10-04 07:10:40.441451	2026-10-04 07:10:40.441453
mcq-37acb184	org-mcq-a-3d7059	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-6e7868	1	2026-10-04 07:10:40.501017	2026-10-04 07:10:40.501019
mcq-54907cb0	org-mcq-a-62e3f0	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-5328bf	1	2026-10-04 07:10:40.555791	2026-10-04 07:10:40.555794
mcq-f03ece41	org-mcq-a-422526	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-c5f452	1	2026-10-04 07:10:40.621932	2026-10-04 07:10:40.621935
mcq-5e594f6c	org-mcq-a-47f5b9	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-3ace97	2	2026-10-04 07:10:47.513442	2026-10-04 07:10:49.852694
mcq-3a9c470d	org-mcq-a-cde2c5	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-702807	1	2026-10-04 07:44:05.282194	2026-10-04 07:44:05.282198
mcq-155d7053	org-mcq-a-3e081e	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-698a7c	2	2026-10-04 07:44:05.387008	2026-10-04 07:44:05.408096
mcq-238628d5	org-mcq-a-741cbe	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-179857	1	2026-10-04 07:44:05.467263	2026-10-04 07:44:05.483929
mcq-c2336183	org-mcq-a-ea2afa	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-b2d67e	1	2026-10-04 07:44:05.572427	2026-10-04 07:44:05.572433
mcq-df1b3d12	org-mcq-a-73c06e	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-11eff3	1	2026-10-04 07:44:05.714038	2026-10-04 07:44:05.714045
mcq-411946dd	org-mcq-a-6b6d25	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-c7f71b	1	2026-10-04 07:44:05.84073	2026-10-04 07:44:05.840738
mcq-e85365e9	org-mcq-a-2680fa	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-8c8de3	1	2026-10-04 07:44:05.999019	2026-10-04 07:44:05.999029
mcq-7f4113a1	org-mcq-a-bb2cec	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-3a06a9	2	2026-10-04 07:44:12.879425	2026-10-04 07:44:15.086084
mcq-f5d4f649	org-mcq-a-b0c2a3	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-355b4f	1	2026-10-04 08:13:26.069524	2026-10-04 08:13:26.069532
mcq-bcf3c172	org-mcq-a-aa4284	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-b7872e	2	2026-10-04 08:13:26.290972	2026-10-04 08:13:26.336984
mcq-a70c1aaa	org-mcq-a-a945a6	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-661d71	1	2026-10-04 08:13:26.440672	2026-10-04 08:13:26.461168
mcq-47b33628	org-mcq-a-aab557	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-8a11a4	1	2026-10-04 08:13:26.571616	2026-10-04 08:13:26.57162
mcq-b431394f	org-mcq-a-5b5486	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-9114ec	1	2026-10-04 08:13:26.721524	2026-10-04 08:13:26.721527
mcq-d55070f1	org-mcq-a-7b8ad8	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-d1b003	1	2026-10-04 08:13:26.899753	2026-10-04 08:13:26.899758
mcq-12ad3d9c	org-mcq-a-547ec4	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-8a624f	1	2026-10-04 08:13:27.164809	2026-10-04 08:13:27.164816
mcq-25cfcd8f	org-mcq-a-4899d5	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-1a299f	2	2026-10-04 08:13:34.571137	2026-10-04 08:13:37.132434
mcq-aa986755	org-mcq-a-cb35e1	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-47e313	1	2026-10-04 08:16:15.928506	2026-10-04 08:16:15.928511
mcq-a4751744	org-mcq-a-d3a2c0	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-eec91d	2	2026-10-04 08:16:16.183974	2026-10-04 08:16:16.210372
mcq-6b7c42b3	org-mcq-a-99cb15	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-482f97	1	2026-10-04 08:16:16.328761	2026-10-04 08:16:16.394129
mcq-c96e1dc9	org-mcq-a-e5692b	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-9480f0	1	2026-10-04 08:16:16.495904	2026-10-04 08:16:16.495908
mcq-273b1460	org-mcq-a-f41166	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-be2f29	1	2026-10-04 08:16:16.670502	2026-10-04 08:16:16.670506
mcq-4f077601	org-mcq-a-d47cf2	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-be6884	1	2026-10-04 08:16:16.856505	2026-10-04 08:16:16.856514
mcq-977e5347	org-mcq-a-a5ccaa	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-6bb82d	1	2026-10-04 08:16:17.001621	2026-10-04 08:16:17.001625
mcq-a3a2db61	org-mcq-a-998b82	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-8ce3f7	2	2026-10-04 08:16:24.430529	2026-10-04 08:16:26.810668
mcq-0073f9fe	org-mcq-a-8ae5d7	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-a1407a	1	2026-10-04 08:23:52.082733	2026-10-04 08:23:52.082738
mcq-31fa03a4	org-mcq-a-831875	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-96b089	2	2026-10-04 08:23:52.528468	2026-10-04 08:23:52.580144
mcq-42ba54ff	org-mcq-a-b5de54	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-2cfad2	1	2026-10-04 08:23:52.721067	2026-10-04 08:23:52.809999
mcq-acdb867b	org-mcq-a-9394b9	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-b4ffbd	1	2026-10-04 08:23:53.115279	2026-10-04 08:23:53.115294
mcq-c25f78ca	org-mcq-a-056f2c	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-771c1e	1	2026-10-04 08:23:53.608919	2026-10-04 08:23:53.608931
mcq-6053b96f	org-mcq-a-a8456e	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-90d382	1	2026-10-04 08:23:53.983092	2026-10-04 08:23:53.983108
mcq-4bcc8434	org-mcq-a-1d69eb	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-1ac5ec	1	2026-10-04 08:23:54.405952	2026-10-04 08:23:54.405969
mcq-8023be9a	org-mcq-a-5fcd46	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-0b5ac7	2	2026-10-04 08:24:04.271713	2026-10-04 08:24:06.865178
mcq-9e54fd50	org-mcq-a-037279	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-1964a8	1	2026-10-04 15:10:59.3034	2026-10-04 15:10:59.303408
mcq-601dfb49	org-mcq-a-596bb5	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-0c763a	2	2026-10-04 15:10:59.451591	2026-10-04 15:10:59.491302
mcq-663d5fff	org-mcq-a-b216b2	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-c61f9a	1	2026-10-04 15:10:59.608197	2026-10-04 15:10:59.630648
mcq-f0b341b3	org-mcq-a-42ae40	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-c48f14	1	2026-10-04 15:10:59.744572	2026-10-04 15:10:59.744577
mcq-d3a4b772	org-mcq-a-e0f892	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-d4a369	1	2026-10-04 15:10:59.973677	2026-10-04 15:10:59.973685
mcq-cd7575db	org-mcq-a-c3ad6f	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-34c8ed	1	2026-10-04 15:11:00.203802	2026-10-04 15:11:00.203809
mcq-dfe3b50a	org-mcq-a-1206b0	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-631c37	1	2026-10-04 15:11:00.502156	2026-10-04 15:11:00.502164
mcq-a37e6d7b	org-mcq-a-89480d	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-c48297	2	2026-10-04 15:11:08.015364	2026-10-04 15:11:10.460428
mcq-af1f9546	org-mcq-a-59eedf	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-55eb0d	1	2026-10-05 03:25:19.709629	2026-10-05 03:25:19.709652
mcq-0a020ba3	org-mcq-a-70e26e	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-3f49a0	2	2026-10-05 03:25:19.880081	2026-10-05 03:25:19.914494
mcq-b02442b4	org-mcq-a-b6fdc6	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-727fff	1	2026-10-05 03:25:19.990529	2026-10-05 03:25:20.019754
mcq-b167344d	org-mcq-a-31a5f5	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-fa374b	1	2026-10-05 03:25:20.135895	2026-10-05 03:25:20.135909
mcq-1886e4ab	org-mcq-a-fd382d	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-0447ab	1	2026-10-05 03:25:20.302246	2026-10-05 03:25:20.302254
mcq-abe0a779	org-mcq-a-e477b4	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-a058e8	1	2026-10-05 03:25:20.625428	2026-10-05 03:25:20.62544
mcq-146682b9	org-mcq-a-519975	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-f240db	2	2026-10-05 03:25:28.417004	2026-10-05 03:25:32.321538
mcq-6ac9005d	org-mcq-a-4a1363	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-67af08	1	2026-10-05 04:08:05.296598	2026-10-05 04:08:05.296603
mcq-6ff37998	org-mcq-a-6cd722	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-ac22b3	1	2026-10-05 04:08:05.393555	2026-10-05 04:08:05.393559
mcq-0848750f	org-mcq-a-1561b7	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-4c0179	1	2026-10-05 04:39:19.101853	2026-10-05 04:39:19.101856
mcq-2237604c	org-mcq-a-2516cb	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-ba563b	2	2026-10-05 04:39:19.185308	2026-10-05 04:39:19.20256
mcq-db806c69	org-mcq-a-b3ae31	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-6494a2	1	2026-10-05 04:39:19.238745	2026-10-05 04:39:19.252168
mcq-92aa16f1	org-mcq-a-8697d4	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-6a29f7	1	2026-10-05 04:39:19.309594	2026-10-05 04:39:19.309597
mcq-e15e7499	org-mcq-a-3c659c	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-082e77	1	2026-10-05 04:39:19.379235	2026-10-05 04:39:19.37924
mcq-628ea6bd	org-mcq-a-4cd6c8	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-932040	1	2026-10-05 04:39:19.442648	2026-10-05 04:39:19.44265
mcq-5da74e40	org-mcq-a-c6e885	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-22c5f0	1	2026-10-05 04:39:19.492924	2026-10-05 04:39:19.492926
mcq-419965ff	org-mcq-a-be0104	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-eb6b9c	1	2026-10-05 04:40:05.590913	2026-10-05 04:40:05.590917
mcq-8a72797b	org-mcq-a-04edb7	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-22e6af	2	2026-10-05 04:40:05.645165	2026-10-05 04:40:05.657881
mcq-6376a1de	org-mcq-a-716223	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-f93046	1	2026-10-05 04:40:05.689016	2026-10-05 04:40:05.700397
mcq-b0b33153	org-mcq-a-868771	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-a38717	1	2026-10-05 04:40:05.744453	2026-10-05 04:40:05.744456
mcq-32654713	org-mcq-a-d38d44	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-51a7a2	1	2026-10-05 04:40:05.801456	2026-10-05 04:40:05.80146
mcq-69b1f615	org-mcq-a-905806	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-400343	1	2026-10-05 04:40:05.857631	2026-10-05 04:40:05.857635
mcq-4697403e	org-mcq-a-081bb5	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-fad586	1	2026-10-05 04:40:05.920606	2026-10-05 04:40:05.92061
mcq-1f977038	org-mcq-a-26940a	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-5fb21c	1	2026-10-05 04:56:33.581613	2026-10-05 04:56:33.58162
mcq-04c2d67f	org-mcq-a-472294	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-8ca429	1	2026-10-05 04:56:33.827596	2026-10-05 04:56:33.827603
mcq-aabaab41	org-mcq-a-63c5e1	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-f6e689	1	2026-10-05 04:56:47.327866	2026-10-05 04:56:47.327871
mcq-dc6d3b00	org-mcq-a-b522c8	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-ca7471	2	2026-10-05 04:56:47.388466	2026-10-05 04:56:47.402137
mcq-35b27c75	org-mcq-a-00e036	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-88d5dc	1	2026-10-05 04:56:47.426519	2026-10-05 04:56:47.434827
mcq-6712658e	org-mcq-a-91b7a4	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-aa43a6	1	2026-10-05 04:56:47.473601	2026-10-05 04:56:47.473604
mcq-4fff68a6	org-mcq-a-11c7b3	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-4f282a	1	2026-10-05 04:56:47.588107	2026-10-05 04:56:47.588109
mcq-ffd8d78e	org-mcq-a-9a5932	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-cc2ae8	1	2026-10-05 04:56:47.632757	2026-10-05 04:56:47.63276
mcq-04cbddc1	org-mcq-a-1aa904	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-dd38fc	1	2026-10-05 04:56:47.685348	2026-10-05 04:56:47.68535
mcq-34371455	org-mcq-a-981206	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-9d0053	1	2026-10-05 04:58:40.698801	2026-10-05 04:58:40.698804
mcq-37345934	org-mcq-a-9827c9	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-d13788	2	2026-10-05 04:58:40.753628	2026-10-05 04:58:40.764074
mcq-91ec2707	org-mcq-a-8cfc68	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-74375d	1	2026-10-05 04:58:40.793121	2026-10-05 04:58:40.802921
mcq-f67bd627	org-mcq-a-c4d153	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-270944	1	2026-10-05 04:58:40.841061	2026-10-05 04:58:40.841063
mcq-5558088b	org-mcq-a-cc471b	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-7c9307	1	2026-10-05 04:58:40.89714	2026-10-05 04:58:40.897142
mcq-59a4dfbc	org-mcq-a-f58728	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-0651ce	1	2026-10-05 04:58:40.943677	2026-10-05 04:58:40.943679
mcq-7b9f04e9	org-mcq-a-1f648c	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-1fe5d7	1	2026-10-05 04:58:40.99509	2026-10-05 04:58:40.995092
mcq-900a4470	org-mcq-a-dca6a9	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-169780	2	2026-10-05 04:58:47.473728	2026-10-05 04:58:50.578727
mcq-4f77169d	org-mcq-a-ba4fa4	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-6bfb47	1	2026-10-06 03:29:14.295904	2026-10-06 03:29:14.295913
mcq-7ebb40f6	org-mcq-a-037cec	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-09e1ef	1	2026-10-06 03:29:14.544409	2026-10-06 03:29:14.544415
mcq-27fdfc6f	org-mcq-a-fcc0ce	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-62a8fa	1	2026-10-06 03:45:12.082502	2026-10-06 03:45:12.082512
mcq-d0dca3d8	org-mcq-a-a76295	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-8745b4	1	2026-10-06 03:45:12.234479	2026-10-06 03:45:12.234488
mcq-ab83ebed	org-mcq-a-883a1e	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-35bbb0	1	2026-10-06 05:31:43.638725	2026-10-06 05:31:43.638733
mcq-2e1cba9f	org-mcq-a-f210b5	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-afb55e	1	2026-10-06 05:31:43.842348	2026-10-06 05:31:43.84236
mcq-4678d1bf	org-bld-b6c7db09	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 14:07:50.598299	2026-10-06 14:07:50.598303
mcq-d32ddca8	org-bld-13a6f09e	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 14:08:49.149136	2026-10-06 14:08:49.149144
mcq-f8904cb5	org-bld-836fe916	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 14:09:46.734794	2026-10-06 14:09:46.734796
mcq-4ff7f273	org-bld-836fe916	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-3d81e05b	1	2026-10-06 14:09:46.944905	2026-10-06 14:09:46.944908
mcq-0478c961	org-bld-c1c76e87	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 14:10:12.740419	2026-10-06 14:10:12.740422
mcq-a34a6375	org-bld-c1c76e87	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-0e777201	1	2026-10-06 14:10:13.03929	2026-10-06 14:10:13.039293
mcq-d634a99e	org-bld-d6cba057	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 15:41:01.867179	2026-10-06 15:41:01.867182
mcq-a85dc3a6	org-bld-d6cba057	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-823f92ea	1	2026-10-06 15:41:02.131425	2026-10-06 15:41:02.131428
mcq-4771ab31	org-bld-216eb2c0	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 15:42:04.969585	2026-10-06 15:42:04.969589
mcq-bf88ec7c	org-bld-216eb2c0	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-20a3b886	1	2026-10-06 15:42:05.251372	2026-10-06 15:42:05.251384
mcq-f5452076	org-mcq-a-1c081b	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-6a7b99	1	2026-10-06 15:42:59.600284	2026-10-06 15:42:59.600288
mcq-4a7ec242	org-mcq-a-51a641	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-38e879	1	2026-10-06 15:42:59.707781	2026-10-06 15:42:59.707785
mcq-c5a41d43	org-mcq-a-84e28c	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-bf2b3b	1	2026-10-06 15:45:13.987273	2026-10-06 15:45:13.987276
mcq-f0ec8ae8	org-mcq-a-b6342a	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-1ca31f	1	2026-10-06 15:45:14.084269	2026-10-06 15:45:14.084272
mcq-96216456	org-bld-db73aa25	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 15:45:28.340602	2026-10-06 15:45:28.340608
mcq-ce728134	org-bld-db73aa25	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-3b4dc790	1	2026-10-06 15:45:28.725528	2026-10-06 15:45:28.725534
mcq-6a5e24b9	org-bld-bb3d5555	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 15:53:33.889028	2026-10-06 15:53:33.889031
mcq-eb0a5cd7	org-bld-bb3d5555	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-7c4b8719	1	2026-10-06 15:53:34.220234	2026-10-06 15:53:34.220238
mcq-20741fe7	org-mcq-a-d08272	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-24167b	1	2026-10-06 15:54:24.215961	2026-10-06 15:54:24.215964
mcq-3dce9ed7	org-mcq-a-743062	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-0b7af7	1	2026-10-06 15:54:24.340626	2026-10-06 15:54:24.340629
mcq-3ad66834	org-bld-80f25fe3	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 16:08:11.382238	2026-10-06 16:08:11.382249
mcq-185961a9	org-bld-80f25fe3	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-55c1abc9	1	2026-10-06 16:08:12.120671	2026-10-06 16:08:12.120684
mcq-1fca480e	org-bld-309d750e	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 16:26:30.228191	2026-10-06 16:26:30.228199
mcq-f4ac8b0a	org-bld-309d750e	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-6c799320	1	2026-10-06 16:26:30.712228	2026-10-06 16:26:30.712233
mcq-fin-rev-rec	\N	t	Under IFRS 15 / ASC 606 (Revenue from Contracts with Customers), when must variable consideration (such as performance bonuses or volume discounts) be included in the transaction price?	finance	Senior	IFRS 15 paragraph 56 sets the constraint on variable consideration: it is included in transaction price only if it is highly probable that a significant reversal will not occur once uncertainty resolves.	["finance", "accounting", "ifrs", "gaap", "revenue recognition", "financial reporting"]	t	system	1	2026-10-06 16:37:21.69382	2026-10-06 16:37:21.693827
mcq-fin-lease-ifrs16	\N	t	Under IFRS 16, how does a lessee recognize an operating facility lease on the balance sheet at commencement date?	finance	Senior	IFRS 16 eliminated the distinction between operating and finance leases for lessees. Lessees recognize an ROU asset and lease liability discounted at the present value of future lease payments.	["finance", "accounting", "ifrs", "financial reporting"]	t	system	1	2026-10-06 16:37:21.706053	2026-10-06 16:37:21.70606
mcq-fin-tax-deferred	\N	t	Under IAS 12 (Income Taxes), what condition creates a Deferred Tax Asset (DTA), and what is the required criterion for its recognition on the balance sheet?	finance	Senior	A DTA arises from deductible temporary differences or unused tax loss carryforwards. IAS 12 requires that a DTA be recognized only to the extent that it is probable future taxable profits will be available.	["taxation", "tax audit", "accounting", "ifrs", "compliance", "finance"]	t	system	1	2026-10-06 16:37:21.717178	2026-10-06 16:37:21.717189
mcq-fin-audit-risk	\N	t	In the professional Audit Risk Model (Audit Risk = Inherent Risk × Control Risk × Detection Risk), if the auditor determines that Internal Controls are ineffective (Control Risk is High), how must the auditor respond to maintain acceptable overall Audit Risk?	finance	Senior	Detection risk is the only component the auditor controls. When Control Risk is High, the auditor must reduce Detection Risk by conducting more rigorous and extensive substantive testing.	["auditing", "tax audit", "internal controls", "compliance", "finance"]	t	system	1	2026-10-06 16:37:21.720826	2026-10-06 16:37:21.720841
mcq-fin-transfer-pricing	\N	t	Under OECD Transfer Pricing Guidelines (BEPS Action 13), what is the core standard applied to cross-border intercompany transactions between associated enterprises?	finance	Senior	The cornerstone of transfer pricing is the Arm's Length Principle (Article 9 OECD Model Convention), requiring pricing between related entities to match terms agreed between independent market players.	["taxation", "tax audit", "transfer pricing", "compliance", "finance"]	t	system	1	2026-10-06 16:37:21.724764	2026-10-06 16:37:21.724775
mcq-fin-sox404-weakness	\N	t	Under Sarbanes-Oxley (SOX) Section 404, what distinguishes a 'Material Weakness' from a 'Significant Deficiency' in internal control over financial reporting (ICFR)?	finance	Senior	Under PCAOB standards, a Material Weakness creates a reasonable possibility of a material misstatement not being prevented/detected, resulting in an adverse opinion on internal controls.	["internal controls", "auditing", "compliance", "sox", "finance"]	t	system	1	2026-10-06 16:37:21.729186	2026-10-06 16:37:21.729194
mcq-fin-variance-ebitda	\N	t	When performing an EBITDA bridge variance analysis between Budget ($10M) and Actual ($8M), which breakdown correctly attributes the root causes of the variance?	finance	Mid-Level	A standard EBITDA bridge decomposes budget variances into Volume (quantity sold), Price/Mix (selling price and product composition), Input Costs (raw materials/direct labor), and OpEx.	["financial analysis", "finance", "accounting", "variance analysis"]	t	system	1	2026-10-06 16:37:21.734434	2026-10-06 16:37:21.734446
mcq-fin-cashflow-indirect	\N	t	In the Indirect Method of the Statement of Cash Flows (IAS 7 / ASC 230), how does an increase in Accounts Receivable and an increase in Accounts Payable affect Cash Flow from Operating Activities?	finance	Mid-Level	Under the indirect method: an increase in Accounts Receivable consumes operating cash (subtracted), whereas an increase in Accounts Payable conserves cash (added back).	["accounting", "finance", "financial reporting", "cash flow"]	t	system	1	2026-10-06 16:37:21.73816	2026-10-06 16:37:21.738167
mcq-fin-impairment-ias36	\N	t	Under IAS 36 (Impairment of Assets), an asset's Recoverable Amount is defined as the higher of which two metrics?	finance	Senior	IAS 36 paragraph 18 specifies Recoverable Amount = max(Fair Value Less Costs of Disposal, Value in Use). An impairment loss is recognized if carrying value exceeds this recoverable amount.	["financial reporting", "accounting", "ifrs", "valuation", "finance"]	t	system	1	2026-10-06 16:37:21.742054	2026-10-06 16:37:21.742064
mcq-fin-ecl-ifrs9	\N	t	Under IFRS 9 Financial Instruments, how does the 3-stage Expected Credit Loss (ECL) model evaluate credit risk on loan receivables?	finance	Senior	IFRS 9 replaced the legacy incurred loss model with forward-looking ECL: Stage 1 = 12-month ECL, Stage 2 (significant deterioration) = Lifetime ECL, Stage 3 = Lifetime ECL.	["finance", "ifrs", "financial reporting", "compliance"]	t	system	1	2026-10-06 16:37:21.744943	2026-10-06 16:37:21.744949
mcq-fin-working-capital	\N	t	How is the Cash Conversion Cycle (CCC) calculated, and what does a decreasing CCC indicate about a company's operational efficiency?	finance	Mid-Level	CCC = DIO + DSO - DPO. A lower CCC means the firm converts investments in inventory and resources into cash flows much faster.	["finance", "financial analysis", "cash flow", "working capital"]	t	system	1	2026-10-06 16:37:21.748932	2026-10-06 16:37:21.748938
mcq-fin-consolidation-nci	\N	t	When preparing consolidated financial statements under IFRS 10, how is a Non-Controlling Interest (NCI) presented in the Consolidated Statement of Financial Position?	finance	Senior	IFRS 10 paragraph 22 mandates that Non-Controlling Interests (NCI) be presented within equity in the consolidated statement of financial position, separately from parent shareholders.	["accounting", "ifrs", "financial reporting", "consolidation", "finance"]	t	system	1	2026-10-06 16:37:21.752566	2026-10-06 16:37:21.752577
mcq-fin-tax-ifric23	\N	t	Under IFRIC 23 (Uncertainty over Income Tax Treatments), when is an entity required to reflect the effect of uncertainty in determining taxable profit, tax bases, or tax rates?	finance	Senior	IFRIC 23 requires that if it is not probable the tax authority will accept the treatment, the entity must reflect uncertainty using the most likely amount or expected value method.	["taxation", "tax audit", "compliance", "ifrs", "finance"]	t	system	1	2026-10-06 16:37:21.755949	2026-10-06 16:37:21.75596
mcq-fin-forensic-audit	\N	t	During a tax and statutory forensic audit, which analytical indicator is a prominent red flag for potential fraudulent financial reporting or fictitious revenue generation?	finance	Senior	Surges in uncollected receivables at fiscal year-end combined with swelling DSO are classic symptoms of premature revenue recognition, bill-and-hold transactions, or fictitious channel-stuffing.	["auditing", "tax audit", "compliance", "internal controls", "finance"]	t	system	1	2026-10-06 16:37:21.759411	2026-10-06 16:37:21.759419
mcq-fin-cost-breakeven	\N	t	If a division has Fixed Costs of $1,200,000, selling price per unit of $150, and Variable Cost per unit of $90, what is the Breakeven Point in sales dollars?	finance	Mid-Level	Contribution Margin Ratio = ($150 - $90) / $150 = $60 / $150 = 40% (0.40). Breakeven Sales = Fixed Costs / CM Ratio = $1,200,000 / 0.40 = $3,000,000.	["finance", "accounting", "cost accounting", "financial analysis"]	t	system	1	2026-10-06 16:37:21.762924	2026-10-06 16:37:21.76293
mcq-fb50dfd2	org-bld-01c813e7	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-06 16:51:45.065245	2026-10-06 16:51:45.065252
mcq-d900442a	org-bld-01c813e7	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-0de1e6ea	1	2026-10-06 16:51:45.718935	2026-10-06 16:51:45.718942
mcq-d3628f23	org-bld-bbc879d8	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-07 03:44:50.911449	2026-10-07 03:44:50.911454
mcq-23591e07	org-bld-bbc879d8	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-0a6e4164	1	2026-10-07 03:44:51.407571	2026-10-07 03:44:51.407577
mcq-8873b8ef	org-bld-299018f0	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-07 03:50:07.95303	2026-10-07 03:50:07.953032
mcq-468147d8	org-bld-299018f0	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-e649e6ca	1	2026-10-07 03:50:08.290949	2026-10-07 03:50:08.290952
mcq-4ce4da17	org-mcq-a-e1feb4	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-bbe564	1	2026-10-07 04:18:08.631771	2026-10-07 04:18:08.631778
mcq-6b1bce6d	org-mcq-a-f927d0	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-e6d9b1	2	2026-10-07 04:18:08.816485	2026-10-07 04:18:08.835238
mcq-133f3795	org-mcq-a-6c0ceb	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-9fe499	1	2026-10-07 04:18:08.868367	2026-10-07 04:18:08.880448
mcq-ac29e2aa	org-mcq-a-e8ecb2	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-ab4458	1	2026-10-07 04:18:08.921514	2026-10-07 04:18:08.921517
mcq-8f319afe	org-mcq-a-df242a	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-c360a1	1	2026-10-07 04:18:09.007729	2026-10-07 04:18:09.007732
mcq-deece213	org-mcq-a-148db3	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-17d53a	1	2026-10-07 04:18:09.08888	2026-10-07 04:18:09.088883
mcq-cfbe2b92	org-mcq-a-3df939	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-8967e2	1	2026-10-07 04:18:09.150759	2026-10-07 04:18:09.150761
mcq-85b27bf0	org-mcq-a-58a831	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-e39f68	2	2026-10-07 04:18:18.322121	2026-10-07 04:18:20.873332
mcq-4c0759ba	org-mcq-a-75f977	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-55ffc5	1	2026-10-07 04:19:01.709285	2026-10-07 04:19:01.709291
mcq-ba0eb850	org-mcq-a-76cfd5	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-2f6055	1	2026-10-07 04:19:01.920976	2026-10-07 04:19:01.920984
mcq-659280cb	org-bld-6ab4dd51	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-07 04:19:26.200182	2026-10-07 04:19:26.200184
mcq-acf74f4c	org-bld-6ab4dd51	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-0e8f70e9	1	2026-10-07 04:19:26.367326	2026-10-07 04:19:26.367329
mcq-aaadd92d	org-mcq-a-048653	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-7bdf6c	1	2026-10-07 05:17:04.847004	2026-10-07 05:17:04.847006
mcq-1119d836	org-mcq-a-012622	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-4861d0	2	2026-10-07 05:17:04.89945	2026-10-07 05:17:04.911862
mcq-8ee36a7a	org-mcq-a-15ba25	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-342cca	1	2026-10-07 05:17:04.94064	2026-10-07 05:17:04.95208
mcq-c0c4cfe3	org-mcq-a-d067f2	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-5d8120	1	2026-10-07 05:17:04.993961	2026-10-07 05:17:04.993964
mcq-a93cab74	org-mcq-a-6c4fa2	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-a405f0	1	2026-10-07 05:17:05.06587	2026-10-07 05:17:05.065875
mcq-12bad280	org-mcq-a-8ef56a	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-483ae6	1	2026-10-07 05:17:05.131004	2026-10-07 05:17:05.131007
mcq-3f6148d2	org-mcq-a-a36727	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-de2aa3	1	2026-10-07 05:17:05.184175	2026-10-07 05:17:05.184177
mcq-6a55e1f6	org-mcq-a-cb32bb	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-50af42	2	2026-10-07 05:17:14.526933	2026-10-07 05:17:17.261326
mcq-10de6e9d	org-mcq-a-162df9	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-38ca81	1	2026-10-07 05:18:05.000552	2026-10-07 05:18:05.000558
mcq-a65de4b8	org-mcq-a-7aeaf8	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-45560f	1	2026-10-07 05:18:05.199922	2026-10-07 05:18:05.19993
mcq-4c7ce843	org-bld-f9c0766c	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-07 05:18:29.419385	2026-10-07 05:18:29.419387
mcq-c2361c2c	org-bld-f9c0766c	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-c9b6537a	1	2026-10-07 05:18:29.589121	2026-10-07 05:18:29.589123
mcq-d1a1dcaa	org-mcq-a-1c9bb1	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-6ce0ce	1	2026-10-08 03:21:42.642765	2026-10-08 03:21:42.642768
mcq-2693910e	org-mcq-a-a1835a	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-6a4598	2	2026-10-08 03:21:42.726591	2026-10-08 03:21:42.742875
mcq-e061709e	org-mcq-a-164a8c	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-844c45	1	2026-10-08 03:21:42.773511	2026-10-08 03:21:42.785818
mcq-6f0d25de	org-mcq-a-c87c93	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-a92867	1	2026-10-08 03:21:42.837782	2026-10-08 03:21:42.837784
mcq-734aec55	org-mcq-a-1a0dfd	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-1630e9	1	2026-10-08 03:21:42.910172	2026-10-08 03:21:42.910178
mcq-c23309c6	org-mcq-a-2dcef5	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-5d882d	1	2026-10-08 03:21:42.978666	2026-10-08 03:21:42.978669
mcq-28821ab9	org-mcq-a-286d82	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-9cdc8d	1	2026-10-08 03:21:43.030247	2026-10-08 03:21:43.03025
mcq-64117aa4	org-mcq-a-c78928	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-ea7a34	2	2026-10-08 03:21:50.363218	2026-10-08 03:21:52.813999
mcq-dd461510	org-mcq-a-9d96d9	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-225d65	1	2026-10-08 03:22:54.57123	2026-10-08 03:22:54.571235
mcq-b6893cbe	org-mcq-a-8b7f03	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-276e5d	1	2026-10-08 03:22:54.728367	2026-10-08 03:22:54.728373
mcq-215d2dc4	org-bld-221b5760	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-08 03:23:25.114047	2026-10-08 03:23:25.114051
mcq-2d7939f8	org-bld-221b5760	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-dfb19537	1	2026-10-08 03:23:25.410982	2026-10-08 03:23:25.410988
mcq-e99d93	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:05:30.190376	2026-10-08 04:05:30.190378
mcq-7864b4	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:05:47.90899	2026-10-08 04:05:47.908992
mcq-19f1d2	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:06:39.072193	2026-10-08 04:06:39.072195
mcq-99af78	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:06:51.862328	2026-10-08 04:06:51.862331
mcq-5ecdc1	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:07:05.947483	2026-10-08 04:07:05.947484
mcq-9d9020	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:07:35.234585	2026-10-08 04:07:35.234587
mcq-15ce41	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:07:49.080316	2026-10-08 04:07:49.080318
mcq-3eed54	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:24:55.817709	2026-10-08 04:24:55.817712
mcq-ab5ce0	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:25:17.712285	2026-10-08 04:25:17.712287
mcq-6a96f6	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:26:11.051769	2026-10-08 04:26:11.051772
mcq-d74bc5cb	org-mcq-a-6d9e78	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-b185cf	1	2026-10-08 04:29:02.285399	2026-10-08 04:29:02.285402
mcq-b7ab0297	org-mcq-a-0b9e99	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-a8f769	2	2026-10-08 04:29:02.358236	2026-10-08 04:29:02.376181
mcq-23b36e1e	org-mcq-a-b83c43	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-468742	1	2026-10-08 04:29:02.411278	2026-10-08 04:29:02.423662
mcq-eaa4bf1c	org-mcq-a-c49138	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-853d3e	1	2026-10-08 04:29:02.480818	2026-10-08 04:29:02.480821
mcq-c3b5d8ee	org-mcq-a-8fb403	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-1700e1	1	2026-10-08 04:29:02.603606	2026-10-08 04:29:02.603609
mcq-361abb85	org-mcq-a-d0d7b0	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-8fbc2d	1	2026-10-08 04:29:02.691193	2026-10-08 04:29:02.691199
mcq-98935e91	org-mcq-a-6dd9ae	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-2ec535	1	2026-10-08 04:29:02.776856	2026-10-08 04:29:02.776859
mcq-e84cf1eb	org-mcq-a-334cec	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-bf3304	2	2026-10-08 04:29:13.553543	2026-10-08 04:29:16.7202
mcq-2656b41d	org-mcq-a-01a8d4	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-fee366	1	2026-10-08 04:30:43.850821	2026-10-08 04:30:43.850824
mcq-8921a476	org-mcq-a-c4f5f3	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-fb28a9	1	2026-10-08 04:30:43.918698	2026-10-08 04:30:43.918701
mcq-821be67d	org-bld-465cc1fd	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-08 04:31:21.819374	2026-10-08 04:31:21.819377
mcq-fe5d802b	org-bld-465cc1fd	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-0421d754	1	2026-10-08 04:31:22.144593	2026-10-08 04:31:22.144599
mcq-47fa22	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 04:31:48.623723	2026-10-08 04:31:48.623726
mcq-f98f0c9f	org-mcq-a-23b5b6	f	What is the primary benefit of Redis in a distributed caching tier?	technical	Medium	Redis provides in-memory sub-millisecond key-value operations with atomic data structures.	["redis", "caching", "backend"]	t	rec-mcq-a-8d3963	1	2026-10-08 08:32:27.245238	2026-10-08 08:32:27.245241
mcq-fd0129d6	org-mcq-a-01a5e9	f	Refined and Final Question Prompt	technical	Hard	Updated explanation for new answer	[]	t	rec-mcq-a-694043	2	2026-10-08 08:32:27.313568	2026-10-08 08:32:27.326039
mcq-d3ff4c05	org-mcq-a-fd9255	f	Temporary MCQ to be archived	technical	Medium		[]	f	rec-mcq-a-7de137	1	2026-10-08 08:32:27.36945	2026-10-08 08:32:27.391728
mcq-0ea044f7	org-mcq-a-8ca0d3	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-fa89cb	1	2026-10-08 08:32:27.478464	2026-10-08 08:32:27.47847
mcq-7179f078	org-mcq-a-08a142	f	Custom DB Question 1	technical	Medium		[]	t	rec-mcq-a-7f77c9	1	2026-10-08 08:32:27.607916	2026-10-08 08:32:27.607924
mcq-05e43c85	org-mcq-a-5c4c4b	f	Alpha Secret MCQ	technical	Medium		[]	t	rec-mcq-a-d2d469	1	2026-10-08 08:32:27.711875	2026-10-08 08:32:27.711881
mcq-59308555	org-mcq-a-c13204	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-542ebf	1	2026-10-08 08:32:27.824113	2026-10-08 08:32:27.824119
mcq-307fd8c8	org-mcq-a-8fca89	f	Modified Question Later	technical	Medium		[]	t	rec-mcq-a-d545a7	2	2026-10-08 08:32:35.434224	2026-10-08 08:32:37.77379
mcq-9db819d7	org-mcq-a-001911	f	Proprietary internal architecture question for Alpha Corp	technical	Medium		[]	t	rec-mcq-a-3785dc	1	2026-10-08 08:34:09.529537	2026-10-08 08:34:09.529539
mcq-c1516133	org-mcq-a-662fc9	f	Secret Custom Algorithm question	technical	Medium	Confidential internal rationale	[]	t	rec-mcq-a-82c595	1	2026-10-08 08:34:09.639066	2026-10-08 08:34:09.639069
mcq-8182cfe2	org-bld-4087d76a	f	What does the Global Interpreter Lock (GIL) do in CPython?	technical	Medium	The GIL synchronizes thread execution preventing race conditions on memory allocation.	["python"]	t	\N	1	2026-10-08 08:35:12.217995	2026-10-08 08:35:12.217997
mcq-fb99431e	org-bld-4087d76a	f	How do you declare a dependency in a FastAPI route handler?	technical	Easy	FastAPI uses Depends() in route function parameter defaults.	["python", "fastapi"]	t	usr-39ef1dc0	1	2026-10-08 08:35:12.437888	2026-10-08 08:35:12.437891
mcq-f4b2a1	\N	f	Python GIL & Multiprocessing question	technical	Hard	\N	["python"]	t	\N	1	2026-10-08 08:35:57.720397	2026-10-08 08:35:57.720399
\.


--
-- Data for Name: mcq_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mcq_submissions (id, candidate_id, assessment_id, mcq_question_id, selected_option_key, is_correct, points_earned, points_possible, created_at) FROM stdin;
msub-2dd59726	cand-eval-c-2ed16b	asm-748cd038	mcq-py-gil	B	t	1	1	2026-10-05 03:25:25.68607
msub-dff0f286	cand-eval-z-be2419	asm-8574ac74	mcq-py-gil	D	f	0	1	2026-10-05 03:25:28.262204
msub-3ef5a53a	cand-hist-60dba5	asm-856a4ad8	mcq-146682b9	A	t	1	1	2026-10-05 03:25:32.244492
msub-c8f33e8a	cand-eval-c-19c11c	asm-249dca0f	mcq-py-gil	B	t	1	1	2026-10-05 04:58:42.917455
msub-990cf61f	cand-eval-z-54797e	asm-bd681cdb	mcq-py-gil	D	f	0	1	2026-10-05 04:58:46.014734
msub-efc304ac	cand-hist-1ed33c	asm-271478e7	mcq-900a4470	A	t	1	1	2026-10-05 04:58:50.518853
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, slug, domain, is_active, created_at, updated_at) FROM stdin;
org-sparkx-default	SparkX Technologies	sparkx-default	\N	t	2026-10-04 06:37:53	2026-10-04 06:37:53
\.


--
-- Data for Name: question_skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_skills (id, question_type, question_id, skill_id, relevance_weight, created_at) FROM stdin;
\.


--
-- Data for Name: recruiter_availability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recruiter_availability (id, organization_id, recruiter_id, job_id, available_date, start_time, end_time, timezone, slot_duration_minutes, buffer_minutes, is_active, created_at, updated_at) FROM stdin;
avail-d4439838	org-sched-a-1d27b9	rec-a-238fdb	job-sched-3b77e2	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 07:37:56.279648	2026-10-04 07:37:56.279651
avail-505dba96	org-sched-b-1f48a1	rec-b-d8ca9e	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 07:37:57.106471	2026-10-04 07:37:57.106473
avail-2530435e	org-sched-a-a32af4	rec-a-a87144	job-sched-b0039d	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:37:57.365316	2026-10-04 07:37:57.365318
avail-b6ef5f68	org-sched-a-4478d3	rec-a-22198c	job-sched-9177d6	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:38:21.990239	2026-10-04 07:38:21.990241
avail-2282712d	org-sched-a-efda8f	rec-a-4fcea3	job-sched-048813	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:38:56.231641	2026-10-04 07:38:56.231644
avail-420a2e18	org-sched-a-cbe3ca	rec-a-829608	job-sched-d0c337	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:39:06.645574	2026-10-04 07:39:06.645578
avail-41459ad8	org-sched-a-08b67f	rec-a-bf2079	job-sched-7832de	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 07:40:44.877049	2026-10-04 07:40:44.877052
avail-7260eb0b	org-sched-b-f90cb2	rec-b-a47bd5	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 07:40:45.676539	2026-10-04 07:40:45.676542
avail-8a4baaec	org-sched-a-63044d	rec-a-71249a	job-sched-329616	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:40:45.920369	2026-10-04 07:40:45.920374
avail-e572b4d0	org-sched-a-14d436	rec-a-cc1265	job-sched-61752d	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 07:40:46.193752	2026-10-04 07:40:46.193755
avail-7482f29d	org-sched-a-234316	rec-a-62081b	job-sched-8555a0	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 07:41:30.237248	2026-10-04 07:41:30.237251
avail-ac520178	org-sched-b-8d3112	rec-b-81a38e	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 07:41:31.062921	2026-10-04 07:41:31.062928
avail-815fcf89	org-sched-a-65781c	rec-a-8979e4	job-sched-942167	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:41:31.2934	2026-10-04 07:41:31.293402
avail-6a2820dc	org-sched-a-1f1d46	rec-a-8f9a07	job-sched-c27baa	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 07:41:31.519069	2026-10-04 07:41:31.519071
avail-cd5bf5be	org-sched-a-113bfc	rec-a-c6e6b1	job-sched-47f8f8	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 07:41:31.841112	2026-10-04 07:41:31.841115
avail-7690e285	org-sched-a-86ae52	rec-a-b48d73	job-sched-fb0e79	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 07:41:32.19515	2026-10-04 07:41:32.195161
avail-27a9438c	org-sched-a-d668c4	rec-a-67ac57	job-sched-a160a9	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 07:41:32.516434	2026-10-04 07:41:32.516437
avail-ee70d996	org-sched-a-22d195	rec-a-dd5bcc	job-sched-9b2053	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 07:41:32.867682	2026-10-04 07:41:32.867686
avail-dad5d47e	org-sched-a-20a05f	rec-a-45ba37	job-sched-5d9777	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 07:41:33.239519	2026-10-04 07:41:33.239522
avail-b91e3dee	org-sched-a-1c2a99	rec-a-6b8517	job-sched-12c861	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 07:41:33.624193	2026-10-04 07:41:33.624196
avail-715293c6	org-sched-a-81f436	rec-a-172776	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 07:41:34.002377	2026-10-04 07:41:34.002381
avail-fc2a68dd	org-sched-a-ea8581	rec-a-52763f	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 07:41:34.311124	2026-10-04 07:41:34.311127
avail-926b4a02	org-sched-a-169e58	rec-a-773a0d	job-sched-70f515	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 07:42:09.178648	2026-10-04 07:42:09.178652
avail-fd4107f4	org-sched-b-9a939e	rec-b-a8fab1	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 07:42:10.420449	2026-10-04 07:42:10.420453
avail-6f9beea3	org-sched-a-55321c	rec-a-253a86	job-sched-9bec89	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:42:10.76136	2026-10-04 07:42:10.761363
avail-9d1add66	org-sched-a-dd34b8	rec-a-2cc723	job-sched-f6eac3	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 07:42:11.081137	2026-10-04 07:42:11.08114
avail-6df8fe24	org-sched-a-7ca35e	rec-a-dca3db	job-sched-a39150	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 07:42:11.458689	2026-10-04 07:42:11.458695
avail-7ae2c393	org-sched-a-17e682	rec-a-bb4fbb	job-sched-3e1e93	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 07:42:12.117627	2026-10-04 07:42:12.117633
avail-1db4b8eb	org-sched-a-8b841e	rec-a-f55c66	job-sched-2ed01f	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 07:42:12.615559	2026-10-04 07:42:12.615563
avail-bb39be10	org-sched-a-41e35e	rec-a-1fa567	job-sched-358e03	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 07:42:13.098416	2026-10-04 07:42:13.09842
avail-c249ccc4	org-sched-a-f5514d	rec-a-124569	job-sched-585eaf	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 07:42:13.466223	2026-10-04 07:42:13.466227
avail-4789a3f3	org-sched-a-77553a	rec-a-f8fe7a	job-sched-02c2b6	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 07:42:13.865812	2026-10-04 07:42:13.865816
avail-f7437b5e	org-sched-a-85bbd5	rec-a-e9e6c2	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 07:42:14.260521	2026-10-04 07:42:14.260524
avail-bbc8eb61	org-sched-a-b99162	rec-a-d958f8	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 07:42:14.598718	2026-10-04 07:42:14.598724
avail-97a503d1	org-sched-a-2d0a8c	rec-a-e9c1fc	job-sched-b4356b	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 07:44:17.137842	2026-10-04 07:44:17.137845
avail-2d869300	org-sched-b-ff9d40	rec-b-bb941d	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 07:44:18.52475	2026-10-04 07:44:18.524755
avail-aae2b423	org-sched-a-8861e1	rec-a-58be38	job-sched-2691d5	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 07:44:18.879032	2026-10-04 07:44:18.879036
avail-ff420df5	org-sched-a-cde7de	rec-a-811d51	job-sched-78ff56	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 07:44:19.245452	2026-10-04 07:44:19.245456
avail-77b8bc81	org-sched-a-f4aac2	rec-a-f8b4a0	job-sched-a6d025	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 07:44:19.6553	2026-10-04 07:44:19.655303
avail-9cb57b71	org-sched-a-783c2a	rec-a-8d3304	job-sched-666a61	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 07:44:20.044893	2026-10-04 07:44:20.044897
avail-c5522f1f	org-sched-a-7658c2	rec-a-323dc3	job-sched-46a282	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 07:44:20.443858	2026-10-04 07:44:20.443862
avail-6277e3e9	org-sched-a-ba3d74	rec-a-f3f720	job-sched-dd30eb	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 07:44:20.870446	2026-10-04 07:44:20.870449
avail-9bcddcda	org-sched-a-089ca9	rec-a-7ceef1	job-sched-0d4c0b	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 07:44:21.357128	2026-10-04 07:44:21.357133
avail-2e8515a0	org-sched-a-a6783c	rec-a-374e01	job-sched-ca10bc	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 07:44:21.843897	2026-10-04 07:44:21.843901
avail-386adeb9	org-sched-a-77f220	rec-a-2a0218	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 07:44:22.284636	2026-10-04 07:44:22.284639
avail-4eb1384c	org-sched-a-20b405	rec-a-b57d46	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 07:44:22.645325	2026-10-04 07:44:22.645328
avail-a08f3f2a	org-4d-a-f240cb	rec-4d-a-f240cb	job-4d-a-f240cb	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 08:10:10.697003	2026-10-04 08:10:10.697006
avail-98cd8c3d	org-4d-a-5d8b9b	rec-4d-a-5d8b9b	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 08:10:15.531546	2026-10-04 08:10:15.53155
avail-a9e8280a	org-4d-a-f32d90	rec-4d-a-f32d90	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 08:10:16.672733	2026-10-04 08:10:16.672738
avail-4b664b18	org-4d-a-36d6f1	rec-4d-a-36d6f1	job-4d-a-36d6f1	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 08:11:25.633436	2026-10-04 08:11:25.633441
avail-5ab4170e	org-4d-a-de4818	rec-4d-a-de4818	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 08:11:30.797409	2026-10-04 08:11:30.797412
avail-efe80d5b	org-4d-a-6d0ab9	rec-4d-a-6d0ab9	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 08:11:31.809133	2026-10-04 08:11:31.809136
avail-debd05ba	org-sched-a-b6ad5e	rec-a-04b959	job-sched-7eacd1	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 08:13:40.74969	2026-10-04 08:13:40.749704
avail-6dfe9e09	org-sched-b-0e7cc7	rec-b-4a5dcb	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 08:13:42.630808	2026-10-04 08:13:42.630811
avail-74304309	org-sched-a-38d753	rec-a-786e79	job-sched-c7ca89	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 08:13:43.040887	2026-10-04 08:13:43.040889
avail-3eee1e7b	org-sched-a-d292b7	rec-a-76dba6	job-sched-07ed43	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 08:13:43.417807	2026-10-04 08:13:43.41781
avail-5ae9982a	org-sched-a-72a40c	rec-a-3333a8	job-sched-d8188e	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 08:13:44.084723	2026-10-04 08:13:44.084727
avail-9e23ae63	org-sched-a-dad0d1	rec-a-1a0b6f	job-sched-b5de10	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 08:13:44.607854	2026-10-04 08:13:44.607856
avail-f417026f	org-sched-a-92dbcf	rec-a-dcb0c3	job-sched-f0b164	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 08:13:45.006631	2026-10-04 08:13:45.006634
avail-e97c90f9	org-sched-a-26ac61	rec-a-1f8b15	job-sched-bd78fa	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 08:13:45.531169	2026-10-04 08:13:45.531173
avail-003e5be9	org-sched-a-c3dc2a	rec-a-9106e2	job-sched-273e5a	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 08:13:46.193477	2026-10-04 08:13:46.19348
avail-772a2db5	org-sched-a-85ea85	rec-a-b4ab71	job-sched-05f719	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 08:13:46.856257	2026-10-04 08:13:46.85626
avail-ce71153a	org-sched-a-3f8d2d	rec-a-1d735c	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 08:13:47.5469	2026-10-04 08:13:47.546904
avail-8f10a075	org-sched-a-3c8278	rec-a-0550a4	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 08:13:48.101368	2026-10-04 08:13:48.101373
avail-63c0410a	org-4d-a-5b1fe5	rec-4d-a-5b1fe5	job-4d-a-5b1fe5	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 08:13:53.605856	2026-10-04 08:13:53.605864
avail-345d802f	org-4d-a-a20ee9	rec-4d-a-a20ee9	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 08:13:58.955597	2026-10-04 08:13:58.955602
avail-e078e429	org-4d-a-3026c5	rec-4d-a-3026c5	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 08:14:00.011828	2026-10-04 08:14:00.011831
avail-e446e951	org-sched-a-ed48c6	rec-a-d966dd	job-sched-a6cf9b	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 08:16:29.245871	2026-10-04 08:16:29.245874
avail-439425af	org-sched-b-6cbf53	rec-b-e28e18	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 08:16:30.871996	2026-10-04 08:16:30.872
avail-89364e9f	org-sched-a-027e04	rec-a-46d90a	job-sched-e13079	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 08:16:31.321431	2026-10-04 08:16:31.321434
avail-a8415aab	org-sched-a-f290e8	rec-a-88087f	job-sched-86a88d	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 08:16:31.81293	2026-10-04 08:16:31.812932
avail-e8f086eb	org-sched-a-a76e6c	rec-a-f54a48	job-sched-996a92	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 08:16:32.480113	2026-10-04 08:16:32.480117
avail-4b62ea20	org-sched-a-0e352a	rec-a-318134	job-sched-4951ff	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 08:16:33.097498	2026-10-04 08:16:33.097501
avail-6660a9a2	org-sched-a-88b1a7	rec-a-2afff3	job-sched-c83a3a	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 08:16:33.81891	2026-10-04 08:16:33.818915
avail-8593091a	org-sched-a-57ae57	rec-a-c72ea7	job-sched-f8a7ab	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 08:16:34.604668	2026-10-04 08:16:34.604672
avail-ebeb7150	org-sched-a-fcaf90	rec-a-0b1fc4	job-sched-37e35a	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 08:16:35.343954	2026-10-04 08:16:35.343958
avail-3eadfadb	org-sched-a-ba078c	rec-a-11b1fd	job-sched-f9a819	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 08:16:36.130282	2026-10-04 08:16:36.130285
avail-c8163cd0	org-sched-a-9b97c7	rec-a-81b08f	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 08:16:36.822295	2026-10-04 08:16:36.822298
avail-ab6c77cf	org-sched-a-335f0e	rec-a-20facf	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 08:16:37.488376	2026-10-04 08:16:37.488379
avail-2e9ae659	org-4d-a-c081e2	rec-4d-a-c081e2	job-4d-a-c081e2	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 08:16:40.917362	2026-10-04 08:16:40.917366
avail-fc6693a5	org-4d-a-e42876	rec-4d-a-e42876	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 08:16:46.385152	2026-10-04 08:16:46.385154
avail-b9f33668	org-4d-a-cadcd0	rec-4d-a-cadcd0	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 08:16:47.291584	2026-10-04 08:16:47.291586
avail-851e6ee5	org-sched-a-80c306	rec-a-6fa600	job-sched-9b9017	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 08:24:09.851605	2026-10-04 08:24:09.85161
avail-e9d641ff	org-sched-b-e347f2	rec-b-256ca1	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 08:24:15.051451	2026-10-04 08:24:15.05146
avail-04db8d2f	org-sched-a-8a10b7	rec-a-6e5982	job-sched-e4ed37	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 08:24:16.843309	2026-10-04 08:24:16.843326
avail-d85cbb1c	org-sched-a-c1c7c3	rec-a-4a4fed	job-sched-cd25a7	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 08:24:18.679414	2026-10-04 08:24:18.679427
avail-fe58499b	org-sched-a-b727e5	rec-a-028521	job-sched-1e9524	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 08:24:20.506075	2026-10-04 08:24:20.506081
avail-b231f163	org-sched-a-88e095	rec-a-56d33d	job-sched-59350e	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 08:24:22.572756	2026-10-04 08:24:22.572768
avail-3956ff2a	org-sched-a-c653ec	rec-a-ecd141	job-sched-52f2cc	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 08:24:24.29585	2026-10-04 08:24:24.295855
avail-cb29d9fe	org-sched-a-9f7a50	rec-a-44f1f8	job-sched-f7eb10	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 08:24:26.241063	2026-10-04 08:24:26.241073
avail-5a11efc7	org-sched-a-654838	rec-a-173c07	job-sched-178a27	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 08:24:28.176967	2026-10-04 08:24:28.176978
avail-12d1c2ed	org-sched-a-28ff7d	rec-a-2dc3fa	job-sched-81b74a	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 08:24:30.205211	2026-10-04 08:24:30.205216
avail-333e1284	org-sched-a-cd8b26	rec-a-d2bbbb	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 08:24:32.224777	2026-10-04 08:24:32.224784
avail-3c262f29	org-sched-a-2a7d60	rec-a-7fc852	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 08:24:33.797616	2026-10-04 08:24:33.797627
avail-2adc290e	org-4d-a-1e77b0	rec-4d-a-1e77b0	job-4d-a-1e77b0	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 08:24:36.386734	2026-10-04 08:24:36.386738
avail-3a14cdb2	org-4d-a-252ebe	rec-4d-a-252ebe	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 08:24:41.995783	2026-10-04 08:24:41.995786
avail-108ae90e	org-4d-a-f90256	rec-4d-a-f90256	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 08:24:44.066282	2026-10-04 08:24:44.066287
avail-c896f61f	org-4d-a-284b43	rec-4d-a-284b43	job-4d-a-284b43	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 14:54:20.956182	2026-10-04 14:54:20.956185
avail-0730a074	org-4d-a-55f900	rec-4d-a-55f900	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 14:54:25.573043	2026-10-04 14:54:25.573046
avail-e4a47c90	org-4d-a-e7a59d	rec-4d-a-e7a59d	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 14:54:26.221508	2026-10-04 14:54:26.22151
avail-bcf68c21	org-4d-a-61fb5f	rec-4d-a-61fb5f	job-4d-a-61fb5f	2026-10-06	10:00	11:00	UTC	30	0	t	2026-10-04 15:09:30.494354	2026-10-04 15:09:30.494368
avail-764a8796	org-4d-a-8c7777	rec-4d-a-8c7777	\N	2026-10-07	14:00	15:00	UTC	30	15	t	2026-10-04 15:09:43.471971	2026-10-04 15:09:43.471976
avail-7021d780	org-4d-a-e46708	rec-4d-a-e46708	\N	2026-10-08	16:00	17:00	UTC	30	15	t	2026-10-04 15:09:48.378281	2026-10-04 15:09:48.378286
avail-395043f6	org-sched-a-7140d4	rec-a-8cbea2	job-sched-28a4d5	2026-10-07	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-04 15:10:07.777432	2026-10-04 15:10:07.777442
avail-7a807bca	org-sched-b-293f03	rec-b-12738a	\N	2026-10-08	10:00	16:00	UTC	30	15	t	2026-10-04 15:10:20.5554	2026-10-04 15:10:20.555408
avail-d8b100d9	org-sched-a-f168ef	rec-a-979d7d	job-sched-525c00	2026-10-09	10:00	13:00	UTC	30	15	t	2026-10-04 15:10:24.732404	2026-10-04 15:10:24.732421
avail-59184e3a	org-sched-a-09c777	rec-a-582613	job-sched-a28c95	2026-10-10	14:00	16:00	UTC	30	15	t	2026-10-04 15:10:27.618188	2026-10-04 15:10:27.618193
avail-92aeb088	org-sched-a-18bac2	rec-a-6a8804	job-sched-fcb298	2026-10-11	10:00	11:00	UTC	30	0	t	2026-10-04 15:10:30.760688	2026-10-04 15:10:30.760694
avail-2014ed14	org-sched-a-877439	rec-a-169017	job-sched-851c42	2026-10-12	09:00	10:00	UTC	30	0	t	2026-10-04 15:10:33.259972	2026-10-04 15:10:33.259977
avail-518d27bb	org-sched-a-c83a0f	rec-a-e84bb1	job-sched-ab0a74	2026-10-13	14:00	16:00	UTC	30	0	t	2026-10-04 15:10:37.159291	2026-10-04 15:10:37.159298
avail-f83418e5	org-sched-a-631f5a	rec-a-2321ef	job-sched-ca26fd	2026-10-14	11:00	12:00	UTC	30	0	t	2026-10-04 15:10:39.858625	2026-10-04 15:10:39.858632
avail-33ce918c	org-sched-a-677fc8	rec-a-94415d	job-sched-e286c3	2026-10-16	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-04 15:10:42.527566	2026-10-04 15:10:42.527573
avail-edcad3f9	org-sched-a-bdd41f	rec-a-50ee72	job-sched-32327a	2026-10-18	10:00	11:00	UTC	30	0	t	2026-10-04 15:10:45.712142	2026-10-04 15:10:45.712149
avail-573dfb08	org-sched-a-0b1d4f	rec-a-95efb7	\N	2026-10-19	10:00	11:00	UTC	30	15	t	2026-10-04 15:10:48.03762	2026-10-04 15:10:48.037629
avail-117a8d17	org-sched-a-e65ef4	rec-a-2b1078	\N	2026-10-20	09:00	12:00	UTC	30	15	t	2026-10-04 15:10:50.290745	2026-10-04 15:10:50.290752
avail-532fb46a	org-sched-a-58700a	rec-a-2c6742	job-sched-2d250c	2026-10-08	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-05 03:22:46.608754	2026-10-05 03:22:46.608762
avail-22f5f1b6	org-sched-b-0151cd	rec-b-6055a9	\N	2026-10-09	10:00	16:00	UTC	30	15	t	2026-10-05 03:23:02.818889	2026-10-05 03:23:02.818897
avail-dcc4a01c	org-sched-a-bb500c	rec-a-3ad81f	job-sched-c68878	2026-10-10	10:00	13:00	UTC	30	15	t	2026-10-05 03:23:07.251759	2026-10-05 03:23:07.251765
avail-01145171	org-sched-a-8faaf2	rec-a-9543aa	job-sched-b24eea	2026-10-11	14:00	16:00	UTC	30	15	t	2026-10-05 03:23:12.212386	2026-10-05 03:23:12.212389
avail-f099b5c3	org-sched-a-217876	rec-a-a0a39c	job-sched-b3206b	2026-10-12	10:00	11:00	UTC	30	0	t	2026-10-05 03:23:15.689705	2026-10-05 03:23:15.689713
avail-5ed994aa	org-sched-a-17742f	rec-a-d21a02	job-sched-638d55	2026-10-13	09:00	10:00	UTC	30	0	t	2026-10-05 03:23:19.29025	2026-10-05 03:23:19.290255
avail-a0e1de70	org-sched-a-f0a0a7	rec-a-c2d462	job-sched-3553e5	2026-10-14	14:00	16:00	UTC	30	0	t	2026-10-05 03:23:23.556513	2026-10-05 03:23:23.556535
avail-f00d8d64	org-sched-a-ee88c4	rec-a-60d2d4	job-sched-61e53e	2026-10-15	11:00	12:00	UTC	30	0	t	2026-10-05 03:23:27.265991	2026-10-05 03:23:27.266001
avail-547d8995	org-sched-a-a58b1f	rec-a-036cfa	job-sched-13a844	2026-10-17	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-05 03:23:31.022272	2026-10-05 03:23:31.022283
avail-2a78b89c	org-sched-a-5ba04d	rec-a-af4f89	job-sched-e1fdd1	2026-10-19	10:00	11:00	UTC	30	0	t	2026-10-05 03:23:34.83337	2026-10-05 03:23:34.833375
avail-4196dcc1	org-sched-a-4b3b27	rec-a-c2eda8	\N	2026-10-20	10:00	11:00	UTC	30	15	t	2026-10-05 03:23:38.443916	2026-10-05 03:23:38.44392
avail-6f06cb67	org-sched-a-36f016	rec-a-af8950	\N	2026-10-21	09:00	12:00	UTC	30	15	t	2026-10-05 03:23:41.863467	2026-10-05 03:23:41.863475
avail-1521de05	org-4d-a-a657b1	rec-4d-a-a657b1	job-4d-a-a657b1	2026-10-07	10:00	11:00	UTC	30	0	t	2026-10-05 03:23:57.357666	2026-10-05 03:23:57.35767
avail-102e4f52	org-4d-a-50efba	rec-4d-a-50efba	\N	2026-10-08	14:00	15:00	UTC	30	15	t	2026-10-05 03:24:17.942084	2026-10-05 03:24:17.942086
avail-edc7d0b8	org-4d-a-1786f9	rec-4d-a-1786f9	\N	2026-10-09	16:00	17:00	UTC	30	15	t	2026-10-05 03:24:26.083676	2026-10-05 03:24:26.083683
avail-9b4529c5	org-4d-a-2c9325	rec-4d-a-2c9325	job-4d-a-2c9325	2026-10-07	10:00	11:00	UTC	30	0	t	2026-10-05 04:07:55.66481	2026-10-05 04:07:55.664817
avail-4105c909	org-4d-a-7454ec	rec-4d-a-7454ec	\N	2026-10-08	14:00	15:00	UTC	30	15	t	2026-10-05 04:07:59.322321	2026-10-05 04:07:59.322325
avail-bdb3d94d	org-sched-a-6cbf49	rec-a-1ee54d	job-sched-1f63c8	2026-10-08	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-05 04:08:01.388953	2026-10-05 04:08:01.388959
avail-8d978d90	org-sched-a-a8035a	rec-a-7e80a1	job-sched-e25e1e	2026-10-11	14:00	16:00	UTC	30	15	t	2026-10-05 04:08:03.209998	2026-10-05 04:08:03.210004
avail-d44a8e95	org-4d-a-f508fe	rec-4d-a-f508fe	job-4d-a-f508fe	2026-10-07	10:00	11:00	UTC	30	0	t	2026-10-05 04:27:08.602963	2026-10-05 04:27:08.60297
avail-3fcd6256	org-4d-a-b7f1df	rec-4d-a-b7f1df	\N	2026-10-08	14:00	15:00	UTC	30	15	t	2026-10-05 04:27:19.848509	2026-10-05 04:27:19.848513
avail-2d2b4e92	org-4d-a-58a354	rec-4d-a-58a354	\N	2026-10-09	16:00	17:00	UTC	30	15	t	2026-10-05 04:27:24.44524	2026-10-05 04:27:24.445244
avail-5fa9f0d4	org-sched-a-1d0929	rec-a-ce8109	job-sched-54b850	2026-10-08	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-05 04:27:52.694111	2026-10-05 04:27:52.694115
avail-9218b9a3	org-sched-b-a77d51	rec-b-f2194c	\N	2026-10-09	10:00	16:00	UTC	30	15	t	2026-10-05 04:28:00.833337	2026-10-05 04:28:00.833346
avail-02c0df78	org-sched-a-1b74f2	rec-a-1acf01	job-sched-cd0e6f	2026-10-10	10:00	13:00	UTC	30	15	t	2026-10-05 04:28:03.750297	2026-10-05 04:28:03.750309
avail-39c23903	org-sched-a-c51cfd	rec-a-52fbd3	job-sched-26a432	2026-10-11	14:00	16:00	UTC	30	15	t	2026-10-05 04:28:06.692981	2026-10-05 04:28:06.692987
avail-e1288d9f	org-sched-a-79742b	rec-a-579fe9	job-sched-be7049	2026-10-12	10:00	11:00	UTC	30	0	t	2026-10-05 04:28:08.973208	2026-10-05 04:28:08.973215
avail-5e85204f	org-sched-a-778c70	rec-a-c69131	job-sched-b1f125	2026-10-13	09:00	10:00	UTC	30	0	t	2026-10-05 04:28:11.071458	2026-10-05 04:28:11.071465
avail-0019474e	org-sched-a-7a6b86	rec-a-c0f684	job-sched-19905d	2026-10-14	14:00	16:00	UTC	30	0	t	2026-10-05 04:28:13.154569	2026-10-05 04:28:13.154575
avail-ecfa1655	org-sched-a-d78bc6	rec-a-0aae53	job-sched-f3810c	2026-10-15	11:00	12:00	UTC	30	0	t	2026-10-05 04:28:15.307874	2026-10-05 04:28:15.307878
avail-46e03a02	org-sched-a-19e53a	rec-a-22afd1	job-sched-79d8ca	2026-10-17	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-05 04:28:17.282452	2026-10-05 04:28:17.282458
avail-3c8fcc2a	org-sched-a-25469a	rec-a-b37fff	job-sched-74b2ec	2026-10-19	10:00	11:00	UTC	30	0	t	2026-10-05 04:28:19.295851	2026-10-05 04:28:19.295855
avail-42e6ed53	org-sched-a-41e109	rec-a-683984	\N	2026-10-20	10:00	11:00	UTC	30	15	t	2026-10-05 04:28:21.357038	2026-10-05 04:28:21.357045
avail-9308d510	org-sched-a-8043af	rec-a-9ddef6	\N	2026-10-21	09:00	12:00	UTC	30	15	t	2026-10-05 04:28:23.314708	2026-10-05 04:28:23.314714
avail-4d723296	org-4d-a-154e43	rec-4d-a-154e43	job-4d-a-154e43	2026-10-07	10:00	11:00	UTC	30	0	t	2026-10-05 04:56:22.01002	2026-10-05 04:56:22.010026
avail-6b19c467	org-4d-a-303539	rec-4d-a-303539	\N	2026-10-08	14:00	15:00	UTC	30	15	t	2026-10-05 04:56:27.194294	2026-10-05 04:56:27.194302
avail-b499c636	org-sched-a-658bfa	rec-a-dd1ba7	job-sched-53d48d	2026-10-08	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-05 04:56:29.409956	2026-10-05 04:56:29.409962
avail-9a7862cc	org-sched-a-2f7b3d	rec-a-4d3baf	job-sched-21a17d	2026-10-11	14:00	16:00	UTC	30	15	t	2026-10-05 04:56:31.497872	2026-10-05 04:56:31.49788
avail-7605dfa2	org-4d-a-978794	rec-4d-a-978794	job-4d-a-978794	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 03:29:03.920053	2026-10-06 03:29:03.920056
avail-46e76883	org-4d-a-1b7789	rec-4d-a-1b7789	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 03:29:07.583913	2026-10-06 03:29:07.583917
avail-4f07a07e	org-sched-a-7dd3af	rec-a-bc9a2c	job-sched-de5020	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 03:29:09.589584	2026-10-06 03:29:09.589586
avail-3879d809	org-sched-a-19ef16	rec-a-4d6cd0	job-sched-501830	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 03:29:11.226579	2026-10-06 03:29:11.226598
avail-c06b4fcf	org-4d-a-005fe6	rec-4d-a-005fe6	job-4d-a-005fe6	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 03:44:25.343379	2026-10-06 03:44:25.343387
avail-1261538c	org-4d-a-513aed	rec-4d-a-513aed	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 03:44:31.18926	2026-10-06 03:44:31.189266
avail-ea09d4dc	org-sched-a-9293b1	rec-a-c8c241	job-sched-649586	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 03:44:33.917792	2026-10-06 03:44:33.917803
avail-a7a2ceae	org-sched-a-de4121	rec-a-bfc40b	job-sched-cc5b0f	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 03:44:36.770473	2026-10-06 03:44:36.770478
avail-edfce105	org-4d-a-ff925c	rec-4d-a-ff925c	job-4d-a-ff925c	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 03:44:58.282478	2026-10-06 03:44:58.282483
avail-20026b4a	org-4d-a-760681	rec-4d-a-760681	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 03:45:03.51153	2026-10-06 03:45:03.511539
avail-790ef2e2	org-sched-a-195fae	rec-a-ce0421	job-sched-285e85	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 03:45:06.269508	2026-10-06 03:45:06.269512
avail-76a3bf03	org-sched-a-352719	rec-a-c410c8	job-sched-568514	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 03:45:09.001445	2026-10-06 03:45:09.001452
avail-bd068821	org-4d-a-abc84c	rec-4d-a-abc84c	job-4d-a-abc84c	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 03:52:45.135884	2026-10-06 03:52:45.135897
avail-8ef90604	org-4d-a-4f8705	rec-4d-a-4f8705	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 03:52:46.248995	2026-10-06 03:52:46.249001
avail-50e917f1	org-sched-a-55037f	rec-a-ee5597	job-sched-e8a49f	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 03:52:46.761431	2026-10-06 03:52:46.761434
avail-82bfdc72	org-sched-a-a22b38	rec-a-0bce54	job-sched-f86ee5	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 03:52:47.126308	2026-10-06 03:52:47.12631
avail-70c6dd28	org-4d-a-af78f0	rec-4d-a-af78f0	job-4d-a-af78f0	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 04:01:35.326086	2026-10-06 04:01:35.326092
avail-b4848b69	org-4d-a-f9da14	rec-4d-a-f9da14	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 04:01:37.28498	2026-10-06 04:01:37.284984
avail-27c26e5d	org-sched-a-6e5174	rec-a-0cb6b8	job-sched-769a2d	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 04:01:38.574921	2026-10-06 04:01:38.574927
avail-1c260c31	org-sched-a-10c79b	rec-a-b10509	job-sched-e36224	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 04:01:39.384253	2026-10-06 04:01:39.384261
avail-617a0171	org-4d-a-2a7246	rec-4d-a-2a7246	job-4d-a-2a7246	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 04:13:36.604463	2026-10-06 04:13:36.604472
avail-c20cab99	org-4d-a-857c1f	rec-4d-a-857c1f	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 04:13:37.542154	2026-10-06 04:13:37.542165
avail-462f4d64	org-sched-a-314b09	rec-a-14229a	job-sched-83a004	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 04:13:38.122901	2026-10-06 04:13:38.122907
avail-863fb42a	org-sched-a-458db6	rec-a-13dfc4	job-sched-5c0f13	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 04:13:38.590854	2026-10-06 04:13:38.590862
avail-3ef9d7aa	org-4d-a-a1457c	rec-4d-a-a1457c	job-4d-a-a1457c	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 05:31:22.201794	2026-10-06 05:31:22.201803
avail-110e14e6	org-4d-a-7263eb	rec-4d-a-7263eb	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 05:31:23.276018	2026-10-06 05:31:23.276025
avail-ae6faee8	org-sched-a-b05cb8	rec-a-da0e0d	job-sched-7291a5	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 05:31:24.18322	2026-10-06 05:31:24.183228
avail-6ff98858	org-sched-a-01156a	rec-a-209604	job-sched-2dd6b5	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 05:31:24.77465	2026-10-06 05:31:24.774654
avail-12592dfb	org-4d-a-75b072	rec-4d-a-75b072	job-4d-a-75b072	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 05:31:39.885704	2026-10-06 05:31:39.88571
avail-c9b63e6a	org-4d-a-bb2dbc	rec-4d-a-bb2dbc	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 05:31:41.115732	2026-10-06 05:31:41.115745
avail-e6610c72	org-sched-a-f5e2d2	rec-a-5d5335	job-sched-88bd10	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 05:31:42.012901	2026-10-06 05:31:42.01291
avail-155fb107	org-sched-a-6d1c83	rec-a-af1c7e	job-sched-c62237	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 05:31:42.787946	2026-10-06 05:31:42.787952
avail-a8c59e35	org-4d-a-b036fa	rec-4d-a-b036fa	job-4d-a-b036fa	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 15:42:30.782583	2026-10-06 15:42:30.782588
avail-4a5928e4	org-4d-a-8526e5	rec-4d-a-8526e5	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 15:42:32.10743	2026-10-06 15:42:32.107433
avail-be96d5e4	org-sched-a-4691ba	rec-a-24ab3a	job-sched-ac3f90	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 15:42:32.840883	2026-10-06 15:42:32.840885
avail-d5fac013	org-sched-a-9506de	rec-a-925ccb	job-sched-ddea99	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 15:42:33.534422	2026-10-06 15:42:33.534426
avail-3405f94a	org-4d-a-84e988	rec-4d-a-84e988	job-4d-a-84e988	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 15:42:56.873327	2026-10-06 15:42:56.873331
avail-8e4d92a8	org-4d-a-1b8293	rec-4d-a-1b8293	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 15:42:57.759562	2026-10-06 15:42:57.759565
avail-a77ab778	org-sched-a-1d5e05	rec-a-948e11	job-sched-deaaf1	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 15:42:58.342771	2026-10-06 15:42:58.342773
avail-b9b6bdec	org-sched-a-f1a48d	rec-a-6c3d91	job-sched-bc169d	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 15:42:58.928029	2026-10-06 15:42:58.928034
avail-5eab563d	org-4d-a-decfed	rec-4d-a-decfed	job-4d-a-decfed	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 15:45:10.206165	2026-10-06 15:45:10.206168
avail-a5c708d9	org-4d-a-dc9174	rec-4d-a-dc9174	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 15:45:11.547665	2026-10-06 15:45:11.547668
avail-dcdb1305	org-sched-a-0d6c8c	rec-a-732532	job-sched-cc1b5d	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 15:45:12.332705	2026-10-06 15:45:12.33271
avail-8cf43d61	org-sched-a-a6207b	rec-a-f01743	job-sched-b7a811	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 15:45:13.139275	2026-10-06 15:45:13.139279
avail-1e258f18	org-4d-a-bd822b	rec-4d-a-bd822b	job-4d-a-bd822b	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 15:54:01.959201	2026-10-06 15:54:01.95921
avail-de601a60	org-4d-a-9f854d	rec-4d-a-9f854d	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 15:54:03.560673	2026-10-06 15:54:03.560675
avail-e9c4d58c	org-sched-a-4878b7	rec-a-5f4d4d	job-sched-9fb277	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 15:54:04.479612	2026-10-06 15:54:04.479615
avail-e452d743	org-sched-a-4eda98	rec-a-ee45e5	job-sched-174bd2	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 15:54:05.245525	2026-10-06 15:54:05.245528
avail-2290f124	org-4d-a-a7e8d8	rec-4d-a-a7e8d8	job-4d-a-a7e8d8	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 15:54:20.813493	2026-10-06 15:54:20.813496
avail-cc68986d	org-4d-a-c8e711	rec-4d-a-c8e711	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 15:54:21.974447	2026-10-06 15:54:21.974449
avail-1d24bbef	org-sched-a-a80be4	rec-a-269b20	job-sched-1262fc	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 15:54:22.967713	2026-10-06 15:54:22.967721
avail-594d33e7	org-sched-a-4b08d9	rec-a-f1485b	job-sched-44341c	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 15:54:23.698512	2026-10-06 15:54:23.698515
avail-d4d19028	org-4d-a-323ce5	rec-4d-a-323ce5	job-4d-a-323ce5	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 16:08:40.872584	2026-10-06 16:08:40.872599
avail-72cfcc70	org-4d-a-506bc0	rec-4d-a-506bc0	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 16:08:44.667842	2026-10-06 16:08:44.667859
avail-e32c86c4	org-sched-a-4c3030	rec-a-65908c	job-sched-10ddb1	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 16:08:47.303331	2026-10-06 16:08:47.303348
avail-3cbb5f6f	org-sched-a-426ddd	rec-a-02825e	job-sched-534f1e	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 16:08:49.256124	2026-10-06 16:08:49.256131
avail-e61d6387	org-4d-a-ef5bfd	rec-4d-a-ef5bfd	job-4d-a-ef5bfd	2026-10-08	10:00	11:00	UTC	30	0	t	2026-10-06 16:26:56.15711	2026-10-06 16:26:56.157117
avail-ec356b3f	org-4d-a-d7c0da	rec-4d-a-d7c0da	\N	2026-10-09	14:00	15:00	UTC	30	15	t	2026-10-06 16:26:57.462066	2026-10-06 16:26:57.462069
avail-f3665fdb	org-sched-a-35a31e	rec-a-9ae73a	job-sched-e3a6f3	2026-10-09	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-06 16:26:58.224988	2026-10-06 16:26:58.224995
avail-add6ebf5	org-sched-a-babff0	rec-a-a269d2	job-sched-8318e9	2026-10-12	14:00	16:00	UTC	30	15	t	2026-10-06 16:26:58.829711	2026-10-06 16:26:58.82972
avail-36b5084b	org-4d-a-3e23ba	rec-4d-a-3e23ba	job-4d-a-3e23ba	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 03:16:36.675117	2026-10-07 03:16:36.675128
avail-52a9dd6b	org-4d-a-24983e	rec-4d-a-24983e	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 03:16:37.934947	2026-10-07 03:16:37.934955
avail-87d3994a	org-sched-a-6c9e15	rec-a-a85b42	job-sched-786b48	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 03:16:38.68122	2026-10-07 03:16:38.681226
avail-e352d138	org-sched-a-57a63c	rec-a-b38cbc	job-sched-9425d2	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 03:16:39.26912	2026-10-07 03:16:39.269124
avail-e0526e64	org-4d-a-dfe12c	rec-4d-a-dfe12c	job-4d-a-dfe12c	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 03:45:27.190954	2026-10-07 03:45:27.190956
avail-6bbf9e81	org-4d-a-811c87	rec-4d-a-811c87	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 03:45:28.067319	2026-10-07 03:45:28.067321
avail-7833b8f9	org-sched-a-fd18b8	rec-a-7d1efd	job-sched-62ae5f	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 03:45:28.474234	2026-10-07 03:45:28.47424
avail-83ce77bc	org-sched-a-8f358d	rec-a-679a12	job-sched-c59510	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 03:45:28.841281	2026-10-07 03:45:28.841286
avail-53af700a	org-sched-a-adf906	rec-a-97b026	job-sched-4489ca	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 04:18:24.175544	2026-10-07 04:18:24.175548
avail-00aea61c	org-sched-b-f8e8e9	rec-b-a3c5b5	\N	2026-10-11	10:00	16:00	UTC	30	15	t	2026-10-07 04:18:27.057838	2026-10-07 04:18:27.057851
avail-f23ea650	org-sched-a-d426a6	rec-a-441a69	job-sched-c5b7de	2026-10-12	10:00	13:00	UTC	30	15	t	2026-10-07 04:18:27.801989	2026-10-07 04:18:27.801996
avail-db10f7ec	org-sched-a-b669e3	rec-a-b71b40	job-sched-92623d	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 04:18:28.566101	2026-10-07 04:18:28.566111
avail-8a8698fb	org-sched-a-731962	rec-a-a8904a	job-sched-a7392b	2026-10-14	10:00	11:00	UTC	30	0	t	2026-10-07 04:18:29.43832	2026-10-07 04:18:29.438328
avail-5ec67a65	org-sched-a-67a986	rec-a-351d0b	job-sched-c41235	2026-10-15	09:00	10:00	UTC	30	0	t	2026-10-07 04:18:30.287877	2026-10-07 04:18:30.287887
avail-e0638666	org-sched-a-499680	rec-a-8dd093	job-sched-8c90ab	2026-10-16	14:00	16:00	UTC	30	0	t	2026-10-07 04:18:31.1476	2026-10-07 04:18:31.147607
avail-68160016	org-sched-a-487e69	rec-a-75b921	job-sched-fbbb6d	2026-10-17	11:00	12:00	UTC	30	0	t	2026-10-07 04:18:32.330491	2026-10-07 04:18:32.330497
avail-edf89a1f	org-sched-a-634365	rec-a-1c3938	job-sched-04e554	2026-10-19	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-07 04:18:33.162275	2026-10-07 04:18:33.162279
avail-628d4957	org-sched-a-5a0b97	rec-a-d43740	job-sched-b43cd5	2026-10-21	10:00	11:00	UTC	30	0	t	2026-10-07 04:18:33.735057	2026-10-07 04:18:33.735066
avail-b4652224	org-sched-a-a56479	rec-a-aa70e0	\N	2026-10-22	10:00	11:00	UTC	30	15	t	2026-10-07 04:18:34.46455	2026-10-07 04:18:34.464567
avail-f7169c0f	org-sched-a-bee415	rec-a-1e8238	\N	2026-10-23	09:00	12:00	UTC	30	15	t	2026-10-07 04:18:35.300968	2026-10-07 04:18:35.300981
avail-9e586947	org-4d-a-3aa17d	rec-4d-a-3aa17d	job-4d-a-3aa17d	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 04:18:38.080633	2026-10-07 04:18:38.080636
avail-61acf9fb	org-4d-a-0efa05	rec-4d-a-0efa05	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 04:18:43.990577	2026-10-07 04:18:43.990582
avail-419e60f5	org-4d-a-f8618d	rec-4d-a-f8618d	\N	2026-10-11	16:00	17:00	UTC	30	15	t	2026-10-07 04:18:45.194336	2026-10-07 04:18:45.194343
avail-04f9285b	org-4d-a-3b2c13	rec-4d-a-3b2c13	job-4d-a-3b2c13	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 04:18:55.729509	2026-10-07 04:18:55.729518
avail-212381cb	org-4d-a-e42eb6	rec-4d-a-e42eb6	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 04:18:57.6791	2026-10-07 04:18:57.679104
avail-921a207a	org-sched-a-785058	rec-a-712840	job-sched-1388d4	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 04:18:59.017095	2026-10-07 04:18:59.017106
avail-5a2127b8	org-sched-a-a8d2e7	rec-a-8d5dea	job-sched-6be4b6	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 04:19:00.283578	2026-10-07 04:19:00.283589
avail-8c1f09b4	org-4d-a-db7c6d	rec-4d-a-db7c6d	job-4d-a-db7c6d	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 04:19:15.006757	2026-10-07 04:19:15.006766
avail-f9882fae	org-4d-a-9dff58	rec-4d-a-9dff58	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 04:19:16.920866	2026-10-07 04:19:16.920873
avail-dd74a6c4	org-sched-a-14ba59	rec-a-afc113	job-sched-6e5d53	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 04:19:18.050202	2026-10-07 04:19:18.050207
avail-eeb438d6	org-sched-a-85f725	rec-a-363af5	job-sched-f022dc	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 04:19:19.019509	2026-10-07 04:19:19.019515
avail-4e3c2901	org-sched-a-017767	rec-a-adf8de	job-sched-03156e	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 05:17:19.690641	2026-10-07 05:17:19.690643
avail-d38c0d57	org-sched-b-4a2324	rec-b-d9a2ff	\N	2026-10-11	10:00	16:00	UTC	30	15	t	2026-10-07 05:17:23.372443	2026-10-07 05:17:23.372447
avail-73942080	org-sched-a-83409b	rec-a-6b11f9	job-sched-cdb0e7	2026-10-12	10:00	13:00	UTC	30	15	t	2026-10-07 05:17:24.61849	2026-10-07 05:17:24.618497
avail-bc1f55d5	org-sched-a-7bbd75	rec-a-0e2e9d	job-sched-5e4cfe	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 05:17:25.831842	2026-10-07 05:17:25.831846
avail-18ae6a44	org-sched-a-117f8e	rec-a-3b216c	job-sched-290f4d	2026-10-14	10:00	11:00	UTC	30	0	t	2026-10-07 05:17:27.022922	2026-10-07 05:17:27.022926
avail-ac6da692	org-sched-a-c134f8	rec-a-0cff81	job-sched-060c2e	2026-10-15	09:00	10:00	UTC	30	0	t	2026-10-07 05:17:28.174704	2026-10-07 05:17:28.174712
avail-a6a00151	org-sched-a-40f921	rec-a-c7c863	job-sched-908221	2026-10-16	14:00	16:00	UTC	30	0	t	2026-10-07 05:17:29.388313	2026-10-07 05:17:29.38832
avail-5718229a	org-sched-a-0c9ada	rec-a-d91769	job-sched-1aa7a0	2026-10-17	11:00	12:00	UTC	30	0	t	2026-10-07 05:17:30.623824	2026-10-07 05:17:30.62383
avail-6cc96148	org-sched-a-b2b2f1	rec-a-bd313c	job-sched-06e7fd	2026-10-19	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-07 05:17:31.723992	2026-10-07 05:17:31.723998
avail-914b9049	org-sched-a-6a722c	rec-a-441ff9	job-sched-809b73	2026-10-21	10:00	11:00	UTC	30	0	t	2026-10-07 05:17:32.969796	2026-10-07 05:17:32.969802
avail-baf4ee91	org-sched-a-a4ead0	rec-a-a107c3	\N	2026-10-22	10:00	11:00	UTC	30	15	t	2026-10-07 05:17:34.168163	2026-10-07 05:17:34.168171
avail-038e3631	org-sched-a-2df1c4	rec-a-f06d03	\N	2026-10-23	09:00	12:00	UTC	30	15	t	2026-10-07 05:17:35.168557	2026-10-07 05:17:35.168562
avail-76d658cb	org-4d-a-51c14a	rec-4d-a-51c14a	job-4d-a-51c14a	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 05:17:37.02325	2026-10-07 05:17:37.023252
avail-1a2aa027	org-4d-a-718d01	rec-4d-a-718d01	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 05:17:44.378402	2026-10-07 05:17:44.378409
avail-17b64467	org-4d-a-195dfd	rec-4d-a-195dfd	\N	2026-10-11	16:00	17:00	UTC	30	15	t	2026-10-07 05:17:46.512888	2026-10-07 05:17:46.512893
avail-4785331d	org-4d-a-344bfa	rec-4d-a-344bfa	job-4d-a-344bfa	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 05:17:58.54629	2026-10-07 05:17:58.546296
avail-72bdb5ce	org-4d-a-443986	rec-4d-a-443986	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 05:18:01.017031	2026-10-07 05:18:01.017039
avail-3913274a	org-sched-a-0ab5f7	rec-a-b57ae1	job-sched-85c6e4	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 05:18:02.464024	2026-10-07 05:18:02.46403
avail-a2886abd	org-sched-a-7026a5	rec-a-248fe3	job-sched-236b30	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 05:18:03.76134	2026-10-07 05:18:03.761346
avail-c7b6c830	org-4d-a-810f96	rec-4d-a-810f96	job-4d-a-810f96	2026-10-09	10:00	11:00	UTC	30	0	t	2026-10-07 05:18:16.299068	2026-10-07 05:18:16.299075
avail-6655dd5a	org-4d-a-f5a395	rec-4d-a-f5a395	\N	2026-10-10	14:00	15:00	UTC	30	15	t	2026-10-07 05:18:19.333875	2026-10-07 05:18:19.333881
avail-1eb19d02	org-sched-a-afcc68	rec-a-338f00	job-sched-53af2d	2026-10-10	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-07 05:18:21.042696	2026-10-07 05:18:21.042705
avail-fb3ec49b	org-sched-a-7d4202	rec-a-fab957	job-sched-f25d74	2026-10-13	14:00	16:00	UTC	30	15	t	2026-10-07 05:18:22.515569	2026-10-07 05:18:22.515576
avail-0b84e7de	org-sched-a-ad6af5	rec-a-01ad2c	job-sched-5430ee	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 03:21:55.830627	2026-10-08 03:21:55.830629
avail-0a8cbdcd	org-sched-b-fcb182	rec-b-cf8141	\N	2026-10-12	10:00	16:00	UTC	30	15	t	2026-10-08 03:21:59.959774	2026-10-08 03:21:59.959776
avail-a83d96de	org-sched-a-0e6b8e	rec-a-7dd1e7	job-sched-42d2bb	2026-10-13	10:00	13:00	UTC	30	15	t	2026-10-08 03:22:01.086084	2026-10-08 03:22:01.086089
avail-e5028f57	org-sched-a-c60b47	rec-a-d9415e	job-sched-5c1eb3	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 03:22:02.288802	2026-10-08 03:22:02.288805
avail-3a0f9dff	org-sched-a-4a83dd	rec-a-b330e8	job-sched-7c2778	2026-10-15	10:00	11:00	UTC	30	0	t	2026-10-08 03:22:03.527086	2026-10-08 03:22:03.527088
avail-3f81bf88	org-sched-a-fe0883	rec-a-fd9ebc	job-sched-3318f7	2026-10-16	09:00	10:00	UTC	30	0	t	2026-10-08 03:22:04.49606	2026-10-08 03:22:04.496062
avail-a2fc406d	org-sched-a-9c0344	rec-a-a0412e	job-sched-03300d	2026-10-17	14:00	16:00	UTC	30	0	t	2026-10-08 03:22:05.457433	2026-10-08 03:22:05.457436
avail-85235fe4	org-sched-a-71f037	rec-a-08e8e0	job-sched-f42d73	2026-10-18	11:00	12:00	UTC	30	0	t	2026-10-08 03:22:07.099206	2026-10-08 03:22:07.099215
avail-c990d295	org-sched-a-d9e508	rec-a-d73dc5	job-sched-4d6858	2026-10-20	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-08 03:22:08.612973	2026-10-08 03:22:08.612977
avail-e27bf42f	org-sched-a-b2c25d	rec-a-398325	job-sched-37c641	2026-10-22	10:00	11:00	UTC	30	0	t	2026-10-08 03:22:10.222425	2026-10-08 03:22:10.22243
avail-b1489711	org-sched-a-39225b	rec-a-ccd216	\N	2026-10-23	10:00	11:00	UTC	30	15	t	2026-10-08 03:22:12.690886	2026-10-08 03:22:12.690893
avail-cac9cd4d	org-sched-a-8089d8	rec-a-07eb75	\N	2026-10-24	09:00	12:00	UTC	30	15	t	2026-10-08 03:22:14.454547	2026-10-08 03:22:14.454556
avail-6d586583	org-4d-a-a48d8f	rec-4d-a-a48d8f	job-4d-a-a48d8f	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 03:22:16.61971	2026-10-08 03:22:16.619713
avail-22abe2e9	org-4d-a-5e406f	rec-4d-a-5e406f	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 03:22:25.142415	2026-10-08 03:22:25.14242
avail-5f942947	org-4d-a-6fff51	rec-4d-a-6fff51	\N	2026-10-12	16:00	17:00	UTC	30	15	t	2026-10-08 03:22:28.315625	2026-10-08 03:22:28.31563
avail-dd249e75	org-4d-a-97d97e	rec-4d-a-97d97e	job-4d-a-97d97e	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 03:22:46.283674	2026-10-08 03:22:46.283677
avail-12f02327	org-4d-a-748686	rec-4d-a-748686	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 03:22:48.994821	2026-10-08 03:22:48.994823
avail-095a798e	org-sched-a-73e1f7	rec-a-50f5bd	job-sched-e60a40	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 03:22:50.300304	2026-10-08 03:22:50.300307
avail-1fea5c46	org-sched-a-141232	rec-a-51f80d	job-sched-57408e	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 03:22:52.222234	2026-10-08 03:22:52.222241
avail-7e5b2294	org-4d-a-0c82dc	rec-4d-a-0c82dc	job-4d-a-0c82dc	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 03:23:08.909392	2026-10-08 03:23:08.909399
avail-11668793	org-4d-a-7bc525	rec-4d-a-7bc525	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 03:23:12.703061	2026-10-08 03:23:12.703066
avail-0c84fef5	org-sched-a-b4b4bb	rec-a-6b1b0d	job-sched-0e546c	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 03:23:14.724962	2026-10-08 03:23:14.724969
avail-a6b5520c	org-sched-a-3d34a6	rec-a-530d91	job-sched-096991	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 03:23:16.649158	2026-10-08 03:23:16.649164
avail-bc52591e	org-sched-a-be43f1	rec-a-332eef	job-sched-5fe57a	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 04:29:20.699981	2026-10-08 04:29:20.699983
avail-c0ab10d1	org-sched-b-e2a9c6	rec-b-457ad1	\N	2026-10-12	10:00	16:00	UTC	30	15	t	2026-10-08 04:29:29.224473	2026-10-08 04:29:29.224476
avail-2ad6d325	org-sched-a-f76c45	rec-a-b21a50	job-sched-17565f	2026-10-13	10:00	13:00	UTC	30	15	t	2026-10-08 04:29:31.12051	2026-10-08 04:29:31.120512
avail-fa335dba	org-sched-a-1c2c4a	rec-a-2de3de	job-sched-7b6c9e	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 04:29:33.534289	2026-10-08 04:29:33.534295
avail-8702ec32	org-sched-a-5bf47c	rec-a-56c25d	job-sched-6cca04	2026-10-15	10:00	11:00	UTC	30	0	t	2026-10-08 04:29:35.999649	2026-10-08 04:29:35.99965
avail-67fd5af4	org-sched-a-c787bf	rec-a-6c4a3c	job-sched-d3d0b3	2026-10-16	09:00	10:00	UTC	30	0	t	2026-10-08 04:29:37.893478	2026-10-08 04:29:37.893481
avail-e502999b	org-sched-a-c819c7	rec-a-9d7b3d	job-sched-f53e17	2026-10-17	14:00	16:00	UTC	30	0	t	2026-10-08 04:29:39.934597	2026-10-08 04:29:39.9346
avail-a3b4f78e	org-sched-a-4740ea	rec-a-b1dc98	job-sched-8098c6	2026-10-18	11:00	12:00	UTC	30	0	t	2026-10-08 04:29:42.64463	2026-10-08 04:29:42.644634
avail-72a40de8	org-sched-a-636faf	rec-a-f6c3b8	job-sched-a721ad	2026-10-20	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-08 04:29:45.281974	2026-10-08 04:29:45.281978
avail-23e972c4	org-sched-a-d43676	rec-a-c59802	job-sched-2df635	2026-10-22	10:00	11:00	UTC	30	0	t	2026-10-08 04:29:47.57216	2026-10-08 04:29:47.572166
avail-e6e181b9	org-sched-a-aff1de	rec-a-7b57ba	\N	2026-10-23	10:00	11:00	UTC	30	15	t	2026-10-08 04:29:49.980354	2026-10-08 04:29:49.980361
avail-93a44dc4	org-sched-a-3efaaf	rec-a-7b2aef	\N	2026-10-24	09:00	12:00	UTC	30	15	t	2026-10-08 04:29:52.461685	2026-10-08 04:29:52.461688
avail-a37ef6e2	org-4d-a-108b7b	rec-4d-a-108b7b	job-4d-a-108b7b	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 04:29:55.356208	2026-10-08 04:29:55.35621
avail-5e5f39f5	org-4d-a-d83f4b	rec-4d-a-d83f4b	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 04:30:08.74574	2026-10-08 04:30:08.745743
avail-44595be7	org-4d-a-974fe1	rec-4d-a-974fe1	\N	2026-10-12	16:00	17:00	UTC	30	15	t	2026-10-08 04:30:13.571066	2026-10-08 04:30:13.571069
avail-538444ad	org-4d-a-9a7d54	rec-4d-a-9a7d54	job-4d-a-9a7d54	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 04:30:36.011407	2026-10-08 04:30:36.011409
avail-2f692387	org-4d-a-672854	rec-4d-a-672854	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 04:30:39.257192	2026-10-08 04:30:39.257194
avail-5936a3ff	org-sched-a-538300	rec-a-623992	job-sched-1819f3	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 04:30:40.787912	2026-10-08 04:30:40.787914
avail-aa52feae	org-sched-a-0fd40f	rec-a-ec7c3e	job-sched-ec8099	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 04:30:42.288731	2026-10-08 04:30:42.288733
avail-b76bc3f0	org-4d-a-87bdef	rec-4d-a-87bdef	job-4d-a-87bdef	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 04:30:59.09175	2026-10-08 04:30:59.091752
avail-e600ef56	org-4d-a-2f0735	rec-4d-a-2f0735	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 04:31:02.782666	2026-10-08 04:31:02.782668
avail-f5482029	org-sched-a-8d007f	rec-a-011bac	job-sched-4e1493	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 04:31:05.711072	2026-10-08 04:31:05.71108
avail-c55c5788	org-sched-a-4879d5	rec-a-9cb21c	job-sched-6bf8ad	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 04:31:08.508819	2026-10-08 04:31:08.508825
avail-366e63ee	org-sched-a-172ce1	rec-a-0cdc6f	job-sched-e033cf	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 08:32:43.345866	2026-10-08 08:32:43.34587
avail-1678859b	org-sched-b-21dd76	rec-b-07073e	\N	2026-10-12	10:00	16:00	UTC	30	15	t	2026-10-08 08:32:55.084283	2026-10-08 08:32:55.084285
avail-1022ede6	org-sched-a-8b309a	rec-a-e8ca95	job-sched-158a92	2026-10-13	10:00	13:00	UTC	30	15	t	2026-10-08 08:32:57.255045	2026-10-08 08:32:57.255047
avail-50335b0b	org-sched-a-4409ca	rec-a-f99dff	job-sched-022c75	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 08:32:59.138578	2026-10-08 08:32:59.13858
avail-e245270b	org-sched-a-49adeb	rec-a-4755cf	job-sched-78b1c6	2026-10-15	10:00	11:00	UTC	30	0	t	2026-10-08 08:33:00.920314	2026-10-08 08:33:00.920316
avail-7a9d32dd	org-sched-a-a868dc	rec-a-399b9d	job-sched-42320d	2026-10-16	09:00	10:00	UTC	30	0	t	2026-10-08 08:33:02.856012	2026-10-08 08:33:02.856014
avail-8eb400f1	org-sched-a-39fc6a	rec-a-71dbcf	job-sched-1c8cd0	2026-10-17	14:00	16:00	UTC	30	0	t	2026-10-08 08:33:04.657981	2026-10-08 08:33:04.657983
avail-7e025f2f	org-sched-a-83513c	rec-a-3c5bd0	job-sched-7f29d8	2026-10-18	11:00	12:00	UTC	30	0	t	2026-10-08 08:33:06.4773	2026-10-08 08:33:06.477303
avail-62136645	org-sched-a-05d7f7	rec-a-675fc2	job-sched-14e1b0	2026-10-20	15:30	17:30	Asia/Kolkata	30	0	t	2026-10-08 08:33:08.415608	2026-10-08 08:33:08.415611
avail-653cde50	org-sched-a-c5fbba	rec-a-2dbb15	job-sched-0df408	2026-10-22	10:00	11:00	UTC	30	0	t	2026-10-08 08:33:10.356633	2026-10-08 08:33:10.356635
avail-7816b32c	org-sched-a-b2b60a	rec-a-9a269b	\N	2026-10-23	10:00	11:00	UTC	30	15	t	2026-10-08 08:33:12.208973	2026-10-08 08:33:12.208982
avail-63d75589	org-sched-a-25eeb7	rec-a-852430	\N	2026-10-24	09:00	12:00	UTC	30	15	t	2026-10-08 08:33:14.136074	2026-10-08 08:33:14.136076
avail-a7b813a4	org-4d-a-789c68	rec-4d-a-789c68	job-4d-a-789c68	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 08:33:17.430078	2026-10-08 08:33:17.43008
avail-e7f2f5cb	org-4d-a-cd5318	rec-4d-a-cd5318	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 08:33:28.15412	2026-10-08 08:33:28.154122
avail-c0ff11db	org-4d-a-529233	rec-4d-a-529233	\N	2026-10-12	16:00	17:00	UTC	30	15	t	2026-10-08 08:33:32.191375	2026-10-08 08:33:32.191377
avail-012f4ab5	org-4d-a-2d1529	rec-4d-a-2d1529	job-4d-a-2d1529	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 08:33:54.25753	2026-10-08 08:33:54.257533
avail-24703bb7	org-4d-a-cd03db	rec-4d-a-cd03db	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 08:33:58.983437	2026-10-08 08:33:58.98344
avail-014da86b	org-sched-a-f99f42	rec-a-9a4193	job-sched-6b1de7	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 08:34:02.066693	2026-10-08 08:34:02.066702
avail-059d2022	org-sched-a-6186f5	rec-a-ed3484	job-sched-4420dd	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 08:34:05.646286	2026-10-08 08:34:05.646289
avail-18aaa2b2	org-4d-a-4dc2e6	rec-4d-a-4dc2e6	job-4d-a-4dc2e6	2026-10-10	10:00	11:00	UTC	30	0	t	2026-10-08 08:34:33.913757	2026-10-08 08:34:33.913764
avail-0471e4d2	org-4d-a-915745	rec-4d-a-915745	\N	2026-10-11	14:00	15:00	UTC	30	15	t	2026-10-08 08:34:42.230499	2026-10-08 08:34:42.230502
avail-c0a3bfbb	org-sched-a-b9bee1	rec-a-038789	job-sched-c87c3f	2026-10-11	09:00	17:00	Asia/Kolkata	30	15	t	2026-10-08 08:34:45.07147	2026-10-08 08:34:45.071472
avail-438b638f	org-sched-a-7d9f4c	rec-a-bd3c5b	job-sched-72f5e8	2026-10-14	14:00	16:00	UTC	30	15	t	2026-10-08 08:34:47.36666	2026-10-08 08:34:47.366663
\.


--
-- Data for Name: recruiter_invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recruiter_invitations (id, invite_code, created_by, recipient_email, used_at, created_at) FROM stdin;
inv-4a83fc96	INV-0f00de8054	\N	rec_auth_82f676@example.com	2026-09-23 09:14:17.673475	2026-09-23 09:14:17.654289
inv-db07fb9e	INV-724c4c5626	\N	rec_auth_ebddc9@example.com	2026-09-23 09:30:19.594326	2026-09-23 09:30:19.565684
inv-61258f7a	INV-5e0b37fca6	\N	rec_auth_d7c21a@example.com	2026-09-23 09:31:37.930028	2026-09-23 09:31:37.886778
inv-db81f2d4	INV-02e8e5e63d	\N	rec_auth_bcd753@example.com	2026-09-23 10:29:22.693587	2026-09-23 10:29:22.654644
inv-fa970a17	INV-db49b01cf2	\N	rec_auth_dbf5d8@example.com	2026-09-23 11:25:49.820957	2026-09-23 11:25:49.80031
inv-4fbd21ea	INV-445bf63844	\N	rec_auth_d9bd66@example.com	2026-09-23 11:56:21.414454	2026-09-23 11:56:21.386958
inv-661d34b8	INV-8bba68d88b	\N	rec_auth_3db65b@example.com	2026-09-23 13:09:06.154157	2026-09-23 13:09:06.130082
inv-229cb5cc	INV-5bab0c89b4	\N	rec_auth_0fda47@example.com	2026-09-23 13:22:41.010242	2026-09-23 13:22:40.98312
inv-0b901420	INV-f6e52d439b	\N	rec_auth_b5442b@example.com	2026-09-23 15:54:17.454444	2026-09-23 15:54:17.438516
inv-841ee10f	INV-8f735389b9	\N	rec_auth_381615@example.com	2026-09-23 16:14:40.095213	2026-09-23 16:14:40.06966
inv-58ee6dbe	INV-96f9665783	\N	rec_auth_88db76@example.com	2026-09-23 16:28:31.878567	2026-09-23 16:28:31.858383
inv-0467aedd	INV-0bc87d4eb7	\N	rec_auth_c5a16b@example.com	2026-09-23 16:40:27.85791	2026-09-23 16:40:27.761052
inv-1ba433fb	INV-318982766b	\N	rec_auth_62cdbe@example.com	2026-09-23 17:26:07.003346	2026-09-23 17:26:06.986083
inv-e0eab5dd	INV-725de19c03	\N	rec_auth_d1e438@example.com	2026-09-24 04:18:52.400095	2026-09-24 04:18:52.391385
inv-ddd7f232	INV-097ffaa87f	\N	rec_auth_b34c66@example.com	2026-09-24 04:56:00.422541	2026-09-24 04:56:00.394564
inv-d0ce7225	INV-ed8ec6cc4e	\N	rec_auth_d2f3c2@example.com	2026-09-28 04:08:33.674973	2026-09-28 04:08:33.646346
inv-b3262d0e	INV-58491a7c0e	\N	rec_auth_73c5ce@example.com	2026-09-28 04:18:03.09653	2026-09-28 04:18:03.066056
inv-27617ed0	INV-0862729225	\N	rec_auth_6342bc@example.com	2026-09-28 12:46:42.640889	2026-09-28 12:46:42.62934
inv-54a06b5e	INV-8309eed55e	\N	rec_auth_bdac19@example.com	2026-09-28 16:59:00.259058	2026-09-28 16:59:00.235759
inv-3617bbbc	INV-d9e7a03206	\N	rec_auth_81786d@example.com	2026-10-07 04:50:20.668203	2026-10-07 04:50:20.649056
inv-55a01d8f	INV-a43752070d	\N	rec_auth_dfdae1@example.com	2026-10-07 04:51:58.654115	2026-10-07 04:51:58.628843
inv-0f73b827	INV-03b696e9a7	\N	rec_auth_5436e2@example.com	2026-10-07 05:10:42.0258	2026-10-07 05:10:42.006028
inv-02694270	INV-fd47e0cc96	\N	rec_auth_e5283b@example.com	2026-10-07 05:18:42.229764	2026-10-07 05:18:42.208387
inv-12db11bd	INV-ad1fb3ab93	\N	rec_auth_5eba8e@example.com	2026-10-08 03:23:38.9683	2026-10-08 03:23:38.950884
inv-c09dbb31	INV-8f8dc3d8b8	\N	rec_auth_b9f237@example.com	2026-10-08 04:31:40.2597	2026-10-08 04:31:40.227877
inv-1888279b	INV-8b68a9bcdf	\N	rec_auth_77eae6@example.com	2026-10-08 08:35:49.538239	2026-10-08 08:35:49.524962
\.


--
-- Data for Name: resume_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resume_documents (id, user_id, organization_id, title, target_job_id, target_job_title, is_base_resume, contact_info, summary, experience, education, skills, projects, certifications, languages, awards, volunteering, version, parent_resume_id, change_summary, created_at, updated_at) FROM stdin;
res-bc2967540e	usr-83acba73	org-sparkx-default	Burhan's Base Resume	\N	\N	t	{"full_name": "Burhan Kapasi", "email": "burhan.kapasi985@gmail.com", "phone": "7201888684", "location": "", "headline": "AWS Cloud Engineer ", "linkedin_url": "", "github_url": "", "portfolio_url": ""}	Parsed from Burhan Kapasi - Resume.pdf: Core skills in Go.	[{"id": "exp-d60f0d", "title": "AWS", "company": "", "location": "", "start_date": "", "end_date": "Present", "is_current": true, "bullets": [], "technologies": ["AWS", "Linux", "Terraform"]}]	[{"id": "edu-d7239f", "degree": "Btech IT", "institution": "", "field_of_study": "", "start_year": "", "graduation_year": "", "gpa": ""}]	["AWS", "Linux", "Terraform"]	[{"id": "proj-mv3ahz17", "name": "Realtime ", "role": "", "description": "", "url": "", "technologies": [], "bullets": [""]}]	[]	[]	[]	[]	1	\N	Updated resume details	2026-10-11 03:56:49.329142	2026-10-11 03:57:16.103736
res-57ef105015	usr-83acba73	org-sparkx-default	Tailored - Senior AI / Full-Stack Engineer	job-101	Senior AI / Full-Stack Engineer	f	{"full_name": "Burhan Kapasi", "email": "burhan.kapasi985@gmail.com", "phone": "7201888684", "location": "", "headline": "AWS Cloud Engineer ", "linkedin_url": "", "github_url": "", "portfolio_url": ""}	Senior software engineer with deep expertise in Go, AWS cloud services, Linux systems, and infrastructure automation using Terraform. Proven ability to design and deploy high‑performance backend services and scalable infrastructure that can support data‑intensive workloads, including generative AI pipelines. Experienced in building robust, production‑grade systems that integrate seamlessly with cloud resources and leverage modern DevOps practices. Strong foundation in full‑stack development principles and a track record of delivering reliable, maintainable code, positioning me to contribute effectively to AI‑driven applications and collaborate on FastAPI and React front‑end initiatives.	[{"id": "exp-d60f0d", "title": "AWS", "company": "", "location": "", "start_date": "", "end_date": "Present", "is_current": true, "bullets": [], "technologies": ["AWS", "Linux", "Terraform"]}]	[{"id": "edu-d7239f", "degree": "Btech IT", "institution": "", "field_of_study": "", "start_year": "", "graduation_year": "", "gpa": ""}]	["AWS", "Linux", "Terraform"]	[{"id": "proj-mv3ahz17", "name": "Realtime ", "role": "", "description": "", "url": "", "technologies": [], "bullets": [""]}]	[]	[]	[]	[]	1	\N	Job-tailored clone for Senior AI / Full-Stack Engineer	2026-10-11 05:47:46.449241	2026-10-11 05:47:46.449253
res-3ee22d42e1	usr-83acba73	org-sparkx-default	Tailored - Senior AI / Full-Stack Engineer	job-101	Senior AI / Full-Stack Engineer	f	{"full_name": "Burhan Kapasi", "email": "burhan.kapasi985@gmail.com", "phone": "7201888684", "location": "", "headline": "AWS Cloud Engineer ", "linkedin_url": "", "github_url": "", "portfolio_url": ""}	Senior engineer with several years of experience designing and deploying scalable backend services and AI pipelines using Python and Go. Proven expertise in building robust, production‑grade APIs and data‑driven applications on Linux, leveraging AWS cloud services, Docker containerization, Terraform infrastructure‑as‑code, and SQL databases. Skilled at translating machine‑learning prototypes into reliable production workflows and integrating language‑model components within end‑to‑end systems. Strong full‑stack sensibility, enabling effective collaboration with front‑end teams and rapid delivery of web‑enabled AI solutions.	[{"id": "exp-d60f0d", "title": "AWS", "company": "", "location": "", "start_date": "", "end_date": "Present", "is_current": true, "bullets": [], "technologies": ["AWS", "Linux", "Terraform"]}]	[{"id": "edu-d7239f", "degree": "Btech IT", "institution": "", "field_of_study": "", "start_year": "", "graduation_year": "", "gpa": ""}]	["AWS", "Linux", "Terraform", "Docker", "Python", "SQL"]	[{"id": "proj-mv3ahz17", "name": "Realtime ", "role": "", "description": "", "url": "", "technologies": [], "bullets": [""]}]	[]	[]	[]	[]	1	\N	Job-tailored clone for Senior AI / Full-Stack Engineer	2026-10-11 05:51:58.197587	2026-10-11 05:51:58.197595
res-4eb0296bb0	usr-83acba73	org-sparkx-default	Tailored - Senior Backend Systems Engineer	job-sc-a-df8d08	Senior Backend Systems Engineer	f	{"full_name": "Burhan Kapasi", "email": "burhan.kapasi985@gmail.com", "phone": "7201888684", "location": "", "headline": "AWS Cloud Engineer ", "linkedin_url": "", "github_url": "", "portfolio_url": "", "layout_template": "two_column_left", "photo_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250", "show_photo": true, "photo_position": "sidebar", "font_family": "serif", "accent_color": "#059669"}	Results-focused software professional with verifiable proficiency in AWS, Linux, Terraform, aligned with requirements for Senior Backend Systems Engineer.	[{"id": "exp-d60f0d", "title": "AWS", "company": "", "location": "", "start_date": "", "end_date": "Present", "is_current": true, "bullets": [], "technologies": ["AWS", "Linux", "Terraform"]}]	[{"id": "edu-d7239f", "degree": "Btech IT", "institution": "", "field_of_study": "", "start_year": "", "graduation_year": "", "gpa": ""}]	["AWS", "Linux", "Terraform"]	[{"id": "proj-mv3ahz17", "name": "Realtime ", "role": "", "description": "", "url": "", "technologies": [], "bullets": [""]}]	[]	[]	[]	[]	1	\N	Job-tailored clone for Senior Backend Systems Engineer	2026-10-13 08:17:06.451267	2026-10-13 08:17:06.451284
\.


--
-- Data for Name: resume_match_analyses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.resume_match_analyses (id, user_id, resume_id, job_id, resume_version, match_score, status, summary_verdict, category_scores, skill_breakdown, experience_alignment, education_alignment, role_alignment, recommendations, limitations, is_live_llm, provider, created_at, updated_at) FROM stdin;
rma-a45ed4c1	usr-83acba73	res-bc2967540e	job-101	1	0	no_match	Evaluated with a 0% match score across 7 criteria. Candidate satisfies 0/7 must-have skills with 3.0 years documented experience.	{"domain_skills": 0.0, "experience": 5.0, "responsibilities": 0.0, "education": 15.0}	{"must_have_count": 7, "must_have_matched": 0, "preferred_count": 0, "preferred_matched": 0, "skills": [{"skill_name": "Python", "slug": "python", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'Python'."}, {"skill_name": "FastAPI", "slug": "fastapi", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'FastAPI'."}, {"skill_name": "React", "slug": "react", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'React'."}, {"skill_name": "PyTorch / Transformers", "slug": "pytorch-transformers", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'PyTorch / Transformers'."}, {"skill_name": "LangChain", "slug": "langchain", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'LangChain'."}, {"skill_name": "PostgreSQL", "slug": "postgresql", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'PostgreSQL'."}, {"skill_name": "System Design", "slug": "system-design", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'System Design'."}]}	{"required_years": 3.0, "candidate_years": 3.0, "status": "satisfied", "explanation": "Candidate has 3.0 years experience, meeting the required 3.0 years."}	{"required_education": "B.Tech / M.Tech in CS, AI, or equivalent", "candidate_education": "Btech IT", "status": "satisfied", "explanation": "Documented education 'Btech IT' aligns with requirements."}	{"overlap_score": 0.0, "explanation": "Demonstrated background shows 0% alignment with advertised responsibilities."}	[{"id": "rec-1", "category": "missing_skill", "priority": "high", "title": "Document Experience with Python", "action": "If you possess hands-on familiarity with Python, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'Python' is a published must_have requirement for this opening."}, {"id": "rec-2", "category": "missing_skill", "priority": "high", "title": "Document Experience with FastAPI", "action": "If you possess hands-on familiarity with FastAPI, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'FastAPI' is a published must_have requirement for this opening."}, {"id": "rec-3", "category": "missing_skill", "priority": "high", "title": "Document Experience with React", "action": "If you possess hands-on familiarity with React, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'React' is a published must_have requirement for this opening."}, {"id": "rec-4", "category": "missing_skill", "priority": "high", "title": "Document Experience with PyTorch / Transformers", "action": "If you possess hands-on familiarity with PyTorch / Transformers, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'PyTorch / Transformers' is a published must_have requirement for this opening."}]	["This analysis evaluates documented evidence within your submitted resume against published requisition criteria.", "Absence of a skill from a resume does not definitively prove the candidate lacks that competency.", "Match score is an algorithmic fit indicator and does not represent a probability of hire or final hiring decision.", "7 must-have requirement(s) lack verifiable evidence in the resume text."]	f	Google Gemini	2026-10-11 08:58:23.00784	2026-10-11 08:58:23.007856
rma-02d7ebad	usr-83acba73	res-4eb0296bb0	job-sc-a-df8d08	1	0	no_match	Evaluated with a 0% match score across 5 criteria. Candidate satisfies 0/5 must-have skills with 3.0 years documented experience.	{"domain_skills": 0.0, "experience": 5.0, "responsibilities": 20.0, "education": 15.0}	{"must_have_count": 5, "must_have_matched": 0, "preferred_count": 0, "preferred_matched": 0, "skills": [{"skill_name": "Python", "slug": "python", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'Python'."}, {"skill_name": "FastAPI", "slug": "fastapi", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'FastAPI'."}, {"skill_name": "PostgreSQL", "slug": "postgresql", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'PostgreSQL'."}, {"skill_name": "Docker", "slug": "docker", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'Docker'."}, {"skill_name": "Kubernetes", "slug": "kubernetes", "category": "General Competencies", "requirement_type": "must_have", "status": "missing", "verification_status": "not_applicable", "is_platform_verified": false, "evidence_quote": null, "evidence_section": null, "explanation": "No evidence found in candidate's resume for required must_have skill 'Kubernetes'."}]}	{"required_years": 2.0, "candidate_years": 3.0, "status": "satisfied", "explanation": "Candidate has 3.0 years experience, meeting the required 2.0 years."}	{"required_education": "B.S. in Computer Science", "candidate_education": "Btech IT", "status": "satisfied", "explanation": "Documented education 'Btech IT' aligns with requirements."}	{"overlap_score": 20.0, "explanation": "Demonstrated background shows 100% alignment with advertised responsibilities."}	[{"id": "rec-1", "type": "missing_skill", "category": "missing_skill", "priority": "high", "title": "Document Experience with Python", "action": "If you possess hands-on familiarity with Python, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'Python' is a published must_have requirement for this opening."}, {"id": "rec-2", "type": "missing_skill", "category": "missing_skill", "priority": "high", "title": "Document Experience with FastAPI", "action": "If you possess hands-on familiarity with FastAPI, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'FastAPI' is a published must_have requirement for this opening."}, {"id": "rec-3", "type": "missing_skill", "category": "missing_skill", "priority": "high", "title": "Document Experience with PostgreSQL", "action": "If you possess hands-on familiarity with PostgreSQL, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'PostgreSQL' is a published must_have requirement for this opening."}, {"id": "rec-4", "type": "missing_skill", "category": "missing_skill", "priority": "high", "title": "Document Experience with Docker", "action": "If you possess hands-on familiarity with Docker, add a concrete project or work achievement bullet demonstrating how you used it.", "rationale": "'Docker' is a published must_have requirement for this opening."}]	["This analysis evaluates documented evidence within your submitted resume against published requisition criteria.", "Absence of a skill from a resume does not definitively prove the candidate lacks that competency.", "Match score is an algorithmic fit indicator and does not represent a probability of hire or final hiring decision.", "5 must-have requirement(s) lack verifiable evidence in the resume text."]	f	Google Gemini	2026-10-13 08:17:33.709808	2026-10-13 08:17:45.728278
\.


--
-- Data for Name: revoked_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revoked_tokens (id, token_jti, revoked_at, expires_at) FROM stdin;
rev-e0606a54	b1baa81b382627743abf471be4cf8c46	2026-09-23 09:14:19.107373	2026-09-30 09:14:19.089807
rev-84a2b140	3a6b480d5da62937cdfd6e4d55f2aebf	2026-09-23 09:30:20.984271	2026-09-30 09:30:20.976711
rev-3364f40d	cf8fe2c19555d8edb88270fa403006a4	2026-09-23 09:31:38.984894	2026-09-30 09:31:38.978779
rev-cd4aeb3e	d1acfa522f7bf4c1bf35bf4ba90ffad3	2026-09-23 10:29:23.875822	2026-09-30 10:29:23.870299
rev-c5fc1b46	c9ad26689df6c32202f38ecdf57f0bcb	2026-09-23 11:25:50.395013	2026-09-30 11:25:50.392085
rev-726957d0	ec03bb2f3ee251c56275334a2645ee07	2026-09-23 11:56:23.079588	2026-09-30 11:56:23.071797
rev-385d6d3e	42658c7c14a6ada3abd52a3ea27a2f80	2026-09-23 13:09:06.782192	2026-09-30 13:09:06.77682
rev-c245555d	05d24fff44ccd18124b222942af84281	2026-09-23 13:22:42.487037	2026-09-30 13:22:42.482151
rev-06be5ec7	7e8a63bd7417667ceb29986c9915d706	2026-09-23 15:54:18.409458	2026-09-30 15:54:18.406241
rev-25e59e88	f6b1e05ca448ca195356a23bdf51704c	2026-09-23 16:14:40.941405	2026-09-30 16:14:40.937232
rev-c35a2568	2f21ced600f50c4209ee17a5e488cc76	2026-09-23 16:28:32.768911	2026-09-30 16:28:32.766208
rev-e5fb7cd6	890aef4dc986ff25949415d91a24f397	2026-09-23 16:40:28.844607	2026-09-30 16:40:28.838906
rev-4da7bd32	4b97601991474e3181c6c35abaaa4178	2026-09-23 17:26:07.97713	2026-09-30 17:26:07.974521
rev-56a717b2	545c4140f29b79342f7faa7e9c92f3f7	2026-09-24 04:18:52.989911	2026-10-01 04:18:52.987233
rev-55a66d7b	676a25147330259994ecf2df5eba9d5b	2026-09-24 04:56:01.87621	2026-10-01 04:56:01.868584
rev-8b739711	1a2e4c7e358a2e13f47e81317ffb6888	2026-09-28 04:08:35.414303	2026-10-05 04:08:35.402815
rev-ec462363	32075e378342fb88a1e16171a2cefc36	2026-09-28 04:18:04.767676	2026-10-05 04:18:04.761785
rev-2ddba319	84a305081f1673ac31b22775af158dc8	2026-09-28 12:46:43.355165	2026-10-05 12:46:43.352008
rev-b6f2611a	94fbfa30412b1d3cdc96975f998763c6	2026-09-28 16:59:01.534005	2026-10-05 16:59:01.526492
rev-76ec7c51	440c6cf2cb06dd4620045de7bd1b2a37	2026-09-30 04:13:40.843861	2026-10-07 04:13:40.518343
rev-8313a6b1	4de978411a32f82a67e0174db44babdc	2026-09-30 04:15:21.389158	2026-10-07 04:15:21.032417
rev-0f7f6fb3	1921f1dd0ee67adfe80353f7b3036765	2026-09-30 04:16:19.463607	2026-10-07 04:16:19.122662
rev-9e3abe77	2392f41e1d9a221b66b516b6c7d3914c	2026-09-30 05:36:12.940615	2026-10-07 05:36:12.041001
rev-2df5f7f6	0e025e57af1ae777585a467448475052	2026-09-30 05:55:46.925147	2026-10-07 05:55:46.272438
rev-9d207519	f9f09e736d99aa263462693748e15298	2026-09-30 05:58:29.52704	2026-10-07 05:58:29.190763
rev-b632da4d	dffb734e804016ac8d806e88a60cd455	2026-09-30 06:13:30.969276	2026-10-07 06:13:30.672038
rev-413dfa5d	9b4cce05e612e484ae44e9e0b10994d9	2026-09-30 16:10:57.532424	2026-10-07 16:10:57.078138
rev-8147fe5c	237d5cc8c6d5463b262085d553d1acf3	2026-09-30 16:33:27.570163	2026-10-07 16:33:27.159125
rev-020407e3	2d51a5cdd65b64cbe1334b4d199d97b3	2026-09-30 16:49:01.156102	2026-10-07 16:49:00.649639
rev-23ba66f2	2c8cf5735c30f0f540dcdc36431d617e	2026-09-30 16:56:27.342529	2026-10-07 16:56:26.703519
rev-3117c865	c0f04bfac6690a465959ac5a64fa329d	2026-09-30 17:40:06.602115	2026-10-07 17:40:06.206713
rev-3da0b6c7	f4ab1469dc2e6bf3c3666773bf01036f	2026-10-01 03:36:37.576406	2026-10-08 03:36:37.123615
rev-6a3cd453	aa5506f4caab41ceafeb683b3f69bef7	2026-10-01 03:38:01.789814	2026-10-08 03:38:00.884254
rev-34f4c003	6feaa26d904ecbfc088ac9401338c4fe	2026-10-01 03:53:59.535306	2026-10-08 03:53:59.032061
rev-79880efe	021c331b0c5d315b738189c5c4e898af	2026-10-01 04:27:16.561888	2026-10-08 04:27:16.184056
rev-280c28a8	5e3022fd0a989cfb2637b2fb0a0f9a32	2026-10-01 05:28:38.012713	2026-10-08 05:28:37.693767
rev-e4628719	b4bb4bf609d01c19c890a55e26226d36	2026-10-04 06:28:58.454154	2026-10-11 06:28:58.128685
rev-ddf8d1d9	40364ffd08499c39fec8392924c7c791	2026-10-04 06:46:10.907003	2026-10-11 06:46:10.538877
rev-7d3e148e	d38350d1a849696d45456965dc677e80	2026-10-04 07:09:35.292165	2026-10-11 07:09:34.956199
rev-93f4fa92	8a80d3d056657256c4ccce73ed0a44fb	2026-10-04 07:42:57.170923	2026-10-11 07:42:56.364596
rev-37b991be	9052a6dd6723c6419e10e557ece4ce39	2026-10-04 08:12:14.710187	2026-10-11 08:12:13.95638
rev-08a6401c	8412079f78cd530825bdb6a424b919a5	2026-10-04 08:15:05.097151	2026-10-11 08:15:04.467289
rev-f1272feb	c50822ea0647e764e7f5efcfa79c180d	2026-10-04 08:22:25.272823	2026-10-11 08:22:24.596725
rev-ea8f5a89	0fa145b3b882b04938163befff616960	2026-10-07 04:17:28.100147	2026-10-14 04:17:27.694885
rev-8025868e	363aabb9f80adf1c1359c6a5879b1448	2026-10-07 04:50:21.257109	2026-10-14 04:50:21.254312
rev-cfaa1f78	7e3f69fe23587630ad04d801dcaa16ae	2026-10-07 04:51:59.223147	2026-10-14 04:51:59.220289
rev-54d0f469	6507c9babdd6fa2f9d0a66c564d38efe	2026-10-07 05:10:42.690676	2026-10-14 05:10:42.687084
rev-c7f3e041	7acf990fdf8d3c16bab29916a2bbeb4a	2026-10-07 05:16:15.17281	2026-10-14 05:16:14.619752
rev-cd68ae66	45f927b99fb99d82d796ce6709ff2de4	2026-10-07 05:18:42.847796	2026-10-14 05:18:42.844154
rev-de3251b7	b0c56f0269aab710669d7b053839b7c6	2026-10-08 03:21:00.558722	2026-10-15 03:21:00.245299
rev-bce7c555	52e31251eb3dd16e4a8476bc80f9d7e9	2026-10-08 03:23:39.609193	2026-10-15 03:23:39.605335
rev-fcab987b	cf0415aa10439aa7d8c236418b0287bb	2026-10-08 04:27:20.907636	2026-10-15 04:27:20.001676
rev-e4e6f85b	cd02bac4f4c2695665a0394b176d2e8e	2026-10-08 04:31:40.908477	2026-10-15 04:31:40.904706
rev-6aa14216	c686736e2327a629159bd8e496c7ea7b	2026-10-08 08:30:26.843528	2026-10-15 08:30:25.997643
rev-8aa20b22	d1d354b1bab41f1a246d47637b0bdce7	2026-10-08 08:35:50.084682	2026-10-15 08:35:50.083104
\.


--
-- Data for Name: skill_aliases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill_aliases (id, skill_id, alias, created_at) FROM stdin;
ska-944bcd25	skl-96829365	docker	2026-10-04 14:59:11.827115
ska-7813af21	skl-96829365	docket	2026-10-04 14:59:11.828211
ska-233d9b9a	skl-96829365	dockr	2026-10-04 14:59:11.829058
ska-b27f5a3d	skl-96829365	dockers	2026-10-04 14:59:11.830183
ska-18a60800	skl-2af8abbb	kubernetes	2026-10-04 14:59:11.832717
ska-dc58f45c	skl-2af8abbb	k8s	2026-10-04 14:59:11.83316
ska-c005d04e	skl-2af8abbb	k8	2026-10-04 14:59:11.833837
ska-5b4a94cc	skl-2af8abbb	kubernete	2026-10-04 14:59:11.834503
ska-2a1c5a6d	skl-2af8abbb	kubernets	2026-10-04 14:59:11.835159
ska-59785532	skl-d913501c	terraform	2026-10-04 14:59:11.837152
ska-5d72b416	skl-d913501c	terrafom	2026-10-04 14:59:11.837534
ska-8d246f35	skl-d913501c	terform	2026-10-04 14:59:11.838169
ska-09361f42	skl-1c06caa9	ansible	2026-10-04 14:59:11.842196
ska-2f525d0b	skl-1c06caa9	ansibl	2026-10-04 14:59:11.842667
ska-363a3fa9	skl-5fbef91d	aws	2026-10-04 14:59:11.84482
ska-7cd8ec3c	skl-5fbef91d	amazon web services	2026-10-04 14:59:11.845641
ska-4598d2d5	skl-560e710d	google cloud	2026-10-04 14:59:11.847378
ska-4b63bf75	skl-560e710d	google-cloud	2026-10-04 14:59:11.848059
ska-63dc1c99	skl-560e710d	gcp	2026-10-04 14:59:11.848571
ska-68e6c643	skl-b00d766d	microsoft azure	2026-10-04 14:59:11.850987
ska-15bb3962	skl-b00d766d	microsoft-azure	2026-10-04 14:59:11.85138
ska-16405527	skl-b00d766d	azure	2026-10-04 14:59:11.851747
ska-c90ce1b9	skl-4731ca21	python	2026-10-04 14:59:11.853785
ska-b28eceb4	skl-4731ca21	pyhton	2026-10-04 14:59:11.85416
ska-4564ee03	skl-4731ca21	pyton	2026-10-04 14:59:11.85491
ska-d220548a	skl-4731ca21	python3	2026-10-04 14:59:11.856899
ska-cb44d87a	skl-d745e8fa	react	2026-10-04 14:59:11.859364
ska-d42ec5df	skl-d745e8fa	recat	2026-10-04 14:59:11.859873
ska-817b5925	skl-d745e8fa	reactjs	2026-10-04 14:59:11.860526
ska-d943836d	skl-d745e8fa	react.js	2026-10-04 14:59:11.861215
ska-4bc5ed24	skl-56442d71	react native	2026-10-04 14:59:11.863322
ska-8a6f4ab8	skl-56442d71	react-native	2026-10-04 14:59:11.863785
ska-84671a6e	skl-6e3e222a	angular	2026-10-04 14:59:11.866346
ska-fc1dd996	skl-6e3e222a	angularjs	2026-10-04 14:59:11.866832
ska-8ea5396e	skl-6e3e222a	anglar	2026-10-04 14:59:11.867541
ska-1506704f	skl-d16cdc14	vue.js	2026-10-04 14:59:11.869777
ska-a078938c	skl-d16cdc14	vue	2026-10-04 14:59:11.870156
ska-978f998e	skl-d16cdc14	vuejs	2026-10-04 14:59:11.87052
ska-fd4debc7	skl-d9263954	node.js	2026-10-04 14:59:11.873137
ska-9e326957	skl-d9263954	nodejs	2026-10-04 14:59:11.873757
ska-993f9456	skl-d9263954	node	2026-10-04 14:59:11.874288
ska-d65c744c	skl-00d5add2	typescript	2026-10-04 14:59:11.876946
ska-13d79887	skl-00d5add2	ts	2026-10-04 14:59:11.877363
ska-c4a140b9	skl-00d5add2	typscript	2026-10-04 14:59:11.877974
ska-1956a4ae	skl-35bcfade	javascript	2026-10-04 14:59:11.880004
ska-c18c8dcc	skl-35bcfade	js	2026-10-04 14:59:11.880481
ska-56166cea	skl-35bcfade	javascrip	2026-10-04 14:59:11.881257
ska-81707366	skl-eda32e3f	go	2026-10-04 14:59:11.8839
ska-f886441b	skl-eda32e3f	golang	2026-10-04 14:59:11.88433
ska-23680a0b	skl-eda32e3f	go lang	2026-10-04 14:59:11.884954
ska-8e9fc24d	skl-a29d4977	rust	2026-10-04 14:59:11.887675
ska-e081c3cc	skl-141131d4	c++	2026-10-04 14:59:11.889735
ska-8b0ba153	skl-141131d4	cpp	2026-10-04 14:59:11.89036
ska-dcea8fd1	skl-21943ebf	c#	2026-10-04 14:59:11.892828
ska-1a845440	skl-21943ebf	csharp	2026-10-04 14:59:11.893226
ska-3c763685	skl-41fb6cc4	.net core	2026-10-04 14:59:11.895457
ska-79e686eb	skl-41fb6cc4	dotnet-core	2026-10-04 14:59:11.895823
ska-be72b61a	skl-41fb6cc4	dotnet	2026-10-04 14:59:11.896179
ska-937a14d3	skl-41fb6cc4	.net	2026-10-04 14:59:11.896833
ska-bd89c7ce	skl-d79c8bea	fastapi	2026-10-04 14:59:11.899075
ska-ef8a37bd	skl-d79c8bea	fast-api	2026-10-04 14:59:11.900035
ska-ae17d294	skl-07a43000	django	2026-10-04 14:59:11.90167
ska-57f42631	skl-fadff6da	spring boot	2026-10-04 14:59:11.903468
ska-d0ede4c0	skl-fadff6da	spring-boot	2026-10-04 14:59:11.903948
ska-338a25ea	skl-fadff6da	springboot	2026-10-04 14:59:11.90433
ska-07f73ea4	skl-fadff6da	spring	2026-10-04 14:59:11.905463
ska-fd6c5eee	skl-60936493	postgresql	2026-10-04 14:59:11.908732
ska-1412bb8f	skl-60936493	postgres	2026-10-04 14:59:11.909175
ska-d741e2df	skl-60936493	postgre	2026-10-04 14:59:11.909844
ska-50b7496f	skl-60936493	pgsql	2026-10-04 14:59:11.910944
ska-541a3b6c	skl-30ec905f	mysql	2026-10-04 14:59:11.91252
ska-b47174c2	skl-00d0c319	mongodb	2026-10-04 14:59:11.914613
ska-51ac915d	skl-00d0c319	mongo	2026-10-04 14:59:11.915158
ska-f04fe7b4	skl-00d0c319	mongod	2026-10-04 14:59:11.915973
ska-85f968ae	skl-597ace5e	redis	2026-10-04 14:59:11.918047
ska-6e245aae	skl-8a7e511b	apache kafka	2026-10-04 14:59:11.919882
ska-9c805f3c	skl-8a7e511b	apache-kafka	2026-10-04 14:59:11.920248
ska-ab2ca96f	skl-8a7e511b	kafka	2026-10-04 14:59:11.920615
ska-44ffe5e8	skl-010510f2	rabbitmq	2026-10-04 14:59:11.923378
ska-58994ecc	skl-afcfccea	graphql	2026-10-04 14:59:11.925535
ska-505f5d2d	skl-be6424ca	gaap	2026-10-04 14:59:11.927358
ska-e059033d	skl-863d5f2a	ifrs	2026-10-04 14:59:11.929119
ska-c4a1b34c	skl-7f3bcf2b	cpa	2026-10-04 14:59:11.931225
ska-71fbdf61	skl-de2bf09a	sox compliance	2026-10-04 14:59:11.933419
ska-b4fb063c	skl-de2bf09a	sox-compliance	2026-10-04 14:59:11.933802
ska-23ffc4fb	skl-de2bf09a	sox	2026-10-04 14:59:11.934174
ska-ad666a14	skl-33c6eed7	reconciliation	2026-10-04 14:59:11.935792
ska-bb8936cf	skl-33c6eed7	reconcilation	2026-10-04 14:59:11.936172
ska-0f4c221e	skl-33c6eed7	reconciliations	2026-10-04 14:59:11.937335
ska-2ec5d139	skl-e98765a7	financial auditing	2026-10-04 14:59:11.939178
ska-fe05bd5b	skl-e98765a7	financial-auditing	2026-10-04 14:59:11.939788
ska-5c573217	skl-e98765a7	audit	2026-10-04 14:59:11.940234
ska-21de4d21	skl-e98765a7	auditing	2026-10-04 14:59:11.941097
ska-37af7148	skl-e86233e1	tax accounting	2026-10-04 14:59:11.942779
ska-f5fd864b	skl-e86233e1	tax-accounting	2026-10-04 14:59:11.943166
ska-f69530bf	skl-e86233e1	tax	2026-10-04 14:59:11.943547
ska-19d2fbf0	skl-e86233e1	taxation	2026-10-04 14:59:11.94415
ska-d99d8261	skl-6ecd4f06	general ledger	2026-10-04 14:59:11.945784
ska-56ebec72	skl-6ecd4f06	general-ledger	2026-10-04 14:59:11.946148
ska-bce8090b	skl-255ba08a	p&l management	2026-10-04 14:59:11.948383
ska-5b0a322f	skl-255ba08a	p-l-management	2026-10-04 14:59:11.948866
ska-f24a515c	skl-255ba08a	p&l	2026-10-04 14:59:11.949376
ska-641a3cfe	skl-87a7f61e	balance sheet reconciliation	2026-10-04 14:59:11.951074
ska-1990ecfd	skl-87a7f61e	balance-sheet-reconciliation	2026-10-04 14:59:11.951465
ska-68ed8847	skl-87a7f61e	balance sheet	2026-10-04 14:59:11.951825
ska-90bb5775	skl-91160f99	pytorch / transformers	2026-10-04 14:59:11.970763
ska-74828d39	skl-91160f99	pytorch-transformers	2026-10-04 14:59:11.971157
ska-e7fde989	skl-ffa694c7	langchain	2026-10-04 14:59:11.976712
ska-9255b516	skl-fc68bd8c	system design	2026-10-04 14:59:11.979304
ska-89f8ce80	skl-fc68bd8c	system-design	2026-10-04 14:59:11.979708
ska-218b35cc	skl-38450fae	typescript / javascript	2026-10-04 14:59:11.984404
ska-a7398317	skl-38450fae	typescript-javascript	2026-10-04 14:59:11.984818
ska-c91dd798	skl-f0f25337	tailwind css	2026-10-04 14:59:11.986691
ska-3a4fe678	skl-f0f25337	tailwind-css	2026-10-04 14:59:11.987055
ska-f2862b3b	skl-c0ce67ac	canvas api	2026-10-04 14:59:11.98974
ska-4b3f0cbb	skl-c0ce67ac	canvas-api	2026-10-04 14:59:11.990206
ska-8cd75c00	skl-e7cb3758	state management	2026-10-04 14:59:11.992324
ska-13b22c65	skl-e7cb3758	state-management	2026-10-04 14:59:11.992733
ska-a3de850e	skl-be40daab	performance optimization	2026-10-04 14:59:11.994553
ska-960264f7	skl-be40daab	performance-optimization	2026-10-04 14:59:11.994935
ska-4c1b11a5	skl-0201dc5a	financial reconciliation	2026-10-04 14:59:12.000914
ska-2e54c1c6	skl-0201dc5a	financial-reconciliation	2026-10-04 14:59:12.001306
ska-390dddbc	skl-7c5e9366	corporate tax	2026-10-04 14:59:12.003148
ska-0e61990b	skl-7c5e9366	corporate-tax	2026-10-04 14:59:12.003515
ska-2cdaf641	skl-2e8ee8da	internal auditing	2026-10-04 14:59:12.005392
ska-caade8e1	skl-2e8ee8da	internal-auditing	2026-10-04 14:59:12.005857
ska-1cf85629	skl-7685788b	variance analysis	2026-10-04 14:59:12.008279
ska-cb48dc43	skl-7685788b	variance-analysis	2026-10-04 14:59:12.008676
ska-7e313b27	skl-cba140ca	algorithms	2026-10-04 14:59:12.015167
ska-848062cb	skl-0d63c1af	distributed systems	2026-10-04 14:59:12.026817
ska-8ec7a65b	skl-0d63c1af	distributed-systems	2026-10-04 14:59:12.027231
ska-08fa8d45	skl-d9c328ff	grpc	2026-10-04 14:59:12.029339
ska-fe6f6191	skl-0920c90a	tailwind	2026-10-04 14:59:12.100019
ska-1967e125	skl-966f6cf1	pytorch	2026-10-04 14:59:12.44699
ska-455e6b27	skl-ceb79f63	pgvector	2026-10-04 14:59:12.462697
ska-e6f03604	skl-05d17853	web speech api	2026-10-04 14:59:12.469281
ska-3dc45bd4	skl-05d17853	web-speech-api	2026-10-04 14:59:12.469681
ska-e0b5f21a	skl-091886fa	micro-frontends	2026-10-04 14:59:12.471533
ska-1abb80fb	skl-a4be5efc	react python node	2026-10-04 14:59:12.474859
ska-554fcc14	skl-a4be5efc	react-python-node	2026-10-04 14:59:12.475312
ska-05248969	skl-34d0856d	linux	2026-10-04 14:59:12.47949
ska-9714ae25	skl-567056da	sql	2026-10-04 14:59:12.485093
ska-384e54b3	skl-4d889ef6	. passionate	2026-10-04 14:59:12.491594
ska-1c656f01	skl-4d889ef6	passionate	2026-10-04 14:59:12.492047
ska-088e0a44	skl-c6b85d0e	implementation.	2026-10-04 14:59:12.493958
ska-57427562	skl-c6b85d0e	implementation	2026-10-04 14:59:12.494343
ska-23a9b7f2	skl-3ae8c67f	improve project functionality.	2026-10-04 14:59:12.496217
ska-11f2f6e6	skl-3ae8c67f	improve-project-functionality	2026-10-04 14:59:12.49659
ska-54911b96	skl-c7fe1053	candidates.	2026-10-04 14:59:12.499027
ska-ecc9698b	skl-c7fe1053	candidates	2026-10-04 14:59:12.499493
ska-f9de3a57	skl-834cb2ee	managed related documentation.	2026-10-04 14:59:12.501518
ska-e1468ebe	skl-834cb2ee	managed-related-documentation	2026-10-04 14:59:12.501896
ska-77c63b70	skl-b2dbf7d3	tracking and follow-up.	2026-10-04 14:59:12.503739
ska-a7582e85	skl-b2dbf7d3	tracking-and-follow-up	2026-10-04 14:59:12.504119
ska-9a42f3f9	skl-e5d25df3	coordination activities.	2026-10-04 14:59:12.506301
ska-0c696ac8	skl-e5d25df3	coordination-activities	2026-10-04 14:59:12.506777
ska-e4c057b7	skl-62123b22	smooth workflow.	2026-10-04 14:59:12.508904
ska-2e1f66ee	skl-62123b22	smooth-workflow	2026-10-04 14:59:12.509316
ska-bd4dc258	skl-3528c270	iot intern	2026-10-04 14:59:12.511179
ska-d8e87e21	skl-3528c270	iot-intern	2026-10-04 14:59:12.511572
ska-fc5c8eb4	skl-70cb5408	executive assistant (ea)	2026-10-04 14:59:12.513399
ska-5d76c65c	skl-70cb5408	executive-assistant-ea	2026-10-04 14:59:12.513862
ska-a3aaa1c3	skl-6061e171	archana automation	2026-10-04 14:59:12.516423
ska-dd2c8450	skl-6061e171	archana-automation	2026-10-04 14:59:12.516868
ska-434879da	skl-ad928b99	idol plasto pvt. ltd.	2026-10-04 14:59:12.518821
ska-0ca53971	skl-ad928b99	idol-plasto-pvt-ltd	2026-10-04 14:59:12.519242
ska-48809772	skl-a3510d0a	e d u c a t i o n	2026-10-04 14:59:12.521083
ska-2ce7bf75	skl-a3510d0a	e-d-u-c-a-t-i-o-n	2026-10-04 14:59:12.521449
ska-07c4b11e	skl-f08c43e9	rk university	2026-10-04 14:59:12.523741
ska-a69644cc	skl-f08c43e9	rk-university	2026-10-04 14:59:12.524277
ska-87be965e	skl-4cf0554a	diploma in computer engineering	2026-10-04 14:59:12.526219
ska-d980fee4	skl-4cf0554a	diploma-in-computer-engineering	2026-10-04 14:59:12.526599
ska-448987c1	skl-0b2d0e19	school	2026-10-04 14:59:12.528443
ska-a5573283	skl-ed1b3b46	bachelor in computer engineering	2026-10-04 14:59:12.530321
ska-239f91b2	skl-ed1b3b46	bachelor-in-computer-engineering	2026-10-04 14:59:12.530797
ska-5075ba80	skl-74d58832	s k i l l s	2026-10-04 14:59:12.533909
ska-52d3e0ba	skl-74d58832	s-k-i-l-l-s	2026-10-04 14:59:12.534332
ska-a88e5209	skl-e4797a39	project management	2026-10-04 14:59:12.53627
ska-097577e7	skl-e4797a39	project-management	2026-10-04 14:59:12.536632
ska-b4d8db44	skl-40999af1	public relations	2026-10-04 14:59:12.538665
ska-d857700b	skl-40999af1	public-relations	2026-10-04 14:59:12.539177
ska-31546234	skl-c17c3988	teamwork	2026-10-04 14:59:12.541616
ska-62096160	skl-4fa1723e	time management	2026-10-04 14:59:12.543547
ska-2a350633	skl-4fa1723e	time-management	2026-10-04 14:59:12.543922
ska-582daab2	skl-334faee4	leadership	2026-10-04 14:59:12.545761
ska-f9b7e942	skl-c19ca2f7	effective communication	2026-10-04 14:59:12.548176
ska-f6cff6d1	skl-c19ca2f7	effective-communication	2026-10-04 14:59:12.54872
ska-07623c25	skl-179edba6	critical thinking	2026-10-04 14:59:12.550889
ska-79475741	skl-179edba6	critical-thinking	2026-10-04 14:59:12.551289
ska-4f25ee1b	skl-39839ca9	l a n g u a g e s	2026-10-04 14:59:12.553119
ska-fc3b5c00	skl-39839ca9	l-a-n-g-u-a-g-e-s	2026-10-04 14:59:12.553491
ska-f71bf89f	skl-9622b19c	english	2026-10-04 14:59:12.555314
ska-56a6d71e	skl-e479be51	hindi	2026-10-04 14:59:12.557671
ska-bc242626	skl-e8593a47	gujarati	2026-10-04 14:59:12.559774
ska-4912493d	skl-d1897f60	panchgani international high school	2026-10-04 14:59:12.561597
ska-1c36b61b	skl-d1897f60	panchgani-international-high-school	2026-10-04 14:59:12.561978
ska-0c6c6859	skl-aa447039	node js	2026-10-04 14:59:13.071061
ska-a199610f	skl-aa447039	node-js	2026-10-04 14:59:13.071489
ska-cd939f7f	skl-215724fb	python 3	2026-10-04 15:08:32.246267
ska-2d1de835	skl-215724fb	python-3	2026-10-04 15:08:32.267147
ska-7e383a6c	skl-6ab6d172	python-c68670	2026-10-05 04:01:42.826937
ska-eb2d467e	skl-21af1bbb	postgresql-c68670	2026-10-05 04:01:42.834131
ska-1a741283	skl-97528c8a	python-048739	2026-10-05 04:03:21.198846
ska-710544bf	skl-5b2579ae	postgresql-048739	2026-10-05 04:03:21.213015
ska-2ab1e16e	skl-9fde30a7	python-a418f1	2026-10-05 04:03:47.999293
ska-94424fa8	skl-abc787d7	postgresql-a418f1	2026-10-05 04:03:48.011941
ska-9fe970f4	skl-5d84eab9	go-2177fb	2026-10-05 04:03:48.205757
ska-6ba194ee	skl-c720acb0	docker-2177fb	2026-10-05 04:03:48.214652
ska-5a98b447	skl-93e447a4	java-ddb554	2026-10-05 04:03:48.386295
ska-930889e2	skl-ecdfcd8b	spring-ddb554	2026-10-05 04:03:48.393311
ska-52b9b4bc	skl-c99dc491	react-e2b06b	2026-10-05 04:03:48.486282
ska-dcbc382f	skl-8316e0e7	graphql-e2b06b	2026-10-05 04:03:48.494056
ska-7315de07	skl-cc2cdaa6	rust-1dfbc3	2026-10-05 04:03:48.599745
ska-034adcd3	skl-008a848d	cplusplus-1dfbc3	2026-10-05 04:03:48.605178
ska-5363ad66	skl-2d71d736	python-c047a2	2026-10-05 04:05:00.941927
ska-85c1f688	skl-030563da	postgresql-c047a2	2026-10-05 04:05:00.944694
ska-a23d1812	skl-d77106c6	go-4649ae	2026-10-05 04:05:00.992766
ska-16f78989	skl-46535a8e	docker-4649ae	2026-10-05 04:05:00.995085
ska-41552a49	skl-9ce4c5d7	java-eb74ef	2026-10-05 04:05:01.029462
ska-a1e48fbf	skl-dd555264	spring-eb74ef	2026-10-05 04:05:01.032875
ska-1b760b7a	skl-8963512d	react-97f874	2026-10-05 04:05:01.081376
ska-57ae252b	skl-2fdee303	graphql-97f874	2026-10-05 04:05:01.084053
ska-8143f97b	skl-64e70070	rust-1a48c5	2026-10-05 04:05:01.136849
ska-6bd711ef	skl-139d2a99	cplusplus-1a48c5	2026-10-05 04:05:01.139683
ska-1bd424d3	skl-3003e10d	terraform-c17529	2026-10-05 04:05:01.206646
ska-8469b753	skl-96f7c10e	security-51a4fc	2026-10-05 04:05:01.28643
ska-28578b3e	skl-0fd1e221	kafka-d2740c	2026-10-05 04:05:01.336421
ska-51b41030	skl-f56478d7	sql-9a17c8	2026-10-05 04:05:01.363138
ska-20cabb7d	skl-9a067be6	scala-d4dda5	2026-10-05 04:05:01.394983
ska-4a2fa0d4	skl-655579c8	spark-d4dda5	2026-10-05 04:05:01.397726
ska-6f121196	skl-0c2e127a	csharp-1fd198	2026-10-05 04:05:01.431106
ska-b0467519	skl-047b260b	redis-56465e	2026-10-05 04:05:01.78375
ska-7e02f96d	skl-72c97e51	python-89b2bc	2026-10-05 04:05:32.436858
ska-f81048fe	skl-91f22d1d	postgresql-89b2bc	2026-10-05 04:05:32.440236
ska-2a751b7e	skl-d107157a	go-77dbf6	2026-10-05 04:05:32.507076
ska-d0d234d8	skl-0be88490	docker-77dbf6	2026-10-05 04:05:32.509827
ska-e943b272	skl-7fe33178	java-212be7	2026-10-05 04:05:32.552913
ska-4965931f	skl-dad27d62	spring-212be7	2026-10-05 04:05:32.558923
ska-d9436a98	skl-fa3381b9	react-306a35	2026-10-05 04:05:32.680053
ska-e75231e8	skl-d09aa195	graphql-306a35	2026-10-05 04:05:32.68881
ska-db5fe5a8	skl-faac2231	rust-b50dc6	2026-10-05 04:05:32.786498
ska-eccca209	skl-30038570	cplusplus-b50dc6	2026-10-05 04:05:32.793759
ska-579d7ae6	skl-29de3974	terraform-6863ce	2026-10-05 04:05:32.914858
ska-ad01fcef	skl-bf87c3d3	security-f133bd	2026-10-05 04:05:33.01132
ska-370daf99	skl-256caf63	kafka-275161	2026-10-05 04:05:33.062071
ska-76fe13ed	skl-2ac1a509	sql-b06dc5	2026-10-05 04:05:33.126998
ska-9dd2f5b8	skl-8fdc6fa1	scala-25e80f	2026-10-05 04:05:33.19217
ska-75108391	skl-aec6c81f	spark-25e80f	2026-10-05 04:05:33.197491
ska-ca2aaacf	skl-0de6dbff	csharp-c376ef	2026-10-05 04:05:33.262764
ska-899afe1e	skl-98b141c8	redis-63200c	2026-10-05 04:05:33.716019
ska-0c78cf87	skl-0f95d73b	python-ecc542	2026-10-05 04:07:51.187164
ska-ad0b4d60	skl-f21692b1	postgresql-ecc542	2026-10-05 04:07:51.189705
ska-49b78aac	skl-50c83867	go-8460fd	2026-10-05 04:07:51.239248
ska-fe1bf7f4	skl-148e3a10	docker-8460fd	2026-10-05 04:07:51.241341
ska-761e57a4	skl-10905eae	java-811c3e	2026-10-05 04:07:51.275647
ska-c66ec792	skl-657107be	spring-811c3e	2026-10-05 04:07:51.278003
ska-10216b46	skl-9b660450	react-682350	2026-10-05 04:07:51.327374
ska-09f0c981	skl-1163479a	graphql-682350	2026-10-05 04:07:51.334147
ska-2373576b	skl-9e7a113c	rust-f38eea	2026-10-05 04:07:51.397033
ska-3a8a121a	skl-64db2520	cplusplus-f38eea	2026-10-05 04:07:51.400721
ska-3374607d	skl-a8669051	terraform-9012d6	2026-10-05 04:07:51.48095
ska-899483ce	skl-5a8b038d	security-4c4b83	2026-10-05 04:07:51.55454
ska-7706fff9	skl-8aefa7f3	kafka-a25326	2026-10-05 04:07:51.601349
ska-23d1e30e	skl-0676b8d1	sql-4db9aa	2026-10-05 04:07:51.654286
ska-7a6bfd94	skl-a02aaa8a	scala-e8d16a	2026-10-05 04:07:51.713905
ska-7b4b0b3d	skl-f6c6d40a	spark-e8d16a	2026-10-05 04:07:51.717395
ska-56e329ca	skl-a1f25da4	csharp-3880a2	2026-10-05 04:07:51.760712
ska-dfb1eb29	skl-13e2ade4	redis-5d3811	2026-10-05 04:07:52.153004
ska-331fa4ad	skl-f36685cd	python-52ab2e	2026-10-05 04:56:16.334682
ska-63bb1687	skl-1f231c04	postgresql-52ab2e	2026-10-05 04:56:16.34252
ska-0cfe4203	skl-a7b04478	go-ecfcf3	2026-10-05 04:56:16.466724
ska-ca449beb	skl-ad5224e6	docker-ecfcf3	2026-10-05 04:56:16.474043
ska-a18fa6b5	skl-df8edd07	java-f15367	2026-10-05 04:56:16.551465
ska-585e9bcd	skl-76b8f2c2	spring-f15367	2026-10-05 04:56:16.558899
ska-8e064cb5	skl-122721f4	react-a3f4dd	2026-10-05 04:56:16.634105
ska-a8de758c	skl-9cc2ffb8	graphql-a3f4dd	2026-10-05 04:56:16.640998
ska-06672c99	skl-c05ff88c	rust-7c8332	2026-10-05 04:56:16.720156
ska-d8b368bc	skl-e66954ec	cplusplus-7c8332	2026-10-05 04:56:16.72987
ska-fa2b0eef	skl-ec94ddad	terraform-0706d5	2026-10-05 04:56:16.839738
ska-1097a6bd	skl-356c36a9	security-b31cb4	2026-10-05 04:56:16.95099
ska-194efb60	skl-1c93bb04	kafka-a9d355	2026-10-05 04:56:17.002664
ska-7c8724ab	skl-e7bf572e	sql-144332	2026-10-05 04:56:17.070948
ska-49d7a8fd	skl-ce8c1c1f	scala-1023ee	2026-10-05 04:56:17.120737
ska-eb4e7f12	skl-4782080f	spark-1023ee	2026-10-05 04:56:17.126782
ska-c1434fd8	skl-e926a35b	csharp-90282c	2026-10-05 04:56:17.174181
ska-f844ef92	skl-479e981c	redis-6c4168	2026-10-05 04:56:17.646341
ska-26f1dd65	skl-4cdb514e	backend	2026-10-05 04:58:42.930705
ska-065854ab	skl-0ea58f28	concurrency	2026-10-05 04:58:42.938417
ska-c517ae3a	skl-aabaaf3b	python-b318c6	2026-10-06 03:28:59.985934
ska-55240940	skl-9b5262b2	postgresql-b318c6	2026-10-06 03:28:59.991159
ska-0f3fed70	skl-737dbfa9	go-48122a	2026-10-06 03:29:00.07724
ska-aa06e207	skl-3602c0fa	docker-48122a	2026-10-06 03:29:00.082152
ska-94fbab34	skl-4ed16832	java-b52ad0	2026-10-06 03:29:00.139478
ska-4d8d368f	skl-600b9a93	spring-b52ad0	2026-10-06 03:29:00.143095
ska-0722de3b	skl-28d95894	react-83dd9f	2026-10-06 03:29:00.181417
ska-ed45e449	skl-e5274b46	graphql-83dd9f	2026-10-06 03:29:00.185279
ska-7264cae2	skl-d3cbf2e5	rust-b61a41	2026-10-06 03:29:00.233608
ska-b0354e35	skl-50a04e22	cplusplus-b61a41	2026-10-06 03:29:00.235778
ska-f7f2faf5	skl-24b058c5	terraform-6cdce7	2026-10-06 03:29:00.28212
ska-0c65f0a2	skl-702a1752	security-424f6b	2026-10-06 03:29:00.32867
ska-0c695b41	skl-3b626b99	kafka-f60595	2026-10-06 03:29:00.360842
ska-5f77f4db	skl-7a5495f9	sql-6cb005	2026-10-06 03:29:00.385012
ska-1fac972f	skl-47faf23f	scala-82a2c7	2026-10-06 03:29:00.427056
ska-76281a30	skl-46ee1588	spark-82a2c7	2026-10-06 03:29:00.429371
ska-115f236c	skl-3889021d	csharp-f10eb6	2026-10-06 03:29:00.470447
ska-8d0b3536	skl-907599ed	redis-8298d7	2026-10-06 03:29:00.750465
ska-4c712bd2	skl-0ed32ca4	aws-10bc40	2026-10-06 03:40:24.792803
ska-5c4d7f90	skl-ab953be9	python-10bc40	2026-10-06 03:40:24.797531
ska-cbe2b865	skl-8c4eedcb	docker-10bc40	2026-10-06 03:40:24.802294
ska-444c3501	skl-bce2a6c6	aws-95262e	2026-10-06 03:41:06.823883
ska-ed2dc24c	skl-7ee8f547	python-95262e	2026-10-06 03:41:06.827735
ska-72a0ddc3	skl-da44fe5f	docker-95262e	2026-10-06 03:41:06.831266
ska-0e107d11	skl-890298e5	aws-4478fc	2026-10-06 03:42:41.555682
ska-3a30be30	skl-d70cbaa8	python-4478fc	2026-10-06 03:42:41.56069
ska-87203e26	skl-fa0707c5	docker-4478fc	2026-10-06 03:42:41.563947
ska-8da0cebf	skl-e57a7933	aws-b654a2	2026-10-06 03:42:41.834569
ska-7f58453a	skl-badfe048	python-b654a2	2026-10-06 03:42:41.838509
ska-38a5251c	skl-d9766636	docker-b654a2	2026-10-06 03:42:41.842493
ska-aac76351	skl-f41bfb59	aws-a91d4c	2026-10-06 03:42:41.96043
ska-94bcc4ef	skl-d0ad09c1	python-a91d4c	2026-10-06 03:42:41.968942
ska-3c1fcf21	skl-c086c15a	docker-a91d4c	2026-10-06 03:42:41.974494
ska-c3f5ec6c	skl-1674cfdf	aws-410943	2026-10-06 03:42:42.054725
ska-36dd2e3f	skl-5f63a458	python-410943	2026-10-06 03:42:42.059436
ska-b78881b2	skl-ed872575	docker-410943	2026-10-06 03:42:42.06363
ska-31c97ffb	skl-5a24bbbe	aws-3c0b7d	2026-10-06 03:42:42.154402
ska-f6897df5	skl-92efc11d	python-3c0b7d	2026-10-06 03:42:42.164969
ska-0e4ed425	skl-569b7650	docker-3c0b7d	2026-10-06 03:42:42.174307
ska-4f70edf6	skl-c2b9df54	aws-53b28b	2026-10-06 03:42:42.27104
ska-8297b663	skl-7cea87fe	python-53b28b	2026-10-06 03:42:42.2786
ska-7f1b3342	skl-e5a260d7	docker-53b28b	2026-10-06 03:42:42.285053
ska-34d2e7f1	skl-b8610bff	aws-37e544	2026-10-06 03:42:42.376878
ska-c30f9762	skl-16117fc6	python-37e544	2026-10-06 03:42:42.388894
ska-c98095b5	skl-76fc6b08	docker-37e544	2026-10-06 03:42:42.396497
ska-2d9c18ca	skl-0907a3ef	aws-95cf3e	2026-10-06 03:42:42.493326
ska-c282070f	skl-a57cc7a3	python-95cf3e	2026-10-06 03:42:42.497547
ska-a569a515	skl-95c8bede	docker-95cf3e	2026-10-06 03:42:42.504876
ska-08751e35	skl-eb7eb76b	aws-a62d06	2026-10-06 03:42:42.582511
ska-99e3f6f6	skl-64b1b583	python-a62d06	2026-10-06 03:42:42.586788
ska-3f72a6e4	skl-b852b72a	docker-a62d06	2026-10-06 03:42:42.590257
ska-6a7e42c4	skl-2250b79f	aws-bef3f2	2026-10-06 03:42:42.689166
ska-4e493485	skl-c20e2cbb	python-bef3f2	2026-10-06 03:42:42.693504
ska-1f177906	skl-745cc140	docker-bef3f2	2026-10-06 03:42:42.696659
ska-418e0d2b	skl-4903ca8c	aws-321b8e	2026-10-06 03:42:42.769479
ska-dfdee299	skl-2077fb60	python-321b8e	2026-10-06 03:42:42.773865
ska-286d727e	skl-a76f1ec3	docker-321b8e	2026-10-06 03:42:42.77798
ska-df6c0056	skl-b4138091	aws-733356	2026-10-06 03:42:42.850702
ska-f9a3b513	skl-45da360f	python-733356	2026-10-06 03:42:42.856771
ska-ebc20834	skl-f63662e2	docker-733356	2026-10-06 03:42:42.861664
ska-1b1f2849	skl-ae2c6d61	aws-e9484d	2026-10-06 03:42:43.037594
ska-dbb3d20f	skl-12b1fdc6	python-e9484d	2026-10-06 03:42:43.048111
ska-23448c34	skl-d29c382c	docker-e9484d	2026-10-06 03:42:43.057128
ska-e980a760	skl-cd4d266a	aws-a4f114	2026-10-06 03:42:43.166947
ska-80de1173	skl-aab9cba5	python-a4f114	2026-10-06 03:42:43.170876
ska-a0a2614b	skl-bcf43de9	docker-a4f114	2026-10-06 03:42:43.175481
ska-8fd681b6	skl-13c57974	aws-040572	2026-10-06 03:42:43.290351
ska-e19ba0fb	skl-86b37453	python-040572	2026-10-06 03:42:43.299194
ska-8b145dda	skl-07e7c4d4	docker-040572	2026-10-06 03:42:43.305627
ska-0749844b	skl-4afb1b14	aws-36c32d	2026-10-06 03:44:15.050155
ska-c91fabd2	skl-9c404178	python-36c32d	2026-10-06 03:44:15.055987
ska-3bcefc1a	skl-8ebc9f96	docker-36c32d	2026-10-06 03:44:15.059485
ska-4142aff4	skl-9edc2271	aws-6fc353	2026-10-06 03:44:15.33625
ska-9010e4a2	skl-dfc88310	python-6fc353	2026-10-06 03:44:15.340935
ska-3e75406e	skl-781344c6	docker-6fc353	2026-10-06 03:44:15.345308
ska-5513cb29	skl-cd8d3b68	aws-c9afc3	2026-10-06 03:44:15.47218
ska-bbf74718	skl-5d351595	python-c9afc3	2026-10-06 03:44:15.477763
ska-a57abbb2	skl-c8e4dde1	docker-c9afc3	2026-10-06 03:44:15.482684
ska-596c1a07	skl-38c7c578	aws-c1bb9a	2026-10-06 03:44:15.566833
ska-fc161489	skl-93f4093a	python-c1bb9a	2026-10-06 03:44:15.578795
ska-7ce232dd	skl-cf1b0b04	docker-c1bb9a	2026-10-06 03:44:15.586439
ska-5a54a280	skl-869b191b	aws-fbfdd0	2026-10-06 03:44:15.6839
ska-13059b2b	skl-0c8b9590	python-fbfdd0	2026-10-06 03:44:15.689952
ska-b0aa086d	skl-28f7c8bf	docker-fbfdd0	2026-10-06 03:44:15.694256
ska-e4c513cd	skl-865d76ea	aws-802e0d	2026-10-06 03:44:15.807439
ska-6d97601c	skl-6edfddef	python-802e0d	2026-10-06 03:44:15.818938
ska-5775a00c	skl-1d9e0d33	docker-802e0d	2026-10-06 03:44:15.828834
ska-3a18b409	skl-7c85aba7	aws-23ca2d	2026-10-06 03:44:15.940866
ska-105fd65f	skl-f701fbbd	python-23ca2d	2026-10-06 03:44:15.949307
ska-c9914b15	skl-63c6ae29	docker-23ca2d	2026-10-06 03:44:15.956247
ska-a985dbf4	skl-38b78815	aws-c6607f	2026-10-06 03:44:16.085872
ska-4d7f57dd	skl-3de1cf4b	python-c6607f	2026-10-06 03:44:16.097856
ska-c9a9daff	skl-c9d6017b	docker-c6607f	2026-10-06 03:44:16.109349
ska-6b340c0b	skl-3bc7eb75	aws-203eca	2026-10-06 03:44:16.249974
ska-c76fe48a	skl-6a269c2a	python-203eca	2026-10-06 03:44:16.258634
ska-25e6ed9f	skl-a8c2a974	docker-203eca	2026-10-06 03:44:16.265633
ska-23198386	skl-a7b15059	aws-e83085	2026-10-06 03:44:16.390734
ska-0f392de6	skl-941a5c5a	python-e83085	2026-10-06 03:44:16.396051
ska-24c0216b	skl-eeac38f5	docker-e83085	2026-10-06 03:44:16.400877
ska-569db3b4	skl-969d7db7	aws-fb95fc	2026-10-06 03:44:16.513649
ska-2c5dcbab	skl-fee0f311	python-fb95fc	2026-10-06 03:44:16.519934
ska-4e3bca54	skl-5a4f14f4	docker-fb95fc	2026-10-06 03:44:16.527333
ska-9d5c5592	skl-50b94b3f	aws-7eea8b	2026-10-06 03:44:16.645383
ska-ac35e545	skl-678d066b	python-7eea8b	2026-10-06 03:44:16.655327
ska-af2345ec	skl-192808a3	docker-7eea8b	2026-10-06 03:44:16.663296
ska-665a1846	skl-b9d898b0	aws-511423	2026-10-06 03:44:16.81004
ska-cb6e49a3	skl-1b637c95	python-511423	2026-10-06 03:44:16.814613
ska-8d4adab7	skl-bfc15c06	docker-511423	2026-10-06 03:44:16.81915
ska-0ac2576e	skl-e60f4b6d	aws-3462ce	2026-10-06 03:44:16.908787
ska-0e9ec3c5	skl-e264fc4c	python-3462ce	2026-10-06 03:44:16.914095
ska-3ac791cc	skl-46404b8b	docker-3462ce	2026-10-06 03:44:16.918416
ska-9e4ce175	skl-d8daf333	aws-8f38dd	2026-10-06 03:44:17.000685
ska-5af445a6	skl-5ba17da0	python-8f38dd	2026-10-06 03:44:17.010769
ska-8d388bd3	skl-00892d0a	docker-8f38dd	2026-10-06 03:44:17.020015
ska-add3de1b	skl-51d1eea7	python-450c75	2026-10-06 03:44:19.496544
ska-9dafea4e	skl-50d6d305	postgresql-450c75	2026-10-06 03:44:19.500758
ska-0a4e233e	skl-e57cb84f	go-b0ef70	2026-10-06 03:44:19.607614
ska-46cc40c7	skl-cfb85c91	docker-b0ef70	2026-10-06 03:44:19.616035
ska-9ac2f9ff	skl-229092d6	terraform-5082b3	2026-10-06 03:44:19.71837
ska-7db1fa0c	skl-27af08f2	python-93353c	2026-10-06 03:44:51.407673
ska-7c926483	skl-ceccac2a	postgresql-93353c	2026-10-06 03:44:51.413338
ska-8403290a	skl-9c17ddb0	go-c9fadf	2026-10-06 03:44:51.529856
ska-04f31d65	skl-8b90d5c3	docker-c9fadf	2026-10-06 03:44:51.535446
ska-e8b22bbf	skl-714795d7	java-a3301f	2026-10-06 03:44:51.609279
ska-bd9191ae	skl-8ce26f72	spring-a3301f	2026-10-06 03:44:51.613623
ska-82e4f846	skl-db15722c	react-8a0a01	2026-10-06 03:44:51.712398
ska-2116e00a	skl-f05da4ec	graphql-8a0a01	2026-10-06 03:44:51.718961
ska-80675880	skl-15fd9c96	rust-3b733d	2026-10-06 03:44:51.821972
ska-e801d7e4	skl-30255f3b	cplusplus-3b733d	2026-10-06 03:44:51.829732
ska-fc61a125	skl-cd45839a	terraform-2455d3	2026-10-06 03:44:51.935411
ska-4c2b35f7	skl-43bb129c	security-f48fc0	2026-10-06 03:44:52.022976
ska-627bab7a	skl-241ff46b	kafka-81793c	2026-10-06 03:44:52.093645
ska-0c819769	skl-0548405d	sql-cf0dd6	2026-10-06 03:44:52.179595
ska-09dba2d5	skl-370bef84	scala-b1bf1c	2026-10-06 03:44:52.269973
ska-af1c82e3	skl-beea04bd	spark-b1bf1c	2026-10-06 03:44:52.276724
ska-7383f159	skl-4847d451	csharp-bb499c	2026-10-06 03:44:52.351787
ska-0108488a	skl-3623ad5e	redis-58e3b7	2026-10-06 03:44:52.84857
ska-c2f28cea	skl-6166804a	aws-47fcc5	2026-10-06 03:52:42.145238
ska-64e4a84e	skl-54144089	python-47fcc5	2026-10-06 03:52:42.152811
ska-c8b9128e	skl-54699521	docker-47fcc5	2026-10-06 03:52:42.155748
ska-9507e82f	skl-222a8249	aws-6d96b3	2026-10-06 03:52:42.505203
ska-f69c61f1	skl-e3df15ba	python-6d96b3	2026-10-06 03:52:42.511616
ska-eebf00e5	skl-93dafd4b	docker-6d96b3	2026-10-06 03:52:42.518087
ska-9b138460	skl-d946efd1	aws-4e8b0b	2026-10-06 03:52:42.606685
ska-9cc8dda0	skl-8d95e6f2	python-4e8b0b	2026-10-06 03:52:42.613564
ska-86c9b5b8	skl-111ba417	docker-4e8b0b	2026-10-06 03:52:42.621164
ska-8fec0aa7	skl-d59f541e	aws-f14ac0	2026-10-06 03:52:42.710798
ska-4ddaf31c	skl-a28812e7	python-f14ac0	2026-10-06 03:52:42.71642
ska-f0734f2f	skl-8133a9e8	docker-f14ac0	2026-10-06 03:52:42.721025
ska-f784f752	skl-1bf91a3a	aws-f97d2f	2026-10-06 03:52:42.772526
ska-b0d637f4	skl-9e385977	python-f97d2f	2026-10-06 03:52:42.77791
ska-a7f0e793	skl-3c6e66e3	docker-f97d2f	2026-10-06 03:52:42.781464
ska-5c526334	skl-e1ffdb7f	aws-586ef7	2026-10-06 03:52:42.839108
ska-9e9eb1ac	skl-d0b7e1fe	python-586ef7	2026-10-06 03:52:42.84522
ska-8e279b97	skl-b4fa3c2d	docker-586ef7	2026-10-06 03:52:42.847902
ska-dba6d01a	skl-e3ed1e6e	aws-4349a3	2026-10-06 03:52:42.902274
ska-5bcd46ef	skl-315ad0f7	python-4349a3	2026-10-06 03:52:42.907724
ska-8352653f	skl-efac6352	docker-4349a3	2026-10-06 03:52:42.913298
ska-9cbcd810	skl-f02a69a5	aws-405bda	2026-10-06 03:52:43.030168
ska-e9bf74b9	skl-5a4ceeca	python-405bda	2026-10-06 03:52:43.035464
ska-9dee8bfd	skl-7bef8024	docker-405bda	2026-10-06 03:52:43.038882
ska-b3814afa	skl-5dbb7fff	aws-782001	2026-10-06 03:52:43.095221
ska-6c767f28	skl-e92515a1	python-782001	2026-10-06 03:52:43.09828
ska-e63a7c30	skl-6a03b925	docker-782001	2026-10-06 03:52:43.102781
ska-3977f2c3	skl-afd01d04	aws-6ddf9d	2026-10-06 03:52:43.206111
ska-bb9f75d0	skl-a3b58ba5	python-6ddf9d	2026-10-06 03:52:43.211808
ska-763acb29	skl-01144a83	docker-6ddf9d	2026-10-06 03:52:43.214651
ska-e590368e	skl-b7849ed2	aws-e16779	2026-10-06 03:52:43.310605
ska-ceac5952	skl-e83510c8	python-e16779	2026-10-06 03:52:43.314064
ska-96472de5	skl-d1fe1351	docker-e16779	2026-10-06 03:52:43.317007
ska-c90fbf39	skl-74dcd019	aws-569fe6	2026-10-06 03:52:43.379499
ska-cbd97935	skl-e965168e	python-569fe6	2026-10-06 03:52:43.383057
ska-207c1b66	skl-e239aad9	docker-569fe6	2026-10-06 03:52:43.386751
ska-438c1985	skl-dde80416	aws-5a2f3c	2026-10-06 03:52:43.480285
ska-1541c6ff	skl-42538c95	python-5a2f3c	2026-10-06 03:52:43.483917
ska-761e2847	skl-83b6839b	docker-5a2f3c	2026-10-06 03:52:43.487766
ska-2018e9c7	skl-8b3f4c0e	aws-b49c0a	2026-10-06 03:52:43.55318
ska-e92b0c47	skl-29592d22	python-b49c0a	2026-10-06 03:52:43.556248
ska-ec9a2a7f	skl-c50c4283	docker-b49c0a	2026-10-06 03:52:43.560211
ska-181e98b0	skl-56ff7f03	aws-edb1a2	2026-10-06 03:52:43.631153
ska-12afbcec	skl-3cadef7b	python-edb1a2	2026-10-06 03:52:43.635687
ska-2f269a31	skl-052ed54e	docker-edb1a2	2026-10-06 03:52:43.638311
ska-2b9e52a8	skl-5c04908c	python-16492f	2026-10-06 03:52:43.964979
ska-dabed0ea	skl-6f64bd3a	postgresql-16492f	2026-10-06 03:52:43.971865
ska-df6b507b	skl-7552ab45	go-137d32	2026-10-06 03:52:44.037912
ska-57142de3	skl-662135ad	docker-137d32	2026-10-06 03:52:44.041293
ska-5b804a43	skl-d2396223	terraform-249a46	2026-10-06 03:52:44.087883
ska-9f08293f	skl-7aa02f68	aws-28764a	2026-10-06 04:01:26.686233
ska-a309a838	skl-e245b255	python-28764a	2026-10-06 04:01:26.699048
ska-06de6921	skl-373fc0be	docker-28764a	2026-10-06 04:01:26.711538
ska-3a745dd6	skl-a652983a	aws-9cd131	2026-10-06 04:01:27.54007
ska-d95ed9b7	skl-10519428	python-9cd131	2026-10-06 04:01:27.556342
ska-2e063d71	skl-79712603	docker-9cd131	2026-10-06 04:01:27.570139
ska-729cdb86	skl-0187c816	aws-ff8862	2026-10-06 04:01:27.75961
ska-a7904ea9	skl-46cc09f9	python-ff8862	2026-10-06 04:01:27.776426
ska-5b9cc68c	skl-e994f7ef	docker-ff8862	2026-10-06 04:01:27.789625
ska-ae481250	skl-6c30a45b	aws-af4ba3	2026-10-06 04:01:27.965259
ska-8b5deaf7	skl-238b8bbd	python-af4ba3	2026-10-06 04:01:27.982284
ska-36a54ae6	skl-f23ab8b1	docker-af4ba3	2026-10-06 04:01:28.001366
ska-5204655a	skl-54c4618c	aws-6d30b2	2026-10-06 04:01:28.169941
ska-d51517a4	skl-2cd64a23	python-6d30b2	2026-10-06 04:01:28.190489
ska-a0c2be16	skl-d72ce3c4	docker-6d30b2	2026-10-06 04:01:28.205966
ska-b5a156c6	skl-03e98287	aws-670a0f	2026-10-06 04:01:28.364913
ska-31432c11	skl-ae7651bd	python-670a0f	2026-10-06 04:01:28.379887
ska-f49548b4	skl-f3cb91a3	docker-670a0f	2026-10-06 04:01:28.390851
ska-72039691	skl-e1f0efe6	aws-d2897f	2026-10-06 04:01:28.527187
ska-b88ee433	skl-18d46585	python-d2897f	2026-10-06 04:01:28.543119
ska-ef0e9da7	skl-f618d18c	docker-d2897f	2026-10-06 04:01:28.567524
ska-c9a0b913	skl-af076160	aws-85d25e	2026-10-06 04:01:28.729756
ska-c81b31eb	skl-e109433b	python-85d25e	2026-10-06 04:01:28.74429
ska-c23443a4	skl-6e3de08b	docker-85d25e	2026-10-06 04:01:28.756974
ska-29ba9b48	skl-7f9e82ff	aws-d787e5	2026-10-06 04:01:28.900994
ska-9d62f044	skl-c6c3178a	python-d787e5	2026-10-06 04:01:28.918387
ska-5ae24ed0	skl-491e11a2	docker-d787e5	2026-10-06 04:01:28.930613
ska-5333f92a	skl-9f19d178	aws-3bd054	2026-10-06 04:01:29.19331
ska-eb5c0da6	skl-78c601da	python-3bd054	2026-10-06 04:01:29.21291
ska-ebdd05eb	skl-de28357c	docker-3bd054	2026-10-06 04:01:29.233269
ska-01a5d75f	skl-7608eede	aws-589c8a	2026-10-06 04:01:29.423168
ska-e4621873	skl-8b4c01fa	python-589c8a	2026-10-06 04:01:29.432334
ska-050c6d00	skl-6745d32c	docker-589c8a	2026-10-06 04:01:29.440493
ska-f4b69ae2	skl-8822e0c0	aws-1c323a	2026-10-06 04:01:29.636527
ska-2403a100	skl-010b2144	python-1c323a	2026-10-06 04:01:29.661161
ska-c0115263	skl-b0a17ad8	docker-1c323a	2026-10-06 04:01:29.692319
ska-248e2180	skl-f2174da7	aws-d2adfb	2026-10-06 04:01:30.17949
ska-0d92f954	skl-3bff112f	python-d2adfb	2026-10-06 04:01:30.215082
ska-cd029c2d	skl-f6ce553d	docker-d2adfb	2026-10-06 04:01:30.234507
ska-ab5bd0f7	skl-2c219b71	aws-2c4554	2026-10-06 04:01:30.472988
ska-0d383c00	skl-5fd8deb7	python-2c4554	2026-10-06 04:01:30.500817
ska-c005cd4d	skl-675b7b73	docker-2c4554	2026-10-06 04:01:30.536397
ska-6516d2d5	skl-69e903f9	aws-b81d2b	2026-10-06 04:01:30.789332
ska-cf9c7fdb	skl-775147e2	python-b81d2b	2026-10-06 04:01:30.812826
ska-e27565d3	skl-e27b6819	docker-b81d2b	2026-10-06 04:01:30.830016
ska-c2669838	skl-065a2327	python-f32945	2026-10-06 04:01:32.583039
ska-b2ee805f	skl-3a2f4751	postgresql-f32945	2026-10-06 04:01:32.598771
ska-a95df69b	skl-33e8dc4f	go-f66886	2026-10-06 04:01:32.754361
ska-12d2edb1	skl-d82ab1d9	docker-f66886	2026-10-06 04:01:32.771344
ska-9f624a61	skl-71ed43c7	terraform-66962a	2026-10-06 04:01:32.910809
ska-af538530	skl-75eeea38	aws-5ba5af	2026-10-06 04:13:33.342735
ska-4adc62a9	skl-b3587979	python-5ba5af	2026-10-06 04:13:33.352715
ska-44b8e4ec	skl-78d6fb42	docker-5ba5af	2026-10-06 04:13:33.358575
ska-e92c26dd	skl-8a58baa1	aws-f1166e	2026-10-06 04:13:33.690304
ska-02877090	skl-8ebd3ce8	python-f1166e	2026-10-06 04:13:33.69576
ska-b4c16ecb	skl-205151c2	docker-f1166e	2026-10-06 04:13:33.700156
ska-df0f093d	skl-67235549	aws-6b6749	2026-10-06 04:13:33.808572
ska-722e9a29	skl-b70cdd82	python-6b6749	2026-10-06 04:13:33.814698
ska-aa194fad	skl-121641de	docker-6b6749	2026-10-06 04:13:33.81869
ska-c86d927b	skl-645cea34	aws-de91a5	2026-10-06 04:13:33.898431
ska-2f2a07d0	skl-c832c4e5	python-de91a5	2026-10-06 04:13:33.906856
ska-5c8d4549	skl-9bdd2f59	docker-de91a5	2026-10-06 04:13:33.913242
ska-333dcdde	skl-02a4aa53	aws-706c26	2026-10-06 04:13:34.003057
ska-55b85ea7	skl-a758ca75	python-706c26	2026-10-06 04:13:34.009785
ska-f3b21af7	skl-04b14b2d	docker-706c26	2026-10-06 04:13:34.016416
ska-3b6b9b00	skl-88e95180	aws-49740f	2026-10-06 04:13:34.08793
ska-6574dd2a	skl-84d02faa	python-49740f	2026-10-06 04:13:34.095055
ska-a77efa68	skl-a4ab8363	docker-49740f	2026-10-06 04:13:34.099641
ska-08fe725b	skl-1d011595	aws-4a423b	2026-10-06 04:13:34.17559
ska-d72abbfd	skl-71b3a159	python-4a423b	2026-10-06 04:13:34.181063
ska-270b89f6	skl-63d8dd85	docker-4a423b	2026-10-06 04:13:34.190448
ska-9f0d9adb	skl-1b24a52f	aws-12a8f6	2026-10-06 04:13:34.25374
ska-7a2ca6b6	skl-6deb2260	python-12a8f6	2026-10-06 04:13:34.258465
ska-e243a9bf	skl-8475688e	docker-12a8f6	2026-10-06 04:13:34.26182
ska-ca208a67	skl-ccb0854e	aws-8cb3f3	2026-10-06 04:13:34.328906
ska-ea0b27cc	skl-8223ce66	python-8cb3f3	2026-10-06 04:13:34.334376
ska-eb4dc8f5	skl-ca32d62f	docker-8cb3f3	2026-10-06 04:13:34.339139
ska-562eea38	skl-883108d5	aws-4153e9	2026-10-06 04:13:34.412142
ska-64a52d3f	skl-ea547782	python-4153e9	2026-10-06 04:13:34.418887
ska-7323a23a	skl-c7572de8	docker-4153e9	2026-10-06 04:13:34.424829
ska-1ec26448	skl-53910776	aws-27115d	2026-10-06 04:13:34.537377
ska-427415ac	skl-abb6aa17	python-27115d	2026-10-06 04:13:34.54494
ska-75821c9a	skl-3dc21daf	docker-27115d	2026-10-06 04:13:34.550132
ska-549490cd	skl-8ee32094	aws-b68d8f	2026-10-06 04:13:34.645714
ska-acf002d8	skl-048e5b09	python-b68d8f	2026-10-06 04:13:34.654907
ska-a49c8de5	skl-09f53df3	docker-b68d8f	2026-10-06 04:13:34.662171
ska-61d0cf97	skl-dd098f8c	aws-4b4e9f	2026-10-06 04:13:34.828287
ska-72d8d2fe	skl-f88515fb	python-4b4e9f	2026-10-06 04:13:34.840528
ska-fcae3064	skl-310a391f	docker-4b4e9f	2026-10-06 04:13:34.848984
ska-857fc78a	skl-e9a89565	aws-0a21df	2026-10-06 04:13:34.948753
ska-25e8b190	skl-c0b3b2d7	python-0a21df	2026-10-06 04:13:34.954619
ska-bc76ac76	skl-c63e1db9	docker-0a21df	2026-10-06 04:13:34.95916
ska-ee91f2ed	skl-2c977924	aws-e9e573	2026-10-06 04:13:35.049137
ska-843cbfe1	skl-a3e2222e	python-e9e573	2026-10-06 04:13:35.05498
ska-fa71e48f	skl-45d041b1	docker-e9e573	2026-10-06 04:13:35.058872
ska-2e7787f5	skl-616c38da	python-7a9cb5	2026-10-06 04:13:35.429699
ska-d59af7d9	skl-c63fd9c7	postgresql-7a9cb5	2026-10-06 04:13:35.435614
ska-12f93ea8	skl-2476aba2	go-caaf15	2026-10-06 04:13:35.510492
ska-6d0dea6e	skl-64ba3e7c	docker-caaf15	2026-10-06 04:13:35.519147
ska-3f94789d	skl-e4abd169	terraform-86906e	2026-10-06 04:13:35.585041
ska-183779ea	skl-da0045e0	aws-b82e17	2026-10-06 05:31:19.357394
ska-98748643	skl-f57dc007	python-b82e17	2026-10-06 05:31:19.368588
ska-98ba6947	skl-3fca5d10	docker-b82e17	2026-10-06 05:31:19.375115
ska-d63802cd	skl-81da6234	aws-0647b4	2026-10-06 05:31:19.670448
ska-a710e697	skl-02da1007	python-0647b4	2026-10-06 05:31:19.677623
ska-94996832	skl-3978064c	docker-0647b4	2026-10-06 05:31:19.683567
ska-d381c2d5	skl-4377f8c9	aws-137526	2026-10-06 05:31:19.744332
ska-5995c0c1	skl-29a4f818	python-137526	2026-10-06 05:31:19.747981
ska-8c67745d	skl-8e8db2ee	docker-137526	2026-10-06 05:31:19.752216
ska-1f98480b	skl-d8a809cf	aws-3dc6a5	2026-10-06 05:31:19.80386
ska-b4be5d05	skl-a272b4eb	python-3dc6a5	2026-10-06 05:31:19.810034
ska-1d6581db	skl-d0a21ba4	docker-3dc6a5	2026-10-06 05:31:19.81239
ska-db380922	skl-b3676350	aws-832e58	2026-10-06 05:31:19.870083
ska-ad7c406c	skl-2068d5fd	python-832e58	2026-10-06 05:31:19.874238
ska-2e5841a8	skl-282fa90b	docker-832e58	2026-10-06 05:31:19.879405
ska-3fb8e1a4	skl-f1f03103	aws-39acee	2026-10-06 05:31:19.925271
ska-f5296f8b	skl-88c23fae	python-39acee	2026-10-06 05:31:19.928114
ska-c3efa6b7	skl-cacef5f5	docker-39acee	2026-10-06 05:31:19.93053
ska-e542a1a7	skl-cd3981cb	aws-d05e8e	2026-10-06 05:31:19.983987
ska-e7b30767	skl-f2b4b196	python-d05e8e	2026-10-06 05:31:19.990786
ska-5645ba68	skl-85cff603	docker-d05e8e	2026-10-06 05:31:19.994436
ska-a33b3623	skl-6345350f	aws-aeb65a	2026-10-06 05:31:20.044239
ska-3e373e6d	skl-d981f0fc	python-aeb65a	2026-10-06 05:31:20.049451
ska-8f95a3f8	skl-4341d776	docker-aeb65a	2026-10-06 05:31:20.052045
ska-24d82c8e	skl-f173cc6f	aws-3424f0	2026-10-06 05:31:20.100009
ska-02a1973f	skl-7cc974d3	python-3424f0	2026-10-06 05:31:20.10324
ska-6c5cb59f	skl-084042e6	docker-3424f0	2026-10-06 05:31:20.108504
ska-cfc8d9b1	skl-f8a0081f	aws-b4726a	2026-10-06 05:31:20.167986
ska-7e365ec9	skl-479b65cb	python-b4726a	2026-10-06 05:31:20.170645
ska-f816be6f	skl-55748e8a	docker-b4726a	2026-10-06 05:31:20.173793
ska-4142033b	skl-f136d7dc	aws-a6a901	2026-10-06 05:31:20.235519
ska-f944c81a	skl-5ffae2d3	python-a6a901	2026-10-06 05:31:20.237906
ska-294aecf9	skl-ff409626	docker-a6a901	2026-10-06 05:31:20.24095
ska-626086f1	skl-88c515f7	aws-62ae7b	2026-10-06 05:31:20.302296
ska-267e891d	skl-dffcaa2c	python-62ae7b	2026-10-06 05:31:20.306634
ska-cf357310	skl-a390eea6	docker-62ae7b	2026-10-06 05:31:20.309613
ska-810b5dfc	skl-17b1c220	aws-09e504	2026-10-06 05:31:20.391144
ska-e8ee6dba	skl-e573ec69	python-09e504	2026-10-06 05:31:20.393727
ska-a253f3c2	skl-9e09f23a	docker-09e504	2026-10-06 05:31:20.395785
ska-e7dc5f02	skl-656d2cfb	aws-08a46b	2026-10-06 05:31:20.445131
ska-7176594f	skl-2382ee7b	python-08a46b	2026-10-06 05:31:20.448802
ska-aec56aa4	skl-199915b5	docker-08a46b	2026-10-06 05:31:20.451468
ska-02310480	skl-fb358be0	aws-82c6e1	2026-10-06 05:31:20.506832
ska-225cacf5	skl-c9f6fbc9	python-82c6e1	2026-10-06 05:31:20.509613
ska-c892ba2a	skl-3e2967a7	docker-82c6e1	2026-10-06 05:31:20.512054
ska-895472dd	skl-4534970f	python-65a9a0	2026-10-06 05:31:20.984359
ska-17a39498	skl-b319ae40	postgresql-65a9a0	2026-10-06 05:31:20.995503
ska-44cee79b	skl-4351b737	go-75b1e4	2026-10-06 05:31:21.080088
ska-576b2a4b	skl-03d18e92	docker-75b1e4	2026-10-06 05:31:21.085634
ska-bcde55b5	skl-873a26aa	terraform-86a9d7	2026-10-06 05:31:21.160064
ska-21443b78	skl-5986494d	python-660623	2026-10-06 05:31:37.020524
ska-48ef0f76	skl-c6705cf8	postgresql-660623	2026-10-06 05:31:37.027187
ska-695334f2	skl-117b8268	go-dcf292	2026-10-06 05:31:37.128812
ska-86779147	skl-5da0cedf	docker-dcf292	2026-10-06 05:31:37.136647
ska-722a72ed	skl-9ad4faa7	java-17c57a	2026-10-06 05:31:37.225529
ska-dc0d90de	skl-74693d32	spring-17c57a	2026-10-06 05:31:37.232715
ska-92ff8f2b	skl-b93cf5b6	react-2681b2	2026-10-06 05:31:37.335053
ska-6b21c23d	skl-79a8331c	graphql-2681b2	2026-10-06 05:31:37.345912
ska-f5deb0ce	skl-c41fad54	rust-d11d1d	2026-10-06 05:31:37.454939
ska-fbed4fc2	skl-63110bc0	cplusplus-d11d1d	2026-10-06 05:31:37.461534
ska-87af183e	skl-edc0bf43	terraform-000829	2026-10-06 05:31:37.733248
ska-1f02ed49	skl-c7f54479	security-5ce308	2026-10-06 05:31:37.88616
ska-c4f983ae	skl-8f062431	kafka-84400c	2026-10-06 05:31:37.966489
ska-fc4ab557	skl-bd8b666e	sql-7a6652	2026-10-06 05:31:38.059236
ska-33d093f3	skl-8412ef43	scala-572c0a	2026-10-06 05:31:38.147986
ska-5bb6bc36	skl-80c3f8f5	spark-572c0a	2026-10-06 05:31:38.154781
ska-1240f20b	skl-77eb93c4	csharp-a0fa04	2026-10-06 05:31:38.233455
ska-91b3a074	skl-9f4bb72c	redis-d4aaa6	2026-10-06 05:31:38.795174
ska-4b55639a	skl-9d96571c	aws-7e7d63	2026-10-06 15:42:27.565963
ska-9c1870c6	skl-502f63b4	python-7e7d63	2026-10-06 15:42:27.575135
ska-22a82dc0	skl-62d359ee	docker-7e7d63	2026-10-06 15:42:27.580273
ska-5c57c309	skl-f07f99f6	aws-ab88ea	2026-10-06 15:42:27.851024
ska-f5676431	skl-1ff77f68	python-ab88ea	2026-10-06 15:42:27.855948
ska-c86dfe5d	skl-0d4d87c0	docker-ab88ea	2026-10-06 15:42:27.863675
ska-44f52204	skl-9f059c95	aws-50692c	2026-10-06 15:42:27.958049
ska-f2113188	skl-7d5959f4	python-50692c	2026-10-06 15:42:27.961814
ska-3907ba9a	skl-29c346ea	docker-50692c	2026-10-06 15:42:27.966364
ska-f4997b14	skl-64608c17	aws-0f1e01	2026-10-06 15:42:28.071262
ska-0e5da023	skl-6e318565	python-0f1e01	2026-10-06 15:42:28.077726
ska-fbfde7d4	skl-ca2d01ed	docker-0f1e01	2026-10-06 15:42:28.082509
ska-7807d7f2	skl-069d5aa7	aws-6e5755	2026-10-06 15:42:28.148806
ska-d6d68c6a	skl-c4c06b20	python-6e5755	2026-10-06 15:42:28.152764
ska-48ff1092	skl-ef642224	docker-6e5755	2026-10-06 15:42:28.156691
ska-1bebecf1	skl-7642f4b8	aws-7cea15	2026-10-06 15:42:28.21892
ska-b109768a	skl-fa337696	python-7cea15	2026-10-06 15:42:28.223527
ska-268eccf8	skl-b8d4664f	docker-7cea15	2026-10-06 15:42:28.227611
ska-729f5517	skl-b0eeb11a	aws-92aa52	2026-10-06 15:42:28.29296
ska-77e4eb8e	skl-6c6f72f1	python-92aa52	2026-10-06 15:42:28.297476
ska-d608f2cd	skl-dbc23e73	docker-92aa52	2026-10-06 15:42:28.302598
ska-a8d7b50f	skl-2d275688	aws-06dd2a	2026-10-06 15:42:28.403221
ska-ebeb5081	skl-08c222e0	python-06dd2a	2026-10-06 15:42:28.40878
ska-afa16211	skl-52f4fa20	docker-06dd2a	2026-10-06 15:42:28.412584
ska-3a1996df	skl-9300dc90	aws-0dd7f4	2026-10-06 15:42:28.521402
ska-80661821	skl-886235ee	python-0dd7f4	2026-10-06 15:42:28.526237
ska-8d588251	skl-a342fea4	docker-0dd7f4	2026-10-06 15:42:28.529766
ska-b634d69d	skl-daf973f9	aws-334981	2026-10-06 15:42:28.594713
ska-090bad99	skl-6c6c5c0e	python-334981	2026-10-06 15:42:28.599282
ska-3d3113e2	skl-79c12e85	docker-334981	2026-10-06 15:42:28.603593
ska-caa7923b	skl-f358ef8b	aws-8486b3	2026-10-06 15:42:28.667681
ska-635a4afb	skl-441bf1d3	python-8486b3	2026-10-06 15:42:28.672385
ska-02755c86	skl-e59ded61	docker-8486b3	2026-10-06 15:42:28.676565
ska-38ebf76e	skl-e250d867	aws-ea9147	2026-10-06 15:42:28.746612
ska-bbf2a554	skl-454b2ae1	python-ea9147	2026-10-06 15:42:28.750735
ska-a89fe812	skl-2831411e	docker-ea9147	2026-10-06 15:42:28.755651
ska-96400e86	skl-8e46a98f	aws-977653	2026-10-06 15:42:28.853805
ska-df1509ab	skl-6ab4415f	python-977653	2026-10-06 15:42:28.859841
ska-4ffb79d9	skl-a27b149f	docker-977653	2026-10-06 15:42:28.863028
ska-9adf1bd6	skl-92672e70	aws-65171b	2026-10-06 15:42:28.933945
ska-817a9c7f	skl-39815d08	python-65171b	2026-10-06 15:42:28.937709
ska-e974ddb2	skl-09f00272	docker-65171b	2026-10-06 15:42:28.941909
ska-b400cc19	skl-0d64a824	aws-d16b31	2026-10-06 15:42:29.008211
ska-7240dff4	skl-884e59e7	python-d16b31	2026-10-06 15:42:29.012738
ska-80b38f49	skl-04cc1ae5	docker-d16b31	2026-10-06 15:42:29.017642
ska-322c5c99	skl-790ac975	python-0ffe30	2026-10-06 15:42:29.538323
ska-e7040a05	skl-b234105a	postgresql-0ffe30	2026-10-06 15:42:29.543984
ska-035e6572	skl-3385be9f	go-772ba5	2026-10-06 15:42:29.60328
ska-ebce63b2	skl-4ec05d38	docker-772ba5	2026-10-06 15:42:29.608705
ska-5c225f49	skl-90b910e2	terraform-4600c2	2026-10-06 15:42:29.661194
ska-05eb41ee	skl-3c629a02	python-3ec0e8	2026-10-06 15:42:54.669201
ska-4d5103df	skl-e589404a	postgresql-3ec0e8	2026-10-06 15:42:54.679194
ska-520bc288	skl-ce5cabfb	go-3eb828	2026-10-06 15:42:54.839864
ska-71442f68	skl-5c8ecadb	docker-3eb828	2026-10-06 15:42:54.844494
ska-3ea6ba49	skl-fa01b3ce	java-2e17f1	2026-10-06 15:42:54.9375
ska-ae8d3838	skl-1f9c975a	spring-2e17f1	2026-10-06 15:42:54.943464
ska-c2e56567	skl-b927c421	react-bd7899	2026-10-06 15:42:55.012178
ska-6cd6a484	skl-0468568c	graphql-bd7899	2026-10-06 15:42:55.017865
ska-bd6a5236	skl-5f30cd95	rust-d9e015	2026-10-06 15:42:55.074345
ska-73b9c1b9	skl-dbe65a1a	cplusplus-d9e015	2026-10-06 15:42:55.078171
ska-0657a95c	skl-802ddc6f	terraform-c75a3f	2026-10-06 15:42:55.127887
ska-547a7dee	skl-53046d3b	security-6f9176	2026-10-06 15:42:55.206404
ska-010cd7f9	skl-1b339fd0	kafka-f06a05	2026-10-06 15:42:55.245319
ska-17f2a448	skl-47111257	sql-a3fc11	2026-10-06 15:42:55.279474
ska-528ed475	skl-2a8cb3a2	scala-91efe3	2026-10-06 15:42:55.338356
ska-863fe2b3	skl-96b2ff9d	spark-91efe3	2026-10-06 15:42:55.343035
ska-e92552e0	skl-0e25c1cf	csharp-ea09c2	2026-10-06 15:42:55.378777
ska-42f89977	skl-d2a19b1c	redis-5cb156	2026-10-06 15:42:55.717161
ska-d0d0a964	skl-328c472b	python-7718bc	2026-10-06 15:45:07.792595
ska-1616cf27	skl-49e856b7	postgresql-7718bc	2026-10-06 15:45:07.797735
ska-fe102670	skl-8b50fc5e	go-9edd2c	2026-10-06 15:45:07.867578
ska-8523b96e	skl-b9e6d54d	docker-9edd2c	2026-10-06 15:45:07.872832
ska-d2e8dc51	skl-e8c916e8	java-8437f2	2026-10-06 15:45:07.974081
ska-8339de43	skl-f16f1992	spring-8437f2	2026-10-06 15:45:07.980311
ska-4da776d5	skl-efd4b9eb	react-c74b0e	2026-10-06 15:45:08.072661
ska-74832e35	skl-a8ab72c7	graphql-c74b0e	2026-10-06 15:45:08.075861
ska-8944498f	skl-b6cc569d	rust-016dfe	2026-10-06 15:45:08.124548
ska-4e61ab4a	skl-b90b66ee	cplusplus-016dfe	2026-10-06 15:45:08.130559
ska-decffa2c	skl-6a424a4f	terraform-57350d	2026-10-06 15:45:08.195713
ska-7dd77426	skl-8cdf3afa	security-5805c4	2026-10-06 15:45:08.266046
ska-f2a50833	skl-4eb2e534	kafka-400890	2026-10-06 15:45:08.31198
ska-187b3f20	skl-ea7cf105	sql-7e07b2	2026-10-06 15:45:08.352073
ska-2140aea4	skl-b7ce172c	scala-81e259	2026-10-06 15:45:08.40437
ska-285ea59b	skl-be10d43b	spark-81e259	2026-10-06 15:45:08.407845
ska-727fbc6c	skl-f5290e2f	csharp-283135	2026-10-06 15:45:08.462176
ska-cc9141d9	skl-bcd5cef7	redis-88ebce	2026-10-06 15:45:08.925887
ska-04492eb4	skl-22d9428c	aws-d2dd9e	2026-10-06 15:53:53.489479
ska-953560be	skl-58f0a480	python-d2dd9e	2026-10-06 15:53:53.504643
ska-44039e98	skl-d3238f1b	docker-d2dd9e	2026-10-06 15:53:53.517377
ska-04bc4b90	skl-bfb08093	aws-ef2b04	2026-10-06 15:53:54.207333
ska-28c37e94	skl-7f6b9d27	python-ef2b04	2026-10-06 15:53:54.225123
ska-837a36b6	skl-9e004630	docker-ef2b04	2026-10-06 15:53:54.238963
ska-b6e40c88	skl-f8bb383e	aws-4f7a98	2026-10-06 15:53:54.446205
ska-04d7cf80	skl-bca4d11c	python-4f7a98	2026-10-06 15:53:54.461705
ska-667bac52	skl-96fddef4	docker-4f7a98	2026-10-06 15:53:54.476317
ska-b1318658	skl-60df0999	aws-43fc4a	2026-10-06 15:53:54.648254
ska-31b608aa	skl-11d522ad	python-43fc4a	2026-10-06 15:53:54.6664
ska-d688358b	skl-3be92fb2	docker-43fc4a	2026-10-06 15:53:54.679506
ska-e832ad33	skl-2ae52943	aws-49d293	2026-10-06 15:53:54.871664
ska-89233723	skl-6a0d8cf8	python-49d293	2026-10-06 15:53:54.889728
ska-ffad18c8	skl-ba9ff16e	docker-49d293	2026-10-06 15:53:54.903557
ska-fdb160b0	skl-c3443fbb	aws-63a730	2026-10-06 15:53:55.08667
ska-f1593738	skl-e5124d3d	python-63a730	2026-10-06 15:53:55.102468
ska-7abd5661	skl-6662de11	docker-63a730	2026-10-06 15:53:55.117597
ska-672e6c61	skl-69837764	aws-671eab	2026-10-06 15:53:55.232087
ska-ba4db461	skl-89f9328b	python-671eab	2026-10-06 15:53:55.244236
ska-3133d96a	skl-2ead5df1	docker-671eab	2026-10-06 15:53:55.255699
ska-996fbb22	skl-0d1d0dac	aws-608662	2026-10-06 15:53:55.377309
ska-9221e963	skl-7c289b6c	python-608662	2026-10-06 15:53:55.393298
ska-f28f7aa5	skl-7e3bed93	docker-608662	2026-10-06 15:53:55.407016
ska-6f4881fe	skl-cca8e191	aws-a6014e	2026-10-06 15:53:55.590747
ska-9ec44737	skl-1afb8172	python-a6014e	2026-10-06 15:53:55.605549
ska-dea452a0	skl-ecf34170	docker-a6014e	2026-10-06 15:53:55.618607
ska-05f385a0	skl-7d82df43	aws-a3ecc1	2026-10-06 15:53:55.821088
ska-733a24b2	skl-d96bc360	python-a3ecc1	2026-10-06 15:53:55.83521
ska-725bbdc9	skl-b0dfb0ae	docker-a3ecc1	2026-10-06 15:53:55.846774
ska-4c00cc55	skl-8df3280f	aws-6e4a10	2026-10-06 15:53:55.986153
ska-0e071b75	skl-53d9618b	python-6e4a10	2026-10-06 15:53:55.995144
ska-97461a24	skl-2bb623ce	docker-6e4a10	2026-10-06 15:53:56.004103
ska-6d49fd4a	skl-6ceb940f	aws-10e2c2	2026-10-06 15:53:56.143473
ska-c9e399b4	skl-fb8fd141	python-10e2c2	2026-10-06 15:53:56.155337
ska-74d20185	skl-c8293cda	docker-10e2c2	2026-10-06 15:53:56.166651
ska-6b161649	skl-07823b3d	aws-12f07a	2026-10-06 15:53:56.380836
ska-77fa617e	skl-f6b68f68	python-12f07a	2026-10-06 15:53:56.391487
ska-9e174c25	skl-3805e2a2	docker-12f07a	2026-10-06 15:53:56.400887
ska-319337eb	skl-d334ccad	aws-47c0db	2026-10-06 15:53:56.586698
ska-749d7799	skl-813e87c2	python-47c0db	2026-10-06 15:53:56.599883
ska-4f773ff2	skl-5c3d6e00	docker-47c0db	2026-10-06 15:53:56.608852
ska-9334f6d0	skl-6f70664a	aws-e19c6d	2026-10-06 15:53:56.800147
ska-34e01e29	skl-01477782	python-e19c6d	2026-10-06 15:53:56.81496
ska-bec2375c	skl-b42912e6	docker-e19c6d	2026-10-06 15:53:56.828299
ska-df0b6999	skl-56836ba2	python-35b763	2026-10-06 15:53:58.584018
ska-bd60ff54	skl-0b5c8166	postgresql-35b763	2026-10-06 15:53:58.59966
ska-7b999a63	skl-fee61140	go-c76044	2026-10-06 15:53:58.733553
ska-615e1cf2	skl-037f0bbe	docker-c76044	2026-10-06 15:53:58.748673
ska-6bc6f340	skl-0ec2ba12	terraform-e7ec45	2026-10-06 15:53:58.869186
ska-2e866f45	skl-721ca933	python-752dcf	2026-10-06 15:54:18.729803
ska-ce1a4825	skl-f793fc42	postgresql-752dcf	2026-10-06 15:54:18.73376
ska-cf8b03de	skl-afdef61d	go-bbbf2e	2026-10-06 15:54:18.873593
ska-95dc562f	skl-9a4c6db5	docker-bbbf2e	2026-10-06 15:54:18.879077
ska-67c39e5f	skl-8ee88548	java-0e0df6	2026-10-06 15:54:18.981634
ska-b0689c0e	skl-bb001dea	spring-0e0df6	2026-10-06 15:54:18.986259
ska-1758b696	skl-748d8a58	react-b93a22	2026-10-06 15:54:19.032121
ska-c287200d	skl-fd310ac7	graphql-b93a22	2026-10-06 15:54:19.038245
ska-921c75e8	skl-b7615384	rust-12fc12	2026-10-06 15:54:19.098201
ska-6d5863cc	skl-ab2de335	cplusplus-12fc12	2026-10-06 15:54:19.10155
ska-1b034e94	skl-675d6d0e	terraform-a1196b	2026-10-06 15:54:19.163261
ska-53fda138	skl-53fc71a2	security-42b16e	2026-10-06 15:54:19.225712
ska-b7fe0100	skl-54c801fa	kafka-8387fb	2026-10-06 15:54:19.25952
ska-a3a3021a	skl-ea8d69fa	sql-8afc60	2026-10-06 15:54:19.297041
ska-5ca2fe82	skl-f06aa5de	scala-95408e	2026-10-06 15:54:19.339712
ska-200db873	skl-bd59c03c	spark-95408e	2026-10-06 15:54:19.343143
ska-eb6af862	skl-c20bac7b	csharp-c6cfd4	2026-10-06 15:54:19.381041
ska-7735e4c6	skl-5f1daacd	redis-951acb	2026-10-06 15:54:19.766619
ska-3e89438a	skl-9608d73b	aws-c5d7ef	2026-10-06 16:08:31.851936
ska-f36eb250	skl-f8f0fbd3	python-c5d7ef	2026-10-06 16:08:31.868781
ska-27b91b9b	skl-8c31f274	docker-c5d7ef	2026-10-06 16:08:31.884534
ska-cff35f47	skl-ed53f193	aws-093d8e	2026-10-06 16:08:32.57464
ska-d7c004b2	skl-11d21bcb	python-093d8e	2026-10-06 16:08:32.589695
ska-28e03aac	skl-abd50472	docker-093d8e	2026-10-06 16:08:32.601614
ska-d4321270	skl-fab3bc3a	aws-e2be83	2026-10-06 16:08:32.803405
ska-3ba7683a	skl-8169176f	python-e2be83	2026-10-06 16:08:32.818547
ska-c905ba19	skl-846158a6	docker-e2be83	2026-10-06 16:08:32.832931
ska-95b0bc49	skl-54cfb93d	aws-68916e	2026-10-06 16:08:33.007919
ska-3f9c0117	skl-cab51b2f	python-68916e	2026-10-06 16:08:33.02343
ska-b7b18790	skl-bbdb2e2a	docker-68916e	2026-10-06 16:08:33.036304
ska-de10fd50	skl-de211051	aws-b1b0e8	2026-10-06 16:08:33.230129
ska-1ad75ec4	skl-cc8a1139	python-b1b0e8	2026-10-06 16:08:33.243056
ska-46051417	skl-46cea8bf	docker-b1b0e8	2026-10-06 16:08:33.254236
ska-c434706b	skl-79a6bef1	aws-f76e8f	2026-10-06 16:08:33.389307
ska-0b939526	skl-fe94e4ad	python-f76e8f	2026-10-06 16:08:33.403426
ska-f99a7801	skl-ff217364	docker-f76e8f	2026-10-06 16:08:33.419895
ska-23811dd8	skl-74d727ee	aws-6750bb	2026-10-06 16:08:33.591724
ska-0d0e88f2	skl-df0d00ae	python-6750bb	2026-10-06 16:08:33.607148
ska-a8f6ec05	skl-c8cfe211	docker-6750bb	2026-10-06 16:08:33.620725
ska-28167a83	skl-b09c3cb6	aws-6c62a3	2026-10-06 16:08:33.791048
ska-2fd8d5a6	skl-cf2b5672	python-6c62a3	2026-10-06 16:08:33.805492
ska-292bbdcd	skl-6c760bae	docker-6c62a3	2026-10-06 16:08:33.818323
ska-5f8fa65b	skl-9c1aac44	aws-d1f46d	2026-10-06 16:08:34.013735
ska-cfc81185	skl-1b937088	python-d1f46d	2026-10-06 16:08:34.032642
ska-a1274572	skl-74df74ad	docker-d1f46d	2026-10-06 16:08:34.046765
ska-91e80104	skl-16227518	aws-452ff6	2026-10-06 16:08:34.282413
ska-5a52f0eb	skl-772d5de2	python-452ff6	2026-10-06 16:08:34.296509
ska-f1d3b1c5	skl-fd46ffe4	docker-452ff6	2026-10-06 16:08:34.312879
ska-bace9b38	skl-4a1d7b93	aws-349b93	2026-10-06 16:08:34.493414
ska-f71484e7	skl-464f4c6d	python-349b93	2026-10-06 16:08:34.506785
ska-c8dbcb6b	skl-f28eaf41	docker-349b93	2026-10-06 16:08:34.520797
ska-6f27e22c	skl-f5826a26	aws-68f719	2026-10-06 16:08:34.721012
ska-b4e14e2b	skl-38ef3af5	python-68f719	2026-10-06 16:08:34.73792
ska-07f5c0b2	skl-199622ed	docker-68f719	2026-10-06 16:08:34.755268
ska-e91e3ccf	skl-81205649	aws-f40f71	2026-10-06 16:08:35.036349
ska-dbd5e7ba	skl-fcc99678	python-f40f71	2026-10-06 16:08:35.05317
ska-ce41da87	skl-f4e1f1dd	docker-f40f71	2026-10-06 16:08:35.064344
ska-0e92764b	skl-6eab98c8	aws-ade994	2026-10-06 16:08:35.292554
ska-0fcdb849	skl-3160a283	python-ade994	2026-10-06 16:08:35.310068
ska-d2384daa	skl-20dcf2e7	docker-ade994	2026-10-06 16:08:35.322372
ska-3ae826a6	skl-d03fe990	aws-93ac80	2026-10-06 16:08:35.526456
ska-3c16e6b8	skl-4b6d5294	python-93ac80	2026-10-06 16:08:35.548214
ska-87d2191b	skl-e93262f0	docker-93ac80	2026-10-06 16:08:35.568918
ska-4e7e7950	skl-386d7a33	python-c2ac2c	2026-10-06 16:08:37.380905
ska-755351c6	skl-72796033	postgresql-c2ac2c	2026-10-06 16:08:37.392294
ska-d9b22aa0	skl-86cd46c6	go-69cd0d	2026-10-06 16:08:37.516393
ska-bb8ec6c4	skl-8a36e6d3	docker-69cd0d	2026-10-06 16:08:37.52772
ska-89b1b104	skl-828e897e	terraform-35f467	2026-10-06 16:08:37.647746
ska-5370be97	skl-9e65b549	aws-23d79e	2026-10-06 16:26:48.514984
ska-00e5e375	skl-074f0424	python-23d79e	2026-10-06 16:26:48.523183
ska-057f8194	skl-9db269db	docker-23d79e	2026-10-06 16:26:48.528595
ska-39c8938e	skl-50514083	aws-f129da	2026-10-06 16:26:49.285203
ska-2c7fdd92	skl-4f61e064	python-f129da	2026-10-06 16:26:49.302496
ska-3192d302	skl-5fa91484	docker-f129da	2026-10-06 16:26:49.31665
ska-95cc815b	skl-9c79d36d	aws-59fb92	2026-10-06 16:26:49.551356
ska-bc0f4e13	skl-c7745179	python-59fb92	2026-10-06 16:26:49.565942
ska-9d88d2d5	skl-d2ac87eb	docker-59fb92	2026-10-06 16:26:49.582338
ska-c56b5c5e	skl-3a1fe8e5	aws-5cc358	2026-10-06 16:26:49.762724
ska-50e8b404	skl-70a453e5	python-5cc358	2026-10-06 16:26:49.777471
ska-ca9a4728	skl-5d0c2699	docker-5cc358	2026-10-06 16:26:49.792467
ska-19a4fdfa	skl-6e45940e	aws-56048b	2026-10-06 16:26:49.99909
ska-138e7c4e	skl-3768abbe	python-56048b	2026-10-06 16:26:50.015536
ska-0c0159fa	skl-6b8a98af	docker-56048b	2026-10-06 16:26:50.032284
ska-5a04e060	skl-f77117df	aws-39014b	2026-10-06 16:26:50.212404
ska-d14de74a	skl-e14b742f	python-39014b	2026-10-06 16:26:50.225415
ska-a4d12aab	skl-2c4834f3	docker-39014b	2026-10-06 16:26:50.239927
ska-157dfc82	skl-74203ba4	aws-9001eb	2026-10-06 16:26:50.447504
ska-c1c50463	skl-c0fac905	python-9001eb	2026-10-06 16:26:50.461722
ska-79c8efe5	skl-2db3dced	docker-9001eb	2026-10-06 16:26:50.475214
ska-9d194a0c	skl-a4ea962b	aws-256180	2026-10-06 16:26:50.654727
ska-d2f45615	skl-18d3a57b	python-256180	2026-10-06 16:26:50.673408
ska-b12e33de	skl-57fab609	docker-256180	2026-10-06 16:26:50.688812
ska-c5cd7a08	skl-86df213a	aws-fd2ef4	2026-10-06 16:26:50.902785
ska-cdf9e067	skl-ae60d795	python-fd2ef4	2026-10-06 16:26:50.919945
ska-09b2d2e0	skl-8bd610d2	docker-fd2ef4	2026-10-06 16:26:50.934271
ska-6b91d1de	skl-1b57d6f2	aws-a51217	2026-10-06 16:26:51.18183
ska-32fe1896	skl-d4c6f042	python-a51217	2026-10-06 16:26:51.231677
ska-a92ca7f9	skl-c1f39f09	docker-a51217	2026-10-06 16:26:51.246396
ska-680cb02f	skl-666a77d2	aws-da1f7f	2026-10-06 16:26:51.474331
ska-2402d11b	skl-a8d78e93	python-da1f7f	2026-10-06 16:26:51.487633
ska-16d067ab	skl-dabb37a7	docker-da1f7f	2026-10-06 16:26:51.50468
ska-44a2b93d	skl-bcfc3b78	aws-454f0e	2026-10-06 16:26:51.727702
ska-a9ad5bdb	skl-480f4a7c	python-454f0e	2026-10-06 16:26:51.741536
ska-a9684cdf	skl-dc2c462a	docker-454f0e	2026-10-06 16:26:51.754416
ska-575e6aa3	skl-3ffa000d	aws-eabcc5	2026-10-06 16:26:52.076879
ska-4a0553f7	skl-ba4804f3	python-eabcc5	2026-10-06 16:26:52.091008
ska-4cc79072	skl-82e976e8	docker-eabcc5	2026-10-06 16:26:52.104921
ska-9bd0a139	skl-850d655e	aws-6ad49a	2026-10-06 16:26:52.34658
ska-802d58c8	skl-e7b4b7f0	python-6ad49a	2026-10-06 16:26:52.360273
ska-d0b20b6d	skl-24741a84	docker-6ad49a	2026-10-06 16:26:52.373772
ska-a8e29bdc	skl-5df1b8ee	aws-2a1164	2026-10-06 16:26:52.601078
ska-57457d4e	skl-b17d49a9	python-2a1164	2026-10-06 16:26:52.617678
ska-5ab07a7c	skl-31352b05	docker-2a1164	2026-10-06 16:26:52.633777
ska-3723226c	skl-f82507bc	python-2438c8	2026-10-06 16:26:53.856611
ska-abf5758e	skl-850f65af	postgresql-2438c8	2026-10-06 16:26:53.870552
ska-4f5a25e9	skl-2395de8d	go-2cb0cc	2026-10-06 16:26:54.000704
ska-4774e347	skl-caa05ea1	docker-2cb0cc	2026-10-06 16:26:54.016444
ska-106e2d80	skl-fc1d864e	terraform-094d40	2026-10-06 16:26:54.154506
ska-9606b44e	skl-76459147	aws-983c1d	2026-10-07 03:16:32.063863
ska-b0f984d7	skl-a75d366d	python-983c1d	2026-10-07 03:16:32.078457
ska-a3cff966	skl-a54863e7	docker-983c1d	2026-10-07 03:16:32.090086
ska-bb80b0b2	skl-1d9a0ab6	aws-bd17a6	2026-10-07 03:16:32.807687
ska-0068f8fc	skl-d5f9d4c4	python-bd17a6	2026-10-07 03:16:32.815526
ska-91522d5d	skl-937e6977	docker-bd17a6	2026-10-07 03:16:32.824065
ska-aff38bef	skl-8e7dc33b	aws-822a75	2026-10-07 03:16:32.947651
ska-9304b8e8	skl-4bbda3fa	python-822a75	2026-10-07 03:16:32.954173
ska-e4cdb2b3	skl-22b20011	docker-822a75	2026-10-07 03:16:32.986764
ska-0c4321de	skl-e93c36c5	aws-450813	2026-10-07 03:16:33.082383
ska-95c0173c	skl-aaac99bc	python-450813	2026-10-07 03:16:33.093843
ska-ed62f622	skl-9bc8161b	docker-450813	2026-10-07 03:16:33.103746
ska-82d22e51	skl-4c288fac	aws-d3c271	2026-10-07 03:16:33.185251
ska-fb521d2b	skl-d7fccd8a	python-d3c271	2026-10-07 03:16:33.221014
ska-eea9348e	skl-0e22469a	docker-d3c271	2026-10-07 03:16:33.22911
ska-8769bdb4	skl-880f09a5	aws-81f3e6	2026-10-07 03:16:33.332064
ska-6d66b6de	skl-3cbf7cfd	python-81f3e6	2026-10-07 03:16:33.342371
ska-0392d91b	skl-c04b48cb	docker-81f3e6	2026-10-07 03:16:33.382873
ska-b4275298	skl-2acda0c5	aws-c7bdcf	2026-10-07 03:16:33.49563
ska-8acea118	skl-e89c363c	python-c7bdcf	2026-10-07 03:16:33.503575
ska-403935c7	skl-bc1987ea	docker-c7bdcf	2026-10-07 03:16:33.509932
ska-6bead129	skl-6ab5ba87	aws-a237d8	2026-10-07 03:16:33.630713
ska-ea22755e	skl-795968db	python-a237d8	2026-10-07 03:16:33.678166
ska-f8e77fc7	skl-db9664b1	docker-a237d8	2026-10-07 03:16:33.688564
ska-feec8b42	skl-208bd4e3	aws-7b96ca	2026-10-07 03:16:33.793488
ska-0f5dc676	skl-f8e472c3	python-7b96ca	2026-10-07 03:16:33.798786
ska-fd8ad859	skl-35d3f1a0	docker-7b96ca	2026-10-07 03:16:33.806728
ska-9b8fe146	skl-1e9339c4	aws-4186a4	2026-10-07 03:16:34.009915
ska-a700dc25	skl-734fd87d	python-4186a4	2026-10-07 03:16:34.019996
ska-2245340d	skl-f74c083b	docker-4186a4	2026-10-07 03:16:34.025925
ska-2671e32e	skl-818f0971	aws-d6af9b	2026-10-07 03:16:34.179481
ska-23a81fd7	skl-55a92c07	python-d6af9b	2026-10-07 03:16:34.18856
ska-fe6cc889	skl-e33c808a	docker-d6af9b	2026-10-07 03:16:34.196437
ska-f4f28330	skl-72ebde78	aws-7aa797	2026-10-07 03:16:34.321725
ska-41859c96	skl-35829443	python-7aa797	2026-10-07 03:16:34.331901
ska-9b893197	skl-2290c636	docker-7aa797	2026-10-07 03:16:34.340194
ska-181ab36e	skl-02e7c7fd	aws-a9faad	2026-10-07 03:16:34.540055
ska-3c72815d	skl-10c51a7d	python-a9faad	2026-10-07 03:16:34.547849
ska-a5772139	skl-210d0d65	docker-a9faad	2026-10-07 03:16:34.556034
ska-f1d9b4f5	skl-f928a295	aws-c05db2	2026-10-07 03:16:34.663035
ska-d31fba76	skl-82bddb85	python-c05db2	2026-10-07 03:16:34.670858
ska-c9980448	skl-424c47a9	docker-c05db2	2026-10-07 03:16:34.675971
ska-d3e8fd7f	skl-47ba3ae4	aws-905246	2026-10-07 03:16:34.800949
ska-ffa1158c	skl-ddfb9e48	python-905246	2026-10-07 03:16:34.810563
ska-7d52c175	skl-c20d41ec	docker-905246	2026-10-07 03:16:34.819116
ska-30433784	skl-d4cfd020	python-47095b	2026-10-07 03:16:35.275777
ska-89e65b68	skl-01a92f84	postgresql-47095b	2026-10-07 03:16:35.292703
ska-9ca5f539	skl-86306359	go-688efd	2026-10-07 03:16:35.390435
ska-ef6cedc8	skl-df6117b5	docker-688efd	2026-10-07 03:16:35.39577
ska-d33b4315	skl-0562174e	terraform-7ccada	2026-10-07 03:16:35.457537
ska-83aa3625	skl-d90d9529	aws-cf455b	2026-10-07 03:45:24.649978
ska-6be4c369	skl-fcdd5d9f	python-cf455b	2026-10-07 03:45:24.656527
ska-6d6faef7	skl-49b4b880	docker-cf455b	2026-10-07 03:45:24.662423
ska-219240e9	skl-d65557f2	aws-ed5804	2026-10-07 03:45:24.942207
ska-2c7ffe17	skl-90cd1fd8	python-ed5804	2026-10-07 03:45:24.958381
ska-4ee58d7f	skl-850adba5	docker-ed5804	2026-10-07 03:45:24.961989
ska-9784e6b4	skl-540fb741	aws-92d634	2026-10-07 03:45:25.013104
ska-2500c02a	skl-e3ca0d9c	python-92d634	2026-10-07 03:45:25.031604
ska-75c342aa	skl-e1c9deec	docker-92d634	2026-10-07 03:45:25.034192
ska-54d16f41	skl-5bb53aad	aws-c8baef	2026-10-07 03:45:25.078826
ska-6bb65cc6	skl-ff59e54b	python-c8baef	2026-10-07 03:45:25.082229
ska-22a484e0	skl-dcd4adc6	docker-c8baef	2026-10-07 03:45:25.099552
ska-4e860aeb	skl-cc80749b	aws-477aec	2026-10-07 03:45:25.145667
ska-c7420d8b	skl-a859fc37	python-477aec	2026-10-07 03:45:25.149198
ska-7b69b74e	skl-267a81c9	docker-477aec	2026-10-07 03:45:25.17118
ska-b2caccb8	skl-e8355a86	aws-6a2b7c	2026-10-07 03:45:25.214216
ska-e82a19cb	skl-3811abbd	python-6a2b7c	2026-10-07 03:45:25.21745
ska-a85e5827	skl-f22429c0	docker-6a2b7c	2026-10-07 03:45:25.234263
ska-ef76fecc	skl-cce9daa5	aws-efbed4	2026-10-07 03:45:25.273872
ska-067ff741	skl-f95b6433	python-efbed4	2026-10-07 03:45:25.277058
ska-79ffa2d3	skl-77c24eb9	docker-efbed4	2026-10-07 03:45:25.281369
ska-c9527a98	skl-f411e69e	aws-a7014e	2026-10-07 03:45:25.359022
ska-bd358249	skl-4f72e975	python-a7014e	2026-10-07 03:45:25.362752
ska-5373132e	skl-8c2c4081	docker-a7014e	2026-10-07 03:45:25.366193
ska-eccfe115	skl-0a59162e	aws-cef034	2026-10-07 03:45:25.416706
ska-25eddbe7	skl-a67f1701	python-cef034	2026-10-07 03:45:25.433066
ska-4e51a1c0	skl-9bff9885	docker-cef034	2026-10-07 03:45:25.436772
ska-286ea8ce	skl-6acb0908	aws-b1c92b	2026-10-07 03:45:25.499131
ska-94eeffe9	skl-58753777	python-b1c92b	2026-10-07 03:45:25.504492
ska-2a34fd48	skl-ef210a9d	docker-b1c92b	2026-10-07 03:45:25.508871
ska-40b5c585	skl-75f0d9aa	aws-d0930f	2026-10-07 03:45:25.565503
ska-a5d3be7d	skl-17d01d30	python-d0930f	2026-10-07 03:45:25.568888
ska-c48f05de	skl-ea74cf2d	docker-d0930f	2026-10-07 03:45:25.573948
ska-43d3510a	skl-3b4094d0	aws-4d95f9	2026-10-07 03:45:25.626055
ska-bfc28bf5	skl-82fbbc5e	python-4d95f9	2026-10-07 03:45:25.633526
ska-db25fa04	skl-b3903480	docker-4d95f9	2026-10-07 03:45:25.637949
ska-8f19ecfb	skl-b11291f6	aws-daf4ee	2026-10-07 03:45:25.724749
ska-83e7788a	skl-cec1c907	python-daf4ee	2026-10-07 03:45:25.730401
ska-105a8bae	skl-5744ee10	docker-daf4ee	2026-10-07 03:45:25.735017
ska-1015f2a9	skl-07d9ac2d	aws-520b74	2026-10-07 03:45:25.794148
ska-1b1a935a	skl-4afed963	python-520b74	2026-10-07 03:45:25.798942
ska-d672e328	skl-c2b20fe5	docker-520b74	2026-10-07 03:45:25.802063
ska-ccd76b66	skl-3bce80df	aws-6cb14e	2026-10-07 03:45:25.865719
ska-0ea60869	skl-0e348e01	python-6cb14e	2026-10-07 03:45:25.869512
ska-11df1c3c	skl-8489c27e	docker-6cb14e	2026-10-07 03:45:25.873244
ska-fef83024	skl-0b73088c	python-afda8c	2026-10-07 03:45:26.295171
ska-a6fe84db	skl-8c9c381c	postgresql-afda8c	2026-10-07 03:45:26.301234
ska-59931165	skl-822e633a	go-c06a82	2026-10-07 03:45:26.364279
ska-3f845bb3	skl-e7a9428f	docker-c06a82	2026-10-07 03:45:26.369336
ska-cf32eed7	skl-156363c0	terraform-a200b5	2026-10-07 03:45:26.431077
ska-2233dcdb	skl-210cb9cd	python-caa7a5	2026-10-07 04:18:52.946041
ska-d06a78c0	skl-5100cef1	postgresql-caa7a5	2026-10-07 04:18:52.950747
ska-3c1affc1	skl-b50b2f38	go-801121	2026-10-07 04:18:52.998989
ska-0d11b6e8	skl-874cd698	docker-801121	2026-10-07 04:18:53.003789
ska-741e76c8	skl-85e52bd6	java-bd2e37	2026-10-07 04:18:53.035106
ska-aa4cf0d4	skl-72d5be0f	spring-bd2e37	2026-10-07 04:18:53.044935
ska-9716a14b	skl-5cfffa9f	react-28c83a	2026-10-07 04:18:53.083384
ska-f7d12882	skl-eae750d3	graphql-28c83a	2026-10-07 04:18:53.094381
ska-0c6dc9e6	skl-1867fe77	rust-47b63a	2026-10-07 04:18:53.127801
ska-784d5196	skl-382bc4ca	cplusplus-47b63a	2026-10-07 04:18:53.139966
ska-254309ed	skl-1e505ef4	terraform-104280	2026-10-07 04:18:53.177517
ska-9131a53f	skl-9aa2747f	security-73f8c6	2026-10-07 04:18:53.220015
ska-e899a3e1	skl-02ab43fb	kafka-c4433d	2026-10-07 04:18:53.250622
ska-9a57d5b4	skl-b024da3f	sql-d60eab	2026-10-07 04:18:53.281345
ska-e04a993c	skl-e3091207	scala-6072f9	2026-10-07 04:18:53.343512
ska-c261e442	skl-f6f571f9	spark-6072f9	2026-10-07 04:18:53.353117
ska-c5c21dd7	skl-226a7931	csharp-88d61f	2026-10-07 04:18:53.428222
ska-7b613008	skl-7406f2b3	redis-c58520	2026-10-07 04:18:53.917956
ska-44ed5397	skl-27bf98a1	aws-dea4ed	2026-10-07 04:19:10.071329
ska-fb24b389	skl-3c3d35d0	python-dea4ed	2026-10-07 04:19:10.075156
ska-35f17545	skl-734e7c96	docker-dea4ed	2026-10-07 04:19:10.07964
ska-1de851df	skl-355ca1b3	aws-2a8c06	2026-10-07 04:19:10.230333
ska-0f15b348	skl-a52e6053	python-2a8c06	2026-10-07 04:19:10.23392
ska-213806f5	skl-7b589fa5	docker-2a8c06	2026-10-07 04:19:10.237226
ska-1b56d058	skl-9ea56cdf	aws-f9162a	2026-10-07 04:19:10.306617
ska-40658fc5	skl-2e8e12b7	python-f9162a	2026-10-07 04:19:10.309633
ska-aaf4620f	skl-2b08cd67	docker-f9162a	2026-10-07 04:19:10.312329
ska-94189cc6	skl-ee0b5e65	aws-999502	2026-10-07 04:19:10.376963
ska-8390c878	skl-5bd7a25f	python-999502	2026-10-07 04:19:10.398891
ska-4fcac69c	skl-9e6b81b2	docker-999502	2026-10-07 04:19:10.401705
ska-b41ddaf4	skl-25f30feb	aws-b5eb95	2026-10-07 04:19:10.457557
ska-2bbafb9f	skl-17ea4066	python-b5eb95	2026-10-07 04:19:10.466171
ska-d81c9de6	skl-5d500ca6	docker-b5eb95	2026-10-07 04:19:10.472621
ska-00135a91	skl-c02c6d13	aws-fcb785	2026-10-07 04:19:10.565901
ska-4934d9e1	skl-24122476	python-fcb785	2026-10-07 04:19:10.57743
ska-bad2a9ae	skl-99975af4	docker-fcb785	2026-10-07 04:19:10.586787
ska-297850fe	skl-d8bb4d98	aws-d6f9a8	2026-10-07 04:19:10.673038
ska-8b3248c9	skl-608a8193	python-d6f9a8	2026-10-07 04:19:10.677689
ska-56d963a8	skl-e7669023	docker-d6f9a8	2026-10-07 04:19:10.681667
ska-2f9e4119	skl-5c888879	aws-fb9027	2026-10-07 04:19:10.799123
ska-f888e318	skl-374f20d2	python-fb9027	2026-10-07 04:19:10.810247
ska-bf40a5f6	skl-0cb9525c	docker-fb9027	2026-10-07 04:19:10.819357
ska-67954c2e	skl-d31c9a6f	aws-845cdf	2026-10-07 04:19:10.948228
ska-f5d2c1e9	skl-747ebc04	python-845cdf	2026-10-07 04:19:10.958849
ska-879a2738	skl-184ae6ad	docker-845cdf	2026-10-07 04:19:10.967075
ska-9a63c385	skl-68072045	aws-22f055	2026-10-07 04:19:11.105735
ska-1dd0d5b5	skl-04a06c90	python-22f055	2026-10-07 04:19:11.10982
ska-b78a4413	skl-d78c93fa	docker-22f055	2026-10-07 04:19:11.113939
ska-8290b77d	skl-eef374df	aws-0b0ce9	2026-10-07 04:19:11.282703
ska-45b931f2	skl-40a04312	python-0b0ce9	2026-10-07 04:19:11.292916
ska-2290825b	skl-5b231ea0	docker-0b0ce9	2026-10-07 04:19:11.301782
ska-dde5e160	skl-cbb4c464	aws-e00126	2026-10-07 04:19:11.461153
ska-557522ac	skl-240bc523	python-e00126	2026-10-07 04:19:11.466251
ska-a5e0462e	skl-3c084dd6	docker-e00126	2026-10-07 04:19:11.471424
ska-1f5cd49b	skl-3ef57902	aws-08a875	2026-10-07 04:19:11.670924
ska-0edfba2a	skl-6fafca66	python-08a875	2026-10-07 04:19:11.683149
ska-da141361	skl-321bca15	docker-08a875	2026-10-07 04:19:11.692847
ska-927e02f1	skl-be50c1d1	aws-e1db97	2026-10-07 04:19:11.835905
ska-f654b943	skl-1a9a428c	python-e1db97	2026-10-07 04:19:11.847965
ska-d09d5d44	skl-0353630d	docker-e1db97	2026-10-07 04:19:11.857256
ska-4777e31d	skl-3e0cf59c	aws-d8c0b5	2026-10-07 04:19:11.974901
ska-90795e70	skl-5711668d	python-d8c0b5	2026-10-07 04:19:11.985103
ska-6b49e750	skl-4c5583bb	docker-d8c0b5	2026-10-07 04:19:11.99399
ska-04ddb776	skl-e26d91e3	python-37cbbd	2026-10-07 04:19:12.887745
ska-db1a6f26	skl-ea6204a2	postgresql-37cbbd	2026-10-07 04:19:12.895484
ska-9941f219	skl-6b63715b	go-c6f484	2026-10-07 04:19:13.020596
ska-ed7613ea	skl-d934b7a9	docker-c6f484	2026-10-07 04:19:13.045292
ska-6def4c45	skl-dcb0861c	terraform-d39559	2026-10-07 04:19:13.127211
ska-4093bce4	skl-16965f31	python-2df0b9	2026-10-07 05:17:54.590789
ska-642dfe0f	skl-a5b120e3	postgresql-2df0b9	2026-10-07 05:17:54.594877
ska-f89ad086	skl-fd2bcc62	go-f3e975	2026-10-07 05:17:54.661715
ska-1d9ff46f	skl-c289fd3c	docker-f3e975	2026-10-07 05:17:54.666541
ska-29ecb0e7	skl-6a119faa	java-c60f9d	2026-10-07 05:17:54.696215
ska-4041d935	skl-51100ce4	spring-c60f9d	2026-10-07 05:17:54.73099
ska-d65c0cb0	skl-87f9ba79	react-2b6fec	2026-10-07 05:17:54.792987
ska-b5e697cb	skl-1f1bd97d	graphql-2b6fec	2026-10-07 05:17:54.795958
ska-5e720c4a	skl-7e459728	rust-77078f	2026-10-07 05:17:54.824275
ska-46e22c08	skl-5309f381	cplusplus-77078f	2026-10-07 05:17:54.837888
ska-70eef638	skl-dedbab53	terraform-4d45ca	2026-10-07 05:17:54.902246
ska-8a228717	skl-aeee0d74	security-c17d3b	2026-10-07 05:17:54.939771
ska-91b4d0dc	skl-4381e798	kafka-73d9ef	2026-10-07 05:17:54.959265
ska-f08d1e94	skl-4800f721	sql-f90e9f	2026-10-07 05:17:55.053702
ska-33cd875e	skl-f7c622fa	scala-bfda33	2026-10-07 05:17:55.085698
ska-9bf84995	skl-14d42743	spark-bfda33	2026-10-07 05:17:55.08802
ska-19dd7032	skl-87278406	csharp-d41b16	2026-10-07 05:17:55.198006
ska-5c6bed75	skl-3c2ae7ca	redis-641e50	2026-10-07 05:17:55.813023
ska-5ee7cad6	skl-590b4503	aws-2d58a8	2026-10-07 05:18:09.991168
ska-83fb6be5	skl-f707518c	python-2d58a8	2026-10-07 05:18:09.993909
ska-dd5fd6cd	skl-2239749b	docker-2d58a8	2026-10-07 05:18:09.996827
ska-d620284c	skl-fbf3dcb6	aws-b5dc25	2026-10-07 05:18:10.133165
ska-290f360a	skl-7239c3b1	python-b5dc25	2026-10-07 05:18:10.13562
ska-9d832b1d	skl-19ca8d70	docker-b5dc25	2026-10-07 05:18:10.138002
ska-9e30ff05	skl-fdaefc8d	aws-7c65d0	2026-10-07 05:18:10.195562
ska-8a2ebe45	skl-39f22265	python-7c65d0	2026-10-07 05:18:10.198108
ska-5001380f	skl-06ecc466	docker-7c65d0	2026-10-07 05:18:10.200447
ska-0a35502e	skl-8693f406	aws-f907c4	2026-10-07 05:18:10.254724
ska-7973a629	skl-974959ef	python-f907c4	2026-10-07 05:18:10.257569
ska-39301973	skl-5c7c165c	docker-f907c4	2026-10-07 05:18:10.259908
ska-92e19f40	skl-1b1822f6	aws-de6151	2026-10-07 05:18:10.315275
ska-fbe8570c	skl-bcf5462d	python-de6151	2026-10-07 05:18:10.31773
ska-f6866398	skl-70dc9320	docker-de6151	2026-10-07 05:18:10.320161
ska-de091384	skl-386ad77c	aws-90431f	2026-10-07 05:18:10.377189
ska-89e4a946	skl-ac95c09e	python-90431f	2026-10-07 05:18:10.379829
ska-170623f1	skl-a6172b39	docker-90431f	2026-10-07 05:18:10.382048
ska-85ed6a0e	skl-dba4519d	aws-87abe2	2026-10-07 05:18:10.440442
ska-4fcbc829	skl-ed165774	python-87abe2	2026-10-07 05:18:10.442736
ska-127e055d	skl-34c79a97	docker-87abe2	2026-10-07 05:18:10.445308
ska-4c487772	skl-5429b7d0	aws-61d43a	2026-10-07 05:18:10.532869
ska-cd9a73a8	skl-d693bdc4	python-61d43a	2026-10-07 05:18:10.540842
ska-8ba9653a	skl-24a4401d	docker-61d43a	2026-10-07 05:18:10.547844
ska-66402eca	skl-2e327d7d	aws-bad8dc	2026-10-07 05:18:10.690621
ska-3907a8ee	skl-06b48529	python-bad8dc	2026-10-07 05:18:10.703722
ska-548e1ecc	skl-7d7fc7d6	docker-bad8dc	2026-10-07 05:18:10.72146
ska-9d25d1fa	skl-7b676ae6	aws-f44f24	2026-10-07 05:18:10.838826
ska-5a440c7e	skl-ef25e9d1	python-f44f24	2026-10-07 05:18:10.846613
ska-2c0528ce	skl-031d327a	docker-f44f24	2026-10-07 05:18:10.85438
ska-ad27a434	skl-5d69c7c8	aws-470e81	2026-10-07 05:18:10.98703
ska-ee64b0a6	skl-c74feec6	python-470e81	2026-10-07 05:18:10.99464
ska-4857ffb7	skl-fe0db5d3	docker-470e81	2026-10-07 05:18:11.001671
ska-21ceee8b	skl-6f81eeb5	aws-6f14a0	2026-10-07 05:18:11.138322
ska-34ec5a12	skl-eac4d853	python-6f14a0	2026-10-07 05:18:11.146771
ska-53757b6e	skl-7d3f086c	docker-6f14a0	2026-10-07 05:18:11.151902
ska-cc8335a9	skl-b516a938	aws-a523f9	2026-10-07 05:18:11.331737
ska-ac237bfb	skl-b87315e5	python-a523f9	2026-10-07 05:18:11.351078
ska-c4db3413	skl-d22864ee	docker-a523f9	2026-10-07 05:18:11.364155
ska-a4a9c84b	skl-c1dccbed	aws-6b4240	2026-10-07 05:18:11.554566
ska-8be2a93f	skl-f01bd94c	python-6b4240	2026-10-07 05:18:11.563165
ska-4b081eba	skl-2a1a7c0c	docker-6b4240	2026-10-07 05:18:11.573599
ska-2ad20328	skl-e100abb2	aws-7896db	2026-10-07 05:18:11.688715
ska-93a2703a	skl-4eb16131	python-7896db	2026-10-07 05:18:11.693502
ska-188c8383	skl-1c56a499	docker-7896db	2026-10-07 05:18:11.704988
ska-3407a98e	skl-a5a6135c	python-85aa8b	2026-10-07 05:18:13.077898
ska-9f90ba47	skl-fd5873d1	postgresql-85aa8b	2026-10-07 05:18:13.084653
ska-26227976	skl-e2a4d23d	go-f5d432	2026-10-07 05:18:13.240863
ska-4a75aa9c	skl-9ed21dea	docker-f5d432	2026-10-07 05:18:13.247441
ska-930d8797	skl-9a17035e	terraform-789c1b	2026-10-07 05:18:13.397475
ska-85eb9a6a	skl-eeb1f9b4	python-659749	2026-10-08 03:22:40.949722
ska-9846956e	skl-9f2d57d4	postgresql-659749	2026-10-08 03:22:40.962135
ska-f5202464	skl-7102b117	go-177f8a	2026-10-08 03:22:41.108363
ska-1db1d4e4	skl-7a1dcfd0	docker-177f8a	2026-10-08 03:22:41.12148
ska-5f18389f	skl-ba18c6f4	java-bba7b5	2026-10-08 03:22:41.204876
ska-10551aeb	skl-45a8b819	spring-bba7b5	2026-10-08 03:22:41.21446
ska-a1994ece	skl-2a000b7f	react-229644	2026-10-08 03:22:41.31166
ska-862b01ca	skl-2bf4208c	graphql-229644	2026-10-08 03:22:41.324244
ska-535e08e2	skl-852ea0d6	rust-6fb002	2026-10-08 03:22:41.405356
ska-30b2b0aa	skl-32462d4a	cplusplus-6fb002	2026-10-08 03:22:41.435442
ska-c079aa9e	skl-ca5b4261	terraform-e2d2d8	2026-10-08 03:22:41.515379
ska-ba8a9fee	skl-12e85f13	security-2b6a1b	2026-10-08 03:22:41.597084
ska-984164fa	skl-ff4e4e0c	kafka-9e3a01	2026-10-08 03:22:41.681852
ska-0adbe1dd	skl-d9bbacf1	sql-640d46	2026-10-08 03:22:41.748095
ska-1e36dce6	skl-fb93218f	scala-07fc6c	2026-10-08 03:22:41.83569
ska-ac08354f	skl-a49b7f69	spark-07fc6c	2026-10-08 03:22:41.841892
ska-ef7e64b6	skl-2e4dcbf3	csharp-c8fef0	2026-10-08 03:22:41.911704
ska-bac8d0e6	skl-d29bece3	redis-ec5b64	2026-10-08 03:22:42.423496
ska-be583f14	skl-dc95cf9a	aws-3da52e	2026-10-08 03:23:00.943906
ska-74225baa	skl-62564719	python-3da52e	2026-10-08 03:23:00.952011
ska-a5b3eaf0	skl-39e62232	docker-3da52e	2026-10-08 03:23:00.973802
ska-07c49640	skl-26f14ca6	aws-66cae3	2026-10-08 03:23:01.234442
ska-ffd2a47e	skl-a5490b10	python-66cae3	2026-10-08 03:23:01.238639
ska-96b73700	skl-c775eb58	docker-66cae3	2026-10-08 03:23:01.243346
ska-8ae33e34	skl-2bc81ebc	aws-73491d	2026-10-08 03:23:01.361919
ska-69ab24df	skl-4e671f1f	python-73491d	2026-10-08 03:23:01.36929
ska-e88d4e01	skl-328544d3	docker-73491d	2026-10-08 03:23:01.375599
ska-cdb32033	skl-1020a589	aws-26ff20	2026-10-08 03:23:01.48618
ska-1c5e85cc	skl-2241d1b8	python-26ff20	2026-10-08 03:23:01.493011
ska-4318dddf	skl-7b621fdd	docker-26ff20	2026-10-08 03:23:01.498702
ska-5f6c2536	skl-38d53b2d	aws-e43e0c	2026-10-08 03:23:01.619901
ska-58e1023e	skl-9e881ead	python-e43e0c	2026-10-08 03:23:01.625999
ska-460f6d93	skl-5802ce0c	docker-e43e0c	2026-10-08 03:23:01.632609
ska-4cd75596	skl-d0d7a624	aws-72770a	2026-10-08 03:23:01.753377
ska-8cd0001c	skl-cbfafa8c	python-72770a	2026-10-08 03:23:01.76031
ska-170b93d5	skl-02205553	docker-72770a	2026-10-08 03:23:01.766418
ska-b77a0db3	skl-83456a68	aws-d83703	2026-10-08 03:23:01.894949
ska-f619490b	skl-a862ae84	python-d83703	2026-10-08 03:23:01.9021
ska-32f7b0f2	skl-aeea718e	docker-d83703	2026-10-08 03:23:01.909206
ska-0f273b01	skl-8fa4a9a9	aws-300f11	2026-10-08 03:23:02.043854
ska-f2d677a5	skl-d3f97e74	python-300f11	2026-10-08 03:23:02.05049
ska-5c0215e2	skl-2a8490e7	docker-300f11	2026-10-08 03:23:02.05674
ska-7f9ed7ce	skl-2f4026cf	aws-58af24	2026-10-08 03:23:02.194161
ska-dff4b521	skl-4fd3ae04	python-58af24	2026-10-08 03:23:02.201773
ska-e860f4cf	skl-e258e877	docker-58af24	2026-10-08 03:23:02.208952
ska-57fa75a0	skl-edc16929	aws-e2d6dc	2026-10-08 03:23:02.313251
ska-f370adbe	skl-1ae7fe47	python-e2d6dc	2026-10-08 03:23:02.319213
ska-e6596019	skl-45a493a0	docker-e2d6dc	2026-10-08 03:23:02.326827
ska-77a788cd	skl-94226086	aws-9cd746	2026-10-08 03:23:02.433157
ska-5938a56a	skl-ac8db799	python-9cd746	2026-10-08 03:23:02.4378
ska-a612fdd7	skl-aefacc93	docker-9cd746	2026-10-08 03:23:02.442034
ska-a4b82bfa	skl-640302f4	aws-ee6464	2026-10-08 03:23:02.581406
ska-25ef2239	skl-6e2373fa	python-ee6464	2026-10-08 03:23:02.58683
ska-728d1371	skl-34308da6	docker-ee6464	2026-10-08 03:23:02.591047
ska-36a4fb33	skl-6214d01d	aws-5539fa	2026-10-08 03:23:02.765327
ska-8e888f48	skl-a3a17dd0	python-5539fa	2026-10-08 03:23:02.771628
ska-62a827b5	skl-07885906	docker-5539fa	2026-10-08 03:23:02.777709
ska-b2c556c8	skl-8dadb942	aws-4d3f97	2026-10-08 03:23:02.903008
ska-87c0fd0f	skl-de6b96b3	python-4d3f97	2026-10-08 03:23:02.90981
ska-9f996751	skl-cacb44a6	docker-4d3f97	2026-10-08 03:23:02.918062
ska-5894c03e	skl-51c2403c	aws-437bfb	2026-10-08 03:23:03.097575
ska-11d69eaf	skl-617686de	python-437bfb	2026-10-08 03:23:03.103573
ska-9df33b4c	skl-05d6cf17	docker-437bfb	2026-10-08 03:23:03.108059
ska-873e5ef6	skl-d2c1e1eb	python-54b679	2026-10-08 03:23:05.126894
ska-2a17a583	skl-fc82b316	postgresql-54b679	2026-10-08 03:23:05.13113
ska-5c7375de	skl-39486d05	go-2279d1	2026-10-08 03:23:05.230366
ska-1afbba83	skl-f96765c5	docker-2279d1	2026-10-08 03:23:05.235272
ska-f29b2dcc	skl-c7e92200	terraform-3e2c32	2026-10-08 03:23:05.329635
ska-fae3dd25	skl-de702bf9	system architecture	2026-10-08 04:06:51.929086
ska-cba9356a	skl-de702bf9	system-architecture	2026-10-08 04:06:51.932059
ska-437d8231	skl-66028f20	python-1f1be1	2026-10-08 04:30:30.500104
ska-2d221506	skl-fcf462af	postgresql-1f1be1	2026-10-08 04:30:30.509895
ska-5cf9bbaa	skl-bd8b57a2	go-d1e278	2026-10-08 04:30:30.607374
ska-6d79f2de	skl-62ffc2a7	docker-d1e278	2026-10-08 04:30:30.61351
ska-a1ce0e3b	skl-04f80554	java-01cf41	2026-10-08 04:30:30.693365
ska-bb8d6412	skl-a3d04eba	spring-01cf41	2026-10-08 04:30:30.700854
ska-849c7a19	skl-2d4360f2	react-9da020	2026-10-08 04:30:30.769512
ska-b4b44e3d	skl-a394819d	graphql-9da020	2026-10-08 04:30:30.784576
ska-dd929cfb	skl-052fb16d	rust-8f6be7	2026-10-08 04:30:30.870106
ska-3f735207	skl-ac269134	cplusplus-8f6be7	2026-10-08 04:30:30.889865
ska-c57f4e70	skl-701498fa	terraform-e6b00f	2026-10-08 04:30:30.976187
ska-e3003c4a	skl-be46ae5d	security-e3a87b	2026-10-08 04:30:31.096898
ska-be639a63	skl-514d5df2	kafka-bbeaf8	2026-10-08 04:30:31.155712
ska-6deb8d74	skl-3136d68f	sql-3d501f	2026-10-08 04:30:31.232726
ska-2fe01de1	skl-b312da90	scala-20e28b	2026-10-08 04:30:31.30856
ska-c08e442e	skl-c9b04516	spark-20e28b	2026-10-08 04:30:31.314378
ska-fb91c5f1	skl-83ae4cc8	csharp-a4f71c	2026-10-08 04:30:31.384922
ska-1e01bc75	skl-94f1b93a	redis-6615c5	2026-10-08 04:30:31.786704
ska-d6ed9d69	skl-54ed39ce	aws-5d6b9b	2026-10-08 04:30:52.065437
ska-a8e9ab37	skl-b23ac58d	python-5d6b9b	2026-10-08 04:30:52.071709
ska-184de890	skl-2e58d9bc	docker-5d6b9b	2026-10-08 04:30:52.077061
ska-b1ca38b0	skl-e8e04f06	aws-ca9b92	2026-10-08 04:30:52.320818
ska-11d219d1	skl-a2295c26	python-ca9b92	2026-10-08 04:30:52.32524
ska-e0155972	skl-437a8ed9	docker-ca9b92	2026-10-08 04:30:52.328866
ska-cea95a6e	skl-9ae345cb	aws-e8e81d	2026-10-08 04:30:52.47633
ska-cc93b02c	skl-7e0f505f	python-e8e81d	2026-10-08 04:30:52.47937
ska-2aa543b1	skl-80e153fb	docker-e8e81d	2026-10-08 04:30:52.482304
ska-732e9b57	skl-8ce1e5d8	aws-4b030f	2026-10-08 04:30:52.634922
ska-a573db6b	skl-25c98294	python-4b030f	2026-10-08 04:30:52.637817
ska-63180bf6	skl-491af44d	docker-4b030f	2026-10-08 04:30:52.640334
ska-5ad97bac	skl-58c0b57f	aws-f0c5b8	2026-10-08 04:30:52.696589
ska-1af3bb51	skl-db84bd75	python-f0c5b8	2026-10-08 04:30:52.702882
ska-c9cc158b	skl-907a7c27	docker-f0c5b8	2026-10-08 04:30:52.706438
ska-f6760851	skl-9a1fbdbc	aws-27cf0f	2026-10-08 04:30:52.787153
ska-33854320	skl-1da3b7da	python-27cf0f	2026-10-08 04:30:52.790163
ska-76d70f43	skl-dcd747e9	docker-27cf0f	2026-10-08 04:30:52.795714
ska-fedfeb9b	skl-02e53e66	aws-6e9d95	2026-10-08 04:30:52.852263
ska-571fc9f9	skl-a01a7ae1	python-6e9d95	2026-10-08 04:30:52.855562
ska-c5e191ea	skl-1928bfdc	docker-6e9d95	2026-10-08 04:30:52.861524
ska-e6e9add0	skl-529bcc1e	aws-5167d3	2026-10-08 04:30:52.926938
ska-23b32b93	skl-ec3902c2	python-5167d3	2026-10-08 04:30:52.929941
ska-20ef0060	skl-3d2db957	docker-5167d3	2026-10-08 04:30:52.933246
ska-f266e185	skl-0d0d3d3a	aws-67ff73	2026-10-08 04:30:53.000711
ska-c6643b7d	skl-84b78fe9	python-67ff73	2026-10-08 04:30:53.003883
ska-919804fe	skl-5ac70900	docker-67ff73	2026-10-08 04:30:53.006925
ska-1c6e2d95	skl-42aec20c	aws-a7bb9e	2026-10-08 04:30:53.083249
ska-8a41bc87	skl-2b1efa4d	python-a7bb9e	2026-10-08 04:30:53.086689
ska-58e311cd	skl-5f560026	docker-a7bb9e	2026-10-08 04:30:53.089658
ska-f0304f17	skl-cd70588f	aws-f61689	2026-10-08 04:30:53.15661
ska-f530ebae	skl-5cf01157	python-f61689	2026-10-08 04:30:53.160654
ska-2a30d786	skl-68e05669	docker-f61689	2026-10-08 04:30:53.163089
ska-e7938c19	skl-11ecfd94	aws-0d35a3	2026-10-08 04:30:53.273657
ska-07d0acd7	skl-cf5e483f	python-0d35a3	2026-10-08 04:30:53.276939
ska-0fd15aa8	skl-4f720bdf	docker-0d35a3	2026-10-08 04:30:53.279914
ska-c967fa60	skl-41eae265	aws-88ab89	2026-10-08 04:30:53.379666
ska-865f4a86	skl-85998c29	python-88ab89	2026-10-08 04:30:53.382777
ska-5c2d51c3	skl-fd679e9f	docker-88ab89	2026-10-08 04:30:53.38696
ska-73b902bd	skl-f1f282fc	aws-746bf0	2026-10-08 04:30:53.478522
ska-428c8e68	skl-83f2cc4e	python-746bf0	2026-10-08 04:30:53.481236
ska-09a741ac	skl-a336dfcf	docker-746bf0	2026-10-08 04:30:53.48526
ska-b45d485c	skl-1096dd58	aws-3475b4	2026-10-08 04:30:53.5755
ska-e0d4f793	skl-63668862	python-3475b4	2026-10-08 04:30:53.578565
ska-b8a9f9f6	skl-c2a13570	docker-3475b4	2026-10-08 04:30:53.580969
ska-0b3b3245	skl-463b86cd	python-48ad51	2026-10-08 04:30:55.256611
ska-a3573995	skl-cb6e326f	postgresql-48ad51	2026-10-08 04:30:55.260469
ska-3c38a385	skl-16489fce	go-57a6bb	2026-10-08 04:30:55.325547
ska-6a8088fe	skl-a69230b6	docker-57a6bb	2026-10-08 04:30:55.328623
ska-1f8afadc	skl-9b0da69a	terraform-6e6fff	2026-10-08 04:30:55.364134
ska-8120b1f8	skl-b49e1e75	python-5f83f5	2026-10-08 08:33:49.669844
ska-9129010b	skl-fc5aff3c	postgresql-5f83f5	2026-10-08 08:33:49.676733
ska-7a09ea3c	skl-b37a3ed2	go-58a506	2026-10-08 08:33:49.735001
ska-d5a8114e	skl-f8c377ff	docker-58a506	2026-10-08 08:33:49.739447
ska-f4bbdee4	skl-7283aecb	java-58bd5a	2026-10-08 08:33:49.792267
ska-1b3eb5f9	skl-dd8f9c8c	spring-58bd5a	2026-10-08 08:33:49.796562
ska-8e4abff2	skl-092b4733	react-3dfafe	2026-10-08 08:33:49.846409
ska-07bf4705	skl-77d63e27	graphql-3dfafe	2026-10-08 08:33:49.850843
ska-9a9ad87a	skl-0118d345	rust-30f7f2	2026-10-08 08:33:49.886419
ska-fbba54ab	skl-f0acbe2a	cplusplus-30f7f2	2026-10-08 08:33:49.898413
ska-c2d3fbc6	skl-ace302b8	terraform-2d4dff	2026-10-08 08:33:49.933175
ska-71ff41d7	skl-d4dd7055	security-42d10e	2026-10-08 08:33:49.970646
ska-ac60afc0	skl-f7691672	kafka-0d3fbb	2026-10-08 08:33:49.990921
ska-657f04a4	skl-e0ab476e	sql-beff89	2026-10-08 08:33:50.013265
ska-8af806ca	skl-e5bf6f5b	scala-25013f	2026-10-08 08:33:50.036491
ska-b3914dfd	skl-72af24f4	spark-25013f	2026-10-08 08:33:50.039371
ska-a91295ae	skl-a68de40c	csharp-a5bbe1	2026-10-08 08:33:50.070702
ska-64d40c34	skl-93c1a789	redis-ce1e97	2026-10-08 08:33:50.320295
ska-6a1bf81d	skl-650682a1	aws-1e6111	2026-10-08 08:34:20.032127
ska-877eb709	skl-80cf7f2e	python-1e6111	2026-10-08 08:34:20.038222
ska-927225c4	skl-56b44511	docker-1e6111	2026-10-08 08:34:20.044792
ska-e1491839	skl-b1ef94a6	aws-5e3b2a	2026-10-08 08:34:20.292715
ska-e42f02e4	skl-92bc245c	python-5e3b2a	2026-10-08 08:34:20.297278
ska-d263939a	skl-faec7797	docker-5e3b2a	2026-10-08 08:34:20.301534
ska-30d26cd6	skl-6457eb2e	aws-13bd04	2026-10-08 08:34:20.416773
ska-0c480ba4	skl-b951f62f	python-13bd04	2026-10-08 08:34:20.43763
ska-f05177ee	skl-69254c02	docker-13bd04	2026-10-08 08:34:20.44395
ska-964d1e20	skl-d91f59ed	aws-a7f6b9	2026-10-08 08:34:20.555715
ska-7a97bc11	skl-c0704433	python-a7f6b9	2026-10-08 08:34:20.574084
ska-b70b576c	skl-4b50d88d	docker-a7f6b9	2026-10-08 08:34:20.583747
ska-0c2aaa77	skl-2a95b05b	aws-934580	2026-10-08 08:34:20.720968
ska-e8b72183	skl-9eb16c2b	python-934580	2026-10-08 08:34:20.735261
ska-be67571c	skl-04c1d25f	docker-934580	2026-10-08 08:34:20.744549
ska-36d30dce	skl-a1764e1c	aws-8757f2	2026-10-08 08:34:20.859679
ska-3d8955d8	skl-5615d6a4	python-8757f2	2026-10-08 08:34:20.867482
ska-845fbf02	skl-166cd783	docker-8757f2	2026-10-08 08:34:20.882068
ska-c906f448	skl-ab514801	aws-e20b28	2026-10-08 08:34:20.989528
ska-30167170	skl-45c2d1ea	python-e20b28	2026-10-08 08:34:20.99507
ska-1bc75bdf	skl-161d48ac	docker-e20b28	2026-10-08 08:34:21.001081
ska-a3d34d96	skl-1afa3347	aws-3488bf	2026-10-08 08:34:21.121161
ska-ee727392	skl-91bca006	python-3488bf	2026-10-08 08:34:21.137391
ska-bae72953	skl-d23218b7	docker-3488bf	2026-10-08 08:34:21.143805
ska-4af69424	skl-e3400a28	aws-127f3f	2026-10-08 08:34:21.270822
ska-09dd6d00	skl-ab811486	python-127f3f	2026-10-08 08:34:21.277472
ska-ec9d1de5	skl-fb96d4fe	docker-127f3f	2026-10-08 08:34:21.284022
ska-26e63e76	skl-34cf4b41	aws-a26339	2026-10-08 08:34:21.423154
ska-c27b49f2	skl-2f733fac	python-a26339	2026-10-08 08:34:21.430326
ska-c673c329	skl-7c4ff5cd	docker-a26339	2026-10-08 08:34:21.436893
ska-a9286b98	skl-57c2656e	aws-55832d	2026-10-08 08:34:21.587982
ska-fe26da23	skl-a8c411b4	python-55832d	2026-10-08 08:34:21.59549
ska-e86cb731	skl-8d81d131	docker-55832d	2026-10-08 08:34:21.603861
ska-d5032a02	skl-97ecd6ef	aws-e32b0c	2026-10-08 08:34:21.75782
ska-5126e1c1	skl-368de022	python-e32b0c	2026-10-08 08:34:21.764681
ska-035ff16c	skl-9090d609	docker-e32b0c	2026-10-08 08:34:21.771324
ska-2057820d	skl-d233c027	aws-4773c8	2026-10-08 08:34:21.942395
ska-a5f210fc	skl-20e27703	python-4773c8	2026-10-08 08:34:21.951551
ska-8e0938cb	skl-c4215199	docker-4773c8	2026-10-08 08:34:21.959277
ska-bd16eaaf	skl-4dfbbaa2	aws-8916c0	2026-10-08 08:34:22.131146
ska-04148c28	skl-416b7d63	python-8916c0	2026-10-08 08:34:22.137609
ska-1649a4c4	skl-95dff62a	docker-8916c0	2026-10-08 08:34:22.144054
ska-af7baddf	skl-104e8586	aws-937e17	2026-10-08 08:34:22.309613
ska-661df402	skl-a3cdc83c	python-937e17	2026-10-08 08:34:22.314479
ska-e42a2cab	skl-2edd7482	docker-937e17	2026-10-08 08:34:22.318727
ska-a5c58878	skl-bd1fc769	python-d7d123	2026-10-08 08:34:25.972493
ska-54016d21	skl-49e2b8b3	postgresql-d7d123	2026-10-08 08:34:25.983563
ska-9e04458e	skl-2725d97c	go-571ef5	2026-10-08 08:34:26.124793
ska-d597a10e	skl-4f7a0ea3	docker-571ef5	2026-10-08 08:34:26.135644
ska-be69b372	skl-780da531	terraform-92a07d	2026-10-08 08:34:26.279093
\.


--
-- Data for Name: skill_evidence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skill_evidence (id, candidate_skill_id, evidence_type, reference_id, score_contribution, snippet, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.skills (id, name, slug, category, description, is_active, created_at, updated_at) FROM stdin;
skl-96829365	Docker	docker	General Competencies	\N	t	2026-10-04 14:59:11.824378	2026-10-04 14:59:11.824382
skl-2af8abbb	Kubernetes	kubernetes	General Competencies	\N	t	2026-10-04 14:59:11.831938	2026-10-04 14:59:11.83194
skl-d913501c	Terraform	terraform	General Competencies	\N	t	2026-10-04 14:59:11.83672	2026-10-04 14:59:11.836722
skl-1c06caa9	Ansible	ansible	General Competencies	\N	t	2026-10-04 14:59:11.841605	2026-10-04 14:59:11.841607
skl-5fbef91d	AWS	aws	General Competencies	\N	t	2026-10-04 14:59:11.844333	2026-10-04 14:59:11.844335
skl-560e710d	Google Cloud	google-cloud	General Competencies	\N	t	2026-10-04 14:59:11.846799	2026-10-04 14:59:11.846801
skl-b00d766d	Microsoft Azure	microsoft-azure	General Competencies	\N	t	2026-10-04 14:59:11.850482	2026-10-04 14:59:11.850483
skl-4731ca21	Python	python	General Competencies	\N	t	2026-10-04 14:59:11.853247	2026-10-04 14:59:11.853249
skl-d745e8fa	React	react	General Competencies	\N	t	2026-10-04 14:59:11.858694	2026-10-04 14:59:11.858696
skl-56442d71	React Native	react-native	General Competencies	\N	t	2026-10-04 14:59:11.862782	2026-10-04 14:59:11.862784
skl-6e3e222a	Angular	angular	General Competencies	\N	t	2026-10-04 14:59:11.865726	2026-10-04 14:59:11.865728
skl-d16cdc14	Vue.js	vue	General Competencies	\N	t	2026-10-04 14:59:11.869242	2026-10-04 14:59:11.869244
skl-d9263954	Node.js	nodejs	General Competencies	\N	t	2026-10-04 14:59:11.872321	2026-10-04 14:59:11.872323
skl-00d5add2	TypeScript	typescript	General Competencies	\N	t	2026-10-04 14:59:11.8765	2026-10-04 14:59:11.876501
skl-35bcfade	JavaScript	javascript	General Competencies	\N	t	2026-10-04 14:59:11.879567	2026-10-04 14:59:11.879568
skl-eda32e3f	Go	go	General Competencies	\N	t	2026-10-04 14:59:11.883397	2026-10-04 14:59:11.883399
skl-a29d4977	Rust	rust	General Competencies	\N	t	2026-10-04 14:59:11.887254	2026-10-04 14:59:11.887256
skl-141131d4	C++	cpp	General Competencies	\N	t	2026-10-04 14:59:11.889172	2026-10-04 14:59:11.889174
skl-21943ebf	C#	csharp	General Competencies	\N	t	2026-10-04 14:59:11.892389	2026-10-04 14:59:11.892391
skl-41fb6cc4	.NET Core	dotnet-core	General Competencies	\N	t	2026-10-04 14:59:11.894979	2026-10-04 14:59:11.894981
skl-d79c8bea	FastAPI	fastapi	General Competencies	\N	t	2026-10-04 14:59:11.898442	2026-10-04 14:59:11.898445
skl-07a43000	Django	django	General Competencies	\N	t	2026-10-04 14:59:11.901209	2026-10-04 14:59:11.90121
skl-fadff6da	Spring Boot	spring-boot	General Competencies	\N	t	2026-10-04 14:59:11.903017	2026-10-04 14:59:11.903019
skl-60936493	PostgreSQL	postgresql	General Competencies	\N	t	2026-10-04 14:59:11.908102	2026-10-04 14:59:11.908106
skl-30ec905f	MySQL	mysql	General Competencies	\N	t	2026-10-04 14:59:11.912067	2026-10-04 14:59:11.912069
skl-00d0c319	MongoDB	mongodb	General Competencies	\N	t	2026-10-04 14:59:11.913978	2026-10-04 14:59:11.91398
skl-597ace5e	Redis	redis	General Competencies	\N	t	2026-10-04 14:59:11.9176	2026-10-04 14:59:11.917601
skl-8a7e511b	Apache Kafka	apache-kafka	General Competencies	\N	t	2026-10-04 14:59:11.919426	2026-10-04 14:59:11.919427
skl-010510f2	RabbitMQ	rabbitmq	General Competencies	\N	t	2026-10-04 14:59:11.922548	2026-10-04 14:59:11.922551
skl-afcfccea	GraphQL	graphql	General Competencies	\N	t	2026-10-04 14:59:11.925042	2026-10-04 14:59:11.925058
skl-be6424ca	GAAP	gaap	General Competencies	\N	t	2026-10-04 14:59:11.926912	2026-10-04 14:59:11.926913
skl-863d5f2a	IFRS	ifrs	General Competencies	\N	t	2026-10-04 14:59:11.928668	2026-10-04 14:59:11.928669
skl-7f3bcf2b	CPA	cpa	General Competencies	\N	t	2026-10-04 14:59:11.930564	2026-10-04 14:59:11.930566
skl-de2bf09a	SOX Compliance	sox-compliance	General Competencies	\N	t	2026-10-04 14:59:11.932916	2026-10-04 14:59:11.932918
skl-33c6eed7	Reconciliation	reconciliation	General Competencies	\N	t	2026-10-04 14:59:11.935345	2026-10-04 14:59:11.935346
skl-e98765a7	Financial Auditing	financial-auditing	General Competencies	\N	t	2026-10-04 14:59:11.938567	2026-10-04 14:59:11.938568
skl-e86233e1	Tax Accounting	tax-accounting	General Competencies	\N	t	2026-10-04 14:59:11.942313	2026-10-04 14:59:11.942314
skl-6ecd4f06	General Ledger	general-ledger	General Competencies	\N	t	2026-10-04 14:59:11.945336	2026-10-04 14:59:11.945338
skl-255ba08a	P&L Management	p-l-management	General Competencies	\N	t	2026-10-04 14:59:11.947758	2026-10-04 14:59:11.94776
skl-87a7f61e	Balance Sheet Reconciliation	balance-sheet-reconciliation	General Competencies	\N	t	2026-10-04 14:59:11.950611	2026-10-04 14:59:11.950612
skl-91160f99	PyTorch / Transformers	pytorch-transformers	General Competencies	\N	t	2026-10-04 14:59:11.970301	2026-10-04 14:59:11.970303
skl-ffa694c7	LangChain	langchain	General Competencies	\N	t	2026-10-04 14:59:11.976167	2026-10-04 14:59:11.976169
skl-fc68bd8c	System Design	system-design	General Competencies	\N	t	2026-10-04 14:59:11.978886	2026-10-04 14:59:11.978887
skl-38450fae	TypeScript / JavaScript	typescript-javascript	General Competencies	\N	t	2026-10-04 14:59:11.983345	2026-10-04 14:59:11.983347
skl-f0f25337	Tailwind CSS	tailwind-css	General Competencies	\N	t	2026-10-04 14:59:11.986244	2026-10-04 14:59:11.986245
skl-c0ce67ac	Canvas API	canvas-api	General Competencies	\N	t	2026-10-04 14:59:11.989028	2026-10-04 14:59:11.989029
skl-e7cb3758	State Management	state-management	General Competencies	\N	t	2026-10-04 14:59:11.991882	2026-10-04 14:59:11.991884
skl-be40daab	Performance Optimization	performance-optimization	General Competencies	\N	t	2026-10-04 14:59:11.994101	2026-10-04 14:59:11.994103
skl-0201dc5a	Financial Reconciliation	financial-reconciliation	General Competencies	\N	t	2026-10-04 14:59:12.000419	2026-10-04 14:59:12.000421
skl-7c5e9366	Corporate Tax	corporate-tax	General Competencies	\N	t	2026-10-04 14:59:12.002685	2026-10-04 14:59:12.002687
skl-2e8ee8da	Internal Auditing	internal-auditing	General Competencies	\N	t	2026-10-04 14:59:12.004863	2026-10-04 14:59:12.004865
skl-7685788b	Variance Analysis	variance-analysis	General Competencies	\N	t	2026-10-04 14:59:12.007738	2026-10-04 14:59:12.00774
skl-cba140ca	Algorithms	algorithms	General Competencies	\N	t	2026-10-04 14:59:12.014504	2026-10-04 14:59:12.014507
skl-0d63c1af	Distributed Systems	distributed-systems	General Competencies	\N	t	2026-10-04 14:59:12.026336	2026-10-04 14:59:12.026338
skl-d9c328ff	gRPC	grpc	General Competencies	\N	t	2026-10-04 14:59:12.028874	2026-10-04 14:59:12.028876
skl-0920c90a	Tailwind	tailwind	General Competencies	\N	t	2026-10-04 14:59:12.099529	2026-10-04 14:59:12.099531
skl-966f6cf1	PyTorch	pytorch	General Competencies	\N	t	2026-10-04 14:59:12.446424	2026-10-04 14:59:12.446425
skl-ceb79f63	pgvector	pgvector	General Competencies	\N	t	2026-10-04 14:59:12.462243	2026-10-04 14:59:12.462245
skl-05d17853	Web Speech API	web-speech-api	General Competencies	\N	t	2026-10-04 14:59:12.468774	2026-10-04 14:59:12.468776
skl-091886fa	Micro-frontends	micro-frontends	General Competencies	\N	t	2026-10-04 14:59:12.471099	2026-10-04 14:59:12.4711
skl-a4be5efc	React Python Node	react-python-node	General Competencies	\N	t	2026-10-04 14:59:12.474339	2026-10-04 14:59:12.474341
skl-34d0856d	Linux	linux	General Competencies	\N	t	2026-10-04 14:59:12.479037	2026-10-04 14:59:12.479039
skl-567056da	SQL	sql	General Competencies	\N	t	2026-10-04 14:59:12.48433	2026-10-04 14:59:12.484333
skl-4d889ef6	. Passionate	passionate	General Competencies	\N	t	2026-10-04 14:59:12.491055	2026-10-04 14:59:12.491057
skl-c6b85d0e	implementation.	implementation	General Competencies	\N	t	2026-10-04 14:59:12.493502	2026-10-04 14:59:12.493504
skl-3ae8c67f	improve project functionality.	improve-project-functionality	General Competencies	\N	t	2026-10-04 14:59:12.495738	2026-10-04 14:59:12.49574
skl-c7fe1053	candidates.	candidates	General Competencies	\N	t	2026-10-04 14:59:12.498393	2026-10-04 14:59:12.498395
skl-834cb2ee	managed related documentation.	managed-related-documentation	General Competencies	\N	t	2026-10-04 14:59:12.501066	2026-10-04 14:59:12.501068
skl-b2dbf7d3	tracking and follow-up.	tracking-and-follow-up	General Competencies	\N	t	2026-10-04 14:59:12.503305	2026-10-04 14:59:12.503307
skl-e5d25df3	coordination activities.	coordination-activities	General Competencies	\N	t	2026-10-04 14:59:12.505627	2026-10-04 14:59:12.505629
skl-62123b22	smooth workflow.	smooth-workflow	General Competencies	\N	t	2026-10-04 14:59:12.508465	2026-10-04 14:59:12.508467
skl-3528c270	IoT Intern	iot-intern	General Competencies	\N	t	2026-10-04 14:59:12.510746	2026-10-04 14:59:12.510747
skl-70cb5408	Executive Assistant (EA)	executive-assistant-ea	General Competencies	\N	t	2026-10-04 14:59:12.512954	2026-10-04 14:59:12.512955
skl-6061e171	Archana Automation	archana-automation	General Competencies	\N	t	2026-10-04 14:59:12.515729	2026-10-04 14:59:12.515732
skl-50c83867	Go-8460fd	go-8460fd	General Competencies	\N	t	2026-10-05 04:07:51.237618	2026-10-05 04:07:51.23762
skl-ad928b99	Idol Plasto Pvt. Ltd.	idol-plasto-pvt-ltd	General Competencies	\N	t	2026-10-04 14:59:12.518339	2026-10-04 14:59:12.51834
skl-a3510d0a	E D U C A T I O N	e-d-u-c-a-t-i-o-n	General Competencies	\N	t	2026-10-04 14:59:12.520641	2026-10-04 14:59:12.520643
skl-f08c43e9	RK UNIVERSITY	rk-university	General Competencies	\N	t	2026-10-04 14:59:12.523168	2026-10-04 14:59:12.52317
skl-4cf0554a	Diploma in Computer Engineering	diploma-in-computer-engineering	General Competencies	\N	t	2026-10-04 14:59:12.525739	2026-10-04 14:59:12.525741
skl-0b2d0e19	School	school	General Competencies	\N	t	2026-10-04 14:59:12.527974	2026-10-04 14:59:12.527976
skl-ed1b3b46	Bachelor in Computer Engineering	bachelor-in-computer-engineering	General Competencies	\N	t	2026-10-04 14:59:12.529826	2026-10-04 14:59:12.529828
skl-74d58832	S K I L L S	s-k-i-l-l-s	General Competencies	\N	t	2026-10-04 14:59:12.533374	2026-10-04 14:59:12.533376
skl-e4797a39	Project Management	project-management	General Competencies	\N	t	2026-10-04 14:59:12.535833	2026-10-04 14:59:12.535835
skl-40999af1	Public Relations	public-relations	General Competencies	\N	t	2026-10-04 14:59:12.538058	2026-10-04 14:59:12.538059
skl-c17c3988	Teamwork	teamwork	General Competencies	\N	t	2026-10-04 14:59:12.541102	2026-10-04 14:59:12.541104
skl-4fa1723e	Time Management	time-management	General Competencies	\N	t	2026-10-04 14:59:12.543109	2026-10-04 14:59:12.543111
skl-334faee4	Leadership	leadership	General Competencies	\N	t	2026-10-04 14:59:12.545325	2026-10-04 14:59:12.545326
skl-c19ca2f7	Effective Communication	effective-communication	General Competencies	\N	t	2026-10-04 14:59:12.547525	2026-10-04 14:59:12.547527
skl-179edba6	Critical Thinking	critical-thinking	General Competencies	\N	t	2026-10-04 14:59:12.55045	2026-10-04 14:59:12.550452
skl-39839ca9	L A N G U A G E S	l-a-n-g-u-a-g-e-s	General Competencies	\N	t	2026-10-04 14:59:12.552669	2026-10-04 14:59:12.55267
skl-9622b19c	English	english	General Competencies	\N	t	2026-10-04 14:59:12.554845	2026-10-04 14:59:12.554846
skl-e479be51	Hindi	hindi	General Competencies	\N	t	2026-10-04 14:59:12.557112	2026-10-04 14:59:12.557114
skl-e8593a47	Gujarati	gujarati	General Competencies	\N	t	2026-10-04 14:59:12.559321	2026-10-04 14:59:12.559322
skl-d1897f60	Panchgani International high school	panchgani-international-high-school	General Competencies	\N	t	2026-10-04 14:59:12.5612	2026-10-04 14:59:12.561201
skl-aa447039	Node JS	node-js	General Competencies	\N	t	2026-10-04 14:59:13.070502	2026-10-04 14:59:13.070505
skl-215724fb	Python 3	python-3	Programming Languages	\N	t	2026-10-04 15:08:32.237606	2026-10-04 15:08:32.237615
skl-6ab6d172	Python-c68670	python-c68670	General Competencies	\N	t	2026-10-05 04:01:42.819767	2026-10-05 04:01:42.819773
skl-21af1bbb	PostgreSQL-c68670	postgresql-c68670	General Competencies	\N	t	2026-10-05 04:01:42.832922	2026-10-05 04:01:42.832929
skl-97528c8a	Python-048739	python-048739	General Competencies	\N	t	2026-10-05 04:03:21.187632	2026-10-05 04:03:21.187641
skl-5b2579ae	PostgreSQL-048739	postgresql-048739	General Competencies	\N	t	2026-10-05 04:03:21.210368	2026-10-05 04:03:21.210376
skl-9fde30a7	Python-a418f1	python-a418f1	General Competencies	\N	t	2026-10-05 04:03:47.969885	2026-10-05 04:03:47.969894
skl-abc787d7	PostgreSQL-a418f1	postgresql-a418f1	General Competencies	\N	t	2026-10-05 04:03:48.010049	2026-10-05 04:03:48.010054
skl-5d84eab9	Go-2177fb	go-2177fb	General Competencies	\N	t	2026-10-05 04:03:48.200879	2026-10-05 04:03:48.200886
skl-c720acb0	Docker-2177fb	docker-2177fb	General Competencies	\N	t	2026-10-05 04:03:48.212509	2026-10-05 04:03:48.212521
skl-93e447a4	Java-ddb554	java-ddb554	General Competencies	\N	t	2026-10-05 04:03:48.380427	2026-10-05 04:03:48.380432
skl-ecdfcd8b	Spring-ddb554	spring-ddb554	General Competencies	\N	t	2026-10-05 04:03:48.392056	2026-10-05 04:03:48.392062
skl-c99dc491	React-e2b06b	react-e2b06b	General Competencies	\N	t	2026-10-05 04:03:48.481222	2026-10-05 04:03:48.481231
skl-8316e0e7	GraphQL-e2b06b	graphql-e2b06b	General Competencies	\N	t	2026-10-05 04:03:48.492616	2026-10-05 04:03:48.492622
skl-cc2cdaa6	Rust-1dfbc3	rust-1dfbc3	General Competencies	\N	t	2026-10-05 04:03:48.594042	2026-10-05 04:03:48.594047
skl-008a848d	Cplusplus-1dfbc3	cplusplus-1dfbc3	General Competencies	\N	t	2026-10-05 04:03:48.603899	2026-10-05 04:03:48.603903
skl-2d71d736	Python-c047a2	python-c047a2	General Competencies	\N	t	2026-10-05 04:05:00.938473	2026-10-05 04:05:00.938475
skl-030563da	PostgreSQL-c047a2	postgresql-c047a2	General Competencies	\N	t	2026-10-05 04:05:00.94419	2026-10-05 04:05:00.944192
skl-d77106c6	Go-4649ae	go-4649ae	General Competencies	\N	t	2026-10-05 04:05:00.990776	2026-10-05 04:05:00.990779
skl-46535a8e	Docker-4649ae	docker-4649ae	General Competencies	\N	t	2026-10-05 04:05:00.99458	2026-10-05 04:05:00.994582
skl-9ce4c5d7	Java-eb74ef	java-eb74ef	General Competencies	\N	t	2026-10-05 04:05:01.026983	2026-10-05 04:05:01.026986
skl-dd555264	Spring-eb74ef	spring-eb74ef	General Competencies	\N	t	2026-10-05 04:05:01.032176	2026-10-05 04:05:01.032179
skl-8963512d	React-97f874	react-97f874	General Competencies	\N	t	2026-10-05 04:05:01.079289	2026-10-05 04:05:01.079291
skl-2fdee303	GraphQL-97f874	graphql-97f874	General Competencies	\N	t	2026-10-05 04:05:01.083301	2026-10-05 04:05:01.083303
skl-64e70070	Rust-1a48c5	rust-1a48c5	General Competencies	\N	t	2026-10-05 04:05:01.13482	2026-10-05 04:05:01.134823
skl-139d2a99	Cplusplus-1a48c5	cplusplus-1a48c5	General Competencies	\N	t	2026-10-05 04:05:01.139038	2026-10-05 04:05:01.13904
skl-3003e10d	Terraform-c17529	terraform-c17529	General Competencies	\N	t	2026-10-05 04:05:01.20465	2026-10-05 04:05:01.204652
skl-96f7c10e	Security-51a4fc	security-51a4fc	General Competencies	\N	t	2026-10-05 04:05:01.284011	2026-10-05 04:05:01.284014
skl-0fd1e221	Kafka-d2740c	kafka-d2740c	General Competencies	\N	t	2026-10-05 04:05:01.334481	2026-10-05 04:05:01.334484
skl-f56478d7	SQL-9a17c8	sql-9a17c8	General Competencies	\N	t	2026-10-05 04:05:01.360549	2026-10-05 04:05:01.360552
skl-9a067be6	Scala-d4dda5	scala-d4dda5	General Competencies	\N	t	2026-10-05 04:05:01.392901	2026-10-05 04:05:01.392903
skl-655579c8	Spark-d4dda5	spark-d4dda5	General Competencies	\N	t	2026-10-05 04:05:01.397101	2026-10-05 04:05:01.397104
skl-0c2e127a	Csharp-1fd198	csharp-1fd198	General Competencies	\N	t	2026-10-05 04:05:01.428664	2026-10-05 04:05:01.428667
skl-047b260b	Redis-56465e	redis-56465e	General Competencies	\N	t	2026-10-05 04:05:01.781034	2026-10-05 04:05:01.781038
skl-72c97e51	Python-89b2bc	python-89b2bc	General Competencies	\N	t	2026-10-05 04:05:32.434096	2026-10-05 04:05:32.434099
skl-91f22d1d	PostgreSQL-89b2bc	postgresql-89b2bc	General Competencies	\N	t	2026-10-05 04:05:32.439436	2026-10-05 04:05:32.43944
skl-d107157a	Go-77dbf6	go-77dbf6	General Competencies	\N	t	2026-10-05 04:05:32.504301	2026-10-05 04:05:32.504303
skl-0be88490	Docker-77dbf6	docker-77dbf6	General Competencies	\N	t	2026-10-05 04:05:32.509277	2026-10-05 04:05:32.509279
skl-7fe33178	Java-212be7	java-212be7	General Competencies	\N	t	2026-10-05 04:05:32.551131	2026-10-05 04:05:32.551133
skl-dad27d62	Spring-212be7	spring-212be7	General Competencies	\N	t	2026-10-05 04:05:32.556614	2026-10-05 04:05:32.556621
skl-fa3381b9	React-306a35	react-306a35	General Competencies	\N	t	2026-10-05 04:05:32.673575	2026-10-05 04:05:32.673583
skl-d09aa195	GraphQL-306a35	graphql-306a35	General Competencies	\N	t	2026-10-05 04:05:32.687146	2026-10-05 04:05:32.687155
skl-faac2231	Rust-b50dc6	rust-b50dc6	General Competencies	\N	t	2026-10-05 04:05:32.780962	2026-10-05 04:05:32.780969
skl-30038570	Cplusplus-b50dc6	cplusplus-b50dc6	General Competencies	\N	t	2026-10-05 04:05:32.792198	2026-10-05 04:05:32.792205
skl-29de3974	Terraform-6863ce	terraform-6863ce	General Competencies	\N	t	2026-10-05 04:05:32.909566	2026-10-05 04:05:32.909574
skl-bf87c3d3	Security-f133bd	security-f133bd	General Competencies	\N	t	2026-10-05 04:05:33.008597	2026-10-05 04:05:33.008601
skl-256caf63	Kafka-275161	kafka-275161	General Competencies	\N	t	2026-10-05 04:05:33.058268	2026-10-05 04:05:33.058274
skl-2ac1a509	SQL-b06dc5	sql-b06dc5	General Competencies	\N	t	2026-10-05 04:05:33.123314	2026-10-05 04:05:33.123319
skl-8fdc6fa1	Scala-25e80f	scala-25e80f	General Competencies	\N	t	2026-10-05 04:05:33.188505	2026-10-05 04:05:33.18851
skl-aec6c81f	Spark-25e80f	spark-25e80f	General Competencies	\N	t	2026-10-05 04:05:33.196229	2026-10-05 04:05:33.196235
skl-0de6dbff	Csharp-c376ef	csharp-c376ef	General Competencies	\N	t	2026-10-05 04:05:33.258209	2026-10-05 04:05:33.258216
skl-98b141c8	Redis-63200c	redis-63200c	General Competencies	\N	t	2026-10-05 04:05:33.713174	2026-10-05 04:05:33.713178
skl-0f95d73b	Python-ecc542	python-ecc542	General Competencies	\N	t	2026-10-05 04:07:51.184945	2026-10-05 04:07:51.184947
skl-f21692b1	PostgreSQL-ecc542	postgresql-ecc542	General Competencies	\N	t	2026-10-05 04:07:51.189217	2026-10-05 04:07:51.189219
skl-148e3a10	Docker-8460fd	docker-8460fd	General Competencies	\N	t	2026-10-05 04:07:51.240896	2026-10-05 04:07:51.240898
skl-10905eae	Java-811c3e	java-811c3e	General Competencies	\N	t	2026-10-05 04:07:51.274122	2026-10-05 04:07:51.274123
skl-657107be	Spring-811c3e	spring-811c3e	General Competencies	\N	t	2026-10-05 04:07:51.277413	2026-10-05 04:07:51.277415
skl-9b660450	React-682350	react-682350	General Competencies	\N	t	2026-10-05 04:07:51.323103	2026-10-05 04:07:51.323108
skl-1163479a	GraphQL-682350	graphql-682350	General Competencies	\N	t	2026-10-05 04:07:51.332471	2026-10-05 04:07:51.332478
skl-9e7a113c	Rust-f38eea	rust-f38eea	General Competencies	\N	t	2026-10-05 04:07:51.394423	2026-10-05 04:07:51.394426
skl-64db2520	Cplusplus-f38eea	cplusplus-f38eea	General Competencies	\N	t	2026-10-05 04:07:51.399925	2026-10-05 04:07:51.399929
skl-a8669051	Terraform-9012d6	terraform-9012d6	General Competencies	\N	t	2026-10-05 04:07:51.477412	2026-10-05 04:07:51.477416
skl-5a8b038d	Security-4c4b83	security-4c4b83	General Competencies	\N	t	2026-10-05 04:07:51.550493	2026-10-05 04:07:51.550499
skl-8aefa7f3	Kafka-a25326	kafka-a25326	General Competencies	\N	t	2026-10-05 04:07:51.597445	2026-10-05 04:07:51.59745
skl-0676b8d1	SQL-4db9aa	sql-4db9aa	General Competencies	\N	t	2026-10-05 04:07:51.650568	2026-10-05 04:07:51.650573
skl-a02aaa8a	Scala-e8d16a	scala-e8d16a	General Competencies	\N	t	2026-10-05 04:07:51.710853	2026-10-05 04:07:51.710857
skl-f6c6d40a	Spark-e8d16a	spark-e8d16a	General Competencies	\N	t	2026-10-05 04:07:51.716667	2026-10-05 04:07:51.71667
skl-a1f25da4	Csharp-3880a2	csharp-3880a2	General Competencies	\N	t	2026-10-05 04:07:51.757063	2026-10-05 04:07:51.757068
skl-13e2ade4	Redis-5d3811	redis-5d3811	General Competencies	\N	t	2026-10-05 04:07:52.148382	2026-10-05 04:07:52.14839
skl-f36685cd	Python-52ab2e	python-52ab2e	General Competencies	\N	t	2026-10-05 04:56:16.328998	2026-10-05 04:56:16.329002
skl-1f231c04	PostgreSQL-52ab2e	postgresql-52ab2e	General Competencies	\N	t	2026-10-05 04:56:16.341246	2026-10-05 04:56:16.34125
skl-a7b04478	Go-ecfcf3	go-ecfcf3	General Competencies	\N	t	2026-10-05 04:56:16.461575	2026-10-05 04:56:16.461581
skl-ad5224e6	Docker-ecfcf3	docker-ecfcf3	General Competencies	\N	t	2026-10-05 04:56:16.472524	2026-10-05 04:56:16.47253
skl-df8edd07	Java-f15367	java-f15367	General Competencies	\N	t	2026-10-05 04:56:16.546699	2026-10-05 04:56:16.546705
skl-76b8f2c2	Spring-f15367	spring-f15367	General Competencies	\N	t	2026-10-05 04:56:16.557113	2026-10-05 04:56:16.557119
skl-122721f4	React-a3f4dd	react-a3f4dd	General Competencies	\N	t	2026-10-05 04:56:16.628858	2026-10-05 04:56:16.628871
skl-9cc2ffb8	GraphQL-a3f4dd	graphql-a3f4dd	General Competencies	\N	t	2026-10-05 04:56:16.639143	2026-10-05 04:56:16.639151
skl-c05ff88c	Rust-7c8332	rust-7c8332	General Competencies	\N	t	2026-10-05 04:56:16.714558	2026-10-05 04:56:16.714564
skl-e66954ec	Cplusplus-7c8332	cplusplus-7c8332	General Competencies	\N	t	2026-10-05 04:56:16.727219	2026-10-05 04:56:16.727233
skl-ec94ddad	Terraform-0706d5	terraform-0706d5	General Competencies	\N	t	2026-10-05 04:56:16.834298	2026-10-05 04:56:16.834307
skl-356c36a9	Security-b31cb4	security-b31cb4	General Competencies	\N	t	2026-10-05 04:56:16.944495	2026-10-05 04:56:16.944504
skl-1c93bb04	Kafka-a9d355	kafka-a9d355	General Competencies	\N	t	2026-10-05 04:56:16.999035	2026-10-05 04:56:16.99904
skl-e7bf572e	SQL-144332	sql-144332	General Competencies	\N	t	2026-10-05 04:56:17.067482	2026-10-05 04:56:17.067486
skl-ce8c1c1f	Scala-1023ee	scala-1023ee	General Competencies	\N	t	2026-10-05 04:56:17.115792	2026-10-05 04:56:17.115797
skl-4782080f	Spark-1023ee	spark-1023ee	General Competencies	\N	t	2026-10-05 04:56:17.125592	2026-10-05 04:56:17.125598
skl-e926a35b	Csharp-90282c	csharp-90282c	General Competencies	\N	t	2026-10-05 04:56:17.169391	2026-10-05 04:56:17.169397
skl-479e981c	Redis-6c4168	redis-6c4168	General Competencies	\N	t	2026-10-05 04:56:17.641606	2026-10-05 04:56:17.641616
skl-4cdb514e	backend	backend	General Competencies	\N	t	2026-10-05 04:58:42.928295	2026-10-05 04:58:42.9283
skl-0ea58f28	concurrency	concurrency	General Competencies	\N	t	2026-10-05 04:58:42.937206	2026-10-05 04:58:42.937214
skl-aabaaf3b	Python-b318c6	python-b318c6	General Competencies	\N	t	2026-10-06 03:28:59.979922	2026-10-06 03:28:59.979924
skl-9b5262b2	PostgreSQL-b318c6	postgresql-b318c6	General Competencies	\N	t	2026-10-06 03:28:59.990448	2026-10-06 03:28:59.990451
skl-737dbfa9	Go-48122a	go-48122a	General Competencies	\N	t	2026-10-06 03:29:00.0745	2026-10-06 03:29:00.074502
skl-3602c0fa	Docker-48122a	docker-48122a	General Competencies	\N	t	2026-10-06 03:29:00.081049	2026-10-06 03:29:00.081053
skl-4ed16832	Java-b52ad0	java-b52ad0	General Competencies	\N	t	2026-10-06 03:29:00.137179	2026-10-06 03:29:00.13718
skl-600b9a93	Spring-b52ad0	spring-b52ad0	General Competencies	\N	t	2026-10-06 03:29:00.142196	2026-10-06 03:29:00.142199
skl-28d95894	React-83dd9f	react-83dd9f	General Competencies	\N	t	2026-10-06 03:29:00.179306	2026-10-06 03:29:00.179308
skl-e5274b46	GraphQL-83dd9f	graphql-83dd9f	General Competencies	\N	t	2026-10-06 03:29:00.184716	2026-10-06 03:29:00.184718
skl-d3cbf2e5	Rust-b61a41	rust-b61a41	General Competencies	\N	t	2026-10-06 03:29:00.231716	2026-10-06 03:29:00.231719
skl-50a04e22	Cplusplus-b61a41	cplusplus-b61a41	General Competencies	\N	t	2026-10-06 03:29:00.235275	2026-10-06 03:29:00.235276
skl-24b058c5	Terraform-6cdce7	terraform-6cdce7	General Competencies	\N	t	2026-10-06 03:29:00.279606	2026-10-06 03:29:00.279608
skl-702a1752	Security-424f6b	security-424f6b	General Competencies	\N	t	2026-10-06 03:29:00.326817	2026-10-06 03:29:00.32682
skl-3b626b99	Kafka-f60595	kafka-f60595	General Competencies	\N	t	2026-10-06 03:29:00.35898	2026-10-06 03:29:00.358982
skl-7a5495f9	SQL-6cb005	sql-6cb005	General Competencies	\N	t	2026-10-06 03:29:00.383221	2026-10-06 03:29:00.383224
skl-47faf23f	Scala-82a2c7	scala-82a2c7	General Competencies	\N	t	2026-10-06 03:29:00.425136	2026-10-06 03:29:00.425139
skl-46ee1588	Spark-82a2c7	spark-82a2c7	General Competencies	\N	t	2026-10-06 03:29:00.428823	2026-10-06 03:29:00.428825
skl-3889021d	Csharp-f10eb6	csharp-f10eb6	General Competencies	\N	t	2026-10-06 03:29:00.468671	2026-10-06 03:29:00.468673
skl-907599ed	Redis-8298d7	redis-8298d7	General Competencies	\N	t	2026-10-06 03:29:00.748277	2026-10-06 03:29:00.748281
skl-0ed32ca4	AWS-10bc40	aws-10bc40	Cloud	\N	t	2026-10-06 03:40:24.776672	2026-10-06 03:40:24.776677
skl-ab953be9	Python-10bc40	python-10bc40	Programming	\N	t	2026-10-06 03:40:24.796399	2026-10-06 03:40:24.796404
skl-8c4eedcb	Docker-10bc40	docker-10bc40	DevOps	\N	t	2026-10-06 03:40:24.801305	2026-10-06 03:40:24.80131
skl-bce2a6c6	AWS-95262e	aws-95262e	Cloud	\N	t	2026-10-06 03:41:06.822042	2026-10-06 03:41:06.822046
skl-7ee8f547	Python-95262e	python-95262e	Programming	\N	t	2026-10-06 03:41:06.826849	2026-10-06 03:41:06.826853
skl-da44fe5f	Docker-95262e	docker-95262e	DevOps	\N	t	2026-10-06 03:41:06.830477	2026-10-06 03:41:06.830481
skl-890298e5	AWS-4478fc	aws-4478fc	Cloud	\N	t	2026-10-06 03:42:41.553834	2026-10-06 03:42:41.553839
skl-d70cbaa8	Python-4478fc	python-4478fc	Programming	\N	t	2026-10-06 03:42:41.559558	2026-10-06 03:42:41.559562
skl-fa0707c5	Docker-4478fc	docker-4478fc	DevOps	\N	t	2026-10-06 03:42:41.563164	2026-10-06 03:42:41.563168
skl-e57a7933	AWS-b654a2	aws-b654a2	Cloud	\N	t	2026-10-06 03:42:41.832511	2026-10-06 03:42:41.832516
skl-badfe048	Python-b654a2	python-b654a2	Programming	\N	t	2026-10-06 03:42:41.837497	2026-10-06 03:42:41.837501
skl-d9766636	Docker-b654a2	docker-b654a2	DevOps	\N	t	2026-10-06 03:42:41.841338	2026-10-06 03:42:41.841342
skl-f41bfb59	AWS-a91d4c	aws-a91d4c	Cloud	\N	t	2026-10-06 03:42:41.957351	2026-10-06 03:42:41.95736
skl-d0ad09c1	Python-a91d4c	python-a91d4c	Programming	\N	t	2026-10-06 03:42:41.966816	2026-10-06 03:42:41.966821
skl-c086c15a	Docker-a91d4c	docker-a91d4c	DevOps	\N	t	2026-10-06 03:42:41.972972	2026-10-06 03:42:41.97298
skl-1674cfdf	AWS-410943	aws-410943	Cloud	\N	t	2026-10-06 03:42:42.053246	2026-10-06 03:42:42.05325
skl-5f63a458	Python-410943	python-410943	Programming	\N	t	2026-10-06 03:42:42.058187	2026-10-06 03:42:42.058193
skl-ed872575	Docker-410943	docker-410943	DevOps	\N	t	2026-10-06 03:42:42.062246	2026-10-06 03:42:42.062251
skl-5a24bbbe	AWS-3c0b7d	aws-3c0b7d	Cloud	\N	t	2026-10-06 03:42:42.151094	2026-10-06 03:42:42.151103
skl-92efc11d	Python-3c0b7d	python-3c0b7d	Programming	\N	t	2026-10-06 03:42:42.162071	2026-10-06 03:42:42.16208
skl-569b7650	Docker-3c0b7d	docker-3c0b7d	DevOps	\N	t	2026-10-06 03:42:42.17213	2026-10-06 03:42:42.172143
skl-c2b9df54	AWS-53b28b	aws-53b28b	Cloud	\N	t	2026-10-06 03:42:42.268447	2026-10-06 03:42:42.268456
skl-7cea87fe	Python-53b28b	python-53b28b	Programming	\N	t	2026-10-06 03:42:42.276678	2026-10-06 03:42:42.276683
skl-e5a260d7	Docker-53b28b	docker-53b28b	DevOps	\N	t	2026-10-06 03:42:42.283325	2026-10-06 03:42:42.283329
skl-b8610bff	AWS-37e544	aws-37e544	Cloud	\N	t	2026-10-06 03:42:42.373339	2026-10-06 03:42:42.373345
skl-16117fc6	Python-37e544	python-37e544	Programming	\N	t	2026-10-06 03:42:42.385567	2026-10-06 03:42:42.385576
skl-76fc6b08	Docker-37e544	docker-37e544	DevOps	\N	t	2026-10-06 03:42:42.394972	2026-10-06 03:42:42.394979
skl-0907a3ef	AWS-95cf3e	aws-95cf3e	Cloud	\N	t	2026-10-06 03:42:42.491743	2026-10-06 03:42:42.491752
skl-a57cc7a3	Python-95cf3e	python-95cf3e	Programming	\N	t	2026-10-06 03:42:42.496262	2026-10-06 03:42:42.496265
skl-95c8bede	Docker-95cf3e	docker-95cf3e	DevOps	\N	t	2026-10-06 03:42:42.502913	2026-10-06 03:42:42.502921
skl-eb7eb76b	AWS-a62d06	aws-a62d06	Cloud	\N	t	2026-10-06 03:42:42.58115	2026-10-06 03:42:42.581155
skl-64b1b583	Python-a62d06	python-a62d06	Programming	\N	t	2026-10-06 03:42:42.585572	2026-10-06 03:42:42.585575
skl-b852b72a	Docker-a62d06	docker-a62d06	DevOps	\N	t	2026-10-06 03:42:42.58924	2026-10-06 03:42:42.589243
skl-2250b79f	AWS-bef3f2	aws-bef3f2	Cloud	\N	t	2026-10-06 03:42:42.687945	2026-10-06 03:42:42.687948
skl-c20e2cbb	Python-bef3f2	python-bef3f2	Programming	\N	t	2026-10-06 03:42:42.69226	2026-10-06 03:42:42.692263
skl-745cc140	Docker-bef3f2	docker-bef3f2	DevOps	\N	t	2026-10-06 03:42:42.695939	2026-10-06 03:42:42.695942
skl-4903ca8c	AWS-321b8e	aws-321b8e	Cloud	\N	t	2026-10-06 03:42:42.76815	2026-10-06 03:42:42.768155
skl-2077fb60	Python-321b8e	python-321b8e	Programming	\N	t	2026-10-06 03:42:42.772495	2026-10-06 03:42:42.7725
skl-a76f1ec3	Docker-321b8e	docker-321b8e	DevOps	\N	t	2026-10-06 03:42:42.776839	2026-10-06 03:42:42.776843
skl-b4138091	AWS-733356	aws-733356	Cloud	\N	t	2026-10-06 03:42:42.848856	2026-10-06 03:42:42.84886
skl-45da360f	Python-733356	python-733356	Programming	\N	t	2026-10-06 03:42:42.854726	2026-10-06 03:42:42.854731
skl-f63662e2	Docker-733356	docker-733356	DevOps	\N	t	2026-10-06 03:42:42.860581	2026-10-06 03:42:42.860586
skl-ae2c6d61	AWS-e9484d	aws-e9484d	Cloud	\N	t	2026-10-06 03:42:43.034454	2026-10-06 03:42:43.034463
skl-12b1fdc6	Python-e9484d	python-e9484d	Programming	\N	t	2026-10-06 03:42:43.044675	2026-10-06 03:42:43.044683
skl-d29c382c	Docker-e9484d	docker-e9484d	DevOps	\N	t	2026-10-06 03:42:43.054927	2026-10-06 03:42:43.054934
skl-cd4d266a	AWS-a4f114	aws-a4f114	Cloud	\N	t	2026-10-06 03:42:43.165549	2026-10-06 03:42:43.165554
skl-aab9cba5	Python-a4f114	python-a4f114	Programming	\N	t	2026-10-06 03:42:43.169657	2026-10-06 03:42:43.169661
skl-bcf43de9	Docker-a4f114	docker-a4f114	DevOps	\N	t	2026-10-06 03:42:43.174454	2026-10-06 03:42:43.174459
skl-13c57974	AWS-040572	aws-040572	Cloud	\N	t	2026-10-06 03:42:43.28744	2026-10-06 03:42:43.287449
skl-86b37453	Python-040572	python-040572	Programming	\N	t	2026-10-06 03:42:43.296503	2026-10-06 03:42:43.29651
skl-07e7c4d4	Docker-040572	docker-040572	DevOps	\N	t	2026-10-06 03:42:43.30406	2026-10-06 03:42:43.304065
skl-4afb1b14	AWS-36c32d	aws-36c32d	Cloud	\N	t	2026-10-06 03:44:15.048251	2026-10-06 03:44:15.048255
skl-9c404178	Python-36c32d	python-36c32d	Programming	\N	t	2026-10-06 03:44:15.054275	2026-10-06 03:44:15.05428
skl-8ebc9f96	Docker-36c32d	docker-36c32d	DevOps	\N	t	2026-10-06 03:44:15.058693	2026-10-06 03:44:15.058697
skl-9edc2271	AWS-6fc353	aws-6fc353	Cloud	\N	t	2026-10-06 03:44:15.333739	2026-10-06 03:44:15.333742
skl-dfc88310	Python-6fc353	python-6fc353	Programming	\N	t	2026-10-06 03:44:15.339697	2026-10-06 03:44:15.339701
skl-781344c6	Docker-6fc353	docker-6fc353	DevOps	\N	t	2026-10-06 03:44:15.343852	2026-10-06 03:44:15.343862
skl-cd8d3b68	AWS-c9afc3	aws-c9afc3	Cloud	\N	t	2026-10-06 03:44:15.470724	2026-10-06 03:44:15.470729
skl-5d351595	Python-c9afc3	python-c9afc3	Programming	\N	t	2026-10-06 03:44:15.475243	2026-10-06 03:44:15.475248
skl-c8e4dde1	Docker-c9afc3	docker-c9afc3	DevOps	\N	t	2026-10-06 03:44:15.481832	2026-10-06 03:44:15.481836
skl-38c7c578	AWS-c1bb9a	aws-c1bb9a	Cloud	\N	t	2026-10-06 03:44:15.564391	2026-10-06 03:44:15.564397
skl-93f4093a	Python-c1bb9a	python-c1bb9a	Programming	\N	t	2026-10-06 03:44:15.575238	2026-10-06 03:44:15.575247
skl-cf1b0b04	Docker-c1bb9a	docker-c1bb9a	DevOps	\N	t	2026-10-06 03:44:15.58446	2026-10-06 03:44:15.584471
skl-869b191b	AWS-fbfdd0	aws-fbfdd0	Cloud	\N	t	2026-10-06 03:44:15.682058	2026-10-06 03:44:15.682064
skl-0c8b9590	Python-fbfdd0	python-fbfdd0	Programming	\N	t	2026-10-06 03:44:15.688321	2026-10-06 03:44:15.688326
skl-28f7c8bf	Docker-fbfdd0	docker-fbfdd0	DevOps	\N	t	2026-10-06 03:44:15.692972	2026-10-06 03:44:15.692979
skl-865d76ea	AWS-802e0d	aws-802e0d	Cloud	\N	t	2026-10-06 03:44:15.80327	2026-10-06 03:44:15.803278
skl-6edfddef	Python-802e0d	python-802e0d	Programming	\N	t	2026-10-06 03:44:15.816071	2026-10-06 03:44:15.816075
skl-1d9e0d33	Docker-802e0d	docker-802e0d	DevOps	\N	t	2026-10-06 03:44:15.825674	2026-10-06 03:44:15.825681
skl-7c85aba7	AWS-23ca2d	aws-23ca2d	Cloud	\N	t	2026-10-06 03:44:15.93799	2026-10-06 03:44:15.937996
skl-f701fbbd	Python-23ca2d	python-23ca2d	Programming	\N	t	2026-10-06 03:44:15.94576	2026-10-06 03:44:15.945766
skl-63c6ae29	Docker-23ca2d	docker-23ca2d	DevOps	\N	t	2026-10-06 03:44:15.954675	2026-10-06 03:44:15.954684
skl-38b78815	AWS-c6607f	aws-c6607f	Cloud	\N	t	2026-10-06 03:44:16.082164	2026-10-06 03:44:16.082169
skl-3de1cf4b	Python-c6607f	python-c6607f	Programming	\N	t	2026-10-06 03:44:16.094509	2026-10-06 03:44:16.094526
skl-c9d6017b	Docker-c6607f	docker-c6607f	DevOps	\N	t	2026-10-06 03:44:16.106398	2026-10-06 03:44:16.106408
skl-3bc7eb75	AWS-203eca	aws-203eca	Cloud	\N	t	2026-10-06 03:44:16.246903	2026-10-06 03:44:16.246912
skl-6a269c2a	Python-203eca	python-203eca	Programming	\N	t	2026-10-06 03:44:16.256994	2026-10-06 03:44:16.256999
skl-a8c2a974	Docker-203eca	docker-203eca	DevOps	\N	t	2026-10-06 03:44:16.264463	2026-10-06 03:44:16.264468
skl-a7b15059	AWS-e83085	aws-e83085	Cloud	\N	t	2026-10-06 03:44:16.389455	2026-10-06 03:44:16.389459
skl-941a5c5a	Python-e83085	python-e83085	Programming	\N	t	2026-10-06 03:44:16.394491	2026-10-06 03:44:16.394495
skl-eeac38f5	Docker-e83085	docker-e83085	DevOps	\N	t	2026-10-06 03:44:16.399946	2026-10-06 03:44:16.39995
skl-969d7db7	AWS-fb95fc	aws-fb95fc	Cloud	\N	t	2026-10-06 03:44:16.511639	2026-10-06 03:44:16.511644
skl-fee0f311	Python-fb95fc	python-fb95fc	Programming	\N	t	2026-10-06 03:44:16.51698	2026-10-06 03:44:16.516986
skl-5a4f14f4	Docker-fb95fc	docker-fb95fc	DevOps	\N	t	2026-10-06 03:44:16.524684	2026-10-06 03:44:16.524691
skl-50b94b3f	AWS-7eea8b	aws-7eea8b	Cloud	\N	t	2026-10-06 03:44:16.641569	2026-10-06 03:44:16.641578
skl-678d066b	Python-7eea8b	python-7eea8b	Programming	\N	t	2026-10-06 03:44:16.653374	2026-10-06 03:44:16.65338
skl-192808a3	Docker-7eea8b	docker-7eea8b	DevOps	\N	t	2026-10-06 03:44:16.662067	2026-10-06 03:44:16.662073
skl-b9d898b0	AWS-511423	aws-511423	Cloud	\N	t	2026-10-06 03:44:16.807995	2026-10-06 03:44:16.807999
skl-1b637c95	Python-511423	python-511423	Programming	\N	t	2026-10-06 03:44:16.813497	2026-10-06 03:44:16.813502
skl-bfc15c06	Docker-511423	docker-511423	DevOps	\N	t	2026-10-06 03:44:16.818137	2026-10-06 03:44:16.818142
skl-e60f4b6d	AWS-3462ce	aws-3462ce	Cloud	\N	t	2026-10-06 03:44:16.907377	2026-10-06 03:44:16.907381
skl-e264fc4c	Python-3462ce	python-3462ce	Programming	\N	t	2026-10-06 03:44:16.91293	2026-10-06 03:44:16.912934
skl-46404b8b	Docker-3462ce	docker-3462ce	DevOps	\N	t	2026-10-06 03:44:16.916601	2026-10-06 03:44:16.916605
skl-d8daf333	AWS-8f38dd	aws-8f38dd	Cloud	\N	t	2026-10-06 03:44:16.999109	2026-10-06 03:44:16.999113
skl-5ba17da0	Python-8f38dd	python-8f38dd	Programming	\N	t	2026-10-06 03:44:17.007867	2026-10-06 03:44:17.007876
skl-00892d0a	Docker-8f38dd	docker-8f38dd	DevOps	\N	t	2026-10-06 03:44:17.017679	2026-10-06 03:44:17.017689
skl-51d1eea7	Python-450c75	python-450c75	General Competencies	\N	t	2026-10-06 03:44:19.493879	2026-10-06 03:44:19.493883
skl-50d6d305	PostgreSQL-450c75	postgresql-450c75	General Competencies	\N	t	2026-10-06 03:44:19.499426	2026-10-06 03:44:19.499431
skl-e57cb84f	Go-b0ef70	go-b0ef70	General Competencies	\N	t	2026-10-06 03:44:19.602578	2026-10-06 03:44:19.602584
skl-cfb85c91	Docker-b0ef70	docker-b0ef70	General Competencies	\N	t	2026-10-06 03:44:19.614201	2026-10-06 03:44:19.614209
skl-229092d6	Terraform-5082b3	terraform-5082b3	General Competencies	\N	t	2026-10-06 03:44:19.713437	2026-10-06 03:44:19.713444
skl-27af08f2	Python-93353c	python-93353c	General Competencies	\N	t	2026-10-06 03:44:51.402579	2026-10-06 03:44:51.402584
skl-ceccac2a	PostgreSQL-93353c	postgresql-93353c	General Competencies	\N	t	2026-10-06 03:44:51.411414	2026-10-06 03:44:51.411419
skl-9c17ddb0	Go-c9fadf	go-c9fadf	General Competencies	\N	t	2026-10-06 03:44:51.524826	2026-10-06 03:44:51.524833
skl-8b90d5c3	Docker-c9fadf	docker-c9fadf	General Competencies	\N	t	2026-10-06 03:44:51.534363	2026-10-06 03:44:51.534368
skl-714795d7	Java-a3301f	java-a3301f	General Competencies	\N	t	2026-10-06 03:44:51.606424	2026-10-06 03:44:51.606429
skl-8ce26f72	Spring-a3301f	spring-a3301f	General Competencies	\N	t	2026-10-06 03:44:51.61234	2026-10-06 03:44:51.612344
skl-db15722c	React-8a0a01	react-8a0a01	General Competencies	\N	t	2026-10-06 03:44:51.707416	2026-10-06 03:44:51.707453
skl-f05da4ec	GraphQL-8a0a01	graphql-8a0a01	General Competencies	\N	t	2026-10-06 03:44:51.717459	2026-10-06 03:44:51.717465
skl-15fd9c96	Rust-3b733d	rust-3b733d	General Competencies	\N	t	2026-10-06 03:44:51.817214	2026-10-06 03:44:51.817221
skl-30255f3b	Cplusplus-3b733d	cplusplus-3b733d	General Competencies	\N	t	2026-10-06 03:44:51.828012	2026-10-06 03:44:51.828017
skl-cd45839a	Terraform-2455d3	terraform-2455d3	General Competencies	\N	t	2026-10-06 03:44:51.930125	2026-10-06 03:44:51.930132
skl-43bb129c	Security-f48fc0	security-f48fc0	General Competencies	\N	t	2026-10-06 03:44:52.018283	2026-10-06 03:44:52.01829
skl-241ff46b	Kafka-81793c	kafka-81793c	General Competencies	\N	t	2026-10-06 03:44:52.089199	2026-10-06 03:44:52.089206
skl-0548405d	SQL-cf0dd6	sql-cf0dd6	General Competencies	\N	t	2026-10-06 03:44:52.175492	2026-10-06 03:44:52.175498
skl-370bef84	Scala-b1bf1c	scala-b1bf1c	General Competencies	\N	t	2026-10-06 03:44:52.265321	2026-10-06 03:44:52.265328
skl-beea04bd	Spark-b1bf1c	spark-b1bf1c	General Competencies	\N	t	2026-10-06 03:44:52.275093	2026-10-06 03:44:52.275099
skl-4847d451	Csharp-bb499c	csharp-bb499c	General Competencies	\N	t	2026-10-06 03:44:52.347844	2026-10-06 03:44:52.34785
skl-3623ad5e	Redis-58e3b7	redis-58e3b7	General Competencies	\N	t	2026-10-06 03:44:52.844972	2026-10-06 03:44:52.844976
skl-6166804a	AWS-47fcc5	aws-47fcc5	Cloud	\N	t	2026-10-06 03:52:42.139328	2026-10-06 03:52:42.139331
skl-54144089	Python-47fcc5	python-47fcc5	Programming	\N	t	2026-10-06 03:52:42.150977	2026-10-06 03:52:42.150984
skl-54699521	Docker-47fcc5	docker-47fcc5	DevOps	\N	t	2026-10-06 03:52:42.155022	2026-10-06 03:52:42.155025
skl-222a8249	AWS-6d96b3	aws-6d96b3	Cloud	\N	t	2026-10-06 03:52:42.504045	2026-10-06 03:52:42.504048
skl-e3df15ba	Python-6d96b3	python-6d96b3	Programming	\N	t	2026-10-06 03:52:42.50758	2026-10-06 03:52:42.507585
skl-93dafd4b	Docker-6d96b3	docker-6d96b3	DevOps	\N	t	2026-10-06 03:52:42.515678	2026-10-06 03:52:42.515681
skl-d946efd1	AWS-4e8b0b	aws-4e8b0b	Cloud	\N	t	2026-10-06 03:52:42.605139	2026-10-06 03:52:42.605144
skl-8d95e6f2	Python-4e8b0b	python-4e8b0b	Programming	\N	t	2026-10-06 03:52:42.612391	2026-10-06 03:52:42.612394
skl-111ba417	Docker-4e8b0b	docker-4e8b0b	DevOps	\N	t	2026-10-06 03:52:42.619337	2026-10-06 03:52:42.619346
skl-d59f541e	AWS-f14ac0	aws-f14ac0	Cloud	\N	t	2026-10-06 03:52:42.708982	2026-10-06 03:52:42.708986
skl-a28812e7	Python-f14ac0	python-f14ac0	Programming	\N	t	2026-10-06 03:52:42.714627	2026-10-06 03:52:42.71463
skl-8133a9e8	Docker-f14ac0	docker-f14ac0	DevOps	\N	t	2026-10-06 03:52:42.719995	2026-10-06 03:52:42.719999
skl-1bf91a3a	AWS-f97d2f	aws-f97d2f	Cloud	\N	t	2026-10-06 03:52:42.771378	2026-10-06 03:52:42.771381
skl-9e385977	Python-f97d2f	python-f97d2f	Programming	\N	t	2026-10-06 03:52:42.776432	2026-10-06 03:52:42.776436
skl-3c6e66e3	Docker-f97d2f	docker-f97d2f	DevOps	\N	t	2026-10-06 03:52:42.78072	2026-10-06 03:52:42.780724
skl-e1ffdb7f	AWS-586ef7	aws-586ef7	Cloud	\N	t	2026-10-06 03:52:42.837961	2026-10-06 03:52:42.837964
skl-d0b7e1fe	Python-586ef7	python-586ef7	Programming	\N	t	2026-10-06 03:52:42.843641	2026-10-06 03:52:42.843645
skl-b4fa3c2d	Docker-586ef7	docker-586ef7	DevOps	\N	t	2026-10-06 03:52:42.847321	2026-10-06 03:52:42.847323
skl-e3ed1e6e	AWS-4349a3	aws-4349a3	Cloud	\N	t	2026-10-06 03:52:42.899439	2026-10-06 03:52:42.899453
skl-315ad0f7	Python-4349a3	python-4349a3	Programming	\N	t	2026-10-06 03:52:42.905935	2026-10-06 03:52:42.905943
skl-efac6352	Docker-4349a3	docker-4349a3	DevOps	\N	t	2026-10-06 03:52:42.911693	2026-10-06 03:52:42.911696
skl-f02a69a5	AWS-405bda	aws-405bda	Cloud	\N	t	2026-10-06 03:52:43.028951	2026-10-06 03:52:43.028954
skl-5a4ceeca	Python-405bda	python-405bda	Programming	\N	t	2026-10-06 03:52:43.032974	2026-10-06 03:52:43.032981
skl-7bef8024	Docker-405bda	docker-405bda	DevOps	\N	t	2026-10-06 03:52:43.038061	2026-10-06 03:52:43.038064
skl-5dbb7fff	AWS-782001	aws-782001	Cloud	\N	t	2026-10-06 03:52:43.093929	2026-10-06 03:52:43.093932
skl-e92515a1	Python-782001	python-782001	Programming	\N	t	2026-10-06 03:52:43.097524	2026-10-06 03:52:43.097527
skl-6a03b925	Docker-782001	docker-782001	DevOps	\N	t	2026-10-06 03:52:43.101795	2026-10-06 03:52:43.101798
skl-afd01d04	AWS-6ddf9d	aws-6ddf9d	Cloud	\N	t	2026-10-06 03:52:43.205254	2026-10-06 03:52:43.205257
skl-a3b58ba5	Python-6ddf9d	python-6ddf9d	Programming	\N	t	2026-10-06 03:52:43.209897	2026-10-06 03:52:43.209906
skl-01144a83	Docker-6ddf9d	docker-6ddf9d	DevOps	\N	t	2026-10-06 03:52:43.213924	2026-10-06 03:52:43.213926
skl-b7849ed2	AWS-e16779	aws-e16779	Cloud	\N	t	2026-10-06 03:52:43.309119	2026-10-06 03:52:43.309124
skl-e83510c8	Python-e16779	python-e16779	Programming	\N	t	2026-10-06 03:52:43.313236	2026-10-06 03:52:43.313239
skl-d1fe1351	Docker-e16779	docker-e16779	DevOps	\N	t	2026-10-06 03:52:43.316066	2026-10-06 03:52:43.316072
skl-74dcd019	AWS-569fe6	aws-569fe6	Cloud	\N	t	2026-10-06 03:52:43.378508	2026-10-06 03:52:43.378511
skl-e965168e	Python-569fe6	python-569fe6	Programming	\N	t	2026-10-06 03:52:43.381403	2026-10-06 03:52:43.381406
skl-e239aad9	Docker-569fe6	docker-569fe6	DevOps	\N	t	2026-10-06 03:52:43.386022	2026-10-06 03:52:43.386025
skl-dde80416	AWS-5a2f3c	aws-5a2f3c	Cloud	\N	t	2026-10-06 03:52:43.479143	2026-10-06 03:52:43.479146
skl-42538c95	Python-5a2f3c	python-5a2f3c	Programming	\N	t	2026-10-06 03:52:43.482199	2026-10-06 03:52:43.482203
skl-83b6839b	Docker-5a2f3c	docker-5a2f3c	DevOps	\N	t	2026-10-06 03:52:43.487093	2026-10-06 03:52:43.487097
skl-8b3f4c0e	AWS-b49c0a	aws-b49c0a	Cloud	\N	t	2026-10-06 03:52:43.55199	2026-10-06 03:52:43.551993
skl-29592d22	Python-b49c0a	python-b49c0a	Programming	\N	t	2026-10-06 03:52:43.555361	2026-10-06 03:52:43.555363
skl-c50c4283	Docker-b49c0a	docker-b49c0a	DevOps	\N	t	2026-10-06 03:52:43.55934	2026-10-06 03:52:43.559345
skl-56ff7f03	AWS-edb1a2	aws-edb1a2	Cloud	\N	t	2026-10-06 03:52:43.630163	2026-10-06 03:52:43.630165
skl-3cadef7b	Python-edb1a2	python-edb1a2	Programming	\N	t	2026-10-06 03:52:43.63433	2026-10-06 03:52:43.634336
skl-052ed54e	Docker-edb1a2	docker-edb1a2	DevOps	\N	t	2026-10-06 03:52:43.637691	2026-10-06 03:52:43.637693
skl-5c04908c	Python-16492f	python-16492f	General Competencies	\N	t	2026-10-06 03:52:43.962289	2026-10-06 03:52:43.962292
skl-6f64bd3a	PostgreSQL-16492f	postgresql-16492f	General Competencies	\N	t	2026-10-06 03:52:43.970794	2026-10-06 03:52:43.970797
skl-7552ab45	Go-137d32	go-137d32	General Competencies	\N	t	2026-10-06 03:52:44.035442	2026-10-06 03:52:44.035446
skl-662135ad	Docker-137d32	docker-137d32	General Competencies	\N	t	2026-10-06 03:52:44.040094	2026-10-06 03:52:44.040097
skl-d2396223	Terraform-249a46	terraform-249a46	General Competencies	\N	t	2026-10-06 03:52:44.085382	2026-10-06 03:52:44.085386
skl-7aa02f68	AWS-28764a	aws-28764a	Cloud	\N	t	2026-10-06 04:01:26.68269	2026-10-06 04:01:26.682695
skl-e245b255	Python-28764a	python-28764a	Programming	\N	t	2026-10-06 04:01:26.695208	2026-10-06 04:01:26.695217
skl-373fc0be	Docker-28764a	docker-28764a	DevOps	\N	t	2026-10-06 04:01:26.707716	2026-10-06 04:01:26.707726
skl-a652983a	AWS-9cd131	aws-9cd131	Cloud	\N	t	2026-10-06 04:01:27.535871	2026-10-06 04:01:27.535877
skl-10519428	Python-9cd131	python-9cd131	Programming	\N	t	2026-10-06 04:01:27.550932	2026-10-06 04:01:27.550938
skl-79712603	Docker-9cd131	docker-9cd131	DevOps	\N	t	2026-10-06 04:01:27.565394	2026-10-06 04:01:27.565402
skl-0187c816	AWS-ff8862	aws-ff8862	Cloud	\N	t	2026-10-06 04:01:27.753484	2026-10-06 04:01:27.753491
skl-46cc09f9	Python-ff8862	python-ff8862	Programming	\N	t	2026-10-06 04:01:27.771987	2026-10-06 04:01:27.771999
skl-e994f7ef	Docker-ff8862	docker-ff8862	DevOps	\N	t	2026-10-06 04:01:27.78758	2026-10-06 04:01:27.787587
skl-6c30a45b	AWS-af4ba3	aws-af4ba3	Cloud	\N	t	2026-10-06 04:01:27.961379	2026-10-06 04:01:27.961386
skl-238b8bbd	Python-af4ba3	python-af4ba3	Programming	\N	t	2026-10-06 04:01:27.977426	2026-10-06 04:01:27.977437
skl-f23ab8b1	Docker-af4ba3	docker-af4ba3	DevOps	\N	t	2026-10-06 04:01:27.994934	2026-10-06 04:01:27.994945
skl-54c4618c	AWS-6d30b2	aws-6d30b2	Cloud	\N	t	2026-10-06 04:01:28.164329	2026-10-06 04:01:28.164345
skl-2cd64a23	Python-6d30b2	python-6d30b2	Programming	\N	t	2026-10-06 04:01:28.185105	2026-10-06 04:01:28.185117
skl-d72ce3c4	Docker-6d30b2	docker-6d30b2	DevOps	\N	t	2026-10-06 04:01:28.201881	2026-10-06 04:01:28.201894
skl-03e98287	AWS-670a0f	aws-670a0f	Cloud	\N	t	2026-10-06 04:01:28.358987	2026-10-06 04:01:28.359003
skl-ae7651bd	Python-670a0f	python-670a0f	Programming	\N	t	2026-10-06 04:01:28.377289	2026-10-06 04:01:28.377295
skl-f3cb91a3	Docker-670a0f	docker-670a0f	DevOps	\N	t	2026-10-06 04:01:28.389515	2026-10-06 04:01:28.38952
skl-e1f0efe6	AWS-d2897f	aws-d2897f	Cloud	\N	t	2026-10-06 04:01:28.524713	2026-10-06 04:01:28.524719
skl-18d46585	Python-d2897f	python-d2897f	Programming	\N	t	2026-10-06 04:01:28.540645	2026-10-06 04:01:28.540651
skl-f618d18c	Docker-d2897f	docker-d2897f	DevOps	\N	t	2026-10-06 04:01:28.560269	2026-10-06 04:01:28.560279
skl-af076160	AWS-85d25e	aws-85d25e	Cloud	\N	t	2026-10-06 04:01:28.726897	2026-10-06 04:01:28.726903
skl-e109433b	Python-85d25e	python-85d25e	Programming	\N	t	2026-10-06 04:01:28.74222	2026-10-06 04:01:28.742226
skl-6e3de08b	Docker-85d25e	docker-85d25e	DevOps	\N	t	2026-10-06 04:01:28.754939	2026-10-06 04:01:28.754945
skl-7f9e82ff	AWS-d787e5	aws-d787e5	Cloud	\N	t	2026-10-06 04:01:28.896794	2026-10-06 04:01:28.896807
skl-c6c3178a	Python-d787e5	python-d787e5	Programming	\N	t	2026-10-06 04:01:28.913565	2026-10-06 04:01:28.913576
skl-491e11a2	Docker-d787e5	docker-d787e5	DevOps	\N	t	2026-10-06 04:01:28.925703	2026-10-06 04:01:28.925711
skl-9f19d178	AWS-3bd054	aws-3bd054	Cloud	\N	t	2026-10-06 04:01:29.187157	2026-10-06 04:01:29.187173
skl-78c601da	Python-3bd054	python-3bd054	Programming	\N	t	2026-10-06 04:01:29.207589	2026-10-06 04:01:29.207599
skl-de28357c	Docker-3bd054	docker-3bd054	DevOps	\N	t	2026-10-06 04:01:29.230202	2026-10-06 04:01:29.230219
skl-7608eede	AWS-589c8a	aws-589c8a	Cloud	\N	t	2026-10-06 04:01:29.417393	2026-10-06 04:01:29.417405
skl-8b4c01fa	Python-589c8a	python-589c8a	Programming	\N	t	2026-10-06 04:01:29.429332	2026-10-06 04:01:29.429338
skl-6745d32c	Docker-589c8a	docker-589c8a	DevOps	\N	t	2026-10-06 04:01:29.438262	2026-10-06 04:01:29.438271
skl-8822e0c0	AWS-1c323a	aws-1c323a	Cloud	\N	t	2026-10-06 04:01:29.629305	2026-10-06 04:01:29.629314
skl-010b2144	Python-1c323a	python-1c323a	Programming	\N	t	2026-10-06 04:01:29.655042	2026-10-06 04:01:29.655048
skl-b0a17ad8	Docker-1c323a	docker-1c323a	DevOps	\N	t	2026-10-06 04:01:29.679709	2026-10-06 04:01:29.679721
skl-f2174da7	AWS-d2adfb	aws-d2adfb	Cloud	\N	t	2026-10-06 04:01:30.170981	2026-10-06 04:01:30.170986
skl-3bff112f	Python-d2adfb	python-d2adfb	Programming	\N	t	2026-10-06 04:01:30.207591	2026-10-06 04:01:30.207608
skl-f6ce553d	Docker-d2adfb	docker-d2adfb	DevOps	\N	t	2026-10-06 04:01:30.231015	2026-10-06 04:01:30.231021
skl-2c219b71	AWS-2c4554	aws-2c4554	Cloud	\N	t	2026-10-06 04:01:30.469424	2026-10-06 04:01:30.469431
skl-5fd8deb7	Python-2c4554	python-2c4554	Programming	\N	t	2026-10-06 04:01:30.493802	2026-10-06 04:01:30.493816
skl-675b7b73	Docker-2c4554	docker-2c4554	DevOps	\N	t	2026-10-06 04:01:30.516127	2026-10-06 04:01:30.516142
skl-69e903f9	AWS-b81d2b	aws-b81d2b	Cloud	\N	t	2026-10-06 04:01:30.784402	2026-10-06 04:01:30.784409
skl-775147e2	Python-b81d2b	python-b81d2b	Programming	\N	t	2026-10-06 04:01:30.805466	2026-10-06 04:01:30.80548
skl-e27b6819	Docker-b81d2b	docker-b81d2b	DevOps	\N	t	2026-10-06 04:01:30.825071	2026-10-06 04:01:30.825084
skl-065a2327	Python-f32945	python-f32945	General Competencies	\N	t	2026-10-06 04:01:32.571568	2026-10-06 04:01:32.571582
skl-3a2f4751	PostgreSQL-f32945	postgresql-f32945	General Competencies	\N	t	2026-10-06 04:01:32.595346	2026-10-06 04:01:32.595358
skl-33e8dc4f	Go-f66886	go-f66886	General Competencies	\N	t	2026-10-06 04:01:32.74261	2026-10-06 04:01:32.74262
skl-d82ab1d9	Docker-f66886	docker-f66886	General Competencies	\N	t	2026-10-06 04:01:32.768944	2026-10-06 04:01:32.768951
skl-71ed43c7	Terraform-66962a	terraform-66962a	General Competencies	\N	t	2026-10-06 04:01:32.90384	2026-10-06 04:01:32.903854
skl-75eeea38	AWS-5ba5af	aws-5ba5af	Cloud	\N	t	2026-10-06 04:13:33.33954	2026-10-06 04:13:33.339545
skl-b3587979	Python-5ba5af	python-5ba5af	Programming	\N	t	2026-10-06 04:13:33.349963	2026-10-06 04:13:33.349973
skl-78d6fb42	Docker-5ba5af	docker-5ba5af	DevOps	\N	t	2026-10-06 04:13:33.357692	2026-10-06 04:13:33.357696
skl-8a58baa1	AWS-f1166e	aws-f1166e	Cloud	\N	t	2026-10-06 04:13:33.688528	2026-10-06 04:13:33.688533
skl-8ebd3ce8	Python-f1166e	python-f1166e	Programming	\N	t	2026-10-06 04:13:33.693669	2026-10-06 04:13:33.693673
skl-205151c2	Docker-f1166e	docker-f1166e	DevOps	\N	t	2026-10-06 04:13:33.699035	2026-10-06 04:13:33.699039
skl-67235549	AWS-6b6749	aws-6b6749	Cloud	\N	t	2026-10-06 04:13:33.806567	2026-10-06 04:13:33.806573
skl-b70cdd82	Python-6b6749	python-6b6749	Programming	\N	t	2026-10-06 04:13:33.813202	2026-10-06 04:13:33.813207
skl-121641de	Docker-6b6749	docker-6b6749	DevOps	\N	t	2026-10-06 04:13:33.817785	2026-10-06 04:13:33.817789
skl-645cea34	AWS-de91a5	aws-de91a5	Cloud	\N	t	2026-10-06 04:13:33.89576	2026-10-06 04:13:33.895767
skl-c832c4e5	Python-de91a5	python-de91a5	Programming	\N	t	2026-10-06 04:13:33.904591	2026-10-06 04:13:33.904598
skl-9bdd2f59	Docker-de91a5	docker-de91a5	DevOps	\N	t	2026-10-06 04:13:33.911977	2026-10-06 04:13:33.911984
skl-02a4aa53	AWS-706c26	aws-706c26	Cloud	\N	t	2026-10-06 04:13:34.000578	2026-10-06 04:13:34.000586
skl-a758ca75	Python-706c26	python-706c26	Programming	\N	t	2026-10-06 04:13:34.008064	2026-10-06 04:13:34.00807
skl-04b14b2d	Docker-706c26	docker-706c26	DevOps	\N	t	2026-10-06 04:13:34.014912	2026-10-06 04:13:34.01492
skl-88e95180	AWS-49740f	aws-49740f	Cloud	\N	t	2026-10-06 04:13:34.085255	2026-10-06 04:13:34.085264
skl-84d02faa	Python-49740f	python-49740f	Programming	\N	t	2026-10-06 04:13:34.093439	2026-10-06 04:13:34.093445
skl-a4ab8363	Docker-49740f	docker-49740f	DevOps	\N	t	2026-10-06 04:13:34.098674	2026-10-06 04:13:34.098678
skl-1d011595	AWS-4a423b	aws-4a423b	Cloud	\N	t	2026-10-06 04:13:34.17402	2026-10-06 04:13:34.174025
skl-71b3a159	Python-4a423b	python-4a423b	Programming	\N	t	2026-10-06 04:13:34.178962	2026-10-06 04:13:34.178969
skl-63d8dd85	Docker-4a423b	docker-4a423b	DevOps	\N	t	2026-10-06 04:13:34.186712	2026-10-06 04:13:34.186721
skl-1b24a52f	AWS-12a8f6	aws-12a8f6	Cloud	\N	t	2026-10-06 04:13:34.252304	2026-10-06 04:13:34.252309
skl-6deb2260	Python-12a8f6	python-12a8f6	Programming	\N	t	2026-10-06 04:13:34.25697	2026-10-06 04:13:34.256977
skl-8475688e	Docker-12a8f6	docker-12a8f6	DevOps	\N	t	2026-10-06 04:13:34.261048	2026-10-06 04:13:34.261051
skl-ccb0854e	AWS-8cb3f3	aws-8cb3f3	Cloud	\N	t	2026-10-06 04:13:34.326562	2026-10-06 04:13:34.326565
skl-8223ce66	Python-8cb3f3	python-8cb3f3	Programming	\N	t	2026-10-06 04:13:34.333032	2026-10-06 04:13:34.333036
skl-ca32d62f	Docker-8cb3f3	docker-8cb3f3	DevOps	\N	t	2026-10-06 04:13:34.337871	2026-10-06 04:13:34.337877
skl-883108d5	AWS-4153e9	aws-4153e9	Cloud	\N	t	2026-10-06 04:13:34.410689	2026-10-06 04:13:34.410693
skl-ea547782	Python-4153e9	python-4153e9	Programming	\N	t	2026-10-06 04:13:34.417039	2026-10-06 04:13:34.417045
skl-c7572de8	Docker-4153e9	docker-4153e9	DevOps	\N	t	2026-10-06 04:13:34.423144	2026-10-06 04:13:34.423149
skl-53910776	AWS-27115d	aws-27115d	Cloud	\N	t	2026-10-06 04:13:34.53474	2026-10-06 04:13:34.534747
skl-abb6aa17	Python-27115d	python-27115d	Programming	\N	t	2026-10-06 04:13:34.542681	2026-10-06 04:13:34.542687
skl-3dc21daf	Docker-27115d	docker-27115d	DevOps	\N	t	2026-10-06 04:13:34.549211	2026-10-06 04:13:34.549215
skl-8ee32094	AWS-b68d8f	aws-b68d8f	Cloud	\N	t	2026-10-06 04:13:34.642761	2026-10-06 04:13:34.64277
skl-048e5b09	Python-b68d8f	python-b68d8f	Programming	\N	t	2026-10-06 04:13:34.652351	2026-10-06 04:13:34.652358
skl-09f53df3	Docker-b68d8f	docker-b68d8f	DevOps	\N	t	2026-10-06 04:13:34.660787	2026-10-06 04:13:34.660794
skl-dd098f8c	AWS-4b4e9f	aws-4b4e9f	Cloud	\N	t	2026-10-06 04:13:34.823979	2026-10-06 04:13:34.82399
skl-f88515fb	Python-4b4e9f	python-4b4e9f	Programming	\N	t	2026-10-06 04:13:34.837105	2026-10-06 04:13:34.837115
skl-310a391f	Docker-4b4e9f	docker-4b4e9f	DevOps	\N	t	2026-10-06 04:13:34.846152	2026-10-06 04:13:34.846161
skl-e9a89565	AWS-0a21df	aws-0a21df	Cloud	\N	t	2026-10-06 04:13:34.946953	2026-10-06 04:13:34.946957
skl-c0b3b2d7	Python-0a21df	python-0a21df	Programming	\N	t	2026-10-06 04:13:34.953104	2026-10-06 04:13:34.953109
skl-c63e1db9	Docker-0a21df	docker-0a21df	DevOps	\N	t	2026-10-06 04:13:34.958189	2026-10-06 04:13:34.958194
skl-2c977924	AWS-e9e573	aws-e9e573	Cloud	\N	t	2026-10-06 04:13:35.047289	2026-10-06 04:13:35.047294
skl-a3e2222e	Python-e9e573	python-e9e573	Programming	\N	t	2026-10-06 04:13:35.053677	2026-10-06 04:13:35.053681
skl-45d041b1	Docker-e9e573	docker-e9e573	DevOps	\N	t	2026-10-06 04:13:35.057822	2026-10-06 04:13:35.057826
skl-616c38da	Python-7a9cb5	python-7a9cb5	General Competencies	\N	t	2026-10-06 04:13:35.426321	2026-10-06 04:13:35.426326
skl-c63fd9c7	PostgreSQL-7a9cb5	postgresql-7a9cb5	General Competencies	\N	t	2026-10-06 04:13:35.434545	2026-10-06 04:13:35.43455
skl-2476aba2	Go-caaf15	go-caaf15	General Competencies	\N	t	2026-10-06 04:13:35.504547	2026-10-06 04:13:35.504556
skl-64ba3e7c	Docker-caaf15	docker-caaf15	General Competencies	\N	t	2026-10-06 04:13:35.517325	2026-10-06 04:13:35.517332
skl-e4abd169	Terraform-86906e	terraform-86906e	General Competencies	\N	t	2026-10-06 04:13:35.580171	2026-10-06 04:13:35.580179
skl-da0045e0	AWS-b82e17	aws-b82e17	Cloud	\N	t	2026-10-06 05:31:19.352135	2026-10-06 05:31:19.35214
skl-f57dc007	Python-b82e17	python-b82e17	Programming	\N	t	2026-10-06 05:31:19.366888	2026-10-06 05:31:19.366891
skl-3fca5d10	Docker-b82e17	docker-b82e17	DevOps	\N	t	2026-10-06 05:31:19.373335	2026-10-06 05:31:19.373341
skl-81da6234	AWS-0647b4	aws-0647b4	Cloud	\N	t	2026-10-06 05:31:19.666104	2026-10-06 05:31:19.66611
skl-02da1007	Python-0647b4	python-0647b4	Programming	\N	t	2026-10-06 05:31:19.676681	2026-10-06 05:31:19.676684
skl-3978064c	Docker-0647b4	docker-0647b4	DevOps	\N	t	2026-10-06 05:31:19.682176	2026-10-06 05:31:19.68218
skl-4377f8c9	AWS-137526	aws-137526	Cloud	\N	t	2026-10-06 05:31:19.743301	2026-10-06 05:31:19.743303
skl-29a4f818	Python-137526	python-137526	Programming	\N	t	2026-10-06 05:31:19.746201	2026-10-06 05:31:19.746203
skl-8e8db2ee	Docker-137526	docker-137526	DevOps	\N	t	2026-10-06 05:31:19.751278	2026-10-06 05:31:19.751281
skl-d8a809cf	AWS-3dc6a5	aws-3dc6a5	Cloud	\N	t	2026-10-06 05:31:19.802841	2026-10-06 05:31:19.802844
skl-a272b4eb	Python-3dc6a5	python-3dc6a5	Programming	\N	t	2026-10-06 05:31:19.809169	2026-10-06 05:31:19.809172
skl-d0a21ba4	Docker-3dc6a5	docker-3dc6a5	DevOps	\N	t	2026-10-06 05:31:19.811852	2026-10-06 05:31:19.811854
skl-b3676350	AWS-832e58	aws-832e58	Cloud	\N	t	2026-10-06 05:31:19.869179	2026-10-06 05:31:19.869182
skl-2068d5fd	Python-832e58	python-832e58	Programming	\N	t	2026-10-06 05:31:19.872044	2026-10-06 05:31:19.872048
skl-282fa90b	Docker-832e58	docker-832e58	DevOps	\N	t	2026-10-06 05:31:19.878745	2026-10-06 05:31:19.878748
skl-f1f03103	AWS-39acee	aws-39acee	Cloud	\N	t	2026-10-06 05:31:19.921905	2026-10-06 05:31:19.921908
skl-88c23fae	Python-39acee	python-39acee	Programming	\N	t	2026-10-06 05:31:19.927399	2026-10-06 05:31:19.927402
skl-cacef5f5	Docker-39acee	docker-39acee	DevOps	\N	t	2026-10-06 05:31:19.929655	2026-10-06 05:31:19.929657
skl-cd3981cb	AWS-d05e8e	aws-d05e8e	Cloud	\N	t	2026-10-06 05:31:19.982919	2026-10-06 05:31:19.982921
skl-f2b4b196	Python-d05e8e	python-d05e8e	Programming	\N	t	2026-10-06 05:31:19.988654	2026-10-06 05:31:19.988657
skl-85cff603	Docker-d05e8e	docker-d05e8e	DevOps	\N	t	2026-10-06 05:31:19.993389	2026-10-06 05:31:19.993392
skl-6345350f	AWS-aeb65a	aws-aeb65a	Cloud	\N	t	2026-10-06 05:31:20.043224	2026-10-06 05:31:20.043226
skl-d981f0fc	Python-aeb65a	python-aeb65a	Programming	\N	t	2026-10-06 05:31:20.047903	2026-10-06 05:31:20.047908
skl-4341d776	Docker-aeb65a	docker-aeb65a	DevOps	\N	t	2026-10-06 05:31:20.051263	2026-10-06 05:31:20.051265
skl-f173cc6f	AWS-3424f0	aws-3424f0	Cloud	\N	t	2026-10-06 05:31:20.098712	2026-10-06 05:31:20.098716
skl-7cc974d3	Python-3424f0	python-3424f0	Programming	\N	t	2026-10-06 05:31:20.102511	2026-10-06 05:31:20.102513
skl-084042e6	Docker-3424f0	docker-3424f0	DevOps	\N	t	2026-10-06 05:31:20.107027	2026-10-06 05:31:20.107039
skl-f8a0081f	AWS-b4726a	aws-b4726a	Cloud	\N	t	2026-10-06 05:31:20.166863	2026-10-06 05:31:20.166865
skl-479b65cb	Python-b4726a	python-b4726a	Programming	\N	t	2026-10-06 05:31:20.16989	2026-10-06 05:31:20.169893
skl-55748e8a	Docker-b4726a	docker-b4726a	DevOps	\N	t	2026-10-06 05:31:20.17269	2026-10-06 05:31:20.172694
skl-f136d7dc	AWS-a6a901	aws-a6a901	Cloud	\N	t	2026-10-06 05:31:20.234723	2026-10-06 05:31:20.234725
skl-5ffae2d3	Python-a6a901	python-a6a901	Programming	\N	t	2026-10-06 05:31:20.237263	2026-10-06 05:31:20.237265
skl-ff409626	Docker-a6a901	docker-a6a901	DevOps	\N	t	2026-10-06 05:31:20.240053	2026-10-06 05:31:20.240057
skl-88c515f7	AWS-62ae7b	aws-62ae7b	Cloud	\N	t	2026-10-06 05:31:20.301246	2026-10-06 05:31:20.301249
skl-dffcaa2c	Python-62ae7b	python-62ae7b	Programming	\N	t	2026-10-06 05:31:20.304694	2026-10-06 05:31:20.304697
skl-a390eea6	Docker-62ae7b	docker-62ae7b	DevOps	\N	t	2026-10-06 05:31:20.309041	2026-10-06 05:31:20.309043
skl-17b1c220	AWS-09e504	aws-09e504	Cloud	\N	t	2026-10-06 05:31:20.389375	2026-10-06 05:31:20.389381
skl-e573ec69	Python-09e504	python-09e504	Programming	\N	t	2026-10-06 05:31:20.393079	2026-10-06 05:31:20.393081
skl-9e09f23a	Docker-09e504	docker-09e504	DevOps	\N	t	2026-10-06 05:31:20.395205	2026-10-06 05:31:20.395207
skl-656d2cfb	AWS-08a46b	aws-08a46b	Cloud	\N	t	2026-10-06 05:31:20.444235	2026-10-06 05:31:20.444238
skl-2382ee7b	Python-08a46b	python-08a46b	Programming	\N	t	2026-10-06 05:31:20.447159	2026-10-06 05:31:20.447162
skl-199915b5	Docker-08a46b	docker-08a46b	DevOps	\N	t	2026-10-06 05:31:20.450921	2026-10-06 05:31:20.450923
skl-fb358be0	AWS-82c6e1	aws-82c6e1	Cloud	\N	t	2026-10-06 05:31:20.504836	2026-10-06 05:31:20.504839
skl-c9f6fbc9	Python-82c6e1	python-82c6e1	Programming	\N	t	2026-10-06 05:31:20.508952	2026-10-06 05:31:20.508954
skl-3e2967a7	Docker-82c6e1	docker-82c6e1	DevOps	\N	t	2026-10-06 05:31:20.511427	2026-10-06 05:31:20.51143
skl-4534970f	Python-65a9a0	python-65a9a0	General Competencies	\N	t	2026-10-06 05:31:20.977258	2026-10-06 05:31:20.977268
skl-b319ae40	PostgreSQL-65a9a0	postgresql-65a9a0	General Competencies	\N	t	2026-10-06 05:31:20.993226	2026-10-06 05:31:20.993235
skl-4351b737	Go-75b1e4	go-75b1e4	General Competencies	\N	t	2026-10-06 05:31:21.076157	2026-10-06 05:31:21.076164
skl-03d18e92	Docker-75b1e4	docker-75b1e4	General Competencies	\N	t	2026-10-06 05:31:21.084481	2026-10-06 05:31:21.084486
skl-873a26aa	Terraform-86a9d7	terraform-86a9d7	General Competencies	\N	t	2026-10-06 05:31:21.154957	2026-10-06 05:31:21.154963
skl-5986494d	Python-660623	python-660623	General Competencies	\N	t	2026-10-06 05:31:37.014745	2026-10-06 05:31:37.01475
skl-c6705cf8	PostgreSQL-660623	postgresql-660623	General Competencies	\N	t	2026-10-06 05:31:37.025353	2026-10-06 05:31:37.025359
skl-117b8268	Go-dcf292	go-dcf292	General Competencies	\N	t	2026-10-06 05:31:37.123982	2026-10-06 05:31:37.123991
skl-5da0cedf	Docker-dcf292	docker-dcf292	General Competencies	\N	t	2026-10-06 05:31:37.135285	2026-10-06 05:31:37.13529
skl-9ad4faa7	Java-17c57a	java-17c57a	General Competencies	\N	t	2026-10-06 05:31:37.220248	2026-10-06 05:31:37.220255
skl-74693d32	Spring-17c57a	spring-17c57a	General Competencies	\N	t	2026-10-06 05:31:37.23063	2026-10-06 05:31:37.230638
skl-b93cf5b6	React-2681b2	react-2681b2	General Competencies	\N	t	2026-10-06 05:31:37.329426	2026-10-06 05:31:37.329435
skl-79a8331c	GraphQL-2681b2	graphql-2681b2	General Competencies	\N	t	2026-10-06 05:31:37.342588	2026-10-06 05:31:37.342594
skl-c41fad54	Rust-d11d1d	rust-d11d1d	General Competencies	\N	t	2026-10-06 05:31:37.450805	2026-10-06 05:31:37.450813
skl-63110bc0	Cplusplus-d11d1d	cplusplus-d11d1d	General Competencies	\N	t	2026-10-06 05:31:37.459635	2026-10-06 05:31:37.459642
skl-edc0bf43	Terraform-000829	terraform-000829	General Competencies	\N	t	2026-10-06 05:31:37.729232	2026-10-06 05:31:37.729236
skl-c7f54479	Security-5ce308	security-5ce308	General Competencies	\N	t	2026-10-06 05:31:37.879305	2026-10-06 05:31:37.879314
skl-8f062431	Kafka-84400c	kafka-84400c	General Competencies	\N	t	2026-10-06 05:31:37.959803	2026-10-06 05:31:37.959811
skl-bd8b666e	SQL-7a6652	sql-7a6652	General Competencies	\N	t	2026-10-06 05:31:38.053316	2026-10-06 05:31:38.053321
skl-8412ef43	Scala-572c0a	scala-572c0a	General Competencies	\N	t	2026-10-06 05:31:38.142302	2026-10-06 05:31:38.142305
skl-80c3f8f5	Spark-572c0a	spark-572c0a	General Competencies	\N	t	2026-10-06 05:31:38.153854	2026-10-06 05:31:38.153857
skl-77eb93c4	Csharp-a0fa04	csharp-a0fa04	General Competencies	\N	t	2026-10-06 05:31:38.229012	2026-10-06 05:31:38.229018
skl-9f4bb72c	Redis-d4aaa6	redis-d4aaa6	General Competencies	\N	t	2026-10-06 05:31:38.791189	2026-10-06 05:31:38.791194
skl-9d96571c	AWS-7e7d63	aws-7e7d63	Cloud	\N	t	2026-10-06 15:42:27.559744	2026-10-06 15:42:27.559748
skl-502f63b4	Python-7e7d63	python-7e7d63	Programming	\N	t	2026-10-06 15:42:27.571739	2026-10-06 15:42:27.571745
skl-62d359ee	Docker-7e7d63	docker-7e7d63	DevOps	\N	t	2026-10-06 15:42:27.579429	2026-10-06 15:42:27.579432
skl-f07f99f6	AWS-ab88ea	aws-ab88ea	Cloud	\N	t	2026-10-06 15:42:27.847693	2026-10-06 15:42:27.847696
skl-1ff77f68	Python-ab88ea	python-ab88ea	Programming	\N	t	2026-10-06 15:42:27.854662	2026-10-06 15:42:27.854665
skl-0d4d87c0	Docker-ab88ea	docker-ab88ea	DevOps	\N	t	2026-10-06 15:42:27.862374	2026-10-06 15:42:27.862377
skl-9f059c95	AWS-50692c	aws-50692c	Cloud	\N	t	2026-10-06 15:42:27.956635	2026-10-06 15:42:27.956641
skl-7d5959f4	Python-50692c	python-50692c	Programming	\N	t	2026-10-06 15:42:27.960893	2026-10-06 15:42:27.960896
skl-29c346ea	Docker-50692c	docker-50692c	DevOps	\N	t	2026-10-06 15:42:27.964836	2026-10-06 15:42:27.96484
skl-64608c17	AWS-0f1e01	aws-0f1e01	Cloud	\N	t	2026-10-06 15:42:28.069298	2026-10-06 15:42:28.069303
skl-6e318565	Python-0f1e01	python-0f1e01	Programming	\N	t	2026-10-06 15:42:28.076227	2026-10-06 15:42:28.076234
skl-ca2d01ed	Docker-0f1e01	docker-0f1e01	DevOps	\N	t	2026-10-06 15:42:28.080889	2026-10-06 15:42:28.080893
skl-069d5aa7	AWS-6e5755	aws-6e5755	Cloud	\N	t	2026-10-06 15:42:28.147209	2026-10-06 15:42:28.147213
skl-c4c06b20	Python-6e5755	python-6e5755	Programming	\N	t	2026-10-06 15:42:28.151641	2026-10-06 15:42:28.151644
skl-ef642224	Docker-6e5755	docker-6e5755	DevOps	\N	t	2026-10-06 15:42:28.155415	2026-10-06 15:42:28.15542
skl-7642f4b8	AWS-7cea15	aws-7cea15	Cloud	\N	t	2026-10-06 15:42:28.217624	2026-10-06 15:42:28.217627
skl-fa337696	Python-7cea15	python-7cea15	Programming	\N	t	2026-10-06 15:42:28.221445	2026-10-06 15:42:28.221448
skl-b8d4664f	Docker-7cea15	docker-7cea15	DevOps	\N	t	2026-10-06 15:42:28.226819	2026-10-06 15:42:28.226822
skl-b0eeb11a	AWS-92aa52	aws-92aa52	Cloud	\N	t	2026-10-06 15:42:28.291067	2026-10-06 15:42:28.291073
skl-6c6f72f1	Python-92aa52	python-92aa52	Programming	\N	t	2026-10-06 15:42:28.295812	2026-10-06 15:42:28.295815
skl-dbc23e73	Docker-92aa52	docker-92aa52	DevOps	\N	t	2026-10-06 15:42:28.301553	2026-10-06 15:42:28.301556
skl-2d275688	AWS-06dd2a	aws-06dd2a	Cloud	\N	t	2026-10-06 15:42:28.402117	2026-10-06 15:42:28.40212
skl-08c222e0	Python-06dd2a	python-06dd2a	Programming	\N	t	2026-10-06 15:42:28.406699	2026-10-06 15:42:28.406705
skl-52f4fa20	Docker-06dd2a	docker-06dd2a	DevOps	\N	t	2026-10-06 15:42:28.411611	2026-10-06 15:42:28.411615
skl-9300dc90	AWS-0dd7f4	aws-0dd7f4	Cloud	\N	t	2026-10-06 15:42:28.517778	2026-10-06 15:42:28.517782
skl-886235ee	Python-0dd7f4	python-0dd7f4	Programming	\N	t	2026-10-06 15:42:28.525209	2026-10-06 15:42:28.525212
skl-a342fea4	Docker-0dd7f4	docker-0dd7f4	DevOps	\N	t	2026-10-06 15:42:28.528834	2026-10-06 15:42:28.528837
skl-daf973f9	AWS-334981	aws-334981	Cloud	\N	t	2026-10-06 15:42:28.592495	2026-10-06 15:42:28.592499
skl-6c6c5c0e	Python-334981	python-334981	Programming	\N	t	2026-10-06 15:42:28.59789	2026-10-06 15:42:28.597894
skl-79c12e85	Docker-334981	docker-334981	DevOps	\N	t	2026-10-06 15:42:28.602766	2026-10-06 15:42:28.602769
skl-f358ef8b	AWS-8486b3	aws-8486b3	Cloud	\N	t	2026-10-06 15:42:28.666251	2026-10-06 15:42:28.666255
skl-441bf1d3	Python-8486b3	python-8486b3	Programming	\N	t	2026-10-06 15:42:28.670871	2026-10-06 15:42:28.670875
skl-e59ded61	Docker-8486b3	docker-8486b3	DevOps	\N	t	2026-10-06 15:42:28.675247	2026-10-06 15:42:28.67525
skl-e250d867	AWS-ea9147	aws-ea9147	Cloud	\N	t	2026-10-06 15:42:28.745233	2026-10-06 15:42:28.745237
skl-454b2ae1	Python-ea9147	python-ea9147	Programming	\N	t	2026-10-06 15:42:28.749693	2026-10-06 15:42:28.749696
skl-2831411e	Docker-ea9147	docker-ea9147	DevOps	\N	t	2026-10-06 15:42:28.75327	2026-10-06 15:42:28.753273
skl-8e46a98f	AWS-977653	aws-977653	Cloud	\N	t	2026-10-06 15:42:28.852506	2026-10-06 15:42:28.852509
skl-6ab4415f	Python-977653	python-977653	Programming	\N	t	2026-10-06 15:42:28.858476	2026-10-06 15:42:28.858479
skl-a27b149f	Docker-977653	docker-977653	DevOps	\N	t	2026-10-06 15:42:28.862203	2026-10-06 15:42:28.862206
skl-92672e70	AWS-65171b	aws-65171b	Cloud	\N	t	2026-10-06 15:42:28.932724	2026-10-06 15:42:28.932727
skl-39815d08	Python-65171b	python-65171b	Programming	\N	t	2026-10-06 15:42:28.936642	2026-10-06 15:42:28.936644
skl-09f00272	Docker-65171b	docker-65171b	DevOps	\N	t	2026-10-06 15:42:28.941142	2026-10-06 15:42:28.941145
skl-0d64a824	AWS-d16b31	aws-d16b31	Cloud	\N	t	2026-10-06 15:42:29.006206	2026-10-06 15:42:29.006211
skl-884e59e7	Python-d16b31	python-d16b31	Programming	\N	t	2026-10-06 15:42:29.011604	2026-10-06 15:42:29.011607
skl-04cc1ae5	Docker-d16b31	docker-d16b31	DevOps	\N	t	2026-10-06 15:42:29.016376	2026-10-06 15:42:29.01639
skl-790ac975	Python-0ffe30	python-0ffe30	General Competencies	\N	t	2026-10-06 15:42:29.534927	2026-10-06 15:42:29.534931
skl-b234105a	PostgreSQL-0ffe30	postgresql-0ffe30	General Competencies	\N	t	2026-10-06 15:42:29.542658	2026-10-06 15:42:29.542663
skl-3385be9f	Go-772ba5	go-772ba5	General Competencies	\N	t	2026-10-06 15:42:29.601112	2026-10-06 15:42:29.601115
skl-4ec05d38	Docker-772ba5	docker-772ba5	General Competencies	\N	t	2026-10-06 15:42:29.606309	2026-10-06 15:42:29.606322
skl-90b910e2	Terraform-4600c2	terraform-4600c2	General Competencies	\N	t	2026-10-06 15:42:29.659195	2026-10-06 15:42:29.659198
skl-3c629a02	Python-3ec0e8	python-3ec0e8	General Competencies	\N	t	2026-10-06 15:42:54.6628	2026-10-06 15:42:54.662806
skl-e589404a	PostgreSQL-3ec0e8	postgresql-3ec0e8	General Competencies	\N	t	2026-10-06 15:42:54.677279	2026-10-06 15:42:54.677285
skl-ce5cabfb	Go-3eb828	go-3eb828	General Competencies	\N	t	2026-10-06 15:42:54.837092	2026-10-06 15:42:54.837095
skl-5c8ecadb	Docker-3eb828	docker-3eb828	General Competencies	\N	t	2026-10-06 15:42:54.843537	2026-10-06 15:42:54.84354
skl-fa01b3ce	Java-2e17f1	java-2e17f1	General Competencies	\N	t	2026-10-06 15:42:54.934925	2026-10-06 15:42:54.934929
skl-1f9c975a	Spring-2e17f1	spring-2e17f1	General Competencies	\N	t	2026-10-06 15:42:54.942382	2026-10-06 15:42:54.942389
skl-b927c421	React-bd7899	react-bd7899	General Competencies	\N	t	2026-10-06 15:42:55.009868	2026-10-06 15:42:55.009871
skl-0468568c	GraphQL-bd7899	graphql-bd7899	General Competencies	\N	t	2026-10-06 15:42:55.015757	2026-10-06 15:42:55.015763
skl-5f30cd95	Rust-d9e015	rust-d9e015	General Competencies	\N	t	2026-10-06 15:42:55.071128	2026-10-06 15:42:55.071132
skl-dbe65a1a	Cplusplus-d9e015	cplusplus-d9e015	General Competencies	\N	t	2026-10-06 15:42:55.077402	2026-10-06 15:42:55.077404
skl-802ddc6f	Terraform-c75a3f	terraform-c75a3f	General Competencies	\N	t	2026-10-06 15:42:55.125821	2026-10-06 15:42:55.125823
skl-53046d3b	Security-6f9176	security-6f9176	General Competencies	\N	t	2026-10-06 15:42:55.203609	2026-10-06 15:42:55.203612
skl-1b339fd0	Kafka-f06a05	kafka-f06a05	General Competencies	\N	t	2026-10-06 15:42:55.243459	2026-10-06 15:42:55.243462
skl-47111257	SQL-a3fc11	sql-a3fc11	General Competencies	\N	t	2026-10-06 15:42:55.277312	2026-10-06 15:42:55.277315
skl-2a8cb3a2	Scala-91efe3	scala-91efe3	General Competencies	\N	t	2026-10-06 15:42:55.33607	2026-10-06 15:42:55.336072
skl-96b2ff9d	Spark-91efe3	spark-91efe3	General Competencies	\N	t	2026-10-06 15:42:55.342411	2026-10-06 15:42:55.342414
skl-0e25c1cf	Csharp-ea09c2	csharp-ea09c2	General Competencies	\N	t	2026-10-06 15:42:55.374115	2026-10-06 15:42:55.374119
skl-d2a19b1c	Redis-5cb156	redis-5cb156	General Competencies	\N	t	2026-10-06 15:42:55.712934	2026-10-06 15:42:55.712938
skl-328c472b	Python-7718bc	python-7718bc	General Competencies	\N	t	2026-10-06 15:45:07.789179	2026-10-06 15:45:07.789182
skl-49e856b7	PostgreSQL-7718bc	postgresql-7718bc	General Competencies	\N	t	2026-10-06 15:45:07.796774	2026-10-06 15:45:07.796778
skl-8b50fc5e	Go-9edd2c	go-9edd2c	General Competencies	\N	t	2026-10-06 15:45:07.864926	2026-10-06 15:45:07.864929
skl-b9e6d54d	Docker-9edd2c	docker-9edd2c	General Competencies	\N	t	2026-10-06 15:45:07.872001	2026-10-06 15:45:07.872003
skl-e8c916e8	Java-8437f2	java-8437f2	General Competencies	\N	t	2026-10-06 15:45:07.971868	2026-10-06 15:45:07.971871
skl-f16f1992	Spring-8437f2	spring-8437f2	General Competencies	\N	t	2026-10-06 15:45:07.979299	2026-10-06 15:45:07.979302
skl-efd4b9eb	React-c74b0e	react-c74b0e	General Competencies	\N	t	2026-10-06 15:45:08.069915	2026-10-06 15:45:08.069918
skl-a8ab72c7	GraphQL-c74b0e	graphql-c74b0e	General Competencies	\N	t	2026-10-06 15:45:08.074655	2026-10-06 15:45:08.074657
skl-b6cc569d	Rust-016dfe	rust-016dfe	General Competencies	\N	t	2026-10-06 15:45:08.122369	2026-10-06 15:45:08.122371
skl-b90b66ee	Cplusplus-016dfe	cplusplus-016dfe	General Competencies	\N	t	2026-10-06 15:45:08.129732	2026-10-06 15:45:08.129735
skl-6a424a4f	Terraform-57350d	terraform-57350d	General Competencies	\N	t	2026-10-06 15:45:08.190777	2026-10-06 15:45:08.190779
skl-8cdf3afa	Security-5805c4	security-5805c4	General Competencies	\N	t	2026-10-06 15:45:08.263937	2026-10-06 15:45:08.263941
skl-4eb2e534	Kafka-400890	kafka-400890	General Competencies	\N	t	2026-10-06 15:45:08.307777	2026-10-06 15:45:08.307779
skl-ea7cf105	SQL-7e07b2	sql-7e07b2	General Competencies	\N	t	2026-10-06 15:45:08.348872	2026-10-06 15:45:08.348874
skl-b7ce172c	Scala-81e259	scala-81e259	General Competencies	\N	t	2026-10-06 15:45:08.398662	2026-10-06 15:45:08.398671
skl-be10d43b	Spark-81e259	spark-81e259	General Competencies	\N	t	2026-10-06 15:45:08.407206	2026-10-06 15:45:08.407209
skl-f5290e2f	Csharp-283135	csharp-283135	General Competencies	\N	t	2026-10-06 15:45:08.458289	2026-10-06 15:45:08.458293
skl-bcd5cef7	Redis-88ebce	redis-88ebce	General Competencies	\N	t	2026-10-06 15:45:08.922295	2026-10-06 15:45:08.922298
skl-22d9428c	AWS-d2dd9e	aws-d2dd9e	Cloud	\N	t	2026-10-06 15:53:53.482897	2026-10-06 15:53:53.482909
skl-58f0a480	Python-d2dd9e	python-d2dd9e	Programming	\N	t	2026-10-06 15:53:53.499529	2026-10-06 15:53:53.499541
skl-d3238f1b	Docker-d2dd9e	docker-d2dd9e	DevOps	\N	t	2026-10-06 15:53:53.513649	2026-10-06 15:53:53.513661
skl-bfb08093	AWS-ef2b04	aws-ef2b04	Cloud	\N	t	2026-10-06 15:53:54.201894	2026-10-06 15:53:54.201909
skl-7f6b9d27	Python-ef2b04	python-ef2b04	Programming	\N	t	2026-10-06 15:53:54.219867	2026-10-06 15:53:54.219878
skl-9e004630	Docker-ef2b04	docker-ef2b04	DevOps	\N	t	2026-10-06 15:53:54.234995	2026-10-06 15:53:54.235004
skl-f8bb383e	AWS-4f7a98	aws-4f7a98	Cloud	\N	t	2026-10-06 15:53:54.442222	2026-10-06 15:53:54.442233
skl-bca4d11c	Python-4f7a98	python-4f7a98	Programming	\N	t	2026-10-06 15:53:54.456654	2026-10-06 15:53:54.456669
skl-96fddef4	Docker-4f7a98	docker-4f7a98	DevOps	\N	t	2026-10-06 15:53:54.473282	2026-10-06 15:53:54.473286
skl-60df0999	AWS-43fc4a	aws-43fc4a	Cloud	\N	t	2026-10-06 15:53:54.643122	2026-10-06 15:53:54.643132
skl-11d522ad	Python-43fc4a	python-43fc4a	Programming	\N	t	2026-10-06 15:53:54.659671	2026-10-06 15:53:54.659676
skl-3be92fb2	Docker-43fc4a	docker-43fc4a	DevOps	\N	t	2026-10-06 15:53:54.676553	2026-10-06 15:53:54.676563
skl-2ae52943	AWS-49d293	aws-49d293	Cloud	\N	t	2026-10-06 15:53:54.866271	2026-10-06 15:53:54.86628
skl-6a0d8cf8	Python-49d293	python-49d293	Programming	\N	t	2026-10-06 15:53:54.884679	2026-10-06 15:53:54.884688
skl-ba9ff16e	Docker-49d293	docker-49d293	DevOps	\N	t	2026-10-06 15:53:54.900243	2026-10-06 15:53:54.900253
skl-c3443fbb	AWS-63a730	aws-63a730	Cloud	\N	t	2026-10-06 15:53:55.082052	2026-10-06 15:53:55.082063
skl-e5124d3d	Python-63a730	python-63a730	Programming	\N	t	2026-10-06 15:53:55.098118	2026-10-06 15:53:55.098129
skl-6662de11	Docker-63a730	docker-63a730	DevOps	\N	t	2026-10-06 15:53:55.114014	2026-10-06 15:53:55.114025
skl-69837764	AWS-671eab	aws-671eab	Cloud	\N	t	2026-10-06 15:53:55.228799	2026-10-06 15:53:55.228805
skl-89f9328b	Python-671eab	python-671eab	Programming	\N	t	2026-10-06 15:53:55.241072	2026-10-06 15:53:55.241082
skl-2ead5df1	Docker-671eab	docker-671eab	DevOps	\N	t	2026-10-06 15:53:55.252652	2026-10-06 15:53:55.252659
skl-0d1d0dac	AWS-608662	aws-608662	Cloud	\N	t	2026-10-06 15:53:55.372984	2026-10-06 15:53:55.372997
skl-7c289b6c	Python-608662	python-608662	Programming	\N	t	2026-10-06 15:53:55.388486	2026-10-06 15:53:55.3885
skl-7e3bed93	Docker-608662	docker-608662	DevOps	\N	t	2026-10-06 15:53:55.403345	2026-10-06 15:53:55.403357
skl-cca8e191	AWS-a6014e	aws-a6014e	Cloud	\N	t	2026-10-06 15:53:55.586806	2026-10-06 15:53:55.586811
skl-1afb8172	Python-a6014e	python-a6014e	Programming	\N	t	2026-10-06 15:53:55.601537	2026-10-06 15:53:55.601542
skl-ecf34170	Docker-a6014e	docker-a6014e	DevOps	\N	t	2026-10-06 15:53:55.614756	2026-10-06 15:53:55.614767
skl-7d82df43	AWS-a3ecc1	aws-a3ecc1	Cloud	\N	t	2026-10-06 15:53:55.815849	2026-10-06 15:53:55.815859
skl-d96bc360	Python-a3ecc1	python-a3ecc1	Programming	\N	t	2026-10-06 15:53:55.831084	2026-10-06 15:53:55.831096
skl-b0dfb0ae	Docker-a3ecc1	docker-a3ecc1	DevOps	\N	t	2026-10-06 15:53:55.84429	2026-10-06 15:53:55.844296
skl-8df3280f	AWS-6e4a10	aws-6e4a10	Cloud	\N	t	2026-10-06 15:53:55.983111	2026-10-06 15:53:55.983116
skl-53d9618b	Python-6e4a10	python-6e4a10	Programming	\N	t	2026-10-06 15:53:55.992697	2026-10-06 15:53:55.992702
skl-2bb623ce	Docker-6e4a10	docker-6e4a10	DevOps	\N	t	2026-10-06 15:53:56.00164	2026-10-06 15:53:56.001647
skl-6ceb940f	AWS-10e2c2	aws-10e2c2	Cloud	\N	t	2026-10-06 15:53:56.138988	2026-10-06 15:53:56.139
skl-fb8fd141	Python-10e2c2	python-10e2c2	Programming	\N	t	2026-10-06 15:53:56.152458	2026-10-06 15:53:56.152465
skl-c8293cda	Docker-10e2c2	docker-10e2c2	DevOps	\N	t	2026-10-06 15:53:56.163566	2026-10-06 15:53:56.163574
skl-07823b3d	AWS-12f07a	aws-12f07a	Cloud	\N	t	2026-10-06 15:53:56.377844	2026-10-06 15:53:56.377849
skl-f6b68f68	Python-12f07a	python-12f07a	Programming	\N	t	2026-10-06 15:53:56.388599	2026-10-06 15:53:56.388605
skl-3805e2a2	Docker-12f07a	docker-12f07a	DevOps	\N	t	2026-10-06 15:53:56.398404	2026-10-06 15:53:56.39841
skl-d334ccad	AWS-47c0db	aws-47c0db	Cloud	\N	t	2026-10-06 15:53:56.582865	2026-10-06 15:53:56.582876
skl-813e87c2	Python-47c0db	python-47c0db	Programming	\N	t	2026-10-06 15:53:56.596271	2026-10-06 15:53:56.596282
skl-5c3d6e00	Docker-47c0db	docker-47c0db	DevOps	\N	t	2026-10-06 15:53:56.606984	2026-10-06 15:53:56.606995
skl-6f70664a	AWS-e19c6d	aws-e19c6d	Cloud	\N	t	2026-10-06 15:53:56.795245	2026-10-06 15:53:56.795257
skl-01477782	Python-e19c6d	python-e19c6d	Programming	\N	t	2026-10-06 15:53:56.810607	2026-10-06 15:53:56.810618
skl-b42912e6	Docker-e19c6d	docker-e19c6d	DevOps	\N	t	2026-10-06 15:53:56.824524	2026-10-06 15:53:56.824532
skl-56836ba2	Python-35b763	python-35b763	General Competencies	\N	t	2026-10-06 15:53:58.575284	2026-10-06 15:53:58.575297
skl-0b5c8166	PostgreSQL-35b763	postgresql-35b763	General Competencies	\N	t	2026-10-06 15:53:58.594596	2026-10-06 15:53:58.59461
skl-fee61140	Go-c76044	go-c76044	General Competencies	\N	t	2026-10-06 15:53:58.723759	2026-10-06 15:53:58.723766
skl-037f0bbe	Docker-c76044	docker-c76044	General Competencies	\N	t	2026-10-06 15:53:58.744399	2026-10-06 15:53:58.74441
skl-0ec2ba12	Terraform-e7ec45	terraform-e7ec45	General Competencies	\N	t	2026-10-06 15:53:58.860457	2026-10-06 15:53:58.860463
skl-721ca933	Python-752dcf	python-752dcf	General Competencies	\N	t	2026-10-06 15:54:18.724572	2026-10-06 15:54:18.724576
skl-f793fc42	PostgreSQL-752dcf	postgresql-752dcf	General Competencies	\N	t	2026-10-06 15:54:18.732904	2026-10-06 15:54:18.732906
skl-afdef61d	Go-bbbf2e	go-bbbf2e	General Competencies	\N	t	2026-10-06 15:54:18.870839	2026-10-06 15:54:18.870846
skl-9a4c6db5	Docker-bbbf2e	docker-bbbf2e	General Competencies	\N	t	2026-10-06 15:54:18.876925	2026-10-06 15:54:18.876932
skl-8ee88548	Java-0e0df6	java-0e0df6	General Competencies	\N	t	2026-10-06 15:54:18.97755	2026-10-06 15:54:18.977554
skl-bb001dea	Spring-0e0df6	spring-0e0df6	General Competencies	\N	t	2026-10-06 15:54:18.984189	2026-10-06 15:54:18.984191
skl-748d8a58	React-b93a22	react-b93a22	General Competencies	\N	t	2026-10-06 15:54:19.029484	2026-10-06 15:54:19.029489
skl-fd310ac7	GraphQL-b93a22	graphql-b93a22	General Competencies	\N	t	2026-10-06 15:54:19.034781	2026-10-06 15:54:19.034785
skl-b7615384	Rust-12fc12	rust-12fc12	General Competencies	\N	t	2026-10-06 15:54:19.095507	2026-10-06 15:54:19.095515
skl-ab2de335	Cplusplus-12fc12	cplusplus-12fc12	General Competencies	\N	t	2026-10-06 15:54:19.100524	2026-10-06 15:54:19.100526
skl-675d6d0e	Terraform-a1196b	terraform-a1196b	General Competencies	\N	t	2026-10-06 15:54:19.158835	2026-10-06 15:54:19.158837
skl-53fc71a2	Security-42b16e	security-42b16e	General Competencies	\N	t	2026-10-06 15:54:19.223084	2026-10-06 15:54:19.223087
skl-54c801fa	Kafka-8387fb	kafka-8387fb	General Competencies	\N	t	2026-10-06 15:54:19.257483	2026-10-06 15:54:19.257485
skl-ea8d69fa	SQL-8afc60	sql-8afc60	General Competencies	\N	t	2026-10-06 15:54:19.29249	2026-10-06 15:54:19.292493
skl-f06aa5de	Scala-95408e	scala-95408e	General Competencies	\N	t	2026-10-06 15:54:19.336429	2026-10-06 15:54:19.336437
skl-bd59c03c	Spark-95408e	spark-95408e	General Competencies	\N	t	2026-10-06 15:54:19.341859	2026-10-06 15:54:19.341861
skl-c20bac7b	Csharp-c6cfd4	csharp-c6cfd4	General Competencies	\N	t	2026-10-06 15:54:19.377928	2026-10-06 15:54:19.377935
skl-5f1daacd	Redis-951acb	redis-951acb	General Competencies	\N	t	2026-10-06 15:54:19.764433	2026-10-06 15:54:19.764436
skl-9608d73b	AWS-c5d7ef	aws-c5d7ef	Cloud	\N	t	2026-10-06 16:08:31.845691	2026-10-06 16:08:31.845702
skl-f8f0fbd3	Python-c5d7ef	python-c5d7ef	Programming	\N	t	2026-10-06 16:08:31.864161	2026-10-06 16:08:31.864174
skl-8c31f274	Docker-c5d7ef	docker-c5d7ef	DevOps	\N	t	2026-10-06 16:08:31.879766	2026-10-06 16:08:31.879777
skl-ed53f193	AWS-093d8e	aws-093d8e	Cloud	\N	t	2026-10-06 16:08:32.570159	2026-10-06 16:08:32.570165
skl-11d21bcb	Python-093d8e	python-093d8e	Programming	\N	t	2026-10-06 16:08:32.585339	2026-10-06 16:08:32.585352
skl-abd50472	Docker-093d8e	docker-093d8e	DevOps	\N	t	2026-10-06 16:08:32.598273	2026-10-06 16:08:32.598279
skl-fab3bc3a	AWS-e2be83	aws-e2be83	Cloud	\N	t	2026-10-06 16:08:32.799424	2026-10-06 16:08:32.799436
skl-8169176f	Python-e2be83	python-e2be83	Programming	\N	t	2026-10-06 16:08:32.814054	2026-10-06 16:08:32.814066
skl-846158a6	Docker-e2be83	docker-e2be83	DevOps	\N	t	2026-10-06 16:08:32.829399	2026-10-06 16:08:32.829409
skl-54cfb93d	AWS-68916e	aws-68916e	Cloud	\N	t	2026-10-06 16:08:33.003516	2026-10-06 16:08:33.003527
skl-cab51b2f	Python-68916e	python-68916e	Programming	\N	t	2026-10-06 16:08:33.019261	2026-10-06 16:08:33.019267
skl-bbdb2e2a	Docker-68916e	docker-68916e	DevOps	\N	t	2026-10-06 16:08:33.033383	2026-10-06 16:08:33.033398
skl-de211051	AWS-b1b0e8	aws-b1b0e8	Cloud	\N	t	2026-10-06 16:08:33.226722	2026-10-06 16:08:33.226734
skl-cc8a1139	Python-b1b0e8	python-b1b0e8	Programming	\N	t	2026-10-06 16:08:33.238974	2026-10-06 16:08:33.23898
skl-46cea8bf	Docker-b1b0e8	docker-b1b0e8	DevOps	\N	t	2026-10-06 16:08:33.251255	2026-10-06 16:08:33.251261
skl-79a6bef1	AWS-f76e8f	aws-f76e8f	Cloud	\N	t	2026-10-06 16:08:33.382692	2026-10-06 16:08:33.382706
skl-fe94e4ad	Python-f76e8f	python-f76e8f	Programming	\N	t	2026-10-06 16:08:33.399396	2026-10-06 16:08:33.399409
skl-ff217364	Docker-f76e8f	docker-f76e8f	DevOps	\N	t	2026-10-06 16:08:33.416268	2026-10-06 16:08:33.416278
skl-74d727ee	AWS-6750bb	aws-6750bb	Cloud	\N	t	2026-10-06 16:08:33.586597	2026-10-06 16:08:33.586608
skl-df0d00ae	Python-6750bb	python-6750bb	Programming	\N	t	2026-10-06 16:08:33.603253	2026-10-06 16:08:33.603264
skl-c8cfe211	Docker-6750bb	docker-6750bb	DevOps	\N	t	2026-10-06 16:08:33.616914	2026-10-06 16:08:33.616924
skl-b09c3cb6	AWS-6c62a3	aws-6c62a3	Cloud	\N	t	2026-10-06 16:08:33.787976	2026-10-06 16:08:33.787981
skl-cf2b5672	Python-6c62a3	python-6c62a3	Programming	\N	t	2026-10-06 16:08:33.802116	2026-10-06 16:08:33.802127
skl-6c760bae	Docker-6c62a3	docker-6c62a3	DevOps	\N	t	2026-10-06 16:08:33.814847	2026-10-06 16:08:33.814852
skl-9c1aac44	AWS-d1f46d	aws-d1f46d	Cloud	\N	t	2026-10-06 16:08:34.008197	2026-10-06 16:08:34.00821
skl-1b937088	Python-d1f46d	python-d1f46d	Programming	\N	t	2026-10-06 16:08:34.028748	2026-10-06 16:08:34.028758
skl-74df74ad	Docker-d1f46d	docker-d1f46d	DevOps	\N	t	2026-10-06 16:08:34.043334	2026-10-06 16:08:34.043344
skl-16227518	AWS-452ff6	aws-452ff6	Cloud	\N	t	2026-10-06 16:08:34.276846	2026-10-06 16:08:34.276856
skl-772d5de2	Python-452ff6	python-452ff6	Programming	\N	t	2026-10-06 16:08:34.29253	2026-10-06 16:08:34.292543
skl-fd46ffe4	Docker-452ff6	docker-452ff6	DevOps	\N	t	2026-10-06 16:08:34.307635	2026-10-06 16:08:34.307646
skl-4a1d7b93	AWS-349b93	aws-349b93	Cloud	\N	t	2026-10-06 16:08:34.488118	2026-10-06 16:08:34.488125
skl-464f4c6d	Python-349b93	python-349b93	Programming	\N	t	2026-10-06 16:08:34.503544	2026-10-06 16:08:34.503578
skl-f28eaf41	Docker-349b93	docker-349b93	DevOps	\N	t	2026-10-06 16:08:34.51711	2026-10-06 16:08:34.517119
skl-f5826a26	AWS-68f719	aws-68f719	Cloud	\N	t	2026-10-06 16:08:34.715706	2026-10-06 16:08:34.715718
skl-38ef3af5	Python-68f719	python-68f719	Programming	\N	t	2026-10-06 16:08:34.733766	2026-10-06 16:08:34.733777
skl-199622ed	Docker-68f719	docker-68f719	DevOps	\N	t	2026-10-06 16:08:34.751294	2026-10-06 16:08:34.751308
skl-81205649	AWS-f40f71	aws-f40f71	Cloud	\N	t	2026-10-06 16:08:35.029711	2026-10-06 16:08:35.029722
skl-fcc99678	Python-f40f71	python-f40f71	Programming	\N	t	2026-10-06 16:08:35.048822	2026-10-06 16:08:35.048835
skl-f4e1f1dd	Docker-f40f71	docker-f40f71	DevOps	\N	t	2026-10-06 16:08:35.061644	2026-10-06 16:08:35.061654
skl-6eab98c8	AWS-ade994	aws-ade994	Cloud	\N	t	2026-10-06 16:08:35.286447	2026-10-06 16:08:35.286454
skl-3160a283	Python-ade994	python-ade994	Programming	\N	t	2026-10-06 16:08:35.306054	2026-10-06 16:08:35.306066
skl-20dcf2e7	Docker-ade994	docker-ade994	DevOps	\N	t	2026-10-06 16:08:35.318909	2026-10-06 16:08:35.318916
skl-d03fe990	AWS-93ac80	aws-93ac80	Cloud	\N	t	2026-10-06 16:08:35.521066	2026-10-06 16:08:35.521075
skl-4b6d5294	Python-93ac80	python-93ac80	Programming	\N	t	2026-10-06 16:08:35.542337	2026-10-06 16:08:35.542347
skl-e93262f0	Docker-93ac80	docker-93ac80	DevOps	\N	t	2026-10-06 16:08:35.562934	2026-10-06 16:08:35.562945
skl-386d7a33	Python-c2ac2c	python-c2ac2c	General Competencies	\N	t	2026-10-06 16:08:37.373312	2026-10-06 16:08:37.373326
skl-72796033	PostgreSQL-c2ac2c	postgresql-c2ac2c	General Competencies	\N	t	2026-10-06 16:08:37.388098	2026-10-06 16:08:37.388109
skl-86cd46c6	Go-69cd0d	go-69cd0d	General Competencies	\N	t	2026-10-06 16:08:37.507967	2026-10-06 16:08:37.507974
skl-8a36e6d3	Docker-69cd0d	docker-69cd0d	General Competencies	\N	t	2026-10-06 16:08:37.525215	2026-10-06 16:08:37.525226
skl-828e897e	Terraform-35f467	terraform-35f467	General Competencies	\N	t	2026-10-06 16:08:37.639294	2026-10-06 16:08:37.639306
skl-9e65b549	AWS-23d79e	aws-23d79e	Cloud	\N	t	2026-10-06 16:26:48.512389	2026-10-06 16:26:48.512393
skl-074f0424	Python-23d79e	python-23d79e	Programming	\N	t	2026-10-06 16:26:48.521053	2026-10-06 16:26:48.521059
skl-9db269db	Docker-23d79e	docker-23d79e	DevOps	\N	t	2026-10-06 16:26:48.527564	2026-10-06 16:26:48.527568
skl-50514083	AWS-f129da	aws-f129da	Cloud	\N	t	2026-10-06 16:26:49.279541	2026-10-06 16:26:49.279555
skl-4f61e064	Python-f129da	python-f129da	Programming	\N	t	2026-10-06 16:26:49.297819	2026-10-06 16:26:49.297831
skl-5fa91484	Docker-f129da	docker-f129da	DevOps	\N	t	2026-10-06 16:26:49.313227	2026-10-06 16:26:49.313239
skl-9c79d36d	AWS-59fb92	aws-59fb92	Cloud	\N	t	2026-10-06 16:26:49.546	2026-10-06 16:26:49.546012
skl-c7745179	Python-59fb92	python-59fb92	Programming	\N	t	2026-10-06 16:26:49.56171	2026-10-06 16:26:49.561721
skl-d2ac87eb	Docker-59fb92	docker-59fb92	DevOps	\N	t	2026-10-06 16:26:49.577905	2026-10-06 16:26:49.577914
skl-3a1fe8e5	AWS-5cc358	aws-5cc358	Cloud	\N	t	2026-10-06 16:26:49.757678	2026-10-06 16:26:49.757686
skl-70a453e5	Python-5cc358	python-5cc358	Programming	\N	t	2026-10-06 16:26:49.773376	2026-10-06 16:26:49.773387
skl-5d0c2699	Docker-5cc358	docker-5cc358	DevOps	\N	t	2026-10-06 16:26:49.788687	2026-10-06 16:26:49.788694
skl-6e45940e	AWS-56048b	aws-56048b	Cloud	\N	t	2026-10-06 16:26:49.994211	2026-10-06 16:26:49.994224
skl-3768abbe	Python-56048b	python-56048b	Programming	\N	t	2026-10-06 16:26:50.010525	2026-10-06 16:26:50.010537
skl-6b8a98af	Docker-56048b	docker-56048b	DevOps	\N	t	2026-10-06 16:26:50.02758	2026-10-06 16:26:50.027593
skl-f77117df	AWS-39014b	aws-39014b	Cloud	\N	t	2026-10-06 16:26:50.207902	2026-10-06 16:26:50.207913
skl-e14b742f	Python-39014b	python-39014b	Programming	\N	t	2026-10-06 16:26:50.222294	2026-10-06 16:26:50.222305
skl-2c4834f3	Docker-39014b	docker-39014b	DevOps	\N	t	2026-10-06 16:26:50.235524	2026-10-06 16:26:50.235538
skl-74203ba4	AWS-9001eb	aws-9001eb	Cloud	\N	t	2026-10-06 16:26:50.442144	2026-10-06 16:26:50.442154
skl-c0fac905	Python-9001eb	python-9001eb	Programming	\N	t	2026-10-06 16:26:50.457424	2026-10-06 16:26:50.457435
skl-2db3dced	Docker-9001eb	docker-9001eb	DevOps	\N	t	2026-10-06 16:26:50.471707	2026-10-06 16:26:50.471719
skl-a4ea962b	AWS-256180	aws-256180	Cloud	\N	t	2026-10-06 16:26:50.649763	2026-10-06 16:26:50.64977
skl-18d3a57b	Python-256180	python-256180	Programming	\N	t	2026-10-06 16:26:50.667759	2026-10-06 16:26:50.66777
skl-57fab609	Docker-256180	docker-256180	DevOps	\N	t	2026-10-06 16:26:50.684284	2026-10-06 16:26:50.684295
skl-86df213a	AWS-fd2ef4	aws-fd2ef4	Cloud	\N	t	2026-10-06 16:26:50.898133	2026-10-06 16:26:50.898144
skl-ae60d795	Python-fd2ef4	python-fd2ef4	Programming	\N	t	2026-10-06 16:26:50.915653	2026-10-06 16:26:50.915666
skl-8bd610d2	Docker-fd2ef4	docker-fd2ef4	DevOps	\N	t	2026-10-06 16:26:50.930445	2026-10-06 16:26:50.930458
skl-1b57d6f2	AWS-a51217	aws-a51217	Cloud	\N	t	2026-10-06 16:26:51.175401	2026-10-06 16:26:51.175415
skl-d4c6f042	Python-a51217	python-a51217	Programming	\N	t	2026-10-06 16:26:51.192535	2026-10-06 16:26:51.192542
skl-c1f39f09	Docker-a51217	docker-a51217	DevOps	\N	t	2026-10-06 16:26:51.242429	2026-10-06 16:26:51.242442
skl-666a77d2	AWS-da1f7f	aws-da1f7f	Cloud	\N	t	2026-10-06 16:26:51.469807	2026-10-06 16:26:51.469821
skl-a8d78e93	Python-da1f7f	python-da1f7f	Programming	\N	t	2026-10-06 16:26:51.483476	2026-10-06 16:26:51.483482
skl-dabb37a7	Docker-da1f7f	docker-da1f7f	DevOps	\N	t	2026-10-06 16:26:51.499773	2026-10-06 16:26:51.499784
skl-bcfc3b78	AWS-454f0e	aws-454f0e	Cloud	\N	t	2026-10-06 16:26:51.722023	2026-10-06 16:26:51.722036
skl-480f4a7c	Python-454f0e	python-454f0e	Programming	\N	t	2026-10-06 16:26:51.738105	2026-10-06 16:26:51.738117
skl-dc2c462a	Docker-454f0e	docker-454f0e	DevOps	\N	t	2026-10-06 16:26:51.750803	2026-10-06 16:26:51.750812
skl-3ffa000d	AWS-eabcc5	aws-eabcc5	Cloud	\N	t	2026-10-06 16:26:52.072908	2026-10-06 16:26:52.072921
skl-ba4804f3	Python-eabcc5	python-eabcc5	Programming	\N	t	2026-10-06 16:26:52.087278	2026-10-06 16:26:52.08729
skl-82e976e8	Docker-eabcc5	docker-eabcc5	DevOps	\N	t	2026-10-06 16:26:52.100784	2026-10-06 16:26:52.100789
skl-850d655e	AWS-6ad49a	aws-6ad49a	Cloud	\N	t	2026-10-06 16:26:52.341626	2026-10-06 16:26:52.341632
skl-e7b4b7f0	Python-6ad49a	python-6ad49a	Programming	\N	t	2026-10-06 16:26:52.356832	2026-10-06 16:26:52.356839
skl-24741a84	Docker-6ad49a	docker-6ad49a	DevOps	\N	t	2026-10-06 16:26:52.36985	2026-10-06 16:26:52.369862
skl-5df1b8ee	AWS-2a1164	aws-2a1164	Cloud	\N	t	2026-10-06 16:26:52.59397	2026-10-06 16:26:52.593981
skl-b17d49a9	Python-2a1164	python-2a1164	Programming	\N	t	2026-10-06 16:26:52.613252	2026-10-06 16:26:52.613264
skl-31352b05	Docker-2a1164	docker-2a1164	DevOps	\N	t	2026-10-06 16:26:52.628844	2026-10-06 16:26:52.628857
skl-f82507bc	Python-2438c8	python-2438c8	General Competencies	\N	t	2026-10-06 16:26:53.848185	2026-10-06 16:26:53.848191
skl-850f65af	PostgreSQL-2438c8	postgresql-2438c8	General Competencies	\N	t	2026-10-06 16:26:53.866694	2026-10-06 16:26:53.866712
skl-2395de8d	Go-2cb0cc	go-2cb0cc	General Competencies	\N	t	2026-10-06 16:26:53.992403	2026-10-06 16:26:53.992415
skl-caa05ea1	Docker-2cb0cc	docker-2cb0cc	General Competencies	\N	t	2026-10-06 16:26:54.012639	2026-10-06 16:26:54.012651
skl-fc1d864e	Terraform-094d40	terraform-094d40	General Competencies	\N	t	2026-10-06 16:26:54.143843	2026-10-06 16:26:54.143855
skl-76459147	AWS-983c1d	aws-983c1d	Cloud	\N	t	2026-10-07 03:16:32.056154	2026-10-07 03:16:32.056163
skl-a75d366d	Python-983c1d	python-983c1d	Programming	\N	t	2026-10-07 03:16:32.074982	2026-10-07 03:16:32.07499
skl-a54863e7	Docker-983c1d	docker-983c1d	DevOps	\N	t	2026-10-07 03:16:32.087562	2026-10-07 03:16:32.087569
skl-1d9a0ab6	AWS-bd17a6	aws-bd17a6	Cloud	\N	t	2026-10-07 03:16:32.796987	2026-10-07 03:16:32.796992
skl-d5f9d4c4	Python-bd17a6	python-bd17a6	Programming	\N	t	2026-10-07 03:16:32.813229	2026-10-07 03:16:32.813234
skl-937e6977	Docker-bd17a6	docker-bd17a6	DevOps	\N	t	2026-10-07 03:16:32.820957	2026-10-07 03:16:32.820962
skl-8e7dc33b	AWS-822a75	aws-822a75	Cloud	\N	t	2026-10-07 03:16:32.945719	2026-10-07 03:16:32.945724
skl-4bbda3fa	Python-822a75	python-822a75	Programming	\N	t	2026-10-07 03:16:32.951832	2026-10-07 03:16:32.951838
skl-22b20011	Docker-822a75	docker-822a75	DevOps	\N	t	2026-10-07 03:16:32.983959	2026-10-07 03:16:32.983966
skl-e93c36c5	AWS-450813	aws-450813	Cloud	\N	t	2026-10-07 03:16:33.060246	2026-10-07 03:16:33.060252
skl-aaac99bc	Python-450813	python-450813	Programming	\N	t	2026-10-07 03:16:33.0911	2026-10-07 03:16:33.091109
skl-9bc8161b	Docker-450813	docker-450813	DevOps	\N	t	2026-10-07 03:16:33.101119	2026-10-07 03:16:33.101128
skl-4c288fac	AWS-d3c271	aws-d3c271	Cloud	\N	t	2026-10-07 03:16:33.183591	2026-10-07 03:16:33.183595
skl-d7fccd8a	Python-d3c271	python-d3c271	Programming	\N	t	2026-10-07 03:16:33.21777	2026-10-07 03:16:33.217778
skl-0e22469a	Docker-d3c271	docker-d3c271	DevOps	\N	t	2026-10-07 03:16:33.227495	2026-10-07 03:16:33.227503
skl-880f09a5	AWS-81f3e6	aws-81f3e6	Cloud	\N	t	2026-10-07 03:16:33.329821	2026-10-07 03:16:33.329826
skl-3cbf7cfd	Python-81f3e6	python-81f3e6	Programming	\N	t	2026-10-07 03:16:33.339093	2026-10-07 03:16:33.3391
skl-c04b48cb	Docker-81f3e6	docker-81f3e6	DevOps	\N	t	2026-10-07 03:16:33.379586	2026-10-07 03:16:33.379595
skl-2acda0c5	AWS-c7bdcf	aws-c7bdcf	Cloud	\N	t	2026-10-07 03:16:33.491407	2026-10-07 03:16:33.491428
skl-e89c363c	Python-c7bdcf	python-c7bdcf	Programming	\N	t	2026-10-07 03:16:33.50183	2026-10-07 03:16:33.501836
skl-bc1987ea	Docker-c7bdcf	docker-c7bdcf	DevOps	\N	t	2026-10-07 03:16:33.507944	2026-10-07 03:16:33.507955
skl-6ab5ba87	AWS-a237d8	aws-a237d8	Cloud	\N	t	2026-10-07 03:16:33.628247	2026-10-07 03:16:33.628253
skl-795968db	Python-a237d8	python-a237d8	Programming	\N	t	2026-10-07 03:16:33.675989	2026-10-07 03:16:33.675996
skl-db9664b1	Docker-a237d8	docker-a237d8	DevOps	\N	t	2026-10-07 03:16:33.685413	2026-10-07 03:16:33.685422
skl-208bd4e3	AWS-7b96ca	aws-7b96ca	Cloud	\N	t	2026-10-07 03:16:33.792173	2026-10-07 03:16:33.792178
skl-f8e472c3	Python-7b96ca	python-7b96ca	Programming	\N	t	2026-10-07 03:16:33.796688	2026-10-07 03:16:33.796692
skl-35d3f1a0	Docker-7b96ca	docker-7b96ca	DevOps	\N	t	2026-10-07 03:16:33.804637	2026-10-07 03:16:33.804646
skl-1e9339c4	AWS-4186a4	aws-4186a4	Cloud	\N	t	2026-10-07 03:16:34.007902	2026-10-07 03:16:34.007906
skl-734fd87d	Python-4186a4	python-4186a4	Programming	\N	t	2026-10-07 03:16:34.018117	2026-10-07 03:16:34.018122
skl-f74c083b	Docker-4186a4	docker-4186a4	DevOps	\N	t	2026-10-07 03:16:34.024357	2026-10-07 03:16:34.024361
skl-818f0971	AWS-d6af9b	aws-d6af9b	Cloud	\N	t	2026-10-07 03:16:34.176141	2026-10-07 03:16:34.17615
skl-55a92c07	Python-d6af9b	python-d6af9b	Programming	\N	t	2026-10-07 03:16:34.185785	2026-10-07 03:16:34.185791
skl-e33c808a	Docker-d6af9b	docker-d6af9b	DevOps	\N	t	2026-10-07 03:16:34.194834	2026-10-07 03:16:34.19484
skl-72ebde78	AWS-7aa797	aws-7aa797	Cloud	\N	t	2026-10-07 03:16:34.31767	2026-10-07 03:16:34.317679
skl-35829443	Python-7aa797	python-7aa797	Programming	\N	t	2026-10-07 03:16:34.329678	2026-10-07 03:16:34.329683
skl-2290c636	Docker-7aa797	docker-7aa797	DevOps	\N	t	2026-10-07 03:16:34.337342	2026-10-07 03:16:34.337353
skl-02e7c7fd	AWS-a9faad	aws-a9faad	Cloud	\N	t	2026-10-07 03:16:34.536842	2026-10-07 03:16:34.53685
skl-10c51a7d	Python-a9faad	python-a9faad	Programming	\N	t	2026-10-07 03:16:34.545583	2026-10-07 03:16:34.54559
skl-210d0d65	Docker-a9faad	docker-a9faad	DevOps	\N	t	2026-10-07 03:16:34.553656	2026-10-07 03:16:34.553665
skl-f928a295	AWS-c05db2	aws-c05db2	Cloud	\N	t	2026-10-07 03:16:34.660318	2026-10-07 03:16:34.660326
skl-82bddb85	Python-c05db2	python-c05db2	Programming	\N	t	2026-10-07 03:16:34.669251	2026-10-07 03:16:34.669256
skl-424c47a9	Docker-c05db2	docker-c05db2	DevOps	\N	t	2026-10-07 03:16:34.674591	2026-10-07 03:16:34.674597
skl-47ba3ae4	AWS-905246	aws-905246	Cloud	\N	t	2026-10-07 03:16:34.797362	2026-10-07 03:16:34.797372
skl-ddfb9e48	Python-905246	python-905246	Programming	\N	t	2026-10-07 03:16:34.807966	2026-10-07 03:16:34.807974
skl-c20d41ec	Docker-905246	docker-905246	DevOps	\N	t	2026-10-07 03:16:34.816714	2026-10-07 03:16:34.816722
skl-d4cfd020	Python-47095b	python-47095b	General Competencies	\N	t	2026-10-07 03:16:35.272265	2026-10-07 03:16:35.272275
skl-01a92f84	PostgreSQL-47095b	postgresql-47095b	General Competencies	\N	t	2026-10-07 03:16:35.290403	2026-10-07 03:16:35.290411
skl-86306359	Go-688efd	go-688efd	General Competencies	\N	t	2026-10-07 03:16:35.386088	2026-10-07 03:16:35.386092
skl-df6117b5	Docker-688efd	docker-688efd	General Competencies	\N	t	2026-10-07 03:16:35.394358	2026-10-07 03:16:35.394362
skl-0562174e	Terraform-7ccada	terraform-7ccada	General Competencies	\N	t	2026-10-07 03:16:35.454197	2026-10-07 03:16:35.4542
skl-d90d9529	AWS-cf455b	aws-cf455b	Cloud	\N	t	2026-10-07 03:45:24.646654	2026-10-07 03:45:24.646656
skl-fcdd5d9f	Python-cf455b	python-cf455b	Programming	\N	t	2026-10-07 03:45:24.654289	2026-10-07 03:45:24.654293
skl-49b4b880	Docker-cf455b	docker-cf455b	DevOps	\N	t	2026-10-07 03:45:24.660198	2026-10-07 03:45:24.6602
skl-d65557f2	AWS-ed5804	aws-ed5804	Cloud	\N	t	2026-10-07 03:45:24.940789	2026-10-07 03:45:24.940793
skl-90cd1fd8	Python-ed5804	python-ed5804	Programming	\N	t	2026-10-07 03:45:24.956817	2026-10-07 03:45:24.956819
skl-850adba5	Docker-ed5804	docker-ed5804	DevOps	\N	t	2026-10-07 03:45:24.960945	2026-10-07 03:45:24.960947
skl-540fb741	AWS-92d634	aws-92d634	Cloud	\N	t	2026-10-07 03:45:25.009787	2026-10-07 03:45:25.009789
skl-e3ca0d9c	Python-92d634	python-92d634	Programming	\N	t	2026-10-07 03:45:25.030606	2026-10-07 03:45:25.030609
skl-e1c9deec	Docker-92d634	docker-92d634	DevOps	\N	t	2026-10-07 03:45:25.033549	2026-10-07 03:45:25.033551
skl-5bb53aad	AWS-c8baef	aws-c8baef	Cloud	\N	t	2026-10-07 03:45:25.077568	2026-10-07 03:45:25.07757
skl-ff59e54b	Python-c8baef	python-c8baef	Programming	\N	t	2026-10-07 03:45:25.081333	2026-10-07 03:45:25.081336
skl-dcd4adc6	Docker-c8baef	docker-c8baef	DevOps	\N	t	2026-10-07 03:45:25.098774	2026-10-07 03:45:25.098777
skl-cc80749b	AWS-477aec	aws-477aec	Cloud	\N	t	2026-10-07 03:45:25.144589	2026-10-07 03:45:25.144591
skl-a859fc37	Python-477aec	python-477aec	Programming	\N	t	2026-10-07 03:45:25.14841	2026-10-07 03:45:25.148412
skl-267a81c9	Docker-477aec	docker-477aec	DevOps	\N	t	2026-10-07 03:45:25.169198	2026-10-07 03:45:25.169213
skl-e8355a86	AWS-6a2b7c	aws-6a2b7c	Cloud	\N	t	2026-10-07 03:45:25.212586	2026-10-07 03:45:25.212594
skl-3811abbd	Python-6a2b7c	python-6a2b7c	Programming	\N	t	2026-10-07 03:45:25.216685	2026-10-07 03:45:25.216687
skl-f22429c0	Docker-6a2b7c	docker-6a2b7c	DevOps	\N	t	2026-10-07 03:45:25.233594	2026-10-07 03:45:25.233596
skl-cce9daa5	AWS-efbed4	aws-efbed4	Cloud	\N	t	2026-10-07 03:45:25.272709	2026-10-07 03:45:25.272712
skl-f95b6433	Python-efbed4	python-efbed4	Programming	\N	t	2026-10-07 03:45:25.276202	2026-10-07 03:45:25.276205
skl-77c24eb9	Docker-efbed4	docker-efbed4	DevOps	\N	t	2026-10-07 03:45:25.28029	2026-10-07 03:45:25.280293
skl-f411e69e	AWS-a7014e	aws-a7014e	Cloud	\N	t	2026-10-07 03:45:25.35809	2026-10-07 03:45:25.358094
skl-4f72e975	Python-a7014e	python-a7014e	Programming	\N	t	2026-10-07 03:45:25.361416	2026-10-07 03:45:25.361429
skl-8c2c4081	Docker-a7014e	docker-a7014e	DevOps	\N	t	2026-10-07 03:45:25.365346	2026-10-07 03:45:25.365349
skl-0a59162e	AWS-cef034	aws-cef034	Cloud	\N	t	2026-10-07 03:45:25.415806	2026-10-07 03:45:25.415809
skl-a67f1701	Python-cef034	python-cef034	Programming	\N	t	2026-10-07 03:45:25.43197	2026-10-07 03:45:25.431973
skl-9bff9885	Docker-cef034	docker-cef034	DevOps	\N	t	2026-10-07 03:45:25.435306	2026-10-07 03:45:25.435309
skl-6acb0908	AWS-b1c92b	aws-b1c92b	Cloud	\N	t	2026-10-07 03:45:25.4976	2026-10-07 03:45:25.497603
skl-58753777	Python-b1c92b	python-b1c92b	Programming	\N	t	2026-10-07 03:45:25.503195	2026-10-07 03:45:25.5032
skl-ef210a9d	Docker-b1c92b	docker-b1c92b	DevOps	\N	t	2026-10-07 03:45:25.507413	2026-10-07 03:45:25.507416
skl-75f0d9aa	AWS-d0930f	aws-d0930f	Cloud	\N	t	2026-10-07 03:45:25.564349	2026-10-07 03:45:25.564352
skl-17d01d30	Python-d0930f	python-d0930f	Programming	\N	t	2026-10-07 03:45:25.567977	2026-10-07 03:45:25.56798
skl-ea74cf2d	Docker-d0930f	docker-d0930f	DevOps	\N	t	2026-10-07 03:45:25.572961	2026-10-07 03:45:25.572964
skl-3b4094d0	AWS-4d95f9	aws-4d95f9	Cloud	\N	t	2026-10-07 03:45:25.624607	2026-10-07 03:45:25.62461
skl-82fbbc5e	Python-4d95f9	python-4d95f9	Programming	\N	t	2026-10-07 03:45:25.631877	2026-10-07 03:45:25.631882
skl-b3903480	Docker-4d95f9	docker-4d95f9	DevOps	\N	t	2026-10-07 03:45:25.636461	2026-10-07 03:45:25.636468
skl-b11291f6	AWS-daf4ee	aws-daf4ee	Cloud	\N	t	2026-10-07 03:45:25.723723	2026-10-07 03:45:25.723726
skl-cec1c907	Python-daf4ee	python-daf4ee	Programming	\N	t	2026-10-07 03:45:25.727067	2026-10-07 03:45:25.72707
skl-5744ee10	Docker-daf4ee	docker-daf4ee	DevOps	\N	t	2026-10-07 03:45:25.734026	2026-10-07 03:45:25.734028
skl-07d9ac2d	AWS-520b74	aws-520b74	Cloud	\N	t	2026-10-07 03:45:25.792871	2026-10-07 03:45:25.792873
skl-4afed963	Python-520b74	python-520b74	Programming	\N	t	2026-10-07 03:45:25.797561	2026-10-07 03:45:25.797564
skl-c2b20fe5	Docker-520b74	docker-520b74	DevOps	\N	t	2026-10-07 03:45:25.801085	2026-10-07 03:45:25.801087
skl-3bce80df	AWS-6cb14e	aws-6cb14e	Cloud	\N	t	2026-10-07 03:45:25.864506	2026-10-07 03:45:25.864509
skl-0e348e01	Python-6cb14e	python-6cb14e	Programming	\N	t	2026-10-07 03:45:25.868437	2026-10-07 03:45:25.86844
skl-8489c27e	Docker-6cb14e	docker-6cb14e	DevOps	\N	t	2026-10-07 03:45:25.872229	2026-10-07 03:45:25.872232
skl-0b73088c	Python-afda8c	python-afda8c	General Competencies	\N	t	2026-10-07 03:45:26.288292	2026-10-07 03:45:26.288296
skl-8c9c381c	PostgreSQL-afda8c	postgresql-afda8c	General Competencies	\N	t	2026-10-07 03:45:26.299415	2026-10-07 03:45:26.29942
skl-822e633a	Go-c06a82	go-c06a82	General Competencies	\N	t	2026-10-07 03:45:26.360153	2026-10-07 03:45:26.360156
skl-e7a9428f	Docker-c06a82	docker-c06a82	General Competencies	\N	t	2026-10-07 03:45:26.367868	2026-10-07 03:45:26.367871
skl-156363c0	Terraform-a200b5	terraform-a200b5	General Competencies	\N	t	2026-10-07 03:45:26.427118	2026-10-07 03:45:26.427121
skl-210cb9cd	Python-caa7a5	python-caa7a5	General Competencies	\N	t	2026-10-07 04:18:52.942114	2026-10-07 04:18:52.942117
skl-5100cef1	PostgreSQL-caa7a5	postgresql-caa7a5	General Competencies	\N	t	2026-10-07 04:18:52.949739	2026-10-07 04:18:52.949741
skl-b50b2f38	Go-801121	go-801121	General Competencies	\N	t	2026-10-07 04:18:52.988386	2026-10-07 04:18:52.988388
skl-874cd698	Docker-801121	docker-801121	General Competencies	\N	t	2026-10-07 04:18:53.003072	2026-10-07 04:18:53.003074
skl-85e52bd6	Java-bd2e37	java-bd2e37	General Competencies	\N	t	2026-10-07 04:18:53.033374	2026-10-07 04:18:53.033376
skl-72d5be0f	Spring-bd2e37	spring-bd2e37	General Competencies	\N	t	2026-10-07 04:18:53.043902	2026-10-07 04:18:53.043904
skl-5cfffa9f	React-28c83a	react-28c83a	General Competencies	\N	t	2026-10-07 04:18:53.081535	2026-10-07 04:18:53.081538
skl-eae750d3	GraphQL-28c83a	graphql-28c83a	General Competencies	\N	t	2026-10-07 04:18:53.085848	2026-10-07 04:18:53.08585
skl-1867fe77	Rust-47b63a	rust-47b63a	General Competencies	\N	t	2026-10-07 04:18:53.125364	2026-10-07 04:18:53.125366
skl-382bc4ca	Cplusplus-47b63a	cplusplus-47b63a	General Competencies	\N	t	2026-10-07 04:18:53.139048	2026-10-07 04:18:53.13905
skl-1e505ef4	Terraform-104280	terraform-104280	General Competencies	\N	t	2026-10-07 04:18:53.175338	2026-10-07 04:18:53.17534
skl-9aa2747f	Security-73f8c6	security-73f8c6	General Competencies	\N	t	2026-10-07 04:18:53.218165	2026-10-07 04:18:53.218168
skl-02ab43fb	Kafka-c4433d	kafka-c4433d	General Competencies	\N	t	2026-10-07 04:18:53.24852	2026-10-07 04:18:53.248522
skl-b024da3f	SQL-d60eab	sql-d60eab	General Competencies	\N	t	2026-10-07 04:18:53.279284	2026-10-07 04:18:53.279287
skl-e3091207	Scala-6072f9	scala-6072f9	General Competencies	\N	t	2026-10-07 04:18:53.337216	2026-10-07 04:18:53.337221
skl-f6f571f9	Spark-6072f9	spark-6072f9	General Competencies	\N	t	2026-10-07 04:18:53.351435	2026-10-07 04:18:53.351441
skl-226a7931	Csharp-88d61f	csharp-88d61f	General Competencies	\N	t	2026-10-07 04:18:53.422357	2026-10-07 04:18:53.422363
skl-7406f2b3	Redis-c58520	redis-c58520	General Competencies	\N	t	2026-10-07 04:18:53.913228	2026-10-07 04:18:53.913233
skl-27bf98a1	AWS-dea4ed	aws-dea4ed	Cloud	\N	t	2026-10-07 04:19:10.066701	2026-10-07 04:19:10.066705
skl-3c3d35d0	Python-dea4ed	python-dea4ed	Programming	\N	t	2026-10-07 04:19:10.073984	2026-10-07 04:19:10.073987
skl-734e7c96	Docker-dea4ed	docker-dea4ed	DevOps	\N	t	2026-10-07 04:19:10.07709	2026-10-07 04:19:10.077093
skl-355ca1b3	AWS-2a8c06	aws-2a8c06	Cloud	\N	t	2026-10-07 04:19:10.22931	2026-10-07 04:19:10.229313
skl-a52e6053	Python-2a8c06	python-2a8c06	Programming	\N	t	2026-10-07 04:19:10.23286	2026-10-07 04:19:10.232862
skl-7b589fa5	Docker-2a8c06	docker-2a8c06	DevOps	\N	t	2026-10-07 04:19:10.235869	2026-10-07 04:19:10.235871
skl-9ea56cdf	AWS-f9162a	aws-f9162a	Cloud	\N	t	2026-10-07 04:19:10.305835	2026-10-07 04:19:10.305837
skl-2e8e12b7	Python-f9162a	python-f9162a	Programming	\N	t	2026-10-07 04:19:10.308759	2026-10-07 04:19:10.308761
skl-2b08cd67	Docker-f9162a	docker-f9162a	DevOps	\N	t	2026-10-07 04:19:10.311474	2026-10-07 04:19:10.311477
skl-ee0b5e65	AWS-999502	aws-999502	Cloud	\N	t	2026-10-07 04:19:10.376098	2026-10-07 04:19:10.3761
skl-5bd7a25f	Python-999502	python-999502	Programming	\N	t	2026-10-07 04:19:10.398066	2026-10-07 04:19:10.398068
skl-9e6b81b2	Docker-999502	docker-999502	DevOps	\N	t	2026-10-07 04:19:10.400957	2026-10-07 04:19:10.400959
skl-25f30feb	AWS-b5eb95	aws-b5eb95	Cloud	\N	t	2026-10-07 04:19:10.454436	2026-10-07 04:19:10.454444
skl-17ea4066	Python-b5eb95	python-b5eb95	Programming	\N	t	2026-10-07 04:19:10.464151	2026-10-07 04:19:10.464158
skl-5d500ca6	Docker-b5eb95	docker-b5eb95	DevOps	\N	t	2026-10-07 04:19:10.470987	2026-10-07 04:19:10.470992
skl-c02c6d13	AWS-fcb785	aws-fcb785	Cloud	\N	t	2026-10-07 04:19:10.562287	2026-10-07 04:19:10.562296
skl-24122476	Python-fcb785	python-fcb785	Programming	\N	t	2026-10-07 04:19:10.574516	2026-10-07 04:19:10.574525
skl-99975af4	Docker-fcb785	docker-fcb785	DevOps	\N	t	2026-10-07 04:19:10.584221	2026-10-07 04:19:10.584229
skl-d8bb4d98	AWS-d6f9a8	aws-d6f9a8	Cloud	\N	t	2026-10-07 04:19:10.671532	2026-10-07 04:19:10.671536
skl-608a8193	Python-d6f9a8	python-d6f9a8	Programming	\N	t	2026-10-07 04:19:10.676496	2026-10-07 04:19:10.6765
skl-e7669023	Docker-d6f9a8	docker-d6f9a8	DevOps	\N	t	2026-10-07 04:19:10.680645	2026-10-07 04:19:10.680648
skl-5c888879	AWS-fb9027	aws-fb9027	Cloud	\N	t	2026-10-07 04:19:10.79571	2026-10-07 04:19:10.795719
skl-374f20d2	Python-fb9027	python-fb9027	Programming	\N	t	2026-10-07 04:19:10.807563	2026-10-07 04:19:10.807571
skl-0cb9525c	Docker-fb9027	docker-fb9027	DevOps	\N	t	2026-10-07 04:19:10.817182	2026-10-07 04:19:10.81719
skl-d31c9a6f	AWS-845cdf	aws-845cdf	Cloud	\N	t	2026-10-07 04:19:10.944684	2026-10-07 04:19:10.944691
skl-747ebc04	Python-845cdf	python-845cdf	Programming	\N	t	2026-10-07 04:19:10.955999	2026-10-07 04:19:10.956006
skl-184ae6ad	Docker-845cdf	docker-845cdf	DevOps	\N	t	2026-10-07 04:19:10.965256	2026-10-07 04:19:10.965262
skl-68072045	AWS-22f055	aws-22f055	Cloud	\N	t	2026-10-07 04:19:11.104439	2026-10-07 04:19:11.104443
skl-04a06c90	Python-22f055	python-22f055	Programming	\N	t	2026-10-07 04:19:11.108712	2026-10-07 04:19:11.108716
skl-d78c93fa	Docker-22f055	docker-22f055	DevOps	\N	t	2026-10-07 04:19:11.112673	2026-10-07 04:19:11.112677
skl-eef374df	AWS-0b0ce9	aws-0b0ce9	Cloud	\N	t	2026-10-07 04:19:11.269858	2026-10-07 04:19:11.269862
skl-40a04312	Python-0b0ce9	python-0b0ce9	Programming	\N	t	2026-10-07 04:19:11.29023	2026-10-07 04:19:11.290238
skl-5b231ea0	Docker-0b0ce9	docker-0b0ce9	DevOps	\N	t	2026-10-07 04:19:11.299646	2026-10-07 04:19:11.299654
skl-cbb4c464	AWS-e00126	aws-e00126	Cloud	\N	t	2026-10-07 04:19:11.459249	2026-10-07 04:19:11.459253
skl-240bc523	Python-e00126	python-e00126	Programming	\N	t	2026-10-07 04:19:11.46486	2026-10-07 04:19:11.464864
skl-3c084dd6	Docker-e00126	docker-e00126	DevOps	\N	t	2026-10-07 04:19:11.469608	2026-10-07 04:19:11.469612
skl-3ef57902	AWS-08a875	aws-08a875	Cloud	\N	t	2026-10-07 04:19:11.667113	2026-10-07 04:19:11.667121
skl-6fafca66	Python-08a875	python-08a875	Programming	\N	t	2026-10-07 04:19:11.680072	2026-10-07 04:19:11.680083
skl-321bca15	Docker-08a875	docker-08a875	DevOps	\N	t	2026-10-07 04:19:11.690647	2026-10-07 04:19:11.690656
skl-be50c1d1	AWS-e1db97	aws-e1db97	Cloud	\N	t	2026-10-07 04:19:11.831068	2026-10-07 04:19:11.831078
skl-1a9a428c	Python-e1db97	python-e1db97	Programming	\N	t	2026-10-07 04:19:11.844316	2026-10-07 04:19:11.844324
skl-0353630d	Docker-e1db97	docker-e1db97	DevOps	\N	t	2026-10-07 04:19:11.855317	2026-10-07 04:19:11.855323
skl-3e0cf59c	AWS-d8c0b5	aws-d8c0b5	Cloud	\N	t	2026-10-07 04:19:11.971759	2026-10-07 04:19:11.971766
skl-5711668d	Python-d8c0b5	python-d8c0b5	Programming	\N	t	2026-10-07 04:19:11.982623	2026-10-07 04:19:11.982627
skl-4c5583bb	Docker-d8c0b5	docker-d8c0b5	DevOps	\N	t	2026-10-07 04:19:11.991682	2026-10-07 04:19:11.991686
skl-e26d91e3	Python-37cbbd	python-37cbbd	General Competencies	\N	t	2026-10-07 04:19:12.883035	2026-10-07 04:19:12.883042
skl-ea6204a2	PostgreSQL-37cbbd	postgresql-37cbbd	General Competencies	\N	t	2026-10-07 04:19:12.894062	2026-10-07 04:19:12.894092
skl-6b63715b	Go-c6f484	go-c6f484	General Competencies	\N	t	2026-10-07 04:19:13.014723	2026-10-07 04:19:13.01473
skl-d934b7a9	Docker-c6f484	docker-c6f484	General Competencies	\N	t	2026-10-07 04:19:13.042671	2026-10-07 04:19:13.042679
skl-dcb0861c	Terraform-d39559	terraform-d39559	General Competencies	\N	t	2026-10-07 04:19:13.122943	2026-10-07 04:19:13.122976
skl-16965f31	Python-2df0b9	python-2df0b9	General Competencies	\N	t	2026-10-07 05:17:54.586866	2026-10-07 05:17:54.586868
skl-a5b120e3	PostgreSQL-2df0b9	postgresql-2df0b9	General Competencies	\N	t	2026-10-07 05:17:54.594233	2026-10-07 05:17:54.594235
skl-fd2bcc62	Go-f3e975	go-f3e975	General Competencies	\N	t	2026-10-07 05:17:54.654006	2026-10-07 05:17:54.654008
skl-c289fd3c	Docker-f3e975	docker-f3e975	General Competencies	\N	t	2026-10-07 05:17:54.665906	2026-10-07 05:17:54.665908
skl-6a119faa	Java-c60f9d	java-c60f9d	General Competencies	\N	t	2026-10-07 05:17:54.694601	2026-10-07 05:17:54.694603
skl-51100ce4	Spring-c60f9d	spring-c60f9d	General Competencies	\N	t	2026-10-07 05:17:54.730118	2026-10-07 05:17:54.730121
skl-87f9ba79	React-2b6fec	react-2b6fec	General Competencies	\N	t	2026-10-07 05:17:54.790341	2026-10-07 05:17:54.790344
skl-1f1bd97d	GraphQL-2b6fec	graphql-2b6fec	General Competencies	\N	t	2026-10-07 05:17:54.795337	2026-10-07 05:17:54.795339
skl-7e459728	Rust-77078f	rust-77078f	General Competencies	\N	t	2026-10-07 05:17:54.822539	2026-10-07 05:17:54.822541
skl-5309f381	Cplusplus-77078f	cplusplus-77078f	General Competencies	\N	t	2026-10-07 05:17:54.837067	2026-10-07 05:17:54.837069
skl-dedbab53	Terraform-4d45ca	terraform-4d45ca	General Competencies	\N	t	2026-10-07 05:17:54.900595	2026-10-07 05:17:54.900596
skl-aeee0d74	Security-c17d3b	security-c17d3b	General Competencies	\N	t	2026-10-07 05:17:54.938147	2026-10-07 05:17:54.938149
skl-4381e798	Kafka-73d9ef	kafka-73d9ef	General Competencies	\N	t	2026-10-07 05:17:54.957666	2026-10-07 05:17:54.957669
skl-4800f721	SQL-f90e9f	sql-f90e9f	General Competencies	\N	t	2026-10-07 05:17:55.052029	2026-10-07 05:17:55.05203
skl-f7c622fa	Scala-bfda33	scala-bfda33	General Competencies	\N	t	2026-10-07 05:17:55.083947	2026-10-07 05:17:55.083949
skl-14d42743	Spark-bfda33	spark-bfda33	General Competencies	\N	t	2026-10-07 05:17:55.087446	2026-10-07 05:17:55.087448
skl-87278406	Csharp-d41b16	csharp-d41b16	General Competencies	\N	t	2026-10-07 05:17:55.191436	2026-10-07 05:17:55.191443
skl-3c2ae7ca	Redis-641e50	redis-641e50	General Competencies	\N	t	2026-10-07 05:17:55.808703	2026-10-07 05:17:55.80871
skl-590b4503	AWS-2d58a8	aws-2d58a8	Cloud	\N	t	2026-10-07 05:18:09.980282	2026-10-07 05:18:09.980284
skl-f707518c	Python-2d58a8	python-2d58a8	Programming	\N	t	2026-10-07 05:18:09.993293	2026-10-07 05:18:09.993295
skl-2239749b	Docker-2d58a8	docker-2d58a8	DevOps	\N	t	2026-10-07 05:18:09.995537	2026-10-07 05:18:09.995539
skl-fbf3dcb6	AWS-b5dc25	aws-b5dc25	Cloud	\N	t	2026-10-07 05:18:10.132372	2026-10-07 05:18:10.132373
skl-7239c3b1	Python-b5dc25	python-b5dc25	Programming	\N	t	2026-10-07 05:18:10.134986	2026-10-07 05:18:10.134988
skl-19ca8d70	Docker-b5dc25	docker-b5dc25	DevOps	\N	t	2026-10-07 05:18:10.137366	2026-10-07 05:18:10.137368
skl-fdaefc8d	AWS-7c65d0	aws-7c65d0	Cloud	\N	t	2026-10-07 05:18:10.194622	2026-10-07 05:18:10.194624
skl-39f22265	Python-7c65d0	python-7c65d0	Programming	\N	t	2026-10-07 05:18:10.197431	2026-10-07 05:18:10.197432
skl-06ecc466	Docker-7c65d0	docker-7c65d0	DevOps	\N	t	2026-10-07 05:18:10.199852	2026-10-07 05:18:10.199854
skl-8693f406	AWS-f907c4	aws-f907c4	Cloud	\N	t	2026-10-07 05:18:10.253956	2026-10-07 05:18:10.253958
skl-974959ef	Python-f907c4	python-f907c4	Programming	\N	t	2026-10-07 05:18:10.256486	2026-10-07 05:18:10.256488
skl-5c7c165c	Docker-f907c4	docker-f907c4	DevOps	\N	t	2026-10-07 05:18:10.259316	2026-10-07 05:18:10.259318
skl-1b1822f6	AWS-de6151	aws-de6151	Cloud	\N	t	2026-10-07 05:18:10.314412	2026-10-07 05:18:10.314413
skl-bcf5462d	Python-de6151	python-de6151	Programming	\N	t	2026-10-07 05:18:10.317102	2026-10-07 05:18:10.317104
skl-70dc9320	Docker-de6151	docker-de6151	DevOps	\N	t	2026-10-07 05:18:10.319424	2026-10-07 05:18:10.319425
skl-386ad77c	AWS-90431f	aws-90431f	Cloud	\N	t	2026-10-07 05:18:10.376244	2026-10-07 05:18:10.376246
skl-ac95c09e	Python-90431f	python-90431f	Programming	\N	t	2026-10-07 05:18:10.379058	2026-10-07 05:18:10.37906
skl-a6172b39	Docker-90431f	docker-90431f	DevOps	\N	t	2026-10-07 05:18:10.381531	2026-10-07 05:18:10.381532
skl-dba4519d	AWS-87abe2	aws-87abe2	Cloud	\N	t	2026-10-07 05:18:10.439615	2026-10-07 05:18:10.439617
skl-ed165774	Python-87abe2	python-87abe2	Programming	\N	t	2026-10-07 05:18:10.442157	2026-10-07 05:18:10.442159
skl-34c79a97	Docker-87abe2	docker-87abe2	DevOps	\N	t	2026-10-07 05:18:10.444684	2026-10-07 05:18:10.444686
skl-5429b7d0	AWS-61d43a	aws-61d43a	Cloud	\N	t	2026-10-07 05:18:10.530888	2026-10-07 05:18:10.530894
skl-d693bdc4	Python-61d43a	python-61d43a	Programming	\N	t	2026-10-07 05:18:10.53903	2026-10-07 05:18:10.539036
skl-24a4401d	Docker-61d43a	docker-61d43a	DevOps	\N	t	2026-10-07 05:18:10.545858	2026-10-07 05:18:10.545863
skl-2e327d7d	AWS-bad8dc	aws-bad8dc	Cloud	\N	t	2026-10-07 05:18:10.686431	2026-10-07 05:18:10.686441
skl-06b48529	Python-bad8dc	python-bad8dc	Programming	\N	t	2026-10-07 05:18:10.700492	2026-10-07 05:18:10.700502
skl-7d7fc7d6	Docker-bad8dc	docker-bad8dc	DevOps	\N	t	2026-10-07 05:18:10.717484	2026-10-07 05:18:10.717495
skl-7b676ae6	AWS-f44f24	aws-f44f24	Cloud	\N	t	2026-10-07 05:18:10.835648	2026-10-07 05:18:10.835653
skl-ef25e9d1	Python-f44f24	python-f44f24	Programming	\N	t	2026-10-07 05:18:10.844428	2026-10-07 05:18:10.844434
skl-031d327a	Docker-f44f24	docker-f44f24	DevOps	\N	t	2026-10-07 05:18:10.852067	2026-10-07 05:18:10.852072
skl-5d69c7c8	AWS-470e81	aws-470e81	Cloud	\N	t	2026-10-07 05:18:10.985158	2026-10-07 05:18:10.985165
skl-c74feec6	Python-470e81	python-470e81	Programming	\N	t	2026-10-07 05:18:10.992534	2026-10-07 05:18:10.99254
skl-fe0db5d3	Docker-470e81	docker-470e81	DevOps	\N	t	2026-10-07 05:18:10.999651	2026-10-07 05:18:10.999655
skl-6f81eeb5	AWS-6f14a0	aws-6f14a0	Cloud	\N	t	2026-10-07 05:18:11.135574	2026-10-07 05:18:11.135579
skl-eac4d853	Python-6f14a0	python-6f14a0	Programming	\N	t	2026-10-07 05:18:11.142768	2026-10-07 05:18:11.142772
skl-7d3f086c	Docker-6f14a0	docker-6f14a0	DevOps	\N	t	2026-10-07 05:18:11.150752	2026-10-07 05:18:11.150756
skl-b516a938	AWS-a523f9	aws-a523f9	Cloud	\N	t	2026-10-07 05:18:11.329944	2026-10-07 05:18:11.329948
skl-b87315e5	Python-a523f9	python-a523f9	Programming	\N	t	2026-10-07 05:18:11.33543	2026-10-07 05:18:11.335438
skl-d22864ee	Docker-a523f9	docker-a523f9	DevOps	\N	t	2026-10-07 05:18:11.35989	2026-10-07 05:18:11.3599
skl-c1dccbed	AWS-6b4240	aws-6b4240	Cloud	\N	t	2026-10-07 05:18:11.551627	2026-10-07 05:18:11.551632
skl-f01bd94c	Python-6b4240	python-6b4240	Programming	\N	t	2026-10-07 05:18:11.560211	2026-10-07 05:18:11.560215
skl-2a1a7c0c	Docker-6b4240	docker-6b4240	DevOps	\N	t	2026-10-07 05:18:11.568679	2026-10-07 05:18:11.568684
skl-e100abb2	AWS-7896db	aws-7896db	Cloud	\N	t	2026-10-07 05:18:11.68712	2026-10-07 05:18:11.687124
skl-4eb16131	Python-7896db	python-7896db	Programming	\N	t	2026-10-07 05:18:11.692375	2026-10-07 05:18:11.692379
skl-1c56a499	Docker-7896db	docker-7896db	DevOps	\N	t	2026-10-07 05:18:11.69952	2026-10-07 05:18:11.699528
skl-a5a6135c	Python-85aa8b	python-85aa8b	General Competencies	\N	t	2026-10-07 05:18:13.073617	2026-10-07 05:18:13.073623
skl-fd5873d1	PostgreSQL-85aa8b	postgresql-85aa8b	General Competencies	\N	t	2026-10-07 05:18:13.082716	2026-10-07 05:18:13.08272
skl-e2a4d23d	Go-f5d432	go-f5d432	General Competencies	\N	t	2026-10-07 05:18:13.236511	2026-10-07 05:18:13.236516
skl-9ed21dea	Docker-f5d432	docker-f5d432	General Competencies	\N	t	2026-10-07 05:18:13.245881	2026-10-07 05:18:13.245887
skl-9a17035e	Terraform-789c1b	terraform-789c1b	General Competencies	\N	t	2026-10-07 05:18:13.393397	2026-10-07 05:18:13.393403
skl-eeb1f9b4	Python-659749	python-659749	General Competencies	\N	t	2026-10-08 03:22:40.941853	2026-10-08 03:22:40.94186
skl-9f2d57d4	PostgreSQL-659749	postgresql-659749	General Competencies	\N	t	2026-10-08 03:22:40.958134	2026-10-08 03:22:40.958141
skl-7102b117	Go-177f8a	go-177f8a	General Competencies	\N	t	2026-10-08 03:22:41.102043	2026-10-08 03:22:41.102049
skl-7a1dcfd0	Docker-177f8a	docker-177f8a	General Competencies	\N	t	2026-10-08 03:22:41.119123	2026-10-08 03:22:41.119128
skl-ba18c6f4	Java-bba7b5	java-bba7b5	General Competencies	\N	t	2026-10-08 03:22:41.194524	2026-10-08 03:22:41.194528
skl-45a8b819	Spring-bba7b5	spring-bba7b5	General Competencies	\N	t	2026-10-08 03:22:41.212058	2026-10-08 03:22:41.212063
skl-2a000b7f	React-229644	react-229644	General Competencies	\N	t	2026-10-08 03:22:41.297229	2026-10-08 03:22:41.297232
skl-2bf4208c	GraphQL-229644	graphql-229644	General Competencies	\N	t	2026-10-08 03:22:41.322408	2026-10-08 03:22:41.322415
skl-852ea0d6	Rust-6fb002	rust-6fb002	General Competencies	\N	t	2026-10-08 03:22:41.400084	2026-10-08 03:22:41.400091
skl-32462d4a	Cplusplus-6fb002	cplusplus-6fb002	General Competencies	\N	t	2026-10-08 03:22:41.433127	2026-10-08 03:22:41.433134
skl-ca5b4261	Terraform-e2d2d8	terraform-e2d2d8	General Competencies	\N	t	2026-10-08 03:22:41.512414	2026-10-08 03:22:41.512417
skl-12e85f13	Security-2b6a1b	security-2b6a1b	General Competencies	\N	t	2026-10-08 03:22:41.592167	2026-10-08 03:22:41.592174
skl-ff4e4e0c	Kafka-9e3a01	kafka-9e3a01	General Competencies	\N	t	2026-10-08 03:22:41.676506	2026-10-08 03:22:41.676515
skl-d9bbacf1	SQL-640d46	sql-640d46	General Competencies	\N	t	2026-10-08 03:22:41.744662	2026-10-08 03:22:41.744666
skl-fb93218f	Scala-07fc6c	scala-07fc6c	General Competencies	\N	t	2026-10-08 03:22:41.831267	2026-10-08 03:22:41.831274
skl-a49b7f69	Spark-07fc6c	spark-07fc6c	General Competencies	\N	t	2026-10-08 03:22:41.840603	2026-10-08 03:22:41.840608
skl-2e4dcbf3	Csharp-c8fef0	csharp-c8fef0	General Competencies	\N	t	2026-10-08 03:22:41.906842	2026-10-08 03:22:41.906846
skl-d29bece3	Redis-ec5b64	redis-ec5b64	General Competencies	\N	t	2026-10-08 03:22:42.406293	2026-10-08 03:22:42.406297
skl-dc95cf9a	AWS-3da52e	aws-3da52e	Cloud	\N	t	2026-10-08 03:23:00.938982	2026-10-08 03:23:00.939023
skl-62564719	Python-3da52e	python-3da52e	Programming	\N	t	2026-10-08 03:23:00.950081	2026-10-08 03:23:00.950087
skl-39e62232	Docker-3da52e	docker-3da52e	DevOps	\N	t	2026-10-08 03:23:00.969809	2026-10-08 03:23:00.969817
skl-26f14ca6	AWS-66cae3	aws-66cae3	Cloud	\N	t	2026-10-08 03:23:01.232989	2026-10-08 03:23:01.232992
skl-a5490b10	Python-66cae3	python-66cae3	Programming	\N	t	2026-10-08 03:23:01.237557	2026-10-08 03:23:01.23756
skl-c775eb58	Docker-66cae3	docker-66cae3	DevOps	\N	t	2026-10-08 03:23:01.242055	2026-10-08 03:23:01.242059
skl-2bc81ebc	AWS-73491d	aws-73491d	Cloud	\N	t	2026-10-08 03:23:01.360097	2026-10-08 03:23:01.360103
skl-4e671f1f	Python-73491d	python-73491d	Programming	\N	t	2026-10-08 03:23:01.36755	2026-10-08 03:23:01.367555
skl-328544d3	Docker-73491d	docker-73491d	DevOps	\N	t	2026-10-08 03:23:01.373466	2026-10-08 03:23:01.37347
skl-1020a589	AWS-26ff20	aws-26ff20	Cloud	\N	t	2026-10-08 03:23:01.484245	2026-10-08 03:23:01.48425
skl-2241d1b8	Python-26ff20	python-26ff20	Programming	\N	t	2026-10-08 03:23:01.49108	2026-10-08 03:23:01.491084
skl-7b621fdd	Docker-26ff20	docker-26ff20	DevOps	\N	t	2026-10-08 03:23:01.497126	2026-10-08 03:23:01.49713
skl-38d53b2d	AWS-e43e0c	aws-e43e0c	Cloud	\N	t	2026-10-08 03:23:01.617989	2026-10-08 03:23:01.617994
skl-9e881ead	Python-e43e0c	python-e43e0c	Programming	\N	t	2026-10-08 03:23:01.624385	2026-10-08 03:23:01.62439
skl-5802ce0c	Docker-e43e0c	docker-e43e0c	DevOps	\N	t	2026-10-08 03:23:01.631159	2026-10-08 03:23:01.631164
skl-d0d7a624	AWS-72770a	aws-72770a	Cloud	\N	t	2026-10-08 03:23:01.751581	2026-10-08 03:23:01.751586
skl-cbfafa8c	Python-72770a	python-72770a	Programming	\N	t	2026-10-08 03:23:01.758891	2026-10-08 03:23:01.758897
skl-02205553	Docker-72770a	docker-72770a	DevOps	\N	t	2026-10-08 03:23:01.764837	2026-10-08 03:23:01.764842
skl-83456a68	AWS-d83703	aws-d83703	Cloud	\N	t	2026-10-08 03:23:01.893042	2026-10-08 03:23:01.893047
skl-a862ae84	Python-d83703	python-d83703	Programming	\N	t	2026-10-08 03:23:01.899977	2026-10-08 03:23:01.899983
skl-aeea718e	Docker-d83703	docker-d83703	DevOps	\N	t	2026-10-08 03:23:01.907317	2026-10-08 03:23:01.907323
skl-8fa4a9a9	AWS-300f11	aws-300f11	Cloud	\N	t	2026-10-08 03:23:02.041571	2026-10-08 03:23:02.041575
skl-d3f97e74	Python-300f11	python-300f11	Programming	\N	t	2026-10-08 03:23:02.048696	2026-10-08 03:23:02.048701
skl-2a8490e7	Docker-300f11	docker-300f11	DevOps	\N	t	2026-10-08 03:23:02.054786	2026-10-08 03:23:02.054792
skl-2f4026cf	AWS-58af24	aws-58af24	Cloud	\N	t	2026-10-08 03:23:02.191406	2026-10-08 03:23:02.191412
skl-4fd3ae04	Python-58af24	python-58af24	Programming	\N	t	2026-10-08 03:23:02.199924	2026-10-08 03:23:02.199931
skl-e258e877	Docker-58af24	docker-58af24	DevOps	\N	t	2026-10-08 03:23:02.206919	2026-10-08 03:23:02.206924
skl-edc16929	AWS-e2d6dc	aws-e2d6dc	Cloud	\N	t	2026-10-08 03:23:02.310779	2026-10-08 03:23:02.310785
skl-1ae7fe47	Python-e2d6dc	python-e2d6dc	Programming	\N	t	2026-10-08 03:23:02.317898	2026-10-08 03:23:02.317902
skl-45a493a0	Docker-e2d6dc	docker-e2d6dc	DevOps	\N	t	2026-10-08 03:23:02.324243	2026-10-08 03:23:02.32425
skl-94226086	AWS-9cd746	aws-9cd746	Cloud	\N	t	2026-10-08 03:23:02.431717	2026-10-08 03:23:02.431721
skl-ac8db799	Python-9cd746	python-9cd746	Programming	\N	t	2026-10-08 03:23:02.436489	2026-10-08 03:23:02.436493
skl-aefacc93	Docker-9cd746	docker-9cd746	DevOps	\N	t	2026-10-08 03:23:02.44103	2026-10-08 03:23:02.441033
skl-640302f4	AWS-ee6464	aws-ee6464	Cloud	\N	t	2026-10-08 03:23:02.579349	2026-10-08 03:23:02.579355
skl-6e2373fa	Python-ee6464	python-ee6464	Programming	\N	t	2026-10-08 03:23:02.58571	2026-10-08 03:23:02.585714
skl-34308da6	Docker-ee6464	docker-ee6464	DevOps	\N	t	2026-10-08 03:23:02.589717	2026-10-08 03:23:02.58972
skl-6214d01d	AWS-5539fa	aws-5539fa	Cloud	\N	t	2026-10-08 03:23:02.763657	2026-10-08 03:23:02.763661
skl-a3a17dd0	Python-5539fa	python-5539fa	Programming	\N	t	2026-10-08 03:23:02.769839	2026-10-08 03:23:02.769844
skl-07885906	Docker-5539fa	docker-5539fa	DevOps	\N	t	2026-10-08 03:23:02.776061	2026-10-08 03:23:02.776066
skl-8dadb942	AWS-4d3f97	aws-4d3f97	Cloud	\N	t	2026-10-08 03:23:02.901136	2026-10-08 03:23:02.90114
skl-de6b96b3	Python-4d3f97	python-4d3f97	Programming	\N	t	2026-10-08 03:23:02.907854	2026-10-08 03:23:02.907859
skl-cacb44a6	Docker-4d3f97	docker-4d3f97	DevOps	\N	t	2026-10-08 03:23:02.915702	2026-10-08 03:23:02.915708
skl-51c2403c	AWS-437bfb	aws-437bfb	Cloud	\N	t	2026-10-08 03:23:03.095778	2026-10-08 03:23:03.095782
skl-617686de	Python-437bfb	python-437bfb	Programming	\N	t	2026-10-08 03:23:03.102102	2026-10-08 03:23:03.102106
skl-05d6cf17	Docker-437bfb	docker-437bfb	DevOps	\N	t	2026-10-08 03:23:03.106878	2026-10-08 03:23:03.106882
skl-d2c1e1eb	Python-54b679	python-54b679	General Competencies	\N	t	2026-10-08 03:23:05.123975	2026-10-08 03:23:05.123979
skl-fc82b316	PostgreSQL-54b679	postgresql-54b679	General Competencies	\N	t	2026-10-08 03:23:05.129994	2026-10-08 03:23:05.129998
skl-39486d05	Go-2279d1	go-2279d1	General Competencies	\N	t	2026-10-08 03:23:05.227405	2026-10-08 03:23:05.227409
skl-f96765c5	Docker-2279d1	docker-2279d1	General Competencies	\N	t	2026-10-08 03:23:05.233932	2026-10-08 03:23:05.233936
skl-c7e92200	Terraform-3e2c32	terraform-3e2c32	General Competencies	\N	t	2026-10-08 03:23:05.326576	2026-10-08 03:23:05.326579
skl-de702bf9	System Architecture	system-architecture	architecture	\N	t	2026-10-08 04:06:51.925786	2026-10-08 04:06:51.925789
skl-66028f20	Python-1f1be1	python-1f1be1	General Competencies	\N	t	2026-10-08 04:30:30.492966	2026-10-08 04:30:30.492975
skl-fcf462af	PostgreSQL-1f1be1	postgresql-1f1be1	General Competencies	\N	t	2026-10-08 04:30:30.507877	2026-10-08 04:30:30.507881
skl-bd8b57a2	Go-d1e278	go-d1e278	General Competencies	\N	t	2026-10-08 04:30:30.603955	2026-10-08 04:30:30.603958
skl-62ffc2a7	Docker-d1e278	docker-d1e278	General Competencies	\N	t	2026-10-08 04:30:30.612499	2026-10-08 04:30:30.612503
skl-04f80554	Java-01cf41	java-01cf41	General Competencies	\N	t	2026-10-08 04:30:30.677853	2026-10-08 04:30:30.677857
skl-a3d04eba	Spring-01cf41	spring-01cf41	General Competencies	\N	t	2026-10-08 04:30:30.699562	2026-10-08 04:30:30.699566
skl-2d4360f2	React-9da020	react-9da020	General Competencies	\N	t	2026-10-08 04:30:30.766419	2026-10-08 04:30:30.766423
skl-a394819d	GraphQL-9da020	graphql-9da020	General Competencies	\N	t	2026-10-08 04:30:30.783437	2026-10-08 04:30:30.783441
skl-052fb16d	Rust-8f6be7	rust-8f6be7	General Competencies	\N	t	2026-10-08 04:30:30.867278	2026-10-08 04:30:30.867282
skl-ac269134	Cplusplus-8f6be7	cplusplus-8f6be7	General Competencies	\N	t	2026-10-08 04:30:30.887115	2026-10-08 04:30:30.887119
skl-701498fa	Terraform-e6b00f	terraform-e6b00f	General Competencies	\N	t	2026-10-08 04:30:30.973456	2026-10-08 04:30:30.97346
skl-be46ae5d	Security-e3a87b	security-e3a87b	General Competencies	\N	t	2026-10-08 04:30:31.094092	2026-10-08 04:30:31.094096
skl-514d5df2	Kafka-bbeaf8	kafka-bbeaf8	General Competencies	\N	t	2026-10-08 04:30:31.152803	2026-10-08 04:30:31.152807
skl-3136d68f	SQL-3d501f	sql-3d501f	General Competencies	\N	t	2026-10-08 04:30:31.227884	2026-10-08 04:30:31.22789
skl-b312da90	Scala-20e28b	scala-20e28b	General Competencies	\N	t	2026-10-08 04:30:31.304586	2026-10-08 04:30:31.30459
skl-c9b04516	Spark-20e28b	spark-20e28b	General Competencies	\N	t	2026-10-08 04:30:31.312984	2026-10-08 04:30:31.312988
skl-83ae4cc8	Csharp-a4f71c	csharp-a4f71c	General Competencies	\N	t	2026-10-08 04:30:31.381283	2026-10-08 04:30:31.381287
skl-94f1b93a	Redis-6615c5	redis-6615c5	General Competencies	\N	t	2026-10-08 04:30:31.781619	2026-10-08 04:30:31.781625
skl-54ed39ce	AWS-5d6b9b	aws-5d6b9b	Cloud	\N	t	2026-10-08 04:30:52.061601	2026-10-08 04:30:52.061606
skl-b23ac58d	Python-5d6b9b	python-5d6b9b	Programming	\N	t	2026-10-08 04:30:52.070328	2026-10-08 04:30:52.070331
skl-2e58d9bc	Docker-5d6b9b	docker-5d6b9b	DevOps	\N	t	2026-10-08 04:30:52.074965	2026-10-08 04:30:52.074967
skl-e8e04f06	AWS-ca9b92	aws-ca9b92	Cloud	\N	t	2026-10-08 04:30:52.319279	2026-10-08 04:30:52.319283
skl-a2295c26	Python-ca9b92	python-ca9b92	Programming	\N	t	2026-10-08 04:30:52.32415	2026-10-08 04:30:52.324153
skl-437a8ed9	Docker-ca9b92	docker-ca9b92	DevOps	\N	t	2026-10-08 04:30:52.32779	2026-10-08 04:30:52.327792
skl-9ae345cb	AWS-e8e81d	aws-e8e81d	Cloud	\N	t	2026-10-08 04:30:52.475043	2026-10-08 04:30:52.475047
skl-7e0f505f	Python-e8e81d	python-e8e81d	Programming	\N	t	2026-10-08 04:30:52.478461	2026-10-08 04:30:52.478463
skl-80e153fb	Docker-e8e81d	docker-e8e81d	DevOps	\N	t	2026-10-08 04:30:52.481562	2026-10-08 04:30:52.481564
skl-8ce1e5d8	AWS-4b030f	aws-4b030f	Cloud	\N	t	2026-10-08 04:30:52.634002	2026-10-08 04:30:52.634004
skl-25c98294	Python-4b030f	python-4b030f	Programming	\N	t	2026-10-08 04:30:52.636996	2026-10-08 04:30:52.636998
skl-491af44d	Docker-4b030f	docker-4b030f	DevOps	\N	t	2026-10-08 04:30:52.639639	2026-10-08 04:30:52.63964
skl-58c0b57f	AWS-f0c5b8	aws-f0c5b8	Cloud	\N	t	2026-10-08 04:30:52.695309	2026-10-08 04:30:52.695312
skl-db84bd75	Python-f0c5b8	python-f0c5b8	Programming	\N	t	2026-10-08 04:30:52.699696	2026-10-08 04:30:52.699703
skl-907a7c27	Docker-f0c5b8	docker-f0c5b8	DevOps	\N	t	2026-10-08 04:30:52.70558	2026-10-08 04:30:52.705582
skl-9a1fbdbc	AWS-27cf0f	aws-27cf0f	Cloud	\N	t	2026-10-08 04:30:52.786123	2026-10-08 04:30:52.786126
skl-1da3b7da	Python-27cf0f	python-27cf0f	Programming	\N	t	2026-10-08 04:30:52.789398	2026-10-08 04:30:52.7894
skl-dcd747e9	Docker-27cf0f	docker-27cf0f	DevOps	\N	t	2026-10-08 04:30:52.794438	2026-10-08 04:30:52.79444
skl-02e53e66	AWS-6e9d95	aws-6e9d95	Cloud	\N	t	2026-10-08 04:30:52.849473	2026-10-08 04:30:52.849479
skl-a01a7ae1	Python-6e9d95	python-6e9d95	Programming	\N	t	2026-10-08 04:30:52.854792	2026-10-08 04:30:52.854795
skl-1928bfdc	Docker-6e9d95	docker-6e9d95	DevOps	\N	t	2026-10-08 04:30:52.859819	2026-10-08 04:30:52.859827
skl-529bcc1e	AWS-5167d3	aws-5167d3	Cloud	\N	t	2026-10-08 04:30:52.926026	2026-10-08 04:30:52.926028
skl-ec3902c2	Python-5167d3	python-5167d3	Programming	\N	t	2026-10-08 04:30:52.929221	2026-10-08 04:30:52.929223
skl-3d2db957	Docker-5167d3	docker-5167d3	DevOps	\N	t	2026-10-08 04:30:52.931963	2026-10-08 04:30:52.931966
skl-0d0d3d3a	AWS-67ff73	aws-67ff73	Cloud	\N	t	2026-10-08 04:30:52.999392	2026-10-08 04:30:52.999395
skl-84b78fe9	Python-67ff73	python-67ff73	Programming	\N	t	2026-10-08 04:30:53.002991	2026-10-08 04:30:53.002993
skl-5ac70900	Docker-67ff73	docker-67ff73	DevOps	\N	t	2026-10-08 04:30:53.006134	2026-10-08 04:30:53.006136
skl-42aec20c	AWS-a7bb9e	aws-a7bb9e	Cloud	\N	t	2026-10-08 04:30:53.081877	2026-10-08 04:30:53.081879
skl-2b1efa4d	Python-a7bb9e	python-a7bb9e	Programming	\N	t	2026-10-08 04:30:53.085878	2026-10-08 04:30:53.085881
skl-5f560026	Docker-a7bb9e	docker-a7bb9e	DevOps	\N	t	2026-10-08 04:30:53.088938	2026-10-08 04:30:53.08894
skl-cd70588f	AWS-f61689	aws-f61689	Cloud	\N	t	2026-10-08 04:30:53.155855	2026-10-08 04:30:53.155857
skl-5cf01157	Python-f61689	python-f61689	Programming	\N	t	2026-10-08 04:30:53.159724	2026-10-08 04:30:53.159727
skl-68e05669	Docker-f61689	docker-f61689	DevOps	\N	t	2026-10-08 04:30:53.162494	2026-10-08 04:30:53.162495
skl-11ecfd94	AWS-0d35a3	aws-0d35a3	Cloud	\N	t	2026-10-08 04:30:53.272843	2026-10-08 04:30:53.272845
skl-cf5e483f	Python-0d35a3	python-0d35a3	Programming	\N	t	2026-10-08 04:30:53.276057	2026-10-08 04:30:53.276059
skl-4f720bdf	Docker-0d35a3	docker-0d35a3	DevOps	\N	t	2026-10-08 04:30:53.279087	2026-10-08 04:30:53.279089
skl-41eae265	AWS-88ab89	aws-88ab89	Cloud	\N	t	2026-10-08 04:30:53.378791	2026-10-08 04:30:53.378793
skl-85998c29	Python-88ab89	python-88ab89	Programming	\N	t	2026-10-08 04:30:53.381743	2026-10-08 04:30:53.381745
skl-fd679e9f	Docker-88ab89	docker-88ab89	DevOps	\N	t	2026-10-08 04:30:53.385949	2026-10-08 04:30:53.385951
skl-f1f282fc	AWS-746bf0	aws-746bf0	Cloud	\N	t	2026-10-08 04:30:53.47766	2026-10-08 04:30:53.477663
skl-83f2cc4e	Python-746bf0	python-746bf0	Programming	\N	t	2026-10-08 04:30:53.480528	2026-10-08 04:30:53.480529
skl-a336dfcf	Docker-746bf0	docker-746bf0	DevOps	\N	t	2026-10-08 04:30:53.484332	2026-10-08 04:30:53.484335
skl-1096dd58	AWS-3475b4	aws-3475b4	Cloud	\N	t	2026-10-08 04:30:53.574264	2026-10-08 04:30:53.574267
skl-63668862	Python-3475b4	python-3475b4	Programming	\N	t	2026-10-08 04:30:53.577607	2026-10-08 04:30:53.577609
skl-c2a13570	Docker-3475b4	docker-3475b4	DevOps	\N	t	2026-10-08 04:30:53.580343	2026-10-08 04:30:53.580344
skl-463b86cd	Python-48ad51	python-48ad51	General Competencies	\N	t	2026-10-08 04:30:55.25439	2026-10-08 04:30:55.254392
skl-cb6e326f	PostgreSQL-48ad51	postgresql-48ad51	General Competencies	\N	t	2026-10-08 04:30:55.259573	2026-10-08 04:30:55.259575
skl-16489fce	Go-57a6bb	go-57a6bb	General Competencies	\N	t	2026-10-08 04:30:55.323155	2026-10-08 04:30:55.323157
skl-a69230b6	Docker-57a6bb	docker-57a6bb	General Competencies	\N	t	2026-10-08 04:30:55.32787	2026-10-08 04:30:55.327872
skl-9b0da69a	Terraform-6e6fff	terraform-6e6fff	General Competencies	\N	t	2026-10-08 04:30:55.362344	2026-10-08 04:30:55.362346
skl-b49e1e75	Python-5f83f5	python-5f83f5	General Competencies	\N	t	2026-10-08 08:33:49.665206	2026-10-08 08:33:49.665208
skl-fc5aff3c	PostgreSQL-5f83f5	postgresql-5f83f5	General Competencies	\N	t	2026-10-08 08:33:49.675304	2026-10-08 08:33:49.675306
skl-b37a3ed2	Go-58a506	go-58a506	General Competencies	\N	t	2026-10-08 08:33:49.733074	2026-10-08 08:33:49.733076
skl-f8c377ff	Docker-58a506	docker-58a506	General Competencies	\N	t	2026-10-08 08:33:49.738349	2026-10-08 08:33:49.738353
skl-7283aecb	Java-58bd5a	java-58bd5a	General Competencies	\N	t	2026-10-08 08:33:49.778601	2026-10-08 08:33:49.778603
skl-dd8f9c8c	Spring-58bd5a	spring-58bd5a	General Competencies	\N	t	2026-10-08 08:33:49.795712	2026-10-08 08:33:49.795714
skl-092b4733	React-3dfafe	react-3dfafe	General Competencies	\N	t	2026-10-08 08:33:49.83454	2026-10-08 08:33:49.834541
skl-77d63e27	GraphQL-3dfafe	graphql-3dfafe	General Competencies	\N	t	2026-10-08 08:33:49.850142	2026-10-08 08:33:49.850144
skl-0118d345	Rust-30f7f2	rust-30f7f2	General Competencies	\N	t	2026-10-08 08:33:49.884693	2026-10-08 08:33:49.884695
skl-f0acbe2a	Cplusplus-30f7f2	cplusplus-30f7f2	General Competencies	\N	t	2026-10-08 08:33:49.897523	2026-10-08 08:33:49.897526
skl-ace302b8	Terraform-2d4dff	terraform-2d4dff	General Competencies	\N	t	2026-10-08 08:33:49.931389	2026-10-08 08:33:49.931391
skl-d4dd7055	Security-42d10e	security-42d10e	General Competencies	\N	t	2026-10-08 08:33:49.968625	2026-10-08 08:33:49.968627
skl-f7691672	Kafka-0d3fbb	kafka-0d3fbb	General Competencies	\N	t	2026-10-08 08:33:49.989067	2026-10-08 08:33:49.98907
skl-e0ab476e	SQL-beff89	sql-beff89	General Competencies	\N	t	2026-10-08 08:33:50.011409	2026-10-08 08:33:50.011411
skl-e5bf6f5b	Scala-25013f	scala-25013f	General Competencies	\N	t	2026-10-08 08:33:50.034756	2026-10-08 08:33:50.034758
skl-72af24f4	Spark-25013f	spark-25013f	General Competencies	\N	t	2026-10-08 08:33:50.03852	2026-10-08 08:33:50.038522
skl-a68de40c	Csharp-a5bbe1	csharp-a5bbe1	General Competencies	\N	t	2026-10-08 08:33:50.068978	2026-10-08 08:33:50.068979
skl-93c1a789	Redis-ce1e97	redis-ce1e97	General Competencies	\N	t	2026-10-08 08:33:50.307569	2026-10-08 08:33:50.307571
skl-650682a1	AWS-1e6111	aws-1e6111	Cloud	\N	t	2026-10-08 08:34:20.027842	2026-10-08 08:34:20.027847
skl-80cf7f2e	Python-1e6111	python-1e6111	Programming	\N	t	2026-10-08 08:34:20.03693	2026-10-08 08:34:20.036934
skl-56b44511	Docker-1e6111	docker-1e6111	DevOps	\N	t	2026-10-08 08:34:20.041811	2026-10-08 08:34:20.041815
skl-b1ef94a6	AWS-5e3b2a	aws-5e3b2a	Cloud	\N	t	2026-10-08 08:34:20.290955	2026-10-08 08:34:20.290959
skl-92bc245c	Python-5e3b2a	python-5e3b2a	Programming	\N	t	2026-10-08 08:34:20.296121	2026-10-08 08:34:20.296125
skl-faec7797	Docker-5e3b2a	docker-5e3b2a	DevOps	\N	t	2026-10-08 08:34:20.300311	2026-10-08 08:34:20.300314
skl-6457eb2e	AWS-13bd04	aws-13bd04	Cloud	\N	t	2026-10-08 08:34:20.414822	2026-10-08 08:34:20.414827
skl-b951f62f	Python-13bd04	python-13bd04	Programming	\N	t	2026-10-08 08:34:20.435568	2026-10-08 08:34:20.435575
skl-69254c02	Docker-13bd04	docker-13bd04	DevOps	\N	t	2026-10-08 08:34:20.442477	2026-10-08 08:34:20.442482
skl-d91f59ed	AWS-a7f6b9	aws-a7f6b9	Cloud	\N	t	2026-10-08 08:34:20.552779	2026-10-08 08:34:20.552787
skl-c0704433	Python-a7f6b9	python-a7f6b9	Programming	\N	t	2026-10-08 08:34:20.571903	2026-10-08 08:34:20.57191
skl-4b50d88d	Docker-a7f6b9	docker-a7f6b9	DevOps	\N	t	2026-10-08 08:34:20.580693	2026-10-08 08:34:20.580699
skl-2a95b05b	AWS-934580	aws-934580	Cloud	\N	t	2026-10-08 08:34:20.718488	2026-10-08 08:34:20.718495
skl-9eb16c2b	Python-934580	python-934580	Programming	\N	t	2026-10-08 08:34:20.732032	2026-10-08 08:34:20.732038
skl-04c1d25f	Docker-934580	docker-934580	DevOps	\N	t	2026-10-08 08:34:20.742042	2026-10-08 08:34:20.742049
skl-a1764e1c	AWS-8757f2	aws-8757f2	Cloud	\N	t	2026-10-08 08:34:20.85732	2026-10-08 08:34:20.857326
skl-5615d6a4	Python-8757f2	python-8757f2	Programming	\N	t	2026-10-08 08:34:20.865561	2026-10-08 08:34:20.865567
skl-166cd783	Docker-8757f2	docker-8757f2	DevOps	\N	t	2026-10-08 08:34:20.871546	2026-10-08 08:34:20.871551
skl-ab514801	AWS-e20b28	aws-e20b28	Cloud	\N	t	2026-10-08 08:34:20.987337	2026-10-08 08:34:20.987346
skl-45c2d1ea	Python-e20b28	python-e20b28	Programming	\N	t	2026-10-08 08:34:20.993645	2026-10-08 08:34:20.99365
skl-161d48ac	Docker-e20b28	docker-e20b28	DevOps	\N	t	2026-10-08 08:34:20.999419	2026-10-08 08:34:20.999425
skl-1afa3347	AWS-3488bf	aws-3488bf	Cloud	\N	t	2026-10-08 08:34:21.119198	2026-10-08 08:34:21.119203
skl-91bca006	Python-3488bf	python-3488bf	Programming	\N	t	2026-10-08 08:34:21.135319	2026-10-08 08:34:21.135325
skl-d23218b7	Docker-3488bf	docker-3488bf	DevOps	\N	t	2026-10-08 08:34:21.142093	2026-10-08 08:34:21.142098
skl-e3400a28	AWS-127f3f	aws-127f3f	Cloud	\N	t	2026-10-08 08:34:21.26882	2026-10-08 08:34:21.268825
skl-ab811486	Python-127f3f	python-127f3f	Programming	\N	t	2026-10-08 08:34:21.275795	2026-10-08 08:34:21.2758
skl-fb96d4fe	Docker-127f3f	docker-127f3f	DevOps	\N	t	2026-10-08 08:34:21.282175	2026-10-08 08:34:21.28218
skl-34cf4b41	AWS-a26339	aws-a26339	Cloud	\N	t	2026-10-08 08:34:21.421109	2026-10-08 08:34:21.421115
skl-2f733fac	Python-a26339	python-a26339	Programming	\N	t	2026-10-08 08:34:21.427967	2026-10-08 08:34:21.427972
skl-7c4ff5cd	Docker-a26339	docker-a26339	DevOps	\N	t	2026-10-08 08:34:21.435205	2026-10-08 08:34:21.43521
skl-57c2656e	AWS-55832d	aws-55832d	Cloud	\N	t	2026-10-08 08:34:21.585986	2026-10-08 08:34:21.585991
skl-a8c411b4	Python-55832d	python-55832d	Programming	\N	t	2026-10-08 08:34:21.593396	2026-10-08 08:34:21.593402
skl-8d81d131	Docker-55832d	docker-55832d	DevOps	\N	t	2026-10-08 08:34:21.601483	2026-10-08 08:34:21.60149
skl-97ecd6ef	AWS-e32b0c	aws-e32b0c	Cloud	\N	t	2026-10-08 08:34:21.755733	2026-10-08 08:34:21.755739
skl-368de022	Python-e32b0c	python-e32b0c	Programming	\N	t	2026-10-08 08:34:21.762779	2026-10-08 08:34:21.762784
skl-9090d609	Docker-e32b0c	docker-e32b0c	DevOps	\N	t	2026-10-08 08:34:21.769486	2026-10-08 08:34:21.769491
skl-d233c027	AWS-4773c8	aws-4773c8	Cloud	\N	t	2026-10-08 08:34:21.938674	2026-10-08 08:34:21.938681
skl-20e27703	Python-4773c8	python-4773c8	Programming	\N	t	2026-10-08 08:34:21.949434	2026-10-08 08:34:21.949442
skl-c4215199	Docker-4773c8	docker-4773c8	DevOps	\N	t	2026-10-08 08:34:21.957373	2026-10-08 08:34:21.957381
skl-4dfbbaa2	AWS-8916c0	aws-8916c0	Cloud	\N	t	2026-10-08 08:34:22.129224	2026-10-08 08:34:22.129229
skl-416b7d63	Python-8916c0	python-8916c0	Programming	\N	t	2026-10-08 08:34:22.136121	2026-10-08 08:34:22.136126
skl-95dff62a	Docker-8916c0	docker-8916c0	DevOps	\N	t	2026-10-08 08:34:22.142207	2026-10-08 08:34:22.142211
skl-104e8586	AWS-937e17	aws-937e17	Cloud	\N	t	2026-10-08 08:34:22.307901	2026-10-08 08:34:22.307906
skl-a3cdc83c	Python-937e17	python-937e17	Programming	\N	t	2026-10-08 08:34:22.313201	2026-10-08 08:34:22.313205
skl-2edd7482	Docker-937e17	docker-937e17	DevOps	\N	t	2026-10-08 08:34:22.317698	2026-10-08 08:34:22.317702
skl-bd1fc769	Python-d7d123	python-d7d123	General Competencies	\N	t	2026-10-08 08:34:25.967756	2026-10-08 08:34:25.96776
skl-49e2b8b3	PostgreSQL-d7d123	postgresql-d7d123	General Competencies	\N	t	2026-10-08 08:34:25.980427	2026-10-08 08:34:25.980436
skl-2725d97c	Go-571ef5	go-571ef5	General Competencies	\N	t	2026-10-08 08:34:26.11968	2026-10-08 08:34:26.119686
skl-4f7a0ea3	Docker-571ef5	docker-571ef5	General Competencies	\N	t	2026-10-08 08:34:26.1328	2026-10-08 08:34:26.132806
skl-780da531	Terraform-92a07d	terraform-92a07d	General Competencies	\N	t	2026-10-08 08:34:26.274413	2026-10-08 08:34:26.274418
\.


--
-- Data for Name: submission_test_case_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submission_test_case_results (id, submission_id, test_case_id, passed, actual_output, execution_time_ms, memory_mb, error_message, is_hidden, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, organization_id, phone, job_role, experience_years, skills, education, resume_filename, resume_summary, resume_text, reset_token, reset_token_expiry, reset_token_attempts, created_at) FROM stdin;
usr-admin01	SparkX Admin	admin@sparkx.ai	$2b$12$MUTTohxQ4t9OMEx7mhMTYOKRTx.FsJOf5NfbtdhK2NuKo7k8ve0eC	recruiter	org-sparkx-default	\N	\N	0	[]	\N	\N	\N	\N	\N	\N	0	2026-09-19 15:41:12.201944
usr-cand01	Demo Candidate	candidate@sparkx.ai	c4c83d3e23a07dc17e012c45acc3828b$4f721f9bd889921ec2aecc79c27e93e8cbc1c80a7ba9e9527424ecefd09b6e17	candidate	org-sparkx-default	\N	\N	0	[]	\N	\N	\N	\N	\N	\N	0	2026-09-19 15:41:12.201959
usr-7547759d	Burhan	bkapasi472@rku.ac.in	43f7f5a9838b09ca9259cff8a0a7c30a$b3391a1cc0f17ae121d1de4072ba98b0cb5454b4c33cb70e026f6bfea2e81072	candidate	org-sparkx-default	\N	\N	0	[]	\N	\N	\N	\N	\N	\N	0	2026-09-19 16:03:22.576036
\.


--
-- Name: assessment_audit_logs assessment_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_audit_logs
    ADD CONSTRAINT assessment_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: assessment_coding_problems assessment_coding_problems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_coding_problems
    ADD CONSTRAINT assessment_coding_problems_pkey PRIMARY KEY (id);


--
-- Name: assessment_mcq_questions assessment_mcq_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_mcq_questions
    ADD CONSTRAINT assessment_mcq_questions_pkey PRIMARY KEY (id);


--
-- Name: assessment_sections assessment_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_sections
    ADD CONSTRAINT assessment_sections_pkey PRIMARY KEY (id);


--
-- Name: assessment_versions assessment_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_versions
    ADD CONSTRAINT assessment_versions_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: assistant_audit_logs assistant_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_audit_logs
    ADD CONSTRAINT assistant_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: availability_blocks availability_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_blocks
    ADD CONSTRAINT availability_blocks_pkey PRIMARY KEY (id);


--
-- Name: candidate_skills candidate_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_skills
    ADD CONSTRAINT candidate_skills_pkey PRIMARY KEY (id);


--
-- Name: candidate_state_logs candidate_state_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_state_logs
    ADD CONSTRAINT candidate_state_logs_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: coding_problem_versions coding_problem_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_problem_versions
    ADD CONSTRAINT coding_problem_versions_pkey PRIMARY KEY (id);


--
-- Name: coding_problems coding_problems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_problems
    ADD CONSTRAINT coding_problems_pkey PRIMARY KEY (id);


--
-- Name: coding_submissions coding_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_pkey PRIMARY KEY (id);


--
-- Name: coding_test_cases coding_test_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_test_cases
    ADD CONSTRAINT coding_test_cases_pkey PRIMARY KEY (id);


--
-- Name: integrity_logs integrity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrity_logs
    ADD CONSTRAINT integrity_logs_pkey PRIMARY KEY (id);


--
-- Name: interview_bookings interview_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_pkey PRIMARY KEY (id);


--
-- Name: job_skill_requirements job_skill_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skill_requirements
    ADD CONSTRAINT job_skill_requirements_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: mcq_options mcq_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_options
    ADD CONSTRAINT mcq_options_pkey PRIMARY KEY (id);


--
-- Name: mcq_questions mcq_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_questions
    ADD CONSTRAINT mcq_questions_pkey PRIMARY KEY (id);


--
-- Name: mcq_submissions mcq_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_submissions
    ADD CONSTRAINT mcq_submissions_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: question_skills question_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_skills
    ADD CONSTRAINT question_skills_pkey PRIMARY KEY (id);


--
-- Name: recruiter_availability recruiter_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_availability
    ADD CONSTRAINT recruiter_availability_pkey PRIMARY KEY (id);


--
-- Name: recruiter_invitations recruiter_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_invitations
    ADD CONSTRAINT recruiter_invitations_pkey PRIMARY KEY (id);


--
-- Name: resume_documents resume_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_documents
    ADD CONSTRAINT resume_documents_pkey PRIMARY KEY (id);


--
-- Name: resume_match_analyses resume_match_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_match_analyses
    ADD CONSTRAINT resume_match_analyses_pkey PRIMARY KEY (id);


--
-- Name: revoked_tokens revoked_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revoked_tokens
    ADD CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id);


--
-- Name: skill_aliases skill_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_aliases
    ADD CONSTRAINT skill_aliases_pkey PRIMARY KEY (id);


--
-- Name: skill_evidence skill_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_evidence
    ADD CONSTRAINT skill_evidence_pkey PRIMARY KEY (id);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: submission_test_case_results submission_test_case_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_test_case_results
    ADD CONSTRAINT submission_test_case_results_pkey PRIMARY KEY (id);


--
-- Name: assessment_coding_problems uq_assessment_coding_problem; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_coding_problems
    ADD CONSTRAINT uq_assessment_coding_problem UNIQUE (assessment_id, coding_problem_id);


--
-- Name: assessment_mcq_questions uq_assessment_mcq_question; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_mcq_questions
    ADD CONSTRAINT uq_assessment_mcq_question UNIQUE (assessment_id, mcq_question_id);


--
-- Name: assessment_versions uq_assessment_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_versions
    ADD CONSTRAINT uq_assessment_version UNIQUE (assessment_id, version_number);


--
-- Name: candidates uq_candidate_job_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT uq_candidate_job_email UNIQUE (job_id, email);


--
-- Name: candidate_skills uq_candidate_skill; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_skills
    ADD CONSTRAINT uq_candidate_skill UNIQUE (candidate_id, skill_id);


--
-- Name: coding_problems uq_coding_problem_org_slug; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_problems
    ADD CONSTRAINT uq_coding_problem_org_slug UNIQUE (organization_id, slug);


--
-- Name: job_skill_requirements uq_job_skill_requirement; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skill_requirements
    ADD CONSTRAINT uq_job_skill_requirement UNIQUE (job_id, skill_id);


--
-- Name: coding_problem_versions uq_problem_version; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_problem_versions
    ADD CONSTRAINT uq_problem_version UNIQUE (problem_id, version_number);


--
-- Name: question_skills uq_question_skill; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_skills
    ADD CONSTRAINT uq_question_skill UNIQUE (question_type, question_id, skill_id);


--
-- Name: skill_aliases uq_skill_alias; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_aliases
    ADD CONSTRAINT uq_skill_alias UNIQUE (skill_id, alias);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_assessment_audit_logs_asm_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_audit_logs_asm_created ON public.assessment_audit_logs USING btree (assessment_id, created_at);


--
-- Name: ix_assessment_audit_logs_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_audit_logs_assessment_id ON public.assessment_audit_logs USING btree (assessment_id);


--
-- Name: ix_assessment_audit_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_audit_logs_id ON public.assessment_audit_logs USING btree (id);


--
-- Name: ix_assessment_audit_logs_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_audit_logs_org ON public.assessment_audit_logs USING btree (organization_id);


--
-- Name: ix_assessment_audit_logs_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_audit_logs_organization_id ON public.assessment_audit_logs USING btree (organization_id);


--
-- Name: ix_assessment_coding_problems_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_coding_problems_assessment_id ON public.assessment_coding_problems USING btree (assessment_id);


--
-- Name: ix_assessment_coding_problems_coding_problem_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_coding_problems_coding_problem_id ON public.assessment_coding_problems USING btree (coding_problem_id);


--
-- Name: ix_assessment_coding_problems_coding_problem_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_coding_problems_coding_problem_version_id ON public.assessment_coding_problems USING btree (coding_problem_version_id);


--
-- Name: ix_assessment_coding_problems_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_coding_problems_id ON public.assessment_coding_problems USING btree (id);


--
-- Name: ix_assessment_mcq_questions_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_mcq_questions_assessment_id ON public.assessment_mcq_questions USING btree (assessment_id);


--
-- Name: ix_assessment_mcq_questions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_mcq_questions_id ON public.assessment_mcq_questions USING btree (id);


--
-- Name: ix_assessment_mcq_questions_mcq_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_mcq_questions_mcq_question_id ON public.assessment_mcq_questions USING btree (mcq_question_id);


--
-- Name: ix_assessment_sections_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_sections_assessment_id ON public.assessment_sections USING btree (assessment_id);


--
-- Name: ix_assessment_sections_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_sections_id ON public.assessment_sections USING btree (id);


--
-- Name: ix_assessment_versions_asm_ver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_versions_asm_ver ON public.assessment_versions USING btree (assessment_id, version_number);


--
-- Name: ix_assessment_versions_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_versions_assessment_id ON public.assessment_versions USING btree (assessment_id);


--
-- Name: ix_assessment_versions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessment_versions_id ON public.assessment_versions USING btree (id);


--
-- Name: ix_assessments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessments_id ON public.assessments USING btree (id);


--
-- Name: ix_assessments_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessments_is_active ON public.assessments USING btree (is_active);


--
-- Name: ix_assessments_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessments_job_id ON public.assessments USING btree (job_id);


--
-- Name: ix_assessments_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessments_organization_id ON public.assessments USING btree (organization_id);


--
-- Name: ix_assessments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assessments_status ON public.assessments USING btree (status);


--
-- Name: ix_assistant_audit_logs_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_candidate_id ON public.assistant_audit_logs USING btree (candidate_id);


--
-- Name: ix_assistant_audit_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_id ON public.assistant_audit_logs USING btree (id);


--
-- Name: ix_assistant_audit_logs_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_job_id ON public.assistant_audit_logs USING btree (job_id);


--
-- Name: ix_assistant_audit_logs_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_organization_id ON public.assistant_audit_logs USING btree (organization_id);


--
-- Name: ix_assistant_audit_logs_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_request_id ON public.assistant_audit_logs USING btree (request_id);


--
-- Name: ix_assistant_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_user_id ON public.assistant_audit_logs USING btree (user_id);


--
-- Name: ix_assistant_audit_logs_validation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assistant_audit_logs_validation_status ON public.assistant_audit_logs USING btree (validation_status);


--
-- Name: ix_availability_blocks_availability_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_availability_blocks_availability_id ON public.availability_blocks USING btree (availability_id);


--
-- Name: ix_availability_blocks_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_availability_blocks_id ON public.availability_blocks USING btree (id);


--
-- Name: ix_candidate_skills_cand_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_skills_cand_skill ON public.candidate_skills USING btree (candidate_id, skill_id);


--
-- Name: ix_candidate_skills_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_skills_candidate_id ON public.candidate_skills USING btree (candidate_id);


--
-- Name: ix_candidate_skills_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_skills_id ON public.candidate_skills USING btree (id);


--
-- Name: ix_candidate_skills_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_skills_is_verified ON public.candidate_skills USING btree (is_verified);


--
-- Name: ix_candidate_skills_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_skills_skill_id ON public.candidate_skills USING btree (skill_id);


--
-- Name: ix_candidate_skills_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_skills_verified ON public.candidate_skills USING btree (is_verified);


--
-- Name: ix_candidate_state_logs_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_state_logs_candidate_id ON public.candidate_state_logs USING btree (candidate_id);


--
-- Name: ix_candidate_state_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidate_state_logs_id ON public.candidate_state_logs USING btree (id);


--
-- Name: ix_candidates_assessment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_assessment_status ON public.candidates USING btree (assessment_status);


--
-- Name: ix_candidates_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_email ON public.candidates USING btree (email);


--
-- Name: ix_candidates_hiring_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_hiring_decision ON public.candidates USING btree (hiring_decision);


--
-- Name: ix_candidates_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_id ON public.candidates USING btree (id);


--
-- Name: ix_candidates_interview_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_interview_status ON public.candidates USING btree (interview_status);


--
-- Name: ix_candidates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_name ON public.candidates USING btree (name);


--
-- Name: ix_candidates_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_organization_id ON public.candidates USING btree (organization_id);


--
-- Name: ix_candidates_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_stage ON public.candidates USING btree (stage);


--
-- Name: ix_candidates_update_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_update_status ON public.candidates USING btree (update_status);


--
-- Name: ix_candidates_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_candidates_user_id ON public.candidates USING btree (user_id);


--
-- Name: ix_coding_problem_versions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problem_versions_id ON public.coding_problem_versions USING btree (id);


--
-- Name: ix_coding_problem_versions_problem_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problem_versions_problem_id ON public.coding_problem_versions USING btree (problem_id);


--
-- Name: ix_coding_problems_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_difficulty ON public.coding_problems USING btree (difficulty);


--
-- Name: ix_coding_problems_execution_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_execution_mode ON public.coding_problems USING btree (execution_mode);


--
-- Name: ix_coding_problems_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_id ON public.coding_problems USING btree (id);


--
-- Name: ix_coding_problems_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_is_active ON public.coding_problems USING btree (is_active);


--
-- Name: ix_coding_problems_is_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_is_system ON public.coding_problems USING btree (is_system);


--
-- Name: ix_coding_problems_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_organization_id ON public.coding_problems USING btree (organization_id);


--
-- Name: ix_coding_problems_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_slug ON public.coding_problems USING btree (slug);


--
-- Name: ix_coding_problems_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_problems_title ON public.coding_problems USING btree (title);


--
-- Name: ix_coding_submissions_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_assessment_id ON public.coding_submissions USING btree (assessment_id);


--
-- Name: ix_coding_submissions_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_candidate_id ON public.coding_submissions USING btree (candidate_id);


--
-- Name: ix_coding_submissions_coding_problem_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_coding_problem_id ON public.coding_submissions USING btree (coding_problem_id);


--
-- Name: ix_coding_submissions_coding_problem_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_coding_problem_version_id ON public.coding_submissions USING btree (coding_problem_version_id);


--
-- Name: ix_coding_submissions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_id ON public.coding_submissions USING btree (id);


--
-- Name: ix_coding_submissions_is_best_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_is_best_submission ON public.coding_submissions USING btree (is_best_submission);


--
-- Name: ix_coding_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_submissions_status ON public.coding_submissions USING btree (status);


--
-- Name: ix_coding_test_cases_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_test_cases_id ON public.coding_test_cases USING btree (id);


--
-- Name: ix_coding_test_cases_is_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_test_cases_is_hidden ON public.coding_test_cases USING btree (is_hidden);


--
-- Name: ix_coding_test_cases_problem_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_test_cases_problem_id ON public.coding_test_cases USING btree (problem_id);


--
-- Name: ix_coding_test_cases_problem_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_coding_test_cases_problem_version_id ON public.coding_test_cases USING btree (problem_version_id);


--
-- Name: ix_integrity_logs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_integrity_logs_id ON public.integrity_logs USING btree (id);


--
-- Name: ix_interview_bookings_availability_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_availability_id ON public.interview_bookings USING btree (availability_id);


--
-- Name: ix_interview_bookings_cand_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_cand_status ON public.interview_bookings USING btree (candidate_id, status);


--
-- Name: ix_interview_bookings_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_candidate_id ON public.interview_bookings USING btree (candidate_id);


--
-- Name: ix_interview_bookings_end_time_utc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_end_time_utc ON public.interview_bookings USING btree (end_time_utc);


--
-- Name: ix_interview_bookings_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_id ON public.interview_bookings USING btree (id);


--
-- Name: ix_interview_bookings_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_job_id ON public.interview_bookings USING btree (job_id);


--
-- Name: ix_interview_bookings_org_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_org_slot ON public.interview_bookings USING btree (organization_id, start_time_utc, status);


--
-- Name: ix_interview_bookings_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_organization_id ON public.interview_bookings USING btree (organization_id);


--
-- Name: ix_interview_bookings_recruiter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_recruiter_id ON public.interview_bookings USING btree (recruiter_id);


--
-- Name: ix_interview_bookings_start_time_utc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_start_time_utc ON public.interview_bookings USING btree (start_time_utc);


--
-- Name: ix_interview_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_interview_bookings_status ON public.interview_bookings USING btree (status);


--
-- Name: ix_job_skill_requirements_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_skill_requirements_id ON public.job_skill_requirements USING btree (id);


--
-- Name: ix_job_skill_requirements_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_skill_requirements_job_id ON public.job_skill_requirements USING btree (job_id);


--
-- Name: ix_job_skill_requirements_job_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_skill_requirements_job_skill ON public.job_skill_requirements USING btree (job_id, skill_id);


--
-- Name: ix_job_skill_requirements_requirement_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_skill_requirements_requirement_type ON public.job_skill_requirements USING btree (requirement_type);


--
-- Name: ix_job_skill_requirements_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_skill_requirements_skill_id ON public.job_skill_requirements USING btree (skill_id);


--
-- Name: ix_job_skill_requirements_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_job_skill_requirements_type ON public.job_skill_requirements USING btree (requirement_type);


--
-- Name: ix_jobs_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_id ON public.jobs USING btree (id);


--
-- Name: ix_jobs_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_organization_id ON public.jobs USING btree (organization_id);


--
-- Name: ix_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_status ON public.jobs USING btree (status);


--
-- Name: ix_jobs_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_jobs_title ON public.jobs USING btree (title);


--
-- Name: ix_mcq_options_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_options_id ON public.mcq_options USING btree (id);


--
-- Name: ix_mcq_options_is_correct; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_options_is_correct ON public.mcq_options USING btree (is_correct);


--
-- Name: ix_mcq_options_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_options_question_id ON public.mcq_options USING btree (question_id);


--
-- Name: ix_mcq_questions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_questions_category ON public.mcq_questions USING btree (category);


--
-- Name: ix_mcq_questions_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_questions_difficulty ON public.mcq_questions USING btree (difficulty);


--
-- Name: ix_mcq_questions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_questions_id ON public.mcq_questions USING btree (id);


--
-- Name: ix_mcq_questions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_questions_is_active ON public.mcq_questions USING btree (is_active);


--
-- Name: ix_mcq_questions_is_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_questions_is_system ON public.mcq_questions USING btree (is_system);


--
-- Name: ix_mcq_questions_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_questions_organization_id ON public.mcq_questions USING btree (organization_id);


--
-- Name: ix_mcq_submissions_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_submissions_assessment_id ON public.mcq_submissions USING btree (assessment_id);


--
-- Name: ix_mcq_submissions_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_submissions_candidate_id ON public.mcq_submissions USING btree (candidate_id);


--
-- Name: ix_mcq_submissions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_submissions_id ON public.mcq_submissions USING btree (id);


--
-- Name: ix_mcq_submissions_mcq_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mcq_submissions_mcq_question_id ON public.mcq_submissions USING btree (mcq_question_id);


--
-- Name: ix_organizations_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organizations_domain ON public.organizations USING btree (domain);


--
-- Name: ix_organizations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organizations_id ON public.organizations USING btree (id);


--
-- Name: ix_organizations_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_organizations_slug ON public.organizations USING btree (slug);


--
-- Name: ix_question_skills_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_question_skills_id ON public.question_skills USING btree (id);


--
-- Name: ix_question_skills_q; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_question_skills_q ON public.question_skills USING btree (question_type, question_id);


--
-- Name: ix_question_skills_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_question_skills_question_id ON public.question_skills USING btree (question_id);


--
-- Name: ix_question_skills_question_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_question_skills_question_type ON public.question_skills USING btree (question_type);


--
-- Name: ix_question_skills_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_question_skills_skill ON public.question_skills USING btree (skill_id);


--
-- Name: ix_question_skills_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_question_skills_skill_id ON public.question_skills USING btree (skill_id);


--
-- Name: ix_recruiter_availability_available_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_availability_available_date ON public.recruiter_availability USING btree (available_date);


--
-- Name: ix_recruiter_availability_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_availability_id ON public.recruiter_availability USING btree (id);


--
-- Name: ix_recruiter_availability_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_availability_is_active ON public.recruiter_availability USING btree (is_active);


--
-- Name: ix_recruiter_availability_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_availability_job_id ON public.recruiter_availability USING btree (job_id);


--
-- Name: ix_recruiter_availability_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_availability_organization_id ON public.recruiter_availability USING btree (organization_id);


--
-- Name: ix_recruiter_availability_recruiter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_availability_recruiter_id ON public.recruiter_availability USING btree (recruiter_id);


--
-- Name: ix_recruiter_invitations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_recruiter_invitations_id ON public.recruiter_invitations USING btree (id);


--
-- Name: ix_recruiter_invitations_invite_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_recruiter_invitations_invite_code ON public.recruiter_invitations USING btree (invite_code);


--
-- Name: ix_resume_documents_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_documents_id ON public.resume_documents USING btree (id);


--
-- Name: ix_resume_documents_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_documents_organization_id ON public.resume_documents USING btree (organization_id);


--
-- Name: ix_resume_documents_target_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_documents_target_job_id ON public.resume_documents USING btree (target_job_id);


--
-- Name: ix_resume_documents_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_documents_user_id ON public.resume_documents USING btree (user_id);


--
-- Name: ix_resume_match_analyses_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_match_analyses_id ON public.resume_match_analyses USING btree (id);


--
-- Name: ix_resume_match_analyses_job_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_match_analyses_job_id ON public.resume_match_analyses USING btree (job_id);


--
-- Name: ix_resume_match_analyses_resume_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_match_analyses_resume_id ON public.resume_match_analyses USING btree (resume_id);


--
-- Name: ix_resume_match_analyses_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_match_analyses_user_id ON public.resume_match_analyses USING btree (user_id);


--
-- Name: ix_resume_match_resume_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_match_resume_job ON public.resume_match_analyses USING btree (resume_id, job_id);


--
-- Name: ix_resume_match_user_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_resume_match_user_job ON public.resume_match_analyses USING btree (user_id, job_id);


--
-- Name: ix_revoked_tokens_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_revoked_tokens_id ON public.revoked_tokens USING btree (id);


--
-- Name: ix_revoked_tokens_token_jti; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_revoked_tokens_token_jti ON public.revoked_tokens USING btree (token_jti);


--
-- Name: ix_skill_aliases_alias; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_aliases_alias ON public.skill_aliases USING btree (alias);


--
-- Name: ix_skill_aliases_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_aliases_id ON public.skill_aliases USING btree (id);


--
-- Name: ix_skill_aliases_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_aliases_skill_id ON public.skill_aliases USING btree (skill_id);


--
-- Name: ix_skill_evidence_cand_skill; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_evidence_cand_skill ON public.skill_evidence USING btree (candidate_skill_id);


--
-- Name: ix_skill_evidence_candidate_skill_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_evidence_candidate_skill_id ON public.skill_evidence USING btree (candidate_skill_id);


--
-- Name: ix_skill_evidence_evidence_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_evidence_evidence_type ON public.skill_evidence USING btree (evidence_type);


--
-- Name: ix_skill_evidence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_evidence_id ON public.skill_evidence USING btree (id);


--
-- Name: ix_skill_evidence_reference_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_evidence_reference_id ON public.skill_evidence USING btree (reference_id);


--
-- Name: ix_skill_evidence_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skill_evidence_type ON public.skill_evidence USING btree (evidence_type);


--
-- Name: ix_skills_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skills_category ON public.skills USING btree (category);


--
-- Name: ix_skills_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skills_id ON public.skills USING btree (id);


--
-- Name: ix_skills_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skills_is_active ON public.skills USING btree (is_active);


--
-- Name: ix_skills_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_skills_name ON public.skills USING btree (name);


--
-- Name: ix_skills_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_skills_slug ON public.skills USING btree (slug);


--
-- Name: ix_submission_test_case_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_submission_test_case_results_id ON public.submission_test_case_results USING btree (id);


--
-- Name: ix_submission_test_case_results_is_hidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_submission_test_case_results_is_hidden ON public.submission_test_case_results USING btree (is_hidden);


--
-- Name: ix_submission_test_case_results_submission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_submission_test_case_results_submission_id ON public.submission_test_case_results USING btree (submission_id);


--
-- Name: ix_submission_test_case_results_test_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_submission_test_case_results_test_case_id ON public.submission_test_case_results USING btree (test_case_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_organization_id ON public.users USING btree (organization_id);


--
-- Name: assessment_audit_logs assessment_audit_logs_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_audit_logs
    ADD CONSTRAINT assessment_audit_logs_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessment_coding_problems assessment_coding_problems_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_coding_problems
    ADD CONSTRAINT assessment_coding_problems_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);


--
-- Name: assessment_coding_problems assessment_coding_problems_coding_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_coding_problems
    ADD CONSTRAINT assessment_coding_problems_coding_problem_id_fkey FOREIGN KEY (coding_problem_id) REFERENCES public.coding_problems(id);


--
-- Name: assessment_coding_problems assessment_coding_problems_coding_problem_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_coding_problems
    ADD CONSTRAINT assessment_coding_problems_coding_problem_version_id_fkey FOREIGN KEY (coding_problem_version_id) REFERENCES public.coding_problem_versions(id);


--
-- Name: assessment_mcq_questions assessment_mcq_questions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_mcq_questions
    ADD CONSTRAINT assessment_mcq_questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);


--
-- Name: assessment_mcq_questions assessment_mcq_questions_mcq_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_mcq_questions
    ADD CONSTRAINT assessment_mcq_questions_mcq_question_id_fkey FOREIGN KEY (mcq_question_id) REFERENCES public.mcq_questions(id);


--
-- Name: assessment_sections assessment_sections_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_sections
    ADD CONSTRAINT assessment_sections_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);


--
-- Name: assessment_versions assessment_versions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_versions
    ADD CONSTRAINT assessment_versions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessments assessments_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: assessments assessments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: assistant_audit_logs assistant_audit_logs_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_audit_logs
    ADD CONSTRAINT assistant_audit_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: assistant_audit_logs assistant_audit_logs_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_audit_logs
    ADD CONSTRAINT assistant_audit_logs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: assistant_audit_logs assistant_audit_logs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_audit_logs
    ADD CONSTRAINT assistant_audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: assistant_audit_logs assistant_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_audit_logs
    ADD CONSTRAINT assistant_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: availability_blocks availability_blocks_availability_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.availability_blocks
    ADD CONSTRAINT availability_blocks_availability_id_fkey FOREIGN KEY (availability_id) REFERENCES public.recruiter_availability(id) ON DELETE CASCADE;


--
-- Name: candidate_skills candidate_skills_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_skills
    ADD CONSTRAINT candidate_skills_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_skills candidate_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_skills
    ADD CONSTRAINT candidate_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: candidate_state_logs candidate_state_logs_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_state_logs
    ADD CONSTRAINT candidate_state_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id);


--
-- Name: candidates candidates_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: candidates candidates_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: candidates candidates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: coding_problem_versions coding_problem_versions_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_problem_versions
    ADD CONSTRAINT coding_problem_versions_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.coding_problems(id);


--
-- Name: coding_problems coding_problems_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_problems
    ADD CONSTRAINT coding_problems_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: coding_submissions coding_submissions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);


--
-- Name: coding_submissions coding_submissions_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id);


--
-- Name: coding_submissions coding_submissions_coding_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_coding_problem_id_fkey FOREIGN KEY (coding_problem_id) REFERENCES public.coding_problems(id);


--
-- Name: coding_submissions coding_submissions_coding_problem_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_submissions
    ADD CONSTRAINT coding_submissions_coding_problem_version_id_fkey FOREIGN KEY (coding_problem_version_id) REFERENCES public.coding_problem_versions(id);


--
-- Name: coding_test_cases coding_test_cases_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_test_cases
    ADD CONSTRAINT coding_test_cases_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.coding_problems(id);


--
-- Name: coding_test_cases coding_test_cases_problem_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coding_test_cases
    ADD CONSTRAINT coding_test_cases_problem_version_id_fkey FOREIGN KEY (problem_version_id) REFERENCES public.coding_problem_versions(id);


--
-- Name: integrity_logs integrity_logs_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrity_logs
    ADD CONSTRAINT integrity_logs_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id);


--
-- Name: interview_bookings interview_bookings_availability_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_availability_id_fkey FOREIGN KEY (availability_id) REFERENCES public.recruiter_availability(id) ON DELETE SET NULL;


--
-- Name: interview_bookings interview_bookings_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: interview_bookings interview_bookings_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: interview_bookings interview_bookings_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: interview_bookings interview_bookings_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: interview_bookings interview_bookings_rescheduled_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_bookings
    ADD CONSTRAINT interview_bookings_rescheduled_from_id_fkey FOREIGN KEY (rescheduled_from_id) REFERENCES public.interview_bookings(id) ON DELETE SET NULL;


--
-- Name: job_skill_requirements job_skill_requirements_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skill_requirements
    ADD CONSTRAINT job_skill_requirements_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: job_skill_requirements job_skill_requirements_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_skill_requirements
    ADD CONSTRAINT job_skill_requirements_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: mcq_options mcq_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_options
    ADD CONSTRAINT mcq_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.mcq_questions(id);


--
-- Name: mcq_questions mcq_questions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_questions
    ADD CONSTRAINT mcq_questions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: mcq_submissions mcq_submissions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_submissions
    ADD CONSTRAINT mcq_submissions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id);


--
-- Name: mcq_submissions mcq_submissions_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_submissions
    ADD CONSTRAINT mcq_submissions_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id);


--
-- Name: mcq_submissions mcq_submissions_mcq_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mcq_submissions
    ADD CONSTRAINT mcq_submissions_mcq_question_id_fkey FOREIGN KEY (mcq_question_id) REFERENCES public.mcq_questions(id);


--
-- Name: question_skills question_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_skills
    ADD CONSTRAINT question_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: recruiter_availability recruiter_availability_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_availability
    ADD CONSTRAINT recruiter_availability_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: recruiter_availability recruiter_availability_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_availability
    ADD CONSTRAINT recruiter_availability_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: recruiter_availability recruiter_availability_recruiter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruiter_availability
    ADD CONSTRAINT recruiter_availability_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resume_documents resume_documents_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_documents
    ADD CONSTRAINT resume_documents_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: resume_documents resume_documents_parent_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_documents
    ADD CONSTRAINT resume_documents_parent_resume_id_fkey FOREIGN KEY (parent_resume_id) REFERENCES public.resume_documents(id) ON DELETE SET NULL;


--
-- Name: resume_documents resume_documents_target_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_documents
    ADD CONSTRAINT resume_documents_target_job_id_fkey FOREIGN KEY (target_job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;


--
-- Name: resume_documents resume_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_documents
    ADD CONSTRAINT resume_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resume_match_analyses resume_match_analyses_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_match_analyses
    ADD CONSTRAINT resume_match_analyses_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;


--
-- Name: resume_match_analyses resume_match_analyses_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_match_analyses
    ADD CONSTRAINT resume_match_analyses_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resume_documents(id) ON DELETE CASCADE;


--
-- Name: resume_match_analyses resume_match_analyses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resume_match_analyses
    ADD CONSTRAINT resume_match_analyses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skill_aliases skill_aliases_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_aliases
    ADD CONSTRAINT skill_aliases_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: skill_evidence skill_evidence_candidate_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_evidence
    ADD CONSTRAINT skill_evidence_candidate_skill_id_fkey FOREIGN KEY (candidate_skill_id) REFERENCES public.candidate_skills(id) ON DELETE CASCADE;


--
-- Name: submission_test_case_results submission_test_case_results_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_test_case_results
    ADD CONSTRAINT submission_test_case_results_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.coding_submissions(id);


--
-- Name: submission_test_case_results submission_test_case_results_test_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_test_case_results
    ADD CONSTRAINT submission_test_case_results_test_case_id_fkey FOREIGN KEY (test_case_id) REFERENCES public.coding_test_cases(id);


--
-- Name: users users_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict NVUZBlQYABwyLz2gf5tNxRMoJDIZsMUjarfs2hDhWiH50UNH3dllgtjMHbLC1mm

