import React, { useState, useEffect } from 'react';
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
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CodeAssessment() {
  const { 
    activeJob, 
    currentUser,
    candidates,
    currentInterviewSession, 
    completeInterviewAndEvaluate,
    setCurrentView 
  } = useRecruitment();

  // Resolve candidate ID
  const candidateId = currentInterviewSession?.candidateId || 
    candidates.find(c => c.email === currentUser?.email)?.id || 
    candidates[0]?.id || 
    'cand-001';

  // 4 Categories: 'technical' | 'scenario' | 'hands_on' | 'troubleshooting'
  const [activeCategory, setActiveCategory] = useState('technical');
  const [assessmentBundle, setAssessmentBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

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

  // Category 4: Troubleshooting state
  const [troubleLang, setTroubleLang] = useState('python');
  const [troubleCode, setTroubleCode] = useState('');
  const [isRunningTrouble, setIsRunningTrouble] = useState(false);
  const [troubleResults, setTroubleResults] = useState(null);
  const [troubleConsole, setTroubleConsole] = useState('');

  // Fetch dynamic assessment from backend
  useEffect(() => {
    let isMounted = true;

    async function loadAssessment() {
      setIsLoading(true);
      try {
        const targetJobId = activeJob?.id || currentInterviewSession?.jobId || candidates.find(c => c.id === candidateId)?.jobId;
        const data = await api.getAssessment(candidateId, targetJobId);
        if (isMounted && data?.bundle) {
          setAssessmentBundle(data.bundle);

          // Initialize hands-on code
          const handsOn = data.bundle.hands_on;
          const initialHandsLang = (handsOn?.supported_languages && handsOn.supported_languages.includes('python'))
            ? 'python'
            : (handsOn?.supported_languages?.[0] || 'javascript');
          setHandsOnLang(initialHandsLang);
          setHandsOnCode(handsOn?.starter_code?.[initialHandsLang] || '');

          // Initialize troubleshooting code
          const trouble = data.bundle.troubleshooting;
          const initialTroubleLang = (trouble?.broken_code?.python) ? 'python' : 'javascript';
          setTroubleLang(initialTroubleLang);
          setTroubleCode(trouble?.broken_code?.[initialTroubleLang] || '');

          // Restore any existing saved answers if present
          if (data.saved_answers) {
            if (data.saved_answers.technical) setTechnicalAnswers(data.saved_answers.technical);
            if (data.saved_answers.scenario) {
              const firstScen = Object.values(data.saved_answers.scenario)[0];
              if (firstScen) setScenarioAnswer(firstScen);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic assessment bundle:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAssessment();
    return () => { isMounted = false; };
  }, [candidateId, activeJob?.id]);

  // Handle switching language in Hands-on
  const handleHandsOnLangChange = (newLang) => {
    setHandsOnLang(newLang);
    if (assessmentBundle?.hands_on?.starter_code?.[newLang]) {
      setHandsOnCode(assessmentBundle.hands_on.starter_code[newLang]);
    }
  };

  // Handle switching language in Troubleshooting
  const handleTroubleLangChange = (newLang) => {
    setTroubleLang(newLang);
    if (assessmentBundle?.troubleshooting?.broken_code?.[newLang]) {
      setTroubleCode(assessmentBundle.troubleshooting.broken_code[newLang]);
    }
  };

  // Execute Hands-on Code
  const handleRunHandsOn = async () => {
    setIsRunningHandsOn(true);
    setHandsOnConsole(`> Compiling and executing ${handsOnLang.toUpperCase()} test suite...\n`);

    const res = await api.runCodeSandbox({
      candidate_id: candidateId,
      job_id: activeJob?.id,
      task_id: assessmentBundle.hands_on.id,
      category: 'hands_on',
      language: handsOnLang,
      code: handsOnCode
    });

    setHandsOnResults(res.test_results);
    setHandsOnConsole(res.console_output);
    setIsRunningHandsOn(false);

    if (res.all_passed) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  // Execute Troubleshooting Bug Fix
  const handleRunTroubleshooting = async () => {
    setIsRunningTrouble(true);
    setTroubleConsole(`> Running regression verification in ${troubleLang.toUpperCase()}...\n`);

    const res = await api.runCodeSandbox({
      candidate_id: candidateId,
      job_id: activeJob?.id,
      task_id: assessmentBundle.troubleshooting.id,
      category: 'troubleshooting',
      language: troubleLang,
      code: troubleCode
    });

    setTroubleResults(res.test_results);
    setTroubleConsole(res.console_output);
    setIsRunningTrouble(false);

    if (res.all_passed) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }
  };

  // Final Submission across all 4 categories
  const handleFinalSubmit = async () => {
    if (!assessmentBundle) return;
    setIsSubmitting(true);

    const payload = {
      candidate_id: candidateId,
      job_id: activeJob?.id,
      technical_answers: technicalAnswers,
      scenario_answers: { [assessmentBundle.scenario.id]: scenarioAnswer },
      hands_on_submission: {
        task_id: assessmentBundle.hands_on.id,
        language: handsOnLang,
        code: handsOnCode,
        test_results: handsOnResults || []
      },
      troubleshooting_submission: {
        task_id: assessmentBundle.troubleshooting.id,
        language: troubleLang,
        code: troubleCode,
        test_results: troubleResults || []
      }
    };

    const res = await api.submitAssessment(candidateId, payload);
    setIsSubmitting(false);

    if (res?.success) {
      setSubmissionSuccess(true);
      if ((res.scores?.overall || 0) >= 70) {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      }

      await completeInterviewAndEvaluate({
        transcript: currentInterviewSession?.transcript || [],
        integrityScore: currentInterviewSession?.integrityScore || 100,
        integrityEvents: currentInterviewSession?.integrityEvents || [],
        codeScore: res.scores?.overall ?? 0,
        candidateId: candidateId,
        assessmentScores: res.scores
      });

      const hasInterviewed = Boolean(
        (currentInterviewSession?.transcript && currentInterviewSession.transcript.length > 0) ||
        (activeCandidate?.interviewStatus === 'Interview Completed')
      );
      setTimeout(() => {
        setCurrentView(hasInterviewed ? 'feedback' : 'interview');
      }, 1600);
    }
  };

  // Category Tabs metadata
  const categories = [
    { id: 'technical', label: '1. Technical', icon: FileQuestion, count: assessmentBundle?.technical_mcqs?.length || 3 },
    { id: 'scenario', label: '2. Scenario', icon: HelpCircle, count: 1 },
    { id: 'hands_on', label: '3. Hands-on', icon: Code2, count: 1 },
    { id: 'troubleshooting', label: '4. Troubleshooting', icon: Wrench, count: 1 },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">Calibrating Technical Assessment...</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Dynamically pulling tailored 4-category challenge bundle for {activeJob?.title || 'this role'}.
        </p>
      </div>
    );
  }

  if (!assessmentBundle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <Code2 className="w-12 h-12 text-slate-400 dark:text-slate-600" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Assessment Loaded</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Please apply for a job or start from the job catalog to initiate the assessment.
        </p>
        <button onClick={() => setCurrentView('candidate')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition">
          Browse Jobs Catalog →
        </button>
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
    <div className="space-y-6 pb-16 text-slate-900 dark:text-slate-100">
      
      {/* Executive Header */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-white/[0.08] shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Comprehensive Technical Assessment
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{activeJob?.title || 'Software Engineering'}</span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500">{activeJob?.companyName || 'SparkX Technologies'}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">4-Pillar Engineering Evaluation</h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-slate-300 font-mono shadow-sm">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Time Remaining: 38:45</span>
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={isSubmitting || submissionSuccess}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:opacity-95 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : submissionSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Evaluating...' : submissionSuccess ? 'Submitted!' : 'Submit All 4 Categories'}</span>
          </button>
        </div>
      </div>

      {/* 4 Category Navigation Tabs */}
      <div className="glass-card p-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] flex items-center overflow-x-auto space-x-1.5 shadow-sm">
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
              className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between space-x-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </div>
              {isAnswered && (
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`} title="Answered / tested" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 1: TECHNICAL MCQs & CONCEPTS
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'technical' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <FileQuestion className="w-4 h-4" />
                <span>Part 1: Conceptual Technical Mastery ({assessmentBundle.technical_mcqs.length} Questions)</span>
              </div>
              <span className="text-xs text-slate-500">Auto-calibrated for {activeJob?.title || 'this role'}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select the most technically accurate answer for each core computer science & architecture question.
            </p>
          </div>

          <div className="space-y-4">
            {assessmentBundle.technical_mcqs.map((q, idx) => (
              <div key={q.id} className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                      Q{idx+1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                      {q.question}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
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
                        className={`p-3 rounded-xl text-left text-xs transition border flex items-start space-x-2.5 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500 shadow-sm'
                            : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {optKey}
                        </span>
                        <span className="leading-relaxed">{optText}</span>
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
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
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Part 2: Real-World Engineering Scenario</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {assessmentBundle.scenario.difficulty}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {assessmentBundle.scenario.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-[#06080E] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.06]">
              {assessmentBundle.scenario.prompt}
            </p>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start space-x-2">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Evaluation Guidance: </span>
                <span>{assessmentBundle.scenario.guidance}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Your Proposed Solution & Architecture:
              </label>
              <textarea
                rows="8"
                value={scenarioAnswer}
                onChange={e => setScenarioAnswer(e.target.value)}
                placeholder="1. Root Cause Analysis: ...&#10;2. Immediate Production Mitigation: ...&#10;3. Long-Term Architecture & Monitoring: ..."
                className="w-full p-4 rounded-2xl bg-white dark:bg-[#06080E] border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Structured responses covering root causes, mitigation, and resiliency score highest.</span>
                <span>{scenarioAnswer.length} characters</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('technical')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous: Technical MCQs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('hands_on')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
            >
              <span>Next: Hands-on Coding Challenge</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 3: HANDS-ON CODING (MULTI-LANGUAGE SANDBOX)
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'hands_on' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Problem Statement & Test Cases (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Code2 className="w-4 h-4" />
                    <span>Part 3: Practical Coding</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {assessmentBundle.hands_on.difficulty}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {assessmentBundle.hands_on.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                  {assessmentBundle.hands_on.instructions}
                </p>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Suite Assertions:</span>
                  <div className="mt-2 space-y-1.5">
                    {assessmentBundle.hands_on.test_cases?.map((tc, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] text-[11px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{tc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Exp: {tc.expected}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Multi-Language Editor & Execution Sandbox (8 Cols) */}
            <div className="lg:col-span-8 space-y-4 flex flex-col">
              <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Editor Bar with Language Selector */}
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#06080E] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 ml-2">
                      {getLanguageFileName(handsOnLang)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Multi-Language Dropdown */}
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Language:</span>
                      <select
                        value={handsOnLang}
                        onChange={e => handleHandsOnLangChange(e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:outline-none"
                      >
                        {(assessmentBundle.hands_on.supported_languages || ['python', 'javascript', 'typescript', 'java', 'cpp']).map(l => (
                          <option key={l} value={l}>
                            {l === 'python' ? 'Python (3.11)' : 
                             l === 'javascript' ? 'JavaScript (ES6+)' :
                             l === 'typescript' ? 'TypeScript' :
                             l === 'java' ? 'Java (OpenJDK 17)' :
                             l === 'cpp' ? 'C++ (GCC 11)' : l}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHandsOnLangChange(handsOnLang)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px] flex items-center space-x-1 transition px-2 py-1 rounded-md"
                      title="Reset boilerplate"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Code Textarea */}
                <textarea
                  value={handsOnCode}
                  onChange={e => setHandsOnCode(e.target.value)}
                  spellCheck="false"
                  className="w-full h-72 p-4 bg-slate-950 text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed selection:bg-indigo-900 shadow-inner"
                />

                <div className="p-3 bg-slate-100 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Press Run Tests to verify assertions in the live sandbox.</span>
                  <button
                    type="button"
                    onClick={handleRunHandsOn}
                    disabled={isRunningHandsOn}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-600/25"
                  >
                    {isRunningHandsOn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isRunningHandsOn ? "Executing..." : "Run Tests"}</span>
                  </button>
                </div>
              </div>

              {/* Console & Execution Output */}
              <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-white/[0.06] pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Execution Output & Diagnostics</span>
                  </div>
                  {handsOnResults && (
                    <span className="text-emerald-500 font-bold text-[11px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{handsOnResults.filter(r => r.passed).length}/{handsOnResults.length} Tests Passed</span>
                    </span>
                  )}
                </div>

                <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl min-h-[90px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {handsOnConsole || '// Click "Run Tests" to execute your solution in the browser sandbox...'}
                </pre>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('scenario')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous: Scenario</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('troubleshooting')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
            >
              <span>Next: Troubleshooting Bug-Fix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          CATEGORY 4: TROUBLESHOOTING & DEBUGGING
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeCategory === 'troubleshooting' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Defect Description & Invariants (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-card p-5 rounded-3xl border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Wrench className="w-4 h-4" />
                    <span>Part 4: Live Troubleshooting</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Defect Isolation
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {assessmentBundle.troubleshooting.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {assessmentBundle.troubleshooting.bug_description}
                </p>

                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1.5">
                  <div className="font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Your Objective:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Inspect the buggy code on the right, identify the defect, patch it directly, and run the regression tests until all assertions pass.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regression Test Suite:</span>
                  <div className="mt-2 space-y-1.5">
                    {assessmentBundle.troubleshooting.test_cases?.map((tc, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#06080E] border border-slate-200 dark:border-white/[0.06] text-[11px]">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{tc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Exp: {tc.expected}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Code Debugger & Regression Suite (8 Cols) */}
            <div className="lg:col-span-8 space-y-4 flex flex-col">
              <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Editor Bar */}
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-[#06080E] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 ml-2">
                      patch_fix.{troubleLang === 'python' ? 'py' : troubleLang === 'javascript' ? 'js' : troubleLang}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Language:</span>
                      <select
                        value={troubleLang}
                        onChange={e => handleTroubleLangChange(e.target.value)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 focus:outline-none"
                      >
                        {['python', 'javascript', 'typescript', 'java', 'cpp'].map(l => (
                          <option key={l} value={l}>
                            {l === 'python' ? 'Python' : l === 'javascript' ? 'JavaScript' : l === 'typescript' ? 'TypeScript' : l === 'java' ? 'Java' : 'C++'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTroubleLangChange(troubleLang)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px] flex items-center space-x-1 transition px-2 py-1 rounded-md"
                      title="Reset buggy boilerplate"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Buggy Code</span>
                    </button>
                  </div>
                </div>

                {/* Buggy Code Textarea */}
                <textarea
                  value={troubleCode}
                  onChange={e => setTroubleCode(e.target.value)}
                  spellCheck="false"
                  className="w-full h-72 p-4 bg-slate-950 text-amber-200 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed selection:bg-indigo-900 shadow-inner"
                />

                <div className="p-3 bg-slate-100 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Run regression tests to verify that your patch fixes the defect.</span>
                  <button
                    type="button"
                    onClick={handleRunTroubleshooting}
                    disabled={isRunningTrouble}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-amber-600/25"
                  >
                    {isRunningTrouble ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isRunningTrouble ? "Verifying Patch..." : "Run Regression Tests"}</span>
                  </button>
                </div>
              </div>

              {/* Console Output */}
              <div className="glass-card rounded-3xl border border-slate-200 dark:border-white/[0.08] p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-200 dark:border-white/[0.06] pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Regression Suite Output</span>
                  </div>
                  {troubleResults && (
                    <span className="text-emerald-500 font-bold text-[11px] flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{troubleResults.filter(r => r.passed).length}/{troubleResults.length} Regressions Resolved</span>
                    </span>
                  )}
                </div>

                <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3.5 rounded-2xl min-h-[90px] overflow-x-auto whitespace-pre-wrap border border-slate-800">
                  {troubleConsole || '// Click "Run Regression Tests" to verify your fix...'}
                </pre>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setActiveCategory('hands_on')}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous: Hands-on</span>
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting || submissionSuccess}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/35 transition flex items-center space-x-2"
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
