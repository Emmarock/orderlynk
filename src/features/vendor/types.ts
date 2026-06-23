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
