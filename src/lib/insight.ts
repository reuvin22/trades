import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch, readableApiError } from './api'

export type LeakResult = {
  title: string
  finding: string
  costLabel: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export type LeakState = {
  result: LeakResult | null
  loading: boolean
  /** Set when the model has nothing to work with yet. */
  needed: number | null
  have: number
  /** Null when the feature simply is not configured — not worth alarming over. */
  error: string | null
  unavailable: boolean
  refresh: () => void
}

type LeakWire = {
  result: {
    title: string
    finding: string
    cost_label: string
    severity: 'low' | 'medium' | 'high'
    recommendation: string
  } | null
  trade_count: number
  needed: number | null
}

/**
 * The model-written behavioural leak for the signed-in trader.
 *
 * `tradeCount` is a dependency rather than the trades themselves: the server
 * reads the journal directly, so the count is only here to re-run the request
 * when the journal actually changes. Nothing about the analysis is computed
 * here — a client that could supply the numbers could invent the finding.
 */
export function useBehavioralLeak(uid: string | null, tradeCount: number): LeakState {
  const [state, setState] = useState<{
    key: string | null
    result: LeakResult | null
    needed: number | null
    have: number
    error: string | null
    unavailable: boolean
  }>({
    key: null,
    result: null,
    needed: null,
    have: 0,
    error: null,
    unavailable: false,
  })

  const [nonce, setNonce] = useState(0)
  const key = uid === null ? null : `${uid}:${tradeCount}:${nonce}`

  useEffect(() => {
    if (!uid) return

    const abort = new AbortController()

    apiFetch<LeakWire>('/api/v1/insights/behavioral-leak', {
      query: { refresh: nonce > 0 ? 'true' : undefined },
      signal: abort.signal,
    })
      .then((body) =>
        setState({
          key,
          result: body.result
            ? {
                title: body.result.title,
                finding: body.result.finding,
                costLabel: body.result.cost_label,
                severity: body.result.severity,
                recommendation: body.result.recommendation,
              }
            : null,
          needed: body.needed,
          have: body.trade_count,
          error: null,
          unavailable: false,
        }),
      )
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return

        // 501 is "no model key on the server", which is a deployment choice
        // rather than a fault. The card hides itself instead of alarming.
        const notConfigured = cause instanceof ApiError && cause.status === 501
        setState((current) => ({
          ...current,
          key,
          unavailable: notConfigured,
          error: notConfigured ? null : readableApiError(cause),
        }))
      })

    return () => abort.abort()
  }, [uid, key, nonce])

  const fresh = state.key === key

  return {
    result: fresh ? state.result : null,
    loading: Boolean(uid) && !fresh,
    needed: fresh ? state.needed : null,
    have: fresh ? state.have : 0,
    error: fresh ? state.error : null,
    unavailable: fresh && state.unavailable,
    refresh: useCallback(() => setNonce((current) => current + 1), []),
  }
}
