import { useCallback, useEffect, useState } from 'react'

/** Mirrors the shell breakpoint in index.css, above which the sidebar is
 *  permanent and the drawer cannot be opened at all. */
const DESKTOP = '(min-width: 961px)'

export type NavDrawer = {
  open: boolean
  toggle: () => void
  close: () => void
}

/**
 * Open state for the small-screen navigation drawer.
 *
 * The drawer belongs to the route it was opened on, which is why the state
 * holds a route rather than a boolean: arriving anywhere new closes it as a
 * matter of arithmetic, with no effect watching for the change and no stale
 * drawer left hanging over the page the user just navigated to.
 *
 * The effect below is for the things React cannot derive — the Escape key,
 * the page scroll underneath, and a window growing past the breakpoint where
 * the sidebar becomes permanent again. That last one is not cosmetic: the
 * drawer locks scrolling, and nothing else would ever unlock it.
 */
export function useNavDrawer(route: string): NavDrawer {
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const open = openedOn === route

  const close = useCallback(() => setOpenedOn(null), [])
  const toggle = useCallback(
    () => setOpenedOn((current) => (current === route ? null : route)),
    [route],
  )

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedOn(null)
    }

    const desktop = window.matchMedia(DESKTOP)
    const onWiden = () => {
      if (desktop.matches) setOpenedOn(null)
    }

    window.addEventListener('keydown', onKey)
    desktop.addEventListener('change', onWiden)

    // Set directly rather than through a class: the page behind the drawer
    // must not scroll, and this is the one style with no element to hang a
    // utility on.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', onWiden)
      document.body.style.overflow = previous
    }
  }, [open])

  return { open, toggle, close }
}
