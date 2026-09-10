import { useCallback, useEffect, useState } from 'react'
import { auth } from './firebase'

export type LeakResult = {
  title: string
  finding: string
  costLabel: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export type LeakState = {
  result: LeakResult | null
  generatedAt: Date | null
  loading: boolean
  /** Set when the model has nothing to work with yet. */
  needed: number | null
  have: number
  /** Null when the feature simply is not configured — not worth alarming over. */
  error: string | null
  unavailable: boolean
  refresh: () => void
}

type Payload = {
  status?: 'ok' | 'insufficient'
  result?: LeakResult
  generatedAt?: string
  needed?: number
  have?: number
  error?: string
}

/**
 * Fetches the Gemini-written behavioural leak for the signed-in trader.
 *
 * `tradeCount` is a dependency rather than the trades themselves: the server
 * reads the journal directly, so the count is only here to re-run the request
 * when the journal actually changes.
 */
export function useBehavioralLeak(uid: string | null, tradeCount: number): LeakState {
  const [state, setState] = useState<{
    key: string | null
    result: LeakResult | null
    generatedAt: Date | null
    needed: number | null
    have: number
    error: string | null
    unavailable: boolean
  }>({
    key: null,
    result: null,
    generatedAt: null,
    needed: null,
    have: 0,
    error: null,
    unavailable: false,
  })

  const [nonce, setNonce] = useState(0)
  const key = uid === null ? null : `${uid}:${tradeCount}:${nonce}`

  useEffect(() => {
    if (!uid || !auth?.currentUser) return

    let live = true

    async function load() {
      try {
        const token = await auth!.currentUser!.getIdToken()
        const response = await fetch('/api/behavioral-leak', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({ refresh: nonce > 0 }),
        })

        // No handler deployed: the server answers with the SPA shell.
        const isJson = response.headers.get('content-type')?.includes('json')
        if (!isJson || response.status === 404 || response.status === 501) {
          if (live) {
            setState((current) => ({ ...current, key, unavailable: true, error: null }))
          }
          return
        }

        const payload = (await response.json()) as Payload

        if (!live) return

        if (!response.ok) {
          setState((current) => ({
            ...current,
            key,
            error: payload.error ?? 'Could not generate the analysis.',
          }))
          return
        }

        if (payload.status === 'insufficient') {
          setState({
            key,
            result: null,
            generatedAt: null,
            needed: payload.needed ?? null,
            have: payload.have ?? 0,
            error: null,
            unavailable: false,
          })
          return
        }

        setState({
          key,
          result: payload.result ?? null,
          generatedAt: payload.generatedAt ? new Date(payload.generatedAt) : null,
          needed: null,
          have: tradeCount,
          error: null,
          unavailable: false,
        })
      } catch {
        if (live) setState((current) => ({ ...current, key, unavailable: true }))
      }
    }

    void load()
    return () => {
      live = false
    }
  }, [uid, tradeCount, nonce, key])

  const refresh = useCallback(() => setNonce((value) => value + 1), [])

  // Derived rather than stored, so a changing journal never shows stale text.
  const fresh = state.key === key

  return {
    result: fresh ? state.result : null,
    generatedAt: fresh ? state.generatedAt : null,
    loading: uid !== null && !fresh,
    needed: fresh ? state.needed : null,
    have: fresh ? state.have : 0,
    error: fresh ? state.error : null,
    unavailable: fresh ? state.unavailable : false,
    refresh,
  }
}
