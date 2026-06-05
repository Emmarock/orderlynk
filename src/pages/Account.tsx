import { useState } from 'react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { titleCase } from '../lib/format'
import { ErrorNote, Rail, Spinner } from '../components/ui'

export default function Account() {
  const { user } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setError(null)
    setDone(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) {
      setError('New password and confirmation do not match')
      return
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
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
                  minLength={6}
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={set('newPassword')}
                />
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
              <button className="btn-primary w-full" disabled={saving}>
                {saving ? <Spinner /> : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
