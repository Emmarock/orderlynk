import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { money, titleCase, effectivePrice } from '../lib/format'
import type { CustomerAddress, FulfillmentType, PaymentMethod, Quote, RateOption } from '../lib/types'
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
    customerState: '',
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

  // Live carrier shipping options (only for DOMESTIC_SHIPPING).
  const [shippingRates, setShippingRates] = useState<RateOption[] | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const [selectedRateToken, setSelectedRateToken] = useState<string>('')

  const isShipping = fulfillmentType === 'DOMESTIC_SHIPPING'
  // Enough of a destination to ask a carrier for rates.
  const destinationReady =
    form.customerCountry.trim() !== '' &&
    (form.customerPostcode.trim() !== '' || form.customerCity.trim() !== '')

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
      customerState: a.address.state ?? '',
      customerPostcode: a.address.postcode ?? '',
      customerCountry: a.address.country ?? '',
    }))

  // Live fee quote whenever fulfillment / payment / cart / chosen shipping rate changes.
  // The address is read at call time; for shipping the total updates when a rate is selected.
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
      customerHouseNumber: form.customerHouseNumber || undefined,
      customerStreet: form.customerStreet || undefined,
      customerCity: form.customerCity || undefined,
      customerState: form.customerState || undefined,
      customerPostcode: form.customerPostcode || undefined,
      customerCountry: form.customerCountry || undefined,
      customerName: form.customerName || undefined,
      customerPhone: form.customerPhone || undefined,
      customerEmail: form.customerEmail || undefined,
      shippingServiceToken: selectedRateToken || undefined,
    }
    api.quote(body).then(setQuote).catch(() => setQuote(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, fulfillmentType, paymentMethod, selectedRateToken])

  // Fetch live carrier rates for shipping orders, debounced on destination changes.
  useEffect(() => {
    if (!cart || !isShipping || !destinationReady) {
      setShippingRates(null)
      setRatesError(null)
      setSelectedRateToken('')
      return
    }
    setRatesLoading(true)
    setRatesError(null)
    const handle = setTimeout(() => {
      api
        .shippingRates({
          vendorId: cart.vendorId,
          items: cart.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          destination: {
            houseNumber: form.customerHouseNumber || undefined,
            street: form.customerStreet || undefined,
            city: form.customerCity || undefined,
            state: form.customerState || undefined,
            postcode: form.customerPostcode || undefined,
            country: form.customerCountry || undefined,
          },
          customerName: form.customerName || undefined,
          customerPhone: form.customerPhone || undefined,
          customerEmail: form.customerEmail || undefined,
        })
        .then((res) => {
          setShippingRates(res.rates)
          // Auto-select the cheapest (rates arrive sorted by price) so the total reflects a real rate.
          setSelectedRateToken((cur) =>
            res.rates.some((r) => r.serviceToken === cur) ? cur : res.rates[0]?.serviceToken ?? '',
          )
          if (res.rates.length === 0) setRatesError('No carrier rates for this destination — a flat fee applies.')
        })
        .catch(() => {
          setShippingRates([])
          setSelectedRateToken('')
          setRatesError('Live rates are unavailable right now — a flat shipping fee will apply.')
        })
        .finally(() => setRatesLoading(false))
    }, 600)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cart, isShipping, destinationReady,
    form.customerHouseNumber, form.customerStreet, form.customerCity,
    form.customerState, form.customerPostcode, form.customerCountry,
  ])

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
        customerState: form.customerState || undefined,
        customerPostcode: form.customerPostcode || undefined,
        customerCountry: form.customerCountry || undefined,
        fulfillmentType,
        paymentMethod,
        sourceChannel: 'MARKETPLACE',
        notes: form.notes || undefined,
        shippingServiceToken: isShipping ? selectedRateToken || undefined : undefined,
      })
      // Optionally save the entered address to the customer's address book (best-effort).
      if (saveAddress && user) {
        try {
          await api.addCustomerAddress({
            address: {
              houseNumber: form.customerHouseNumber || undefined,
              street: form.customerStreet || undefined,
              city: form.customerCity || undefined,
              state: form.customerState || undefined,
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
                <label className="label">State / province</label>
                <input className="field" placeholder="e.g. MB" value={form.customerState} onChange={set('customerState')} />
              </div>
              <div>
                <label className="label">Postcode</label>
                <input className="field" value={form.customerPostcode} onChange={set('customerPostcode')} />
              </div>
              <div>
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

          {/* Shipping options (live carrier rates) */}
          {isShipping && (
            <section className="card p-6">
              <h2 className="font-display text-xl font-semibold">Shipping options</h2>
              {!destinationReady ? (
                <p className="mt-2 text-sm text-muted">
                  Enter your delivery address (at least country and city or postcode) to see live carrier rates.
                </p>
              ) : ratesLoading ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Spinner /> Fetching carrier rates…</p>
              ) : shippingRates && shippingRates.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {shippingRates.map((r) => (
                    <label
                      key={r.serviceToken || r.rateId}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                        selectedRateToken === r.serviceToken ? 'border-clay bg-clay/8' : 'border-line bg-cream hover:border-ink/30'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping-rate"
                          checked={selectedRateToken === r.serviceToken}
                          onChange={() => setSelectedRateToken(r.serviceToken)}
                        />
                        {r.providerImageUrl && (
                          <img src={r.providerImageUrl} alt={r.carrier} className="h-6 w-6 object-contain" />
                        )}
                        <span>
                          <span className="block font-medium">{r.carrier} · {r.serviceLevel}</span>
                          <span className="block text-xs text-muted">
                            {r.estimatedDays != null
                              ? `Est. ${r.estimatedDays} day${r.estimatedDays === 1 ? '' : 's'}`
                              : r.durationTerms || 'Delivery estimate at carrier'}
                          </span>
                        </span>
                      </span>
                      <span className="font-mono font-semibold">{money(r.amount, r.currency)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  {ratesError ?? 'No live rates available — a flat shipping fee will apply.'}
                </p>
              )}
              {ratesError && shippingRates && shippingRates.length > 0 && (
                <p className="mt-2 text-xs text-muted">{ratesError}</p>
              )}
            </section>
          )}

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
              <Row
                label={
                  quote.liveShippingRate && quote.shippingCarrier
                    ? `Shipping (${quote.shippingCarrier}${quote.shippingService ? ' · ' + quote.shippingService : ''})`
                    : 'Logistics fee'
                }
                value={money(quote.logisticsFee)}
              />
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
