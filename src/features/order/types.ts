import type { FulfillmentStatus, FulfillmentType, PaymentStatus, SourceChannel } from '@/shared/lib/types'

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
