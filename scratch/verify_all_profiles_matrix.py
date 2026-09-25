import sys
import os
import json

backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import SessionLocal
from controllers.job_controller import JobController
from schemas import JobMatchRequest

def run_matrix_verification():
    db = SessionLocal()
    try:
        jobs = JobController.get_all_jobs(db)
        print(f"Loaded {len(jobs)} active jobs in database.")

        profiles = [
            {
                "id": "AWS_Cloud",
                "name": "Alex Cloud-Architect",
                "job_role": "Senior AWS Cloud & DevOps Engineer",
                "experience_years": 6.0,
                "skills": ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Python"],
                "education": "B.Tech in Computer Science",
                "resume_summary": "Seasoned Cloud Architect with 6 years experience building secure AWS infrastructure, EKS Kubernetes clusters, and automated Terraform pipelines.",
                "resume_text": "Led AWS cloud migration for enterprise workloads. Built Terraform modules, managed Kubernetes deployments, and automated CI/CD releases on AWS EC2, S3, and RDS."
            },
            {
                "id": "Finance_CPA",
                "name": "Eleanor CPA-Auditor",
                "job_role": "Senior Financial Controller & Tax Auditor",
                "experience_years": 5.0,
                "skills": ["GAAP", "Financial Reconciliation", "Corporate Tax", "Internal Auditing", "Variance Analysis", "IFRS"],
                "education": "Master of Accounting / CPA",
                "resume_summary": "Certified Public Accountant with 5 years managing GAAP/IFRS balance sheet reconciliations, month-end ledger audits, and corporate tax compliance.",
                "resume_text": "Led financial audits, executed quarterly GAAP balance sheet reconciliations, month-end close processes, and corporate tax filing for multinational companies."
            },
            {
                "id": "Frontend_React",
                "name": "Samantha UX-Engineer",
                "job_role": "Frontend Software Engineer",
                "experience_years": 4.0,
                "skills": ["React", "TypeScript", "JavaScript", "Tailwind CSS", "HTML5", "CSS3", "Redux", "REST API"],
                "education": "B.S. in Software Engineering",
                "resume_summary": "Frontend Specialist with 4 years creating responsive Web applications in React, TypeScript, and modern Tailwind design systems.",
                "resume_text": "Engineered responsive component libraries in React 18 and TypeScript. Optimized browser bundle performance, implemented Tailwind CSS layouts, and integrated GraphQL/REST APIs."
            },
            {
                "id": "HR_Talent",
                "name": "Marcus People-Leader",
                "job_role": "HR Manager & Talent Acquisition Lead",
                "experience_years": 5.5,
                "skills": ["Talent Acquisition", "Technical Recruiting", "Employee Relations", "Onboarding", "HR Policies", "Payroll", "Labor Law"],
                "education": "Master of Human Resources Management",
                "resume_summary": "HR Leader specializing in end-to-end talent acquisition, employee retention, performance management, and compliance with federal labor laws.",
                "resume_text": "Directed hiring pipelines across 200+ employees. Implemented ATS recruitment workflows, conducted behavioral interviews, managed employee benefits, and resolved workplace grievances."
            }
        ]

        print("\n" + "="*90)
        print(f"{'PROFILE':<18} | {'TARGET JOB':<35} | {'SCORE':<7} | {'SKILLS MATCHED'}")
        print("="*90)

        results_matrix = {}

        for prof in profiles:
            p_id = prof["id"]
            results_matrix[p_id] = {}
            req = JobMatchRequest(**prof)

            for job in jobs:
                res, err = JobController.match_candidate_to_job(job.id, req, db)
                assert err is None
                score = res["match_score"]
                matched = ", ".join(res["matched_skills"]) if res["matched_skills"] else "None"
                results_matrix[p_id][job.id] = res

                # Print formatted row
                short_job = (job.title[:32] + "...") if len(job.title) > 35 else job.title
                print(f"{prof['name'][:18]:<18} | {short_job:<35} | {score:>3}%   | {matched}")

        print("="*90)

        # Assertions to mathematically prove dynamic behavior across all profiles
        # 1. AWS candidate:
        aws_job = next(j for j in jobs if "cloud" in j.title.lower() or "aws" in j.title.lower())
        acct_job = next(j for j in jobs if "account" in j.title.lower() or "financial" in j.title.lower())
        fe_job = next(j for j in jobs if "frontend" in j.title.lower() or "react" in j.title.lower())

        # Cloud candidate matches AWS high, Accountant 0%
        assert results_matrix["AWS_Cloud"][aws_job.id]["match_score"] >= 80, "AWS Cloud vs AWS Job must be >= 80%"
        assert results_matrix["AWS_Cloud"][acct_job.id]["match_score"] == 0, "AWS Cloud vs Accountant must be 0%"

        # Finance candidate matches Accountant high, AWS 0%, Frontend 0%
        assert results_matrix["Finance_CPA"][acct_job.id]["match_score"] >= 90, "Finance CPA vs Accountant must be >= 90%"
        assert results_matrix["Finance_CPA"][aws_job.id]["match_score"] == 0, "Finance CPA vs AWS must be 0%"
        assert results_matrix["Finance_CPA"][fe_job.id]["match_score"] == 0, "Finance CPA vs Frontend must be 0%"

        # Frontend candidate matches Frontend high, Accountant 0%
        assert results_matrix["Frontend_React"][fe_job.id]["match_score"] >= 80, "Frontend vs Frontend must be >= 80%"
        assert results_matrix["Frontend_React"][acct_job.id]["match_score"] == 0, "Frontend vs Accountant must be 0%"

        # HR candidate matches Accountant 0%, AWS 0%, Frontend 0%
        assert results_matrix["HR_Talent"][acct_job.id]["match_score"] == 0, "HR vs Accountant must be 0%"
        assert results_matrix["HR_Talent"][aws_job.id]["match_score"] == 0, "HR vs AWS must be 0%"

        print("\n>>> ALL PROFILES VERIFIED DYNAMIC WITH ZERO CONFLICTS! <<<")

    finally:
        db.close()

if __name__ == "__main__":
    run_matrix_verification()
