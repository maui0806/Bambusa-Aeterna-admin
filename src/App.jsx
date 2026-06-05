import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import AccessDenied from '@/pages/AccessDenied'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import StaticPage from '@/pages/StaticPage'
import LiveDashboard from '@/pages/LiveDashboard'
import CustomerPortal from '@/pages/CustomerPortal'
import BillingInvoicesPage from '@/pages/dashboard/BillingInvoicesPage'
import CustomersPage from '@/pages/dashboard/CustomersPage'
import PlaceholderPage from '@/pages/dashboard/PlaceholderPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="/track/:loadingId" element={<CustomerPortal />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<LiveDashboard />} />
        <Route path="billing" element={<BillingInvoicesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="history" element={<PlaceholderPage title="Dispatch History" />} />
        <Route path="settings" element={<PlaceholderPage title="System Config" />} />
      </Route>

      <Route path="/privacy" element={<StaticPage title="Privacy Policy" />} />
      <Route path="/terms" element={<StaticPage title="Terms of Service" />} />
      <Route path="/support" element={<StaticPage title="Support" />} />

      <Route path="*" element={<StaticPage title="Not Found" />} />
    </Routes>
  )
}
