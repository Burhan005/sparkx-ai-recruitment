"""
Database Seeding Script for SparkX AI Recruitment
Pre-populates PostgreSQL / SQLite with initial jobs and realistic candidate profiles.
"""
from database import SessionLocal, engine, Base
from models import JobModel, CandidateModel

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(JobModel).first():
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding PostgreSQL / Database with SIH 2026 roles and candidates...")

        # Job 1
        job1 = JobModel(
            id="job-101",
            title="Senior AI / Full-Stack Engineer",
            department="AI Research & Product",
            location="Bengaluru, India (Hybrid)",
            min_experience_years=3,
            experience="3-6 years",
            education="B.Tech / M.Tech in CS, AI, or equivalent",
            languages=["English", "Hindi"],
            required_skills=["Python", "FastAPI", "React", "PyTorch / Transformers", "LangChain", "PostgreSQL", "System Design"],
            optional_criteria="Experience with WebRTC, real-time proctoring, or vector databases (Pinecone/Milvus).",
            description="Design and implement scalable generative AI pipelines, LLM-based agent systems, and robust full-stack web applications with FastAPI and React.",
            questions=[
                {
                    "id": "q1",
                    "type": "Technical",
                    "prompt": "How would you architect a low-latency LLM agent pipeline that requires streaming responses while maintaining memory of a long conversation?",
                    "ideal_keywords": ["streaming", "chunking", "token buffer", "vector memory", "cache", "async", "FastAPI", "WebSockets"],
                    "follow_up_vague": "You mentioned caching and streaming, but how specifically would you handle token limit overflows and context pruning?",
                    "follow_up_expert": "Given the latency of vector lookups at scale, what indexing algorithm (like HNSW or IVFFlat) would you configure in PostgreSQL pgvector?"
                }
            ],
            status="Active"
        )

        # Job 2
        job2 = JobModel(
            id="job-102",
            title="Frontend Software Engineer (React & UX)",
            department="Core Experience",
            location="Remote (India)",
            min_experience_years=2,
            experience="2-4 years",
            education="B.Tech / BCA / MCA or equivalent portfolio",
            languages=["English"],
            required_skills=["React", "TypeScript / JavaScript", "Tailwind CSS", "Canvas API", "State Management", "Performance Optimization"],
            optional_criteria="Experience with Web Speech API, Chart.js, or micro-frontends.",
            description="Build ultra-responsive, accessible user interfaces for candidate video assessment and recruiter dashboards with Tailwind CSS, React, and Canvas APIs.",
            questions=[],
            status="Active"
        )

        db.add(job1)
        db.add(job2)
        db.commit()

        # Candidate 1: Aarav Sharma (Strong)
        cand1 = CandidateModel(
            id="cand-001",
            job_id="job-101",
            name="Aarav Sharma",
            email="aarav.sharma@example.com",
            phone="+91 98765 43210",
            applied_date="2026-09-18",
            status="Evaluated",
            match_score=94,
            experience_years=4.5,
            education="B.Tech Computer Science, IIT Roorkee (2022)",
            skills=["Python", "FastAPI", "React", "PyTorch", "PostgreSQL", "LangChain", "Docker", "System Design"],
            resume_summary="4+ years building distributed AI products. Led development of an automated document intelligence pipeline serving 50k requests/day with FastAPI and PyTorch.",
            fraud_flags=[],
            integrity_score=96,
            integrity_risk="Low",
            integrity_events=[
                {"id": "e1", "timestamp": "00:12", "type": "FACE_VERIFIED", "description": "Identity verified at session start with webcam feed."},
                {"id": "e2", "timestamp": "03:45", "type": "FOCUS_MAINTAINED", "description": "Continuous single-person presence confirmed."}
            ],
            scores={
                "jobSkills": 95,
                "technicalScore": 92,
                "communication": 90,
                "problemSolving": 94,
                "overall": 93
            },
            interview_summary="Demonstrated deep mastery of asynchronous Python and vector databases. Handled the adaptive cross-examination on pgvector indexing algorithms with concrete production examples.",
            evidence_snippets=[
                {
                    "question": "How would you architect a low-latency LLM agent pipeline?",
                    "answer": "We decouple the prompt expansion and generation into an async FastAPI worker with Server-Sent Events (SSE). For memory, we store conversational summary embeddings in pgvector using an HNSW index.",
                    "aiInsight": "Candidate demonstrated clear architectural maturity rather than reciting generic documentation."
                }
            ],
            skill_gaps={
                "missingSkills": ["WebRTC audio streaming"],
                "strongSkills": ["FastAPI", "LangChain", "pgvector", "System Architecture"],
                "recommendations": [
                    "Explore WebRTC data channels for sub-100ms real-time audio transport.",
                    "Review production benchmarking for LLM speculative decoding."
                ],
                "readiness": "Immediately Job-Ready"
            },
            hr_notes="Top-tier candidate for the Lead AI role. Excellent command over architecture.",
            final_decision="Shortlisted"
        )

        # Candidate 2: Rohan Verma (Flagged)
        cand2 = CandidateModel(
            id="cand-003",
            job_id="job-101",
            name="Rohan Verma (Suspicious/Flagged Profile)",
            email="rohan.v.test@tempmail.org",
            phone="+91 99000 88776",
            applied_date="2026-09-19",
            status="Evaluated",
            match_score=48,
            experience_years=1.0,
            education="BCA, Distance Education (2025)",
            skills=["Python (Beginner)", "HTML/CSS"],
            resume_summary="Resume claims 8 years of Senior Tech Lead experience despite degree completion in 2025. Contradictory dates in employment timeline.",
            fraud_flags=[
                "Inconsistent timeline: Claims 8 years experience at age 22.",
                "Identical boilerplate project descriptions detected from public repository templates.",
                "Unverified employer domain."
            ],
            integrity_score=35,
            integrity_risk="High",
            integrity_events=[
                {"id": "e1", "timestamp": "01:10", "type": "MULTIPLE_FACES", "description": "Secondary person detected in camera background."},
                {"id": "e2", "timestamp": "02:30", "type": "TAB_SWITCH", "description": "Tab switched to external window for 14.5 seconds."}
            ],
            scores={
                "jobSkills": 42,
                "technicalScore": 38,
                "communication": 50,
                "problemSolving": 35,
                "overall": 41
            },
            interview_summary="Candidate recited memorized definitions. Multiple suspicious tab switches and multi-person flags recorded.",
            evidence_snippets=[],
            skill_gaps={
                "missingSkills": ["System Architecture", "FastAPI", "Vector DBs", "Async Programming"],
                "strongSkills": ["Basic Python syntax"],
                "recommendations": ["Need fundamental computer science coursework in Data Structures & Systems."],
                "readiness": "Not Job-Ready"
            },
            hr_notes="Integrity alert triggered. Heavy discrepancy in resume timeline.",
            final_decision="Rejected"
        )

        db.add(cand1)
        db.add(cand2)
        db.commit()
        print("Database successfully seeded with jobs and candidates!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
