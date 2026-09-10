import type { StoredTrade } from '../lib/trades'
import { CheckCircleIcon, ChevronRightIcon, XCircleIcon } from './Icons'

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
    <section className="card activity-card">
      <div className="card-head">
        <h2 className="card-title">High-Impact Trade Log</h2>
        <a className="link" href="#/journal">
          View All Records
          <ChevronRightIcon />
        </a>
      </div>

      <div className="table-wrap">
        <table className="trades log">
          <thead>
            <tr>
              <th scope="col">Ticker</th>
              <th scope="col">Side</th>
              <th scope="col">Strategy</th>
              <th scope="col" className="num">R:R</th>
              <th scope="col" className="num">P/L (%)</th>
              <th scope="col" className="mid">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trade) => {
              const win = (trade.netPl ?? 0) >= 0

              return (
                <tr key={trade.id}>
                  <td>
                    <span className="ticker">{trade.ticker || '—'}</span>
                  </td>
                  <td>
                    <span
                      className={`side-badge ${trade.direction === 'Long' ? 'long' : 'short'}`}
                    >
                      {trade.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="strategy">{trade.setup || 'Unlabelled'}</td>
                  <td className="num mono">
                    {trade.riskReward === null ? '—' : `1 : ${trade.riskReward.toFixed(1)}`}
                  </td>
                  <td className={`num mono ${win ? 'pos' : 'neg'}`}>
                    {percentMoved(trade)}
                  </td>
                  <td className="mid">
                    {win ? (
                      <CheckCircleIcon className="result win" />
                    ) : (
                      <XCircleIcon className="result loss" />
                    )}
                    <span className="sr-only">{win ? 'Win' : 'Loss'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <p className="table-empty">
            Closed trades will be ranked here by how much they moved the account.
          </p>
        )}
      </div>
    </section>
  )
}
