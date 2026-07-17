import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import type { Order, Product, ShareLink, Vendor, VendorAnalytics } from '@/shared/lib/types'
import { money, titleCase } from '@/shared/lib/format'
import { ConsoleShell, StatCard, VENDOR_TABS } from '@/shared/components/Console'
import { OrderStatusRow } from '@/features/order/components/OrderViews'
import { CopyOrderId, PageLoader, Rail } from '@/shared/components/ui'
import FeaturedPromoCard from '@/features/vendor/components/FeaturedPromoCard'
import VendorVerificationCard from '@/features/vendor/components/VendorVerificationCard'

const SOURCES = ['whatsapp', 'tiktok', 'facebook', 'instagram', 'marketplace', 'vendor_link']

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
  const navigate = useNavigate()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  // Recent-orders list only — its newest-first first page is correct for the preview.
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null)
  // Low-stock products come from a dedicated, server-scoped endpoint (not the paginated product list).
  const [lowStock, setLowStock] = useState<Product[]>([])

  useEffect(() => {
    api.myVendor().then(setVendor).catch(() => setVendor(null))
    api.vendorOrders().then((p) => setOrders(p.content)).catch(() => setOrders([]))
    api.vendorAnalytics().then(setAnalytics).catch(() => setAnalytics(null))
    api.lowStockProducts().then(setLowStock).catch(() => setLowStock([]))
  }, [])

  if (!vendor || !analytics) return <PageLoader />

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
      {(vendor.emailVerified === false || !vendor.whatsappVerified) && (
        <div className="mb-6">
          <VendorVerificationCard vendor={vendor} onChange={setVendor} />
        </div>
      )}

      {vendor.verificationStatus !== 'APPROVED' && (
        <div className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          Your store is <strong>{titleCase(vendor.verificationStatus)}</strong>. It becomes public and can
          take orders once an admin approves it
          {vendor.emailVerified === false || !vendor.whatsappVerified
            ? ' — verify your email and WhatsApp number above first.'
            : '.'}
        </div>
      )}

      {vendor.addressShippable === false && (
        <div className="mb-6 rounded-xl border border-clay/30 bg-clay/8 px-4 py-3 text-sm text-clay-dark">
          <strong>Your pickup address is incomplete.</strong> Carriers can't rate shipments or sell labels
          until your business address has a street, city, postcode, country{' '}
          {vendor.country && /^(us|usa|ca|can|united states|canada)$/i.test(vendor.country) ? '& state/province ' : ''}
          on file.{' '}
          <Link to="/vendor/manage/settings" className="link-underline">Update your address</Link>.
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
        <StatCard label="Total orders" value={String(analytics.totalOrders)} />
        <StatCard label="Paid orders" value={String(analytics.paidOrders)} />
        <StatCard label="Open fulfillment" value={String(analytics.openFulfillmentOrders)} hint="Need action" />
        <StatCard label="Gross (paid)" value={money(analytics.grossRevenue)} />
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
              <div
                key={o.id}
                onClick={() => navigate(`/vendor/manage/orders/${o.id}`)}
                className="-mx-2 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-sand/50"
              >
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

      {/* Featured placement — promote the store at the top of the marketplace */}
      <div className="mt-6">
        <FeaturedPromoCard />
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
              <Link
                key={`${c.phone}-${i}`}
                to={`/vendor/manage/customers/${encodeURIComponent(c.phone)}`}
                className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-sand/50"
              >
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
              </Link>
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
