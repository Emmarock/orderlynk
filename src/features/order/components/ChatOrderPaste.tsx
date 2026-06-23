import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiMessage } from '@/shared/lib/api'
import { useAuth } from '@/shared/context/AuthContext'
import type { Address, DraftOrder, FulfillmentType, Order, PaymentMethod, Quote } from '@/shared/lib/types'
import { money, titleCase } from '@/shared/lib/format'
import { countryCode } from '@/shared/lib/countries'
import { CountrySelect, ErrorNote, Spinner } from '@/shared/components/ui'
import AddressAutocomplete from '@/shared/components/AddressAutocomplete'

/**
 * "New order from chat": paste a WhatsApp/Instagram conversation, parse it into a structured draft,
 * review/edit it, then create the order. Creating reuses the vendor-side checkout — it's a guest
 * order attributed to the customer, forced onto the acting vendor server-side.
 */

const FULFILLMENT_OPTIONS: FulfillmentType[] = ['LOCAL_PICKUP', 'LOCAL_DELIVERY', 'DOMESTIC_SHIPPING']
const PAYMENT_OPTIONS: PaymentMethod[] = ['BANK_TRANSFER', 'CASH', 'INTERAC_ETRANSFER', 'OTHER', 'CARD']

/** Fulfillment types that need a destination address for a shipping/delivery rate. */
const NEEDS_ADDRESS: FulfillmentType[] = ['LOCAL_DELIVERY', 'DOMESTIC_SHIPPING']

/** Editable line — keeps the matched product id but lets the vendor tweak quantity / drop it. */
type Line = { productId: string; productName: string; quantity: number }

const EMPTY_ADDRESS = {
  houseNumber: '',
  street: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
}
type AddressForm = typeof EMPTY_ADDRESS

export default function ChatOrderPaste({ onCreated }: { onCreated?: (order: Order) => void }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<DraftOrder | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  // Editable review form, populated from the draft.
  const [lines, setLines] = useState<Line[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('LOCAL_PICKUP')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS)
  const [notes, setNotes] = useState('')

  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<Order | null>(null)

  // Live fee/total quote, recomputed (debounced) as the vendor edits items, fulfillment or address.
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoting, setQuoting] = useState(false)

  useEffect(() => {
    if (!draft || lines.length === 0 || !user?.vendorId) {
      setQuote(null)
      return
    }
    setQuoting(true)
    const handle = setTimeout(() => {
      api
        .quote({
          vendorId: user.vendorId,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          fulfillmentType,
          paymentMethod,
          customerHouseNumber: address.houseNumber || undefined,
          customerStreet: address.street || undefined,
          customerCity: address.city || undefined,
          customerState: address.state || undefined,
          customerPostcode: address.postcode || undefined,
          customerCountry: address.country || undefined,
        })
        .then(setQuote)
        .catch(() => setQuote(null))
        .finally(() => setQuoting(false))
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, lines, fulfillmentType, paymentMethod, address])

  function resetAll() {
    setText('')
    setDraft(null)
    setError('')
    setLines([])
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setFulfillmentType('LOCAL_PICKUP')
    setPaymentMethod('BANK_TRANSFER')
    setAddress(EMPTY_ADDRESS)
    setNotes('')
    setQuote(null)
    setCreated(null)
  }

  async function parse() {
    setParsing(true)
    setError('')
    setDraft(null)
    setCreated(null)
    try {
      const d = await api.parseChatOrder(text)
      setDraft(d)
      // Seed the editable form from the parse.
      setLines(d.items.map((it) => ({ productId: it.productId, productName: it.productName, quantity: it.quantity })))
      setCustomerName(d.customerName ?? '')
      setCustomerPhone(d.customerPhone ?? '')
      setCustomerEmail(d.customerEmail ?? '')
      setFulfillmentType(d.fulfillmentType ?? 'LOCAL_PICKUP')
      setAddress({
        houseNumber: d.customerHouseNumber ?? '',
        street: d.customerStreet ?? '',
        city: d.customerCity ?? '',
        state: d.customerState ?? '',
        postcode: d.customerPostcode ?? '',
        country: d.customerCountry ?? '',
      })
      setNotes(d.notes ?? '')
    } catch (e) {
      setError(apiMessage(e, 'Could not parse that chat — try again.'))
    } finally {
      setParsing(false)
    }
  }

  function setQty(productId: string, quantity: number) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l)))
  }
  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const needsAddress = NEEDS_ADDRESS.includes(fulfillmentType)
  const addressOk = !needsAddress || (address.street.trim() !== '' && address.city.trim() !== '')
  const canCreate =
    lines.length > 0 && customerName.trim() !== '' && customerPhone.trim() !== '' && addressOk && !creating

  const setAddr = (k: keyof AddressForm) => (e: { target: { value: string } }) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }))

  async function create() {
    setCreating(true)
    setError('')
    try {
      const order = await api.vendorCreateOrder({
        vendorId: user?.vendorId, // server forces this onto the acting vendor regardless
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || null,
        customerHouseNumber: address.houseNumber.trim() || null,
        customerStreet: address.street.trim() || null,
        customerCity: address.city.trim() || null,
        customerState: address.state.trim() || null,
        customerPostcode: address.postcode.trim() || null,
        customerCountry: address.country.trim() || null,
        fulfillmentType,
        paymentMethod,
        sourceChannel: 'WHATSAPP',
        notes: notes.trim() || null,
      })
      setCreated(order)
      setDraft(null)
      onCreated?.(order)
    } catch (e) {
      setError(apiMessage(e, 'Could not create the order — check the details and try again.'))
    } finally {
      setCreating(false)
    }
  }

  if (!open) {
    return (
      <button className="btn-ghost" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        New order from chat
      </button>
    )
  }

  return (
    <div className="card w-full max-w-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">New order from chat</p>
          <p className="text-sm text-muted">Paste a WhatsApp or Instagram conversation — we'll draft the order.</p>
        </div>
        <button className="btn-quiet px-2 text-sm" onClick={() => { resetAll(); setOpen(false) }}>
          Close
        </button>
      </div>

      {/* Success state */}
      {created ? (
        <div className="mt-5 rounded-2xl border border-forest/30 bg-forest/5 p-5">
          <p className="font-display text-lg font-semibold text-forest">Order created</p>
          <p className="mt-1 text-sm text-muted">
            <span className="font-mono font-semibold text-ink">{created.publicOrderId}</span> · {created.customerName}
          </p>
          <div className="mt-4 flex gap-2">
            <Link to={`/vendor/manage/orders/${created.id}`} className="btn-primary">View order</Link>
            <button className="btn-ghost" onClick={resetAll}>New order from chat</button>
          </div>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Customer: hi! can I get 2 jollof kits and a bottle of pepper sauce\nMe: sure! pickup or delivery?\nCustomer: pickup. name is Ada, 0803...'}
            rows={5}
            className="field mt-4 resize-y font-mono text-[13px] leading-relaxed"
          />
          <div className="mt-3 flex items-center gap-2">
            <button className="btn-primary" onClick={parse} disabled={parsing || !text.trim()}>
              {parsing ? <><Spinner className="h-4 w-4" /> Parsing…</> : draft ? 'Re-parse' : 'Parse order'}
            </button>
            {(text || draft) && (
              <button className="btn-quiet text-sm" onClick={resetAll} disabled={parsing}>Clear</button>
            )}
          </div>

          {error && <div className="mt-4"><ErrorNote message={error} /></div>}

          {draft && (
            <div className="mt-5 space-y-5 border-t border-line pt-5">
              {/* Editable line items */}
              <div>
                <p className="label">Items</p>
                {lines.length === 0 ? (
                  <p className="text-sm text-muted">No catalogue items — add at least one to create an order.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {lines.map((l) => (
                      <li key={l.productId} className="flex items-center gap-3 rounded-xl bg-sand px-3 py-2 text-sm">
                        <input
                          type="number"
                          min={1}
                          value={l.quantity}
                          onChange={(e) => setQty(l.productId, parseInt(e.target.value || '1', 10))}
                          className="field h-8 w-16 px-2 py-1 text-sm"
                          aria-label={`Quantity for ${l.productName}`}
                        />
                        <span className="flex-1">{l.productName}</span>
                        <button className="btn-quiet px-2 text-xs" onClick={() => removeLine(l.productId)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                {draft.unmatched.length > 0 && (
                  <p className="mt-2 text-xs text-clay">
                    Not added (not in your catalogue): {draft.unmatched.join(', ')}
                  </p>
                )}
              </div>

              {/* Customer + order details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Customer name *</span>
                  <input className="field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Phone *</span>
                  <input className="field" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Email</span>
                  <input className="field" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Fulfillment</span>
                  <select className="field" value={fulfillmentType} onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}>
                    {FULFILLMENT_OPTIONS.map((f) => <option key={f} value={f}>{titleCase(f)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Payment method</span>
                  <select className="field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                    {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
                  </select>
                </label>
              </div>

              {/* Delivery address — only needed (and required) for delivery/shipping fulfillment. */}
              {needsAddress && (
                <div className="rounded-2xl border border-line bg-sand/40 p-4">
                  <p className="label">Delivery address</p>
                  <AddressAutocomplete
                    country={countryCode(address.country)}
                    onSelect={(addr: Address) =>
                      setAddress({
                        houseNumber: addr.houseNumber ?? '',
                        street: addr.street ?? '',
                        city: addr.city ?? '',
                        state: addr.state ?? '',
                        postcode: addr.postcode ?? '',
                        country: addr.country ?? '',
                      })
                    }
                  />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="label">House / flat number</span>
                      <input className="field" value={address.houseNumber} onChange={setAddr('houseNumber')} />
                    </label>
                    <label className="block">
                      <span className="label">Street *</span>
                      <input className="field" value={address.street} onChange={setAddr('street')} />
                    </label>
                    <label className="block">
                      <span className="label">City *</span>
                      <input className="field" value={address.city} onChange={setAddr('city')} />
                    </label>
                    <label className="block">
                      <span className="label">State / province</span>
                      <input className="field" placeholder="e.g. MB" value={address.state} onChange={setAddr('state')} />
                    </label>
                    <label className="block">
                      <span className="label">Postcode</span>
                      <input className="field" value={address.postcode} onChange={setAddr('postcode')} />
                    </label>
                    <label className="block">
                      <span className="label">Country</span>
                      <CountrySelect value={address.country} onChange={(v) => setAddress((a) => ({ ...a, country: v }))} />
                    </label>
                  </div>
                </div>
              )}

              <label className="block">
                <span className="label">Notes</span>
                <textarea className="field resize-y" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>

              {/* Live price breakdown — recomputed as items/fulfillment/address change. */}
              {(quote || quoting) && (
                <div className="rounded-2xl border border-line bg-cream p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="label mb-0">Order total</p>
                    {quoting && <span className="text-xs text-muted">Calculating…</span>}
                  </div>
                  {quote && (
                    <div className="space-y-1.5 text-sm">
                      <Row label="Product subtotal" value={money(quote.productSubtotal, quote.currency)} />
                      <Row
                        label={
                          quote.liveShippingRate && quote.shippingCarrier
                            ? `Shipping (${quote.shippingCarrier}${quote.shippingService ? ' · ' + quote.shippingService : ''})`
                            : fulfillmentType === 'LOCAL_PICKUP' ? 'Logistics' : 'Shipping (flat rate)'
                        }
                        value={money(quote.logisticsFee, quote.currency)}
                      />
                      <Row label="Platform fee" value={money(quote.platformFee, quote.currency)} />
                      <Row label="Processing fee" value={money(quote.processingFee, quote.currency)} />
                      <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-semibold">
                        <span>Total</span>
                        <span className="font-mono">{money(quote.totalAmount, quote.currency)}</span>
                      </div>
                      {quote.liveShippingRate && quote.shippingEstimatedDays != null && (
                        <p className="pt-1 text-xs text-muted">Est. {quote.shippingEstimatedDays} days in transit</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button className="btn-primary" onClick={create} disabled={!canCreate}>
                  {creating ? <><Spinner className="h-4 w-4" /> Creating…</> : 'Create order'}
                </button>
                <p className="text-xs text-muted">
                  Creates a pending order attributed to the customer. Confirm price &amp; payment with them.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  )
}
