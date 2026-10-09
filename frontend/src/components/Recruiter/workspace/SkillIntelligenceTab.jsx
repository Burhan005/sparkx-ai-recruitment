import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  TrendingUp, 
  Layers,
  ShieldCheck,
  Award,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  ExternalLink,
  Target,
  Zap
} from 'lucide-react';
import { Card, Badge, Progress } from '../../ui/Primitives';
import api from '../../../services/api';

export default function SkillIntelligenceTab({ candidate, activeJob }) {
  if (!candidate) return null;

  const [matchData, setMatchData] = useState(null);
  const [dbSkills, setDbSkills] = useState([]);
  const [expandedSkillId, setExpandedSkillId] = useState(null);
  const [expandedReqSkillId, setExpandedReqSkillId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Authoritative data fetching: consumes backend calculation with 0 frontend math
  useEffect(() => {
    let isMounted = true;
    async function loadAuthoritativeMatch() {
      if (!candidate?.id) return;
      setLoading(true);
      try {
        const [matchRes, cSkills] = await Promise.all([
          api.getCandidateJobMatch(candidate.id, activeJob?.id),
          api.getCandidateSkills(candidate.id)
        ]);
        if (isMounted) {
          if (matchRes) setMatchData(matchRes);
          if (Array.isArray(cSkills) && cSkills.length > 0) setDbSkills(cSkills);
        }
      } catch (err) {
        console.warn('[SkillIntelligenceTab] Authoritative match fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAuthoritativeMatch();
    return () => { isMounted = false; };
  }, [candidate?.id, activeJob?.id]);

  const relationalSkills = dbSkills.length > 0 
    ? dbSkills 
    : (candidate.relationalSkills || candidate.relational_skills || []);

  const overall = matchData?.overall_match;
  const mustHave = matchData?.must_have;
  const preferred = matchData?.preferred;
  const evaluatedRequirements = matchData?.skills || [];
  const gaps = candidate.skill_gaps || candidate.skillGaps || [];

  return (
    <div className="space-y-6">
      {/* Skill Passport Navigation Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20 dark:border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Verified Skill Passport
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30">
                Evidence-Backed
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect granular proof artifacts (coding executions, MCQ telemetry, AI interview scorecards) and perform recruiter manual verification.
            </p>
          </div>
        </div>
        <a
          href={`/skill-passport/${candidate.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <span>Open Full Passport</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Authoritative Match Summary Cards (Zero Client-Side Computation) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Authoritative Match */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Overall Match</span>
            {overall && (
              <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                overall.status === 'strong_match' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                overall.status === 'good_match' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                overall.status === 'moderate_match' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {overall.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {overall ? `${overall.score}%` : `${candidate.matchScore || 0}%`}
          </div>
          <div className="mt-2">
            <Progress value={overall ? overall.score : (candidate.matchScore || 0)} variant="primary" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {overall ? `${overall.matched_skills_count} of ${overall.total_skills_count} skills present` : 'Dynamic relational match'}
          </span>
        </Card>

        {/* Must-Have Requirements */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Must-Have Score</span>
            <Target className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {mustHave ? `${mustHave.score}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">
            {mustHave ? `${mustHave.matched} / ${mustHave.total} requirements met` : 'Evaluating...'}
          </span>
          {mustHave?.has_missing && (
            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3 h-3" /> Missing critical must-haves
            </span>
          )}
        </Card>

        {/* Preferred Requirements */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Preferred Score</span>
            <Zap className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {preferred ? `${preferred.score}%` : '—'}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">
            {preferred ? `${preferred.matched} / ${preferred.total} requirements met` : 'Evaluating...'}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Secondary competencies</span>
        </Card>

        {/* Identified Gaps */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Identified Gaps</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-500 mt-1">
            {Array.isArray(gaps) ? gaps.length : (gaps ? Object.keys(gaps).length : 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 block font-medium">
            Ramp-up opportunities
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Targeted onboarding</span>
        </Card>
      </div>

      {/* Authoritative Job Requirements Match Matrix */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Authoritative Requirement Breakdown & Mathematical Proof</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {evaluatedRequirements.length} Requirement{evaluatedRequirements.length === 1 ? '' : 's'} Evaluated
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            Computing authoritative database-backed match result...
          </div>
        ) : evaluatedRequirements.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No specific skill requirements configured for this job opening.
          </div>
        ) : (
          <div className="space-y-3">
            {evaluatedRequirements.map((req, idx) => {
              const isExpanded = expandedReqSkillId === req.skill_id;
              const isMissing = req.status === 'missing';
              const isVerifiedMatch = req.status === 'verified_match';
              const isSatisfied = req.status === 'satisfied';

              return (
                <div
                  key={req.skill_id || idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isMissing
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-800 dark:text-slate-200'
                      : isVerifiedMatch
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {isVerifiedMatch ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : isSatisfied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className={`w-4 h-4 shrink-0 ${isMissing ? 'text-rose-500' : 'text-amber-500'}`} />
                      )}
                      <div>
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span>{req.skill_name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                            req.requirement_type === 'must_have'
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                          }`}>
                            {req.requirement_type} (w={req.weight})
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {req.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isVerifiedMatch ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                        isSatisfied ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        isMissing ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' :
                        'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>

                      <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 min-w-[55px] text-right">
                        {req.satisfaction_score}%
                      </span>
                    </div>
                  </div>

                  {/* Detail Strip: Experience, Proficiency, and Verification */}
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Experience Check</span>
                      <span className={req.experience_satisfied ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                        {req.candidate_years}y / {req.required_years}y required ({req.experience_satisfied ? 'Met' : 'Short'})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Proficiency Check</span>
                      <span className={req.proficiency_satisfied ? 'text-emerald-600 font-medium capitalize' : 'text-amber-600 capitalize'}>
                        {req.candidate_proficiency} vs {req.required_proficiency} required ({req.proficiency_satisfied ? 'Met' : 'Below'})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Verification Status</span>
                      <span className={`font-mono text-[10px] font-bold ${
                        req.verification_status === 'VERIFIED' ? 'text-emerald-600' :
                        req.verification_status === 'PARTIALLY_VERIFIED' ? 'text-blue-600' :
                        req.verification_status === 'SELF_REPORTED' ? 'text-slate-500' : 'text-rose-500'
                      }`}>
                        {req.verification_status} ({req.evidence_count} evidence record{req.evidence_count === 1 ? '' : 's'})
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Explanation */}
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 italic">
                      {req.explanation}
                    </span>
                    {req.evidence && req.evidence.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedReqSkillId(isExpanded ? null : req.skill_id)}
                        className="text-[10px] font-mono text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>Inspect Evidence</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded Evidence Records for Requirement */}
                  {isExpanded && req.evidence && (
                    <div className="mt-2.5 space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      {req.evidence.map((ev, evIdx) => (
                        <div
                          key={ev.id || evIdx}
                          className="p-2 rounded-lg bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-stone-400">
                            <span className="uppercase font-bold text-brand-600 dark:text-brand-400">{ev.evidence_type}</span>
                            {ev.score_contribution > 0 && (
                              <span className="text-emerald-600 font-bold">Score: {ev.score_contribution}%</span>
                            )}
                          </div>
                          {ev.snippet && (
                            <p className="text-stone-600 dark:text-stone-300 italic text-[11px] leading-relaxed">
                              "{ev.snippet}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Authoritative Relational Skill Profile & Evidence Ledger */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>Relational Skill Inventory & Evidence Ledger</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {relationalSkills.length} Canonical Association{relationalSkills.length === 1 ? '' : 's'}
          </span>
        </div>

        {relationalSkills.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No relational skills recorded for this candidate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relationalSkills.map((sk) => {
              const isExpanded = expandedSkillId === sk.candidate_skill_id;
              const hasEvidence = sk.evidence && sk.evidence.length > 0;

              return (
                <div
                  key={sk.candidate_skill_id || sk.skill_id}
                  className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {sk.name}
                      </span>
                      {sk.is_verified ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          SELF-REPORTED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase">
                      {sk.category || 'General'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                    <span>Proficiency: <strong className="text-stone-700 dark:text-stone-300 capitalize">{sk.proficiency_level || 'unspecified'}</strong></span>
                    {sk.is_verified && sk.verified_score != null && (
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Score: {Math.round(sk.verified_score)}%
                      </span>
                    )}
                  </div>

                  {hasEvidence && (
                    <div className="pt-1.5 border-t border-stone-200/60 dark:border-stone-800/60">
                      <button
                        type="button"
                        onClick={() => setExpandedSkillId(isExpanded ? null : sk.candidate_skill_id)}
                        className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>{sk.evidence.length} Evidence Record{sk.evidence.length === 1 ? '' : 's'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5">
                          {sk.evidence.map((ev, evIdx) => (
                            <div
                              key={ev.id || evIdx}
                              className="p-2 rounded-lg bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-800 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between font-mono text-[10px] text-stone-400">
                                <span className="uppercase font-bold text-brand-600 dark:text-brand-400">{ev.evidence_type}</span>
                                {ev.score_contribution > 0 && (
                                  <span className="text-emerald-600 font-bold">+{ev.score_contribution} pts</span>
                                )}
                              </div>
                              {ev.snippet && (
                                <p className="text-stone-600 dark:text-stone-300 italic text-[11px] leading-relaxed">
                                  "{ev.snippet}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
