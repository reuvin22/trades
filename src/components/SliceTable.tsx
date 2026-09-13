import { useState } from 'react'
import type { Slice } from '../lib/analytics'
import {
  CARD,
  NEG,
  PANEL,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  POS,
  SECTION_EMPTY,
  SLICE_BODY,
  SLICE_HEAD,
  SLICE_LABEL,
  SLICE_SORT,
  SLICE_TABLE,
  SLICE_WRAP,
} from './ui'

type Column = 'label' | 'trades' | 'winRate' | 'profitFactor' | 'avgR' | 'netPl'

const HEADINGS: { key: Column; label: string }[] = [
  { key: 'label', label: '' },
  { key: 'trades', label: 'Trades' },
  { key: 'winRate', label: 'Win %' },
  { key: 'profitFactor', label: 'PF' },
  { key: 'avgR', label: 'Avg R' },
  { key: 'netPl', label: 'P&L' },
]

/**
 * One table for every cut on the Analytics page.
 *
 * Shared rather than written per section, because six tables meant six chances
 * for "win rate" to mean six slightly different things. Every row here comes
 * from the same `summarise`, so a figure means the same in the Markets tab as
 * it does in Setups.
 *
 * Sorting keeps nulls at the bottom in both directions. A slice with no R
 * recorded is not the smallest R, it is an unknown one, and letting it win a
 * "worst first" sort would point the trader at the wrong row.
 */
export function SliceTable({
  title,
  rows,
  nameHeading = 'Name',
  money,
  note,
}: {
  /** Omit when the surrounding card already carries the heading. */
  title?: string
  rows: Slice[]
  nameHeading?: string
  money: (value: number) => string
  /** Something to say beside the heading — usually what was excluded. */
  note?: string
}) {
  const [sortOn, setSortOn] = useState<Column>('netPl')
  const [descending, setDescending] = useState(true)

  const sorted = [...rows].sort((a, b) => {
    if (sortOn === 'label') {
      return descending ? b.label.localeCompare(a.label) : a.label.localeCompare(b.label)
    }

    const left = a[sortOn]
    const right = b[sortOn]

    // Unknown sinks, whichever way the column is pointing.
    if (left === null && right === null) return 0
    if (left === null) return 1
    if (right === null) return -1

    return descending ? right - left : left - right
  })

  function toggle(column: Column) {
    if (column === sortOn) setDescending(!descending)
    else {
      setSortOn(column)
      // Names read best A–Z; every number reads best biggest-first.
      setDescending(column !== 'label')
    }
  }

  return (
    <article className={`${CARD} ${PANEL}`}>
      {(title || note) && (
        <div className={PANEL_HEAD}>
          {title && <h3 className={PANEL_TITLE}>{title}</h3>}
          {note && <span className={PANEL_NOTE}>{note}</span>}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className={SECTION_EMPTY}>Nothing to compare here yet.</p>
      ) : (
        <div className={SLICE_WRAP}>
          <table className={SLICE_TABLE}>
            <thead className={SLICE_HEAD}>
              <tr>
                {HEADINGS.map((heading) => (
                  <th
                    key={heading.key}
                    aria-sort={
                      sortOn === heading.key
                        ? descending
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                  >
                    <button
                      type="button"
                      className={SLICE_SORT}
                      onClick={() => toggle(heading.key)}
                    >
                      {heading.key === 'label' ? nameHeading : heading.label}
                      {sortOn === heading.key && <span>{descending ? '↓' : '↑'}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className={SLICE_BODY}>
              {sorted.map((row) => (
                <tr key={row.label}>
                  <td>
                    <span className={SLICE_LABEL} title={row.label}>
                      {row.label}
                    </span>
                  </td>
                  <td>{row.trades}</td>
                  <td>{row.winRate === null ? '—' : `${Math.round(row.winRate)}%`}</td>
                  <td>
                    {row.profitFactor === null
                      ? row.grossProfit > 0
                        ? '∞'
                        : '—'
                      : row.profitFactor.toFixed(2)}
                  </td>
                  <td className={row.avgR === null ? '' : row.avgR >= 0 ? POS : NEG}>
                    {row.avgR === null
                      ? '—'
                      : `${row.avgR > 0 ? '+' : ''}${row.avgR.toFixed(2)}R`}
                  </td>
                  <td className={row.netPl >= 0 ? POS : NEG}>{money(row.netPl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}
