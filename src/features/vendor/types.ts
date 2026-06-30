import type { FulfillmentType, PaymentStatus, VendorStatus } from '@/shared/lib/types'

export interface Vendor {
  id: string
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
  tiktokHandle?: string
  facebookPage?: string
  logoUrl?: string
  bannerUrl?: string
  storeSlug: string
  verificationStatus: VendorStatus
  fulfillmentTypes: FulfillmentType[]
  active: boolean
  rating?: number
  ratingCount: number
  plan?: VendorPlan
  featuredUntil?: string | null
  commissionRate: number
  payoutMethod?: string
  payoutAccountName?: string
  payoutAccountNumber?: string
  payoutBankName?: string
  payoutEmail?: string
  payoutCurrency?: string
  payoutSortCode?: string
  payoutRoutingNumber?: string
  payoutInstitutionNumber?: string
  payoutTransitNumber?: string
  payoutIban?: string
  payoutBic?: string
  payoutBankCode?: string
  notifyByEmail: boolean
  notifyByWhatsapp: boolean
  lowStockAlerts: boolean
  alternativePaymentsEnabled: boolean
  chatOrderEnabled: boolean
}

export interface RatingSummary {
  rating: number | null
  ratingCount: number
  myStars: number | null
}

export interface CustomerSummary {
  name: string
  phone: string
  email?: string
  city?: string
  orderCount: number
  totalSpent: number
  lastOrderAt: string
}

export interface ProductSalesSummary {
  productId: string
  productName: string
  quantitySold: number
  revenue: number
}

export interface VendorAnalytics {
  totalOrders: number
  paidOrders: number
  openFulfillmentOrders: number
  grossRevenue: number
  uniqueCustomers: number
  topCustomers: CustomerSummary[]
  topProducts: ProductSalesSummary[]
}

/** Platform-wide admin dashboard summary (from /api/admin/summary). */
export interface AdminSummary {
  vendorCount: number
  activeVendorCount: number
  pendingCount: number
  orderCount: number
  paidOrderCount: number
  grossRevenue: number
  platformRevenue: number
  pendingVendors: Vendor[]
}

export interface BroadcastResult {
  recipients: number
  totalCustomers: number
}

export interface OrderEarning {
  publicOrderId: string
  createdAt: string
  paymentStatus: PaymentStatus
  grossSales: number
  commission: number
  refund: number
  net: number
}

export interface EarningsSummary {
  grossSales: number
  platformCommission: number
  processingFees: number
  refunds: number
  taxRate: number
  tax: number
  netPayout: number
  totalOrders: number
  paidOrders: number
  currency: string
  orders: OrderEarning[]
}

export interface SupportTicket {
  id: string
  category: string
  subject: string
  message: string
  status: string
  createdAt: string
}

export interface Payout {
  id: string
  vendorId: string
  periodStart: string
  periodEnd: string
  grossSales: number
  platformFees: number
  logisticsFees: number
  refunds: number
  netPayout: number
  payoutStatus: string
  paidDate?: string
  instantPayout?: boolean
  instantPayoutFee?: number
}

export type VendorPlan = 'STARTER' | 'GROWTH' | 'PRO'

/** A subscription tier and its pricing (from /api/vendor/plans). */
export interface SubscriptionPlanInfo {
  plan: VendorPlan
  displayName: string
  monthlyFee: number
  commissionRate: number
  currency: string
}

export type FeaturedPlacementStatus = 'DUE' | 'PAID' | 'WAIVED' | 'FAILED'

/** A featured-placement purchase (promotes the store at the top of marketplace discovery). */
export interface FeaturedPlacement {
  id: string
  vendorId: string
  days: number
  amount: number
  currency: string
  startsAt: string
  endsAt: string
  status: FeaturedPlacementStatus
  paidAt?: string | null
  createdAt: string
}

/** Current price of one featured-placement slot (/api/vendor/featured/pricing). */
export interface FeaturedPricing {
  fee: number
  days: number
  currency: string
}

/** Platform-wide fee policy (admin: GET/PUT /api/admin/fee-settings). */
export interface FeeSettings {
  serviceFeeRate: number
  processingRate: number
  processingFixed: number
  processingBufferRate: number
  grossUpProcessing: boolean
  logisticsMarginRate: number
  logisticsMarkupFlat: number
  taxRate: number
  instantPayoutFeeRate: number
  cargoHandlingFeeRate: number
  featuredPlacementFee: number
  featuredPlacementDays: number
  featuredPlacementCurrency: string
  logistics: Record<string, number>
  updatedAt?: string | null
}

/** A monthly vendor subscription invoice (admin). */
export interface SubscriptionInvoice {
  id: string
  vendorId: string
  plan: VendorPlan
  periodStart: string
  periodEnd: string
  amount: number
  currency: string
  status: FeaturedPlacementStatus
  paidAt?: string | null
  createdAt: string
}

export interface ShareLink {
  url: string
  whatsappShareUrl: string
}

/** Vendor Stripe Connect onboarding/capability state (from /api/vendor/connect/status). */
export interface ConnectStatus {
  vendorId: string | null
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  canReceiveFunds: boolean
}

/** Result of starting onboarding (/api/vendor/connect/onboard). */
export interface OnboardingResult {
  url: string
  expiresAt?: string | null
  account: ConnectStatus
}

/** Start of card capture (/api/vendor/billing/card) — Stripe SetupIntent client secret. */
export interface CardSetupResult {
  clientSecret: string
  setupIntentId: string
}

/** Whether the vendor has a usable card on file for platform-fee collection. */
export interface BillingStatus {
  hasPaymentMethod: boolean
}
