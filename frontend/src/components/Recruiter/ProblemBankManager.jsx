import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Code2, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  CheckCircle2, 
  X, 
  Edit3, 
  Trash2, 
  Layers, 
  Play, 
  Save, 
  Loader2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronDown, 
  ExternalLink, 
  Sparkles, 
  Lock, 
  Globe, 
  Terminal,
  FileCode,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Button, Badge, CustomDropdown } from '../ui/Primitives';
import { useToast } from '../ui/Toast';
import api from '../../services/api';

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  Medium: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  Hard: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
};

export default function ProblemBankManager({ activeJob, onAttachProblems }) {
  const toast = useToast();

  // State
  const [problems, setProblems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState(''); // '' | 'system' | 'custom'

  // Selected Problem for Inspect/Edit
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Attached Problems for the current job assessment
  const [attachedProblems, setAttachedProblems] = useState([]);
  const [isLoadingAttached, setIsLoadingAttached] = useState(false);
  const [isSavingAttachment, setIsSavingAttachment] = useState(false);

  // Authoring Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formStatement, setFormStatement] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formExecutionMode, setFormExecutionMode] = useState('function');
  const [formFunctionName, setFormFunctionName] = useState('solve');
  const [formParamName, setFormParamName] = useState('data');
  const [formParamType, setFormParamType] = useState('any');
  const [formReturnType, setFormReturnType] = useState('any');
  const [formConstraints, setFormConstraints] = useState('');
  const [formInputFormat, setFormInputFormat] = useState('');
  const [formOutputFormat, setFormOutputFormat] = useState('');
  const [formAllowedLanguages, setFormAllowedLanguages] = useState(['python', 'javascript', 'typescript', 'java', 'cpp']);
  const [formTestCases, setFormTestCases] = useState([
    { input_data: '2\n3', expected_output: '5', is_hidden: false, weight: 20.0, explanation: 'Sample case' },
    { input_data: '10\n20', expected_output: '30', is_hidden: true, weight: 80.0, explanation: '' }
  ]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Sandbox Test Run State inside Authoring Modal
  const [testRunCode, setTestRunCode] = useState('');
  const [testRunLang, setTestRunLang] = useState('python');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testRunResult, setTestRunResult] = useState(null);

  // Load supported languages
  useEffect(() => {
    api.getSupportedCodingLanguages().then(langs => {
      if (langs && langs.length > 0) {
        setSupportedLanguages(langs);
      }
    }).catch(err => console.warn('Failed to load supported languages', err));
  }, []);

  // Fetch Problems
  const loadProblems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getCodingProblems({
        difficulty: difficultyFilter,
        search: searchQuery,
        execution_mode: modeFilter,
        is_system: sourceFilter === 'system' ? true : (sourceFilter === 'custom' ? false : '')
      });
      setProblems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load coding problems', err);
      toast.error('Failed to load problem bank');
    } finally {
      setIsLoading(false);
    }
  }, [difficultyFilter, searchQuery, modeFilter, sourceFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProblems();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadProblems]);

  // Load attached problems for activeJob
  const loadAttachedProblems = useCallback(async () => {
    if (!activeJob?.id) return;
    setIsLoadingAttached(true);
    try {
      const data = await api.getAssessmentCodingProblems(activeJob.id);
      if (Array.isArray(data) && data.length > 0) {
        setAttachedProblems(data.map(item => ({
          coding_problem_id: item.coding_problem_id,
          title: item.problem?.title || 'Coding Problem',
          slug: item.problem?.slug || '',
          difficulty: item.problem?.difficulty || 'Medium',
          weight: item.weight || 100.0,
          display_order: item.display_order || 1,
          is_required: item.is_required ?? true
        })));
      } else if (activeJob.assessment_pool?.coding_problems) {
        // Fallback from pool
        setAttachedProblems(activeJob.assessment_pool.coding_problems.map((p, idx) => ({
          coding_problem_id: p.id,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty || 'Medium',
          weight: p.weight || 100.0,
          display_order: idx + 1,
          is_required: true
        })));
      } else {
        setAttachedProblems([]);
      }
    } catch (err) {
      console.warn('Failed to load attached assessment problems', err);
    } finally {
      setIsLoadingAttached(false);
    }
  }, [activeJob?.id, activeJob?.assessment_pool]);

  useEffect(() => {
    loadAttachedProblems();
  }, [loadAttachedProblems]);

  // Handle open Author modal for new problem
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormTitle('');
    setFormSlug('');
    setFormStatement('');
    setFormDifficulty('Medium');
    setFormExecutionMode('function');
    setFormFunctionName('solve');
    setFormParamName('data');
    setFormParamType('any');
    setFormReturnType('any');
    setFormConstraints('');
    setFormInputFormat('');
    setFormOutputFormat('');
    setFormAllowedLanguages(['python', 'javascript', 'typescript', 'java', 'cpp']);
    setFormTestCases([
      { input_data: '2\n3', expected_output: '5', is_hidden: false, weight: 20.0, explanation: 'Sample case' },
      { input_data: '10\n20', expected_output: '30', is_hidden: true, weight: 80.0, explanation: '' }
    ]);
    setTestRunCode('def solve(data):\n    # Implement solution\n    return data\n');
    setTestRunResult(null);
    setIsAuthoringOpen(true);
  };

  // Handle open Author modal for editing custom problem
  const handleOpenEditModal = async (prob) => {
    if (prob.is_system) {
      toast.warning('System problems are platform-managed and cannot be edited.');
      return;
    }
    setIsEditing(true);
    setIsLoadingDetail(true);
    try {
      const full = await api.getCodingProblem(prob.id);
      if (!full) throw new Error('Problem not found');
      setSelectedProblem(full);
      setFormTitle(full.title || '');
      setFormSlug(full.slug || '');
      setFormStatement(full.problem_statement || '');
      setFormDifficulty(full.difficulty || 'Medium');
      setFormExecutionMode(full.execution_mode || 'function');
      setFormFunctionName(full.function_name || 'solve');
      const params = full.function_signature?.parameters || [];
      if (params.length > 0) {
        setFormParamName(params[0].name || 'data');
        setFormParamType(params[0].type || 'any');
      }
      setFormReturnType(full.function_signature?.return_type || 'any');
      setFormConstraints(full.constraints || '');
      setFormInputFormat(full.input_format || '');
      setFormOutputFormat(full.output_format || '');
      setFormAllowedLanguages(full.allowed_languages || ['python', 'javascript']);
      setFormTestCases(full.test_cases?.length > 0 ? full.test_cases.map(tc => ({
        input_data: tc.input_data || '',
        expected_output: tc.expected_output || '',
        is_hidden: Boolean(tc.is_hidden),
        weight: tc.weight || 1.0,
        explanation: tc.explanation || ''
      })) : [
        { input_data: '', expected_output: '', is_hidden: false, weight: 1.0, explanation: '' }
      ]);
      setTestRunCode(full.starter_code?.python || `def ${full.function_name || 'solve'}(data):\n    pass\n`);
      setTestRunResult(null);
      setIsAuthoringOpen(true);
    } catch (err) {
      toast.error('Failed to load problem details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Submit Authoring Form
  const handleSaveProblem = async (e) => {
    e?.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formStatement.trim()) {
      toast.error('Problem statement is required');
      return;
    }

    setIsSubmittingForm(true);
    const payload = {
      title: formTitle.trim(),
      slug: formSlug.trim() || undefined,
      problem_statement: formStatement.trim(),
      difficulty: formDifficulty,
      execution_mode: formExecutionMode,
      function_name: formExecutionMode === 'function' ? formFunctionName.trim() : 'main',
      function_signature: formExecutionMode === 'function' ? {
        parameters: [{ name: formParamName.trim(), type: formParamType.trim() }],
        return_type: formReturnType.trim()
      } : {},
      constraints: formConstraints.trim() || null,
      input_format: formInputFormat.trim() || null,
      output_format: formOutputFormat.trim() || null,
      allowed_languages: formAllowedLanguages,
      test_cases: formTestCases.filter(tc => tc.input_data && tc.expected_output).map((tc, idx) => ({
        ...tc,
        display_order: idx + 1
      }))
    };

    try {
      if (isEditing && selectedProblem?.id) {
        await api.updateCodingProblem(selectedProblem.id, payload);
        toast.success(`Problem updated! Immutable version snapshot created.`);
      } else {
        await api.createCodingProblem(payload);
        toast.success('Custom coding problem authored and added to bank!');
      }
      setIsAuthoringOpen(false);
      loadProblems();
    } catch (err) {
      toast.error(err.message || 'Failed to save problem');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Test Run Sandbox inside Authoring Modal
  const handleRunTestCode = async () => {
    if (!testRunCode.trim()) {
      toast.warning('Please enter some code to test');
      return;
    }
    setIsRunningTest(true);
    setTestRunResult(null);
    try {
      const publicCases = formTestCases.filter(tc => !tc.is_hidden).map((tc, i) => ({
        id: i + 1,
        name: `Sample ${i + 1}`,
        input: tc.input_data,
        expected: tc.expected_output
      }));

      const res = await api.runCodeSandbox({
        language: testRunLang,
        code: testRunCode,
        task_id: selectedProblem?.id || 'authoring-preview',
        execution_mode: formExecutionMode,
        entry_point: formExecutionMode === 'function' ? formFunctionName : 'main',
        function_signature: {
          parameters: [{ name: formParamName, type: formParamType }],
          return_type: formReturnType
        },
        test_cases: publicCases,
        candidate_id: 'recruiter-preview',
        job_id: activeJob?.id
      });
      setTestRunResult(res);
      if (res?.all_passed) {
        toast.success('All public sample cases passed!');
      } else {
        toast.warning('Some test cases failed. Inspect stdout/errors.');
      }
    } catch (err) {
      toast.error(`Execution error: ${err.message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Add / Remove Test Case in Form
  const handleAddTestCaseRow = (isHidden = false) => {
    setFormTestCases(prev => [
      ...prev,
      { input_data: '', expected_output: '', is_hidden: isHidden, weight: isHidden ? 50.0 : 10.0, explanation: '' }
    ]);
  };

  const handleRemoveTestCaseRow = (idx) => {
    setFormTestCases(prev => prev.filter((_, i) => i !== idx));
  };

  // Toggle Attachment of Problem to activeJob
  const handleToggleAttachProblem = (prob) => {
    setAttachedProblems(prev => {
      const exists = prev.some(p => p.coding_problem_id === prob.id);
      if (exists) {
        return prev.filter(p => p.coding_problem_id !== prob.id);
      } else {
        return [
          ...prev,
          {
            coding_problem_id: prob.id,
            title: prob.title,
            slug: prob.slug,
            difficulty: prob.difficulty,
            weight: 100.0,
            display_order: prev.length + 1,
            is_required: true
          }
        ];
      }
    });
  };

  // Save Attached Problems to Database
  const handleSaveAttachments = async () => {
    if (!activeJob?.id) {
      toast.warning('Please select a job requisition first');
      return;
    }
    setIsSavingAttachment(true);
    try {
      await api.attachAssessmentCodingProblems(activeJob.id, attachedProblems);
      toast.success(`Attached ${attachedProblems.length} coding problem(s) to ${activeJob.title}!`);
      if (onAttachProblems) {
        onAttachProblems(attachedProblems);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to attach problems to assessment');
    } finally {
      setIsSavingAttachment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar: Headline & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <span>Advanced Coding Problem Bank & Recruiter Authoring</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Browse verified platform algorithms or author proprietary custom challenges with language-specific function harnesses, public/hidden test cases, and version snapshot guarantees.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="shadow-sm shadow-brand-500/20"
          >
            Author Custom Problem
          </Button>
        </div>
      </div>

      {/* ── Active Job Attachment Strip ── */}
      {activeJob && (
        <div className="p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Target Role:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{activeJob.title}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-500">{attachedProblems.length} Problem(s) Attached to Candidate Assessment</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              icon={isSavingAttachment ? Loader2 : Save}
              onClick={handleSaveAttachments}
              disabled={isSavingAttachment}
            >
              {isSavingAttachment ? 'Saving…' : 'Publish Attached Problems'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Filters & Search ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search problems by title, slug, or keywords…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
          />
        </div>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
        >
          <option value="">All Sources (System + Custom)</option>
          <option value="system">Verified System Bank</option>
          <option value="custom">My Organization's Custom Problems</option>
        </select>

        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
        >
          <option value="">All Modes</option>
          <option value="function">Function Mode</option>
          <option value="stdin">STDIN Mode</option>
        </select>
      </div>

      {/* ── Problem List Cards ── */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          <span className="text-xs">Loading problem catalog…</span>
        </div>
      ) : problems.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs space-y-2">
          <p>No coding problems found matching your filters.</p>
          <Button variant="secondary" size="xs" onClick={() => { setSearchQuery(''); setDifficultyFilter(''); setSourceFilter(''); setModeFilter(''); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((prob) => {
            const isAttached = attachedProblems.some(p => p.coding_problem_id === prob.id);
            const diffClass = DIFFICULTY_COLORS[prob.difficulty] || DIFFICULTY_COLORS.Medium;
            return (
              <div
                key={prob.id}
                className={`p-4 rounded-xl border transition-all ${
                  isAttached
                    ? 'bg-brand-50/20 dark:bg-brand-950/20 border-brand-300 dark:border-brand-800 shadow-xs'
                    : 'bg-[#FDFCFA] dark:bg-[#1A1714] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${diffClass}`}>
                        {prob.difficulty}
                      </span>
                      {prob.is_system ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          System Bank
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Custom v{prob.current_version}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {prob.execution_mode === 'stdin' ? 'STDIN' : `fn: ${prob.function_name}()`}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {prob.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {prob.problem_statement}
                    </p>
                  </div>
                </div>

                {/* Footer specs & actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {prob.total_test_cases || (prob.public_test_cases || []).length} Test Cases
                  </span>

                  <div className="flex items-center gap-2">
                    {!prob.is_system && (
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Edit3}
                        onClick={() => handleOpenEditModal(prob)}
                        title="Edit custom problem"
                      >
                        Edit
                      </Button>
                    )}

                    <Button
                      variant={isAttached ? 'outline' : 'primary'}
                      size="xs"
                      icon={isAttached ? Check : Plus}
                      onClick={() => handleToggleAttachProblem(prob)}
                    >
                      {isAttached ? 'Attached' : 'Attach'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Authoring / Edit Custom Problem Modal ── */}
      {isAuthoringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isEditing ? `Edit Custom Problem: ${selectedProblem?.title}` : 'Author New Custom Coding Problem'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthoringOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProblem} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Problem Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Token Bucket Rate Limiter"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Problem Statement */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Problem Statement & Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the task, requirements, expected complexity, and edge cases…"
                  value={formStatement}
                  onChange={(e) => setFormStatement(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Execution Mode & Function Signature */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-brand-600" />
                      <span>Execution Architecture & Driver Configuration</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Choose FUNCTION mode for LeetCode-style predefined functions or STDIN mode for competitive I/O programs.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="exec_mode"
                        value="function"
                        checked={formExecutionMode === 'function'}
                        onChange={() => setFormExecutionMode('function')}
                        className="text-brand-600"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">FUNCTION Mode</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="exec_mode"
                        value="stdin"
                        checked={formExecutionMode === 'stdin'}
                        onChange={() => setFormExecutionMode('stdin')}
                        className="text-brand-600"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">STDIN Mode</span>
                    </label>
                  </div>
                </div>

                {formExecutionMode === 'function' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Function Entry Point
                      </label>
                      <input
                        type="text"
                        value={formFunctionName}
                        onChange={(e) => setFormFunctionName(e.target.value)}
                        placeholder="solve"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Parameter Name
                      </label>
                      <input
                        type="text"
                        value={formParamName}
                        onChange={(e) => setFormParamName(e.target.value)}
                        placeholder="data"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Parameter Type
                      </label>
                      <input
                        type="text"
                        value={formParamType}
                        onChange={(e) => setFormParamType(e.target.value)}
                        placeholder="int / list[int] / str"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Return Type
                      </label>
                      <input
                        type="text"
                        value={formReturnType}
                        onChange={(e) => setFormReturnType(e.target.value)}
                        placeholder="int / bool / str"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Test Cases Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                      Test Cases ({formTestCases.filter(t => !t.is_hidden).length} Public, {formTestCases.filter(t => t.is_hidden).length} Hidden)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Hidden test cases are used for genuine scoring and are strictly confidential (never leaked to candidate network payloads).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" size="xs" icon={Plus} onClick={() => handleAddTestCaseRow(false)}>
                      Add Public Test
                    </Button>
                    <Button type="button" variant="secondary" size="xs" icon={Plus} onClick={() => handleAddTestCaseRow(true)}>
                      Add Hidden Test
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formTestCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${
                        tc.is_hidden
                          ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                        tc.is_hidden
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                      }`}>
                        {tc.is_hidden ? 'HIDDEN' : 'PUBLIC'} #{idx + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Input Data (e.g. 2\n3 or [1, 2, 3])"
                          value={tc.input_data}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormTestCases(prev => prev.map((item, i) => i === idx ? { ...item, input_data: val } : item));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Expected Output (e.g. 5 or [0, 1])"
                          value={tc.expected_output}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormTestCases(prev => prev.map((item, i) => i === idx ? { ...item, expected_output: val } : item));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          title="Score Weight / Points"
                          placeholder="Weight"
                          value={tc.weight}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1.0;
                            setFormTestCases(prev => prev.map((item, i) => i === idx ? { ...item, weight: val } : item));
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCaseRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Sandbox Code Verification */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs">Verify Solution with Sandbox Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={testRunLang}
                      onChange={(e) => setTestRunLang(e.target.value)}
                      className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                    </select>
                    <Button
                      type="button"
                      variant="primary"
                      size="xs"
                      icon={isRunningTest ? Loader2 : Play}
                      onClick={handleRunTestCode}
                      disabled={isRunningTest}
                    >
                      {isRunningTest ? 'Running…' : 'Run Solution'}
                    </Button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={testRunCode}
                  onChange={(e) => setTestRunCode(e.target.value)}
                  placeholder="Enter reference solution code to test driver execution against public cases…"
                  className="w-full p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 focus:outline-none"
                />

                {testRunResult && (
                  <div className={`p-3 rounded-lg border text-xs font-mono ${
                    testRunResult.all_passed
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span>Status: {testRunResult.all_passed ? 'ALL PASSED' : 'TESTS FAILED'}</span>
                      <span>Passed: {testRunResult.passed_count}/{testRunResult.total_count}</span>
                    </div>
                    {testRunResult.console_output && (
                      <pre className="text-[10px] text-slate-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {testRunResult.console_output}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsAuthoringOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={Save} disabled={isSubmittingForm}>
                  {isSubmittingForm ? 'Saving Snapshot…' : (isEditing ? 'Save & Create Version Snapshot' : 'Create Problem')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
