import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  TrendingUp, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, Badge, Progress } from '../../ui/Primitives';

export default function SkillIntelligenceTab({ candidate, activeJob }) {
  if (!candidate) return null;
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (activeJob?.requiredSkills || ['Python', 'SQL', 'FastAPI', 'Docker', 'Distributed Systems']);
  const gaps = candidate.skill_gaps || candidate.skillGaps || [];
  const matchDetails = candidate.matchDetails || {};

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Role Match Score</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {candidate.matchScore || 0}%
          </div>
          <div className="mt-2">
            <Progress value={candidate.matchScore || 0} variant="primary" />
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Verified Competencies</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {requiredSkills.filter(req => candidateSkills.includes(req.toLowerCase())).length} / {requiredSkills.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Key requirements validated</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Identified Skill Gaps</span>
          <div className="text-3xl font-black text-amber-500 mt-1">
            {Array.isArray(gaps) ? gaps.length : (gaps ? Object.keys(gaps).length : 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Ramp-up opportunities</span>
        </Card>
      </div>

      {/* Skills Matrix: Required vs Candidate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Job Requirements Alignment</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Position Profile</span>
          </div>

          <div className="space-y-2.5">
            {requiredSkills.map((req, idx) => {
              const hasSkill = candidateSkills.some(s => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s));
              return (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    hasSkill 
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {hasSkill ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{req}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    hasSkill 
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {hasSkill ? 'MATCHED' : 'UNVERIFIED'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Skill Gap Analysis & Ramp-up Roadmap */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Skill Gap Analysis & Recommendations</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Onboarding Scope</span>
          </div>

          {Array.isArray(gaps) && gaps.length > 0 ? (
            <div className="space-y-3">
              {gaps.map((gap, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>{typeof gap === 'string' ? gap : (gap.skill || 'Identified Gap')}</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">Recommended 2-4 wk ramp</span>
                  </div>
                  {gap.recommendation && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {gap.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">No Critical Gaps Identified</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Candidate meets or exceeds primary technical prerequisites for this role.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
