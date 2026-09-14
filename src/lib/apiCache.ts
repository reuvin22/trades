/**
 * A short memory in front of the API.
 *
 * Two problems, one solution. The first is duplication: several components
 * asking for the profile on the same render each fired their own request, so
 * loading a page meant the same GET three or four times. The second is churn
 * — navigating away and back refetched everything that was already on screen a
 * second ago.
 *
 * So a GET is remembered for a few seconds, and a GET already in flight is
 * joined rather than repeated. Both are invisible when they work, which is
 * the point.
 *
 * **In memory, not on disk.** This is not `lib/cache.ts`, which keeps the last
 * payload in session storage so a reload has something to paint immediately.
 * That one survives refreshes and is about the first frame; this one lives for
 * seconds and is about not asking twice. They solve different problems and
 * would be wrong combined: a session-long in-memory cache would serve stale
 * trades after a write, and a two-second disk cache would help nobody.
 */

/** How long a GET stays fresh. Long enough for a page load, short enough that
 *  nothing feels stale. */
export const DEFAULT_TTL_MS = 4_000

type Entry = {
  /** The resolved value, once it has resolved. */
  value?: unknown
  /** The request itself, while it is in flight. Joined, never repeated. */
  pending?: Promise<unknown>
  /** When the value stops being served. */
  until: number
}

const entries = new Map<string, Entry>()

/**
 * Run a request through the cache, or join one already running.
 *
 * The key identifies the response, not the request — two callers asking for
 * the same URL with different abort signals want the same answer.
 */
export async function through<T>(
  key: string,
  ttlMs: number,
  run: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const hit = entries.get(key)

  if (hit) {
    // Already running: wait for the one in flight rather than starting a
    // second. This is the half that matters most on a page load.
    if (hit.pending) return hit.pending as Promise<T>
    if (hit.until > now) return hit.value as T
  }

  const pending = run()
    .then((value) => {
      entries.set(key, { value, until: Date.now() + ttlMs })
      return value
    })
    .catch((cause: unknown) => {
      /*
       * Failures are not cached, and the entry is dropped entirely rather
       * than left pending. A cached error would make a retry impossible for
       * the whole TTL, which is the opposite of what somebody pressing the
       * button again wants.
       */
      entries.delete(key)
      throw cause
    })

  entries.set(key, { pending, until: 0 })
  return pending as Promise<T>
}

/**
 * Forget everything whose key starts with this.
 *
 * Called after a write. By prefix rather than by exact key because one write
 * invalidates a family: saving a trade changes the journal list, every page of
 * it, and the statistics built from it.
 *
 * No argument clears the lot — used on sign-out, where anything remembered
 * belongs to somebody who is no longer here.
 */
export function invalidate(prefix?: string): void {
  if (prefix === undefined) {
    entries.clear()
    return
  }

  for (const key of [...entries.keys()]) {
    if (key.startsWith(prefix)) entries.delete(key)
  }
}

/** Only for tests: how many entries are held. */
export function size(): number {
  return entries.size
}
