import { useAuth } from '../lib/useAuth'
import { AccountMenu } from './AccountMenu'
import type { Theme } from '../lib/useTheme'
import { BellIcon, ContrastIcon } from './Icons'

type TopBarProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const { user } = useAuth()

  return (
    <header className="topbar">
      <div className="topbar-actions">
        <button type="button" className="icon-button" aria-label="Notifications">
          <BellIcon />
          <span className="badge" />
        </button>
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
      className="icon-button"
      onClick={onToggle}
      aria-pressed={theme === 'light'}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <ContrastIcon className={theme === 'light' ? 'is-flipped' : undefined} />
      <span className="sr-only">
        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
      </span>
    </button>
  )
}
