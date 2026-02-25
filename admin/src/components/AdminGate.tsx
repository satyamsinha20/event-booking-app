import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

type AdminGateProps = {
  children: ReactNode
}

export function AdminGate({ children }: AdminGateProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== 'admin')
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <div className="text-xl font-semibold">Admin access required</div>
          <div className="mt-2 text-sm text-slate-600">Your account does not have admin permissions.</div>
        </div>
      </div>
    )
  return <>{children}</>
}

