import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'
import type {
  BatchSummary, BatchProduct, BatchOrder, ShipmentRequest, Product,
  BatchStatus, BatchOrderStatus, ShipmentRequestStatus,
} from '../../lib/types'
import { money, titleCase, cargoTone } from '../../lib/format'
import { ConsoleShell, VENDOR_TABS, StatCard } from '../../components/Console'
import { EmptyState, ErrorNote, PageLoader, Spinner } from '../../components/ui'

const BATCH_STATUSES: BatchStatus[] = [
  'DRAFT', 'OPEN', 'CLOSING_SOON', 'CLOSED', 'SOURCING', 'CONSOLIDATING', 'AT_CARGO_PARTNER',
  'SHIPPED', 'ARRIVED', 'CLEARED', 'READY_FOR_PICKUP', 'COMPLETED', 'DELAYED',
]
const ORDER_STATUSES: BatchOrderStatus[] = [
  'ORDER_RECEIVED', 'PAYMENT_PENDING', 'PAID', 'ASSIGNED_TO_BATCH', 'SOURCING', 'PACKED', 'SHIPPED',
  'ARRIVED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED',
]
const SHIPMENT_STATUSES: ShipmentRequestStatus[] = [
  'REQUEST_CREATED', 'AWAITING_DROP_OFF', 'RECEIVED_AT_COLLECTION', 'WEIGHED', 'INVOICE_GENERATED',
  'PAYMENT_PENDING', 'PAID', 'ADDED_TO_BATCH', 'SHIPPED', 'ARRIVED', 'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED',
]

type Tab = 'products' | 'orders' | 'shipments'

export default function VendorBatchDetail() {
  const { id = '' } = useParams()
  const [summary, setSummary] = useState<BatchSummary | null>(null)
  const [tab, setTab] = useState<Tab>('products')
  const [error, setError] = useState<string | null>(null)

  const [manualPayments, setManualPayments] = useState(false)

  const loadSummary = () => api.vendorBatch(id).then(setSummary).catch(() => setError('Could not load batch'))
  useEffect(() => { loadSummary() }, [id])
  useEffect(() => { api.myVendor().then((v) => setManualPayments(v.alternativePaymentsEnabled)).catch(() => {}) }, [])

  if (!summary) return error ? <div className="mx-auto max-w-3xl px-5 py-10"><ErrorNote message={error} /></div> : <PageLoader />
  const b = summary.batch
  const isCargo = b.batchType !== 'PRODUCT_BATCH'

  const setStatus = (status: string) => api.updateBatchStatus(b.id, status).then(loadSummary)

  return (
    <ConsoleShell
      title={b.batchName}
      subtitle={`${titleCase(b.batchType)}${b.route ? ` · ${b.route}` : ''}`}
      tabs={VENDOR_TABS}
      actions={<Link to="/vendor/manage/batches" className="btn-quiet">← All batches</Link>}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={`${summary.paidOrderCount}/${summary.orderCount} paid`} />
        <StatCard label="Shipment requests" value={String(summary.shipmentRequestCount)} />
        <StatCard label="Revenue" value={money(summary.revenue, b.currency)} />
        <StatCard label="Pending payments" value={money(summary.pendingPayments, b.currency)} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="label !mb-0">Batch status</label>
        <select className="field max-w-xs" value={b.batchStatus} onChange={(e) => setStatus(e.target.value)}>
          {BATCH_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
        <span className={`chip ${cargoTone(b.batchStatus)}`}>{titleCase(b.batchStatus)}</span>
        {b.visibility === 'DRAFT' && (
          <button className="btn-quiet text-forest" onClick={() => api.publishBatch(b.id, 'MARKETPLACE').then(loadSummary)}>Publish to marketplace</button>
        )}
      </div>

      <div className="mb-6 inline-flex rounded-xl border border-line bg-cream p-1">
        {(['products', 'orders', ...(isCargo ? ['shipments'] as Tab[] : [])] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-ink text-cream' : 'text-muted hover:text-ink'}`}>
            {t === 'shipments' ? 'Shipment requests' : t}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsTab batchId={b.id} />}
      {tab === 'orders' && <OrdersTab batchId={b.id} currency={b.currency} manualPayments={manualPayments} onPaid={loadSummary} />}
      {tab === 'shipments' && isCargo && <ShipmentsTab batchId={b.id} currency={b.currency} manualPayments={manualPayments} onPaid={loadSummary} />}
    </ConsoleShell>
  )
}

// ============================ Products ============================

function ProductsTab({ batchId }: { batchId: string }) {
  const [products, setProducts] = useState<BatchProduct[] | null>(null)
  const [attaching, setAttaching] = useState(false)

  const load = () => api.batchProducts(batchId).then(setProducts).catch(() => setProducts([]))
  useEffect(() => { load() }, [batchId])

  const editPrice = async (bp: BatchProduct) => {
    const v = prompt(`Batch price for "${bp.name}" (${bp.currency}):`, String(bp.batchPrice))
    if (v == null) return
    const limit = prompt('Quantity limit (0 = unlimited):', String(bp.quantityLimit))
    await api.updateBatchProduct(batchId, bp.id, { batchPrice: Number(v), quantityLimit: limit == null ? undefined : Number(limit) })
    load()
  }

  if (products === null) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button className="btn-quiet" onClick={() => setAttaching(true)}>Add from catalog</button>
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products in this batch" hint="Attach products from your catalog to sell into this cycle." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">Batch price</th><th className="px-5 py-3">Sold / limit</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((bp) => (
                <tr key={bp.id} className="hover:bg-sand/40">
                  <td className="px-5 py-3 font-medium">{bp.name}</td>
                  <td className="px-5 py-3 font-mono">{money(bp.batchPrice, bp.currency)}</td>
                  <td className="px-5 py-3">{bp.soldQuantity}{bp.quantityLimit > 0 ? ` / ${bp.quantityLimit}` : ''}</td>
                  <td className="px-5 py-3"><span className={`chip ${cargoTone(bp.status)}`}>{titleCase(bp.status)}</span></td>
                  <td className="px-5 py-3 text-right">
                    <button className="btn-quiet px-2" onClick={() => editPrice(bp)}>Edit</button>
                    <button className="btn-quiet px-2 text-clay hover:text-clay-dark" onClick={() => { if (confirm(`Remove "${bp.name}"?`)) api.removeBatchProduct(batchId, bp.id).then(load) }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {attaching && <AttachModal batchId={batchId} onClose={() => setAttaching(false)} onDone={() => { setAttaching(false); load() }} />}
    </div>
  )
}

function AttachModal({ batchId, onClose, onDone }: { batchId: string; onClose: () => void; onDone: () => void }) {
  const [catalog, setCatalog] = useState<Product[] | null>(null)
  const [otherBatches, setOtherBatches] = useState<{ id: string; batchName: string }[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.vendorProducts().then(setCatalog).catch(() => setCatalog([]))
    api.vendorBatches().then((bs) => setOtherBatches(bs.map((s) => s.batch).filter((b) => b.id !== batchId))).catch(() => {})
  }, [batchId])

  const attach = async () => {
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => k)
    if (ids.length === 0) return
    setBusy(true); setError(null)
    try { await api.attachBatchProducts(batchId, ids); onDone() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not attach'); setBusy(false) }
  }

  const copyFrom = async (sourceId: string) => {
    setBusy(true); setError(null)
    try { await api.copyBatchProducts(batchId, sourceId); onDone() }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not copy'); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[88vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">Add products</h2>
        {otherBatches.length > 0 && (
          <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4">
            <p className="label">Copy from a previous batch</p>
            <div className="flex flex-wrap gap-2">
              {otherBatches.map((b) => (
                <button key={b.id} className="btn-quiet" disabled={busy} onClick={() => copyFrom(b.id)}>{b.batchName}</button>
              ))}
            </div>
          </div>
        )}
        <p className="label mt-4">From your catalog</p>
        {catalog === null ? <Spinner /> : catalog.length === 0 ? (
          <p className="text-sm text-muted">No catalog products yet.</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-auto">
            {catalog.map((p) => (
              <li key={p.id}>
                <label className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-sand/50">
                  <span>{p.name} <span className="text-muted">· {money(p.price, p.currency)}</span></span>
                  <input type="checkbox" className="h-4 w-4 accent-clay" checked={!!selected[p.id]}
                    onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))} />
                </label>
              </li>
            ))}
          </ul>
        )}
        {error && <div className="mt-3"><ErrorNote message={error} /></div>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={attach} disabled={busy || !Object.values(selected).some(Boolean)}>{busy ? <Spinner /> : 'Attach selected'}</button>
        </div>
      </div>
    </div>
  )
}

// ============================ Orders ============================

function OrdersTab({ batchId, currency, manualPayments, onPaid }: { batchId: string; currency: string; manualPayments: boolean; onPaid: () => void }) {
  const [orders, setOrders] = useState<BatchOrder[] | null>(null)
  const [paying, setPaying] = useState<BatchOrder | null>(null)
  const load = () => api.vendorBatchOrders(batchId).then(setOrders).catch(() => setOrders([]))
  useEffect(() => { load() }, [batchId])
  if (orders === null) return <PageLoader />
  if (orders.length === 0) return <EmptyState title="No orders yet" hint="Batch product orders will appear here." />

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
          <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th>{manualPayments && <th className="px-5 py-3" />}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-sand/40">
              <td className="px-5 py-3 font-mono text-xs">{o.publicOrderId}</td>
              <td className="px-5 py-3 font-medium">{o.customerName}</td>
              <td className="px-5 py-3 text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
              <td className="px-5 py-3 font-mono">{money(o.totalAmount, currency)}</td>
              <td className="px-5 py-3"><span className={`chip ${cargoTone(o.paymentStatus)}`}>{titleCase(o.paymentStatus)}</span></td>
              <td className="px-5 py-3">
                <select className="field !py-1 text-xs" value={o.status} onChange={(e) => api.updateBatchOrderStatus(o.id, e.target.value).then(load)}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </select>
              </td>
              {manualPayments && (
                <td className="px-5 py-3 text-right">
                  {o.balanceDue > 0 && <button className="btn-quiet px-2 text-forest" onClick={() => setPaying(o)}>Record payment</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {paying && (
        <ManualPaymentModal
          title={`Record payment · ${paying.publicOrderId}`} balance={paying.balanceDue} currency={currency}
          onClose={() => setPaying(null)}
          onSubmit={(amount, reference) => api.recordBatchOrderPayment(paying.id, { amount, reference })
            .then(() => { setPaying(null); load(); onPaid() })}
        />
      )}
    </div>
  )
}

// ============================ Shipment requests ============================

function ShipmentsTab({ batchId, currency, manualPayments, onPaid }: { batchId: string; currency: string; manualPayments: boolean; onPaid: () => void }) {
  const [reqs, setReqs] = useState<ShipmentRequest[] | null>(null)
  const [weighing, setWeighing] = useState<ShipmentRequest | null>(null)
  const [paying, setPaying] = useState<ShipmentRequest | null>(null)
  const load = () => api.vendorBatchShipmentRequests(batchId).then(setReqs).catch(() => setReqs([]))
  useEffect(() => { load() }, [batchId])
  if (reqs === null) return <PageLoader />
  if (reqs.length === 0) return <EmptyState title="No shipment requests" hint="Customer 'Send My Items' requests will appear here." />

  return (
    <div className="space-y-3">
      {reqs.map((s) => (
        <div key={s.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted">{s.publicRequestId}</p>
              <p className="font-medium">{s.customerName} · {s.packageCount} pkg</p>
              <p className="text-sm text-muted">{s.itemDescription}</p>
            </div>
            <div className="text-right">
              <span className={`chip ${cargoTone(s.status)}`}>{titleCase(s.status)}</span>
              <p className="mt-1 text-sm">
                {s.actualWeight != null ? `${s.actualWeight}kg actual` : s.estimatedWeight != null ? `${s.estimatedWeight}kg est.` : 'unweighed'}
                {s.totalCharge > 0 && <> · <span className="font-mono">{money(s.totalCharge, currency)}</span></>}
              </p>
              <span className={`chip mt-1 ${cargoTone(s.paymentStatus)}`}>{titleCase(s.paymentStatus)}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(s.status === 'REQUEST_CREATED' || s.status === 'AWAITING_DROP_OFF') && (
              <button className="btn-quiet" onClick={() => api.receiveShipment(s.id).then(load)}>Mark received</button>
            )}
            <button className="btn-quiet text-forest" onClick={() => setWeighing(s)}>Weigh / invoice</button>
            {manualPayments && s.actualWeight != null && s.balanceDue > 0 && (
              <button className="btn-quiet text-forest" onClick={() => setPaying(s)}>Record payment</button>
            )}
            <select className="field !py-1 ml-auto max-w-[12rem] text-xs" value={s.status} onChange={(e) => api.updateShipmentStatus(s.id, e.target.value).then(load)}>
              {SHIPMENT_STATUSES.map((st) => <option key={st} value={st}>{titleCase(st)}</option>)}
            </select>
          </div>
        </div>
      ))}
      {weighing && <WeighModal req={weighing} onClose={() => setWeighing(null)} onDone={() => { setWeighing(null); load() }} />}
      {paying && (
        <ManualPaymentModal
          title={`Record payment · ${paying.publicRequestId}`} balance={paying.balanceDue} currency={currency}
          onClose={() => setPaying(null)}
          onSubmit={(amount, reference) => api.recordShipmentPayment(paying.id, { amount, reference })
            .then(() => { setPaying(null); load(); onPaid() })}
        />
      )}
    </div>
  )
}

/** Vendor records a manual card payment (gated by app.batches.manual-payments-enabled). */
function ManualPaymentModal({ title, balance, currency, onClose, onSubmit }: {
  title: string; balance: number; currency: string
  onClose: () => void; onSubmit: (amount: number, reference?: string) => Promise<void>
}) {
  const [amount, setAmount] = useState(String(balance))
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setError(null)
    try { await onSubmit(Number(amount), reference.trim() || undefined) }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not record payment'); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">Record a payment received out-of-band (e.g. transfer). Balance due {money(balance, currency)}.</p>
        <div className="mt-4 space-y-3">
          <div><label className="label">Amount ({currency})</label><input className="field" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><label className="label">Reference (optional)</label><input className="field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. card terminal receipt #" /></div>
        </div>
        {error && <div className="mt-3"><ErrorNote message={error} /></div>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !amount || Number(amount) <= 0}>{busy ? <Spinner /> : 'Record payment'}</button>
        </div>
      </div>
    </div>
  )
}

function WeighModal({ req, onClose, onDone }: { req: ShipmentRequest; onClose: () => void; onDone: () => void }) {
  const [actualWeight, setActualWeight] = useState(req.actualWeight != null ? String(req.actualWeight) : '')
  const [ratePerKg, setRatePerKg] = useState(String(req.ratePerKg))
  const [handlingFee, setHandlingFee] = useState(String(req.handlingFee))
  const [deliveryFee, setDeliveryFee] = useState(String(req.deliveryFee))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = (Number(actualWeight) || 0) * (Number(ratePerKg) || 0) + (Number(handlingFee) || 0) + (Number(deliveryFee) || 0)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      await api.weighShipment(req.id, {
        actualWeight: Number(actualWeight), ratePerKg: Number(ratePerKg),
        handlingFee: Number(handlingFee), deliveryFee: Number(deliveryFee),
      })
      onDone()
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not save'); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">Weigh &amp; invoice</h2>
        <p className="mt-1 text-sm text-muted">{req.publicRequestId} · {req.itemDescription}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><label className="label">Actual weight (kg)</label><input className="field" type="number" min="0" step="0.001" value={actualWeight} onChange={(e) => setActualWeight(e.target.value)} /></div>
          <div><label className="label">Rate per kg</label><input className="field" type="number" min="0" step="0.01" value={ratePerKg} onChange={(e) => setRatePerKg(e.target.value)} /></div>
          <div><label className="label">Handling fee</label><input className="field" type="number" min="0" step="0.01" value={handlingFee} onChange={(e) => setHandlingFee(e.target.value)} /></div>
          <div><label className="label">Delivery fee</label><input className="field" type="number" min="0" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg bg-sand/50 px-4 py-3 text-sm">
          <span className="text-muted">Final charge</span><span className="font-mono font-semibold">{money(total, req.currency)}</span>
        </div>
        {error && <div className="mt-3"><ErrorNote message={error} /></div>}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !actualWeight}>{busy ? <Spinner /> : 'Save & invoice'}</button>
        </div>
      </div>
    </div>
  )
}
