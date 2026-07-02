// Maps a free-text colour label to a CSS colour for a swatch preview. Vendors type colour
// names freely (e.g. "Navy", "Off White"), so we resolve common names and otherwise fall back
// to the label itself — the browser understands CSS named colours ("red", "teal", …) — and to a
// neutral grey when it's an unrecognisable name. Purely cosmetic; the stored value is the label.
const NAMED: Record<string, string> = {
  black: '#111111',
  white: '#ffffff',
  'off white': '#faf7f0',
  cream: '#fdf6e3',
  ivory: '#fffff0',
  grey: '#9ca3af',
  gray: '#9ca3af',
  charcoal: '#36454f',
  silver: '#c0c0c0',
  red: '#dc2626',
  maroon: '#7f1d1d',
  burgundy: '#800020',
  wine: '#722f37',
  pink: '#ec4899',
  rose: '#e11d48',
  orange: '#f97316',
  peach: '#ffdab9',
  coral: '#ff7f50',
  yellow: '#facc15',
  gold: '#d4af37',
  mustard: '#e1ad01',
  green: '#16a34a',
  olive: '#808000',
  lime: '#84cc16',
  teal: '#14b8a6',
  mint: '#98ff98',
  blue: '#2563eb',
  navy: '#1e3a5f',
  'navy blue': '#1e3a5f',
  royal: '#4169e1',
  sky: '#38bdf8',
  purple: '#9333ea',
  violet: '#7c3aed',
  lavender: '#b57edc',
  brown: '#92400e',
  tan: '#d2b48c',
  beige: '#f5f5dc',
  khaki: '#c3b091',
  camel: '#c19a6b',
}

export function swatch(label: string): string {
  const key = label.trim().toLowerCase()
  return NAMED[key] ?? (key.startsWith('#') ? key : (CSS.supports?.('color', key) ? key : '#d1c7b8'))
}
