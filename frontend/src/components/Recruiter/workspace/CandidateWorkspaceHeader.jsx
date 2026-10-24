import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Phone, 
  Briefcase, 
  Sparkles,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  FileText,
  Home,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { StatusBadge, Button, IconButton } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';

export default function CandidateWorkspaceHeader({
  candidate,
  currentIndex,
  totalCandidates,
  onPrevious,
  onNext,
  onBackToPipeline,
  onOpenAskSparkx,
  onOpenResume,
  onScheduleInterview,
  onOpenDecision,
  onOpenComparison,
  tabs = [],
  activeTab = 'overview',
  onTabChange
}) {
  const navigate = useNavigate();
  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);

  const score = candidate.matchScore || 0;
  const scoreColor = score >= 85
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
    : score >= 70
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
    : score >= 50
    ? 'bg-stone-500/10 border-stone-500/20 text-stone-700 dark:text-stone-400'
    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400';

  const initials = (() => {
    if (!candidate.name) return 'CA';
    const parts = candidate.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return candidate.name.trim().slice(0, 2).toUpperCase();
  })();

  return (
    <header className="shrink-0 z-30 bg-[#FDFBF7]/95 dark:bg-[#1A120E]/95 backdrop-blur-md border-b border-[#E8DFD8] dark:border-[#33241C] shadow-xs transition-colors duration-150">
      {/* ── Row 1: Candidate Identity, Quick Switcher, & Recruiter Actions (~40px) ── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-[#E8DFD8] dark:border-[#33241C]">
        {/* Left: Back to Home + Back to Pipeline + Switcher + Candidate Snapshot */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7C7267] hover:text-[#C27803] dark:text-[#C4B5A5] dark:hover:text-amber-400 transition px-2 py-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#201814] shrink-0"
            title="Return to Public Homepage"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <span className="text-[#E8DFD8] dark:text-[#33241C] shrink-0">/</span>

          <button
            type="button"
            onClick={onBackToPipeline}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7C7267] hover:text-[#1C130E] dark:text-[#C4B5A5] dark:hover:text-[#FAF6F0] transition px-2 py-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#201814] shrink-0"
            title="Return to Pipeline Board (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pipeline</span>
            <kbd className="hidden md:inline-block ml-0.5 px-1 py-0.2 text-[9px] font-mono bg-[#FAF8F5] dark:bg-[#201814] rounded text-[#7C7267] dark:text-[#C4B5A5] border border-[#E8DFD8] dark:border-[#3D2C22]">ESC</kbd>
          </button>

          <span className="text-[#E8DFD8] dark:text-[#33241C] shrink-0">|</span>

          {/* Quick Prev / Next Switcher */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onPrevious}
              disabled={currentIndex <= 0}
              className="p-1 rounded-lg border border-[#E8DFD8] dark:border-[#3D2C22] text-[#7C7267] dark:text-[#C4B5A5] hover:text-[#1C130E] dark:hover:text-[#FAF6F0] hover:bg-[#FAF8F5] dark:hover:bg-[#201814] disabled:opacity-25 disabled:pointer-events-none transition"
              title="Previous Candidate (Press J or [)"
              aria-label="Previous Candidate"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium text-[#7C7267] dark:text-[#C4B5A5] px-1.5 select-none whitespace-nowrap">
              {currentIndex + 1}/{totalCandidates}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex >= totalCandidates - 1}
              className="p-1 rounded-lg border border-[#E8DFD8] dark:border-[#3D2C22] text-[#7C7267] dark:text-[#C4B5A5] hover:text-[#1C130E] dark:hover:text-[#FAF6F0] hover:bg-[#FAF8F5] dark:hover:bg-[#201814] disabled:opacity-25 disabled:pointer-events-none transition"
              title="Next Candidate (Press K or ])"
              aria-label="Next Candidate"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-[#E8DFD8] dark:text-[#33241C] shrink-0">|</span>

          {/* Candidate Avatar & Name Chip */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#2E2017] to-[#C27803] text-amber-200 border border-amber-500/30 flex items-center justify-center font-bold text-xs shadow-xs shrink-0 font-mono tracking-wide">
              {initials}
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-base font-bold font-sans text-[#1C130E] dark:text-[#FAF6F0] truncate tracking-tight sm:text-lg">
                {candidate.name}
              </h1>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 ${scoreColor}`}>
                {score}% Match
              </span>
              <span className="hidden xl:inline text-xs text-[#A89F91] dark:text-[#8C7E72] truncate">
                • {candidate.jobTitle || 'Applied Role'}
              </span>
              {candidate.email && (
                <span className="hidden 2xl:inline text-xs text-[#A89F91] dark:text-[#8C7E72] truncate">
                  • {candidate.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Recruiter Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenAskSparkx && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenAskSparkx(candidate)}
              className="gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-xs py-1 h-7 sm:h-8"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          )}

          {onOpenResume && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenResume}
              className="gap-1.5 border-[#E8DFD8] dark:border-[#3D2C22] text-[#1C130E] dark:text-[#FAF6F0] hover:bg-[#FAF8F5] dark:hover:bg-[#201814] text-xs py-1 h-7 sm:h-8"
              title="View and download candidate resume"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Resume</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/skill-passport/${candidate.id}`, '_blank')}
            className="gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-xs py-1 h-7 sm:h-8"
            title="View candidate's Verified Skill Passport"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Passport</span>
          </Button>

          {onScheduleInterview && (() => {
            const isInterviewCompleted = Boolean(
              wf.interviewStatus === 'completed' ||
              candidate.interviewStatus === 'completed' ||
              candidate.interview_status === 'completed' ||
              (candidate.interviewScore !== undefined && candidate.interviewScore !== null) ||
              (candidate.interview_score !== undefined && candidate.interview_score !== null) ||
              ['review', 'decision', 'offered', 'hired', 'rejected'].includes(wf.stage)
            );
            const isScheduled = !isInterviewCompleted && Boolean(
              candidate.interviewScheduledAt || 
              candidate.interview_scheduled_at || 
              wf.interviewStatus === 'scheduled' || 
              wf.interviewStatus === 'in_progress'
            );
            return (
              <Button
                variant={isScheduled ? "outline" : "secondary"}
                size="sm"
                onClick={onScheduleInterview}
                className={`gap-1.5 text-xs py-1 h-7 sm:h-8 ${
                  isScheduled 
                    ? 'border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/15' 
                    : isInterviewCompleted
                    ? 'border-[#E8DFD8] dark:border-[#3D2C22] text-[#7C7267] dark:text-[#C4B5A5] hover:bg-[#FAF8F5] dark:hover:bg-[#201814]'
                    : ''
                }`}
                title={
                  isInterviewCompleted
                    ? 'Prior interview round concluded. Click to schedule follow-up or committee round.'
                    : isScheduled 
                    ? `Currently scheduled: ${candidate.interviewScheduledAt || candidate.interview_scheduled_at}. Click to reschedule.` 
                    : 'Schedule technical interview'
                }
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isInterviewCompleted ? 'Round 2' : isScheduled ? 'Reschedule' : 'Schedule'}
                </span>
              </Button>
            );
          })()}

          {onOpenComparison && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenComparison}
              className="gap-1.5 border-[#E8DFD8] dark:border-[#3D2C22] text-[#1C130E] dark:text-[#FAF6F0] hover:bg-[#FAF8F5] dark:hover:bg-[#201814] text-xs py-1 h-7 sm:h-8"
              title="Compare side-by-side with other candidates for this job opening"
            >
              <Scale className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Compare</span>
            </Button>
          )}

          {onOpenDecision && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenDecision}
              className="gap-1.5 text-xs py-1 h-7 sm:h-8"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Decide</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Row 2: Navigation Tabs + 4D Authoritative Status Strip (~42px) ── */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-1.5 bg-[#FAF8F5] dark:bg-[#140D0A] overflow-x-auto no-scrollbar border-b border-[#E8DFD8]/60 dark:border-[#33241C]/60">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white dark:bg-[#201814] text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-[#7C7267] dark:text-[#C4B5A5] hover:text-[#1C130E] dark:hover:text-[#FAF6F0] hover:bg-[#FAF8F5] dark:hover:bg-[#201814]/60 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <kbd className={`hidden md:inline-flex items-center justify-center px-1 py-0.2 text-[9px] font-mono rounded border ${
                  isActive 
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' 
                    : 'bg-white/80 dark:bg-[#1A120E] border-[#E8DFD8] dark:border-[#33241C] text-[#A89F91] dark:text-[#8C7E72]'
                }`}>
                  Alt+{idx + 1}
                </kbd>
              </button>
            );
          })}
        </div>

        {/* 4D Authoritative Status Badges */}
        <div className="hidden lg:flex items-center gap-1 py-0.5 px-1.5 rounded-xl bg-white dark:bg-[#1A120E] border border-[#E8DFD8] dark:border-[#33241C] shadow-xs shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-[#A89F91] dark:text-[#8C7E72] uppercase tracking-wider">Stage</span>
            <StatusBadge dimension="stage" status={wf.stage} />
          </div>
          <div className="h-4 w-[1px] bg-[#E8DFD8] dark:bg-[#33241C]" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-[#A89F91] dark:text-[#8C7E72] uppercase tracking-wider">Assess</span>
            <StatusBadge dimension="assessment" status={wf.assessmentStatus} />
          </div>
          <div className="h-4 w-[1px] bg-[#E8DFD8] dark:bg-[#33241C]" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-[#A89F91] dark:text-[#8C7E72] uppercase tracking-wider">Interview</span>
            <StatusBadge dimension="interview" status={wf.interviewStatus} />
          </div>
          <div className="h-4 w-[1px] bg-[#E8DFD8] dark:bg-[#33241C]" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-[#A89F91] dark:text-[#8C7E72] uppercase tracking-wider">Decision</span>
            <StatusBadge dimension="decision" status={wf.hiringDecision} />
          </div>
        </div>
      </div>
    </header>
  );
}
