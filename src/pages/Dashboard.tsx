import { useMemo, useState } from 'react'
import { EquityChart } from '../components/EquityChart'
import { BestSetupCard, TradingBehaviourCard } from '../components/InsightCards'
import { DisciplineCard } from '../components/DisciplineCard'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RangeMenu } from '../components/RangeMenu'
import { RecentActivity } from '../components/RecentActivity'
import { RiskHealthCard } from '../components/RiskHealth'
import { SetupTable } from '../components/SetupTable'
import { StatCards } from '../components/StatCards'
import { deriveStats, startingCapital, tradeDate } from '../lib/stats'
import { greeting, riskHealth } from '../lib/dashboardStats'
import { moneyIn } from '../lib/journalStats'
import { isEverything, rangeLabel, windowFor, within, type Preset } from '../lib/dateWindow'
import { useBehavioralLeak } from '../lib/insight'
import {
  GREETING,
  GREETING_ROW,
  GREETING_SPAN,
  GREETING_SUB,
  PAGE_ACTIONS,
  ROW_STAGGER,
} from '../components/ui'
import type { DateRange } from '../components/DateRangePicker'
import type { StoredTrade } from '../lib/trades'
import type { Period, Profile } from '../lib/profile'

type DashboardProps = {
  trades: StoredTrade[]
  uid: string | null
  profile: Profile | null
}

/** The first moment a window still counts. */
function since(window: Period): Date {
  const from = new Date()
  if (window === 'daily') from.setHours(0, 0, 0, 0)
  else if (window === 'weekly') from.setDate(from.getDate() - 7)
  else from.setMonth(from.getMonth() - 1)
  return from
}

const SPAN = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

/** "Sep 1 – Sep 14", from the trades themselves rather than a fixed window. */
function coverage(trades: StoredTrade[]): string | null {
  const dates = trades
    .map(tradeDate)
    .filter((when): when is Date => when !== null)
    .sort((a, b) => a.getTime() - b.getTime())

  if (dates.length === 0) return null

  const first = SPAN.format(dates[0])
  const last = SPAN.format(dates[dates.length - 1])
  return first === last ? first : `${first} – ${last}`
}

export function Dashboard({ trades, uid, profile }: DashboardProps) {
  /*
   * All time by default, which is the right opening view for a dashboard: the
   * equity curve and the calendar are both worse with a month cut off them.
   * The control is there for the question "how has this month gone".
   */
  const [range, setRange] = useState<Preset>('ALL')
  const [custom, setCustom] = useState<DateRange | null>(null)

  const span = useMemo(() => windowFor(range, custom), [range, custom])
  const shown = useMemo(() => within(trades, span), [trades, span])
  const filtered = !isEverything(span)
  const label = rangeLabel(range, custom)

  const opening = startingCapital(profile)
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])

  /*
   * Everything below reads `shown`, not `trades`. One filtered array feeding
   * every card is what keeps them agreeing with each other — a card reading
   * the unfiltered list would quietly contradict the one beside it.
   */
  const stats = useMemo(() => deriveStats(shown, opening), [shown, opening])

  /*
   * Expectancy is worked out here and handed down rather than in the card,
   * because two components need the same figure — the headline number and the
   * risk panel — and deriving it twice invites them to disagree.
   */
  const risk = useMemo(
    () => riskHealth(shown, opening, profile?.riskPerTradePct ?? null),
    [shown, opening, profile?.riskPerTradePct],
  )

  /*
   * "What's working" reads over its own window from Settings — but only while
   * the page is showing everything. Once a range is chosen the page's range
   * wins, because a card captioned "last month" inside a view of last week is
   * answering a question nobody asked.
   */
  const edge = useMemo(() => {
    if (filtered) return { stats, caption: label }

    const window = profile?.edgeWindow ?? 'monthly'
    const from = since(window).getTime()
    const recent = shown.filter((trade) => {
      // tradeDate already settles entry-time-or-written-at, and parses the ISO
      // string. Re-deciding that here would be a second answer to a question
      // the stats module has already answered.
      const when = tradeDate(trade)
      return when !== null && when.getTime() >= from
    })

    // A window with nothing in it would read as "no setups work", which is not
    // what an empty week means. Fall back to the full picture.
    return {
      stats: recent.length > 0 ? deriveStats(recent, opening) : stats,
      caption: null,
    }
  }, [filtered, label, shown, stats, opening, profile?.edgeWindow])

  const leak = useBehavioralLeak(uid, trades.length)

  const name = profile?.displayName?.trim().split(' ')[0] ?? ''
  const covered = coverage(shown)

  return (
    <>
      <div className={GREETING_ROW}>
        <div>
          <h2 className={GREETING}>
            {greeting()}
            {name && `, ${name}`}
          </h2>
          <p className={GREETING_SUB}>Here is how your trading is performing.</p>
        </div>

        <div className={PAGE_ACTIONS}>
          {/* What the figures are measured over, taken from the trades
              themselves — so it cannot claim a range the journal does not
              hold, even when the filter asks for one. */}
          {covered && (
            <span className={GREETING_SPAN}>
              {covered} · {shown.length} {shown.length === 1 ? 'trade' : 'trades'}
            </span>
          )}

          <RangeMenu
            presets={['ALL', '7D', '30D', '90D']}
            range={range}
            custom={custom}
            onPreset={(next) => {
              setRange(next)
              setCustom(null)
            }}
            onCustom={setCustom}
          />
        </div>
      </div>

      <StatCards
        stats={stats}
        currency={money}
        expectancyR={risk.expectancyR}
        rSample={risk.rSample}
      />

      <div className="grid gap-18 grid-cols-[minmax(0,1fr)_320px] max-[1280px]:grid-cols-[minmax(0,1fr)]">
        <EquityChart equity={stats.equity} opening={opening} spanLabel={label} />

        <div
          data-tour="insights"
          className={`flex flex-col gap-18 max-[1280px]:grid max-[1280px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] ${ROW_STAGGER}`}
        >
          <BestSetupCard
            stats={edge.stats}
            window={profile?.edgeWindow ?? 'monthly'}
            caption={edge.caption}
          />
          {/* The leak is computed server-side over its own cadence, so it is
              the one card the page filter cannot narrow. It says its own
              window, which is why that does not read as a contradiction. */}
          <TradingBehaviourCard stats={stats} leak={leak} />
          <PerformanceCalendar dailyPl={stats.dailyPl} />
        </div>
      </div>

      {/* Setup, risk and discipline: what worked, what it cost to find out,
          and whether the plan was followed while finding out. */}
      <div
        className={`grid items-start gap-18 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] max-[1100px]:grid-cols-[minmax(0,1fr)] ${ROW_STAGGER}`}
      >
        <SetupTable trades={shown} money={money} />

        <div className="flex flex-col gap-18">
          <RiskHealthCard
            trades={shown}
            stats={stats}
            capital={opening}
            limitPct={profile?.riskPerTradePct ?? null}
          />
          <DisciplineCard trades={shown} />
        </div>
      </div>

      <RecentActivity trades={shown} />
    </>
  )
}
