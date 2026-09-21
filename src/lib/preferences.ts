/**
 * Display preferences the trader sets on Settings.
 *
 * Per device rather than on the profile, the same call `tourState` and the
 * theme already make: this decides what one screen shows, it is not worth a
 * round trip to the API on every load, and the worst case if it is lost is a
 * card reappearing that somebody had switched off.
 *
 * A module-level store rather than React state because the answer is read on
 * two unrelated screens — the dashboard and analytics — and set on a third.
 * Threading it through three page components as props would mean every screen
 * between them carried a prop about a card none of them render.
 */

import { useSyncExternalStore } from 'react'

const KEY = 'ragdex.prefs'

export type Preferences = {
  /** The consistency gauge, on the dashboard and under Analytics > Behaviour. */
  showConsistency: boolean
}

/** What somebody sees before they have turned anything off. */
const DEFAULTS: Preferences = {
  showConsistency: true,
}

function read(): Preferences {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS

    // Spread over the defaults rather than trusting the parse: a preference
    // added after this was written is absent from an older browser's copy,
    // and reading it back as undefined would switch off a card nobody chose
    // to hide.
    const stored = JSON.parse(raw) as Partial<Preferences>
    return { ...DEFAULTS, ...stored }
  } catch {
    // Private browsing, storage switched off, or something that is not JSON.
    return DEFAULTS
  }
}

let current: Preferences = read()

const listeners = new Set<() => void>()

export function preferences(): Preferences {
  return current
}

export function setPreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K],
): void {
  if (current[key] === value) return

  current = { ...current, [key]: value }

  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // The choice still applies to this session; it just will not survive a
    // reload. Better than refusing to apply it at all.
  }

  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, preferences, preferences)
}
