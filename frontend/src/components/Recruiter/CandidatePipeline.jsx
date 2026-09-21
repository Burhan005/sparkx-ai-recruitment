import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import CandidateScorecardModal from './CandidateScorecardModal';
import JobCreatorModal from './JobCreatorModal';
import { AnimatedCounter, FadeInUp, SlideIn } from '../ui/Primitives';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Search, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  Briefcase, 
  CheckCircle, 
  MapPin, 
  Clock, 
  GraduationCap, 
  ArrowRight,
  Eye,
  Calendar,
  Mail,
  Video,
  LayoutGrid,
  Columns,
  CheckCircle2,
  TrendingUp,
  Sparkle,
  ArrowRightLeft,
  GripVertical,
  ArrowDown,
  Bot,
  XCircle
} from 'lucide-react';

export default function CandidatePipeline() {
  const navigate = useNavigate();
  const { jobId: routeJobId, candidateId: routeCandidateId } = useParams();
  const { 
    candidates, 
    jobs, 
    activeJob, 
    setActiveJobId, 
    selectedCandidate, 
    setSelectedCandidate,
    switchRole,
    updateCandidateStatus
  } = useRecruitment();

  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'jobs'
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All | Evaluated | Shortlisted | High Risk
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [openMoveMenuId, setOpenMoveMenuId] = useState(null);
  const isDraggingRef = useRef(false);

  // Sync route param for jobId
  useEffect(() => {
    if (routeJobId) {
      setSelectedJobFilter(routeJobId);
      setActiveJobId(routeJobId);
      setActiveTab('candidates');
    }
  }, [routeJobId, setActiveJobId]);

  // Sync route param for candidateId
  useEffect(() => {
    if (routeCandidateId && candidates.length > 0) {
      const match = candidates.find(c => String(c.id) === String(routeCandidateId));
      if (match) {
        setSelectedCandidate(match);
      }
    }
  }, [routeCandidateId, candidates, setSelectedCandidate]);

  const handleOpenCandidate = (cand) => {
    setSelectedCandidate(cand);
    navigate(`/recruiter/candidates/${cand.id}`);
  };

  const handleCloseCandidateModal = () => {
    setSelectedCandidate(null);
    if (routeCandidateId) {
      navigate(routeJobId ? `/recruiter/jobs/${routeJobId}` : '/recruiter');
    }
  };

  // Filter candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesJob = selectedJobFilter === 'ALL' || c.jobId === selectedJobFilter;
    if (!matchesJob) return false;

    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          c.education.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'All') return true;
    if (filterStatus === 'Evaluated') {
      if (c.status === 'Applied' || c.finalDecision === 'Applied') return false;
      return c.status === 'Evaluated' || c.status === 'Under Review' || c.finalDecision === 'Under Review' || (c.scores && c.scores.overall > 0);
    }
    if (filterStatus === 'Shortlisted') return c.finalDecision === 'Shortlisted';
    if (filterStatus === 'High Risk') return c.integrityRisk === 'High';
    return true;
  });

  const totalApplicants = candidates.length;
  const highMatchCount = candidates.filter(c => c.matchScore >= 85).length;
  const integrityFlaggedCount = candidates.filter(c => c.integrityRisk === 'High').length;
  const evaluatedCount = candidates.filter(c => {
    if (c.status === 'Applied' || c.finalDecision === 'Applied') return false;
    return c.status === 'Evaluated' || c.status === 'Under Review' || c.finalDecision === 'Under Review' || (c.scores && c.scores.overall > 0);
  }).length;

  const handleKpiClick = (status, tab = 'candidates', mode = 'list') => {
    setActiveTab(tab);
    if (tab === 'candidates') {
      setFilterStatus(status);
      setDisplayMode(mode);
    }
    const el = document.getElementById('pipeline-content-area');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJobCreated = (newJob) => {
    setActiveTab('jobs');
    setHighlightedJobId(newJob.id);
    setActiveJobId(newJob.id);
    setSuccessBanner(`🎉 Job "${newJob.title}" has been successfully published to your pipeline!`);
    setTimeout(() => setSuccessBanner(''), 6000);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-400 hover:text-white text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner / Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Recruiter Command Center
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Live AI Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
            Intelligent Talent Pipeline & Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Automated screening, adaptive cross-examination dossiers, and integrity verification.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/recruiter/proctor')}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center space-x-2 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>Integrity HUD & Telemetry</span>
          </button>
          
          <button
            onClick={() => setIsJobModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* CARD 1: ACTIVE ROLES */}
        <div 
          onClick={() => handleKpiClick('All', 'jobs')}
          className={`glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500 ${
            activeTab === 'jobs' 
              ? 'ring-2 ring-indigo-500/80 shadow-lg shadow-indigo-500/20 bg-indigo-500/5' 
              : ''
          }`}
          title="Click to view all active job openings"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Roles</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            <AnimatedCounter value={jobs.length} /> <span className="text-xs font-semibold text-slate-400">Openings</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-[11px]">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center space-x-1">
              <span>View Roles ({jobs.length})</span>
              <ChevronRight className="w-3 h-3" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Click to view</span>
          </div>
        </div>

        {/* CARD 2: TOTAL APPLICANTS */}
        <div 
          onClick={() => handleKpiClick('All', 'candidates', 'list')}
          className={`glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-cyan-400 before:to-blue-500 ${
            activeTab === 'candidates' && filterStatus === 'All'
              ? 'ring-2 ring-cyan-500/80 shadow-lg shadow-cyan-500/20 bg-cyan-500/5' 
              : ''
          }`}
          title="Click to view full list of all applicants"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Applicants</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            <AnimatedCounter value={totalApplicants} />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-[11px]">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center space-x-1">
              <span>View All List ({totalApplicants})</span>
              <ChevronRight className="w-3 h-3" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Click to view</span>
          </div>
        </div>

        {/* CARD 3: AI EVALUATED */}
        <div 
          onClick={() => handleKpiClick('Evaluated', 'candidates', 'list')}
          className={`glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-emerald-400 before:to-teal-500 ${
            activeTab === 'candidates' && filterStatus === 'Evaluated'
              ? 'ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/20 bg-emerald-500/5' 
              : ''
          }`}
          title="Click to view list of AI evaluated candidates"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Evaluated</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 dark:text-emerald-400 mt-3 tracking-tight">
            <AnimatedCounter value={evaluatedCount} />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
              <span>View Evaluated List ({evaluatedCount})</span>
              <ChevronRight className="w-3 h-3" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Click to view</span>
          </div>
        </div>

        {/* CARD 4: INTEGRITY ALERTS */}
        <div 
          onClick={() => handleKpiClick('High Risk', 'candidates', 'list')}
          className={`glass-card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-rose-500 before:to-amber-500 ${
            activeTab === 'candidates' && filterStatus === 'High Risk'
              ? 'ring-2 ring-rose-500/80 shadow-lg shadow-rose-500/20 bg-rose-500/5' 
              : ''
          }`}
          title="Click to view list of flagged profiles"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Integrity Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-500 dark:text-rose-400 mt-3 tracking-tight">
            <AnimatedCounter value={integrityFlaggedCount} />
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-[11px]">
            <span className="text-rose-500 dark:text-rose-400 font-bold flex items-center space-x-1">
              <span>View Flagged List ({integrityFlaggedCount})</span>
              <ChevronRight className="w-3 h-3" />
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Click to view</span>
          </div>
        </div>

      </div>

      {/* Main Mode Switcher: Candidate Pipeline vs Active Job Openings */}
      <div id="pipeline-content-area" className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center space-x-2 pb-2.5 border-b-2 transition ${
              activeTab === 'candidates'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Candidate Pipeline ({filteredCandidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center space-x-2 pb-2.5 border-b-2 transition ${
              activeTab === 'jobs'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Active Job Openings ({jobs.length})</span>
            {highlightedJobId && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsJobModalOpen(true)}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post Another Role</span>
        </button>
      </div>

      {/* VIEW A: ACTIVE JOB OPENINGS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => {
              const isNewlyCreated = highlightedJobId === job.id;
              const applicantsForThisJob = candidates.filter(c => c.jobId === job.id);

              return (
                <div
                  key={job.id}
                  className={`glass-card-hover p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                    isNewlyCreated
                      ? 'border-cyan-500 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-500/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            {job.department}
                          </span>
                          {isNewlyCreated && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-500 border border-cyan-500/40 animate-pulse">
                              ✨ Newly Created Job
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {job.status || 'Active'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.experience}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {applicantsForThisJob.length} Applicants
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Required Competencies:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {job.requiredSkills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {job.questions && job.questions.length > 0 && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 text-xs space-y-1">
                        <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                          <span className="flex items-center space-x-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Question Set Synthesized ({job.questions.length})</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Adaptive Active</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-1">
                          Q1: {job.questions[0]?.prompt}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedJobFilter(job.id);
                        setActiveJobId(job.id);
                        setActiveTab('candidates');
                        navigate(`/recruiter/jobs/${job.id}`);
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <span>View Applicants ({applicantsForThisJob.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveJobId(job.id);
                        switchRole('candidate');
                        navigate(`/jobs/${job.id}/apply`);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-200 dark:border-slate-800"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Test Candidate View</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: CANDIDATE PIPELINE */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          
          {/* Filter, Search & View Switcher Bar */}
          <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name, skill, university..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'All', label: 'All Status' },
                { id: 'Evaluated', label: 'AI Evaluated' },
                { id: 'Shortlisted', label: 'Shortlisted' },
                { id: 'High Risk', label: '⚠️ High Risk Flags' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    filterStatus === f.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* View Mode Switcher (Kanban vs Grid) */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shrink-0 self-end lg:self-center shadow-inner">
              <button
                onClick={() => setDisplayMode('kanban')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  displayMode === 'kanban'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Kanban Board View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setDisplayMode('list')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  displayMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Detailed Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>

          </div>

          {/* Job Role Filter Quick Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold text-[11px] whitespace-nowrap uppercase tracking-wider">Role Scope:</span>
            <button
              onClick={() => {
                setSelectedJobFilter('ALL');
                navigate('/recruiter');
              }}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition ${
                selectedJobFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All Roles ({candidates.length})
            </button>
            {jobs.map(j => (
              <button
                key={j.id}
                onClick={() => {
                  setSelectedJobFilter(j.id);
                  setActiveJobId(j.id);
                  navigate(`/recruiter/jobs/${j.id}`);
                }}
                className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap text-[11px] transition ${
                  selectedJobFilter === j.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {j.title}
              </button>
            ))}
          </div>

          {/* Active Filter Notification Bar */}
          {filterStatus !== 'All' && (
            <div className="p-3 px-4 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">
                  Showing <strong>{filteredCandidates.length}</strong> candidate(s) filtered by: <strong className="text-indigo-600 dark:text-indigo-400">{filterStatus}</strong>
                </span>
              </div>
              <button
                onClick={() => setFilterStatus('All')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <span>Clear Filter (Show All {candidates.length})</span>
              </button>
            </div>
          )}

          {/* CANDIDATE PIPELINE VIEW MODES */}
          {filteredCandidates.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-2xl">
              <Users className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No candidates match this criteria</h3>
              <p className="text-xs text-slate-500 mt-1">Try resetting your search query or role scope.</p>
            </div>
          ) : displayMode === 'kanban' ? (
            /* KANBAN BOARD VIEW */
            <div className="w-full flex items-start gap-3 sm:gap-4 overflow-x-auto pb-6 pt-1 px-1 scrollbar-thin">
              {(() => {
                const getCandidateStage = (c) => {
                  const status = c.status || 'Applied';
                  const decision = c.finalDecision || status;

                  // 1. Explicit Decisions (Selected / Offered / Rejected)
                  if (['Selected', 'Offered', 'Rejected'].includes(decision) || ['Selected', 'Offered', 'Rejected'].includes(status)) {
                    return 'decided';
                  }

                  // 2. Explicit Shortlisted
                  if (decision === 'Shortlisted' || status === 'Shortlisted') {
                    return 'shortlisted';
                  }

                  // 3. Explicit Screening / Applied stage (MUST check before heuristic fallback)
                  if (status === 'Applied' || status === 'Screening' || decision === 'Applied' || decision === 'Screening') {
                    return 'screening';
                  }

                  // 4. Explicit Interview stage
                  if (status === 'Interview' || status === 'Interview Scheduled' || decision === 'Interview' || decision === 'Interview Scheduled') {
                    return 'scheduled';
                  }

                  // 5. Explicit Under Review / AI Evaluated
                  if (status === 'Under Review' || decision === 'Under Review' || status === 'Evaluated' || decision === 'Evaluated') {
                    return 'evaluated';
                  }

                  // 6. Heuristic fallbacks for unclassified legacy data
                  if (c.interviewScheduledAt || c.interview_scheduled_at) {
                    return 'scheduled';
                  }
                  if (c.codingScore != null || c.coding_score != null || (c.scores && c.scores.overall > 0) || c.interviewSummary) {
                    return 'evaluated';
                  }

                  return 'screening';
                };

                const handleStageDrop = async (candId, targetStageId) => {
                  setDragOverStage(null);
                  setDraggedCandidateId(null);
                  if (!candId) return;

                  const currentCand = candidates.find(c => c.id === candId);
                  if (!currentCand) return;

                  const currentStage = getCandidateStage(currentCand);
                  if (currentStage === targetStageId) return;

                  const stageToStatus = {
                    screening: 'Applied',
                    scheduled: 'Interview',
                    evaluated: 'Under Review',
                    shortlisted: 'Shortlisted',
                    decided: 'Selected'
                  };

                  const stageNames = {
                    screening: 'Screening',
                    scheduled: 'Interview Scheduled',
                    evaluated: 'AI Evaluated',
                    shortlisted: 'Shortlisted',
                    decided: 'Decisions'
                  };

                  const targetStatus = stageToStatus[targetStageId] || 'Applied';
                  await updateCandidateStatus(candId, targetStatus);
                  setSuccessBanner(`✓ Moved ${currentCand.name} to ${stageNames[targetStageId] || targetStatus}`);
                  setTimeout(() => setSuccessBanner(''), 4500);

                  if (targetStageId === 'shortlisted' || targetStatus === 'Selected') {
                    confetti({
                      particleCount: 80,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                  }
                };

                const stages = [
                  {
                    id: 'screening',
                    name: 'Screening',
                    subtitle: 'New applicants & screening',
                    icon: Users,
                    dotColor: 'bg-blue-500',
                    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    activeRing: 'ring-blue-500/60 border-blue-400 dark:border-blue-500 bg-blue-500/5',
                    dropBg: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300',
                    items: filteredCandidates.filter(c => getCandidateStage(c) === 'screening')
                  },
                  {
                    id: 'scheduled',
                    name: 'Interview Scheduled',
                    subtitle: 'Authorized for assessment',
                    icon: Calendar,
                    dotColor: 'bg-cyan-500',
                    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
                    activeRing: 'ring-cyan-500/60 border-cyan-400 dark:border-cyan-500 bg-cyan-500/5',
                    dropBg: 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
                    items: filteredCandidates.filter(c => getCandidateStage(c) === 'scheduled')
                  },
                  {
                    id: 'evaluated',
                    name: 'AI Evaluated',
                    subtitle: 'Assessment & interview done',
                    icon: Bot,
                    dotColor: 'bg-indigo-500',
                    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                    activeRing: 'ring-indigo-500/60 border-indigo-400 dark:border-indigo-500 bg-indigo-500/5',
                    dropBg: 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
                    items: filteredCandidates.filter(c => getCandidateStage(c) === 'evaluated')
                  },
                  {
                    id: 'shortlisted',
                    name: 'Shortlisted',
                    subtitle: 'Top-tier candidates',
                    icon: Sparkles,
                    dotColor: 'bg-emerald-500',
                    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    activeRing: 'ring-emerald-500/60 border-emerald-400 dark:border-emerald-500 bg-emerald-500/5',
                    dropBg: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
                    items: filteredCandidates.filter(c => getCandidateStage(c) === 'shortlisted')
                  },
                  {
                    id: 'decided',
                    name: 'Decisions',
                    subtitle: 'Selected / Rejected',
                    icon: CheckCircle2,
                    dotColor: 'bg-purple-500',
                    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                    activeRing: 'ring-purple-500/60 border-purple-400 dark:border-purple-500 bg-purple-500/5',
                    dropBg: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300',
                    items: filteredCandidates.filter(c => getCandidateStage(c) === 'decided')
                  }
                ];

                return stages.map(stage => (
                  <div 
                    key={stage.id} 
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverStage !== stage.id) setDragOverStage(stage.id);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      if (dragOverStage !== stage.id) setDragOverStage(stage.id);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverStage(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const candId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
                      handleStageDrop(candId, stage.id);
                    }}
                    className={`kanban-column p-3.5 sm:p-4 rounded-3xl flex flex-col space-y-3 flex-1 min-w-[240px] shrink-0 xl:shrink transition-all duration-200 ${
                      dragOverStage === stage.id
                        ? `ring-2 ${stage.activeRing} shadow-xl kanban-drop-active`
                        : ''
                    }`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${stage.badgeColor}`}>
                          <stage.icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              {stage.name}
                            </h3>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{stage.subtitle}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-white/[0.06]">
                        {stage.items.length}
                      </span>
                    </div>

                    {/* Active Drop Cue inside column */}
                    {dragOverStage === stage.id && draggedCandidateId && (
                      <div className={`p-3 rounded-2xl border-2 border-dashed ${stage.dropBg} text-xs font-bold flex items-center justify-center space-x-2 animate-pulse shadow-md transition-all`}>
                        <ArrowDown className="w-4 h-4 animate-bounce" />
                        <span>Drop to move to {stage.name}</span>
                      </div>
                    )}

                    {/* Column Cards */}
                    <div className="space-y-3 min-h-[160px] flex-1">
                      {stage.items.length === 0 && (!dragOverStage || dragOverStage !== stage.id) ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200/90 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center opacity-60">
                            <stage.icon className="w-5 h-5 text-slate-400" />
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">No candidates in {stage.name}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">Drag or move candidates here</span>
                        </div>
                      ) : (
                        stage.items.map(cand => {
                          const initials = cand.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                          const isHighRisk = cand.integrityRisk === 'High';
                          const isBeingDragged = draggedCandidateId === cand.id;
                          const hasTechScore = cand.codingScore != null || cand.coding_score != null;
                          const techScoreVal = cand.codingScore ?? cand.coding_score;

                          return (
                            <div
                              key={cand.id}
                              draggable
                              onDragStart={(e) => {
                                isDraggingRef.current = true;
                                e.dataTransfer.setData('text/plain', cand.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedCandidateId(cand.id);
                              }}
                              onDragEnd={() => {
                                setDraggedCandidateId(null);
                                setDragOverStage(null);
                                setTimeout(() => {
                                  isDraggingRef.current = false;
                                }, 120);
                              }}
                              onClick={() => {
                                if (isDraggingRef.current) return;
                                handleOpenCandidate(cand);
                              }}
                              className={`kanban-card p-3.5 space-y-2.5 cursor-grab active:cursor-grabbing group hover:border-indigo-500/50 transition-all duration-200 relative select-none ${
                                isBeingDragged 
                                  ? 'opacity-35 border-2 border-dashed border-indigo-500 scale-[0.98] bg-indigo-50/40 dark:bg-indigo-950/20' 
                                  : 'hover:shadow-md'
                              }`}
                            >
                              {/* Top Row: Grip Handle + Avatar + Candidate Name + Match Score */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div 
                                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-grab active:cursor-grabbing shrink-0" 
                                    title="Drag card to move stage"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-md ring-1 ring-white/20 shrink-0">
                                    {initials}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-snug truncate">
                                      {cand.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                      {cand.job?.title || 'Applied Role'}
                                    </p>
                                  </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0 whitespace-nowrap ${
                                  cand.matchScore >= 85 
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' 
                                    : cand.matchScore >= 70
                                    ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30'
                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
                                }`}>
                                  {cand.matchScore ? `${cand.matchScore}% Match` : 'Applied'}
                                </span>
                              </div>

                              {/* Scheduled Interview Slot & Meet link if available */}
                              {cand.interviewScheduledAt && (
                                <div className="p-2 rounded-xl bg-cyan-50/90 dark:bg-cyan-950/50 border border-cyan-200/90 dark:border-cyan-800/50 flex items-center justify-between text-[11px] shadow-sm">
                                  <span className="text-cyan-800 dark:text-cyan-300 font-medium truncate text-[10px] flex items-center space-x-1">
                                    <span>📅</span>
                                    <span className="truncate max-w-[130px]">{cand.interviewScheduledAt}</span>
                                  </span>
                                  {cand.interviewMeetingUrl && (
                                    <a
                                      href={cand.interviewMeetingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition flex items-center space-x-1 shadow-sm shrink-0 ml-1.5"
                                      title="Launch Google Meet"
                                    >
                                      <Video className="w-2.5 h-2.5" />
                                      <span>Meet</span>
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Automated Tech Assessment score chip if available */}
                              {hasTechScore && (
                                <div className="px-2 py-1 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 flex items-center justify-between text-[10px]">
                                  <span className="text-indigo-700 dark:text-indigo-300 font-semibold flex items-center space-x-1">
                                    <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                                    <span>Tech Assessment:</span>
                                  </span>
                                  <span className="font-mono font-bold text-indigo-900 dark:text-indigo-200">
                                    {techScoreVal}/100
                                  </span>
                                </div>
                              )}

                              {/* Skills pills */}
                              <div className="flex flex-wrap gap-1">
                                {cand.skills?.slice(0, 3).map((s, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[10px] text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-white/[0.04]">
                                    {s}
                                  </span>
                                ))}
                                {cand.skills?.length > 3 && (
                                  <span className="text-[9px] text-slate-500 self-center">+{cand.skills.length - 3}</span>
                                )}
                              </div>

                              {/* Card Footer: Integrity + Move Dropdown + Dossier Action */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/[0.05] text-[10px]">
                                <span className={`font-bold flex items-center space-x-1 ${
                                  isHighRisk ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isHighRisk ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                  <span>{isHighRisk ? 'Flagged' : 'Verified'}</span>
                                </span>

                                <div className="flex items-center space-x-1.5">
                                  {/* Quick Stage Mover */}
                                  <div className="relative" onClick={e => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => setOpenMoveMenuId(openMoveMenuId === cand.id ? null : cand.id)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition flex items-center space-x-1 shadow-sm"
                                      title="Move candidate stage"
                                    >
                                      <ArrowRightLeft className="w-2.5 h-2.5" />
                                      <span>Move</span>
                                    </button>

                                    {openMoveMenuId === cand.id && (
                                      <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 space-y-0.5 text-xs backdrop-blur-md animate-in fade-in zoom-in-95">
                                        <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                          Move to Stage
                                        </div>
                                        {[
                                          { label: 'Screening (Applied)', status: 'Applied', dot: 'bg-blue-400' },
                                          { label: 'Interview Scheduled', status: 'Interview', dot: 'bg-cyan-400' },
                                          { label: 'AI Evaluated', status: 'Under Review', dot: 'bg-indigo-400' },
                                          { label: 'Shortlisted', status: 'Shortlisted', dot: 'bg-emerald-400' },
                                          { label: 'Selected / Offer', status: 'Selected', dot: 'bg-purple-400' },
                                          { label: 'Rejected', status: 'Rejected', dot: 'bg-rose-400' },
                                        ].map(item => (
                                          <button
                                            key={item.status}
                                            type="button"
                                            onClick={() => {
                                              updateCandidateStatus(cand.id, item.status);
                                              setOpenMoveMenuId(null);
                                              setSuccessBanner(`✓ Moved ${cand.name} to ${item.label}`);
                                              setTimeout(() => setSuccessBanner(''), 4500);
                                              if (item.status === 'Shortlisted' || item.status === 'Selected') {
                                                confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                                              }
                                            }}
                                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 font-medium transition flex items-center space-x-2"
                                          >
                                            <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                                            <span className="text-[11px] font-semibold">{item.label}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCandidate(cand);
                                    }}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-500/20 transition flex items-center space-x-0.5"
                                  >
                                    <span>Dossier</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            /* DETAILED GRID / LIST VIEW */
            <div className="space-y-4">
              {filteredCandidates.map((cand, idx) => {
                const hasFraudFlags = cand.fraudFlags && cand.fraudFlags.length > 0;
                const isHighRisk = cand.integrityRisk === 'High';

                return (
                  <FadeInUp key={cand.id} delay={idx * 60}>
                  <div
                    className="glass-card-hover p-5 sm:p-6 rounded-2xl transition-all duration-200 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    {/* Left: Info */}
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-gradient-to-tr dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-800 dark:text-white text-lg border border-slate-300 dark:border-slate-700 shadow-inner">
                        {cand.name.charAt(0)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer transition" onClick={() => handleOpenCandidate(cand)}>
                            {cand.name}
                          </h3>

                          {/* Integrity Pill */}
                          {isHighRisk ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Integrity Flag ({cand.integrityScore}/100)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verified ({cand.integrityScore}/100)</span>
                            </span>
                          )}

                          {/* Status pill */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            cand.finalDecision === 'Shortlisted'
                              ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/50'
                              : cand.finalDecision === 'Rejected'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {cand.finalDecision || cand.status}
                          </span>

                          {/* Scheduled Interview badge if set */}
                          {cand.interviewScheduledAt && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                              <Calendar className="w-3 h-3" />
                              <span>Slot: {cand.interviewScheduledAt}</span>
                            </span>
                          )}

                          {/* Meeting Link badge if set */}
                          {cand.interviewMeetingUrl && (
                            <a
                              href={cand.interviewMeetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition"
                              title="Open Video Call Meeting Room"
                            >
                              <Video className="w-3 h-3" />
                              <span>Meet</span>
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                          <span>{cand.education}</span>
                          <span>•</span>
                          <span>{cand.experienceYears} Years Exp</span>
                          <span>•</span>
                          <span className="text-slate-400 dark:text-slate-500">Applied {cand.appliedDate}</span>
                        </p>

                        {/* Resume Summary snippet */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-2xl pt-0.5">
                          {cand.resumeSummary}
                        </p>

                        {/* Fraud flags warning if any */}
                        {hasFraudFlags && (
                          <div className="flex items-center space-x-1.5 text-xs text-rose-500 dark:text-rose-400 font-semibold pt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="line-clamp-1">Inconsistency: {cand.fraudFlags[0]}</span>
                          </div>
                        )}

                        {/* Skills pills */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {cand.skills.slice(0, 5).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-800">
                              {skill}
                            </span>
                          ))}
                          {cand.skills.length > 5 && (
                            <span className="text-[11px] text-slate-500 self-center">+{cand.skills.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Metrics & CTA */}
                    <div className="flex items-center justify-between lg:justify-end space-x-6 border-t lg:border-t-0 border-slate-200 dark:border-slate-800/80 pt-3 lg:pt-0">
                      
                      {/* Scores */}
                      <div className="flex items-center space-x-5">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Match</span>
                          <div className="text-lg font-black text-slate-900 dark:text-white">{cand.matchScore}%</div>
                        </div>

                        <div className="text-center">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">AI Score</span>
                          <div className={`text-lg font-black ${
                            cand.scores?.overall >= 80 ? 'text-emerald-500 dark:text-emerald-400' : cand.scores?.overall >= 60 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'
                          }`}>
                            {cand.scores?.overall > 0 ? `${cand.scores.overall}/100` : 'Pending'}
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenCandidate(cand)}
                          className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-white border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>View Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                  </FadeInUp>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Candidate Scorecard Modal */}
      {selectedCandidate && (
        <CandidateScorecardModal
          candidate={selectedCandidate}
          onClose={handleCloseCandidateModal}
        />
      )}

      {/* Job Creator Modal */}
      <JobCreatorModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onJobCreated={handleJobCreated}
      />

    </div>
  );
}
