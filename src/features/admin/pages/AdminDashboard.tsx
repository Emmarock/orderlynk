import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import type { Order, Vendor } from '@/shared/lib/types'
import { money, titleCase } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell, StatCard } from '@/shared/components/Console'
import { CopyOrderId, PageLoader } from '@/shared/components/ui'
import { OrderStatusRow } from '@/features/order/components/OrderViews'

export default function AdminDashboard() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null)
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    api.adminVendors().then(setVendors).catch(() => setVendors([]))
    api.adminOrders().then(setOrders).catch(() => setOrders([]))
  }, [])

  if (vendors === null || orders === null) return <PageLoader />

  const pending = vendors.filter((v) => ['SUBMITTED', 'UNDER_REVIEW'].includes(v.verificationStatus))
  const paid = orders.filter((o) => o.paymentStatus === 'PAID')
  const gross = paid.reduce((n, o) => n + o.totalAmount, 0)
  const platformRevenue = paid.reduce((n, o) => n + o.platformRevenue, 0)

  return (
    <ConsoleShell title="Platform overview" subtitle="Vendors, orders and revenue at a glance" tabs={ADMIN_TABS}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vendors" value={String(vendors.length)} hint={`${vendors.filter((v) => v.active).length} active`} />
        <StatCard label="Pending approval" value={String(pending.length)} hint="Awaiting review" />
        <StatCard label="Orders" value={String(orders.length)} hint={`${paid.length} paid`} />
        <StatCard label="Gross / platform rev." value={money(gross)} hint={`${money(platformRevenue)} platform`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Awaiting approval</h2>
            <Link to="/admin/vendors" className="link-underline text-sm">Manage</Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {pending.length === 0 && <p className="py-6 text-sm text-muted">No vendors awaiting review.</p>}
            {pending.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{v.businessName}</p>
                  <p className="text-xs text-muted">{v.city ?? '—'} · {titleCase(v.verificationStatus)}</p>
                </div>
                <button className="btn-forest px-4 py-1.5" onClick={() => api.approveVendor(v.id).then(() => setVendors((p) => p!.map((x) => (x.id === v.id ? { ...x, verificationStatus: 'APPROVED', active: true } : x))))}>
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="link-underline text-sm">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold"><CopyOrderId value={o.publicOrderId} /></p>
                  <p className="truncate text-xs text-muted">{o.vendorName}</p>
                </div>
                <OrderStatusRow order={o} />
                <span className="font-mono text-sm font-semibold">{money(o.totalAmount)}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="py-6 text-sm text-muted">No orders yet.</p>}
          </div>
        </div>
      </div>
    </ConsoleShell>
  )
}
