import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { LoginPage } from './pages/LoginPage'
import { AdminGate } from './components/AdminGate'
import { AdminRoutes } from './routes/AdminRoutes'

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

