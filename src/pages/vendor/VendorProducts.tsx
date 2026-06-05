import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type { FulfillmentType, Product, ProductCategory } from '../../lib/types'
import { money, titleCase } from '../../lib/format'
import { ConsoleShell, VENDOR_TABS } from '../../components/Console'
import { EmptyState, ErrorNote, PageLoader, Spinner } from '../../components/ui'

const CATEGORIES: ProductCategory[] = [
  'GROCERIES', 'BEAUTY', 'FASHION', 'HOUSEHOLD', 'ELECTRONICS', 'BABY_AND_KIDS', 'EVENT_ITEMS', 'OTHER',
]
const FULFILLMENT: FulfillmentType[] = [
  'LOCAL_PICKUP', 'LOCAL_DELIVERY', 'DOMESTIC_SHIPPING', 'IMPORT_BATCH',
]

interface FormState {
  name: string
  description: string
  category: ProductCategory
  price: string
  quantityAvailable: string
  productImageUrl: string
  fulfillmentType: FulfillmentType
  originCountry: string
}

const EMPTY: FormState = {
  name: '',
  description: '',
  category: 'GROCERIES',
  price: '',
  quantityAvailable: '0',
  productImageUrl: '',
  fulfillmentType: 'LOCAL_PICKUP',
  originCountry: '',
}

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    description: p.description ?? '',
    category: p.category,
    price: String(p.price),
    quantityAvailable: String(p.quantityAvailable),
    productImageUrl: p.productImageUrl ?? '',
    fulfillmentType: p.fulfillmentType,
    originCountry: p.originCountry ?? '',
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
  const [generating, setGenerating] = useState(false)

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
      setForm((f) => ({ ...f, productImageUrl: url }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload image')
    } finally {
      setUploading(false)
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
      quantityAvailable: Number(form.quantityAvailable),
      productImageUrl: form.productImageUrl || undefined,
      fulfillmentType: form.fulfillmentType,
      originCountry: form.originCountry || undefined,
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
              <label className="label">Quantity</label>
              <input className="field" type="number" min="0" value={form.quantityAvailable} onChange={set('quantityAvailable')} />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Product image</label>
              {form.productImageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={form.productImageUrl}
                    alt={form.name || 'Product'}
                    className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover"
                  />
                  <div className="flex flex-col items-start gap-1">
                    <label className="btn-quiet cursor-pointer px-2 text-sm">
                      {uploading ? <Spinner /> : 'Replace'}
                      <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
                    </label>
                    <button
                      type="button"
                      className="btn-quiet px-2 text-sm text-clay hover:text-clay-dark"
                      onClick={() => setForm((f) => ({ ...f, productImageUrl: '' }))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="field flex cursor-pointer items-center justify-center gap-2 text-muted">
                  {uploading ? <Spinner /> : 'Browse device…'}
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
                </label>
              )}
            </div>
            <div>
              <label className="label">Origin country</label>
              <input className="field" value={form.originCountry} onChange={set('originCountry')} />
            </div>
          </div>
          {error && <ErrorNote message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving || uploading || generating}>{saving ? <Spinner /> : 'Save product'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorProducts() {
  const [products, setProducts] = useState<Product[] | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)

  const load = () => api.vendorProducts().then(setProducts).catch(() => setProducts([]))
  useEffect(() => { load() }, [])

  const closeForm = () => {
    setEditing(null)
    setCreating(false)
  }
  const afterSave = () => {
    closeForm()
    load()
  }

  if (products === null) return <PageLoader />

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
                  <td className="px-5 py-3 font-mono">{money(p.price, p.currency)}</td>
                  <td className="px-5 py-3">{p.quantityAvailable}</td>
                  <td className="px-5 py-3 text-muted">{titleCase(p.fulfillmentType)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => api.toggleProduct(p.id, !p.active).then(load)}
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
                        if (confirm(`Delete "${p.name}"?`)) api.deleteProduct(p.id).then(load)
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

      {(creating || editing) && (
        <ProductForm initial={editing} onClose={closeForm} onSaved={afterSave} />
      )}
    </ConsoleShell>
  )
}
