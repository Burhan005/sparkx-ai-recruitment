import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../context/RecruitmentContext';
import AIConfigModal from './AIConfigModal';
import { api } from '../services/api';
import { 
  Briefcase, UserCheck, Video, Code2, ShieldAlert, Sparkles,
  Sun, Moon, TrendingUp, LogOut, RefreshCw, Cpu, Menu, X,
  ChevronDown, Shield, Database, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    theme, 
    toggleTheme, 
    userRole, 
    logout, 
    syncWithDatabase, 
    isDbConnected, 
    currentUser,
    myApplications = [],
    activeJob
  } = useRecruitment();

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState({ active: false, provider: 'Local NLP', has_key: false });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        // Only close if click wasn't on the hamburger button itself
        const hamburger = document.getElementById('sparkx-hamburger-btn');
        if (!hamburger || !hamburger.contains(e.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on Esc
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function checkStatus() {
      const res = await api.getAIStatus();
      if (res) setAiStatus(res);
    }
    checkStatus();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithDatabase(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const recruiterNavItems = [
    { path: '/recruiter', label: 'Recruiter Hub', icon: Briefcase },
    { path: '/recruiter/proctor', label: 'Integrity Telemetry', icon: ShieldAlert, badge: 'Live HUD' },
  ];
  const isNonTech = Boolean(activeJob && (
    /finance|account|tax|audit|cpa|controller|treasur|bookkeep/i.test(activeJob.title || '') ||
    /finance|account/i.test(activeJob.department || '') ||
    /hr|human\s*resource|recruiter|talent|people/i.test(activeJob.title || '') ||
    /hr|human\s*resource/i.test(activeJob.department || '') ||
    /market|seo|content|copywrit|growth|brand/i.test(activeJob.title || '') ||
    /market/i.test(activeJob.department || '') ||
    /sales|business\s*dev|account\s*exec/i.test(activeJob.title || '') ||
    /sales/i.test(activeJob.department || '') ||
    /legal|compliance|counsel/i.test(activeJob.title || '') ||
    /operat|logistics|supply\s*chain/i.test(activeJob.title || '')
  ));

  const candidateNavItems = [
    { path: '/jobs', label: 'Browse Jobs', icon: UserCheck },
    { path: '/my-applications', label: 'My Applications', icon: FileText, badge: myApplications.length > 0 ? String(myApplications.length) : null },
    { path: '/interview', label: 'AI Interview', icon: Video, badge: 'Adaptive' },
    { path: '/assessment', label: isNonTech ? 'Assessment' : 'Code Challenge', icon: isNonTech ? FileText : Code2 },
    { path: '/skill-gap', label: 'Skill Gap', icon: TrendingUp },
  ];
  const currentNavItems = userRole === 'recruiter' ? recruiterNavItems : candidateNavItems;

  const navigateTo = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isItemActive = (itemPath) => {
    if (itemPath === '/recruiter') {
      return location.pathname === '/recruiter' || location.pathname.startsWith('/recruiter/jobs') || location.pathname.startsWith('/recruiter/candidates');
    }
    if (itemPath === '/jobs') {
      return location.pathname === '/jobs' || location.pathname.startsWith('/jobs/');
    }
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#06080E]/85 backdrop-blur-2xl transition-all duration-300 shadow-sm">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex items-center justify-between h-16">

            {/* ─── Left: Brand Identity & Mode Badge ─── */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group select-none shrink-0" 
              onClick={() => navigateTo(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-subtle group-hover:bg-brand-500 transition-colors">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="shrink-0">
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    SparkX AI
                  </span>
                  <span className={`text-2xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    userRole === 'recruiter'
                      ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/25'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                  }`}>
                    {userRole === 'recruiter' ? 'Recruiter Hub' : 'Candidate'}
                  </span>

                  {/* Recruiter Live AI status chip */}
                  {userRole === 'recruiter' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAIModalOpen(true);
                      }}
                      className={`hidden xl:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap ${
                        aiStatus.active
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-800/40'
                          : 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-800/40 hover:border-amber-500/60'
                      }`}
                      title="Click to configure Real-Time LLM Intelligence (Gemini/Groq/OpenAI)"
                    >
                      <Cpu className="w-3 h-3" />
                      <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.active ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                      <span>{aiStatus.active ? `Live LLM (${aiStatus.provider?.split(' ')[0]})` : 'Local NLP Engine'}</span>
                    </button>
                  )}
                </div>
                <p className="hidden xl:block text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight whitespace-nowrap">
                  Autonomous Talent Intelligence Suite
                </p>
              </div>
            </div>

            {/* ─── Center: Desktop Navigation Tabs ─── */}
            <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-inner shrink-0">
              {currentNavItems.map(item => {
                const Icon = item.icon;
                const isActive = isItemActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 relative whitespace-nowrap shrink-0 ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/35 ring-1 ring-white/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive 
                          ? 'bg-white/25 text-white' 
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* ─── Right Action Controls ─── */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border transition hover:scale-105 active:scale-95 shadow-sm text-xs font-bold ${
                  theme === 'dark'
                    ? 'border-white/[0.08] bg-slate-900/90 text-amber-300 hover:border-amber-400/40'
                    : 'border-slate-200 bg-slate-100 text-indigo-600 hover:border-indigo-400'
                }`}
                title={`Currently in ${theme === 'dark' ? 'Dark' : 'Light'} Mode. Click to switch.`}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline text-[11px] font-semibold">Dark</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline text-[11px] font-semibold">Light</span>
                  </>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(p => !p)}
                  className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.08] hover:border-indigo-500/40 transition shadow-sm"
                  title="Account Profile & Settings"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ring-1 ring-white/20 ${
                    userRole === 'recruiter' 
                      ? 'bg-brand-600 text-white shadow-subtle' 
                      : 'bg-emerald-600 text-white shadow-subtle'
                  }`}>
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : (userRole === 'recruiter' ? 'R' : 'C')}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 leading-tight truncate max-w-[100px]">
                      {currentUser?.name || (userRole === 'recruiter' ? 'Admin' : 'Candidate')}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-none font-medium">
                      {userRole === 'recruiter' ? 'Recruiter' : 'Candidate'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.1] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    
                    {/* User Info Header */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-white/[0.05] mb-2">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-sm ${
                          userRole === 'recruiter' 
                            ? 'bg-brand-600 text-white' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {currentUser?.name || 'SparkX User'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {currentUser?.email || `${userRole}@sparkx.ai`}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Role</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          userRole === 'recruiter'
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/40'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                        }`}>
                          {userRole === 'recruiter' ? 'Recruiter Admin' : 'Candidate'}
                        </span>
                      </div>
                    </div>

                    {/* Recruiter System Telemetry (Hidden completely from candidate view) */}
                    {userRole === 'recruiter' && (
                      <div className="p-2 text-[11px] space-y-1.5 border-b border-slate-100 dark:border-white/[0.06] pb-2 mb-2">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                          <span className="flex items-center space-x-1.5">
                            <Database className="w-3.5 h-3.5 text-slate-400" />
                            <span>Database Status</span>
                          </span>
                          <button
                            onClick={handleSync}
                            title="Click to verify & sync database connection"
                            className={`font-bold flex items-center space-x-1 hover:opacity-80 transition cursor-pointer ${isDbConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{isDbConnected ? 'Online' : 'Offline'}</span>
                            <RefreshCw className={`w-2.5 h-2.5 ml-1 ${isSyncing ? 'animate-spin' : ''}`} />
                          </button>
                        </div>

                        <div 
                          className="flex items-center justify-between text-slate-600 dark:text-slate-300 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsAIModalOpen(true);
                          }}
                        >
                          <span className="flex items-center space-x-1.5">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            <span>AI Provider</span>
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 underline decoration-dotted">
                            {aiStatus.provider || 'Local NLP'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dropdown Actions */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <span className="flex items-center space-x-2">
                          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                          <span>Toggle Theme</span>
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{theme}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Mobile Hamburger Toggle Button */}
              <button
                id="sparkx-hamburger-btn"
                type="button"
                onClick={() => setIsMobileMenuOpen(p => !p)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

            </div>

          </div>
        </div>

        {/* ─── Mobile Navigation Slide-Down Drawer ─── */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#06080E]/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-4 duration-200"
          >
            {/* Nav links */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Navigation</span>
              {currentNavItems.map(item => {
                const Icon = item.icon;
                const isActive = isItemActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Footer Status & Quick Actions */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] space-y-2">
              {userRole === 'recruiter' && (
                <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>Database:</span>
                  </span>
                  <button
                    onClick={handleSync}
                    className={`font-bold flex items-center space-x-1 hover:opacity-80 transition cursor-pointer ${isDbConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span>{isDbConnected ? 'Online & Live' : 'Offline'}</span>
                    <RefreshCw className={`w-2.5 h-2.5 ml-1 ${isSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}

              {userRole === 'recruiter' && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAIModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <span className="flex items-center space-x-2">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>AI Engine Config</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                    {aiStatus.provider?.split(' ')[0] || 'Local'}
                  </span>
                </button>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 dark:text-rose-400"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </header>

      {userRole === 'recruiter' && (
        <AIConfigModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onConfigUpdated={(newStatus) => setAiStatus(newStatus)}
        />
      )}
    </>
  );
}