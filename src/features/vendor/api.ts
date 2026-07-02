import { dateRangeQuery, query, request, upload } from '@/shared/lib/http'
import type {
  AuthResponse, BillingStatus, BroadcastResult, CardSetupResult, ConnectStatus, CustomerSummary,
  EarningsSummary, FeaturedPlacement, FeaturedPricing, FulfillmentType, OnboardingResult, Page, Payout,
  ShareLink, SubscriptionPlanInfo, SupportTicket, VatLedgerEntry, VatLedgerSummary, Vendor, VendorAnalytics, VendorPlan,
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
  /** VAT this vendor has collected and must remit to the government. */
  vendorVat: (from?: string, to?: string) =>
    request<VatLedgerSummary>('GET', `/api/vendor/vat${dateRangeQuery(from, to)}`),
  /** Mark one of the vendor's own VAT entries as remitted to the government. */
  vendorRemitVat: (id: string) => request<VatLedgerEntry>('POST', `/api/vendor/vat/${id}/remit`),
  vendorSupportTickets: (page = 0, size = 20) =>
    request<Page<SupportTicket>>('GET', `/api/vendor/support${query({ page, size })}`),
  createSupportTicket: (b: { category: string; subject: string; message: string }) =>
    request<SupportTicket>('POST', '/api/vendor/support', b),
  vendorPayouts: (page = 0, size = 20) =>
    request<Page<Payout>>('GET', `/api/vendor/payouts${query({ page, size })}`),
  vendorConnectStatus: () => request<ConnectStatus>('GET', '/api/vendor/connect/status'),
  vendorConnectRefresh: () => request<ConnectStatus>('POST', '/api/vendor/connect/refresh'),
  vendorConnectOnboard: () => request<OnboardingResult>('POST', '/api/vendor/connect/onboard'),
  // Card on file — used to collect platform fees (subscriptions, featured placement, instant payouts).
  vendorBillingStatus: () => request<BillingStatus>('GET', '/api/vendor/billing'),
  vendorStartCardSetup: () => request<CardSetupResult>('POST', '/api/vendor/billing/card'),
  vendorConfirmCard: (setupIntentId: string) =>
    request<BillingStatus>('POST', `/api/vendor/billing/card/confirm?setupIntentId=${encodeURIComponent(setupIntentId)}`),
  // Instant payout: move the vendor's own Stripe balance to their bank now, for a fee on the card on file.
  vendorInstantPayout: (amount: number, currency: string) =>
    request<Payout>('POST', `/api/vendor/payouts/instant${query({ amount, currency })}`),
  // Featured placement: promote the store at the top of the marketplace, charged to the card on file.
  vendorFeaturedPricing: () => request<FeaturedPricing>('GET', '/api/vendor/featured/pricing'),
  vendorPurchaseFeatured: () => request<FeaturedPlacement>('POST', '/api/vendor/featured/purchase'),
  vendorFeaturedHistory: () => request<FeaturedPlacement[]>('GET', '/api/vendor/featured'),
  // Subscription tiers (self-serve plan change).
  vendorPlans: () => request<SubscriptionPlanInfo[]>('GET', '/api/vendor/plans'),
  vendorChangePlan: (plan: VendorPlan) => request<Vendor>('POST', `/api/vendor/plan?plan=${plan}`),
}
