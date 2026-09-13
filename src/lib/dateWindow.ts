import { startOfDay, endOfDay } from './day'
import { tradeDate } from './stats'
import type { DateRange } from '../components/DateRangePicker'
import type { StoredTrade } from './trades'

/**
 * The one definition of "which trades count right now".
 *
 * Shared between the journal and the dashboard because they have to agree.
 * Two pages each deciding what "last 30 days" means is two pages that
 * eventually disagree by a day, and the trader finds it by noticing a total
 * that does not match a total.
 */

export type Preset = '7D' | '30D' | '90D' | 'ALL'

/** How far back each preset reaches. ALL has no span, so it is absent here. */
export const RANGE_DAYS: Record<Exclude<Preset, 'ALL'>, number> = {
  '7D': 7,
  '30D': 30,
  '90D': 90,
}

export const RANGE_LABEL: Record<Preset, string> = {
  '7D': 'Last 7 days',
  '30D': 'Last 30 days',
  '90D': 'Last 90 days',
  ALL: 'All time',
}

const SPAN = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

export type Window = { from: number; to: number }

/** Everything, including trades with no usable date on them. */
export const EVERYTHING: Window = { from: -Infinity, to: Infinity }

/**
 * The window as a pair of instants.
 *
 * A custom span wins over the preset, which is kept underneath it so clearing
 * the calendar returns to whatever was chosen before rather than a default.
 */
export function windowFor(range: Preset, custom: DateRange | null): Window {
  if (custom) {
    return {
      from: startOfDay(custom.from).getTime(),
      to: endOfDay(custom.to).getTime(),
    }
  }

  if (range === 'ALL') return EVERYTHING

  const from = startOfDay(new Date())
  // Inclusive of today, so "last 7 days" is a week of trading rather than six
  // days and this morning.
  from.setDate(from.getDate() - (RANGE_DAYS[range] - 1))
  return { from: from.getTime(), to: Infinity }
}

/** Whether a window actually excludes anything. */
export function isEverything(span: Window): boolean {
  return span.from === -Infinity && span.to === Infinity
}

/**
 * Whether a trade falls inside the window.
 *
 * Dated by entry, falling back to when it was written — the same rule the
 * statistics use, so a table and the figures above it never disagree about
 * which day a trade belongs to.
 *
 * An undated trade is **kept** when nothing is being filtered and dropped when
 * something is. It cannot be shown to be inside a span, but excluding it from
 * an unfiltered view would quietly lose it from totals it belongs in.
 */
export function inWindow(trade: StoredTrade, span: Window): boolean {
  if (isEverything(span)) return true

  const date = tradeDate(trade)
  if (date === null) return false

  const at = date.getTime()
  return at >= span.from && at <= span.to
}

/** Filters, and skips the work entirely when there is nothing to filter. */
export function within(trades: StoredTrade[], span: Window): StoredTrade[] {
  return isEverything(span) ? trades : trades.filter((trade) => inWindow(trade, span))
}

export function rangeLabel(range: Preset, custom: DateRange | null): string {
  return custom
    ? `${SPAN.format(custom.from)} – ${SPAN.format(custom.to)}`
    : RANGE_LABEL[range]
}
