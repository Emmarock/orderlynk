/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens resolve to CSS variables (space-separated RGB channels) so the whole app
        // can swap between the default KojoForex dark theme and a warm light theme at runtime
        // — the values live in index.css under `:root` (dark) and `.light`. Token *roles* are
        // unchanged: `sand` = page canvas, `cream` = raised surface/cards, `ink` = primary text,
        // `clay` = primary accent, `forest` = semantic success green.
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        clay: {
          DEFAULT: 'rgb(var(--c-clay) / <alpha-value>)',
          dark: 'rgb(var(--c-clay-dark) / <alpha-value>)',
          soft: 'rgb(var(--c-clay-soft) / <alpha-value>)',
        },
        forest: {
          DEFAULT: 'rgb(var(--c-forest) / <alpha-value>)',
          dark: 'rgb(var(--c-forest-dark) / <alpha-value>)',
        },
        gold: 'rgb(var(--c-gold) / <alpha-value>)',
        plum: 'rgb(var(--c-plum) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -16px rgba(0,0,0,0.7)',
        lift: '0 18px 50px -20px rgba(0,0,0,0.85)',
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
