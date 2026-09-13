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
