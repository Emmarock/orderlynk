// Mirrors the backend DTOs (com.myorderlynk.app.dto.*).

export type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'LOGISTICS_PARTNER'

export type FulfillmentType =
  | 'LOCAL_PICKUP'
  | 'LOCAL_DELIVERY'
  | 'DOMESTIC_SHIPPING'
  | 'IMPORT_BATCH'
  | 'EXPORT_BATCH'

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

export type PaymentMethod =
  | 'CARD'
  | 'INTERAC_ETRANSFER'
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'STRIPE'
  | 'OTHER'

export type FulfillmentStatus =
  | 'ORDER_RECEIVED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'VENDOR_CONFIRMED'
  | 'ASSIGNED_TO_BATCH'
  | 'SOURCING'
  | 'PREPARING'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type VendorStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'

export type ProductCategory =
  | 'GROCERIES'
  | 'BEAUTY'
  | 'FASHION'
  | 'HOUSEHOLD'
  | 'ELECTRONICS'
  | 'BABY_AND_KIDS'
  | 'EVENT_ITEMS'
  | 'OTHER'

export type SourceChannel = 'WHATSAPP' | 'INSTAGRAM' | 'MARKETPLACE' | 'VENDOR_LINK' | 'MANUAL'

export interface AuthResponse {
  token: string | null
  userId: string
  fullName: string
  email: string
  role: UserRole
  vendorId: string | null
}

export interface Vendor {
  id: string
  businessName: string
  description?: string
  city?: string
  country?: string
  whatsappNumber?: string
  instagramHandle?: string
  logoUrl?: string
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
  notifyByEmail: boolean
  notifyByWhatsapp: boolean
  lowStockAlerts: boolean
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
  grossRevenue: number
  uniqueCustomers: number
  topCustomers: CustomerSummary[]
  topProducts: ProductSalesSummary[]
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

export interface Product {
  id: string
  vendorId: string
  name: string
  description?: string
  category: ProductCategory
  price: number
  currency: string
  quantityAvailable: number
  lowStockThreshold: number
  lowStock: boolean
  productImageUrl?: string
  fulfillmentType: FulfillmentType
  originCountry?: string
  availableNow: boolean
  batchId?: string
  active: boolean
}

export interface Storefront {
  vendor: Vendor
  products: Product[]
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface PaymentInstructions {
  method: string
  accountName?: string
  bankName?: string
  accountNumber?: string
  email?: string
}

export interface Order {
  id: string
  publicOrderId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  customerCity?: string
  vendorId: string
  vendorName: string
  items: OrderItem[]
  productSubtotal: number
  logisticsFee: number
  platformFee: number
  processingFee: number
  totalAmount: number
  vendorPayable: number
  logisticsPayable: number
  platformRevenue: number
  refundedAmount: number
  currency: string
  paymentStatus: PaymentStatus
  fulfillmentType: FulfillmentType
  fulfillmentStatus: FulfillmentStatus
  fulfillmentFlow: FulfillmentStatus[]
  pickupCode?: string
  sourceChannel: SourceChannel
  campaign?: string
  notes?: string
  createdAt: string
  paymentInstructions?: PaymentInstructions | null
}

export interface Quote {
  productSubtotal: number
  logisticsFee: number
  platformFee: number
  processingFee: number
  totalAmount: number
  currency: string
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
