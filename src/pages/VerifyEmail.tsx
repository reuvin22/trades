import { useEffect, useRef, useState } from 'react'
import type { AuthUser } from '../lib/useAuth'
import { readableAuthError, signOutOfApp } from '../lib/useAuth'
import { sendVerificationEmail } from '../lib/verification'
import { LoginBackdrop } from '../components/LoginBackdrop'
import { MailIcon, SpinnerIcon } from '../components/Icons'
import {
  CARD,
  GOOGLE_BUTTON,
  LINK_BUTTON,
  LOGIN_CARD,
  LOGIN_ERROR,
  LOGIN_SHELL,
  LOGIN_SUB,
  LOGIN_SUBMIT,
  LOGIN_SWITCH,
  LOGIN_TITLE,
  VERIFY_GLYPH,
  VERIFY_HINT,
  VERIFY_MAIN,
  VERIFY_STATUS,
} from '../components/ui'

type VerifyEmailProps = {
  user: AuthUser
  /** Resolves true once the API reports the address as verified. */
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
    <div className={`${LOGIN_SHELL} grid-cols-1`}>
      <LoginBackdrop />

      <section className={VERIFY_MAIN}>
        <div className={`${CARD} ${LOGIN_CARD}`}>
          <span className={VERIFY_GLYPH}>
            <MailIcon size={26} />
          </span>

          <h2 className={LOGIN_TITLE}>Confirm your email</h2>

          <p className={LOGIN_SUB}>
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
            <p className={VERIFY_STATUS} role="status">
              {status}
            </p>
          )}

          {error && (
            <p className={LOGIN_ERROR} role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className={LOGIN_SUBMIT}
            onClick={handleCheck}
            disabled={checking}
          >
            {checking && <SpinnerIcon className="animate-spin" />}
            {checking ? 'Checking…' : "I've confirmed it"}
          </button>

          <button
            type="button"
            className={GOOGLE_BUTTON}
            onClick={handleResend}
            disabled={cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send the verification email'}
          </button>

          <p className={LOGIN_SWITCH}>
            Wrong account?{' '}
            <button
              type="button"
              className={LINK_BUTTON}
              onClick={() => void signOutOfApp()}
            >
              Sign out
            </button>
          </p>

          <p className={VERIFY_HINT}>
            This page checks automatically every few seconds — you can leave it open.
          </p>
        </div>
      </section>
    </div>
  )
}
