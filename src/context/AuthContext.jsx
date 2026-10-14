import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

async function request(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.')
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { request('/api/auth/me').then(data => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false)) }, [])
  const value = useMemo(() => ({
    user, loading,
    login: async (email, password) => { const data = await request('/api/auth/login', { method:'POST', body:JSON.stringify({ email, password }) }); setUser(data.user); return data.user },
    register: async fields => { const data = await request('/api/auth/register', { method:'POST', body:JSON.stringify(fields) }); setUser(data.user); return data.user },
    logout: async () => { try { await request('/api/auth/logout', { method:'POST', body:'{}' }) } finally { setUser(null) } },
    refreshUser: async () => { const data = await request('/api/auth/me'); setUser(data.user); return data.user }
  }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
