import { loadStripe, type Stripe } from '@stripe/stripe-js'

/**
 * Singleton Stripe.js promise, created from the publishable key. Safe to expose
 * to the browser. Returns null when the key isn't configured so the UI can show
 * a helpful message instead of crashing.
 */
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

export const stripePromise: Promise<Stripe | null> | null =
  publishableKey ? loadStripe(publishableKey) : null