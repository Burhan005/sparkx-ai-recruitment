import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { fuzzySkillMatch } from '../../utils/skillMatcher';
import ResumeUploadModal from './ResumeUploadModal';
import { FadeInUp, Button } from '../ui/Primitives';
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
  Target,
  DollarSign
} from 'lucide-react';
import { formatJobCTC } from '../../utils/compensationFormatter';

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
        const reqSkills = job.requiredSkills || [];
        const matched = reqSkills.filter(req => 
          candidateSkills.some(cs => fuzzySkillMatch(cs, req))
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
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#14161F] border border-[#E8E8E4] dark:border-[#222634] p-6 sm:p-10 shadow-subtle text-center">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-[#E8E8E4] dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>AI Talent Intelligence Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explore Open Roles & Verified Assessments
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Apply with automated resume parsing, complete live interactive assessments, and track every stage of your application in real-time.
          </p>

          {/* Quick Metrics */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-slate-800">
              <div className="text-base font-bold text-slate-900 dark:text-white font-mono">&lt; 3 Mins</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Automated Parsing</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-slate-800">
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">Adaptive AI</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Technical & Scenario Fit</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">Zero Bias</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Objective Scoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Roles Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Open Technical & Product Roles</h2>
              {candidateSkills.length > 0 && (
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Target className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Ranked by Your Resume Skills</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a position to test automatic resume parsing and live AI interview assessment.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterScope('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterScope === 'ALL'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All Roles ({jobs.length})
            </button>
            {hasCandidateProfile && (
              <button
                onClick={() => setFilterScope('BEST_MATCH')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterScope === 'BEST_MATCH'
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
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
              className={`p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#14161F] border flex flex-col justify-between space-y-4 h-full relative group shadow-subtle hover:shadow-depth-2 transition-all duration-150 ${
                job.hasStrongMatch 
                  ? 'border-blue-500/80 dark:border-blue-500/70' 
                  : 'border-[#E8E8E4] dark:border-[#222634] hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >

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

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{job.experience}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="line-clamp-1">{job.education}</span>
                  </span>
                </div>

                {/* Job Advertised Compensation */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold">
                    <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                    <span>{formatJobCTC(job)}</span>
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
              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Autonomous Assessment Enabled</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  iconRight={ChevronRight}
                  onClick={() => handleApplyClick(job)}
                >
                  Apply with AI
                </Button>
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
