import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck2, 
  ShieldCheck, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  MessageSquare, 
  Layers, 
  Filter, 
  Search, 
  Calculator, 
  Info, 
  Sparkles, 
  TrendingUp, 
  X, 
  HelpCircle,
  FileQuestion,
  Clock,
  ArrowRight,
  Scale
} from 'lucide-react';
import { Card, Badge, Button, Progress, EmptyState, ErrorState } from '../../ui/Primitives';
import api from '../../../services/api';

/**
 * CandidateScorecardTab
 * 
 * Phase 4E.7 — Production-grade Evidence-Based Candidate Scorecard.
 * Answers: "How well does this candidate fit this specific job, and what real evidence supports that conclusion?"
 * Derived exclusively from persisted platform data with deterministic scoring and zero hardcoding.
 */
export default function CandidateScorecardTab({ candidate, activeJob, onNavigateTab, onOpenComparison }) {
  if (!candidate) return null;

  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'must_have' | 'preferred'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'VERIFIED' | 'EVIDENCED' | 'CLAIMED' | 'MISSING'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSkillIds, setExpandedSkillIds] = useState(new Set());
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Load candidate scorecard
  const loadScorecard = async () => {
    if (!candidate?.id) return;
    setLoading(true);
    setError(null);
    try {
      const jobId = activeJob?.id || candidate.jobId || candidate.job_id;
      const data = await api.getCandidateScorecard(candidate.id, jobId);
      setScorecard(data);
    } catch (err) {
      console.warn('[CandidateScorecardTab] Fetch error:', err);
      setError(err.message || 'Unable to load candidate scorecard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScorecard();
  }, [candidate?.id, activeJob?.id]);

  // Toggle single skill expansion
  const toggleSkillExpand = (skillId) => {
    setExpandedSkillIds(prev => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  // Expand / collapse all skills with evidence
  const toggleExpandAll = () => {
    if (!scorecard?.skill_evaluations) return;
    const skillsWithEvidence = scorecard.skill_evaluations.filter(s => s.evidence && s.evidence.length > 0);
    if (expandedSkillIds.size >= skillsWithEvidence.length) {
      setExpandedSkillIds(new Set());
    } else {
      setExpandedSkillIds(new Set(skillsWithEvidence.map(s => s.skill_id)));
    }
  };

  // Filter skills list
  const filteredSkills = useMemo(() => {
    if (!scorecard?.skill_evaluations) return [];
    return scorecard.skill_evaluations.filter(item => {
      if (filterType !== 'all' && item.requirement_type !== filterType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.skill_name?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      return true;
    });
  }, [scorecard?.skill_evaluations, filterType, filterStatus, searchQuery]);

  // Status Styling Configuration
  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        );
      case 'EVIDENCED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evidenced</span>
          </span>
        );
      case 'CLAIMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Claimed</span>
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Missing</span>
          </span>
        );
    }
  };

  // Fit Tier Colors & Label
  const getTierConfig = (tier) => {
    switch (tier) {
      case 'STRONG_FIT':
        return {
          label: 'Strong Job Fit',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          pillColor: 'bg-emerald-500 text-white'
        };
      case 'GOOD_FIT':
        return {
          label: 'Good Job Fit',
          textColor: 'text-teal-600 dark:text-teal-400',
          bgColor: 'bg-teal-50 dark:bg-teal-950/40',
          borderColor: 'border-teal-200 dark:border-teal-800',
          pillColor: 'bg-teal-600 text-white'
        };
      case 'MODERATE_FIT':
        return {
          label: 'Moderate Fit',
          textColor: 'text-brand-600 dark:text-brand-400',
          bgColor: 'bg-brand-50 dark:bg-brand-950/40',
          borderColor: 'border-brand-200 dark:border-brand-800',
          pillColor: 'bg-brand-600 text-white'
        };
      case 'PARTIAL_FIT':
        return {
          label: 'Partial Fit',
          textColor: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950/40',
          borderColor: 'border-amber-200 dark:border-amber-800',
          pillColor: 'bg-amber-500 text-white'
        };
      case 'LIMITED_FIT':
      case 'LOW_FIT':
      default:
        return {
          label: 'Low Alignment',
          textColor: 'text-rose-600 dark:text-rose-400',
          bgColor: 'bg-rose-50 dark:bg-rose-950/40',
          borderColor: 'border-rose-200 dark:border-rose-800',
          pillColor: 'bg-rose-500 text-white'
        };
    }
  };

  // Evidence Strength Badge
  const getStrengthBadge = (strength) => {
    switch (strength) {
      case 'STRONG':
        return <Badge variant="success" size="xs">Strong Evidence</Badge>;
      case 'MODERATE':
        return <Badge variant="brand" size="xs">Moderate Evidence</Badge>;
      case 'SUPPORTING':
        return <Badge variant="warning" size="xs">Supporting Proof</Badge>;
      default:
        return <Badge variant="default" size="xs">No Proof</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          Synthesizing Evidence-Based Candidate Scorecard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        title="Scorecard Retrieval Failed" 
        message={error} 
        onRetry={loadScorecard} 
      />
    );
  }

  if (!scorecard || !scorecard.summary) {
    return (
      <EmptyState
        icon={Award}
        title="No Scorecard Available"
        description="Unable to generate a scorecard for this candidate and position."
        actionLabel="Retry"
        onAction={loadScorecard}
      />
    );
  }

  const { summary, skill_gaps, evidence_summary } = scorecard;
  const tierConfig = getTierConfig(summary.fit_tier);

  return (
    <div className="space-y-6">
      {/* ─── Hero Card: Fit Index & Deterministic Overview ─── */}
      <div className={`p-5 sm:p-6 rounded-2xl border ${tierConfig.borderColor} ${tierConfig.bgColor} shadow-card relative overflow-hidden transition-all`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Left Column: Job Context & Fit Tier */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${tierConfig.pillColor}`}>
                {tierConfig.label}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Target Role: <strong className="text-stone-800 dark:text-stone-200">{scorecard.job_title}</strong>
              </span>
              {scorecard.job_department && (
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  • {scorecard.job_department}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>{scorecard.candidate_name}</span>
              <span className="text-stone-400 font-normal text-sm sm:text-base">Job Fit Scorecard</span>
            </h3>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {summary.total_required_skills > 0 ? (
                <>
                  Candidate satisfies <strong className="font-semibold text-stone-900 dark:text-white">{summary.verified_required_count}</strong> of{' '}
                  <strong>{summary.total_required_skills}</strong> must-have requirements through direct evidence, with{' '}
                  <strong>{summary.required_skill_coverage}%</strong> required capability coverage.
                </>
              ) : (
                'No must-have skill requirements have been established for this job.'
              )}
            </p>

            {/* Natural explanation quote */}
            <div className="flex items-center gap-2 pt-1 text-xs text-stone-500 dark:text-stone-400">
              <Calculator className="w-3.5 h-3.5 text-stone-400" />
              <span>Formula: Must-Have (2×) & Preferred (1×) weighted by evidence tier</span>
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                <span>View Details</span>
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Overall Fit Gauge & Passport Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-end justify-center gap-4 shrink-0">
            <div className="flex items-center gap-4 bg-white/80 dark:bg-[#1A1714]/80 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
              <div className="text-right">
                <div className="text-[11px] font-sans font-semibold text-stone-500 uppercase tracking-wider">
                  Overall Fit Score
                </div>
                <div className={`text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${tierConfig.textColor}`}>
                  {Math.round(summary.overall_fit_score)}%
                </div>
              </div>
              <div className="w-14 h-14 relative flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-stone-200 dark:text-stone-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={tierConfig.textColor}
                    strokeDasharray={`${summary.overall_fit_score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <Award className={`w-5 h-5 absolute ${tierConfig.textColor}`} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/skill-passport/${candidate.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1E1B18] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-[#25211D] transition shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Full Verified Passport</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>

              {onOpenComparison && (
                <button
                  type="button"
                  onClick={onOpenComparison}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1E1B18] text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-[#25211D] transition shadow-xs cursor-pointer"
                  title="Compare candidate against other applicants for this position"
                >
                  <Scale className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Compare Cohort</span>
                </button>
              )}

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('decision')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Make Decision</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 Authoritative Stat Cards: Coverage & Evidence Foundation ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Must-Have Coverage */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Must-Have Skills</span>
            <span className="font-mono text-stone-700 dark:text-stone-300">
              {summary.verified_required_count}/{summary.total_required_skills}
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {summary.required_skill_coverage}%
          </div>
          <Progress 
            value={summary.required_skill_coverage} 
            color={summary.required_skill_coverage >= 75 ? 'emerald' : summary.required_skill_coverage >= 50 ? 'brand' : 'amber'} 
            size="sm" 
          />
          <div className="text-[11px] text-stone-500 flex justify-between pt-0.5">
            <span>{summary.missing_required_count} missing</span>
            <span>{summary.claimed_required_count} unverified</span>
          </div>
        </Card>

        {/* Preferred Skills */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Preferred Skills</span>
            <span className="font-mono text-stone-700 dark:text-stone-300">
              {summary.verified_preferred_count}/{summary.total_preferred_skills}
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {summary.preferred_skill_coverage}%
          </div>
          <Progress 
            value={summary.preferred_skill_coverage} 
            color="indigo" 
            size="sm" 
          />
          <div className="text-[11px] text-stone-500 flex justify-between pt-0.5">
            <span>{summary.evidenced_preferred_count} evidenced</span>
            <span>{summary.missing_preferred_count} gaps</span>
          </div>
        </Card>

        {/* Total Persisted Evidence */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Evidence Proofs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {evidence_summary.total_evidence_records}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-stone-500">
            <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 font-mono">
              {evidence_summary.coding_evidence_count} Code
            </span>
            <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 font-mono">
              {evidence_summary.mcq_evidence_count} MCQ
            </span>
            <span className="px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 font-mono">
              {evidence_summary.interview_evidence_count} Speech
            </span>
          </div>
          <div className="text-[11px] text-stone-400 truncate pt-0.5">
            Latest: {evidence_summary.latest_recency_label}
          </div>
        </Card>

        {/* Verification Status Breakdown */}
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Status Distribution</span>
            <Layers className="w-4 h-4 text-stone-400" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <div className="flex items-center justify-between px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs">
              <span>Verified</span>
              <strong className="font-mono">{summary.total_verified_skills}</strong>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs">
              <span>Evidenced</span>
              <strong className="font-mono">{summary.total_evidenced_skills}</strong>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs">
              <span>Claimed</span>
              <strong className="font-mono">{summary.total_claimed_skills}</strong>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded bg-stone-500/10 text-stone-600 dark:text-stone-400 text-xs">
              <span>Missing</span>
              <strong className="font-mono">{summary.total_missing_skills}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Evidence-Based Skill Gaps & Mitigations ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>Evidence-Based Skill Gaps</span>
              {skill_gaps.length > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {skill_gaps.length} Actionable
                </span>
              )}
            </h4>
          </div>
          <span className="text-xs text-stone-500">
            Derived directly from missing or unverified job requirements
          </span>
        </div>

        {skill_gaps.length === 0 ? (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Zero critical skill gaps detected. Candidate demonstrates evidence across all required competencies for this position.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skill_gaps.map((gap, idx) => {
              const isCritical = gap.gap_type.includes('MUST_HAVE');
              return (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    isCritical 
                      ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20' 
                      : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                  } space-y-2`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {gap.skill_name}
                        </span>
                        <Badge variant={isCritical ? 'danger' : 'warning'} size="xs">
                          {isCritical ? 'Must-Have Gap' : 'Preferred Gap'}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {gap.category} • Status: <strong className="font-mono">{gap.current_status}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 dark:bg-[#1E1B18]/80 border border-stone-200/80 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                    <span><strong>Mitigation:</strong> {gap.mitigation_recommendation}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Granular Skill Matrix with Evidence Drilldown ─── */}
      <div className="space-y-4">
        {/* Controls Toolbar: Search, Filters, and Expand All */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 dark:bg-[#14110F] border border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter skill requirements..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1B18] text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Requirement Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1B18] text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
            >
              <option value="all">All Requirements</option>
              <option value="must_have">Must-Have Only</option>
              <option value="preferred">Preferred Only</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1B18] text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="EVIDENCED">Evidenced</option>
              <option value="CLAIMED">Claimed</option>
              <option value="MISSING">Missing</option>
            </select>

            {/* Expand / Collapse All Toggle */}
            <button
              type="button"
              onClick={toggleExpandAll}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#1E1B18] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white font-medium transition cursor-pointer"
            >
              {expandedSkillIds.size > 0 ? 'Collapse All' : 'Expand Evidence'}
            </button>
          </div>
        </div>

        {/* Skills Evaluation List */}
        {filteredSkills.length === 0 ? (
          <div className="text-center p-8 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-500 text-xs">
            No skill evaluations matched your active filter criteria.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSkills.map((item) => {
              const isExpanded = expandedSkillIds.has(item.skill_id);
              const hasEvidence = item.evidence && item.evidence.length > 0;
              const isMustHave = item.requirement_type === 'must_have';

              return (
                <div
                  key={item.skill_id}
                  className="rounded-xl border border-[#E8E4DF] dark:border-[#2A2520] bg-[#FDFCFA] dark:bg-[#1A1714] overflow-hidden transition-all shadow-xs"
                >
                  {/* Skill Summary Row */}
                  <div
                    onClick={() => hasEvidence && toggleSkillExpand(item.skill_id)}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      hasEvidence ? 'cursor-pointer hover:bg-stone-50/60 dark:hover:bg-[#201D1A]/60' : ''
                    }`}
                  >
                    {/* Left: Skill Identity & Badges */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {item.skill_name}
                        </span>
                        
                        <Badge 
                          variant={isMustHave ? 'brand' : 'default'} 
                          size="xs"
                        >
                          {isMustHave ? 'Must-Have' : 'Preferred'}
                        </Badge>

                        {getStatusBadge(item.status)}
                        {getStrengthBadge(item.evidence_strength)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>
                          Experience: {item.candidate_years > 0 ? `${item.candidate_years} yrs` : 'Unspecified'} 
                          {item.required_years > 0 && ` (Req: ${item.required_years} yrs)`}
                        </span>
                        {item.recency_label && item.recency_label !== 'No evidence' && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-stone-400">
                              <Clock className="w-3 h-3" />
                              {item.recency_label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Sources Badges & Accordion Indicator */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {/* Supported Sources Pills */}
                      <div className="hidden md:flex items-center gap-1">
                        {item.supported_sources?.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                          >
                            {src}
                          </span>
                        ))}
                      </div>

                      {hasEvidence ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSkillExpand(item.skill_id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800"
                        >
                          <span>{item.evidence_count} {item.evidence_count === 1 ? 'Proof' : 'Proofs'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No proof points</span>
                      )}
                    </div>
                  </div>

                  {/* Grounded Natural Explanation Reason */}
                  {item.reason && (
                    <div className="px-3.5 sm:px-4 pb-2.5 text-[11px] text-stone-500 dark:text-stone-400">
                      <strong>Assessment Finding:</strong> {item.reason}
                    </div>
                  )}

                  {/* Expandable Granular Proof Drawer */}
                  {isExpanded && hasEvidence && (
                    <div className="p-3.5 sm:p-4 bg-stone-50/70 dark:bg-[#151210]/90 border-t border-stone-200 dark:border-stone-800 space-y-2.5 animate-fade-in-up">
                      <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        <span>Granular Persisted Evidence Records ({item.evidence.length})</span>
                      </div>

                      <div className="space-y-2">
                        {item.evidence.map((ev, evIdx) => (
                          <div
                            key={ev.evidence_id || evIdx}
                            className="p-3 rounded-lg bg-white dark:bg-[#1E1B18] border border-stone-200 dark:border-stone-700/80 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                  {ev.source_title}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                  {ev.evidence_type}
                                </span>
                                {getStrengthBadge(ev.evidence_strength)}
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                {ev.score_contribution != null && (
                                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-[11px]">
                                    Score: {Math.round(ev.score_contribution)}/100
                                  </span>
                                )}
                                <span className="text-stone-400 text-[11px]">
                                  {ev.recency_label}
                                </span>
                              </div>
                            </div>

                            {/* Snippet / telemetry quote */}
                            {ev.snippet && (
                              <div className="p-2 rounded bg-stone-50 dark:bg-[#12100E] border border-stone-100 dark:border-stone-800 text-xs font-mono text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                                {ev.snippet}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Transparent Deterministic Scoring Formula Modal ─── */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in-up">
          <div className="w-full max-w-lg bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] rounded-2xl p-6 shadow-depth-elevated space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand-600" />
                <span>Deterministic Scoring Formula</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600 dark:text-stone-300 space-y-3 leading-relaxed">
              <p>
                The Candidate Fit Index is calculated mathematically from persisted job requirements and candidate proof points without arbitrary AI score assignment:
              </p>

              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-900 font-mono text-xs text-stone-800 dark:text-stone-200 space-y-1">
                <div>Fit Score = Σ(Weight × Type Multiplier × Status Factor) / Σ(Weight × Type Multiplier) × 100</div>
              </div>

              <div className="space-y-1.5 pt-1">
                <strong className="block text-stone-800 dark:text-stone-200">Requirement Multipliers:</strong>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li><strong>Must-Have Requirements:</strong> 2.0× Weight</li>
                  <li><strong>Preferred Requirements:</strong> 1.0× Weight</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-1">
                <strong className="block text-stone-800 dark:text-stone-200">Evidence Status Factors:</strong>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li><strong>VERIFIED (≥ 70% pass threshold or Recruiter Sign-off):</strong> 100% satisfaction factor</li>
                  <li><strong>EVIDENCED (&lt; 70% preliminary evidence):</strong> 65% satisfaction factor</li>
                  <li><strong>CLAIMED (Self-reported, 0 evidence):</strong> 25% satisfaction factor</li>
                  <li><strong>MISSING (Unsubstantiated):</strong> 0% satisfaction factor</li>
                </ul>
              </div>

              <div className="space-y-1.5 pt-1">
                <strong className="block text-stone-800 dark:text-stone-200">Fit Tiers:</strong>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li><strong>Strong Fit:</strong> ≥ 80%</li>
                  <li><strong>Moderate Fit:</strong> 65% – 79%</li>
                  <li><strong>Partial Fit:</strong> 45% – 64%</li>
                  <li><strong>Low Alignment:</strong> &lt; 45%</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setShowFormulaModal(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
