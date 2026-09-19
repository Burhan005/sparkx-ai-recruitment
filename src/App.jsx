import React, { useState } from 'react';
import { RecruitmentProvider, useRecruitment } from './context/RecruitmentContext';
import Navbar from './components/Navbar';
import CandidatePipeline from './components/Recruiter/CandidatePipeline';
import JobCatalog from './components/Candidate/JobCatalog';
import AIInterviewRoom from './components/Candidate/AIInterviewRoom';
import CodeAssessment from './components/Candidate/CodeAssessment';
import SkillGapReport from './components/Candidate/SkillGapReport';
import ProctorLiveMonitor from './components/Proctor/ProctorLiveMonitor';
import { 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Info,
  ExternalLink,
  Shield,
  User
} from 'lucide-react';

function AppContent() {
  const { currentView, setCurrentView, userRole, switchRole } = useRecruitment();
  const [showDemoGuide, setShowDemoGuide] = useState(true);

  const recruiterSteps = [
    { view: 'recruiter', label: '1. Recruiter Hub & Active Jobs' },
    { view: 'recruiter', label: '2. Candidate Pipeline & Review' },
    { view: 'proctor', label: '3. Anti-Cheating Telemetry' }
  ];

  const candidateSteps = [
    { view: 'candidate', label: '1. Browse Jobs & Apply' },
    { view: 'interview', label: '2. Live Adaptive AI Interview' },
    { view: 'assessment', label: '3. Practical Code Challenge' },
    { view: 'feedback', label: '4. Skill Gap Feedback & Roadmap' }
  ];

  const activeSteps = userRole === 'recruiter' ? recruiterSteps : candidateSteps;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white bg-cyber-grid transition-colors duration-200">
      
      {/* Role-Specific Quick Tour Bar */}
      {showDemoGuide && (
        <div className="bg-indigo-50/90 dark:bg-gradient-to-r dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 border-b border-indigo-100 dark:border-indigo-800/40 px-4 py-2 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full animate-ping ${userRole === 'recruiter' ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
            <span className="font-bold text-slate-900 dark:text-white">
              {userRole === 'recruiter' ? '👔 Admin (Recruiter) View:' : '🎓 User (Candidate) View:'}
            </span>
            <span className="hidden md:inline text-slate-600 dark:text-slate-400">
              {userRole === 'recruiter' 
                ? 'Manage job requirements, screen applicants, review AI scorecards & fraud alerts' 
                : 'Explore job openings, upload resume, complete voice AI interview & coding challenge'}
            </span>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {activeSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentView(step.view)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                  currentView === step.view
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {step.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowDemoGuide(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] hidden lg:inline underline"
          >
            Hide Tour
          </button>
        </div>
      )}

      {/* Main Navbar with Role Switcher & Theme Toggle */}
      <Navbar />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        {userRole === 'recruiter' ? (
          <>
            {currentView === 'recruiter' && <CandidatePipeline />}
            {currentView === 'proctor' && <ProctorLiveMonitor />}
            {/* Fallback to recruiter if switched from candidate view */}
            {currentView !== 'recruiter' && currentView !== 'proctor' && <CandidatePipeline />}
          </>
        ) : (
          <>
            {currentView === 'candidate' && <JobCatalog />}
            {currentView === 'interview' && <AIInterviewRoom />}
            {currentView === 'assessment' && <CodeAssessment />}
            {currentView === 'feedback' && <SkillGapReport />}
            {/* Fallback to candidate if switched from recruiter view */}
            {currentView !== 'candidate' && currentView !== 'interview' && currentView !== 'assessment' && currentView !== 'feedback' && <JobCatalog />}
          </>
        )}
      </main>

      {/* Slide 17 Footer: Privacy, Fairness & Safety Policy */}
      <footer className="border-t border-slate-200 dark:border-slate-900/80 bg-white/80 dark:bg-[#0B0F19]/90 mt-16 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Fairness & Safety Protocol: AI flags & recommends; qualified human recruiters make the final hiring decisions.
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
            <span>Role: <strong className="text-slate-800 dark:text-slate-200 capitalize">{userRole}</strong></span>
            <span>•</span>
            <button 
              onClick={() => switchRole(userRole === 'recruiter' ? 'candidate' : 'recruiter')}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Switch to {userRole === 'recruiter' ? 'Candidate Mode' : 'Recruiter Mode'}
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
      <AppContent />
    </RecruitmentProvider>
  );
}
