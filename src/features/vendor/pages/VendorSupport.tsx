import { useEffect, useState } from 'react'
import { api, ApiError } from '@/shared/lib/api'
import type { SupportTicket } from '@/shared/lib/types'
import { formatDate, titleCase } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { ErrorNote, Spinner } from '@/shared/components/ui'

const CATEGORIES = ['PAYMENT', 'ORDER', 'PRODUCT', 'ACCOUNT', 'TECHNICAL', 'OTHER']

const FAQS: { q: string; a: string }[] = [
  { q: 'How do I create products?', a: 'Go to Products → New product. Enter a name (we can auto-write a description), price, quantity, category and fulfillment type, and optionally upload a photo from your device. Save to publish it to your storefront.' },
  { q: 'How do I manage orders?', a: 'Open the Orders tab to see every order. Click an order to mark payment received and advance fulfillment (e.g. Confirmed → Packed → Ready for pickup). You can filter orders by a date range.' },
  { q: 'How do payments and commission work?', a: 'Customers pay the product price plus any platform service and processing fees. OrderLynk deducts a commission from your product subtotal; the remainder is your payable. See the Earnings tab for gross sales, commission, tax and net payout.' },
  { q: 'How do I update fulfillment status?', a: 'In an order’s detail view, use “Advance fulfillment” to move it to the next valid status for its fulfillment type. Customers are notified at key steps (e.g. ready for pickup, shipped).' },
  { q: 'How do I message customers?', a: 'The Customers tab lists everyone who has ordered from you. Use “Broadcast” to send a message to customers in the current view (you can scope it by date range).' },
  { q: 'How do I upload a logo or banner?', a: 'In Settings → Business details, set your logo URL (image upload for the logo is coming soon — for now paste a hosted image URL).' },
  { q: 'How do I set low-stock alerts?', a: 'When creating or editing a product, set “Low-stock alert at” to a number. When stock falls to or below it, the product is flagged on your dashboard and Products page.' },
  { q: 'How do I contact support?', a: 'Use the “Message Us” form on this page. Pick a category, add a subject and message, and we’ll follow up.' },
]

function MessageUs({ onCreated }: { onCreated: (t: SupportTicket) => void }) {
  const [category, setCategory] = useState('PAYMENT')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    setDone(false)
    try {
      const t = await api.createSupportTicket({ category, subject, message })
      onCreated(t)
      setSubject('')
      setMessage('')
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl font-semibold">Message us</h2>
      <p className="mt-1 text-sm text-muted">Payment, order, product, account or technical issues — we’re here to help.</p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div>
            <label className="label">Category</label>
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="field" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="field min-h-28" required maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        {error && <ErrorNote message={error} />}
        {done && (
          <div className="rounded-xl border border-forest/30 bg-forest/8 px-4 py-3 text-sm text-forest">
            Thanks — your message has been sent. We’ll be in touch.
          </div>
        )}
        <button className="btn-primary" disabled={sending || !subject.trim() || !message.trim()}>{sending ? <Spinner /> : 'Send message'}</button>
      </form>
    </div>
  )
}

function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="card p-6">
      <h2 className="font-display text-xl font-semibold">FAQs</h2>
      <div className="mt-3 divide-y divide-line">
        {FAQS.map((f, i) => (
          <div key={i}>
            <button
              className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {f.q}
              <span className={`text-muted transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {open === i && <p className="pb-3 text-sm text-muted">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function VendorSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])

  useEffect(() => {
    api.vendorSupportTickets().then(setTickets).catch(() => setTickets([]))
  }, [])

  return (
    <ConsoleShell title="Support" subtitle="Get help and find answers" tabs={VENDOR_TABS}>
      <div className="grid gap-6 lg:grid-cols-2">
        <MessageUs onCreated={(t) => setTickets((prev) => [t, ...prev])} />
        <Faq />
      </div>

      {tickets.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Your requests</h2>
          <div className="card divide-y divide-line">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t.subject}</p>
                  <p className="truncate text-xs text-muted">{titleCase(t.category)} · {formatDate(t.createdAt)}</p>
                </div>
                <span className={`chip ${t.status === 'OPEN' ? 'bg-gold/15 text-[#9A6A10]' : 'bg-forest/12 text-forest'}`}>
                  {titleCase(t.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ConsoleShell>
  )
}