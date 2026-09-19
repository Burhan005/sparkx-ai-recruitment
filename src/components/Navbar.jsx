import React from 'react';
import { useRecruitment } from '../context/RecruitmentContext';
import { 
  Briefcase, 
  UserCheck, 
  Video, 
  Code2, 
  ShieldAlert, 
  Sparkles,
  Award
} from 'lucide-react';

export default function Navbar() {
  const { currentView, setCurrentView } = useRecruitment();

  const navItems = [
    { id: 'recruiter', label: 'Recruiter Portal', icon: Briefcase },
    { id: 'candidate', label: 'Job Catalog & Apply', icon: UserCheck },
    { id: 'interview', label: 'Live AI Interview', icon: Video, badge: 'Adaptive' },
    { id: 'assessment', label: 'Skill Assessment', icon: Code2 },
    { id: 'proctor', label: 'Integrity Monitor', icon: ShieldAlert, badge: 'Live' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Hackathon Tag */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('recruiter')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
                  SparkX AI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smarter Hiring with Artificial Intelligence</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-900/60 text-indigo-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Status / Team badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline text-slate-400">Team:</span>
              <span className="font-semibold text-white">SparkX</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
