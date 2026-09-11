import { useEffect, useId, useRef, useState } from 'react'
import { NOTIFICATIONS, type NotificationKind } from '../data/notifications'
import {
  AlertIcon,
  BellIcon,
  BellOffIcon,
  CheckCircleIcon,
  MonitorIcon,
  SparkleIcon,
} from './Icons'
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
  fill: CheckCircleIcon,
  risk: AlertIcon,
  coach: SparkleIcon,
  system: MonitorIcon,
}

/**
 * The bell, which until now opened nothing.
 *
 * Read state is per session: there is no notification store behind this yet,
 * so marking one read keeps it read until reload. The dot on the bell is
 * driven by the unread count rather than being always-on, so it means
 * something.
 */
export function NotificationMenu() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(NOTIFICATIONS)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const unread = items.filter((item) => item.unread).length

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

  function markRead(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    )
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
              onClick={() =>
                setItems((current) => current.map((item) => ({ ...item, unread: false })))
              }
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
                    onClick={() => markRead(item.id)}
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

                    {item.unread && <span className={NOTIFY_UNREAD} />}
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
