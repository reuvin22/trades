import { useCallback, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'

export type AuthState = {
  user: User | null
  /** Mirrored into state because reload() mutates the user object in place. */
  emailVerified: boolean
  /** True until Firebase has reported the restored session. */
  pending: boolean
}

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''
}

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase is not configured. Fill in .env.local first.')
  }
  return auth
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    emailVerified: false,
    pending: isFirebaseConfigured,
  })

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (user) =>
      setState({
        user,
        emailVerified: user?.emailVerified ?? false,
        pending: false,
      }),
    )
  }, [])

  /**
   * Clicking a verification link does not notify this tab, so the gate screen
   * has to pull the fresh state itself.
   */
  const refresh = useCallback(async () => {
    const current = auth?.currentUser
    if (!current) return false

    await current.reload()
    const verified = auth?.currentUser?.emailVerified ?? false

    setState({ user: auth?.currentUser ?? null, emailVerified: verified, pending: false })
    return verified
  }, [])

  return { ...state, refresh }
}

/**
 * Popups are unreliable on mobile Safari and in-app browsers, which is most of
 * the traffic a deployed site sees. Fall back to a full-page redirect rather
 * than dead-ending the user.
 */
const REDIRECT_FALLBACK = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
])

/** Long enough for a finished sign-in to report itself before we read the
 *  returned focus as a cancellation. */
const ABANDON_GRACE_MS = 1500

/**
 * Firebase decides a popup was dismissed by polling `popup.closed`, which the
 * cross-origin-opener-policy on Google's account chooser can hide from us. When
 * it does, signInWithPopup never settles and the caller is left spinning
 * forever. Treat "the popup took focus, handed it back, and nobody ended up
 * signed in" as the dismissal Firebase failed to notice.
 */
function watchForAbandonedPopup(instance: Auth) {
  let stop = () => {}

  const promise = new Promise<never>((_, reject) => {
    let timer: number | undefined
    // The popup has to steal focus before handing it back can mean anything —
    // without this, a popup that never opened would look like a cancellation.
    let tookFocus = false

    const onBlur = () => {
      tookFocus = true
      window.clearTimeout(timer)
    }

    const onFocus = () => {
      if (!tookFocus) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (instance.currentUser) return
        stop()
        reject(
          Object.assign(new Error('Google sign-in was closed.'), {
            code: 'auth/popup-closed-by-user',
          }),
        )
      }, ABANDON_GRACE_MS)
    }

    stop = () => {
      window.clearTimeout(timer)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }

    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
  })

  return { promise, stop: () => stop() }
}

export async function signInWithGoogle() {
  const instance = requireAuth()
  const abandoned = watchForAbandonedPopup(instance)

  try {
    return await Promise.race([
      signInWithPopup(instance, googleProvider),
      abandoned.promise,
    ])
  } catch (error) {
    if (REDIRECT_FALLBACK.has(errorCode(error))) {
      await signInWithRedirect(instance, googleProvider)
      return null
    }
    throw error
  } finally {
    abandoned.stop()
  }
}

/** Surfaces failures from a redirect sign-in once the page comes back. */
export function consumeRedirectResult(): Promise<string | null> {
  if (!auth) return Promise.resolve(null)

  return getRedirectResult(auth)
    .then(() => null)
    .catch((error: unknown) => readableAuthError(error))
}

export function signInWithPassword(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email, password)
}

/** Registers and sets the display name. The verification email is sent by the
 *  gate screen, so the branded Brevo template is the only one that goes out. */
export async function registerWithPassword(
  email: string,
  password: string,
  displayName: string,
) {
  const instance = requireAuth()
  const credential = await createUserWithEmailAndPassword(instance, email, password)

  if (displayName.trim() !== '') {
    await updateProfile(credential.user, { displayName: displayName.trim() })
  }

  // Deliberately no send here. The gate screen sends the branded email through
  // Brevo and can report failures; firing Firebase's default template as well
  // would deliver an unbranded duplicate.
  return credential
}

/** Firebase Auth is the sender — customise the template in the console. */
export function resendVerification() {
  const current = requireAuth().currentUser
  if (!current) throw new Error('No signed-in account to verify.')
  return sendEmailVerification(current)
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(requireAuth(), email)
}

export function signOutOfApp() {
  return signOut(requireAuth())
}

/** Firebase error codes are not fit to show a person. */
export function readableAuthError(error: unknown): string {
  const code = errorCode(error)

  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look right.'
    case 'auth/missing-password':
      return 'Enter your password to continue.'
    case 'auth/weak-password':
      return 'Pick a password of at least six characters.'
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try signing in instead.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was closed before it finished.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google popup. Allow popups and retry.'
    case 'auth/unauthorized-domain':
      return `Add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains, then retry.`
    case 'auth/operation-not-allowed':
      return 'That sign-in method is switched off. Enable it under Authentication > Sign-in method.'
    case 'auth/configuration-not-found':
      return 'Authentication is not enabled on this Firebase project yet. Open the console, go to Authentication, and click "Get started" — then enable Google and Email/Password.'
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'The Firebase API key is wrong. Re-run npm run setup:firebase with the config from the console.'
    case 'auth/admin-restricted-operation':
      return 'This project restricts new sign-ups. Enable the provider or allow sign-ups in the console.'
    case 'auth/network-request-failed':
      return 'Network problem reaching Firebase. Check your connection.'
    default:
      return error instanceof Error ? error.message : 'Something went wrong signing in.'
  }
}
