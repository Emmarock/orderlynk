import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, apiMessage } from '@/shared/lib/api'
import { useAuth } from '@/shared/context/AuthContext'
import { validateNewPassword } from '@/shared/lib/password'
import { titleCase } from '@/shared/lib/format'
import type { FulfillmentType } from '@/shared/lib/types'
import type { VatCollector } from '@/features/vendor/types'
import { CountrySelect, ErrorNote, PageLoader, PasswordChecklist, Rail, Spinner } from '@/shared/components/ui'
import AddressAutocomplete from '@/shared/components/AddressAutocomplete'
import { applyDialCode, countryCode, countryDialCode } from '@/shared/lib/countries'

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

export default function SellOnOrderLynk() {
  const { user, loading, authenticate, applySession } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    // Account fields — only used when signing up as a brand-new (guest) seller.
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Business fields — used in both the guest and signed-in application flows.
    businessName: '',
    description: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    whatsappNumber: '',
    instagramHandle: '',
    tiktokHandle: '',
    facebookPage: '',
    // VAT collector: the vendor collects & remits VAT by default; can switch to the platform.
    vatCollector: 'VENDOR' as VatCollector,
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

  // Guests must supply a valid account block; signed-in users skip it. Both flows
  // require a business name and at least one fulfillment option.
  const accountValid =
    !!user ||
    (form.fullName.trim() !== '' &&
      form.email.trim() !== '' &&
      validateNewPassword(form.password, form.confirmPassword) === null)
  const canSubmit = accountValid && form.businessName.trim() !== '' && types.size > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const business = {
      businessName: form.businessName,
      description: form.description || undefined,
      houseNumber: form.houseNumber || undefined,
      street: form.street || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      postcode: form.postcode || undefined,
      country: form.country || undefined,
      whatsappNumber: form.whatsappNumber || undefined,
      instagramHandle: form.instagramHandle || undefined,
      tiktokHandle: form.tiktokHandle || undefined,
      facebookHandle: form.facebookPage || undefined,
      vatCollector: form.vatCollector,
      fulfillmentTypes: Array.from(types),
    }

    // Guests register the account + vendor in one step; signed-in users just apply.
    if (!user) {
      const pwError = validateNewPassword(form.password, form.confirmPassword)
      if (pwError) {
        setError(pwError)
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      if (user) {
        const res = await api.applyVendor(business)
        applySession(res.token, {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: 'VENDOR',
          vendorId: res.vendor.id,
          emailVerified: user.emailVerified,
        })
      } else {
        authenticate(
          await api.registerSeller({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            ...business,
          }),
        )
      }
      navigate('/vendor', { replace: true })
    } catch (err) {
      setError(apiMessage(err, 'Could not submit application'))
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <p className="eyebrow">Sell on OrderLynk</p>
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
            <form onSubmit={submit} className="space-y-4">
              {!user && (
                <>
                  <h2 className="font-display text-xl font-semibold">Create your seller account</h2>
                  <div>
                    <label className="label">Full name</label>
                    <input className="field" required value={form.fullName} onChange={set('fullName')} />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input className="field" type="email" required value={form.email} onChange={set('email')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Password</label>
                      <input className="field" type="password" required minLength={8} value={form.password} onChange={set('password')} />
                    </div>
                    <div>
                      <label className="label">Confirm password</label>
                      <input className="field" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
                    </div>
                  </div>
                  <PasswordChecklist password={form.password} confirm={form.confirmPassword} />
                </>
              )}

              <h2 className="font-display text-xl font-semibold">{user ? 'Business details' : 'Your business'}</h2>
              <div>
                <label className="label">Business name</label>
                <input className="field" required value={form.businessName} onChange={set('businessName')} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="field min-h-20" value={form.description} onChange={set('description')} />
              </div>
              <div>
                <p className="label !mb-1">Business address</p>
                <AddressAutocomplete
                  label=""
                  country={countryCode(form.country)}
                  onSelect={(addr) =>
                    setForm((f) => ({
                      ...f,
                      houseNumber: addr.houseNumber ?? '',
                      street: addr.street ?? '',
                      city: addr.city ?? '',
                      state: addr.state ?? '',
                      postcode: addr.postcode ?? '',
                      country: addr.country ?? '',
                    }))
                  }
                />
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <input className="field" placeholder="House / unit no." value={form.houseNumber} onChange={set('houseNumber')} />
                  <input className="field" placeholder="Street" value={form.street} onChange={set('street')} />
                  <input className="field" placeholder="City" value={form.city} onChange={set('city')} />
                  <input className="field" placeholder="State / province" value={form.state} onChange={set('state')} />
                  <input className="field" placeholder="Postcode" value={form.postcode} onChange={set('postcode')} />
                  <CountrySelect value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v, whatsappNumber: applyDialCode(f.whatsappNumber, f.country, v) }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">WhatsApp</label>
                  <input className="field" placeholder={`${countryDialCode(form.country) ?? '+1'}…`} value={form.whatsappNumber} onChange={set('whatsappNumber')} />
                </div>
                <div>
                  <label className="label">Instagram</label>
                  <input className="field" placeholder="@handle" value={form.instagramHandle} onChange={set('instagramHandle')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">TikTok</label>
                  <input className="field" placeholder="@yourtiktok" value={form.tiktokHandle} onChange={set('tiktokHandle')}/>
                </div>

                <div>
                  <label className="label">Facebook</label>
                  <input className="field" placeholder="yourfacebookpage" value={form.facebookPage} onChange={set('facebookPage')}/>
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

              {/* VAT collection: who remits VAT to the government for this store. */}
              <div>
                <label className="label">VAT collection</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([
                    ['VENDOR', 'I collect & remit VAT', 'VAT is added to your payout; you remit it to the government.'],
                    ['PLATFORM', 'Platform collects VAT', 'OrderLynk holds the VAT and remits it on your behalf.'],
                  ] as [VatCollector, string, string][]).map(([value, label, hint]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setForm((f) => ({ ...f, vatCollector: value }))}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        form.vatCollector === value ? 'border-clay bg-clay/8' : 'border-line hover:border-ink/30'
                      }`}
                    >
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-0.5 text-xs text-muted">{hint}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-muted">You can change this later, and set a VAT rate per product.</p>
              </div>

              {error && <ErrorNote message={error} />}
              <button className="btn-primary w-full" disabled={submitting || !canSubmit}>
                {submitting ? <Spinner /> : user ? 'Submit application' : 'Create account & apply'}
              </button>
              {!user && (
                <p className="text-center text-sm text-muted">
                  Already have an account?{' '}
                  <Link to="/login" className="link-underline">Sign in</Link> to apply.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}