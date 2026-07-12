import { useEffect, useState } from 'react'
import { api, apiMessage } from '@/shared/lib/api'
import type { Booking, Slot } from '@/shared/lib/types'
import { formatDay, formatTime, money } from '@/shared/lib/format'
import { ErrorNote, Spinner } from '@/shared/components/ui'

/** Local YYYY-MM-DD for today, for the date picker min/default (treats value as a plain calendar date). */
function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const CHANGEABLE_STATUSES = ['REQUESTED', 'APPROVED', 'DEPOSIT_PENDING', 'CONFIRMED', 'REMINDER_SENT']
const CUTOFF_MS = 12 * 60 * 60 * 1000

/**
 * Customer self-service for an upcoming booking:
 *  - Cancel — allowed any time before the appointment. Cancelling ≥12h ahead refunds everything paid;
 *    a later cancellation forfeits 50% of the deposit. Refunds are issued automatically to the card.
 *  - Reschedule — allowed only ≥12h before the appointment.
 * Works for signed-in customers (no contact) and guests (pass the phone/email they booked with).
 * Renders nothing once the booking is past or in a non-changeable state.
 */
export default function CustomerBookingActions({
  booking,
  contact,
  onChange,
}: {
  booking: Booking
  contact?: string
  onChange: (b: Booking) => void
}) {
  const [mode, setMode] = useState<'cancel' | 'reschedule' | null>(null)

  if (!CHANGEABLE_STATUSES.includes(booking.status)) return null

  const msUntil = new Date(booking.appointmentStart).getTime() - Date.now()
  if (msUntil <= 0) return null
  const canReschedule = msUntil >= CUTOFF_MS
  const late = !canReschedule

  return (
    <div className="mt-4 border-t border-line pt-4">
      {mode === null && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-sm text-muted">Manage booking:</p>
          {canReschedule ? (
            <button className="btn-ghost px-3 py-1.5" onClick={() => setMode('reschedule')}>Reschedule</button>
          ) : (
            <span className="text-xs text-muted">Rescheduling closed (within 12h)</span>
          )}
          <button className="btn-quiet px-3 py-1.5 text-clay hover:text-clay-dark" onClick={() => setMode('cancel')}>
            Cancel booking
          </button>
        </div>
      )}
      {mode === 'cancel' && (
        <CancelPanel booking={booking} contact={contact} late={late} onChange={onChange} onClose={() => setMode(null)} />
      )}
      {mode === 'reschedule' && canReschedule && (
        <ReschedulePanel booking={booking} contact={contact} onChange={onChange} onClose={() => setMode(null)} />
      )}
    </div>
  )
}

/** Refund the customer should expect, mirroring the backend policy (full early; paid − 50% deposit late). */
function plannedRefund(booking: Booking, late: boolean): number {
  const paid = booking.amountPaid ?? 0
  if (paid <= 0) return 0
  if (!late) return paid
  const forfeit = Math.min(booking.depositAmount ?? 0, paid) * 0.5
  return Math.max(0, paid - forfeit)
}

function CancelPanel({
  booking, contact, late, onChange, onClose,
}: {
  booking: Booking; contact?: string; late: boolean; onChange: (b: Booking) => void; onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paid = booking.amountPaid ?? 0
  const refund = plannedRefund(booking, late)

  const confirm = async () => {
    setBusy(true); setError(null)
    try {
      onChange(await api.customerCancelBooking(booking.publicBookingId, reason.trim() || undefined, contact))
    } catch (e) {
      setError(apiMessage(e, 'Could not cancel the booking'))
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">Cancel this booking?</p>
      {paid > 0 && (
        <p className="mt-1 text-xs text-muted">
          {late ? (
            <>
              This is a late cancellation (within 12 hours), so 50% of your deposit is non-refundable.{' '}
              {refund > 0
                ? <>A refund of <span className="font-semibold">{money(refund, booking.currency)}</span> will be issued automatically to your card.</>
                : <>No refund is due.</>}
            </>
          ) : (
            <>Your payment of <span className="font-semibold">{money(refund, booking.currency)}</span> will be refunded automatically to your card.</>
          )}
        </p>
      )}
      <textarea
        className="field mt-3 min-h-16"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
      <div className="mt-3 flex gap-2">
        <button className="btn-primary bg-clay hover:bg-clay-dark px-4 py-2" disabled={busy} onClick={confirm}>
          {busy ? <Spinner /> : 'Cancel booking'}
        </button>
        <button className="btn-ghost px-4 py-2" disabled={busy} onClick={onClose}>Keep booking</button>
      </div>
    </div>
  )
}

function ReschedulePanel({
  booking, contact, onChange, onClose,
}: {
  booking: Booking; contact?: string; onChange: (b: Booking) => void; onClose: () => void
}) {
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsError, setSlotsError] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSlots(null); setSlotsError(false); setSlot(null)
    api.bookingAvailability(booking.serviceId, date, booking.staffId ?? undefined)
      .then((d) => setSlots(d.slots))
      .catch(() => setSlotsError(true))
  }, [booking.serviceId, booking.staffId, date])

  const confirm = async () => {
    if (!slot) { setError('Please pick a new time'); return }
    setBusy(true); setError(null)
    try {
      onChange(await api.customerRescheduleBooking(booking.publicBookingId, slot.start, contact))
    } catch (e) {
      setError(apiMessage(e, 'Could not reschedule the booking'))
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="text-sm font-medium">Pick a new time</p>
      <p className="mt-1 text-xs text-muted">
        Currently {formatDay(booking.appointmentStart)}, {formatTime(booking.appointmentStart)}.
      </p>
      <input
        className="field mt-3"
        type="date"
        min={todayISO()}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <div className="mt-3">
        {slots === null ? (
          <Spinner />
        ) : slotsError ? (
          <p className="text-sm text-muted">Couldn't load times — try another date.</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted">No open slots on this date — try a later date.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.start}
                type="button"
                onClick={() => setSlot(s)}
                className={`chip ${slot?.start === s.start ? 'bg-ink text-cream' : 'bg-ink/8 text-ink hover:bg-sand'}`}
              >
                {formatTime(s.start)}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
      <div className="mt-3 flex gap-2">
        <button className="btn-primary px-4 py-2" disabled={busy || !slot} onClick={confirm}>
          {busy ? <Spinner /> : 'Confirm new time'}
        </button>
        <button className="btn-ghost px-4 py-2" disabled={busy} onClick={onClose}>Back</button>
      </div>
    </div>
  )
}
