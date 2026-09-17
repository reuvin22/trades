import { AnimatedNumber } from './AnimatedNumber'
import { formatFactor, type DerivedStats } from '../lib/stats'

/** Dense metric tiles modelled after a trading terminal's account summary. */
export function StatCards({ stats, currency, opening }: { stats: DerivedStats; currency: (value: number) => string; opening: number }) {
  const metrics = [
    { label: 'Account Balance', value: <AnimatedNumber value={opening + stats.netPl} format={currency} />, note: `${stats.monthPct >= 0 ? '+' : ''}${stats.monthPct.toFixed(1)}% this month`, positive: stats.monthPct >= 0 },
    { label: 'Total P&L', value: <AnimatedNumber value={stats.netPl} format={currency} />, note: `${stats.closedCount} closed trades`, positive: stats.netPl >= 0, featured: true },
    { label: 'Win Rate', value: <AnimatedNumber value={stats.winRate} format={(n) => `${n.toFixed(0)}%`} />, note: `${Math.round(stats.winRate * stats.closedCount / 100)} wins / ${stats.closedCount} trades`, positive: true },
    { label: 'Profit Factor', value: formatFactor(stats.profitFactor), note: 'Gross profit / loss', positive: stats.profitFactor !== null && stats.profitFactor >= 1 },
    { label: 'Max Drawdown', value: stats.maxDrawdownPct ? `-${stats.maxDrawdownPct.toFixed(1)}%` : '—', note: 'Peak to trough', positive: false },
    { label: 'Average Trade', value: stats.closedCount ? currency(stats.netPl / stats.closedCount) : '—', note: 'Realized average', positive: stats.netPl >= 0 },
  ]

  return <section className="terminal-stat-grid" aria-label="Account performance">
    {metrics.map((metric) => <article key={metric.label} className={`terminal-stat ${metric.featured ? 'terminal-stat-featured' : ''}`}>
      <p>{metric.label}</p>
      <strong className={metric.positive ? 'text-green' : metric.label === 'Max Drawdown' ? 'text-red' : ''}>{metric.value}</strong>
      <span className={metric.positive ? 'text-green' : ''}>{metric.note}</span>
    </article>)}
  </section>
}
