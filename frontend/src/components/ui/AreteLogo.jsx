import React from 'react';

/**
 * AreteEmblem — The Apex Keystone
 * Proprietary geometric emblem constructed with faceted keystone crown,
 * fluted converging vectors, and negative space apex.
 */
export function AreteEmblem({
  size = 32,
  className = '',
  variant = 'brand' // 'brand' | 'monochrome-dark' | 'monochrome-light'
}) {
  const isDarkMono = variant === 'monochrome-dark';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="arete-gold-grad" x1="20" y1="14" x2="60" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2C58A" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B38938" />
        </linearGradient>
        <linearGradient id="arete-apex-grad" x1="40" y1="36" x2="40" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EAD29B" />
          <stop offset="100%" stopColor="#C69B4C" />
        </linearGradient>
      </defs>

      {/* ── Top Keystone Headpiece (Faceted Architectural Crown) ── */}
      <polygon
        points="26,14 54,14 62,33 18,33"
        fill={isDarkMono ? '#FAF8F5' : 'url(#arete-gold-grad)'}
      />
      {/* Crown Left Bevel Highlight */}
      <polygon
        points="18,33 26,14 34,33"
        fill="#FFFFFF"
        fillOpacity={isDarkMono ? 0.3 : 0.4}
      />
      {/* Crown Right Bevel Shadow */}
      <polygon
        points="46,33 54,14 62,33"
        fill="#000000"
        fillOpacity={isDarkMono ? 0.25 : 0.28}
      />

      {/* ── Outer Architectural Struts / Wings ── */}
      <polygon
        points="12,39 21,36 29,67 20,69"
        fill={isDarkMono ? '#FAF8F5' : 'currentColor'}
      />
      <polygon
        points="68,39 59,36 51,67 60,69"
        fill={isDarkMono ? '#FAF8F5' : 'currentColor'}
      />

      {/* ── Converging Inner Evidence Vectors ── */}
      <polygon
        points="24,69 36,42 40,42 28,70"
        fill={isDarkMono ? '#FAF8F5' : 'currentColor'}
      />
      <polygon
        points="56,69 44,42 40,42 52,70"
        fill={isDarkMono ? '#FAF8F5' : 'currentColor'}
      />

      {/* ── Central Convergent Apex Spear ── */}
      <polygon
        points="40,36 34,68 37.5,68 40,54 42.5,68 46,68"
        fill={isDarkMono ? '#FAF8F5' : 'url(#arete-apex-grad)'}
      />
    </svg>
  );
}

/**
 * AreteLogo — Master Brand Component
 * Supports:
 * - variant: 'horizontal' (Emblem + Wordmark), 'mark' (Emblem only), 'icon' (Emblem inside dark tile)
 * - size: 'xs' (20px), 'sm' (28px), 'md' (36px), 'lg' (48px)
 */
export default function AreteLogo({
  variant = 'horizontal', // 'horizontal' | 'mark' | 'icon'
  size = 'md',
  subtitle,
  badge,
  className = '',
  onClick,
}) {
  const pixelSizes = {
    xs: { mark: 18, text: 'text-xs tracking-[0.14em]', gap: 'gap-2', badge: 'text-[9px] px-1 py-0.2' },
    sm: { mark: 24, text: 'text-sm tracking-[0.15em]', gap: 'gap-2.5', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { mark: 32, text: 'text-base sm:text-lg tracking-[0.16em]', gap: 'gap-3', badge: 'text-[10px] px-2 py-0.5' },
    lg: { mark: 42, text: 'text-xl sm:text-2xl tracking-[0.18em]', gap: 'gap-3.5', badge: 'text-[11px] px-2.5 py-0.5' },
  };

  const currentSize = pixelSizes[size] || pixelSizes.md;

  if (variant === 'icon') {
    const tileSizes = {
      xs: 'w-7 h-7 rounded-lg',
      sm: 'w-8 h-8 rounded-xl',
      md: 'w-10 h-10 rounded-xl',
      lg: 'w-12 h-12 rounded-2xl',
    };
    return (
      <div
        onClick={onClick}
        className={`${tileSizes[size] || tileSizes.md} bg-[#100F0D] border border-[#D6B477]/30 shadow-sm flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        title="ARETE"
      >
        <AreteEmblem size={currentSize.mark} />
      </div>
    );
  }

  if (variant === 'mark') {
    return (
      <div onClick={onClick} className={`inline-flex items-center shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
        <AreteEmblem size={currentSize.mark} />
      </div>
    );
  }

  // Primary Horizontal Lockup
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${currentSize.gap} select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <div className="shrink-0 flex items-center justify-center">
        <AreteEmblem size={currentSize.mark} />
      </div>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 leading-none">
          <span className={`font-bold uppercase tracking-[0.18em] text-stone-900 dark:text-stone-100 ${currentSize.text} transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400 select-none`}>
            ARETE
          </span>
          {badge && (
            <span className={`font-mono font-bold uppercase rounded-md bg-amber-500/10 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 ${currentSize.badge}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-normal mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
