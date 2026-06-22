import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Dark, premium "KojoForex-style" reskin of the Orderlynk home page.
 *
 * This is a self-contained visual preview mounted at `/preview` (outside the
 * global light Layout). It renders its own dark nav + footer so the aesthetic
 * reads end-to-end: near-black canvas, gold accents, big bold display type,
 * stats-led hero, testimonial cards and a results-driven CTA — Orderlynk's
 * real content mapped onto KojoForex's structure.
 */

// ── Theme tokens (local to this preview) ────────────────────────────────────
const GOLD = '#E0B23C'

const STATS = [
  { value: '12,400+', label: 'Orders processed' },
  { value: '450+', label: 'Verified vendors' },
  { value: '38', label: 'Cities served' },
  { value: '99.2%', label: 'On-time fulfillment' },
]

const RAILS = [
  {
    n: '01',
    name: 'Discovery',
    desc: 'Verified storefronts, rich product pages and marketplace search that puts your shop in front of ready buyers.',
  },
  {
    n: '02',
    name: 'Orders',
    desc: 'Structured carts, unique order IDs and live status tracking — no more chasing screenshots in DMs.',
  },
  {
    n: '03',
    name: 'Payments',
    desc: 'Secure collection, automatic platform fees and a clean ledger behind every single order.',
  },
  {
    n: '04',
    name: 'Fulfillment',
    desc: 'Pickup codes, local delivery, domestic shipping and import batches — visibility from cart to doorstep.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Amara O.',
    handle: 'Lagos Pantry · Toronto',
    quote:
      'I went from 30 WhatsApp DMs a day to one dashboard. My customers track their own orders now — I just pack and ship.',
    result: '3.2× repeat orders',
  },
  {
    name: 'Kwame B.',
    handle: 'Accra Threads · London',
    quote:
      'The pickup codes alone saved me hours. Payments land clean, every order has an ID, and nothing slips through.',
    result: '£18k first quarter',
  },
  {
    name: 'Zainab M.',
    handle: 'Naija Spice Co · Houston',
    quote:
      'Import batches changed everything. My customers pre-order, I ship one cargo load, everyone sees status live.',
    result: '600+ batch buyers',
  },
]

const FEATURES = [
  'Shareable order links for every product',
  'Live payment + fulfillment tracking',
  'Pickup codes & delivery routing',
  'Import batch & cargo pre-orders',
  'Automatic platform-fee accounting',
  'One dashboard for every channel',
]

// ── Small presentational helpers ────────────────────────────────────────────
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-[0.28em]"
      style={{ color: GOLD }}
    >
      {children}
    </p>
  )
}

function GoldButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: `linear-gradient(180deg, #F0CB5C, ${GOLD})` }}
    >
      {children}
    </Link>
  )
}

function GhostButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/5"
    >
      {children}
    </Link>
  )
}

// ── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const items = ['Marketplace', 'Services', 'Batch & Cargo', 'Track order']
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-black"
            style={{ background: `linear-gradient(180deg, #F0CB5C, ${GOLD})` }}
          >
            O
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            Orderlynk
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          {items.map((i) => (
            <a key={i} href="#" className="transition-colors hover:text-white">
              {i}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden px-3 py-2 text-sm text-white/70 transition-colors hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <GoldButton to="/sell">Start selling</GoldButton>
        </div>
      </div>
    </header>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function HomeKojo() {
  const [count, setCount] = useState(0)

  // Tiny "live" flourish so the hero feels alive, in the KojoForex spirit.
  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c + 1) % STATS.length), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0B] font-sans text-white antialiased">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient gold glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-[140px]"
            style={{ background: `radial-gradient(circle, ${GOLD}, transparent 60%)` }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-20 pt-20 text-center md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/80"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
            Commerce rails for community vendors
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mx-auto mt-7 max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl"
          >
            Where serious vendors{' '}
            <span style={{ color: GOLD }}>grow</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/65"
          >
            Orderlynk turns social demand into structured orders, secure payments and reliable
            fulfillment — for African &amp; diaspora vendors, from local pickup to import batches.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.19 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <GoldButton to="/sell">Start selling — it's free</GoldButton>
            <GhostButton to="/">Browse the marketplace →</GhostButton>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-4"
          >
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="bg-[#0A0A0B] px-6 py-7 transition-colors"
                style={count === i ? { background: 'rgba(224,178,60,0.07)' } : undefined}
              >
                <p
                  className="text-3xl font-extrabold tracking-tight"
                  style={{ color: count === i ? GOLD : 'white' }}
                >
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/45">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* The four rails */}
      <section className="border-t border-white/10 bg-[#08080A]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>One platform, four rails</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything from discovery to delivery
            </h2>
            <p className="mt-3 text-white/55">
              No fluff. Just the infrastructure that turns a busy DM inbox into a real business.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RAILS.map((r) => (
              <div
                key={r.name}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-white/25"
              >
                <span
                  className="font-mono text-sm font-semibold"
                  style={{ color: GOLD }}
                >
                  {r.n}
                </span>
                <p className="mt-3 text-xl font-bold">{r.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success stories */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Success stories</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Vendors who stopped chasing screenshots
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-7"
              >
                <div
                  className="mb-5 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold text-black"
                  style={{ background: GOLD }}
                >
                  {t.result}
                </div>
                <blockquote className="flex-1 text-[15px] leading-relaxed text-white/80">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-black"
                    style={{ background: `linear-gradient(180deg, #F0CB5C, ${GOLD})` }}
                  >
                    {t.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-white/45">{t.handle}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Feature split */}
      <section className="border-t border-white/10 bg-[#08080A]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <Eyebrow>The vendor toolkit</Eyebrow>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One dashboard for every channel you sell on
            </h2>
            <p className="mt-4 text-white/60">
              WhatsApp, Instagram, in-person — bring it all into Orderlynk. Your customers get a
              real checkout and live tracking; you get clean payments and zero spreadsheet chaos.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                  <span
                    className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-bold text-black"
                    style={{ background: GOLD }}
                  >
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <GoldButton to="/sell">Apply to sell →</GoldButton>
            </div>
          </div>

          {/* Order-tracker mock, dark edition */}
          <div className="rounded-2xl border border-white/10 bg-[#0E0E11] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">Order</p>
                <p className="font-mono text-lg font-semibold">OB-260601-4821</p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold text-black"
                style={{ background: GOLD }}
              >
                Paid
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Order received', true],
                ['Payment confirmed', true],
                ['Vendor confirmed', true],
                ['Ready for pickup', false],
              ].map(([label, done], i) => (
                <div key={i} className="flex items-center gap-3">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold"
                    style={
                      done
                        ? { background: GOLD, color: 'black' }
                        : { border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    {done ? '✓' : (i as number) + 1}
                  </span>
                  <span className={done ? 'font-medium' : 'text-white/45'}>{label as string}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wider text-white/40">Pickup code</p>
              <p
                className="font-mono text-2xl font-bold tracking-[0.3em]"
                style={{ color: GOLD }}
              >
                5821
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <div
            className="relative overflow-hidden rounded-3xl border border-white/10 px-8 py-16 text-center md:px-16"
            style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgba(224,178,60,0.16), transparent 60%)' }}
          >
            <Eyebrow>Ready when you are</Eyebrow>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Bring your next 50 orders into one place
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/60">
              Shareable links, payment tracking and pickup codes. Set up your storefront in minutes —
              no platform fees until you make your first sale.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <GoldButton to="/sell">Start selling free</GoldButton>
              <GhostButton to="/login">Vendor sign in</GhostButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#08080A]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-black"
                style={{ background: `linear-gradient(180deg, #F0CB5C, ${GOLD})` }}
              >
                O
              </span>
              <span className="text-lg font-bold tracking-tight">Orderlynk</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50">
              Commerce rails for community-based vendors — structured orders, secure payments and
              reliable fulfillment, from WhatsApp to your doorstep.
            </p>
            <div className="mt-5 flex gap-3 text-white/50">
              {['Instagram', 'YouTube', 'X', 'Telegram'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs transition-colors hover:border-white/40 hover:text-white"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Shop</p>
            <ul className="space-y-2 text-sm text-white/60">
              {['Marketplace', 'Book a service', 'Batch & Cargo', 'Track an order'].map((l) => (
                <li key={l}>
                  <a href="#" className="transition-colors hover:text-white">{l}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">Vendors</p>
            <ul className="space-y-2 text-sm text-white/60">
              {['Sell on Orderlynk', 'Vendor sign in', 'Pricing', 'Support'].map((l) => (
                <li key={l}>
                  <a href="#" className="transition-colors hover:text-white">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Orderlynk · Built for African &amp; diaspora commerce
        </div>
      </footer>
    </div>
  )
}