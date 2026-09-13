import { useMemo } from 'react'
import { EquityChart } from '../components/EquityChart'
import { BestSetupCard, TradingBehaviourCard } from '../components/InsightCards'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RecentActivity } from '../components/RecentActivity'
import { StatCards } from '../components/StatCards'
import { deriveStats, tradeDate } from '../lib/stats'
import { useBehavioralLeak } from '../lib/insight'
import { ROW_STAGGER } from '../components/ui'
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

export function Dashboard({ trades, uid, profile }: DashboardProps) {
  const stats = deriveStats(trades)
  const leak = useBehavioralLeak(uid, trades.length)

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
    return recent.length > 0 ? deriveStats(recent) : stats
  }, [trades, profile?.edgeWindow, stats])

  return (
    <>
      <StatCards stats={stats} />

      <div className="grid items-start gap-18 grid-cols-[minmax(0,1fr)_320px] max-[1280px]:grid-cols-[minmax(0,1fr)]">
        <EquityChart equity={stats.equity} />

        <div data-tour="insights" className={`flex flex-col gap-18 max-[1280px]:grid max-[1280px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] ${ROW_STAGGER}`}>
          <BestSetupCard stats={edgeStats} window={profile?.edgeWindow ?? 'monthly'} />
          <TradingBehaviourCard stats={stats} leak={leak} />
          <PerformanceCalendar dailyPl={stats.dailyPl} />
        </div>
      </div>

      <RecentActivity trades={trades} />
    </>
  )
}
