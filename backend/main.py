import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, SessionLocal
from models.db_models import JobModel, CandidateModel, IntegrityLogModel
from views.job_views import router as job_router
from views.candidate_views import router as candidate_router
from views.interview_views import router as interview_router
from views.preset_views import router as preset_router
from views.auth_views import router as auth_router

# (M) Create all DB tables
Base.metadata.create_all(bind=engine)

def auto_seed():
    """Auto-seed the database on first boot if empty."""
    db = SessionLocal()
    try:
        if not db.query(JobModel).first():
            print("Empty database detected — auto-seeding...")
            import seed
            seed.seed(force=False)
    except Exception as e:
        print(f"Auto-seed failed (non-fatal): {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    auto_seed()
    yield

app = FastAPI(
    title="SparkX AI Recruitment API (MVC)",
    description="Production MVC Architecture: Models (DB/Schemas), Views (Routers), Controllers (Business Logic)",
    version="2.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (V) Mount View Routers
app.include_router(auth_router)
app.include_router(job_router)
app.include_router(candidate_router)
app.include_router(interview_router)
app.include_router(preset_router)

@app.get("/api/health")
def health_check():
    db = SessionLocal()
    try:
        jobs_count = db.query(JobModel).count()
        candidates_count = db.query(CandidateModel).count()
    except Exception:
        jobs_count = 0
        candidates_count = 0
    finally:
        db.close()
    return {
        "status": "healthy",
        "architecture": "MVC (Model-View-Controller)",
        "service": "SparkX AI Recruitment API",
        "database": str(engine.url),
        "records": {
            "jobs": jobs_count,
            "candidates": candidates_count
        }
    }