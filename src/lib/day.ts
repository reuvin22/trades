/**
 * Dates reduced to days.
 *
 * Lives here rather than in DateRangePicker because two unrelated things need
 * it — the calendar, and the journal's range filter — and a component file
 * that also exports helpers breaks fast refresh for everything importing it.
 */

/** Midnight local. Every comparison built on this is by day, never by instant. */
export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** The last millisecond of the day, for the closing end of an inclusive span. */
export function endOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}
