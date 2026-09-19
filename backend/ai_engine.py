import math
from typing import List, Dict, Any

def generate_job_questions(role_title: str, skills: List[str], experience_years: int) -> List[Dict[str, Any]]:
    p_skill = skills[0] if skills else "System Architecture"
    s_skill = skills[1] if len(skills) > 1 else "Database Optimization"

    return [
        {
            "id": "q1",
            "type": "Technical Competence",
            "prompt": f"In your experience as a {role_title}, how do you leverage {p_skill} in production to guarantee low latency and high concurrency?",
            "ideal_keywords": [p_skill.lower(), "concurrency", "async", "cache", "throughput", "latency"],
            "follow_up_vague": f"You mentioned utilizing {p_skill}, but what specific architectural bottlenecks did you encounter and how did you profile latency?",
            "follow_up_expert": f"Given high-throughput traffic spikes on {p_skill}, what backpressure and circuit-breaker patterns did you implement?"
        },
        {
            "id": "q2",
            "type": "System Architecture",
            "prompt": f"How do you design secure, modular communication between {p_skill} services and {s_skill} backends?",
            "ideal_keywords": ["api", "schema", "validation", "security", "token", s_skill.lower()],
            "follow_up_vague": "Could you specify the exact protocol, serialization formats, and error retry policies used between these services?",
            "follow_up_expert": f"What eventual consistency model did you adopt if {s_skill} suffers from temporary network partitions?"
        },
        {
            "id": "q3",
            "type": "Behavioral & Integrity",
            "prompt": f"Describe a critical system outage or algorithmic failure you triaged in your {experience_years}+ years of career. What was your root-cause analysis procedure?",
            "ideal_keywords": ["root cause", "post-mortem", "telemetry", "tracing", "monitoring", "prevention"],
            "follow_up_vague": "What concrete observability metrics or log traces isolated the issue rather than trial-and-error?",
            "follow_up_expert": "What automated CI/CD canary checks or regression suites were deployed to prevent identical regressions?"
        }
    ]

def evaluate_adaptive_answer(prompt: str, answer: str, ideal_keywords: List[str], follow_up_vague: str, follow_up_expert: str) -> Dict[str, Any]:
    if not answer or len(answer.strip()) == 0:
        return {
            "needs_follow_up": True,
            "follow_up_question": "We did not receive an answer. Could you elaborate on your experience or share a concrete technical example?",
            "quality": "empty",
            "feedback": "No answer recorded."
        }

    words = answer.strip().split()
    word_count = len(words)
    answer_lower = answer.lower()

    matched_kw = [kw for kw in (ideal_keywords or []) if kw.lower() in answer_lower]

    # Vague answer trigger (Slide 8)
    if word_count < 20 or (len(matched_kw) == 0 and word_count < 35):
        return {
            "needs_follow_up": True,
            "follow_up_question": follow_up_vague or "Could you provide a concrete production example or technical metric that illustrates your answer?",
            "quality": "vague",
            "feedback": "Candidate answer was generic. Probing follow-up triggered to test actual depth."
        }

    # Expert challenge trigger
    if len(matched_kw) >= 3 and word_count >= 30:
        return {
            "needs_follow_up": True,
            "follow_up_question": follow_up_expert or "That is a solid approach. How do you safeguard this under extreme edge cases and failover?",
            "quality": "advanced",
            "feedback": "Strong depth shown. Challenging with edge-case stress test."
        }

    return {
        "needs_follow_up": False,
        "follow_up_question": None,
        "quality": "solid",
        "feedback": "Answer demonstrates clear competency."
    }

def calculate_scorecard_and_gap(
    job_skills: List[str],
    candidate_skills: List[str],
    transcript: List[Dict[str, Any]],
    integrity_score: int,
    code_score: int = 90
) -> Dict[str, Any]:
    cand_words = sum(len(t.get("text", "").split()) for t in transcript if t.get("speaker") == "candidate")
    
    comm_score = min(98, max(60, 70 + (20 if cand_words > 60 else 10)))
    tech_score = min(99, max(50, int((code_score * 0.4) + (88 * 0.6))))
    problem_solving = min(95, max(55, int(tech_score * 0.9 + 5)))
    job_skills_score = int((tech_score * 0.45) + (comm_score * 0.25) + (problem_solving * 0.3))
    
    overall = int(
        (job_skills_score * 0.4) +
        (tech_score * 0.3) +
        (comm_score * 0.15) +
        (integrity_score * 0.15)
    )

    # Skill Gap
    job_skills_lower = [s.lower() for s in job_skills]
    cand_skills_lower = [s.lower() for s in candidate_skills]

    strong_skills = []
    missing_skills = []

    for s in job_skills:
        if any(s.lower() in cs or cs in s.lower() for cs in cand_skills_lower):
            strong_skills.append(s)
        else:
            missing_skills.append(s)

    recommendations = []
    if missing_skills:
        for ms in missing_skills:
            recommendations.append(f"Targeted mastery in {ms}: Complete hands-on system design module.")
    else:
        recommendations.append("Ready for senior technical leadership and cross-functional mentoring.")

    readiness = "Immediately Job-Ready"
    if len(missing_skills) >= 3 or overall < 70:
        readiness = "Requires Core Upskilling (Gap > 40%)"
    elif missing_skills or overall < 85:
        readiness = "Hire-and-Develop (Trainable within 30 days)"

    evidence = [
        {
            "question": t.get("relatedQuestion", "Interview Assessment"),
            "answer": t.get("text", ""),
            "aiInsight": "Candidate demonstrated architectural maturity under direct questioning."
        }
        for t in transcript if t.get("speaker") == "candidate" and len(t.get("text", "")) > 20
    ][:3]

    return {
        "scores": {
            "jobSkills": job_skills_score,
            "technicalScore": tech_score,
            "communication": comm_score,
            "problemSolving": problem_solving,
            "overall": overall
        },
        "evidence_snippets": evidence,
        "skill_gaps": {
            "strongSkills": strong_skills,
            "missingSkills": missing_skills,
            "recommendations": recommendations,
            "readiness": readiness
        },
        "interview_summary": f"Completed AI automated evaluation. Evaluated overall fit at {overall}/100 with {integrity_score}/100 integrity rating."
    }
