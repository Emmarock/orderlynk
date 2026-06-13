import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '@/shared/lib/api'
import type { Order } from '@/shared/lib/types'
import { formatDate, money } from '@/shared/lib/format'
import { ConsoleShell, VENDOR_TABS } from '@/shared/components/Console'
import { OrderDetailPanel } from '@/features/order/components/OrderDetailPanel'
import { CopyOrderId, EmptyState, PageLoader } from '@/shared/components/ui'

export default function VendorOrderDetail() {
  const { id = '' } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOrder(null)
    setError(null)
    api.vendorOrder(id).then(setOrder).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load order'))
  }, [id])

  if (error) {
    return (
      <ConsoleShell title="Order" subtitle="Order details" tabs={VENDOR_TABS}>
        <EmptyState
          title="Order not found"
          hint={error}
          action={<Link to="/vendor/manage/orders" className="btn-primary">Back to orders</Link>}
        />
      </ConsoleShell>
    )
  }
  if (!order) return <PageLoader />

  return (
    <ConsoleShell
      title="Order details"
      subtitle={`${order.customerName} · ${formatDate(order.createdAt)}`}
      tabs={VENDOR_TABS}
      actions={<Link to="/vendor/manage/orders" className="btn-ghost">← All orders</Link>}
    >
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-lg font-semibold"><CopyOrderId value={order.publicOrderId} /></p>
          <span className="font-mono text-lg font-semibold">{money(order.totalAmount, order.currency)}</span>
        </div>
        <div className="mt-4">
          <OrderDetailPanel order={order} onUpdated={setOrder} />
        </div>
      </div>
    </ConsoleShell>
  )
}