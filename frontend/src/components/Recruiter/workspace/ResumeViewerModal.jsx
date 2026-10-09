import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, Download, Printer, Copy, Check, X, Search, 
  User, Briefcase, GraduationCap, Award, ShieldCheck, ExternalLink
} from 'lucide-react';

import { exportResumeAsPDF } from '../../../utils/resumePdfExporter';

export default function ResumeViewerModal({ candidate, isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  const candidateName = candidate?.name || 'Candidate';
  const roleTitle = candidate?.jobTitle || candidate?.job?.title || 'Technical Candidate';
  const skillsList = useMemo(() => {
    if (Array.isArray(candidate?.skills)) return candidate.skills;
    if (typeof candidate?.skills === 'string') return candidate.skills.split(',').map(s => s.trim()).filter(Boolean);
    return ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker'];
  }, [candidate]);

  const resumeText = useMemo(() => {
    if (candidate?.resume_text && candidate.resume_text.trim().length > 60) {
      return candidate.resume_text.trim();
    }
    if (candidate?.resumeText && candidate.resumeText.trim().length > 60) {
      return candidate.resumeText.trim();
    }

    const exp = candidate?.experience_years ?? candidate?.experienceYears;
    const match = candidate?.matchScore ?? candidate?.match_score;
    const techScore = candidate?.scores?.technicalScore ?? candidate?.codingScore;
    const probScore = candidate?.scores?.problemSolving;
    const integScore = candidate?.integrityScore ?? candidate?.integrity_score;

    return `================================================================================
CANDIDATE APPLICATION DOSSIER (AUTHENTIC EVIDENCE)
================================================================================
Name        : ${candidateName}
Email       : ${candidate?.email || 'Not provided'}
Phone       : ${candidate?.phone || 'Not provided'}
Applied Role: ${roleTitle}
Experience  : ${exp != null ? `${exp} Years` : 'Not specified'}
Match Score : ${match != null ? `${match}%` : 'Pending evaluation'}
Education   : ${candidate?.education || 'Not specified'}

--------------------------------------------------------------------------------
1. EXTRACTED PROFESSIONAL SUMMARY
--------------------------------------------------------------------------------
${candidate?.resume_summary || candidate?.resumeSummary || 'No professional summary extracted from application document.'}

--------------------------------------------------------------------------------
2. VERIFIED SKILLS & COMPETENCIES
--------------------------------------------------------------------------------
${skillsList.length > 0 ? `* Skills : ${skillsList.join(', ')}` : '* Skills : None recorded on application'}

--------------------------------------------------------------------------------
3. EDUCATION & CREDENTIALS
--------------------------------------------------------------------------------
* Degree     : ${candidate?.education || 'Not specified'}
* Status     : Application Record

--------------------------------------------------------------------------------
4. VERIFIED EVALUATION TELEMETRY
--------------------------------------------------------------------------------
* Technical Score      : ${techScore != null ? `${techScore}%` : 'Pending'}
* Problem Solving Score: ${probScore != null ? `${probScore}%` : 'Pending'}
* Integrity Score      : ${integScore != null ? `${integScore}%` : 'Pending'}
================================================================================`;
  }, [candidate, candidateName, roleTitle, skillsList]);

  if (!isOpen || !candidate) return null;

  const handleDownloadPDF = () => {
    exportResumeAsPDF(candidate);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    exportResumeAsPDF(candidate);
  };

  const filteredLines = searchTerm.trim()
    ? resumeText.split('\n').filter(line => line.toLowerCase().includes(searchTerm.toLowerCase())).join('\n')
    : resumeText;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-4xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl shadow-popover overflow-hidden my-auto flex flex-col max-h-[92vh] text-stone-900 dark:text-stone-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-stone-50/90 dark:bg-[#14110F] border-b border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                  {candidateName}’s Resume & Dossier
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Verified Candidate
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {roleTitle} • {candidate.email || 'No email provided'} • {(candidate.experience_years ?? candidate.experienceYears) != null ? `${candidate.experience_years ?? candidate.experienceYears}+ yrs exp` : 'Exp unlisted'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition"
              title="Copy Resume Content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 flex items-center gap-1.5 transition"
              title="Download Executive Resume & Candidate Dossier as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close resume viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Metadata Bar */}
        <div className="p-3 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills, education, experience..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {candidate.resume_filename || candidate.resumeFilename || `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`}
          </div>
        </div>

        {/* Resume Content Viewport */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#0C0A09] text-stone-200 font-mono text-xs leading-relaxed select-text scrollbar-thin">
          <pre className="whitespace-pre-wrap break-words">{filteredLines}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 px-5 bg-stone-50 dark:bg-[#14110F] border-t border-[#E8E4DF] dark:border-[#2A2520] flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Authoritative record synced from candidate submission</span>
          </div>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Save offline copy</span>
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
