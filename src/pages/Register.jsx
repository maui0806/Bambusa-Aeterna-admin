import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  sendEmailVerification,
} from 'firebase/auth'

import { auth } from '@/config/firebase'
import { createAdminProfile } from '@/auth/createAdminProfile'
import { sendUserVerificationEmail, userNeedsEmailVerification } from '@/auth/emailVerification'
import { enrollSmsSecondFactor, finalizeSmsEnrollment } from '@/auth/mfa'
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

export default function Register() {
  const nav = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [enable2fa, setEnable2fa] = useState(false)
  const [phone, setPhone] = useState('')
  const [verificationId, setVerificationId] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  const recaptchaContainerId = `recaptcha-${useId().replaceAll(':', '')}`

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onGoogle() {
    setError('')
    setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      const cred = await signInWithPopup(auth, provider)
      if (userNeedsEmailVerification(cred.user)) {
        await sendUserVerificationEmail(cred.user)
        await signOut(auth)
        setSuccess('Verify your email using the link we sent, then sign in.')
        return
      }
      await createAdminProfile(cred.user)
      nav('/dashboard', { replace: true })
    } catch (e) {
      setError(friendlyAuthError(e))
    } finally {
      setBusy(false)
    }
  }

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)

      await createAdminProfile(cred.user, { displayName: name })

      if (name.trim()) {
        try {
          await updateProfile(cred.user, { displayName: name.trim() })
        } catch {
          // Auth display name is optional; Firestore profile is already saved.
        }
      }

      await sendEmailVerification(cred.user)

      if (enable2fa) {
        setEnrolling(true)
        setSuccess(
          'Account created. Verify your email using the Firebase link we sent, then complete optional 2FA setup.',
        )
        return
      }

      await signOut(auth)
      setSuccess(
        'Account created. Check your email for the Firebase verification link, then sign in.',
      )
    } catch (e2) {
      setError(friendlyAuthError(e2))
    } finally {
      setBusy(false)
    }
  }

  async function onSend2faCode(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')
      const res = await enrollSmsSecondFactor({
        user,
        phoneNumber: phone.trim(),
        containerId: recaptchaContainerId,
      })
      setVerificationId(res.verificationId)
    } catch (e2) {
      setError(friendlyAuthError(e2))
    } finally {
      setBusy(false)
    }
  }

  async function onVerifyEnroll(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')
      await finalizeSmsEnrollment({
        user,
        verificationId,
        code: smsCode.trim(),
        displayName: 'SMS 2FA',
      })
      await user.reload()
      if (userNeedsEmailVerification(user)) {
        await signOut(auth)
        setEnrolling(false)
        setSuccess('2FA enabled. Verify your email, then sign in.')
        return
      }
      nav('/dashboard', { replace: true })
    } catch (e2) {
      setError(friendlyAuthError(e2))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create Admin Account"
      subtitle="Enter your details to register for the administration portal."
      footer={
        <span>
          Already have an account?{' '}
          <Link className="font-medium text-emerald-700 hover:text-emerald-800" to="/login">
            Log in here
          </Link>
        </span>
      }
    >
      <div id={recaptchaContainerId} />

      <GoogleButton type="button" onClick={onGoogle} disabled={busy}>
        Continue with Google
      </GoogleButton>

      <Divider label="OR REGISTER WITH EMAIL" />

      {error ? <Alert kind="error">{error}</Alert> : null}
      {success ? <Alert kind="success">{success}</Alert> : null}

      {!enrolling ? (
        <form className="mt-4 space-y-4" onSubmit={onCreate}>
          <Input
            label="Admin Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jonathan Smith"
            autoComplete="name"
            required
          />
          <Input
            label="Work Email Address *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jsmith@mail.com"
            autoComplete="email"
            icon={FIELD_ICONS.mail}
            required
          />
          {/* <Input
            label="Company Role / Title"
            value={companyRole}
            onChange={(e) => setCompanyRole(e.target.value)}
            placeholder="e.g. Senior Systems Architect"
            autoComplete="organization-title"
          /> */}
          <PasswordInput
            label="Access Password *"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            icon={FIELD_ICONS.lock}
            required
          />
          <PasswordInput
            label="Confirm Password *"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            icon={FIELD_ICONS.lock}
            required
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Enable Two-Factor (2FA)</div>
                <div className="text-xs text-slate-600">Recommended for security.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enable2fa}
                  onChange={(e) => setEnable2fa(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:border-slate-200 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
            {enable2fa ? (
              <div className="mt-3 text-xs text-slate-600">
                After account creation you’ll add a phone number for SMS 2FA.
              </div>
            ) : null}
          </div>

          <Checkbox
            label={
              <span>
                I acknowledge and agree to the{' '}
                <Link className="text-emerald-700 hover:text-emerald-800" to="/terms">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link className="text-emerald-700 hover:text-emerald-800" to="/privacy">
                  Privacy Policy
                </Link>
                .
              </span>
            }
            checked={true}
            onChange={() => {}}
            name="tos"
          />

          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Register Admin Account →'}
          </PrimaryButton>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          {!verificationId ? (
            <form className="space-y-4" onSubmit={onSend2faCode}>
              <Alert>
                Optional 2FA setup. Enter a phone number to enroll SMS 2FA on this admin account.
              </Alert>
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                autoComplete="tel"
                required
              />
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send 2FA Code'}
              </PrimaryButton>
              <button
                type="button"
                className="w-full text-sm font-medium text-slate-600 hover:text-slate-800"
                onClick={async () => {
                  await signOut(auth)
                  setEnrolling(false)
                  setSuccess('Verify your email, then sign in to continue.')
                }}
              >
                Skip for now
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onVerifyEnroll}>
              <Input
                label="2FA Code (SMS)"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? 'Verifying…' : 'Enable 2FA & Continue'}
              </PrimaryButton>
            </form>
          )}
        </div>
      )}
    </AuthLayout>
  )
}

