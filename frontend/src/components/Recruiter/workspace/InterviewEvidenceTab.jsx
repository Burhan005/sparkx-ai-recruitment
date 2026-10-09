import React from 'react';
import { 
  Video, 
  MessageSquare, 
  Bot, 
  User, 
  Calendar, 
  Clock, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { Card, Badge, StatusBadge, Button } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';

export default function InterviewEvidenceTab({ candidate, onScheduleInterview }) {
  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);
  const transcript = candidate.transcript || candidate.interview_transcript || [];
  const scores = candidate.scores || {};
  const isInterviewCompleted = Boolean(
    wf.interviewStatus === 'completed' ||
    candidate.interviewStatus === 'completed' ||
    candidate.interview_status === 'completed' ||
    (candidate.interviewScore !== undefined && candidate.interviewScore !== null) ||
    (candidate.interview_score !== undefined && candidate.interview_score !== null) ||
    transcript.length > 0 ||
    ['review', 'decision', 'offered', 'hired', 'rejected'].includes(wf.stage)
  );

  return (
    <div className="space-y-6">
      {/* Top Interview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="p-3.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Interview Status</span>
          <div className="mt-1">
            <StatusBadge dimension="interview" value={wf.interviewStatus} />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block truncate">
            {candidate.interviewScheduledAt || candidate.interview_scheduled_at ? `Slot: ${candidate.interviewScheduledAt || candidate.interview_scheduled_at}` : 'No slot scheduled'}
          </span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Communication</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {scores.communication !== undefined && scores.communication !== null ? `${scores.communication}/100` : '—'}
          </div>
          <span className="text-[10px] text-slate-500">Verbal articulation</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Problem Solving</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {scores.problemSolving !== undefined && scores.problemSolving !== null ? `${scores.problemSolving}/100` : '—'}
          </div>
          <span className="text-[10px] text-slate-500">Methodology & trade-offs</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Technical Depth</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {scores.jobSkills !== undefined && scores.jobSkills !== null ? `${scores.jobSkills}/100` : '—'}
          </div>
          <span className="text-[10px] text-slate-500">Production experience</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Integrity Trust</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center space-x-1.5">
            <span>{candidate.integrity_score !== undefined && candidate.integrity_score !== null ? `${candidate.integrity_score}%` : candidate.integrityScore !== undefined && candidate.integrityScore !== null ? `${candidate.integrityScore}%` : '—'}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              (candidate.integrity_risk || candidate.integrityRisk) === 'High'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
              {candidate.integrity_risk || candidate.integrityRisk || 'Low'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Proctoring telemetry</span>
        </Card>
      </div>

      {/* Google Meet Link Banner */}
      {candidate.interviewMeetingUrl && (
        <Card className={`p-4 ${
          isInterviewCompleted 
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' 
            : 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800/50'
        } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${
              isInterviewCompleted 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-brand-500/20 text-brand-600 dark:text-brand-400'
            } flex items-center justify-center shrink-0`}>
              {isInterviewCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isInterviewCompleted ? 'Interview Session Concluded' : 'Confirmed Google Meet Session'}</span>
                <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                  isInterviewCompleted 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                    : 'bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20'
                }`}>
                  {isInterviewCompleted ? 'Concluded' : 'Active'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate max-w-md">{candidate.interviewMeetingUrl}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isInterviewCompleted ? (
              onScheduleInterview && (
                <button
                  type="button"
                  onClick={onScheduleInterview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition shadow-xs"
                  title="Schedule a subsequent technical round or committee interview"
                >
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>Schedule Round 2</span>
                </button>
              )
            ) : (
              <>
                {onScheduleInterview && (
                  <button
                    type="button"
                    onClick={onScheduleInterview}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition shadow-xs"
                    title="Reschedule interview slot"
                  >
                    <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Reschedule Session</span>
                  </button>
                )}
                <a
                  href={candidate.interviewMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
                >
                  <span>Join Meeting Room</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Executive Interview Evaluation Summary */}
      {(candidate.interview_summary || candidate.interviewSummary) && (
        <Card className="p-5 space-y-2 bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520]">
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">AI Technical Evaluation Summary</h3>
          </div>
          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            {candidate.interview_summary || candidate.interviewSummary}
          </p>
        </Card>
      )}

      {/* Speech-to-Text Transcript Feed */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Speech-to-Text Interview Transcript</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {transcript.length > 0 ? `${transcript.length} dialogue turns` : 'No transcript recorded'}
          </span>
        </div>

        {transcript.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-xs text-slate-500 max-w-sm mx-auto">
              Live AI conversational interview transcript will automatically populate here once the candidate joins and speaks.
            </div>
            {onScheduleInterview && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onScheduleInterview}
                className="gap-2 mx-auto"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{candidate.interviewScheduledAt || candidate.interview_scheduled_at ? 'Reschedule Interview Slot' : 'Schedule Official Slot'}</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {transcript.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`p-4 rounded-2xl text-xs space-y-1.5 transition-colors ${
                  msg.speaker === 'ai'
                    ? 'bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    : 'bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/60 text-slate-900 dark:text-stone-100 ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 font-bold">
                    {msg.speaker === 'ai' ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-brand-500" />
                        <span className="text-brand-600 dark:text-brand-400">SparkX AI Interviewer</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        <span className="text-slate-700 dark:text-slate-300">{candidate.name} (Candidate)</span>
                      </>
                    )}
                    {msg.isAdaptive && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[9px] font-bold">
                        ADAPTIVE PROBE
                      </span>
                    )}
                  </span>
                  <span>{msg.timestamp || '00:00'}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
