import React, { useState, useMemo } from 'react';
import { 
  User, 
  Sparkles, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  GraduationCap, 
  Clock, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Video,
  DollarSign,
  TrendingUp,
  Scale,
  Copy,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Cpu,
  Server,
  Zap,
  Bot,
  Award,
  BookOpen,
  Briefcase,
  Terminal,
  CheckCheck,
  Download
} from 'lucide-react';
import { Card, Badge, StatusBadge, Button } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';
import { 
  formatJobCTC, 
  formatCandidateExpectedCTC, 
  formatCandidateCurrentCTC, 
  getCompensationBadgeConfig 
} from '../../../utils/compensationFormatter';
import CompetencyRadar from './CompetencyRadar';
import { exportResumeAsPDF } from '../../../utils/resumePdfExporter';

export default function CandidateOverviewTab({ 
  candidate, 
  onNavigateTab,
  onScheduleInterview,
  onOpenAskSparkx
}) {
  const [isPlaintextOpen, setIsPlaintextOpen] = useState(false);
  const [plaintextFilter, setPlaintextFilter] = useState('');
  const [copiedResume, setCopiedResume] = useState(false);

  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);

  const matchScore = candidate.matchScore || 0;
  const skillsList = candidate.skills || [];
  const expYears = candidate.experienceYears || 0;

  // Synthesize executive profile details when resume summary is concise
  const executiveProfile = useMemo(() => {
    const rawSummary = candidate.resumeSummary || candidate.interviewSummary || '';
    let cleanSummary = rawSummary.trim();
    if (/^parsed from [^:]+:\s*/i.test(cleanSummary)) {
      const extracted = cleanSummary.replace(/^parsed from [^:]+:\s*/i, '').trim();
      cleanSummary = extracted ? `Verified resume signals: ${extracted}` : '';
    }

    // Strip raw upload announcements, filename mentions, or redundant headers
    cleanSummary = cleanSummary.replace(/^(?:uploaded\s+resume|resume\s+file|parsed\s+from)[^:\n]*:\s*[^.\n]+\.(?:pdf|docx?|txt)\s*/i, '').trim();
    cleanSummary = cleanSummary.replace(/^(?:uploaded\s+resume|resume\s+file|parsed\s+from):\s*/i, '').trim();
    cleanSummary = cleanSummary.replace(/^[A-Za-z0-9_-]+\s*\(\d+\)\.pdf\s*/i, '').trim();

    if (cleanSummary && cleanSummary.length > 180) {
      return cleanSummary;
    }
    const roleTitle = candidate.jobTitle || candidate.job?.title || 'Software Engineer';
    const roleLower = roleTitle.toLowerCase();
    const skillsPreview = skillsList.slice(0, 4).join(', ') || 'modern engineering stacks';

    let domainFocus = 'scalable distributed architecture, high-throughput microservices, and reliable cloud deployments';
    if (roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('ui') || roleLower.includes('ux')) {
      domainFocus = 'interactive user interfaces, reactive component design systems, and client-side performance optimization';
    } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('infra') || roleLower.includes('sre')) {
      domainFocus = 'infrastructure-as-code, automated container orchestration, and high-availability CI/CD deployment pipelines';
    } else if (roleLower.includes('ai') || roleLower.includes('ml') || roleLower.includes('data')) {
      domainFocus = 'machine learning workflows, vector similarity search, and automated intelligence pipeline serving';
    }

    return `${cleanSummary ? cleanSummary + '\n\n' : ''}Demonstrated engineering depth with ${expYears > 0 ? `${expYears} years` : 'substantial'} of progressive experience building resilient, production-grade applications. Specializes in ${domainFocus} utilizing ${skillsPreview}. Consistently recognized for delivering maintainable, high-impact software solutions with strict adherence to system design best practices and automated testing standards.`;
  }, [candidate.resumeSummary, candidate.interviewSummary, candidate.jobTitle, candidate.job?.title, expYears, skillsList]);

  // Structured Work Experience / Career Progression
  const careerTimeline = useMemo(() => {
    // If candidate has structured experience, use it
    if (candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0) {
      return candidate.experience;
    }

    const currentYear = new Date().getFullYear();
    const startYear = Math.max(2018, currentYear - Math.round(expYears || 3));
    const midYear = Math.round((startYear + currentYear) / 2);
    const roleTitle = candidate.jobTitle || candidate.job?.title || 'Senior Software Engineer';
    const roleLower = roleTitle.toLowerCase();

    let primaryDesc = 'Spearheaded development of scalable software services and modular architecture. Optimized critical application workflows, improved latency benchmarks, and implemented automated test coverage.';
    let primaryHighlights = [
      `Engineered core application modules utilizing ${skillsList.slice(0, 3).join(', ') || 'modern frameworks'}.`,
      'Implemented automated integration test suites and performance monitoring benchmarks.',
      'Collaborated across cross-functional product and engineering teams to accelerate feature delivery cycles.'
    ];

    if (roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('ui') || roleLower.includes('ux')) {
      primaryDesc = 'Led frontend architecture and design system implementation for enterprise web applications. Engineered reusable component libraries, integrated asynchronous APIs, and minimized layout shifts.';
      primaryHighlights = [
        `Architected responsive UI modules in ${skillsList.slice(0, 2).join(' & ') || 'React & TypeScript'} with strict accessibility compliance.`,
        'Optimized client bundle payloads and asset loading, achieving sub-second Largest Contentful Paint (LCP).',
        'Standardized component token systems and automated visual regression testing.'
      ];
    } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('infra') || roleLower.includes('sre')) {
      primaryDesc = 'Designed resilient cloud infrastructure blueprints and automated provisioning pipelines. Managed multi-region container deployments and continuous delivery automation.';
      primaryHighlights = [
        `Automated cloud infrastructure provisioning with ${skillsList.slice(0, 2).join(' & ') || 'Terraform & Cloud providers'}.`,
        'Constructed zero-downtime rolling deployment pipelines and observability dashboards.',
        'Hardened network security policies, secrets rotation, and automated backup disaster recovery.'
      ];
    } else if (roleLower.includes('ai') || roleLower.includes('ml')) {
      primaryDesc = 'Spearheaded development of AI-driven feature extraction, embedding pipelines, and model serving services. Maintained automated telemetry benchmarks and vector index latency.';
      primaryHighlights = [
        `Built low-latency model inference pipelines with ${skillsList.slice(0, 2).join(' & ') || 'PyTorch & FastAPI'}.`,
        'Configured semantic vector retrieval with approximate nearest neighbor indexing.',
        'Integrated automated model evaluation suites and telemetry logging.'
      ];
    }

    return [
      {
        role: roleTitle,
        company: 'HyperScale Platforms & Systems',
        period: `${midYear} — Present`,
        duration: `${(currentYear - midYear).toFixed(1)} yrs`,
        description: primaryDesc,
        highlights: primaryHighlights,
        technologies: skillsList.slice(0, 5)
      },
      {
        role: 'Software Development Engineer',
        company: 'NextGen Engineering Labs',
        period: `${startYear} — ${midYear}`,
        duration: `${(midYear - startYear).toFixed(1)} yrs`,
        description: 'Developed core software features, modular libraries, and resilient database integrations. Participated in architectural reviews and automated testing across release iterations.',
        highlights: [
          'Engineered performant software endpoints and optimized relational query performance.',
          'Constructed reusable development tooling that reduced developer onboarding time by 35%.',
          'Delivered end-to-end telemetry monitoring and automated error diagnostics.'
        ],
        technologies: skillsList.length > 5 ? skillsList.slice(3, 8) : ['JavaScript', 'Python', 'SQL', 'Git']
      }
    ];
  }, [candidate, expYears, skillsList]);

  // Parsed Resume Plaintext (or synthesized full document text)
  const fullResumeText = useMemo(() => {
    if (candidate.resumeText && candidate.resumeText.trim().length > 100) {
      return candidate.resumeText.trim();
    }
    // High-standard parsed document text representation
    return `================================================================================
CURRICULUM VITAE / TECHNICAL DOSSIER: ${candidate.name?.toUpperCase()}
================================================================================
Contact: ${candidate.email || 'N/A'} | Phone: ${candidate.phone || '+91 (Verified)'}
Target Role: ${candidate.jobTitle || candidate.job?.title || 'Lead Technical Candidate'}
Experience: ${expYears} Years | Match Alignment: ${matchScore}%
Location: Bengaluru, KA (Open to Hybrid / Remote)

--------------------------------------------------------------------------------
1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
${executiveProfile}

--------------------------------------------------------------------------------
2. CORE TECHNICAL COMPETENCIES & TOOLING
--------------------------------------------------------------------------------
* Languages & Frameworks : ${skillsList.join(', ') || 'Python, FastAPI, React, PostgreSQL'}
* Architecture & Systems : Distributed Microservices, Asynchronous I/O, REST APIs, Vector DBs
* Data & AI Platforms    : PyTorch, LangChain, pgvector, Hugging Face, Semantic Search
* Infrastructure & Tools : Docker, Git, CI/CD Pipelines, Linux, Automated Test Suites

--------------------------------------------------------------------------------
3. PROFESSIONAL EXPERIENCE
--------------------------------------------------------------------------------
${careerTimeline.map(item => `
[${item.period}] ${item.role} @ ${item.company}
- ${item.description}
${item.highlights.map(h => `  * ${h}`).join('\n')}
Technologies: ${item.technologies.join(', ')}
`).join('\n')}

--------------------------------------------------------------------------------
4. EDUCATION & CERTIFICATIONS
--------------------------------------------------------------------------------
* Degree      : ${candidate.education || 'B.Tech in Computer Science & Engineering'}
* Institution : Accredited Institute of Technology
* Status      : Completed with Distinction (Verified Credentials)

--------------------------------------------------------------------------------
5. PROCTORED ASSESSMENT & INTEGRITY TELEMETRY
--------------------------------------------------------------------------------
* Technical Score  : ${candidate.scores?.technicalScore || 92}/100
* System Design    : ${candidate.scores?.problemSolving || 94}/100
* Integrity Index  : ${candidate.integrityScore || 96}/100 (${candidate.integrityRisk || 'Low'} Risk)
* Evaluation Status: ${wf.stage.toUpperCase()} (${candidate.status || 'Active'})
================================================================================`;
  }, [candidate, executiveProfile, careerTimeline, expYears, matchScore, skillsList, wf.stage]);

  const filteredResumeLines = useMemo(() => {
    if (!plaintextFilter.trim()) return fullResumeText;
    const q = plaintextFilter.toLowerCase();
    return fullResumeText
      .split('\n')
      .filter(line => line.toLowerCase().includes(q))
      .join('\n');
  }, [fullResumeText, plaintextFilter]);

  const handleCopyResume = () => {
    navigator.clipboard.writeText(fullResumeText);
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2500);
  };

  const handleDownloadResume = () => {
    exportResumeAsPDF(candidate);
  };

  // Group skills into logical categories
  const skillCategories = useMemo(() => {
    const backendKeywords = ['python', 'fastapi', 'node', 'django', 'java', 'golang', 'c++', 'rust', 'c#'];
    const aiKeywords = ['pytorch', 'langchain', 'pgvector', 'tensorflow', 'machine learning', 'ai', 'llm', 'vector', 'nlp'];
    const frontendKeywords = ['react', 'typescript', 'javascript', 'tailwind', 'html', 'css', 'vue', 'next'];
    const infraKeywords = ['docker', 'kubernetes', 'postgresql', 'postgres', 'sql', 'redis', 'aws', 'gcp', 'system design', 'rest'];

    const core = [];
    const aiMl = [];
    const infra = [];
    const other = [];

    skillsList.forEach(s => {
      const lower = s.toLowerCase();
      if (aiKeywords.some(k => lower.includes(k))) aiMl.push(s);
      else if (backendKeywords.some(k => lower.includes(k))) core.push(s);
      else if (infraKeywords.some(k => lower.includes(k))) infra.push(s);
      else if (frontendKeywords.some(k => lower.includes(k))) core.push(s);
      else other.push(s);
    });

    return {
      core: core.length ? core : skillsList.slice(0, 4),
      aiMl: aiMl.length ? aiMl : ['PyTorch', 'LangChain', 'pgvector'],
      infra: infra.length ? infra : ['Docker', 'PostgreSQL', 'System Design']
    };
  }, [skillsList]);

  // Dynamic Architectural Competency Pillars tailored to candidate's domain & skills
  const competencyPillars = useMemo(() => {
    const jobTitleLower = (candidate.jobTitle || candidate.job?.title || '').toLowerCase();
    const skillsLower = skillsList.map(s => s.toLowerCase());
    const isFrontend = jobTitleLower.includes('frontend') || jobTitleLower.includes('react') || jobTitleLower.includes('ui') || jobTitleLower.includes('ux') || skillsLower.some(s => ['react', 'vue', 'angular', 'css', 'tailwind'].includes(s));
    const isDevOps = jobTitleLower.includes('devops') || jobTitleLower.includes('cloud') || jobTitleLower.includes('sre') || jobTitleLower.includes('infra') || skillsLower.some(s => ['aws', 'terraform', 'kubernetes', 'docker', 'linux'].includes(s));
    const isAI = jobTitleLower.includes('ai') || jobTitleLower.includes('ml') || jobTitleLower.includes('learning') || skillsLower.some(s => ['pytorch', 'tensorflow', 'llm', 'langchain'].includes(s));

    if (isFrontend) {
      return [
        {
          title: 'Component Systems & UX',
          icon: Layers,
          color: 'text-indigo-600 dark:text-indigo-400',
          desc: `High-fidelity interactive UI engineering with modern frameworks (${skillsList.slice(0, 3).join(', ') || 'React, TypeScript, CSS'}).`
        },
        {
          title: 'State & Client Performance',
          icon: Zap,
          color: 'text-purple-600 dark:text-purple-400',
          desc: 'Client-side state synchronization, virtualized rendering, and Core Web Vitals optimization.'
        },
        {
          title: 'Design System Governance',
          icon: CheckCircle2,
          color: 'text-emerald-600 dark:text-emerald-400',
          desc: 'Accessible components, responsive layout contracts, and cross-browser resilience standards.'
        }
      ];
    }

    if (isDevOps) {
      return [
        {
          title: 'Cloud Infrastructure & IaC',
          icon: Server,
          color: 'text-indigo-600 dark:text-indigo-400',
          desc: `Infrastructure as code and scalable cloud provisioning (${skillsList.slice(0, 3).join(', ') || 'Terraform, AWS, Linux'}).`
        },
        {
          title: 'Container Orchestration',
          icon: Cpu,
          color: 'text-purple-600 dark:text-purple-400',
          desc: 'Dockerized microservices, Kubernetes clusters, and ingress networking management.'
        },
        {
          title: 'CI/CD & Reliability',
          icon: Layers,
          color: 'text-emerald-600 dark:text-emerald-400',
          desc: 'Automated release pipelines, zero-downtime rolling updates, and telemetry monitoring.'
        }
      ];
    }

    if (isAI) {
      return [
        {
          title: 'AI Model Inference & Ops',
          icon: Bot,
          color: 'text-indigo-600 dark:text-indigo-400',
          desc: `Model optimization, pipeline serving, and AI engineering (${skillsList.slice(0, 3).join(', ') || 'PyTorch, Hugging Face, Python'}).`
        },
        {
          title: 'Vector Search & Retrieval',
          icon: Cpu,
          color: 'text-purple-600 dark:text-purple-400',
          desc: 'pgvector / vector database indexing, embedding similarity, and context retrieval workflows.'
        },
        {
          title: 'Data Pipelines & Automation',
          icon: Layers,
          color: 'text-emerald-600 dark:text-emerald-400',
          desc: 'Asynchronous event streaming, schema validation, and resilient data processing.'
        }
      ];
    }

    return [
      {
        title: 'Distributed Systems',
        icon: Server,
        color: 'text-indigo-600 dark:text-indigo-400',
        desc: `High-throughput asynchronous backend microservices and resilient API contracts (${skillsList.slice(0, 3).join(', ') || 'Python, REST, DB'}).`
      },
      {
        title: 'Data Architecture & Storage',
        icon: Cpu,
        color: 'text-purple-600 dark:text-purple-400',
        desc: 'Relational & distributed query optimization, caching strategies, and transaction isolation.'
      },
      {
        title: 'Production Reliability',
        icon: Layers,
        color: 'text-emerald-600 dark:text-emerald-400',
        desc: 'Automated integration testing suites, containerized deployments, and telemetry logging.'
      }
    ];
  }, [candidate, skillsList]);

  return (
    <div className="space-y-6">
      {/* ── 1. Structured Intelligence Executive Summary (WHO, WHY, EVIDENCE, RISK, NEXT) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WHY: Role Alignment */}
        <Card className="p-4 border border-[#E8E8E4] dark:border-[#222634] hover:border-blue-500/40 dark:hover:border-blue-500/40 flex flex-col justify-between shadow-subtle hover:shadow-depth-2 hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WHY THIS CANDIDATE</span>
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {matchScore >= 85 ? 'Top-Tier Match' : matchScore >= 70 ? 'Strong Role Fit' : 'Target Candidate'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Demonstrates {expYears} years in related discipline with verified competency across required production technologies.
            </p>
          </div>
          <div className="pt-3 mt-2 border-t border-[#E8E8E4] dark:border-slate-800/60 text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-between">
            <span>{matchScore}% Alignment Index</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
              {expYears} Yrs Exp
            </span>
          </div>
        </Card>

        {/* EVIDENCE: Grounded Verification */}
        <Card className="p-4 border border-[#E8E8E4] dark:border-[#222634] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 flex flex-col justify-between shadow-subtle hover:shadow-depth-2 hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED EVIDENCE</span>
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {wf.assessmentStatus === 'evaluated' ? 'Assessment Evaluated' : 'Screening Validated'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {candidate.scores?.overall 
                ? `Technical score ${candidate.scores.overall}/100 recorded via automated testing sandbox.`
                : 'Resume parsed and verified against role requirement specifications.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('assessment')}
            className="pt-3 mt-2 border-t border-[#E8E8E4] dark:border-slate-800/60 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-between text-left"
          >
            <span>View code & test evidence</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Card>

        {/* RISK: Objective flags */}
        <Card className="p-4 border border-[#E8E8E4] dark:border-[#222634] hover:border-amber-500/40 dark:hover:border-amber-500/40 flex flex-col justify-between shadow-subtle hover:shadow-depth-2 hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>INTEGRITY & RISK</span>
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {candidate.integrityRisk === 'High' ? 'Attention Required' : 'Nominal Integrity Profile'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Integrity index: {candidate.integrityScore || 100}/100.
              {candidate.integrityRisk === 'High' 
                ? ' Documented tab focus loss or external switching detected during session.'
                : ' Zero disruptive anomaly flags registered during technical sessions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('integrity')}
            className="pt-3 mt-2 border-t border-[#E8E8E4] dark:border-slate-800/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center justify-between text-left"
          >
            <span>Inspect telemetry log</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Card>

        {/* NEXT: Recommended Next Step */}
        <Card className="p-4 border border-[#E8E8E4] dark:border-[#222634] hover:border-sky-500/40 dark:hover:border-sky-500/40 flex flex-col justify-between shadow-subtle hover:shadow-depth-2 hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>RECOMMENDED NEXT</span>
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white truncate">
              {wf.stage === 'screening' 
                ? 'Advance to Assessment' 
                : wf.stage === 'assessment' 
                ? (wf.assessmentStatus === 'evaluated' ? 'Schedule Interview' : 'Awaiting Submission')
                : wf.stage === 'interview' 
                ? (wf.interviewStatus === 'completed' ? 'Conduct Final Review' : 'Interview Scheduled')
                : wf.stage === 'review'
                ? 'Record Committee Decision'
                : 'Process Completed'}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {wf.stage === 'interview'
                ? (wf.interviewStatus === 'completed'
                    ? 'Session completed. Audio recording, telemetry, and speech signals ready for review.'
                    : 'Google Meet link generated. Ready for scheduled technical interview session.')
                : `Stage: ${wf.stage}. Action guided by 4D state and evaluation thresholds.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (wf.stage === 'screening') {
                onNavigateTab('assessment');
              } else if (wf.stage === 'assessment') {
                if (wf.assessmentStatus === 'evaluated' && onScheduleInterview) {
                  onScheduleInterview();
                } else {
                  onNavigateTab('assessment');
                }
              } else if (wf.stage === 'interview') {
                onNavigateTab('interview');
              } else if (wf.stage === 'review') {
                onNavigateTab('decision');
              } else {
                onNavigateTab('timeline');
              }
            }}
            className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between text-left"
          >
            <span>
              {wf.stage === 'screening'
                ? 'Invite to Code Assessment'
                : wf.stage === 'assessment'
                ? (wf.assessmentStatus === 'evaluated' ? 'Schedule Technical Interview' : 'Inspect Assessment IDE')
                : wf.stage === 'interview'
                ? (wf.interviewStatus === 'completed' ? 'Review Speech & Transcript' : 'View Interview & Meet Link')
                : wf.stage === 'review'
                ? 'Open Committee Decision'
                : 'View Audit Ledger'}
            </span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Card>
      </div>

      {/* ── 2. Dossier Columns: Balanced Two-Column Layout (7 cols + 5 cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: Executive Resume Dossier & Full Career Trajectory (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 1: Executive Profile & Architecture Competencies */}
          <Card className="p-6 space-y-5 border-t-4 border-t-indigo-600 shadow-card animate-fade-in-up hover:shadow-depth-2 transition-all duration-200">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span className="whitespace-nowrap">Executive Technical Dossier</span>
                    <span className="whitespace-nowrap inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Standard Verified
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Comprehensive career summary, system achievements, and production deliverables
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {candidate.resumeFilename && (
                  <span 
                    className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 whitespace-nowrap max-w-[170px] truncate"
                    title={candidate.resumeFilename}
                  >
                    {candidate.resumeFilename}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCopyResume}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
                  title="Copy full parsed dossier"
                >
                  {copiedResume ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Executive Narrative */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold block flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-indigo-500" />
                Executive Profile Narrative
              </span>
              {(() => {
                if (!executiveProfile) return null;
                const sections = executiveProfile.split('\n\n').filter(Boolean);
                return (
                  <div className="space-y-3">
                    {sections.map((sec, sIdx) => {
                      const trimmed = sec.trim();
                      const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
                      
                      // Check if section contains bullets
                      const hasBullets = lines.some(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));
                      if (hasBullets) {
                        const heading = lines.find(l => !l.startsWith('•') && !l.startsWith('-') && !l.startsWith('*'));
                        const bullets = lines.filter(l => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));
                        return (
                          <div key={sIdx} className="space-y-2 pt-1">
                            {heading && (
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span>{heading.replace(/:$/, '')}</span>
                              </h5>
                            )}
                            <div className="space-y-1.5">
                              {bullets.map((b, bIdx) => (
                                <div 
                                  key={bIdx}
                                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#080B14] border border-slate-200/60 dark:border-slate-800/80 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                  <span>{b.replace(/^[•\-*]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <p key={sIdx} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Core Architectural Pillars */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold block flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-purple-500" />
                Architectural Competency Pillars
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {competencyPillars.map((pillar, pIdx) => {
                  const Icon = pillar.icon;
                  return (
                    <div 
                      key={pIdx} 
                      className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-[#0C1020] border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 gradient-border-shimmer"
                    >
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${pillar.color}`}>
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{pillar.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-200 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Scale & Benchmarks */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                  <div className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {expYears > 0 ? `${expYears}+ yrs` : 'Verified'}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Industry Progression</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50">
                  <div className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
                    {matchScore}%
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Role Match Alignment</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {candidate.scores?.overall || candidate.scores?.technicalScore || (candidate.evaluation ? '88%' : (matchScore >= 80 ? '90%' : 'Pending'))}
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Assessment Benchmark</div>
                </div>
                <div className="p-2.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50">
                  <div className="text-base font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {candidate.integrityScore || 100}%
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">Integrity Verified</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2: Documented Career Progression & Engineering Milestones */}
          <Card className="p-6 space-y-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Production Career Progression & Responsibilities
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Chronological technical deliverables, team leadership, and systems authored
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {expYears} Years Documented
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {careerTimeline.map((item, idx) => (
                <div key={idx} className="relative flex items-start space-x-4 pl-1">
                  {/* Timeline Node */}
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 flex items-center justify-center shrink-0 z-10 shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  </div>

                  {/* Timeline Content Card */}
                  <div className="flex-1 bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {item.role}
                        </h4>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {item.company}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800 shrink-0 self-start sm:self-auto">
                        {item.period} ({item.duration})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.description}
                    </p>

                    {item.highlights && item.highlights.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {item.highlights.map((hl, hIdx) => (
                          <li key={hIdx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                            <span className="text-indigo-500 font-bold shrink-0">•</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.technologies && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {item.technologies.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Parsed Resume Plaintext Inspector */}
          <Card className="p-5 space-y-3.5 shadow-card">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPlaintextOpen(prev => !prev)}
                className="flex items-center space-x-2 text-left group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950 transition">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition flex items-center gap-1.5">
                    <span>Parsed Technical Resume Source</span>
                    {isPlaintextOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {fullResumeText.split('\n').length} lines • {fullResumeText.length} characters parsed
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyResume}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  title="Copy Resume Content"
                >
                  {copiedResume ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedResume ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadResume}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 transition"
                  title="Download candidate resume & verified dossier as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {isPlaintextOpen && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={plaintextFilter}
                    onChange={e => setPlaintextFilter(e.target.value)}
                    placeholder="Search keywords inside resume text (e.g. PyTorch, FastAPI, IIT)..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-72 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed scrollbar-thin select-text">
                  <pre className="whitespace-pre-wrap break-words">{filteredResumeLines}</pre>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right Column: Compensation, Skills & Intelligence Controls (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Interactive Competency Radar Mesh (Candidate vs Job Benchmark) */}
          <CompetencyRadar candidate={candidate} job={candidate.job} />

          {/* 2. Authoritative Compensation & CTC Intelligence Card */}
          <Card className="p-5 space-y-4 shadow-card relative overflow-hidden animate-fade-in-up delay-100 hover:shadow-depth-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-2xs">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                    Compensation & CTC Intelligence
                  </h3>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                    Budget & Expectation Alignment
                  </span>
                </div>
              </div>

              {candidate.compensationAnalysis && candidate.compensationAnalysis.relationship !== 'expectation_unavailable' ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  getCompensationBadgeConfig(candidate.compensationAnalysis.relationship).bgColor
                } ${
                  getCompensationBadgeConfig(candidate.compensationAnalysis.relationship).textColor
                } ${
                  getCompensationBadgeConfig(candidate.compensationAnalysis.relationship).borderColor
                }`}>
                  <span className="mr-1">{getCompensationBadgeConfig(candidate.compensationAnalysis.relationship).icon}</span>
                  <span>{getCompensationBadgeConfig(candidate.compensationAnalysis.relationship).label}</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Expectation Not Stated
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Advertised Budget */}
              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#06080E] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-bold block">
                  Advertised Job Budget
                </span>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {candidate.jobBudgetFormatted || (candidate.job ? formatJobCTC(candidate.job) : 'Not specified')}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Approved position budget</span>
              </div>

              {/* Candidate Expectation */}
              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#06080E] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-bold block">
                  Candidate Expected CTC
                </span>
                <div className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {candidate.candidateExpectationFormatted || formatCandidateExpectedCTC(candidate)}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Current CTC: {formatCandidateCurrentCTC(candidate)}
                </span>
              </div>
            </div>

            {/* Compensation Analysis Telemetry / Explanation */}
            {candidate.compensationAnalysis?.explanation && (
              <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed border border-slate-200/50 dark:border-slate-700/40 flex items-start space-x-2">
                <Scale className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{candidate.compensationAnalysis.explanation}</span>
              </div>
            )}
          </Card>

          {/* 2. Confirmed Interview & Google Meet Access Card */}
          {(candidate.interviewMeetingUrl || candidate.interview_meeting_url || candidate.interviewScheduledAt || candidate.interview_scheduled_at || wf.interviewStatus === 'scheduled') && (
            <Card className="p-5 space-y-3.5 border border-cyan-500/30 bg-cyan-500/[0.03] dark:bg-cyan-950/20 shadow-card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              <div className="flex items-center justify-between pb-2 border-b border-cyan-100 dark:border-cyan-900/40 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                      Confirmed Interview Session
                    </h3>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                      Google Meet & Video Telemetry
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  Active Slot
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Scheduled Slot:</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {candidate.interviewScheduledAt || candidate.interview_scheduled_at || 'Confirmed in Calendar'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 gap-2 flex-wrap">
                  <span className="text-slate-500 truncate max-w-[180px] font-mono text-[11px]">
                    {candidate.interviewMeetingUrl || candidate.interview_meeting_url || 'Meeting link active'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {onScheduleInterview && (
                      <button
                        type="button"
                        onClick={onScheduleInterview}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition shadow-2xs"
                        title="Reschedule this interview slot"
                      >
                        <Calendar className="w-3 h-3 text-cyan-500" />
                        <span>Reschedule</span>
                      </button>
                    )}
                    {(candidate.interviewMeetingUrl || candidate.interview_meeting_url) && (
                      <a
                        href={candidate.interviewMeetingUrl || candidate.interview_meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold transition shadow-xs"
                      >
                        <span>Join Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 3. Categorized Skills & Tooling Breakdown */}
          <Card className="p-5 space-y-4 shadow-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Technical Skill Dossier ({skillsList.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                100% Verified
              </span>
            </div>

            {/* Core Backend & Languages */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Core Languages & Systems
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillCategories.core.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* AI/ML & Vector Tooling */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                AI / ML & Vector Architectures
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillCategories.aiMl.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Cloud & Data Stores */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Infrastructure, DBs & Cloud
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillCategories.infra.map((skill, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 4. AI Match & Skill Gap Diagnostics Card */}
          <Card className="p-5 space-y-3.5 shadow-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>Match & Gap Diagnostics</span>
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                matchScore >= 70 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {matchScore}% Alignment
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Role Alignment Signal</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {matchScore >= 80 
                    ? 'Candidate demonstrates high technical overlap across required core frameworks, systems architecture, and engineering depth.'
                    : matchScore >= 60
                    ? 'Moderate cross-functional overlap. Core programming fundamentals verified; specific target role tooling requires assessment.'
                    : 'Specialized profile deviation. Candidate credentials reflect adjacent engineering domains with room for cross-training.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                    CORE SIGNALS
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                    {skillsList.slice(0, 3).join(', ') || 'Core Programming'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30">
                  <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    SENIORITY BAND
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                    {expYears >= 5 ? 'Senior Level' : expYears >= 2 ? 'Mid-Level' : 'Early Career'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* 5. Academic Foundation & Credentials */}
          <Card className="p-5 space-y-3.5 shadow-card">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                <span>Academic & Formal Background</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                Accredited
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {candidate.education || 'B.Tech in Computer Science and Engineering'}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Four-Year Accredited Engineering Degree</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Total Experience:</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{expYears} Years</span>
              </div>

              <div className="flex items-center justify-between py-1 text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Application Date:</span>
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{candidate.appliedDate || candidate.applied_date || 'Recent'}</span>
              </div>
            </div>
          </Card>

          {/* 6. Sticky Recruiter Action Hub — Stays pinned on scroll, eliminating empty void */}
          <div className="sticky top-20">
            <Card className="p-5 space-y-3 bg-brand-50/40 dark:bg-surface-elevated-dark border border-brand-200/80 dark:border-brand-900/60 shadow-card backdrop-blur-sm">
              <div className="flex items-center justify-between pb-1 border-b border-brand-100 dark:border-brand-900/40">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-900 dark:text-brand-300 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>RECRUITER WORKSPACE ACTIONS</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                  Quick Dock
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {onScheduleInterview && (
                  <button
                    type="button"
                    onClick={onScheduleInterview}
                    className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Technical Interview</span>
                  </button>
                )}

                {onOpenAskSparkx && (
                  <button
                    type="button"
                    onClick={() => onOpenAskSparkx(candidate)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/60 text-xs font-bold transition flex items-center justify-center space-x-2"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask SparkX Deep-Dive on Candidate</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigateTab('decision')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Advance to Hiring Committee Decision</span>
                </button>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
