import React, { useState } from 'react';
import { 
  Code2, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  FileCode, 
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  Zap,
  Lock,
  Globe,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Card, Badge, StatusBadge, Button } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';
import api from '../../../services/api';

// ─── Helper: format a timestamp nicely ───────────────────────────────────────
function fmtTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

// ─── Helper: status label + color for eval status ────────────────────────────
function evalStatusBadge(status) {
  const map = {
    invited:     { label: 'Invited',           cls: 'bg-brand-500/10 text-brand-600 dark:text-brand-400' },
    in_progress: { label: 'In Progress',        cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    submitted:   { label: 'Submitted',          cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    evaluated:   { label: 'Evaluated',          cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  };
  const def = map[status] || { label: status || 'Not Started', cls: 'bg-slate-500/10 text-slate-500' };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${def.cls}`}>{def.label}</span>;
}

// ─── Test result row ──────────────────────────────────────────────────────────
function TestRow({ tc, isHidden }) {
  const [open, setOpen] = useState(false);
  if (!tc) return null;
  return (
    <div className={`rounded-xl border text-xs transition-all ${
      tc.passed
        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-950/20'
        : 'border-rose-200 dark:border-rose-800/50 bg-rose-50/30 dark:bg-rose-950/20'
    }`}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 gap-2 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {tc.passed
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            : <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {isHidden ? `🔒 Hidden Test ${tc.id || ''}` : (tc.name || `Test ${tc.id}`)}
          </span>
          {tc.status === 'Pending Manual Review' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0">MANUAL REVIEW</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400">{tc.duration || '—'}</span>
          {open ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
          {tc.input !== undefined && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-16 shrink-0">Input:</span>
              <code className="text-slate-700 dark:text-slate-300 text-[10px] font-mono break-all">{String(tc.input || '(none)')}</code>
            </div>
          )}
          {!isHidden && tc.expected !== undefined && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-16 shrink-0">Expected:</span>
              <code className="text-slate-700 dark:text-slate-300 text-[10px] font-mono break-all">{String(tc.expected || '—')}</code>
            </div>
          )}
          {tc.actual !== undefined && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-16 shrink-0">Actual:</span>
              <code className={`text-[10px] font-mono break-all ${tc.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {String(tc.actual || '—')}
              </code>
            </div>
          )}
          {tc.error && (
            <div className="flex gap-2">
              <span className="text-slate-500 w-16 shrink-0">Error:</span>
              <code className="text-rose-600 dark:text-rose-400 text-[10px] font-mono break-all">{tc.error}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category score bar ───────────────────────────────────────────────────────
function ScoreBar({ label, score, max = 100, color = 'bg-brand-500' }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
        <span className="font-bold text-slate-900 dark:text-white">{score}<span className="text-slate-400 font-normal">/{max}</span></span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AssessmentEvidenceTab({ candidate, onInviteAssessment }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);

  // ── Read real evaluation data from candidate.coding_results ──────────────
  const codingResults = candidate.coding_results || {};
  const assessData   = candidate.assessment_data || {};
  const categoryScores = assessData.category_scores || codingResults.category_scores || {};
  const handsOnRes   = codingResults.hands_on   || {};
  const troubleRes   = codingResults.troubleshooting || {};
  const externalRes  = candidate.external_assessment_result || null;
  const externalPlatform = candidate.external_assessment_platform || null;

  const overallScore = categoryScores.overall ?? candidate.coding_score ?? candidate.scores?.technicalScore ?? null;
  const techScore    = categoryScores.technical  ?? null;
  const scenScore    = categoryScores.scenario   ?? null;
  const handsScore   = categoryScores.hands_on   ?? null;
  const troubleScore = categoryScores.troubleshooting ?? null;

  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);
  const problemList = codingResults.problems || [];
  const currentProblem = problemList[selectedProblemIdx] || null;

  const handsLang    = (currentProblem ? currentProblem.language : handsOnRes.language) || candidate.coding_language || 'python';
  const handsCode    = (currentProblem ? currentProblem.code : handsOnRes.code) || candidate.coding_submission || '';
  const sampleResults = (currentProblem ? currentProblem.sample_results : handsOnRes.sample_results) || [];
  const hiddenResults = (currentProblem ? currentProblem.hidden_results : handsOnRes.hidden_results) || [];
  const samplePassed  = currentProblem ? (currentProblem.passed_count ?? sampleResults.filter(r => r.passed).length) : (handsOnRes.total_passed != null ? handsOnRes.total_passed : sampleResults.filter(r => r.passed).length);
  const sampleTotal   = currentProblem ? (currentProblem.total_count ?? sampleResults.length) : (handsOnRes.total_count != null ? handsOnRes.total_count : sampleResults.length);
  const isEvaluated   = wf.assessmentStatus === 'evaluated';
  const isSubmitted   = ['submitted', 'evaluated'].includes(wf.assessmentStatus);

  // ── Not yet invited ───────────────────────────────────────────────────────
  const isInvitedOrBeyond = ['invited', 'in_progress', 'submitted', 'evaluated'].includes(wf.assessmentStatus);
  if (!isInvitedOrBeyond) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-[#1E1B18] border border-stone-200 dark:border-[#2E2824] flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto">
          <Code2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Technical Assessment Not Initiated</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            This candidate has not yet received a technical assessment invitation.
          </p>
        </div>
        {onInviteAssessment && (
          <Button variant="primary" size="md" onClick={() => onInviteAssessment(candidate.id)} className="gap-2 mx-auto">
            <Sparkles className="w-4 h-4" />
            <span>Send Assessment Invitation</span>
          </Button>
        )}
      </Card>
    );
  }

  // ── Sync external result ─────────────────────────────────────────────────
  const handleSyncExternal = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await api.post?.(`/api/assessment/external/${candidate.id}/sync`) || 
                  await fetch(`/api/assessment/external/${candidate.id}/sync`, { method: 'POST' }).then(r => r.json());
      setSyncMsg(res?.message || 'Synced successfully.');
    } catch (e) {
      setSyncMsg('Sync failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Top Metric Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Overall Score */}
        <Card className="p-4 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Overall Score</span>
            <div className={`text-2xl font-black mt-0.5 ${
              overallScore === null ? 'text-slate-400' :
              overallScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              overallScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
              'text-rose-600 dark:text-rose-400'
            }`}>
              {overallScore !== null ? `${overallScore}` : '—'}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </Card>

        {/* Lifecycle State */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Status</span>
            <div className="mt-1.5">{evalStatusBadge(wf.assessmentStatus)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        {/* Hands-on Test Pass Rate */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Tests Passed</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {isEvaluated && sampleTotal > 0 ? `${samplePassed}/${sampleTotal}` : '—'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono">sample test cases</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </Card>

        {/* Execution Engine */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Execution</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {externalPlatform ? externalPlatform.toUpperCase() : 'Subprocess'}
            </div>
            <span className="text-[9px] text-slate-400 font-mono">
              {externalPlatform ? 'External Platform' : (handsLang ? handsLang.toUpperCase() : 'Python / JS / SQL')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* ── Category Score Breakdown ──────────────────────────────────────── */}
      {isEvaluated && (techScore !== null || scenScore !== null || handsScore !== null || troubleScore !== null) && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Category Breakdown</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {techScore   !== null && <ScoreBar label="MCQ Knowledge"    score={techScore}   color="bg-brand-500" />}
            {scenScore   !== null && <ScoreBar label="Scenario Judgment" score={scenScore}   color="bg-amber-500" />}
            {handsScore  !== null && <ScoreBar label="Hands-on / Coding" score={handsScore}  color="bg-emerald-500" />}
            {troubleScore !== null && <ScoreBar label="Troubleshooting"  score={troubleScore} color="bg-purple-500" />}
          </div>
          {isEvaluated && handsOnRes.execution_ms && (
            <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              Execution time: {handsOnRes.execution_ms}ms
              {handsOnRes.memory_mb ? ` · Memory: ${handsOnRes.memory_mb}MB` : ''}
            </div>
          )}
        </Card>
      )}

      {/* ── External Platform Result ──────────────────────────────────────── */}
      {externalPlatform && (
        <Card className="p-5 space-y-4 border-brand-200 dark:border-brand-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">External Platform: {externalPlatform.toUpperCase()}</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSyncExternal} disabled={isSyncing} className="gap-1.5 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : 'Sync Result'}
            </Button>
          </div>
          {syncMsg && <p className="text-xs text-slate-500">{syncMsg}</p>}
          {externalRes ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{externalRes.status || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Score:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {externalRes.score != null ? `${externalRes.score}/${externalRes.max_score ?? 100}` : '—'}
                </span>
              </div>
              {externalRes.details && (
                <pre className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 overflow-auto max-h-32">
                  {JSON.stringify(externalRes.details, null, 2)}
                </pre>
              )}
              {candidate.external_assessment_url && (
                <a
                  href={candidate.external_assessment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open on {externalPlatform}
                </a>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              Result not yet synced. Click "Sync Result" to retrieve the latest score from {externalPlatform}.
            </div>
          )}
        </Card>
      )}

      {/* ── Code Submission + Test Results ───────────────────────────────── */}
      {isSubmitted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Code view (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Multi-Problem Selector Tabs */}
            {problemList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {problemList.map((prob, idx) => (
                  <button
                    key={prob.problem_id || idx}
                    onClick={() => setSelectedProblemIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedProblemIdx === idx
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Problem {idx + 1} ({prob.score != null ? `${prob.score}%` : '—'})
                  </button>
                ))}
              </div>
            )}

            {/* Submitted Code */}
            <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <FileCode className="w-4 h-4 text-brand-500" />
                  <span>Hands-on Solution Code</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {handsLang.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Read-only Replay</span>
              </div>
              <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 overflow-x-auto max-h-[420px] leading-relaxed">
                <pre><code>{handsCode || '# No code submission recorded'}</code></pre>
              </div>
            </Card>

            {/* Console Output */}
            <Card className="p-4 bg-slate-950 border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Sandbox Console Log:</span>
              </div>
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {(handsOnRes.console_output || troubleRes.console_output) || '> No console output recorded.'}
              </pre>
            </Card>
          </div>

          {/* Test Results (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Sample test cases */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Sample Tests</h4>
                <span className={`text-xs font-bold font-mono ${
                  sampleTotal === 0 ? 'text-slate-400' :
                  samplePassed === sampleTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}>
                  {sampleTotal > 0 ? `${samplePassed}/${sampleTotal}` : '—'}
                </span>
              </div>
              <div className="space-y-2">
                {sampleResults.length > 0 ? (
                  sampleResults.map((tc, i) => <TestRow key={tc.id || i} tc={tc} isHidden={false} />)
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    {isEvaluated ? 'No sample test results recorded.' : 'Evaluation pending.'}
                  </p>
                )}
              </div>
            </Card>

            {/* Hidden test cases (count only, no inputs/expected revealed) */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">Hidden Tests</h4>
                </div>
                <span className={`text-xs font-bold font-mono ${
                  hiddenResults.length === 0 ? 'text-slate-400' :
                  hiddenResults.every(r => r.passed) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}>
                  {hiddenResults.length > 0
                    ? `${hiddenResults.filter(r => r.passed).length}/${hiddenResults.length}`
                    : '—'}
                </span>
              </div>
              <div className="space-y-2">
                {hiddenResults.length > 0 ? (
                  hiddenResults.map((tc, i) => <TestRow key={tc.id || i} tc={tc} isHidden={true} />)
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    {isEvaluated ? 'No hidden test results recorded.' : 'Evaluated on submission.'}
                  </p>
                )}
              </div>
            </Card>

            {/* Session Timeline */}
            <Card className="p-4 space-y-2 text-xs">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold pb-1 border-b border-slate-100 dark:border-slate-800">
                Session Timeline
              </h4>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Invited:</span>
                  <span className="text-slate-800 dark:text-slate-200">{fmtTs(candidate.assessment_invited_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span className="text-slate-800 dark:text-slate-200">{fmtTs(candidate.assessment_started_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Submitted:</span>
                  <span className="text-slate-800 dark:text-slate-200">{fmtTs(candidate.assessment_submitted_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Evaluated:</span>
                  <span className="text-slate-800 dark:text-slate-200">{fmtTs(candidate.assessment_evaluated_at)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Not yet submitted placeholder ─────────────────────────────────── */}
      {!isSubmitted && (
        <Card className="p-8 text-center space-y-3">
          <Clock className="w-8 h-8 text-amber-400 mx-auto" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assessment In Progress</h4>
            <p className="text-xs text-slate-500 mt-1">
              Candidate has been invited but has not yet submitted their assessment. Results will appear here upon completion.
            </p>
          </div>
          {evalStatusBadge(wf.assessmentStatus)}
        </Card>
      )}
    </div>
  );
}
