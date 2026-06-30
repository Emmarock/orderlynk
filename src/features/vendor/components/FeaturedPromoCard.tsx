import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiMessage } from '@/shared/lib/api'
import type { FeaturedPlacement, FeaturedPricing } from '@/shared/lib/types'
import { formatDate, money } from '@/shared/lib/format'
import { ErrorNote, Spinner } from '@/shared/components/ui'

/**
 * Buy featured placement — promotes the store to the top of marketplace discovery for a window. The
 * fee is charged to the vendor's card on file (required). Purchases stack, so the window extends rather
 * than resets. Shows the current price, the active window (if any), and recent purchases.
 */
export default function FeaturedPromoCard() {
  const [pricing, setPricing] = useState<FeaturedPricing | null>(null)
  const [history, setHistory] = useState<FeaturedPlacement[]>([])
  const [hasCard, setHasCard] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    api.vendorFeaturedHistory().then(setHistory).catch(() => setHistory([]))
  }

  useEffect(() => {
    api.vendorFeaturedPricing().then(setPricing).catch(() => setPricing(null))
    api.vendorBillingStatus().then((s) => setHasCard(s.hasPaymentMethod)).catch(() => setHasCard(false))
    load()
  }, [])

  // The featured window is the furthest end date across purchases (purchases stack).
  const featuredUntil = history.reduce<string | null>((max, p) => (!max || p.endsAt > max ? p.endsAt : max), null)
  const isFeatured = featuredUntil != null && new Date(featuredUntil) > new Date()

  const buy = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.vendorPurchaseFeatured()
      load()
    } catch (e) {
      setError(apiMessage(e, 'Could not purchase featured placement. Check your card on file and try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Feature your store</h2>
          <p className="mt-1 text-sm text-muted">
            Rank at the top of the marketplace with a “Featured” badge. Charged to your card on file.
          </p>
        </div>
        {isFeatured && (
          <span className="chip whitespace-nowrap rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
            Featured
          </span>
        )}
      </div>

      {isFeatured && featuredUntil && (
        <p className="mt-3 text-sm text-forest">✓ Featured until {formatDate(featuredUntil)}.</p>
      )}

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {hasCard === false ? (
        <p className="mt-4 text-sm text-muted">
          Add a card in <Link to="/vendor/manage/settings" className="underline">Settings</Link> to feature your store.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={buy} disabled={busy || hasCard === null} className="btn-primary">
            {busy ? <Spinner /> : isFeatured ? 'Extend featuring' : 'Feature my store'}
          </button>
          {pricing && (
            <span className="text-sm text-muted">
              {money(pricing.fee, pricing.currency)} for {pricing.days} days
            </span>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-xs uppercase tracking-wider text-muted">Recent purchases</p>
          <ul className="mt-2 space-y-1 text-sm">
            {history.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span className="text-muted">{formatDate(p.startsAt)} → {formatDate(p.endsAt)}</span>
                <span className="font-mono">
                  {money(p.amount, p.currency)}
                  <span className={`ml-2 text-xs ${p.status === 'PAID' ? 'text-forest' : 'text-muted'}`}>{p.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
