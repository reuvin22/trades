import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { FIREBASE_WEB_CONFIG } from './firebase-defaults'

/**
 * Web app config. These values are identifiers, not secrets — they ship inside
 * every client bundle by design, and Firebase expects that. What actually
 * protects the project is elsewhere:
 *
 *   1. Firestore security rules  (see firestore.rules)
 *   2. Auth authorized domains   (console > Authentication > Settings)
 *   3. API key referrer limits   (Google Cloud console > Credentials)
 *
 * The service account key in trading.json is a different thing entirely: it is
 * an admin credential that bypasses all three, and must never be imported here.
 */
// `||` rather than `??`: an env var set to an empty string should fall through
// to the committed default, not blank the config out.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_WEB_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_WEB_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_WEB_CONFIG.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_WEB_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    FIREBASE_WEB_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_WEB_CONFIG.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || FIREBASE_WEB_CONFIG.measurementId,
}

/** Named so the login screen can say exactly which values are still blank. */
export const missingFirebaseKeys = (
  [
    ['VITE_FIREBASE_API_KEY', config.apiKey],
    ['VITE_FIREBASE_PROJECT_ID', config.projectId],
    ['VITE_FIREBASE_APP_ID', config.appId],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', config.messagingSenderId],
  ] as const
)
  .filter(([, value]) => !value)
  .map(([name]) => name)

/** False until the env vars are present, so the UI can explain itself. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let appInstance: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

if (isFirebaseConfigured) {
  appInstance = initializeApp(config)
  authInstance = getAuth(appInstance)
  dbInstance = getFirestore(appInstance)
}

export const auth = authInstance
export const db = dbInstance
export const projectId = config.projectId

/**
 * Analytics is loaded lazily and only in a real deployed browser: it is dead
 * weight in dev, and isSupported() keeps it from throwing where the required
 * browser APIs are missing.
 */
export async function startAnalytics(): Promise<void> {
  if (!appInstance || !config.measurementId || !import.meta.env.PROD) return

  const { getAnalytics, isSupported } = await import('firebase/analytics')
  if (await isSupported()) {
    getAnalytics(appInstance)
  }
}
