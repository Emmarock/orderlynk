import { query, request } from '@/shared/lib/http'
import type { AdminSummary, Batch, BatchSummary, Booking, Order, Page, Payout, Vendor } from '@/shared/lib/types'

/** Platform admin: vendor moderation, order/payout oversight, booking + batch management. */
export const adminApi = {
  adminSummary: () => request<AdminSummary>('GET', '/api/admin/summary'),
  adminVendors: (status?: string, page = 0, size = 20) =>
    request<Page<Vendor>>('GET', `/api/admin/vendors${query({ status, page, size })}`),
  approveVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/approve`),
  rejectVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/reject`),
  suspendVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/suspend`),
  setVendorAlternativePayments: (id: string, enabled: boolean) =>
    request<Vendor>('POST', `/api/admin/vendors/${id}/alternative-payments?enabled=${enabled}`),
  adminOrders: (page = 0, size = 20) =>
    request<Page<Order>>('GET', `/api/admin/orders${query({ page, size })}`),
  adminUpdatePayment: (id: string, b: unknown) =>
    request<Order>('PATCH', `/api/admin/orders/${id}/payment`, b),
  generatePayout: (b: unknown) => request<Payout>('POST', '/api/admin/payouts/generate', b),
  adminBookings: (page = 0, size = 20) =>
    request<Page<Booking>>('GET', `/api/admin/bookings${query({ page, size })}`),
  adminCancelBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/admin/bookings/${id}/cancel`, { reason }),
  adminCloseBooking: (id: string) => request<Booking>('POST', `/api/admin/bookings/${id}/close`),
  adminBatches: (page = 0, size = 20) =>
    request<Page<BatchSummary>>('GET', `/api/admin/batches${query({ page, size })}`),
  adminUpdateBatchStatus: (id: string, status: string) =>
    request<Batch>('PATCH', `/api/admin/batches/${id}/status`, { status }),
}
