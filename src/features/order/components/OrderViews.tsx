import type { Order } from '@/shared/lib/types'
import { money, titleCase } from '@/shared/lib/format'
import { CopyOrderId, FulfillmentBadge, PaymentBadge } from '@/shared/components/ui'

export function OrderTimeline({ order }: { order: Order }) {
  const flow = order.fulfillmentStatus === 'CANCELLED' ? ['ORDER_RECEIVED', 'CANCELLED'] : order.fulfillmentFlow
  const currentIdx = flow.indexOf(order.fulfillmentStatus)

  return (
    <ol className="relative ml-3 border-l-2 border-line">
      {flow.map((step, i) => {
        const done = i < currentIdx
        const current = i === currentIdx
        return (
          <li key={step} className="relative pb-6 pl-6 last:pb-0">
            <span
              className={`absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full border-2 ${
                current
                  ? 'border-clay bg-clay'
                  : done
                    ? 'border-forest bg-forest'
                    : 'border-line bg-cream'
              }`}
            >
              {(done || current) && <span className="h-1.5 w-1.5 rounded-full bg-cream" />}
            </span>
            <p className={`text-sm ${current ? 'font-semibold text-clay-dark' : done ? 'text-ink' : 'text-muted'}`}>
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
          </span>
          <span className="font-mono">{money(it.lineTotal, order.currency)}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Shows the vendor's payment details so the customer knows how to pay. Rendered only
 * when the vendor configured payout details and payment is still outstanding.
 */
export function PaymentInstructionsCard({ order }: { order: Order }) {
  const pi = order.paymentInstructions
  const outstanding = order.paymentStatus === 'PENDING' || order.paymentStatus === 'PARTIAL'
  if (!pi || !outstanding) return null

  const rows: [string, string | undefined][] = [
    ['Method', titleCase(pi.method)],
    ['Interac e-Transfer to', pi.email],
    ['Account name', pi.accountName],
    ['Bank', pi.bankName],
    ['Account number', pi.accountNumber],
  ]

  return (
    <div className="rounded-xl border border-clay/30 bg-clay/8 p-4">
      <h3 className="font-display text-base font-semibold text-clay-dark">How to pay</h3>
      <p className="mt-1 text-sm text-muted">
        Send {money(order.totalAmount, order.currency)} to {order.vendorName} using the details below, then
        the vendor will confirm your payment.
      </p>
      <dl className="mt-3 space-y-1.5 text-sm">
        {rows.filter(([, v]) => v && v.trim()).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 border-t border-clay/20 pt-2 font-semibold">
          <dt>Reference</dt>
          <dd className="font-mono"><CopyOrderId value={order.publicOrderId} /></dd>
        </div>
      </dl>
    </div>
  )
}

export function OrderStatusRow({ order }: { order: Order }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PaymentBadge status={order.paymentStatus} />
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
