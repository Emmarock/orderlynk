import { useEffect, useState } from 'react'
import { api, apiMessage } from '@/shared/lib/api'
import type { SubscriptionPlanInfo, VendorPlan } from '@/shared/lib/types'
import { money } from '@/shared/lib/format'
import { ErrorNote, Spinner } from '@/shared/components/ui'

/**
 * Self-serve subscription tier picker. Lower commission costs more per month; a paid tier requires a
 * card on file (the monthly fee is billed to it). Switching materializes the tier's commission rate.
 */
export default function PlanCard() {
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([])
  const [current, setCurrent] = useState<VendorPlan | null>(null)
  const [busy, setBusy] = useState<VendorPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([api.vendorPlans(), api.myVendor()])
      .then(([list, vendor]) => {
        setPlans(list)
        setCurrent(vendor.plan ?? null)
      })
      .catch(() => setError('Could not load plans'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const choose = async (plan: VendorPlan) => {
    setBusy(plan)
    setError(null)
    try {
      const vendor = await api.vendorChangePlan(plan)
      setCurrent(vendor.plan ?? plan)
    } catch (e) {
      setError(apiMessage(e, 'Could not change plan. A paid plan needs a card on file.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="card p-6">
      <h2 className="font-display text-xl font-semibold">Subscription plan</h2>
      <p className="mt-1 text-sm text-muted">
        A higher tier lowers your commission for a monthly fee, billed to your card on file.
      </p>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted"><Spinner /> Loading plans…</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.plan === current
            return (
              <div
                key={p.plan}
                className={`rounded-xl border p-4 ${isCurrent ? 'border-forest bg-forest/5' : 'border-line'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold">{p.displayName}</h3>
                  {isCurrent && <span className="chip rounded-full bg-forest/10 px-2 py-0.5 text-xs text-forest">Current</span>}
                </div>
                <p className="mt-2 font-mono text-lg">
                  {p.monthlyFee > 0 ? `${money(p.monthlyFee, p.currency)}/mo` : 'Free'}
                </p>
                <p className="text-sm text-muted">{(p.commissionRate * 100).toFixed(1)}% commission</p>
                <button
                  onClick={() => choose(p.plan)}
                  disabled={isCurrent || busy !== null}
                  className={`mt-3 w-full ${isCurrent ? 'btn-ghost' : 'btn-primary'}`}
                >
                  {busy === p.plan ? <Spinner /> : isCurrent ? 'Active' : 'Switch'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
