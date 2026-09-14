import type { WidgetSpec } from './widgets'

/**
 * Every widget the app has, and which page it belongs to.
 *
 * One list rather than each page owning its own, because the Templates screen
 * has to show them all — and because a widget that exists in a page's code but
 * not here would be invisible there, which is exactly the sort of drift a
 * second source of truth produces.
 *
 * A page registers here and reads its own entry; nothing else needs to know
 * the shape of anybody else's.
 */

export type PageKey = 'dashboard' | 'analytics' | 'journal'

export type PageWidgets = {
  key: PageKey
  /** As it appears in the navigation. */
  title: string
  /** Where the page lives, so Templates can link to it. */
  route: string
  widgets: WidgetSpec[]
}

/**
 * The dashboard's widgets, at the size they start.
 *
 * Twelve columns, so 8/4 is the two-thirds split the page used to hard-code
 * and 6/6 is a half. The minimums are the point where each stops being worth
 * looking at: a table needs width for its columns, a single figure does not.
 */
export const DASHBOARD_WIDGETS: WidgetSpec[] = [
  // One widget, not five. The row is the unit a trader reads, and five boxes
  // to place separately is five decisions where nobody wanted one. It wraps to
  // fewer columns as it is made narrower.
  { id: 'stats', title: 'Key figures', size: { w: 12, h: 5 }, min: { w: 3, h: 4 } },
  { id: 'equity', title: 'Equity curve', size: { w: 8, h: 17 }, min: { w: 4, h: 10 } },
  { id: 'edge', title: "What's working", size: { w: 4, h: 6 }, min: { w: 3, h: 4 } },
  { id: 'behaviour', title: "How you're trading", size: { w: 4, h: 11 }, min: { w: 3, h: 5 } },
  { id: 'setups', title: 'Setup performance', size: { w: 7, h: 11 }, min: { w: 5, h: 6 } },
  { id: 'risk', title: 'Risk health', size: { w: 5, h: 6 }, min: { w: 3, h: 5 } },
  { id: 'discipline', title: 'Discipline score', size: { w: 5, h: 8 }, min: { w: 3, h: 6 } },
  { id: 'calendar', title: 'Performance calendar', size: { w: 4, h: 8 }, min: { w: 3, h: 6 } },
  { id: 'recent', title: 'Recent activity', size: { w: 12, h: 14 }, min: { w: 5, h: 8 } },
]

/**
 * The catalogue, page by page.
 *
 * Only the dashboard is a widget grid so far. The others are listed as they
 * are converted; adding a page here and passing its widgets to `WidgetGrid` is
 * the whole of the work.
 */
export const CATALOGUE: PageWidgets[] = [
  {
    key: 'dashboard',
    title: 'Dashboard',
    route: '#/dashboard',
    widgets: DASHBOARD_WIDGETS,
  },
]

/** What each widget is for, in a sentence, for the Templates screen. */
export const WIDGET_ABOUT: Record<string, string> = {
  stats: 'Net P&L, win rate, profit factor, expectancy and max drawdown.',
  equity: 'Your account over time, from the capital you set in Settings.',
  edge: 'The setup that is working best, over the window you chose.',
  behaviour: 'What the coach found in how you trade, not what you made.',
  setups: 'Every setup ranked by what it earned, with win rate and R.',
  risk: 'What you risk per trade against the limit you set yourself.',
  discipline: 'How often you followed your own plan, graded apart from P&L.',
  calendar: 'Sixteen weeks of daily results, as a heat map.',
  recent: 'The last few trades, with a way into the full journal.',
}
