import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { FulfillmentStatus, Order } from '../lib/types'
import { titleCase } from '../lib/format'
import { OrderFeeBreakdown, OrderItems, OrderStatusRow, OrderTimeline } from './OrderViews'
import { OrderShippingPanel } from './OrderShippingPanel'
import { Spinner } from './ui'

/** Full vendor view of a single order: customer + address, items, fees, and status actions. */
export function OrderDetailPanel({ order, onUpdated }: { order: Order; onUpdated: (o: Order) => void }) {
  const [busy, setBusy] = useState(false)

  const nextStatuses = useMemo<FulfillmentStatus[]>(() => {
    const idx = order.fulfillmentFlow.indexOf(order.fulfillmentStatus)
    const ahead = idx >= 0 ? order.fulfillmentFlow.slice(idx + 1) : order.fulfillmentFlow
    return [...ahead, 'CANCELLED']
  }, [order])

  const addressLines = [
    [order.customerHouseNumber, order.customerStreet].filter(Boolean).join(' '),
    [order.customerCity, order.customerState, order.customerPostcode].filter(Boolean).join(' '),
    order.customerCountry,
  ].filter((l) => l && l.trim())

  const advance = async (status: FulfillmentStatus) => {
    setBusy(true)
    try {
      onUpdated(await api.updateFulfillment(order.id, status))
    } finally {
      setBusy(false)
    }
  }

  const markPaid = async () => {
    setBusy(true)
    try {
      onUpdated(await api.vendorUpdatePayment(order.id, { status: 'PAID', method: 'INTERAC_ETRANSFER' }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 border-t border-line pt-5 md:grid-cols-2">
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Customer</h4>
        <p className="text-sm">{order.customerName}</p>
        <p className="text-sm text-muted">{order.customerPhone}</p>
        {order.customerEmail && <p className="text-sm text-muted">{order.customerEmail}</p>}

        {addressLines.length > 0 && (
          <>
            <h4 className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Delivery address</h4>
            <address className="text-sm not-italic text-muted">
              {addressLines.map((line, i) => <div key={i}>{line}</div>)}
            </address>
          </>
        )}

        {order.notes && <p className="mt-2 rounded-lg bg-sand p-2 text-sm italic text-muted">“{order.notes}”</p>}

        <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Items</h4>
        <OrderItems order={order} />
        <div className="mt-3"><OrderFeeBreakdown order={order} /></div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Progress</h4>
        <OrderTimeline order={order} />

        <div className="mt-5 space-y-3 rounded-xl bg-sand p-4">
          {order.paymentStatus !== 'PAID' && (
            <button className="btn-forest w-full" disabled={busy} onClick={markPaid}>
              {busy ? <Spinner /> : 'Mark payment received'}
            </button>
          )}
          <div>
            <label className="label">Advance fulfillment</label>
            <select
              className="field"
              disabled={busy || order.fulfillmentStatus === 'COMPLETED'}
              value=""
              onChange={(e) => e.target.value && advance(e.target.value as FulfillmentStatus)}
            >
              <option value="">Choose next status…</option>
              {nextStatuses.map((s) => (
                <option key={s} value={s}>{titleCase(s)}</option>
              ))}
            </select>
          </div>
          {order.pickupCode && (
            <p className="text-center font-mono text-sm">
              Pickup code <span className="font-semibold tracking-widest text-clay">{order.pickupCode}</span>
            </p>
          )}
          <OrderStatusRow order={order} />
        </div>

        {order.fulfillmentType === 'DOMESTIC_SHIPPING' && <OrderShippingPanel order={order} />}
      </div>
    </div>
  )
}