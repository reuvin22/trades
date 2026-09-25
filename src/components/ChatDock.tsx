import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useImageUrl } from '../lib/useImageUrl'
import { useImageViewer } from '../lib/imageViewer'
import {
  addContact,
  deleteMessage,
  editMessage,
  formatSeenTime,
  formatTime,
  markSeen,
  sendMessage,
  useChatConnection,
  useContacts,
  type Contact as ChatContact,
  type ChatMessage,
  type Person as ChatPerson,
} from '../lib/chat'
import { useDirectorySearch, type DirectoryEntry } from '../lib/directory'
import { ACCEPTED, imageFromPaste, prepareChatImage } from '../lib/chartImage'
import { readableApiError } from '../lib/api'
import type { AuthUser } from '../lib/useAuth'
import { accentFor, displayNameFor, initialsFor } from '../data/messages'
import { groupInitials, groupTint, useGroups, type ChatGroup } from '../lib/groups'
import { RoomMembers } from './RoomMembers'
import { hasFeature } from '../lib/entitlements'
import {
  ChatIcon,
  CheckIcon,
  CloseIcon,
  GroupChatIcon,
  ImageIcon,
  SearchIcon,
  SeenIcon,
  PencilIcon,
  SendIcon,
  SpinnerIcon,
  TrashIcon,
  UserPlusIcon,
} from './Icons'
import {
  DOCK_ADD,
  DOCK_ASIDE,
  DOCK_ATTACH,
  DOCK_ASIDE_HEAD,
  DOCK_ASIDE_TITLE,
  DOCK_AVATAR,
  DOCK_AVATAR_FACE,
  DOCK_BACK,
  DOCK_BODY,
  DOCK_BUBBLE,
  DOCK_BUBBLE_ME,
  DOCK_BUBBLE_GONE,
  DOCK_BUBBLE_HELD,
  DOCK_BUBBLE_THEM,
  DOCK_COMPOSER,
  DOCK_CONTACT,
  DOCK_CONTACTS,
  DOCK_CONTACTS_EMPTY,
  DOCK_CONTACT_ACTIVE,
  DOCK_CONTACT_NAME,
  DOCK_CONTACT_ROLE,
  DOCK_EMPTY,
  DOCK_IMAGE,
  DOCK_ERROR,
  DOCK_LAUNCHER,
  DOCK_LAUNCHER_BADGE,
  DOCK_MAIN,
  DOCK_EDITED,
  DOCK_EDITING,
  DOCK_EDITING_CANCEL,
  DOCK_MAIN_HEAD,
  DOCK_MSG_DELETE,
  DOCK_MSG_MENU,
  DOCK_ONLINE,
  DOCK_PANEL,
  DOCK_RESULT,
  DOCK_RESULTS,
  DOCK_RESULT_DETAILS,
  DOCK_RESULT_EMAIL,
  DOCK_RESULT_ERROR,
  DOCK_RESULT_NAME,
  DOCK_RESULT_NOTE,
  DOCK_SEARCH,
  DOCK_SEARCH_CLOSE,
  DOCK_SEARCH_FIELD,
  DOCK_SEEN,
  DOCK_SEEN_ROW,
  DOCK_SEND,
  DOCK_THREAD,
  DOCK_TIME,
  DOCK_TRAY,
  DOCK_TRAY_NAME,
  DOCK_TRAY_THUMB,
  DOCK_TRAY_THUMB_EMPTY,
  DOCK_UNREAD,
  DOCK_GROUP_ACTIONS,
  DOCK_GROUP_BUTTON,
  DOCK_GROUP_CANCEL,
  DOCK_GROUP_CREATE,
  DOCK_GROUP_FACE,
  DOCK_GROUP_FORM,
  DOCK_GROUP_INPUT,
  DOCK_GROUP_LABEL,
  DOCK_GROUP_NEW,
  DOCK_GROUP_PICK,
  DOCK_GROUP_PICKER,
  DOCK_GROUP_TICK,
  DOCK_GROUP_TICK_ON,
  DOCK_GROUPS_TOGGLE,
  DOCK_ROOM,
  DOCK_ROOM_BODY,
  DOCK_ROOM_HEAD,
  DOCK_ROOM_COUNT,
  DOCK_ROOM_NAME,
  DOCK_ROOM_NOTICE,
  MODAL_CLOSE,
} from './ui'

/** A person as the dock draws them: a name, an avatar, a colour. */
type Person = {
  uid: string
  name: string
  email: string
  photoURL: string
  initials: string
  accent: string
}

/**
 * Two shapes arrive here and both render the same row: a directory hit from
 * the API's search, and a live profile from the chat database. They differ
 * only in what the name field is called.
 */
function toPerson(entry: DirectoryEntry | ChatPerson): Person {
  const name = 'displayName' in entry ? entry.displayName : entry.name

  return {
    uid: entry.uid,
    name: displayNameFor(name, entry.email),
    email: entry.email,
    photoURL: entry.photoURL,
    initials: initialsFor(name, entry.email),
    accent: accentFor(entry.uid),
  }
}

/**
 * A contact's circle: their photo when they have one, their initials on their
 * accent colour when they do not. The presence dot rides on the wrapper rather
 * than on the face, because the face clips its photo to a round crop.
 */
function Avatar({ person, online }: { person: Person; online?: boolean }) {
  const photo = useImageUrl(person.photoURL)

  return (
    <span className={DOCK_AVATAR} aria-hidden="true">
      <span className={DOCK_AVATAR_FACE} style={photo ? undefined : { background: person.accent }}>
        {photo ? (
          <img src={photo} alt="" referrerPolicy="no-referrer" />
        ) : (
          person.initials
        )}
      </span>
      {online && <span className={DOCK_ONLINE} />}
    </span>
  )
}

type AddContactProps = {
  /** Everyone already listed — they are not offerable again. */
  known: readonly string[]
  onAdd: (entry: DirectoryEntry) => void
  onClose: () => void
}

/**
 * Search the account directory by email address and add whoever comes back.
 *
 * Each match reads details-then-avatar: the name over the address on the left,
 * the photo closing the row on the right.
 */
function AddContact({ known, onAdd, onClose }: AddContactProps) {
  const [term, setTerm] = useState('')
  const field = useRef<HTMLInputElement>(null)
  const listId = useId()
  const { results, searching, error, hint } = useDirectorySearch(term, known)

  // Opening the search is a request to type into it.
  useEffect(() => {
    field.current?.focus()
  }, [])

  const open = term.trim() !== ''

  return (
    <div className={DOCK_SEARCH}>
      <div className={DOCK_SEARCH_FIELD}>
        <SearchIcon size={13} />
        <input
          ref={field}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          // Escape backs out of the search without closing the whole dock.
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return
            event.stopPropagation()
            onClose()
          }}
          type="email"
          inputMode="email"
          autoComplete="off"
          spellCheck={false}
          placeholder="Add by email…"
          aria-label="Find a trader by email address"
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
        />
        <button
          type="button"
          className={DOCK_SEARCH_CLOSE}
          onClick={onClose}
          aria-label="Cancel adding a contact"
        >
          <CloseIcon size={12} />
        </button>
      </div>

      {open && (
        <div className={DOCK_RESULTS} id={listId} role="listbox">
          {hint !== null && <p className={DOCK_RESULT_NOTE}>{hint}</p>}

          {hint === null && searching && (
            <p className={DOCK_RESULT_NOTE}>
              <SpinnerIcon className="animate-spin" size={13} />
              Searching…
            </p>
          )}

          {hint === null && !searching && error !== null && (
            <p className={`${DOCK_RESULT_NOTE} ${DOCK_RESULT_ERROR}`}>{error}</p>
          )}

          {hint === null && !searching && error === null && results.length === 0 && (
            <p className={DOCK_RESULT_NOTE}>No account uses that address.</p>
          )}

          {hint === null &&
            !searching &&
            error === null &&
            results.map((entry) => {
              const person = toPerson(entry)

              return (
                <button
                  key={entry.uid}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className={DOCK_RESULT}
                  onClick={() => onAdd(entry)}
                >
                  <span className={DOCK_RESULT_DETAILS}>
                    <span className={DOCK_RESULT_NAME}>{person.name}</span>
                    <span className={DOCK_RESULT_EMAIL}>{entry.email}</span>
                  </span>

                  <Avatar person={person} />
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

type BubbleProps = {
  message: ChatMessage
  mine: boolean
  /** True when this is the message whose menu is open. */
  menuOpen: boolean
  onOpenMenu: () => void
  onCloseMenu: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * One message, and the menu its own sender can open by clicking it.
 *
 * Only your own messages are clickable. Editing someone else's words is not a
 * feature, and the database rules refuse it regardless — this just avoids
 * showing a door that is locked. Right-click opens the same menu, since that
 * is what a desktop user reaches for first.
 */
function Bubble({
  message,
  mine,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onEdit,
  onDelete,
}: BubbleProps) {
  const interactive = mine && message.deletedAt === null
  const viewer = useImageViewer()
  // Held in a const so the handler below sees a string: narrowing from the
  // JSX guard does not reach inside a closure.
  const picture = message.image ?? ''

  const anchor = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [dropDown, setDropDown] = useState(false)

  /*
   * The menu sits above the bubble by default, which is where it belongs for
   * all but the messages nearest the top of the thread. The thread scrolls,
   * so "above" can fall outside it and be clipped away entirely — raising
   * z-index cannot escape a scroll container, only moving the menu can.
   *
   * The card is measured rather than assumed a height, and this runs before
   * paint, so the menu never appears in the wrong place first.
   */
  useLayoutEffect(() => {
    if (!menuOpen) return

    const bubble = anchor.current
    const menu = card.current
    const thread = bubble?.closest('[data-thread]')
    if (!bubble || !menu || !thread) return

    const b = bubble.getBoundingClientRect()
    const t = thread.getBoundingClientRect()
    const above = b.top - t.top
    const below = t.bottom - b.bottom

    // Only give up the preferred side when it cannot hold the menu and the
    // other side genuinely has more room.
    setDropDown(above < menu.offsetHeight + 8 && below > above)
  }, [menuOpen])

  function toggle() {
    if (!interactive) return
    if (menuOpen) onCloseMenu()
    else onOpenMenu()
  }

  if (message.deletedAt !== null) {
    return (
      <p className={`${DOCK_BUBBLE_GONE} ${mine ? 'self-end' : 'self-start'}`}>
        {mine ? 'You deleted this message' : 'This message was deleted'}
      </p>
    )
  }

  return (
    <div ref={anchor} className={`relative ${mine ? 'self-end' : 'self-start'} max-w-[78%]`}>
      <div
        className={`${DOCK_BUBBLE} max-w-full ${
          mine ? DOCK_BUBBLE_ME : DOCK_BUBBLE_THEM
        } ${menuOpen ? DOCK_BUBBLE_HELD : ''} ${interactive ? 'cursor-pointer' : ''}`}
        // The dismiss listener below watches pointerdown on the window. Without
        // this, the very press that opens the menu would also close it.
        onPointerDown={(event) => event.stopPropagation()}
        onClick={toggle}
        onContextMenu={(event) => {
          if (!interactive) return
          event.preventDefault()
          onOpenMenu()
        }}
        // Clickable, so reachable and announced. Not a <button>: a message can
        // hold selectable text, and nesting that in a button fights selection.
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-haspopup={interactive ? 'menu' : undefined}
        aria-expanded={interactive ? menuOpen : undefined}
        onKeyDown={(event) => {
          if (!interactive) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
      >
        {message.editedAt !== null && <span className={DOCK_EDITED}>edited</span>}
        {message.image && (
          <img
            className={DOCK_IMAGE}
            src={picture}
            alt={message.text || 'Shared image'}
            // The dock is narrow and a tall screenshot would push the rest
            // of the conversation off screen, so it opens in the viewer. A new
            // browser tab was the old answer: it loses the app, and a decrypted
            // attachment is a blob URL that a fresh tab cannot always resolve.
            onClick={(event) => {
              event.stopPropagation()
              viewer.open([{ src: picture, label: message.text || 'Shared image' }])
            }}
          />
        )}
        {message.text}
        <span className={DOCK_TIME}>{formatTime(message.sentAt)}</span>
      </div>

      {menuOpen && (
        <div
          ref={card}
          className={`${DOCK_MSG_MENU} ${mine ? 'right-0' : 'left-0'} ${
            dropDown ? 'top-[calc(100%+4px)]' : 'bottom-[calc(100%+4px)]'
          }`}
          role="menu"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button type="button" role="menuitem" onClick={onEdit}>
            <PencilIcon size={14} />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            className={DOCK_MSG_DELETE}
            onClick={onDelete}
          >
            <TrashIcon size={14} />
            Delete
          </button>
          <button type="button" role="menuitem" onClick={onCloseMenu}>
            <CloseIcon size={14} />
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * The chat dock: contacts on the left, the selected conversation on the right.
 *
 * Everything comes from the API — contacts, messages, read receipts, presence
 * and the directory search behind the add button. Nothing here talks to a
 * database.
 *
 * Below 620px the two columns cannot both be useful, so it becomes one: the
 * contact list, then the conversation with a way back.
 */
export function ChatDock({ user }: { user: AuthUser | null }) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  /*
   * Rooms, and which list the aside is showing.
   *
   * `pane` rather than a second disclosure under the header: the two are lists
   * of the same thing — conversations — so they take turns in one column
   * instead of stacking and halving each other.
   */
  const rooms = useGroups()
  const groupsAllowed = hasFeature('groupChat')
  const [pane, setPane] = useState<'people' | 'groups'>('people')
  const [creating, setCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [showingMembers, setShowingMembers] = useState(false)
  const [draft, setDraft] = useState('')
  const [failure, setFailure] = useState<string | null>(null)
  const threadBox = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const me = user?.uid ?? null
  const signedIn = me !== null

  const { ready, error: connectionError } = useChatConnection(user)
  const contacts = useContacts(user, ready)

  const active = contacts.find((entry) => entry.person.uid === activeId) ?? null
  const unread = contacts.reduce((sum, entry) => sum + entry.unread, 0)

  /** Anyone already listed is not offerable; the API excludes the caller. */
  const known = useMemo(
    () => contacts.map((entry) => entry.person.uid),
    [contacts],
  )

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
    const node = threadBox.current
    if (node) node.scrollTop = node.scrollHeight
  }, [activeId, active?.messages])

  /*
   * Stamp the open conversation as read.
   *
   * Runs on new arrivals too, so a message that lands while you are looking at
   * it is marked without a click — which is what the other side sees as "Seen".
   * Guarded on there actually being something unread, which is what stops it
   * looping: the write updates the thread, the effect reruns, and now finds
   * nothing to do.
   */
  useEffect(() => {
    if (!open || me === null || active === null || active.unread === 0) return
    markSeen(me, active.person.uid).catch(() => {})
  }, [open, me, active])

  /** The message whose hold-menu is open, and the one being rewritten. */
  const [held, setHeld] = useState<string | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  /** A picture waiting to go with the next message, already downscaled. */
  const [attached, setAttached] = useState<string | null>(null)
  /** Shrinking it. Seconds of canvas work on a large screenshot. */
  const [preparing, setPreparing] = useState(false)
  /** Encrypting and writing it. Text lands instantly; a picture does not. */
  const [sendingImage, setSendingImage] = useState(false)

  // Anywhere else is a dismissal — the usual contract for a context menu.
  useEffect(() => {
    if (held === null) return

    const dismiss = () => setHeld(null)
    window.addEventListener('pointerdown', dismiss)
    return () => window.removeEventListener('pointerdown', dismiss)
  }, [held])

  function beginEdit(message: ChatMessage) {
    setHeld(null)
    setEditing(message)
    setDraft(message.text)
  }

  function cancelEdit() {
    setEditing(null)
    setDraft('')
  }

  async function remove(messageId: string) {
    setHeld(null)
    if (me === null || activeId === null) return

    // Editing the message that just went is not a thing.
    if (editing?.id === messageId) cancelEdit()

    try {
      await deleteMessage(me, activeId, messageId)
    } catch (cause) {
      setFailure(readableApiError(cause))
    }
  }

  /**
   * Open a conversation, or close the one that is open.
   *
   * A hold-menu and a half-finished edit both belong to one message in one
   * conversation, so leaving takes them with it — done here rather than in an
   * effect on , because this is the only thing that changes it.
   */
  /**
   * Open a conversation, or close the one that is open.
   *
   * A hold-menu and a half-finished edit each belong to one message in one
   * conversation, so leaving takes them with it. Done here rather than in an
   * effect watching `activeId`, because this is the only thing that changes it.
   */
  function select(uid: string | null) {
    setActiveId(uid)
    setDraft('')
    setAttached(null)
    setPreparing(false)
    setSendingImage(false)
    setFailure(null)
    setHeld(null)
    setEditing(null)
  }

  async function add(entry: DirectoryEntry) {
    if (me === null) return

    setAdding(false)
    select(entry.uid)

    try {
      await addContact(me, entry.uid)
    } catch (cause) {
      setFailure(readableApiError(cause))
    }
  }

  /* ---------------------------------------------------------------- rooms */

  const activeRoom = rooms.groups.find((room) => room.id === activeRoomId) ?? null

  /** Swap the list. Whatever was open in the other pane closes with it, or the
   *  main column would show a conversation the list beside it no longer has. */
  function showPane(next: 'people' | 'groups') {
    setPane(next)
    setAdding(false)
    setCreating(false)

    if (next === 'groups') {
      select(null)
    } else {
      setActiveRoomId(null)
      setShowingMembers(false)
    }
  }

  function openRoom(id: string) {
    select(null)
    setActiveRoomId(id)
    setShowingMembers(false)
  }

  /** Removing the last person leaves a room with only you in it, which is
   *  allowed — emptying it entirely is not, so the roster keeps you. */
  function removeFromRoom(uid: string) {
    if (activeRoomId === null) return
    rooms.removeMember(activeRoomId, uid)
  }

  function togglePick(uid: string) {
    setPicked((current) =>
      current.includes(uid)
        ? current.filter((entry) => entry !== uid)
        : [...current, uid],
    )
  }

  function createRoom() {
    const name = roomName.trim()
    if (name === '' || picked.length === 0 || me === null) return

    // The caller is a member of the room they just made — stated here rather
    // than left for the server to infer, because nothing is inferring it yet.
    const chosen = picked.map((uid) => {
      const found = contacts.find((entry) => entry.person.uid === uid)
      return {
        uid,
        name: found === undefined ? 'Trader' : toPerson(found.person).name,
      }
    })

    const room = rooms.create(name, [{ uid: me, name: 'You' }, ...chosen])

    setCreating(false)
    setRoomName('')
    setPicked([])
    openRoom(room.id)
  }

  async function send(event: FormEvent) {
    event.preventDefault()

    const text = draft.trim()
    // A picture can carry the message on its own.
    if ((text === '' && attached === null) || activeId === null || me === null) return

    // Cleared first: the message is on its way, and a composer that stays full
    // invites a second send of the same thing. Nothing else is needed here —
    // the SDK echoes the write into the listener before the server has even
    // acknowledged it, so it is on screen by the time this returns.
    const rewriting = editing
    const picture = attached
    setDraft('')
    setEditing(null)
    setFailure(null)
    // The picture stays in the tray until the write lands, so the dock shows
    // "Sending image…" rather than going blank while the encryption and the
    // upload happen.
    if (picture) setSendingImage(true)
    else setAttached(null)

    try {
      if (rewriting !== null) {
        // Only the words move. The rules pin the picture the same way they pin
        // the sender and the time, so an edit cannot swap it.
        await editMessage(me, activeId, rewriting.id, text)
      } else {
        await sendMessage(me, activeId, text, picture ?? undefined)
      }
      setAttached(null)
    } catch (cause) {
      setDraft(text)
      setAttached(picture)
      setEditing(rewriting)
      setFailure(readableApiError(cause))
    } finally {
      setSendingImage(false)
    }
  }

  /**
   * Take one image from a paste or the file picker.
   *
   * Shrunk before it is held, so the thumbnail only appears once it is
   * something that will actually send — a photo too big fails here rather than
   * after a caption has been written for it.
   */
  async function attach(file: File | null) {
    if (!file) return
    setFailure(null)

    // Shrinking a phone screenshot means decoding it, redrawing it and
    // re-encoding it — seconds of work on a large one, with nothing on screen
    // to say so. Silence there reads as a click that did not register, so the
    // tray appears immediately and fills in when the work is done.
    setPreparing(true)

    try {
      setAttached(await prepareChatImage(file))
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'That image could not be used.')
    } finally {
      setPreparing(false)
    }
  }

  /**
   * The last message of mine the other person has reached.
   *
   * One receipt for the whole thread, on that message: seeing a message means
   * having seen everything before it, so marking each one would be noise.
   */
  const receipt = useMemo(() => {
    if (active === null || active.seenAt === null || me === null) return null

    const seen = active.seenAt
    const mine = active.messages.filter(
      (message) => message.sender === me && message.sentAt <= seen,
    )
    const last = mine[mine.length - 1]

    return last ? { messageId: last.id, at: seen } : null
  }, [active, me])

  /*
   * Why the dock cannot do anything, when it cannot.
   *
   * The preview session has no account, so it has nobody to message. Keeping
   * the dock on screen and saying so beats making the launcher vanish.
   */
  const unavailable = !signedIn
    ? 'Sign in with an account to message other traders.'
    : connectionError

  const person = active ? toPerson(active.person) : null

  return (
    <>
      <button
        type="button"
        data-tour="messages"
        className={DOCK_LAUNCHER}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unread === 0 ? 'Open messages' : `Open messages, ${unread} unread`}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <CloseIcon size={20} /> : <ChatIcon />}
        {!open && unread > 0 && <span className={DOCK_LAUNCHER_BADGE}>{unread}</span>}
      </button>

      {open && (
        <section className={DOCK_PANEL} id={panelId} aria-label="Messages">
          <div className={DOCK_BODY}>
            {/* One column at narrow widths: the list steps aside for a thread. */}
            <aside
              className={`${DOCK_ASIDE} ${
                active || activeRoom !== null ? 'max-[620px]:hidden' : ''
              }`}
            >
              <div className={DOCK_ASIDE_HEAD}>
                <h2 className={DOCK_ASIDE_TITLE}>Messages</h2>

                <div className="flex items-center gap-2">
                  {unavailable === null && (
                    <button
                      type="button"
                      className={DOCK_ADD}
                      aria-expanded={adding && pane === 'people'}
                      aria-label="Add a contact"
                      title="Add a contact"
                      // From the rooms list this is also a way back to people:
                      // the search it opens lives under that list, and opening
                      // it without switching would set a flag nothing showed.
                      onClick={() => {
                        if (pane === 'groups') {
                          showPane('people')
                          setAdding(true)
                          return
                        }
                        setAdding((current) => !current)
                      }}
                    >
                      <UserPlusIcon size={15} />
                    </button>
                  )}

                  {/* Paid tiers only — see `groupChat` in entitlements.ts. */}
                  {unavailable === null && groupsAllowed && (
                    <button
                      type="button"
                      className={DOCK_GROUPS_TOGGLE}
                      aria-pressed={pane === 'groups'}
                      aria-label={
                        pane === 'groups' ? 'Show people' : 'Show group chats'
                      }
                      title={pane === 'groups' ? 'People' : 'Group chats'}
                      onClick={() => showPane(pane === 'groups' ? 'people' : 'groups')}
                    >
                      <GroupChatIcon size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    className={MODAL_CLOSE}
                    onClick={() => setOpen(false)}
                    aria-label="Close messages"
                  >
                    <CloseIcon size={15} />
                  </button>
                </div>
              </div>

              {adding && pane === 'people' && (
                <AddContact known={known} onAdd={add} onClose={() => setAdding(false)} />
              )}

              {pane === 'groups' && (
                <>
                  {creating ? (
                    <div className={DOCK_GROUP_FORM}>
                      <input
                        className={DOCK_GROUP_INPUT}
                        value={roomName}
                        autoFocus
                        maxLength={60}
                        placeholder="Name this room…"
                        aria-label="Group name"
                        onChange={(event) => setRoomName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') createRoom()
                          if (event.key !== 'Escape') return
                          event.stopPropagation()
                          setCreating(false)
                        }}
                      />

                      <span className={DOCK_GROUP_LABEL}>
                        Who is in it ({picked.length})
                      </span>

                      {contacts.length === 0 ? (
                        <p className={DOCK_CONTACTS_EMPTY}>
                          Add a contact first — a room needs somebody in it.
                        </p>
                      ) : (
                        <div className={DOCK_GROUP_PICKER}>
                          {contacts.map((entry: ChatContact) => {
                            const listed = toPerson(entry.person)
                            const on = picked.includes(listed.uid)

                            return (
                              <button
                                key={listed.uid}
                                type="button"
                                className={DOCK_GROUP_PICK}
                                aria-pressed={on}
                                onClick={() => togglePick(listed.uid)}
                              >
                                <span
                                  className={`${DOCK_GROUP_TICK} ${on ? DOCK_GROUP_TICK_ON : ''}`}
                                  aria-hidden="true"
                                >
                                  <CheckIcon size={11} />
                                </span>
                                {listed.name}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <div className={DOCK_GROUP_ACTIONS}>
                        <button
                          type="button"
                          className={`${DOCK_GROUP_BUTTON} ${DOCK_GROUP_CANCEL}`}
                          onClick={() => setCreating(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={`${DOCK_GROUP_BUTTON} ${DOCK_GROUP_CREATE}`}
                          disabled={roomName.trim() === '' || picked.length === 0}
                          onClick={createRoom}
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={DOCK_GROUP_NEW}
                      onClick={() => setCreating(true)}
                    >
                      <UserPlusIcon size={14} />
                      New group chat
                    </button>
                  )}
                </>
              )}

              <div className={DOCK_CONTACTS}>
                {pane === 'groups' && rooms.groups.length === 0 && !creating && (
                  <p className={DOCK_CONTACTS_EMPTY}>
                    No group chats yet. Make one and pick who is in it.
                  </p>
                )}

                {pane === 'groups' &&
                  rooms.groups.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => openRoom(room.id)}
                      aria-current={room.id === activeRoomId ? 'true' : undefined}
                      className={`${DOCK_CONTACT} ${
                        room.id === activeRoomId ? DOCK_CONTACT_ACTIVE : ''
                      }`}
                    >
                      <span className={DOCK_AVATAR} aria-hidden="true">
                        <span
                          className={DOCK_GROUP_FACE}
                          style={{ background: groupTint(room.id) }}
                        >
                          {groupInitials(room.name)}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className={`${DOCK_CONTACT_NAME} block`}>{room.name}</span>
                        <span className={`${DOCK_CONTACT_ROLE} block`}>
                          {room.preview ?? `${room.members.length} members`}
                        </span>
                      </span>

                      {room.unread > 0 && (
                        <span className={DOCK_UNREAD}>{room.unread}</span>
                      )}
                    </button>
                  ))}

                {pane === 'people' && contacts.length === 0 && !adding && (
                  <p className={DOCK_CONTACTS_EMPTY}>
                    {unavailable ??
                      'No conversations yet. Add someone by their email address.'}
                  </p>
                )}

                {pane === 'people' &&
                  contacts.map((entry: ChatContact) => {
                  const listed = toPerson(entry.person)

                  return (
                    <button
                      key={listed.uid}
                      type="button"
                      onClick={() => select(listed.uid)}
                      aria-current={listed.uid === activeId ? 'true' : undefined}
                      className={`${DOCK_CONTACT} ${
                        listed.uid === activeId ? DOCK_CONTACT_ACTIVE : ''
                      }`}
                    >
                      <Avatar person={listed} online={entry.online} />

                      <span className="min-w-0 flex-1">
                        <span className={`${DOCK_CONTACT_NAME} block`}>{listed.name}</span>
                        <span className={`${DOCK_CONTACT_ROLE} block`}>
                          {entry.lastText || listed.email}
                        </span>
                      </span>

                      {entry.unread > 0 && (
                        <span className={DOCK_UNREAD}>{entry.unread}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </aside>

            <div
              className={`${DOCK_MAIN} ${
                active || activeRoom !== null ? '' : 'max-[620px]:hidden'
              }`}
            >
              {activeRoom !== null ? (
                <Room
                  room={activeRoom}
                  onBack={() => setActiveRoomId(null)}
                  onShowMembers={() => setShowingMembers(true)}
                />
              ) : person === null ? (
                <p className={DOCK_EMPTY}>
                  {pane === 'groups'
                    ? 'Pick a group on the left, or make a new one.'
                    : 'Pick someone on the left and the conversation opens here.'}
                </p>
              ) : (
                <>
                  <header className={DOCK_MAIN_HEAD}>
                    <Avatar person={person} online={active?.online ?? false} />
                    <div className="min-w-0">
                      <p className={DOCK_CONTACT_NAME}>{person.name}</p>
                      <p className={DOCK_CONTACT_ROLE}>
                        {active?.online ? 'Online now' : person.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`${DOCK_BACK} ml-auto`}
                      onClick={() => select(null)}
                    >
                      Contacts
                    </button>
                  </header>

                  <div className={DOCK_THREAD} ref={threadBox} data-thread>
                    {active === null ? (
                      <p className={DOCK_EMPTY}>Loading…</p>
                    ) : active.messages.length === 0 ? (
                      <p className={DOCK_EMPTY}>
                        No messages yet. Say something to {person.name.split(' ')[0]}.
                      </p>
                    ) : (
                      active.messages.map((message: ChatMessage) => (
                        <div key={message.id} className="contents">
                          <Bubble
                            message={message}
                            mine={message.sender === me}
                            menuOpen={held === message.id}
                            onOpenMenu={() => setHeld(message.id)}
                            onCloseMenu={() => setHeld(null)}
                            onEdit={() => beginEdit(message)}
                            onDelete={() => void remove(message.id)}
                          />

                          {receipt !== null && receipt.messageId === message.id && (
                            <p className={`${DOCK_SEEN} ${DOCK_SEEN_ROW}`}>
                              <SeenIcon size={12} />
                              Seen {formatSeenTime(receipt.at)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {failure !== null && <p className={DOCK_ERROR}>{failure}</p>}

                  {editing !== null && (
                    <p className={DOCK_EDITING}>
                      <PencilIcon size={12} />
                      Editing a message
                      <button
                        type="button"
                        className={DOCK_EDITING_CANCEL}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </p>
                  )}

                  {(attached !== null || preparing || sendingImage) && (
                    <div className={DOCK_TRAY} aria-live="polite">
                      {attached === null ? (
                        <span className={DOCK_TRAY_THUMB_EMPTY}>
                          <SpinnerIcon className="animate-spin" size={14} />
                        </span>
                      ) : (
                        <img className={DOCK_TRAY_THUMB} src={attached} alt="" />
                      )}

                      <span className={DOCK_TRAY_NAME}>
                        {preparing
                          ? 'Preparing image…'
                          : sendingImage
                            ? 'Sending image…'
                            : 'Image ready to send'}
                      </span>

                      {/* No way out mid-flight: cancelling a send that has
                          already left would clear the tray without stopping
                          anything. */}
                      {!preparing && !sendingImage && (
                        <button
                          type="button"
                          className={DOCK_ATTACH}
                          onClick={() => setAttached(null)}
                          aria-label="Remove image"
                        >
                          <CloseIcon size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  <form
                    className={DOCK_COMPOSER}
                    onSubmit={send}
                    // On the form rather than the input: someone who has just
                    // taken a screenshot has usually not clicked into the text
                    // field first.
                    onPaste={(event) =>
                      void attach(imageFromPaste(event.clipboardData.items))
                    }
                  >
                    {/* An edit may change the words, never the picture — the
                        database rules pin it, so the control goes away. */}
                    {editing === null && (
                      <label className={DOCK_ATTACH} title="Send an image">
                        <ImageIcon size={16} />
                        <span className="sr-only">Send an image</span>
                        <input
                          type="file"
                          accept={ACCEPTED}
                          className="hidden"
                          onChange={(event) => {
                            void attach(event.target.files?.[0] ?? null)
                            event.target.value = ''
                          }}
                        />
                      </label>
                    )}

                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder={
                        editing !== null
                          ? 'Rewrite your message…'
                          : attached !== null
                            ? 'Add a caption, or just send…'
                            : `Message ${person.name.split(' ')[0]}…`
                      }
                      aria-label={
                        editing !== null ? 'Edit your message' : `Message ${person.name}`
                      }
                    />
                    <button
                      type="submit"
                      className={DOCK_SEND}
                      disabled={draft.trim() === '' && attached === null}
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

      {/* A native <dialog>, so it sits above the dock without a z-index race. */}
      <RoomMembers
        room={showingMembers ? activeRoom : null}
        meUid={me}
        onClose={() => setShowingMembers(false)}
        onNickname={(uid, nickname) => {
          if (activeRoomId !== null) rooms.setNickname(activeRoomId, uid, nickname)
        }}
        onRemove={removeFromRoom}
      />
    </>
  )
}

/**
 * One room.
 *
 * The header carries the name and the member count; the count is the way into
 * the roster, which opens in a dialog rather than filling this panel. The body
 * is where the thread goes, and it is empty because there is no thread to draw
 * — a room has no key to decrypt with and no path in `database.rules.json` to
 * read from, so a message list here would be one that could never arrive.
 */
function Room({
  room,
  onBack,
  onShowMembers,
}: {
  room: ChatGroup
  onBack: () => void
  onShowMembers: () => void
}) {
  return (
    <div className={DOCK_ROOM}>
      <header className={DOCK_ROOM_HEAD}>
        <span className={DOCK_AVATAR} aria-hidden="true">
          <span className={DOCK_GROUP_FACE} style={{ background: groupTint(room.id) }}>
            {groupInitials(room.name)}
          </span>
        </span>

        <span className="min-w-0">
          <span className={`${DOCK_ROOM_NAME} block`}>{room.name}</span>
          <button type="button" className={DOCK_ROOM_COUNT} onClick={onShowMembers}>
            {room.members.length} {room.members.length === 1 ? 'member' : 'members'}
          </button>
        </span>

        <button type="button" className={`${DOCK_BACK} ml-auto`} onClick={onBack}>
          Back
        </button>
      </header>

      <p className={DOCK_ROOM_BODY}>Nothing has been said in here yet.</p>

      <p className={DOCK_ROOM_NOTICE}>
        Group messages are not connected yet. One-to-one chat works because a
        thread id is the two uids sorted, which is what the database rules check
        and what the API derives a key from — a room needs a real member list and
        a key that survives people joining, so it needs server work before
        anything can be sent here.
      </p>
    </div>
  )
}
