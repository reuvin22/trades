import { useMemo } from 'react'
import { propSummary, type PropAccount } from '../lib/profile'

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const COMPACT = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })

/**
 * Prop firm accounts at a glance, from what was recorded on Profile.
 *
 * Always USD, whatever the journal's base currency: firms price their
 * challenges in dollars, and converting would invent a rate.
 */
export function PropStrip({ accounts }: { accounts: PropAccount[] }) {
  const summary = useMemo(() => propSummary(accounts), [accounts])
  const split = (part: { active: number; blown: number }) => `${part.active} active · ${part.blown} blown`

  const tiles = [
    { label: 'Evals purchased', value: String(summary.evals.total), foot: split(summary.evals) },
    { label: 'Reset evals', value: String(summary.resets.total), foot: split(summary.resets) },
    { label: 'Total spent', value: USD.format(summary.spent), foot: 'Evals and resets' },
    {
      label: 'Funded accounts',
      value: String(summary.funded.active),
      foot: `${summary.funded.blown} blown · ${summary.funded.total} total`,
      featured: true,
    },
    { label: 'Funded capital', value: COMPACT.format(summary.fundedCapital), foot: 'Across active funded accounts' },
  ]

  return (
    <div className="terminal-props" aria-label="Prop firm accounts">
      {tiles.map((tile) => (
        <div key={tile.label} className={`terminal-stat${tile.featured ? ' terminal-stat-featured' : ''}`}>
          <p>{tile.label}</p>
          <strong className="tabular-nums">{tile.value}</strong>
          <span>{tile.foot}</span>
        </div>
      ))}
    </div>
  )
}
