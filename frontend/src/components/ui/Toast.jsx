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
  success: 'bg-emerald-950/95 border-emerald-700/50 text-emerald-200',
  error:   'bg-rose-950/95 border-rose-700/50 text-rose-200',
  warning: 'bg-amber-950/95 border-amber-700/50 text-amber-200',
  info:    'bg-indigo-950/95 border-indigo-700/50 text-indigo-200',
};
const ICON_COLORS = {
  success: 'text-emerald-400',
  error:   'text-rose-400',
  warning: 'text-amber-400',
  info:    'text-indigo-400',
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
      className={`flex items-start space-x-3 p-3.5 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-xl max-w-sm w-full ${COLORS[type]}`}
      style={{
        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
        opacity: visible ? 1 : 0,
      }}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ICON_COLORS[type]}`} />
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 400); }}
        className="opacity-50 hover:opacity-100 transition-opacity ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
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
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end space-y-2 pointer-events-none">
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
