import { Route, Routes } from 'react-router-dom'
import { DashboardPage } from '../pages/DashboardPage'
import { EventsPage } from '../pages/EventsPage'
import { EventFormPage } from '../pages/EventFormPage'
import { AttendeesPage } from '../pages/AttendeesPage'
import { PaymentsPage } from '../pages/PaymentsPage'
import { AdminShell } from '../components/AdminShell'

export function AdminRoutes() {
  return (
    <AdminShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/new" element={<EventFormPage mode="create" />} />
        <Route path="/events/:id/edit" element={<EventFormPage mode="edit" />} />
        <Route path="/events/:id/attendees" element={<AttendeesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Routes>
    </AdminShell>
  )
}

