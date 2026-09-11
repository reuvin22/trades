import { useEffect, useState } from 'react'
import { apiFetch, readableApiError } from './api'

/**
 * Contact search, through the API.
 *
 * The client no longer queries a collection — it asks the service for matches,
 * and the service decides what one trader may learn about another. The minimum
 * prefix length is enforced there too: a one-character search returns an
 * arbitrary slice of the user base, which is enumeration however small the
 * page is.
 */

export type DirectoryEntry = {
  uid: string
  email: string
  displayName: string
  photoURL: string
}

type EntryWire = {
  uid: string
  email: string
  display_name: string
  photo_url: string
}

export function toEntry(wire: EntryWire): DirectoryEntry {
  return {
    uid: wire.uid,
    email: wire.email,
    displayName: wire.display_name,
    photoURL: wire.photo_url,
  }
}

/** Matches the floor the API enforces, so a short term never leaves the tab. */
const MIN_QUERY = 3

/** How long typing has to settle before a request goes out. */
const DEBOUNCE_MS = 250

export type DirectorySearch = {
  results: DirectoryEntry[]
  searching: boolean
  error: string | null
  /** Set when the term is too short to send. */
  hint: string | null
}

/** What came back, and which term it answers. */
type Settled = {
  term: string
  results: DirectoryEntry[]
  error: string | null
}

/**
 * Debounced directory search.
 *
 * `excludeUids` keeps anyone already in the contact list out of the results.
 * The caller is excluded by the API rather than here — a client-side filter is
 * a suggestion.
 *
 * The only state written is the settled answer, in the fetch callback.
 * "Searching" is not stored: it is simply the gap between what has been typed
 * and what has come back.
 */
export function useDirectorySearch(
  term: string,
  excludeUids: readonly string[],
): DirectorySearch {
  const [settled, setSettled] = useState<Settled>({
    term: '',
    results: [],
    error: null,
  })

  const needle = term.trim().toLowerCase()
  const tooShort = needle !== '' && needle.length < MIN_QUERY

  useEffect(() => {
    if (needle.length < MIN_QUERY) return

    const abort = new AbortController()

    const timer = window.setTimeout(() => {
      apiFetch<{ results: EntryWire[] }>('/api/v1/chat/directory', {
        query: { q: needle },
        signal: abort.signal,
      })
        .then((body) =>
          setSettled({ term: needle, results: body.results.map(toEntry), error: null }),
        )
        .catch((cause: unknown) => {
          if (abort.signal.aborted) return
          setSettled({ term: needle, results: [], error: readableApiError(cause) })
        })
    }, DEBOUNCE_MS)

    return () => {
      abort.abort()
      window.clearTimeout(timer)
    }
  }, [needle])

  const answered = settled.term === needle
  const skip = new Set(excludeUids)

  return {
    results: answered ? settled.results.filter((entry) => !skip.has(entry.uid)) : [],
    searching: !tooShort && needle !== '' && !answered,
    error: answered ? settled.error : null,
    hint: tooShort ? 'Type at least three characters.' : null,
  }
}
