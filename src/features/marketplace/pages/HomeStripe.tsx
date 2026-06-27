import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Stripe.com-style reskin of the OrderLynk home page.
 *
 * Self-contained preview at `/preview/stripe`. Captures Stripe's signature:
 * the angled multi-colour gradient hero, blurple (#635bff) accent, deep slate
 * ink (#0a2540), airy #f6f9fc surfaces, three-up feature grids and a mock code
 * snippet — OrderLynk's commerce rails told the "developer-platform" way.
 */

const BLURPLE = '#635bff'
const SLATE = '#0a2540'
const SLATE_SOFT = '#425466'
const SANS = 'system-ui, -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif'

function ArrowLink({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1 text-[16px] font-semibold transition-colors"
      style={{ color: light ? '#fff' : BLURPLE }}
    >
      {children}
      <span className="transition-transform group-hover:translate-x-1">→</span>
    </Link>
  )
}

function Pill({ to, children, dark = false }: { to: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-all hover:-translate-y-0.5"
      style={dark ? { background: '#fff', color: SLATE } : { background: BLURPLE, color: '#fff' }}
    >
      {children}
    </Link>
  )
}

const FEATURES = [
  { title: 'Discovery', body: 'Verified storefronts and product pages, indexed for marketplace search.' },
  { title: 'Orders', body: 'Structured carts, unique order IDs and live status — no DM screenshots.' },
  { title: 'Payments', body: 'Secure collection, automatic platform fees, a clean ledger per order.' },
  { title: 'Fulfillment', body: 'Pickup codes, delivery routing, domestic shipping and import batches.' },
]

function Nav() {
  const items = ['Marketplace', 'Services', 'Batch & Cargo', 'Pricing', 'Support']
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-[22px] font-bold tracking-tight text-white">
          OrderLynk
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {items.map((i) => (
            <a key={i} href="#" className="text-[15px] font-medium text-white/90 hover:text-white">
              {i}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden text-[15px] font-semibold text-white sm:inline">
            Sign in →
          </Link>
          <Link
            to="/sell"
            className="rounded-full bg-white/95 px-4 py-2 text-[14px] font-semibold"
            style={{ color: SLATE }}
          >
            Start now →
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function HomeStripe() {
  return (
    <div className="min-h-screen bg-white" style={{ color: SLATE, fontFamily: SANS }}>
      <Nav />

      {/* Hero with the signature angled gradient */}
      <section className="relative overflow-hidden">
        {/* The diagonal gradient band — clipped at an angle like Stripe's */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(100deg, #a960ee 0%, #635bff 28%, #2bd4d9 58%, #ffcb57 86%, #ff7a59 100%)',
            clipPath: 'polygon(0 0, 100% 0, 100% 72%, 0 100%)',
          }}
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-6 pb-24 pt-36 md:grid-cols-2 md:pb-32 md:pt-44">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-[44px] font-bold leading-[1.05] tracking-tight text-white md:text-[64px]"
            >
              Commerce
              <br />
              infrastructure for
              <br />
              community vendors
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 max-w-md text-[19px] leading-relaxed text-white/95"
            >
              Join the platform that turns social demand into structured orders, secure payments and
              reliable fulfillment — from local pickup to import batches.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <Pill to="/sell" dark>
                Start now →
              </Pill>
              <ArrowLink to="/" light>
                Browse the marketplace
              </ArrowLink>
            </motion.div>
          </div>

          {/* Mock "API" / order panel — Stripe always shows a product surface */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="overflow-hidden rounded-2xl bg-[#0a2540] shadow-[0_50px_100px_-20px_rgba(50,50,93,0.45)]"
          >
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-[12px] text-white/50">order.create</span>
            </div>
            <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-relaxed">
              <code>
                <span className="text-[#7a88ff]">const</span> <span className="text-white">order</span> = <span className="text-[#7a88ff]">await</span> <span className="text-white">orderlynk.orders.</span><span className="text-[#2bd4d9]">create</span>({'{'}
                {'\n'}  <span className="text-[#ffcb57]">vendor</span>: <span className="text-[#7ee787]">'lagos-pantry'</span>,
                {'\n'}  <span className="text-[#ffcb57]">items</span>: [{'{'} sku: <span className="text-[#7ee787]">'jollof-kit'</span>, qty: <span className="text-[#ff9a76]">2</span> {'}'}],
                {'\n'}  <span className="text-[#ffcb57]">fulfillment</span>: <span className="text-[#7ee787]">'pickup'</span>,
                {'\n'}{'}'});
                {'\n\n'}<span className="text-white/40">{'// → OB-260601-4821 · status: paid'}</span>
              </code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section style={{ background: '#f6f9fc' }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-[15px] font-semibold" style={{ color: BLURPLE }}>
            One platform, four rails
          </p>
          <h2 className="mt-2 max-w-2xl text-[32px] font-bold tracking-tight md:text-[40px]">
            Everything from discovery to delivery
          </h2>
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="h-1 w-9 rounded-full" style={{ background: BLURPLE }} />
                <h3 className="mt-4 text-[20px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: SLATE_SOFT }}>
                  {f.body}
                </p>
                <div className="mt-3">
                  <ArrowLink to="/">Learn more</ArrowLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark stats band */}
      <section style={{ background: SLATE }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-2 md:grid-cols-4">
          {[
            ['12,400+', 'Orders processed'],
            ['450+', 'Verified vendors'],
            ['38', 'Cities served'],
            ['99.2%', 'On-time fulfillment'],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-[40px] font-bold tracking-tight text-white">{v}</p>
              <p className="mt-1 text-[15px] text-white/60">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#f6f9fc' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20">
          <h2 className="max-w-2xl text-[32px] font-bold tracking-tight md:text-[44px]">
            Ready to bring your next 50 orders into one place?
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <Pill to="/sell">Start now →</Pill>
            <ArrowLink to="/login">Contact sales</ArrowLink>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: SLATE }}>
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-[20px] font-bold text-white">OrderLynk</p>
            <p className="mt-3 max-w-xs text-[14px] text-white/55">
              Commerce rails for community-based vendors, from WhatsApp to your doorstep.
            </p>
          </div>
          {[
            ['Products', ['Marketplace', 'Services', 'Batch & Cargo', 'Tracking']],
            ['Company', ['About', 'Careers', 'Pricing', 'Support']],
            ['Resources', ['Docs', 'Blog', 'Contact', 'Legal']],
          ].map(([head, links]) => (
            <div key={head as string}>
              <p className="mb-3 text-[13px] font-semibold text-white">{head as string}</p>
              <ul className="space-y-2.5">
                {(links as string[]).map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[14px] text-white/60 hover:text-white">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 py-6 text-center text-[13px] text-white/40">
          © {new Date().getFullYear()} OrderLynk · Built for African &amp; diaspora commerce
        </div>
      </footer>
    </div>
  )
}
