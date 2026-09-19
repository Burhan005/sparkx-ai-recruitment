import React, { useState } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { DEMO_RESUME_PRESETS } from '../../data/mockData';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Bot, 
  Zap 
} from 'lucide-react';

export default function ResumeUploadModal({ job, onClose }) {
  const { applyForJob, setCurrentView } = useRecruitment();

  const [candidateName, setCandidateName] = useState('Alex Rivera');
  const [candidateEmail, setCandidateEmail] = useState('alex.rivera@example.com');
  const [candidatePhone, setCandidatePhone] = useState('+91 98765 12345');
  const [experienceYears, setExperienceYears] = useState('3.5');
  const [education, setEducation] = useState('B.Tech in Computer Science, State Tech University (2022)');
  const [skillsString, setSkillsString] = useState('Python, FastAPI, React, PostgreSQL, System Design, Docker');
  const [resumeSummary, setResumeSummary] = useState('Full stack developer with 3.5 years of experience building microservices and web interfaces.');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Handle Preset Selection
  const applyPreset = (preset) => {
    setCandidateName(preset.name);
    setExperienceYears(String(preset.experience));
    setEducation(preset.education);
    setSkillsString(preset.skills.join(', '));
    setResumeSummary(preset.summary);
    setSelectedFileName(`${preset.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`);
    triggerScan(preset.skills, preset.experience, preset.name);
  };

  // Trigger Simulated AI Parsing & Scanning
  const triggerScan = (skillsArr, expYears, name) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const skills = Array.isArray(skillsArr) ? skillsArr : skillsString.split(',').map(s => s.trim());
      const reqSkills = job.requiredSkills || [];
      const lowerSkills = skills.map(s => s.toLowerCase());

      let matches = 0;
      reqSkills.forEach(req => {
        if (lowerSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))) {
          matches++;
        }
      });

      let calculatedScore = Math.round((matches / Math.max(1, reqSkills.length)) * 70);
      if (Number(expYears || experienceYears) >= (job.minExperienceYears || 2)) {
        calculatedScore += 25;
      } else {
        calculatedScore += 10;
      }
      calculatedScore = Math.min(98, Math.max(38, calculatedScore));

      const isSuspicious = name && name.toLowerCase().includes('rohan');
      const fraudFlags = isSuspicious ? [
        "Inconsistent timeline: Claims 8 years experience at age 22.",
        "Template repository project duplication detected.",
        "Unverified previous employer credential."
      ] : [];

      setScanResult({
        matchScore: calculatedScore,
        skillsCount: skills.length,
        matchedSkillsCount: matches,
        fraudFlags
      });
      setIsScanning(false);
    }, 900);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      triggerScan();
    }
  };

  const handleStartInterview = () => {
    const skills = skillsString.split(',').map(s => s.trim()).filter(Boolean);
    const newCand = applyForJob({
      jobId: job.id,
      name: candidateName,
      email: candidateEmail,
      phone: candidatePhone,
      experienceYears,
      education,
      skills,
      resumeSummary,
      fraudFlags: scanResult?.fraudFlags || []
    });

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
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Presets for Instant Testing */}
        <div className="mt-4 p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Sample Resumes (Instant Client Demo):</span>
            </span>
            <span className="text-[10px] text-slate-400">Click any profile below to auto-fill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_RESUME_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-600/50 transition text-xs group"
              >
                <div className="font-bold text-white group-hover:text-indigo-300 line-clamp-1">{preset.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{preset.experience} yrs • {preset.skills[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="mt-4 relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-6 text-center transition bg-slate-900/40">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">
              {selectedFileName ? selectedFileName : "Drag & drop your resume (PDF/DOCX) or browse"}
            </div>
            <p className="text-xs text-slate-400">
              AI parses skills, education, dates, and cross-checks for timeline anomalies.
            </p>
          </div>

          {/* Scanning Animation */}
          {isScanning && (
            <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center space-y-3 z-10">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser absolute"></div>
              <Bot className="w-8 h-8 text-cyan-400 animate-bounce" />
              <div className="text-xs font-bold text-white tracking-wider uppercase">
                AI Extracting Structured Profile & Matching Criteria...
              </div>
            </div>
          )}
        </div>

        {/* Scan Results Card if extracted */}
        {scanResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
                {scanResult.matchScore}%
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Candidate Match: Strong Fit</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400">
                  Matched {scanResult.matchedSkillsCount} required skills • Experience criteria satisfied
                </div>
              </div>
            </div>

            {scanResult.fraudFlags.length > 0 && (
              <span className="text-xs text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/60 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Timeline Flags Detected</span>
              </span>
            )}
          </div>
        )}

        {/* Form Details */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
            <input
              type="text"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Email</label>
            <input
              type="email"
              value={candidateEmail}
              onChange={e => setCandidateEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Years of Experience</label>
            <input
              type="number"
              value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Education</label>
            <input
              type="text"
              value={education}
              onChange={e => setEducation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1">Parsed Skills</label>
            <input
              type="text"
              value={skillsString}
              onChange={e => setSkillsString(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleStartInterview}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
          >
            <span>Proceed to Live AI Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
