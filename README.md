# 🏛️ ARETE — Where Talent Meets Intelligence
> **Enterprise AI Recruitment & Talent Intelligence Platform** • *Excellence, Virtue, and Evidence-Based Assessment*

ARETE is an enterprise-grade AI recruitment and talent intelligence operating system engineered with strict **Model-View-Controller (MVC) Architecture**, dual **Admin (Recruiter) vs. User (Candidate) Role-Based Access Control (RBAC)**, real-time 4-dimensional hiring management, adaptive AI video/voice interview assessments, continuous biometric proctoring telemetry, and automated recruiter decision intelligence.

---

## 💎 Brand Identity & Visual System

ARETE (*ἀρετή* — Greek for excellence and fulfilling one's highest potential) is built on an haute-horlogerie aesthetic:
- **Warm Parchment & Ivory Palette (Light Mode)**: Warm stone, soft cream latte surfaces, espresso typography, and restrained champagne accents.
- **Deep Espresso Obsidian Palette (Dark Mode)**: Pure dark roasted coffee surfaces (`#0F0E0D`, `#1A120E`), warm roast borders, and champagne gold highlights—avoiding generic pure black or neon blue SaaS templates.
- **Interlocking Ribbon Emblem**: Continuous Möbius geometric mark symbolizing continuous talent evaluation and human excellence.

---

## 🏛️ System Architecture: Model-View-Controller (MVC)

### 1. Backend Architecture (`/backend`)
```
backend/
├── models/                      # [MODEL] Database schemas, ORM entities & Pydantic models
│   ├── db_models.py             # SQLAlchemy ORM (JobModel, CandidateModel, SkillModel, IntegrityLogModel)
│   └── schemas.py               # Pydantic validation schemas (JobCreate, CandidateApply, etc.)
│
├── controllers/                 # [CONTROLLER] Business logic & AI orchestration
│   ├── job_controller.py        # Question bank synthesis & role requirements logic
│   ├── candidate_controller.py  # Resume matching algorithms & fraud detection
│   ├── copilot_controller.py    # ARETE Copilot intelligence assistant
│   └── interview_controller.py  # Adaptive cross-questioning & scorecard calculations
│
├── services/                    # [SERVICE LAYER] Specialized domain engines
│   ├── recruiter_decision_assistant_service.py # Autonomous hiring recommendation engine
│   ├── skill_matching_service.py # 4-dimensional candidate-job skill verification
│   └── scheduling_service.py    # Self-service interview booking engine
│
├── views/                       # [VIEW] HTTP Presentation Layer (FastAPI Routers)
│   ├── job_views.py             # /api/jobs endpoints & JSON serializers
│   ├── candidate_views.py       # /api/candidates endpoints
│   ├── skill_views.py           # /api/skills endpoints & passport verification
│   └── interview_views.py       # /api/interview endpoints (telemetry & evaluations)
│
├── database.py                  # PostgreSQL connection engine with SQLite auto-fallback
├── main.py                      # Application entry point mounting all MVC View Routers
└── seed.py                      # Database seeder script
```

### 2. Frontend Architecture (`/frontend`)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Recruiter/           # Admin views: Pipeline, Requisitions, Assessment Builder, Dossiers
│   │   │   └── workspace/       # Multi-tab Candidate Workspace (Dossier, Skills, Scorecards, Decision)
│   │   ├── Candidate/           # Talent views: Job Catalog, Applications, AI Interview Room, Skill Passport
│   │   ├── layout/              # AppLayout, AppSidebar, CommandMenu
│   │   ├── auth/                # Luxury Split-Screen Login, Signup & Recovery Experience
│   │   └── ui/                  # AreteLogo, Primitives, Toast, Dialogs, CustomDropdown
│   │
│   ├── context/
│   │   ├── RecruitmentContext.jsx # Global recruitment state & database sync
│   │   └── PageTransitionContext.jsx # Photon laser view transitions engine
│   │
│   └── services/
│       ├── api.js               # Centralized Axios API service layer
│       └── proctorService.js    # Biometric proctoring telemetry & anomaly detection
```

---

## 👥 Role-Based Access Control (RBAC)

The platform enforces strict role and data separation:
- **👔 Recruiter (Enterprise Console)**:
  - **Command Center & Talent Pipeline**: 4-dimensional hiring management (Screening, Assessment, Interview, Evaluation, Decision).
  - **Candidate Workspace**: In-depth dossier evaluation with AI Decision Assistant, calibrated rubrics, and fraud audits.
  - **Assessment Studio & Blueprints**: Adaptive technical assessments, coding sandboxes, and rubric authoring.
  - **Live Integrity HUD**: Real-time webcam telemetry, tab-switch detection, and anti-cheating analytics.
  - **Interview Availability Manager**: Automated slot creation and recruiter calendar synchronization.
- **🎓 Candidate (Talent Portal)**:
  - **Job Catalog & Applications**: 1-click laser-scan resume submission and real-time application tracking.
  - **AI Interview Room**: Adaptive live interview experience with AI voice evaluation and follow-up probing.
  - **Code Assessment Sandbox**: In-browser Monaco code editor with live unit test validation.
  - **Verified Skill Passport**: Cryptographically backed skill credentials with evidence trails.
  - *Strict Boundary: Candidates cannot access recruiter pipelines, other candidates' dossiers, or administrative tools.*

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (optional; automatically falls back to SQLite)

### 1. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 8000
```
Interactive Swagger API documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### 2. Frontend Setup
In a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔒 Security & Compliance
- **SOC-2 Type II Verified Architecture**
- Argon2 / bcrypt password hashing with strict JWT session rotation
- Rate-limited authentication and public application endpoints
- Role-based authorization guards on all API routes