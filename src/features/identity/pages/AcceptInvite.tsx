import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import { useAuth } from '@/shared/context/AuthContext'
import { validateNewPassword } from '@/shared/lib/password'
import { ErrorNote, PasswordChecklist, Rail, Spinner, ThemeToggle } from '@/shared/components/ui'

/**
 * Claim an invited account from a guest-order invite email: the customer sets their first password,
 * which activates and verifies the account. We already have their details, so this is all they do.
 */
export default function AcceptInvite() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { authenticate } = useAuth()
  const token = params.get('token') ?? ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = token !== '' && validateNewPassword(form.password, form.confirm) === null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwError = validateNewPassword(form.password, form.confirm)
    if (pwError) {
      setError(pwError)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.acceptInvite({ token, password: form.password, confirmPassword: form.confirm })
      authenticate(res) // logs them straight in
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not set up your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="mb-3 flex justify-end"><ThemeToggle /></div>
      <div className="card overflow-hidden">
        <Rail />
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Activate your account</h1>
          {!token ? (
            <p className="mt-3 text-sm text-muted">
              This invite link is missing its token. If you placed an order, check your email for the link, or just{' '}
              <Link to="/register" className="link-underline">create an account</Link>.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted">
                Set a password to finish setting up your MyOrderLynk account and track all your orders in one place.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="label">Password</label>
                  <input className="field" type="password" required minLength={8} autoComplete="new-password"
                         value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <PasswordChecklist password={form.password} confirm={form.confirm} />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input className="field" type="password" required autoComplete="new-password"
                         value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
                </div>
                {error && <ErrorNote message={error} />}
                <button className="btn-primary w-full" disabled={loading || !canSubmit}>
                  {loading ? <Spinner /> : 'Activate account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
