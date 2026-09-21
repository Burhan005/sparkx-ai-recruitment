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
        mono: ["'JetBrains Mono'", "'Fira Code'", "'Cascadia Code'", "Consolas", "monospace"],
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"]
      },
      colors: {
        ide: {
          bg: '#0B0F19',
          surface: '#111827',
          sidebar: '#0D111D',
          border: '#1E293B',
          header: '#070A12',
          active: '#1E2235'
        },
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up':   'fade-in-up 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in':     'slide-in-right 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':     'scale-in 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':      'shimmer 1.6s linear infinite',
        'float':        'float 4s ease-in-out infinite',
        'laser':        'laser-scan 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'fade-in-up': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: 0, transform: 'translateX(-28px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.93)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-7px)' },
        },
        'laser-scan': {
          '0%':   { top: '0%',   opacity: 0.8 },
          '50%':  {               opacity: 1   },
          '100%': { top: '100%', opacity: 0.8 },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
