import { ADMIN_NAV } from '../../navigation'
import { navigate } from '../../lib/useHashRoute'
import { PlusIcon } from '../Icons'

type AdminSidebarProps = {
  route: string
  onQuickAdd: () => void
}

export function AdminSidebar({ route, onQuickAdd }: AdminSidebarProps) {
  return (
    <aside className="sidebar admin-sidebar">
      <a className="brand" href="#/dashboard" title="Back to the trader app">
        <h1 className="brand-name">RadEx</h1>
        <p className="brand-sub">Admin Dashboard</p>
      </a>

      <nav className="nav" aria-label="Admin">
        {ADMIN_NAV.map((section) => (
          <div className="nav-section" key={section.heading ?? 'primary'}>
            {section.heading && <p className="nav-heading">{section.heading}</p>}

            {section.items.map(({ route: target, label, icon: Icon }) => (
              <button
                key={target}
                type="button"
                className={`nav-item${route === target ? ' is-active' : ''}`}
                aria-current={route === target ? 'page' : undefined}
                onClick={() => navigate(target)}
              >
                <Icon className="nav-icon" size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <button type="button" className="quick-add" onClick={onQuickAdd}>
        <PlusIcon />
        <span>Quick Add Trade</span>
      </button>
    </aside>
  )
}
