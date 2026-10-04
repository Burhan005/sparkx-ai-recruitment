import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import api from '../../services/api';
import { 
  Briefcase, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Play, 
  Eye, 
  Save, 
  Code2, 
  Video, 
  FileText, 
  AlertTriangle,
  RefreshCw,
  Check,
  Loader2,
  Info,
  ChevronRight,
  Award,
  BarChart3,
  PenLine,
  DollarSign,
  Cpu,
  Globe,
  ExternalLink,
  Link2,
  Layers,
} from 'lucide-react';
import { Button, Badge, CustomDropdown } from '../ui/Primitives';
import { useToast } from '../ui/Toast';
import ProblemBankManager from './ProblemBankManager';
import MCQBankManager from './MCQBankManager';

// Map supported_eval_types to friendly tab definitions
const EVAL_TYPE_TO_TAB = {
  coding_challenge:    { id: 'assessment',  label: 'Coding Challenge',         icon: Code2,        color: 'text-brand-600' },
  sql_challenge:       { id: 'assessment',  label: 'SQL Challenge',             icon: Code2,        color: 'text-brand-600' },
  infrastructure_task: { id: 'assessment',  label: 'Infrastructure Task',       icon: Cpu,          color: 'text-brand-600' },
  data_analysis_task:  { id: 'assessment',  label: 'Data Analysis Task',        icon: BarChart3,    color: 'text-brand-600' },
  financial_modeling:  { id: 'assessment',  label: 'Financial Modeling Task',   icon: DollarSign,   color: 'text-amber-600' },
  written_case_study:  { id: 'assessment',  label: 'Written Case Study',        icon: PenLine,      color: 'text-brand-600' },
  writing_sample:      { id: 'assessment',  label: 'Writing Assignment',        icon: PenLine,      color: 'text-brand-600' },
  compliance_scenario: { id: 'assessment',  label: 'Compliance Scenario',       icon: Award,        color: 'text-rose-600' },
  system_design:       { id: 'assessment',  label: 'System Design Task',        icon: Cpu,          color: 'text-brand-600' },
  external_platforms:  { id: 'external',    label: 'External Coding Platforms', icon: Globe,        color: 'text-brand-600' },
  mcq_knowledge:       { id: 'mcq',         label: 'Knowledge MCQs',            icon: FileText,     color: 'text-slate-600' },
  scenario_judgment:   { id: 'scenario',    label: 'Scenario & Judgment',       icon: AlertTriangle, color: 'text-amber-600' },
  interview_questions: { id: 'interview',   label: 'AI Interview Questions',    icon: Video,        color: 'text-purple-600' },
};

function getTabsFromEvalTypes(evalTypes, isCoding = true) {
  const seen = new Set();
  const tabs = [];
  for (const evalType of (evalTypes || [])) {
    const def = EVAL_TYPE_TO_TAB[evalType];
    if (def && !seen.has(def.id)) {
      seen.add(def.id);
      tabs.push({ ...def, evalType });
    }
  }
  // Always ensure interview tab is present
  if (!seen.has('interview')) {
    tabs.push({ id: 'interview', label: 'AI Interview Questions', icon: Video, color: 'text-purple-600', evalType: 'interview_questions' });
    seen.add('interview');
  }
  // Always ensure MCQ Question Bank tab is present
  if (!seen.has('mcq_bank')) {
    tabs.push({ id: 'mcq_bank', label: 'MCQ Bank & Authoring', icon: FileText, color: 'text-brand-600', evalType: 'mcq_knowledge' });
    seen.add('mcq_bank');
  }
  // Always ensure Coding Problem Bank tab is present for technical/coding roles
  if (!seen.has('problem_bank') && (isCoding || !evalTypes || evalTypes.includes('external_platforms') || evalTypes.includes('coding_challenge') || evalTypes.includes('system_design') || evalTypes.includes('infrastructure_task') || evalTypes.includes('sql_challenge'))) {
    tabs.push({ id: 'problem_bank', label: 'Problem Bank & Authoring', icon: Layers, color: 'text-brand-600', evalType: 'coding_challenge' });
    seen.add('problem_bank');
  }
  // Always ensure external platforms (LeetCode, HackerRank, CodeSignal) tab is present for technical/coding roles
  if (!seen.has('external') && (isCoding || !evalTypes || evalTypes.includes('external_platforms') || evalTypes.includes('coding_challenge') || evalTypes.includes('system_design') || evalTypes.includes('infrastructure_task') || evalTypes.includes('sql_challenge'))) {
    tabs.push({ id: 'external', label: 'External Coding Platforms', icon: Globe, color: 'text-brand-600', evalType: 'external_platforms' });
    seen.add('external');
  }
  return tabs;
}

export default function AssessmentStudio({ defaultTab = 'interview' }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    jobs = [], 
    activeJob, 
    setActiveJobId, 
    updateJob, 
    userRole 
  } = useRecruitment();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || defaultTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [selectedJobId, setSelectedJobId] = useState(() => activeJob?.id || (jobs[0]?.id || ''));
  useEffect(() => {
    if (activeJob?.id && !selectedJobId) setSelectedJobId(activeJob.id);
  }, [activeJob]);

  const currentJob = useMemo(() => {
    return jobs.find(j => j.id === selectedJobId) || jobs[0] || null;
  }, [jobs, selectedJobId]);

  // ── Studio Config State (domain, tabs, ai-generated content) ──
  const [studioConfig, setStudioConfig] = useState(null); // null = not loaded yet
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [configLoadError, setConfigLoadError] = useState(null);

  // ── Editable assessment content state ──
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [handsOnTask, setHandsOnTask] = useState(null);   // the hands_on object from pool
  const [mcqList, setMcqList] = useState([]);
  const [scenarioData, setScenarioData] = useState(null); // the scenario object from pool

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // ── Add-Question form state ──
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('');
  const [newQuestionRubric, setNewQuestionRubric] = useState('');

  // ── Add-MCQ form state ──
  const [newMcqQuestion, setNewMcqQuestion] = useState('');
  const [newMcqOptA, setNewMcqOptA] = useState('');
  const [newMcqOptB, setNewMcqOptB] = useState('');
  const [newMcqOptC, setNewMcqOptC] = useState('');
  const [newMcqOptD, setNewMcqOptD] = useState('');
  const [newMcqCorrect, setNewMcqCorrect] = useState('A');
  const [newMcqExplanation, setNewMcqExplanation] = useState('');
  const [isAddingMcq, setIsAddingMcq] = useState(false);

  // ── Add-TestCase form state ──
  const [newTestInput, setNewTestInput] = useState('');
  const [newTestOutput, setNewTestOutput] = useState('');
  const [newTestIsHidden, setNewTestIsHidden] = useState(false);

  // ── External Platforms Integration State ──
  const [platformsConfig, setPlatformsConfig] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('hackerrank');
  const [extQuery, setExtQuery] = useState('');
  const [extDifficulty, setExtDifficulty] = useState('');
  const [availableExtQuestions, setAvailableExtQuestions] = useState([]);
  const [selectedExtQuestions, setSelectedExtQuestions] = useState([]);
  const [isLoadingExt, setIsLoadingExt] = useState(false);

  // Fetch supported external platforms configuration status on mount
  useEffect(() => {
    api.getExternalPlatforms().then(res => {
      if (Array.isArray(res)) setPlatformsConfig(res);
    }).catch(() => {});
  }, []);

  // Fetch questions when on external tab or search filters change
  useEffect(() => {
    if (activeTab !== 'external') return;
    setIsLoadingExt(true);
    const debounce = setTimeout(() => {
      api.searchExternalQuestions(selectedPlatform, extQuery, extDifficulty)
        .then(qList => setAvailableExtQuestions(Array.isArray(qList) ? qList : []))
        .catch(() => setAvailableExtQuestions([]))
        .finally(() => setIsLoadingExt(false));
    }, 200);
    return () => clearTimeout(debounce);
  }, [selectedPlatform, extQuery, extDifficulty, activeTab]);

  // Derived domain flags
  const domain = studioConfig?.domain || 'unknown';
  const isCoding = Boolean(
    studioConfig?.is_coding ?? (
      currentJob?.coding_difficulty ||
      currentJob?.languages?.length ||
      /engineer|developer|fullstack|frontend|backend|devops|data|ai|software|cloud|architect|systems|coder|programmer/i.test(currentJob?.title || '')
    )
  );
  const availableTabs = useMemo(() => getTabsFromEvalTypes(studioConfig?.supported_eval_types, isCoding), [studioConfig, isCoding]);

  // ── Load studio config from backend when job changes ──
  const loadStudioConfig = useCallback(async (jobId) => {
    if (!jobId) return;
    setIsLoadingConfig(true);
    setConfigLoadError(null);
    setStudioConfig(null);
    try {
      const config = await api.generateStudioConfig(jobId);
      if (!config) throw new Error('No config returned');
      setStudioConfig(config);
      // Populate editable state from config
      const pool = config.assessment_pool || {};
      setInterviewQuestions(
        (config.interview_questions && config.interview_questions.length > 0)
          ? config.interview_questions
          : []
      );
      setMcqList(
        (pool.technical_mcqs && Array.isArray(pool.technical_mcqs))
          ? pool.technical_mcqs
          : []
      );
      setHandsOnTask(pool.hands_on || null);
      setScenarioData(pool.scenario || null);
      if (pool.external_platform) setSelectedPlatform(pool.external_platform);
      if (Array.isArray(pool.external_questions)) setSelectedExtQuestions(pool.external_questions);
      // Default question type based on domain
      setNewQuestionType(config.domain ? `${config.domain.replace(/_/g, ' ')} — Core Competency` : 'Core Competency');
    } catch (err) {
      setConfigLoadError('Could not load AI-generated studio configuration. Please try regenerating.');
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  // Load from existing job data if available, else generate
  useEffect(() => {
    if (!currentJob) return;

    const existingPool = currentJob.assessment_pool || {};
    const hasExistingPool = existingPool.domain && (existingPool.technical_mcqs || existingPool.hands_on || existingPool.scenario || existingPool.external_platform);

    if (hasExistingPool && currentJob.questions && currentJob.questions.length > 0) {
      // Use cached config from job record
      const cachedConfig = {
        domain: existingPool.domain || 'unknown',
        is_coding: existingPool.is_coding ?? false,
        domain_rationale: existingPool.domain_rationale || '',
        supported_eval_types: existingPool.supported_eval_types || ['mcq_knowledge', 'scenario_judgment', 'interview_questions'],
        interview_questions: currentJob.questions || [],
        assessment_pool: existingPool,
        generated_by: 'cached',
        job_id: currentJob.id,
        job_title: currentJob.title
      };
      setStudioConfig(cachedConfig);
      setInterviewQuestions(currentJob.questions || []);
      setMcqList(existingPool.technical_mcqs || []);
      setHandsOnTask(existingPool.hands_on || null);
      setScenarioData(existingPool.scenario || null);
      if (existingPool.external_platform) setSelectedPlatform(existingPool.external_platform);
      if (Array.isArray(existingPool.external_questions)) setSelectedExtQuestions(existingPool.external_questions);
      setNewQuestionType(cachedConfig.domain ? `${cachedConfig.domain.replace(/_/g, ' ')} — Core Competency` : 'Core Competency');
    } else {
      // Generate fresh from backend
      loadStudioConfig(currentJob.id);
    }
  }, [currentJob?.id]);

  // ── Regenerate with AI (real call) ──
  const handleRegenerateWithAI = async () => {
    if (!currentJob || isGeneratingAI) return;
    setIsGeneratingAI(true);
    try {
      const config = await api.generateStudioConfig(
        currentJob.id,
        5,
        3,
        currentJob.coding_difficulty || 'Mid-Level',
        true
      );
      if (config) {
        setStudioConfig(config);
        const pool = config.assessment_pool || {};
        const newIqs = config.interview_questions || [];
        const newMcqs = pool.technical_mcqs || [];
        setInterviewQuestions(newIqs);
        setMcqList(newMcqs);
        setHandsOnTask(pool.hands_on || null);
        setScenarioData(pool.scenario || null);
        if (pool.external_platform) setSelectedPlatform(pool.external_platform);
        if (Array.isArray(pool.external_questions)) setSelectedExtQuestions(pool.external_questions);
        setNewQuestionType(config.domain ? `${config.domain.replace(/_/g, ' ')} — Core Competency` : 'Core Competency');
        toast.success(`Regenerated assessment with AI (${newIqs.length} interview questions, ${newMcqs.length} MCQs)`);
      }
    } catch (err) {
      toast.error('Failed to regenerate: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ── Save & Publish to Database ──
  const handleSaveConfiguration = async () => {
    if (!currentJob) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const pool = {
        ...(studioConfig?.assessment_pool || {}),
        domain: studioConfig?.domain,
        is_coding: studioConfig?.is_coding,
        domain_rationale: studioConfig?.domain_rationale,
        supported_eval_types: studioConfig?.supported_eval_types,
        technical_mcqs: mcqList,
        scenario: scenarioData,
        hands_on: handsOnTask,
        external_platform: selectedPlatform,
        external_questions: selectedExtQuestions,
      };
      await updateJob(currentJob.id, {
        questions: interviewQuestions,
        assessment_pool: pool,
      });
      setSaveSuccess(true);
      toast.success('Assessment configuration saved & published to candidates');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      toast.error('Error saving: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // ── Add custom interview question ──
  const handleAddCustomQuestion = (e) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const rubricItems = newQuestionRubric.split(',').map(s => s.trim()).filter(Boolean);
    setInterviewQuestions(prev => [{
      id: `q_custom_${Date.now()}`,
      type: newQuestionType || 'Custom',
      prompt: newQuestionText.trim(),
      rubric: rubricItems.length > 0 ? rubricItems : ['Accuracy', 'Practical experience', 'Clarity'],
      is_recruiter_custom: true
    }, ...prev]);
    setNewQuestionText('');
    setNewQuestionRubric('');
  };

  // ── Add custom MCQ ──
  const handleAddCustomMcq = async (e) => {
    e.preventDefault();
    if (!newMcqQuestion.trim() || !newMcqOptA.trim() || !newMcqOptB.trim()) return;
    try {
      const created = await api.createMCQQuestion({
        question_text: newMcqQuestion.trim(),
        category: studioConfig?.domain || 'technical',
        difficulty: currentJob?.coding_difficulty || 'Medium',
        explanation: newMcqExplanation.trim() || 'Correct answer per domain standards.',
        options: {
          A: newMcqOptA.trim(),
          B: newMcqOptB.trim(),
          C: newMcqOptC.trim() || 'N/A',
          D: newMcqOptD.trim() || 'N/A'
        },
        correct_option: newMcqCorrect
      });
      setMcqList(prev => [...prev, {
        id: created.id,
        question: created.question_text,
        options: {
          A: newMcqOptA.trim(),
          B: newMcqOptB.trim(),
          C: newMcqOptC.trim() || 'N/A',
          D: newMcqOptD.trim() || 'N/A'
        },
        correct_option: newMcqCorrect,
        explanation: created.explanation,
        is_recruiter_custom: true
      }]);
      toast.success('Custom MCQ saved to database');
    } catch (err) {
      console.warn('Fallback local MCQ authoring:', err);
      setMcqList(prev => [...prev, {
        id: `mcq_custom_${Date.now()}`,
        question: newMcqQuestion.trim(),
        options: { A: newMcqOptA.trim(), B: newMcqOptB.trim(), C: newMcqOptC.trim() || 'N/A', D: newMcqOptD.trim() || 'N/A' },
        correct_option: newMcqCorrect,
        explanation: newMcqExplanation.trim() || 'Correct answer per domain standards.',
        is_recruiter_custom: true
      }]);
    }
    setNewMcqQuestion(''); setNewMcqOptA(''); setNewMcqOptB(''); setNewMcqOptC(''); setNewMcqOptD(''); setNewMcqExplanation('');
    setIsAddingMcq(false);
  };

  // ── Add test case to hands_on ──
  const handleAddTestCase = (e) => {
    e.preventDefault();
    if (!newTestInput.trim() || !newTestOutput.trim()) return;
    setHandsOnTask(prev => {
      if (!prev) return prev;
      const key = newTestIsHidden ? 'hidden_test_cases' : 'sample_test_cases';
      return { ...prev, [key]: [...(prev[key] || []), { name: `Test ${Date.now()}`, input: newTestInput.trim(), expected: newTestOutput.trim() }] };
    });
    setNewTestInput(''); setNewTestOutput('');
  };

  // MCQ options normalizer: handles both { A, B, C, D } dict and legacy array
  const getMcqOptions = (mcq) => {
    if (mcq.options && typeof mcq.options === 'object' && !Array.isArray(mcq.options)) {
      return ['A', 'B', 'C', 'D'].map(k => ({ key: k, text: mcq.options[k] || '' }));
    }
    if (Array.isArray(mcq.options)) {
      return mcq.options.map((t, i) => ({ key: String.fromCharCode(65 + i), text: t }));
    }
    return [];
  };
  const getMcqCorrectKey = (mcq) => {
    if (mcq.correct_option) return mcq.correct_option;
    if (mcq.correct_index !== undefined) return String.fromCharCode(65 + Number(mcq.correct_index));
    return 'A';
  };

  const jobOptions = jobs.map(j => ({ value: j.id, label: j.title, badge: j.department || undefined }));

  // ── Domain label prettifier ──
  const domainLabel = domain.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // ── Domain color chip ──
  const domainChipClass = isCoding
    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20 animate-fade-in-up">

      {/* ── Studio Header ── */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                Evaluation Authoring Suite
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recruiter Mode: Author & Customize</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Assessment & Interview Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              SparkX analyzes the actual job requirements and generates a role-appropriate evaluation. Review, customize, and publish what candidates will receive.
            </p>
          </div>

          <div className="flex flex-col items-stretch lg:items-end gap-2 shrink-0 lg:min-w-[260px]">
            {/* Row 1: Job selector */}
            <CustomDropdown
              value={selectedJobId}
              onChange={(val) => {
                setSelectedJobId(val);
                setActiveJobId(val);
              }}
              options={jobOptions}
              icon={Briefcase}
              menuWidth="w-80"
              align="right"
              title="Select Job Requisition"
            />

            {/* Row 2: Action buttons — always on their own row, always fully visible */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={isGeneratingAI ? Loader2 : RefreshCw}
                onClick={handleRegenerateWithAI}
                disabled={isGeneratingAI || isLoadingConfig}
                className={`flex-1 lg:flex-none ${isGeneratingAI ? 'opacity-70' : ''}`}
                title="Re-analyze job requirements and regenerate evaluation plan"
              >
                {isGeneratingAI ? 'Generating…' : 'Regenerate with AI'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Save}
                onClick={handleSaveConfiguration}
                disabled={isSaving || isLoadingConfig || !studioConfig}
                className="flex-1 lg:flex-none shadow-sm shadow-brand-500/20"
              >
                {isSaving ? 'Publishing…' : 'Save & Publish'}
              </Button>
            </div>
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Published evaluation configuration for "{currentJob?.title}". Candidates invited to this role will receive your customized plan.</span>
            </div>
            <button type="button" onClick={() => setSaveSuccess(false)} className="text-xs text-emerald-600 hover:underline ml-4">Dismiss</button>
          </div>
        )}

        {/* Role metadata strip */}
        {currentJob && studioConfig && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">Configuring:</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono">{currentJob.title}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500">{currentJob.department}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono ${domainChipClass}`}>
                {domainLabel}
              </span>
              {studioConfig.domain_rationale && (
                <span className="text-slate-400 italic hidden lg:inline">— {studioConfig.domain_rationale}</span>
              )}
              {studioConfig.generated_by === 'llm' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  AI Generated
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="xs" icon={Eye}
                onClick={() => navigate(`/interview?preview=true&job_id=${currentJob.id}`)}
                title="Preview interview as candidate"
              >Simulate Interview</Button>
              <Button
                variant="outline" size="xs" icon={Play}
                onClick={() => navigate(`/assessment?preview=true&job_id=${currentJob.id}`)}
                title="Preview assessment sandbox as candidate"
              >Simulate Assessment</Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Loading / Error State ── */}
      {isLoadingConfig && (
        <div className="p-10 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Analyzing job requirements…</p>
            <p className="text-xs text-slate-500 mt-1">SparkX is reading the actual job data to determine the appropriate evaluation methods for this role.</p>
          </div>
        </div>
      )}

      {!isLoadingConfig && configLoadError && (
        <div className="p-6 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-rose-200 dark:border-rose-900 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{configLoadError}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => loadStudioConfig(currentJob?.id)}>Retry</Button>
        </div>
      )}

      {/* ── Studio Content (only when config loaded) ── */}
      {!isLoadingConfig && studioConfig && (
        <>
          {/* Tab Navigation — dynamic based on domain */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              let count = 0;
              if (tab.id === 'interview') count = interviewQuestions.length;
              else if (tab.id === 'mcq') count = mcqList.length;
              else if (tab.id === 'problem_bank') count = 'Bank';
              else if (tab.id === 'assessment') count = 1;
              else if (tab.id === 'scenario') count = scenarioData ? 1 : 0;
              else if (tab.id === 'external') count = selectedExtQuestions.length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-[#FDFCFA] dark:bg-[#1A1714] shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* ── TAB: AI INTERVIEW QUESTIONS ── */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand-600" />
                  <span>Add Custom Interview Question</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Authored questions will be presented to the candidate by the AI interviewer during their session.
                </p>
                <form onSubmit={handleAddCustomQuestion} className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Category</label>
                      <input
                        type="text"
                        value={newQuestionType}
                        onChange={(e) => setNewQuestionType(e.target.value)}
                        placeholder={`e.g. ${domainLabel} — Core Competency`}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rubric Keywords (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. GAAP compliance, variance analysis, controls"
                        value={newQuestionRubric}
                        onChange={(e) => setNewQuestionRubric(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Prompt</label>
                    <textarea
                      rows={2}
                      placeholder="Type your custom interview question here…"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full p-2.5 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" size="sm" icon={Plus}>Add Question to Plan</Button>
                  </div>
                </form>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Active Interview Plan ({interviewQuestions.length} Questions)
                  </h4>
                  <span className="text-[11px] text-slate-400">~{interviewQuestions.length * 5} minutes estimated</span>
                </div>
                {interviewQuestions.length === 0 && (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    No questions yet. Regenerate with AI or add custom questions above.
                  </div>
                )}
                {interviewQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          {q.type}
                        </span>
                        {q.is_recruiter_custom ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Recruiter Custom</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium text-slate-400">SparkX AI</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setInterviewQuestions(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">"{q.prompt}"</p>
                    {q.rubric && q.rubric.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase">Rubric:</span>
                        {q.rubric.map((r, rIdx) => (
                          <span key={rIdx} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">{r}</span>
                        ))}
                      </div>
                    )}
                    {(q.follow_up_vague || q.follow_up_expert) && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1">
                        {q.follow_up_vague && <p className="text-[10px] text-slate-400 font-mono">↩ Vague: <span className="text-slate-500">{q.follow_up_vague}</span></p>}
                        {q.follow_up_expert && <p className="text-[10px] text-slate-400 font-mono">↗ Expert: <span className="text-slate-500">{q.follow_up_expert}</span></p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: KNOWLEDGE MCQs ── */}
          {activeTab === 'mcq' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-600" />
                      <span>{domainLabel} MCQs ({mcqList.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500">Multiple-choice questions evaluate conceptual mastery, standards, and domain knowledge specific to this role.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="xs" icon={Layers} onClick={() => handleTabChange('mcq_bank')}>
                      Browse Question Bank
                    </Button>
                    <Button variant="outline" size="xs" icon={Plus} onClick={() => setIsAddingMcq(prev => !prev)}>
                      {isAddingMcq ? 'Cancel' : '+ Add Custom MCQ'}
                    </Button>
                  </div>
                </div>

                {isAddingMcq && (
                  <form onSubmit={handleAddCustomMcq} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">New MCQ</h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Question</label>
                      <textarea rows={2} value={newMcqQuestion} onChange={(e) => setNewMcqQuestion(e.target.value)} placeholder="Enter your MCQ question…" className="w-full p-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[['A', newMcqOptA, setNewMcqOptA], ['B', newMcqOptB, setNewMcqOptB], ['C', newMcqOptC, setNewMcqOptC], ['D', newMcqOptD, setNewMcqOptD]].map(([key, val, setter]) => (
                        <div key={key} className="flex items-center gap-2">
                          <input type="radio" name="mcq_correct" checked={newMcqCorrect === key} onChange={() => setNewMcqCorrect(key)} className="text-brand-600" title="Mark correct" />
                          <input type="text" placeholder={`Option ${key}`} value={val} onChange={(e) => setter(e.target.value)} className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Explanation</label>
                      <input type="text" value={newMcqExplanation} onChange={(e) => setNewMcqExplanation(e.target.value)} placeholder="Why is this the correct answer?" className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit" variant="primary" size="xs" icon={Plus}>Save MCQ</Button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {mcqList.length === 0 && (
                    <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                      No MCQs yet. Regenerate with AI or add custom MCQs above.
                    </div>
                  )}
                  {mcqList.map((mcq, idx) => {
                    const options = getMcqOptions(mcq);
                    const correctKey = getMcqCorrectKey(mcq);
                    return (
                      <div key={mcq.id || idx} className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="font-mono text-slate-400">#{idx + 1}</span>
                            <span>{mcq.question}</span>
                          </span>
                          <button type="button" onClick={() => setMcqList(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {options.map(({ key, text }) => (
                            <div key={key} className={`p-2 rounded-lg border text-[11px] font-medium flex items-center gap-2 ${
                              key === correctKey
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                            }`}>
                              <span className="font-mono font-bold">{key}.</span>
                              <span className="truncate">{text}</span>
                              {key === correctKey && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 shrink-0" />}
                            </div>
                          ))}
                        </div>
                        {mcq.explanation && (
                          <p className="text-[10px] text-slate-400 pt-1 italic font-mono">Rationale: {mcq.explanation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PRACTICAL TASK (Coding / Hands-On / Financial / Written) ── */}
          {activeTab === 'assessment' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
                {handsOnTask ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {isCoding ? <Code2 className="w-4 h-4 text-brand-600" /> : <PenLine className="w-4 h-4 text-amber-600" />}
                          <span>{handsOnTask.title || 'Practical Task'}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Task type: <span className="font-mono font-medium">{(handsOnTask.task_type || (isCoding ? 'coding' : 'written_case_study')).replace(/_/g, ' ')}</span>
                          {handsOnTask.difficulty && <> · Difficulty: <span className="font-medium">{handsOnTask.difficulty}</span></>}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                      <input
                        type="text"
                        value={handsOnTask.title || ''}
                        onChange={(e) => setHandsOnTask(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {isCoding ? 'Problem Statement & Instructions' : 'Task Instructions & Deliverable Brief'}
                      </label>
                      <textarea
                        rows={5}
                        value={handsOnTask.instructions || ''}
                        onChange={(e) => setHandsOnTask(prev => ({ ...prev, instructions: e.target.value }))}
                        className="w-full p-3 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Deliverable description */}
                    {handsOnTask.deliverable_description && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Deliverable</label>
                        <input
                          type="text"
                          value={handsOnTask.deliverable_description || ''}
                          onChange={(e) => setHandsOnTask(prev => ({ ...prev, deliverable_description: e.target.value }))}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    )}

                    {/* Coding-only: test cases */}
                    {isCoding && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                            Test Cases ({(handsOnTask.sample_test_cases || []).length} Public, {(handsOnTask.hidden_test_cases || []).length} Hidden)
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {(handsOnTask.sample_test_cases || []).map((tc, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">Public #{idx + 1}</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300 truncate">Input: <code className="text-slate-900 dark:text-white">{tc.input}</code> → Expected: <code className="text-emerald-600 dark:text-emerald-400">{tc.expected || tc.expected_output}</code></span>
                              </div>
                              <button type="button" onClick={() => setHandsOnTask(prev => ({ ...prev, sample_test_cases: prev.sample_test_cases.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                          {(handsOnTask.hidden_test_cases || []).map((tc, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Hidden #{idx + 1}</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300 truncate">Input: <code className="text-slate-900 dark:text-white">{tc.input}</code> → Expected: <code className="text-emerald-600 dark:text-emerald-400">{tc.expected || tc.expected_output}</code></span>
                              </div>
                              <button type="button" onClick={() => setHandsOnTask(prev => ({ ...prev, hidden_test_cases: prev.hidden_test_cases.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-rose-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={handleAddTestCase} className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 flex flex-wrap items-center gap-2 text-xs">
                          <input type="text" placeholder="Input" value={newTestInput} onChange={(e) => setNewTestInput(e.target.value)} className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs" />
                          <input type="text" placeholder="Expected Output" value={newTestOutput} onChange={(e) => setNewTestOutput(e.target.value)} className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs" />
                          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                            <input type="checkbox" checked={newTestIsHidden} onChange={(e) => setNewTestIsHidden(e.target.checked)} className="rounded text-brand-600" />
                            <span>Hidden</span>
                          </label>
                          <Button type="submit" variant="primary" size="xs" icon={Plus}>Add Test</Button>
                        </form>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                    No hands-on task configured. Regenerate with AI to generate a domain-appropriate practical task for this role.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: SCENARIO & JUDGMENT ── */}
          {activeTab === 'scenario' && (
            <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Scenario & Judgment Assessment</span>
                  </h3>
                  <p className="text-xs text-slate-500">Tests high-level decision-making, domain judgment, and professional problem-solving under realistic constraints.</p>
                </div>
              </div>
              {scenarioData ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Scenario Title</label>
                    <input type="text" value={scenarioData.title || ''} onChange={(e) => setScenarioData(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Scenario Description</label>
                    <textarea rows={5} value={scenarioData.prompt || ''} onChange={(e) => setScenarioData(prev => ({ ...prev, prompt: e.target.value }))} className="w-full p-3 text-xs sm:text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guidance (What Strong Answers Reference)</label>
                    <textarea rows={2} value={scenarioData.guidance || ''} onChange={(e) => setScenarioData(prev => ({ ...prev, guidance: e.target.value }))} className="w-full p-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                  </div>
                  {scenarioData.ideal_keywords && scenarioData.ideal_keywords.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ideal Keywords</label>
                      <div className="flex flex-wrap gap-1.5">
                        {scenarioData.ideal_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                  No scenario configured. Regenerate with AI to generate a domain-appropriate scenario for this role.
                </div>
              )}
            </div>
          )}

          {/* ── TAB: MCQ QUESTION BANK & RECRUITER AUTHORING ── */}
          {activeTab === 'mcq_bank' && (
            <MCQBankManager
              activeJob={currentJob}
              onAttachMCQs={(attached) => {
                setMcqList(attached.map(a => ({
                  id: a.mcq_question_id,
                  question: a.question_text,
                  difficulty: a.difficulty,
                  category: a.category,
                  weight: a.weight
                })));
              }}
            />
          )}

          {/* ── TAB: PROBLEM BANK & RECRUITER AUTHORING ── */}
          {activeTab === 'problem_bank' && (
            <ProblemBankManager
              activeJob={currentJob}
              onAttachProblems={(attached) => {
                setHandsOnTask(prev => ({
                  ...prev,
                  attached_problem_bank: attached
                }));
              }}
            />
          )}

          {/* ── TAB: EXTERNAL CODING PLATFORMS ── */}
          {activeTab === 'external' && (
            <div className="p-5 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-500" />
                    <span>External Coding Platforms Integration</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recruiters can select questions from external platforms (LeetCode, HackerRank, CodeSignal) alongside AI-generated and custom questions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-bold">
                    {selectedExtQuestions.length} Selected
                  </span>
                </div>
              </div>

              {/* Platform Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target External Platform</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'hackerrank', name: 'HackerRank for Work', desc: 'REST API v3 · Org Question Bank & Sync' },
                    { id: 'leetcode',   name: 'LeetCode Challenge',   desc: 'Verified Tracked Links · 2500+ DSA Problems' },
                    { id: 'codesignal', name: 'CodeSignal Enterprise', desc: 'Arcade & Coding Tasks · Scorecard Sync' },
                  ].map(p => {
                    const isSelected = selectedPlatform === p.id;
                    const platConfig = platformsConfig.find(c => c.id === p.id);
                    const isConfigured = platConfig ? platConfig.configured : (p.id === 'leetcode');
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlatform(p.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</span>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            isConfigured
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {isConfigured ? 'Ready' : 'Setup Required'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder={`Search ${selectedPlatform} questions by topic/keyword...`}
                  value={extQuery}
                  onChange={(e) => setExtQuery(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={extDifficulty}
                  onChange={(e) => setExtDifficulty(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                {isLoadingExt && <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />}
              </div>

              {/* Questions Catalog */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Questions</span>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {availableExtQuestions.length > 0 ? (
                    availableExtQuestions.map(q => {
                      const isChecked = selectedExtQuestions.some(sq => sq.id === q.id || sq === q.id);
                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                            isChecked
                              ? 'border-brand-500/60 bg-brand-50/40 dark:bg-brand-950/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExtQuestions(prev => [...prev, q]);
                                } else {
                                  setSelectedExtQuestions(prev => prev.filter(sq => (sq.id || sq) !== q.id));
                                }
                              }}
                              className="rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 dark:text-white truncate block">{q.title}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold ${
                                  q.difficulty === 'Easy' ? 'text-emerald-600' :
                                  q.difficulty === 'Hard' ? 'text-rose-500' : 'text-amber-600'
                                }}`}>{q.difficulty}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-[10px] font-mono text-slate-400">{q.type || 'coding'}</span>
                              </div>
                            </div>
                          </div>
                          {q.url && (
                            <a
                              href={q.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-brand-500 flex items-center gap-1 shrink-0 text-[11px]"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      {isLoadingExt ? 'Searching catalog…' : 'No questions found for the selected filters.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Questions Summary Banner */}
              {selectedExtQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-900 dark:text-brand-300">
                      {selectedExtQuestions.length} {selectedPlatform.toUpperCase()} question(s) will be attached to this assessment.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedExtQuestions([])}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Click "Save & Publish" at the top to save this external configuration into the requisition blueprint.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
