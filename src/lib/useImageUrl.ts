import { useEffect, useState } from 'react'
import { imageUrl } from './uploads'

/**
 * A stored image key, resolved to something an `<img>` can load.
 *
 * Needed because the bucket is private: what the app stores is a key, and the
 * URL that reads it is signed and short-lived. A component cannot simply put
 * the stored value in `src`.
 *
 * A pasted http(s) link passes through untouched — the screenshot field takes
 * either, and a link to TradingView is not ours to sign.
 *
 * Returns null while it resolves and if it fails. A missing image is a gap in
 * a card; a broken one is a broken-image icon, which looks like a bug in a way
 * the gap does not.
 */
export function useImageUrl(key: string | null | undefined): string | null {
  /*
   * The key is stored alongside its URL, rather than cleared when the key
   * changes.
   *
   * Clearing would mean setting state synchronously inside the effect, which
   * renders twice and is the thing `set-state-in-effect` is there to catch.
   * Keeping the pair lets the stale result be filtered out on the way back
   * instead — one render, and no window where a new key shows the old image.
   */
  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null)

  useEffect(() => {
    if (!key) return

    let live = true

    imageUrl(key)
      .then((url) => {
        if (live) setResolved({ key, url })
      })
      .catch(() => {
        // Silent: the caller renders its own fallback, and an avatar that
        // failed to resolve is not worth an error message.
      })

    return () => {
      live = false
    }
  }, [key])

  return key && resolved?.key === key ? resolved.url : null
}

/**
 * Several keys at once, resolved together.
 *
 * Needed wherever a set of pictures is shown as a set — a trade's charts open
 * into one viewer that steps between them, so every URL has to exist before
 * any of them is clicked. Calling the single hook in a loop is not an option:
 * the number of keys changes between renders, and hooks may not.
 *
 * Returns a list the same length and order as the keys given, holding null in
 * each slot that has not resolved or could not be signed.
 */
export function useImageUrls(keys: string[]): (string | null)[] {
  const [resolved, setResolved] = useState<Record<string, string>>({})

  /*
   * The effect is keyed on the contents rather than the array.
   *
   * Callers build this list inline, so its identity changes on every render;
   * depending on it directly would re-sign every URL each time and never
   * settle. A separator no key can contain makes the join unambiguous.
   */
  const signature = keys.join('\u0000')

  useEffect(() => {
    if (signature === '') return

    let live = true
    const wanted = signature.split('\u0000')

    Promise.all(
      wanted.map((key) =>
        imageUrl(key)
          .then((url) => [key, url] as const)
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (!live) return

      const next: Record<string, string> = {}
      for (const pair of pairs) {
        if (pair) next[pair[0]] = pair[1]
      }
      setResolved(next)
    })

    return () => {
      live = false
    }
  }, [signature])

  return keys.map((key) => resolved[key] ?? null)
}
