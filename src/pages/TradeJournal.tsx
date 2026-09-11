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

function FilterSelects() {
  const [values, setValues] = useState(
    () => JOURNAL_FILTERS.map((filter) => filter.options[0]),
  )

  return (
    <>
      {JOURNAL_FILTERS.map((filter, index) => (
        <label key={filter.label} className={`${CARD} ${CARD_HOVER} ${FILTER_CARD}`}>
          <span className={FILTER_LABEL}>{filter.label}</span>
          <span className="relative flex items-center [&>select]:w-full [&>select]:appearance-none [&>select]:cursor-pointer [&>select]:border-none [&>select]:bg-transparent [&>select]:pr-26 [&>select]:text-[14.5px] [&>select]:text-fg [&>select]:outline-none [&_option]:bg-panel-solid [&_option]:text-fg [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-out [&:focus-within_svg]:rotate-180">
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
            <ChevronDownIcon className="pointer-events-none absolute right-0 text-fg-muted" />
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
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Trade Journal</h2>
          <p className={PAGE_SUB}>
            Detailed record of your market execution and psychological state.
          </p>
        </div>

        <div className={PAGE_ACTIONS}>
          <button type="button" className={PILL}>
            <DateRangeIcon />
            Last 30 Days
          </button>
          <button type="button" className={`${PILL} ${PILL_ACCENT}`}>
            <DownloadIcon />
            Export CSV
          </button>
        </div>
      </div>

      <div className={`${FILTER_ROW} ${ROW_STAGGER}`}>
        <FilterSelects />

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

      <JournalTable trades={trades} loading={loading} live={live} />

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
    </>
  )
}
