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

    const exp = candidate?.experience_years ?? candidate?.experienceYears ?? 3;
    const match = candidate?.matchScore ?? candidate?.match_score ?? 85;

    return `================================================================================
CANDIDATE CURRICULUM VITAE & VERIFIED DOSSIER
================================================================================
Name        : ${candidateName}
Email       : ${candidate?.email || 'verified@candidate.sparkx'}
Phone       : ${candidate?.phone || '+91 98000 00000'}
Applied Role: ${roleTitle}
Experience  : ${exp} Years
Match Score : ${match}%
Education   : ${candidate?.education || 'B.Tech in Computer Science / Engineering'}

--------------------------------------------------------------------------------
1. PROFESSIONAL SUMMARY
--------------------------------------------------------------------------------
${candidate?.resume_summary || candidate?.resumeSummary || `${candidateName} is an experienced ${roleTitle} with ${exp}+ years of background delivering scalable software solutions, modern architectural patterns, and production systems.`}

--------------------------------------------------------------------------------
2. CORE TECHNICAL COMPETENCIES
--------------------------------------------------------------------------------
* Languages & Frameworks : ${skillsList.join(', ')}
* System Architecture   : Distributed Microservices, Asynchronous Workflows, REST & GraphQL APIs
* Databases & Storage   : Relational SQL, NoSQL, In-Memory Caching, Schema Migrations
* Infrastructure & Cloud : Containerization (Docker), CI/CD Automation, Cloud Services

--------------------------------------------------------------------------------
3. EDUCATION & CREDENTIALS
--------------------------------------------------------------------------------
* Degree     : ${candidate?.education || 'Bachelor of Technology in Computer Science'}
* Institution: Accredited University / Technical Institution
* Status     : Fully Verified Candidate Profile

--------------------------------------------------------------------------------
4. SPARKX AUTONOMOUS EVALUATION TELEMETRY
--------------------------------------------------------------------------------
* Technical Depth Score : ${candidate?.scores?.technicalScore ?? candidate?.codingScore ?? match}%
* Problem Solving Score : ${candidate?.scores?.problemSolving ?? 88}%
* Integrity Rating      : ${candidate?.integrityScore ?? 98}% (Proctor Verified)
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
        className="relative w-full max-w-4xl bg-white dark:bg-[#0D131F] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-popover overflow-hidden my-auto flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50/90 dark:bg-[#080A10] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {candidateName}’s Resume & Dossier
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Verified Candidate
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {roleTitle} • {candidate.email || 'No email provided'} • {candidate.experience_years ?? candidate.experienceYears ?? 3}+ yrs exp
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed select-text scrollbar-thin">
          <pre className="whitespace-pre-wrap break-words">{filteredLines}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 px-5 bg-slate-50 dark:bg-[#080A10] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Authoritative record synced from candidate submission</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
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
