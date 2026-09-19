# ⚡ SparkX AI — Intelligent Recruitment & Interview Automation
> **Smart India Hackathon 2026** • Team SparkX • *Smarter Hiring with Artificial Intelligence*

An enterprise AI recruitment platform designed with strict **Model-View-Controller (MVC) Architecture**, dual **Admin (Recruiter) vs. User (Candidate) Role Separation (RBAC)**, real-time adaptive voice/video interviews, biometric anti-cheating telemetry, and PostgreSQL/SQLite database persistence.

---

## 🏛️ System Architecture: Model-View-Controller (MVC)

### 1. Backend MVC Structure (`/backend`)
```
backend/
├── models/                  # [MODEL] Database schemas, ORM entities & Pydantic models
│   ├── __init__.py          # Model exports
│   ├── db_models.py         # SQLAlchemy ORM (JobModel, CandidateModel, IntegrityLogModel)
│   └── schemas.py           # Pydantic validation schemas (JobCreate, CandidateApply, etc.)
│
├── controllers/             # [CONTROLLER] Business logic & AI orchestration
│   ├── job_controller.py        # Question bank synthesis & role requirements logic
│   ├── candidate_controller.py  # Resume matching algorithms & fraud detection
│   └── interview_controller.py  # Adaptive cross-questioning & scorecard calculations
│
├── views/                   # [VIEW] HTTP Presentation Layer (FastAPI Routers)
│   ├── job_views.py         # /api/jobs endpoints & JSON serializers
│   ├── candidate_views.py   # /api/candidates endpoints
│   └── interview_views.py   # /api/interview endpoints (telemetry & evaluations)
│
├── database.py              # PostgreSQL connection engine with SQLite auto-fallback
├── main.py                  # Application entry point mounting all MVC View Routers
└── seed.py                  # Database seeder script
```

### 2. Frontend MVC Structure (`/src`)
```
src/
├── models/                  # [MODEL] API services, data normalizers, and mock presets
│   ├── api.js               # HTTP client connecting to backend controllers
│   └── mockData.js          # Pre-loaded baseline datasets & prompt templates
│
├── controllers/             # [CONTROLLER] State management & business logic
│   ├── RecruitmentContext.jsx  # Global controller managing data flow & RBAC
│   ├── aiRecruiterService.js  # Adaptive response evaluator
│   └── proctorService.js      # Biometric telemetry & focus tracker controller
│
└── views/ (components)      # [VIEW] UI Presentations for Admin vs. User
    ├── Recruiter/           # Admin views: Pipeline, Job Creator, Dossier Scorecards
    ├── Candidate/           # User views: Job Catalog, Voice Interview, Code Sandbox
    ├── Proctor/             # Biometric radar HUD & telemetry audit stream
    └── Navbar.jsx           # Role switcher toggle & Theme toggle (Dark/Light)
```

---

## 👥 Role-Based Access Control (RBAC)

The application enforces complete visual and functional separation:
- **👔 Recruiter (Admin Portal)**:
  - Accessible via the **Recruiter Mode** toggle.
  - Candidate Pipeline with AI Match scores, fraud discrepancy flags, and evidence dossiers.
  - Active Job Openings manager and new job publisher with automated question generation.
  - Live anti-cheating audit telemetry stream.
- **🎓 Candidate (User Portal)**:
  - Accessible via the **Candidate Mode** toggle.
  - Browse available roles and apply with 1-click laser-scan resume parser.
  - Real-time webcam AI interview with adaptive follow-ups.
  - Live code challenge console with test runner.
  - Personalized skill-gap roadmap and feedback report.
  - *Restricted: Cannot see recruiter pipelines, other applicants, or admin tools.*

---

## 🌗 Dark & Light Mode
- Interactive toggle in the top-right navbar (Sun ☀️ / Moon 🌙).
- **Dark Mode**: High-tech cyber aesthetic, glassmorphism, and neon telemetry reticles.
- **Light Mode**: Crisp, enterprise SaaS interface with high-contrast typography.

---

## 🚀 How to Run Locally

### Start Backend:
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```
Interactive Swagger Documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### Start Frontend:
In a second terminal:
```powershell
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!