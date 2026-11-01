import { useMemo, useState } from 'react'
import { dayKey } from '../lib/stats'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'
import { CARD, CARD_HOVER, NEG, POS } from './ui'

/** Monday first, the same week the Calendar page uses, so a week's total here
 *  is the same figure as the one beside that week there. */
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

/** Monday-based weekday index: Monday is 0, Sunday is 6. */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

/** Small cells, so amounts are shortened: $1.2K rather than $1,234.56. */
function compact(value: number): string {
  const abs = Math.abs(value)
  const body =
    abs >= 1000
      ? `${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)}K`
      : abs >= 100
        ? abs.toFixed(0)
        : abs.toFixed(abs % 1 === 0 ? 0 : 2)
  return `${value < 0 ? '-' : ''}$${body}`
}

type Cell = { key: string; date: Date; inMonth: boolean; value: number | null }

/**
 * The month at a glance: each day's net P&L, and each week's total beside it.
 *
 * `dailyPl` comes from the closed trades the dashboard is showing, so a day
 * with only open trades is blank here, and the range picker above applies.
 */
export function PerformanceCalendar({ dailyPl }: { dailyPl: Map<string, number> }) {
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const weeks = useMemo(() => {
    const start = new Date(anchor)
    start.setDate(1 - weekdayIndex(anchor))
    const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    // Only as many rows as the month needs: five usually, four or six rarely.
    const count = Math.ceil((weekdayIndex(anchor) + last.getDate()) / 7)

    return Array.from({ length: count }, (_, week) =>
      Array.from({ length: 7 }, (_, day): Cell => {
        const date = new Date(start)
        date.setDate(start.getDate() + week * 7 + day)
        const key = dayKey(date)
        return { key, date, inMonth: date.getMonth() === anchor.getMonth(), value: dailyPl.get(key) ?? null }
      }),
    )
  }, [anchor, dailyPl])

  const monthTotal = weeks
    .flat()
    .filter((cell) => cell.inMonth)
    .reduce((sum, cell) => sum + (cell.value ?? 0), 0)
  const today = dayKey(new Date())

  const shift = (step: number) =>
    setAnchor((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))

  return (
    <article className={`${CARD} ${CARD_HOVER} flex flex-col px-16 pt-14 pb-14`}>
      <div className="flex items-center justify-between gap-8">
        <p className="text-[10.5px] font-medium tracking-[0.13em] text-fg-dim uppercase">Performance Calendar</p>
        <span className={`text-[12px] font-semibold tabular-nums ${monthTotal > 0 ? POS : monthTotal < 0 ? NEG : 'text-fg-muted'}`}>
          {compact(monthTotal)}
        </span>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          className="grid size-22 place-items-center rounded-sm text-fg-muted hover:bg-tint-2 hover:text-fg-strong"
          onClick={() => shift(-1)}
          aria-label="Previous month"
        >
          <ChevronLeftIcon size={13} />
        </button>
        <span className="text-[12px] font-medium text-fg-strong">{MONTH.format(anchor)}</span>
        <button
          type="button"
          className="grid size-22 place-items-center rounded-sm text-fg-muted hover:bg-tint-2 hover:text-fg-strong"
          onClick={() => shift(1)}
          aria-label="Next month"
        >
          <ChevronRightIcon size={13} />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(7,minmax(0,1fr))_minmax(0,1.15fr)] gap-3 text-center">
        {WEEKDAYS.map((day, index) => (
          <span key={index} className="py-2 text-[9px] font-semibold tracking-widest text-fg-muted">
            {day}
          </span>
        ))}
        <span className="py-2 text-[9px] font-semibold tracking-widest text-fg-muted">WEEK</span>

        {weeks.map((week) => {
          const total = week.reduce((sum, cell) => sum + (cell.value ?? 0), 0)
          const traded = week.some((cell) => cell.value !== null)

          return [
            ...week.map((cell) => (
              <div
                key={cell.key}
                title={cell.value === null ? cell.date.toDateString() : `${cell.date.toDateString()}: ${cell.value.toFixed(2)}`}
                className={`flex min-h-34 flex-col items-center justify-center rounded-[4px] border px-1 ${
                  cell.value === null
                    ? 'border-transparent bg-tint-1'
                    : cell.value >= 0
                      ? 'border-[color-mix(in_srgb,var(--color-green)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-green)_14%,transparent)]'
                      : 'border-[color-mix(in_srgb,var(--color-red)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-red)_14%,transparent)]'
                } ${cell.inMonth ? '' : 'opacity-35'}`}
              >
                <span
                  className={`text-[9px] leading-none ${
                    cell.key === today ? 'rounded-full bg-accent px-4 py-1 text-accent-ink' : 'text-fg-muted'
                  }`}
                >
                  {cell.date.getDate()}
                </span>
                {cell.value !== null && (
                  <span className={`mt-2 max-w-full truncate text-[9.5px] font-semibold tabular-nums leading-none ${cell.value >= 0 ? POS : NEG}`}>
                    {compact(cell.value)}
                  </span>
                )}
              </div>
            )),
            <div
              key={`${week[0].key}-week`}
              className="flex min-h-34 flex-col items-center justify-center rounded-[4px] bg-tint-2 px-1"
            >
              <span className="text-[8.5px] leading-none text-fg-muted">Total</span>
              <span
                className={`mt-2 max-w-full truncate text-[10px] font-semibold tabular-nums leading-none ${
                  !traded ? 'text-fg-muted' : total >= 0 ? POS : NEG
                }`}
              >
                {compact(total)}
              </span>
            </div>,
          ]
        })}
      </div>
    </article>
  )
}
