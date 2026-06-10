import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiMessage } from '../lib/api'
import { validateNewPassword } from '../lib/password'
import { CountrySelect, ErrorNote, PasswordChecklist, Rail, Spinner } from '../components/ui'
import AddressAutocomplete from '../components/AddressAutocomplete'
import { countryCode } from '../lib/countries'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Pre-fill the email when arriving from an order-confirmation notification (?email=).
  const [form, setForm] = useState({
    fullName: '',
    email: params.get('email') ?? '',
    password: '',
    confirmPassword: '',
    phone: '',
    houseNumber: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const canSubmit =
    form.fullName.trim() !== '' &&
    form.email.trim() !== '' &&
    validateNewPassword(form.password, form.confirmPassword) === null

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
      // Structured address from the autocomplete (or manual entry). city/country are also
      // sent flat for backward compatibility with the existing register endpoint.
      const address = {
        houseNumber: form.houseNumber || undefined,
        street: form.street || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        postcode: form.postcode || undefined,
        country: form.country || undefined,
      }
      const hasAddress = Object.values(address).some(Boolean)
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        address: hasAddress ? address : undefined,
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
              <PasswordChecklist password={form.password} confirm={form.confirmPassword} />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input className="field" type="password" required value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="field" value={form.phone} onChange={set('phone')} />
            </div>

            <div>
              <p className="label !mb-1">Delivery address</p>
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
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input className="field" placeholder="House / flat number" value={form.houseNumber} onChange={set('houseNumber')} />
                <input className="field" placeholder="Street" value={form.street} onChange={set('street')} />
                <input className="field" placeholder="City" value={form.city} onChange={set('city')} />
                <input className="field" placeholder="State / province" value={form.state} onChange={set('state')} />
                <input className="field" placeholder="Postcode" value={form.postcode} onChange={set('postcode')} />
                <CountrySelect value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} />
              </div>
            </div>
            {error && <ErrorNote message={error} />}
            <button className="btn-primary w-full" disabled={loading || !canSubmit}>
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
