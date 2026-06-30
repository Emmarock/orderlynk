import { useEffect, useState, type FormEvent } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { api, ApiError } from '@/shared/lib/api'
import { stripePromise } from '@/shared/lib/stripe'
import type { BillingStatus, CardSetupResult } from '@/shared/lib/types'
import { ErrorNote, Spinner } from '@/shared/components/ui'

/**
 * Vendor card on file. Required to be charged for paid-plan subscriptions, featured placement and
 * instant-payout fees — these are pulled from the vendor's card (the platform never holds vendor funds
 * under the destination-charge model). Reuses the same Stripe Elements setup as customer checkout, but
 * with a SetupIntent (save a card) instead of a PaymentIntent (charge a card).
 */
export default function BillingCard() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setup, setSetup] = useState<CardSetupResult | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = () => {
    setLoading(true)
    setError(null)
    api
      .vendorBillingStatus()
      .then(setStatus)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load billing status'))
      .finally(() => setLoading(false))
  }

  useEffect(loadStatus, [])

  const startCardSetup = async () => {
    setStarting(true)
    setError(null)
    try {
      setSetup(await api.vendorStartCardSetup())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start card setup. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  const onSaved = () => {
    setSetup(null)
    loadStatus()
  }

  const hasCard = status?.hasPaymentMethod === true

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Billing card</h2>
          <p className="mt-1 text-sm text-muted">
            Save a card to pay for your plan, featured placement and instant payouts. This is separate
            from how you get paid — your sales still settle to your bank via Stripe.
          </p>
        </div>
        <StatusBadge hasCard={hasCard} />
      </div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Spinner /> Checking…</p>
      ) : setup ? (
        !stripePromise ? (
          <div className="mt-4"><ErrorNote message="Card payments are not configured (missing VITE_STRIPE_PUBLISHABLE_KEY)." /></div>
        ) : (
          <div className="mt-5">
            <Elements stripe={stripePromise} options={{ clientSecret: setup.clientSecret, appearance: { theme: 'stripe' } }}>
              <CardForm setupIntentId={setup.setupIntentId} onSaved={onSaved} onCancel={() => setSetup(null)} />
            </Elements>
          </div>
        )
      ) : hasCard ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-forest">✓ A card is on file. Platform fees are charged to it automatically.</p>
          <button onClick={startCardSetup} disabled={starting} className="btn-ghost">
            {starting ? <Spinner /> : 'Replace card'}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <button onClick={startCardSetup} disabled={starting} className="btn-primary">
            {starting ? <Spinner /> : 'Add a card'}
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">Cards are stored securely by Stripe — we never see the number.</p>
    </section>
  )
}

/** Stripe Payment Element bound to a SetupIntent; confirms (saves) the card. Must render inside <Elements>. */
function CardForm({
  setupIntentId,
  onSaved,
  onCancel,
}: {
  setupIntentId: string
  onSaved: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setError(null)
    const { error: err } = await stripe.confirmSetup({ elements, redirect: 'if_required' })
    if (err) {
      setError(err.message ?? 'Could not save the card. Please try another.')
      setBusy(false)
      return
    }
    try {
      await api.vendorConfirmCard(setupIntentId)
      onSaved()
    } catch {
      setError('The card was saved but confirming it failed. Please refresh and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <PaymentElement />
      {error && <ErrorNote message={error} />}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!stripe || busy} className="btn-primary">
          {busy ? <Spinner /> : 'Save card'}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}

function StatusBadge({ hasCard }: { hasCard: boolean }) {
  const { label, cls } = hasCard
    ? { label: 'On file', cls: 'bg-forest/10 text-forest' }
    : { label: 'No card', cls: 'bg-line text-muted' }
  return <span className={`chip whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{label}</span>
}
