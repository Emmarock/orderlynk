import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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

  const add: CartState['add'] = (product, vendorName, vendorSlug, quantity = 1, variant = {}) => {
    const id = lineId(product.id, variant)
    const line: CartLine = { id, product, quantity, ...variant }
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
    </CartContext.Provider>
  )
}

export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
