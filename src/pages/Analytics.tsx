import { MetricCards } from '../components/MetricCards'
import { RollingEquityCurve } from '../components/RollingEquityCurve'
import { StrategyEdge } from '../components/StrategyEdge'
import { TradeLog } from '../components/TradeLog'
import { DateRangeIcon, FilterIcon } from '../components/Icons'
import { deriveStats } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import '../styles/analytics.css'

type AnalyticsProps = {
  trades: StoredTrade[]
}

export function Analytics({ trades }: AnalyticsProps) {
  const stats = deriveStats(trades)

  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Analytics Engine</h2>
          <p className="page-sub">
            Performance breakdown across {stats.tradeCount}{' '}
            {stats.tradeCount === 1 ? 'logged trade' : 'logged trades'}.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="pill">
            <DateRangeIcon />
            Last 90 Days
          </button>
          <button type="button" className="pill">
            <FilterIcon />
            Filter
          </button>
        </div>
      </div>

      <MetricCards stats={stats} />

      <div className="analytics-grid">
        <RollingEquityCurve equity={stats.equity} />
        <StrategyEdge stats={stats} />
      </div>

      <TradeLog trades={trades} />
    </>
  )
}
