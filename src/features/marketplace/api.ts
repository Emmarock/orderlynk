import { query, request } from '@/shared/lib/http'
import type { Page, RatingSummary, Storefront, Vendor } from '@/shared/lib/types'

/** Public, platform-wide headline metrics for the home page stats strip. */
export interface PlatformStats {
  ordersProcessed: number
  verifiedVendors: number
  citiesServed: number
  /** Share of completed orders fulfilled rather than cancelled, as a percentage (0–100). */
  fulfillmentRate: number
}

/** Public product marketplace + vendor storefront and ratings. */
export const marketplaceApi = {
  marketplace: (city?: string, category?: string, page = 0, size = 20) =>
    request<Page<Vendor>>('GET', `/api/storefronts${query({ city, category, page, size })}`),
  storefront: (slug: string) => request<Storefront>('GET', `/api/storefronts/${slug}`),
  rateVendor: (slug: string, b: { stars: number; comment?: string }) =>
    request<RatingSummary>('POST', `/api/storefronts/${slug}/ratings`, b),
  myVendorRating: (slug: string) =>
    request<RatingSummary>('GET', `/api/storefronts/${slug}/ratings/mine`),
  platformStats: () => request<PlatformStats>('GET', '/api/platform/stats'),
}
