import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Linear.app-style reskin of the Orderlynk home page.
 *
 * Self-contained preview at `/preview/linear`. Captures Linear's aesthetic:
 * near-black #08090a canvas, indigo #5e6ad2 accent, a soft top gradient glow,
 * gradient headline text, hairline borders, glassy cards and tight refined
 * type — Orderlynk's commerce rails as a sleek "product OS".
 */

const INDIGO = '#5e6ad2'
const BG = '#08090a'
const INK = '#f7f8f8'
const MUTED = '#8a8f98'
const SANS =
  '"Inter", system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif'

function GhostBtn({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-[14px] font-medium transition-colors"
      style={{ borderColor: 'rgba(255,255,255,0.12)', color: INK, background: 'rgba(255,255,255,0.03)' }}
    >
      {children}
    </Link>
  )
}

function PrimaryBtn({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-[14px] font-semibold text-white transition-transform hover:-translate-y-0.5"
      style={{ background: INDIGO }}
    >
      {children}
    </Link>
  )
}

const FEATURES = [
  {
    title: 'Built for speed',
    body: 'Structured carts and order IDs replace the screenshot chaos of WhatsApp and Instagram DMs.',
  },
  {
    title: 'Payments, settled',
    body: 'Secure collection, automatic platform fees and a clean ledger behind every single order.',
  },
  {
    title: 'Fulfillment, visible',
    body: 'Pickup codes, delivery routing and import batches — live status from cart to doorstep.',
  },
  {
    title: 'One workspace',
    body: 'Every channel you sell on, unified into a single dashboard your whole team can run.',
  },
]

function Nav() {
  const items = ['Marketplace', 'Services', 'Batch & Cargo', 'Pricing']
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto mt-4 flex h-12 max-w-5xl items-center justify-between rounded-2xl border px-4 backdrop-blur-xl"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
        <Link to="/" className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-md" style={{ background: `linear-gradient(135deg, ${INDIGO}, #b794f6)` }} />
          <span className="text-[15px] font-semibold" style={{ color: INK }}>Orderlynk</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {items.map((i) => (
            <a key={i} href="#" className="text-[13.5px] transition-colors hover:text-white" style={{ color: MUTED }}>
              {i}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[13.5px]" style={{ color: MUTED }}>Sign in</Link>
          <Link to="/sell" className="rounded-lg px-3 py-1.5 text-[13.5px] font-semibold text-white" style={{ background: INDIGO }}>
            Start selling
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function HomeLinear() {
  return (
    <div className="min-h-screen px-4" style={{ background: BG, color: INK, fontFamily: SANS }}>
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Top gradient glow + grid */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[-30%] h-[700px] w-[1100px] -translate-x-1/2 opacity-50"
            style={{
              background: `radial-gradient(ellipse at center, ${INDIGO}55, transparent 60%)`,
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 75%)',
            }}
          />
        </div>

        <div className="mx-auto max-w-4xl px-2 pb-24 pt-24 text-center md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px]"
            style={{ borderColor: 'rgba(255,255,255,0.12)', color: MUTED }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: INDIGO }} />
            Now with import batch &amp; cargo
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-6 max-w-3xl text-[44px] font-semibold leading-[1.05] tracking-tight md:text-[68px]"
            style={{
              backgroundImage: 'linear-gradient(180deg, #ffffff, #b6b9c4)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            The commerce OS for
            <br />
            community vendors
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-xl text-[18px] leading-relaxed"
            style={{ color: MUTED }}
          >
            Orderlynk is the system that turns social demand into structured orders, secure payments
            and reliable fulfillment — purpose-built for African &amp; diaspora commerce.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <PrimaryBtn to="/sell">Start selling</PrimaryBtn>
            <GhostBtn to="/">Browse the marketplace</GhostBtn>
          </motion.div>

          {/* Product window mock */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border text-left"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              boxShadow: '0 40px 120px -40px rgba(94,106,210,0.5)',
            }}
          >
            <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="h-3 w-3 rounded-full" style={{ background: '#ff5f57' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: '#febc2e' }} />
              <span className="h-3 w-3 rounded-full" style={{ background: '#28c840' }} />
            </div>
            <div className="grid gap-px sm:grid-cols-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {[
                ['Inbox', 'OB-260601-4821', 'Paid', '#34c759'],
                ['In progress', 'OB-260531-4760', 'Packing', INDIGO],
                ['Ready', 'OB-260530-4655', 'Pickup', '#febc2e'],
              ].map(([col, id, status, color]) => (
                <div key={col} className="p-4" style={{ background: BG }}>
                  <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: MUTED }}>{col}</p>
                  <div className="mt-3 rounded-lg border p-3" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                    <p className="font-mono text-[12px]" style={{ color: INK }}>{id}</p>
                    <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ background: color as string }}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto max-w-5xl px-2 py-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.06)' }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="p-8" style={{ background: BG }}>
              <h3 className="text-[18px] font-semibold" style={{ color: INK }}>{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: MUTED }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-2 pb-24">
        <div className="relative overflow-hidden rounded-3xl border px-8 py-16 text-center"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: `radial-gradient(120% 140% at 50% 0%, ${INDIGO}33, transparent 60%)` }}>
          <h2 className="mx-auto max-w-2xl text-[34px] font-semibold tracking-tight md:text-[44px]" style={{ color: INK }}>
            Run your whole business in one place
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px]" style={{ color: MUTED }}>
            Set up your storefront in minutes. No platform fees until your first sale.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PrimaryBtn to="/sell">Start selling</PrimaryBtn>
            <GhostBtn to="/login">Talk to us</GhostBtn>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-2 py-8 text-[13px] sm:flex-row" style={{ color: MUTED }}>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded" style={{ background: `linear-gradient(135deg, ${INDIGO}, #b794f6)` }} />
            <span>© {new Date().getFullYear()} Orderlynk</span>
          </div>
          <div className="flex gap-6">
            {['Marketplace', 'Sell', 'Pricing', 'Support', 'Privacy'].map((l) => (
              <a key={l} href="#" className="hover:text-white">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
