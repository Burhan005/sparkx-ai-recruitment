import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, Badge } from '../../ui/Primitives';

export default function IntegrityAuditTab({ candidate }) {
  if (!candidate) return null;
  const integrityScore = candidate.integrityScore ?? 100;
  const risk = candidate.integrityRisk || (integrityScore >= 80 ? 'Low' : integrityScore >= 60 ? 'Medium' : 'High');
  const events = candidate.integrityEvents || [];

  return (
    <div className="space-y-6">
      {/* Top Integrity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Session Integrity Score</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {integrityScore}/100
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                integrityScore >= 80 ? 'bg-emerald-500' : integrityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`} 
              style={{ width: `${integrityScore}%` }}
            />
          </div>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">HR Risk Indicator</span>
          <div className={`text-3xl font-black mt-1 ${
            risk === 'Low' ? 'text-emerald-500' : risk === 'Medium' ? 'text-amber-500' : 'text-rose-500'
          }`}>
            {risk} Risk
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {risk === 'Low' ? 'Zero suspicious anomalies' : 'Human reviewer verification advised'}
          </span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">Logged Focus Events</span>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {events.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Window & tab switches</span>
        </Card>
      </div>

      {/* Real Focus Event Stream */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Proctoring Telemetry & Focus Event Log</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{events.length} Telemetry Entries</span>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Zero Integrity Anomalies Logged</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Candidate maintained uninterrupted window and tab focus throughout the technical evaluation session.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {events.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 text-xs ${
                  ev.severity === 'high'
                    ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
                    : ev.severity === 'medium'
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      {ev.type || 'FOCUS_EVENT'}
                    </span>
                    <span className="font-semibold">{ev.description || 'Focus loss signal'}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{ev.timestamp || '00:00'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
