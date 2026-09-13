import { useMemo } from 'react'
import { disciplineScore } from '../lib/dashboardStats'
import type { StoredTrade } from '../lib/trades'
import {
  CARD,
  CARD_HOVER,
  PANEL,
  PANEL_EMPTY,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  SCORE_FILL,
  SCORE_LINE,
  SCORE_NAME,
  SCORE_PCT,
  SCORE_ROW,
  SCORE_TRACK,
  SCORE_VALUE,
} from './ui'

/** Green, amber, red. The bands a trader would use on themselves. */
function toneFor(value: number): string {
  if (value >= 85) return 'text-green'
  if (value >= 65) return 'text-amber'
  return 'text-red'
}

function barFor(value: number): string {
  if (value >= 85) return 'bg-green'
  if (value >= 65) return 'bg-amber'
  return 'bg-red'
}

/**
 * How often the plan was followed — graded apart from whether it paid.
 *
 * Keeping the two separate is the point. A trader can break every rule and
 * still have a good week, and that is the week that teaches the worst lesson.
 * A 40% score beside a green P&L is legible as the warning it is; the same
 * facts blended into one number are not.
 *
 * Unanswered questions are skipped rather than counted as failures. A blank
 * means "not graded", not "broke the rule", and scoring them the same would
 * punish whoever filled the form in quickly.
 */
export function DisciplineCard({ trades }: { trades: StoredTrade[] }) {
  const grade = useMemo(() => disciplineScore(trades), [trades])

  const parts = [
    { name: 'Entry', value: grade.entry },
    { name: 'Exit', value: grade.exit },
    { name: 'Management', value: grade.management },
  ]

  return (
    <article className={`${CARD} ${CARD_HOVER} ${PANEL}`}>
      <div className={PANEL_HEAD}>
        <h3 className={PANEL_TITLE}>Discipline score</h3>
        {grade.graded > 0 && (
          <span className={PANEL_NOTE}>
            {grade.graded} of {grade.total} graded
          </span>
        )}
      </div>

      {grade.score === null ? (
        <p className={PANEL_EMPTY}>
          Answer the three plan questions when you log a trade — entry, exit,
          management — and this scores how closely you followed it.
        </p>
      ) : (
        <>
          <p className={`${SCORE_VALUE} ${toneFor(grade.score)}`}>
            {Math.round(grade.score)}
            <span className="text-[17px] font-normal text-fg-muted"> / 100</span>
          </p>

          <div className={SCORE_ROW}>
            {parts.map((part) => (
              <div key={part.name} className={SCORE_LINE}>
                <span className={SCORE_NAME}>{part.name}</span>
                <span className={SCORE_TRACK}>
                  {part.value !== null && (
                    <span
                      className={`${SCORE_FILL} ${barFor(part.value)}`}
                      style={{ width: `${part.value}%` }}
                    />
                  )}
                </span>
                <span className={SCORE_PCT}>
                  {part.value === null ? '—' : `${Math.round(part.value)}%`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  )
}
