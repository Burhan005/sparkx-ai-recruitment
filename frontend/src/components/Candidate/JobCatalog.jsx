import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import ResumeUploadModal from './ResumeUploadModal';
import { Button, SearchInput, EmptyState } from '../ui/Primitives';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  BrainCircuit, 
  GraduationCap, 
  Building2,
  Flame,
  Target,
  DollarSign,
  Filter,
  X
} from 'lucide-react';
import { formatJobCTC } from '../../utils/compensationFormatter';

export default function JobCatalog() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { jobs, setActiveJobId, currentUser } = useRecruitment();
  const [filterScope, setFilterScope] = useState('ACTIVE'); // 'ACTIVE' | 'ALL' | 'PAUSED_CLOSED' | 'BEST_MATCH'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [backendMatches, setBackendMatches] = useState({});
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);

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
    if (job.status !== 'Active') return;
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

  const hasCandidateProfile = useMemo(() => {
    return Boolean(
      (currentUser?.skills && currentUser.skills.length > 0) ||
      currentUser?.job_role || currentUser?.jobRole ||
      currentUser?.resume_text || currentUser?.resumeText ||
      currentUser?.experience_years || currentUser?.experienceYears
    );
  }, [currentUser]);

  // ── Authoritative Backend Batch Matching (Zero Fake Client Scores) ─────────
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
      }

      return {
        ...job,
        matchScore: score,
        matchedSkillsCount: matchedSkills.length,
        matchExplanation: explanation,
        hasStrongMatch: score !== null && score >= 75
      };
    }).sort((a, b) => {
      if (hasCandidateProfile && (b.matchScore !== null || a.matchScore !== null)) {
        return (b.matchScore ?? -1) - (a.matchScore ?? -1); // Show highest match jobs FIRST
      }
      return 0;
    });
  }, [jobs, backendMatches, hasCandidateProfile]);

  // ── Dynamic Filter Options from Authoritative Job Data ─────────────────────
  const departments = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.department).filter(Boolean))).sort();
  }, [jobs]);

  const locations = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.location).filter(Boolean))).sort();
  }, [jobs]);

  const activeJobsCount = useMemo(() => jobs.filter(j => j.status === 'Active').length, [jobs]);
  const pausedClosedCount = useMemo(() => jobs.filter(j => j.status === 'Paused' || j.status === 'Closed').length, [jobs]);
  const bestMatchCount = useMemo(() => rankedJobs.filter(j => j.status === 'Active' && j.matchScore !== null && j.matchScore >= 75).length, [rankedJobs]);

  // ── Search & Filter Application ─────────────────────────────────────────────
  const displayedJobs = useMemo(() => {
    return rankedJobs.filter(job => {
      // Status scope
      if (filterScope === 'ACTIVE' && job.status !== 'Active') return false;
      if (filterScope === 'PAUSED_CLOSED' && (job.status !== 'Paused' && job.status !== 'Closed')) return false;
      if (filterScope === 'BEST_MATCH' && (job.status !== 'Active' || job.matchScore === null || job.matchScore < 75)) return false;

      // Department
      if (selectedDepartment !== 'ALL' && job.department !== selectedDepartment) return false;

      // Location
      if (selectedLocation !== 'ALL' && job.location !== selectedLocation) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = job.title?.toLowerCase().includes(q);
        const matchesDept = job.department?.toLowerCase().includes(q);
        const matchesLoc = job.location?.toLowerCase().includes(q);
        const matchesDesc = job.description?.toLowerCase().includes(q);
        const matchesSkills = (job.requiredSkills || []).some(s => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDept && !matchesLoc && !matchesDesc && !matchesSkills) {
          return false;
        }
      }

      return true;
    });
  }, [rankedJobs, filterScope, selectedDepartment, selectedLocation, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedDepartment !== 'ALL' || selectedLocation !== 'ALL' || filterScope !== 'ACTIVE';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('ALL');
    setSelectedLocation('ALL');
    setFilterScope('ACTIVE');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16 animate-page-enter">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] p-6 sm:p-10 shadow-subtle text-center">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-[#231F1B] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 text-xs font-medium font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" />
            <span>AI Talent Intelligence Platform</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Explore Open Roles & Verified Opportunities
          </h1>

          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover roles with transparent requirements. Apply with automated resume parsing, complete live interactive assessments, and track every stage in real-time.
          </p>

          {/* Quick Metrics */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
              <div className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">&lt; 3 Mins</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Automated Parsing</div>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
              <div className="text-base font-bold text-brand-700 dark:text-brand-300 font-mono">Adaptive AI</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Technical & Scenario Fit</div>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] col-span-2 sm:col-span-1">
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">Evidence-Based</div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Objective Scoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-subtle space-y-4">
        
        {/* Top Search & Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search Input */}
          <div className="sm:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by role title, skill, or keyword..."
              className="w-full"
            />
          </div>

          {/* Department Selector */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF8F5] hover:bg-white dark:bg-[#1E1612] dark:hover:bg-[#261C16] border border-[#E8DFD8] dark:border-[#3D2C22] hover:border-[#D5C7BC] dark:hover:border-[#523B2F] rounded-lg text-xs text-stone-900 dark:text-[#EDE8E3] focus:outline-none focus:border-brand-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-subtle"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Location Selector */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#FAF8F5] hover:bg-white dark:bg-[#1E1612] dark:hover:bg-[#261C16] border border-[#E8DFD8] dark:border-[#3D2C22] hover:border-[#D5C7BC] dark:hover:border-[#523B2F] rounded-lg text-xs text-stone-900 dark:text-[#EDE8E3] focus:outline-none focus:border-brand-600 dark:focus:border-amber-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-subtle"
            >
              <option value="ALL">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Scope Tabs & Result Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E8E4DF] dark:border-[#2A2520]">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterScope('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterScope === 'ACTIVE'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-stone-50 dark:bg-[#1E1612] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#251F1B] border border-[#E8DFD8] dark:border-[#38281F]'
              }`}
            >
              Active ({activeJobsCount})
            </button>
            <button
              onClick={() => setFilterScope('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterScope === 'ALL'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-stone-50 dark:bg-[#1E1612] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#251F1B] border border-[#E8DFD8] dark:border-[#38281F]'
              }`}
            >
              All ({jobs.length})
            </button>
            {pausedClosedCount > 0 && (
              <button
                onClick={() => setFilterScope('PAUSED_CLOSED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterScope === 'PAUSED_CLOSED'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-stone-50 dark:bg-[#1E1612] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#251F1B] border border-[#E8DFD8] dark:border-[#38281F]'
                }`}
              >
                Inactive ({pausedClosedCount})
              </button>
            )}
            {hasCandidateProfile && bestMatchCount > 0 && (
              <button
                onClick={() => setFilterScope('BEST_MATCH')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterScope === 'BEST_MATCH'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-stone-50 dark:bg-[#1E1612] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#251F1B] border border-[#E8DFD8] dark:border-[#38281F]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Best Matches ({bestMatchCount})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Showing <strong>{displayedJobs.length}</strong> of {jobs.length} position{jobs.length === 1 ? '' : 's'}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Available Roles Section */}
      <div className="space-y-6">
        
        {displayedJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No matching roles found"
            description="No open positions match your current search criteria. Try adjusting your keyword search or resetting active filters."
            actionLabel="Reset All Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedJobs.map((job, idx) => (
              <div key={job.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
                <div
                  className={`interactive-card p-5 sm:p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border flex flex-col justify-between space-y-4 h-full relative group shadow-subtle hover:shadow-depth-2 transition-all duration-150 ${
                    job.hasStrongMatch 
                      ? 'border-brand-500/80 dark:border-brand-500/70 ring-1 ring-brand-500/30' 
                      : 'border-[#E8E4DF] dark:border-[#2A2520] hover:border-brand-400 dark:hover:border-brand-600'
                  }`}
                >

                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                            {job.department}
                          </span>
                          <span className="text-stone-400">•</span>
                          <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-stone-400" />
                            <span>{job.companyName || 'SparkX Technologies'}</span>
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {job.title}
                        </h3>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          job.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : job.status === 'Paused'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                            : 'bg-stone-500/10 text-stone-500 dark:text-stone-400 border-stone-500/25'
                        }`}>
                          {job.status}
                        </span>

                        {/* Authoritative backend match score — displayed only when confirmed */}
                        {hasCandidateProfile && job.matchScore !== null && (
                          <span 
                            title={job.matchExplanation || 'Calculated from backend skill alignment'}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${
                              job.matchScore >= 75 
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                                : job.matchScore >= 40
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            <Flame className={`w-3 h-3 ${job.matchScore >= 75 ? 'text-emerald-500' : job.matchScore >= 40 ? 'text-amber-500' : 'text-stone-400'}`} />
                            <span>{job.matchScore}% Match</span>
                          </span>
                        )}

                        {isMatchingLoading && hasCandidateProfile && job.matchScore === null && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-stone-400 bg-stone-100 dark:bg-[#231F1B] border border-stone-200 dark:border-stone-800 animate-pulse">
                            Evaluating fit...
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-300">
                      <span className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        <span>{job.location}</span>
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                        <span>{job.experience}</span>
                      </span>
                      {job.education && (
                        <>
                          <span className="text-stone-400">•</span>
                          <span className="flex items-center space-x-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                            <span className="line-clamp-1">{job.education}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Job Advertised Compensation */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold">
                        <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                        <span>{formatJobCTC(job)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                      {job.description}
                    </p>

                    {/* Required Skills */}
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Required Skills:</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.requiredSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-[#231F1B] text-stone-700 dark:text-stone-300 text-xs font-medium border border-[#E8E4DF] dark:border-[#2A2520] transition-all duration-150">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Apply CTA Bar */}
                  <div className="pt-3.5 border-t border-stone-200 dark:border-[#2A2520] flex items-center justify-between">
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 font-medium">
                      <BrainCircuit className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Interactive Skills Assessment Available</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/resume-analyzer?jobId=${job.id}`)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-[#C27803] dark:text-amber-400 border border-amber-500/30 transition flex items-center gap-1.5"
                        title="Analyze your resume against this job description"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Match Analyzer</span>
                      </button>

                      {job.status === 'Active' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          iconRight={ChevronRight}
                          onClick={() => handleApplyClick(job)}
                        >
                          Apply Now
                        </Button>
                      ) : job.status === 'Paused' ? (
                      <button
                        disabled
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 cursor-not-allowed"
                      >
                        Applications Paused
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 dark:bg-[#231F1B] text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-800 cursor-not-allowed"
                      >
                        Position Closed
                      </button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ))}
          </div>
        )}

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

