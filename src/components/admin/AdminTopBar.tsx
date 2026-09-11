import type { Theme } from '../../lib/useTheme'
import { ICON_BUTTON, MenuButton, ThemeToggle, TOPBAR } from '../TopBar'
import { NotificationMenu } from '../NotificationMenu'
import { MonitorIcon, UserGlyphIcon } from '../Icons'

type AdminTopBarProps = {
  theme: Theme
  onToggleTheme: () => void
  navOpen: boolean
  onToggleNav: () => void
}

export function AdminTopBar({
  theme,
  onToggleTheme,
  navOpen,
  onToggleNav,
}: AdminTopBarProps) {
  return (
    <header className={TOPBAR}>
      <MenuButton open={navOpen} onToggle={onToggleNav} />

      <div className="ml-auto flex items-center gap-16">
        <NotificationMenu />
        <button type="button" className={ICON_BUTTON} aria-label="Display settings">
          <MonitorIcon />
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <button
          type="button"
          className="inline-flex items-center gap-9 rounded-full border border-line bg-tint-1 py-5 pr-15 pl-5 text-[12.5px] text-fg-dim transition-[color,border-color,transform] duration-150 hover:border-line-strong hover:text-fg-strong active:scale-[0.97]"
        >
          <span className="grid size-26 place-items-center rounded-full bg-tint-3 text-fg-dim" aria-hidden="true">
            <UserGlyphIcon size={15} />
          </span>
          Admin Terminal
        </button>
      </div>
    </header>
  )
}
