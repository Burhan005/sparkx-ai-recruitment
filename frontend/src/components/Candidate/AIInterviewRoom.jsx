import React, { useState, useEffect, useRef } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { evaluateAnswerAndAdapt } from '../../services/aiRecruiterService';
import { ProctorMonitor } from '../../services/proctorService';
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
  Activity
} from 'lucide-react';

export default function AIInterviewRoom() {
  const { 
    activeJob, 
    currentInterviewSession, 
    setCurrentInterviewSession, 
    setCurrentView 
  } = useRecruitment();

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

  // Questions come 100% from the active job stored in DB
  const questions = activeJob?.questions || [];
  const currentQ = questions[currentQuestionIdx] || null;

  // Transcript
  const [transcript, setTranscript] = useState([
    {
      id: 'init-0',
      speaker: 'ai',
      text: `Hello ${currentInterviewSession.candidateName || 'Candidate'}! Welcome to your SparkX AI interview${activeJob ? ` for the ${activeJob.title} position` : ''}. I will ask you role-specific questions and may ask adaptive follow-ups based on your depth. Let's begin!`,
      timestamp: '00:00'
    }
  ]);


  // 1. Initialize Proctoring
  useEffect(() => {
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
  }, []);

  // 2. Initialize Camera & Canvas Tracking
  useEffect(() => {
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

  // Speak initial question on load
  useEffect(() => {
    if (currentQ) {
      setTimeout(() => {
        speakAI(currentQ.prompt);
      }, 800);
    }
  }, [currentQuestionIdx]);

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

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header Bar with Live Telemetry Badges */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Live AI Interview Session</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-indigo-400 font-semibold">{activeJob.title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Adaptive cross-questioning & real-time anti-cheating proctoring active
          </p>
        </div>

        {/* Telemetry Status Badges */}
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${
            tabFocused 
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
              : 'bg-rose-950/60 text-rose-300 border-rose-800/60 animate-pulse'
          }`}>
            <Eye className="w-3.5 h-3.5" />
            <span>{tabFocused ? 'Browser Focus: Locked' : 'Tab Switched!'}</span>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 border ${
            riskLevel === 'High'
              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
              : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Integrity: {integrityScore}/100</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Candidate Camera & Proctoring HUD (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Webcam Box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] flex items-center justify-center shadow-xl">
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
                <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse-ring">
                  <Video className="w-10 h-10" />
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  {cameraError ? cameraError : "Connecting candidate video stream..."}
                </div>
                <span className="text-[10px] text-slate-500">
                  Webcam proctoring simulation running seamlessly
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
            <div className="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
              <span className={`w-2 h-2 rounded-full ${faceStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`}></span>
              <span>{faceStatus === 'VERIFIED' ? '1 PERSON DETECTED' : faceStatus}</span>
            </div>

            {/* Top-right REC badge */}
            <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 text-[10px] font-bold border border-rose-800">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>REC</span>
            </div>

            {/* Bottom watermark */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-slate-400 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/5">
              <span>Candidate: {currentInterviewSession.candidateName}</span>
              <span className="font-mono">FPS: 30 • 720p</span>
            </div>
          </div>

          {/* Presenter / Client Demo Tools */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
              <span className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Client Demo: Test Anti-Cheating Triggers</span>
              </span>
              <span className="text-[10px] text-slate-500">Click to demonstrate Slide 9</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => triggerCheatEvent('TAB_SWITCH')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700 hover:border-amber-500 transition text-center"
              >
                Alt-Tab Away
              </button>

              <button
                type="button"
                onClick={() => triggerCheatEvent('MULTIPLE_FACES')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700 hover:border-rose-500 transition text-center"
              >
                Multi-Person
              </button>

              <button
                type="button"
                onClick={() => triggerCheatEvent('NO_FACE')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700 hover:border-amber-500 transition text-center"
              >
                Face Lost
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI Interviewer, Audio Waves, Adaptive Dialogue & Input (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* AI Interviewer Avatar & Live Question Banner */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-lg">
                    <Bot className="w-6 h-6" />
                  </div>
                  {isAISpeaking && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-[#111827] animate-ping"></span>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">SparkX Adaptive AI Interviewer</span>
                    {isFollowUpActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚡ Adaptive Cross-Questioning
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <span>Question {currentQuestionIdx + 1} of {questions.length}</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-semibold">{currentQ.type}</span>
                  </div>
                </div>
              </div>

              {/* Audio Equalizer Waves */}
              <div className="flex items-center space-x-1.5 h-8 px-3 rounded-xl bg-slate-900 border border-slate-800">
                {isAISpeaking ? (
                  <>
                    <div className="w-1 bg-cyan-400 rounded-full audio-bar-1"></div>
                    <div className="w-1 bg-indigo-400 rounded-full audio-bar-2"></div>
                    <div className="w-1 bg-purple-400 rounded-full audio-bar-3"></div>
                    <div className="w-1 bg-cyan-400 rounded-full audio-bar-4"></div>
                    <div className="w-1 bg-indigo-400 rounded-full audio-bar-5"></div>
                    <span className="text-[10px] text-cyan-300 font-bold ml-1.5">Speaking</span>
                  </>
                ) : (
                  <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listening</span>
                  </span>
                )}
              </div>
            </div>

            {/* Current Active Question Display */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-950/60 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                {isFollowUpActive ? "Adaptive Follow-up (Testing Deep Understanding)" : `Targeted Question ${currentQuestionIdx + 1}`}
              </span>
              <p className="text-sm font-semibold text-white mt-1 leading-relaxed">
                {isFollowUpActive ? activeFollowUpPrompt : currentQ.prompt}
              </p>
            </div>

          </div>

          {/* Live Transcript Chat Feed */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 max-h-56 overflow-y-auto space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Speech-to-Text Transcript</span>
            {transcript.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl text-xs space-y-1 ${
                  msg.speaker === 'ai'
                    ? msg.isAdaptive 
                      ? 'bg-amber-950/40 border border-amber-800/40 text-amber-200' 
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                    : 'bg-indigo-950/60 border border-indigo-800/60 text-indigo-100 ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{msg.speaker === 'ai' ? '🤖 SparkX AI' : '👤 You (Candidate)'}</span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Candidate Response Input & Presets */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
            
            {/* Quick Demo Answers to Test Adaptive Engine with 1-click */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Quick Test Responses (1-Click Demo):</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("I would use asynchronous FastAPI endpoints combined with streaming responses and an HNSW vector index in PostgreSQL for sub-50ms latency.")}
                  className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900/60 transition"
                >
                  ⚡ Strong Answer
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("We basically use caching and databases to make it fast.")}
                  className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/50 hover:bg-amber-900/60 transition"
                >
                  ❓ Vague Answer (Triggers Follow-Up)
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAnswerSubmit} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 ${
                  isMicListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-indigo-500'
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
                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="submit"
                disabled={!candidateAnswer.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 shrink-0"
              >
                <span>Submit</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Advance / Next stage */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>Answers are automatically cross-examined by the AI engine.</span>
              <button
                type="button"
                onClick={() => finishInterview(transcript)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
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
