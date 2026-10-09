import React, { useState, useEffect } from 'react';

export default function CosmicThemeWave() {
  const [wave, setWave] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const x = detail.x ?? (window.innerWidth / 2);
      const y = detail.y ?? (window.innerHeight / 2);
      const endRadius = detail.endRadius ?? Math.hypot(window.innerWidth, window.innerHeight);
      const targetTheme = detail.targetTheme || 'dark';

      setWave({
        id: Date.now(),
        x,
        y,
        endRadius,
        targetTheme
      });
    };

    window.addEventListener('sparkx:cosmic-theme', handler);
    return () => window.removeEventListener('sparkx:cosmic-theme', handler);
  }, []);

  // Clean unmount after animation completes
  useEffect(() => {
    if (!wave) return;
    const timer = setTimeout(() => setWave(null), 650);
    return () => clearTimeout(timer);
  }, [wave]);

  if (!wave) return null;

  const isDarkTarget = wave.targetTheme === 'dark';
  const diameter = Math.ceil(wave.endRadius * 2.2);

  // 12 Radial Starlight Embers ejected outwards in 360 degrees
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    const distance = 50 + (i % 3) * 25;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;
    return { id: i, px, py, delay: (i % 3) * 0.03 };
  });

  return (
    <div
      key={wave.id}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999999] overflow-hidden select-none"
    >
      {/* ── 1. Planetary Plasma Shockwave Wavefront Ring ── */}
      <div
        style={{
          left: `${wave.x}px`,
          top: `${wave.y}px`,
          width: `${diameter}px`,
          height: `${diameter}px`,
          marginLeft: `-${diameter / 2}px`,
          marginTop: `-${diameter / 2}px`,
          border: isDarkTarget
            ? '3.5px solid rgba(245, 158, 11, 0.95)'
            : '3.5px solid rgba(251, 191, 36, 0.95)',
          boxShadow: isDarkTarget
            ? '0 0 65px 20px rgba(245, 158, 11, 0.6), inset 0 0 35px 8px rgba(251, 191, 36, 0.45)'
            : '0 0 65px 20px rgba(251, 191, 36, 0.7), inset 0 0 35px 8px rgba(254, 240, 138, 0.55)',
          borderRadius: '9999px',
          animation: 'cosmic-shockwave-ring 550ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards',
          willChange: 'transform, opacity',
        }}
        className="absolute pointer-events-none"
      />

      {/* ── 2. Epicenter Supernova Starburst Flare ── */}
      <div
        style={{ left: `${wave.x}px`, top: `${wave.y}px` }}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        {/* Core Radiance Orb */}
        <div
          style={{
            animation: 'cosmic-core-starburst 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          className={`w-14 h-14 -ml-7 -mt-7 rounded-full blur-sm ${
            isDarkTarget
              ? 'bg-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.9)]'
              : 'bg-amber-300 shadow-[0_0_40px_rgba(251,191,36,0.95)]'
          }`}
        />

        {/* 8-Point Diffraction Star Flare Cross */}
        <div
          style={{
            animation: 'cosmic-core-starburst 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {/* Horizontal Beam */}
          <div
            className={`w-28 h-[2px] rounded-full blur-[0.5px] ${
              isDarkTarget ? 'bg-amber-300' : 'bg-amber-200'
            }`}
          />
          {/* Vertical Beam */}
          <div
            className={`absolute h-28 w-[2px] rounded-full blur-[0.5px] ${
              isDarkTarget ? 'bg-amber-300' : 'bg-amber-200'
            }`}
          />
          {/* Diagonal 45° Beam */}
          <div
            className={`absolute w-16 h-[1.5px] rotate-45 rounded-full blur-[0.5px] ${
              isDarkTarget ? 'bg-amber-200/80' : 'bg-white'
            }`}
          />
          {/* Diagonal 135° Beam */}
          <div
            className={`absolute w-16 h-[1.5px] -rotate-45 rounded-full blur-[0.5px] ${
              isDarkTarget ? 'bg-amber-200/80' : 'bg-white'
            }`}
          />
        </div>

        {/* ── 3. 12 Radial Starlight Embers Ejected in 360° ── */}
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              '--px': `${p.px}px`,
              '--py': `${p.py}px`,
              animation: 'cosmic-ember-flight 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
              animationDelay: `${p.delay}s`,
            }}
            className={`absolute top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full ${
              isDarkTarget
                ? 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                : 'bg-amber-300 shadow-[0_0_10px_#FCD34D]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
