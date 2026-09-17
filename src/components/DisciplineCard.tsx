import { useMemo } from 'react'
import { disciplineScore } from '../lib/dashboardStats'
import type { StoredTrade } from '../lib/trades'
import { CARD, PANEL, PANEL_EMPTY, PANEL_HEAD, PANEL_NOTE, PANEL_TITLE } from './ui'

function toneFor(value: number): string {
  if (value >= 85) return 'text-green'
  if (value >= 65) return 'text-amber'
  return 'text-red'
}

/** Circular mindset gauge, keeping the same compliance calculation. */
export function DisciplineCard({ trades }: { trades: StoredTrade[] }) {
  const grade = useMemo(() => disciplineScore(trades), [trades])
  return <article className={`${CARD} ${PANEL}`}>
    <div className={`${PANEL_HEAD} justify-center`}>
      <h3 className={PANEL_TITLE}>Discipline Score</h3>
      {grade.graded > 0 && <span className={PANEL_NOTE}>{grade.graded} graded</span>}
    </div>
    {grade.score === null ? <p className={PANEL_EMPTY}>Log your entry, exit, and management decisions to calculate your discipline score.</p> :
      <div className="flex flex-col items-center">
        <div className={`grid size-124 place-items-center rounded-full ${toneFor(grade.score)}`} style={{ background: `conic-gradient(currentColor ${grade.score * 3.6}deg, color-mix(in srgb, var(--color-tint-3) 80%, transparent) 0)` }}>
          <div className="grid size-104 place-items-center rounded-full bg-panel-solid text-center">
            <strong className="text-[28px] font-semibold leading-none">{(grade.score / 10).toFixed(1)}<small className="text-[13px] font-normal text-fg-muted">/10</small></strong>
            <span className="-mt-18 text-[10px] text-fg-muted">Mindset Health</span>
          </div>
        </div>
      </div>}
  </article>
}
