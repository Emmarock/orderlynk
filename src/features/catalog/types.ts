import type { DimensionUnit, FulfillmentType, ProductCategory, WeightUnit } from '@/shared/lib/types'
import type { Vendor } from '@/features/vendor/types'
import type { BatchCard, ServiceOffering } from '@/shared/lib/types'

export interface Product {
  id: string
  vendorId: string
  name: string
  description?: string
  category: ProductCategory
  price: number
  discountPercent: number
  discountedPrice: number
  /** VAT rate for this product as a percentage (0–100) of the discounted price; 0 = no VAT. */
  vatRatePercent: number
  currency: string
  quantityAvailable: number
  lowStockThreshold: number
  lowStock: boolean
  productImageUrl?: string
  imageUrls?: string[]
  videoUrl?: string
  /** Selectable colour options (e.g. clothing). Empty/absent means no colour choice. */
  colors?: string[]
  /** Selectable size options (e.g. S/M/L). Empty/absent means no size choice. */
  sizes?: string[]
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
  services: ServiceOffering[]
  batches: BatchCard[]
}
