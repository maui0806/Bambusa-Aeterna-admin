import { isFirebaseEmulatorsEnabled } from '@/config/emulatorHost'

export function friendlyAuthError(err) {
  const code = err?.code || ''

  if (code === 'auth/network-request-failed') {
    if (isFirebaseEmulatorsEnabled()) {
      return (
        'Cannot reach Firebase Auth emulator. Start emulators (backend: npm run emulators:fresh) ' +
        'and set VITE_FIREBASE_EMULATOR_HOST=localhost in admin-panel/.env, then restart npm run dev.'
      )
    }
    return 'Network error. Check your internet connection and try again.'
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Invalid email or password.'
  }
  if (code === 'auth/user-not-found') return 'No account found for this email.'
  if (code === 'auth/email-already-in-use') {
    return (
      'An account already exists for this email. Sign in instead, or use ' +
      '"Complete setup" on the access screen if you just registered.'
    )
  }
  if (code === 'auth/weak-password') return 'Password is too weak. Please use a stronger password.'
  if (code === 'auth/invalid-email') return 'Please enter a valid email.'
  if (code === 'auth/email-not-verified') {
    return 'Please verify your email using the link Firebase sent you, then sign in again.'
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.'
  if (code === 'auth/popup-closed-by-user') return 'Sign-in popup was closed.'
  if (
    code === 'permission-denied' ||
    code === 'functions/permission-denied'
  ) {
    return (
      'Could not save admin profile. Deploy Firestore rules and the ' +
      'registerAdminProfile Cloud Function, then try again.'
    )
  }
  if (code === 'functions/already-exists') {
    return err?.message || 'This account is already registered with a non-admin role.'
  }
  if (code === 'functions/unauthenticated') {
    return 'Please sign in again, then retry.'
  }
  if (code === 'functions/unavailable' || code === 'functions/not-found') {
    return (
      'Admin profile service is unavailable. Deploy Cloud Functions ' +
      '(firebase deploy --only functions) and try again.'
    )
  }

  if (typeof err?.message === 'string' && err.message) {
    return err.message
  }

  return 'Something went wrong. Please try again.'
}
