// Aggregates every feature's api slice into the single `api` object the app uses (`api.checkout()`,
// `api.createBatch()`, …). Each slice lives in its feature (features/<domain>/api.ts) over the shared
// http helpers. Method names are unique across slices, so the spread is collision-free.
import { identityApi } from '@/features/identity/api'
import { marketplaceApi } from '@/features/marketplace/api'
import { catalogApi } from '@/features/catalog/api'
import { orderApi } from '@/features/order/api'
import { vendorApi } from '@/features/vendor/api'
import { bookingApi } from '@/features/booking/api'
import { batchApi } from '@/features/batch/api'
import { adminApi } from '@/features/admin/api'
import { metaApi } from '@/shared/lib/meta'

export const api = {
  ...identityApi,
  ...marketplaceApi,
  ...catalogApi,
  ...orderApi,
  ...vendorApi,
  ...bookingApi,
  ...batchApi,
  ...adminApi,
  ...metaApi,
}

export { ApiError, apiMessage, tokenStore } from '@/shared/lib/http'
