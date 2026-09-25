"""
Database Seeding Script for SparkX AI Recruitment
Pre-populates SQLite/PostgreSQL with realistic demo data.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models.db_models import JobModel, CandidateModel, UserModel
from controllers.auth_controller import hash_password

Base.metadata.create_all(bind=engine)

def seed(force=False):
    db = SessionLocal()
    try:
        if db.query(JobModel).first() and not force:
            print("DB already seeded. Use seed(force=True) to re-seed.")
            return

        if force:
            # Preserve existing registered users so personal accounts are never lost
            existing_users = db.query(UserModel).all()
            user_snapshots = [
                {
                    "id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "password_hash": u.password_hash,
                    "role": u.role,
                    "reset_token": getattr(u, "reset_token", None),
                    "reset_token_expiry": getattr(u, "reset_token_expiry", None)
                }
                for u in existing_users
            ]
            db.close()
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            print("Cleared existing tables and recreated DB schema (preserving registered users)...")
            # Restore preserved users
            for u_data in user_snapshots:
                db.add(UserModel(**u_data))
            db.commit()

        print("Seeding SparkX DB with SIH 2026 demo data & default accounts...")

        # Seed Default System Users
        admin_user = UserModel(
            id="usr-admin01",
            name="SparkX Admin",
            email="admin@sparkx.ai",
            password_hash=hash_password("sparkx2026"),
            role="recruiter"
        )
        cand_user = UserModel(
            id="usr-cand01",
            name="Demo Candidate",
            email="candidate@sparkx.ai",
            password_hash=hash_password("sparkx2026"),
            role="candidate"
        )
        db.add(admin_user)
        db.add(cand_user)
        db.commit()

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
                    "idealKeywords": ["streaming", "chunking", "token buffer", "vector memory", "cache", "async", "FastAPI", "WebSockets"],
                    "followUpVague": "You mentioned caching and streaming, but how specifically would you handle token limit overflows and context pruning?",
                    "followUpExpert": "Given the latency of vector lookups at scale, what indexing algorithm (like HNSW or IVFFlat) would you configure in PostgreSQL pgvector?"
                },
                {
                    "id": "q2",
                    "type": "System Design",
                    "prompt": "Describe an anti-cheating or browser telemetry mechanism for online assessments. How do you guard against false positives?",
                    "idealKeywords": ["MediaPipe", "face-api", "visibilitychange", "blur event", "event log", "heuristic threshold", "audit trail"],
                    "followUpVague": "What happens if a user accidentally alt-tabs for 1 second? How do you prevent that from disqualifying them?",
                    "followUpExpert": "How would you handle WebRTC video processing server-side versus client-side to minimize CPU usage on low-end candidate devices?"
                },
                {
                    "id": "q3",
                    "type": "Behavioral",
                    "prompt": "Tell us about a time you identified an algorithmic bias or reliability failure in an AI pipeline and how you rectified it.",
                    "idealKeywords": ["evaluation dataset", "ground truth", "guardrails", "monitoring", "stakeholder communication"],
                    "followUpVague": "Could you walk through the concrete metric you used to verify that the fix actually reduced hallucination or bias?",
                    "followUpExpert": "What automated regression tests did you put into the CI/CD pipeline to ensure model drift didn't reintroduce that failure?"
                }
            ],
            coding_assessment={
                "title": "Real-time Telemetry Debounce & Event Aggregator",
                "language": "javascript",
                "instructions": "Implement an integrity log aggregator that collapses consecutive duplicate suspicious events within a 3-second window to prevent alert fatigue for HR.",
                "initialCode": "// Implement aggregateSuspiciousEvents(events)\n// Each event: { type: string, timestamp: number }\n// Return filtered events where duplicates within 3000ms are combined.\n\nfunction aggregateSuspiciousEvents(events) {\n  if (!events || events.length === 0) return [];\n  const result = [];\n  let lastEvent = null;\n  for (const ev of events) {\n    if (!lastEvent || ev.type !== lastEvent.type || (ev.timestamp - lastEvent.timestamp) > 3000) {\n      result.push({ ...ev, count: 1 });\n      lastEvent = ev;\n    } else {\n      result[result.length - 1].count += 1;\n    }\n  }\n  return result;\n}\n\nconsole.log(aggregateSuspiciousEvents([\n  { type: 'TAB_SWITCH', timestamp: 1000 },\n  { type: 'TAB_SWITCH', timestamp: 2500 },\n  { type: 'FACE_LOST', timestamp: 6000 }\n]));",
                "testCases": [
                    {"name": "Debounce consecutive tab switches (<3s)", "input": "2 identical events at 1s and 2.5s", "expected": "1 aggregated event (count: 2)"},
                    {"name": "Separate distinct events", "input": "Events separated by 5s", "expected": "2 distinct events"}
                ]
            },
            status="Active",
            ctc_min=20.0,
            ctc_max=30.0,
            ctc_currency="INR",
            ctc_type="range",
            ctc_period="annual"
        )

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
            questions=[
                {
                    "id": "q1",
                    "type": "Technical",
                    "prompt": "How do you ensure smooth 60fps rendering when doing real-time video overlay and Canvas bounding box animations?",
                    "idealKeywords": ["requestAnimationFrame", "offscreen canvas", "GPU acceleration", "useRef", "memo", "debouncing"],
                    "followUpVague": "What specific React hooks or lifecycle patterns do you use to avoid unnecessary component re-renders during 30fps video processing?",
                    "followUpExpert": "How would you implement an OffscreenCanvas web worker to decouple computer vision calculations from the main UI thread?"
                },
                {
                    "id": "q2",
                    "type": "Problem Solving",
                    "prompt": "How would you design an inclusive, accessible UI for candidates with speech or visual impairments taking an online AI interview?",
                    "idealKeywords": ["ARIA live regions", "keyboard navigation", "high contrast", "speech-to-text fallback", "WCAG"],
                    "followUpVague": "What fallback input mechanism would you offer if the user's browser fails to support the Web Speech Recognition API?",
                    "followUpExpert": "How do you test screen reader compliance dynamically for live streaming subtitles and AI question prompts?"
                }
            ],
            coding_assessment={
                "title": "Custom React Hook: useMediaStream",
                "language": "javascript",
                "instructions": "Write a safe camera stream hook logic with error handling for NotFoundError and NotAllowedError.",
                "initialCode": "// Write stream initialization logic with camera permission handling\nasync function initCameraStream(videoElement) {\n  try {\n    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });\n    if (videoElement) {\n      videoElement.srcObject = stream;\n    }\n    return { success: true, stream };\n  } catch (err) {\n    if (err.name === 'NotAllowedError') {\n      return { success: false, error: 'Camera/Mic permission denied by user' };\n    }\n    return { success: false, error: err.message };\n  }\n}",
                "testCases": [
                    {"name": "Handles camera permission denial cleanly", "input": "NotAllowedError", "expected": "Returns descriptive error message"}
                ]
            },
            status="Active",
            ctc_min=12.0,
            ctc_max=18.0,
            ctc_currency="INR",
            ctc_type="range",
            ctc_period="annual"
        )

        db.add(job1)
        db.add(job2)
        db.commit()

        # ─── Candidates ───────────────────────────────────────────────────────────
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
            resume_summary="Senior AI & Distributed Systems Engineer with 4.5+ years architecting enterprise machine learning pipelines, low-latency microservices, and agentic workflows.\n\nKey Achievements & Production Deliverables:\n• Spearheaded high-throughput automated document intelligence pipeline processing 50k+ daily transactions with FastAPI, PyTorch, and Docker.\n• Integrated asynchronous pgvector semantic search with HNSW indexing, reducing retrieval latency from 240ms to under 75ms.\n• Led architecture of resilient decoupled workers utilizing Celery/Redis and Server-Sent Events (SSE) for streaming LLM reasoning traces.\n• Maintained 99.95% system uptime and authored automated unit and integration suites achieving 92% code coverage.",
            fraud_flags=[],
            integrity_score=96,
            integrity_risk="Low",
            integrity_events=[
                {"id": "e1", "timestamp": "00:12", "type": "FACE_VERIFIED", "description": "Identity verified at session start with webcam feed."},
                {"id": "e2", "timestamp": "03:45", "type": "FOCUS_MAINTAINED", "description": "Continuous single-person presence confirmed."}
            ],
            scores={"jobSkills": 95, "technicalScore": 92, "communication": 90, "problemSolving": 94, "overall": 93},
            interview_summary="Demonstrated deep mastery of asynchronous Python and vector databases. Handled the adaptive cross-examination on pgvector indexing algorithms with concrete production examples. Clear communication with zero integrity flags.",
            evidence_snippets=[
                {"question": "How would you architect a low-latency LLM agent pipeline?", "answer": "We decouple the prompt expansion and generation into an async FastAPI worker with Server-Sent Events (SSE). For memory, we store conversational summary embeddings in pgvector using an HNSW index.", "aiInsight": "Candidate demonstrated clear architectural maturity rather than reciting generic documentation."},
                {"question": "Adaptive Follow-up: What indexing algorithm would you configure?", "answer": "HNSW is superior for low latency over IVFFlat because IVFFlat requires periodic retraining and clustering when data scales.", "aiInsight": "Verified genuine deep understanding under adaptive challenge."}
            ],
            skill_gaps={"missingSkills": ["WebRTC audio streaming"], "strongSkills": ["FastAPI", "LangChain", "pgvector", "System Architecture"], "recommendations": ["Explore WebRTC data channels for sub-100ms real-time audio transport.", "Review production benchmarking for LLM speculative decoding."], "readiness": "Immediately Job-Ready"},
            hr_notes="Top-tier candidate for the Lead AI role. Excellent command over architecture.",
            final_decision="Shortlisted"
        )

        cand2 = CandidateModel(
            id="cand-002",
            job_id="job-101",
            name="Neha Patel",
            email="neha.patel@techmail.in",
            phone="+91 98111 22334",
            applied_date="2026-09-18",
            status="Evaluated",
            match_score=86,
            experience_years=3.2,
            education="B.E. Information Technology, Pune University (2023)",
            skills=["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Tailwind CSS"],
            resume_summary="Full-Stack Engineer with 3.2+ years designing cloud microservices, responsive web dashboards, and AI-assisted workflows.\n\nKey Achievements & Production Deliverables:\n• Built scalable RESTful services using FastAPI and PostgreSQL, supporting 20k+ daily active frontend sessions.\n• Developed rich analytics dashboards with React, TypeScript, and Tailwind CSS, improving recruiter operational efficiency by 35%.\n• Integrated client-side streaming consumption via ReadableStream APIs to render real-time AI responses with zero UI stutter.\n• Collaborated on containerized deployments using Docker and GitHub Actions for continuous zero-downtime releases.",
            fraud_flags=[],
            integrity_score=88,
            integrity_risk="Low",
            integrity_events=[
                {"id": "e1", "timestamp": "00:08", "type": "FACE_VERIFIED", "description": "Face verified at interview start."},
                {"id": "e2", "timestamp": "04:12", "type": "TAB_SWITCH", "description": "Window lost focus for 2.4 seconds (candidate returned promptly)."}
            ],
            scores={"jobSkills": 84, "technicalScore": 82, "communication": 92, "problemSolving": 85, "overall": 86},
            interview_summary="Strong full-stack fundamentals and exceptionally articulate communicator. Slightly less experience in deep PyTorch internals, but demonstrates fast learning ability.",
            evidence_snippets=[{"question": "How would you architect a low-latency LLM agent pipeline?", "answer": "I would use FastAPI with asynchronous endpoints, streaming tokens directly to the React frontend using ReadableStream readers.", "aiInsight": "Clean frontend-to-backend data flow explanation."}],
            skill_gaps={"missingSkills": ["PyTorch model fine-tuning", "Advanced Vector Indexing (HNSW)"], "strongSkills": ["React", "FastAPI", "REST APIs", "Clean Code Architecture"], "recommendations": ["Complete Deep Learning Foundations on Hugging Face / PyTorch.", "Practice implementing RAG with vector search indexing."], "readiness": "Hire-and-Develop (Trainable within 30 days)"},
            hr_notes="High potential hire. Would thrive in a collaborative squad with quick mentorship.",
            final_decision="Under Review"
        )

        cand3 = CandidateModel(
            id="cand-003",
            job_id="job-101",
            name="Rohan Verma (Flagged Profile)",
            email="rohan.v.test@tempmail.org",
            phone="+91 99000 88776",
            applied_date="2026-09-19",
            status="Evaluated",
            match_score=48,
            experience_years=1.0,
            education="BCA, Distance Education (2025)",
            skills=["Python (Beginner)", "HTML/CSS"],
            resume_summary="Resume claims 8 years of Senior Tech Lead experience despite degree completion in 2025. Contradictory dates in employment timeline.",
            fraud_flags=["Inconsistent timeline: Claims 8 years experience at age 22.", "Identical boilerplate project descriptions detected from public repository templates.", "Unverified employer domain."],
            integrity_score=35,
            integrity_risk="High",
            integrity_events=[
                {"id": "e1", "timestamp": "01:10", "type": "MULTIPLE_FACES", "description": "Secondary person detected in camera background."},
                {"id": "e2", "timestamp": "02:30", "type": "TAB_SWITCH", "description": "Tab switched to external window for 14.5 seconds."},
                {"id": "e3", "timestamp": "04:02", "type": "TAB_SWITCH", "description": "Tab switched to search engine window for 18.2 seconds."},
                {"id": "e4", "timestamp": "05:15", "type": "FACE_LOST", "description": "Candidate face completely out of frame for 8 seconds."}
            ],
            scores={"jobSkills": 42, "technicalScore": 38, "communication": 50, "problemSolving": 35, "overall": 41},
            interview_summary="Candidate recited memorized definitions. Multiple suspicious tab switches and multi-person flags recorded.",
            evidence_snippets=[{"question": "Adaptive Follow-up: How do you handle cache invalidation?", "answer": "Cache invalidation is... basically we clear the cache when it gets full or we use Redis.", "aiInsight": "Answer was vague and generic. Lacked concrete implementation understanding."}],
            skill_gaps={"missingSkills": ["System Architecture", "FastAPI", "Vector DBs", "Async Programming"], "strongSkills": ["Basic Python syntax"], "recommendations": ["Need fundamental computer science coursework in Data Structures & Systems."], "readiness": "Not Job-Ready"},
            hr_notes="Integrity alert triggered. Heavy discrepancy in resume timeline and multiple external tab lookups during interview.",
            final_decision="Rejected"
        )

        cand4 = CandidateModel(
            id="cand-004",
            job_id="job-101",
            name="Priya Nair",
            email="priya.nair@techinnovations.io",
            phone="+91 97654 32109",
            applied_date="2026-09-19",
            status="Screening",
            match_score=89,
            experience_years=3.5,
            education="B.Tech Computer Science, BITS Pilani (2022)",
            skills=["Python", "FastAPI", "Docker", "PostgreSQL", "LangChain", "Kubernetes"],
            resume_summary="Cloud Backend & AI Systems Engineer with 3.5+ years building distributed API gateways, asynchronous message queues, and production LLM orchestration.\n\nKey Achievements & Production Deliverables:\n• Architected scalable microservices handling large-scale text ingestion and vector indexing using Python, FastAPI, and PostgreSQL.\n• Containerized multi-agent LLM pipelines with Docker and Kubernetes, reducing compute resource consumption by 28%.\n• Designed robust database schemas, transactional integrity checks, and high-concurrency connection pooling.",
            fraud_flags=[],
            integrity_score=100,
            integrity_risk="Low",
            integrity_events=[],
            scores={},
            interview_summary=None,
            evidence_snippets=[],
            skill_gaps={},
            hr_notes="Strong candidate from resume screening. Recommended for AI interview round.",
            final_decision="Pending Interview",
            interview_scheduled_at=None,
            interview_meeting_url=None,
            interview_status="Applied"
        )

        cand5 = CandidateModel(
            id="cand-005",
            job_id="job-101",
            name="Vikram Malhotra",
            email="vikram.malhotra@cloudai.dev",
            phone="+91 98450 11223",
            applied_date="2026-09-17",
            status="Interview Scheduled",
            match_score=92,
            experience_years=4.8,
            education="M.Tech AI & Data Systems, IIIT Hyderabad (2021)",
            skills=["Python", "FastAPI", "React", "PyTorch", "pgvector", "LangChain", "System Design"],
            resume_summary="Lead ML Platform Engineer with 4.8+ years designing scalable agentic workflows, high-frequency inference endpoints, and vector search systems.\n\nKey Achievements & Production Deliverables:\n• Designed real-time LLM inference pipelines delivering streaming token output with sub-90ms time-to-first-token (TTFT).\n• Implemented custom HNSW vector indices on pgvector with periodic re-indexing and memory caching layers.\n• Authored system design specifications for enterprise AI platforms handling multi-modal document and audio inputs.",
            fraud_flags=[],
            integrity_score=100,
            integrity_risk="Low",
            integrity_events=[],
            scores={},
            interview_summary=None,
            evidence_snippets=[],
            skill_gaps={},
            hr_notes="Interview invitation sent. Google Meet link dispatched.",
            final_decision="Pending Interview",
            interview_scheduled_at="Tomorrow, 02:30 PM",
            interview_meeting_url="https://meet.google.com/spk-aixr-rec",
            interview_status="Interview Scheduled"
        )

        cand6 = CandidateModel(
            id="cand-006",
            job_id="job-102",
            name="Kavita Sen",
            email="kavita.sen@frontendlab.org",
            phone="+91 99887 66554",
            applied_date="2026-09-16",
            status="Evaluated",
            match_score=96,
            experience_years=4.0,
            education="B.E. Computer Engineering, Delhi Technological University (2022)",
            skills=["React", "TypeScript", "Tailwind CSS", "Canvas API", "Web Speech API", "Micro-frontends"],
            resume_summary="Staff Frontend & Systems Engineer with 4.0+ years architecting high-frequency telemetry dashboards, real-time video canvases, and accessible design systems.\n\nKey Achievements & Production Deliverables:\n• Architected 60fps real-time computer vision overlays using Web Workers, OffscreenCanvas, and double-buffered render pipelines.\n• Built comprehensive enterprise design systems in React and Tailwind CSS with strict WCAG 2.1 AA accessibility standards.\n• Reduced frontend bundle sizes by 45% through aggressive code-splitting and dynamic route-based asset delivery.",
            fraud_flags=[],
            integrity_score=98,
            integrity_risk="Low",
            integrity_events=[
                {"id": "e1", "timestamp": "00:10", "type": "FACE_VERIFIED", "description": "Identity confirmed at session start."},
                {"id": "e2", "timestamp": "05:22", "type": "FOCUS_MAINTAINED", "description": "Continuous single-person engagement throughout assessment."}
            ],
            scores={"jobSkills": 96, "technicalScore": 95, "communication": 94, "problemSolving": 92, "overall": 95},
            interview_summary="Exceptional UI architecture mastery. Demonstrated custom WebRTC hook implementation and 60fps canvas bounding box calculations with zero lag. Clear communicator and team player.",
            evidence_snippets=[
                {"question": "How do you ensure smooth 60fps rendering with real-time video overlay and Canvas?", "answer": "We offload vision landmark inferences to a Web Worker using OffscreenCanvas and bind render cycles strictly to requestAnimationFrame with double-buffered layers.", "aiInsight": "Candidate demonstrated pristine systems-level frontend performance engineering."}
            ],
            skill_gaps={"missingSkills": [], "strongSkills": ["React", "Canvas API", "Performance Optimization", "Accessibility"], "recommendations": ["Ready to mentor junior frontend engineers."], "readiness": "Senior Ready"},
            hr_notes="Formal offer letter dispatched. Candidate accepted; onboarding scheduled.",
            final_decision="Offered",
            interview_scheduled_at="Completed (2026-09-18)",
            interview_meeting_url=None,
            interview_status="Offer Sent"
        )

        db.add(cand1)
        db.add(cand2)
        db.add(cand3)
        db.add(cand4)
        db.add(cand5)
        db.add(cand6)
        db.commit()
        print("[OK] Seeded database: 2 jobs, 6 candidates across all 5 pipeline stages, 2 users")

    finally:
        db.close()

if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    seed(force=force)