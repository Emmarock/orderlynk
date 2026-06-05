import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Order } from '../lib/types'
import { OrderFeeBreakdown, OrderItems, OrderStatusRow, OrderTimeline } from '../components/OrderViews'
import { ErrorNote, Spinner } from '../components/ui'
import { formatDate } from '../lib/format'

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [contact, setContact] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      setOrder(await api.track(orderId.trim(), contact.trim()))
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? 'No order matches that ID and contact. Double-check and try again.'
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="eyebrow">Where is my order?</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Track your order</h1>
      <p className="mt-2 text-muted">
        Enter your order ID and the phone number or email you used at checkout.
      </p>

      <form onSubmit={submit} className="card mt-8 grid gap-4 p-6 sm:grid-cols-[1.2fr_1.2fr_auto] sm:items-end">
        <div>
          <label className="label">Order ID</label>
          <input
            className="field font-mono"
            placeholder="OB-260601-4821"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Phone or email</label>
          <input
            className="field"
            placeholder="+1 204 555 0000"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <button className="btn-primary h-[42px]" disabled={loading}>
          {loading ? <Spinner /> : 'Track'}
        </button>
      </form>

      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      {order && (
        <div className="mt-8 space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xl font-semibold">{order.publicOrderId}</p>
                <p className="text-sm text-muted">
                  {order.vendorName} · {formatDate(order.createdAt)}
                </p>
              </div>
              <OrderStatusRow order={order} />
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Progress</h3>
                <OrderTimeline order={order} />
              </div>
              <div className="space-y-5">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Items</h3>
                  <OrderItems order={order} />
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Payment</h3>
                  <OrderFeeBreakdown order={order} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
