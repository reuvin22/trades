import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from './api'

/**
 * The signed-in trader.
 *
 * Not a Firebase `User` — the client has no Firebase SDK and holds no token.
 * This is what `GET /auth/session` returns, and the session itself is a cookie
 * the page cannot read.
 */
export type AuthUser = {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string
  photoURL: string
  /** Provider ids, e.g. google.com. */
  providers: string[]
}

type SessionWire = {
  user: {
    uid: string
    email: string | null
    email_verified: boolean
    display_name: string
    photo_url: string
    providers: string[]
  } | null
}

function toUser(wire: SessionWire): AuthUser | null {
  if (wire.user === null) return null
  return {
    uid: wire.user.uid,
    email: wire.user.email,
    emailVerified: wire.user.email_verified,
    displayName: wire.user.display_name,
    photoURL: wire.user.photo_url,
    providers: wire.user.providers,
  }
}

export type AuthState = {
  user: AuthUser | null
  /** Mirrored out of the user so the gate screen can read it on its own. */
  emailVerified: boolean
  /** True until the API has reported whether there is a session. */
  pending: boolean
}

/** Reads the session cookie's account, or null. Never throws for "not signed in". */
async function readSession(): Promise<AuthUser | null> {
  const wire = await apiFetch<SessionWire>('/api/v1/auth/session')
  return toUser(wire)
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    emailVerified: false,
    pending: true,
  })

  useEffect(() => {
    let live = true

    readSession()
      .then((user) => {
        if (!live) return
        setState({
          user,
          emailVerified: user?.emailVerified ?? false,
          pending: false,
        })
      })
      .catch(() => {
        // An unreachable API is indistinguishable from no session as far as
        // what the app can show; the login screen reports the failure itself.
        if (live) setState({ user: null, emailVerified: false, pending: false })
      })

    return () => {
      live = false
    }
  }, [])

  /**
   * Clicking a verification link does not notify this tab, so the gate screen
   * has to pull the fresh state itself. The API reads through to the auth
   * record rather than trusting the cookie's claims, which is what lets a
   * cookie minted before confirmation report as verified afterwards.
   */
  const refresh = useCallback(async () => {
    try {
      const user = await readSession()
      setState({ user, emailVerified: user?.emailVerified ?? false, pending: false })
      return user?.emailVerified ?? false
    } catch {
      return false
    }
  }, [])

  /** Adopt a session the sign-in calls below have just established. */
  const adopt = useCallback((user: AuthUser | null) => {
    setState({ user, emailVerified: user?.emailVerified ?? false, pending: false })
  }, [])

  return { ...state, refresh, adopt }
}

/* ------------------------------------------------------------- sign-in */

export function signInWithPassword(email: string, password: string) {
  return apiFetch<SessionWire>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  }).then(toUser)
}

export function registerWithPassword(
  email: string,
  password: string,
  displayName: string,
) {
  return apiFetch<SessionWire>('/api/v1/auth/register', {
    method: 'POST',
    body: { email, password, display_name: displayName.trim() },
  }).then(toUser)
}

/**
 * Hand the browser to the API, which hands it to Google.
 *
 * A full-page navigation rather than a popup, and deliberately so: the client
 * holds no OAuth client id and no Firebase config, so it has nothing to build
 * an authorize URL from. The API owns the redirect, does the code exchange
 * with its secret, sets the session cookie and sends the browser back.
 *
 * This also sidesteps the popup problems the SDK had — blocked popups, mobile
 * Safari, in-app browsers, and a cross-origin-opener-policy that could hide a
 * dismissal and leave the caller spinning forever.
 */
export function signInWithGoogle(): void {
  window.location.href = `${
    import.meta.env.VITE_API_BASE_URL ?? ''
  }/api/v1/auth/google/start`
}

/**
 * A failed Google sign-in, as reported by the page the browser came back to.
 *
 * The OAuth callback cannot answer with JSON — it is reached by a navigation —
 * so it reports through a query parameter. Reading and clearing are separate
 * because reading has to happen during render, to seed the error state, and
 * rewriting history is a side effect that must not.
 */
export function readRedirectError(): string | null {
  const reason = new URLSearchParams(window.location.search).get('auth_error')
  if (reason === null) return null

  switch (reason) {
    case 'cancelled':
      return 'Google sign-in was closed before it finished.'
    case 'unconfigured':
      return 'Google sign-in is not finished being set up on the server.'
    default:
      return 'Google sign-in did not complete. Try again.'
  }
}

/** Strips the parameter, so a reload does not show the message again. */
export function clearRedirectError(): void {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('auth_error')) return

  params.delete('auth_error')
  const query = params.toString()
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
  )
}

export function resendVerification() {
  return apiFetch<{ status: string }>('/api/v1/auth/verify-email', { method: 'POST' })
}

export function sendPasswordReset(email: string) {
  return apiFetch<{ message: string }>('/api/v1/auth/password-reset', {
    method: 'POST',
    body: { email },
  })
}

export function signOutOfApp() {
  return apiFetch<{ message: string }>('/api/v1/auth/logout', { method: 'POST' })
}

/**
 * Turns a failure into something worth showing a person.
 *
 * Short now, because the messages arrive already fit to read: the API maps
 * Identity Toolkit's codes server-side, which is also where the judgement
 * about what is safe to reveal belongs. What used to be a long switch over
 * `auth/*` codes — including several that told a visitor how our Firebase
 * project was misconfigured — is gone with the SDK that produced them.
 */
export function readableAuthError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return error instanceof Error ? error.message : 'Something went wrong signing in.'
}
