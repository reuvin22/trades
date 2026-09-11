import { TRADER_NAV } from '../navigation'
import { navigate } from '../lib/useHashRoute'
import { PlusIcon } from './Icons'

type SidebarProps = {
  route: string
  onQuickAdd: () => void
}

export function Sidebar({ route, onQuickAdd }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#/dashboard">
        <h1 className="brand-name">RadEx</h1>
        <p className="brand-sub">Pro Trader Account</p>
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
