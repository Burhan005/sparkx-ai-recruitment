import React, { useState, useEffect, useRef } from 'react';

/**
 * Aurora Reticle Cursor — SparkX
 *
 * Dedicated, pristine custom cursor with:
 * - Rotating conic-gradient ring (cyan/teal/violet in dark mode, whisper-thin teal in light mode)
 * - 4px high-contrast center stylus tip that dissolves on hover over interactive elements
 * - Magnetic snap toward buttons and cards (30% pull)
 * - Velocity ghost particles during rapid gestures
 * - Click shockwave ripple
 * - Pure cursor behavior with ZERO UI clutter or menu options
 */
export default function LandingCursor() {
  const [isVisible, setIsVisible] = useState(false);

  // ── Refs for 120Hz/60Hz RAF loop ──
  const dotRef       = useRef(null);
  const followerRef  = useRef(null);
  const rippleRef    = useRef(null);
  const trail1Ref    = useRef(null);
  const trail2Ref    = useRef(null);
  const trail3Ref    = useRef(null);

  const mousePos       = useRef({ x: -100, y: -100 });
  const followerPos    = useRef({ x: -100, y: -100 });
  const prevFollowerX  = useRef(-100);
  const prevFollowerY  = useRef(-100);
  const trail1Pos      = useRef({ x: -100, y: -100 });
  const trail2Pos      = useRef({ x: -100, y: -100 });
  const trail3Pos      = useRef({ x: -100, y: -100 });

  const smoothSpeed    = useRef(0);
  const currentScale   = useRef(1);
  const hoveredElRef   = useRef(null);
  const isHoveredRef   = useRef(false);
  const isClickedRef   = useRef(false);
  const rafId          = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isFine   = window.matchMedia('(pointer: fine)').matches;
    const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFine || reduced) return;

    /* ── Event listeners ── */
    const onMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      const target = e.target;
      const interactive = target && target.closest(
        'button, a, input, textarea, select, [role="button"], .interactive-card, .group, [tabindex="0"]'
      );
      hoveredElRef.current = interactive || null;
      isHoveredRef.current = !!interactive;

      if (followerRef.current) {
        followerRef.current.classList.toggle('is-hovered', !!interactive);
      }
      if (dotRef.current) {
        dotRef.current.style.opacity = interactive ? '0' : '1';
      }
    };

    const onDown = () => {
      isClickedRef.current = true;
      if (rippleRef.current) {
        const r = rippleRef.current;
        r.style.transition = 'none';
        r.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) scale(0.15)`;
        r.style.opacity = '0.7';
        requestAnimationFrame(() => {
          r.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.45s ease-out';
          r.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0) scale(2.2)`;
          r.style.opacity = '0';
        });
      }
    };

    const onUp    = () => { isClickedRef.current = false; };
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    /* ── Core Animation Loop ── */
    const animate = () => {
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const hovered = isHoveredRef.current;
      const clicked = isClickedRef.current;

      // 1. Magnetic pull toward interactive element center
      let targetX = mx;
      let targetY = my;

      if (hovered && hoveredElRef.current) {
        try {
          const rect = hoveredElRef.current.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top  + rect.height / 2;
          targetX = mx + (cx - mx) * 0.28;
          targetY = my + (cy - my) * 0.28;
        } catch {}
      }

      // 2. Smooth Lerp
      followerPos.current.x += (targetX - followerPos.current.x) * 0.18;
      followerPos.current.y += (targetY - followerPos.current.y) * 0.18;

      // 3. Velocity
      const vx = followerPos.current.x - prevFollowerX.current;
      const vy = followerPos.current.y - prevFollowerY.current;
      prevFollowerX.current = followerPos.current.x;
      prevFollowerY.current = followerPos.current.y;
      const instantSpeed = Math.sqrt(vx * vx + vy * vy);
      smoothSpeed.current += (instantSpeed - smoothSpeed.current) * 0.2;

      // 4. Smooth scale
      const targetScale = hovered ? 1.18 : clicked ? 0.85 : 1;
      currentScale.current += (targetScale - currentScale.current) * 0.14;

      // 5. Velocity Ghost Trail Particles
      trail1Pos.current.x += (mx - trail1Pos.current.x) * 0.13;
      trail1Pos.current.y += (my - trail1Pos.current.y) * 0.13;
      trail2Pos.current.x += (trail1Pos.current.x - trail2Pos.current.x) * 0.1;
      trail2Pos.current.y += (trail1Pos.current.y - trail2Pos.current.y) * 0.1;
      trail3Pos.current.x += (trail2Pos.current.x - trail3Pos.current.x) * 0.08;
      trail3Pos.current.y += (trail2Pos.current.y - trail3Pos.current.y) * 0.08;

      const sp = smoothSpeed.current;
      if (trail1Ref.current) {
        trail1Ref.current.style.transform = `translate3d(${trail1Pos.current.x}px, ${trail1Pos.current.y}px, 0)`;
        trail1Ref.current.style.opacity = sp > 2.5 ? Math.min(0.5, sp * 0.035) : '0';
      }
      if (trail2Ref.current) {
        trail2Ref.current.style.transform = `translate3d(${trail2Pos.current.x}px, ${trail2Pos.current.y}px, 0)`;
        trail2Ref.current.style.opacity = sp > 4 ? Math.min(0.32, sp * 0.02) : '0';
      }
      if (trail3Ref.current) {
        trail3Ref.current.style.transform = `translate3d(${trail3Pos.current.x}px, ${trail3Pos.current.y}px, 0)`;
        trail3Ref.current.style.opacity = sp > 6 ? Math.min(0.18, sp * 0.012) : '0';
      }

      // 6. Dot position
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      }

      // 7. Follower ring
      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0) scale(${currentScale.current.toFixed(4)})`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="hidden sm:block pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {/* Velocity ghost trail particles */}
      <div ref={trail1Ref} className="fixed top-0 left-0 -ml-[3px] -mt-[3px] w-1.5 h-1.5 rounded-full pointer-events-none will-change-transform bg-teal-500/70 dark:bg-cyan-400/60" style={{ opacity: 0 }} />
      <div ref={trail2Ref} className="fixed top-0 left-0 -ml-0.5  -mt-0.5  w-1   h-1   rounded-full pointer-events-none will-change-transform bg-teal-400/50 dark:bg-cyan-300/40" style={{ opacity: 0 }} />
      <div ref={trail3Ref} className="fixed top-0 left-0 -ml-[1px] -mt-[1px] w-0.5 h-0.5 rounded-full pointer-events-none will-change-transform bg-teal-300/30 dark:bg-cyan-200/25" style={{ opacity: 0 }} />

      {/* Center stylus dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-0.5 -mt-0.5 w-1 h-1 rounded-full pointer-events-none will-change-transform
          bg-teal-700 dark:bg-cyan-100
          shadow-[0_0_5px_rgba(13,148,136,0.9)] dark:shadow-[0_0_7px_#67e8f9]
          transition-opacity duration-200 ease-out"
      />

      {/* Aurora rotating gradient ring */}
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-[22px] h-[22px] -ml-[11px] -mt-[11px]
          cursor-aurora-ring pointer-events-none will-change-transform
          flex items-center justify-center
          transition-[box-shadow,background-color] duration-300 ease-out
          shadow-[0_0_10px_rgba(13,148,136,0.12)]
          dark:shadow-[0_0_14px_rgba(34,211,238,0.25)]"
      />

      {/* Click Shockwave Ripple */}
      <div
        ref={rippleRef}
        className="fixed top-0 left-0 -ml-5 -mt-5 w-10 h-10 rounded-full pointer-events-none
          border-[1.5px] border-teal-500/70 dark:border-cyan-300/70 opacity-0 will-change-transform"
      />
    </div>
  );
}
