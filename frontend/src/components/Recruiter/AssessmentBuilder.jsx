import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Layers, Plus, Trash2, CheckCircle2, AlertTriangle, Eye, ArrowUp, ArrowDown,
  Clock, Award, RefreshCw, Save, ShieldCheck, Check, Info, FileText, Code2,
  ChevronDown, ChevronUp, Lock, Globe, Shuffle, Sliders, ExternalLink, Briefcase
} from 'lucide-react';
import { Button, Badge, CustomDropdown } from '../ui/Primitives';
import { useToast } from '../ui/Toast';
import { useRecruitment } from '../../context/RecruitmentContext';
import api from '../../services/api';

export default function AssessmentBuilder({ activeJobId: propJobId, onAssessmentPublished }) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs = [], activeJob, setActiveJobId } = useRecruitment();

  const urlJobId = searchParams.get('job_id');
  const [selectedJobId, setSelectedJobId] = useState(
    () => propJobId || urlJobId || activeJob?.id || (jobs[0]?.id || '')
  );

  useEffect(() => {
    if (propJobId && propJobId !== selectedJobId) {
      setSelectedJobId(propJobId);
    } else if (urlJobId && urlJobId !== selectedJobId) {
      setSelectedJobId(urlJobId);
    } else if (!selectedJobId && (activeJob?.id || jobs[0]?.id)) {
      setSelectedJobId(activeJob?.id || jobs[0]?.id);
    }
  }, [propJobId, urlJobId, activeJob?.id, jobs]);

  const currentJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId) || activeJob || jobs[0] || null;
  }, [jobs, selectedJobId, activeJob]);

  // Dynamic Domain Detection & Required Skills
  const jobDomain = useMemo(() => {
    if (!currentJob) return 'technical';
    const text = `${currentJob.title || ''} ${currentJob.department || ''} ${(currentJob.required_skills || []).join(' ')}`.toLowerCase();
    if (/finance|tax|audit|accounting|controller|gaap|ifrs|compliance|cpa|treasury/i.test(text)) return 'finance';
    if (/aws|cloud|devops|kubernetes|docker|terraform|sre/i.test(text)) return 'cloud';
    if (/react|frontend|ui|ux|web/i.test(text)) return 'frontend';
    return 'technical';
  }, [currentJob]);

  const jobRequiredSkills = useMemo(() => {
    return (currentJob?.required_skills || []).map(s => String(s).toLowerCase());
  }, [currentJob]);

  const jobOptions = useMemo(() => {
    return jobs.map(j => ({
      value: j.id,
      label: j.title,
      badge: j.department || undefined
    }));
  }, [jobs]);

  const handleJobChange = (jobId) => {
    setSelectedJobId(jobId);
    if (setActiveJobId) setActiveJobId(jobId);
    setSearchParams({ job_id: jobId });
  };

  // State
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [activeBuilderView, setActiveBuilderView] = useState('questions'); // 'questions' | 'settings'

  // Question bank state
  const [questionBank, setQuestionBank] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankFilter, setBankFilter] = useState({
    type: 'all',
    difficulty: 'all',
    category: 'all',
    search: '',
  });

  // Modals & Panels
  const [showAutoSelectModal, setShowAutoSelectModal] = useState(false);
  const [autoSelectRules, setAutoSelectRules] = useState({
    mcqCount: 5,
    codingCount: 1,
    difficulty: 'Medium',
    category: 'technical',
    skill: '',
    clearExisting: false,
  });
  const [autoSelectError, setAutoSelectError] = useState('');

  // Automatically calibrate repository category filter and auto-select defaults on role change
  useEffect(() => {
    if (jobDomain === 'finance') {
      setBankFilter(prev => ({ ...prev, category: 'finance', type: 'mcq' }));
      setAutoSelectRules(prev => ({
        ...prev,
        category: 'finance',
        mcqCount: 5,
        codingCount: 0,
        skill: currentJob?.required_skills?.[0] || 'Tax Audit',
      }));
    } else {
      setBankFilter(prev => ({ ...prev, category: 'all', type: 'all' }));
      setAutoSelectRules(prev => ({
        ...prev,
        category: 'technical',
        mcqCount: 5,
        codingCount: 1,
        skill: currentJob?.required_skills?.[0] || '',
      }));
    }
  }, [selectedJobId, jobDomain, currentJob]);

  // Prioritize questions matching active role domain & skills to the top
  const prioritizedQuestionBank = useMemo(() => {
    if (!questionBank || questionBank.length === 0) return [];
    
    return [...questionBank].sort((a, b) => {
      const aDomain = a.category?.toLowerCase() === jobDomain;
      const bDomain = b.category?.toLowerCase() === jobDomain;
      
      const aSkill = (a.skills || []).some(s => 
        jobRequiredSkills.some(js => s.toLowerCase().includes(js) || js.includes(s.toLowerCase()))
      );
      const bSkill = (b.skills || []).some(s => 
        jobRequiredSkills.some(js => s.toLowerCase().includes(js) || js.includes(s.toLowerCase()))
      );
      
      const aScore = (aDomain ? 10 : 0) + (aSkill ? 5 : 0);
      const bScore = (bDomain ? 10 : 0) + (bSkill ? 5 : 0);
      
      return bScore - aScore;
    });
  }, [questionBank, jobDomain, jobRequiredSkills]);

  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [newQuestionType, setNewQuestionType] = useState('mcq');
  const [newQuestionForm, setNewQuestionForm] = useState({
    title: '',
    question_text: '',
    difficulty: 'Medium',
    category: 'technical',
    explanation: '',
    skills: '',
    options: [
      { option_key: 'A', option_text: '', is_correct: true },
      { option_key: 'B', option_text: '', is_correct: false },
      { option_key: 'C', option_text: '', is_correct: false },
      { option_key: 'D', option_text: '', is_correct: false },
    ],
    // Coding fields
    execution_mode: 'function',
    function_name: 'solve',
    allowed_languages: ['python', 'javascript'],
    test_input: '[1, 2]',
    test_expected: '3',
    is_hidden: false,
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewAsCandidate, setPreviewAsCandidate] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    duration_minutes: 45,
    passing_score: 70,
    max_attempts: 1,
    deadline_days: 7,
    randomize_questions: false,
    allow_review: true,
    allow_unanswered: true,
    allow_resume: true,
  });

  // Load assessment for job
  const loadAssessment = useCallback(async () => {
    if (!selectedJobId) return;
    setLoading(true);
    try {
      const list = await api.listBuilderAssessments(selectedJobId);
      if (list && list.length > 0) {
        // Fetch full details of the active/latest assessment
        const detailed = await api.getBuilderAssessment(list[0].id);
        setAssessment(detailed);
        setSettingsForm({
          title: detailed.title || '',
          description: detailed.description || '',
          duration_minutes: detailed.duration_minutes || 45,
          passing_score: detailed.passing_score || 70,
          max_attempts: detailed.max_attempts || 1,
          deadline_days: detailed.deadline_days || 7,
          randomize_questions: !!detailed.randomize_questions,
          allow_review: detailed.allow_review !== false,
          allow_unanswered: detailed.allow_unanswered !== false,
          allow_resume: detailed.allow_resume !== false,
        });
      } else {
        setAssessment(null);
      }
    } catch (err) {
      console.error('Failed to load assessment:', err);
      toast.error('Failed to load assessment configuration');
    } finally {
      setLoading(false);
    }
  }, [selectedJobId, toast]);

  // Load question bank
  const loadQuestionBank = useCallback(async () => {
    setBankLoading(true);
    try {
      const params = {};
      if (bankFilter.type !== 'all') params.question_type = bankFilter.type;
      if (bankFilter.difficulty !== 'all') params.difficulty = bankFilter.difficulty;
      if (bankFilter.category !== 'all') params.category = bankFilter.category;
      if (bankFilter.search) params.search = bankFilter.search;

      const questions = await api.listUnifiedQuestions(params);
      setQuestionBank(questions || []);
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setBankLoading(false);
    }
  }, [bankFilter]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  useEffect(() => {
    loadQuestionBank();
  }, [loadQuestionBank]);

  // Create new assessment
  const handleCreateAssessment = async () => {
    if (!selectedJobId) {
      toast.error('Please select an active job requisition first.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        job_id: selectedJobId,
        title: settingsForm.title || `${currentJob?.title || 'Role'} Assessment`,
        description: settingsForm.description || `Assessment for ${currentJob?.title || 'this role'}`,
        duration_minutes: settingsForm.duration_minutes || 45,
        passing_score: settingsForm.passing_score || 70,
        max_attempts: settingsForm.max_attempts || 1,
        deadline_days: settingsForm.deadline_days || 7,
        randomize_questions: settingsForm.randomize_questions,
        allow_review: settingsForm.allow_review,
        allow_unanswered: settingsForm.allow_unanswered,
        allow_resume: settingsForm.allow_resume,
      };
      const created = await api.createBuilderAssessment(payload);
      setAssessment(created);
      toast.success('Draft assessment created successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to create assessment.');
    } finally {
      setSaving(false);
    }
  };

  // Save assessment settings
  const handleSaveSettings = async () => {
    if (!assessment) return;
    setSaving(true);
    try {
      const updated = await api.updateBuilderAssessment(assessment.id, settingsForm);
      setAssessment(updated);
      toast.success('Assessment settings saved.');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Attach question from bank
  const handleAttachQuestion = async (q) => {
    if (!assessment) return;
    try {
      const payload = {
        question_type: q.question_type,
        question_id: q.id,
        weight: q.question_type === 'coding' ? 100.0 : 1.0,
        is_required: true,
      };
      const updated = await api.attachBuilderQuestion(assessment.id, payload);
      setAssessment(updated);
      toast.success(`Attached ${q.question_type.toUpperCase()} question to assessment.`);
    } catch (err) {
      toast.error(err.message || 'Failed to attach question.');
    }
  };

  // Remove question
  const handleRemoveQuestion = async (qType, qId) => {
    if (!assessment) return;
    try {
      const updated = await api.removeBuilderQuestion(assessment.id, qType, qId);
      setAssessment(updated);
      toast.success('Question removed from assessment.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove question.');
    }
  };

  // Move Question Up / Down
  const handleMoveQuestion = async (index, direction) => {
    if (!assessment || !assessment.questions) return;
    const questions = [...assessment.questions];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Swap display orders
    const temp = questions[index];
    questions[index] = questions[targetIndex];
    questions[targetIndex] = temp;

    const items = questions.map((q, idx) => ({
      question_type: q.question_type,
      question_id: q.question_id,
      display_order: idx + 1,
      weight: q.weight,
    }));

    try {
      const updated = await api.reorderBuilderQuestions(assessment.id, items);
      setAssessment(updated);
    } catch (err) {
      toast.error('Failed to update question order.');
    }
  };

  // Update Question Weight
  const handleUpdateWeight = async (q, newWeight) => {
    if (!assessment || isNaN(newWeight) || newWeight <= 0) return;
    const items = assessment.questions.map((item) => ({
      question_type: item.question_type,
      question_id: item.question_id,
      display_order: item.display_order,
      weight: item.question_id === q.question_id ? parseFloat(newWeight) : item.weight,
    }));
    try {
      const updated = await api.reorderBuilderQuestions(assessment.id, items);
      setAssessment(updated);
    } catch (err) {
      toast.error('Failed to update question weight.');
    }
  };

  // Validate assessment
  const handleValidate = async () => {
    if (!assessment) return;
    setValidating(true);
    try {
      const res = await api.validateBuilderAssessment(assessment.id);
      setValidationResult(res);
      if (res.is_valid) {
        toast.success('Assessment configuration passed all validation checks.');
      } else {
        toast.error(`Validation found ${res.errors.length} issue(s).`);
      }
    } catch (err) {
      toast.error(err.message || 'Validation request failed.');
    } finally {
      setValidating(false);
    }
  };

  // Publish assessment
  const handlePublish = async () => {
    if (!assessment) return;
    setPublishing(true);
    try {
      const published = await api.publishBuilderAssessment(assessment.id);
      setAssessment(published);
      toast.success(`Assessment published successfully! Frozen snapshot version ${published.version} generated.`);
      setValidationResult(null);
      if (onAssessmentPublished) onAssessmentPublished(published);
    } catch (err) {
      toast.error(err.message || 'Failed to publish assessment.');
    } finally {
      setPublishing(false);
    }
  };

  // Archive assessment
  const handleArchive = async () => {
    if (!assessment) return;
    if (!window.confirm('Are you sure you want to archive this assessment? No new candidates can be assigned.')) return;
    try {
      const archived = await api.archiveBuilderAssessment(assessment.id);
      setAssessment(archived);
      toast.info('Assessment archived.');
    } catch (err) {
      toast.error(err.message || 'Failed to archive assessment.');
    }
  };

  // Run Rule-Based Auto-Selection
  const handleExecuteAutoSelect = async () => {
    if (!assessment) return;
    setAutoSelectError('');
    try {
      const rules = [];
      if (autoSelectRules.mcqCount > 0) {
        rules.push({
          question_type: 'mcq',
          difficulty: autoSelectRules.difficulty !== 'all' ? autoSelectRules.difficulty : null,
          category: autoSelectRules.category !== 'all' ? autoSelectRules.category : null,
          skill_slug: autoSelectRules.skill.trim() || null,
          count: parseInt(autoSelectRules.mcqCount, 10),
          weight: 1.0,
        });
      }
      if (autoSelectRules.codingCount > 0) {
        rules.push({
          question_type: 'coding',
          difficulty: autoSelectRules.difficulty !== 'all' ? autoSelectRules.difficulty : null,
          skill_slug: autoSelectRules.skill.trim() || null,
          count: parseInt(autoSelectRules.codingCount, 10),
          weight: 100.0,
        });
      }

      const payload = {
        rules,
        clear_existing: autoSelectRules.clearExisting,
      };

      const updated = await api.autoSelectBuilderQuestions(assessment.id, payload);
      setAssessment(updated);
      setShowAutoSelectModal(false);
      toast.success('Questions auto-selected successfully from authoritative question bank.');
    } catch (err) {
      setAutoSelectError(err.message || 'Insufficient questions in question bank matching criteria.');
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (asCandidate = false) => {
    if (!assessment) return;
    setPreviewLoading(true);
    setPreviewAsCandidate(asCandidate);
    setShowPreviewModal(true);
    try {
      const data = await api.previewBuilderAssessment(assessment.id, asCandidate);
      setPreviewData(data);
    } catch (err) {
      toast.error('Failed to load assessment preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Author new question submit
  const handleCreateNewQuestion = async () => {
    try {
      const skillsArray = newQuestionForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let payload = {};
      if (newQuestionType === 'mcq') {
        if (!newQuestionForm.question_text.trim()) {
          toast.error('Question text is required.');
          return;
        }
        const validOptions = newQuestionForm.options.filter((o) => o.option_text.trim());
        if (validOptions.length < 2) {
          toast.error('MCQ requires at least 2 non-empty options.');
          return;
        }
        const hasCorrect = validOptions.some((o) => o.is_correct);
        if (!hasCorrect) {
          toast.error('Please select exactly one correct option.');
          return;
        }
        payload = {
          question_type: 'mcq',
          title: newQuestionForm.question_text.slice(0, 60),
          question_text: newQuestionForm.question_text,
          category: newQuestionForm.category,
          difficulty: newQuestionForm.difficulty,
          explanation: newQuestionForm.explanation,
          skills: skillsArray,
          options: validOptions.map((o, idx) => ({
            option_key: o.option_key,
            option_text: o.option_text,
            is_correct: o.is_correct,
            display_order: idx + 1,
          })),
        };
      } else {
        if (!newQuestionForm.title.trim() || !newQuestionForm.question_text.trim()) {
          toast.error('Title and problem statement are required.');
          return;
        }
        payload = {
          question_type: 'coding',
          title: newQuestionForm.title,
          question_text: newQuestionForm.question_text,
          difficulty: newQuestionForm.difficulty,
          execution_mode: newQuestionForm.execution_mode,
          function_name: newQuestionForm.function_name,
          allowed_languages: newQuestionForm.allowed_languages,
          skills: skillsArray,
          test_cases: [
            {
              input_data: newQuestionForm.test_input,
              expected_output: newQuestionForm.test_expected,
              is_hidden: newQuestionForm.is_hidden,
              weight: 1.0,
              display_order: 1,
            },
          ],
        };
      }

      const created = await api.createUnifiedQuestion(payload);
      toast.success('New question created in repository.');

      // Automatically attach to current assessment if available
      if (assessment) {
        await api.attachBuilderQuestion(assessment.id, {
          question_type: created.question_type,
          question_id: created.id,
          weight: created.question_type === 'coding' ? 100.0 : 1.0,
          is_required: true,
        });
        await loadAssessment();
      }

      await loadQuestionBank();
      setShowAuthorModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to author question.');
    }
  };

  // Attached question ID set for easy lookup
  const attachedQuestionIds = useMemo(() => {
    if (!assessment || !assessment.questions) return new Set();
    return new Set(assessment.questions.map((q) => q.question_id));
  }, [assessment]);

  if (loading) {
    return (
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-2" />
        <p className="text-sm">Loading assessment builder...</p>
      </div>
    );
  }

  // Blank slate: No assessment exists for job
  if (!assessment) {
    return (
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4 animate-fade-in">
        {/* Top Control Bar with Requisition Selector */}
        <div className="bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1.5 w-fit mb-1">
                <Layers className="w-3 h-3" />
                Assessment Builder Studio
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Assessment Authoring & Configuration
              </h1>
              {currentJob && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Requisition: <strong className="text-slate-700 dark:text-slate-300">{currentJob.title}</strong>
                </p>
              )}
            </div>

            {jobs.length > 0 && (
              <CustomDropdown
                value={selectedJobId}
                onChange={handleJobChange}
                options={jobOptions}
                icon={Briefcase}
                menuWidth="w-72"
                align="right"
                title="Select Job Requisition"
                className="w-full sm:w-64"
              />
            )}
          </div>
        </div>

        {/* Blank Slate Card */}
        <div className="bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-2xl mx-auto my-8 shadow-card">
          <div className="w-14 h-14 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/20">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Initialize Assessment for {currentJob?.title || 'Requisition'}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            No assessment currently exists for this job opening. Create a production-grade, multi-category assessment
            with relational skill associations, sandbox execution, and frozen version snapshots.
          </p>
          <div className="space-y-4 max-w-md mx-auto text-left mb-6 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Assessment Title</label>
              <input 
                type="text" 
                className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                placeholder="e.g. Senior Backend Technical Evaluation"
                value={settingsForm.title}
                onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Time Limit (mins)</label>
                <input 
                  type="number" 
                  className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  value={settingsForm.duration_minutes}
                  onChange={(e) => setSettingsForm({ ...settingsForm, duration_minutes: parseInt(e.target.value, 10) || 45 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Passing Score (%)</label>
                <input 
                  type="number" 
                  className="w-full text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  value={settingsForm.passing_score}
                  onChange={(e) => setSettingsForm({ ...settingsForm, passing_score: parseInt(e.target.value, 10) || 70 })}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleCreateAssessment} loading={saving} icon={Plus} variant="primary">
            Initialize Draft Assessment
          </Button>
        </div>
      </div>
    );
  }

  const isDraft = assessment.status === 'draft';
  const isPublished = assessment.status === 'published';
  const isArchived = assessment.status === 'archived';

  return (
    <div className="w-full h-full flex flex-col p-3 sm:p-4 gap-3 min-w-0 overflow-hidden">
      {/* ─── Top Control Bar & Requisition Switcher ─── */}
      <div className="bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-card shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                Assessment Builder Studio
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Badge 
                variant={isPublished ? 'success' : isDraft ? 'warning' : 'neutral'}
                className="uppercase tracking-wider font-semibold text-[10px]"
              >
                {assessment.status} (v{assessment.version})
              </Badge>
              {assessment.published_at && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Published {new Date(assessment.published_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {assessment.title}
              </h1>
              {currentJob && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                  for <strong className="text-slate-700 dark:text-slate-300">{currentJob.title}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            {jobs.length > 0 && (
              <CustomDropdown
                value={selectedJobId}
                onChange={handleJobChange}
                options={jobOptions}
                icon={Briefcase}
                menuWidth="w-72"
                align="right"
                title="Select Job Requisition"
                className="w-48 sm:w-60"
              />
            )}

            <Button 
              variant="outline" 
              size="sm" 
              icon={Eye} 
              onClick={() => handleOpenPreview(false)}
              title="Recruiter preview with answer keys"
            >
              <span className="hidden sm:inline">Preview</span> Recruiter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon={Lock} 
              onClick={() => handleOpenPreview(true)}
              title="Candidate preview (sanitized, zero leaks)"
            >
              <span className="hidden sm:inline">Preview</span> Candidate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon={ShieldCheck} 
              onClick={handleValidate} 
              loading={validating}
              title="Run publish validation guardrails"
            >
              Validate
            </Button>
            {isDraft && (
              <Button 
                variant="primary" 
                size="sm" 
                icon={CheckCircle2} 
                onClick={handlePublish} 
                loading={publishing}
              >
                Publish Version
              </Button>
            )}
            {isPublished && (
              <Button 
                variant="outline" 
                size="sm" 
                icon={Trash2} 
                onClick={handleArchive}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
              >
                Archive
              </Button>
            )}
          </div>
        </div>

        {/* Sub-bar with View switcher & Compact stats strip */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* View Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setActiveBuilderView('questions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeBuilderView === 'questions'
                  ? 'bg-white dark:bg-[#25201C] text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Questions & Question Pool ({assessment.questions?.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBuilderView('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeBuilderView === 'settings'
                  ? 'bg-white dark:bg-[#25201C] text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Parameters & Guardrails</span>
            </button>
          </div>

          {/* Compact Metric Ribbon */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{assessment.total_questions}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 flex items-center gap-1.5">
              <span className="text-blue-700 dark:text-blue-300">MCQs:</span>
              <span className="font-bold text-blue-900 dark:text-blue-100 font-mono">{assessment.total_mcqs}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50 flex items-center gap-1.5">
              <span className="text-purple-700 dark:text-purple-300">Coding:</span>
              <span className="font-bold text-purple-900 dark:text-purple-100 font-mono">{assessment.total_coding}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 flex items-center gap-1.5">
              <span className="text-emerald-700 dark:text-emerald-300">Points:</span>
              <span className="font-bold text-emerald-900 dark:text-emerald-100 font-mono">{assessment.total_points} pts</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1.5">
              <span className="text-amber-700 dark:text-amber-300">Target:</span>
              <span className="font-bold text-amber-900 dark:text-amber-100 font-mono">{assessment.passing_score}%</span>
            </div>
          </div>
        </div>

        {/* Validation Result Banner (if run) */}
        {validationResult && (
          <div className={`mt-3 p-3.5 rounded-xl border ${
            validationResult.is_valid 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200' 
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-900 dark:text-rose-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {validationResult.is_valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <h4 className="font-bold">
                  {validationResult.is_valid ? 'Assessment is valid and ready to publish' : 'Assessment has validation errors'}
                </h4>
                {validationResult.errors?.length > 0 && (
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-rose-800 dark:text-rose-300">
                    {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                )}
                {validationResult.warnings?.length > 0 && (
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-amber-800 dark:text-amber-300">
                    {validationResult.warnings.map((warn, i) => <li key={i}>Notice: {warn}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── TAB 1: Questions & Pool View (Zero Main Scroll, Dual Independent Panes) ─── */}
      {activeBuilderView === 'questions' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Left Column: Configured Questions in Assessment (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-0 bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-card">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>Assessment Questions ({assessment.questions?.length || 0})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ordered sequence of questions candidate will face</p>
              </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    icon={Shuffle}
                    onClick={() => setShowAutoSelectModal(true)}
                    disabled={!isDraft}
                  >
                    Auto-Select
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    icon={Plus}
                    onClick={() => setShowAuthorModal(true)}
                    disabled={!isDraft}
                  >
                    New Question
                  </Button>
                </div>
              </div>

              {/* Questions List (Scrollable Interior) */}
              {(!assessment.questions || assessment.questions.length === 0) ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 flex flex-col items-center justify-center flex-1">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No questions configured yet</p>
                  <p className="text-xs mt-1 text-slate-400 max-w-xs">Select questions from the repository on the right or use rule-based Auto-Select.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                  {assessment.questions.map((q, idx) => (
                    <div 
                      key={q.id || idx} 
                      className="p-3.5 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start justify-between gap-3 transition-colors shadow-2xs"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 items-center pt-0.5 shrink-0">
                          <button 
                            onClick={() => handleMoveQuestion(idx, -1)}
                            disabled={idx === 0 || !isDraft}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-400 font-mono">{idx + 1}</span>
                          <button 
                            onClick={() => handleMoveQuestion(idx, 1)}
                            disabled={idx === assessment.questions.length - 1 || !isDraft}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {q.question_type === 'mcq' ? (
                              <Badge variant="info" className="text-[10px] font-bold uppercase tracking-wider">
                                <FileText className="w-3 h-3 mr-1 inline" /> MCQ
                              </Badge>
                            ) : (
                              <Badge variant="purple" className="text-[10px] font-bold uppercase tracking-wider">
                                <Code2 className="w-3 h-3 mr-1 inline" /> Coding
                              </Badge>
                            )}
                            <Badge variant="neutral" className="text-[10px]">
                              {q.difficulty}
                            </Badge>
                            {q.category && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                                {q.category}
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                            {q.title}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            {q.options_count !== null && (
                              <span>{q.options_count} Options</span>
                            )}
                            {q.test_cases_count !== null && (
                              <span>{q.test_cases_count} Test Cases</span>
                            )}
                            {q.skills?.length > 0 && (
                              <span>Skills: {q.skills.slice(0, 3).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Weight input & Remove button */}
                      <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
                          <span>Pts:</span>
                          <input 
                            type="number"
                            className="w-12 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0"
                            defaultValue={q.weight}
                            onBlur={(e) => handleUpdateWeight(q, e.target.value)}
                            disabled={!isDraft}
                          />
                        </div>
                        {isDraft && (
                          <button 
                            onClick={() => handleRemoveQuestion(q.question_type, q.question_id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Right Column: Question Bank Browser (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0 bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-card">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Question Repository</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Relational MCQ & Hands-on Coding Pool</p>
                </div>
                <Badge variant="neutral">{questionBank.length} available</Badge>
              </div>

              {/* Filter Controls with Fancy CustomDropdown */}
              <div className="space-y-2 mb-3 shrink-0">
                <input 
                  type="text" 
                  placeholder="Search questions or skills..." 
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  value={bankFilter.search}
                  onChange={(e) => setBankFilter({ ...bankFilter, search: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <CustomDropdown
                    value={bankFilter.type}
                    onChange={(val) => setBankFilter({ ...bankFilter, type: val })}
                    options={[
                      { value: 'all', label: 'All Types' },
                      { value: 'mcq', label: 'MCQs' },
                      { value: 'coding', label: 'Coding' }
                    ]}
                    className="text-xs w-full"
                    menuWidth="w-36"
                  />
                  <CustomDropdown
                    value={bankFilter.difficulty}
                    onChange={(val) => setBankFilter({ ...bankFilter, difficulty: val })}
                    options={[
                      { value: 'all', label: 'All Difficulties' },
                      { value: 'Easy', label: 'Easy' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Hard', label: 'Hard' }
                    ]}
                    className="text-xs w-full"
                    menuWidth="w-36"
                  />
                  <CustomDropdown
                    value={bankFilter.category}
                    onChange={(val) => setBankFilter({ ...bankFilter, category: val })}
                    options={[
                      { value: 'all', label: 'All Categories' },
                      { value: 'finance', label: 'Finance & Audit' },
                      { value: 'technical', label: 'Technical & Engineering' },
                      { value: 'scenario', label: 'Architecture & Scenario' },
                      { value: 'troubleshooting', label: 'Troubleshooting' }
                    ]}
                    className="text-xs w-full"
                    menuWidth="w-44"
                  />
                </div>
              </div>

              {/* Questions Bank List */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
                {bankLoading ? (
                  <div className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-slate-400" />
                    <span className="text-xs">Loading questions...</span>
                  </div>
                ) : prioritizedQuestionBank.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    No questions match your current filter.
                  </div>
                ) : (
                  prioritizedQuestionBank.map((q) => {
                    const isAdded = attachedQuestionIds.has(q.id);
                    const isDomainMatch = q.category?.toLowerCase() === jobDomain;
                    const isSkillMatch = (q.skills || []).some(s => 
                      jobRequiredSkills.some(js => s.toLowerCase().includes(js) || js.includes(s.toLowerCase()))
                    );
                    const isRoleRecommended = isDomainMatch || isSkillMatch;

                    return (
                      <div 
                        key={q.id} 
                        className={`p-3 rounded-xl border text-xs transition-colors shadow-2xs ${
                          isAdded 
                            ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70' 
                            : isRoleRecommended
                              ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border-amber-500/30 hover:border-amber-500/60'
                              : 'bg-white dark:bg-[#1A1714] border-slate-200 dark:border-slate-800 hover:border-brand-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                              q.question_type === 'mcq' ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                            }`}>
                              {q.question_type}
                            </span>
                            <span className="text-slate-400 text-[10px]">•</span>
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{q.difficulty}</span>
                            {isRoleRecommended && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                ★ Role Match
                              </span>
                            )}
                          </div>
                          {isAdded ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <Check className="w-3.5 h-3.5" /> Added
                            </span>
                          ) : (
                            <Button 
                              size="sm" 
                              variant={isRoleRecommended ? 'primary' : 'outline'}
                              onClick={() => handleAttachQuestion(q)}
                              disabled={!isDraft}
                              className="h-6 text-[11px] px-2.5"
                            >
                              Add
                            </Button>
                          )}
                        </div>

                        <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mt-1">
                          {q.title || q.question_text}
                        </p>

                        {q.skills?.length > 0 && (
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            {q.skills.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

        </div>
      )}

      {/* ─── TAB 2: Parameters & Security Guardrails View (Zero Scroll) ────────── */}
      {activeBuilderView === 'settings' && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
          <div className="bg-white dark:bg-[#1A1714] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <span>Assessment Parameters & Security Guardrails</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure evaluation constraints, scoring thresholds, attempt limits, and anti-cheat policies.
                </p>
              </div>
              {isDraft && (
                <Button size="sm" variant="primary" icon={Save} onClick={handleSaveSettings} loading={saving}>
                  Save Settings
                </Button>
              )}
            </div>

            {/* Thresholds Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Time Limit (Minutes)</span>
                </div>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-brand-500"
                  value={settingsForm.duration_minutes}
                  onChange={(e) => setSettingsForm({ ...settingsForm, duration_minutes: parseInt(e.target.value, 10) || 45 })}
                  disabled={!isDraft}
                />
                <span className="text-[11px] text-slate-400 block">Candidate total test session duration</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Passing Score (%)</span>
                </div>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-brand-500"
                  value={settingsForm.passing_score}
                  onChange={(e) => setSettingsForm({ ...settingsForm, passing_score: parseInt(e.target.value, 10) || 70 })}
                  disabled={!isDraft}
                />
                <span className="text-[11px] text-slate-400 block">Minimum threshold to satisfy requirement</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Max Attempts</span>
                </div>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-brand-500"
                  value={settingsForm.max_attempts}
                  onChange={(e) => setSettingsForm({ ...settingsForm, max_attempts: parseInt(e.target.value, 10) || 1 })}
                  disabled={!isDraft}
                />
                <span className="text-[11px] text-slate-400 block">Number of allowed submission attempts</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  <span>Deadline Window (Days)</span>
                </div>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-brand-500"
                  value={settingsForm.deadline_days}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deadline_days: parseInt(e.target.value, 10) || 7 })}
                  disabled={!isDraft}
                />
                <span className="text-[11px] text-slate-400 block">Invitation expiry validity duration</span>
              </div>
            </div>

            {/* Policy & Security Toggles (Interactive Sleek Cards) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">
                Evaluation Policies & Proctor Guardrails
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Policy 1: Randomize */}
                <div 
                  onClick={() => isDraft && setSettingsForm(prev => ({ ...prev, randomize_questions: !prev.randomize_questions }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    settingsForm.randomize_questions
                      ? 'border-brand-500/60 bg-brand-50/50 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Randomize Question Order
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Shuffles question sequence per candidate session to minimize collusion and cheating.
                    </p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                    settingsForm.randomize_questions ? 'bg-brand-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                {/* Policy 2: Allow Review */}
                <div 
                  onClick={() => isDraft && setSettingsForm(prev => ({ ...prev, allow_review: !prev.allow_review }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    settingsForm.allow_review
                      ? 'border-brand-500/60 bg-brand-50/50 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Allow Candidate Review
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Permits candidates to inspect, flag, and edit answers prior to final assessment lock-in.
                    </p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                    settingsForm.allow_review ? 'bg-brand-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                {/* Policy 3: Allow Unanswered */}
                <div 
                  onClick={() => isDraft && setSettingsForm(prev => ({ ...prev, allow_unanswered: !prev.allow_unanswered }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    settingsForm.allow_unanswered
                      ? 'border-brand-500/60 bg-brand-50/50 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Allow Unanswered Submissions
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enables final submission even if candidates left difficult or optional questions blank.
                    </p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                    settingsForm.allow_unanswered ? 'bg-brand-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                {/* Policy 4: Allow Resume */}
                <div 
                  onClick={() => isDraft && setSettingsForm(prev => ({ ...prev, allow_resume: !prev.allow_resume }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    settingsForm.allow_resume
                      ? 'border-brand-500/60 bg-brand-50/50 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      Allow Session Resuming
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Permits recovering from network disconnections within the allocated timer window.
                    </p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 shrink-0 ${
                    settingsForm.allow_resume ? 'bg-brand-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Auto-Select Modal ──────────────────────────────────────────────── */}
      {showAutoSelectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-brand-600" />
                <span>Rule-Based Question Auto-Selection</span>
              </h3>
              <button 
                onClick={() => setShowAutoSelectModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Query genuine database questions matching your desired distribution. If the repository lacks
              sufficient questions, the system alerts you without generating artificial placeholder items.
            </p>

            {autoSelectError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-300 text-xs">
                {autoSelectError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of MCQs</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                    value={autoSelectRules.mcqCount}
                    onChange={(e) => setAutoSelectRules({ ...autoSelectRules, mcqCount: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Coding Problems</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-brand-500"
                    value={autoSelectRules.codingCount}
                    onChange={(e) => setAutoSelectRules({ ...autoSelectRules, codingCount: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Category</label>
                <CustomDropdown
                  value={autoSelectRules.category}
                  onChange={(val) => {
                    const isFin = val === 'finance';
                    setAutoSelectRules(prev => ({
                      ...prev,
                      category: val,
                      codingCount: isFin ? 0 : (prev.codingCount === 0 ? 1 : prev.codingCount),
                      mcqCount: isFin && prev.mcqCount === 0 ? 5 : prev.mcqCount,
                      skill: isFin ? (currentJob?.required_skills?.[0] || 'Tax Audit') : prev.skill
                    }));
                  }}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'finance', label: 'Finance & Audit' },
                    { value: 'technical', label: 'Technical & Engineering' },
                    { value: 'scenario', label: 'Architecture & Scenario' },
                    { value: 'troubleshooting', label: 'Troubleshooting' }
                  ]}
                  className="w-full text-xs"
                  menuWidth="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Difficulty</label>
                <CustomDropdown
                  value={autoSelectRules.difficulty}
                  onChange={(val) => setAutoSelectRules({ ...autoSelectRules, difficulty: val })}
                  options={[
                    { value: 'all', label: 'Any Difficulty' },
                    { value: 'Easy', label: 'Easy' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'Hard', label: 'Hard' }
                  ]}
                  className="w-full text-xs"
                  menuWidth="w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Skill Filter (Optional)</label>
                <input 
                  type="text" 
                  placeholder={autoSelectRules.category === 'finance' ? "e.g. Tax Audit or GAAP" : "e.g. python or docker"}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono text-xs"
                  value={autoSelectRules.skill}
                  onChange={(e) => setAutoSelectRules({ ...autoSelectRules, skill: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2 pt-1 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={autoSelectRules.clearExisting}
                  onChange={(e) => setAutoSelectRules({ ...autoSelectRules, clearExisting: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                Replace current assessment questions
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setShowAutoSelectModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleExecuteAutoSelect}>
                Execute Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Author New Question Modal ──────────────────────────────────────── */}
      {showAuthorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-600" />
                <span>Author Authoritative Question</span>
              </h3>
              <button onClick={() => setShowAuthorModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setNewQuestionType('mcq')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  newQuestionType === 'mcq' 
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Technical MCQ / Scenario
              </button>
              <button 
                type="button"
                onClick={() => setNewQuestionType('coding')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  newQuestionType === 'coding' 
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-700 text-purple-700 dark:text-purple-300' 
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Hands-on Coding Problem
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {newQuestionType === 'coding' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Problem Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Reverse Linked List"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    value={newQuestionForm.title}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, title: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {newQuestionType === 'mcq' ? 'Question Text / Scenario Prompt' : 'Problem Statement / Specification'}
                </label>
                <textarea 
                  rows={3}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  placeholder="Enter detailed question text..."
                  value={newQuestionForm.question_text}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, question_text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                  <CustomDropdown
                    value={newQuestionForm.difficulty}
                    onChange={(val) => setNewQuestionForm({ ...newQuestionForm, difficulty: val })}
                    options={[
                      { value: 'Easy', label: 'Easy' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Hard', label: 'Hard' }
                    ]}
                    className="w-full text-xs"
                    menuWidth="w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <CustomDropdown
                    value={newQuestionForm.category}
                    onChange={(val) => setNewQuestionForm({ ...newQuestionForm, category: val })}
                    options={[
                      { value: 'technical', label: 'Technical' },
                      { value: 'scenario', label: 'Scenario' },
                      { value: 'troubleshooting', label: 'Troubleshooting' }
                    ]}
                    className="w-full text-xs"
                    menuWidth="w-full"
                  />
                </div>
              </div>

              {newQuestionType === 'mcq' && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">Answer Options (Select correct answer)</label>
                  {newQuestionForm.options.map((opt, idx) => (
                    <div key={opt.option_key} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="correct_option"
                        checked={opt.is_correct}
                        onChange={() => {
                          const updated = newQuestionForm.options.map((o, i) => ({ ...o, is_correct: i === idx }));
                          setNewQuestionForm({ ...newQuestionForm, options: updated });
                        }}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-bold w-4 text-slate-600 dark:text-slate-400 font-mono">{opt.option_key}</span>
                      <input 
                        type="text" 
                        placeholder={`Option ${opt.option_key} text...`}
                        className="flex-1 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                        value={opt.option_text}
                        onChange={(e) => {
                          const updated = [...newQuestionForm.options];
                          updated[idx].option_text = e.target.value;
                          setNewQuestionForm({ ...newQuestionForm, options: updated });
                        }}
                      />
                    </div>
                  ))}

                  <div className="pt-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Explanation / Solution Rationale (Confidential)</label>
                    <textarea 
                      rows={2}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                      placeholder="Why is this the correct answer?"
                      value={newQuestionForm.explanation}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {newQuestionType === 'coding' && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sample Input Data</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                        value={newQuestionForm.test_input}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, test_input: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Output</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                        value={newQuestionForm.test_expected}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, test_expected: e.target.value })}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1 text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newQuestionForm.is_hidden}
                      onChange={(e) => setNewQuestionForm({ ...newQuestionForm, is_hidden: e.target.checked })}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    Mark as hidden grading test case (confidential)
                  </label>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Associated Canonical Skills (Comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. python, fastapi, algorithms"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  value={newQuestionForm.skills}
                  onChange={(e) => setNewQuestionForm({ ...newQuestionForm, skills: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setShowAuthorModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleCreateNewQuestion}>
                Save & Attach Question
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Preview Modal ──────────────────────────────────────────────────── */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-brand-600" />
                  <span>Assessment Preview ({previewAsCandidate ? 'Candidate View' : 'Recruiter View'})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {previewAsCandidate 
                    ? 'Sanitized: Correct answers, explanations, and secret test cases are hidden.' 
                    : 'Full Access: Correct options, solution explanations, and all test cases visible.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={previewAsCandidate ? 'outline' : 'primary'}
                  onClick={() => handleOpenPreview(false)}
                >
                  Recruiter
                </Button>
                <Button 
                  size="sm" 
                  variant={previewAsCandidate ? 'primary' : 'outline'}
                  onClick={() => handleOpenPreview(true)}
                >
                  Candidate
                </Button>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-2 cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            {previewLoading ? (
              <div className="py-12 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-slate-400" />
                <span className="text-xs">Loading preview...</span>
              </div>
            ) : !previewData ? (
              <div className="py-8 text-center text-slate-400 text-xs">No preview data available.</div>
            ) : (
              <div className="space-y-4">
                {/* MCQs Preview */}
                {previewData.technical_mcqs?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Technical MCQs ({previewData.technical_mcqs.length})
                    </h4>
                    {previewData.technical_mcqs.map((m, idx) => (
                      <div key={m.id || idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {m.question}
                        </div>
                        <div className="space-y-1 pl-2">
                          {Object.entries(m.options || {}).map(([key, text]) => {
                            const isCorrect = m.correct_option === key;
                            return (
                              <div 
                                key={key} 
                                className={`p-1.5 rounded-lg flex items-center gap-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 font-semibold' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span className="font-mono font-bold">{key}.</span>
                                <span>{text}</span>
                                {isCorrect && <span className="text-[10px] ml-auto font-bold text-emerald-600 dark:text-emerald-400">(Correct)</span>}
                              </div>
                            );
                          })}
                        </div>
                        {m.explanation && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 rounded-lg text-[11px] mt-1">
                            <span className="font-semibold">Explanation: </span>
                            {m.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Coding Preview */}
                {previewData.coding_problems?.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Coding Problems ({previewData.coding_problems.length})
                    </h4>
                    {previewData.coding_problems.map((p, idx) => (
                      <div key={p.id || idx} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {idx + 1}. {p.title} ({p.difficulty})
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          {p.problem_statement}
                        </p>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Allowed languages: {p.allowed_languages?.join(', ')}
                        </div>
                        {p.sample_test_cases && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            Public test cases: {p.sample_test_cases.length}
                          </div>
                        )}
                        {p.test_cases && (
                          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                            Total evaluation test cases: {p.test_cases.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="outline" onClick={() => setShowPreviewModal(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
