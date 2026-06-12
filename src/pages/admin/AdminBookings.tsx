import { useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { Booking, BookingStatus } from '../../lib/types'
import { money, titleCase, formatDay, formatTime } from '../../lib/format'
import { ADMIN_TABS, ConsoleShell, StatCard } from '../../components/Console'
import { BookingBadge, EmptyState, ErrorNote, PageLoader, PaymentBadge, Spinner } from '../../components/ui'

type Filter = 'all' | 'requests' | 'upcoming' | 'completed' | 'cancelled'

const FILTERS: { key: Filter; label: string; match: (s: BookingStatus) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'requests', label: 'Requests', match: (s) => s === 'REQUESTED' },
  { key: 'upcoming', label: 'Upcoming', match: (s) => ['APPROVED', 'DEPOSIT_PENDING', 'CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS'].includes(s) },
  { key: 'completed', label: 'Completed', match: (s) => ['COMPLETED', 'BALANCE_PENDING', 'CLOSED'].includes(s) },
  { key: 'cancelled', label: 'Cancelled', match: (s) => ['CANCELLED', 'NO_SHOW', 'REJECTED'].includes(s) },
]

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { api.adminBookings().then(setBookings).catch(() => setBookings([])) }, [])

  const visible = useMemo(() => {
    if (!bookings) return []
    const m = FILTERS.find((f) => f.key === filter)!.match
    return bookings.filter((b) => m(b.status))
  }, [bookings, filter])

  const stats = useMemo(() => {
    const list = bookings ?? []
    return {
      total: list.length,
      pending: list.filter((b) => b.status === 'REQUESTED').length,
      upcoming: list.filter((b) => ['APPROVED', 'DEPOSIT_PENDING', 'CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS'].includes(b.status)).length,
      collected: list.reduce((sum, b) => sum + (b.amountPaid || 0), 0),
    }
  }, [bookings])

  const replace = (updated: Booking) =>
    setBookings((list) => (list ? list.map((b) => (b.id === updated.id ? updated : b)) : list))

  const run = async (id: string, fn: () => Promise<Booking>) => {
    setBusyId(id); setError(null)
    try { replace(await fn()) } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed')
    } finally { setBusyId(null) }
  }

  if (bookings === null) return <PageLoader />

  return (
    <ConsoleShell title="All bookings" subtitle="Platform-wide service booking oversight" tabs={ADMIN_TABS}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total bookings" value={String(stats.total)} />
        <StatCard label="Pending approval" value={String(stats.pending)} />
        <StatCard label="Upcoming" value={String(stats.upcoming)} />
        <StatCard label="Collected" value={money(stats.collected)} hint="Sum of payments received" />
      </div>

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

      {error && <div className="mb-4"><ErrorNote message={error} /></div>}

      {visible.length === 0 ? (
        <EmptyState title="No bookings here" hint="Service bookings across all providers will appear here." />
      ) : (
        <div className="space-y-3">
          {visible.map((b) => {
            const open = openId === b.id
            const canCancel = !['CLOSED', 'CANCELLED', 'NO_SHOW', 'REJECTED'].includes(b.status)
            const canClose = b.status === 'COMPLETED' || b.status === 'BALANCE_PENDING'
            return (
              <div key={b.id} className="card p-5">
                <button
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  onClick={() => setOpenId(open ? null : b.id)}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{b.publicBookingId}</p>
                    <p className="text-xs text-muted">{b.vendorName} · {b.customerName} · {formatDay(b.appointmentStart)}, {formatTime(b.appointmentStart)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookingBadge status={b.status} />
                    <PaymentBadge status={b.paymentStatus} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold">{money(b.totalAmount, b.currency)}</span>
                    <span className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>

                {open && (
                  <div className="mt-4 grid gap-6 border-t border-line pt-5 md:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Details</h4>
                      <dl className="grid grid-cols-2 gap-y-2 text-sm">
                        <div><dt className="text-muted">Service</dt><dd className="font-medium">{b.serviceName}</dd></div>
                        <div><dt className="text-muted">Provider</dt><dd>{b.vendorName}</dd></div>
                        <div><dt className="text-muted">Customer</dt><dd>{b.customerName}</dd></div>
                        <div><dt className="text-muted">Contact</dt><dd className="truncate">{b.customerPhone}</dd></div>
                        <div><dt className="text-muted">When</dt><dd>{formatDay(b.appointmentStart)}, {formatTime(b.appointmentStart)}–{formatTime(b.appointmentEnd)}</dd></div>
                        <div><dt className="text-muted">Approval</dt><dd>{titleCase(b.approvalMode)}</dd></div>
                        <div><dt className="text-muted">Source</dt><dd>{titleCase(b.sourceChannel)}</dd></div>
                        <div><dt className="text-muted">Location</dt><dd>{titleCase(b.locationType)}</dd></div>
                      </dl>
                      {b.addOns.length > 0 && (
                        <p className="mt-3 text-sm"><span className="text-muted">Add-ons: </span>{b.addOns.map((a) => `${a.name}${a.quantity > 1 ? ` ×${a.quantity}` : ''}`).join(', ')}</p>
                      )}
                      {b.statusReason && <p className="mt-2 text-sm"><span className="text-muted">Reason: </span>{b.statusReason}</p>}
                    </div>

                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Money</h4>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <Ledger label="Service price" value={money(b.servicePrice, b.currency)} />
                        <Ledger label="Tax" value={money(b.taxAmount, b.currency)} />
                        <Ledger label="Total" value={money(b.totalAmount, b.currency)} />
                        <Ledger label="Deposit" value={money(b.depositAmount, b.currency)} />
                        <Ledger label="Paid" value={money(b.amountPaid, b.currency)} />
                        <Ledger label="Balance due" value={money(b.balanceDue, b.currency)} />
                        {b.refundedAmount > 0 && <Ledger label="Refunded" value={money(b.refundedAmount, b.currency)} />}
                      </dl>

                      {(canCancel || canClose) && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {canClose && (
                            <button className="btn-forest" disabled={busyId === b.id} onClick={() => run(b.id, () => api.adminCloseBooking(b.id))}>
                              {busyId === b.id ? <Spinner /> : 'Close booking'}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              className="btn-ghost text-clay"
                              disabled={busyId === b.id}
                              onClick={() => { if (confirm('Cancel this booking on the provider’s behalf?')) run(b.id, () => api.adminCancelBooking(b.id, prompt('Reason (optional):') || undefined)) }}
                            >
                              {busyId === b.id ? <Spinner /> : 'Cancel (escalation)'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </ConsoleShell>
  )
}

function Ledger({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-sand p-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-mono font-semibold">{value}</dd>
    </div>
  )
}
