import os
import socket
import logging
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

def is_postgres_running(host: str = "127.0.0.1", port: int = 5432, timeout: float = 0.8) -> bool:
    """Fast non-blocking socket check to see if PostgreSQL is actively listening."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

# Smart Database Initialization
is_pg = DATABASE_URL.startswith("postgresql")

if is_pg and is_postgres_running("127.0.0.1", 5432):
    try:
        # Use 127.0.0.1 to avoid Windows IPv6 localhost resolution lag
        pg_url = DATABASE_URL.replace("localhost", "127.0.0.1")
        engine = create_engine(
            pg_url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        # Verify the connection; if the target database does not exist, fall back to SQLite
        try:
            with engine.connect() as _conn:
                pass
        except Exception as conn_err:
            logger.warning(f"PostgreSQL DB connection failed ({conn_err}). Falling back to local SQLite.")
            _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
            _SQLITE_PATH = os.path.join(_BACKEND_DIR, "sparkx_recruitment.db").replace('\\', '/')
            DATABASE_URL = f"sqlite:///{_SQLITE_PATH}"
            engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        logger.info("Connected to PostgreSQL database on 127.0.0.1:5432.")
    except Exception as err:
        logger.warning(f"PostgreSQL authentication failed ({err}). Falling back to local SQLite.")
        _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
        _SQLITE_PATH = os.path.join(_BACKEND_DIR, "sparkx_recruitment.db").replace("\\", "/")
        DATABASE_URL = f"sqlite:///{_SQLITE_PATH}"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    if is_pg:
        logger.info("PostgreSQL service is not active on port 5432. Automatically running on local SQLite database 'sparkx_recruitment.db'.")
    _BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    _SQLITE_PATH = os.path.join(_BACKEND_DIR, "sparkx_recruitment.db").replace("\\", "/")
    DATABASE_URL = f"sqlite:///{_SQLITE_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_schema_columns():
    """Ensure newly added columns exist in existing database tables."""
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
                    "resume_text": "TEXT"
                }
                for col, col_type in new_user_cols.items():
                    if col not in user_cols:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
                        conn.commit()

                # Jobs table columns
                job_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(jobs)")).fetchall()]
                new_job_cols = {
                    "company_name": "VARCHAR DEFAULT 'SparkX Technologies'",
                    "coding_difficulty": "VARCHAR DEFAULT 'Mid-Level'",
                    "assessment_pool": "JSON DEFAULT '{}'",
                    "ctc_type": "VARCHAR DEFAULT 'range'",
                    "ctc_min": "NUMERIC(10, 2)",
                    "ctc_max": "NUMERIC(10, 2)",
                    "ctc_currency": "VARCHAR DEFAULT 'INR'",
                    "ctc_period": "VARCHAR DEFAULT 'annual'",
                    "variable_pay_min": "NUMERIC(10, 2)",
                    "variable_pay_max": "NUMERIC(10, 2)"
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
                    "version": "INTEGER DEFAULT 1"
                }
                for col, col_type in new_cand_cols.items():
                    if col not in cand_cols:
                        conn.execute(text(f"ALTER TABLE candidates ADD COLUMN {col} {col_type}"))
                        conn.commit()

                # Ensure candidate_state_logs table exists
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
                dup_rows = conn.execute(text("""
                    SELECT job_id, lower(email) as l_email, COUNT(*) as cnt, GROUP_CONCAT(id) as cids
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
        except Exception as e:
            logger.warning(f"Schema check notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
