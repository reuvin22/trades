import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatedNumber } from '../components/AnimatedNumber'
import { JournalTable } from '../components/JournalTable'
import { QuickAddTrade } from '../components/QuickAddTrade'
import { TradeActions } from '../components/TradeActions'
import { deleteTrade, toEntry, updateTrade } from '../lib/trades'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { SearchableSelect } from '../components/SearchableSelect'
import { DateRangePicker, type DateRange } from '../components/DateRangePicker'
import { endOfDay, startOfDay } from '../lib/day'
import { downloadCsv, downloadPdf } from '../lib/exportJournal'
import { tradeDate } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import { SESSIONS, SESSION_LABELS } from '../data/tradeForm'
import type { Profile as ProfileRecord } from '../lib/profile'
import { moneyIn, summarise, volumeLabel } from '../lib/journalStats'
import {
  ChartBarsIcon,
  DateRangeIcon,
  DownloadIcon,
  ScalesIcon,
  SmileIcon,
} from '../components/Icons'
import {
  ACTION_MENU,
  ACTION_MENU_LEFT,
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

const RESULTS = [ANY_RESULT, 'Winner', 'Loser']

/**
 * Whether a trade falls inside the chosen window.
 *
 * Dated by entry, falling back to when it was written — the same rule the
 * statistics use, so the table and the figures never disagree about which day
 * a trade belongs to.
 */
function inWindow(trade: StoredTrade, span: { from: number; to: number }): boolean {
  const date = tradeDate(trade)
  if (date === null) return false
  const at = date.getTime()
  return at >= span.from && at <= span.to
}

/*
 * The same rule the table labels a row with, deliberately.
 *
 * An unpriced entry used to come back as "Still open", which was never one of
 * the options in RESULTS — so those rows matched no filter but "All results",
 * while the table beside them was already calling them winners. Two names for
 * one row is worse than treating a missing P&L as flat.
 */
function resultOf(trade: StoredTrade): string {
  return (trade.netPl ?? 0) >= 0 ? 'Winner' : 'Loser'
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
 * The options used to be three invented names — VWAP Bounce, Bull Flag,
 * Overextended — which belonged to no trade anyone had logged, so the filter
 * offered choices that could only ever return nothing. They now come from the
 * trader: their setups from Settings, and the three sessions.
 */
function FilterSelects({
  trades,
  setups: configured,
  filters,
  onChange,
}: {
  trades: StoredTrade[]
  /** The setups named in Settings. The list this filter is meant to reflect. */
  setups: string[]
  filters: Filters
  onChange: (next: Filters) => void
}) {
  const setups = useMemo(() => {
    // Settings first, in the order they chose. Then anything logged against a
    // setup no longer on that list — removing a setup should not make the
    // trades taken with it unfindable.
    const known = new Set(configured.map((name) => name.toLowerCase()))
    const orphaned = trades
      .map((trade) => trade.setup.trim())
      .filter((name) => name !== '' && !known.has(name.toLowerCase()))

    return [
      ANY_SETUP,
      ...configured,
      ...[...new Set(orphaned)].sort((a, b) => a.localeCompare(b)),
    ]
  }, [configured, trades])

  // All three, always. A session with no trades in it yet is still a question
  // worth asking — and the answer, "none", is information.
  const sessions = [ANY_SESSION, ...SESSIONS.map((entry) => entry.label)]

  const fields: { label: string; key: keyof Filters; options: string[] }[] = [
    { label: 'Setup', key: 'setup', options: setups },
    { label: 'Session', key: 'session', options: sessions },
    { label: 'Result', key: 'result', options: RESULTS },
  ]

  return (
    <>
      {fields.map((field) => (
        <SearchableSelect
          key={field.key}
          className={`${CARD} ${CARD_HOVER}`}
          heading={field.label}
          label={field.label}
          value={filters[field.key]}
          options={field.options}
          onChange={(value) => onChange({ ...filters, [field.key]: value })}
        />
      ))}
    </>
  )
}

/**
 * What a card shows when the journal cannot answer it.
 *
 * An em dash rather than a zero: nothing recorded and a genuine zero are
 * different facts, and only one of them is worth acting on.
 */
const EMPTY_FIGURE = '—'

/** The presets, and how far back each one reaches. */
const RANGE_DAYS = { '7D': 7, '30D': 30, '90D': 90 } as const
type Preset = keyof typeof RANGE_DAYS

const RANGE_LABEL: Record<Preset, string> = {
  '7D': 'Last 7 days',
  '30D': 'Last 30 days',
  '90D': 'Last 90 days',
}

const SPAN = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

/**
 * The range control: a preset, or a span off the calendar.
 *
 * A menu rather than the dashboard's segmented row, because this sits in a
 * page header beside another action and four side-by-side buttons would crowd
 * the title off a narrow screen. The calendar itself is the same component the
 * chart uses.
 */
function RangeMenu({
  range,
  custom,
  onPreset,
  onCustom,
}: {
  range: Preset
  custom: DateRange | null
  onPreset: (next: Preset) => void
  onCustom: (span: DateRange | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open && !picking) return

    function onPointerDown(event: PointerEvent) {
      if (wrapper.current?.contains(event.target as Node)) return
      setOpen(false)
      setPicking(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, picking])

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        className={`${PILL} ${PILL_IDLE}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current)
          setPicking(false)
        }}
      >
        <DateRangeIcon />
        {custom
          ? `${SPAN.format(custom.from)} – ${SPAN.format(custom.to)}`
          : RANGE_LABEL[range]}
      </button>

      {open && !picking && (
        <div className={`${ACTION_MENU} ${ACTION_MENU_LEFT}`} role="menu">
          {(Object.keys(RANGE_DAYS) as Preset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              role="menuitem"
              // A preset is only the current view when no custom span is set.
              aria-current={custom === null && range === preset ? 'true' : undefined}
              onClick={() => {
                onPreset(preset)
                setOpen(false)
              }}
            >
              {RANGE_LABEL[preset]}
            </button>
          ))}
          <button type="button" role="menuitem" onClick={() => setPicking(true)}>
            Custom range…
          </button>
        </div>
      )}

      {picking && (
        <DateRangePicker
          value={custom}
          onApply={(next) => {
            onCustom(next)
            setPicking(false)
            setOpen(false)
          }}
          onClear={() => {
            onCustom(null)
            setPicking(false)
            setOpen(false)
          }}
          onClose={() => {
            setPicking(false)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

/** Export, then which kind. */
function ExportMenu({ onCsv, onPdf }: { onCsv: () => void; onPdf: () => void }) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        className={`${PILL} ${PILL_ACCENT}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <DownloadIcon />
        Export
      </button>

      {open && (
        <div className={ACTION_MENU} role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onPdf()
            }}
          >
            PDF
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onCsv()
            }}
          >
            CSV
          </button>
        </div>
      )}
    </div>
  )
}

type TradeJournalProps = {
  uid: string | null
  trades: StoredTrade[]
  loading: boolean
  error: string | null
  reload: () => void
  /** For the setups this trader has named in Settings. */
  profile: ProfileRecord | null
}

export function TradeJournal({
  uid,
  profile,
  trades,
  loading,
  error,
  reload,
}: TradeJournalProps) {
  // A signed-in session is the only precondition now: the API is the single
  // thing this page talks to, and it either answers or reports why.
  const live = uid !== null

  const [filters, setFilters] = useState<Filters>(NO_FILTERS)

  // The preset is kept even while a custom span is showing, so clearing the
  // calendar returns to whatever was chosen before rather than a default.
  const [range, setRange] = useState<Preset>('30D')
  const [custom, setCustom] = useState<DateRange | null>(null)

  const rangeLabel = custom
    ? `${SPAN.format(custom.from)} – ${SPAN.format(custom.to)}`
    : RANGE_LABEL[range]

  /** The window, as a pair of instants. `to` is the end of that day. */
  const window = useMemo(() => {
    if (custom) {
      return {
        from: startOfDay(custom.from).getTime(),
        to: endOfDay(custom.to).getTime(),
      }
    }

    const from = startOfDay(new Date())
    // Inclusive of today, so "last 7 days" is a week of trading rather than
    // six days and this morning.
    from.setDate(from.getDate() - (RANGE_DAYS[range] - 1))
    return { from: from.getTime(), to: Infinity }
  }, [range, custom])

  // The entry a row opened, and the one being edited. Two pieces of state
  // rather than one mode flag: editing opens on top of the detail view, and
  // cancelling the edit should land back on it rather than on nothing.
  const [selected, setSelected] = useState<StoredTrade | null>(null)
  const [editing, setEditing] = useState<StoredTrade | null>(null)
  const toast = useToast()

  // The filters were decorative until now — the table was handed every trade
  // whatever they said.
  const shown = useMemo(
    () =>
      trades.filter(
        (trade) =>
          inWindow(trade, window) &&
          (filters.setup === ANY_SETUP || trade.setup.trim() === filters.setup) &&
          (filters.session === ANY_SESSION ||
            trade.sessions.some(
              (entry) => SESSION_LABELS[entry] === filters.session,
            )) &&
          (filters.result === ANY_RESULT || resultOf(trade) === filters.result),
      ),
    [trades, filters, window],
  )

  // Over the filtered rows, not the whole journal: these cards sit directly
  // under the filters, and a figure that ignored them would be answering a
  // question nobody asked.
  const summary = useMemo(() => summarise(shown), [shown])
  const money = useMemo(() => moneyIn(profile?.currency ?? "USD"), [profile?.currency])

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
          <RangeMenu
            range={range}
            custom={custom}
            onPreset={(next) => {
              setRange(next)
              setCustom(null)
            }}
            onCustom={setCustom}
          />

          <ExportMenu
            onCsv={() => downloadCsv(shown)}
            onPdf={async () => {
              try {
                await downloadPdf(shown, rangeLabel)
              } catch (cause) {
                toast.error('Could not build the PDF', readableApiError(cause))
              }
            }}
          />
        </div>
      </div>

      <div data-tour="filters" className={`${FILTER_ROW} ${ROW_STAGGER}`}>
        <FilterSelects
          trades={trades}
          setups={profile?.strategies ?? []}
          filters={filters}
          onChange={setFilters}
        />

        <div className={`${CARD} ${CARD_HOVER} ${FILTER_CARD} cursor-default gap-8`}>
          <span className={FILTER_LABEL}>Total Volume</span>
          <strong className={FILTER_FIGURE}>{volumeLabel(summary.volume)}</strong>
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
            {summary.winRate === null ? (
              EMPTY_FIGURE
            ) : (
              <>
                <AnimatedNumber value={summary.winRate} format={(n) => n.toFixed(1)} />{' '}
                <span className="text-[17px] font-normal text-fg-muted">%</span>
              </>
            )}
          </p>
          <p className={SUMMARY_FOOT}>
            {summary.winRate === null
              ? 'No closed trades in this range.'
              : `${summary.wins} won, ${summary.losses} lost`}
          </p>
          <ChartBarsIcon className={SUMMARY_WATERMARK} size={72} />
        </article>

        <article className={`${CARD} ${CARD_HOVER} ${SUMMARY_CARD}`}>
          <p className={SUMMARY_LABEL}>Profit Factor</p>
          <p className={SUMMARY_VALUE}>
            {summary.profitFactor !== null ? (
              <AnimatedNumber value={summary.profitFactor} format={(n) => n.toFixed(2)} />
            ) : summary.unbeaten ? (
              '∞'
            ) : (
              EMPTY_FIGURE
            )}
          </p>
          <p className={SUMMARY_FOOT}>
            {summary.profitFactor !== null
              ? `${money(summary.grossProfit)} won against ${money(summary.grossLoss)} lost`
              : summary.unbeaten
                ? 'No losing trades in this range.'
                : 'Nothing closed at a profit or a loss yet.'}
          </p>
          <ScalesIcon className={SUMMARY_WATERMARK} size={72} />
        </article>

        <article className={`${CARD} ${CARD_HOVER} ${SUMMARY_CARD}`}>
          <p className={SUMMARY_LABEL}>Most Common Emotion</p>
          <p className={SUMMARY_VALUE}>{summary.topEmotion ?? EMPTY_FIGURE}</p>
          <p className={SUMMARY_FOOT}>
            {summary.topEmotion === null
              ? 'No emotions recorded in this range.'
              : `${summary.emotionCount} of ${summary.emotionTotal} entries`}
          </p>
          <SmileIcon className={SUMMARY_WATERMARK} size={72} />
        </article>
      </div>

      <JournalTable
        trades={shown}
        loading={loading}
        live={live}
        onSelect={setSelected}
      />

      <TradeActions
        trade={selected}
        onClose={() => setSelected(null)}
        onEdit={(trade) => {
          setSelected(null)
          setEditing(trade)
        }}
        onDelete={async (trade) => {
          try {
            await deleteTrade(trade.id)
            setSelected(null)
            reload()
            toast.success('Trade deleted', `${trade.ticker || 'The entry'} is gone from your journal.`)
          } catch (cause) {
            const message = readableApiError(cause)
            toast.error('Could not delete the trade', message)
          }
        }}
      />

      <QuickAddTrade
        open={editing !== null}
        initial={editing ? toEntry(editing) : null}
        setups={profile?.strategies ?? []}
        onClose={() => setEditing(null)}
        onSave={async (entry) => {
          if (!editing) return
          await updateTrade(editing.id, entry)
          setEditing(null)
          reload()
        }}
      />
    </>
  )
}
