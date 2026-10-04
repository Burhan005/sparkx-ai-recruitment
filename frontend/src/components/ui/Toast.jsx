import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'bg-white/95 dark:bg-[#161311]/95 border-emerald-500/40 text-stone-900 dark:text-stone-100 shadow-depth-elevated',
  error:   'bg-white/95 dark:bg-[#161311]/95 border-rose-500/40 text-stone-900 dark:text-stone-100 shadow-depth-elevated',
  warning: 'bg-white/95 dark:bg-[#161311]/95 border-amber-500/40 text-stone-900 dark:text-stone-100 shadow-depth-elevated',
  info:    'bg-white/95 dark:bg-[#161311]/95 border-teal-500/40 text-stone-900 dark:text-stone-100 shadow-depth-elevated',
};
const ICON_COLORS = {
  success: 'text-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/25',
  error:   'text-rose-500 bg-rose-500/15 dark:bg-rose-500/25',
  warning: 'text-amber-500 bg-amber-500/15 dark:bg-amber-500/25',
  info:    'text-teal-500 bg-teal-500/15 dark:bg-teal-500/25',
};

function ToastItem({ id, message, type = 'info', onRemove }) {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[type];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 400);
    }, 4200);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [id, onRemove]);

  return (
    <div
      className={`relative flex items-start gap-3 p-3.5 pr-4 pb-4 rounded-2xl border text-xs font-semibold backdrop-blur-xl max-w-sm w-full select-none overflow-hidden ${COLORS[type]}`}
      style={{
        transition: 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.92)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${ICON_COLORS[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 leading-relaxed text-stone-800 dark:text-stone-100">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 400); }}
        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors ml-1 p-0.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
        title="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Countdown progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-100 dark:bg-stone-800 overflow-hidden">
        <div 
          className={`h-full ${
            type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
          } animate-shrink-progress`}
          style={{ animationDuration: '4200ms', animationTimingFunction: 'linear' }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info') => addToast(message, type), [addToast]);
  toast.success = (msg) => addToast(msg, 'success');
  toast.error   = (msg) => addToast(msg, 'error');
  toast.warning = (msg) => addToast(msg, 'warning');
  toast.info    = (msg) => addToast(msg, 'info');

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
