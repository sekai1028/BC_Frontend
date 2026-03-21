import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const ADMIN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

type AdminContextValue = {
  secret: string
  setSecret: (s: string) => void
  authenticated: boolean
  config: Record<string, unknown> | null
  setConfig: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>
  error: string
  setError: (e: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  headers: () => HeadersInit
  adminHeaders: () => HeadersInit
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [secret, setSecret] = useState(() => sessionStorage.getItem('admin_secret') || '')
  const [authenticated, setAuthenticated] = useState(false)
  const [config, setConfig] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!secret) return
    sessionStorage.setItem('admin_secret', secret)
    fetch(`${ADMIN_API_URL}/api/admin/config`, {
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Invalid secret'))))
      .then((data) => {
        setConfig(data)
        setAuthenticated(true)
        setError('')
      })
      .catch(() => setAuthenticated(false))
  }, [secret])

  const headers = useCallback(
    () => ({ 'Content-Type': 'application/json', 'X-Admin-Secret': secret }) as HeadersInit,
    [secret]
  )
  const adminHeaders = useCallback(() => ({ 'X-Admin-Secret': secret }) as HeadersInit, [secret])

  const value = useMemo<AdminContextValue>(
    () => ({
      secret,
      setSecret,
      authenticated,
      config,
      setConfig,
      error,
      setError,
      loading,
      setLoading,
      headers,
      adminHeaders,
    }),
    [secret, setSecret, authenticated, config, error, loading, headers, adminHeaders]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
