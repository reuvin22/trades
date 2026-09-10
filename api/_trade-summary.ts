/**
 * Condenses a trader's journal into the statistical shape a language model can
 * reason about.
 *
 * Raw rows are never sent to the model: they are bulky, they burn tokens, and
 * they carry free-text notes the user did not ask to have analysed. Aggregates
 * are enough to spot a behavioural pattern.
 */

export type RawTrade = {
  ticker?: string
  direction?: string
  size?: number | null
  entryPrice?: number | null
  exitPrice?: number | null
  entryAt?: string
  exitAt?: string
  setup?: string
  netPl?: number | null
  riskReward?: number | null
  compliedEntry?: string
  compliedExit?: string
  compliedManagement?: string
  emotionBefore?: string
  emotionDuring?: string
  mistakes?: string[]
  createdAt?: { toDate: () => Date } | null
}

export type Bucket = {
  label: string
  trades: number
  wins: number
  netPl: number
}

export type TradeSummary = {
  tradeCount: number
  closedCount: number
  netPl: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number | null
  avgRiskReward: number | null
  avgHoldMinutes: number | null
  largestLoss: number
  largestWin: number
  byHour: Bucket[]
  byWeekday: Bucket[]
  bySetup: Bucket[]
  bySize: Bucket[]
  /** What happens on the trade taken directly after a loss. */
  afterLoss: {
    count: number
    netPl: number
    winRate: number
    /** Same-session re-entries only; an overnight gap is not a revenge trade. */
    sameSessionCount: number
    medianMinutesToReentry: number | null
    avgSizeChangePct: number | null
  }
  worstStreak: number
  planCompliance: { entry: number; exit: number; management: number }
  emotions: Bucket[]
  mistakes: { label: string; count: number; netPl: number }[]
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function tradeDate(trade: RawTrade): Date | null {
  if (trade.entryAt) {
    const parsed = new Date(trade.entryAt)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return trade.createdAt?.toDate() ?? null
}

function bucketise(trades: RawTrade[], key: (trade: RawTrade) => string | null): Bucket[] {
  const groups = new Map<string, Bucket>()

  for (const trade of trades) {
    const label = key(trade)
    if (label === null) continue

    const bucket = groups.get(label) ?? { label, trades: 0, wins: 0, netPl: 0 }
    bucket.trades++
    if ((trade.netPl ?? 0) > 0) bucket.wins++
    bucket.netPl += trade.netPl ?? 0
    groups.set(label, bucket)
  }

  // Worst first — the leak is what we are looking for.
  return [...groups.values()].sort((a, b) => a.netPl - b.netPl)
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function round(value: number, places = 2): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

export function summarise(input: RawTrade[]): TradeSummary {
  const ordered = [...input].sort(
    (a, b) => (tradeDate(a)?.getTime() ?? 0) - (tradeDate(b)?.getTime() ?? 0),
  )
  const closed = ordered.filter(
    (trade) => trade.netPl !== null && trade.netPl !== undefined,
  )

  const wins = closed.filter((trade) => (trade.netPl ?? 0) > 0)
  const losses = closed.filter((trade) => (trade.netPl ?? 0) < 0)

  const grossProfit = wins.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0))

  const holds: number[] = []
  for (const trade of ordered) {
    if (!trade.entryAt || !trade.exitAt) continue
    const opened = new Date(trade.entryAt).getTime()
    const shut = new Date(trade.exitAt).getTime()
    if (!Number.isNaN(opened) && !Number.isNaN(shut) && shut > opened) {
      holds.push((shut - opened) / 60000)
    }
  }

  // Behaviour on the trade immediately following a losing one.
  const gaps: number[] = []
  const sizeChanges: number[] = []
  const revenge: RawTrade[] = []

  for (let index = 1; index < closed.length; index++) {
    const previous = closed[index - 1]
    const current = closed[index]
    if ((previous.netPl ?? 0) >= 0) continue

    revenge.push(current)

    const closedAt = previous.exitAt ? new Date(previous.exitAt).getTime() : null
    const openedAt = current.entryAt ? new Date(current.entryAt).getTime() : null

    // Only same-session pairs. Including the overnight gap between yesterday's
    // last loss and this morning's first trade drowns the signal in noise.
    if (closedAt && openedAt && openedAt > closedAt) {
      const sameDay =
        new Date(closedAt).toDateString() === new Date(openedAt).toDateString()
      if (sameDay) gaps.push((openedAt - closedAt) / 60000)
    }

    if (previous.size && current.size) {
      sizeChanges.push(((current.size - previous.size) / previous.size) * 100)
    }
  }

  let streak = 0
  let worstStreak = 0
  for (const trade of closed) {
    if ((trade.netPl ?? 0) < 0) {
      streak++
      worstStreak = Math.max(worstStreak, streak)
    } else {
      streak = 0
    }
  }

  const complianceRate = (field: keyof RawTrade) => {
    const answered = ordered.filter(
      (trade) => trade[field] === 'yes' || trade[field] === 'no',
    )
    if (answered.length === 0) return 0
    return round(
      (answered.filter((trade) => trade[field] === 'yes').length / answered.length) * 100,
    )
  }

  const mistakeTotals = new Map<string, { count: number; netPl: number }>()
  for (const trade of ordered) {
    for (const tag of trade.mistakes ?? []) {
      const entry = mistakeTotals.get(tag) ?? { count: 0, netPl: 0 }
      entry.count++
      entry.netPl += trade.netPl ?? 0
      mistakeTotals.set(tag, entry)
    }
  }

  const sizes = ordered.map((trade) => trade.size ?? 0).filter((size) => size > 0)
  const medianSize = median(sizes) ?? 0

  const riskRewards = ordered
    .map((trade) => trade.riskReward)
    .filter((value): value is number => typeof value === 'number')

  return {
    tradeCount: ordered.length,
    closedCount: closed.length,
    netPl: round(closed.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)),
    winRate: closed.length === 0 ? 0 : round((wins.length / closed.length) * 100),
    avgWin: wins.length === 0 ? 0 : round(grossProfit / wins.length),
    avgLoss: losses.length === 0 ? 0 : round(grossLoss / losses.length),
    profitFactor: grossLoss === 0 ? null : round(grossProfit / grossLoss),
    avgRiskReward:
      riskRewards.length === 0
        ? null
        : round(riskRewards.reduce((sum, value) => sum + value, 0) / riskRewards.length),
    avgHoldMinutes:
      holds.length === 0
        ? null
        : Math.round(holds.reduce((a, b) => a + b, 0) / holds.length),
    largestLoss: losses.length === 0 ? 0 : round(Math.min(...losses.map((t) => t.netPl ?? 0))),
    largestWin: wins.length === 0 ? 0 : round(Math.max(...wins.map((t) => t.netPl ?? 0))),

    byHour: bucketise(closed, (trade) => {
      const when = tradeDate(trade)
      return when ? `${String(when.getHours()).padStart(2, '0')}:00` : null
    }),
    byWeekday: bucketise(closed, (trade) => {
      const when = tradeDate(trade)
      return when ? WEEKDAYS[when.getDay()] : null
    }),
    bySetup: bucketise(closed, (trade) => trade.setup?.trim() || 'Unlabelled'),
    bySize: bucketise(closed, (trade) => {
      if (!trade.size || medianSize === 0) return null
      const ratio = trade.size / medianSize
      if (ratio > 1.75) return 'oversized (>1.75x median)'
      if (ratio < 0.6) return 'undersized (<0.6x median)'
      return 'normal size'
    }),

    afterLoss: {
      count: revenge.length,
      netPl: round(revenge.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)),
      winRate:
        revenge.length === 0
          ? 0
          : round(
              (revenge.filter((trade) => (trade.netPl ?? 0) > 0).length / revenge.length) *
                100,
            ),
      sameSessionCount: gaps.length,
      medianMinutesToReentry: gaps.length === 0 ? null : Math.round(median(gaps) ?? 0),
      avgSizeChangePct:
        sizeChanges.length === 0
          ? null
          : round(sizeChanges.reduce((a, b) => a + b, 0) / sizeChanges.length, 1),
    },

    worstStreak,
    planCompliance: {
      entry: complianceRate('compliedEntry'),
      exit: complianceRate('compliedExit'),
      management: complianceRate('compliedManagement'),
    },
    emotions: bucketise(closed, (trade) => trade.emotionDuring?.trim() || null),
    mistakes: [...mistakeTotals.entries()]
      .map(([label, entry]) => ({ label, count: entry.count, netPl: round(entry.netPl) }))
      .sort((a, b) => a.netPl - b.netPl),
  }
}
