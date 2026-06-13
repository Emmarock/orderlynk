import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/shared/lib/types'
import { effectivePrice } from '@/shared/lib/format'

export interface CartLine {
  product: Product
  quantity: number
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
  add: (product: Product, vendorName: string, vendorSlug: string, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<CartState | undefined>(undefined)
const KEY = 'orderlynk.cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(() => {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CartData) : null
  })

  useEffect(() => {
    if (cart) localStorage.setItem(KEY, JSON.stringify(cart))
    else localStorage.removeItem(KEY)
  }, [cart])

  const add: CartState['add'] = (product, vendorName, vendorSlug, quantity = 1) => {
    setCart((prev) => {
      // Carts are single-vendor (orders are per-vendor); switching vendor resets the cart.
      if (!prev || prev.vendorId !== product.vendorId) {
        return { vendorId: product.vendorId, vendorName, vendorSlug, lines: [{ product, quantity }] }
      }
      const existing = prev.lines.find((l) => l.product.id === product.id)
      const lines = existing
        ? prev.lines.map((l) =>
            l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l,
          )
        : [...prev.lines, { product, quantity }]
      return { ...prev, lines }
    })
  }

  const setQuantity: CartState['setQuantity'] = (productId, quantity) => {
    setCart((prev) => {
      if (!prev) return prev
      const lines = prev.lines
        .map((l) => (l.product.id === productId ? { ...l, quantity } : l))
        .filter((l) => l.quantity > 0)
      return lines.length ? { ...prev, lines } : null
    })
  }

  const remove: CartState['remove'] = (productId) => setQuantity(productId, 0)
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
