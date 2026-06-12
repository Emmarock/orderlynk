import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import type { Booking } from '../lib/types'
import { money, formatDay, formatTime } from '../lib/format'
import { BookingBadge, ErrorNote, PaymentBadge, SectionTitle, Spinner } from '../components/ui'
import { BookingPayment } from '../components/BookingPayment'
import { stripePromise } from '../lib/stripe'
import type { PaymentInit } from '../lib/types'

export default function TrackBooking() {
  const [publicId, setPublicId] = useState('')
  const [contact, setContact] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      setBooking(await api.trackBooking(publicId.trim(), contact.trim()))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking not found')
      setBooking(null)
    } finally { setLoading(false) }
  }

  const reviewable = booking && ['COMPLETED', 'BALANCE_PENDING', 'CLOSED'].includes(booking.status)

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <SectionTitle eyebrow="Bookings" title="Track your booking" />

      <form onSubmit={lookup} className="card grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div><label className="label">Booking reference</label><input className="field" required value={publicId} onChange={(e) => setPublicId(e.target.value)} placeholder="SB-260601-1234" /></div>
        <div><label className="label">Phone or email</label><input className="field" required value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <button className="btn-primary" disabled={loading}>{loading ? <Spinner /> : 'Find'}</button>
      </form>

      {error && <div className="mt-6"><ErrorNote message={error} /></div>}

      {booking && (
        <div className="card mt-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-muted">{booking.publicBookingId}</p>
              <h2 className="font-display text-xl font-semibold">{booking.serviceName}</h2>
              <p className="text-sm text-muted">with {booking.vendorName}</p>
            </div>
            <BookingBadge status={booking.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
            <div><dt className="text-muted">When</dt><dd>{formatDay(booking.appointmentStart)}, {formatTime(booking.appointmentStart)}</dd></div>
            <div><dt className="text-muted">Payment</dt><dd><PaymentBadge status={booking.paymentStatus} /></dd></div>
            <div><dt className="text-muted">Total</dt><dd className="font-mono">{money(booking.totalAmount, booking.currency)}</dd></div>
            <div><dt className="text-muted">Balance due</dt><dd className="font-mono">{money(booking.balanceDue, booking.currency)}</dd></div>
          </dl>

          <PayablePanel booking={booking} contact={contact} onPaid={() => api.trackBooking(booking.publicBookingId, contact).then(setBooking).catch(() => {})} />


          {reviewable && (
            booking.review
              ? <p className="mt-4 text-sm text-forest">Thanks for your {booking.review.rating}★ review!</p>
              : <ReviewForm booking={booking} contact={contact} onReviewed={(b) => setBooking(b)} />
          )}
        </div>
      )}
    </div>
  )
}

/** Shows a "Pay by card" action when a deposit or balance is outstanding, then the Stripe form. */
function PayablePanel({ booking, contact, onPaid }: { booking: Booking; contact: string; onPaid: () => void }) {
  const [init, setInit] = useState<PaymentInit | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const depositPhase = booking.status === 'DEPOSIT_PENDING'
  const balancePhase = booking.balanceDue > 0 &&
    ['CONFIRMED', 'REMINDER_SENT', 'IN_PROGRESS', 'COMPLETED', 'BALANCE_PENDING'].includes(booking.status)
  const amount = depositPhase ? booking.depositAmount : booking.balanceDue
  if (!depositPhase && !balancePhase) return null

  const label = depositPhase ? 'deposit' : 'balance'

  const start = async () => {
    setBusy(true); setError(null)
    try {
      setInit(await api.payBooking(booking.publicBookingId, contact))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start payment')
    } finally { setBusy(false) }
  }

  if (done) {
    return <p className="mt-3 rounded-lg bg-forest/12 px-3 py-2 text-sm text-forest">Payment received — your booking will update shortly.</p>
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4">
      <p className="text-sm">Outstanding {label}: <span className="font-semibold">{money(amount, booking.currency)}</span></p>
      {!init ? (
        <>
          {stripePromise ? (
            <button className="btn-primary mt-3" onClick={start} disabled={busy}>
              {busy ? <Spinner /> : `Pay ${label} by card`}
            </button>
          ) : (
            <p className="mt-2 text-xs text-muted">Card payments aren’t configured — contact the provider to pay another way.</p>
          )}
          {error && <div className="mt-3"><ErrorNote message={error} /></div>}
        </>
      ) : (
        <div className="mt-3">
          <BookingPayment clientSecret={init.clientSecret} amountLabel={money(init.amount, init.currency)} onPaid={() => { setDone(true); onPaid() }} />
        </div>
      )}
    </div>
  )
}

function ReviewForm({ booking, contact, onReviewed }: { booking: Booking; contact: string; onReviewed: (b: Booking) => void }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const review = await api.reviewBooking(booking.publicBookingId, { rating, comment: comment || undefined }, contact)
      onReviewed({ ...booking, review })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit review')
    } finally { setBusy(false) }
  }

  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="label">Leave a review</p>
      <div className="mb-3 flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? 'text-gold' : 'text-line'} aria-label={`${n} stars`}>★</button>
        ))}
      </div>
      <textarea className="field min-h-20" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" />
      {error && <div className="mt-3"><ErrorNote message={error} /></div>}
      <button className="btn-primary mt-3" onClick={submit} disabled={busy}>{busy ? <Spinner /> : 'Submit review'}</button>
    </div>
  )
}
