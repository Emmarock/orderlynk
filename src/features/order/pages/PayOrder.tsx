import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { api, apiMessage } from '@/shared/lib/api'
import { stripePromise } from '@/shared/lib/stripe'
import type { Order } from '@/shared/lib/types'
import { money } from '@/shared/lib/format'
import { ErrorNote, PageLoader, Spinner } from '@/shared/components/ui'

/**
 * Customer-facing "pay by card" page opened from a link the vendor shared (WhatsApp, Instagram, …).
 * The signed token in the URL resolves to the order + a Stripe client secret; the customer pays by
 * card with no account. Mirrors the storefront checkout's payment phase.
 */
export default function PayOrder() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('This payment link is invalid or incomplete.')
      setLoading(false)
      return
    }
    api
      .payByToken(token)
      .then((o) => {
        setOrder(o)
        if (o.paymentStatus === 'PAID') setPaid(true)
      })
      .catch((e) => setError(apiMessage(e, 'This payment link is invalid or has expired.')))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <ErrorNote message={error} />
      </div>
    )
  }

  if (!order) return null

  const amount = money(order.totalAmount, order.currency)

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <p className="eyebrow">{order.vendorName}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
        {paid ? 'Payment received' : 'Complete your payment'}
      </h1>
      <p className="mt-1 text-muted">Order {order.publicOrderId}</p>

      <div className="card mt-6 p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Amount due</span>
          <span className="font-mono text-2xl font-semibold">{amount}</span>
        </div>

        {paid ? (
          <div className="mt-6 rounded-xl border border-forest/30 bg-forest/5 p-5 text-center">
            <p className="text-2xl">✓</p>
            <p className="mt-1 font-semibold text-forest">This order is paid.</p>
            <p className="mt-1 text-sm text-muted">Thank you! {order.vendorName} has been notified.</p>
          </div>
        ) : !order.clientSecret ? (
          <div className="mt-6">
            <ErrorNote message="Card payment isn't available for this order right now. Please contact the seller." />
          </div>
        ) : !stripePromise ? (
          <div className="mt-6">
            <ErrorNote message="Card payments are not configured (missing VITE_STRIPE_PUBLISHABLE_KEY)." />
          </div>
        ) : (
          <div className="mt-6">
            <Elements stripe={stripePromise} options={{ clientSecret: order.clientSecret, appearance: { theme: 'stripe' } }}>
              <PayForm token={token} amountLabel={amount} onPaid={() => setPaid(true)} />
            </Elements>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted">Payments are processed securely by Stripe.</p>
    </div>
  )
}

/** Stripe Payment Element + confirm. Must render inside <Elements>. */
function PayForm({ token, amountLabel, onPaid }: { token: string; amountLabel: string; onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setError(null)
    const { error: err } = await stripe.confirmPayment({
      elements,
      // Card confirms inline; methods that need a redirect come back to this same pay link.
      confirmParams: { return_url: `${window.location.origin}/pay?token=${encodeURIComponent(token)}` },
      redirect: 'if_required',
    })
    if (err) {
      setError(err.message ?? 'Payment failed. Please try another card.')
      setBusy(false)
      return
    }
    onPaid()
  }

  return (
    <form onSubmit={pay} className="space-y-5">
      <PaymentElement />
      {error && <ErrorNote message={error} />}
      <button type="submit" disabled={!stripe || busy} className="btn-primary w-full">
        {busy ? <Spinner /> : `Pay ${amountLabel}`}
      </button>
    </form>
  )
}
