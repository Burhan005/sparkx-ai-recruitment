import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const THEME_STYLES = {
  success: {
    badge: 'text-[#C27803] dark:text-amber-400 bg-amber-500/15 dark:bg-amber-400/20 shadow-xs shadow-amber-500/20',
    border: 'border-amber-500/30 dark:border-amber-500/40',
    accent: 'from-amber-500/20 via-[#C27803] to-amber-500/20',
    label: 'VERIFIED',
  },
  error: {
    badge: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/25 shadow-xs shadow-rose-500/20',
    border: 'border-rose-500/30 dark:border-rose-500/40',
    accent: 'from-rose-500/20 via-rose-500 to-rose-500/20',
    label: 'ERROR',
  },
  warning: {
    badge: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-400/20 shadow-xs shadow-amber-500/20',
    border: 'border-amber-500/30 dark:border-amber-500/40',
    accent: 'from-amber-500/20 via-amber-500 to-amber-500/20',
    label: 'NOTICE',
  },
  info: {
    badge: 'text-[#C27803] dark:text-amber-400 bg-amber-500/15 dark:bg-amber-400/20 shadow-xs shadow-amber-500/20',
    border: 'border-[#C27803]/30 dark:border-amber-500/40',
    accent: 'from-amber-500/20 via-[#C27803] to-amber-500/20',
    label: 'SPARKX',
  },
};

function ToastItem({ id, message, type = 'info', onRemove }) {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[type] || Info;
  const style = THEME_STYLES[type] || THEME_STYLES.info;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 260);
    }, 3800);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [id, onRemove]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl border select-none overflow-hidden max-w-md w-full
        bg-[#FAF8F5]/98 dark:bg-[#1C1512]/98
        border-[#E5DFD7] dark:border-[#382D24]
        text-stone-800 dark:text-[#EFEAE4]
        shadow-[0_12px_32px_-6px_rgba(28,19,14,0.14)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.75)]
        backdrop-blur-xl transition-all duration-300 ease-out`}
      style={{
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.95)',
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Top warm roasted amber hairline accent */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${style.accent}`} />

      {/* Status icon badge */}
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 leading-snug">
          {message}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(id), 260);
        }}
        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors p-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/60 cursor-pointer"
        title="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const recentMessagesRef = useRef(new Map());

  const addToast = useCallback((message, type = 'info') => {
    if (!message || typeof message !== 'string') return;
    const cleanMsg = message.trim();
    if (!cleanMsg) return;

    const now = Date.now();
    // Normalize message key for strict deduplication
    const normKey = cleanMsg.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);

    // Suppress exact or welcome-style duplicate toasts triggered within 3.5 seconds
    const lastSeen = recentMessagesRef.current.get(normKey);
    if (lastSeen && now - lastSeen < 3500) {
      return;
    }

    // Suppress duplicate "Welcome" or "Signed in" bursts
    if (normKey.startsWith('welcome') || normKey.startsWith('accountcreated')) {
      const lastWelcome = recentMessagesRef.current.get('__last_welcome__');
      if (lastWelcome && now - lastWelcome < 3500) {
        return;
      }
      recentMessagesRef.current.set('__last_welcome__', now);
    }

    recentMessagesRef.current.set(normKey, now);

    const id = `t-${now}-${Math.random().toString(36).slice(2, 7)}`;
    // Enforce SINGLE toast at a time: replaces previous toast smoothly without stacking
    setToasts([{ id, message: cleanMsg, type }]);
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
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 pointer-events-none">
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
