import { Link } from 'react-router-dom'
import { useCart } from '@/shared/context/CartContext'
import { effectivePrice, money } from '@/shared/lib/format'
import { EmptyState } from '@/shared/components/ui'

export default function Cart() {
  const { cart, subtotal, setQuantity, remove } = useCart()

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState
          title="Your cart is empty"
          hint="Browse verified vendors and add a few products to get started."
          action={<Link to="/" className="btn-primary">Browse marketplace</Link>}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your cart</h1>
      <p className="mt-1 text-muted">
        From{' '}
        <Link to={`/vendor/${cart.vendorSlug}`} className="link-underline">
          {cart.vendorName}
        </Link>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {cart.lines.map((line) => (
            <div key={line.product.id} className="card flex items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                {line.product.productImageUrl ? (
                  <img src={line.product.productImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center font-display text-xl text-line">
                    {line.product.name[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{line.product.name}</p>
                <p className="text-sm text-muted">
                  {money(effectivePrice(line.product), line.product.currency)} each
                  {line.product.discountPercent > 0 && (
                    <>
                      {' '}
                      <span className="line-through">{money(line.product.price, line.product.currency)}</span>
                      <span className="ml-1 text-clay-dark">-{line.product.discountPercent}%</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center rounded-full border border-line">
                <button className="px-3 py-1.5" onClick={() => setQuantity(line.product.id, line.quantity - 1)}>
                  −
                </button>
                <span className="w-7 text-center text-sm font-medium">{line.quantity}</span>
                <button
                  className="px-3 py-1.5"
                  onClick={() =>
                    setQuantity(line.product.id, Math.min(line.product.quantityAvailable, line.quantity + 1))
                  }
                >
                  +
                </button>
              </div>
              <span className="w-20 text-right font-mono font-semibold">
                {money(effectivePrice(line.product) * line.quantity, line.product.currency)}
              </span>
              <button onClick={() => remove(line.product.id)} className="text-muted hover:text-clay" aria-label="Remove">
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="card h-fit p-6">
          <h2 className="font-display text-xl font-semibold">Summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-muted">Product subtotal</span>
            <span className="font-mono font-semibold">{money(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Logistics, platform and processing fees are calculated at checkout.
          </p>
          <Link to="/checkout" className="btn-primary mt-6 w-full">
            Proceed to checkout
          </Link>
          <Link to={`/vendor/${cart.vendorSlug}`} className="btn-quiet mt-2 w-full">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  )
}
