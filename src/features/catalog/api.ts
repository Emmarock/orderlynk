import { request, upload } from '@/shared/lib/http'
import type { Product } from '@/shared/lib/types'

/** Vendor product catalog management. */
export const catalogApi = {
  vendorProducts: () => request<Product[]>('GET', '/api/vendor/products'),
  uploadProductImage: (file: File) => upload('/api/vendor/products/image', file),
  generateProductDescription: (b: { name: string; category?: string }) =>
    request<{ description: string }>('POST', '/api/vendor/products/description', b),
  createProduct: (b: unknown) => request<Product>('POST', '/api/vendor/products', b),
  updateProduct: (id: string, b: unknown) => request<Product>('PUT', `/api/vendor/products/${id}`, b),
  toggleProduct: (id: string, active: boolean) =>
    request<Product>('PATCH', `/api/vendor/products/${id}/active?active=${active}`),
  deleteProduct: (id: string) => request<void>('DELETE', `/api/vendor/products/${id}`),
}
