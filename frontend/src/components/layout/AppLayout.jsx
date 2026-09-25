import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import AppSidebar from './AppSidebar';
import CommandMenu from './CommandMenu';
import AIConfigModal from '../AIConfigModal';
import AskSparkxDrawer from '../ai/AskSparkxDrawer';
import { 
  ShieldCheck, 
  WifiOff, 
  Terminal, 
  Database, 
  RefreshCw,
  Menu,
  Search,
  Sparkles
} from 'lucide-react';
import { formatShortcut } from '../../utils/keyboardShortcut';

export function OfflineScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-[#070A12] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-rose-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-white">Backend Offline</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          The SparkX API server is not reachable. All data is served from the backend — there is no static data.
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left max-w-md w-full space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" /><span>Start the backend:</span>
        </div>
        <code className="block text-xs text-emerald-400 font-mono bg-slate-950 p-3 rounded-xl leading-relaxed">
          cd C:\Sparkx\sparkx-ai-recruitment\backend<br />
          python -m uvicorn main:app --reload --port 8000
        </code>
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider pt-1">
          <Database className="w-3.5 h-3.5" /><span>Then seed demo data (first time):</span>
        </div>
        <code className="block text-xs text-cyan-400 font-mono bg-slate-950 p-3 rounded-xl">
          python seed.py
        </code>
        {error && (
          <div className="text-[11px] text-rose-400 font-mono bg-rose-950/30 p-2 rounded-lg border border-rose-800/40">
            Error: {error}
          </div>
        )}
      </div>
      <button 
        onClick={onRetry}
        className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-indigo-600/30"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const { logout, dbError, syncWithDatabase, currentUser, userRole } = useRecruitment();
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isAIConfigOpen, setIsAIConfigOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAskSparkxOpen, setIsAskSparkxOpen] = useState(false);

  // Global keyboard shortcuts: Cmd/Ctrl+K for Command Menu, Cmd/Ctrl+J for Ask SparkX Copilot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandMenuOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAskSparkxOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (dbError && !currentUser) {
    return <OfflineScreen error={dbError} onRetry={() => syncWithDatabase(false)} />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-brand-500/20 selection:text-brand-700 dark:selection:text-brand-300 transition-colors duration-150 overflow-hidden">
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) - Fixed in place, never scrolls */}
      <AppSidebar
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onOpenAIConfig={() => setIsAIConfigOpen(true)}
        onOpenAskSparkx={() => setIsAskSparkxOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main App Scroll Container - Dedicated vertical scroll with thin scrollbar */}
      <div id="main-scroll-container" className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">SparkX</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAskSparkxOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              title={`Ask SparkX Copilot (${formatShortcut('J')})`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Ask AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCommandMenuOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="text-[10px] font-mono bg-white dark:bg-slate-700 px-1 rounded">{formatShortcut('K')}</kbd>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 w-full min-w-0 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>

        {/* Global Refined Footer */}
        <footer className="border-t border-[#E8E8E4] dark:border-[#222634] bg-white/80 dark:bg-[#111319]/80 backdrop-blur-md py-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Human-in-the-Loop AI • Hiring recommendations verified by certified recruiters
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">SparkX OS v2.5</span>
              </span>
              <span>•</span>
              <span>EEOC & SOC2 Certified</span>
              <span>•</span>
              <button
                type="button"
                onClick={logout}
                className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Command Palette */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onOpenAIConfig={() => setIsAIConfigOpen(true)}
      />

      {/* Global AI Config Modal */}
      <AIConfigModal
        isOpen={isAIConfigOpen}
        onClose={() => setIsAIConfigOpen(false)}
      />

      {/* Global Ask SparkX Copilot Drawer */}
      <AskSparkxDrawer
        isOpen={isAskSparkxOpen}
        onClose={() => setIsAskSparkxOpen(false)}
      />
    </div>
  );
}
