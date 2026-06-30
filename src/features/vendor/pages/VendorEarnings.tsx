import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiMessage } from '@/shared/lib/api'
import type { EarningsSummary } from '@/shared/lib/types'
import { formatDate, money, titleCase } from '@/shared/lib/format'
import { ConsoleShell, StatCard, VENDOR_TABS } from '@/shared/components/Console'
import { CopyOrderId, ErrorNote, PageLoader, PaymentBadge, Spinner } from '@/shared/components/ui'

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

          <InstantPayoutCard currency={data.currency} />

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

/**
 * Move the vendor's own Stripe balance to their bank instantly, for a small platform fee charged to
 * their card on file (the platform never holds vendor funds). Requires a card on file; the small fee is
 * shown after collection. A Stripe instant-payout fee may also apply on the vendor's account.
 */
function InstantPayoutCard({ currency }: { currency: string }) {
  const [hasCard, setHasCard] = useState<boolean | null>(null)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ amount: number; fee: number } | null>(null)

  useEffect(() => {
    api.vendorBillingStatus().then((s) => setHasCard(s.hasPaymentMethod)).catch(() => setHasCard(false))
  }, [])

  const value = Number(amount)
  const valid = Number.isFinite(value) && value > 0

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      const p = await api.vendorInstantPayout(value, currency)
      setDone({ amount: p.netPayout, fee: p.instantPayoutFee ?? 0 })
      setAmount('')
    } catch (e) {
      setError(apiMessage(e, 'Instant payout could not be completed. Check your card and Stripe account.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 card max-w-md p-6">
      <h2 className="font-display text-lg font-semibold">Instant payout</h2>
      <p className="mt-1 text-sm text-muted">
        Send your available balance to your bank now. A small platform fee applies, charged to your card on file.
      </p>

      {done && (
        <div className="mt-4 rounded-xl border border-forest/30 bg-forest/5 p-4 text-sm">
          <p className="font-semibold text-forest">✓ Instant payout started</p>
          <p className="mt-1 text-muted">
            {money(done.amount, currency)} is on its way to your bank. Fee charged: {money(done.fee, currency)}.
          </p>
        </div>
      )}

      {hasCard === false ? (
        <p className="mt-4 text-sm text-muted">
          Add a card in <Link to="/vendor/manage/settings" className="underline">Settings</Link> to enable instant payouts.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" step="0.01" inputMode="decimal" placeholder={`Amount (${currency})`}
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="field h-10 w-44" aria-label="Instant payout amount"
            />
            <button onClick={submit} disabled={!valid || busy || hasCard === null} className="btn-primary">
              {busy ? <Spinner /> : 'Pay out now'}
            </button>
          </div>
          {error && <ErrorNote message={error} />}
        </div>
      )}
    </div>
  )
}