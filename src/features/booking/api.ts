import { query, request, upload } from '@/shared/lib/http'
import type {
  AvailabilityRule, BlockedSlot, Booking, BookingPayment, DayAvailability, Page, PaymentInit,
  ProviderCard, Review, ServiceAddOn, ServiceOffering, ServiceProviderProfile, ServiceStorefront,
  ServiceVariant, StaffMember,
} from '@/shared/lib/types'

/** Service Provider Booking: public discovery + customer bookings, and the vendor services console. */
export const bookingApi = {
  // ---- public discovery + customer bookings ----
  serviceMarketplace: (opts?: { category?: string; city?: string; acceptsDeposits?: boolean }, page = 0, size = 20) =>
    request<Page<ProviderCard>>('GET', `/api/services${query({ category: opts?.category, city: opts?.city, acceptsDeposits: opts?.acceptsDeposits || undefined, page, size })}`),
  serviceStorefront: (slug: string) => request<ServiceStorefront>('GET', `/api/services/${slug}`),
  bookingAvailability: (serviceId: string, date: string, staffId?: string) =>
    request<DayAvailability>('GET', `/api/bookings/availability${query({ serviceId, date, staffId })}`),
  createBooking: (b: unknown) => request<Booking>('POST', '/api/bookings', b),
  trackBooking: (publicBookingId: string, contact: string) =>
    request<Booking>('POST', '/api/bookings/track', { publicBookingId, contact }),
  payBooking: (publicBookingId: string, contact?: string) =>
    request<PaymentInit>('POST', `/api/bookings/${publicBookingId}/pay`, { contact }),
  myBookings: (page = 0, size = 20) => request<Page<Booking>>('GET', `/api/bookings/mine${query({ page, size })}`),
  reviewBooking: (publicBookingId: string, b: { rating: number; comment?: string }, contact?: string) =>
    request<Review>('POST', `/api/bookings/${publicBookingId}/review${contact ? `?contact=${encodeURIComponent(contact)}` : ''}`, b),

  // ---- vendor: services module ----
  serviceProfile: () => request<ServiceProviderProfile>('GET', '/api/vendor/service-profile'),
  updateServiceProfile: (b: unknown) => request<ServiceProviderProfile>('PUT', '/api/vendor/service-profile', b),
  vendorServices: (page = 0, size = 20) => request<Page<ServiceOffering>>('GET', `/api/vendor/services${query({ page, size })}`),
  uploadServiceImage: (file: File) => upload('/api/vendor/services/image', file),
  createService: (b: unknown) => request<ServiceOffering>('POST', '/api/vendor/services', b),
  updateService: (id: string, b: unknown) => request<ServiceOffering>('PUT', `/api/vendor/services/${id}`, b),
  toggleService: (id: string, active: boolean) =>
    request<ServiceOffering>('PATCH', `/api/vendor/services/${id}/active?active=${active}`),
  deleteService: (id: string) => request<void>('DELETE', `/api/vendor/services/${id}`),
  addServiceAddOn: (serviceId: string, b: unknown) =>
    request<ServiceAddOn>('POST', `/api/vendor/services/${serviceId}/add-ons`, b),
  updateServiceAddOn: (serviceId: string, addOnId: string, b: unknown) =>
    request<ServiceAddOn>('PUT', `/api/vendor/services/${serviceId}/add-ons/${addOnId}`, b),
  deleteServiceAddOn: (serviceId: string, addOnId: string) =>
    request<void>('DELETE', `/api/vendor/services/${serviceId}/add-ons/${addOnId}`),
  addServiceVariant: (serviceId: string, b: unknown) =>
    request<ServiceVariant>('POST', `/api/vendor/services/${serviceId}/variants`, b),
  updateServiceVariant: (serviceId: string, variantId: string, b: unknown) =>
    request<ServiceVariant>('PUT', `/api/vendor/services/${serviceId}/variants/${variantId}`, b),
  deleteServiceVariant: (serviceId: string, variantId: string) =>
    request<void>('DELETE', `/api/vendor/services/${serviceId}/variants/${variantId}`),
  // Availability rules & blocked slots are shop-wide by default; pass a staffId to scope to one
  // worker's personal calendar (the add/update body also carries staffId for the backend).
  availabilityRules: (staffId?: string) =>
    request<AvailabilityRule[]>('GET', `/api/vendor/availability${query({ staffId })}`),
  addAvailabilityRule: (b: unknown) => request<AvailabilityRule>('POST', '/api/vendor/availability', b),
  updateAvailabilityRule: (id: string, b: unknown) =>
    request<AvailabilityRule>('PUT', `/api/vendor/availability/${id}`, b),
  deleteAvailabilityRule: (id: string) => request<void>('DELETE', `/api/vendor/availability/${id}`),
  blockedSlots: (staffId?: string) =>
    request<BlockedSlot[]>('GET', `/api/vendor/blocked-slots${query({ staffId })}`),
  addBlockedSlot: (b: unknown) => request<BlockedSlot>('POST', '/api/vendor/blocked-slots', b),
  deleteBlockedSlot: (id: string) => request<void>('DELETE', `/api/vendor/blocked-slots/${id}`),

  // ---- vendor: team members (staff) ----
  vendorStaff: () => request<StaffMember[]>('GET', '/api/vendor/staff'),
  createStaff: (b: unknown) => request<StaffMember>('POST', '/api/vendor/staff', b),
  updateStaff: (id: string, b: unknown) => request<StaffMember>('PUT', `/api/vendor/staff/${id}`, b),
  toggleStaff: (id: string, active: boolean) =>
    request<StaffMember>('PATCH', `/api/vendor/staff/${id}/active?active=${active}`),
  deleteStaff: (id: string) => request<void>('DELETE', `/api/vendor/staff/${id}`),
  uploadStaffImage: (file: File) => upload('/api/vendor/staff/image', file),

  // ---- vendor: booking dashboard ----
  vendorBookings: (from?: string, to?: string, page = 0, size = 20) =>
    request<Page<Booking>>('GET', `/api/vendor/bookings${query({ from, to, page, size })}`),
  vendorBooking: (id: string) => request<Booking>('GET', `/api/vendor/bookings/${id}`),
  vendorCustomerBookings: (phone: string) =>
    request<Booking[]>('GET', `/api/vendor/customers/${encodeURIComponent(phone)}/bookings`),
  approveBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/approve`),
  rejectBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/vendor/bookings/${id}/reject`, { reason }),
  rescheduleBooking: (id: string, appointmentStart: string) =>
    request<Booking>('POST', `/api/vendor/bookings/${id}/reschedule`, { appointmentStart }),
  cancelBooking: (id: string, reason?: string) =>
    request<Booking>('POST', `/api/vendor/bookings/${id}/cancel`, { reason }),
  startBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/start`),
  completeBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/complete`),
  noShowBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/no-show`),
  closeBooking: (id: string) => request<Booking>('POST', `/api/vendor/bookings/${id}/close`),
  bookingPayments: (id: string) => request<BookingPayment[]>('GET', `/api/vendor/bookings/${id}/payments`),
  recordBookingPayment: (id: string, b: unknown) =>
    request<BookingPayment>('POST', `/api/vendor/bookings/${id}/payments`, b),
  vendorReviews: () => request<Review[]>('GET', '/api/vendor/reviews'),
}
