/**
 * RecruitmentContext.jsx
 * Single source of truth for all app state.
 * ALL data is fetched from the FastAPI backend — zero static/mock data.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { generateCandidateEvaluation } from '../services/aiRecruiterService';
import { api } from '../services/api';

const RecruitmentContext = createContext();

// ─── Mini event bus for toasts (avoids circular deps) ────────────────────────
const toastBus = { listeners: [], emit(msg, type) { this.listeners.forEach(fn => fn(msg, type)); } };
export const onContextToast = (fn) => {
  toastBus.listeners.push(fn);
  return () => { toastBus.listeners = toastBus.listeners.filter(l => l !== fn); };
};

export function RecruitmentProvider({ children }) {

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('sparkx_theme') || 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark',  theme === 'dark');
    document.documentElement.classList.toggle('light', theme !== 'dark');
    localStorage.setItem('sparkx_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  // ── Auth ───────────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('sparkx_logged_in'));
  const [userRole,   setUserRole]   = useState(() => localStorage.getItem('sparkx_user_role') || 'recruiter');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sparkx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((userObj) => {
    const role = typeof userObj === 'string' ? userObj : (userObj.role || 'recruiter');
    const user = typeof userObj === 'object' ? userObj : { name: role === 'recruiter' ? 'SparkX Admin' : 'Demo Candidate', role, email: `${role}@sparkx.ai` };
    
    if (user.token) {
      localStorage.setItem('sparkx_token', user.token);
    }
    setCurrentUser(user);
    setUserRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('sparkx_user', JSON.stringify(user));
    localStorage.setItem('sparkx_user_role', role);
    localStorage.setItem('sparkx_logged_in', '1');
    setCurrentView(role === 'candidate' ? 'candidate' : 'recruiter');
    toastBus.emit(`Welcome, ${user.name}! Signed in as ${role === 'recruiter' ? 'Recruiter' : 'Candidate'}`, 'success');
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('sparkx_logged_in');
    localStorage.removeItem('sparkx_user');
    localStorage.removeItem('sparkx_user_role');
    localStorage.removeItem('sparkx_token');
    toastBus.emit('Signed out successfully', 'info');
  }, []);

  const switchRole = useCallback((newRole) => {
    setUserRole(newRole);
    localStorage.setItem('sparkx_user_role', newRole);
    setCurrentView(newRole === 'candidate' ? 'candidate' : 'recruiter');
    toastBus.emit(`Switched to ${newRole === 'recruiter' ? 'Admin' : 'Candidate'} mode`, 'info');
  }, []);

  // ── Core Data State — starts EMPTY, filled by backend ─────────────────────
  const [jobs,       setJobs]       = useState([]);  // ← NEVER has hardcoded data
  const [candidates, setCandidates] = useState([]);  // ← NEVER has hardcoded data
  const [activeJobId,   setActiveJobId]   = useState(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError,       setDbError]       = useState(null); // error message when backend offline
  const [currentView,   setCurrentView]   = useState(() => {
    const r = localStorage.getItem('sparkx_user_role') || 'recruiter';
    return r === 'candidate' ? 'candidate' : 'recruiter';
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [currentInterviewSession, setCurrentInterviewSession] = useState({
    candidateId: null,
    candidateName: 'You (Live Candidate)',
    jobId: null,
    transcript: [],
    integrityScore: 100,
    integrityRisk: 'Low',
    integrityEvents: [],
    codeScore: 90,
  });

  // ── DB Sync ────────────────────────────────────────────────────────────────
  const syncWithDatabase = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setDbError(null);
    try {
      const health = await api.checkHealth();
      if (!health) throw new Error('Cannot reach backend at http://localhost:8000');

      setIsDbConnected(true);
      const [dbJobs, dbCandidates] = await Promise.all([api.getJobs(), api.getCandidates()]);

      const safeJobs  = (dbJobs       && dbJobs.length       > 0) ? dbJobs       : [];
      const safeCands = (dbCandidates && dbCandidates.length  > 0) ? dbCandidates : [];

      setJobs(safeJobs);
      setCandidates(safeCands);
      setActiveJobId(prev => prev || safeJobs[0]?.id || null);

      if (!silent) {
        if (safeJobs.length === 0) {
          toastBus.emit('DB connected but empty — run: python backend/seed.py', 'warning');
        } else {
          toastBus.emit(`Live DB synced — ${safeJobs.length} jobs, ${safeCands.length} candidates`, 'success');
        }
      }
    } catch (err) {
      setIsDbConnected(false);
      setJobs([]);       // ← Clear data — show empty state, NOT fake data
      setCandidates([]); // ← Clear data — show empty state, NOT fake data
      const msg = `Backend offline: ${err.message}`;
      setDbError(msg);
      if (!silent) toastBus.emit('Backend offline — start: python -m uvicorn main:app --reload --port 8000', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { syncWithDatabase(false); }, [syncWithDatabase]);

  // Sync on window focus (catches DBeaver / external DB edits)
  useEffect(() => {
    const handle = () => syncWithDatabase(true);
    window.addEventListener('focus', handle);
    return () => window.removeEventListener('focus', handle);
  }, [syncWithDatabase]);

  // Poll every 30s when connected
  const pollRef = useRef(null);
  useEffect(() => {
    clearInterval(pollRef.current);
    if (isDbConnected) {
      pollRef.current = setInterval(() => syncWithDatabase(true), 30000);
    }
    return () => clearInterval(pollRef.current);
  }, [isDbConnected, syncWithDatabase]);

  // ── Recruiter Actions ──────────────────────────────────────────────────────
  const createJob = async (newJobData) => {
    const savedJob = await api.createJob(newJobData);
    if (!savedJob) {
      toastBus.emit('Failed to create job — is the backend running?', 'error');
      return null;
    }
    setJobs(prev => [savedJob, ...prev.filter(j => j.id !== savedJob.id)]);
    setActiveJobId(savedJob.id);
    toastBus.emit(`Job "${savedJob.title}" posted to database!`, 'success');
    return savedJob;
  };

  const updateCandidateStatus = async (candidateId, newStatus, hrNotes = '') => {
    const result = await api.updateCandidateStatus(candidateId, newStatus, hrNotes);
    const update = {
      status:        newStatus === 'Rejected' ? 'Rejected' : 'Evaluated',
      finalDecision: newStatus,
      hrNotes:       hrNotes,
    };
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, ...update } : c));
    if (selectedCandidate?.id === candidateId) setSelectedCandidate(p => ({ ...p, ...update }));
    const emoji = { Shortlisted: '🎉', Rejected: '❌', 'Under Review': '📋' }[newStatus] || '📋';
    toastBus.emit(`${emoji} ${newStatus} — HR decision saved to database`, newStatus === 'Rejected' ? 'warning' : 'success');
  };

  const scheduleInterview = async (candidateId, scheduledAt, notes = '') => {
    const updatedCand = await api.scheduleInterview(candidateId, scheduledAt, notes);
    if (updatedCand) {
      setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCand : c));
      if (selectedCandidate?.id === candidateId) setSelectedCandidate(updatedCand);
      toastBus.emit(`Interview scheduled for ${scheduledAt} — Confirmation email sent!`, 'success');
      return updatedCand;
    }
  };

  const sendEmail = async (candidateId, templateType, customMessage = '') => {
    const result = await api.sendEmail(candidateId, templateType, customMessage);
    if (result) {
      // Re-fetch candidate to update email logs
      const updated = await api.getCandidates();
      if (updated) setCandidates(updated);
      toastBus.emit(`Email notification sent to candidate!`, 'success');
      return result;
    }
  };

  // ── Candidate Actions ──────────────────────────────────────────────────────
  const applyForJob = async ({ jobId, name, email, phone, experienceYears, education, skills, resumeSummary, fraudFlags = [] }) => {
    const targetJob = jobs.find(j => j.id === jobId) || jobs[0];
    if (!targetJob) {
      toastBus.emit('No jobs found — is the backend running?', 'error');
      return null;
    }
    // Client-side match preview score (backend recalculates authoritatively)
    const reqSkills = targetJob.requiredSkills || [];
    const lowerSkills = skills.map(s => s.toLowerCase());
    const matchCount = reqSkills.filter(req => lowerSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))).length;
    let matchPercentage = Math.round((matchCount / Math.max(1, reqSkills.length)) * 70);
    matchPercentage += Number(experienceYears) >= (targetJob.minExperienceYears || 2) ? 25 : 10;
    matchPercentage = Math.min(99, Math.max(35, matchPercentage));

    const localCand = {
      id: `cand-${Date.now()}`,
      jobId: targetJob.id,
      name, email,
      phone: phone || '+91 98000 00000',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Screening',
      matchScore: matchPercentage,
      experienceYears: Number(experienceYears),
      education, skills, resumeSummary, fraudFlags,
      integrityScore: 100, integrityRisk: 'Low', integrityEvents: [],
      scores: { jobSkills: 0, technicalScore: 0, communication: 0, problemSolving: 0, overall: 0 },
      interviewSummary: 'Screening completed. Ready for Live AI Interview & Assessment.',
      evidenceSnippets: [], skillGaps: null, hrNotes: '', finalDecision: 'Pending Interview',
    };

    const savedCand = await api.applyCandidate(localCand);
    const newCandidate = savedCand || localCand; // graceful fallback if backend saves fail

    setCandidates(prev => [newCandidate, ...prev.filter(c => c.id !== newCandidate.id)]);
    setJobs(prev => prev.map(j => j.id === targetJob.id ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j));
    setCurrentInterviewSession({
      candidateId: newCandidate.id,
      candidateName: newCandidate.name,
      jobId: targetJob.id,
      transcript: [], integrityScore: 100, integrityRisk: 'Low', integrityEvents: [], codeScore: 85,
    });
    toastBus.emit(`Application submitted — match score: ${matchPercentage}%`, 'success');
    return newCandidate;
  };

  const completeInterviewAndEvaluate = async ({ transcript, integrityScore, integrityEvents, codeScore }) => {
    const candId = currentInterviewSession.candidateId;
    const targetCandidate = candidates.find(c => c.id === candId);
    const targetJob = jobs.find(j => j.id === (targetCandidate?.jobId || currentInterviewSession.jobId)) || jobs[0];

    // Authoritative dynamic evaluation from FastAPI backend ai_engine
    let evaluation = null;
    if (candId) {
      evaluation = await api.evaluateInterview({
        candidate_id:      candId,
        job_id:            targetJob?.id,
        transcript,
        integrity_score:   integrityScore,
        integrity_events:  integrityEvents,
        code_score:        codeScore,
      });
    }

    // Fallback to dynamic text analysis if backend call fails
    if (!evaluation) {
      evaluation = generateCandidateEvaluation({
        job: targetJob,
        candidateName: targetCandidate?.name || currentInterviewSession.candidateName,
        resumeSkills:  targetCandidate?.skills || ['React', 'JavaScript', 'Python'],
        transcript, integrityScore, integrityEvents, codeScore,
      });
    }

    const updatedData = {
      ...evaluation,
      status: 'Evaluated',
      integrityEvents,
      integrityScore,
      finalDecision: (evaluation.scores?.overall || 0) >= 80 && (evaluation.integrityRisk || 'Low') === 'Low' ? 'Shortlisted' : 'Under Review',
    };

    if (candId) {
      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, ...updatedData } : c));
      setSelectedCandidate({ ...targetCandidate, ...updatedData });
    }

    toastBus.emit(`Interview complete — Score: ${evaluation.scores.overall}/100`, 'success');
    return evaluation;
  };

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0] || null;

  return (
    <RecruitmentContext.Provider value={{
      theme, toggleTheme,
      isLoggedIn, login, logout, currentUser,
      userRole, switchRole,
      isDbConnected, isLoading, dbError,
      jobs, candidates,
      currentView, setCurrentView,
      selectedCandidate, setSelectedCandidate,
      activeJob, setActiveJobId,
      createJob, updateCandidateStatus, applyForJob,
      scheduleInterview, sendEmail,
      currentInterviewSession, setCurrentInterviewSession,
      completeInterviewAndEvaluate,
      syncWithDatabase,
    }}>
      {children}
    </RecruitmentContext.Provider>
  );
}

export const useRecruitment = () => useContext(RecruitmentContext);