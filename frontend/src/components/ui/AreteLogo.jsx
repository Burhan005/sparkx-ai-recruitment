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
  const crownFill = variant === 'monochrome-dark' ? '#FAF8F5' : '#D6B477';
  const crownLeftOpacity = variant === 'monochrome-dark' ? 0.35 : 0.45;
  const crownRightOpacity = variant === 'monochrome-dark' ? 0.75 : 0.85;
  const fluteFill = variant === 'monochrome-dark' ? '#FAF8F5' : 'currentColor';
  const apexFill = variant === 'monochrome-dark' ? '#FAF8F5' : '#D6B477';

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
      {/* Keystone Crown */}
      <polygon points="27,14 53,14 60,34 20,34" fill={crownFill} />
      <polygon points="20,34 27,14 34,34" fill="#FFFFFF" fillOpacity={crownLeftOpacity} />
      <polygon points="46,34 53,14 60,34" fill="#100F0D" fillOpacity={crownRightOpacity} />

      {/* Outer Wing Flutes */}
      <polygon points="12,41 20,37 27,67 18,69" fill={fluteFill} />
      <polygon points="68,41 60,37 53,67 62,69" fill={fluteFill} />

      {/* Converging Evidence Vectors */}
      <polygon points="22,69 36,44 40,44 27,70" fill={fluteFill} />
      <polygon points="58,69 44,44 40,44 53,70" fill={fluteFill} />

      {/* Center Apex Portal */}
      <polygon points="40,36 32,71 36,71 40,55 44,71 48,71" fill={apexFill} />
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
    xs: { mark: 18, text: 'text-xs tracking-[0.22em]', gap: 'gap-2', badge: 'text-[9px] px-1 py-0.2' },
    sm: { mark: 24, text: 'text-sm tracking-[0.24em]', gap: 'gap-2.5', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { mark: 32, text: 'text-base sm:text-lg tracking-[0.26em]', gap: 'gap-3', badge: 'text-[10px] px-2 py-0.5' },
    lg: { mark: 42, text: 'text-xl sm:text-2xl tracking-[0.28em]', gap: 'gap-3.5', badge: 'text-[11px] px-2.5 py-0.5' },
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
          <span className={`font-black uppercase font-display text-stone-900 dark:text-stone-100 ${currentSize.text} transition-colors group-hover:text-brand-600 dark:group-hover:text-amber-400`}>
            ARETE
          </span>
          {badge && (
            <span className={`font-mono font-bold uppercase rounded-md bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/25 ${currentSize.badge}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium tracking-tight mt-1 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
