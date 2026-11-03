const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        'surface-muted': token('surface-muted'),
        ink: token('ink'),
        'ink-muted': token('ink-muted'),
        line: token('line'),
        royal: token('royal'),
        'royal-fg': token('royal-fg'),
        action: token('action'),
        'action-fg': token('action-fg'),
        active: token('active'),
        accent: token('accent'),
        mint: token('mint'),
        'mint-fg': token('mint-fg'),
        gold: token('gold'),
        'gold-fg': token('gold-fg'),
        red: token('red'),
        'red-fg': token('red-fg'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.45' }],
        sm: ['0.9375rem', { lineHeight: '1.55' }],
        base: ['1.0625rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.5' }],
        xl: ['1.3125rem', { lineHeight: '1.3' }],
        '2xl': ['1.875rem', { lineHeight: '1.2' }],
        '3xl': ['2.125rem', { lineHeight: '1.15' }],
      },
      boxShadow: {
        card: '0 1px 2px rgb(16 42 86 / 0.04), 0 4px 16px rgb(16 42 86 / 0.05)',
        pop: '0 12px 40px rgb(16 42 86 / 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(36 104 216 / 0.35)' },
          '100%': { boxShadow: '0 0 0 12px rgb(36 104 216 / 0)' },
        },
        'bar-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 380ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'fade-in': 'fade-in 240ms ease-out both',
        'scale-in': 'scale-in 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        'pulse-ring': 'pulse-ring 1.6s ease-out infinite',
        'bar-sweep': 'bar-sweep 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
