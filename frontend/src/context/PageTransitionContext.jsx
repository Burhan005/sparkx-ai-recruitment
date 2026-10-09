import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PageTransitionContext = createContext({
  smoothNavigate: () => {},
  isTransitioning: false,
});

/**
 * Universal High-Performance Page Transition Provider
 * - Instant route execution (0ms click latency, no artificial delay)
 * - Sleek photon laser progress indicator on top
 * - Automatic scroll-to-top synchronization for window and #main-scroll-container
 * - Rock-solid layout: no jarring full-screen dimming veil over the sidebar/navbar
 */
export function PageTransitionProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [laserActive, setLaserActive] = useState(false);
  const prevPathRef = useRef(location.pathname);
  const laserTimerRef = useRef(null);

  // Helper to cleanly reset scroll position across both window and app scroll containers
  const resetScrollPositions = useCallback(() => {
    try {
      const mainScroll = document.getElementById('main-scroll-container');
      if (mainScroll) mainScroll.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const workspaceScroll = document.getElementById('workspace-scroll-container');
      if (workspaceScroll) workspaceScroll.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {}
  }, []);

  // Universal Route Change Listener:
  // Fires instantly when location.pathname changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      resetScrollPositions();

      // Trigger the sleek top photon laser line
      setLaserActive(true);
      if (laserTimerRef.current) clearTimeout(laserTimerRef.current);
      laserTimerRef.current = setTimeout(() => {
        setLaserActive(false);
      }, 350);
    }
  }, [location.pathname, resetScrollPositions]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (laserTimerRef.current) clearTimeout(laserTimerRef.current);
    };
  }, []);

  // Instant smooth navigation (zero lag, zero artificial timeout)
  const smoothNavigate = useCallback((to, options = {}) => {
    const currentFull = location.pathname + location.search;
    const isTargetSame = (to === currentFull);
    const hasSpecialState = Boolean(options?.state);

    if ((isTargetSame && !hasSpecialState) || (typeof to === 'string' && to.startsWith('#'))) {
      if (typeof to === 'string' && to.startsWith('#')) {
        const el = document.getElementById(to.slice(1));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Trigger laser bar immediately
    setLaserActive(true);
    if (laserTimerRef.current) clearTimeout(laserTimerRef.current);
    laserTimerRef.current = setTimeout(() => {
      setLaserActive(false);
    }, 350);

    // Navigate immediately without artificial lag
    navigate(to, options);
    resetScrollPositions();
  }, [navigate, location.pathname, location.search, resetScrollPositions]);

  return (
    <PageTransitionContext.Provider value={{ smoothNavigate, isTransitioning: laserActive }}>
      {children}

      {/* ── High-Precision Photon Laser Beam across top edge (Zero Flash) ── */}
      {laserActive && (
        <div
          aria-hidden="true"
          className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999999] pointer-events-none select-none overflow-hidden"
        >
          <div
            className="w-full h-full bg-gradient-to-r from-transparent via-[#C27803] to-[#F59E0B] dark:via-amber-400 dark:to-yellow-300"
            style={{
              boxShadow: '0 0 10px 1px rgba(245, 158, 11, 0.7), 0 0 20px 2px rgba(194, 120, 3, 0.35)',
              animation: 'photon-laser-sweep 320ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
              willChange: 'transform',
            }}
          />
        </div>
      )}
    </PageTransitionContext.Provider>
  );
}

export const useSmoothNavigate = () => useContext(PageTransitionContext);
export default PageTransitionContext;
