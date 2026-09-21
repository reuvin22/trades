import { useMemo } from 'react'
import { consistencyScore } from '../lib/dashboardStats'
import type { StoredTrade } from '../lib/trades'
import {
  CARD,
  GAUGE_CAPTION,
  GAUGE_DIAL,
  GAUGE_FACE,
  GAUGE_PART_ABOUT,
  GAUGE_PARTS,
  GAUGE_READING,
  GAUGE_READING_LABEL,
  GAUGE_READING_ROW,
  GAUGE_READING_VALUE,
  GAUGE_SPLIT,
  GAUGE_VALUE,
  PANEL,
  PANEL_EMPTY,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
} from './ui'

type Props = {
  /**
   * The whole journal, not the filtered view.
   *
   * Both halves of this figure are absolute — today, and the record across
   * everything ever logged — so handing it a date-filtered list would quietly
   * change what "best ever" means.
   */
  trades: StoredTrade[]
  money: (value: number) => string
}

/**
 * Today's best trade as a share of the best ever.
 *
 * A monitor, not a grade. There is no good or bad reading here, so the dial
 * carries one neutral colour rather than the red/amber/green the discipline
 * gauge uses — a number somebody is watching should not also be telling them
 * off.
 */
export function ConsistencyCard({ trades, money }: Props) {
  const grade = useMemo(() => consistencyScore(trades), [trades])

  return (
    <article className={`${CARD} ${PANEL}`}>
      <div className={PANEL_HEAD}>
        <h3 className={PANEL_TITLE}>Consistency Score</h3>
        {grade.todayCount > 0 && (
          <span className={PANEL_NOTE}>
            {grade.todayCount} today
          </span>
        )}
      </div>

      {grade.score === null ? (
        <p className={PANEL_EMPTY}>
          {grade.best === null || grade.best <= 0
            ? 'Once a trade closes in profit it becomes the figure today is measured against.'
            : 'Nothing closed today yet. This compares your best trade today against your best ever.'}
        </p>
      ) : (
        <div className={GAUGE_SPLIT}>
          <div
            className={`${GAUGE_DIAL} text-accent`}
            style={{
              background: `conic-gradient(currentColor ${
                grade.score * 3.6
              }deg, color-mix(in srgb, var(--color-tint-3) 80%, transparent) 0)`,
            }}
          >
            <div className={GAUGE_FACE}>
              <strong className={GAUGE_VALUE}>{Math.round(grade.score)}%</strong>
              <span className={GAUGE_CAPTION}>of your best</span>
            </div>
          </div>

          <div className={GAUGE_PARTS}>
            <div className={GAUGE_READING_ROW}>
              <div className={GAUGE_READING}>
                <span className={GAUGE_READING_LABEL}>Best today</span>
                <strong className={GAUGE_READING_VALUE}>
                  {grade.today === null ? '—' : money(grade.today)}
                </strong>
              </div>
              <div className={GAUGE_READING}>
                <span className={GAUGE_READING_LABEL}>Best ever</span>
                <strong className={GAUGE_READING_VALUE}>
                  {grade.best === null ? '—' : money(grade.best)}
                </strong>
              </div>
            </div>

            <p className={GAUGE_PART_ABOUT}>
              Today&rsquo;s best trade divided by the best single trade in your
              journal. It reads 100% on a day that sets a new record, and it is
              not affected by the date range above.
            </p>
          </div>
        </div>
      )}
    </article>
  )
}
