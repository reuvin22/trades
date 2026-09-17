import { useMemo } from 'react'
import { RollingEquityCurve } from './RollingEquityCurve'
import { byHour, byMistake } from '../lib/analytics'
import { bySetup } from '../lib/dashboardStats'
import type { DerivedStats } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'

const COLORS = ['#2dd5a1', '#67d89c', '#f1c765', '#ef6d74', '#73869b']

export function AnalyticsBoard({ trades, stats, capital }: { trades: StoredTrade[]; stats: DerivedStats; capital: number }) {
  const setups = useMemo(() => bySetup(trades).slice(0, 3), [trades])
  const hours = useMemo(() => byHour(trades), [trades])
  const mistakes = useMemo(() => byMistake(trades).slice(0, 5), [trades])
  const maxSetup = Math.max(1, ...setups.map((item) => Math.abs(item.netPl)))
  const maxHour = Math.max(1, ...hours.map((item) => Math.abs(item.netPl)))
  const mistakeTotal = mistakes.reduce((sum, item) => sum + Math.abs(item.netPl), 0)
  const gradient = mistakes.length ? `conic-gradient(${mistakes.map((_item, index) => `${COLORS[index]} ${mistakes.slice(0, index).reduce((sum, part) => sum + Math.abs(part.netPl) / mistakeTotal * 100, 0)}% ${mistakes.slice(0, index + 1).reduce((sum, part) => sum + Math.abs(part.netPl) / mistakeTotal * 100, 0)}%`).join(',')})` : 'conic-gradient(var(--color-tint-3) 0 100%)'

  return <section className="analytics-board">
    <div className="analytics-kpis">
      <article><span>Expected Win Rate</span><strong className="analytics-gauge">{stats.winRate.toFixed(0)}%</strong></article>
      <article><span>Avg R-Multiple</span><strong className="text-green">{stats.avgR.toFixed(2)}R</strong></article>
      <article><span>Max Drawdown</span><strong className="text-red">-{stats.maxDrawdownPct.toFixed(2)}%</strong></article>
    </div>
    <div className="analytics-curve"><RollingEquityCurve equity={stats.equity} opening={capital} /></div>
    <article className="analytics-setup"><h3>Setup Efficiency</h3>{setups.length ? setups.map((setup) => <div key={setup.label}><span>{setup.label}</span><i><b style={{ width: `${Math.abs(setup.netPl) / maxSetup * 100}%` }} /></i><em>{setup.netPl >= 0 ? '+' : ''}{setup.netPl.toFixed(0)}</em></div>) : <p>No setup data yet.</p>}</article>
    <article className="analytics-hours"><h3>P&L by Hour & Day</h3><div>{Array.from({ length: 35 }, (_, index) => { const entry = hours[index % Math.max(1, hours.length)]; const intensity = entry ? Math.max(.12, Math.abs(entry.netPl) / maxHour) : 0; return <span key={index} style={{ opacity: intensity, background: entry?.netPl && entry.netPl < 0 ? 'var(--color-red)' : 'var(--color-accent)' }} /> })}</div><small>Mon&nbsp;&nbsp; Tue&nbsp;&nbsp; Wed&nbsp;&nbsp; Thu&nbsp;&nbsp; Fri</small></article>
    <article className="analytics-mistakes"><h3>Mistake Impact</h3><div className="analytics-donut" style={{ background: gradient }}><i /></div><ul>{mistakes.map((mistake, index) => <li key={mistake.label}><b style={{ background: COLORS[index] }} />{mistake.label}</li>)}</ul></article>
  </section>
}
