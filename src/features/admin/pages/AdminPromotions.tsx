import { useState } from 'react'
import { api } from '@/shared/lib/api'
import type { FeaturedPlacement } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { formatDate, money } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell } from '@/shared/components/Console'
import { EmptyState, LoadMore, PageLoader } from '@/shared/components/ui'

const FILTERS = ['ALL', 'DUE', 'PAID', 'WAIVED', 'FAILED'] as const

/** Admin oversight of featured-placement purchases (the promotions ledger). */
export default function AdminPromotions() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)

  const list = usePagedList<FeaturedPlacement>(
    (page, size) => api.adminPromotions(filter === 'ALL' ? undefined : filter, page, size),
    [filter],
  )

  const settle = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setBusyId(id)
    try { await fn(id); list.reload() } finally { setBusyId(null) }
  }

  return (
    <ConsoleShell title="Promotions" subtitle="Featured-placement purchases" tabs={ADMIN_TABS}
      actions={
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className={`chip rounded-full px-3 py-1 text-xs ${filter === f ? 'bg-ink text-paper' : 'bg-ink/8 text-muted'}`}>{f}</button>
          ))}
        </div>
      }
    >
      {list.loading ? <PageLoader /> : list.items.length === 0 ? (
        <EmptyState title="No featured placements" hint="No featured-placement purchases match this filter." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Window</th><th className="px-5 py-3 text-right">Days</th>
                <th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.items.map((p) => (
                <tr key={p.id} className="hover:bg-sand/40">
                  <td className="px-5 py-3 font-mono text-xs">{p.vendorId.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(p.startsAt)} → {formatDate(p.endsAt)}</td>
                  <td className="px-5 py-3 text-right">{p.days}</td>
                  <td className="px-5 py-3 text-right font-mono">{money(p.amount, p.currency)}</td>
                  <td className="px-5 py-3">
                    <span className={`chip rounded-full px-2 py-0.5 text-xs ${p.status === 'PAID' ? 'bg-forest/12 text-forest' : p.status === 'DUE' ? 'bg-gold/15 text-gold' : 'bg-ink/8 text-muted'}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {p.status === 'DUE' || p.status === 'FAILED' ? (
                      <div className="flex justify-end gap-2">
                        <button disabled={busyId === p.id} onClick={() => settle(p.id, (id) => api.adminMarkPromotionPaid(id))} className="btn-quiet text-xs">Mark paid</button>
                        <button disabled={busyId === p.id} onClick={() => settle(p.id, api.adminWaivePromotion)} className="btn-quiet text-xs">Waive</button>
                      </div>
                    ) : <span className="text-xs text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <LoadMore shown={list.items.length} total={list.total} hasNext={list.hasNext} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      )}
    </ConsoleShell>
  )
}
