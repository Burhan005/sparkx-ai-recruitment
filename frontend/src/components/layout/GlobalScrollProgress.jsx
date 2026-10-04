import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal High-Performance GPU Scroll Progress Bar
 * - Runs with requestAnimationFrame + transform: scaleX for 120Hz/60Hz buttery smoothness
 * - High-contrast dual-mode photon bead: ultra-visible crisp teal/emerald in light mode, radiant neon in dark mode
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
          bg-gradient-to-r from-teal-700 via-teal-500 to-amber-500
          dark:bg-gradient-to-r dark:from-teal-300 dark:via-cyan-300 dark:to-yellow-300
          shadow-[0_1px_8px_rgba(13,148,136,0.6)]
          dark:shadow-[0_0_14px_rgba(45,212,191,0.9),0_0_24px_rgba(56,189,248,0.7)]"
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
          {/* Light Mode: Crisp dark teal bead with white rim so it POPs against white/cream backgrounds */}
          {/* Dark Mode: Electric neon-cyan diamond star bead with bright glow against black */}
          <div className="w-2.5 h-2.5 rounded-full 
            bg-teal-700 border-[1.5px] border-white shadow-[0_0_6px_rgba(13,148,136,0.95),0_1px_3px_rgba(0,0,0,0.3)]
            dark:bg-cyan-200 dark:border-[1.5px] dark:border-teal-950 dark:shadow-[0_0_10px_#22d3ee,0_0_16px_rgba(45,212,191,0.9)]"
          />
        </div>
      )}
    </aside>
  );
}
