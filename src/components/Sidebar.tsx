import { TRADER_NAV, type IconComponent } from '../navigation'
import { navigate } from '../lib/useHashRoute'
import { CloseIcon, PlusIcon } from './Icons'
import { sidebarClass } from './layout'
import { NAV_DISABLED } from './ui'

type SidebarProps = {
  route: string
  /** e.g. "Individual Trader Account" — the account's category. */
  accountLabel: string
  onQuickAdd: () => void
  /** Below the shell breakpoint the sidebar is a drawer; above it, permanent. */
  open: boolean
  onClose: () => void
  /** Above the breakpoint: narrowed to a rail of icons. The control for this
   *  lives in the TopBar, so it stays reachable when the labels are gone. */
  collapsed: boolean
}

/*
 * Shared shell chrome.
 *
 * Both this sidebar and the admin one are the same object wearing different
 * navigation, so the pieces that carry the drawer behaviour live here and are
 * imported over there rather than written twice.
 */

/** Dims and seals the page under an open drawer. Fixed, so the shell grid
 *  never sees it as a third column. */
export function NavScrim({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      aria-hidden="true"
      onClick={onClose}
      className={
        'fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] transition-[opacity,visibility] ' +
        'duration-300 ease-out shell:hidden ' +
        (open ? 'visible opacity-100' : 'invisible opacity-0')
      }
    />
  )
}

/** Only reachable while the drawer is open, so it carries no desktop styling. */
export function DrawerClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close navigation"
      className="absolute top-26 right-16 hidden size-34 place-items-center rounded-full text-fg-dim transition-[color,background-color] duration-150 hover:bg-tint-2 hover:text-fg-strong max-shell:grid"
    >
      <CloseIcon />
    </button>
  )
}

export function NavButton({
  target,
  label,
  icon: Icon,
  active,
  onNavigate,
  size = 20,
  disabled = false,
  collapsed = false,
}: {
  target: string
  label: string
  icon: IconComponent
  active: boolean
  onNavigate: () => void
  size?: number
  disabled?: boolean
  /** Rail mode: the icon carries the meaning, so the label is a tooltip. */
  collapsed?: boolean
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      // aria-disabled rather than the disabled attribute: the tab stays
      // focusable, so it can still be found and its reason read out.
      aria-disabled={disabled || undefined}
      // On the rail the label is the only thing naming the destination, so it
      // becomes the tooltip — and the accessible name, which the hidden span
      // below would otherwise be carrying alone.
      title={
        disabled ? `${label} is not available yet` : collapsed ? label : undefined
      }
      onClick={() => {
        if (disabled) return
        navigate(target)
        onNavigate()
      }}
      className={
        'relative flex items-center gap-14 py-13 text-left text-[16px] transition-[color,background-color] duration-150 ' +
        (collapsed ? 'shell:justify-center shell:gap-0 shell:px-0 px-32 ' : 'px-32 ') +
        'animate-slide-left ' +
        // Nudges its label on hover, but only where there is somewhere to go.
        (disabled
          ? `${NAV_DISABLED} font-normal text-fg-dim `
          : '[&>span]:transition-transform [&>span]:duration-[180ms] hover:[&>span]:translate-x-3 [&_svg]:transition-transform [&_svg]:duration-[220ms] [&_svg]:ease-spring hover:[&_svg]:scale-[1.12] ') +
        (disabled
          ? ''
          : active
          ? 'font-medium text-fg-strong bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_18%,transparent),color-mix(in_srgb,var(--color-accent)_5%,transparent))] ' +
            // The active rail, bled to the panel edge.
            "after:absolute after:inset-y-0 after:right-0 after:w-2 after:content-[''] " +
            'after:bg-[linear-gradient(180deg,var(--color-accent-strong),var(--color-accent))] ' +
            'after:shadow-[0_0_14px_color-mix(in_srgb,var(--color-accent)_85%,transparent)] max-shell:after:hidden'
          : 'font-normal text-fg-dim hover:bg-tint-1 hover:text-fg')
      }
    >
      <Icon size={size} className={`flex-none ${active ? 'opacity-100' : 'opacity-85'}`} />
      {/* Hidden rather than dropped: the button keeps its accessible name, so
          the rail reads the same to a screen reader as the full sidebar. */}
      <span className={collapsed ? 'shell:sr-only' : ''}>{label}</span>
    </button>
  )
}

export function QuickAddButton({
  onClick,
  collapsed = false,
}: {
  onClick: () => void
  collapsed?: boolean
}) {
  return (
    <button
      type="button"
      data-tour="quick-add"
      onClick={onClick}
      title={collapsed ? 'Quick Add Trade' : undefined}
      className={
        'mt-auto flex animate-rise items-center justify-center gap-10 rounded-md [animation-delay:300ms] ' +
        'border border-line-strong bg-tint-2 text-[16px] font-medium text-fg-strong shadow-[var(--shadow-card)] ' +
        'transition-[transform,background-color,border-color] duration-150 hover:-translate-y-1 hover:bg-tint-3 active:translate-y-0 ' +
        // Square on the rail, so it reads as the same kind of thing as the
        // nav icons above it rather than a stretched button.
        (collapsed ? 'shell:aspect-square shell:w-full shell:px-0 px-20 py-17' : 'px-20 py-17')
      }
    >
      <PlusIcon />
      <span className={collapsed ? 'shell:sr-only' : ''}>Quick Add Trade</span>
    </button>
  )
}

export function Sidebar({
  route,
  accountLabel,
  onQuickAdd,
  open,
  onClose,
  collapsed,
}: SidebarProps) {
  return (
    <>
      <NavScrim open={open} onClose={onClose} />

      <aside id="primary-nav" className={sidebarClass(open, collapsed)}>
        <div
          className={
            'flex items-start gap-10 pb-26 ' +
            (collapsed ? 'shell:flex-col shell:items-center shell:gap-12 px-10' : 'px-10')
          }
        >
          <a className="block min-w-0 animate-fade" href="#/dashboard">
            <h1
              className={
                'font-semibold tracking-[-0.02em] text-fg-strong ' +
                // On the rail there is no room for the word, so the first
                // letter stands in for it — still a link home, still RagDex.
                (collapsed ? 'shell:text-[24px] text-[30px]' : 'text-[30px]')
              }
            >
              <span className={collapsed ? 'shell:hidden' : ''}>RagDex</span>
              <span className={collapsed ? 'hidden shell:inline' : 'hidden'} aria-hidden="true">
                R
              </span>
              <span className={collapsed ? 'shell:sr-only' : 'hidden'}>RagDex</span>
            </h1>
            <p
              className={
                'mt-2 text-[12.5px] tracking-[0.01em] text-fg-muted ' +
                (collapsed ? 'shell:hidden' : '')
              }
            >
              {accountLabel}
            </p>
          </a>
        </div>

        <DrawerClose onClose={onClose} />

        <nav
          data-tour="nav"
          className={collapsed ? 'flex flex-col gap-2 shell:-mx-12 -mx-22' : '-mx-22 flex flex-col gap-2'}
          aria-label="Primary"
        >
          {TRADER_NAV.map(({ route: target, label, icon, disabled }) => (
            <NavButton
              key={target}
              target={target}
              label={label}
              icon={icon}
              active={route === target}
              onNavigate={onClose}
              disabled={disabled}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <QuickAddButton
          collapsed={collapsed}
          onClick={() => {
            onClose()
            onQuickAdd()
          }}
        />
      </aside>
    </>
  )
}
