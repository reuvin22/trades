import { useEffect, useId, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { navigate } from '../lib/useHashRoute'
import { signOutOfApp } from '../lib/useAuth'
import { CardIcon, LogoutIcon, UserGlyphIcon } from './Icons'
import '../styles/account.css'

type AccountMenuProps = {
  user: User | null
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
    <div className="account" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className="avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Account menu"
        onClick={() => setOpen((current) => !current)}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar-initials">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </button>

      {open && (
        <div className="account-menu" id={menuId} role="menu">
          <div className="account-head">
            <span className="account-avatar" aria-hidden="true">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar-initials">{name.slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <div className="account-id">
              <p className="account-name">{name}</p>
              <p className="account-email">{user?.email ?? 'Preview session'}</p>
            </div>
          </div>

          <div className="account-items">
            <button type="button" role="menuitem" onClick={() => go('profile')}>
              <UserGlyphIcon size={16} />
              My Profile
            </button>
            <button type="button" role="menuitem" onClick={() => go('billing')}>
              <CardIcon size={16} />
              Billing
            </button>
          </div>

          <div className="account-items is-last">
            <button
              type="button"
              role="menuitem"
              className="is-danger"
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
