import { useCallback, useState } from 'react'
import { auth } from './firebase'

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

export function useCoach(language: string): CoachState {
  const [turns, setTurns] = useState<CoachTurn[]>([])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim()
      if (trimmed === '' || !auth?.currentUser) return

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
        const token = await auth.currentUser.getIdToken()
        const response = await fetch('/api/coach-chat', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            message: trimmed,
            language,
            history: history.map((turn) => ({ role: turn.role, text: turn.text })),
          }),
        })

        const isJson = response.headers.get('content-type')?.includes('json')
        if (!isJson) {
          setError(
            'The coach needs the API running. Use npm run dev (or deploy) rather than a static preview.',
          )
          return
        }

        const payload = (await response.json()) as { reply?: string; error?: string }

        if (!response.ok || !payload.reply) {
          setError(payload.error ?? 'The coach could not answer just now.')
          return
        }

        setTurns((current) => [
          ...current,
          { id: nextId(), role: 'coach', text: payload.reply as string },
        ])
      } catch {
        setError('Could not reach the coach. Check your connection.')
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
