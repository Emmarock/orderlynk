import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Product, Vendor } from '../lib/types'
import { money, titleCase } from '../lib/format'
import { useCart } from '../context/CartContext'
import { PageLoader } from '../components/ui'

export default function ProductDetail() {
  const { slug = '', productId } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [qty, setQty] = useState(1)
  const [notFound, setNotFound] = useState(false)
  const { add } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    api
      .storefront(slug)
      .then((d) => {
        const p = d.products.find((x) => String(x.id) === productId)
        if (!p) setNotFound(true)
        setProduct(p ?? null)
        setVendor(d.vendor)
      })
      .catch(() => setNotFound(true))
  }, [slug, productId])

  if (notFound)
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="font-display text-2xl">Product not found</p>
        <Link to={`/vendor/${slug}`} className="btn-primary mt-4">Back to store</Link>
      </div>
    )
  if (!product || !vendor) return <PageLoader />

  const soldOut = product.quantityAvailable <= 0

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link to="/" className="hover:text-clay">Marketplace</Link> ·{' '}
        <Link to={`/vendor/${slug}`} className="hover:text-clay">{vendor.businessName}</Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="aspect-square bg-sand">
            {product.productImageUrl ? (
              <img src={product.productImageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <span className="font-display text-6xl text-line">{product.name[0]}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <span className="chip bg-sand text-muted">{titleCase(product.category)}</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-3 font-mono text-2xl font-semibold">{money(product.price, product.currency)}</p>
          {product.description && <p className="mt-4 text-muted">{product.description}</p>}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-cream p-3">
              <dt className="text-xs uppercase tracking-wider text-muted">Fulfillment</dt>
              <dd className="font-medium">{titleCase(product.fulfillmentType)}</dd>
            </div>
            <div className="rounded-xl bg-cream p-3">
              <dt className="text-xs uppercase tracking-wider text-muted">Availability</dt>
              <dd className="font-medium">{soldOut ? 'Sold out' : `${product.quantityAvailable} in stock`}</dd>
            </div>
            {product.originCountry && (
              <div className="rounded-xl bg-cream p-3">
                <dt className="text-xs uppercase tracking-wider text-muted">Origin</dt>
                <dd className="font-medium">{product.originCountry}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-line bg-cream">
              <button className="px-4 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button
                className="px-4 py-2 text-lg"
                onClick={() => setQty((q) => Math.min(product.quantityAvailable, q + 1))}
              >
                +
              </button>
            </div>
            <button
              disabled={soldOut}
              className="btn-primary flex-1"
              onClick={() => {
                add(product, vendor.businessName, vendor.storeSlug, qty)
                navigate('/cart')
              }}
            >
              {soldOut ? 'Sold out' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
