import { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { stripePromise } from '../lib/stripe'
import { ErrorNote, Spinner } from './ui'

/**
 * Stripe card payment for a booking deposit or balance. Wraps the Payment Element in
 * <Elements> with the booking's client secret. On success the payment-service webhook
 * advances the booking server-side; this just confirms the charge and calls onPaid.
 */
export function BookingPayment({
  clientSecret,
  amountLabel,
  onPaid,
}: {
  clientSecret: string
  amountLabel: string
  onPaid: () => void
}) {
  if (!stripePromise) {
    return <ErrorNote message="Card payments aren’t configured. Please contact the provider to pay another way." />
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <PayForm amountLabel={amountLabel} onPaid={onPaid} />
    </Elements>
  )
}

function PayForm({ amountLabel, onPaid }: { amountLabel: string; onPaid: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setError(null)
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/bookings/track` },
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
    <form onSubmit={pay} className="space-y-4">
      <PaymentElement />
      {error && <ErrorNote message={error} />}
      <button type="submit" disabled={!stripe || busy} className="btn-primary w-full">
        {busy ? <Spinner /> : `Pay ${amountLabel}`}
      </button>
      <p className="text-center text-xs text-muted">Secured by Stripe</p>
    </form>
  )
}
