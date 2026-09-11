import { TRADER_NAV } from '../navigation'
import { navigate } from '../lib/useHashRoute'
import { PlusIcon } from './Icons'

type SidebarProps = {
  route: string
  /** e.g. "Individual Trader Account" — the account's category. */
  accountLabel: string
  onQuickAdd: () => void
}

export function Sidebar({ route, accountLabel, onQuickAdd }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#/dashboard">
        <h1 className="brand-name">RagDex</h1>
        <p className="brand-sub">{accountLabel}</p>
      </a>

      <nav className="nav" aria-label="Primary">
        {TRADER_NAV.map(({ route: target, label, icon: Icon }) => (
          <button
            key={target}
            type="button"
            className={`nav-item${route === target ? ' is-active' : ''}`}
            aria-current={route === target ? 'page' : undefined}
            onClick={() => navigate(target)}
          >
            <Icon className="nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <button type="button" className="quick-add" onClick={onQuickAdd}>
        <PlusIcon />
        <span>Quick Add Trade</span>
      </button>
    </aside>
  )
}
