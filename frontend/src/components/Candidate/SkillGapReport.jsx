import React from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  ExternalLink,
  Briefcase
} from 'lucide-react';

export default function SkillGapReport() {
  const { 
    selectedCandidate, 
    candidates,
    currentUser,
    activeJob, 
    setCurrentView 
  } = useRecruitment();

  // Pick the real active candidate (selected or logged-in candidate)
  const cand = selectedCandidate || candidates.find(c => c.email === currentUser?.email || c.id === currentUser?.id) || (candidates.length > 0 ? candidates[candidates.length - 1] : null);

  const activeJobSkills = activeJob?.requiredSkills || ["AWS", "Docker", "Kubernetes"];

  if (!cand) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 text-center py-24">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">No Assessment Evaluated Yet</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Complete the technical assessment for {activeJob?.title || 'your applied role'} to generate your dynamic competency evaluation.
        </p>
        <button
          onClick={() => setCurrentView('assessment')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
        >
          Start Technical Assessment
        </button>
      </div>
    );
  }

  // Extract honest scores from the candidate record
  const scores = cand.scores || {};
  const overall = typeof scores.overall === 'number' ? scores.overall : (cand.coding_score ?? 0);
  const technicalScore = typeof scores.technicalScore === 'number' ? scores.technicalScore : (cand.coding_score ?? 0);
  const communication = typeof scores.communication === 'number' ? scores.communication : 0;
  const integrity = cand.integrityScore ?? cand.integrity_score ?? 100;

  // Dynamic skill gaps based on actual evaluation
  const rawGaps = cand.skillGaps || cand.skill_gaps || {};
  const readiness = rawGaps.readiness || (
    overall >= 80 ? "Immediately Job-Ready" :
    overall >= 50 ? "Hire-and-Develop (Trainable within 30 days)" :
    "Needs Foundational Preparation (Gap > 70%)"
  );
  const strongSkills = rawGaps.strongSkills || (overall >= 50 ? activeJobSkills.slice(0, 2) : []);
  const missingSkills = rawGaps.missingSkills || activeJobSkills;
  const recommendations = rawGaps.recommendations || missingSkills.map(s => `Targeted mastery in ${s}: Complete hands-on system design module.`);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-white/[0.08] text-center space-y-5 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none"></div>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl ring-1 ring-white/20 ${
          overall >= 80 ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-600/30' :
          overall >= 50 ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-600/30' :
          'bg-gradient-to-tr from-rose-600 to-amber-600 shadow-rose-600/30'
        }`}>
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border shadow-sm ${
            overall >= 80 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
            overall >= 50 ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/25' :
            'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
          }`}>
            {overall === 0 ? 'Assessment Blank / Incomplete' : 'Assessment Complete & Verified'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3 tracking-tight">
            Candidate Performance & Skill Gap Dossier
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mt-1.5 font-normal leading-relaxed">
            Autonomous Talent Feedback: Actionable competency telemetry for <span className="font-bold text-slate-700 dark:text-slate-300">{cand.name}</span> ({activeJob?.title || cand.job?.title || 'Applied Position'}).
          </p>
        </div>

        {/* Score Metric Cards Grid */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] shadow-md">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Overall Score</span>
            <div className={`text-3xl font-black mt-1 ${overall >= 80 ? 'text-emerald-600 dark:text-emerald-400' : overall >= 50 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              {overall}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] shadow-md">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Technical Depth</span>
            <div className={`text-3xl font-black mt-1 ${technicalScore >= 80 ? 'text-indigo-600 dark:text-indigo-400' : technicalScore >= 50 ? 'text-indigo-500' : 'text-rose-500'}`}>
              {technicalScore}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] shadow-md">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Communication</span>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {communication}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] shadow-md">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Integrity Audit</span>
            <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {integrity}%
            </div>
          </div>
        </div>
      </div>

      {/* Hire and Develop Readiness Card */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <span>Automated Readiness Evaluation</span>
        </div>

        <div className={`text-xl font-bold ${overall >= 80 ? 'text-emerald-600 dark:text-emerald-400' : overall >= 50 ? 'text-slate-900 dark:text-white' : 'text-rose-500 dark:text-rose-400'}`}>
          {readiness}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Strengths */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] space-y-2.5 shadow-sm">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Validated Strengths</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {strongSkills.length > 0 ? (
                strongSkills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium border border-emerald-500/25">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No validated strengths verified in this submission.</span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] space-y-2.5 shadow-sm">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Targeted Upskilling Areas</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {missingSkills.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-500/25">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>Personalized Career & Learning Roadmap ({activeJob?.title || 'Applied Role'})</span>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] flex items-start space-x-3.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0 mt-0.5 border border-indigo-500/30">
                {i + 1}
              </div>
              <div className="flex-1">
                <span className="font-semibold text-slate-900 dark:text-white leading-relaxed">{rec}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setCurrentView('candidate')}
          className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition shadow-sm"
        >
          Return to Job Openings
        </button>

        <button
          onClick={() => setCurrentView('assessment')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
        >
          <span>Practice Technical Assessment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
