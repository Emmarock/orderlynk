import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiMessage } from '@/shared/lib/api'
import type { AdminSummary, Order } from '@/shared/lib/types'
import { money, titleCase } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell, StatCard } from '@/shared/components/Console'
import { CopyOrderId, ErrorNote, PageLoader } from '@/shared/components/ui'
import { OrderStatusRow } from '@/features/order/components/OrderViews'

export default function AdminDashboard() {
  // Server-side platform aggregates + the approval-queue preview (not first-page-only derivations).
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  // Recent-orders list only — its newest-first first page is correct for the preview.
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadSummary = () => api.adminSummary().then(setSummary).catch(() => setSummary(null))

  const approve = async (id: string) => {
    setBusyId(id); setError(null)
    try {
      await api.approveVendor(id)
      await loadSummary()
    } catch (e) {
      // Show the backend guard (unverified email / WhatsApp) rather than doing nothing.
      setError(apiMessage(e, 'Could not approve vendor'))
    } finally {
      setBusyId(null)
    }
  }

  useEffect(() => {
    loadSummary()
    api.adminOrders().then((p) => setOrders(p.content)).catch(() => setOrders([]))
  }, [])

  if (summary === null) return <PageLoader />

  const pending = summary.pendingVendors

  return (
    <ConsoleShell title="Platform overview" subtitle="Vendors, orders and revenue at a glance" tabs={ADMIN_TABS}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vendors" value={String(summary.vendorCount)} hint={`${summary.activeVendorCount} active`} />
        <StatCard label="Pending approval" value={String(summary.pendingCount)} hint="Awaiting review" />
        <StatCard label="Orders" value={String(summary.orderCount)} hint={`${summary.paidOrderCount} paid`} />
        <StatCard label="Gross / platform rev." value={money(summary.grossRevenue)} hint={`${money(summary.platformRevenue)} platform`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Awaiting approval</h2>
            <Link to="/admin/vendors" className="link-underline text-sm">Manage</Link>
          </div>
          {error && <div className="mt-4"><ErrorNote message={error} /></div>}
          <div className="mt-4 divide-y divide-line">
            {pending.length === 0 && <p className="py-6 text-sm text-muted">No vendors awaiting review.</p>}
            {pending.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{v.businessName}</p>
                  <p className="text-xs text-muted">{v.city ?? '—'} · {titleCase(v.verificationStatus)}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={`chip ${v.emailVerified ? 'bg-forest/12 text-forest' : 'bg-clay/12 text-clay-dark'}`}>
                      {v.emailVerified ? 'Email ✓' : 'Email ✗'}
                    </span>
                    <span className={`chip ${v.whatsappVerified ? 'bg-forest/12 text-forest' : 'bg-clay/12 text-clay-dark'}`}>
                      {v.whatsappVerified ? 'WhatsApp ✓' : 'WhatsApp ✗'}
                    </span>
                  </div>
                </div>
                <button className="btn-forest px-4 py-1.5" disabled={busyId === v.id} onClick={() => approve(v.id)}>
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
