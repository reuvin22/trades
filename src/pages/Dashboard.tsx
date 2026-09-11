import { EquityChart } from '../components/EquityChart'
import { BehavioralLeakCard, SystemSignalCard } from '../components/InsightCards'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RecentActivity } from '../components/RecentActivity'
import { StatCards } from '../components/StatCards'
import { deriveStats } from '../lib/stats'
import { useBehavioralLeak } from '../lib/insight'
import { ROW_STAGGER } from '../components/ui'
import type { StoredTrade } from '../lib/trades'

type DashboardProps = {
  trades: StoredTrade[]
  uid: string | null
}

export function Dashboard({ trades, uid }: DashboardProps) {
  const stats = deriveStats(trades)
  const leak = useBehavioralLeak(uid, trades.length)

  return (
    <>
      <StatCards stats={stats} />

      <div className="grid items-start gap-18 grid-cols-[minmax(0,1fr)_320px] max-[1280px]:grid-cols-[minmax(0,1fr)]">
        <EquityChart equity={stats.equity} />

        <div data-tour="insights" className={`flex flex-col gap-18 max-[1280px]:grid max-[1280px]:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] ${ROW_STAGGER}`}>
          <SystemSignalCard stats={stats} />
          <BehavioralLeakCard stats={stats} leak={leak} />
          <PerformanceCalendar dailyPl={stats.dailyPl} />
        </div>
      </div>

      <RecentActivity trades={trades} />
    </>
  )
}
