import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '@/shared/lib/api'
import type { Product, Vendor } from '@/shared/lib/types'
import { titleCase } from '@/shared/lib/format'
import { PriceTag } from '@/shared/components/PriceTag'
import { useCart } from '@/shared/context/CartContext'
import { swatch } from '@/shared/lib/swatch'
import { PageLoader } from '@/shared/components/ui'

export default function ProductDetail() {
  const { slug = '', productId } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
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
  const colors = product.colors ?? []
  const sizes = product.sizes ?? []
  // When a product defines options, the shopper must choose before adding to cart.
  const needsColor = colors.length > 0 && !selectedColor
  const needsSize = sizes.length > 0 && !selectedSize
  const selectionIncomplete = needsColor || needsSize
  const images = product.imageUrls?.length
    ? product.imageUrls
    : product.productImageUrl
      ? [product.productImageUrl]
      : []
  const cover = images[Math.min(active, images.length - 1)]

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <nav className="mb-4 text-sm text-muted">
        <Link to="/" className="hover:text-clay">Marketplace</Link> ·{' '}
        <Link to={`/vendor/${slug}`} className="hover:text-clay">{vendor.businessName}</Link>
      </nav>

      {/* Vendor branding row */}
      <Link to={`/vendor/${slug}`} className="mb-6 inline-flex items-center gap-3">
        {vendor.logoUrl ? (
          <img src={vendor.logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest/10 font-display text-base font-semibold text-forest">
            {vendor.businessName[0]}
          </span>
        )}
        <span className="font-medium">
          {vendor.businessName}
          {vendor.rating ? <span className="ml-2 text-sm text-muted">★ {vendor.rating}</span> : null}
        </span>
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="card overflow-hidden">
            <div className="aspect-square bg-sand">
              {cover ? (
                <img src={cover} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <span className="font-display text-6xl text-line">{product.name[0]}</span>
                </div>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === Math.min(active, images.length - 1) ? 'border-forest' : 'border-line'
                  }`}
                >
                  <img src={url} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {product.videoUrl && (
            <video
              src={product.videoUrl}
              controls
              className="mt-4 aspect-video w-full rounded-xl border border-line bg-ink/5"
            />
          )}
        </div>

        <div>
          <span className="chip bg-sand text-muted">{titleCase(product.category)}</span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-3"><PriceTag product={product} className="text-2xl" /></div>
          {product.description && <p className="mt-4 text-muted">{product.description}</p>}

          {colors.length > 0 && (
            <div className="mt-6">
              <p className="label">Colour{needsColor && <span className="text-clay"> *</span>}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selectedColor === c ? 'border-forest bg-forest/8 text-forest' : 'border-line bg-cream hover:border-ink/30'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-line"
                      style={{ backgroundColor: swatch(c) }}
                    />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mt-4">
              <p className="label">Size{needsSize && <span className="text-clay"> *</span>}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[3rem] rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selectedSize === s ? 'border-forest bg-forest/8 text-forest' : 'border-line bg-cream hover:border-ink/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              disabled={soldOut || selectionIncomplete}
              className="btn-primary flex-1"
              onClick={() => {
                add(product, vendor.businessName, vendor.storeSlug, qty, {
                  selectedColor: selectedColor || undefined,
                  selectedSize: selectedSize || undefined,
                })
                navigate('/cart')
              }}
            >
              {soldOut
                ? 'Sold out'
                : needsColor && needsSize
                  ? 'Select colour & size'
                  : needsColor
                    ? 'Select a colour'
                    : needsSize
                      ? 'Select a size'
                      : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
