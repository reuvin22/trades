import type { CSSProperties } from 'react'
import { dayKey } from '../lib/stats'

const WEEKS = 16

/** Buckets a day's P&L against the largest absolute day in the window. */
function heatClass(result: number | null, scale: number) {
  if (result === null || result === 0) return 'cell is-flat'

  const share = scale === 0 ? 0 : result / scale
  if (share > 0.5) return 'cell pos-3'
  if (share > 0.2) return 'cell pos-2'
  if (share > 0) return 'cell pos-1'
  if (share > -0.2) return 'cell neg-1'
  if (share > -0.5) return 'cell neg-2'
  return 'cell neg-3'
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

  const scale = Math.max(
    1,
    ...cells.map((cell) => Math.abs(cell.value ?? 0)),
  )

  return (
    <article className="card calendar-card">
      <p className="calendar-head">
        Performance Calendar <span>Last {WEEKS} Weeks</span>
      </p>

      <div
        className="heatmap"
        role="img"
        aria-label={`Daily profit and loss over the last ${WEEKS} weeks`}
      >
        {cells.map((cell, index) => (
          <span
            key={cell.key}
            className={heatClass(cell.value, scale)}
            title={cell.value === null ? cell.key : `${cell.key}: ${cell.value.toFixed(2)}`}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
      </div>

      <div className="calendar-legend">
        <span>Loss</span>
        <span>Profit</span>
      </div>
    </article>
  )
}
