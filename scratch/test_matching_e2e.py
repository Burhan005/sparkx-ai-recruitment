import sys
import os
import json

# Add backend directory to sys.path
backend_dir = r"C:\Sparkx\sparkx-ai-recruitment\backend"
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=== 1. Health check ===")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("OK: Health check passed")

    print("\n=== 2. Fetch Jobs ===")
    res = client.get("/api/jobs")
    assert res.status_code == 200
    jobs = res.json()
    print(f"Total jobs in database: {len(jobs)}")
    for j in jobs:
        print(f"  - [{j['id']}] {j['title']} ({j['department']})")

    aws_job = next((j for j in jobs if "cloud" in j["title"].lower() or "aws" in j["title"].lower() or "devops" in j["title"].lower()), None)
    accountant_job = next((j for j in jobs if "account" in j["title"].lower() or "finance" in j["title"].lower() or "tax" in j["title"].lower()), None)

    assert aws_job is not None, "AWS/Cloud job not found in DB!"
    assert accountant_job is not None, "Accountant/Finance job not found in DB!"

    aws_candidate = {
        "name": "Burhan Cloud Expert",
        "job_role": "AWS Cloud Engineer",
        "experience_years": 4.5,
        "skills": ["AWS", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Python"],
        "education": "B.Tech in Computer Science",
        "resume_summary": "Experienced Cloud Engineer specializing in AWS architecture, Terraform IaC, ECS/EKS containerization, and automated CI/CD pipelines.",
        "resume_text": "Experienced Cloud Engineer with 4.5 years managing AWS cloud infrastructure, provisioning Terraform stacks, automating deployment pipelines, and configuring Kubernetes clusters."
    }

    print(f"\n=== 3. Match AWS Candidate against AWS Job ({aws_job['title']}) ===")
    res = client.post(f"/api/jobs/{aws_job['id']}/match", json=aws_candidate)
    assert res.status_code == 200, f"Match call failed: {res.text}"
    aws_match = res.json()
    print(f"Result: Score = {aws_match['match_score']}%")
    print(f"Category scores: {aws_match['category_scores']}")
    print(f"Matched skills: {aws_match['matched_skills']}")
    print(f"Missing skills: {aws_match['missing_skills']}")
    print(f"Explanation: {aws_match['explanation']}")
    assert aws_match['match_score'] >= 75, f"Expected high score >= 75%, got {aws_match['match_score']}%"

    print(f"\n=== 4. Match AWS Candidate against Unrelated Job ({accountant_job['title']}) ===")
    res = client.post(f"/api/jobs/{accountant_job['id']}/match", json=aws_candidate)
    assert res.status_code == 200, f"Match call failed: {res.text}"
    acct_match = res.json()
    print(f"Result: Score = {acct_match['match_score']}%")
    print(f"Category scores: {acct_match['category_scores']}")
    print(f"Matched skills: {acct_match['matched_skills']}")
    print(f"Missing skills: {acct_match['missing_skills']}")
    print(f"Explanation: {acct_match['explanation']}")
    assert acct_match['match_score'] <= 15, f"Expected low score <= 15% (no artificial 40% floor!), got {acct_match['match_score']}%"

    print("\n=== 5. Batch Match against all jobs ===")
    res = client.post("/api/jobs/batch-match", json={"candidate": aws_candidate})
    assert res.status_code == 200, f"Batch match call failed: {res.text}"
    batch_res = res.json()
    matches = batch_res["matches"]
    print(f"Batch matched {len(matches)} jobs:")
    for jid, m in matches.items():
        job_title = next((j["title"] for j in jobs if j["id"] == jid), jid)
        print(f"  - Job '{job_title}': {m['match_score']}% (Skills: {m['category_scores'].get('domain_skills', 0)}/40, Exp: {m['category_scores'].get('experience_relevance', 0)}/25)")

    print("\n=== 6. Submit Application with Match Calibration ===")
    apply_payload = {
        "job_id": accountant_job["id"],
        "company_name": accountant_job["company_name"],
        "name": aws_candidate["name"],
        "email": "burhan.test.e2e@example.com",
        "phone": "+91 99999 88888",
        "experience_years": aws_candidate["experience_years"],
        "education": aws_candidate["education"],
        "skills": aws_candidate["skills"],
        "resume_summary": aws_candidate["resume_summary"],
        "resume_filename": "Burhan_AWS_Resume.pdf",
        "resume_text": aws_candidate["resume_text"],
        "fraud_flags": []
    }
    res = client.post("/api/candidates/apply", json=apply_payload)
    assert res.status_code == 200, f"Apply call failed: {res.text}"
    app_data = res.json()
    print(f"Applied ID: {app_data['id']}, Match Score saved: {app_data['match_score']}%")
    print(f"Match Details saved in DB: {json.dumps(app_data.get('match_details', {}), indent=2)}")
    assert app_data['match_score'] <= 15, f"Expected applied match_score <= 15% for unrelated job, got {app_data['match_score']}%"
    assert app_data.get('match_details') is not None
    assert 'category_scores' in app_data['match_details']

    print("\n=== 7. Verify My Applications API Returns match_score and match_details ===")
    res = client.get(f"/api/candidates/my-applications?email={aws_candidate['name']}")
    # Query with email
    res = client.get("/api/candidates/my-applications?email=burhan.test.e2e@example.com")
    assert res.status_code == 200
    my_apps = res.json()
    assert len(my_apps) > 0
    saved_app = my_apps[0]
    print(f"Fetched my application for job: {saved_app['job_title']}")
    print(f"Match score: {saved_app['match_score']}%")
    print(f"Match details: {json.dumps(saved_app.get('match_details', {}), indent=2)}")
    assert saved_app['match_score'] <= 15
    assert saved_app.get('match_details') is not None

    print("\n>>> ALL TESTS PASSED SUCCESSFULLY! ZERO ARTIFICIAL FLOORS, ACCURATE CALIBRATION! <<<")

if __name__ == "__main__":
    run_tests()
