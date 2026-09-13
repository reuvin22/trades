import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type Theme = 'light' | 'dark'

/** Where the switch was pressed, so the new theme can sweep out from it. */
export type Origin = { x: number; y: number }

/*
 * startViewTransition is Chromium-only for now and is absent from the DOM lib
 * this project builds against, so it is reached through a narrow local type
 * rather than by widening the global one.
 */
type ViewTransitionDocument = Document & {
  startViewTransition?: (run: () => void) => { finished: Promise<void> }
}

const STORAGE_KEY = 'tradex-theme'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Private browsing and blocked site data both throw here.
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persisting is a convenience; the app works fine without it.
    }
  }, [theme])

  /**
   * Flips the theme, sweeping the new one out from wherever it was pressed.
   *
   * The body already cross-fades its own background, but every bordered card,
   * chip and rule on the page switches in one frame — which is what made the
   * change feel abrupt. A view transition snapshots the whole page instead, so
   * all of it crosses over together.
   *
   * The DOM attribute is set inside the transition callback and the React
   * state is flushed alongside it: the browser captures the "after" frame the
   * moment that callback returns, so an update left to the usual asynchronous
   * effect would be captured too late and nothing would appear to change.
   */
  const toggle = useCallback((origin?: Origin) => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      const root = document.documentElement
      const doc = document as ViewTransitionDocument

      const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (still || typeof doc.startViewTransition !== 'function') return next

      // Clamped into the viewport: the switch can be scrolled out of view, and
      // a circle growing from somewhere off screen reads as the page flashing
      // rather than as the switch doing something.
      const raw = origin ?? { x: window.innerWidth - 64, y: 56 }
      const point = {
        x: Math.min(Math.max(raw.x, 0), window.innerWidth),
        y: Math.min(Math.max(raw.y, 0), window.innerHeight),
      }
      // Far enough to cover the furthest corner, or the circle stops short.
      const radius = Math.hypot(
        Math.max(point.x, window.innerWidth - point.x),
        Math.max(point.y, window.innerHeight - point.y),
      )
      root.style.setProperty('--theme-x', `${point.x}px`)
      root.style.setProperty('--theme-y', `${point.y}px`)
      root.style.setProperty('--theme-r', `${radius}px`)

      doc.startViewTransition(() => {
        root.dataset.theme = next
        flushSync(() => setTheme(next))
      })

      // The transition callback owns the change; leave this pass untouched.
      return current
    })
  }, [])

  return { theme, toggle }
}
