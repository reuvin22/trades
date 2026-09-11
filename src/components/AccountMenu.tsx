import { useEffect, useId, useRef, useState } from 'react'
import type { AuthUser } from '../lib/useAuth'
import { navigate } from '../lib/useHashRoute'
import { signOutOfApp } from '../lib/useAuth'
import { CardIcon, LogoutIcon, UserGlyphIcon } from './Icons'
import {
  ACCOUNT_AVATAR,
  ACCOUNT_DANGER,
  ACCOUNT_EMAIL,
  ACCOUNT_HEAD,
  ACCOUNT_ITEMS,
  ACCOUNT_MENU,
  ACCOUNT_NAME,
  AVATAR,
  AVATAR_INITIALS,
} from './ui'

type AccountMenuProps = {
  user: AuthUser | null
}

export function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function go(route: string) {
    setOpen(false)
    navigate(route)
  }

  const name = user?.displayName?.trim() || user?.email?.split('@')[0] || 'Trader'

  return (
    <div className="relative" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className={AVATAR}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className={AVATAR_INITIALS}>{name.slice(0, 1).toUpperCase()}</span>
        )}
      </button>

      {open && (
        <div className={ACCOUNT_MENU} id={menuId} role="menu">
          <div className={ACCOUNT_HEAD}>
            <span className={ACCOUNT_AVATAR} aria-hidden="true">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className={AVATAR_INITIALS}>{name.slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <div className="min-w-0">
              <p className={ACCOUNT_NAME}>{name}</p>
              <p className={ACCOUNT_EMAIL}>{user?.email ?? 'Preview session'}</p>
            </div>
          </div>

          <div className={ACCOUNT_ITEMS}>
            <button type="button" role="menuitem" onClick={() => go('profile')}>
              <UserGlyphIcon size={16} />
              My Profile
            </button>
            <button type="button" role="menuitem" onClick={() => go('billing')}>
              <CardIcon size={16} />
              Billing
            </button>
          </div>

          <div className={`${ACCOUNT_ITEMS} border-t border-line`}>
            <button
              type="button"
              role="menuitem"
              className={ACCOUNT_DANGER}
              onClick={async () => {
                setOpen(false)
                /*
                 * Ask the API to clear the cookie, then reload.
                 *
                 * The reload is the point, not a shortcut. Signing out has to
                 * discard everything belonging to the person leaving — the
                 * journal in memory, their contacts, the coach conversation —
                 * and a full reload is the only way to be sure none of it
                 * survives into the next session on a shared machine.
                 *
                 * It also replaces the signal that went with Firebase's
                 * onAuthStateChanged: nothing else tells the app the session
                 * ended, because a cookie the page cannot read is a cookie the
                 * page cannot watch.
                 *
                 * Errors are swallowed deliberately. The endpoint clears the
                 * cookie whether or not it recognises the session, and a
                 * network failure must not leave someone stuck signed in with
                 * no way out — the reload happens regardless.
                 */
                try {
                  await signOutOfApp()
                } catch {
                  // Nothing to report: leaving is the only outcome that matters.
                } finally {
                  window.location.assign('/#/login')
                  window.location.reload()
                }
              }}
            >
              <LogoutIcon size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
