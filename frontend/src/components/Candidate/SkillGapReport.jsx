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
    activeJob, 
    setCurrentView 
  } = useRecruitment();

  const cand = selectedCandidate || {
    name: "Alex Rivera",
    scores: {
      jobSkills: 92,
      technicalScore: 94,
      communication: 88,
      problemSolving: 90,
      overall: 91
    },
    integrityScore: 95,
    integrityRisk: "Low",
    skillGaps: {
      readiness: "Immediately Job-Ready",
      strongSkills: ["Python", "FastAPI", "React", "System Architecture", "Telemetry Aggregation"],
      missingSkills: ["WebRTC Data Channels", "Advanced HNSW Index Optimization"],
      recommendations: [
        "Explore real-time WebRTC datachannels for ultra-low latency browser streaming.",
        "Deepen understanding of vector clustering techniques for massive-scale datasets."
      ]
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="glass-card p-8 rounded-3xl border border-slate-800 text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 flex items-center justify-center text-white mx-auto shadow-xl">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
            Assessment Complete & Evaluated
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            Candidate Performance & Skill Gap Dossier
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1">
            Slide 13: "Turns recruitment into a hire-and-develop workflow with instant candidate feedback and learning paths."
          </p>
        </div>

        {/* Score Circles Grid */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Overall Score</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">{cand.scores?.overall || 91}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Technical Depth</span>
            <div className="text-3xl font-black text-indigo-400 mt-1">{cand.scores?.technicalScore || 94}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Communication</span>
            <div className="text-3xl font-black text-purple-400 mt-1">{cand.scores?.communication || 88}%</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Integrity Check</span>
            <div className="text-3xl font-black text-cyan-400 mt-1">{cand.integrityScore || 95}%</div>
          </div>
        </div>
      </div>

      {/* Hire and Develop Readiness Card */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-900/40 space-y-4">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Automated Readiness Evaluation</span>
        </div>

        <div className="text-xl font-bold text-white">
          {cand.skillGaps?.readiness || "Immediately Job-Ready"}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Strengths */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Validated Strengths</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cand.skillGaps?.strongSkills?.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 text-xs border border-emerald-800/40">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Areas for Upskilling</span>
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {cand.skillGaps?.missingSkills?.map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 text-xs border border-amber-800/40">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Recommendations */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-slate-300 font-bold text-xs uppercase tracking-wider">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Personalized Career & Learning Roadmap</span>
        </div>

        <div className="space-y-3">
          {cand.skillGaps?.recommendations?.map((rec, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-3 text-xs sm:text-sm text-slate-300">
              <div className="w-6 h-6 rounded-full bg-indigo-950 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 mt-0.5 border border-indigo-800">
                {i + 1}
              </div>
              <div className="flex-1">
                <span className="font-semibold text-white">{rec}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setCurrentView('candidate')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          Return to Job Catalog
        </button>

        <button
          onClick={() => setCurrentView('recruiter')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
        >
          <span>View in HR Recruiter Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
