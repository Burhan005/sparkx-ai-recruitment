import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  CheckCircle2, 
  X, 
  Edit3, 
  Trash2, 
  Layers, 
  Save, 
  Loader2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Lock, 
  Globe, 
  HelpCircle,
  Tag,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Button, Badge, CustomDropdown } from '../ui/Primitives';
import { useToast } from '../ui/Toast';
import api from '../../services/api';

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  Medium: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  Hard: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
};

const CATEGORIES = ['All Categories', 'technical', 'domain', 'scenario', 'aptitude'];

export default function MCQBankManager({ activeJob, onAttachMCQs }) {
  const toast = useToast();

  // Questions State
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState(''); // '' | 'system' | 'custom'

  // Selected Question for Inspect / Edit
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Attached MCQs for the current job assessment
  const [attachedMCQs, setAttachedMCQs] = useState([]);
  const [isLoadingAttached, setIsLoadingAttached] = useState(false);
  const [isSavingAttachment, setIsSavingAttachment] = useState(false);

  // Authoring Form State
  const [formText, setFormText] = useState('');
  const [formCategory, setFormCategory] = useState('technical');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formExplanation, setFormExplanation] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formOptions, setFormOptions] = useState([
    { key: 'A', text: '', isCorrect: true },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false }
  ]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Fetch Questions from Database
  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getMCQQuestions({
        difficulty: difficultyFilter,
        category: categoryFilter === 'All Categories' ? '' : categoryFilter,
        search: searchQuery,
        is_system: sourceFilter === 'system' ? true : (sourceFilter === 'custom' ? false : '')
      });
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load MCQ question bank', err);
      toast.error('Failed to load question bank');
    } finally {
      setIsLoading(false);
    }
  }, [difficultyFilter, categoryFilter, searchQuery, sourceFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuestions();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadQuestions]);

  // Load attached MCQs for activeJob
  const loadAttachedMCQs = useCallback(async () => {
    if (!activeJob?.id) return;
    setIsLoadingAttached(true);
    try {
      const data = await api.getAssessmentMCQs(activeJob.id);
      if (Array.isArray(data) && data.length > 0) {
        setAttachedMCQs(data.map((item, idx) => ({
          mcq_question_id: item.id || item.mcq_question_id,
          question_text: item.question_text || item.title || 'MCQ Question',
          difficulty: item.difficulty || 'Medium',
          category: item.category || 'technical',
          weight: item.weight || 1.0,
          display_order: item.display_order || idx + 1,
          is_required: item.is_required ?? true
        })));
      } else if (activeJob.assessment_pool?.technical_mcqs) {
        // Fallback from pool if not yet linked relationally
        setAttachedMCQs(activeJob.assessment_pool.technical_mcqs.map((q, idx) => ({
          mcq_question_id: q.id,
          question_text: q.question,
          difficulty: q.difficulty || 'Medium',
          category: q.category || 'technical',
          weight: 1.0,
          display_order: idx + 1,
          is_required: true
        })));
      }
    } catch (err) {
      console.warn('Failed to load attached assessment MCQs', err);
    } finally {
      setIsLoadingAttached(false);
    }
  }, [activeJob?.id, activeJob?.assessment_pool]);

  useEffect(() => {
    loadAttachedMCQs();
  }, [loadAttachedMCQs]);

  // Handle open authoring modal for new question
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedQuestion(null);
    setFormText('');
    setFormCategory('technical');
    setFormDifficulty('Medium');
    setFormExplanation('');
    setFormSkills('');
    setFormOptions([
      { key: 'A', text: '', isCorrect: true },
      { key: 'B', text: '', isCorrect: false },
      { key: 'C', text: '', isCorrect: false },
      { key: 'D', text: '', isCorrect: false }
    ]);
    setIsAuthoringOpen(true);
  };

  // Handle open authoring modal for edit
  const handleOpenEditModal = (q) => {
    if (q.is_system) {
      toast.warning('Platform system questions cannot be modified. Create a custom question instead.');
      return;
    }
    setIsEditing(true);
    setSelectedQuestion(q);
    setFormText(q.question_text || '');
    setFormCategory(q.category || 'technical');
    setFormDifficulty(q.difficulty || 'Medium');
    setFormExplanation(q.explanation || '');
    setFormSkills(Array.isArray(q.skills) ? q.skills.join(', ') : '');

    const opts = (q.options && q.options.length > 0)
      ? q.options.map(opt => ({
          key: opt.option_key,
          text: opt.option_text,
          isCorrect: bool(opt.is_correct)
        }))
      : [
          { key: 'A', text: '', isCorrect: true },
          { key: 'B', text: '', isCorrect: false },
          { key: 'C', text: '', isCorrect: false },
          { key: 'D', text: '', isCorrect: false }
        ];
    setFormOptions(opts);
    setIsAuthoringOpen(true);
  };

  const handleCorrectOptionChange = (selectedKey) => {
    setFormOptions(prev => prev.map(opt => ({
      ...opt,
      isCorrect: opt.key === selectedKey
    })));
  };

  const handleOptionTextChange = (key, text) => {
    setFormOptions(prev => prev.map(opt => opt.key === key ? { ...opt, text } : opt));
  };

  // Submit authoring form
  const handleSubmitAuthoring = async (e) => {
    e.preventDefault();
    if (!formText.trim()) {
      toast.error('Question text is required');
      return;
    }

    const filledOptions = formOptions.filter(o => o.text.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Please provide at least 2 non-empty options');
      return;
    }

    const hasCorrect = filledOptions.some(o => o.isCorrect);
    if (!hasCorrect) {
      toast.error('Please select exactly one correct option');
      return;
    }

    const skillsArray = formSkills.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      question_text: formText.trim(),
      category: formCategory,
      difficulty: formDifficulty,
      explanation: formExplanation.trim(),
      skills: skillsArray,
      options: filledOptions.map((o, idx) => ({
        option_key: o.key,
        option_text: o.text.trim(),
        is_correct: o.isCorrect,
        display_order: idx + 1
      }))
    };

    setIsSubmittingForm(true);
    try {
      if (isEditing && selectedQuestion?.id) {
        const updated = await api.updateMCQQuestion(selectedQuestion.id, payload);
        toast.success('MCQ question updated successfully');
        setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
        if (selectedQuestion.id === updated.id) setSelectedQuestion(updated);
      } else {
        const created = await api.createMCQQuestion(payload);
        toast.success('Custom MCQ question created');
        setQuestions(prev => [created, ...prev]);
        setSelectedQuestion(created);
      }
      setIsAuthoringOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save MCQ question');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Archive / Delete Custom MCQ
  const handleDeleteMCQ = async (questionId) => {
    if (!window.confirm('Are you sure you want to archive this question? It will no longer appear in the active bank.')) {
      return;
    }
    try {
      await api.deleteMCQQuestion(questionId);
      toast.success('Question archived');
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      if (selectedQuestion?.id === questionId) setSelectedQuestion(null);
    } catch (err) {
      toast.error(err.message || 'Failed to archive question');
    }
  };

  // Toggle MCQ attached to active assessment
  const handleToggleAttach = (q) => {
    const isAttached = attachedMCQs.some(item => item.mcq_question_id === q.id);
    if (isAttached) {
      setAttachedMCQs(prev => prev.filter(item => item.mcq_question_id !== q.id));
    } else {
      setAttachedMCQs(prev => [
        ...prev,
        {
          mcq_question_id: q.id,
          question_text: q.question_text,
          difficulty: q.difficulty,
          category: q.category,
          weight: 1.0,
          display_order: prev.length + 1,
          is_required: true
        }
      ]);
    }
  };

  // Save attached MCQs to active job assessment
  const handleSaveAttachments = async () => {
    if (!activeJob?.id) return;
    setIsSavingAttachment(true);
    try {
      const payload = attachedMCQs.map((item, idx) => ({
        mcq_question_id: item.mcq_question_id,
        display_order: idx + 1,
        weight: Number(item.weight || 1.0),
        is_required: Boolean(item.is_required ?? true)
      }));
      await api.attachAssessmentMCQs(activeJob.id, payload);
      toast.success(`Attached ${attachedMCQs.length} MCQs to assessment`);
      if (onAttachMCQs) onAttachMCQs(attachedMCQs);
    } catch (err) {
      toast.error(err.message || 'Failed to attach MCQs to assessment');
    } finally {
      setIsSavingAttachment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>MCQ Question Bank & Authoring</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                  {questions.length} questions
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative multi-tenant question bank with custom recruiter authoring and assessment binding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadQuestions}
            disabled={isLoading}
            className="text-xs"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="text-xs shadow-subtle"
          >
            Create Custom MCQ
          </Button>
        </div>
      </div>

      {/* ─── Active Job Assessment Attachment Banner ─── */}
      {activeJob && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50/70 to-slate-50 dark:from-brand-950/20 dark:to-slate-900/40 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
              {attachedMCQs.length}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Configuring Assessment for: <span className="text-brand-600 dark:text-brand-400">{activeJob.title}</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {attachedMCQs.length > 0 
                  ? `${attachedMCQs.length} MCQs selected for this role's candidate assessment.`
                  : 'Select MCQs below to attach them to this role\'s assessment bundle.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <Button
              variant="primary"
              size="xs"
              icon={isSavingAttachment ? Loader2 : CheckCircle2}
              onClick={handleSaveAttachments}
              disabled={isSavingAttachment}
              className="text-xs"
            >
              {isSavingAttachment ? 'Saving...' : 'Save & Publish to Assessment'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Filters & Search ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Sources</option>
          <option value="system">Platform System MCQs</option>
          <option value="custom">My Organization Custom MCQs</option>
        </select>
      </div>

      {/* ─── Question Grid & Preview ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Questions List */}
        <div className="lg:col-span-7 space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-xs">Loading question bank...</span>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No MCQ questions found matching your filter criteria.
            </div>
          ) : (
            questions.map(q => {
              const isSelected = selectedQuestion?.id === q.id;
              const isAttached = attachedMCQs.some(item => item.mcq_question_id === q.id);

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left space-y-2.5 ${
                    isSelected
                      ? 'bg-brand-50/50 dark:bg-brand-950/40 border-brand-500 ring-1 ring-brand-500/50'
                      : 'bg-white dark:bg-[#1A1714] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      {activeJob && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAttach(q);
                          }}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center transition-colors border ${
                            isAttached
                              ? 'bg-brand-600 border-brand-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent hover:border-brand-500'
                          }`}
                          title={isAttached ? 'Detach from assessment' : 'Attach to assessment'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      )}

                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {q.question_text}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${DIFFICULTY_COLORS[q.difficulty] || DIFFICULTY_COLORS.Medium}`}>
                            {q.difficulty}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {q.category}
                          </span>
                          {q.is_system ? (
                            <span className="flex items-center space-x-1 text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                              <Globe className="w-3 h-3" />
                              <span>Platform</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              <Sparkles className="w-3 h-3" />
                              <span>Custom</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!q.is_system && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(q)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit Custom MCQ"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMCQ(q.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Archive Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {q.skills && q.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {q.skills.slice(0, 5).map(skill => (
                        <span key={skill} className="px-1.5 py-0.5 text-[9px] rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 font-mono">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Preview Panel */}
        <div className="lg:col-span-5">
          <div className="p-5 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card sticky top-4 space-y-4">
            {selectedQuestion ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${DIFFICULTY_COLORS[selectedQuestion.difficulty] || DIFFICULTY_COLORS.Medium}`}>
                      {selectedQuestion.difficulty}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ID: {selectedQuestion.id}
                    </span>
                  </div>

                  {activeJob && (
                    <Button
                      variant={attachedMCQs.some(item => item.mcq_question_id === selectedQuestion.id) ? 'outline' : 'primary'}
                      size="xs"
                      onClick={() => handleToggleAttach(selectedQuestion)}
                      className="text-xs"
                    >
                      {attachedMCQs.some(item => item.mcq_question_id === selectedQuestion.id) ? 'Detach' : 'Attach'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                    {selectedQuestion.question_text}
                  </h3>
                </div>

                {/* Options List with Correct Answer Highlight */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Authoritative Options:
                  </label>
                  <div className="space-y-2">
                    {(selectedQuestion.options || []).map(opt => {
                      const isCorrect = Boolean(opt.is_correct || opt.option_key === selectedQuestion.correct_option);
                      return (
                        <div
                          key={opt.option_key}
                          className={`p-3 rounded-lg text-xs border flex items-start space-x-2.5 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium'
                              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {opt.option_key}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt.option_text}</span>
                          {isCorrect && (
                            <span className="flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Correct</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                {selectedQuestion.explanation && (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Rationale / Explanation:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      {selectedQuestion.explanation}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select a question from the bank to preview its options and authoritative answer.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Authoring Modal (Create / Edit) ─── */}
      {isAuthoringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  <Edit3 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Custom MCQ' : 'Author New Custom MCQ'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthoringOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAuthoring} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="technical">technical</option>
                    <option value="domain">domain</option>
                    <option value="scenario">scenario</option>
                    <option value="aptitude">aptitude</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Skills / Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  placeholder="e.g. python, concurrency, postgresql"
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Options Configuration */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] font-mono">
                    Answer Options (Mark the single correct option):
                  </label>
                </div>

                <div className="space-y-2">
                  {formOptions.map(opt => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-lg border flex items-center space-x-3 ${
                        opt.isCorrect
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct_mcq_radio"
                        checked={opt.isCorrect}
                        onChange={() => handleCorrectOptionChange(opt.key)}
                        className="text-brand-600 focus:ring-brand-500 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <span className="w-5 font-bold font-mono text-slate-700 dark:text-slate-300">
                        {opt.key}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(opt.key, e.target.value)}
                        placeholder={`Option ${opt.key} text...`}
                        className="flex-1 p-2 text-xs rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Rationale / Explanation (for evaluation review)
                </label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why this option is correct based on industry standards..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAuthoringOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingForm}
                  icon={isSubmittingForm ? Loader2 : Save}
                >
                  {isSubmittingForm ? 'Saving...' : 'Save MCQ to Database'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
