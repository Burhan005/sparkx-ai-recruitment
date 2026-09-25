import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, User, Briefcase, Sparkles, CheckCircle2 } from 'lucide-react';
import FancyInterviewScheduler from '../FancyInterviewScheduler';

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  candidate,
  onSchedule,
  isReschedule: isRescheduleProp
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isReschedule = Boolean(
    isRescheduleProp ?? (
      candidate?.interviewScheduledAt ||
      candidate?.interview_scheduled_at ||
      candidate?.interviewStatus === 'scheduled' ||
      candidate?.interview_status === 'scheduled'
    )
  );

  // Lock document body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async ({ scheduledAt, meetingUrl, notes }) => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      if (onSchedule) {
        await onSchedule(candidate.id, scheduledAt, notes, meetingUrl);
      }
      onClose();
    } catch (err) {
      console.error('[ScheduleInterviewModal] Scheduling failed:', err);
      setErrorMsg(err.message || 'Failed to schedule interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto overscroll-contain animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-popover overflow-hidden my-auto flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 bg-slate-50/90 dark:bg-[#080A10] border-b border-slate-200 dark:border-slate-800 backdrop-blur-md shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-subtle shrink-0 border ${
              isReschedule 
                ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400' 
                : 'bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="schedule-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {isReschedule ? 'Reschedule Technical Interview' : 'Schedule Technical Interview'}
                </h2>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                  isReschedule
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                    : 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30'
                }`}>
                  {isReschedule ? 'Reschedule Existing Slot' : 'Live Calendar Dispatch'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 truncate flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{candidate.name}</span>
                <span>•</span>
                <span className="truncate">{candidate.jobTitle || candidate.job?.title || 'Lead Technical Candidate'}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{candidate.matchScore || 0}% Match</span>
                {isReschedule && (candidate.interviewScheduledAt || candidate.interview_scheduled_at) && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                      Current: {candidate.interviewScheduledAt || candidate.interview_scheduled_at}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono bg-slate-200/80 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close scheduler"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <FancyInterviewScheduler
            candidate={candidate}
            initialScheduledAt={candidate.interview_scheduled_at || candidate.interviewScheduledAt || ''}
            initialMeetingUrl={candidate.interview_meeting_url || candidate.interviewMeetingUrl || ''}
            initialNotes={candidate.hrNotes || candidate.hr_notes || ''}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
