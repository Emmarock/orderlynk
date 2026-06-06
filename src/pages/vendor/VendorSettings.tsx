import { useEffect, useState, type ReactNode } from 'react'
import { api, ApiError, tokenStore } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import type { FulfillmentType, Vendor } from '../../lib/types'
import { titleCase } from '../../lib/format'
import { ConsoleShell, VENDOR_TABS } from '../../components/Console'
import { ErrorNote, PageLoader, Spinner } from '../../components/ui'

const FULFILLMENT: FulfillmentType[] = ['LOCAL_PICKUP', 'LOCAL_DELIVERY', 'DOMESTIC_SHIPPING', 'IMPORT_BATCH']
const PAYOUT_METHODS = ['INTERAC', 'BANK_TRANSFER', 'OTHER']

/** A settings section with its own form + save state. onSave throws ApiError on failure. */
function SettingsCard({
  title,
  desc,
  submitLabel = 'Save changes',
  onSave,
  children,
}: {
  title: string
  desc?: string
  submitLabel?: string
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
      <button className="btn-primary mt-4" disabled={saving}>{saving ? <Spinner /> : submitLabel}</button>
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
  const [biz, setBiz] = useState({ businessName: '', description: '', city: '', country: '', whatsappNumber: '', instagramHandle: '', logoUrl: '', bannerUrl: '' })
  const [fulfillment, setFulfillment] = useState<FulfillmentType[]>([])
  const [profile, setProfile] = useState({ fullName: '', phone: '', city: '', country: '' })
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [payout, setPayout] = useState({ payoutMethod: '', payoutAccountName: '', payoutAccountNumber: '', payoutBankName: '', payoutEmail: '' })
  const [prefs, setPrefs] = useState({ notifyByEmail: true, notifyByWhatsapp: false, lowStockAlerts: true })

  useEffect(() => {
    api.myVendor().then((v) => {
      setVendor(v)
      setBiz({
        businessName: v.businessName, description: v.description ?? '', city: v.city ?? '', country: v.country ?? '',
        whatsappNumber: v.whatsappNumber ?? '', instagramHandle: v.instagramHandle ?? '', logoUrl: v.logoUrl ?? '',
        bannerUrl: v.bannerUrl ?? '',
      })
      setFulfillment(v.fulfillmentTypes)
      setPayout({
        payoutMethod: v.payoutMethod ?? '', payoutAccountName: v.payoutAccountName ?? '',
        payoutAccountNumber: v.payoutAccountNumber ?? '', payoutBankName: v.payoutBankName ?? '', payoutEmail: v.payoutEmail ?? '',
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="City"><input className="field" value={biz.city} onChange={(e) => setBiz({ ...biz, city: e.target.value })} /></Field>
            <Field label="Country"><input className="field" value={biz.country} onChange={(e) => setBiz({ ...biz, country: e.target.value })} /></Field>
            <Field label="WhatsApp number"><input className="field" value={biz.whatsappNumber} onChange={(e) => setBiz({ ...biz, whatsappNumber: e.target.value })} /></Field>
            <Field label="Instagram handle"><input className="field" value={biz.instagramHandle} onChange={(e) => setBiz({ ...biz, instagramHandle: e.target.value })} /></Field>
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
            applySession(tokenStore.get() ?? '', { userId: r.userId, fullName: r.fullName, email: r.email, role: r.role, vendorId: r.vendorId })
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
          onSave={async () => {
            const r = await api.changeEmail({ newEmail: emailForm.newEmail, currentPassword: emailForm.currentPassword })
            if (r.token) applySession(r.token, { userId: r.userId, fullName: r.fullName, email: r.email, role: r.role, vendorId: r.vendorId })
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
          onSave={async () => {
            if (pwd.newPassword !== pwd.confirm) throw new ApiError(400, 'New password and confirmation do not match')
            await api.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
            setPwd({ currentPassword: '', newPassword: '', confirm: '' })
          }}
        >
          <Field label="Current password"><input className="field" type="password" required autoComplete="current-password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input className="field" type="password" required minLength={6} autoComplete="new-password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} /></Field>
          <Field label="Confirm new password"><input className="field" type="password" required autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></Field>
        </SettingsCard>

        {/* Payout information */}
        <SettingsCard
          title="Payment / payout information"
          desc="Where OrderLynk sends your payouts."
          onSave={async () => {
            const v = await api.updateVendor(payout)
            setVendor(v)
          }}
        >
          <Field label="Payout method">
            <select className="field" value={payout.payoutMethod} onChange={(e) => setPayout({ ...payout, payoutMethod: e.target.value })}>
              <option value="">Select…</option>
              {PAYOUT_METHODS.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
            </select>
          </Field>
          {payout.payoutMethod === 'INTERAC' ? (
            <Field label="Interac e-Transfer email"><input className="field" value={payout.payoutEmail} onChange={(e) => setPayout({ ...payout, payoutEmail: e.target.value })} /></Field>
          ) : (
            <>
              <Field label="Account name"><input className="field" value={payout.payoutAccountName} onChange={(e) => setPayout({ ...payout, payoutAccountName: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Bank name"><input className="field" value={payout.payoutBankName} onChange={(e) => setPayout({ ...payout, payoutBankName: e.target.value })} /></Field>
                <Field label="Account number"><input className="field" value={payout.payoutAccountNumber} onChange={(e) => setPayout({ ...payout, payoutAccountNumber: e.target.value })} /></Field>
              </div>
            </>
          )}
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