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
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-12 border border-slate-800 text-center">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart India Hackathon 2026 Innovation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            AI-Powered Hiring, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Fair, Transparent & Adaptive
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal">
            Screen resumes instantly, engage in real-time adaptive voice/video interviews, and receive automated skill-gap feedback and personalized career recommendations.
          </p>

          {/* Quick Stats */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl font-bold text-white">&lt; 3 Mins</div>
              <div className="text-[11px] text-slate-400">Instant Screening & Parsing</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-xl font-bold text-indigo-400">Adaptive AI</div>
              <div className="text-[11px] text-slate-400">Real-time Cross Questioning</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 col-span-2 sm:col-span-1">
              <div className="text-xl font-bold text-emerald-400">Zero Bias</div>
              <div className="text-[11px] text-slate-400">Skill-Evidence Scorecard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Roles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Open Technical & Product Roles</h2>
            <p className="text-xs text-slate-400">Select a position to test automatic resume parsing and live AI interview assessment.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/50">
            {jobs.length} Positions Available
          </span>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job, idx) => (
            <FadeInUp key={job.id} delay={idx * 80}>
            <div
              className="glass-card-hover p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-5 h-full"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      {job.department}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{job.title}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.experience}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                    <span className="line-clamp-1">{job.education}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Required Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.requiredSkills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-200 text-xs font-medium border border-slate-700/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply CTA Bar */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Screening & Live Assessment Enabled</span>
                </div>

                <button
                  onClick={() => handleApplyClick(job)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
                >
                  <span>Apply with AI</span>
                  <ChevronRight className="w-3.5 h-3.5" />
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
