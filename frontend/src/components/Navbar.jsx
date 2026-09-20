import React, { useState, useEffect, useRef } from 'react';
import { useRecruitment } from '../context/RecruitmentContext';
import AIConfigModal from './AIConfigModal';
import { api } from '../services/api';
import { 
  Briefcase, UserCheck, Video, Code2, ShieldAlert, Sparkles,
  Sun, Moon, TrendingUp, LogOut, RefreshCw, Cpu, Menu, X,
  ChevronDown, Shield, Database, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function Navbar() {
  const { 
    currentView, 
    setCurrentView, 
    theme, 
    toggleTheme, 
    userRole, 
    logout, 
    syncWithDatabase, 
    isDbConnected, 
    currentUser 
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
    { id: 'recruiter', label: 'Recruiter Hub', icon: Briefcase },
    { id: 'proctor',   label: 'Integrity Telemetry', icon: ShieldAlert, badge: 'Live HUD' },
  ];
  const candidateNavItems = [
    { id: 'candidate',  label: 'Browse Openings', icon: UserCheck },
    { id: 'interview',  label: 'AI Interview Room', icon: Video, badge: 'Adaptive' },
    { id: 'assessment', label: 'Code Assessment', icon: Code2 },
    { id: 'feedback',   label: 'Skill Gap Roadmap', icon: TrendingUp },
  ];
  const currentNavItems = userRole === 'recruiter' ? recruiterNavItems : candidateNavItems;

  const navigateTo = (viewId) => {
    setCurrentView(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#06080E]/85 backdrop-blur-2xl transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ─── Left: Brand Identity & Mode Badge ─── */}
            <div 
              className="flex items-center space-x-3 cursor-pointer group select-none" 
              onClick={() => navigateTo(userRole === 'recruiter' ? 'recruiter' : 'candidate')}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/25 group-hover:scale-105 transition-all duration-300">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-sm -z-10 group-hover:bg-indigo-500/40 transition" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-lg tracking-tight text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-slate-100 dark:to-indigo-200">
                    SparkX AI
                  </span>
                  <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${
                    userRole === 'recruiter'
                      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25 shadow-sm'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 shadow-sm'
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
                      className={`hidden lg:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition hover:scale-105 active:scale-95 cursor-pointer ${
                        aiStatus.active
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-800/40'
                          : 'bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-800/40 hover:border-amber-500/60'
                      }`}
                      title="Click to configure Real-Time LLM Intelligence (Gemini/Groq/OpenAI)"
                    >
                      <Cpu className="w-3 h-3" />
                      <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.active ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                      <span>{aiStatus.active ? `Live LLM (${aiStatus.provider?.split(' ')[0]})` : 'Simulated AI (Key)'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                  Autonomous Talent Intelligence Suite
                </p>
              </div>
            </div>

            {/* ─── Center: Desktop Navigation Tabs ─── */}
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-inner">
              {currentNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/35 ring-1 ring-white/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
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
            <div className="flex items-center space-x-2 sm:space-x-2.5">

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
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/30' 
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-emerald-600/30'
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
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-md ${
                          userRole === 'recruiter' 
                            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white' 
                            : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
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
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
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
                className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
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
            className="md:hidden border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#06080E]/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-4 duration-200"
          >
            {/* Nav links */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Navigation</span>
              {currentNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
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