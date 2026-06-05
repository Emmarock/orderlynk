import type {
  AuthResponse,
  Order,
  Payout,
  Product,
  Quote,
  ShareLink,
  Storefront,
  Vendor,
} from './types'

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
  register: (b: { fullName: string; email: string; password: string; phone?: string; city?: string; country?: string }) =>
    request<AuthResponse>('POST', '/api/auth/register', b),
  login: (b: { email: string; password: string }) =>
    request<AuthResponse>('POST', '/api/auth/login', b),
  me: () => request<AuthResponse>('GET', '/api/auth/me'),
  changePassword: (b: { currentPassword: string; newPassword: string }) =>
    request<void>('POST', '/api/auth/change-password', b),

  // ---- meta ----
  optionSets: () => request<Record<string, string[]>>('GET', '/api/meta/option-sets'),

  // ---- public storefront ----
  marketplace: (city?: string) =>
    request<Vendor[]>('GET', `/api/storefronts${city ? `?city=${encodeURIComponent(city)}` : ''}`),
  storefront: (slug: string) => request<Storefront>('GET', `/api/storefronts/${slug}`),

  // ---- orders (public) ----
  quote: (b: unknown) => request<Quote>('POST', '/api/orders/quote', b),
  checkout: (b: unknown) => request<Order>('POST', '/api/orders', b),
  track: (orderId: string, contact: string) =>
    request<Order>('POST', '/api/orders/track', { orderId, contact }),
  myOrders: () => request<Order[]>('GET', '/api/orders/mine'),

  // ---- vendor ----
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
  createProduct: (b: unknown) => request<Product>('POST', '/api/vendor/products', b),
  updateProduct: (id: string, b: unknown) => request<Product>('PUT', `/api/vendor/products/${id}`, b),
  toggleProduct: (id: string, active: boolean) =>
    request<Product>('PATCH', `/api/vendor/products/${id}/active?active=${active}`),
  deleteProduct: (id: string) => request<void>('DELETE', `/api/vendor/products/${id}`),
  vendorOrders: () => request<Order[]>('GET', '/api/vendor/orders'),
  updateFulfillment: (id: string, status: string, note?: string) =>
    request<Order>('PATCH', `/api/vendor/orders/${id}/fulfillment`, { status, note }),
  vendorUpdatePayment: (id: string, b: unknown) =>
    request<Order>('PATCH', `/api/vendor/orders/${id}/payment`, b),
  vendorPayouts: () => request<Payout[]>('GET', '/api/vendor/payouts'),

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
}
