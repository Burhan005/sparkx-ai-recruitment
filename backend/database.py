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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
