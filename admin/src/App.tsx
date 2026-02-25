import { Navigate, Route, Routes, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { EventsPage } from './pages/EventsPage'
import { EventFormPage } from './pages/EventFormPage'
import { AttendeesPage } from './pages/AttendeesPage'
import { PaymentsPage } from './pages/PaymentsPage'

function AdminGate({ children }: { children: React.ReactNode }) {
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

function Shell({ children }: { children: React.ReactNode }) {
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

function AdminRoutes() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/new" element={<EventFormPage mode="create" />} />
        <Route path="/events/:id/edit" element={<EventFormPage mode="edit" />} />
        <Route path="/events/:id/attendees" element={<AttendeesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Routes>
    </Shell>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <AdminGate>
              <AdminRoutes />
            </AdminGate>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

