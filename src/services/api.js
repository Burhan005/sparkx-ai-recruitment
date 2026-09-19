// API Service connecting the Frontend to Python + FastAPI + PostgreSQL Backend

const API_BASE_URL = 'http://localhost:8000/api';

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
      const res = await fetch(`${API_BASE_URL}/jobs`, { signal: AbortSignal.timeout(2500) });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.info('Backend offline, using local state for jobs:', err.message);
      return null;
    }
  },

  async createJob(jobData) {
    try {
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('Failed to create job on server');
      return await res.json();
    } catch (err) {
      console.info('Saved job locally (backend offline):', err.message);
      return null;
    }
  },

  // Candidates
  async getCandidates() {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`, { signal: AbortSignal.timeout(2500) });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch (err) {
      console.info('Backend offline, using local state for candidates:', err.message);
      return null;
    }
  },

  async applyCandidate(candidateData) {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error('Application submission failed');
      return await res.json();
    } catch (err) {
      console.info('Saved application locally (backend offline):', err.message);
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
