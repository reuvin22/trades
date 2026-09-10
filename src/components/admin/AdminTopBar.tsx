import { useState } from 'react'
import type { Theme } from '../../lib/useTheme'
import { ThemeToggle } from '../TopBar'
import { BellIcon, MonitorIcon, SearchIcon, UserGlyphIcon } from '../Icons'

type AdminTopBarProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function AdminTopBar({ theme, onToggleTheme }: AdminTopBarProps) {
  const [query, setQuery] = useState('')

  return (
    <header className="topbar admin-topbar">
      <div className="search">
        <SearchIcon className="search-icon" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trades, tickers, or setups..."
          aria-label="Search the platform"
        />
      </div>

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
