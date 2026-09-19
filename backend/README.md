# ⚡ SparkX AI Recruitment — FastAPI + PostgreSQL Backend

High-performance asynchronous Python backend with SQLAlchemy ORM, Pydantic data validation, automated resume parsing, adaptive cross-questioning, and database storage.

---

## 🚀 Quick Start in VS Code Terminal

### 1. In the `backend` folder, install requirements:
```powershell
pip install -r requirements.txt
```

### 2. Seed Database:
```powershell
python seed.py
```
> **Note on PostgreSQL vs SQLite:** If your PostgreSQL service on port 5432 is not running, the system will automatically and seamlessly use a local SQLite database (`sparkx_recruitment.db`). It will never crash or hang!

### 3. Start the Server:
On Windows PowerShell, use `python -m uvicorn` to avoid any PATH issues:
```powershell
python -m uvicorn main:app --reload --port 8000
```

### 4. Interactive API Documentation
Open **[http://localhost:8000/docs](http://localhost:8000/docs)** to test the live Swagger UI.
