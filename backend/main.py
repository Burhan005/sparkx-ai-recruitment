import uuid
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import JobModel, CandidateModel, IntegrityLogModel
from schemas import (
    JobCreate, JobResponse,
    CandidateApply, CandidateResponse, CandidateStatusUpdate,
    AdaptiveQuestionRequest, AdaptiveQuestionResponse,
    TelemetryEventCreate, EvaluationRequest
)
from ai_engine import generate_job_questions, evaluate_adaptive_answer, calculate_scorecard_and_gap

# Automatically create PostgreSQL/SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SparkX AI Recruitment API",
    description="Backend API for Smart India Hackathon 2026 AI Recruitment Platform",
    version="1.0.0"
)

# Enable CORS for frontend Vite application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SparkX AI Recruitment API",
        "database": str(engine.url)
    }

# -------------------------------------------------------------
# 1. JOBS & COMPANY REQUIREMENTS (Slide 4 & 5)
# -------------------------------------------------------------
@app.get("/api/jobs", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobModel).all()
    # Populate applicants count
    for job in jobs:
        job.applicants_count = len(job.candidates)
    return jobs

@app.post("/api/jobs", response_model=JobResponse)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    job_id = f"job-{uuid.uuid4().hex[:6]}"
    
    # Synthesize AI questions if not provided
    questions = payload.questions
    if not questions:
        questions = generate_job_questions(
            payload.title, 
            payload.required_skills, 
            payload.min_experience_years
        )

    db_job = JobModel(
        id=job_id,
        title=payload.title,
        department=payload.department,
        location=payload.location,
        min_experience_years=payload.min_experience_years,
        experience=f"{payload.min_experience_years}+ years",
        education=payload.education,
        languages=payload.languages,
        required_skills=payload.required_skills,
        optional_criteria=payload.optional_criteria,
        description=payload.description,
        questions=questions,
        coding_assessment=payload.coding_assessment or {
            "title": f"{payload.title} Code Challenge",
            "language": "javascript",
            "instructions": "Implement the core data handler function.",
            "initialCode": "function handler(data) {\n  return data;\n}"
        },
        status="Active"
    )

    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    db_job.applicants_count = 0
    return db_job

# -------------------------------------------------------------
# 2. CANDIDATES & SCREENING (Slide 5, 6 & 10)
# -------------------------------------------------------------
@app.get("/api/candidates", response_model=List[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(CandidateModel).all()

@app.post("/api/candidates/apply", response_model=CandidateResponse)
def apply_candidate(payload: CandidateApply, db: Session = Depends(get_db)):
    job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Match calculation algorithm
    req_skills = [s.lower() for s in (job.required_skills or [])]
    cand_skills = [s.lower() for s in payload.skills]
    matches = sum(1 for req in req_skills if any(req in cs or cs in req for cs in cand_skills))
    
    score = int((matches / max(1, len(req_skills))) * 70)
    score += 25 if payload.experience_years >= job.min_experience_years else 10
    match_score = min(98, max(35, score))

    cand_id = f"cand-{uuid.uuid4().hex[:6]}"
    new_candidate = CandidateModel(
        id=cand_id,
        job_id=job.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        match_score=match_score,
        experience_years=payload.experience_years,
        education=payload.education,
        skills=payload.skills,
        resume_summary=payload.resume_summary or "Candidate resume processed.",
        fraud_flags=payload.fraud_flags or [],
        status="Screening",
        final_decision="Pending Interview"
    )

    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate

@app.patch("/api/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: str, payload: CandidateStatusUpdate, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.final_decision = payload.status
    candidate.status = "Rejected" if payload.status == "Rejected" else "Evaluated"
    if payload.hr_notes:
        candidate.hr_notes = payload.hr_notes

    db.commit()
    return {"message": f"Candidate {candidate_id} status updated to {payload.status}"}

# -------------------------------------------------------------
# 3. LIVE AI INTERVIEW & ADAPTIVE CROSS-QUESTIONING (Slide 7 & 8)
# -------------------------------------------------------------
@app.post("/api/interview/adaptive-question", response_model=AdaptiveQuestionResponse)
def adaptive_question(payload: AdaptiveQuestionRequest):
    result = evaluate_adaptive_answer(
        prompt=payload.question_prompt,
        answer=payload.candidate_answer,
        ideal_keywords=payload.ideal_keywords or [],
        follow_up_vague=payload.follow_up_vague,
        follow_up_expert=payload.follow_up_expert
    )
    return result

# -------------------------------------------------------------
# 4. ANTI-CHEATING TELEMETRY AUDIT LOG (Slide 8 & 9)
# -------------------------------------------------------------
@app.post("/api/interview/telemetry")
def log_telemetry(payload: TelemetryEventCreate, db: Session = Depends(get_db)):
    log_id = f"ev-{uuid.uuid4().hex[:6]}"
    event = IntegrityLogModel(
        id=log_id,
        candidate_id=payload.candidate_id,
        timestamp=payload.timestamp,
        event_type=payload.event_type,
        description=payload.description,
        severity=payload.severity
    )
    db.add(event)
    db.commit()
    return {"status": "recorded", "event_id": log_id}

# -------------------------------------------------------------
# 5. EVALUATION SCORECARD & SKILL GAP (Slide 11-14)
# -------------------------------------------------------------
@app.post("/api/interview/evaluate")
def evaluate_interview(payload: EvaluationRequest, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
    job = db.query(JobModel).filter(JobModel.id == payload.job_id).first()

    if not candidate or not job:
        raise HTTPException(status_code=404, detail="Candidate or Job record not found")

    evaluation = calculate_scorecard_and_gap(
        job_skills=job.required_skills or [],
        candidate_skills=candidate.skills or [],
        transcript=payload.transcript,
        integrity_score=payload.integrity_score,
        code_score=payload.code_score
    )

    # Determine risk level
    risk = "Low"
    if payload.integrity_score < 60:
        risk = "High"
    elif payload.integrity_score < 80:
        risk = "Medium"

    # Persist evaluation directly to PostgreSQL
    candidate.scores = evaluation["scores"]
    candidate.interview_summary = evaluation["interview_summary"]
    candidate.evidence_snippets = evaluation["evidence_snippets"]
    candidate.skill_gaps = evaluation["skill_gaps"]
    candidate.integrity_score = payload.integrity_score
    candidate.integrity_risk = risk
    candidate.integrity_events = payload.integrity_events
    candidate.status = "Evaluated"
    candidate.final_decision = "Shortlisted" if evaluation["scores"]["overall"] >= 80 and risk == "Low" else "Under Review"

    db.commit()
    return evaluation
