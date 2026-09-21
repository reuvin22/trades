import type { StoredTrade } from './trades'
import { dayKey, tradeDate } from './stats'

/**
 * The figures the dashboard adds on top of `deriveStats`.
 *
 * Split out rather than folded in because these three answer different
 * questions — what each setup is worth, how much is being risked, and whether
 * the plan is being followed — and only the first is really a "statistic".
 *
 * Everything here is derived from trades as they are stored. Where the journal
 * does not hold enough to answer, the answer is null and the card says so. A
 * plausible-looking number with nothing behind it is worse than a blank.
 */

/**
 * What one trade actually risked, in money.
 *
 * Distance to the stop times size. Null when either is missing, which is the
 * common case for a trader who does not log a stop — and the reason every
 * risk figure on the dashboard reports how many trades it could read.
 */
export function riskOf(trade: StoredTrade): number | null {
  if (trade.entryPrice === null || trade.stopLoss === null || trade.size === null) {
    return null
  }

  const distance = Math.abs(trade.entryPrice - trade.stopLoss)
  if (distance === 0 || trade.size <= 0) return null

  return distance * trade.size
}

/**
 * What the trade returned, as a multiple of what it risked.
 *
 * **Not** `trade.riskReward`. That field is the *planned* ratio — target over
 * stop, fixed the moment the trade was written and unchanged by what happened
 * next. A trader who plans 2:1 and loses every trade still has an average
 * riskReward of 2.0, which is how a losing account ends up showing "Avg R 2.0"
 * on its dashboard.
 *
 * This is the realised multiple: what came back over what was at stake. It is
 * the number "expectancy in R" is built from, and the only one of the two that
 * can tell you the strategy is not working.
 */
export function realisedR(trade: StoredTrade): number | null {
  const risk = riskOf(trade)
  if (risk === null || trade.netPl === null) return null

  return trade.netPl / risk
}

export type SetupRow = {
  label: string
  trades: number
  wins: number
  losses: number
  /** Percent of decided trades won, or null when none are decided. */
  winRate: number | null
  netPl: number
  grossProfit: number
  grossLoss: number
  /** Null when there are no losses to divide by. */
  profitFactor: number | null
  /** Mean realised R, over the trades that recorded a stop. */
  avgR: number | null
  /** How many trades that mean could actually read. */
  rSample: number
}

/**
 * Every setup, ranked by what it made.
 *
 * By money rather than by win rate, deliberately: a setup that wins 40% of the
 * time and pays four to one is the best thing in the book, and a ranking by
 * win rate would bury it under a scalp that wins often and nets nothing.
 */
export function bySetup(trades: StoredTrade[]): SetupRow[] {
  const groups = new Map<string, StoredTrade[]>()

  for (const trade of trades) {
    const label = trade.setup.trim() || 'Unlabelled'
    const bucket = groups.get(label)
    if (bucket) bucket.push(trade)
    else groups.set(label, [trade])
  }

  const rows: SetupRow[] = []

  for (const [label, group] of groups) {
    let wins = 0
    let losses = 0
    let grossProfit = 0
    let grossLoss = 0
    let rTotal = 0
    let rSample = 0

    for (const trade of group) {
      // Break-even is neither, the same rule the journal summary uses.
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

    rows.push({
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
    })
  }

  return rows.sort((a, b) => b.netPl - a.netPl)
}

export type RiskHealth = {
  /** Percent of the account risked on an average trade, or null. */
  averagePct: number | null
  largestPct: number | null
  averageMoney: number | null
  largestMoney: number | null
  /** How many trades carried enough detail to be read. */
  sample: number
  /** Total trades looked at, so the card can say how much it could not see. */
  total: number
  /** The trader's own ceiling from Settings, for comparison. */
  limitPct: number | null
  /** Trades that went past that ceiling. Null when no ceiling is set. */
  breaches: number | null
  /** Expectancy in realised R, and what it was measured over. */
  expectancyR: number | null
  rSample: number
}

export function riskHealth(
  trades: StoredTrade[],
  capital: number,
  limitPct: number | null,
): RiskHealth {
  let money = 0
  let sample = 0
  let largest = 0
  let breaches = 0
  let rTotal = 0
  let rSample = 0

  for (const trade of trades) {
    const risk = riskOf(trade)
    if (risk !== null) {
      money += risk
      sample += 1
      if (risk > largest) largest = risk

      if (limitPct !== null && capital > 0 && (risk / capital) * 100 > limitPct) {
        breaches += 1
      }
    }

    const r = realisedR(trade)
    if (r !== null) {
      rTotal += r
      rSample += 1
    }
  }

  const asPercent = (value: number) => (capital > 0 ? (value / capital) * 100 : null)

  return {
    averageMoney: sample === 0 ? null : money / sample,
    largestMoney: sample === 0 ? null : largest,
    averagePct: sample === 0 ? null : asPercent(money / sample),
    largestPct: sample === 0 ? null : asPercent(largest),
    sample,
    total: trades.length,
    limitPct,
    breaches: limitPct === null ? null : breaches,
    expectancyR: rSample === 0 ? null : rTotal / rSample,
    rSample,
  }
}

export type DisciplineScore = {
  /** 0–100, or null when nothing has been graded. */
  score: number | null
  entry: number | null
  exit: number | null
  management: number | null
  /** Trades that answered at least one of the three questions. */
  graded: number
  total: number
}

/**
 * How often the plan was followed, graded separately from whether it paid.
 *
 * The distinction is the whole point. A trader can break every rule and have a
 * good week; that is the week that teaches the worst lesson. Scoring adherence
 * on its own is what makes a profitable month with a 40% score legible as the
 * warning it is.
 *
 * Unanswered questions are skipped rather than counted against the trader —
 * a blank means "not graded", not "broke the rule", and treating the two the
 * same would punish anyone who filled the form in quickly.
 */
export function disciplineScore(trades: StoredTrade[]): DisciplineScore {
  const tally = {
    entry: { yes: 0, asked: 0 },
    exit: { yes: 0, asked: 0 },
    management: { yes: 0, asked: 0 },
  }

  let graded = 0

  for (const trade of trades) {
    const answers = [
      ['entry', trade.compliedEntry],
      ['exit', trade.compliedExit],
      ['management', trade.compliedManagement],
    ] as const

    let answeredAny = false

    for (const [key, answer] of answers) {
      if (answer !== 'yes' && answer !== 'no') continue

      answeredAny = true
      tally[key].asked += 1
      if (answer === 'yes') tally[key].yes += 1
    }

    if (answeredAny) graded += 1
  }

  const rate = (part: { yes: number; asked: number }) =>
    part.asked === 0 ? null : (part.yes / part.asked) * 100

  const parts = [rate(tally.entry), rate(tally.exit), rate(tally.management)].filter(
    (value): value is number => value !== null,
  )

  return {
    score: parts.length === 0 ? null : parts.reduce((sum, v) => sum + v, 0) / parts.length,
    entry: rate(tally.entry),
    exit: rate(tally.exit),
    management: rate(tally.management),
    graded,
    total: trades.length,
  }
}

export type ConsistencyScore = {
  /** Today's best against the best ever, as a percentage. Null when there is
   *  nothing to divide. */
  score: number | null
  /** The most any single trade made today. Null when nothing closed today. */
  today: number | null
  /** The most any single trade has ever made. Null when nothing has won yet. */
  best: number | null
  /** Trades dated today, so the card can say what it read. */
  todayCount: number
}

/**
 * Today's best trade measured against the best trade ever.
 *
 * Deliberately not a judgement. There is no good or bad band here and no
 * colour that means "you are failing" — where a trader wants to sit on this
 * scale is personal, and the card exists to be watched over time rather than
 * to grade anybody. 100% simply means today set a new record, because today's
 * trades are part of "ever" and the ratio therefore cannot exceed one.
 *
 * Both halves are absolute, not filtered. "Today" is today by the reader's
 * own clock and "ever" is the whole journal, so the dashboard's date range
 * deliberately does not move this figure — a range of last week has no
 * "today" in it, and one of the last year would not change what the record is.
 *
 * A losing day scores zero rather than a negative percentage. The ratio of a
 * loss to a record win is arithmetically fine and reads as nonsense, and
 * "no winning trade today" is what is actually being said.
 */
export function consistencyScore(
  trades: StoredTrade[],
  now: Date = new Date(),
): ConsistencyScore {
  const todayKey = dayKey(now)

  let today: number | null = null
  let best: number | null = null
  let todayCount = 0

  for (const trade of trades) {
    if (trade.netPl === null) continue

    if (best === null || trade.netPl > best) best = trade.netPl

    const when = tradeDate(trade)
    if (when === null || dayKey(when) !== todayKey) continue

    todayCount += 1
    if (today === null || trade.netPl > today) today = trade.netPl
  }

  // Nothing to measure against until one trade has actually made money.
  const score =
    best === null || best <= 0 || today === null
      ? null
      : (Math.max(0, today) / best) * 100

  return { score, today, best, todayCount }
}

/** Good morning / afternoon / evening, by the reader's own clock. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
