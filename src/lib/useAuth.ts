import { useCallback, useEffect, useState } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { ApiError, apiFetch } from './api'
import { auth } from './firebase'

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
 * Google sign-in: popup in the browser, session minted by the API.
 *
 * The Firebase SDK runs the OAuth handshake — it owns the OAuth client, so
 * there is no redirect URI to register and no client secret anywhere. All it
 * produces is an ID token, which goes to the API once and is verified there
 * against the Firebase project before any session exists.
 *
 * The token is never stored. `signOut` clears the SDK's own copy immediately,
 * because the only credential this app should hold afterwards is the HttpOnly
 * cookie the API set, which script on this page cannot read.
 */
export async function signInWithGoogle(): Promise<AuthUser | null> {
  const instance = auth
  if (!instance) {
    throw new Error('Google sign-in is not configured in this build.')
  }

  const provider = new GoogleAuthProvider()
  // Always ask which account, rather than silently reusing whichever one the
  // browser last used on some other Google property.
  provider.setCustomParameters({ prompt: 'select_account' })

  const credential = await signInWithPopup(instance, provider)
  const idToken = await credential.user.getIdToken()

  try {
    const wire = await apiFetch<SessionWire>('/api/v1/auth/google', {
      method: 'POST',
      body: { id_token: idToken },
    })
    return toUser(wire)
  } finally {
    // Whether or not the exchange worked, the SDK's session has done its job.
    // Leaving it signed in would keep a second, refreshable credential in the
    // browser alongside the cookie — two sources of truth, one of them readable
    // by any script on the page.
    await signOut(instance).catch(() => {})
  }
}

/** Firebase's popup errors are not fit to show a person. */
export function readableGoogleError(error: unknown): string | null {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  switch (code) {
    // Closing the popup is a decision, not a failure. Nothing to report.
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google popup. Allow popups and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'That email already has an account. Sign in with your password instead.'
    case 'auth/unauthorized-domain':
      return `Add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains.`
    case 'auth/operation-not-allowed':
      return 'Google sign-in is switched off for this project. Enable it under Authentication > Sign-in method.'
    case 'auth/network-request-failed':
      return 'Network problem reaching Google. Check your connection.'
    default:
      return readableAuthError(error)
  }
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
