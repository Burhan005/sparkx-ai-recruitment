import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { evaluateAnswerAndAdapt } from '../../services/aiRecruiterService';
import { ProctorMonitor } from '../../services/proctorService';
import { api } from '../../services/api';
import { normalizeSkill } from '../../utils/skillMatcher';
import { normalizeWorkflow } from '../../utils/workflowContract';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Play,
  Lightbulb,
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  ArrowRight, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Bot, 
  Zap, 
  Eye, 
  Activity,
  Clock,
  Calendar
} from 'lucide-react';
import AIOrb from './AIOrb';

export default function AIInterviewRoom() {
  const navigate = useNavigate();
  const { candidateId: routeCandidateId } = useParams();
  const { 
    activeJob, 
    currentInterviewSession, 
    setCurrentInterviewSession, 
    completeInterviewAndEvaluate,
    candidates,
    currentUser,
    userRole,
    myApplications = []
  } = useRecruitment();

  // Find candidate in database to check interview scheduling status
  const activeCandidate = (routeCandidateId && candidates.find(c => String(c.id) === String(routeCandidateId))) ||
    candidates.find(c => 
      c.id === currentInterviewSession?.candidateId || 
      (currentUser && c.email?.toLowerCase() === currentUser.email?.toLowerCase())
    ) || null;

  const activeApp = (routeCandidateId && myApplications?.find(a => String(a.id) === String(routeCandidateId))) ||
    myApplications?.find(a => 
      a.jobId === activeJob?.id || (currentUser && a.email?.toLowerCase() === currentUser.email?.toLowerCase())
    ) || (myApplications?.length > 0 ? myApplications[0] : null);

  const isRecruiterTesting = userRole === 'recruiter';

  const candidateId = routeCandidateId ||
    currentInterviewSession?.candidateId || 
    activeCandidate?.id ||
    activeApp?.id ||
    candidates.find(c => c.email === currentUser?.email)?.id || 
    (isRecruiterTesting ? 'demo-recruiter-preview' : currentUser?.id) ||
    null;
  const candRecord = activeCandidate || activeApp || {};
  const wf = normalizeWorkflow(candRecord);
  const isScheduled = Boolean(
    isRecruiterTesting ||
    ['scheduled', 'in_progress', 'completed'].includes(wf.interviewStatus) ||
    Boolean(candRecord.interviewScheduledAt || candRecord.interview_scheduled_at) ||
    ['interview', 'review', 'completed'].includes(wf.stage)
  );
  const canEnterInterview = isRecruiterTesting || isScheduled;

  // Session lifecycle & audio preferences
  const [hasStarted, setHasStarted] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const proctorRef = useRef(null);
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  // States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isMicListening, setIsMicListening] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isFollowUpActive, setIsFollowUpActive] = useState(false);
  const [activeFollowUpPrompt, setActiveFollowUpPrompt] = useState('');

  // Proctoring telemetry
  const [faceStatus, setFaceStatus] = useState('VERIFIED');
  const faceStatusRef = useRef(faceStatus);
  useEffect(() => {
    faceStatusRef.current = faceStatus;
  }, [faceStatus]);

  const [integrityScore, setIntegrityScore] = useState(100);
  const [integrityEvents, setIntegrityEvents] = useState([]);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [tabFocused, setTabFocused] = useState(true);

  // Dynamic Candidate Questions
  const [customQuestions, setCustomQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Questions come from dynamic candidate-specific synthesis or fallback to active job
  const questions = customQuestions.length > 0 ? customQuestions : (activeJob?.questions || []);
  const currentQ = questions[currentQuestionIdx] || null;

  // Transcript
  const [transcript, setTranscript] = useState([
    {
      id: 'init-0',
      speaker: 'ai',
      text: `Hello ${currentInterviewSession?.candidateName || activeCandidate?.name || 'Candidate'}! Welcome to your SparkX AI interview${activeJob ? ` for the ${activeJob.title} position` : ''}. I will ask you role-specific questions and may ask adaptive follow-ups based on your depth. Let's begin!`,
      timestamp: '00:00'
    }
  ]);


  // 0. Dynamic Question Synthesis for Candidate
  useEffect(() => {
    if (!canEnterInterview || !activeJob) return;

    let isMounted = true;
    async function loadCandidateSpecificQuestions() {
      setLoadingQuestions(true);
      try {
        const candidateId = activeCandidate?.id || currentInterviewSession?.candidateId || currentUser?.id || 'candidate-default';
        const candidateName = activeCandidate?.name || currentInterviewSession?.candidateName || currentUser?.name || 'Candidate';
        // Normalize skills before sending to API — prevents typos like "docket" appearing in interview questions
        const rawSkills = activeCandidate?.skills || ['Distributed Systems', 'Backend Architecture'];
        const candidateSkills = rawSkills.map(s => { try { return normalizeSkill(s); } catch { return s; } });
        const experienceYears = activeCandidate?.experienceYears || 3;

        const res = await api.generateCandidateQuestions({
          jobId: activeJob.id,
          candidateId,
          candidateName,
          candidateSkills,
          experienceYears
        });

        const questionsList = Array.isArray(res) ? res : (res?.questions || []);
        if (isMounted && questionsList.length > 0) {
          setCustomQuestions(questionsList);
          setTranscript(prev => {
            if (prev.length === 1 && prev[0].id === 'init-0') {
              return [{
                id: 'init-0',
                speaker: 'ai',
                text: `Hello ${candidateName}! Welcome to your technical interview for the ${activeJob.title} position. We will walk through technical scenarios and discuss your hands-on production experience. Whenever you are ready, let's begin!`,
                timestamp: '00:00'
              }];
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Personalized question synthesis fallback to standard job set:', err);
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    }

    loadCandidateSpecificQuestions();
    return () => { isMounted = false; };
  }, [canEnterInterview, activeJob?.id, activeCandidate?.id]);

  // 0. Safety: Immediately silence and cancel all speech synthesis if access is restricted, session has not started, or voice is muted
  useEffect(() => {
    if (!canEnterInterview || !hasStarted || isVoiceMuted) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsAISpeaking(false);
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [canEnterInterview, hasStarted, isVoiceMuted]);

  // 1. Initialize Proctoring (Only when access is granted AND user has started session)
  useEffect(() => {
    if (!canEnterInterview || !hasStarted) return;

    proctorRef.current = new ProctorMonitor({
      onEvent: (ev, score, risk) => {
        setIntegrityEvents(prev => [ev, ...prev]);
        setIntegrityScore(score);
        setRiskLevel(risk);
      },
      onStatusChange: (status) => {
        if (status.tabActive !== undefined) setTabFocused(status.tabActive);
      }
    });

    proctorRef.current.start();

    return () => {
      if (proctorRef.current) proctorRef.current.stop();
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [canEnterInterview, hasStarted]);

  // 2. Initialize Camera & Canvas Tracking (Only when access is granted AND user has started session)
  useEffect(() => {
    if (!canEnterInterview || !hasStarted) return;

    let isMounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera access unavailable, falling back to simulated stream:', err.message);
        setCameraError('Live camera not connected or permission denied. Using simulated proctor canvas.');
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [canEnterInterview, hasStarted]);

  // 3. Speech Synthesis (AI Speaks) - Strictly guarded against restricted, unstarted, or muted states
  const speakAI = (text) => {
    if (!canEnterInterview || !hasStarted || isVoiceMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Pick female or male clean voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      if (!canEnterInterview || !hasStarted || isVoiceMuted) {
        window.speechSynthesis.cancel();
        setIsAISpeaking(false);
        return;
      }
      setIsAISpeaking(true);
    };
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speak question on load or index advance only when session is actively started and unmuted
  useEffect(() => {
    if (!canEnterInterview || !hasStarted || isVoiceMuted) return;
    if (currentQ?.prompt && !loadingQuestions) {
      const timer = setTimeout(() => {
        speakAI(currentQ.prompt);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [canEnterInterview, hasStarted, isVoiceMuted, currentQuestionIdx, currentQ?.prompt, loadingQuestions]);

  // 4. Speech Recognition Toggle (Candidate speaks)
  const toggleSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Web Speech Recognition API is not supported in this browser. Please type your response in the box.");
      return;
    }

    if (isMicListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsMicListening(false);
    } else {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsMicListening(true);
        recognition.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            setCandidateAnswer(prev => prev + ' ' + finalTranscript.trim());
          }
        };
        recognition.onerror = (e) => {
          console.warn('Speech recognition error:', e);
          setIsMicListening(false);
        };
        recognition.onend = () => setIsMicListening(false);

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('Speech recognition failed to start:', e);
      }
    }
  };

  // 5. Submit Candidate Answer
  const handleAnswerSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!candidateAnswer.trim()) return;

    const answerText = candidateAnswer;
    const currentTimestamp = proctorRef.current ? proctorRef.current.getFormattedTimestamp() : '01:30';
    const activePromptText = isFollowUpActive ? activeFollowUpPrompt : (currentQ?.prompt || 'Interview Question');

    // Add candidate answer to transcript
    const updatedTranscript = [
      ...transcript,
      {
        id: `cand-${Date.now()}`,
        speaker: 'candidate',
        text: answerText,
        timestamp: currentTimestamp,
        relatedQuestion: activePromptText
      }
    ];

    setTranscript(updatedTranscript);
    setCandidateAnswer('');

    // If currently answering a follow-up, advance to next question
    if (isFollowUpActive) {
      setIsFollowUpActive(false);
      setActiveFollowUpPrompt('');
      
      if (currentQuestionIdx < questions.length - 1) {
        const nextIdx = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextIdx);
        const nextQ = questions[nextIdx];
        
        const nextAIMessage = {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          text: `Thank you. Let's move to Question ${nextIdx + 1}: ${nextQ.prompt}`,
          timestamp: currentTimestamp
        };
        setTranscript([...updatedTranscript, nextAIMessage]);
        speakAI(nextQ.prompt);
      } else {
        finishInterview(updatedTranscript);
      }
      return;
    }

    // Call FastAPI backend for Real-time NLP Analysis & Adaptive Probing
    const adaptResult = await api.evaluateAdaptiveAnswer(
      currentQ?.prompt || '',
      answerText,
      currentQ?.idealKeywords || [],
      currentQ?.followUpVague || null,
      currentQ?.followUpExpert || null
    ) || evaluateAnswerAndAdapt(currentQ, answerText);

    const needsFollowUp = adaptResult.needs_follow_up ?? adaptResult.needsFollowUp;
    const followUpQuestion = adaptResult.follow_up_question ?? adaptResult.followUpQuestion;
    const feedbackText = adaptResult.feedback || adaptResult.quality || '';

    if (needsFollowUp && followUpQuestion) {
      // Trigger Adaptive Follow-Up
      setIsFollowUpActive(true);
      setActiveFollowUpPrompt(followUpQuestion);

      const aiFollowUpMessage = {
        id: `ai-followup-${Date.now()}`,
        speaker: 'ai',
        isAdaptive: true,
        text: followUpQuestion,
        timestamp: currentTimestamp
      };

      setTranscript([...updatedTranscript, aiFollowUpMessage]);
      speakAI(followUpQuestion);
    } else {
      // Progress directly to next question
      if (currentQuestionIdx < questions.length - 1) {
        const nextIdx = currentQuestionIdx + 1;
        setCurrentQuestionIdx(nextIdx);
        const nextQ = questions[nextIdx];

        const nextAIMessage = {
          id: `ai-${Date.now()}`,
          speaker: 'ai',
          text: `Great insights. Next, Question ${nextIdx + 1}: ${nextQ.prompt}`,
          timestamp: currentTimestamp
        };

        setTranscript([...updatedTranscript, nextAIMessage]);
        speakAI(nextQ.prompt);
      } else {
        finishInterview(updatedTranscript);
      }
    }
  };

  const finishInterview = async (finalTranscript) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAISpeaking(false);

    const finalEvents = proctorRef.current ? proctorRef.current.events : integrityEvents;
    const finalScore = proctorRef.current ? proctorRef.current.integrityScore : integrityScore;

    setCurrentInterviewSession(prev => ({
      ...prev,
      transcript: finalTranscript,
      integrityScore: finalScore,
      integrityEvents: finalEvents,
      integrityRisk: riskLevel
    }));

    await completeInterviewAndEvaluate({
      transcript: finalTranscript,
      integrityScore: finalScore,
      integrityEvents: finalEvents,
      candidateId: activeCandidate?.id || currentInterviewSession?.candidateId,
      codeScore: currentInterviewSession?.codeScore ?? (activeCandidate?.coding_score || 0)
    });

    if (candidateId) {
      navigate(`/skill-gap/${candidateId}`);
    } else {
      navigate('/skill-gap');
    }
  };

  // Demo cheat triggers for presentation
  const triggerCheatEvent = (type) => {
    if (!proctorRef.current) return;
    if (type === 'TAB_SWITCH') {
      proctorRef.current.logEvent('TAB_SWITCH', 'Candidate switched tabs to external search engine.', 'high');
    } else if (type === 'MULTIPLE_FACES') {
      setFaceStatus('MULTIPLE_FACES');
      proctorRef.current.logEvent('MULTIPLE_FACES', 'Secondary person detected in candidate background.', 'high');
      setTimeout(() => setFaceStatus('VERIFIED'), 4000);
    } else if (type === 'NO_FACE') {
      setFaceStatus('NO_FACE');
      proctorRef.current.logEvent('FACE_LOST', 'Candidate face completely left the camera frame.', 'medium');
      setTimeout(() => setFaceStatus('VERIFIED'), 4000);
    }
  };

  if (!canEnterInterview) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Clock className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            {activeCandidate ? 'Stage: 📋 Recruiter Screening' : 'No Active Application'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Interview Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            {activeCandidate ? (
              <>
                Hi <strong>{activeCandidate.name}</strong>, your application for <strong>{activeJob?.title || 'the position'}</strong> has been received and is currently in the <strong>Screening</strong> stage with the hiring team.
              </>
            ) : (
              <>
                You have not submitted an application for this role yet. Please browse open roles and submit your profile first.
              </>
            )}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Per company recruitment protocol, candidates cannot enter the AI Interview Room until the recruiter reviews the application and schedules an official interview slot.
          </p>
        </div>

        {activeCandidate && (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/[0.08] text-left space-y-2.5 text-xs shadow-md">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.06] pb-2">
              <span className="font-semibold">Candidate Status</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                Stage 1: Screening
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Applicant Name:</span>
              <span className="font-bold text-slate-900 dark:text-white">{activeCandidate.name}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Applied Role:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeJob?.title || 'Applied Position'}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Application Status:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{activeCandidate.status || activeCandidate.finalDecision || 'Under Review'}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Interview Status:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                <span>⏳ Awaiting Recruiter Scheduling</span>
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/my-applications')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
          >
            <span>View My Applications</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
          >
            Browse Job Catalog
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERSTITIAL SCREEN: AI INTERVIEW BRIEFING & START SESSION BUTTON
  // ─────────────────────────────────────────────────────────────────────────
  if (!hasStarted) {
    const candidateName = activeCandidate?.name || activeApp?.candidateName || currentUser?.name || 'Candidate';
    const jobTitle = activeJob?.title || 'Applied Position';
    const scheduledSlot = activeCandidate?.interviewScheduledAt || activeApp?.interviewScheduledAt || 'Confirmed by Recruiter';

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
        {/* Hero Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 shadow-card relative overflow-hidden space-y-4">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Interview Session Authorized</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{activeJob?.companyName || 'SparkX Technologies'}</span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500">{activeJob?.department || 'Engineering'}</span>
            </div>

            {userRole === 'recruiter' && (
              <div className="p-3 px-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-bold uppercase bg-indigo-600 text-white text-[10px]">
                    Recruiter Preview Mode
                  </span>
                  <span>Interactive simulation for "{jobTitle}". Audio and responses in this mode are strictly simulated.</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/recruiter/interview-studio')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 ml-3"
                >
                  ← Return to Studio
                </button>
              </div>
            )}

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {userRole === 'recruiter' ? 'AI Interview Simulation & Audio Test' : 'AI Technical & Conversational Interview'}
              </h1>
              {userRole === 'recruiter' ? (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                  <strong>Recruiter Calibration:</strong> Test conversational probing, microphone dictation, and the AI's question sequence for <strong>{jobTitle}</strong>.
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
                  Welcome, <strong>{candidateName}</strong>! Your application for <strong>{jobTitle}</strong> has been reviewed and approved for the live AI interview session.
                </p>
              )}
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-1.5 text-brand-500 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled Slot</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{scheduledSlot}</div>
                <div className="text-[10px] text-slate-400">Recruiter confirmed</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-1.5 text-purple-500 mb-1">
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interaction</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Voice & Text</div>
                <div className="text-[10px] text-slate-400">Adaptive AI probing</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-1.5 text-emerald-500 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integrity HUD</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Active Focus Lock</div>
                <div className="text-[10px] text-slate-400">Window & tab telemetry</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-1.5 text-amber-500 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Questions</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{questions.length} Questions</div>
                <div className="text-[10px] text-slate-400">Job-tailored</div>
              </div>
            </div>
          </div>
        </div>

        {/* Preparation Guidelines & Voice Preference */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-1.5 font-mono">
              <Bot className="w-4 h-4" />
              <span>How the AI Interview Works</span>
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="text-brand-500 font-bold">•</span>
                <span>The AI interviewer presents questions tailored specifically to your profile and the <strong>{jobTitle}</strong> role.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-brand-500 font-bold">•</span>
                <span>You can respond using <strong>voice dictation (Microphone)</strong> or by <strong>typing your answers</strong> directly.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-brand-500 font-bold">•</span>
                <span>The AI may initiate adaptive follow-up inquiries if your response requires deeper technical clarification.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 space-y-3 shadow-card flex flex-col justify-between">
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 font-mono">
                <Volume2 className="w-4 h-4 text-brand-500" />
                <span>Audio & Voice Readout Preferences</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Choose whether you would like the AI interviewer to read prompts aloud over your speakers or keep the session in quiet text-only mode.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {isVoiceMuted ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
                <span>{isVoiceMuted ? 'AI Voice: Muted' : 'AI Voice: Active'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceMuted(prev => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isVoiceMuted 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                    : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
                }`}
              >
                {isVoiceMuted ? 'Turn Sound On' : 'Mute Sound'}
              </button>
            </div>
          </div>
        </div>

        {/* Readiness Instructions & Start Action Footer */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-card">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Ready to Begin?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Clicking below will initialize your camera, start the proctoring monitor, and begin Question 1. You can pause or mute the AI voice at any time during the interview.
            </p>
          </div>

          <button
            onClick={() => {
              setHasStarted(true);
              if (candidateId) {
                api.startInterview(candidateId).catch(err => console.warn('startInterview error:', err));
              }
            }}
            className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-subtle transition flex items-center justify-center space-x-2.5 group shrink-0"
          >
            <Play className="w-4 h-4 fill-current transition group-hover:scale-105" />
            <span>Start AI Interview Session</span>
            <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Recruiter Confirmed Interview Banner */}
      {activeCandidate?.interviewScheduledAt && (
        <div className="p-3.5 px-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-cyan-800 dark:text-cyan-300 font-bold">Interview Confirmed by Recruiter</span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">Scheduled Slot: <strong className="text-slate-900 dark:text-white">{activeCandidate.interviewScheduledAt}</strong></p>
            </div>
          </div>
          {activeCandidate.interviewMeetingUrl && (
            <a
              href={activeCandidate.interviewMeetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition flex items-center space-x-1.5 shadow-sm self-start sm:self-auto"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Google Meet Room</span>
            </a>
          )}
        </div>
      )}

      {userRole === 'recruiter' && (
        <div className="p-3.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-indigo-950 dark:text-indigo-200 shadow-sm animate-fade-in-up">
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded font-mono font-bold uppercase bg-indigo-600 text-white text-[10px] shadow-sm">
              Recruiter Preview Mode
            </span>
            <span className="font-semibold">Simulating candidate AI interview session for "{activeJob?.title || 'Selected Role'}".</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/recruiter/interview-studio')}
            className="px-3 py-1 rounded-lg bg-white dark:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 text-xs font-bold transition flex items-center space-x-1 shrink-0"
          >
            <span>← Return to Studio</span>
          </button>
        </div>
      )}

      {/* Top Header Bar with Live Telemetry Badges */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E121E] flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">Live Technical Interview Session</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-brand-700 dark:text-brand-300 font-semibold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">
                {activeJob.title}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
              Conversational interview with speech transcription, audio synthesis & session verification
            </p>
          </div>
        </div>

        {/* Telemetry Status Badges */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
            tabFocused 
              ? 'bg-slate-50 dark:bg-[#080A10] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}>
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-xs">{tabFocused ? 'Focus: Active' : 'Focus: Away'}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 border transition-all ${
            riskLevel === 'High'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              : 'bg-slate-50 dark:bg-[#080A10] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-mono text-xs">Integrity: {integrityScore}/100</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Candidate Camera & Proctoring HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Webcam Box */}
          <div className="relative rounded-xl overflow-hidden bg-[#080A10] border border-slate-800 aspect-[4/3] flex items-center justify-center shadow-card">
            {/* Real video if available */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover transform scale-x-[-1] ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* Simulated Candidate Feed fallback if no webcam */}
            {!cameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-subtle">
                  <Video className="w-7 h-7" />
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  {cameraError ? cameraError : "Camera feed unavailable or permissions required"}
                </div>
                <span className="text-xs text-slate-500">
                  Voice input dictation and focus telemetry remain fully active
                </span>
              </div>
            )}

            {/* Top-left Telemetry badge */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-xs font-mono font-medium text-white border border-white/10 shadow-subtle">
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span>{cameraActive ? 'VIDEO CONNECTED' : 'AUDIO-ONLY'}</span>
            </div>

            {/* Top-right REC badge */}
            <div className="absolute top-3 right-3 flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm text-rose-400 text-[10px] font-mono font-semibold border border-rose-500/30 shadow-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>SESSION ACTIVE</span>
            </div>

            {/* Bottom watermark */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-400 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <span className="font-medium text-slate-300 truncate max-w-[180px]">Candidate: {currentInterviewSession?.candidateName || activeCandidate?.name || currentUser?.name || 'Candidate'}</span>
              <span className="font-mono text-slate-400 text-[10px]">{cameraActive ? '30 FPS • 720p' : 'Audio Stream'}</span>
            </div>
          </div>

          {/* Telemetry Simulator / Test Triggers (Recruiter Testing Mode Only) */}
          {isRecruiterTesting && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 space-y-3 shadow-card">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 font-mono">
                  <Zap className="w-3.5 h-3.5 text-brand-500" />
                  <span>Telemetry Simulator</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Recruiter Mode</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => triggerCheatEvent('TAB_SWITCH')}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition text-center"
                >
                  Alt-Tab Switch
                </button>

                <button
                  type="button"
                  onClick={() => triggerCheatEvent('MULTIPLE_FACES')}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition text-center"
                >
                  Multiple Faces
                </button>

                <button
                  type="button"
                  onClick={() => triggerCheatEvent('NO_FACE')}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition text-center"
                >
                  Face Displaced
                </button>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: AI Interviewer, Audio Waves, Adaptive Dialogue & Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* AI Interviewer Avatar & Live Question Banner */}
          <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-card">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AIOrb 
                  mode={isAISpeaking ? 'speaking' : isMicListening ? 'listening' : loadingQuestions ? 'processing' : 'idle'} 
                  size={44} 
                  className="shrink-0"
                />

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">SparkX AI Interviewer</span>
                    {isFollowUpActive && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-mono">
                        Adaptive Follow-Up
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                    <span>•</span>
                    <span className="text-brand-600 dark:text-brand-400 font-medium">{currentQ?.type || 'Technical Scenario'}</span>
                  </div>
                </div>
              </div>

              {/* Audio Equalizer Waves & Voice Mute Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceMuted(prev => {
                      const next = !prev;
                      if (next && typeof window !== 'undefined' && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                        setIsAISpeaking(false);
                      }
                      return next;
                    });
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                    isVoiceMuted
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                      : 'bg-slate-50 dark:bg-[#080A10] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                  title={isVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
                >
                  {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isVoiceMuted ? 'Muted' : 'Voice On'}</span>
                </button>

                <div className="flex items-center space-x-2 h-8 px-3 rounded-lg bg-slate-50 dark:bg-[#0E1017] border border-[#E8E8E4] dark:border-[#222634]">
                  {isAISpeaking ? (
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 font-mono">Speaking</span>
                    </div>
                  ) : isMicListening ? (
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 font-mono">Listening</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isVoiceMuted ? 'Muted' : 'Ready'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Current Active Question Display */}
            <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono">
                  {isFollowUpActive ? "Technical Follow-Up" : `Question ${currentQuestionIdx + 1}`}
                </span>
                {loadingQuestions && (
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono animate-pulse">
                    Preparing technical question...
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5 leading-relaxed">
                {isFollowUpActive ? activeFollowUpPrompt : (currentQ?.prompt || (loadingQuestions ? 'Preparing question...' : 'Loading scenario...'))}
              </p>
            </div>

          </div>

          {/* Live Transcript Chat Feed */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 max-h-56 overflow-y-auto space-y-3 shadow-card">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">Speech-to-Text Stream</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">NLP Connected</span>
            </div>
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg text-xs space-y-1.5 ${
                  msg.speaker === 'ai'
                    ? msg.isAdaptive 
                      ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200' 
                      : 'bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                    : 'bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-slate-900 dark:text-slate-100 ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <span>{msg.speaker === 'ai' ? '🤖 SparkX AI' : '👤 You (Candidate)'}</span>
                    {msg.isAdaptive && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold">
                        ADAPTIVE
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-400">{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed text-xs">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Candidate Response Input & Presets */}
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 space-y-3 shadow-card">
            
            {/* Quick Demo Answers to Test Adaptive Engine with 1-click (Recruiter Preview Only) */}
            {isRecruiterTesting && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] font-mono">Recruiter Presets:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCandidateAnswer("I would use asynchronous FastAPI endpoints combined with streaming responses and an HNSW vector index in PostgreSQL for sub-50ms latency.")}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition font-medium text-[10px]"
                  >
                    ⚡ Strong Answer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateAnswer("We basically use caching and databases to make it fast.")}
                    className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition font-medium text-[10px]"
                  >
                    ❓ Vague Answer
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateAnswer("I don't know much about this yet, haven't encountered it in production.")}
                    className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition font-medium text-[10px]"
                  >
                    🤷 "I don't know"
                  </button>
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleAnswerSubmit} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-lg border transition flex items-center justify-center shrink-0 ${
                  isMicListening
                    ? 'bg-rose-600 text-white border-rose-500 shadow-subtle animate-pulse'
                    : 'bg-slate-50 dark:bg-[#080A10] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isMicListening ? "Click to Stop Mic" : "Click to Speak"}
              >
                {isMicListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isMicListening ? "Listening to your voice... Speak now!" : "Type or speak your answer..."}
                value={candidateAnswer}
                onChange={e => setCandidateAnswer(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition shadow-inner"
              />

              <button
                type="submit"
                disabled={!candidateAnswer.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 shadow-subtle shrink-0"
              >
                <span>Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Advance / Next stage */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Real-time NLP evaluates completeness and triggers deep queries.</span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsAISpeaking(false);
                  finishInterview(transcript);
                }}
                className="text-brand-600 dark:text-brand-400 hover:underline font-semibold flex items-center space-x-1 transition"
              >
                <span>Proceed to Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
