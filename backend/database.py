import os
import socket
import logging
from urllib.parse import urlparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sparkx.database")

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/sparkx_recruitment"
)

def extract_db_host_port(url_str: str) -> tuple:
    """Parse host and port dynamically from database URL."""
    try:
        parsed = urlparse(url_str)
        host = parsed.hostname or "127.0.0.1"
        if host == "localhost":
            host = "127.0.0.1"
        port = parsed.port or 5432
        return host, port
    except Exception:
        return "127.0.0.1", 5432

def is_postgres_running(host: str, port: int, timeout: float = 0.8) -> bool:
    """Fast non-blocking socket check to see if PostgreSQL is actively listening."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

ENV_NAME = os.environ.get("ENVIRONMENT", os.environ.get("ENV", "development")).lower()
is_production = ENV_NAME in ["production", "prod"]

# Smart Database Initialization
is_pg = DATABASE_URL.startswith("postgresql")
pg_host, pg_port = extract_db_host_port(DATABASE_URL)

if is_pg and is_postgres_running(pg_host, pg_port):
    try:
        # Use 127.0.0.1 if host is localhost to avoid Windows IPv6 resolution latency
        pg_url = DATABASE_URL.replace("localhost", "127.0.0.1") if "localhost" in DATABASE_URL else DATABASE_URL
        pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
        max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))

        engine = create_engine(
            pg_url,
            pool_pre_ping=True,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_recycle=pool_recycle,
            connect_args={"connect_timeout": 5}
        )
        # Verify the connection; if the target database does not exist, check environment
        try:
            with engine.connect() as _conn:
                pass
            logger.info(f"Connected to PostgreSQL database on {pg_host}:{pg_port}.")
        except Exception as conn_err:
            if is_production:
                raise RuntimeError(
                    f"FATAL DATABASE ERROR: Production environment failed to connect to PostgreSQL ({conn_err}). "
                    f"Silent SQLite fallback is strictly prohibited in production."
                )
            logger.warning(f"PostgreSQL DB connection failed ({conn_err}). Falling back to local SQLite for development.")
            _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
            _SQLITE_PATH = os.path.join(_BACKEND_DIR, "sparkx_recruitment.db").replace('\\', '/')
            DATABASE_URL = f"sqlite:///{_SQLITE_PATH}"
            engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
            logger.warning(f"Development mode: Running on local SQLite database '{_SQLITE_PATH}'.")
    except RuntimeError:
        raise
    except Exception as err:
        if is_production:
            raise RuntimeError(
                f"FATAL DATABASE ERROR: Production environment failed to authenticate with PostgreSQL ({err}). "
                f"Silent SQLite fallback is strictly prohibited in production."
            )
        logger.warning(f"PostgreSQL authentication failed ({err}). Falling back to local SQLite for development.")
        _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        _SQLITE_PATH = os.path.join(_BACKEND_DIR, "sparkx_recruitment.db").replace("\\", "/")
        DATABASE_URL = f"sqlite:///{_SQLITE_PATH}"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        logger.warning(f"Development mode: Running on local SQLite database '{_SQLITE_PATH}'.")
else:
    if is_production:
        raise RuntimeError(
            f"FATAL DATABASE ERROR: PostgreSQL service is not active on {pg_host}:{pg_port} in production. "
            f"Silent SQLite fallback is strictly prohibited in production."
        )
    if is_pg:
        logger.info(f"PostgreSQL service is not active on {pg_host}:{pg_port}. Automatically running on local SQLite database 'sparkx_recruitment.db' for development.")
    _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    _SQLITE_PATH = os.path.join(_BACKEND_DIR, "sparkx_recruitment.db").replace("\\", "/")
    DATABASE_URL = f"sqlite:///{_SQLITE_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    logger.info(f"Development mode: Running on local SQLite database '{_SQLITE_PATH}'.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_schema_columns():
    """Ensure newly added columns and tables exist in existing database."""
    import models.db_models  # Ensure all models are registered on Base.metadata
    Base.metadata.create_all(bind=engine)
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            if str(engine.url).startswith("sqlite"):
                # Users table columns
                user_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
                new_user_cols = {
                    "reset_token": "VARCHAR",
                    "reset_token_expiry": "TIMESTAMP",
                    "reset_token_attempts": "INTEGER DEFAULT 0",
                    "phone": "VARCHAR",
                    "job_role": "VARCHAR",
                    "experience_years": "FLOAT DEFAULT 0.0",
                    "skills": "JSON DEFAULT '[]'",
                    "education": "VARCHAR",
                    "resume_filename": "VARCHAR",
                    "resume_summary": "TEXT",
                    "resume_text": "TEXT",
                    "organization_id": "VARCHAR DEFAULT 'org-sparkx-default'"
                }
                for col, col_type in new_user_cols.items():
                    if col not in user_cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                        conn.commit()

                # Jobs table columns
                job_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(jobs)")).fetchall()]
                new_job_cols = {
                    "company_name": "VARCHAR DEFAULT 'SparkX Technologies'",
                    "organization_id": "VARCHAR DEFAULT 'org-sparkx-default'",
                    "coding_difficulty": "VARCHAR DEFAULT 'Mid-Level'",
                    "assessment_pool": "JSON DEFAULT '{}'",
                    "assessment_version": "INTEGER DEFAULT 1",
                    "competency_blueprint": "JSON DEFAULT '{}'",
                    "ctc_type": "VARCHAR DEFAULT 'range'",
                    "ctc_min": "NUMERIC(10, 2)",
                    "ctc_max": "NUMERIC(10, 2)",
                    "ctc_currency": "VARCHAR DEFAULT 'INR'",
                    "ctc_period": "VARCHAR DEFAULT 'annual'",
                    "variable_pay_min": "NUMERIC(10, 2)",
                    "variable_pay_max": "NUMERIC(10, 2)",
                    "closed_at": "TIMESTAMP",
                    "closed_by": "VARCHAR",
                    "closure_reason": "TEXT",
                    "paused_at": "TIMESTAMP"
                }
                for col, col_type in new_job_cols.items():
                    if col not in job_cols:
                        conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col} {col_type}"))
                        conn.commit()

                # Candidates table columns
                cand_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(candidates)")).fetchall()]
                new_cand_cols = {
                    "interview_meeting_url": "VARCHAR",
                    "company_name": "VARCHAR DEFAULT 'SparkX Technologies'",
                    "resume_filename": "VARCHAR",
                    "resume_text": "TEXT",
                    "assessment_data": "JSON DEFAULT '{}'",
                    "coding_language": "VARCHAR",
                    "coding_score": "INTEGER DEFAULT 0",
                    "coding_submission": "TEXT",
                    "coding_results": "JSON DEFAULT '{}'",
                    "recruiter_score": "INTEGER",
                    "rejection_reason": "TEXT",
                    "rejection_category": "VARCHAR",
                    "match_details": "JSON DEFAULT '{}'",
                    # Authoritative Candidate Application Compensation Expectations
                    "current_ctc": "NUMERIC(10, 2)",
                    "expected_ctc_type": "VARCHAR DEFAULT 'range'",
                    "expected_ctc_min": "NUMERIC(10, 2)",
                    "expected_ctc_max": "NUMERIC(10, 2)",
                    "ctc_currency": "VARCHAR DEFAULT 'INR'",
                    # Authoritative 4-Dimensional State Columns
                    "stage": "VARCHAR DEFAULT 'applied'",
                    "assessment_status": "VARCHAR DEFAULT 'not_invited'",
                    "assessment_invited_at": "TIMESTAMP",
                    "assessment_started_at": "TIMESTAMP",
                    "assessment_submitted_at": "TIMESTAMP",
                    "assessment_evaluated_at": "TIMESTAMP",
                    "interview_started_at": "TIMESTAMP",
                    "interview_completed_at": "TIMESTAMP",
                    "hiring_decision": "VARCHAR DEFAULT 'undecided'",
                    "stage_updated_at": "TIMESTAMP",
                    "decision_updated_at": "TIMESTAMP",
                    "user_id": "VARCHAR",
                    "version": "INTEGER DEFAULT 1",
                    # Expected Update Date & Timeline Telemetry
                    "expected_update_date": "VARCHAR",
                    "update_notes": "TEXT",
                    "update_status": "VARCHAR DEFAULT 'not_set'",
                    "update_sent_at": "TIMESTAMP",
                    "reminder_sent_flags": "JSON DEFAULT '{}'",
                    "assessment_version": "INTEGER DEFAULT 1",
                    "assessment_blueprint": "JSON DEFAULT '{}'",
                    "external_assessment_platform": "VARCHAR",
                    "external_assessment_id": "VARCHAR",
                    "external_assessment_url": "VARCHAR",
                    "external_assessment_result": "JSON DEFAULT '{}'",
                    "external_assessment_synced_at": "TIMESTAMP",
                    "reopened_at": "TIMESTAMP",
                    "reopened_by": "VARCHAR",
                    "reopen_reason": "TEXT",
                    "previous_final_decision": "VARCHAR",
                    "organization_id": "VARCHAR DEFAULT 'org-sparkx-default'"
                }
                for col, col_type in new_cand_cols.items():
                    if col not in cand_cols:
                        conn.execute(text(f"ALTER TABLE candidates ADD COLUMN {col} {col_type}"))
                        conn.commit()

                # Coding Problems table columns
                prob_tables = [row[0] for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()]
                if "coding_problems" in prob_tables:
                    prob_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(coding_problems)")).fetchall()]
                    new_prob_cols = {
                        "execution_mode": "VARCHAR DEFAULT 'function'",
                        "function_signature": "JSON DEFAULT '{}'"
                    }
                    for col, col_type in new_prob_cols.items():
                        if col not in prob_cols:
                            conn.execute(text(f"ALTER TABLE coding_problems ADD COLUMN {col} {col_type}"))
                            conn.commit()

                if "coding_problem_versions" in prob_tables:
                    cpv_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(coding_problem_versions)")).fetchall()]
                    new_cpv_cols = {
                        "execution_mode": "VARCHAR DEFAULT 'function'",
                        "function_signature": "JSON DEFAULT '{}'"
                    }
                    for col, col_type in new_cpv_cols.items():
                        if col not in cpv_cols:
                            conn.execute(text(f"ALTER TABLE coding_problem_versions ADD COLUMN {col} {col_type}"))
                            conn.commit()
            else:
                # PostgreSQL schema column synchronization
                for col, col_type in new_user_cols.items():
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                for col, col_type in new_job_cols.items():
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                for col, col_type in new_cand_cols.items():
                    conn.execute(text(f"ALTER TABLE candidates ADD COLUMN IF NOT EXISTS {col} {col_type}"))
                try:
                    conn.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS execution_mode VARCHAR DEFAULT 'function'"))
                    conn.execute(text("ALTER TABLE coding_problems ADD COLUMN IF NOT EXISTS function_signature JSON DEFAULT '{}'"))
                    conn.execute(text("ALTER TABLE coding_problem_versions ADD COLUMN IF NOT EXISTS execution_mode VARCHAR DEFAULT 'function'"))
                    conn.execute(text("ALTER TABLE coding_problem_versions ADD COLUMN IF NOT EXISTS function_signature JSON DEFAULT '{}'"))
                except Exception:
                    pass
                conn.commit()

            # Ensure organization_id is backfilled
            conn.execute(text("UPDATE users SET organization_id = 'org-sparkx-default' WHERE organization_id IS NULL OR organization_id = ''"))
            conn.execute(text("UPDATE jobs SET organization_id = 'org-sparkx-default' WHERE organization_id IS NULL OR organization_id = ''"))
            conn.execute(text("UPDATE candidates SET organization_id = 'org-sparkx-default' WHERE organization_id IS NULL OR organization_id = ''"))
            conn.commit()

            # Ensure organizations table exists and is reconciled
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS organizations (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    slug VARCHAR UNIQUE NOT NULL,
                    domain VARCHAR,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()

            # Ensure auxiliary tables exist (PostgreSQL and SQLite compatible)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS candidate_state_logs (
                    id VARCHAR PRIMARY KEY,
                    candidate_id VARCHAR NOT NULL,
                    dimension VARCHAR NOT NULL,
                    from_value VARCHAR,
                    to_value VARCHAR NOT NULL,
                    changed_by VARCHAR DEFAULT 'system',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS revoked_tokens (
                    id VARCHAR PRIMARY KEY,
                    token_jti VARCHAR UNIQUE NOT NULL,
                    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NOT NULL
                )
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS recruiter_invitations (
                    id VARCHAR PRIMARY KEY,
                    invite_code VARCHAR UNIQUE NOT NULL,
                    created_by VARCHAR,
                    recipient_email VARCHAR,
                    used_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()

            # Zero-Data-Loss Duplicate Audit & Unique Index Setup
            if str(engine.url).startswith("sqlite"):
                dup_rows = conn.execute(text("""
                    SELECT job_id, lower(email) as l_email, COUNT(*) as cnt, GROUP_CONCAT(id) as cids
                    FROM candidates
                    GROUP BY job_id, lower(email)
                    HAVING count(*) > 1
                """)).fetchall()
            else:
                dup_rows = conn.execute(text("""
                    SELECT job_id, lower(email) as l_email, COUNT(*) as cnt, string_agg(id, ',') as cids
                    FROM candidates
                    GROUP BY job_id, lower(email)
                    HAVING count(*) > 1
                """)).fetchall()

            if dup_rows:
                logger.warning("================================================================")
                logger.warning("RECONCILIATION REPORT: Existing duplicate candidate applications detected:")
                for d in dup_rows:
                    logger.warning(f"  Job {d[0]}, Email {d[1]}: {d[2]} applications (IDs: {d[3]})")
                logger.warning("All records preserved without data loss. Resolve duplicates before applying unique index.")
                logger.warning("================================================================")
            else:
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_job_email ON candidates(job_id, email)"))
                conn.commit()

            # Backfill user_id on candidates where matching user exists
            conn.execute(text("""
                UPDATE candidates
                SET user_id = (
                    SELECT id FROM users WHERE lower(users.email) = lower(candidates.email) LIMIT 1
                )
                WHERE user_id IS NULL AND EXISTS (
                    SELECT 1 FROM users WHERE lower(users.email) = lower(candidates.email)
                )
            """))
            conn.commit()

            # Deterministic backfill for existing candidate records without new states
            from workflow_contract import normalize_legacy_candidate_fields
            existing_cands = conn.execute(text("SELECT id, status, final_decision, interview_scheduled_at, coding_score FROM candidates")).fetchall()
            for row in existing_cands:
                cid, raw_status, raw_decision, has_slot, coding_sc = row[0], row[1], row[2], bool(row[3]), (row[4] or 0) > 0
                normalized = normalize_legacy_candidate_fields(raw_status, raw_decision, has_slot, coding_sc)
                conn.execute(text("""
                    UPDATE candidates 
                    SET stage = COALESCE(stage, :stg),
                        assessment_status = COALESCE(assessment_status, :ast),
                        interview_status = CASE 
                            WHEN interview_status IN ('not_scheduled', 'scheduled', 'in_progress', 'completed', 'cancelled') THEN interview_status
                            ELSE :ist 
                        END,
                        hiring_decision = COALESCE(hiring_decision, :dec)
                    WHERE id = :cid AND (stage IS NULL OR stage = '' OR hiring_decision IS NULL OR hiring_decision = '')
                """), {
                    "stg": normalized["stage"],
                    "ast": normalized["assessment_status"],
                    "ist": normalized["interview_status"],
                    "dec": normalized["hiring_decision"],
                    "cid": cid
                })
            conn.commit()

            # Reconcile organization records across all tenant-linked tables
            try:
                from services.organization_service import reconcile_existing_organizations
                with SessionLocal() as db_session:
                    reconcile_existing_organizations(db_session)
            except Exception as rec_err:
                logger.warning(f"Organization reconciliation notice: {rec_err}")

            # Idempotently seed system coding problems and MCQs
            try:
                from controllers.assessment_controller import AssessmentController
                with SessionLocal() as db_session:
                    AssessmentController.seed_system_coding_problems(db_session)
                    AssessmentController.seed_system_mcqs(db_session)
            except Exception as seed_err:
                logger.warning(f"System assessment seed notice: {seed_err}")
        except Exception as e:
            logger.warning(f"Schema check notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

