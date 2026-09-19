// ─── SparkX API Service ───────────────────────────────────────────────────────
// Connects the React frontend to the Python FastAPI backend.
// ALL data comes from the backend — zero hardcoded data in this file.

const API_BASE_URL = 'http://localhost:8000/api';

// ─── Normalizers: snake_case (backend) → camelCase (frontend) ─────────────────
export function normalizeJob(j) {
  if (!j) return j;
  return {
    ...j,
    requiredSkills:    j.required_skills    ?? j.requiredSkills    ?? [],
    minExperienceYears:j.min_experience_years != null ? j.min_experience_years : (j.minExperienceYears ?? 2),
    optionalCriteria:  j.optional_criteria  ?? j.optionalCriteria  ?? '',
    codingAssessment:  j.coding_assessment  ?? j.codingAssessment  ?? null,
    applicantsCount:   j.applicants_count   != null ? j.applicants_count : (j.applicantsCount ?? 0),
    questions:         j.questions          ?? [],
    status:            j.status             ?? 'Active',
  };
}

export function normalizeCandidate(c) {
  if (!c) return c;
  return {
    ...c,
    jobId:           c.job_id          ?? c.jobId,
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
    scores:          c.scores          ?? { jobSkills: 0, technicalScore: 0, communication: 0, problemSolving: 0, overall: 0 },
    skills:          c.skills          ?? [],
    interviewScheduledAt: c.interview_scheduled_at ?? c.interviewScheduledAt ?? null,
    interviewMeetingUrl:  c.interview_meeting_url  ?? c.interviewMeetingUrl  ?? null,
    interviewStatus:      c.interview_status       ?? c.interviewStatus      ?? 'Applied',
    emailLogs:            c.email_logs             ?? c.emailLogs            ?? [],
  };
}

export function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('sparkx_token');
  const headers = { 'Content-Type': 'application/json', ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // ─── Authentication & Password Recovery ──────────────────────────────────────
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

  async register(name, email, password, role = 'candidate', adminCode = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, admin_code: adminCode }),
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
      const res = await fetch(`${API_BASE_URL}/jobs`, { signal: AbortSignal.timeout(4000) });
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
        languages:            jobData.languages || ['English'],
        required_skills:      jobData.requiredSkills || [],
        optional_criteria:    jobData.optionalCriteria || '',
        description:          jobData.description,
        questions:            jobData.questions || [],
        coding_assessment:    jobData.codingAssessment || null,
      };
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // ─── Candidates ───────────────────────────────────────────────────────────
  async getCandidates() {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`, { signal: AbortSignal.timeout(4000) });
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
        job_id:          candData.jobId,
        name:            candData.name,
        email:           candData.email,
        phone:           candData.phone || '+91 98000 00000',
        experience_years:Number(candData.experienceYears ?? 0),
        education:       candData.education,
        skills:          candData.skills || [],
        resume_summary:  candData.resumeSummary || '',
        fraud_flags:     candData.fraudFlags || [],
      };
      const res = await fetch(`${API_BASE_URL}/candidates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error('Application failed');
      return normalizeCandidate(await res.json());
    } catch (err) {
      console.warn('[API] applyCandidate failed:', err.message);
      return null;
    }
  },

  async updateCandidateStatus(candidateId, status, hrNotes = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, hr_notes: hrNotes }),
        signal: AbortSignal.timeout(4000),
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },

  async scheduleInterview(candidateId, scheduledAt, notes = '', meetingUrl = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${candidateId}/schedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  async sendEmail(candidateId, templateType, customMessage = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${candidateId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  async evaluateAdaptiveAnswer(questionPrompt, candidateAnswer, idealKeywords = [], followUpVague = null, followUpExpert = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/adaptive-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_BASE_URL}/presets`, { signal: AbortSignal.timeout(3000) });
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  // ─── Telemetry ────────────────────────────────────────────────────────────
  async logTelemetry(candidateId, event) {
    try {
      await fetch(`${API_BASE_URL}/interview/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, timestamp: event.timestamp, event_type: event.type, description: event.description, severity: event.severity || 'medium' }),
        signal: AbortSignal.timeout(2000),
      });
    } catch { /* non-blocking */ }
  },

  // ─── Evaluation ───────────────────────────────────────────────────────────
  async evaluateInterview(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  },
};