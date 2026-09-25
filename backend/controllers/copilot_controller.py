"""
(C) Copilot Controller - Intelligent Recruitment Copilot for Ask SparkX
Integrates real-time database facts, workflow telemetry, and Gemini / LLM synthesis.
"""
import re
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models.db_models import CandidateModel, JobModel
from schemas import CopilotQueryRequest, CopilotQueryResponse
from ai_engine import call_llm, get_llm_status
from services.compensation_service import (
    analyze_candidate_application,
    calculate_job_compensation_metrics,
    format_job_compensation,
    format_candidate_expectation,
    RELATIONSHIP_WITHIN_RANGE,
    RELATIONSHIP_ABOVE_RANGE,
    RELATIONSHIP_BELOW_RANGE,
    RELATIONSHIP_PARTIAL_OVERLAP,
    RELATIONSHIP_EXPECTATION_UNAVAILABLE,
    RELATIONSHIP_JOB_UNAVAILABLE,
    RELATIONSHIP_CURRENCY_MISMATCH
)

class CopilotController:
    @staticmethod
    def process_query(payload: CopilotQueryRequest, db: Session) -> Dict[str, Any]:
        query = (payload.query or "").strip()
        q_lower = query.lower()

        is_candidate_user = (payload.user_role == "candidate")

        # ── 1. GREETING & CASUAL CONVERSATION DETECTION ──
        # e.g., "hi", "hii", "hello", "hey", "good morning", "how are you"
        is_greeting = bool(re.match(r"^(hi+|hello+|hey+|good\s*(morning|afternoon|evening)|howdy|sup|greetings|hola)(\s+there)?[\s!\.\?]*$", q_lower))
        if is_greeting:
            if is_candidate_user:
                return {
                    "text": f"Hello {payload.user_name or ''}! I am **Ask SparkX**, your AI career copilot. How can I help you today?",
                    "database_facts": [],
                    "metrics": [],
                    "ai_interpretation": "I can help you check the status of your applications, review your interview preparation points, or advise you on skill development roadmaps for your target positions.",
                    "uncertainty": ""
                }
            return {
                "text": "Hello! I am **Ask SparkX**, your AI recruitment intelligence copilot. How can I help you today?",
                "database_facts": [],
                "metrics": [],
                "ai_interpretation": "I can help you review candidate dossiers, detect skill gaps, analyze coding assessments, highlight integrity events, or uncover pipeline bottlenecks. Feel free to ask about any candidate or role!",
                "uncertainty": ""
            }

        # ── 2. IDENTITY & CAPABILITIES ──
        if any(phrase in q_lower for phrase in ["who are you", "what can you do", "what are you", "help me", "how to use"]):
            if is_candidate_user:
                return {
                    "text": "I am the **SparkX Career Copilot**, designed to support you throughout your hiring journey.",
                    "database_facts": [],
                    "metrics": [],
                    "ai_interpretation": (
                        "Here is what you can ask me:\n"
                        "• **Application Status**: Ask 'Which profiles have I applied for?' or 'What is my current stage?'\n"
                        "• **Interview Guidance**: Ask 'How should I prepare for my AI interview?'\n"
                        "• **Skill Advice**: Ask 'What skills are needed for AWS Cloud Engineer?'\n"
                        "• **Assessment Tips**: Ask 'What should I review before the coding challenge?'"
                    ),
                    "uncertainty": ""
                }
            return {
                "text": "I am the **SparkX Recruitment Copilot**, powered by real-time database grounding and AI synthesis.",
                "database_facts": [],
                "metrics": [],
                "ai_interpretation": (
                    "Here is what I can do for you:\n"
                    "• **Candidate Deep-Dives**: Ask 'Tell me about Aarav Sharma' or 'What are Aarav's skill gaps?'\n"
                    "• **Action Items**: Ask 'Which candidates need action today?' or 'Who is waiting for review?'\n"
                    "• **Skill Matching**: Ask 'Which applicants know Python and React?'\n"
                    "• **Integrity Audits**: Ask 'Are there any high-risk proctor flags?'\n"
                    "• **Pipeline Bottlenecks**: Ask 'Where are candidates getting stuck?'"
                ),
                "uncertainty": ""
            }

        # Load live database context
        candidates: List[CandidateModel] = db.query(CandidateModel).all()
        jobs: List[JobModel] = db.query(JobModel).all()

        # ── 3. CANDIDATE SELF-QUERY: "who am i", "which profiles have i applied to", "my applications" ──
        is_self_query = any(phrase in q_lower for phrase in [
            "who am i", "which profiles", "profiles i", "i applied", "i ve applied", "have i applied",
            "my applications", "my application", "my profile", "my status", "where did i apply", "what did i apply"
        ])
        if is_self_query or (is_candidate_user and any(w in q_lower for w in ["profile", "apply", "applied", "application", "status", "role"])):
            user_cands = []
            if payload.user_email:
                user_cands = [c for c in candidates if c.email and c.email.lower() == payload.user_email.lower()]
            if not user_cands and payload.user_name:
                user_cands = [c for c in candidates if c.name and payload.user_name.lower() in c.name.lower()]
            if not user_cands and payload.candidate_id:
                user_cands = [c for c in candidates if str(c.id) == str(payload.candidate_id)]

            if user_cands:
                facts = [
                    f"Account: {user_cands[0].name} ({user_cands[0].email})",
                    f"Total Applications on File: {len(user_cands)}"
                ]
                for c in user_cands:
                    facts.append(f"Position: {c.job_title} | Stage: {getattr(c, 'stage', 'screening').title()} | Fit: {c.match_score or 0}% | Applied: {c.applied_date or 'Recently'}")

                return {
                    "text": f"You are logged in as **{user_cands[0].name}** (`{user_cands[0].email}`).",
                    "database_facts": facts,
                    "metrics": [
                        f"Active Applications: {len(user_cands)}",
                        f"Current Stage: {getattr(user_cands[0], 'stage', 'screening').title()}"
                    ],
                    "ai_interpretation": (
                        f"You have applied for **{user_cands[0].job_title}**"
                        + (f" and {len(user_cands) - 1} other role(s)" if len(user_cands) > 1 else "")
                        + f". Your application is currently in the **{getattr(user_cands[0], 'stage', 'screening').title()}** stage with a **{user_cands[0].match_score or 0}%** role match score. "
                        + ("The hiring team is currently reviewing your profile." if getattr(user_cands[0], 'stage', 'screening') == 'screening' else "Please check your next assessment or interview step.")
                    ),
                    "uncertainty": ""
                }
            else:
                return {
                    "text": f"You are logged in as **{payload.user_name or 'Candidate'}** (`{payload.user_email or 'candidate@sparkx.ai'}`).",
                    "database_facts": [f"No active job applications found under email {payload.user_email or 'this account'}."],
                    "metrics": ["Applications Submitted: 0"],
                    "ai_interpretation": "You haven't submitted any job applications yet. Head over to **Browse Jobs** to explore open positions and submit your resume!",
                    "uncertainty": ""
                }

        # Target candidate context
        # 1. Check if a candidate is explicitly named in the query
        mentioned_cand = None
        for c in candidates:
            if c.name and c.name.lower().strip() in q_lower:
                mentioned_cand = c
                break
        if not mentioned_cand:
            # Token match (e.g. user typed "neha", "burhan", "kapasi", "aarav")
            for c in candidates:
                if not c.name:
                    continue
                tokens = [t for t in re.split(r'[\s\-_]+', c.name.lower().strip()) if len(t) >= 3]
                if any(re.search(r'\b' + re.escape(t) + r'\b', q_lower) for t in tokens):
                    mentioned_cand = c
                    break

        # 2. Resolve target_cand:
        # Explicit mention in query takes precedence; otherwise bind to active context candidate
        target_cand = None
        if mentioned_cand:
            target_cand = mentioned_cand
        elif payload.candidate_id:
            target_cand = next((c for c in candidates if str(c.id) == str(payload.candidate_id)), None)

        # Target job context
        target_job = None
        if payload.job_id:
            target_job = next((j for j in jobs if str(j.id) == str(payload.job_id)), None)
        if not target_job and target_cand and target_cand.job_id:
            target_job = next((j for j in jobs if str(j.id) == str(target_cand.job_id)), None)

        # ── 3. CANDIDATE SPECIFIC QUERY (Includes Pronoun & Follow-Up Inquiries) ──
        if target_cand:
            cand_skills = target_cand.skills or []
            req_skills = target_job.required_skills if target_job else []
            matched = [s for s in cand_skills if any(s.lower() == rs.lower() for rs in req_skills)]
            missing = [rs for rs in req_skills if not any(s.lower() == rs.lower() for s in cand_skills)]

            wf_stage = getattr(target_cand, 'stage', 'screening')
            wf_decision = getattr(target_cand, 'hiring_decision', 'undecided')
            wf_assess = getattr(target_cand, 'assessment_status', 'not_invited')
            wf_interview = getattr(target_cand, 'interview_status', 'not_scheduled')
            cand_comp = analyze_candidate_application(target_cand, target_job)

            # ── 3A. Candidate Skills & Tech Stack Inquiry ──
            # e.g., "what are her skills ?", "what skills does she have ?", "what is her tech stack ?"
            is_skill_inquiry = any(w in q_lower for w in [
                "skill", "skills", "stack", "tech stack", "technologies", "technology",
                "know", "knows", "proficient", "proficiency", "competenc", "language", "languages", "tools"
            ])
            if is_skill_inquiry:
                facts = [
                    f"Candidate: {target_cand.name} (Role: {target_cand.job_title})",
                    f"Verified Candidate Skills: {', '.join(cand_skills) if cand_skills else 'No verified skills listed'}",
                    f"Requisition Core Matches: {', '.join(matched) if matched else 'No direct overlaps with core requisites'}",
                    f"Missing / Growth Competencies: {', '.join(missing) if missing else 'None (All role requirements satisfied)'}",
                    f"Requisition Target Stack: {', '.join(req_skills) if req_skills else 'General requisites'}"
                ]
                metrics = [
                    f"Fit Score: {target_cand.match_score or 0}%",
                    f"Verified Skills: {len(matched)} of {len(req_skills)}" if req_skills else f"Skills: {len(cand_skills)}",
                    f"Coverage: {round((len(matched) / (len(req_skills) or 1)) * 100)}%" if req_skills else "100%"
                ]
                interp = (
                    f"**{target_cand.name}** has verified competencies in **{', '.join(cand_skills)}**. "
                    f"For the **{target_cand.job_title}** role, their verified core strengths are **{', '.join(matched) if matched else 'foundational competencies'}** "
                    f"(achieving a **{target_cand.match_score or 0}%** role fit score). "
                    + (f"Identified growth areas to probe during interviews are **{', '.join(missing)}**." if missing else "The candidate satisfies all primary technical skill criteria for this position.")
                )
                return {
                    "text": f"Technical Skills & Competency Profile for **{target_cand.name}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interp,
                    "uncertainty": "Skills are extracted and validated from candidate resume parsing and sandbox assessment verification.",
                    "candidate_id": str(target_cand.id),
                    "candidate_name": target_cand.name
                }

            # ── 3B. Candidate Assessment & Test Score Inquiry ──
            # e.g., "what is her score ?", "did she pass the test ?", "how was her assessment ?"
            is_assess_inquiry = any(w in q_lower for w in [
                "score", "assessment", "test", "coding", "code", "proctor", "integrity",
                "cheat", "telemetry", "evaluat", "pass", "marks"
            ])
            if is_assess_inquiry:
                facts = [
                    f"Candidate: {target_cand.name} ({target_cand.job_title})",
                    f"Assessment Status: {wf_assess.replace('_', ' ').title()}",
                    f"Coding Assessment Score: {target_cand.coding_score or (target_cand.scores.get('overall', 'N/A') if isinstance(target_cand.scores, dict) else 'N/A')}/100",
                    f"Proctor Integrity Rating: {target_cand.integrity_risk or 'Low'} Risk • Telemetry Score: {target_cand.integrity_score or 100}/100",
                    f"Current Workflow Stage: Stage {wf_stage.title()} • Decision: {wf_decision.title()}"
                ]
                metrics = [
                    f"Assessment Score: {target_cand.coding_score or 0}/100",
                    f"Integrity Score: {target_cand.integrity_score or 100}/100",
                    f"Role Match: {target_cand.match_score or 0}%"
                ]
                interp = (
                    f"**{target_cand.name}** is in the **{wf_stage.title()}** stage with an assessment status of **{wf_assess.replace('_', ' ').title()}**. "
                    f"They achieved a coding evaluation score of **{target_cand.coding_score or 'N/A'}/100** with a **{target_cand.integrity_risk or 'Low'}** proctor integrity risk rating."
                )
                return {
                    "text": f"Assessment & Evaluation Scorecard for **{target_cand.name}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interp,
                    "uncertainty": "Assessment evaluations measure unit test execution in an isolated sandbox subprocess.",
                    "candidate_id": str(target_cand.id),
                    "candidate_name": target_cand.name
                }

            # ── 3C. Candidate Specific Compensation Inquiry ──
            # e.g., "what is her salary expectation ?", "what is her ctc ?", "is she within budget ?"
            is_cand_comp_inquiry = any(w in q_lower for w in [
                "ctc", "salary", "budget", "compensation", "lpa", "expected pay", "cost to company",
                "pay", "cost", "expectation", "expecting", "rate", "package"
            ])
            if is_cand_comp_inquiry:
                facts = [
                    f"Candidate: {target_cand.name} ({target_cand.job_title})",
                    f"Expected CTC: {cand_comp['candidate_expectation_formatted']}",
                    f"Current CTC: {cand_comp['candidate_current_ctc_formatted']}",
                    f"Job Advertised Budget: {cand_comp['job_budget_formatted']}",
                    f"Budget Alignment: {cand_comp['relationship_label']}"
                ]
                metrics = [
                    f"Expected CTC: {cand_comp['candidate_expectation_formatted']}",
                    f"Job Budget: {cand_comp['job_budget_formatted']}",
                    f"Alignment: {cand_comp['relationship_label']}"
                ]
                interp = (
                    f"**{target_cand.name}** is requesting **{cand_comp['candidate_expectation_formatted']}**, which is **{cand_comp['relationship_label']}** "
                    f"relative to the {target_cand.job_title} advertised budget of **{cand_comp['job_budget_formatted']}**. "
                    f"Their verified current compensation is **{cand_comp['candidate_current_ctc_formatted']}**."
                )
                return {
                    "text": f"Compensation Alignment Analysis for **{target_cand.name}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interp,
                    "uncertainty": "Candidate expectation is based on self-reported CTC declaration during resume submission.",
                    "candidate_id": str(target_cand.id),
                    "candidate_name": target_cand.name
                }

            # ── 3D. Candidate Experience & Resume Inquiry ──
            # e.g., "what is her experience ?", "tell me about her background", "summarize her resume"
            is_exp_inquiry = any(w in q_lower for w in [
                "experience", "background", "resume", "cv", "history", "years", "education", "worked", "qualification", "summary"
            ])
            if is_exp_inquiry:
                facts = [
                    f"Candidate: {target_cand.name} ({target_cand.job_title})",
                    f"Experience: {target_cand.experience_years or 'N/A'} years",
                    f"Education: {target_cand.education or 'Relevant technical degree'}",
                    f"Resume Summary: {target_cand.resume_summary or 'No summary provided'}",
                    f"Primary Skills: {', '.join(cand_skills[:6]) if cand_skills else 'None declared'}"
                ]
                metrics = [
                    f"Experience: {target_cand.experience_years or 0} yrs",
                    f"Fit Score: {target_cand.match_score or 0}%"
                ]
                interp = (
                    f"**{target_cand.name}** brings **{target_cand.experience_years or 0} years** of professional experience with credentials in **{target_cand.education or 'relevant studies'}**. "
                    + (f"Profile synopsis: {target_cand.resume_summary}" if target_cand.resume_summary else "")
                )
                return {
                    "text": f"Professional Background & Experience for **{target_cand.name}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interp,
                    "uncertainty": "Resume details are parsed from candidate documents and require recruiter interview verification.",
                    "candidate_id": str(target_cand.id),
                    "candidate_name": target_cand.name
                }

            # ── 3E. Candidate Specific Interview Inquiry ──
            # e.g., "when is his interview ?", "what is his meeting link ?", "is he scheduled ?"
            is_cand_interview_inquiry = any(w in q_lower for w in [
                "interview", "meet", "meeting", "scheduled", "schedule", "slot", "calendar", "call", "link", "google meet"
            ])
            if is_cand_interview_inquiry:
                cand_slot = target_cand.interview_scheduled_at or "Not yet scheduled"
                cand_meet = target_cand.interview_meeting_url
                cand_st = (target_cand.interview_status or "not_scheduled").replace("_", " ").title()

                facts = [
                    f"Candidate: {target_cand.name} ({target_cand.job_title})",
                    f"Interview Status: {cand_st} (Stage: {wf_stage.title()})",
                    f"Scheduled Slot: {cand_slot}",
                ]
                if cand_meet:
                    facts.append(f"Google Meet Link: {cand_meet}")
                else:
                    facts.append("Google Meet Link: Not generated yet (scheduling pending)")

                metrics = [
                    f"Status: {cand_st}",
                    f"Slot: {cand_slot}"
                ]

                interp = (
                    f"**{target_cand.name}** is currently in the **{cand_st}** interview status. "
                    + (f"Their interview session is confirmed for **{cand_slot}**. " if target_cand.interview_scheduled_at else "No interview date or time has been scheduled yet. ")
                    + (f"You can join the Google Meet session at: {cand_meet}" if cand_meet else "Click 'Schedule' in their workspace to send an invitation.")
                )

                return {
                    "text": f"Interview Schedule & Meeting Details for **{target_cand.name}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interp,
                    "uncertainty": "",
                    "candidate_id": str(target_cand.id),
                    "candidate_name": target_cand.name
                }

            # ── 3F. Comprehensive Candidate Intelligence Briefing (Default for Candidate) ──
            facts = [
                f"Candidate: {target_cand.name} (Requisition: {target_cand.job_title})",
                f"Current Status: Stage {wf_stage.title()} • Hiring Decision: {wf_decision.title()}",
                f"Assessment: {wf_assess.replace('_', ' ').title()} • Score: {target_cand.coding_score or (target_cand.scores.get('overall', 'N/A') if isinstance(target_cand.scores, dict) else 'N/A')}/100",
                f"Proctor Integrity: {target_cand.integrity_risk or 'Low'} Risk • Telemetry Score: {target_cand.integrity_score or 100}/100"
            ]
            metrics = [
                f"Fit Score: {target_cand.match_score or 0}%",
                f"Verified Skills: {len(matched)} of {len(req_skills)}" if req_skills else f"Skills: {len(cand_skills)}"
            ]

            if cand_comp["relationship"] != RELATIONSHIP_EXPECTATION_UNAVAILABLE:
                facts.append(
                    f"Compensation: Expected {cand_comp['candidate_expectation_formatted']} "
                    f"(Current {cand_comp['candidate_current_ctc_formatted']}) • "
                    f"Job Budget: {cand_comp['job_budget_formatted']} • "
                    f"Alignment: {cand_comp['relationship_label']}"
                )
                metrics.append(f"Budget Alignment: {cand_comp['relationship_label']}")

            interpretation = (
                f"{target_cand.name} is currently in the **{wf_stage.title()}** stage with a **{target_cand.match_score or 0}%** role fit score. "
                + (f"Key strengths: {', '.join(matched[:4])}. " if matched else "")
                + (f"Compensation expectation is **{cand_comp['candidate_expectation_formatted']}** ({cand_comp['relationship_label']}). " if cand_comp['relationship'] != RELATIONSHIP_EXPECTATION_UNAVAILABLE else "")
                + (f"Identified growth competencies: {', '.join(missing[:3])}. " if missing else "No critical skill gaps identified against role criteria. ")
            )

            # If an LLM is configured, enrich the interpretation with live LLM synthesis
            llm_stat = get_llm_status()
            if llm_stat.get("has_key"):
                prompt = (
                    f"Recruiter Query: '{query}'\n\n"
                    f"Candidate Data:\n"
                    f"- Name: {target_cand.name}\n"
                    f"- Job: {target_cand.job_title}\n"
                    f"- Match Score: {target_cand.match_score}%\n"
                    f"- Skills: {', '.join(cand_skills)}\n"
                    f"- Stage: {wf_stage}, Decision: {wf_decision}\n"
                    f"- Expected CTC: {cand_comp['candidate_expectation_formatted']}\n"
                    f"- Current CTC: {cand_comp['candidate_current_ctc_formatted']}\n"
                    f"- Job Budget: {cand_comp['job_budget_formatted']}\n"
                    f"- Budget Alignment: {cand_comp['relationship_label']}\n"
                    f"- Assessment Score: {target_cand.coding_score}\n"
                    f"- Resume Summary: {target_cand.resume_summary or 'N/A'}\n\n"
                    f"Provide a concise, professional 2-3 sentence recruiter briefing answering the recruiter's query."
                )
                llm_response = call_llm(prompt, "You are Ask SparkX, an expert AI recruitment intelligence assistant.")
                if llm_response:
                    interpretation = llm_response.strip()

            return {
                "text": f"Candidate Intelligence Briefing for **{target_cand.name}**:",
                "database_facts": facts,
                "metrics": metrics,
                "ai_interpretation": interpretation,
                "uncertainty": "Assessment evaluations measure isolated execution metrics. Qualitative communication is verified during live interviews.",
                "candidate_id": str(target_cand.id),
                "candidate_name": target_cand.name
            }


        # ── 4. INTERVIEW SCHEDULING & CALENDAR INTELLIGENCE ──
        # Handles queries about candidate interview times, scheduled meetings, Google Meet links, and open slots
        is_interview_intent = any(w in q_lower for w in [
            "interview", "interviews", "scheduled", "scheduling", "meet", "meeting", "google meet", "calendar", "slot", "slots"
        ])
        if is_interview_intent:
            now = datetime.now()
            today_iso = now.strftime("%Y-%m-%d")
            tomorrow_iso = (now + timedelta(days=1)).strftime("%Y-%m-%d")
            
            is_asking_today = "today" in q_lower
            is_asking_tomorrow = "tomorrow" in q_lower
            
            # Extract target time if specified (e.g., "2 pm", "2:00 pm", "14:00", "11.45", "11:45 am", "12.15")
            time_match = re.search(r"\b(\d{1,2})(?::|\.)?(\d{2})?\s*(am|pm)?\b", q_lower)
            target_h = None
            target_m = None
            time_label = ""
            
            if time_match:
                raw_val = int(time_match.group(1))
                if 0 <= raw_val <= 23:
                    target_h = raw_val
                    target_m = int(time_match.group(2)) if time_match.group(2) else 0
                    ampm = (time_match.group(3) or "").lower()
                    if ampm == "pm" and target_h < 12:
                        target_h += 12
                    elif ampm == "am" and target_h == 12:
                        target_h = 0
                    time_label = time_match.group(0).strip()
            
            # Helper to check if slot string matches query date/time
            def check_slot(slot_str: str) -> bool:
                if not slot_str or slot_str.strip() in ["Upcoming Slot", ""]:
                    return False
                s_lower = slot_str.lower()
                
                # Date match check
                date_ok = False
                if is_asking_today:
                    date_ok = (today_iso in s_lower) or ("today" in s_lower) or (not re.search(r"\d{4}-\d{2}-\d{2}", s_lower) and "tomorrow" not in s_lower)
                elif is_asking_tomorrow:
                    date_ok = (tomorrow_iso in s_lower) or ("tomorrow" in s_lower)
                else:
                    date_ok = True
                    
                if not date_ok:
                    return False
                    
                if target_h is None:
                    return True
                    
                # Time matching
                sm_match = re.search(r"(\d{1,2}):(\d{2})(?:\s*(am|pm))?", s_lower)
                if sm_match:
                    sh = int(sm_match.group(1))
                    sm = int(sm_match.group(2))
                    sampm = (sm_match.group(3) or "").lower()
                    if sampm == "pm" and sh < 12:
                        sh += 12
                    elif sampm == "am" and sh == 12:
                        sh = 0
                    if sh == target_h and abs(sm - (target_m or 0)) <= 20:
                        return True
                    if sh == target_h and (target_m == 0 or target_m is None):
                        return True
                return False

            scheduled_cands = [
                c for c in candidates 
                if (c.interview_scheduled_at and c.interview_scheduled_at.strip() not in ["", "Upcoming Slot"])
                or getattr(c, 'interview_status', '') in ['scheduled', 'in_progress', 'completed']
            ]

            matching = [c for c in scheduled_cands if check_slot(c.interview_scheduled_at or "")]
            
            slot_desc = ""
            if is_asking_today and time_label:
                slot_desc = f"today at {time_label}"
            elif is_asking_tomorrow and time_label:
                slot_desc = f"tomorrow at {time_label}"
            elif time_label:
                slot_desc = f"at {time_label}"
            elif is_asking_today:
                slot_desc = "today"
            elif is_asking_tomorrow:
                slot_desc = "tomorrow"
            else:
                slot_desc = "upcoming schedule"

            # Case A: Found candidate(s) for the exact requested slot
            if matching:
                cand = matching[0]
                facts = [
                    f"Candidate: **{cand.name}** ({cand.job_title})",
                    f"Scheduled Time: **{cand.interview_scheduled_at}**",
                    f"Interview Status: {(cand.interview_status or 'Scheduled').replace('_', ' ').title()} (Stage: {getattr(cand, 'stage', 'Interview').title()})",
                    f"Google Meet Link: {cand.interview_meeting_url or 'Link ready on confirmation'}",
                    f"Contact: {cand.email} • Match Score: {cand.match_score or 0}%"
                ]
                if len(matching) > 1:
                    facts.append(f"Additional Scheduled: {', '.join(c.name for c in matching[1:])}")

                metrics = [
                    f"Scheduled: {cand.name}",
                    f"Slot: {cand.interview_scheduled_at}",
                    f"Status: {(cand.interview_status or 'Scheduled').title()}"
                ]

                interp = (
                    f"**{cand.name}** is scheduled for an interview **{slot_desc}** ({cand.interview_scheduled_at}) for the **{cand.job_title}** position. "
                    + (f"Google Meet session URL: {cand.interview_meeting_url}. " if cand.interview_meeting_url else "")
                    + f"Their screening match score is **{cand.match_score or 0}%**."
                )

                return {
                    "text": f"Interview Scheduled for **{slot_desc}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interp,
                    "uncertainty": "",
                    "candidate_id": str(cand.id),
                    "candidate_name": cand.name
                }

            # Case B: Specific time or day requested, but NO candidate is booked for that slot
            elif time_label or is_asking_today or is_asking_tomorrow:
                today_cands = [c for c in scheduled_cands if today_iso in str(c.interview_scheduled_at) or "today" in str(c.interview_scheduled_at).lower()]
                other_cands = [c for c in scheduled_cands if c not in today_cands]

                facts = [
                    f"Verified Database Fact: No candidate interview is currently scheduled for **{slot_desc}**."
                ]
                if today_cands:
                    facts.append(f"Active Bookings Scheduled for Today ({today_iso}):")
                    for c in today_cands:
                        facts.append(f"• **{c.name}** ({c.job_title}) — Slot: {c.interview_scheduled_at} | Status: {(c.interview_status or 'Scheduled').replace('_', ' ').title()} | Meet: {c.interview_meeting_url or 'Link ready'}")
                else:
                    facts.append("No interviews booked for today.")

                if other_cands:
                    facts.append("Upcoming Confirmed Bookings in Pipeline:")
                    for c in other_cands[:4]:
                        facts.append(f"• **{c.name}** ({c.job_title}) — Slot: {c.interview_scheduled_at} | Status: {(c.interview_status or 'Scheduled').replace('_', ' ').title()} | Meet: {c.interview_meeting_url or 'Google Meet'}")

                metrics = [
                    f"{slot_desc.capitalize()}: Available (No booking)",
                    f"Today's Confirmed: {len(today_cands)}",
                    f"Total Pipeline Scheduled: {len(scheduled_cands)}"
                ]

                interpretation = (
                    f"There is currently **no candidate interview scheduled for {slot_desc}**. "
                    + (f"However, **{today_cands[0].name}** has an interview confirmed for today at **{today_cands[0].interview_scheduled_at}** ({today_cands[0].interview_meeting_url or 'Google Meet'}). " if today_cands else "")
                    + (f"Next upcoming interview is **{other_cands[0].name}** ({other_cands[0].interview_scheduled_at}). " if (not today_cands and other_cands) else "")
                    + "The requested slot is completely free. You can open any candidate's workspace and click **Schedule** to book an interview."
                )

                llm_stat = get_llm_status()
                if llm_stat.get("has_key"):
                    schedule_context = "\n".join(facts)
                    prompt = (
                        f"Recruiter Question: '{query}'\n\n"
                        f"Database Verified Facts:\n{schedule_context}\n\n"
                        f"Provide a clear, professional 2-sentence response directly answering if anyone is scheduled at the requested time, and what is currently scheduled instead."
                    )
                    llm_ans = call_llm(prompt, "You are Ask SparkX, an expert AI recruitment intelligence assistant.")
                    if llm_ans:
                        interpretation = llm_ans.strip()

                return {
                    "text": f"Interview Schedule Status for **{slot_desc}**:",
                    "database_facts": facts,
                    "metrics": metrics,
                    "ai_interpretation": interpretation,
                    "uncertainty": "Schedule updates reflect real-time Google Calendar and database state."
                }

            # Case C: General interview schedule overview
            else:
                facts = [
                    f"Total Confirmed Scheduled Interviews: {len(scheduled_cands)} candidate(s)",
                    f"Candidates in Interview Pipeline Stage: {len([c for c in candidates if getattr(c, 'stage', '') == 'interview'])} candidate(s)"
                ]
                for c in scheduled_cands:
                    facts.append(f"• **{c.name}** ({c.job_title}) — Slot: {c.interview_scheduled_at} | Status: {(c.interview_status or 'Scheduled').replace('_', ' ').title()} | Meet: {c.interview_meeting_url or 'Link ready'}")

                return {
                    "text": "Current Pipeline Interview Schedule & Calendar:",
                    "database_facts": facts,
                    "metrics": [
                        f"Confirmed Interviews: {len(scheduled_cands)}",
                        f"Interview Stage Total: {len([c for c in candidates if getattr(c, 'stage', '') == 'interview'])}"
                    ],
                    "ai_interpretation": (
                        f"The recruitment pipeline currently has {len(scheduled_cands)} confirmed candidate interview session(s). "
                        + (f"Next upcoming session is **{scheduled_cands[0].name}** at **{scheduled_cands[0].interview_scheduled_at}**." if scheduled_cands else "Use the 'Schedule' button in candidate workspaces to book interview slots.")
                    ),
                    "uncertainty": ""
                }


        # ── 5. STRUCTURED COMPENSATION & CTC RECRUITMENT INTELLIGENCE ──
        is_comp_query = any(w in q_lower for w in [
            "ctc", "salary", "budget", "compensation", "lpa", "expected pay", "cost to company",
            "advertised range", "within range", "above range", "below range", "overlap", "pay expectation",
            "higher than budget", "more than budget", "within budget", "exceeding budget"
        ])
        if is_comp_query:
            # Candidate user asking about their own expectations or job budget
            if is_candidate_user:
                cand_apps = [c for c in candidates if c.email and payload.user_email and c.email.lower() == payload.user_email.lower()]
                if cand_apps:
                    facts = []
                    for a in cand_apps:
                        comp = analyze_candidate_application(a, a.job)
                        facts.append(
                            f"Role: {a.job_title} | Advertised Budget: {comp['job_budget_formatted']} | "
                            f"Your Expected CTC: {comp['candidate_expectation_formatted']} "
                            f"(Current: {comp['candidate_current_ctc_formatted']})"
                        )
                    return {
                        "text": f"Compensation Summary for **{payload.user_name or 'Candidate'}**:",
                        "database_facts": facts,
                        "metrics": [f"Applications on Record: {len(cand_apps)}"],
                        "ai_interpretation": "Your submitted salary expectations are permanently preserved per application and evaluated confidentially by the hiring team.",
                        "uncertainty": "Recruiter budget evaluations consider skills, interview rubric evidence, and market leveling."
                    }
                else:
                    return {
                        "text": "Compensation Guidance:",
                        "database_facts": ["No active submitted applications found under your account."],
                        "metrics": [],
                        "ai_interpretation": "When applying to open roles on SparkX, you can indicate exact or range expectations in LPA (INR) to ensure transparent compensation calibration.",
                        "uncertainty": ""
                    }

            # Recruiter query: Determine relevant job and candidates
            active_job = target_job
            if not active_job and jobs:
                # Check if query mentions a specific job title
                for j in jobs:
                    if j.title and any(w in q_lower for w in j.title.lower().split() if len(w) > 3):
                        active_job = j
                        break
                if not active_job:
                    # Default to job with most applicants or first job
                    active_job = max(jobs, key=lambda j: len(j.candidates)) if jobs else None

            relevant_cands = [c for c in candidates if str(c.job_id) == str(active_job.id)] if active_job else candidates
            metrics_data = calculate_job_compensation_metrics(relevant_cands, active_job)
            budget_str = metrics_data["job_budget_formatted"]

            # Sub-intent: Above budget
            if any(w in q_lower for w in ["above", "more than", "exceed", "higher", "out of budget"]):
                matching = []
                for c in relevant_cands:
                    comp = analyze_candidate_application(c, active_job)
                    if comp["relationship"] == RELATIONSHIP_ABOVE_RANGE:
                        matching.append(c)

                facts = [
                    f"Job Target: {active_job.title} (Advertised Budget: {budget_str})" if active_job else "All Active Roles",
                    f"Total Candidates Expecting Above Budget: {len(matching)} of {len(relevant_cands)} applicant(s)"
                ]
                for c in matching[:6]:
                    comp = analyze_candidate_application(c, active_job)
                    facts.append(f"• {c.name}: Expecting {comp['candidate_expectation_formatted']} (Current: {comp['candidate_current_ctc_formatted']}, Fit: {c.match_score or 0}%)")

                return {
                    "text": f"Candidates Expecting Above Advertised Budget ({len(matching)}):",
                    "database_facts": facts,
                    "metrics": [
                        f"Above Budget: {len(matching)} ({round((len(matching) / (len(relevant_cands) or 1)) * 100)}%)",
                        f"Advertised Cap: {budget_str}",
                        f"Average Expected CTC: {metrics_data['average_expected_ctc_formatted']}"
                    ],
                    "ai_interpretation": (
                        f"Found {len(matching)} candidate(s) whose salary expectations exceed the {budget_str} cap. "
                        + ("High-match candidates in this group can be considered for Senior / Staff level exceptions if technical evaluation exceeds benchmarks." if matching else "All current applicants are positioned within or below the advertised ceiling.")
                    ),
                    "uncertainty": f"{metrics_data['unprovided_count']} applicant(s) have not submitted expected CTC." if metrics_data['unprovided_count'] > 0 else ""
                }

            # Sub-intent: Within range / within budget
            if any(w in q_lower for w in ["within", "in budget", "meet", "inside", "fit budget", "under budget"]):
                matching = []
                for c in relevant_cands:
                    comp = analyze_candidate_application(c, active_job)
                    if comp["relationship"] == RELATIONSHIP_WITHIN_RANGE:
                        matching.append(c)

                facts = [
                    f"Job Target: {active_job.title} (Advertised Budget: {budget_str})" if active_job else "All Active Roles",
                    f"Candidates Within Advertised Range: {len(matching)} of {len(relevant_cands)} applicant(s)"
                ]
                for c in matching[:6]:
                    comp = analyze_candidate_application(c, active_job)
                    facts.append(f"• {c.name}: Expecting {comp['candidate_expectation_formatted']} (Current: {comp['candidate_current_ctc_formatted']}, Fit: {c.match_score or 0}%)")

                return {
                    "text": f"Candidates Within Advertised Compensation Range ({len(matching)}):",
                    "database_facts": facts,
                    "metrics": [
                        f"Within Budget: {len(matching)} ({round((len(matching) / (len(relevant_cands) or 1)) * 100)}%)",
                        f"Advertised Range: {budget_str}",
                        f"Average Expected CTC: {metrics_data['average_expected_ctc_formatted']}"
                    ],
                    "ai_interpretation": (
                        f"{len(matching)} candidate(s) are strictly aligned with your budget parameters of {budget_str}. "
                        "These candidates present zero compensation friction and can be prioritized for immediate screening advancement."
                    ),
                    "uncertainty": f"{metrics_data['unprovided_count']} applicant(s) have not provided expected CTC." if metrics_data['unprovided_count'] > 0 else ""
                }

            # Sub-intent: Partial overlap
            if any(w in q_lower for w in ["overlap", "partially"]):
                matching = []
                for c in relevant_cands:
                    comp = analyze_candidate_application(c, active_job)
                    if comp["relationship"] == RELATIONSHIP_PARTIAL_OVERLAP:
                        matching.append(c)

                facts = [
                    f"Job Target: {active_job.title} (Advertised Budget: {budget_str})" if active_job else "All Active Roles",
                    f"Candidates with Partially Overlapping Expectations: {len(matching)} applicant(s)"
                ]
                for c in matching[:6]:
                    comp = analyze_candidate_application(c, active_job)
                    facts.append(f"• {c.name}: Expecting {comp['candidate_expectation_formatted']} (Current: {comp['candidate_current_ctc_formatted']}, Fit: {c.match_score or 0}%)")

                return {
                    "text": f"Candidates with Overlapping CTC Expectations ({len(matching)}):",
                    "database_facts": facts,
                    "metrics": [
                        f"Partial Overlap: {len(matching)}",
                        f"Advertised Budget: {budget_str}"
                    ],
                    "ai_interpretation": (
                        f"{len(matching)} applicant(s) submitted salary ranges that partially overlap the {budget_str} band. "
                        "Negotiation during offer stage is likely viable if technical depth aligns with team leveling."
                    ),
                    "uncertainty": "Candidates with wide expectation bands may require early recruiter phone calibration."
                }

            # Sub-intent: Not provided / missing
            if any(w in q_lower for w in ["not provided", "missing", "haven't provided", "no ctc", "unspecified"]):
                unprovided = [c for c in relevant_cands if analyze_candidate_application(c, active_job)["relationship"] == RELATIONSHIP_EXPECTATION_UNAVAILABLE]
                facts = [
                    f"Job Target: {active_job.title}" if active_job else "All Active Roles",
                    f"Total Applicants Missing Expected CTC: {len(unprovided)} of {len(relevant_cands)}"
                ]
                for c in unprovided[:8]:
                    facts.append(f"• {c.name} ({c.job_title}) — Stage: {getattr(c, 'stage', 'screening').title()}")

                return {
                    "text": f"Applicants Without Specified CTC Expectations ({len(unprovided)}):",
                    "database_facts": facts,
                    "metrics": [
                        f"Unprovided Count: {len(unprovided)}",
                        f"Unprovided Ratio: {round((len(unprovided) / (len(relevant_cands) or 1)) * 100)}%"
                    ],
                    "ai_interpretation": (
                        f"{len(unprovided)} candidate(s) did not declare expected CTC during initial resume submission. "
                        "Recommend sending an automated screening questionnaire before scheduling technical rounds."
                    ),
                    "uncertainty": "Missing compensation values prevent automated budget boundary checks."
                }

            # General Compensation Analysis & Comparison
            facts = [
                f"Job Target: {active_job.title} (Budget: {budget_str})" if active_job else "All Active Roles",
                f"Total Applicants Analyzed: {metrics_data['total_applicants']} candidate(s)",
                f"Provided CTC Expectations: {metrics_data['provided_count']} applicant(s)",
                f"Within Advertised Range: {metrics_data['within_range_count']} candidate(s)",
                f"Above Advertised Range: {metrics_data['above_range_count']} candidate(s)",
                f"Below Advertised Range: {metrics_data['below_range_count']} candidate(s)",
                f"Partial Overlap: {metrics_data['partial_overlap_count']} candidate(s)"
            ]
            if metrics_data["unprovided_count"] > 0:
                facts.append(f"Unprovided / Undisclosed: {metrics_data['unprovided_count']} candidate(s)")

            return {
                "text": f"Compensation Intelligence Analysis for **{active_job.title if active_job else 'Active Roles'}**:",
                "database_facts": facts,
                "metrics": [
                    f"Advertised Budget: {budget_str}",
                    f"Average Expected CTC: {metrics_data['average_expected_ctc_formatted']}",
                    f"Median Expected CTC: {metrics_data['median_expected_ctc_formatted']}",
                    f"Expectation Range: {metrics_data['min_expected_ctc_formatted']} to {metrics_data['max_expected_ctc_formatted']}"
                ],
                "ai_interpretation": (
                    f"For {active_job.title if active_job else 'this role'}, the advertised budget is {budget_str}. "
                    f"Applicants report an average expected CTC of {metrics_data['average_expected_ctc_formatted']}. "
                    f"{metrics_data['within_range_count']} candidate(s) fit strictly within budget, while {metrics_data['above_range_count']} exceed the cap."
                ),
                "uncertainty": f"{metrics_data['unprovided_count']} applicant(s) have not provided compensation data." if metrics_data['unprovided_count'] > 0 else ""
            }

        # ── 6. ACTION REQUIRED / PENDING TRIAGE ──
        if any(w in q_lower for w in ["action required", "action items", "need action", "waiting for action", "pending triage", "triage queue", "attention needed"]) or (
            any(w in q_lower for w in ["action", "triage", "bottleneck"]) and not any(w in q_lower for w in ["interview", "schedule", "meet", "ctc", "salary"])
        ):
            inbound = [c for c in candidates if getattr(c, 'stage', 'screening') == 'applied']
            reviewing = [c for c in candidates if getattr(c, 'stage', 'screening') == 'review' and getattr(c, 'hiring_decision', 'undecided') == 'undecided']
            invited_tests = [c for c in candidates if getattr(c, 'assessment_status', '') in ['invited', 'in_progress']]

            return {
                "text": "Pipeline Action Queue & Pending Approvals:",
                "database_facts": [
                    f"Inbound Applications awaiting triage: {len(inbound)} candidate(s)",
                    f"Review stage awaiting hiring decision: {len(reviewing)} candidate(s)",
                    f"Assessments in progress or awaiting submission: {len(invited_tests)} candidate(s)"
                ],
                "metrics": [
                    f"Total Actionable: {len(inbound) + len(reviewing)}",
                    f"Primary Bottleneck: {'Inbound Triage' if len(inbound) > len(reviewing) else 'Committee Decision'}"
                ],
                "ai_interpretation": (
                    f"Recruiter recommendations: Advance {len(inbound)} inbound applicant(s) into active screening, "
                    f"and finalize hiring decisions on {len(reviewing)} evaluated candidate(s) currently in the Review stage."
                ),
                "uncertainty": "Pending assessment counts rely on candidate testing schedules."
            }

        # ── 5. SKILL SPECIFIC SEARCH ──
        skill_match = re.search(r"(?:who knows|which candidates? (?:know|have|use)|search for skill|skills? in)\s+([a-zA-Z0-9_\+\#\.\s]+)", q_lower)
        if skill_match:
            search_skill = skill_match.group(1).strip().lower()
            matching_cands = [c for c in candidates if any(search_skill in s.lower() for s in (c.skills or []))]
            return {
                "text": f"Candidates with verified skill '{search_skill.title()}':",
                "database_facts": [
                    f"{c.name} ({c.job_title}) — Fit: {c.match_score or 0}%, Stage: {getattr(c, 'stage', 'screening').title()}"
                    for c in matching_cands[:8]
                ] if matching_cands else [f"No candidates found with '{search_skill}' listed in verified skills."],
                "metrics": [
                    f"Matching Applicants: {len(matching_cands)} of {len(candidates)} total",
                    f"Match Percentage: {round((len(matching_cands) / (len(candidates) or 1)) * 100)}%"
                ],
                "ai_interpretation": f"Found {len(matching_cands)} applicant(s) demonstrating competence in {search_skill.title()}.",
                "uncertainty": "Skills are extracted and validated from candidate resume parsing and assessment verification."
            }

        # ── 6. PIPELINE OVERVIEW (ONLY WHEN SPECIFICALLY REQUESTED) ──
        if any(w in q_lower for w in ["pipeline", "overview", "summary", "database", "stats", "how many"]):
            stages_count = {
                "applied": len([c for c in candidates if getattr(c, 'stage', '') == 'applied']),
                "screening": len([c for c in candidates if getattr(c, 'stage', '') == 'screening']),
                "assessment": len([c for c in candidates if getattr(c, 'stage', '') == 'assessment']),
                "interview": len([c for c in candidates if getattr(c, 'stage', '') == 'interview']),
                "review": len([c for c in candidates if getattr(c, 'stage', '') == 'review']),
                "completed": len([c for c in candidates if getattr(c, 'stage', '') == 'completed']),
            }
            high_match = len([c for c in candidates if (c.match_score or 0) >= 85])
            high_risk = len([c for c in candidates if c.integrity_risk == 'High'])

            return {
                "text": "Live Recruitment Pipeline Intelligence Summary:",
                "database_facts": [
                    f"Total Candidates: {len(candidates)} across {len(jobs)} active jobs",
                    f"Stage Breakdown: Inbound: {stages_count['applied']}, Screening: {stages_count['screening']}, Assessment: {stages_count['assessment']}, Interview: {stages_count['interview']}, Review: {stages_count['review']}, Completed: {stages_count['completed']}"
                ],
                "metrics": [
                    f"High-Match Candidates (>=85%): {high_match}",
                    f"Integrity Flags: {high_risk}"
                ],
                "ai_interpretation": f"Your pipeline currently tracks {len(candidates)} candidates. {stages_count['applied']} applicants are in Inbound triage, and {stages_count['review']} are awaiting committee decisions.",
                "uncertainty": "Synchronous database status as of current query timestamp."
            }

        # ── 7. GENERAL LLM QUERY FALLBACK ──
        llm_stat = get_llm_status()
        if llm_stat.get("has_key"):
            prompt = (
                f"Recruiter Question: '{query}'\n\n"
                f"System Context:\n"
                f"- Active Jobs: {len(jobs)} ({', '.join(j.title for j in jobs[:3])})\n"
                f"- Total Candidates: {len(candidates)}\n\n"
                f"Answer the recruiter's question professionally, insightfully, and concisely."
            )
            llm_text = call_llm(prompt, "You are Ask SparkX, an elite AI recruitment copilot.")
            if llm_text:
                return {
                    "text": llm_text.strip(),
                    "database_facts": [],
                    "metrics": [],
                    "ai_interpretation": "",
                    "uncertainty": ""
                }

        # Fallback intelligent answer
        return {
            "text": f"I analyzed your query: \"{query}\"",
            "database_facts": [],
            "metrics": [],
            "ai_interpretation": "You can ask me about specific candidate qualifications (e.g., 'Tell me about Aarav'), pipeline bottlenecks (e.g., 'Which candidates need action?'), or search by skill (e.g., 'Who knows Python?').",
            "uncertainty": ""
        }
