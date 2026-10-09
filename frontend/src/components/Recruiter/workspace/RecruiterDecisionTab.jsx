import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  Save, 
  Sparkles,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  RotateCcw,
  History,
  ShieldCheck,
  FileText,
  Check,
  ExternalLink,
  Info,
  Scale,
  ArrowRight,
  TrendingUp,
  FileQuestion,
  User,
  Layers,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';
import { Card, Button, StatusBadge, Progress } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';
import api from '../../../services/api';

/**
 * RecruiterDecisionTab
 * 
 * Phase 4E.9 — Evidence-Based Hiring Decision & Premium Decision Experience.
 * Provides a production-grade, authoritative decision surface grounded in Phase 4E.7 Scorecards,
 * Phase 4E.8 Comparison context, and 4D workflow state machine transitions.
 */
export default function RecruiterDecisionTab({ 
  candidate, 
  activeJob, 
  onUpdateDecision, 
  onReopen,
  comparisonContext 
}) {
  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);
  const isFinal = wf.hiringDecision === 'selected' || wf.hiringDecision === 'rejected';

  // ── 1. Authoritative Decision Context State ──
  const [decisionContext, setDecisionContext] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState(null);

  // ── 2. Decision Form State ──
  const [selectedDecision, setSelectedDecision] = useState(wf.hiringDecision || 'undecided');
  const [recruiterScore, setRecruiterScore] = useState(
    candidate.recruiterScore ?? candidate.recruiter_score ?? candidate.matchScore ?? 0
  );
  const [selectedRationaleId, setSelectedRationaleId] = useState(candidate.rationaleCategory || null);
  const [rationaleNote, setRationaleNote] = useState(candidate.rationaleNote || candidate.hrNotes || candidate.hr_notes || '');
  const [rejectionCategory, setRejectionCategory] = useState(candidate.rejectionCategory || candidate.rejection_category || 'skills_mismatch');
  const [rejectionReason, setRejectionReason] = useState(candidate.rejectionReason || candidate.rejection_reason || '');

  // ── 3. UX & Confirmation State ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // ── 4. Controlled Reopening State ──
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState('');

  // Fetch authoritative decision context from backend
  const loadDecisionContext = async () => {
    if (!candidate?.id) return;
    setLoadingContext(true);
    setContextError(null);
    try {
      const jobId = activeJob?.id || candidate.jobId || candidate.job_id;
      const data = await api.getCandidateDecisionContext(candidate.id, jobId);
      setDecisionContext(data);
      if (data) {
        setSelectedDecision(data.current_decision || 'undecided');
        if (data.recruiter_score != null) setRecruiterScore(data.recruiter_score);
        if (data.rejection_category) setRejectionCategory(data.rejection_category);
        if (data.rejection_reason) setRejectionReason(data.rejection_reason);
        if (data.hr_notes) setRationaleNote(data.hr_notes);
      }
    } catch (err) {
      console.warn('[RecruiterDecisionTab] Error loading decision context:', err);
      setContextError(err.message || 'Unable to load decision intelligence context');
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    loadDecisionContext();
  }, [candidate?.id, activeJob?.id]);

  // Handle rationale chip click
  const handleSelectRationaleOption = (opt) => {
    setSelectedRationaleId(prev => prev === opt.id ? null : opt.id);
    if (!rationaleNote || rationaleNote.trim() === '') {
      setRationaleNote(opt.label);
    }
  };

  // Open confirmation modal or execute
  const handleInitiateDecision = (e) => {
    e?.preventDefault();
    if (selectedDecision === wf.hiringDecision && !rationaleNote && Number(recruiterScore) === (candidate.recruiterScore ?? 0)) {
      setStatusBanner({ type: 'info', text: 'No changes detected in hiring decision or notes.' });
      setTimeout(() => setStatusBanner(null), 3000);
      return;
    }

    // Require confirmation for terminal decisions or decision changes
    if (selectedDecision === 'selected' || selectedDecision === 'rejected' || selectedDecision !== wf.hiringDecision) {
      setIsConfirmModalOpen(true);
    } else {
      executeDecisionUpdate();
    }
  };

  // Execute authenticated decision update
  const executeDecisionUpdate = async () => {
    setIsSubmitting(true);
    setStatusBanner(null);
    setIsConfirmModalOpen(false);
    try {
      const extraPayload = {
        recruiterScore: Number(recruiterScore),
        hrNotes: rationaleNote,
        rationaleCategory: selectedRationaleId,
        rationaleNote: rationaleNote,
        rejectionReason: selectedDecision === 'rejected' ? (rejectionReason || rationaleNote) : null,
        rejectionCategory: selectedDecision === 'rejected' ? rejectionCategory : null,
        jobId: activeJob?.id || candidate.jobId || candidate.job_id
      };

      if (onUpdateDecision) {
        await onUpdateDecision(candidate.id, selectedDecision, extraPayload);
      } else {
        await api.updateHiringDecision(candidate.id, selectedDecision, extraPayload);
      }

      setStatusBanner({
        type: 'success',
        text: `✓ Hiring decision authoritatively recorded as "${selectedDecision.toUpperCase()}".`
      });
      // Refresh local decision context
      await loadDecisionContext();
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err) {
      setStatusBanner({ type: 'error', text: err.message || 'Failed to update hiring decision' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle authorized reopening submit
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason || reopenReason.trim().length < 10) {
      setReopenError('A detailed reason of at least 10 characters is strictly required for compliance.');
      return;
    }
    setIsReopening(true);
    setReopenError('');
    try {
      if (onReopen) {
        await onReopen(candidate.id, reopenReason.trim());
      } else {
        await api.reopenCandidate(candidate.id, reopenReason.trim());
      }
      setIsReopenModalOpen(false);
      setReopenReason('');
      setStatusBanner({
        type: 'success',
        text: '✓ Application has been reopened and moved back to Evaluation & Review.'
      });
      await loadDecisionContext();
      setTimeout(() => setStatusBanner(null), 5000);
    } catch (err) {
      setReopenError(err.message || 'Failed to reopen application.');
    } finally {
      setIsReopening(false);
    }
  };

  const scorecard = decisionContext?.scorecard;
  const strongestEvidence = decisionContext?.strongest_evidence || [];
  const materialGaps = decisionContext?.material_gaps || [];
  const decisionHistory = decisionContext?.decision_history || [];
  const groundedOptions = decisionContext?.grounded_rationale_options || [];

  const tierPillConfig = useMemo(() => {
    const tier = scorecard?.fit_tier || 'MODERATE_FIT';
    switch (tier) {
      case 'STRONG_FIT':
        return { label: 'Strong Fit', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
      case 'GOOD_FIT':
        return { label: 'Good Fit', bg: 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border-brand-500/30' };
      case 'MODERATE_FIT':
        return { label: 'Moderate Fit', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' };
      default:
        return { label: 'Limited Fit', bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' };
    }
  }, [scorecard?.fit_tier]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in-up pb-12">
      {/* ── Status Banner (Feedback) ── */}
      {statusBanner && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between shadow-subtle ${
          statusBanner.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
            : statusBanner.type === 'info'
            ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
        }`}>
          <span>{statusBanner.text}</span>
          <button type="button" onClick={() => setStatusBanner(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Historical Reopening Audit Banner ── */}
      {decisionContext?.is_reopened && decisionContext?.reopen_reason && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1.5 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Authorized Reopening Audit Record</span>
            {decisionContext.previous_final_decision && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                Prior Decision: {decisionContext.previous_final_decision.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Audit Justification:</span> "{decisionContext.reopen_reason}"
          </p>
          {(decisionContext.reopened_by || decisionContext.reopened_at) && (
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Authorized by {decisionContext.reopened_by || 'Recruiter'} {decisionContext.reopened_at ? `at ${new Date(decisionContext.reopened_at).toLocaleString()}` : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Context & Decision Headline Strip ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#231F1B] text-stone-600 dark:text-stone-300 border border-[#E5E0DA] dark:border-[#2A2520]">
              Hiring Decision Protocol
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 truncate">
              Requisition: <strong className="text-stone-800 dark:text-stone-200">{decisionContext?.job_title || candidate.jobTitle || 'Target Role'}</strong>
            </span>
            {comparisonContext?.rank && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                <Scale className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                <span>Comparison Rank #{comparisonContext.rank}</span>
              </span>
            )}
            {comparisonContext?.isTie && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <span>Cohort Evaluation Tie</span>
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <span>{candidate.name}</span>
            <StatusBadge dimension="decision" value={decisionContext?.current_decision || wf.hiringDecision} />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
            Record an authoritative hiring decision grounded in deterministic skill verification, assessment artifacts, and candidate comparison records.
          </p>
          {comparisonContext?.meaningfulDifferences?.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="font-semibold text-stone-800 dark:text-stone-200">Comparison Differentiator:</span>
              <span className="truncate">{comparisonContext.meaningfulDifferences[0]}</span>
            </div>
          )}
        </div>

        {/* Right side: Reopen button if application is finalized & locked */}
        {decisionContext?.is_final_decision && (
          <div className="shrink-0 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReopenModalOpen(true)}
              className="gap-2 border-stone-300 dark:border-stone-700 hover:border-brand-500 text-stone-700 dark:text-stone-300"
            >
              <RotateCcw className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Reopen Application</span>
            </Button>
          </div>
        )}
      </div>

      {/* ── 3-PILLAR EVIDENCE INTELLIGENCE SURFACE ── */}
      {loadingContext ? (
        <div className="p-12 rounded-2xl bg-stone-50 dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs text-stone-500">Aggregating authoritative scorecard and assessment evidence...</span>
        </div>
      ) : contextError ? (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Unable to load decision intelligence</span>
          </div>
          <p>{contextError}</p>
          <Button variant="secondary" size="xs" onClick={loadDecisionContext}>Retry Loading</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Pillar 1: Overall Authoritative Fit & Coverage */}
          <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2A2520]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-600" />
                  <span>Authoritative Fit</span>
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tierPillConfig.bg}`}>
                  {tierPillConfig.label}
                </span>
              </div>

              {/* Fit score meter & coverage metrics */}
              <div className="pt-3 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-500 font-medium">Phase 4E.7 Fit Score</span>
                  <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                    {scorecard?.fit_score || 0}%
                  </span>
                </div>
                <Progress value={scorecard?.fit_score || 0} size="sm" />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-100 dark:border-[#2A2520]">
                    <span className="text-[10px] font-mono text-stone-500 block">Must-Have Coverage</span>
                    <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {scorecard?.must_have_coverage || 0}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-100 dark:border-[#2A2520]">
                    <span className="text-[10px] font-mono text-stone-500 block">Preferred Coverage</span>
                    <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">
                      {scorecard?.preferred_coverage || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-[#2A2520] flex items-center justify-between text-[11px] text-stone-500">
              <span>Verified proof points:</span>
              <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                {scorecard?.verified_evidence_count || 0} skills verified
              </span>
            </div>
          </div>

          {/* Pillar 2: Strongest Grounded Evidence */}
          <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2A2520]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Strongest Evidence</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {strongestEvidence.length} Competencies
                </span>
              </div>

              <div className="pt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {strongestEvidence.length === 0 ? (
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#231F1B] text-center text-xs text-stone-400">
                    No verified or evidenced skills recorded for this requisition yet.
                  </div>
                ) : (
                  strongestEvidence.slice(0, 4).map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-100 dark:border-[#2A2520] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          {item.skill_name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      {item.highlights && item.highlights.length > 0 && (
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                          {item.highlights.join(' · ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-[#2A2520] text-[11px] text-stone-500 flex items-center justify-between">
              <span>Recruiter evaluation:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Directly evidenced</span>
            </div>
          </div>

          {/* Pillar 3: Material Gaps & Risks */}
          <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2A2520]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Material Gaps & Risks</span>
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {materialGaps.length} Areas
                </span>
              </div>

              <div className="pt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                {materialGaps.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 text-center text-xs text-emerald-700 dark:text-emerald-300">
                    ✓ Zero critical gaps. All evaluated role requirements are satisfied.
                  </div>
                ) : (
                  materialGaps.slice(0, 4).map((gap, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-100 dark:border-[#2A2520] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                          {gap.skill_name}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                          gap.importance === 'required'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}>
                          {gap.importance === 'required' ? 'Must-Have Gap' : 'Preferred Gap'}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1" title={gap.mitigation_recommendation}>
                        {gap.mitigation_recommendation}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-[#2A2520] text-[11px] text-stone-500 flex items-center justify-between">
              <span>Mitigation status:</span>
              <span className="text-stone-700 dark:text-stone-300 font-medium">Grounded mitigation ready</span>
            </div>
          </div>
        </div>
      )}

      {/* ── DECISION RECORDING SURFACE ── */}
      <Card className="p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <span>Recruiter Committee Verdict</span>
              {decisionContext?.is_final_decision && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Lock className="w-3 h-3" />
                  <span>Locked Final State</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Select committee outcome, select factual rationale derived from evidence, and record immutable audit notes.
            </p>
          </div>
          <StatusBadge dimension="decision" value={selectedDecision} />
        </div>

        {/* If Application is Finalized & Locked */}
        {decisionContext?.is_final_decision ? (
          <div className="p-5 rounded-2xl bg-stone-50 dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                wf.hiringDecision === 'selected'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Terminal Decision Recorded: <span className="capitalize">{wf.hiringDecision}</span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Under SparkX Governance, terminal decisions (Selected / Rejected) cannot be overwritten through standard decision controls to prevent unintended regression of completed applications.
                </p>
              </div>
            </div>

            {candidate.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 space-y-1">
                <span className="font-bold">Recorded Rejection Reason:</span>
                <p>{candidate.rejectionReason}</p>
              </div>
            )}

            {(candidate.hrNotes || candidate.rationaleNote) && (
              <div className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-[#231F1B] border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                <span className="font-bold">Recruiter Notes:</span>
                <p>{candidate.rationaleNote || candidate.hrNotes}</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={RotateCcw}
                onClick={() => setIsReopenModalOpen(true)}
              >
                Reopen Application for Reconsideration
              </Button>
            </div>
          </div>
        ) : (
          /* Active Decision Form */
          <form onSubmit={handleInitiateDecision} className="space-y-6">
            
            {/* 4 Canonical Decision Option Cards */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold block">
                Target Decision Outcome
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'undecided', label: 'Undecided', desc: 'In Evaluation', color: 'stone' },
                  { id: 'shortlisted', label: 'Shortlist', desc: 'Progress Candidate', color: 'brand' },
                  { id: 'selected', label: 'Select / Offer', desc: 'Conclude & Offer (Final)', color: 'emerald' },
                  { id: 'rejected', label: 'Reject', desc: 'Disqualify & Close (Final)', color: 'rose' },
                ].map(d => {
                  const currentDec = decisionContext?.current_decision || wf.hiringDecision || 'undecided';
                  const isCurrent = currentDec === d.id;
                  const isAllowed = isCurrent || (!decisionContext?.allowed_transitions || decisionContext.allowed_transitions.includes(d.id));
                  const isSelected = selectedDecision === d.id;
                  return (
                    <button
                      type="button"
                      key={d.id}
                      disabled={!isAllowed}
                      onClick={() => isAllowed && setSelectedDecision(d.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative ${
                        !isAllowed
                          ? 'opacity-40 cursor-not-allowed bg-stone-100/60 dark:bg-[#151311] border-stone-200 dark:border-stone-800 text-stone-400'
                          : isSelected
                          ? d.color === 'emerald'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 cursor-pointer'
                            : d.color === 'rose'
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 cursor-pointer'
                            : d.color === 'brand'
                            ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/20 cursor-pointer'
                            : 'bg-stone-100 dark:bg-stone-800 border-stone-400 text-stone-900 dark:text-stone-100 ring-2 ring-stone-400/20 cursor-pointer'
                          : 'bg-stone-50 dark:bg-[#1A1714] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-700 cursor-pointer'
                      }`}
                      title={!isAllowed ? `Transition to ${d.label} is not permitted from current state "${currentDec}".` : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{d.label}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-current" />
                        ) : !isAllowed ? (
                          <Lock className="w-3 h-3 text-stone-400" />
                        ) : null}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-1">
                        {!isAllowed ? 'Locked by state machine' : d.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grounded Selectable Rationale Chips */}
            {groundedOptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold block">
                    Grounded Rationale Suggestions (Derived from Persisted Evidence)
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">Select to populate note</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groundedOptions.map(opt => {
                    const isPicked = selectedRationaleId === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleSelectRationaleOption(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border flex items-center gap-1.5 ${
                          isPicked
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : opt.type === 'positive'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400'
                            : opt.type === 'gap'
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50 hover:border-rose-400'
                            : 'bg-stone-100 dark:bg-[#231F1B] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-400'
                        }`}
                        title={opt.grounded_evidence}
                      >
                        <span>{opt.label}</span>
                        {isPicked && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rejection Details Form (Shown if Rejected selected) */}
            {selectedDecision === 'rejected' && (
              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-3 animate-fade-in">
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Rejection Classification & Compliance Audit</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-stone-600 dark:text-stone-300 block mb-1">
                      Primary Disqualification Category
                    </label>
                    <select
                      value={rejectionCategory}
                      onChange={(e) => setRejectionCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="skills_mismatch">Core Technical Skills Mismatch</option>
                      <option value="assessment_failed">Failed Technical Assessment Sandbox</option>
                      <option value="interview_rejected">Interview Evaluation Rejection</option>
                      <option value="experience_gap">Seniority / Experience Gap</option>
                      <option value="compensation_mismatch">Compensation Mismatch</option>
                      <option value="integrity_violation">Integrity Policy Anomaly</option>
                      <option value="other">Other Evaluation Reason</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-stone-600 dark:text-stone-300 block mb-1">
                      Audited Rejection Feedback
                    </label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Brief justification recorded in compliance audit ledger..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Recruiter Composite Score Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold">
                  Recruiter Composite Rating (1-100)
                </label>
                <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-400">
                  {Number(recruiterScore) > 0 ? `${recruiterScore} / 100` : 'Unrated (0/100)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={recruiterScore}
                onChange={(e) => setRecruiterScore(e.target.value)}
                className="w-full accent-[#C27803] dark:accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Recruiter Structured Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold block">
                Decision Rationale & Committee Notes
              </label>
              <textarea
                rows={3}
                value={rationaleNote}
                onChange={(e) => setRationaleNote(e.target.value)}
                placeholder="State the committee rationale, offer parameters, or specific discussion notes..."
                className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-stone-400">
                Note is authored by the recruiter and recorded into the candidate's immutable state audit ledger.
              </p>
            </div>

            {/* Form Action Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="text-xs text-stone-500">
                {selectedDecision === 'selected' || selectedDecision === 'rejected' ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ This action finalizes and locks the application.
                  </span>
                ) : (
                  <span>Decision will update candidate dimension without regressing active stage.</span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || loadingContext || Boolean(contextError)}
                className="gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Record Hiring Decision</span>
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* ── DECISION AUDIT HISTORY TIMELINE ── */}
      <div className="p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2A2520]">
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <History className="w-4 h-4 text-brand-600" />
            <span>Decision Audit History Ledger</span>
          </h4>
          <span className="text-[11px] font-mono text-stone-400">
            {decisionHistory.length} Recorded Transition(s)
          </span>
        </div>

        {decisionHistory.length === 0 ? (
          <div className="p-6 rounded-xl bg-stone-50 dark:bg-[#231F1B] text-center text-xs text-stone-400">
            No previous hiring decision transitions recorded for this application. Candidate is currently in initial evaluation.
          </div>
        ) : (
          <div className="space-y-3">
            {decisionHistory.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-100 dark:border-[#2A2520] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {item.from_decision ? (
                        <>
                          <span className="capitalize">{item.from_decision}</span>
                          <span className="mx-1 text-stone-400">→</span>
                        </>
                      ) : null}
                      <strong className="capitalize text-stone-900 dark:text-white">{item.to_decision}</strong>
                    </span>
                    {item.rationale_category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                        {item.rationale_category}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-stone-600 dark:text-stone-400">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 text-[11px] font-mono text-stone-400">
                  <div>{item.changed_by_name || item.changed_by}</div>
                  <div>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Recorded'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── DELIBERATE CONFIRMATION MODAL ── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                  <span>Confirm Hiring Decision</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Review the verdict and verified evidence before committing.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-200 dark:border-stone-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Candidate:</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{candidate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Position:</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{decisionContext?.job_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Decision Transition:</span>
                  <span className="font-bold font-mono uppercase text-brand-600 dark:text-brand-400">
                    {wf.hiringDecision} → {selectedDecision}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Scorecard Fit / Must-Have:</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    {scorecard?.fit_score}% / {scorecard?.must_have_coverage}% Coverage
                  </span>
                </div>
              </div>

              {rationaleNote && (
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#231F1B] border border-stone-200 dark:border-stone-800 space-y-1">
                  <span className="font-semibold text-stone-700 dark:text-stone-300">Recorded Committee Rationale:</span>
                  <p className="text-stone-600 dark:text-stone-400 italic">"{rationaleNote}"</p>
                </div>
              )}

              {(selectedDecision === 'selected' || selectedDecision === 'rejected') && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1 text-[11px]">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Terminal Decision Governance Warning</span>
                  </div>
                  <p>
                    Recording <strong>{selectedDecision.toUpperCase()}</strong> finalizes the application and completes the hiring stage. Standard edits will be locked. Subsequent changes will strictly require authorized reopening.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={executeDecisionUpdate}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirm & Record Decision</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTROLLED REOPENING MODAL ── */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-amber-600" />
                  <span>Authorized Reopening Request</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Reopen a finalized application for candidate reconsideration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReopenModalOpen(false);
                  setReopenReason('');
                  setReopenError('');
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="space-y-3 pt-1">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Reopening will reset the decision to <strong>Undecided</strong> and move the candidate back to <strong>Evaluation & Review</strong>. An immutable audit record will log your justification.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-stone-700 dark:text-stone-300 font-bold">
                    Mandatory Audit Reason (min 10 characters)
                  </label>
                  <span className={`text-[10px] font-mono ${
                    reopenReason.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {reopenReason.trim().length} / 10 chars
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="State the justification for reopening (e.g. Candidate submitted revised portfolio, approved for senior headcount, etc.)..."
                  className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {reopenError && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {reopenError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReopenModalOpen(false);
                    setReopenReason('');
                    setReopenError('');
                  }}
                  disabled={isReopening}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isReopening || reopenReason.trim().length < 10}
                  className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isReopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>Authorize & Reopen Application</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
