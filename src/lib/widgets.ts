/**
 * Where each widget sits, and how big it is.
 *
 * A layout the trader owns rather than one the page dictates: drag an edge to
 * resize, a corner to resize both ways, the grip to move one somewhere else.
 *
 * The model is deliberately a **flow**, not a free grid of x/y coordinates.
 * Widgets keep an order and a size in grid units; CSS places them in sequence.
 * That choice is what makes this tractable without a library — a free grid
 * needs collision resolution, push-down and compaction, which is where every
 * hand-rolled dashboard eventually breaks. A flow cannot overlap, cannot leave
 * a hole nothing can reach, and cannot get into a state a reload has to
 * rescue.
 *
 * The cost is that a widget cannot be pinned to an arbitrary square. In
 * exchange, every arrangement is valid by construction.
 */

/** Columns in the grid. Twelve divides by 2, 3, 4 and 6. */
export const COLUMNS = 12

/** One row unit, in pixels. Small enough for fine height control. */
export const ROW_HEIGHT = 28

/** The gap between widgets, in pixels. Matches the gap-18 used elsewhere. */
export const GAP = 18

export type Size = {
  /** Columns wide, 1..COLUMNS. */
  w: number
  /** Rows tall, in ROW_HEIGHT units. */
  h: number
}

export type Layout = {
  /** Widget ids, in the order they are laid out. */
  order: string[]
  /** Size per widget id. A widget with no entry uses its default. */
  sizes: Record<string, Size>
}

/** What a widget asks for before the trader has said otherwise. */
export type WidgetSpec = {
  id: string
  title: string
  /** Starting size, and the one "reset" returns to. */
  size: Size
  /** Below this it stops being readable. */
  min?: Size
}

export function clampSize(size: Size, min: Size | undefined): Size {
  const floor = { w: min?.w ?? 2, h: min?.h ?? 3 }

  return {
    w: Math.max(floor.w, Math.min(COLUMNS, Math.round(size.w))),
    // No ceiling on height: a table of forty setups is allowed to be tall.
    h: Math.max(floor.h, Math.round(size.h)),
  }
}

/**
 * Pixels dragged, as a number of grid columns.
 *
 * The track width is passed in rather than measured here because the caller
 * has the element; this stays pure so it can be tested without a DOM.
 */
export function columnsFor(deltaPx: number, trackPx: number): number {
  // Guarded on the track, not the step: with a zero-width track the step is
  // still positive because of the gap, so it would happily divide and return
  // a column count for an element that has not been laid out yet.
  if (trackPx <= 0) return 0

  return Math.round(deltaPx / ((trackPx + GAP) / COLUMNS))
}

export function rowsFor(deltaPx: number): number {
  return Math.round(deltaPx / (ROW_HEIGHT + GAP))
}

/** Which edges a handle drags. Corners set both. */
export type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export const EDGES: Edge[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

/**
 * The size a drag produces.
 *
 * Dragging a north or west edge is the interesting case: in a flow the widget
 * cannot move up or left, so pulling those edges grows it the other way — the
 * gesture still means "make this bigger", which is what a person doing it
 * expects to happen.
 */
export function resize(
  from: Size,
  edge: Edge,
  columns: number,
  rows: number,
  min: Size | undefined,
): Size {
  const horizontal = edge.includes('e') ? columns : edge.includes('w') ? -columns : 0
  const vertical = edge.includes('s') ? rows : edge.includes('n') ? -rows : 0

  return clampSize({ w: from.w + horizontal, h: from.h + vertical }, min)
}

/** Move one widget to another position in the order. */
export function reorder(order: string[], id: string, toIndex: number): string[] {
  const from = order.indexOf(id)
  if (from < 0) return order

  const next = [...order]
  next.splice(from, 1)
  // Clamped so a drop past either end lands at the end rather than nowhere.
  next.splice(Math.max(0, Math.min(next.length, toIndex)), 0, id)

  return next
}

/**
 * The stored layout, reconciled with the widgets that actually exist.
 *
 * Both halves matter over time. A widget removed from the app leaves an id in
 * everyone's saved layout, and a widget added to the app is in nobody's — so
 * unknown ids are dropped and new ones appended. Without this, shipping a new
 * card would make it invisible to every existing user, which is the kind of
 * bug that takes a week to notice.
 */
export function reconcile(stored: Layout | null, specs: WidgetSpec[]): Layout {
  const known = new Set(specs.map((spec) => spec.id))

  const kept = (stored?.order ?? []).filter((id) => known.has(id))
  const missing = specs.map((spec) => spec.id).filter((id) => !kept.includes(id))

  const sizes: Record<string, Size> = {}
  for (const spec of specs) {
    const saved = stored?.sizes?.[spec.id]
    sizes[spec.id] = saved ? clampSize(saved, spec.min) : spec.size
  }

  return { order: [...kept, ...missing], sizes }
}

/* ---------------------------------------------------------- persistence */

const KEY = 'ragdex.layout.v1'

/**
 * Kept in localStorage, per browser, and that is the right home for it.
 *
 * A layout is a property of the screen it was arranged on, not of the account:
 * one tuned for a 27-inch monitor is wrong on a laptop, and syncing it would
 * mean the second device inherits an arrangement built for the first. It is
 * also a preference nobody needs recovered — rearranging takes seconds, and
 * the reset button is right there.
 */
export function readLayout(page: string): Layout | null {
  try {
    const raw = window.localStorage.getItem(`${KEY}.${page}`)
    if (raw === null) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const { order, sizes } = parsed as Partial<Layout>
    if (!Array.isArray(order) || typeof sizes !== 'object' || sizes === null) return null

    return { order: order.filter((id) => typeof id === 'string'), sizes }
  } catch {
    // Private mode, blocked storage, or something written by an older build.
    return null
  }
}

export function writeLayout(page: string, layout: Layout): void {
  try {
    window.localStorage.setItem(`${KEY}.${page}`, JSON.stringify(layout))
  } catch {
    // A layout that could not be saved is a layout that resets on reload —
    // annoying, and not worth interrupting anybody over.
  }
}

export function forgetLayout(page: string): void {
  try {
    window.localStorage.removeItem(`${KEY}.${page}`)
  } catch {
    // Nothing to do, and nothing depends on it having worked.
  }
}
