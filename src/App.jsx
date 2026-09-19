import React, { useState, useEffect } from 'react';
import { RecruitmentProvider, useRecruitment, onContextToast } from './context/RecruitmentContext';
import { ToastProvider, useToast } from './components/ui/Toast';
import Navbar from './components/Navbar';
import LoginScreen from './components/auth/LoginScreen';
import CandidatePipeline from './components/Recruiter/CandidatePipeline';
import JobCatalog from './components/Candidate/JobCatalog';
import AIInterviewRoom from './components/Candidate/AIInterviewRoom';
import CodeAssessment from './components/Candidate/CodeAssessment';
import SkillGapReport from './components/Candidate/SkillGapReport';
import ProctorLiveMonitor from './components/Proctor/ProctorLiveMonitor';
import { SkeletonKPI, SkeletonCard, FadeInUp } from './components/ui/Primitives';
import { Sparkles, ShieldCheck, Shield, User, Database, Wifi, WifiOff } from 'lucide-react';

// ─── Toast bridge: listens for toasts fired from context ─────────────────────
function ToastBridge() {
  const toast = useToast();
  useEffect(() => {
    const off = onContextToast((msg, type) => toast(msg, type || 'info'));
    return off;
  }, [toast]);
  return null;
}

// ─── DB Status indicator ──────────────────────────────────────────────────────
function DbIndicator() {
  const { isDbConnected, syncWithDatabase } = useRecruitment();
  return (
    <button
      onClick={() => syncWithDatabase(false)}
      title={isDbConnected ? 'Database connected — click to refresh' : 'Backend offline — click to retry'}
      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
        isDbConnected
          ? 'bg-emerald-950/60 border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/60'
          : 'bg-rose-950/60 border-rose-700/40 text-rose-400 hover:bg-rose-900/60'
      }`}
    >
      {isDbConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span>{isDbConnected ? 'DB Live' : 'Offline'}</span>
    </button>
  );
}

// ─── Loading skeleton screen ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] flex flex-col">
      <div className="h-16 bg-white/90 dark:bg-[#0B0F19]/90 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full space-y-8">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-40 animate-pulse" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-64 animate-pulse" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-96 animate-pulse" />
        </div>
        <SkeletonKPI />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      </div>
    </div>
  );
}

// ─── The main routed app content ──────────────────────────────────────────────
function AppContent() {
  const { currentView, setCurrentView, userRole, switchRole, isLoggedIn, login, isLoading } = useRecruitment();
  const [showTour, setShowTour] = useState(true);

  const recruiterSteps = [
    { view: 'recruiter', label: '1. Recruiter Hub & Active Jobs' },
    { view: 'proctor',   label: '2. Anti-Cheating Telemetry' },
  ];
  const candidateSteps = [
    { view: 'candidate',  label: '1. Browse Jobs & Apply' },
    { view: 'interview',  label: '2. Live AI Interview' },
    { view: 'assessment', label: '3. Code Challenge' },
    { view: 'feedback',   label: '4. Skill Gap Report' },
  ];
  const activeSteps = userRole === 'recruiter' ? recruiterSteps : candidateSteps;

  if (!isLoggedIn) {
    return <LoginScreen onLogin={login} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white bg-cyber-grid transition-colors duration-200">

      {/* Tour bar */}
      {showTour && (
        <div className="bg-indigo-50/90 dark:bg-gradient-to-r dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 border-b border-indigo-100 dark:border-indigo-800/40 px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full animate-ping ${userRole === 'recruiter' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
            <span className="font-bold text-slate-900 dark:text-white">
              {userRole === 'recruiter' ? '👔 Admin View:' : '🎓 Candidate View:'}
            </span>
            <span className="hidden md:inline text-slate-600 dark:text-slate-400">
              {userRole === 'recruiter'
                ? 'Manage job requirements, screen applicants, review AI scorecards & fraud alerts'
                : 'Explore job openings, upload resume, complete voice AI interview & coding challenge'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {activeSteps.map((step, idx) => (
                <button key={idx} onClick={() => setCurrentView(step.view)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${currentView === step.view ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'}`}>
                  {step.label}
                </button>
              ))}
            </div>
            <DbIndicator />
            <button onClick={() => setShowTour(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] hidden lg:inline underline">Hide</button>
          </div>
        </div>
      )}

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        {userRole === 'recruiter' ? (
          <>
            {currentView === 'recruiter' && <FadeInUp><CandidatePipeline /></FadeInUp>}
            {currentView === 'proctor' && <FadeInUp><ProctorLiveMonitor /></FadeInUp>}
            {currentView !== 'recruiter' && currentView !== 'proctor' && <FadeInUp><CandidatePipeline /></FadeInUp>}
          </>
        ) : (
          <>
            {currentView === 'candidate' && <FadeInUp><JobCatalog /></FadeInUp>}
            {currentView === 'interview' && <FadeInUp><AIInterviewRoom /></FadeInUp>}
            {currentView === 'assessment' && <FadeInUp><CodeAssessment /></FadeInUp>}
            {currentView === 'feedback' && <FadeInUp><SkillGapReport /></FadeInUp>}
            {!['candidate','interview','assessment','feedback'].includes(currentView) && <FadeInUp><JobCatalog /></FadeInUp>}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900/80 bg-white/80 dark:bg-[#0B0F19]/90 mt-16 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Fairness & Safety Protocol: AI flags & recommends; human recruiters make final hiring decisions.
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Role: <strong className="text-slate-800 dark:text-slate-200 capitalize">{userRole}</strong></span>
            <span>•</span>
            <button onClick={() => switchRole(userRole === 'recruiter' ? 'candidate' : 'recruiter')} className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Switch to {userRole === 'recruiter' ? 'Candidate' : 'Recruiter'} Mode
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <RecruitmentProvider>
      <ToastProvider>
        <ToastBridge />
        <AppContent />
      </ToastProvider>
    </RecruitmentProvider>
  );
}