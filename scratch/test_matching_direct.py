import sys
import os
import json

backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from database import SessionLocal
from controllers.job_controller import JobController
from controllers.candidate_controller import CandidateController
from schemas import JobMatchRequest, CandidateApply, BatchJobMatchRequest

def run_tests():
    db = SessionLocal()
    try:
        print("=== 1. Fetching jobs from database ===")
        jobs = JobController.get_all_jobs(db)
        print(f"Total jobs loaded: {len(jobs)}")
        for j in jobs:
            print(f"  - [{j.id}] {j.title} ({j.department})")

        aws_job = next((j for j in jobs if "cloud" in j.title.lower() or "aws" in j.title.lower() or "devops" in j.title.lower()), None)
        accountant_job = next((j for j in jobs if "account" in j.title.lower() or "finance" in j.title.lower() or "tax" in j.title.lower()), None)

        assert aws_job is not None, "AWS/Cloud job not found in DB!"
        assert accountant_job is not None, "Accountant/Finance job not found in DB!"

        aws_candidate_data = {
            "name": "Burhan AWS Cloud Specialist",
            "job_role": "AWS Cloud Engineer",
            "experience_years": 4.5,
            "skills": ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Python"],
            "education": "B.Tech in Computer Science",
            "resume_summary": "Experienced Cloud Engineer specializing in AWS architecture, Terraform IaC, ECS/EKS containerization, and automated CI/CD pipelines.",
            "resume_text": "Experienced Cloud Engineer with 4.5 years managing AWS cloud infrastructure, provisioning Terraform stacks, automating deployment pipelines, and configuring Kubernetes clusters."
        }
        match_req = JobMatchRequest(**aws_candidate_data)

        print(f"\n=== 2. Match AWS Candidate against AWS Job ({aws_job.title}) ===")
        aws_match, err = JobController.match_candidate_to_job(aws_job.id, match_req, db)
        assert err is None, f"Error: {err}"
        print(f"Result: Score = {aws_match['match_score']}%")
        print(f"Category scores: {aws_match['category_scores']}")
        print(f"Matched skills: {aws_match['matched_skills']}")
        print(f"Missing skills: {aws_match['missing_skills']}")
        print(f"Explanation: {aws_match['explanation']}")
        assert aws_match['match_score'] >= 75, f"Expected match_score >= 75%, got {aws_match['match_score']}%"

        print(f"\n=== 3. Match AWS Candidate against Unrelated Job ({accountant_job.title}) ===")
        acct_match, err = JobController.match_candidate_to_job(accountant_job.id, match_req, db)
        assert err is None, f"Error: {err}"
        print(f"Result: Score = {acct_match['match_score']}%")
        print(f"Category scores: {acct_match['category_scores']}")
        print(f"Matched skills: {acct_match['matched_skills']}")
        print(f"Missing skills: {acct_match['missing_skills']}")
        print(f"Explanation: {acct_match['explanation']}")
        assert acct_match['match_score'] <= 15, f"Expected match_score <= 15% (no artificial 40% floor!), got {acct_match['match_score']}%"

        print("\n=== 4. Batch Match Candidate against all active jobs ===")
        batch_req = BatchJobMatchRequest(candidate=aws_candidate_data)
        batch_res = JobController.batch_match_jobs(batch_req, db)
        print(f"Batch matched {len(batch_res['matches'])} jobs:")
        for jid, m in batch_res['matches'].items():
            job_obj = next((j for j in jobs if j.id == jid), None)
            jtitle = job_obj.title if job_obj else jid
            print(f"  - '{jtitle}': {m['match_score']}% | {m['explanation']}")
        
        # Verify AWS job in batch matches >= 75% and Accountant <= 15%
        assert batch_res['matches'][aws_job.id]['match_score'] >= 75
        assert batch_res['matches'][accountant_job.id]['match_score'] <= 15

        print("\n=== 5. Apply Candidate to Accountant Job and verify saved match_score & match_details ===")
        email_test = "burhan.test.direct@example.com"
        apply_req = CandidateApply(
            job_id=accountant_job.id,
            company_name=accountant_job.company_name,
            name=aws_candidate_data["name"],
            email=email_test,
            phone="+91 98765 43210",
            experience_years=aws_candidate_data["experience_years"],
            education=aws_candidate_data["education"],
            skills=aws_candidate_data["skills"],
            resume_summary=aws_candidate_data["resume_summary"],
            resume_filename="Burhan_AWS_Direct_Resume.pdf",
            resume_text=aws_candidate_data["resume_text"],
            fraud_flags=[]
        )
        cand_obj, err = CandidateController.apply_candidate(apply_req, db)
        assert err is None, f"Apply error: {err}"
        print(f"Created Candidate Application ID: {cand_obj.id}")
        print(f"Saved match_score: {cand_obj.match_score}%")
        print(f"Saved match_details: {json.dumps(cand_obj.match_details, indent=2)}")
        assert cand_obj.match_score <= 15, f"Expected match_score <= 15%, got {cand_obj.match_score}%"
        assert cand_obj.match_details is not None
        assert "category_scores" in cand_obj.match_details

        print("\n=== 6. Verify get_candidate_applications retrieval ===")
        my_apps = CandidateController.get_candidate_applications(email_test, db)
        assert len(my_apps) > 0, "No application found for email!"
        retrieved_app = my_apps[0]
        print(f"Retrieved application job: {retrieved_app['job_title']}")
        print(f"Retrieved match_score: {retrieved_app['match_score']}%")
        print(f"Retrieved match_details: {retrieved_app['match_details']}")
        assert retrieved_app['match_score'] <= 15
        assert retrieved_app['match_details'] is not None

        print("\n>>> ALL TESTS PASSED! ZERO ARTIFICIAL FLOORS, ACCURATE CALIBRATION! <<<")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
