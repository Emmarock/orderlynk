import { Link } from 'react-router-dom'
import StripeOnboardingCard from '@/features/vendor/components/StripeOnboardingCard'

/**
 * Landing page Stripe redirects to after hosted onboarding (the configured
 * return/refresh URLs). It simply re-checks the connected-account status (via the
 * onboarding card, which fetches it fresh) so the vendor sees whether they're
 * active, and links back into the console.
 */
export default function VendorOnboardingReturn() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Payment setup</h1>
      <p className="mt-2 text-muted">We’ve refreshed your Stripe status below.</p>
      <div className="mt-6">
        <StripeOnboardingCard refreshOnMount />
      </div>
      <Link to="/vendor/manage/settings" className="btn-ghost mt-6 inline-block">← Back to settings</Link>
    </div>
  )
}