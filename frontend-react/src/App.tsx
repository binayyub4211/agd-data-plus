import { HashRouter, Routes, Route } from 'react-router-dom'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { HomePage } from '@/pages/HomePage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { ReferralsPage } from '@/pages/dashboard/ReferralsPage'
import { BulkSmsPage } from '@/pages/dashboard/BulkSmsPage'
import { UserSettingsPage } from '@/pages/dashboard/UserSettingsPage'
import { ProfilePage } from '@/pages/dashboard/ProfilePage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { GlobalAlertModal } from '@/components/layout/GlobalAlertModal'

export default function App() {
  return (
    <HashRouter>
      <ClientLayout>
        <GlobalAlertModal />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
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
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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
