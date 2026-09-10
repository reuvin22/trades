import { useState } from 'react'
import { currency, signed } from '../data/dashboard'
import { JOURNAL_TRADES, type JournalTrade } from '../data/journal'
import type { StoredTrade } from '../lib/trades'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

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

/** Maps a Firestore document onto the row shape the table already renders. */
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
    <section className="card journal-card">
      <div className="table-wrap">
        <table className="trades journal">
          <thead>
            <tr>
              <th scope="col">Ticker</th>
              <th scope="col">Date</th>
              <th scope="col">Setup</th>
              <th scope="col">{live ? 'Size' : 'Broker'}</th>
              <th scope="col">Strategy</th>
              <th scope="col">Result</th>
              <th scope="col" className="num">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((trade) => (
              <tr key={trade.id}>
                <td>
                  <span className="ticker-cell">
                    <span className={`dot ${trade.side === 'Long' ? 'up' : 'down'}`} />
                    <span className="ticker">{trade.ticker}</span>
                    <span className={`side-badge ${trade.side === 'Long' ? 'long' : 'short'}`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </span>
                </td>
                <td className="stacked">
                  <span>{trade.date}</span>
                  <span className="muted">{trade.time}</span>
                </td>
                <td className="dim">{trade.setup}</td>
                <td className="dim">{trade.broker}</td>
                <td>
                  <span className="chip soft">{trade.strategy}</span>
                </td>
                <td>
                  <span
                    className={`result-badge ${trade.result === 'Winner' ? 'win' : 'loss'}`}
                  >
                    {trade.result}
                  </span>
                </td>
                <td className={`num mono ${trade.pl >= 0 ? 'pos' : 'neg'}`}>
                  {trade.pl >= 0 ? signed(trade.pl) : `-${currency.format(Math.abs(trade.pl))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {live && visible.length === 0 && (
          <p className="table-empty">
            {loading
              ? 'Loading your journal…'
              : 'No trades logged yet. Use Quick Add Trade to record your first one.'}
          </p>
        )}
      </div>

      <div className="table-foot">
        <p className="foot-count">
          Showing {visible.length} of {total} trades
        </p>

        <nav className="pager" aria-label="Trade pages">
          <button
            type="button"
            className="pager-step"
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
                className={`pager-page${current === number ? ' is-active' : ''}`}
                aria-current={current === number ? 'page' : undefined}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ),
          )}

          <button
            type="button"
            className="pager-step"
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
