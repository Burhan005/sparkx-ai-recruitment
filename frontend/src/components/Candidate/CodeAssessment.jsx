import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import api from '../../services/api';
import { 
  Code2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Sparkles, 
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  Layers,
  FileQuestion,
  HelpCircle,
  Wrench,
  ChevronRight,
  Check,
  Cpu,
  Loader2,
  AlertTriangle,
  Lightbulb,
  FileText,
  Briefcase,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { normalizeWorkflow } from '../../utils/workflowContract';
import CandidateIDE from './CandidateIDE';
import { enrichCodingQuestion, generateDefaultStarter } from './benchmarkQuestions';
import { Button, Badge } from '../ui/Primitives';

export default function CodeAssessment() {
  const navigate = useNavigate();
  const { candidateId: routeCandidateId } = useParams();
  const [searchParams] = useSearchParams();
  const queryJobId = searchParams.get('job_id') || searchParams.get('jobId');
  const isPreviewMode = searchParams.get('preview') === 'true' || searchParams.get('is_preview') === 'true';

  const { 
    activeJob: contextActiveJob, 
    currentUser,
    candidates,
    currentInterviewSession, 
    completeInterviewAndEvaluate,
    userRole,
    myApplications,
    jobs
  } = useRecruitment();

  const isRecruiterTesting = userRole === 'recruiter' || isPreviewMode;
  const activeJob = (queryJobId && jobs?.find(j => String(j.id) === String(queryJobId))) || contextActiveJob;

  // Resolve candidate and application
  const activeCandidate = (routeCandidateId && candidates.find(c => String(c.id) === String(routeCandidateId))) ||
    candidates.find(c => 
      c.id === currentInterviewSession?.candidateId || 
      (currentUser && c.email?.toLowerCase() === currentUser.email?.toLowerCase())
    ) || null;

  const activeApp = (routeCandidateId && myApplications?.find(a => String(a.id) === String(routeCandidateId))) ||
    myApplications?.find(a => 
      a.jobId === (queryJobId || activeJob?.id) || (currentUser && a.email?.toLowerCase() === currentUser.email?.toLowerCase())
    ) || (myApplications?.length > 0 ? myApplications[0] : null);

  const candidateId = routeCandidateId ||
    currentInterviewSession?.candidateId || 
    activeCandidate?.id ||
    activeApp?.id ||
    candidates.find(c => c.email === currentUser?.email)?.id || 
    (isRecruiterTesting ? 'demo-recruiter-preview' : currentUser?.id) ||
    (isPreviewMode ? 'demo-recruiter-preview' : null);

  const candRecord = activeCandidate || activeApp || {};
  const wf = normalizeWorkflow(candRecord);
  const isScheduledOrAdvanced = Boolean(
    isRecruiterTesting ||
    ['invited', 'in_progress', 'submitted', 'evaluated'].includes(wf.assessmentStatus) ||
    ['assessment', 'interview', 'review', 'completed'].includes(wf.stage) ||
    candRecord.interviewScheduledAt ||
    ['Interview', 'Interview Scheduled', 'Shortlisted', 'Selected', 'Offered', 'Assessment Scheduled'].includes(candRecord.status)
  );

  // 4 Categories: 'technical' | 'scenario' | 'hands_on' | 'troubleshooting'
  const [activeCategory, setActiveCategory] = useState('technical');
  const [assessmentBundle, setAssessmentBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState(null);

  // Sandbox-supported languages (fetched from backend on mount)
  const [sandboxLanguages, setSandboxLanguages] = useState(null); // null = not loaded yet

  // On mount: fetch the authoritative list of executable languages from backend sandbox
  useEffect(() => {
    api.getSupportedLanguages().then(langs => {
      if (langs && langs.length > 0) setSandboxLanguages(langs);
    }).catch(() => {}); // graceful fallback - sandboxLanguages stays null
  }, []);

  // Derive the list of executable language IDs (what the sandbox can actually run)
  const executableLanguageIds = sandboxLanguages
    ? sandboxLanguages.filter(l => (l.isExecutable ?? l.executable ?? true)).map(l => l.id)
    : null; // null = not loaded yet, CandidateIDE will use assessment bundle's own list

  // Timer & Evaluation Start State
  const [hasStarted, setHasStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45:00 minutes

  // Category 1: Technical MCQs state
  const [technicalAnswers, setTechnicalAnswers] = useState({});

  // Category 2: Scenario state
  const [scenarioAnswer, setScenarioAnswer] = useState('');

  // Category 3: Hands-on Coding state
  const [handsOnLang, setHandsOnLang] = useState('python');
  const [handsOnCode, setHandsOnCode] = useState('');
  const [isRunningHandsOn, setIsRunningHandsOn] = useState(false);
  const [handsOnResults, setHandsOnResults] = useState(null);
  const [handsOnConsole, setHandsOnConsole] = useState('');
  const [handsOnTelemetry, setHandsOnTelemetry] = useState(null);

  // Multi-Problem State (HackerRank / LeetCode / Coding Bank)
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [problemState, setProblemState] = useState({});

  // Category 4: Troubleshooting state
  const [troubleLang, setTroubleLang] = useState('python');
  const [troubleCode, setTroubleCode] = useState('');
  const [isRunningTrouble, setIsRunningTrouble] = useState(false);
  const [troubleResults, setTroubleResults] = useState(null);
  const [troubleConsole, setTroubleConsole] = useState('');
  const [troubleTelemetry, setTroubleTelemetry] = useState(null);

  // Derive list of coding problems (Problem Bank + External LeetCode/HackerRank + Practical hands_on)
  const codingProblems = useMemo(() => {
    const list = [];
    if (Array.isArray(assessmentBundle?.coding_problems) && assessmentBundle.coding_problems.length > 0) {
      assessmentBundle.coding_problems.forEach((q, idx) => {
        list.push(enrichCodingQuestion(q, list.length));
      });
    }

    if (Array.isArray(assessmentBundle?.external_questions) && assessmentBundle.external_questions.length > 0) {
      assessmentBundle.external_questions.forEach((q, idx) => {
        list.push(enrichCodingQuestion(q, list.length));
      });
    }

    if (assessmentBundle?.hands_on && assessmentBundle.hands_on.title) {
      const enrichedHandsOn = enrichCodingQuestion(assessmentBundle.hands_on, list.length);
      list.push({
        ...enrichedHandsOn,
        isHandsOnTask: true
      });
    }
    return list;
  }, [assessmentBundle]);

  const activeProblem = codingProblems[activeProblemIdx] || codingProblems[0] || (assessmentBundle?.hands_on ? enrichCodingQuestion(assessmentBundle.hands_on) : {});

  const scenarioObj = assessmentBundle?.scenario || {
    id: 'scenario_problem',
    title: 'Real-World Incident Resolution',
    difficulty: 'Senior',
    prompt: 'Describe your end-to-end strategy for diagnosing latency spikes and cascading failures.',
    guidance: 'Address root cause analysis, immediate production mitigation, and long-term resilience safeguards.'
  };

  const handsOnObj = assessmentBundle?.hands_on || {
    id: 'hands_on_problem',
    title: 'Practical Hands-on Challenge',
    difficulty: 'Mid-Level',
    instructions: 'Implement your solution according to the requirements.',
    is_coding: true
  };

  const troubleshootingObj = assessmentBundle?.troubleshooting || {
    id: 'troubleshooting_problem',
    title: 'Anomaly Diagnosis & Bug Rectification',
    difficulty: 'Mid-Level',
    is_coding: true,
    bug_description: 'Investigate the defective implementation, isolate the fault, and fix the bug to pass all test cases.',
    supported_languages: ['python', 'javascript', 'typescript', 'sql'],
    broken_code: { python: 'def fix(data):\n    # Fix defect here\n    return data\n' },
    sample_test_cases: []
  };

  const ALL_CODING_LANGUAGES = useMemo(() => [
    'python', 'javascript', 'typescript', 'java', 'cpp',
    'c', 'csharp', 'go', 'rust', 'ruby', 'php', 'kotlin', 'swift'
  ], []);

  const isCurrentProblemSql = Boolean(
    activeProblem?.type === 'sql' ||
    activeProblem?.category === 'sql' ||
    activeProblem?.category === 'database' ||
    activeProblem?.schema_ddl ||
    activeProblem?.title?.toLowerCase().includes('sql')
  );

  const problemSupportedLanguages = useMemo(() => {
    if (isCurrentProblemSql) {
      return ['sql'];
    }
    // Strictly exclude SQL for algorithmic/general coding problems
    if (executableLanguageIds && executableLanguageIds.length > 0) {
      const filtered = executableLanguageIds.filter(l => l !== 'sql');
      return filtered.length > 0 ? filtered : ALL_CODING_LANGUAGES;
    }
    return ALL_CODING_LANGUAGES;
  }, [isCurrentProblemSql, executableLanguageIds, ALL_CODING_LANGUAGES]);

  const isTroubleProblemSql = Boolean(
    troubleshootingObj?.type === 'sql' ||
    troubleshootingObj?.category === 'sql' ||
    troubleshootingObj?.category === 'database' ||
    troubleshootingObj?.schema_ddl ||
    troubleshootingObj?.title?.toLowerCase().includes('sql')
  );

  const troubleSupportedLanguages = useMemo(() => {
    if (isTroubleProblemSql) {
      return ['sql'];
    }
    if (executableLanguageIds && executableLanguageIds.length > 0) {
      const filtered = executableLanguageIds.filter(l => l !== 'sql');
      return filtered.length > 0 ? filtered : ALL_CODING_LANGUAGES;
    }
    return ALL_CODING_LANGUAGES;
  }, [isTroubleProblemSql, executableLanguageIds, ALL_CODING_LANGUAGES]);

  // Synchronize language if active language is invalid for current problem
  useEffect(() => {
    if (problemSupportedLanguages && problemSupportedLanguages.length > 0 && !problemSupportedLanguages.includes(handsOnLang)) {
      setHandsOnLang(problemSupportedLanguages[0]);
    }
  }, [problemSupportedLanguages, handsOnLang]);

  useEffect(() => {
    if (troubleSupportedLanguages && troubleSupportedLanguages.length > 0 && !troubleSupportedLanguages.includes(troubleLang)) {
      setTroubleLang(troubleSupportedLanguages[0]);
    }
  }, [troubleSupportedLanguages, troubleLang]);

  // Helper to reliably fetch starter code for a problem and language
  const getProblemStarter = (problem, lang) => {
    if (!problem) return '';
    if (problem.starter_code?.[lang]) return problem.starter_code[lang];
    const enriched = enrichCodingQuestion(problem);
    if (enriched.starter_code?.[lang]) return enriched.starter_code[lang];
    const cleanName = (problem.id || 'solve')
      .replace(/^(hr_|lc_)/, '')
      .replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return generateDefaultStarter(lang, cleanName);
  };

  const currentProbId = activeProblem?.id || 'hands_on_problem';
  const currentProbLangKey = `${currentProbId}__${handsOnLang}`;

  const activeProbCode = problemState[currentProbLangKey]?.code ??
    (problemState[currentProbId]?.lang === handsOnLang ? problemState[currentProbId]?.code : undefined) ??
    getProblemStarter(activeProblem, handsOnLang);

  const activeProbResults = problemState[currentProbId]?.results || (activeProblem.id === assessmentBundle?.hands_on?.id ? handsOnResults : null);
  const activeProbConsole = problemState[currentProbId]?.console || (activeProblem.id === assessmentBundle?.hands_on?.id ? handsOnConsole : '');
  const activeProbTelemetry = problemState[currentProbId]?.telemetry || (activeProblem.id === assessmentBundle?.hands_on?.id ? handsOnTelemetry : null);

  const handleActiveProblemCodeChange = (newCode) => {
    const pId = activeProblem?.id || 'hands_on_problem';
    const pLangKey = `${pId}__${handsOnLang}`;
    setProblemState(prev => ({
      ...prev,
      [pLangKey]: {
        code: newCode,
        lang: handsOnLang
      },
      [pId]: {
        ...(prev[pId] || {}),
        code: newCode,
        lang: handsOnLang
      }
    }));
    if (pId === assessmentBundle?.hands_on?.id) {
      setHandsOnCode(newCode);
    }
  };

  const handleRunActiveProblem = async () => {
    setIsRunningHandsOn(true);
    const codeToRun = activeProbCode;
    const taskLang = handsOnLang;
    setProblemState(prev => ({
      ...prev,
      [activeProblem.id]: {
        ...(prev[activeProblem.id] || {}),
        console: `> Compiling and executing ${taskLang.toUpperCase()} test suite for ${activeProblem.title}...\n`
      }
    }));

    const res = await api.runCodeSandbox({
      candidate_id: candidateId,
      job_id: activeJob?.id,
      task_id: activeProblem.id,
      category: 'hands_on',
      language: taskLang,
      code: codeToRun,
      test_cases: activeProblem.sample_test_cases || []
    });

    const results = res?.test_results || [];
    const consoleOut = res?.console_output || '> Validation finished.';
    const telemetry = { execution_ms: res?.execution_ms, memory_mb: res?.memory_mb };

    setProblemState(prev => ({
      ...prev,
      [activeProblem.id]: {
        ...(prev[activeProblem.id] || {}),
        results,
        console: consoleOut,
        telemetry
      }
    }));

    if (activeProblem.id === assessmentBundle?.hands_on?.id) {
      setHandsOnResults(results);
      setHandsOnConsole(consoleOut);
      setHandsOnTelemetry(telemetry);
    }

    setIsRunningHandsOn(false);
  };

  // Fetch dynamic assessment from backend
  useEffect(() => {
    let isMounted = true;

    async function loadAssessment() {
      if (!candidateId) {
        if (isMounted) setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const targetJobId = queryJobId || activeJob?.id || currentInterviewSession?.jobId || candidates.find(c => c.id === candidateId)?.jobId || (jobs && jobs.length > 0 ? jobs[0]?.id : null);
        const data = await api.getAssessment(candidateId, targetJobId);
        if (isMounted && data?.bundle) {
          setAssessmentBundle(data.bundle);

          const startKey = `assessment_started_${candidateId}_${targetJobId || 'default'}`;

          if (isRecruiterTesting || isPreviewMode) {
            // Recruiter Preview Mode: Always provide a fresh, interactive session with reset timer
            setSubmissionSuccess(false);
            setHasStarted(true);
            setTimeLeft(45 * 60);
            sessionStorage.removeItem(startKey);
            sessionStorage.removeItem(`${startKey}_time`);
          } else {
            if (data.is_completed) {
              setSubmissionSuccess(true);
            }

            // Check if user has already started this session
            const isStartedSession = sessionStorage.getItem(startKey) === 'true';
            const savedStartTime = parseInt(sessionStorage.getItem(`${startKey}_time`) || '0', 10);

            const hasSavedAnswers = Boolean(
              (data.saved_answers?.technical && Object.keys(data.saved_answers.technical).length > 0) ||
              data.saved_answers?.scenario ||
              data.saved_answers?.hands_on?.code ||
              data.saved_answers?.troubleshooting?.code
            );

            if (isStartedSession && savedStartTime > 0) {
              const elapsed = Math.floor((Date.now() - savedStartTime) / 1000);
              const remaining = Math.max(0, 45 * 60 - elapsed);
              setTimeLeft(remaining);
              setHasStarted(true);
            } else if (hasSavedAnswers) {
              setHasStarted(true);
            }
          }

          // Initialize hands-on code or practical template
          const handsOn = data.bundle.hands_on;
          const initialHandsLang = (handsOn?.supported_languages && handsOn.supported_languages.includes('python'))
            ? 'python'
            : (handsOn?.supported_languages?.[0] || 'javascript');
          setHandsOnLang(initialHandsLang);
          setHandsOnCode(handsOn?.starter_code?.[initialHandsLang] || handsOn?.starter_template || '');

          // Initialize troubleshooting code or practical template
          const trouble = data.bundle.troubleshooting;
          const initialTroubleLang = (trouble?.broken_code?.python) 
            ? 'python' 
            : (trouble?.supported_languages?.[0] || (trouble?.broken_code && Object.keys(trouble.broken_code)[0]) || 'javascript');
          setTroubleLang(initialTroubleLang);
          setTroubleCode(trouble?.broken_code?.[initialTroubleLang] || trouble?.broken_template || '');

          // Restore any existing saved answers if present
          if (data.saved_answers) {
            if (data.saved_answers.technical) setTechnicalAnswers(data.saved_answers.technical);
            if (data.saved_answers.scenario) {
              const firstScen = Object.values(data.saved_answers.scenario)[0];
              if (firstScen) setScenarioAnswer(firstScen);
            }
            if (data.saved_answers.hands_on?.code) {
              setHandsOnCode(data.saved_answers.hands_on.code);
              if (data.saved_answers.hands_on.language) setHandsOnLang(data.saved_answers.hands_on.language);
              if (data.saved_answers.hands_on.test_results) setHandsOnResults(data.saved_answers.hands_on.test_results);
            }
            if (data.saved_answers.troubleshooting?.code) {
              setTroubleCode(data.saved_answers.troubleshooting.code);
              if (data.saved_answers.troubleshooting.language) setTroubleLang(data.saved_answers.troubleshooting.language);
              if (data.saved_answers.troubleshooting.test_results) setTroubleResults(data.saved_answers.troubleshooting.test_results);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic assessment bundle:', err);
        const errMsg = err.response?.data?.detail || err.message || '';
        if (err.response?.status === 403 || errMsg.includes('403') || errMsg.toLowerCase().includes('restricted') || errMsg.toLowerCase().includes('screening')) {
          setAccessDeniedMessage(errMsg || "Assessment access restricted: Application is currently in recruiter screening.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAssessment();
    return () => { isMounted = false; };
  }, [candidateId, activeJob?.id, queryJobId, isPreviewMode]);

  // Live Countdown Timer Effect (Active once started)
  useEffect(() => {
    if (!hasStarted || submissionSuccess) return;
    // In Recruiter Preview Mode, do NOT auto-submit when timer reaches zero!
    if (isRecruiterTesting || isPreviewMode) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, submissionSuccess, isRecruiterTesting, isPreviewMode]);

  // Format seconds to MM:SS
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Assessment and begin countdown
  const handleStartEvaluation = () => {
    const targetJobId = activeJob?.id || currentInterviewSession?.jobId || candidates.find(c => c.id === candidateId)?.jobId;
    const startKey = `assessment_started_${candidateId}_${targetJobId || 'default'}`;
    sessionStorage.setItem(startKey, 'true');
    sessionStorage.setItem(`${startKey}_time`, String(Date.now()));
    setHasStarted(true);
    if (candidateId) {
      api.startAssessment(candidateId).catch(err => console.warn('startAssessment error:', err));
    }
  };

  // Handle switching language in Hands-on
  const handleHandsOnLangChange = (newLang) => {
    setHandsOnLang(newLang);
    const pId = activeProblem?.id || 'hands_on_problem';
    const newProbLangKey = `${pId}__${newLang}`;
    const existingDraft = problemState[newProbLangKey]?.code;
    const starterOrDraft = (existingDraft !== undefined && existingDraft !== null)
      ? existingDraft
      : getProblemStarter(activeProblem, newLang);

    setProblemState(prev => ({
      ...prev,
      [newProbLangKey]: {
        code: starterOrDraft,
        lang: newLang
      },
      [pId]: {
        ...(prev[pId] || {}),
        code: starterOrDraft,
        lang: newLang
      }
    }));
    if (pId === assessmentBundle?.hands_on?.id) {
      setHandsOnCode(starterOrDraft);
    }
  };

  // Handle switching language in Troubleshooting
  const handleTroubleLangChange = (newLang) => {
    setTroubleLang(newLang);
    const newCode = troubleshootingObj?.broken_code?.[newLang] ?? 
      assessmentBundle?.troubleshooting?.broken_code?.[newLang] ?? 
      generateDefaultStarter(newLang, 'fixDefect');
    if (newCode) {
      setTroubleCode(newCode);
    }
  };

  // Execute Hands-on Code / Validate Practical Deliverable
  const handleRunHandsOn = async () => {
    setIsRunningHandsOn(true);
    const isCoding = handsOnObj.is_coding !== false;
    const taskLang = isCoding ? handsOnLang : 'deliverable';
    setHandsOnConsole(isCoding ? `> Compiling and executing ${handsOnLang.toUpperCase()} test suite...\n` : `> Validating professional deliverable format and content...\n`);

    const res = await api.runCodeSandbox({
      candidate_id: candidateId,
      job_id: activeJob?.id,
      task_id: handsOnObj.id,
      category: 'hands_on',
      language: taskLang,
      code: handsOnCode
    });

    setHandsOnResults(res?.test_results || []);
    setHandsOnConsole(res?.console_output || '> Validation finished.');
    setHandsOnTelemetry({ execution_ms: res?.execution_ms, memory_mb: res?.memory_mb });
    setIsRunningHandsOn(false);
  };

  // Execute Troubleshooting Bug Fix / Validate Anomaly Resolution
  const handleRunTroubleshooting = async () => {
    setIsRunningTrouble(true);
    const isCoding = troubleshootingObj.is_coding !== false;
    const taskLang = isCoding ? troubleLang : 'deliverable';
    setTroubleConsole(isCoding ? `> Running regression verification in ${troubleLang.toUpperCase()}...\n` : `> Validating anomaly diagnosis and remediation plan...\n`);

    const res = await api.runCodeSandbox({
      candidate_id: candidateId,
      job_id: activeJob?.id,
      task_id: troubleshootingObj.id,
      category: 'troubleshooting',
      language: taskLang,
      code: troubleCode
    });

    setTroubleResults(res?.test_results || []);
    setTroubleConsole(res?.console_output || '> Validation finished.');
    setTroubleTelemetry({ execution_ms: res?.execution_ms, memory_mb: res?.memory_mb });
    setIsRunningTrouble(false);
  };

  // Final Submission across all 4 categories
  const handleFinalSubmit = async () => {
    if (!assessmentBundle) return;
    setIsSubmitting(true);

    const activeProb = activeProblem || {};
    const codingSubmissionsList = (codingProblems || []).map((prob) => {
      const pId = prob.id || prob.slug;
      const pState = problemState[pId] || {};
      const isCurrentActive = activeProb?.id === pId;
      const code = isCurrentActive ? (activeProbCode || handsOnCode || pState.code || '') : (pState.code || '');
      const language = isCurrentActive ? (handsOnLang || pState.lang || 'python') : (pState.lang || 'python');
      return {
        problem_id: pId,
        language: language,
        code: code
      };
    });

    const payload = {
      candidate_id: candidateId,
      job_id: activeJob?.id,
      technical_answers: technicalAnswers,
      scenario_answers: { [scenarioObj.id || 'scenario_1']: scenarioAnswer },
      hands_on_submission: {
        task_id: activeProb.id || handsOnObj.id || 'hands_on_problem',
        language: handsOnLang,
        code: activeProbCode || handsOnCode || '',
        test_results: activeProbResults || handsOnResults || []
      },
      troubleshooting_submission: {
        task_id: troubleshootingObj.id || 'troubleshooting_problem',
        language: troubleLang,
        code: troubleCode || '',
        test_results: troubleResults || []
      },
      coding_submissions: codingSubmissionsList
    };

    if (isRecruiterTesting) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmissionSuccess(true);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }, 500);
      return;
    }

    const res = await api.submitAssessment(candidateId, payload);
    setIsSubmitting(false);

    if (res?.success) {
      setSubmissionSuccess(true);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });

      await completeInterviewAndEvaluate({
        transcript: currentInterviewSession?.transcript || [],
        integrityScore: currentInterviewSession?.integrityScore || 100,
        integrityEvents: currentInterviewSession?.integrityEvents || [],
        codeScore: res.scores?.overall ?? 0,
        candidateId: candidateId,
        assessmentScores: res.scores
      });
      // Do not redirect to feedback / skill gap report - keep candidate on clear completion confirmation screen
    }
  };

  // Dynamic Role & Domain Detection
  const isNonTech = Boolean(
    (assessmentBundle?.domain_category && assessmentBundle.domain_category !== 'technical') ||
    assessmentBundle?.is_coding === false ||
    assessmentBundle?.hands_on?.is_coding === false ||
    (activeJob && (
      /finance|account|tax|audit|cpa|controller|treasur|bookkeep/i.test(activeJob.title || '') ||
      /finance|account/i.test(activeJob.department || '') ||
      /hr|human\s*resource|recruiter|talent|people/i.test(activeJob.title || '') ||
      /hr|human\s*resource/i.test(activeJob.department || '') ||
      /market|seo|content|copywrit|growth|brand/i.test(activeJob.title || '') ||
      /market/i.test(activeJob.department || '') ||
      /sales|business\s*dev|account\s*exec/i.test(activeJob.title || '') ||
      /sales/i.test(activeJob.department || '') ||
      /legal|compliance|counsel/i.test(activeJob.title || '') ||
      /operat|logistics|supply\s*chain/i.test(activeJob.title || '')
    ))
  );
  const isTechRole = !isNonTech;

  // Category Tabs metadata
  const categories = [
    { 
      id: 'technical', 
      label: isTechRole ? '1. Technical MCQs' : '1. Core Knowledge', 
      icon: FileQuestion, 
      count: assessmentBundle?.technical_mcqs?.length || 10 
    },
    { 
      id: 'scenario', 
      label: '2. Scenario', 
      icon: HelpCircle, 
      count: 1 
    },
    { 
      id: 'hands_on', 
      label: codingProblems.length > 1 ? `3. Coding Problems (${codingProblems.length})` : (isTechRole ? '3. Hands-on Coding' : '3. Practical Simulation'), 
      icon: isTechRole ? Code2 : Briefcase, 
      count: codingProblems.length || 1 
    },
    { 
      id: 'troubleshooting', 
      label: isTechRole ? '4. Troubleshooting' : '4. Anomaly Resolution', 
      icon: Wrench, 
      count: 1 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
          {isTechRole ? 'Calibrating Technical Assessment...' : 'Calibrating Role Assessment...'}
        </h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Dynamically pulling tailored 4-category challenge bundle for {activeJob?.title || 'this role'}.
        </p>
      </div>
    );
  }

  if (!candidateId && userRole === 'candidate') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-16 px-4 text-center">
        <div className="glass-card p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl relative space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
            <Briefcase className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">No Application Found</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Please apply to an active job opening first to unlock your role-specific technical assessment.
            </p>
          </div>
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
          >
            Browse Open Roles
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEDICATED SCREEN: CANDIDATE ASSESSMENT SUBMISSION CONFIRMATION
  // ─────────────────────────────────────────────────────────────────────────
  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-12 px-4 text-center animate-page-enter">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card relative overflow-hidden space-y-6 animate-modal-enter">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-subtle">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Assessment Completed</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Assessment Submitted Successfully
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed font-normal">
              Your assessment responses have been recorded and received. Your submission is now officially advancing through the recruitment evaluation process.
            </p>
          </div>

          {/* Current Application Status Card */}
          <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-[#14110F] border border-slate-200 dark:border-slate-800 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Application Status</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Under Review</span>
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeJob?.title || 'Applied Position'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeJob?.companyName || 'SparkX Technologies'}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-900/30 text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <span>
                Our hiring committee is reviewing your application alongside interview telemetry and assessment benchmarks. You will be notified regarding next steps.
              </span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isRecruiterTesting ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionSuccess(false);
                    setHasStarted(true);
                    setTimeLeft(45 * 60);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-subtle flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart Sandbox Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/assessment-studio')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Return to Assessment Studio</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/my-applications')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition shadow-subtle flex items-center justify-center space-x-2"
                >
                  <span>View My Applications</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
                >
                  Browse Open Positions
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESTRICTED ACCESS SCREEN (If candidate is in screening and not scheduled)
  // ─────────────────────────────────────────────────────────────────────────
  if (accessDeniedMessage || (!isRecruiterTesting && !isScheduledOrAdvanced)) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xl">
          <Lock className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Stage 1: 📋 Recruiter Screening
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Assessment Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Your application for <strong>{activeJob?.title || 'this position'}</strong> has been received and is currently in the recruiter screening pipeline.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Per company recruitment protocol, the 4-Pillar Assessment is locked until the recruiter reviews your application and schedules your evaluation slot.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/[0.08] text-left space-y-2.5 text-xs shadow-md max-w-md mx-auto">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.06] pb-2">
            <span className="font-semibold">Candidate Status</span>
            <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-[10px]">
              Stage 1: Screening
            </span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Applicant:</span>
            <span className="font-bold text-slate-900 dark:text-white">{activeCandidate?.name || currentUser?.name || 'Applicant'}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Target Role:</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">{activeJob?.title || 'Applied Position'}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Assessment:</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
              <span>⏳ Awaiting Recruiter Invitation</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/my-applications')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-2"
          >
            <span>View My Applications</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
          >
            Browse Openings
          </button>
        </div>
      </div>
    );
  }

  if (!assessmentBundle) {
    if (isRecruiterTesting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4 animate-page-enter">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto">
            <Code2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment Preview Unavailable</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            No assessment bundle loaded for {activeJob?.title ? <strong>{activeJob.title}</strong> : 'this role'}. You can configure and generate the challenge pool in the Assessment Studio.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(activeJob?.id ? `/recruiter/assessment-studio?job_id=${activeJob.id}` : '/recruiter/assessment-studio')}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition shadow-sm"
            >
              Open Assessment Studio →
            </button>
            <button
              onClick={() => navigate('/pipeline')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
            >
              Candidate Pipeline
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4 animate-page-enter">
        <Code2 className="w-12 h-12 text-slate-400 dark:text-slate-600" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Assessment Loaded</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Please apply for a job or start from the job catalog to initiate the assessment.
        </p>
        <button onClick={() => navigate('/jobs')}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition">
          Browse Jobs Catalog →
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERSTITIAL SCREEN: ASSESSMENT BRIEFING & START EVALUATION BUTTON
  // ─────────────────────────────────────────────────────────────────────────
  if (!hasStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 text-slate-900 dark:text-slate-100 animate-page-enter">
        {isRecruiterTesting && (
          <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-900 dark:text-stone-200 shadow-sm">
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              <span className="px-2.5 py-1 rounded-md bg-brand-600 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm">
                Recruiter Sandbox Preview
              </span>
              <span className="font-semibold">
                Simulating candidate assessment environment for <span className="underline decoration-brand-400 font-bold">{activeJob?.title || 'Selected Role'}</span>
              </span>
            </div>
            <button
              onClick={() => navigate('/recruiter/assessment-studio')}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Assessment Studio</span>
            </button>
          </div>
        )}
        {/* Header Hero */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E5E0DA] dark:border-[#2A2520] shadow-card relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {isTechRole ? 'Autonomous Technical Evaluation' : 'Autonomous Professional Evaluation'}
              </span>
              <span className="text-stone-400">•</span>
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{activeJob?.companyName || 'SparkX Technologies'}</span>
              <span className="text-stone-400">•</span>
              <span className="text-xs text-stone-500">{activeJob?.department || 'Engineering & Product'}</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
                {activeJob?.title || (isTechRole ? 'Software Engineer' : 'Professional Candidate')}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 font-normal">
                {isTechRole 
                  ? 'Comprehensive 4-Pillar Autonomous Engineering Evaluation calibrating technical architecture, hands-on coding, and bug troubleshooting.'
                  : 'Comprehensive 4-Pillar Professional Competency Evaluation calibrating domain standards, strategic scenarios, practical deliverables, and anomaly resolution.'}
              </p>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
                <div className="flex items-center space-x-1.5 text-brand-600 dark:text-brand-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Duration</span>
                </div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">45:00</div>
                <div className="text-xs text-stone-400">Timed countdown</div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
                <div className="flex items-center space-x-1.5 text-teal-600 dark:text-teal-400 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Structure</span>
                </div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100">4 Pillars</div>
                <div className="text-xs text-stone-400">End-to-end evaluation</div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
                <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Format</span>
                </div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100">Autonomous</div>
                <div className="text-xs text-stone-400">Real-time validation</div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520]">
                <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Telemetry</span>
                </div>
                <div className="text-base font-bold text-stone-900 dark:text-stone-100">AI Scoring</div>
                <div className="text-xs text-stone-400">Domain-weighted</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1 font-sans">
            Evaluation Curriculum & Structure
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pillar 1 */}
            <div className="p-5 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-card space-y-2.5 animate-fade-in-up stagger-1 interactive-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-semibold text-xs">
                  <FileQuestion className="w-4 h-4" />
                  <span>Pillar 1: {isTechRole ? 'Technical MCQs' : 'Core Knowledge & Principles'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {assessmentBundle.technical_mcqs?.length || 3} Questions
                </span>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-normal">
                {isTechRole 
                  ? 'Core computer science, architecture patterns, concurrency, and cloud infrastructure knowledge.'
                  : `Core domain standards, regulatory compliance, GAAP/IFRS principles, and operational best practices for ${activeJob?.title || 'this role'}.`}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-2.5 animate-fade-in-up stagger-2 interactive-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-semibold text-xs">
                  <HelpCircle className="w-4 h-4" />
                  <span>Pillar 2: Real-World Scenario</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Strategic Case
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {isTechRole
                  ? 'High-stakes architectural triage, trade-off evaluations, and resilient production systems strategy.'
                  : 'Critical operational scenario requiring structured root-cause analysis, corrective action steps, and internal governance safeguards.'}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-2.5 animate-fade-in-up stagger-3 interactive-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  {isTechRole ? <Code2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                  <span>Pillar 3: {isTechRole ? 'Hands-on Coding Sandbox' : 'Practical Task Simulation'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {isTechRole ? 'Live Tests' : 'Deliverable Validation'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {isTechRole
                  ? 'Write, test, and refine code in Python, JavaScript, Java, C++, TypeScript, or SQL with instant test suite assertions.'
                  : 'Draft structured professional deliverables (schedules, journal entries, balance reconciliations, or plans) with instant automated checks.'}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-2.5 animate-fade-in-up stagger-4 interactive-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  <Wrench className="w-4 h-4" />
                  <span>Pillar 4: {isTechRole ? 'Live Code Troubleshooting' : 'Anomaly Resolution & Remediation'}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Defect Triage
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                {isTechRole
                  ? 'Locate and fix defects in live buggy code with real-time regression verification until all invariants pass.'
                  : 'Isolate root cause from incident data and unrecorded variances, formulating actionable corrective and preventive remedies.'}
              </p>
            </div>
          </div>
        </div>

        {/* Readiness Instructions & Start Action Footer */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-card">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Assessment Guidelines & Timer Instructions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Clicking the button below will start the official <strong>45-minute countdown timer</strong>. You can navigate between all 4 sections freely and validate your solutions before final submission.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Play}
            iconRight={ArrowRight}
            onClick={handleStartEvaluation}
            className="shrink-0"
          >
            Start Evaluation & Begin Timer
          </Button>
        </div>
      </div>
    );
  }

  const getLanguageFileName = (lang) => {
    switch (lang.toLowerCase()) {
      case 'python': return 'solution.py';
      case 'javascript': return 'solution.js';
      case 'typescript': return 'solution.ts';
      case 'java': return 'Solution.java';
      case 'cpp': return 'solution.cpp';
      default: return `solution.${lang}`;
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16 text-slate-900 dark:text-slate-100">
      {isRecruiterTesting && (
        <div className="p-4 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-900 dark:text-stone-200 shadow-sm">
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <span className="px-2.5 py-1 rounded-md bg-brand-600 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm">
              Recruiter Preview Mode
            </span>
            <span className="font-semibold">
              Interactive Candidate Assessment Sandbox for <span className="underline decoration-brand-400 font-bold">{activeJob?.title || 'Selected Role'}</span>
            </span>
          </div>
          <button
            onClick={() => navigate('/recruiter/assessment-studio')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Assessment Studio</span>
          </button>
        </div>
      )}
      
      {/* Executive Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider font-sans">
              {isTechRole ? 'Technical Assessment' : 'Competency Assessment'}
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">{activeJob?.title || (isTechRole ? 'Software Engineering' : 'Professional Evaluation')}</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-xs text-stone-400 font-medium">{activeJob?.companyName || 'SparkX Technologies'}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5 font-display">
            {isTechRole ? '4-Pillar Engineering Evaluation' : '4-Pillar Professional Evaluation'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono-code shadow-subtle transition-colors ${
            timeLeft < 300 
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse' 
              : 'bg-stone-50 dark:bg-[#14110F] border border-[#E8E4DF] dark:border-[#2A2520] text-stone-700 dark:text-stone-300'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${timeLeft < 300 ? 'text-rose-500' : 'text-brand-600'}`} />
            <span className="font-semibold">Remaining: {formatTime(timeLeft)}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            icon={submissionSuccess ? CheckCircle2 : Check}
            onClick={handleFinalSubmit}
            disabled={isSubmitting || submissionSuccess}
          >
            {isSubmitting ? 'Evaluating...' : submissionSuccess ? 'Submitted!' : 'Submit All 4 Categories'}
          </Button>
        </div>
      </div>

      {/* 4 Category Navigation Tabs */}
      <div className="p-1.5 rounded-xl bg-[#FDFCFA] dark:bg-[#1A1714] border border-[#E8E4DF] dark:border-[#2A2520] flex items-center overflow-x-auto gap-1.5 shadow-card">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          let isAnswered = false;
          if (cat.id === 'technical') isAnswered = Object.keys(technicalAnswers).length > 0;
          if (cat.id === 'scenario') isAnswered = scenarioAnswer.trim().length > 20;
          if (cat.id === 'hands_on') isAnswered = handsOnResults !== null;
          if (cat.id === 'troubleshooting') isAnswered = troubleResults !== null;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-1 min-w-[150px] py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-between space-x-2 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-subtle'
                  : 'bg-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/70 dark:hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </div>
              {isAnswered && (
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-teal-200' : 'bg-emerald-500'}`} title="Answered / tested" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 1: TECHNICAL MCQs & CONCEPTS
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'technical' && (
        <div className="space-y-6 animate-fade-in-up" key="cat-technical">
          <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-semibold text-xs uppercase tracking-wider font-mono">
                <FileQuestion className="w-4 h-4" />
                <span>Part 1: {isTechRole ? 'Conceptual Technical Mastery' : 'Core Domain & Regulatory Knowledge'} ({assessmentBundle.technical_mcqs.length} Questions)</span>
              </div>
              <span className="text-xs text-slate-500">Auto-calibrated for {activeJob?.title || 'this role'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
              {isTechRole 
                ? 'Select the most technically accurate answer for each core computer science & architecture question.'
                : `Select the most accurate response for each ${activeJob?.title || 'domain'} standard practice and regulatory question.`}
            </p>
          </div>

          <div className="space-y-4">
            {assessmentBundle.technical_mcqs.map((q, idx) => (
              <div key={q.id} className="p-5 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center text-xs font-bold border border-brand-200 dark:border-brand-800 font-mono">
                      Q{idx+1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {q.question}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {q.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {Object.entries(q.options).map(([optKey, optText]) => {
                    const isSelected = technicalAnswers[q.id] === optKey;
                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => setTechnicalAnswers(prev => ({ ...prev, [q.id]: optKey }))}
                        className={`p-3 rounded-lg text-left text-xs transition-all duration-150 border flex items-start space-x-2.5 active:scale-[0.98] ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-950/70 border-brand-500 text-brand-900 dark:text-brand-200 ring-1 ring-brand-500/50 shadow-sm'
                            : 'bg-slate-50 dark:bg-[#14110F] hover:bg-white dark:hover:bg-stone-900/60 hover:border-stone-300 dark:hover:border-stone-700 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                          isSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {optKey}
                        </span>
                        <span className="leading-relaxed font-normal">{optText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('scenario')}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle"
            >
              <span>Next: Real-World Scenario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 2: SCENARIO (ARCHITECTURE & PROBLEM SOLVING)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'scenario' && (
        <div className="space-y-6 animate-fade-in-up" key="cat-scenario">
          <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-semibold text-xs uppercase tracking-wider font-mono">
                <HelpCircle className="w-4 h-4" />
                <span>Part 2: {isTechRole ? 'Real-World Engineering Scenario' : 'Real-World Professional Scenario'}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {scenarioObj.difficulty || 'Mid-Level'}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {scenarioObj.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-[#14110F] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {scenarioObj.prompt}
            </p>

            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Evaluation Guidance: </span>
                <span>{scenarioObj.guidance}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isTechRole ? 'Your Proposed Solution & Architecture:' : 'Your Proposed Analysis & Remediation Plan:'}
              </label>
              <textarea
                rows="8"
                value={scenarioAnswer}
                onChange={e => setScenarioAnswer(e.target.value)}
                placeholder={isTechRole 
                  ? "1. Root Cause Analysis: ...\n2. Immediate Production Mitigation: ...\n3. Long-Term Architecture & Monitoring: ..."
                  : "1. Root Cause & Materiality Analysis: ...\n2. Immediate Corrective Action: ...\n3. Internal Safeguards & Compliance Controls: ..."}
                className="w-full p-4 rounded-lg bg-white dark:bg-[#14110F] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed shadow-inner"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{isTechRole ? 'Structured responses covering root causes, mitigation, and resiliency score highest.' : 'Structured responses addressing accounting standards, journal impact, and governance score highest.'}</span>
                <span className="font-mono">{scenarioAnswer.length} characters</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('technical')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous: {isTechRole ? 'Technical MCQs' : 'Core Knowledge'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('hands_on')}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle"
            >
              <span>Next: {isTechRole ? 'Hands-on Coding Challenge' : 'Practical Task Simulation'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 3: MULTI-PROBLEM CODING SUITE (LEETCODE / DSA / PRACTICAL CHALLENGE)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'hands_on' && (activeProblem?.title || assessmentBundle?.hands_on) && (
        <div className="space-y-4 animate-fade-in-up" key="cat-hands_on">
          {/* Multi-Problem Switcher Bar */}
          {codingProblems.length > 1 && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1714] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono shrink-0">Coding Problems:</span>
                {codingProblems.map((prob, idx) => {
                  const isActive = idx === activeProblemIdx;
                  const probState = problemState[prob.id];
                  const isSolved = probState?.results?.length > 0 && probState?.results?.every(r => r.passed);
                  return (
                    <button
                      key={prob.id}
                      type="button"
                      onClick={() => setActiveProblemIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition shrink-0 ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                      }`}
                    >
                      {isSolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Code2 className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      )}
                      <span>{prob.title}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-mono font-bold tracking-wide transition-colors ${
                        isActive
                          ? 'bg-white/25 text-white border border-white/30'
                          : (prob.difficulty === 'Easy'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : (prob.difficulty === 'Hard' || prob.difficulty === 'Senior'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  : 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700'))
                      }`}>
                        {prob.difficulty}
                      </span>
                      {prob.platform && (
                        <span className="text-[10px] opacity-75 capitalize">
                          ({prob.platform})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500 shrink-0">
                <span>Completed:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {codingProblems.filter(p => problemState[p.id]?.results?.length > 0 && problemState[p.id]?.results?.every(r => r.passed)).length} / {codingProblems.length}
                </span>
              </div>
            </div>
          )}

          {activeProblem.is_coding !== false ? (
            <CandidateIDE
              taskId={activeProblem.id}
              taskTitle={activeProblem.title}
              difficulty={activeProblem.difficulty || 'Mid-Level'}
              instructions={activeProblem.instructions}
              examples={activeProblem.examples || []}
              constraints={activeProblem.constraints || []}
              functionSignatures={activeProblem.function_signature || {}}
              supportedLanguages={problemSupportedLanguages}
              starterCodes={activeProblem.starter_code || {}}
              code={activeProbCode}
              language={handsOnLang}
              sampleTestCases={activeProblem.sample_test_cases || []}
              onCodeChange={handleActiveProblemCodeChange}
              onLanguageChange={handleHandsOnLangChange}
              onRunSampleTests={handleRunActiveProblem}
              onRunCustomTest={async (customInput) => {
                return await api.runCodeSandbox({
                  candidate_id: candidateId,
                  job_id: activeJob?.id,
                  task_id: activeProblem.id,
                  category: 'hands_on',
                  language: handsOnLang,
                  code: activeProbCode,
                  custom_input: customInput,
                  is_custom_test: true
                });
              }}
              isExecuting={isRunningHandsOn}
              sampleResults={activeProbResults}
              consoleOutput={activeProbConsole}
              executionTelemetry={activeProbTelemetry}
              storageKeyPrefix={`hands_on_${candidateId}_${activeProblem.id}`}
              schemaDdl={activeProblem?.schema_ddl || ''}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Problem Statement & Requirements (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
                      <Briefcase className="w-4 h-4" />
                      <span>Part 3: Hands-on Deliverable</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {handsOnObj.difficulty || 'Professional'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {handsOnObj.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                    {handsOnObj.instructions}
                  </p>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Key Deliverable Checkpoints:
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {handsOnObj.test_cases?.map((tc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] text-[11px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{tc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Exp: {tc.expected}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Practical Deliverable Workspace (8 Cols) */}
              <div className="lg:col-span-8 space-y-4 flex flex-col">
                <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col shadow-2xl">
                  <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#06080E] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      deliverable_submission.doc
                    </span>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                      <span>Word Count: <strong className="text-slate-700 dark:text-slate-200">{handsOnCode.trim().split(/\s+/).filter(Boolean).length}</strong> words</span>
                    </div>
                  </div>

                  <textarea
                    value={handsOnCode}
                    onChange={e => setHandsOnCode(e.target.value)}
                    placeholder="Draft your professional deliverable, analysis, structured tables, or recommendations here..."
                    className="w-full h-72 p-4 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 font-sans border-0 focus:ring-0"
                  />

                  <div className="p-3 bg-slate-100 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Validate deliverable structure before submitting.</span>
                    <button
                      type="button"
                      onClick={handleRunHandsOn}
                      disabled={isRunningHandsOn}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      {isRunningHandsOn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isRunningHandsOn ? "Validating..." : "Validate Deliverable"}</span>
                    </button>
                  </div>
                </div>

                {/* Validation Telemetry */}
                <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] p-4 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-white/[0.06] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-brand-400" />
                      <span>Deliverable Validation Telemetry</span>
                    </div>
                    {handsOnResults && (
                      <span className="text-emerald-500 font-bold text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{handsOnResults.filter(r => r.passed).length}/{handsOnResults.length} Requirements Validated</span>
                      </span>
                    )}
                  </div>
                  <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl min-h-[90px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    {handsOnConsole || '// Click "Validate Deliverable" to check completeness...'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('scenario')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous: Scenario</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('troubleshooting')}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-subtle"
            >
              <span>Next: {isTechRole ? 'Code Troubleshooting' : 'Anomaly Resolution'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 4: TROUBLESHOOTING & ANOMALY RESOLUTION
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'troubleshooting' && (
        <div className="space-y-6 animate-fade-in-up" key="cat-troubleshooting">
          {troubleshootingObj.is_coding !== false ? (
            <CandidateIDE
              taskId={troubleshootingObj.id}
              taskTitle={troubleshootingObj.title}
              difficulty={troubleshootingObj.difficulty || 'Mid-Level'}
              instructions={troubleshootingObj.bug_description}
              examples={troubleshootingObj.examples || []}
              constraints={troubleshootingObj.constraints || []}
              functionSignatures={troubleshootingObj.function_signature || {}}
              supportedLanguages={troubleSupportedLanguages}
              starterCodes={troubleshootingObj.broken_code || {}}
              code={troubleCode}
              language={troubleLang}
              sampleTestCases={troubleshootingObj.sample_test_cases || troubleshootingObj.test_cases || []}
              onCodeChange={setTroubleCode}
              onLanguageChange={handleTroubleLangChange}
              onRunSampleTests={handleRunTroubleshooting}
              onRunCustomTest={async (customInput) => {
                return await api.runCodeSandbox({
                  candidate_id: candidateId,
                  job_id: activeJob?.id,
                  task_id: troubleshootingObj.id,
                  category: 'troubleshooting',
                  language: troubleLang,
                  code: troubleCode,
                  custom_input: customInput,
                  is_custom_test: true
                });
              }}
              isExecuting={isRunningTrouble}
              sampleResults={troubleResults}
              consoleOutput={troubleConsole}
              executionTelemetry={troubleTelemetry}
              storageKeyPrefix={`trouble_${candidateId}`}
              schemaDdl={troubleshootingObj.schema_ddl || ''}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Defect Description & Invariants (4 Cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
                      <Wrench className="w-4 h-4" />
                      <span>Part 4: Anomaly Diagnosis & Remediation</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Triage & Remediation
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {troubleshootingObj.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                    {troubleshootingObj.bug_description}
                  </p>

                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                    <div className="font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>Your Objective:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Investigate the anomaly briefing, isolate root cause, and document your complete corrective action plan.
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Investigation Checkpoints:
                    </span>
                    <div className="mt-2 space-y-1.5">
                      {troubleshootingObj.test_cases?.map((tc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] text-[11px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{tc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Exp: {tc.expected}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Anomaly Resolution Workspace (8 Cols) */}
              <div className="lg:col-span-8 space-y-4 flex flex-col">
                <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col shadow-2xl">
                  <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#06080E] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      remediation_action_plan.txt
                    </span>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                      <span>Word Count: <strong className="text-slate-700 dark:text-slate-200">{troubleCode.trim().split(/\s+/).filter(Boolean).length}</strong> words</span>
                    </div>
                  </div>

                  <textarea
                    value={troubleCode}
                    onChange={e => setTroubleCode(e.target.value)}
                    placeholder="Identify the anomaly root cause, affected processes, and step-by-step corrective actions..."
                    className="w-full h-72 p-4 text-xs sm:text-sm focus:outline-none resize-none leading-relaxed bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 font-sans border-0 focus:ring-0"
                  />

                  <div className="p-3 bg-slate-100 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Validate your anomaly resolution plan before finalizing submission.</span>
                    <button
                      type="button"
                      onClick={handleRunTroubleshooting}
                      disabled={isRunningTrouble}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      {isRunningTrouble ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isRunningTrouble ? "Validating Plan..." : "Validate Resolution"}</span>
                    </button>
                  </div>
                </div>

                {/* Diagnostic Telemetry */}
                <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] p-4 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-white/[0.06] pb-2">
                    <div className="flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-brand-400" />
                      <span>Diagnostic Telemetry</span>
                    </div>
                    {troubleResults && (
                      <span className="text-emerald-500 font-bold text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{troubleResults.filter(r => r.passed).length}/{troubleResults.length} Checkpoints Verified</span>
                      </span>
                    )}
                  </div>
                  <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl min-h-[90px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    {troubleConsole || '// Click "Validate Resolution" to verify your diagnostic proposal...'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('hands_on')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous: {isTechRole ? 'Hands-on Coding' : 'Practical Deliverable'}</span>
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting || submissionSuccess}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-subtle transition flex items-center space-x-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              )}
              <span>{isSubmitting ? 'Evaluating Full Assessment...' : 'Finalize & Submit All 4 Categories'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
