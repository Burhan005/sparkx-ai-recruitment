"""
(S) Candidate Scorecard Service - Evidence-Based Candidate Scorecard Engine
Phase 4E.7: Production-grade, database-backed candidate evaluation contextual to Candidate + Job.
Derives all insights exclusively from persisted relational models and deterministic calculations.
Zero hardcoding, zero mock data, zero LLM-generated scores.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.db_models import (
    CandidateModel, JobModel, UserModel,
    JobSkillRequirementModel, CandidateSkillModel, SkillEvidenceModel,
    SkillModel
)
from services.skill_service import SkillService
from services.skill_passport_service import (
    format_recency_label,
    determine_evidence_strength,
    SkillPassportService
)
from services.skill_matching_service import VERIFICATION_PASS_THRESHOLD


# Deterministic satisfaction factors for overall job fit calculation
SCORECARD_STATUS_FACTORS: Dict[str, float] = {
    "VERIFIED": 1.0,
    "EVIDENCED": 0.65,
    "CLAIMED": 0.25,
    "MISSING": 0.0,
}


class CandidateScorecardService:

    @staticmethod
    def get_scorecard(
        candidate_id: str,
        job_id: str,
        db: Session,
        current_user: Optional[UserModel] = None
    ) -> Dict[str, Any]:
        """
        Generates an authoritative, explainable Evidence-Based Candidate Scorecard
        for a specific candidate against a specific job opening.
        """
        # 1. Authoritative lookup & validation
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")

        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        # 2. Multi-tenant isolation verification
        if candidate.organization_id and job.organization_id:
            if candidate.organization_id != job.organization_id:
                raise PermissionError("Cross-tenant access forbidden: Candidate and Job belong to different organizations")

        if current_user:
            user_role = getattr(current_user, "role", None) or (current_user.get("role") if isinstance(current_user, dict) else None)
            user_org = getattr(current_user, "organization_id", None) or (current_user.get("organization_id") if isinstance(current_user, dict) else None)
            user_id = getattr(current_user, "id", None) or (current_user.get("id") if isinstance(current_user, dict) else None)
            user_email = getattr(current_user, "email", None) or (current_user.get("email") if isinstance(current_user, dict) else None)

            if user_role == "recruiter":
                if user_org and candidate.organization_id and user_org != candidate.organization_id:
                    raise PermissionError(f"Recruiter organization '{user_org}' does not match candidate tenant")
            elif user_role == "candidate":
                user_matches = (
                    (candidate.user_id and user_id == candidate.user_id) or
                    (candidate.email and user_email and user_email.lower() == candidate.email.lower())
                )
                if not user_matches:
                    raise PermissionError("Access denied: You are not authorized to view another candidate's scorecard")

        # 3. Retrieve authoritative job requirements
        job_reqs = (
            db.query(JobSkillRequirementModel)
            .filter(JobSkillRequirementModel.job_id == job_id)
            .all()
        )

        # If job requirements not yet mapped relationally, auto-sync from job.required_skills
        if not job_reqs and getattr(job, "required_skills", None):
            SkillService.sync_job_skill_requirements(job_id, job.required_skills, db)
            job_reqs = (
                db.query(JobSkillRequirementModel)
                .filter(JobSkillRequirementModel.job_id == job_id)
                .all()
            )

        # 4. Retrieve candidate's relational skills
        cand_skills = (
            db.query(CandidateSkillModel)
            .filter(CandidateSkillModel.candidate_id == candidate_id)
            .all()
        )
        cand_skill_map = {cs.skill_id: cs for cs in cand_skills}

        # Also support lookup by skill slug or canonical name for alias robustness
        cand_slug_map = {}
        for cs in cand_skills:
            if cs.skill:
                cand_slug_map[cs.skill.slug] = cs
                cand_slug_map[cs.skill.name.lower()] = cs

        # 5. Evaluate skill-by-skill
        evaluated_skills: List[Dict[str, Any]] = []
        must_have_items: List[Dict[str, Any]] = []
        preferred_items: List[Dict[str, Any]] = []

        total_weighted_points = 0.0
        earned_weighted_points = 0.0

        all_candidate_evidence: List[Dict[str, Any]] = []

        for req in job_reqs:
            canonical_skill = req.skill
            skill_name = canonical_skill.name if canonical_skill else "Skill"
            skill_slug = canonical_skill.slug if canonical_skill else "skill"
            category = canonical_skill.category if canonical_skill else "General Competencies"

            req_type = (req.requirement_type or "must_have").lower()
            req_weight = float(req.weight if req.weight is not None else 1.0)
            type_multiplier = 2.0 if req_type == "must_have" else 1.0
            effective_weight = req_weight * type_multiplier

            total_weighted_points += effective_weight

            # Match candidate skill
            cand_skill = cand_skill_map.get(req.skill_id)
            if not cand_skill and skill_slug in cand_slug_map:
                cand_skill = cand_slug_map[skill_slug]
            elif not cand_skill and skill_name.lower() in cand_slug_map:
                cand_skill = cand_slug_map[skill_name.lower()]

            if not cand_skill:
                # Skill is MISSING
                status = "MISSING"
                v_status = "UNSUBSTANTIATED"
                satisfaction_factor = SCORECARD_STATUS_FACTORS["MISSING"]
                evidence_items: List[Dict[str, Any]] = []
                evidence_strength = "NONE"
                supported_sources: List[str] = []
                latest_evidence_dt = None
                reason = f"No supporting evidence or candidate claim found for required {req_type} skill '{skill_name}'."
                candidate_years = 0.0
                candidate_proficiency = "unspecified"
            else:
                candidate_years = float(cand_skill.years_experience or 0.0)
                candidate_proficiency = cand_skill.proficiency_level or "unspecified"

                # Parse and serialize evidence records
                raw_ev_records = sorted(
                    cand_skill.evidence or [],
                    key=lambda x: x.created_at or datetime.min,
                    reverse=True
                )

                evidence_items = []
                latest_evidence_dt = None

                for ev in raw_ev_records:
                    if not latest_evidence_dt and ev.created_at:
                        latest_evidence_dt = ev.created_at

                    ev_score = float(ev.score_contribution or 0.0)
                    ev_strength = determine_evidence_strength(ev.evidence_type, ev_score)
                    source_title = SkillPassportService.resolve_evidence_source_title(
                        ev.evidence_type, ev.reference_id, db
                    )
                    recency = format_recency_label(ev.created_at)

                    # Dynamic artifact navigation URL
                    artifact_url = None
                    if ev.evidence_type in ("coding_submission", "coding") and ev.reference_id:
                        artifact_url = f"/assessments/code/{ev.reference_id}"
                    elif ev.evidence_type in ("interview", "interview_evaluation") and ev.reference_id:
                        artifact_url = f"/interview-room/{ev.reference_id}"
                    elif ev.evidence_type in ("assessment", "mcq_submission"):
                        artifact_url = f"/recruiter/candidates/{candidate_id}?tab=assessment"

                    item_ev = {
                        "id": ev.id,
                        "evidence_type": ev.evidence_type,
                        "source_title": source_title,
                        "reference_id": ev.reference_id,
                        "score_contribution": ev_score,
                        "evidence_strength": ev_strength,
                        "snippet": ev.snippet,
                        "created_at": ev.created_at.isoformat() if ev.created_at else None,
                        "recency_label": recency,
                        "artifact_url": artifact_url
                    }
                    evidence_items.append(item_ev)
                    all_candidate_evidence.append(item_ev)

                # Collect distinct human-friendly evidence sources
                supported_sources = sorted(list(set(
                    e["evidence_type"].replace("_", " ").title() for e in evidence_items
                )))

                # Determine overall evidence strength for this skill
                if not evidence_items:
                    evidence_strength = "NONE"
                elif any(e["evidence_strength"] == "STRONG" for e in evidence_items):
                    evidence_strength = "STRONG"
                elif any(e["evidence_strength"] == "MODERATE" for e in evidence_items):
                    evidence_strength = "MODERATE"
                else:
                    evidence_strength = "SUPPORTING"

                # Highest evidence score
                max_score = max([e["score_contribution"] for e in evidence_items]) if evidence_items else (
                    float(cand_skill.verified_score) if cand_skill.verified_score is not None else 0.0
                )

                # Determine strict verification tier
                if cand_skill.is_verified or max_score >= VERIFICATION_PASS_THRESHOLD:
                    status = "VERIFIED"
                    v_status = "VERIFIED"
                    satisfaction_factor = SCORECARD_STATUS_FACTORS["VERIFIED"]
                    src_label = ", ".join(supported_sources) if supported_sources else "Platform Assessment"
                    reason = (
                        f"Candidate demonstrated '{skill_name}' through verified platform evidence ({src_label}) "
                        f"satisfying SparkX pass criteria ({int(VERIFICATION_PASS_THRESHOLD)}%)."
                    )
                elif len(evidence_items) > 0:
                    status = "EVIDENCED"
                    v_status = "EVIDENCED"
                    satisfaction_factor = SCORECARD_STATUS_FACTORS["EVIDENCED"]
                    src_label = ", ".join(supported_sources)
                    reason = (
                        f"Candidate substantiated '{skill_name}' with preliminary platform evidence ({src_label}), "
                        f"but performance has not yet met the {int(VERIFICATION_PASS_THRESHOLD)}% verified threshold."
                    )
                else:
                    status = "CLAIMED"
                    v_status = "CLAIMED"
                    satisfaction_factor = SCORECARD_STATUS_FACTORS["CLAIMED"]
                    reason = (
                        f"Skill is self-reported by candidate. No verified platform assessment "
                        f"or technical interview evidence is currently available."
                    )

            # Mathematical contribution
            earned_points = effective_weight * satisfaction_factor
            earned_weighted_points += earned_points

            skill_eval = {
                "skill_id": req.skill_id,
                "skill_name": skill_name,
                "slug": skill_slug,
                "category": category,
                "requirement_type": req_type,
                "weight": req_weight,
                "status": status,
                "verification_status": v_status,
                "candidate_years": candidate_years,
                "required_years": float(req.min_years or 0.0),
                "candidate_proficiency": candidate_proficiency,
                "required_proficiency": req.min_proficiency or "intermediate",
                "evidence_count": len(evidence_items),
                "evidence_strength": evidence_strength,
                "supported_sources": supported_sources,
                "latest_evidence_timestamp": latest_evidence_dt.isoformat() if latest_evidence_dt else None,
                "recency_label": format_recency_label(latest_evidence_dt),
                "evidence": evidence_items,
                "reason": reason
            }

            evaluated_skills.append(skill_eval)
            if req_type == "must_have":
                must_have_items.append(skill_eval)
            else:
                preferred_items.append(skill_eval)

        # 6. Fit Summary Calculation
        tot_req = len(must_have_items)
        ver_req = len([x for x in must_have_items if x["status"] == "VERIFIED"])
        evi_req = len([x for x in must_have_items if x["status"] == "EVIDENCED"])
        cla_req = len([x for x in must_have_items if x["status"] == "CLAIMED"])
        mis_req = len([x for x in must_have_items if x["status"] == "MISSING"])

        tot_pref = len(preferred_items)
        ver_pref = len([x for x in preferred_items if x["status"] == "VERIFIED"])
        evi_pref = len([x for x in preferred_items if x["status"] == "EVIDENCED"])
        cla_pref = len([x for x in preferred_items if x["status"] == "CLAIMED"])
        mis_pref = len([x for x in preferred_items if x["status"] == "MISSING"])

        tot_skills = len(evaluated_skills)
        tot_ver = ver_req + ver_pref
        tot_evi = evi_req + evi_pref
        tot_cla = cla_req + cla_pref
        tot_mis = mis_req + mis_pref

        req_coverage = round((ver_req / float(tot_req)) * 100.0, 1) if tot_req > 0 else 100.0
        pref_coverage = round((ver_pref / float(tot_pref)) * 100.0, 1) if tot_pref > 0 else 100.0

        overall_fit_score = (
            round((earned_weighted_points / float(total_weighted_points)) * 100.0, 1)
            if total_weighted_points > 0
            else 0.0
        )

        if overall_fit_score >= 80.0:
            fit_tier = "STRONG_FIT"
        elif overall_fit_score >= 65.0:
            fit_tier = "GOOD_FIT"
        elif overall_fit_score >= 50.0:
            fit_tier = "MODERATE_FIT"
        else:
            fit_tier = "LIMITED_FIT"

        scoring_formula = (
            "Deterministic weighted capability score: Must-Have requirements (2x) and Preferred requirements (1x) "
            "factored by verification state [VERIFIED=100%, EVIDENCED=65%, CLAIMED=25%, MISSING=0%]. "
            "Exclusively derived from real database requirements and persisted candidate evidence."
        )

        summary = {
            "total_required_skills": tot_req,
            "verified_required_count": ver_req,
            "evidenced_required_count": evi_req,
            "claimed_required_count": cla_req,
            "missing_required_count": mis_req,
            "total_preferred_skills": tot_pref,
            "verified_preferred_count": ver_pref,
            "evidenced_preferred_count": evi_pref,
            "claimed_preferred_count": cla_pref,
            "missing_preferred_count": mis_pref,
            "total_job_skills": tot_skills,
            "total_verified_skills": tot_ver,
            "total_evidenced_skills": tot_evi,
            "total_claimed_skills": tot_cla,
            "total_missing_skills": tot_mis,
            "required_skill_coverage": req_coverage,
            "preferred_skill_coverage": pref_coverage,
            "overall_fit_score": overall_fit_score,
            "fit_tier": fit_tier,
            "scoring_formula": scoring_formula
        }

        # 7. Extract genuine evidence-based skill gaps
        skill_gaps: List[Dict[str, Any]] = []
        for s in evaluated_skills:
            if s["status"] in ("MISSING", "CLAIMED", "EVIDENCED"):
                req_prefix = "MUST_HAVE" if s["requirement_type"] == "must_have" else "PREFERRED"
                if s["status"] == "MISSING":
                    gap_type = "CRITICAL_MUST_HAVE_MISSING" if s["requirement_type"] == "must_have" else "PREFERRED_MISSING"
                    recommendation = f"Assign focused assessment or technical screening challenge for required {s['requirement_type']} competency."
                elif s["status"] == "CLAIMED":
                    gap_type = f"{req_prefix}_UNVERIFIED"
                    recommendation = f"Verify self-reported claim through hands-on technical problem or focused interview inquiry."
                else:
                    gap_type = f"{req_prefix}_BELOW_PASS_THRESHOLD"
                    recommendation = f"Review preliminary score telemetry and schedule committee follow-up to validate capability."

                skill_gaps.append({
                    "skill_name": s["skill_name"],
                    "category": s["category"],
                    "requirement_type": s["requirement_type"],
                    "gap_type": gap_type,
                    "evidence_count": s["evidence_count"],
                    "current_status": s["status"],
                    "mitigation_recommendation": recommendation
                })

        # 8. Evidence Summary
        coding_ev_count = len([e for e in all_candidate_evidence if (e.get("evidence_type") or "").lower() in ("coding_submission", "coding", "coding_challenge", "coding_problem")])
        mcq_ev_count = len([e for e in all_candidate_evidence if (e.get("evidence_type") or "").lower() in ("mcq_submission", "mcq_response", "mcq", "mcq_assessment")])
        interview_ev_count = len([e for e in all_candidate_evidence if (e.get("evidence_type") or "").lower() in ("interview", "interview_evaluation", "ai_interview")])
        recruiter_ev_count = len([e for e in all_candidate_evidence if (e.get("evidence_type") or "").lower() in ("recruiter_verification", "manual_verification")])

        # Latest evidence date across all candidate skills
        all_dates = [
            datetime.fromisoformat(e["created_at"])
            for e in all_candidate_evidence
            if e.get("created_at")
        ]
        latest_date = max(all_dates) if all_dates else None

        evidence_summary = {
            "total_evidence_records": len(all_candidate_evidence),
            "coding_evidence_count": coding_ev_count,
            "mcq_evidence_count": mcq_ev_count,
            "interview_evidence_count": interview_ev_count,
            "recruiter_verified_count": recruiter_ev_count,
            "latest_evidence_date": latest_date.isoformat() if latest_date else None,
            "latest_recency_label": format_recency_label(latest_date)
        }

        # Sort evaluated skills: Must-Have first, then by status (VERIFIED -> EVIDENCED -> CLAIMED -> MISSING)
        status_rank = {"VERIFIED": 0, "EVIDENCED": 1, "CLAIMED": 2, "MISSING": 3}
        type_rank = {"must_have": 0, "preferred": 1}
        evaluated_skills.sort(
            key=lambda x: (
                type_rank.get(x["requirement_type"], 2),
                status_rank.get(x["status"], 4),
                x["skill_name"].lower()
            )
        )

        return {
            "candidate_id": candidate.id,
            "candidate_name": candidate.name or "Candidate",
            "candidate_email": candidate.email,
            "candidate_stage": candidate.stage or "applied",
            "job_id": job.id,
            "job_title": job.title or "Applied Role",
            "job_department": job.department,
            "organization_id": job.organization_id,
            "summary": summary,
            "skill_evaluations": evaluated_skills,
            "skill_gaps": skill_gaps,
            "evidence_summary": evidence_summary,
            "generated_at": datetime.utcnow().isoformat()
        }

    @staticmethod
    def compare_candidates(
        job_id: str,
        candidate_ids: List[str],
        db: Session,
        current_user: Optional[UserModel] = None
    ) -> Dict[str, Any]:
        """
        Phase 4E.8: Evidence-Based Candidate Comparison Engine.
        Compares multiple candidates side-by-side against a specific job opening.
        Reuses authoritative Phase 4E.7 scorecard calculations (zero duplicate scoring logic).
        Returns overall comparison, requirement coverage, gaps, strengths, honest ties,
        meaningful differentiators, and a full requirement-by-requirement matrix with evidence links.
        """
        if not candidate_ids or len(candidate_ids) < 2:
            raise ValueError("Comparison requires at least 2 candidates")

        unique_cand_ids = list(dict.fromkeys(candidate_ids))
        if len(unique_cand_ids) < 2:
            raise ValueError("Comparison requires at least 2 distinct candidates")

        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        # Validate all candidates exist and belong to this job
        candidates = db.query(CandidateModel).filter(CandidateModel.id.in_(unique_cand_ids)).all()
        found_map = {c.id: c for c in candidates}

        for c_id in unique_cand_ids:
            if c_id not in found_map:
                raise ValueError(f"Candidate '{c_id}' not found")
            cand_obj = found_map[c_id]
            if cand_obj.job_id != job_id:
                raise ValueError(f"Candidate '{c_id}' does not belong to job '{job_id}'")
            if cand_obj.organization_id and job.organization_id:
                if cand_obj.organization_id != job.organization_id:
                    raise PermissionError("Cross-tenant comparison forbidden: Candidate and Job belong to different organizations")

        # Multi-tenant recruiter authorization verification
        if current_user:
            user_role = getattr(current_user, "role", None) or (current_user.get("role") if isinstance(current_user, dict) else None)
            user_org = getattr(current_user, "organization_id", None) or (current_user.get("organization_id") if isinstance(current_user, dict) else None)

            if user_role == "recruiter":
                if user_org and job.organization_id and user_org != job.organization_id:
                    raise PermissionError(f"Recruiter organization '{user_org}' does not match job tenant")
                for c_id in unique_cand_ids:
                    cand_obj = found_map[c_id]
                    if user_org and cand_obj.organization_id and user_org != cand_obj.organization_id:
                        raise PermissionError(f"Recruiter organization '{user_org}' does not match candidate tenant")
            elif user_role != "admin":
                raise PermissionError("Recruiter or admin access required for candidate comparison")

        # Retrieve authoritative job requirements
        job_reqs = (
            db.query(JobSkillRequirementModel)
            .filter(JobSkillRequirementModel.job_id == job_id)
            .all()
        )
        if not job_reqs and getattr(job, "required_skills", None):
            SkillService.sync_job_skill_requirements(job_id, job.required_skills, db)
            job_reqs = (
                db.query(JobSkillRequirementModel)
                .filter(JobSkillRequirementModel.job_id == job_id)
                .all()
            )

        # Retrieve authoritative scorecard for each candidate
        candidate_scorecards: Dict[str, Dict[str, Any]] = {}
        for c_id in unique_cand_ids:
            candidate_scorecards[c_id] = CandidateScorecardService.get_scorecard(
                candidate_id=c_id,
                job_id=job_id,
                db=db,
                current_user=current_user
            )

        # Build candidate summaries
        candidate_summaries = []
        proficiency_ranks = {"unspecified": 0, "beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}

        for c_id in unique_cand_ids:
            cand = found_map[c_id]
            sc = candidate_scorecards[c_id]
            sc_summary = sc["summary"]
            sc_ev_summary = sc["evidence_summary"]

            # Construct textual gaps and top strengths from evaluated skills
            gaps = []
            top_strengths = []
            for s in sc["skill_evaluations"]:
                s_name = s["skill_name"]
                if s["requirement_type"] == "must_have" and s["status"] == "MISSING":
                    gaps.append(f"Missing must-have skill: {s_name}")
                elif s["status"] == "MISSING":
                    gaps.append(f"Missing preferred skill: {s_name}")
                else:
                    if s["required_years"] > 0 and s["candidate_years"] < s["required_years"]:
                        gaps.append(f"Experience shortage: {s_name} ({s['candidate_years']}y vs {s['required_years']}y min)")
                    if s["status"] == "CLAIMED":
                        gaps.append(f"No platform evidence for {s_name} (Self-reported)")

                if s["status"] == "VERIFIED":
                    top_strengths.append(f"Verified {s_name} (100%)")
                elif s["status"] == "EVIDENCED":
                    top_strengths.append(f"Strong evidence in {s_name}")

            candidate_summaries.append({
                "candidate_id": cand.id,
                "candidate_name": cand.name or "Candidate",
                "email": cand.email,
                "stage": cand.stage,
                "assessment_status": getattr(cand, "assessment_status", None),
                "interview_status": getattr(cand, "interview_status", None),
                "hiring_decision": getattr(cand, "hiring_decision", None),
                "overall_match": {
                    "score": sc_summary["overall_fit_score"],
                    "tier": sc_summary["fit_tier"],
                    "verified_count": sc_summary["total_verified_skills"],
                    "total_skills": sc_summary["total_job_skills"]
                },
                "must_have": {
                    "total": sc_summary["total_required_skills"],
                    "matched": sc_summary["verified_required_count"],
                    "has_missing": sc_summary["missing_required_count"] > 0,
                    "score": sc_summary["required_skill_coverage"]
                },
                "preferred": {
                    "total": sc_summary["total_preferred_skills"],
                    "matched": sc_summary["verified_preferred_count"],
                    "has_missing": sc_summary["missing_preferred_count"] > 0,
                    "score": sc_summary["preferred_skill_coverage"]
                },
                "scorecard_fit_score": sc_summary["overall_fit_score"],
                "scorecard_fit_tier": sc_summary["fit_tier"],
                "required_skill_coverage": sc_summary["required_skill_coverage"],
                "preferred_skill_coverage": sc_summary["preferred_skill_coverage"],
                "verified_evidence_count": sc_ev_summary["total_evidence_records"],
                "mitigation_recommendations": sc.get("skill_gaps", []),
                "gaps": gaps,
                "top_strengths": top_strengths[:4],
                "raw_overall_score": sc_summary["overall_fit_score"],
                "raw_must_have_score": sc_summary["required_skill_coverage"],
                "raw_ev_count": sc_ev_summary["total_evidence_records"]
            })

        # Deterministic ranking:
        # primary: raw_overall_score desc
        # secondary: raw_must_have_score desc
        # tertiary: raw_ev_count desc
        # quaternary: candidate_id asc
        candidate_summaries.sort(
            key=lambda x: (
                -x["raw_overall_score"],
                -x["raw_must_have_score"],
                -x["raw_ev_count"],
                x["candidate_id"]
            )
        )
        for idx, item in enumerate(candidate_summaries):
            item["rank"] = idx + 1
            item.pop("raw_overall_score", None)
            item.pop("raw_must_have_score", None)
            item.pop("raw_ev_count", None)

        # Detect honest ties and meaningful differentiators
        honest_ties: List[str] = []
        meaningful_differences: List[str] = []

        # Check for ties between candidates
        for i in range(len(candidate_summaries) - 1):
            c1 = candidate_summaries[i]
            c2 = candidate_summaries[i + 1]
            if (
                c1["scorecard_fit_score"] == c2["scorecard_fit_score"]
                and c1["required_skill_coverage"] == c2["required_skill_coverage"]
            ):
                honest_ties.append(
                    f"Tied on overall fit: {c1['candidate_name']} and {c2['candidate_name']} both achieve "
                    f"{c1['scorecard_fit_score']}% fit with {c1['required_skill_coverage']}% must-have coverage. "
                    "No artificial score delta applied."
                )

        # Compute meaningful differences between top candidate and runners-up
        if len(candidate_summaries) >= 2:
            top_cand = candidate_summaries[0]
            for other_cand in candidate_summaries[1:]:
                # Score difference
                score_delta = round(top_cand["scorecard_fit_score"] - other_cand["scorecard_fit_score"], 1)
                if score_delta > 0:
                    meaningful_differences.append(
                        f"{top_cand['candidate_name']} leads {other_cand['candidate_name']} by +{score_delta}% overall fit "
                        f"({top_cand['scorecard_fit_tier']} vs {other_cand['scorecard_fit_tier']})."
                    )

                # Must-have coverage difference
                top_mh_matched = top_cand["must_have"]["matched"]
                top_mh_tot = top_cand["must_have"]["total"]
                oth_mh_matched = other_cand["must_have"]["matched"]
                oth_mh_tot = other_cand["must_have"]["total"]
                if top_mh_matched > oth_mh_matched:
                    meaningful_differences.append(
                        f"{top_cand['candidate_name']} has verified {top_mh_matched}/{top_mh_tot} must-have competencies, "
                        f"compared to {oth_mh_matched}/{oth_mh_tot} for {other_cand['candidate_name']}."
                    )

                # Evidence volume difference
                top_ev = top_cand["verified_evidence_count"]
                oth_ev = other_cand["verified_evidence_count"]
                if top_ev > oth_ev:
                    meaningful_differences.append(
                        f"{top_cand['candidate_name']} holds {top_ev} verified platform evidence record(s) "
                        f"vs {oth_ev} for {other_cand['candidate_name']}."
                    )

                # Gaps difference
                top_missing = top_cand["must_have"]["total"] - top_cand["must_have"]["matched"]
                oth_missing = other_cand["must_have"]["total"] - other_cand["must_have"]["matched"]
                if top_missing == 0 and oth_missing > 0:
                    meaningful_differences.append(
                        f"{top_cand['candidate_name']} has zero unverified must-have requirements, "
                        f"while {other_cand['candidate_name']} has {oth_missing} unverified or missing required competency(ies)."
                    )

        if not meaningful_differences and not honest_ties:
            meaningful_differences.append(
                "All compared candidates demonstrate comparable verified skill coverage and evidence records."
            )

        # Build requirement-by-requirement matrix
        skill_comparison_rows = []
        for req in job_reqs:
            canonical_skill = req.skill
            skill_name = canonical_skill.name if canonical_skill else "Unknown Skill"
            skill_slug = canonical_skill.slug if canonical_skill else ""
            category = canonical_skill.category if canonical_skill else "General Competencies"
            req_type = (req.requirement_type or "must_have").lower()
            req_weight = float(req.weight if req.weight is not None else 1.0)
            min_years = float(req.min_years or 0.0)
            min_prof = req.min_proficiency or "intermediate"

            cand_values: Dict[str, Any] = {}
            for c_id in unique_cand_ids:
                sc = candidate_scorecards[c_id]
                eval_item = next((s for s in sc["skill_evaluations"] if s["skill_id"] == req.skill_id), None)
                if eval_item:
                    sc_status = eval_item["status"]  # "VERIFIED" | "EVIDENCED" | "CLAIMED" | "MISSING"
                    v_status_map = {
                        "VERIFIED": "VERIFIED",
                        "EVIDENCED": "PARTIALLY_VERIFIED",
                        "CLAIMED": "SELF_REPORTED",
                        "MISSING": "not_applicable"
                    }
                    v_status = v_status_map.get(sc_status, "SELF_REPORTED")
                    status_map = {
                        "VERIFIED": "verified_match",
                        "EVIDENCED": "satisfied",
                        "CLAIMED": "partially_satisfied",
                        "MISSING": "missing"
                    }
                    score_map = {
                        "VERIFIED": 100.0,
                        "EVIDENCED": 65.0,
                        "CLAIMED": 25.0,
                        "MISSING": 0.0
                    }
                    cand_prof = eval_item["candidate_proficiency"]
                    cand_prof_rank = proficiency_ranks.get((cand_prof or "").lower(), 0)
                    req_prof_rank = proficiency_ranks.get((min_prof or "").lower(), 2)

                    cand_values[c_id] = {
                        "candidate_id": c_id,
                        "candidate_name": found_map[c_id].name or "Candidate",
                        "status": status_map.get(sc_status, "missing"),
                        "scorecard_status": sc_status,
                        "verification_status": v_status,
                        "satisfaction_score": score_map.get(sc_status, 0.0),
                        "candidate_years": eval_item["candidate_years"],
                        "candidate_proficiency": cand_prof,
                        "experience_satisfied": eval_item["candidate_years"] >= min_years,
                        "proficiency_satisfied": cand_prof_rank >= req_prof_rank,
                        "evidence_count": eval_item["evidence_count"],
                        "evidence_strength": eval_item.get("evidence_strength", "NONE"),
                        "supported_sources": eval_item.get("supported_sources", []),
                        "recency_label": eval_item.get("recency_label"),
                        "latest_evidence_timestamp": eval_item.get("latest_evidence_timestamp"),
                        "evidence": eval_item.get("evidence", []),
                        "explanation": eval_item.get("reason", f"Evaluated competency '{skill_name}' against requirements.")
                    }
                else:
                    cand_values[c_id] = {
                        "candidate_id": c_id,
                        "candidate_name": found_map[c_id].name or "Candidate",
                        "status": "missing",
                        "scorecard_status": "MISSING",
                        "verification_status": "not_applicable",
                        "satisfaction_score": 0.0,
                        "candidate_years": 0.0,
                        "candidate_proficiency": "unspecified",
                        "experience_satisfied": False,
                        "proficiency_satisfied": False,
                        "evidence_count": 0,
                        "evidence_strength": "NONE",
                        "supported_sources": [],
                        "recency_label": None,
                        "latest_evidence_timestamp": None,
                        "evidence": [],
                        "explanation": f"Candidate does not possess required skill '{skill_name}'."
                    }

            skill_comparison_rows.append({
                "skill_id": req.skill_id,
                "skill_name": skill_name,
                "slug": skill_slug,
                "category": category,
                "requirement_type": req_type,
                "weight": req_weight,
                "required_years": min_years,
                "required_proficiency": min_prof,
                "candidate_values": cand_values
            })

        # Order rows: must-haves first by weight desc, then preferred by weight desc
        skill_comparison_rows.sort(
            key=lambda r: (0 if r["requirement_type"] == "must_have" else 1, -r["weight"], r["skill_name"])
        )

        must_haves_cnt = sum(1 for r in skill_comparison_rows if r["requirement_type"] == "must_have")
        prefs_cnt = sum(1 for r in skill_comparison_rows if r["requirement_type"] != "must_have")

        comparison_summary = (
            f"Evidence-based side-by-side comparison of {len(candidate_summaries)} candidates for '{job.title}'. "
            f"Evaluated against {len(skill_comparison_rows)} job requirements ({must_haves_cnt} must-have, {prefs_cnt} preferred) "
            "using deterministic scorecard metrics and verified platform artifacts."
        )

        return {
            "job_id": job.id,
            "job_title": job.title or "Job Opening",
            "department": getattr(job, "department", None),
            "organization_id": job.organization_id,
            "total_requirements": len(skill_comparison_rows),
            "must_have_count": must_haves_cnt,
            "preferred_count": prefs_cnt,
            "candidates": candidate_summaries,
            "skill_comparison": skill_comparison_rows,
            "meaningful_differences": meaningful_differences,
            "honest_ties": honest_ties,
            "comparison_summary": comparison_summary,
            "evaluated_at": datetime.utcnow().isoformat()
        }

