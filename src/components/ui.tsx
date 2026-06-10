import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fulfillmentTone, paymentTone, titleCase } from '../lib/format'
import type { FulfillmentStatus, PaymentStatus } from '../lib/types'
import { passwordChecks } from '../lib/password'

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

/**
 * Renders an order id with an inline "copy to clipboard" button. The id text
 * inherits font styling from the surrounding element, so it drops into any of
 * the order views without restyling.
 */
export function CopyOrderId({ value, className = '' }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  // The trigger is a role="button" span (not a <button>) so it can sit inside
  // the clickable order rows without nesting interactive <button> elements.
  // stopPropagation keeps a copy from also toggling the surrounding row.
  const copy = async (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable (e.g. insecure context) — silently ignore */
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {value}
      <span
        role="button"
        tabIndex={0}
        onClick={copy}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            void copy(e)
          }
        }}
        title={copied ? 'Copied!' : 'Copy order ID'}
        aria-label={copied ? 'Order ID copied' : 'Copy order ID'}
        className="inline-grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:bg-sand hover:text-ink"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </span>
    </span>
  )
}

/**
 * Live checklist of the password policy. Each rule turns green with a check the
 * moment the typed password satisfies it, so users get immediate feedback as they
 * type rather than a single error on submit. Stays hidden until they start typing.
 *
 * Pass `confirm` to append a "Passwords match" row that lights up once the
 * confirmation field has content and equals the password.
 */
export function PasswordChecklist({
  password,
  confirm,
  className = '',
}: {
  password: string
  confirm?: string
  className?: string
}) {
  const checks = passwordChecks(password)
  if (confirm !== undefined) {
    checks.push({ label: 'Passwords match', met: password.length > 0 && password === confirm })
  }
  // Nothing to show until the user has started typing in either field.
  if (!password && !confirm) return null
  return (
    <ul className={`mt-2 space-y-1 ${className}`} aria-label="Password requirements">
      {checks.map(({ label, met }) => (
        <li
          key={label}
          className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-forest' : 'text-muted'}`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {met ? <path d="M20 6 9 17l-5-5" /> : <circle cx="12" cy="12" r="9" strokeWidth="2" />}
          </svg>
          <span>{label}</span>
          <span className="sr-only">{met ? 'met' : 'not met'}</span>
        </li>
      ))}
    </ul>
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
