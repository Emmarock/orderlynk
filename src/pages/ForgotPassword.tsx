import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { ErrorNote, Rail, Spinner } from '../components/ui'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="card overflow-hidden">
        <Rail />
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Forgot your password?</h1>
          {sent ? (
            <div className="mt-4 rounded-xl border border-forest/30 bg-forest/8 px-4 py-3 text-sm text-forest">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox.
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                Enter your email and we'll send you a link to reset your password.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <ErrorNote message={error} />}
                <button className="btn-primary w-full" disabled={loading}>
                  {loading ? <Spinner /> : 'Send reset link'}
                </button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/login" className="link-underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}