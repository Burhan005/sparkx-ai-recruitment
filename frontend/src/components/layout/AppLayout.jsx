import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useRecruitment } from '../../context/RecruitmentContext';
import { useSmoothNavigate } from '../../context/PageTransitionContext';
import AppSidebar from './AppSidebar';
import CommandMenu from './CommandMenu';
import AIConfigModal from '../AIConfigModal';
import AskSparkxDrawer from '../ai/AskSparkxDrawer';
import { 
  WifiOff, 
  Terminal, 
  Database, 
  RefreshCw,
  Menu,
  Search,
  Sparkles
} from 'lucide-react';
import { formatShortcut } from '../../utils/keyboardShortcut';
import AreteLogo from '../ui/AreteLogo';

export function OfflineScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-[#0F0E0D] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-rose-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-stone-100">Backend Offline</h2>
        <p className="text-stone-400 text-sm max-w-md mx-auto">
          The SparkX API server is not reachable. All data is served from the backend — there is no static data.
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-[#1A1714] border border-[#2A2520] text-left max-w-md w-full space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" /><span>Start the backend:</span>
        </div>
        <code className="block text-xs text-emerald-400 font-mono bg-[#0C0A09] p-3 rounded-xl leading-relaxed">
          cd C:\Sparkx\sparkx-ai-recruitment\backend<br />
          python -m uvicorn main:app --reload --port 8000
        </code>
        <div className="flex items-center space-x-2 text-xs font-bold text-stone-400 uppercase tracking-wider pt-1">
          <Database className="w-3.5 h-3.5" /><span>Then seed demo data (first time):</span>
        </div>
        <code className="block text-xs text-amber-400 font-mono bg-[#0C0A09] p-3 rounded-xl">
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
        className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition shadow-lg shadow-amber-950/30"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { smoothNavigate } = useSmoothNavigate();
  const { dbError, syncWithDatabase, currentUser, userRole } = useRecruitment();
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
    <div className="h-screen w-screen flex bg-[#F2EFEB] dark:bg-[#0F0E0D] text-stone-900 dark:text-stone-100 selection:bg-brand-500/20 selection:text-brand-700 dark:selection:text-brand-300 overflow-hidden">
      {/* Sidebar (Desktop Collapsible & Mobile Drawer) - Fixed in place, never scrolls */}
      <AppSidebar
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        onOpenAIConfig={() => setIsAIConfigOpen(true)}
        onOpenAskSparkx={() => setIsAskSparkxOpen(true)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main App Scroll Container - Dedicated vertical scroll with thin scrollbar */}
      <div 
        id="main-scroll-container" 
        className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto scrollbar-thin"
      >
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#FDFCFA]/95 dark:bg-[#1A1714]/95 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div 
              className="cursor-pointer"
              onClick={() => smoothNavigate(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
            >
              <AreteLogo size="xs" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAskSparkxOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 text-xs font-semibold"
              title={`ARETE Copilot (${formatShortcut('J')})`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>ARETE AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCommandMenuOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="text-[10px] font-sans bg-white dark:bg-stone-700 px-1 rounded">{formatShortcut('K')}</kbd>
            </button>
          </div>
        </header>

        {/* Dynamic Route Content — full-width canvas per route */}
        <main className="flex-1 w-full min-w-0 flex flex-col min-h-0">
          <div
            key={location.pathname}
            className="w-full min-w-0 flex-1 flex flex-col min-h-0"
          >
            <Outlet />
          </div>
        </main>
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
