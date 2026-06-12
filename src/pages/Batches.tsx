import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { BatchCard, BatchType } from '../lib/types'
import { money, titleCase, formatDay } from '../lib/format'
import { EmptyState, PageLoader, SectionTitle } from '../components/ui'

const TYPES: BatchType[] = ['PRODUCT_BATCH', 'CARGO_BATCH', 'HYBRID_BATCH']

function badge(b: BatchCard) {
  if (b.batchType === 'CARGO_BATCH') return { label: 'Cargo Batch', cls: 'bg-clay/12 text-clay-dark' }
  if (b.batchType === 'HYBRID_BATCH') return { label: 'Batch + Cargo', cls: 'bg-gold/15 text-[#9A6A10]' }
  return { label: 'Batch Order', cls: 'bg-forest/12 text-forest' }
}

export default function Batches() {
  const [cards, setCards] = useState<BatchCard[] | null>(null)
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [batchType, setBatchType] = useState<BatchType | ''>('')

  const load = () => {
    setCards(null)
    api.batchMarketplace({
      originCountry: origin.trim() || undefined,
      destinationCity: destination.trim() || undefined,
      batchType: batchType || undefined,
    }).then(setCards).catch(() => setCards([]))
  }
  useEffect(() => { load() }, [batchType])

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <SectionTitle eyebrow="Pre-order & cargo" title="Batch & Cargo" />
      <p className="-mt-3 mb-8 max-w-2xl text-muted">
        Shop import batches before they ship, or send your own items into a cargo batch. Items aren't
        available for immediate pickup — check each batch's estimated arrival.
      </p>

      <div className="mb-8 flex flex-wrap items-end gap-3">
        <form className="min-w-40 flex-1" onSubmit={(e) => { e.preventDefault(); load() }}>
          <label className="label">Origin country</label>
          <input className="field" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Any" onBlur={load} />
        </form>
        <form className="min-w-40 flex-1" onSubmit={(e) => { e.preventDefault(); load() }}>
          <label className="label">Destination city</label>
          <input className="field" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Any" onBlur={load} />
        </form>
        <div className="min-w-40 flex-1">
          <label className="label">Type</label>
          <select className="field" value={batchType} onChange={(e) => setBatchType(e.target.value as BatchType | '')}>
            <option value="">All</option>
            {TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </div>
      </div>

      {cards === null ? (
        <PageLoader />
      ) : cards.length === 0 ? (
        <EmptyState title="No open batches" hint="Check back soon, or try different filters." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((b) => {
            const bg = badge(b)
            return (
              <Link key={b.id} to={`/batches/${b.id}`} className="card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className={`chip ${bg.cls}`}>{bg.label}</span>
                  {b.shippingMethod && <span className="text-xs text-muted">{titleCase(b.shippingMethod)}</span>}
                </div>
                <p className="font-display text-lg font-semibold group-hover:text-clay">{b.batchName}</p>
                <p className="text-sm text-muted">{b.vendorName}{b.route ? ` · ${b.route}` : ''}</p>
                <div className="mt-auto space-y-1 text-xs text-muted">
                  {b.originCountry && <p>From {b.originCountry}{b.destinationCity ? ` → ${b.destinationCity}` : ''}</p>}
                  {b.closeDate && <p>Orders close {formatDay(b.closeDate)}</p>}
                  {b.estimatedArrival && <p>Est. arrival {formatDay(b.estimatedArrival)}</p>}
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
                  <span className="text-muted">{b.productCount} product{b.productCount !== 1 ? 's' : ''}</span>
                  {b.acceptsShipmentRequests && b.ratePerKg != null && (
                    <span className="font-medium">{money(b.ratePerKg, b.currency)}/kg</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
