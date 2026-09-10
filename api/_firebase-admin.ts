import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Server-side Firebase. This is the *only* place the service account belongs:
 * it never reaches the browser, and it is read from an environment variable
 * rather than a file so nothing sensitive sits in the deployment bundle.
 *
 * Set FIREBASE_SERVICE_ACCOUNT in Vercel to the full JSON of trading.json,
 * with no VITE_ prefix — that prefix would inline it into the client bundle.
 */
function loadApp(): App {
  if (getApps().length > 0) return getApp()

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set on the server.')
  }

  let parsed: { project_id?: string; client_email?: string; private_key?: string }
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.')
  }

  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields.')
  }

  return initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      // Vercel stores newlines escaped; the SDK needs them real.
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    }),
  })
}

export function adminAuth(): Auth {
  return getAuth(loadApp())
}

export function adminDb(): Firestore {
  return getFirestore(loadApp())
}
