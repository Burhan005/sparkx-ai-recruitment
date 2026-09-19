import React from 'react';
import { useRecruitment } from '../context/RecruitmentContext';
import { 
  Briefcase, 
  UserCheck, 
  Video, 
  Code2, 
  ShieldAlert, 
  Sparkles,
  Sun,
  Moon,
  Shield,
  User,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

export default function Navbar() {
  const { 
    currentView, 
    setCurrentView, 
    theme, 
    toggleTheme, 
    userRole, 
    switchRole 
  } = useRecruitment();

  // Recruiter (Admin) Navigation Items
  const recruiterNavItems = [
    { id: 'recruiter', label: 'Recruiter Dashboard', icon: Briefcase },
    { id: 'proctor', label: 'Anti-Cheating Telemetry', icon: ShieldAlert, badge: 'Live HUD' }
  ];

  // Candidate (User) Navigation Items
  const candidateNavItems = [
    { id: 'candidate', label: 'Browse Jobs & Apply', icon: UserCheck },
    { id: 'interview', label: 'AI Video Interview', icon: Video, badge: 'Adaptive' },
    { id: 'assessment', label: 'Live Skill Assessment', icon: Code2 },
    { id: 'feedback', label: 'My Skill Gap & Feedback', icon: TrendingUp }
  ];

  const currentNavItems = userRole === 'recruiter' ? recruiterNavItems : candidateNavItems;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView(userRole === 'recruiter' ? 'recruiter' : 'candidate')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  SparkX AI
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  userRole === 'recruiter'
                    ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                }`}>
                  {userRole === 'recruiter' ? 'Admin Portal' : 'Candidate Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Smarter Hiring with Artificial Intelligence</p>
            </div>
          </div>

          {/* Navigation links dynamically filtered by User Role */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Role Switcher & Theme Toggle */}
          <div className="flex items-center space-x-2.5">
            
            {/* RBAC Role Switcher Toggle (Admin Recruiter vs User Candidate) */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => switchRole('recruiter')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  userRole === 'recruiter'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Switch to Recruiter (Admin) Mode"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recruiter (Admin)</span>
              </button>

              <button
                onClick={() => switchRole('candidate')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  userRole === 'candidate'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Switch to Candidate (User) Mode"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Candidate (User)</span>
              </button>
            </div>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center justify-center"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
