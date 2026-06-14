import { dateRangeQuery, query, request, upload } from '@/shared/lib/http'
import type {
  AuthResponse, BroadcastResult, ConnectStatus, CustomerSummary, EarningsSummary,
  FulfillmentType, OnboardingResult, Page, Payout, ShareLink, SupportTicket, Vendor, VendorAnalytics,
} from '@/shared/lib/types'

/** Vendor account/profile, signup, customers, analytics, earnings, support, payouts and Connect. */
export const vendorApi = {
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
  uploadVendorImage: (kind: 'logo' | 'banner', file: File) =>
    upload(`/api/vendor/branding/image?kind=${kind}`, file),
  vendorCustomers: (from?: string, to?: string, page = 0, size = 20) =>
    request<Page<CustomerSummary>>('GET', `/api/vendor/customers${query({ from, to, page, size })}`),
  vendorAnalytics: (from?: string, to?: string) =>
    request<VendorAnalytics>('GET', `/api/vendor/analytics${dateRangeQuery(from, to)}`),
  vendorBroadcast: (b: { subject: string; message: string }, from?: string, to?: string) =>
    request<BroadcastResult>('POST', `/api/vendor/customers/broadcast${dateRangeQuery(from, to)}`, b),
  vendorEarnings: (from?: string, to?: string) =>
    request<EarningsSummary>('GET', `/api/vendor/earnings${dateRangeQuery(from, to)}`),
  vendorSupportTickets: (page = 0, size = 20) =>
    request<Page<SupportTicket>>('GET', `/api/vendor/support${query({ page, size })}`),
  createSupportTicket: (b: { category: string; subject: string; message: string }) =>
    request<SupportTicket>('POST', '/api/vendor/support', b),
  vendorPayouts: (page = 0, size = 20) =>
    request<Page<Payout>>('GET', `/api/vendor/payouts${query({ page, size })}`),
  vendorConnectStatus: () => request<ConnectStatus>('GET', '/api/vendor/connect/status'),
  vendorConnectRefresh: () => request<ConnectStatus>('POST', '/api/vendor/connect/refresh'),
  vendorConnectOnboard: () => request<OnboardingResult>('POST', '/api/vendor/connect/onboard'),
}
