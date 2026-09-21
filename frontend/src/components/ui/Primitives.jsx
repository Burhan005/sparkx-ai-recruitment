import React, { useState, useEffect, useRef } from 'react';

/**
 * Animated number counter that smoothly increments from 0 to the target value.
 * Activates when the element scrolls into view.
 */
export function AnimatedCounter({ value, suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const step = end / (duration / 16);
    const tick = () => {
      start += step;
      if (start >= end) { setDisplay(end); return; }
      setDisplay(Math.floor(start));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, value, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/**
 * Skeleton loader card — renders a shimmering placeholder.
 */
export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass-card p-5 rounded-2xl space-y-3 animate-pulse ${className}`}>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-1/3" />
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-200 dark:bg-slate-800 rounded-full`} style={{ width: `${85 - i * 15}%` }} />
      ))}
      <div className="flex gap-2 pt-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonKPI — renders 4 stat card placeholders.
 */
export function SkeletonKPI() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="glass-card p-5 rounded-2xl animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2" />
            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-1/2" />
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * FadeInUp — wraps children with a CSS transition that fades them in from below.
 * Uses IntersectionObserver so it triggers when scrolled into view.
 */
export function FadeInUp({ children, delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Immediate fallback so top-level containers never remain blank if observer delays
    const timer = setTimeout(() => setVisible(true), 60);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.5s ease ${delay}ms`,
        transform: visible ? 'none' : 'translateY(16px)',
        opacity: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

/**
 * SlideIn — slides children in from the left or right.
 */
export function SlideIn({ children, from = 'left', delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 60);
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const xInit = from === 'left' ? '-24px' : '24px';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `transform 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity 0.5s ease ${delay}ms`,
        transform: visible ? 'none' : `translateX(${xInit})`,
        opacity: visible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
}

/**
 * StatusBadge — colored pill for pipeline status values.
 */
export function StatusBadge({ status }) {
  const map = {
    Shortlisted: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50',
    Rejected:    'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/50',
    Evaluated:   'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50',
    Screening:   'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800/50',
    Active:      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    default:     'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };
  const cls = map[status] || map.default;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {status}
    </span>
  );
}
