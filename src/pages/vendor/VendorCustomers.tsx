import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { CustomerSummary } from '../../lib/types'
import { formatDate, money } from '../../lib/format'
import { ConsoleShell, VENDOR_TABS } from '../../components/Console'
import { EmptyState, ErrorNote, PageLoader, Spinner } from '../../components/ui'

function BroadcastModal({
  customerCount,
  onClose,
  onSend,
}: {
  customerCount: number
  onClose: () => void
  onSend: (subject: string, message: string) => Promise<void>
}) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await onSend(subject, message)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send broadcast')
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">Broadcast to customers</h2>
        <p className="mt-1 text-sm text-muted">
          Sends to the {customerCount} customer{customerCount === 1 ? '' : 's'} in the current view who have an email on file.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="label">Subject</label>
            <input className="field" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="field min-h-32" required maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {error && <ErrorNote message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={sending}>{sending ? <Spinner /> : 'Send broadcast'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorCustomers() {
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [composing, setComposing] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.vendorCustomers(from || undefined, to || undefined).then(setCustomers).catch(() => setCustomers([]))
  }, [from, to])

  const sendBroadcast = async (subject: string, message: string) => {
    const res = await api.vendorBroadcast({ subject, message }, from || undefined, to || undefined)
    setComposing(false)
    setToast(`Broadcast sent to ${res.recipients} of ${res.totalCustomers} customer${res.totalCustomers === 1 ? '' : 's'}.`)
    setTimeout(() => setToast(null), 4000)
  }

  if (customers === null) return <PageLoader />

  return (
    <ConsoleShell
      title="Customers"
      subtitle="Everyone who has ordered from you — reach them with a broadcast"
      tabs={VENDOR_TABS}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="field h-9 w-auto px-2 py-1 text-sm"
            aria-label="From date"
          />
          <span className="text-muted">–</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="field h-9 w-auto px-2 py-1 text-sm"
            aria-label="To date"
          />
          {(from || to) && (
            <button className="btn-quiet px-2 text-sm" onClick={() => { setFrom(''); setTo('') }}>Clear</button>
          )}
          <button className="btn-primary" disabled={customers.length === 0} onClick={() => setComposing(true)}>
            Broadcast
          </button>
        </div>
      }
    >
      {toast && (
        <div className="mb-4 rounded-xl border border-forest/30 bg-forest/10 px-4 py-3 text-sm text-forest">{toast}</div>
      )}

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" hint="Customers who order from your storefront will appear here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Total spent</th>
                <th className="px-5 py-3">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c, i) => (
                <tr key={`${c.phone}-${i}`} className="hover:bg-sand/40">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-muted">
                    <div>{c.phone}</div>
                    {c.email && <div className="text-xs">{c.email}</div>}
                  </td>
                  <td className="px-5 py-3 text-muted">{c.city ?? '—'}</td>
                  <td className="px-5 py-3 text-right">{c.orderCount}</td>
                  <td className="px-5 py-3 text-right font-mono">{money(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(c.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {composing && (
        <BroadcastModal customerCount={customers.length} onClose={() => setComposing(false)} onSend={sendBroadcast} />
      )}
    </ConsoleShell>
  )
}