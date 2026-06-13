import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-28 text-center">
      <p className="font-mono text-6xl font-semibold text-clay">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to marketplace</Link>
    </div>
  )
}
