import { useCallback, useState } from 'react'
import { apiFetch, readableApiError } from './api'

export type CoachTurn = {
  id: string
  role: 'user' | 'coach'
  text: string
}

/** Offered on the first visit; the choice is stored on the profile. */
export const LANGUAGES = [
  { code: 'English', label: 'English', native: 'English' },
  { code: 'Filipino', label: 'Filipino', native: 'Tagalog' },
  { code: 'Spanish', label: 'Spanish', native: 'Español' },
  { code: 'Bahasa Indonesia', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'Simplified Chinese', label: 'Chinese', native: '简体中文' },
  { code: 'Japanese', label: 'Japanese', native: '日本語' },
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
  reset: () => void
}

/**
 * The AI coach, through the API.
 *
 * Only the shape of the conversation is sent. Every *fact* the coach uses —
 * the trades, the numbers, the patterns — is read from the journal on the
 * server, so a forged history cannot invent trades that were never logged.
 * The model key lives on the server and has never been in this bundle.
 */
export function useCoach(language: string): CoachState {
  const [turns, setTurns] = useState<CoachTurn[]>([])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim()
      if (trimmed === '') return

      const mine: CoachTurn = { id: nextId(), role: 'user', text: trimmed }

      // Capture the history before this turn so a failed send can be retried.
      let history: CoachTurn[] = []
      setTurns((current) => {
        history = current
        return [...current, mine]
      })

      setThinking(true)
      setError(null)

      try {
        const reply = await apiFetch<{ reply: string }>('/api/v1/coach/chat', {
          method: 'POST',
          body: {
            message: trimmed,
            language,
            history: history.map((turn) => ({ role: turn.role, text: turn.text })),
          },
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

  const reset = useCallback(() => {
    setTurns([])
    setError(null)
  }, [])

  return { turns, thinking, error, send, reset }
}
