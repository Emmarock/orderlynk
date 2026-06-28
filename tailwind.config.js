/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tokens resolve to CSS variables (space-separated RGB channels) so the whole app
        // swaps between the warm cream LIGHT baseline (`:root`) and the tuned dark theme
        // (`[data-theme="dark"]`) at runtime — values live in index.css. Tailwind name → brief
        // semantic token: sand=--surface-0, cream=--surface-1, raised=--surface-2,
        // ink=--text-primary, muted=--text-secondary, faint=--text-muted, clay=--accent
        // (ONE terracotta, both themes), forest=--green, gold=secondary highlight,
        // success=Paid/done, line=--border, border-strong=--border-strong.
        sand: 'rgb(var(--c-sand) / <alpha-value>)',
        cream: 'rgb(var(--c-cream) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
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
        success: 'rgb(var(--c-success) / <alpha-value>)',
        plum: 'rgb(var(--c-plum) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'border-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        // Theme-aware: defined per theme in index.css so light leans on the hairline
        // border (whisper shadow) and dark conveys depth via the surface ladder.
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
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
