import { MetricCards } from '../components/MetricCards'
import { RollingEquityCurve } from '../components/RollingEquityCurve'
import { StrategyEdge } from '../components/StrategyEdge'
import { TradeLog } from '../components/TradeLog'
import { DateRangeIcon, FilterIcon } from '../components/Icons'
import {
  PAGE_ACTIONS,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
} from '../components/ui'
import { deriveStats } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'

type AnalyticsProps = {
  trades: StoredTrade[]
}

export function Analytics({ trades }: AnalyticsProps) {
  const stats = deriveStats(trades)

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Analytics Engine</h2>
          <p className={PAGE_SUB}>
            Performance breakdown across {stats.tradeCount}{' '}
            {stats.tradeCount === 1 ? 'logged trade' : 'logged trades'}.
          </p>
        </div>

        <div className={PAGE_ACTIONS}>
          <button type="button" className={PILL}>
            <DateRangeIcon />
            Last 90 Days
          </button>
          <button type="button" className={PILL}>
            <FilterIcon />
            Filter
          </button>
        </div>
      </div>

      <MetricCards stats={stats} />

      <div className="grid items-stretch gap-16 grid-cols-[minmax(0,1fr)_300px] max-[1180px]:grid-cols-[minmax(0,1fr)]">
        <RollingEquityCurve equity={stats.equity} />
        <StrategyEdge stats={stats} />
      </div>

      <TradeLog trades={trades} />
    </>
  )
}
