import { useMemo, useState } from 'react'
import { DayDetail, type DaySelection } from '../components/DayDetail'
import { dayKey, tradeDate } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../components/Icons'
import {
  CAL_CLEAR,
  CAL_COUNT,
  CAL_DATE,
  CAL_DAY,
  CAL_DAY_BUTTON,
  CAL_DAY_NEG,
  CAL_DAY_OUTSIDE,
  CAL_DAY_POS,
  CAL_DAY_TODAY,
  CAL_FILTER,
  CAL_FILTERS,
  CAL_FILTER_ACTIVE,
  CAL_GRID,
  CAL_HEAD,
  CAL_MONTH,
  CAL_MONTH_COUNT,
  CAL_MONTH_TOTAL,
  CAL_NAV,
  CAL_PL,
  CAL_ROW,
  CAL_TODAY,
  CAL_TOOLBAR,
  CAL_WEEK,
  CAL_WEEKDAY,
  CAL_WEEKDAYS,
  CAL_WEEK_PL,
  CARD,
  NEG,
  POS,
} from '../components/ui'

type CalendarProps = {
  trades: StoredTrade[]
}

/*
 * The week runs Monday to Sunday.
 *
 * Crypto does not close for the weekend, so Sunday is a trading day like any
 * other — and putting it last means a Sunday fill counts towards the week it
 * actually finished, with the weekly total sitting directly beside it.
 */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKS_SHOWN = 6

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

/** Compact money: the cells are small, so drop the decimals above $1,000. */
function money(value: number): string {
  const abs = Math.abs(value)
  const body =
    abs >= 1000
      ? abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : abs.toFixed(2)
  return `${value < 0 ? '-' : ''}$${body}`
}

type Filters = {
  side: string
  mistake: string
  status: string
  setup: string
  emotion: string
}

const EMPTY_FILTERS: Filters = {
  side: 'all',
  mistake: 'all',
  status: 'all',
  setup: 'all',
  emotion: 'all',
}

type DayCell = {
  date: Date
  key: string
  inMonth: boolean
  netPl: number
  count: number
  trades: StoredTrade[]
}

/** Monday-based weekday index: Monday is 0, Sunday is 6. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  const active = value !== 'all'

  return (
    <label className={`${CAL_FILTER} ${active ? CAL_FILTER_ACTIVE : ''}`}>
      <span className="pointer-events-none">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={13} />
    </label>
  )
}

export function Calendar({ trades }: CalendarProps) {
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<DaySelection | null>(null)

  // Option lists come from what is actually in the journal, so the dropdowns
  // never offer a value that would return nothing.
  const options = useMemo(() => {
    const setups = new Set<string>()
    const mistakes = new Set<string>()
    const emotions = new Set<string>()

    for (const trade of trades) {
      if (trade.setup?.trim()) setups.add(trade.setup.trim())
      for (const tag of trade.mistakes ?? []) mistakes.add(tag)
      if (trade.emotionDuring?.trim()) emotions.add(trade.emotionDuring.trim())
    }

    const asOptions = (values: Set<string>, allLabel: string) => [
      { value: 'all', label: allLabel },
      ...[...values].sort().map((value) => ({ value, label: value })),
    ]

    return {
      side: [
        { value: 'all', label: 'All Sides' },
        { value: 'Long', label: 'Long' },
        { value: 'Short', label: 'Short' },
      ],
      status: [
        { value: 'all', label: 'All Statuses' },
        { value: 'closed', label: 'Closed' },
        { value: 'open', label: 'Open' },
      ],
      mistake: asOptions(mistakes, 'All Mistakes'),
      setup: asOptions(setups, 'All Setups'),
      emotion: asOptions(emotions, 'All Emotions'),
    }
  }, [trades])

  const filtered = useMemo(
    () =>
      trades.filter((trade) => {
        if (filters.side !== 'all' && trade.direction !== filters.side) return false
        if (filters.setup !== 'all' && trade.setup?.trim() !== filters.setup) return false
        if (filters.emotion !== 'all' && trade.emotionDuring?.trim() !== filters.emotion) {
          return false
        }
        if (filters.mistake !== 'all' && !(trade.mistakes ?? []).includes(filters.mistake)) {
          return false
        }
        if (filters.status === 'closed' && trade.exitPrice === null) return false
        if (filters.status === 'open' && trade.exitPrice !== null) return false
        return true
      }),
    [trades, filters],
  )

  /** Daily totals and the trades behind them, keyed by YYYY-MM-DD. */
  const byDay = useMemo(() => {
    const totals = new Map<string, { netPl: number; count: number; trades: StoredTrade[] }>()

    for (const trade of filtered) {
      const when = tradeDate(trade)
      if (!when) continue

      const key = dayKey(when)
      const entry = totals.get(key) ?? { netPl: 0, count: 0, trades: [] }
      entry.netPl += trade.netPl ?? 0
      entry.count += 1
      entry.trades.push(trade)
      totals.set(key, entry)
    }

    // Earliest fill first, so the day reads in the order it was traded.
    for (const entry of totals.values()) {
      entry.trades.sort(
        (a, b) => (tradeDate(a)?.getTime() ?? 0) - (tradeDate(b)?.getTime() ?? 0),
      )
    }

    return totals
  }, [filtered])

  const weeks = useMemo(() => {
    // The grid always opens on the Monday on or before the 1st.
    const start = new Date(anchor)
    start.setDate(1 - weekdayIndex(anchor))

    const rows: DayCell[][] = []
    for (let week = 0; week < WEEKS_SHOWN; week++) {
      const row: DayCell[] = []
      for (let day = 0; day < 7; day++) {
        const date = new Date(start)
        date.setDate(start.getDate() + week * 7 + day)

        const key = dayKey(date)
        const totals = byDay.get(key)

        row.push({
          date,
          key,
          inMonth: date.getMonth() === anchor.getMonth(),
          netPl: totals?.netPl ?? 0,
          count: totals?.count ?? 0,
          trades: totals?.trades ?? [],
        })
      }
      rows.push(row)
    }

    return rows
  }, [anchor, byDay])

  const monthTotal = useMemo(
    () =>
      weeks
        .flat()
        .filter((cell) => cell.inMonth)
        .reduce(
          (sum, cell) => ({ netPl: sum.netPl + cell.netPl, count: sum.count + cell.count }),
          { netPl: 0, count: 0 },
        ),
    [weeks],
  )

  function shiftMonth(step: number) {
    setAnchor((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))
  }

  function goToThisMonth() {
    const now = new Date()
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const todayKey = dayKey(new Date())

  return (
    <>
      <div className={CAL_TOOLBAR}>
        <div className={CAL_FILTERS}>
          <Dropdown
            label="Side"
            value={filters.side}
            options={options.side}
            onChange={(side) => setFilters((f) => ({ ...f, side }))}
          />
          <Dropdown
            label="Mistake"
            value={filters.mistake}
            options={options.mistake}
            onChange={(mistake) => setFilters((f) => ({ ...f, mistake }))}
          />
          <Dropdown
            label="Status"
            value={filters.status}
            options={options.status}
            onChange={(status) => setFilters((f) => ({ ...f, status }))}
          />
          <Dropdown
            label="Setup"
            value={filters.setup}
            options={options.setup}
            onChange={(setup) => setFilters((f) => ({ ...f, setup }))}
          />
          <Dropdown
            label="Emotion"
            value={filters.emotion}
            options={options.emotion}
            onChange={(emotion) => setFilters((f) => ({ ...f, emotion }))}
          />

          {Object.values(filters).some((value) => value !== 'all') && (
            <button
              type="button"
              className={CAL_CLEAR}
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={CAL_HEAD}>
        <button type="button" className={CAL_TODAY} onClick={goToThisMonth}>
          Today
        </button>

        <div className={CAL_NAV}>
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeftIcon size={16} />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRightIcon size={16} />
          </button>
        </div>

        <h2 className={CAL_MONTH}>{monthLabel.format(anchor)}</h2>

        <span className={`${CAL_MONTH_TOTAL} ${monthTotal.netPl >= 0 ? POS : NEG}`}>
          {money(monthTotal.netPl)}
        </span>
        <span className={CAL_MONTH_COUNT}>
          {monthTotal.count} {monthTotal.count === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      <div className={`${CARD} ${CAL_GRID}`}>
        <div className={`${CAL_ROW} ${CAL_WEEKDAYS}`}>
          {WEEKDAYS.map((day) => (
            <span key={day} className={CAL_WEEKDAY}>
              {day}
            </span>
          ))}
          <span className={CAL_WEEKDAY} />
        </div>

        {weeks.map((week, index) => {
          const total = week.reduce(
            (sum, cell) => ({
              netPl: sum.netPl + cell.netPl,
              count: sum.count + cell.count,
            }),
            { netPl: 0, count: 0 },
          )

          return (
            <div className={CAL_ROW} key={index}>
              {week.map((cell) => {
                const tone =
                  cell.count === 0 ? 'flat' : cell.netPl >= 0 ? 'pos' : 'neg'

                return (
                  <button
                    type="button"
                    key={cell.key}
                    aria-label={`${cell.date.toDateString()} — ${
                      cell.count === 0
                        ? 'no trades'
                        : `${cell.count} ${cell.count === 1 ? 'trade' : 'trades'}, ${money(cell.netPl)}`
                    }`}
                    onClick={() =>
                      setSelected({ date: cell.date, trades: cell.trades })
                    }
                    className={`${CAL_DAY} ${CAL_DAY_BUTTON} ${
                      tone === 'pos' ? CAL_DAY_POS : tone === 'neg' ? CAL_DAY_NEG : ''
                    } ${cell.inMonth ? '' : CAL_DAY_OUTSIDE} ${
                      cell.key === todayKey ? CAL_DAY_TODAY : ''
                    }`}
                  >
                    <span data-date className={CAL_DATE}>{cell.date.getDate()}</span>

                    {cell.count > 0 && (
                      <>
                        <span data-pl className={CAL_PL}>{money(cell.netPl)}</span>
                        <span className={CAL_COUNT}>
                          {cell.count} {cell.count === 1 ? 'Trade' : 'Trades'}
                        </span>
                      </>
                    )}
                  </button>
                )
              })}

              <div className={CAL_WEEK}>
                <span className={`${CAL_WEEK_PL} ${total.netPl >= 0 ? POS : NEG}`}>
                  {total.count === 0 ? '$0' : money(total.netPl)}
                </span>
                <span className={CAL_COUNT}>
                  {total.count} {total.count === 1 ? 'Trade' : 'Trades'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <DayDetail day={selected} onClose={() => setSelected(null)} />
    </>
  )
}
