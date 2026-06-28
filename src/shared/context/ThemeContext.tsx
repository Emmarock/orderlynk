import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeState | undefined>(undefined)
const KEY = 'orderlynk.theme'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** First load follows the OS preference; an explicit saved choice always wins. */
function initialTheme(): Theme {
  const saved = localStorage.getItem(KEY)
  return saved === 'light' || saved === 'dark' ? saved : systemTheme()
}

/**
 * Drives the light/dark theme via the `data-theme` attribute on <html> (the warm
 * light palette is the `:root` baseline; `[data-theme="dark"]` overrides it — see
 * index.css). The pre-paint script in index.html sets the same attribute before
 * first paint to avoid a flash of the wrong theme. We persist only an explicit
 * choice, so users who never toggle keep following their OS preference.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme)
  const [explicit, setExplicit] = useState<boolean>(() => {
    const saved = localStorage.getItem(KEY)
    return saved === 'light' || saved === 'dark'
  })

  // Reflect the active theme onto <html> for CSS to pick up.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // While the user hasn't made a manual choice, track live OS preference changes.
  useEffect(() => {
    if (explicit) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setThemeState(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [explicit])

  const persist = (t: Theme) => {
    setExplicit(true)
    localStorage.setItem(KEY, t)
    setThemeState(t)
  }
  const setTheme = (t: Theme) => persist(t)
  const toggle = () => persist(theme === 'dark' ? 'light' : 'dark')

  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
