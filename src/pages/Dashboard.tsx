import { useMemo } from 'react'
import { EquityChart } from '../components/EquityChart'
import { BestSetupCard, TradingBehaviourCard } from '../components/InsightCards'
import { DisciplineCard } from '../components/DisciplineCard'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RecentActivity } from '../components/RecentActivity'
import { RiskHealthCard } from '../components/RiskHealth'
import { SetupTable } from '../components/SetupTable'
import { StatCards } from '../components/StatCards'
import { deriveStats, startingCapital, tradeDate } from '../lib/stats'
import { greeting, riskHealth } from '../lib/dashboardStats'
import { moneyIn } from '../lib/journalStats'
import { useBehavioralLeak } from '../lib/insight'
import { GREETING, GREETING_ROW, GREETING_SPAN, GREETING_SUB, ROW_STAGGER } from '../components/ui'
import type { StoredTrade } from '../lib/trades'
import type { Period, Profile } from '../lib/profile'

type DashboardProps = {
  trades: StoredTrade[]
  uid: string | null
  profile: Profile | null
}

/** The first moment a window still counts, or null for "everything". */
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
  const opening = startingCapital(profile)
  const stats = deriveStats(trades, opening)
  const leak = useBehavioralLeak(uid, trades.length)

  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])

  /*
   * Expectancy is worked out here and handed down, rather than in the card,
   * because two components need the same figure — the headline number and the
   * risk panel — and deriving it twice invites them to disagree.
   */
  const risk = useMemo(
    () => riskHealth(trades, opening, profile?.riskPerTradePct ?? null),
    [trades, opening, profile?.riskPerTradePct],
  )

  /*
   * "What's working" reads over its own window, which is why it is derived a
   * second time rather than reusing the stats above.
   *
   * Everything else on this page is deliberately all-time — an equity curve or
   * a calendar with a month cut off it is a worse chart, not a focused one.
   * Only the setup ranking answers a question that has a "lately" in it.
   */
  const edgeStats = useMemo(() => {
    const window = profile?.edgeWindow ?? 'monthly'
    const from = since(window).getTime()
    const recent = trades.filter((trade) => {
      // tradeDate already settles entry-time-or-written-at, and parses the
      // ISO string. Re-deciding that here would be a second answer to a
      // question the stats module has already answered.
      const when = tradeDate(trade)
      return when !== null && when.getTime() >= from
    })

    // A window with nothing in it would read as "no setups work", which is not
    // what an empty week means. Fall back to the full picture.
    return recent.length > 0 ? deriveStats(recent, opening) : stats
  }, [trades, profile?.edgeWindow, stats, opening])

  const name = profile?.displayName?.trim().split(' ')[0] ?? ''
  const span = coverage(trades)

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

        {/* What the figures below are measured over. Taken from the trades
            themselves, so it cannot claim a range the journal does not hold. */}
        {span && <span className={GREETING_SPAN}>{span} · {trades.length} trades</span>}
      </div>

      <StatCards
        stats={stats}
        currency={money}
        expectancyR={risk.expectancyR}
        rSample={risk.rSample}
      />

      <div className="grid items-start gap-18 grid-cols-[minmax(0,1fr)_320px] max-[1280px]:grid-cols-[minmax(0,1fr)]">
        <EquityChart equity={stats.equity} opening={opening} />

        <div data-tour="insights" className={`flex flex-col gap-18 max-[1280px]:grid max-[1280px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] ${ROW_STAGGER}`}>
          <BestSetupCard stats={edgeStats} window={profile?.edgeWindow ?? 'monthly'} />
          <TradingBehaviourCard stats={stats} leak={leak} />
          <PerformanceCalendar dailyPl={stats.dailyPl} />
        </div>
      </div>

      {/* Setup, risk and discipline: what worked, what it cost to find out,
          and whether the plan was followed while finding out. */}
      <div className={`grid items-start gap-18 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] max-[1100px]:grid-cols-[minmax(0,1fr)] ${ROW_STAGGER}`}>
        <SetupTable trades={trades} money={money} />

        <div className="flex flex-col gap-18">
          <RiskHealthCard
            trades={trades}
            stats={stats}
            capital={opening}
            limitPct={profile?.riskPerTradePct ?? null}
          />
          <DisciplineCard trades={trades} />
        </div>
      </div>

      <RecentActivity trades={trades} />
    </>
  )
}
