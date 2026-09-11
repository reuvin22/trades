import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch, date, readableApiError } from './api'
import { toEntry, type DirectoryEntry } from './directory'

/**
 * Chat, through the API.
 *
 * The Realtime Database is gone from the client along with everything else
 * Firebase. What replaced its live listeners is polling, which is the honest
 * trade: a browser that can subscribe to a database is a browser holding
 * credentials for it.
 *
 * Polling is paced by what is actually on screen — see `POLL_OPEN` and
 * `POLL_IDLE` — so a closed dock costs one request a minute rather than one a
 * second.
 */

export type ChatMessage = {
  id: string
  /** The sender's uid. Compared against your own to pick a side. */
  sender: string
  text: string
  sentAt: Date
}

export type Contact = {
  person: DirectoryEntry
  unread: number
  lastText: string
  lastAt: Date | null
  /** When they last had this thread open. What makes a sent message seen. */
  seenAt: Date | null
  online: boolean
}

export type Thread = {
  person: DirectoryEntry
  messages: ChatMessage[]
  seenAt: Date | null
  online: boolean
}

type MessageWire = { id: string; sender: string; text: string; sent_at: string }

type ContactWire = {
  person: Parameters<typeof toEntry>[0]
  unread: number
  last_text: string
  last_at: string | null
  seen_at: string | null
  online: boolean
}

type ThreadWire = {
  person: Parameters<typeof toEntry>[0]
  messages: MessageWire[]
  seen_at: string | null
  online: boolean
}

function toMessage(wire: MessageWire): ChatMessage {
  return {
    id: wire.id,
    sender: wire.sender,
    text: wire.text,
    sentAt: date(wire.sent_at) ?? new Date(),
  }
}

function toContact(wire: ContactWire): Contact {
  return {
    person: toEntry(wire.person),
    unread: wire.unread,
    lastText: wire.last_text,
    lastAt: date(wire.last_at),
    seenAt: date(wire.seen_at),
    online: wire.online,
  }
}

function toThread(wire: ThreadWire): Thread {
  return {
    person: toEntry(wire.person),
    messages: wire.messages.map(toMessage),
    seenAt: date(wire.seen_at),
    online: wire.online,
  }
}

/* ------------------------------------------------------------------ writes */

export async function addContact(uid: string): Promise<Contact> {
  const wire = await apiFetch<ContactWire>('/api/v1/chat/contacts', {
    method: 'POST',
    body: { uid },
  })
  return toContact(wire)
}

export async function sendMessage(uid: string, text: string): Promise<ChatMessage> {
  const wire = await apiFetch<MessageWire>(`/api/v1/chat/threads/${uid}/messages`, {
    method: 'POST',
    body: { text },
  })
  return toMessage(wire)
}

/**
 * Stamps the thread as seen and returns it as it now stands.
 *
 * One timestamp per participant is the whole read-receipt mechanism: a message
 * counts as seen once the other person's stamp is at or past it, so one write
 * covers everything that arrived before it.
 */
export async function markSeen(uid: string): Promise<Thread> {
  const wire = await apiFetch<ThreadWire>(`/api/v1/chat/threads/${uid}/seen`, {
    method: 'POST',
  })
  return toThread(wire)
}

/* ------------------------------------------------------------------- polls */

/** With the dock open, fast enough to feel live. */
const POLL_OPEN = 4_000
/** Closed, this only has to keep the unread badge roughly honest. */
const POLL_IDLE = 60_000
/** An open conversation is the one thing worth watching closely. */
const POLL_THREAD = 3_000

/**
 * Repeats `run` on an interval, and once immediately.
 *
 * setTimeout chained after each completion rather than setInterval: a slow
 * response should delay the next request, not stack up behind it. A hidden tab
 * is skipped entirely, which is what stops a backgrounded dock polling all day.
 */
function usePoll(run: () => Promise<void>, everyMs: number | null): void {
  const latest = useRef(run)

  useEffect(() => {
    latest.current = run
  }, [run])

  useEffect(() => {
    if (everyMs === null) return

    let live = true
    let timer = 0

    const tick = async () => {
      if (!live) return
      if (document.visibilityState === 'visible') {
        await latest.current().catch(() => {})
      }
      if (live) timer = window.setTimeout(tick, everyMs)
    }

    void tick()

    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [everyMs])
}

export type ContactsState = {
  contacts: Contact[]
  error: string | null
  reload: () => Promise<void>
}

/**
 * The contact list, polled.
 *
 * Listing also marks the caller present — presence is a heartbeat on the
 * server rather than a connection, so it survives a dropped request and a
 * closed laptop without a disconnect handler.
 */
export function useContacts(signedIn: boolean, dockOpen: boolean): ContactsState {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!signedIn) return
    try {
      const body = await apiFetch<{ contacts: ContactWire[] }>('/api/v1/chat/contacts')
      setContacts(body.contacts.map(toContact))
      setError(null)
    } catch (cause) {
      setError(readableApiError(cause))
    }
  }, [signedIn])

  usePoll(reload, signedIn ? (dockOpen ? POLL_OPEN : POLL_IDLE) : null)

  return { contacts, error, reload }
}

export type ThreadState = {
  thread: Thread | null
  error: string | null
  reload: () => Promise<void>
}

/**
 * One conversation, polled while it is on screen.
 *
 * The read stamp is written by the poll itself when something is unread, which
 * is what lets the other side see "seen" without this tab doing anything else.
 */
export function useThread(uid: string | null, me: string | null): ThreadState {
  // Keyed by the conversation it belongs to. Derived freshness rather than a
  // reset effect, so the previous thread's messages can never appear for a
  // frame under the new person's name.
  const [state, setState] = useState<{
    uid: string | null
    thread: Thread | null
    error: string | null
  }>({ uid: null, thread: null, error: null })

  const reload = useCallback(async () => {
    if (uid === null || me === null) return

    try {
      const wire = await apiFetch<ThreadWire>(`/api/v1/chat/threads/${uid}`)
      const next = toThread(wire)

      // Anything from them that we have not stamped yet. Marking seen returns
      // the thread, so this costs no extra round trip.
      const unseen = next.messages.some((message) => message.sender !== me)
      setState({ uid, thread: unseen ? await markSeen(uid) : next, error: null })
    } catch (cause) {
      setState({ uid, thread: null, error: readableApiError(cause) })
    }
  }, [uid, me])

  usePoll(reload, uid === null ? null : POLL_THREAD)

  const fresh = state.uid === uid

  return {
    thread: fresh ? state.thread : null,
    error: fresh ? state.error : null,
    reload,
  }
}

/**
 * A message's time: the clock for today, the weekday for this past week, and
 * a date for anything older.
 */
export function formatTime(at: Date): string {
  const age = Date.now() - at.getTime()

  if (age < 20 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(at)
  }

  if (age < 6 * 24 * 60 * 60 * 1000) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(at)
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(at)
}

/** The longer form used on the seen receipt, where the day matters. */
export function formatSeenTime(at: Date): string {
  const sameDay = new Date().toDateString() === at.toDateString()

  return new Intl.DateTimeFormat('en-US', {
    ...(sameDay ? {} : { month: 'short', day: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(at)
}
