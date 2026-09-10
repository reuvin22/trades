import type { ReactNode } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import { currency } from '../data/dashboard'
import { formatFactor, type DerivedStats } from '../lib/stats'
import { TrendIcon } from './Icons'

type StatCardProps = {
  label: string
  value: ReactNode
  tone?: 'default' | 'positive' | 'negative'
  children: ReactNode
}

function StatCard({ label, value, tone = 'default', children }: StatCardProps) {
  const toneClass =
    tone === 'positive' ? ' is-positive' : tone === 'negative' ? ' is-negative' : ''

  return (
    <article className="card stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value${toneClass}`}>{value}</p>
      <div className="stat-foot">{children}</div>
    </article>
  )
}

export function StatCards({ stats }: { stats: DerivedStats }) {
  const winRate = Math.round(stats.winRate)

  return (
    <div className="stat-row">
      <StatCard
        label="Net P/L"
        value={<AnimatedNumber value={stats.netPl} format={(n) => currency.format(n)} />}
      >
        <span className={stats.monthPct >= 0 ? 'delta' : 'delta is-down'}>
          <TrendIcon />
          {stats.monthPct >= 0 ? '+' : ''}
          {stats.monthPct.toFixed(1)}% this month
        </span>
      </StatCard>

      <StatCard
        label="Today's P/L"
        tone={stats.todayPl >= 0 ? 'positive' : 'negative'}
        value={
          <AnimatedNumber
            value={stats.todayPl}
            format={(n) => `${n >= 0 ? '+' : '-'}${currency.format(Math.abs(n))}`}
          />
        }
      >
        <span>
          {stats.todayCount} {stats.todayCount === 1 ? 'trade' : 'trades'} today
        </span>
      </StatCard>

      <StatCard
        label="Win Rate"
        value={<AnimatedNumber value={stats.winRate} format={(n) => `${Math.round(n)}%`} />}
      >
        <div className="meter" role="img" aria-label={`${winRate} percent win rate`}>
          <span style={{ width: `${winRate}%` }} />
        </div>
      </StatCard>

      <StatCard
        label="Avg R"
        value={<AnimatedNumber value={stats.avgR} format={(n) => n.toFixed(1)} />}
      >
        <span>Risk-adjusted return</span>
      </StatCard>

      <StatCard label="Profit Factor" value={formatFactor(stats.profitFactor)}>
        <span>
          {stats.closedCount} closed {stats.closedCount === 1 ? 'trade' : 'trades'}
        </span>
      </StatCard>
    </div>
  )
}
