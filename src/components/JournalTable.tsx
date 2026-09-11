import { useState } from 'react'
import { currency, signed } from '../data/dashboard'
import { JOURNAL_TRADES, type JournalTrade } from '../data/journal'
import type { StoredTrade } from '../lib/trades'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import {
  CARD,
  CHIP,
  MONO,
  NEG,
  PAGER_ACTIVE,
  PAGER_BUTTON,
  POS,
  RESULT_BADGE,
  RESULT_LOSS,
  RESULT_WIN,
  ROW,
  ROWS_STAGGER,
  SIDE_BADGE,
  SIDE_LONG,
  SIDE_SHORT,
  TABLE,
  TABLE_EMPTY,
  TD,
  TH,
  TICKER,
} from './ui'

const PAGE_SIZE = 8

type JournalTableProps = {
  trades: StoredTrade[]
  loading: boolean
  live: boolean
}

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Maps a stored trade onto the row shape the table already renders. */
function toRow(trade: StoredTrade): JournalTrade {
  const opened = trade.entryAt ? new Date(trade.entryAt) : trade.createdAt
  const valid = opened instanceof Date && !Number.isNaN(opened.getTime())
  const pl = trade.netPl ?? 0

  return {
    id: trade.id,
    ticker: trade.ticker || '—',
    side: trade.direction,
    date: valid ? `${dayFormat.format(opened)},` : '—',
    time: valid ? timeFormat.format(opened) : '',
    setup: trade.setup || '—',
    broker: trade.sizeUnit ? `${trade.size ?? 0} ${trade.sizeUnit}` : '—',
    strategy: trade.setup || 'Unlabelled',
    result: pl >= 0 ? 'Winner' : 'Loser',
    pl,
  }
}

export function JournalTable({ trades, loading, live }: JournalTableProps) {
  const [page, setPage] = useState(1)

  const rows: JournalTrade[] = live ? trades.map(toRow) : JOURNAL_TRADES
  const total = live ? rows.length : 42
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const visible = live
    ? rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
    : rows

  return (
    <section data-tour="journal-table" className={`${CARD} overflow-hidden p-0`}>
      <div className="overflow-x-auto">
        <table className={`${TABLE} min-w-860`}>
          <thead>
            <tr className="bg-tint-1">
              <th scope="col" className={`${TH} px-18 py-14`}>Ticker</th>
              <th scope="col" className={`${TH} px-18 py-14`}>Date</th>
              <th scope="col" className={`${TH} px-18 py-14`}>Setup</th>
              <th scope="col" className={`${TH} px-18 py-14`}>{live ? 'Size' : 'Broker'}</th>
              <th scope="col" className={`${TH} px-18 py-14`}>Strategy</th>
              <th scope="col" className={`${TH} px-18 py-14`}>Result</th>
              <th scope="col" className={`${TH} px-18 py-14 text-right`}>P&amp;L</th>
            </tr>
          </thead>
          <tbody className={ROWS_STAGGER}>
            {visible.map((trade) => (
              <tr key={trade.id} className={ROW}>
                <td className={`${TD} px-18 py-16`}>
                  <span className="inline-flex items-center gap-9">
                    <span className={`size-7 flex-none rounded-full ${trade.side === 'Long' ? 'bg-green shadow-[0_0_8px_color-mix(in_srgb,var(--color-green)_70%,transparent)]' : 'bg-red shadow-[0_0_8px_color-mix(in_srgb,var(--color-red)_70%,transparent)]'}`} />
                    <span className={TICKER}>{trade.ticker}</span>
                    <span className={`${SIDE_BADGE} ${trade.side === 'Long' ? SIDE_LONG : SIDE_SHORT}`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </span>
                </td>
                <td className={`${TD} flex flex-col px-18 py-16 text-[12.5px] leading-[1.35]`}>
                  <span>{trade.date}</span>
                  <span className="text-fg-muted">{trade.time}</span>
                </td>
                <td className={`${TD} px-18 py-16 text-[13px] text-fg-dim`}>{trade.setup}</td>
                <td className={`${TD} px-18 py-16 text-[13px] text-fg-dim`}>{trade.broker}</td>
                <td className={`${TD} px-18 py-16`}>
                  <span className={`${CHIP} rounded-sm bg-tint-2 px-11`}>{trade.strategy}</span>
                </td>
                <td className={`${TD} px-18 py-16`}>
                  <span
                    className={`${RESULT_BADGE} ${trade.result === 'Winner' ? RESULT_WIN : RESULT_LOSS}`}
                  >
                    {trade.result}
                  </span>
                </td>
                <td className={`${TD} ${MONO} px-18 py-16 text-right ${trade.pl >= 0 ? POS : NEG}`}>
                  {trade.pl >= 0 ? signed(trade.pl) : `-${currency.format(Math.abs(trade.pl))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {live && visible.length === 0 && (
          <p className={TABLE_EMPTY}>
            {loading
              ? 'Loading your journal…'
              : 'No trades logged yet. Use Quick Add Trade to record your first one.'}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-16 border-t border-line px-20 pt-16 pb-18">
        <p className="text-[12.5px] text-fg-muted">
          Showing {visible.length} of {total} trades
        </p>

        <nav className="flex items-center gap-6" aria-label="Trade pages">
          <button
            type="button"
            className={PAGER_BUTTON}
            aria-label="Previous page"
            disabled={current === 1}
            onClick={() => setPage(Math.max(1, current - 1))}
          >
            <ChevronLeftIcon />
          </button>

          {Array.from({ length: live ? pageCount : 3 }, (_, index) => index + 1).map(
            (number) => (
              <button
                key={number}
                type="button"
                className={`${PAGER_BUTTON} ${current === number ? PAGER_ACTIVE : ''}`}
                aria-current={current === number ? 'page' : undefined}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ),
          )}

          <button
            type="button"
            className={PAGER_BUTTON}
            aria-label="Next page"
            disabled={current === (live ? pageCount : 3)}
            onClick={() => setPage(Math.min(live ? pageCount : 3, current + 1))}
          >
            <ChevronRightIcon />
          </button>
        </nav>
      </div>
    </section>
  )
}
