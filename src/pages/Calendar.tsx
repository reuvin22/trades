import { useMemo, useState } from 'react'
import { dayKey, tradeDate } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '../components/Icons'
import '../styles/calendar.css'

type CalendarProps = {
  trades: StoredTrade[]
  onQuickAdd: () => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
    <label className={`cal-filter${active ? ' is-active' : ''}`}>
      <span className="cal-filter-label">{label}</span>
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

export function Calendar({ trades, onQuickAdd }: CalendarProps) {
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

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

  /** Daily totals, keyed by YYYY-MM-DD. */
  const byDay = useMemo(() => {
    const totals = new Map<string, { netPl: number; count: number }>()

    for (const trade of filtered) {
      const when = tradeDate(trade)
      if (!when) continue

      const key = dayKey(when)
      const entry = totals.get(key) ?? { netPl: 0, count: 0 }
      entry.netPl += trade.netPl ?? 0
      entry.count += 1
      totals.set(key, entry)
    }

    return totals
  }, [filtered])

  const weeks = useMemo(() => {
    // The grid always opens on the Sunday on or before the 1st.
    const start = new Date(anchor)
    start.setDate(1 - anchor.getDay())

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
      <div className="cal-toolbar">
        <div className="cal-filters">
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
              className="cal-clear"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Clear
            </button>
          )}
        </div>

        <button type="button" className="cal-add" onClick={onQuickAdd}>
          <PlusIcon size={15} />
          Add Trade
        </button>
      </div>

      <div className="cal-head">
        <button type="button" className="cal-today" onClick={goToThisMonth}>
          Today
        </button>

        <div className="cal-nav">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeftIcon size={16} />
          </button>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRightIcon size={16} />
          </button>
        </div>

        <h2 className="cal-month">{monthLabel.format(anchor)}</h2>

        <span className={`cal-month-total ${monthTotal.netPl >= 0 ? 'pos' : 'neg'}`}>
          {money(monthTotal.netPl)}
        </span>
        <span className="cal-month-count">
          {monthTotal.count} {monthTotal.count === 1 ? 'trade' : 'trades'}
        </span>
      </div>

      <div className="cal-grid card">
        <div className="cal-row cal-weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day} className="cal-weekday">
              {day}
            </span>
          ))}
          <span className="cal-weekday" />
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
            <div className="cal-row" key={index}>
              {week.map((cell) => {
                const tone =
                  cell.count === 0 ? 'flat' : cell.netPl >= 0 ? 'pos' : 'neg'

                return (
                  <div
                    key={cell.key}
                    className={`cal-day is-${tone}${cell.inMonth ? '' : ' is-outside'}${
                      cell.key === todayKey ? ' is-today' : ''
                    }`}
                  >
                    <span className="cal-date">{cell.date.getDate()}</span>

                    {cell.count > 0 && (
                      <>
                        <span className="cal-pl">{money(cell.netPl)}</span>
                        <span className="cal-count">
                          {cell.count} {cell.count === 1 ? 'Trade' : 'Trades'}
                        </span>
                      </>
                    )}
                  </div>
                )
              })}

              <div className="cal-week">
                <span className={`cal-week-pl ${total.netPl >= 0 ? 'pos' : 'neg'}`}>
                  {total.count === 0 ? '$0' : money(total.netPl)}
                </span>
                <span className="cal-count">
                  {total.count} {total.count === 1 ? 'Trade' : 'Trades'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
