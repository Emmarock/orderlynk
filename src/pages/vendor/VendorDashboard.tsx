import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import type { Order, Product, ShareLink, Vendor, VendorAnalytics } from '../../lib/types'
import { money, titleCase } from '../../lib/format'
import { ConsoleShell, StatCard, VENDOR_TABS } from '../../components/Console'
import { OrderStatusRow } from '../../components/OrderViews'
import { CopyOrderId, PageLoader, Rail } from '../../components/ui'

const SOURCES = ['whatsapp', 'instagram', 'marketplace', 'vendor_link']

function ShareLinkPanel() {
  const [source, setSource] = useState('whatsapp')
  const [campaign, setCampaign] = useState('')
  const [link, setLink] = useState<ShareLink | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.shareLink(source, campaign || undefined).then(setLink).catch(() => setLink(null))
  }, [source, campaign])

  return (
    <div className="card overflow-hidden">
      <Rail />
      <div className="p-6">
        <h2 className="font-display text-xl font-semibold">Share your storefront</h2>
        <p className="mt-1 text-sm text-muted">
          Post this trackable link in WhatsApp groups, your Instagram bio or stories.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Source channel</label>
            <select className="field" value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Campaign (optional)</label>
            <input className="field" placeholder="june-batch" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>
        </div>
        {link && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-sand p-3">
            <code className="flex-1 truncate font-mono text-sm">{link.url}</code>
            <button
              className="btn-ghost px-3 py-1.5"
              onClick={() => {
                navigator.clipboard.writeText(link.url)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
            <a href={link.whatsappShareUrl} target="_blank" rel="noreferrer" className="btn-forest px-3 py-1.5">
              Share
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VendorDashboard() {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    api.myVendor().then(setVendor).catch(() => setVendor(null))
    api.vendorOrders().then(setOrders).catch(() => setOrders([]))
    api.vendorAnalytics().then(setAnalytics).catch(() => setAnalytics(null))
    api.vendorProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  if (!vendor || orders === null) return <PageLoader />

  const paid = orders.filter((o) => o.paymentStatus === 'PAID')
  const openFulfillment = orders.filter(
    (o) => !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(o.fulfillmentStatus),
  )
  const gross = paid.reduce((n, o) => n + o.totalAmount, 0)
  const lowStock = products.filter((p) => p.lowStock)

  return (
    <ConsoleShell
      title={vendor.businessName}
      subtitle={`${titleCase(vendor.verificationStatus)} · /vendor/${vendor.storeSlug}`}
      tabs={VENDOR_TABS}
      actions={
        <Link to={`/vendor/${vendor.storeSlug}`} className="btn-ghost" target="_blank">
          View storefront ↗
        </Link>
      }
    >
      {vendor.verificationStatus !== 'APPROVED' && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-[#8a5d0c]">
          Your store is <strong>{titleCase(vendor.verificationStatus)}</strong>. It becomes public and can
          take orders once an admin approves it.
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="mb-6 rounded-xl border border-clay/30 bg-clay/8 px-4 py-3 text-sm text-clay-dark">
          <strong>{lowStock.length} product{lowStock.length === 1 ? '' : 's'} low on stock:</strong>{' '}
          {lowStock.slice(0, 5).map((p) => `${p.name} (${p.quantityAvailable})`).join(', ')}
          {lowStock.length > 5 ? '…' : ''}{' '}
          <Link to="/vendor/manage/products" className="link-underline">Manage</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total orders" value={String(orders.length)} />
        <StatCard label="Paid orders" value={String(paid.length)} />
        <StatCard label="Open fulfillment" value={String(openFulfillment.length)} hint="Need action" />
        <StatCard label="Gross (paid)" value={money(gross)} />
        <StatCard label="Low stock" value={String(lowStock.length)} hint={lowStock.length ? 'Restock soon' : undefined} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent orders</h2>
            <Link to="/vendor/manage/orders" className="link-underline text-sm">View all</Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold"><CopyOrderId value={o.publicOrderId} /></p>
                  <p className="truncate text-xs text-muted">{o.customerName}</p>
                </div>
                <OrderStatusRow order={o} />
                <span className="font-mono text-sm font-semibold">{money(o.totalAmount)}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="py-6 text-sm text-muted">No orders yet.</p>}
          </div>
        </div>

        <ShareLinkPanel />
      </div>

      {/* Analytics: top customers & top products */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Top customers</h2>
            <Link to="/vendor/manage/customers" className="link-underline text-sm">All customers</Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {analytics?.topCustomers.map((c, i) => (
              <div key={`${c.phone}-${i}`} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-clay/12 font-mono text-xs font-semibold text-clay">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.orderCount} order{c.orderCount === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold">{money(c.totalSpent)}</span>
              </div>
            ))}
            {(!analytics || analytics.topCustomers.length === 0) && (
              <p className="py-6 text-sm text-muted">No customers yet.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold">Top products</h2>
          <div className="mt-4 divide-y divide-line">
            {analytics?.topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest/10 font-mono text-xs font-semibold text-forest">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.productName}</p>
                    <p className="truncate text-xs text-muted">{p.quantitySold} sold</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold">{money(p.revenue)}</span>
              </div>
            ))}
            {(!analytics || analytics.topProducts.length === 0) && (
              <p className="py-6 text-sm text-muted">No sales yet.</p>
            )}
          </div>
        </div>
      </div>
    </ConsoleShell>
  )
}
