import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { SubscriptionInvoice, SubscriptionPlanInfo } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { formatDate, money } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell } from '@/shared/components/Console'
import { EmptyState, ErrorNote, LoadMore, PageLoader, Spinner } from '@/shared/components/ui'

const INVOICE_FILTERS = ['ALL', 'DUE', 'PAID', 'WAIVED', 'FAILED'] as const

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlanInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<(typeof INVOICE_FILTERS)[number]>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const loadPlans = () => api.adminPlans().then(setPlans).catch(() => setError('Could not load plans'))
  useEffect(() => { loadPlans() }, [])

  const invoices = usePagedList<SubscriptionInvoice>(
    (page, size) => api.adminInvoices(filter === 'ALL' ? undefined : filter, page, size),
    [filter],
  )

  const generate = async () => {
    setGenerating(true)
    try { await api.adminGenerateInvoices(); invoices.reload() } finally { setGenerating(false) }
  }

  const settle = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setBusyId(id)
    try { await fn(id); invoices.reload() } finally { setBusyId(null) }
  }

  return (
    <ConsoleShell title="Subscriptions" subtitle="Plan pricing and vendor subscription invoices" tabs={ADMIN_TABS}>
      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {/* Plan catalog */}
      <h2 className="mb-3 font-display text-lg font-semibold">Plan catalog</h2>
      {plans === null ? <PageLoader /> : (
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((p) => <PlanEditor key={p.plan} plan={p} onSaved={loadPlans} />)}
        </div>
      )}

      {/* Invoices */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Subscription invoices</h2>
        <div className="flex items-center gap-2">
          {INVOICE_FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className={`chip rounded-full px-3 py-1 text-xs ${filter === f ? 'bg-ink text-paper' : 'bg-ink/8 text-muted'}`}>{f}</button>
          ))}
          <button onClick={generate} disabled={generating} className="btn-ghost text-sm">
            {generating ? <Spinner /> : 'Generate this month'}
          </button>
        </div>
      </div>

      {invoices.loading ? <PageLoader /> : invoices.items.length === 0 ? (
        <EmptyState title="No invoices" hint="No subscription invoices match this filter." />
      ) : (
        <div className="mt-3 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Period</th>
                <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.items.map((i) => (
                <tr key={i.id} className="hover:bg-sand/40">
                  <td className="px-5 py-3 font-mono text-xs">{i.vendorId.slice(0, 8)}</td>
                  <td className="px-5 py-3">{i.plan}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(i.periodStart)} – {formatDate(i.periodEnd)}</td>
                  <td className="px-5 py-3 text-right font-mono">{money(i.amount, i.currency)}</td>
                  <td className="px-5 py-3"><StatusChip status={i.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {i.status === 'DUE' || i.status === 'FAILED' ? (
                      <div className="flex justify-end gap-2">
                        <button disabled={busyId === i.id} onClick={() => settle(i.id, (id) => api.adminMarkInvoicePaid(id))} className="btn-quiet text-xs">Mark paid</button>
                        <button disabled={busyId === i.id} onClick={() => settle(i.id, api.adminWaiveInvoice)} className="btn-quiet text-xs">Waive</button>
                      </div>
                    ) : <span className="text-xs text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <LoadMore shown={invoices.items.length} total={invoices.total} hasNext={invoices.hasNext} loading={invoices.loadingMore} onLoadMore={invoices.loadMore} />
        </div>
      )}
    </ConsoleShell>
  )
}

function PlanEditor({ plan, onSaved }: { plan: SubscriptionPlanInfo; onSaved: () => void }) {
  const [form, setForm] = useState(plan)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      await api.adminUpdatePlan(plan.plan, {
        displayName: form.displayName, monthlyFee: form.monthlyFee,
        commissionRate: form.commissionRate, currency: form.currency,
      })
      onSaved()
    } finally { setBusy(false) }
  }
  return (
    <div className="card p-5">
      <p className="font-mono text-xs text-muted">{plan.plan}</p>
      <input className="field mt-2" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
      <label className="mt-3 block text-xs text-muted">Monthly fee ({form.currency})</label>
      <input type="number" min="0" step="0.01" className="field" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })} />
      <label className="mt-3 block text-xs text-muted">Commission (fraction)</label>
      <input type="number" min="0" max="1" step="0.001" className="field" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })} />
      <button onClick={save} disabled={busy} className="btn-primary mt-3 w-full">{busy ? <Spinner /> : 'Save'}</button>
    </div>
  )
}

function StatusChip({ status }: { status: SubscriptionInvoice['status'] }) {
  const tone = status === 'PAID' ? 'bg-forest/12 text-forest'
    : status === 'DUE' ? 'bg-gold/15 text-gold'
    : status === 'FAILED' ? 'bg-clay/12 text-clay-dark' : 'bg-ink/8 text-muted'
  return <span className={`chip rounded-full px-2 py-0.5 text-xs ${tone}`}>{status}</span>
}
