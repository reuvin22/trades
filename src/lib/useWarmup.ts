import { useEffect, useState } from 'react'

/**
 * Whether to keep the splash up while the first data loads.
 *
 * The session resolving is not the app being ready. That is one quick call;
 * the profile and the journal are several more, and letting the shell through
 * after the first one painted an empty dashboard that filled in a moment
 * later — which reads as the app having lost the data rather than not having
 * fetched it yet.
 *
 * The ceiling is the important half. Holding until data arrives is right when
 * that is a moment; it is wrong when the API is cold and takes half a minute,
 * because then the choice is between a splash nobody can leave and a shell
 * whose pages each say what they are waiting for. Past the limit the shell
 * wins — every page already handles having nothing yet.
 */
export function useWarmup(waiting: boolean, limitMs = 6_000): boolean {
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!waiting || expired) return

    const timer = setTimeout(() => setExpired(true), limitMs)
    return () => clearTimeout(timer)
  }, [waiting, expired, limitMs])

  // Once expired it stays expired. A later refetch is a refresh of something
  // already on screen, and putting the splash back over it would be a worse
  // flash than the one this exists to prevent.
  return waiting && !expired
}
