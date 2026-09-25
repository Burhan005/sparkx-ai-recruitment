import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRecruitment } from '../../../context/RecruitmentContext';
import CandidateWorkspaceHeader from './CandidateWorkspaceHeader';
import CandidateOverviewTab from './CandidateOverviewTab';
import AssessmentEvidenceTab from './AssessmentEvidenceTab';
import InterviewEvidenceTab from './InterviewEvidenceTab';
import SkillIntelligenceTab from './SkillIntelligenceTab';
import IntegrityAuditTab from './IntegrityAuditTab';
import RecruiterDecisionTab from './RecruiterDecisionTab';
import AuditTimelineTab from './AuditTimelineTab';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import ResumeViewerModal from './ResumeViewerModal';
import {
  FileText, 
  Code2, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  History,
  Users,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, Badge, StatusBadge, Button } from '../../ui/Primitives';

export default function CandidateWorkspace({
  candidateId: propCandidateId,
  onClose,
  onOpenAskSparkx
}) {
  const navigate = useNavigate();
  const { candidateId: routeCandidateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeCandidateId = routeCandidateId || propCandidateId;

  const { 
    candidates = [], 
    jobs = [], 
    activeJobId,
    setSelectedCandidate,
    updateCandidateStage,
    updateHiringDecision,
    inviteAssessment,
    scheduleInterview
  } = useRecruitment();

  const [activeTab, setActiveTab] = useState(urlTab || 'overview');
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Sync tab with URL if changed externally
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tabId);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Find candidate in context
  const currentCandidate = useMemo(() => {
    return candidates.find(c => String(c.id) === String(activeCandidateId)) || candidates[0] || null;
  }, [candidates, activeCandidateId]);

  // Candidate index in list for Next / Prev
  const currentIndex = useMemo(() => {
    if (!currentCandidate) return 0;
    return candidates.findIndex(c => String(c.id) === String(currentCandidate.id));
  }, [candidates, currentCandidate]);

  const activeJob = useMemo(() => {
    if (!currentCandidate) return null;
    return jobs.find(j => String(j.id) === String(currentCandidate.jobId || currentCandidate.job_id)) || null;
  }, [jobs, currentCandidate]);

  // Navigate to another candidate while preserving review tab
  const handleSelectCandidate = useCallback((cand) => {
    if (!cand) return;
    if (setSelectedCandidate) {
      setSelectedCandidate(cand);
    }
    navigate(`/recruiter/candidates/${cand.id}?tab=${activeTab}`);
  }, [navigate, activeTab, setSelectedCandidate]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0 && candidates[currentIndex - 1]) {
      handleSelectCandidate(candidates[currentIndex - 1]);
    }
  }, [currentIndex, candidates, handleSelectCandidate]);

  const handleNext = useCallback(() => {
    if (currentIndex < candidates.length - 1 && candidates[currentIndex + 1]) {
      handleSelectCandidate(candidates[currentIndex + 1]);
    }
  }, [currentIndex, candidates, handleSelectCandidate]);

  const handleBackToPipeline = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate('/recruiter');
    }
  }, [onClose, navigate]);

  // Keyboard Navigation: J/K or [/] for candidate switching, Esc for back/modal close, 1-7 for tabs
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input/textarea/select or editable area
      const target = e.target;
      const activeEl = document.activeElement;
      if (
        (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) ||
        (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable))
      ) {
        return;
      }

      // If scheduler modal is open, let Escape close modal and suppress other hotkeys
      if (isSchedulerOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsSchedulerOpen(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleBackToPipeline();
      } else if (e.key === 'j' || e.key === 'J' || e.key === '[') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'k' || e.key === 'K' || e.key === ']') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '1') {
        e.preventDefault();
        handleTabChange('overview');
      } else if (e.key === '2') {
        e.preventDefault();
        handleTabChange('assessment');
      } else if (e.key === '3') {
        e.preventDefault();
        handleTabChange('interview');
      } else if (e.key === '4') {
        e.preventDefault();
        handleTabChange('skills');
      } else if (e.key === '5') {
        e.preventDefault();
        handleTabChange('integrity');
      } else if (e.key === '6') {
        e.preventDefault();
        handleTabChange('decision');
      } else if (e.key === '7') {
        e.preventDefault();
        handleTabChange('timeline');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBackToPipeline, handlePrevious, handleNext, handleTabChange, isSchedulerOpen]);

  // Reset scroll to top whenever candidate changes so content is never cut off
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollables = document.querySelectorAll('.overflow-y-auto');
    scrollables.forEach(el => { el.scrollTop = 0; });
  }, [currentCandidate?.id]);

  // Filter candidates for left quick switcher
  const filteredCandidates = useMemo(() => {
    const q = sidebarSearch.toLowerCase().trim();
    if (!q) return candidates;
    return candidates.filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.jobTitle?.toLowerCase().includes(q) ||
      c.skills?.some(s => s.toLowerCase().includes(q))
    );
  }, [candidates, sidebarSearch]);

  if (!currentCandidate) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07090E] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Candidate Selected</h2>
        <Button variant="secondary" onClick={handleBackToPipeline} className="mt-4">
          Return to Pipeline
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview',   label: 'Dossier',           icon: FileText },
    { id: 'assessment', label: 'Assessment Code',    icon: Code2 },
    { id: 'interview',  label: 'Interview Speech',   icon: MessageSquare },
    { id: 'skills',     label: 'Skill Intelligence', icon: Sparkles },
    { id: 'integrity',  label: 'Integrity Telemetry',icon: ShieldCheck },
    { id: 'decision',   label: 'Hiring Decision',    icon: CheckCircle2 },
    { id: 'timeline',   label: 'Audit Ledger',       icon: History },
  ];

  return (
    <div className="w-full bg-slate-50 dark:bg-[#080A10] flex flex-col text-slate-900 dark:text-slate-100">
      {/* ── Persistent Top Navigation Bar ── */}
      <CandidateWorkspaceHeader
        candidate={currentCandidate}
        currentIndex={currentIndex}
        totalCandidates={candidates.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onBackToPipeline={handleBackToPipeline}
        onOpenAskSparkx={onOpenAskSparkx}
        onOpenResume={() => setIsResumeModalOpen(true)}
        onScheduleInterview={() => setIsSchedulerOpen(true)}
        onOpenDecision={() => handleTabChange('decision')}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* ── Workspace Body (Split: Candidate Quick Switcher + Main Intelligence Area) ── */}
      <div className="flex-1 flex min-h-0 items-start">
        {/* Left Candidate Rail (Desktop Collapsible) */}
        <aside className="hidden xl:flex w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0B0E18] shrink-0 sticky top-[84px] h-[calc(100vh-84px)] overflow-y-auto">
          <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#0B0E18] z-10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={e => setSidebarSearch(e.target.value)}
                placeholder="Jump candidate..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-[#080A10] border border-transparent dark:border-slate-800 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex-1 p-2 space-y-1">
            {filteredCandidates.map((cand) => {
              const isSelected = String(cand.id) === String(currentCandidate.id);
              const candScore = cand.matchScore || 0;
              const scoreBadgeColor = candScore >= 85 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : candScore >= 70
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                : candScore >= 50
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

              const initials = (() => {
                if (!cand.name) return 'CD';
                const parts = cand.name.trim().split(/\s+/);
                if (parts.length >= 2) {
                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                }
                return cand.name.trim().slice(0, 2).toUpperCase();
              })();

              return (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-brand-50/90 dark:bg-brand-950/60 border-l-4 border-l-brand-600 border border-brand-200 dark:border-brand-800 text-brand-950 dark:text-white shadow-subtle'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isSelected 
                      ? 'bg-brand-600 text-white shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1 truncate pr-1">
                    <div className="text-xs font-bold truncate leading-snug">{cand.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {cand.jobTitle || jobs.find(j => String(j.id) === String(cand.job_id || cand.jobId))?.title || 'Applied Position'}
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 ${scoreBadgeColor}`}>
                    {candScore}%
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Intelligence Workspace Area */}
        <main className="flex-1 flex flex-col min-w-0">


          {/* Active Tab Panel with Fluid Motion */}
          <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
            <div key={activeTab} className="animate-fade-in-up">
              {activeTab === 'overview' && (
                <CandidateOverviewTab 
                  candidate={currentCandidate} 
                  onNavigateTab={(tab) => handleTabChange(tab)} 
                  onScheduleInterview={() => setIsSchedulerOpen(true)}
                  onOpenAskSparkx={onOpenAskSparkx}
                />
              )}
              {activeTab === 'assessment' && (
                <AssessmentEvidenceTab 
                  candidate={currentCandidate} 
                  onInviteAssessment={inviteAssessment} 
                />
              )}
              {activeTab === 'interview' && (
                <InterviewEvidenceTab 
                  candidate={currentCandidate} 
                  onScheduleInterview={() => setIsSchedulerOpen(true)} 
                />
              )}
              {activeTab === 'skills' && (
                <SkillIntelligenceTab 
                  candidate={currentCandidate} 
                  activeJob={activeJob} 
                />
              )}
              {activeTab === 'integrity' && (
                <IntegrityAuditTab 
                  candidate={currentCandidate} 
                />
              )}
              {activeTab === 'decision' && (
                <RecruiterDecisionTab 
                  candidate={currentCandidate} 
                  onUpdateDecision={updateHiringDecision} 
                />
              )}
              {activeTab === 'timeline' && (
                <AuditTimelineTab 
                  candidateId={currentCandidate.id} 
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Schedule Interview Modal (Portal Overlay) ── */}
      {isSchedulerOpen && currentCandidate && (
        <ScheduleInterviewModal
          isOpen={isSchedulerOpen}
          onClose={() => setIsSchedulerOpen(false)}
          candidate={currentCandidate}
          onSchedule={scheduleInterview}
        />
      )}

      {/* ── Candidate Resume Viewer & Downloader Modal (Portal Overlay) ── */}
      {isResumeModalOpen && currentCandidate && (
        <ResumeViewerModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          candidate={currentCandidate}
        />
      )}
    </div>
  );
}
