# 🏛️ ARETE — Where Talent Meets Intelligence
> **Enterprise AI Recruitment & Talent Intelligence Platform** • *Excellence, Virtue, and Evidence-Based Assessment*

ARETE is an enterprise-grade AI recruitment and talent intelligence operating system engineered with strict **Model-View-Controller (MVC) Architecture**, dual **Admin (Recruiter) vs. User (Candidate) Role-Based Access Control (RBAC)**, multi-tenant database isolation, PostgreSQL persistence, real-time 4-dimensional hiring management, adaptive AI video/voice interview assessments, continuous biometric proctoring telemetry, automated recruiter decision intelligence, and an interactive AI Job Description Builder.

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
│   ├── db_models.py             # SQLAlchemy ORM (OrganizationModel, JobModel, CandidateModel, SkillModel)
│   └── schemas.py               # Pydantic validation schemas (JobCreate, CandidateApply, etc.)
│
├── controllers/                 # [CONTROLLER] Business logic & AI orchestration
│   ├── job_controller.py        # Requisition matching, role requirements & question synthesis
│   ├── candidate_controller.py  # Pipeline summary, state transitions & batch actions
│   ├── resume_controller.py     # AI Resume Studio parsing, structuring & optimization
│   ├── copilot_controller.py    # ARETE Copilot intelligence assistant
│   └── interview_controller.py  # Adaptive cross-questioning & scorecard calculations
│
├── services/                    # [SERVICE LAYER] Specialized domain engines
│   ├── job_description_builder_service.py # Phase 4H AI Job Description Builder & Canonical Taxonomy
│   ├── recruiter_decision_assistant_service.py # Phase 4G Autonomous hiring decision intelligence
│   ├── resume_match_service.py  # Phase 4F Multimodal Resume Match Analyzer & Gap Detection
│   ├── skill_matching_service.py # 4-dimensional candidate-job skill verification
│   └── scheduling_service.py    # Self-service interview booking engine
│
├── views/                       # [VIEW] HTTP Presentation Layer (FastAPI Routers)
│   ├── job_views.py             # /api/jobs endpoints & JD builder routes
│   ├── candidate_views.py       # /api/candidates endpoints & pipeline stats
│   ├── resume_views.py          # /api/resumes endpoints & match analysis
│   ├── skill_views.py           # /api/skills endpoints & passport verification
│   └── interview_views.py       # /api/interview endpoints (telemetry & evaluations)
│
├── database.py                  # Strict Enterprise PostgreSQL Engine with Connection Pooling
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
│   │   ├── Candidate/           # Talent views: AI Resume Studio, Match Analyzer, Job Catalog, AI Interview Room
│   │   ├── layout/              # AppLayout, AppSidebar, CommandMenu
│   │   ├── auth/                # Luxury Split-Screen Login, Signup & Recovery Experience
│   │   └── ui/                  # AreteLogo, Primitives, Toast, Dialogs, CustomDropdown, FancyStudioDropdown
│   │
│   ├── context/
│   │   ├── RecruitmentContext.jsx # Global recruitment state & database sync
│   │   └── PageTransitionContext.jsx # View transitions engine
│   │
│   └── services/
│       ├── api.js               # Centralized Axios API service layer
│       └── proctorService.js    # Biometric proctoring telemetry & anomaly detection
```

---

## 👥 Role-Based Access Control (RBAC) & Modules

The platform enforces strict role and tenant boundaries:
- **👔 Recruiter (Enterprise Console)**:
  - **Command Center & Talent Pipeline**: 4-dimensional hiring management (Screening, Assessment, Interview, Evaluation, Decision) with bulk batch transitions.
  - **AI Job Description Builder (Phase 4H)**: Production-grade, zero-hardcoding generative JD architect integrated with database-persisted canonical skill taxonomies.
  - **Recruiter Decision Assistant (Phase 4G)**: Calibration rubrics, trade-off analysis, compensation matching, and anti-fraud audit logs.
  - **Assessment Studio & Blueprints**: Adaptive technical assessments, multi-language coding sandboxes, and question banks.
  - **Live Integrity HUD**: Real-time webcam telemetry, tab-switch detection, and anti-cheating analytics.
  - **Interview Availability Manager**: Automated slot creation and calendar synchronization.
- **🎓 Candidate (Talent Portal)**:
  - **AI Resume Studio & Match Analyzer**: Intelligent resume parsing, structuring, export, and alignment scoring against job requirements.
  - **Job Catalog & Applications**: 1-click laser-scan resume submission and real-time application tracking.
  - **AI Interview Room**: Adaptive live interview experience with AI voice evaluation and follow-up probing.
  - **Code Assessment Sandbox**: In-browser Monaco code editor with live test case execution.
  - **Verified Skill Passport**: Cryptographically backed skill credentials with evidence trails.
  - *Strict Boundary: Candidates cannot access recruiter pipelines, other candidates' dossiers, draft requisitions, or administrative tools.*

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (Installed and running on port 5432)

### 1. Database Configuration
Ensure PostgreSQL service is running and configure `.env` in `/backend`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sparkx_recruitment
```

### 2. Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
Interactive Swagger API documentation: **[http://localhost:8000/docs](http://localhost:8000/docs)**

### 3. Frontend Setup
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
- Strict multi-tenant isolation (`organization_id` scoping) across all jobs, candidates, and queries
- Rate-limited authentication and public application endpoints
- Role-based authorization guards on all API routes
