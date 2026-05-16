import { HashRouter, Routes, Route } from 'react-router-dom'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { HomePage } from '@/pages/HomePage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { ReferralsPage } from '@/pages/dashboard/ReferralsPage'
import { BulkSmsPage } from '@/pages/dashboard/BulkSmsPage'
import { UserSettingsPage } from '@/pages/dashboard/UserSettingsPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function App() {
  return (
    <HashRouter>
      <ClientLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulksms"
            element={
              <ProtectedRoute>
                <BulkSmsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <UserSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          {/* Catch-all */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </ClientLayout>
    </HashRouter>
  )
}
