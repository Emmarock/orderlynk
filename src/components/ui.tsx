import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fulfillmentTone, paymentTone, titleCase } from '../lib/format'
import type { FulfillmentStatus, PaymentStatus } from '../lib/types'

/** The signature four-colour brand rail. */
export function Rail({ className = '' }: { className?: string }) {
  return <div className={`rail ${className}`} aria-hidden />
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-ink text-cream">
        <span className="font-display text-lg font-semibold leading-none">O</span>
        <span className="absolute -bottom-0.5 left-1 right-1 h-0.5 rounded-full bg-clay" />
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Orderlynk</span>
    </Link>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`chip ${paymentTone(status)}`}>{titleCase(status)}</span>
}

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  return <span className={`chip ${fulfillmentTone(status)}`}>{titleCase(status)}</span>
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-clay ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-8 py-14 text-center">
      <div className="rail w-12 rounded-full" />
      <p className="font-display text-xl">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-clay/30 bg-clay/8 px-4 py-3 text-sm text-clay-dark">
      {message}
    </div>
  )
}

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
    </div>
  )
}
