import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

export interface ConsoleTab {
  to: string
  label: string
}

export function ConsoleShell({
  title,
  subtitle,
  tabs,
  actions,
  children,
}: {
  title: string
  subtitle?: string
  tabs: ConsoleTab[]
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Console</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {actions}
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-clay text-clay-dark'
                  : 'border-transparent text-muted hover:text-ink'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="py-8">{children}</div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export const VENDOR_TABS: ConsoleTab[] = [
  { to: '/vendor', label: 'Overview' },
  { to: '/vendor/manage/products', label: 'Products' },
  { to: '/vendor/manage/orders', label: 'Orders' },
  { to: '/vendor/manage/services', label: 'Services' },
  { to: '/vendor/manage/bookings', label: 'Bookings' },
  { to: '/vendor/manage/batches', label: 'Batch & Cargo' },
  { to: '/vendor/manage/customers', label: 'Customers' },
  { to: '/vendor/manage/earnings', label: 'Earnings' },
  { to: '/vendor/manage/settings', label: 'Settings' },
  { to: '/vendor/manage/support', label: 'Support' },
]

export const ADMIN_TABS: ConsoleTab[] = [
  { to: '/admin', label: 'Overview' },
  { to: '/admin/vendors', label: 'Vendors' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/batches', label: 'Batches' },
  { to: '/admin/fees', label: 'Fees' },
  { to: '/admin/vat', label: 'VAT' },
  { to: '/admin/subscriptions', label: 'Subscriptions' },
  { to: '/admin/promotions', label: 'Promotions' },
]
