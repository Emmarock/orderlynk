import { request } from '@/shared/lib/http'
import type { Address, AuthResponse, CustomerAddress } from '@/shared/lib/types'

/** Auth, profile and the customer address book. */
export const identityApi = {
  register: (b: { fullName: string; email: string; password: string; confirmPassword: string; phone?: string; city?: string; country?: string; address?: Address }) =>
    request<AuthResponse>('POST', '/api/auth/register', b),
  login: (b: { email: string; password: string }) =>
    request<AuthResponse>('POST', '/api/auth/login', b),
  me: () => request<AuthResponse>('GET', '/api/auth/me'),
  changePassword: (b: { currentPassword: string; newPassword: string }) =>
    request<void>('POST', '/api/auth/change-password', b),
  verifyEmail: (token: string) => request<void>('POST', '/api/auth/verify-email', { token }),
  resendVerification: () => request<void>('POST', '/api/auth/resend-verification'),
  forgotPassword: (email: string) => request<void>('POST', '/api/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    request<void>('POST', '/api/auth/reset-password', { token, newPassword }),
  updateProfile: (b: { fullName: string; phone?: string; city?: string; country?: string }) =>
    request<AuthResponse>('PUT', '/api/auth/profile', b),
  changeEmail: (b: { newEmail: string; currentPassword: string }) =>
    request<AuthResponse>('POST', '/api/auth/change-email', b),
  customerAddresses: () => request<CustomerAddress[]>('GET', '/api/account/addresses'),
  addCustomerAddress: (b: { label?: string; address: Address; makeDefault?: boolean }) =>
    request<CustomerAddress>('POST', '/api/account/addresses', b),
  updateCustomerAddress: (id: string, b: { label?: string; address: Address; makeDefault?: boolean }) =>
    request<CustomerAddress>('PUT', `/api/account/addresses/${id}`, b),
  setDefaultAddress: (id: string) => request<CustomerAddress>('POST', `/api/account/addresses/${id}/default`),
  deleteCustomerAddress: (id: string) => request<void>('DELETE', `/api/account/addresses/${id}`),
}
