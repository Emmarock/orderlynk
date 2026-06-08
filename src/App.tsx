import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Storefront from './pages/Storefront'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import TrackOrder from './pages/TrackOrder'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import SellOnOrderlynk from './pages/SellOnOrderlynk'
import Account from './pages/Account'
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorProducts from './pages/vendor/VendorProducts'
import VendorOrders from './pages/vendor/VendorOrders'
import VendorOrderDetail from './pages/vendor/VendorOrderDetail'
import VendorCustomers from './pages/vendor/VendorCustomers'
import VendorCustomerDetail from './pages/vendor/VendorCustomerDetail'
import VendorEarnings from './pages/vendor/VendorEarnings'
import VendorSettings from './pages/vendor/VendorSettings'
import VendorSupport from './pages/vendor/VendorSupport'
import VendorOnboardingReturn from './pages/vendor/VendorOnboardingReturn'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVendors from './pages/admin/AdminVendors'
import AdminOrders from './pages/admin/AdminOrders'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/vendor/:slug" element={<Storefront />} />
        <Route path="/vendor/:slug/product/:productId" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:orderId" element={<OrderConfirmation />} />
        <Route path="/track" element={<TrackOrder />} />
        <Route path="/orders" element={<TrackOrder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
