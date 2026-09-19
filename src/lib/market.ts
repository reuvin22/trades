import { ApiError, apiFetch } from './api'
import type { StoredTrade } from './trades'

/**
 * Candles for the chart on a trade record.
 *
 * The provider key lives in the API, so this asks the API — the browser never
 * learns who supplies the data. Everything here is public market fact and the
 * same for every trader, which is why the service caches it globally and why
 * nothing in this request identifies the account beyond the session cookie
 * that every request already carries.
 */

export type Candle = {
  /** Epoch milliseconds, as the provider sent it. */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type CandlesResult =
  | { state: 'ok'; candles: Candle[]; span: string }
  /** The provider has no bars for this symbol and window. Not a failure. */
  | { state: 'empty' }
  /** The deployment has no market data configured, or its plan lacks this. */
  | { state: 'unconfigured' }
  | { state: 'error'; message: string }

type Wire = {
  ticker: string
  span: string
  candles: Candle[]
  empty: boolean
}

/*
 * How much context to draw around the trade itself.
 *
 * A window clipped to the entry and exit puts the position hard against both
 * edges, which reads as a chart that has been cut off rather than as a trade
 * inside a session. Padding by the trade's own length keeps the proportion
 * right for a scalp and a swing alike, and the floor stops a ninety-second
 * trade asking for a ninety-second window — which is three bars.
 */
const PAD_RATIO = 0.6
const MIN_PAD_MS = 45 * 60 * 1000

/** The window to request for a trade, in epoch milliseconds. */
export function windowFor(trade: StoredTrade): { from: number; to: number } | null {
  const opened = new Date(trade.entryAt).getTime()
  if (Number.isNaN(opened)) return null

  const closedRaw = new Date(trade.exitAt).getTime()
  const closed =
    Number.isNaN(closedRaw) || closedRaw <= opened ? opened + MIN_PAD_MS : closedRaw

  const pad = Math.max((closed - opened) * PAD_RATIO, MIN_PAD_MS)
  return { from: Math.round(opened - pad), to: Math.round(closed + pad) }
}

export async function fetchCandles(
  trade: StoredTrade,
  signal?: AbortSignal,
): Promise<CandlesResult> {
  const ticker = trade.ticker.trim()
  if (!ticker) return { state: 'empty' }

  const range = windowFor(trade)
  if (range === null) return { state: 'empty' }

  try {
    const wire = await apiFetch<Wire>('/api/v1/market/candles', {
      query: { ticker, from: range.from, to: range.to },
      signal,
    })

    if (wire.empty || wire.candles.length === 0) return { state: 'empty' }
    return { state: 'ok', candles: wire.candles, span: wire.span }
  } catch (cause) {
    /*
     * An unconfigured deployment is the expected state, not an incident: the
     * feature is off until someone sets a provider key, and the chart quietly
     * falls back to drawing the position on its own. Saying "something went
     * wrong" there would be alarming about a decision somebody made.
     */
    if (cause instanceof ApiError) {
      if (cause.code === 'market_unconfigured' || cause.status === 403) {
        return { state: 'unconfigured' }
      }
      return { state: 'error', message: cause.message }
    }

    return { state: 'error', message: 'Could not load market data.' }
  }
}
