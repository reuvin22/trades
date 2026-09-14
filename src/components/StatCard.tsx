import type { ReactNode } from 'react'
import { CARD, CARD_HOVER, STAT_CARD, STAT_FOOT, STAT_LABEL, STAT_VALUE, TABULAR } from './ui'

type StatCardProps = {
  label: string
  value: ReactNode
  tone?: 'default' | 'positive' | 'negative'
  children: ReactNode
}

/**
 * One headline figure: a label, the number, and what it was measured over.
 *
 * In its own file so `StatCards` can export a plain factory beside it. A
 * module that mixes a component with a non-component export loses fast refresh
 * for everything in it, which is a poor trade for saving a file.
 *
 * `h-full` because these sit in the widget grid, where the box is the
 * trader's to size. Without it a card dragged taller keeps its own height and
 * leaves empty space underneath.
 */
export function StatCard({ label, value, tone = 'default', children }: StatCardProps) {
  const toneClass =
    tone === 'positive' ? 'text-green' : tone === 'negative' ? 'text-red' : ''

  return (
    <article className={`${CARD} ${CARD_HOVER} ${STAT_CARD} h-full`}>
      <p className={STAT_LABEL}>{label}</p>
      <p className={`${STAT_VALUE} ${TABULAR} ${toneClass}`}>{value}</p>
      <div className={STAT_FOOT}>{children}</div>
    </article>
  )
}
