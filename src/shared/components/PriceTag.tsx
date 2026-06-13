import { money } from '@/shared/lib/format'

interface Priced {
  price: number
  discountedPrice: number
  discountPercent: number
  currency: string
}

/**
 * Shows a product's price. When discounted, renders the discounted price with the
 * original struck through and a "-N%" badge; otherwise just the price.
 */
export function PriceTag({ product, className = '' }: { product: Priced; className?: string }) {
  if (product.discountPercent <= 0) {
    return <span className={`font-mono font-semibold ${className}`}>{money(product.price, product.currency)}</span>
  }
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <span className="font-mono font-semibold text-clay-dark">{money(product.discountedPrice, product.currency)}</span>
      <span className="font-mono text-sm text-muted line-through">{money(product.price, product.currency)}</span>
      <span className="chip bg-clay/12 text-clay-dark">-{product.discountPercent}%</span>
    </span>
  )
}