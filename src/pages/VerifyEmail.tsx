import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { readableAuthError, signOutOfApp } from '../lib/useAuth'
import { sendVerificationEmail } from '../lib/verification'
import { LoginBackdrop } from '../components/LoginBackdrop'
import { MailIcon, SpinnerIcon } from '../components/Icons'
import '../styles/login.css'

type VerifyEmailProps = {
  user: User
  /** Resolves true once Firebase reports the address as verified. */
  onRecheck: () => Promise<boolean>
  viaGoogle: boolean
  isNewAccount: boolean
}

const RESEND_COOLDOWN = 45

export function VerifyEmail({ user, onRecheck, viaGoogle, isNewAccount }: VerifyEmailProps) {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const polling = useRef(false)

  // Clicking the link happens in another tab, so poll for the state change.
  useEffect(() => {
    const timer = setInterval(async () => {
      if (polling.current) return
      polling.current = true
      try {
        await onRecheck()
      } finally {
        polling.current = false
      }
    }, 5000)

    return () => clearInterval(timer)
  }, [onRecheck])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function handleResend() {
    setError('')
    setStatus('')
    try {
      const outcome = await sendVerificationEmail()
      if (outcome === 'already-verified') {
        await onRecheck()
        return
      }
      setStatus(`Sent to ${user.email}. Check spam if it does not arrive.`)
      setCooldown(RESEND_COOLDOWN)
    } catch (cause) {
      setError(readableAuthError(cause))
    }
  }

  async function handleCheck() {
    setChecking(true)
    setError('')
    try {
      const verified = await onRecheck()
      if (!verified) {
        setStatus('Not confirmed yet. Open the link in the email, then try again.')
      }
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="login verify">
      <LoginBackdrop />

      <section className="verify-main">
        <div className="login-card card">
          <span className="verify-glyph">
            <MailIcon size={26} />
          </span>

          <h2 className="login-title">Confirm your email</h2>

          <p className="login-sub">
            {viaGoogle ? (
              <>
                {isNewAccount ? 'This is the first sign-in for ' : 'We still need to confirm '}
                <strong>{user.email}</strong>. Send yourself a link to prove the address
                is active, then your journal opens.
              </>
            ) : (
              <>
                We sent a verification link to <strong>{user.email}</strong>. Open it to
                activate your account.
              </>
            )}
          </p>

          {status && (
            <p className="verify-status" role="status">
              {status}
            </p>
          )}

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="login-submit"
            onClick={handleCheck}
            disabled={checking}
          >
            {checking && <SpinnerIcon className="spinner" />}
            {checking ? 'Checking…' : "I've confirmed it"}
          </button>

          <button
            type="button"
            className="login-sso"
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send the verification email'}
          </button>

          <p className="login-switch">
            Wrong account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => void signOutOfApp()}
            >
              Sign out
            </button>
          </p>

          <p className="verify-hint">
            This page checks automatically every few seconds — you can leave it open.
          </p>
        </div>
      </section>
    </div>
  )
}
