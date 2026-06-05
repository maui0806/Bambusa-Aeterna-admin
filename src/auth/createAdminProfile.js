import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { db, functions } from '@/config/firebase'
import { isFirebaseEmulatorsEnabled } from '@/config/emulatorHost'
import { getCallableErrorMessage } from '@/utils/callableError'

/**
 * Creates users/{uid} in Firestore with role admin.
 * Uses Cloud Function in production; falls back to direct write for emulators.
 */
export async function createAdminProfile(user, { displayName, companyRole } = {}) {
  if (!user?.uid) {
    throw new Error('No authenticated user')
  }

  await user.getIdToken(true)

  const fullName = displayName?.trim() || user.displayName || ''

  try {
    const fn = httpsCallable(functions, 'registerAdminProfile')
    const res = await fn({
      displayName: fullName,
      companyRole: companyRole?.trim() || '',
    })
    return res.data
  } catch (fnErr) {
    const code = fnErr?.code || ''
    if (
      !isFirebaseEmulatorsEnabled() &&
      code !== 'functions/unavailable' &&
      code !== 'functions/not-found'
    ) {
      throw new Error(getCallableErrorMessage(fnErr, 'Could not create admin profile.'), {
        cause: fnErr,
      })
    }
  }

  const ref = doc(db, 'users', user.uid)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    const data = existing.data()
    if (data?.role === 'admin') return data
    throw new Error('This account is already registered with a non-admin role.')
  }

  const profile = {
    uid: user.uid,
    role: 'admin',
    email: user.email ?? '',
    fullName,
    displayName: fullName,
    companyRole: companyRole?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(ref, profile)

  const saved = await getDoc(ref)
  if (!saved.exists()) {
    throw new Error(
      'Profile was not saved to Firestore. Deploy Cloud Functions and Firestore rules.',
    )
  }

  return saved.data()
}
