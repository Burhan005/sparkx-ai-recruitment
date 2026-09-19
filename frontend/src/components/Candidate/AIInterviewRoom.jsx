import React, { useState, useEffect, useRef } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { evaluateAnswerAndAdapt } from '../../services/aiRecruiterService';
import { ProctorMonitor } from '../../services/proctorService';
import { api } from '../../services/api';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
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

export default function AIInterviewRoom() {
  const { 
    activeJob, 
    currentInterviewSession, 
    setCurrentInterviewSession, 
    setCurrentView,
    candidates,
    currentUser,
    userRole
  } = useRecruitment();

  // Find candidate in database to check interview scheduling status
  const activeCandidate = candidates.find(c => 
    c.id === currentInterviewSession?.candidateId || 
    (currentUser && c.email?.toLowerCase() === currentUser.email?.toLowerCase())
  ) || null;

  // Gatekeeper:
  // 1. Recruiter in test mode is allowed
  // 2. Candidate is allowed ONLY if recruiter scheduled an interview or status is 'Interview Scheduled'
  const isRecruiterTesting = userRole === 'recruiter';
  const isInterviewScheduled = Boolean(activeCandidate && (
    activeCandidate.status === 'Interview Scheduled' || 
    Boolean(activeCandidate.interviewScheduledAt) ||
    activeCandidate.status === 'Evaluated'
  ));
  const canEnterInterview = isRecruiterTesting || isInterviewScheduled;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const proctorRef = useRef(null);
  const recognitionRef = useRef(null);

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
        const candidateSkills = activeCandidate?.skills || ['Distributed Systems', 'Backend Architecture'];
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
              const skillsStr = Array.isArray(candidateSkills) ? candidateSkills.slice(0, 3).join(', ') : 'modern engineering';
              return [{
                id: 'init-0',
                speaker: 'ai',
                text: `Hello ${candidateName}! Welcome to your SparkX AI technical interview for the ${activeJob.title} position. I have analyzed your background in ${skillsStr} and synthesized dynamic engineering scenarios tailored to your experience. Let's begin!`,
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

  // 1. Initialize Proctoring
  useEffect(() => {
    if (!canEnterInterview) return;

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
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [canEnterInterview]);

  // 2. Initialize Camera & Canvas Tracking
  useEffect(() => {
    if (!canEnterInterview) return;

    let streamInstance = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
          streamInstance = stream;
        }
      } catch (err) {
        console.warn('Camera access unavailable, falling back to simulated stream:', err.message);
        setCameraError('Live camera not connected or permission denied. Using simulated proctor canvas.');
        setCameraActive(false);
      }
    }

    startCamera();

    // Canvas face bounding box loop
    const interval = setInterval(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        ctx.clearRect(0, 0, width, height);

        // Draw HUD reticle / face box
        ctx.strokeStyle = faceStatus === 'VERIFIED' ? '#10B981' : faceStatus === 'MULTIPLE_FACES' ? '#F43F5E' : '#F59E0B';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        
        // Reticle box in center
        const boxW = 180;
        const boxH = 220;
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Corner brackets
        ctx.setLineDash([]);
        ctx.lineWidth = 3;
        const cornerLen = 16;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(boxX, boxY + cornerLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + cornerLen, boxY);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(boxX + boxW - cornerLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + cornerLen);
        ctx.stroke();

        // Target tag
        ctx.fillStyle = ctx.strokeStyle;
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(faceStatus === 'VERIFIED' ? '● FACE TRACKED (ID: 01)' : `⚠️ ${faceStatus}`, boxX, boxY - 8);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (streamInstance) {
        streamInstance.getTracks().forEach(t => t.stop());
      }
    };
  }, [faceStatus]);

  // 3. Speech Synthesis (AI Speaks)
  const speakAI = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Pick female or male clean voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsAISpeaking(true);
    utterance.onend = () => setIsAISpeaking(false);
    utterance.onerror = () => setIsAISpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speak question on load or index advance
  useEffect(() => {
    if (currentQ?.prompt && !loadingQuestions) {
      const timer = setTimeout(() => {
        speakAI(currentQ.prompt);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIdx, currentQ?.prompt, loadingQuestions]);

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
        text: `[Adaptive AI Probe — ${feedbackText}]: ${followUpQuestion}`,
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

  const finishInterview = (finalTranscript) => {
    const finalEvents = proctorRef.current ? proctorRef.current.events : integrityEvents;
    const finalScore = proctorRef.current ? proctorRef.current.integrityScore : integrityScore;

    setCurrentInterviewSession(prev => ({
      ...prev,
      transcript: finalTranscript,
      integrityScore: finalScore,
      integrityEvents: finalEvents,
      integrityRisk: riskLevel
    }));

    setCurrentView('assessment');
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
              <span>Resume Match:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{activeCandidate.matchScore}% Match</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Interview Status:</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                <span>⏳ Awaiting Recruiter Scheduling</span>
              </span>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => setCurrentView('candidate')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
          >
            <span>Return to Job Openings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* Recruiter Confirmed Interview Banner */}
      {activeCandidate?.interviewScheduledAt && (
        <div className="p-3.5 px-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-cyan-300 font-bold">Interview Confirmed by Recruiter</span>
              <p className="text-slate-400 text-[11px]">Scheduled Slot: <strong className="text-white">{activeCandidate.interviewScheduledAt}</strong></p>
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

      {/* Top Header Bar with Live Telemetry Badges */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.08] shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live AI Interview Session</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                {activeJob.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
              Autonomous conversational interviewer with real-time biometric proctoring & integrity verification
            </p>
          </div>
        </div>

        {/* Telemetry Status Badges */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
            tabFocused 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
          }`}>
            <Eye className="w-3.5 h-3.5" />
            <span>{tabFocused ? 'Window Focus: Locked' : 'Tab Switched!'}</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
            riskLevel === 'High'
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Integrity: {integrityScore}/100</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Candidate Camera & Proctoring HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Webcam Box */}
          <div className="relative rounded-3xl overflow-hidden bg-[#070A12] border border-white/[0.08] aspect-[4/3] flex items-center justify-center shadow-2xl">
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
                <div className="w-20 h-20 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
                  <Video className="w-8 h-8" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {cameraError ? cameraError : "Connecting biometric video stream..."}
                </div>
                <span className="text-[11px] text-slate-500">
                  Computer vision & gaze estimation simulator online
                </span>
              </div>
            )}

            {/* Canvas overlay for facial tracking bounding reticle */}
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Top-left HUD badge */}
            <div className="absolute top-3.5 left-3.5 flex items-center space-x-2 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-[11px] font-mono font-bold text-white border border-white/10 shadow-lg">
              <span className={`w-2 h-2 rounded-full ${faceStatus === 'VERIFIED' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500 animate-pulse'}`}></span>
              <span>{faceStatus === 'VERIFIED' ? '1 BIOMETRIC TARGET' : faceStatus}</span>
            </div>

            {/* Top-right REC badge */}
            <div className="absolute top-3.5 right-3.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-rose-950/80 text-rose-400 text-[10px] font-bold border border-rose-800/80 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>SECURE REC</span>
            </div>

            {/* Bottom watermark */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-slate-400 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="font-medium text-slate-300">Candidate: {currentInterviewSession.candidateName}</span>
              <span className="font-mono text-cyan-400 text-[10px]">FPS: 30 • 720p HD</span>
            </div>
          </div>

          {/* Telemetry Simulator / Test Triggers */}
          <div className="glass-card p-4 rounded-2xl border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center space-x-2 text-indigo-300">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Real-Time Telemetry Simulation</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Anti-Cheating HUD</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerCheatEvent('TAB_SWITCH')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/40 text-[11px] font-semibold text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 transition text-center shadow-sm"
              >
                Alt-Tab Switch
              </button>

              <button
                type="button"
                onClick={() => triggerCheatEvent('MULTIPLE_FACES')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-[11px] font-semibold text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/50 transition text-center shadow-sm"
              >
                Multiple Faces
              </button>

              <button
                type="button"
                onClick={() => triggerCheatEvent('NO_FACE')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-950/40 text-[11px] font-semibold text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 transition text-center shadow-sm"
              >
                Face Displaced
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI Interviewer, Audio Waves, Adaptive Dialogue & Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* AI Interviewer Avatar & Live Question Banner */}
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/[0.08] space-y-4 shadow-xl">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
                    <Bot className="w-6 h-6" />
                  </div>
                  {isAISpeaking && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-[#06080E] animate-ping"></span>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">SparkX Adaptive AI Interviewer</span>
                    {isFollowUpActive && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm animate-pulse">
                        ⚡ Adaptive Cross-Questioning
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                    <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-semibold">{currentQ?.type || 'Technical Scenario'}</span>
                    {customQuestions.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          ✨ Synthesized for {activeCandidate?.name?.split(' ')[0] || 'Candidate'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Audio Equalizer Waves */}
              <div className="flex items-center space-x-1.5 h-9 px-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                {isAISpeaking ? (
                  <>
                    <div className="w-1 bg-cyan-400 rounded-full audio-bar-1"></div>
                    <div className="w-1 bg-indigo-400 rounded-full audio-bar-2"></div>
                    <div className="w-1 bg-purple-400 rounded-full audio-bar-3"></div>
                    <div className="w-1 bg-cyan-400 rounded-full audio-bar-4"></div>
                    <div className="w-1 bg-indigo-400 rounded-full audio-bar-5"></div>
                    <span className="text-[10px] text-cyan-300 font-bold ml-2">Speaking</span>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listening</span>
                  </span>
                )}
              </div>
            </div>

            {/* Current Active Question Display */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#06080E]/90 border border-indigo-500/20 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 opacity-60"></div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  {isFollowUpActive ? "Adaptive Deep Probe (Evaluating Competency Depth)" : `Targeted Competency Question ${currentQuestionIdx + 1}`}
                </span>
                {loadingQuestions && (
                  <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                    Synthesizing candidate scenarios...
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-semibold text-white mt-1.5 leading-relaxed">
                {isFollowUpActive ? activeFollowUpPrompt : (currentQ?.prompt || (loadingQuestions ? 'Synthesizing dynamic role scenario...' : 'Loading scenario...'))}
              </p>
            </div>

          </div>

          {/* Live Transcript Chat Feed */}
          <div className="glass-card p-4 rounded-3xl border border-white/[0.08] max-h-56 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Speech-to-Text Stream</span>
              <span className="text-[10px] text-emerald-400 font-mono">NLP Pipeline Active</span>
            </div>
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                  msg.speaker === 'ai'
                    ? msg.isAdaptive 
                      ? 'bg-amber-950/30 border border-amber-800/40 text-amber-200' 
                      : 'bg-slate-900/80 border border-slate-800 text-slate-200'
                    : 'bg-indigo-950/50 border border-indigo-500/30 text-indigo-100 ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <span>{msg.speaker === 'ai' ? '🤖 SparkX AI' : '👤 You (Candidate)'}</span>
                    {msg.isAdaptive && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                        ADAPTIVE
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-slate-500">{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed text-xs sm:text-[13px]">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Candidate Response Input & Presets */}
          <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/[0.08] space-y-3 shadow-xl">
            
            {/* Quick Demo Answers to Test Adaptive Engine with 1-click */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Quick Test Responses:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("I would use asynchronous FastAPI endpoints combined with streaming responses and an HNSW vector index in PostgreSQL for sub-50ms latency.")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-medium text-[11px]"
                >
                  ⚡ Strong Answer
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("We basically use caching and databases to make it fast.")}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition font-medium text-[11px]"
                >
                  ❓ Vague Answer
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("I don't know much about this yet, haven't encountered it in production.")}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition font-medium text-[11px]"
                >
                  🤷‍♂️ "I don't know" (Adaptive Pivot)
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAnswerSubmit} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-3 rounded-2xl border transition flex items-center justify-center shrink-0 ${
                  isMicListening
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/40 animate-pulse'
                    : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-white hover:border-indigo-500'
                }`}
                title={isMicListening ? "Click to Stop Mic" : "Click to Speak"}
              >
                {isMicListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <input
                type="text"
                placeholder={isMicListening ? "Listening to your voice... Speak now!" : "Type or speak your answer..."}
                value={candidateAnswer}
                onChange={e => setCandidateAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#06080E] border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />

              <button
                type="submit"
                disabled={!candidateAnswer.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 disabled:opacity-35 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30 shrink-0"
              >
                <span>Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Advance / Next stage */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>Real-time NLP evaluates completeness and triggers deep queries.</span>
              <button
                type="button"
                onClick={() => finishInterview(transcript)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 transition"
              >
                <span>Proceed to Live Coding Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
