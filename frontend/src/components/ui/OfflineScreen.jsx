import React, { useState, useEffect } from 'react';
import { WifiOff, ServerCrash, RefreshCw, Terminal, Database, CheckCircle2 } from 'lucide-react';

/**
 * OfflineScreen — Production-Grade Connection & Server Recovery Experience
 * 
 * Accurately differentiates between:
 * 1. Client-side network disconnect (navigator.onLine === false)
 * 2. Backend API server unreachable (navigator.onLine === true, API error)
 * 
 * Supports both light and dark themes using ARETE warm stone & espresso tokens.
 */
export default function OfflineScreen({ error = null, onRetry }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTriggerRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setRetryFeedback(null);

    try {
      if (onRetry) {
        await onRetry();
      }
      setRetryFeedback({ type: 'info', text: 'Connection check completed.' });
    } catch (err) {
      setRetryFeedback({ type: 'error', text: err?.message || 'Server still unreachable.' });
    } finally {
      setTimeout(() => setIsRetrying(false), 800);
    }
  };

  const isNetworkOffline = !isOnline;

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0F0E0D] text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-6 sm:p-8 text-center transition-colors">
      <div className="max-w-lg w-full space-y-6">
        
        {/* Status Icon */}
        <div className="relative mx-auto w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
          <div className={`w-full h-full rounded-3xl flex items-center justify-center shadow-lg transition-colors ${
            isNetworkOffline
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}>
            {isNetworkOffline ? (
              <WifiOff className="w-9 h-9 sm:w-10 sm:h-10" />
            ) : (
              <ServerCrash className="w-9 h-9 sm:w-10 sm:h-10" />
            )}
          </div>
          <span className={`absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider text-white shadow-xs ${
            isNetworkOffline ? 'bg-amber-600' : 'bg-rose-600'
          }`}>
            {isNetworkOffline ? 'No Internet' : 'API Offline'}
          </span>
        </div>

        {/* Informative Explanation without Blame */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight font-display">
            {isNetworkOffline ? 'Internet Connection Disconnected' : 'API Server Not Reachable'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            {isNetworkOffline
              ? 'Your device appears to be offline. Reconnect your network to resume using ARETE.'
              : 'The ARETE backend service is currently not responding. All recruitment data is loaded directly from the database ledger without synthetic placeholders.'}
          </p>
        </div>

        {/* Technical Guidance Card for Local Development */}
        {!isNetworkOffline && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FDFBF7] dark:bg-[#161311] border border-[#E8E4DF] dark:border-[#2A2520] text-left shadow-subtle space-y-3.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-stone-700 dark:text-stone-300 font-mono uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Launch Local Backend:</span>
            </div>
            <code className="block text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-stone-100 dark:bg-[#0C0A09] border border-stone-200 dark:border-[#2A2520] p-3 rounded-xl leading-relaxed select-all">
              cd backend<br />
              python -m uvicorn main:app --reload --port 8000
            </code>

            <div className="flex items-center space-x-2 text-xs font-bold text-stone-700 dark:text-stone-300 font-mono uppercase tracking-wider pt-1">
              <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Seed PostgreSQL (First time):</span>
            </div>
            <code className="block text-xs text-amber-700 dark:text-amber-400 font-mono bg-stone-100 dark:bg-[#0C0A09] border border-stone-200 dark:border-[#2A2520] p-3 rounded-xl select-all">
              python seed.py
            </code>

            {error && (
              <div className="text-[11px] text-rose-700 dark:text-rose-400 font-mono bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/40 break-words">
                Diagnostic: {String(error)}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button 
            type="button"
            onClick={handleTriggerRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-bold transition shadow-md shadow-brand-950/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Connecting...' : 'Retry Connection'}</span>
          </button>
        </div>

        {retryFeedback && (
          <p className="text-xs text-stone-500 dark:text-stone-400 animate-fade-in">
            {retryFeedback.text}
          </p>
        )}

      </div>
    </div>
  );
}
