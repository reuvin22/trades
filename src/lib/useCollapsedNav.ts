import { useCallback, useEffect, useState } from 'react'

/**
 * Whether the sidebar is collapsed to a rail of icons.
 *
 * Remembered across visits. Collapsing the navigation is a statement about how
 * someone wants to work, not a per-page choice, and having it spring back open
 * on every reload would make it not worth using.
 *
 * localStorage, deliberately: this is a per-device preference. The same trader
 * on a laptop and a wide monitor wants different answers, and putting it on the
 * profile would force one of them to be wrong.
 */
const KEY = 'ragdex:nav-collapsed'

/*
 * The rail is the default, not the exception.
 *
 * The sidebar opens as icons and widens when a category is clicked, so the
 * narrow state is the resting one and the wide state is what you ask for.
 * Note the test is against 'false' rather than 'true': an absent preference
 * has to mean collapsed, and the old check returned false for it.
 */
function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'false'
  } catch {
    // Private windows and blocked site data both throw on access rather than
    // returning null. An unreadable preference is simply the default one.
    return true
  }
}

export function useCollapsedNav(): {
  collapsed: boolean
  toggle: () => void
} {
  const [collapsed, setCollapsed] = useState(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(collapsed))
    } catch {
      // Nothing to do and nothing worth saying: the rail still works for this
      // session, it just will not be remembered for the next one.
    }
  }, [collapsed])

  return {
    collapsed,
    toggle: useCallback(() => setCollapsed((current) => !current), []),
  }
}
