import type { BookingStatus, FulfillmentStatus, PaymentStatus, ServiceOffering } from './types'

/** The price actually charged for a product (discounted price when a discount applies). */
export function effectivePrice(p: { price: number; discountedPrice: number; discountPercent: number }): number {
  return p.discountPercent > 0 ? p.discountedPrice : p.price
}

/**
 * Price to advertise for a service: the lowest active sub-service (variant) price when the service
 * has variants — flagged so callers can prefix "from" — otherwise the flat base price.
 */
export function serviceStartingPrice(s: ServiceOffering): { amount: number; from: boolean } {
  const active = (s.variants ?? []).filter((v) => v.active)
  return active.length
    ? { amount: Math.min(...active.map((v) => v.price)), from: true }
    : { amount: s.basePrice, from: false }
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

/** Date only, no time — e.g. "Jun 12, 2026". */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Time only — e.g. "2:30 PM". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
}

const BOOKING_TONE: Record<BookingStatus, string> = {
  DRAFT: 'bg-ink/8 text-muted',
  REQUESTED: 'bg-gold/15 text-[#9A6A10]',
  APPROVED: 'bg-clay/15 text-clay-dark',
  DEPOSIT_PENDING: 'bg-gold/15 text-[#9A6A10]',
  CONFIRMED: 'bg-forest/12 text-forest',
  REMINDER_SENT: 'bg-forest/12 text-forest',
  IN_PROGRESS: 'bg-clay/15 text-clay-dark',
  COMPLETED: 'bg-forest/12 text-forest',
  BALANCE_PENDING: 'bg-gold/15 text-[#9A6A10]',
  CLOSED: 'bg-ink/8 text-muted',
  CANCELLED: 'bg-clay/12 text-clay-dark',
  NO_SHOW: 'bg-clay/12 text-clay-dark',
  REJECTED: 'bg-clay/12 text-clay-dark',
}

export function bookingTone(status: BookingStatus): string {
  return BOOKING_TONE[status] ?? 'bg-ink/8 text-ink'
}

/** Tone for the many batch / batch-order / shipment-request statuses, by keyword. */
export function cargoTone(status: string): string {
  const s = status.toUpperCase()
  if (['COMPLETED', 'PAID', 'DELIVERED', 'ARRIVED', 'CLEARED', 'OPEN', 'ADDED_TO_BATCH'].includes(s)) {
    return 'bg-forest/12 text-forest'
  }
  if (['CANCELLED', 'REJECTED', 'DELAYED'].includes(s)) return 'bg-clay/12 text-clay-dark'
  if (s.includes('PENDING') || s.includes('AWAITING') || s.includes('INVOICE') || s === 'CLOSING_SOON' || s === 'DRAFT') {
    return 'bg-gold/15 text-[#9A6A10]'
  }
  if (s === 'READY_FOR_PICKUP') return 'bg-clay/15 text-clay-dark'
  return 'bg-ink/8 text-ink'
}
