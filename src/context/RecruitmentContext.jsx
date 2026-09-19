import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_JOBS, INITIAL_CANDIDATES } from '../data/mockData';
import { generateCandidateEvaluation } from '../services/aiRecruiterService';

const RecruitmentContext = createContext();

export function RecruitmentProvider({ children }) {
  const [jobs, setJobs] = useState(() => {
    const saved = localStorage.getItem('sparkx_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [candidates, setCandidates] = useState(() => {
    const saved = localStorage.getItem('sparkx_candidates');
    return saved ? JSON.parse(saved) : INITIAL_CANDIDATES;
  });

  const [currentView, setCurrentView] = useState('recruiter'); // 'recruiter' | 'candidate' | 'interview' | 'assessment' | 'feedback' | 'proctor'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeJobId, setActiveJobId] = useState(INITIAL_JOBS[0].id);

  // Active Live Interview Session
  const [currentInterviewSession, setCurrentInterviewSession] = useState({
    candidateId: null,
    candidateName: "You (Live Candidate)",
    jobId: INITIAL_JOBS[0].id,
    transcript: [],
    integrityScore: 100,
    integrityRisk: "Low",
    integrityEvents: [],
    codeScore: 90
  });

  useEffect(() => {
    localStorage.setItem('sparkx_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('sparkx_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Recruiter actions
  const createJob = (newJobData) => {
    const newJob = {
      ...newJobData,
      id: `job-${Date.now()}`,
      status: 'Active',
      applicantsCount: 0
    };
    setJobs(prev => [newJob, ...prev]);
    return newJob;
  };

  const updateCandidateStatus = (candidateId, newStatus, hrNotes = "") => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          status: newStatus === 'Rejected' ? 'Rejected' : 'Evaluated',
          finalDecision: newStatus,
          hrNotes: hrNotes || c.hrNotes
        };
      }
      return c;
    }));

    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(prev => ({
        ...prev,
        status: newStatus === 'Rejected' ? 'Rejected' : 'Evaluated',
        finalDecision: newStatus,
        hrNotes: hrNotes || prev.hrNotes
      }));
    }
  };

  // Candidate application
  const applyForJob = ({ jobId, name, email, phone, experienceYears, education, skills, resumeSummary, fraudFlags = [] }) => {
    const targetJob = jobs.find(j => j.id === jobId) || jobs[0];
    
    // Calculate initial match score based on skills overlap & experience
    const requiredSkills = targetJob.requiredSkills || [];
    const lowerSkills = skills.map(s => s.toLowerCase());
    let matchCount = 0;
    requiredSkills.forEach(req => {
      if (lowerSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
        matchCount++;
      }
    });

    let matchPercentage = Math.round((matchCount / Math.max(1, requiredSkills.length)) * 70);
    if (Number(experienceYears) >= (targetJob.minExperienceYears || 2)) {
      matchPercentage += 25;
    } else {
      matchPercentage += 10;
    }
    matchPercentage = Math.min(99, Math.max(35, matchPercentage));

    const newCandidate = {
      id: `cand-${Date.now()}`,
      jobId: targetJob.id,
      name,
      email,
      phone: phone || "+91 98000 00000",
      appliedDate: new Date().toISOString().split('T')[0],
      status: 'Screening',
      matchScore: matchPercentage,
      experienceYears: Number(experienceYears),
      education,
      skills,
      resumeSummary,
      fraudFlags,
      integrityScore: 100,
      integrityRisk: "Low",
      integrityEvents: [],
      scores: {
        jobSkills: 0,
        technicalScore: 0,
        communication: 0,
        problemSolving: 0,
        overall: 0
      },
      interviewSummary: "Screening completed. Ready for Live AI Interview & Assessment.",
      evidenceSnippets: [],
      skillGaps: null,
      hrNotes: "",
      finalDecision: "Pending Interview"
    };

    setCandidates(prev => [newCandidate, ...prev]);
    setJobs(prev => prev.map(j => j.id === targetJob.id ? { ...j, applicantsCount: (j.applicantsCount || 0) + 1 } : j));

    // Set current active session for candidate to interview
    setCurrentInterviewSession({
      candidateId: newCandidate.id,
      candidateName: newCandidate.name,
      jobId: targetJob.id,
      transcript: [],
      integrityScore: 100,
      integrityRisk: "Low",
      integrityEvents: [],
      codeScore: 85
    });

    return newCandidate;
  };

  // Complete interview session and evaluate
  const completeInterviewAndEvaluate = ({ transcript, integrityScore, integrityEvents, codeScore }) => {
    const candId = currentInterviewSession.candidateId;
    const targetCandidate = candidates.find(c => c.id === candId);
    const targetJob = jobs.find(j => j.id === (targetCandidate?.jobId || currentInterviewSession.jobId)) || jobs[0];

    const evaluation = generateCandidateEvaluation({
      job: targetJob,
      candidateName: targetCandidate ? targetCandidate.name : currentInterviewSession.candidateName,
      resumeSkills: targetCandidate ? targetCandidate.skills : ["React", "JavaScript", "Python"],
      transcript,
      integrityScore,
      integrityEvents,
      codeScore
    });

    const updatedData = {
      ...evaluation,
      status: 'Evaluated',
      integrityEvents,
      integrityScore,
      finalDecision: evaluation.scores.overall >= 80 && evaluation.integrityRisk === 'Low' ? 'Recommended for Shortlist' : 'Review Required'
    };

    if (candId) {
      setCandidates(prev => prev.map(c => c.id === candId ? { ...c, ...updatedData } : c));
      const fullCand = { ...targetCandidate, ...updatedData };
      setSelectedCandidate(fullCand);
    }

    return evaluation;
  };

  const activeJob = jobs.find(j => j.id === activeJobId) || jobs[0];

  return (
    <RecruitmentContext.Provider
      value={{
        jobs,
        candidates,
        currentView,
        setCurrentView,
        selectedCandidate,
        setSelectedCandidate,
        activeJob,
        setActiveJobId,
        createJob,
        updateCandidateStatus,
        applyForJob,
        currentInterviewSession,
        setCurrentInterviewSession,
        completeInterviewAndEvaluate
      }}
    >
      {children}
    </RecruitmentContext.Provider>
  );
}

export const useRecruitment = () => useContext(RecruitmentContext);
