import type { FulfillmentType, PaymentStatus, SourceChannel } from '@/shared/lib/types'

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
  platformCargoFee: number
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
