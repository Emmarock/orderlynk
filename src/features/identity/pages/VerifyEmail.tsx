import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import { Rail, Spinner } from '@/shared/components/ui'

type State = 'verifying' | 'success' | 'error' | 'missing'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [state, setState] = useState<State>('verifying')
  const [message, setMessage] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    const token = params.get('token')
    if (!token) {
      setState('missing')
      return
    }
    api
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch((err) => {
        setState('error')
        setMessage(err instanceof ApiError ? err.message : 'Could not verify your email.')
      })
  }, [params])

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <div className="card overflow-hidden">
        <Rail />
        <div className="p-8 text-center">
          {state === 'verifying' && (
            <>
              <Spinner />
              <h1 className="mt-3 font-display text-2xl font-semibold">Verifying your email…</h1>
            </>
          )}
          {state === 'success' && (
            <>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest text-cream">✓</div>
              <h1 className="mt-4 font-display text-2xl font-semibold">Email verified</h1>
              <p className="mt-2 text-sm text-muted">Thanks — your email address is confirmed.</p>
              <Link to="/login" className="btn-primary mt-6 inline-block">Sign in</Link>
            </>
          )}
          {(state === 'error' || state === 'missing') && (
            <>
              <h1 className="font-display text-2xl font-semibold">Verification failed</h1>
              <p className="mt-2 text-sm text-muted">
                {state === 'missing' ? 'This link is missing its verification token.' : message}
              </p>
              <p className="mt-4 text-sm text-muted">
                You can request a new link from your account settings after signing in.
              </p>
              <Link to="/login" className="btn-ghost mt-6 inline-block">Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}