import sys
import os
import json

backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from test_resume_parser import parse_resume_text, user_text
from ai_engine import calculate_resume_job_match

job_data = {
    "id": "job-e12be8",
    "title": "Senior Financial Controller & Tax Auditor",
    "department": "Finance & Accounting",
    "description": "Lead quarterly GAAP/IFRS balance sheet reconciliations, month-end ledger audits, variance audits, and corporate tax compliance.",
    "required_skills": ["GAAP", "Financial Reconciliation", "Corporate Tax", "Internal Auditing", "Variance Analysis"],
    "min_experience_years": 5,
    "education": "Master of Accounting / CPA",
    "optional_criteria": ""
}

parsed = parse_resume_text(user_text)
parsed["resume_text"] = user_text

res = calculate_resume_job_match(job_data, parsed)
print("=== Match Result with Parsed Data ===")
print("Match Score:", res["match_score"])
print("Matched Skills:", res["matched_skills"])
print("Missing Skills:", res["missing_skills"])
print("Category Scores:", res["category_scores"])
print("Explanation:", res["explanation"])
