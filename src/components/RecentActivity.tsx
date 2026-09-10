import { currency, signed } from '../data/dashboard'
import type { StoredTrade } from '../lib/trades'
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from './Icons'

export function RecentActivity({ trades }: { trades: StoredTrade[] }) {
  const recent = trades.slice(0, 5)

  return (
    <section className="card activity-card">
      <div className="card-head">
        <h2 className="card-title">Recent Activity</h2>
        <a className="link" href="#/journal">
          View Journal
          <ChevronRightIcon />
        </a>
      </div>

      <div className="table-wrap">
        <table className="trades">
          <thead>
            <tr>
              <th scope="col">Ticker</th>
              <th scope="col">Setup</th>
              <th scope="col">Side</th>
              <th scope="col" className="num">Entry</th>
              <th scope="col" className="num">Exit</th>
              <th scope="col" className="num">P/L</th>
              <th scope="col" className="mid">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((trade) => (
              <tr key={trade.id}>
                <td>
                  <span className="ticker">{trade.ticker || '—'}</span>
                  <span className="company">
                    {trade.size ?? 0} {trade.sizeUnit}
                  </span>
                </td>
                <td>
                  <span className="chip">{trade.setup || 'Unlabelled'}</span>
                </td>
                <td>
                  <span className={`side ${trade.direction === 'Long' ? 'pos' : 'neg'}`}>
                    {trade.direction === 'Long' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                    {trade.direction}
                  </span>
                </td>
                <td className="num mono">
                  {trade.entryPrice === null ? '—' : currency.format(trade.entryPrice)}
                </td>
                <td className="num mono">
                  {trade.exitPrice === null ? (
                    <span className="dash">–</span>
                  ) : (
                    currency.format(trade.exitPrice)
                  )}
                </td>
                <td className={`num mono ${(trade.netPl ?? 0) >= 0 ? 'pos' : 'neg'}`}>
                  {trade.netPl === null ? '—' : signed(trade.netPl)}
                </td>
                <td className="mid">
                  <span
                    className={`status-dot ${trade.exitPrice === null ? 'open' : ''}`}
                    title={trade.exitPrice === null ? 'Open position' : 'Closed'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recent.length === 0 && (
          <p className="table-empty">
            Nothing logged yet. Use Quick Add Trade to record your first position.
          </p>
        )}
      </div>
    </section>
  )
}
