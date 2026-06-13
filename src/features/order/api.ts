import { dateRangeQuery, request } from '@/shared/lib/http'
import type { Order, Quote, RateQuoteResponse, Shipment, TrackingResponse } from '@/shared/lib/types'

/** Customer ordering (quote/checkout/track) + vendor order fulfillment, payment and shipping. */
export const orderApi = {
  quote: (b: unknown) => request<Quote>('POST', '/api/orders/quote', b),
  checkout: (b: unknown) => request<Order>('POST', '/api/orders', b),
  shippingRates: (b: unknown) => request<RateQuoteResponse>('POST', '/api/shipping/rates', b),
  track: (orderId: string, contact: string) =>
    request<Order>('POST', '/api/orders/track', { orderId, contact }),
  trackByToken: (token: string) => request<Order>('POST', '/api/orders/track-token', { token }),
  myOrders: () => request<Order[]>('GET', '/api/orders/mine'),
  vendorOrders: (from?: string, to?: string) =>
    request<Order[]>('GET', `/api/vendor/orders${dateRangeQuery(from, to)}`),
  vendorOrder: (id: string) => request<Order>('GET', `/api/vendor/orders/${id}`),
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
