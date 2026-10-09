import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Aurora Reticle Cursor — SparkX
 *
 * High-performance 120Hz/60Hz custom celestial cursor:
 * - Uses React createPortal directly into document.body to prevent any CSS
 *   transform / scroll containing-block displacement.
 * - Center stylus core tracks 1:1 with hardware pointer (0ms latency).
 * - Celestial aurora follower ring tracks directly to cursor coordinates without
 *   snapping or getting stuck to container centers.
 * - Expands gracefully in-place when hovering buttons, links, and inputs.
 * - 100% pointer-events-none so scrolling, clicking, and selecting are flawless.
 */
export default function LandingCursor() {
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef(null);
  const dotRef       = useRef(null);
  const followerRef  = useRef(null);
  const rippleRef    = useRef(null);
  const trail1Ref    = useRef(null);
  const trail2Ref    = useRef(null);

  const mousePos      = useRef({ x: -100, y: -100 });
  const followerPos   = useRef({ x: -100, y: -100 });
  const trail1Pos     = useRef({ x: -100, y: -100 });
  const trail2Pos     = useRef({ x: -100, y: -100 });
  const prevFollowerX = useRef(-100);
  const prevFollowerY = useRef(-100);

  const smoothSpeed   = useRef(0);
  const currentScale  = useRef(1);
  const isHoveredRef  = useRef(false);
  const isClickedRef  = useRef(false);
  const rafId         = useRef(null);
  const hasMovedRef   = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Only activate on fine precision pointers (mice / trackpads)
    const isFine = window.matchMedia('(pointer: fine)').matches;
    if (!isFine) return;

    const onMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      mousePos.current.x = x;
      mousePos.current.y = y;

      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        followerPos.current.x = x;
        followerPos.current.y = y;
        trail1Pos.current.x = x;
        trail1Pos.current.y = y;
        trail2Pos.current.x = x;
        trail2Pos.current.y = y;
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      }

      // Center core dot follows mouse instantly with zero lag
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      // Check if hovering over truly interactive element
      const target = e.target;
      const interactive = target && target.closest('button, a, input, textarea, select, [role="button"], label[for]');
      isHoveredRef.current = !!interactive;
    };

    const onDown = (e) => {
      isClickedRef.current = true;
      if (rippleRef.current) {
        const r = rippleRef.current;
        r.style.transition = 'none';
        r.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(0.2)`;
        r.style.opacity = '0.75';
        requestAnimationFrame(() => {
          r.style.transition = 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s ease-out';
          r.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) scale(2.2)`;
          r.style.opacity = '0';
        });
      }
    };

    const onUp = () => {
      isClickedRef.current = false;
    };

    const onLeave = () => {
      if (containerRef.current) {
        containerRef.current.style.opacity = '0';
      }
    };

    const onEnter = () => {
      if (containerRef.current && hasMovedRef.current) {
        containerRef.current.style.opacity = '1';
      }
    };

    /* ── High-Performance 120Hz Animation Loop ── */
    const animate = () => {
      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const hovered = isHoveredRef.current;
      const clicked = isClickedRef.current;

      // Tight, responsive follow directly to mouse coordinates
      followerPos.current.x += (mx - followerPos.current.x) * 0.45;
      followerPos.current.y += (my - followerPos.current.y) * 0.45;

      // Speed calculation
      const vx = followerPos.current.x - prevFollowerX.current;
      const vy = followerPos.current.y - prevFollowerY.current;
      prevFollowerX.current = followerPos.current.x;
      prevFollowerY.current = followerPos.current.y;
      const instantSpeed = Math.sqrt(vx * vx + vy * vy);
      smoothSpeed.current += (instantSpeed - smoothSpeed.current) * 0.25;

      // Scale up when hovered, scale down on click
      const targetScale = hovered ? 1.45 : clicked ? 0.75 : 1;
      currentScale.current += (targetScale - currentScale.current) * 0.22;

      // Micro velocity trail
      trail1Pos.current.x += (mx - trail1Pos.current.x) * 0.32;
      trail1Pos.current.y += (my - trail1Pos.current.y) * 0.32;
      trail2Pos.current.x += (trail1Pos.current.x - trail2Pos.current.x) * 0.25;
      trail2Pos.current.y += (trail1Pos.current.y - trail2Pos.current.y) * 0.25;

      const sp = smoothSpeed.current;
      if (trail1Ref.current) {
        trail1Ref.current.style.transform = `translate3d(${trail1Pos.current.x}px, ${trail1Pos.current.y}px, 0)`;
        trail1Ref.current.style.opacity = sp > 2.5 ? Math.min(0.5, (sp - 2.5) * 0.05).toFixed(2) : '0';
      }
      if (trail2Ref.current) {
        trail2Ref.current.style.transform = `translate3d(${trail2Pos.current.x}px, ${trail2Pos.current.y}px, 0)`;
        trail2Ref.current.style.opacity = sp > 5 ? Math.min(0.35, (sp - 5) * 0.035).toFixed(2) : '0';
      }

      // Follower ring position & scale
      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0) scale(${currentScale.current.toFixed(3)})`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [mounted]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef}
      className="hidden sm:block pointer-events-none fixed inset-0 z-[99999] overflow-hidden transition-opacity duration-200"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Velocity ghost trail particles */}
      <div
        ref={trail1Ref}
        className="fixed top-0 left-0 -ml-[2px] -mt-[2px] w-1 h-1 rounded-full pointer-events-none will-change-transform bg-[#C27803]/60 dark:bg-amber-400/50"
        style={{ opacity: 0 }}
      />
      <div
        ref={trail2Ref}
        className="fixed top-0 left-0 -ml-[1.5px] -mt-[1.5px] w-0.5 h-0.5 rounded-full pointer-events-none will-change-transform bg-[#D97706]/40 dark:bg-amber-300/30"
        style={{ opacity: 0 }}
      />

      {/* Center stylus tip — always at exact hardware cursor coordinates */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 -ml-[2px] -mt-[2px] w-1 h-1 rounded-full pointer-events-none will-change-transform
          bg-[#2A1B14] dark:bg-amber-100
          shadow-[0_0_5px_rgba(194,120,3,0.9)] dark:shadow-[0_0_6px_#fbbf24]"
      />

      {/* Celestial Aurora rotating gradient ring */}
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-[22px] h-[22px] -ml-[11px] -mt-[11px]
          cursor-aurora-ring pointer-events-none will-change-transform
          flex items-center justify-center
          shadow-[0_0_10px_rgba(194,120,3,0.22)]
          dark:shadow-[0_0_14px_rgba(245,158,11,0.35)]"
      />

      {/* Click Shockwave Ripple */}
      <div
        ref={rippleRef}
        className="fixed top-0 left-0 -ml-5 -mt-5 w-10 h-10 rounded-full pointer-events-none
          border-[1.5px] border-[#C27803]/80 dark:border-amber-300/80 opacity-0 will-change-transform"
      />
    </div>,
    document.body
  );
}
