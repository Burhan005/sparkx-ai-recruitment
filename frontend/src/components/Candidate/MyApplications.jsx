import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { FadeInUp } from '../ui/Primitives';
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
  Lock
} from 'lucide-react';

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
  const underReviewCount = myApplications.filter(a => a.finalDecision === 'Under Review' || a.status === 'Screening').length;
  const interviewCount = myApplications.filter(a => a.finalDecision === 'Interview' || a.status === 'Interview Scheduled').length;
  const selectedCount = myApplications.filter(a => a.finalDecision === 'Selected' || a.finalDecision === 'Offered').length;

  const getStatusBadge = (decision, status) => {
    const s = (decision || status || 'Under Review').toLowerCase();
    if (s.includes('reject')) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Rejected</span>
        </span>
      );
    }
    if (s.includes('select') || s.includes('offer')) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 animate-pulse">
          <Award className="w-3.5 h-3.5 text-emerald-500" />
          <span>Selected</span>
        </span>
      );
    }
    if (s.includes('interview') || s.includes('scheduled')) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
          <Video className="w-3.5 h-3.5 text-cyan-500" />
          <span>Interview</span>
        </span>
      );
    }
    if (s.includes('shortlist')) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Shortlisted</span>
        </span>
      );
    }
    if (s === 'applied') {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>Applied</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
        <Hourglass className="w-3.5 h-3.5 text-amber-500" />
        <span>Under Review</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-10 border border-slate-200 dark:border-white/[0.08] shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Applicant Portal Telemetry</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            My Applications & Status Tracking
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Track all roles you have applied for in real-time. Every recruiter decision, interview slot, and offer status updates live from the central hiring database.
          </p>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-2xl">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">{totalCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Total Applied</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{underReviewCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Under Review</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">{interviewCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Interviews</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{selectedCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Offers / Selected</div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Active Submissions ({myApplications.length})
          </h2>
          <button 
            onClick={() => navigate('/jobs')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <span>Browse More Roles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {myApplications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-card border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No applications submitted yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                You haven&apos;t applied to any roles under <span className="font-mono text-indigo-600 dark:text-indigo-400">{currentUser?.email}</span>. Browse our active openings to submit your resume with automated AI screening.
              </p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition inline-flex items-center space-x-2"
            >
              <span>Explore Available Positions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myApplications.map((app, idx) => {
              const isRejected = (app.finalDecision || '').toLowerCase().includes('reject');
              const isSelected = (app.finalDecision || '').toLowerCase().includes('select') || (app.finalDecision || '').toLowerCase().includes('offer');
              const isInterview = (app.finalDecision || '').toLowerCase().includes('interview');
              const isScheduledForInterview = Boolean(
                isInterview ||
                app.interviewScheduledAt ||
                (app.interviewStatus || '').toLowerCase().includes('interview') ||
                (app.status || '').toLowerCase().includes('interview')
              );
              const isAdvancedByRecruiter = Boolean(
                isScheduledForInterview ||
                ['shortlisted', 'selected', 'offered', 'assessment scheduled'].some(s => (app.status || '').toLowerCase().includes(s) || (app.finalDecision || '').toLowerCase().includes(s))
              );
              const isAssessmentDone = app.assessmentStatus === 'Completed';

              return (
                <FadeInUp key={app.id || idx} delay={idx * 70}>
                  <div className={`p-5 sm:p-6 rounded-3xl glass-card border transition-all duration-200 space-y-4 ${
                    isSelected 
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/30 bg-emerald-500/5' 
                      : isRejected 
                      ? 'border-rose-500/30 bg-rose-500/5' 
                      : 'border-slate-200 dark:border-white/[0.08] hover:border-indigo-500/30'
                  }`}>
                    
                    {/* Top Row: Company, Role, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{app.companyName || 'SparkX Technologies'}</span>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400">{app.department}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>{app.location || 'Remote'}</span>
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                          {app.jobTitle}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-3 self-start sm:self-center">
                        {getStatusBadge(app.finalDecision, app.status)}
                      </div>
                    </div>

                    {/* Metadata strip: Applied Date, Hiring Stage, Resume */}
                    <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 dark:border-white/[0.06] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Applied on: <strong className="text-slate-700 dark:text-slate-200">{app.appliedDate || 'Recently'}</strong></span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Hiring Pipeline: <strong className="font-bold text-slate-700 dark:text-slate-200">{
                          (app.status === 'Applied' || app.status === 'Screening')
                            ? 'Stage 1: Recruiter Screening'
                            : (isScheduledForInterview || isAdvancedByRecruiter)
                            ? (isAssessmentDone ? 'Stage 3: Recruiter Evaluation' : 'Stage 2: Role Assessment & Interview')
                            : (app.finalDecision || app.status || 'Under Review')
                        }</strong></span>
                      </div>
                      {app.resumeFilename && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="truncate max-w-[180px]">{app.resumeFilename}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Assessment & Review Telemetry (Internal score privacy preserved) */}
                    <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/70 dark:border-white/[0.04]">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Role Assessment:</span>
                        {isAssessmentDone ? (
                          <span className="inline-flex items-center space-x-1 font-bold px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (isScheduledForInterview || isAdvancedByRecruiter) ? (
                          <span className="inline-flex items-center space-x-1 font-bold px-2.5 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 font-bold px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting Recruiter Invitation</span>
                          </span>
                        )}
                      </div>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Application Review:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {app.status === 'Rejected' 
                            ? 'Review Concluded' 
                            : app.status === 'Selected' 
                            ? 'Offer Extended' 
                            : app.status === 'Interview' 
                            ? 'Interview Stage' 
                            : app.status === 'Shortlisted' 
                            ? 'Shortlisted' 
                            : 'Under Review'}
                        </span>
                      </div>
                    </div>

                    {/* Interview Slot Callout if Scheduled */}
                    {isInterview && (
                      <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-cyan-800 dark:text-cyan-300 flex items-center space-x-1.5">
                            <Video className="w-4 h-4 text-cyan-500" />
                            <span>Recruiter Interview Confirmed</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            Scheduled Slot: <strong>{app.interviewScheduledAt || 'Confirmed with hiring manager'}</strong>
                          </p>
                        </div>
                        {app.interviewMeetingUrl && (
                          <a
                            href={app.interviewMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-cyan-600/30"
                          >
                            <span>Launch Google Meet</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Offer Congratulations Banner */}
                    {isSelected && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/50 flex items-center space-x-3 text-xs">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <PartyPopper className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-emerald-800 dark:text-emerald-200">Congratulations! You have been Selected for this position.</span>
                          <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90 mt-0.5">
                            Our hiring committee has approved your candidacy. An official offer letter and next steps have been logged.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejection Note & Structured Feedback */}
                    {isRejected && (
                      <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Application Feedback & Status: Rejected</span>
                          </div>
                          {app.rejectionCategory && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                              {app.rejectionCategory}
                            </span>
                          )}
                        </div>
                        <div className="p-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-rose-200/60 dark:border-rose-900/30 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                          {app.rejectionReason || "Thank you for participating in our screening process. While we are proceeding with other applicants for this opening, we recommend exploring your personalized Skill Gap Roadmap to strengthen your profile for future roles."}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Review your Skill Gap Roadmap below to see AI-tailored study recommendations and bridge critical role competencies.
                        </p>
                      </div>
                    )}

                    {/* Action Buttons Strip */}
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                      {isScheduledForInterview || isAdvancedByRecruiter ? (
                        <button
                          onClick={() => {
                            setActiveJobId(app.jobId);
                            navigate(`/interview/${app.id}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/50 transition flex items-center space-x-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>AI Interview Room</span>
                        </button>
                      ) : (
                        <span 
                          className="px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-semibold border border-slate-200/50 dark:border-slate-800/50 flex items-center space-x-1.5 cursor-not-allowed"
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
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/50 transition flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>View Assessment Status</span>
                        </button>
                      ) : (isScheduledForInterview || isAdvancedByRecruiter) ? (
                        <button
                          onClick={() => {
                            setActiveJobId(app.jobId);
                            navigate(`/assessment/${app.id}`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 transition flex items-center space-x-1.5"
                        >
                          <span>Role Assessment</span>
                        </button>
                      ) : (
                        <span 
                          className="px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 font-semibold border border-slate-200/50 dark:border-slate-800/50 flex items-center space-x-1.5 cursor-not-allowed"
                          title="Role assessment unlocks once the recruiter screens your application and schedules your evaluation."
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                          <span>Assessment (Awaiting Recruiter Schedule)</span>
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setActiveJobId(app.jobId);
                          navigate(`/skill-gap/${app.id}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 transition flex items-center space-x-1.5"
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
