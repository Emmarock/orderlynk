import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiMessage } from '../lib/api'
import { PASSWORD_RULE, validateNewPassword } from '../lib/password'
import { ErrorNote, Rail, Spinner } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Pre-fill the email when arriving from an order-confirmation notification (?email=).
  const [form, setForm] = useState({ fullName: '', email: params.get('email') ?? '', password: '', confirmPassword: '', phone: '', city: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwError = validateNewPassword(form.password, form.confirmPassword)
    if (pwError) {
      setError(pwError)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone || undefined,
        city: form.city || undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(apiMessage(err, 'Could not create account'))
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="card overflow-hidden">
        <Rail />
        <div className="p-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Track orders, reorder faster, and check out in seconds.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="field" required value={form.fullName} onChange={set('fullName')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="field" type="email" required value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="field" type="password" required minLength={8} value={form.password} onChange={set('password')} />
              <p className="mt-1 text-xs text-muted">{PASSWORD_RULE}</p>
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="field" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="field" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="field" value={form.city} onChange={set('city')} />
              </div>
            </div>
            {error && <ErrorNote message={error} />}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner /> : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="link-underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
