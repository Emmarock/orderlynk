import type { Order } from '@/shared/lib/types'
import { money, titleCase } from '@/shared/lib/format'
import { FulfillmentBadge, PaymentBadge } from '@/shared/components/ui'

/**
 * The ordered steps to render. Normally this is the server-provided `fulfillmentFlow`, but we guard
 * against the order's current status being absent from that list (e.g. a stale/mismatched flow after
 * a partial deploy): without this, `indexOf` returns -1 and the whole timeline renders muted, making a
 * progressed order look stuck at "Order received". PAID always follows ORDER_RECEIVED; any other
 * unexpected status is appended so it's at least shown as the current step rather than hidden.
 */
function timelineFlow(order: Order): string[] {
  if (order.fulfillmentStatus === 'CANCELLED') return ['ORDER_RECEIVED', 'CANCELLED']
  const flow = order.fulfillmentFlow ?? []
  if (flow.includes(order.fulfillmentStatus)) return flow
  const afterReceived = flow.indexOf('ORDER_RECEIVED')
  if (order.fulfillmentStatus === 'PAID' && afterReceived !== -1) {
    const merged = [...flow]
    merged.splice(afterReceived + 1, 0, 'PAID')
    return merged
  }
  return [...flow, order.fulfillmentStatus]
}

export function OrderTimeline({ order }: { order: Order }) {
  const flow = timelineFlow(order)
  const currentIdx = flow.indexOf(order.fulfillmentStatus)

  return (
    <ol className="relative ml-3 border-l-2 border-line">
      {flow.map((step, i) => {
        const done = i < currentIdx
        const current = i === currentIdx
        const next = i === currentIdx + 1
        return (
          <li key={step} className="relative pb-6 pl-6 last:pb-0">
            <span
              className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full border-2 ${
                done || current
                  ? 'border-forest bg-forest'
                  : next
                    ? 'border-clay bg-clay'
                    : 'border-line bg-cream'
              }`}
            >
              {(done || current || next) && <span className="h-1.5 w-1.5 rounded-full bg-cream" />}
            </span>
            <p className={`text-sm ${current ? 'font-semibold text-forest-dark' : next ? 'font-semibold text-clay-dark' : done ? 'text-ink' : 'text-muted'}`}>
              {titleCase(step)}
            </p>
            {current && step === 'READY_FOR_PICKUP' && order.pickupCode && (
              <p className="mt-1 font-mono text-sm">
                Pickup code: <span className="font-semibold tracking-widest text-clay">{order.pickupCode}</span>
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function OrderFeeBreakdown({ order }: { order: Order }) {
  return (
    <div className="space-y-2 text-sm">
      <Row label="Product subtotal" value={money(order.productSubtotal, order.currency)} />
      {order.vatAmount > 0 && (
        <Row
          label={`VAT${order.vatCollector === 'PLATFORM' ? ' (collected by platform)' : ''}`}
          value={money(order.vatAmount, order.currency)}
        />
      )}
      <Row label="Logistics fee" value={money(order.logisticsFee, order.currency)} />
      <Row label="Platform fee" value={money(order.platformFee, order.currency)} />
      <Row label="Processing fee" value={money(order.processingFee, order.currency)} />
      <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-semibold">
        <span>Total</span>
        <span className="font-mono">{money(order.totalAmount, order.currency)}</span>
      </div>
    </div>
  )
}

export function OrderItems({ order }: { order: Order }) {
  return (
    <div className="space-y-2 text-sm">
      {order.items.map((it, i) => (
        <div key={i} className="flex justify-between">
          <span className="text-muted">
            {it.quantity} × {it.productName}
            {(it.selectedColor || it.selectedSize) && (
              <span className="block text-xs">
                {[it.selectedColor, it.selectedSize].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
          <span className="font-mono">{money(it.lineTotal, order.currency)}</span>
        </div>
      ))}
    </div>
  )
}

export function OrderStatusRow({ order }: { order: Order }) {
  // Payment is taken before the order exists (card-first flow), so PENDING/PAID add no
  // signal here — the fulfillment status is the order's real status. Only surface the
  // payment badge when it deviates from the happy path (refund, partial, failed, cancelled).
  const showPayment = order.paymentStatus !== 'PENDING' && order.paymentStatus !== 'PAID'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPayment && <PaymentBadge status={order.paymentStatus} />}
      <FulfillmentBadge status={order.fulfillmentStatus} />
      <span className="chip bg-sand text-muted">{titleCase(order.fulfillmentType)}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}
