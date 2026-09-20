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
        logger.info("Connected to PostgreSQL database on 127.0.0.1:5432.")
    except Exception as err:
        logger.warning(f"PostgreSQL authentication failed ({err}). Falling back to local SQLite.")
        DATABASE_URL = "sqlite:///./sparkx_recruitment.db"
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    if is_pg:
        logger.info("PostgreSQL service is not active on port 5432. Automatically running on local SQLite database 'sparkx_recruitment.db'.")
    DATABASE_URL = "sqlite:///./sparkx_recruitment.db"
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
                    "assessment_pool": "JSON DEFAULT '{}'"
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
                    "coding_results": "JSON DEFAULT '{}'"
                }
                for col, col_type in new_cand_cols.items():
                    if col not in cand_cols:
                        conn.execute(text(f"ALTER TABLE candidates ADD COLUMN {col} {col_type}"))
                        conn.commit()
        except Exception as e:
            logger.warning(f"Schema check notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
