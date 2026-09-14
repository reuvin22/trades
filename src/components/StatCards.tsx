import type { ReactNode } from 'react'
import { AnimatedNumber } from './AnimatedNumber'
import { formatFactor, type DerivedStats } from '../lib/stats'
import { TrendIcon } from './Icons'
import { StatCard } from './StatCard'
import {
  DELTA,
  METER,
  METER_FILL,
} from './ui'

/**
 * The five figures, each one its own widget.
 *
 * Returned as separate nodes rather than a row, because they are laid out by
 * the widget grid now. As one component rendering its own five-column grid,
 * resizing moved all five together — the group, not the card, which is not
 * what a handle on one card should do.
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
 * Today's P&L used to sit here. It was moved out for Expectancy: on a day
 * with no trades it reads +$0.00, which is not a fact about your trading.
 */
export function statCards({
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
}): Record<string, ReactNode> {
  const down = 'text-red [&>svg]:-scale-y-100'
  // The meter only needs a width; the figure beside it keeps its decimal.
  const winRate = stats.winRate

  return {
    netPl: (
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
    ),

    winRate: (
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
    ),

    profitFactor: (
      <StatCard label="Profit Factor" value={formatFactor(stats.profitFactor)}>
        <span>
          {stats.closedCount} closed {stats.closedCount === 1 ? 'trade' : 'trades'}
        </span>
      </StatCard>
    ),

    expectancy: (
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
    ),

    drawdown: (
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
    ),
  }
}
