import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
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
  BookmarkCheck
} from 'lucide-react';
import { Avatar } from '../ui/Primitives';
import { formatShortcut } from '../../utils/keyboardShortcut';

export default function AppSidebar({ 
  onOpenCommandMenu, 
  onOpenAIConfig,
  onOpenAskSparkx,
  isMobileOpen,
  onCloseMobile
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    userRole, 
    currentUser, 
    theme, 
    toggleTheme, 
    syncWithDatabase, 
    isDbConnected, 
    logout,
    myApplications = [],
    candidates = [],
    jobs = [],
    activeJob
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
          badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        },
        { 
          path: '/recruiter/proctor', 
          label: 'Live Integrity HUD', 
          icon: ShieldAlert, 
          badge: 'Live',
          isLive: true,
          badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        },
      ]
    },
    {
      title: 'Assessment & Studio',
      items: [
        { 
          path: '/recruiter/assessment-studio', 
          label: 'Assessment & Coding Studio', 
          icon: Code2, 
          badge: 'Authoring',
          badgeColor: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
        },
        { 
          path: '/recruiter/interview-studio', 
          label: 'AI Interview Questions', 
          icon: Video, 
          badge: 'Rubrics',
          badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
        },
        { 
          path: '/skill-gap', 
          label: 'Skill Gap & Analytics', 
          icon: TrendingUp,
          badge: 'Dossier',
          badgeColor: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
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
          badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
        },
        {
          path: '/recruiter?filter=alerts',
          label: 'Integrity Alerts',
          icon: AlertCircle,
          badge: highRiskCount > 0 ? String(highRiskCount) : '0',
          alert: highRiskCount > 0,
          badgeColor: highRiskCount > 0 
            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
    <div className="flex flex-col h-full bg-white dark:bg-[#090D16] text-slate-700 dark:text-slate-300 select-none overflow-hidden transition-colors duration-150 border-r border-slate-200 dark:border-slate-800/80">
      
      {/* ── 1. Brand & Workspace Header (Pinned) ── */}
      <div className={`h-14 shrink-0 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'} border-b border-slate-200/90 dark:border-slate-800/80`}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapse}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 hover:opacity-90 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group transition-all"
            title={`Expand sidebar (${formatShortcut('B')})`}
          >
            <Sparkles className="w-4 h-4 group-hover:hidden transition-transform" />
            <ChevronRight className="w-4 h-4 hidden group-hover:block transition-transform" />
          </button>
        ) : (
          <>
            <div 
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              onClick={() => navigate(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
              title="SparkX AI Recruitment OS"
            >
              {/* Refined Brand Logo Icon */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/25 shrink-0 ring-1 ring-white/20 dark:ring-white/10">
                <Sparkles className="w-4 h-4" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">SparkX</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-mono">
                    {userRole === 'recruiter' ? 'OS' : 'PRO'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{userRole === 'recruiter' ? 'Acme Global · Production' : 'Candidate Portal'}</span>
                </div>
              </div>
            </div>

            {/* Desktop Collapse Trigger */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
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
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── 2. Unified Command Search & Copilot Launchers (Pinned) ── */}
      <div className={`shrink-0 p-2.5 space-y-1.5 border-b border-slate-200/80 dark:border-slate-800/70 ${isCollapsed ? 'flex flex-col items-center p-2' : ''}`}>
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
          } bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-900/60 dark:hover:bg-slate-800/70 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/90 dark:border-slate-800/80 transition text-xs shadow-xs`}
          title={`Quick Search (${formatShortcut('K')})`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            {!isCollapsed && <span className="font-medium text-slate-600 dark:text-slate-300 text-xs truncate">Quick Search...</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-xs shrink-0">
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
          } bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/50 transition text-xs shadow-xs`}
          title={`Ask SparkX Intelligence Copilot (${formatShortcut('J')})`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform" />
            {!isCollapsed && <span className="font-semibold text-indigo-900 dark:text-indigo-200 text-xs truncate">Ask SparkX AI</span>}
          </div>
          {!isCollapsed && (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-white/90 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800/60 rounded shadow-xs shrink-0">
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
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
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
                      navigate(item.path);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                    className={`relative flex items-center ${
                      isCollapsed 
                        ? 'w-9 h-9 justify-center p-0 rounded-xl' 
                        : 'w-full justify-between px-2.5 py-2 rounded-xl'
                    } text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    {/* Active Accent Bar on Left */}
                    {active && !isCollapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-600 dark:bg-brand-500" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        active 
                          ? 'text-brand-600 dark:text-brand-400' 
                          : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200'
                      }`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                        item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {item.isLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {item.alert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-subtle" />}
                        <span>{item.badge}</span>
                      </span>
                    )}

                    {/* Collapsed dot badge */}
                    {isCollapsed && item.badge && (
                      <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                        item.isLive ? 'bg-emerald-500 animate-pulse' : item.alert ? 'bg-rose-500' : 'bg-brand-600'
                      } ring-2 ring-white dark:ring-slate-900`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* System Settings Link for Recruiter */}
        {userRole === 'recruiter' && (
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            {!isCollapsed && (
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
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
              } text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition`}
              title="Configure AI Models & Evaluator Parameters"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-indigo-500" />
                {!isCollapsed && <span>AI Model Engine</span>}
              </div>
              {!isCollapsed && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  Settings
                </span>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* ── 4. System Status & Executive Profile Dock (Pinned Bottom) ── */}
      <div className={`shrink-0 mt-auto p-2.5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2 bg-slate-50/70 dark:bg-[#070A12] ${isCollapsed ? 'flex flex-col items-center p-2' : ''}`}>
        
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
                  className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </button>

                <button
                  type="button"
                  onClick={onOpenAIConfig}
                  title="Configure AI Models & Keys"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>

            <div className="w-5 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

            <button
              type="button"
              onClick={logout}
              title={`Signed in as ${currentUser?.name || 'User'} • Click to sign out`}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:ring-2 hover:ring-rose-500/40"
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
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] font-medium">
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
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAIConfig}
                      title="Configure AI Models & Keys"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                    >
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              </div>
            </div>

            {/* Executive User Card */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#101420] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <Avatar name={currentUser?.name || (userRole === 'recruiter' ? 'SparkX Admin' : 'Candidate')} size="sm" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#101420]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.name || (userRole === 'recruiter' ? 'SparkX Admin' : 'Candidate')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {currentUser?.email || (userRole === 'recruiter' ? 'admin@sparkx.ai' : 'candidate@sparkx.ai')}
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={logout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Strictly Fixed to 100% viewport height, never scrolls */}
      <aside className={`hidden lg:flex flex-col shrink-0 h-full z-30 overflow-hidden border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-14' : 'w-64'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
