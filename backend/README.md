# ⚡ SparkX AI Recruitment — FastAPI + PostgreSQL Backend

High-performance asynchronous Python backend with SQLAlchemy ORM, Pydantic data validation, automated resume parsing, adaptive cross-questioning, and PostgreSQL database storage.

---

## 🚀 Quick Setup

### 1. Install Dependencies
In the `backend` directory, run:
```bash
pip install -r requirements.txt
```

### 2. Configure Database (`.env`)
By default, `.env` is configured for PostgreSQL:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sparkx_recruitment
```
> **Smart Fallback:** If your local PostgreSQL instance is not started or configured yet, the backend will automatically and gracefully fall back to a local SQLite database (`sparkx_recruitment.db`), ensuring you never encounter crashes during local presentations or client demos!

### 3. Seed Database with SIH Roles & Candidates
```bash
python seed.py
```

### 4. Start Server
Run with Uvicorn (or Nodemon):
```bash
uvicorn main:app --reload --port 8000
```
Or with nodemon:
```bash
npx nodemon --watch . --ext py --exec "uvicorn main:app --reload --port 8000"
```

### 5. Interactive API Documentation
Open **[http://localhost:8000/docs](http://localhost:8000/docs)** for the interactive Swagger UI testing every endpoint live.
