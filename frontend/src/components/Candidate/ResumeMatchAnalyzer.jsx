import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';
import {
  Target, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, XCircle,
  ArrowRight, ShieldCheck, ChevronRight, FileText, Briefcase, Award,
  TrendingUp, RefreshCw, Trash2, Eye, Clock, BarChart3, ChevronDown,
  Check, Layers, ExternalLink, Info, Zap, BookOpen, GraduationCap,
  Building2, User, ArrowLeft, History, Filter, CheckCircle, HelpCircle
} from 'lucide-react';
import { AreteEmblem } from '../ui/AreteLogo';
import FancyStudioDropdown from '../ui/FancyStudioDropdown';

export default function ResumeMatchAnalyzer() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs = [], activeJob, currentUser, theme } = useRecruitment();
  const { showToast } = useToast();

  // Selection state
  const [resumes, setResumes] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(() => searchParams.get('jobId') || '');
  const [selectedResumeId, setSelectedResumeId] = useState(() => searchParams.get('resumeId') || '');

  // Analysis & Loading state
  const [analysis, setAnalysis] = useState(null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // UI tabs & history state
  const [activeInspectorTab, setActiveInspectorTab] = useState('job'); // 'job' | 'resume'
  const [skillFilter, setSkillFilter] = useState('all'); // 'all' | 'matched' | 'partial' | 'missing'
  const [historyList, setHistoryList] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  // 1. Fetch Candidate Saved Resumes
  const fetchResumes = useCallback(async () => {
    try {
      setIsLoadingResumes(true);
      const list = await api.getResumes();
      const validList = Array.isArray(list) ? list : [];
      setResumes(validList);

      // Auto-select resume if param provided or if only 1 resume exists
      const queryResumeId = searchParams.get('resumeId');
      if (queryResumeId && validList.some(r => r.id === queryResumeId)) {
        setSelectedResumeId(queryResumeId);
      } else if (!selectedResumeId && validList.length > 0) {
        setSelectedResumeId(validList[0].id);
      }
    } catch (err) {
      console.warn('Failed to load candidate resumes:', err);
      showToast?.('Unable to load saved resumes', 'error');
    } finally {
      setIsLoadingResumes(false);
    }
  }, [searchParams, selectedResumeId, showToast]);

  // 2. Fetch Analysis History
  const fetchHistory = useCallback(async () => {
    try {
      const history = await api.getMatchAnalysesHistory();
      setHistoryList(Array.isArray(history) ? history : []);
    } catch (err) {
      console.warn('Failed to load match history:', err);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
    fetchHistory();
  }, [fetchResumes, fetchHistory]);

  // 3. Sync query params if updated externally
  useEffect(() => {
    const qJob = searchParams.get('jobId');
    const qResume = searchParams.get('resumeId');
    const qAnalysis = searchParams.get('analysisId');

    if (qJob && qJob !== selectedJobId) setSelectedJobId(qJob);
    if (qResume && qResume !== selectedResumeId) setSelectedResumeId(qResume);

    if (qAnalysis) {
      loadSpecificAnalysis(qAnalysis);
    }
  }, [searchParams]);

  // Selected entities objects
  const selectedJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const selectedResume = useMemo(() => {
    return resumes.find(r => r.id === selectedResumeId) || null;
  }, [resumes, selectedResumeId]);

  // Options for FancyStudioDropdown
  const jobOptions = useMemo(() => {
    return jobs.map((job) => ({
      value: job.id,
      label: job.title,
      badge: job.department || 'Active',
      icon: Briefcase,
      description: `${job.company_name || 'SparkX Technologies'} • ${job.location || 'Remote'} • ${job.min_experience_years || 2}+ yrs exp • ${job.required_skills?.length || 0} skills`
    }));
  }, [jobs]);

  const resumeOptions = useMemo(() => {
    return resumes.map((res) => ({
      value: res.id,
      label: res.title || 'Untitled Resume',
      badge: `v${res.version || 1}`,
      icon: FileText,
      description: `Version ${res.version || 1} • ${res.skills?.length || 0} skills • ${res.experience?.length || 0} roles • Updated ${new Date(res.updated_at).toLocaleDateString()}`
    }));
  }, [resumes]);

  // 4. Auto-check if a saved analysis exists for current (resume, job) selection
  useEffect(() => {
    if (!selectedResumeId || !selectedJobId) {
      return;
    }

    let isMounted = true;
    const checkSaved = async () => {
      try {
        setIsCheckingSaved(true);
        setErrorMsg('');
        const saved = await api.getLatestResumeJobAnalysis(selectedResumeId, selectedJobId);
        if (isMounted && saved && saved.id) {
          setAnalysis(saved);
        }
      } catch (err) {
        console.warn('Error checking saved analysis:', err);
      } finally {
        if (isMounted) setIsCheckingSaved(false);
      }
    };

    checkSaved();
    return () => { isMounted = false; };
  }, [selectedResumeId, selectedJobId]);

  // Load specific analysis by ID
  const loadSpecificAnalysis = async (analysisId) => {
    try {
      setIsAnalyzing(true);
      setErrorMsg('');
      const data = await api.getMatchAnalysis(analysisId);
      if (data) {
        setAnalysis(data);
        if (data.job_id) setSelectedJobId(data.job_id);
        if (data.resume_id) setSelectedResumeId(data.resume_id);
        showToast?.('Loaded saved match analysis', 'info');
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setErrorMsg(err.message || 'Failed to retrieve analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run or re-run Match Analysis
  const handleRunAnalysis = async () => {
    if (!selectedResumeId) {
      showToast?.('Please select a resume version first', 'warning');
      return;
    }
    if (!selectedJobId) {
      showToast?.('Please select a target job position', 'warning');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg('');
      const result = await api.analyzeSpecificResumeMatch(selectedResumeId, {
        job_id: selectedJobId
      });

      if (result) {
        setAnalysis(result);
        showToast?.(`Match analysis complete (${result.match_score.toFixed(0)}% match)`, 'success');
        fetchHistory(); // Refresh history list
      }
    } catch (err) {
      console.error('Match analysis failed:', err);
      setErrorMsg(err.message || 'Analysis failed. Please check backend connection.');
      showToast?.(err.message || 'Analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete analysis from history
  const handleDeleteAnalysis = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.deleteMatchAnalysis(id);
      showToast?.('Saved analysis removed', 'info');
      if (analysis?.id === id) {
        setAnalysis(null);
      }
      fetchHistory();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast?.('Failed to delete analysis', 'error');
    }
  };

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    if (!analysis?.skills) return [];
    if (skillFilter === 'all') return analysis.skills;
    if (skillFilter === 'matched') {
      return analysis.skills.filter(s => s.status === 'matched' || s.status === 'verified_match');
    }
    if (skillFilter === 'partial') {
      return analysis.skills.filter(s => s.status === 'partially_satisfied');
    }
    if (skillFilter === 'missing') {
      return analysis.skills.filter(s => s.status === 'missing');
    }
    return analysis.skills;
  }, [analysis?.skills, skillFilter]);

  // Skill count stats
  const skillStats = useMemo(() => {
    const list = analysis?.skills || [];
    const total = list.length;
    const matched = list.filter(s => s.status === 'matched' || s.status === 'verified_match').length;
    const partial = list.filter(s => s.status === 'partially_satisfied').length;
    const missing = list.filter(s => s.status === 'missing').length;
    return { total, matched, partial, missing };
  }, [analysis?.skills]);

  // Score color helper
  const getScoreTheme = (score) => {
    if (score >= 80) return {
      text: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-300 dark:border-emerald-800',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      gaugeStroke: '#10B981'
    };
    if (score >= 60) return {
      text: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-300 dark:border-amber-800',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      gaugeStroke: '#F59E0B'
    };
    if (score >= 40) return {
      text: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-300 dark:border-orange-800',
      badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
      gaugeStroke: '#F97316'
    };
    return {
      text: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-300 dark:border-rose-800',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      gaugeStroke: '#EF4444'
    };
  };

  const scoreTheme = getScoreTheme(analysis?.match_score || 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#120D0A] text-stone-900 dark:text-[#E6D5C3] transition-colors pb-24">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-[#2D1F17] bg-[#FDFBF7]/90 dark:bg-[#120D0A]/90 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="shrink-0 pt-0.5">
              <AreteEmblem size={40} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Target className="w-3.5 h-3.5" />
                  ARETE Talent Intelligence
                </span>
                <span className="text-xs text-stone-600 dark:text-[#B5A193] font-mono">
                  ARETE Engine v4.8
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-[#F5EBE1]">
                AI Resume ↔ Job Description Match Analyzer
              </h1>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-[#C4B2A5]">
                Deterministic multi-pillar scoring with grounded verbatim resume excerpts and platform verification.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowMethodologyModal(true)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#3E2D23] hover:bg-stone-100 dark:hover:bg-[#201814] text-xs font-medium text-stone-700 dark:text-[#D5C2B4] transition-all flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5 text-amber-500" />
              Scoring Methodology
            </button>

            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-[#3E2D23] hover:bg-stone-100 dark:hover:bg-[#201814] text-xs font-medium text-stone-700 dark:text-[#D5C2B4] transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-amber-500" />
              History ({historyList.length})
            </button>

            {selectedResumeId && (
              <Link
                to={`/resume-studio/${selectedResumeId}`}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-700 dark:text-amber-300 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Edit in AI Resume Studio
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ─────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Selection Cards Bar */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Filter className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-900 dark:text-[#E6D5C3]">
                1. Select Analysis Pair
              </h2>
            </div>
            <span className="text-xs text-stone-600 dark:text-[#B5A193]">
              Select any active requisition and your desired resume draft
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Job Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-700 dark:text-[#D5C2B4] flex items-center justify-between">
                <span>Target Job Requisition</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  {jobs.length} Active Positions
                </span>
              </label>
              <FancyStudioDropdown
                value={selectedJobId}
                onChange={(val) => {
                  setSelectedJobId(val);
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (val) next.set('jobId', val);
                    else next.delete('jobId');
                    return next;
                  });
                }}
                options={jobOptions}
                placeholder="-- Choose Job Opening --"
                icon={Briefcase}
                searchable={true}
                searchPlaceholder="Search positions, departments, locations..."
                menuWidth="w-full"
                className="w-full"
                showBadgeInTrigger={true}
              />

              {selectedJob && (
                <div className="text-xs text-stone-700 dark:text-[#C4B2A5] flex items-center gap-3 pt-1">
                  <span>Exp: {selectedJob.min_experience_years || 2}+ years</span>
                  <span>•</span>
                  <span>{selectedJob.required_skills?.length || 0} Required Skills</span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono">{selectedJob.department}</span>
                </div>
              )}
            </div>

            {/* Candidate Resume Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-700 dark:text-[#D5C2B4] flex items-center justify-between">
                <span>Your Resume Version</span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                  {resumes.length} Saved Resumes
                </span>
              </label>
              <FancyStudioDropdown
                value={selectedResumeId}
                onChange={(val) => {
                  setSelectedResumeId(val);
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (val) next.set('resumeId', val);
                    else next.delete('resumeId');
                    return next;
                  });
                }}
                options={resumeOptions}
                placeholder={isLoadingResumes ? 'Loading your resumes...' : resumes.length === 0 ? 'No resumes found. Create one in AI Resume Studio!' : '-- Choose Resume Draft --'}
                icon={FileText}
                searchable={true}
                searchPlaceholder="Search your resumes..."
                menuWidth="w-full"
                className="w-full"
                showBadgeInTrigger={true}
                disabled={isLoadingResumes || resumes.length === 0}
              />

              {selectedResume && (
                <div className="text-xs text-stone-700 dark:text-[#C4B2A5] flex items-center gap-3 pt-1">
                  <span>Version {selectedResume.version || 1}</span>
                  <span>•</span>
                  <span>{selectedResume.skills?.length || 0} Listed Skills</span>
                  <span>•</span>
                  <span>{selectedResume.experience?.length || 0} Roles</span>
                </div>
              )}
            </div>
          </div>

          {/* Analyze CTA Button and Pre-Loaded Badge */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200 dark:border-[#2D1F17]">
            <div className="text-xs text-stone-700 dark:text-[#C4B2A5]">
              {analysis ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    Analysis Persisted in DB • Last evaluated on{' '}
                    <span className="font-mono text-stone-700 dark:text-stone-300">
                      {new Date(analysis.updated_at).toLocaleString()}
                    </span>
                  </span>
                </div>
              ) : isCheckingSaved ? (
                <span className="flex items-center gap-2 text-stone-600 dark:text-[#B5A193]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Checking database for existing analysis...
                </span>
              ) : (
                <span>Ready to run fresh deterministic match analysis.</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleRunAnalysis}
                disabled={!selectedJobId || !selectedResumeId || isAnalyzing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Extracting Evidence & Scoring...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    {analysis ? 'Re-Analyze Match' : 'Run Match Analysis'}
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </section>

        {/* ── Pre-Analysis Inspector Tabs ───────────────────────────── */}
        <section className="rounded-2xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveInspectorTab('job')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  activeInspectorTab === 'job'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    : 'text-stone-700 dark:text-[#C4B2A5] hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Selected Job Details
              </button>
              <button
                onClick={() => setActiveInspectorTab('resume')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  activeInspectorTab === 'resume'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                    : 'text-stone-700 dark:text-[#C4B2A5] hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Selected Resume Preview
              </button>
            </div>
            <span className="text-[11px] text-stone-600 dark:text-[#B5A193] font-mono">
              Ground-Truth Inspection
            </span>
          </div>

          {activeInspectorTab === 'job' ? (
            selectedJob ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {selectedJob.title}
                    </h3>
                    <p className="text-xs text-stone-700 dark:text-[#C4B2A5]">
                      {selectedJob.company_name || 'SparkX Technologies'} • {selectedJob.department} • {selectedJob.location || 'Remote'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] text-stone-700 dark:text-[#D5C2B4]">
                      Min Exp: {selectedJob.min_experience_years || 2} Years
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] text-stone-700 dark:text-[#D5C2B4]">
                      Degree: {selectedJob.education || 'CS or Equivalent'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-[#B5A193] mb-1.5">
                    Required Job Skills ({selectedJob.required_skills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedJob.required_skills || []).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-amber-500/5 border border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-300"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedJob.description && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-[#B5A193] mb-1">
                      Job Description Excerpt
                    </h4>
                    <p className="text-xs text-stone-700 dark:text-[#C4B2A5] leading-relaxed bg-stone-50 dark:bg-[#201814] p-3 rounded-xl border border-stone-200 dark:border-[#382A20]">
                      {selectedJob.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-600 dark:text-[#B5A193] italic py-4">
                Please select a job position from the dropdown above to inspect requirements.
              </p>
            )
          ) : (
            selectedResume ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {selectedResume.title}
                    </h3>
                    <p className="text-xs text-stone-700 dark:text-[#C4B2A5]">
                      Version {selectedResume.version || 1} • Last updated {new Date(selectedResume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/resume-studio/${selectedResume.id}`}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    Open in Full Studio <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {selectedResume.summary && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-[#B5A193] mb-1">
                      Professional Summary
                    </h4>
                    <p className="text-xs text-stone-700 dark:text-[#C4B2A5] leading-relaxed bg-stone-50 dark:bg-[#201814] p-3 rounded-xl border border-stone-200 dark:border-[#382A20]">
                      "{selectedResume.summary}"
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-[#B5A193] mb-1.5">
                    Skills Declared ({selectedResume.skills?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedResume.skills || []).map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] text-xs font-medium text-stone-700 dark:text-[#D5C2B4]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedResume.experience?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-[#B5A193] mb-1.5">
                      Work Experience Entries ({selectedResume.experience.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedResume.experience.map((exp, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] text-xs space-y-1">
                          <div className="font-semibold text-stone-900 dark:text-[#F5EBE1] flex justify-between">
                            <span>{exp.title} — {exp.company}</span>
                            <span className="text-stone-600 dark:text-[#B5A193] font-normal">{exp.start_date} - {exp.end_date || 'Present'}</span>
                          </div>
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className="list-disc list-inside text-stone-700 dark:text-[#C4B2A5] space-y-0.5 pt-1">
                              {exp.bullets.slice(0, 2).map((b, bIdx) => (
                                <li key={bIdx} className="line-clamp-1">{b}</li>
                              ))}
                              {exp.bullets.length > 2 && (
                                <li className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                                  +{exp.bullets.length - 2} more bullet points
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-600 dark:text-[#B5A193] italic py-4">
                Please select a resume version from the dropdown above to preview.
              </p>
            )
          )}
        </section>

        {/* ── Match Results Display (If Analysis Available) ─────────── */}
        {analysis ? (
          <div className="space-y-8 animate-fade-in">
            {/* ── Section A: Overall Match Hero Card ── */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] shadow-sm relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Score Radial / Donut */}
                <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-stone-100 dark:stroke-[#261C16]"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* Animated Score Progress */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={scoreTheme.gaugeStroke}
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - Math.min(100, Math.max(0, analysis.match_score)) / 100)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className={`text-3xl font-extrabold tracking-tight ${scoreTheme.text}`}>
                        {Math.round(analysis.match_score)}%
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-stone-600 dark:text-[#B5A193]">
                        Overall Match
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${scoreTheme.badge}`}>
                        {analysis.status === 'strong_match' ? 'Strong Match' :
                         analysis.status === 'good_match' ? 'Good Match' :
                         analysis.status === 'moderate_match' ? 'Moderate Fit' : 'Needs Development'}
                      </span>
                      <span className="text-xs text-stone-600 dark:text-[#B5A193] font-mono">
                        {analysis.must_have_matched} of {analysis.must_have_total} Must-Haves
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.match_score >= 70 ? 'High Requisition Compatibility' :
                       analysis.match_score >= 45 ? 'Moderate Requisition Overlap' : 'Substantial Evidence Gap'}
                    </h3>

                    <p className="text-xs text-stone-700 dark:text-[#C4B2A5] max-w-xl leading-relaxed">
                      {analysis.summary_verdict}
                    </p>
                  </div>
                </div>

                {/* Four Pillar Quick Metrics */}
                <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-600 dark:text-[#B5A193] flex items-center justify-between">
                      <span>Domain Skills</span>
                      <span className="text-amber-500 font-mono">40% Wt</span>
                    </div>
                    <div className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.category_scores?.domain_skills || 0} / 40 pts
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${((analysis.category_scores?.domain_skills || 0) / 40) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-600 dark:text-[#B5A193] flex items-center justify-between">
                      <span>Experience</span>
                      <span className="text-amber-500 font-mono">25% Wt</span>
                    </div>
                    <div className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.category_scores?.experience || 0} / 25 pts
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${((analysis.category_scores?.experience || 0) / 25) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-600 dark:text-[#B5A193] flex items-center justify-between">
                      <span>Responsibilities</span>
                      <span className="text-amber-500 font-mono">20% Wt</span>
                    </div>
                    <div className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.category_scores?.responsibilities || 0} / 20 pts
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${((analysis.category_scores?.responsibilities || 0) / 20) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] space-y-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-stone-600 dark:text-[#B5A193] flex items-center justify-between">
                      <span>Education</span>
                      <span className="text-amber-500 font-mono">15% Wt</span>
                    </div>
                    <div className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.category_scores?.education || 0} / 15 pts
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${((analysis.category_scores?.education || 0) / 15) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ethical Transparency Banner */}
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-[#2D1F17] flex items-start gap-2.5 text-xs text-stone-700 dark:text-[#C4B2A5]">
                <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Ethical AI Guardrail:</strong> This match score reflects concrete overlap between your uploaded resume and the specified job criteria. It is an internal alignment indicator and does not represent a probability of getting hired or guarantee interview selection.
                </span>
              </div>
            </section>

            {/* ── Section B: Traceable Skill Evidence Matrix ── */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-[#2D1F17] pb-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-[#F5EBE1] flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    2. Traceable Skill Evidence Matrix
                  </h3>
                  <p className="text-xs text-stone-700 dark:text-[#C4B2A5]">
                    Concrete quotes and section citations extracted verbatim from your resume bullets.
                  </p>
                </div>

                {/* Skill Filter Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setSkillFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      skillFilter === 'all'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-[#201814] text-stone-700 dark:text-[#C4B2A5] hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    All ({skillStats.total})
                  </button>
                  <button
                    onClick={() => setSkillFilter('matched')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      skillFilter === 'matched'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-[#201814] text-stone-700 dark:text-[#C4B2A5] hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    Matched ({skillStats.matched})
                  </button>
                  <button
                    onClick={() => setSkillFilter('partial')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      skillFilter === 'partial'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-[#201814] text-stone-700 dark:text-[#C4B2A5] hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    Needs Evidence ({skillStats.partial})
                  </button>
                  <button
                    onClick={() => setSkillFilter('missing')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      skillFilter === 'missing'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-[#201814] text-stone-700 dark:text-[#C4B2A5] hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    Missing ({skillStats.missing})
                  </button>
                </div>
              </div>

              {/* Skill Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map((sk, idx) => {
                  const isVerified = sk.status === 'verified_match';
                  const isMatched = sk.status === 'matched';
                  const isPartial = sk.status === 'partially_satisfied';
                  const isMissing = sk.status === 'missing';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isVerified
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                          : isMatched
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50'
                          : isPartial
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                          : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/50'
                      }`}
                    >
                      {/* Skill Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-stone-900 dark:text-[#F5EBE1]">
                              {sk.skill_name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#2A1D15] text-stone-600 dark:text-[#D5C2B4] font-medium border border-stone-200 dark:border-[#3E2D23]">
                              {sk.category}
                            </span>
                          </div>
                          <span className="text-[11px] text-stone-600 dark:text-[#B5A193] font-mono">
                            {sk.requirement_type === 'must_have' ? 'Required Must-Have' : 'Preferred Nice-to-Have'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Platform Verified
                            </span>
                          )}
                          {isMatched && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Matched
                            </span>
                          )}
                          {isPartial && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Needs Evidence
                            </span>
                          )}
                          {isMissing && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5" />
                              Missing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evidence Quote / Citation */}
                      {sk.evidence_quote ? (
                        <div className="p-3 rounded-xl bg-white dark:bg-[#120D0A] border border-stone-200 dark:border-[#2D1F17] space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            <span>CITATION: {sk.evidence_section}</span>
                            <span className="text-stone-600 dark:text-[#B5A193]">Verbatim Resume Match</span>
                          </div>
                          <p className="text-xs text-stone-700 dark:text-[#D5C2B4] italic leading-relaxed">
                            "{sk.evidence_quote}"
                          </p>
                        </div>
                      ) : sk.status === 'partially_satisfied' ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                          Listed in skills section, but missing concrete project achievements or work history bullets describing its application.
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400">
                          No evidence or declared mention located in this resume version.
                        </div>
                      )}

                      {/* Explanation note */}
                      <p className="text-[11px] text-stone-600 dark:text-[#B5A193] leading-relaxed">
                        {sk.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Section C: Experience & Role Alignment ── */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Experience Alignment Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-[#F5EBE1]">
                      3. Experience Alignment
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    analysis.experience_alignment?.status === 'satisfied'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {analysis.experience_alignment?.status === 'satisfied' ? 'Requirement Met' : 'Partial / Developing'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20]">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-[#B5A193] block">Candidate Experience</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.experience_alignment?.candidate_years || 0} Yrs
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20]">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-[#B5A193] block">Required Minimum</span>
                    <span className="text-xl font-bold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.experience_alignment?.required_years || 0} Yrs
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-700 dark:text-[#C4B2A5] leading-relaxed">
                  {analysis.experience_alignment?.explanation}
                </p>
              </div>

              {/* Education & Qualifications Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-[#F5EBE1]">
                      4. Education & Qualifications
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    analysis.education_alignment?.status === 'satisfied'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}>
                    {analysis.education_alignment?.status === 'satisfied' ? 'Degree Aligned' : 'Review Criteria'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] text-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-600 dark:text-[#B5A193] block">Candidate Credentials:</span>
                    <span className="font-semibold text-stone-900 dark:text-[#F5EBE1]">
                      {analysis.education_alignment?.candidate_degree || 'Self-Taught / Industry Experience'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-stone-700 dark:text-[#C4B2A5] leading-relaxed">
                  {analysis.education_alignment?.explanation}
                </p>
              </div>
            </section>

            {/* ── Section D: Actionable Improvement Recommendations ── */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-[#F5EBE1] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    5. Actionable Resume Improvement Recommendations
                  </h3>
                  <p className="text-xs text-stone-700 dark:text-[#C4B2A5]">
                    Specific gaps you can bridge directly in your resume. These remain suggestions and never overwrite your resume automatically.
                  </p>
                </div>
                {selectedResumeId && (
                  <Link
                    to={`/resume-studio/${selectedResumeId}`}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    Open Resume Studio <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {analysis.recommendations?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            rec.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : rec.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                          }`}>
                            {rec.priority} Priority
                          </span>
                          <span className="text-[11px] font-mono text-stone-600 dark:text-[#B5A193]">
                            {String(rec.type || rec.category || 'recommendation').replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-stone-900 dark:text-[#F5EBE1]">
                          {rec.title}
                        </h4>

                        <p className="text-xs text-stone-700 dark:text-[#C4B2A5] leading-relaxed">
                          {rec.action}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-200 dark:border-[#2D1F17] flex items-center justify-between">
                        <span className="text-[11px] text-stone-600 dark:text-[#B5A193] italic">
                          Truthful resume edit
                        </span>
                        <Link
                          to={`/resume-studio/${selectedResumeId}`}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          Edit Draft <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Zero Substantial Gaps Detected!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                    Your resume comprehensively covers all required domain skills, experience years, and qualifications for this role.
                  </p>
                </div>
              )}
            </section>

            {/* ── Section E: Limitations & Disclaimers ── */}
            <section className="p-6 rounded-2xl bg-stone-100 dark:bg-[#150F0B] border border-stone-200 dark:border-[#2D1F17] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-[#C4B2A5] flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500" />
                Algorithm Limitations & Non-Discrimination Guardrails
              </h4>
              <ul className="text-xs text-stone-700 dark:text-[#B5A193] space-y-1 list-disc list-inside">
                {(analysis.limitations || []).map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : !isAnalyzing && !isCheckingSaved ? (
          /* Empty state prompt */
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-[#F5EBE1]">
              Ready to Analyze Candidate ↔ Requisition Match
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 dark:text-[#C4B2A5] max-w-md mx-auto leading-relaxed">
              Select an active job requisition and your candidate resume above, then click <strong>Run Match Analysis</strong> to extract evidence and calculate deterministic scores.
            </p>
          </div>
        ) : null}
      </main>

      {/* ── Saved History Modal / Drawer ───────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                  Saved Match Analysis History
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {historyList.length === 0 ? (
                <p className="text-xs text-stone-600 dark:text-[#B5A193] text-center py-8">
                  No saved analyses found in database.
                </p>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      loadSpecificAnalysis(item.id);
                      setShowHistoryModal(false);
                    }}
                    className="p-4 rounded-xl bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20] hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-[#F5EBE1]">
                          Job ID: {item.job_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.match_score >= 70 ? 'bg-emerald-500/10 text-emerald-600' :
                          item.match_score >= 45 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
                        }`}>
                          {Math.round(item.match_score)}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-[#B5A193] line-clamp-1">
                        {item.summary_verdict}
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono block">
                        Saved: {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => handleDeleteAnalysis(item.id, e)}
                        className="p-2 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Delete saved analysis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Scoring Methodology Modal ─────────────────────────────── */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1A130F] border border-stone-200 dark:border-[#2D1F17] rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#2D1F17] pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-[#F5EBE1]">
                  Deterministic 4-Pillar Scoring Model
                </h3>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-700 dark:text-[#C4B2A5] space-y-3 leading-relaxed">
              <p>
                SparkX employs a transparent, verifiable mathematical formula rather than opaque generative AI estimations:
              </p>
              <ul className="space-y-2">
                <li className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20]">
                  <strong>1. Domain Skills (40% Weight):</strong> Verified by relational canonical ontology, alias normalization, and verbatim bullet evidence. Multiplier: Platform Verified = 1.0, Evidence Bullet = 0.95, Declared List = 0.70, Missing = 0.0.
                </li>
                <li className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20]">
                  <strong>2. Experience Alignment (25% Weight):</strong> Compares parsed career years against required minimums, gated by domain affinity so unrelated careers receive near-zero credit.
                </li>
                <li className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20]">
                  <strong>3. Responsibilities Alignment (20% Weight):</strong> Evaluates job role seniority and demonstrated leadership impact.
                </li>
                <li className="p-2.5 rounded-lg bg-stone-50 dark:bg-[#201814] border border-stone-200 dark:border-[#382A20]">
                  <strong>4. Education & Credentials (15% Weight):</strong> Evaluates degree alignment against job specifications.
                </li>
              </ul>
              <p className="text-[11px] text-stone-600 dark:text-[#B5A193] italic">
                Zero score floors are enforced. Completely unrelated backgrounds receive strictly low scores (&lt;15%) to maintain integrity.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
