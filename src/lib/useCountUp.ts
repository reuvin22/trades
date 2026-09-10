import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * Counts from zero up to `target` on mount. Readers who have asked for reduced
 * motion get the final figure immediately rather than a shortened animation.
 */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const frame = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Land on the final figure without ever animating toward it.
      frame.current = requestAnimationFrame(() => setValue(target))
      return () => cancelAnimationFrame(frame.current)
    }

    const started = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return value
}
