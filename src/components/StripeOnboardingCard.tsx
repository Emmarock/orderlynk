import { useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { ConnectStatus } from '../lib/types'
import { ErrorNote, Spinner } from './ui'

/**
 * Vendor payments onboarding via Stripe Connect. Shows the current state and
 * redirects the vendor to Stripe's hosted onboarding. Once `canReceiveFunds` is
 * true, the vendor's orders are paid by card and funds settle to their account.
 */
export default function StripeOnboardingCard({ refreshOnMount = false }: { refreshOnMount?: boolean }) {
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // `live=true` forces a re-sync from Stripe (POST /refresh); otherwise read the
  // cached state (GET /status), which is cheap and avoids a Stripe API call.
  const load = (live: boolean) => {
    setLoading(true)
    setError(null)
    ;(live ? api.vendorConnectRefresh() : api.vendorConnectStatus())
      .then(setStatus)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load payment status'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(refreshOnMount)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startOnboarding = async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await api.vendorConnectOnboard()
      window.location.href = res.url // hand off to Stripe hosted onboarding
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not start onboarding. Please try again.')
      setStarting(false)
    }
  }

  const active = status?.canReceiveFunds === true
  const started = !!status?.accountId
  const detailsDone = status?.detailsSubmitted === true

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Accept card payments</h2>
          <p className="mt-1 text-sm text-muted">
            Onboard with Stripe to accept card payments from customers. Your sales settle directly to your
            bank — MyOrderLynk takes its fee automatically.
          </p>
        </div>
        <StatusBadge active={active} started={started} detailsDone={detailsDone} />
      </div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Spinner /> Checking status…</p>
      ) : active ? (
        <p className="mt-4 text-sm text-forest">
          ✓ Your account is fully set up. Customers can pay you by card at checkout.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {started && !detailsDone && (
            <p className="text-sm text-muted">Your onboarding is incomplete — continue to finish verification.</p>
          )}
          {started && detailsDone && !active && (
            <p className="text-sm text-muted">Details submitted — Stripe is verifying your account. Check back shortly.</p>
          )}
          <button onClick={startOnboarding} disabled={starting} className="btn-primary">
            {starting ? <Spinner /> : started ? 'Continue onboarding' : 'Set up payments with Stripe'}
          </button>
          {started && (
            <button onClick={() => load(true)} className="btn-ghost ml-2">Refresh status</button>
          )}
        </div>
      )}
    </section>
  )
}

function StatusBadge({ active, started, detailsDone }: { active: boolean; started: boolean; detailsDone: boolean }) {
  const { label, cls } = active
    ? { label: 'Active', cls: 'bg-forest/10 text-forest' }
    : started
      ? { label: detailsDone ? 'Verifying' : 'Incomplete', cls: 'bg-amber-100 text-amber-700' }
      : { label: 'Not set up', cls: 'bg-line text-muted' }
  return <span className={`chip whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${cls}`}>{label}</span>
}