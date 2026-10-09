/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Inter'", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", "Consolas", "monospace"],
      },
      fontSize: {
        '3xs':    ['11px', { lineHeight: '15px' }],
        '2xs':    ['12px', { lineHeight: '16px' }],
        'xs-plus':['13px', { lineHeight: '18px' }],
      },
      colors: {
        // ── Accent: Roasted Amber / Warm Caramel (Espresso Option A) ─────────
        brand: {
          50:  '#FFFBEB',   // warm honey-50
          100: '#FEF3C7',   // warm cream-100
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F59E0B',   // vibrant warm amber
          500: '#D97706',   // rich caramel
          600: '#C27803',   // PRIMARY ACCENT: ROASTED AMBER
          700: '#B45309',   // deep bronze
          800: '#92400E',   // dark roasted caramel
          900: '#78350F',   // roasted coffee bean
          950: '#451A03',   // dark mocha
        },
        // ── Espresso: Pure Deep Coffee & Cream tones ───────────────────────
        espresso: {
          50:  '#FAF8F5',   // light parchment
          100: '#F4EFEB',   // warm latte wash
          200: '#E8DFD8',   // subtle warm border
          300: '#D5C7BC',
          400: '#B09A88',
          500: '#8C715D',
          600: '#694F3E',
          700: '#4E382A',
          800: '#38261B',
          900: '#2A1B14',   // PRIMARY DEEP ESPRESSO
          950: '#1C130E',   // DARK ESPRESSO ROAST TEXT
        },
        // ── Stone: Warm neutrals (replaces cold slate) ─────────────────────
        stone: {
          50:  '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        // ── Semantic status colors ─────────────────────────────────────────
        intel: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        // ── Surface tokens for warmth ──────────────────────────────────────
        surface: {
          // Light surfaces — soft cream / latte & warm borders
          'page':            '#F7F4EF',
          'card':            '#FDFBF7',
          'raised':          '#FFFFFF',
          'border':          '#E8DFD8',
          'border-subtle':   '#F0EAE3',
          // Dark surfaces — True Warm Luxury Espresso (visibly rich roasted coffee bean, never pitch-black)
          'page-dk':         '#0F0E0D',
          'card-dk':         '#2B201A',
          'raised-dk':       '#352720',
          'border-dk':       '#423229',
          'border-subtle-dk':'#362820',
          // Legacy compat tokens (used across components)
          light:             '#FDFBF7',
          'card-light':      '#FDFBF7',
          'page-light':      '#F7F4EF',
          'subtle-light':    '#F0EAE3',
          'border-light':    '#E8DFD8',
          'elevated-light':  '#FFFFFF',
          dark:              '#0F0E0D',
          'card-dark':       '#2B201A',
          'sidebar-dark':    '#1B1310',
          'border-dark':     '#423229',
          'elevated-dark':   '#352720',
        },
        // ── IDE surface tokens ─────────────────────────────────────────────
        ide: {
          bg:           '#0C0A09',      // deep espresso
          surface:      '#161311',      // elevated espresso
          lightBg:      '#FAF8F4',      // warm parchment
          lightSurface: '#FFFFFF',
          sidebar:      '#0A0907',      // near-black espresso
          border:       '#2A2520',      // warm charcoal border
          header:       '#080706',
          active:       '#1F1B18',
        },
      },
      borderRadius: {
        'control': '7px',
        'card':    '12px',
        'panel':   '14px',
        'modal':   '16px',
      },
      boxShadow: {
        'subtle':        '0 1px 2px 0 rgba(28, 20, 10, 0.04)',
        'card':          '0 1px 3px 0 rgba(28, 20, 10, 0.05), 0 1px 4px -1px rgba(28, 20, 10, 0.03)',
        'float':         '0 8px 24px -4px rgba(28, 20, 10, 0.12), 0 2px 6px -1px rgba(28, 20, 10, 0.04)',
        'popover':       '0 16px 36px -6px rgba(15, 10, 5, 0.22)',
        'depth-1':       '0 1px 3px 0 rgba(28, 20, 10, 0.07), 0 1px 2px -1px rgba(28, 20, 10, 0.04)',
        'depth-2':       '0 4px 12px -2px rgba(28, 20, 10, 0.10), 0 2px 6px -1px rgba(28, 20, 10, 0.05)',
        'depth-3':       '0 12px 28px -4px rgba(15, 10, 5, 0.18), 0 4px 10px -2px rgba(15, 10, 5, 0.08)',
        'depth-elevated':'0 20px 40px -8px rgba(15, 10, 5, 0.28)',
        'glow-teal':     '0 0 20px -4px rgba(194, 120, 3, 0.22)',
        'glow-amber':    '0 0 20px -4px rgba(194, 120, 3, 0.25)',
        // Legacy compat name
        'glow-cobalt':   '0 0 20px -4px rgba(194, 120, 3, 0.22)',
      },
      transitionDuration: {
        'instant':  '80ms',
        'fast':     '140ms',
        'standard': '220ms',
        'emphasis': '360ms',
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle':  'pulse-subtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up':    'fade-in-up 0.22s cubic-bezier(0.16,1,0.3,1) both',
        'page-enter':    'page-enter 0.26s cubic-bezier(0.16,1,0.3,1) both',
        'modal-enter':   'modal-enter 0.24s cubic-bezier(0.16,1,0.3,1) both',
        'drawer-enter':  'drawer-enter 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in':      'slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':      'scale-in 0.18s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':       'shimmer 1.8s linear infinite',
        'slide-up':      'slide-up-stagger 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'radar-draw':    'radar-draw-in 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'count-pop':     'count-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        'breathe':       'breathe 2.5s ease-in-out infinite',
        'pulse-soft':    'pulse-soft 2.4s ease-in-out infinite',
        'glow-pulse':    'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        'fade-in-up': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'none' },
        },
        'page-enter': {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        'modal-enter': {
          from: { opacity: 0, transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: 1, transform: 'none' },
        },
        'drawer-enter': {
          from: { opacity: 0, transform: 'translateX(24px)' },
          to:   { opacity: 1, transform: 'none' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(-12px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.97)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        'slide-up-stagger': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'radar-draw-in': {
          '0%':   { opacity: 0, transform: 'scale(0.3)', transformOrigin: 'center' },
          '60%':  { opacity: 0.8, transform: 'scale(1.04)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'count-pop': {
          '0%':   { transform: 'scale(0.95)', opacity: 0.5 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        breathe: {
          '0%, 100%': { boxShadow: '0 0 0 0 currentColor' },
          '50%':      { boxShadow: '0 0 6px 2px currentColor' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%':      { opacity: 0.85, transform: 'scale(1.04)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px -3px rgba(194, 120, 3, 0.2)' },
          '50%':      { boxShadow: '0 0 25px 0px rgba(194, 120, 3, 0.4)' },
        },
      },
      transitionTimingFunction: {
        'spring':        'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-subtle': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
