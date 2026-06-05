/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#F4EEE1',
        cream: '#FFFDF7',
        ink: '#1B1915',
        muted: '#6E665A',
        clay: {
          DEFAULT: '#C0522F',
          dark: '#9E3F22',
          soft: '#E7A582',
        },
        forest: {
          DEFAULT: '#1E4A38',
          dark: '#143228',
        },
        gold: '#D99A2B',
        plum: '#79324F',
        line: '#E2D9C6',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,25,21,0.04), 0 12px 32px -16px rgba(27,25,21,0.18)',
        lift: '0 18px 50px -20px rgba(27,25,21,0.35)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.4rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
