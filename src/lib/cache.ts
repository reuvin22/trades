/**
 * The last payload each hook saw, so a reload has something to paint at once.
 *
 * The problem this solves is a flash, not a slow API. Resolving the session
 * takes one quick call; fetching the profile and the journal takes several
 * more. Letting the app through after the first one meant the shell arrived
 * empty — no name, no rows, zeroed cards — and filled in a moment later, which
 * reads as the app having lost the data rather than not having it yet.
 *
 * What is cached is the **wire payload**, exactly as the API returned it, not
 * the mapped object. The same mapper then runs over it either way, so a cached
 * render and a fetched render cannot diverge — and nothing here has to know
 * that a profile carries dates, which JSON would otherwise hand back as
 * strings.
 */

/**
 * Session storage, deliberately, and this is the part worth not changing.
 *
 * It survives a reload, which is the case being fixed, and dies with the tab.
 * The journal is the trader's financial record; the API seals it at rest, and
 * writing it to disk here — where it would outlive the session, the browser
 * and any sign-out that never ran — would quietly undo that.
 */
function store(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    // Blocked by policy, or a browser refusing storage to this context.
    return null
  }
}

/*
 * Versioned, because the key says nothing about the shape behind it. Bump this
 * when a mapper stops understanding what an older build wrote, and every stale
 * entry is ignored instead of being parsed into something half-right.
 */
const PREFIX = 'ragdex.v1.'

function keyFor(name: string, uid: string): string {
  return `${PREFIX}${name}.${uid}`
}

/** The last payload stored under this name for this account, or null. */
export function readCache<T>(name: string, uid: string): T | null {
  const storage = store()
  if (!storage) return null

  try {
    const raw = storage.getItem(keyFor(name, uid))
    return raw === null ? null : (JSON.parse(raw) as T)
  } catch {
    // Truncated or written by a build that meant something else by it.
    return null
  }
}

export function writeCache(name: string, uid: string, value: unknown): void {
  const storage = store()
  if (!storage) return

  try {
    storage.setItem(keyFor(name, uid), JSON.stringify(value))
  } catch {
    /*
     * Almost always the quota, from a journal larger than the budget. Drop
     * the entry rather than leave whatever was there before: a stale cache
     * paints rows that no longer exist, which is worse than painting none.
     */
    try {
      storage.removeItem(keyFor(name, uid))
    } catch {
      // Nothing left to try.
    }
  }
}

/**
 * Drop everything cached, for every account.
 *
 * Called on sign-out, alongside the thread keys and the signed image URLs.
 * Scoped by prefix rather than clearing the whole store, which belongs to the
 * origin and not only to us.
 */
export function forgetCache(): void {
  const storage = store()
  if (!storage) return

  try {
    for (const key of Object.keys(storage)) {
      if (key.startsWith(PREFIX)) storage.removeItem(key)
    }
  } catch {
    // Nothing to clean up if the store cannot be read.
  }
}
