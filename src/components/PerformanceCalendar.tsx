import type { CSSProperties } from 'react'
import { dayKey } from '../lib/stats'
import { CARD, CARD_HOVER } from './ui'

const WEEKS = 16

/** Fixed heat colours: these are data values, not theme surfaces, so they hold
 *  the same reading in either theme. */
const HEAT = [
  'bg-[#f0484c]',
  'bg-[#bb2f33]',
  'bg-[#7c2226]',
  'bg-tint-2',
  'bg-[#1f7a45]',
  'bg-[#2fae5c]',
  'bg-[#45d97a]',
]

/** Buckets a day's P&L against the largest absolute day in the window. */
function heatClass(result: number | null, scale: number) {
  if (result === null || result === 0) return HEAT[3]

  const share = scale === 0 ? 0 : result / scale
  if (share > 0.5) return HEAT[6]
  if (share > 0.2) return HEAT[5]
  if (share > 0) return HEAT[4]
  if (share > -0.2) return HEAT[2]
  if (share > -0.5) return HEAT[1]
  return HEAT[0]
}

export function PerformanceCalendar({ dailyPl }: { dailyPl: Map<string, number> }) {
  // Start on the Sunday that opens the window so weekday rows stay aligned.
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (WEEKS * 7 - 1))
  start.setDate(start.getDate() - start.getDay())

  const cells: { key: string; value: number | null }[] = []
  for (let index = 0; index < WEEKS * 7; index++) {
    const day = new Date(start)
    day.setDate(day.getDate() + index)
    const key = dayKey(day)
    cells.push({ key, value: dailyPl.get(key) ?? null })
  }

  const scale = Math.max(1, ...cells.map((cell) => Math.abs(cell.value ?? 0)))

  return (
    <article className={`${CARD} ${CARD_HOVER} px-20 pt-18 pb-16`}>
      <p className="text-[10.5px] font-medium tracking-[0.13em] text-fg-dim uppercase">
        Performance Calendar{' '}
        <span className="ml-6 tracking-[0.04em] text-fg-muted normal-case">
          Last {WEEKS} Weeks
        </span>
      </p>

      <div
        className="mt-14 mb-12 grid grid-flow-col grid-rows-7 auto-cols-fr gap-3"
        role="img"
        aria-label={`Daily profit and loss over the last ${WEEKS} weeks`}
      >
        {cells.map((cell, index) => (
          <span
            key={cell.key}
            /* Each cell pops in 5ms after the one before, off its own index. */
            className={`aspect-square animate-pop rounded-[2px] [animation-delay:calc(var(--i)*5ms)] ${heatClass(cell.value, scale)}`}
            title={cell.value === null ? cell.key : `${cell.key}: ${cell.value.toFixed(2)}`}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
      </div>

      <div className="flex justify-between text-[9.5px] tracking-[0.13em] text-fg-muted uppercase">
        <span>Loss</span>
        <span>Profit</span>
      </div>
    </article>
  )
}
