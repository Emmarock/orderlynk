import { useState } from 'react'
import { api, ApiError } from '@/shared/lib/api'
import type { DimensionUnit, FulfillmentType, Product, ProductCategory, WeightUnit } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { money, titleCase } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { EmptyState, ErrorNote, LoadMore, PageLoader, Spinner } from '@/shared/components/ui'

const CATEGORIES: ProductCategory[] = [
  'GROCERIES', 'BEAUTY', 'FASHION', 'HOUSEHOLD', 'ELECTRONICS', 'BABY_AND_KIDS', 'EVENT_ITEMS', 'OTHER',
]
const FULFILLMENT: FulfillmentType[] = [
  'LOCAL_PICKUP', 'LOCAL_DELIVERY', 'DOMESTIC_SHIPPING', 'IMPORT_BATCH',
]
const WEIGHT_UNITS: WeightUnit[] = ['G', 'KG', 'OZ', 'LB']
const DIMENSION_UNITS: DimensionUnit[] = ['CM', 'IN', 'MM', 'M', 'FT', 'YD']

interface FormState {
  name: string
  description: string
  category: ProductCategory
  price: string
  discountPercent: string
  quantityAvailable: string
  lowStockThreshold: string
  imageUrls: string[]
  videoUrl: string
  fulfillmentType: FulfillmentType
  originCountry: string
  weight: string
  weightUnit: WeightUnit
  length: string
  width: string
  height: string
  dimensionUnit: DimensionUnit
}

const EMPTY: FormState = {
  name: '',
  description: '',
  category: 'GROCERIES',
  price: '',
  discountPercent: '0',
  quantityAvailable: '0',
  lowStockThreshold: '0',
  imageUrls: [],
  videoUrl: '',
  fulfillmentType: 'LOCAL_PICKUP',
  originCountry: '',
  weight: '',
  weightUnit: 'G',
  length: '',
  width: '',
  height: '',
  dimensionUnit: 'CM',
}

const numOrUndefined = (v: string): number | undefined => {
  const n = Number(v)
  return v.trim() === '' || Number.isNaN(n) ? undefined : n
}

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    description: p.description ?? '',
    category: p.category,
    price: String(p.price),
    discountPercent: String(p.discountPercent),
    quantityAvailable: String(p.quantityAvailable),
    lowStockThreshold: String(p.lowStockThreshold),
    imageUrls: p.imageUrls?.length ? p.imageUrls : p.productImageUrl ? [p.productImageUrl] : [],
    videoUrl: p.videoUrl ?? '',
    fulfillmentType: p.fulfillmentType,
    originCountry: p.originCountry ?? '',
    weight: p.weight != null ? String(p.weight) : '',
    weightUnit: p.weightUnit ?? 'G',
    length: p.length != null ? String(p.length) : '',
    width: p.width != null ? String(p.width) : '',
    height: p.height != null ? String(p.height) : '',
    dimensionUnit: p.dimensionUnit ?? 'CM',
  }
}

function ProductForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(initial ? fromProduct(initial) : EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [generating, setGenerating] = useState(false)

  const MAX_IMAGES = 6

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const generateDescription = async () => {
    if (!form.name.trim() || generating) return
    setGenerating(true)
    setError(null)
    try {
      const { description } = await api.generateProductDescription({ name: form.name.trim(), category: form.category })
      setForm((f) => ({ ...f, description }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not generate description')
    } finally {
      setGenerating(false)
    }
  }

  // Auto-generate once the name is entered, but only when the description is still empty
  // so we never clobber what the vendor has written. They can also regenerate manually.
  const onNameBlur = () => {
    if (form.name.trim() && !form.description.trim()) void generateDescription()
  }

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file after a remove
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url } = await api.uploadProductImage(file)
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url].slice(0, MAX_IMAGES) }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, idx) => idx !== i) }))

  // Promote an image to the front of the list — index 0 is the cover/thumbnail.
  const makeCover = (i: number) =>
    setForm((f) => {
      if (i === 0) return f
      const next = [...f.imageUrls]
      const [picked] = next.splice(i, 1)
      next.unshift(picked)
      return { ...f, imageUrls: next }
    })

  const pickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingVideo(true)
    setError(null)
    try {
      const { url } = await api.uploadProductVideo(file)
      setForm((f) => ({ ...f, videoUrl: url }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload video')
    } finally {
      setUploadingVideo(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const body = {
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      price: Number(form.price),
      discountPercent: Number(form.discountPercent) || 0,
      quantityAvailable: Number(form.quantityAvailable),
      lowStockThreshold: Number(form.lowStockThreshold),
      imageUrls: form.imageUrls,
      videoUrl: form.videoUrl || undefined,
      fulfillmentType: form.fulfillmentType,
      originCountry: form.originCountry || undefined,
      weight: numOrUndefined(form.weight),
      weightUnit: form.weightUnit,
      length: numOrUndefined(form.length),
      width: numOrUndefined(form.width),
      height: numOrUndefined(form.height),
      dimensionUnit: form.dimensionUnit,
    }
    try {
      if (initial) await api.updateProduct(initial.id, body)
      else await api.createProduct(body)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save product')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">{initial ? 'Edit product' : 'New product'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="field" required value={form.name} onChange={set('name')} onBlur={onNameBlur} />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Description</label>
              <button
                type="button"
                className="btn-quiet px-2 text-sm text-forest disabled:opacity-50"
                onClick={generateDescription}
                disabled={!form.name.trim() || generating}
                title="Write a captivating description from the product name"
              >
                {generating ? <Spinner /> : form.description.trim() ? '✨ Regenerate' : '✨ Generate'}
              </button>
            </div>
            <textarea
              className="field min-h-20"
              value={form.description}
              onChange={set('description')}
              placeholder={generating ? 'Writing a captivating description…' : undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (CAD)</label>
              <input className="field" type="number" step="0.01" min="0" required value={form.price} onChange={set('price')} />
            </div>
            <div>
              <label className="label">Discount %</label>
              <input className="field" type="number" min="0" max="100" value={form.discountPercent} onChange={set('discountPercent')} />
              {Number(form.discountPercent) > 0 && Number(form.price) > 0 && (
                <p className="mt-1 text-xs text-muted">
                  Sells for {money(Number(form.price) * (1 - Number(form.discountPercent) / 100))}
                </p>
              )}
            </div>
            <div>
              <label className="label">Quantity</label>
              <input className="field" type="number" min="0" value={form.quantityAvailable} onChange={set('quantityAvailable')} />
            </div>
            <div>
              <label className="label">Low-stock alert at</label>
              <input className="field" type="number" min="0" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
              <p className="mt-1 text-xs text-muted">Alert when stock ≤ this. 0 = off.</p>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="field" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fulfillment</label>
              <select className="field" value={form.fulfillmentType} onChange={set('fulfillmentType')}>
                {FULFILLMENT.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Product images</label>
              <span className="text-xs text-muted">{form.imageUrls.length}/{MAX_IMAGES} · first is the cover</span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {form.imageUrls.map((url, i) => (
                <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                  <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-1 top-1 chip bg-cream/90 px-1.5 py-0.5 text-[10px] text-muted backdrop-blur">Cover</span>
                  ) : (
                    <button
                      type="button"
                      className="absolute left-1 top-1 chip bg-cream/90 px-1.5 py-0.5 text-[10px] text-forest backdrop-blur"
                      onClick={() => makeCover(i)}
                      title="Use as cover image"
                    >
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/60 text-xs text-cream"
                    onClick={() => removeImage(i)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
              {form.imageUrls.length < MAX_IMAGES && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-line text-center text-xs text-muted hover:border-forest hover:text-forest">
                  {uploading ? <Spinner /> : <span>+ Add<br />image</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
                </label>
              )}
            </div>
            {form.imageUrls.length === 0 && (
              <p className="mt-1 text-xs text-muted">Add at least one image (front, side, back…). Up to {MAX_IMAGES}.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product video <span className="font-normal text-muted">(optional)</span></label>
              {form.videoUrl ? (
                <div className="space-y-2">
                  <video src={form.videoUrl} controls className="aspect-video w-full rounded-lg border border-line bg-ink/5" />
                  <button
                    type="button"
                    className="btn-quiet px-2 text-sm text-clay hover:text-clay-dark"
                    onClick={() => setForm((f) => ({ ...f, videoUrl: '' }))}
                  >
                    Remove video
                  </button>
                </div>
              ) : (
                <label className="field flex cursor-pointer items-center justify-center gap-2 text-muted">
                  {uploadingVideo ? <Spinner /> : 'Browse device…'}
                  <input type="file" accept="video/*" className="hidden" onChange={pickVideo} disabled={uploadingVideo} />
                </label>
              )}
            </div>
            <div>
              <label className="label">Origin country</label>
              <input className="field" value={form.originCountry} onChange={set('originCountry')} />
            </div>
          </div>

          {/* Shipping: weight & packed dimensions per item — used to calculate live carrier rates. */}
          <div className="rounded-xl border border-line bg-sand/40 p-4">
            <div className="flex items-center justify-between">
              <p className="label !mb-0">Shipping size &amp; weight</p>
              <span className="text-xs text-muted">Per item — powers live shipping rates</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="label">Weight</label>
                <input className="field" type="number" step="0.01" min="0" placeholder="0.00"
                       value={form.weight} onChange={set('weight')} />
              </div>
              <div>
                <label className="label">Weight unit</label>
                <select className="field" value={form.weightUnit} onChange={set('weightUnit')}>
                  {WEIGHT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              <div>
                <label className="label">Length</label>
                <input className="field" type="number" step="0.01" min="0" placeholder="L"
                       value={form.length} onChange={set('length')} />
              </div>
              <div>
                <label className="label">Width</label>
                <input className="field" type="number" step="0.01" min="0" placeholder="W"
                       value={form.width} onChange={set('width')} />
              </div>
              <div>
                <label className="label">Height</label>
                <input className="field" type="number" step="0.01" min="0" placeholder="H"
                       value={form.height} onChange={set('height')} />
              </div>
              <div>
                <label className="label">Unit</label>
                <select className="field" value={form.dimensionUnit} onChange={set('dimensionUnit')}>
                  {DIMENSION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              Optional, but recommended for shipped products — leave blank to use a default parcel size.
            </p>
          </div>

          {error && <ErrorNote message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving || uploading || uploadingVideo || generating || !form.name.trim() || !form.price.trim() || form.imageUrls.length === 0}>{saving ? <Spinner /> : 'Save product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorProducts() {
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)

  const { items: products, total, loading, loadingMore, hasNext, loadMore, reload } =
    usePagedList<Product>((page, size) => api.vendorProducts(page, size), [])

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }
  const afterSave = () => {
    closeForm()
    reload()
  }

  if (loading) return <PageLoader />

  return (
    <ConsoleShell
      title="Products"
      subtitle="Add, edit and publish your catalogue"
      tabs={VENDOR_TABS}
      actions={<button className="btn-primary" onClick={() => setCreating(true)}>+ New product</button>}
    >
      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Add your first product to start receiving structured orders."
          action={<button className="btn-primary" onClick={() => setCreating(true)}>Add a product</button>}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-sand/50 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Fulfillment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-sand/40">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 font-mono">
                    {p.discountPercent > 0 ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-semibold text-clay-dark">{money(p.discountedPrice, p.currency)}</span>
                        <span className="text-xs text-muted line-through">{money(p.price, p.currency)}</span>
                        <span className="chip bg-clay/12 text-clay-dark">-{p.discountPercent}%</span>
                      </span>
                    ) : (
                      money(p.price, p.currency)
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono">{p.quantityAvailable}</span>
                    {p.lowStock && (
                      <span className="ml-2 chip bg-clay/12 text-clay-dark" title={`At or below threshold of ${p.lowStockThreshold}`}>
                        Low stock
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">{titleCase(p.fulfillmentType)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => api.toggleProduct(p.id, !p.active).then(reload)}
                      className={`chip ${p.active ? 'bg-forest/12 text-forest' : 'bg-ink/8 text-muted'}`}
                    >
                      {p.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="btn-quiet px-2" onClick={() => setEditing(p)}>Edit</button>
                    <button
                      className="btn-quiet px-2 text-clay hover:text-clay-dark"
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) api.deleteProduct(p.id).then(reload)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <LoadMore shown={products.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />

      {(creating || editing) && (
        <ProductForm initial={editing} onClose={closeForm} onSaved={afterSave} />
      )}
    </ConsoleShell>
  )
}
