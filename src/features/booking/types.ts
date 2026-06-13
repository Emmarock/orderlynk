import type { PaymentMethod, PaymentStatus, SourceChannel } from '@/shared/lib/types'

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
