import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { DEFAULT_PALETTE, isPalette, type Palette } from '../data/palettes'

export type Theme = 'light' | 'dark'
export type { Palette }

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
const PALETTE_KEY = 'ragdex-palette'
/*
 * Whether the picker has been answered — deliberately a separate key from the
 * palette itself.
 *
 * The obvious implementation is to treat "a palette is stored" as "they have
 * chosen one", but the effect below writes the palette on mount whether or not
 * anyone touched it. That makes the default indistinguishable from a choice
 * after a single render, so a new trader who reloaded the page before picking
 * would never be asked again. This key is only ever written by the picker
 * closing, so it means what it says.
 */
const PICKED_KEY = 'ragdex-palette-picked'

/*
 * Both axes are per-device, like the theme has always been.
 *
 * A palette is a preference about this screen — a laptop in a bright room and
 * a phone at night genuinely want different answers — so it is not worth a
 * round trip to the API, and getting it wrong costs the user one click. This
 * is the same reasoning tourState.ts records for the tour flag.
 */
function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Private browsing and blocked site data both throw here.
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function initialPalette(): Palette {
  try {
    const stored = localStorage.getItem(PALETTE_KEY)
    if (isPalette(stored)) return stored
  } catch {
    // As above. An account that has never picked lands on the default, which
    // is the look the product shipped with.
  }

  return DEFAULT_PALETTE
}

/** Whether this browser has answered the picker. */
export function paletteChosen(): boolean {
  try {
    return localStorage.getItem(PICKED_KEY) === 'yes'
  } catch {
    // Storage off. Showing the picker again is a far smaller problem than
    // crashing the shell, and `markPaletteChosen` cannot record the answer
    // either — so the session flag in App.tsx is what actually closes it.
    return false
  }
}

/** Records that the picker was answered, including by accepting the default. */
export function markPaletteChosen(): void {
  try {
    localStorage.setItem(PICKED_KEY, 'yes')
  } catch {
    // Nothing to do: the picker simply reappears next time.
  }
}

/**
 * Anchors the circular sweep and hands the change to a view transition.
 *
 * The body already cross-fades its own background, but every bordered card,
 * chip and rule on the page switches in one frame — which is what made the
 * change feel abrupt. A view transition snapshots the whole page instead, so
 * all of it crosses over together.
 *
 * `apply` runs inside the transition callback: the browser captures the
 * "after" frame the moment that callback returns, so an update left to the
 * usual asynchronous effect would be captured too late and nothing would
 * appear to change. Returns false when it could not run, and the caller is
 * then responsible for applying the change itself.
 */
function sweep(origin: Origin | undefined, apply: () => void): boolean {
  const root = document.documentElement
  const doc = document as ViewTransitionDocument

  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (still || typeof doc.startViewTransition !== 'function') return false

  // Clamped into the viewport: the switch can be scrolled out of view, and a
  // circle growing from somewhere off screen reads as the page flashing
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

  doc.startViewTransition(apply)
  return true
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [palette, setPaletteState] = useState<Palette>(initialPalette)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Persisting is a convenience; the app works fine without it.
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.palette = palette
    try {
      localStorage.setItem(PALETTE_KEY, palette)
    } catch {
      // As above.
    }
  }, [palette])

  /*
   * Keep the browser's own chrome in step — the address bar on Android, the
   * status area of an installed PWA.
   *
   * `theme-color` in index.html is a single literal, so on five of the six
   * palettes it named a colour that appears nowhere on screen, and the phone
   * drew a navy bar above an amber app. Read back rather than mapped: the
   * stylesheet already knows what every palette's deepest surface is, and a
   * second table here would be a second place to forget to update.
   */
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return

    const deep = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-bg-deep')
      .trim()
    if (deep) meta.content = deep
  }, [theme, palette])

  /** Flips light/dark, sweeping the new theme out from wherever it was pressed. */
  const toggle = useCallback((origin?: Origin) => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      const root = document.documentElement

      const started = sweep(origin, () => {
        root.dataset.theme = next
        flushSync(() => setTheme(next))
      })

      // The transition callback owns the change; leave this pass untouched.
      return started ? current : next
    })
  }, [])

  /**
   * Switches palette, with the same sweep.
   *
   * Without an origin this animates from the default corner, which is right
   * for the top bar but wrong for the picker — that passes the swatch's own
   * position, so the palette washes out from the colour that was clicked.
   */
  const setPalette = useCallback((next: Palette, origin?: Origin) => {
    setPaletteState((current) => {
      if (next === current) return current
      const root = document.documentElement

      const started = sweep(origin, () => {
        root.dataset.palette = next
        flushSync(() => setPaletteState(next))
      })

      return started ? current : next
    })
  }, [])

  return { theme, palette, toggle, setPalette }
}
