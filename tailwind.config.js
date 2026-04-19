/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        /** Full desktop shell (top bar + 240px sidebar) — do not use for general responsive tweaks */
        desktop: '1025px',
      },
      colors: {
        primary: {
          DEFAULT: '#D97706',   // amber-600 — vanilla gold
          hover:   '#B45309',   // amber-700 — deep gold
          light:   '#FFFBEB',   // amber-50  — cream vanilla
        },
        dark: {
          DEFAULT: '#1C1200',   // warm near-black
          mid:     '#2D1C08',   // mid dark warm
          light:   '#3D2A10',   // lighter dark warm
        },
        /** Logged-in app shell — aligned with landing `.landing-page-root` (#120c08) */
        app: {
          canvas:    '#120c08',
          surface:   '#1a1512',
          muted:     '#14110e',
          raised:    '#1f1a16',
          border:    'rgba(168, 162, 158, 0.35)',
        },
        sidebar: {
          DEFAULT: '#14110e',
          hover:   'rgba(251, 191, 36, 0.08)',
          active:  'rgba(251, 191, 36, 0.14)',
          border:  'rgba(168, 162, 158, 0.22)',
          muted:   '#a8a29e',
          text:    '#e7e5e4',
        },
      },
      fontFamily: {
        sans:  ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        'chat': '0 2px 16px rgba(0,0,0,0.08)',
        'card': '0 4px 24px rgba(0,0,0,0.06)',
        /** Landing dark panels: one inset highlight + soft elevation (avoid stacked arbitrary shadows) */
        'landing': 'inset 0 1px 0 0 rgb(255 251 235 / 6%), 0 12px 36px -8px rgb(0 0 0 / 45%)',
        'landing-md': 'inset 0 1px 0 0 rgb(255 251 235 / 6.5%), 0 16px 44px -10px rgb(0 0 0 / 50%)',
        'landing-lg': 'inset 0 1px 0 0 rgb(255 251 235 / 7%), 0 22px 50px -12px rgb(0 0 0 / 52%)',
        'landing-promo':
          'inset 0 1px 0 0 rgb(255 251 235 / 7%), 0 22px 50px -12px rgb(0 0 0 / 55%), 0 0 36px -8px rgb(245 158 11 / 16%)',
      },
      animation: {
        'fade-in':   'fadeIn 0.18s ease',
        'slide-up':  'slideUp 0.18s ease',
        'slide-in':  'slideIn 0.25s ease',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        bounceDot: { '0%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
}

