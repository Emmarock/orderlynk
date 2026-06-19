import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import type { Booking, ServiceOffering, ServiceStorefront, Slot } from '@/shared/lib/types'
import { money, titleCase, formatDay, formatTime, serviceStartingPrice } from '@/shared/lib/format'
import { ErrorNote, PageLoader, SectionTitle, Spinner } from '@/shared/components/ui'
import { BookingPayment } from '@/features/booking/components/BookingPayment'
import AddressAutocomplete from '@/shared/components/AddressAutocomplete'

export default function ServiceProvider() {
  const { slug = '' } = useParams()
  const [store, setStore] = useState<ServiceStorefront | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [booking, setBooking] = useState<ServiceOffering | null>(null)

  useEffect(() => {
    api.serviceStorefront(slug).then(setStore).catch(() => setNotFound(true))
  }, [slug])

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="font-display text-2xl">Provider not found</p>
        <Link to="/services" className="btn-primary mt-6 inline-flex">Back to services</Link>
      </div>
    )
  }
  if (!store) return <PageLoader />

  return (
    <div>
      <div className="h-44 bg-sand bg-cover bg-center sm:h-56" style={store.bannerUrl ? { backgroundImage: `url(${store.bannerUrl})` } : undefined} />
      <div className="mx-auto max-w-5xl px-5">
        <div className="-mt-12 flex flex-wrap items-end gap-4">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.businessName} className="h-24 w-24 rounded-2xl border-4 border-cream object-cover" />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-cream bg-ink text-3xl text-cream">{store.businessName.charAt(0)}</span>
          )}
          <div className="pb-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{store.businessName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
              {store.rating ? <span><span className="text-gold">★</span> {store.rating.toFixed(1)} ({store.ratingCount})</span> : <span>No reviews yet</span>}
              {store.city && <span>· {store.city}</span>}
              {store.profile.serviceArea && <span>· {store.profile.serviceArea}</span>}
              <span>· {titleCase(store.profile.locationType)}</span>
            </div>
          </div>
        </div>

        {store.description && <p className="mt-6 max-w-2xl text-muted">{store.description}</p>}
        {store.profile.bio && <p className="mt-2 max-w-2xl text-muted">{store.profile.bio}</p>}

        {(store.profile.cancellationPolicy || store.profile.depositPolicy || store.profile.businessHoursSummary) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {store.profile.businessHoursSummary && <Policy label="Hours" text={store.profile.businessHoursSummary} />}
            {store.profile.depositPolicy && <Policy label="Deposits" text={store.profile.depositPolicy} />}
            {store.profile.cancellationPolicy && <Policy label="Cancellation" text={store.profile.cancellationPolicy} />}
          </div>
        )}

        <div className="py-10">
          <SectionTitle title="Services" />
          {store.services.length === 0 ? (
            <p className="text-muted">This provider hasn't published any services yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {store.services.map((s) => (
                <div key={s.id} className="card flex flex-col gap-2 overflow-hidden p-5">
                  {s.imageUrl && (
                    <img src={s.imageUrl} alt={s.name} className="-mx-5 -mt-5 mb-1 h-40 w-[calc(100%+2.5rem)] object-cover" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">{s.name}</p>
                      <p className="text-xs uppercase tracking-wider text-muted">{titleCase(s.category)} · {s.durationMinutes} min</p>
                    </div>
                    <span className="font-mono font-semibold">
                      {serviceStartingPrice(s).from ? 'from ' : ''}{money(serviceStartingPrice(s).amount, s.currency)}
                    </span>
                  </div>
                  {s.description && <p className="text-sm text-muted">{s.description}</p>}
                  {s.variants.filter((v) => v.active).length > 0 && (
                    <p className="text-xs text-muted">{s.variants.filter((v) => v.active).length} options</p>
                  )}
                  {s.depositType !== 'NONE' && s.depositAmount > 0 && (
                    <span className="chip mt-1 self-start bg-clay/12 font-medium text-clay-dark">
                      {money(s.depositAmount, s.currency)} deposit to book
                    </span>
                  )}
                  <button className="btn-primary mt-2 self-start" onClick={() => setBooking(s)}>Book now</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {store.reviews.length > 0 && (
          <div className="pb-16">
            <SectionTitle title="Reviews" />
            <div className="grid gap-3 sm:grid-cols-2">
              {store.reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <p className="text-gold">{'★'.repeat(r.rating)}<span className="text-line">{'★'.repeat(5 - r.rating)}</span></p>
                  {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
                  <p className="mt-2 text-xs text-muted">{formatDay(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {booking && store && (
        <BookingModal store={store} service={booking} onClose={() => setBooking(null)} />
      )}
    </div>
  )
}

function Policy({ label, text }: { label: string; text: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  )
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** Add days to a YYYY-MM-DD string, timezone-safe (treats the value as a plain calendar date). */
function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function BookingModal({ store, service, onClose }: { store: ServiceStorefront; service: ServiceOffering; onClose: () => void }) {
  const [date, setDate] = useState(todayISO())
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsError, setSlotsError] = useState(false)
  const [slot, setSlot] = useState<Slot | null>(null)
  // Auto-scan forward to the first day that has openings, so opening on "today" (often blocked by
  // the lead-time window) doesn't look empty. Disabled once the customer picks a date themselves.
  const auto = useRef({ active: true, tries: 0 })
  const maxScanDays = Math.min(store.profile.maxAdvanceDays ?? 30, 21)
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({})
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)
  const [paid, setPaid] = useState(false)
  // For HYBRID providers the customer chooses where the service happens; default to the provider.
  const [atCustomer, setAtCustomer] = useState(false)
  // Sub-services: when the service defines variants the customer must pick one; it sets the base price.
  const activeVariants = useMemo(() => (service.variants ?? []).filter((v) => v.active), [service.variants])
  const [variantId, setVariantId] = useState(activeVariants[0]?.id ?? '')
  const variant = activeVariants.find((v) => v.id === variantId) ?? null
  const basePrice = variant ? variant.price : service.basePrice
  const fromPrice = activeVariants.length ? Math.min(...activeVariants.map((v) => v.price)) : service.basePrice

  const isHybrid = service.locationType === 'HYBRID'
  const atCustomerLocation = service.locationType === 'CUSTOMER_LOCATION' || (isHybrid && atCustomer)
  const needsAddress = atCustomerLocation
  const travelFee = atCustomerLocation ? service.customerLocationFee || 0 : 0

  useEffect(() => {
    let cancelled = false
    setSlots(null); setSlot(null); setSlotsError(false)
    api.bookingAvailability(service.id, date)
      .then((d) => {
        if (cancelled) return
        // No openings on this date — quietly roll forward to the next day until we find some.
        if (d.slots.length === 0 && auto.current.active && auto.current.tries < maxScanDays) {
          auto.current.tries += 1
          setDate(addDays(date, 1))
          return
        }
        auto.current.active = false
        setSlots(d.slots)
      })
      .catch(() => {
        if (cancelled) return
        auto.current.active = false
        setSlots([])
        setSlotsError(true)
      })
    return () => { cancelled = true }
  }, [service.id, date, maxScanDays])

  const estimate = useMemo(() => {
    let price = basePrice
    for (const a of service.addOns) price += (a.priceDelta || 0) * (addOnQty[a.id] || (a.required ? 1 : 0))
    const tax = price * (service.taxRate || 0)
    return { price, tax, total: price + travelFee + tax }
  }, [service, basePrice, addOnQty, travelFee])

  // Deposit due to confirm, mirroring the backend (computed from the gross total).
  const depositDue = useMemo(() => {
    const total = estimate.total
    switch (service.depositType) {
      case 'FIXED': return Math.min(service.depositValue || 0, total)
      case 'PERCENTAGE': return +(total * (service.depositValue || 0) / 100).toFixed(2)
      case 'FULL': return total
      default: return 0
    }
  }, [service.depositType, service.depositValue, estimate.total])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot) { setError('Please pick a time slot'); return }
    setSubmitting(true); setError(null)
    try {
      const created = await api.createBooking({
        vendorId: store.vendorId,
        serviceId: service.id,
        serviceVariantId: variant ? variant.id : undefined,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        appointmentStart: slot.start,
        addOns: Object.entries(addOnQty).filter(([, q]) => q > 0).map(([addOnId, quantity]) => ({ addOnId, quantity })),
        locationType: isHybrid ? (atCustomer ? 'CUSTOMER_LOCATION' : 'AT_PROVIDER') : undefined,
        customerHouseNumber: needsAddress ? houseNumber : undefined,
        customerStreet: needsAddress ? street : undefined,
        customerCity: needsAddress ? city : undefined,
        sourceChannel: 'MARKETPLACE',
        notes: notes || undefined,
      })
      setConfirmed(created)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit booking')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[92vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        {confirmed ? (
          <div className="text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-forest/12 text-forest">✓</div>
            <h2 className="font-display text-2xl font-semibold">
              {confirmed.status === 'REQUESTED'
                ? 'Booking requested'
                : confirmed.status === 'DEPOSIT_PENDING' && !paid
                  ? 'Pay deposit to confirm'
                  : 'Booking confirmed'}
            </h2>
            <p className="mt-1 text-muted">Reference <span className="font-mono">{confirmed.publicBookingId}</span></p>
            <div className="mt-4 rounded-xl border border-line bg-sand/40 p-4 text-left text-sm">
              <p>{service.name}{confirmed.variantName ? ` — ${confirmed.variantName}` : ''} · {formatDay(confirmed.appointmentStart)}, {formatTime(confirmed.appointmentStart)}</p>
              <p className="mt-1 text-muted">Total {money(confirmed.totalAmount, confirmed.currency)}</p>
              {confirmed.status === 'REQUESTED' && <p className="mt-2">We've sent your request to {store.businessName}. You'll hear back once it's approved.</p>}
              {confirmed.status === 'DEPOSIT_PENDING' && !paid && <p className="mt-2">Please pay the {money(confirmed.depositAmount, confirmed.currency)} deposit to lock your time.</p>}
              {confirmed.status === 'CONFIRMED' && <p className="mt-2">You're all set — see you then!</p>}
            </div>

            {confirmed.status === 'DEPOSIT_PENDING' && confirmed.clientSecret && !paid && (
              <div className="mt-4 text-left">
                <BookingPayment
                  clientSecret={confirmed.clientSecret}
                  amountLabel={money(confirmed.depositAmount, confirmed.currency)}
                  onPaid={() => setPaid(true)}
                />
              </div>
            )}
            {paid && <p className="mt-4 rounded-lg bg-forest/12 px-3 py-2 text-sm text-forest">Deposit received — your booking is being confirmed.</p>}

            <div className="mt-5 flex justify-center gap-2">
              <Link to="/bookings/track" className="btn-quiet">Track booking</Link>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Book {service.name}</h2>
              <p className="text-sm text-muted">
                {(variant?.durationMinutes ?? service.durationMinutes)} min · from {money(fromPrice, service.currency)}
              </p>
            </div>

            {activeVariants.length > 0 && (
              <div className="rounded-xl border border-line bg-sand/40 p-4">
                <p className="label !mb-2">Choose an option</p>
                <div className="space-y-2">
                  {activeVariants.map((v) => (
                    <label
                      key={v.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition ${variantId === v.id ? 'border-ink bg-ink/5' : 'border-line bg-cream hover:bg-sand'}`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="variant"
                          className="accent-clay"
                          checked={variantId === v.id}
                          onChange={() => setVariantId(v.id)}
                        />
                        <span>{v.name} <span className="text-muted">· {v.durationMinutes}m</span></span>
                      </span>
                      <span className="font-medium">{money(v.price, service.currency)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {service.addOns.filter((a) => a.active).length > 0 && (
              <div className="rounded-xl border border-line bg-sand/40 p-4">
                <p className="label !mb-2">Add-ons</p>
                <div className="space-y-2">
                  {service.addOns.filter((a) => a.active).map((a) => (
                    <label key={a.id} className="flex items-center justify-between text-sm">
                      <span>{a.name} <span className="text-muted">+{money(a.priceDelta, service.currency)}{a.durationDelta ? ` · +${a.durationDelta}m` : ''}</span>{a.required && <span className="ml-1 text-xs text-clay">required</span>}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-clay"
                        disabled={a.required}
                        checked={a.required || (addOnQty[a.id] || 0) > 0}
                        onChange={(e) => setAddOnQty((q) => ({ ...q, [a.id]: e.target.checked ? 1 : 0 }))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Date</label>
              <input className="field" type="date" min={todayISO()} value={date}
                     onChange={(e) => { auto.current.active = false; setDate(e.target.value) }} />
            </div>

            <div>
              <label className="label">Available times</label>
              {slots === null ? (
                <div className="py-3"><Spinner /></div>
              ) : slotsError ? (
                <p className="text-sm text-clay">Couldn't load times right now — please try again in a moment.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted">No open slots on this date — try a later date.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s) => (
                    <button
                      type="button"
                      key={s.start}
                      onClick={() => setSlot(s)}
                      className={`chip ${slot?.start === s.start ? 'bg-ink text-cream' : 'bg-ink/8 text-ink hover:bg-sand'}`}
                    >
                      {formatTime(s.start)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Your name</label><input className="field" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="field" required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><label className="label">Email (optional)</label><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            </div>

            {isHybrid && (
              <div>
                <label className="label">Where should this happen?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAtCustomer(false)}
                    className={`rounded-xl border p-3 text-left text-sm transition ${!atCustomer ? 'border-ink bg-ink/5' : 'border-line hover:bg-sand'}`}
                  >
                    <span className="block font-medium">At the provider</span>
                    <span className="block text-xs text-muted">Come to {store.businessName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAtCustomer(true)}
                    className={`rounded-xl border p-3 text-left text-sm transition ${atCustomer ? 'border-ink bg-ink/5' : 'border-line hover:bg-sand'}`}
                  >
                    <span className="block font-medium">At my location</span>
                    <span className="block text-xs text-muted">
                      {service.customerLocationFee > 0
                        ? `+${money(service.customerLocationFee, service.currency)} travel`
                        : 'No travel fee'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {needsAddress && (
              <div className="rounded-xl border border-line bg-sand/40 p-4">
                <p className="label !mb-2">Your address (service at your location)</p>
                <AddressAutocomplete
                  label="Search your address"
                  onSelect={(addr) => {
                    setHouseNumber(addr.houseNumber ?? '')
                    setStreet(addr.street ?? '')
                    setCity(addr.city ?? '')
                  }}
                />
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div><label className="label">No.</label><input className="field" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} /></div>
                  <div className="col-span-2"><label className="label">Street</label><input className="field" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
                  <div className="col-span-3"><label className="label">City</label><input className="field" value={city} onChange={(e) => setCity(e.target.value)} /></div>
                </div>
              </div>
            )}

            <div><label className="label">Notes (optional)</label><textarea className="field min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>

            <div className="space-y-1.5 rounded-xl border border-line bg-sand/40 px-4 py-3 text-sm">
              {travelFee > 0 && (
                <>
                  <div className="flex items-center justify-between text-muted">
                    <span>Service</span>
                    <span className="font-mono">{money(estimate.price + estimate.tax, service.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Travel to your location</span>
                    <span className="font-mono">{money(travelFee, service.currency)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted">Estimated total</span>
                <span className="font-mono font-semibold">{money(estimate.total, service.currency)}</span>
              </div>
            </div>

            {service.depositType !== 'NONE' && depositDue > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3">
                <span aria-hidden className="text-base leading-5 text-clay">●</span>
                <p className="text-sm text-ink">
                  <span className="font-semibold text-clay-dark">
                    {money(depositDue, service.currency)} deposit required
                  </span>{' '}
                  to confirm this booking — you'll pay it securely after booking
                  {service.depositType === 'FULL' ? '.' : '. The balance is due at your appointment.'}
                </p>
              </div>
            )}

            {error && <ErrorNote message={error} />}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn-primary" disabled={submitting || !slot || !name.trim() || !phone.trim() || (needsAddress && (!street.trim() || !city.trim()))}>{submitting ? <Spinner /> : 'Confirm booking'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
