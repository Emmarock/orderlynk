import { useEffect, useState } from 'react'
import { api, apiMessage } from '@/shared/lib/api'
import type { FeeSettings } from '@/shared/lib/types'
import { titleCase } from '@/shared/lib/format'
import { ADMIN_TABS, ConsoleShell } from '@/shared/components/Console'
import { ErrorNote, PageLoader, Spinner } from '@/shared/components/ui'

/** Admin console for the platform-wide fee policy. Changes take effect immediately for new checkouts. */
export default function AdminFeeSettings() {
  const [form, setForm] = useState<FeeSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.adminFeeSettings().then(setForm).catch(() => setError('Could not load fee settings'))
  }, [])

  if (!form) return <PageLoader />

  const num = (k: keyof FeeSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: Number(e.target.value) } as FeeSettings)

  const save = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      setForm(await api.adminUpdateFeeSettings(form))
      setSaved(true)
    } catch (e) {
      setError(apiMessage(e, 'Could not save fee settings'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ConsoleShell title="Fee settings" subtitle="Platform-wide pricing — applies to new orders, bookings and cargo" tabs={ADMIN_TABS}>
      <div className="max-w-2xl space-y-6">
        {error && <ErrorNote message={error} />}
        {saved && <p className="rounded-lg border border-forest/30 bg-forest/5 px-4 py-2 text-sm text-forest">✓ Saved.</p>}

        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold">Transaction fees</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Rate label="Customer service fee" value={form.serviceFeeRate} onChange={num('serviceFeeRate')} />
            <Rate label="Processing rate" value={form.processingRate} onChange={num('processingRate')} />
            <Money label="Processing fixed" value={form.processingFixed} onChange={num('processingFixed')} />
            <Rate label="Processing cross-border buffer" value={form.processingBufferRate} onChange={num('processingBufferRate')} />
            <Rate label="Logistics markup" value={form.logisticsMarginRate} onChange={num('logisticsMarginRate')} />
            <Money label="Logistics flat markup" value={form.logisticsMarkupFlat} onChange={num('logisticsMarkupFlat')} />
            <Rate label="Tax withholding" value={form.taxRate} onChange={num('taxRate')} />
            <Rate label="Cargo handling fee" value={form.cargoHandlingFeeRate} onChange={num('cargoHandlingFeeRate')} />
            <Rate label="Instant payout fee" value={form.instantPayoutFeeRate} onChange={num('instantPayoutFeeRate')} />
            <label className="flex items-center gap-2 self-end text-sm">
              <input type="checkbox" checked={form.grossUpProcessing}
                     onChange={(e) => setForm({ ...form, grossUpProcessing: e.target.checked })} />
              Gross up processing fee
            </label>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold">Featured placement</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Money label={`Fee (${form.featuredPlacementCurrency})`} value={form.featuredPlacementFee} onChange={num('featuredPlacementFee')} />
            <Field label="Duration (days)">
              <input type="number" min="1" className="field" value={form.featuredPlacementDays}
                     onChange={(e) => setForm({ ...form, featuredPlacementDays: Number(e.target.value) })} />
            </Field>
            <Field label="Currency">
              <input className="field" value={form.featuredPlacementCurrency}
                     onChange={(e) => setForm({ ...form, featuredPlacementCurrency: e.target.value.toUpperCase() })} />
            </Field>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold">Flat logistics fees</h2>
          <p className="mt-1 text-sm text-muted">Base carrier cost per fulfillment type when no live rate is available.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Object.keys(form.logistics).map((type) => (
              <Field key={type} label={titleCase(type.replace(/_/g, ' '))}>
                <input type="number" min="0" step="0.01" className="field" value={form.logistics[type]}
                       onChange={(e) => setForm({ ...form, logistics: { ...form.logistics, [type]: Number(e.target.value) } })} />
              </Field>
            ))}
          </div>
        </section>

        <button onClick={save} disabled={busy} className="btn-primary">{busy ? <Spinner /> : 'Save fee settings'}</button>
      </div>
    </ConsoleShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-sm text-muted">{label}</span>{children}</label>
}

/** Rate input shown as a percent but stored as a fraction. */
function Rate({ label, value, onChange }: { label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Field label={`${label} (fraction, e.g. 0.03 = 3%)`}>
      <input type="number" min="0" max="1" step="0.001" className="field" value={value} onChange={onChange} />
    </Field>
  )
}

function Money({ label, value, onChange }: { label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <Field label={label}>
      <input type="number" min="0" step="0.01" className="field" value={value} onChange={onChange} />
    </Field>
  )
}
