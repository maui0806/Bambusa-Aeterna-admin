import { useEffect, useMemo, useState } from 'react'

import { subscribeStaffUsers, setStaffAccountStatus } from '@/services/staffUsersService'

function formatDate(value) {
  if (!value) return '—'
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const active = status === 'ACTIVE'
  return (
    <span
      className={[
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-800',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

function StatusToggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-emerald-600' : 'bg-slate-300',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

export default function CustomersPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [updatingId, setUpdatingId] = useState('')

  useEffect(() => {
    const unsub = subscribeStaffUsers(
      (rows) => {
        setStaff(rows)
        setLoading(false)
        setError('')
      },
      (err) => {
        setError(err?.message || 'Could not load staff accounts.')
        setLoading(false)
      },
    )
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return staff.filter((row) => {
      if (statusFilter !== 'ALL' && row.accountStatus !== statusFilter) return false
      if (!q) return true
      return (
        row.fullName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.warehouseName.toLowerCase().includes(q)
      )
    })
  }, [staff, search, statusFilter])

  const counts = useMemo(() => {
    const active = staff.filter((s) => s.accountStatus === 'ACTIVE').length
    const inactive = staff.filter((s) => s.accountStatus === 'INACTIVE').length
    return { active, inactive, total: staff.length }
  }, [staff])

  async function handleToggle(row, makeActive) {
    const next = makeActive ? 'ACTIVE' : 'INACTIVE'
    setUpdatingId(row.id)
    setError('')
    try {
      await setStaffAccountStatus(row.id, next)
    } catch (e) {
      setError(e?.message || 'Could not update staff status.')
    } finally {
      setUpdatingId('')
    }
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center p-8 text-slate-500">Loading staff…</div>
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Staff accounts</h2>
          <p className="mt-1 text-sm text-slate-600">
            Approve employee registrations. Staff must verify email and be set to{' '}
            <span className="font-medium">ACTIVE</span> before they can sign in.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5">
            Total: <strong>{counts.total}</strong>
          </span>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-800">
            Active: <strong>{counts.active}</strong>
          </span>
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-800">
            Pending: <strong>{counts.inactive}</strong>
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, warehouse…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active only</option>
          <option value="INACTIVE">Pending only</option>
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium">Registered</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Approve</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No staff accounts match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const busy = updatingId === row.id
                const isActive = row.accountStatus === 'ACTIVE'
                return (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{row.fullName || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{row.warehouseName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.accountStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <StatusToggle
                          checked={isActive}
                          disabled={busy}
                          onChange={(next) => handleToggle(row, next)}
                        />
                        <span className="text-[10px] font-medium text-slate-500">
                          {busy ? 'Saving…' : isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
