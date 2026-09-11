import { CONTENT_STAGGER } from './ui'

/*
 * Class strings shared by the two shells.
 *
 * The trader app and the admin terminal are the same layout with different
 * navigation in the left column, so the grid, the background wash and the
 * content column are defined once here instead of being kept in step by hand.
 */

/** Two columns above the breakpoint; below it the sidebar leaves the grid and
 *  becomes a drawer, so the content takes the whole width. */
export const APP_SHELL =
  'grid min-h-screen grid-cols-[300px_1fr] max-shell:grid-cols-[1fr] ' +
  'bg-[radial-gradient(1100px_700px_at_78%_-12%,var(--color-glow-a),transparent_62%),radial-gradient(900px_620px_at_108%_42%,var(--color-glow-b),transparent_60%),linear-gradient(180deg,var(--color-bg-top)_0%,var(--color-bg-deep)_100%)]'

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

export function sidebarClass(open: boolean): string {
  const state = open
    ? 'max-shell:visible max-shell:translate-x-0'
    : 'max-shell:invisible max-shell:-translate-x-full'

  return `${PANEL} ${DRAWER} ${state}`
}
