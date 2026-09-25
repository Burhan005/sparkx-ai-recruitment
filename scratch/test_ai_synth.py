import os
import sys
import json
import re

sys.path.insert(0, os.path.abspath("backend"))
from dotenv import load_dotenv
load_dotenv("backend/.env")

from ai_engine import call_llm

def evaluate_scenario_response(scenario_prompt, candidate_response, job_title="Cloud Engineer", job_skills=None, ideal_keywords=None):
    if not candidate_response or len(candidate_response.strip()) < 15:
        return {
            "score": 0,
            "quality": "unsubmitted",
            "feedback": "No technical architectural solution was submitted for this scenario.",
            "strengths": [],
            "gaps": ["No solution provided."]
        }

    skills_str = ", ".join(job_skills or ["Architecture", "Cloud Infrastructure"])
    kw_str = ", ".join(ideal_keywords or ["Failover", "VPC", "Security", "Availability"])
    prompt = f"""You are a Principal Systems Architect evaluating a candidate's solution to an incident/architecture scenario.
Role: {job_title}
Key Technologies: {skills_str}

Scenario Given:
\"\"\"{scenario_prompt}\"\"\"

Candidate's Solution:
\"\"\"{candidate_response}\"\"\"

Ideal Architectural Dimensions: {kw_str}

Evaluate the response objectively on architectural soundness, technical depth, and trade-offs.
Return strictly valid JSON only:
{{
  "score": integer between 10 and 100,
  "quality": "exceptional" | "solid" | "vague" | "inadequate",
  "feedback": "2-3 sentences summarizing technical assessment",
  "strengths": ["string"],
  "gaps": ["string"]
}}"""

    res = call_llm(prompt, "You are a Principal Architect evaluator. Return valid JSON only.", max_tokens=1024)
    if res:
        clean = re.sub(r"^```(?:json)?\s*", "", res.strip(), flags=re.MULTILINE)
        clean = re.sub(r"```\s*$", "", clean, flags=re.MULTILINE).strip()
        try:
            return json.loads(clean, strict=False)
        except Exception:
            pass

    # Fallback heuristic if LLM offline
    word_count = len(candidate_response.split())
    matched_kws = [k for k in (ideal_keywords or []) if k.lower() in candidate_response.lower()]
    score = min(90, max(20, 30 + len(matched_kws) * 12 + min(20, int(word_count / 10))))
    return {
        "score": score,
        "quality": "solid" if score >= 60 else "vague",
        "feedback": f"Evaluated based on architectural coverage ({len(matched_kws)} core domain concepts identified).",
        "strengths": matched_kws,
        "gaps": []
    }

# Test 1: Empty response
res_empty = evaluate_scenario_response("Design a multi-region disaster recovery for AWS", "")
print("Empty score:", res_empty["score"])

# Test 2: High quality response
sample_ans = """To solve the cross-region disaster recovery and multi-account isolation:
1. Landing Zone: We will deploy AWS Organizations with Control Tower. Create OUs: Security (Log Archive, Security Tooling), Workloads (Dev, Stage, Prod in separate member accounts), and Infrastructure.
2. Cross-Region Resiliency: Deploy Aurora PostgreSQL Global Database with primary in us-east-1 and read replica in us-west-2 with RPO < 1s. For container workloads on EKS, use ArgoCD for GitOps multi-cluster deployment.
3. Network & Ingress: Route 53 Application Recovery Controller (ARC) with health checks pointing to regional ALBs. If us-east-1 degrades, ARC triggers automated DNS failover to us-west-2.
4. Security & Audit: CloudTrail multi-region enabled in management account writing to central S3 bucket in Log Archive account with Object Lock and SSE-KMS."""

res_good = evaluate_scenario_response("Design a multi-region disaster recovery for AWS", sample_ans, job_skills=["AWS", "Kubernetes", "PostgreSQL"])
print("Good response score:", res_good["score"], res_good["quality"])
print("Good response feedback:", res_good["feedback"])
