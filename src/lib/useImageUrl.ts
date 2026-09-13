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
