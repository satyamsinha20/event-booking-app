import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

type AdminShellProps = {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-semibold tracking-tight">
            Event Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-slate-700 hover:text-slate-900" to="/">
              Dashboard
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" to="/events">
              Events
            </Link>
            <Link className="text-slate-700 hover:text-slate-900" to="/payments">
              Payments
            </Link>
            {user ? (
              <button
                onClick={() => void logout()}
                className="rounded-md border bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}

