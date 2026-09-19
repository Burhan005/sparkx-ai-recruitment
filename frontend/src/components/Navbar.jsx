import React from 'react';
import { useRecruitment } from '../context/RecruitmentContext';
import { 
  Briefcase, UserCheck, Video, Code2, ShieldAlert, Sparkles,
  Sun, Moon, TrendingUp, LogOut, RefreshCw
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-[#080B11]/80 backdrop-blur-xl transition-all duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setCurrentView(userRole === 'recruiter' ? 'recruiter' : 'candidate')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">SparkX AI</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                  userRole === 'recruiter'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                  {userRole === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </span>
                {isDbConnected && (
                  <span className="flex items-center space-x-1 text-[10px] text-emerald-500 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="hidden sm:inline text-emerald-500/90 font-mono">DB Live</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Recruitment Intelligence Platform</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/70 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/[0.06]">
            {currentNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">

            {/* Sync button */}
            <button
              onClick={() => syncWithDatabase(false)}
              title="Sync state with database"
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Authenticated User Identity Chip */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/[0.08]">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-none">
                  {userRole === 'recruiter' ? 'Recruiter' : 'Candidate'}
                </span>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition hover:scale-105 active:scale-95"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition hover:scale-105 active:scale-95"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}