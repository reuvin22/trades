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
}: {
  target: string
  label: string
  icon: IconComponent
  active: boolean
  onNavigate: () => void
  size?: number
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      // aria-disabled rather than the disabled attribute: the tab stays
      // focusable, so it can still be found and its reason read out.
      aria-disabled={disabled || undefined}
      title={disabled ? `${label} is not available yet` : undefined}
      onClick={() => {
        if (disabled) return
        navigate(target)
        onNavigate()
      }}
      className={
        'relative flex items-center gap-14 px-32 py-13 text-left text-[16px] transition-[color,background-color] duration-150 ' +
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
      <span>{label}</span>
    </button>
  )
}

export function QuickAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-tour="quick-add"
      onClick={onClick}
      className="mt-auto flex animate-rise items-center justify-center gap-10 rounded-md [animation-delay:300ms] border border-line-strong bg-tint-2 px-20 py-17 text-[16px] font-medium text-fg-strong shadow-[var(--shadow-card)] transition-[transform,background-color,border-color] duration-150 hover:-translate-y-1 hover:bg-tint-3 active:translate-y-0"
    >
      <PlusIcon />
      <span>Quick Add Trade</span>
    </button>
  )
}

export function Sidebar({
  route,
  accountLabel,
  onQuickAdd,
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      <NavScrim open={open} onClose={onClose} />

      <aside id="primary-nav" className={sidebarClass(open)}>
        <a className="block animate-fade px-10 pb-26" href="#/dashboard">
          <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-fg-strong">
            RagDex
          </h1>
          <p className="mt-2 text-[12.5px] tracking-[0.01em] text-fg-muted">
            {accountLabel}
          </p>
        </a>

        <DrawerClose onClose={onClose} />

        <nav data-tour="nav" className="-mx-22 flex flex-col gap-2" aria-label="Primary">
          {TRADER_NAV.map(({ route: target, label, icon, disabled }) => (
            <NavButton
              key={target}
              target={target}
              label={label}
              icon={icon}
              active={route === target}
              onNavigate={onClose}
              disabled={disabled}
            />
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
