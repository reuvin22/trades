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
              onClick={() => {
                setOpen(false)
                void signOutOfApp()
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
