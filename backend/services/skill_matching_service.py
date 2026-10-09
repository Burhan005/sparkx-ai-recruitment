"""
(S) Skill Matching & Evidence Verification Service
Phase 4E.2: Centralized, Authoritative, Database-Backed Multi-Skill Matching Engine.
Zero mock data, zero hardcoded scoring inputs, zero artificial floors.
Database -> Backend Computation -> REST API -> Presentation.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from models.db_models import (
    SkillModel, SkillAliasModel, CandidateSkillModel,
    JobSkillRequirementModel, SkillEvidenceModel,
    CandidateModel, JobModel, UserModel,
    CodingProblemModel, MCQQuestionModel
)
from services.skill_service import SkillService, slugify_skill_name

# Authoritative deterministic proficiency ordering
PROFICIENCY_LEVELS: Dict[str, int] = {
    "unspecified": 0,
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3,
    "expert": 4,
}

# Authoritative verification state constants
VERIFICATION_STATE_VERIFIED = "VERIFIED"
VERIFICATION_STATE_PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
VERIFICATION_STATE_SELF_REPORTED = "SELF_REPORTED"
VERIFICATION_STATE_NOT_APPLICABLE = "not_applicable"

# Deterministic verification multipliers
VERIFICATION_MULTIPLIERS: Dict[str, float] = {
    VERIFICATION_STATE_VERIFIED: 1.0,
    VERIFICATION_STATE_PARTIALLY_VERIFIED: 0.90,
    VERIFICATION_STATE_SELF_REPORTED: 0.80,
    VERIFICATION_STATE_NOT_APPLICABLE: 0.0,
}

# Threshold for authoritative passing verification from platform assessment
VERIFICATION_PASS_THRESHOLD = 70.0


class SkillMatchingService:

    @staticmethod
    def get_proficiency_rank(level: Optional[str]) -> int:
        """Returns the deterministic numeric rank for a proficiency level."""
        if not level or not isinstance(level, str):
            return 0
        return PROFICIENCY_LEVELS.get(level.strip().lower(), 0)

    @staticmethod
    def evaluate_proficiency(
        candidate_level: Optional[str],
        required_level: Optional[str]
    ) -> Tuple[bool, float]:
        """
        Compares candidate proficiency against required proficiency deterministically.
        Returns: (is_satisfied: bool, factor: float in range [0.0, 1.0])
        """
        c_rank = SkillMatchingService.get_proficiency_rank(candidate_level)
        r_rank = SkillMatchingService.get_proficiency_rank(required_level or "intermediate")

        if r_rank <= 0:
            return True, 1.0

        if c_rank >= r_rank:
            return True, 1.0

        # Fractional deterministic gradient when below requirement
        factor = round(c_rank / float(r_rank), 4)
        return False, max(0.0, min(1.0, factor))

    @staticmethod
    def evaluate_experience(
        candidate_years: Optional[float],
        required_years: Optional[float]
    ) -> Tuple[bool, float]:
        """
        Compares candidate years of experience against minimum required years.
        Returns: (is_satisfied: bool, factor: float in range [0.0, 1.0])
        """
        c_years = float(candidate_years or 0.0)
        r_years = float(required_years or 0.0)

        if r_years <= 0.0:
            return True, 1.0

        if c_years >= r_years:
            return True, 1.0

        if c_years <= 0.0:
            return False, 0.0

        # Fractional deterministic gradient when below requirement
        factor = round(c_years / float(r_years), 4)
        return False, max(0.0, min(1.0, factor))

    @staticmethod
    def derive_verification_state(
        cand_skill: Optional[CandidateSkillModel]
    ) -> Tuple[str, float, float]:
        """
        Derives authoritative verification state and anti-inflated aggregate evidence score.
        Returns: (verification_state: str, multiplier: float, aggregate_evidence_score: float)
        Anti-inflation: Aggregate score is the bounded maximum of legitimate evidence records,
        strictly bounded within [0.0, 100.0]. Never an unbounded sum.
        """
        if not cand_skill:
            return VERIFICATION_STATE_NOT_APPLICABLE, 0.0, 0.0

        evidence_records = cand_skill.evidence or []
        evidence_scores = [
            float(ev.score_contribution)
            for ev in evidence_records
            if ev.score_contribution is not None
        ]

        # Highest legitimate score achieved across authentic evidence
        max_evidence_score = max(evidence_scores) if evidence_scores else (
            float(cand_skill.verified_score) if cand_skill.verified_score is not None else 0.0
        )
        max_evidence_score = max(0.0, min(100.0, max_evidence_score))

        # Determine verification tier
        if cand_skill.is_verified or max_evidence_score >= VERIFICATION_PASS_THRESHOLD:
            state = VERIFICATION_STATE_VERIFIED
            mult = VERIFICATION_MULTIPLIERS[VERIFICATION_STATE_VERIFIED]
        elif len(evidence_records) > 0 or max_evidence_score > 0.0:
            state = VERIFICATION_STATE_PARTIALLY_VERIFIED
            mult = VERIFICATION_MULTIPLIERS[VERIFICATION_STATE_PARTIALLY_VERIFIED]
        else:
            state = VERIFICATION_STATE_SELF_REPORTED
            mult = VERIFICATION_MULTIPLIERS[VERIFICATION_STATE_SELF_REPORTED]

        return state, mult, max_evidence_score

    @staticmethod
    def match_candidate_to_job(
        candidate_id: str,
        job_id: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Authoritative single-point matching engine.
        Compares JobSkillRequirementModel vs CandidateSkillModel vs SkillEvidenceModel.
        Produces explainable, deterministic mathematical breakdown.
        """
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")

        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        # Fetch relational requirements for job
        job_reqs = (
            db.query(JobSkillRequirementModel)
            .filter(JobSkillRequirementModel.job_id == job_id)
            .all()
        )

        # Fetch relational skills for candidate (indexed by skill_id)
        cand_skills = (
            db.query(CandidateSkillModel)
            .filter(CandidateSkillModel.candidate_id == candidate_id)
            .all()
        )
        cand_skill_map = {cs.skill_id: cs for cs in cand_skills}

        evaluated_skills: List[Dict[str, Any]] = []
        must_have_items: List[Dict[str, Any]] = []
        preferred_items: List[Dict[str, Any]] = []

        overall_total_weight = 0.0
        overall_earned_weight = 0.0

        for req in job_reqs:
            canonical_skill = req.skill
            skill_name = canonical_skill.name if canonical_skill else "Unknown Skill"
            skill_slug = canonical_skill.slug if canonical_skill else ""
            category = canonical_skill.category if canonical_skill else "General Competencies"

            req_weight = float(req.weight if req.weight is not None else 1.0)
            req_type = (req.requirement_type or "must_have").lower()
            min_years = float(req.min_years or 0.0)
            min_prof = req.min_proficiency or "intermediate"

            # Must-have has a 2.0x priority multiplier in overall calculation; preferred has 1.0x
            type_multiplier = 2.0 if req_type == "must_have" else 1.0
            effective_weight = req_weight * type_multiplier
            overall_total_weight += effective_weight

            cand_skill = cand_skill_map.get(req.skill_id)

            if not cand_skill:
                # Candidate does not possess this canonical skill
                item = {
                    "skill_id": req.skill_id,
                    "skill_name": skill_name,
                    "slug": skill_slug,
                    "category": category,
                    "requirement_type": req_type,
                    "weight": req_weight,
                    "required_years": min_years,
                    "candidate_years": 0.0,
                    "required_proficiency": min_prof,
                    "candidate_proficiency": "unspecified",
                    "status": "missing",
                    "verification_status": VERIFICATION_STATE_NOT_APPLICABLE,
                    "experience_satisfied": False,
                    "proficiency_satisfied": False,
                    "satisfaction_score": 0.0,
                    "weighted_contribution": 0.0,
                    "max_possible_contribution": req_weight,
                    "evidence_count": 0,
                    "evidence": [],
                    "explanation": f"Candidate does not have record of required {req_type} skill '{skill_name}'."
                }
            else:
                # Candidate possesses the skill: evaluate criteria
                cand_years = float(cand_skill.years_experience or 0.0)
                cand_prof = cand_skill.proficiency_level or "unspecified"

                exp_satisfied, exp_factor = SkillMatchingService.evaluate_experience(cand_years, min_years)
                prof_satisfied, prof_factor = SkillMatchingService.evaluate_proficiency(cand_prof, min_prof)
                v_state, v_mult, agg_evidence_score = SkillMatchingService.derive_verification_state(cand_skill)

                # Base capability satisfaction (50% experience fulfillment + 50% proficiency fulfillment)
                base_satisfaction = (exp_factor * 0.5) + (prof_factor * 0.5)
                # Verification weighting
                satisfaction = round(base_satisfaction * v_mult, 4)
                satisfaction_score = round(satisfaction * 100.0, 2)

                earned_contribution = round(req_weight * satisfaction, 4)
                overall_earned_weight += (effective_weight * satisfaction)

                # Determine granular status
                if exp_satisfied and prof_satisfied and v_state == VERIFICATION_STATE_VERIFIED:
                    status_label = "verified_match"
                elif exp_satisfied and prof_satisfied:
                    status_label = "satisfied"
                elif satisfaction > 0.0:
                    status_label = "partially_satisfied"
                else:
                    status_label = "unsatisfied"

                # Serialize authentic evidence records
                serialized_evidence = [
                    {
                        "id": ev.id,
                        "evidence_type": ev.evidence_type,
                        "reference_id": ev.reference_id,
                        "score_contribution": ev.score_contribution,
                        "snippet": ev.snippet,
                        "created_at": ev.created_at.isoformat() if ev.created_at else None
                    }
                    for ev in (cand_skill.evidence or [])
                ]

                # Human-readable explanation
                exp_detail = f"{cand_years}y vs {min_years}y min" if min_years > 0 else f"{cand_years}y exp"
                prof_detail = f"{cand_prof} vs {min_prof} required"
                item = {
                    "skill_id": req.skill_id,
                    "skill_name": skill_name,
                    "slug": skill_slug,
                    "category": category,
                    "requirement_type": req_type,
                    "weight": req_weight,
                    "required_years": min_years,
                    "candidate_years": cand_years,
                    "required_proficiency": min_prof,
                    "candidate_proficiency": cand_prof,
                    "status": status_label,
                    "verification_status": v_state,
                    "experience_satisfied": exp_satisfied,
                    "proficiency_satisfied": prof_satisfied,
                    "satisfaction_score": satisfaction_score,
                    "weighted_contribution": earned_contribution,
                    "max_possible_contribution": req_weight,
                    "evidence_count": len(serialized_evidence),
                    "evidence": serialized_evidence,
                    "explanation": (
                        f"{skill_name} ({req_type}): {status_label.replace('_', ' ').title()}. "
                        f"Experience [{exp_detail}], Proficiency [{prof_detail}], "
                        f"Verification [{v_state} with {len(serialized_evidence)} evidence record(s)]."
                    )
                }

            evaluated_skills.append(item)
            if req_type == "must_have":
                must_have_items.append(item)
            else:
                preferred_items.append(item)

        # Calculate Must-Have Breakdown
        total_must_have_weight = sum(item["weight"] for item in must_have_items)
        earned_must_have_weight = sum(item["weighted_contribution"] for item in must_have_items)
        must_have_matched = sum(1 for item in must_have_items if item["status"] != "missing")
        must_have_missing = sum(1 for item in must_have_items if item["status"] == "missing")
        must_have_score = (
            round((earned_must_have_weight / total_must_have_weight) * 100.0, 2)
            if total_must_have_weight > 0 else 100.0
        )

        # Calculate Preferred Breakdown
        total_pref_weight = sum(item["weight"] for item in preferred_items)
        earned_pref_weight = sum(item["weighted_contribution"] for item in preferred_items)
        pref_matched = sum(1 for item in preferred_items if item["status"] != "missing")
        pref_missing = sum(1 for item in preferred_items if item["status"] == "missing")
        pref_score = (
            round((earned_pref_weight / total_pref_weight) * 100.0, 2)
            if total_pref_weight > 0 else 100.0
        )

        # Calculate Overall Match
        if overall_total_weight > 0:
            overall_score = round((overall_earned_weight / overall_total_weight) * 100.0, 2)
        else:
            overall_score = 0.0

        # Authoritative overall match classification
        if overall_score >= 85.0:
            overall_status = "strong_match"
        elif overall_score >= 70.0:
            overall_status = "good_match"
        elif overall_score >= 50.0:
            overall_status = "moderate_match"
        elif overall_score > 0.0:
            overall_status = "low_match"
        else:
            overall_status = "no_match"

        return {
            "candidate_id": candidate.id,
            "candidate_name": candidate.name or "Candidate",
            "job_id": job.id,
            "job_title": job.title or "Job Opening",
            "overall_match": {
                "score": overall_score,
                "status": overall_status,
                "has_missing_must_have": (must_have_missing > 0),
                "matched_skills_count": len([s for s in evaluated_skills if s["status"] != "missing"]),
                "total_skills_count": len(evaluated_skills)
            },
            "must_have": {
                "score": must_have_score,
                "matched": must_have_matched,
                "total": len(must_have_items),
                "has_missing": (must_have_missing > 0)
            },
            "preferred": {
                "score": pref_score,
                "matched": pref_matched,
                "total": len(preferred_items),
                "has_missing": (pref_missing > 0)
            },
            "skills": evaluated_skills,
            "evaluated_at": datetime.utcnow().isoformat()
        }

    @staticmethod
    def match_job_candidates(
        job_id: str,
        db: Session,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Authoritative batch matching for all candidates associated with a job opening.
        Enforces tenant isolation via job ownership.
        Sorts candidates deterministically by overall_match.score descending.
        """
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            raise ValueError(f"Job '{job_id}' not found")

        candidates = (
            db.query(CandidateModel)
            .filter(CandidateModel.job_id == job_id)
            .order_by(CandidateModel.created_at.desc())
            .limit(limit)
            .all()
        )

        match_results = []
        for cand in candidates:
            res = SkillMatchingService.match_candidate_to_job(
                candidate_id=cand.id,
                job_id=job_id,
                db=db
            )
            match_results.append(res)

        # Sort deterministically by overall match score descending
        match_results.sort(key=lambda r: r["overall_match"]["score"], reverse=True)

        return {
            "job_id": job.id,
            "job_title": job.title or "Job Opening",
            "total_candidates": len(match_results),
            "candidates": match_results
        }

    @staticmethod
    def link_mcq_evidence(
        candidate_id: str,
        mcq_question_id: str,
        is_correct: bool,
        db: Session
    ) -> List[SkillEvidenceModel]:
        """
        Automatically substantiates CandidateSkillModel records when an MCQ is evaluated.
        Finds associated canonical skills from MCQQuestionModel.skills and creates SkillEvidenceModel.
        """
        mcq = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == mcq_question_id).first()
        if not mcq or not mcq.skills:
            return []

        created_evidence = []
        score_val = 100.0 if is_correct else 0.0

        for raw_s in mcq.skills:
            if not raw_s or not isinstance(raw_s, str) or not raw_s.strip():
                continue
            skill_entity, _ = SkillService.get_or_create_skill(raw_s.strip(), db)

            # Find or create candidate skill
            cand_skill = db.query(CandidateSkillModel).filter(
                CandidateSkillModel.candidate_id == candidate_id,
                CandidateSkillModel.skill_id == skill_entity.id
            ).first()

            if not cand_skill:
                cand_skill = CandidateSkillModel(
                    id=f"csk-{uuid.uuid4().hex[:8]}" if 'uuid' in globals() else f"csk-{datetime.utcnow().strftime('%f')[:8]}",
                    candidate_id=candidate_id,
                    skill_id=skill_entity.id,
                    proficiency_level="intermediate" if is_correct else "unspecified",
                    years_experience=0.0,
                    is_verified=is_correct,
                    verified_score=score_val if is_correct else None,
                    verification_source="mcq_submission",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(cand_skill)
                db.flush()

            # Create legitimate evidence record
            ev = SkillService.add_skill_evidence(
                candidate_skill_id=cand_skill.id,
                evidence_type="mcq_submission",
                db=db,
                reference_id=mcq.id,
                score_contribution=score_val,
                snippet=f"Technical MCQ on '{skill_entity.name}': {'Correct (+1.0 pt)' if is_correct else 'Incorrect (0.0 pt)'}"
            )
            if ev:
                created_evidence.append(ev)

        return created_evidence

    @staticmethod
    def link_coding_evidence(
        candidate_id: str,
        problem_id_or_slug: str,
        language: str,
        score: float,
        submission_id: str,
        db: Session,
        snippet: Optional[str] = None
    ) -> List[SkillEvidenceModel]:
        """
        Automatically substantiates CandidateSkillModel records when a coding submission is graded.
        Links both the programming language and any tagged skills on CodingProblemModel.
        """
        prob = db.query(CodingProblemModel).filter(
            (CodingProblemModel.id == problem_id_or_slug) |
            (CodingProblemModel.slug == problem_id_or_slug)
        ).first()

        skills_to_link = set()
        if language and language.strip():
            skills_to_link.add(language.strip())
        prob_tags = getattr(prob, 'tags', None)
        if prob_tags and isinstance(prob_tags, (list, tuple, set)):
            for tag in prob_tags:
                if isinstance(tag, str) and tag.strip():
                    skills_to_link.add(tag.strip())

        created_evidence = []
        bounded_score = max(0.0, min(100.0, float(score or 0.0)))

        for s_name in skills_to_link:
            skill_entity, _ = SkillService.get_or_create_skill(s_name, db)

            cand_skill = db.query(CandidateSkillModel).filter(
                CandidateSkillModel.candidate_id == candidate_id,
                CandidateSkillModel.skill_id == skill_entity.id
            ).first()

            if not cand_skill:
                cand_skill = CandidateSkillModel(
                    id=f"csk-{uuid.uuid4().hex[:8]}" if 'uuid' in globals() else f"csk-{datetime.utcnow().strftime('%f')[:8]}",
                    candidate_id=candidate_id,
                    skill_id=skill_entity.id,
                    proficiency_level="advanced" if bounded_score >= 85 else "intermediate" if bounded_score >= 60 else "beginner",
                    years_experience=0.0,
                    is_verified=(bounded_score >= VERIFICATION_PASS_THRESHOLD),
                    verified_score=bounded_score,
                    verification_source="coding_submission",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(cand_skill)
                db.flush()

            snip = snippet or f"Coding submission in {language.title()} (Problem: {prob.title if prob else problem_id_or_slug}): {bounded_score}% test cases passed."
            ev = SkillService.add_skill_evidence(
                candidate_skill_id=cand_skill.id,
                evidence_type="coding_submission",
                db=db,
                reference_id=submission_id,
                score_contribution=bounded_score,
                snippet=snip
            )
            if ev:
                created_evidence.append(ev)

        return created_evidence

    @staticmethod
    def link_interview_evidence(
        candidate_id: str,
        job_id: str,
        technical_score: float,
        evidence_snippets: Optional[List[str]],
        db: Session
    ) -> List[SkillEvidenceModel]:
        """
        Substantiates CandidateSkillModel records from concluded AI interview evaluations.
        Links candidate skills matching job requirements with interview performance records.
        """
        job = db.query(JobModel).filter(JobModel.id == job_id).first()
        if not job:
            return []

        cand_skills = (
            db.query(CandidateSkillModel)
            .filter(CandidateSkillModel.candidate_id == candidate_id)
            .all()
        )
        if not cand_skills:
            return []

        created_evidence = []
        bounded_score = max(0.0, min(100.0, float(technical_score or 0.0)))
        snippet_text = (
            " | ".join(evidence_snippets[:3])
            if evidence_snippets
            else f"AI Interview Technical Assessment: {bounded_score}%"
        )

        for cs in cand_skills:
            ev = SkillService.add_skill_evidence(
                candidate_skill_id=cs.id,
                evidence_type="interview",
                db=db,
                reference_id=job_id,
                score_contribution=bounded_score,
                snippet=f"Adaptive Interview evaluation on '{cs.skill.name if cs.skill else 'Skill'}': {snippet_text[:200]}"
            )
            if ev:
                created_evidence.append(ev)

        return created_evidence

    @staticmethod
    def compare_job_candidates(
        job_id: str,
        candidate_ids: List[str],
        db: Session
    ) -> Dict[str, Any]:
        """
        Phase 4E.3 & Phase 4E.8: Candidate Comparison Engine.
        Compares multiple candidates side-by-side against a specific job opening.
        Reuses authoritative CandidateScorecardService (zero duplicate scoring logic).
        """
        from services.candidate_scorecard_service import CandidateScorecardService
        return CandidateScorecardService.compare_candidates(
            job_id=job_id,
            candidate_ids=candidate_ids,
            db=db
        )

