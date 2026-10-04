import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  Save, 
  Sparkles,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  RotateCcw,
  History,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Card, Button, StatusBadge } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';

export default function RecruiterDecisionTab({ candidate, onUpdateDecision, onReopen }) {
  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);
  const isFinal = wf.hiringDecision === 'selected' || wf.hiringDecision === 'rejected';

  const [decision, setDecision] = useState(wf.hiringDecision || 'undecided');
  const [recruiterScore, setRecruiterScore] = useState(
    candidate.recruiterScore ?? candidate.recruiter_score ?? candidate.matchScore ?? 0
  );
  const [hrNotes, setHrNotes] = useState(candidate.hrNotes || candidate.hr_notes || '');
  const [rejectionReason, setRejectionReason] = useState(candidate.rejectionReason || candidate.rejection_reason || '');
  const [rejectionCategory, setRejectionCategory] = useState(candidate.rejectionCategory || candidate.rejection_category || 'skills_mismatch');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Controlled Reopening State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState('');

  const previousFinal = candidate.previousFinalDecision || candidate.previous_final_decision;
  const reopenAuditReason = candidate.reopenReason || candidate.reopen_reason;
  const reopenedBy = candidate.reopenedBy || candidate.reopened_by;
  const reopenedAt = candidate.reopenedAt || candidate.reopened_at;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onUpdateDecision(candidate.id, decision, {
        recruiterScore: Number(recruiterScore),
        hrNotes,
        rejectionReason: decision === 'rejected' ? rejectionReason : null,
        rejectionCategory: decision === 'rejected' ? rejectionCategory : null
      });
      setStatusMessage({ type: 'success', text: `✓ Hiring decision authoritatively updated to "${decision}".` });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update decision' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason || reopenReason.trim().length < 10) {
      setReopenError('A detailed reason of at least 10 characters is strictly required.');
      return;
    }
    setIsReopening(true);
    setReopenError('');
    try {
      if (onReopen) {
        await onReopen(candidate.id, reopenReason.trim());
      }
      setIsReopenModalOpen(false);
      setReopenReason('');
      setStatusMessage({ type: 'success', text: '✓ Application has been reopened and moved back to Evaluation & Review.' });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      setReopenError(err.message || 'Failed to reopen application.');
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in-up">
      {/* Historical Reopening Audit Banner if candidate was reopened */}
      {reopenAuditReason && (
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-1.5 shadow-subtle">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Application Reopening History</span>
            {previousFinal && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100">
                Prior Decision: {previousFinal.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Reason:</span> "{reopenAuditReason}"
          </p>
          {(reopenedBy || reopenedAt) && (
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 font-mono">
              Authorized by {reopenedBy || 'Recruiter'} {reopenedAt ? `at ${new Date(reopenedAt).toLocaleString()}` : ''}
            </p>
          )}
        </div>
      )}

      {/* Final Decision Locked View */}
      {isFinal ? (
        <Card className="p-6 space-y-6 border-slate-300 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                wf.hiringDecision === 'selected'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    Application Finalized & Locked
                  </h3>
                  <StatusBadge dimension="decision" value={wf.hiringDecision} />
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Under SparkX Governance Rules, terminal decisions are immutable to prevent unintended stage regressions.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReopenModalOpen(true)}
              className="gap-2 shrink-0 border-stone-300 dark:border-stone-700 hover:border-brand-500 text-stone-700 dark:text-stone-300"
            >
              <RotateCcw className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Reopen Application</span>
            </Button>
          </div>

          {/* Decision Summary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 block mb-1">Terminal Decision</span>
              <span className="text-sm font-bold text-stone-900 dark:text-white capitalize">{wf.hiringDecision}</span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 block mb-1">Recruiter Composite Rating</span>
              <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">{recruiterScore} / 100</span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-mono uppercase text-stone-500 dark:text-stone-400 block mb-1">Decision Timestamp</span>
              <span className="text-xs font-mono text-stone-700 dark:text-stone-300">
                {candidate.decisionUpdatedAt ? new Date(candidate.decisionUpdatedAt).toLocaleString() : 'Recorded'}
              </span>
            </div>
          </div>

          {/* Rejection Details if rejected */}
          {wf.hiringDecision === 'rejected' && (
            <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Recorded Rejection Reason</span>
              </div>
              <div className="text-xs text-rose-800 dark:text-rose-300">
                <span className="font-semibold capitalize">Category:</span> {rejectionCategory.replace('_', ' ')}
              </div>
              {rejectionReason && (
                <div className="text-xs text-rose-800 dark:text-rose-300">
                  <span className="font-semibold">Feedback:</span> {rejectionReason}
                </div>
              )}
            </div>
          )}

          {/* Internal Notes */}
          {hrNotes && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 space-y-1">
              <div className="text-xs font-mono uppercase text-stone-500 dark:text-stone-400 font-bold">Internal Notes</div>
              <p className="text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{hrNotes}</p>
            </div>
          )}

          {/* Reopening Modal / Inline Drawer */}
          {isReopenModalOpen && (
            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-800/80 space-y-4 animate-scale-in">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                <Unlock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Controlled Reopening Authorization</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Reopening will reset the hiring decision to <strong>Undecided</strong> and transition this candidate back to the <strong>Evaluation & Review</strong> stage. An immutable audit log entry will be created with your reason.
              </p>

              <form onSubmit={handleReopenSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-amber-900 dark:text-amber-300 font-bold">
                      Mandatory Audit Reason (min 10 characters)
                    </label>
                    <span className={`text-[10px] font-mono ${
                      reopenReason.trim().length >= 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {reopenReason.trim().length} / 10 chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="State the justification for reopening (e.g. Candidate submitted revised portfolio, approved for senior headcount, etc.)..."
                    className="w-full p-3 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-stone-900 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {reopenError && (
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {reopenError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsReopenModalOpen(false);
                      setReopenReason('');
                      setReopenError('');
                    }}
                    disabled={isReopening}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isReopening || reopenReason.trim().length < 10}
                    className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isReopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Authorize & Reopen Application</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      ) : (
        /* Active Candidate Editable Decision Form */
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">Authoritative Hiring Decision</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Updates candidate's decision dimension and concludes pipeline stage if terminal.
              </p>
            </div>
            <StatusBadge dimension="decision" value={decision} />
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Decision Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold block">
                Committee Decision
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'undecided', label: 'Undecided', desc: 'In Review' },
                  { id: 'shortlisted', label: 'Shortlist', desc: 'Top Tier' },
                  { id: 'selected', label: 'Select / Offer', desc: 'Hire Approved' },
                  { id: 'rejected', label: 'Reject', desc: 'Disqualified' },
                ].map(d => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setDecision(d.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      decision === d.id
                        ? d.id === 'selected'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                          : d.id === 'rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20'
                          : 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-900 dark:text-teal-100 ring-2 ring-teal-500/20'
                        : 'bg-stone-50 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{d.label}</div>
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recruiter Score Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold">
                  Recruiter Composite Rating (1-100)
                </label>
                <span className="font-mono text-sm font-bold text-teal-600 dark:text-teal-400">
                  {Number(recruiterScore) > 0 ? `${recruiterScore}/100` : 'Unrated (0/100)'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={recruiterScore}
                onChange={(e) => setRecruiterScore(e.target.value)}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            {/* Rejection Details (Only if rejected is chosen) */}
            {decision === 'rejected' && (
              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Rejection Classification & Feedback</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-stone-500 block mb-1">Rejection Category</label>
                    <select
                      value={rejectionCategory}
                      onChange={(e) => setRejectionCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                    >
                      <option value="skills_mismatch">Core Technical Skills Mismatch</option>
                      <option value="experience_gap">Seniority / Experience Gap</option>
                      <option value="assessment_failed">Failed Assessment Sandbox Benchmark</option>
                      <option value="integrity_violation">Integrity Policy Anomaly</option>
                      <option value="compensation_mismatch">Compensation Mismatch</option>
                      <option value="other">Other Evaluation Reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-stone-500 block mb-1">Specific Feedback</label>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Brief explanation for internal audit log..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HR & Recruiter Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-stone-500 font-bold block">
                Internal Evaluation Notes
              </label>
              <textarea
                rows={3}
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                placeholder="Record hiring committee feedback, discussion points, or offer details..."
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:border-teal-500"
              />
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200' 
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200'
              }`}>
                {statusMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Commit Decision & Notes</span>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
