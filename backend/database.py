import os
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

# Connect to PostgreSQL with fallback to SQLite for local ease
try:
    if DATABASE_URL.startswith("postgresql"):
        # Test engine creation
        engine = create_engine(
            DATABASE_URL, 
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        # Attempt immediate connection to verify PostgreSQL is running
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
    else:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
except Exception as e:
    logger.warning(
        f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite database 'sparkx_recruitment.db'."
    )
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
