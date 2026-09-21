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
          DEFAULT: '#d97757',
          hover:   '#b45539',
          light:   '#faf7f0',
        },
        dark: {
          DEFAULT: '#1a1613',
          mid:     '#232019',
          light:   '#3a332d',
        },
        app: {
          canvas:    '#1a1613',
          surface:   '#232019',
          muted:     '#1a1613',
          raised:    '#2a2420',
          border:    '#3a332d',
          parchment:     '#faf7f0',
          parchmentDeep: '#f5f1eb',
        },
        sidebar: {
          DEFAULT: '#1a1613',
          hover:   'rgba(217, 119, 87, 0.10)',
          active:  'rgba(217, 119, 87, 0.16)',
          border:  '#3a332d',
          muted:   '#a89e91',
          text:    '#f0ebe0',
        },
      },
      fontFamily: {
        sans:  ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        landing: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'chat': '0 2px 16px rgba(0,0,0,0.08)',
        'card': '0 4px 24px rgba(0,0,0,0.06)',
        /** Landing dark panels: one inset highlight + soft elevation (avoid stacked arbitrary shadows) */
        'landing': 'inset 0 1px 0 0 rgb(255 251 235 / 6%), 0 12px 36px -8px rgb(0 0 0 / 45%)',
        'landing-md': 'inset 0 1px 0 0 rgb(255 251 235 / 6.5%), 0 16px 44px -10px rgb(0 0 0 / 50%)',
        'landing-lg': 'inset 0 1px 0 0 rgb(255 251 235 / 7%), 0 22px 50px -12px rgb(0 0 0 / 52%)',
        'landing-promo':
          'inset 0 1px 0 0 rgb(255 251 235 / 7%), 0 22px 50px -12px rgb(0 0 0 / 55%), 0 0 36px -8px rgb(217 119 87 / 16%)',
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

