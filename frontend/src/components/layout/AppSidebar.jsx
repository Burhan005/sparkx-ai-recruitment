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

  // Persist resizable sidebar width in localStorage (min: 220, max: 460, default: 280)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('sparkx_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 220 && parsed <= 460) return parsed;
      }
    } catch {}
    return 280;
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
      const newWidth = Math.min(460, Math.max(220, e.clientX));
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem('sparkx_sidebar_width', String(newWidth));
      } catch {}
    }
  }, [isResizing]);

  const resetWidth = useCallback(() => {
    setSidebarWidth(280);
    try {
      localStorage.setItem('sparkx_sidebar_width', '280');
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
          badgeColor: 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
        },
        { 
          path: '/recruiter?tab=jobs', 
          label: 'Active Requisitions', 
          icon: Briefcase, 
          badge: totalJobsCount > 0 ? String(totalJobsCount) : null,
          badgeColor: 'bg-stone-100 dark:bg-[#33251E] text-stone-700 dark:text-[#E8DFD8] border-stone-200 dark:border-[#4B372A]'
        },
        { 
          path: '/recruiter/proctor', 
          label: 'Live Integrity HUD', 
          icon: ShieldAlert, 
          badge: 'Live',
          isLive: true,
          badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
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
          badgeColor: 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
        },
        { 
          path: '/recruiter/assessment-studio', 
          label: 'Evaluation Blueprints', 
          icon: Code2, 
          badge: 'Studio',
          badgeColor: 'bg-stone-100 dark:bg-[#33251E] text-stone-700 dark:text-[#E8DFD8] border-stone-200 dark:border-[#4B372A]'
        },
        { 
          path: '/recruiter/interview-studio', 
          label: 'AI Interview Questions', 
          icon: Video, 
          badge: 'Rubrics',
          badgeColor: 'bg-stone-100 dark:bg-[#33251E] text-stone-700 dark:text-[#E8DFD8] border-stone-200 dark:border-[#4B372A]'
        },
        { 
          path: '/recruiter/availability', 
          label: 'Interview Availability', 
          icon: CalendarCheck, 
          badge: 'Scheduling',
          badgeColor: 'bg-brand-50 dark:bg-[#382618] text-brand-700 dark:text-amber-300 border-brand-200 dark:border-[#543A24]'
        },
        { 
          path: '/skill-gap', 
          label: 'Skill Gap & Analytics', 
          icon: TrendingUp,
          badge: 'Dossier',
          badgeColor: 'bg-stone-100 dark:bg-[#33251E] text-stone-700 dark:text-[#E8DFD8] border-stone-200 dark:border-[#4B372A]'
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
          badgeColor: 'bg-amber-50 dark:bg-[#3D2C1B] text-amber-700 dark:text-amber-300 border-amber-200 dark:border-[#5E4226]'
        },
        {
          path: '/recruiter?filter=alerts',
          label: 'Integrity Alerts',
          icon: AlertCircle,
          badge: highRiskCount > 0 ? String(highRiskCount) : '0',
          alert: highRiskCount > 0,
          badgeColor: highRiskCount > 0 
            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' 
            : 'bg-stone-100 dark:bg-[#2A201A] text-stone-600 dark:text-[#BAACA1] border-stone-200 dark:border-[#3D2E24]'
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
      return (location.pathname === '/recruiter' && !location.search.includes('tab=jobs') && !location.search.includes('filter=')) || 
             location.pathname.startsWith('/recruiter/candidates');
    }
    if (itemPath === '/jobs') {
      return location.pathname === '/jobs' || location.pathname.startsWith('/jobs/');
    }
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FDFCFA] dark:bg-[#1B1310] text-stone-700 dark:text-stone-300 select-none overflow-hidden transition-colors duration-150 border-r border-[#E5E0DA] dark:border-[#3A2C23]">
      
      {/* ── 1. Brand & Workspace Header (Pinned) ── */}
      <div className={`h-14 shrink-0 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} border-b border-stone-200/90 dark:border-stone-800/80`}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapse}
            className="w-9 h-9 rounded-xl bg-[#100F0D] hover:bg-stone-900 border border-[#D6B477]/30 flex items-center justify-center text-white shadow-sm shadow-[#2A1B14]/20 group transition-all cursor-pointer"
            title={`Expand sidebar (${formatShortcut('B')})`}
          >
            <AreteEmblem size={20} className="group-hover:hidden" />
            <ChevronRight className="w-4 h-4 text-[#D6B477] hidden group-hover:block transition-transform" />
          </button>
        ) : (
          <>
            <div 
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              onClick={() => smoothNavigate('/')}
              title="ARETE • Intelligence in Every Decision"
            >
              <AreteLogo
                size="sm"
                badge={userRole === 'recruiter' ? 'OS' : 'PRO'}
                subtitle={userRole === 'recruiter' ? 'Talent Intelligence' : 'Candidate Portal'}
              />
            </div>

            {/* Desktop Collapse Trigger */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition shrink-0"
              title={`Collapse sidebar (${formatShortcut('B')})`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── 2. Unified Command Search & Copilot Launchers (Pinned) ── */}
      <div className={`shrink-0 p-2.5 space-y-1.5 border-b border-stone-200/80 dark:border-[#382B22] ${isCollapsed ? 'flex flex-col items-center p-2' : ''}`}>
        {/* Quick Search Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenCommandMenu) onOpenCommandMenu();
            if (onCloseMobile) onCloseMobile();
          }}
          className={`group flex items-center ${
            isCollapsed 
              ? 'w-8 h-8 justify-center p-0 rounded-lg' 
              : 'w-full justify-between px-2.5 py-1.5 rounded-lg'
          } bg-stone-100/80 hover:bg-stone-200/70 dark:bg-[#261C16] dark:hover:bg-[#32241D] text-stone-700 hover:text-stone-900 dark:text-[#E8DFD8] dark:hover:text-white border border-stone-200 dark:border-[#423229] transition text-xs shadow-xs hover:ring-1 hover:ring-amber-500/30 dark:hover:ring-amber-500/40`}
          title={`Quick Search (${formatShortcut('K')})`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 shrink-0 text-stone-400 group-hover:text-stone-700 dark:text-[#C5B7AB] dark:group-hover:text-amber-400 transition-colors" />
            {!isCollapsed && <span className="font-medium text-stone-700 dark:text-[#E8DFD8] text-xs truncate">Quick Search...</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-sans text-stone-500 dark:text-[#D5C7BC] bg-white dark:bg-[#1C1410] border border-stone-200 dark:border-[#4A382D] rounded shadow-xs shrink-0">
              {formatShortcut('K')}
            </kbd>
          )}
        </button>

        {/* Ask SparkX AI Copilot Button */}
        <button
          type="button"
          onClick={() => {
            if (onOpenAskSparkx) onOpenAskSparkx();
            if (onCloseMobile) onCloseMobile();
          }}
          className={`group flex items-center ${
            isCollapsed 
              ? 'w-8 h-8 justify-center p-0 rounded-lg' 
              : 'w-full justify-between px-2.5 py-1.5 rounded-lg'
          } bg-amber-500/10 hover:bg-amber-500/15 dark:bg-[#2E2018] dark:hover:bg-[#3A281E] text-amber-950 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 transition text-xs shadow-xs hover:shadow-md hover:shadow-amber-900/10 dark:hover:shadow-amber-900/30`}
          title={`ARETE Intelligence Copilot (${formatShortcut('J')})`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-brand-600 dark:text-amber-400 group-hover:scale-105 transition-transform" />
            {!isCollapsed && <span className="font-semibold text-amber-950 dark:text-amber-200 text-xs truncate">ARETE Copilot</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-sans text-brand-700 dark:text-amber-300 bg-white/90 dark:bg-[#1C1410] border border-amber-200 dark:border-amber-800/80 rounded shadow-xs shrink-0">
              {formatShortcut('J')}
            </kbd>
          )}
        </button>
      </div>

      {/* ── 3. Structured Navigation Modules (Scrollable) ── */}
      <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-4 scrollbar-thin ${isCollapsed ? 'flex flex-col items-center space-y-3' : ''}`}>
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pt-2 pb-1 text-[11px] font-bold uppercase tracking-[0.09em] text-stone-600 dark:text-[#D5C7BC] font-sans">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => {
                      if (item.path === '/recruiter') {
                        if (setSelectedCandidate) {
                          setSelectedCandidate(null);
                        }
                        smoothNavigate('/recruiter', { state: { tab: 'candidates', resetKey: Date.now() } });
                      } else {
                        smoothNavigate(item.path);
                      }
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                    className={`relative group flex items-center ${
                      isCollapsed 
                        ? 'w-9 h-9 justify-center p-0 rounded-xl' 
                        : 'w-full justify-between px-2.5 py-2 rounded-xl'
                    } text-xs font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                      active
                        ? 'bg-amber-500/15 dark:bg-amber-500/20 text-stone-950 dark:text-amber-300 font-bold border border-brand-500/35 dark:border-amber-500/40 shadow-xs'
                        : 'text-stone-700 dark:text-[#E8DFD8] hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#2B1F19] border border-transparent dark:hover:border-[#3D2E24]'
                    }`}
                  >
                    {/* Active Accent Bar on Left */}
                    {active && !isCollapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600 dark:bg-amber-500 transition-all duration-200" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        active 
                          ? 'text-brand-600 dark:text-amber-400' 
                          : 'text-stone-500 dark:text-[#C5B7AB] group-hover:text-stone-900 dark:group-hover:text-amber-400'
                      }`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors flex items-center gap-1 ${
                        item.badgeColor || 'bg-stone-100 dark:bg-[#2E221B] text-stone-700 dark:text-[#D5C7BC] border-stone-200 dark:border-[#423229]'
                      }`}>
                        {item.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {item.alert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-subtle" />}
                        <span>{item.badge}</span>
                      </span>
                    )}

                    {/* Collapsed dot badge */}
                    {isCollapsed && item.badge && (
                      <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                        item.isLive ? 'bg-emerald-500 animate-pulse' : item.alert ? 'bg-rose-500' : 'bg-brand-600 dark:bg-amber-500'
                      } ring-2 ring-white dark:ring-[#1B1310]`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* System Settings Link for Recruiter */}
        {userRole === 'recruiter' && (
          <div className="space-y-1 pt-2 border-t border-stone-200/60 dark:border-[#382B22]">
            {!isCollapsed && (
              <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-[0.09em] text-stone-600 dark:text-[#D5C7BC] font-sans">
                System & Engine
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (onOpenAIConfig) onOpenAIConfig();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center ${
                isCollapsed 
                  ? 'w-9 h-9 justify-center p-0 rounded-xl' 
                  : 'w-full justify-between px-2.5 py-2 rounded-xl'
              } text-xs font-medium text-stone-700 dark:text-[#E8DFD8] hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#2B1F19] border border-transparent dark:hover:border-[#3D2E24] transition`}
              title="Configure AI Models & Evaluator Parameters"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-brand-600 dark:text-amber-400" />
                {!isCollapsed && <span>AI Model Engine</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-amber-50 dark:bg-[#382618] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-[#543A24]">
                  Settings
                </span>
              )}
            </button>
          </div>
        )}

        {/* Public Homepage Link */}
        <div className="space-y-1 pt-2 border-t border-stone-200/60 dark:border-[#382B22]">
          {!isCollapsed && (
            <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold uppercase tracking-[0.09em] text-stone-600 dark:text-[#D5C7BC] font-sans">
              Navigation
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              smoothNavigate('/');
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center ${
              isCollapsed 
                ? 'w-9 h-9 justify-center p-0 rounded-xl' 
                : 'w-full justify-between px-2.5 py-2 rounded-xl'
            } text-xs font-medium text-stone-700 dark:text-[#E8DFD8] hover:text-brand-600 dark:hover:text-amber-400 hover:bg-brand-50/70 dark:hover:bg-[#2B1F19] border border-transparent dark:hover:border-[#3D2E24] transition group`}
            title="Return to Public Homepage (/)"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-stone-500 dark:text-[#C5B7AB] group-hover:text-brand-600 dark:group-hover:text-amber-400 transition-colors shrink-0" />
              {!isCollapsed && <span>Back to Home</span>}
            </div>
            {!isCollapsed && (
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-brand-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            )}
          </button>
        </div>
      </nav>

      {/* ── 4. System Status & Executive Profile Dock (Pinned Bottom) ── */}
      <div className={`shrink-0 mt-auto p-2.5 border-t border-stone-200/80 dark:border-[#382B22] space-y-2 bg-stone-50/80 dark:bg-[#150F0D] ${isCollapsed ? 'flex flex-col items-center p-2' : ''}`}>
        
        {isCollapsed ? (
          /* Collapsed Bottom Controls */
          <div className="flex flex-col items-center gap-1.5 w-full">
            {userRole === 'recruiter' && (
              <>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={isSyncing}
                  title={isDbConnected ? "PostgreSQL Live (Click to sync)" : "PostgreSQL Offline (Click to retry)"}
                  className="relative w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#2B201A] transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </button>

                <button
                  type="button"
                  onClick={onOpenAIConfig}
                  title="Configure AI Models & Keys"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#2B201A] transition"
                >
                  <Cpu className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#2B201A] transition active:scale-90 group"
            >
              <span className="transition-transform duration-300 transform group-hover:rotate-45 group-active:rotate-180 inline-flex items-center justify-center">
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
              </span>
            </button>

            <div className="w-5 h-px bg-stone-200 dark:bg-[#382B22] my-0.5" />

            <button
              type="button"
              onClick={() => (requestLogout ? requestLogout(navigate) : logout(navigate))}
              title={`Signed in as ${currentUser?.name || 'User'} • Click to sign out`}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition active:scale-[0.97] hover:ring-2 hover:ring-rose-500/40 cursor-pointer"
            >
              <Avatar name={currentUser?.name || 'User'} size="xs" />
            </button>
          </div>
        ) : (
          /* Expanded Bottom Dock */
          <>
            <div className="flex items-center justify-between px-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 shrink-0 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-stone-600 dark:text-[#D5C7BC] font-sans text-[10px] font-semibold">
                  {isDbConnected ? 'PostgreSQL Live · 14ms' : 'Database Offline'}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {userRole === 'recruiter' && (
                  <>
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={isSyncing}
                      title="Sync with database"
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-[#2B201A] transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAIConfig}
                      title="Configure AI Models & Keys"
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-[#2B201A] transition"
                    >
                      <Cpu className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-[#2B201A] transition active:scale-90 group"
                >
                  <span className="transition-transform duration-300 transform group-hover:rotate-45 group-active:rotate-180 inline-flex items-center justify-center">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-600" />}
                  </span>
                </button>
              </div>
            </div>

            {/* Executive User Card */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#231A15] border border-stone-200/90 dark:border-[#3E2E24] shadow-xs hover:bg-stone-100/60 dark:hover:bg-[#2B201A] transition-colors duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <Avatar name={currentUser?.name || (userRole === 'recruiter' ? 'ARETE Recruiter' : 'Candidate')} size="sm" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#231A15]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-stone-900 dark:text-[#F3ECE6] truncate">
                    {currentUser?.name || (userRole === 'recruiter' ? 'ARETE Recruiter' : 'Candidate')}
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-[#BAACA1] truncate">
                    {currentUser?.email || (userRole === 'recruiter' ? 'recruiter@arete.ai' : 'candidate@arete.ai')}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => (requestLogout ? requestLogout(navigate) : logout(navigate))}
                title="Sign out"
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0 active:scale-[0.97] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subtle Regulatory & Engine Stamp */}
            <div className="flex items-center justify-between px-1.5 pt-0.5 text-[10px] text-stone-400 dark:text-[#9E9085] select-none font-sans">
              <span>EEOC & SOC2 Certified</span>
              <span className="font-semibold text-stone-500 dark:text-[#B5A89E]">ARETE v3.0</span>
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
        style={{ width: isCollapsed ? 56 : sidebarWidth }}
        className={`hidden lg:flex flex-col shrink-0 h-full z-30 relative select-none border-r border-[#E5E0DA] dark:border-[#382B22] ${
          isResizing ? '' : 'transition-[width] duration-200 ease-in-out'
        }`}
      >
        {sidebarContent}
        {/* Right Resizer Handle (Desktop Only) */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            onDoubleClick={resetWidth}
            title="Drag to resize sidebar • Double-click to reset (280px)"
            className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-40 transition-colors ${
              isResizing 
                ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                : 'hover:bg-amber-500/50 active:bg-amber-500'
            } group`}
          >
            <div className={`absolute top-1/2 right-[1px] -translate-y-1/2 w-0.5 h-8 rounded-full ${
              isResizing ? 'bg-white' : 'bg-stone-300 dark:bg-stone-700 group-hover:bg-amber-400'
            }`} />
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity duration-200" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-drawer-enter">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
