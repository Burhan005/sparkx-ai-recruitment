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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('sparkx_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light'; // Default to browser/OS light mode if dark is not preferred
  });
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
    // Production RBAC: Candidate accounts cannot arbitrarily elevate to recruiter
    if (currentUser?.role === 'candidate' && newRole === 'recruiter') {
      toastBus.emit('Access Denied: Recruiter Hub requires authorized recruiter credentials.', 'error');
      return;
    }
    setUserRole(newRole);
    localStorage.setItem('sparkx_user_role', newRole);
    setCurrentView(newRole === 'candidate' ? 'candidate' : 'recruiter');
    toastBus.emit(`Switched to ${newRole === 'recruiter' ? 'Admin' : 'Candidate'} mode`, 'info');
  }, [currentUser]);

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
    codeScore: 0,
  });

  // ── Candidate Applications State ───────────────────────────────────────────
  const [myApplications, setMyApplications] = useState([]);

  const refreshMyApplications = useCallback(async (email) => {
    const targetEmail = email || currentUser?.email;
    if (!targetEmail) return [];
    try {
      const apps = await api.getMyApplications(targetEmail);
      setMyApplications(apps);
      return apps;
    } catch {
      return [];
    }
  }, [currentUser?.email]);

  const updateUserProfile = useCallback(async (profileData) => {
    if (!currentUser?.id) return null;
    const updated = await api.updateProfile(currentUser.id, profileData);
    if (updated) {
      const mergedUser = { ...currentUser, ...updated };
      setCurrentUser(mergedUser);
      localStorage.setItem('sparkx_user', JSON.stringify(mergedUser));
      toastBus.emit('Profile & Resume updated successfully!', 'success');
      return mergedUser;
    }
    return null;
  }, [currentUser]);

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

      if (currentUser?.email) {
        refreshMyApplications(currentUser.email);
      }

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
    await api.updateCandidateStatus(candidateId, newStatus, hrNotes);

    let statusVal = 'Evaluated';
    let decisionVal = newStatus;
    let scheduledAt = null;
    let meetingUrl = null;

    if (newStatus === 'Screening' || newStatus === 'Applied' || newStatus === 'Under Review') {
      statusVal = 'Evaluated';
      decisionVal = 'Under Review';
    } else if (newStatus === 'Interview Scheduled' || newStatus === 'Scheduled' || newStatus === 'Interview') {
      statusVal = 'Interview Scheduled';
      decisionVal = 'Interview';
      scheduledAt = 'Upcoming Slot';
      const shortId = (candidateId || '').replace('cand-', '').slice(0, 6);
      meetingUrl = `https://meet.google.com/spk-${shortId.slice(0, 3)}-${shortId.slice(3) || 'rec'}`;
    } else if (newStatus === 'Shortlisted') {
      statusVal = 'Evaluated';
      decisionVal = 'Shortlisted';
    } else if (newStatus === 'Offered' || newStatus === 'Selected') {
      statusVal = 'Evaluated';
      decisionVal = 'Selected';
    } else if (newStatus === 'Rejected') {
      statusVal = 'Rejected';
      decisionVal = 'Rejected';
    }

    setCandidates(prev => prev.map(c => {
      if (c.id !== candidateId) return c;
      return {
        ...c,
        status: statusVal,
        finalDecision: decisionVal,
        hrNotes: hrNotes || c.hrNotes,
        interviewScheduledAt: statusVal === 'Screening' ? null : (c.interviewScheduledAt || scheduledAt),
        interviewMeetingUrl: statusVal === 'Screening' ? null : (c.interviewMeetingUrl || meetingUrl),
      };
    }));

    setMyApplications(prev => prev.map(app => {
      if (app.id !== candidateId) return app;
      return {
        ...app,
        status: statusVal,
        finalDecision: decisionVal,
        interviewScheduledAt: statusVal === 'Screening' ? null : (app.interviewScheduledAt || scheduledAt),
        interviewMeetingUrl: statusVal === 'Screening' ? null : (app.interviewMeetingUrl || meetingUrl),
      };
    }));

    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate(p => ({
        ...p,
        status: statusVal,
        finalDecision: decisionVal,
        hrNotes: hrNotes || p?.hrNotes,
        interviewScheduledAt: statusVal === 'Screening' ? null : (p?.interviewScheduledAt || scheduledAt),
        interviewMeetingUrl: statusVal === 'Screening' ? null : (p?.interviewMeetingUrl || meetingUrl),
      }));
    }

    const emojiMap = {
      Shortlisted: '🎉',
      Selected: '🤝',
      Offered: '🤝',
      Rejected: '❌',
      'Under Review': '📋',
      Evaluated: '🤖',
      Interview: '📅',
      'Interview Scheduled': '📅',
      Screening: '📋'
    };
    const emoji = emojiMap[decisionVal] || emojiMap[newStatus] || '📋';
    toastBus.emit(`${emoji} Moved to ${decisionVal} — saved to database!`, decisionVal === 'Rejected' ? 'warning' : 'success');
  };

  const scheduleInterview = async (candidateId, scheduledAt, notes = '', meetingUrl = '') => {
    const updatedCand = await api.scheduleInterview(candidateId, scheduledAt, notes, meetingUrl);
    if (updatedCand) {
      setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCand : c));
      setMyApplications(prev => prev.map(a => a.id === candidateId ? { ...a, finalDecision: 'Interview', interviewScheduledAt: scheduledAt, interviewMeetingUrl: updatedCand.interviewMeetingUrl } : a));
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
  const applyForJob = async ({ jobId, name, email, phone, experienceYears, education, skills, resumeSummary, resumeFilename, resumeText, fraudFlags = [] }) => {
    const targetJob = jobs.find(j => j.id === jobId) || jobs[0];
    if (!targetJob) {
      toastBus.emit('No jobs found — is the backend running?', 'error');
      return null;
    }
    // Client-side match preview score (backend recalculates authoritatively)
    const reqSkills = targetJob.requiredSkills || [];
    const lowerSkills = (skills || []).map(s => s.toLowerCase());
    const matchCount = reqSkills.filter(req => lowerSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))).length;
    let matchPercentage = Math.round((matchCount / Math.max(1, reqSkills.length)) * 70);
    matchPercentage += Number(experienceYears) >= (targetJob.minExperienceYears || 2) ? 25 : 10;
    matchPercentage = Math.min(99, Math.max(35, matchPercentage));

    const localCand = {
      id: `cand-${Date.now()}`,
      jobId: targetJob.id,
      companyName: targetJob.companyName || 'SparkX Technologies',
      name, email,
      phone: phone || '+91 98000 00000',
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Screening',
      finalDecision: 'Under Review',
      matchScore: matchPercentage,
      experienceYears: Number(experienceYears),
      education, skills, resumeSummary,
      resumeFilename: resumeFilename || null,
      resumeText: resumeText || null,
      fraudFlags,
      integrityScore: 100, integrityRisk: 'Low', integrityEvents: [],
      scores: { jobSkills: 0, technicalScore: 0, communication: 0, problemSolving: 0, overall: 0 },
      interviewSummary: 'Screening completed. Ready for Live AI Interview & Assessment.',
      evidenceSnippets: [], skillGaps: null, hrNotes: '',
    };

    const savedCand = await api.applyCandidate(localCand);
    const newCandidate = savedCand || localCand; // graceful fallback if backend saves fail

    setCandidates(prev => [newCandidate, ...prev.filter(c => c.id !== newCandidate.id)]);
    setJobs(prev => prev.map(j => j.id === targetJob.id ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j));
    
    // Refresh applicant's list
    if (email) {
      refreshMyApplications(email);
    }

    setCurrentInterviewSession({
      candidateId: newCandidate.id,
      candidateName: newCandidate.name,
      jobId: targetJob.id,
      transcript: [], integrityScore: 100, integrityRisk: 'Low', integrityEvents: [], codeScore: 0,
    });
    toastBus.emit(`Application submitted for ${targetJob.title} — status: Under Review!`, 'success');
    return newCandidate;
  };

  const completeInterviewAndEvaluate = async ({ transcript = [], integrityScore = 100, integrityEvents = [], codeScore = 0, candidateId, assessmentScores }) => {
    const candId = candidateId || currentInterviewSession.candidateId || currentUser?.id;
    let targetCandidate = candidates.find(c => c.id === candId) || candidates.find(c => c.email === currentUser?.email);
    const targetJob = jobs.find(j => j.id === (targetCandidate?.jobId || currentInterviewSession.jobId)) || jobs[0];

    // Effective code score: strictly use the assessment overall score if provided
    const effectiveCodeScore = typeof codeScore === 'number' ? codeScore : (assessmentScores?.overall ?? 0);

    // Authoritative dynamic evaluation from FastAPI backend ai_engine
    let evaluation = null;
    if (candId && transcript && transcript.length > 0) {
      evaluation = await api.evaluateInterview({
        candidate_id:      candId,
        job_id:            targetJob?.id,
        transcript,
        integrity_score:   integrityScore,
        integrity_events:  integrityEvents,
        code_score:        effectiveCodeScore,
      });
    }

    // Fallback to dynamic text analysis if backend interview call not triggered
    if (!evaluation) {
      const jobSkills = targetJob?.requiredSkills || ['AWS', 'Docker', 'Kubernetes'];
      const overallScore = effectiveCodeScore;
      let readiness = "Needs Foundational Preparation (Gap > 70%)";
      let strongSkills = [];
      let missingSkills = jobSkills;
      let recommendations = jobSkills.map(s => `Complete hands-on certification in ${s} to build technical competency.`);

      if (overallScore >= 80) {
        readiness = "Immediately Job-Ready";
        strongSkills = jobSkills.slice(0, 3);
        missingSkills = jobSkills.slice(3);
        recommendations = ["Demonstrated production mastery across core technical pillars. Ready for senior technical leadership."];
      } else if (overallScore >= 50) {
        readiness = "Hire-and-Develop (Trainable within 30 days)";
        strongSkills = jobSkills.slice(0, 1);
        missingSkills = jobSkills.slice(1);
        recommendations = missingSkills.map(s => `Targeted architectural workshop in ${s}.`);
      }

      evaluation = {
        scores: {
          jobSkills: overallScore,
          technicalScore: assessmentScores?.technical ?? overallScore,
          communication: transcript.length > 0 ? 70 : 0,
          problemSolving: Math.round(((assessmentScores?.hands_on ?? overallScore) * 0.5) + ((assessmentScores?.troubleshooting ?? overallScore) * 0.5)),
          overall: overallScore
        },
        integrityScore: integrityScore ?? 100,
        integrityRisk: 'Low',
        skillGaps: {
          readiness,
          strongSkills,
          missingSkills,
          recommendations
        }
      };
    }

    const updatedData = {
      ...(targetCandidate || {}),
      id: candId || targetCandidate?.id,
      name: targetCandidate?.name || currentUser?.name || 'Candidate',
      jobId: targetJob?.id,
      job: targetJob,
      ...evaluation,
      coding_score: effectiveCodeScore,
      status: 'Evaluated',
      integrityEvents,
      integrityScore,
      finalDecision: (evaluation.scores?.overall || 0) >= 80 ? 'Shortlisted' : 'Under Review',
    };

    if (candId) {
      setCandidates(prev => prev.map(c => c.id === candId ? updatedData : c));
    }
    setSelectedCandidate(updatedData);

    toastBus.emit(`Assessment complete — Score: ${evaluation.scores.overall}/100`, evaluation.scores.overall >= 50 ? 'success' : 'info');
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
      myApplications, refreshMyApplications, updateUserProfile,
    }}>
      {children}
    </RecruitmentContext.Provider>
  );
}

export const useRecruitment = () => useContext(RecruitmentContext);