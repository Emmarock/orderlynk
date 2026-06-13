import { request } from '@/shared/lib/http'
import type {
  Batch, BatchCard, BatchOrder, BatchPaymentInit, BatchProduct, BatchSummary, PublicBatch, ShipmentRequest,
} from '@/shared/lib/types'

/** Batch & Cargo: public discovery + customer orders/shipment requests, and the vendor batch console. */
export const batchApi = {
  // ---- public + customer ----
  batchMarketplace: (opts?: { originCountry?: string; destinationCity?: string; batchType?: string }) => {
    const qs = new URLSearchParams()
    if (opts?.originCountry) qs.set('originCountry', opts.originCountry)
    if (opts?.destinationCity) qs.set('destinationCity', opts.destinationCity)
    if (opts?.batchType) qs.set('batchType', opts.batchType)
    const s = qs.toString()
    return request<BatchCard[]>('GET', `/api/batches${s ? `?${s}` : ''}`)
  },
  batchPage: (id: string) => request<PublicBatch>('GET', `/api/batches/${id}`),
  createBatchOrder: (b: unknown) => request<BatchOrder>('POST', '/api/batches/orders', b),
  trackBatchOrder: (publicId: string, contact: string) =>
    request<BatchOrder>('POST', '/api/batches/orders/track', { publicId, contact }),
  myBatchOrders: () => request<BatchOrder[]>('GET', '/api/batches/orders/mine'),
  payBatchOrder: (publicId: string, contact?: string) =>
    request<BatchPaymentInit>('POST', `/api/batches/orders/${publicId}/pay`, { contact }),
  createShipmentRequest: (b: unknown) => request<ShipmentRequest>('POST', '/api/batches/shipment-requests', b),
  trackShipmentRequest: (publicId: string, contact: string) =>
    request<ShipmentRequest>('POST', '/api/batches/shipment-requests/track', { publicId, contact }),
  myShipmentRequests: () => request<ShipmentRequest[]>('GET', '/api/batches/shipment-requests/mine'),
  payShipmentRequest: (publicId: string, contact?: string) =>
    request<BatchPaymentInit>('POST', `/api/batches/shipment-requests/${publicId}/pay`, { contact }),

  // ---- vendor ----
  vendorBatches: () => request<BatchSummary[]>('GET', '/api/vendor/batches'),
  vendorBatch: (id: string) => request<BatchSummary>('GET', `/api/vendor/batches/${id}`),
  createBatch: (b: unknown) => request<Batch>('POST', '/api/vendor/batches', b),
  updateBatch: (id: string, b: unknown) => request<Batch>('PUT', `/api/vendor/batches/${id}`, b),
  publishBatch: (id: string, visibility?: string) =>
    request<Batch>('POST', `/api/vendor/batches/${id}/publish${visibility ? `?visibility=${visibility}` : ''}`),
  updateBatchStatus: (id: string, status: string, note?: string) =>
    request<Batch>('PATCH', `/api/vendor/batches/${id}/status`, { status, note }),
  deleteBatch: (id: string) => request<void>('DELETE', `/api/vendor/batches/${id}`),
  batchProducts: (id: string) => request<BatchProduct[]>('GET', `/api/vendor/batches/${id}/products`),
  attachBatchProducts: (id: string, productIds: string[]) =>
    request<BatchProduct[]>('POST', `/api/vendor/batches/${id}/products`, { productIds }),
  copyBatchProducts: (id: string, sourceBatchId: string) =>
    request<BatchProduct[]>('POST', `/api/vendor/batches/${id}/products/copy`, { sourceBatchId }),
  updateBatchProduct: (id: string, bpId: string, b: unknown) =>
    request<BatchProduct>('PUT', `/api/vendor/batches/${id}/products/${bpId}`, b),
  removeBatchProduct: (id: string, bpId: string) =>
    request<void>('DELETE', `/api/vendor/batches/${id}/products/${bpId}`),
  vendorBatchOrders: (id: string) => request<BatchOrder[]>('GET', `/api/vendor/batches/${id}/orders`),
  updateBatchOrderStatus: (orderId: string, status: string, note?: string) =>
    request<BatchOrder>('PATCH', `/api/vendor/batch-orders/${orderId}/status`, { status, note }),
  recordBatchOrderPayment: (orderId: string, b: { amount?: number; reference?: string }) =>
    request<BatchOrder>('POST', `/api/vendor/batch-orders/${orderId}/payments`, b),
  vendorBatchShipmentRequests: (id: string) =>
    request<ShipmentRequest[]>('GET', `/api/vendor/batches/${id}/shipment-requests`),
  receiveShipment: (id: string) => request<ShipmentRequest>('POST', `/api/vendor/shipment-requests/${id}/receive`),
  weighShipment: (id: string, b: { actualWeight: number; ratePerKg?: number; handlingFee?: number; deliveryFee?: number }) =>
    request<ShipmentRequest>('POST', `/api/vendor/shipment-requests/${id}/weigh`, b),
  updateShipmentStatus: (id: string, status: string, note?: string) =>
    request<ShipmentRequest>('PATCH', `/api/vendor/shipment-requests/${id}/status`, { status, note }),
  recordShipmentPayment: (id: string, b: { amount?: number; reference?: string }) =>
    request<ShipmentRequest>('POST', `/api/vendor/shipment-requests/${id}/payments`, b),
}
