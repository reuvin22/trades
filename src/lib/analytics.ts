import { realisedR, riskOf } from './dashboardStats'
import { dayKey, tradeDate } from './stats'
import type { StoredTrade } from './trades'

/**
 * The cuts the Analytics page makes through a journal.
 *
 * Every section here answers the same question about a different slice — what
 * is this worth — so they all produce the same row, and one table renders them
 * all. A separate shape per section would mean a separate table per section,
 * and six subtly different definitions of "win rate".
 *
 * Nothing is estimated. Where the journal cannot answer, the field is null and
 * the table shows a dash: a slice with no stop logged has no R, and inventing
 * one would make the emptiest rows look like the most certain.
 */

export type Slice = {
  label: string
  trades: number
  wins: number
  losses: number
  /** Percent of decided trades won. Null when none are decided. */
  winRate: number | null
  netPl: number
  grossProfit: number
  grossLoss: number
  /** Null when there are no losses to divide by. */
  profitFactor: number | null
  /** Mean realised R, over the trades that recorded a stop. */
  avgR: number | null
  /** How many trades that mean could read. Always shown beside it. */
  rSample: number
}

/**
 * Group trades by one or more keys each.
 *
 * Keys are a list rather than a single value because some cuts genuinely
 * overlap: a trade held across the London/New York handover belongs to both
 * sessions, and a trade tagged with three mistakes belongs under all three.
 * Those rows sum to more than the trade count, which is correct and is why
 * every table states its own count per row.
 */
export function groupBy(
  trades: StoredTrade[],
  keysOf: (trade: StoredTrade) => string[],
): Slice[] {
  const groups = new Map<string, StoredTrade[]>()

  for (const trade of trades) {
    for (const key of keysOf(trade)) {
      const bucket = groups.get(key)
      if (bucket) bucket.push(trade)
      else groups.set(key, [trade])
    }
  }

  return [...groups].map(([label, group]) => summarise(label, group))
}

/** One slice's figures. The single definition of every metric in this page. */
export function summarise(label: string, group: StoredTrade[]): Slice {
  let wins = 0
  let losses = 0
  let grossProfit = 0
  let grossLoss = 0
  let rTotal = 0
  let rSample = 0

  for (const trade of group) {
    // Break-even is neither: it cost nothing, so it should not drag a win rate
    // down, and it earned nothing, so it should not prop one up.
    if (trade.netPl !== null && trade.netPl > 0) {
      wins += 1
      grossProfit += trade.netPl
    } else if (trade.netPl !== null && trade.netPl < 0) {
      losses += 1
      grossLoss += Math.abs(trade.netPl)
    }

    const r = realisedR(trade)
    if (r !== null) {
      rTotal += r
      rSample += 1
    }
  }

  const decided = wins + losses

  return {
    label,
    trades: group.length,
    wins,
    losses,
    winRate: decided === 0 ? null : (wins / decided) * 100,
    netPl: grossProfit - grossLoss,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    avgR: rSample === 0 ? null : rTotal / rSample,
    rSample,
  }
}

/** Biggest earner first, which is how a trader reads a list like this. */
export function byMoney(slices: Slice[]): Slice[] {
  return [...slices].sort((a, b) => b.netPl - a.netPl)
}

/* ------------------------------------------------------------- the cuts */

export function bySymbol(trades: StoredTrade[]): Slice[] {
  return byMoney(groupBy(trades, (trade) => [trade.ticker.trim() || 'Unlabelled']))
}

export function byDirection(trades: StoredTrade[]): Slice[] {
  return groupBy(trades, (trade) => [trade.direction])
}

const SESSION_NAMES: Record<string, string> = {
  asia: 'Asia',
  london: 'London',
  newyork: 'New York',
}

/**
 * The sessions one trade ran in, as a readable string.
 *
 * `bySession` groups many trades and only ever needs the name of a bucket;
 * this is for the places that show a single trade's own sessions, where a
 * trade spanning two of them has to name both rather than pick one.
 */
export function sessionLabels(trade: StoredTrade): string {
  if (trade.sessions.length === 0) return '—'
  return trade.sessions.map((entry) => SESSION_NAMES[entry] ?? entry).join(', ')
}

export function bySession(trades: StoredTrade[]): Slice[] {
  return groupBy(trades, (trade) =>
    trade.sessions.length === 0
      ? ['Unrecorded']
      : trade.sessions.map((entry) => SESSION_NAMES[entry] ?? entry),
  )
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Monday first, and always all seven — an empty Friday is information. */
export function byWeekday(trades: StoredTrade[]): Slice[] {
  const grouped = new Map(
    groupBy(trades, (trade) => {
      const when = tradeDate(trade)
      return when === null ? [] : [DAYS[when.getDay()]]
    }).map((slice) => [slice.label, slice]),
  )

  const order = [...DAYS.slice(1), DAYS[0]]
  return order
    .map((day) => grouped.get(day) ?? summarise(day, []))
    .filter((slice) => slice.trades > 0 || !['Saturday', 'Sunday'].includes(slice.label))
}

/** Two-hour bands, because one-hour bands on a small journal are all noise. */
export function byHour(trades: StoredTrade[]): Slice[] {
  const slices = groupBy(trades, (trade) => {
    const when = tradeDate(trade)
    if (when === null) return []

    const band = Math.floor(when.getHours() / 2) * 2
    return [`${String(band).padStart(2, '0')}:00`]
  })

  return slices.sort((a, b) => a.label.localeCompare(b.label))
}

/** Minutes held, or null when either end of the trade is missing. */
export function heldMinutes(trade: StoredTrade): number | null {
  if (!trade.entryAt || !trade.exitAt) return null

  const opened = new Date(trade.entryAt).getTime()
  const closed = new Date(trade.exitAt).getTime()
  if (Number.isNaN(opened) || Number.isNaN(closed) || closed <= opened) return null

  return (closed - opened) / 60_000
}

const DURATIONS: { label: string; upTo: number }[] = [
  { label: 'Under 5 min', upTo: 5 },
  { label: '5–30 min', upTo: 30 },
  { label: '30–60 min', upTo: 60 },
  { label: '1–4 hours', upTo: 240 },
  { label: '4+ hours', upTo: Infinity },
]

export function byDuration(trades: StoredTrade[]): Slice[] {
  const slices = groupBy(trades, (trade) => {
    const minutes = heldMinutes(trade)
    if (minutes === null) return []

    return [DURATIONS.find((band) => minutes < band.upTo)?.label ?? '4+ hours']
  })

  const order = DURATIONS.map((band) => band.label)
  return slices.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
}

const RISK_BANDS: { label: string; upTo: number }[] = [
  { label: 'Under 0.5%', upTo: 0.5 },
  { label: '0.5–1%', upTo: 1 },
  { label: '1–2%', upTo: 2 },
  { label: 'Over 2%', upTo: Infinity },
]

/**
 * Performance grouped by how much was risked.
 *
 * The most useful cut on this page, and the one a trader least wants to see:
 * it is where "my expectancy goes negative above 2%" becomes visible, and that
 * sentence changes behaviour in a way no drawdown figure does.
 */
export function byRiskBand(trades: StoredTrade[], capital: number): Slice[] {
  if (capital <= 0) return []

  const slices = groupBy(trades, (trade) => {
    const risk = riskOf(trade)
    if (risk === null) return []

    const percent = (risk / capital) * 100
    return [RISK_BANDS.find((band) => percent < band.upTo)?.label ?? 'Over 2%']
  })

  const order = RISK_BANDS.map((band) => band.label)
  return slices.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label))
}

export function byEmotion(trades: StoredTrade[]): Slice[] {
  return byMoney(
    groupBy(trades, (trade) =>
      [trade.emotionBefore, trade.emotionDuring]
        .map((entry) => entry.trim())
        .filter((entry) => entry !== ''),
    ),
  )
}

export function byMistake(trades: StoredTrade[]): Slice[] {
  return byMoney(
    groupBy(trades, (trade) => trade.mistakes.map((entry) => entry.trim()).filter(Boolean)),
  )
}

/* ------------------------------------------------------ what happens next */

export type PostLoss = {
  /** Trades taken soon after a loss. */
  after: Slice
  /** Every other trade, for something to compare against. */
  rest: Slice
  /** How much bigger the risk was, as a percentage. Null when unreadable. */
  riskChangePct: number | null
  /** The window that counts as "soon", in minutes. */
  windowMinutes: number
}

const SOON = 60

/**
 * What the next trade looks like after a losing one.
 *
 * The comparison is the whole point. "You took 11 trades after a loss" is a
 * count; "those trades won 27% against your usual 58%, on 42% more risk" is a
 * finding — and it is the one behaviour that shows up in almost every blown
 * account.
 *
 * Trades are read in time order, so a trade counts as post-loss only when the
 * trade that actually preceded it lost, and only within the hour. A loss on
 * Monday does not make Thursday's trade a revenge trade.
 */
export function postLoss(trades: StoredTrade[]): PostLoss {
  const ordered = [...trades]
    .map((trade) => ({ trade, when: tradeDate(trade) }))
    .filter((entry): entry is { trade: StoredTrade; when: Date } => entry.when !== null)
    .sort((a, b) => a.when.getTime() - b.when.getTime())

  const after: StoredTrade[] = []
  const rest: StoredTrade[] = []

  for (let index = 0; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]
    const gap =
      previous === undefined
        ? Infinity
        : (ordered[index].when.getTime() - previous.when.getTime()) / 60_000

    const followsLoss =
      previous !== undefined && previous.trade.netPl !== null && previous.trade.netPl < 0

    if (followsLoss && gap <= SOON) after.push(ordered[index].trade)
    else rest.push(ordered[index].trade)
  }

  const meanRisk = (group: StoredTrade[]) => {
    const risks = group.map(riskOf).filter((value): value is number => value !== null)
    return risks.length === 0
      ? null
      : risks.reduce((sum, value) => sum + value, 0) / risks.length
  }

  const afterRisk = meanRisk(after)
  const restRisk = meanRisk(rest)

  return {
    after: summarise('After a loss', after),
    rest: summarise('Everything else', rest),
    riskChangePct:
      afterRisk === null || restRisk === null || restRisk === 0
        ? null
        : ((afterRisk - restRisk) / restRisk) * 100,
    windowMinutes: SOON,
  }
}

/* ----------------------------------------------------------- execution */

export type Execution = {
  /** Winners that reached the target they were given. */
  targetHit: number
  /** Winners closed before the target. */
  targetShort: number
  /** Winners with a target logged at all. */
  targetSample: number
  /** Losers that lost more than the stop said they would. */
  stopOverrun: number
  stopSample: number
  /** Mean share of the planned target actually captured, 0–100. */
  captureRate: number | null
}

/**
 * How closely trades were executed against their own plan.
 *
 * What this can and cannot see is worth being plain about. It reads the target
 * and stop written down when the trade was logged, against where it actually
 * closed. It cannot see MFE or MAE — how far the trade went before it turned —
 * because nothing records price between entry and exit, so "you leave 1.3R on
 * the table" is not a question this journal can answer yet.
 */
export function execution(trades: StoredTrade[]): Execution {
  let targetHit = 0
  let targetShort = 0
  let targetSample = 0
  let stopOverrun = 0
  let stopSample = 0
  let captureTotal = 0
  let captureSample = 0

  for (const trade of trades) {
    const { entryPrice, exitPrice, takeProfit, netPl } = trade

    if (entryPrice !== null && exitPrice !== null && takeProfit !== null && netPl !== null && netPl > 0) {
      const planned = Math.abs(takeProfit - entryPrice)
      const got = Math.abs(exitPrice - entryPrice)

      if (planned > 0) {
        targetSample += 1
        // A hair under counts as reaching it: exchanges fill through a level,
        // and calling a 99.6% fill a miss is scoring noise.
        if (got >= planned * 0.995) targetHit += 1
        else targetShort += 1

        captureTotal += Math.min(got / planned, 2) * 100
        captureSample += 1
      }
    }

    const risk = riskOf(trade)
    if (risk !== null && netPl !== null && netPl < 0) {
      stopSample += 1
      // More than a tenth past the stop is slippage or a stop that moved;
      // either way the trade cost more than the plan said it could.
      if (Math.abs(netPl) > risk * 1.1) stopOverrun += 1
    }
  }

  return {
    targetHit,
    targetShort,
    targetSample,
    stopOverrun,
    stopSample,
    captureRate: captureSample === 0 ? null : captureTotal / captureSample,
  }
}

/* ------------------------------------------------------------ over time */

export type Bucket = { label: string; netPl: number; trades: number; avgR: number | null }

export type Grain = 'daily' | 'weekly' | 'monthly'

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' })
const DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** The Monday of the week a date falls in, so weeks group consistently. */
function weekStart(date: Date): Date {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  // getDay() is 0 on Sunday, which belongs to the week that began six days ago.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

export function overTime(trades: StoredTrade[], grain: Grain): Bucket[] {
  const groups = new Map<string, { label: string; trades: StoredTrade[] }>()

  for (const trade of trades) {
    const when = tradeDate(trade)
    if (when === null) continue

    let key: string
    let label: string

    if (grain === 'daily') {
      key = dayKey(when)
      label = DAY.format(when)
    } else if (grain === 'weekly') {
      const start = weekStart(when)
      key = dayKey(start)
      label = DAY.format(start)
    } else {
      key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}`
      label = MONTH.format(when)
    }

    const bucket = groups.get(key)
    if (bucket) bucket.trades.push(trade)
    else groups.set(key, { label, trades: [trade] })
  }

  return [...groups]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, group]) => {
      const slice = summarise(group.label, group.trades)
      return {
        label: group.label,
        netPl: slice.netPl,
        trades: slice.trades,
        avgR: slice.avgR,
      }
    })
}

export type Streaks = { bestWin: number; worstLoss: number; current: number }

/** Consecutive wins and losses, in the order the trades were taken. */
export function streaks(trades: StoredTrade[]): Streaks {
  const results = [...trades]
    .map((trade) => ({ trade, when: tradeDate(trade) }))
    .filter((entry): entry is { trade: StoredTrade; when: Date } => entry.when !== null)
    .sort((a, b) => a.when.getTime() - b.when.getTime())
    .map((entry) => entry.trade.netPl)
    .filter((value): value is number => value !== null && value !== 0)

  let bestWin = 0
  let worstLoss = 0
  let run = 0

  for (const result of results) {
    const winning = result > 0
    // Same sign extends the run; a flip starts a new one at ±1.
    run = run !== 0 && winning === run > 0 ? run + (winning ? 1 : -1) : winning ? 1 : -1

    if (run > bestWin) bestWin = run
    if (run < worstLoss) worstLoss = run
  }

  return { bestWin, worstLoss, current: run }
}
