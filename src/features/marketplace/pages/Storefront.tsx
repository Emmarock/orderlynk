import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import type {
  BatchCard,
  Product,
  RatingSummary,
  ServiceOffering,
  Storefront as StorefrontData,
  Vendor,
} from '@/shared/lib/types'
import { formatDay, money, serviceStartingPrice, titleCase } from '@/shared/lib/format'
import { useAuth } from '@/shared/context/AuthContext'
import { useCart } from '@/shared/context/CartContext'
import { EmptyState, PageLoader, Spinner, ThemeToggle } from '@/shared/components/ui'
import { PriceTag } from '@/shared/components/PriceTag'

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          className={`text-xl leading-none ${onPick ? 'cursor-pointer' : 'cursor-default'} ${n <= value ? 'text-clay' : 'text-line'}`}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  )
}

function RatingWidget({ vendor }: { vendor: Vendor }) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<RatingSummary>({
    rating: vendor.rating ?? null,
    ratingCount: vendor.ratingCount,
    myStars: null,
  })
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    api
      .myVendorRating(vendor.storeSlug)
      .then((s) => {
        setSummary(s)
        if (s.myStars) setStars(s.myStars)
      })
      .catch(() => {})
  }, [user, vendor.storeSlug])

  const submit = async () => {
    if (!stars) return
    setSaving(true)
    setNote(null)
    try {
      const s = await api.rateVendor(vendor.storeSlug, { stars, comment: comment || undefined })
      setSummary(s)
      setNote('Thanks for rating!')
    } catch (err) {
      setNote(err instanceof ApiError ? err.message : 'Could not submit rating')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-sand/40 p-4">
      <div className="flex items-center gap-2">
        <Stars value={Math.round(summary.rating ?? 0)} />
        <span className="text-sm font-medium">
          {summary.rating
            ? `${summary.rating.toFixed(1)} · ${summary.ratingCount} rating${summary.ratingCount === 1 ? '' : 's'}`
            : 'No ratings yet'}
        </span>
      </div>
      {user ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted">
            {summary.myStars ? 'Update your rating' : 'Rate this vendor'}
          </p>
          <Stars value={stars} onPick={setStars} />
          <textarea
            className="field min-h-16 text-sm"
            placeholder="Add a short review (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button className="btn-forest px-4 py-2" disabled={!stars || saving} onClick={submit}>
              {saving ? <Spinner /> : summary.myStars ? 'Update rating' : 'Submit rating'}
            </button>
            {note && <span className="text-sm text-muted">{note}</span>}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">
          <Link to="/login" className="text-clay hover:underline">Sign in</Link> to rate this vendor.
        </p>
      )}
    </div>
  )
}

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
  // Products with colour/size options can't be quick-added — the shopper picks a variant on the detail page.
  const hasOptions = (product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0
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
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <PriceTag product={product} className="text-lg" />
          {hasOptions ? (
            <Link to={to} className={`btn-forest px-4 py-2 ${soldOut ? 'pointer-events-none opacity-50' : ''}`}>
              {soldOut ? 'Sold out' : 'Select'}
            </Link>
          ) : (
            <button onClick={onAdd} disabled={soldOut} className="btn-forest px-4 py-2">
              {soldOut ? 'Sold out' : 'Add'}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">{titleCase(product.fulfillmentType)}</p>
      </div>
    </div>
  )
}

function ServiceTile({ service, to }: { service: ServiceOffering; to: string }) {
  return (
    <Link to={to} className="card group flex flex-col overflow-hidden">
      <div className="relative block aspect-[4/3] overflow-hidden bg-sand">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <span className="font-display text-3xl text-line">{service.name[0]}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 chip bg-cream/90 text-muted backdrop-blur">
          {titleCase(service.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="font-display text-lg font-semibold leading-tight group-hover:text-clay">
          {service.name}
        </span>
        {service.description && <p className="line-clamp-2 text-sm text-muted">{service.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-semibold">
            {serviceStartingPrice(service).from ? 'from ' : ''}{money(serviceStartingPrice(service).amount, service.currency)}
          </span>
          <span className="btn-forest px-4 py-2">Book</span>
        </div>
        <p className="text-xs text-muted">{service.durationMinutes} min</p>
        {service.depositType !== 'NONE' && service.depositAmount > 0 && (
          <span className="chip self-start bg-clay/12 font-medium text-clay-dark">
            {money(service.depositAmount, service.currency)} deposit to book
          </span>
        )}
      </div>
    </Link>
  )
}

function BatchTile({ batch }: { batch: BatchCard }) {
  const badge =
    batch.batchType === 'CARGO_BATCH'
      ? { label: 'Cargo Batch', cls: 'bg-clay/12 text-clay-dark' }
      : batch.batchType === 'HYBRID_BATCH'
        ? { label: 'Batch + Cargo', cls: 'bg-gold/15 text-gold' }
        : { label: 'Batch Order', cls: 'bg-forest/12 text-forest' }
  return (
    <Link to={`/batches/${batch.id}`} className="card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between">
        <span className={`chip ${badge.cls}`}>{badge.label}</span>
        {batch.shippingMethod && <span className="text-xs text-muted">{titleCase(batch.shippingMethod)}</span>}
      </div>
      <p className="font-display text-lg font-semibold group-hover:text-clay">{batch.batchName}</p>
      {batch.route && <p className="text-sm text-muted">{batch.route}</p>}
      <div className="mt-auto space-y-1 text-xs text-muted">
        {batch.originCountry && (
          <p>From {batch.originCountry}{batch.destinationCity ? ` → ${batch.destinationCity}` : ''}</p>
        )}
        {batch.closeDate && <p>Orders close {formatDay(batch.closeDate)}</p>}
        {batch.estimatedArrival && <p>Est. arrival {formatDay(batch.estimatedArrival)}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-muted">{batch.productCount} product{batch.productCount !== 1 ? 's' : ''}</span>
        {batch.acceptsShipmentRequests && batch.ratePerKg != null && (
          <span className="font-medium">{money(batch.ratePerKg, batch.currency)}/kg</span>
        )}
      </div>
    </Link>
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

  const { vendor, products, services, batches } = data
  const hasProducts = products.length > 0
  const hasServices = services.length > 0
  const hasBatches = batches.length > 0

  return (
    <div>
      {/* Cover banner */}
      {vendor.bannerUrl && (
        <div className="h-40 w-full overflow-hidden bg-sand sm:h-56">
          <img src={vendor.bannerUrl} alt={`${vendor.businessName} banner`} className="h-full w-full object-cover" />
        </div>
      )}

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
              <p className="eyebrow">{vendor.city ?? 'Canada'}</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {vendor.businessName}
              </h1>
              {vendor.description && <p className="mt-2 max-w-2xl text-muted">{vendor.description}</p>}
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
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
              {vendor.tiktokHandle && (
                  <a
                      href={`https://tiktok.com/${vendor.tiktokHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost"
                  >
                    TikTok
                  </a>
              )}
              {vendor.facebookPage && (
                  <a
                      href={`https://facebook.com/${vendor.facebookPage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost"
                  >
                    Facebook
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

      <section className="mx-auto max-w-6xl px-5 py-12">
        {/* Nothing published yet */}
        {!hasProducts && !hasServices && !hasBatches && (
          <EmptyState title="Nothing here yet" hint="This vendor hasn't published anything yet." />
        )}

        {/* Products */}
        {hasProducts && (
          <div>
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">Products</h2>
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
          </div>
        )}

        {/* Services */}
        {hasServices && (
          <div className={hasProducts ? 'mt-14' : ''}>
            <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">Services</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceTile key={s.id} service={s} to={`/services/${vendor.storeSlug}`} />
              ))}
            </div>
          </div>
        )}

        {/* Batch & Cargo */}
        {hasBatches && (
          <div className={hasProducts || hasServices ? 'mt-14' : ''}>
            <h2 className="mb-1 font-display text-2xl font-semibold tracking-tight">Batch &amp; Cargo</h2>
            <p className="mb-4 max-w-2xl text-sm text-muted">
              Pre-order from an import batch, or send your own items into a cargo batch. Items ship on a
              schedule — check each batch's estimated arrival.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((b) => (
                <BatchTile key={b.id} batch={b} />
              ))}
            </div>
          </div>
        )}

        {/* Ratings & reviews — below the offerings so customers see the menu first */}
        <div className="mt-14 max-w-md">
          <h2 className="mb-3 font-display text-xl font-semibold tracking-tight">Ratings &amp; reviews</h2>
          <RatingWidget vendor={vendor} />
        </div>
      </section>
    </div>
  )
}
