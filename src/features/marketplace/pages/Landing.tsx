import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '@/shared/lib/api'
import type { Vendor } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { titleCase } from '@/shared/lib/format'
import { LoadMore, PageLoader, SectionTitle } from '@/shared/components/ui'
import { usePlatformStats } from '@/features/marketplace/usePlatformStats'

const RAILS = [
  { name: 'Discovery', desc: 'Verified storefronts, product pages and marketplace search.' },
  { name: 'Orders', desc: 'Structured carts, order IDs and live status tracking.' },
  { name: 'Payments', desc: 'Collection, platform fees and a ledger for every order.' },
  { name: 'Fulfillment', desc: 'Pickup, delivery, domestic shipping and import batches.' },
]

function VendorCard({ vendor }: { vendor: Vendor }) {
  const initials = vendor.businessName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
  return (
    <Link
      to={`/vendor/${vendor.storeSlug}`}
      className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lift"
    >
      {vendor.bannerUrl && (
        // Consistent aspect-ratio crop + inset hairline so photographic banners sit
        // cleanly (not as floating rectangles) on the card in both themes.
        <div className="relative aspect-[16/6] w-full overflow-hidden bg-sand ring-1 ring-inset ring-line">
          <img src={vendor.bannerUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        {vendor.logoUrl ? (
          <img src={vendor.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-forest/10 font-display text-lg font-semibold text-forest">
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold leading-tight">{vendor.businessName}</p>
          <p className="text-sm text-muted">
            {vendor.city ?? 'Canada'}
            {vendor.rating ? ` · ★ ${vendor.rating} (${vendor.ratingCount})` : ' · No ratings yet'}
          </p>
        </div>
        {vendor.featured && (
          <span className="ml-auto shrink-0 self-start rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ink">
            ★ Featured
          </span>
        )}
      </div>
      {vendor.description && (
        <p className="line-clamp-2 text-sm text-muted">{vendor.description}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-1.5">
        {vendor.fulfillmentTypes.slice(0, 3).map((t) => (
          <span key={t} className="chip border border-line bg-sand text-muted">
            {titleCase(t)}
          </span>
        ))}
      </div>
      </div>
    </Link>
  )
}

export default function Landing() {
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const stats = usePlatformStats()

  // Available product categories for the filter (kept in sync with the backend enum).
  useEffect(() => {
    api.optionSets().then((s) => setCategories(s.productCategories ?? [])).catch(() => setCategories([]))
  }, [])

  // Reload from the server whenever the category changes — the backend filters by
  // category and returns vendors already sorted highest-rated first.
  const { items: vendors, total, loading, loadingMore, hasNext, loadMore } =
    usePagedList<Vendor>((page, size) => api.marketplace(undefined, category || undefined, page, size), [category])

  // City filter is client-side, over the vendors loaded so far.
  const cities = Array.from(new Set(vendors.map((v) => v.city).filter(Boolean))) as string[]
  const filtered = city ? vendors.filter((v) => v.city === city) : vendors

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-clay/12 blur-3xl" />
          <div className="absolute -left-20 top-32 h-72 w-72 rounded-full bg-forest/10 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="eyebrow"
            >
              Commerce rails for community vendors
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl md:text-6xl"
            >
              Turn WhatsApp orders into a real{' '}
              <span className="relative whitespace-nowrap text-clay">
                business
                <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                  <path d="M2 7 C 60 2, 140 2, 198 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-md text-lg text-muted"
            >
              OrderLynk gives African &amp; diaspora vendors structured order links, payment tracking
              and fulfillment visibility — from local pickup to import batches.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.19 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <a href="#marketplace" className="btn-primary">Browse the marketplace</a>
              <Link to="/sell" className="btn-ghost">Sell on OrderLynk →</Link>
            </motion.div>
          </div>

          {/* Order-tracker visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="card relative overflow-hidden p-6"
          >
            <div className="rail absolute inset-x-0 top-0" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-faint">Order</p>
                <p className="font-mono text-lg font-semibold text-ink">OB-260601-4821</p>
              </div>
              {/* Paid uses the per-theme --success (lighter on the dark card so it stays legible). */}
              <span className="chip bg-success/15 text-success">Paid</span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Order received', true],
                ['Payment confirmed', true],
                ['Vendor confirmed', true],
                ['Ready for pickup', false],
              ].map(([label, done], i) => (
                <div key={i} className="flex items-center gap-3">
                  {/* Completed steps: --success fill; cream check flips with the theme. */}
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${done ? 'bg-success text-cream' : 'border border-line text-faint'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={done ? 'font-medium text-ink' : 'text-muted'}>{label as string}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-line bg-sand p-4">
              <p className="text-xs uppercase tracking-wider text-faint">Pickup code</p>
              <p className="font-mono text-2xl font-semibold tracking-[0.3em] text-clay">5821</p>
            </div>
          </motion.div>
        </div>

        {/* Live platform stats — KojoForex-style strip backed by /api/platform/stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mx-auto -mt-2 mb-16 grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="bg-sand px-6 py-7">
              <p className="font-display text-3xl font-semibold tracking-tight text-clay">{s.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-faint">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* The rails */}
      <section className="border-y border-line bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <SectionTitle eyebrow="One platform, four rails" title="Everything from discovery to delivery" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RAILS.map((rail, i) => (
              <div key={rail.name} className="relative rounded-2xl border border-line bg-sand p-5">
                <span className="font-mono text-sm text-clay">0{i + 1}</span>
                <p className="mt-2 font-display text-xl font-semibold">{rail.name}</p>
                <p className="mt-1 text-sm text-muted">{rail.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section id="marketplace" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Verified vendors" title="Shop the marketplace" />
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCity('')} className={city === '' ? 'pill-active' : 'pill'}>
                All cities
              </button>
              {cities.map((c) => (
                <button key={c} onClick={() => setCity(c)} className={city === c ? 'pill-active' : 'pill'}>
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category filter — pick a vendor by what they sell; top-rated vendors lead each category. */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => { setCategory(''); setCity('') }}
              className={category === '' ? 'pill-active' : 'pill'}
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setCity('') }}
                className={category === c ? 'pill-active' : 'pill'}
              >
                {titleCase(c)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <p className="text-muted">
            {category ? `No vendors in ${titleCase(category)} yet — try another category.` : 'No vendors available yet — check back soon.'}
          </p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <VendorCard key={v.id} vendor={v} />
              ))}
            </div>
            <LoadMore shown={vendors.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />
          </>
        )}
      </section>

      {/* Vendor CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        {/* Secondary --green surface. `text-cream` flips with the theme (near-white on the
            dark-green light-mode block; near-black on the lighter dark-mode green) so copy
            and the CTA stay legible in both themes. */}
        <div className="relative overflow-hidden rounded-2xl bg-forest px-8 py-12 text-cream md:px-14">
          <div className="rail absolute inset-x-0 top-0" />
          <div className="grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h3 className="font-display text-3xl font-semibold leading-tight">
                Already selling on WhatsApp or Instagram?
              </h3>
              <p className="mt-3 max-w-lg text-cream/85">
                Bring your next 50 orders into one dashboard. Shareable links, payment tracking and
                pickup codes — no more chasing screenshots in DMs.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link to="/sell" className="btn bg-sand text-ink hover:bg-sand/85">
                Apply to sell →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
