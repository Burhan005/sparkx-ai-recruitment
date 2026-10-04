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
        // ── Accent: Muted Teal (replaces indigo/cobalt) ──────────────────────
        brand: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',   // PRIMARY ACCENT
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
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
          // Light surfaces — warm stone/coffee
          'page':            '#F2EFEB',
          'card':            '#FDFCFA',
          'raised':          '#FFFFFF',
          'border':          '#E5E0DA',
          'border-subtle':   '#EEEAE5',
          // Dark surfaces — warm espresso/graphite
          'page-dk':         '#110F0D',
          'card-dk':         '#1A1714',
          'raised-dk':       '#221E1A',
          'border-dk':       '#2A2520',
          'border-subtle-dk':'#231F1B',
          // Legacy compat tokens (used across components)
          light:             '#FDFCFA',
          'card-light':      '#FDFCFA',
          'page-light':      '#F2EFEB',
          'subtle-light':    '#EEEAE5',
          'border-light':    '#E5E0DA',
          'elevated-light':  '#FFFFFF',
          dark:              '#110F0D',
          'card-dark':       '#1A1714',
          'sidebar-dark':    '#0E0C0A',
          'border-dark':     '#2A2520',
          'elevated-dark':   '#221E1A',
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
        'glow-teal':     '0 0 20px -4px rgba(13, 148, 136, 0.18)',
        // Legacy compat name
        'glow-cobalt':   '0 0 20px -4px rgba(13, 148, 136, 0.18)',
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
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'page-enter': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'modal-enter': {
          from: { opacity: 0, transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'drawer-enter': {
          from: { opacity: 0, transform: 'translateX(24px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
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
          '0%, 100%': { boxShadow: '0 0 15px -3px rgba(13, 148, 136, 0.2)' },
          '50%':      { boxShadow: '0 0 25px 0px rgba(13, 148, 136, 0.4)' },
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
