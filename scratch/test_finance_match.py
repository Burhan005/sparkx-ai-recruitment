import sys
import os
import json

backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import SessionLocal
from controllers.job_controller import JobController
from schemas import JobMatchRequest

def test_finance_candidate():
    db = SessionLocal()
    try:
        jobs = JobController.get_all_jobs(db)
        acct_job = next((j for j in jobs if "account" in j.title.lower() or "financial" in j.title.lower()), None)
        aws_job = next((j for j in jobs if "cloud" in j.title.lower() or "aws" in j.title.lower()), None)

        assert acct_job is not None, "Accounting job not found!"
        assert aws_job is not None, "AWS job not found!"

        # Candidate with Finance / Accounting profile
        finance_candidate = {
            "name": "Burhan Financial Controller",
            "job_role": "Senior Financial Controller & Tax Specialist",
            "experience_years": 5.0,
            "skills": ["GAAP", "Financial Reconciliation", "Corporate Tax", "Internal Auditing", "Variance Analysis", "IFRS"],
            "education": "Master of Accounting / CPA",
            "resume_summary": "Certified Public Accountant (CPA) with 5 years leading quarterly GAAP/IFRS balance sheet reconciliations, month-end ledger audits, variance audits, and corporate tax compliance.",
            "resume_text": "Experienced CPA and Financial Controller. Spearheaded quarterly GAAP/IFRS balance sheet reconciliations, month-end ledger audits, variance audits, and corporate tax compliance for enterprise clients."
        }
        req = JobMatchRequest(**finance_candidate)

        print("\n=== Testing Finance Candidate vs. Finance/Accounting Job ===")
        print(f"Target Job: {acct_job.title} ({acct_job.department})")
        match_acct, err = JobController.match_candidate_to_job(acct_job.id, req, db)
        assert err is None
        print(f"Match Score: {match_acct['match_score']}%")
        print(f"Category Scores: {match_acct['category_scores']}")
        print(f"Matched Skills: {match_acct['matched_skills']}")
        print(f"Missing Skills: {match_acct['missing_skills']}")
        print(f"Explanation: {match_acct['explanation']}")

        print("\n=== Testing Finance Candidate vs. AWS Cloud Job ===")
        print(f"Target Job: {aws_job.title} ({aws_job.department})")
        match_aws, err = JobController.match_candidate_to_job(aws_job.id, req, db)
        assert err is None
        print(f"Match Score: {match_aws['match_score']}%")
        print(f"Category Scores: {match_aws['category_scores']}")
        print(f"Matched Skills: {match_aws['matched_skills']}")
        print(f"Missing Skills: {match_aws['missing_skills']}")
        print(f"Explanation: {match_aws['explanation']}")

    finally:
        db.close()

if __name__ == "__main__":
    test_finance_candidate()
