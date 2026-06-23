import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Order } from '@/shared/lib/types'
import { OrderFeeBreakdown, OrderItems, OrderStatusRow, OrderTimeline } from '@/features/order/components/OrderViews'
import { CopyOrderId, EmptyState } from '@/shared/components/ui'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const location = useLocation()
  const state = location.state as { order?: Order; paid?: boolean } | null
  const order = state?.order
  // Trust the order's real status; the nav-state `paid` flag is only a hint from checkout.
  const paid = state?.paid === true || order?.paymentStatus === 'PAID'

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState
          title={`Order ${orderId}`}
          hint="Your order was placed. Use the tracking page with your order ID and phone or email to see live status."
          action={<Link to="/track" className="btn-primary">Track this order</Link>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-cream"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>

      <div className="mt-5 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {paid ? 'Payment received!' : 'Order placed!'}
        </h1>
        {paid && (
          <span className="mt-3 inline-block rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
            ✓ Card payment confirmed
          </span>
        )}
        <p className="mt-2 text-muted">
          Thank you, {order.customerName.split(' ')[0]}. {order.vendorName} has received your order.
        </p>
        <p className="mt-4 inline-block rounded-full bg-cream px-5 py-2 font-mono text-lg font-semibold">
          <CopyOrderId value={order.publicOrderId} />
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-xl font-semibold">Status</h2>
          <div className="mt-3"><OrderStatusRow order={order} /></div>
          <div className="mt-6"><OrderTimeline order={order} /></div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold">Items</h2>
            <div className="mt-3"><OrderItems order={order} /></div>
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold">Payment</h2>
            <div className="mt-3"><OrderFeeBreakdown order={order} /></div>
            <p className="mt-4 rounded-xl bg-sand p-3 text-xs text-muted">
              {paid
                ? "Your payment is complete. You'll be notified when your order is ready."
                : `Payment is pending. ${order.vendorName} will confirm your order once payment is received.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link to={order.trackToken ? `/orders?token=${encodeURIComponent(order.trackToken)}` : '/track'} className="btn-ghost">
          Track order
        </Link>
        <Link to="/" className="btn-primary">Continue shopping</Link>
      </div>
    </div>
  )
}
