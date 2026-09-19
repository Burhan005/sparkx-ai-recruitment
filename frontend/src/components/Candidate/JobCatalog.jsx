import React, { useState } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import ResumeUploadModal from './ResumeUploadModal';
import { FadeInUp } from '../ui/Primitives';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  BrainCircuit, 
  CheckCircle2, 
  GraduationCap, 
  Globe 
} from 'lucide-react';

export default function JobCatalog() {
  const { jobs, setActiveJobId } = useRecruitment();
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);

  const handleApplyClick = (job) => {
    setActiveJobId(job.id);
    setSelectedJobForApply(job);
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-12 border border-white/[0.08] text-center shadow-2xl">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/15 via-purple-600/10 to-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous AI Talent Intelligence Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            AI-Powered Hiring, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Fair, Transparent & Adaptive
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Screen resumes instantly, engage in real-time adaptive voice/video interviews, and receive automated skill-gap feedback with personalized career recommendations.
          </p>

          {/* Quick Stats */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto">
            <div className="p-3.5 rounded-2xl bg-[#0B0F19]/90 border border-white/[0.08] shadow-md">
              <div className="text-xl font-extrabold text-white">&lt; 3 Mins</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Instant Screening & Parsing</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0B0F19]/90 border border-white/[0.08] shadow-md">
              <div className="text-xl font-extrabold text-indigo-400">Adaptive AI</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Real-time Cross Questioning</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0B0F19]/90 border border-white/[0.08] shadow-md col-span-2 sm:col-span-1">
              <div className="text-xl font-extrabold text-emerald-400">Zero Bias</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Skill-Evidence Scorecard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Roles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Open Technical & Product Roles</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a position to test automatic resume parsing and live AI interview assessment.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {jobs.length} Positions Available
          </span>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job, idx) => (
            <FadeInUp key={job.id} delay={idx * 80}>
            <div
              className="glass-card-hover p-6 rounded-3xl border border-white/[0.08] flex flex-col justify-between space-y-5 h-full relative group overflow-hidden shadow-xl hover:border-indigo-500/40"
            >
              {/* Subtle top iridescent hairline accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      {job.department}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5 group-hover:text-indigo-200 transition-colors">{job.title}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.experience}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span className="line-clamp-1">{job.education}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {job.description}
                </p>

                {/* Required Skills */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.requiredSkills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-[#06080E] text-slate-300 text-xs font-medium border border-white/[0.08]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply CTA Bar */}
              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Autonomous Assessment Enabled</span>
                </div>

                <button
                  onClick={() => handleApplyClick(job)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 group-hover:shadow-indigo-500/40"
                >
                  <span>Apply with AI</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>
            </FadeInUp>
          ))}
        </div>
      </div>

      {/* Resume Upload / Application Modal */}
      {selectedJobForApply && (
        <ResumeUploadModal
          job={selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
        />
      )}

    </div>
  );
}
