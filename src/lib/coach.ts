import { useCallback, useEffect, useState } from 'react'
import { apiFetch, readableApiError } from './api'

export type CoachTurn = {
  id: string
  role: 'user' | 'coach'
  text: string
}

/** Offered on first visit and whenever the trader reopens the picker; the
 *  choice is stored on the profile. */
export const LANGUAGES = [
  { code: 'English', label: 'English', native: 'English' },
  { code: 'Filipino', label: 'Filipino', native: 'Tagalog' },
  { code: 'Spanish', label: 'Spanish', native: 'Español' },
  { code: 'Bahasa Indonesia', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'Simplified Chinese', label: 'Chinese', native: '简体中文' },
  { code: 'Japanese', label: 'Japanese', native: '日本語' },
  { code: 'Korean', label: 'Korean', native: '한국어' },
  { code: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'Portuguese', label: 'Portuguese', native: 'Português' },
  { code: 'French', label: 'French', native: 'Français' },
  { code: 'German', label: 'German', native: 'Deutsch' },
]

let counter = 0
function nextId() {
  counter += 1
  return `turn-${Date.now()}-${counter}`
}

export type CoachState = {
  turns: CoachTurn[]
  thinking: boolean
  error: string | null
  send: (message: string) => Promise<void>
  /** True until the stored conversation has been fetched. */
  loading: boolean
  reset: () => Promise<void>
}

/**
 * The AI coach, through the API.
 *
 * Only the new message is sent. Every *fact* the coach uses — the trades, the
 * numbers, the patterns — is read from the journal on the server, and so now
 * is the conversation itself, so nothing this bundle holds can invent a trade
 * that was never logged or a reply the coach never gave.
 * The model key lives on the server and has never been in this bundle.
 */
export function useCoach(language: string): CoachState {
  const [turns, setTurns] = useState<CoachTurn[]>([])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // What was said last time. The conversation used to live only in this state,
  // so a refresh erased it and the coach began again knowing nothing — the
  // trader had to re-explain themselves to get back to where they were.
  useEffect(() => {
    let live = true

    apiFetch<{ turns: { role: CoachTurn['role']; text: string }[] }>(
      '/api/v1/coach/conversation',
    )
      .then((body) => {
        if (!live) return
        setTurns(body.turns.map((turn) => ({ ...turn, id: nextId() })))
      })
      // Silent on purpose: an empty thread is a working page. Shouting about a
      // history that could not be loaded would be the first thing they see.
      .catch(() => undefined)
      .finally(() => {
        if (live) setLoading(false)
      })

    return () => {
      live = false
    }
  }, [])

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim()
      if (trimmed === '') return

      const mine: CoachTurn = { id: nextId(), role: 'user', text: trimmed }
      setTurns((current) => [...current, mine])

      setThinking(true)
      setError(null)

      try {
        // No history in the body. The server keeps the conversation and reads
        // its own copy, which is what lets it survive a refresh.
        const reply = await apiFetch<{ reply: string }>('/api/v1/coach/chat', {
          method: 'POST',
          body: { message: trimmed, language },
        })

        setTurns((current) => [
          ...current,
          { id: nextId(), role: 'coach', text: reply.reply },
        ])
      } catch (cause) {
        setError(readableApiError(cause))
      } finally {
        setThinking(false)
      }
    },
    [language],
  )

  /** Forget the conversation, on the server as well — otherwise it would be
   *  back on the next refresh. */
  const reset = useCallback(async () => {
    setTurns([])
    setError(null)

    try {
      await apiFetch('/api/v1/coach/conversation', { method: 'DELETE' })
    } catch (cause) {
      setError(readableApiError(cause))
    }
  }, [])

  return { turns, thinking, error, loading, send, reset }
}
