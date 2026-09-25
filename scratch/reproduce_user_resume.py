import sys
import os
import re

backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

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

resume_text = """ew York, NY (Hybrid) | (555) 123-4567 | burhan.kapasi@example.com | linkedin.com/in/burhankapasi

Strategic and highly analytical Certified Public Accountant (CPA) with extensive expertise in financial controllership, corporate tax strategy, and audit readiness. Specializes in managing complex financial operations for enterprise organizations, ensuring strict adherence to evolving compliance standards. Proven track record of leading highly precise GAAP and IFRS balance sheet reconciliations, executing comprehensive month-end ledger audits, and identifying critical cost-saving opportunities through rigorous variance analysis.
Core Competencies
GAAP / IFRS Reconciliations
Month-End Ledger Audits
Variance Audits & Analysis
Corporate Tax Compliance
Financial Reporting
Enterprise Resource Planning (ERP)
Professional Experience
Senior Financial Controller & Tax Auditor
Jan 2021 – Present
Vertex Financial Group (Targeting SparkX Technologies profile)
New York, NY (Hybrid)
Lead quarterly GAAP and IFRS balance sheet reconciliations for a $120M+ portfolio, ensuring 100% precision in executive financial reporting and stakeholder presentations.
Direct comprehensive month-end and year-end ledger audits, coordinating across operational teams to resolve discrepancies and close books within a strict 4-day timeline.
Conduct detailed variance audits across core departments, identifying budget-to-actual deviations that resulted in the recovery of $1.5M in annual operational inefficiencies.
Oversee multi-state corporate tax compliance and preparation, serving as the primary liaison with external auditors and state tax authorities to ensure zero compliance penalties.
Senior Tax Auditor
Jun 2017 – Dec 2020
Axiom Accounting Partners
New York, NY
Managed end-to-end corporate tax compliance for 45+ mid-to-large cap enterprise clients, ensuring adherence to rapidly changing federal and state tax regulations.
Performed deep-dive variance audits on client financial statements to ensure uncompromising audit readiness, successfully reducing audit preparation time by 30%.
Assisted senior controllers with complex GAAP balance sheet reconciliations, ledger health checks, and the implementation of automated data extraction tools.
Education & Credentials
Master of Accounting
Columbia Business School, New York, NY
May 2017
Bachelor of Science in Finance
New York University (NYU), New York, NY
May 2015
Licenses & Certifications:
Certified Public Accountant (CPA) – Active, State of New York
Burhan Kapasi - Resume"""

# What did the modal send when the user uploaded the resume file?
# 1. candidate_data with skills = [] and resume_text = resume_text
cand_data_1 = {
    "name": "Burhan Kapasi",
    "skills": [],
    "experience_years": 0.0,
    "job_role": "",
    "resume_summary": "",
    "resume_text": resume_text,
    "education": ""
}

res1 = calculate_resume_job_match(job_data, cand_data_1)
print("=== Test 1: skills=[], exp=0, resume_text = resume_text ===")
print("Match Score:", res1["match_score"])
print("Matched Skills:", res1["matched_skills"])
print("Missing Skills:", res1["missing_skills"])
print("Category Scores:", res1["category_scores"])
print("Explanation:", res1["explanation"])

# 2. What if candidate logged in user was AWS engineer, so skills was still AWS?
cand_data_2 = {
    "name": "Burhan",
    "skills": ["AWS", "Docker", "Kubernetes"],
    "experience_years": 4.5,
    "job_role": "AWS Cloud Engineer",
    "resume_summary": "",
    "resume_text": resume_text,
    "education": "B.Tech in Computer Science"
}
res2 = calculate_resume_job_match(job_data, cand_data_2)
print("\n=== Test 2: skills=['AWS'], job_role='AWS Cloud Engineer', resume_text = resume_text ===")
print("Match Score:", res2["match_score"])
print("Matched Skills:", res2["matched_skills"])
print("Missing Skills:", res2["missing_skills"])
print("Category Scores:", res2["category_scores"])
print("Explanation:", res2["explanation"])
