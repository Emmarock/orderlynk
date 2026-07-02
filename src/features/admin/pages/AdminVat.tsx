import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { VatLedgerSummary } from '@/shared/lib/types'
import { formatDate, money } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell, StatCard } from '@/shared/components/Console'
import { EmptyState, PageLoader } from '@/shared/components/ui'

/**
 * Platform VAT the platform collects on vendors' behalf (collector = PLATFORM) and must remit to
 * the government. Vendors who collect their own VAT don't appear here — they see it on their
 * earnings page. This is the platform's remittance ledger.
 */
export default function AdminVat() {
  const [data, setData] = useState<VatLedgerSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = () =>
    api.adminVat(from || undefined, to || undefined)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))

  useEffect(() => {
    setLoading(true)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  const remit = async (id: string) => {
    setBusyId(id)
    try { await api.adminRemitVat(id); await load() } finally { setBusyId(null) }
  }

  return (
    <ConsoleShell
      title="VAT"
      subtitle="VAT the platform collects on vendors' behalf and must remit to the government"
      tabs={ADMIN_TABS}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)}
                 className="field h-9 w-auto px-2 py-1 text-sm" aria-label="From date" />
          <span className="text-muted">–</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)}
                 className="field h-9 w-auto px-2 py-1 text-sm" aria-label="To date" />
          {(from || to) && (
            <button className="btn-quiet px-2 text-sm" onClick={() => { setFrom(''); setTo('') }}>Clear</button>
          )}
        </div>
      }
    >
      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Collected" value={money(data?.totalCollected ?? 0, data?.currency)} hint={`${data?.entryCount ?? 0} orders`} />
            <StatCard label="Remitted" value={money(data?.totalRemitted ?? 0, data?.currency)} />
            <StatCard label="Outstanding" value={money(data?.outstanding ?? 0, data?.currency)} hint="Yet to remit" />
          </div>

          {!data || data.entryCount === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No platform-collected VAT"
                hint="VAT appears here only for vendors who chose the platform as their VAT collector."
              />
            </div>
          ) : (
            <div className="mt-6 card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Vendor</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Taxable</th>
                    <th className="px-5 py-3 text-right">VAT</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.entries.map((e) => (
                    <tr key={e.id} className="hover:bg-sand/40">
                      <td className="px-5 py-3 font-mono">{e.publicOrderId ?? e.orderId.slice(0, 8)}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">{e.vendorId.slice(0, 8)}</td>
                      <td className="px-5 py-3 text-muted">{e.createdAt ? formatDate(e.createdAt) : '—'}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted">{money(e.taxableAmount, e.currency)}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">{money(e.amount, e.currency)}</td>
                      <td className="px-5 py-3">
                        <span className={`chip rounded-full px-2 py-0.5 text-xs ${e.remitted ? 'bg-forest/12 text-forest' : 'bg-gold/15 text-gold'}`}>
                          {e.remitted ? 'Remitted' : 'Outstanding'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {e.remitted ? (
                          <span className="text-xs text-muted">{e.remittedAt ? formatDate(e.remittedAt) : '—'}</span>
                        ) : (
                          <button disabled={busyId === e.id} onClick={() => remit(e.id)} className="btn-quiet text-xs disabled:opacity-50">
                            Mark remitted
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ConsoleShell>
  )
}
