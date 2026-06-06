import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { FulfillmentStatus, Order, PaymentStatus } from '../../lib/types'
import { formatDate, money, titleCase } from '../../lib/format'
import { ConsoleShell, VENDOR_TABS } from '../../components/Console'
import { OrderFeeBreakdown, OrderItems, OrderStatusRow, OrderTimeline } from '../../components/OrderViews'
import { CopyOrderId, EmptyState, PageLoader, Spinner } from '../../components/ui'

const PAYMENT_FILTERS: (PaymentStatus | 'ALL')[] = ['ALL', 'PENDING', 'PAID']

function OrderDetail({ order, onUpdated }: { order: Order; onUpdated: (o: Order) => void }) {
  const [busy, setBusy] = useState(false)

  // Statuses reachable from the current one, per this order's fulfillment flow.
  const nextStatuses = useMemo<FulfillmentStatus[]>(() => {
    const idx = order.fulfillmentFlow.indexOf(order.fulfillmentStatus)
    const ahead = idx >= 0 ? order.fulfillmentFlow.slice(idx + 1) : order.fulfillmentFlow
    return [...ahead, 'CANCELLED']
  }, [order])

  const advance = async (status: FulfillmentStatus) => {
    setBusy(true)
    try {
      onUpdated(await api.updateFulfillment(order.id, status))
    } finally {
      setBusy(false)
    }
  }

  const markPaid = async () => {
    setBusy(true)
    try {
      onUpdated(await api.vendorUpdatePayment(order.id, { status: 'PAID', method: 'INTERAC_ETRANSFER' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 border-t border-line pt-5 md:grid-cols-2">
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Customer</h4>
        <p className="text-sm">{order.customerName}</p>
        <p className="text-sm text-muted">{order.customerPhone}</p>
        {order.customerEmail && <p className="text-sm text-muted">{order.customerEmail}</p>}
        {order.customerCity && <p className="text-sm text-muted">{order.customerCity}</p>}
        {order.notes && <p className="mt-2 rounded-lg bg-sand p-2 text-sm italic text-muted">“{order.notes}”</p>}

        <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Items</h4>
        <OrderItems order={order} />
        <div className="mt-3"><OrderFeeBreakdown order={order} /></div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Progress</h4>
        <OrderTimeline order={order} />

        <div className="mt-5 space-y-3 rounded-xl bg-sand p-4">
          {order.paymentStatus !== 'PAID' && (
            <button className="btn-forest w-full" disabled={busy} onClick={markPaid}>
              {busy ? <Spinner /> : 'Mark payment received'}
            </button>
          )}
          <div>
            <label className="label">Advance fulfillment</label>
            <select
              className="field"
              disabled={busy || order.fulfillmentStatus === 'COMPLETED'}
              value=""
              onChange={(e) => e.target.value && advance(e.target.value as FulfillmentStatus)}
            >
              <option value="">Choose next status…</option>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </select>
          </div>
          {order.pickupCode && (
            <p className="text-center font-mono text-sm">
              Pickup code <span className="font-semibold tracking-widest text-clay">{order.pickupCode}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VendorOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  // Refetch from the server whenever the date range changes (server filters by created-at).
  useEffect(() => {
    api.vendorOrders(from || undefined, to || undefined).then(setOrders).catch(() => setOrders([]))
  }, [from, to])

  const replace = (updated: Order) =>
    setOrders((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? null)

  if (orders === null) return <PageLoader />
  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.paymentStatus === filter)

  return (
    <ConsoleShell
      title="Orders"
      subtitle="Manage payment and fulfillment for every order"
      tabs={VENDOR_TABS}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="field h-9 w-auto px-2 py-1 text-sm"
            aria-label="From date"
          />
          <span className="text-muted">–</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="field h-9 w-auto px-2 py-1 text-sm"
            aria-label="To date"
          />
          {(from || to) && (
            <button className="btn-quiet px-2 text-sm" onClick={() => { setFrom(''); setTo('') }}>
              Clear
            </button>
          )}
          {PAYMENT_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${filter === f ? 'bg-ink text-cream' : 'bg-cream text-muted hover:text-ink'}`}
            >
              {f === 'ALL' ? 'All' : titleCase(f)}
            </button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState title="No orders here" hint="Orders placed through your storefront will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const open = openId === o.id
            return (
              <div key={o.id} className="card p-5">
                <button
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  onClick={() => setOpenId(open ? null : o.id)}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold"><CopyOrderId value={o.publicOrderId} /></p>
                    <p className="text-xs text-muted">{o.customerName} · {formatDate(o.createdAt)}</p>
                  </div>
                  <OrderStatusRow order={o} />
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{money(o.totalAmount)}</span>
                    <span className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>
                {open && <div className="mt-4"><OrderDetail order={o} onUpdated={replace} /></div>}
              </div>
            )
          })}
        </div>
      )}
    </ConsoleShell>
  )
}
