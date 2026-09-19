import React, { useState } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { generateQuestionsForRole } from '../../services/aiRecruiterService';
import { X, Sparkles, Plus, CheckCircle, BrainCircuit } from 'lucide-react';

export default function JobCreatorModal({ isOpen, onClose, onJobCreated }) {
  const { createJob } = useRecruitment();
  const [formData, setFormData] = useState({
    title: 'Lead AI & Full Stack Engineer',
    department: 'Engineering & Innovation',
    location: 'Bengaluru / Remote',
    minExperienceYears: 3,
    education: 'B.Tech / B.E. / M.Tech in Computer Science, Data Science or related',
    languages: 'English, Hindi',
    requiredSkills: 'Python, FastAPI, React, PyTorch, LangChain, PostgreSQL, System Design',
    optionalCriteria: 'Hands-on experience with real-time video/audio telemetry or WebRTC.',
    description: 'Lead the engineering architecture of next-generation enterprise AI interview and assessment automation.'
  });

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerateAIQuestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const qList = generateQuestionsForRole(
        formData.title,
        formData.requiredSkills,
        formData.minExperienceYears
      );
      setGeneratedQuestions(qList);
      setIsGenerating(false);
    }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
    const languagesArray = formData.languages.split(',').map(s => s.trim()).filter(Boolean);

    const questionsToUse = generatedQuestions.length > 0 
      ? generatedQuestions 
      : generateQuestionsForRole(formData.title, skillsArray, formData.minExperienceYears);

    const created = createJob({
      title: formData.title,
      department: formData.department,
      location: formData.location,
      experience: `${formData.minExperienceYears}+ years`,
      minExperienceYears: Number(formData.minExperienceYears),
      education: formData.education,
      languages: languagesArray,
      description: formData.description,
      requiredSkills: skillsArray,
      optionalCriteria: formData.optionalCriteria,
      questions: questionsToUse,
      codingAssessment: {
        title: `${formData.title} - Core Architecture Task`,
        language: "javascript",
        instructions: `Implement an optimized data handler validating ${skillsArray[0] || 'core'} payload consistency and edge latency constraints.`,
        initialCode: `// Implement candidate challenge
function validatePayload(input) {
  if (!input) return { valid: false };
  return { valid: true, timestamp: Date.now() };
}`,
        testCases: [
          { name: "Validates non-empty input", input: "{ role: 'AI Eng' }", expected: "{ valid: true }" }
        ]
      }
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onJobCreated) onJobCreated(created);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0B0F19] border border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8 overflow-hidden">
        
        {/* Iridescent top hairline */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Job Requirement</h2>
              <p className="text-xs text-slate-400">Autonomous profile synthesis & adaptive interview questions generation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department *</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Min Experience (Years) *</label>
              <input
                type="number"
                min="0"
                max="20"
                value={formData.minExperienceYears}
                onChange={e => setFormData({ ...formData, minExperienceYears: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Required Skills (Comma separated) *</label>
            <input
              type="text"
              value={formData.requiredSkills}
              onChange={e => setFormData({ ...formData, requiredSkills: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
              placeholder="e.g. Python, FastAPI, React, PyTorch"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Education Qualification *</label>
            <input
              type="text"
              value={formData.education}
              onChange={e => setFormData({ ...formData, education: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#06080E] border border-slate-700/80 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600 shadow-inner"
            />
          </div>

          {/* AI Question Generation trigger */}
          <div className="p-4 rounded-2xl bg-[#06080E] border border-indigo-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-xs">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span>AI Interview Question & Assessment Generator</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
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
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto p-3 bg-[#06080E] rounded-2xl border border-white/[0.06]">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Generated Adaptive Question Set ({generatedQuestions.length})</span>
              {generatedQuestions.map((q, idx) => (
                <div key={q.id} className="text-xs p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-slate-300">
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>Q{idx+1}: {q.type}</span>
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">Adaptive Probe Ready</span>
                  </div>
                  <p className="mt-1 text-slate-400 leading-relaxed">{q.prompt}</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
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
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Job Published!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Job & Launch Pipeline</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
