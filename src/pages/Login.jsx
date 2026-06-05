import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  getMultiFactorResolver,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'

import { auth } from '@/config/firebase'
import { createAdminProfile } from '@/auth/createAdminProfile'
import {
  sendUserVerificationEmail,
  userNeedsEmailVerification,
} from '@/auth/emailVerification'
import { ensureRecaptcha } from '@/auth/mfa'
import {
  Alert,
  Checkbox,
  Divider,
  GoogleButton,
  Input,
  PasswordInput,
  PrimaryButton,
} from '@/components/FormControls'
import { FIELD_ICONS } from '@/components/FieldIcons'
import { AuthLayout } from '@/pages/AuthLayout'
import { friendlyAuthError } from '@/utils/firebaseErrors'

export default function Login() {
  const nav = useNavigate()
  const loc = useLocation()
  const redirectTo = useMemo(() => (loc.state && loc.state.from) || '/dashboard', [loc.state])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [remember, setRemember] = useState(true)

  const [twoFactor, setTwoFactor] = useState(null) // { resolver, verificationId }
  const [smsCode, setSmsCode] = useState('')
  const recaptchaContainerId = `recaptcha-${useId().replaceAll(':', '')}`

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (loc.state?.verifyEmail) {
      setInfo('Please verify your email using the Firebase link we sent, then sign in again.')
    }
  }, [loc.state?.verifyEmail])

  async function onGoogle() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const cred = await signInWithPopup(auth, provider)
      await cred.user.reload()
      if (userNeedsEmailVerification(cred.user)) {
        await sendUserVerificationEmail(cred.user)
        await signOut(auth)
        setInfo('Verify your email before signing in. We sent a verification link to your inbox.')
        return
      }
      await createAdminProfile(cred.user)
      nav(redirectTo, { replace: true })
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  async function onEmailLogin(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    setTwoFactor(null)
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      await cred.user.reload()
      if (userNeedsEmailVerification(cred.user)) {
        await sendUserVerificationEmail(cred.user)
        await signOut(auth)
        setInfo(
          'Your email is not verified yet. We sent a new verification link. check your inbox, then sign in again.',
        )
        return
      }
      try {
        await createAdminProfile(cred.user, { displayName: cred.user.displayName || '' })
      } catch {
        // Existing admins with a profile do not need recreation.
      }
      nav(redirectTo, { replace: true })
    } catch (e) {
      if (e?.code === 'auth/multi-factor-auth-required') {
        try {
          const resolver = getMultiFactorResolver(auth, e)
          const hint = resolver.hints[0]
          if (!hint) {
            setError('2FA is enabled but no second factor is enrolled.')
            return
          }

          const verifier = ensureRecaptcha(recaptchaContainerId)
          const provider = new PhoneAuthProvider(auth)
          const verificationId = await provider.verifyPhoneNumber(
            {
              multiFactorHint: hint,
              session: resolver.session,
            },
            verifier,
          )
          setTwoFactor({ resolver, verificationId })
          return
        } catch (mfaErr) {
          setError(friendlyAuthError(mfaErr))
          return
        }
      }

      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  async function onForgotPassword() {
    setError('')
    setInfo('')
    const addr = email.trim()
    if (!addr) {
      setError('Enter your email address first, then click “Forgot password?”.')
      return
    }
    setBusy(true)
    try {
      await sendPasswordResetEmail(auth, addr)
      setInfo('Password reset email sent. Check your inbox.')
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  async function onVerify2fa(e) {
    e.preventDefault()
    if (!twoFactor) return
    setError('')
    setInfo('')
    setBusy(true)
    try {
      const cred = PhoneAuthProvider.credential(twoFactor.verificationId, smsCode.trim())
      const assertion = PhoneMultiFactorGenerator.assertion(cred)
      await twoFactor.resolver.resolveSignIn(assertion)
      const signedIn = auth.currentUser
      if (signedIn) {
        await signedIn.reload()
      }
      if (userNeedsEmailVerification(auth.currentUser)) {
        await sendUserVerificationEmail(auth.currentUser)
        await signOut(auth)
        setTwoFactor(null)
        setInfo('Verify your email before accessing the dashboard.')
        return
      }
      nav(redirectTo, { replace: true })
    } catch (e2) {
      setError(friendlyAuthError(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Administrator Login"
      subtitle="Access your dashboard to manage logistics and billing."
      footer={
        <span>
          Need an account?{' '}
          <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/register">
            Register here →
          </Link>
        </span>
      }
    >
      <div id={recaptchaContainerId} />

      <GoogleButton type="button" onClick={onGoogle} disabled={busy}>
        Sign in with Google
      </GoogleButton>

      <Divider label="OR CONTINUE WITH EMAIL" />

      {error ? <Alert kind="error">{error}</Alert> : null}
      {info ? <Alert kind="success">{info}</Alert> : null}

      {!twoFactor ? (
        <form className="mt-4 space-y-4" onSubmit={onEmailLogin}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mail.com"
            autoComplete="email"
            icon={FIELD_ICONS.mail}
            required
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            icon={FIELD_ICONS.lock}
            required
          />
          <Input
            label="2FA Code (Optional)"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="000000"
            autoComplete="one-time-code"
            icon={FIELD_ICONS.shield}
            hint="Enter code from your authenticator app if 2FA is enabled."
          />

          <div className="flex items-center justify-between">
            <Checkbox
              label="Remember me"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              name="remember"
            />
            <button
              type="button"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In to Portal'}
          </PrimaryButton>
        </form>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={onVerify2fa}>
          <Alert>
            2FA is enabled on this account. Enter the SMS verification code to finish signing in.
          </Alert>
          <Input
            label="2FA Code (SMS)"
            value={smsCode}
            onChange={(e) => setSmsCode(e.target.value)}
            placeholder="000000"
            autoComplete="one-time-code"
            required
          />
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Verifying…' : 'Verify & Continue'}
          </PrimaryButton>
          <button
            type="button"
            className="w-full text-sm font-medium text-slate-600 hover:text-slate-800"
            onClick={() => setTwoFactor(null)}
            disabled={busy}
          >
            Back
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

