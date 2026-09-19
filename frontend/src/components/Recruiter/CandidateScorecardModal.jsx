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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">{candidate.name}</h2>
                {getIntegrityBadge(candidate.integrityRisk)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-3">
                <span>{candidate.education}</span>
                <span>•</span>
                <span>{candidate.experienceYears} Years Exp</span>
                <span>•</span>
                <span className="text-indigo-400 font-semibold">{candidate.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right sm:block hidden">
              <span className="text-xs text-slate-400">Match Score</span>
              <div className="text-2xl font-black text-emerald-400">{candidate.matchScore}%</div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 space-x-6 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'scorecard', label: 'AI Scorecard', icon: Award },
            { id: 'transcript', label: 'Transcript & Evidence', icon: MessageSquare },
            { id: 'integrity', label: 'Anti-Cheating Audit', icon: ShieldAlert, badge: candidate.integrityEvents?.length },
            { id: 'skillgap', label: 'Skill Gap & Roadmap', icon: TrendingUp },
            { id: 'schedule', label: 'Scheduling & Email Telemetry', icon: Calendar, badge: candidate.emailLogs?.length }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 flex items-center space-x-2 border-b-2 transition whitespace-nowrap relative ${
                  active 
                    ? 'border-indigo-500 text-indigo-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm">
          
          {/* TAB 1: AI Scorecard */}
          {activeTab === 'scorecard' && (
            <div className="space-y-6">
              {/* Top Score Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Job Skills Score</div>
                  <div className="text-2xl font-bold text-white mt-1">{candidate.scores?.jobSkills || 0}/100</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${candidate.scores?.jobSkills || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Technical Competence</div>
                  <div className="text-2xl font-bold text-white mt-1">{candidate.scores?.technicalScore || 0}/100</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${candidate.scores?.technicalScore || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Communication</div>
                  <div className="text-2xl font-bold text-white mt-1">{candidate.scores?.communication || 0}/100</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${candidate.scores?.communication || 0}%` }}></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Overall AI Recommendation</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{candidate.scores?.overall || 0}/100</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="font-bold text-white text-sm">Real-time Telemetry & Anti-Cheating Logs</div>
                  <div className="text-xs text-slate-400">Single-person presence checks, tab-focus loss events, and face verification</div>
                </div>
                {getIntegrityBadge(candidate.integrityRisk)}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamped Event Stream</span>
                {candidate.integrityEvents && candidate.integrityEvents.length > 0 ? (
                  <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/60">
                    {candidate.integrityEvents.map((ev, i) => (
                      <div key={i} className="p-3 bg-slate-900/50 flex items-start space-x-3 text-xs">
                        <div className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] mt-0.5">
                          {ev.timestamp}
                        </div>
                        <div className="flex-1">
                          <span className={`font-semibold ${
                            ev.type === 'MULTIPLE_FACES' || ev.type === 'TAB_SWITCH' 
                              ? 'text-rose-400' 
                              : ev.type === 'FACE_VERIFIED' 
                              ? 'text-emerald-400' 
                              : 'text-amber-400'
                          }`}>
                            [{ev.type}]
                          </span>{' '}
                          <span className="text-slate-300">{ev.description}</span>
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
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Hire-and-Develop Readiness Verdict</span>
                <div className="text-lg font-bold text-white mt-1">
                  {candidate.skillGaps?.readiness || "Candidate Assessment in Progress"}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Slide 13 Concept: Turns recruitment into a development roadmap. Highlights exactly what training is required to bring this candidate to 100% production effectiveness.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Validated Strengths</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {candidate.skillGaps?.strongSkills?.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 text-xs border border-emerald-800/50">
                        {skill}
                      </span>
                    )) || <span className="text-xs text-slate-500">None logged</span>}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Skill Gaps Identified</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {candidate.skillGaps?.missingSkills?.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 text-xs border border-amber-800/50">
                        {skill}
                      </span>
                    )) || <span className="text-xs text-slate-500">No major gaps identified</span>}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Learning Recommendations</span>
                <div className="mt-2 space-y-2">
                  {candidate.skillGaps?.recommendations?.map((rec, i) => (
                    <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start space-x-2 text-xs text-slate-300">
                      <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Interview Scheduling & Email Audit */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              
              {/* Scheduling Form */}
              <form onSubmit={handleScheduleSubmit} className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-800/40 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>Set & Dispatch Scheduled Interview Slot</span>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    {candidate.interviewScheduledAt && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                        Scheduled: {candidate.interviewScheduledAt}
                      </span>
                    )}
                    {candidate.interviewMeetingUrl && (
                      <a
                        href={candidate.interviewMeetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950 text-blue-300 border border-blue-700/50 hover:bg-blue-900 transition flex items-center space-x-1"
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
                      <label className="block text-slate-400 font-semibold mb-1">Select Slot Date & Time *</label>
                      <input
                        type="text"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        placeholder="e.g. 2026-09-21 14:30 IST"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-400 font-semibold">Google Meet / Video Call URL</label>
                        <a 
                          href="https://meet.google.com/new" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-0.5 hover:underline"
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
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Recruiter Notes / Instructions (Optional)</label>
                    <input
                      type="text"
                      value={scheduleNotes}
                      onChange={e => setScheduleNotes(e.target.value)}
                      placeholder="e.g. Any special instructions, portfolio links, or preparation steps..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    💡 <strong className="text-slate-200">Real Google Meet:</strong> Google requires meeting rooms to be initiated from a Google account. Click <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">+ Create Google Meet ↗</a>, copy your meeting link (e.g. <code className="text-indigo-300">meet.google.com/abc-defg-hij</code>), and paste it above so candidates can join without error.
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
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
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
        <div className="p-6 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-1/2">
            <input
              type="text"
              placeholder="Add Human Recruiter review notes or feedback..."
              value={hrNotes}
              onChange={e => setHrNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleDecision('Rejected')}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-800/50 transition flex items-center space-x-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>

            <button
              onClick={() => handleDecision('Under Review')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Hold / Review
            </button>

            <button
              onClick={() => handleDecision('Shortlisted')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
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
