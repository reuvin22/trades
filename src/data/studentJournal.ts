/**
 * A journal for each student, generated rather than typed out.
 *
 * The roster and the student's own page have to agree — a row saying 54% that
 * opens onto a page saying 61% is worse than either screen alone. So there is
 * one source here, a list of trades, and both screens run the product's real
 * `deriveStats` over it. Nothing on either screen is a figure somebody typed.
 *
 * Deterministic: the generator is seeded from the uid, so a student's journal
 * is the same on every render, every reload and in every tab. That matters
 * more than it sounds — a roster that reshuffled its own numbers between
 * renders would be impossible to look at.
 *
 * All of this is scaffolding. There is no endpoint that returns another
 * trader's journal, and there should not be a casual one: the API's whole
 * shape is that a caller reads their own uid and no other. Whatever
 * eventually serves this will be an explicit, consented coach-student grant,
 * not a uid in a query string.
 */

import { EMOTIONS, SETUPS, type TradingSession } from './tradeForm'
import type { StoredTrade } from '../lib/trades'

/** How a given student trades. Seeded so it never moves under you. */
type Temperament = {
  /** How many trades are in their journal. */
  count: number
  /** Share of closed trades that win, 0–1. */
  winRate: number
  /** Typical win, in account currency. Losses are scaled off this. */
  averageWin: number
  /** Losses as a multiple of the average win. Above 1 means poor cutting. */
  lossRatio: number
  /** Share of trades where every rule was followed, 0–1. */
  adherence: number
  tickers: string[]
  setups: string[]
}

export const TEMPERAMENTS: Record<string, Temperament> = {
  's-mia': {
    count: 128,
    winRate: 0.54,
    averageWin: 410,
    lossRatio: 0.72,
    adherence: 0.91,
    tickers: ['NAS100', 'US30', 'SPX500', 'GER40'],
    setups: ['London Breakout', 'VWAP Reclaim', 'Continuation', 'Daily Pivot'],
  },
  's-ade': {
    count: 203,
    winRate: 0.49,
    averageWin: 372,
    lossRatio: 0.63,
    adherence: 0.88,
    tickers: ['NAS100', 'XAUUSD', 'US30'],
    setups: ['Breakout', 'Momentum Gap', 'Bull Flag', 'VWAP Bounce'],
  },
  's-priya': {
    count: 61,
    winRate: 0.44,
    averageWin: 288,
    lossRatio: 1.18,
    adherence: 0.62,
    tickers: ['NQ', 'ES', 'RTY'],
    setups: ['Mean Reversion', 'Overextended', 'Gap & Go'],
  },
  's-jae': {
    count: 37,
    winRate: 0.51,
    averageWin: 196,
    lossRatio: 0.94,
    adherence: 0.77,
    tickers: ['EURUSD', 'GBPUSD', 'USDJPY'],
    setups: ['London Breakout', 'Daily Pivot', 'Continuation'],
  },
  's-nadia': {
    count: 12,
    winRate: 0.33,
    averageWin: 140,
    lossRatio: 1.42,
    adherence: 0.58,
    tickers: ['EURUSD', 'XAUUSD'],
    setups: ['Breakout', 'Mean Reversion'],
  },
  's-tom': {
    count: 4,
    winRate: 0.25,
    averageWin: 90,
    lossRatio: 1.8,
    adherence: 0.41,
    tickers: ['BTCUSD', 'ETHUSD'],
    setups: ['Momentum Gap', 'Overextended'],
  },
}

const FALLBACK: Temperament = {
  count: 24,
  winRate: 0.48,
  averageWin: 220,
  lossRatio: 1,
  adherence: 0.7,
  tickers: ['NAS100'],
  setups: ['Breakout'],
}

/** FNV-1a, so two similar uids do not produce two similar journals. */
function seedFrom(text: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash || 1
}

/** mulberry32: small, fast, and good enough for numbers nobody bets on. */
function random(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sessionFor(hour: number): TradingSession {
  if (hour < 7) return 'asia'
  return hour < 13 ? 'london' : 'newyork'
}

/**
 * Exactly `share` of `count` as true, shuffled.
 *
 * A quota rather than a coin flipped `count` times. An independent draw is the
 * obvious way to do this and it is wrong here: at twelve trades a 33% student
 * lands on 25% or 50% as readily as 33%, and the roster then shows a
 * "Foundation" trader out-performing a "Consistent" one for no reason anybody
 * can see. The point of these figures is to illustrate a level, so the level
 * is what they are built from.
 */
function quota(count: number, share: number, next: () => number): boolean[] {
  const hits = Math.round(count * share)
  const flags = Array.from({ length: count }, (_, index) => index < hits)

  // Fisher-Yates, on the same stream, so the whole journal stays deterministic.
  for (let index = flags.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1))
    ;[flags[index], flags[swap]] = [flags[swap], flags[index]]
  }

  return flags
}

function build(uid: string): StoredTrade[] {
  const temperament = TEMPERAMENTS[uid] ?? FALLBACK
  const next = random(seedFrom(uid))
  const trades: StoredTrade[] = []

  // Outcomes and rule answers are drawn as quotas up front, so a student's
  // headline numbers say what their level says. Four independent streams, so
  // the three rule bars differ from one another rather than moving together.
  const won = quota(temperament.count, temperament.winRate, next)
  const keptEntry = quota(temperament.count, temperament.adherence, next)
  const keptExit = quota(temperament.count, temperament.adherence, next)
  const keptManagement = quota(temperament.count, temperament.adherence, next)

  // Spread the journal back from today, roughly one trading day at a time,
  // skipping weekends so the calendar and the curve look like a real record.
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (let index = 0; index < temperament.count; index += 1) {
    // Some days carry two trades, most carry one.
    if (next() > 0.28) {
      cursor.setDate(cursor.getDate() - 1)
      while (cursor.getDay() === 0 || cursor.getDay() === 6) {
        cursor.setDate(cursor.getDate() - 1)
      }
    }

    const hour = 7 + Math.floor(next() * 9)
    const minute = Math.floor(next() * 60)
    const entry = new Date(cursor)
    entry.setHours(hour, minute, 0, 0)

    const heldMinutes = 8 + Math.floor(next() * 220)
    const exit = new Date(entry.getTime() + heldMinutes * 60_000)

    // Spread either side of the average so the curve has texture rather than
    // a staircase of identical steps.
    const spread = 0.45 + next() * 1.3
    const netPl = won[index]
      ? Math.round(temperament.averageWin * spread)
      : -Math.round(temperament.averageWin * temperament.lossRatio * spread)

    const ticker = temperament.tickers[Math.floor(next() * temperament.tickers.length)]
    const setup = temperament.setups[Math.floor(next() * temperament.setups.length)]
    const direction = next() > 0.45 ? 'Long' : 'Short'

    const entryPrice = Math.round((80 + next() * 19_000) * 100) / 100
    const riskReward = Math.round((0.6 + next() * 2.8) * 100) / 100

    trades.push({
      id: `${uid}-t${index}`,
      ticker,
      direction,
      size: Math.round((0.2 + next() * 4) * 100) / 100,
      sizeUnit: 'Contracts',
      entryPrice,
      // Derived from the result so the price, the direction and the P&L do not
      // contradict each other on the trade row.
      exitPrice:
        Math.round(
          (direction === 'Long'
            ? entryPrice + netPl / 100
            : entryPrice - netPl / 100) * 100,
        ) / 100,
      entryAt: entry.toISOString(),
      exitAt: exit.toISOString(),
      setup,
      sessions: [sessionFor(hour)],
      rationale: '',
      stopLoss: null,
      takeProfit: null,
      screenshots: [],
      netPl,
      riskReward,
      duration: null,
      compliedEntry: keptEntry[index] ? 'yes' : 'no',
      compliedExit: keptExit[index] ? 'yes' : 'no',
      compliedManagement: keptManagement[index] ? 'yes' : 'no',
      emotionBefore: EMOTIONS[Math.floor(next() * EMOTIONS.length)],
      emotionDuring: EMOTIONS[Math.floor(next() * EMOTIONS.length)],
      mistakes: keptEntry[index]
        ? []
        : ['Moved stop', 'Sized up after a loss'].slice(0, 1 + Math.floor(next() * 2)),
      notes: '',
      createdAt: entry,
    })
  }

  /*
   * Newest first, which is the order the API returns and every consumer here
   * expects — a "recent trades" table slicing the front of an oldest-first
   * list would show the oldest.
   *
   * Sorted rather than assumed. The cursor walks backwards, so the journal is
   * very nearly in order already, but days carrying two trades draw an hour
   * each independently and the later one can land second.
   */
  return trades.sort(
    (a, b) => new Date(b.entryAt).getTime() - new Date(a.entryAt).getTime(),
  )
}

/**
 * Built once per student and kept.
 *
 * The roster derives a figure per row, so without this the whole set would be
 * regenerated on every keystroke in a filter box.
 */
const cache = new Map<string, StoredTrade[]>()

export function journalFor(uid: string): StoredTrade[] {
  const held = cache.get(uid)
  if (held !== undefined) return held

  const built = build(uid)
  cache.set(uid, built)
  return built
}

/** The setups a student has actually traded, for the unsupported-uid case. */
export const ALL_SETUPS = SETUPS
