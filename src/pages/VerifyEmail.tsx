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
}

const RESEND_COOLDOWN = 45

export function VerifyEmail({ user, onRecheck, viaGoogle }: VerifyEmailProps) {
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const polling = useRef(false)
  const sent = useRef(false)

  /*
   * Send the first email on arrival, so nobody lands on a page telling them to
   * check an inbox nothing was sent to.
   *
   * Guarded by a ref rather than state: StrictMode mounts effects twice in
   * development, and a second send would burn the server's cooldown and report
   * a failure for something that actually worked. The cooldown is the backstop
   * either way.
   */
  useEffect(() => {
    if (sent.current) return
    sent.current = true

    sendVerificationEmail()
      .then((outcome) => {
        if (outcome === 'already-verified') return onRecheck()
        setStatus(`Sent to ${user.email}. Check spam if it does not arrive.`)
        setCooldown(RESEND_COOLDOWN)
      })
      .catch(() => {
        // Silent: the button below is the recovery, and an error before anyone
        // has asked for anything reads as the page being broken.
      })
  }, [user.email, onRecheck])

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
            <>
              We sent a confirmation link to <strong>{user.email}</strong>. Open it and
              your journal unlocks.
              {viaGoogle && (
                <>
                  {' '}
                  Google told us this address is yours; this step confirms you can read
                  mail at it.
                </>
              )}
            </>
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
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send it again'}
          </button>

          <p className={LOGIN_SWITCH}>
            Wrong account?{' '}
            <button
              type="button"
              className={LINK_BUTTON}
              onClick={async () => {
                await signOutOfApp().catch(() => {})
                window.location.reload()
              }}
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
