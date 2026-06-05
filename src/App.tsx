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
import SellOnOrderlynk from './pages/SellOnOrderlynk'
import Account from './pages/Account'
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorProducts from './pages/vendor/VendorProducts'
import VendorOrders from './pages/vendor/VendorOrders'
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
