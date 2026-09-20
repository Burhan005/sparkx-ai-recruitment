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
import MyApplications from './components/Candidate/MyApplications';
import ProctorLiveMonitor from './components/Proctor/ProctorLiveMonitor';
import { SkeletonKPI, SkeletonCard, FadeInUp } from './components/ui/Primitives';
import { Sparkles, ShieldCheck, Shield, User, WifiOff, RefreshCw, Terminal, Database } from 'lucide-react';

// ─── Toast bridge ─────────────────────────────────────────────────────────────
function ToastBridge() {
  const toast = useToast();
  useEffect(() => onContextToast((msg, type) => toast(msg, type || 'info')), [toast]);
  return null;
}

// ─── Full-page loading skeleton ───────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] flex flex-col">
      <div className="h-16 bg-white/90 dark:bg-[#0B0F19]/90 border-b border-slate-200 dark:border-slate-800 animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full space-y-8">
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-40 animate-pulse" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-64 animate-pulse" />
        </div>
        <SkeletonKPI />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <SkeletonCard key={i} lines={4} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Backend offline screen ───────────────────────────────────────────────────
function OfflineScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-[#070A12] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-rose-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Backend Offline</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          The SparkX API server is not reachable. All data is served from the backend — there is no static data.
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left max-w-md w-full space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" /><span>Start the backend:</span>
        </div>
        <code className="block text-xs text-emerald-400 font-mono bg-slate-950 p-3 rounded-xl leading-relaxed">
          cd C:\Sparkx\sparkx-ai-recruitment\backend<br />
          python -m uvicorn main:app --reload --port 8000
        </code>
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider pt-1">
          <Database className="w-3.5 h-3.5" /><span>Then seed demo data (first time):</span>
        </div>
        <code className="block text-xs text-cyan-400 font-mono bg-slate-950 p-3 rounded-xl">
          python seed.py
        </code>
        {error && (
          <div className="text-[11px] text-rose-400 font-mono bg-rose-950/30 p-2 rounded-lg border border-rose-800/40">
            Error: {error}
          </div>
        )}
      </div>
      <button onClick={onRetry}
        className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30">
        <RefreshCw className="w-4 h-4" />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}


// ─── Main routed content ──────────────────────────────────────────────────────
function AppContent() {
  const { currentView, setCurrentView, userRole, switchRole, isLoggedIn, login, logout, isLoading, dbError, syncWithDatabase } = useRecruitment();
  const [showTour, setShowTour] = useState(true);

  const recruiterSteps = [
    { view: 'recruiter', label: '1. Recruiter Hub & Jobs' },
    { view: 'proctor',   label: '2. Anti-Cheating Monitor' },
  ];
  const candidateSteps = [
    { view: 'candidate',  label: '1. Browse Jobs & Apply' },
    { view: 'interview',  label: '2. Live AI Interview' },
    { view: 'assessment', label: '3. Code Challenge' },
    { view: 'feedback',   label: '4. Skill Gap Report' },
  ];
  const steps = userRole === 'recruiter' ? recruiterSteps : candidateSteps;

  if (!isLoggedIn) return <LoginScreen onLogin={login} />;
  if (isLoading)   return <LoadingScreen />;
  if (dbError)     return <OfflineScreen error={dbError} onRetry={() => syncWithDatabase(false)} />;

  return (
    <div className="min-h-screen bg-ambient-mesh text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        {userRole === 'recruiter' ? (
          <>
            {currentView === 'recruiter' && <FadeInUp><CandidatePipeline /></FadeInUp>}
            {currentView === 'proctor'   && <FadeInUp><ProctorLiveMonitor /></FadeInUp>}
            {currentView !== 'recruiter' && currentView !== 'proctor' && <FadeInUp><CandidatePipeline /></FadeInUp>}
          </>
        ) : (
          <>
            {currentView === 'candidate'    && <FadeInUp><JobCatalog /></FadeInUp>}
            {currentView === 'applications' && <FadeInUp><MyApplications /></FadeInUp>}
            {currentView === 'interview'    && <FadeInUp><AIInterviewRoom /></FadeInUp>}
            {currentView === 'assessment'   && <FadeInUp><CodeAssessment /></FadeInUp>}
            {currentView === 'feedback'     && <FadeInUp><SkillGapReport /></FadeInUp>}
            {!['candidate','applications','interview','assessment','feedback'].includes(currentView) && <FadeInUp><JobCatalog /></FadeInUp>}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-[#07090E]/80 backdrop-blur-xl mt-16 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Human-in-the-Loop AI: All candidate recommendations verified by certified hiring managers.
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400 dark:text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">SparkX AI v2.4</span>
            </span>
            <span>•</span>
            <span>EEOC & SOC2 Certified</span>
            <span>•</span>
            <button onClick={logout} className="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition">
              Sign out
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