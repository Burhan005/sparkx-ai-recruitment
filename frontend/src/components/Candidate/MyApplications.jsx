import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { FadeInUp, Button, Stat } from '../ui/Primitives';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Video, 
  Award, 
  TrendingUp, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  FileText,
  Hourglass,
  XCircle,
  PartyPopper,
  Lock,
  DollarSign
} from 'lucide-react';
import { 
  STAGE_CONFIG, 
  ASSESSMENT_STATUS_CONFIG, 
  INTERVIEW_STATUS_CONFIG, 
  HIRING_DECISION_CONFIG,
  normalizeWorkflow 
} from '../../utils/workflowContract';

export default function MyApplications() {
  const navigate = useNavigate();
  const { 
    myApplications, 
    refreshMyApplications, 
    currentUser, 
    setActiveJobId 
  } = useRecruitment();

  useEffect(() => {
    if (currentUser?.email) {
      refreshMyApplications(currentUser.email);
    }
  }, [currentUser?.email, refreshMyApplications]);

  const totalCount = myApplications.length;
  const underReviewCount = myApplications.filter(a => {
    const wf = normalizeWorkflow(a);
    return wf.stage === 'review' || (wf.hiringDecision === 'undecided' && wf.stage !== 'screening');
  }).length;
  const interviewCount = myApplications.filter(a => {
    const wf = normalizeWorkflow(a);
    return ['scheduled', 'in_progress'].includes(wf.interviewStatus);
  }).length;
  const selectedCount = myApplications.filter(a => {
    const wf = normalizeWorkflow(a);
    return wf.hiringDecision === 'selected';
  }).length;

  const getStatusBadge = (app) => {
    const wf = normalizeWorkflow(app);
    const decisionColor = wf.decisionConfig?.color || wf.decisionConfig?.badge || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    const stageColor = wf.stageConfig?.color || wf.stageConfig?.badge || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border ${decisionColor}`}>
          <span>{wf.decisionConfig?.label || wf.hiringDecision || 'In Review'}</span>
        </span>
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stageColor}`}>
          <span>Stage: {wf.stageConfig?.label || wf.stage || 'Applied'}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#14161F] border border-[#E8E8E4] dark:border-[#222634] p-6 sm:p-8 shadow-subtle">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Applicant Telemetry & Status</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Applications & Tracking
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Track all roles you have applied for in real-time. Every recruiter decision, interview slot, and offer status updates live from the central hiring database.
          </p>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-2xl">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-slate-800">
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">{totalCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Total Applied</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-slate-800">
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{underReviewCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Under Review</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-slate-800">
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{interviewCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Interviews</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-[#E8E8E4] dark:border-[#222634]">
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Offers / Selected</div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Active Submissions ({myApplications.length})
          </h2>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <span>Browse More Roles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myApplications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#14161F] border border-[#E8E8E4] dark:border-[#222634] space-y-4 shadow-subtle">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-[#E8E8E4] dark:border-slate-700">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No applications submitted yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You haven&apos;t applied to any roles under <span className="font-mono text-blue-600 dark:text-blue-400">{currentUser?.email}</span>. Browse active openings to submit your resume with automated AI screening.
              </p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold shadow-subtle transition inline-flex items-center space-x-2"
            >
              <span>Explore Available Positions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myApplications.map((app, idx) => {
              const wf = normalizeWorkflow(app);
              const isSelected = wf.hiringDecision === 'selected';
              const isRejected = wf.hiringDecision === 'rejected';
              const isShortlisted = wf.hiringDecision === 'shortlisted';
              const isInterviewScheduled = ['scheduled', 'in_progress', 'completed'].includes(wf.interviewStatus);
              const isInterviewUnlocked = ['scheduled', 'in_progress'].includes(wf.interviewStatus);
              const isInterviewDone = wf.interviewStatus === 'completed';
              const isAssessmentUnlocked = ['invited', 'in_progress', 'submitted', 'evaluated'].includes(wf.assessmentStatus);
              const isAssessmentDone = ['submitted', 'evaluated'].includes(wf.assessmentStatus);

              return (
                <FadeInUp key={app.id || idx} delay={idx * 70}>
                  <div className={`p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0E121E] border transition-all duration-200 space-y-4 shadow-card ${
                    isSelected 
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' 
                      : isRejected 
                      ? 'border-rose-500/30' 
                      : isShortlisted
                      ? 'border-brand-500/40 ring-1 ring-brand-500/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}>
                    
                    {/* Top Row: Company, Role, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                            <span>{app.companyName || 'SparkX Technologies'}</span>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400">{app.department}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{app.location || 'Remote'}</span>
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {app.jobTitle}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-3 self-start sm:self-center">
                        {getStatusBadge(app)}
                      </div>
                    </div>

                    {/* Metadata strip: Applied Date, Hiring Stage, Resume */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Applied on: <strong className="text-slate-700 dark:text-slate-200">{app.appliedDate || 'Recently'}</strong></span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>Pipeline Stage: <strong className="font-semibold text-slate-700 dark:text-slate-200">{wf.stageConfig?.label || wf.stage || 'Applied'}</strong></span>
                      </div>
                      {app.resumeFilename && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1.5 font-mono text-xs">
                            <FileText className="w-3.5 h-3.5 text-brand-500" />
                            <span className="truncate max-w-[180px]">{app.resumeFilename}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Compensation Information */}
                    {(app.formattedCandidateCompensation || app.formattedJobCompensation) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-[#080A10] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        {app.formattedJobCompensation && (
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Role Budget: <strong className="font-semibold text-slate-900 dark:text-white">{app.formattedJobCompensation}</strong></span>
                          </div>
                        )}
                        {app.formattedJobCompensation && app.formattedCandidateCompensation && (
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                        )}
                        {app.formattedCandidateCompensation && (
                          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300">
                            <span>Your Expected CTC: <strong className="font-semibold text-brand-600 dark:text-brand-400 font-mono">{app.formattedCandidateCompensation}</strong></span>
                            {app.currentCtc != null && (
                              <span className="text-xs text-slate-400">(Current: ₹{Number(app.currentCtc).toFixed(2)} LPA)</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4D Telemetry Strip */}
                    <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-[#080A10] p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Role Assessment:</span>
                        <span className={`inline-flex items-center space-x-1 font-semibold px-2.5 py-0.5 rounded-full text-xs border ${wf.assessmentConfig?.color || wf.assessmentConfig?.badge || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          <span>{wf.assessmentConfig?.label || wf.assessmentStatus || 'Not Invited'}</span>
                        </span>
                      </div>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Interview:</span>
                        <span className={`inline-flex items-center space-x-1 font-semibold px-2.5 py-0.5 rounded-full text-xs border ${wf.interviewConfig?.color || wf.interviewConfig?.badge || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          <span>{wf.interviewConfig?.label || wf.interviewStatus || 'Not Scheduled'}</span>
                        </span>
                      </div>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Hiring Decision:</span>
                        <span className={`inline-flex items-center space-x-1 font-semibold px-2.5 py-0.5 rounded-full text-xs border ${wf.decisionConfig?.color || wf.decisionConfig?.badge || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          <span>{wf.decisionConfig?.label || wf.hiringDecision || 'Pending'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Visual 6-Stage Hiring Roadmap Stepper */}
                    <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-mono uppercase tracking-wider text-[11px]">Hiring Roadmap</span>
                        <span>Current Stage: <strong className="text-slate-900 dark:text-white capitalize">{wf.stageConfig?.label || wf.stage || 'Applied'}</strong></span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
                        {[
                          { key: 'applied', label: '1. Applied', active: true, done: wf.stage !== 'applied' },
                          { key: 'screening', label: '2. Screening', active: ['screening', 'assessment', 'interview', 'review', 'completed'].includes(wf.stage), done: ['assessment', 'interview', 'review', 'completed'].includes(wf.stage) },
                          { key: 'assessment', label: '3. Assessment', active: ['assessment', 'interview', 'review', 'completed'].includes(wf.stage) || ['submitted', 'evaluated'].includes(wf.assessmentStatus), done: ['interview', 'review', 'completed'].includes(wf.stage) || ['submitted', 'evaluated'].includes(wf.assessmentStatus) },
                          { key: 'interview', label: '4. Interview', active: ['interview', 'review', 'completed'].includes(wf.stage) || wf.interviewStatus === 'completed', done: ['review', 'completed'].includes(wf.stage) || wf.interviewStatus === 'completed' },
                          { key: 'review', label: '5. Review', active: ['review', 'completed'].includes(wf.stage), done: wf.stage === 'completed' || wf.hiringDecision !== 'undecided' },
                          { key: 'decision', label: '6. Decision', active: wf.hiringDecision !== 'undecided' || wf.stage === 'completed', done: wf.hiringDecision !== 'undecided' }
                        ].map((step, sIdx) => {
                          const isCurrent = wf.stage === step.key || (step.key === 'decision' && wf.hiringDecision !== 'undecided');
                          return (
                            <div 
                              key={sIdx}
                              className={`p-2 rounded-lg text-center border text-xs font-medium transition ${
                                step.done
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80'
                                  : isCurrent
                                  ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-400 dark:border-brand-600 ring-1 ring-brand-500/30'
                                  : 'bg-white dark:bg-[#0E121E] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              <div className="truncate text-xs">{step.label}</div>
                              <div className="text-[10px] font-mono mt-0.5 opacity-80">
                                {step.done ? '✓ Passed' : isCurrent ? '● Active' : '○ Pending'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interview Slot Callout if Scheduled */}
                    {isInterviewScheduled && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0E18] border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
                            <Video className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                            <span>Interview ({wf.interviewConfig?.label || wf.interviewStatus || 'Scheduled'})</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            Scheduled Slot: <strong>{app.interviewScheduledAt || 'Confirmed with hiring manager'}</strong>
                          </p>
                        </div>
                        {app.interviewMeetingUrl && (
                          <a
                            href={app.interviewMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-subtle"
                          >
                            <span>Launch Google Meet</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Offer Congratulations Banner */}
                    {isSelected && (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-3 text-xs">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <PartyPopper className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-emerald-900 dark:text-emerald-200">Congratulations! You have been Selected for this position.</span>
                          <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-0.5">
                            Our hiring committee has approved your candidacy. An official offer letter and next steps have been logged.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Note & Structured Feedback */}
                    {isRejected && (
                      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-semibold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Application Feedback: Decision Finalized</span>
                          </div>
                          {app.rejectionCategory && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                              {app.rejectionCategory}
                            </span>
                          )}
                        </div>
                        <div className="p-3 bg-white dark:bg-[#080A10] rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                          {app.rejectionReason || "Thank you for participating in our screening process. While we are proceeding with other applicants for this opening, we recommend exploring your personalized Skill Gap Roadmap to strengthen your profile for future roles."}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Review your Skill Gap Roadmap below to see AI-tailored study recommendations and bridge critical role competencies.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons Strip */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      {isInterviewUnlocked ? (
                        <button
                          onClick={() => {
                            setActiveJobId(app.jobId);
                            navigate(`/interview/${app.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-800/60 transition flex items-center space-x-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>AI Interview Room ({wf.interviewConfig?.label || wf.interviewStatus || 'Scheduled'})</span>
                        </button>
                      ) : isInterviewDone ? (
                        <span 
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50 flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Interview Completed</span>
                        </span>
                      ) : (
                        <span 
                          className="px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-medium border border-slate-200/50 dark:border-slate-800/50 flex items-center space-x-1.5 cursor-not-allowed"
                          title="Interview room unlocks when scheduled by recruiter."
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Interview (Awaiting Schedule)</span>
                        </span>
                      )}

                      {isAssessmentDone ? (
                        <button
                          onClick={() => {
                            setActiveJobId(app.jobId);
                            navigate(`/assessment/${app.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50 transition flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Assessment (Submitted)</span>
                        </button>
                      ) : isAssessmentUnlocked ? (
                        <button
                          onClick={() => {
                            setActiveJobId(app.jobId);
                            navigate(`/assessment/${app.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold transition flex items-center space-x-1.5 shadow-subtle"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Role Assessment ({wf.assessmentConfig?.label || wf.assessmentStatus || 'Invited'})</span>
                        </button>
                      ) : (
                        <span 
                          className="px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-medium border border-slate-200/50 dark:border-slate-800/50 flex items-center space-x-1.5 cursor-not-allowed"
                          title="Role assessment unlocks once the recruiter invites you."
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                          <span>Assessment (Awaiting Recruiter Invite)</span>
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setActiveJobId(app.jobId);
                          navigate(`/skill-gap/${app.id}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-800 transition flex items-center space-x-1.5"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Skill Gap Roadmap</span>
                      </button>
                    </div>

                  </div>
                </FadeInUp>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
