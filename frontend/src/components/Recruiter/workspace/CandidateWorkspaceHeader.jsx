import React from 'react';
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
  FileText
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
  tabs = [],
  activeTab = 'overview',
  onTabChange
}) {
  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);

  const score = candidate.matchScore || 0;
  const scoreColor = score >= 85
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
    : score >= 70
    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
    : score >= 50
    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';

  const initials = (() => {
    if (!candidate.name) return 'CA';
    const parts = candidate.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return candidate.name.trim().slice(0, 2).toUpperCase();
  })();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0D111A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-colors duration-150">
      {/* ── Row 1: Candidate Identity, Quick Switcher, & Recruiter Actions (~40px) ── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Left: Back to Pipeline + Switcher + Candidate Snapshot */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToPipeline}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            title="Return to Pipeline Board (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pipeline</span>
            <kbd className="hidden md:inline-block ml-0.5 px-1 py-0.2 text-[9px] font-mono bg-slate-200/80 dark:bg-slate-700/80 rounded text-slate-500 dark:text-slate-400">ESC</kbd>
          </button>

          <span className="text-slate-300 dark:text-slate-700 shrink-0">|</span>

          {/* Quick Prev / Next Switcher */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onPrevious}
              disabled={currentIndex <= 0}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition"
              title="Previous Candidate (Press J or [)"
              aria-label="Previous Candidate"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 px-1.5 select-none whitespace-nowrap">
              {currentIndex + 1}/{totalCandidates}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={currentIndex >= totalCandidates - 1}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition"
              title="Next Candidate (Press K or ])"
              aria-label="Next Candidate"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-slate-300 dark:text-slate-700 shrink-0">|</span>

          {/* Candidate Avatar & Name Chip */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 font-mono tracking-wide">
              {initials}
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-white truncate tracking-tight sm:text-lg">
                {candidate.name}
              </h1>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0 ${scoreColor}`}>
                {score}% Match
              </span>
              <span className="hidden xl:inline text-xs text-slate-500 dark:text-slate-400 truncate">
                • {candidate.jobTitle || 'Applied Role'}
              </span>
              {candidate.email && (
                <span className="hidden 2xl:inline text-xs text-slate-400 truncate">
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
              className="gap-1.5 border-brand-200 dark:border-brand-900/60 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-xs py-1 h-7 sm:h-8"
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
              className="gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs py-1 h-7 sm:h-8"
              title="View and download candidate resume"
            >
              <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Resume</span>
            </Button>
          )}

          {onScheduleInterview && (() => {
            const isScheduled = Boolean(
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
                    ? 'border-cyan-500/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40' 
                    : ''
                }`}
                title={isScheduled ? `Currently scheduled: ${candidate.interviewScheduledAt || candidate.interview_scheduled_at}. Click to reschedule.` : 'Schedule technical interview'}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isScheduled ? 'Reschedule' : 'Schedule'}</span>
              </Button>
            );
          })()}

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
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-1.5 bg-slate-50/70 dark:bg-[#0E1017]/70 overflow-x-auto no-scrollbar">
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <kbd className={`hidden md:inline-flex items-center justify-center px-1 py-0.2 text-[9px] font-mono rounded border ${
                  isActive 
                    ? 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-900 dark:text-brand-300 dark:border-brand-800' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}>
                  Alt+{idx + 1}
                </kbd>
              </button>
            );
          })}
        </div>

        {/* 4D Authoritative Status Badges */}
        <div className="hidden lg:flex items-center gap-1 py-0.5 px-1 rounded-md bg-white dark:bg-[#07090E] border border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stage</span>
            <StatusBadge dimension="stage" status={wf.stage} />
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assess</span>
            <StatusBadge dimension="assessment" status={wf.assessmentStatus} />
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interview</span>
            <StatusBadge dimension="interview" status={wf.interviewStatus} />
          </div>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Decision</span>
            <StatusBadge dimension="decision" status={wf.hiringDecision} />
          </div>
        </div>
      </div>
    </header>
  );
}
