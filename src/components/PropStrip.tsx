import { useMemo } from 'react'
import { propSummary, type PropAccount, type PropPayout } from '../lib/profile'

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/**
 * Prop firm accounts at a glance, from what was recorded on Profile.
 *
 * Always USD, whatever the journal's base currency: firms price their
 * challenges and pay out in dollars, and converting would invent a rate.
 * Total profit is payouts less spend, so it is the prop firm side alone,
 * apart from trading P&L.
 */
export function PropStrip({ accounts, payouts }: { accounts: PropAccount[]; payouts: PropPayout[] }) {
  const summary = useMemo(() => propSummary(accounts, payouts), [accounts, payouts])
  const split = (part: { active: number; blown: number }) => `${part.active} active · ${part.blown} blown`
  const profit = summary.profit

  const tiles = [
    { label: 'Evals purchased', value: String(summary.evals.total), foot: split(summary.evals) },
    { label: 'Reset evals', value: String(summary.resets.total), foot: split(summary.resets) },
    { label: 'Total spent', value: USD.format(summary.spent), foot: 'Evals and resets' },
    {
      label: 'Funded accounts',
      value: String(summary.funded.active),
      foot: `${summary.funded.blown} blown · ${summary.funded.total} total`,
    },
    {
      label: 'Payout total',
      value: USD.format(summary.payouts),
      foot: `${summary.payoutCount} ${summary.payoutCount === 1 ? 'payout' : 'payouts'} received`,
    },
    {
      label: 'Total profit',
      value: `${profit > 0 ? '+' : ''}${USD.format(profit)}`,
      foot: 'Payouts less spend, not trading P&L',
      featured: true,
      tone: profit > 0 ? 'text-green!' : profit < 0 ? 'text-red!' : '',
    },
  ]

  return (
    <div className="terminal-props" aria-label="Prop firm accounts">
      {tiles.map((tile) => (
        <div key={tile.label} className={`terminal-stat${tile.featured ? ' terminal-stat-featured' : ''}`}>
          <p>{tile.label}</p>
          <strong className={`tabular-nums ${tile.tone ?? ''}`}>{tile.value}</strong>
          <span>{tile.foot}</span>
        </div>
      ))}
    </div>
  )
}
