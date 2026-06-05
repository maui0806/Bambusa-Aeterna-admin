import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { userNeedsEmailVerification } from '@/auth/emailVerification'

export function ProtectedRoute({ children }) {
  const { user, initializing, role, roleLoading, signOut } = useAuth()
  const loc = useLocation()

  if (initializing || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  if (userNeedsEmailVerification(user)) {
    void signOut()
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: loc.pathname, verifyEmail: true }}
      />
    )
  }

  if (role !== 'admin') {
    return <Navigate to="/access-denied" replace />
  }

  return children
}
