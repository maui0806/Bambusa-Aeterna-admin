import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  multiFactor,
} from 'firebase/auth'

import { auth } from '@/config/firebase'

export function ensureRecaptcha(containerId) {
  // Only create once per page lifecycle
  if (window.__bambusaRecaptchaVerifier) return window.__bambusaRecaptchaVerifier

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  })
  window.__bambusaRecaptchaVerifier = verifier
  return verifier
}

export async function enrollSmsSecondFactor({ user, phoneNumber, containerId }) {
  const verifier = ensureRecaptcha(containerId)
  const session = await multiFactor(user).getSession()

  const provider = new PhoneAuthProvider(auth)
  const verificationId = await provider.verifyPhoneNumber(
    { phoneNumber, session },
    verifier,
  )

  return { verificationId }
}

export async function finalizeSmsEnrollment({ user, verificationId, code, displayName }) {
  const cred = PhoneAuthProvider.credential(verificationId, code)
  const assertion = PhoneMultiFactorGenerator.assertion(cred)
  await multiFactor(user).enroll(assertion, displayName || 'SMS 2FA')
}

