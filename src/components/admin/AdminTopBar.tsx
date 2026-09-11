import type { Theme } from '../../lib/useTheme'
import { ThemeToggle } from '../TopBar'
import { BellIcon, MonitorIcon, UserGlyphIcon } from '../Icons'

type AdminTopBarProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function AdminTopBar({ theme, onToggleTheme }: AdminTopBarProps) {
  return (
    <header className="topbar admin-topbar">
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <BellIcon />
          <span className="badge" />
        </button>
        <button type="button" className="icon-button" aria-label="Display settings">
          <MonitorIcon />
        </button>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <button type="button" className="terminal-chip">
          <span className="terminal-avatar" aria-hidden="true">
            <UserGlyphIcon size={15} />
          </span>
          Admin Terminal
        </button>
      </div>
    </header>
  )
}
