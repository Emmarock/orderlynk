import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import type { Product, Storefront as StorefrontData } from '../lib/types'
import { money, titleCase } from '../lib/format'
import { useCart } from '../context/CartContext'
import { EmptyState, PageLoader } from '../components/ui'

function ProductTile({
  product,
  onAdd,
  to,
}: {
  product: Product
  onAdd: () => void
  to: string
}) {
  const soldOut = product.quantityAvailable <= 0
  return (
    <div className="card group flex flex-col overflow-hidden">
      <Link to={to} className="relative block aspect-[4/3] overflow-hidden bg-sand">
        {product.productImageUrl ? (
          <img
            src={product.productImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="font-display text-3xl text-line">{product.name[0]}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 chip bg-cream/90 text-muted backdrop-blur">
          {titleCase(product.category)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={to} className="font-display text-lg font-semibold leading-tight hover:text-clay">
          {product.name}
        </Link>
        {product.description && <p className="line-clamp-2 text-sm text-muted">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-mono text-lg font-semibold">{money(product.price, product.currency)}</span>
          <button onClick={onAdd} disabled={soldOut} className="btn-forest px-4 py-2">
            {soldOut ? 'Sold out' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-muted">{titleCase(product.fulfillmentType)}</p>
      </div>
    </div>
  )
}

export default function Storefront() {
  const { slug = '' } = useParams()
  const [data, setData] = useState<StorefrontData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { add } = useCart()

  useEffect(() => {
    setData(null)
    setError(null)
    api
      .storefront(slug)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load store'))
  }, [slug])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <EmptyState
          title="Store not found"
          hint="This storefront may be unpublished or awaiting approval."
          action={<Link to="/" className="btn-primary">Back to marketplace</Link>}
        />
      </div>
    )
  }
  if (!data) return <PageLoader />

  const { vendor, products } = data

  return (
    <div>
      {/* Vendor header */}
      <section className="border-b border-line bg-cream">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-2xl bg-forest/10 font-display text-3xl font-semibold text-forest">
                {vendor.businessName[0]}
              </span>
            )}
            <div className="flex-1">
              <p className="eyebrow">{vendor.city ?? 'Canada'}{vendor.rating ? ` · ★ ${vendor.rating}` : ''}</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {vendor.businessName}
              </h1>
              {vendor.description && <p className="mt-2 max-w-2xl text-muted">{vendor.description}</p>}
            </div>
            <div className="flex gap-2">
              {vendor.whatsappNumber && (
                <a
                  href={`https://wa.me/${vendor.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  WhatsApp
                </a>
              )}
              {vendor.instagramHandle && (
                <a
                  href={`https://instagram.com/${vendor.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {vendor.fulfillmentTypes.map((t) => (
              <span key={t} className="chip bg-sand text-muted">
                {titleCase(t)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        {products.length === 0 ? (
          <EmptyState title="No products yet" hint="This vendor hasn't published any products." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductTile
                key={p.id}
                product={p}
                to={`/vendor/${vendor.storeSlug}/product/${p.id}`}
                onAdd={() => add(p, vendor.businessName, vendor.storeSlug)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
