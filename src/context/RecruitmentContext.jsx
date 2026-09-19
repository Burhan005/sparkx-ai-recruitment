import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_JOBS, INITIAL_CANDIDATES } from '../data/mockData';
import { generateCandidateEvaluation } from '../services/aiRecruiterService';
import { api } from '../services/api';

const RecruitmentContext = createContext();

// ─── Mini toast event bus (avoids circular deps with ToastProvider) ───────────
const toastBus = { listeners: [], emit(msg, type) { this.listeners.forEach(fn => fn(msg, type)); } };
export const onContextToast = (fn) => { toastBus.listeners.push(fn); return () => { toastBus.listeners = toastBus.listeners.filter(l => l !== fn); }; };

export function RecruitmentProvider({ children }) {

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('sparkx_theme') || 'dark');
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme !== 'dark');
    localStorage.setItem('sparkx_theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  // ── Auth / Role ────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('sparkx_logged_in'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('sparkx_user_role') || 'recruiter');

  const login = useCallback((role) => {
    setUserRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('sparkx_user_role', role);
    localStorage.setItem('sparkx_logged_in', '1');
    setCurrentView(role === 'candidate' ? 'candidate' : 'recruiter');
    toastBus.emit(`Signed in as ${role === 'recruiter' ? 'Admin (Recruiter)' : 'Candidate'}`, 'success');
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem('sparkx_logged_in');
    toastBus.emit('Signed out successfully', 'info');
  }, []);

  const switchRole = useCallback((newRole) => {
    setUserRole(newRole);
    localStorage.setItem('sparkx_user_role', newRole);
    setCurrentView(newRole === 'candidate' ? 'candidate' : 'recruiter');
    toastBus.emit(`Switched to ${newRole === 'recruiter' ? 'Admin' : 'Candidate'} mode`, 'info');
  }, []);

  // ── Data & Loading States ──────────────────────────────────────────────────
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);   // true on first load
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [currentView, setCurrentView] = useState(() => {
    const r = localStorage.getItem('sparkx_user_role') || 'recruiter';
    return r === 'candidate' ? 'candidate' : 'recruiter';
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
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
    try {
      const health = await api.checkHealth();
      if (health) {
        setIsDbConnected(true);
        const [dbJobs, dbCandidates] = await Promise.all([api.getJobs(), api.getCandidates()]);
        if (dbJobs && dbJobs.length > 0) {
          setJobs(dbJobs);
          setActiveJobId(prev => prev || dbJobs[0]?.id || null);
        } else {
          // Backend up but empty — load initial seed data and show fallback
          setJobs(INITIAL_JOBS);
          setActiveJobId(INITIAL_JOBS[0]?.id || null);
        }
        if (dbCandidates && dbCandidates.length > 0) {
          setCandidates(dbCandidates);
        } else {
          setCandidates(INITIAL_CANDIDATES);
        }
        if (!silent) toastBus.emit('Live database connected — data synced', 'success');
      } else {
        throw new Error('Backend offline');
      }
    } catch {
      setIsDbConnected(false);
      // Fallback: localStorage or mock data
      const savedJobs = localStorage.getItem('sparkx_jobs');
      const savedCands = localStorage.getItem('sparkx_candidates');
      const fallbackJobs = savedJobs ? JSON.parse(savedJobs) : INITIAL_JOBS;
      const fallbackCands = savedCands ? JSON.parse(savedCands) : INITIAL_CANDIDATES;
      setJobs(fallbackJobs);
      setCandidates(fallbackCands);
      setActiveJobId(prev => prev || fallbackJobs[0]?.id || null);
      if (!silent) toastBus.emit('Backend offline — showing cached data', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { syncWithDatabase(false); }, [syncWithDatabase]);

  // Sync on window focus (catches DBeaver / external edits)
  useEffect(() => {
    const handleFocus = () => syncWithDatabase(true);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncWithDatabase]);

  // Polling every 30 seconds when db is connected
  const pollRef = useRef(null);
  useEffect(() => {
    if (isDbConnected) {
      pollRef.current = setInterval(() => syncWithDatabase(true), 30000);
    }
    return () => clearInterval(pollRef.current);
  }, [isDbConnected, syncWithDatabase]);

  // Persist to localStorage whenever state changes
  useEffect(() => { if (jobs.length > 0) localStorage.setItem('sparkx_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { if (candidates.length > 0) localStorage.setItem('sparkx_candidates', JSON.stringify(candidates)); }, [candidates]);

  // ── Recruiter Actions ──────────────────────────────────────────────────────
  const createJob = async (newJobData) => {
    const savedJob = await api.createJob(newJobData);
    const newJob = savedJob || {
      ...newJobData,
      id: `job-${Date.now()}`,
      status: 'Active',
      applicantsCount: 0,
    };
    setJobs(prev => [newJob, ...prev.filter(j => j.id !== newJob.id)]);
    setActiveJobId(newJob.id);
    toastBus.emit(`Job "${newJob.title}" posted successfully!`, 'success');
    return newJob;
  };

  const updateCandidateStatus = (candidateId, newStatus, hrNotes = '') => {
    api.updateCandidateStatus(candidateId, newStatus, hrNotes);
    const update = { status: newStatus === 'Rejected' ? 'Rejected' : 'Evaluated', finalDecision: newStatus, hrNotes: hrNotes };
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, ...update } : c));
    if (selectedCandidate?.id === candidateId) setSelectedCandidate(prev => ({ ...prev, ...update }));
    const emoji = newStatus === 'Shortlisted' ? '🎉' : newStatus === 'Rejected' ? '❌' : '📋';
    toastBus.emit(`${emoji} Candidate ${newStatus} — decision saved to database`, newStatus === 'Rejected' ? 'warning' : 'success');
  };

  // ── Candidate Actions ──────────────────────────────────────────────────────
  const applyForJob = async ({ jobId, name, email, phone, experienceYears, education, skills, resumeSummary, fraudFlags = [] }) => {
    const targetJob = jobs.find(j => j.id === jobId) || jobs[0];
    const requiredSkills = targetJob?.requiredSkills || [];
    const lowerSkills = skills.map(s => s.toLowerCase());
    let matchCount = 0;
    requiredSkills.forEach(req => { if (lowerSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) matchCount++; });
    let matchPercentage = Math.round((matchCount / Math.max(1, requiredSkills.length)) * 70);
    matchPercentage += Number(experienceYears) >= (targetJob?.minExperienceYears || 2) ? 25 : 10;
    matchPercentage = Math.min(99, Math.max(35, matchPercentage));

    const localCand = {
      id: `cand-${Date.now()}`,
      jobId: targetJob?.id,
      name, email,
      phone: phone || '+91 98000 00000',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Screening',
      matchScore: matchPercentage,
      experienceYears: Number(experienceYears),
      education, skills, resumeSummary, fraudFlags,
      integrityScore: 100,
      integrityRisk: 'Low',
      integrityEvents: [],
      scores: { jobSkills: 0, technicalScore: 0, communication: 0, problemSolving: 0, overall: 0 },
      interviewSummary: 'Screening completed. Ready for Live AI Interview & Assessment.',
      evidenceSnippets: [],
      skillGaps: null,
      hrNotes: '',
      finalDecision: 'Pending Interview',
    };

    const savedCand = await api.applyCandidate(localCand);
    const newCandidate = savedCand || localCand;
    setCandidates(prev => [newCandidate, ...prev.filter(c => c.id !== newCandidate.id)]);
    setJobs(prev => prev.map(j => j.id === targetJob?.id ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j));
    setCurrentInterviewSession({ candidateId: newCandidate.id, candidateName: newCandidate.name, jobId: targetJob?.id, transcript: [], integrityScore: 100, integrityRisk: 'Low', integrityEvents: [], codeScore: 85 });
    toastBus.emit(`Application submitted for "${targetJob?.title}" — match score: ${matchPercentage}%`, 'success');
    return newCandidate;
  };

  const completeInterviewAndEvaluate = async ({ transcript, integrityScore, integrityEvents, codeScore }) => {
    const candId = currentInterviewSession.candidateId;
    const targetCandidate = candidates.find(c => c.id === candId);
    const targetJob = jobs.find(j => j.id === (targetCandidate?.jobId || currentInterviewSession.jobId)) || jobs[0];
    const evaluation = generateCandidateEvaluation({
      job: targetJob,
      candidateName: targetCandidate ? targetCandidate.name : currentInterviewSession.candidateName,
      resumeSkills: targetCandidate ? targetCandidate.skills : ['React', 'JavaScript', 'Python'],
      transcript, integrityScore, integrityEvents, codeScore,
    });
    if (candId) {
      api.evaluateInterview({ candidate_id: candId, job_id: targetJob?.id, transcript, integrity_score: integrityScore, integrity_events: integrityEvents, code_score: codeScore });
    }
    const updatedData = { ...evaluation, status: 'Evaluated', integrityEvents, integrityScore, finalDecision: evaluation.scores.overall >= 80 && evaluation.integrityRisk === 'Low' ? 'Shortlisted' : 'Under Review' };
    if (candId) {
      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, ...updatedData } : c));
      setSelectedCandidate({ ...targetCandidate, ...updatedData });
    }
    toastBus.emit(`AI Interview complete — Overall Score: ${evaluation.scores.overall}/100`, 'success');
    return evaluation;
  };

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0] || null;

  return (
    <RecruitmentContext.Provider value={{
      theme, toggleTheme,
      isLoggedIn, login, logout,
      userRole, switchRole,
      isDbConnected, isLoading,
      jobs, candidates,
      currentView, setCurrentView,
      selectedCandidate, setSelectedCandidate,
      activeJob, setActiveJobId,
      createJob, updateCandidateStatus, applyForJob,
      currentInterviewSession, setCurrentInterviewSession,
      completeInterviewAndEvaluate,
      syncWithDatabase,
    }}>
      {children}
    </RecruitmentContext.Provider>
  );
}

export const useRecruitment = () => useContext(RecruitmentContext);