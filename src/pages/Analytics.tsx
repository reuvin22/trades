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
  PILL_IDLE,
} from '../components/ui'
import { deriveStats, startingCapital } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import type { Profile as ProfileRecord } from '../lib/profile'

type AnalyticsProps = {
  trades: StoredTrade[]
  /** For the account size every percentage here is measured against. */
  profile: ProfileRecord | null
}

export function Analytics({ trades, profile }: AnalyticsProps) {
  const opening = startingCapital(profile)
  const stats = deriveStats(trades, opening)

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
          <button type="button" className={`${PILL} ${PILL_IDLE}`}>
            <DateRangeIcon />
            Last 90 Days
          </button>
          <button type="button" className={`${PILL} ${PILL_IDLE}`}>
            <FilterIcon />
            Filter
          </button>
        </div>
      </div>

      <MetricCards stats={stats} />

      <div className="grid items-stretch gap-16 grid-cols-[minmax(0,1fr)_300px] max-[1180px]:grid-cols-[minmax(0,1fr)]">
        <RollingEquityCurve equity={stats.equity} opening={opening} />
        <StrategyEdge stats={stats} />
      </div>

      <TradeLog trades={trades} />
    </>
  )
}
