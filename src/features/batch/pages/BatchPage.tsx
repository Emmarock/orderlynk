import { useMemo, useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import type { PublicBatch, BatchProduct, BatchOrder, ShipmentRequest, FulfillmentType } from '@/shared/lib/types'
import { money, titleCase, formatDay, cargoTone } from '@/shared/lib/format'
import { CopyOrderId, ErrorNote, PageLoader, SectionTitle, Spinner } from '@/shared/components/ui'
import { BookingPayment } from '@/features/booking/components/BookingPayment'
import AddressAutocomplete from '@/shared/components/AddressAutocomplete'
import SuggestField from '@/shared/components/SuggestField'

export default function BatchPage() {
  const { id = '' } = useParams()
  const [data, setData] = useState<PublicBatch | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [ordering, setOrdering] = useState(false)
  const [shipping, setShipping] = useState(false)

  useEffect(() => { api.batchPage(id).then(setData).catch(() => setNotFound(true)) }, [id])

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="font-display text-2xl">Batch not found</p>
        <Link to="/batches" className="btn-primary mt-6 inline-flex">Browse batches</Link>
      </div>
    )
  }
  if (!data) return <PageLoader />
  const b = data.batch
  const isCargo = b.batchType !== 'PRODUCT_BATCH'
  const hasProducts = data.products.length > 0
  const cartCount = Object.values(cart).reduce((n, q) => n + q, 0)

  const setQty = (bp: BatchProduct, qty: number) =>
    setCart((c) => ({ ...c, [bp.id]: Math.max(0, qty) }))

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/batches" className="text-sm text-muted hover:text-ink">← All batches</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{b.batchName}</h1>
          <p className="mt-1 text-muted">{data.batch.vendorName}{b.route ? ` · ${b.route}` : ''}</p>
        </div>
        <span className={`chip ${cargoTone(b.batchStatus)}`}>{titleCase(b.batchStatus)}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {b.originCountry && <Info label="Route" value={`${b.originCountry}${b.destinationCity ? ` → ${b.destinationCity}` : ''}`} />}
        {b.closeDate && <Info label="Orders close" value={formatDay(b.closeDate)} />}
        {b.estimatedArrival && <Info label="Est. arrival" value={formatDay(b.estimatedArrival)} />}
        {b.shippingMethod && <Info label="Shipping" value={titleCase(b.shippingMethod)} />}
        {b.pickupLocation && <Info label="Pickup" value={b.pickupLocation} />}
        {isCargo && b.ratePerKg != null && <Info label="Cargo rate" value={`${money(b.ratePerKg, b.currency)}/kg`} />}
      </div>
      {b.notes && <p className="mt-4 max-w-2xl text-sm text-muted">{b.notes}</p>}

      {!b.openForOrders && (
        <p className="mt-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-[#9A6A10]">
          This batch is not currently open for new orders or shipment requests.
        </p>
      )}

      {isCargo && b.openForOrders && (
        <div className="mt-6">
          <button className="btn-primary" onClick={() => setShipping(true)}>Send My Items in This Batch</button>
        </div>
      )}

      {hasProducts && (
        <div className="mt-10">
          <SectionTitle title="Shop this batch" />
          <div className="grid gap-4 sm:grid-cols-2">
            {data.products.map((bp) => {
              const qty = cart[bp.id] ?? 0
              const soldOut = bp.status === 'SOLD_OUT' || (bp.remaining != null && bp.remaining <= 0)
              return (
                <div key={bp.id} className="card flex gap-3 p-4">
                  {bp.imageUrl && <img src={bp.imageUrl} alt={bp.name} className="h-20 w-20 shrink-0 rounded-lg border border-line object-cover" />}
                  <div className="flex flex-1 flex-col">
                    <p className="font-medium">{bp.name}</p>
                    {bp.description && <p className="line-clamp-2 text-xs text-muted">{bp.description}</p>}
                    <p className="mt-1 font-mono text-sm">{money(bp.batchPrice, bp.currency)}</p>
                    {bp.remaining != null && <p className="text-xs text-muted">{bp.remaining} left</p>}
                    <div className="mt-auto pt-2">
                      {soldOut ? (
                        <span className="chip bg-ink/8 text-muted">Sold out</span>
                      ) : b.openForOrders ? (
                        <div className="flex items-center gap-2">
                          <button className="btn-quiet px-2" onClick={() => setQty(bp, qty - 1)} disabled={qty <= 0}>−</button>
                          <span className="w-6 text-center font-mono">{qty}</span>
                          <button className="btn-quiet px-2" onClick={() => setQty(bp, qty + 1)}>+</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-2xl border border-line bg-cream px-5 py-3 shadow-lg">
          <span className="text-sm">{cartCount} item{cartCount !== 1 ? 's' : ''} selected</span>
          <button className="btn-primary" onClick={() => setOrdering(true)}>Place order</button>
        </div>
      )}

      {ordering && <OrderModal batch={data} cart={cart} onClose={() => setOrdering(false)} />}
      {shipping && <ShipItemsModal batch={data} onClose={() => setShipping(false)} />}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  )
}

const FULFILLMENT: FulfillmentType[] = ['LOCAL_PICKUP', 'LOCAL_DELIVERY']

function OrderModal({ batch, cart, onClose }: { batch: PublicBatch; cart: Record<string, number>; onClose: () => void }) {
  const lines = useMemo(
    () => batch.products.filter((p) => (cart[p.id] ?? 0) > 0).map((p) => ({ p, qty: cart[p.id] })),
    [batch, cart],
  )
  const subtotal = lines.reduce((s, l) => s + l.p.batchPrice * l.qty, 0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('LOCAL_PICKUP')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<BatchOrder | null>(null)
  const [paid, setPaid] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true); setError(null)
    try {
      const created = await api.createBatchOrder({
        batchId: batch.batch.id,
        customerName: name, customerPhone: phone, customerEmail: email || undefined,
        items: lines.map((l) => ({ batchProductId: l.p.id, quantity: l.qty })),
        fulfillmentType: fulfillment,
        customerStreet: fulfillment === 'LOCAL_DELIVERY' ? street : undefined,
        customerCity: fulfillment === 'LOCAL_DELIVERY' ? city : undefined,
        sourceChannel: 'MARKETPLACE',
      })
      setOrder(created)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place order')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[92vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        {order ? (
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest/12 text-forest">✓</div>
            <h2 className="font-display text-2xl font-semibold">Order placed</h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-sand/50 px-3 py-2">
              <span className="text-xs uppercase tracking-wider text-muted">Tracking ref</span>
              <CopyOrderId value={order.publicOrderId} className="font-mono text-sm font-semibold" />
            </div>
            <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4 text-left text-sm">
              <p>{batch.batch.batchName}</p>
              <p className="mt-1 text-muted">Total {money(order.totalAmount, order.currency)}</p>
            </div>
            {!paid && order.clientSecret ? (
              <div className="mt-4 text-left">
                <BookingPayment clientSecret={order.clientSecret} amountLabel={money(order.totalAmount, order.currency)} onPaid={() => setPaid(true)} />
              </div>
            ) : paid ? (
              <p className="mt-4 rounded-lg bg-forest/12 px-3 py-2 text-sm text-forest">Payment received — you're booked into the batch.</p>
            ) : (
              <p className="mt-4 text-sm text-muted">We'll be in touch to confirm payment for this batch.</p>
            )}
            <div className="mt-5 flex justify-center gap-2">
              <Link to="/batches/track" className="btn-quiet">Track order</Link>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Place batch order</h2>
            <div className="rounded-xl border border-line bg-sand/40 p-4 text-sm">
              {lines.map((l) => (
                <div key={l.p.id} className="flex justify-between"><span>{l.p.name} × {l.qty}</span><span className="font-mono">{money(l.p.batchPrice * l.qty, l.p.currency)}</span></div>
              ))}
              <div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span className="font-mono">{money(subtotal, batch.batch.currency)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Your name</label><input className="field" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="field" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><label className="label">Email (optional)</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Fulfillment at destination</label>
                <select className="field" value={fulfillment} onChange={(e) => setFulfillment(e.target.value as FulfillmentType)}>
                  {FULFILLMENT.map((f) => <option key={f} value={f}>{titleCase(f)}</option>)}
                </select>
              </div>
              {fulfillment === 'LOCAL_DELIVERY' && (
                <div className="col-span-2 space-y-3">
                  <AddressAutocomplete
                    label="Search your delivery address"
                    country={batch.batch.destinationCountry}
                    onSelect={(addr) => { setStreet([addr.houseNumber, addr.street].filter(Boolean).join(' ')); setCity(addr.city ?? '') }}
                  />
                  <div><label className="label">Street</label><input className="field" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
                  <div><label className="label">City</label><input className="field" value={city} onChange={(e) => setCity(e.target.value)} /></div>
                </div>
              )}
            </div>
            {error && <ErrorNote message={error} />}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={submitting || !name.trim() || !phone.trim() || (fulfillment === 'LOCAL_DELIVERY' && (!street.trim() || !city.trim()))}>{submitting ? <Spinner /> : 'Place order'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ShipItemsModal({ batch, onClose }: { batch: PublicBatch; onClose: () => void }) {
  const b = batch.batch
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [packageCount, setPackageCount] = useState('1')
  const [estimatedWeight, setEstimatedWeight] = useState('')
  const [declaredValue, setDeclaredValue] = useState('')
  const [dropOff, setDropOff] = useState(b.collectionPoints[0] ?? '')
  // Default the destination to the batch's configured pickup point (the customer can override it).
  const [destination, setDestination] = useState(b.pickupLocation ?? '')
  const [preference, setPreference] = useState('PICKUP')
  const [restricted, setRestricted] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<ShipmentRequest | null>(null)

  const estimate = b.ratePerKg != null && estimatedWeight
    ? Number(estimatedWeight) * b.ratePerKg + (b.handlingFee ?? 0) : null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restricted) { setError('Please confirm your items contain no prohibited goods'); return }
    setSubmitting(true); setError(null)
    try {
      const r = await api.createShipmentRequest({
        batchId: b.id, customerName: name, customerPhone: phone, customerEmail: email || undefined,
        itemDescription, packageCount: Number(packageCount) || 1,
        estimatedWeight: estimatedWeight ? Number(estimatedWeight) : undefined,
        declaredValue: declaredValue ? Number(declaredValue) : undefined,
        originDropOffLocation: dropOff || undefined, destinationLocation: destination || undefined,
        deliveryPreference: preference, restrictedItemsConfirmed: restricted,
        sourceChannel: 'MARKETPLACE', notes: notes || undefined,
      })
      setCreated(r)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit request')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[92vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        {created ? (
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest/12 text-forest">✓</div>
            <h2 className="font-display text-2xl font-semibold">Shipment request submitted</h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-sand/50 px-3 py-2">
              <span className="text-xs uppercase tracking-wider text-muted">Tracking ref</span>
              <CopyOrderId value={created.publicRequestId} className="font-mono text-sm font-semibold" />
            </div>
            <p className="mt-2 text-xs text-muted">Save this reference to track your shipment's location and pay your invoice.</p>
            <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4 text-left text-sm">
              <p>Drop your items at: <span className="font-medium">{created.originDropOffLocation || b.pickupLocation || 'the collection point'}</span></p>
              <p className="mt-2 text-muted">Once received and weighed, you'll get a final invoice to pay before your items are added to the batch.</p>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              <Link to="/batches/track" className="btn-quiet">Track shipment</Link>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Send My Items</h2>
              <p className="text-sm text-muted">{b.batchName}{b.ratePerKg != null ? ` · ${money(b.ratePerKg, b.currency)}/kg` : ''}</p>
            </div>
            <div><label className="label">What are you sending?</label><textarea className="field min-h-16" required value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} placeholder="e.g. 2 boxes of clothing and shoes" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Packages</label><input className="field" type="number" min="1" value={packageCount} onChange={(e) => setPackageCount(e.target.value)} /></div>
              <div><label className="label">Est. weight (kg)</label><input className="field" type="number" min="0" step="0.1" value={estimatedWeight} onChange={(e) => setEstimatedWeight(e.target.value)} /></div>
              <div><label className="label">Declared value</label><input className="field" type="number" min="0" step="0.01" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} /></div>
              <div><label className="label">Destination handling</label>
                <select className="field" value={preference} onChange={(e) => setPreference(e.target.value)}>
                  <option value="PICKUP">Pickup</option><option value="DELIVERY">Delivery</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Drop-off location</label>
                {b.collectionPoints.length > 0 ? (
                  <select className="field" value={dropOff} onChange={(e) => setDropOff(e.target.value)}>
                    {b.collectionPoints.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <SuggestField value={dropOff} onChange={setDropOff} country={b.originCountry} pick={(s) => s.formatted} placeholder="Search an origin address…" />
                )}
              </div>
              <SuggestField label="Destination address/city" value={destination} onChange={setDestination} country={b.destinationCountry} pick={(s) => s.formatted} placeholder="Search a destination address…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Your name</label><input className="field" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="field" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><label className="label">Email (optional)</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>
            <div><label className="label">Notes (optional)</label><textarea className="field min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the cargo team should know" /></div>
            {estimate != null && (
              <p className="rounded-lg bg-sand/50 px-3 py-2 text-sm text-muted">Estimated charge (final after weighing): <span className="font-mono text-ink">{money(estimate, b.currency)}</span></p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-clay" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
              <span>I confirm my items contain no prohibited or restricted goods.</span>
            </label>
            {error && <ErrorNote message={error} />}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={submitting || !name.trim() || !phone.trim() || !itemDescription.trim() || !restricted}>{submitting ? <Spinner /> : 'Submit request'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
