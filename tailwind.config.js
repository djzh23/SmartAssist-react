/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
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
        sidebar: {
          DEFAULT: '#1e293b',
          hover:   'rgba(255,255,255,0.06)',
          active:  'rgba(255,255,255,0.10)',
          border:  'rgba(255,255,255,0.07)',
          muted:   '#94a3b8',
          text:    '#cbd5e1',
        },
      },
      fontFamily: {
        sans:  ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        'chat': '0 2px 16px rgba(0,0,0,0.08)',
        'card': '0 4px 24px rgba(0,0,0,0.06)',
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

