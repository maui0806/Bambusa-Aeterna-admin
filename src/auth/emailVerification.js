import { sendEmailVerification } from 'firebase/auth'

import { auth } from '@/config/firebase'

export function userNeedsEmailVerification(user) {
  if (!user?.email) return false
  return !user.emailVerified
}

export async function reloadAuthUser(user) {
  if (!user) return null
  await user.reload()
  return auth.currentUser
}

export async function sendUserVerificationEmail(user) {
  if (!user || user.emailVerified) return
  await sendEmailVerification(user)
}

export async function requireVerifiedEmail(user) {
  const refreshed = await reloadAuthUser(user)
  if (userNeedsEmailVerification(refreshed)) {
    const err = new Error('EMAIL_NOT_VERIFIED')
    err.code = 'auth/email-not-verified'
    throw err
  }
  return refreshed
}
