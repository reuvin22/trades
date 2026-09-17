import { useMemo } from 'react'
import { bySetup } from '../lib/dashboardStats'
import type { StoredTrade } from '../lib/trades'
import {
  CARD,
  CARD_HOVER,
  NEG,
  PANEL,
  PANEL_EMPTY,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  POS,
  SETUP_BODY,
  SETUP_HEAD,
  SETUP_NAME,
  SETUP_TABLE,
} from './ui'

/** Rows past this are a scroll, not a summary. Everything is in Analytics. */
const SHOWN = 6

/**
 * What each setup is actually worth.
 *
 * Ranked by money rather than win rate, which is the whole argument: a setup
 * that wins four times in ten and pays four to one is the best thing in the
 * book, and a ranking by win rate buries it under a scalp that wins often and
 * nets nothing.
 *
 * "—" where a figure cannot be stated: no losses to divide by, or no stop
 * logged to measure R against. The blanks are informative — they show which
 * trades are being filed without the detail that makes them reviewable.
 */
export function SetupTable({
  trades,
  money,
}: {
  trades: StoredTrade[]
  money: (value: number) => string
}) {
  const rows = useMemo(() => bySetup(trades), [trades])
  const shown = rows.slice(0, SHOWN)

  return (
    <article className={`${CARD} ${CARD_HOVER} ${PANEL}`}>
      <div className={PANEL_HEAD}>
        <h3 className={PANEL_TITLE}>Strategy Performance</h3>
        {rows.length > SHOWN && (
          <span className={PANEL_NOTE}>
            top {SHOWN} of {rows.length}
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <p className={PANEL_EMPTY}>
          Name the setup when you log a trade and this ranks them by what each
          one earns you.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className={SETUP_TABLE}>
            <thead className={SETUP_HEAD}>
              <tr>
                <th>Setup</th>
                <th>Trades</th>
                <th>Win %</th>
                <th>PF</th>
                <th>Avg R</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody className={SETUP_BODY}>
              {shown.map((row) => (
                <tr key={row.label}>
                  <td>
                    <span className={SETUP_NAME} title={row.label}>
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
                    {row.avgR === null ? '—' : `${row.avgR > 0 ? '+' : ''}${row.avgR.toFixed(2)}R`}
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
