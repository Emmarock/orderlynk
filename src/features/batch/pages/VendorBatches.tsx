import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import type { Batch, BatchType, ShippingMethod, BatchVisibility } from '@/shared/lib/types'
import { usePagedList } from '@/shared/lib/usePagedList'
import { money, titleCase, formatDay, cargoTone } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { CountrySelect, EmptyState, ErrorNote, LoadMore, PageLoader, Spinner } from '@/shared/components/ui'
import SuggestField from '@/shared/components/SuggestField'

const BATCH_TYPES: BatchType[] = ['PRODUCT_BATCH', 'CARGO_BATCH', 'HYBRID_BATCH']
const SHIPPING_METHODS: ShippingMethod[] = ['AIR_CARGO', 'SEA_CARGO', 'DOMESTIC', 'OTHER']
const VISIBILITIES: BatchVisibility[] = ['DRAFT', 'PRIVATE_LINK', 'MARKETPLACE']
const CURRENCIES = ['CAD', 'USD', 'GBP', 'EUR', 'NGN']

const numOrUndef = (v: string): number | undefined => (v.trim() === '' || Number.isNaN(Number(v)) ? undefined : Number(v))

interface FormState {
  batchName: string
  batchType: BatchType
  route: string
  originCountry: string
  originCity: string
  destinationCountry: string
  destinationCity: string
  shippingMethod: ShippingMethod
  openDate: string
  closeDate: string
  estimatedDeparture: string
  estimatedArrival: string
  ratePerKg: string
  handlingFee: string
  currency: string
  pickupLocation: string
  collectionPoints: string[]
  visibility: BatchVisibility
  notes: string
}

const EMPTY: FormState = {
  batchName: '', batchType: 'PRODUCT_BATCH', route: '', originCountry: '', originCity: '',
  destinationCountry: '', destinationCity: '', shippingMethod: 'AIR_CARGO', openDate: '', closeDate: '',
  estimatedDeparture: '', estimatedArrival: '', ratePerKg: '', handlingFee: '0', currency: 'CAD',
  pickupLocation: '', collectionPoints: [], visibility: 'DRAFT', notes: '',
}

function fromBatch(b: Batch): FormState {
  return {
    batchName: b.batchName, batchType: b.batchType, route: b.route ?? '',
    originCountry: b.originCountry ?? '', originCity: b.originCity ?? '',
    destinationCountry: b.destinationCountry ?? '', destinationCity: b.destinationCity ?? '',
    shippingMethod: b.shippingMethod ?? 'AIR_CARGO', openDate: b.openDate ?? '', closeDate: b.closeDate ?? '',
    estimatedDeparture: b.estimatedDeparture ?? '', estimatedArrival: b.estimatedArrival ?? '',
    ratePerKg: b.ratePerKg != null ? String(b.ratePerKg) : '', handlingFee: String(b.handlingFee ?? 0),
    currency: b.currency, pickupLocation: b.pickupLocation ?? '',
    collectionPoints: b.collectionPoints ?? [], visibility: b.visibility, notes: b.notes ?? '',
  }
}

/** Multi-value origin drop-off picker — each entry uses the shared address autocomplete. */
function CollectionPointsField({ country, value, onChange }: { country?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const add = () => { const t = draft.trim(); if (!t) return; onChange([...value, t]); setDraft('') }
  return (
    <div className="col-span-2">
      <label className="label">Collection points (origin drop-off)</label>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((c, i) => (
            <span key={i} className="chip bg-ink/8 text-ink">
              {c}
              <button type="button" className="ml-1.5 text-muted hover:text-clay" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <SuggestField className="flex-1" value={draft} onChange={setDraft} country={country}
          pick={(s) => s.formatted} placeholder="Search an origin address…" />
        <button type="button" className="btn-quiet" onClick={add} disabled={!draft.trim()}>Add</button>
      </div>
    </div>
  )
}

function BatchForm({ initial, onClose, onSaved }: { initial: Batch | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(initial ? fromBatch(initial) : EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const cargo = form.batchType !== 'PRODUCT_BATCH'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(null)
    const body = {
      batchName: form.batchName,
      batchType: form.batchType,
      route: form.route || undefined,
      originCountry: form.originCountry || undefined,
      originCity: form.originCity || undefined,
      destinationCountry: form.destinationCountry || undefined,
      destinationCity: form.destinationCity || undefined,
      shippingMethod: form.shippingMethod,
      openDate: form.openDate || undefined,
      closeDate: form.closeDate || undefined,
      estimatedDeparture: form.estimatedDeparture || undefined,
      estimatedArrival: form.estimatedArrival || undefined,
      ratePerKg: numOrUndef(form.ratePerKg),
      handlingFee: numOrUndef(form.handlingFee),
      currency: form.currency,
      pickupLocation: form.pickupLocation || undefined,
      collectionPoints: form.collectionPoints.map((s) => s.trim()).filter(Boolean),
      visibility: form.visibility,
      notes: form.notes || undefined,
    }
    try {
      if (initial) await api.updateBatch(initial.id, body)
      else await api.createBatch(body)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save batch')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[92vh] w-full max-w-2xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">{initial ? 'Edit batch' : 'New batch cycle'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Batch name</label>
              <input className="field" required value={form.batchName} onChange={set('batchName')} placeholder="January Nigeria → Canada Batch" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="field" value={form.batchType} onChange={set('batchType')}>
                {BATCH_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Shipping method</label>
              <select className="field" value={form.shippingMethod} onChange={set('shippingMethod')}>
                {SHIPPING_METHODS.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Origin country</label>
              <CountrySelect value={form.originCountry} onChange={(v) => setForm((f) => ({ ...f, originCountry: v, originCity: '' }))} />
            </div>
            <SuggestField
              label="Origin city" value={form.originCity} onChange={(v) => setField('originCity', v)}
              country={form.originCountry} type="city" pick={(s) => s.city || s.formatted}
              placeholder={form.originCountry ? 'Start typing a city…' : 'Pick a country first'}
            />
            <div>
              <label className="label">Destination country</label>
              <CountrySelect value={form.destinationCountry} onChange={(v) => setForm((f) => ({ ...f, destinationCountry: v, destinationCity: '' }))} />
            </div>
            <SuggestField
              label="Destination city" value={form.destinationCity} onChange={(v) => setField('destinationCity', v)}
              country={form.destinationCountry} type="city" pick={(s) => s.city || s.formatted}
              placeholder={form.destinationCountry ? 'Start typing a city…' : 'Pick a country first'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div><label className="label">Open date</label><input className="field" type="date" value={form.openDate} onChange={set('openDate')} /></div>
            <div><label className="label">Close date</label><input className="field" type="date" value={form.closeDate} onChange={set('closeDate')} /></div>
            <div><label className="label">Est. departure</label><input className="field" type="date" value={form.estimatedDeparture} onChange={set('estimatedDeparture')} /></div>
            <div><label className="label">Est. arrival</label><input className="field" type="date" value={form.estimatedArrival} onChange={set('estimatedArrival')} /></div>
          </div>

          {cargo && (
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-sand/40 p-4">
              <div className="col-span-2 text-sm text-muted">Cargo pricing for customer "Send My Items" requests.</div>
              <div><label className="label">Rate per kg ({form.currency})</label><input className="field" type="number" min="0" step="0.01" value={form.ratePerKg} onChange={set('ratePerKg')} /></div>
              <div><label className="label">Handling fee</label><input className="field" type="number" min="0" step="0.01" value={form.handlingFee} onChange={set('handlingFee')} /></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Currency</label>
              <select className="field" value={form.currency} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Visibility</label>
              <select className="field" value={form.visibility} onChange={set('visibility')}>
                {VISIBILITIES.map((v) => <option key={v} value={v}>{titleCase(v)}</option>)}
              </select>
            </div>
            <SuggestField
              className="col-span-2" label="Pickup location (destination)" value={form.pickupLocation}
              onChange={(v) => setField('pickupLocation', v)} country={form.destinationCountry}
              pick={(s) => s.formatted} placeholder="Search a destination address…"
            />
            <CollectionPointsField
              country={form.originCountry} value={form.collectionPoints}
              onChange={(v) => setField('collectionPoints', v)}
            />
            <div className="col-span-2"><label className="label">Notes</label><textarea className="field min-h-16" value={form.notes} onChange={set('notes')} /></div>
          </div>

          {error && <ErrorNote message={error} />}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={saving || !form.batchName.trim()}>{saving ? <Spinner /> : 'Save batch'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VendorBatches() {
  const [editing, setEditing] = useState<Batch | null>(null)
  const [creating, setCreating] = useState(false)

  const { items: list, total, loading, loadingMore, hasNext, loadMore, reload } = usePagedList(
    (page, size) => api.vendorBatches(page, size),
    [],
  )

  if (loading) return <PageLoader />

  return (
    <ConsoleShell
      title="Batch & Cargo"
      subtitle="Run import/export cycles — batch products and customer shipment requests"
      tabs={VENDOR_TABS}
      actions={<button className="btn-primary" onClick={() => setCreating(true)}>+ New batch</button>}
    >
      {list.length === 0 ? (
        <EmptyState
          title="No batches yet"
          hint="Create a batch cycle to collect product orders and cargo shipment requests."
          action={<button className="btn-primary" onClick={() => setCreating(true)}>Create a batch</button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map(({ batch: b, orderCount, shipmentRequestCount, revenue, pendingPayments }) => (
            <div key={b.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link to={`/vendor/manage/batches/${b.id}`} className="font-display text-lg font-semibold hover:text-clay">{b.batchName}</Link>
                  <p className="text-xs uppercase tracking-wider text-muted">{titleCase(b.batchType)}{b.route ? ` · ${b.route}` : ''}</p>
                </div>
                <span className={`chip ${cargoTone(b.batchStatus)}`}>{titleCase(b.batchStatus)}</span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                <span>{orderCount} order{orderCount !== 1 ? 's' : ''}</span>
                <span>{shipmentRequestCount} shipment{shipmentRequestCount !== 1 ? 's' : ''}</span>
                <span>Revenue <span className="font-mono text-ink">{money(revenue, b.currency)}</span></span>
                {pendingPayments > 0 && <span>Pending <span className="font-mono text-clay-dark">{money(pendingPayments, b.currency)}</span></span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {b.closeDate && <span>Closes {formatDay(b.closeDate)}</span>}
                {b.estimatedArrival && <span>ETA {formatDay(b.estimatedArrival)}</span>}
                <span>{titleCase(b.visibility)}</span>
              </div>
              <div className="mt-auto flex flex-wrap justify-end gap-2 pt-1">
                {b.visibility === 'DRAFT' && (
                  <button className="btn-quiet text-forest" onClick={() => api.publishBatch(b.id, 'MARKETPLACE').then(reload)}>Publish</button>
                )}
                <Link className="btn-quiet" to={`/vendor/manage/batches/${b.id}`}>Manage</Link>
                <button className="btn-quiet" onClick={() => setEditing(b)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <LoadMore shown={list.length} total={total} hasNext={hasNext} loading={loadingMore} onLoadMore={loadMore} />

      {(creating || editing) && (
        <BatchForm initial={editing} onClose={() => { setCreating(false); setEditing(null) }} onSaved={() => { setCreating(false); setEditing(null); reload() }} />
      )}
    </ConsoleShell>
  )
}
