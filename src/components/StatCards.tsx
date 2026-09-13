import type { ReactNode } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
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

/**
 * The five figures at the top of the dashboard.
 *
 * These five and not others, because between them they answer the only
 * questions worth asking first: am I up, how often am I right, how much do I
 * make when I am right against what I lose when I am wrong, what is one trade
 * worth on average, and how bad has it got.
 *
 * Expectancy is in **R** rather than money — a figure in dollars says nothing
 * without knowing the account behind it, while "+0.34R" travels. It is
 * measured from the stop, so it reads the trades that logged one; the card
 * says how many that was rather than quietly averaging a handful.
 *
 * Today's P&L used to sit here. It was moved out for Expectancy: on a day with
 * no trades it reads +$0.00, which is not a fact about your trading.
 */
export function StatCards({
  stats,
  currency,
  expectancyR,
  rSample,
}: {
  stats: DerivedStats
  currency: (value: number) => string
  /** Mean realised R. Null when no trade recorded a stop. */
  expectancyR: number | null
  rSample: number
}) {
  const down = 'text-red [&>svg]:-scale-y-100'
  // The meter only needs a width; the figure beside it keeps its decimal.
  const winRate = stats.winRate

  return (
    <div data-tour="stats" className={`${STAT_ROW} ${ROW_STAGGER}`}>
      <StatCard
        label="Net P&L"
        tone={stats.netPl >= 0 ? 'positive' : 'negative'}
        value={<AnimatedNumber value={stats.netPl} format={(n) => currency(n)} />}
      >
        <span className={`${DELTA} ${stats.monthPct >= 0 ? '' : down}`}>
          <TrendIcon />
          {stats.monthPct >= 0 ? '+' : ''}
          {stats.monthPct.toFixed(1)}% this month
        </span>
      </StatCard>

      <StatCard
        label="Win Rate"
        value={<AnimatedNumber value={stats.winRate} format={(n) => `${n.toFixed(1)}%`} />}
      >
        <div
          className={METER}
          role="img"
          aria-label={`${winRate.toFixed(1)} percent win rate`}
        >
          <span
            className={`${METER_FILL} animate-meter origin-left`}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </StatCard>

      <StatCard label="Profit Factor" value={formatFactor(stats.profitFactor)}>
        <span>
          {stats.closedCount} closed {stats.closedCount === 1 ? 'trade' : 'trades'}
        </span>
      </StatCard>

      <StatCard
        label="Expectancy"
        tone={
          expectancyR === null ? 'default' : expectancyR >= 0 ? 'positive' : 'negative'
        }
        value={
          expectancyR === null ? (
            '—'
          ) : (
            <AnimatedNumber
              value={expectancyR}
              format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(2)}R`}
            />
          )
        }
      >
        <span>
          {rSample === 0 ? 'Needs a stop-loss logged' : `Per trade, over ${rSample}`}
        </span>
      </StatCard>

      <StatCard
        label="Max Drawdown"
        tone={stats.maxDrawdownPct > 0 ? 'negative' : 'default'}
        value={
          stats.maxDrawdownPct === 0 ? (
            '—'
          ) : (
            <AnimatedNumber
              value={stats.maxDrawdownPct}
              format={(n) => `-${n.toFixed(1)}%`}
            />
          )
        }
      >
        <span>
          {stats.maxDrawdownPct === 0 ? 'No drawdown yet' : 'Peak to trough'}
        </span>
      </StatCard>
    </div>
  )
}
