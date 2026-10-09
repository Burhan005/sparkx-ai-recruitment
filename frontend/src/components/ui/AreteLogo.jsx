import React from 'react';

/**
 * AreteEmblem — The Interlocking Ribbon "A"
 * High-precision vector architecture replicating the proprietary mobius ribbon structure:
 * - Loop 1: Charcoal & Espresso outer curve with smooth bevel and inner drop shadow
 * - Loop 2: Champagne & Gold satin ribbon wrapping through the central apex
 * - Right Leg: Structural warm stone/taupe architectural pillar
 */
export function AreteEmblem({
  size = 36,
  className = '',
  variant = 'brand' // 'brand' | 'monochrome-dark' | 'monochrome-light'
}) {
  const isDarkMono = variant === 'monochrome-dark';
  const isLightMono = variant === 'monochrome-light';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Champagne Gold Satin Gradient for the sweeping ribbon */}
        <linearGradient id="arete-gold-ribbon" x1="68" y1="28" x2="26" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DFD2C0" />
          <stop offset="30%" stopColor="#D5BF9F" />
          <stop offset="65%" stopColor="#C4A882" />
          <stop offset="100%" stopColor="#B39369" />
        </linearGradient>

        {/* Gold Ribbon Shadow Crease */}
        <linearGradient id="arete-gold-crease" x1="48" y1="36" x2="62" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9C7F59" />
          <stop offset="100%" stopColor="#C8AE8C" />
        </linearGradient>

        {/* Architectural Pillar Gradient (Right Leg) */}
        <linearGradient id="arete-pillar-facet" x1="56" y1="38" x2="84" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A89E92" />
          <stop offset="50%" stopColor="#93887B" />
          <stop offset="100%" stopColor="#7B7063" />
        </linearGradient>

        {/* Deep Charcoal Outer Loop Gradients */}
        <linearGradient id="arete-charcoal-body" x1="16" y1="22" x2="48" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1A17" />
          <stop offset="40%" stopColor="#120F0D" />
          <stop offset="100%" stopColor="#0A0807" />
        </linearGradient>

        <linearGradient id="arete-charcoal-bevel" x1="22" y1="18" x2="48" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3D3630" />
          <stop offset="100%" stopColor="#1A1512" />
        </linearGradient>

        {/* Subtle Inner Ambience Filter */}
        <filter id="arete-subtle-shadow" x="-8%" y="-8%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── 1. RIGHT ARCHITECTURAL PILLAR (Foundational Strut) ── */}
      <g id="pillar-base">
        {/* Main Pillar Body */}
        <path
          d="M 52 34 L 72 74 L 88 74 L 62 26 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : 'url(#arete-pillar-facet)'}
        />
        {/* Right Ground Foot Bevel */}
        <path
          d="M 72 74 L 88 74 L 88 78 L 72 78 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : '#63594D'}
          opacity="0.8"
        />
        {/* Left Shadow on Pillar */}
        <path
          d="M 52 34 L 62 26 L 65 33 L 56 42 Z"
          fill="#000000"
          opacity={isDarkMono ? '0' : '0.35'}
        />
      </g>

      {/* ── 2. DARK CHARCOAL OUTER LOOP (Left A-Stroke & Cross Wrap) ── */}
      <g id="charcoal-loop">
        {/* Left Upright Stem to Apex */}
        <path
          d="M 18 70 C 13 62 17 44 28 28 C 34 20 42 16 48 18 C 54 20 56 26 51 34 L 38 56 C 34 62 28 68 22 71 C 20 72 18 71 18 70 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : 'url(#arete-charcoal-body)'}
        />

        {/* Apex Outer Bevel Crown */}
        <path
          d="M 28 28 C 34 20 42 16 48 18 C 53 20 55 24 51 31 C 46 25 39 22 33 26 C 29 28 27 31 26 34 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : 'url(#arete-charcoal-bevel)'}
          opacity="0.9"
        />

        {/* Bottom Left Sweeping Cradle / Curve */}
        <path
          d="M 18 70 C 18 75 24 81 33 80 C 44 79 56 68 64 54 C 62 52 59 50 56 53 C 48 64 38 73 30 73 C 24 73 20 69 20 65 C 20 61 24 53 28 47 L 23 44 C 18 52 17 66 18 70 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : 'url(#arete-charcoal-body)'}
        />
      </g>

      {/* ── 3. CHAMPAGNE & GOLD SATIN RIBBON (The Interlocking Mobius Turn) ── */}
      <g id="gold-satin-ribbon" filter={isDarkMono || isLightMono ? undefined : 'url(#arete-subtle-shadow)'}>
        {/* Sweeping Forward Ribbon Loop across the front */}
        <path
          d="M 21 66 C 26 73 36 75 46 69 C 58 61 68 47 72 37 C 75 30 72 26 66 28 C 60 30 55 36 50 45 L 43 57 C 37 66 29 68 21 66 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : 'url(#arete-gold-ribbon)'}
        />

        {/* Top Fold of the Golden Ribbon */}
        <path
          d="M 66 28 C 72 26 75 30 72 37 C 70 42 66 50 61 57 C 62 50 65 40 66 35 C 67 31 66 29 64 30 C 60 32 56 38 52 45 L 50 45 C 55 36 60 30 66 28 Z"
          fill={isDarkMono ? '#FAF8F5' : isLightMono ? '#1C1917' : 'url(#arete-gold-crease)'}
        />

        {/* Inner Highlight Edge */}
        <path
          d="M 23 66 C 30 72 39 73 48 68 C 58 61 68 48 71 38 C 70 38 69 40 68 42 C 64 51 55 63 45 69 C 37 73 28 72 23 66 Z"
          fill="#FFFFFF"
          opacity={isDarkMono ? '0.4' : '0.35'}
        />
      </g>
    </svg>
  );
}

/**
 * AreteLogo — Master Brand Signature Lockup
 * Replicates the authoritative luxury layout:
 * - Geometric Ribbon Emblem on the left
 * - Cormorant/Cinzel High-Contrast Serif 'ARETE' Wordmark
 * - Subtitle: 'WHERE TALENT MEETS INTELLIGENCE' with wide letter-spacing
 */
export default function AreteLogo({
  variant = 'horizontal', // 'horizontal' | 'mark' | 'icon'
  size = 'md',
  subtitle = 'WHERE TALENT MEETS INTELLIGENCE',
  showSubtitle = true,
  badge,
  className = '',
  onClick,
}) {
  const pixelSizes = {
    xs: { mark: 22, text: 'text-sm tracking-[0.14em]', sub: 'text-[7.5px] tracking-[0.24em]', gap: 'gap-2', badge: 'text-[8.5px] px-1 py-0.2' },
    sm: { mark: 28, text: 'text-base tracking-[0.16em]', sub: 'text-[8.5px] tracking-[0.28em]', gap: 'gap-2.5', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { mark: 38, text: 'text-xl sm:text-2xl tracking-[0.18em]', sub: 'text-[9.5px] sm:text-[10px] tracking-[0.3em]', gap: 'gap-3.5', badge: 'text-[10px] px-2 py-0.5' },
    lg: { mark: 52, text: 'text-2xl sm:text-3xl tracking-[0.2em]', sub: 'text-[11px] sm:text-[12px] tracking-[0.32em]', gap: 'gap-4', badge: 'text-[11px] px-2.5 py-0.5' },
  };

  const currentSize = pixelSizes[size] || pixelSizes.md;

  // Variant: Standalone App Icon Tile (matching presentation row 03)
  if (variant === 'icon') {
    const tileSizes = {
      xs: 'w-8 h-8 rounded-xl',
      sm: 'w-10 h-10 rounded-xl',
      md: 'w-12 h-12 rounded-2xl',
      lg: 'w-16 h-16 rounded-3xl',
    };
    return (
      <div
        onClick={onClick}
        className={`${tileSizes[size] || tileSizes.md} bg-[#100F0D] border border-[#3E2E24] shadow-md flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer hover:border-amber-500/40' : ''} ${className}`}
        title="ARETE"
      >
        <AreteEmblem size={currentSize.mark} />
      </div>
    );
  }

  // Variant: Standalone Emblem Mark (row 02)
  if (variant === 'mark') {
    return (
      <div onClick={onClick} className={`inline-flex items-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <AreteEmblem size={currentSize.mark} />
      </div>
    );
  }

  // Variant: Primary Hero Brand Signature (matching presentation row 01)
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.gap} select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Interlocking Mobius Emblem */}
      <div className="shrink-0 flex items-center justify-center">
        <AreteEmblem size={currentSize.mark} />
      </div>

      {/* Editorial Typography Lockup */}
      <div className="flex flex-col min-w-0 justify-center">
        <div className="flex items-center gap-2.5 leading-none">
          <span 
            className={`font-serif font-bold uppercase text-stone-900 dark:text-[#FAF8F5] ${currentSize.text} transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400 select-none`}
            style={{ fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif" }}
          >
            ARETE
          </span>
          {badge && (
            <span className={`font-mono font-bold uppercase rounded-md bg-amber-500/10 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 ${currentSize.badge}`}>
              {badge}
            </span>
          )}
        </div>

        {/* Tagline */}
        {showSubtitle && subtitle && (
          <span 
            className={`text-stone-600 dark:text-[#A89E92] font-semibold uppercase mt-1 truncate ${currentSize.sub}`}
            style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
