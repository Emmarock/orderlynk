import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Order } from '../../lib/types'
import { formatDate, money } from '../../lib/format'
import { ADMIN_TABS, ConsoleShell } from '../../components/Console'
import { OrderFeeBreakdown, OrderItems, OrderStatusRow, OrderTimeline } from '../../components/OrderViews'
import { EmptyState, PageLoader, Spinner } from '../../components/ui'

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.adminOrders().then(setOrders).catch(() => setOrders([]))
  }, [])

  const markPaid = async (order: Order) => {
    setBusy(true)
    try {
      const updated = await api.adminUpdatePayment(order.id, { status: 'PAID', method: 'OTHER' })
      setOrders((prev) => prev?.map((o) => (o.id === updated.id ? updated : o)) ?? null)
    } finally {
      setBusy(false)
    }
  }

  if (orders === null) return <PageLoader />

  return (
    <ConsoleShell title="All orders" subtitle="Platform-wide order oversight" tabs={ADMIN_TABS}>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const open = openId === o.id
            return (
              <div key={o.id} className="card p-5">
                <button
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  onClick={() => setOpenId(open ? null : o.id)}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{o.publicOrderId}</p>
                    <p className="text-xs text-muted">
                      {o.vendorName} · {o.customerName} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <OrderStatusRow order={o} />
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{money(o.totalAmount)}</span>
                    <span className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>
                {open && (
                  <div className="mt-4 grid gap-6 border-t border-line pt-5 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Items</h4>
                      <OrderItems order={o} />
                      <div className="mt-3"><OrderFeeBreakdown order={o} /></div>
                      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <Ledger label="Vendor payable" value={money(o.vendorPayable)} />
                        <Ledger label="Logistics payable" value={money(o.logisticsPayable)} />
                        <Ledger label="Platform revenue" value={money(o.platformRevenue)} />
                        <Ledger label="Refunded" value={money(o.refundedAmount ?? 0)} />
                      </dl>
                    </div>
                    <div>
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Progress</h4>
                      <OrderTimeline order={o} />
                      {o.paymentStatus !== 'PAID' && (
                        <button className="btn-forest mt-5 w-full" disabled={busy} onClick={() => markPaid(o)}>
                          {busy ? <Spinner /> : 'Mark payment received'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ConsoleShell>
  )
}

function Ledger({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sand p-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono font-semibold">{value}</dd>
    </div>
  )
}
