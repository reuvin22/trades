import { useCallback, useEffect, useState } from 'react'
import { readCache, writeCache } from './cache'
import { apiFetch, date, fromIso, num, readableApiError, toIso } from './api'
import { SESSIONS } from '../data/tradeForm'
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
  sessions: TradingSession[]
  rationale: string
  stopLoss: number | null
  takeProfit: number | null
  screenshots: string[]
  netPl: number | null
  riskReward: number | null
  duration: string | null
  compliedEntry: string
  compliedExit: string
  compliedManagement: string
  emotionBefore: string
  emotionDuring: string
  mistakes: string[]
  notes: string
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

const SESSION_VALUES = new Set<string>(SESSIONS.map((entry) => entry.value))

/**
 * The sessions on a wire trade, in either shape.
 *
 * The API sends `sessions`; it used to send a single `session`, and the two
 * halves of this app deploy separately, so for the length of a rollout a
 * client can meet a server that has not shipped yet. Reading both means the
 * journal renders through that window instead of showing every trade as
 * session-less.
 *
 * Unknown values are dropped rather than passed through: a label this build
 * cannot name is worse than no label at all.
 */
function sessionsOf(wire: TradeWire): TradingSession[] {
  const raw = Array.isArray(wire.sessions)
    ? wire.sessions
    : wire.session
      ? [wire.session]
      : []

  return raw.filter((entry): entry is TradingSession =>
    SESSION_VALUES.has(entry as string),
  )
}

/**
 * The charts on a trade, whichever shape the server sent.
 *
 * Same treatment as sessions above, for the same reason: a trade filed
 * before charts could be plural holds one string under the old key.
 */
function screenshotsOf(wire: TradeWire): string[] {
  const raw = Array.isArray(wire.screenshots)
    ? wire.screenshots
    : wire.screenshot
      ? [wire.screenshot]
      : []

  return raw.filter((entry): entry is string => typeof entry === 'string' && entry !== '')
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
    sessions: sessionsOf(wire),
    rationale: String(wire.rationale ?? ''),
    stopLoss: num(wire.stop_loss),
    takeProfit: num(wire.take_profit),
    screenshots: screenshotsOf(wire),
    netPl: num(wire.net_pl),
    riskReward: num(wire.risk_reward),
    duration: holdTimeOf(entryAt, exitAt),
    compliedEntry: String(wire.complied_entry ?? ''),
    compliedExit: String(wire.complied_exit ?? ''),
    compliedManagement: String(wire.complied_management ?? ''),
    emotionBefore: String(wire.emotion_before ?? ''),
    emotionDuring: String(wire.emotion_during ?? ''),
    mistakes: Array.isArray(wire.mistakes) ? wire.mistakes.map(String) : [],
    notes: String(wire.notes ?? ''),
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
    sessions: trade.sessions,
    rationale: trade.rationale.trim(),
    stop_loss: toNumber(trade.stopLoss),
    take_profit: toNumber(trade.takeProfit),
    screenshots: trade.screenshots,
    complied_entry: trade.compliedEntry,
    complied_exit: trade.compliedExit,
    complied_management: trade.compliedManagement,
    emotion_before: trade.emotionBefore,
    emotion_during: trade.emotionDuring,
    mistakes: trade.mistakes,
    notes: trade.notes.trim(),
  }
}

/** How many entries one page carries. The journal views want everything. */
const PAGE_SIZE = 100

/** Every page, followed to the end. A journal is read whole by the charts. */
/**
 * Every page, as the API returned them.
 *
 * Wire rows rather than mapped ones because this is what gets cached, and
 * a cache of mapped objects would have to survive JSON — which turns the
 * dates back into strings. Callers map; the mapper is the one place that
 * knows the shape either way.
 */
async function fetchAll(signal?: AbortSignal): Promise<TradeWire[]> {
  const all: TradeWire[] = []
  let cursor: string | null = null

  do {
    const page: TradePage = await apiFetch<TradePage>('/api/v1/trades', {
      query: { limit: PAGE_SIZE, cursor: cursor ?? undefined },
      signal,
    })
    all.push(...page.items)
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

/**
 * Edits an existing entry.
 *
 * PATCH rather than PUT, and the whole form is sent: the API treats an absent
 * field as "leave alone", so a field the trader cleared has to arrive as an
 * explicit null rather than be omitted — which is exactly what toWire already
 * produces.
 */
export async function updateTrade(id: string, trade: TradeEntry): Promise<StoredTrade> {
  const saved = await apiFetch<TradeWire>(`/api/v1/trades/${id}`, {
    method: 'PATCH',
    body: toWire(trade),
  })
  return toStored(saved)
}

export function deleteTrade(id: string): Promise<null> {
  return apiFetch<null>(`/api/v1/trades/${id}`, { method: 'DELETE' })
}

/**
 * A stored entry back into the shape the form edits.
 *
 * The form holds every number as text, because a half-typed value is not a
 * number yet and forcing it through one loses what was typed. Null becomes an
 * empty string for the same reason: the input needs something to show.
 */
export function toEntry(trade: StoredTrade): TradeEntry {
  const text = (value: number | null) => (value === null ? '' : String(value))

  return {
    ticker: trade.ticker,
    direction: trade.direction,
    size: text(trade.size),
    sizeUnit: (trade.sizeUnit || 'Shares') as TradeEntry['sizeUnit'],
    entryPrice: text(trade.entryPrice),
    exitPrice: text(trade.exitPrice),
    entryAt: trade.entryAt,
    exitAt: trade.exitAt,
    setup: trade.setup,
    sessions: trade.sessions,
    rationale: trade.rationale,
    stopLoss: text(trade.stopLoss),
    takeProfit: text(trade.takeProfit),
    screenshots: trade.screenshots,
    netPl: text(trade.netPl),
    compliedEntry: trade.compliedEntry as TradeEntry['compliedEntry'],
    compliedExit: trade.compliedExit as TradeEntry['compliedExit'],
    compliedManagement: trade.compliedManagement as TradeEntry['compliedManagement'],
    emotionBefore: trade.emotionBefore,
    emotionDuring: trade.emotionDuring,
    mistakes: trade.mistakes,
    notes: trade.notes,
  }
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

  /*
   * Last session's rows, adopted during render rather than in an effect.
   *
   * In an effect this would paint an empty journal first and replace it a
   * frame later — the exact flash the cache exists to remove. Adjusting state
   * while rendering on a changed input is React's documented way to do this.
   */
  const [seeded, setSeeded] = useState<string | null>(null)
  if (uid && seeded !== uid) {
    setSeeded(uid)
    const cached = readCache<TradeWire[]>('trades', uid)
    if (cached) setState({ uid, trades: cached.map(toStored), error: null })
  }

  useEffect(() => {
    if (!uid) return

    const abort = new AbortController()

    fetchAll(abort.signal)
      .then((wires) => {
        writeCache('trades', uid, wires)
        setState({ uid, trades: wires.map(toStored), error: null })
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        // The cached rows stay on screen rather than being cleared behind an
        // error: stale rows a moment old beat an empty journal, and the
        // message says why nothing newer arrived.
        setState((current) =>
          current.uid === uid
            ? { ...current, error: readableApiError(cause) }
            : { uid, trades: [], error: readableApiError(cause) },
        )
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
