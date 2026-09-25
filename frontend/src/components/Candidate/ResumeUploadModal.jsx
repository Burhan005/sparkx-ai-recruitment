import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { normalizeSkill } from '../../utils/skillMatcher';
import { formatJobCTC, formatCandidateExpectedCTC } from '../../utils/compensationFormatter';
import { 
  X, Upload, FileText, Sparkles, CheckCircle2, 
  AlertTriangle, ArrowRight, Bot, Zap, Loader2, DollarSign
} from 'lucide-react';

export default function ResumeUploadModal({ job, onClose }) {
  const navigate = useNavigate();
  const { applyForJob, currentUser } = useRecruitment();

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

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

  // ── Candidate Compensation Expectations ─────────────────────────────────────
  const [currentCtc,      setCurrentCtc]      = useState('');
  const [expectedCtcType, setExpectedCtcType] = useState('range');
  const [expectedCtcMin,  setExpectedCtcMin]  = useState('');
  const [expectedCtcMax,  setExpectedCtcMax]  = useState('');
  const [ctcCurrency,     setCtcCurrency]     = useState(job?.ctcCurrency || job?.ctc_currency || 'INR');

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
    const exp = Number(preset.experience || 0);
    setExperienceYears(String(preset.experience));
    setEducation(preset.education);
    setSkillsString(preset.skills.join(', '));
    setResumeSummary(preset.summary);
    setSelectedFileName(`${preset.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`);

    // Seed sensible compensation expectations based on preset experience
    if (exp <= 2) {
      setCurrentCtc('5.5');
      setExpectedCtcType('range');
      setExpectedCtcMin('7.0');
      setExpectedCtcMax('9.0');
    } else if (exp <= 5) {
      setCurrentCtc('9.0');
      setExpectedCtcType('range');
      setExpectedCtcMin('11.0');
      setExpectedCtcMax('14.0');
    } else {
      setCurrentCtc('16.0');
      setExpectedCtcType('range');
      setExpectedCtcMin('20.0');
      setExpectedCtcMax('25.0');
    }

    triggerScan(preset.skills, preset.experience, preset.name, '', preset.summary, preset.education);
  };

  // ── AI Resume Scan via Authoritative Backend Matching ──────────────────────
  const triggerScan = async (skillsArr, expYears, name, textContent, summaryContent, edu) => {
    setIsScanning(true);
    setScanResult(null);

    const skills = skillsArr || skillsString.split(',').map(s => s.trim()).filter(Boolean);
    const years = Number(expYears !== undefined ? expYears : experienceYears || 0);
    const text = textContent !== undefined ? textContent : resumeText;
    const summary = summaryContent !== undefined ? summaryContent : resumeSummary;
    const educationVal = edu !== undefined ? edu : education;
    const candidateNameVal = name || candidateName;

    // Fraud detection based on actual data
    const fraudFlags = [];
    if (years > 10 && skills.length < 3) fraudFlags.push('Experience claim inconsistent with demonstrated skill set.');
    if (summary && summary.toLowerCase().includes('template')) fraudFlags.push('Resume text matches common template patterns.');

    try {
      const matchRes = await api.matchJob(job.id, {
        name: candidateNameVal,
        experienceYears: years,
        skills,
        education: educationVal,
        resumeSummary: summary,
        resumeText: text,
      });

      if (matchRes) {
        setScanResult({
          skillsCount: skills.length,
          matchedSkills: matchRes.matched_skills || [],
          missingSkills: matchRes.missing_skills || [],
          fraudFlags,
        });
      } else {
        setScanResult({
          skillsCount: skills.length,
          matchedSkills: [],
          missingSkills: job.requiredSkills || [],
          fraudFlags,
        });
      }
    } catch (err) {
      console.warn('[ResumeUploadModal] match error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsScanning(true);
    setScanResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const parseRes = await api.parseResume(formData);
      if (parseRes && parseRes.success && parseRes.data) {
        const p = parseRes.data;
        if (p.name) setCandidateName(p.name);
        if (p.email) setCandidateEmail(p.email);
        if (p.phone) setCandidatePhone(p.phone);
        if (p.experience_years != null) setExperienceYears(String(p.experience_years));
        if (p.education) setEducation(p.education);
        if (p.skills && p.skills.length > 0) setSkillsString(p.skills.join(', '));
        if (p.resume_summary) setResumeSummary(p.resume_summary);
        if (p.resume_text) setResumeText(p.resume_text);

        await triggerScan(p.skills, p.experience_years, p.name, p.resume_text, p.resume_summary, p.education);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = typeof ev.target.result === 'string' ? ev.target.result : '';
          setResumeText(text);
          triggerScan(null, null, null, text);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.warn('Resume file processing error:', err);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = typeof ev.target.result === 'string' ? ev.target.result : '';
        setResumeText(text);
        triggerScan(null, null, null, text);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmitApplication = async () => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    if (!candidateName || !candidateEmail) return;

    const parseNum = (v) => (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v) : null;
    const minNum = parseNum(expectedCtcMin);
    const maxNum = parseNum(expectedCtcMax);

    if (expectedCtcType === 'range' && minNum !== null && maxNum !== null && minNum > maxNum) {
      alert("Validation error: Minimum Expected CTC cannot exceed Maximum Expected CTC");
      return;
    }

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
      currentCtc: parseNum(currentCtc),
      expectedCtcType,
      expectedCtcMin: expectedCtcType === 'fixed' ? minNum : minNum,
      expectedCtcMax: expectedCtcType === 'fixed' ? minNum : maxNum,
      ctcCurrency: ctcCurrency || 'INR',
    });
    setIsSubmitting(false);
    setSubmittedCandidate(saved || {
      name: candidateName,
    });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-popover text-slate-900 dark:text-slate-100 my-auto max-h-[90vh] flex flex-col overflow-hidden">

        {/* Pinned Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider font-mono">Candidate Application</span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{job.title}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {submittedCandidate ? 'Application Status' : 'Upload Resume & Apply'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedCandidate ? (
          /* Application Submitted Success State */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 py-8 text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-subtle">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-md text-[11px] font-bold font-mono bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 uppercase tracking-wider">
                Current Stage: 📋 Recruiter Screening
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Application Received!</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                Thank you, <strong>{submittedCandidate.name}</strong>. Your profile and resume have been submitted for <strong>{job.title}</strong> at <strong>{job.companyName || 'SparkX Technologies'}</strong>.
              </p>
            </div>

            {/* Lifecycle Explainer */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 text-left max-w-md mx-auto space-y-3 text-xs shadow-subtle">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Official Hiring Workflow</span>
                <span className="text-brand-600 dark:text-brand-400 font-bold font-mono">Stage 1 of 4</span>
              </div>
              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-subtle">1</div>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Stage 1: Application Screening (Active)</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Your application and resume have been placed in the recruiter screening pipeline for qualification review.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Stage 2: Recruiter Review & Scheduling (Next)</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">The recruiter screens your profile. When shortlisted, the recruiter will schedule your evaluation and send an official slot invite.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Stage 3: Role Assessment & AI Interview</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">Unlocked once scheduled or invited by the recruiter. Complete your tailored assessment and live conversational interview.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300">Stage 4: Recruiter Committee Decision</strong>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">The hiring committee reviews all signals to make final shortlisting, interview, or offer decisions.</p>
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
                  navigate('/my-applications');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-subtle transition flex items-center justify-center space-x-2"
              >
                <span>Go to My Applications</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/jobs');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
              >
                Browse More Job Openings
              </button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Demo Presets — fetched from backend /api/presets */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080A10] border border-slate-200 dark:border-slate-800 shadow-subtle">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 font-mono">
                    <Zap className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                    <span>1-Click Sample Resumes (Live from Backend):</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Fast-Track Demo</span>
                </div>
                {presetsLoading ? (
                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" /><span>Loading presets from server...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {presets.map((preset, idx) => (
                      <button key={idx} type="button" onClick={() => applyPreset(preset)}
                        className="text-left p-2.5 rounded-lg bg-white dark:bg-[#0E121E] hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition text-xs group shadow-subtle">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-1">{preset.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{preset.experience} yrs • {preset.skills[0]}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-xl p-5 text-center transition bg-slate-50/60 dark:bg-[#080A10]/60 group">
                <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {selectedFileName ? selectedFileName : 'Drag & drop your resume (PDF/DOCX) or browse'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">AI parses skills, education, dates, and cross-checks for timeline anomalies.</p>
                </div>
                {isScanning && (
                  <div className="absolute inset-0 bg-white/95 dark:bg-[#080A10]/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center space-y-2 z-20">
                    <Loader2 className="w-6 h-6 text-brand-600 dark:text-brand-400 animate-spin" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">AI Extracting Profile & Matching Criteria...</div>
                  </div>
                )}
              </div>

            {/* Scan Result */}
            {scanResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl border flex items-center justify-center font-black text-sm shadow-sm bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                        <span>Profile & Resume Parsed</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {scanResult.skillsCount || 0} skills detected • Form fields pre-filled below
                      </div>
                    </div>
                  </div>
                  {scanResult.fraudFlags?.length > 0 && (
                    <span className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 rounded-full border border-rose-200 dark:border-rose-800/60 flex items-center space-x-1.5 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{scanResult.fraudFlags.length} Flag{scanResult.fraudFlags.length > 1 ? 's' : ''} Detected</span>
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.04] flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <span>Resume data extracted. Review your profile details below and submit your application for recruiter screening.</span>
                </div>
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
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-brand-500 transition shadow-inner" />
                </div>
              ))}
            </div>

            {/* Compensation & CTC Expectations */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] space-y-3.5 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Compensation & CTC Expectations
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Share your current compensation and salary expectations for this role.
                    </p>
                  </div>
                </div>

                {/* Job Advertised Budget Badge for transparency */}
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 self-start sm:self-auto">
                  <span className="text-slate-400 mr-1">Role Budget:</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                    {formatJobCTC(job)}
                  </span>
                </div>
              </div>

              {/* CTC Type Mode: Range vs Exact */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mr-1 font-mono">Expected Structure:</span>
                <button
                  type="button"
                  onClick={() => setExpectedCtcType('range')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                    expectedCtcType === 'range'
                      ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                      : 'bg-white dark:bg-[#080A10] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-400'
                  }`}
                >
                  Range (Min – Max)
                </button>
                <button
                  type="button"
                  onClick={() => setExpectedCtcType('fixed')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                    expectedCtcType === 'fixed'
                      ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                      : 'bg-white dark:bg-[#080A10] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-brand-400'
                  }`}
                >
                  Exact Figure
                </button>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Current CTC */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current CTC (LPA) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentCtc}
                      onChange={e => setCurrentCtc(e.target.value)}
                      placeholder="e.g. 8.5"
                      className="w-full pl-6 pr-3 py-1.5 text-xs bg-white dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-subtle"
                    />
                  </div>
                </div>

                {/* Expected CTC Min */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {expectedCtcType === 'range' ? 'Min Expected CTC (LPA) *' : 'Expected CTC (LPA) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={expectedCtcMin}
                      onChange={e => setExpectedCtcMin(e.target.value)}
                      placeholder="e.g. 10.0"
                      className="w-full pl-6 pr-3 py-1.5 text-xs bg-white dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-subtle"
                    />
                  </div>
                </div>

                {/* Expected CTC Max (if Range) */}
                {expectedCtcType === 'range' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Max Expected CTC (LPA) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expectedCtcMax}
                        onChange={e => setExpectedCtcMax(e.target.value)}
                        placeholder="e.g. 14.0"
                        className="w-full pl-6 pr-3 py-1.5 text-xs bg-white dark:bg-[#080A10] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-subtle"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expectation Preview */}
              {(expectedCtcMin || expectedCtcMax) && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Your expectation preview:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 font-mono">
                    {formatCandidateExpectedCTC({
                      expectedCtcType,
                      expectedCtcMin: expectedCtcMin ? Number(expectedCtcMin) : null,
                      expectedCtcMax: expectedCtcType === 'range' && expectedCtcMax ? Number(expectedCtcMax) : null,
                      ctcCurrency: ctcCurrency || 'INR',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pinned Footer Actions */}
          <div className="p-4 sm:p-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#0E121E]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition">
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSubmitApplication} 
              disabled={!candidateName || !candidateEmail || isSubmitting}
              className={`px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 transition flex items-center space-x-2 ${(!candidateName || !candidateEmail || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    </div>,
    document.body
  );
}