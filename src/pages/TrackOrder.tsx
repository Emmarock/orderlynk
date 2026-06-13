import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Order } from '../lib/types'
import { OrderFeeBreakdown, OrderItems, OrderStatusRow, OrderTimeline, PaymentInstructionsCard } from '../components/OrderViews'
import { CopyOrderId, ErrorNote, Spinner } from '../components/ui'
import { formatDate } from '../lib/format'

export default function TrackOrder() {
  const [params] = useSearchParams()
  const [orderId, setOrderId] = useState(() => params.get('orderId') ?? '')
  const [contact, setContact] = useState(() => params.get('contact') ?? '')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolve = async (fetcher: () => Promise<Order>): Promise<Order | null> => {
    setLoading(true)
    setError(null)
    setOrder(null)
    try {
      const result = await fetcher()
      setOrder(result)
      return result
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 404 || err.status === 400)
          ? 'No matching order. Double-check your details, or use the link from your confirmation message.'
          : 'Something went wrong. Please try again.',
      )
      return null
    } finally {
      setLoading(false)
    }
  }

  const runTrack = (oid: string, c: string) => resolve(() => api.track(oid.trim(), c.trim()))

  // Auto-resolve when arriving from an order link: a signed ?token=… (no PII in the URL),
  // or the legacy ?orderId=&contact= form.
  const autoRan = useRef(false)
  useEffect(() => {
    if (autoRan.current) return
    const token = params.get('token')
    const oid = params.get('orderId')
    const c = params.get('contact')
    if (token) {
      autoRan.current = true
      // Reflect the decoded token back into the form fields so the customer
      // sees which order/contact resolved, and can re-track manually if needed.
      void resolve(() => api.trackByToken(token)).then((o) => {
        if (!o) return
        setOrderId(o.publicOrderId)
        setContact(o.customerPhone || o.customerEmail || '')
      })
    } else if (oid && c) {
      autoRan.current = true
      void runTrack(oid, c)
    }
  }, [params])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    void runTrack(orderId, contact)
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
        <button className="btn-primary h-[42px]" disabled={loading || !orderId.trim() || !contact.trim()}>
          {loading ? <Spinner /> : 'Track'}
        </button>
      </form>

      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      {order && (
        <div className="mt-8 space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xl font-semibold"><CopyOrderId value={order.publicOrderId} /></p>
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
                <PaymentInstructionsCard order={order} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
