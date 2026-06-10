import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { CustomerAddress, Order } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { formatDate, money, titleCase } from '../lib/format'
import { OrderStatusRow } from '../components/OrderViews'
import { validateNewPassword } from '../lib/password'
import { ErrorNote, PasswordChecklist, Rail, Spinner } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'

export default function Account() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resend, setResend] = useState<'idle' | 'sending' | 'sent'>('idle')

  const resendVerification = async () => {
    setResend('sending')
    try {
      await api.resendVerification()
      setResend('sent')
    } catch {
      setResend('idle')
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setError(null)
    setDone(false)
  }

  const canSubmit =
    form.currentPassword !== '' &&
    validateNewPassword(form.newPassword, form.confirm) === null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwError = validateNewPassword(form.newPassword, form.confirm)
    if (pwError) {
      setError(pwError)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setDone(true)
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Your account</h1>

      {user && !user.emailVerified && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-[#8a5d0c]">
          <span>Your email isn't verified yet. Check your inbox for the verification link.</span>
          {resend === 'sent' ? (
            <span className="font-medium">Sent ✓</span>
          ) : (
            <button className="btn-ghost px-3 py-1.5" disabled={resend === 'sending'} onClick={resendVerification}>
              {resend === 'sending' ? <Spinner /> : 'Resend email'}
            </button>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.3fr]">
        {/* Profile summary */}
        <div className="card h-fit p-6">
          <h2 className="font-display text-xl font-semibold">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Name</dt>
              <dd className="font-medium">{user?.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Email</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted">Role</dt>
              <dd><span className="chip bg-sand text-muted">{user ? titleCase(user.role) : ''}</span></dd>
            </div>
          </dl>
        </div>

        {/* Change password */}
        <div className="card overflow-hidden">
          <Rail />
          <div className="p-6">
            <h2 className="font-display text-xl font-semibold">Change password</h2>
            <p className="mt-1 text-sm text-muted">
              Use a strong password you don't reuse elsewhere.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className="label">Current password</label>
                <input
                  className="field"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={set('currentPassword')}
                />
              </div>
              <div>
                <label className="label">New password</label>
                <input
                  className="field"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                />
                <PasswordChecklist password={form.newPassword} confirm={form.confirm} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input
                  className="field"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={set('confirm')}
                />
              </div>
              {error && <ErrorNote message={error} />}
              {done && (
                <div className="rounded-xl border border-forest/30 bg-forest/8 px-4 py-3 text-sm text-forest">
                  Password updated. Use your new password next time you sign in.
                </div>
              )}
              <button className="btn-primary w-full" disabled={saving || !canSubmit}>
                {saving ? <Spinner /> : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <OrderHistory />
      <AddressBook />
    </div>
  )
}

function OrderHistory() {
  const [orders, setOrders] = useState<Order[] | null>(null)

  useEffect(() => {
    api.myOrders().then(setOrders).catch(() => setOrders([]))
  }, [])

  if (orders === null || orders.length === 0) return null

  return (
    <div className="card mt-6 overflow-hidden">
      <Rail />
      <div className="p-6">
        <h2 className="font-display text-xl font-semibold">Order history</h2>
        <p className="mt-1 text-sm text-muted">Your past orders. Open one to see live status.</p>
        <div className="mt-4 divide-y divide-line">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={o.trackToken ? `/orders?token=${encodeURIComponent(o.trackToken)}` : '/track'}
              className="-mx-2 flex flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-sand/50"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold">{o.publicOrderId}</p>
                <p className="truncate text-xs text-muted">{o.vendorName} · {formatDate(o.createdAt)}</p>
              </div>
              <OrderStatusRow order={o} />
              <span className="font-mono text-sm font-semibold">{money(o.totalAmount, o.currency)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const EMPTY_ADDR = { label: '', houseNumber: '', street: '', city: '', state: '', postcode: '', country: '' }

function AddressBook() {
  const [addresses, setAddresses] = useState<CustomerAddress[] | null>(null)
  const [form, setForm] = useState(EMPTY_ADDR)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => api.customerAddresses().then(setAddresses).catch(() => setAddresses([]))
  useEffect(() => { load() }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.addCustomerAddress({
        label: form.label || undefined,
        address: {
          houseNumber: form.houseNumber || undefined,
          street: form.street || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          postcode: form.postcode || undefined,
          country: form.country || undefined,
        },
        makeDefault: (addresses?.length ?? 0) === 0,
      })
      setForm(EMPTY_ADDR)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save address')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    await api.deleteCustomerAddress(id)
    load()
  }
  const makeDefault = async (id: string) => {
    await api.setDefaultAddress(id)
    load()
  }

  const lines = (a: CustomerAddress) =>
    [
      [a.address.houseNumber, a.address.street].filter(Boolean).join(' '),
      [a.address.city, a.address.postcode].filter(Boolean).join(' '),
      a.address.country,
    ].filter((l) => l && l.trim())

  return (
    <div className="card mt-6 overflow-hidden">
      <Rail />
      <div className="p-6">
        <h2 className="font-display text-xl font-semibold">Delivery addresses</h2>
        <p className="mt-1 text-sm text-muted">Save addresses to check out faster. You can ship to any of them.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(addresses ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-sand/40 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.label || 'Address'}</span>
                {a.isDefault && <span className="chip bg-forest/12 text-forest">Default</span>}
              </div>
              <address className="mt-1 text-sm not-italic text-muted">
                {lines(a).length ? lines(a).map((l, i) => <div key={i}>{l}</div>) : <div>—</div>}
              </address>
              <div className="mt-2 flex gap-2">
                {!a.isDefault && (
                  <button className="btn-quiet px-2 text-sm" onClick={() => makeDefault(a.id)}>Set default</button>
                )}
                <button className="btn-quiet px-2 text-sm text-clay hover:text-clay-dark" onClick={() => remove(a.id)}>Remove</button>
              </div>
            </div>
          ))}
          {addresses !== null && addresses.length === 0 && (
            <p className="text-sm text-muted">No saved addresses yet.</p>
          )}
        </div>

        <form onSubmit={add} className="mt-6 border-t border-line pt-5">
          <h3 className="text-sm font-semibold">Add an address</h3>
          <div className="mt-3">
            <AddressAutocomplete
              label=""
              country={form.country || 'Canada'}
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
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input className="field" placeholder="Label (e.g. Home)" value={form.label} onChange={set('label')} />
            <input className="field" placeholder="House / flat number" value={form.houseNumber} onChange={set('houseNumber')} />
            <input className="field" placeholder="Street" value={form.street} onChange={set('street')} />
            <input className="field" placeholder="City" value={form.city} onChange={set('city')} />
            <input className="field" placeholder="State / province" value={form.state} onChange={set('state')} />
            <input className="field" placeholder="Postcode" value={form.postcode} onChange={set('postcode')} />
            <input className="field" placeholder="Country" value={form.country} onChange={set('country')} />
          </div>
          {error && <div className="mt-3"><ErrorNote message={error} /></div>}
          <button className="btn-primary mt-4" disabled={saving}>{saving ? <Spinner /> : 'Add address'}</button>
        </form>
      </div>
    </div>
  )
}
