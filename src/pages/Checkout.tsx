import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { money, titleCase, effectivePrice } from '../lib/format'
import type { CustomerAddress, FulfillmentType, PaymentMethod, Quote } from '../lib/types'
import { EmptyState, ErrorNote, Spinner } from '../components/ui'

const PAYMENT_METHODS: PaymentMethod[] = ['INTERAC_ETRANSFER', 'CARD', 'BANK_TRANSFER', 'CASH']

export default function Checkout() {
  const { cart, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const fulfillmentOptions = useMemo<FulfillmentType[]>(
    () => Array.from(new Set(cart?.lines.map((l) => l.product.fulfillmentType) ?? [])),
    [cart],
  )

  const [form, setForm] = useState({
    customerName: user?.fullName ?? '',
    customerPhone: '',
    customerEmail: user?.email ?? '',
    customerHouseNumber: '',
    customerStreet: '',
    customerCity: '',
    customerPostcode: '',
    customerCountry: '',
    notes: '',
  })
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('INTERAC_ETRANSFER')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([])
  const [saveAddress, setSaveAddress] = useState(false)

  useEffect(() => {
    if (fulfillmentOptions.length === 1) setFulfillmentType(fulfillmentOptions[0])
  }, [fulfillmentOptions])

  // Logged-in customers: load saved addresses and prefill with their default.
  useEffect(() => {
    if (!user) return
    api.customerAddresses().then((list) => {
      setSavedAddresses(list)
      const def = list.find((a) => a.isDefault) ?? list[0]
      if (def) fillAddress(def)
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fillAddress = (a: CustomerAddress) =>
    setForm((f) => ({
      ...f,
      customerHouseNumber: a.address.houseNumber ?? '',
      customerStreet: a.address.street ?? '',
      customerCity: a.address.city ?? '',
      customerPostcode: a.address.postcode ?? '',
      customerCountry: a.address.country ?? '',
    }))

  // Live fee quote whenever fulfillment / payment / cart changes.
  useEffect(() => {
    if (!cart || !fulfillmentType) {
      setQuote(null)
      return
    }
    const body = {
      vendorId: cart.vendorId,
      items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      fulfillmentType,
      paymentMethod,
    }
    api.quote(body).then(setQuote).catch(() => setQuote(null))
  }, [cart, fulfillmentType, paymentMethod])

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState title="Your cart is empty" action={<Link to="/" className="btn-primary">Browse marketplace</Link>} />
      </div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fulfillmentType) {
      setError('Please choose a fulfillment option')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const order = await api.checkout({
        vendorId: cart.vendorId,
        items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        customerHouseNumber: form.customerHouseNumber || undefined,
        customerStreet: form.customerStreet || undefined,
        customerCity: form.customerCity || undefined,
        customerPostcode: form.customerPostcode || undefined,
        customerCountry: form.customerCountry || undefined,
        fulfillmentType,
        paymentMethod,
        sourceChannel: 'MARKETPLACE',
        notes: form.notes || undefined,
      })
      // Optionally save the entered address to the customer's address book (best-effort).
      if (saveAddress && user) {
        try {
          await api.addCustomerAddress({
            address: {
              houseNumber: form.customerHouseNumber || undefined,
              street: form.customerStreet || undefined,
              city: form.customerCity || undefined,
              postcode: form.customerPostcode || undefined,
              country: form.customerCountry || undefined,
            },
            makeDefault: savedAddresses.length === 0,
          })
        } catch { /* don't block the order on address-book save */ }
      }
      clear()
      navigate(`/order/${order.publicOrderId}`, { state: { order } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout failed. Please try again.')
      setSubmitting(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="mt-1 text-muted">Ordering from {cart.vendorName}</p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* Contact */}
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Full name</label>
                <input className="field" required value={form.customerName} onChange={set('customerName')} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="field" required placeholder="+1 204 555 0000" value={form.customerPhone} onChange={set('customerPhone')} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="field" type="email" value={form.customerEmail} onChange={set('customerEmail')} />
              </div>
            </div>
          </section>

          {/* Delivery address */}
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Delivery address</h2>
            <p className="mt-1 text-sm text-muted">Helps the vendor get your order to the right place.</p>
            {savedAddresses.length > 0 && (
              <div className="mt-4">
                <label className="label">Use a saved address</label>
                <select
                  className="field"
                  defaultValue={savedAddresses.find((a) => a.isDefault)?.id ?? ''}
                  onChange={(e) => {
                    const a = savedAddresses.find((x) => x.id === e.target.value)
                    if (a) fillAddress(a)
                  }}
                >
                  <option value="">New address…</option>
                  {savedAddresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.label || 'Address') + ' — ' + [a.address.street, a.address.city].filter(Boolean).join(', ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">House / flat number</label>
                <input className="field" value={form.customerHouseNumber} onChange={set('customerHouseNumber')} />
              </div>
              <div>
                <label className="label">Street</label>
                <input className="field" value={form.customerStreet} onChange={set('customerStreet')} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="field" value={form.customerCity} onChange={set('customerCity')} />
              </div>
              <div>
                <label className="label">Postcode</label>
                <input className="field" value={form.customerPostcode} onChange={set('customerPostcode')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Country</label>
                <input className="field" value={form.customerCountry} onChange={set('customerCountry')} />
              </div>
            </div>
            {user && (
              <label className="mt-4 flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this address to my account
              </label>
            )}
          </section>

          {/* Fulfillment */}
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Fulfillment</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fulfillmentOptions.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setFulfillmentType(t)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    fulfillmentType === t ? 'border-clay bg-clay/8' : 'border-line bg-cream hover:border-ink/30'
                  }`}
                >
                  <p className="font-medium">{titleCase(t)}</p>
                  <p className="text-xs text-muted">
                    {t === 'LOCAL_PICKUP' ? 'Collect from the vendor' : 'Fees applied at right'}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold">Payment method</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`chip border px-4 py-2 ${
                    paymentMethod === m ? 'border-clay bg-clay/10 text-clay-dark' : 'border-line text-muted'
                  }`}
                >
                  {titleCase(m)}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Payment is confirmed by the vendor after you place the order. Card &amp; Stripe add a processing fee.
            </p>
          </section>
        </div>

        {/* Order summary */}
        <aside className="card h-fit p-6">
          <h2 className="font-display text-xl font-semibold">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {cart.lines.map((l) => (
              <div key={l.product.id} className="flex justify-between">
                <span className="text-muted">
                  {l.quantity} × {l.product.name}
                </span>
                <span className="font-mono">{money(effectivePrice(l.product) * l.quantity)}</span>
              </div>
            ))}
          </div>
          <hr className="my-4 border-line" />
          {quote ? (
            <div className="space-y-2 text-sm">
              <Row label="Product subtotal" value={money(quote.productSubtotal)} />
              <Row label="Logistics fee" value={money(quote.logisticsFee)} />
              <Row label="Platform fee" value={money(quote.platformFee)} />
              <Row label="Processing fee" value={money(quote.processingFee)} />
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="font-mono">{money(quote.totalAmount)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {fulfillmentType ? 'Calculating fees…' : 'Select a fulfillment option to see the total.'}
            </p>
          )}

          {error && <div className="mt-4"><ErrorNote message={error} /></div>}

          <button type="submit" disabled={submitting || !quote} className="btn-primary mt-6 w-full">
            {submitting ? <Spinner /> : 'Place order'}
          </button>
        </aside>
      </form>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
