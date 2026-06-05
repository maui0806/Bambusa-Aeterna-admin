import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createAdminProfile } from '@/auth/createAdminProfile'
import { useAuth } from '@/auth/useAuth'
import { BrandMark } from '@/components/BrandMark'
import { friendlyAuthError } from '@/utils/firebaseErrors'

export default function AccessDenied() {
  const { user, role, signOut } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const canCompleteSetup = Boolean(user) && role !== 'admin'

  async function onCompleteSetup() {
    if (!user) return
    setBusy(true)
    setError('')
    try {
      await createAdminProfile(user, { displayName: user.displayName || '' })
      window.location.replace('/dashboard')
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex justify-center">
          <BrandMark compact />
        </div>
        <div className="text-xl font-semibold text-slate-900">Admin access required</div>
        <p className="mt-2 text-sm text-slate-600">
          This portal is restricted to admin accounts. Your Firebase user is signed in, but your
          Firestore profile does not have <span className="font-mono">role: &quot;admin&quot;</span>.
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div>
            <span className="font-semibold">Signed in as:</span> {user?.email || '—'}
          </div>
          <div className="mt-1">
            <span className="font-semibold">Current role:</span> {role || 'none'}
          </div>
          {canCompleteSetup ? (
            <div className="mt-2 text-xs text-slate-600">
              If you just registered, your Auth account may exist without a Firestore profile.
              Use <strong>Complete setup</strong> below to create your admin profile.
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-600">
              Ask the owner/admin to set your document at{' '}
              <span className="font-mono">users/{'{uid}'}</span> to{' '}
              <span className="font-mono">{'{ role: "admin" }'}</span>.
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            onClick={() => nav('/login', { replace: true })}
          >
            Back to login
          </button>
          {canCompleteSetup ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCompleteSetup}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Complete setup'}
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          )}
        </div>

        {user ? (
          <button
            type="button"
            className="mt-3 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
            onClick={() => signOut().then(() => nav('/register', { replace: true }))}
          >
            Sign out and register again
          </button>
        ) : null}
      </div>
    </div>
  )
}
