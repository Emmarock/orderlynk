import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { ErrorNote, Rail, Spinner } from '../components/ui'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [form, setForm] = useState({ newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.resetPassword(token, form.newPassword)
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 1800)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="card overflow-hidden">
        <Rail />
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Choose a new password</h1>
          {!token ? (
            <p className="mt-3 text-sm text-muted">This reset link is missing its token. Request a new one from
              the <Link to="/forgot-password" className="link-underline">forgot password</Link> page.</p>
          ) : done ? (
            <div className="mt-4 rounded-xl border border-forest/30 bg-forest/8 px-4 py-3 text-sm text-forest">
              Your password has been reset. Redirecting you to sign in…
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">New password</label>
                <input className="field" type="password" required minLength={6} autoComplete="new-password"
                       value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input className="field" type="password" required autoComplete="new-password"
                       value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
              {error && <ErrorNote message={error} />}
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? <Spinner /> : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}