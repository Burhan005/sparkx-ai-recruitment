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
        display: ["'Inter'", "'Plus Jakarta Sans'", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", "Consolas", "monospace"],
      },
      fontSize: {
        '3xs': ['9px', { lineHeight: '12px' }],
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs-plus': ['11px', { lineHeight: '15px' }],
      },
      colors: {
        ide: {
          bg: '#0D0F17',
          surface: '#121622',
          sidebar: '#0E111B',
          border: '#1E2538',
          header: '#0A0C13',
          active: '#1A2238'
        },
        surface: {
          light: '#FFFFFF',
          'card-light': '#FFFFFF',
          'page-light': '#F8FAFC',
          'subtle-light': '#F1F5F9',
          'border-light': '#E2E8F0',
          'elevated-light': '#FFFFFF',
          dark: '#0B0F19',
          'card-dark': '#111827',
          'sidebar-dark': '#0D131F',
          'border-dark': '#1E293B',
          'elevated-dark': '#1F2937'
        },
        brand: {
          50:  '#F0F4FF',
          100: '#E0EAFF',
          200: '#C7D7FE',
          300: '#A4BCFD',
          400: '#7E98F9',
          500: '#4F6BFF',
          600: '#3851E0',
          700: '#2A3DC7',
          800: '#21309E',
          900: '#1B277A',
          950: '#0E1542',
        },
        intel: {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
        }
      },
      borderRadius: {
        'control': '8px',
        'card': '14px',
        'panel': '16px',
        'modal': '18px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'float': '0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'popover': '0 16px 36px -6px rgba(0, 0, 0, 0.22)',
        'depth-1': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'depth-2': '0 4px 12px -2px rgba(0, 0, 0, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.06)',
        'depth-3': '0 12px 28px -4px rgba(0, 0, 0, 0.2), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
        'depth-elevated': '0 20px 40px -8px rgba(0, 0, 0, 0.32)',
        'glow-cobalt': '0 0 24px -4px rgba(79, 107, 255, 0.22)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'standard': '250ms',
        'emphasis': '400ms',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-subtle': 'pulse-subtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up':   'fade-in-up 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in':     'slide-in-right 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':      'shimmer 1.8s linear infinite',
        'slide-up':     'slide-up-stagger 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'radar-draw':   'radar-draw-in 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'count-pop':    'count-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'breathe':      'breathe 2.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.45 },
        },
        'fade-in-up': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(-12px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.98)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-subtle': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }
    },
  },
  plugins: [],
}
