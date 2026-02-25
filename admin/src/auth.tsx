import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './lib/api'

export type AuthUser = {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const res = await api.get('/api/users/me')
      setUser(res.data.user ?? null)
    } catch {
      setUser(null)
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post('/api/users/login', { email, password })
    setUser(res.data.user)
  }

  async function logout() {
    await api.post('/api/users/logout')
    setUser(null)
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await refresh()
      setLoading(false)
    })()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, login, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

