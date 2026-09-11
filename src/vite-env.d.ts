/// <reference types="vite/client" />

/**
 * The client's entire build-time configuration.
 *
 * One variable, and it is an address rather than a credential. Everything that
 * used to live here — the Firebase web config, the project id, the database
 * URL — moved to the backend, which is the only process that holds anything
 * worth protecting. Anything VITE_-prefixed is compiled into the JavaScript
 * every visitor downloads; scripts/check-env.mjs fails the build if something
 * that looks like a key ever reappears.
 */
interface ImportMetaEnv {
  /** Where the API lives. Empty means same-origin, via the dev proxy or the
   *  rewrite in vercel.json — which is what keeps the session cookie
   *  first-party. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
