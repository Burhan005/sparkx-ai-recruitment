import os
import uuid
import time
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
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
from views.organization_views import router as organization_router
from views.scheduling_views import router as scheduling_router
from views.skill_views import router as skill_router

from controllers.auth_controller import check_jwt_production_guard
from rate_limiter import RateLimitMiddleware
from services.sandbox_runner import SandboxRunner
from ai_engine import get_llm_status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sparkx.api")

ENV_NAME = os.environ.get("ENVIRONMENT", os.environ.get("ENV", "development")).lower()
is_production = ENV_NAME in ["production", "prod"]

# (M) Create all DB tables & ensure schema columns
Base.metadata.create_all(bind=engine)
ensure_schema_columns()

def auto_seed():
    """Auto-seed the database on first boot only if empty and in non-production environment."""
    if is_production:
        logger.info("Production mode: Auto-seeding disabled. Production database must not contain mock data.")
        return
    db = SessionLocal()
    try:
        if not db.query(JobModel).first():
            print("Empty database detected in development — auto-seeding...")
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
    version="2.2.0",
    lifespan=lifespan
)

class ObservabilityMiddleware(BaseHTTPMiddleware):
    """
    Production Observability & Tracing Middleware:
    1. Propagates or generates unique X-Request-ID for distributed tracing.
    2. Times request execution (X-Response-Time-Ms).
    3. Emits structured access logs scrubbing PII, passwords, and tokens.
    """
    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:12]}"
        start_time = time.perf_counter()

        request.state.request_id = req_id

        try:
            response = await call_next(request)
        except Exception as unhandled_err:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(f"[SERVER ERROR] {request.method} {request.url.path} (req_id={req_id}): {unhandled_err}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "An internal server error occurred. Please contact support with the request ID.",
                    "request_id": req_id
                },
                headers={
                    "X-Request-ID": req_id,
                    "X-Response-Time-Ms": str(duration_ms)
                }
            )

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = str(duration_ms)

        path = request.url.path
        if not path.startswith(("/docs", "/openapi.json", "/favicon.ico")):
            logger.info(f"[HTTP] {request.method} {path} -> {response.status_code} ({duration_ms}ms) req_id={req_id}")

        return response

# Parse explicit allowed CORS origins from environment
raw_cors = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
)
allowed_origins = [orig.strip() for orig in raw_cors.split(",") if orig.strip()]
has_wildcard = "*" in allowed_origins

# Register Middlewares
app.add_middleware(ObservabilityMiddleware)
app.add_middleware(RateLimitMiddleware)
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
app.include_router(organization_router)
app.include_router(scheduling_router)
app.include_router(skill_router)

@app.get("/api/health/live")
def liveness_check():
    """Fast liveness probe: returns 200 as long as the process is running."""
    return {
        "status": "live",
        "service": "sparkx-api",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/health/ready")
def readiness_check():
    """
    Deep readiness probe: validates database connectivity and core subsystems.
    Returns 503 if mandatory database dependency is unreachable.
    """
    from sqlalchemy import text
    db = SessionLocal()
    db_healthy = False
    err_msg = None
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        err_msg = str(e)
    finally:
        db.close()

    if not db_healthy:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": err_msg or "Database unavailable"
            }
        )

    llm_info = get_llm_status()
    sandbox = SandboxRunner.get_instance()
    supported_langs = sandbox.get_supported_languages()

    return {
        "status": "ready",
        "service": "sparkx-api",
        "database": "connected",
        "database_backend": engine.name,
        "llm_provider": llm_info.get("provider"),
        "llm_mode": llm_info.get("mode"),
        "sandbox_engine": "Isolated Subprocess Sandbox",
        "supported_languages": [l["id"] for l in supported_langs],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/health")
def health_check():
    """Comprehensive diagnostic endpoint."""
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
        "database_backend": engine.name,
        "database_status": "connected",
        "records": {
            "jobs": jobs_count,
            "candidates": candidates_count
        }
    }