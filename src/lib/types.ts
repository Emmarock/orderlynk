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

export type WeightUnit = 'G' | 'KG' | 'OZ' | 'LB'

export type DimensionUnit = 'MM' | 'CM' | 'M' | 'IN' | 'FT' | 'YD'

export interface AuthResponse {
  token: string | null
  userId: string
  fullName: string
  email: string
  role: UserRole
  vendorId: string | null
  emailVerified: boolean
}

export interface Address {
  houseNumber?: string
  street?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
}

export interface CustomerAddress {
  id: string
  label?: string
  address: Address
  isDefault: boolean
}

// An address-autocomplete suggestion: the structured parts plus a display label and 0–1 confidence.
export interface AddressSuggestion extends Address {
  formatted: string
  confidence?: number
}

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
  discountPercent: number
  discountedPrice: number
  currency: string
  quantityAvailable: number
  lowStockThreshold: number
  lowStock: boolean
  productImageUrl?: string
  fulfillmentType: FulfillmentType
  originCountry?: string
  weight?: number | null
  weightUnit: WeightUnit
  length?: number | null
  width?: number | null
  height?: number | null
  dimensionUnit: DimensionUnit
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
  customerHouseNumber?: string
  customerStreet?: string
  customerCity?: string
  customerState?: string
  customerPostcode?: string
  customerCountry?: string
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
  trackToken?: string | null
  // Present only on the checkout response when card payment is initiated.
  clientSecret?: string | null
  paymentReference?: string | null
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

export interface Quote {
  productSubtotal: number
  logisticsFee: number
  platformFee: number
  processingFee: number
  totalAmount: number
  currency: string
  /** True when logisticsFee came from a live carrier rate (vs the flat per-fulfillment fee). */
  liveShippingRate: boolean
  shippingCarrier?: string | null
  shippingService?: string | null
  shippingServiceToken?: string | null
  shippingEstimatedDays?: number | null
}

/** One selectable carrier rate option for shipping. Select by serviceToken. */
export interface RateOption {
  rateId: string
  carrier: string
  serviceLevel: string
  serviceToken: string
  amount: number
  currency: string
  estimatedDays?: number | null
  durationTerms?: string | null
  providerImageUrl?: string | null
}

export interface RateQuoteResponse {
  currency: string
  rates: RateOption[]
}

export type ShipmentStatus =
  | 'RATED'
  | 'PURCHASED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILED'
  | 'CANCELLED'
  | 'UNKNOWN'

export interface Shipment {
  id: string
  orderId: string
  provider: string
  status: ShipmentStatus
  carrier?: string | null
  serviceLevel?: string | null
  serviceToken?: string | null
  amount?: number | null
  currency?: string | null
  estimatedDays?: number | null
  trackingNumber?: string | null
  trackingUrl?: string | null
  labelUrl?: string | null
  trackingStatusDetail?: string | null
  eta?: string | null
  createdAt: string
}

export interface TrackingEvent {
  status: ShipmentStatus
  statusDetails?: string | null
  location?: string | null
  occurredAt?: string | null
}

export interface TrackingResponse {
  carrier?: string | null
  trackingNumber?: string | null
  status: ShipmentStatus
  eta?: string | null
  events: TrackingEvent[]
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

// ---- Service Provider Booking module (com.myorderlynk.app.booking.*) ----

export type BookingStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'APPROVED'
  | 'DEPOSIT_PENDING'
  | 'CONFIRMED'
  | 'REMINDER_SENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BALANCE_PENDING'
  | 'CLOSED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'REJECTED'

export type ApprovalMode = 'MANUAL' | 'AUTO'

export type DepositType = 'NONE' | 'FIXED' | 'PERCENTAGE' | 'FULL'

export type ServiceLocationType = 'AT_PROVIDER' | 'CUSTOMER_LOCATION' | 'REMOTE'

export type BookingPaymentType = 'DEPOSIT' | 'BALANCE' | 'FULL' | 'REFUND'

export type ServiceCategory =
  | 'HAIR'
  | 'NAILS'
  | 'BARBER'
  | 'MAKEUP'
  | 'SPA_AND_MASSAGE'
  | 'PHOTOGRAPHY'
  | 'CLEANING'
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'HANDYMAN'
  | 'AUTOMOTIVE'
  | 'FITNESS'
  | 'TUTORING'
  | 'EVENTS'
  | 'OTHER'

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface ServiceProviderProfile {
  id: string
  vendorId: string
  serviceEnabled: boolean
  bio?: string
  serviceArea?: string
  locationType: ServiceLocationType
  approvalMode: ApprovalMode
  cancellationPolicy?: string
  depositPolicy?: string
  businessHoursSummary?: string
  leadTimeHours: number
  bufferMinutes: number
  maxAdvanceDays: number
  defaultCapacity: number
  slotHoldMinutes: number
  timezone: string
}

export interface ServiceAddOn {
  id: string
  serviceId: string
  name: string
  priceDelta: number
  durationDelta: number
  required: boolean
  maxSelection: number
  active: boolean
}

export interface ServiceOffering {
  id: string
  vendorId: string
  name: string
  category: ServiceCategory
  description?: string
  basePrice: number
  currency: string
  durationMinutes: number
  imageUrl?: string
  depositType: DepositType
  depositValue?: number | null
  depositAmount: number
  taxRate: number
  active: boolean
  addOns: ServiceAddOn[]
}

export interface AvailabilityRule {
  id: string
  vendorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  capacity?: number | null
  bufferMinutes?: number | null
  leadTimeHours?: number | null
  active: boolean
}

export interface BlockedSlot {
  id: string
  vendorId: string
  startDatetime: string
  endDatetime: string
  reason?: string
}

export interface Slot {
  start: string
  end: string
  remainingCapacity: number
}

export interface DayAvailability {
  serviceId: string
  date: string
  durationMinutes: number
  slots: Slot[]
}

export interface BookingAddOn {
  addOnId: string
  name: string
  priceDelta: number
  durationDelta: number
  quantity: number
}

export interface Review {
  id: string
  bookingId: string
  vendorId: string
  serviceId?: string
  rating: number
  comment?: string
  createdAt: string
}

export interface BookingPayment {
  id: string
  bookingId: string
  paymentType: BookingPaymentType
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  transactionReference?: string
  paidAt?: string
}

export interface Booking {
  id: string
  publicBookingId: string
  customerUserId?: string | null
  customerName: string
  customerPhone: string
  customerEmail?: string
  vendorId: string
  vendorName: string
  serviceId: string
  serviceName: string
  addOns: BookingAddOn[]
  appointmentStart: string
  appointmentEnd: string
  status: BookingStatus
  approvalMode: ApprovalMode
  locationType: ServiceLocationType
  customerHouseNumber?: string
  customerStreet?: string
  customerCity?: string
  customerState?: string
  customerPostcode?: string
  customerCountry?: string
  servicePrice: number
  taxAmount: number
  totalAmount: number
  depositType: DepositType
  depositAmount: number
  amountPaid: number
  balanceDue: number
  refundedAmount: number
  currency: string
  paymentStatus: PaymentStatus
  holdExpiresAt?: string | null
  sourceChannel: SourceChannel
  notes?: string
  statusReason?: string
  createdAt: string
  review?: Review | null
  // Present only on the create response when a deposit card payment was initiated.
  clientSecret?: string | null
  paymentReference?: string | null
}

/** Card-payment kickoff for a booking deposit/balance (POST /api/bookings/{id}/pay). */
export interface PaymentInit {
  publicBookingId: string
  clientSecret: string
  paymentReference: string
  amount: number
  currency: string
}

export interface ProviderCard {
  vendorId: string
  businessName: string
  storeSlug: string
  logoUrl?: string
  bannerUrl?: string
  city?: string
  serviceArea?: string
  locationType?: ServiceLocationType
  rating?: number | null
  ratingCount: number
  startingPrice?: number | null
  currency: string
  categories: ServiceCategory[]
  acceptsDeposits: boolean
}

export interface ServiceStorefront {
  vendorId: string
  businessName: string
  storeSlug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  city?: string
  whatsappNumber?: string
  instagramHandle?: string
  profile: ServiceProviderProfile
  rating?: number | null
  ratingCount: number
  services: ServiceOffering[]
  reviews: Review[]
}

// ---- Batch & Cargo module (com.myorderlynk.app.batch.*) ----

export type BatchType = 'PRODUCT_BATCH' | 'CARGO_BATCH' | 'HYBRID_BATCH'

export type ShippingMethod = 'AIR_CARGO' | 'SEA_CARGO' | 'DOMESTIC' | 'OTHER'

export type BatchVisibility = 'DRAFT' | 'PRIVATE_LINK' | 'MARKETPLACE'

export type BatchProductStatus = 'AVAILABLE' | 'SOLD_OUT' | 'HIDDEN'

export type BatchStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'CLOSING_SOON'
  | 'CLOSED'
  | 'SOURCING'
  | 'CONSOLIDATING'
  | 'AT_CARGO_PARTNER'
  | 'SHIPPED'
  | 'ARRIVED'
  | 'CLEARED'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'DELAYED'

export type BatchOrderStatus =
  | 'ORDER_RECEIVED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'ASSIGNED_TO_BATCH'
  | 'SOURCING'
  | 'PACKED'
  | 'SHIPPED'
  | 'ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export type ShipmentRequestStatus =
  | 'REQUEST_CREATED'
  | 'AWAITING_DROP_OFF'
  | 'RECEIVED_AT_COLLECTION'
  | 'WEIGHED'
  | 'INVOICE_GENERATED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'ADDED_TO_BATCH'
  | 'SHIPPED'
  | 'ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Batch {
  id: string
  vendorId: string
  vendorName: string
  batchName: string
  batchType: BatchType
  route?: string
  originCountry?: string
  originCity?: string
  destinationCountry?: string
  destinationCity?: string
  shippingMethod?: ShippingMethod
  openDate?: string
  closeDate?: string
  estimatedDeparture?: string
  estimatedArrival?: string
  ratePerKg?: number | null
  handlingFee?: number
  currency: string
  pickupLocation?: string
  collectionPoints: string[]
  batchStatus: BatchStatus
  visibility: BatchVisibility
  notes?: string
  openForOrders: boolean
}

export interface BatchSummary {
  batch: Batch
  orderCount: number
  paidOrderCount: number
  shipmentRequestCount: number
  revenue: number
  pendingPayments: number
}

export interface BatchProduct {
  id: string
  batchId: string
  productId: string
  name: string
  imageUrl?: string
  description?: string
  batchPrice: number
  currency: string
  quantityLimit: number
  soldQuantity: number
  remaining?: number | null
  minOrderQuantity: number
  status: BatchProductStatus
  batchNotes?: string
}

export interface BatchCard {
  id: string
  vendorId: string
  vendorName: string
  storeSlug?: string
  batchName: string
  batchType: BatchType
  route?: string
  originCountry?: string
  destinationCity?: string
  shippingMethod?: ShippingMethod
  closeDate?: string
  estimatedArrival?: string
  ratePerKg?: number | null
  currency: string
  productCount: number
  acceptsShipmentRequests: boolean
  openForOrders: boolean
}

export interface PublicBatch {
  batch: Batch
  storeSlug?: string
  vendorWhatsapp?: string
  products: BatchProduct[]
}

export interface BatchOrderItem {
  batchProductId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface BatchOrder {
  id: string
  publicOrderId: string
  batchId: string
  batchName: string
  vendorId: string
  vendorName: string
  customerUserId?: string | null
  customerName: string
  customerPhone: string
  customerEmail?: string
  items: BatchOrderItem[]
  fulfillmentType: FulfillmentType
  customerHouseNumber?: string
  customerStreet?: string
  customerCity?: string
  customerState?: string
  customerPostcode?: string
  customerCountry?: string
  productSubtotal: number
  deliveryFee: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  refundedAmount: number
  currency: string
  paymentStatus: PaymentStatus
  status: BatchOrderStatus
  sourceChannel: SourceChannel
  pickupCode?: string
  notes?: string
  createdAt: string
  clientSecret?: string | null
  paymentReference?: string | null
}

export interface ShipmentRequest {
  id: string
  publicRequestId: string
  batchId: string
  batchName: string
  vendorId: string
  vendorName: string
  customerUserId?: string | null
  customerName: string
  customerPhone: string
  customerEmail?: string
  itemDescription: string
  packageCount: number
  estimatedWeight?: number | null
  actualWeight?: number | null
  ratePerKg: number
  handlingFee: number
  deliveryFee: number
  totalCharge: number
  amountPaid: number
  balanceDue: number
  refundedAmount: number
  currency: string
  declaredValue?: number | null
  restrictedItemsConfirmed: boolean
  originDropOffLocation?: string
  destinationLocation?: string
  deliveryPreference?: string
  paymentStatus: PaymentStatus
  status: ShipmentRequestStatus
  sourceChannel: SourceChannel
  pickupCode?: string
  notes?: string
  createdAt: string
  clientSecret?: string | null
  paymentReference?: string | null
}

/** Card-payment kickoff for a batch order / shipment request (POST .../pay). */
export interface BatchPaymentInit {
  publicId: string
  clientSecret: string
  paymentReference: string
  amount: number
  currency: string
}
