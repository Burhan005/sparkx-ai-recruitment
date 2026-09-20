import React, { useState } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  Sparkles, X, Plus, CheckCircle2, 
  BrainCircuit, Sliders, ArrowRight 
} from 'lucide-react';

export default function JobCreatorModal({ isOpen, onClose }) {
  const { createJob } = useRecruitment();
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Bangalore, India (Hybrid)',
    experience: '3-5 years',
    minExperienceYears: 3,
    education: "Bachelor's or Master's in Computer Science or related field",
    description: '',
    requiredSkills: '',
    languages: ['Python', 'JavaScript', 'TypeScript'],
    codingDifficulty: 'Mid-Level',
    status: 'Active'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleLanguage = (lang) => {
    setFormData(prev => {
      const current = prev.languages || [];
      const updated = current.includes(lang)
        ? (current.length > 1 ? current.filter(l => l !== lang) : current)
        : [...current, lang];
      return { ...prev, languages: updated };
    });
  };

  const handleGenerateAIQuestions = () => {
    setIsGenerating(true);
    // Simulate AI synthesis of customized adaptive questions
    setTimeout(() => {
      const skills = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const mainSkill = skills[0] || 'System Architecture';
      const secSkill = skills[1] || 'Concurrency';

      setGeneratedQuestions([
        {
          id: 'q_gen_1',
          type: 'Technical Deep-Dive',
          prompt: `In your past production systems using ${mainSkill}, how did you profile latency bottlenecks and optimize throughput under high-QPS traffic bursts?`
        },
        {
          id: 'q_gen_2',
          type: 'Failure Modes & Resilience',
          prompt: `Describe a specific catastrophic failure or race condition you encountered with ${secSkill}. What diagnostic telemetry did you rely on and what was the root cause?`
        },
        {
          id: 'q_gen_3',
          type: 'Behavioral & Leadership',
          prompt: `How do you resolve architectural disputes within cross-functional teams when there is no consensus on tech stack trade-offs?`
        }
      ]);
      setIsGenerating(false);
    }, 900);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);

    const newJob = {
      id: `job-${Date.now()}`,
      title: formData.title,
      department: formData.department,
      location: formData.location,
      experience: `${formData.minExperienceYears}+ years`,
      minExperienceYears: Number(formData.minExperienceYears),
      education: formData.education,
      description: formData.description || `We are looking for an experienced ${formData.title} to join our high-impact team.`,
      requiredSkills: skillsArray.length ? skillsArray : ['System Architecture', 'Algorithms', 'Debugging'],
      languages: formData.languages,
      codingDifficulty: formData.codingDifficulty,
      status: 'Active'
    };

    createJob(newJob);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 my-8 overflow-hidden">
        
        {/* Iridescent top hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Job Requirement</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Autonomous profile synthesis & adaptive interview questions generation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Job Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department *</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Min Experience (Years) *</label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.minExperienceYears}
                onChange={e => setFormData({ ...formData, minExperienceYears: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Required Skills (Comma separated) *</label>
            <input
              type="text"
              value={formData.requiredSkills}
              onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
              placeholder="e.g. Python, FastAPI, React, PyTorch"
              required
            />
          </div>

          {/* Programming Languages & Assessment Difficulty */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] space-y-3 shadow-inner">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supported Programming Languages for Coding Assessment *
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Candidates can select any of these allowed languages to complete their technical tasks.</p>
              <div className="flex flex-wrap gap-2">
                {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Go'].map(lang => {
                  const isChecked = (formData.languages || []).includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center space-x-1.5 ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <span>{isChecked ? '✓' : '+'}</span>
                      <span>{lang}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Coding Assessment Difficulty:
              </label>
              <div className="flex items-center space-x-1.5">
                {['Junior', 'Mid-Level', 'Senior'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFormData({ ...formData, codingDifficulty: lvl })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${
                      formData.codingDifficulty === lvl
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Education Qualification *</label>
            <input
              type="text"
              value={formData.education}
              onChange={e => setFormData({ ...formData, education: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 shadow-inner"
            />
          </div>

          {/* AI Question Generation trigger */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#06080E] border border-indigo-200 dark:border-indigo-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>AI Interview Question & Assessment Generator</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically designs technical and adaptive cross-questions tailored for this role.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateAIQuestions}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Synthesizing..." : "Preview Questions"}</span>
            </button>
          </div>

          {/* Questions preview */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto p-3 bg-slate-50 dark:bg-[#06080E] rounded-2xl border border-slate-200 dark:border-white/[0.06]">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Generated Adaptive Question Set ({generatedQuestions.length})</span>
              {generatedQuestions.map((q, idx) => (
                <div key={q.id} className="text-xs p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 shadow-sm">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Q{idx+1}: {q.type}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full">Adaptive Probe Ready</span>
                  </div>
                  <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">{q.prompt}</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Requirement Created!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Requirement</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
