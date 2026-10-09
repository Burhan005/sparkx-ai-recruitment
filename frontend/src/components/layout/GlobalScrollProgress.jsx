import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal High-Performance GPU Scroll Progress Bar
 * - Runs with requestAnimationFrame + transform: scaleX for 120Hz/60Hz buttery smoothness
 * - High-contrast dual-mode photon bead: ultra-visible deep espresso in light mode, radiant amber/gold in dark mode
 * - Dual-target listener: detects both window scroll and internal #main-scroll-container
 */
export default function GlobalScrollProgress() {
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const rafId = useRef(null);

  useEffect(() => {
    // Reset progress on route transition
    setProgress(0);

    const calculateAndSetProgress = (element) => {
      let current = 0;
      let total = 0;

      if (element && element !== document && element !== window && element.scrollHeight > element.clientHeight) {
        current = element.scrollTop;
        total = element.scrollHeight - element.clientHeight;
      } else {
        const workspaceContainer = document.getElementById('workspace-scroll-container');
        const mainContainer = document.getElementById('main-scroll-container');

        if (workspaceContainer && workspaceContainer.scrollHeight > workspaceContainer.clientHeight) {
          current = workspaceContainer.scrollTop;
          total = workspaceContainer.scrollHeight - workspaceContainer.clientHeight;
        } else if (mainContainer && mainContainer.scrollHeight > mainContainer.clientHeight) {
          current = mainContainer.scrollTop;
          total = mainContainer.scrollHeight - mainContainer.clientHeight;
        } else {
          current = window.scrollY || document.documentElement.scrollTop;
          total = document.documentElement.scrollHeight - window.innerHeight;
        }
      }

      if (total > 0) {
        const ratio = Math.min(1, Math.max(0, current / total));
        setProgress(ratio);
      } else {
        setProgress(0);
      }
    };

    const updateScroll = (e) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        calculateAndSetProgress(e?.target);
      });
    };

    // Attach to window with capture: true so that scroll events from ANY inner container
    // (such as #workspace-scroll-container or #main-scroll-container) trigger progress calculation
    window.addEventListener('scroll', updateScroll, { passive: true, capture: true });

    // Initial and deferred checks after page renders
    calculateAndSetProgress();
    const timer1 = setTimeout(() => calculateAndSetProgress(), 80);
    const timer2 = setTimeout(() => calculateAndSetProgress(), 250);

    return () => {
      window.removeEventListener('scroll', updateScroll, { capture: true });
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname]);

  return (
    <aside 
      aria-label="Page scroll progress"
      className="fixed top-0 left-0 right-0 h-[3.5px] z-[9999] pointer-events-none select-none bg-stone-300/30 dark:bg-stone-800/60 border-b border-stone-200/50 dark:border-stone-800/80"
    >
      {/* GPU-Accelerated Progress Track (Zero Layout Reflow, 120Hz/60Hz Hardware Smoothness) */}
      <div
        className="h-full w-full origin-left will-change-transform
          bg-gradient-to-r from-[#2A1B14] via-[#C27803] to-[#D97706]
          dark:bg-gradient-to-r dark:from-[#B45309] dark:via-[#F59E0B] dark:to-[#FDE68A]
          shadow-[0_1px_8px_rgba(194,120,3,0.5)]
          dark:shadow-[0_0_14px_rgba(245,158,11,0.8),0_0_24px_rgba(251,191,36,0.6)]"
        style={{
          transform: `scaleX(${progress})`,
        }}
      />

      {/* High-Contrast Photon Laser Bead (Always Razor-Sharp Visible in Both Light & Dark Modes) */}
      {progress > 0.005 && (
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform duration-75 ease-out"
          style={{ left: `${progress * 100}%` }}
        >
          {/* Light Mode: Deep Espresso bead with warm cream rim that POPs against light backgrounds */}
          {/* Dark Mode: Radiant Warm Amber / Honey bead glowing against dark backgrounds */}
          <div className="w-2.5 h-2.5 rounded-full 
            bg-[#2A1B14] border-[1.5px] border-[#FDFBF7] shadow-[0_0_8px_rgba(194,120,3,0.95),0_1px_3px_rgba(0,0,0,0.3)]
            dark:bg-amber-300 dark:border-[1.5px] dark:border-[#2A1B14] dark:shadow-[0_0_10px_#f59e0b,0_0_16px_rgba(251,191,36,0.9)]"
          />
        </div>
      )}
    </aside>
  );
}
