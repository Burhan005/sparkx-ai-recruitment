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
  Briefcase
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CandidateScorecardModal({ candidate, onClose }) {
  const { updateCandidateStatus } = useRecruitment();
  const [hrNotes, setHrNotes] = useState(candidate?.hrNotes || '');
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'transcript' | 'integrity' | 'skillgap'
  const [actionSuccess, setActionSuccess] = useState('');

  if (!candidate) return null;

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
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 space-x-6 text-xs font-semibold">
          {[
            { id: 'scorecard', label: 'AI Evaluation Scorecard', icon: Award },
            { id: 'transcript', label: 'Interview Evidence & Transcript', icon: MessageSquare },
            { id: 'integrity', label: 'Anti-Cheating & Audit Log', icon: ShieldAlert, badge: candidate.integrityEvents?.length },
            { id: 'skillgap', label: 'Skill Gap & Hire-and-Develop', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 flex items-center space-x-2 border-b-2 transition relative ${
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
