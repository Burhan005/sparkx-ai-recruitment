# ARETE — Complete Existing UI/UX Transformation Program
## Step 0: Read-Only Screen Inventory & Transformation Roadmap

> **Document Status**: Complete & Authoritative  
> **Target Platform**: ARETE Talent Intelligence & AI Recruitment Platform (formerly SparkX)  
> **Audience**: Engineering, Product & Design  
> **Inspection Mode**: Read-Only Architecture & Visual Inventory (Zero Source Code Modified)  
> **Date**: October 2026  

---

## 1. Executive Summary & Application Architecture

ARETE is an enterprise-grade, AI-native talent intelligence and recruitment platform built on a decoupled modern architecture:
- **Frontend**: React 18 SPA bundled with Vite, styled with Tailwind CSS, utilizing React Router v6, Lucide icons, custom canvas shaders, and Monaco Editor.
- **Backend**: FastAPI (Python 3.11+) implementing an MVC pattern (Models, Views/Routers, Controllers, Services), backed by PostgreSQL / SQLite via SQLAlchemy with real-time AI heuristics, code sandboxing, and proctoring telemetry.
- **Theme Foundation**: Warm luxury espresso palette (`#0F0E0D`, `#2B201A`, `#423229`, `#F59E0B`) in Dark Mode; soft parchment/cream (`#F7F4EF`, `#FDFBF7`, `#E8DFD8`, `#C27803`) in Light Mode. Strict avoidance of cold slate grays and stark `#000000` / `#FFFFFF` active fills.

This document establishes the comprehensive, code-grounded inventory of every screen, layout, modal, and drawer in the ARETE codebase, cataloging exact routes, access guards, component hierarchies, visual conditions, animation dependencies, and regression risks.

---

## 2. Complete UI Screen Inventory (31 Discovered Surfaces)

### Legend: Implementation Status
- **Implemented & Discoverable**: Fully routed, backed by live API contracts, active in navigation.
- **Partially Implemented**: Accessible via deep link or modal trigger; features minor placeholder states or partial mobile adaptivity.
- **Referenced by Route but Secondary**: Parameterized sub-route or tab variation handled conditionally within a parent container.
- **Unclear / Runtime Verification**: Operational status depends on specific environment/session states (e.g., active webcam streams, live sandbox runner).
- **Legacy / Unreferenced**: Present in repository but superseded by modern layout components.

---

### Category A: Public & Authentication Surfaces

#### Screen 01: Public Marketing & Enterprise Landing Page
- **Actual Route**: `/home`, `/`, `/about`, `/features`, `/how-it-works`, `/contact`
- **User Role & Access**: Public / Unauthenticated (`<RequirePublic>` not enforced, accessible to all; authenticated users can access or navigate via CTA).
- **Main Component & Sources**: 
  - `frontend/src/components/public/LandingPage.jsx` (~1,154 lines)
  - `frontend/src/components/public/PublicNavbar.jsx` (~333 lines)
  - `frontend/src/components/public/HomeExtras.jsx` (~1,035 lines)
  - `frontend/src/components/public/LandingCursor.jsx` (~194 lines)
  - `frontend/src/components/public/ScrollReveal.jsx` (~59 lines)
  - `frontend/src/components/ui/AreteLogo.jsx` (~284 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Multi-section enterprise presentation (Hero, Quantum Engine, Sandbox Preview, Live Proctoring HUD, Interactive Feature Matrix, ROI Calculator, Interactive Terminal, Contact Form with mock dispatch, Smooth Anchors).
- **Current UI Condition & Weaknesses**: Rich micro-interactions and high animation fidelity. However:
  1. High DOM density creates potential scroll stutter on low-power devices.
  2. Some badge borders still use legacy amber opacity tokens (`amber-500/20`) that border on high saturation.
  3. Feature modal overlay uses generic backdrop blur without consistent chamfered card styling.
- **Light/Dark Support**: Partial — defaults to dark aesthetic (`#0F0E0D`), with light-mode overrides in specific subcomponents.
- **Responsive Behavior**: Stacked layout on `<768px`; mobile navigation drawer in `PublicNavbar.jsx`.
- **Animations & Visual Effects**: Custom magnetic cursor (`LandingCursor`), `ScrollReveal` IntersectionObserver, `TypingTerminal` typewriter loops, `TiltCard` 3D perspective transforms, gradient dividers, photon laser scroll progress bar.
- **Shared Components**: `AreteLogo`, `PublicNavbar`.
- **Transformation Scope**: Align marketing card borders with refined warm stone/espresso tokens; smooth modal exit transitions; refine contact response toast.
- **Dependencies & Regression Risks**: High animation complexity; must not disrupt `ScrollReveal` observer unmount logic or cursor canvas.
- **Implementation Priority**: Medium (Phase 6).

---

#### Screen 02: Executive Authentication — Sign In
- **Actual Route**: `/login`, `/signin`
- **User Role & Access**: Public / Anonymous only (`<RequirePublic>` redirects authenticated users to `/recruiter` or `/jobs`).
- **Main Component & Sources**: 
  - `frontend/src/components/auth/LoginScreen.jsx` (`mode="signin"`, ~1,111 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Dual-role sign in (Candidate vs. Recruiter toggle), JWT issuance (`POST /api/auth/login`), remember session, password peek toggle, quick role switcher demo helper, error handling.
- **Current UI Condition & Weaknesses**: Recently elevated with Cinzel typography and warm espresso cards. Minor remaining weaknesses:
  1. Role toggle tab active indicator transitions abruptly on some viewport widths.
  2. Input focus rings occasionally use default browser outline before tailwind `focus:ring-brand-500/25` kicks in.
- **Light/Dark Support**: Full support with dynamic warm parchment (light) and deep roasted espresso (dark).
- **Responsive Behavior**: Centered floating card with responsive padding (`px-4 sm:px-6`); stacked layout on mobile.
- **Animations & Visual Effects**: `login-telemetry-glow`, `login-scan-pulse`, floating particles, smooth error shake, smooth tab transition.
- **Shared Components**: `AreteLogo`, `Toast`, `LandingCursor`.
- **Transformation Scope**: Micro-interaction polish on inputs and keycaps; unify button active states.
- **Dependencies & Regression Risks**: Auth token storage (`localStorage.setItem('auth_token', ...)`) and `RecruitmentContext` synchronization.
- **Implementation Priority**: Completed in previous pass / Low maintenance.

---

#### Screen 03: Executive Authentication — Registration & Profile Onboarding
- **Actual Route**: `/register`, `/signup`
- **User Role & Access**: Public / Anonymous only (`<RequirePublic>`).
- **Main Component & Sources**: 
  - `frontend/src/components/auth/LoginScreen.jsx` (`mode="signup"`, ~1,111 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Candidate multi-field registration with instant resume parsing (`POST /api/auth/parse-resume`), skills tagger, experience year selector, recruiter admin authorization code verification.
- **Current UI Condition & Weaknesses**: 
  1. Long scrolling form inside candidate registration tab can push submit buttons below the fold on smaller laptop displays (1366x768).
  2. Resume drag-and-drop zone lacks distinct empty vs. loaded file preview animations.
- **Light/Dark Support**: Full dual-theme support.
- **Responsive Behavior**: Responsive scrollable container within centered modal card.
- **Animations & Visual Effects**: Password strength meter bar transitions, resume parse spinner, tab cross-fades.
- **Shared Components**: `AreteLogo`, `Toast`.
- **Transformation Scope**: Convert candidate multi-step registration into sleek progressive disclosure or accordion sections.
- **Dependencies & Regression Risks**: Resume parsing API contract (`/api/auth/parse-resume`) and multipart form payloads.
- **Implementation Priority**: Medium (Phase 6).

---

#### Screen 04: Authentication — Password Recovery / Reset
- **Actual Route**: `/forgot-password`
- **User Role & Access**: Public / Anonymous only (`<RequirePublic>`).
- **Main Component & Sources**: 
  - `frontend/src/components/auth/LoginScreen.jsx` (`mode="forgot"`, ~1,111 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Two-step password recovery: Step 1 initiates reset code (`POST /api/auth/forgot-password`); Step 2 verifies code and applies new password (`POST /api/auth/reset-password`).
- **Current UI Condition & Weaknesses**: Functional and styled with espresso card, but Step 2 verification code field could benefit from a segmented 6-digit PIN input rather than a standard single text box.
- **Light/Dark Support**: Full dual-theme support.
- **Responsive Behavior**: Centered responsive card.
- **Animations & Visual Effects**: Step transition fade, validation glow.
- **Shared Components**: `AreteLogo`, `Toast`.
- **Transformation Scope**: Enhance 6-digit keycap OTP input styling.
- **Dependencies & Regression Risks**: Password hash reset endpoint contract.
- **Implementation Priority**: Low (Phase 6).

---

### Category B: Shared Application Shell & System Overlays

#### Screen 05: Enterprise Application Shell (Chrome & Layout Container)
- **Actual Route**: Authenticated route wrapper (`<AppLayout />` wrapping all `/recruiter/*`, `/jobs`, `/interview/*`, etc.)
- **User Role & Access**: Authenticated Candidates and Recruiters (`<RequireAuth>`).
- **Main Component & Sources**: 
  - `frontend/src/components/layout/AppLayout.jsx` (~181 lines)
  - `frontend/src/components/layout/GlobalScrollProgress.jsx` (~97 lines)
  - `frontend/src/components/ui/CosmicThemeWave.jsx` (~134 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Houses desktop sidebar, mobile header with burger menu, dedicated `#main-scroll-container`, global keyboard shortcuts (`Cmd/Ctrl+K`, `Cmd/Ctrl+J`), global offline interceptor.
- **Current UI Condition & Weaknesses**: Robust layout structure. Weaknesses:
  1. Mobile top header bar height (56px) needs tighter vertical alignment with the brand emblem.
  2. Scrollbar in `#main-scroll-container` uses generic thin scrollbar; needs bespoke espresso-tinted thumb track.
- **Light/Dark Support**: Full dual-theme support (`bg-[#F7F4EF]` light / `bg-[#0F0E0D]` dark).
- **Responsive Behavior**: Desktop sidebar fixed; mobile header sticks to top; mobile drawer triggers smoothly.
- **Animations & Visual Effects**: `CosmicThemeWave` full-screen radial theme expansion; `GlobalScrollProgress` photon beam at top.
- **Shared Components**: `AppSidebar`, `CommandMenu`, `AIConfigModal`, `AskSparkxDrawer`, `AreteLogo`.
- **Transformation Scope**: Refine mobile top bar; custom espresso scrollbar tracks; enhance content area subtle background gradients.
- **Dependencies & Regression Risks**: High risk: touches the root DOM wrapper for every single authenticated screen.
- **Implementation Priority**: High (Phase 1).

---

#### Screen 06: Executive Navigation Sidebar
- **Actual Route**: Shared across all authenticated pages.
- **User Role & Access**: Role-conditional (renders recruiter sections for recruiters, candidate sections for candidates).
- **Main Component & Sources**: 
  - `frontend/src/components/layout/AppSidebar.jsx` (~973 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Collapsible state (`isCollapsed`), interactive drag-resizing (240px to 460px with persistence), role-aware navigation badges (live candidate counts, top matches, proctor alerts), executive user dock with role badge, SOC-2 compliance indicator, quick sign-out trigger.
- **Current UI Condition & Weaknesses**: Recently elevated with 72px header, Cinzel serif typography, and chamfered icon pedestals (`#2E2017`). Current status: Highly polished; needs verification across extreme collapsed states and tablet landscape viewports.
- **Light/Dark Support**: Full dual-theme support (`#FAF8F5` light / `#150F0D` dark).
- **Responsive Behavior**: Drag-resizable on desktop; slide-out drawer on `<1024px`.
- **Animations & Visual Effects**: Width transition `transition-all duration-300`, keystone laser bar on active route, subtle radar pulse dot on live items.
- **Shared Components**: `AreteLogo`, `SignOutModal`.
- **Transformation Scope**: Minor tooltip alignment in collapsed mode; ensure active keystone bar stays crisp during window resize.
- **Dependencies & Regression Risks**: Route matching logic in `isItemActive()` handles exact matches, query params, and wildcard sub-routes.
- **Implementation Priority**: Completed in previous pass / Phase 1 verification.

---

#### Screen 07: Global Executive Command Palette (`Ctrl+K`)
- **Actual Route**: Modal overlay accessible anywhere via keyboard shortcut or search trigger.
- **User Role & Access**: Authenticated Users.
- **Main Component & Sources**: 
  - `frontend/src/components/layout/CommandMenu.jsx` (~312 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Fuzzy search across all navigation routes, direct candidate searches, job requisitions, theme toggling, AI config launcher, sign-out command.
- **Current UI Condition & Weaknesses**: Clean cmdk implementation. Weaknesses:
  1. Group headers ("Navigation", "Actions", "Candidates") have slight visual crowding.
  2. Selected item uses standard highlight rather than executive espresso chamfered pill.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Modal dialog centered on screen; full-width bottom sheet on mobile.
- **Animations & Visual Effects**: `modal-enter` scale and backdrop blur fade.
- **Shared Components**: `Primitives` (Modal, Input), `CustomDropdown`.
- **Transformation Scope**: Elevate item selection with warm espresso highlight, gold arrow keycaps, and categorized iconography.
- **Dependencies & Regression Risks**: Global keyboard event listeners; must not trap keys when nested modals are open.
- **Implementation Priority**: High (Phase 1).

---

#### Screen 08: ARETE AI Copilot Drawer ("Ask SparkX" / `Ctrl+J`)
- **Actual Route**: Global slide-over drawer accessible from any authenticated screen.
- **User Role & Access**: Authenticated Candidates and Recruiters.
- **Main Component & Sources**: 
  - `frontend/src/components/ai/AskSparkxDrawer.jsx` (~924 lines)
  - `frontend/src/services/aiRecruiterService.js` (~150 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Context-aware recruitment copilot; answers queries about active candidate dossiers, job requirements, interview questions, platform telemetry; suggests next actions; streams responses.
- **Current UI Condition & Weaknesses**: Highly functional. Weaknesses:
  1. Message bubbles use generic chat bubble styling; candidate and recruiter responses could use structured card-based rendering with executive typography.
  2. Markdown rendering within responses lacks customized table and code block styling.
  3. Suggested prompt chips have high border contrast.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Right drawer width 440px on desktop; full screen on `<640px`.
- **Animations & Visual Effects**: `slide-in-right` keyframe, typing shimmer, glowing AI orb header icon.
- **Shared Components**: `Primitives` (Drawer, Button, Input).
- **Transformation Scope**: Restyle message streams with bespoke espresso cards; format tabular AI responses with micro-data grids; add copy-to-clipboard micro-interactions.
- **Dependencies & Regression Risks**: Backend copilot route `/api/copilot/chat` and active context extraction.
- **Implementation Priority**: Medium (Phase 2).

---

#### Screen 09: AI Engine Configuration Modal
- **Actual Route**: Modal overlay triggered from Command Menu, Sidebar, or Copilot.
- **User Role & Access**: Authenticated Recruiters / Administrators.
- **Main Component & Sources**: 
  - `frontend/src/components/AIConfigModal.jsx` (~264 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Switches AI providers (Gemini, OpenAI, Anthropic, Local NLP), inputs API keys, tests provider latency and connection status (`GET /api/copilot/status`).
- **Current UI Condition & Weaknesses**: Functional settings dialog. Weaknesses:
  1. Provider selection radio tiles look standard; lack tactile hardware-switch appearance.
  2. Latency indicators look rudimentary.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Centered responsive dialog (`max-w-md`).
- **Animations & Visual Effects**: Modal backdrop fade and scale-in.
- **Shared Components**: `Primitives` (Modal, Button, Input).
- **Transformation Scope**: Refine provider selector cards into chamfered hardware tiles with real-time ping indicator LEDs.
- **Dependencies & Regression Risks**: Local storage encryption/storage of API key configuration.
- **Implementation Priority**: Low (Phase 6).

---

#### Screen 10: Sign Out Confirmation Modal
- **Actual Route**: Triggered from Sidebar user dock or Command Menu.
- **User Role & Access**: Authenticated Users.
- **Main Component & Sources**: 
  - `frontend/src/components/layout/SignOutModal.jsx` (~111 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Warns user of session termination; terminates JWT tokens; clears cached candidate state; redirects cleanly to `/login`.
- **Current UI Condition & Weaknesses**: Clean minimal modal. Weaknesses:
  1. Primary sign-out button uses stark red/rose fill; should use refined deep burgundy/espresso accent to avoid jarring visual break.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Centered modal (`max-w-sm`).
- **Animations & Visual Effects**: `modal-enter` spring animation.
- **Shared Components**: `Primitives` (Modal, Button).
- **Transformation Scope**: Subdue danger button styling to luxury dark garnet/espresso tone.
- **Dependencies & Regression Risks**: Session destruction and route redirection.
- **Implementation Priority**: Low (Phase 6).

---

#### Screen 11: Backend Offline / Disconnected Interceptor
- **Actual Route**: Full-viewport overlay rendered when API health check fails.
- **User Role & Access**: All Users.
- **Main Component & Sources**: 
  - `frontend/src/components/layout/AppLayout.jsx` (`OfflineScreen`, L21-62)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Intercepts failed network connection; displays CLI troubleshooting commands (`uvicorn main:app`, `python seed.py`); offers one-click retry trigger.
- **Current UI Condition & Weaknesses**: Highly informative for developers. Weaknesses:
  1. Visual styling is developer-centric; for enterprise users it should present a dignified telemetry reconnect card with automated retry countdown.
- **Light/Dark Support**: Hardcoded dark background (`#0F0E0D`).
- **Responsive Behavior**: Responsive centered stack.
- **Animations & Visual Effects**: Pulse animation on status beacon.
- **Transformation Scope**: Polish terminal block typography with JetBrains Mono; add auto-reconnect pulsing radar.
- **Dependencies & Regression Risks**: `syncWithDatabase()` retry logic in `RecruitmentContext`.
- **Implementation Priority**: Low (Phase 6).

---

#### Screen 12: 404 Route Catch-All Screen
- **Actual Route**: `*` (Any unmatched URL).
- **User Role & Access**: All Users.
- **Main Component & Sources**: 
  - `frontend/src/components/ui/NotFoundScreen.jsx` (~53 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Captures invalid deep links; displays 404 error code; provides "Return to Dashboard" redirect.
- **Current UI Condition & Weaknesses**: Barebones screen with basic text and standard button. Lacks brand iconography, decorative telemetry lines, or helpful deep-link suggestions.
- **Light/Dark Support**: Basic support.
- **Responsive Behavior**: Centered text block.
- **Animations & Visual Effects**: None currently.
- **Shared Components**: `Button`.
- **Transformation Scope**: Rebuild with Cinzel "404" monument typography, subtle radar background rings, and role-aware return button.
- **Dependencies & Regression Risks**: Navigation state fallbacks.
- **Implementation Priority**: Low (Phase 6).

---

### Category C: Recruiter-Facing Operations & Workflows

#### Screen 13: Recruiter Talent Pipeline & Candidate Command Center
- **Actual Route**: `/recruiter`, `/recruiter/pipeline`, `/recruiter?filter=top`, `/recruiter?filter=alerts`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/CandidatePipeline.jsx` (Candidates Tab, ~2,492 lines)
  - `frontend/src/components/Recruiter/workspace/CandidateWorkspace.jsx` (Dossier Drawer, ~408 lines)
  - `frontend/src/components/Recruiter/CandidateComparisonModal.jsx` (~941 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Core operational hub of ARETE. Features:
  - Interactive toolbar with segmented entity switcher (Candidates vs. Active Requisitions).
  - Multi-dimensional filters (Stage, Integrity Risk, Assessment Status, Interview Status, Search).
  - Dual viewing modes: Kanban Stage Board (Screening, Assessment, Interview, Review, Selected, Rejected) vs. Dense Enterprise List View.
  - Multi-candidate checkbox selection for Batch Rejection, Batch Export, and Side-by-Side Comparison Matrix.
  - Deep candidate row/card click opening Candidate Workspace drawer.
- **Current UI Condition & Weaknesses**: Toolbar was recently upgraded with frosted glass and espresso filter pills. Remaining weaknesses:
  1. Kanban column headers lack subtle count badges aligned with column borders.
  2. Kanban cards have slight visual inconsistency in tag density (some cards have 6 tags, overflowing card height).
  3. Table row hover in List view needs smoother transition; checkboxes need bespoke espresso check styling instead of default browser controls.
- **Light/Dark Support**: Full support (`#F7F4EF` light / `#0F0E0D` dark).
- **Responsive Behavior**: Horizontal scrolling on Kanban board for screens `<1280px`; dense list view responsive down to tablet.
- **Animations & Visual Effects**: Smooth `animate-fade-in duration-300` on tab switches, drag-and-drop animations, card hover elevation.
- **Shared Components**: `CustomDropdown`, `Primitives` (Button, Badge, StatusBadge, SearchInput), `AreteLogo`.
- **Transformation Scope**: Kanban card typography hierarchy refinement; status badge standardization; custom checkbox controls; refined empty states per column.
- **Dependencies & Regression Risks**: Extremely high risk: candidate stage transitions (`updateCandidateWorkflow`), batch actions, and selection state management.
- **Implementation Priority**: Phase 3 (Immediate follow-up after Shell).

---

#### Screen 14: Recruiter Active Requisitions / Requisition Management
- **Actual Route**: `/recruiter?tab=jobs`, `/recruiter/jobs/:jobId`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/CandidatePipeline.jsx` (Jobs Tab, ~2,492 lines)
  - `frontend/src/components/Recruiter/JobCreatorModal.jsx` (~1,381 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Requisition grid displaying all active, draft, and closed jobs; applicant counts; compensation ranges formatted in local currency; required skills chips; one-click action to view candidates filtered by job; create new job button.
- **Current UI Condition & Weaknesses**:
  1. Job cards in grid view have inconsistent vertical heights when optional compensation fields are present vs. missing.
  2. "Edit Job" and "Duplicate Job" menus use standard dropdown rather than sleek context action bar.
  3. Filter chips for Job Status (Active, Draft, Archived) are positioned awkwardly above the search bar.
- **Light/Dark Support**: Full dual-theme support.
- **Responsive Behavior**: Auto-responsive 1, 2, or 3-column CSS grid.
- **Animations & Visual Effects**: Card hover lift, fade-in on filter change.
- **Shared Components**: `Primitives` (Card, Button, Badge), `JobCreatorModal`.
- **Transformation Scope**: Standardize requisition card heights with uniform header/footer anchoring; elevate salary range presentation with mini compensation badge; refine requisition filter toolbar.
- **Dependencies & Regression Risks**: Job status mutations (`updateJobStatus`), applicant count synchronization, route navigation with query params.
- **Implementation Priority**: Phase 3.

---

#### Screen 15: Requisition Studio & Job Creation Modal
- **Actual Route**: Modal dialog opened from Requisitions tab (`JobCreatorModal`).
- **User Role & Access**: Recruiter only.
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/JobCreatorModal.jsx` (~1,381 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Multi-section comprehensive requisition builder:
  - Role details (Title, Department, Location, Employment Type).
  - Compensation engine (Salary min/max, currency, period, variable pay).
  - Skill requirements with weightings and category tags.
  - Linked Technical Assessment selector (selects coding challenge or problem pool).
  - Linked AI Interview question pool & rubric configuration.
  - Form validation and backend persistence (`POST /api/jobs`, `PUT /api/jobs/:id`).
- **Current UI Condition & Weaknesses**:
  1. Very dense form content; feels overwhelming without distinct section step navigation or sticky tab headers.
  2. Skill addition tags use bright blue/purple badges inconsistent with warm espresso identity.
  3. Assessment linkage preview is text-only without visual problem card snippet.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Modal dialog with internal scrollable body (`max-w-3xl`).
- **Animations & Visual Effects**: `modal-enter` zoom, tag pop-in.
- **Shared Components**: `Primitives` (Modal, Input, Textarea, Button), `CustomDropdown`.
- **Transformation Scope**: Restyle form into 3 clear progressive tabs (1. Role & Compensation, 2. Skill Architecture, 3. Assessment & Interview Blueprint); replace cool badges with warm stone/amber tags.
- **Dependencies & Regression Risks**: Complex job schema (`backend/schemas.py::JobCreateSchema`); must preserve all required and optional payload fields.
- **Implementation Priority**: Phase 3.

---

#### Screen 16: Multi-Candidate Comparison Matrix
- **Actual Route**: Modal dialog triggered when 2-3 candidates are checked in Candidate Pipeline (`CandidateComparisonModal`).
- **User Role & Access**: Recruiter only.
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/CandidateComparisonModal.jsx` (~941 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Side-by-side comparative analysis of up to 3 candidates across:
  - Match scores and skill match breakdown (Must-have vs. Good-to-have).
  - Coding assessment benchmarks and execution runtimes.
  - AI Interview scores, communication ratings, and integrity telemetry.
  - Direct comparative decision actions (Advance, Schedule, Reject).
- **Current UI Condition & Weaknesses**:
  1. Column headers for candidates become cramped on screens below 1440px.
  2. Differing skill lists between candidates create misaligned table rows.
  3. Metric comparison bars use varying color saturations that clash with the espresso theme.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Horizontal scroll matrix on narrower viewports.
- **Animations & Visual Effects**: Bar fill animations, modal entrance.
- **Shared Components**: `Primitives` (Modal, Button, Badge), `CompetencyRadar`.
- **Transformation Scope**: Synchronize comparative row heights with fixed table layout; elevate comparative progress bars with champagne bronze fills; add executive summary banner at top highlighting highest match.
- **Dependencies & Regression Risks**: Comparison data computation (`/api/skills/match/batch` or local normalization); preserve stage advance actions.
- **Implementation Priority**: Phase 3.

---

#### Screen 17: Candidate Workspace — Executive Dossier Drawer & Sub-Tabs
- **Actual Route**: `/recruiter/candidates/:candidateId` or slide-over drawer inside `/recruiter`.
- **User Role & Access**: Recruiter only.
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/workspace/CandidateWorkspace.jsx` (~408 lines)
  - `frontend/src/components/Recruiter/workspace/CandidateWorkspaceHeader.jsx` (~293 lines)
  - `frontend/src/components/Recruiter/workspace/CandidateOverviewTab.jsx` (~1,156 lines)
  - `frontend/src/components/Recruiter/workspace/CandidateScorecardTab.jsx` (~770 lines)
  - `frontend/src/components/Recruiter/workspace/CompetencyRadar.jsx` (~527 lines)
  - `frontend/src/components/Recruiter/workspace/AssessmentEvidenceTab.jsx` (~463 lines)
  - `frontend/src/components/Recruiter/workspace/InterviewEvidenceTab.jsx` (~232 lines)
  - `frontend/src/components/Recruiter/workspace/SkillIntelligenceTab.jsx` (~406 lines)
  - `frontend/src/components/Recruiter/workspace/IntegrityAuditTab.jsx` (~100 lines)
  - `frontend/src/components/Recruiter/workspace/AuditTimelineTab.jsx` (~91 lines)
  - `frontend/src/components/Recruiter/workspace/RecruiterDecisionTab.jsx` (~953 lines)
  - `frontend/src/components/Recruiter/workspace/ResumeViewerModal.jsx` (~191 lines)
  - `frontend/src/components/Recruiter/workspace/ScheduleInterviewModal.jsx` (~183 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: The most feature-rich screen in the entire platform. Renders a full executive dossier with 8 sub-tabs:
  1. **Overview**: Executive summary, contact data, resume snippet, key competencies, salary expectations vs. budget analysis.
  2. **Scorecard**: Weighted scorecard, radar chart (`CompetencyRadar`), domain evaluations.
  3. **Assessment Evidence**: Code submission viewer, test case pass rate, syntax efficiency score, anti-plagiarism logs.
  4. **Interview Evidence**: AI interview question transcripts, speech clarity metrics, candidate response quotes.
  5. **Skill Intelligence**: Deep relational skill matching matrix, verified vs. claimed skills, skill gap badges.
  6. **Integrity Audit**: Real-time webcam proctoring flags, focus loss logs, multiple face detection events, browser tab switch events.
  7. **Audit Timeline**: Chronological event log of application submission, assessment completion, interview booking, recruiter notes.
  8. **Recruiter Decision**: Stage advancement controls, offer generation, structured rejection modal with feedback categorization.
- **Current UI Condition & Weaknesses**:
  1. Tab bar inside workspace has 8 items; on medium viewports it overflows or wraps awkwardly.
  2. `CompetencyRadar` canvas colors need exact alignment with champagne amber (`#C27803` / `#F59E0B`) and warm stone.
  3. Header action buttons (Advance, Reject, Schedule) compete visually for attention.
  4. Code viewer in `AssessmentEvidenceTab` lacks dark-espresso bezel integration.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Large drawer / full-screen overlay with internal scroll containers.
- **Animations & Visual Effects**: Drawer entrance, radar polygon draw-in, animated score counters, tab fade-in.
- **Shared Components**: `Primitives` (Drawer, Tabs, Button, Badge, Modal), `CompetencyRadar`, `ResumeViewerModal`.
- **Transformation Scope**: Transform sub-tab bar into a sleek segmented pill bar with horizontal auto-scroll; harmonize header hierarchy with clear primary decision button; style code inspection snippets; elevate radar chart palette.
- **Dependencies & Regression Risks**: High risk: multiple API mutation endpoints (stage changes, recruiter notes, interview scheduling).
- **Implementation Priority**: Phase 3.

---

#### Screen 18: Live Integrity HUD & Remote Proctoring Monitor
- **Actual Route**: `/recruiter/proctor`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Proctor/ProctorLiveMonitor.jsx` (~334 lines)
  - `frontend/src/services/proctorService.js` (~80 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Real-time telemetry monitoring of ongoing candidate assessments:
  - Live active session list with status beacons.
  - Incident severity telemetry (High, Medium, Low risk counts).
  - Event stream of integrity incidents (Face out of frame, Multiple faces detected, Tab switch, Audio speech detected).
  - Live snapshot thumbnail feed.
- **Current UI Condition & Weaknesses**:
  1. Resembles a developer diagnostic dashboard rather than a high-security enterprise command center.
  2. Live indicator pills use high-saturation neon greens and reds.
  3. Incident log table needs clear time-delta formatting ("2m ago") and incident severity badges matching the warm luxury aesthetic.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: 2-column layout (Sessions list + Live Incident Stream) stacking on `<1024px`.
- **Animations & Visual Effects**: Pulsing live radar dot, incident entry stagger animation.
- **Shared Components**: `Primitives` (Card, Badge, Button, SectionHeader).
- **Transformation Scope**: Elevate into an "Executive Defense & Integrity Console"; replace harsh red/green alerts with dignified crimson/emerald badges; add telemetry playback card.
- **Dependencies & Regression Risks**: Real-time polling or WebSocket stream from `/api/proctor/live-events`.
- **Implementation Priority**: Phase 4.

---

#### Screen 19: Assessment Builder (Evaluation Orchestrator)
- **Actual Route**: `/recruiter/assessment-builder`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/AssessmentBuilder.jsx` (~1,676 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Test design and configuration suite:
  - Creates custom assessment blueprints for jobs.
  - Mixes MCQ questions and Coding sandbox challenges.
  - Configures duration limits, difficulty thresholds, anti-cheating sensitivity.
  - Live preview of candidate test environment.
- **Current UI Condition & Weaknesses**:
  1. Dense multi-pane interface; step progression between "Question Selection" and "Proctoring Rules" lacks clear visual breadcrumbs.
  2. Question cards in selector pool have inconsistent padding.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Multi-column pane on desktop; collapses to vertical stack on tablets.
- **Animations & Visual Effects**: Drag-and-drop reordering, question card expansion.
- **Shared Components**: `Primitives` (Button, Input, Card, Modal, Tabs), `CustomDropdown`.
- **Transformation Scope**: Implement clear numbered step wizard header; style question selection cards with espresso chamfered borders; polish live test preview container.
- **Dependencies & Regression Risks**: Assessment blueprint saving to `/api/assessments/presets` and `/api/jobs/:id`.
- **Implementation Priority**: Phase 4.

---

#### Screen 20: Assessment Studio (Problem Bank & MCQ Repository)
- **Actual Route**: `/recruiter/assessment-studio`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/AssessmentStudio.jsx` (~1,097 lines)
  - `frontend/src/components/Recruiter/ProblemBankManager.jsx` (~848 lines)
  - `frontend/src/components/Recruiter/MCQBankManager.jsx` (~749 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Repository management for technical challenges and multiple-choice questions:
  - Coding problem authoring (Problem statement markdown, starter code, test case builder with hidden tests).
  - MCQ authoring (Multiple choice options, single/multiple correct answers, explanation markdown, difficulty tagging).
  - Search, filter by skill, filter by difficulty (Easy, Medium, Hard).
- **Current UI Condition & Weaknesses**:
  1. Tab switching between Coding Problems and MCQ Bank causes minor layout shift.
  2. Test case editor inside problem authoring modal has plain textareas without code formatting.
  3. Difficulty tags (Easy/Med/Hard) use standard green/yellow/red chips that clash with the brand palette.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Responsive list and side-drawer editor.
- **Animations & Visual Effects**: Tab transition, question item hover.
- **Shared Components**: `Primitives` (Tabs, Button, Input, Modal, Badge), `CustomDropdown`.
- **Transformation Scope**: Elevate test case editor with JetBrains Mono keycap styling; align difficulty badges with warm luxury status tokens; unify search and skill filter bar.
- **Dependencies & Regression Risks**: Code execution runner verification for test cases; backend problem persistence endpoints.
- **Implementation Priority**: Phase 4.

---

#### Screen 21: Interview Studio (AI Question Rubrics & Benchmarks)
- **Actual Route**: `/recruiter/interview-studio`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/AssessmentStudio.jsx` (`defaultTab="interview"`, ~1,097 lines)
  - `frontend/src/components/Candidate/benchmarkQuestions.js` (~80 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: AI Interview prompt engineering and rubric repository:
  - Configures adaptive interview question pools per role.
  - Sets evaluation criteria and scoring weights (Technical Accuracy, Problem Solving, Communication).
  - Configures follow-up probing depth for AI interviewer.
- **Current UI Condition & Weaknesses**:
  1. Renders inside `AssessmentStudio` as a tab; lacks distinct branding as an AI Interview Studio.
  2. Rubric sliders look plain.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Responsive cards.
- **Animations & Visual Effects**: Slider interactions, card entrance.
- **Shared Components**: `Primitives` (Card, Button, Input, Slider).
- **Transformation Scope**: Restyle question rubric cards with bespoke AI benchmark badges; add visual simulation preview of how the AI interviewer asks follow-ups.
- **Dependencies & Regression Risks**: Interview engine configuration schema.
- **Implementation Priority**: Phase 4.

---

#### Screen 22: Recruiter Interview Availability & Schedule Manager
- **Actual Route**: `/recruiter/availability`
- **User Role & Access**: Recruiter only (`<RequireRole role="recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Recruiter/RecruiterAvailabilityManager.jsx` (~516 lines)
  - `frontend/src/components/Recruiter/FancyInterviewScheduler.jsx` (~1,175 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Recruiter calendar and interview slot management:
  - Weekly recurring availability slots (Monday through Friday, morning/afternoon blocks).
  - Timezone selector.
  - Slot duration configuration (30m, 45m, 60m).
  - Buffer time between interviews.
  - Booked interview calendar view with candidate details.
- **Current UI Condition & Weaknesses**:
  1. Day of week toggle chips have plain border styling.
  2. Time slot grid looks spreadsheet-like rather than an executive calendar suite.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Calendar grid stacks to single-column day list on mobile.
- **Animations & Visual Effects**: Slot addition animation, toggle transition.
- **Shared Components**: `Primitives` (Card, Button, Badge), `CustomDropdown`.
- **Transformation Scope**: Elevate calendar grid into a sleek executive timeline; style time slots with tactile espresso pills; add timezone indicator badge.
- **Dependencies & Regression Risks**: Scheduling API endpoints (`/api/scheduling/availability`, `/api/scheduling/slots`).
- **Implementation Priority**: Phase 4.

---

### Category D: Candidate-Facing Experience & Tools

#### Screen 23: Candidate Requisitions Catalog & Job Search
- **Actual Route**: `/jobs`
- **User Role & Access**: Candidate & Recruiter (`roles={['candidate', 'recruiter']}`).
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/JobCatalog.jsx` (~386 lines)
  - `frontend/src/components/Candidate/ResumeUploadModal.jsx` (~550 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Candidate exploration of open positions:
  - Scoped filters: Active Roles, All Positions, Best Match (computes candidate skill match against job requirements).
  - Real-time match percentage calculation via backend matching service (`/api/skills/match/batch`).
  - Compensation badges with formatted salary ranges.
  - One-click "Apply Now" opening application modal or routing to `/jobs/:jobId/apply`.
- **Current UI Condition & Weaknesses**:
  1. Match score pill uses basic green border; should use ARETE circular or gauge badge.
  2. Card action buttons ("Apply", "View Details") look visually flat.
  3. Filter scope pill bar needs alignment with the executive toolbar style established in Recruiter view.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: 1 or 2 column card grid.
- **Animations & Visual Effects**: `FadeInUp` stagger animations on cards.
- **Shared Components**: `Primitives` (Card, Button, Badge), `ResumeUploadModal`.
- **Transformation Scope**: Elevate job cards with champagne border accents; implement radial match gauge; refine filter scope pills.
- **Dependencies & Regression Risks**: Matching calculation API fallback; candidate application state checking.
- **Implementation Priority**: Phase 5.

---

#### Screen 24: Candidate Job Application & Resume Matching Modal
- **Actual Route**: `/jobs/:jobId/apply` (or modal trigger from `/jobs`).
- **User Role & Access**: Candidate & Recruiter.
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/ResumeUploadModal.jsx` (~550 lines)
  - `frontend/src/components/Candidate/JobCatalog.jsx` (L35-58)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Multi-step application submission:
  - Drag-and-drop resume upload (PDF/DOCX).
  - Real-time resume extraction & skill parsing (`POST /api/candidates/parse-resume`).
  - Candidate compensation expectation input (Expected CTC, currency).
  - Instant pre-application match analysis preview before submitting (`POST /api/candidates/apply`).
- **Current UI Condition & Weaknesses**:
  1. File drop zone lacks animated upload progress indicator.
  2. Salary expectation input fields look cramped next to upload zone.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Centered responsive modal (`max-w-2xl`).
- **Animations & Visual Effects**: Modal enter, parse spinner.
- **Shared Components**: `Primitives` (Modal, Input, Button).
- **Transformation Scope**: Elevate resume dropzone with subtle laser border sheen; style salary expectation sliders/inputs with luxury keycaps.
- **Dependencies & Regression Risks**: File upload parsing multipart endpoint and candidate application creation.
- **Implementation Priority**: Phase 5.

---

#### Screen 25: My Applications & Candidate Career Dashboard
- **Actual Route**: `/my-applications`
- **User Role & Access**: Candidate only (`<RequireRole role="candidate" redirectTo="/recruiter">`).
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/MyApplications.jsx` (~524 lines)
  - `frontend/src/components/Candidate/CandidateScheduleModal.jsx` (~358 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Comprehensive candidate tracking hub:
  - Summary KPI metrics (Total Applications, Under Review, Interview Scheduled, Offers Extended).
  - Detailed application cards with 4-dimensional status badges (Stage, Assessment, Interview, Decision).
  - Dynamic action triggers:
    - "Take Assessment" (launches `/assessment`).
    - "Join Interview" / "Schedule Interview" (launches `CandidateScheduleModal` or `/interview`).
    - "View Verified Passport" (launches `/skill-passport`).
    - "View Skill Gap Report" (launches `/skill-gap`).
  - Rejection feedback transparency and application withdrawal.
- **Current UI Condition & Weaknesses**:
  1. Top KPI cards have plain borders and small typography.
  2. Application action buttons have disparate colors (purple, green, blue) breaking the warm espresso palette.
  3. Stage progression pipeline indicator inside application card lacks sleek step connectors.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Vertical card stack responsive to all mobile breakpoints.
- **Animations & Visual Effects**: Card stagger `FadeInUp`, badge transitions.
- **Shared Components**: `Primitives` (Stat, Card, Button, Badge), `CandidateScheduleModal`.
- **Transformation Scope**: Redesign KPI stat cards with Cinzel numerals and chamfered pedestals; unify application action buttons with espresso/amber styling; build a sleek multi-step milestone progress track for each application.
- **Dependencies & Regression Risks**: Application state normalization (`normalizeWorkflow()`); dynamic interview button state logic.
- **Implementation Priority**: Phase 2 (Candidate Dashboard) / Phase 5.

---

#### Screen 26: Candidate Interview Self-Scheduling Modal
- **Actual Route**: Modal triggered from `MyApplications.jsx`.
- **User Role & Access**: Candidate only.
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/CandidateScheduleModal.jsx` (~358 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Candidate books an interview slot from recruiter's published availability:
  - Date picker with available day indicators.
  - Slot selector chips (e.g. 10:00 AM, 2:30 PM).
  - Timezone confirmation.
  - Booking confirmation (`POST /api/scheduling/book-slot`) syncing interview meeting URL.
- **Current UI Condition & Weaknesses**:
  1. Date picker uses standard calendar cells without espresso hover glow.
  2. Time slot pills lack distinct available vs. selected visual feedback.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Centered responsive modal (`max-w-md`).
- **Animations & Visual Effects**: Modal scale-in, slot selection bounce.
- **Shared Components**: `Primitives` (Modal, Button).
- **Transformation Scope**: Elevate date grid with warm amber active days; style slot pills with keycap aesthetics; smooth booking success screen.
- **Dependencies & Regression Risks**: Slot booking concurrency and candidate state synchronization.
- **Implementation Priority**: Phase 4 / Phase 5.

---

#### Screen 27: Verified Skill Passport Dossier
- **Actual Route**: `/skill-passport`, `/skill-passport/:candidateId`
- **User Role & Access**: Candidate & Recruiter (`roles={['candidate', 'recruiter']}`).
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/SkillPassportView.jsx` (~711 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Cryptographically verified skill credentials and talent passport:
  - Verified skill badges with verification levels (Expert, Advanced, Intermediate).
  - Evidence linkage: connects skills to specific MCQ test scores, coding challenge execution benchmarks, and AI interview transcripts.
  - Shareable talent passport link & PDF export preview.
  - Blockchain/cryptographic hash verification badge.
- **Current UI Condition & Weaknesses**:
  1. Passport header card looks decent but lacks the prestigious "executive credential" aesthetic.
  2. Evidence cards within skills are dense and have small text contrast in dark mode.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Responsive card dossier.
- **Animations & Visual Effects**: Badge shimmer, score counters.
- **Shared Components**: `Primitives` (Card, Badge, Button), `AreteLogo`.
- **Transformation Scope**: Redesign passport header with an authoritative gold-leaf border motif; elevate verified skill cards with micro-evidence drawers; polish PDF export trigger.
- **Dependencies & Regression Risks**: Relational skill evidence endpoints (`/api/skills/evidence`).
- **Implementation Priority**: Phase 5.

---

#### Screen 28: AI Interview Assessment Room
- **Actual Route**: `/interview`, `/interview/:candidateId`
- **User Role & Access**: Candidate & Recruiter (`roles={['candidate', 'recruiter']}`).
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/AIInterviewRoom.jsx` (~1,242 lines)
  - `frontend/src/components/Candidate/AIOrb.jsx` (~111 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Real-time AI-powered voice & conversational interview experience:
  - Live webcam stream with audio visualizer waveform.
  - Animated 3D/canvas `AIOrb` responding to speech states (Listening, Speaking, Thinking).
  - Adaptive questioning driven by AI engine (`/api/interview/ask`).
  - Real-time speech-to-text transcription and audio speech synthesis.
  - Live anti-cheating proctoring stream (monitors face detection, eye gaze, tab focus).
  - Interview completion evaluation submission (`POST /api/interview/complete`).
- **Current UI Condition & Weaknesses**:
  1. Split view (Webcam left, AI conversation right) has uneven borders.
  2. Transcription live text subtitle box looks plain.
  3. Controls bar at bottom (Mute, Camera, Next Question, End Interview) needs tactile hardware button treatment.
- **Light/Dark Support**: Dark-mode dominant (`#0F0E0D`) for cinematic focus.
- **Responsive Behavior**: Side-by-side on desktop (`>=1024px`); stacked on smaller screens with priority on AI Orb and camera.
- **Animations & Visual Effects**: Glowing `AIOrb` pulse, `audio-wave` keyframes, transcription typewriter effect.
- **Shared Components**: `AIOrb`, `Primitives` (Button, Badge).
- **Transformation Scope**: Wrap video feed in chamfered espresso bezel with HUD status indicators; elevate bottom control console; enhance question card transitions.
- **Dependencies & Regression Risks**: Extremely critical: WebRTC / `navigator.mediaDevices` camera access, Web Speech API speech synthesis/recognition, proctoring frame capture timers.
- **Implementation Priority**: Phase 4 (Careful surgical UI pass).

---

#### Screen 29: Technical Assessment & Code IDE Sandbox
- **Actual Route**: `/assessment`, `/assessment/:candidateId`
- **User Role & Access**: Candidate & Recruiter (`roles={['candidate', 'recruiter']}`).
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/CodeAssessment.jsx` (~1,629 lines)
  - `frontend/src/components/Candidate/CandidateIDE.jsx` (~1,114 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: High-performance browser-based coding sandbox:
  - Multi-problem navigation (Problem statement, examples, constraints, hints).
  - Embedded Monaco Editor with multi-language execution (Python, JavaScript, SQLite, C++, Java, Go).
  - Live code sandbox execution against public test cases (`POST /api/assessment/run`).
  - Full assessment submission against hidden test suites (`POST /api/assessment/submit`).
  - Built-in timer countdown and proctoring HUD (focus loss warnings, full-screen lockdown).
- **Current UI Condition & Weaknesses**:
  1. Resizable split pane between problem statement and Monaco editor has a stark separator line.
  2. Test results console at bottom lacks colored terminal pass/fail badges.
  3. Top navigation bar with timer needs tighter alignment with the ARETE chrome.
- **Light/Dark Support**: Full support (Monaco theme dynamically bound to dark/light).
- **Responsive Behavior**: Fixed height viewport layout; requires desktop/laptop screen (>1024px); mobile shows responsive warning.
- **Animations & Visual Effects**: Timer countdown pulse, test execution loader spinner.
- **Shared Components**: `CandidateIDE`, `Primitives` (Button, Badge).
- **Transformation Scope**: Style IDE outer frame with warm espresso bezel; refine test case tab indicators; style timer badge with luxury gold countdown ring.
- **Dependencies & Regression Risks**: High risk: Monaco Editor lifecycle, code runner API, keyboard capture shortcuts.
- **Implementation Priority**: Phase 4.

---

#### Screen 30: Skill Gap Analysis & Career Roadmap
- **Actual Route**: `/skill-gap`, `/skill-gap/:candidateId`
- **User Role & Access**: Candidate & Recruiter (`roles={['candidate', 'recruiter']}`).
- **Main Component & Sources**: 
  - `frontend/src/components/Candidate/SkillGapReport.jsx` (~733 lines)
- **Status**: Implemented & Discoverable.
- **Existing Functionality**: Diagnostic career intelligence:
  - Compares candidate's verified skills against target job requisition or industry benchmark.
  - Visual breakdown of Match Score, Missing Critical Skills, Adjacent Skills, Over-indexed Skills.
  - Personalized AI-curated learning roadmap with milestones, documentation links, and estimated time-to-mastery.
- **Current UI Condition & Weaknesses**:
  1. Skill gap chips look standard.
  2. Learning roadmap milestones use generic vertical timeline dots; could use interactive step progression with estimated hours badges.
- **Light/Dark Support**: Full support.
- **Responsive Behavior**: Responsive 2-column layout (Summary/Gaps left, Roadmap right) stacking on `<1024px`.
- **Animations & Visual Effects**: Progress bar fill, timeline item stagger.
- **Shared Components**: `Primitives` (Card, Badge, Button, Progress).
- **Transformation Scope**: Elevate gap breakdown with dual-tone progress bars (Candidate Level vs. Required Level); transform learning roadmap into a guided career ascension path.
- **Dependencies & Regression Risks**: Skill gap computation contract (`/api/skills/gap/:candidateId`).
- **Implementation Priority**: Phase 5.

---

### Category E: Legacy & Unreferenced Surfaces

#### Screen 31: Legacy Horizontal Navbar (Superseded)
- **Actual Route**: Unreferenced in `App.jsx` (originally mounted at root in SparkX v1).
- **User Role & Access**: Unreferenced.
- **Main Component & Sources**: 
  - `frontend/src/components/Navbar.jsx` (~499 lines)
- **Status**: Legacy / Unreferenced.
- **Findings**: Static code inspection confirms `Navbar.jsx` is not imported or rendered anywhere in `App.jsx` or active layouts. All navigation is handled by `AppSidebar.jsx` (desktop) and `AppLayout.jsx` (mobile header).
- **Action**: Do not schedule for transformation; preserve untouched in source tree to prevent regressions.

---

## 3. Practical Transformation Order (7 Strategic Phases)

To ensure zero downtime, preserve all business logic, and avoid breaking transitions, UI transformations must proceed in strict phased sequence:

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: Application Shell & Shared Primitives         │
│ (AppLayout, Mobile Header, Command Menu, Primitives)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: Main Operational Dashboards                   │
│ (CandidatePipeline Toolbar & Kanban, MyApplications)   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 3: Recruiter Talent Operations                   │
│ (Requisitions Tab, JobCreatorModal, CandidateWorkspace)│
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 4: Assessment & Studio Experiences               │
│ (CodeAssessment, AIInterviewRoom, ProctorLiveMonitor)  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 5: Candidate Experience & Portals                │
│ (JobCatalog, SkillPassportView, SkillGapReport)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 6: System Overlays, Auth & Marketing Polish      │
│ (AskSparkxDrawer, LoginScreen, LandingPage, 404)       │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 7: Cross-Screen Harmony & Regression Verification│
│ (Keyboard shortcuts, theme cross-fades, responsive audits)
└────────────────────────────────────────────────────────┘
```

### Phase Breakdown & Deliverables

#### Phase 1 — Application Shell & Shared Primitives
* **Scope**: 
  - `frontend/src/components/ui/Primitives.jsx` (`Button`, `IconButton`, `Input`, `Card`, `Badge`, `StatusBadge`, `Modal`, `Drawer`, `Tabs`, `Stat`).
  - `frontend/src/components/layout/AppLayout.jsx` (Mobile header, scrollbar tracks, content container).
  - `frontend/src/components/layout/CommandMenu.jsx` (`Ctrl+K` palette styling).
* **Rationale**: Upgrading the foundational primitives immediately elevates every screen that imports them without altering individual screen logic.

#### Phase 2 — Main Dashboards
* **Scope**:
  - `frontend/src/components/Recruiter/CandidatePipeline.jsx` (Main Recruiter Dashboard, Stage Board, dense list).
  - `frontend/src/components/Candidate/MyApplications.jsx` (Main Candidate Dashboard, KPI stats, status tracking).
* **Rationale**: These are the initial landing destinations post-login for recruiters and candidates respectively.

#### Phase 3 — Recruitment Workflows
* **Scope**:
  - Active Requisitions grid (`CandidatePipeline.jsx` Jobs tab).
  - Requisition Creation & Edit Studio (`JobCreatorModal.jsx`).
  - Candidate Workspace & Dossier Sub-Tabs (`CandidateWorkspace.jsx` and 8 tab components).
  - Multi-Candidate Comparison Matrix (`CandidateComparisonModal.jsx`).
* **Rationale**: Core recruiter workflow where hiring decisions are executed.

#### Phase 4 — Assessment & Studio Experiences
* **Scope**:
  - Code Assessment IDE (`CodeAssessment.jsx`, `CandidateIDE.jsx`).
  - AI Interview Room (`AIInterviewRoom.jsx`, `AIOrb.jsx`).
  - Live Proctoring HUD (`ProctorLiveMonitor.jsx`).
  - Assessment Builder & Studio (`AssessmentBuilder.jsx`, `AssessmentStudio.jsx`).
  - Recruiter Availability Manager (`RecruiterAvailabilityManager.jsx`).
* **Rationale**: Complex interactive screens involving timers, media hardware, Monaco Editor, and real-time state.

#### Phase 5 — Candidate-Facing Experience
* **Scope**:
  - Job Search & Requisitions (`JobCatalog.jsx`).
  - Application & Resume Matching Modal (`ResumeUploadModal.jsx`).
  - Verified Skill Passport (`SkillPassportView.jsx`).
  - Skill Gap Report & Roadmap (`SkillGapReport.jsx`).
* **Rationale**: Candidate engagement surfaces focused on trust, credential verification, and transparent feedback.

#### Phase 6 — Remaining Modals, Overlays & Public Pages
* **Scope**:
  - ARETE AI Copilot Drawer (`AskSparkxDrawer.jsx`).
  - AI Provider Configuration Modal (`AIConfigModal.jsx`).
  - Sign In, Sign Up, Password Reset (`LoginScreen.jsx`).
  - Public Marketing Landing Page (`LandingPage.jsx`, `PublicNavbar.jsx`).
  - Offline & 404 Pages (`OfflineScreen`, `NotFoundScreen.jsx`).
* **Rationale**: Secondary utilities and public-facing showcases.

#### Phase 7 — Consistency & System Verification
* **Scope**:
  - Global responsive sweep (375px mobile, 768px tablet, 1024px laptop, 1440px+ desktop).
  - Light/Dark theme cross-fade verification with `CosmicThemeWave`.
  - Photon laser route transition check across all links.
  - Full end-to-end regression audit of API interactions.

---

## 4. Shared UI Components with Highest Visual Impact

The following reusable components have the highest blast radius across the application. Any visual refinement applied here immediately upgrades dozens of screens:

| Component | File Path | Usage Across App | Visual Impact Description |
|---|---|---|---|
| **Button / IconButton** | `frontend/src/components/ui/Primitives.jsx` | 30+ screens | Controls all CTA buttons, secondary actions, and toolbars. Applying tactile chamfered borders and espresso hover surfaces upgrades the entire platform tactile feel. |
| **StatusBadge / Badge** | `frontend/src/components/ui/Primitives.jsx` | 25+ screens | Renders all candidate stages (Screening, Interview, Review), integrity risks (Low, High), and assessment statuses. Standardizing on warm espresso/amber tokens eliminates color clashing. |
| **Card / Panel** | `frontend/src/components/ui/Primitives.jsx` | 22+ screens | Provides base surface for jobs, candidate cards, metrics, and widgets. Ensuring consistent `#2B201A` (dark) and `#FDFBF7` (light) card fills prevents stark contrast cuts. |
| **CustomDropdown** | `frontend/src/components/ui/CustomDropdown.jsx` | 18+ screens | Controls filtering by stage, job, department, difficulty, and sort order. Needs sleek frosted espresso popover menus with gold active checkmarks. |
| **Modal / Drawer** | `frontend/src/components/ui/Primitives.jsx` | 15+ screens | Houses Candidate Workspace, Job Creator, Resume Uploader, AI Config, and Confirmations. Adding uniform chamfered radii and backdrop blur harmonizes overlays. |
| **Input / SearchInput** | `frontend/src/components/ui/Primitives.jsx` | 20+ screens | Used across search bars, filters, and forms. Needs consistent warm stone placeholder styling and restrained amber focus rings. |
| **AreteLogo** | `frontend/src/components/ui/AreteLogo.jsx` | All layouts, headers | Brand anchor featuring the geometric faceted prism emblem and Cinzel wordmark. |
| **Toast** | `frontend/src/components/ui/Toast.jsx` | Global notification bus | Renders API success, error, and info toasts. Restyled with dark espresso backing and luxury status beacons. |

---

## 5. Mandatory Design & Animation Preservation Rules

### Theme Lock: Warm Luxury Espresso Identity
- **Dark Mode Surface Hierarchy**:
  - Background: `#0F0E0D` (Deeper neutral espresso background)
  - Card/Container: `#2B201A` (Warm roasted coffee surface)
  - Card Border: `#423229` (Warm roast boundary)
  - Accent Primary: `#F59E0B` (Warm high-contrast amber)
  - Accent Secondary: `#D97706` / `#B45309` (Bronze / caramel)
  - **Prohibited**: Pure black `#000000`, cold bluish slates (`#0F172A`), saturated neon oranges.
- **Light Mode Surface Hierarchy**:
  - Background: `#F7F4EF` (Warm stone / soft parchment)
  - Card/Container: `#FDFBF7` (Soft cream / latte)
  - Card Border: `#E8DFD8` (Subtle warm border)
  - Accent Primary: `#C27803` (Rich roasted amber)
- **Token Protection**: No modifications to CSS custom variables in `:root` / `.dark` or `tailwind.config.js` color names without explicit mandate.

### Animation Lock: Preserved Visual Systems
The following 10 motion systems are active in the codebase and must remain intact:
1. **Cosmic Supernova Theme Switch**: `CosmicThemeWave.jsx` and `@keyframes theme-supernova-expand` (550ms radial clip-path expansion).
2. **Photon Laser Route Navigation**: `PageTransitionContext.jsx` and `@keyframes photon-laser-sweep` (320ms top transit beam).
3. **ScrollReveal & Parallax**: `ScrollReveal.jsx`, `HomeExtras.jsx` (IntersectionObserver scroll triggers).
4. **Interactive AI Orb**: `AIOrb.jsx` (real-time canvas pulsing shader reacting to audio states).
5. **Magnetic Landing Cursor**: `LandingCursor.jsx` (spring-physics canvas cursor on marketing routes).
6. **Executive Radar Polygon**: `CompetencyRadar.jsx` (animated SVG polygon drawing in Candidate Workspace).
7. **Sidebar Drag-Resize & Collapse**: `AppSidebar.jsx` (drag interaction with persistent width state).
8. **Live Telemetry Radar Pulses**: `ProctorLiveMonitor.jsx` and `AppSidebar.jsx` live dots.
9. **Modal & Drawer Physics**: `@keyframes modal-enter`, `@keyframes drawer-enter` (spring physics).
10. **Typing Terminal Loop**: `HomeExtras.jsx` (real-time typewriter simulation).

### Functional Preservation & Data Integrity
- **Live Backend Contract**: Every screen must remain wired to its live FastAPI endpoint. No static mock arrays or hardcoded candidate/job lists may replace live data.
- **RBAC Enforcement**: Candidate routes (`/my-applications`) and Recruiter routes (`/recruiter/*`) must remain strictly protected by `RouteGuards.jsx`.
- **4-Dimensional Workflow State**: The candidate state machine (`stage`, `assessment_status`, `interview_status`, `hiring_decision`) governed by `backend/workflow_contract.py` and `frontend/src/utils/workflowContract.js` must be strictly respected.

---

## 6. Implementation Readiness & Recommended Starting Point

### Summary of Discovered Surfaces
- **Total Discovered Surfaces**: 31 surfaces across public, auth, shared, candidate, and recruiter domains.
  - **Public & Authentication**: 4 screens (`/home`, `/login`, `/register`, `/forgot-password`).
  - **Shared Shell & Overlays**: 8 components (Layout, Sidebar, Mobile Header, Command Menu, Copilot Drawer, AI Config, Sign Out, Offline, 404).
  - **Recruiter Operations**: 10 screens & studios (Pipeline, Requisitions, Job Creator, Comparison Matrix, Candidate Workspace + 8 tabs, Proctor HUD, Assessment Builder, Assessment Studio, Interview Studio, Availability Manager).
  - **Candidate Experience**: 8 screens & workflows (Job Catalog, Application Modal, My Applications, Scheduling Modal, Skill Passport, AI Interview Room, Code Assessment IDE, Skill Gap Report).
  - **Legacy / Unreferenced**: 1 component (`Navbar.jsx`).

### Screen Selected for First Transformation: Phase 1 — Reusable Primitives & Application Shell
Before modifying complex feature screens, the first transformation should execute on:
1. **`frontend/src/components/ui/Primitives.jsx`**:
   - Refine `Button` variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) to use exact warm espresso fills (`#2E2017`), chamfered 8px radii, subtle champagne sheen borders (`#423229`), and warm bronze text.
   - Refine `StatusBadge` to map 4-dimensional workflow statuses directly to dignified espresso/amber/emerald/garnet tokens.
   - Refine `Card` and `Panel` to ensure consistent soft cream (light) and warm roasted espresso (dark) backgrounds.
   - Refine `Modal` and `Drawer` headers with Cinzel serif titles and subtle gold hairline dividers.
2. **`frontend/src/components/layout/AppLayout.jsx`**:
   - Polish mobile header bar and custom espresso-tinted scrollbar tracks in `#main-scroll-container`.

This targeted first step provides an immediate, risk-free visual elevation across all 30 active screens simultaneously while maintaining 100% functional integrity.
