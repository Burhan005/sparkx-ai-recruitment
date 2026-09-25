import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import CandidateWorkspace from './workspace/CandidateWorkspace';
import AskSparkxDrawer from '../ai/AskSparkxDrawer';
import JobCreatorModal from './JobCreatorModal';
import { 
  Stat, 
  Button, 
  IconButton, 
  SearchInput, 
  Badge, 
  StatusBadge, 
  Avatar, 
  EmptyState,
  SectionHeader,
  AnimatedCounter,
  CustomDropdown
} from '../ui/Primitives';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Search, 
  Plus, 
  ShieldAlert, 
  Award, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  Briefcase, 
  CheckCircle, 
  MapPin, 
  Clock, 
  ArrowRight,
  Eye,
  Calendar,
  LayoutGrid,
  Columns,
  CheckCircle2,
  TrendingUp,
  GripVertical,
  Bot,
  FileText,
  Code2,
  Filter,
  Layers,
  Inbox,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Edit3
} from 'lucide-react';
import { 
  normalizeWorkflow,
  STAGE_CONFIG,
  HIRING_DECISION_CONFIG,
  ASSESSMENT_STATUS_CONFIG,
  INTERVIEW_STATUS_CONFIG
} from '../../utils/workflowContract';
import { 
  formatJobCTC, 
  formatCandidateExpectedCTC, 
  getCompensationBadgeConfig 
} from '../../utils/compensationFormatter';

export default function CandidatePipeline() {
  const navigate = useNavigate();
  const { jobId: routeJobId, candidateId: routeCandidateId } = useParams();
  const { 
    candidates = [], 
    jobs = [], 
    activeJob, 
    setActiveJobId, 
    selectedCandidate, 
    setSelectedCandidate,
    updateCandidateStage,
    inviteAssessment
  } = useRecruitment();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'jobs' ? 'jobs' : 'candidates'); // 'candidates' | 'jobs'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const filterParam = searchParams.get('filter');

    if (tabParam === 'jobs') {
      setActiveTab('jobs');
    } else if (tabParam === 'candidates' || !tabParam) {
      if (filterParam === 'top') {
        setActiveTab('candidates');
        setFilterStatus('Evaluated');
      } else if (filterParam === 'alerts') {
        setActiveTab('candidates');
        setFilterStatus('High Risk');
      } else if (tabParam === 'candidates') {
        setActiveTab('candidates');
      }
    }
  }, [searchParams]);
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [compensationFilter, setCompensationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All | Evaluated | Shortlisted | High Risk
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [isAskSparkxOpen, setIsAskSparkxOpen] = useState(false);
  const [isInboundExpanded, setIsInboundExpanded] = useState(false);
  const searchInputRef = useRef(null);

  // Focus candidate search on '/' keypress
  useEffect(() => {
    const handleSlashKey = (e) => {
      if (
        e.key === '/' && 
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && 
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, []);

  // Sync route params
  useEffect(() => {
    if (routeJobId) {
      setSelectedJobFilter(routeJobId);
      setActiveJobId(routeJobId);
      setActiveTab('candidates');
    }
  }, [routeJobId, setActiveJobId]);

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
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleCloseCandidateModal = () => {
    setSelectedCandidate(null);
    navigate(routeJobId ? `/recruiter/jobs/${routeJobId}` : '/recruiter');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Filter candidates memoized
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesJob = selectedJobFilter === 'ALL' || String(c.jobId) === String(selectedJobFilter);
      if (!matchesJob) return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q)) ||
        (c.jobRole && c.jobRole.toLowerCase().includes(q)) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(q))) ||
        (c.education && c.education.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (compensationFilter !== 'ALL') {
        const analysis = c.compensationAnalysis || c.compensation_analysis;
        const rel = analysis?.relationship || 'expectation_unavailable';
        if (rel !== compensationFilter) return false;
      }

      if (filterStatus === 'All') return true;
      if (filterStatus === 'Evaluated') {
        const wf = normalizeWorkflow(c);
        return wf.assessmentStatus === 'evaluated' || wf.interviewStatus === 'completed' || (c.scores && c.scores.overall > 0);
      }
      if (filterStatus === 'Shortlisted') {
        const wf = normalizeWorkflow(c);
        return wf.hiringDecision === 'accepted' || c.finalDecision === 'Shortlisted' || c.finalDecision === 'Selected';
      }
      if (filterStatus === 'High Risk') return c.integrityRisk === 'High';
      return true;
    });
  }, [candidates, selectedJobFilter, searchQuery, filterStatus, compensationFilter]);

  // Aggregate Metrics
  const totalApplicants = candidates.length;
  const highMatchCount = candidates.filter(c => (c.matchScore || 0) >= 85).length;
  const integrityFlaggedCount = candidates.filter(c => c.integrityRisk === 'High').length;
  const evaluatedCount = candidates.filter(c => {
    const wf = normalizeWorkflow(c);
    return wf.assessmentStatus === 'evaluated' || wf.interviewStatus === 'completed' || (c.scores && c.scores.overall > 0);
  }).length;

  // Dropdown Options
  const jobDropdownOptions = useMemo(() => [
    { value: 'ALL', label: `All Roles (${jobs.length})`, icon: Briefcase },
    ...jobs.map(j => ({
      value: j.id,
      label: j.title,
      badge: j.department || undefined
    }))
  ], [jobs]);

  const compensationDropdownOptions = useMemo(() => [
    { value: 'ALL', label: 'All Compensation', icon: TrendingUp },
    { value: 'within_range', label: 'Within Advertised Range', badge: 'Match', description: 'Expected CTC fits within role budget' },
    { value: 'above_range', label: 'Above Budget', badge: 'High', description: 'Expected CTC exceeds advertised cap' },
    { value: 'below_range', label: 'Below Budget', badge: 'Low', description: 'Expected CTC below advertised minimum' },
    { value: 'partial_overlap', label: 'Partial Overlap', badge: 'Overlap', description: 'Expected range intersects job budget' },
    { value: 'expectation_unavailable', label: 'Expectation Not Provided', description: 'Candidate has not submitted CTC' },
  ], []);

  const handleJobCreated = (newJob) => {
    setActiveTab('jobs');
    setHighlightedJobId(newJob.id);
    setActiveJobId(newJob.id);
    setSuccessBanner(`🎉 Job "${newJob.title}" has been successfully published to your pipeline!`);
    setTimeout(() => setSuccessBanner(''), 6000);
  };

  const getCandidateJobTitle = (cand) => {
    if (cand.job?.title && cand.job.title !== 'Applicant') return cand.job.title;
    if (cand.jobTitle && cand.jobTitle !== 'Applicant') return cand.jobTitle;
    const match = jobs.find(j => String(j.id) === String(cand.job_id || cand.jobId));
    if (match?.title) return match.title;
    if (cand.jobRole && cand.jobRole !== 'Applicant') return cand.jobRole;
    return 'Software Engineer';
  };

  const getCandidateStage = (c) => {
    const wf = normalizeWorkflow(c);
    return wf.stage || 'applied';
  };

  const appliedCandidates = useMemo(() => {
    return filteredCandidates.filter(c => getCandidateStage(c) === 'applied');
  }, [filteredCandidates]);

  const handleAdvanceAllApplied = async () => {
    if (!appliedCandidates.length) return;
    try {
      await Promise.all(appliedCandidates.map(c => updateCandidateStage(c.id, 'screening')));
      setSuccessBanner(`✓ Advanced ${appliedCandidates.length} application(s) from Inbox to Screening`);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err) {
      console.error('Failed to batch advance:', err);
    }
  };

  const handleStageDrop = async (candId, targetStageId) => {
    setDragOverStage(null);
    setDraggedCandidateId(null);
    if (!candId) return;

    const currentCand = candidates.find(c => String(c.id) === String(candId));
    if (!currentCand) return;

    const currentStage = getCandidateStage(currentCand);
    if (currentStage === targetStageId) return;

    const stageNames = {
      screening: 'Screening',
      assessment: 'Technical Assessment',
      interview: 'Interview',
      review: 'Evaluation & Review',
      completed: 'Completed'
    };

    try {
      await updateCandidateStage(candId, targetStageId);
      if (targetStageId === 'assessment') {
        const wf = normalizeWorkflow(currentCand);
        if (wf.assessmentStatus === 'not_invited') {
          await inviteAssessment(candId);
        }
      }
      setSuccessBanner(`✓ Moved ${currentCand.name} to ${stageNames[targetStageId] || targetStageId}`);
      setTimeout(() => setSuccessBanner(''), 4000);


    } catch (err) {
      console.error('Failed to move stage:', err);
    }
  };

  const stages = [
    {
      id: 'screening',
      name: 'Screening',
      subtitle: 'Resume match & review',
      dotColor: 'bg-blue-500',
      badgeColor: 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'screening')
    },
    {
      id: 'assessment',
      name: 'Assessment',
      subtitle: 'Coding sandbox & test suites',
      dotColor: 'bg-purple-500',
      badgeColor: 'border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'assessment')
    },
    {
      id: 'interview',
      name: 'Interview',
      subtitle: 'Adaptive AI & video meet',
      dotColor: 'bg-cyan-500',
      badgeColor: 'border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'interview')
    },
    {
      id: 'review',
      name: 'Evaluation',
      subtitle: 'Scores & committee review',
      dotColor: 'bg-amber-500',
      badgeColor: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'review')
    },
    {
      id: 'completed',
      name: 'Completed',
      subtitle: 'Offer extended or archived',
      dotColor: 'bg-emerald-500',
      badgeColor: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'completed')
    }
  ];

  // If a candidate is selected, render the dedicated Candidate Intelligence Workspace directly
  if (selectedCandidate || routeCandidateId) {
    return (
      <div className="w-full min-w-0 -my-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <CandidateWorkspace
          candidateId={routeCandidateId || selectedCandidate?.id}
          onClose={handleCloseCandidateModal}
          onOpenAskSparkx={() => setIsAskSparkxOpen(true)}
        />
        {/* Contextual Ask SparkX Intelligence Drawer */}
        <AskSparkxDrawer
          isOpen={isAskSparkxOpen}
          onClose={() => setIsAskSparkxOpen(false)}
          candidateContext={selectedCandidate}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 pb-16 animate-fade-in-up">
      {/* Toast Notification */}
      {successBanner && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-subtle animate-fade-in-up">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessBanner('')} 
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="xs">
              Recruitment Operating System
            </Badge>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-medium">Live Central Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Command Center & Talent Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-normal mt-0.5">
            Real-time candidate telemetry, automated evaluations, and 4-dimensional hiring management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={ShieldAlert}
            onClick={() => navigate('/recruiter/proctor')}
          >
            Integrity HUD
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              setJobToEdit(null);
              setIsJobModalOpen(true);
            }}
          >
            Post Job Opening
          </Button>
        </div>
      </div>

      {/* Executive KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="animate-fade-in-up">
          <Stat
            label="Active Openings"
            value={<AnimatedCounter value={jobs.length} />}
            icon={Briefcase}
            subtitle="Positions currently receiving applicants"
            onClick={() => setActiveTab('jobs')}
          />
        </div>
        <div className="animate-fade-in-up delay-100">
          <Stat
            label="Total Pipeline"
            value={<AnimatedCounter value={totalApplicants} />}
            icon={Users}
            trend={totalApplicants > 0 ? `${totalApplicants} total` : undefined}
            trendDirection="neutral"
            subtitle="Candidates tracked in database"
            onClick={() => {
              setActiveTab('candidates');
              setFilterStatus('All');
            }}
          />
        </div>
        <div className="animate-fade-in-up delay-200">
          <Stat
            label="AI Evaluated"
            value={<AnimatedCounter value={evaluatedCount} />}
            icon={Award}
            trend={evaluatedCount > 0 ? `${Math.round((evaluatedCount / (totalApplicants || 1)) * 100)}%` : undefined}
            trendDirection="up"
            subtitle="Completed assessment or interview"
            onClick={() => {
              setActiveTab('candidates');
              setFilterStatus('Evaluated');
            }}
          />
        </div>
        <div className="animate-fade-in-up delay-300">
          <Stat
            label="Integrity Alerts"
            value={<AnimatedCounter value={integrityFlaggedCount} />}
            icon={ShieldAlert}
            trend={integrityFlaggedCount > 0 ? 'Requires Audit' : 'All Clear'}
            trendDirection={integrityFlaggedCount > 0 ? 'down' : 'up'}
            subtitle="Proctor telemetry anomalies"
            onClick={() => {
              setActiveTab('candidates');
              setFilterStatus('High Risk');
            }}
          />
        </div>
      </div>

      {/* ── UNIFIED TABS & CONTROLS TOOLBAR (NATURAL CONTINUOUS SCROLLING) ── */}
      <div className="sticky top-0 z-20 p-3 sm:p-4 rounded-xl bg-white/95 dark:bg-[#0E121E]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md shadow-black/10 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Tab Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('candidates');
                setSearchParams({});
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'candidates'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Candidates ({filteredCandidates.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('jobs');
                setSearchParams({ tab: 'jobs' });
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'jobs'
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Job Postings ({jobs.length})</span>
            </button>
          </div>

          {/* Controls: Search, Job Filter, Compensation, View Mode */}
          {activeTab === 'candidates' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <SearchInput
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Search candidates by name, skill, email..."
                shortcut="/"
                className="w-full sm:w-64"
              />

              {/* Job Selector Custom Dropdown */}
              <div className="flex items-center gap-1.5">
                <CustomDropdown
                  value={selectedJobFilter}
                  onChange={setSelectedJobFilter}
                  options={jobDropdownOptions}
                  icon={Briefcase}
                  menuWidth="w-72"
                  title="Filter candidates by job role"
                />
                {selectedJobFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetJob = jobs.find(j => j.id === selectedJobFilter);
                      if (targetJob) {
                        setJobToEdit(targetJob);
                        setIsJobModalOpen(true);
                      }
                    }}
                    title="Edit this role requirement & compensation budget"
                    className="h-9 px-2.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold flex items-center gap-1 transition shadow-subtle shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Role</span>
                  </button>
                )}
              </div>

              {/* Compensation Relationship Custom Dropdown */}
              <CustomDropdown
                value={compensationFilter}
                onChange={setCompensationFilter}
                options={compensationDropdownOptions}
                icon={TrendingUp}
                menuWidth="w-72"
                align="right"
                title="Filter by candidate expected CTC relationship against job budget"
              />

              {/* Display Mode Switcher */}
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-[#080A10]">
                <button
                  type="button"
                  onClick={() => setDisplayMode('kanban')}
                  title="Kanban Board"
                  className={`p-1.5 rounded-md transition ${
                    displayMode === 'kanban'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-subtle'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  title="High-Density Table"
                  className={`p-1.5 rounded-md transition ${
                    displayMode === 'list'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-subtle'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Filters Bar */}
        {activeTab === 'candidates' && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-indigo-500" />
              Quick Filter:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'All', label: 'All Candidates', count: candidates.length },
                { id: 'Evaluated', label: 'Evaluated', count: evaluatedCount },
                { id: 'Shortlisted', label: 'Shortlisted' },
                { id: 'High Risk', label: 'Integrity Alerts', count: integrityFlaggedCount, alert: integrityFlaggedCount > 0 }
              ].map(({ id, label, count, alert }) => {
                const isActive = filterStatus === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilterStatus(id)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all text-xs flex items-center gap-1.5 select-none ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-subtle font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {alert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-subtle" />}
                    <span>{label}</span>
                    {count !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {filterStatus !== 'All' && (
              <button
                type="button"
                onClick={() => setFilterStatus('All')}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline ml-auto font-medium"
              >
                Reset filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* CONTENT: CANDIDATES TAB */}
      {activeTab === 'candidates' && (
        <>
          {filteredCandidates.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No candidates match criteria"
              description="Try adjusting your role filter or search keywords to view candidate applications."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setFilterStatus('All');
                setSelectedJobFilter('ALL');
              }}
            />
          ) : (
            <div className="space-y-3">
              {/* Active Role Context Banner (when filtered by role) */}
              {selectedJobFilter !== 'ALL' && (() => {
                const currentJob = jobs.find(j => j.id === selectedJobFilter);
                if (!currentJob) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                          Active Filtered Role
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {currentJob.title}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">({currentJob.id})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {currentJob.location || 'Remote'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {currentJob.experience || '3+ years'}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                          <DollarSign className="w-3 h-3 mr-0.5" />
                          {formatJobCTC(currentJob)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="xs"
                        icon={Edit3}
                        onClick={() => {
                          setJobToEdit(currentJob);
                          setIsJobModalOpen(true);
                        }}
                      >
                        Edit Job Requirement
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setSelectedJobFilter('ALL')}
                      >
                        View All Roles
                      </Button>
                    </div>
                  </div>
                );
              })()}

              {/* Inbound Applications Inbox */}
              {appliedCandidates.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#0E121E] border border-slate-200 dark:border-slate-800 shadow-subtle space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/30 shrink-0">
                        <Inbox className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Inbound Applications Inbox
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            {appliedCandidates.length} New
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Newly submitted applications awaiting triage before advancing to active screening.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsInboundExpanded(prev => !prev)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shrink-0"
                      >
                        <span>{isInboundExpanded ? 'Collapse' : `View Applications (${appliedCandidates.length})`}</span>
                        {isInboundExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <Button
                        variant="primary"
                        size="xs"
                        icon={CheckCheck}
                        onClick={handleAdvanceAllApplied}
                      >
                        Advance All to Screening
                      </Button>
                    </div>
                  </div>

                  {/* Inbound candidate cards (collapsible) */}
                  {isInboundExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
                      {appliedCandidates.map((cand) => {
                        const matchScore = cand.matchScore || 0;
                        return (
                          <div
                            key={cand.id}
                            onClick={() => handleOpenCandidate(cand)}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-subtle cursor-pointer flex items-center justify-between gap-2 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Avatar name={cand.name} size="xs" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 tracking-tight">
                                  {cand.name}
                                </h4>
                                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate" title={getCandidateJobTitle(cand)}>
                                  {getCandidateJobTitle(cand)}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {matchScore}% Fit • Applied {cand.appliedDate || 'Recently'}
                                  {cand.candidateExpectationFormatted ? ` • Expects ${cand.candidateExpectationFormatted}` : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStageDrop(cand.id, 'screening');
                              }}
                              title="Advance to Screening"
                              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 shrink-0 text-[10px] font-semibold flex items-center gap-1 transition"
                            >
                              <span>Screen</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {displayMode === 'kanban' ? (
                /* ─── FLUID KANBAN BOARD WITH NATURAL SCROLLING (ZERO SCROLL TRAPS) ─── */
                <div className="w-full min-w-0 overflow-x-auto pb-6 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 min-w-[960px] xl:min-w-0 gap-3 sm:gap-3.5 items-start">
                    {stages.map((stage) => (
                      <div
                        key={stage.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverStage !== stage.id) setDragOverStage(stage.id);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setDragOverStage(stage.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverStage === stage.id) setDragOverStage(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const candId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
                          handleStageDrop(candId, stage.id);
                        }}
                        className={`w-full min-w-0 flex flex-col min-h-[480px] rounded-xl border transition-all duration-200 ${
                          dragOverStage === stage.id
                            ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/20 ring-2 ring-brand-500/30'
                            : 'border-slate-200/90 dark:border-slate-800/80 bg-slate-100/75 dark:bg-[#0E121E]/60 shadow-xs'
                        }`}
                      >
                        {/* Column Header */}
                        <div className="px-3 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#0E121E]/90 backdrop-blur-sm rounded-t-xl">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${stage.dotColor} animate-pulse-subtle`} />
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{stage.name}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {stage.items.length}
                          </span>
                        </div>

                        {/* Cards Container with natural flow (Zero scroll trap) */}
                        <div className="p-2 space-y-2 flex-1">
                          {stage.items.length === 0 ? (
                            <div className="h-28 flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-400 font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                              Drop candidate here
                            </div>
                          ) : (
                            stage.items.map((cand, cardIndex) => {
                              const wf = normalizeWorkflow(cand);
                              const matchScore = cand.matchScore || 0;
                              const scoreColor = matchScore >= 85
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60'
                                : matchScore >= 70
                                ? 'text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 border-brand-200 dark:border-brand-800/60'
                                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

                              return (
                                <div
                                  key={cand.id}
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggedCandidateId(cand.id);
                                    e.dataTransfer.setData('text/plain', String(cand.id));
                                  }}
                                  onDragEnd={() => {
                                    setDraggedCandidateId(null);
                                    setDragOverStage(null);
                                  }}
                                  onClick={() => handleOpenCandidate(cand)}
                                  className={`p-3 rounded-xl bg-white dark:bg-[#0E121E] border transition-all duration-fast space-y-2 group select-none cursor-pointer animate-fade-in-up ${
                                    draggedCandidateId === cand.id 
                                      ? 'opacity-40 scale-95 border-dashed border-brand-500 shadow-none' 
                                      : 'kanban-card active:scale-[0.98]'
                                  }`}
                                  style={{ animationDelay: `${cardIndex * 60}ms` }}
                                >
                                  {/* PRIMARY HIERARCHY: WHO & WHAT ROLE & FIT */}
                                  <div className="flex items-start justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Avatar name={cand.name} size="xs" />
                                      <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors tracking-tight">
                                          {cand.name}
                                        </h4>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate" title={getCandidateJobTitle(cand)}>
                                          {getCandidateJobTitle(cand)}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono border shrink-0 ${scoreColor}`}>
                                      {matchScore}%
                                    </span>
                                  </div>

                                  {/* SECONDARY HIERARCHY: ACTIVE CRITICAL STATUS & COMPENSATION */}
                                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    {cand.integrityRisk === 'High' && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 shrink-0">
                                        <ShieldAlert className="w-3 h-3" />
                                        <span>Flagged</span>
                                      </span>
                                    )}
                                    {wf.hiringDecision !== 'undecided' ? (
                                      <StatusBadge status={wf.hiringDecision} dimension="decision" />
                                    ) : wf.interviewStatus !== 'not_scheduled' ? (
                                      <StatusBadge status={wf.interviewStatus} dimension="interview" />
                                    ) : wf.assessmentStatus !== 'not_invited' ? (
                                      <StatusBadge status={wf.assessmentStatus} dimension="assessment" />
                                    ) : (
                                      <StatusBadge status={stage.name} dimension="stage" />
                                    )}

                                    {/* Authoritative Compensation Match Badge */}
                                    {cand.compensationAnalysis && cand.compensationAnalysis.relationship !== 'expectation_unavailable' && (() => {
                                      const badgeCfg = getCompensationBadgeConfig(cand.compensationAnalysis.relationship);
                                      return (
                                        <span 
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 ${
                                            badgeCfg.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                          }`}
                                          title={cand.candidateExpectationFormatted ? `Candidate Expects: ${cand.candidateExpectationFormatted} (${badgeCfg.label})` : badgeCfg.label}
                                        >
                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeCfg.dotColor || 'bg-slate-400'}`} />
                                          <span className="whitespace-nowrap font-medium">
                                            {cand.candidateExpectationFormatted ? `${cand.candidateExpectationFormatted} · ${badgeCfg.shortLabel}` : badgeCfg.shortLabel}
                                          </span>
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {/* PROGRESSIVE HIERARCHY: QUALIFICATIONS & REVIEW CUE */}
                                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1 truncate max-w-[150px]">
                                      {cand.skills?.slice(0, 2).map((s, idx) => (
                                        <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                                          {s}
                                        </span>
                                      ))}
                                      {(cand.skills?.length || 0) > 2 && (
                                        <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">+{cand.skills.length - 2}</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-0.5 transition-colors">
                                      <span>Review</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </span>
                                  </div>

                                  {/* Mobile Touch Stage Selector */}
                                  <div 
                                    className="sm:hidden pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Stage:</span>
                                    <select
                                      value={stage.id}
                                      onChange={(e) => handleStageDrop(cand.id, e.target.value)}
                                      className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="screening">Screening</option>
                                      <option value="assessment">Assessment</option>
                                      <option value="interview">Interview</option>
                                      <option value="review">Evaluation</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
            /* ─── HIGH-DENSITY TABLE VIEW ─── */
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E121E] overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-[#080A10] border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Role Applied</th>
                      <th className="px-4 py-3">Compensation</th>
                      <th className="px-4 py-3">Fit %</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Assessment</th>
                      <th className="px-4 py-3">Interview</th>
                      <th className="px-4 py-3">Integrity</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredCandidates.map((cand) => {
                      const wf = normalizeWorkflow(cand);
                      const matchScore = cand.matchScore || 0;
                      return (
                        <tr
                          key={cand.id}
                          onClick={() => handleOpenCandidate(cand)}
                          className="hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={cand.name} size="sm" />
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                  {cand.name}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{cand.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">
                            {cand.job?.title || cand.jobRole || 'Applicant'}
                          </td>
                          <td className="px-4 py-3">
                            {cand.candidateExpectationFormatted ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                  {cand.candidateExpectationFormatted}
                                </div>
                                {cand.compensationAnalysis && cand.compensationAnalysis.relationship !== 'expectation_unavailable' && (() => {
                                  const badgeCfg = getCompensationBadgeConfig(cand.compensationAnalysis.relationship);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                      badgeCfg.badgeClass || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeCfg.dotColor || 'bg-slate-400'}`} />
                                      <span>{badgeCfg.shortLabel || badgeCfg.label}</span>
                                    </span>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] italic">Not specified</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">
                            <span className={matchScore >= 85 ? 'text-emerald-600 dark:text-emerald-400' : matchScore >= 70 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'}>
                              {matchScore}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={wf.stage} dimension="stage" />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={wf.assessmentStatus} dimension="assessment" />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={wf.interviewStatus} dimension="interview" />
                          </td>
                          <td className="px-4 py-3">
                            {cand.integrityRisk === 'High' ? (
                              <Badge variant="danger" size="xs">High Risk</Badge>
                            ) : (
                              <Badge variant="success" size="xs">Verified</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="xs"
                              iconRight={ChevronRight}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCandidate(cand);
                              }}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        )}
        </>
      )}

      {/* CONTENT: JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => {
              const applicantsForThisJob = candidates.filter(c => String(c.jobId) === String(job.id));
              const isNewlyCreated = highlightedJobId === job.id;

              return (
                <div
                  key={job.id}
                  className={`p-5 rounded-xl bg-white dark:bg-[#0E121E] border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-card ${
                    isNewlyCreated
                      ? 'border-brand-500 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider font-mono">
                          {job.department}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                      <Badge variant="success" size="xs">
                        {job.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.experience}</span>
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {applicantsForThisJob.length} Applicants
                      </span>
                    </div>

                    {/* Authoritative Compensation Budget Badge */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold">
                        <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                        <span>{formatJobCTC(job)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.requiredSkills?.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSelectedJobFilter(job.id);
                          setActiveTab('candidates');
                        }}
                      >
                        View Candidates ({applicantsForThisJob.length})
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        icon={Edit3}
                        onClick={() => {
                          setJobToEdit(job);
                          setIsJobModalOpen(true);
                        }}
                      >
                        Edit Requirement
                      </Button>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">ID: {job.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contextual Ask SparkX Intelligence Drawer */}
      <AskSparkxDrawer
        isOpen={isAskSparkxOpen}
        onClose={() => setIsAskSparkxOpen(false)}
        candidateContext={selectedCandidate}
      />

      {/* Job Creator & Editor Modal */}
      {isJobModalOpen && (
        <JobCreatorModal
          isOpen={isJobModalOpen}
          onClose={() => {
            setIsJobModalOpen(false);
            setJobToEdit(null);
          }}
          jobToEdit={jobToEdit}
          onJobCreated={handleJobCreated}
        />
      )}
    </div>
  );
}
