import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import type { BatchOrder, Booking, Order, ShipmentRequest } from '@/shared/lib/types'
import { useAuth } from '@/shared/context/AuthContext'
import { cargoTone, formatDate, money, titleCase } from '@/shared/lib/format'
import { usePagedList } from '@/shared/lib/usePagedList'
import { OrderStatusRow } from '@/features/order/components/OrderViews'
import { BookingBadge, EmptyState, ErrorNote, LoadMore, PageLoader, PaymentBadge, Rail } from '@/shared/components/ui'

/**
 * Customer hub: a single place to see everything they've transacted on OrderLynk — product orders,
 * service bookings, batch/cargo orders and shipment requests — each sourced from its own paginated
 * `…/mine` endpoint and shown with live status. Account settings (profile, password, addresses) stay
 * on /account.
 */
export default function CustomerDashboard() {
  const { user } = useAuth()
  const orders = usePagedList<Order>((p, s) => api.myOrders(p, s), [])
  const bookings = usePagedList<Booking>((p, s) => api.myBookings(p, s), [])
  const batchOrders = usePagedList<BatchOrder>((p, s) => api.myBatchOrders(p, s), [])
  const shipments = usePagedList<ShipmentRequest>((p, s) => api.myShipmentRequests(p, s), [])

  const anyLoading = orders.loading || bookings.loading || batchOrders.loading || shipments.loading
  const totalAll = orders.total + bookings.total + batchOrders.total + shipments.total
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
      <p className="mt-2 text-sm text-muted">
        Everything you've ordered on OrderLynk — orders, bookings, batches and shipments, all in one place.
      </p>

      {anyLoading && totalAll === 0 ? (
        <div className="mt-10"><PageLoader /></div>
      ) : totalAll === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing here yet"
            hint="When you place an order, book a service or send a shipment, it'll show up here."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link to="/" className="btn-primary">Browse marketplace</Link>
                <Link to="/services" className="btn-ghost">Book a service</Link>
                <Link to="/batches" className="btn-ghost">Batch &amp; cargo</Link>
              </div>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Orders" value={orders.total} />
            <StatCard label="Bookings" value={bookings.total} />
            <StatCard label="Batch orders" value={batchOrders.total} />
            <StatCard label="Shipments" value={shipments.total} />
          </div>

          <div className="mt-8 space-y-6">
            <Section title="Orders" subtitle="Products you've ordered from vendors." count={orders.total} error={orders.error}
              footer={<LoadMore shown={orders.items.length} total={orders.total} hasNext={orders.hasNext} loading={orders.loadingMore} onLoadMore={orders.loadMore} />}>
              {orders.items.map((o) => (
                <Row
                  key={o.id}
                  id={o.publicOrderId}
                  subtitle={`${o.vendorName} · ${formatDate(o.createdAt)}`}
                  badges={<OrderStatusRow order={o} />}
                  amount={money(o.totalAmount, o.currency)}
                  to={o.trackToken ? `/orders?token=${encodeURIComponent(o.trackToken)}` : '/track'}
                />
              ))}
            </Section>

            <Section title="Service bookings" subtitle="Appointments you've booked." count={bookings.total} error={bookings.error}
              footer={<LoadMore shown={bookings.items.length} total={bookings.total} hasNext={bookings.hasNext} loading={bookings.loadingMore} onLoadMore={bookings.loadMore} />}>
              {bookings.items.map((b) => (
                <Row
                  key={b.id}
                  id={b.publicBookingId}
                  subtitle={`${b.serviceName} · ${b.vendorName} · ${formatDate(b.appointmentStart)}`}
                  badges={<><BookingBadge status={b.status} /><PaymentBadge status={b.paymentStatus} /></>}
                  amount={money(b.totalAmount, b.currency)}
                />
              ))}
            </Section>

            <Section title="Batch & cargo orders" subtitle="Group-buy orders you've joined." count={batchOrders.total} error={batchOrders.error}
              footer={<LoadMore shown={batchOrders.items.length} total={batchOrders.total} hasNext={batchOrders.hasNext} loading={batchOrders.loadingMore} onLoadMore={batchOrders.loadMore} />}>
              {batchOrders.items.map((bo) => (
                <Row
                  key={bo.id}
                  id={bo.publicOrderId}
                  subtitle={`${bo.batchName} · ${bo.vendorName} · ${formatDate(bo.createdAt)}`}
                  badges={<><CargoBadge status={bo.status} /><PaymentBadge status={bo.paymentStatus} /></>}
                  amount={money(bo.totalAmount, bo.currency)}
                />
              ))}
            </Section>

            <Section title="Shipments" subtitle="Items you've sent via a cargo batch." count={shipments.total} error={shipments.error}
              footer={<LoadMore shown={shipments.items.length} total={shipments.total} hasNext={shipments.hasNext} loading={shipments.loadingMore} onLoadMore={shipments.loadMore} />}>
              {shipments.items.map((sr) => (
                <Row
                  key={sr.id}
                  id={sr.publicRequestId}
                  subtitle={`${sr.batchName} · ${sr.vendorName} · ${formatDate(sr.createdAt)}`}
                  badges={<><CargoBadge status={sr.status} /><PaymentBadge status={sr.paymentStatus} /></>}
                  amount={money(sr.totalCharge, sr.currency)}
                />
              ))}
            </Section>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  )
}

/** Batch/cargo status chip (no shared badge component exists for cargo statuses). */
function CargoBadge({ status }: { status: string }) {
  return <span className={`chip ${cargoTone(status)}`}>{titleCase(status)}</span>
}

/** A section card; renders nothing when the customer has none of this kind. */
function Section({
  title, subtitle, count, error, children, footer,
}: {
  title: string
  subtitle: string
  count: number
  error: string | null
  children: ReactNode
  footer: ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="card overflow-hidden">
      <Rail />
      <div className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <span className="chip bg-sand text-muted">{count}</span>
        </div>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        {error && <div className="mt-3"><ErrorNote message={error} /></div>}
        <div className="mt-4 divide-y divide-line">{children}</div>
        {footer}
      </div>
    </div>
  )
}

function Row({
  id, subtitle, badges, amount, to,
}: {
  id: string
  subtitle: string
  badges: ReactNode
  amount: string
  to?: string
}) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold">{id}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
      <span className="font-mono text-sm font-semibold">{amount}</span>
    </>
  )
  const cls = '-mx-2 flex flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-3'
  return to ? <Link to={to} className={`${cls} hover:bg-sand/50`}>{body}</Link> : <div className={cls}>{body}</div>
}
