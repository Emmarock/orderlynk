import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { titleCase } from '../lib/format'
import type { FulfillmentType } from '../lib/types'
import { ErrorNote, PageLoader, Rail, Spinner } from '../components/ui'

const FULFILLMENT: FulfillmentType[] = [
  'LOCAL_PICKUP',
  'LOCAL_DELIVERY',
  'DOMESTIC_SHIPPING',
  'IMPORT_BATCH',
]

const BENEFITS = [
  'Shareable WhatsApp & Instagram order links with campaign tracking',
  'Structured orders in one dashboard — no more screenshots in DMs',
  'Payment tracking, pickup codes and fulfillment status per order',
  'Weekly payout reconciliation with platform & logistics fees',
]

export default function SellOnOrderlynk() {
  const { user, loading, applySession } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    businessName: '',
    description: '',
    city: '',
    country: 'Canada',
    whatsappNumber: '',
    instagramHandle: '',
  })
  const [types, setTypes] = useState<Set<FulfillmentType>>(new Set(['LOCAL_PICKUP']))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <PageLoader />

  // Already a vendor → straight to the dashboard.
  if (user?.role === 'VENDOR') {
    navigate('/vendor', { replace: true })
    return null
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleType = (t: FulfillmentType) =>
    setTypes((prev) => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.applyVendor({ ...form, fulfillmentTypes: Array.from(types) })
      applySession(res.token, {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: 'VENDOR',
        vendorId: res.vendor.id,
      })
      navigate('/vendor', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit application')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow">Sell on Orderlynk</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight">
            Your storefront, your customers — finally organised.
          </h1>
          <p className="mt-4 text-muted">
            Apply to join the pilot. We review every vendor before approval to keep the marketplace
            trusted. Approval usually takes a day.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-3 text-sm">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest/12 text-forest">
                  ✓
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <Rail />
          <div className="p-7">
            {!user ? (
              <div className="text-center">
                <h2 className="font-display text-xl font-semibold">Sign in to apply</h2>
                <p className="mt-2 text-sm text-muted">
                  Create an account or sign in, then submit your business details.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link to="/register" className="btn-primary">Create account</Link>
                  <Link to="/login" className="btn-ghost">Sign in</Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="font-display text-xl font-semibold">Business details</h2>
                <div>
                  <label className="label">Business name</label>
                  <input className="field" required value={form.businessName} onChange={set('businessName')} />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="field min-h-20" value={form.description} onChange={set('description')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">City</label>
                    <input className="field" value={form.city} onChange={set('city')} />
                  </div>
                  <div>
                    <label className="label">Country</label>
                    <input className="field" value={form.country} onChange={set('country')} />
                  </div>
                  <div>
                    <label className="label">WhatsApp</label>
                    <input className="field" placeholder="+1…" value={form.whatsappNumber} onChange={set('whatsappNumber')} />
                  </div>
                  <div>
                    <label className="label">Instagram</label>
                    <input className="field" placeholder="@handle" value={form.instagramHandle} onChange={set('instagramHandle')} />
                  </div>
                </div>
                <div>
                  <label className="label">Fulfillment options</label>
                  <div className="flex flex-wrap gap-2">
                    {FULFILLMENT.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleType(t)}
                        className={`chip border px-3 py-1.5 ${
                          types.has(t) ? 'border-clay bg-clay/10 text-clay-dark' : 'border-line text-muted'
                        }`}
                      >
                        {titleCase(t)}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <ErrorNote message={error} />}
                <button className="btn-primary w-full" disabled={submitting}>
                  {submitting ? <Spinner /> : 'Submit application'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
