import React, { useState, useEffect } from 'react';
import { useRecruitment } from '../context/RecruitmentContext';
import AIConfigModal from './AIConfigModal';
import { api } from '../services/api';
import { 
  Briefcase, UserCheck, Video, Code2, ShieldAlert, Sparkles,
  Sun, Moon, TrendingUp, LogOut, RefreshCw, Cpu
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

  useEffect(() => {
    async function checkStatus() {
      const res = await api.getAIStatus();
      if (res) setAiStatus(res);
    }
    checkStatus();
  }, []);

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#06080E]/75 backdrop-blur-2xl transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand Identity */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group select-none" 
            onClick={() => setCurrentView(userRole === 'recruiter' ? 'recruiter' : 'candidate')}
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
                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  userRole === 'recruiter'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/25 shadow-sm shadow-purple-500/10'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25 shadow-sm shadow-emerald-500/10'
                }`}>
                  {userRole === 'recruiter' ? 'Recruiter Hub' : 'Candidate'}
                </span>
                {userRole === 'recruiter' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAIModalOpen(true);
                    }}
                    className={`hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition hover:scale-105 active:scale-95 cursor-pointer ${
                      aiStatus.active
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 shadow-sm shadow-emerald-500/10'
                        : 'bg-amber-950/40 text-amber-400 border-amber-800/40 hover:border-amber-500/60'
                    }`}
                    title="Click to configure Real-Time LLM Intelligence (Gemini/Groq/OpenAI)"
                  >
                    <Cpu className="w-3 h-3" />
                    <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.active ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span>{aiStatus.active ? `Live LLM (${aiStatus.provider?.split(' ')[0]})` : 'Simulated AI (Connect Key)'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                Enterprise Talent Intelligence Suite
              </p>
            </div>
          </div>

          {/* Navigation Segment Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-inner">
            {currentNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
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

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2.5">

            {/* Sync button */}
            <button
              onClick={() => syncWithDatabase(false)}
              title="Sync state with database"
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover:scale-105 active:scale-95 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Authenticated User Identity Chip */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.08] shadow-sm">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ring-1 ring-white/20 ${
                userRole === 'recruiter' 
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/30' 
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-emerald-600/30'
              }`}>
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : (userRole === 'recruiter' ? 'R' : 'C')}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                  {currentUser?.name || (userRole === 'recruiter' ? 'Admin' : 'Candidate')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-none font-medium">
                  {userRole === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition hover:scale-105 active:scale-95 shadow-sm text-xs font-bold ${
                theme === 'dark'
                  ? 'border-white/[0.08] bg-slate-900/90 text-amber-300 hover:border-amber-400/40'
                  : 'border-slate-200 bg-white text-indigo-600 hover:border-indigo-400'
              }`}
              title={`Currently in ${theme === 'dark' ? 'Dark' : 'Light'} Mode. Click to toggle.`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Dark Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Light Mode</span>
                </>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition hover:scale-105 active:scale-95 shadow-sm"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>

      {userRole === 'recruiter' && (
        <AIConfigModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onConfigUpdated={(newStatus) => setAiStatus(newStatus)}
        />
      )}
    </header>
  );
}