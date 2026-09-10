import { useState } from 'react'
import { useAuth } from '../lib/useAuth'
import { AccountMenu } from './AccountMenu'
import type { Theme } from '../lib/useTheme'
import { BellIcon, ContrastIcon, SearchIcon } from './Icons'

const TABS = ['Portfolio', 'Watchlist'] as const

type TopBarProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const { user } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Portfolio')
  const [query, setQuery] = useState('')

  return (
    <header className="topbar">
      <div className="search">
        <SearchIcon className="search-icon" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trades, tickers, or setups..."
          aria-label="Search trades, tickers, or setups"
        />
      </div>

      <div className="tabs" role="tablist" aria-label="Account view">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={`tab${tab === name ? ' is-active' : ''}`}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>

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
