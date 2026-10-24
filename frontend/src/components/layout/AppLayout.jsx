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

import OfflineScreen from '../ui/OfflineScreen';
export { OfflineScreen };

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
    <div className="h-screen w-screen flex bg-[#F7F4EF] dark:bg-[#0F0E0D] text-stone-900 dark:text-stone-100 selection:bg-brand-500/20 selection:text-brand-700 dark:selection:text-brand-300 overflow-hidden">
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
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#FAF8F5]/95 dark:bg-[#150F0D]/95 backdrop-blur-xl border-b border-[#E8DFD8] dark:border-[#2C2019] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-[#F4EFEB] dark:hover:bg-[#251A14] active:bg-[#ECE4DC] dark:active:bg-[#1A120E] transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div 
              className="cursor-pointer flex items-center"
              onClick={() => smoothNavigate(userRole === 'recruiter' ? '/recruiter' : '/jobs')}
            >
              <AreteLogo size="xs" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAskSparkxOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#201814] text-stone-900 dark:text-[#EDE8E3] border border-[#E8DFD8] dark:border-[#3D2C22] text-xs font-semibold hover:border-brand-500/50 transition-colors shadow-xs"
              title={`ARETE Copilot (${formatShortcut('J')})`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-amber-400" />
              <span>ARETE AI</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCommandMenuOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#201814] text-stone-500 dark:text-stone-400 border border-[#E8DFD8] dark:border-[#3D2C22] text-xs font-medium hover:border-brand-500/50 transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <kbd className="text-[10px] font-sans font-medium text-stone-500 dark:text-amber-400/80 bg-[#F4EFEB] dark:bg-[#2A1E17] border border-[#E8DFD8] dark:border-[#423229] px-1 rounded">{formatShortcut('K')}</kbd>
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
