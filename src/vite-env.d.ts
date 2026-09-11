/// <reference types="vite/client" />

/**
 * The client's build-time configuration.
 *
 * One address, and the Firebase web config — which is a set of public
 * identifiers, not credentials. They ship in every client bundle by design and
 * Firebase is built around that; `scripts/check-env.mjs` allowlists them by
 * name and fails the build on anything else that looks like a key.
 *
 * Every value here has a working default committed in the file that reads it,
 * so a fresh clone runs with no environment configuration at all.
 */
interface ImportMetaEnv {
  /** Where the API lives. Empty means same-origin, via the dev proxy or the
   *  rewrite in vercel.json — which is what keeps the session cookie
   *  first-party. */
  readonly VITE_API_BASE_URL?: string

  /* Firebase, loaded for the Google sign-in popup only. See lib/firebase.ts. */
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
