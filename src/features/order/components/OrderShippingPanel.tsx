import { useEffect, useState } from 'react'
import { api, ApiError } from '@/shared/lib/api'
import type { Order, RateOption, Shipment, ShipmentStatus, TrackingResponse } from '@/shared/lib/types'
import { formatDate, money } from '@/shared/lib/format'
import { ErrorNote, Spinner } from '@/shared/components/ui'

type Busy = 'rates' | 'label' | 'track' | null

const STATUS_TONE: Record<ShipmentStatus, string> = {
  RATED: 'bg-ink/8 text-muted',
  PURCHASED: 'bg-clay/12 text-clay-dark',
  IN_TRANSIT: 'bg-gold/15 text-gold',
  DELIVERED: 'bg-forest/12 text-forest',
  RETURNED: 'bg-clay/12 text-clay-dark',
  FAILED: 'bg-clay/12 text-clay-dark',
  CANCELLED: 'bg-ink/8 text-muted',
  UNKNOWN: 'bg-ink/8 text-muted',
}

function StatusChip({ status }: { status: ShipmentStatus }) {
  return <span className={`chip ${STATUS_TONE[status] ?? 'bg-ink/8 text-muted'}`}>{label(status)}</span>
}

function label(s: string): string {
  return s.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/**
 * Vendor shipping controls for an order: fetch live carrier rates, buy a label, then view the
 * tracking number / label PDF and refresh tracking. Self-contained; loads its own shipment.
 * Render only for shipped orders (DOMESTIC_SHIPPING).
 */
export function OrderShippingPanel({ order }: { order: Order }) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [rates, setRates] = useState<RateOption[] | null>(null)
  const [selectedRateId, setSelectedRateId] = useState('')
  const [tracking, setTracking] = useState<TrackingResponse | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api.shippingShipment(order.id)
      .then((s) => active && setShipment(s))
      .catch((e) => {
        // 404 simply means no shipment has been rated/created for this order yet.
        if (active && !(e instanceof ApiError && e.status === 404)) {
          setError(e instanceof ApiError ? e.message : 'Could not load shipment')
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [order.id])

  const purchased = !!shipment && shipment.status !== 'RATED'

  const getRates = async () => {
    setBusy('rates')
    setError(null)
    try {
      const res = await api.shippingOrderRates(order.id)
      setRates(res.rates)
      setSelectedRateId(res.rates[0]?.rateId ?? '')
      if (res.rates.length === 0) setError('No carrier rates available for this destination.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not fetch rates')
    } finally {
      setBusy(null)
    }
  }

  const buyLabel = async () => {
    setBusy('label')
    setError(null)
    try {
      const updated = await api.buyShippingLabel(order.id, selectedRateId || undefined)
      setShipment(updated)
      setRates(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not buy label')
    } finally {
      setBusy(null)
    }
  }

  const refresh = async () => {
    setBusy('track')
    setError(null)
    try {
      const t = await api.refreshShippingTracking(order.id)
      setTracking(t)
      setShipment((prev) => (prev ? { ...prev, status: t.status, eta: t.eta ?? prev.eta } : prev))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not refresh tracking')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-line bg-sand p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Shipping</h4>
        {shipment && <StatusChip status={shipment.status} />}
      </div>

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Spinner /> Loading shipment…</p>
      ) : purchased ? (
        <div className="mt-3 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Carrier</span>
            <span className="font-medium">
              {shipment!.carrier}{shipment!.serviceLevel ? ` · ${shipment!.serviceLevel}` : ''}
            </span>
          </div>
          {shipment!.amount != null && (
            <div className="flex justify-between">
              <span className="text-muted">Label cost</span>
              <span className="font-mono">{money(shipment!.amount, shipment!.currency ?? order.currency)}</span>
            </div>
          )}
          {shipment!.trackingNumber && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Tracking #</span>
              {shipment!.trackingUrl ? (
                <a href={shipment!.trackingUrl} target="_blank" rel="noreferrer" className="font-mono text-forest underline">
                  {shipment!.trackingNumber}
                </a>
              ) : (
                <span className="font-mono">{shipment!.trackingNumber}</span>
              )}
            </div>
          )}
          {shipment!.eta && (
            <div className="flex justify-between">
              <span className="text-muted">Est. delivery</span>
              <span>{formatDate(shipment!.eta)}</span>
            </div>
          )}
          {shipment!.trackingStatusDetail && (
            <p className="rounded-lg bg-cream p-2 text-xs text-muted">{shipment!.trackingStatusDetail}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {shipment!.labelUrl && (
              <a href={shipment!.labelUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center">
                Download label
              </a>
            )}
            <button className="btn-ghost flex-1" disabled={busy !== null || !shipment!.trackingNumber} onClick={refresh}>
              {busy === 'track' ? <Spinner /> : 'Refresh tracking'}
            </button>
          </div>

          {tracking && tracking.events.length > 0 && (
            <ol className="mt-2 space-y-2 border-t border-line pt-3">
              {tracking.events.slice().reverse().map((ev, i) => (
                <li key={i} className="flex justify-between gap-3 text-xs">
                  <span>
                    <span className="font-medium">{label(ev.status)}</span>
                    {ev.location && <span className="text-muted"> · {ev.location}</span>}
                    {ev.statusDetails && <span className="block text-muted">{ev.statusDetails}</span>}
                  </span>
                  {ev.occurredAt && <span className="shrink-0 text-muted">{formatDate(ev.occurredAt)}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          {shipment ? (
            <p className="text-muted">
              Rated at checkout: <span className="font-medium text-ink">
                {shipment.carrier}{shipment.serviceLevel ? ` · ${shipment.serviceLevel}` : ''}
              </span>
              {shipment.amount != null && <> — {money(shipment.amount, shipment.currency ?? order.currency)}</>}
            </p>
          ) : (
            <p className="text-muted">No shipment yet. Fetch live rates to buy a label.</p>
          )}

          {rates && rates.length > 0 && (
            <div className="space-y-2">
              {rates.map((r) => (
                <label
                  key={r.rateId}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                    selectedRateId === r.rateId ? 'border-clay bg-clay/8' : 'border-line bg-cream hover:border-ink/30'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="vendor-shipping-rate"
                      checked={selectedRateId === r.rateId}
                      onChange={() => setSelectedRateId(r.rateId)}
                    />
                    {r.providerImageUrl && <img src={r.providerImageUrl} alt={r.carrier} className="h-6 w-6 object-contain" />}
                    <span>
                      <span className="block font-medium">{r.carrier} · {r.serviceLevel}</span>
                      <span className="block text-xs text-muted">
                        {r.estimatedDays != null
                          ? `Est. ${r.estimatedDays} day${r.estimatedDays === 1 ? '' : 's'}`
                          : r.durationTerms || 'Delivery estimate at carrier'}
                      </span>
                    </span>
                  </span>
                  <span className="font-mono font-semibold">{money(r.amount, r.currency)}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button className="btn-ghost flex-1" disabled={busy !== null} onClick={getRates}>
              {busy === 'rates' ? <Spinner /> : rates ? 'Refresh rates' : 'Get live rates'}
            </button>
            <button
              className="btn-primary flex-1"
              disabled={busy !== null || (!shipment && !selectedRateId)}
              onClick={buyLabel}
              title={!shipment && !selectedRateId ? 'Fetch and select a rate first' : 'Buy a shipping label'}
            >
              {busy === 'label' ? <Spinner /> : 'Buy label'}
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
    </div>
  )
}