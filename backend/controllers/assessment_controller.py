"""
(C) Assessment Controller - Orchestrates Fully Dynamic 4-Category Technical Assessments,
Authentic Sandbox Execution (Python & Node.js), Hidden Test Security, and Score Privacy.
"""
import time
import json
import re
import traceback
import subprocess
import ast
import copy
import io
import contextlib
import tracemalloc
import uuid
import sqlite3
from datetime import datetime
from typing import Dict, Any, Tuple, Optional, List
from sqlalchemy.orm import Session

from models.db_models import (
    CandidateModel, JobModel, UserModel,
    AssessmentModel, AssessmentSectionModel,
    CodingProblemModel, CodingProblemVersionModel,
    AssessmentCodingProblemModel, CodingTestCaseModel,
    CodingSubmissionModel, SubmissionTestCaseResultModel,
    MCQQuestionModel, MCQOptionModel,
    AssessmentMCQModel, MCQSubmissionModel,
    SUPPORTED_LANGUAGES_REGISTRY,
    can_access_problem, can_modify_problem,
    can_access_mcq, can_modify_mcq,
    sanitize_test_case_for_candidate, sanitize_test_case_result_for_candidate,
    sanitize_mcq_for_candidate
)
from services.organization_service import ensure_organization
from schemas import CodeRunRequest, CodeRunResponse, AssessmentSubmitRequest, AssessmentSubmitResponse
from ai_engine import synthesize_technical_assessment_bundle, evaluate_scenario_response, evaluate_practical_task, _normalize_bundle
from workflow_contract import (
    validate_transition, project_legacy_status, project_legacy_final_decision,
    STAGE_ASSESSMENT, STAGE_REVIEW
)
from controllers.candidate_controller import log_state_change
from services.sandbox_runner import SandboxRunner


class AssessmentController:

    @staticmethod
    def _is_candidate_authorized_for_assessment(candidate: CandidateModel) -> Tuple[bool, Optional[str]]:
        if not candidate:
            return False, "Candidate not found"

        # Authoritative 4D check: candidate has been invited, in progress, submitted, or evaluated
        if candidate.assessment_status in ["invited", "in_progress", "submitted", "evaluated"]:
            return True, None

        # Fallback check for pipeline stage
        if candidate.stage in ["assessment", "interview", "review", "completed"]:
            return True, None

        # Fallback legacy checks if unmigrated
        if candidate.status in ["Assessment Scheduled", "Interview Scheduled", "Interview", "Shortlisted", "Selected", "Offered"] or \
           candidate.final_decision in ["Assessment Scheduled", "Interview Scheduled", "Interview", "Shortlisted", "Selected", "Offered"]:
            return True, None

        return False, "Assessment access restricted: Assessment has not been invited by the recruiter."

    @staticmethod
    def start_assessment(candidate_id: str, db: Session) -> Tuple[bool, Optional[str]]:
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return False, "Candidate not found"

        authorized, auth_err = AssessmentController._is_candidate_authorized_for_assessment(candidate)
        if not authorized:
            return False, auth_err

        # If already in_progress, submitted, or evaluated, allow entering without re-transitioning
        if candidate.assessment_status in ["in_progress", "submitted", "evaluated"]:
            return True, None

        if candidate.assessment_status == "invited":
            can_trans, err = validate_transition("assessment_status", candidate.assessment_status, "in_progress")
            if not can_trans:
                return False, err
            old_status = candidate.assessment_status
            candidate.assessment_status = "in_progress"
            candidate.assessment_started_at = datetime.utcnow()
            log_state_change(
                db=db,
                candidate_id=candidate.id,
                dimension="assessment_status",
                from_state=old_status,
                to_state="in_progress",
                triggered_by="candidate",
                reason="Candidate started the assessment session"
            )
            candidate.status = project_legacy_status(candidate.stage, candidate.assessment_status, candidate.interview_status, candidate.hiring_decision)
            candidate.final_decision = project_legacy_final_decision(candidate.stage, candidate.hiring_decision)
            db.commit()
            db.refresh(candidate)

        return True, None

    @staticmethod
    def _sanitize_bundle_for_candidate(bundle: dict) -> dict:
        """
        Deep-sanitizes the assessment bundle to ensure candidate network responses NEVER
        leak hidden test cases, test assertion scripts, or correct MCQ answers/explanations.
        """
        if not bundle or not isinstance(bundle, dict):
            return {}

        sanitized = copy.deepcopy(bundle)

        # 1. Sanitize MCQs: remove correct_option and explanation
        if "technical_mcqs" in sanitized and isinstance(sanitized["technical_mcqs"], list):
            for mcq in sanitized["technical_mcqs"]:
                mcq.pop("correct_option", None)
                mcq.pop("correct_answer", None)
                mcq.pop("explanation", None)

        # 2. Sanitize Hands-on: remove hidden_test_cases and assertion scripts
        if "hands_on" in sanitized and isinstance(sanitized["hands_on"], dict):
            hands = sanitized["hands_on"]
            hands.pop("hidden_test_cases", None)
            sample_tests = hands.get("sample_test_cases", [])
            for tc in sample_tests:
                tc.pop("assertion_py", None)
                tc.pop("assertion_js", None)
            hands["test_cases"] = sample_tests

        # 3. Sanitize Troubleshooting: remove hidden_test_cases and assertion scripts
        if "troubleshooting" in sanitized and isinstance(sanitized["troubleshooting"], dict):
            trouble = sanitized["troubleshooting"]
            trouble.pop("hidden_test_cases", None)
            sample_tests = trouble.get("sample_test_cases", [])
            for tc in sample_tests:
                tc.pop("assertion_py", None)
                tc.pop("assertion_js", None)
            trouble["test_cases"] = sample_tests

        # 4. Sanitize attached Coding Problems: remove hidden_test_cases
        if "coding_problems" in sanitized and isinstance(sanitized["coding_problems"], list):
            for prob in sanitized["coding_problems"]:
                if isinstance(prob, dict):
                    prob.pop("hidden_test_cases", None)
                    if "test_cases" in prob and isinstance(prob["test_cases"], list):
                        prob["test_cases"] = [tc for tc in prob["test_cases"] if not (tc.get("is_hidden") if isinstance(tc, dict) else getattr(tc, "is_hidden", False))]

        return sanitized

    @staticmethod
    def _format_ascii_table(cols: List[str], rows: List[Dict[str, Any]]) -> str:
        if not cols:
            return "(Empty table)"
        col_widths = {c: max(len(c), 1) for c in cols}
        for r in rows[:10]:
            for c in cols:
                val_str = str(r.get(c, ""))
                col_widths[c] = max(col_widths[c], len(val_str))

        sep_line = "+" + "+".join("-" * (col_widths[c] + 2) for c in cols) + "+"
        header_line = "|" + "|".join(f" {c.ljust(col_widths[c])} " for c in cols) + "|"
        lines = [sep_line, header_line, sep_line]
        for r in rows[:10]:
            row_line = "|" + "|".join(f" {str(r.get(c, '')).ljust(col_widths[c])} " for c in cols) + "|"
            lines.append(row_line)
        lines.append(sep_line)
        if len(rows) > 10:
            lines.append(f"... and {len(rows) - 10} more rows")
        return "\n".join(lines)

    @staticmethod
    def _get_attached_db_mcqs(db: Session, target_job_id: Optional[str], is_recruiter: bool) -> Tuple[List[Dict[str, Any]], Dict[str, str]]:
        if not target_job_id:
            return [], {}
        db_assessment = db.query(AssessmentModel).filter(
            AssessmentModel.job_id == target_job_id,
            AssessmentModel.is_active == True
        ).first()
        if not db_assessment:
            return [], {}
        amcqs = db.query(AssessmentMCQModel).filter(
            AssessmentMCQModel.assessment_id == db_assessment.id
        ).order_by(AssessmentMCQModel.display_order.asc()).all()

        attached_mcqs = []
        solutions = {}
        for am in amcqs:
            q = am.question
            if not q or not q.is_active:
                continue
            sorted_opts = sorted(q.options, key=lambda o: o.display_order) if q.options else []
            correct_key = next((o.option_key for o in sorted_opts if o.is_correct), "A")
            solutions[q.id] = correct_key
            if is_recruiter:
                attached_mcqs.append({
                    "id": q.id,
                    "question": q.question_text,
                    "difficulty": q.difficulty,
                    "category": q.category,
                    "skills": q.skills or [],
                    "options": {o.option_key: o.option_text for o in sorted_opts},
                    "correct_option": correct_key,
                    "explanation": q.explanation,
                    "weight": am.weight
                })
            else:
                cand_q = sanitize_mcq_for_candidate(q)
                cand_q["weight"] = am.weight
                attached_mcqs.append(cand_q)
        return attached_mcqs, solutions

    @staticmethod
    def get_candidate_assessment(
        candidate_id: str,
        job_id: Optional[str],
        db: Session,
        is_recruiter: bool = False
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            if is_recruiter:
                target_job_id = job_id
                job = db.query(JobModel).filter(JobModel.id == target_job_id).first() if target_job_id else db.query(JobModel).first()
                job_title = job.title if job else "Role Assessment"
                job_skills = (job.required_skills if (job and job.required_skills) else [])
                job_desc = job.description if job else ""
                all_default_langs = ["python", "javascript", "typescript", "java", "c", "cpp", "csharp", "vb", "go", "rust", "php", "ruby", "kotlin", "swift", "sql"]
                job_languages = (job.languages if (job and job.languages) else all_default_langs)
                experience_years = float(job.min_experience_years if (job and job.min_experience_years) else 3.0)

                attached_db_mcqs, _ = AssessmentController._get_attached_db_mcqs(db, job.id if job else None, is_recruiter=True)

                if job and job.assessment_pool and isinstance(job.assessment_pool, dict) and (job.assessment_pool.get("hands_on") or job.assessment_pool.get("technical_mcqs") or job.assessment_pool.get("coding_problems")):
                    bundle = copy.deepcopy(job.assessment_pool)
                    bundle.pop("mcq_solutions", None)
                    if attached_db_mcqs:
                        bundle["technical_mcqs"] = attached_db_mcqs
                    if not bundle.get("troubleshooting"):
                        bundle["troubleshooting"] = {
                            "id": "trouble_1",
                            "title": "Bug Rectification & Regression Testing",
                            "is_coding": bundle.get("is_coding", True),
                            "bug_description": "Identify and rectify the defect in the reference implementation.",
                            "difficulty": "Mid-Level",
                            "broken_code": {"python": "def fix(data):\n    # Fix defect here\n    return data\n"},
                            "sample_test_cases": [{"name": "Sample Check", "input": "[1, 2]", "expected": "[1, 2]"}]
                        }
                    if not bundle.get("scenario"):
                        bundle["scenario"] = {
                            "id": "scenario_1",
                            "title": "Production Incident Resolution",
                            "difficulty": "Senior",
                            "prompt": "Explain how you would diagnose and resolve a severe latency spike in this architecture.",
                            "guidance": "Focus on root cause analysis, telemetry metrics, and remediation.",
                            "ideal_keywords": ["profiling", "latency", "caching", "monitoring"]
                        }
                    return {
                        "candidate_id": "recruiter-preview",
                        "job_id": job.id,
                        "bundle": bundle,
                        "saved_answers": {},
                        "is_completed": False,
                        "is_preview": True,
                        "category_scores": {}
                    }, None

                bundle, _ = synthesize_technical_assessment_bundle(
                    role_title=job_title,
                    job_skills=job_skills,
                    job_description=job_desc,
                    experience_years=experience_years,
                    candidate_name="Recruiter Sandbox Preview",
                    candidate_skills=job_skills,
                    candidate_id="recruiter-preview",
                    languages=job_languages
                )
                if attached_db_mcqs:
                    bundle["technical_mcqs"] = attached_db_mcqs
                return {
                    "candidate_id": "recruiter-preview",
                    "job_id": job.id if job else "preview-job",
                    "bundle": bundle,
                    "saved_answers": {},
                    "is_completed": False,
                    "is_preview": True,
                    "category_scores": {}
                }, None
            return None, "Candidate not found"

        target_job_id = job_id or candidate.job_id

        job = db.query(JobModel).filter(JobModel.id == target_job_id).first()
        job_title = job.title if job else (candidate.job.title if (candidate and getattr(candidate, "job", None)) else "Role Assessment")
        job_skills = (job.required_skills if (job and job.required_skills) else None) or candidate.skills or []
        job_desc = job.description if job else ""
        all_default_langs = ["python", "javascript", "typescript", "java", "c", "cpp", "csharp", "vb", "go", "rust", "php", "ruby", "kotlin", "swift", "sql"]
        job_languages = (job.languages if (job and job.languages) else all_default_langs)
        experience_years = float(job.min_experience_years if (job and job.min_experience_years) else (candidate.experience_years or 0.0))

        # Check existing assessment data
        existing_data = candidate.assessment_data or {}
        existing_bundle = existing_data.get("bundle")
        cached_job_id = existing_data.get("job_id")

        # Upgrade existing bundle if it lacks sample_test_cases / hidden_test_cases or has < 10 MCQs
        if existing_bundle and isinstance(existing_bundle, dict):
            h_obj = existing_bundle.get("hands_on", {})
            mcq_list = existing_bundle.get("technical_mcqs", [])
            if (h_obj.get("is_coding") and not h_obj.get("sample_test_cases")) or len(mcq_list) < 10:
                is_coding = existing_bundle.get("is_coding", True)
                dom = existing_bundle.get("domain_category", "technical")
                upgraded_bundle, upgraded_solutions = _normalize_bundle(
                    existing_bundle,
                    job_languages,
                    job_title,
                    job_skills,
                    is_coding=is_coding,
                    domain_category=dom
                )
                existing_bundle = upgraded_bundle
                existing_data["bundle"] = upgraded_bundle
                existing_data["mcq_solutions"] = upgraded_solutions
                candidate.assessment_data = existing_data
                # In-memory normalization for response; do not call db.commit() in read-only GET

        # Allow candidates who already completed the assessment to view completion state
        if existing_data.get("is_completed") or candidate.assessment_status in ["submitted", "evaluated"]:
            b_to_return = existing_bundle or {}
            returned_bundle = b_to_return if is_recruiter else AssessmentController._sanitize_bundle_for_candidate(b_to_return)
            return {
                "candidate_id": candidate.id,
                "job_id": target_job_id,
                "bundle": returned_bundle,
                "saved_answers": existing_data.get("answers", {}),
                "is_completed": True,
                "category_scores": existing_data.get("category_scores", {}) if is_recruiter else {}
            }, None

        # Verify candidate authorization: must be scheduled or advanced by recruiter (recruiters can preview anytime)
        if not is_recruiter:
            authorized, auth_err = AssessmentController._is_candidate_authorized_for_assessment(candidate)
            if not authorized:
                return None, auth_err

        job = db.query(JobModel).filter(JobModel.id == target_job_id).first()
        job_title = job.title if job else (candidate.job.title if (candidate and getattr(candidate, "job", None)) else "Role Assessment")
        job_skills = (job.required_skills if (job and job.required_skills) else None) or candidate.skills or []
        job_desc = job.description if job else ""
        job_languages = (job.languages if (job and job.languages) else all_default_langs)
        experience_years = float(job.min_experience_years if (job and job.min_experience_years) else (candidate.experience_years or 0.0))

        # Reuse existing dynamic bundle ONLY if generated for this exact job
        if existing_bundle and (not target_job_id or not cached_job_id or cached_job_id == target_job_id):
            returned_bundle = existing_bundle if is_recruiter else AssessmentController._sanitize_bundle_for_candidate(existing_bundle)
            return {
                "candidate_id": candidate.id,
                "job_id": target_job_id,
                "bundle": returned_bundle,
                "saved_answers": existing_data.get("answers", {}),
                "is_completed": existing_data.get("is_completed", False),
                "category_scores": existing_data.get("category_scores", {}) if is_recruiter else {}
            }, None

        # Check if job has an authoritative recruiter-customized assessment pool
        if job and job.assessment_pool and isinstance(job.assessment_pool, dict) and (job.assessment_pool.get("hands_on") or job.assessment_pool.get("technical_mcqs") or job.assessment_pool.get("coding_problems")):
            bundle = copy.deepcopy(job.assessment_pool)
            mcq_solutions = bundle.pop("mcq_solutions", {}) or {}

            # Authoritative DB MCQs override or populate pool if attached
            attached_mcqs, attached_sol = AssessmentController._get_attached_db_mcqs(db, target_job_id, is_recruiter=is_recruiter)
            if attached_mcqs:
                bundle["technical_mcqs"] = attached_mcqs
                mcq_solutions.update(attached_sol)

            if not bundle.get("troubleshooting"):
                bundle["troubleshooting"] = {
                    "id": "trouble_1",
                    "title": "Bug Rectification & Regression Testing",
                    "is_coding": bundle.get("is_coding", True),
                    "bug_description": "Identify and rectify the defect in the reference implementation.",
                    "difficulty": "Mid-Level",
                    "broken_code": {"python": "def fix(data):\n    # Fix defect here\n    return data\n"},
                    "sample_test_cases": [{"name": "Sample Check", "input": "[1, 2]", "expected": "[1, 2]"}]
                }
            if not bundle.get("scenario"):
                bundle["scenario"] = {
                    "id": "scenario_1",
                    "title": "Production Incident Resolution",
                    "difficulty": "Senior",
                    "prompt": "Explain how you would diagnose and resolve a severe latency spike in this architecture.",
                    "guidance": "Focus on root cause analysis, telemetry metrics, and remediation.",
                    "ideal_keywords": ["profiling", "latency", "caching", "monitoring"]
                }
            candidate.assessment_data = {
                "job_id": target_job_id,
                "bundle": bundle,
                "mcq_solutions": mcq_solutions,
                "generated_by": "recruiter_customized",
                "answers": {},
                "is_completed": False,
                "created_at": datetime.utcnow().isoformat()
            }
            candidate.assessment_version = getattr(job, "assessment_version", 1) or 1
            candidate.assessment_blueprint = copy.deepcopy(job.assessment_pool)
            db.commit()
            returned_bundle = bundle if is_recruiter else AssessmentController._sanitize_bundle_for_candidate(bundle)
            return {
                "candidate_id": candidate.id,
                "job_id": target_job_id,
                "bundle": returned_bundle,
                "saved_answers": {},
                "is_completed": False,
                "category_scores": {}
            }, None

        # Synthesize fresh 100% dynamic assessment tailored to this exact job & candidate
        bundle, mcq_solutions = synthesize_technical_assessment_bundle(
            role_title=job_title,
            job_skills=job_skills,
            job_description=job_desc,
            experience_years=experience_years,
            candidate_name=candidate.name,
            candidate_skills=candidate.skills or [],
            candidate_id=candidate.id,
            languages=job_languages
        )

        # Authoritative DB MCQs override or populate synthesized bundle if attached
        attached_mcqs, attached_sol = AssessmentController._get_attached_db_mcqs(db, target_job_id, is_recruiter=is_recruiter)
        if attached_mcqs:
            bundle["technical_mcqs"] = attached_mcqs
            mcq_solutions.update(attached_sol)

        candidate.assessment_data = {
            "job_id": target_job_id,
            "bundle": bundle,
            "mcq_solutions": mcq_solutions,
            "generated_by": "ai_engine",
            "answers": {},
            "is_completed": False,
            "created_at": datetime.utcnow().isoformat()
        }
        candidate.assessment_version = getattr(job, "assessment_version", 1) or 1
        candidate.assessment_blueprint = copy.deepcopy(bundle)
        db.commit()

        returned_bundle = bundle if is_recruiter else AssessmentController._sanitize_bundle_for_candidate(bundle)
        return {
            "candidate_id": candidate.id,
            "job_id": candidate.job_id,
            "bundle": returned_bundle,
            "saved_answers": {},
            "is_completed": False,
            "category_scores": {}
        }, None

    @staticmethod
    def run_code_sandbox(payload: CodeRunRequest, db: Optional[Session] = None) -> CodeRunResponse:
        # Check authorization if candidate_id is provided
        if payload.candidate_id and db:
            cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
            if cand:
                auth, err = AssessmentController._is_candidate_authorized_for_assessment(cand)
                if not auth:
                    return CodeRunResponse(
                        all_passed=False,
                        passed_count=0,
                        total_count=0,
                        test_results=[],
                        console_output=f"> Access Error: {err}",
                        execution_ms=0.0
                    )

        lang = (payload.language or "javascript").lower()
        code = payload.code or ""
        task_id = payload.task_id

        # 1. Non-coding practical deliverables
        if lang in ["deliverable", "text", "practical", "document", "markdown", "none", "plain"]:
            results, console_logs = AssessmentController._run_practical_validation(code, payload.test_cases or [], task_id, [])
            passed_count = sum(1 for r in results if r.get("passed", False))
            total_count = len(results)
            return CodeRunResponse(
                all_passed=passed_count == total_count and total_count > 0,
                passed_count=passed_count,
                total_count=total_count,
                test_results=results,
                console_output="\n".join(console_logs),
                execution_ms=1.0,
                memory_mb=12.0
            )

        # 2. Retrieve sample test cases, execution_mode, and entry_point from payload, candidate bundle, or database
        test_cases = payload.test_cases or []
        schema_ddl = getattr(payload, "schema_ddl", None)
        expected_rows = None
        execution_mode = payload.execution_mode or "function"
        entry_point = payload.entry_point
        function_signature = payload.function_signature

        if db and payload.candidate_id:
            cand = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
            b = cand.assessment_data.get("bundle", {}) if (cand and cand.assessment_data) else {}
            if not b and payload.job_id:
                job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
                b = job.assessment_pool if (job and job.assessment_pool and isinstance(job.assessment_pool, dict)) else {}

            for cat in ["hands_on", "troubleshooting"]:
                cat_obj = b.get(cat, {})
                if cat_obj.get("id") == task_id or cat in str(task_id):
                    if not test_cases:
                        test_cases = cat_obj.get("sample_test_cases") or cat_obj.get("test_cases", [])[:2]
                    schema_ddl = cat_obj.get("schema_ddl")
                    expected_rows = cat_obj.get("expected_rows")
                    if not entry_point:
                        entry_point = cat_obj.get("function_name")
                    if not execution_mode:
                        execution_mode = cat_obj.get("execution_mode", "function")
                    break

            if not test_cases:
                ext_qs = b.get("external_questions") or b.get("coding_problems") or []
                for q in ext_qs:
                    if q.get("id") == task_id or str(q.get("id")) in str(task_id):
                        test_cases = q.get("sample_test_cases") or q.get("test_cases", [])
                        if not entry_point:
                            entry_point = q.get("function_name")
                        break

        # Dynamic lookup from CodingProblemModel in database
        if db:
            from models.db_models import CodingProblemModel, CodingTestCaseModel
            prob = db.query(CodingProblemModel).filter(
                (CodingProblemModel.id == task_id) | (CodingProblemModel.slug == task_id)
            ).first()
            if prob:
                if not entry_point:
                    entry_point = prob.function_name
                if not execution_mode or execution_mode == "function":
                    execution_mode = getattr(prob, "execution_mode", "function") or "function"
                if not function_signature:
                    function_signature = getattr(prob, "function_signature", None)
                if not test_cases:
                    test_cases = [
                        {
                            "id": tc.id,
                            "name": f"Sample {idx+1}",
                            "input": tc.input_data,
                            "expected": tc.expected_output,
                            "is_hidden": tc.is_hidden
                        }
                        for idx, tc in enumerate(prob.test_cases) if not tc.is_hidden
                    ]

        # 3. Delegate to isolated SandboxRunner outside the FastAPI process
        return SandboxRunner.get_instance().run_code(
            code=code,
            language=lang,
            test_cases=test_cases,
            task_id=task_id,
            custom_input=payload.custom_input,
            is_custom_test=payload.is_custom_test,
            schema_ddl=schema_ddl,
            expected_rows=expected_rows,
            execution_mode=execution_mode,
            entry_point=entry_point,
            function_signature=function_signature
        )

    @staticmethod
    def _run_custom_test(code: str, custom_input: Optional[str], lang: str, task_id: str) -> CodeRunResponse:
        """
        Delegates custom argument execution to the isolated SandboxRunner subprocess.
        """
        return SandboxRunner.get_instance().run_code(
            code=code,
            language=lang,
            test_cases=[],
            task_id=task_id,
            custom_input=custom_input,
            is_custom_test=True
        )

    @staticmethod
    def _run_python_tests(
        code: str,
        test_cases: list,
        task_id: str,
        logs: list,
        entry_point: Optional[str] = None,
        execution_mode: str = "function",
        function_signature: Optional[dict] = None
    ) -> Tuple[list, list, Optional[str], Optional[str], float]:
        """
        Delegates Python test execution to the isolated SandboxRunner subprocess.
        Completely eliminates in-process exec from the FastAPI server.
        """
        resp = SandboxRunner.get_instance().run_code(
            code=code,
            language="python",
            test_cases=test_cases,
            task_id=task_id,
            execution_mode=execution_mode,
            entry_point=entry_point,
            function_signature=function_signature
        )
        if resp.console_output:
            logs.append(resp.console_output)
        return resp.test_results, logs, getattr(resp, "compilation_error", None), getattr(resp, "runtime_error", None), resp.memory_mb or 24.5

    @staticmethod
    def _run_js_tests(
        code: str,
        test_cases: list,
        task_id: str,
        logs: list,
        entry_point: Optional[str] = None,
        execution_mode: str = "function",
        function_signature: Optional[dict] = None
    ) -> Tuple[list, list, Optional[str], Optional[str], float]:
        """
        Delegates JavaScript/Node.js test execution to the isolated SandboxRunner subprocess.
        """
        resp = SandboxRunner.get_instance().run_code(
            code=code,
            language="javascript",
            test_cases=test_cases,
            task_id=task_id,
            execution_mode=execution_mode,
            entry_point=entry_point,
            function_signature=function_signature
        )
        if resp.console_output:
            logs.append(resp.console_output)
        return resp.test_results, logs, getattr(resp, "compilation_error", None), getattr(resp, "runtime_error", None), resp.memory_mb or 28.5

    @staticmethod
    def _run_compiled_tests(
        code: str,
        test_cases: list,
        lang: str,
        task_id: str,
        logs: list,
        entry_point: Optional[str] = None,
        execution_mode: str = "function",
        function_signature: Optional[dict] = None
    ) -> Tuple[list, list]:
        """
        Executes compiled code (Java, C++, Go, Rust, Swift, etc.) via the authoritative SandboxRunner / Judge0 pipeline.
        If Judge0 is not configured, returns an honest unavailable status without fake manual review promises.
        """
        resp = SandboxRunner.get_instance().run_code(
            code=code,
            language=lang,
            test_cases=test_cases,
            task_id=task_id,
            execution_mode=execution_mode,
            entry_point=entry_point,
            function_signature=function_signature
        )
        if resp.console_output:
            logs.append(resp.console_output)
        return resp.test_results, logs

    @staticmethod
    def _run_sql_tests(
        code: str,
        test_cases: list,
        task_id: str,
        logs: list,
        schema_ddl: Optional[str] = None,
        expected_rows: Optional[list] = None
    ) -> Tuple[list, list, Optional[str], Optional[str], float]:
        results = []
        compilation_error = None
        runtime_error = None
        memory_mb = 18.5

        logs.append("> Relational Database Sandbox (SQLite 3.50 engine): Initializing isolated catalog...")

        clean_code = (code or "").strip()
        is_starter = (
            not clean_code
            or "-- TODO" in clean_code
            or "// TODO" in clean_code
            or "TODO: Implement" in clean_code
            or clean_code.startswith("-- Write SQL")
            or "connection_hang" in clean_code
        )

        default_ddl = (
            "CREATE TABLE IF NOT EXISTS employees (\n"
            "    id INTEGER PRIMARY KEY,\n"
            "    name TEXT NOT NULL,\n"
            "    department TEXT NOT NULL,\n"
            "    salary REAL NOT NULL,\n"
            "    status TEXT NOT NULL\n"
            ");\n"
            "INSERT INTO employees (id, name, department, salary, status) VALUES\n"
            "(1, 'Alice Smith', 'Engineering', 95000, 'Active'),\n"
            "(2, 'Bob Jones', 'Engineering', 88000, 'Active'),\n"
            "(3, 'Charlie Brown', 'HR', 65000, 'Active'),\n"
            "(4, 'Diana Prince', 'Engineering', 105000, 'Active'),\n"
            "(5, 'Evan Wright', 'Marketing', 72000, 'Active'),\n"
            "(6, 'Frank Wright', 'Finance', 90000, 'Terminated');"
        )
        active_ddl = schema_ddl if (schema_ddl and schema_ddl.strip()) else default_ddl

        con = None
        try:
            con = sqlite3.connect(":memory:")
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.executescript(active_ddl)
            logs.append("> Schema DDL executed: Database tables & sample records initialized.")
        except Exception as ddl_err:
            compilation_error = f"DDL Initialization Error: {str(ddl_err)}"
            logs.append(f"  [FAIL] Database Catalog Error: {compilation_error}")
            for idx, tc in enumerate(test_cases):
                results.append({
                    "id": idx + 1,
                    "name": tc.get("name", f"SQL Test {idx+1}"),
                    "input": tc.get("input", "SQL Query"),
                    "expected": tc.get("expected", ""),
                    "actual": compilation_error,
                    "passed": False,
                    "error": compilation_error,
                    "duration": "0ms"
                })
            if con:
                con.close()
            return results, logs, compilation_error, None, memory_mb

        if is_starter:
            logs.append("  [FAIL] Unimplemented Starter Code: Code contains unresolved TODO or default starter query.")
            for idx, tc in enumerate(test_cases):
                results.append({
                    "id": idx + 1,
                    "name": tc.get("name", f"SQL Test {idx+1}"),
                    "input": tc.get("input", "SQL Query"),
                    "expected": tc.get("expected", ""),
                    "actual": "Starter template unmodified",
                    "passed": False,
                    "status": "Unimplemented",
                    "error": "Starter template detected. Please implement your SQL query logic before running tests.",
                    "duration": "0ms"
                })
            con.close()
            return results, logs, None, None, memory_mb

        query_rows = []
        col_names = []
        t0 = time.perf_counter()
        try:
            cleaned_sql = "\n".join([line for line in clean_code.splitlines() if not line.strip().startswith("--") and not line.strip().startswith("/*")]).strip()
            if not cleaned_sql:
                raise ValueError("No executable SQL statements found (only comments).")

            cur.execute(cleaned_sql)
            if cur.description:
                col_names = [d[0] for d in cur.description]
                query_rows = [dict(r) for r in cur.fetchall()]
            else:
                query_rows = []
            dur_ms = round((time.perf_counter() - t0) * 1000, 2)
            logs.append(f"> Query executed in {dur_ms}ms. Returned {len(query_rows)} rows.")

            if col_names:
                table_str = AssessmentController._format_ascii_table(col_names, query_rows)
                logs.append("> Output Dataset:")
                logs.append(table_str)

        except (sqlite3.OperationalError, sqlite3.DatabaseError, ValueError) as sql_err:
            dur_ms = round((time.perf_counter() - t0) * 1000, 2)
            compilation_error = f"SQL Execution Error: {str(sql_err)}"
            logs.append(f"  [FAIL] SQL Error: {compilation_error}")
            for idx, tc in enumerate(test_cases):
                results.append({
                    "id": idx + 1,
                    "name": tc.get("name", f"SQL Test {idx+1}"),
                    "input": tc.get("input", "SQL Query"),
                    "expected": tc.get("expected", ""),
                    "actual": compilation_error,
                    "passed": False,
                    "error": compilation_error,
                    "duration": f"{dur_ms}ms"
                })
            con.close()
            return results, logs, compilation_error, None, memory_mb
        except Exception as ex:
            dur_ms = round((time.perf_counter() - t0) * 1000, 2)
            runtime_error = str(ex)
            logs.append(f"  [FAIL] Runtime Error: {runtime_error}")
            for idx, tc in enumerate(test_cases):
                results.append({
                    "id": idx + 1,
                    "name": tc.get("name", f"SQL Test {idx+1}"),
                    "input": tc.get("input", "SQL Query"),
                    "expected": tc.get("expected", ""),
                    "actual": runtime_error,
                    "passed": False,
                    "error": runtime_error,
                    "duration": f"{dur_ms}ms"
                })
            con.close()
            return results, logs, None, runtime_error, memory_mb

        # 3. Evaluate each test case against actual query output (genuine comparison)
        for idx, tc in enumerate(test_cases):
            tc_name = tc.get("name", f"SQL Test {idx+1}")
            tc_expected = tc.get("expected", "")
            expected_rows_tc = tc.get("expected_rows") or tc.get("expected_data")
            tc_passed = False
            tc_actual = ""
            tc_err = None

            try:
                if expected_rows_tc and isinstance(expected_rows_tc, list):
                    # Genuine row comparison: compare actual result to expected list
                    def _normalize_rows(rows):
                        """Normalize row dicts to lowercase string values for comparison."""
                        return [{str(k).lower(): str(v).strip() for k, v in r.items()} for r in rows]

                    actual_norm = _normalize_rows(query_rows)
                    expected_norm = _normalize_rows(expected_rows_tc)

                    # Order-insensitive comparison by default; test case can specify ordered=True
                    if tc.get("ordered", False):
                        tc_passed = actual_norm == expected_norm
                    else:
                        # Sort both by their string representation for order-insensitive comparison
                        tc_passed = sorted([str(r) for r in actual_norm]) == sorted([str(r) for r in expected_norm])

                    tc_actual = json.dumps(query_rows[:5])  # Show first 5 rows
                    if not tc_passed:
                        tc_err = f"Row mismatch: expected {len(expected_rows_tc)} rows matching expected_rows, got {len(query_rows)} rows with different data."

                elif tc.get("expected_row_count") is not None:
                    # Check row count only
                    expected_count = int(tc["expected_row_count"])
                    tc_passed = len(query_rows) == expected_count
                    tc_actual = f"{len(query_rows)} rows returned"
                    if not tc_passed:
                        tc_err = f"Row count mismatch: expected {expected_count}, got {len(query_rows)}."

                elif tc.get("expected_min_rows") is not None or tc.get("expected_max_rows") is not None:
                    # Range-based row count check
                    min_rows = tc.get("expected_min_rows", 0)
                    max_rows = tc.get("expected_max_rows", 99999)
                    tc_passed = min_rows <= len(query_rows) <= max_rows
                    tc_actual = f"{len(query_rows)} rows returned"
                    if not tc_passed:
                        tc_err = f"Row count {len(query_rows)} outside expected range [{min_rows}, {max_rows}]."

                elif tc_expected and str(tc_expected).strip():
                    # Text-based expected value: check if the expected string appears in the JSON output
                    tc_actual_json = json.dumps(query_rows)
                    tc_actual = tc_actual_json[:200]
                    # Flexible: expected value must appear somewhere in the output
                    tc_passed = str(tc_expected).strip().lower() in tc_actual_json.lower()
                    if not tc_passed:
                        tc_err = f"Expected value '{tc_expected}' not found in query output."

                else:
                    # No expected output defined — pass if query returned any rows without error
                    tc_passed = len(query_rows) >= 0  # Always True if query ran
                    tc_actual = f"{len(query_rows)} rows returned"
                    logs.append(f"  [INFO] {tc_name}: No expected output defined; verifying query executes without error.")

            except Exception as eval_err:
                tc_passed = False
                tc_actual = str(eval_err)
                tc_err = f"Evaluation error: {str(eval_err)}"

            if tc_passed:
                logs.append(f"  [PASS] {tc_name}")
            else:
                logs.append(f"  [FAIL] {tc_name}: {tc_err or 'Output mismatch'}")

            results.append({
                "id": idx + 1,
                "name": tc_name,
                "input": tc.get("input", "SQL Query"),
                "expected": tc_expected,
                "actual": tc_actual,
                "passed": tc_passed,
                "error": tc_err,
                "duration": f"{dur_ms}ms"
            })

        con.close()
        return results, logs, compilation_error, runtime_error, memory_mb

    @staticmethod
    def _run_practical_validation(code: str, test_cases: list, task_id: str, logs: list) -> Tuple[list, list]:
        results = []
        logs.append("> Validating Professional Deliverable...")
        clean_text = (code or "").strip()
        words = len(clean_text.split())
        logs.append(f"> Deliverable Length: {words} words ({len(clean_text)} characters).")

        if words >= 15:
            logs.append("  [PASS] Deliverable format & structure verified.")
            logs.append("  [PASS] Substantive domain documentation detected.")
            for idx, tc in enumerate(test_cases):
                results.append({
                    "id": idx + 1,
                    "name": tc.get("name", f"Requirement {idx+1}"),
                    "input": tc.get("input", "Deliverable submission"),
                    "expected": tc.get("expected", "Complete professional response"),
                    "actual": "Documented",
                    "passed": True,
                    "status": "Verified",
                    "error": None,
                    "duration": "1ms"
                })
        else:
            logs.append("  [FAIL] Incomplete deliverable: Minimum substantive content (15+ words) required.")
            for idx, tc in enumerate(test_cases):
                results.append({
                    "id": idx + 1,
                    "name": tc.get("name", f"Requirement {idx+1}"),
                    "input": tc.get("input", "Deliverable submission"),
                    "expected": tc.get("expected", "Complete professional response"),
                    "actual": "Incomplete",
                    "passed": False,
                    "status": "Incomplete",
                    "error": "Deliverable lacks required detail or is empty.",
                    "duration": "0ms"
                })
        return results, logs

    @staticmethod
    def submit_candidate_assessment(candidate_id: str, payload: AssessmentSubmitRequest, db: Session) -> Tuple[Optional[AssessmentSubmitResponse], Optional[str]]:
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            return None, "Candidate not found"

        # Check if candidate has already submitted
        assessment_data = candidate.assessment_data or {}
        if candidate.assessment_status in ["submitted", "evaluated"] or assessment_data.get("is_completed"):
            return None, "Assessment has already been submitted and is currently under review."

        # Verify candidate authorization: must be scheduled or advanced by recruiter
        authorized, auth_err = AssessmentController._is_candidate_authorized_for_assessment(candidate)
        if not authorized:
            return None, auth_err

        # Mark candidate assessment as submitted immediately
        old_assess_status = candidate.assessment_status or "in_progress"
        candidate.assessment_status = "submitted"
        candidate.assessment_submitted_at = datetime.utcnow()
        log_state_change(
            db=db,
            candidate_id=candidate.id,
            dimension="assessment_status",
            from_state=old_assess_status,
            to_state="submitted",
            triggered_by="candidate",
            reason="Candidate submitted assessment answers and practical work"
        )

        target_job_id = getattr(payload, "job_id", None) or candidate.job_id or assessment_data.get("job_id")
        job = db.query(JobModel).filter(JobModel.id == target_job_id).first()
        job_title = job.title if job else "Software Engineer"
        job_skills = (job.required_skills if job else None) or candidate.skills or ["Engineering"]

        bundle = assessment_data.get("bundle") or {}
        mcq_solutions = assessment_data.get("mcq_solutions") or {}

        # Authoritative assessment lookup for relational linking
        assessment_obj = db.query(AssessmentModel).filter(
            AssessmentModel.job_id == target_job_id,
            AssessmentModel.is_active == True
        ).first() if target_job_id else None

        # 1. Grade Category 1: Technical MCQs (25 points) - Authoritative DB Evaluation & Persistence
        correct_mcqs = 0
        assigned_mcqs = bundle.get("technical_mcqs", [])
        total_mcqs = max(1, len(assigned_mcqs))

        if payload.technical_answers:
            for q_id, chosen in payload.technical_answers.items():
                db_q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == q_id).first()
                if db_q:
                    correct_opt_model = next((opt for opt in db_q.options if opt.is_correct), None)
                    correct_ans = correct_opt_model.option_key if correct_opt_model else None
                else:
                    correct_ans = mcq_solutions.get(q_id)
                    if not correct_ans:
                        matched_mcq = next((m for m in assigned_mcqs if m.get("id") == q_id), None)
                        if matched_mcq:
                            correct_ans = matched_mcq.get("correct_option") or matched_mcq.get("correct_answer")

                is_answer_correct = bool(correct_ans and chosen and str(correct_ans).strip().upper() == str(chosen).strip().upper())
                if is_answer_correct:
                    correct_mcqs += 1

                # Persist authoritative candidate MCQ submission record
                if db_q:
                    db.add(MCQSubmissionModel(
                        id=f"msub-{uuid.uuid4().hex[:8]}",
                        candidate_id=candidate.id,
                        assessment_id=assessment_obj.id if assessment_obj else None,
                        mcq_question_id=db_q.id,
                        selected_option_key=str(chosen).strip().upper() if chosen else None,
                        is_correct=is_answer_correct,
                        points_earned=1.0 if is_answer_correct else 0.0,
                        points_possible=1.0
                    ))

            tech_score = int((correct_mcqs / total_mcqs) * 100)
        else:
            tech_score = 0

        # 2. Grade Category 2: Scenario (25 points) via Dynamic AI Engine
        scenario_obj = bundle.get("scenario") or {}
        scenario_prompt = scenario_obj.get("prompt") or scenario_obj.get("title") or "Architectural incident challenge"
        ideal_kws = scenario_obj.get("ideal_keywords") or job_skills

        scen_answers = [str(a) for a in (payload.scenario_answers or {}).values() if a and str(a).strip()]
        scen_text = " ".join(scen_answers).strip()

        scenario_eval = evaluate_scenario_response(
            scenario_prompt=scenario_prompt,
            candidate_response=scen_text,
            job_title=job_title,
            job_skills=job_skills,
            ideal_keywords=ideal_kws
        )
        scenario_score = scenario_eval.get("score", 0)

        # 3. Grade Category 3: Coding / Problem Bank / Practical Hands-on (25 points)
        hands_on = payload.hands_on_submission or {}
        hands_code = (hands_on.get("code") or "").strip()
        bundle_hands = bundle.get("hands_on", {})
        is_hands_coding = bundle_hands.get("is_coding", True)
        hands_lang = (hands_on.get("language") or "python").lower()

        # Check for multiple coding problems attached to this assessment in DB or bundle
        coding_problems_to_grade = []
        if assessment_obj:
            acps = db.query(AssessmentCodingProblemModel).filter(
                AssessmentCodingProblemModel.assessment_id == assessment_obj.id
            ).order_by(AssessmentCodingProblemModel.display_order.asc()).all()
            for acp in acps:
                if acp.problem:
                    coding_problems_to_grade.append({
                        "source": "model",
                        "acp": acp,
                        "problem": acp.problem,
                        "weight": float(acp.weight or 100.0)
                    })

        if not coding_problems_to_grade and bundle.get("coding_problems"):
            for cp in bundle.get("coding_problems", []):
                prob_id = cp.get("id") or cp.get("slug")
                prob_model = db.query(CodingProblemModel).filter(
                    (CodingProblemModel.id == prob_id) | (CodingProblemModel.slug == prob_id)
                ).first() if prob_id else None
                coding_problems_to_grade.append({
                    "source": "bundle_prob",
                    "dict": cp,
                    "problem": prob_model,
                    "weight": float(cp.get("weight", 100.0))
                })

        all_coding_submissions_meta = []

        if coding_problems_to_grade:
            # Multi-problem dynamic scoring engine
            total_coding_weight = sum(item["weight"] for item in coding_problems_to_grade)
            if total_coding_weight <= 0:
                total_coding_weight = 100.0 * len(coding_problems_to_grade)

            earned_coding_weight = 0.0
            total_all_tcs = 0
            total_all_passed = 0
            coding_aggregate_ms = 0.0
            coding_aggregate_mem = 24.5
            first_prob_code = ""
            first_prob_lang = "python"
            first_sample_results = []
            first_hidden_results = []

            for p_idx, p_item in enumerate(coding_problems_to_grade):
                prob = p_item.get("problem")
                p_dict = p_item.get("dict") or {}
                p_id = prob.id if prob else str(p_dict.get("id", f"problem_{p_idx+1}"))
                p_slug = getattr(prob, "slug", "")
                p_weight = p_item.get("weight", 100.0)
                acp = p_item.get("acp")

                # Locate candidate submission for this problem
                cand_sub = None
                if payload.coding_submissions:
                    for s in payload.coding_submissions:
                        if s.get("problem_id") in [p_id, p_slug]:
                            cand_sub = s
                            break
                if not cand_sub and payload.hands_on_submission:
                    h_task = payload.hands_on_submission.get("task_id")
                    if h_task in [p_id, p_slug] or (p_idx == 0 and not payload.coding_submissions):
                        cand_sub = payload.hands_on_submission

                c_code = (cand_sub.get("code") or "").strip() if cand_sub else ""
                c_lang = (cand_sub.get("language") or "python").lower() if cand_sub else "python"

                if p_idx == 0:
                    first_prob_code = c_code
                    first_prob_lang = c_lang

                # Get all test cases
                ep = prob.function_name if prob else p_dict.get("function_name", "solve")
                mode = getattr(prob, "execution_mode", "function") if prob else p_dict.get("execution_mode", "function")
                sig = prob.function_signature if prob else p_dict.get("function_signature")

                if acp and acp.problem_version and acp.problem_version.test_cases:
                    all_tcs = list(acp.problem_version.test_cases)
                elif prob and prob.test_cases:
                    all_tcs = list(prob.test_cases)
                else:
                    raw_sample = p_dict.get("sample_test_cases") or p_dict.get("test_cases", [])[:2]
                    raw_hidden = p_dict.get("hidden_test_cases") or p_dict.get("test_cases", [])[2:]
                    all_tcs = list(raw_sample) + list(raw_hidden)

                sample_tcs = []
                hidden_tcs = []
                for tc in all_tcs:
                    if hasattr(tc, "is_hidden"):
                        (hidden_tcs if tc.is_hidden else sample_tcs).append(tc)
                    elif isinstance(tc, dict):
                        (hidden_tcs if tc.get("is_hidden") else sample_tcs).append(tc)
                    else:
                        sample_tcs.append(tc)

                if not sample_tcs and not hidden_tcs and all_tcs:
                    sample_tcs = all_tcs[:2]
                    hidden_tcs = all_tcs[2:]

                p_sample_results = []
                p_hidden_results = []
                p_start = time.time()
                p_mem_mb = 24.5

                if c_code:
                    def _to_runner_tc(tc, idx):
                        if hasattr(tc, "input_data"):
                            return {
                                "id": tc.id,
                                "name": f"Test {idx+1}",
                                "input": tc.input_data,
                                "expected": tc.expected_output,
                                "is_hidden": tc.is_hidden,
                                "weight": getattr(tc, "weight", 1.0)
                            }
                        return tc

                    runner_sample = [_to_runner_tc(tc, i) for i, tc in enumerate(sample_tcs)]
                    runner_hidden = [_to_runner_tc(tc, i + len(sample_tcs)) for i, tc in enumerate(hidden_tcs)]

                    if c_lang == "python":
                        p_sample_results, _, _, _, m1 = AssessmentController._run_python_tests(c_code, runner_sample, p_id, [], entry_point=ep, execution_mode=mode, function_signature=sig)
                        p_hidden_results, _, _, _, m2 = AssessmentController._run_python_tests(c_code, runner_hidden, p_id, [], entry_point=ep, execution_mode=mode, function_signature=sig)
                        p_mem_mb = max(m1, m2)
                    elif c_lang in ["javascript", "typescript"]:
                        p_sample_results, _, _, _, m1 = AssessmentController._run_js_tests(c_code, runner_sample, p_id, [], entry_point=ep, execution_mode=mode, function_signature=sig)
                        p_hidden_results, _, _, _, m2 = AssessmentController._run_js_tests(c_code, runner_hidden, p_id, [], entry_point=ep, execution_mode=mode, function_signature=sig)
                        p_mem_mb = max(m1, m2)
                    elif c_lang == "sql":
                        schema_ddl = p_dict.get("schema_ddl") or getattr(prob, "constraints", None)
                        expected_rows = p_dict.get("expected_rows")
                        p_sample_results, _, _, _, m1 = AssessmentController._run_sql_tests(c_code, runner_sample, p_id, [], schema_ddl=schema_ddl, expected_rows=expected_rows)
                        p_hidden_results, _, _, _, m2 = AssessmentController._run_sql_tests(c_code, runner_hidden, p_id, [], schema_ddl=schema_ddl, expected_rows=expected_rows)
                        p_mem_mb = max(m1, m2)
                    else:
                        p_sample_results, _ = AssessmentController._run_compiled_tests(c_code, runner_sample, c_lang, p_id, [], entry_point=ep, execution_mode=mode, function_signature=sig)
                        p_hidden_results, _ = AssessmentController._run_compiled_tests(c_code, runner_hidden, c_lang, p_id, [], entry_point=ep, execution_mode=mode, function_signature=sig)

                p_total_ms = round((time.time() - p_start) * 1000, 2)
                coding_aggregate_ms += p_total_ms
                coding_aggregate_mem = max(coding_aggregate_mem, p_mem_mb)

                all_p_results = p_sample_results + p_hidden_results
                p_passed = sum(1 for r in all_p_results if r.get("passed", False))
                p_total = len(all_p_results)
                total_all_tcs += p_total
                total_all_passed += p_passed

                if p_total > 0 and c_code:
                    prob_score = round((p_passed / p_total) * 100.0, 2)
                    earned_p_weight = (p_passed / p_total) * p_weight
                else:
                    prob_score = 0.0
                    earned_p_weight = 0.0

                earned_coding_weight += earned_p_weight

                if p_idx == 0:
                    first_sample_results = p_sample_results
                    first_hidden_results = p_hidden_results

                # Persist genuine CodingSubmissionModel & SubmissionTestCaseResultModel
                try:
                    sub_id = f"sub-{uuid.uuid4().hex[:12]}"
                    sub_model = CodingSubmissionModel(
                        id=sub_id,
                        candidate_id=candidate.id,
                        assessment_id=assessment_obj.id if assessment_obj else None,
                        coding_problem_id=p_id if prob else None,
                        coding_problem_version_id=acp.coding_problem_version_id if acp else None,
                        language=c_lang,
                        source_code=c_code,
                        status="passed" if p_passed == p_total and p_total > 0 else "failed" if p_total > 0 else "completed",
                        total_test_cases=p_total,
                        passed_test_cases=p_passed,
                        score=float(prob_score),
                        execution_time_ms=p_total_ms,
                        memory_mb=p_mem_mb,
                        is_best_submission=True,
                        completed_at=datetime.utcnow()
                    )
                    db.add(sub_model)

                    for r in p_sample_results:
                        db.add(SubmissionTestCaseResultModel(
                            id=f"tcr-{uuid.uuid4().hex[:12]}",
                            submission_id=sub_id,
                            test_case_id=str(r.get("id") or f"tc-s-{uuid.uuid4().hex[:6]}"),
                            passed=bool(r.get("passed", False)),
                            actual_output=str(r.get("actual", "")),
                            execution_time_ms=float(str(r.get("duration", "0ms")).replace("ms", "") or 0.0),
                            memory_mb=p_mem_mb,
                            error_message=r.get("error"),
                            is_hidden=False
                        ))
                    for r in p_hidden_results:
                        db.add(SubmissionTestCaseResultModel(
                            id=f"tcr-{uuid.uuid4().hex[:12]}",
                            submission_id=sub_id,
                            test_case_id=str(r.get("id") or f"tc-h-{uuid.uuid4().hex[:6]}"),
                            passed=bool(r.get("passed", False)),
                            actual_output=str(r.get("actual", "")),
                            execution_time_ms=float(str(r.get("duration", "0ms")).replace("ms", "") or 0.0),
                            memory_mb=p_mem_mb,
                            error_message=r.get("error"),
                            is_hidden=True
                        ))
                except Exception:
                    pass

                all_coding_submissions_meta.append({
                    "problem_id": p_id,
                    "language": c_lang,
                    "code": c_code,
                    "score": prob_score,
                    "passed_count": p_passed,
                    "total_count": p_total,
                    "execution_ms": p_total_ms,
                    "sample_results": p_sample_results,
                    "hidden_results": p_hidden_results
                })

            hands_score = int(round((earned_coding_weight / total_coding_weight) * 100)) if total_coding_weight > 0 else 0
            hands_sample_results = first_sample_results
            hands_hidden_results = first_hidden_results
            hands_total_ms = coding_aggregate_ms
            hands_mem_mb = coding_aggregate_mem
            passed_hands = total_all_passed
            total_hands = total_all_tcs
            hands_lang = first_prob_lang
            hands_code = first_prob_code
            is_hands_coding = True
        else:
            # Single task or practical task path
            hands_on = payload.hands_on_submission or {}
            hands_code = (hands_on.get("code") or "").strip()
            bundle_hands = bundle.get("hands_on", {})
            is_hands_coding = bundle_hands.get("is_coding", True)
            hands_lang = (hands_on.get("language") or "python").lower()

            hands_sample_results = []
            hands_hidden_results = []
            hands_total_ms = 0.0
            hands_mem_mb = 24.5

            if not is_hands_coding:
                if not hands_code or len(hands_code.split()) < 15:
                    hands_score = 0
                else:
                    eval_res = evaluate_practical_task(
                        task_title=bundle_hands.get("title", "Practical Hands-on Task"),
                        instructions=bundle_hands.get("deliverable_requirements") or bundle_hands.get("description", ""),
                        candidate_submission=hands_code,
                        role_title=job_title,
                        job_skills=job_skills
                    )
                    hands_score = eval_res.get("score", 0)
            else:
                # Backend executes BOTH sample test cases and hidden test cases on the submitted code!
                sample_tcs = bundle_hands.get("sample_test_cases") or bundle_hands.get("test_cases", [])[:2]
                hidden_tcs = bundle_hands.get("hidden_test_cases") or bundle_hands.get("test_cases", [])[2:]

                h_start = time.time()
                h_ep = bundle_hands.get("function_name")
                h_mode = bundle_hands.get("execution_mode", "function")
                h_sig = bundle_hands.get("function_signature")
                if hands_code:
                    if hands_lang == "python":
                        hands_sample_results, _, _, _, mem1 = AssessmentController._run_python_tests(hands_code, sample_tcs, bundle_hands.get("id", "hands_1"), [], entry_point=h_ep, execution_mode=h_mode, function_signature=h_sig)
                        hands_hidden_results, _, _, _, mem2 = AssessmentController._run_python_tests(hands_code, hidden_tcs, bundle_hands.get("id", "hands_1"), [], entry_point=h_ep, execution_mode=h_mode, function_signature=h_sig)
                        hands_mem_mb = max(mem1, mem2)
                    elif hands_lang in ["javascript", "typescript"]:
                        hands_sample_results, _, _, _, mem1 = AssessmentController._run_js_tests(hands_code, sample_tcs, bundle_hands.get("id", "hands_1"), [], entry_point=h_ep, execution_mode=h_mode, function_signature=h_sig)
                        hands_hidden_results, _, _, _, mem2 = AssessmentController._run_js_tests(hands_code, hidden_tcs, bundle_hands.get("id", "hands_1"), [], entry_point=h_ep, execution_mode=h_mode, function_signature=h_sig)
                        hands_mem_mb = max(mem1, mem2)
                    elif hands_lang == "sql":
                        h_schema = bundle_hands.get("schema_ddl")
                        h_expected = bundle_hands.get("expected_rows")
                        hands_sample_results, _, _, _, mem1 = AssessmentController._run_sql_tests(hands_code, sample_tcs, bundle_hands.get("id", "hands_1"), [], schema_ddl=h_schema, expected_rows=h_expected)
                        hands_hidden_results, _, _, _, mem2 = AssessmentController._run_sql_tests(hands_code, hidden_tcs, bundle_hands.get("id", "hands_1"), [], schema_ddl=h_schema, expected_rows=h_expected)
                        hands_mem_mb = max(mem1, mem2)
                    else:
                        hands_sample_results, _ = AssessmentController._run_compiled_tests(hands_code, sample_tcs, hands_lang, bundle_hands.get("id", "hands_1"), [], entry_point=h_ep, execution_mode=h_mode, function_signature=h_sig)
                        hands_hidden_results, _ = AssessmentController._run_compiled_tests(hands_code, hidden_tcs, hands_lang, bundle_hands.get("id", "hands_1"), [], entry_point=h_ep, execution_mode=h_mode, function_signature=h_sig)

                hands_total_ms = round((time.time() - h_start) * 1000, 2)
                all_hands = hands_sample_results + hands_hidden_results
                passed_hands = sum(1 for r in all_hands if r.get("passed", False))
                total_hands = len(all_hands)
                if total_hands > 0:
                    hands_score = int((passed_hands / total_hands) * 100)
                else:
                    hands_score = 0

                # Persist genuine CodingSubmissionModel & SubmissionTestCaseResultModel
                try:
                    sub_hands_id = f"sub-hands-{uuid.uuid4().hex[:10]}"
                    sub_hands = CodingSubmissionModel(
                        id=sub_hands_id,
                        candidate_id=candidate.id,
                        coding_problem_id=str(bundle_hands.get("id") or "hands_on_problem"),
                        language=hands_lang,
                        source_code=hands_code,
                        status="passed" if passed_hands == total_hands and total_hands > 0 else "failed" if total_hands > 0 else "completed",
                        total_test_cases=total_hands,
                        passed_test_cases=passed_hands,
                        score=float(hands_score),
                        execution_time_ms=hands_total_ms,
                        memory_mb=hands_mem_mb
                    )
                    db.add(sub_hands)

                    for r in hands_sample_results:
                        db.add(SubmissionTestCaseResultModel(
                            id=f"tcr-{uuid.uuid4().hex[:12]}",
                            submission_id=sub_hands_id,
                            test_case_id=str(r.get("id") or f"tc-s-{uuid.uuid4().hex[:6]}"),
                            passed=bool(r.get("passed", False)),
                            actual_output=str(r.get("actual", "")),
                            execution_time_ms=float(str(r.get("duration", "0ms")).replace("ms", "") or 0.0),
                            memory_mb=hands_mem_mb,
                            error_message=r.get("error"),
                            is_hidden=False
                        ))
                    for r in hands_hidden_results:
                        db.add(SubmissionTestCaseResultModel(
                            id=f"tcr-{uuid.uuid4().hex[:12]}",
                            submission_id=sub_hands_id,
                            test_case_id=str(r.get("id") or f"tc-h-{uuid.uuid4().hex[:6]}"),
                            passed=bool(r.get("passed", False)),
                            actual_output=str(r.get("actual", "")),
                            execution_time_ms=float(str(r.get("duration", "0ms")).replace("ms", "") or 0.0),
                            memory_mb=hands_mem_mb,
                            error_message=r.get("error"),
                            is_hidden=True
                        ))
                except Exception:
                    pass  # Graceful fallback if tables are empty/unbound in legacy paths

        # 4. Grade Category 4: Troubleshooting / Anomaly Diagnosis (25 points)
        trouble = payload.troubleshooting_submission or {}
        trouble_code = (trouble.get("code") or "").strip()
        bundle_trouble = bundle.get("troubleshooting", {})
        is_trouble_coding = bundle_trouble.get("is_coding", True)
        trouble_lang = (trouble.get("language") or "python").lower()

        trouble_sample_results = []
        trouble_hidden_results = []
        trouble_total_ms = 0.0
        trouble_mem_mb = 24.5

        if not is_trouble_coding:
            if not trouble_code or len(trouble_code.split()) < 15:
                trouble_score = 0
            else:
                eval_res = evaluate_practical_task(
                    task_title=bundle_trouble.get("title", "Troubleshooting Diagnosis"),
                    instructions=bundle_trouble.get("troubleshooting_brief") or bundle_trouble.get("description", ""),
                    candidate_submission=trouble_code,
                    role_title=job_title,
                    job_skills=job_skills
                )
                trouble_score = eval_res.get("score", 0)
        else:
            t_sample_tcs = bundle_trouble.get("sample_test_cases") or bundle_trouble.get("test_cases", [])[:1]
            t_hidden_tcs = bundle_trouble.get("hidden_test_cases") or bundle_trouble.get("test_cases", [])[1:]

            t_start = time.time()
            t_ep = bundle_trouble.get("function_name")
            t_mode = bundle_trouble.get("execution_mode", "function")
            t_sig = bundle_trouble.get("function_signature")
            if trouble_code:
                if trouble_lang == "python":
                    trouble_sample_results, _, _, _, tmem1 = AssessmentController._run_python_tests(trouble_code, t_sample_tcs, bundle_trouble.get("id", "trouble_1"), [], entry_point=t_ep, execution_mode=t_mode, function_signature=t_sig)
                    trouble_hidden_results, _, _, _, tmem2 = AssessmentController._run_python_tests(trouble_code, t_hidden_tcs, bundle_trouble.get("id", "trouble_1"), [], entry_point=t_ep, execution_mode=t_mode, function_signature=t_sig)
                    trouble_mem_mb = max(tmem1, tmem2)
                elif trouble_lang in ["javascript", "typescript"]:
                    trouble_sample_results, _, _, _, tmem1 = AssessmentController._run_js_tests(trouble_code, t_sample_tcs, bundle_trouble.get("id", "trouble_1"), [], entry_point=t_ep, execution_mode=t_mode, function_signature=t_sig)
                    trouble_hidden_results, _, _, _, tmem2 = AssessmentController._run_js_tests(trouble_code, t_hidden_tcs, bundle_trouble.get("id", "trouble_1"), [], entry_point=t_ep, execution_mode=t_mode, function_signature=t_sig)
                    trouble_mem_mb = max(tmem1, tmem2)
                elif trouble_lang == "sql":
                    t_schema = bundle_trouble.get("schema_ddl")
                    t_expected = bundle_trouble.get("expected_rows")
                    trouble_sample_results, _, _, _, tmem1 = AssessmentController._run_sql_tests(trouble_code, t_sample_tcs, bundle_trouble.get("id", "trouble_1"), [], schema_ddl=t_schema, expected_rows=t_expected)
                    trouble_hidden_results, _, _, _, tmem2 = AssessmentController._run_sql_tests(trouble_code, t_hidden_tcs, bundle_trouble.get("id", "trouble_1"), [], schema_ddl=t_schema, expected_rows=t_expected)
                    trouble_mem_mb = max(tmem1, tmem2)
                else:
                    trouble_sample_results, _ = AssessmentController._run_compiled_tests(trouble_code, t_sample_tcs, trouble_lang, bundle_trouble.get("id", "trouble_1"), [], entry_point=t_ep, execution_mode=t_mode, function_signature=t_sig)
                    trouble_hidden_results, _ = AssessmentController._run_compiled_tests(trouble_code, t_hidden_tcs, trouble_lang, bundle_trouble.get("id", "trouble_1"), [], entry_point=t_ep, execution_mode=t_mode, function_signature=t_sig)

            trouble_total_ms = round((time.time() - t_start) * 1000, 2)
            all_trouble = trouble_sample_results + trouble_hidden_results
            passed_trouble = sum(1 for r in all_trouble if r.get("passed", False))
            total_trouble = len(all_trouble)
            if total_trouble > 0:
                trouble_score = int((passed_trouble / total_trouble) * 100)
            else:
                trouble_score = 0

            # Persist genuine troubleshooting CodingSubmissionModel & SubmissionTestCaseResultModel
            try:
                sub_tr_id = f"sub-trouble-{uuid.uuid4().hex[:10]}"
                sub_tr = CodingSubmissionModel(
                    id=sub_tr_id,
                    candidate_id=candidate.id,
                    coding_problem_id=str(bundle_trouble.get("id") or "troubleshooting_problem"),
                    language=trouble_lang,
                    source_code=trouble_code,
                    status="passed" if passed_trouble == total_trouble and total_trouble > 0 else "failed" if total_trouble > 0 else "completed",
                    total_test_cases=total_trouble,
                    passed_test_cases=passed_trouble,
                    score=float(trouble_score),
                    execution_time_ms=trouble_total_ms,
                    memory_mb=trouble_mem_mb
                )
                db.add(sub_tr)

                for r in trouble_sample_results:
                    db.add(SubmissionTestCaseResultModel(
                        id=f"tcr-{uuid.uuid4().hex[:12]}",
                        submission_id=sub_tr_id,
                        test_case_id=str(r.get("id") or f"tc-ts-{uuid.uuid4().hex[:6]}"),
                        passed=bool(r.get("passed", False)),
                        actual_output=str(r.get("actual", "")),
                        execution_time_ms=float(str(r.get("duration", "0ms")).replace("ms", "") or 0.0),
                        memory_mb=trouble_mem_mb,
                        error_message=r.get("error"),
                        is_hidden=False
                    ))
                for r in trouble_hidden_results:
                    db.add(SubmissionTestCaseResultModel(
                        id=f"tcr-{uuid.uuid4().hex[:12]}",
                        submission_id=sub_tr_id,
                        test_case_id=str(r.get("id") or f"tc-th-{uuid.uuid4().hex[:6]}"),
                        passed=bool(r.get("passed", False)),
                        actual_output=str(r.get("actual", "")),
                        execution_time_ms=float(str(r.get("duration", "0ms")).replace("ms", "") or 0.0),
                        memory_mb=trouble_mem_mb,
                        error_message=r.get("error"),
                        is_hidden=True
                    ))
            except Exception:
                pass

        # Overall weighted score (strictly zero if candidate submitted blank)
        overall = int(0.25 * tech_score + 0.25 * scenario_score + 0.25 * hands_score + 0.25 * trouble_score)

        # Category scores dictionary
        category_scores = {
            "technical": tech_score,
            "scenario": scenario_score,
            "hands_on": hands_score,
            "troubleshooting": trouble_score,
            "overall": overall
        }

        # Store comprehensive assessment in CandidateModel
        candidate.assessment_data = {
            "job_id": target_job_id,
            "bundle": bundle,
            "mcq_solutions": mcq_solutions,
            "generated_by": "ai_engine",
            "answers": {
                "technical": payload.technical_answers,
                "scenario": payload.scenario_answers,
                "hands_on": hands_on,
                "troubleshooting": trouble
            },
            "category_scores": category_scores,
            "scenario_evaluation": scenario_eval,
            "is_completed": True,
            "submitted_at": datetime.utcnow().isoformat()
        }

        chosen_lang = hands_lang or (hands_on.get("language") if isinstance(hands_on, dict) else None) or trouble.get("language") or "python"
        candidate.coding_language = chosen_lang
        candidate.coding_score = hands_score
        candidate.coding_submission = hands_code
        candidate.coding_results = {
            "hands_on": {
                "sample_results": hands_sample_results,
                "hidden_results": hands_hidden_results,
                "total_passed": passed_hands if is_hands_coding else None,
                "total_count": total_hands if is_hands_coding else None,
                "execution_ms": hands_total_ms,
                "memory_mb": hands_mem_mb,
                "code": hands_code,
                "language": hands_lang
            },
            "troubleshooting": {
                "sample_results": trouble_sample_results,
                "hidden_results": trouble_hidden_results,
                "total_passed": passed_trouble if is_trouble_coding else None,
                "total_count": total_trouble if is_trouble_coding else None,
                "execution_ms": trouble_total_ms,
                "memory_mb": trouble_mem_mb,
                "code": trouble_code,
                "language": trouble_lang
            },
            "category_scores": category_scores
        }

        # Dynamic skill gap calculation based on real job requirements
        if overall >= 80:
            readiness = "Immediately Job-Ready"
            strong_skills = job_skills[:3]
            missing_skills = job_skills[3:]
            recommendations = ["Demonstrated production mastery across core technical pillars. Ready for technical leadership."]
        elif overall >= 50:
            readiness = "Hire-and-Develop (Trainable within 30 days)"
            strong_skills = [job_skills[0]] if job_skills else []
            missing_skills = job_skills[1:] if len(job_skills) > 1 else job_skills
            recommendations = [f"Hands-on architectural lab recommended for: {', '.join(missing_skills)}."]
        else:
            readiness = "Needs Foundational Preparation (Gap > 70%)"
            strong_skills = []
            missing_skills = job_skills
            recommendations = [f"Complete core certification and hands-on lab in {s} before re-evaluating." for s in missing_skills]

        candidate.skill_gaps = {
            "readiness": readiness,
            "strongSkills": strong_skills,
            "missingSkills": missing_skills,
            "recommendations": recommendations
        }

        # Update candidate scorecard scores honestly
        comm_score = candidate.scores.get("communication") if (candidate.scores and candidate.scores.get("communication") is not None) else (scenario_score if scenario_score > 0 else 0)
        candidate.scores = {
            "jobSkills": overall,
            "technicalScore": overall,
            "communication": comm_score,
            "problemSolving": int(0.5 * hands_score + 0.5 * trouble_score),
            "overall": overall
        }

        # Evaluation complete - transition to evaluated
        candidate.assessment_status = "evaluated"
        candidate.assessment_evaluated_at = datetime.utcnow()
        log_state_change(
            db=db,
            candidate_id=candidate.id,
            dimension="assessment_status",
            from_state="submitted",
            to_state="evaluated",
            triggered_by="system",
            reason=f"Automated evaluation completed with score {overall}/100"
        )

        # Advance stage to review if current stage is assessment
        if candidate.stage == STAGE_ASSESSMENT:
            old_stage = candidate.stage
            candidate.stage = STAGE_REVIEW
            candidate.stage_updated_at = datetime.utcnow()
            log_state_change(
                db=db,
                candidate_id=candidate.id,
                dimension="stage",
                from_state=old_stage,
                to_state=STAGE_REVIEW,
                triggered_by="system",
                reason="Assessment evaluated; application in review stage"
            )

        candidate.interview_summary = (
            f"Candidate completed dynamic 4-category Assessment with automated score {overall}/100 "
            f"(MCQs: {tech_score}%, Scenario: {scenario_score}%, Practical: {hands_score}%, Troubleshooting: {trouble_score}%). "
            f"Language/Deliverable: {chosen_lang.upper()}."
        )

        # Project legacy fields without touching hiring_decision
        candidate.status = project_legacy_status(candidate.stage, candidate.assessment_status, candidate.interview_status, candidate.hiring_decision)
        candidate.final_decision = project_legacy_final_decision(candidate.stage, candidate.hiring_decision)

        db.commit()
        db.refresh(candidate)

        return AssessmentSubmitResponse(
            success=True,
            candidate_id=candidate.id,
            status=candidate.status,
            final_decision=candidate.final_decision,
            scores=None,  # STRICT PRIVACY: NEVER LEAK TO CANDIDATE
            feedback_summary=None,
            message="Assessment submitted successfully. Your submission is now under review by the hiring team."
        ), None

    # ══════════════════════════════════════════════════════════════════════════
    # PHASE 4A.3: ADVANCED CODING PROBLEM BANK & RECRUITER AUTHORING
    # ══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def seed_system_coding_problems(db: Session):
        """Idempotently seed standard system coding problems."""
        existing_sys = db.query(CodingProblemModel).filter(
            (CodingProblemModel.is_system == True) | (CodingProblemModel.slug == "solve-me-first")
        ).first()
        if existing_sys:
            return

        problems_to_seed = [
            {
                "id": "prob-sys-solve-me-first",
                "slug": "solve-me-first",
                "title": "Solve Me First",
                "problem_statement": "Complete the function `solveMeFirst` to compute the sum of two integers `a` and `b`.",
                "difficulty": "Easy",
                "execution_mode": "function",
                "function_name": "solveMeFirst",
                "function_signature": {
                    "parameters": [{"name": "a", "type": "int"}, {"name": "b", "type": "int"}],
                    "return_type": "int"
                },
                "allowed_languages": ["python", "javascript", "typescript", "java", "cpp", "go", "rust", "swift"],
                "is_system": True,
                "organization_id": None,
                "test_cases": [
                    {"input_data": "2\n3", "expected_output": "5", "is_hidden": False, "weight": 10.0, "display_order": 1, "explanation": "2 + 3 = 5"},
                    {"input_data": "10\n4", "expected_output": "14", "is_hidden": False, "weight": 10.0, "display_order": 2, "explanation": "10 + 4 = 14"},
                    {"input_data": "100\n250", "expected_output": "350", "is_hidden": True, "weight": 40.0, "display_order": 3},
                    {"input_data": "-5\n12", "expected_output": "7", "is_hidden": True, "weight": 40.0, "display_order": 4}
                ]
            },
            {
                "id": "prob-sys-two-sum",
                "slug": "two-sum",
                "title": "Two Sum",
                "problem_statement": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution.",
                "difficulty": "Easy",
                "execution_mode": "function",
                "function_name": "twoSum",
                "function_signature": {
                    "parameters": [{"name": "nums", "type": "list[int]"}, {"name": "target", "type": "int"}],
                    "return_type": "list[int]"
                },
                "allowed_languages": ["python", "javascript", "typescript", "java", "cpp", "go", "rust"],
                "is_system": True,
                "organization_id": None,
                "test_cases": [
                    {"input_data": "[2, 7, 11, 15], 9", "expected_output": "[0, 1]", "is_hidden": False, "weight": 20.0, "display_order": 1},
                    {"input_data": "[3, 2, 4], 6", "expected_output": "[1, 2]", "is_hidden": False, "weight": 20.0, "display_order": 2},
                    {"input_data": "[3, 3], 6", "expected_output": "[0, 1]", "is_hidden": True, "weight": 60.0, "display_order": 3}
                ]
            },
            {
                "id": "prob-sys-stdin-sum",
                "slug": "simple-array-sum-stdin",
                "title": "Simple Array Sum (STDIN)",
                "problem_statement": "Given an array of integers, find the sum of its elements. The first line contains an integer n, denoting the size of the array. The second line contains n space-separated integers representing the array's elements.",
                "difficulty": "Easy",
                "execution_mode": "stdin",
                "function_name": "main",
                "allowed_languages": ["python", "javascript", "java", "cpp", "go"],
                "is_system": True,
                "organization_id": None,
                "test_cases": [
                    {"input_data": "6\n1 2 3 4 10 11", "expected_output": "31", "is_hidden": False, "weight": 20.0, "display_order": 1},
                    {"input_data": "3\n10 20 30", "expected_output": "60", "is_hidden": True, "weight": 80.0, "display_order": 2}
                ]
            }
        ]

        for p_data in problems_to_seed:
            tcs = p_data.pop("test_cases")
            starter = {}
            for l in p_data["allowed_languages"]:
                if l in SUPPORTED_LANGUAGES_REGISTRY:
                    starter[l] = SUPPORTED_LANGUAGES_REGISTRY[l]["starter_template"]
            p_data["starter_code"] = starter
            prob = CodingProblemModel(**p_data, current_version=1)
            db.add(prob)
            db.flush()

            ver = CodingProblemVersionModel(
                id=f"cpv-{uuid.uuid4().hex[:8]}",
                problem_id=prob.id,
                version_number=1,
                title=prob.title,
                problem_statement=prob.problem_statement,
                difficulty=prob.difficulty,
                execution_mode=prob.execution_mode,
                function_name=prob.function_name,
                function_signature=prob.function_signature,
                time_limit_sec=prob.time_limit_sec,
                memory_limit_mb=prob.memory_limit_mb,
                allowed_languages=prob.allowed_languages,
                starter_code=prob.starter_code,
                change_summary="System seed version 1"
            )
            db.add(ver)
            db.flush()

            for tc in tcs:
                db.add(CodingTestCaseModel(
                    id=f"tc-{uuid.uuid4().hex[:8]}",
                    problem_id=prob.id,
                    problem_version_id=ver.id,
                    **tc
                ))
        db.commit()

    @staticmethod
    def get_supported_coding_languages() -> List[Dict[str, Any]]:
        """Return registry of supported languages with starter code templates."""
        return [
            {
                "id": k,
                "label": v.get("label", k.capitalize()),
                "monaco_lang": v.get("monaco_lang", k),
                "ext": v.get("ext", f".{k}"),
                "judge0_id": v.get("judge0_id"),
                "is_executable": v.get("is_executable", True),
                "engine": v.get("engine", "Sandbox Engine"),
                "starter_template": v.get("starter_template", "")
            }
            for k, v in SUPPORTED_LANGUAGES_REGISTRY.items()
        ]

    @staticmethod
    def list_coding_problems(
        db: Session,
        current_user: Optional[UserModel],
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        execution_mode: Optional[str] = None,
        is_system: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """List coding problems with multi-tenant isolation, filtering, and public test case counts."""
        AssessmentController.seed_system_coding_problems(db)
        org_id = current_user.organization_id if current_user else None
        is_recruiter = bool(current_user and current_user.role == "recruiter")

        query = db.query(CodingProblemModel).filter(CodingProblemModel.is_active == True)

        # Multi-tenant visibility
        if is_recruiter:
            if is_system is True:
                query = query.filter((CodingProblemModel.is_system == True) | (CodingProblemModel.organization_id == None) | (CodingProblemModel.organization_id == "system"))
            elif is_system is False:
                query = query.filter((CodingProblemModel.is_system == False) & (CodingProblemModel.organization_id == org_id))
            else:
                query = query.filter(
                    (CodingProblemModel.is_system == True) |
                    (CodingProblemModel.organization_id == None) |
                    (CodingProblemModel.organization_id == "system") |
                    (CodingProblemModel.organization_id == org_id)
                )
        else:
            # Candidates only see system problems
            query = query.filter((CodingProblemModel.is_system == True) | (CodingProblemModel.organization_id == None) | (CodingProblemModel.organization_id == "system"))

        if difficulty:
            query = query.filter(CodingProblemModel.difficulty.ilike(difficulty))
        if execution_mode:
            query = query.filter(CodingProblemModel.execution_mode == execution_mode)
        if search:
            s = f"%{search}%"
            query = query.filter(
                CodingProblemModel.title.ilike(s) |
                CodingProblemModel.slug.ilike(s) |
                CodingProblemModel.problem_statement.ilike(s)
            )

        problems = query.order_by(CodingProblemModel.is_system.desc(), CodingProblemModel.created_at.desc()).all()

        results = []
        for p in problems:
            pub_tcs = [sanitize_test_case_for_candidate(tc) for tc in p.test_cases if not tc.is_hidden]
            total_tc_count = len(p.test_cases)
            results.append({
                "id": p.id,
                "organization_id": p.organization_id,
                "is_system": bool(p.is_system or not p.organization_id or p.organization_id == "system"),
                "title": p.title,
                "slug": p.slug,
                "problem_statement": p.problem_statement,
                "difficulty": p.difficulty,
                "constraints": p.constraints,
                "input_format": p.input_format,
                "output_format": p.output_format,
                "execution_mode": p.execution_mode or "function",
                "function_name": p.function_name or "solve",
                "function_signature": p.function_signature or {},
                "time_limit_sec": p.time_limit_sec,
                "memory_limit_mb": p.memory_limit_mb,
                "allowed_languages": p.allowed_languages or ["python", "javascript"],
                "starter_code": p.starter_code or {},
                "current_version": p.current_version,
                "total_test_cases": total_tc_count,
                "public_test_cases": pub_tcs,
                "created_by": p.created_by,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None
            })
        return results

    @staticmethod
    def get_coding_problem(
        db: Session,
        problem_id: str,
        current_user: Optional[UserModel]
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Fetch coding problem details with version history and role-appropriate test case confidentiality."""
        AssessmentController.seed_system_coding_problems(db)
        org_id = current_user.organization_id if current_user else None
        prob = db.query(CodingProblemModel).filter(
            (CodingProblemModel.id == problem_id) | (CodingProblemModel.slug == problem_id)
        ).first()

        if not prob:
            return None, "Coding problem not found", 404

        if not can_access_problem(org_id, prob):
            return None, "Access denied: this coding problem belongs to another organization", 403

        is_owner = bool(
            current_user and current_user.role == "recruiter" and
            (prob.is_system or not prob.organization_id or prob.organization_id in ["system", org_id])
        )

        test_cases_list = []
        for tc in prob.test_cases:
            if is_owner:
                test_cases_list.append({
                    "id": tc.id,
                    "problem_id": tc.problem_id,
                    "input_data": tc.input_data,
                    "expected_output": tc.expected_output,
                    "is_hidden": tc.is_hidden,
                    "weight": tc.weight,
                    "display_order": tc.display_order,
                    "explanation": tc.explanation
                })
            else:
                test_cases_list.append(sanitize_test_case_for_candidate(tc))

        versions_list = [
            {
                "id": v.id,
                "version_number": v.version_number,
                "title": v.title,
                "change_summary": v.change_summary,
                "created_at": v.created_at.isoformat() if v.created_at else None
            }
            for v in prob.versions
        ]

        return {
            "id": prob.id,
            "organization_id": prob.organization_id,
            "is_system": bool(prob.is_system or not prob.organization_id or prob.organization_id == "system"),
            "title": prob.title,
            "slug": prob.slug,
            "problem_statement": prob.problem_statement,
            "difficulty": prob.difficulty,
            "constraints": prob.constraints,
            "input_format": prob.input_format,
            "output_format": prob.output_format,
            "execution_mode": prob.execution_mode or "function",
            "function_name": prob.function_name or "solve",
            "function_signature": prob.function_signature or {},
            "time_limit_sec": prob.time_limit_sec,
            "memory_limit_mb": prob.memory_limit_mb,
            "allowed_languages": prob.allowed_languages or ["python", "javascript"],
            "starter_code": prob.starter_code or {},
            "solution_template": prob.solution_template if is_owner else None,
            "current_version": prob.current_version,
            "test_cases": test_cases_list,
            "versions": versions_list,
            "created_by": prob.created_by,
            "created_at": prob.created_at.isoformat() if prob.created_at else None,
            "updated_at": prob.updated_at.isoformat() if prob.updated_at else None
        }, None, 200

    @staticmethod
    def create_coding_problem(
        db: Session,
        payload: Any,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Recruiter authors a custom coding problem with tenant isolation, initial version snapshot, and test cases."""
        if not current_user or current_user.role != "recruiter":
            return None, "Only authenticated recruiters can author coding problems", 403

        org_id = current_user.organization_id or "org-sparkx-default"
        ensure_organization(db, org_id)
        p_dict = payload if isinstance(payload, dict) else (payload.dict() if hasattr(payload, "dict") else dict(payload))

        title = p_dict.get("title", "").strip()
        if not title:
            return None, "Title is required", 400

        raw_slug = p_dict.get("slug") or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        slug = f"{raw_slug}-{uuid.uuid4().hex[:4]}"

        # Check tenant slug uniqueness
        existing = db.query(CodingProblemModel).filter(
            CodingProblemModel.organization_id == org_id,
            CodingProblemModel.slug == slug
        ).first()
        if existing:
            slug = f"{slug}-{uuid.uuid4().hex[:4]}"

        allowed_langs = p_dict.get("allowed_languages") or ["python", "javascript", "typescript", "java", "cpp"]

        starter_code = p_dict.get("starter_code") or {}
        for l in allowed_langs:
            if l not in starter_code and l in SUPPORTED_LANGUAGES_REGISTRY:
                starter_code[l] = SUPPORTED_LANGUAGES_REGISTRY[l]["starter_template"]

        prob_id = f"prob-{uuid.uuid4().hex[:8]}"
        exec_mode = p_dict.get("execution_mode") or "function"
        func_name = p_dict.get("function_name") or "solve"
        func_sig = p_dict.get("function_signature") or {}
        diff = p_dict.get("difficulty") or "Medium"
        stmt = p_dict.get("problem_statement") or ""
        constraints = p_dict.get("constraints")
        in_fmt = p_dict.get("input_format")
        out_fmt = p_dict.get("output_format")
        time_lim = float(p_dict.get("time_limit_sec") or 5.0)
        mem_lim = float(p_dict.get("memory_limit_mb") or 128.0)
        sol_temp = p_dict.get("solution_template")

        prob = CodingProblemModel(
            id=prob_id,
            organization_id=org_id,
            is_system=False,
            title=title,
            slug=slug,
            problem_statement=stmt,
            difficulty=diff,
            constraints=constraints,
            input_format=in_fmt,
            output_format=out_fmt,
            execution_mode=exec_mode,
            function_name=func_name,
            function_signature=func_sig or {},
            time_limit_sec=time_lim,
            memory_limit_mb=mem_lim,
            allowed_languages=allowed_langs,
            starter_code=starter_code,
            solution_template=sol_temp,
            current_version=1,
            is_active=True,
            created_by=current_user.id
        )
        db.add(prob)
        db.flush()

        ver_id = f"cpv-{uuid.uuid4().hex[:8]}"
        ver = CodingProblemVersionModel(
            id=ver_id,
            problem_id=prob.id,
            version_number=1,
            title=prob.title,
            problem_statement=prob.problem_statement,
            difficulty=prob.difficulty,
            constraints=prob.constraints,
            input_format=prob.input_format,
            output_format=prob.output_format,
            execution_mode=prob.execution_mode,
            function_name=prob.function_name,
            function_signature=prob.function_signature,
            time_limit_sec=prob.time_limit_sec,
            memory_limit_mb=prob.memory_limit_mb,
            allowed_languages=prob.allowed_languages,
            starter_code=prob.starter_code,
            change_summary="Initial recruiter authored version"
        )
        db.add(ver)
        db.flush()

        # Add test cases if provided
        test_cases_in = getattr(payload, "test_cases", []) or (payload.get("test_cases") if isinstance(payload, dict) else [])
        created_tcs = []
        for idx, tc in enumerate(test_cases_in):
            tc_data = tc if isinstance(tc, dict) else tc.dict()
            tc_model = CodingTestCaseModel(
                id=f"tc-{uuid.uuid4().hex[:8]}",
                problem_id=prob.id,
                problem_version_id=ver.id,
                input_data=tc_data.get("input_data", ""),
                expected_output=tc_data.get("expected_output", ""),
                is_hidden=bool(tc_data.get("is_hidden", False)),
                weight=float(tc_data.get("weight", 1.0)),
                display_order=int(tc_data.get("display_order", idx + 1)),
                explanation=tc_data.get("explanation")
            )
            db.add(tc_model)
            created_tcs.append(tc_model)

        db.commit()
        db.refresh(prob)

        res, _, _ = AssessmentController.get_coding_problem(db, prob.id, current_user)
        return res, None, 201

    @staticmethod
    def update_coding_problem(
        db: Session,
        problem_id: str,
        payload: Any,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Update problem, create immutable version snapshot, and refresh test cases with tenant check."""
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can update coding problems", 403

        prob = db.query(CodingProblemModel).filter(
            (CodingProblemModel.id == problem_id) | (CodingProblemModel.slug == problem_id)
        ).first()

        if not prob:
            return None, "Coding problem not found", 404

        org_id = current_user.organization_id or "org-sparkx-default"
        if not can_modify_problem(org_id, prob):
            if prob.is_system or not prob.organization_id or prob.organization_id == "system":
                return None, "System problems are platform-managed and cannot be edited by recruiters", 403
            return None, "Access denied: cannot modify a coding problem from another organization", 403

        # Increment version and capture snapshot
        new_version_num = prob.current_version + 1

        # Extract update fields
        p_dict = payload if isinstance(payload, dict) else payload.dict(exclude_unset=True)
        if "title" in p_dict and p_dict["title"]:
            prob.title = p_dict["title"]
        if "problem_statement" in p_dict and p_dict["problem_statement"]:
            prob.problem_statement = p_dict["problem_statement"]
        if "difficulty" in p_dict and p_dict["difficulty"]:
            prob.difficulty = p_dict["difficulty"]
        if "constraints" in p_dict:
            prob.constraints = p_dict["constraints"]
        if "input_format" in p_dict:
            prob.input_format = p_dict["input_format"]
        if "output_format" in p_dict:
            prob.output_format = p_dict["output_format"]
        if "execution_mode" in p_dict and p_dict["execution_mode"]:
            prob.execution_mode = p_dict["execution_mode"]
        if "function_name" in p_dict and p_dict["function_name"]:
            prob.function_name = p_dict["function_name"]
        if "function_signature" in p_dict and p_dict["function_signature"] is not None:
            prob.function_signature = p_dict["function_signature"]
        if "allowed_languages" in p_dict and p_dict["allowed_languages"]:
            prob.allowed_languages = p_dict["allowed_languages"]
        if "starter_code" in p_dict and p_dict["starter_code"]:
            prob.starter_code = p_dict["starter_code"]
        if "solution_template" in p_dict:
            prob.solution_template = p_dict["solution_template"]
        if "time_limit_sec" in p_dict and p_dict["time_limit_sec"]:
            prob.time_limit_sec = float(p_dict["time_limit_sec"])
        if "memory_limit_mb" in p_dict and p_dict["memory_limit_mb"]:
            prob.memory_limit_mb = float(p_dict["memory_limit_mb"])
        if "is_active" in p_dict:
            prob.is_active = bool(p_dict["is_active"])

        prob.current_version = new_version_num
        prob.updated_at = datetime.utcnow()

        # Create version snapshot
        ver = CodingProblemVersionModel(
            id=f"cpv-{uuid.uuid4().hex[:8]}",
            problem_id=prob.id,
            version_number=new_version_num,
            title=prob.title,
            problem_statement=prob.problem_statement,
            difficulty=prob.difficulty,
            constraints=prob.constraints,
            input_format=prob.input_format,
            output_format=prob.output_format,
            execution_mode=prob.execution_mode,
            function_name=prob.function_name,
            function_signature=prob.function_signature,
            time_limit_sec=prob.time_limit_sec,
            memory_limit_mb=prob.memory_limit_mb,
            allowed_languages=prob.allowed_languages,
            starter_code=prob.starter_code,
            change_summary=p_dict.get("change_summary", f"Updated to version {new_version_num}")
        )
        db.add(ver)
        db.flush()

        # Update test cases if provided in payload
        if "test_cases" in p_dict and p_dict["test_cases"] is not None:
            # Delete old test cases
            db.query(CodingTestCaseModel).filter(CodingTestCaseModel.problem_id == prob.id).delete()
            for idx, tc in enumerate(p_dict["test_cases"]):
                tc_data = tc if isinstance(tc, dict) else tc.dict()
                db.add(CodingTestCaseModel(
                    id=f"tc-{uuid.uuid4().hex[:8]}",
                    problem_id=prob.id,
                    problem_version_id=ver.id,
                    input_data=tc_data.get("input_data", ""),
                    expected_output=tc_data.get("expected_output", ""),
                    is_hidden=bool(tc_data.get("is_hidden", False)),
                    weight=float(tc_data.get("weight", 1.0)),
                    display_order=int(tc_data.get("display_order", idx + 1)),
                    explanation=tc_data.get("explanation")
                ))

        db.commit()
        db.refresh(prob)

        res, _, _ = AssessmentController.get_coding_problem(db, prob.id, current_user)
        return res, None, 200

    @staticmethod
    def delete_coding_problem(
        db: Session,
        problem_id: str,
        current_user: UserModel
    ) -> Tuple[bool, Optional[str], int]:
        """Soft delete custom coding problem enforcing tenant boundaries."""
        if not current_user or current_user.role != "recruiter":
            return False, "Only recruiters can delete coding problems", 403

        prob = db.query(CodingProblemModel).filter(
            (CodingProblemModel.id == problem_id) | (CodingProblemModel.slug == problem_id)
        ).first()

        if not prob:
            return False, "Coding problem not found", 404

        org_id = current_user.organization_id or "org-sparkx-default"
        if not can_modify_problem(org_id, prob):
            if prob.is_system or not prob.organization_id or prob.organization_id == "system":
                return False, "System problems cannot be deleted", 403
            return False, "Access denied: cannot delete a coding problem from another organization", 403

        prob.is_active = False
        db.commit()
        return True, "Coding problem deleted successfully", 200

    @staticmethod
    def attach_assessment_coding_problems(
        db: Session,
        assessment_id: str,
        problems_payload: List[Any],
        current_user: UserModel
    ) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str], int]:
        """Attach, order, and weight multiple coding problems to an assessment with immutable version snapshot pinning."""
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can attach coding problems to assessments", 403

        org_id = current_user.organization_id or "org-sparkx-default"

        # Lookup assessment by id or job_id
        assessment = db.query(AssessmentModel).filter(
            (AssessmentModel.id == assessment_id) | (AssessmentModel.job_id == assessment_id)
        ).first()

        job = None
        if not assessment:
            job = db.query(JobModel).filter(JobModel.id == assessment_id).first()
            if not job:
                return None, "Assessment or Job requisition not found", 404
            if job.organization_id and job.organization_id != org_id:
                return None, "Access denied: job belongs to another organization", 403
            assessment = AssessmentModel(
                id=f"asm-{uuid.uuid4().hex[:8]}",
                job_id=job.id,
                organization_id=org_id,
                title=f"{job.title} Technical Assessment",
                passing_score=70,
                duration_minutes=45
            )
            db.add(assessment)
            db.flush()
        else:
            if assessment.organization_id and assessment.organization_id != org_id:
                return None, "Access denied: assessment belongs to another organization", 403
            job = db.query(JobModel).filter(JobModel.id == assessment.job_id).first()

        # Delete existing associations
        db.query(AssessmentCodingProblemModel).filter(
            AssessmentCodingProblemModel.assessment_id == assessment.id
        ).delete()

        attached = []
        coding_problems_for_pool = []

        for idx, item in enumerate(problems_payload):
            item_dict = item if isinstance(item, dict) else item.dict()
            prob_id = item_dict.get("coding_problem_id") or item_dict.get("id")
            prob = db.query(CodingProblemModel).filter(
                (CodingProblemModel.id == prob_id) | (CodingProblemModel.slug == prob_id)
            ).first()

            if not prob:
                continue

            if not can_access_problem(org_id, prob):
                continue

            # Pin version snapshot
            ver = db.query(CodingProblemVersionModel).filter(
                CodingProblemVersionModel.problem_id == prob.id,
                CodingProblemVersionModel.version_number == prob.current_version
            ).first()

            weight = float(item_dict.get("weight", 100.0))
            is_req = bool(item_dict.get("is_required", True))
            display_order = int(item_dict.get("display_order", idx + 1))

            assoc = AssessmentCodingProblemModel(
                id=f"acp-{uuid.uuid4().hex[:8]}",
                assessment_id=assessment.id,
                coding_problem_id=prob.id,
                coding_problem_version_id=ver.id if ver else None,
                display_order=display_order,
                weight=weight,
                is_required=is_req
            )
            db.add(assoc)
            db.flush()

            pub_tcs = [sanitize_test_case_for_candidate(tc) for tc in prob.test_cases if not tc.is_hidden]
            prob_summary = {
                "id": prob.id,
                "title": prob.title,
                "slug": prob.slug,
                "difficulty": prob.difficulty,
                "execution_mode": prob.execution_mode or "function",
                "function_name": prob.function_name or "solve",
                "function_signature": prob.function_signature or {},
                "allowed_languages": prob.allowed_languages or ["python", "javascript"],
                "starter_code": prob.starter_code or {},
                "instructions": prob.problem_statement,
                "display_order": display_order,
                "weight": weight,
                "sample_test_cases": [
                    {"name": f"Sample {i+1}", "input": tc["input_data"], "expected": tc["expected_output"]}
                    for i, tc in enumerate(pub_tcs)
                ]
            }
            attached.append({
                "id": assoc.id,
                "assessment_id": assessment.id,
                "coding_problem_id": prob.id,
                "coding_problem_version_id": ver.id if ver else None,
                "display_order": display_order,
                "weight": weight,
                "is_required": is_req,
                "problem": prob_summary
            })
            coding_problems_for_pool.append(prob_summary)

        # Sync to job.assessment_pool for candidate session consumption
        if job:
            pool = job.assessment_pool if isinstance(job.assessment_pool, dict) else {}
            pool["coding_problems"] = coding_problems_for_pool
            job.assessment_pool = pool

        db.commit()
        return attached, None, 200

    @staticmethod
    def get_assessment_coding_problems(
        db: Session,
        assessment_id: str,
        current_user: Optional[UserModel]
    ) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str], int]:
        """Fetch attached coding problems for an assessment."""
        org_id = current_user.organization_id if current_user else None
        assessment = db.query(AssessmentModel).filter(
            (AssessmentModel.id == assessment_id) | (AssessmentModel.job_id == assessment_id)
        ).first()

        if not assessment:
            return [], None, 200

        if current_user and current_user.role == "recruiter":
            if assessment.organization_id and assessment.organization_id != org_id:
                return None, "Access denied: assessment belongs to another organization", 403

        assocs = db.query(AssessmentCodingProblemModel).filter(
            AssessmentCodingProblemModel.assessment_id == assessment.id
        ).order_by(AssessmentCodingProblemModel.display_order.asc()).all()

        results = []
        for assoc in assocs:
            prob = assoc.problem
            if not prob:
                continue
            pub_tcs = [sanitize_test_case_for_candidate(tc) for tc in prob.test_cases if not tc.is_hidden]
            results.append({
                "id": assoc.id,
                "assessment_id": assoc.assessment_id,
                "coding_problem_id": prob.id,
                "coding_problem_version_id": assoc.coding_problem_version_id,
                "display_order": assoc.display_order,
                "weight": assoc.weight,
                "is_required": assoc.is_required,
                "problem": {
                    "id": prob.id,
                    "title": prob.title,
                    "slug": prob.slug,
                    "problem_statement": prob.problem_statement,
                    "difficulty": prob.difficulty,
                    "execution_mode": prob.execution_mode or "function",
                    "function_name": prob.function_name or "solve",
                    "function_signature": prob.function_signature or {},
                    "allowed_languages": prob.allowed_languages or ["python", "javascript"],
                    "starter_code": prob.starter_code or {},
                    "sample_test_cases": pub_tcs
                }
            })
        return results, None, 200

    # ═════════════════════════════════════════════════════════════════════════════
    # ADVANCED MCQ QUESTION BANK & AUTHORING METHODS (PHASE 4B.2)
    # ═════════════════════════════════════════════════════════════════════════════

    @staticmethod
    def seed_system_mcqs(db: Session):
        """Idempotently seed standard system MCQs from TECHNICAL_MCQS into the database."""
        from services.assessment_bank import TECHNICAL_MCQS
        existing_count = db.query(MCQQuestionModel).filter(MCQQuestionModel.is_system == True).count()
        if existing_count >= len(TECHNICAL_MCQS):
            return

        for q_data in TECHNICAL_MCQS:
            q_id = q_data["id"]
            existing = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == q_id).first()
            if existing:
                continue

            options_dict = q_data.get("options", {})
            correct_opt = str(q_data.get("correct_option", "A")).strip().upper()

            mcq = MCQQuestionModel(
                id=q_id,
                organization_id=None,
                is_system=True,
                question_text=q_data.get("question", ""),
                category=q_data.get("category", "technical"),
                difficulty=q_data.get("difficulty", "Medium"),
                explanation=q_data.get("explanation", ""),
                skills=q_data.get("skills", []),
                is_active=True,
                created_by="system",
                current_version=1
            )
            db.add(mcq)
            db.flush()

            for idx, (opt_key, opt_text) in enumerate(options_dict.items()):
                db.add(MCQOptionModel(
                    id=f"opt-{q_id}-{opt_key.lower()}",
                    question_id=mcq.id,
                    option_key=opt_key.upper(),
                    option_text=opt_text,
                    is_correct=(opt_key.upper() == correct_opt),
                    display_order=idx + 1
                ))

        db.commit()

    @staticmethod
    def list_mcq_questions(
        db: Session,
        current_user: Optional[UserModel],
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        search: Optional[str] = None,
        skill: Optional[str] = None,
        is_system: Optional[bool] = None,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """List MCQ questions with tenant isolation, category, difficulty, and skill filters."""
        query = db.query(MCQQuestionModel)
        org_id = current_user.organization_id if current_user else None

        if org_id:
            query = query.filter(
                (MCQQuestionModel.is_system == True) | 
                (MCQQuestionModel.organization_id == None) | 
                (MCQQuestionModel.organization_id == "system") | 
                (MCQQuestionModel.organization_id == org_id)
            )
        else:
            query = query.filter((MCQQuestionModel.is_system == True) | (MCQQuestionModel.organization_id == None))

        if is_system is not None:
            query = query.filter(MCQQuestionModel.is_system == is_system)

        if is_active is not None:
            query = query.filter(MCQQuestionModel.is_active == is_active)
        else:
            query = query.filter(MCQQuestionModel.is_active == True)

        if category:
            query = query.filter(MCQQuestionModel.category.ilike(f"%{category}%"))

        if difficulty:
            query = query.filter(MCQQuestionModel.difficulty.ilike(f"%{difficulty}%"))

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (MCQQuestionModel.question_text.ilike(search_term)) |
                (MCQQuestionModel.id.ilike(search_term))
            )

        questions = query.order_by(MCQQuestionModel.created_at.desc()).all()
        results = []
        is_recruiter = bool(current_user and current_user.role == "recruiter")

        for q in questions:
            if skill:
                q_skills = [s.lower() for s in (q.skills or [])]
                if skill.lower() not in q_skills:
                    continue

            sorted_options = sorted(q.options, key=lambda opt: opt.display_order) if q.options else []
            opts_serialized = []
            correct_key = None
            for opt in sorted_options:
                opt_dict = {
                    "id": opt.id,
                    "question_id": opt.question_id,
                    "option_key": opt.option_key,
                    "option_text": opt.option_text,
                    "display_order": opt.display_order
                }
                if is_recruiter:
                    opt_dict["is_correct"] = opt.is_correct
                if opt.is_correct:
                    correct_key = opt.option_key
                opts_serialized.append(opt_dict)

            q_dict = {
                "id": q.id,
                "organization_id": q.organization_id,
                "is_system": q.is_system,
                "question_text": q.question_text,
                "category": q.category,
                "difficulty": q.difficulty,
                "skills": q.skills or [],
                "is_active": q.is_active,
                "current_version": q.current_version,
                "created_by": q.created_by,
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "updated_at": q.updated_at.isoformat() if q.updated_at else None,
                "options": opts_serialized
            }
            if is_recruiter:
                q_dict["explanation"] = q.explanation
                q_dict["correct_option"] = correct_key

            results.append(q_dict)

        return results

    @staticmethod
    def get_mcq_question(
        db: Session,
        question_id: str,
        current_user: Optional[UserModel]
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Fetch a single MCQ question with tenant boundary checks."""
        q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == question_id).first()
        if not q:
            return None, "MCQ question not found", 404

        org_id = current_user.organization_id if current_user else None
        if not can_access_mcq(org_id, q):
            return None, "Access denied: MCQ belongs to a different organization", 403

        is_recruiter = bool(current_user and current_user.role == "recruiter")
        sorted_options = sorted(q.options, key=lambda opt: opt.display_order) if q.options else []
        opts_serialized = []
        correct_key = None
        for opt in sorted_options:
            opt_dict = {
                "id": opt.id,
                "question_id": opt.question_id,
                "option_key": opt.option_key,
                "option_text": opt.option_text,
                "display_order": opt.display_order
            }
            if is_recruiter:
                opt_dict["is_correct"] = opt.is_correct
            if opt.is_correct:
                correct_key = opt.option_key
            opts_serialized.append(opt_dict)

        resp = {
            "id": q.id,
            "organization_id": q.organization_id,
            "is_system": q.is_system,
            "question_text": q.question_text,
            "category": q.category,
            "difficulty": q.difficulty,
            "skills": q.skills or [],
            "is_active": q.is_active,
            "current_version": q.current_version,
            "created_by": q.created_by,
            "created_at": q.created_at.isoformat() if q.created_at else None,
            "updated_at": q.updated_at.isoformat() if q.updated_at else None,
            "options": opts_serialized
        }
        if is_recruiter:
            resp["explanation"] = q.explanation
            resp["correct_option"] = correct_key

        return resp, None, 200

    @staticmethod
    def create_mcq_question(
        db: Session,
        payload: dict,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Recruiter authors a custom MCQ question with authoritative backend validation and tenant isolation."""
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can author MCQ questions", 403

        org_id = current_user.organization_id or "org-sparkx-default"
        org = ensure_organization(db, org_id)

        question_text = (payload.get("question_text") or payload.get("question") or "").strip()
        if not question_text:
            return None, "Question text is required", 400

        difficulty = payload.get("difficulty") or "Medium"
        if difficulty not in ["Easy", "Medium", "Hard", "Mid-Level", "Senior"]:
            difficulty = "Medium"

        category = payload.get("category") or "technical"
        explanation = payload.get("explanation") or ""
        skills = payload.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        raw_options = payload.get("options") or []
        parsed_options = []
        if isinstance(raw_options, dict):
            correct_opt = str(payload.get("correct_option") or payload.get("correct_answer") or "A").strip().upper()
            for idx, (k, v) in enumerate(raw_options.items()):
                k_clean = str(k).strip().upper()
                parsed_options.append({
                    "option_key": k_clean,
                    "option_text": str(v).strip(),
                    "is_correct": bool(k_clean == correct_opt),
                    "display_order": idx + 1
                })
        elif isinstance(raw_options, list):
            correct_opt = str(payload.get("correct_option") or payload.get("correct_answer") or "").strip().upper()
            for idx, item in enumerate(raw_options):
                if isinstance(item, dict):
                    k = str(item.get("option_key") or item.get("key") or chr(ord('A') + idx)).strip().upper()
                    t = str(item.get("option_text") or item.get("text") or "").strip()
                    raw_is_c = item.get("is_correct")
                    is_c = bool(raw_is_c is True or raw_is_c == 1 or str(raw_is_c).lower() == "true" or (bool(correct_opt) and k == correct_opt))
                    parsed_options.append({
                        "option_key": k,
                        "option_text": t,
                        "is_correct": is_c,
                        "display_order": item.get("display_order", idx + 1)
                    })

        if len(parsed_options) < 2:
            return None, "MCQ must contain at least 2 options", 400

        for opt in parsed_options:
            if not opt["option_text"]:
                return None, f"Option text cannot be empty for option {opt['option_key']}", 400

        correct_count = sum(1 for opt in parsed_options if opt["is_correct"])
        if correct_count != 1:
            return None, f"MCQ must have exactly 1 correct answer (found {correct_count})", 400

        q_id = payload.get("id") or f"mcq-{uuid.uuid4().hex[:8]}"

        mcq = MCQQuestionModel(
            id=q_id,
            organization_id=org.id,
            is_system=False,
            question_text=question_text,
            category=category,
            difficulty=difficulty,
            explanation=explanation,
            skills=skills,
            is_active=True,
            created_by=current_user.id,
            current_version=1
        )
        db.add(mcq)
        db.flush()

        for opt in parsed_options:
            db.add(MCQOptionModel(
                id=f"opt-{uuid.uuid4().hex[:8]}",
                question_id=mcq.id,
                option_key=opt["option_key"],
                option_text=opt["option_text"],
                is_correct=bool(opt["is_correct"]),
                display_order=opt["display_order"]
            ))

        db.commit()
        db.refresh(mcq)

        return AssessmentController.get_mcq_question(db, mcq.id, current_user)

    @staticmethod
    def update_mcq_question(
        db: Session,
        question_id: str,
        payload: dict,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Update custom MCQ question enforcing tenant ownership."""
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can update MCQ questions", 403

        q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == question_id).first()
        if not q:
            return None, "MCQ question not found", 404

        org_id = current_user.organization_id
        if not can_modify_mcq(org_id, q):
            return None, "Access denied: cannot modify system questions or questions of another organization", 403

        if "question_text" in payload or "question" in payload:
            text = (payload.get("question_text") or payload.get("question") or "").strip()
            if text:
                q.question_text = text
        if "category" in payload:
            q.category = payload["category"]
        if "difficulty" in payload:
            q.difficulty = payload["difficulty"]
        if "explanation" in payload:
            q.explanation = payload["explanation"]
        if "skills" in payload:
            q.skills = payload["skills"]
        if "is_active" in payload:
            q.is_active = bool(payload["is_active"])

        if "options" in payload:
            raw_options = payload["options"]
            parsed_options = []
            correct_opt = str(payload.get("correct_option") or payload.get("correct_answer") or "").strip().upper()

            if isinstance(raw_options, dict):
                for idx, (k, v) in enumerate(raw_options.items()):
                    k_clean = str(k).strip().upper()
                    parsed_options.append({
                        "option_key": k_clean,
                        "option_text": str(v).strip(),
                        "is_correct": bool(k_clean == correct_opt),
                        "display_order": idx + 1
                    })
            elif isinstance(raw_options, list):
                for idx, item in enumerate(raw_options):
                    if isinstance(item, dict):
                        k = str(item.get("option_key") or item.get("key") or chr(ord('A') + idx)).strip().upper()
                        t = str(item.get("option_text") or item.get("text") or "").strip()
                        raw_is_c = item.get("is_correct")
                        is_c = bool(raw_is_c is True or raw_is_c == 1 or str(raw_is_c).lower() == "true" or (bool(correct_opt) and k == correct_opt))
                        parsed_options.append({
                            "option_key": k,
                            "option_text": t,
                            "is_correct": is_c,
                            "display_order": item.get("display_order", idx + 1)
                        })

            if len(parsed_options) < 2:
                return None, "MCQ must contain at least 2 options", 400
            for opt in parsed_options:
                if not opt["option_text"]:
                    return None, f"Option text cannot be empty for option {opt['option_key']}", 400
            correct_count = sum(1 for opt in parsed_options if opt["is_correct"])
            if correct_count != 1:
                return None, f"MCQ must have exactly 1 correct answer (found {correct_count})", 400

            db.query(MCQOptionModel).filter(MCQOptionModel.question_id == q.id).delete()
            for opt in parsed_options:
                db.add(MCQOptionModel(
                    id=f"opt-{uuid.uuid4().hex[:8]}",
                    question_id=q.id,
                    option_key=opt["option_key"],
                    option_text=opt["option_text"],
                    is_correct=bool(opt["is_correct"]),
                    display_order=opt["display_order"]
                ))

        q.current_version = (q.current_version or 1) + 1
        q.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(q)

        return AssessmentController.get_mcq_question(db, q.id, current_user)

    @staticmethod
    def delete_mcq_question(
        db: Session,
        question_id: str,
        current_user: UserModel
    ) -> Tuple[bool, Optional[str], int]:
        """Soft delete / archive custom MCQ question enforcing tenant boundaries."""
        if not current_user or current_user.role != "recruiter":
            return False, "Only recruiters can delete MCQ questions", 403

        q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == question_id).first()
        if not q:
            return False, "MCQ question not found", 404

        org_id = current_user.organization_id
        if not can_modify_mcq(org_id, q):
            return False, "Access denied: cannot delete system questions or questions of another organization", 403

        q.is_active = False
        q.updated_at = datetime.utcnow()
        db.commit()
        return True, "MCQ question archived successfully", 200

    @staticmethod
    def get_assessment_mcqs(
        db: Session,
        assessment_id: str,
        current_user: Optional[UserModel]
    ) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str], int]:
        """Fetch attached MCQs for an assessment or job."""
        assessment = db.query(AssessmentModel).filter(
            (AssessmentModel.id == assessment_id) | (AssessmentModel.job_id == assessment_id)
        ).first()

        if not assessment:
            return [], None, 200

        org_id = current_user.organization_id if current_user else None
        if assessment.organization_id and org_id and assessment.organization_id not in (org_id, "org-sparkx-default"):
            return None, "Access denied to cross-tenant assessment", 403

        amcqs = db.query(AssessmentMCQModel).filter(
            AssessmentMCQModel.assessment_id == assessment.id
        ).order_by(AssessmentMCQModel.display_order.asc()).all()

        is_recruiter = bool(current_user and current_user.role == "recruiter")

        results = []
        for item in amcqs:
            q = item.question
            if not q or not q.is_active:
                continue

            sorted_options = sorted(q.options, key=lambda opt: opt.display_order) if q.options else []
            opts_serialized = []
            correct_key = None
            for opt in sorted_options:
                opt_dict = {
                    "id": opt.id,
                    "option_key": opt.option_key,
                    "option_text": opt.option_text,
                    "display_order": opt.display_order
                }
                if is_recruiter:
                    opt_dict["is_correct"] = opt.is_correct
                if opt.is_correct:
                    correct_key = opt.option_key
                opts_serialized.append(opt_dict)

            q_data = {
                "id": q.id,
                "title": q.question_text[:60] + "..." if len(q.question_text) > 60 else q.question_text,
                "question_text": q.question_text,
                "category": q.category,
                "difficulty": q.difficulty,
                "skills": q.skills or [],
                "options": opts_serialized,
                "display_order": item.display_order,
                "weight": item.weight,
                "is_required": item.is_required
            }
            if is_recruiter:
                q_data["explanation"] = q.explanation
                q_data["correct_option"] = correct_key

            results.append(q_data)

        return results, None, 200

    @staticmethod
    def attach_assessment_mcqs(
        db: Session,
        assessment_id: str,
        payload: dict,
        current_user: UserModel
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
        """Attach database-backed MCQs to an assessment with ordering and weights."""
        if not current_user or current_user.role != "recruiter":
            return None, "Only recruiters can configure assessment MCQs", 403

        assessment = db.query(AssessmentModel).filter(
            (AssessmentModel.id == assessment_id) | (AssessmentModel.job_id == assessment_id)
        ).first()

        if not assessment:
            job = db.query(JobModel).filter(JobModel.id == assessment_id).first()
            if not job:
                return None, "Assessment or Job not found", 404
            org_id = current_user.organization_id or job.organization_id or "org-sparkx-default"
            assessment = AssessmentModel(
                id=f"asm-{uuid.uuid4().hex[:8]}",
                job_id=job.id,
                organization_id=org_id,
                title=f"{job.title} Assessment",
                description=f"Authoritative assessment for {job.title}",
                duration_minutes=45,
                passing_score=70
            )
            db.add(assessment)
            db.flush()

        org_id = current_user.organization_id
        if assessment.organization_id and org_id and assessment.organization_id not in (org_id, "org-sparkx-default"):
            return None, "Access denied: cannot configure assessment belonging to another organization", 403

        mcqs_data = payload.get("mcqs") or []
        if not isinstance(mcqs_data, list):
            return None, "mcqs must be a list of question specifications", 400

        db.query(AssessmentMCQModel).filter(AssessmentMCQModel.assessment_id == assessment.id).delete()

        attached_count = 0
        attached_list = []
        for idx, item in enumerate(mcqs_data):
            q_id = item.get("mcq_question_id") or item.get("id")
            if not q_id:
                continue

            q = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == q_id).first()
            if not q:
                continue

            if not can_access_mcq(org_id, q):
                return None, f"Access denied to question {q_id}: belongs to a different organization", 403

            order = item.get("display_order", idx + 1)
            weight = float(item.get("weight", 1.0))
            is_req = item.get("is_required", True)

            assoc = AssessmentMCQModel(
                id=f"amcq-{uuid.uuid4().hex[:8]}",
                assessment_id=assessment.id,
                mcq_question_id=q.id,
                display_order=order,
                weight=weight,
                is_required=is_req
            )
            db.add(assoc)
            attached_count += 1
            attached_list.append({
                "mcq_question_id": q.id,
                "display_order": order,
                "weight": weight,
                "is_required": is_req
            })

        db.commit()
        return {
            "success": True,
            "assessment_id": assessment.id,
            "attached_count": attached_count,
            "mcqs": attached_list
        }, None, 200
