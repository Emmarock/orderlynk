import { type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { Logo, Rail } from './ui'

function CartButton() {
  const { count } = useCart()
  return (
    <Link to="/cart" className="relative btn-ghost px-3" aria-label="Cart">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-clay px-1 text-[11px] font-bold text-cream">
          {count}
        </span>
      )}
    </Link>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const dashboardLink =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'VENDOR' ? '/vendor' : null

  return (
    <div className="flex min-h-screen flex-col">
      <Rail />
      <header className="sticky top-0 z-40 border-b border-line/70 bg-sand/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'link-underline after:w-full' : 'link-underline')}>
              Marketplace
            </NavLink>
            <NavLink to="/services" className={({ isActive }) => (isActive ? 'link-underline after:w-full' : 'link-underline')}>
              Services
            </NavLink>
            <NavLink to="/track" className={({ isActive }) => (isActive ? 'link-underline after:w-full' : 'link-underline')}>
              Track order
            </NavLink>
            {dashboardLink ? (
              <NavLink to={dashboardLink} className="link-underline">
                {user?.role === 'ADMIN' ? 'Admin console' : 'Vendor dashboard'}
              </NavLink>
            ) : (
              <NavLink to="/sell" className="link-underline">
                Sell on Orderlynk
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <CartButton />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/account" className="hidden text-sm text-muted hover:text-ink sm:inline">
                  {user.fullName.split(' ')[0]}
                </Link>
                <button
                  className="btn-ghost px-3"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-quiet hidden sm:inline-flex">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">
              Commerce rails for community-based vendors — structured orders, secure payments and
              reliable fulfillment, from WhatsApp to your doorstep.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Shop</p>
            <ul className="space-y-1.5 text-sm">
              <li><Link className="hover:text-clay" to="/">Marketplace</Link></li>
              <li><Link className="hover:text-clay" to="/services">Book a service</Link></li>
              <li><Link className="hover:text-clay" to="/track">Track an order</Link></li>
              <li><Link className="hover:text-clay" to="/bookings/track">Track a booking</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Vendors</p>
            <ul className="space-y-1.5 text-sm">
              <li><Link className="hover:text-clay" to="/sell">Sell on Orderlynk</Link></li>
              <li><Link className="hover:text-clay" to="/login">Vendor sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} Orderlynk · Built for African &amp; diaspora commerce
        </div>
      </footer>
    </div>
  )
}
