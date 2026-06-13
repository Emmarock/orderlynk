import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { PageLoader } from './ui'
import type { UserRole } from '@/shared/lib/types'

export default function ProtectedRoute({
  role,
  children,
}: {
  /** When omitted, any authenticated user is allowed. */
  role?: UserRole
  children: ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
