import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

import { auth, db } from '@/config/firebase'
import { AuthContext } from '@/auth/AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        setRole(null)
        setRoleLoading(false)
      } else {
        setRoleLoading(true)
      }
      setInitializing(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) return undefined

    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setRole(snap.exists() ? snap.data()?.role ?? null : null)
        setRoleLoading(false)
      },
      () => {
        setRole(null)
        setRoleLoading(false)
      },
    )

    return () => unsub()
  }, [user])

  const value = useMemo(
    () => ({
      user,
      initializing,
      role,
      roleLoading,
      signOut: () => signOut(auth),
    }),
    [user, initializing, role, roleLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

