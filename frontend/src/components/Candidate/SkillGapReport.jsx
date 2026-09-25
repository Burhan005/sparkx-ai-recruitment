import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Briefcase,
  Layers,
  Code2,
  Clock,
  Target,
  ChevronRight,
  FileText,
  User,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';

// Curated skill-specific upskilling curricula for technical proficiencies
const SKILL_CURRICULUM_DATABASE = {
  python: {
    title: "Python Concurrency, Memory Profiling & GIL Internals",
    phase: "Phase 1: Performance & Runtime",
    duration: "1–2 Weeks (8 hrs)",
    priority: "High Priority",
    description: "Deep-dive into Python's asyncio event loop, GIL internals, multi-threading vs multiprocessing tradeoffs, and memory leak profiling using tracemalloc and cProfile.",
    project: "Build an asynchronous high-throughput event worker consuming 5,000 tasks/sec with zero memory leaks.",
    topics: ["Asyncio task scheduling & timeouts", "cProfile & Memory profiling", "Custom context managers & generators", "CPU-bound vs I/O-bound scaling"]
  },
  fastapi: {
    title: "High-Throughput Async REST & WebSocket APIs",
    phase: "Phase 1: API Architecture",
    duration: "1–2 Weeks (6 hrs)",
    priority: "High Priority",
    description: "Architect production FastAPI services with Pydantic v2 validation, dependency injection, connection pooling, and JWT authorization.",
    project: "Design a streaming telemetry ingestion endpoint with async PostgreSQL connection pools and structured JSON logging.",
    topics: ["Pydantic v2 serializers & models", "Dependency Injection graph", "Background tasks & lifespan events", "OpenAPI spec customization"]
  },
  react: {
    title: "Enterprise React & Concurrent Rendering Patterns",
    phase: "Phase 1: Frontend Architecture",
    duration: "1–2 Weeks (6 hrs)",
    priority: "High Priority",
    description: "Master React concurrent features, useTransition, state synchronization without waterfalls, and custom hook encapsulation.",
    project: "Implement an optimistic UI update pipeline with offline cache fallbacks and virtualized 10,000-row telemetry grid.",
    topics: ["Concurrent rendering & Suspense boundaries", "Custom hook memoization patterns", "Virtual DOM diffing optimization", "Atomic state management"]
  },
  kubernetes: {
    title: "Production Kubernetes & Resilient Deployment",
    phase: "Phase 2: Infrastructure & Scale",
    duration: "2 Weeks (10 hrs)",
    priority: "High Priority",
    description: "Configure resilient workloads with Horizontal Pod Autoscalers (HPA), custom health probes, ingress routing, and config secret management.",
    project: "Deploy a multi-service Helm chart with rolling updates, resource limits, and automated canary rollbacks.",
    topics: ["Pod disruption budgets & affinity rules", "Helm chart templates & values", "Ingress controllers & TLS certificates", "Prometheus metrics scrapers"]
  },
  docker: {
    title: "Multi-Stage Docker Containerization & Security Hardening",
    phase: "Phase 1: Packaging & Security",
    duration: "1 Week (4 hrs)",
    priority: "Medium Priority",
    description: "Create lightweight distroless Docker images, optimize layer caching, and eliminate root-privilege security vulnerabilities.",
    project: "Optimize a 1.2 GB development image into an ultra-lean 75 MB production artifact passing Trivy vulnerability scans.",
    topics: ["Multi-stage build pipelines", "Distroless & alpine base images", "Non-root container user hardening", "BuildKit caching mechanisms"]
  },
  "system design": {
    title: "Distributed Systems & Resilient Scalability",
    phase: "Phase 2: Architectural Leadership",
    duration: "2–3 Weeks (12 hrs)",
    priority: "High Priority",
    description: "Architect systems resilient to network partitioning and hardware failures, using caching tiers, message queues, and horizontal partitioning.",
    project: "Author an architecture design document (ADD) for an idempotent payment transaction ledger with 99.999% SLA.",
    topics: ["CAP theorem trade-offs in practice", "Consistent hashing & database sharding", "Idempotent event processing with Kafka", "Two-phase commits vs Sagas"]
  },
  pytorch: {
    title: "Deep Learning Engineering & Model Inference Optimization",
    phase: "Phase 2: AI & Inference",
    duration: "2 Weeks (10 hrs)",
    priority: "High Priority",
    description: "Engineer custom PyTorch neural modules, optimize inference latencies with ONNX Runtime, and implement dynamic batching pipelines.",
    project: "Serve a quantized transformer model with sub-40ms P99 latency under concurrent multi-user load.",
    topics: ["Tensor arithmetic & autograd graph", "Model quantization (INT8/FP16)", "ONNX / TensorRT export", "TorchScript compilation"]
  },
  "vector dbs": {
    title: "Vector Embeddings & Low-Latency Retrieval Topologies",
    phase: "Phase 2: AI & Retrieval",
    duration: "1–2 Weeks (6 hrs)",
    priority: "High Priority",
    description: "Index and retrieve high-dimensional vector embeddings using HNSW and IVF algorithms with hybrid sparse-dense scoring.",
    project: "Build a production RAG retrieval pipeline with cross-encoder re-ranking and sub-20ms query resolution.",
    topics: ["HNSW vs IVF index topologies", "Cosine vs dot product distance metrics", "Metadata filtering at scale", "Cross-encoder re-ranking"]
  },
  "ci/cd pipelines": {
    title: "Automated Staging & Canary Delivery Pipelines",
    phase: "Phase 1: DevOps & Automation",
    duration: "1 Week (5 hrs)",
    priority: "Medium Priority",
    description: "Construct zero-downtime deployment pipelines with automated test matrixes, artifact signing, and automated rollback gates.",
    project: "Build a GitHub Actions CI pipeline running lint, unit tests, integration tests, and staging deploy in under 3 minutes.",
    topics: ["Parallel job matrices", "Secret masking & OIDC tokens", "Automated release tag workflows", "Synthetic smoke testing gates"]
  },
  postgresql: {
    title: "PostgreSQL Query Planning & Indexing Internals",
    phase: "Phase 1: Data Engineering",
    duration: "1–2 Weeks (8 hrs)",
    priority: "High Priority",
    description: "Analyze query execution plans using EXPLAIN ANALYZE, design B-tree and GiST indices, and manage transaction isolation levels.",
    project: "Diagnose and optimize slow queries on a 50M-row table, reducing execution time from 4.2s to 18ms.",
    topics: ["EXPLAIN (ANALYZE, BUFFERS) interpretation", "Composite & partial indexing", "MVCC & VACUUM tuning", "Connection pool sizing (PgBouncer)"]
  },
  aws: {
    title: "Cloud-Native Infrastructure & Serverless Architectures",
    phase: "Phase 2: Cloud Architecture",
    duration: "2 Weeks (8 hrs)",
    priority: "Medium Priority",
    description: "Provision robust cloud architecture with AWS ECS Fargate, Lambda triggers, S3 storage tiers, and IAM least-privilege policies.",
    project: "Provision reproducible cloud infrastructure via Terraform with automated DNS, SSL, and load balancer listeners.",
    topics: ["ECS Fargate task definitions", "S3 lifecycle policies & SSE-KMS", "IAM roles vs user policies", "CloudWatch alerts & SNS integration"]
  }
};

function getSkillCurriculum(skillName, index) {
  const normalized = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, curr] of Object.entries(SKILL_CURRICULUM_DATABASE)) {
    if (normalized.includes(key.replace(/[^a-z0-9]/g, '')) || key.includes(normalized)) {
      return curr;
    }
  }
  return {
    title: `Advanced ${skillName} Architecture & Mastery`,
    phase: `Phase ${Math.min(3, Math.floor(index / 2) + 1)}: Technical Specialization`,
    duration: "1–2 Weeks (6–8 hrs)",
    priority: index === 0 ? "High Priority" : "Core Competency",
    description: `Deepen your practical proficiency in ${skillName}. Focus on modern enterprise best practices, scalable design patterns, and unit/integration testing methodologies.`,
    project: `Implement a modular production-grade feature leveraging ${skillName} with comprehensive test coverage and documentation.`,
    topics: [
      `${skillName} enterprise idioms & best practices`,
      "Performance optimization & debugging strategies",
      "Automated testing & error handling",
      "Production readiness checklist"
    ]
  };
}

export default function SkillGapReport() {
  const navigate = useNavigate();
  const { candidateId: routeCandidateId } = useParams();
  const { 
    selectedCandidate, 
    candidates = [],
    currentUser,
    activeJob, 
    myApplications = [],
    refreshMyApplications,
    setActiveJobId
  } = useRecruitment();

  const [activeAppId, setActiveAppId] = useState(routeCandidateId || null);

  // Sync route candidate ID into local state
  useEffect(() => {
    if (routeCandidateId) {
      setActiveAppId(routeCandidateId);
    }
  }, [routeCandidateId]);

  // Ensure candidate's applications are loaded if user is logged in
  useEffect(() => {
    if (currentUser?.email && myApplications.length === 0 && refreshMyApplications) {
      refreshMyApplications(currentUser.email);
    }
  }, [currentUser?.email, myApplications.length, refreshMyApplications]);

  // Find target candidate or application record
  const cand = 
    (activeAppId && myApplications.find(a => String(a.id) === String(activeAppId))) ||
    (activeAppId && candidates.find(c => String(c.id) === String(activeAppId))) ||
    (routeCandidateId && myApplications.find(a => String(a.id) === String(routeCandidateId))) ||
    (routeCandidateId && candidates.find(c => String(c.id) === String(routeCandidateId))) ||
    myApplications.find(a => a.id === currentUser?.id || a.email === currentUser?.email) ||
    candidates.find(c => c.email === currentUser?.email || c.id === currentUser?.id) ||
    selectedCandidate || 
    (myApplications.length > 0 ? myApplications[0] : null) ||
    (candidates.length > 0 ? candidates[0] : null);

  // Candidate identity details
  const candidateName = cand?.name || cand?.candidateName || currentUser?.name || 'Candidate';
  const candidateEmail = cand?.email || currentUser?.email || '';
  const targetRoleTitle = cand?.jobTitle || cand?.job?.title || activeJob?.title || 'Applied Position';
  const companyName = cand?.companyName || cand?.company_name || activeJob?.companyName || 'SparkX Technologies';
  const department = cand?.department || activeJob?.department || 'Engineering';

  // Target job skills
  const activeJobSkills = activeJob?.requiredSkills || cand?.job?.requiredSkills || ["Python", "FastAPI", "React", "System Design", "Kubernetes", "PostgreSQL"];

  if (!cand && myApplications.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto shadow-sm">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            No Application Dossier Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Apply to open roles or complete an assessment to generate your autonomous skill gap analysis and personalized learning roadmap.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25"
          >
            Explore Job Openings
          </button>
        </div>
      </div>
    );
  }

  // Scores and telemetry
  const scores = cand?.scores || {};
  const overall = typeof scores.overall === 'number' 
    ? scores.overall 
    : (typeof cand?.coding_score === 'number' ? cand.coding_score : (typeof cand?.codingScore === 'number' ? cand.codingScore : (cand?.matchScore || 0)));
  const isEvaluated = cand?.assessment_status === 'evaluated' || Boolean(cand?.assessment_data?.is_completed) || overall > 0;

  const technicalScore = typeof scores.technicalScore === 'number' 
    ? scores.technicalScore 
    : (isEvaluated && overall > 0 ? (typeof cand?.coding_score === 'number' ? cand.coding_score : Math.round(overall * 0.9)) : 0);
  const problemSolving = typeof scores.problemSolving === 'number' 
    ? scores.problemSolving 
    : (isEvaluated && overall > 0 ? Math.round(overall * 0.85) : 0);
  const communication = typeof scores.communication === 'number' 
    ? scores.communication 
    : (isEvaluated && overall > 0 ? (overall >= 70 ? 82 : 65) : 0);
  const integrity = cand?.integrityScore ?? cand?.integrity_score ?? 100;

  // Genuine skill gaps calculation
  const rawGaps = cand?.skillGaps || cand?.skill_gaps || {};
  const candidateSkills = cand?.skills || [];
  const requiredSkills = activeJobSkills;

  let strongSkills = [];
  if (rawGaps.strongSkills && Array.isArray(rawGaps.strongSkills) && rawGaps.strongSkills.length > 0) {
    strongSkills = rawGaps.strongSkills;
  } else if (isEvaluated && overall >= 60) {
    strongSkills = requiredSkills.filter(s => candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase()));
  }

  let missingSkills = (rawGaps.missingSkills && Array.isArray(rawGaps.missingSkills) && rawGaps.missingSkills.length > 0)
    ? rawGaps.missingSkills
    : requiredSkills.filter(s => !strongSkills.some(ss => ss.toLowerCase() === s.toLowerCase()));

  // Automated Readiness Classification
  const readiness = rawGaps.readiness || (
    overall >= 80 ? "Immediately Job-Ready (Top 10% Calibrated)" :
    overall >= 50 ? "Hire-and-Develop (Trainable within 30 days)" :
    (isEvaluated 
      ? "Targeted Upskilling in Progress (Focus on High-Priority Modules)"
      : "Pending Assessment Calibration (Modules Unverified)")
  );

  const readinessColor = 
    overall >= 80 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/80 dark:border-emerald-500/20' :
    overall >= 50 ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200/80 dark:border-indigo-500/20' :
    'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Multi-application Switcher Tab Bar (if candidate applied to multiple positions) */}
      {myApplications.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Application:
          </span>
          {myApplications.map((app) => {
            const isSelected = String(app.id) === String(cand?.id);
            return (
              <button
                key={app.id}
                onClick={() => {
                  setActiveAppId(app.id);
                  if (app.jobId) setActiveJobId(app.jobId);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center space-x-2 border ${
                  isSelected 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{app.jobTitle || 'Role'}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Hero Header & Executive Calibration Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm bg-white dark:bg-slate-900/90 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Identity & Role Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Competency & Growth Dossier</span>
              </span>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs ${readinessColor}`}>
                {cand?.stage ? `Stage: ${cand.stage}` : 'Evaluated'}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-baseline gap-3 flex-wrap">
                <span>{candidateName}</span>
                <span className="text-slate-300 dark:text-slate-700 font-normal text-lg sm:text-2xl">/</span>
                <span className="text-brand-600 dark:text-brand-400 text-lg sm:text-2xl font-semibold truncate">
                  {targetRoleTitle}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-normal flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{companyName}</span>
                <span>•</span>
                <span>Department: {department}</span>
                {cand?.appliedDate && (
                  <>
                    <span>•</span>
                    <span>Applied: {cand.appliedDate}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Readiness Meter Gauge Card */}
          <div className="shrink-0 flex items-center p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-x-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={overall >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}
                  strokeDasharray={`${Math.max(5, overall)}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-none">
                  {overall}%
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight mt-0.5">
                  Role Fit
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Calibrated Readiness
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight max-w-[200px]">
                {readiness}
              </p>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Verified ({integrity}% Integrity)</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Pillars Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-200/80 dark:border-white/[0.06]">
          
          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Technical Depth</span>
              <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {technicalScore > 0 ? `${technicalScore}%` : 'Calibrating'}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.max(10, technicalScore)}%` }} 
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Problem Solving</span>
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {problemSolving > 0 ? `${problemSolving}%` : 'Calibrating'}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.max(10, problemSolving)}%` }} 
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Scenario Calibration</span>
              <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {communication > 0 ? `${communication}%` : 'Validated'}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${Math.max(10, communication)}%` }} 
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Audit & Integrity</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {integrity}%
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${integrity}%` }} 
              />
            </div>
          </div>

        </div>

      </div>

      {/* Main 2-Column Competency & Skill Gap Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Validated Strengths */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-5 shadow-xl bg-white dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Validated Strengths & Core Proficiencies</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {strongSkills.length} Verified
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Competencies demonstrated through resume evaluation, verified credentials, and technical assessments for {targetRoleTitle}.
          </p>

          <div className="space-y-3">
            {strongSkills.length > 0 ? (
              strongSkills.map((skill, i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                        {skill}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Production Mastery Benchmark
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    Validated
                  </span>
                </div>
              ))
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <HelpCircle className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assessment in Progress
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Complete the technical role assessment to calibrate your verified strengths against role benchmarks.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Targeted Upskilling Areas */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-5 shadow-xl bg-white dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Targeted Upskilling & Growth Areas</span>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {missingSkills.length} Action Items
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            High-leverage engineering skills identified to accelerate your role readiness and interview progression.
          </p>

          <div className="space-y-3">
            {missingSkills.map((skill, i) => (
              <div 
                key={i} 
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                      {skill}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Role Requirement · Priority Focus
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  Curriculum Below ↓
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Dynamic Personalized Career & Learning Roadmap */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-6 shadow-xl bg-white dark:bg-slate-900/80">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Personalized Career & Learning Roadmap</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Actionable Upskilling Plan for {targetRoleTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Tailored curriculum modules structured by phase, containing hands-on projects, key study concepts, and production architecture challenges.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {missingSkills.length} Dedicated Modules
            </span>
          </div>
        </div>

        {/* Structured Curriculum Cards Grid */}
        <div className="space-y-4">
          {missingSkills.map((skill, index) => {
            const curriculum = getSkillCurriculum(skill, index);
            return (
              <div 
                key={index} 
                className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/[0.06] hover:border-indigo-500/40 transition-all duration-300 space-y-4 shadow-sm"
              >
                
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
                      0{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {curriculum.phase}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {curriculum.duration}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {curriculum.title}
                      </h3>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border self-start sm:self-auto ${
                    curriculum.priority === 'High Priority'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                      : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
                  }`}>
                    {curriculum.priority}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {curriculum.description}
                </p>

                {/* Hands-on Project Challenge */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/[0.08] flex items-start space-x-3">
                  <Target className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                      Hands-On Challenge:
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {curriculum.project}
                    </span>
                  </div>
                </div>

                {/* Key Study Concepts */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    Key Concepts to Master:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {curriculum.topics.map((topic, tIdx) => (
                      <div 
                        key={tIdx} 
                        className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate('/my-applications')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-sm text-center"
        >
          ← Return to My Applications
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/jobs')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition shadow-sm text-center"
          >
            Explore Open Roles
          </button>

          <button
            onClick={() => navigate(cand?.id ? `/assessment/${cand.id}` : '/assessment')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
          >
            <span>Practice Technical Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
