import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Clock, 
  Save, 
  Sparkles,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card, Button, StatusBadge } from '../../ui/Primitives';
import { normalizeWorkflow } from '../../../utils/workflowContract';

export default function RecruiterDecisionTab({ candidate, onUpdateDecision }) {
  if (!candidate) return null;
  const wf = normalizeWorkflow(candidate);

  const [decision, setDecision] = useState(wf.hiringDecision || 'undecided');
  const [recruiterScore, setRecruiterScore] = useState(candidate.recruiterScore ?? candidate.recruiter_score ?? 85);
  const [hrNotes, setHrNotes] = useState(candidate.hrNotes || candidate.hr_notes || '');
  const [rejectionReason, setRejectionReason] = useState(candidate.rejectionReason || candidate.rejection_reason || '');
  const [rejectionCategory, setRejectionCategory] = useState(candidate.rejectionCategory || candidate.rejection_category || 'skills_mismatch');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

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

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Authoritative Hiring Decision</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates candidate's decision dimension and conclues pipeline stage if terminal.
            </p>
          </div>
          <StatusBadge dimension="decision" value={decision} />
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Decision Selector Cards */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold block">
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
                        : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recruiter Score Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Recruiter Composite Rating (1-100)
              </label>
              <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {recruiterScore}/100
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={recruiterScore}
              onChange={(e) => setRecruiterScore(e.target.value)}
              className="w-full accent-indigo-600 cursor-pointer"
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
                  <label className="text-[11px] font-mono text-slate-500 block mb-1">Rejection Category</label>
                  <select
                    value={rejectionCategory}
                    onChange={(e) => setRejectionCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
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
                  <label className="text-[11px] font-mono text-slate-500 block mb-1">Specific Feedback</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Brief explanation for internal audit log..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* HR & Recruiter Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold block">
              Internal Evaluation Notes
            </label>
            <textarea
              rows={3}
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="Record hiring committee feedback, discussion points, or offer details..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
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
    </div>
  );
}
