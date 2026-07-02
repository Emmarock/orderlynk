import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { Product } from '@/shared/lib/types'
import { effectivePrice } from '@/shared/lib/format'

/** A selected product variant (colour and/or size). Either field may be absent. */
export interface VariantSelection {
  selectedColor?: string
  selectedSize?: string
}

export interface CartLine extends VariantSelection {
  /** Stable line identity: same product with a different colour/size is a separate line. */
  id: string
  product: Product
  quantity: number
}

/** Composite key so the same product in different colours/sizes occupies distinct cart lines. */
export function lineId(productId: string, sel?: VariantSelection): string {
  return `${productId}|${sel?.selectedColor ?? ''}|${sel?.selectedSize ?? ''}`
}

interface CartData {
  vendorId: string
  vendorName: string
  vendorSlug: string
  lines: CartLine[]
}

interface CartState {
  cart: CartData | null
  count: number
  subtotal: number
  add: (
    product: Product,
    vendorName: string,
    vendorSlug: string,
    quantity?: number,
    variant?: VariantSelection,
  ) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartState | undefined>(undefined)
const KEY = 'orderlynk.cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(() => {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CartData
    // Backfill line ids for carts persisted before variants existed.
    data.lines = data.lines.map((l) => ({ ...l, id: l.id ?? lineId(l.product.id, l) }))
    return data
  })

  useEffect(() => {
    if (cart) localStorage.setItem(KEY, JSON.stringify(cart))
    else localStorage.removeItem(KEY)
  }, [cart])

  // Transient "added to cart" toast — one shared confirmation for every add() call site.
  const [notice, setNotice] = useState<{ id: number; product: Product; quantity: number; variant: VariantSelection } | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>()
  const noticeSeq = useRef(0)

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current) }, [])

  const add: CartState['add'] = (product, vendorName, vendorSlug, quantity = 1, variant = {}) => {
    const id = lineId(product.id, variant)
    const line: CartLine = { id, product, quantity, ...variant }
    // Re-key on every add so re-adding the same product replays the animation and resets the timer.
    noticeSeq.current += 1
    setNotice({ id: noticeSeq.current, product, quantity, variant })
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 2800)
    setCart((prev) => {
      // Carts are single-vendor (orders are per-vendor); switching vendor resets the cart.
      if (!prev || prev.vendorId !== product.vendorId) {
        return { vendorId: product.vendorId, vendorName, vendorSlug, lines: [line] }
      }
      const existing = prev.lines.find((l) => l.id === id)
      const lines = existing
        ? prev.lines.map((l) => (l.id === id ? { ...l, quantity: l.quantity + quantity } : l))
        : [...prev.lines, line]
      return { ...prev, lines }
    })
  }

  const setQuantity: CartState['setQuantity'] = (id, quantity) => {
    setCart((prev) => {
      if (!prev) return prev
      const lines = prev.lines
        .map((l) => (l.id === id ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0)
      return lines.length ? { ...prev, lines } : null
    })
  }

  const remove: CartState['remove'] = (id) => setQuantity(id, 0)
  const clear = () => setCart(null)

  const count = useMemo(() => cart?.lines.reduce((n, l) => n + l.quantity, 0) ?? 0, [cart])
  const subtotal = useMemo(
    () => cart?.lines.reduce((n, l) => n + effectivePrice(l.product) * l.quantity, 0) ?? 0,
    [cart],
  )

  return (
    <CartContext.Provider value={{ cart, count, subtotal, add, setQuantity, remove, clear }}>
      {children}
      <AddedToCartToast notice={notice} onDismiss={() => setNotice(null)} />
    </CartContext.Provider>
  )
}

/** Bottom-centered confirmation that briefly appears whenever an item is added to the cart. */
function AddedToCartToast({
  notice,
  onDismiss,
}: {
  notice: { id: number; product: Product; quantity: number; variant: VariantSelection } | null
  onDismiss: () => void
}) {
  const variantLabel = notice
    ? [notice.variant.selectedColor, notice.variant.selectedSize].filter(Boolean).join(' · ')
    : ''
  return (
    // Full-width, click-through wrapper centers the toast; the card itself is interactive.
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto w-full max-w-sm"
            role="status"
            aria-live="polite"
          >
            <div className="card flex items-center gap-3 p-3 shadow-xl">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                {notice.product.productImageUrl ? (
                  <img src={notice.product.productImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center font-display text-lg text-line">
                    {notice.product.name[0]}
                  </div>
                )}
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-forest text-cream shadow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-forest">Added to cart</p>
                <p className="truncate text-sm text-muted">
                  {notice.quantity > 1 ? `${notice.quantity} × ` : ''}
                  {notice.product.name}
                  {variantLabel ? ` · ${variantLabel}` : ''}
                </p>
              </div>
              <Link to="/cart" onClick={onDismiss} className="btn-primary shrink-0 px-3 py-1.5 text-sm">
                View cart
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
