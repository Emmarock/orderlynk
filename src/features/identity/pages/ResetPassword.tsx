import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import { validateNewPassword } from '@/shared/lib/password'
import { ErrorNote, PasswordChecklist, Rail, Spinner } from '@/shared/components/ui'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const [form, setForm] = useState({ newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const canSubmit = token !== '' && validateNewPassword(form.newPassword, form.confirm) === null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwError = validateNewPassword(form.newPassword, form.confirm)
    if (pwError) {
      setError(pwError)
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
                <input className="field" type="password" required minLength={8} autoComplete="new-password"
                       value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
                <PasswordChecklist password={form.newPassword} confirm={form.confirm} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input className="field" type="password" required autoComplete="new-password"
                       value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
              {error && <ErrorNote message={error} />}
              <button className="btn-primary w-full" disabled={loading || !canSubmit}>
                {loading ? <Spinner /> : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}