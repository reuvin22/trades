import type { StoredTrade } from '../lib/trades'
import { CheckCircleIcon, ChevronRightIcon, XCircleIcon } from './Icons'
import {
  CARD,
  CARD_HEAD,
  CARD_TITLE,
  LINK,
  MONO,
  NEG,
  POS,
  ROW,
  ROWS_STAGGER,
  SIDE_BADGE,
  SIDE_LONG,
  SIDE_SHORT,
  TABLE,
  TABLE_EMPTY,
  TABLE_WRAP,
  TD,
  TH,
  TICKER,
} from './ui'

/** The trades that moved the account most, win or lose. */
function highImpact(trades: StoredTrade[]) {
  return [...trades]
    .filter((trade) => trade.netPl !== null)
    .sort((a, b) => Math.abs(b.netPl ?? 0) - Math.abs(a.netPl ?? 0))
    .slice(0, 6)
}

function percentMoved(trade: StoredTrade): string {
  if (trade.entryPrice === null || trade.exitPrice === null || trade.entryPrice === 0) {
    return '—'
  }

  const move =
    trade.direction === 'Long'
      ? (trade.exitPrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - trade.exitPrice) / trade.entryPrice

  return `${move >= 0 ? '+' : ''}${(move * 100).toFixed(2)}%`
}

export function TradeLog({ trades }: { trades: StoredTrade[] }) {
  const rows = highImpact(trades)

  return (
    <section className={`${CARD} px-28 pt-26 pb-20`}>
      <div className={CARD_HEAD}>
        <h2 className={CARD_TITLE}>High-Impact Trade Log</h2>
        <a className={LINK} href="#/journal">
          View All Records
          <ChevronRightIcon />
        </a>
      </div>

      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-620`}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Ticker</th>
              <th scope="col" className={TH}>Side</th>
              <th scope="col" className={TH}>Strategy</th>
              <th scope="col" className={`${TH} text-right`}>R:R</th>
              <th scope="col" className={`${TH} text-right`}>P/L (%)</th>
              <th scope="col" className={`${TH} text-center`}>Result</th>
            </tr>
          </thead>
          <tbody className={ROWS_STAGGER}>
            {rows.map((trade) => {
              const win = (trade.netPl ?? 0) >= 0

              return (
                <tr key={trade.id} className={ROW}>
                  <td className={`${TD} py-13`}>
                    <span className={TICKER}>{trade.ticker || '—'}</span>
                  </td>
                  <td className={`${TD} py-13`}>
                    <span
                      className={`${SIDE_BADGE} ${trade.direction === 'Long' ? SIDE_LONG : SIDE_SHORT}`}
                    >
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className={`${TD} py-13 text-[13px] text-fg-dim`}>{trade.setup || 'Unlabelled'}</td>
                  <td className={`${TD} ${MONO} py-13 text-right`}>
                    {trade.riskReward === null ? '—' : `1 : ${trade.riskReward.toFixed(1)}`}
                  </td>
                  <td className={`${TD} ${MONO} py-13 text-right ${win ? POS : NEG}`}>
                    {percentMoved(trade)}
                  </td>
                  <td className={`${TD} py-13 text-center`}>
                    {win ? (
                      <CheckCircleIcon className="inline-block text-green" />
                    ) : (
                      <XCircleIcon className="inline-block text-red" />
                    )}
                    <span className="sr-only">{win ? 'Win' : 'Loss'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className={TABLE_EMPTY}>
            Closed trades will be ranked here by how much they moved the account.
          </p>
        )}
      </div>
    </section>
  )
}
