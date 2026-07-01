import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import type { ServiceCategory } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { money, titleCase } from '@/shared/lib/format'
import { EmptyState, LoadMore, PageLoader, SectionTitle } from '@/shared/components/ui'
import SuggestField from '@/shared/components/SuggestField'

const CATEGORIES: ServiceCategory[] = [
  'HAIR', 'NAILS', 'BARBER', 'MAKEUP', 'SPA_AND_MASSAGE', 'PHOTOGRAPHY', 'CLEANING',
  'PLUMBING', 'ELECTRICAL', 'HANDYMAN', 'AUTOMOTIVE', 'FITNESS', 'TUTORING', 'EVENTS', 'OTHER',
]

function Stars({ rating, count }: { rating?: number | null; count: number }) {
  if (!rating) return <span className="text-xs text-muted">No reviews yet</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-gold">★</span>
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted">({count})</span>
    </span>
  )
}

export default function Services() {
  const [category, setCategory] = useState<ServiceCategory | ''>('')
  const [city, setCity] = useState('')
  const [depositsOnly, setDepositsOnly] = useState(false)
  const trimmedCity = city.trim()

  const { items: providers, total, loading, loadingMore, hasNext, loadMore } = usePagedList(
    (page, size) => api.serviceMarketplace({
      category: category || undefined,
      city: trimmedCity || undefined,
      acceptsDeposits: depositsOnly,
    }, page, size),
    [category, trimmedCity, depositsOnly],
  )

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <SectionTitle eyebrow="Book a pro" title="Services marketplace" />

      <div className="mb-8 flex flex-wrap items-end gap-3">
        <SuggestField className="min-w-44 flex-1" label="City" value={city} onChange={setCity}
          type="city" pick={(s) => s.city || s.formatted} placeholder="Any city" />
        <div className="min-w-44 flex-1">
          <label className="label">Category</label>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory | '')}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-clay" checked={depositsOnly} onChange={(e) => setDepositsOnly(e.target.checked)} />
          Accepts deposits
        </label>
      </div>

      {loading ? (
        <PageLoader />
      ) : providers.length === 0 ? (
        <EmptyState title="No providers found" hint="Try a different category or city." />
      ) : (
        <>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <Link key={p.vendorId} to={`/services/${p.storeSlug}`} className="card group overflow-hidden transition-shadow hover:shadow-lg">
              <div className="h-28 bg-sand bg-cover bg-center" style={p.bannerUrl ? { backgroundImage: `url(${p.bannerUrl})` } : undefined} />
              <div className="p-5">
                <div className="flex items-center gap-3">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt={p.businessName} className="h-11 w-11 shrink-0 rounded-full border border-line object-cover" />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-cream">{p.businessName.charAt(0)}</span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold group-hover:text-clay">{p.businessName}</p>
                    <p className="truncate text-xs text-muted">{p.city || p.serviceArea || (p.locationType ? titleCase(p.locationType) : '')}</p>
                  </div>
                  {p.featured && (
                    <span className="ml-auto shrink-0 self-start rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ink">
                      ★ Featured
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Stars rating={p.rating} count={p.ratingCount} />
                  {p.startingPrice != null && <span className="text-sm text-muted">from <span className="font-semibold text-ink">{money(p.startingPrice, p.currency)}</span></span>}
                </div>
                {p.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.categories.slice(0, 4).map((c) => <span key={c} className="chip bg-ink/8 text-muted">{titleCase(c)}</span>)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        <LoadMore shown={providers.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />
        </>
      )}
    </div>
  )
}
