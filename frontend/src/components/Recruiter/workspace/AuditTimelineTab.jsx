import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { 
  Clock, 
  History, 
  User, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { Card, Badge, StatusBadge } from '../../ui/Primitives';

export default function AuditTimelineTab({ candidateId }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLogs() {
      if (!candidateId) return;
      setIsLoading(true);
      try {
        const data = await api.getAuditLogs(candidateId);
        if (isMounted) setLogs(data || []);
      } catch (err) {
        console.warn('Failed to load audit logs:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadLogs();
    return () => { isMounted = false; };
  }, [candidateId]);

  return (
    <div className="space-y-6 max-w-4xl">
      <Card className="p-5 space-y-4 border-[#E8DFD8] dark:border-[#33241C] bg-[#FDFBF7] dark:bg-[#1A120E]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8] dark:border-[#33241C]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold font-sans text-[#1C130E] dark:text-[#FAF6F0]">Authoritative State Transition Audit Log</h3>
          </div>
          <span className="text-xs font-mono text-[#A89F91] dark:text-[#8C7E72]">{logs.length} Audit Entries</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#A89F91] dark:text-[#8C7E72] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>Fetching backend audit ledger...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#7C7267] dark:text-[#C4B5A5] space-y-2">
            <Clock className="w-8 h-8 text-[#A89F91] dark:text-[#8C7E72] mx-auto" />
            <div>No previous audit transitions logged.</div>
            <p className="text-[11px] text-[#A89F91] dark:text-[#8C7E72]">All subsequent state and decision mutations will appear here with cryptographic audit tracking.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8DFD8] dark:before:bg-[#33241C]">
            {logs.map((log, idx) => (
              <div key={log.id || idx} className="relative space-y-1 text-xs">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#1A120E] border-2 border-amber-600 ring-2 ring-amber-500/20" />

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#201814] text-[#7C7267] dark:text-[#C4B5A5] border border-[#E8DFD8] dark:border-[#3D2C22]">
                      Dim: {log.dimension}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span className="text-[#A89F91] dark:text-[#8C7E72]">{log.from_value || 'None'}</span>
                      <ArrowRight className="w-3 h-3 text-[#A89F91] dark:text-[#8C7E72]" />
                      <span className="font-bold text-amber-700 dark:text-amber-400">{log.to_value}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#A89F91] dark:text-[#8C7E72]">{log.created_at || 'Recently'}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#7C7267] dark:text-[#C4B5A5]">
                  <User className="w-3 h-3" />
                  <span>Actor: <strong className="text-[#1C130E] dark:text-[#FAF6F0]">{log.changed_by || 'system'}</strong></span>
                  {log.notes && (
                    <>
                      <span>•</span>
                      <span className="italic">"{log.notes}"</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
