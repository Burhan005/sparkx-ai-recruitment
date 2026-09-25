/**
 * SparkX Authoritative Workflow Contract (Frontend Mirror)
 * Must strictly match backend/workflow_contract.py
 */

// ── 1. Pipeline Stages ────────────────────────────────────────────────────────
export const STAGES = {
  APPLIED: 'applied',
  SCREENING: 'screening',
  ASSESSMENT: 'assessment',
  INTERVIEW: 'interview',
  REVIEW: 'review',
  COMPLETED: 'completed'
};

export const STAGE_CONFIG = {
  [STAGES.APPLIED]: {
    id: STAGES.APPLIED,
    label: 'Applied',
    subtitle: 'New incoming submission',
    color: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/25',
    badge: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/25',
    stepNumber: 1
  },
  [STAGES.SCREENING]: {
    id: STAGES.SCREENING,
    label: 'Screening',
    subtitle: 'Recruiter resume review',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    stepNumber: 2
  },
  [STAGES.ASSESSMENT]: {
    id: STAGES.ASSESSMENT,
    label: 'Assessment',
    subtitle: 'Technical role evaluation',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    stepNumber: 3
  },
  [STAGES.INTERVIEW]: {
    id: STAGES.INTERVIEW,
    label: 'Interview',
    subtitle: 'AI / Recruiter video meeting',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    stepNumber: 4
  },
  [STAGES.REVIEW]: {
    id: STAGES.REVIEW,
    label: 'Review',
    subtitle: 'Hiring committee review',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    stepNumber: 5
  },
  [STAGES.COMPLETED]: {
    id: STAGES.COMPLETED,
    label: 'Completed',
    subtitle: 'Final decision logged',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    stepNumber: 6
  }
};

// ── 2. Assessment Lifecycle ───────────────────────────────────────────────────
export const ASSESSMENT_STATUS = {
  NOT_INVITED: 'not_invited',
  INVITED: 'invited',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  EVALUATED: 'evaluated',
  EXPIRED: 'expired'
};

export const ASSESSMENT_STATUS_CONFIG = {
  [ASSESSMENT_STATUS.NOT_INVITED]: {
    label: 'Not Invited',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
    description: 'Awaiting recruiter invitation'
  },
  [ASSESSMENT_STATUS.INVITED]: {
    label: 'Test Invited',
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
    description: 'Assessment unlocked; ready to take'
  },
  [ASSESSMENT_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    description: 'Candidate is currently taking the test'
  },
  [ASSESSMENT_STATUS.SUBMITTED]: {
    label: 'Submitted',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
    description: 'Submission locked; scoring underway'
  },
  [ASSESSMENT_STATUS.EVALUATED]: {
    label: 'Evaluated',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    description: 'Test completed; score calculated'
  },
  [ASSESSMENT_STATUS.EXPIRED]: {
    label: 'Expired',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    description: 'Assessment window elapsed'
  }
};

// ── 3. Interview Lifecycle ────────────────────────────────────────────────────
export const INTERVIEW_STATUS = {
  NOT_SCHEDULED: 'not_scheduled',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const INTERVIEW_STATUS_CONFIG = {
  [INTERVIEW_STATUS.NOT_SCHEDULED]: {
    label: 'Not Scheduled',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700',
    description: 'Interview not booked yet'
  },
  [INTERVIEW_STATUS.SCHEDULED]: {
    label: 'Interview Booked',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
    description: 'Interview slot booked with meeting credentials'
  },
  [INTERVIEW_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse',
    description: 'Interview session active right now'
  },
  [INTERVIEW_STATUS.COMPLETED]: {
    label: 'Interviewed',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    description: 'Interview concluded; evaluation recorded'
  },
  [INTERVIEW_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    description: 'Interview cancelled by recruiter'
  }
};

// ── 4. Hiring Decisions ───────────────────────────────────────────────────────
export const HIRING_DECISION = {
  UNDECIDED: 'undecided',
  SHORTLISTED: 'shortlisted',
  SELECTED: 'selected',
  REJECTED: 'rejected'
};

export const HIRING_DECISION_CONFIG = {
  [HIRING_DECISION.UNDECIDED]: {
    label: 'In Review (Pending)',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: 'Hourglass'
  },
  [HIRING_DECISION.SHORTLISTED]: {
    label: 'Shortlisted',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    icon: 'Sparkles'
  },
  [HIRING_DECISION.SELECTED]: {
    label: 'Selected (Offer Extended)',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black',
    icon: 'Award'
  },
  [HIRING_DECISION.REJECTED]: {
    label: 'Rejected',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    icon: 'XCircle'
  }
};

// ── Helper normalization for legacy payload reconciliation ───────────────────
export function normalizeWorkflow(cand) {
  const fallback = {
    stage: STAGES.APPLIED,
    assessmentStatus: ASSESSMENT_STATUS.NOT_INVITED,
    interviewStatus: INTERVIEW_STATUS.NOT_SCHEDULED,
    hiringDecision: HIRING_DECISION.UNDECIDED,
    stageConfig: STAGE_CONFIG[STAGES.APPLIED],
    assessmentConfig: ASSESSMENT_STATUS_CONFIG[ASSESSMENT_STATUS.NOT_INVITED],
    interviewConfig: INTERVIEW_STATUS_CONFIG[INTERVIEW_STATUS.NOT_SCHEDULED],
    decisionConfig: HIRING_DECISION_CONFIG[HIRING_DECISION.UNDECIDED]
  };

  if (!cand) return fallback;

  const stage = (cand.stage || cand.pipelineStage || 'applied').toLowerCase();
  const assessmentStatus = (cand.assessmentStatus || cand.assessment_status || 'not_invited').toLowerCase();
  const interviewStatus = (cand.interviewStatus || cand.interview_status || 'not_scheduled').toLowerCase();
  const hiringDecision = (cand.hiringDecision || cand.hiring_decision || 'undecided').toLowerCase();

  const stageKey = STAGES[stage.toUpperCase()] || stage;
  const assessmentKey = ASSESSMENT_STATUS[assessmentStatus.toUpperCase()] || assessmentStatus;
  const interviewKey = INTERVIEW_STATUS[interviewStatus.toUpperCase()] || interviewStatus;
  const decisionKey = HIRING_DECISION[hiringDecision.toUpperCase()] || hiringDecision;

  const stageConfig = STAGE_CONFIG[stageKey] || {
    id: stageKey,
    label: stageKey,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };
  const assessmentConfig = ASSESSMENT_STATUS_CONFIG[assessmentKey] || {
    label: assessmentKey,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };
  const interviewConfig = INTERVIEW_STATUS_CONFIG[interviewKey] || {
    label: interviewKey,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };
  const decisionConfig = HIRING_DECISION_CONFIG[decisionKey] || {
    label: decisionKey,
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };

  return {
    stage: stageKey,
    assessmentStatus: assessmentKey,
    interviewStatus: interviewKey,
    hiringDecision: decisionKey,
    stageConfig,
    assessmentConfig,
    interviewConfig,
    decisionConfig
  };
}
