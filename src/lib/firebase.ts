import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'

/**
 * Firebase, loaded for two things: the Google sign-in popup, and live chat.
 *
 * This is a deliberate, narrow exception to the rule that the client talks to
 * nothing but the RagDex API. Running the OAuth handshake from the server meant
 * owning a redirect URI, an OAuth client id and a client secret, and keeping
 * all three in step with the Firebase project — which is a whole class of
 * misconfiguration (redirect_uri_mismatch, INVALID_IDP_RESPONSE, clients in the
 * wrong Google Cloud project) that Firebase's own SDK simply does not have,
 * because it provisions and owns the OAuth client itself.
 *
 * The exception stays narrow:
 *
 *   - Auth and the Realtime Database. `firebase/firestore` is NOT imported here
 *     and must not be: the journal, the profile and the coach live in Firestore
 *     and are served only through the API, whose rules deny every direct client
 *     read. Chat is the exception, because a message has to land in under a
 *     second and a proxied poll cannot do that.
 *   - The SDK's job ends at producing an ID token. That token is posted once to
 *     POST /api/v1/auth/google, verified server-side, and exchanged for the
 *     same HttpOnly session cookie every other sign-in produces. The browser
 *     never keeps it.
 *
 * The values below are public identifiers, not secrets. They ship in every
 * client bundle by design and Firebase is built around that — what protects the
 * project is the API holding the service account, and Firestore rules denying
 * everything else. Google publishes these in its own quickstart snippets.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDNqWXWVoaE-jLxYLLwS4sQB7cLvfDMwzg',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trading-journal-43d07.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trading-journal-43d07',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:628278688107:web:71cbc5a265c65c0aa7742e',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://trading-journal-43d07-default-rtdb.firebaseio.com',
}

/** False when the config has been blanked out, so the UI can explain itself. */
export const isGoogleSignInConfigured = Boolean(config.apiKey && config.authDomain)

let authInstance: Auth | null = null
let databaseInstance: Database | null = null

if (isGoogleSignInConfigured) {
  const app: FirebaseApp = initializeApp(config)
  authInstance = getAuth(app)
  databaseInstance = getDatabase(app)
}

export const auth = authInstance

/** The Realtime Database, for chat only. See lib/chat.ts. */
export const rtdb = databaseInstance
