import { useState } from 'react'
import { api, ApiError } from '@/shared/lib/api'
import type { BatchOrder, ShipmentRequest, BatchPaymentInit } from '@/shared/lib/types'
import { money, titleCase, cargoTone } from '@/shared/lib/format'
import { ErrorNote, SectionTitle, Spinner } from '@/shared/components/ui'
import { BookingPayment } from '@/features/booking/components/BookingPayment'
import { stripePromise } from '@/shared/lib/stripe'

type Loaded =
  | { kind: 'order'; order: BatchOrder }
  | { kind: 'shipment'; shipment: ShipmentRequest }

export default function BatchTracking() {
  const [publicId, setPublicId] = useState('')
  const [contact, setContact] = useState('')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setLoaded(null)
    const id = publicId.trim()
    try {
      if (id.toUpperCase().startsWith('SR-')) {
        setLoaded({ kind: 'shipment', shipment: await api.trackShipmentRequest(id, contact.trim()) })
      } else {
        setLoaded({ kind: 'order', order: await api.trackBatchOrder(id, contact.trim()) })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Not found — check your reference and contact')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <SectionTitle eyebrow="Batch & Cargo" title="Track your batch order or shipment" />
      <form onSubmit={lookup} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label className="label">Reference</label><input className="field" required value={publicId} onChange={(e) => setPublicId(e.target.value)} placeholder="BO-… or SR-…" /></div>
        <div><label className="label">Phone or email</label><input className="field" required value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <button className="btn-primary" disabled={loading || !publicId.trim() || !contact.trim()}>{loading ? <Spinner /> : 'Find'}</button>
      </form>

      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      {loaded?.kind === 'order' && <OrderView order={loaded.order} contact={contact} onPaid={(o) => setLoaded({ kind: 'order', order: o })} />}
      {loaded?.kind === 'shipment' && <ShipmentView shipment={loaded.shipment} contact={contact} onPaid={(s) => setLoaded({ kind: 'shipment', shipment: s })} />}
    </div>
  )
}

function OrderView({ order, contact, onPaid }: { order: BatchOrder; contact: string; onPaid: (o: BatchOrder) => void }) {
  return (
    <div className="card mt-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{order.publicOrderId}</p>
          <h2 className="font-display text-xl font-semibold">{order.batchName}</h2>
          <p className="text-sm text-muted">with {order.vendorName}</p>
        </div>
        <span className={`chip ${cargoTone(order.status)}`}>{titleCase(order.status)}</span>
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((i) => (
          <li key={i.batchProductId} className="flex justify-between"><span>{i.productName} × {i.quantity}</span><span className="font-mono">{money(i.lineTotal, order.currency)}</span></li>
        ))}
      </ul>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 border-t border-line pt-3 text-sm">
        <dt className="text-muted">Total</dt><dd className="text-right font-mono">{money(order.totalAmount, order.currency)}</dd>
        <dt className="text-muted">Paid</dt><dd className="text-right font-mono">{money(order.amountPaid, order.currency)}</dd>
        <dt className="text-muted">Balance</dt><dd className="text-right font-mono">{money(order.balanceDue, order.currency)}</dd>
      </dl>
      {order.pickupCode && <p className="mt-3 rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">Pickup code: <span className="font-mono font-semibold">{order.pickupCode}</span></p>}
      {order.balanceDue > 0 && (
        <PayPanel publicId={order.publicOrderId} contact={contact} amount={order.balanceDue} currency={order.currency}
          start={() => api.payBatchOrder(order.publicOrderId, contact)}
          onPaid={() => api.trackBatchOrder(order.publicOrderId, contact).then(onPaid).catch(() => {})} />
      )}
    </div>
  )
}

function ShipmentView({ shipment, contact, onPaid }: { shipment: ShipmentRequest; contact: string; onPaid: (s: ShipmentRequest) => void }) {
  const payable = shipment.actualWeight != null && shipment.balanceDue > 0
    && ['INVOICE_GENERATED', 'PAYMENT_PENDING', 'WEIGHED'].includes(shipment.status)
  return (
    <div className="card mt-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{shipment.publicRequestId}</p>
          <h2 className="font-display text-xl font-semibold">{shipment.batchName}</h2>
          <p className="text-sm text-muted">{shipment.itemDescription}</p>
        </div>
        <span className={`chip ${cargoTone(shipment.status)}`}>{titleCase(shipment.status)}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted">Weight</dt><dd className="text-right">{shipment.actualWeight != null ? `${shipment.actualWeight}kg` : shipment.estimatedWeight != null ? `${shipment.estimatedWeight}kg (est.)` : '—'}</dd>
        <dt className="text-muted">Charge</dt><dd className="text-right font-mono">{money(shipment.totalCharge, shipment.currency)}</dd>
        <dt className="text-muted">Paid</dt><dd className="text-right font-mono">{money(shipment.amountPaid, shipment.currency)}</dd>
        <dt className="text-muted">Balance</dt><dd className="text-right font-mono">{money(shipment.balanceDue, shipment.currency)}</dd>
      </dl>
      {shipment.pickupCode && <p className="mt-3 rounded-lg bg-forest/10 px-3 py-2 text-sm text-forest">Pickup code: <span className="font-mono font-semibold">{shipment.pickupCode}</span></p>}
      {shipment.actualWeight == null && (
        <p className="mt-3 text-sm text-muted">Your items haven't been weighed yet. You'll be able to pay once we've received and weighed them.</p>
      )}
      {payable && (
        <PayPanel publicId={shipment.publicRequestId} contact={contact} amount={shipment.balanceDue} currency={shipment.currency}
          start={() => api.payShipmentRequest(shipment.publicRequestId, contact)}
          onPaid={() => api.trackShipmentRequest(shipment.publicRequestId, contact).then(onPaid).catch(() => {})} />
      )}
    </div>
  )
}

function PayPanel({ amount, currency, start, onPaid }: {
  publicId: string; contact: string; amount: number; currency: string
  start: () => Promise<BatchPaymentInit>; onPaid: () => void
}) {
  const [init, setInit] = useState<BatchPaymentInit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const begin = async () => {
    setBusy(true); setError(null)
    try { setInit(await start()) }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not start payment') }
    finally { setBusy(false) }
  }

  if (done) return <p className="mt-4 rounded-lg bg-forest/12 px-3 py-2 text-sm text-forest">Payment received — your record will update shortly.</p>

  return (
    <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4">
      <p className="text-sm">Outstanding: <span className="font-semibold">{money(amount, currency)}</span></p>
      {!init ? (
        <>
          {stripePromise ? (
            <button className="btn-primary mt-3" onClick={begin} disabled={busy}>{busy ? <Spinner /> : 'Pay by card'}</button>
          ) : (
            <p className="mt-2 text-xs text-muted">Card payments aren't configured — contact the vendor to pay another way.</p>
          )}
          {error && <div className="mt-3"><ErrorNote message={error} /></div>}
        </>
      ) : (
        <div className="mt-3">
          <BookingPayment clientSecret={init.clientSecret} amountLabel={money(init.amount, init.currency)} onPaid={() => { setDone(true); onPaid() }} />
        </div>
      )}
    </div>
  )
}
