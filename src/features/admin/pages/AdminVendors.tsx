import { useState } from 'react'
import { api } from '@/shared/lib/api'
import type { Vendor, VendorStatus } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { titleCase } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell } from '@/shared/components/Console'
import { EmptyState, LoadMore, PageLoader } from '@/shared/components/ui'

const FILTERS: (VendorStatus | 'ALL')[] = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SUSPENDED']

function statusTone(s: VendorStatus): string {
  if (s === 'APPROVED') return 'bg-forest/12 text-forest'
  if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') return 'bg-gold/15 text-[#8a5d0c]'
  if (s === 'REJECTED' || s === 'SUSPENDED') return 'bg-clay/12 text-clay-dark'
  return 'bg-ink/8 text-muted'
}

export default function AdminVendors() {
  const [filter, setFilter] = useState<VendorStatus | 'ALL'>('ALL')
  const [busyId, setBusyId] = useState<string | null>(null)

  // Status filter is server-side now: it composes with pagination so "Approved" pages through
  // every approved vendor, not just the ones already loaded.
  const { items: vendors, total, loading, loadingMore, hasNext, loadMore, reload } =
    usePagedList<Vendor>(
      (page, size) => api.adminVendors(filter === 'ALL' ? undefined : filter, page, size),
      [filter],
    )

  const act = async (id: string, fn: (id: string) => Promise<Vendor>) => {
    setBusyId(id)
    try {
      await fn(id)
      reload()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <PageLoader />
  const filtered = vendors

  return (
    <ConsoleShell
      title="Vendors"
      subtitle="Review applications and manage vendor status"
      tabs={ADMIN_TABS}
      actions={
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${filter === f ? 'bg-ink text-cream' : 'bg-cream text-muted hover:text-ink'}`}
            >
              {f === 'ALL' ? 'All' : titleCase(f)}
            </button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState title="No vendors" hint="No vendors match this filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <div key={v.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-display text-lg font-semibold">{v.businessName}</p>
                  <span className={`chip ${statusTone(v.verificationStatus)}`}>{titleCase(v.verificationStatus)}</span>
                </div>
                <p className="text-sm text-muted">
                  {v.city ?? '—'} · /{v.storeSlug}
                  {v.whatsappNumber ? ` · ${v.whatsappNumber}` : ''}
                </p>
                {v.description && <p className="mt-1 max-w-xl text-sm text-muted">{v.description}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`chip ${v.alternativePaymentsEnabled ? 'bg-forest/12 text-forest' : 'bg-ink/8 text-muted'}`}>
                    {v.alternativePaymentsEnabled ? 'Card + transfers' : 'Card only'}
                  </span>
                  <button
                    className="btn-quiet px-2 text-xs"
                    disabled={busyId === v.id}
                    onClick={() => act(v.id, (id) => api.setVendorAlternativePayments(id, !v.alternativePaymentsEnabled))}
                  >
                    {v.alternativePaymentsEnabled ? 'Disable transfers' : 'Enable transfers'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {v.verificationStatus !== 'APPROVED' && (
                  <button className="btn-forest px-4 py-1.5" disabled={busyId === v.id} onClick={() => act(v.id, api.approveVendor)}>
                    Approve
                  </button>
                )}
                {v.verificationStatus === 'APPROVED' && (
                  <button className="btn-ghost px-4 py-1.5" disabled={busyId === v.id} onClick={() => act(v.id, api.suspendVendor)}>
                    Suspend
                  </button>
                )}
                {v.verificationStatus !== 'REJECTED' && v.verificationStatus !== 'APPROVED' && (
                  <button
                    className="btn-quiet px-3 text-clay hover:text-clay-dark"
                    disabled={busyId === v.id}
                    onClick={() => act(v.id, api.rejectVendor)}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <LoadMore shown={vendors.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />
    </ConsoleShell>
  )
}
