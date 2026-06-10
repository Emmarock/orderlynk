import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../lib/api'
import type { AuthResponse, UserRole } from '../lib/types'

interface AuthUser {
  userId: string
  fullName: string
  email: string
  role: UserRole
  vendorId: string | null
  emailVerified: boolean
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (b: { fullName: string; email: string; password: string; confirmPassword: string; phone?: string; city?: string; country?: string }) => Promise<AuthUser>
  /** Adopt a session straight from an auth response (token + user fields), e.g. one-step seller signup. */
  authenticate: (r: AuthResponse) => AuthUser
  applySession: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function toUser(r: AuthResponse): AuthUser {
  return { userId: r.userId, fullName: r.fullName, email: r.email, role: r.role, vendorId: r.vendorId, emailVerified: r.emailVerified }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    api
      .me()
      .then((r) => setUser(toUser(r)))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const authenticate: AuthState['authenticate'] = (r) => {
    if (r.token) tokenStore.set(r.token)
    const u = toUser(r)
    setUser(u)
    return u
  }

  const login: AuthState['login'] = async (email, password) => authenticate(await api.login({ email, password }))

  const register: AuthState['register'] = async (b) => authenticate(await api.register(b))

  const applySession: AuthState['applySession'] = (token, u) => {
    tokenStore.set(token)
    setUser(u)
  }

  const logout = () => {
    tokenStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, authenticate, applySession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
