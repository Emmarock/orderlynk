import { dateRangeQuery, query, request } from '@/shared/lib/http'
import type {
  AdminSummary, Batch, BatchSummary, Booking, FeaturedPlacement, FeeSettings, Order, Page, Payout,
  SubscriptionInvoice, SubscriptionPlanInfo, VatLedgerEntry, VatLedgerSummary, Vendor, VendorPlan,
} from '@/shared/lib/types'

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
  setVendorChatOrders: (id: string, enabled: boolean) =>
    request<Vendor>('POST', `/api/admin/vendors/${id}/chat-orders?enabled=${enabled}`),
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

  // ---- VAT ledger (platform-collected VAT to remit) ----
  adminVat: (from?: string, to?: string) =>
    request<VatLedgerSummary>('GET', `/api/admin/vat${dateRangeQuery(from, to)}`),
  adminRemitVat: (id: string) => request<VatLedgerEntry>('POST', `/api/admin/vat/${id}/remit`),

  // ---- Fee settings (#5) ----
  adminFeeSettings: () => request<FeeSettings>('GET', '/api/admin/fee-settings'),
  adminUpdateFeeSettings: (b: FeeSettings) => request<FeeSettings>('PUT', '/api/admin/fee-settings', b),

  // ---- Subscriptions (#6) ----
  adminPlans: () => request<SubscriptionPlanInfo[]>('GET', '/api/admin/subscriptions/plans'),
  adminUpdatePlan: (plan: VendorPlan, b: { displayName: string; monthlyFee: number; commissionRate: number; currency: string }) =>
    request<SubscriptionPlanInfo>('PUT', `/api/admin/subscriptions/plans/${plan}`, b),
  adminAssignPlan: (vendorId: string, plan: VendorPlan) =>
    request<Vendor>('POST', `/api/admin/subscriptions/vendors/${vendorId}/plan?plan=${plan}`),
  adminInvoices: (status?: string, page = 0, size = 20) =>
    request<Page<SubscriptionInvoice>>('GET', `/api/admin/subscriptions/invoices${query({ status, page, size })}`),
  adminGenerateInvoices: (period?: string) =>
    request<{ period: string; generated: number }>('POST', `/api/admin/subscriptions/invoices/generate${query({ period })}`),
  adminMarkInvoicePaid: (id: string, reference?: string) =>
    request<SubscriptionInvoice>('POST', `/api/admin/subscriptions/invoices/${id}/mark-paid${query({ reference })}`),
  adminWaiveInvoice: (id: string) =>
    request<SubscriptionInvoice>('POST', `/api/admin/subscriptions/invoices/${id}/waive`),

  // ---- Promotions / featured placement (#7) ----
  adminPromotions: (status?: string, page = 0, size = 20) =>
    request<Page<FeaturedPlacement>>('GET', `/api/admin/promotions/featured${query({ status, page, size })}`),
  adminMarkPromotionPaid: (id: string, reference?: string) =>
    request<FeaturedPlacement>('POST', `/api/admin/promotions/featured/${id}/mark-paid${query({ reference })}`),
  adminWaivePromotion: (id: string) =>
    request<FeaturedPlacement>('POST', `/api/admin/promotions/featured/${id}/waive`),
}
