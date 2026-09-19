import { useState } from 'react'
import {
  groupOfRoute,
  isGroup,
  TRADER_NAV,
  type IconComponent,
  type NavGroup,
} from '../navigation'
import { navigate } from '../lib/useHashRoute'
import { ChevronRightIcon, CollapseIcon, CloseIcon, PlusIcon } from './Icons'
import { SHELL_BREAKPOINT, sidebarClass } from './layout'
import {
  NAV_CARET,
  NAV_CARET_OPEN,
  NAV_DISABLED,
  NAV_SUB,
  NAV_SUB_ACTIVE,
  NAV_SUB_IDLE,
  NAV_SUB_INNER,
  NAV_SUB_ITEM,
  NAV_SUB_OPEN,
  NAV_SUB_SHUT,
} from './ui'

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
  onToggleCollapse: () => void
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

/**
 * The shared shape of a top-level row, whether it navigates or discloses.
 *
 * Extracted so a category and a link are the same object to the eye: they sit
 * in one list, and a category that styled itself even slightly differently
 * would read as a different kind of control rather than as a peer.
 *
 * `within` is the third state, for a category holding the page you are on. It
 * brightens the label but deliberately skips the gradient and the edge bar —
 * those belong to the child that is actually open, and painting both made the
 * sidebar look like two pages were active at once.
 */
function navButtonClass({
  collapsed,
  disabled = false,
  active = false,
  within = false,
}: {
  collapsed: boolean
  disabled?: boolean
  active?: boolean
  within?: boolean
}): string {
  return (
    'relative flex items-center gap-14 py-13 text-left text-[16px] transition-[color,background-color] duration-150 ' +
    (collapsed
      ? 'shell:mx-auto shell:size-44 shell:justify-center shell:gap-0 shell:rounded-[12px] shell:p-0 px-32 '
      : 'px-32 ') +
    'animate-slide-left ' +
    // Nudges its label on hover, but only where there is somewhere to go.
    (disabled
      ? `${NAV_DISABLED} font-normal text-fg-dim `
      : '[&>span]:transition-transform [&>span]:duration-[180ms] hover:[&>span]:translate-x-3 [&_svg]:transition-transform [&_svg]:duration-[220ms] [&_svg]:ease-spring hover:[&_svg]:scale-[1.12] ') +
    (disabled
      ? ''
      : active
      ? 'font-medium text-fg-strong bg-[linear-gradient(90deg,color-mix(in_srgb,var(--color-accent)_18%,transparent),color-mix(in_srgb,var(--color-accent)_5%,transparent))] ' +
        // On the rail: kill the gradient (a background-image) and paint a
        // solid tile (a background-colour) instead, so the two never fight
        // over the same property. The edge bar goes with it.
        (collapsed
          ? 'shell:bg-none shell:bg-[color-mix(in_srgb,var(--color-accent)_24%,transparent)] shell:after:hidden shell:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] '
          : '') +
        // The active rail, bled to the panel edge.
        "after:absolute after:inset-y-0 after:right-0 after:w-2 after:content-[''] " +
        'after:bg-[linear-gradient(180deg,var(--color-accent-strong),var(--color-accent))] ' +
        'after:shadow-[0_0_14px_color-mix(in_srgb,var(--color-accent)_85%,transparent)] max-shell:after:hidden'
      : within
      ? 'font-medium text-fg-strong hover:bg-tint-1'
      : 'font-normal text-fg-dim hover:bg-tint-1 hover:text-fg')
  )
}

/**
 * A category: expands the rail if it is narrow, then discloses its children.
 *
 * Click only. The brief says it explicitly and it is the right call — a rail
 * that opens sub-menus under the pointer fires them at someone whose mouse is
 * only travelling across it, and on a touch screen there is no hover to speak
 * of anyway.
 */
function NavCategory({
  group,
  open,
  within,
  collapsed,
  onToggle,
}: {
  group: NavGroup
  open: boolean
  within: boolean
  collapsed: boolean
  onToggle: () => void
}) {
  const Icon = group.icon

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={`nav-group-${group.id}`}
      title={collapsed ? group.label : undefined}
      onClick={onToggle}
      className={navButtonClass({ collapsed, within })}
    >
      <Icon size={20} className={`flex-none ${within ? 'opacity-100' : 'opacity-85'}`} />
      <span
        className={
          'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out ' +
          (collapsed ? 'shell:max-w-0 shell:opacity-0 max-w-200' : 'max-w-200')
        }
      >
        {group.label}
      </span>
      {/* The caret is meaningless on the rail, where there is no room for the
          list it would be pointing at. */}
      <ChevronRightIcon
        size={14}
        className={`${NAV_CARET} ${open ? NAV_CARET_OPEN : ''} ${
          collapsed ? 'shell:hidden' : ''
        }`}
      />
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
      className={navButtonClass({ collapsed, disabled, active })}
    >
      <Icon size={size} className={`flex-none ${active ? 'opacity-100' : 'opacity-85'}`} />
      {/* Hidden rather than dropped: the button keeps its accessible name, so
          the rail reads the same to a screen reader as the full sidebar. */}
      {/*
        The slide. max-width rather than width so the label keeps its natural
        size when open, and opacity so it goes before the space does. Both are
        confined to a button that is a fixed 44px on the rail, so the page
        behind the sidebar never re-lays-out — which is what made transitioning
        the shell's own columns unusable.
      */}
      <span
        className={
          'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out ' +
          (collapsed ? 'shell:max-w-0 shell:opacity-0 max-w-200' : 'max-w-200')
        }
      >
        {label}
      </span>
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
  onToggleCollapse,
}: SidebarProps) {
  /*
   * Which category is open, derived rather than stored.
   *
   * The default is simply the category holding the current page, so arriving
   * on the calendar by any means — a link, a deep link, the quick-add dialog
   * — leaves Trading open around it without anything having to notice the
   * navigation and react to it.
   *
   * A click is recorded as an override *stamped with the route it was made
   * on*, so it lasts exactly as long as you stay on that page and then falls
   * back to the derived answer. That one detail is what removes the effect
   * this used to need: syncing state to a prop in `useEffect` renders twice
   * and trips the cascading-render rule, and this never has to sync at all.
   */
  const [override, setOverride] = useState<{ route: string; group: string | null } | null>(
    null,
  )
  const openGroup =
    override !== null && override.route === route ? override.group : groupOfRoute(route)

  const toggleGroup = (id: string) => {
    setOverride({ route, group: openGroup === id ? null : id })

    /*
     * Widen the rail on the way, since a disclosed list is unreadable at 76px.
     *
     * Guarded by the breakpoint rather than by `collapsed` alone: below it the
     * sidebar is a drawer that always shows labels, and `collapsed` is still
     * whatever the desktop left it at. Toggling from a phone would silently
     * rewrite a preference that belongs to a screen this person is not using.
     */
    if (!collapsed) return
    if (window.matchMedia(`(min-width: ${SHELL_BREAKPOINT}px)`).matches) {
      onToggleCollapse()
    }
  }

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
          <a className="flex min-w-0 items-center gap-9 animate-fade" href="#/dashboard">
            <span
              aria-hidden="true"
              className="grid size-25 flex-none place-items-center rounded-full border-2 border-accent shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_14%,transparent)]"
            >
              <span className="size-11 rounded-full bg-accent" />
            </span>
            <div className="min-w-0">
            <h1
              className={
                'font-semibold tracking-[-0.02em] text-fg-strong ' +
                // On the rail there is no room for the word, so a short mark
                // stands in for it — still a link home, still RagDex. 20px,
                // not 24: three letters have to clear 52px of usable rail
                // (76px column less its px-12), and the focus ring needs room
                // inside that too.
                (collapsed ? 'shell:text-[20px] text-[30px]' : 'text-[30px]')
              }
            >
              <span className={collapsed ? 'shell:hidden' : ''}>RagDex</span>
              <span
                className={
                  (collapsed ? 'hidden shell:inline' : 'hidden') + ' tracking-[-0.04em]'
                }
                aria-hidden="true"
              >
                RDX
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
            </div>
          </a>
        </div>

        {/* The control for the rail's width rides the panel's right border
            instead of sitting under the wordmark.

            It has to. The rail is a 76px column with px-12 on it, so 52px of
            usable width — a three-letter mark and a 30px button cannot share
            that row, and stacking them is what put the button underneath RDX.
            On the border it belongs to neither, and the panel is `sticky`, so
            it is already the containing block this resolves against.

            shell-only, as before: below that breakpoint the sidebar is a
            drawer with overflow-y-auto, which would clip anything hanging off
            its edge — and there is nothing to collapse there anyway. */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-controls="primary-nav"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          className={
            'absolute top-1/2 -right-14 z-10 hidden size-28 -translate-y-1/2 shell:grid ' +
            'place-items-center rounded-full border border-line text-fg-muted ' +
            'bg-[var(--color-sidebar-mid)] shadow-[var(--shadow-pop)] ' +
            'transition-[color,background-color,transform] duration-150 ' +
            'hover:bg-tint-2 hover:text-fg-strong ' +
            (collapsed ? 'rotate-180' : '')
          }
        >
          <CollapseIcon />
        </button>

        <DrawerClose onClose={onClose} />

        <nav
          data-tour="nav"
          className={collapsed ? 'flex flex-col gap-2 shell:-mx-12 -mx-22' : '-mx-22 flex flex-col gap-2'}
          aria-label="Primary"
        >
          {TRADER_NAV.map((entry) => {
            if (!isGroup(entry)) {
              return (
                <NavButton
                  key={entry.route}
                  target={entry.route}
                  label={entry.label}
                  icon={entry.icon}
                  active={route === entry.route}
                  onNavigate={onClose}
                  disabled={entry.disabled}
                  collapsed={collapsed}
                />
              )
            }

            const open = openGroup === entry.id
            const within = entry.children.some((child) => child.route === route)

            return (
              <div key={entry.id}>
                <NavCategory
                  group={entry}
                  open={open}
                  within={within}
                  collapsed={collapsed}
                  onToggle={() => toggleGroup(entry.id)}
                />

                {/* Rendered whether open or shut so the transition has
                    something to move between, and hidden outright on the rail
                    where there is no width to indent into. */}
                <div
                  id={`nav-group-${entry.id}`}
                  className={`${NAV_SUB} ${open ? NAV_SUB_OPEN : NAV_SUB_SHUT} ${
                    collapsed ? 'shell:hidden' : ''
                  }`}
                >
                  <div className={NAV_SUB_INNER}>
                    {entry.children.map((child) => (
                      <button
                        key={child.route}
                        type="button"
                        aria-current={route === child.route ? 'page' : undefined}
                        // Not focusable while the group is shut: a collapsed
                        // list still occupies the tab order otherwise, and the
                        // focus ring lands on something nobody can see.
                        tabIndex={open ? undefined : -1}
                        onClick={() => {
                          navigate(child.route)
                          onClose()
                        }}
                        className={`${NAV_SUB_ITEM} ${
                          route === child.route ? NAV_SUB_ACTIVE : NAV_SUB_IDLE
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
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
