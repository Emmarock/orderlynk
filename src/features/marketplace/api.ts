import { request } from '@/shared/lib/http'
import type { RatingSummary, Storefront, Vendor } from '@/shared/lib/types'

/** Public product marketplace + vendor storefront and ratings. */
export const marketplaceApi = {
  marketplace: (city?: string, category?: string) => {
    const qs = new URLSearchParams()
    if (city) qs.set('city', city)
    if (category) qs.set('category', category)
    const suffix = qs.toString()
    return request<Vendor[]>('GET', `/api/storefronts${suffix ? `?${suffix}` : ''}`)
  },
  storefront: (slug: string) => request<Storefront>('GET', `/api/storefronts/${slug}`),
  rateVendor: (slug: string, b: { stars: number; comment?: string }) =>
    request<RatingSummary>('POST', `/api/storefronts/${slug}/ratings`, b),
  myVendorRating: (slug: string) =>
    request<RatingSummary>('GET', `/api/storefronts/${slug}/ratings/mine`),
}
