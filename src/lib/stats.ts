import type { StoredTrade } from './trades'

/** Where an account curve starts before any trade is applied. */
export const OPENING_BALANCE = 10000

export type EquityPoint = {
  date: Date
  value: number
  /** Cumulative index, used when a run has no usable timestamps. */
  index: number
}

export type SetupSlice = {
  label: string
  share: number
  wins: number
  count: number
}

export type DerivedStats = {
  tradeCount: number
  closedCount: number
  netPl: number
  todayPl: number
  todayCount: number
  winRate: number
  avgR: number
  profitFactor: number
  expectancy: number
  maxDrawdownPct: number
  maxDrawdownAt: Date | null
  avgHoldMinutes: number
  monthPct: number
  equity: EquityPoint[]
  dailyPl: Map<string, number>
  setups: SetupSlice[]
  bestSetup: SetupSlice | null
  fatigueAfterHour: number | null
  fatigueExpectancy: number
}

const DAY_KEY = new Intl.DateTimeFormat('en-CA') // YYYY-MM-DD, stable for keys

export function dayKey(date: Date): string {
  return DAY_KEY.format(date)
}

/** A trade is dated by its entry, falling back to when it was written. */
export function tradeDate(trade: StoredTrade): Date | null {
  if (trade.entryAt) {
    const parsed = new Date(trade.entryAt)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return trade.createdAt
}

function holdMinutes(trade: StoredTrade): number | null {
  if (!trade.entryAt || !trade.exitAt) return null
  const opened = new Date(trade.entryAt).getTime()
  const closed = new Date(trade.exitAt).getTime()
  if (Number.isNaN(opened) || Number.isNaN(closed) || closed <= opened) return null
  return (closed - opened) / 60000
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}

export function deriveStats(trades: StoredTrade[]): DerivedStats {
  // The API hands these back newest-first; every calculation below wants the
  // opposite, so sort once here rather than reversing at each use.
  const ordered = [...trades].sort((a, b) => {
    const left = tradeDate(a)?.getTime() ?? 0
    const right = tradeDate(b)?.getTime() ?? 0
    return left - right
  })

  const closed = ordered.filter((trade) => trade.netPl !== null)
  const wins = closed.filter((trade) => (trade.netPl ?? 0) > 0)
  const losses = closed.filter((trade) => (trade.netPl ?? 0) < 0)

  const netPl = closed.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)
  const grossProfit = wins.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0))

  const today = dayKey(new Date())
  const dailyPl = new Map<string, number>()
  let todayPl = 0
  let todayCount = 0

  for (const trade of closed) {
    const when = tradeDate(trade)
    if (!when) continue

    const key = dayKey(when)
    dailyPl.set(key, (dailyPl.get(key) ?? 0) + (trade.netPl ?? 0))

    if (key === today) {
      todayPl += trade.netPl ?? 0
      todayCount++
    }
  }

  // Equity curve, plus the deepest peak-to-trough dip along the way.
  const equity: EquityPoint[] = []
  let running = OPENING_BALANCE
  let peak = OPENING_BALANCE
  let maxDrawdownPct = 0
  let maxDrawdownAt: Date | null = null

  closed.forEach((trade, index) => {
    running += trade.netPl ?? 0
    const when = tradeDate(trade) ?? new Date()
    equity.push({ date: when, value: running, index })

    if (running > peak) peak = running
    const dip = peak === 0 ? 0 : ((peak - running) / peak) * 100
    if (dip > maxDrawdownPct) {
      maxDrawdownPct = dip
      maxDrawdownAt = when
    }
  })

  // Month-on-month change against the balance at the start of this month.
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const beforeMonth = equity.filter((point) => point.date < monthStart)
  const openingThisMonth =
    beforeMonth.length > 0 ? beforeMonth[beforeMonth.length - 1].value : OPENING_BALANCE
  const closingNow = equity.length > 0 ? equity[equity.length - 1].value : OPENING_BALANCE
  const monthPct =
    openingThisMonth === 0 ? 0 : ((closingNow - openingThisMonth) / openingThisMonth) * 100

  // Setup distribution, largest share first.
  const bySetup = new Map<string, { count: number; wins: number }>()
  for (const trade of ordered) {
    const label = trade.setup?.trim() || 'Unlabelled'
    const entry = bySetup.get(label) ?? { count: 0, wins: 0 }
    entry.count++
    if ((trade.netPl ?? 0) > 0) entry.wins++
    bySetup.set(label, entry)
  }

  const setups: SetupSlice[] = [...bySetup.entries()]
    .map(([label, entry]) => ({
      label,
      count: entry.count,
      wins: entry.wins,
      share: ordered.length === 0 ? 0 : (entry.count / ordered.length) * 100,
    }))
    .sort((a, b) => b.share - a.share)

  const bestSetup =
    setups.filter((slice) => slice.count >= 3).sort((a, b) => b.wins / b.count - a.wins / a.count)[0] ??
    setups[0] ??
    null

  // Afternoon fatigue: expectancy on trades entered after 14:00 local.
  const late = closed.filter((trade) => {
    const when = tradeDate(trade)
    return when !== null && when.getHours() >= 14
  })

  return {
    tradeCount: ordered.length,
    closedCount: closed.length,
    netPl,
    todayPl,
    todayCount,
    winRate: closed.length === 0 ? 0 : (wins.length / closed.length) * 100,
    avgR: mean(
      ordered.map((trade) => trade.riskReward).filter((value): value is number => value !== null),
    ),
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss,
    expectancy: closed.length === 0 ? 0 : netPl / closed.length,
    maxDrawdownPct,
    maxDrawdownAt,
    avgHoldMinutes: mean(
      ordered.map(holdMinutes).filter((value): value is number => value !== null),
    ),
    monthPct,
    equity,
    dailyPl,
    setups,
    bestSetup,
    fatigueAfterHour: late.length > 0 ? 14 : null,
    fatigueExpectancy: late.length === 0 ? 0 : mean(late.map((trade) => trade.netPl ?? 0)),
  }
}

/** Formats a minute count as `14h 22m`, or `—` when there is nothing to show. */
export function formatHold(minutes: number): string {
  if (minutes <= 0) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}

export function formatFactor(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  return value.toFixed(2)
}
