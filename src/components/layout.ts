import { CONTENT_STAGGER } from './ui'

/*
 * Class strings shared by the two shells.
 *
 * The trader app and the admin terminal are the same layout with different
 * navigation in the left column, so the grid, the background wash and the
 * content column are defined once here instead of being kept in step by hand.
 */

const SHELL_WASH =
  'bg-[radial-gradient(1100px_700px_at_78%_-12%,var(--color-glow-a),transparent_62%),radial-gradient(900px_620px_at_108%_42%,var(--color-glow-b),transparent_60%),linear-gradient(180deg,var(--color-bg-top)_0%,var(--color-bg-deep)_100%)]'

/** Two columns above the breakpoint; below it the sidebar leaves the grid and
 *  becomes a drawer, so the content takes the whole width. */
export const APP_SHELL =
  `grid min-h-screen grid-cols-[300px_1fr] max-shell:grid-cols-[1fr] ${SHELL_WASH}`

/*
 * The rail is 76px: wide enough for a centred icon and its focus ring.
 *
 * Written out as a whole class below rather than interpolated from a constant.
 * Tailwind finds utilities by scanning the source as text, so a class built at
 * runtime — `grid-cols-[${WIDTH}_1fr]` — is never generated and the column
 * silently keeps its previous width.
 */

/**
 * The shell with the sidebar collapsed to a rail.
 *
 * Only the column width changes; below the breakpoint the sidebar is a drawer
 * that sits outside the grid entirely, so the collapsed state is meaningless
 * there and the single-column rule still wins.
 *
 * The transition is on `grid-template-columns` rather than on the panel, so
 * the content column moves with the rail instead of being overlapped by it
 * for the length of the animation.
 */
/*
 * The width itself changes in one step, and the slide is done elsewhere.
 *
 * grid-template-columns is a layout property: every frame of a transition on
 * it re-lays-out the whole page behind the sidebar. Measured at 200ms it spent
 * 7 of 45 frames over budget with a 100ms worst case; shortening it to 160ms
 * made it worse, not better (18 of 45, worst 133ms) — the per-frame cost is
 * fixed, so a shorter duration only concentrates it. There is no GPU path for
 * layout, so the motion lives in Sidebar instead, on transform and opacity,
 * which compositing can actually animate.
 */
export function appShell(collapsed: boolean): string {
  return (
    'grid min-h-screen max-shell:grid-cols-[1fr] ' +
    (collapsed ? 'grid-cols-[76px_1fr] ' : 'grid-cols-[300px_1fr] ') +
    SHELL_WASH
  )
}

/** The admin sidebar is narrower. */
export const ADMIN_SHELL = APP_SHELL.replace(
  'grid-cols-[300px_1fr]',
  'grid-cols-[268px_1fr]',
)

/** min-w-0 stops wide tables from stretching the grid column. */
export const WORKSPACE = 'flex min-w-0 flex-col'

export const CONTENT =
  'flex flex-col gap-22 px-30 pt-4 pb-40 max-shell:px-18 ' + CONTENT_STAGGER

const PANEL =
  'sticky top-0 flex h-screen flex-col border-r border-line px-22 pt-30 pb-28 ' +
  'bg-[linear-gradient(170deg,var(--color-sidebar-top)_0%,var(--color-sidebar-mid)_45%,var(--color-sidebar-bottom)_100%)]'

/*
 * Below the breakpoint the panel leaves the shell grid entirely and slides in
 * over the page. `visible`/`invisible` rides the same transition as the
 * transform, which keeps the closed drawer out of the tab order and away from
 * screen readers without cutting the slide-out short — visibility is not
 * interpolable, so it holds `visible` for the whole duration and flips at the
 * end.
 */
const DRAWER =
  'max-shell:fixed max-shell:inset-y-0 max-shell:left-0 max-shell:z-[70] max-shell:h-dvh ' +
  'max-shell:w-[min(300px,84vw)] max-shell:overflow-y-auto max-shell:shadow-[var(--shadow-pop)] ' +
  'max-shell:transition-[transform,visibility,background-color,border-color,color] ' +
  'max-shell:duration-300 max-shell:ease-out'

export function sidebarClass(open: boolean, collapsed = false): string {
  const state = open
    ? 'max-shell:visible max-shell:translate-x-0'
    : 'max-shell:invisible max-shell:-translate-x-full'

  // Narrower padding on the rail so a centred icon still has room to breathe.
  // Reset at the drawer breakpoint, where the panel is full width again.
  const rail = collapsed ? 'shell:px-12 shell:items-center' : ''

  return `${PANEL} ${DRAWER} ${state} ${rail}`
}
