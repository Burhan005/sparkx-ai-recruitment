import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { useSmoothNavigate } from '../../context/PageTransitionContext';
import { 
  Briefcase, 
  Users, 
  Video, 
  Code2, 
  ShieldAlert, 
  TrendingUp, 
  FileText, 
  Sun, 
  Moon, 
  RefreshCw, 
  Cpu, 
  LogOut, 
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  Layers,
  Settings,
  ShieldCheck,
  Award,
  Inbox,
  Activity,
  Compass,
  BookmarkCheck,
  Home,
  ArrowRight,
  CalendarCheck
} from 'lucide-react';
import { Avatar } from '../ui/Primitives';
import { formatShortcut } from '../../utils/keyboardShortcut';
import AreteLogo, { AreteEmblem } from '../ui/AreteLogo';

export default function AppSidebar({ 
  onOpenCommandMenu, 
  onOpenAIConfig,
  onOpenAskSparkx,
  isMobileOpen,
  onCloseMobile
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { smoothNavigate } = useSmoothNavigate();
  const { 
    userRole, 
    currentUser, 
    theme, 
    toggleTheme, 
    syncWithDatabase, 
    isDbConnected, 
    logout,
    requestLogout,
    myApplications = [],
    candidates = [],
    jobs = [],
    activeJob,
    setSelectedCandidate
  } = useRecruitment();

  // Persist sidebar collapsed state in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('sparkx_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Persist resizable sidebar width in localStorage (min: 240, max: 460, default: 260)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('sparkx_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 240 && parsed <= 460) return parsed;
      }
    } catch {}
    return 260;
  });

  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = Math.min(460, Math.max(240, e.clientX));
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem('sparkx_sidebar_width', String(newWidth));
      } catch {}
    }
  }, [isResizing]);

  const resetWidth = useCallback(() => {
    setSidebarWidth(260);
    try {
      localStorage.setItem('sparkx_sidebar_width', '260');
    } catch {}
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sparkx_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Keyboard shortcut: Cmd/Ctrl+B toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithDatabase(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const isNonTech = Boolean(activeJob && (
    /finance|account|tax|audit|cpa|controller|treasur|bookkeep/i.test(activeJob.title || '') ||
    /finance|account/i.test(activeJob.department || '') ||
    /hr|human\s*resource|recruiter|talent|people/i.test(activeJob.title || '') ||
    /hr|human\s*resource/i.test(activeJob.department || '') ||
    /market|seo|content|copywrit|growth|brand/i.test(activeJob.title || '') ||
    /sales|business\s*dev|account\s*exec/i.test(activeJob.title || '')
  ));

  // Dynamic candidate counts
  const totalCandidatesCount = candidates.length;
  const totalJobsCount = jobs.length;
  const highRiskCount = candidates.filter(c => c.integrityRisk === 'High').length;
  const topMatchCount = candidates.filter(c => (c.matchScore || 0) >= 85).length;

  // RECRUITER NAVIGATION SECTIONS
  const recruiterSections = [
    {
      title: 'Talent Operations',
      items: [
        { 
          path: '/recruiter', 
          label: 'Candidate Pipeline', 
          icon: Users, 
          badge: totalCandidatesCount > 0 ? String(totalCandidatesCount) : null,
          badgeColor: 'bg-white dark:bg-[#201814] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#3E2D23]'
        },
        { 
          path: '/recruiter?tab=jobs', 
          label: 'Active Requisitions', 
          icon: Briefcase, 
          badge: totalJobsCount > 0 ? String(totalJobsCount) : null,
          badgeColor: 'bg-white dark:bg-[#201814] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#3E2D23]'
        },
        { 
          path: '/recruiter/proctor', 
          label: 'Live Integrity HUD', 
          icon: ShieldAlert, 
          badge: 'LIVE',
          isLive: true,
          badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
        },
      ]
    },
    {
      title: 'Assessment & Studio',
      items: [
        { 
          path: '/recruiter/assessment-builder', 
          label: 'Assessment Builder', 
          icon: Layers, 
          badge: 'Builder',
          badgeColor: 'bg-stone-100 dark:bg-[#201814] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-[#382A20]'
        },
        { 
          path: '/recruiter/assessment-studio', 
          label: 'Evaluation Blueprints', 
          icon: Code2, 
          badge: 'Studio',
          badgeColor: 'bg-stone-100 dark:bg-[#201814] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-[#382A20]'
        },
        { 
          path: '/recruiter/interview-studio', 
          label: 'AI Interview Questions', 
          icon: Video, 
          badge: 'Rubrics',
          badgeColor: 'bg-stone-100 dark:bg-[#201814] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-[#382A20]'
        },
        { 
          path: '/recruiter/availability', 
          label: 'Interview Availability', 
          icon: CalendarCheck, 
          badge: 'Slots',
          badgeColor: 'bg-amber-50 dark:bg-[#2A1D15] text-amber-800 dark:text-amber-300 border-amber-200 dark:border-[#4E3727]'
        },
        { 
          path: '/skill-gap', 
          label: 'Skill Gap & Analytics', 
          icon: TrendingUp,
          badge: 'Dossier',
          badgeColor: 'bg-stone-100 dark:bg-[#201814] text-stone-600 dark:text-stone-400 border-stone-200 dark:border-[#382A20]'
        },
      ]
    },
    {
      title: 'Talent Views',
      items: [
        {
          path: '/recruiter?filter=top',
          label: 'Top Matches (>85%)',
          icon: Award,
          badge: topMatchCount > 0 ? String(topMatchCount) : null,
          badgeColor: 'bg-amber-50 dark:bg-[#2A1D15] text-amber-800 dark:text-amber-300 border-amber-200 dark:border-[#4E3727]'
        },
        {
          path: '/recruiter?filter=alerts',
          label: 'Integrity Alerts',
          icon: AlertCircle,
          badge: highRiskCount > 0 ? String(highRiskCount) : '0',
          alert: highRiskCount > 0,
          badgeColor: highRiskCount > 0 
            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' 
            : 'bg-stone-100 dark:bg-[#201814] text-stone-500 dark:text-stone-400 border-stone-200 dark:border-[#382A20]'
        }
      ]
    }
  ];

  // CANDIDATE NAVIGATION SECTIONS
  const candidateSections = [
    {
      title: 'Job Search',
      items: [
        { path: '/jobs', label: 'Explore Positions', icon: Briefcase, badge: totalJobsCount > 0 ? String(totalJobsCount) : null },
        { path: '/my-applications', label: 'My Applications', icon: FileText, badge: myApplications.length > 0 ? String(myApplications.length) : null },
      ]
    },
    {
      title: 'Assessments & Prep',
      items: [
        { path: '/skill-passport', label: 'Verified Skill Passport', icon: Award, badge: 'Verified', badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
        { path: '/interview', label: 'AI Interview Room', icon: Video, badge: 'AI' },
        { path: '/assessment', label: isNonTech ? 'Role Assessment' : 'Code Challenge', icon: isNonTech ? FileText : Code2 },
        { path: '/skill-gap', label: 'Skill Gap & Roadmap', icon: TrendingUp },
      ]
    }
  ];

  const sections = userRole === 'recruiter' ? recruiterSections : candidateSections;

  const isItemActive = (itemPath) => {
    const currentFull = location.pathname + location.search;
    if (itemPath.includes('?')) {
      return currentFull === itemPath;
    }
    if (itemPath === '/recruiter') {
      return (
        (location.pathname === '/recruiter' && !location.search.includes('tab=jobs') && !location.search.includes('filter=')) || 
        location.pathname.startsWith('/recruiter/candidates') ||
        location.pathname.startsWith('/recruiter/pipeline')
      );
    }
    if (itemPath === '/jobs') {
      return location.pathname === '/jobs' || location.pathname.startsWith('/jobs/');
    }
    return location.pathname === itemPath || (itemPath !== '/' && location.pathname.startsWith(itemPath + '/'));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#150F0D] text-[#1C130E] dark:text-[#EDE8E3] select-none overflow-hidden transition-colors duration-200 border-r border-[#E5DDD2] dark:border-[#2C2019]">
      
      {/* ── 1. Brand & Workspace Header (Pinned) ── */}
      <div className={`h-[72px] shrink-0 relative flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} border-b border-[#E7DFD4] dark:border-[#261B14] bg-[#FAF8F5]/95 dark:bg-[#140E0B]/95 backdrop-blur-md`}>
        {/* Subtle top gold hairline sheen */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C27803]/30 dark:via-amber-500/35 to-transparent pointer-events-none" />

        {isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapse}
            className="relative group w-11 h-11 rounded-xl bg-white dark:bg-[#1A120E] border border-[#E0D7CC] dark:border-[#38261B] hover:border-[#C27803] dark:hover:border-amber-500 flex items-center justify-center shadow-2xs hover:shadow-sm transition-all cursor-pointer"
            title={`Expand sidebar (${formatShortcut('B')})`}
            aria-label="Expand sidebar"
          >
            <AreteEmblem size={26} className="group-hover:scale-95 transition-transform" />
            <div className="absolute inset-0 rounded-xl bg-[#C27803]/10 dark:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <ChevronRight className="w-4 h-4 text-[#C27803] dark:text-amber-400" />
            </div>
          </button>
        ) : (
          <>
            <div 
              className="flex items-center gap-3 cursor-pointer group min-w-0 select-none"
              onClick={() => {
                smoothNavigate('/');
                navigate('/');
              }}
              title="ARETE • Where Talent Meets Intelligence"
            >
              <div className="relative shrink-0">
                <AreteEmblem size={30} className="group-hover:scale-105 transition-transform duration-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#FAF8F5] dark:ring-[#140E0B]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span 
                    className="font-serif font-black tracking-[0.2em] text-stone-900 dark:text-[#FAF7F2] text-sm uppercase group-hover:text-[#C27803] dark:group-hover:text-amber-400 transition-colors"
                    style={{ fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif" }}
                  >
                    ARETE
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-wider uppercase bg-amber-500/15 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300 border border-amber-500/30">
                    {userRole === 'recruiter' ? 'ENTERPRISE' : 'TALENT'}
                  </span>
                </div>
                <span className="text-[8px] tracking-[0.22em] font-mono text-stone-500 dark:text-stone-400 uppercase font-semibold mt-1 truncate">
                  Talent Intelligence OS
                </span>
              </div>
            </div>

            {/* Desktop Collapse Trigger */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-[#F2ECE3] dark:hover:bg-[#251B15] border border-transparent hover:border-[#E0D5CA] dark:hover:border-[#3A2A20] transition shrink-0 cursor-pointer"
              title={`Collapse sidebar (${formatShortcut('B')})`}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4 transition-transform hover:-translate-x-0.5" />
            </button>
          </>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── 2. Unified Command Search & Copilot Launchers (Pinned) ── */}
      <div className={`shrink-0 p-3 pb-2.5 border-b border-[#E5DDD2] dark:border-[#281D17] ${isCollapsed ? 'flex flex-col items-center gap-2 px-2' : ''}`}>
        {isCollapsed ? (
          /* Collapsed Search & Copilot Icon Buttons with Tooltips */
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (onOpenCommandMenu) onOpenCommandMenu();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E1612] hover:bg-[#F4EFEB] dark:hover:bg-[#291F1A] text-stone-600 dark:text-[#D5C7BC] hover:text-[#1C130E] dark:hover:text-white border border-[#E0D7CC] dark:border-[#382920] hover:border-[#C27803]/50 dark:hover:border-amber-500/50 flex items-center justify-center transition shadow-2xs active:scale-[0.98] cursor-pointer"
                aria-label="Quick Search"
              >
                <Search className="w-4 h-4 text-stone-400 group-hover:text-[#C27803] dark:group-hover:text-amber-400 transition-colors" />
              </button>
              {/* Tooltip */}
              <div 
                role="tooltip"
                className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
              >
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                  <span>Quick Search</span>
                  <kbd className="px-1 py-0.5 text-[9px] font-mono text-stone-300 dark:text-stone-300 bg-white/10 rounded">
                    {formatShortcut('K')}
                  </kbd>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                </div>
              </div>
            </div>

            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (onOpenAskSparkx) onOpenAskSparkx();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-10 h-10 rounded-xl bg-amber-50/70 dark:bg-[#241A14] hover:bg-amber-100/70 dark:hover:bg-[#302118] text-amber-950 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-600/70 flex items-center justify-center transition shadow-2xs active:scale-[0.98] cursor-pointer"
                aria-label="ARETE Copilot"
              >
                <Sparkles className="w-4 h-4 text-[#C27803] dark:text-amber-400 group-hover:scale-110 transition-transform" />
              </button>
              {/* Tooltip */}
              <div 
                role="tooltip"
                className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
              >
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                  <span>ARETE Copilot</span>
                  <kbd className="px-1 py-0.5 text-[9px] font-mono text-amber-300 bg-amber-950/60 rounded border border-amber-800/60">
                    {formatShortcut('J')}
                  </kbd>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Expanded Dual Search & Copilot Control */
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onOpenCommandMenu) onOpenCommandMenu();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white dark:bg-[#1E1612] text-stone-700 dark:text-[#E8DFD8] hover:text-[#1C130E] dark:hover:text-white border border-[#E0D7CC] dark:border-[#33241C] hover:border-amber-400/50 dark:hover:border-amber-500/50 shadow-2xs hover:shadow-xs transition-all text-xs group cursor-pointer"
              title={`Quick Command Palette (${formatShortcut('K')})`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C27803] dark:text-stone-400 dark:group-hover:text-amber-400 transition-colors shrink-0" />
                <span className="font-medium text-[11px] truncate">Search</span>
              </div>
              <kbd className="px-1 py-0.2 text-[9px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-[#16100E] border border-stone-200 dark:border-[#382920] rounded shrink-0">
                {formatShortcut('K')}
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenAskSparkx) onOpenAskSparkx();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-amber-50/70 dark:bg-[#221711] text-amber-950 dark:text-amber-200 hover:text-[#1C130E] dark:hover:text-amber-100 border border-amber-200/80 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-600/70 shadow-2xs hover:shadow-xs transition-all text-xs group cursor-pointer"
              title={`ARETE Intelligence Copilot (${formatShortcut('J')})`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-semibold text-[11px] truncate">Copilot</span>
              </div>
              <kbd className="px-1 py-0.2 text-[9px] font-mono text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-[#1A120E] border border-amber-300/60 dark:border-amber-700/50 rounded shrink-0">
                {formatShortcut('J')}
              </kbd>
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Structured Navigation Modules (Scrollable) ── */}
      <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 scrollbar-thin ${isCollapsed ? 'flex flex-col items-center space-y-3' : ''}`}>
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pt-3 pb-1 flex items-center gap-2 select-none">
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-stone-500 dark:text-stone-400">
                  {section.title}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-stone-200 via-stone-200/50 to-transparent dark:from-[#33241C] dark:via-[#33241C]/50 dark:to-transparent" />
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);

                const handleClick = () => {
                  if (item.path === '/recruiter') {
                    if (setSelectedCandidate) {
                      setSelectedCandidate(null);
                    }
                    // Bulletproof redirection: clears any query params like ?tab=jobs or ?filter=
                    smoothNavigate('/recruiter', { state: { tab: 'candidates', resetKey: Date.now() } });
                    navigate('/recruiter', { state: { tab: 'candidates', resetKey: Date.now() } });
                  } else {
                    smoothNavigate(item.path);
                    navigate(item.path);
                  }
                  if (onCloseMobile) onCloseMobile();
                };

                return (
                  <div key={item.path} className="relative group w-full">
                    <button
                      type="button"
                      onClick={handleClick}
                      className={`relative flex items-center ${
                        isCollapsed 
                          ? 'w-11 h-11 justify-center mx-auto rounded-xl' 
                          : 'w-full justify-between px-3 py-2.5 rounded-xl'
                      } text-xs transition-all duration-300 ease-out cursor-pointer ${
                        active
                          ? 'bg-amber-500/10 dark:bg-amber-400/[0.08] text-stone-900 dark:text-[#FAF7F2] font-semibold border border-amber-500/25 dark:border-amber-400/20 shadow-2xs'
                          : 'text-stone-600 dark:text-[#A89E92] hover:text-stone-900 dark:hover:text-[#FAF7F2] hover:bg-stone-200/40 dark:hover:bg-[#1A120E] border border-transparent hover:border-[#E2D8CC] dark:hover:border-[#261B14]'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {/* Left Laser-Etched Keystone Bar */}
                      {active && !isCollapsed && (
                        <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md bg-[#B45309] dark:bg-amber-400 shadow-[0_0_8px_rgba(217,119,6,0.4)] transition-all duration-300" />
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        {/* Sculpted 30x30px Pedestal Tile */}
                        <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ease-out ${
                          active
                            ? 'bg-[#2E2017] dark:bg-[#34241A] text-amber-400 dark:text-amber-300 shadow-2xs border border-amber-600/40 dark:border-amber-500/35'
                            : 'bg-[#F2ECE3] dark:bg-[#1E1510] border border-[#E5DDD2] dark:border-[#2C1F17] text-stone-500 dark:text-stone-400 group-hover:text-amber-700 dark:group-hover:text-amber-400 group-hover:border-amber-600/30 dark:group-hover:border-amber-500/30'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {!isCollapsed && (
                          <span className="truncate tracking-[-0.01em] font-medium text-[12.5px] leading-tight">
                            {item.label}
                          </span>
                        )}
                      </div>

                      {/* Expanded Badge */}
                      {!isCollapsed && item.badge && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 shadow-2xs ${
                          item.badgeColor || 'bg-stone-100 dark:bg-[#1C140F] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-[#38261C]'
                        }`}>
                          {item.isLive && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                          )}
                          {item.alert && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          )}
                          <span>{item.badge}</span>
                        </span>
                      )}

                      {/* Collapsed dot indicator */}
                      {isCollapsed && item.badge && (
                        <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                          item.isLive ? 'bg-emerald-500 animate-pulse' : item.alert ? 'bg-rose-500 animate-pulse' : 'bg-[#C27803] dark:bg-amber-400'
                        } ring-2 ring-[#FAF8F5] dark:ring-[#150F0D]`} />
                      )}
                    </button>

                    {/* Collapsed Mode Floating Precision Tooltip */}
                    {isCollapsed && (
                      <div 
                        role="tooltip"
                        className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out"
                      >
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18110D] text-white text-xs font-medium shadow-2xl border border-stone-800 whitespace-nowrap">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              item.isLive 
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50' 
                                : item.alert 
                                ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50' 
                                : 'bg-amber-900/40 text-amber-300 border border-amber-700/40'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18110D] border-l border-b border-stone-800 rotate-45" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* System Settings Link for Recruiter */}
        {userRole === 'recruiter' && (
          <div className="space-y-1 pt-2 border-t border-[#E5DDD2] dark:border-[#281D17]">
            {!isCollapsed && (
              <div className="px-3 pt-2 pb-1 flex items-center gap-2 select-none">
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-stone-500 dark:text-stone-400">
                  System & Engine
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-stone-200 via-stone-200/50 to-transparent dark:from-[#33241C] dark:via-[#33241C]/50 dark:to-transparent" />
              </div>
            )}
            <div className="relative group w-full">
              <button
                type="button"
                onClick={() => {
                  if (onOpenAIConfig) onOpenAIConfig();
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center ${
                  isCollapsed 
                    ? 'w-10 h-10 justify-center mx-auto rounded-xl' 
                    : 'w-full justify-between px-2.5 py-2 rounded-xl'
                } text-xs font-medium text-stone-600 dark:text-[#C5B8AC] hover:text-[#1C130E] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1E1612] border border-transparent hover:border-[#E8DFD4] dark:hover:border-[#2C2019] transition cursor-pointer`}
                title="Configure AI Models & Architecture"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#F0EDE8]/80 dark:bg-[#1E1612] border border-[#E5DDD2] dark:border-[#2C2019] text-stone-500 dark:text-stone-400 group-hover:bg-white dark:group-hover:bg-[#251B15] group-hover:border-amber-400/40 dark:group-hover:border-amber-500/40 group-hover:text-[#C27803] dark:group-hover:text-amber-400 flex items-center justify-center shrink-0 transition-all">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  {!isCollapsed && <span>AI Model Engine</span>}
                </div>
                {!isCollapsed && (
                  <span className="px-2 py-0.5 rounded-md text-[9.5px] font-mono uppercase tracking-wider bg-stone-100/90 dark:bg-[#1C1410] text-stone-500 dark:text-stone-400 border border-stone-200/90 dark:border-[#33251E]">
                    Settings
                  </span>
                )}
              </button>

              {/* Collapsed Tooltip */}
              {isCollapsed && (
                <div 
                  role="tooltip"
                  className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                    <span>AI Model Engine</span>
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Public Homepage Link */}
        <div className="space-y-1 pt-2 border-t border-[#E5DDD2] dark:border-[#281D17]">
          {!isCollapsed && (
            <div className="px-3 pt-2 pb-1 flex items-center gap-2 select-none">
              <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-stone-500 dark:text-stone-400">
                Navigation
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-stone-200 via-stone-200/50 to-transparent dark:from-[#33241C] dark:via-[#33241C]/50 dark:to-transparent" />
            </div>
          )}
          <div className="relative group w-full">
            <button
              type="button"
              onClick={() => {
                smoothNavigate('/');
                navigate('/');
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center ${
                isCollapsed 
                  ? 'w-10 h-10 justify-center mx-auto rounded-xl' 
                  : 'w-full justify-between px-2.5 py-2 rounded-xl'
              } text-xs font-medium text-stone-600 dark:text-[#C5B8AC] hover:text-[#C27803] dark:hover:text-amber-400 hover:bg-white/60 dark:hover:bg-[#1E1612] border border-transparent hover:border-[#E8DFD4] dark:hover:border-[#2C2019] transition group cursor-pointer`}
              title="Return to Public Homepage"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F0EDE8]/80 dark:bg-[#1E1612] border border-[#E5DDD2] dark:border-[#2C2019] text-stone-500 dark:text-stone-400 group-hover:bg-white dark:group-hover:bg-[#251B15] group-hover:border-amber-400/40 dark:group-hover:border-amber-500/40 group-hover:text-[#C27803] dark:group-hover:text-amber-400 flex items-center justify-center shrink-0 transition-all">
                  <Home className="w-3.5 h-3.5" />
                </div>
                {!isCollapsed && <span>Back to Home</span>}
              </div>
              {!isCollapsed && (
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C27803] dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              )}
            </button>

            {/* Collapsed Tooltip */}
            {isCollapsed && (
              <div 
                role="tooltip"
                className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 ease-out"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                  <span>Back to Home</span>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── 4. System Status & Executive Profile Dock (Pinned Bottom) ── */}
      <div className={`shrink-0 mt-auto p-3 border-t border-[#E5DDD2] dark:border-[#281D17] space-y-2.5 bg-[#FAF8F5]/90 dark:bg-[#150F0D]/90 backdrop-blur-md ${isCollapsed ? 'flex flex-col items-center p-2' : ''}`}>
        
        {isCollapsed ? (
          /* Collapsed Bottom Controls */
          <div className="flex flex-col items-center gap-2 w-full">
            {userRole === 'recruiter' && (
              <>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="relative w-10 h-10 rounded-xl bg-white dark:bg-[#1E1612] border border-[#E0D7CC] dark:border-[#382920] flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    aria-label={isDbConnected ? "PostgreSQL Live (Click to sync)" : "PostgreSQL Offline (Click to retry)"}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#C27803]' : ''}`} />
                    <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </button>
                  <div 
                    role="tooltip"
                    className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                  >
                    <div className="px-3 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                      <span>{isDbConnected ? 'PostgreSQL Live · Click to sync' : 'Database Offline · Retry'}</span>
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={onOpenAIConfig}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E1612] border border-[#E0D7CC] dark:border-[#382920] flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition cursor-pointer shadow-2xs"
                    aria-label="Configure AI Models & Keys"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#C27803] dark:text-amber-400" />
                  </button>
                  <div 
                    role="tooltip"
                    className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
                  >
                    <div className="px-3 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                      <span>AI Model Engine</span>
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="relative group">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E1612] border border-[#E0D7CC] dark:border-[#382920] flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition active:scale-90 group cursor-pointer shadow-2xs"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                <span className="transition-transform duration-300 transform group-hover:rotate-45 group-active:rotate-180 inline-flex items-center justify-center">
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
                </span>
              </button>
              <div 
                role="tooltip"
                className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
              >
                <div className="px-3 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                  <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                </div>
              </div>
            </div>

            <div className="w-6 h-px bg-[#E5DDD2] dark:border-[#281D17] my-0.5" />

            <div className="relative group">
              <button
                type="button"
                onClick={() => (requestLogout ? requestLogout(navigate) : logout(navigate))}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-[0.97] hover:ring-2 hover:ring-rose-500/40 cursor-pointer"
                aria-label="User profile and sign out"
              >
                <Avatar name={currentUser?.name || 'User'} size="xs" />
              </button>
              <div 
                role="tooltip"
                className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
              >
                <div className="px-3 py-1.5 rounded-lg bg-[#1C130E] dark:bg-[#281D17] text-white dark:text-[#F3ECE6] text-xs font-medium shadow-xl border border-[#38261B] dark:border-[#423126] whitespace-nowrap">
                  <div className="font-semibold">{currentUser?.name || 'User'}</div>
                  <div className="text-[10px] text-stone-400">Click to Sign Out</div>
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#1C130E] dark:bg-[#281D17] border-l border-b border-[#38261B] dark:border-[#423126] rotate-45" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Expanded Bottom Dock */
          <>
            <div className="flex items-center justify-between px-1 text-xs">
              {/* Database Telemetry */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isDbConnected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                </span>
                <span className="text-stone-600 dark:text-[#C5B8AC] font-mono text-[10.5px] font-semibold truncate">
                  {isDbConnected ? 'PostgreSQL Live · 14ms' : 'Database Offline'}
                </span>
              </div>

              {/* Action Cluster */}
              <div className="flex items-center gap-1 shrink-0">
                {userRole === 'recruiter' && (
                  <>
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={isSyncing}
                      title="Sync with PostgreSQL database"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-[#F2ECE3] dark:hover:bg-[#241A14] transition disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#C27803] dark:text-amber-400' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAIConfig}
                      title="Configure AI Models & Architecture"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-[#F2ECE3] dark:hover:bg-[#241A14] transition cursor-pointer"
                    >
                      <Cpu className="w-3.5 h-3.5 text-stone-400 hover:text-[#C27803] dark:hover:text-amber-400" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-[#F2ECE3] dark:hover:bg-[#241A14] transition active:scale-90 group cursor-pointer"
                >
                  <span className="transition-transform duration-300 transform group-hover:rotate-45 group-active:rotate-180 inline-flex items-center justify-center">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
                  </span>
                </button>
              </div>
            </div>

            {/* Executive User Card */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#1A120E] border border-[#E0D7CC] dark:border-[#33241B] shadow-2xs hover:border-[#D5C9BC] dark:hover:border-[#423126] transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C27803] to-[#B45309] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white dark:ring-[#1A120E]">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1A120E]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#1C130E] dark:text-[#FAF6F2] truncate leading-tight">
                    {currentUser?.name || (userRole === 'recruiter' ? 'SparkX Admin' : 'Candidate')}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate font-mono pt-0.5">
                    {currentUser?.email || (userRole === 'recruiter' ? 'admin@sparkx.ai' : 'candidate@sparkx.ai')}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => (requestLogout ? requestLogout(navigate) : logout(navigate))}
                title="Sign out of ARETE session"
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0 active:scale-[0.97] cursor-pointer ml-1"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Regulatory & Platform Engine Stamp */}
            <div className="flex items-center justify-between px-2 pt-1 text-[9px] font-mono tracking-wider text-stone-400 dark:text-stone-500 select-none">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SOC-2 TYPE II • VERIFIED
              </span>
              <span className="font-semibold text-stone-500 dark:text-stone-400">ARETE OS v3.0</span>
            </div>
          </>
        )}

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Strictly Fixed to 100% viewport height, never scrolls */}
      <aside 
        style={{ width: isCollapsed ? 64 : sidebarWidth }}
        className={`hidden lg:flex flex-col shrink-0 h-full z-30 relative select-none border-r border-[#E5DDD2] dark:border-[#281D17] ${
          isResizing ? '' : 'transition-[width] duration-200 ease-in-out'
        }`}
      >
        {sidebarContent}
        {/* Right Resizer Handle (Desktop Only) */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            onDoubleClick={resetWidth}
            title="Drag to resize sidebar (220px – 460px) • Double-click to reset (280px)"
            className={`absolute top-0 right-0 w-2 h-full cursor-col-resize z-40 transition-colors ${
              isResizing 
                ? 'bg-[#C27803] dark:bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.45)]' 
                : 'hover:bg-[#C27803]/40 dark:hover:bg-amber-500/40'
            } group`}
          >
            <div className={`absolute top-1/2 right-[2px] -translate-y-1/2 w-0.5 h-9 rounded-full ${
              isResizing ? 'bg-white' : 'bg-stone-300 dark:bg-stone-700 group-hover:bg-[#C27803] dark:group-hover:bg-amber-400'
            }`} />
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-[#0F0E0D]/75 backdrop-blur-md transition-opacity duration-200" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-drawer-enter">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
