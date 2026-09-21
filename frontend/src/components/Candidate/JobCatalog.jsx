import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import ResumeUploadModal from './ResumeUploadModal';
import { FadeInUp } from '../ui/Primitives';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  BrainCircuit, 
  CheckCircle2, 
  GraduationCap, 
  Globe,
  Building2,
  Flame,
  Zap,
  Target
} from 'lucide-react';

export default function JobCatalog() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { jobs, setActiveJobId, currentUser } = useRecruitment();
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [filterScope, setFilterScope] = useState('ALL'); // 'ALL' | 'BEST_MATCH'
  const [backendMatches, setBackendMatches] = useState({});
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Sync route jobId param to modal
  useEffect(() => {
    if (jobId && jobs.length > 0) {
      const target = jobs.find(j => String(j.id) === String(jobId));
      if (target) {
        setActiveJobId(target.id);
        setSelectedJobForApply(target);
      }
    }
  }, [jobId, jobs, setActiveJobId]);

  const handleApplyClick = (job) => {
    setActiveJobId(job.id);
    navigate(`/jobs/${job.id}/apply`);
  };

  const handleCloseModal = () => {
    setSelectedJobForApply(null);
    if (jobId) {
      navigate('/jobs');
    }
  };

  // ── Candidate Profile Attributes ───────────────────────────────────────────
  const candidateSkills = useMemo(() => {
    return (currentUser?.skills || []).map(s => String(s).toLowerCase().trim());
  }, [currentUser?.skills]);

  const candidateExp = Number(currentUser?.experience_years || currentUser?.experienceYears || 0);
  const candidateRole = (currentUser?.job_role || currentUser?.jobRole || '').toLowerCase();

  const hasCandidateProfile = useMemo(() => {
    return Boolean(
      (currentUser?.skills && currentUser.skills.length > 0) ||
      currentUser?.job_role || currentUser?.jobRole ||
      currentUser?.resume_text || currentUser?.resumeText ||
      currentUser?.experience_years || currentUser?.experienceYears
    );
  }, [currentUser]);

  // ── Authoritative Backend Batch Matching ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (!hasCandidateProfile || jobs.length === 0) {
      setBackendMatches({});
      return;
    }
    setIsMatchingLoading(true);
    api.batchMatchJobs({
      name: currentUser?.name || '',
      jobRole: currentUser?.job_role || currentUser?.jobRole || '',
      experienceYears: Number(currentUser?.experience_years ?? currentUser?.experienceYears ?? 0),
      skills: currentUser?.skills || [],
      education: currentUser?.education || '',
      resumeSummary: currentUser?.resume_summary || currentUser?.resumeSummary || '',
      resumeText: currentUser?.resume_text || currentUser?.resumeText || '',
    }).then(res => {
      if (isMounted && res?.matches) {
        setBackendMatches(res.matches);
      }
    }).catch(err => {
      console.warn('[JobCatalog] batchMatchJobs error:', err);
    }).finally(() => {
      if (isMounted) setIsMatchingLoading(false);
    });
    return () => { isMounted = false; };
  }, [hasCandidateProfile, currentUser?.id, currentUser?.skills, currentUser?.jobRole, currentUser?.experienceYears, jobs.length]);

  // ── Rank Jobs by Authoritative Match Scores ─────────────────────────────────
  const rankedJobs = useMemo(() => {
    return jobs.map(job => {
      let score = null;
      let matchedSkills = [];
      let missingSkills = [];
      let explanation = '';

      if (backendMatches && backendMatches[job.id]) {
        const bm = backendMatches[job.id];
        score = bm.match_score ?? 0;
        matchedSkills = bm.matched_skills || [];
        missingSkills = bm.missing_skills || [];
        explanation = bm.explanation || '';
      } else if (hasCandidateProfile) {
        // Transitional non-inflated estimation without artificial score floors
        const reqSkills = (job.requiredSkills || []).map(s => String(s).toLowerCase());
        const matched = (job.requiredSkills || []).filter(req => 
          candidateSkills.some(cs => cs.includes(req.toLowerCase()) || req.toLowerCase().includes(cs))
        );
        matchedSkills = matched;
        const skillRatio = reqSkills.length > 0 ? (matched.length / reqSkills.length) : 0;
        let est = Math.round(skillRatio * 60);
        // Only grant experience if at least some skills align
        if (skillRatio > 0.2 && candidateExp >= (job.minExperienceYears || 2)) {
          est += 20;
        }
        if (candidateRole && (job.title.toLowerCase().includes(candidateRole) || candidateRole.includes(job.title.toLowerCase()))) {
          est += 20;
        }
        score = Math.min(100, Math.max(0, est));
      }

      return {
        ...job,
        matchScore: score,
        matchedSkillsCount: matchedSkills.length,
        matchExplanation: explanation,
        hasStrongMatch: score !== null && score >= 75
      };
    }).sort((a, b) => {
      if (hasCandidateProfile) {
        return (b.matchScore ?? -1) - (a.matchScore ?? -1); // Show highest match jobs FIRST
      }
      return 0;
    });
  }, [jobs, backendMatches, hasCandidateProfile, candidateSkills, candidateExp, candidateRole]);

  const displayedJobs = useMemo(() => {
    if (filterScope === 'BEST_MATCH') {
      return rankedJobs.filter(j => j.matchScore !== null && j.matchScore >= 75);
    }
    return rankedJobs;
  }, [rankedJobs, filterScope]);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-12 border border-slate-200 dark:border-white/[0.08] text-center shadow-2xl">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/15 via-purple-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span>Autonomous AI Talent Intelligence Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            AI-Powered Hiring, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 bg-clip-text text-transparent">
              Fair, Transparent & Adaptive
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Screen resumes instantly, engage in real-time adaptive voice/video interviews, and receive automated skill-gap feedback with personalized career recommendations.
          </p>

          {/* Quick Stats */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-md">
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">&lt; 3 Mins</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Instant Screening & Parsing</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-md">
              <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">Adaptive AI</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time Cross Questioning</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#0B0F19]/90 border border-slate-200 dark:border-white/[0.08] shadow-md col-span-2 sm:col-span-1">
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">Zero Bias</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Skill-Evidence Scorecard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Roles Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Open Technical & Product Roles</h2>
              {candidateSkills.length > 0 && (
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span>Ranked by Your Resume Skills</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a position to test automatic resume parsing and live AI interview assessment.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterScope('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                filterScope === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Roles ({jobs.length})
            </button>
            {hasCandidateProfile && (
              <button
                onClick={() => setFilterScope('BEST_MATCH')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-bold transition ${
                  filterScope === 'BEST_MATCH'
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Best Matches ({rankedJobs.filter(j => j.matchScore !== null && j.matchScore >= 75).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedJobs.map((job, idx) => (
            <FadeInUp key={job.id} delay={idx * 80}>
            <div
              className={`glass-card-hover p-6 rounded-3xl border flex flex-col justify-between space-y-5 h-full relative group overflow-hidden shadow-xl transition-all duration-300 ${
                job.hasStrongMatch 
                  ? 'border-indigo-500/40 ring-1 ring-indigo-500/20 shadow-indigo-500/5' 
                  : 'border-slate-200 dark:border-white/[0.08] hover:border-indigo-500/40'
              }`}
            >
              {/* Subtle top iridescent hairline accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {job.department}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{job.companyName || 'SparkX Technologies'}</span>
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">{job.title}</h3>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      {job.status}
                    </span>
                    {hasCandidateProfile && job.matchScore !== null && (
                      <span 
                        title={job.matchExplanation || ''}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center space-x-1 ${
                          job.matchScore >= 75 
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                            : job.matchScore >= 40
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <Flame className={`w-3 h-3 ${job.matchScore >= 75 ? 'text-emerald-500 animate-pulse' : job.matchScore >= 40 ? 'text-amber-500' : 'text-rose-400'}`} />
                        <span>{job.matchScore}% Match</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{job.experience}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="line-clamp-1">{job.education}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {job.description}
                </p>

                {/* Required Skills */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.requiredSkills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#06080E] text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-white/[0.08]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply CTA Bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Autonomous Assessment Enabled</span>
                </div>

                <button
                  onClick={() => handleApplyClick(job)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 group-hover:shadow-indigo-500/40"
                >
                  <span>Apply with AI</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
            </FadeInUp>
          ))}
        </div>
      </div>

      {/* Resume Upload / Application Modal */}
      {selectedJobForApply && (
        <ResumeUploadModal
          job={selectedJobForApply}
          onClose={handleCloseModal}
        />
      )}

    </div>
  );
}
