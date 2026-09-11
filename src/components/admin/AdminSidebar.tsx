import { ADMIN_NAV } from '../../navigation'
import { DrawerClose, NavButton, NavScrim, QuickAddButton } from '../Sidebar'
import { sidebarClass } from '../layout'

type AdminSidebarProps = {
  route: string
  onQuickAdd: () => void
  open: boolean
  onClose: () => void
}

export function AdminSidebar({ route, onQuickAdd, open, onClose }: AdminSidebarProps) {
  return (
    <>
      <NavScrim open={open} onClose={onClose} />

      {/* Narrower gutters than the trader sidebar, and the nav scrolls because
          admin has twice the routes. */}
      <aside id="primary-nav" className={`${sidebarClass(open)} px-18`}>
        <a className="block px-10 pb-26" href="#/dashboard" title="Back to the trader app">
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-fg-strong">
            RagDex
          </h1>
          <p className="mt-2 text-[12.5px] tracking-[0.01em] text-fg-muted">
            Admin Dashboard
          </p>
        </a>

        <DrawerClose onClose={onClose} />

        <nav className="-mx-18 flex flex-col overflow-y-auto" aria-label="Admin">
          {ADMIN_NAV.map((section) => (
            <div
              key={section.heading ?? 'primary'}
              className="flex flex-col"
            >
              {section.heading && (
                <p className="px-32 pt-22 pb-8 text-[10.5px] font-medium tracking-[0.14em] text-fg-muted uppercase">
                  {section.heading}
                </p>
              )}

              {section.items.map(({ route: target, label, icon }) => (
                <NavButton
                  key={target}
                  target={target}
                  label={label}
                  icon={icon}
                  active={route === target}
                  onNavigate={onClose}
                  size={18}
                />
              ))}
            </div>
          ))}
        </nav>

        <QuickAddButton
          onClick={() => {
            onClose()
            onQuickAdd()
          }}
        />
      </aside>
    </>
  )
}
