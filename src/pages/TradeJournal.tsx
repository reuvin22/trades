import { useMemo, useState } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { JournalTable } from '../components/JournalTable'
import { SearchableSelect } from '../components/SearchableSelect'
import type { StoredTrade } from '../lib/trades'
import { SESSION_LABELS } from '../data/tradeForm'
import {
  ChartBarsIcon,
  DateRangeIcon,
  DownloadIcon,
  ScalesIcon,
  SmileIcon,
} from '../components/Icons'
import {
  CARD,
  CARD_HOVER,
  DATA_ERROR,
  FILTER_CARD,
  FILTER_FIGURE,
  FILTER_LABEL,
  FILTER_ROW,
  PAGE_ACTIONS,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_IDLE,
  PILL_ACCENT,
  POS,
  ROW_STAGGER,
  SUMMARY_CARD,
  SUMMARY_FOOT,
  SUMMARY_LABEL,
  SUMMARY_ROW,
  SUMMARY_VALUE,
  SUMMARY_WATERMARK,
} from '../components/ui'

const ANY_SETUP = 'All setups'
const ANY_SESSION = 'All sessions'
const ANY_RESULT = 'All results'

const RESULTS = [ANY_RESULT, 'Winner', 'Loser', 'Still open']

function resultOf(trade: StoredTrade): string {
  if (trade.netPl === null) return 'Still open'
  return trade.netPl >= 0 ? 'Winner' : 'Loser'
}

type Filters = { setup: string; session: string; result: string }

const NO_FILTERS: Filters = {
  setup: ANY_SETUP,
  session: ANY_SESSION,
  result: ANY_RESULT,
}

/**
 * One card per filter.
 *
 * The options come from the journal rather than from a list in the source.
 * They used to be three invented names — VWAP Bounce, Bull Flag, Overextended
 * — which belonged to no trade anyone had logged, so the filter offered
 * choices that could only ever return nothing.
 */
function FilterSelects({
  trades,
  filters,
  onChange,
}: {
  trades: StoredTrade[]
  filters: Filters
  onChange: (next: Filters) => void
}) {
  const setups = useMemo(() => {
    const named = trades.map((trade) => trade.setup.trim()).filter(Boolean)
    return [ANY_SETUP, ...[...new Set(named)].sort((a, b) => a.localeCompare(b))]
  }, [trades])

  const sessions = useMemo(() => {
    const used = trades.map((trade) => trade.session).filter(Boolean)
    const names = [...new Set(used)].map((key) => SESSION_LABELS[key] ?? key)
    return [ANY_SESSION, ...names.sort((a, b) => a.localeCompare(b))]
  }, [trades])

  const fields: { label: string; key: keyof Filters; options: string[] }[] = [
    { label: 'Setup', key: 'setup', options: setups },
    { label: 'Session', key: 'session', options: sessions },
    { label: 'Result', key: 'result', options: RESULTS },
  ]

  return (
    <>
      {fields.map((field) => (
        <div key={field.key} className={`${CARD} ${CARD_HOVER} ${FILTER_CARD}`}>
          <span className={FILTER_LABEL}>{field.label}</span>
          <SearchableSelect
            label={field.label}
            value={filters[field.key]}
            options={field.options}
            onChange={(value) => onChange({ ...filters, [field.key]: value })}
          />
        </div>
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
  // A signed-in session is the only precondition now: the API is the single
  // thing this page talks to, and it either answers or reports why.
  const live = uid !== null

  const [filters, setFilters] = useState<Filters>(NO_FILTERS)

  // The filters were decorative until now — the table was handed every trade
  // whatever they said.
  const shown = useMemo(
    () =>
      trades.filter(
        (trade) =>
          (filters.setup === ANY_SETUP || trade.setup.trim() === filters.setup) &&
          (filters.session === ANY_SESSION ||
            SESSION_LABELS[trade.session] === filters.session) &&
          (filters.result === ANY_RESULT || resultOf(trade) === filters.result),
      ),
    [trades, filters],
  )

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Trade Journal</h2>
          <p className={PAGE_SUB}>
            Detailed record of your market execution and psychological state.
          </p>
        </div>

        <div className={PAGE_ACTIONS}>
          <button type="button" className={`${PILL} ${PILL_IDLE}`}>
            <DateRangeIcon />
            Last 30 Days
          </button>
          <button type="button" className={`${PILL} ${PILL_ACCENT}`}>
            <DownloadIcon />
            Export CSV
          </button>
        </div>
      </div>

      <div data-tour="filters" className={`${FILTER_ROW} ${ROW_STAGGER}`}>
        <FilterSelects trades={trades} filters={filters} onChange={setFilters} />

        <div className={`${CARD} ${CARD_HOVER} ${FILTER_CARD} cursor-default gap-8`}>
          <span className={FILTER_LABEL}>Total Volume</span>
          <strong className={FILTER_FIGURE}>
            <AnimatedNumber value={1.24} format={(n) => `${n.toFixed(2)}M Shares`} />
          </strong>
        </div>
      </div>

      {error && (
        <p className={DATA_ERROR} role="alert">
          {error}
        </p>
      )}

      <div className={`${SUMMARY_ROW} ${ROW_STAGGER}`}>
        <article className={`${CARD} ${CARD_HOVER} ${SUMMARY_CARD}`}>
          <p className={SUMMARY_LABEL}>Win Rate</p>
          <p className={SUMMARY_VALUE}>
            <AnimatedNumber value={68.4} format={(n) => n.toFixed(1)} />{' '}
            <span className="text-[17px] font-normal text-fg-muted">%</span>
          </p>
          <p className={`${SUMMARY_FOOT} ${POS}`}>&uarr; +2.1% from last week</p>
          <ChartBarsIcon className={SUMMARY_WATERMARK} size={72} />
        </article>

        <article className={`${CARD} ${CARD_HOVER} ${SUMMARY_CARD}`}>
          <p className={SUMMARY_LABEL}>Profit Factor</p>
          <p className={SUMMARY_VALUE}>
            <AnimatedNumber value={2.42} format={(n) => n.toFixed(2)} />
          </p>
          <p className={SUMMARY_FOOT}>Target: 2.0+</p>
          <ScalesIcon className={SUMMARY_WATERMARK} size={72} />
        </article>

        <article className={`${CARD} ${CARD_HOVER} ${SUMMARY_CARD}`}>
          <p className={SUMMARY_LABEL}>Avg. Emotion Score</p>
          <p className={SUMMARY_VALUE}>Neutral</p>
          <p className={SUMMARY_FOOT}>
            Most common: <span className="[font-family:'Segoe_UI_Emoji','Apple_Color_Emoji',sans-serif]">&#128524;</span> Calmed
          </p>
          <SmileIcon className={SUMMARY_WATERMARK} size={72} />
        </article>
      </div>

      <JournalTable trades={shown} loading={loading} live={live} />
    </>
  )
}
