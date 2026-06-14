import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '@/shared/lib/api'
import type { Booking, BookingPayment, BookingPaymentType, BookingStatus, PaymentMethod } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { money, titleCase, formatDay, formatTime, bookingTone } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { BookingBadge, EmptyState, ErrorNote, LoadMore, PageLoader, PaymentBadge, Spinner } from '@/shared/components/ui'

type Filter = 'all' | 'requests' | 'upcoming' | 'completed' | 'cancelled'

const FILTERS: { key: Filter; label: string; match: (s: BookingStatus) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'requests', label: 'Requests', match: (s) => s === 'REQUESTED' },
  { key: 'upcoming', label: 'Upcoming', match: (s) => ['APPROVED', 'DEPOSIT_PENDING', 'CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS'].includes(s) },
  { key: 'completed', label: 'Completed', match: (s) => ['COMPLETED', 'BALANCE_PENDING', 'CLOSED'].includes(s) },
  { key: 'cancelled', label: 'Cancelled', match: (s) => ['CANCELLED', 'NO_SHOW', 'REJECTED'].includes(s) },
]

type View = 'list' | 'calendar'

export default function VendorBookings() {
  const [filter, setFilter] = useState<Filter>('all')
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Booking | null>(null)
  const [altPay, setAltPay] = useState(false)

  const { items: bookings, total, loading, loadingMore, hasNext, loadMore, reload, setItems } = usePagedList(
    (page, size) => api.vendorBookings(undefined, undefined, page, size),
    [],
  )
  useEffect(() => { api.myVendor().then((v) => setAltPay(v.alternativePaymentsEnabled)).catch(() => {}) }, [])

  const visible = useMemo(() => {
    const m = FILTERS.find((f) => f.key === filter)!.match
    return bookings.filter((b) => m(b.status))
  }, [bookings, filter])

  const onChanged = (updated: Booking) => {
    // Optimistically reflect the change in the loaded rows (and the open modal), then resync from
    // the server so a status change that moves the booking across tabs is consistent.
    setItems((list) => list.map((b) => (b.id === updated.id ? updated : b)))
    setSelected(updated)
    reload()
  }

  if (loading) return <PageLoader />

  return (
    <ConsoleShell
      title="Bookings"
      subtitle="Approve requests, manage appointments and collect payments"
      tabs={VENDOR_TABS}
      actions={
        <div className="inline-flex rounded-xl border border-line bg-cream p-1">
          {(['list', 'calendar'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = bookings.filter((b) => f.match(b.status)).length
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`chip ${filter === f.key ? 'bg-ink text-cream' : 'bg-ink/8 text-muted hover:text-ink'}`}
            >
              {f.label} <span className="ml-1 opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {view === 'calendar' ? (
        <WeekCalendar bookings={visible} onSelect={setSelected} />
      ) : visible.length === 0 ? (
        <EmptyState title="No bookings here" hint="Bookings from your service link and the marketplace will appear here." />
      ) : (
        <>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((b) => (
                <tr key={b.id} className="cursor-pointer hover:bg-sand/40" onClick={() => setSelected(b)}>
                  <td className="px-5 py-3 font-mono text-xs">{b.publicBookingId}</td>
                  <td className="px-5 py-3 font-medium">{b.customerName}</td>
                  <td className="px-5 py-3 text-muted">{b.serviceName}</td>
                  <td className="px-5 py-3">{formatDay(b.appointmentStart)}<span className="block text-xs text-muted">{formatTime(b.appointmentStart)}</span></td>
                  <td className="px-5 py-3"><BookingBadge status={b.status} /></td>
                  <td className="px-5 py-3"><PaymentBadge status={b.paymentStatus} /></td>
                  <td className="px-5 py-3 text-right font-mono">{money(b.totalAmount, b.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <LoadMore shown={bookings.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />
        </>
      )}

      {selected && <BookingDetail booking={selected} onClose={() => setSelected(null)} onChanged={onChanged} alternativePayments={altPay} />}
    </ConsoleShell>
  )
}

// ============================= Week calendar =============================

const HOUR_PX = 56
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Midnight on the Monday of the week containing `d` (local time). */
function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const offset = (date.getDay() + 6) % 7 // 0 = Monday
  date.setDate(date.getDate() - offset)
  return date
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function WeekCalendar({ bookings, onSelect }: { bookings: Booking[]; onSelect: (b: Booking) => void }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const weekEnd = addDays(weekStart, 7)
  const today = new Date()

  // Bookings falling within the visible week, decorated with their local start/end Dates.
  const weekBookings = useMemo(
    () =>
      bookings
        .map((b) => ({ b, start: new Date(b.appointmentStart), end: new Date(b.appointmentEnd) }))
        .filter((x) => x.start >= weekStart && x.start < weekEnd),
    [bookings, weekStart, weekEnd],
  )

  // Vertical range: snug around the week's bookings, defaulting to 8:00–18:00.
  const { startHour, endHour } = useMemo(() => {
    let min = 8
    let max = 18
    for (const { start, end } of weekBookings) {
      min = Math.min(min, start.getHours())
      max = Math.max(max, end.getHours() + (end.getMinutes() > 0 ? 1 : 0))
    }
    return { startHour: Math.max(0, Math.min(min, 8)), endHour: Math.min(24, Math.max(max, 18)) }
  }, [weekBookings])

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const gridHeight = (endHour - startHour) * HOUR_PX

  const blocksByDay = (dayIndex: number) =>
    weekBookings.filter((x) => ((x.start.getDay() + 6) % 7) === dayIndex)

  const rangeLabel = `${weekStart.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – ${addDays(weekStart, 6).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}`

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-display text-lg font-semibold">{rangeLabel}</p>
        <div className="flex items-center gap-1">
          <button className="btn-quiet px-2" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Previous week">‹</button>
          <button className="btn-quiet px-3 text-sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
          <button className="btn-quiet px-2" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Next week">›</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Day headers */}
          <div className="grid border-b border-line" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div />
            {days.map((d, i) => {
              const isToday = sameDay(d, today)
              return (
                <div key={i} className={`px-2 py-2 text-center text-xs ${isToday ? 'text-clay-dark' : 'text-muted'}`}>
                  <span className="uppercase tracking-wider">{DAY_LABELS[i]}</span>
                  <span className={`mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${isToday ? 'bg-clay text-cream' : 'text-ink'}`}>
                    {d.getDate()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            {/* Hour axis */}
            <div className="relative" style={{ height: gridHeight }}>
              {hours.map((h, i) => (
                <div key={h} className="absolute right-1 -translate-y-1/2 text-[11px] text-muted" style={{ top: i * HOUR_PX }}>
                  {h % 12 === 0 ? 12 : h % 12}{h < 12 ? 'a' : 'p'}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, dayIndex) => (
              <div key={dayIndex} className={`relative border-l border-line ${sameDay(d, today) ? 'bg-clay/[0.04]' : ''}`} style={{ height: gridHeight }}>
                {hours.map((h, i) => (
                  <div key={h} className="absolute inset-x-0 border-t border-line/60" style={{ top: i * HOUR_PX }} />
                ))}
                {blocksByDay(dayIndex).map(({ b, start, end }) => {
                  const top = (start.getHours() + start.getMinutes() / 60 - startHour) * HOUR_PX
                  const rawHeight = ((end.getTime() - start.getTime()) / 3_600_000) * HOUR_PX
                  const height = Math.max(rawHeight, 22)
                  return (
                    <button
                      key={b.id}
                      onClick={() => onSelect(b)}
                      title={`${b.serviceName} · ${b.customerName} · ${titleCase(b.status)}`}
                      className={`absolute inset-x-1 overflow-hidden rounded-md border border-black/5 px-1.5 py-1 text-left text-[11px] leading-tight shadow-sm transition-transform hover:z-10 hover:scale-[1.02] ${bookingTone(b.status)}`}
                      style={{ top, height }}
                    >
                      <span className="block font-semibold">{formatTime(b.appointmentStart)}</span>
                      <span className="block truncate">{b.serviceName}</span>
                      {height > 40 && <span className="block truncate opacity-80">{b.customerName}</span>}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {weekBookings.length === 0 && (
        <p className="border-t border-line px-4 py-6 text-center text-sm text-muted">No bookings this week.</p>
      )}
    </div>
  )
}

/** ISO instant → "YYYY-MM-DDTHH:mm" in local time, for a datetime-local input default. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function BookingDetail({ booking, onClose, onChanged, alternativePayments }: { booking: Booking; onClose: () => void; onChanged: (b: Booking) => void; alternativePayments: boolean }) {
  const [payments, setPayments] = useState<BookingPayment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [action, setAction] = useState<null | 'reschedule' | 'cancel' | 'reject'>(null)
  const [rescheduleAt, setRescheduleAt] = useState('')
  const [reason, setReason] = useState('')

  const loadPayments = () => api.bookingPayments(booking.id).then(setPayments).catch(() => setPayments([]))
  useEffect(() => { loadPayments() }, [booking.id])

  const run = async (fn: () => Promise<Booking>) => {
    setBusy(true); setError(null)
    try {
      onChanged(await fn())
      loadPayments()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed')
    } finally { setBusy(false) }
  }

  const s = booking.status
  const can = {
    approve: s === 'REQUESTED',
    reject: s === 'REQUESTED',
    start: s === 'CONFIRMED' || s === 'REMINDER_SENT',
    complete: ['CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS'].includes(s),
    noShow: ['CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS'].includes(s),
    reschedule: ['REQUESTED', 'APPROVED', 'DEPOSIT_PENDING', 'CONFIRMED', 'REMINDER_SENT'].includes(s),
    cancel: !['CLOSED', 'CANCELLED', 'NO_SHOW', 'REJECTED'].includes(s),
    close: s === 'COMPLETED' || s === 'BALANCE_PENDING',
    pay: !['DRAFT', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'CLOSED'].includes(s),
  }

  const closeAction = () => { setAction(null); setReason(''); setRescheduleAt(''); setError(null) }
  const openReschedule = () => { setRescheduleAt(toDatetimeLocal(booking.appointmentStart)); setError(null); setAction('reschedule') }
  const openReason = (a: 'cancel' | 'reject') => { setReason(''); setError(null); setAction(a) }

  const confirmReschedule = async () => {
    if (!rescheduleAt) return
    await run(() => api.rescheduleBooking(booking.id, new Date(rescheduleAt).toISOString()))
    closeAction()
  }
  const confirmReason = async () => {
    const r = reason.trim() || undefined
    await run(() => (action === 'reject' ? api.rejectBooking(booking.id, r) : api.cancelBooking(booking.id, r)))
    closeAction()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted">{booking.publicBookingId}</p>
            <h2 className="font-display text-xl font-semibold">{booking.serviceName}</h2>
          </div>
          <BookingBadge status={booking.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><dt className="text-muted">Customer</dt><dd className="font-medium">{booking.customerName}</dd></div>
          <div><dt className="text-muted">Contact</dt><dd>{booking.customerPhone}{booking.customerEmail ? ` · ${booking.customerEmail}` : ''}</dd></div>
          <div><dt className="text-muted">When</dt><dd>{formatDay(booking.appointmentStart)}, {formatTime(booking.appointmentStart)}–{formatTime(booking.appointmentEnd)}</dd></div>
          <div><dt className="text-muted">Approval</dt><dd>{titleCase(booking.approvalMode)}</dd></div>
          {booking.locationType === 'CUSTOMER_LOCATION' && (booking.customerStreet || booking.customerCity) && (
            <div className="col-span-2"><dt className="text-muted">Address</dt><dd>{[booking.customerHouseNumber, booking.customerStreet, booking.customerCity, booking.customerState, booking.customerPostcode].filter(Boolean).join(', ')}</dd></div>
          )}
          {booking.addOns.length > 0 && (
            <div className="col-span-2"><dt className="text-muted">Add-ons</dt><dd>{booking.addOns.map((a) => `${a.name}${a.quantity > 1 ? ` ×${a.quantity}` : ''}`).join(', ')}</dd></div>
          )}
          {booking.notes && <div className="col-span-2"><dt className="text-muted">Notes</dt><dd>{booking.notes}</dd></div>}
          {booking.statusReason && <div className="col-span-2"><dt className="text-muted">Reason</dt><dd>{booking.statusReason}</dd></div>}
        </dl>

        <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Service price</span><span className="font-mono">{money(booking.servicePrice, booking.currency)}</span></div>
          {booking.taxAmount > 0 && <div className="flex justify-between"><span className="text-muted">Tax</span><span className="font-mono">{money(booking.taxAmount, booking.currency)}</span></div>}
          <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{money(booking.totalAmount, booking.currency)}</span></div>
          {booking.depositType !== 'NONE' && <div className="flex justify-between"><span className="text-muted">Deposit</span><span className="font-mono">{money(booking.depositAmount, booking.currency)}</span></div>}
          <div className="flex justify-between"><span className="text-muted">Paid</span><span className="font-mono">{money(booking.amountPaid, booking.currency)}</span></div>
          <div className="flex justify-between"><span className="text-muted">Balance due</span><span className="font-mono font-semibold text-clay-dark">{money(booking.balanceDue, booking.currency)}</span></div>
        </div>

        {error && <div className="mt-4"><ErrorNote message={error} /></div>}

        {!action && (
          <div className="mt-4 flex flex-wrap gap-2">
            {can.approve && <button className="btn-primary" disabled={busy} onClick={() => run(() => api.approveBooking(booking.id))}>Approve</button>}
            {can.reject && <button className="btn-ghost text-clay" disabled={busy} onClick={() => openReason('reject')}>Reject</button>}
            {can.start && <button className="btn-quiet" disabled={busy} onClick={() => run(() => api.startBooking(booking.id))}>Start service</button>}
            {can.complete && <button className="btn-primary" disabled={busy} onClick={() => run(() => api.completeBooking(booking.id))}>Mark completed</button>}
            {can.noShow && <button className="btn-quiet text-clay" disabled={busy} onClick={() => run(() => api.noShowBooking(booking.id))}>No-show</button>}
            {can.reschedule && <button className="btn-quiet" disabled={busy} onClick={openReschedule}>Reschedule</button>}
            {can.close && <button className="btn-primary" disabled={busy} onClick={() => run(() => api.closeBooking(booking.id))}>Close</button>}
            {can.cancel && <button className="btn-quiet text-clay" disabled={busy} onClick={() => openReason('cancel')}>Cancel</button>}
          </div>
        )}

        {action === 'reschedule' && (
          <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4">
            <p className="label">Reschedule appointment</p>
            <input className="field" type="datetime-local" value={rescheduleAt} onChange={(e) => setRescheduleAt(e.target.value)} />
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-ghost" disabled={busy} onClick={closeAction}>Back</button>
              <button className="btn-primary" disabled={busy || !rescheduleAt} onClick={confirmReschedule}>{busy ? <Spinner /> : 'Reschedule'}</button>
            </div>
          </div>
        )}

        {(action === 'cancel' || action === 'reject') && (
          <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4">
            <p className="label">{action === 'cancel' ? 'Cancel this booking?' : 'Reject this request?'}</p>
            <textarea className="field min-h-20" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional) — shared with the customer" />
            <div className="mt-3 flex justify-end gap-2">
              <button className="btn-ghost" disabled={busy} onClick={closeAction}>Back</button>
              <button className="btn-primary text-clay" disabled={busy} onClick={confirmReason}>
                {busy ? <Spinner /> : action === 'cancel' ? 'Cancel booking' : 'Reject'}
              </button>
            </div>
          </div>
        )}

        {can.pay && <RecordPayment booking={booking} alternativePayments={alternativePayments} onRecorded={(b) => { onChanged(b); loadPayments() }} />}

        {payments && payments.length > 0 && (
          <div className="mt-4">
            <p className="label">Payments</p>
            <ul className="space-y-1.5">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span>{titleCase(p.paymentType)} · {titleCase(p.method)}{p.transactionReference ? ` · ${p.transactionReference}` : ''}</span>
                  <span className="font-mono">{money(p.amount, booking.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

const PAYMENT_TYPES: BookingPaymentType[] = ['DEPOSIT', 'BALANCE', 'FULL', 'REFUND']
const METHODS: PaymentMethod[] = ['CASH', 'INTERAC_ETRANSFER', 'BANK_TRANSFER', 'CARD', 'OTHER']

function RecordPayment({ booking, alternativePayments, onRecorded }: { booking: Booking; alternativePayments: boolean; onRecorded: (b: Booking) => void }) {
  const methods = alternativePayments ? METHODS : (['CARD'] as PaymentMethod[])
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<BookingPaymentType>(booking.amountPaid <= 0 && booking.depositType !== 'NONE' ? 'DEPOSIT' : 'BALANCE')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>(alternativePayments ? 'INTERAC_ETRANSFER' : 'CARD')
  const [reference, setReference] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      await api.recordBookingPayment(booking.id, {
        paymentType: type,
        amount: amount.trim() === '' ? undefined : Number(amount),
        method,
        transactionReference: reference || undefined,
      })
      const refreshed = await api.vendorBooking(booking.id)
      onRecorded(refreshed)
      setOpen(false); setAmount(''); setReference('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not record payment')
    } finally { setBusy(false) }
  }

  if (!open) {
    return (
      <button className="btn-quiet mt-4 text-forest" onClick={() => setOpen(true)}>+ Record a payment</button>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4">
      <p className="label !mb-2">Record payment</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="field" value={type} onChange={(e) => setType(e.target.value as BookingPaymentType)}>
            {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Amount (blank = auto)</label>
          <input className="field" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="auto" />
        </div>
        <div>
          <label className="label">Method</label>
          <select className="field" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {methods.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Reference</label>
          <input className="field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="optional" />
        </div>
      </div>
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
      <div className="mt-3 flex justify-end gap-2">
        <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? <Spinner /> : 'Record'}</button>
      </div>
    </div>
  )
}
