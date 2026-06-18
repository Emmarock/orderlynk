import { useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, tokenStore } from '@/shared/lib/api'
import { useAuth } from '@/shared/context/AuthContext'
import type { FulfillmentType, Vendor } from '@/shared/lib/types'
import { titleCase } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { validateNewPassword } from '@/shared/lib/password'
import { applyDialCode, countryCode, countryDialCode } from '@/shared/lib/countries'
import { CountrySelect, ErrorNote, PageLoader, PasswordChecklist, Spinner } from '@/shared/components/ui'
import StripeOnboardingCard from '@/features/vendor/components/StripeOnboardingCard'
import AddressAutocomplete from '@/shared/components/AddressAutocomplete'

const FULFILLMENT: FulfillmentType[] = ['LOCAL_PICKUP', 'LOCAL_DELIVERY', 'DOMESTIC_SHIPPING', 'IMPORT_BATCH']

// ---- Manual bank-transfer details (currency-aware) ----
// Card payouts go via Stripe Connect (above); these are the details a customer transfers to when
// paying by bank transfer. Each currency requires its own routing identifiers, validated inline.

const PAYOUT_CURRENCIES = ['NGN', 'USD', 'CAD', 'GBP', 'EUR'] as const

type PayoutForm = {
  payoutCurrency: string
  payoutMethod: string
  payoutAccountName: string
  payoutBankName: string
  payoutAccountNumber: string
  payoutSortCode: string
  payoutRoutingNumber: string
  payoutInstitutionNumber: string
  payoutTransitNumber: string
  payoutIban: string
  payoutBic: string
  payoutBankCode: string
  payoutEmail: string
}

type BankField = { key: keyof PayoutForm; label: string; hint?: string; test: (v: string) => boolean }

const onlyDigits = (v: string) => v.replace(/[\s-]/g, '')
const digitsOfLen = (n: number) => (v: string) => /^\d+$/.test(onlyDigits(v)) && onlyDigits(v).length === n
const bicOk = (v: string) => /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/.test(v.replace(/\s/g, ''))

/** Structural + ISO 7064 mod-97 IBAN check (no BigInt; runs the remainder digit by digit). */
function ibanOk(value: string): boolean {
  const iban = value.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  let rem = 0
  for (const ch of numeric) rem = (rem * 10 + (ch.charCodeAt(0) - 48)) % 97
  return rem === 1
}

const CURRENCY_FIELDS: Record<string, BankField[]> = {
  NGN: [{ key: 'payoutAccountNumber', label: 'Account number (NUBAN)', hint: '10 digits', test: digitsOfLen(10) }],
  USD: [
    { key: 'payoutAccountNumber', label: 'Account number', test: (v) => v.trim().length > 0 },
    { key: 'payoutRoutingNumber', label: 'Routing number', hint: '9 digits', test: digitsOfLen(9) },
  ],
  CAD: [
    { key: 'payoutAccountNumber', label: 'Account number', test: (v) => v.trim().length > 0 },
    { key: 'payoutInstitutionNumber', label: 'Institution number', hint: '3 digits', test: digitsOfLen(3) },
    { key: 'payoutTransitNumber', label: 'Transit number', hint: '5 digits', test: digitsOfLen(5) },
  ],
  GBP: [
    { key: 'payoutAccountNumber', label: 'Account number', hint: '8 digits', test: digitsOfLen(8) },
    { key: 'payoutSortCode', label: 'Sort code', hint: '6 digits', test: digitsOfLen(6) },
  ],
  EUR: [
    { key: 'payoutIban', label: 'IBAN', test: ibanOk },
    { key: 'payoutBic', label: 'BIC / SWIFT', hint: '8 or 11 chars', test: bicOk },
  ],
}

const EMPTY_PAYOUT: PayoutForm = {
  payoutCurrency: '', payoutMethod: 'BANK_TRANSFER', payoutAccountName: '', payoutBankName: '',
  payoutAccountNumber: '', payoutSortCode: '', payoutRoutingNumber: '', payoutInstitutionNumber: '',
  payoutTransitNumber: '', payoutIban: '', payoutBic: '', payoutBankCode: '', payoutEmail: '',
}

/** Mirrors the backend validation: a currency is required, then the right fields for that currency. */
function payoutValid(p: PayoutForm): boolean {
  if (!p.payoutCurrency) return false
  if (p.payoutCurrency === 'CAD' && p.payoutMethod === 'INTERAC') return p.payoutEmail.trim().length > 0
  if (!p.payoutAccountName.trim() || !p.payoutBankName.trim()) return false
  return (CURRENCY_FIELDS[p.payoutCurrency] ?? []).every((f) => f.test(p[f.key] ?? ''))
}

/** A settings section with its own form + save state. onSave throws ApiError on failure. */
function SettingsCard({
  title,
  desc,
  submitLabel = 'Save changes',
  canSave = true,
  onSave,
  children,
}: {
  title: string
  desc?: string
  submitLabel?: string
  canSave?: boolean
  onSave: () => Promise<void>
  children: ReactNode
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setDone(false)
    try {
      await onSave()
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {done && (
        <div className="mt-4 rounded-xl border border-forest/30 bg-forest/8 px-4 py-2.5 text-sm text-forest">Saved.</div>
      )}
      <button className="btn-primary mt-4" disabled={saving || !canSave}>{saving ? <Spinner /> : submitLabel}</button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

/** Upload-from-device widget for a vendor branding image, with live preview. */
function BrandingUpload({
  label,
  kind,
  shape,
  value,
  onChange,
}: {
  label: string
  kind: 'logo' | 'banner'
  shape: 'square' | 'wide'
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url } = await api.uploadVendorImage(kind, file)
      onChange(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload image')
    } finally {
      setUploading(false)
    }
  }

  const previewClass = shape === 'square' ? 'h-16 w-16 rounded-xl' : 'h-20 w-full rounded-xl'

  return (
    <div>
      <label className="label">{label}</label>
      {value ? (
        <div className={shape === 'wide' ? 'space-y-2' : 'flex items-center gap-3'}>
          <img src={value} alt={label} className={`${previewClass} border border-line object-cover`} />
          <div className="flex items-center gap-1">
            <label className="btn-quiet cursor-pointer px-2 text-sm">
              {uploading ? <Spinner /> : 'Replace'}
              <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={uploading} />
            </label>
            <button type="button" className="btn-quiet px-2 text-sm text-clay hover:text-clay-dark" onClick={() => onChange('')}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="field flex cursor-pointer items-center justify-center gap-2 text-muted">
          {uploading ? <Spinner /> : 'Browse device…'}
          <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={uploading} />
        </label>
      )}
      {error && <p className="mt-1 text-xs text-clay-dark">{error}</p>}
    </div>
  )
}

export default function VendorSettings() {
  const { user, applySession } = useAuth()
  const [vendor, setVendor] = useState<Vendor | null>(null)

  // Local form state per section.
  const [biz, setBiz] = useState({ businessName: '', description: '', houseNumber: '', street: '', city: '', state: '', postcode: '', country: '', whatsappNumber: '', instagramHandle: '', tiktokHandle: '', facebookPage: '', logoUrl: '', bannerUrl: '' })
  const [fulfillment, setFulfillment] = useState<FulfillmentType[]>([])
  const [profile, setProfile] = useState({ fullName: '', phone: '', city: '', country: '' })
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [payout, setPayout] = useState<PayoutForm>(EMPTY_PAYOUT)
  const [prefs, setPrefs] = useState({ notifyByEmail: true, notifyByWhatsapp: false, lowStockAlerts: true })

  useEffect(() => {
    api.myVendor().then((v) => {
      setVendor(v)
      setBiz({
        businessName: v.businessName, description: v.description ?? '',
        houseNumber: v.houseNumber ?? '', street: v.street ?? '', city: v.city ?? '', state: v.state ?? '', postcode: v.postcode ?? '', country: v.country ?? '',
        whatsappNumber: v.whatsappNumber ?? '', instagramHandle: v.instagramHandle ?? '', tiktokHandle: v.tiktokHandle ?? '', facebookPage: v.facebookPage ?? '', logoUrl: v.logoUrl ?? '',
        bannerUrl: v.bannerUrl ?? '',
      })
      setFulfillment(v.fulfillmentTypes)
      setPayout({
        payoutCurrency: v.payoutCurrency ?? '',
        payoutMethod: v.payoutMethod || 'BANK_TRANSFER',
        payoutAccountName: v.payoutAccountName ?? '', payoutBankName: v.payoutBankName ?? '',
        payoutAccountNumber: v.payoutAccountNumber ?? '', payoutSortCode: v.payoutSortCode ?? '',
        payoutRoutingNumber: v.payoutRoutingNumber ?? '', payoutInstitutionNumber: v.payoutInstitutionNumber ?? '',
        payoutTransitNumber: v.payoutTransitNumber ?? '', payoutIban: v.payoutIban ?? '',
        payoutBic: v.payoutBic ?? '', payoutBankCode: v.payoutBankCode ?? '', payoutEmail: v.payoutEmail ?? '',
      })
      setPrefs({ notifyByEmail: v.notifyByEmail, notifyByWhatsapp: v.notifyByWhatsapp, lowStockAlerts: v.lowStockAlerts })
    }).catch(() => setVendor(null))
  }, [])

  useEffect(() => {
    if (user) setProfile({ fullName: user.fullName, phone: '', city: '', country: '' })
  }, [user])

  if (!vendor || !user) return <PageLoader />

  const toggleFulfillment = (t: FulfillmentType) =>
    setFulfillment((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  return (
    <ConsoleShell title="Settings" subtitle="Manage your business, account, payout and preferences" tabs={VENDOR_TABS}>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business details */}
        <SettingsCard
          title="Business details"
          desc="Your storefront profile and how customers reach you."
          onSave={async () => {
            const v = await api.updateVendor({ ...biz, fulfillmentTypes: fulfillment })
            setVendor(v)
          }}
        >
          <Field label="Business name"><input className="field" value={biz.businessName} onChange={(e) => setBiz({ ...biz, businessName: e.target.value })} /></Field>
          <Field label="Description"><textarea className="field min-h-20" value={biz.description} onChange={(e) => setBiz({ ...biz, description: e.target.value })} /></Field>
          <p className="label !mb-1 !mt-2">Business address</p>
          <AddressAutocomplete
            country={countryCode(biz.country)}
            onSelect={(addr) =>
              setBiz({
                ...biz,
                houseNumber: addr.houseNumber ?? '',
                street: addr.street ?? '',
                city: addr.city ?? '',
                state: addr.state ?? '',
                postcode: addr.postcode ?? '',
                country: addr.country ?? '',
              })
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="House / unit no."><input className="field" value={biz.houseNumber} onChange={(e) => setBiz({ ...biz, houseNumber: e.target.value })} /></Field>
            <Field label="Street"><input className="field" value={biz.street} onChange={(e) => setBiz({ ...biz, street: e.target.value })} /></Field>
            <Field label="City"><input className="field" value={biz.city} onChange={(e) => setBiz({ ...biz, city: e.target.value })} /></Field>
            <Field label="State / province"><input className="field" value={biz.state} onChange={(e) => setBiz({ ...biz, state: e.target.value })} /></Field>
            <Field label="Postcode"><input className="field" value={biz.postcode} onChange={(e) => setBiz({ ...biz, postcode: e.target.value })} /></Field>
            <Field label="Country"><CountrySelect value={biz.country} onChange={(v) => setBiz({ ...biz, country: v, whatsappNumber: applyDialCode(biz.whatsappNumber, biz.country, v) })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="WhatsApp number"><input className="field" placeholder={`${countryDialCode(biz.country) ?? '+1'}…`} value={biz.whatsappNumber} onChange={(e) => setBiz({ ...biz, whatsappNumber: e.target.value })} /></Field>
            <Field label="Instagram handle"><input className="field" value={biz.instagramHandle} onChange={(e) => setBiz({ ...biz, instagramHandle: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <Field label="Tiktok handle"><input className="field" value={biz.tiktokHandle} onChange={(e) => setBiz({ ...biz, tiktokHandle: e.target.value })} /></Field>
            <Field label="Facebook Page"><input className="field" value={biz.facebookPage} onChange={(e) => setBiz({ ...biz, facebookPage: e.target.value })} /></Field>

          </div>
          <BrandingUpload
            label="Logo" kind="logo" shape="square"
            value={biz.logoUrl} onChange={(url) => setBiz((b) => ({ ...b, logoUrl: url }))}
          />
          <BrandingUpload
            label="Banner / cover image" kind="banner" shape="wide"
            value={biz.bannerUrl} onChange={(url) => setBiz((b) => ({ ...b, bannerUrl: url }))}
          />
          <div>
            <label className="label">Fulfillment options</label>
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT.map((t) => (
                <button type="button" key={t} onClick={() => toggleFulfillment(t)}
                        className={`chip ${fulfillment.includes(t) ? 'bg-ink text-cream' : 'bg-cream text-muted hover:text-ink'}`}>
                  {titleCase(t)}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>

        {/* User information */}
        <SettingsCard
          title="User information"
          desc="Your name and contact details."
          onSave={async () => {
            const r = await api.updateProfile({ fullName: profile.fullName, phone: profile.phone || undefined, city: profile.city || undefined, country: profile.country || undefined })
            applySession(tokenStore.get() ?? '', { userId: r.userId, fullName: r.fullName, email: r.email, role: r.role, vendorId: r.vendorId, emailVerified: r.emailVerified })
          }}
        >
          <Field label="Full name"><input className="field" required value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone"><input className="field" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            <Field label="City"><input className="field" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></Field>
          </div>
          <Field label="Country"><input className="field" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} /></Field>
        </SettingsCard>

        {/* Email address */}
        <SettingsCard
          title="Email address"
          desc={`Current: ${user.email}`}
          submitLabel="Change email"
          canSave={emailForm.newEmail.trim() !== '' && emailForm.currentPassword !== ''}
          onSave={async () => {
            const r = await api.changeEmail({ newEmail: emailForm.newEmail, currentPassword: emailForm.currentPassword })
            if (r.token) applySession(r.token, { userId: r.userId, fullName: r.fullName, email: r.email, role: r.role, vendorId: r.vendorId, emailVerified: r.emailVerified })
            setEmailForm({ newEmail: '', currentPassword: '' })
          }}
        >
          <Field label="New email"><input className="field" type="email" required value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} /></Field>
          <Field label="Confirm with password"><input className="field" type="password" required autoComplete="current-password" value={emailForm.currentPassword} onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })} /></Field>
        </SettingsCard>

        {/* Password management */}
        <SettingsCard
          title="Password"
          desc="Use a strong password you don't reuse elsewhere."
          submitLabel="Update password"
          canSave={pwd.currentPassword !== '' && validateNewPassword(pwd.newPassword, pwd.confirm) === null}
          onSave={async () => {
            const pwError = validateNewPassword(pwd.newPassword, pwd.confirm)
            if (pwError) throw new ApiError(400, pwError)
            await api.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
            setPwd({ currentPassword: '', newPassword: '', confirm: '' })
          }}
        >
          <Field label="Current password"><input className="field" type="password" required autoComplete="current-password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input className="field" type="password" required minLength={8} autoComplete="new-password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} /><PasswordChecklist password={pwd.newPassword} confirm={pwd.confirm} /></Field>
          <Field label="Confirm new password"><input className="field" type="password" required autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
        </SettingsCard>

        {/* Stripe Connect onboarding — accept card payments */}
        <StripeOnboardingCard />

        {/* Manual bank-transfer details (currency-aware). Stripe Connect above handles card payouts. */}
        <SettingsCard
          title="Bank transfer / manual payment details"
          desc="Shown to customers who pay you by bank transfer (non-card). Card sales are paid out automatically via Stripe above."
          canSave={payoutValid(payout)}
          onSave={async () => {
            // Only CAD offers Interac; every other currency is a plain bank transfer.
            const method = payout.payoutCurrency === 'CAD' && payout.payoutMethod === 'INTERAC' ? 'INTERAC' : 'BANK_TRANSFER'
            const v = await api.updateVendor({ ...payout, payoutMethod: method })
            setVendor(v)
          }}
        >
          <Field label="Settlement currency">
            <select
              className="field"
              value={payout.payoutCurrency}
              onChange={(e) => setPayout({ ...payout, payoutCurrency: e.target.value, payoutMethod: 'BANK_TRANSFER' })}
            >
              <option value="">Select currency…</option>
              {PAYOUT_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {!payout.payoutCurrency && (
            <p className="text-sm text-muted">Select a currency to enter the bank details customers will transfer to.</p>
          )}

          {payout.payoutCurrency === 'CAD' && (
            <Field label="How customers pay you">
              <select className="field" value={payout.payoutMethod} onChange={(e) => setPayout({ ...payout, payoutMethod: e.target.value })}>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="INTERAC">Interac e-Transfer</option>
              </select>
            </Field>
          )}

          {payout.payoutCurrency && payout.payoutMethod === 'INTERAC' ? (
            <Field label="Interac e-Transfer email">
              <input className="field" type="email" value={payout.payoutEmail} onChange={(e) => setPayout({ ...payout, payoutEmail: e.target.value })} />
            </Field>
          ) : payout.payoutCurrency ? (
            <>
              <Field label="Account holder name">
                <input className="field" value={payout.payoutAccountName} onChange={(e) => setPayout({ ...payout, payoutAccountName: e.target.value })} />
              </Field>
              <Field label="Bank name">
                <input className="field" value={payout.payoutBankName} onChange={(e) => setPayout({ ...payout, payoutBankName: e.target.value })} />
              </Field>
              {payout.payoutCurrency === 'NGN' && (
                <Field label="Bank code (optional)">
                  <input className="field" value={payout.payoutBankCode} onChange={(e) => setPayout({ ...payout, payoutBankCode: e.target.value })} />
                </Field>
              )}
              {(CURRENCY_FIELDS[payout.payoutCurrency] ?? []).map((f) => {
                const val = payout[f.key] ?? ''
                const invalid = val.trim() !== '' && !f.test(val)
                return (
                  <Field key={f.key} label={f.hint ? `${f.label} (${f.hint})` : f.label}>
                    <input
                      className={`field ${invalid ? 'border-clay' : ''}`}
                      value={val}
                      onChange={(e) => setPayout({ ...payout, [f.key]: e.target.value })}
                    />
                    {invalid && <p className="mt-1 text-xs text-clay-dark">Enter a valid {f.label.toLowerCase()}.</p>}
                  </Field>
                )
              })}
            </>
          ) : null}
        </SettingsCard>

        {/* Notification preferences */}
        <SettingsCard
          title="Notification preferences"
          desc="How you want to be notified."
          onSave={async () => {
            const v = await api.updateVendor(prefs)
            setVendor(v)
          }}
        >
          {([
            ['notifyByEmail', 'Email notifications'],
            ['notifyByWhatsapp', 'WhatsApp notifications'],
            ['lowStockAlerts', 'Low-stock alerts'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })} />
              {label}
            </label>
          ))}
        </SettingsCard>
      </div>
    </ConsoleShell>
  )
}