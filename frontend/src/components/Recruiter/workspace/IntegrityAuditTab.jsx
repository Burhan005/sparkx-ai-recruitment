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
        <Card className="p-4 border-[#E8DFD8] dark:border-[#33241C] bg-[#FDFBF7] dark:bg-[#1A120E]">
          <span className="text-[11px] font-mono uppercase text-[#A89F91] dark:text-[#8C7E72] font-bold">Session Integrity Score</span>
          <div className="text-3xl font-black font-sans text-[#1C130E] dark:text-[#FAF6F0] mt-1">
            {integrityScore}/100
          </div>
          <div className="w-full bg-[#E8DFD8] dark:bg-[#201814] h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                integrityScore >= 80 ? 'bg-emerald-500' : integrityScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`} 
              style={{ width: `${integrityScore}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 border-[#E8DFD8] dark:border-[#33241C] bg-[#FDFBF7] dark:bg-[#1A120E]">
          <span className="text-[11px] font-mono uppercase text-[#A89F91] dark:text-[#8C7E72] font-bold">HR Risk Indicator</span>
          <div className={`text-3xl font-black font-sans mt-1 ${
            risk === 'Low' ? 'text-emerald-600 dark:text-emerald-400' : risk === 'Medium' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {risk} Risk
          </div>
          <span className="text-[11px] text-[#7C7267] dark:text-[#C4B5A5] mt-1 block">
            {risk === 'Low' ? 'Zero suspicious anomalies' : 'Human reviewer verification advised'}
          </span>
        </Card>

        <Card className="p-4 border-[#E8DFD8] dark:border-[#33241C] bg-[#FDFBF7] dark:bg-[#1A120E]">
          <span className="text-[11px] font-mono uppercase text-[#A89F91] dark:text-[#8C7E72] font-bold">Logged Focus Events</span>
          <div className="text-3xl font-black font-sans text-amber-700 dark:text-amber-400 mt-1">
            {events.length}
          </div>
          <span className="text-[11px] text-[#7C7267] dark:text-[#C4B5A5] mt-1 block">Window & tab switches</span>
        </Card>
      </div>

      {/* Real Focus Event Stream */}
      <Card className="p-5 space-y-4 border-[#E8DFD8] dark:border-[#33241C] bg-[#FDFBF7] dark:bg-[#1A120E]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8] dark:border-[#33241C]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold font-sans text-[#1C130E] dark:text-[#FAF6F0]">Proctoring Telemetry & Focus Event Log</h3>
          </div>
          <span className="text-xs font-mono text-[#A89F91] dark:text-[#8C7E72]">{events.length} Telemetry Entries</span>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div className="text-xs font-bold font-sans text-[#1C130E] dark:text-[#FAF6F0]">Zero Integrity Anomalies Logged</div>
            <p className="text-xs text-[#7C7267] dark:text-[#C4B5A5] max-w-sm mx-auto">
              Candidate maintained uninterrupted window and tab focus throughout the technical evaluation session.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {events.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 text-xs transition-colors ${
                  ev.severity === 'high'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    : ev.severity === 'medium'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                    : 'bg-[#FAF8F5] dark:bg-[#201814] border-[#E8DFD8] dark:border-[#3D2C22] text-[#1C130E] dark:text-[#FAF6F0]'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#160F0C] border border-[#E8DFD8] dark:border-[#33241C] text-[#7C7267] dark:text-[#C4B5A5]">
                      {ev.type || 'FOCUS_EVENT'}
                    </span>
                    <span className="font-semibold">{ev.description || 'Focus loss signal'}</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#A89F91] dark:text-[#8C7E72] shrink-0">{ev.timestamp || '00:00'}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
