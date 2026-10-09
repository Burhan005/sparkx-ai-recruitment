"""
(C) SparkX AI Recruitment Platform
Phase 4E.9 — Authoritative Candidate Decision Service

Orchestrates evidence-backed recruiter hiring decisions using persisted candidate evidence,
Phase 4E.7 Scorecards, Phase 4E.8 Candidate Comparison contexts, and 4D state transitions.
"""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.db_models import (
    CandidateModel,
    JobModel,
    UserModel,
    CandidateStateLogModel,
)
from schemas import (
    HiringDecisionUpdate,
    CandidateDecisionContextResponse,
    DecisionContextScorecardSummary,
    DecisionEvidenceItem,
    DecisionGapItem,
    DecisionHistoryItem,
    GroundedRationaleOption,
)
from workflow_contract import (
    ALLOWED_DECISION_TRANSITIONS,
    FINAL_DECISIONS,
    is_final_decision,
    DECISION_UNDECIDED,
    DECISION_SHORTLISTED,
    DECISION_SELECTED,
    DECISION_REJECTED,
)
from services.candidate_scorecard_service import CandidateScorecardService
from controllers.candidate_controller import CandidateController


class CandidateDecisionService:
    """Authoritative service for evidence-grounded hiring decisions and audit ledgers."""

    @staticmethod
    def get_decision_context(
        candidate_id: str,
        job_id: Optional[str],
        db: Session,
        current_user: UserModel,
        comparison_context: Optional[Dict[str, Any]] = None
    ) -> CandidateDecisionContextResponse:
        """
        Retrieves the complete, authoritative evidence-grounded decision context for a candidate.
        Strictly enforces tenant isolation, candidate-job alignment, and zero-hardcoding principles.
        """
        # 1. Candidate lookup & existence check
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # 2. Multi-Tenant Authorization Guard
        user_org = getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        cand_org = getattr(candidate, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if cand_org != user_org:
            raise HTTPException(
                status_code=403,
                detail="Cross-tenant access forbidden: Candidate belongs to another organization."
            )

        # 3. Target Requisition / Job Resolution
        target_job_id = job_id or candidate.job_id
        if not target_job_id:
            raise HTTPException(status_code=400, detail="Candidate has no associated job opening.")

        job = db.query(JobModel).filter(JobModel.id == target_job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Target job requisition not found.")

        job_org = getattr(job, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if job_org != user_org:
            raise HTTPException(
                status_code=403,
                detail="Cross-tenant access forbidden: Job belongs to another organization."
            )

        if str(candidate.job_id) != str(target_job_id):
            raise HTTPException(
                status_code=400,
                detail=f"Candidate did not apply to target job opening '{target_job_id}'."
            )

        # 4. Authoritative Scorecard Retrieval (Reusing Phase 4E.7 single-source engine)
        scorecard = CandidateScorecardService.get_scorecard(
            candidate_id=candidate.id,
            job_id=target_job_id,
            db=db,
            current_user=current_user
        )

        tier_labels = {
            "STRONG_FIT": "Strong Fit",
            "GOOD_FIT": "Good Fit",
            "MODERATE_FIT": "Moderate Fit",
            "LIMITED_FIT": "Limited Fit",
        }

        # Safe attribute / dict accessor helper
        def _get(obj, key, default=None):
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)

        sc_summary = scorecard.get("summary", {}) if isinstance(scorecard, dict) else getattr(scorecard, "summary", {})
        sc_evals = scorecard.get("skill_evaluations", []) if isinstance(scorecard, dict) else getattr(scorecard, "skill_evaluations", [])
        sc_gaps = scorecard.get("skill_gaps", []) if isinstance(scorecard, dict) else getattr(scorecard, "skill_gaps", [])
        sc_evidence = scorecard.get("evidence_summary", {}) if isinstance(scorecard, dict) else getattr(scorecard, "evidence_summary", {})

        fit_tier = _get(sc_summary, "fit_tier", "MODERATE_FIT")
        scorecard_summary = DecisionContextScorecardSummary(
            fit_score=float(_get(sc_summary, "overall_fit_score", 0.0) or 0.0),
            fit_tier=fit_tier,
            fit_tier_label=tier_labels.get(fit_tier, "Moderate Fit"),
            must_have_coverage=float(_get(sc_summary, "required_skill_coverage", 0.0) or 0.0),
            preferred_coverage=float(_get(sc_summary, "preferred_skill_coverage", 0.0) or 0.0),
            verified_evidence_count=int(_get(sc_summary, "total_verified_skills", 0) or 0),
            evidenced_count=int(_get(sc_summary, "total_evidenced_skills", 0) or 0),
            claimed_count=int(_get(sc_summary, "total_claimed_skills", 0) or 0),
            missing_count=int(_get(sc_summary, "total_missing_skills", 0) or 0),
            total_requirements=int(_get(sc_summary, "total_job_skills", 0) or 0),
        )

        # 5. Extract Strongest Supporting Evidence (Status in VERIFIED, EVIDENCED)
        evidence_items: List[DecisionEvidenceItem] = []
        for eval_item in sc_evals:
            status = _get(eval_item, "status")
            if status in ["VERIFIED", "EVIDENCED"]:
                highlights: List[str] = []
                for ev in _get(eval_item, "evidence", []):
                    src_title = _get(ev, "source_title") or _get(ev, "evidence_type") or "Platform Assessment"
                    score_num = _get(ev, "score_contribution")
                    if score_num is not None and score_num > 0:
                        highlights.append(f"{src_title}: {int(score_num)}%")
                    elif _get(ev, "snippet"):
                        highlights.append(f"{src_title}: {_get(ev, 'snippet')[:35]}")
                    else:
                        highlights.append(src_title)

                evidence_items.append(
                    DecisionEvidenceItem(
                        skill_name=_get(eval_item, "skill_name", "Skill"),
                        category=_get(eval_item, "category") or "General",
                        importance=_get(eval_item, "requirement_type", "must_have"),
                        status=status,
                        proficiency=_get(eval_item, "candidate_proficiency"),
                        years_of_experience=_get(eval_item, "candidate_years"),
                        evidence_sources=_get(eval_item, "supported_sources") or [],
                        evidence_count=int(_get(eval_item, "evidence_count", 0) or 0),
                        recency_label=_get(eval_item, "recency_label") or "Recent",
                        highlights=highlights[:4],
                    )
                )

        # Sort: VERIFIED first, then evidence count descending
        evidence_items.sort(
            key=lambda x: (1 if x.status == "VERIFIED" else 0, x.evidence_count),
            reverse=True
        )

        # 6. Extract Material Gaps & Risks (Status in MISSING, CLAIMED)
        material_gaps: List[DecisionGapItem] = []
        for eval_item in sc_evals:
            status = _get(eval_item, "status")
            if status in ["MISSING", "CLAIMED"]:
                skill_name = _get(eval_item, "skill_name", "Skill")
                matching_gap = next(
                    (g for g in sc_gaps if _get(g, "skill_name", "").lower() == skill_name.lower()),
                    None
                )
                mitigation = _get(matching_gap, "mitigation_recommendation") if matching_gap else (
                    f"Evaluate {skill_name} via technical assessment or targeted interview questions."
                )

                material_gaps.append(
                    DecisionGapItem(
                        skill_name=skill_name,
                        importance=_get(eval_item, "requirement_type", "must_have"),
                        status=status,
                        required_proficiency=_get(eval_item, "required_proficiency"),
                        candidate_proficiency=_get(eval_item, "candidate_proficiency"),
                        mitigation_recommendation=mitigation,
                    )
                )

        # Sort: required / must-have gaps first
        material_gaps.sort(
            key=lambda x: (1 if x.importance == "must_have" or x.importance == "required" else 0, 1 if x.status == "MISSING" else 0),
            reverse=True
        )

        # 7. Decision Audit History
        raw_logs = (
            db.query(CandidateStateLogModel)
            .filter(
                CandidateStateLogModel.candidate_id == candidate.id,
                CandidateStateLogModel.dimension == "hiring_decision"
            )
            .order_by(CandidateStateLogModel.created_at.desc())
            .all()
        )

        user_ids_in_logs = {l.changed_by for l in raw_logs if l.changed_by}
        users_map = {}
        if user_ids_in_logs:
            matched_users = (
                db.query(UserModel)
                .filter(UserModel.email.in_(user_ids_in_logs))
                .all()
            )
            users_map = {u.email: u.name for u in matched_users}

        decision_history: List[DecisionHistoryItem] = []
        for log in raw_logs:
            decision_history.append(
                DecisionHistoryItem(
                    id=log.id,
                    candidate_id=log.candidate_id,
                    from_decision=log.from_value,
                    to_decision=log.to_value,
                    changed_by=log.changed_by or "system",
                    changed_by_name=users_map.get(log.changed_by, log.changed_by or "Recruiter"),
                    rationale_category=getattr(log, "rationale_category", None),
                    notes=log.notes or "",
                    created_at=log.created_at.isoformat() if log.created_at else None,
                )
            )

        # 8. Allowed State Transitions
        current_dec = (candidate.hiring_decision or DECISION_UNDECIDED).lower().strip()
        allowed_transitions = ALLOWED_DECISION_TRANSITIONS.get(current_dec, [])

        # 9. Grounded Rationale Options (Strictly derived from persisted candidate realities)
        grounded_options: List[GroundedRationaleOption] = []
        overall_fit = float(_get(sc_summary, "overall_fit_score", 0.0) or 0.0)
        req_cov = float(_get(sc_summary, "required_skill_coverage", 0.0) or 0.0)
        pref_cov = float(_get(sc_summary, "preferred_skill_coverage", 0.0) or 0.0)
        coding_ev_count = int(_get(sc_evidence, "coding_evidence_count", 0) or 0)
        interview_ev_count = int(_get(sc_evidence, "interview_evidence_count", 0) or 0)
        mis_req = int(_get(sc_summary, "missing_required_count", 0) or 0)
        cla_req = int(_get(sc_summary, "claimed_required_count", 0) or 0)
        tot_ver = int(_get(sc_summary, "total_verified_skills", 0) or 0)
        tot_pref = int(_get(sc_summary, "total_preferred_skills", 0) or 0)

        if overall_fit >= 80:
            grounded_options.append(
                GroundedRationaleOption(
                    id="strong_fit",
                    label="Strong verified technical fit across required competencies",
                    type="positive",
                    grounded_evidence=f"{overall_fit}% overall scorecard match score."
                )
            )

        if req_cov >= 100:
            grounded_options.append(
                GroundedRationaleOption(
                    id="full_must_have",
                    label="100% must-have core requirements verified",
                    type="positive",
                    grounded_evidence="All required skills satisfied with verified evidence."
                )
            )

        if coding_ev_count > 0:
            grounded_options.append(
                GroundedRationaleOption(
                    id="coding_proven",
                    label="Demonstrated hands-on technical competency in coding assessment",
                    type="positive",
                    grounded_evidence=f"{coding_ev_count} sandbox coding submission proof point(s)."
                )
            )

        if interview_ev_count > 0:
            grounded_options.append(
                GroundedRationaleOption(
                    id="interview_cleared",
                    label="Cleared technical panel interview with strong performance",
                    type="positive",
                    grounded_evidence=f"{interview_ev_count} structured interview evaluation record(s)."
                )
            )

        if mis_req > 0:
            grounded_options.append(
                GroundedRationaleOption(
                    id="missing_must_have",
                    label=f"Missing {mis_req} critical must-have core requirement(s)",
                    type="gap",
                    grounded_evidence=f"{mis_req} missing required skill(s) detected."
                )
            )

        if cla_req > 0 and tot_ver < 2:
            grounded_options.append(
                GroundedRationaleOption(
                    id="insufficient_verified_evidence",
                    label="Self-reported claims require independent assessment proof",
                    type="gap",
                    grounded_evidence=f"{cla_req} claimed skill(s) without assessment proof."
                )
            )

        if pref_cov < 50 and tot_pref > 0:
            grounded_options.append(
                GroundedRationaleOption(
                    id="preferred_skills_gap",
                    label="Meets core requirements but has gaps in preferred competencies",
                    type="caution",
                    grounded_evidence=f"{pref_cov}% preferred coverage."
                )
            )

        grounded_options.append(
            GroundedRationaleOption(
                id="better_aligned_cohort",
                label="Candidate profile reviewed; cohort contains applicants with tighter alignment",
                type="caution",
                grounded_evidence="Recruiter pipeline cohort comparison context."
            )
        )

        return CandidateDecisionContextResponse(
            candidate_id=candidate.id,
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            job_id=job.id,
            job_title=job.title,
            department=getattr(job, "department", None),
            current_stage=candidate.stage or "screening",
            current_decision=current_dec,
            recruiter_score=candidate.recruiter_score,
            is_final_decision=is_final_decision(current_dec),
            is_reopened=bool(candidate.reopened_at or candidate.reopen_reason),
            reopened_at=candidate.reopened_at.isoformat() if candidate.reopened_at else None,
            reopened_by=candidate.reopened_by,
            reopen_reason=candidate.reopen_reason,
            previous_final_decision=candidate.previous_final_decision,
            scorecard=scorecard_summary,
            strongest_evidence=evidence_items,
            material_gaps=material_gaps,
            decision_history=decision_history,
            allowed_transitions=allowed_transitions,
            grounded_rationale_options=grounded_options,
            comparison_context=comparison_context,
            rejection_category=candidate.rejection_category,
            rejection_reason=candidate.rejection_reason,
            hr_notes=candidate.hr_notes or "",
        )

    @staticmethod
    def record_decision(
        candidate_id: str,
        payload: HiringDecisionUpdate,
        db: Session,
        current_user: UserModel
    ) -> CandidateModel:
        """
        Records a validated, evidence-based hiring decision transition.
        Enforces 4D state machine rules, terminal immutability, and full audit logging.
        """
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        user_org = getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        cand_org = getattr(candidate, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if cand_org != user_org:
            raise HTTPException(
                status_code=403,
                detail="Cross-tenant access forbidden: Candidate belongs to another organization."
            )

        if payload.job_id and str(payload.job_id) != str(candidate.job_id):
            raise HTTPException(
                status_code=400,
                detail=f"Candidate did not apply to target job opening '{payload.job_id}'."
            )

        # Delegate to authoritative CandidateController for transition validation & persistence
        updated_cand, err = CandidateController.update_hiring_decision(
            candidate_id=candidate.id,
            new_decision=payload.decision,
            recruiter_score=payload.recruiter_score,
            rejection_reason=payload.rejection_reason,
            rejection_category=payload.rejection_category,
            hr_notes=payload.hr_notes or "",
            rationale_category=payload.rationale_category,
            rationale_note=payload.rationale_note,
            changed_by=current_user.email,
            db=db,
            organization_id=user_org,
        )

        if err:
            raise HTTPException(status_code=400, detail=err)

        return updated_cand

    @staticmethod
    def get_decision_history(
        candidate_id: str,
        db: Session,
        current_user: UserModel
    ) -> List[DecisionHistoryItem]:
        """
        Retrieves the immutable decision audit history specifically for the candidate.
        """
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        user_org = getattr(current_user, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        cand_org = getattr(candidate, "organization_id", "org-sparkx-default") or "org-sparkx-default"
        if cand_org != user_org:
            raise HTTPException(
                status_code=403,
                detail="Cross-tenant access forbidden: Candidate belongs to another organization."
            )

        raw_logs = (
            db.query(CandidateStateLogModel)
            .filter(
                CandidateStateLogModel.candidate_id == candidate.id,
                CandidateStateLogModel.dimension == "hiring_decision"
            )
            .order_by(CandidateStateLogModel.created_at.desc())
            .all()
        )

        user_ids = {l.changed_by for l in raw_logs if l.changed_by}
        users_map = {}
        if user_ids:
            matched_users = db.query(UserModel).filter(UserModel.email.in_(user_ids)).all()
            users_map = {u.email: u.name for u in matched_users}

        history: List[DecisionHistoryItem] = []
        for log in raw_logs:
            history.append(
                DecisionHistoryItem(
                    id=log.id,
                    candidate_id=log.candidate_id,
                    from_decision=log.from_value,
                    to_decision=log.to_value,
                    changed_by=log.changed_by or "system",
                    changed_by_name=users_map.get(log.changed_by, log.changed_by or "Recruiter"),
                    rationale_category=getattr(log, "rationale_category", None),
                    notes=log.notes or "",
                    created_at=log.created_at.isoformat() if log.created_at else None,
                )
            )

        return history
