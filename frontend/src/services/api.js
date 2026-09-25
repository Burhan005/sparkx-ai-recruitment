// ─── SparkX API Service ───────────────────────────────────────────────────────
// Connects the React frontend to the Python FastAPI backend.
// ALL data comes from the backend — zero hardcoded data in this file.

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api';

// ─── Normalizers: snake_case (backend) → camelCase (frontend) ─────────────────
export function normalizeJob(j) {
  if (!j) return j;
  return {
    ...j,
    companyName:       j.company_name       ?? j.companyName       ?? 'SparkX Technologies',
    requiredSkills:    j.required_skills    ?? j.requiredSkills    ?? [],
    minExperienceYears:j.min_experience_years != null ? j.min_experience_years : (j.minExperienceYears ?? 2),
    optionalCriteria:  j.optional_criteria  ?? j.optionalCriteria  ?? '',
    codingAssessment:  j.coding_assessment  ?? j.codingAssessment  ?? null,
    codingDifficulty:  j.coding_difficulty  ?? j.codingDifficulty  ?? 'Mid-Level',
    assessmentPool:    j.assessment_pool    ?? j.assessmentPool    ?? {},
    applicantsCount:   j.applicants_count   != null ? j.applicants_count : (j.applicantsCount ?? 0),
    questions:         j.questions          ?? [],
    status:            j.status             ?? 'Active',
    // Compensation Specification
    ctcType:           j.ctc_type           ?? j.ctcType           ?? 'range',
    ctcMin:            j.ctc_min != null ? Number(j.ctc_min) : (j.ctcMin != null ? Number(j.ctcMin) : null),
    ctcMax:            j.ctc_max != null ? Number(j.ctc_max) : (j.ctcMax != null ? Number(j.ctcMax) : null),
    ctcCurrency:       j.ctc_currency       ?? j.ctcCurrency       ?? 'INR',
    ctcPeriod:         j.ctc_period         ?? j.ctcPeriod         ?? 'annual',
    variablePayMin:    j.variable_pay_min != null ? Number(j.variable_pay_min) : (j.variablePayMin != null ? Number(j.variablePayMin) : null),
    variablePayMax:    j.variable_pay_max != null ? Number(j.variable_pay_max) : (j.variablePayMax != null ? Number(j.variablePayMax) : null),
    formattedCompensation: j.formatted_compensation ?? j.formattedCompensation ?? null,
  };
}

export function normalizeCandidate(c) {
  if (!c) return c;
  return {
    ...c,
    jobId:           c.job_id          ?? c.jobId,
    companyName:     c.company_name    ?? c.companyName    ?? 'SparkX Technologies',
    matchScore:      c.match_score     != null ? c.match_score     : (c.matchScore     ?? 0),
    experienceYears: c.experience_years != null ? c.experience_years : (c.experienceYears ?? 0),
    appliedDate:     c.applied_date    ?? c.appliedDate    ?? '',
    fraudFlags:      c.fraud_flags     ?? c.fraudFlags     ?? [],
    integrityScore:  c.integrity_score != null ? c.integrity_score  : (c.integrityScore  ?? 100),
    integrityRisk:   c.integrity_risk  ?? c.integrityRisk  ?? 'Low',
    integrityEvents: c.integrity_events ?? c.integrityEvents ?? [],
    finalDecision:   c.final_decision  ?? c.finalDecision  ?? 'Pending Interview',
    hrNotes:         c.hr_notes        ?? c.hrNotes        ?? '',
    interviewSummary:c.interview_summary ?? c.interviewSummary ?? '',
    evidenceSnippets:c.evidence_snippets ?? c.evidenceSnippets ?? [],
    skillGaps:       c.skill_gaps      ?? c.skillGaps      ?? null,
    resumeSummary:   c.resume_summary  ?? c.resumeSummary  ?? '',
    resumeFilename:  c.resume_filename ?? c.resumeFilename ?? null,
    resumeText:      c.resume_text     ?? c.resumeText     ?? null,
    assessmentData:  c.assessment_data ?? c.assessmentData ?? {},
    codingLanguage:  c.coding_language ?? c.codingLanguage ?? null,
    codingScore:     c.coding_score    != null ? c.coding_score : (c.codingScore ?? 0),
    codingSubmission:c.coding_submission ?? c.codingSubmission ?? null,
    codingResults:   c.coding_results  ?? c.codingResults  ?? {},
    scores:          c.scores          ?? { jobSkills: 0, technicalScore: 0, communication: 0, problemSolving: 0, overall: 0 },
    skills:          c.skills          ?? [],
    // Authoritative Candidate Application Compensation Expectations
    currentCtc:                  c.current_ctc != null ? Number(c.current_ctc) : (c.currentCtc != null ? Number(c.currentCtc) : null),
    expectedCtcType:             c.expected_ctc_type ?? c.expectedCtcType ?? 'range',
    expectedCtcMin:              c.expected_ctc_min != null ? Number(c.expected_ctc_min) : (c.expectedCtcMin != null ? Number(c.expectedCtcMin) : null),
    expectedCtcMax:              c.expected_ctc_max != null ? Number(c.expected_ctc_max) : (c.expectedCtcMax != null ? Number(c.expectedCtcMax) : null),
    ctcCurrency:                 c.ctc_currency ?? c.ctcCurrency ?? 'INR',
    compensationAnalysis:        c.compensation_analysis ?? c.compensationAnalysis ?? null,
    jobBudgetFormatted:          c.job_budget_formatted ?? c.jobBudgetFormatted ?? null,
    candidateExpectationFormatted: c.candidate_expectation_formatted ?? c.candidateExpectationFormatted ?? null,
    // 4-Dimensional Authoritative State
    stage:                c.stage                  ?? 'screening',
    assessmentStatus:     c.assessment_status      ?? c.assessmentStatus     ?? 'not_invited',
    interviewStatus:      c.interview_status       ?? c.interviewStatus      ?? 'not_scheduled',
    hiringDecision:       c.hiring_decision        ?? c.hiringDecision       ?? 'undecided',
    assessmentInvitedAt:  c.assessment_invited_at  ?? c.assessmentInvitedAt  ?? null,
    assessmentStartedAt:  c.assessment_started_at  ?? c.assessmentStartedAt  ?? null,
    assessmentSubmittedAt:c.assessment_submitted_at?? c.assessmentSubmittedAt?? null,
    assessmentEvaluatedAt:c.assessment_evaluated_at?? c.assessmentEvaluatedAt?? null,
    interviewStartedAt:   c.interview_started_at   ?? c.interviewStartedAt   ?? null,
    interviewCompletedAt: c.interview_completed_at ?? c.interviewCompletedAt ?? null,
    stageUpdatedAt:       c.stage_updated_at       ?? c.stageUpdatedAt       ?? null,
    decisionUpdatedAt:    c.decision_updated_at    ?? c.decisionUpdatedAt    ?? null,
    interviewScheduledAt: c.interview_scheduled_at ?? c.interviewScheduledAt ?? null,
    interviewMeetingUrl:  c.interview_meeting_url  ?? c.interviewMeetingUrl  ?? null,
    recruiterScore:       c.recruiter_score        != null ? c.recruiter_score : (c.recruiterScore ?? null),
    rejectionReason:      c.rejection_reason       ?? c.rejectionReason      ?? null,
    rejectionCategory:    c.rejection_category     ?? c.rejectionCategory    ?? null,
    matchDetails:         c.match_details          ?? c.matchDetails         ?? null,
    emailLogs:            c.email_logs             ?? c.emailLogs            ?? [],
  };
}

export const authEventBus = {
  listeners: [],
  on(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  },
  emit(event, data) {
    this.listeners.forEach(fn => {
      try { fn(event, data); } catch (e) { console.error('authEventBus error:', e); }
    });
  }
};

export function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('sparkx_token');
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function authFetch(url, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
  const headers = getAuthHeaders({ ...defaultHeaders, ...(options.headers || {}) });
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('sparkx_token');
    authEventBus.emit('UNAUTHORIZED', { url, status: 401 });
  } else if (res.status === 403) {
    authEventBus.emit('FORBIDDEN', { url, status: 403 });
  }
  return res;
}

export const api = {
  // ─── Authentication & Session Validation ────────────────────────────────────
  async getCurrentUser() {
    const token = localStorage.getItem('sparkx_token');
    if (!token) return null;
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/me`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[API] getCurrentUser error:', err.message);
      return null;
    }
  },

  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (!res.ok) return { user: null, error: data.detail || 'Login failed' };
      if (data.token) {
        localStorage.setItem('sparkx_token', data.token);
      }
      return { user: data, error: null };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return { user: null, error: 'Server connection timed out. Please check if FastAPI is running.' };
      }
      return { user: null, error: 'Cannot reach backend server. Please verify FastAPI is running.' };
    }
  },

  async register(name, email, password, role = 'candidate', adminCode = null, profileData = {}) {
    try {
      const payload = {
        name,
        email,
        password,
        role,
        admin_code: adminCode,
        phone: profileData.phone || null,
        job_role: profileData.jobRole || null,
        experience_years: Number(profileData.experienceYears || 0),
        skills: profileData.skills || [],
        education: profileData.education || null,
        resume_filename: profileData.resumeFilename || null,
        resume_summary: profileData.resumeSummary || null,
        resume_text: profileData.resumeText || null,
      };
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (!res.ok) return { user: null, error: data.detail || 'Registration failed' };
      if (data.token) {
        localStorage.setItem('sparkx_token', data.token);
      }
      return { user: data, error: null };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return { user: null, error: 'Server connection timed out. Please check if FastAPI is running.' };
      }
      return { user: null, error: 'Cannot reach backend server. Please verify FastAPI is running.' };
    }
  },

  async updateProfile(userId, profileData) {
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          job_role: profileData.jobRole,
          experience_years: profileData.experienceYears != null ? Number(profileData.experienceYears) : undefined,
          skills: profileData.skills,
          education: profileData.education,
          resume_filename: profileData.resumeFilename,
          resume_summary: profileData.resumeSummary,
          resume_text: profileData.resumeText,
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error('Profile update failed');
      return await res.json();
    } catch (err) {
      console.warn('[API] updateProfile failed:', err.message);
      return null;
    }
  },

  async forgotPassword(email) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Password reset request failed' };
      return { success: true, data, error: null };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return { success: false, error: 'Connection timed out. Please verify backend service.' };
      }
      return { success: false, error: err.message || 'Cannot connect to authentication service.' };
    }
  },

  async resetPassword(email, resetCode, newPassword) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reset_code: resetCode, new_password: newPassword }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.detail || 'Password reset failed' };
      return { success: true, data, error: null };
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        return { success: false, error: 'Connection timed out. Please try again.' };
      }
      return { success: false, error: err.message || 'Cannot connect to authentication service.' };
    }
  },

  // ─── Health ──────────────────────────────────────────────────────────────
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2500) });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  async getJobs() {
    try {
      const res = await authFetch(`${API_BASE_URL}/jobs`, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeJob) : [];
    } catch (err) {
      console.warn('[API] getJobs failed:', err.message);
      return null;
    }
  },

  async createJob(jobData) {
    try {
      const payload = {
        title:                jobData.title,
        department:           jobData.department,
        location:             jobData.location || 'Remote',
        min_experience_years: Number(jobData.minExperienceYears ?? 2),
        education:            jobData.education,
        languages:            Array.isArray(jobData.languages) ? jobData.languages : ['English'],
        required_skills:      jobData.requiredSkills || [],
        optional_criteria:    jobData.optionalCriteria || '',
        description:          jobData.description,
        questions:            jobData.questions || [],
        coding_assessment:    jobData.codingAssessment || jobData.coding_assessment || null,
        coding_difficulty:    jobData.codingDifficulty || jobData.coding_difficulty || null,
        ctc_type:             jobData.ctcType || jobData.ctc_type || null,
        ctc_min:              jobData.ctcMin != null && jobData.ctcMin !== '' ? Number(jobData.ctcMin) : (jobData.ctc_min != null && jobData.ctc_min !== '' ? Number(jobData.ctc_min) : null),
        ctc_max:              jobData.ctcMax != null && jobData.ctcMax !== '' ? Number(jobData.ctcMax) : (jobData.ctc_max != null && jobData.ctc_max !== '' ? Number(jobData.ctc_max) : null),
        ctc_currency:         jobData.ctcCurrency || jobData.ctc_currency || 'INR',
        ctc_period:           jobData.ctcPeriod || jobData.ctc_period || 'per_annum',
        variable_pay_min:     jobData.variablePayMin != null && jobData.variablePayMin !== '' ? Number(jobData.variablePayMin) : (jobData.variable_pay_min != null && jobData.variable_pay_min !== '' ? Number(jobData.variable_pay_min) : null),
        variable_pay_max:     jobData.variablePayMax != null && jobData.variablePayMax !== '' ? Number(jobData.variablePayMax) : (jobData.variable_pay_max != null && jobData.variable_pay_max !== '' ? Number(jobData.variable_pay_max) : null),
      };
      const res = await authFetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('Failed to create job');
      return normalizeJob(await res.json());
    } catch (err) {
      console.warn('[API] createJob failed:', err.message);
      return null;
    }
  },

  async updateJob(jobId, jobData) {
    try {
      const payload = {
        title:                jobData.title,
        department:           jobData.department,
        location:             jobData.location,
        min_experience_years: jobData.minExperienceYears != null ? Number(jobData.minExperienceYears) : (jobData.min_experience_years != null ? Number(jobData.min_experience_years) : undefined),
        education:            jobData.education,
        languages:            Array.isArray(jobData.languages) ? jobData.languages : undefined,
        required_skills:      jobData.requiredSkills || jobData.required_skills,
        optional_criteria:    jobData.optionalCriteria || jobData.optional_criteria,
        description:          jobData.description,
        questions:            jobData.questions,
        coding_assessment:    jobData.codingAssessment || jobData.coding_assessment,
        coding_difficulty:    jobData.codingDifficulty || jobData.coding_difficulty,
        assessment_pool:      jobData.assessmentPool || jobData.assessment_pool,
        ctc_type:             jobData.ctcType !== undefined ? jobData.ctcType : jobData.ctc_type,
        ctc_min:              jobData.ctcMin !== undefined ? (jobData.ctcMin !== null && jobData.ctcMin !== '' ? Number(jobData.ctcMin) : null) : (jobData.ctc_min !== undefined ? (jobData.ctc_min !== null && jobData.ctc_min !== '' ? Number(jobData.ctc_min) : null) : undefined),
        ctc_max:              jobData.ctcMax !== undefined ? (jobData.ctcMax !== null && jobData.ctcMax !== '' ? Number(jobData.ctcMax) : null) : (jobData.ctc_max !== undefined ? (jobData.ctc_max !== null && jobData.ctc_max !== '' ? Number(jobData.ctc_max) : null) : undefined),
        ctc_currency:         jobData.ctcCurrency || jobData.ctc_currency,
        ctc_period:           jobData.ctcPeriod || jobData.ctc_period,
        variable_pay_min:     jobData.variablePayMin !== undefined ? (jobData.variablePayMin !== null && jobData.variablePayMin !== '' ? Number(jobData.variablePayMin) : null) : (jobData.variable_pay_min !== undefined ? (jobData.variable_pay_min !== null && jobData.variable_pay_min !== '' ? Number(jobData.variable_pay_min) : null) : undefined),
        variable_pay_max:     jobData.variablePayMax !== undefined ? (jobData.variablePayMax !== null && jobData.variablePayMax !== '' ? Number(jobData.variablePayMax) : null) : (jobData.variable_pay_max !== undefined ? (jobData.variable_pay_max !== null && jobData.variable_pay_max !== '' ? Number(jobData.variable_pay_max) : null) : undefined),
      };
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      const res = await authFetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error('Failed to update job');
      return normalizeJob(await res.json());
    } catch (err) {
      console.warn('[API] updateJob failed:', err.message);
      return null;
    }
  },

  async matchJob(jobId, candidateData) {
    try {
      const payload = {
        name: candidateData.name || '',
        job_role: candidateData.jobRole || candidateData.job_role || '',
        experience_years: Number(candidateData.experienceYears ?? candidateData.experience_years ?? 0),
        skills: candidateData.skills || [],
        education: candidateData.education || '',
        resume_summary: candidateData.resumeSummary || candidateData.resume_summary || '',
        resume_text: candidateData.resumeText || candidateData.resume_text || '',
      };
      const res = await authFetch(`${API_BASE_URL}/jobs/${jobId}/match`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error('Match evaluation failed');
      return await res.json();
    } catch (err) {
      console.warn('[API] matchJob failed:', err.message);
      return null;
    }
  },

  async batchMatchJobs(candidateData) {
    try {
      const payload = {
        candidate: {
          name: candidateData.name || '',
          job_role: candidateData.jobRole || candidateData.job_role || '',
          experience_years: Number(candidateData.experienceYears ?? candidateData.experience_years ?? 0),
          skills: candidateData.skills || [],
          education: candidateData.education || '',
          resume_summary: candidateData.resumeSummary || candidateData.resume_summary || '',
          resume_text: candidateData.resumeText || candidateData.resume_text || '',
        }
      };
      const res = await authFetch(`${API_BASE_URL}/jobs/batch-match`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error('Batch match evaluation failed');
      return await res.json();
    } catch (err) {
      console.warn('[API] batchMatchJobs failed:', err.message);
      return null;
    }
  },

  // ─── Candidates ───────────────────────────────────────────────────────────
  async parseResume(formData) {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/parse-resume`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error('Resume parsing failed');
      return await res.json();
    } catch (err) {
      console.warn('[API] parseResume error:', err.message);
      return null;
    }
  },

  async getCandidates(params = {}) {
    try {
      try {
        const stored = JSON.parse(localStorage.getItem('sparkx_user') || '{}');
        if (stored?.role && stored.role !== 'recruiter') {
          return [];
        }
      } catch {}

      const query = new URLSearchParams();
      if (params.jobId || params.job_id) query.append('job_id', params.jobId || params.job_id);
      if (params.compensationStatus || params.compensation_status) query.append('compensation_status', params.compensationStatus || params.compensation_status);
      if (params.minExpectedCtc != null && params.minExpectedCtc !== '') query.append('min_expected_ctc', params.minExpectedCtc);
      if (params.maxExpectedCtc != null && params.maxExpectedCtc !== '') query.append('max_expected_ctc', params.maxExpectedCtc);
      if (params.q) query.append('q', params.q);

      const qs = query.toString();
      const url = `${API_BASE_URL}/candidates${qs ? `?${qs}` : ''}`;
      const res = await authFetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeCandidate) : [];
    } catch (err) {
      console.warn('[API] getCandidates failed:', err.message);
      return null;
    }
  },

  async applyCandidate(candData) {
    try {
      const payload = {
        job_id:            candData.jobId,
        company_name:      candData.companyName || 'SparkX Technologies',
        name:              candData.name,
        email:             candData.email,
        phone:             candData.phone || '+91 98000 00000',
        experience_years:  Number(candData.experienceYears ?? 0),
        education:         candData.education,
        skills:            candData.skills || [],
        resume_summary:    candData.resumeSummary || '',
        resume_filename:   candData.resumeFilename || null,
        resume_text:       candData.resumeText || null,
        fraud_flags:       candData.fraudFlags || [],
        current_ctc:       candData.currentCtc != null && candData.currentCtc !== '' ? Number(candData.currentCtc) : (candData.current_ctc != null && candData.current_ctc !== '' ? Number(candData.current_ctc) : null),
        expected_ctc_type: candData.expectedCtcType || candData.expected_ctc_type || null,
        expected_ctc_min:  candData.expectedCtcMin != null && candData.expectedCtcMin !== '' ? Number(candData.expectedCtcMin) : (candData.expected_ctc_min != null && candData.expected_ctc_min !== '' ? Number(candData.expected_ctc_min) : null),
        expected_ctc_max:  candData.expectedCtcMax != null && candData.expectedCtcMax !== '' ? Number(candData.expectedCtcMax) : (candData.expected_ctc_max != null && candData.expected_ctc_max !== '' ? Number(candData.expected_ctc_max) : null),
        ctc_currency:      candData.ctcCurrency || candData.ctc_currency || 'INR',
      };
      const res = await authFetch(`${API_BASE_URL}/candidates/apply`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error('Application failed');
      return normalizeCandidate(await res.json());
    } catch (err) {
      console.warn('[API] applyCandidate failed:', err.message);
      return null;
    }
  },

  async getMyApplications(email) {
    try {
      if (!email) return [];
      const res = await authFetch(`${API_BASE_URL}/candidates/my-applications?email=${encodeURIComponent(email)}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('Failed to fetch my applications');
      const data = await res.json();
      return Array.isArray(data) ? data.map(app => ({
        id: app.id,
        name: app.name,
        email: app.email,
        jobId: app.job_id,
        jobTitle: app.job_title,
        companyName: app.company_name || 'SparkX Technologies',
        department: app.department,
        location: app.location,
        appliedDate: app.applied_date,
        status: app.status,
        finalDecision: app.final_decision,
        matchScore: app.match_score,
        experienceYears: app.experience_years,
        skills: app.skills || [],
        resumeFilename: app.resume_filename,
        resumeSummary: app.resume_summary,
        scores: app.scores || {},
        skillGaps: app.skill_gaps || {},
        interviewScheduledAt: app.interview_scheduled_at,
        interviewMeetingUrl: app.interview_meeting_url,
        // Candidate's own submitted compensation & job budget preview
        currentCtc: app.current_ctc != null ? Number(app.current_ctc) : null,
        expectedCtcType: app.expected_ctc_type || 'range',
        expectedCtcMin: app.expected_ctc_min != null ? Number(app.expected_ctc_min) : null,
        expectedCtcMax: app.expected_ctc_max != null ? Number(app.expected_ctc_max) : null,
        ctcCurrency: app.ctc_currency || 'INR',
        formattedCandidateCompensation: app.formatted_candidate_compensation || null,
        formattedJobCompensation: app.formatted_job_compensation || null,
        // Authoritative 4-Dimensional State
        stage: app.stage || 'screening',
        assessmentStatus: app.assessment_status || 'not_invited',
        interviewStatus: app.interview_status || 'not_scheduled',
        hiringDecision: app.hiring_decision || 'undecided',
        assessmentInvitedAt: app.assessment_invited_at || null,
        assessmentStartedAt: app.assessment_started_at || null,
        assessmentSubmittedAt: app.assessment_submitted_at || null,
        assessmentEvaluatedAt: app.assessment_evaluated_at || null,
        interviewStartedAt: app.interview_started_at || null,
        interviewCompletedAt: app.interview_completed_at || null,
        stageUpdatedAt: app.stage_updated_at || null,
        decisionUpdatedAt: app.decision_updated_at || null,
        codingScore: app.coding_score != null ? app.coding_score : null,
        recruiterScore: app.recruiter_score != null ? app.recruiter_score : (app.recruiterScore ?? null),
        rejectionReason: app.rejection_reason ?? app.rejectionReason ?? null,
        rejectionCategory: app.rejection_category ?? app.rejectionCategory ?? null,
        matchDetails: app.match_details ?? app.matchDetails ?? null,
      })) : [];
    } catch (err) {
      console.warn('[API] getMyApplications failed:', err.message);
      return [];
    }
  },

  async updateCandidateStatus(candidateId, status, hrNotes = '', recruiterScore = null, rejectionReason = null, rejectionCategory = null) {
    try {
      const payload = { status, hr_notes: hrNotes };
      if (recruiterScore !== null && recruiterScore !== undefined && recruiterScore !== '') {
        payload.recruiter_score = Number(recruiterScore);
      }
      if (rejectionReason !== null && rejectionReason !== undefined) {
        payload.rejection_reason = rejectionReason;
      }
      if (rejectionCategory !== null && rejectionCategory !== undefined) {
        payload.rejection_category = rejectionCategory;
      }
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  async updateCandidateStage(candidateId, stage, notes = '') {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage, notes }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update candidate stage');
      }
      return normalizeCandidate(await res.json());
    } catch (err) {
      console.warn('[API] updateCandidateStage failed:', err.message);
      throw err;
    }
  },

  async updateHiringDecision(candidateId, decision, extra = {}) {
    try {
      const payload = {
        decision,
        hr_notes: extra.hrNotes || '',
        recruiter_score: extra.recruiterScore != null ? Number(extra.recruiterScore) : null,
        rejection_reason: extra.rejectionReason || null,
        rejection_category: extra.rejectionCategory || null,
      };
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update hiring decision');
      }
      return normalizeCandidate(await res.json());
    } catch (err) {
      console.warn('[API] updateHiringDecision failed:', err.message);
      throw err;
    }
  },

  async inviteAssessment(candidateId, customMessage = '') {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/invite-assessment`, {
        method: 'POST',
        body: JSON.stringify({ custom_message: customMessage }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to invite to assessment');
      }
      return normalizeCandidate(await res.json());
    } catch (err) {
      console.warn('[API] inviteAssessment failed:', err.message);
      throw err;
    }
  },

  async getAuditLogs(candidateId) {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/audit-logs`, {
        signal: AbortSignal.timeout(5000)
      });
      return res.ok ? await res.json() : [];
    } catch (err) {
      console.warn('[API] getAuditLogs failed:', err.message);
      return [];
    }
  },

  async getCandidateAuditLogs(candidateId) {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/audit-logs`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return await res.json();
    } catch (err) {
      console.warn('[API] getCandidateAuditLogs failed:', err.message);
      return [];
    }
  },

  async scheduleInterview(candidateId, scheduledAt, notes = '', meetingUrl = '') {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/schedule`, {
        method: 'POST',
        body: JSON.stringify({ 
          scheduled_at: scheduledAt, 
          notes,
          meeting_url: meetingUrl 
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error('Failed to schedule interview');
      return normalizeCandidate(await res.json());
    } catch (err) {
      console.warn('[API] scheduleInterview failed:', err.message);
      return null;
    }
  },

  async getGoogleMeetStatus() {
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/google/status`, {
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) return { configured: false, connected: false };
      return await res.json();
    } catch (err) {
      return { configured: false, connected: false };
    }
  },

  getGoogleConnectUrl() {
    return `${API_BASE_URL}/auth/google/connect`;
  },

  async disconnectGoogleMeet() {
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/google/disconnect`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  },

  async sendEmail(candidateId, templateType, customMessage = '') {
    try {
      const res = await authFetch(`${API_BASE_URL}/candidates/${candidateId}/send-email`, {
        method: 'POST',
        body: JSON.stringify({ template_type: templateType, custom_message: customMessage }),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error('Failed to send email');
      return await res.json();
    } catch (err) {
      console.warn('[API] sendEmail failed:', err.message);
      return null;
    }
  },

  async getAIStatus() {
    try {
      const res = await authFetch(`${API_BASE_URL}/interview/ai-status`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('AI status fetch failed');
      return await res.json();
    } catch (err) {
      return { active: false, provider: 'Local NLP', has_key: false, mode: 'simulated' };
    }
  },

  async updateAIConfig(provider, apiKey) {
    try {
      const res = await authFetch(`${API_BASE_URL}/interview/ai-config`, {
        method: 'POST',
        body: JSON.stringify({ provider, api_key: apiKey }),
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error('Failed to update AI config');
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async generateCandidateQuestions({ jobId, candidateId, candidateName, candidateSkills = [], experienceYears = 2 }) {
    try {
      const res = await authFetch(`${API_BASE_URL}/interview/candidate-questions`, {
        method: 'POST',
        body: JSON.stringify({
          job_id: jobId,
          candidate_id: candidateId,
          candidate_name: candidateName || 'Candidate',
          candidate_skills: candidateSkills,
          experience_years: Number(experienceYears || 2),
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error('Dynamic question generation failed');
      const data = await res.json();
      return {
        questions: data?.questions || [],
        candidateName: data?.candidate_name,
        roleTitle: data?.role_title
      };
    } catch (err) {
      console.warn('[API] generateCandidateQuestions fallback:', err.message);
      return null;
    }
  },

  async evaluateAdaptiveAnswer(questionPrompt, candidateAnswer, idealKeywords = [], followUpVague = null, followUpExpert = null) {
    try {
      const res = await authFetch(`${API_BASE_URL}/interview/adaptive-question`, {
        method: 'POST',
        body: JSON.stringify({
          question_prompt: questionPrompt,
          candidate_answer: candidateAnswer,
          ideal_keywords: idealKeywords,
          follow_up_vague: followUpVague,
          follow_up_expert: followUpExpert,
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error('Adaptive evaluation failed');
      return await res.json();
    } catch {
      return null;
    }
  },

  // ─── Presets ──────────────────────────────────────────────────────────────
  async getPresets() {
    try {
      const res = await authFetch(`${API_BASE_URL}/presets`, { signal: AbortSignal.timeout(3000) });
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  // ─── Telemetry ────────────────────────────────────────────────────────────
  async logTelemetry(candidateId, event) {
    try {
      await authFetch(`${API_BASE_URL}/interview/telemetry`, {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId, timestamp: event.timestamp, event_type: event.type, description: event.description, severity: event.severity || 'medium' }),
        signal: AbortSignal.timeout(2000),
      });
    } catch { /* non-blocking */ }
  },

  // ─── Evaluation ───────────────────────────────────────────────────────────
  async evaluateInterview(payload) {
    try {
      const res = await authFetch(`${API_BASE_URL}/interview/evaluate`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  // ─── 4-Category Technical Assessment API ─────────────────────────────────
  async getAssessment(candidateId, jobId) {
    try {
      const url = `${API_BASE_URL}/assessment/${candidateId}${jobId ? `?job_id=${jobId}` : ''}`;
      const res = await authFetch(url, {
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Failed to load assessment: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('getAssessment error:', err);
      return null;
    }
  },

  // ─── Recruiter Assessment Studio: AI Config Generator ─────────────────────
  async generateStudioConfig(jobId) {
    try {
      const res = await authFetch(`${API_BASE_URL}/assessment/studio/job/${jobId}`, {
        signal: AbortSignal.timeout(60000), // LLM may take a moment
      });
      if (!res.ok) throw new Error(`Studio config generation failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('generateStudioConfig error:', err);
      return null;
    }
  },

  async runCodeSandbox(payload) {
    try {
      const res = await authFetch(`${API_BASE_URL}/assessment/run-code`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`Code execution failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('runCodeSandbox error:', err);
      return {
        all_passed: false,
        passed_count: 0,
        total_count: 1,
        test_results: [{ name: 'Execution Timeout / Error', passed: false, error: err.message, duration: '0ms' }],
        console_output: `> Sandbox Error: ${err.message}`,
        execution_ms: 0,
      };
    }
  },

  async submitAssessment(candidateId, payload) {
    try {
      const res = await authFetch(`${API_BASE_URL}/assessment/${candidateId}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`Submission failed: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('submitAssessment error:', err);
      return null;
    }
  },

  async startAssessment(candidateId) {
    try {
      const res = await authFetch(`${API_BASE_URL}/assessment/${candidateId}/start`, {
        method: 'POST',
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to start assessment');
      }
      return await res.json();
    } catch (err) {
      console.warn('[API] startAssessment error:', err.message);
      return null;
    }
  },

  async startInterview(candidateId) {
    try {
      const res = await authFetch(`${API_BASE_URL}/interview/start`, {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to start interview');
      }
      return await res.json();
    } catch (err) {
      console.warn('[API] startInterview error:', err.message);
      return null;
    }
  },

  async queryCopilot({ query, candidateId = null, jobId = null, userRole = 'recruiter', userEmail = null, userName = null }) {
    try {
      const res = await authFetch(`${API_BASE_URL}/copilot/query`, {
        method: 'POST',
        body: JSON.stringify({ 
          query, 
          candidate_id: candidateId, 
          job_id: jobId,
          user_role: userRole,
          user_email: userEmail,
          user_name: userName
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Copilot query failed');
      }
      return await res.json();
    } catch (err) {
      console.warn('[API] queryCopilot error:', err.message);
      return null;
    }
  },
};

export default api;