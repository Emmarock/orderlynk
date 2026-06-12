import type {
  Address,
  AuthResponse,
  AvailabilityRule,
  BlockedSlot,
  Booking,
  BookingPayment,
  BroadcastResult,
  ConnectStatus,
  CustomerAddress,
  AddressSuggestion,
  CustomerSummary,
  DayAvailability,
  EarningsSummary,
  FulfillmentType,
  OnboardingResult,
  Order,
  PaymentInit,
  Payout,
  Product,
  ProviderCard,
  Quote,
  RateQuoteResponse,
  RatingSummary,
  Review,
  ServiceAddOn,
  ServiceOffering,
  ServiceProviderProfile,
  ServiceStorefront,
  ShareLink,
  Shipment,
  Storefront,
  SupportTicket,
  TrackingResponse,
  Vendor,
  VendorAnalytics,
} from './types'

/** Build a `?from=&to=` query string from optional ISO dates (yyyy-MM-dd). */
function dateRangeQuery(from?: string, to?: string): string {
  const qs = new URLSearchParams()
  if (from) qs.set('from', from)
  if (to) qs.set('to', to)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

const BASE = import.meta.env.VITE_API_URL ?? ''

const TOKEN_KEY = 'orderlynk.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  details?: Record<string, string>
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message)
    this.status = status
    this.details = details
  }
}

/**
 * Best user-facing message for a failed request: prefers a specific field-validation message
 * (the `details` map returned for 400s) over the generic "Validation failed" envelope.
 */
export function apiMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const first = err.details && Object.values(err.details)[0]
    return first || err.message
  }
  return fallback
}

async function request<T>(method: string, path: string, body?: unknown, auth = false): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  // Always attach the token when present so guest checkout can be linked to a logged-in customer.
  if (token && (auth || true)) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T
  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    const message = (data && (data.message as string)) || `Request failed (${res.status})`
    throw new ApiError(res.status, message, data?.details)
  }
  return data as T
}

export const api = {
  // ---- auth ----
  register: (b: { fullName: string; email: string; password: string; confirmPassword: string; phone?: string; city?: string; country?: string; address?: Address }) =>
    request<AuthResponse>('POST', '/api/auth/register', b),
  login: (b: { email: string; password: string }) =>
    request<AuthResponse>('POST', '/api/auth/login', b),
  me: () => request<AuthResponse>('GET', '/api/auth/me'),
  changePassword: (b: { currentPassword: string; newPassword: string }) =>
    request<void>('POST', '/api/auth/change-password', b),
  verifyEmail: (token: string) => request<void>('POST', '/api/auth/verify-email', { token }),
  resendVerification: () => request<void>('POST', '/api/auth/resend-verification'),
  forgotPassword: (email: string) => request<void>('POST', '/api/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    request<void>('POST', '/api/auth/reset-password', { token, newPassword }),
  updateProfile: (b: { fullName: string; phone?: string; city?: string; country?: string }) =>
    request<AuthResponse>('PUT', '/api/auth/profile', b),
  // ---- customer address book ----
  customerAddresses: () => request<CustomerAddress[]>('GET', '/api/account/addresses'),
  addCustomerAddress: (b: { label?: string; address: Address; makeDefault?: boolean }) =>
    request<CustomerAddress>('POST', '/api/account/addresses', b),
  updateCustomerAddress: (id: string, b: { label?: string; address: Address; makeDefault?: boolean }) =>
    request<CustomerAddress>('PUT', `/api/account/addresses/${id}`, b),
  setDefaultAddress: (id: string) => request<CustomerAddress>('POST', `/api/account/addresses/${id}/default`),
  deleteCustomerAddress: (id: string) => request<void>('DELETE', `/api/account/addresses/${id}`),
  changeEmail: (b: { newEmail: string; currentPassword: string }) =>
    request<AuthResponse>('POST', '/api/auth/change-email', b),

  // ---- meta ----
  optionSets: () => request<Record<string, string[]>>('GET', '/api/meta/option-sets'),
  // Address autocomplete (proxied to Geoapify). `country` accepts a name ("Canada") or ISO code.
  addressAutocomplete: (text: string, country?: string) => {
    const qs = new URLSearchParams({ text })
    if (country) qs.set('country', country)
    return request<AddressSuggestion[]>('GET', `/api/meta/address/autocomplete?${qs.toString()}`)
  },

  // ---- public storefront ----
  marketplace: (city?: string, category?: string) => {
    const qs = new URLSearchParams()
    if (city) qs.set('city', city)
    if (category) qs.set('category', category)
    const suffix = qs.toString()
    return request<Vendor[]>('GET', `/api/storefronts${suffix ? `?${suffix}` : ''}`)
  },
  storefront: (slug: string) => request<Storefront>('GET', `/api/storefronts/${slug}`),
  rateVendor: (slug: string, b: { stars: number; comment?: string }) =>
    request<RatingSummary>('POST', `/api/storefronts/${slug}/ratings`, b),
  myVendorRating: (slug: string) =>
    request<RatingSummary>('GET', `/api/storefronts/${slug}/ratings/mine`),

  // ---- orders (public) ----
  quote: (b: unknown) => request<Quote>('POST', '/api/orders/quote', b),
  checkout: (b: unknown) => request<Order>('POST', '/api/orders', b),

  // ---- shipping (public live rates for the cart) ----
  shippingRates: (b: unknown) => request<RateQuoteResponse>('POST', '/api/shipping/rates', b),
  track: (orderId: string, contact: string) =>
    request<Order>('POST', '/api/orders/track', { orderId, contact }),
  trackByToken: (token: string) => request<Order>('POST', '/api/orders/track-token', { token }),
  myOrders: () => request<Order[]>('GET', '/api/orders/mine'),

  // ---- vendor ----
  // One-step seller signup for a brand-new user (account + business in one call); returns a signed-in session.
  registerSeller: (b: {
    fullName: string
    email: string
    password: string
    confirmPassword: string
    phone?: string
    businessName: string
    description?: string
    houseNumber?: string
    street?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
    whatsappNumber?: string
    instagramHandle?: string
    fulfillmentTypes?: FulfillmentType[]
  }) => request<AuthResponse>('POST', '/api/vendor/register', b),
  applyVendor: (b: unknown) => request<{ token: string; vendor: Vendor }>('POST', '/api/vendor/apply', b),
  myVendor: () => request<Vendor>('GET', '/api/vendor/me'),
  updateVendor: (b: unknown) => request<Vendor>('PUT', '/api/vendor/me', b),
  shareLink: (source?: string, campaign?: string) => {
    const qs = new URLSearchParams()
    if (source) qs.set('source', source)
    if (campaign) qs.set('campaign', campaign)
    return request<ShareLink>('GET', `/api/vendor/share-link?${qs.toString()}`)
  },
  vendorProducts: () => request<Product[]>('GET', '/api/vendor/products'),
  // Multipart upload — let the browser set the Content-Type (with boundary), so we don't use `request`.
  uploadProductImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${BASE}/api/vendor/products/image`, { method: 'POST', headers, body: form })
    const text = await res.text()
    const data = text ? JSON.parse(text) : undefined
    if (!res.ok) {
      const message = (data && (data.message as string)) || `Upload failed (${res.status})`
      throw new ApiError(res.status, message, data?.details)
    }
    return data as { url: string }
  },
  // Upload a vendor branding image (kind='logo' | 'banner'); returns its public URL.
  uploadVendorImage: async (kind: 'logo' | 'banner', file: File): Promise<{ url: string }> => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${BASE}/api/vendor/branding/image?kind=${kind}`, { method: 'POST', headers, body: form })
    const text = await res.text()
    const data = text ? JSON.parse(text) : undefined
    if (!res.ok) {
      const message = (data && (data.message as string)) || `Upload failed (${res.status})`
      throw new ApiError(res.status, message, data?.details)
    }
    return data as { url: string }
  },
  generateProductDescription: (b: { name: string; category?: string }) =>
    request<{ description: string }>('POST', '/api/vendor/products/description', b),
  createProduct: (b: unknown) => request<Product>('POST', '/api/vendor/products', b),
  updateProduct: (id: string, b: unknown) => request<Product>('PUT', `/api/vendor/products/${id}`, b),
  toggleProduct: (id: string, active: boolean) =>
    request<Product>('PATCH', `/api/vendor/products/${id}/active?active=${active}`),
  deleteProduct: (id: string) => request<void>('DELETE', `/api/vendor/products/${id}`),
  vendorOrders: (from?: string, to?: string) =>
    request<Order[]>('GET', `/api/vendor/orders${dateRangeQuery(from, to)}`),
  vendorOrder: (id: string) => request<Order>('GET', `/api/vendor/orders/${id}`),
  vendorCustomers: (from?: string, to?: string) =>
    request<CustomerSummary[]>('GET', `/api/vendor/customers${dateRangeQuery(from, to)}`),
  vendorAnalytics: (from?: string, to?: string) =>
    request<VendorAnalytics>('GET', `/api/vendor/analytics${dateRangeQuery(from, to)}`),
  vendorBroadcast: (b: { subject: string; message: string }, from?: string, to?: string) =>
    request<BroadcastResult>('POST', `/api/vendor/customers/broadcast${dateRangeQuery(from, to)}`, b),
  vendorEarnings: (from?: string, to?: string) =>
    request<EarningsSummary>('GET', `/api/vendor/earnings${dateRangeQuery(from, to)}`),
  vendorSupportTickets: () => request<SupportTicket[]>('GET', '/api/vendor/support'),
  createSupportTicket: (b: { category: string; subject: string; message: string }) =>
    request<SupportTicket>('POST', '/api/vendor/support', b),
  updateFulfillment: (id: string, status: string, note?: string) =>
    request<Order>('PATCH', `/api/vendor/orders/${id}/fulfillment`, { status, note }),
  // ---- vendor shipping (labels + tracking) ----
  // Current shipment for an order; rejects with a 404 ApiError when none exists yet.
  shippingShipment: (orderId: string) =>
    request<Shipment>('GET', `/api/shipping/vendor/orders/${orderId}`),
  shippingOrderRates: (orderId: string) =>
    request<RateQuoteResponse>('GET', `/api/shipping/vendor/orders/${orderId}/rates`),
  buyShippingLabel: (orderId: string, rateId?: string) =>
    request<Shipment>('POST', `/api/shipping/vendor/orders/${orderId}/label`, { rateId }),
  refreshShippingTracking: (orderId: string) =>
    request<TrackingResponse>('POST', `/api/shipping/vendor/orders/${orderId}/tracking/refresh`),
  vendorUpdatePayment: (id: string, b: unknown) =>
    request<Order>('PATCH', `/api/vendor/orders/${id}/payment`, b),
  vendorPayouts: () => request<Payout[]>('GET', '/api/vendor/payouts'),
  // ---- vendor Stripe Connect onboarding ----
  vendorConnectStatus: () => request<ConnectStatus>('GET', '/api/vendor/connect/status'),
  vendorConnectRefresh: () => request<ConnectStatus>('POST', '/api/vendor/connect/refresh'),
  vendorConnectOnboard: () => request<OnboardingResult>('POST', '/api/vendor/connect/onboard'),

  // ---- admin ----
  adminVendors: (status?: string) =>
    request<Vendor[]>('GET', `/api/admin/vendors${status ? `?status=${status}` : ''}`),
  approveVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/approve`),
  rejectVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/reject`),
  suspendVendor: (id: string) => request<Vendor>('POST', `/api/admin/vendors/${id}/suspend`),
  adminOrders: () => request<Order[]>('GET', '/api/admin/orders'),
  adminUpdatePayment: (id: string, b: unknown) =>
    request<Order>('PATCH', `/api/admin/orders/${id}/payment`, b),
  generatePayout: (b: unknown) => request<Payout>('POST', '/api/admin/payouts/generate', b),
  adminBookings: () => request<Booking[]>('GET', '/api/admin/bookings'),
  adminCancelBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/admin/bookings/${id}/cancel`, { reason }),
  adminCloseBooking: (id: string) => request<Booking>('POST', `/api/admin/bookings/${id}/close`),

  // ---- services: public discovery + customer bookings ----
  serviceMarketplace: (opts?: { category?: string; city?: string; acceptsDeposits?: boolean }) => {
    const qs = new URLSearchParams()
    if (opts?.category) qs.set('category', opts.category)
    if (opts?.city) qs.set('city', opts.city)
    if (opts?.acceptsDeposits) qs.set('acceptsDeposits', 'true')
    const s = qs.toString()
    return request<ProviderCard[]>('GET', `/api/services${s ? `?${s}` : ''}`)
  },
  serviceStorefront: (slug: string) => request<ServiceStorefront>('GET', `/api/services/${slug}`),
  bookingAvailability: (serviceId: string, date: string) =>
    request<DayAvailability>('GET', `/api/bookings/availability?serviceId=${serviceId}&date=${date}`),
  createBooking: (b: unknown) => request<Booking>('POST', '/api/bookings', b),
  trackBooking: (publicBookingId: string, contact: string) =>
    request<Booking>('POST', '/api/bookings/track', { publicBookingId, contact }),
  payBooking: (publicBookingId: string, contact?: string) =>
    request<PaymentInit>('POST', `/api/bookings/${publicBookingId}/pay`, { contact }),
  myBookings: () => request<Booking[]>('GET', '/api/bookings/mine'),
  reviewBooking: (publicBookingId: string, b: { rating: number; comment?: string }, contact?: string) =>
    request<Review>('POST', `/api/bookings/${publicBookingId}/review${contact ? `?contact=${encodeURIComponent(contact)}` : ''}`, b),

  // ---- vendor: services module ----
  serviceProfile: () => request<ServiceProviderProfile>('GET', '/api/vendor/service-profile'),
  updateServiceProfile: (b: unknown) => request<ServiceProviderProfile>('PUT', '/api/vendor/service-profile', b),
  vendorServices: () => request<ServiceOffering[]>('GET', '/api/vendor/services'),
  // Multipart upload — let the browser set the Content-Type (with boundary), so we don't use `request`.
  uploadServiceImage: async (file: File): Promise<{ url: string }> => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    const token = tokenStore.get()
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${BASE}/api/vendor/services/image`, { method: 'POST', headers, body: form })
    const text = await res.text()
    const data = text ? JSON.parse(text) : undefined
    if (!res.ok) {
      const message = (data && (data.message as string)) || `Upload failed (${res.status})`
      throw new ApiError(res.status, message, data?.details)
    }
    return data as { url: string }
  },
  createService: (b: unknown) => request<ServiceOffering>('POST', '/api/vendor/services', b),
  updateService: (id: string, b: unknown) => request<ServiceOffering>('PUT', `/api/vendor/services/${id}`, b),
  toggleService: (id: string, active: boolean) =>
    request<ServiceOffering>('PATCH', `/api/vendor/services/${id}/active?active=${active}`),
  deleteService: (id: string) => request<void>('DELETE', `/api/vendor/services/${id}`),
  addServiceAddOn: (serviceId: string, b: unknown) =>
    request<ServiceAddOn>('POST', `/api/vendor/services/${serviceId}/add-ons`, b),
  updateServiceAddOn: (serviceId: string, addOnId: string, b: unknown) =>
    request<ServiceAddOn>('PUT', `/api/vendor/services/${serviceId}/add-ons/${addOnId}`, b),
  deleteServiceAddOn: (serviceId: string, addOnId: string) =>
    request<void>('DELETE', `/api/vendor/services/${serviceId}/add-ons/${addOnId}`),
  availabilityRules: () => request<AvailabilityRule[]>('GET', '/api/vendor/availability'),
  addAvailabilityRule: (b: unknown) => request<AvailabilityRule>('POST', '/api/vendor/availability', b),
  updateAvailabilityRule: (id: string, b: unknown) =>
    request<AvailabilityRule>('PUT', `/api/vendor/availability/${id}`, b),
  deleteAvailabilityRule: (id: string) => request<void>('DELETE', `/api/vendor/availability/${id}`),
  blockedSlots: () => request<BlockedSlot[]>('GET', '/api/vendor/blocked-slots'),
  addBlockedSlot: (b: unknown) => request<BlockedSlot>('POST', '/api/vendor/blocked-slots', b),
  deleteBlockedSlot: (id: string) => request<void>('DELETE', `/api/vendor/blocked-slots/${id}`),

  // ---- vendor: booking dashboard ----
  vendorBookings: (from?: string, to?: string) =>
    request<Booking[]>('GET', `/api/vendor/bookings${dateRangeQuery(from, to)}`),
  vendorBooking: (id: string) => request<Booking>('GET', `/api/vendor/bookings/${id}`),
  approveBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/approve`),
  rejectBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/vendor/bookings/${id}/reject`, { reason }),
  rescheduleBooking: (id: string, appointmentStart: string) =>
    request<Booking>('POST', `/api/vendor/bookings/${id}/reschedule`, { appointmentStart }),
  cancelBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/vendor/bookings/${id}/cancel`, { reason }),
  startBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/start`),
  completeBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/complete`),
  noShowBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/no-show`),
  closeBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/close`),
  bookingPayments: (id: string) => request<BookingPayment[]>('GET', `/api/vendor/bookings/${id}/payments`),
  recordBookingPayment: (id: string, b: unknown) =>
    request<BookingPayment>('POST', `/api/vendor/bookings/${id}/payments`, b),
  vendorReviews: () => request<Review[]>('GET', '/api/vendor/reviews'),
}
