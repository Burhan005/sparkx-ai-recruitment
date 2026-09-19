from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models.db_models import JobModel, CandidateModel, IntegrityLogModel
from views.job_views import router as job_router
from views.candidate_views import router as candidate_router
from views.interview_views import router as interview_router

# (M) Create all tables in database
Base.metadata.create_all(bind=engine)

# Initialize FastAPI App (Presentation Layer)
app = FastAPI(
    title="SparkX AI Recruitment API (MVC)",
    description="Production MVC Architecture: Models (DB/Schemas), Views (Routers), Controllers (Business Logic)",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# (V) Mount View Routers
app.include_router(job_router)
app.include_router(candidate_router)
app.include_router(interview_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "architecture": "MVC (Model-View-Controller)",
        "service": "SparkX AI Recruitment API",
        "database": str(engine.url)
    }
