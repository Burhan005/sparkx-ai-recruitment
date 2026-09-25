"""
cleanup_dummy_data.py
Cleans up duplicate test records and ensures exactly 5 realistic, high-standard candidate records exist
across the 5 pipeline stages (Screening, Assessment, Interview, Review, Completed).
"""
import sys
from database import SessionLocal
from models.db_models import CandidateModel, JobModel, CandidateStateLogModel, IntegrityLogModel

def cleanup():
    db = SessionLocal()
    try:
        print("=== SPARKX DATABASE CLEANUP ===")
        
        # 1. Clean up test jobs
        test_job_titles = [
            'Integrity Test Engineer', 'Junior Role', 'Senior Role', 'Filter Test Role', 'aws'
        ]
        deleted_jobs = 0
        for job in db.query(JobModel).all():
            if any(t.lower() == job.title.strip().lower() for t in test_job_titles) or 'test' in job.id.lower():
                # delete candidates for this test job first
                cand_ids = [c.id for c in db.query(CandidateModel).filter(CandidateModel.job_id == job.id).all()]
                for cid in cand_ids:
                    db.query(CandidateStateLogModel).filter(CandidateStateLogModel.candidate_id == cid).delete()
                    db.query(IntegrityLogModel).filter(IntegrityLogModel.candidate_id == cid).delete()
                    db.query(CandidateModel).filter(CandidateModel.id == cid).delete()
                db.delete(job)
                deleted_jobs += 1
        db.commit()
        print(f"Deleted {deleted_jobs} test jobs.")

        # 2. Clean up test candidates
        deleted_cands = 0
        test_names = [
            'workflow test', 'offer candidate', 'test applicant', 'candidate within', 
            'candidate above', 'priya patel', 'rohan verma'
        ]
        for cand in db.query(CandidateModel).all():
            name_lower = cand.name.lower().strip()
            # If it's a test name, delete it
            if any(t in name_lower for t in test_names):
                db.query(CandidateStateLogModel).filter(CandidateStateLogModel.candidate_id == cand.id).delete()
                db.query(IntegrityLogModel).filter(IntegrityLogModel.candidate_id == cand.id).delete()
                db.delete(cand)
                deleted_cands += 1
            # If multiple Burhan duplicates exist, keep only the latest primary one
            elif 'burhan' in name_lower and cand.id != 'cand-0db7e4':
                db.query(CandidateStateLogModel).filter(CandidateStateLogModel.candidate_id == cand.id).delete()
                db.query(IntegrityLogModel).filter(IntegrityLogModel.candidate_id == cand.id).delete()
                db.delete(cand)
                deleted_cands += 1

        db.commit()
        print(f"Deleted {deleted_cands} dummy test candidates.")

        # 3. Ensure the 5 canonical candidates exist and are distributed cleanly across the 5 pipeline stages
        canonical = [
            {
                "id": "cand-001",
                "job_id": "job-101",
                "name": "Aarav Sharma",
                "email": "aarav.sharma@example.com",
                "phone": "+91 98765 43210",
                "applied_date": "2026-09-18",
                "stage": "screening",
                "assessment_status": "not_invited",
                "interview_status": "not_scheduled",
                "hiring_decision": "undecided",
                "status": "Screening",
                "match_score": 94,
                "experience_years": 4.5,
                "education": "B.Tech Computer Science, IIT Roorkee (2022)",
                "skills": ["Python", "FastAPI", "React", "PyTorch", "PostgreSQL", "LangChain", "Docker", "System Design"],
                "expected_ctc_min": 32.0,
                "expected_ctc_max": 38.0,
                "current_ctc": 28.0,
                "expected_ctc_currency": "INR",
                "expected_ctc_period": "per_annum",
                "resume_summary": "Senior AI & Distributed Systems Engineer with 4.5+ years architecting enterprise machine learning pipelines, low-latency microservices, and agentic workflows.\n\nKey Achievements & Production Deliverables:\n• Spearheaded high-throughput automated document intelligence pipeline processing 50k+ daily transactions with FastAPI, PyTorch, and Docker.\n• Integrated asynchronous pgvector semantic search with HNSW indexing, reducing retrieval latency from 240ms to under 75ms.\n• Led architecture of resilient decoupled workers utilizing Celery/Redis and Server-Sent Events (SSE) for streaming LLM reasoning traces.\n• Maintained 99.95% system uptime and authored automated unit and integration suites achieving 92% code coverage.",
                "scores": {"jobSkills": 95, "technicalScore": 92, "communication": 90, "problemSolving": 94, "overall": 93},
                "integrity_score": 96,
                "integrity_risk": "Low"
            },
            {
                "id": "cand-002",
                "job_id": "job-101",
                "name": "Neha Patel",
                "email": "neha.patel@techmail.in",
                "phone": "+91 98111 22334",
                "applied_date": "2026-09-18",
                "stage": "assessment",
                "assessment_status": "evaluated",
                "interview_status": "not_scheduled",
                "hiring_decision": "undecided",
                "status": "Evaluated",
                "match_score": 86,
                "experience_years": 3.2,
                "education": "B.E. Information Technology, Pune University (2023)",
                "skills": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Tailwind CSS"],
                "expected_ctc_min": 22.0,
                "expected_ctc_max": 26.0,
                "current_ctc": 19.5,
                "expected_ctc_currency": "INR",
                "expected_ctc_period": "per_annum",
                "resume_summary": "Full-Stack Engineer with 3.2+ years designing cloud microservices, responsive web dashboards, and AI-assisted workflows.\n\nKey Achievements & Production Deliverables:\n• Built scalable RESTful services using FastAPI and PostgreSQL, supporting 20k+ daily active frontend sessions.\n• Developed rich analytics dashboards with React, TypeScript, and Tailwind CSS, improving recruiter operational efficiency by 35%.\n• Integrated client-side streaming consumption via ReadableStream APIs to render real-time AI responses with zero UI stutter.\n• Collaborated on containerized deployments using Docker and GitHub Actions for continuous zero-downtime releases.",
                "scores": {"jobSkills": 84, "technicalScore": 82, "communication": 92, "problemSolving": 85, "overall": 86},
                "integrity_score": 88,
                "integrity_risk": "Low"
            },
            {
                "id": "cand-004",
                "job_id": "job-101",
                "name": "Priya Nair",
                "email": "priya.nair@techinnovations.io",
                "phone": "+91 97654 32109",
                "applied_date": "2026-09-19",
                "stage": "interview",
                "assessment_status": "evaluated",
                "interview_status": "scheduled",
                "hiring_decision": "undecided",
                "status": "Interview Scheduled",
                "match_score": 89,
                "experience_years": 3.5,
                "education": "B.Tech Computer Science, BITS Pilani (2022)",
                "skills": ["Python", "FastAPI", "Docker", "PostgreSQL", "LangChain", "Kubernetes"],
                "expected_ctc_min": 24.0,
                "expected_ctc_max": 28.0,
                "current_ctc": 21.0,
                "expected_ctc_currency": "INR",
                "expected_ctc_period": "per_annum",
                "resume_summary": "Cloud Backend & AI Systems Engineer with 3.5+ years building distributed API gateways, asynchronous message queues, and production LLM orchestration.\n\nKey Achievements & Production Deliverables:\n• Architected scalable microservices handling large-scale text ingestion and vector indexing using Python, FastAPI, and PostgreSQL.\n• Containerized multi-agent LLM pipelines with Docker and Kubernetes, reducing compute resource consumption by 28%.\n• Designed robust database schemas, transactional integrity checks, and high-concurrency connection pooling.",
                "interview_scheduled_at": "Tomorrow, 02:30 PM",
                "interview_meeting_url": "https://meet.google.com/spk-aixr-rec",
                "scores": {"jobSkills": 88, "technicalScore": 87, "communication": 91, "problemSolving": 89, "overall": 89},
                "integrity_score": 100,
                "integrity_risk": "Low"
            },
            {
                "id": "cand-005",
                "job_id": "job-101",
                "name": "Vikram Malhotra",
                "email": "vikram.malhotra@cloudai.dev",
                "phone": "+91 98450 11223",
                "applied_date": "2026-09-17",
                "stage": "review",
                "assessment_status": "evaluated",
                "interview_status": "completed",
                "hiring_decision": "undecided",
                "status": "Under Review",
                "match_score": 92,
                "experience_years": 4.8,
                "education": "M.Tech AI & Data Systems, IIIT Hyderabad (2021)",
                "skills": ["Python", "FastAPI", "React", "PyTorch", "pgvector", "LangChain", "System Design"],
                "expected_ctc_min": 36.0,
                "expected_ctc_max": 42.0,
                "current_ctc": 32.0,
                "expected_ctc_currency": "INR",
                "expected_ctc_period": "per_annum",
                "resume_summary": "Lead ML Platform Engineer with 4.8+ years designing scalable agentic workflows, high-frequency inference endpoints, and vector search systems.\n\nKey Achievements & Production Deliverables:\n• Designed real-time LLM inference pipelines delivering streaming token output with sub-90ms time-to-first-token (TTFT).\n• Implemented custom HNSW vector indices on pgvector with periodic re-indexing and memory caching layers.\n• Authored system design specifications for enterprise AI platforms handling multi-modal document and audio inputs.",
                "scores": {"jobSkills": 93, "technicalScore": 91, "communication": 90, "problemSolving": 92, "overall": 92},
                "integrity_score": 100,
                "integrity_risk": "Low"
            },
            {
                "id": "cand-006",
                "job_id": "job-102",
                "name": "Kavita Sen",
                "email": "kavita.sen@frontendlab.org",
                "phone": "+91 99887 66554",
                "applied_date": "2026-09-16",
                "stage": "completed",
                "assessment_status": "evaluated",
                "interview_status": "completed",
                "hiring_decision": "accepted",
                "status": "Shortlisted",
                "final_decision": "Offered",
                "match_score": 96,
                "experience_years": 4.0,
                "education": "B.E. Computer Engineering, Delhi Technological University (2022)",
                "skills": ["React", "TypeScript", "Tailwind CSS", "Canvas API", "Web Speech API", "Micro-frontends"],
                "expected_ctc_min": 28.0,
                "expected_ctc_max": 32.0,
                "current_ctc": 24.5,
                "expected_ctc_currency": "INR",
                "expected_ctc_period": "per_annum",
                "resume_summary": "Staff Frontend & Systems Engineer with 4.0+ years architecting high-frequency telemetry dashboards, real-time video canvases, and accessible design systems.\n\nKey Achievements & Production Deliverables:\n• Architected 60fps real-time computer vision overlays using Web Workers, OffscreenCanvas, and double-buffered render pipelines.\n• Built comprehensive enterprise design systems in React and Tailwind CSS with strict WCAG 2.1 AA accessibility standards.\n• Reduced frontend bundle sizes by 45% through aggressive code-splitting and dynamic route-based asset delivery.",
                "scores": {"jobSkills": 96, "technicalScore": 95, "communication": 94, "problemSolving": 92, "overall": 95},
                "integrity_score": 98,
                "integrity_risk": "Low"
            }
        ]

        for cand_dict in canonical:
            existing = db.query(CandidateModel).filter(CandidateModel.id == cand_dict["id"]).first()
            if existing:
                for k, v in cand_dict.items():
                    setattr(existing, k, v)
            else:
                db.add(CandidateModel(**cand_dict))
        
        db.commit()
        
        # Verify final count
        final_cands = db.query(CandidateModel).all()
        print(f"\nFinal clean candidates in database ({len(final_cands)}):")
        for c in final_cands:
            print(f"  • {c.id}: {c.name} | Stage: {c.stage} | Status: {c.status}")

        final_jobs = db.query(JobModel).all()
        print(f"\nFinal clean jobs in database ({len(final_jobs)}):")
        for j in final_jobs:
            print(f"  • {j.id}: {j.title}")

    finally:
        db.close()

if __name__ == '__main__':
    cleanup()
