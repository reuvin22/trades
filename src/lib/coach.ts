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

/** Locally a missing API means the dev server is not serving api/; deployed it
 *  never does, so the advice has to differ. */
const IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

/**
 * The coach answered with something that is not JSON.
 *
 * Deployed, that is the host's own error page — a timeout, a crashed function,
 * a route that is not there — and the status is the only thing that says which.
 * Telling a deployed user to run `npm run dev` is noise; they cannot act on it.
 */
function describeNonJson(status: number): string {
  if (status === 504 || status === 408) {
    return 'The coach took too long to answer and the request was cut off. Ask again — a shorter question usually comes back in time.'
  }

  if (status === 429) {
    return 'Too many requests just now. Give it a moment and ask again.'
  }

  if (status === 404) {
    return IS_LOCAL
      ? 'The coach API is not running. Start the app with npm run dev rather than a static preview.'
      : 'The coach is not available on this deployment. Its serverless function did not build.'
  }

  if (status >= 500) {
    return 'The coach hit a server error. Try again in a moment.'
  }

  return 'The coach sent back a reply we could not read. Try again in a moment.'
}

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
          setError(describeNonJson(response.status))
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
