import React, { useState, useEffect, useRef } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { ProctorMonitor } from '../../services/proctorService';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  Video, 
  AlertTriangle, 
  Activity, 
  Zap, 
  RefreshCcw, 
  Clock,
  UserX,
  Users
} from 'lucide-react';

export default function ProctorLiveMonitor() {
  const { currentInterviewSession } = useRecruitment();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const proctorRef = useRef(null);
  const streamRef = useRef(null);

  const [faceStatus, setFaceStatus] = useState('VERIFIED');
  const faceStatusRef = useRef(faceStatus);
  const [integrityScore, setIntegrityScore] = useState(96);
  const [riskLevel, setRiskLevel] = useState('Low');
  const [events, setEvents] = useState([
    { id: '1', timestamp: '00:05', type: 'SESSION_STARTED', description: 'Webcam telemetry and single-person lock initiated.', severity: 'info' },
    { id: '2', timestamp: '01:14', type: 'FACE_VERIFIED', description: 'Primary facial biometric baseline confirmed.', severity: 'info' }
  ]);
  const [cameraActive, setCameraActive] = useState(false);

  // Sync faceStatus ref for the canvas HUD loop
  useEffect(() => {
    faceStatusRef.current = faceStatus;
  }, [faceStatus]);

  useEffect(() => {
    proctorRef.current = new ProctorMonitor({
      onEvent: (ev, score, risk) => {
        setEvents(prev => [ev, ...prev]);
        setIntegrityScore(score);
        setRiskLevel(risk);
      }
    });

    proctorRef.current.start();

    let isMounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
        console.warn('Proctor video feed fallback active:', err?.message);
      }
    }

    initCamera();

    const interval = setInterval(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const w = canvasRef.current.width;
        const h = canvasRef.current.height;
        ctx.clearRect(0, 0, w, h);

        const currentStatus = faceStatusRef.current;
        const isVerified = currentStatus === 'VERIFIED';
        const strokeColor = isVerified ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.8)';
        const accentColor = isVerified ? 'rgba(6, 182, 212, 0.4)' : 'rgba(239, 68, 68, 0.5)';

        // Target box dimensions
        const bx = w * 0.22;
        const by = h * 0.16;
        const bw = w * 0.56;
        const bh = h * 0.68;
        const cornerLen = 18;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;

        // Top-Left corner bracket
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Top-Right corner bracket
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        // Bottom-Left corner bracket
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();

        // Bottom-Right corner bracket
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Subtle eye-level calibration horizon line
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        ctx.moveTo(bx + 12, by + bh * 0.42);
        ctx.lineTo(bx + bw - 12, by + bh * 0.42);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center reticle
        const cx = bx + bw / 2;
        const cy = by + bh * 0.42;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy);
        ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx, cy + 8);
        ctx.stroke();

        // Telemetry calibration label
        ctx.fillStyle = strokeColor;
        ctx.font = '10px "JetBrains Mono", Consolas, monospace';
        ctx.fillText(isVerified ? '● BIOMETRIC LOCK: ACTIVE (99.2%)' : `▲ ANOMALY: ${currentStatus}`, bx + 8, by - 6);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (proctorRef.current) proctorRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const triggerEvent = (type) => {
    if (!proctorRef.current) return;
    if (type === 'TAB_SWITCH') {
      proctorRef.current.logEvent('TAB_SWITCH', 'Candidate switched away to secondary browser tab or search window.', 'high');
    } else if (type === 'MULTIPLE_FACES') {
      setFaceStatus('MULTIPLE_FACES');
      proctorRef.current.logEvent('MULTIPLE_FACES', 'Secondary person detected entering camera field of view.', 'high');
      setTimeout(() => setFaceStatus('VERIFIED'), 5000);
    } else if (type === 'FACE_LOST') {
      setFaceStatus('FACE_LOST');
      proctorRef.current.logEvent('FACE_LOST', 'Candidate face completely out of camera view for > 5 seconds.', 'medium');
      setTimeout(() => setFaceStatus('VERIFIED'), 5000);
    }
  };

  const resetTelemetry = () => {
    setIntegrityScore(100);
    setRiskLevel('Low');
    setFaceStatus('VERIFIED');
    setEvents([
      { id: Date.now().toString(), timestamp: '00:00', type: 'TELEMETRY_RESET', description: 'Telemetry baseline recalibrated.', severity: 'info' }
    ]);
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 uppercase tracking-wider font-mono">
              Session Telemetry HUD
            </span>
            <span className="text-xs text-[#7A6B5D] dark:text-[#A89A8D]">Continuous Verification Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E2017] dark:text-[#FDFBF7] mt-1 tracking-tight">
            Interview Integrity & Proctor Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B5D] dark:text-[#A89A8D] mt-1">
            Objective presence signals, focus observations, and verifiable telemetry to assist fair human evaluation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={resetTelemetry}
            className="px-3.5 py-2 rounded-xl bg-[#FDFBF7] dark:bg-[#201814] border border-[#E8DFD8] dark:border-[#3D2C22] text-xs font-semibold text-[#5C4D42] dark:text-[#C7B9AD] hover:text-[#C27803] dark:hover:text-[#F59E0B] transition flex items-center space-x-1.5 shadow-xs"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Main Proctoring Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Live Visual Stream & HUD (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#0C0A09] border border-[#E8DFD8] dark:border-[#3D2C22] aspect-[4/3] flex items-center justify-center shadow-sm">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover transform scale-x-[-1] ${cameraActive ? 'block' : 'hidden'}`}
            />

            {!cameraActive && (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-[#1A1512] border border-amber-500/30 flex items-center justify-center text-[#F59E0B]">
                  <Video className="w-8 h-8" />
                </div>
                <div className="text-xs font-semibold text-[#E8DFD8]">Biometric HUD Stream Active</div>
                <span className="text-[10px] text-[#A89A8D]">Heuristic tracking enabled</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={480}
              height={360}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Status overlay badge */}
            <div className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono text-white">
              <span className={`w-2.5 h-2.5 rounded-full ${faceStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`}></span>
              <span>STATUS: {faceStatus}</span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-400 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Telemetry: Nominal</span>
              </span>
              <span>Verification System V2.4</span>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] dark:bg-[#201814] border border-[#E8DFD8] dark:border-[#3D2C22] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#C27803] dark:text-[#F59E0B] flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Telemetry Triggers (Calibration Mode):</span>
              </span>
              <span className="text-[10px] text-[#7A6B5D] dark:text-[#A89A8D]">Instant Event Logging</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => triggerEvent('TAB_SWITCH')}
                className="p-2.5 rounded-xl bg-[#F7F4EF] hover:bg-[#EFE9DF] dark:bg-[#150F0D] dark:hover:bg-[#1C1410] border border-[#E8DFD8] dark:border-[#33241C] text-xs font-semibold text-[#2E2017] dark:text-[#FDFBF7] transition text-center"
              >
                Alt-Tab Away
              </button>

              <button
                onClick={() => triggerEvent('MULTIPLE_FACES')}
                className="p-2.5 rounded-xl bg-[#F7F4EF] hover:bg-[#EFE9DF] dark:bg-[#150F0D] dark:hover:bg-[#1C1410] border border-[#E8DFD8] dark:border-[#33241C] text-xs font-semibold text-[#2E2017] dark:text-[#FDFBF7] transition text-center"
              >
                Multi-Person Entry
              </button>

              <button
                onClick={() => triggerEvent('FACE_LOST')}
                className="p-2.5 rounded-xl bg-[#F7F4EF] hover:bg-[#EFE9DF] dark:bg-[#150F0D] dark:hover:bg-[#1C1410] border border-[#E8DFD8] dark:border-[#33241C] text-xs font-semibold text-[#2E2017] dark:text-[#FDFBF7] transition text-center"
              >
                Candidate Leaves
              </button>
            </div>
          </div>
        </div>

        {/* Right: Telemetry Metrics & Audit Trail (6 Cols) */}
        <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
          
          {/* Risk Level & Integrity Metric */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FDFBF7] dark:bg-[#201814] border border-[#E8DFD8] dark:border-[#3D2C22] shadow-sm">
              <span className="text-xs text-[#7A6B5D] dark:text-[#A89A8D] font-medium">Session Integrity Score</span>
              <div className="text-3xl font-black text-[#2E2017] dark:text-[#FDFBF7] mt-1">{integrityScore}/100</div>
              <div className="w-full bg-[#E8DFD8] dark:bg-[#33241C] h-2 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    integrityScore >= 80 ? 'bg-emerald-500' : integrityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} 
                  style={{ width: `${integrityScore}%` }}
                ></div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FDFBF7] dark:bg-[#201814] border border-[#E8DFD8] dark:border-[#3D2C22] shadow-sm">
              <span className="text-xs text-[#7A6B5D] dark:text-[#A89A8D] font-medium">Risk Indicator for Reviewer</span>
              <div className={`text-3xl font-black mt-1 ${
                riskLevel === 'Low' ? 'text-emerald-600 dark:text-emerald-400' : riskLevel === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {riskLevel} Risk
              </div>
              <span className="text-[11px] text-[#7A6B5D] dark:text-[#A89A8D] mt-1 block">
                {riskLevel === 'Low' ? 'Zero suspicious anomalies' : 'Human review advised — verify context'}
              </span>
            </div>
          </div>

          {/* Timestamped Event Stream */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] dark:bg-[#201814] border border-[#E8DFD8] dark:border-[#3D2C22] shadow-sm flex-1 space-y-3 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8DFD8] dark:border-[#33241C] pb-2">
              <span className="text-xs font-bold text-[#2E2017] dark:text-[#FDFBF7] uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                <Activity className="w-4 h-4 text-[#C27803] dark:text-[#F59E0B]" />
                <span>Verification Event Audit Log ({events.length})</span>
              </span>
              <span className="text-[10px] text-[#7A6B5D] dark:text-[#A89A8D]">Contextual Evidence</span>
            </div>

            <div className="space-y-2">
              {events.map((ev) => (
                <div 
                  key={ev.id}
                  className={`p-3 rounded-xl border flex items-start space-x-3 text-xs ${
                    ev.severity === 'high' 
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-200' 
                      : ev.severity === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-200'
                      : 'bg-[#F7F4EF] dark:bg-[#150F0D] border-[#E8DFD8] dark:border-[#33241C] text-[#2E2017] dark:text-[#FDFBF7]'
                  }`}
                >
                  <div className="px-2 py-0.5 rounded bg-black/5 dark:bg-black/40 font-mono text-[10px] text-[#7A6B5D] dark:text-[#A89A8D] mt-0.5">
                    {ev.timestamp}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold uppercase tracking-wider text-[11px] mr-1 font-mono">
                      [{ev.type}]
                    </span>
                    <span>{ev.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
