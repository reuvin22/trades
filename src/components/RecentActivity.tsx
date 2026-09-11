import { currency, signed } from '../data/dashboard'
import type { StoredTrade } from '../lib/trades'
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from './Icons'
import {
  CARD,
  CARD_HEAD,
  CARD_TITLE,
  CHIP,
  COMPANY,
  DASH,
  LINK,
  MONO,
  NEG,
  POS,
  ROW,
  ROWS_STAGGER,
  STATUS_DOT,
  STATUS_OPEN,
  TABLE,
  TABLE_EMPTY,
  TABLE_WRAP,
  TD,
  TH,
  TICKER,
} from './ui'

export function RecentActivity({ trades }: { trades: StoredTrade[] }) {
  const recent = trades.slice(0, 5)

  return (
    <section data-tour="activity" className={`${CARD} px-28 pt-26 pb-20`}>
      <div className={CARD_HEAD}>
        <h2 className={CARD_TITLE}>Recent Activity</h2>
        <a className={LINK} href="#/journal">
          View Journal
          <ChevronRightIcon />
        </a>
      </div>

      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Ticker</th>
              <th scope="col" className={TH}>Setup</th>
              <th scope="col" className={TH}>Side</th>
              <th scope="col" className={`${TH} text-right`}>Entry</th>
              <th scope="col" className={`${TH} text-right`}>Exit</th>
              <th scope="col" className={`${TH} text-right`}>P/L</th>
              <th scope="col" className={`${TH} text-center`}>Status</th>
            </tr>
          </thead>
          <tbody className={ROWS_STAGGER}>
            {recent.map((trade) => (
              <tr key={trade.id} className={ROW}>
                <td className={TD}>
                  <span className={TICKER}>{trade.ticker || '—'}</span>
                  <span className={COMPANY}>
                    {trade.size ?? 0} {trade.sizeUnit}
                  </span>
                </td>
                <td className={TD}>
                  <span className={CHIP}>{trade.setup || 'Unlabelled'}</span>
                </td>
                <td className={TD}>
                  <span
                    className={`inline-flex items-center gap-5 text-[13.5px] font-medium ${
                      trade.direction === 'Long' ? POS : NEG
                    }`}
                  >
                    {trade.direction === 'Long' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {trade.direction}
                  </span>
                </td>
                <td className={`${TD} ${MONO} text-right`}>
                  {trade.entryPrice === null ? '—' : currency.format(trade.entryPrice)}
                </td>
                <td className={`${TD} ${MONO} text-right`}>
                  {trade.exitPrice === null ? (
                    <span className={DASH}>–</span>
                  ) : (
                    currency.format(trade.exitPrice)
                  )}
                </td>
                <td
                  className={`${TD} ${MONO} text-right ${
                    (trade.netPl ?? 0) >= 0 ? POS : NEG
                  }`}
                >
                  {trade.netPl === null ? '—' : signed(trade.netPl)}
                </td>
                <td className={`${TD} text-center`}>
                  <span
                    className={`${STATUS_DOT} ${trade.exitPrice === null ? STATUS_OPEN : ''}`}
                    title={trade.exitPrice === null ? 'Open position' : 'Closed'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recent.length === 0 && (
          <p className={TABLE_EMPTY}>
            Nothing logged yet. Use Quick Add Trade to record your first position.
          </p>
        )}
      </div>
    </section>
  )
}
