import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { Order, PaymentStatus } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { formatDate, money, titleCase } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { OrderStatusRow } from '@/features/order/components/OrderViews'
import { OrderDetailPanel } from '@/features/order/components/OrderDetailPanel'
import ChatOrderPaste from '@/features/order/components/ChatOrderPaste'
import { CopyOrderId, EmptyState, LoadMore, PageLoader } from '@/shared/components/ui'

const PAYMENT_FILTERS: (PaymentStatus | 'ALL')[] = ['ALL', 'PENDING', 'PAID']

export default function VendorOrders() {
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  // Chat-order import is an admin-granted, per-vendor capability — only surface it when enabled.
  const [chatOrders, setChatOrders] = useState(false)
  useEffect(() => {
    api.myVendor().then((v) => setChatOrders(v.chatOrderEnabled)).catch(() => setChatOrders(false))
  }, [])

  // Refetch from the server whenever the date range changes (server filters by created-at).
  const { items, total, loading, loadingMore, hasNext, loadMore, setItems } = usePagedList<Order>(
    (page, size) => api.vendorOrders(from || undefined, to || undefined, page, size),
    [from, to],
  )

  const replace = (updated: Order) =>
    setItems((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))

  if (loading) return <PageLoader />
  // Payment-status filter stays client-side, over the orders loaded so far.
  const filtered = filter === 'ALL' ? items : items.filter((o) => o.paymentStatus === filter)

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
      {chatOrders && (
        <div className="mb-5">
          <ChatOrderPaste onCreated={(o) => setItems((prev) => [o, ...prev])} />
        </div>
      )}
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
                {open && <div className="mt-4"><OrderDetailPanel order={o} onUpdated={replace} /></div>}
              </div>
            )
          })}
        </div>
      )}
      <LoadMore shown={items.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />
    </ConsoleShell>
  )
}