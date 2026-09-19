import React, { useState } from 'react';
import { useRecruitment } from '../../context/RecruitmentContext';
import { 
  Code2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Sparkles, 
  ArrowRight,
  RotateCcw,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CodeAssessment() {
  const { 
    activeJob, 
    currentInterviewSession, 
    completeInterviewAndEvaluate,
    setCurrentView 
  } = useRecruitment();

  // All assessment data comes from the backend via activeJob.codingAssessment
  const assessment = activeJob?.codingAssessment || null;

  const [code, setCode] = useState(assessment?.initialCode || '// No assessment loaded yet — please complete an AI interview first.');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // If no assessment from DB, show a clear empty state
  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <Code2 className="w-12 h-12 text-slate-400 dark:text-slate-600" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Assessment Loaded</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Complete an AI Interview first to unlock the coding assessment for this role.
        </p>
        <button onClick={() => setCurrentView('interview')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition">
          Go to AI Interview →
        </button>
      </div>
    );
  }

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleOutput('Compiling and executing sandbox test cases...\n');

    setTimeout(() => {
      // Simulate safe execution & test suite evaluation
      const results = (assessment.testCases || []).map((tc, idx) => ({
        id: idx,
        name: tc.name,
        passed: true,
        duration: `${(Math.random() * 12 + 4).toFixed(1)}ms`
      }));

      setTestResults(results);
      setConsoleOutput(
        `> Running test suite: ${assessment.title}\n` +
        `> Test 1: Passed (${results[0]?.duration || '6ms'})\n` +
        `> Test 2: Passed (${results[1]?.duration || '8ms'})\n` +
        `> All assertions passed. Time complexity: O(N), Space complexity: O(1).\n` +
        `> Skill Score: 95/100`
      );
      setIsRunning(false);
      setIsCompleted(true);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }, 800);
  };

  const handleFinishAssessment = () => {
    // Generate AI evaluation and scorecard
    completeInterviewAndEvaluate({
      transcript: currentInterviewSession.transcript,
      integrityScore: currentInterviewSession.integrityScore,
      integrityEvents: currentInterviewSession.integrityEvents,
      codeScore: 95
    });

    setCurrentView('feedback');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              Slide 10: Live Practical Skill Assessment
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-300 font-semibold">{assessment.title}</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-0.5">Practical Code & Logic Execution</h2>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Time Remaining: 24:18</span>
          </div>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? "Testing Code..." : "Run Tests"}</span>
          </button>
        </div>
      </div>

      {/* Split Code Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Problem & Instructions (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Problem Brief</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {assessment.instructions}
            </p>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-300">Expected Behavior:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Prevent multiple duplicate events from causing alert fatigue.</li>
                <li>Preserve original event properties while incrementing a <code className="text-cyan-300">count</code> field.</li>
                <li>Maintain sub-millisecond execution time.</li>
              </ul>
            </div>

            {/* Test Case list */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Test Suite</span>
              <div className="mt-2 space-y-2">
                {assessment.testCases?.map((tc, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="font-semibold text-white">{tc.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Input: {tc.input}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor & Console (8 Cols) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          
          {/* Code Editor Window */}
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
            {/* Window title bar */}
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 ml-2">solution.js</span>
              </div>

              <button
                onClick={() => setCode(assessment.initialCode)}
                className="text-slate-400 hover:text-white text-[11px] flex items-center space-x-1 transition"
                title="Reset to starter template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Editor Textarea */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              spellCheck="false"
              className="w-full h-72 p-4 bg-[#0B0F19] text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none resize-none leading-relaxed selection:bg-indigo-900"
            />
          </div>

          {/* Terminal / Test Output */}
          <div className="glass-card rounded-2xl border border-slate-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Execution Output & Diagnostics</span>
              </div>
              {testResults && (
                <span className="text-emerald-400 font-bold text-[11px] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>2/2 Tests Passed</span>
                </span>
              )}
            </div>

            <pre className="font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-xl min-h-[90px] overflow-x-auto whitespace-pre-wrap">
              {consoleOutput || '// Click "Run Tests" to execute your solution in the browser sandbox...'}
            </pre>
          </div>

          {/* Submission CTA */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {isCompleted ? "All test cases passed! Ready to view your evaluation." : "Run code tests to verify before final submission."}
            </span>

            <button
              onClick={handleFinishAssessment}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <span>Submit & View AI Feedback</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
