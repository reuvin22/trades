import { useEffect, useId, useRef, useState } from 'react'
import { useNotifications, type NotificationKind } from '../lib/notifications'
import { navigate } from '../lib/useHashRoute'
import {
  AlertIcon,
  BellIcon,
  BellOffIcon,
  ClockIcon,
  ScalesIcon,
  UserPlusIcon,
} from './Icons'
import type { Profile } from '../lib/profile'
import type { StoredTrade } from '../lib/trades'
import { BADGE, ICON_BUTTON } from './TopBar'
import {
  NOTIFY_ACTION,
  NOTIFY_AGE,
  NOTIFY_EMPTY,
  NOTIFY_GLYPH,
  NOTIFY_GLYPH_TONE,
  NOTIFY_HEAD,
  NOTIFY_ITEM,
  NOTIFY_ITEM_BODY,
  NOTIFY_ITEM_TITLE,
  NOTIFY_LIST,
  NOTIFY_MENU,
  NOTIFY_TITLE,
  NOTIFY_UNREAD,
} from './ui'

const GLYPHS: Record<NotificationKind, typeof AlertIcon> = {
  invite: UserPlusIcon,
  risk: AlertIcon,
  rules: ScalesIcon,
  streak: AlertIcon,
  quiet: ClockIcon,
}

/**
 * The bell, on things that actually happened.
 *
 * Everything in it is derived from the trader's own journal, the plan they
 * wrote down, or an invitation somebody really sent — see `lib/notifications`.
 * Nothing is a placeholder, so an empty bell means a quiet week rather than a
 * feature that was never wired up.
 *
 * Read state is per session: there is no notification store behind this yet,
 * so marking one read keeps it read until reload. The dot on the bell is
 * driven by the unread count rather than being always-on, so it means
 * something.
 */
export function NotificationMenu({
  profile = null,
  trades = [],
}: {
  /* Optional because the admin terminal mounts the same bar and has no
     trader behind it. An admin sees an empty bell, which is the truth. */
  profile?: Profile | null
  trades?: StoredTrade[]
}) {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState<string[]>([])
  const items = useNotifications(profile, trades)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const unread = items.filter((item) => !read.includes(item.id)).length

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

  /** Marking read is local and keyed by id, so a notification that is still
   *  true on the next render does not come back unread. */
  function open_(id: string, route?: string) {
    setRead((current) => (current.includes(id) ? current : [...current, id]))
    if (route !== undefined) {
      navigate(route)
      setOpen(false)
    }
  }

  return (
    <div className="relative" data-tour="notifications" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className={ICON_BUTTON}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={
          unread === 0 ? 'Notifications' : `Notifications, ${unread} unread`
        }
        onClick={() => setOpen((current) => !current)}
      >
        <BellIcon />
        {unread > 0 && <span className={BADGE} />}
      </button>

      {open && (
        <div className={NOTIFY_MENU} id={menuId} role="menu">
          <div className={NOTIFY_HEAD}>
            <p className={NOTIFY_TITLE}>
              Notifications{unread > 0 ? ` (${unread})` : ''}
            </p>
            <button
              type="button"
              className={NOTIFY_ACTION}
              disabled={unread === 0}
              onClick={() => setRead(items.map((item) => item.id))}
            >
              Mark all read
            </button>
          </div>

          {items.length === 0 ? (
            <p className={NOTIFY_EMPTY}>
              <BellOffIcon size={20} />
              Nothing to report. Quiet is usually good.
            </p>
          ) : (
            <div className={NOTIFY_LIST}>
              {items.map((item) => {
                const Glyph = GLYPHS[item.kind]

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={NOTIFY_ITEM}
                    onClick={() => open_(item.id, item.route)}
                  >
                    <span className={`${NOTIFY_GLYPH} ${NOTIFY_GLYPH_TONE[item.kind]}`}>
                      <Glyph size={14} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-8">
                        <span className={NOTIFY_ITEM_TITLE}>{item.title}</span>
                        <span className={NOTIFY_AGE}>{item.age}</span>
                      </span>
                      <span className={`${NOTIFY_ITEM_BODY} block`}>{item.body}</span>
                    </span>

                    {!read.includes(item.id) && <span className={NOTIFY_UNREAD} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
