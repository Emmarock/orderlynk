import { query, request } from '@/shared/lib/http'
import type { DraftOrder, Order, Page, Quote, RateQuoteResponse, Shipment, TrackingResponse } from '@/shared/lib/types'

/** Customer ordering (quote/checkout/track) + vendor order fulfillment, payment and shipping. */
export const orderApi = {
  quote: (b: unknown) => request<Quote>('POST', '/api/orders/quote', b),
  checkout: (b: unknown) => request<Order>('POST', '/api/orders', b),
  shippingRates: (b: unknown) => request<RateQuoteResponse>('POST', '/api/shipping/rates', b),
  track: (orderId: string, contact: string) =>
    request<Order>('POST', '/api/orders/track', { orderId, contact }),
  trackByToken: (token: string) => request<Order>('POST', '/api/orders/track-token', { token }),
  myOrders: (page = 0, size = 20) =>
    request<Page<Order>>('GET', `/api/orders/mine${query({ page, size })}`),
  vendorOrders: (from?: string, to?: string, page = 0, size = 20) =>
    request<Page<Order>>('GET', `/api/vendor/orders${query({ from, to, page, size })}`),
  /** Parse a pasted chat thread into a structured draft order (vendor-only, advisory). */
  parseChatOrder: (text: string) =>
    request<DraftOrder>('POST', '/api/vendor/orders/parse-chat', { text }),
  /** Vendor records an order on a customer's behalf (e.g. confirming a chat-parsed draft). */
  vendorCreateOrder: (b: unknown) => request<Order>('POST', '/api/vendor/orders', b),
  vendorOrder: (id: string) => request<Order>('GET', `/api/vendor/orders/${id}`),
  vendorCustomerOrders: (phone: string) =>
    request<Order[]>('GET', `/api/vendor/customers/${encodeURIComponent(phone)}/orders`),
  updateFulfillment: (id: string, status: string, note?: string) =>
    request<Order>('PATCH', `/api/vendor/orders/${id}/fulfillment`, { status, note }),
  vendorUpdatePayment: (id: string, b: unknown) =>
    request<Order>('PATCH', `/api/vendor/orders/${id}/payment`, b),
  // ---- vendor shipping (labels + tracking) ----
  shippingShipment: (orderId: string) =>
    request<Shipment>('GET', `/api/shipping/vendor/orders/${orderId}`),
  shippingOrderRates: (orderId: string) =>
    request<RateQuoteResponse>('GET', `/api/shipping/vendor/orders/${orderId}/rates`),
  buyShippingLabel: (orderId: string, rateId?: string) =>
    request<Shipment>('POST', `/api/shipping/vendor/orders/${orderId}/label`, { rateId }),
  refreshShippingTracking: (orderId: string) =>
    request<TrackingResponse>('POST', `/api/shipping/vendor/orders/${orderId}/tracking/refresh`),
}
