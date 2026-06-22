import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Airbnb.com-style reskin of the Orderlynk home page.
 *
 * Self-contained preview at `/preview/airbnb`. Captures Airbnb's warmth:
 * Rausch coral #FF385C, #222 ink, white surfaces, the big rounded search pill,
 * a category tab row, and a grid of rounded listing cards with images, ratings
 * and a heart — Orderlynk's vendors presented as "stays you'd browse".
 */

const RAUSCH = '#FF385C'
const INK = '#222222'
const GRAY = '#717171'
const SANS = '"Circular", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const CATEGORIES = [
  ['🍲', 'Food'],
  ['👗', 'Fashion'],
  ['💄', 'Beauty'],
  ['🏠', 'Home'],
  ['🧺', 'Groceries'],
  ['✂️', 'Services'],
  ['📦', 'Batch & Cargo'],
  ['🎁', 'Crafts'],
]

type Listing = {
  name: string
  city: string
  tag: string
  rating: string
  price: string
  hue: string
}

const LISTINGS: Listing[] = [
  { name: 'Lagos Pantry', city: 'Toronto, ON', tag: 'Jollof kits & spices', rating: '4.97', price: 'from $18', hue: 'linear-gradient(135deg,#ff9a76,#ff385c)' },
  { name: 'Accra Threads', city: 'London, UK', tag: 'Ankara & ready-to-wear', rating: '4.91', price: 'from £35', hue: 'linear-gradient(135deg,#f6d365,#fda085)' },
  { name: 'Naija Spice Co', city: 'Houston, TX', tag: 'Import batch · pre-order', rating: '4.99', price: 'from $12', hue: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { name: 'Mama’s Kitchen', city: 'Atlanta, GA', tag: 'Catering & small chops', rating: '4.88', price: 'from $40', hue: 'linear-gradient(135deg,#84fab0,#8fd3f4)' },
  { name: 'Glow by Ada', city: 'Manchester, UK', tag: 'Skincare & beauty', rating: '4.95', price: 'from £20', hue: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)' },
  { name: 'Kente Home', city: 'Brooklyn, NY', tag: 'Textiles & décor', rating: '4.93', price: 'from $25', hue: 'linear-gradient(135deg,#fdcbf1,#e6dee9)' },
  { name: 'Suya Express', city: 'Calgary, AB', tag: 'Grills & catering', rating: '4.96', price: 'from $15', hue: 'linear-gradient(135deg,#ffecd2,#fcb69f)' },
  { name: 'Diaspora Crafts', city: 'Dublin, IE', tag: 'Handmade gifts', rating: '4.9', price: 'from €18', hue: 'linear-gradient(135deg,#c2e9fb,#a1c4fd)' },
]

function Heart() {
  const [on, setOn] = useState(false)
  return (
    <button
      onClick={(e) => { e.preventDefault(); setOn((v) => !v) }}
      className="absolute right-3 top-3 transition-transform hover:scale-110"
      aria-label="Save"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill={on ? RAUSCH : 'rgba(0,0,0,0.5)'} stroke="white" strokeWidth="2">
        <path d="M12 21s-7.5-4.6-10-9.1C0.5 8.5 2 5 5.2 5c2 0 3.3 1.2 4 2.2C9.8 6.2 11.2 5 13.2 5 16.4 5 18 8.5 16.5 11.9 14 16.4 12 21 12 21z" />
      </svg>
    </button>
  )
}

function ListingCard({ l }: { l: Listing }) {
  return (
    <Link to="/" className="group block">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl" style={{ background: l.hue }}>
        <Heart />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold" style={{ color: INK }}>
          Verified vendor
        </span>
        <span className="absolute bottom-3 left-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/90 text-[18px] font-bold" style={{ color: INK }}>
          {l.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
        </span>
      </div>
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold" style={{ color: INK }}>{l.name}</p>
          <span className="flex items-center gap-1 text-[14px]" style={{ color: INK }}>
            <span>★</span>{l.rating}
          </span>
        </div>
        <p className="text-[14px]" style={{ color: GRAY }}>{l.city}</p>
        <p className="text-[14px]" style={{ color: GRAY }}>{l.tag}</p>
        <p className="mt-1 text-[14px]" style={{ color: INK }}>
          <span className="font-semibold">{l.price}</span>
        </p>
      </div>
    </Link>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white" style={{ borderColor: '#ebebeb' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-[22px] font-bold tracking-tight" style={{ color: RAUSCH }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill={RAUSCH}><circle cx="12" cy="12" r="11" /></svg>
          orderlynk
        </Link>
        <nav className="hidden items-center gap-6 text-[14px] font-medium md:flex" style={{ color: INK }}>
          <a href="#" className="hover:opacity-70">Shop</a>
          <a href="#" className="hover:opacity-70">Services</a>
          <a href="#" className="hover:opacity-70">Batch &amp; Cargo</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/sell" className="hidden rounded-full px-4 py-2.5 text-[14px] font-semibold hover:bg-gray-100 sm:inline" style={{ color: INK }}>
            Become a vendor
          </Link>
          <Link to="/login" className="flex items-center gap-3 rounded-full border px-3 py-2 shadow-sm hover:shadow-md" style={{ borderColor: '#dddddd' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" /></svg>
            <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: '#717171' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function HomeAirbnb() {
  const [active, setActive] = useState('Food')
  return (
    <div className="min-h-screen bg-white" style={{ color: INK, fontFamily: SANS }}>
      <Nav />

      {/* Hero with the signature search pill */}
      <section className="border-b" style={{ borderColor: '#ebebeb' }}>
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-14 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[36px] font-semibold tracking-tight md:text-[46px]"
          >
            Shop from vendors you can trust
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mx-auto mt-3 max-w-lg text-[18px]"
            style={{ color: GRAY }}
          >
            Verified storefronts, real order tracking and reliable fulfillment — from local pickup
            to import batches.
          </motion.p>

          {/* Search pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-8 flex max-w-2xl items-center rounded-full border bg-white p-2 shadow-[0_3px_12px_rgba(0,0,0,0.1)]"
            style={{ borderColor: '#dddddd' }}
          >
            <div className="flex-1 px-5 py-1.5 text-left">
              <p className="text-[12px] font-semibold">What</p>
              <p className="text-[14px]" style={{ color: GRAY }}>Jollof kits, ankara…</p>
            </div>
            <div className="h-8 w-px" style={{ background: '#dddddd' }} />
            <div className="flex-1 px-5 py-1.5 text-left">
              <p className="text-[12px] font-semibold">Where</p>
              <p className="text-[14px]" style={{ color: GRAY }}>Any city</p>
            </div>
            <div className="h-8 w-px" style={{ background: '#dddddd' }} />
            <div className="flex-1 px-5 py-1.5 text-left">
              <p className="text-[12px] font-semibold">Fulfillment</p>
              <p className="text-[14px]" style={{ color: GRAY }}>Pickup or delivery</p>
            </div>
            <button
              className="ml-2 flex items-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-semibold text-white"
              style={{ background: RAUSCH }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" strokeLinecap="round" />
              </svg>
              Search
            </button>
          </motion.div>
        </div>

        {/* Category tab row */}
        <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto px-6 pb-3">
          {CATEGORIES.map(([icon, label]) => {
            const on = active === label
            return (
              <button
                key={label}
                onClick={() => setActive(label)}
                className="flex flex-none flex-col items-center gap-2 border-b-2 pb-2 pt-1 transition-colors"
                style={{
                  borderColor: on ? INK : 'transparent',
                  color: on ? INK : GRAY,
                  opacity: on ? 1 : 0.75,
                }}
              >
                <span className="text-[22px]">{icon}</span>
                <span className="whitespace-nowrap text-[13px] font-semibold">{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Listing grid */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
          {LISTINGS.map((l) => (
            <ListingCard key={l.name} l={l} />
          ))}
        </div>
      </section>

      {/* Become a vendor band */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(120deg,#fff1f3,#ffe9ef)' }}>
          <div className="grid items-center gap-6 px-8 py-12 md:grid-cols-[1.4fr_1fr] md:px-14">
            <div>
              <h2 className="text-[30px] font-semibold tracking-tight md:text-[38px]">
                Already selling on WhatsApp?
              </h2>
              <p className="mt-3 max-w-lg text-[17px]" style={{ color: GRAY }}>
                List your shop on Orderlynk and turn DMs into real orders with tracking, payments and
                pickup codes. No platform fees until your first sale.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link
                to="/sell"
                className="rounded-xl px-6 py-3.5 text-[16px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: RAUSCH }}
              >
                Become a vendor →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ background: '#f7f7f7', borderColor: '#ebebeb' }}>
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
          {[
            ['Support', ['Help center', 'Track an order', 'Cancellation', 'Report a vendor']],
            ['Shopping', ['Marketplace', 'Services', 'Batch & Cargo', 'Gift cards']],
            ['Vendors', ['Become a vendor', 'Vendor sign in', 'Resources', 'Community']],
            ['Orderlynk', ['About', 'Careers', 'Newsroom', 'Privacy']],
          ].map(([head, links]) => (
            <div key={head as string}>
              <p className="mb-3 text-[14px] font-bold" style={{ color: INK }}>{head as string}</p>
              <ul className="space-y-2.5">
                {(links as string[]).map((l) => (
                  <li key={l}><a href="#" className="text-[14px] hover:underline" style={{ color: GRAY }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t py-5 text-center text-[13px]" style={{ borderColor: '#dddddd', color: GRAY }}>
          © {new Date().getFullYear()} Orderlynk · Built for African &amp; diaspora commerce
        </div>
      </footer>
    </div>
  )
}
