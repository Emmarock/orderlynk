import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from '@/shared/components/Layout'
import ProtectedRoute from '@/shared/components/ProtectedRoute'
import Landing from '@/features/marketplace/pages/Landing'
import HomeKojo from '@/features/marketplace/pages/HomeKojo'
import HomeApple from '@/features/marketplace/pages/HomeApple'
import HomeStripe from '@/features/marketplace/pages/HomeStripe'
import HomeLinear from '@/features/marketplace/pages/HomeLinear'
import HomeAirbnb from '@/features/marketplace/pages/HomeAirbnb'
import HomePreviews from '@/features/marketplace/pages/HomePreviews'
import Storefront from '@/features/marketplace/pages/Storefront'
import Services from '@/features/booking/pages/Services'
import ServiceProvider from '@/features/booking/pages/ServiceProvider'
import TrackBooking from '@/features/booking/pages/TrackBooking'
import Batches from '@/features/batch/pages/Batches'
import BatchPage from '@/features/batch/pages/BatchPage'
import BatchTracking from '@/features/batch/pages/BatchTracking'
import ProductDetail from '@/features/catalog/pages/ProductDetail'
import Cart from '@/features/order/pages/Cart'
import Checkout from '@/features/order/pages/Checkout'
import OrderConfirmation from '@/features/order/pages/OrderConfirmation'
import TrackOrder from '@/features/order/pages/TrackOrder'
import PayOrder from '@/features/order/pages/PayOrder'
import Login from '@/features/identity/pages/Login'
import Register from '@/features/identity/pages/Register'
import VerifyEmail from '@/features/identity/pages/VerifyEmail'
import ForgotPassword from '@/features/identity/pages/ForgotPassword'
import ResetPassword from '@/features/identity/pages/ResetPassword'
import AcceptInvite from '@/features/identity/pages/AcceptInvite'
import SellOnOrderlynk from '@/features/identity/pages/SellOnOrderlynk'
import Account from '@/features/identity/pages/Account'
import CustomerDashboard from '@/features/identity/pages/CustomerDashboard'
import VendorDashboard from '@/features/vendor/pages/VendorDashboard'
import VendorProducts from '@/features/catalog/pages/VendorProducts'
import VendorServices from '@/features/booking/pages/VendorServices'
import VendorBookings from '@/features/booking/pages/VendorBookings'
import VendorBatches from '@/features/batch/pages/VendorBatches'
import VendorBatchDetail from '@/features/batch/pages/VendorBatchDetail'
import VendorOrders from '@/features/order/pages/VendorOrders'
import VendorOrderDetail from '@/features/order/pages/VendorOrderDetail'
import VendorCustomers from '@/features/vendor/pages/VendorCustomers'
import VendorCustomerDetail from '@/features/vendor/pages/VendorCustomerDetail'
import VendorEarnings from '@/features/vendor/pages/VendorEarnings'
import VendorSettings from '@/features/vendor/pages/VendorSettings'
import VendorSupport from '@/features/vendor/pages/VendorSupport'
import VendorOnboardingReturn from '@/features/vendor/pages/VendorOnboardingReturn'
import AdminDashboard from '@/features/admin/pages/AdminDashboard'
import AdminVendors from '@/features/admin/pages/AdminVendors'
import AdminOrders from '@/features/admin/pages/AdminOrders'
import AdminBookings from '@/features/admin/pages/AdminBookings'
import AdminBatches from '@/features/admin/pages/AdminBatches'
import AdminFeeSettings from '@/features/admin/pages/AdminFeeSettings'
import AdminVat from '@/features/admin/pages/AdminVat'
import AdminSubscriptions from '@/features/admin/pages/AdminSubscriptions'
import AdminPromotions from '@/features/admin/pages/AdminPromotions'
import NotFound from '@/shared/components/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  // Block body (not an expression arrow) so the effect returns undefined.
  // `() => window.scrollTo(0, 0)` would return whatever scrollTo() returns;
  // some browser extensions / smooth-scroll polyfills override scrollTo to
  // return a non-undefined value, which React then tries to invoke as the
  // effect's cleanup ("destroy is not a function"), crashing on every route
  // change since this runs on each navigation.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <Routes>
      {/* Standalone "KojoForex-style" home preview — renders its own nav/footer
          outside the global Layout. The dark/gold theme it pioneered is now the
          app-wide default; these /preview routes remain for design reference. */}
      <Route
        path="/preview"
        element={
          <>
            <ScrollToTop />
            <HomeKojo />
          </>
        }
      />
      <Route
        path="/preview/apple"
        element={
          <>
            <ScrollToTop />
            <HomeApple />
          </>
        }
      />
      <Route
        path="/preview/stripe"
        element={
          <>
            <ScrollToTop />
            <HomeStripe />
          </>
        }
      />
      <Route
        path="/preview/linear"
        element={
          <>
            <ScrollToTop />
            <HomeLinear />
          </>
        }
      />
      <Route
        path="/preview/airbnb"
        element={
          <>
            <ScrollToTop />
            <HomeAirbnb />
          </>
        }
      />
      <Route
        path="/previews"
        element={
          <>
            <ScrollToTop />
            <HomePreviews />
          </>
        }
      />
      <Route path="*" element={<MainApp />} />
    </Routes>
  )
}

function MainApp() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceProvider />} />
        <Route path="/bookings/track" element={<TrackBooking />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/batches/track" element={<BatchTracking />} />
        <Route path="/batches/:id" element={<BatchPage />} />
        <Route path="/vendor/:slug" element={<Storefront />} />
        <Route path="/vendor/:slug/product/:productId" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderId" element={<OrderConfirmation />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/orders" element={<TrackOrder />} />
        <Route path="/pay" element={<PayOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/sell" element={<SellOnOrderlynk />} />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/products"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/services"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/bookings"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/batches"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorBatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/batches/:id"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorBatchDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/orders"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/orders/:id"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorOrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/customers"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/customers/:phone"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorCustomerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/earnings"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/settings"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/manage/support"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorSupport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/onboarding/complete"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorOnboardingReturn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendor/onboarding/refresh"
          element={
            <ProtectedRoute role="VENDOR">
              <VendorOnboardingReturn />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vendors"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminVendors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/batches"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminBatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminFeeSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vat"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminVat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminSubscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/promotions"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminPromotions />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
