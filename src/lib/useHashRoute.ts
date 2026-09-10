import { useEffect, useState } from 'react'

/** Empty hash lands on the login screen; App redirects once a session exists. */
export const DEFAULT_ROUTE = 'login'

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
