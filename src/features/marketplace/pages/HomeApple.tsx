import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Apple.com-style reskin of the Orderlynk home page.
 *
 * Self-contained visual preview mounted at `/preview/apple` (outside the global
 * Layout). Mirrors Apple's system: #f5f5f7 canvas, #1d1d1f ink, the #06c link
 * blue, SF-style system type with huge bold headlines + light subheads,
 * "Learn more ›" chevron links, pill buttons, and full-bleed alternating
 * light/dark product tiles centred text-over-image — Orderlynk's real surfaces
 * (Marketplace, Services, Batch & Cargo, Tracking) presented as "products".
 */

// Apple's actual design tokens
const INK = '#1d1d1f'
const LINK = '#0066cc'
const SUBTLE = '#6e6e73'
// SF Pro is proprietary; this is the same fallback stack Apple ships.
const SF = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif'

// ── Apple's "Learn more ›" / "Buy ›" chevron link ───────────────────────────
function ChevronLink({
  to,
  children,
  light = false,
}: {
  to: string
  children: ReactNode
  light?: boolean
}) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center text-[17px] md:text-[19px] hover:underline"
      style={{ color: light ? '#2997ff' : LINK }}
    >
      {children}
      <span className="ml-0.5 transition-transform group-hover:translate-x-0.5">›</span>
    </Link>
  )
}

// ── Pill button (the blue "Buy" style) ──────────────────────────────────────
function Pill({
  to,
  children,
  variant = 'solid',
}: {
  to: string
  children: ReactNode
  variant?: 'solid' | 'outline'
}) {
  const base =
    'inline-flex items-center justify-center rounded-full px-[19px] py-[11px] text-[17px] font-normal transition-colors'
  if (variant === 'outline') {
    return (
      <Link
        to={to}
        className={base}
        style={{ border: `1px solid ${LINK}`, color: LINK }}
      >
        {children}
      </Link>
    )
  }
  return (
    <Link
      to={to}
      className={`${base} text-white`}
      style={{ background: '#0071e3' }}
    >
      {children}
    </Link>
  )
}

// ── A full-bleed "product" tile (light or dark) ─────────────────────────────
type Tile = {
  eyebrow?: string
  title: string
  subtitle: string
  links: { label: string; to: string }[]
  visual: ReactNode
  dark?: boolean
}

function ProductTile({ t }: { t: Tile }) {
  const fg = t.dark ? '#f5f5f7' : INK
  const sub = t.dark ? '#a1a1a6' : SUBTLE
  return (
    <section
      className="flex flex-col items-center overflow-hidden pt-12 text-center md:pt-14"
      style={{ background: t.dark ? '#000' : '#fafafa', color: fg }}
    >
      {t.eyebrow && (
        <p className="text-[15px] font-semibold" style={{ color: '#e9701b' }}>
          {t.eyebrow}
        </p>
      )}
      <h3
        className="mt-1.5 text-[32px] font-semibold tracking-tight md:text-[40px]"
        style={{ color: fg }}
      >
        {t.title}
      </h3>
      <p className="mt-1.5 max-w-md px-6 text-[19px] md:text-[21px]" style={{ color: sub }}>
        {t.subtitle}
      </p>
      <div className="mt-3.5 flex items-center gap-6">
        {t.links.map((l) => (
          <ChevronLink key={l.label} to={l.to} light={t.dark}>
            {l.label}
          </ChevronLink>
        ))}
      </div>
      <div className="mt-7 w-full flex-1">{t.visual}</div>
    </section>
  )
}

// ── Visuals for the tiles ───────────────────────────────────────────────────
function OrderTrackerVisual({ dark = false }: { dark?: boolean }) {
  const cardBg = dark ? '#1c1c1e' : '#ffffff'
  const line = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  const fg = dark ? '#f5f5f7' : INK
  const sub = dark ? '#a1a1a6' : SUBTLE
  return (
    <div className="mx-auto mb-12 w-full max-w-sm px-6">
      <div
        className="rounded-[22px] p-6 text-left shadow-[0_30px_60px_-25px_rgba(0,0,0,0.3)]"
        style={{ background: cardBg, border: `1px solid ${line}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider" style={{ color: sub }}>
              Order
            </p>
            <p className="font-mono text-[17px] font-semibold" style={{ color: fg }}>
              OB-260601-4821
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-white"
            style={{ background: '#34c759' }}
          >
            Paid
          </span>
        </div>
        <div className="mt-5 space-y-3.5">
          {[
            ['Order received', true],
            ['Payment confirmed', true],
            ['Vendor confirmed', true],
            ['Ready for pickup', false],
          ].map(([label, done], i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
                style={
                  done
                    ? { background: '#0071e3', color: 'white' }
                    : { border: `1px solid ${line}`, color: sub }
                }
              >
                {done ? '✓' : (i as number) + 1}
              </span>
              <span style={{ color: done ? fg : sub }} className="text-[15px]">
                {label as string}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ChipsVisual({ chips, dark = false }: { chips: string[]; dark?: boolean }) {
  return (
    <div className="mb-12 flex flex-wrap justify-center gap-2.5 px-8">
      {chips.map((c) => (
        <span
          key={c}
          className="rounded-full px-4 py-2 text-[15px]"
          style={{
            background: dark ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'}`,
            color: dark ? '#f5f5f7' : INK,
          }}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

const TILES: Tile[] = [
  {
    title: 'Marketplace',
    subtitle: 'Verified storefronts and product pages, built for discovery.',
    links: [
      { label: 'Learn more', to: '/' },
      { label: 'Shop now', to: '/' },
    ],
    dark: false,
    visual: <ChipsVisual chips={['Food', 'Fashion', 'Beauty', 'Home', 'Crafts', 'Groceries']} />,
  },
  {
    title: 'Services',
    subtitle: 'Book providers with deposits handled and confirmations automatic.',
    links: [
      { label: 'Learn more', to: '/services' },
      { label: 'Book a service', to: '/services' },
    ],
    dark: true,
    visual: <ChipsVisual chips={['Hair', 'Catering', 'Photography', 'Tailoring', 'Cleaning']} dark />,
  },
  {
    eyebrow: 'New',
    title: 'Batch & Cargo',
    subtitle: 'Pre-order imports together. One shipment, live status for everyone.',
    links: [
      { label: 'Learn more', to: '/batches' },
      { label: 'Join a batch', to: '/batches' },
    ],
    dark: true,
    visual: <OrderTrackerVisual dark />,
  },
  {
    title: 'Order Tracking',
    subtitle: 'Every order gets an ID, a status and a pickup code. No more DMs.',
    links: [
      { label: 'Learn more', to: '/track' },
      { label: 'Track an order', to: '/track' },
    ],
    dark: false,
    visual: <OrderTrackerVisual />,
  },
]

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const items = ['Marketplace', 'Services', 'Batch & Cargo', 'Track', 'Sell', 'Support']
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ background: 'rgba(245,245,247,0.8)', borderColor: 'rgba(0,0,0,0.08)' }}
    >
      <div className="mx-auto flex h-11 max-w-5xl items-center justify-between px-5">
        <Link to="/" className="text-[19px] font-semibold tracking-tight" style={{ color: INK }}>
          Orderlynk
        </Link>
        <nav className="hidden items-center gap-9 md:flex">
          {items.map((i) => (
            <a
              key={i}
              href="#"
              className="text-[12px] opacity-80 transition-opacity hover:opacity-100"
              style={{ color: INK }}
            >
              {i}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-5 text-[12px]" style={{ color: INK }}>
          <a href="#" className="opacity-80 hover:opacity-100">Search</a>
          <Link to="/cart" className="opacity-80 hover:opacity-100">Bag</Link>
        </div>
      </div>
    </header>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function HomeApple() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7', color: INK, fontFamily: SF }}>
      <Nav />

      {/* Promo strip (Apple's thin banner above the hero) */}
      <div className="px-5 py-3 text-center" style={{ background: '#fbfbfd' }}>
        <p className="text-[14px]" style={{ color: SUBTLE }}>
          Set up your storefront in minutes.{' '}
          <Link to="/sell" style={{ color: LINK }} className="hover:underline">
            Start selling free ›
          </Link>
        </p>
      </div>

      {/* Hero — light, centered headline-over-product */}
      <section className="flex flex-col items-center pt-14 text-center md:pt-16" style={{ background: '#fafafa' }}>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[48px] font-semibold leading-[1.05] tracking-tight md:text-[64px]"
        >
          Orderlynk
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06 }}
          className="mt-2 max-w-xl px-6 text-[24px] font-normal md:text-[28px]"
          style={{ color: INK }}
        >
          Commerce, beautifully organised.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-3 max-w-md px-6 text-[19px]"
          style={{ color: SUBTLE }}
        >
          Turn social demand into structured orders, secure payments and reliable fulfillment.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-6"
        >
          <ChevronLink to="/sell">Start selling</ChevronLink>
          <ChevronLink to="/">Browse the marketplace</ChevronLink>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24 }}
          className="mt-6 w-full"
        >
          <OrderTrackerVisual />
        </motion.div>
      </section>

      {/* Second hero — dark feature */}
      <section className="flex flex-col items-center pt-14 text-center md:pt-16" style={{ background: '#000', color: '#f5f5f7' }}>
        <p className="text-[15px] font-semibold" style={{ color: '#e9701b' }}>
          For vendors
        </p>
        <h2 className="mt-1.5 text-[40px] font-semibold tracking-tight md:text-[56px]">
          One dashboard. Every channel.
        </h2>
        <p className="mt-2 max-w-xl px-6 text-[21px] md:text-[24px]" style={{ color: '#a1a1a6' }}>
          WhatsApp, Instagram, in-person — all of it, finally in one place.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
          <Pill to="/sell">Apply to sell</Pill>
          <ChevronLink to="/login" light>
            Vendor sign in
          </ChevronLink>
        </div>
        <div className="mt-8 w-full max-w-3xl px-6 pb-14">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['12,400+', 'Orders'],
              ['450+', 'Vendors'],
              ['38', 'Cities'],
              ['99.2%', 'On-time'],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-2xl px-4 py-6"
                style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-[28px] font-semibold tracking-tight">{v}</p>
                <p className="mt-0.5 text-[13px]" style={{ color: '#a1a1a6' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product tile grid — 2-up, alternating light/dark */}
      <div className="grid gap-3 p-3 md:grid-cols-2">
        {TILES.map((t) => (
          <div key={t.title} className="overflow-hidden rounded-[22px]">
            <ProductTile t={t} />
          </div>
        ))}
      </div>

      {/* Footer — Apple's fine-print multi-column style */}
      <footer style={{ background: '#f5f5f7' }}>
        <div className="mx-auto max-w-5xl px-5 py-8" style={{ color: SUBTLE }}>
          <p className="border-b pb-4 text-[12px] leading-relaxed" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            Set up takes minutes. No platform fees until your first sale. Orderlynk handles payments,
            tracking and fulfillment so you can focus on what you make.
          </p>
          <div className="grid gap-8 py-7 sm:grid-cols-3 md:grid-cols-4">
            {[
              ['Shop', ['Marketplace', 'Services', 'Batch & Cargo', 'Track an order']],
              ['Vendors', ['Sell on Orderlynk', 'Vendor sign in', 'Pricing', 'Support']],
              ['Company', ['About', 'Careers', 'Contact', 'Press']],
              ['Legal', ['Privacy', 'Terms', 'Cookies', 'Compliance']],
            ].map(([head, links]) => (
              <div key={head as string}>
                <p className="mb-2.5 text-[12px] font-semibold" style={{ color: INK }}>
                  {head as string}
                </p>
                <ul className="space-y-2.5">
                  {(links as string[]).map((l) => (
                    <li key={l}>
                      <a href="#" className="text-[12px] hover:underline">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="border-t pt-5 text-[12px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            Copyright © {new Date().getFullYear()} Orderlynk. Built for African &amp; diaspora commerce.
          </p>
        </div>
      </footer>
    </div>
  )
}