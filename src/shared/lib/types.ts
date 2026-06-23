// Cross-cutting types shared across features (enum unions + account/address primitives), plus a
// barrel that re-exports each feature's own types so `@/shared/lib/types` stays a single import.
// Feature interfaces live in features/<domain>/types.ts and import the enums below from here; the
// barrel is type-only, so there is no runtime cycle.

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

/** A catalogue-matched line in a chat-parsed draft order; `confidence` is 0–1. */
export interface DraftLine {
  productId: string
  productName: string
  quantity: number
  confidence: number
}

/** Structured draft extracted from a pasted chat thread (advisory — vendor reviews before creating). */
export interface DraftOrder {
  items: DraftLine[]
  unmatched: string[]
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  fulfillmentType: FulfillmentType | null
  customerHouseNumber: string | null
  customerStreet: string | null
  customerCity: string | null
  customerState: string | null
  customerPostcode: string | null
  customerCountry: string | null
  notes: string | null
}

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

/**
 * One page of a paginated list endpoint. Mirrors the backend `PageResponse<T>` envelope: `content`
 * is the rows for this page, the rest is the metadata the "load more" UI needs.
 */
export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

// ---- Feature-owned types (barrel) ----
export * from '@/features/catalog/types'
export * from '@/features/order/types'
export * from '@/features/vendor/types'
export * from '@/features/booking/types'
export * from '@/features/batch/types'
