import { EquityChart } from '../components/EquityChart'
import { BehavioralLeakCard, SystemSignalCard } from '../components/InsightCards'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RecentActivity } from '../components/RecentActivity'
import { StatCards } from '../components/StatCards'
import { deriveStats } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'

type DashboardProps = {
  trades: StoredTrade[]
}

export function Dashboard({ trades }: DashboardProps) {
  const stats = deriveStats(trades)

  return (
    <>
      <StatCards stats={stats} />

      <div className="dashboard-grid">
        <EquityChart equity={stats.equity} />

        <div className="insight-column">
          <SystemSignalCard stats={stats} />
          <BehavioralLeakCard stats={stats} />
          <PerformanceCalendar dailyPl={stats.dailyPl} />
        </div>
      </div>

      <RecentActivity trades={trades} />
    </>
  )
}
