import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PageTransitionContext = createContext({
  smoothNavigate: () => {},
  isTransitioning: false,
});

/**
 * Universal Cinematic Page Transition Provider
 * Delivers buttery-smooth 60/120fps route transitions with zero screen flash or layout jumps.
 * - Hardware-accelerated backdrop blur veil
 * - Travelling photon laser beam indicator
 * - Automatic scroll-to-top synchronization
 * - Fallback protection against stuck transitions
 */
export function PageTransitionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState('idle'); // 'idle' | 'covering' | 'revealing'
  const isNavigating = useRef(false);

  // Reset phase on location change if user navigates via browser back/forward buttons
  useEffect(() => {
    if (phase === 'covering') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setPhase('revealing');
      const timer = setTimeout(() => {
        setPhase('idle');
        isNavigating.current = false;
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const smoothNavigate = useCallback((to) => {
    // If target is current path or hash anchor, navigate directly
    if (to === location.pathname || to.startsWith('#')) {
      if (to.startsWith('#')) {
        const el = document.getElementById(to.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (isNavigating.current) return;
    isNavigating.current = true;

    // Phase 1: Smoothly shroud current view with frosted veil (180ms)
    setPhase('covering');

    setTimeout(() => {
      // Phase 2: Route change + instant scroll reset
      navigate(to);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Phase 3: Smoothly unmask the new view (220ms)
      setPhase('revealing');

      setTimeout(() => {
        setPhase('idle');
        isNavigating.current = false;
      }, 220);
    }, 180);
  }, [navigate, location.pathname]);

  return (
    <PageTransitionContext.Provider value={{ smoothNavigate, isTransitioning: phase !== 'idle' }}>
      {children}

      {/* ── Cinematic Transition Shroud (Zero Flash, Velvety Frosted Glass) ── */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[99999] pointer-events-none transition-all ${
          phase === 'covering'
            ? 'opacity-100 backdrop-blur-xl bg-[#FAF8F5]/85 dark:bg-[#110F0D]/90 duration-180 ease-out'
            : phase === 'revealing'
            ? 'opacity-0 backdrop-blur-none bg-transparent duration-220 ease-in'
            : 'opacity-0 pointer-events-none duration-0'
        }`}
      >
        {/* Glowing Photon Travelling Laser Beam along top edge */}
        {phase !== 'idle' && (
          <div className="absolute top-0 left-0 right-0 h-[2.5px] overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-teal-400 dark:via-teal-300 to-transparent animate-shimmer" />
          </div>
        )}
      </div>
    </PageTransitionContext.Provider>
  );
}

export const useSmoothNavigate = () => useContext(PageTransitionContext);
export default PageTransitionContext;
