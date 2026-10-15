import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type AuthUser = { id: string | number; name: string; email: string; role: string; phone?: string; region?: string; city?: string }
type AuthValue = { user: AuthUser | null; loading: boolean; login: (email: string, password: string) => Promise<AuthUser>; register: (fields: Record<string, unknown>) => Promise<AuthUser>; logout: () => Promise<void>; refreshUser: () => Promise<AuthUser> }
const AuthContext = createContext<AuthValue | null>(null)

async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.')
  return data
}

export function AuthProvider({ children, initialUser = null }: {children: ReactNode; initialUser?: AuthUser | null}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [loading, setLoading] = useState(!initialUser)
  useEffect(() => {
    if (initialUser) return
    request('/api/auth/me').then(data => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [initialUser])
  const value = useMemo(() => ({
    user, loading,
    login: async (email, password) => { const data = await request('/api/auth/login', { method:'POST', body:JSON.stringify({ email, password }) }); setUser(data.user); return data.user },
    register: async (fields: Record<string, unknown>) => { const data = await request('/api/auth/register', { method:'POST', body:JSON.stringify(fields) }); setUser(data.user); return data.user },
    logout: async () => { try { await request('/api/auth/logout', { method:'POST', body:'{}' }) } finally { setUser(null) } },
    refreshUser: async () => { const data = await request('/api/auth/me'); setUser(data.user); return data.user }
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
