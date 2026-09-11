import type { ReactNode } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import { currency } from '../data/dashboard'
import { formatFactor, type DerivedStats } from '../lib/stats'
import { TrendIcon } from './Icons'
import {
  CARD,
  CARD_HOVER,
  DELTA,
  METER,
  METER_FILL,
  ROW_STAGGER,
  STAT_CARD,
  STAT_FOOT,
  STAT_LABEL,
  STAT_ROW,
  STAT_VALUE,
  TABULAR,
} from './ui'

type StatCardProps = {
  label: string
  value: ReactNode
  tone?: 'default' | 'positive' | 'negative'
  children: ReactNode
}

function StatCard({ label, value, tone = 'default', children }: StatCardProps) {
  const toneClass =
    tone === 'positive' ? 'text-green' : tone === 'negative' ? 'text-red' : ''

  return (
    <article className={`${CARD} ${CARD_HOVER} ${STAT_CARD}`}>
      <p className={STAT_LABEL}>{label}</p>
      <p className={`${STAT_VALUE} ${TABULAR} ${toneClass}`}>{value}</p>
      <div className={STAT_FOOT}>{children}</div>
    </article>
  )
}

export function StatCards({ stats }: { stats: DerivedStats }) {
  const winRate = Math.round(stats.winRate)
  const down = 'text-red [&>svg]:-scale-y-100'

  return (
    <div data-tour="stats" className={`${STAT_ROW} ${ROW_STAGGER}`}>
      <StatCard
        label="Net P/L"
        value={<AnimatedNumber value={stats.netPl} format={(n) => currency.format(n)} />}
      >
        <span className={`${DELTA} ${stats.monthPct >= 0 ? '' : down}`}>
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
        <div className={METER} role="img" aria-label={`${winRate} percent win rate`}>
          <span
            className={`${METER_FILL} animate-meter origin-left`}
            style={{ width: `${winRate}%` }}
          />
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
