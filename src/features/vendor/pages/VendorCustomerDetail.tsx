import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import type { Order } from '@/shared/lib/types'
import { formatDate, money } from '@/shared/lib/format'
import { ConsoleShell, StatCard, VENDOR_TABS } from '@/shared/components/Console'
import { OrderStatusRow } from '@/features/order/components/OrderViews'
import { EmptyState, PageLoader } from '@/shared/components/ui'

const digits = (s?: string) => (s ?? '').replace(/\D/g, '')

export default function VendorCustomerDetail() {
  const { phone = '' } = useParams()
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    api.vendorOrders().then(setOrders).catch(() => setOrders([]))
  }, [])

  // Match this customer by normalized phone (the same identity the customer list dedupes on).
  const target = digits(decodeURIComponent(phone))
  const mine = useMemo(
    () => (orders ?? []).filter((o) => digits(o.customerPhone) === target),
    [orders, target],
  )

  if (orders === null) return <PageLoader />

  if (mine.length === 0) {
    return (
      <ConsoleShell title="Customer" subtitle="Customer details" tabs={VENDOR_TABS}>
        <EmptyState
          title="Customer not found"
          hint="No orders match this customer."
          action={<Link to="/vendor/manage/customers" className="btn-primary">Back to customers</Link>}
        />
      </ConsoleShell>
    )
  }

  // Orders arrive newest-first, so the first one carries the latest contact + address.
  const latest = mine[0]
  const totalSpent = mine.reduce((n, o) => n + o.totalAmount, 0)
  const addressLines = [
    [latest.customerHouseNumber, latest.customerStreet].filter(Boolean).join(' '),
    [latest.customerCity, latest.customerPostcode].filter(Boolean).join(' '),
    latest.customerCountry,
  ].filter((l) => l && l.trim())

  return (
    <ConsoleShell
      title={latest.customerName}
      subtitle="Customer details"
      tabs={VENDOR_TABS}
      actions={<Link to="/vendor/manage/customers" className="btn-ghost">← All customers</Link>}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Orders" value={String(mine.length)} />
        <StatCard label="Total spent" value={money(totalSpent)} />
        <StatCard label="Last order" value={formatDate(latest.createdAt)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="card h-fit p-6">
          <h2 className="font-display text-lg font-semibold">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-xs uppercase tracking-wider text-muted">Phone</dt><dd>{latest.customerPhone}</dd></div>
            {latest.customerEmail && (
              <div><dt className="text-xs uppercase tracking-wider text-muted">Email</dt><dd>{latest.customerEmail}</dd></div>
            )}
            {addressLines.length > 0 && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">Delivery address</dt>
                <dd><address className="not-italic">{addressLines.map((l, i) => <div key={i}>{l}</div>)}</address></dd>
              </div>
            )}
          </dl>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Order history
          </div>
          <div className="divide-y divide-line">
            {mine.map((o) => (
              <Link
                key={o.id}
                to={`/vendor/manage/orders/${o.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sand/40"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{o.publicOrderId}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt)}</p>
                </div>
                <OrderStatusRow order={o} />
                <span className="font-mono text-sm font-semibold">{money(o.totalAmount)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ConsoleShell>
  )
}