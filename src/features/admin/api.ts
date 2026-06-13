import { request } from '@/shared/lib/http'
import type { Batch, BatchSummary, Booking, Order, Payout, Vendor } from '@/shared/lib/types'

/** Platform admin: vendor moderation, order/payout oversight, booking + batch management. */
export const adminApi = {
  adminVendors: (status?: string) =>
    request<Vendor[]>('GET', `/api/admin/vendors${status ? `?status=${status}` : ''}`),
  approveVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/approve`),
  rejectVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/reject`),
  suspendVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/suspend`),
  setVendorAlternativePayments: (id: string, enabled: boolean) =>
    request<Vendor>('POST', `/api/admin/vendors/${id}/alternative-payments?enabled=${enabled}`),
  adminOrders: () => request<Order[]>('GET', '/api/admin/orders'),
  adminUpdatePayment: (id: string, b: unknown) =>
    request<Order>('PATCH', `/api/admin/orders/${id}/payment`, b),
  generatePayout: (b: unknown) => request<Payout>('POST', '/api/admin/payouts/generate', b),
  adminBookings: () => request<Booking[]>('GET', '/api/admin/bookings'),
  adminCancelBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/admin/bookings/${id}/cancel`, { reason }),
  adminCloseBooking: (id: string) => request<Booking>('POST', `/api/admin/bookings/${id}/close`),
  adminBatches: () => request<BatchSummary[]>('GET', '/api/admin/batches'),
  adminUpdateBatchStatus: (id: string, status: string) =>
    request<Batch>('PATCH', `/api/admin/batches/${id}/status`, { status }),
}
