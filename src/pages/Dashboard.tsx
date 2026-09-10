import { EquityChart } from '../components/EquityChart'
import { BehavioralLeakCard, SystemSignalCard } from '../components/InsightCards'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RecentActivity } from '../components/RecentActivity'
import { StatCards } from '../components/StatCards'
import { deriveStats } from '../lib/stats'
import { useBehavioralLeak } from '../lib/insight'
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

      <div className="dashboard-grid">
        <EquityChart equity={stats.equity} />

        <div className="insight-column">
          <SystemSignalCard stats={stats} />
          <BehavioralLeakCard stats={stats} leak={leak} />
          <PerformanceCalendar dailyPl={stats.dailyPl} />
        </div>
      </div>

      <RecentActivity trades={trades} />
    </>
  )
}
