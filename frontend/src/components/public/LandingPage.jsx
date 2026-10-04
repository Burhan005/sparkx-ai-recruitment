import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import LandingCursor from './LandingCursor';
import ScrollReveal from './ScrollReveal';
import { TypingTerminal, TiltCard, MagneticWrap, GradientDivider } from './HomeExtras';
import { useRecruitment } from '../../context/RecruitmentContext';
import { useSmoothNavigate } from '../../context/PageTransitionContext';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  Zap, 
  Brain, 
  Video, 
  Code2, 
  Scale, 
  FileText, 
  Users, 
  Lock, 
  Globe, 
  Mail, 
  Building2, 
  Layers, 
  ChevronRight,
  ChevronUp,
  Send,
  Compass,
  Database,
  LogIn,
  X,
  ExternalLink,
  Play
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userRole } = useRecruitment();
  const { smoothNavigate } = useSmoothNavigate();
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  // Preload Auth chunk in background for instant transition
  useEffect(() => {
    const timer = setTimeout(() => {
      import('../auth/LoginScreen');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', company: '', message: '' });
      setContactSubmitted(false);
    }, 4000);
  };

  // Scroll listener for top photon bar and hero depth parallax
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);
      const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalDocHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScroll / totalDocHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close feature modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedFeature(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const FEATURE_DETAILS = {
    ide: {
      title: 'Interactive Coding IDE & Sandbox',
      badge: 'Multi-Language • Subprocess & Judge0 Sandboxing',
      color: 'brand',
      icon: Terminal,
      description: 'Monaco-powered coding environment featuring real-time syntax checking, live isolated test runners, and schema viewers for SQL problems with zero browser lag.',
      capabilities: [
        'Multi-Language Execution: Python 3.11+, JavaScript/TypeScript (Node.js), SQLite, C, C++, Java, Go, Rust',
        'Real-Time Feedback: Instant compiler feedback, line-by-line syntax diagnostics, and output diff against test fixtures',
        'Secure Execution Sandbox: 5000ms wall-clock timeout and isolated memory guards preventing infinite loops and runaway tasks',
        'Live SQL Engine: SQLite in-memory runner with built-in schema tables and row-comparison validation',
        'Anti-Cheat Evidence: Tracks keystroke patterns, paste volumes, and code edit snapshots directly in candidate audit records'
      ],
      primaryAction: { label: 'Test Live Interactive Sandbox Below', action: 'scroll-simulation' },
      secondaryAction: { label: 'Explore Job Catalog', path: '/jobs' }
    },
    proctor: {
      title: 'Live AI Proctoring Monitor',
      badge: 'Computer Vision • Biometric Telemetry HUD',
      color: 'emerald',
      icon: ShieldCheck,
      description: 'Real-time anti-cheating intelligence suite analyzing camera feed, audio stream, and browser environment to establish candidate assessment integrity.',
      capabilities: [
        'Face Presence & Head Pose: Local browser-based model verifying candidate presence without streaming raw video externally',
        'Focus & Tab Blurs: Real-time logging of window blur, secondary tab focus, and external clipboard copy-paste events',
        'Acoustic Anomaly Detection: Detects secondary voices and ambient acoustic shifts in the examination space',
        'Recruiter Telemetry HUD: Real-time integrity score (0-100%) visible directly on candidate dossiers with chronological incident logs',
        'Fairness & EEOC Compliance: Flags provide auditable evidence for human review without biased automated disqualifications'
      ],
      primaryAction: { label: 'View Recruiter Workspace', path: '/recruiter' },
      secondaryAction: { label: 'Browse Job Catalog', path: '/jobs' }
    },
    integrations: {
      title: 'External Coding Platform Integrations',
      badge: 'HackerRank • LeetCode • CodeSignal • Judge0',
      color: 'teal',
      icon: Globe,
      description: 'Unify assessment workflows across major coding test providers with standardized score synchronization and question bank browsing.',
      capabilities: [
        'HackerRank for Work REST API: Dynamic test creation, candidate invitation links, and automated percentile synchronization',
        'LeetCode Verified Links: Tracked challenge sessions with recruiter verification and solution review',
        'CodeSignal Enterprise: Direct score import into SparkX candidate evidence timelines',
        'Judge0 Cloud/Self-Hosted Engine: 50+ programming language compilers on-demand with Docker isolation',
        'Centralized Evidence Dossier: All external test submissions stored alongside interview notes and resume benchmarks'
      ],
      primaryAction: { label: 'Open Assessment Studio', path: '/recruiter' },
      secondaryAction: { label: 'View Candidate Pipeline', path: '/recruiter' }
    },
    copilot: {
      title: 'Ask SparkX AI Copilot',
      badge: 'Gemini 2.5 • xAI Grok • Multi-Model Orchestration',
      color: 'amber',
      icon: Cpu,
      description: 'Autonomous recruitment copilot that answers deep queries across candidate pools, generates role-specific interview rubrics, and analyzes compensation fits.',
      capabilities: [
        'Natural Language Pipeline Queries: Ask complex cross-candidate questions like "Who has the best system design score in backend?"',
        'Dynamic Question Generation: Synthesizes tailored technical questions aligned with specific candidate resume weaknesses',
        'Multi-Model Fallback: Seamless switching between Gemini Pro, Grok, and offline deterministic semantic search',
        'Zero Data Retention: Candidate PII is scrubbed before LLM processing in accordance with enterprise confidentiality standards',
        'Decision Memos: Formulates structured, evidence-backed hiring summaries for committee review'
      ],
      primaryAction: { label: 'Launch Recruiter Copilot', path: '/recruiter' },
      secondaryAction: { label: 'View Applications', path: '/jobs' }
    },
    compensation: {
      title: 'Algorithmic Compensation Engine',
      badge: 'Salary Guardrails • Budget Compliance',
      color: 'purple',
      icon: Scale,
      description: 'Real-time CTC validation and compensation modeling ensuring candidate expectations align with authorized role brackets before offer stages.',
      capabilities: [
        'Budget Bracket Guardrails: Real-time validation preventing out-of-policy negotiations beyond approved departmental budgets',
        'Currency & Cost-of-Living: Dynamic multi-currency conversions across USD, INR, EUR, and GBP with regional market indexing',
        'Variable Component Structuring: Clear breakdown across base salary, annual bonuses, retention incentives, and equity grants',
        'Executive Approval Routing: Automated sign-off workflows for candidates requesting top-of-bracket compensation',
        'Offer Letter Dispatch: One-click formatted offer letters delivered directly through candidate and recruiter portals'
      ],
      primaryAction: { label: 'View Candidate Pipeline', path: '/recruiter' },
      secondaryAction: { label: 'Browse Jobs', path: '/jobs' }
    },
    meet: {
      title: 'Google Meet & Live SMTP Service',
      badge: 'Google Meet API • Live SMTP Relays • ICS Calendar Invites',
      color: 'rose',
      icon: Mail,
      description: 'Enterprise interview scheduling engine with automated Google Meet video links, interactive calendar sync, and real-time candidate notifications.',
      capabilities: [
        'Instant Google Meet Generation: Generates unique, enterprise video interview rooms on interview scheduling',
        'Live SMTP Relays: Automated branded emails for interview invitations, reminder pings, and status milestone changes',
        'Universal Calendar (.ics) Sync: Seamless calendar events for Google Calendar, Microsoft Outlook, and Apple Mail',
        'Candidate Reschedule Workflow: Structured reschedule requests allowing candidates to propose alternate slots without phone tag',
        'Secure Identity Verification: Dispatches 6-digit one-time password (OTP) codes for account recovery and identity audits'
      ],
      primaryAction: { label: 'View Recruiter Schedule', path: '/recruiter' },
      secondaryAction: { label: 'Browse Jobs', path: '/jobs' }
    }
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Respect prefers-reduced-motion for hero animations
  const prefersReduced = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#110F0D] text-stone-900 dark:text-stone-100 selection:bg-brand-500/20 selection:text-brand-700 dark:selection:text-brand-300 transition-colors duration-200">
      
      {/* ── Interactive Magnetic Trailing Cursor Demo ── */}
      <LandingCursor />

      {/* ── Public Sticky Navigation ── */}
      <PublicNavbar />

      <main className="space-y-24 sm:space-y-32 pb-24">

        {/* ── HERO SECTION (#home) ── */}
        <section 
          id="home" 
          onMouseMove={handleMouseMove}
          className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto text-center overflow-visible"
        >
          {/* Interactive Mouse Spotlight on Desktop */}
          <div 
            className="hidden sm:block absolute inset-0 pointer-events-none -z-10 transition-opacity duration-300"
            style={{
              background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(13, 148, 136, 0.08), transparent 70%)`
            }}
          />

          <div 
            className="max-w-4xl mx-auto space-y-6"
          >
            
            {/* Pill Header — Glassmorphic Specular Badge with Live Radar Ping */}
            <div className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#1A1714]/85 border border-stone-200/90 dark:border-stone-800/90 shadow-2xs hover:border-brand-500/40 dark:hover:border-brand-500/40 hover:shadow-md hover:shadow-brand-500/10 transition-all duration-300 cursor-default group backdrop-blur-md select-none ${prefersReduced ? '' : 'animate-fade-in-up'}`}>
              <div className="w-5 h-5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:rotate-12 transition-transform duration-300">
                <Sparkles className="w-3 h-3 text-brand-600 dark:text-brand-400" />
              </div>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-tight">
                Next-Generation Autonomous Recruitment Intelligence
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span className="text-[10px] font-mono font-bold text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-[#24201C] border border-stone-200/80 dark:border-stone-800">
                v2.5
              </span>
            </div>

            {/* Main Headline — staggered reveal with continuous 5.5s living aurora sweep */}
            <div className="relative overflow-visible">
              {/* Dual Atmospheric Cosmic Plasma Orbs & Ambient Stardust */}
              <div 
                className="absolute top-1/2 left-1/2 w-[780px] max-w-full h-[360px] pointer-events-none -z-10 select-none overflow-visible"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <div className="absolute -top-12 left-10 w-[360px] sm:w-[440px] h-[220px] rounded-full bg-gradient-to-tr from-brand-600/25 via-teal-500/20 to-cyan-400/15 blur-[65px] animate-plasma-1" />
                <div className="absolute -bottom-10 right-10 w-[320px] sm:w-[400px] h-[210px] rounded-full bg-gradient-to-br from-amber-500/22 via-rose-500/14 to-teal-500/16 blur-[70px] animate-plasma-2" />
                
                {/* Floating ambient stardust constellations */}
                <div className="hidden sm:block absolute top-[12%] left-[10%] w-2 h-2 rounded-full bg-teal-400 animate-stardust-1 shadow-[0_0_12px_rgba(45,212,191,1)]" />
                <div className="hidden sm:block absolute top-[18%] right-[12%] w-2.5 h-2.5 rounded-full bg-amber-400 animate-stardust-2 shadow-[0_0_14px_rgba(245,158,11,1)]" />
                <div className="hidden sm:block absolute bottom-[18%] left-[16%] w-2 h-2 rounded-full bg-cyan-400 animate-stardust-3 shadow-[0_0_12px_rgba(56,189,248,1)]" />
                <div className="hidden sm:block absolute bottom-[14%] right-[18%] w-1.5 h-1.5 rounded-full bg-rose-400 animate-stardust-1 shadow-[0_0_8px_rgba(244,63,94,1)]" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 font-display leading-[1.18] sm:leading-[1.2] overflow-visible">
                {/* Line 1 - With generous descender clearance so 'g' is never clipped */}
                <span className="block overflow-visible pb-1 sm:pb-2">
                  <span className="relative inline-block overflow-visible">
                    {/* Celestial Diamond Star Burst Glint directly on Empirical */}
                    <span className="absolute -top-2.5 sm:-top-3.5 left-1 sm:left-3 pointer-events-none select-none">
                      <svg
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-teal-400 dark:text-teal-300 ${prefersReduced ? 'hidden' : 'animate-sparkle-burst-alt'}`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                      </svg>
                    </span>

                    {/* Delicate micro-quantum teal spark beside Empirical */}
                    <span className="absolute -top-1.5 -left-3 sm:-left-4 pointer-events-none select-none">
                      <span className="block w-2 h-2 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-300 shadow-[0_0_8px_rgba(45,212,191,0.95)] animate-micro-quantum-1" />
                    </span>

                    <span 
                      className={`inline-block text-shimmer-headline overflow-visible ${prefersReduced ? '' : 'animate-hero-reveal'}`} 
                    >
                      Empirical Hiring.
                    </span>

                    {/* Delicate micro-quantum amber spark near Hiring dot */}
                    <span className="absolute -top-2 right-[28%] pointer-events-none select-none hidden sm:block">
                      <span className="block w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-micro-quantum-2" />
                    </span>
                  </span>
                </span>
                
                {/* Line 2 */}
                <span className="block mt-1 sm:mt-2 overflow-visible pb-2 sm:pb-3">
                  <span 
                    className={`inline-block text-stone-500 dark:text-stone-400 font-normal ${prefersReduced ? '' : 'animate-hero-reveal'}`} 
                    style={prefersReduced ? {} : { animationDelay: '120ms' }}
                  >
                    Zero Bias.{' '}
                  </span>
                  <span className="relative inline-block overflow-visible">
                    {/* Delicate micro-quantum sky spark near Evidence */}
                    <span className="absolute -bottom-1 -left-3 pointer-events-none select-none">
                      <span className="block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gradient-to-tr from-sky-400 to-teal-300 shadow-[0_0_8px_rgba(56,189,248,0.95)] animate-micro-quantum-3" />
                    </span>

                    <span 
                      className={`inline-block font-bold text-shimmer-evidence overflow-visible ${prefersReduced ? '' : 'animate-hero-evidence'}`} 
                      style={prefersReduced ? {} : { animationDelay: '240ms' }}
                    >
                      Verified Evidence.
                    </span>

                    {/* Celestial Star Burst Glint on Verified Evidence */}
                    <span className="absolute -top-2.5 -right-4 sm:-right-5 pointer-events-none select-none">
                      <svg
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-amber-400 dark:text-teal-300 ${prefersReduced ? 'hidden' : 'animate-sparkle-burst'}`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                      </svg>
                    </span>

                    {/* Photon Baseline Track with travelling photon pulse */}
                    <span className="photon-beam">
                      <span className="photon-particle" />
                    </span>
                  </span>
                </span>
              </h1>
            </div>

            {/* Sub-text — appears smoothly */}
            <p 
              className={`text-sm sm:text-base md:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed ${prefersReduced ? '' : 'animate-fade-in-up'}`} 
              style={prefersReduced ? {} : { animationDelay: '180ms' }}
            >
              SparkX combines dynamic job requirement blueprinting, multi-language sandbox execution, live AI proctoring telemetry, and structured committee workflows for definitive hiring decisions.
            </p>

            {/* CTAs */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 ${prefersReduced ? '' : 'animate-fade-in-up'}`} 
              style={prefersReduced ? {} : { animationDelay: '260ms' }}
            >
              {isLoggedIn ? (
                <MagneticWrap strength={0.25}>
                  <button
                    onClick={() => smoothNavigate(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
                    className="relative group w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition shadow-md shadow-brand-950/20 hover:shadow-xl hover:shadow-teal-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span>Go to Your {userRole === 'recruiter' ? 'Recruiter Hub' : 'Job Catalog'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </MagneticWrap>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
                  <MagneticWrap strength={0.25} className="w-full sm:w-auto">
                    <button
                      onClick={() => smoothNavigate('/register')}
                      className="relative group w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-teal-600 to-brand-600 hover:from-brand-500 hover:to-teal-500 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-brand-950/25 hover:shadow-xl hover:shadow-teal-900/40 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.97] overflow-hidden"
                    >
                      {/* Ambient breathing luminous halo behind button */}
                      <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-teal-400 via-brand-500 to-emerald-400 opacity-40 blur-md group-hover:opacity-85 transition-opacity duration-500 animate-pulse-soft -z-10" />

                      {/* Silky travelling specular sheen */}
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                      <span className="relative z-10 flex items-center gap-2.5">
                        <span>Start Hiring or Apply Now</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-spring group-hover:translate-x-1.5" />
                      </span>
                    </button>
                  </MagneticWrap>

                  <MagneticWrap strength={0.2} className="w-full sm:w-auto">
                    <button
                      onClick={() => smoothNavigate('/login')}
                      className="group relative w-full sm:w-auto px-6 py-3.5 rounded-xl border border-stone-300/90 dark:border-stone-800 bg-white/75 dark:bg-[#1A1714]/80 backdrop-blur-md text-stone-800 dark:text-stone-200 hover:border-teal-500/60 dark:hover:border-teal-500/50 hover:bg-white dark:hover:bg-[#231F1B] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-900/5 dark:hover:shadow-black/40 font-semibold text-sm transition-all duration-200 cursor-pointer active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4 text-stone-400 group-hover:text-teal-500 dark:group-hover:text-teal-400 group-hover:rotate-6 transition-all duration-300" />
                      <span>Recruiter & Candidate Sign In</span>
                    </button>
                  </MagneticWrap>
                </div>
              )}
            </div>

            {/* Trust Badges Bar — Interactive Glassmorphic Chips with Dedicated Spacing */}
            <div 
              className={`pt-8 pb-3 flex flex-wrap items-center justify-center gap-3.5 text-xs font-medium ${prefersReduced ? '' : 'animate-fade-in-up'}`} 
              style={prefersReduced ? {} : { animationDelay: '340ms' }}
            >
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-[#1A1714]/75 border border-stone-200/90 dark:border-stone-800/90 hover:border-emerald-500/50 text-stone-700 dark:text-stone-300 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-default group select-none">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>EEOC & SOC2 Certified Framework</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-[#1A1714]/75 border border-stone-200/90 dark:border-stone-800/90 hover:border-brand-500/50 text-stone-700 dark:text-stone-300 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-default group select-none">
                <Terminal className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" />
                <span>Isolated Multi-Language Sandboxes</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-[#1A1714]/75 border border-stone-200/90 dark:border-stone-800/90 hover:border-teal-500/50 text-stone-700 dark:text-stone-300 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-default group select-none">
                <Scale className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                <span>Human-in-the-Loop Audit Trail</span>
              </div>
            </div>

          </div>

          {/* Hero Feature Teaser Grid — Sculpted Cards with 3D Tilt & Ambient Backglow */}
          <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left max-w-6xl mx-auto relative z-10">
            {/* Card 1: Blueprinting */}
            <TiltCard intensity={6}>
              <div className="h-full relative group p-6 rounded-2xl bg-white/85 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-brand-500/60 hover:shadow-[0_14px_36px_-8px_rgba(13,148,136,0.22)] dark:hover:shadow-[0_14px_36px_-8px_rgba(45,212,191,0.20)] transition-all duration-300 cursor-default select-none overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs shadow-brand-500/20 group-hover:scale-110 group-hover:bg-brand-500/15 transition-all duration-300">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Dynamic Blueprinting</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Assessments adapt dynamically based on actual required skills, competencies, and domain tasks — never hardcoded.
                </p>
              </div>
            </TiltCard>

            {/* Card 2: Code Execution */}
            <TiltCard intensity={6}>
              <div className="h-full relative group p-6 rounded-2xl bg-white/85 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-emerald-500/60 hover:shadow-[0_14px_36px_-8px_rgba(16,185,129,0.22)] dark:hover:shadow-[0_14px_36px_-8px_rgba(52,211,153,0.20)] transition-all duration-300 cursor-default select-none overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shadow-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/15 transition-all duration-300">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Real Code Execution</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Python, SQLite, JavaScript, and Judge0 cloud execution test candidate code against actual test cases without fake scores.
                </p>
              </div>
            </TiltCard>

            {/* Card 3: Proctoring HUD */}
            <TiltCard intensity={6}>
              <div className="h-full relative group p-6 rounded-2xl bg-white/85 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-cyan-500/60 hover:shadow-[0_14px_36px_-8px_rgba(6,182,212,0.22)] dark:hover:shadow-[0_14px_36px_-8px_rgba(34,211,238,0.20)] transition-all duration-300 cursor-default select-none overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs shadow-cyan-500/20 group-hover:scale-110 group-hover:bg-cyan-500/15 transition-all duration-300">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Integrity Telemetry</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Live proctoring HUD monitors face gaze, speech activity, and tab visibility to generate immutable candidate integrity scores.
                </p>
              </div>
            </TiltCard>

            {/* Card 4: 4-D Lifecycle */}
            <TiltCard intensity={6}>
              <div className="h-full relative group p-6 rounded-2xl bg-white/85 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-amber-500/60 hover:shadow-[0_14px_36px_-8px_rgba(245,158,11,0.22)] dark:hover:shadow-[0_14px_36px_-8px_rgba(251,191,36,0.20)] transition-all duration-300 cursor-default select-none overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shadow-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/15 transition-all duration-300">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">4-D Hiring Lifecycle</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Independent tracking of Pipeline Stage, Assessment Status, Interview Status, and Final Hiring Committee Decision.
                </p>
              </div>
            </TiltCard>
          </div>
        </section>

        <GradientDivider className="my-8 sm:my-14" />

        {/* ── ABOUT SECTION (#about) ── */}
        <section id="about" className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto scroll-mt-24">
          <ScrollReveal direction="up" distance={28}>
            <div className="rounded-3xl bg-stone-100/70 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] p-8 sm:p-14 lg:p-18 space-y-12">
              
              <div className="max-w-2xl space-y-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  About SparkX Platform
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-display">
                  Engineered for Objective, Evidence-Driven Talent Intelligence
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  Traditional hiring relies on subjective resume filtering and disconnected interview notes. SparkX transforms technical and organizational recruitment into an empirical, auditable science.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pillar 01 */}
                <div className="p-6 rounded-2xl bg-white/90 dark:bg-[#1A1714]/90 border border-stone-200/90 dark:border-stone-800/90 shadow-subtle hover:shadow-card hover:-translate-y-1 hover:border-brand-500/40 transition-all duration-300 space-y-3.5 group select-none">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-teal-500 text-white flex items-center justify-center text-xs font-mono font-bold shadow-sm shadow-brand-500/20">
                      01
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    Human-in-the-Loop
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    AI engines formulate telemetry, evaluate code correctness, and flag anomalies; recruitment directors maintain full oversight and make definitive hiring commitments.
                  </p>
                </div>

                {/* Pillar 02 */}
                <div className="p-6 rounded-2xl bg-white/90 dark:bg-[#1A1714]/90 border border-stone-200/90 dark:border-stone-800/90 shadow-subtle hover:shadow-card hover:-translate-y-1 hover:border-emerald-500/40 transition-all duration-300 space-y-3.5 group select-none">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center text-xs font-mono font-bold shadow-sm shadow-emerald-500/20">
                      02
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Fairness & Zero-Bias
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Evaluations focus purely on technical execution, code output verification, and structured behavioral rubrics aligned with EEOC regulations.
                  </p>
                </div>

                {/* Pillar 03 */}
                <div className="p-6 rounded-2xl bg-white/90 dark:bg-[#1A1714]/90 border border-stone-200/90 dark:border-stone-800/90 shadow-subtle hover:shadow-card hover:-translate-y-1 hover:border-amber-500/40 transition-all duration-300 space-y-3.5 group select-none">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-500 text-white flex items-center justify-center text-xs font-mono font-bold shadow-sm shadow-amber-500/20">
                      03
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Immutable Audit Trail
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    Every test execution, code commit, question response, and proctoring flag is permanently recorded in candidate evidence dossiers.
                  </p>
                </div>
              </div>

            </div>
          </ScrollReveal>
        </section>

        <GradientDivider className="my-10 sm:my-14" />

        {/* ── FEATURES SECTION (#features) ── */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto scroll-mt-24 space-y-12">
          <ScrollReveal direction="up" distance={28}>
            
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Core Capabilities
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-display">
                Enterprise Recruitment Infrastructure
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                A cohesive suite designed to handle technical assessments, interactive video interviews, and candidate pipeline tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <TiltCard intensity={5}>
                <div 
                  onClick={() => setSelectedFeature('ide')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature('ide'); } }}
                  className="h-full relative group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-4 hover:border-brand-500/50 hover:shadow-card transition-all duration-300 select-none overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.985] text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs shadow-brand-500/20 group-hover:scale-110 group-hover:bg-brand-500/20 transition-all duration-300">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Interactive Coding IDE</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Monaco-powered coding environment featuring real-time syntax checking, schema viewers for SQL problems, and real-time execution feedback against hidden test suites.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 opacity-80 group-hover:opacity-100 transition-all duration-200">
                    <span>View IDE capabilities</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 2 */}
              <TiltCard intensity={5}>
                <div 
                  onClick={() => setSelectedFeature('proctor')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature('proctor'); } }}
                  className="h-full relative group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-4 hover:border-emerald-500/50 hover:shadow-card transition-all duration-300 select-none overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.985] text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shadow-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Live AI Proctoring Monitor</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Computer-vision driven anti-cheating HUD that streams biometric telemetry, anomaly triggers, face presence verification, and browser focus logs.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 opacity-80 group-hover:opacity-100 transition-all duration-200">
                    <span>View Proctor HUD</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 3 */}
              <TiltCard intensity={5}>
                <div 
                  onClick={() => setSelectedFeature('integrations')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature('integrations'); } }}
                  className="h-full relative group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-4 hover:border-teal-500/50 hover:shadow-card transition-all duration-300 select-none overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.985] text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-teal-500/10 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs shadow-teal-500/20 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">External Coding Integration</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Official support for HackerRank for Work REST API, LeetCode verified tracked challenge links, and CodeSignal enterprise challenge score sync.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 opacity-80 group-hover:opacity-100 transition-all duration-200">
                    <span>View Integrations</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 4 */}
              <TiltCard intensity={5}>
                <div 
                  onClick={() => setSelectedFeature('copilot')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature('copilot'); } }}
                  className="h-full relative group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-4 hover:border-amber-500/50 hover:shadow-card transition-all duration-300 select-none overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.985] text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shadow-amber-500/20 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Ask SparkX AI Copilot</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Global recruitment intelligence assistant powered by Gemini, xAI Grok, or offline deterministic NLP to query candidate records and compensation data.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 opacity-80 group-hover:opacity-100 transition-all duration-200">
                    <span>View Copilot features</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 5 */}
              <TiltCard intensity={5}>
                <div 
                  onClick={() => setSelectedFeature('compensation')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature('compensation'); } }}
                  className="h-full relative group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-4 hover:border-purple-500/50 hover:shadow-card transition-all duration-300 select-none overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.985] text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs shadow-purple-500/20 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                      <Scale className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Compensation Engine</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Real-time CTC boundary verification ensuring candidate salary expectations align with authorized role brackets before moving to final offer stages.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 opacity-80 group-hover:opacity-100 transition-all duration-200">
                    <span>View CTC engine</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>

              {/* Feature 6 */}
              <TiltCard intensity={5}>
                <div 
                  onClick={() => setSelectedFeature('meet')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedFeature('meet'); } }}
                  className="h-full relative group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-4 hover:border-rose-500/50 hover:shadow-card transition-all duration-300 select-none overflow-hidden flex flex-col justify-between cursor-pointer active:scale-[0.985] text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-4">
                    <div className="w-11 h-11 rounded-xl bg-rose-500/10 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs shadow-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Google Meet & SMTP Service</h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Automated interview invitation dispatches with genuine Google Meet session links, calendar invites, and password recovery emails via live SMTP.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 opacity-80 group-hover:opacity-100 transition-all duration-200">
                    <span>View Meet & SMTP</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </TiltCard>

            </div>

            {/* Live Interactive Code Terminal Demo */}
            <div id="simulation" className="pt-8 max-w-4xl mx-auto space-y-4 scroll-mt-24">
              <div className="text-center space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-teal-400">
                  Live Interactive Candidate Evaluation
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-display">
                  Tech Sandboxes & Business Case Telemetry
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
                  Evaluate candidates across engineering compilers, PM product specs, enterprise sales calls, and financial models in real time.
                </p>
              </div>
              <TypingTerminal />
            </div>

          </ScrollReveal>
        </section>

        <GradientDivider className="my-10 sm:my-14" />

        {/* ── HOW IT WORKS SECTION (#how-it-works) ── */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto scroll-mt-24 space-y-12">
          <ScrollReveal direction="up" distance={28}>
          
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-display">
              Four Steps from Job Creation to Verified Hire
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Structured, four-dimensional hiring lifecycle preventing data overwrites and preserving historical evidence.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Horizontal Connecting Progression Beam */}
            <div className="hidden lg:block absolute top-9 left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-brand-600/20 via-teal-500/40 to-amber-500/25 pointer-events-none z-0" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              
              {/* Step 1 */}
              <div className="group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-brand-500/50 hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 select-none">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-brand-500/25 ring-4 ring-[#FAF8F5] dark:ring-[#110F0D] group-hover:scale-110 transition-transform duration-200">
                    1
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                    Phase 01
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">Job Blueprinting</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Recruiter specifies role requirements, experience bands, compensation brackets, and custom technical assessment criteria.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-teal-500/50 hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 select-none">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-teal-500/25 ring-4 ring-[#FAF8F5] dark:ring-[#110F0D] group-hover:scale-110 transition-transform duration-200">
                    2
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    Phase 02
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Resume & Screening</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Candidates upload resumes. SparkX auto-extracts technical competencies and computes fuzzy skill alignment rankings.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-cyan-500/50 hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 select-none">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-500 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-cyan-500/25 ring-4 ring-[#FAF8F5] dark:ring-[#110F0D] group-hover:scale-110 transition-transform duration-200">
                    3
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                    Phase 03
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Proctored Assessment</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Candidate writes code in our isolated sandbox or joins an adaptive AI interview room under real-time proctoring telemetry.
                </p>
              </div>

              {/* Step 4 */}
              <div className="group p-6 rounded-2xl bg-white/90 dark:bg-[#161311]/90 border border-[#E8E4DF] dark:border-[#26211C] shadow-subtle space-y-3 hover:border-amber-500/50 hover:shadow-card hover:-translate-y-1.5 transition-all duration-300 select-none">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-500 text-white font-mono font-bold flex items-center justify-center text-sm shadow-md shadow-amber-500/25 ring-4 ring-[#FAF8F5] dark:ring-[#110F0D] group-hover:scale-110 transition-transform duration-200">
                    4
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    Phase 04
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Evidence & Decision</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  Recruiters review compiler outputs, interview transcripts, and integrity logs before logging an auditable hiring decision.
                </p>
              </div>

            </div>
          </div>
          </ScrollReveal>
        </section>

        <GradientDivider className="my-10 sm:my-14" />

        {/* ── CONTACT SECTION (#contact) ── */}
        <section id="contact" className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto scroll-mt-24">
          <ScrollReveal direction="up" distance={28}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-stone-100/80 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] p-8 sm:p-14">
            
            <div className="lg:col-span-5 space-y-5">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Contact & Demo
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 font-display">
                Request an Enterprise Walkthrough
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Interested in deploying SparkX across your engineering and talent teams? Reach out to schedule a live product demonstration.
              </p>

              <div className="space-y-3 pt-2 text-xs text-stone-700 dark:text-stone-300">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>support@sparkx.ai</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>SparkX Recruitment Technologies Inc.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>SOC2 Type II • EEOC Compliant Protocol</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <form onSubmit={handleContactSubmit} className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A1714] border border-stone-200 dark:border-[#2A2520] shadow-card space-y-4">
                
                {contactSubmitted ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h4 className="text-base font-bold text-stone-900 dark:text-white">Message Dispatched</h4>
                    <p className="text-xs text-stone-500">Thank you for your interest! A member of the technical evaluation team will contact you shortly.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">Your Name *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-[#110F0D] border border-stone-300 dark:border-[#2A2520] text-stone-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">Work Email *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="sarah@company.com"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-[#110F0D] border border-stone-300 dark:border-[#2A2520] text-stone-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">Company Name</label>
                      <input
                        type="text"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        placeholder="Company or Organization"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-[#110F0D] border border-stone-300 dark:border-[#2A2520] text-stone-900 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase">Inquiry Details</label>
                      <textarea
                        rows={3}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Tell us about your team size, hiring goals, or integration requirements..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-[#110F0D] border border-stone-300 dark:border-[#2A2520] text-stone-900 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Enterprise Request</span>
                    </button>
                  </>
                )}

              </form>
            </div>

          </div>
          </ScrollReveal>
        </section>

      </main>

      {/* ── Global Public Footer ── */}
      <footer className="border-t border-[#E8E4DF] dark:border-[#2A2520] bg-white/70 dark:bg-[#14110F]/70 py-10 px-4 sm:px-6 lg:px-8 text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-xs font-bold font-mono">
              SX
            </div>
            <span className="font-bold text-stone-900 dark:text-stone-200">
              SparkX Recruitment Intelligence
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <span>© 2026 SparkX AI Inc. All rights reserved.</span>
            <span>•</span>
            <span className="text-stone-600 dark:text-stone-300 font-medium">SOC2 Certified • EEOC Guardrails</span>
            <span>•</span>
            <button
              onClick={() => smoothNavigate('/login')}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Sign In Portal
            </button>
          </div>
        </div>
      </footer>

      {/* ── Feature Detail Modal ── */}
      {selectedFeature && FEATURE_DETAILS[selectedFeature] && (() => {
        const feature = FEATURE_DETAILS[selectedFeature];
        const IconComponent = feature.icon;
        
        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/60 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedFeature(null)}
          >
            <div 
              className="relative w-full max-w-2xl bg-white dark:bg-[#161311] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-modal-enter overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top ambient color bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-amber-500" />
              
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 px-2.5 py-0.5 rounded-full bg-brand-500/10 dark:bg-brand-950/40 border border-brand-500/20">
                      {feature.badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 font-display mt-1">
                      {feature.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {feature.description}
              </p>

              {/* Architecture & Capabilities List */}
              <div className="space-y-2.5 bg-stone-50 dark:bg-[#12100E] border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-4 sm:p-5">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Architectural Capabilities & Specs
                </h4>
                <div className="space-y-2.5 pt-1">
                  {feature.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/50 text-xs font-semibold transition cursor-pointer"
                >
                  Close Window
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {feature.secondaryAction && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeature(null);
                        smoothNavigate(feature.secondaryAction.path);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition cursor-pointer"
                    >
                      {feature.secondaryAction.label}
                    </button>
                  )}

                  {feature.primaryAction && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeature(null);
                        if (feature.primaryAction.action === 'scroll-simulation') {
                          setTimeout(() => {
                            const simEl = document.getElementById('simulation');
                            if (simEl) {
                              simEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        } else if (feature.primaryAction.path) {
                          smoothNavigate(feature.primaryAction.path);
                        }
                      }}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {feature.primaryAction.action === 'scroll-simulation' ? (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      <span>{feature.primaryAction.label}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── Floating Back to Top Button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={`fixed bottom-6 right-6 z-40 p-3 rounded-full bg-white/90 dark:bg-[#1A1714]/90 border border-stone-200/90 dark:border-stone-800/90 shadow-depth-elevated backdrop-blur-md text-stone-700 dark:text-stone-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-500/50 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer ${
          scrollY > 400 ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ChevronUp className="w-4 h-4" />
      </button>

    </div>
  );
}
