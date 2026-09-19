import React, { useState } from 'react';
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
  Video
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CandidateScorecardModal({ candidate, onClose }) {
  const { updateCandidateStatus, scheduleInterview, sendEmail } = useRecruitment();
  const [hrNotes, setHrNotes] = useState(candidate?.hrNotes || '');
  const [activeTab, setActiveTab] = useState('scorecard');
  const [actionSuccess, setActionSuccess] = useState('');

  // Schedule & Email Form States
  const [scheduledAt, setScheduledAt] = useState(candidate?.interviewScheduledAt || '2026-09-20 14:00');
  const [meetingUrl, setMeetingUrl] = useState(candidate?.interviewMeetingUrl || '');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [sendingEmailType, setSendingEmailType] = useState(null);
  const [customEmailMsg, setCustomEmailMsg] = useState('');

  if (!candidate) return null;

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) return;
    setSendingEmailType('schedule');
    await scheduleInterview(candidate.id, scheduledAt, scheduleNotes, meetingUrl);
    setSendingEmailType(null);
  };

  const handleSendEmailTemplate = async (templateType) => {
    setSendingEmailType(templateType);
    await sendEmail(candidate.id, templateType, customEmailMsg);
    setSendingEmailType(null);
    setCustomEmailMsg('');
  };

  const handleDecision = (decision) => {
    updateCandidateStatus(candidate.id, decision, hrNotes);
    setActionSuccess(`Candidate ${decision}!`);

    if (decision === 'Shortlisted' || decision === 'Offered') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.09] rounded-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] overflow-hidden my-6 flex flex-col max-h-[92vh] ring-1 ring-slate-200 dark:ring-white/[0.05] text-slate-900 dark:text-slate-100">
        
        {/* Executive Candidate Hero Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25 ring-2 ring-white/20">
                {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B0F19]" />
            </div>
            <div>
              <div className="flex items-center space-x-3 flex-wrap gap-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{candidate.name}</h2>
                {getIntegrityBadge(candidate.integrityRisk)}
                {candidate.finalDecision && candidate.finalDecision !== 'Pending Interview' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {candidate.finalDecision}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-2.5 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{candidate.job?.title || 'Applied Position'}</span>
                <span>•</span>
                <span>{candidate.education}</span>
                <span>•</span>
                <span>{candidate.experienceYears} Years Exp</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">{candidate.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            {/* Circular SVG Match Meter */}
            <div className="flex items-center space-x-3 bg-white dark:bg-slate-900/80 p-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-inner">
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
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
              <div className="text-left hidden sm:block">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Match Score</div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Job Fit Calibrated</div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-950/60 px-6 space-x-6 text-xs font-bold overflow-x-auto">
          {[
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
                className={`py-3.5 flex items-center space-x-2 border-b-2 transition whitespace-nowrap relative ${
                  active 
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
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
          
          {/* TAB 1: AI Scorecard */}
          {activeTab === 'scorecard' && (
            <div className="space-y-6">
              {/* Top Score Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Job Skills Score</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{candidate.scores?.jobSkills || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${candidate.scores?.jobSkills || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Technical Competence</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{candidate.scores?.technicalScore || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${candidate.scores?.technicalScore || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Communication</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{candidate.scores?.communication || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${candidate.scores?.communication || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overall AI Recommendation</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{candidate.scores?.overall || 0}/100</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${candidate.scores?.overall || 0}%` }}></div>
                  </div>
                </div>
              </div>

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
                Slide 14 Principle: "Recruiter reviews the underlying evidence instead of trusting a black-box score."
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
                  Slide 13 Concept: Turns recruitment into a development roadmap. Highlights exactly what training is required to bring this candidate to 100% production effectiveness.
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
              <form onSubmit={handleSaveSchedule} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Schedule Official Interview Slot
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {candidate.interviewScheduledAt && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                        Scheduled: {candidate.interviewScheduledAt}
                      </span>
                    )}
                    {candidate.meetingUrl && (
                      <a 
                        href={candidate.meetingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center space-x-1"
                        title="Open Video Call Meeting Room"
                      >
                        <Video className="w-3 h-3" />
                        <span>Google Meet</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Select Slot Date & Time *</label>
                      <input
                        type="text"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        placeholder="e.g. 2026-09-21 14:30 IST"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none shadow-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-600 dark:text-slate-400 font-semibold">Google Meet / Video Call URL</label>
                        <a 
                          href="https://meet.google.com/new" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold flex items-center space-x-0.5 hover:underline"
                          title="Generate a real instant Google Meet room from your Google account"
                        >
                          <span>+ Create Google Meet ↗</span>
                        </a>
                      </div>
                      <input
                        type="text"
                        value={meetingUrl}
                        onChange={e => setMeetingUrl(e.target.value)}
                        placeholder="e.g. https://meet.google.com/xyz-abcd-efg"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none shadow-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Recruiter Notes / Instructions (Optional)</label>
                    <input
                      type="text"
                      value={scheduleNotes}
                      onChange={e => setScheduleNotes(e.target.value)}
                      placeholder="e.g. Any special instructions, portfolio links, or preparation steps..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none shadow-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    💡 <strong className="text-slate-800 dark:text-slate-200">Real Google Meet:</strong> Google requires meeting rooms to be initiated from a Google account. Click <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 underline font-semibold">+ Create Google Meet ↗</a>, copy your meeting link (e.g. <code className="text-indigo-600 dark:text-indigo-300">meet.google.com/abc-defg-hij</code>), and paste it above so candidates can join without error.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sendingEmailType === 'schedule'}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-md shadow-indigo-600/30"
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

        {/* Human-in-the-loop Final Decision Bar (Slide 14 & 17) */}
        <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Add recruiter evaluation notes or hiring committee feedback..."
              value={hrNotes}
              onChange={e => setHrNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-1">
            <button
              onClick={() => handleDecision('Rejected')}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800/50 transition flex items-center space-x-1.5 shadow-sm"
            >
              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => handleDecision('Offered')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800/50 transition flex items-center space-x-1.5 shadow-sm"
            >
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Make Offer</span>
            </button>

            <button
              onClick={() => handleDecision('Shortlisted')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-600/35 transition flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Shortlist Candidate</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
