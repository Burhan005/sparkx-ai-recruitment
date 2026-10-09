import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  X, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Scale, 
  Clock, 
  Briefcase, 
  FileCode2, 
  MessageSquare, 
  Filter, 
  RefreshCw,
  Search,
  Check,
  Flame,
  FileText
} from 'lucide-react';
import { StatusBadge, Avatar, Button, CustomDropdown } from '../ui/Primitives';

export default function CandidateComparisonModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  candidateIds = [],
  onSelectCandidate
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  // Active View Tab: 'matrix' (default, direct table) vs 'summary' (executive cards)
  const [activeView, setActiveView] = useState('matrix');

  // Matrix Filter state
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'MUST_HAVE' | 'PREFERRED' | 'GAPS_ONLY'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Expanded evidence drawer for a specific cell: { skillId, candidateId }
  const [activeEvidenceModal, setActiveEvidenceModal] = useState(null);

  // Scroll tracking and non-blocking wheel navigation
  const modalBodyRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleBodyScroll = (e) => {
    setShowScrollTop(e.currentTarget.scrollTop > 180);
  };

  const scrollToTop = () => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchComparison = useCallback(async () => {
    if (!jobId || !candidateIds || candidateIds.length < 2) {
      setLoading(false);
      setError(null);
      setComparisonData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.compareCandidates(jobId, candidateIds);
      setComparisonData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate candidate comparison.');
    } finally {
      setLoading(false);
    }
  }, [jobId, candidateIds]);

  useEffect(() => {
    if (!isOpen) return;
    fetchComparison();
  }, [isOpen, fetchComparison]);

  // Lock document body and main scroll container when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const mainScroll = document.getElementById('main-scroll-container');
    const originalMainOverflow = mainScroll ? mainScroll.style.overflow : '';
    if (mainScroll) mainScroll.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      if (mainScroll) mainScroll.style.overflow = originalMainOverflow;
    };
  }, [isOpen]);

  // Close modal or active ledger on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeEvidenceModal) {
          setActiveEvidenceModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeEvidenceModal, onClose]);

  // Extract unique categories from matrix rows
  const categories = useMemo(() => {
    if (!comparisonData?.skill_comparison) return [];
    const set = new Set();
    comparisonData.skill_comparison.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [comparisonData]);

  // Filtered rows for the matrix
  const filteredRows = useMemo(() => {
    if (!comparisonData?.skill_comparison) return [];
    return comparisonData.skill_comparison.filter(row => {
      // Type filter
      if (filterType === 'MUST_HAVE' && row.requirement_type !== 'must_have') return false;
      if (filterType === 'PREFERRED' && row.requirement_type === 'must_have') return false;
      if (filterType === 'GAPS_ONLY') {
        const hasGap = Object.values(row.candidate_values).some(
          v => v.status === 'missing' || v.status === 'unsatisfied' || v.status === 'partially_satisfied'
        );
        if (!hasGap) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && row.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSkill = row.skill_name.toLowerCase().includes(q);
        const matchesCat = (row.category || '').toLowerCase().includes(q);
        if (!matchesSkill && !matchesCat) return false;
      }

      return true;
    });
  }, [comparisonData, filterType, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-6xl h-[88vh] max-h-[88vh] flex flex-col rounded-3xl bg-[#FAF8F5] dark:bg-[#141210] border border-[#E8DFD8] dark:border-[#2A2520] shadow-2xl overflow-hidden transition-all text-[#1C130E] dark:text-stone-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-title"
      >
        {/* ─── MODAL HEADER ─── */}
        <header className="px-6 py-4.5 bg-white/90 dark:bg-[#1A1714]/90 border-b border-[#E8DFD8] dark:border-[#2A2520] flex items-center justify-between shrink-0 backdrop-blur-md z-20">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 via-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-brand-600/25 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-500/10 dark:bg-brand-500/20 px-2 py-0.5 rounded-full border border-brand-500/20">
                  Side-by-Side Comparison Engine
                </span>
                <span className="text-stone-400">•</span>
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  {candidateIds.length} Candidates Selected
                </span>
              </div>
              <h2 id="comparison-title" className="text-base sm:text-lg font-bold text-stone-900 dark:text-white truncate">
                {comparisonData?.job_title || jobTitle || 'Job Requisition Candidates'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-stone-100 dark:bg-[#25201C] p-1 rounded-xl border border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setActiveView('matrix')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'matrix'
                    ? 'bg-white dark:bg-[#1A1714] text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Skill Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('summary')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'summary'
                    ? 'bg-white dark:bg-[#1A1714] text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Executive Dossiers</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#25201C] transition cursor-pointer"
              aria-label="Close Comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ─── MODAL BODY ─── */}
        <div 
          ref={modalBodyRef}
          onScroll={handleBodyScroll}
          className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-stone-600 dark:[&::-webkit-scrollbar-thumb:hover]:bg-brand-500 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-3 border-brand-500/20 border-t-brand-600 animate-spin" />
                <div className="absolute inset-2 rounded-full border-3 border-amber-500/20 border-b-amber-500 animate-spin [animation-direction:reverse]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Evaluating Authoritative Database Match
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Querying canonical skill relationships, database weights, candidate proficiencies, and authentic platform evidence...
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-8 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Comparison Evaluation Error</h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchComparison} icon={RefreshCw}>
                Retry Evaluation
              </Button>
            </div>
          )}

          {!loading && !error && (!comparisonData || candidateIds.length < 2) && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center">
              <Scale className="w-12 h-12 text-stone-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                  Minimum Candidate Selection Required
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
                  Candidate comparison requires selecting at least 2 distinct candidates from the pipeline for this job opening.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && comparisonData && (
            <>
              {/* ─── SECTION 1: CANDIDATE OVERALL SUMMARY CARDS (EXECUTIVE DOSSIERS VIEW) ─── */}
              {activeView === 'summary' && (
                <section aria-labelledby="overall-cards-heading" className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      <h3 id="overall-cards-heading" className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Deterministic Ranking & Executive Fit
                      </h3>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Must-Have Priority: 2.0x • Preferred: 1.0x
                    </span>
                  </div>

                  {/* ── Meaningful Differences & Honest Ties Banners ── */}
                  {(comparisonData.honest_ties?.length > 0 || comparisonData.meaningful_differences?.length > 0) && (
                    <div className="space-y-2.5">
                      {comparisonData.honest_ties?.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                            <Scale className="w-4 h-4 text-amber-500" />
                            <span>Evaluation Tie Detected (Anti-Hallucination Policy)</span>
                          </div>
                          {comparisonData.honest_ties.map((tie, tIdx) => (
                            <p key={tIdx} className="text-xs text-stone-700 dark:text-stone-300 pl-6 leading-relaxed">
                              {tie}
                            </p>
                          ))}
                        </div>
                      )}

                      {comparisonData.meaningful_differences?.length > 0 && (
                        <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                          <div className="flex items-center space-x-2 text-xs font-bold text-brand-700 dark:text-brand-300">
                            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                            <span>Evidence-Based Candidate Differentiators</span>
                          </div>
                          <ul className="space-y-1.5 pl-6 list-disc text-xs text-stone-700 dark:text-stone-300">
                            {comparisonData.meaningful_differences.map((diff, dIdx) => (
                              <li key={dIdx} className="leading-relaxed">
                                {diff}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`grid gap-4 ${
                    comparisonData.candidates.length === 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : comparisonData.candidates.length === 3
                      ? 'grid-cols-1 md:grid-cols-3'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {comparisonData.candidates.map((cand) => {
                      const score = Math.round(cand.scorecard_fit_score != null ? cand.scorecard_fit_score : cand.overall_match.score);
                      const tier = cand.scorecard_fit_tier || (score >= 80 ? 'STRONG_FIT' : score >= 65 ? 'GOOD_FIT' : score >= 50 ? 'MODERATE_FIT' : 'LIMITED_FIT');
                      const isRank1 = cand.rank === 1;

                      return (
                        <div
                          key={cand.candidate_id}
                          className={`relative rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 shadow-sm ${
                            isRank1
                              ? 'bg-gradient-to-b from-brand-500/10 via-white to-white dark:from-brand-950/40 dark:via-[#1A1714] dark:to-[#1A1714] border-brand-500/60 ring-2 ring-brand-500/20'
                              : 'bg-white dark:bg-[#1A1714] border-[#E8DFD8] dark:border-[#2A2520]'
                          }`}
                        >
                          {/* Top Rank Badge & Fit Tier */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <Avatar name={cand.candidate_name} size="md" />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                                  {cand.candidate_name}
                                </h4>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                  {cand.email || 'Application dossier'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div className={`px-2 py-0.5 rounded-lg text-xs font-mono font-black ${
                                isRank1
                                  ? 'bg-amber-500 text-amber-950 shadow-sm'
                                  : 'bg-stone-100 dark:bg-[#25201C] text-stone-600 dark:text-stone-300'
                              }`}>
                                #{cand.rank}
                              </div>
                              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                tier === 'STRONG_FIT' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                                tier === 'GOOD_FIT' ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/30' :
                                tier === 'MODERATE_FIT' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
                                'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                              }`}>
                                {tier.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Overall Score Meter */}
                          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800 space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
                                Scorecard Fit
                              </span>
                              <span className={`text-base font-black font-mono ${
                                score >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                                score >= 70 ? 'text-brand-600 dark:text-brand-400' :
                                'text-stone-600 dark:text-stone-400'
                              }`}>
                                {score}%
                              </span>
                            </div>

                            <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  score >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                  score >= 70 ? 'bg-gradient-to-r from-brand-600 to-amber-500' :
                                  'bg-stone-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/50 dark:border-stone-800/80 text-[10px]">
                              <div>
                                <span className="text-stone-400 block">Must-Have:</span>
                                <span className={`font-bold font-mono ${
                                  cand.must_have.has_missing ? 'text-rose-500' : 'text-stone-800 dark:text-stone-200'
                                }`}>
                                  {Math.round(cand.must_have.score)}% ({cand.must_have.matched}/{cand.must_have.total})
                                </span>
                              </div>
                              <div>
                                <span className="text-stone-400 block">Preferred:</span>
                                <span className="font-bold font-mono text-stone-800 dark:text-stone-200">
                                  {Math.round(cand.preferred.score)}% ({cand.preferred.matched}/{cand.preferred.total})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Verified Evidence Count Pill */}
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-3">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{cand.verified_evidence_count || 0} Authenticated Evidence Record(s)</span>
                          </div>

                          {/* Top Strengths */}
                          <div className="space-y-1.5 mb-3 flex-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                              Key Strengths
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {cand.top_strengths && cand.top_strengths.length > 0 ? (
                                cand.top_strengths.map((str, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  >
                                    {str}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-stone-400 italic">No verified top strengths yet</span>
                              )}
                            </div>
                          </div>

                          {/* Critical Gaps & Mitigations */}
                          <div className="space-y-1.5 mb-4">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                              Identified Gaps ({cand.gaps.length})
                            </span>
                            <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin">
                              {cand.gaps && cand.gaps.length > 0 ? (
                                cand.gaps.slice(0, 3).map((gap, gIdx) => (
                                  <div key={gIdx} className="text-[10px] flex items-center space-x-1.5 text-stone-600 dark:text-stone-400">
                                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span className="truncate">{gap}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>Zero missing requirements</span>
                                </div>
                              )}
                            </div>

                            {/* Grounded Mitigation Recommendations */}
                            {cand.mitigation_recommendations?.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-stone-200/50 dark:border-stone-800/80 space-y-1">
                                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                                  Grounded Mitigation Actions
                                </span>
                                <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin text-[10px] text-stone-600 dark:text-stone-400">
                                  {cand.mitigation_recommendations.slice(0, 2).map((rec, rIdx) => (
                                    <div key={rIdx} className="p-1 rounded bg-stone-50 dark:bg-[#141210] border border-stone-200/60 dark:border-stone-800 text-[10px]">
                                      <span className="font-semibold text-stone-800 dark:text-stone-200">{rec.skill_name}: </span>
                                      <span>{rec.mitigation_recommendation}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions: Open Scorecard / Decide / Dossier */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-stone-200/40 dark:border-stone-800/60">
                            <button
                              type="button"
                              onClick={() => {
                                const compContext = {
                                  rank: cand.rank,
                                  fitScore: score,
                                  fitTier: tier,
                                  topStrengths: cand.top_strengths || [],
                                  gapsCount: cand.gaps?.length || 0,
                                  meaningfulDifferences: comparisonData.meaningful_differences || [],
                                  isTie: Boolean(comparisonData.honest_ties?.length)
                                };
                                onClose();
                                if (onSelectCandidate) {
                                  onSelectCandidate(cand.candidate_id, 'scorecard', compContext);
                                } else {
                                  navigate(`/recruiter/candidates/${cand.candidate_id}?tab=scorecard`, { state: { comparisonContext: compContext } });
                                }
                              }}
                              className="py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-brand-600 text-white hover:bg-brand-500 cursor-pointer shadow-xs"
                            >
                              <Award className="w-3 h-3" />
                              <span>Scorecard</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const compContext = {
                                  rank: cand.rank,
                                  fitScore: score,
                                  fitTier: tier,
                                  topStrengths: cand.top_strengths || [],
                                  gapsCount: cand.gaps?.length || 0,
                                  meaningfulDifferences: comparisonData.meaningful_differences || [],
                                  isTie: Boolean(comparisonData.honest_ties?.length)
                                };
                                onClose();
                                if (onSelectCandidate) {
                                  onSelectCandidate(cand.candidate_id, 'decision', compContext);
                                } else {
                                  navigate(`/recruiter/candidates/${cand.candidate_id}?tab=decision`, { state: { comparisonContext: compContext } });
                                }
                              }}
                              className="py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Decide</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onSelectCandidate) {
                                  onSelectCandidate(cand.candidate_id, 'overview');
                                } else {
                                  navigate(`/recruiter/candidates/${cand.candidate_id}`);
                                }
                              }}
                              className="py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 bg-stone-100 dark:bg-[#25201C] hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
                            >
                              <span>Dossier</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ─── SECTION 2: SKILL-BY-SKILL COMPARISON MATRIX (DEFAULT TAB) ─── */}
              {activeView === 'matrix' && (
                <section aria-labelledby="skill-matrix-heading" className="space-y-4">
                  {/* Compact Quick-Comparison Strip (No large cards pushing table down) */}
                  <div className={`grid gap-2.5 ${
                    comparisonData.candidates.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : comparisonData.candidates.length === 3
                      ? 'grid-cols-1 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {comparisonData.candidates.map((cand) => {
                      const score = Math.round(cand.overall_match.score);
                      const isRank1 = cand.rank === 1;

                      return (
                        <div
                          key={cand.candidate_id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                            isRank1
                              ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30'
                              : 'bg-white dark:bg-[#1A1714] border-[#E8DFD8] dark:border-[#2A2520]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={cand.candidate_name} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 dark:text-white truncate">
                                {cand.candidate_name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                                <span className={isRank1 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>#{cand.rank}</span>
                                <span>•</span>
                                <span>{cand.verified_evidence_count} evidence</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-black font-mono ${
                              score >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                              score >= 70 ? 'text-brand-600 dark:text-brand-400' : 'text-stone-600'
                            }`}>
                              {score}%
                            </span>
                            {onSelectCandidate && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectCandidate(cand.candidate_id, 'scorecard');
                                }}
                                className="block text-[10px] text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                              >
                                Scorecard →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-4 border-t border-[#E8DFD8] dark:border-[#2A2520]">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <h3 id="skill-matrix-heading" className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Authoritative Requirement Breakdown Matrix ({filteredRows.length} Requirements)
                    </h3>
                  </div>

                  {/* Matrix Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Tabs */}
                    <div className="flex p-1 rounded-xl bg-stone-100 dark:bg-[#1B1714] border border-[#E8DFD8] dark:border-[#2A2520] text-xs">
                      <button
                        onClick={() => setFilterType('ALL')}
                        className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          filterType === 'ALL'
                            ? 'bg-white dark:bg-[#28221D] text-stone-900 dark:text-white shadow-xs'
                            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        All ({comparisonData.total_requirements})
                      </button>
                      <button
                        onClick={() => setFilterType('MUST_HAVE')}
                        className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          filterType === 'MUST_HAVE'
                            ? 'bg-white dark:bg-[#28221D] text-stone-900 dark:text-white shadow-xs'
                            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        Must-Have ({comparisonData.must_have_count})
                      </button>
                      <button
                        onClick={() => setFilterType('PREFERRED')}
                        className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          filterType === 'PREFERRED'
                            ? 'bg-white dark:bg-[#28221D] text-stone-900 dark:text-white shadow-xs'
                            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        Preferred ({comparisonData.preferred_count})
                      </button>
                      <button
                        onClick={() => setFilterType('GAPS_ONLY')}
                        className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1 ${
                          filterType === 'GAPS_ONLY'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 shadow-xs'
                            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Gaps Only</span>
                      </button>
                    </div>

                    {/* Category Dropdown */}
                    {categories.length > 1 && (
                      <CustomDropdown
                        value={selectedCategory}
                        onChange={(val) => setSelectedCategory(val)}
                        options={[
                          { value: 'ALL', label: 'All Categories' },
                          ...categories.map((c) => ({ value: c, label: c }))
                        ]}
                        className="text-xs"
                        menuWidth="w-48"
                      />
                    )}

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#1B1714] border border-[#E8DFD8] dark:border-[#2A2520] text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36 sm:w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Table */}
                <div className="rounded-2xl border border-[#E8DFD8] dark:border-[#2A2520] bg-white dark:bg-[#1A1714] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-stone-50/95 dark:bg-[#141210]/95 backdrop-blur-sm z-20 border-b border-[#E8DFD8] dark:border-[#2A2520] shadow-2xs">
                        <tr>
                          <th className="py-3.5 px-4 font-mono font-bold uppercase tracking-wider text-[11px] text-stone-500 dark:text-stone-400 min-w-[240px] sticky left-0 bg-stone-50 dark:bg-[#141210] z-30">
                            Required Skill & Standard
                          </th>
                          {comparisonData.candidates.map((cand) => {
                            const score = Math.round(cand.scorecard_fit_score != null ? cand.scorecard_fit_score : cand.overall_match.score);
                            const tier = cand.scorecard_fit_tier || (score >= 80 ? 'STRONG_FIT' : score >= 65 ? 'GOOD_FIT' : score >= 50 ? 'MODERATE_FIT' : 'LIMITED_FIT');
                            return (
                              <th 
                                key={cand.candidate_id} 
                                className="py-3.5 px-4 font-bold text-stone-900 dark:text-white min-w-[220px]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center space-x-2 truncate">
                                    <Avatar name={cand.candidate_name} size="xs" />
                                    <div className="truncate">
                                      <span className="block truncate text-xs font-bold">{cand.candidate_name}</span>
                                      <span className="text-[10px] font-mono font-normal text-stone-400">
                                        #{cand.rank} • {score}% ({tier.replace('_', ' ')})
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      if (onSelectCandidate) {
                                        onSelectCandidate(cand.candidate_id, 'scorecard');
                                      } else {
                                        navigate(`/recruiter/candidates/${cand.candidate_id}?tab=scorecard`);
                                      }
                                    }}
                                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline shrink-0 cursor-pointer flex items-center gap-0.5"
                                    title="Open Scorecard"
                                  >
                                    <span>Scorecard</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-[#E8DFD8]/60 dark:divide-[#2A2520]/60">
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={1 + comparisonData.candidates.length} className="py-12 text-center text-stone-400 italic">
                              No skill requirements matching active filters.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map((row) => {
                            const isMustHave = row.requirement_type === 'must_have';

                            return (
                              <tr key={row.skill_id} className="group hover:bg-stone-50/70 dark:hover:bg-[#201C18]/60 transition-colors">
                                {/* Left Sticky Column: Skill Spec */}
                                <td className="py-3.5 px-4 sticky left-0 bg-white dark:bg-[#1A1714] group-hover:bg-stone-50/90 dark:group-hover:bg-[#201C18]/90 z-10 border-r border-[#E8DFD8]/50 dark:border-[#2A2520]/50 transition-colors">
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                                        {row.skill_name}
                                      </span>
                                      <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                                        isMustHave
                                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                                      }`}>
                                        {isMustHave ? 'Must Have' : 'Preferred'}
                                      </span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-400 font-mono">
                                      <span>Weight: {row.weight}x</span>
                                      <span>•</span>
                                      <span>Min: {row.required_years > 0 ? `${row.required_years}y` : 'Any yrs'}</span>
                                      <span>•</span>
                                      <span className="capitalize">{row.required_proficiency}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Candidate Columns */}
                                {comparisonData.candidates.map((cand) => {
                                  const cVal = row.candidate_values[cand.candidate_id];
                                  if (!cVal) return <td key={cand.candidate_id} className="p-4 text-stone-400">—</td>;

                                  const isMissing = cVal.status === 'missing' || cVal.scorecard_status === 'MISSING';
                                  const statusLabel = cVal.scorecard_status || (
                                    cVal.status === 'verified_match' ? 'VERIFIED' :
                                    cVal.status === 'satisfied' ? 'EVIDENCED' :
                                    cVal.status === 'partially_satisfied' ? 'CLAIMED' :
                                    'MISSING'
                                  );
                                  const score = Math.round(cVal.satisfaction_score);

                                  return (
                                    <td key={cand.candidate_id} className="py-3.5 px-4 align-top">
                                      <div className="space-y-2">
                                        {/* Status & Score Pill */}
                                        <div className="flex items-center justify-between">
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1 ${
                                            statusLabel === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' :
                                            statusLabel === 'EVIDENCED' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20' :
                                            statusLabel === 'CLAIMED' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20' :
                                            'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                          }`}>
                                            {statusLabel === 'VERIFIED' && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                                            {statusLabel === 'EVIDENCED' && <Sparkles className="w-3 h-3 text-amber-500" />}
                                            {statusLabel === 'CLAIMED' && <FileText className="w-3 h-3 text-sky-500" />}
                                            {statusLabel === 'MISSING' && <X className="w-3 h-3 text-rose-500" />}
                                            <span>{statusLabel}</span>
                                          </span>

                                          <span className="font-mono font-bold text-stone-700 dark:text-stone-300 text-[11px]">
                                            {score}%
                                          </span>
                                        </div>

                                        {/* Candidate Experience & Proficiency */}
                                        <div className="text-[11px] text-stone-600 dark:text-stone-400 space-y-0.5">
                                          {isMissing ? (
                                            <p className="text-stone-400 italic">No skill record on profile</p>
                                          ) : (
                                            <>
                                              <p>
                                                <span className="text-stone-400">Experience:</span>{' '}
                                                <strong className={cVal.experience_satisfied ? 'text-stone-800 dark:text-stone-200' : 'text-amber-600 dark:text-amber-400'}>
                                                  {cVal.candidate_years}y
                                                </strong>
                                              </p>
                                              <p>
                                                <span className="text-stone-400">Proficiency:</span>{' '}
                                                <strong className={cVal.proficiency_satisfied ? 'text-stone-800 dark:text-stone-200' : 'text-amber-600 dark:text-amber-400'}>
                                                  {cVal.candidate_proficiency}
                                                </strong>
                                              </p>
                                            </>
                                          )}
                                          {cVal.recency_label && (
                                            <p className="text-[10px] text-stone-400 font-mono pt-0.5">
                                              {cVal.recency_label}
                                            </p>
                                          )}
                                        </div>

                                        {/* Evidence Tag & Drawer Trigger */}
                                        <div className="pt-1">
                                          {cVal.evidence_count > 0 ? (
                                            <button
                                              onClick={() => setActiveEvidenceModal({
                                                skillName: row.skill_name,
                                                candidateName: cand.candidate_name,
                                                evidence: cVal.evidence,
                                                explanation: cVal.explanation
                                              })}
                                              className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1 cursor-pointer"
                                            >
                                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                              <span>{cVal.evidence_count} Authentic Evidence Record(s)</span>
                                            </button>
                                          ) : isMissing ? null : (
                                            <span className="text-[10px] text-stone-400 italic flex items-center space-x-1">
                                              <AlertTriangle className="w-2.5 h-2.5 text-stone-400" />
                                              <span>No platform evidence (Self-reported)</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </section>
              )}
            </>
          )}

          {/* Floating Quick Return to Top */}
          {showScrollTop && (
            <div className="sticky bottom-0 flex justify-end z-30 pointer-events-none pb-1">
              <button
                type="button"
                onClick={scrollToTop}
                className="pointer-events-auto px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 flex items-center space-x-1.5 transition-all duration-200 animate-in fade-in cursor-pointer active:scale-95"
              >
                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                <span>Back to Summary Top</span>
              </button>
            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER ─── */}
        <footer className="px-6 py-4 bg-white/90 dark:bg-[#1A1714]/90 border-t border-[#E8DFD8] dark:border-[#2A2520] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-stone-500 dark:text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Authoritative evidence-backed scoring powered by ARETE Skill Engine. Zero client-side computation.</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done Comparing
          </Button>
        </footer>
      </div>

      {/* ─── EVIDENCE INSPECTION POPUP ─── */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1A1714] border border-[#E8DFD8] dark:border-[#2A2520] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DFD8] dark:border-[#2A2520] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                  Evidence Ledger: {activeEvidenceModal.skillName}
                </h4>
              </div>
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Authentic platform records validating competencies for <strong>{activeEvidenceModal.candidateName}</strong>:
            </p>

            <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin">
              {activeEvidenceModal.evidence && activeEvidenceModal.evidence.length > 0 ? (
                activeEvidenceModal.evidence.map((ev, eIdx) => (
                  <div key={eIdx} className="p-3 rounded-xl bg-stone-50 dark:bg-[#141210] border border-stone-200/80 dark:border-stone-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold uppercase text-[10px] text-brand-600 dark:text-brand-400">
                        {ev.evidence_type.replace('_', ' ')}
                      </span>
                      {ev.score_contribution !== null && (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                          +{ev.score_contribution} pts
                        </span>
                      )}
                    </div>
                    {ev.snippet && (
                      <p className="text-stone-700 dark:text-stone-300 text-[11px] leading-relaxed">
                        &ldquo;{ev.snippet}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-stone-400 italic">No structured evidence records available.</p>
              )}
            </div>

            <div className="pt-2 text-right">
              <Button size="sm" variant="secondary" onClick={() => setActiveEvidenceModal(null)}>
                Close Ledger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
