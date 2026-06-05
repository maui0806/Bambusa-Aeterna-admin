import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { BrandMark } from '@/components/BrandMark'
import logo from '@/assets/logo.jpg'

const NAV = [
  { to: '/dashboard', label: 'Live Dashboard', end: true },
  { to: '/dashboard/billing', label: 'Billing & Invoices' },
  { to: '/dashboard/customers', label: 'Customers' },
  // { to: '/dashboard/history', label: 'Dispatch History' },
  // { to: '/dashboard/settings', label: 'System Config' },
]

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const nav = useNavigate()

  async function onSignOut() {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-5">
          <BrandMark compact />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user?.displayName || 'Admin'}</div>
              <div className="truncate text-xs text-slate-500">Operations Lead</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-slate-800">Operations Control</h1>
          <button
            type="button"
            onClick={onSignOut}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Sign out
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
