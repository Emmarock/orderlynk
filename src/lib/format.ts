import type { FulfillmentStatus, PaymentStatus } from './types'

/** The price actually charged for a product (discounted price when a discount applies). */
export function effectivePrice(p: { price: number; discountedPrice: number; discountPercent: number }): number {
  return p.discountPercent > 0 ? p.discountedPrice : p.price
}

export function money(amount: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(amount)
}

/** Turns ENUM_CASE into Title Case. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  PAID: 'bg-forest/12 text-forest',
  PENDING: 'bg-gold/15 text-[#9A6A10]',
  PARTIAL: 'bg-gold/15 text-[#9A6A10]',
  FAILED: 'bg-clay/12 text-clay-dark',
  REFUNDED: 'bg-ink/8 text-muted',
  CANCELLED: 'bg-ink/8 text-muted',
}

export function paymentTone(status: PaymentStatus): string {
  return PAYMENT_TONE[status] ?? 'bg-ink/8 text-muted'
}

export function fulfillmentTone(status: FulfillmentStatus): string {
  if (status === 'COMPLETED' || status === 'DELIVERED') return 'bg-forest/12 text-forest'
  if (status === 'CANCELLED') return 'bg-clay/12 text-clay-dark'
  if (status === 'READY_FOR_PICKUP') return 'bg-clay/15 text-clay-dark'
  return 'bg-ink/8 text-ink'
}
