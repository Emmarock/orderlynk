import { query, request } from '@/shared/lib/http'
import type {
  Batch, BatchCard, BatchOrder, BatchPaymentInit, BatchProduct, BatchSummary, Page, PublicBatch, ShipmentRequest,
} from '@/shared/lib/types'

/** Batch & Cargo: public discovery + customer orders/shipment requests, and the vendor batch console. */
export const batchApi = {
  // ---- public + customer ----
  batchMarketplace: (opts?: { originCountry?: string; destinationCity?: string; batchType?: string }, page = 0, size = 20) =>
    request<Page<BatchCard>>('GET', `/api/batches${query({ originCountry: opts?.originCountry, destinationCity: opts?.destinationCity, batchType: opts?.batchType, page, size })}`),
  batchPage: (id: string) => request<PublicBatch>('GET', `/api/batches/${id}`),
  createBatchOrder: (b: unknown) => request<BatchOrder>('POST', '/api/batches/orders', b),
  trackBatchOrder: (publicId: string, contact: string) =>
    request<BatchOrder>('POST', '/api/batches/orders/track', { publicId, contact }),
  myBatchOrders: (page = 0, size = 20) => request<Page<BatchOrder>>('GET', `/api/batches/orders/mine${query({ page, size })}`),
  payBatchOrder: (publicId: string, contact?: string) =>
    request<BatchPaymentInit>('POST', `/api/batches/orders/${publicId}/pay`, { contact }),
  createShipmentRequest: (b: unknown) => request<ShipmentRequest>('POST', '/api/batches/shipment-requests', b),
  trackShipmentRequest: (publicId: string, contact: string) =>
    request<ShipmentRequest>('POST', '/api/batches/shipment-requests/track', { publicId, contact }),
  myShipmentRequests: (page = 0, size = 20) => request<Page<ShipmentRequest>>('GET', `/api/batches/shipment-requests/mine${query({ page, size })}`),
  payShipmentRequest: (publicId: string, contact?: string) =>
    request<BatchPaymentInit>('POST', `/api/batches/shipment-requests/${publicId}/pay`, { contact }),

  // ---- vendor ----
  vendorBatches: (page = 0, size = 20) => request<Page<BatchSummary>>('GET', `/api/vendor/batches${query({ page, size })}`),
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
  vendorBatchOrders: (id: string, page = 0, size = 20) => request<Page<BatchOrder>>('GET', `/api/vendor/batches/${id}/orders${query({ page, size })}`),
  updateBatchOrderStatus: (orderId: string, status: string, note?: string) =>
    request<BatchOrder>('PATCH', `/api/vendor/batch-orders/${orderId}/status`, { status, note }),
  recordBatchOrderPayment: (orderId: string, b: { amount?: number; reference?: string }) =>
    request<BatchOrder>('POST', `/api/vendor/batch-orders/${orderId}/payments`, b),
  vendorBatchShipmentRequests: (id: string, page = 0, size = 20) =>
    request<Page<ShipmentRequest>>('GET', `/api/vendor/batches/${id}/shipment-requests${query({ page, size })}`),
  receiveShipment: (id: string) => request<ShipmentRequest>('POST', `/api/vendor/shipment-requests/${id}/receive`),
  weighShipment: (id: string, b: { actualWeight: number; ratePerKg?: number; handlingFee?: number; deliveryFee?: number }) =>
    request<ShipmentRequest>('POST', `/api/vendor/shipment-requests/${id}/weigh`, b),
  updateShipmentStatus: (id: string, status: string, note?: string) =>
    request<ShipmentRequest>('PATCH', `/api/vendor/shipment-requests/${id}/status`, { status, note }),
  recordShipmentPayment: (id: string, b: { amount?: number; reference?: string }) =>
    request<ShipmentRequest>('POST', `/api/vendor/shipment-requests/${id}/payments`, b),
}
