import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { startOfDay } from '../lib/day'
import {
  RANGE_BAND,
  RANGE_BAND_END,
  RANGE_BAND_START,
  RANGE_CELL,
  RANGE_CLEAR,
  RANGE_DAY,
  RANGE_DAY_EDGE,
  RANGE_DAY_OUTSIDE,
  RANGE_DAY_TODAY,
  RANGE_FOOT,
  RANGE_GRID,
  RANGE_HEAD,
  RANGE_MONTH,
  RANGE_NAV,
  RANGE_POP,
  RANGE_WEEKDAYS,
} from './ui'

/** Monday-based, matching the Calendar page. */
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKS_SHOWN = 6

const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const dayLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export type DateRange = { from: Date; to: Date }

function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type PickerProps = {
  value: DateRange | null
  onApply: (range: DateRange) => void
  onClear: () => void
  onClose: () => void
}

/**
 * A two-click range calendar.
 *
 * The first click starts a range and the second closes it. That is one fewer
 * control than a pair of date fields, and it makes the span itself the thing
 * being chosen rather than two numbers that happen to bracket it. Between the
 * two clicks the days under the cursor preview what the range would be, so its
 * shape is visible before it is committed.
 *
 * Future days are refused: there is no equity to plot past today, and a range
 * reaching into next week would quietly render as a flat line.
 */
export function DateRangePicker({ value, onApply, onClear, onClose }: PickerProps) {
  const today = useMemo(() => startOfDay(new Date()), [])

  const [anchor, setAnchor] = useState(() => {
    const base = value?.from ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  // The half-made selection. Null until the first click of a new range.
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) onClose()
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const days = useMemo(() => {
    // The grid always opens on the Monday on or before the 1st.
    const start = new Date(anchor)
    start.setDate(1 - weekdayIndex(anchor))

    const cells: Date[] = []
    for (let i = 0; i < WEEKS_SHOWN * 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      cells.push(date)
    }
    return cells
  }, [anchor])

  /*
   * What the grid should paint right now: the committed range, or the one the
   * cursor is currently describing. Derived rather than stored, so moving the
   * pointer away cannot leave a stale band behind.
   */
  const shown = useMemo(() => {
    if (pendingFrom) {
      const other = hover ?? pendingFrom
      return other < pendingFrom
        ? { from: other, to: pendingFrom }
        : { from: pendingFrom, to: other }
    }
    return value
  }, [pendingFrom, hover, value])

  function pick(date: Date) {
    if (!pendingFrom) {
      setPendingFrom(date)
      setHover(date)
      return
    }
    // The second click closes the range, in whichever order it was drawn.
    const range =
      date < pendingFrom
        ? { from: date, to: pendingFrom }
        : { from: pendingFrom, to: date }
    setPendingFrom(null)
    setHover(null)
    onApply(range)
  }

  const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)
  const atCurrentMonth = nextMonth > today

  return (
    <div className={RANGE_POP} ref={box} role="dialog" aria-label="Choose a date range">
      <div className={RANGE_HEAD}>
        <button
          type="button"
          className={RANGE_NAV}
          aria-label="Previous month"
          onClick={() =>
            setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))
          }
        >
          <ChevronLeftIcon size={15} />
        </button>

        <span className={RANGE_MONTH}>{monthName.format(anchor)}</span>

        <button
          type="button"
          className={RANGE_NAV}
          aria-label="Next month"
          disabled={atCurrentMonth}
          onClick={() => setAnchor(nextMonth)}
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>

      <div className={RANGE_WEEKDAYS} aria-hidden="true">
        {WEEKDAYS.map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>

      <div className={RANGE_GRID} onPointerLeave={() => pendingFrom && setHover(null)}>
        {days.map((date) => {
          const outside = date.getMonth() !== anchor.getMonth()
          const future = date > today

          const isFrom = shown ? sameDay(date, shown.from) : false
          const isTo = shown ? sameDay(date, shown.to) : false
          const inside = shown ? date > shown.from && date < shown.to : false
          const edge = isFrom || isTo

          // A single-day range needs no band; it is just the one circle.
          const banded =
            shown !== null && !sameDay(shown.from, shown.to) && (inside || edge)

          const band = banded
            ? `${RANGE_BAND} ${isFrom ? RANGE_BAND_START : ''} ${isTo ? RANGE_BAND_END : ''}`
            : ''

          return (
            <div key={date.getTime()} className={`${RANGE_CELL} ${band}`}>
              <button
                type="button"
                disabled={future}
                aria-pressed={edge}
                aria-label={dayLabel.format(date)}
                className={`${RANGE_DAY} ${outside ? RANGE_DAY_OUTSIDE : ''} ${
                  sameDay(date, today) && !edge ? RANGE_DAY_TODAY : ''
                } ${edge ? RANGE_DAY_EDGE : ''}`}
                onPointerEnter={() => pendingFrom && setHover(date)}
                onClick={() => pick(date)}
              >
                {date.getDate()}
              </button>
            </div>
          )
        })}
      </div>

      <div className={RANGE_FOOT}>
        <span>
          {pendingFrom
            ? 'Pick the end date'
            : value
              ? `${dayLabel.format(value.from)} — ${dayLabel.format(value.to)}`
              : 'Pick a start date'}
        </span>

        <button
          type="button"
          className={RANGE_CLEAR}
          disabled={value === null && pendingFrom === null}
          onClick={() => {
            setPendingFrom(null)
            setHover(null)
            onClear()
          }}
        >
          Clear
        </button>
      </div>
    </div>
  )
}
