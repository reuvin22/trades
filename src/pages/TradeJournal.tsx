import { useState } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { JournalTable } from '../components/JournalTable'
import { JOURNAL_FILTERS } from '../data/journal'
import type { StoredTrade } from '../lib/trades'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  ChartBarsIcon,
  ChevronDownIcon,
  DateRangeIcon,
  DownloadIcon,
  ScalesIcon,
  SmileIcon,
} from '../components/Icons'
import '../styles/journal.css'

function FilterSelects() {
  const [values, setValues] = useState(
    () => JOURNAL_FILTERS.map((filter) => filter.options[0]),
  )

  return (
    <>
      {JOURNAL_FILTERS.map((filter, index) => (
        <label key={filter.label} className="card filter-card">
          <span className="filter-label">{filter.label}</span>
          <span className="filter-control">
            <select
              value={values[index]}
              onChange={(event) => {
                const next = event.target.value
                setValues((current) =>
                  current.map((value, i) => (i === index ? next : value)),
                )
              }}
            >
              {filter.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="filter-chevron" />
          </span>
        </label>
      ))}
    </>
  )
}

type TradeJournalProps = {
  uid: string | null
  trades: StoredTrade[]
  loading: boolean
  error: string | null
}

export function TradeJournal({ uid, trades, loading, error }: TradeJournalProps) {
  const live = isFirebaseConfigured && uid !== null

  return (
    <>
      <div className="page-head">
        <div>
          <h2 className="page-title">Trade Journal</h2>
          <p className="page-sub">
            Detailed record of your market execution and psychological state.
          </p>
        </div>

        <div className="page-actions">
          <button type="button" className="pill">
            <DateRangeIcon />
            Last 30 Days
          </button>
          <button type="button" className="pill is-accent">
            <DownloadIcon />
            Export CSV
          </button>
        </div>
      </div>

      <div className="filter-row">
        <FilterSelects />

        <div className="card filter-card is-static">
          <span className="filter-label">Total Volume</span>
          <strong className="filter-figure">
            <AnimatedNumber value={1.24} format={(n) => `${n.toFixed(2)}M Shares`} />
          </strong>
        </div>
      </div>

      {error && (
        <p className="data-error" role="alert">
          {error}
        </p>
      )}

      <JournalTable trades={trades} loading={loading} live={live} />

      <div className="summary-row">
        <article className="card summary-card">
          <p className="summary-label">Win Rate</p>
          <p className="summary-value">
            <AnimatedNumber value={68.4} format={(n) => n.toFixed(1)} />{' '}
            <span className="unit">%</span>
          </p>
          <p className="summary-foot pos">&uarr; +2.1% from last week</p>
          <ChartBarsIcon className="summary-watermark" size={72} />
        </article>

        <article className="card summary-card">
          <p className="summary-label">Profit Factor</p>
          <p className="summary-value">
            <AnimatedNumber value={2.42} format={(n) => n.toFixed(2)} />
          </p>
          <p className="summary-foot">Target: 2.0+</p>
          <ScalesIcon className="summary-watermark" size={72} />
        </article>

        <article className="card summary-card">
          <p className="summary-label">Avg. Emotion Score</p>
          <p className="summary-value">Neutral</p>
          <p className="summary-foot">
            Most common: <span className="emoji">&#128524;</span> Calmed
          </p>
          <SmileIcon className="summary-watermark" size={72} />
        </article>
      </div>
    </>
  )
}
