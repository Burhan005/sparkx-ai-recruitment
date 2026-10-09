import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { useSmoothNavigate } from '../../context/PageTransitionContext';
import CandidateWorkspace from './workspace/CandidateWorkspace';
import AskSparkxDrawer from '../ai/AskSparkxDrawer';
import JobCreatorModal from './JobCreatorModal';
import CandidateComparisonModal from './CandidateComparisonModal';
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
import { api } from '../../services/api';
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
  Edit3,
  Scale,
  Check,
  X,
  MoreHorizontal,
  UserCheck,
  UserX,
  Send,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare,
  Square,
  CornerDownRight,
  XCircle,
  ArrowUpRight
} from 'lucide-react';
import { 
  normalizeWorkflow,
  STAGE_CONFIG,
  HIRING_DECISION_CONFIG,
  ASSESSMENT_STATUS_CONFIG,
  INTERVIEW_STATUS_CONFIG,
  STAGES,
  ASSESSMENT_STATUS,
  INTERVIEW_STATUS,
  HIRING_DECISION
} from '../../utils/workflowContract';
import { 
  formatJobCTC, 
  formatCandidateExpectedCTC, 
  getCompensationBadgeConfig 
} from '../../utils/compensationFormatter';

export default function CandidatePipeline() {
  const navigate = useNavigate();
  const location = useLocation();
  const { smoothNavigate } = useSmoothNavigate();
  const { jobId: routeJobId, candidateId: routeCandidateId } = useParams();
  const { 
    candidates = [], 
    jobs = [], 
    activeJob, 
    setActiveJobId, 
    selectedCandidate, 
    setSelectedCandidate,
    updateCandidateStage,
    updateHiringDecision,
    inviteAssessment,
    bulkCandidateAction,
    changeJobStatus,
    syncWithDatabase
  } = useRecruitment();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'jobs' ? 'jobs' : 'candidates'); // 'candidates' | 'jobs'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const filterParam = searchParams.get('filter');

    if (location.state?.tab === 'candidates' || (tabParam !== 'jobs')) {
      setActiveTab('candidates');
      if (filterParam === 'top') {
        setFilterStatus('Evaluated');
      } else if (filterParam === 'alerts') {
        setFilterStatus('High Risk');
      } else {
        setFilterStatus('All');
      }
    } else {
      setActiveTab('jobs');
    }
  }, [searchParams, location.key, location.state]);
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' | 'list'
  const [selectedJobFilter, setSelectedJobFilter] = useState('ALL');
  const [compensationFilter, setCompensationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All | Evaluated | Shortlisted | High Risk
  const [jobStatusTabFilter, setJobStatusTabFilter] = useState('All'); // 'All' | 'Active' | 'Paused' | 'Closed'
  const [closingJobModal, setClosingJobModal] = useState(null); // job object to close
  const [closureReasonText, setClosureReasonText] = useState('');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [isAskSparkxOpen, setIsAskSparkxOpen] = useState(false);
  const [isInboundExpanded, setIsInboundExpanded] = useState(false);

  // Phase 4E.4: Authoritative DB-backed Pipeline Summary
  const [pipelineSummary, setPipelineSummary] = useState(null);
  const [isPipelineSummaryLoading, setIsPipelineSummaryLoading] = useState(false);

  // Phase 4E.4: 4 Independent Workflow Dimension Filters
  const [stageFilter, setStageFilter] = useState('ALL');
  const [assessmentFilter, setAssessmentFilter] = useState('ALL');
  const [interviewFilter, setInterviewFilter] = useState('ALL');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Phase 4E.4: Bulk Action State & Candidate Multi-Select
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [isBulkStageModalOpen, setIsBulkStageModalOpen] = useState(false);
  const [bulkTargetStage, setBulkTargetStage] = useState('screening');
  const [bulkStageNotes, setBulkStageNotes] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionTargetCandidate, setRejectionTargetCandidate] = useState(null);
  const [rejectionCategory, setRejectionCategory] = useState('skills_mismatch');
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [activeCardMenuId, setActiveCardMenuId] = useState(null);

  // Phase 4E.3: Candidate Comparison Modal Integration
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Authoritative pipeline summary fetcher
  const loadPipelineSummary = useCallback(async () => {
    try {
      setIsPipelineSummaryLoading(true);
      const data = await api.getPipelineSummary(selectedJobFilter);
      if (data) {
        setPipelineSummary(data);
      }
    } catch (err) {
      console.warn('[Pipeline] Error fetching pipeline summary:', err);
    } finally {
      setIsPipelineSummaryLoading(false);
    }
  }, [selectedJobFilter]);

  useEffect(() => {
    loadPipelineSummary();
  }, [loadPipelineSummary, candidates]);

  // Close active card menu when clicking anywhere else
  useEffect(() => {
    const handleOutsideClick = () => setActiveCardMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const comparisonJobId = useMemo(() => {
    if (selectedForComparison.length === 0) return null;
    const firstCand = candidates.find(c => String(c.id) === String(selectedForComparison[0]));
    return firstCand ? (firstCand.jobId || firstCand.job_id) : (selectedJobFilter !== 'ALL' ? selectedJobFilter : null);
  }, [selectedForComparison, candidates, selectedJobFilter]);

  const comparisonJobTitle = useMemo(() => {
    if (!comparisonJobId) return 'Selected Job Role';
    const j = jobs.find(job => String(job.id) === String(comparisonJobId));
    return j ? j.title : 'Selected Job Role';
  }, [comparisonJobId, jobs]);

  const toggleCandidateSelection = (cand, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const candId = typeof cand === 'object' ? cand.id : cand;
    setSelectedCandidateIds(prev =>
      prev.includes(candId) ? prev.filter(id => id !== candId) : [...prev, candId]
    );
  };

  const selectAllVisibleCandidates = () => {
    if (selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map(c => c.id));
    }
  };

  const clearCandidateSelection = () => {
    setSelectedCandidateIds([]);
  };

  const toggleCandidateComparison = (cand, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const candId = typeof cand === 'object' ? cand.id : cand;
    const targetCand = typeof cand === 'object' ? cand : candidates.find(c => String(c.id) === String(candId));

    setSelectedForComparison(prev => {
      if (prev.includes(candId)) {
        return prev.filter(id => id !== candId);
      } else {
        if (prev.length > 0 && targetCand) {
          const firstCand = candidates.find(c => String(c.id) === String(prev[0]));
          const firstJobId = firstCand ? String(firstCand.jobId || firstCand.job_id) : null;
          const targetJobId = String(targetCand.jobId || targetCand.job_id);

          if (firstJobId && targetJobId && firstJobId !== targetJobId) {
            setErrorBanner(`Comparison requires candidates applied to the same job opening (${comparisonJobTitle}). Deselect or clear selection to compare candidates from other roles.`);
            setTimeout(() => setErrorBanner(''), 4500);
            return prev;
          }
        }

        if (prev.length >= 4) {
          setErrorBanner("You can compare up to 4 candidates side-by-side.");
          setTimeout(() => setErrorBanner(''), 3000);
          return prev;
        }
        return [...prev, candId];
      }
    });
  };

  const clearComparisonSelection = () => setSelectedForComparison([]);

  const handleBulkCompare = () => {
    if (selectedCandidateIds.length < 2) {
      setErrorBanner("Please select at least 2 candidates to compare.");
      setTimeout(() => setErrorBanner(''), 4000);
      return;
    }
    if (selectedCandidateIds.length > 4) {
      setErrorBanner("Candidate comparison allows a maximum of 4 candidates side-by-side.");
      setTimeout(() => setErrorBanner(''), 4000);
      return;
    }
    const selectedObjects = candidates.filter(c => selectedCandidateIds.includes(c.id));
    const firstJobId = selectedObjects[0]?.jobId || selectedObjects[0]?.job_id;
    const allSameJob = selectedObjects.every(c => String(c.jobId || c.job_id) === String(firstJobId));
    if (!allSameJob) {
      setErrorBanner("Candidate comparison requires candidates applied to the same job opening.");
      setTimeout(() => setErrorBanner(''), 4500);
      return;
    }
    setSelectedForComparison(selectedCandidateIds.slice(0, 4));
    setIsComparisonModalOpen(true);
  };

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
    } else if (!routeCandidateId) {
      setSelectedCandidate(null);
    }
  }, [routeCandidateId, candidates, setSelectedCandidate]);

  const handleOpenCandidate = (cand, tab, state = null) => {
    setSelectedCandidate(cand);
    smoothNavigate(tab ? `/recruiter/candidates/${cand.id}?tab=${tab}` : `/recruiter/candidates/${cand.id}`, state ? { state } : undefined);
  };

  const handleCloseCandidateModal = () => {
    setSelectedCandidate(null);
    smoothNavigate(routeJobId ? `/recruiter/jobs/${routeJobId}` : '/recruiter');
  };

  // Filter candidates memoized
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesJob = selectedJobFilter === 'ALL' || String(c.jobId || c.job_id) === String(selectedJobFilter);
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

      const wf = normalizeWorkflow(c);

      // Phase 4E.4: 4 Independent Workflow Dimensions
      if (stageFilter !== 'ALL' && wf.stage !== stageFilter) return false;
      if (assessmentFilter !== 'ALL' && wf.assessmentStatus !== assessmentFilter) return false;
      if (interviewFilter !== 'ALL' && wf.interviewStatus !== interviewFilter) return false;
      if (decisionFilter !== 'ALL' && wf.hiringDecision !== decisionFilter) return false;

      if (filterStatus === 'All') return true;
      if (filterStatus === 'Evaluated') {
        return wf.assessmentStatus === 'evaluated' || wf.interviewStatus === 'completed' || (c.scores && c.scores.overall > 0);
      }
      if (filterStatus === 'Shortlisted') {
        return wf.hiringDecision === 'shortlisted' || c.finalDecision === 'Shortlisted' || c.finalDecision === 'Selected';
      }
      if (filterStatus === 'High Risk') return c.integrityRisk === 'High';
      return true;
    });
  }, [candidates, selectedJobFilter, searchQuery, filterStatus, compensationFilter, stageFilter, assessmentFilter, interviewFilter, decisionFilter]);

  // Aggregate Metrics (Authoritative when summary available)
  const totalApplicants = pipelineSummary?.total_candidates ?? candidates.length;
  const highMatchCount = candidates.filter(c => (c.matchScore || 0) >= 85).length;
  const integrityFlaggedCount = candidates.filter(c => c.integrityRisk === 'High').length;
  const evaluatedCount = pipelineSummary?.evaluated_candidates != null
    ? pipelineSummary.evaluated_candidates
    : candidates.filter(c => {
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

  // Phase 4E.4: 4 Independent Dimension Dropdown Options
  const stageDropdownOptions = useMemo(() => [
    { value: 'ALL', label: 'All Stages', icon: Layers },
    { value: 'applied', label: 'Applied (Inbox)', badge: String(pipelineSummary?.stage_counts?.applied ?? 0) },
    { value: 'screening', label: 'Screening', badge: String(pipelineSummary?.stage_counts?.screening ?? 0) },
    { value: 'assessment', label: 'Assessment', badge: String(pipelineSummary?.stage_counts?.assessment ?? 0) },
    { value: 'interview', label: 'Interview', badge: String(pipelineSummary?.stage_counts?.interview ?? 0) },
    { value: 'review', label: 'Review & Evaluation', badge: String(pipelineSummary?.stage_counts?.review ?? 0) },
    { value: 'completed', label: 'Completed', badge: String(pipelineSummary?.stage_counts?.completed ?? 0) },
  ], [pipelineSummary]);

  const assessmentDropdownOptions = useMemo(() => [
    { value: 'ALL', label: 'All Assessments', icon: Code2 },
    { value: 'not_invited', label: 'Not Invited', badge: String(pipelineSummary?.assessment_counts?.not_invited ?? 0) },
    { value: 'invited', label: 'Test Invited', badge: String(pipelineSummary?.assessment_counts?.invited ?? 0) },
    { value: 'in_progress', label: 'In Progress', badge: String(pipelineSummary?.assessment_counts?.in_progress ?? 0) },
    { value: 'submitted', label: 'Submitted', badge: String(pipelineSummary?.assessment_counts?.submitted ?? 0) },
    { value: 'evaluated', label: 'Evaluated', badge: String(pipelineSummary?.assessment_counts?.evaluated ?? 0) },
    { value: 'expired', label: 'Expired', badge: String(pipelineSummary?.assessment_counts?.expired ?? 0) },
  ], [pipelineSummary]);

  const interviewDropdownOptions = useMemo(() => [
    { value: 'ALL', label: 'All Interviews', icon: Calendar },
    { value: 'not_scheduled', label: 'Not Scheduled', badge: String(pipelineSummary?.interview_counts?.not_scheduled ?? 0) },
    { value: 'scheduled', label: 'Interview Booked', badge: String(pipelineSummary?.interview_counts?.scheduled ?? 0) },
    { value: 'in_progress', label: 'In Progress', badge: String(pipelineSummary?.interview_counts?.in_progress ?? 0) },
    { value: 'completed', label: 'Concluded', badge: String(pipelineSummary?.interview_counts?.completed ?? 0) },
    { value: 'cancelled', label: 'Cancelled', badge: String(pipelineSummary?.interview_counts?.cancelled ?? 0) },
  ], [pipelineSummary]);

  const decisionDropdownOptions = useMemo(() => [
    { value: 'ALL', label: 'All Decisions', icon: CheckCircle2 },
    { value: 'undecided', label: 'In Review (Pending)', badge: String(pipelineSummary?.decision_counts?.undecided ?? 0) },
    { value: 'shortlisted', label: 'Shortlisted', badge: String(pipelineSummary?.decision_counts?.shortlisted ?? 0) },
    { value: 'selected', label: 'Selected / Offer Extended', badge: String(pipelineSummary?.decision_counts?.selected ?? 0) },
    { value: 'rejected', label: 'Rejected', badge: String(pipelineSummary?.decision_counts?.rejected ?? 0) },
  ], [pipelineSummary]);

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
      loadPipelineSummary();
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

    const hiringDecision = (currentCand.hiringDecision || currentCand.hiring_decision || '').toLowerCase();
    if (['selected', 'rejected'].includes(hiringDecision)) {
      setErrorBanner(`Application for "${currentCand.name}" is finalized (${hiringDecision.toUpperCase()}). Under governance rules, use Reopen Application in the candidate workspace to reconsider.`);
      setTimeout(() => setErrorBanner(''), 7000);
      return;
    }

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
      loadPipelineSummary();

    } catch (err) {
      console.error('Failed to move stage:', err);
      setErrorBanner(err.message || 'Failed to move candidate to target stage.');
      setTimeout(() => setErrorBanner(''), 6000);
    }
  };

  // Phase 4E.4: Bulk Action Handlers
  const handleBulkStageChange = async (targetStage, notes = '') => {
    if (!selectedCandidateIds.length) return;
    try {
      setIsBulkActionLoading(true);
      const res = await bulkCandidateAction({
        candidate_ids: selectedCandidateIds,
        action: 'update_stage',
        stage: targetStage,
        notes: notes || `Bulk stage update to ${targetStage}`
      });
      if (res) {
        setIsBulkStageModalOpen(false);
        setBulkStageNotes('');
        setSelectedCandidateIds([]);
        loadPipelineSummary();
        if (res.failure_count > 0 && res.failures?.length > 0) {
          const reasons = res.failures.map(f => `${f.candidate_name || f.candidate_id}: ${f.reason}`).join('; ');
          setErrorBanner(`Some candidates could not be transitioned: ${reasons}`);
          setTimeout(() => setErrorBanner(''), 7000);
        } else {
          setSuccessBanner(`✓ Successfully moved ${res.success_count} candidate(s) to ${STAGE_CONFIG[targetStage]?.label || targetStage}`);
          setTimeout(() => setSuccessBanner(''), 4000);
        }
      }
    } catch (err) {
      setErrorBanner(err.message || 'Bulk stage transition failed');
      setTimeout(() => setErrorBanner(''), 6000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkInviteAssessment = async () => {
    if (!selectedCandidateIds.length) return;
    try {
      setIsBulkActionLoading(true);
      const res = await bulkCandidateAction({
        candidate_ids: selectedCandidateIds,
        action: 'invite_assessment',
        custom_message: 'Please complete the technical assessment.'
      });
      if (res) {
        setSelectedCandidateIds([]);
        loadPipelineSummary();
        if (res.failure_count > 0 && res.failures?.length > 0) {
          const reasons = res.failures.map(f => `${f.candidate_name || f.candidate_id}: ${f.reason}`).join('; ');
          setErrorBanner(`Some candidates could not be invited: ${reasons}`);
          setTimeout(() => setErrorBanner(''), 7000);
        } else {
          setSuccessBanner(`✓ Invited ${res.success_count} candidate(s) to technical assessment`);
          setTimeout(() => setSuccessBanner(''), 4000);
        }
      }
    } catch (err) {
      setErrorBanner(err.message || 'Bulk assessment invitation failed');
      setTimeout(() => setErrorBanner(''), 6000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkShortlist = async () => {
    if (!selectedCandidateIds.length) return;
    try {
      setIsBulkActionLoading(true);
      const res = await bulkCandidateAction({
        candidate_ids: selectedCandidateIds,
        action: 'update_decision',
        decision: 'shortlisted',
        notes: 'Bulk shortlisted by recruiter'
      });
      if (res) {
        setSelectedCandidateIds([]);
        loadPipelineSummary();
        if (res.failure_count > 0 && res.failures?.length > 0) {
          const reasons = res.failures.map(f => `${f.candidate_name || f.candidate_id}: ${f.reason}`).join('; ');
          setErrorBanner(`Some candidates could not be shortlisted: ${reasons}`);
          setTimeout(() => setErrorBanner(''), 7000);
        } else {
          setSuccessBanner(`✓ Successfully shortlisted ${res.success_count} candidate(s)`);
          setTimeout(() => setSuccessBanner(''), 4000);
        }
      }
    } catch (err) {
      setErrorBanner(err.message || 'Bulk shortlist failed');
      setTimeout(() => setErrorBanner(''), 6000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleOpenRejectionModal = (candidateOrNull = null, e = null) => {
    if (e) {
      e.stopPropagation();
    }
    setRejectionTargetCandidate(candidateOrNull);
    setRejectionCategory('skills_mismatch');
    setRejectionReasonText('');
    setIsRejectionModalOpen(true);
    setActiveCardMenuId(null);
  };

  const handleExecuteRejection = async () => {
    try {
      setIsBulkActionLoading(true);
      if (rejectionTargetCandidate) {
        const candId = typeof rejectionTargetCandidate === 'object' ? rejectionTargetCandidate.id : rejectionTargetCandidate;
        const candName = typeof rejectionTargetCandidate === 'object' ? rejectionTargetCandidate.name : 'Candidate';
        await updateHiringDecision(candId, 'rejected', {
          rejectionReason: rejectionReasonText.trim() || 'Candidate qualifications did not meet criteria for this role.',
          rejectionCategory: rejectionCategory
        });
        setSuccessBanner(`Application for "${candName}" marked as Rejected.`);
        setTimeout(() => setSuccessBanner(''), 4000);
      } else if (selectedCandidateIds.length > 0) {
        const res = await bulkCandidateAction({
          candidate_ids: selectedCandidateIds,
          action: 'update_decision',
          decision: 'rejected',
          rejection_reason: rejectionReasonText.trim() || 'Candidate qualifications did not meet criteria for this role.',
          rejection_category: rejectionCategory
        });
        if (res) {
          setSelectedCandidateIds([]);
          if (res.failure_count > 0 && res.failures?.length > 0) {
            const reasons = res.failures.map(f => `${f.candidate_name || f.candidate_id}: ${f.reason}`).join('; ');
            setErrorBanner(`Some candidates could not be rejected: ${reasons}`);
            setTimeout(() => setErrorBanner(''), 7000);
          } else {
            setSuccessBanner(`✓ Rejected ${res.success_count} candidate application(s)`);
            setTimeout(() => setSuccessBanner(''), 4000);
          }
        }
      }
      setIsRejectionModalOpen(false);
      setRejectionTargetCandidate(null);
      setRejectionReasonText('');
      loadPipelineSummary();
    } catch (err) {
      setErrorBanner(err.message || 'Failed to record rejection decision');
      setTimeout(() => setErrorBanner(''), 6000);
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Phase 4E.4: Quick Card Actions
  const NEXT_STAGE_MAP = {
    applied: 'screening',
    screening: 'assessment',
    assessment: 'interview',
    interview: 'review',
    review: 'completed'
  };

  const NEXT_STAGE_LABELS = {
    applied: 'Screen',
    screening: 'Assess',
    assessment: 'Interview',
    interview: 'Review',
    review: 'Complete'
  };

  const handleQuickAdvance = async (cand, e) => {
    if (e) e.stopPropagation();
    const currentStage = getCandidateStage(cand);
    const nextStage = NEXT_STAGE_MAP[currentStage];
    if (!nextStage) return;
    await handleStageDrop(cand.id, nextStage);
  };

  const handleQuickShortlist = async (cand, e) => {
    if (e) e.stopPropagation();
    setActiveCardMenuId(null);
    try {
      await updateHiringDecision(cand.id, 'shortlisted', {
        hrNotes: 'Shortlisted via quick recruiter action'
      });
      loadPipelineSummary();
      setSuccessBanner(`✓ Shortlisted ${cand.name}`);
      setTimeout(() => setSuccessBanner(''), 3500);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to shortlist candidate');
      setTimeout(() => setErrorBanner(''), 5000);
    }
  };

  const handleQuickInviteAssessment = async (cand, e) => {
    if (e) e.stopPropagation();
    setActiveCardMenuId(null);
    try {
      await inviteAssessment(cand.id);
      loadPipelineSummary();
      setSuccessBanner(`✓ Assessment invitation dispatched for ${cand.name}`);
      setTimeout(() => setSuccessBanner(''), 3500);
    } catch (err) {
      setErrorBanner(err.message || 'Failed to invite candidate');
      setTimeout(() => setErrorBanner(''), 5000);
    }
  };

  const stages = [
    {
      id: 'screening',
      name: 'Screening',
      subtitle: 'Resume match & review',
      dotColor: 'bg-amber-500',
      badgeColor: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'screening'),
      authoritativeCount: pipelineSummary?.stage_counts?.screening ?? 0
    },
    {
      id: 'assessment',
      name: 'Assessment',
      subtitle: 'Coding sandbox & test suites',
      dotColor: 'bg-purple-500',
      badgeColor: 'border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'assessment'),
      authoritativeCount: pipelineSummary?.stage_counts?.assessment ?? 0
    },
    {
      id: 'interview',
      name: 'Interview',
      subtitle: 'Adaptive AI & video meet',
      dotColor: 'bg-brand-500',
      badgeColor: 'border-brand-200 dark:border-brand-900/60 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'interview'),
      authoritativeCount: pipelineSummary?.stage_counts?.interview ?? 0
    },
    {
      id: 'review',
      name: 'Evaluation',
      subtitle: 'Scores & committee review',
      dotColor: 'bg-amber-500',
      badgeColor: 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'review'),
      authoritativeCount: pipelineSummary?.stage_counts?.review ?? 0
    },
    {
      id: 'completed',
      name: 'Completed',
      subtitle: 'Offer extended or archived',
      dotColor: 'bg-emerald-500',
      badgeColor: 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
      items: filteredCandidates.filter(c => getCandidateStage(c) === 'completed'),
      authoritativeCount: pipelineSummary?.stage_counts?.completed ?? 0
    }
  ];

  // If a candidate route is active, render the dedicated Candidate Intelligence Workspace directly
  if (routeCandidateId) {
    const activeRouteCandidate = candidates.find(c => String(c.id) === String(routeCandidateId)) || selectedCandidate;
    const activeRouteJob = activeRouteCandidate?.jobId ? jobs.find(j => String(j.id) === String(activeRouteCandidate.jobId)) : activeJob;
    return (
      <div className="w-full h-full min-w-0 flex flex-col overflow-hidden">
        <CandidateWorkspace
          candidateId={routeCandidateId}
          onClose={handleCloseCandidateModal}
          onOpenAskSparkx={(cand) => {
            if (cand) setSelectedCandidate(cand);
            setIsAskSparkxOpen(true);
          }}
        />
        {/* Contextual Ask SparkX Intelligence Drawer */}
        <AskSparkxDrawer
          isOpen={isAskSparkxOpen}
          onClose={() => setIsAskSparkxOpen(false)}
          initialContextCandidate={activeRouteCandidate}
          initialContextJob={activeRouteJob}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16 animate-fade-in-up">
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

      {errorBanner && (
        <div className="p-3.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-subtle animate-fade-in-up">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorBanner('')} 
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
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
            onClick={() => smoothNavigate('/recruiter/proctor')}
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
            className="shadow-sm hover:shadow-md hover:shadow-[#2A1B14]/20 active:scale-95 transition-all duration-150"
          >
            Post Job Opening
          </Button>
        </div>
      </div>

      {/* Executive KPI Stats */}
      <div className="animate-fade-in-up delay-100">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="animate-fade-in-up stagger-1">
            <Stat
              label="Active Openings"
              value={<AnimatedCounter value={jobs.length} />}
              icon={Briefcase}
              subtitle="Positions currently receiving applicants"
              onClick={() => {
                setActiveTab('jobs');
                setSearchParams({ tab: 'jobs' });
              }}
            />
          </div>
          <div className="animate-fade-in-up stagger-2">
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
                setSearchParams({});
              }}
            />
          </div>
          <div className="animate-fade-in-up stagger-3">
            <Stat
              label="AI Evaluated"
              value={<AnimatedCounter value={evaluatedCount} />}
              icon={Award}
              trend={totalApplicants > 0 && evaluatedCount > 0 ? `${Math.min(100, Math.round((evaluatedCount / totalApplicants) * 100))}%` : undefined}
              trendDirection="up"
              subtitle="Completed assessment or interview"
              onClick={() => {
                setActiveTab('candidates');
                setFilterStatus('Evaluated');
                setSearchParams({ filter: 'top' });
              }}
            />
          </div>
          <div className="animate-fade-in-up stagger-4">
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
                setSearchParams({ filter: 'alerts' });
              }}
            />
          </div>
        </div>
      </div>

      {/* ── UNIFIED TABS & CONTROLS TOOLBAR (NATURAL CONTINUOUS SCROLLING) ── */}
      <div className="sticky top-0 z-20 p-3 sm:p-4 rounded-xl bg-[#FDFCFA]/95 dark:bg-[#1A1714]/95 backdrop-blur-md border border-[#E5E0DA] dark:border-[#2A2520] shadow-md shadow-black/10 space-y-3">
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
                  ? 'bg-brand-600 text-white shadow-sm shadow-[#2A1B14]/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
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
                  ? 'bg-brand-600 text-white shadow-sm shadow-[#2A1B14]/20'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
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
                placeholder="Search candidates..."
                shortcut="/"
                className="w-full sm:w-72"
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
                    className="h-9 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-semibold flex items-center gap-1 transition shadow-subtle shrink-0"
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
              <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-800 p-0.5 bg-stone-50 dark:bg-[#13110F]">
                <button
                  type="button"
                  onClick={() => setDisplayMode('kanban')}
                  title="Kanban Board"
                  className={`p-1.5 rounded-md transition ${
                    displayMode === 'kanban'
                      ? 'bg-white dark:bg-stone-800 text-brand-600 dark:text-brand-400 shadow-subtle'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
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
                      ? 'bg-white dark:bg-stone-800 text-brand-600 dark:text-brand-400 shadow-subtle'
                      : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phase 4E.4: Workflow Dimensions Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(prev => !prev)}
                className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border shrink-0 ${
                  showAdvancedFilters || stageFilter !== 'ALL' || assessmentFilter !== 'ALL' || interviewFilter !== 'ALL' || decisionFilter !== 'ALL'
                    ? 'bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
                    : 'bg-stone-100 hover:bg-stone-200 dark:bg-[#231F1B] dark:hover:bg-[#2A2520] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-[#2A2520]'
                }`}
                title="Filter candidates across the 4 independent workflow dimensions"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Workflow Filters</span>
                {(stageFilter !== 'ALL' || assessmentFilter !== 'ALL' || interviewFilter !== 'ALL' || decisionFilter !== 'ALL') && (
                  <span className="w-2 h-2 rounded-full bg-brand-500" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Phase 4E.4: 4 Independent Workflow Dimensions Filter Bar */}
        {activeTab === 'candidates' && showAdvancedFilters && (
          <div className="pt-2.5 border-t border-stone-200/60 dark:border-stone-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                Authoritative 4-Dimensional Filters:
              </span>
              {(stageFilter !== 'ALL' || assessmentFilter !== 'ALL' || interviewFilter !== 'ALL' || decisionFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setStageFilter('ALL');
                    setAssessmentFilter('ALL');
                    setInterviewFilter('ALL');
                    setDecisionFilter('ALL');
                  }}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                >
                  Reset Workflow Filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  1. Pipeline Stage
                </label>
                <CustomDropdown
                  value={stageFilter}
                  onChange={setStageFilter}
                  options={stageDropdownOptions}
                  icon={Layers}
                  menuWidth="w-64"
                  title="Filter by candidate pipeline stage"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  2. Assessment Status
                </label>
                <CustomDropdown
                  value={assessmentFilter}
                  onChange={setAssessmentFilter}
                  options={assessmentDropdownOptions}
                  icon={Code2}
                  menuWidth="w-64"
                  title="Filter by assessment lifecycle status"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  3. Interview Status
                </label>
                <CustomDropdown
                  value={interviewFilter}
                  onChange={setInterviewFilter}
                  options={interviewDropdownOptions}
                  icon={Calendar}
                  menuWidth="w-64"
                  title="Filter by interview lifecycle status"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                  4. Hiring Decision
                </label>
                <CustomDropdown
                  value={decisionFilter}
                  onChange={setDecisionFilter}
                  options={decisionDropdownOptions}
                  icon={CheckCircle2}
                  menuWidth="w-64"
                  title="Filter by hiring decision status"
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Filters Bar */}
        {activeTab === 'candidates' && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-stone-200/60 dark:border-stone-800 text-xs">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-sans flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-brand-600 dark:text-brand-400" />
              Quick Filter:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'All', label: 'All Candidates', count: totalApplicants },
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
                        : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700/80 border border-transparent hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    {alert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-subtle" />}
                    <span>{label}</span>
                    {count !== undefined && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
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
                  <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Active Filtered Role
                        </span>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {currentJob.title}
                        </h3>
                        <span className="text-xs font-mono text-stone-400">({currentJob.id})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {currentJob.location || 'Remote'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
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
                <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-subtle space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/30 shrink-0">
                        <Inbox className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                            Inbound Applications Inbox
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-brand-100 dark:bg-brand-950/80 text-brand-800 dark:text-brand-300 border border-brand-300 dark:border-brand-800">
                            {appliedCandidates.length} New
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          Newly submitted applications awaiting triage before advancing to active screening.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsInboundExpanded(prev => !prev)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#FDFCFA] hover:bg-stone-100 dark:bg-[#1A1714] dark:hover:bg-[#231F1B] text-stone-700 dark:text-stone-300 text-xs font-semibold transition flex items-center gap-1.5 border border-[#E5E0DA] dark:border-[#2A2520] shrink-0"
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
                            className="p-3 rounded-xl bg-[#FDFCFA] dark:bg-[#14110F] border border-[#E5E0DA] dark:border-[#2A2520] hover:border-brand-500/70 dark:hover:border-brand-500/70 transition shadow-subtle cursor-pointer flex items-center justify-between gap-2 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <Avatar name={cand.name} size="xs" />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 tracking-tight">
                                  {cand.name}
                                </h4>
                                <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate" title={getCandidateJobTitle(cand)}>
                                  {getCandidateJobTitle(cand)}
                                </p>
                                <p className="text-[10px] text-stone-400 truncate">
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
                              className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 shrink-0 text-[10px] font-semibold flex items-center gap-1 transition"
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

              {/* ─── PHASE 4E.4: UNIFIED BULK ACTIONS TOOLBAR ─── */}
              {selectedCandidateIds.length > 0 && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/15 via-amber-500/10 to-[#1A1714] dark:from-brand-950/50 dark:via-amber-950/30 dark:to-[#1A1714] border border-brand-500/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-600/30 font-bold font-mono text-xs">
                      {selectedCandidateIds.length}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {selectedCandidateIds.length} Candidate{selectedCandidateIds.length > 1 ? 's' : ''} Selected
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          • Bulk Pipeline Operations
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {selectedCandidateIds.slice(0, 5).map(cid => {
                          const c = candidates.find(cand => String(cand.id) === String(cid));
                          return (
                            <span key={cid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white dark:bg-[#231F1B] border border-[#E5E0DA] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 shadow-2xs">
                              <span className="truncate max-w-[100px]">{c?.name || cid}</span>
                              <button type="button" onClick={() => toggleCandidateSelection(cid)} className="hover:text-rose-500 cursor-pointer">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}
                        {selectedCandidateIds.length > 5 && (
                          <span className="text-[11px] text-stone-500 font-mono">
                            +{selectedCandidateIds.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={ArrowRight}
                      disabled={isBulkActionLoading}
                      onClick={() => {
                        setBulkTargetStage('screening');
                        setIsBulkStageModalOpen(true);
                      }}
                      title="Advance selected candidates to a chosen pipeline stage"
                    >
                      Advance Stage
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      icon={Code2}
                      disabled={isBulkActionLoading}
                      onClick={handleBulkInviteAssessment}
                      title="Send technical assessment invitations to selected candidates"
                    >
                      Invite Assessment
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      icon={UserCheck}
                      disabled={isBulkActionLoading}
                      onClick={handleBulkShortlist}
                      title="Mark selected candidates as Shortlisted"
                    >
                      Shortlist
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      icon={UserX}
                      disabled={isBulkActionLoading}
                      onClick={() => handleOpenRejectionModal(null)}
                      className="text-rose-600 dark:text-rose-400 hover:border-rose-500"
                      title="Reject selected candidates with audited feedback"
                    >
                      Reject
                    </Button>

                    {/* Phase 4E.3: Compare side-by-side button */}
                    <Button
                      variant="primary"
                      size="xs"
                      icon={Scale}
                      disabled={selectedCandidateIds.length < 2 || selectedCandidateIds.length > 4 || isBulkActionLoading}
                      onClick={handleBulkCompare}
                      title={selectedCandidateIds.length < 2 ? "Select at least 2 candidates from same job to compare" : selectedCandidateIds.length > 4 ? "Select up to 4 candidates to compare" : "Open Phase 4E.3 side-by-side comparison"}
                    >
                      Compare ({Math.min(selectedCandidateIds.length, 4)})
                    </Button>

                    <button
                      type="button"
                      onClick={clearCandidateSelection}
                      className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STANDALONE CANDIDATE COMPARISON ACTION BAR (PHASE 4E.3) ─── */}
              {selectedCandidateIds.length === 0 && selectedForComparison.length > 0 && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-amber-500/10 to-transparent dark:from-brand-950/40 dark:via-amber-950/30 dark:to-[#1A1714] border border-brand-500/30 dark:border-brand-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-600/30">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Candidate Comparison
                        </span>
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/25">
                          {selectedForComparison.length} of 4 selected
                        </span>
                        <span className="text-xs text-stone-400 hidden md:inline">•</span>
                        <span className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate hidden md:inline">
                          Role: <strong className="text-stone-700 dark:text-stone-200">{comparisonJobTitle}</strong>
                        </span>
                      </div>

                      {/* Selected candidate chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {selectedForComparison.map((candId) => {
                          const cand = candidates.find(c => String(c.id) === String(candId));
                          const candName = cand?.name || `Candidate #${candId}`;
                          return (
                            <span
                              key={candId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white dark:bg-[#1E1A16] border border-[#E5E0DA] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 shadow-2xs"
                            >
                              <Avatar name={candName} size="xs" />
                              <span className="truncate max-w-[130px]">{candName}</span>
                              <button
                                type="button"
                                onClick={(e) => toggleCandidateComparison(candId, e)}
                                title="Remove from comparison"
                                className="text-stone-400 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    <button
                      type="button"
                      onClick={clearComparisonSelection}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition cursor-pointer"
                    >
                      Clear All
                    </button>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Scale}
                      disabled={selectedForComparison.length < 2}
                      onClick={() => setIsComparisonModalOpen(true)}
                      title={selectedForComparison.length < 2 ? "Select at least 2 candidates to compare" : "Open side-by-side comparison"}
                    >
                      {selectedForComparison.length < 2 ? "Select 1 more" : `Compare Side-by-Side (${selectedForComparison.length})`}
                    </Button>
                  </div>
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
                            : 'border-[#E5E0DA] dark:border-[#2A2520] bg-stone-100/75 dark:bg-[#14110F]/60 shadow-xs'
                        }`}
                      >
                        {/* Column Header */}
                        <div className="px-3 py-2.5 border-b border-[#E5E0DA] dark:border-[#2A2520] flex items-center justify-between shrink-0 bg-[#FDFCFA]/95 dark:bg-[#1A1714]/90 backdrop-blur-sm rounded-t-xl">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${stage.dotColor} animate-pulse-subtle`} />
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{stage.name}</span>
                          </div>
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-stone-100 dark:bg-[#231F1B] border border-[#E5E0DA] dark:border-[#2A2520] text-stone-700 dark:text-stone-300"
                            title={pipelineSummary ? `Authoritative stage count: ${stage.authoritativeCount}` : undefined}
                          >
                            {pipelineSummary ? (stage.items.length !== stage.authoritativeCount ? `${stage.items.length}/${stage.authoritativeCount}` : stage.authoritativeCount) : stage.items.length}
                          </span>
                        </div>

                        {/* Cards Container with natural flow (Zero scroll trap) */}
                        <div className="p-2 space-y-2 flex-1">
                          {stage.items.length === 0 ? (
                            <div className="h-28 flex items-center justify-center text-[11px] text-stone-500 dark:text-stone-400 font-medium border border-dashed border-[#E5E0DA] dark:border-[#2A2520] rounded-lg">
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
                                : 'text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-[#231F1B] border-[#E5E0DA] dark:border-[#2A2520]';

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
                                  className={`p-3 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border transition-all duration-fast space-y-2 group select-none cursor-pointer animate-fade-in-up ${
                                    draggedCandidateId === cand.id 
                                      ? 'opacity-40 scale-95 border-dashed border-brand-500 shadow-none' 
                                      : selectedCandidateIds.includes(cand.id) || selectedForComparison.includes(cand.id)
                                      ? 'ring-2 ring-brand-500 border-brand-500/80 bg-brand-50/30 dark:bg-brand-950/20'
                                      : 'kanban-card active:scale-[0.98]'
                                  }`}
                                  style={{ animationDelay: `${Math.min(cardIndex * 50, 300)}ms` }}
                                >
                                  {/* PRIMARY HIERARCHY: WHO & WHAT ROLE & FIT */}
                                  <div className="flex items-start justify-between gap-2 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <button
                                        type="button"
                                        onClick={(e) => toggleCandidateSelection(cand, e)}
                                        title={selectedCandidateIds.includes(cand.id) ? "Deselect candidate" : "Select candidate for bulk operations"}
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                          selectedCandidateIds.includes(cand.id)
                                            ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                                            : 'border-stone-300 dark:border-stone-700 hover:border-brand-500 bg-white dark:bg-stone-900 text-transparent'
                                        }`}
                                      >
                                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      </button>
                                      <Avatar name={cand.name} size="xs" />
                                      <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors tracking-tight">
                                          {cand.name}
                                        </h4>
                                        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate" title={getCandidateJobTitle(cand)}>
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
                                            badgeCfg.badgeClass || 'bg-stone-100 dark:bg-[#231F1B] text-stone-700 dark:text-stone-300 border-[#E5E0DA] dark:border-[#2A2520]'
                                          }`}
                                          title={cand.candidateExpectationFormatted ? `Candidate Expects: ${cand.candidateExpectationFormatted} (${badgeCfg.label})` : badgeCfg.label}
                                        >
                                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeCfg.dotColor || 'bg-stone-400'}`} />
                                          <span className="whitespace-nowrap font-medium">
                                            {cand.candidateExpectationFormatted ? `${cand.candidateExpectationFormatted} · ${badgeCfg.shortLabel}` : badgeCfg.shortLabel}
                                          </span>
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {/* PROGRESSIVE HIERARCHY: QUALIFICATIONS & ACTION BUTTONS */}
                                  <div className="pt-1.5 border-t border-stone-100 dark:border-[#2A2520] flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
                                    <div className="flex items-center gap-1 truncate max-w-[120px]">
                                      {cand.skills?.slice(0, 2).map((s, idx) => (
                                        <span key={idx} className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-[#231F1B] text-[10px] font-medium text-stone-700 dark:text-stone-300 truncate">
                                          {s}
                                        </span>
                                      ))}
                                      {(cand.skills?.length || 0) > 2 && (
                                        <span className="text-[10px] font-mono font-semibold text-stone-600 dark:text-stone-300">+{cand.skills.length - 2}</span>
                                      )}
                                    </div>

                                    {/* Quick Actions & Workspace Cue */}
                                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      {NEXT_STAGE_MAP[getCandidateStage(cand)] && !['selected', 'rejected'].includes((cand.hiringDecision || cand.hiring_decision || '').toLowerCase()) && (
                                        <button
                                          type="button"
                                          onClick={(e) => handleQuickAdvance(cand, e)}
                                          title={`Advance to ${STAGE_CONFIG[NEXT_STAGE_MAP[getCandidateStage(cand)]]?.label || NEXT_STAGE_MAP[getCandidateStage(cand)]}`}
                                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 transition flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <span>{NEXT_STAGE_LABELS[getCandidateStage(cand)] || 'Advance'}</span>
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      )}

                                      <span 
                                        onClick={() => handleOpenCandidate(cand)}
                                        className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center gap-0.5 transition-colors cursor-pointer"
                                      >
                                        <span>Review</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </span>

                                      {/* Quick 3-dots Menu */}
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveCardMenuId(prev => prev === cand.id ? null : cand.id);
                                          }}
                                          title="Quick candidate actions"
                                          className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                                        >
                                          <MoreHorizontal className="w-3.5 h-3.5" />
                                        </button>

                                        {activeCardMenuId === cand.id && (
                                          <div 
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-depth-elevated py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 text-xs"
                                          >
                                            {NEXT_STAGE_MAP[getCandidateStage(cand)] && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  handleQuickAdvance(cand, e);
                                                  setActiveCardMenuId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                              >
                                                <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                                                <span>Advance to {STAGE_CONFIG[NEXT_STAGE_MAP[getCandidateStage(cand)]]?.label}</span>
                                              </button>
                                            )}

                                            {wf.assessmentStatus === 'not_invited' && (
                                              <button
                                                type="button"
                                                onClick={(e) => handleQuickInviteAssessment(cand, e)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                              >
                                                <Code2 className="w-3.5 h-3.5 text-purple-600" />
                                                <span>Invite Assessment</span>
                                              </button>
                                            )}

                                            {wf.hiringDecision !== 'shortlisted' && wf.hiringDecision !== 'selected' && (
                                              <button
                                                type="button"
                                                onClick={(e) => handleQuickShortlist(cand, e)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                              >
                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Shortlist Candidate</span>
                                              </button>
                                            )}

                                            {wf.hiringDecision !== 'rejected' && (
                                              <button
                                                type="button"
                                                onClick={(e) => handleOpenRejectionModal(cand, e)}
                                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                                              >
                                                <UserX className="w-3.5 h-3.5" />
                                                <span>Reject Candidate</span>
                                              </button>
                                            )}

                                            <div className="my-1 border-t border-stone-200 dark:border-[#2A2520]" />

                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                toggleCandidateComparison(cand, e);
                                                setActiveCardMenuId(null);
                                              }}
                                              className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                            >
                                              <Scale className="w-3.5 h-3.5 text-amber-600" />
                                              <span>{selectedForComparison.includes(cand.id) ? 'Remove Compare' : 'Add to Compare'}</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Mobile Touch Stage Selector */}
                                  <div 
                                    className="sm:hidden pt-1.5 border-t border-stone-100 dark:border-[#2A2520] flex items-center justify-between"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Stage:</span>
                                    <select
                                      value={stage.id}
                                      onChange={(e) => handleStageDrop(cand.id, e.target.value)}
                                      className="text-[10px] font-semibold bg-stone-50 dark:bg-[#231F1B] border border-[#E5E0DA] dark:border-[#2A2520] rounded-lg px-2 py-0.5 text-stone-700 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brand-500 [&>option]:bg-white dark:[&>option]:bg-[#1A1714] dark:[&>option]:text-stone-100"
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
            <div className="rounded-xl border border-[#E5E0DA] dark:border-[#2A2520] bg-[#FDFCFA] dark:bg-[#1A1714] overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100/80 dark:bg-[#14110F] border-b border-[#E5E0DA] dark:border-[#2A2520] text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={selectAllVisibleCandidates}
                          title={selectedCandidateIds.length === filteredCandidates.length && filteredCandidates.length > 0 ? "Deselect all" : "Select all visible candidates"}
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all mx-auto cursor-pointer ${
                            selectedCandidateIds.length > 0 && selectedCandidateIds.length === filteredCandidates.length
                              ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                              : selectedCandidateIds.length > 0
                              ? 'bg-brand-600/30 border-brand-600 text-brand-600'
                              : 'border-stone-300 dark:border-stone-700 hover:border-brand-500 bg-white dark:bg-stone-900 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </button>
                      </th>
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
                          className={`transition-all duration-150 cursor-pointer group ${
                            selectedCandidateIds.includes(cand.id)
                              ? 'bg-brand-500/10 dark:bg-brand-950/30'
                              : 'hover:bg-stone-50/70 dark:hover:bg-stone-900/40'
                          }`}
                        >
                          <td className="w-10 px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => toggleCandidateSelection(cand, e)}
                              title={selectedCandidateIds.includes(cand.id) ? "Deselect candidate" : "Select candidate"}
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all mx-auto cursor-pointer ${
                                selectedCandidateIds.includes(cand.id)
                                  ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                                  : 'border-stone-300 dark:border-stone-700 hover:border-brand-500 bg-white dark:bg-stone-900 text-transparent'
                              }`}
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                          </td>
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
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {NEXT_STAGE_MAP[getCandidateStage(cand)] && !['selected', 'rejected'].includes((cand.hiringDecision || cand.hiring_decision || '').toLowerCase()) && (
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickAdvance(cand, e)}
                                  title={`Advance to ${STAGE_CONFIG[NEXT_STAGE_MAP[getCandidateStage(cand)]]?.label || NEXT_STAGE_MAP[getCandidateStage(cand)]}`}
                                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{NEXT_STAGE_LABELS[getCandidateStage(cand)] || 'Advance'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

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

                              {/* 3-dots Quick Actions dropdown */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveCardMenuId(prev => prev === cand.id ? null : cand.id);
                                  }}
                                  title="Quick candidate actions"
                                  className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {activeCardMenuId === cand.id && (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 bottom-full mb-1.5 w-48 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-depth-elevated py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150 text-xs text-left"
                                  >
                                    {NEXT_STAGE_MAP[getCandidateStage(cand)] && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          handleQuickAdvance(cand, e);
                                          setActiveCardMenuId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                      >
                                        <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                                        <span>Advance to {STAGE_CONFIG[NEXT_STAGE_MAP[getCandidateStage(cand)]]?.label}</span>
                                      </button>
                                    )}

                                    {wf.assessmentStatus === 'not_invited' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          handleQuickInviteAssessment(cand, e);
                                          setActiveCardMenuId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                      >
                                        <Send className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Invite Assessment</span>
                                      </button>
                                    )}

                                    {wf.hiringDecision !== 'shortlisted' && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          handleQuickShortlist(cand, e);
                                          setActiveCardMenuId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                      >
                                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Shortlist</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        toggleCandidateComparison(cand, e);
                                        setActiveCardMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-[#231F1B] flex items-center gap-2 text-stone-700 dark:text-stone-200 cursor-pointer"
                                    >
                                      <Scale className="w-3.5 h-3.5 text-amber-600" />
                                      <span>{selectedForComparison.includes(cand.id) ? 'Remove Compare' : 'Add to Compare'}</span>
                                    </button>

                                    <div className="my-1 border-t border-stone-200 dark:border-stone-800" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        handleOpenRejectionModal(cand, e);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Reject Application...</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
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
        <div className="space-y-4 animate-fade-in-up">
          {/* Sub-filter tabs for Requisitions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono mr-1">
                Filter Status:
              </span>
              {[
                { id: 'All', label: 'All Requisitions', count: jobs.length },
                { id: 'Active', label: 'Active Hiring', count: jobs.filter(j => (j.status || 'Active') === 'Active').length },
                { id: 'Paused', label: 'Paused', count: jobs.filter(j => j.status === 'Paused').length },
                { id: 'Closed', label: 'Closed', count: jobs.filter(j => j.status === 'Closed').length },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setJobStatusTabFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    jobStatusTabFilter === tab.id
                      ? 'bg-brand-600 text-white shadow-subtle'
                      : 'bg-stone-100 dark:bg-[#231F1B] text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-[#2A2520]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    jobStatusTabFilter === tab.id ? 'bg-white/20 text-white' : 'bg-stone-200 dark:bg-[#2A2520] text-stone-600 dark:text-stone-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => {
                setJobToEdit(null);
                setIsJobModalOpen(true);
              }}
            >
              Post New Job
            </Button>
          </div>

          {/* Job Requisition Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs
              .filter(j => {
                if (jobStatusTabFilter === 'Active') return (j.status || 'Active') === 'Active';
                if (jobStatusTabFilter === 'Paused') return j.status === 'Paused';
                if (jobStatusTabFilter === 'Closed') return j.status === 'Closed';
                return true;
              })
              .map((job) => {
                const applicantsForThisJob = candidates.filter(c => String(c.jobId) === String(job.id));
                const isNewlyCreated = highlightedJobId === job.id;
                const statusStr = job.status || 'Active';

                return (
                  <div
                    key={job.id}
                    className={`p-5 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border transition-all duration-200 flex flex-col justify-between space-y-4 shadow-card interactive-card ${
                      isNewlyCreated
                        ? 'border-brand-500 ring-2 ring-brand-500/20'
                        : statusStr === 'Closed'
                        ? 'border-[#E5E0DA] dark:border-[#2A2520]/60 opacity-85'
                        : 'border-[#E5E0DA] dark:border-[#2A2520]'
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

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          statusStr === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : statusStr === 'Paused'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                            : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/25'
                        }`}>
                          {statusStr}
                        </span>
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
                          {applicantsForThisJob.length} Candidates Preserved
                        </span>
                      </div>

                      {/* Compensation Budget Badge */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold">
                          <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                          <span>{formatJobCTC(job)}</span>
                        </span>
                      </div>

                      {statusStr === 'Closed' && job.closure_reason && (
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Closure Note: </span>
                          <span>{job.closure_reason}</span>
                        </div>
                      )}

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

                    {/* Footer Controls & State Transition Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setSelectedJobFilter(job.id);
                            setActiveTab('candidates');
                            setSearchParams({});
                          }}
                        >
                          View Candidates ({applicantsForThisJob.length})
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Edit3}
                          onClick={() => {
                            setJobToEdit(job);
                            setIsJobModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {statusStr === 'Active' && (
                          <>
                            <button
                              type="button"
                              onClick={() => changeJobStatus(job.id, 'Paused')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition"
                            >
                              Pause
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setClosingJobModal(job);
                                setClosureReasonText('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              Close
                            </button>
                          </>
                        )}
                        {statusStr === 'Paused' && (
                          <>
                            <button
                              type="button"
                              onClick={() => changeJobStatus(job.id, 'Active')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                            >
                              Reactivate
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setClosingJobModal(job);
                                setClosureReasonText('');
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                              Close
                            </button>
                          </>
                        )}
                        {statusStr === 'Closed' && (
                          <button
                            type="button"
                            onClick={() => changeJobStatus(job.id, 'Active')}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                          >
                            Reactivate Requisition
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Closure Reason Modal */}
      {closingJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#14161F] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Close Requisition: {closingJobModal.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Closing this job will prevent candidates from submitting new applications. All existing application dossiers, assessment results, and candidate history will remain 100% preserved.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Closure Reason (Optional):
              </label>
              <input
                type="text"
                value={closureReasonText}
                onChange={(e) => setClosureReasonText(e.target.value)}
                placeholder="e.g. Position filled, Budget reallocated, Headcount frozen..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setClosingJobModal(null);
                  setClosureReasonText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  await changeJobStatus(closingJobModal.id, 'Closed', closureReasonText.trim() || undefined);
                  setClosingJobModal(null);
                  setClosureReasonText('');
                }}
              >
                Confirm Closure
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Ask SparkX Intelligence Drawer */}
      <AskSparkxDrawer
        isOpen={isAskSparkxOpen}
        onClose={() => setIsAskSparkxOpen(false)}
        initialContextCandidate={selectedCandidate}
        initialContextJob={activeJob}
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

      {/* ─── PHASE 4E.4: BULK STAGE TRANSITION MODAL ─── */}
      {isBulkStageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-600" />
                  <span>Advance Candidates in Bulk</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Move <span className="font-bold text-brand-600 dark:text-brand-400">{selectedCandidateIds.length} selected candidate(s)</span> to a target stage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkStageModalOpen(false);
                  setBulkStageNotes('');
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#231F1B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Target Hiring Stage
                </label>
                <CustomDropdown
                  value={bulkTargetStage}
                  onChange={(val) => setBulkTargetStage(val)}
                  options={[
                    { value: 'screening', label: 'Screening' },
                    { value: 'assessment', label: 'Technical Assessment' },
                    { value: 'interview', label: 'Interview' },
                    { value: 'review', label: 'Evaluation & Review' },
                    { value: 'completed', label: 'Completed' }
                  ]}
                  className="w-full text-xs"
                  menuWidth="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Audit Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bulkStageNotes}
                  onChange={(e) => setBulkStageNotes(e.target.value)}
                  placeholder="Reason for advancing candidates (e.g. Cleared resume screening round, bulk cohort progression)..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#231F1B] border border-[#E5E0DA] dark:border-[#2A2520] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-stone-100/70 dark:bg-[#231F1B]/60 border border-[#E5E0DA] dark:border-[#2A2520] text-[11px] text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Guardrails: </span>
                Candidates with finalized outcomes (Selected or Rejected) cannot be moved without reopening. Any invalid transitions will be reported.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsBulkStageModalOpen(false);
                  setBulkStageNotes('');
                }}
                disabled={isBulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkStageChange(bulkTargetStage, bulkStageNotes)}
                isLoading={isBulkActionLoading}
              >
                Confirm Move ({selectedCandidateIds.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PHASE 4E.4: CANDIDATE REJECTION MODAL ─── */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  <span>Reject Application{rejectionTargetCandidate ? '' : ` (${selectedCandidateIds.length})`}</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {rejectionTargetCandidate ? (
                    <>Rejecting candidate: <span className="font-bold text-stone-900 dark:text-stone-100">{typeof rejectionTargetCandidate === 'object' ? rejectionTargetCandidate.name : 'Selected Candidate'}</span></>
                  ) : (
                    <>Rejecting <span className="font-bold text-rose-600 dark:text-rose-400">{selectedCandidateIds.length} candidate(s)</span> in bulk.</>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRejectionModalOpen(false);
                  setRejectionTargetCandidate(null);
                  setRejectionReasonText('');
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-[#231F1B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Rejection Category
                </label>
                <CustomDropdown
                  value={rejectionCategory}
                  onChange={(val) => setRejectionCategory(val)}
                  options={[
                    { value: 'skills_mismatch', label: 'Core Skills Mismatch' },
                    { value: 'assessment_failed', label: 'Failed Assessment Benchmark' },
                    { value: 'interview_rejected', label: 'Interview Evaluation Rejection' },
                    { value: 'experience_insufficient', label: 'Insufficient Experience' },
                    { value: 'compensation_mismatch', label: 'Compensation Expectation Above Budget' },
                    { value: 'cultural_fit', label: 'Role Fit / Collaboration Concerns' },
                    { value: 'withdrawn', label: 'Candidate Withdrawn' },
                    { value: 'other', label: 'Other Reason' }
                  ]}
                  className="w-full text-xs"
                  menuWidth="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                  Feedback / Audit Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  placeholder="Specific feedback or rationale recorded for compliance..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-[#231F1B] border border-[#E5E0DA] dark:border-[#2A2520] text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-700 dark:text-rose-300">
                <span className="font-semibold">Notice: </span>
                This will set the candidate hiring decision dimension to <strong className="uppercase">Rejected</strong>. An immutable audit record will be logged in the database.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsRejectionModalOpen(false);
                  setRejectionTargetCandidate(null);
                  setRejectionReasonText('');
                }}
                disabled={isBulkActionLoading}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleExecuteRejection}
                disabled={isBulkActionLoading}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBulkActionLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SIDE-BY-SIDE CANDIDATE COMPARISON MODAL (PHASE 4E.3) ─── */}
      {isComparisonModalOpen && comparisonJobId && (
        <CandidateComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => setIsComparisonModalOpen(false)}
          jobId={comparisonJobId}
          jobTitle={comparisonJobTitle}
          candidateIds={selectedForComparison}
          onSelectCandidate={(candId, initialTab, compContext) => {
            setIsComparisonModalOpen(false);
            const target = candidates.find((c) => String(c.id) === String(candId));
            if (target) handleOpenCandidate(target, initialTab || 'scorecard', { comparisonContext: compContext });
          }}
        />
      )}
    </div>
  );
}
