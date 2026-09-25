import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, SessionLocal, ensure_schema_columns
from models.db_models import JobModel, CandidateModel, IntegrityLogModel
from views.job_views import router as job_router
from views.candidate_views import router as candidate_router
from views.interview_views import router as interview_router
from views.preset_views import router as preset_router
from views.auth_views import router as auth_router
from views.assessment_views import router as assessment_router
from views.google_auth_views import router as google_auth_router
from views.copilot_views import router as copilot_router

from controllers.auth_controller import check_jwt_production_guard

# (M) Create all DB tables & ensure schema columns
Base.metadata.create_all(bind=engine)
ensure_schema_columns()

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
    check_jwt_production_guard()
    auto_seed()
    yield

app = FastAPI(
    title="SparkX AI Recruitment API (MVC)",
    description="Production MVC Architecture: Models (DB/Schemas), Views (Routers), Controllers (Business Logic)",
    version="2.1.0",
    lifespan=lifespan
)

# Parse explicit allowed CORS origins from environment
raw_cors = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
allowed_origins = [orig.strip() for orig in raw_cors.split(",") if orig.strip()]
has_wildcard = "*" in allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not has_wildcard else ["*"],
    allow_credentials=not has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (V) Mount View Routers
app.include_router(auth_router)
app.include_router(job_router)
app.include_router(candidate_router)
app.include_router(interview_router)
app.include_router(preset_router)
app.include_router(assessment_router)
app.include_router(google_auth_router)
app.include_router(copilot_router)

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