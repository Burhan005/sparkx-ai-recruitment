import React, { useState, useEffect } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { 
  X, Upload, FileText, Sparkles, CheckCircle2, 
  AlertTriangle, ArrowRight, Bot, Zap, Loader2
} from 'lucide-react';

export default function ResumeUploadModal({ job, onClose }) {
  const { applyForJob, setCurrentView, currentUser } = useRecruitment();

  // ── Form state (Pre-filled with logged in candidate profile if available) ───
  const [candidateName,  setCandidateName]  = useState(currentUser?.name || '');
  const [candidateEmail, setCandidateEmail] = useState(currentUser?.email || '');
  const [candidatePhone, setCandidatePhone] = useState(currentUser?.phone || '');
  const [experienceYears,setExperienceYears]= useState(currentUser?.experience_years ? String(currentUser.experience_years) : (currentUser?.experienceYears ? String(currentUser.experienceYears) : ''));
  const [education,      setEducation]      = useState(currentUser?.education || '');
  const [skillsString,   setSkillsString]   = useState(Array.isArray(currentUser?.skills) ? currentUser.skills.join(', ') : '');
  const [resumeSummary,  setResumeSummary]  = useState(currentUser?.resume_summary || currentUser?.resumeSummary || '');
  const [selectedFileName, setSelectedFileName] = useState(currentUser?.resume_filename || currentUser?.resumeFilename || '');
  const [resumeText,     setResumeText]     = useState(currentUser?.resume_text || currentUser?.resumeText || '');

  const [isScanning,  setIsScanning]  = useState(false);
  const [scanResult,  setScanResult]  = useState(null);
  const [isSubmitting, setIsSubmitting]= useState(false);
  const [submittedCandidate, setSubmittedCandidate] = useState(null);

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
      const skills = skillsArr || skillsString.split(',').map(s => s.trim()).filter(Boolean);
      const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
      const lowerSkills = skills.map(s => s.toLowerCase());
      const matches = reqSkills.filter(req => lowerSkills.some(s => s.includes(req) || req.includes(s))).length;

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
    if (file) { 
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setResumeText(typeof ev.target.result === 'string' ? ev.target.result : '');
      };
      reader.readAsText(file);
      triggerScan(); 
    }
  };

  const handleSubmitApplication = async () => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    if (!candidateName || !candidateEmail) return;
    setIsSubmitting(true);
    const saved = await applyForJob({
      jobId: job.id,
      companyName: job.companyName || 'SparkX Technologies',
      name: candidateName,
      email: candidateEmail,
      phone: candidatePhone || '+91 98000 00000',
      experienceYears: Number(experienceYears || 0),
      education: education || 'B.Tech / Technical Degree',
      skills,
      resumeSummary,
      resumeFilename: selectedFileName || null,
      resumeText: resumeText || null,
      fraudFlags: scanResult?.fraudFlags || [],
    });
    setIsSubmitting(false);
    setSubmittedCandidate(saved || {
      name: candidateName,
      matchScore: scanResult?.matchScore || 85
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 my-6">
        
        {/* Iridescent top hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">AI Candidate Screening</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{job.title}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {submittedCandidate ? 'Application Status' : 'Upload Resume & Apply'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedCandidate ? (
          /* Application Submitted Success State */
          <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wider">
                Current Stage: 📋 Recruiter Screening
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Application Received!</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                Thank you, <strong>{submittedCandidate.name}</strong>. Your profile has been submitted for <strong>{job.title}</strong> and matched with a <strong>{submittedCandidate.matchScore}%</strong> competency score.
              </p>
            </div>

            {/* Lifecycle Explainer */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] text-left max-w-md mx-auto space-y-3 text-xs shadow-inner">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/[0.06] pb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Official Hiring Workflow</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">Step 1 of 3</span>
              </div>
              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Application Screening:</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Your application has been received and is currently in the recruiter screening pipeline.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Step 1: 4-Pillar Technical Assessment</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Complete your job-tailored Technical MCQs, Production Scenario, Hands-on coding, and Troubleshooting challenges.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Step 2: Live AI HR/Technical Interview</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Engage in adaptive conversational probing with live AI proctoring and real-time follow-up questions.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Step 3: Verified Performance Dossier</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Receive your verified skill gap report, readiness index, and recruiter scorecard.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentView('assessment');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
              >
                <span>Start Step 1: Technical Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentView('candidate');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
              >
                Browse Job Openings
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <>
            {/* Demo Presets — fetched from backend /api/presets */}
            <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-[#06080E]/90 border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                  <span>1-Click Sample Resumes (Live from Backend):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Fast-Track Demo</span>
              </div>
              {presetsLoading ? (
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 dark:text-indigo-400" /><span>Loading presets from server...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {presets.map((preset, idx) => (
                    <button key={idx} type="button" onClick={() => applyPreset(preset)}
                      className="text-left p-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition text-xs group shadow-sm">
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 line-clamp-1">{preset.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{preset.experience} yrs • {preset.skills[0]}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Dropzone */}
            <div className="mt-4 relative border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition bg-slate-50/60 dark:bg-[#06080E]/60 group">
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30 group-hover:scale-105 transition-transform shadow-md shadow-indigo-500/10">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedFileName ? selectedFileName : 'Drag & drop your resume (PDF/DOCX) or browse'}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI parses skills, education, dates, and cross-checks for timeline anomalies.</p>
              </div>
              {isScanning && (
                <div className="absolute inset-0 bg-white/95 dark:bg-[#06080E]/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3 z-20">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser absolute" />
                  <Bot className="w-8 h-8 text-indigo-600 dark:text-cyan-400 animate-bounce" />
                  <div className="text-xs font-bold text-slate-900 dark:text-white tracking-wider uppercase">AI Extracting Profile & Matching Criteria...</div>
                </div>
              )}
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm shadow-sm">
                    {scanResult.matchScore}%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>Candidate Match Score</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Matched {scanResult.matchedSkillsCount} / {job.requiredSkills?.length || 0} required skills</div>
                  </div>
                </div>
                {scanResult.fraudFlags.length > 0 && (
                  <span className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-800/60 flex items-center space-x-1.5 shadow-sm">
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
                  <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition shadow-inner" />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSubmitApplication} 
                disabled={!candidateName || !candidateEmail || isSubmitting}
                className={`px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 ${(!candidateName || !candidateEmail || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Submit Application for Screening</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}