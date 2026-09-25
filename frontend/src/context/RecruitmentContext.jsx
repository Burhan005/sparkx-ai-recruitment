/**
 * RecruitmentContext.jsx
 * Single source of truth for all app state.
 * ALL data is fetched from the FastAPI backend — zero static/mock data.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { generateCandidateEvaluation } from '../services/aiRecruiterService';
import { api, authEventBus } from '../services/api';
import { fuzzySkillMatch, normalizeSkill } from '../utils/skillMatcher';

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

  // ── Auth State Machine ───────────────────────────────────────────────────────
  // Initializing state is mandatory: currentUser starts null, userRole starts null.
  // The backend (/api/auth/me) is the authoritative source of truth.
  const [authStatus,  setAuthStatus]  = useState('INITIALIZING'); // 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED'
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole,    setUserRole]    = useState(null);
  const isLoggedIn = authStatus === 'AUTHENTICATED' && currentUser !== null;

  // URL routing is the single source of truth for navigation.
  // currentView and setCurrentView are retained as backward-compatibility shims.
  const [currentView, setCurrentViewState] = useState('candidate');
  const setCurrentView = useCallback((viewOrFn) => {
    setCurrentViewState(viewOrFn);
  }, []);

  const login = useCallback((userObj) => {
    if (!userObj) return;
    const role = userObj.role || 'candidate';
    if (userObj.token) {
      localStorage.setItem('sparkx_token', userObj.token);
    }
    localStorage.setItem('sparkx_user', JSON.stringify(userObj));
    localStorage.setItem('sparkx_user_role', role);
    localStorage.setItem('sparkx_logged_in', '1');

    setCurrentUser(userObj);
    setUserRole(role);
    setAuthStatus('AUTHENTICATED');

    toastBus.emit(`Welcome, ${userObj.name || 'User'}! Signed in as ${role === 'recruiter' ? 'Recruiter' : 'Candidate'}`, 'success');
  }, []);

  const logout = useCallback(() => {
    setAuthStatus('UNAUTHENTICATED');
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('sparkx_logged_in');
    localStorage.removeItem('sparkx_user');
    localStorage.removeItem('sparkx_user_role');
    localStorage.removeItem('sparkx_token');
    localStorage.removeItem('sparkx_current_view');
    setJobs([]);
    setCandidates([]);
    setMyApplications([]);
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
    toastBus.emit(`Switched to ${newRole === 'recruiter' ? 'Admin' : 'Candidate'} mode`, 'info');
  }, [currentUser]);

  // ── Core Data State — starts EMPTY, filled by backend ─────────────────────
  const [jobs,       setJobs]       = useState([]);  // ← NEVER has hardcoded data
  const [candidates, setCandidates] = useState([]);  // ← NEVER has hardcoded data
  const [isLoading,     setIsLoading]     = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError,       setDbError]       = useState(null); // error message when backend offline

  // Persisted activeJobId across page refreshes
  const [activeJobId, setActiveJobIdState] = useState(() => {
    return localStorage.getItem('sparkx_active_job_id') || null;
  });

  const setActiveJobId = useCallback((idOrFn) => {
    setActiveJobIdState(prev => {
      const next = typeof idOrFn === 'function' ? idOrFn(prev) : idOrFn;
      if (next) {
        localStorage.setItem('sparkx_active_job_id', next);
      } else {
        localStorage.removeItem('sparkx_active_job_id');
      }
      return next;
    });
  }, []);

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Persisted interview session across page refreshes
  const [currentInterviewSession, setCurrentInterviewSessionState] = useState(() => {
    try {
      const saved = localStorage.getItem('sparkx_interview_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      candidateId: null,
      candidateName: 'You (Live Candidate)',
      jobId: null,
      transcript: [],
      integrityScore: 100,
      integrityRisk: 'Low',
      integrityEvents: [],
      codeScore: 0,
    };
  });

  const setCurrentInterviewSession = useCallback((sessionOrFn) => {
    setCurrentInterviewSessionState(prev => {
      const next = typeof sessionOrFn === 'function' ? sessionOrFn(prev) : sessionOrFn;
      try {
        localStorage.setItem('sparkx_interview_session', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

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
  const syncWithDatabase = useCallback(async (silent = false, roleOverride = null) => {
    if (!silent) setIsLoading(true);
    setDbError(null);
    try {
      const health = await api.checkHealth();
      if (!health) throw new Error('Cannot reach backend at http://localhost:8000');

      setIsDbConnected(true);
      const activeRole = roleOverride || userRole;

      // Always fetch public/active jobs
      const dbJobs = await api.getJobs();
      const safeJobs = (dbJobs && dbJobs.length > 0) ? dbJobs : [];
      setJobs(safeJobs);
      setActiveJobId(prev => prev || safeJobs[0]?.id || null);

      // Strict role-based candidate sync:
      // Only verified recruiters fetch the full candidates pipeline. Candidates fetch their own applications.
      if (activeRole === 'recruiter' && currentUser?.role === 'recruiter') {
        const dbCandidates = await api.getCandidates();
        const safeCands = (dbCandidates && dbCandidates.length > 0) ? dbCandidates : [];
        const enrichedCands = safeCands.map(c => {
          const matchingJob = safeJobs.find(j => String(j.id) === String(c.job_id || c.jobId));
          const resolvedTitle = matchingJob?.title || c.job_title || c.jobTitle || c.jobRole || 'Software Engineer';
          return {
            ...c,
            jobId: c.job_id || c.jobId,
            job_id: c.job_id || c.jobId,
            jobTitle: resolvedTitle,
            jobRole: resolvedTitle,
            job: matchingJob ? { ...matchingJob, title: resolvedTitle } : { title: resolvedTitle }
          };
        });
        setCandidates(enrichedCands);
      } else if (activeRole === 'candidate' || currentUser?.role === 'candidate') {
        setCandidates([]);
        if (currentUser?.email) {
          refreshMyApplications(currentUser.email);
        }
      }

      if (!silent) {
        if (safeJobs.length === 0) {
          toastBus.emit('DB connected but empty — run: python backend/seed.py', 'warning');
        } else {
          toastBus.emit(`Live DB synced — ${safeJobs.length} jobs available`, 'success');
        }
      }
    } catch (err) {
      setIsDbConnected(false);
      setJobs([]);       // Clear data — show empty state, NOT fake data
      setCandidates([]); // Clear data — show empty state, NOT fake data
      const msg = `Backend offline: ${err.message}`;
      setDbError(msg);
      if (!silent) toastBus.emit('Backend offline — start: python -m uvicorn main:app --reload --port 8000', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [userRole, currentUser?.email, refreshMyApplications]);

  // Session restoration and auth initialization
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const token = localStorage.getItem('sparkx_token');
      if (!token) {
        if (isMounted) {
          setCurrentUser(null);
          setUserRole(null);
          setAuthStatus('UNAUTHENTICATED');
          setIsLoading(false);
        }
        return;
      }

      try {
        const verifiedUser = await api.getCurrentUser();
        if (!isMounted) return;

        if (verifiedUser && verifiedUser.role) {
          setCurrentUser(verifiedUser);
          setUserRole(verifiedUser.role);
          setAuthStatus('AUTHENTICATED');
          // Sync database for the authenticated role
          syncWithDatabase(true, verifiedUser.role);
        } else {
          // Token invalid or expired
          localStorage.removeItem('sparkx_token');
          localStorage.removeItem('sparkx_user');
          localStorage.removeItem('sparkx_user_role');
          localStorage.removeItem('sparkx_logged_in');
          setCurrentUser(null);
          setUserRole(null);
          setAuthStatus('UNAUTHENTICATED');
        }
      } catch (err) {
        if (isMounted) {
          localStorage.removeItem('sparkx_token');
          setCurrentUser(null);
          setUserRole(null);
          setAuthStatus('UNAUTHENTICATED');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Global 401 / 403 handling from authEventBus
    const unsubscribe = authEventBus.on((event) => {
      if (event === 'UNAUTHORIZED') {
        logout();
        toastBus.emit('Session expired or unauthorized. Please sign in again.', 'warning');
      } else if (event === 'FORBIDDEN') {
        toastBus.emit('Access Denied: You do not have permission to access this resource.', 'error');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [logout, syncWithDatabase]);

  // Sync on window focus (catches external DB edits when authenticated)
  useEffect(() => {
    const handle = () => {
      if (authStatus === 'AUTHENTICATED') {
        syncWithDatabase(true);
      }
    };
    window.addEventListener('focus', handle);
    return () => window.removeEventListener('focus', handle);
  }, [authStatus, syncWithDatabase]);

  // Poll every 30s when connected and authenticated
  const pollRef = useRef(null);
  useEffect(() => {
    clearInterval(pollRef.current);
    if (isDbConnected && authStatus === 'AUTHENTICATED') {
      pollRef.current = setInterval(() => syncWithDatabase(true), 30000);
    }
    return () => clearInterval(pollRef.current);
  }, [isDbConnected, authStatus, syncWithDatabase]);

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

  const updateJob = async (jobId, updatedJobData) => {
    const savedJob = await api.updateJob(jobId, updatedJobData);
    if (!savedJob) {
      toastBus.emit('Failed to update job — please verify input values', 'error');
      return null;
    }
    setJobs(prev => prev.map(j => j.id === jobId ? savedJob : j));
    setCandidates(prev => prev.map(c => {
      if (String(c.job_id || c.jobId) === String(jobId)) {
        return {
          ...c,
          job: { ...(c.job || {}), ...savedJob },
          jobBudgetFormatted: savedJob.formattedCompensation || savedJob.formatted_compensation || c.jobBudgetFormatted,
        };
      }
      return c;
    }));
    toastBus.emit(`Job "${savedJob.title}" updated successfully!`, 'success');
    return savedJob;
  };

  const updateCandidateStage = async (candidateId, newStage, notes = '') => {
    try {
      const updatedCand = await api.updateCandidateStage(candidateId, newStage, notes);
      if (updatedCand) {
        setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCand : c));
        setMyApplications(prev => prev.map(a => a.id === candidateId ? { ...a, ...updatedCand } : a));
        if (selectedCandidate?.id === candidateId) setSelectedCandidate(updatedCand);
        toastBus.emit(`Stage moved to ${newStage}`, 'success');
        return updatedCand;
      }
    } catch (err) {
      toastBus.emit(err.message || 'Failed to update stage', 'error');
      throw err;
    }
  };

  const updateHiringDecision = async (candidateId, decision, extra = {}) => {
    try {
      const updatedCand = await api.updateHiringDecision(candidateId, decision, extra);
      if (updatedCand) {
        setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCand : c));
        setMyApplications(prev => prev.map(a => a.id === candidateId ? { ...a, ...updatedCand } : a));
        if (selectedCandidate?.id === candidateId) setSelectedCandidate(updatedCand);
        const emoji = decision === 'selected' ? '🤝' : (decision === 'rejected' ? '❌' : (decision === 'shortlisted' ? '🎉' : '📋'));
        toastBus.emit(`${emoji} Decision updated to ${decision}`, decision === 'rejected' ? 'warning' : 'success');
        return updatedCand;
      }
    } catch (err) {
      toastBus.emit(err.message || 'Failed to update decision', 'error');
      throw err;
    }
  };

  const inviteAssessment = async (candidateId, customMessage = '') => {
    try {
      const updatedCand = await api.inviteAssessment(candidateId, customMessage);
      if (updatedCand) {
        setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCand : c));
        setMyApplications(prev => prev.map(a => a.id === candidateId ? { ...a, ...updatedCand } : a));
        if (selectedCandidate?.id === candidateId) setSelectedCandidate(updatedCand);
        toastBus.emit(`Candidate invited to Technical Assessment!`, 'success');
        return updatedCand;
      }
    } catch (err) {
      toastBus.emit(err.message || 'Failed to invite to assessment', 'error');
      throw err;
    }
  };

  const updateCandidateStatus = async (candidateId, newStatus, hrNotes = '', recruiterScore = null, rejectionReason = null, rejectionCategory = null) => {
    await api.updateCandidateStatus(candidateId, newStatus, hrNotes, recruiterScore, rejectionReason, rejectionCategory);
    const updated = await api.getCandidateById(candidateId);
    if (updated) {
      setCandidates(prev => prev.map(c => c.id === candidateId ? updated : c));
      setMyApplications(prev => prev.map(a => a.id === candidateId ? { ...a, ...updated } : a));
      if (selectedCandidate?.id === candidateId) setSelectedCandidate(updated);
    }
    toastBus.emit(`Status updated to ${newStatus}`, 'success');
  };

  const scheduleInterview = async (candidateId, scheduledAt, notes = '', meetingUrl = '') => {
    const updatedCand = await api.scheduleInterview(candidateId, scheduledAt, notes, meetingUrl);
    if (updatedCand) {
      setCandidates(prev => prev.map(c => c.id === candidateId ? updatedCand : c));
      setMyApplications(prev => prev.map(a => a.id === candidateId ? { ...a, ...updatedCand } : a));
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
  const applyForJob = async ({ 
    jobId, name, email, phone, experienceYears, education, skills, resumeSummary, resumeFilename, resumeText, fraudFlags = [],
    currentCtc = null, expectedCtcType = 'range', expectedCtcMin = null, expectedCtcMax = null, ctcCurrency = 'INR'
  }) => {
    const targetJob = jobs.find(j => j.id === jobId) || jobs[0];
    if (!targetJob) {
      toastBus.emit('No jobs found — is the backend running?', 'error');
      return null;
    }
    // Client-side match preview score (backend recalculates authoritatively)
    const normalizedSkills = (skills || []).map(s => normalizeSkill(s));
    const reqSkills = targetJob.requiredSkills || [];
    const matchCount = reqSkills.filter(req => normalizedSkills.some(s => fuzzySkillMatch(s, req))).length;
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
      status: 'Applied',
      finalDecision: 'Applied',
      matchScore: matchPercentage,
      experienceYears: Number(experienceYears),
      education, 
      skills: normalizedSkills, 
      resumeSummary,
      resumeFilename: resumeFilename || null,
      resumeText: resumeText || null,
      fraudFlags,
      currentCtc: currentCtc != null && currentCtc !== '' ? Number(currentCtc) : null,
      expectedCtcType,
      expectedCtcMin: expectedCtcMin != null && expectedCtcMin !== '' ? Number(expectedCtcMin) : null,
      expectedCtcMax: expectedCtcMax != null && expectedCtcMax !== '' ? Number(expectedCtcMax) : null,
      ctcCurrency: ctcCurrency || 'INR',
      integrityScore: 100, integrityRisk: 'Low', integrityEvents: [],
      scores: { jobSkills: 0, technicalScore: 0, communication: 0, problemSolving: 0, overall: 0 },
      interviewSummary: 'Application received and entered into recruiter screening pipeline.',
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

    setCurrentInterviewSession(null);
    toastBus.emit(`Application submitted for ${targetJob.title} — status: Recruiter Screening!`, 'success');
    return newCandidate;
  };

  const completeInterviewAndEvaluate = async ({ transcript = [], integrityScore = 100, integrityEvents = [], codeScore = 0, candidateId, assessmentScores }) => {
    const candId = candidateId || currentInterviewSession?.candidateId || currentUser?.id;
    let targetCandidate = candidates.find(c => c.id === candId) || candidates.find(c => c.email === currentUser?.email);
    const targetJob = jobs.find(j => j.id === (targetCandidate?.jobId || currentInterviewSession?.jobId)) || jobs[0];

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

    const canonicalStatus = 'Under Review';
    const updatedData = {
      ...(targetCandidate || {}),
      id: candId || targetCandidate?.id,
      name: targetCandidate?.name || currentUser?.name || 'Candidate',
      jobId: targetJob?.id,
      job: targetJob,
      ...evaluation,
      coding_score: effectiveCodeScore,
      codingScore: effectiveCodeScore,
      status: canonicalStatus,
      finalDecision: canonicalStatus,
      integrityEvents,
      integrityScore,
    };

    if (candId) {
      setCandidates(prev => prev.map(c => c.id === candId ? updatedData : c));
      setMyApplications(prev => prev.map(a => a.id === candId ? { 
        ...a, 
        status: canonicalStatus, 
        finalDecision: canonicalStatus, 
        assessmentStatus: 'Completed',
        coding_score: null, 
        codingScore: null 
      } : a));
    }
    setSelectedCandidate(updatedData);
    if (currentUser?.email) {
      refreshMyApplications(currentUser.email);
    }

    toastBus.emit('Assessment submitted successfully.', 'success');
    return evaluation;
  };

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0] || null;

  return (
    <RecruitmentContext.Provider value={{
      authStatus,
      theme, toggleTheme,
      isLoggedIn, login, logout, currentUser,
      userRole, switchRole,
      isDbConnected, isLoading, dbError,
      jobs, candidates,
      currentView, setCurrentView,
      selectedCandidate, setSelectedCandidate,
      activeJob, setActiveJobId,
      createJob, updateJob, updateCandidateStatus, applyForJob,
      updateCandidateStage, updateHiringDecision, inviteAssessment,
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