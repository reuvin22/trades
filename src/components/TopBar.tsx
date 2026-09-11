import { useAuth } from '../lib/useAuth'
import { AccountMenu } from './AccountMenu'
import type { Theme } from '../lib/useTheme'
import { ContrastIcon, MenuIcon } from './Icons'
import { NotificationMenu } from './NotificationMenu'

type TopBarProps = {
  theme: Theme
  onToggleTheme: () => void
  navOpen: boolean
  onToggleNav: () => void
}

/** Space-between so the burger sits left once it appears; with it hidden the
 *  action cluster still lands hard right. */
export const TOPBAR =
  'flex items-center justify-between gap-26 px-30 py-18 max-shell:px-18 ' +
  '[&>*]:animate-fade [&>*:nth-child(2)]:[animation-delay:60ms] [&>*:nth-child(3)]:[animation-delay:120ms]'

/** Round 34px target used by every bare glyph in the bar. */
export const ICON_BUTTON =
  'relative grid size-34 place-items-center rounded-full text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong ' +
  '[&_svg]:transition-transform [&_svg]:duration-[220ms] [&_svg]:ease-spring hover:[&_svg]:scale-[1.12]'

/** The unread dot, ringed in the page colour so it reads as a cutout. */
export const BADGE =
  'absolute top-6 right-7 size-6 rounded-full bg-accent shadow-[0_0_0_2px_var(--color-bg-deep)]'

/**
 * Opens the navigation drawer. Only exists below the shell breakpoint, where
 * the sidebar is no longer on screen.
 */
export function MenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-controls="primary-nav"
      aria-expanded={open}
      aria-label={open ? 'Close navigation' : 'Open navigation'}
      className={`${ICON_BUTTON} hidden max-shell:grid`}
    >
      <MenuIcon />
    </button>
  )
}

export function TopBar({ theme, onToggleTheme, navOpen, onToggleNav }: TopBarProps) {
  const { user } = useAuth()

  return (
    // Space-between so the burger sits left once it appears; with it hidden the
    // action cluster still lands hard right.
    <header className={TOPBAR}>
      <MenuButton open={navOpen} onToggle={onToggleNav} />

      <div className="ml-auto flex items-center gap-16">
        <NotificationMenu />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <AccountMenu user={user} />
      </div>
    </header>
  )
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={ICON_BUTTON}
      onClick={onToggle}
      aria-pressed={theme === 'light'}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <ContrastIcon className={theme === 'light' ? '-scale-x-100' : undefined} />
      <span className="sr-only">
        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
      </span>
    </button>
  )
}
