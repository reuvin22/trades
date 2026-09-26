import { useEffect, useState } from 'react'

/**
 * An empty hash lands on the landing page — the front door for someone who
 * has not signed in. App sends a session straight past it to the dashboard,
 * so a returning trader never sees the pitch.
 */
export const DEFAULT_ROUTE = 'landing'

/** The routes a signed-out visitor may hold. Everything else redirects. */
export const PUBLIC_ROUTES = new Set(['landing', 'login'])

function read(): string {
  const path = window.location.hash.replace(/^#\/?/, '').trim()
  return path === '' ? DEFAULT_ROUTE : path
}

export function navigate(route: string) {
  window.location.hash = `#/${route}`
}

/**
 * Where a signed-out visitor was trying to go.
 *
 * A module variable rather than storage: this only has to survive a redirect
 * to the sign-in page and back, which is one page load, and putting it in
 * `sessionStorage` would mean a link opened last week still hijacking the
 * next sign-in.
 *
 * It exists because of the invitation email. Somebody follows a link to join
 * a program, is bounced to the landing page because they are not signed in,
 * signs in — and used to land on the dashboard, with nothing to say where
 * they had been headed or why.
 */
let intended: string | null = null

export function rememberDestination(route: string) {
  // The landing and sign-in pages are where the bounce goes, so remembering
  // one of them would make the redirect point at itself.
  if (!PUBLIC_ROUTES.has(route)) intended = route
}

/** Read once and forget, so a later sign-in does not repeat the jump. */
export function takeDestination(): string | null {
  const held = intended
  intended = null
  return held
}

/**
 * Minimal hash router — enough to give every screen its own URL without
 * pulling in a routing library.
 */
export function useHashRoute(): string {
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const sync = () => setRoute(read())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return route
}
