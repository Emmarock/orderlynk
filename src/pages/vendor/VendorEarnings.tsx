import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { EarningsSummary } from '../../lib/types'
import { formatDate, money, titleCase } from '../../lib/format'
import { ConsoleShell, StatCard, VENDOR_TABS } from '../../components/Console'
import { CopyOrderId, PageLoader, PaymentBadge } from '../../components/ui'

export default function VendorEarnings() {
  const [data, setData] = useState<EarningsSummary | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    api.vendorEarnings(from || undefined, to || undefined).then(setData).catch(() => setData(null))
  }, [from, to])

  return (
    <ConsoleShell
      title="Earnings"
      subtitle="Gross sales, deductions, commission, tax and net payout"
      tabs={VENDOR_TABS}
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
      {data === null ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Gross sales" value={money(data.grossSales, data.currency)} hint={`${data.paidOrders} paid orders`} />
            <StatCard label="Platform commission" value={`– ${money(data.platformCommission, data.currency)}`} />
            <StatCard label={`Tax (${(data.taxRate * 100).toFixed(1)}%)`} value={`– ${money(data.tax, data.currency)}`} />
            <StatCard label="Net payout" value={money(data.netPayout, data.currency)} hint="After deductions" />
          </div>

          {/* Reconciliation breakdown */}
          <div className="mt-6 card max-w-md p-6">
            <h2 className="font-display text-lg font-semibold">Payout summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Gross sales" value={money(data.grossSales, data.currency)} />
              <Row label="Platform commission" value={`– ${money(data.platformCommission, data.currency)}`} muted />
              <Row label="Refunds" value={`– ${money(data.refunds, data.currency)}`} muted />
              <Row label={`Tax (${(data.taxRate * 100).toFixed(1)}%)`} value={`– ${money(data.tax, data.currency)}`} muted />
              <div className="my-2 border-t border-line" />
              <Row label="Net payout" value={money(data.netPayout, data.currency)} bold />
              <p className="pt-1 text-xs text-muted">
                Processing fees of {money(data.processingFees, data.currency)} were collected from customers (not deducted from you).
              </p>
            </dl>
          </div>

          {/* Order-level breakdown */}
          <h2 className="mb-3 mt-8 font-display text-lg font-semibold">Order-level earnings</h2>
          {data.orders.length === 0 ? (
            <p className="text-muted">No orders in this period.</p>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Gross</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-right">Refund</th>
                    <th className="px-5 py-3 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.orders.map((o) => (
                    <tr key={o.publicOrderId} className="hover:bg-sand/40">
                      <td className="px-5 py-3 font-mono"><CopyOrderId value={o.publicOrderId} /></td>
                      <td className="px-5 py-3 text-muted">{formatDate(o.createdAt)}</td>
                      <td className="px-5 py-3"><PaymentBadge status={o.paymentStatus} /></td>
                      <td className="px-5 py-3 text-right font-mono">{money(o.grossSales, data.currency)}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted">– {money(o.commission, data.currency)}</td>
                      <td className="px-5 py-3 text-right font-mono text-muted">{o.refund > 0 ? `– ${money(o.refund, data.currency)}` : '—'}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">{money(o.net, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">Headline totals reflect realized (paid) orders. {titleCase('pending')} orders show in the table for visibility.</p>
        </>
      )}
    </ConsoleShell>
  )
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? 'text-muted' : ''}>{label}</dt>
      <dd className={`font-mono ${bold ? 'text-base font-semibold' : ''}`}>{value}</dd>
    </div>
  )
}