import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CONTACTS, type ChatMessage, type Contact } from '../data/messages'
import { ChatIcon, CloseIcon, SendIcon } from './Icons'
import {
  DOCK_ASIDE,
  DOCK_ASIDE_HEAD,
  DOCK_ASIDE_TITLE,
  DOCK_AVATAR,
  DOCK_BACK,
  DOCK_BODY,
  DOCK_BUBBLE,
  DOCK_BUBBLE_ME,
  DOCK_BUBBLE_THEM,
  DOCK_COMPOSER,
  DOCK_CONTACT,
  DOCK_CONTACTS,
  DOCK_CONTACT_ACTIVE,
  DOCK_CONTACT_NAME,
  DOCK_CONTACT_ROLE,
  DOCK_EMPTY,
  DOCK_LAUNCHER,
  DOCK_LAUNCHER_BADGE,
  DOCK_MAIN,
  DOCK_MAIN_HEAD,
  DOCK_ONLINE,
  DOCK_PANEL,
  DOCK_SEND,
  DOCK_THREAD,
  DOCK_TIME,
  DOCK_UNREAD,
  MODAL_CLOSE,
} from './ui'

function Avatar({ contact, size }: { contact: Contact; size?: string }) {
  return (
    <span
      className={`${DOCK_AVATAR} ${size ?? ''}`}
      style={{ background: contact.accent }}
      aria-hidden="true"
    >
      {contact.initials}
      {contact.online && <span className={DOCK_ONLINE} />}
    </span>
  )
}

function now(): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

/**
 * The chat dock: contacts on the left, the selected conversation on the right.
 *
 * Everything typed here lives in component state for the session — there is no
 * transport behind it yet. The seam is `send`, which is the only place that
 * would need to talk to a server.
 *
 * Below 620px the two columns cannot both be useful, so it becomes one: the
 * contact list, then the conversation with a way back.
 */
export function ChatDock() {
  const [open, setOpen] = useState(false)
  const [contacts, setContacts] = useState(CONTACTS)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const thread = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const active = contacts.find((contact) => contact.id === activeId) ?? null
  const unread = contacts.reduce((sum, contact) => sum + contact.unread, 0)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Always land on the newest message, both on opening a thread and on sending.
  useEffect(() => {
    const node = thread.current
    if (node) node.scrollTop = node.scrollHeight
  }, [activeId, contacts])

  function select(id: string) {
    setActiveId(id)
    setDraft('')
    // Opening a conversation is what clears its badge.
    setContacts((current) =>
      current.map((contact) => (contact.id === id ? { ...contact, unread: 0 } : contact)),
    )
  }

  function send(event: FormEvent) {
    event.preventDefault()

    const text = draft.trim()
    if (text === '' || !active) return

    const message: ChatMessage = {
      id: `local-${Date.now()}`,
      from: 'me',
      text,
      at: now(),
    }

    setContacts((current) =>
      current.map((contact) =>
        contact.id === active.id
          ? { ...contact, messages: [...contact.messages, message] }
          : contact,
      ),
    )
    setDraft('')
  }

  return (
    <>
      <button
        type="button"
        className={DOCK_LAUNCHER}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={
          unread === 0 ? 'Open messages' : `Open messages, ${unread} unread`
        }
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <CloseIcon size={20} /> : <ChatIcon />}
        {!open && unread > 0 && <span className={DOCK_LAUNCHER_BADGE}>{unread}</span>}
      </button>

      {open && (
        <section className={DOCK_PANEL} id={panelId} aria-label="Messages">
          <div className={DOCK_BODY}>
            {/* One column at narrow widths: the list steps aside for a thread. */}
            <aside className={`${DOCK_ASIDE} ${active ? 'max-[620px]:hidden' : ''}`}>
              <div className={DOCK_ASIDE_HEAD}>
                <h2 className={DOCK_ASIDE_TITLE}>Messages</h2>
                <button
                  type="button"
                  className={MODAL_CLOSE}
                  onClick={() => setOpen(false)}
                  aria-label="Close messages"
                >
                  <CloseIcon size={15} />
                </button>
              </div>

              <div className={DOCK_CONTACTS}>
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => select(contact.id)}
                    aria-current={contact.id === activeId ? 'true' : undefined}
                    className={`${DOCK_CONTACT} ${
                      contact.id === activeId ? DOCK_CONTACT_ACTIVE : ''
                    }`}
                  >
                    <Avatar contact={contact} />

                    <span className="min-w-0 flex-1">
                      <span className={`${DOCK_CONTACT_NAME} block`}>{contact.name}</span>
                      <span className={`${DOCK_CONTACT_ROLE} block`}>{contact.role}</span>
                    </span>

                    {contact.unread > 0 && (
                      <span className={DOCK_UNREAD}>{contact.unread}</span>
                    )}
                  </button>
                ))}
              </div>
            </aside>

            <div className={`${DOCK_MAIN} ${active ? '' : 'max-[620px]:hidden'}`}>
              {active === null ? (
                <p className={DOCK_EMPTY}>
                  Pick someone on the left and the conversation opens here.
                </p>
              ) : (
                <>
                  <header className={DOCK_MAIN_HEAD}>
                    <Avatar contact={active} />
                    <div className="min-w-0">
                      <p className={DOCK_CONTACT_NAME}>{active.name}</p>
                      <p className={DOCK_CONTACT_ROLE}>
                        {active.online ? 'Online now' : active.role}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`${DOCK_BACK} ml-auto`}
                      onClick={() => setActiveId(null)}
                    >
                      Contacts
                    </button>
                  </header>

                  <div className={DOCK_THREAD} ref={thread}>
                    {active.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`${DOCK_BUBBLE} ${
                          message.from === 'me' ? DOCK_BUBBLE_ME : DOCK_BUBBLE_THEM
                        }`}
                      >
                        {message.text}
                        <span className={DOCK_TIME}>{message.at}</span>
                      </div>
                    ))}
                  </div>

                  <form className={DOCK_COMPOSER} onSubmit={send}>
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={`Message ${active.name.split(' ')[0]}…`}
                      aria-label={`Message ${active.name}`}
                    />
                    <button
                      type="submit"
                      className={DOCK_SEND}
                      disabled={draft.trim() === ''}
                      aria-label="Send"
                    >
                      <SendIcon size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
