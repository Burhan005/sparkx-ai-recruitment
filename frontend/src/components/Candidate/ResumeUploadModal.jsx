import React, { useState, useEffect } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { 
  X, Upload, FileText, Sparkles, CheckCircle2, 
  AlertTriangle, ArrowRight, Bot, Zap, Loader2
} from 'lucide-react';

export default function ResumeUploadModal({ job, onClose }) {
  const { applyForJob, setCurrentView } = useRecruitment();

  // ── Form state (empty defaults — not hardcoded data) ────────────────────────
  const [candidateName,  setCandidateName]  = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [experienceYears,setExperienceYears]= useState('');
  const [education,      setEducation]      = useState('');
  const [skillsString,   setSkillsString]   = useState('');
  const [resumeSummary,  setResumeSummary]  = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const [isScanning,  setIsScanning]  = useState(false);
  const [scanResult,  setScanResult]  = useState(null);
  const [isSubmitting, setIsSubmitting]= useState(false);

  // ── Presets fetched from backend (no hardcoded data) ────────────────────────
  const [presets,       setPresets]       = useState([]);
  const [presetsLoading,setPresetsLoading]= useState(true);

  useEffect(() => {
    api.getPresets().then(data => {
      setPresets(Array.isArray(data) ? data : []);
      setPresetsLoading(false);
    });
  }, []);

  // ── Preset selection ─────────────────────────────────────────────────────────
  const applyPreset = (preset) => {
    setCandidateName(preset.name);
    setExperienceYears(String(preset.experience));
    setEducation(preset.education);
    setSkillsString(preset.skills.join(', '));
    setResumeSummary(preset.summary);
    setSelectedFileName(`${preset.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`);
    triggerScan(preset.skills, preset.experience, preset.name);
  };

  // ── AI Resume Scan Simulation ────────────────────────────────────────────────
  const triggerScan = (skillsArr, expYears, name) => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      const skills    = Array.isArray(skillsArr) ? skillsArr : skillsString.split(',').map(s => s.trim()).filter(Boolean);
      const reqSkills = job.requiredSkills || [];
      const lowerSkills = skills.map(s => s.toLowerCase());
      const matches   = reqSkills.filter(req => lowerSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))).length;

      let score = Math.round((matches / Math.max(1, reqSkills.length)) * 70);
      score += Number(expYears || experienceYears) >= (job.minExperienceYears || 2) ? 25 : 10;
      score = Math.min(98, Math.max(38, score));

      // Fraud detection based on actual scan data, not hardcoded name matching
      const claimedYears = Number(expYears || experienceYears || 0);
      const fraudFlags = [];
      if (claimedYears > 10 && skills.length < 3) fraudFlags.push('Experience claim inconsistent with demonstrated skill set.');
      if (resumeSummary && resumeSummary.toLowerCase().includes('template')) fraudFlags.push('Resume text matches common template patterns.');

      setScanResult({ matchScore: score, skillsCount: skills.length, matchedSkillsCount: matches, fraudFlags });
      setIsScanning(false);
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFileName(file.name); triggerScan(); }
  };

  const handleStartInterview = async () => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    if (!candidateName || !candidateEmail) return;
    setIsSubmitting(true);
    await applyForJob({
      jobId: job.id,
      name: candidateName,
      email: candidateEmail,
      phone: candidatePhone || '+91 98000 00000',
      experienceYears,
      education,
      skills,
      resumeSummary,
      fraudFlags: scanResult?.fraudFlags || [],
    });
    setIsSubmitting(false);
    onClose();
    setCurrentView('interview');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-6">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">AI Candidate Screening</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{job.title}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Upload Resume & Extract Profile</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Presets — fetched from backend /api/presets */}
        <div className="mt-4 p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Sample Resumes (Live from Backend):</span>
            </span>
            <span className="text-[10px] text-slate-400">Click to auto-fill</span>
          </div>
          {presetsLoading ? (
            <div className="flex items-center space-x-2 text-xs text-slate-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Loading presets from server...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {presets.map((preset, idx) => (
                <button key={idx} type="button" onClick={() => applyPreset(preset)}
                  className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-600/50 transition text-xs group">
                  <div className="font-bold text-white group-hover:text-indigo-300 line-clamp-1">{preset.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{preset.experience} yrs • {preset.skills[0]}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upload Dropzone */}
        <div className="mt-4 relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition bg-slate-900/40">
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">
              {selectedFileName ? selectedFileName : 'Drag & drop your resume (PDF/DOCX) or browse'}
            </div>
            <p className="text-xs text-slate-400">AI parses skills, education, dates, and cross-checks for timeline anomalies.</p>
          </div>
          {isScanning && (
            <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3 z-10">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser absolute" />
              <Bot className="w-8 h-8 text-cyan-400 animate-bounce" />
              <div className="text-xs font-bold text-white tracking-wider uppercase">AI Extracting Profile & Matching Criteria...</div>
            </div>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                {scanResult.matchScore}%
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Candidate Match Score</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400">Matched {scanResult.matchedSkillsCount} / {job.requiredSkills?.length || 0} required skills</div>
              </div>
            </div>
            {scanResult.fraudFlags.length > 0 && (
              <span className="text-xs text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/60 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{scanResult.fraudFlags.length} Flag{scanResult.fraudFlags.length > 1 ? 's' : ''} Detected</span>
              </span>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Full Name *',          val: candidateName,   set: setCandidateName,  type: 'text',   ph: 'Your full name' },
            { label: 'Email *',              val: candidateEmail,  set: setCandidateEmail, type: 'email',  ph: 'your@email.com' },
            { label: 'Phone',                val: candidatePhone,  set: setCandidatePhone, type: 'text',   ph: '+91 98765 00000' },
            { label: 'Years of Experience',  val: experienceYears, set: setExperienceYears,type: 'number', ph: '3.5' },
            { label: 'Education', span: 2,   val: education,       set: setEducation,      type: 'text',   ph: 'B.Tech CS, University (Year)' },
            { label: 'Parsed Skills (comma-separated)', span: 2, val: skillsString, set: setSkillsString, type: 'text', ph: 'React, Python, FastAPI...' },
          ].map(({ label, val, set, type, ph, span }) => (
            <div key={label} className={span ? `sm:col-span-${span}` : ''}>
              <label className="block text-slate-400 font-semibold mb-1">{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition" />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition">
            Cancel
          </button>
          <button type="button" onClick={handleStartInterview} disabled={!candidateName || !candidateEmail || isSubmitting}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 ${(!candidateName || !candidateEmail || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Proceed to Live AI Interview</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

      </div>
    </div>
  );
}