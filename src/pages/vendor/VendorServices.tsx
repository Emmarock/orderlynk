import { useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import type {
  ApprovalMode,
  AvailabilityRule,
  BlockedSlot,
  DayOfWeek,
  DepositType,
  ServiceAddOn,
  ServiceCategory,
  ServiceLocationType,
  ServiceOffering,
  ServiceProviderProfile,
} from '../../lib/types'
import { money, titleCase, formatDay, formatTime } from '../../lib/format'
import { ConsoleShell, VENDOR_TABS } from '../../components/Console'
import { EmptyState, ErrorNote, PageLoader, Spinner } from '../../components/ui'

const CATEGORIES: ServiceCategory[] = [
  'HAIR', 'NAILS', 'BARBER', 'MAKEUP', 'SPA_AND_MASSAGE', 'PHOTOGRAPHY', 'CLEANING',
  'PLUMBING', 'ELECTRICAL', 'HANDYMAN', 'AUTOMOTIVE', 'FITNESS', 'TUTORING', 'EVENTS', 'OTHER',
]
const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DEPOSIT_TYPES: DepositType[] = ['NONE', 'FIXED', 'PERCENTAGE', 'FULL']
const LOCATION_TYPES: ServiceLocationType[] = ['AT_PROVIDER', 'CUSTOMER_LOCATION', 'REMOTE']

const num = (v: string): number => (v.trim() === '' || Number.isNaN(Number(v)) ? 0 : Number(v))
const numOrNull = (v: string): number | null => (v.trim() === '' ? null : num(v))

type Section = 'catalog' | 'availability' | 'settings'

export default function VendorServices() {
  const [section, setSection] = useState<Section>('catalog')

  return (
    <ConsoleShell title="Services" subtitle="Your bookable service menu, availability and policies" tabs={VENDOR_TABS}>
      <div className="mb-6 inline-flex rounded-xl border border-line bg-cream p-1">
        {(['catalog', 'availability', 'settings'] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              section === s ? 'bg-ink text-cream' : 'text-muted hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {section === 'catalog' && <CatalogSection />}
      {section === 'availability' && <AvailabilitySection />}
      {section === 'settings' && <SettingsSection />}
    </ConsoleShell>
  )
}

// ============================= Catalog =============================

function CatalogSection() {
  const [services, setServices] = useState<ServiceOffering[] | null>(null)
  const [editing, setEditing] = useState<ServiceOffering | null>(null)
  const [creating, setCreating] = useState(false)

  const load = () => api.vendorServices().then(setServices).catch(() => setServices([]))
  useEffect(() => { load() }, [])

  if (services === null) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setCreating(true)}>+ New service</button>
      </div>
      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          hint="Add your first service so customers can book appointments from your link."
          action={<button className="btn-primary" onClick={() => setCreating(true)}>Add a service</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <div key={s.id} className="card flex flex-col gap-3 overflow-hidden p-5">
              {s.imageUrl && (
                <img src={s.imageUrl} alt={s.name} className="-mx-5 -mt-5 mb-1 h-36 w-[calc(100%+2.5rem)] object-cover" />
              )}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">{s.name}</p>
                  <p className="text-xs uppercase tracking-wider text-muted">{titleCase(s.category)}</p>
                </div>
                <button
                  onClick={() => api.toggleService(s.id, !s.active).then(load)}
                  className={`chip ${s.active ? 'bg-forest/12 text-forest' : 'bg-ink/8 text-muted'}`}
                >
                  {s.active ? 'Active' : 'Hidden'}
                </button>
              </div>
              {s.description && <p className="line-clamp-2 text-sm text-muted">{s.description}</p>}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="font-mono font-semibold">{money(s.basePrice, s.currency)}</span>
                <span className="text-muted">{s.durationMinutes} min</span>
                {s.depositType !== 'NONE' && (
                  <span className="text-muted">Deposit {money(s.depositAmount, s.currency)}</span>
                )}
                {s.addOns.length > 0 && <span className="text-muted">{s.addOns.length} add-on{s.addOns.length > 1 ? 's' : ''}</span>}
              </div>
              <div className="mt-auto flex justify-end gap-2 pt-1">
                <button className="btn-quiet px-2" onClick={() => setEditing(s)}>Edit</button>
                <button
                  className="btn-quiet px-2 text-clay hover:text-clay-dark"
                  onClick={() => { if (confirm(`Delete "${s.name}"?`)) api.deleteService(s.id).then(load) }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <ServiceForm initial={editing} onClose={() => { setEditing(null); setCreating(false) }} onSaved={() => { setEditing(null); setCreating(false); load() }} />
      )}
    </div>
  )
}

interface ServiceFormState {
  name: string
  category: ServiceCategory
  description: string
  basePrice: string
  durationMinutes: string
  taxRate: string
  depositType: DepositType
  depositValue: string
  imageUrl: string
}

function ServiceForm({ initial, onClose, onSaved }: { initial: ServiceOffering | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ServiceFormState>(initial ? {
    name: initial.name,
    category: initial.category,
    description: initial.description ?? '',
    basePrice: String(initial.basePrice),
    durationMinutes: String(initial.durationMinutes),
    taxRate: String(initial.taxRate ?? 0),
    depositType: initial.depositType,
    depositValue: initial.depositValue != null ? String(initial.depositValue) : '',
    imageUrl: initial.imageUrl ?? '',
  } : {
    name: '', category: 'HAIR', description: '', basePrice: '', durationMinutes: '60',
    taxRate: '0', depositType: 'NONE', depositValue: '', imageUrl: '',
  })
  const [addOns, setAddOns] = useState<ServiceAddOn[]>(initial?.addOns ?? [])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof ServiceFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file after a remove
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const { url } = await api.uploadServiceImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
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
      category: form.category,
      description: form.description || undefined,
      basePrice: num(form.basePrice),
      durationMinutes: num(form.durationMinutes),
      taxRate: num(form.taxRate),
      depositType: form.depositType,
      depositValue: form.depositType === 'FIXED' || form.depositType === 'PERCENTAGE' ? num(form.depositValue) : undefined,
      imageUrl: form.imageUrl || undefined,
      active: initial?.active ?? true,
    }
    try {
      if (initial) await api.updateService(initial.id, body)
      else await api.createService(body)
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save service')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">{initial ? 'Edit service' : 'New service'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <div>
            <label className="label">Service name</label>
            <input className="field" required value={form.name} onChange={set('name')} placeholder="e.g. Box braids" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="field min-h-20" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="field" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duration (minutes)</label>
              <input className="field" type="number" min="5" step="5" required value={form.durationMinutes} onChange={set('durationMinutes')} />
            </div>
            <div>
              <label className="label">Base price (CAD)</label>
              <input className="field" type="number" min="0" step="0.01" required value={form.basePrice} onChange={set('basePrice')} />
            </div>
            <div>
              <label className="label">Tax rate (e.g. 0.13)</label>
              <input className="field" type="number" min="0" step="0.01" value={form.taxRate} onChange={set('taxRate')} />
            </div>
          </div>
          <div className="rounded-xl border border-line bg-sand/40 p-4">
            <p className="label !mb-2">Deposit rule</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="field" value={form.depositType} onChange={set('depositType')}>
                  {DEPOSIT_TYPES.map((d) => <option key={d} value={d}>{titleCase(d)}</option>)}
                </select>
              </div>
              {(form.depositType === 'FIXED' || form.depositType === 'PERCENTAGE') && (
                <div>
                  <label className="label">{form.depositType === 'FIXED' ? 'Amount (CAD)' : 'Percentage %'}</label>
                  <input className="field" type="number" min="0" step="0.01" value={form.depositValue} onChange={set('depositValue')} />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              {form.depositType === 'NONE' && 'No deposit — booking confirms on approval.'}
              {form.depositType === 'FULL' && 'Customer pays the full price upfront to confirm.'}
              {form.depositType === 'FIXED' && 'A fixed deposit locks the appointment.'}
              {form.depositType === 'PERCENTAGE' && 'A percentage of the price locks the appointment.'}
            </p>
          </div>
          <div>
            <label className="label">Service image</label>
            {form.imageUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={form.imageUrl}
                  alt={form.name || 'Service'}
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
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
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

          {initial && (
            <AddOnEditor serviceId={initial.id} addOns={addOns} onChange={setAddOns} />
          )}
          {!initial && <p className="text-xs text-muted">Save the service first, then re-open it to add add-ons.</p>}

          {error && <ErrorNote message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
            <button className="btn-primary" disabled={saving || uploading || !form.name.trim() || !form.basePrice.trim()}>{saving ? <Spinner /> : 'Save service'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddOnEditor({ serviceId, addOns, onChange }: { serviceId: string; addOns: ServiceAddOn[]; onChange: (a: ServiceAddOn[]) => void }) {
  const [name, setName] = useState('')
  const [priceDelta, setPriceDelta] = useState('')
  const [durationDelta, setDurationDelta] = useState('0')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const created = await api.addServiceAddOn(serviceId, {
        name, priceDelta: num(priceDelta), durationDelta: num(durationDelta), required: false, maxSelection: 1, active: true,
      })
      onChange([...addOns, created])
      setName(''); setPriceDelta(''); setDurationDelta('0')
    } finally { setBusy(false) }
  }

  const remove = async (id: string) => {
    await api.deleteServiceAddOn(serviceId, id)
    onChange(addOns.filter((a) => a.id !== id))
  }

  return (
    <div className="rounded-xl border border-line bg-sand/40 p-4">
      <p className="label !mb-2">Add-ons</p>
      {addOns.length > 0 && (
        <ul className="mb-3 space-y-1.5">
          {addOns.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
              <span>{a.name} · +{money(a.priceDelta)}{a.durationDelta ? ` · +${a.durationDelta}m` : ''}</span>
              <button type="button" className="text-clay hover:text-clay-dark" onClick={() => remove(a.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
        <div><label className="label">Name</label><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="w-24"><label className="label">+ Price</label><input className="field" type="number" min="0" step="0.01" value={priceDelta} onChange={(e) => setPriceDelta(e.target.value)} /></div>
        <div className="w-20"><label className="label">+ Min</label><input className="field" type="number" min="0" value={durationDelta} onChange={(e) => setDurationDelta(e.target.value)} /></div>
        <button type="button" className="btn-quiet mb-0.5" onClick={add} disabled={busy || !name.trim()}>{busy ? <Spinner /> : 'Add'}</button>
      </div>
    </div>
  )
}

// ============================= Availability =============================

function AvailabilitySection() {
  const [rules, setRules] = useState<AvailabilityRule[] | null>(null)
  const [blocks, setBlocks] = useState<BlockedSlot[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    api.availabilityRules().then(setRules).catch(() => setRules([]))
    api.blockedSlots().then(setBlocks).catch(() => setBlocks([]))
  }
  useEffect(() => { load() }, [])

  if (rules === null || blocks === null) return <PageLoader />

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <RuleCard rules={rules} onChanged={load} setError={setError} />
      <BlockCard blocks={blocks} onChanged={load} />
      {error && <div className="lg:col-span-2"><ErrorNote message={error} /></div>}
    </div>
  )
}

function RuleCard({ rules, onChanged, setError }: { rules: AvailabilityRule[]; onChanged: () => void; setError: (s: string | null) => void }) {
  const [day, setDay] = useState<DayOfWeek>('MONDAY')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [capacity, setCapacity] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    setBusy(true); setError(null)
    try {
      await api.addAvailabilityRule({
        dayOfWeek: day, startTime: start, endTime: end, capacity: numOrNull(capacity), active: true,
      })
      setCapacity('')
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add working hours')
    } finally { setBusy(false) }
  }

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-semibold">Weekly working hours</h3>
      <p className="mt-1 text-sm text-muted">Slots are generated from these hours and each service's duration.</p>
      <div className="mt-4 space-y-2">
        {rules.length === 0 && <p className="text-sm text-muted">No working hours set yet.</p>}
        {rules.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <span><span className="font-medium">{titleCase(r.dayOfWeek)}</span> · {r.startTime.slice(0, 5)}–{r.endTime.slice(0, 5)}{r.capacity ? ` · cap ${r.capacity}` : ''}</span>
            <button className="text-clay hover:text-clay-dark" onClick={() => api.deleteAvailabilityRule(r.id).then(onChanged)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div className="col-span-2"><label className="label">Day</label>
          <select className="field" value={day} onChange={(e) => setDay(e.target.value as DayOfWeek)}>
            {DAYS.map((d) => <option key={d} value={d}>{titleCase(d)}</option>)}
          </select>
        </div>
        <div><label className="label">From</label><input className="field" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div><label className="label">To</label><input className="field" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <div><label className="label">Capacity (optional)</label><input className="field" type="number" min="1" placeholder="default" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
        <div className="flex items-end"><button className="btn-primary w-full" onClick={add} disabled={busy || !start || !end}>{busy ? <Spinner /> : 'Add hours'}</button></div>
      </div>
    </div>
  )
}

function BlockCard({ blocks, onChanged }: { blocks: BlockedSlot[]; onChanged: () => void }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async () => {
    if (!start || !end) return
    setBusy(true); setError(null)
    try {
      await api.addBlockedSlot({
        startDatetime: new Date(start).toISOString(), endDatetime: new Date(end).toISOString(), reason: reason || undefined,
      })
      setStart(''); setEnd(''); setReason('')
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not block time')
    } finally { setBusy(false) }
  }

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-semibold">Blocked dates</h3>
      <p className="mt-1 text-sm text-muted">Vacation or unavailable periods — these remove slots from your calendar.</p>
      <div className="mt-4 space-y-2">
        {blocks.length === 0 && <p className="text-sm text-muted">Nothing blocked.</p>}
        {blocks.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
            <span>{formatDay(b.startDatetime)} {formatTime(b.startDatetime)} – {formatDay(b.endDatetime)} {formatTime(b.endDatetime)}{b.reason ? ` · ${b.reason}` : ''}</span>
            <button className="text-clay hover:text-clay-dark" onClick={() => api.deleteBlockedSlot(b.id).then(onChanged)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 border-t border-line pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">From</label><input className="field" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><label className="label">To</label><input className="field" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <div><label className="label">Reason (optional)</label><input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vacation" /></div>
        {error && <ErrorNote message={error} />}
        <button className="btn-primary" onClick={add} disabled={busy || !start || !end}>{busy ? <Spinner /> : 'Block time'}</button>
      </div>
    </div>
  )
}

// ============================= Settings =============================

function SettingsSection() {
  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.serviceProfile().then(setProfile).catch(() => setError('Could not load settings')) }, [])

  if (!profile) return error ? <ErrorNote message={error} /> : <PageLoader />

  const set = <K extends keyof ServiceProviderProfile>(k: K, v: ServiceProviderProfile[K]) =>
    setProfile((p) => (p ? { ...p, [k]: v } : p))

  const save = async () => {
    setSaving(true); setError(null); setSaved(false)
    try {
      const updated = await api.updateServiceProfile({
        serviceEnabled: profile.serviceEnabled,
        bio: profile.bio,
        serviceArea: profile.serviceArea,
        locationType: profile.locationType,
        approvalMode: profile.approvalMode,
        cancellationPolicy: profile.cancellationPolicy,
        depositPolicy: profile.depositPolicy,
        businessHoursSummary: profile.businessHoursSummary,
        leadTimeHours: profile.leadTimeHours,
        bufferMinutes: profile.bufferMinutes,
        maxAdvanceDays: profile.maxAdvanceDays,
        defaultCapacity: profile.defaultCapacity,
        slotHoldMinutes: profile.slotHoldMinutes,
        timezone: profile.timezone,
      })
      setProfile(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save settings')
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <label className="card flex items-center justify-between p-4">
        <span>
          <span className="font-medium">Services module enabled</span>
          <span className="block text-sm text-muted">Turn bookings on or off for your storefront.</span>
        </span>
        <input type="checkbox" className="h-5 w-5 accent-clay" checked={profile.serviceEnabled}
               onChange={(e) => set('serviceEnabled', e.target.checked)} />
      </label>

      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="label">Approval mode</label>
          <select className="field" value={profile.approvalMode} onChange={(e) => set('approvalMode', e.target.value as ApprovalMode)}>
            <option value="MANUAL">Manual — I approve each request</option>
            <option value="AUTO">Auto — approve open slots automatically</option>
          </select>
        </div>
        <div>
          <label className="label">Where you work</label>
          <select className="field" value={profile.locationType} onChange={(e) => set('locationType', e.target.value as ServiceLocationType)}>
            {LOCATION_TYPES.map((l) => <option key={l} value={l}>{titleCase(l)}</option>)}
          </select>
        </div>
        <div><label className="label">Lead time (hours)</label><input className="field" type="number" min="0" value={profile.leadTimeHours} onChange={(e) => set('leadTimeHours', num(e.target.value))} /></div>
        <div><label className="label">Buffer between bookings (min)</label><input className="field" type="number" min="0" value={profile.bufferMinutes} onChange={(e) => set('bufferMinutes', num(e.target.value))} /></div>
        <div><label className="label">Max advance booking (days)</label><input className="field" type="number" min="1" value={profile.maxAdvanceDays} onChange={(e) => set('maxAdvanceDays', num(e.target.value))} /></div>
        <div><label className="label">Capacity per slot</label><input className="field" type="number" min="1" value={profile.defaultCapacity} onChange={(e) => set('defaultCapacity', num(e.target.value))} /></div>
        <div><label className="label">Deposit hold (min)</label><input className="field" type="number" min="1" value={profile.slotHoldMinutes} onChange={(e) => set('slotHoldMinutes', num(e.target.value))} /></div>
        <div><label className="label">Timezone</label><input className="field" value={profile.timezone} onChange={(e) => set('timezone', e.target.value)} /></div>
      </div>

      <div className="card grid gap-4 p-5">
        <div><label className="label">Bio</label><textarea className="field min-h-20" value={profile.bio ?? ''} onChange={(e) => set('bio', e.target.value)} /></div>
        <div><label className="label">Service area</label><input className="field" value={profile.serviceArea ?? ''} onChange={(e) => set('serviceArea', e.target.value)} placeholder="e.g. Toronto + GTA" /></div>
        <div><label className="label">Working hours summary</label><input className="field" value={profile.businessHoursSummary ?? ''} onChange={(e) => set('businessHoursSummary', e.target.value)} placeholder="Mon–Sat, 9am–6pm" /></div>
        <div><label className="label">Cancellation policy</label><textarea className="field min-h-16" value={profile.cancellationPolicy ?? ''} onChange={(e) => set('cancellationPolicy', e.target.value)} /></div>
        <div><label className="label">Deposit policy</label><textarea className="field min-h-16" value={profile.depositPolicy ?? ''} onChange={(e) => set('depositPolicy', e.target.value)} /></div>
      </div>

      {error && <ErrorNote message={error} />}
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner /> : 'Save settings'}</button>
        {saved && <span className="text-sm text-forest">Saved ✓</span>}
      </div>
    </div>
  )
}
