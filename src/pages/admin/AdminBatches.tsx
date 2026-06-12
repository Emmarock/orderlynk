import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { BatchSummary, BatchStatus } from '../../lib/types'
import { money, titleCase, formatDay, cargoTone } from '../../lib/format'
import { ADMIN_TABS, ConsoleShell, StatCard } from '../../components/Console'
import { EmptyState, PageLoader } from '../../components/ui'

const BATCH_STATUSES: BatchStatus[] = [
  'DRAFT', 'OPEN', 'CLOSING_SOON', 'CLOSED', 'SOURCING', 'CONSOLIDATING', 'AT_CARGO_PARTNER',
  'SHIPPED', 'ARRIVED', 'CLEARED', 'READY_FOR_PICKUP', 'COMPLETED', 'DELAYED',
]

export default function AdminBatches() {
  const [list, setList] = useState<BatchSummary[] | null>(null)

  const load = () => api.adminBatches().then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [])

  if (list === null) return <PageLoader />

  const totalRevenue = list.reduce((s, b) => s + b.revenue, 0)
  const totalPending = list.reduce((s, b) => s + b.pendingPayments, 0)

  return (
    <ConsoleShell title="All batches" subtitle="Platform-wide batch & cargo oversight" tabs={ADMIN_TABS}>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Batches" value={String(list.length)} />
        <StatCard label="Revenue collected" value={money(totalRevenue)} />
        <StatCard label="Pending payments" value={money(totalPending)} />
      </div>

      {list.length === 0 ? (
        <EmptyState title="No batches yet" hint="Vendor and cargo-partner batches will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Batch</th><th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Shipments</th><th className="px-5 py-3">Revenue</th><th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map(({ batch: b, orderCount, shipmentRequestCount, revenue }) => (
                <tr key={b.id} className="hover:bg-sand/40">
                  <td className="px-5 py-3">
                    <p className="font-medium">{b.batchName}</p>
                    <p className="text-xs text-muted">{titleCase(b.batchType)}{b.closeDate ? ` · closes ${formatDay(b.closeDate)}` : ''}</p>
                  </td>
                  <td className="px-5 py-3 text-muted">{b.vendorName}</td>
                  <td className="px-5 py-3">{orderCount}</td>
                  <td className="px-5 py-3">{shipmentRequestCount}</td>
                  <td className="px-5 py-3 font-mono">{money(revenue, b.currency)}</td>
                  <td className="px-5 py-3">
                    <select className="field !py-1 text-xs" value={b.batchStatus}
                      onChange={(e) => api.adminUpdateBatchStatus(b.id, e.target.value).then(load)}>
                      {BATCH_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                    </select>
                    <span className={`chip mt-1 ${cargoTone(b.batchStatus)}`}>{titleCase(b.batchStatus)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ConsoleShell>
  )
}
