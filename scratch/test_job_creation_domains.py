"""
Verify domain-aware job creation for both technical and non-technical roles.
"""
import sys
import os
sys.path.append(os.path.abspath("backend"))

from database import SessionLocal
from schemas import JobCreate
from controllers.job_controller import JobController

def test_non_tech_job_creation():
    db = SessionLocal()
    try:
        print("\n--- TEST 1: Create Non-Technical Job (Finance Controller) ---")
        non_tech_payload = JobCreate(
            title="Senior Financial Controller & Tax Auditor",
            department="Finance & Accounting",
            location="Bangalore, India (Hybrid)",
            min_experience_years=5,
            education="Bachelor's / Master's in Finance or CA / CPA",
            languages=[],
            required_skills=["US GAAP", "Financial Modeling", "Tax Compliance", "Ledger Reconciliation", "Audit"],
            description="Leading financial audit, variance reporting, and tax compliance.",
            coding_difficulty=None,
            coding_assessment={
                "title": "Financial Statement Audit & Variance Simulation",
                "is_coding": False,
                "domain_category": "finance",
                "deliverable_type": "Variance Analysis & Financial Deliverable Submission",
                "instructions": "Review the quarterly ledger balance and identify variance anomalies.",
                "initialCode": "Provide executive summary, variance breakdown, and remediation plan."
            }
        )

        job = JobController.create_new_job(non_tech_payload, db)
        print(f"Created Job: ID={job.id}, Title={job.title}")
        print(f"Languages: {job.languages} (Expected: [])")
        print(f"Coding Difficulty: {job.coding_difficulty} (Expected: None)")
        print(f"Coding Assessment is_coding: {job.coding_assessment.get('is_coding')} (Expected: False)")
        print(f"Assessment Title: {job.coding_assessment.get('title')}")
        
        print("\nGenerated Questions:")
        for idx, q in enumerate(job.questions):
            print(f"  Q{idx+1} ({q.get('type')}): {q.get('prompt')}")
            # Ensure no software engineering leaks in finance questions
            prompt_lower = q.get('prompt', '').lower()
            assert "thread pool" not in prompt_lower, f"Leaked 'thread pool' in non-tech prompt: {prompt_lower}"
            assert "qps" not in prompt_lower, f"Leaked 'qps' in non-tech prompt: {prompt_lower}"
            assert "cache" not in prompt_lower, f"Leaked 'cache' in non-tech prompt: {prompt_lower}"

        assert job.languages == [] or job.languages == None, f"Expected empty languages, got {job.languages}"
        assert job.coding_assessment.get('is_coding') is False, "Expected is_coding to be False"
        print(">>> [PASS] Non-Technical Job verified with 0 coding leaks!")

        print("\n--- TEST 2: Create Technical Job (Distributed Systems Engineer) ---")
        tech_payload = JobCreate(
            title="Principal Distributed Systems Engineer",
            department="Engineering",
            location="Remote",
            min_experience_years=6,
            education="Bachelor's in Computer Science",
            languages=["Go", "Python", "Rust"],
            required_skills=["Distributed Systems", "Raft", "High Concurrency", "gRPC", "Kubernetes"],
            description="Architect low-latency distributed storage consensus engines.",
            coding_difficulty="Senior"
        )
        tech_job = JobController.create_new_job(tech_payload, db)
        print(f"Created Tech Job: ID={tech_job.id}, Title={tech_job.title}")
        print(f"Languages: {tech_job.languages} (Expected: Go, Python, Rust)")
        print(f"Coding Difficulty: {tech_job.coding_difficulty} (Expected: Senior)")
        print(f"Coding Assessment is_coding: {tech_job.coding_assessment.get('is_coding')} (Expected: True)")
        print(f"Assessment Title: {tech_job.coding_assessment.get('title')}")
        
        print("\nGenerated Tech Questions:")
        for idx, q in enumerate(tech_job.questions):
            print(f"  Q{idx+1} ({q.get('type')}): {q.get('prompt')}")

        assert tech_job.coding_assessment.get('is_coding') is True, "Expected is_coding to be True"
        print(">>> [PASS] Technical Job verified with coding challenge intact!")

    finally:
        db.close()

if __name__ == "__main__":
    test_non_tech_job_creation()
