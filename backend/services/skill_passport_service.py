"""
(S) Verified Skill Passport Service
Phase 5: Authoritative, Database-Backed Candidate Skill Passport Engine.
Aggregates authentic platform evidence across Coding, MCQ, Scenario, Practical,
Interview, and Recruiter verification into an explainable, tamper-proof skill passport.
Zero mock data, zero fabricated scores, zero fake evidence.
"""
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from models.db_models import (
    SkillModel, SkillAliasModel, CandidateSkillModel,
    SkillEvidenceModel, JobModel, CandidateModel, UserModel,
    CodingProblemModel, CodingSubmissionModel, MCQQuestionModel,
    AssessmentModel
)
from services.skill_service import SkillService, slugify_skill_name
from services.skill_matching_service import VERIFICATION_PASS_THRESHOLD


def format_recency_label(dt: Optional[datetime]) -> str:
    """Calculates a deterministic human-friendly recency label from an authoritative timestamp."""
    if not dt:
        return "No evidence"
    delta = datetime.utcnow() - dt
    days = max(0, delta.days)
    if days == 0:
        return "Today"
    elif days == 1:
        return "Yesterday"
    elif days < 7:
        return f"{days} days ago"
    elif days < 30:
        weeks = max(1, days // 7)
        return f"{weeks} week{'s' if weeks > 1 else ''} ago"
    elif days < 365:
        months = max(1, days // 30)
        return f"{months} month{'s' if months > 1 else ''} ago"
    else:
        years = max(1, days // 365)
        return f"{years} year{'s' if years > 1 else ''} ago"


def determine_evidence_strength(evidence_type: str, score: Optional[float]) -> str:
    """
    Deterministic evidence strength calculation based on source type and achieved score.
    Returns: 'STRONG' | 'MODERATE' | 'SUPPORTING'
    """
    sc = float(score or 0.0)
    etype = (evidence_type or "").lower().strip()

    if etype in ["recruiter_verification", "certification"]:
        return "STRONG"

    if etype in ["coding_submission", "coding_problem", "coding", "coding_challenge", "interview", "interview_evaluation", "assessment", "assessment_submission"]:
        if sc >= VERIFICATION_PASS_THRESHOLD:
            return "STRONG"
        elif sc >= 40.0:
            return "MODERATE"
        else:
            return "SUPPORTING"

    if etype in ["mcq_submission", "mcq_response", "mcq", "mcq_assessment"]:
        if sc >= 80.0:
            return "STRONG"
        elif sc > 0:
            return "MODERATE"
        else:
            return "SUPPORTING"

    # Default for resume, self_reported, or unclassified
    return "SUPPORTING"


class SkillPassportService:

    @staticmethod
    def resolve_evidence_source_title(
        evidence_type: str,
        reference_id: Optional[str],
        db: Session
    ) -> str:
        """
        Resolves an authoritative, human-friendly title for the evidence source
        by querying the corresponding relational entity.
        """
        etype = (evidence_type or "").lower().strip()
        ref_id = str(reference_id or "").strip()

        if etype in ("coding_submission", "coding_problem", "coding", "coding_challenge"):
            if ref_id:
                # Query submission or problem
                sub = db.query(CodingSubmissionModel).filter(CodingSubmissionModel.id == ref_id).first()
                if sub and sub.problem:
                    return f"Coding Challenge: {sub.problem.title} ({sub.language.title()})"
                prob = db.query(CodingProblemModel).filter(
                    (CodingProblemModel.id == ref_id) | (CodingProblemModel.slug == ref_id)
                ).first()
                if prob:
                    return f"Coding Challenge: {prob.title}"
            return "Practical Coding Assessment"

        elif etype in ("mcq_submission", "mcq_response", "mcq", "mcq_assessment"):
            if ref_id:
                mcq = db.query(MCQQuestionModel).filter(MCQQuestionModel.id == ref_id).first()
                if mcq:
                    cat = mcq.category or "Technical"
                    return f"Technical MCQ ({cat.title()} Examination)"
            return "Technical MCQ Evaluation"

        elif etype in ("interview", "interview_evaluation"):
            if ref_id:
                job = db.query(JobModel).filter(JobModel.id == ref_id).first()
                if job:
                    return f"Adaptive AI Interview: {job.title}"
            return "Adaptive AI Technical Interview"

        elif etype in ("assessment", "assessment_submission"):
            if ref_id:
                asm = db.query(AssessmentModel).filter(AssessmentModel.id == ref_id).first()
                if asm:
                    return f"Role Assessment: {asm.title}"
            return "Role Technical Assessment"

        elif etype == "recruiter_verification":
            if ref_id:
                recruiter = db.query(UserModel).filter(UserModel.id == ref_id).first()
                if recruiter:
                    return f"Recruiter Verification ({recruiter.name or recruiter.email})"
            return "Recruiter Direct Verification"

        elif etype == "resume":
            return "Resume Document Credentials"

        return "Platform Competency Assessment"

    @staticmethod
    def get_candidate_passport(candidate_id: str, db: Session) -> Dict[str, Any]:
        """
        Generates the complete authoritative Verified Skill Passport for a candidate.
        Consolidates all relational CandidateSkillModel and SkillEvidenceModel records.
        Returns validated passport data matching CandidateSkillPassportResponse schema.
        """
        candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not candidate:
            raise ValueError(f"Candidate '{candidate_id}' not found")

        # 1. Authoritative synchronization: Ensure legacy skills array is synced to relational table
        if candidate.skills and isinstance(candidate.skills, list):
            SkillService.sync_candidate_skills(candidate_id, candidate.skills, db)

        # 2. Query all candidate skill associations with relationships pre-loaded
        candidate_skills = (
            db.query(CandidateSkillModel)
            .filter(CandidateSkillModel.candidate_id == candidate_id)
            .all()
        )

        job = candidate.job if candidate.job else None
        job_title = job.title if job else candidate.job_title

        processed_skills: List[Dict[str, Any]] = []
        category_map: Dict[str, Dict[str, int]] = {}

        total_evidence_count = 0
        verified_skills_count = 0
        evidenced_skills_count = 0
        claimed_skills_count = 0

        for cs in candidate_skills:
            skill = cs.skill
            skill_name = skill.name if skill else "Unknown Skill"
            skill_slug = skill.slug if skill else slugify_skill_name(skill_name)
            category = skill.category if skill and skill.category else "General Competencies"

            # Initialize category counters
            if category not in category_map:
                category_map[category] = {"total": 0, "verified": 0, "evidenced": 0}
            category_map[category]["total"] += 1

            evidence_items = []
            has_passing_evidence = False
            latest_ev_date: Optional[datetime] = None

            raw_evidences = cs.evidence or []
            # Sort evidence newest first
            sorted_evidences = sorted(
                raw_evidences,
                key=lambda e: e.created_at or datetime.min,
                reverse=True
            )

            for ev in sorted_evidences:
                total_evidence_count += 1
                ev_score = float(ev.score_contribution or 0.0) if ev.score_contribution is not None else None
                ev_strength = determine_evidence_strength(ev.evidence_type, ev_score)
                source_title = SkillPassportService.resolve_evidence_source_title(
                    ev.evidence_type, ev.reference_id, db
                )
                recency = format_recency_label(ev.created_at)

                is_source_verified = (
                    (ev_score is not None and ev_score >= VERIFICATION_PASS_THRESHOLD) or
                    ev.evidence_type in ["recruiter_verification", "certification"]
                )
                if is_source_verified:
                    has_passing_evidence = True

                if not latest_ev_date and ev.created_at:
                    latest_ev_date = ev.created_at

                evidence_items.append({
                    "id": ev.id,
                    "evidence_type": ev.evidence_type,
                    "source_title": source_title,
                    "reference_id": ev.reference_id,
                    "score_contribution": ev_score,
                    "evidence_strength": ev_strength,
                    "snippet": ev.snippet,
                    "created_at": ev.created_at.isoformat() if ev.created_at else None,
                    "recency_label": recency,
                    "is_verified_source": is_source_verified
                })

            # Determine verification status
            if cs.is_verified or has_passing_evidence:
                status = "VERIFIED"
                verified_skills_count += 1
                category_map[category]["verified"] += 1
            elif len(evidence_items) > 0:
                status = "EVIDENCED"
                evidenced_skills_count += 1
                category_map[category]["evidenced"] += 1
            else:
                status = "CLAIMED"
                claimed_skills_count += 1

            # Summary explanation
            if status == "VERIFIED":
                sources = set(e["evidence_type"].replace("_", " ").title() for e in evidence_items)
                src_str = ", ".join(sources) if sources else "Platform Assessment"
                summary_exp = (
                    f"Verified through {len(evidence_items)} authoritative platform evidence record(s) "
                    f"({src_str}). Performance meets SparkX verified threshold ({int(VERIFICATION_PASS_THRESHOLD)}%)."
                )
            elif status == "EVIDENCED":
                summary_exp = (
                    f"Substantiated by {len(evidence_items)} preliminary platform evidence record(s). "
                    f"Complete an assessment challenge or technical interview room session to unlock full verified status."
                )
            else:
                summary_exp = (
                    f"Self-reported by candidate. No verified platform assessment or interview evidence available yet."
                )

            # Skill-level recency
            skill_recency = format_recency_label(latest_ev_date)

            # Skill-level aggregate evidence strength
            if not evidence_items:
                skill_strength = "NONE"
            elif any(e.get("evidence_strength") == "STRONG" for e in evidence_items):
                skill_strength = "STRONG"
            elif any(e.get("evidence_strength") == "MODERATE" for e in evidence_items):
                skill_strength = "MODERATE"
            else:
                skill_strength = "SUPPORTING"

            processed_skills.append({
                "candidate_skill_id": cs.id,
                "skill_id": cs.skill_id,
                "name": skill_name,
                "skill_name": skill_name,
                "slug": skill_slug,
                "category": category,
                "proficiency_level": cs.proficiency_level or "unspecified",
                "years_experience": float(cs.years_experience or 0.0),
                "verification_status": status,
                "is_verified": (status == "VERIFIED"),
                "verified_score": cs.verified_score,
                "verification_source": cs.verification_source,
                "evidence_count": len(evidence_items),
                "evidence_strength": skill_strength,
                "latest_evidence_date": latest_ev_date.isoformat() if latest_ev_date else None,
                "recency_label": skill_recency,
                "evidence": evidence_items,
                "summary_explanation": summary_exp
            })

        # Sort skills: VERIFIED first, then EVIDENCED, then CLAIMED; then by evidence_count desc, then name asc
        status_order = {"VERIFIED": 0, "EVIDENCED": 1, "CLAIMED": 2}
        processed_skills.sort(
            key=lambda x: (status_order.get(x["verification_status"], 3), -x["evidence_count"], x["name"].lower())
        )

        # Build category summaries
        categories_summary = [
            {
                "category": cat,
                "total_skills": data["total"],
                "total": data["total"],
                "verified_skills": data["verified"],
                "verified": data["verified"],
                "evidenced_skills": data["evidenced"],
                "evidenced": data["evidenced"],
                "claimed_skills": max(0, data["total"] - data["verified"] - data["evidenced"]),
                "claimed": max(0, data["total"] - data["verified"] - data["evidenced"]),
                "verification_percentage": round((data["verified"] / float(data["total"])) * 100.0, 1) if data["total"] > 0 else 0.0
            }
            for cat, data in sorted(category_map.items(), key=lambda c: c[0])
        ]

        total_skills = len(processed_skills)
        verification_rate = (
            round((verified_skills_count / float(total_skills)) * 100.0, 1)
            if total_skills > 0
            else 0.0
        )

        return {
            "candidate_id": candidate.id,
            "candidate_name": candidate.name or "Candidate",
            "candidate_email": candidate.email,
            "job_id": candidate.job_id,
            "job_title": job_title,
            "applied_date": candidate.applied_date,
            "total_skills": total_skills,
            "verified_skills_count": verified_skills_count,
            "evidenced_skills_count": evidenced_skills_count,
            "claimed_skills_count": claimed_skills_count,
            "total_evidence_count": total_evidence_count,
            "verification_rate": verification_rate,
            "verification_index": verification_rate,
            "categories": categories_summary,
            "skills": processed_skills,
            "generated_at": datetime.utcnow().isoformat()
        }

    @staticmethod
    def verify_candidate_skill_manually(
        candidate_id: str,
        candidate_skill_id: str,
        notes: str,
        score: float,
        recruiter: UserModel,
        db: Session
    ) -> Dict[str, Any]:
        """
        Allows an authorized recruiter to manually verify a candidate skill
        by attaching an authoritative 'recruiter_verification' evidence record.
        """
        cand = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
        if not cand:
            raise ValueError(f"Candidate '{candidate_id}' not found")

        if recruiter and getattr(recruiter, "organization_id", None) and getattr(cand, "organization_id", None):
            if recruiter.organization_id != cand.organization_id:
                raise PermissionError(f"Recruiter from organization '{recruiter.organization_id}' cannot verify candidate in '{cand.organization_id}'")

        cand_skill = db.query(CandidateSkillModel).filter(
            CandidateSkillModel.id == candidate_skill_id,
            CandidateSkillModel.candidate_id == candidate_id
        ).first()

        if not cand_skill:
            raise ValueError(f"Candidate skill '{candidate_skill_id}' not found for candidate '{candidate_id}'")

        bounded_score = max(0.0, min(100.0, float(score or 100.0)))
        note_clean = (notes or "Recruiter manual review verified").strip()

        evidence = SkillEvidenceModel(
            id=f"skev-{uuid.uuid4().hex[:8]}",
            candidate_skill_id=cand_skill.id,
            evidence_type="recruiter_verification",
            reference_id=recruiter.id,
            score_contribution=bounded_score,
            snippet=f"Verified by Recruiter ({recruiter.name or recruiter.email}): {note_clean}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(evidence)

        # Update candidate skill model
        cand_skill.is_verified = True
        cand_skill.verified_score = bounded_score
        cand_skill.verification_source = "recruiter_verification"
        cand_skill.updated_at = datetime.utcnow()
        db.flush()

        skill_name = cand_skill.skill.name if cand_skill.skill else "Skill"
        return {
            "candidate_skill_id": cand_skill.id,
            "skill_name": skill_name,
            "is_verified": True,
            "verified_score": bounded_score,
            "evidence_id": evidence.id,
            "evidence_snippet": evidence.snippet,
            "verified_at": evidence.created_at.isoformat()
        }
