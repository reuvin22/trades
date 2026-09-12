import { useCallback, useEffect, useState } from 'react'
import { apiFetch, date, fromIso, num, readableApiError, toIso } from './api'
import type { TradeEntry, TradingSession } from '../data/tradeForm'

/**
 * The journal, through the API.
 *
 * The three derived figures — net P&L, R:R and hold time — are no longer
 * computed here. The server works them out from entry, exit and size, which is
 * the only way they can be trusted: a figure the caller can set is a figure
 * that can be made up, and every statistic in the product is built on them.
 */

/** One journal entry, as the client renders it. */
export type StoredTrade = {
  id: string
  ticker: string
  direction: 'Long' | 'Short'
  size: number | null
  sizeUnit: string
  entryPrice: number | null
  exitPrice: number | null
  entryAt: string
  exitAt: string
  setup: string
  session: TradingSession
  rationale: string
  stopLoss: number | null
  takeProfit: number | null
  screenshot: string
  netPl: number | null
  riskReward: number | null
  duration: string | null
  compliedEntry: string
  compliedExit: string
  compliedManagement: string
  emotionBefore: string
  emotionDuring: string
  mistakes: string[]
  createdAt: Date | null
}

/** The wire shape: snake_case, with numbers that may arrive as strings. */
type TradeWire = Record<string, unknown>

type TradePage = {
  items: TradeWire[]
  next_cursor: string | null
}

/** How long a trade was held, from the two timestamps the server returned. */
function holdTimeOf(entryAt: string, exitAt: string): string | null {
  const opened = date(entryAt)
  const closed = date(exitAt)
  if (!opened || !closed) return null

  const minutes = Math.round((closed.getTime() - opened.getTime()) / 60_000)
  if (minutes < 0) return null
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}

function toStored(wire: TradeWire): StoredTrade {
  const entryAt = fromIso(wire.entry_at)
  const exitAt = fromIso(wire.exit_at)

  return {
    id: String(wire.id ?? ''),
    ticker: String(wire.ticker ?? ''),
    direction: wire.direction === 'Short' ? 'Short' : 'Long',
    size: num(wire.size),
    sizeUnit: String(wire.size_unit ?? 'Shares'),
    entryPrice: num(wire.entry_price),
    exitPrice: num(wire.exit_price),
    entryAt,
    exitAt,
    setup: String(wire.setup ?? ''),
    session: (wire.session ?? '') as TradingSession,
    rationale: String(wire.rationale ?? ''),
    stopLoss: num(wire.stop_loss),
    takeProfit: num(wire.take_profit),
    screenshot: String(wire.screenshot ?? ''),
    netPl: num(wire.net_pl),
    riskReward: num(wire.risk_reward),
    duration: holdTimeOf(entryAt, exitAt),
    compliedEntry: String(wire.complied_entry ?? ''),
    compliedExit: String(wire.complied_exit ?? ''),
    compliedManagement: String(wire.complied_management ?? ''),
    emotionBefore: String(wire.emotion_before ?? ''),
    emotionDuring: String(wire.emotion_during ?? ''),
    mistakes: Array.isArray(wire.mistakes) ? wire.mistakes.map(String) : [],
    createdAt: date(wire.created_at),
  }
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** The form entry as the API expects it. No derived figures: those are the
 *  server's to decide, and it refuses a body that tries to set them. */
function toWire(trade: TradeEntry): Record<string, unknown> {
  return {
    ticker: trade.ticker.trim(),
    direction: trade.direction,
    size: toNumber(trade.size),
    size_unit: trade.sizeUnit,
    entry_price: toNumber(trade.entryPrice),
    exit_price: toNumber(trade.exitPrice),
    entry_at: toIso(trade.entryAt),
    exit_at: toIso(trade.exitAt),
    setup: trade.setup.trim(),
    session: trade.session,
    rationale: trade.rationale.trim(),
    stop_loss: toNumber(trade.stopLoss),
    take_profit: toNumber(trade.takeProfit),
    screenshot: trade.screenshot.trim(),
    complied_entry: trade.compliedEntry,
    complied_exit: trade.compliedExit,
    complied_management: trade.compliedManagement,
    emotion_before: trade.emotionBefore,
    emotion_during: trade.emotionDuring,
    mistakes: trade.mistakes,
  }
}

/** How many entries one page carries. The journal views want everything. */
const PAGE_SIZE = 100

/** Every page, followed to the end. A journal is read whole by the charts. */
async function fetchAll(signal?: AbortSignal): Promise<StoredTrade[]> {
  const all: StoredTrade[] = []
  let cursor: string | null = null

  do {
    const page: TradePage = await apiFetch<TradePage>('/api/v1/trades', {
      query: { limit: PAGE_SIZE, cursor: cursor ?? undefined },
      signal,
    })
    all.push(...page.items.map(toStored))
    cursor = page.next_cursor
  } while (cursor !== null)

  return all
}

export async function saveTrade(trade: TradeEntry): Promise<StoredTrade> {
  const created = await apiFetch<TradeWire>('/api/v1/trades', {
    method: 'POST',
    body: toWire(trade),
  })
  return toStored(created)
}

export function deleteTrade(id: string): Promise<null> {
  return apiFetch<null>(`/api/v1/trades/${id}`, { method: 'DELETE' })
}

export type TradesState = {
  trades: StoredTrade[]
  loading: boolean
  error: string | null
  /** Re-reads the journal. Called after a write, since there is no longer a
   *  live listener to push the change back. */
  reload: () => void
}

/**
 * The signed-in trader's journal, newest first.
 *
 * Fetched rather than streamed. Firestore's realtime listener is gone with the
 * direct SDK, and deliberately: a client that can subscribe to a collection is
 * a client with credentials for it. Writes call `reload`, which is what keeps
 * the views current without a socket.
 */
export function useTrades(uid: string | null): TradesState {
  const [state, setState] = useState<{
    uid: string | null
    trades: StoredTrade[]
    error: string | null
  }>({ uid: null, trades: [], error: null })

  const [nonce, setNonce] = useState(0)
  const reload = useCallback(() => setNonce((current) => current + 1), [])

  useEffect(() => {
    if (!uid) return

    const abort = new AbortController()

    fetchAll(abort.signal)
      .then((trades) => setState({ uid, trades, error: null }))
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setState({ uid, trades: [], error: readableApiError(cause) })
      })

    return () => abort.abort()
  }, [uid, nonce])

  // Derived rather than stored, so switching accounts never shows stale rows.
  const fresh = state.uid === uid

  return {
    trades: fresh ? state.trades : [],
    loading: Boolean(uid) && !fresh,
    error: fresh ? state.error : null,
    reload,
  }
}
