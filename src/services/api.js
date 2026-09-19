// API Service connecting the Frontend to Python + FastAPI + PostgreSQL Backend

const API_BASE_URL = 'http://localhost:8000/api';

function normalizeJob(j) {
  if (!j) return j;
  return {
    ...j,
    requiredSkills: j.required_skills || j.requiredSkills || [],
    minExperienceYears: j.min_experience_years !== undefined ? j.min_experience_years : j.minExperienceYears || 2,
    optionalCriteria: j.optional_criteria || j.optionalCriteria || '',
    codingAssessment: j.coding_assessment || j.codingAssessment || {},
    applicantsCount: j.applicants_count !== undefined ? j.applicants_count : j.applicantsCount || 0
  };
}

function normalizeCandidate(c) {
  if (!c) return c;
  return {
    ...c,
    jobId: c.job_id || c.jobId,
    matchScore: c.match_score !== undefined ? c.match_score : c.matchScore || 0,
    experienceYears: c.experience_years !== undefined ? c.experience_years : c.experienceYears || 0,
    appliedDate: c.applied_date || c.appliedDate || '',
    fraudFlags: c.fraud_flags || c.fraudFlags || [],
    integrityScore: c.integrity_score !== undefined ? c.integrity_score : c.integrityScore || 100,
    integrityRisk: c.integrity_risk || c.integrityRisk || 'Low',
    integrityEvents: c.integrity_events || c.integrityEvents || [],
    finalDecision: c.final_decision || c.finalDecision || 'Pending Interview',
    hrNotes: c.hr_notes || c.hrNotes || '',
    interviewSummary: c.interview_summary || c.interviewSummary || '',
    evidenceSnippets: c.evidence_snippets || c.evidenceSnippets || [],
    skillGaps: c.skill_gaps || c.skillGaps || null,
    resumeSummary: c.resume_summary || c.resumeSummary || ''
  };
}

export const api = {
  // Check backend connectivity
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // Jobs
  async getJobs() {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeJob) : [];
    } catch (err) {
      console.info('Backend fetch skipped, using local data:', err.message);
      return null;
    }
  },

  async createJob(jobData) {
    try {
      const payload = {
        title: jobData.title,
        department: jobData.department,
        location: jobData.location || "Remote",
        min_experience_years: Number(jobData.minExperienceYears || 2),
        education: jobData.education,
        languages: jobData.languages || ["English"],
        required_skills: jobData.requiredSkills || [],
        optional_criteria: jobData.optionalCriteria || "",
        description: jobData.description,
        questions: jobData.questions || [],
        coding_assessment: jobData.codingAssessment || {}
      };

      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error('Failed to create job on server');
      const savedJob = await res.json();
      return normalizeJob(savedJob);
    } catch (err) {
      console.warn('Saved job locally (backend unavailable):', err.message);
      return null;
    }
  },

  // Candidates
  async getCandidates() {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const data = await res.json();
      return Array.isArray(data) ? data.map(normalizeCandidate) : [];
    } catch (err) {
      console.info('Backend fetch skipped, using local candidates:', err.message);
      return null;
    }
  },

  async applyCandidate(candData) {
    try {
      const payload = {
        job_id: candData.jobId,
        name: candData.name,
        email: candData.email,
        phone: candData.phone || "+91 98000 00000",
        experience_years: Number(candData.experienceYears || 0),
        education: candData.education,
        skills: candData.skills || [],
        resume_summary: candData.resumeSummary || "",
        fraud_flags: candData.fraudFlags || []
      };

      const res = await fetch(`${API_BASE_URL}/candidates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error('Application submission failed');
      const saved = await res.json();
      return normalizeCandidate(saved);
    } catch (err) {
      console.warn('Saved candidate locally (backend unavailable):', err.message);
      return null;
    }
  },

  async updateCandidateStatus(candidateId, status, hrNotes = "") {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, hr_notes: hrNotes }),
        signal: AbortSignal.timeout(3000)
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  },

  // Telemetry Audit Logs
  async logTelemetry(candidateId, event) {
    try {
      await fetch(`${API_BASE_URL}/interview/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidateId,
          timestamp: event.timestamp,
          event_type: event.type,
          description: event.description,
          severity: event.severity || 'medium'
        }),
        signal: AbortSignal.timeout(1500)
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  // Evaluation
  async evaluateInterview(payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3500)
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }
};
