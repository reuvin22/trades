import { AnimatedNumber } from './AnimatedNumber'
import { currency, shortDate } from '../data/dashboard'
import { formatFactor, formatHold, type DerivedStats } from '../lib/stats'
import {
  AlertIcon,
  ClockIcon,
  ExpectancyIcon,
  ScalesIcon,
  TrendIcon,
} from './Icons'

export function MetricCards({ stats }: { stats: DerivedStats }) {
  return (
    <div className="metric-row">
      <article className="card metric-card">
        <div className="metric-head">
          <p className="metric-label">Expectancy</p>
          <ExpectancyIcon className="metric-icon" />
        </div>
        <p className={`metric-value${stats.expectancy < 0 ? ' is-negative' : ''}`}>
          <AnimatedNumber value={stats.expectancy} format={(n) => currency.format(n)} />
        </p>
        <div className="metric-foot">
          <span className={stats.monthPct >= 0 ? 'delta' : 'delta is-down'}>
            <TrendIcon size={13} />
            {stats.monthPct >= 0 ? '+' : ''}
            {stats.monthPct.toFixed(1)}%
          </span>
        </div>
      </article>

      <article className="card metric-card">
        <div className="metric-head">
          <p className="metric-label">Profit Factor</p>
          <ScalesIcon className="metric-icon" />
        </div>
        <p className="metric-value">{formatFactor(stats.profitFactor)}</p>
        <div className="metric-foot">
          {stats.profitFactor >= 2 ? 'Industry Top 5%' : 'Target: 2.0+'}
        </div>
      </article>

      <article className="card metric-card">
        <div className="metric-head">
          <p className="metric-label">Max Drawdown</p>
          <AlertIcon className="metric-icon" />
        </div>
        <p className="metric-value is-negative">
          <AnimatedNumber
            value={stats.maxDrawdownPct}
            format={(n) => `-${n.toFixed(1)}%`}
          />
        </p>
        <div className="metric-foot">
          {stats.maxDrawdownAt ? `Last: ${shortDate.format(stats.maxDrawdownAt)}` : 'None yet'}
        </div>
      </article>

      <article className="card metric-card">
        <div className="metric-head">
          <p className="metric-label">Avg. Hold Time</p>
          <ClockIcon className="metric-icon" />
        </div>
        <p className="metric-value">{formatHold(stats.avgHoldMinutes)}</p>
        <div className="metric-foot">
          {stats.avgHoldMinutes > 480 ? 'Swing Focused' : 'Intraday Focused'}
        </div>
      </article>
    </div>
  )
}
