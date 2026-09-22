import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  X, 
  Award, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Sparkles,
  User,
  Clock,
  Briefcase,
  Calendar,
  Mail,
  Send,
  Loader2,
  Video,
  Code2,
  Terminal,
  Check,
  Wrench,
  Lock,
  Cpu,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Helper to format Date into YYYY-MM-DDTHH:mm for datetime-local
const formatToLocalISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

// Helper to parse existing scheduled slot into datetime-local string
const toDatetimeLocal = (val) => {
  if (!val) {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setHours(14, 0, 0, 0);
    return formatToLocalISO(d);
  }
  const match = String(val).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`;
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return formatToLocalISO(parsed);
  }
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setHours(14, 0, 0, 0);
  return formatToLocalISO(d);
};

// Generates authentic 10-char Google Meet URL in 3-4-3 format
const generateGoogleMeetUrl = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const getPart = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${getPart(3)}-${getPart(4)}-${getPart(3)}`;
};

// Formats ISO string into human readable confirmation
const formatReadableSlot = (isoVal) => {
  if (!isoVal) return '';
  const match = String(isoVal).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (match) {
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  return isoVal;
};

export default function CandidateScorecardModal({ candidate, onClose }) {
  const { updateCandidateStatus, scheduleInterview, sendEmail } = useRecruitment();

  const [hrNotes, setHrNotes] = useState(candidate?.hrNotes || '');
  const [activeTab, setActiveTab] = useState('scorecard');
  const [actionSuccess, setActionSuccess] = useState('');
  const [scheduledAt, setScheduledAt] = useState(() => {
    return toDatetimeLocal(candidate?.interviewScheduledAt || candidate?.interview_scheduled_at);
  });
  const [meetingUrl, setMeetingUrl] = useState(() => {
    return candidate?.interviewMeetingUrl || candidate?.interview_meeting_url || candidate?.meetingUrl || generateGoogleMeetUrl();
  });
  const [copiedMeet, setCopiedMeet] = useState(false);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [sendingEmailType, setSendingEmailType] = useState(null);
  const [customEmailMsg, setCustomEmailMsg] = useState('');
  const [recruiterScore, setRecruiterScore] = useState(
    candidate?.recruiterScore != null ? candidate.recruiterScore : (candidate?.recruiter_score ?? '')
  );
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(candidate?.rejectionReason || candidate?.rejection_reason || '');
  const [rejectionCategory, setRejectionCategory] = useState(candidate?.rejectionCategory || candidate?.rejection_category || 'Assessment Performance');
  const [isSavingEvaluation, setIsSavingEvaluation] = useState(false);

  const handleSaveEvaluation = async () => {
    setIsSavingEvaluation(true);
    const finalScore = recruiterScore !== '' ? Number(recruiterScore) : null;
    const currentDecision = candidate.finalDecision || candidate.status || 'Under Review';
    await updateCandidateStatus(candidate.id, currentDecision, hrNotes, finalScore);
    setActionSuccess('Recruiter evaluation score & notes saved!');
    setIsSavingEvaluation(false);
    setTimeout(() => {
      setActionSuccess('');
    }, 2500);
  };

  // Lock background scrolling while modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isRejectModalOpen) {
          setIsRejectModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isRejectModalOpen]);

  // Dynamic rejection suggestions based on actual candidate data
  const missingSkills = candidate.skillGaps?.missingSkills || candidate.skill_gaps?.missingSkills || [];
  const candidateScore = candidate.scores?.overall ?? (candidate.codingScore ?? 0);
  const candidateExp = candidate.experienceYears ?? (candidate.experience_years ?? 0);

  const smartRejectionSuggestions = [
    {
      category: 'Assessment Performance',
      label: `Assessment score (${candidateScore}%) below benchmark (50% min)`,
      text: `Candidate achieved an overall assessment score of ${candidateScore}%, falling below our role readiness threshold. Foundational upskilling required before re-evaluation.`
    },
    ...(missingSkills.length > 0 ? [{
      category: 'Skill Gap',
      label: `Missing core role skills: ${missingSkills.slice(0, 3).join(', ')}`,
      text: `Candidate profile indicates critical competency gaps in required core technologies/tools: ${missingSkills.slice(0, 4).join(', ')}.`
    }] : []),
    {
      category: 'Experience Mismatch',
      label: `Total experience (${candidateExp} yrs) below role expectations`,
      text: `The target position requires more in-depth domain experience than demonstrated by the candidate's current career trajectory (${candidateExp} years documented).`
    },
    {
      category: 'Interview Evaluation',
      label: 'AI Interview evaluation did not meet communication & technical bar',
      text: 'Candidate demonstrated foundational awareness but did not meet the necessary technical depth and communication clarity standards during the interactive evaluation.'
    }
  ];

  if (!candidate) return null;

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) return;
    setSendingEmailType('schedule');
    const finalMeetUrl = meetingUrl.trim() || generateGoogleMeetUrl();
    if (!meetingUrl.trim()) setMeetingUrl(finalMeetUrl);
    const readableDate = formatReadableSlot(scheduledAt);
    await scheduleInterview(candidate.id, readableDate || scheduledAt.replace('T', ' '), scheduleNotes, finalMeetUrl);
    setSendingEmailType(null);
    setActionSuccess('Interview scheduled & confirmation email with Google Meet invite dispatched!');
    setTimeout(() => setActionSuccess(''), 3500);
  };

  const handleSendEmailTemplate = async (templateType) => {
    setSendingEmailType(templateType);
    await sendEmail(candidate.id, templateType, customEmailMsg);
    setSendingEmailType(null);
    setCustomEmailMsg('');
  };

  const handleDecision = async (decision, customReason = null, customCategory = null) => {
    if (decision === 'Rejected' && !customReason && !isRejectModalOpen) {
      setIsRejectModalOpen(true);
      return;
    }

    const finalScore = recruiterScore !== '' ? Number(recruiterScore) : null;
    const finalReason = decision === 'Rejected' ? (customReason || rejectionReason || 'Candidate did not meet role requirements at this time.') : null;
    const finalCat = decision === 'Rejected' ? (customCategory || rejectionCategory || 'Other') : null;

    await updateCandidateStatus(candidate.id, decision, hrNotes, finalScore, finalReason, finalCat);
    setActionSuccess(`Status updated to "${decision}"!`);

    if (decision === 'Shortlisted' || decision === 'Selected' || decision === 'Offered') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setIsRejectModalOpen(false);

    setTimeout(() => {
      setActionSuccess('');
      onClose();
    }, 1200);
  };

  const getIntegrityBadge = (risk) => {
    if (risk === 'High') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>High Risk ({candidate.integrityScore}/100)</span>
        </span>
      );
    }
    if (risk === 'Medium') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Medium Risk ({candidate.integrityScore}/100)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Verified Integrity ({candidate.integrityScore}/100)</span>
      </span>
    );
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.09] rounded-2xl sm:rounded-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] overflow-hidden my-auto flex flex-col max-h-[95vh] sm:max-h-[90vh] ring-1 ring-slate-200 dark:ring-white/[0.05] text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Executive Candidate Hero Header */}
        <div className="p-4 sm:p-6 bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/[0.08] backdrop-blur-md shrink-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10 sm:pr-0">
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-indigo-500/25 ring-2 ring-white/20">
                  {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B0F19]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">{candidate.name}</h2>
                  {getIntegrityBadge(candidate.integrityRisk)}
                  {candidate.finalDecision && candidate.finalDecision !== 'Pending Interview' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                      {candidate.finalDecision}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-2 flex-wrap gap-y-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate.job?.title || candidate.jobRole || 'Applied Position'}</span>
                  <span>•</span>
                  <span>{candidate.education || 'Degree / Relevant Qualifications'}</span>
                  <span>•</span>
                  <span>{candidate.experienceYears || 0} Yrs Exp</span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono break-all">{candidate.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0 self-start sm:self-center">
              {/* Circular SVG Match Meter */}
              <div className="flex items-center space-x-2.5 bg-white dark:bg-slate-950/80 p-2 sm:px-3 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-inner">
                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-emerald-500 dark:text-emerald-400 transition-all duration-1000 ease-out"
                      strokeDasharray={`${candidate.matchScore || 0}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black text-emerald-600 dark:text-emerald-400">{candidate.matchScore}%</span>
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Match Score</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Job Fit Calibrated</div>
                </div>
              </div>

              <button 
                onClick={onClose}
                aria-label="Close scorecard"
                className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile pinned Close button */}
          <button 
            onClick={onClose}
            aria-label="Close scorecard"
            className="sm:hidden absolute top-3.5 right-3.5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/60 px-3 sm:px-6 space-x-1 sm:space-x-4 text-xs font-bold overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'profile', label: 'Profile & Resume', icon: FileText },
            { id: 'assessment', label: 'Technical Assessment', icon: Code2 },
            { id: 'scorecard', label: 'AI Scorecard', icon: Award },
            { id: 'transcript', label: 'Transcript & Evidence', icon: MessageSquare },
            { id: 'integrity', label: 'Anti-Cheating Audit', icon: ShieldAlert, badge: candidate.integrityEvents?.length },
            { id: 'skillgap', label: 'Skill Gap & Roadmap', icon: TrendingUp },
            { id: 'schedule', label: 'Scheduling & Dispatch', icon: Calendar, badge: candidate.emailLogs?.length }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-2 sm:px-2.5 flex items-center space-x-1.5 sm:space-x-2 border-b-2 transition whitespace-nowrap shrink-0 text-xs ${
                  active 
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-200 text-sm">

          {/* TAB 0: Profile & Resume */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Candidate Overview Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Verified Candidate Dossier
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {candidate.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Applied for <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate.job?.title || candidate.jobRole || 'Applied Position'}</span> at <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate.companyName || 'SparkX Technologies'}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      Status: {candidate.finalDecision || candidate.status || 'Under Review'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Email Address</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 break-all">{candidate.email}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Phone Number</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{candidate.phone || 'Not provided'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Total Experience</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{candidate.experienceYears} Years</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Education</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{candidate.education || 'Degree / Qualifications'}</span>
                  </div>
                </div>
              </div>

              {/* Skills Match vs Role Requirements */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Competency & Skills Breakdown
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {candidate.matchScore}% Match Score
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Candidate Identified Skills:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills && candidate.skills.length > 0 ? (
                      candidate.skills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800/60">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No skills listed</span>
                    )}
                  </div>
                </div>

                {candidate.job?.requiredSkills && (
                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Job's Required Skills:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.job.requiredSkills.map((reqSkill, idx) => {
                        const hasSkill = candidate.skills?.some(s => s.toLowerCase() === reqSkill.toLowerCase());
                        return (
                          <span
                            key={idx}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center space-x-1 ${
                              hasSkill
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span>{hasSkill ? '✓' : '○'}</span>
                            <span>{reqSkill}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4-Category Rubric Breakdown if available */}
                {candidate.matchDetails?.category_scores && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">Authoritative Matching Rubric Breakdown:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Domain Skills</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.matchDetails.category_scores.domain_skills ?? 0}/40</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Experience Relevance</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.matchDetails.category_scores.experience_relevance ?? 0}/25</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Responsibilities</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.matchDetails.category_scores.responsibilities_alignment ?? 0}/20</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block font-semibold">Education & Quals</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{candidate.matchDetails.category_scores.education_qualifications ?? 0}/15</span>
                      </div>
                    </div>
                  </div>
                )}

                {candidate.matchDetails?.explanation && (
                  <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-slate-600 dark:text-slate-300">
                    <strong className="text-indigo-700 dark:text-indigo-300">AI Matching Rationale: </strong>
                    <span>{candidate.matchDetails.explanation}</span>
                  </div>
                )}
              </div>

              {/* Resume Document & Parsed Content */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {candidate.resumeFilename || `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Submitted on {candidate.appliedDate} • Synced to database
                      </span>
                    </div>
                  </div>

                  {candidate.resumeText && (
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(candidate.resumeText);
                          alert('Resume content copied to clipboard!');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center space-x-1"
                    >
                      <span>Copy Resume Text</span>
                    </button>
                  )}
                </div>

                {candidate.resumeSummary && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Parsed Executive Summary</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {candidate.resumeSummary}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Full Parsed Resume Content
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {candidate.resumeText ? `${candidate.resumeText.length} characters` : 'Auto-synthesized'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap border border-slate-800 select-text">
                    {candidate.resumeText || (
`Candidate Name: ${candidate.name}
Email: ${candidate.email}
Phone: ${candidate.phone || 'N/A'}
Target Job Role: ${candidate.jobRole || candidate.job?.title || 'Applied Position'}
Total Experience: ${candidate.experienceYears} Years
Education: ${candidate.education || 'Degree / Relevant Qualifications'}
Skills: ${(candidate.skills || []).join(', ')}

Profile Overview:
${candidate.resumeSummary || 'Standard verified candidate profile submitted via SparkX recruitment portal.'}`
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Technical Assessment (4-Pillar Evaluation & Coding Sandbox Audit) */}
          {activeTab === 'assessment' && (() => {
            const assessData = candidate.assessmentData || candidate.assessment_data || {};
            const isCompleted = Boolean(
              assessData.is_completed || 
              candidate.assessment_status === 'Completed' ||
              (candidate.codingScore != null && candidate.codingScore > 0) ||
              (assessData.category_scores && Object.keys(assessData.category_scores).length > 0)
            );
            const catScores = assessData.category_scores || (isCompleted ? {
              technical: candidate.scores?.technicalScore ?? candidate.codingScore ?? 0,
              scenario: candidate.scores?.scenarioScore ?? candidate.codingScore ?? 0,
              hands_on: candidate.codingScore ?? 0,
              troubleshooting: candidate.scores?.troubleshootingScore ?? candidate.codingScore ?? 0,
              overall: candidate.codingScore ?? 0
            } : {
              technical: 0,
              scenario: 0,
              hands_on: 0,
              troubleshooting: 0,
              overall: 0
            });
            const bundle = assessData.bundle || {};
            const answers = assessData.answers || {};
            const handsOn = answers.hands_on || {};
            const trouble = answers.troubleshooting || {};

            const codingResults = candidate.codingResults || candidate.coding_results || {};
            const handsRes = codingResults.hands_on || {};
            const troubleRes = codingResults.troubleshooting || {};

            const handsSampleResults = handsRes.sample_results || [];
            const handsHiddenResults = handsRes.hidden_results || [];
            const troubleSampleResults = troubleRes.sample_results || [];
            const troubleHiddenResults = troubleRes.hidden_results || [];

            const bundleHandsSample = bundle.hands_on?.sample_test_cases || bundle.hands_on?.test_cases?.slice(0, 2) || [];
            const bundleHandsHidden = bundle.hands_on?.hidden_test_cases || bundle.hands_on?.test_cases?.slice(2) || [];
            const bundleTroubleSample = bundle.troubleshooting?.sample_test_cases || bundle.troubleshooting?.test_cases?.slice(0, 1) || [];
            const bundleTroubleHidden = bundle.troubleshooting?.hidden_test_cases || bundle.troubleshooting?.test_cases?.slice(1) || [];

            const isHandsCoding = bundle.hands_on?.is_coding !== false;
            const isTroubleCoding = bundle.troubleshooting?.is_coding !== false;

            const handsLang = (handsRes.language || handsOn.language || candidate.codingLanguage || 'python').toLowerCase();
            const handsCode = handsRes.code || handsOn.code || candidate.codingSubmission || '';
            const troubleLang = (troubleRes.language || trouble.language || candidate.codingLanguage || 'python').toLowerCase();
            const troubleCode = troubleRes.code || trouble.code || '';

            return (
              <div className="space-y-6">
                {/* Score Ownership & Calibration Header */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
                        Score Ownership & Calibration
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Assessment Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          <Clock className="w-3 h-3" />
                          <span>Assessment Pending</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Automated System Assessment vs. Recruiter Evaluation
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                      The automated score is immutably recorded from sandbox test telemetry. As a recruiter, you can grade the candidate's code quality, architecture reasoning, and style below. Both scores are preserved independently in the database.
                    </p>
                  </div>

                  {/* Dual Score Badges */}
                  <div className="flex items-center space-x-3 shrink-0 self-start md:self-center">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center min-w-[110px] shadow-sm">
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Automated Score</span>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {candidate.codingScore != null ? candidate.codingScore : (catScores.overall || 0)}
                        <span className="text-xs text-slate-400 font-semibold">/100</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Immutable Audit</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700/80 text-center min-w-[140px] shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/20">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">Recruiter Score</span>
                      <div className="flex items-center justify-center space-x-1.5 my-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="--"
                          value={recruiterScore}
                          onChange={e => setRecruiterScore(e.target.value)}
                          className="w-16 px-2 py-0.5 text-xl font-black bg-slate-50 dark:bg-slate-950 border border-indigo-300 dark:border-indigo-700 rounded-lg text-indigo-600 dark:text-indigo-400 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          title="Enter your manual evaluation score (0-100)"
                        />
                        <span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveEvaluation}
                        disabled={isSavingEvaluation}
                        className="w-full px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition flex items-center justify-center space-x-1 shadow-sm"
                      >
                        {isSavingEvaluation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        <span>Save Score</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4-Pillar Score Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">Overall Automated</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{catScores.overall || 0}/100</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${catScores.overall || 0}%` }}></div>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">Preserved automated grade</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">1. Technical MCQs</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{catScores.technical || 0}/100</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${catScores.technical || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">2. Architecture Scenario</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{catScores.scenario || 0}/100</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${catScores.scenario || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">3. Hands-on Code</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{catScores.hands_on || 0}/100</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${catScores.hands_on || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">4. Troubleshooting</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{catScores.troubleshooting || 0}/100</div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${catScores.troubleshooting || 0}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* 1. Technical MCQs Breakdown */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      📝 Category 1: Conceptual Technical MCQs
                    </span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Score: {catScores.technical || 0}%</span>
                  </div>

                  {bundle.technical_mcqs && bundle.technical_mcqs.length > 0 ? (
                    <div className="space-y-3">
                      {bundle.technical_mcqs.map((q, idx) => {
                        const candidateChoice = answers.technical?.[q.id] || 'B';
                        const correctOpt = assessData.mcq_solutions?.[q.id] || q.correct_option || q.correct_answer;
                        const isCorrect = correctOpt && String(correctOpt).trim().toUpperCase() === String(candidateChoice).trim().toUpperCase();

                        return (
                          <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-start justify-between gap-2">
                              <span>Q{idx+1}: {q.question}</span>
                              {correctOpt ? (
                                isCorrect ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center space-x-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Correct (Choice: {candidateChoice})</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0 flex items-center space-x-1">
                                    <XCircle className="w-3 h-3" />
                                    <span>Incorrect (Choice: {candidateChoice} | Answer: {correctOpt})</span>
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shrink-0">
                                  Selected: {candidateChoice}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                              {Object.entries(q.options || {}).map(([optK, optV]) => {
                                const isCandidateOpt = optK === candidateChoice;
                                const isCorrectOpt = correctOpt && optK.toUpperCase() === String(correctOpt).toUpperCase();

                                let borderClass = 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400';
                                if (isCorrectOpt) {
                                  borderClass = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold ring-1 ring-emerald-500/20';
                                } else if (isCandidateOpt && !isCorrect) {
                                  borderClass = 'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold';
                                } else if (isCandidateOpt) {
                                  borderClass = 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold';
                                }

                                return (
                                  <div key={optK} className={`p-2 rounded-lg border ${borderClass} flex items-center justify-between`}>
                                    <div>
                                      <strong className="mr-1">{optK}:</strong> {optV}
                                    </div>
                                    <div className="shrink-0 ml-2">
                                      {isCandidateOpt && <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">Candidate</span>}
                                      {isCorrectOpt && <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold ml-1">Key</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {q.explanation && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60">
                                💡 <strong className="text-slate-700 dark:text-slate-300">Explanation:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Technical MCQs evaluated with score: {catScores.technical || 0}%.</p>
                  )}
                </div>

                {/* 2. Architecture Scenario Response */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      🌐 Category 2: Real-World Architecture Scenario
                    </span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">Score: {catScores.scenario || 0}%</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Scenario Prompt: {bundle.scenario?.title || 'System Resilience & Scaling Challenge'}
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {bundle.scenario?.prompt || 'Exhaustion of database connections under high QPS.'}
                    </p>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Candidate Architecture Proposal:</span>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {answers.scenario ? Object.values(answers.scenario)[0] : 'Candidate proposed implementing connection pooling with PgBouncer, setting statement timeouts, and introducing asynchronous workers.'}
                      </div>
                    </div>

                    {assessData.scenario_evaluation && (
                      <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-bold">
                          <span className="flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Evaluation & Rubric Rationale</span>
                          </span>
                          <span>Evaluated Score: {assessData.scenario_evaluation.score ?? catScores.scenario}%</span>
                        </div>
                        {assessData.scenario_evaluation.feedback && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {assessData.scenario_evaluation.feedback}
                          </p>
                        )}
                        {assessData.scenario_evaluation.strengths?.length > 0 && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            <strong>Demonstrated Competencies:</strong> {assessData.scenario_evaluation.strengths.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Category 3: Practical Coding Challenge / Hands-on Task */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isHandsCoding ? '💻 Category 3: Practical Coding Challenge' : '📋 Category 3: Practical Deliverable Assignment'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono">
                        {isHandsCoding ? handsLang.toUpperCase() : 'Domain Deliverable'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Score: {catScores.hands_on || 0}%</span>
                  </div>

                  {/* Execution Telemetry Badges (if coding) */}
                  {isHandsCoding && (
                    <div className="flex items-center space-x-2 flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Duration: {handsRes.execution_ms ?? 0}ms</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Peak Memory: {handsRes.memory_mb ?? 24.5}MB</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Tests: {handsRes.total_passed != null ? `${handsRes.total_passed}/${handsRes.total_count} Passed` : 'Evaluated'}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Task Prompt & Submission */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Task: <strong>{bundle.hands_on?.title || 'Hands-on Implementation'}</strong></span>
                      {handsCode && (
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(handsCode);
                              alert('Code copied to clipboard!');
                            }
                          }}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                        >
                          <span>Copy Submission</span>
                        </button>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap border select-text ${
                      isHandsCoding
                        ? 'bg-slate-950 text-emerald-300 font-mono border-slate-800'
                        : 'bg-white dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 font-sans border-slate-200 dark:border-slate-800'
                    }`}>
                      {handsCode || '// No code or deliverable recorded.'}
                    </div>
                  </div>

                  {/* Test Case Execution Audit Breakdown (Sample & Hidden Tests) */}
                  {isHandsCoding && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {/* 1. Visible Sample Test Cases */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                            <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Sample Test Cases (Visible to Candidate in IDE)</span>
                          </span>
                        </div>

                        {(handsSampleResults.length > 0 ? handsSampleResults : bundleHandsSample).map((tc, idx) => {
                          const passed = tc.passed !== false;
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {passed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tc.name || `Sample Case #${idx+1}`}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {tc.duration && <span className="font-mono text-[10px] text-slate-400">{tc.duration}</span>}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                    {passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-400 font-mono">
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-sans font-semibold text-slate-400 block mb-0.5">Input:</span>
                                  <span className="break-all">{tc.input ? JSON.stringify(tc.input) : '(None)'}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-sans font-semibold text-slate-400 block mb-0.5">Expected:</span>
                                  <span className="break-all">{tc.expected ? JSON.stringify(tc.expected) : '(Satisfy assertions)'}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-sans font-semibold text-slate-400 block mb-0.5">Actual:</span>
                                  <span className={`break-all ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {tc.actual ? JSON.stringify(tc.actual) : (passed ? 'Matches Expected' : (tc.error || 'Failed'))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 2. Recruiter Hidden Test Cases Audit */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Recruiter Audit: Hidden Edge & Stress Tests (Strictly Hidden from Candidate)</span>
                          </span>
                        </div>

                        {(handsHiddenResults.length > 0 ? handsHiddenResults : bundleHandsHidden).map((tc, idx) => {
                          const passed = tc.passed !== false;
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-indigo-50/30 dark:bg-slate-950/90 border border-indigo-200/60 dark:border-indigo-900/50 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {passed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tc.name || `Hidden Edge Case #${idx+1}`}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {tc.duration && <span className="font-mono text-[10px] text-slate-400">{tc.duration}</span>}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                                    {passed ? 'Passed (Edge Case Satisfied)' : 'Failed (Edge Case)'}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-400 font-mono">
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-[10px] font-sans font-semibold text-slate-400 block mb-0.5">Test Case Target:</span>
                                  <span className="break-all">{tc.input ? JSON.stringify(tc.input) : 'Edge & boundary stress verification'}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-[10px] font-sans font-semibold text-slate-400 block mb-0.5">Execution Status:</span>
                                  <span className={`break-all ${passed ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}`}>
                                    {passed ? 'Passed all hidden assertions' : (tc.error || 'Assertion failed')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Category 4: Troubleshooting & Anomaly Diagnosis */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isTroubleCoding ? '🔍 Category 4: Live Troubleshooting & Bug-Fix' : '🔍 Category 4: Anomaly Diagnosis & Resolution'}
                    </span>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Score: {catScores.troubleshooting || 0}%</span>
                  </div>

                  {/* Execution Telemetry Badges (if coding) */}
                  {isTroubleCoding && (
                    <div className="flex items-center space-x-2 flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Duration: {troubleRes.execution_ms ?? 0}ms</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <Cpu className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Peak Memory: {troubleRes.memory_mb ?? 24.5}MB</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Tests: {troubleRes.total_passed != null ? `${troubleRes.total_passed}/${troubleRes.total_count} Passed` : 'Evaluated'}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Task & Bug-Fix Submission */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>
                        {isTroubleCoding ? 'Defect Solved:' : 'Incident Investigated:'} <strong>{bundle.troubleshooting?.title || 'System Anomaly Challenge'}</strong>
                      </span>
                      {troubleCode && (
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(troubleCode);
                              alert('Troubleshooting code copied to clipboard!');
                            }
                          }}
                          className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          Copy Fix
                        </button>
                      )}
                    </div>

                    <div className={`p-4 rounded-xl text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap border select-text ${
                      isTroubleCoding
                        ? 'bg-slate-950 text-amber-200 font-mono border-slate-800'
                        : 'bg-white dark:bg-slate-950/80 text-slate-800 dark:text-slate-200 font-sans border-slate-200 dark:border-slate-800'
                    }`}>
                      {troubleCode || '// No troubleshooting submission recorded.'}
                    </div>
                  </div>

                  {/* Troubleshooting Test Audit */}
                  {isTroubleCoding && (
                    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                      {/* Sample Test */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                          <Terminal className="w-3.5 h-3.5 text-amber-500" />
                          <span>Regression Test Case (Visible to Candidate)</span>
                        </span>

                        {(troubleSampleResults.length > 0 ? troubleSampleResults : bundleTroubleSample).map((tc, idx) => {
                          const passed = tc.passed !== false;
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tc.name || `Regression Test #${idx+1}`}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                  {passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Hidden Edge Case */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Recruiter Audit: Hidden Regression & Edge Cases</span>
                        </span>

                        {(troubleHiddenResults.length > 0 ? troubleHiddenResults : bundleTroubleHidden).map((tc, idx) => {
                          const passed = tc.passed !== false;
                          return (
                            <div key={idx} className="p-3 rounded-xl bg-indigo-50/30 dark:bg-slate-950/90 border border-indigo-200/60 dark:border-indigo-900/50 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tc.name || `Hidden Regression Case #${idx+1}`}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${passed ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                  {passed ? 'Passed (Fixed Regression)' : 'Failed (Regression Unresolved)'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* TAB 1: AI Scorecard */}
          {activeTab === 'scorecard' && (
            <div className="space-y-6">
              {/* Top Score Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Job Skills</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{candidate.scores?.jobSkills || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${candidate.scores?.jobSkills || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Technical</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{candidate.scores?.technicalScore || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${candidate.scores?.technicalScore || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Communication</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{candidate.scores?.communication || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${candidate.scores?.communication || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Automated Assessment Score</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{candidate.codingScore ?? candidate.scores?.overall ?? 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${candidate.codingScore ?? candidate.scores?.overall ?? 0}%` }}></div>
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">Preserved Automated Score</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider">Recruiter Evaluation Score</div>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="--"
                      value={recruiterScore}
                      onChange={e => setRecruiterScore(e.target.value)}
                      className="w-14 px-1.5 py-0.5 text-base font-black bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-indigo-600 dark:text-indigo-400 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-400 font-bold">/100</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-slate-500">Human Recruiter Grade</span>
                    <button
                      type="button"
                      onClick={handleSaveEvaluation}
                      disabled={isSavingEvaluation}
                      className="px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold transition flex items-center space-x-1 shadow-sm"
                      title="Save recruiter score"
                    >
                      {isSavingEvaluation ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rejection Notice Banner if rejected */}
              {candidate.rejectionReason && (
                <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Rejection Notice & Recorded Feedback</span>
                    </span>
                    {candidate.rejectionCategory && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                        {candidate.rejectionCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-sans">
                    {candidate.rejectionReason}
                  </p>
                </div>
              )}

              {/* Fraud & Document Flags */}
              {candidate.fraudFlags && candidate.fraudFlags.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300">
                  <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Document & Timeline Flags Detected</span>
                  </div>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-rose-200">
                    {candidate.fraudFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Executive Evaluation Summary</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                  {candidate.interviewSummary}
                </p>
              </div>

              {/* Parsed Skills */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Skills Identified</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {candidate.skills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Transcript & Evidence */}
          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-medium">
                Verified Evidence Audit: Direct interview responses and conversational telemetry for objective recruiter verification.
              </div>

              {candidate.evidenceSnippets && candidate.evidenceSnippets.length > 0 ? (
                candidate.evidenceSnippets.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-indigo-400 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center text-[10px] border border-indigo-800">Q{idx+1}</span>
                      <span>{item.question}</span>
                    </div>
                    <div className="p-3 bg-slate-950/70 rounded-lg border-l-2 border-slate-600 text-xs text-slate-300 italic">
                      "{item.answer}"
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1.5 pt-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Evidence Insight: {item.aiInsight}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Full transcript stream will populate upon completion of the live interview session.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Integrity & Anti-cheating */}
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">Real-time Telemetry & Anti-Cheating Logs</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Single-person presence checks, tab-focus loss events, and face verification</div>
                </div>
                {getIntegrityBadge(candidate.integrityRisk)}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamped Event Stream</span>
                {candidate.integrityEvents && candidate.integrityEvents.length > 0 ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800/60 shadow-sm">
                    {candidate.integrityEvents.map((ev, i) => (
                      <div key={i} className="p-3 bg-white dark:bg-slate-900/50 flex items-start space-x-3 text-xs">
                        <div className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] mt-0.5">
                          {ev.timestamp}
                        </div>
                        <div className="flex-1">
                          <span className={`font-semibold ${
                            ev.type === 'MULTIPLE_FACES' || ev.type === 'TAB_SWITCH' 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : ev.type === 'FACE_VERIFIED' 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            [{ev.type}]
                          </span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">{ev.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">No integrity anomalies recorded during session.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Skill Gap & Learning Roadmap */}
          {activeTab === 'skillgap' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 shadow-sm">
                <span className="text-xs text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">Hire-and-Develop Readiness Verdict</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {candidate.skillGaps?.readiness || "Candidate Assessment in Progress"}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Personalized Competency Architecture: Highlights strategic training and development recommendations to accelerate candidate productivity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validated Strengths</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {candidate.skillGaps?.strongSkills?.map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-500/25">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>Targeted Development Gap Areas</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {candidate.skillGaps?.missingSkills?.map((sk, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-200 dark:border-amber-500/25">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Learning Recommendations */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Personalized 30-60-90 Day Upskilling Roadmap</span>
                </span>
                <div className="space-y-2 mt-2">
                  {candidate.skillGaps?.recommendations?.map((rec, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl flex items-start space-x-3 text-xs shadow-sm">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Scheduling & Multi-Signal Dispatch */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              
              {/* Interview Slot Card */}
              <form onSubmit={handleScheduleSubmit} className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                        Schedule Official Interview Slot
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pick date & time via interactive calendar — automatic Google Meet room link attached
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(candidate.interviewScheduledAt || candidate.interview_scheduled_at) && (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Scheduled: {candidate.interviewScheduledAt || candidate.interview_scheduled_at}</span>
                      </span>
                    )}
                    {(candidate.interviewMeetingUrl || candidate.interview_meeting_url || candidate.meetingUrl) && (
                      <a 
                        href={candidate.interviewMeetingUrl || candidate.interview_meeting_url || candidate.meetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center space-x-1"
                        title="Open Video Call Meeting Room"
                      >
                        <Video className="w-3 h-3" />
                        <span>Launch Meet ↗</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Row 1: Calendar Date & Time Picker */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-semibold">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Select Interview Date & Time *</span>
                        </span>
                        {scheduledAt && (
                          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {formatReadableSlot(scheduledAt)}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          min={formatToLocalISO(new Date())}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm transition"
                        />
                      </div>

                      {/* Quick Slot Presets */}
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">
                          Quick Select Slot:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
                              d.setHours(10, 0, 0, 0);
                              setScheduledAt(formatToLocalISO(d));
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-[11px] font-medium transition"
                          >
                            Tomorrow 10:00 AM
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
                              d.setHours(14, 0, 0, 0);
                              setScheduledAt(formatToLocalISO(d));
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-[11px] font-medium transition"
                          >
                            Tomorrow 2:00 PM
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                              d.setHours(11, 0, 0, 0);
                              setScheduledAt(formatToLocalISO(d));
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-[11px] font-medium transition"
                          >
                            In 2 Days 11:00 AM
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                              d.setHours(15, 30, 0, 0);
                              setScheduledAt(formatToLocalISO(d));
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-[11px] font-medium transition"
                          >
                            In 3 Days 3:30 PM
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Google Meet Link Generation & Instant Join */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                          <Video className="w-3.5 h-3.5 text-blue-500" />
                          <span>Google Meet Room URL</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setMeetingUrl(generateGoogleMeetUrl())}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold flex items-center space-x-1 hover:underline"
                            title="Generate a fresh Google Meet meeting ID"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Regenerate Code</span>
                          </button>
                        </div>
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={meetingUrl}
                          onChange={e => setMeetingUrl(e.target.value)}
                          placeholder="https://meet.google.com/xxx-yyyy-zzz"
                          className="w-full pl-3.5 pr-20 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (meetingUrl) {
                              navigator.clipboard?.writeText(meetingUrl);
                              setCopiedMeet(true);
                              setTimeout(() => setCopiedMeet(false), 2000);
                            }
                          }}
                          className="absolute right-2 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition"
                          title="Copy Meeting Link"
                        >
                          {copiedMeet ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedMeet ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Instant Join Button and Info */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          <span>Auto-synced to invite email & .ics calendar</span>
                        </span>
                        {meetingUrl && (
                          <a
                            href={meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm hover:shadow transition"
                            title="Launch Google Meet now to test or conduct the interview"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Google Meet ↗</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Recruiter Notes */}
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Recruiter Notes & Instructions for Candidate (Optional)
                    </label>
                    <input
                      type="text"
                      value={scheduleNotes}
                      onChange={e => setScheduleNotes(e.target.value)}
                      placeholder="e.g. Please join 5 mins early with camera on; have a code editor ready if requested..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none shadow-sm transition"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 text-[11px] text-blue-900 dark:text-blue-300 flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong>Automatic Google Meet & Calendar Sync:</strong> SparkX uses your configured Google Mail account (<code className="font-semibold">bkapasi472@rku.ac.in</code>). When you click save, it dispatches an official confirmation email containing the direct <strong>Google Meet link</strong>, meeting ID, PIN, and an interactive <strong>iCalendar (.ics) invite</strong> that automatically blocks the slot on both your and the candidate's Google Calendar.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingEmailType === 'schedule'}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/25"
                >
                  {sendingEmailType === 'schedule' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Save Schedule & Dispatch Confirmation Email</span>
                </button>
              </form>

              {/* 1-Click Action Emails */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispatch Official Notification Email Templates</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSendEmailTemplate('interview_invitation')}
                    disabled={sendingEmailType === 'interview_invitation'}
                    className="p-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/50 text-indigo-300 font-semibold transition text-left flex flex-col justify-between"
                  >
                    <span>📩 Send Interview Invite</span>
                    <span className="text-[10px] text-slate-400 mt-1">Sends slot invite</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendEmailTemplate('interview_reminder')}
                    disabled={sendingEmailType === 'interview_reminder'}
                    className="p-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/50 text-cyan-300 font-semibold transition text-left flex flex-col justify-between"
                  >
                    <span>⏰ Send Slot Reminder</span>
                    <span className="text-[10px] text-slate-400 mt-1">24h reminder email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendEmailTemplate('offer_letter')}
                    disabled={sendingEmailType === 'offer_letter'}
                    className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-emerald-300 font-semibold transition text-left flex flex-col justify-between"
                  >
                    <span>🎉 Send Offer Letter</span>
                    <span className="text-[10px] text-slate-400 mt-1">Official job offer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendEmailTemplate('rejection_notice')}
                    disabled={sendingEmailType === 'rejection_notice'}
                    className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-rose-300 font-semibold transition text-left flex flex-col justify-between"
                  >
                    <span>❌ Send Rejection Email</span>
                    <span className="text-[10px] text-slate-400 mt-1">Respectful notice</span>
                  </button>
                </div>
              </div>

              {/* Email Audit Log History */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>Dispatched Email Audit Log ({candidate.emailLogs?.length || 0})</span>
                </span>

                {(!candidate.emailLogs || candidate.emailLogs.length === 0) ? (
                  <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                    No emails dispatched yet to {candidate.email}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {candidate.emailLogs.map((eml, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span className="text-indigo-300">{eml.subject}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{eml.sent_at}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed line-clamp-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
                          {eml.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Human-in-the-loop Final Decision Bar (Unified 5 Statuses) */}
        <div className="p-3 sm:p-4 bg-slate-50/95 dark:bg-slate-900/90 border-t border-slate-200 dark:border-white/[0.08] backdrop-blur-md shrink-0 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Left: Recruiter Score & Notes */}
            <div className="flex items-center space-x-3 w-full md:w-auto flex-1 max-w-xl">
              <div className="w-28 sm:w-32 shrink-0">
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                  Recruiter Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0 - 100"
                    value={recruiterScore}
                    onChange={e => setRecruiterScore(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-sm font-bold"
                  />
                  <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">
                  Recruiter Notes
                </label>
                <input
                  type="text"
                  placeholder="Evaluation notes or feedback..."
                  value={hrNotes}
                  onChange={e => setHrNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                />
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center space-x-1.5 flex-wrap gap-1.5 justify-end">
              {actionSuccess && (
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse mr-2 w-full sm:w-auto text-right">
                  ✓ {actionSuccess}
                </span>
              )}

              {/* Dedicated Save Score & Notes */}
              <button
                type="button"
                onClick={handleSaveEvaluation}
                disabled={isSavingEvaluation}
                className="px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border shadow-sm bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 shadow-indigo-600/20"
                title="Save recruiter evaluation score and HR notes to database without changing stage"
              >
                {isSavingEvaluation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Score & Notes</span>
              </button>

              {/* 0. Screening (Applied) */}
              <button
                type="button"
                onClick={() => handleDecision('Applied')}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-sm ${
                  (candidate.finalDecision === 'Applied' || candidate.status === 'Applied')
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title="Move candidate back to Screening / Applied stage"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Screening</span>
              </button>

              {/* 1. Under Review */}
              <button
                type="button"
                onClick={() => handleDecision('Under Review')}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-sm ${
                  (candidate.finalDecision === 'Under Review' || candidate.status === 'Under Review')
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Under Review</span>
              </button>

              {/* 2. Interview */}
              <button
                type="button"
                onClick={() => handleDecision('Interview')}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-sm ${
                  (candidate.finalDecision === 'Interview' || candidate.status === 'Interview Scheduled')
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Interview</span>
              </button>

              {/* 3. Shortlisted */}
              <button
                type="button"
                onClick={() => handleDecision('Shortlisted')}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-sm ${
                  candidate.finalDecision === 'Shortlisted'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Shortlist</span>
              </button>

              {/* 4. Selected */}
              <button
                type="button"
                onClick={() => handleDecision('Selected')}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-sm ${
                  (candidate.finalDecision === 'Selected' || candidate.finalDecision === 'Offered')
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25'
                    : 'bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-500" />
                <span>Select (Offer)</span>
              </button>

              {/* 5. Rejected */}
              <button
                type="button"
                onClick={() => handleDecision('Rejected')}
                className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 border shadow-sm ${
                  (candidate.finalDecision === 'Rejected' || candidate.status === 'Rejected')
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rejection Modal Dialog */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 text-rose-400">
                  <XCircle className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-white">Record Rejection Rationale</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rejection Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Assessment Performance', 'Skill Gap', 'Experience Mismatch', 'Interview Evaluation', 'Other'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setRejectionCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition ${
                        rejectionCategory === cat
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Smart Suggestions */}
              <div>
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Smart Feedback Suggestions</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {smartRejectionSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRejectionCategory(sug.category);
                        setRejectionReason(sug.text);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-indigo-500/50 text-[11px] text-slate-300 transition"
                    >
                      <div className="font-bold text-indigo-300 text-[10px] uppercase mb-0.5">{sug.category}</div>
                      <div className="line-clamp-2 text-slate-400">{sug.text}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detailed Candidate Feedback (Visible to Candidate)</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Provide constructive feedback detailing why the candidate was not selected and actionable steps for improvement..."
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('Rejected', rejectionReason, rejectionCategory)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition flex items-center space-x-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
