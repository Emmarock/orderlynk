import type { DimensionUnit, FulfillmentType, ProductCategory, WeightUnit } from '@/shared/lib/types'
import type { Vendor } from '@/features/vendor/types'

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
