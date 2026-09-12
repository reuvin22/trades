import { useEffect, useMemo, useState } from 'react'
import { signInWithCustomToken } from 'firebase/auth'
import {
  limitToLast,
  onDisconnect,
  onValue,
  push,
  query,
  ref,
  serverTimestamp,
  set,
  update,
} from 'firebase/database'
import { apiFetch, readableApiError } from './api'
import { auth, rtdb } from './firebase'
import type { AuthUser } from './useAuth'

/**
 * Chat, on the Realtime Database, read straight from the browser.
 *
 * The one feature that does not go through the API, for one reason: speed. A
 * message has to land in well under a second, and a request proxied through a
 * free-tier instance cannot do that — polling gave ten seconds, and even
 * server-sent events added a hop and a cold start. RTDB gives the browser a
 * websocket, so a message arrives as fast as Firebase can push it, and a
 * message you send appears instantly because the SDK echoes it locally before
 * the server has acknowledged it.
 *
 * The session cookie is still the source of truth. `connect` exchanges it for a
 * Firebase custom token at GET /api/v1/chat/token, minted only for the uid the
 * cookie already names, and what that token can reach is bounded by
 * database.rules.json — chat, and nothing else. The journal stays in Firestore,
 * which denies every direct client read.
 *
 *   /profiles/{uid}                   name, email, photo
 *   /contacts/{uid}/{otherUid}        true
 *   /threads/{threadId}/messages/{id} { from, text, at }
 *   /threads/{threadId}/reads/{uid}   when they last looked
 *   /status/{uid}                     { online, at }
 */

/** How much history a conversation keeps in memory. */
const HISTORY = 100

export type ChatMessage = {
  id: string
  /** The sender's uid. Compared against your own to pick a side. */
  sender: string
  /** Empty once deleted — the text is cleared, not merely hidden. */
  text: string
  sentAt: Date
  /** Set when the sender changed the text. Drives the 'edited' label. */
  editedAt: Date | null
  /** Set when the sender removed it. The message stays, as a tombstone. */
  deletedAt: Date | null
}

export type Person = {
  uid: string
  name: string
  email: string
  photoURL: string
}

export type Contact = {
  person: Person
  messages: ChatMessage[]
  unread: number
  lastText: string
  lastAt: Date | null
  /** When they last had this thread open. What makes a sent message seen. */
  seenAt: Date | null
  online: boolean
}

/**
 * The conversation between two people, whoever asks.
 *
 * Sorted so both sides derive the same id, which is what lets the security
 * rules read membership straight off the key.
 */
export function threadIdFor(a: string, b: string): string {
  return [a, b].sort().join('_')
}

function toDate(value: unknown): Date | null {
  return typeof value === 'number' ? new Date(value) : null
}

function toPerson(uid: string, raw: unknown): Person {
  const data = (raw ?? {}) as Record<string, unknown>
  const email = String(data.email ?? '')

  return {
    uid,
    name: String(data.name ?? '') || email.split('@')[0] || 'Trader',
    email,
    photoURL: String(data.photoURL ?? ''),
  }
}

/* --------------------------------------------------------------- presence */

/**
 * How often an online tab refreshes its stamp, and how long a stamp stays
 * believable.
 *
 * `onDisconnect` covers the ordinary cases — a closed tab, a dropped network —
 * but it cannot cover every one. A write that never lands, a session signed out
 * before the offline write could be authorised, a server that misses the socket
 * close: any of those leave a record saying `online: true` forever, and the
 * only thing that can heal it is the record going stale on its own.
 *
 * So presence is a heartbeat as well as a flag. Someone counts as online when
 * they claim to be *and* said so recently.
 */
const HEARTBEAT_MS = 25_000
const PRESENCE_STALE_MS = 70_000

function isOnline(raw: unknown): boolean {
  const status = (raw ?? {}) as { online?: unknown; at?: unknown }
  if (status.online !== true) return false

  const at = typeof status.at === 'number' ? status.at : 0
  return Date.now() - at < PRESENCE_STALE_MS
}

/**
 * Mark the signed-in trader offline, now.
 *
 * Exported because signing out has to do this *before* dropping the Firebase
 * session: once that is gone the write is unauthorised, and the record is left
 * claiming they are still here.
 */
export async function goOffline(uid: string): Promise<void> {
  if (!rtdb) return
  await set(ref(rtdb, `status/${uid}`), {
    online: false,
    at: serverTimestamp(),
  }).catch(() => {})
}

/* ------------------------------------------------------------- connection */

/**
 * Trade the session cookie for a Firebase credential, then publish who we are.
 *
 * The profile write is what lets everyone else render a name and avatar off
 * the same websocket, instead of asking the API about each contact.
 */
async function connect(user: AuthUser): Promise<void> {
  if (!auth || !rtdb) throw new Error('Live chat is not configured in this build.')

  if (auth.currentUser?.uid !== user.uid) {
    const { token } = await apiFetch<{ token: string }>('/api/v1/chat/token')
    await signInWithCustomToken(auth, token)
  }

  await set(ref(rtdb, `profiles/${user.uid}`), {
    name: user.displayName || user.email?.split('@')[0] || 'Trader',
    email: user.email ?? '',
    photoURL: user.photoURL,
  })
}

export type Connection = {
  ready: boolean
  error: string | null
}

/**
 * Holds the live connection open for as long as someone is signed in.
 *
 * Presence rides on it. `onDisconnect` is registered with the server *before*
 * going online, so the offline write lands even when the tab dies without
 * warning — a crash, a lost network, a killed process. It is re-registered on
 * every reconnect, because the server drops the handler once it fires.
 */
export function useChatConnection(user: AuthUser | null): Connection {
  const [state, setState] = useState<Connection>({ ready: false, error: null })

  useEffect(() => {
    if (!user || !rtdb) return

    const database = rtdb
    const mine = ref(database, `status/${user.uid}`)

    let live = true
    let stopPresence = () => {}
    let heartbeat = 0

    const announce = () =>
      set(mine, { online: true, at: serverTimestamp() }).catch(() => {})

    connect(user)
      .then(() => {
        if (!live) return
        setState({ ready: true, error: null })

        stopPresence = onValue(ref(database, '.info/connected'), (snapshot) => {
          if (snapshot.val() !== true) return

          // Registered before going online, so the offline write lands even
          // when the tab dies without warning. Re-registered on every
          // reconnect, because the server drops the handler once it fires.
          onDisconnect(mine)
            .set({ online: false, at: serverTimestamp() })
            .then(announce)
            .catch(() => {})
        })

        // Refresh the stamp while the tab lives, so a record that somehow
        // survives as 'online' goes stale instead of lying forever.
        heartbeat = window.setInterval(announce, HEARTBEAT_MS)
      })
      .catch((cause: unknown) => {
        if (live) setState({ ready: false, error: readableApiError(cause) })
      })

    return () => {
      live = false
      stopPresence()
      window.clearInterval(heartbeat)
      // Leaving the app is going offline, the same as closing the tab.
      set(mine, { online: false, at: serverTimestamp() }).catch(() => {})
    }
  }, [user])

  return state
}

/* ------------------------------------------------------------------ writes */

/**
 * Put two people in each other's contact lists.
 *
 * Both sides, in one write: a conversation nobody can see from the other end
 * is not a conversation. The rules allow the second half precisely because the
 * only foreign key you can create is your own.
 */
export async function addContact(me: string, them: string): Promise<void> {
  if (!rtdb) throw new Error('Live chat is not configured.')

  await update(ref(rtdb), {
    [`contacts/${me}/${them}`]: true,
    [`contacts/${them}/${me}`]: true,
  })
}

/** Appends a message. The server stamps the time; the client never does. */
export async function sendMessage(me: string, them: string, text: string): Promise<void> {
  if (!rtdb) throw new Error('Live chat is not configured.')

  const trimmed = text.trim()
  if (trimmed === '') return

  await push(ref(rtdb, `threads/${threadIdFor(me, them)}/messages`), {
    from: me,
    text: trimmed,
    at: serverTimestamp(),
  })
}

/**
 * Change what a message says.
 *
 * Only the sender can, and only the text moves: the rules pin `from` and `at`
 * to their original values, so an edit cannot rewrite who spoke or when.
 * `editedAt` is stamped by the server, which is what makes the label on the
 * bubble something the reader can trust.
 */
export async function editMessage(
  me: string,
  them: string,
  messageId: string,
  text: string,
): Promise<void> {
  if (!rtdb) throw new Error('Live chat is not configured.')

  const trimmed = text.trim()
  if (trimmed === '') return

  await update(ref(rtdb, `threads/${threadIdFor(me, them)}/messages/${messageId}`), {
    text: trimmed,
    editedAt: serverTimestamp(),
  })
}

/**
 * Delete a message, leaving a tombstone where it stood.
 *
 * A soft delete on purpose. Removing the node would close the gap and quietly
 * rewrite the conversation for the other person; leaving a marker is honest
 * about what happened. The text itself is cleared rather than hidden, so it is
 * genuinely gone rather than one rule change away from being readable again.
 */
export async function deleteMessage(
  me: string,
  them: string,
  messageId: string,
): Promise<void> {
  if (!rtdb) throw new Error('Live chat is not configured.')

  await update(ref(rtdb, `threads/${threadIdFor(me, them)}/messages/${messageId}`), {
    text: '',
    deletedAt: serverTimestamp(),
  })
}

/**
 * Stamps the thread as seen, now.
 *
 * One timestamp per participant is the whole read-receipt mechanism: a message
 * counts as seen once the other person's stamp is at or past it, so a single
 * write covers everything that arrived before it.
 */
export async function markSeen(me: string, them: string): Promise<void> {
  if (!rtdb) return

  await set(ref(rtdb, `threads/${threadIdFor(me, them)}/reads/${me}`), serverTimestamp())
}

/* --------------------------------------------------------------- listeners */

type ThreadState = {
  messages: ChatMessage[]
  reads: Record<string, number>
}

const EMPTY: ThreadState = { messages: [], reads: {} }

/**
 * Everyone the signed-in trader talks to, live.
 *
 * Four subscriptions per contact — messages, read markers, profile, presence —
 * on one shared websocket. That is not a request each: the cost is the
 * connection, which is already open, so opening a conversation is instant
 * because its messages are already here.
 */
export function useContacts(user: AuthUser | null, ready: boolean): Contact[] {
  const me = user?.uid ?? null

  const [uids, setUids] = useState<string[]>([])
  const [threads, setThreads] = useState<Record<string, ThreadState>>({})
  const [people, setPeople] = useState<Record<string, Person>>({})
  const [status, setStatus] = useState<Record<string, unknown>>({})

  /*
   * A presence record can go stale without anything changing in the database,
   * so nothing would re-render to notice. This ticks well inside the staleness
   * window, which is what turns "claimed online an hour ago" into "offline"
   * without waiting for the other tab to say anything.
   */
  const [, tick] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), HEARTBEAT_MS)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!rtdb || !me || !ready) return

    return onValue(ref(rtdb, `contacts/${me}`), (snapshot) => {
      const value = (snapshot.val() ?? {}) as Record<string, boolean>
      setUids(Object.keys(value).filter((uid) => value[uid]))
    })
  }, [me, ready])

  // Joined into a string: a fresh array identity on every render would tear
  // every subscription down and rebuild it each time.
  const watching = useMemo(() => [...uids].sort().join(','), [uids])

  useEffect(() => {
    if (!rtdb || !me || !ready || watching === '') return

    const database = rtdb

    const stops = watching.split(',').flatMap((them) => {
      const threadId = threadIdFor(me, them)

      return [
        onValue(
          query(ref(database, `threads/${threadId}/messages`), limitToLast(HISTORY)),
          (snapshot) => {
            const messages: ChatMessage[] = []
            // forEach, not Object.entries: this is the only read that preserves
            // the ordering the query just applied.
            snapshot.forEach((child) => {
              const value = (child.val() ?? {}) as Record<string, unknown>
              messages.push({
                id: child.key ?? '',
                sender: String(value.from ?? ''),
                text: String(value.text ?? ''),
                // A message echoed locally before the server answers has no
                // timestamp yet. Treat it as just-now so it sorts last — this
                // is what makes your own message appear the instant you send.
                sentAt: toDate(value.at) ?? new Date(),
                editedAt: toDate(value.editedAt),
                deletedAt: toDate(value.deletedAt),
              })
            })

            setThreads((current) => ({
              ...current,
              [them]: { ...(current[them] ?? EMPTY), messages },
            }))
          },
        ),

        onValue(ref(database, `threads/${threadId}/reads`), (snapshot) => {
          const reads = (snapshot.val() ?? {}) as Record<string, number>
          setThreads((current) => ({
            ...current,
            [them]: { ...(current[them] ?? EMPTY), reads },
          }))
        }),

        onValue(ref(database, `profiles/${them}`), (snapshot) => {
          setPeople((current) => ({ ...current, [them]: toPerson(them, snapshot.val()) }))
        }),

        // The whole node, not just the flag: staleness needs the timestamp.
        onValue(ref(database, `status/${them}`), (snapshot) => {
          setStatus((current) => ({ ...current, [them]: snapshot.val() }))
        }),
      ]
    })

    return () => stops.forEach((stop) => stop())
  }, [me, ready, watching])

  /** Newest conversation first, so whoever just wrote rises to the top. */
  return useMemo(() => {
    if (me === null) return []

    const built: Contact[] = uids.map((uid) => {
      const thread = threads[uid] ?? EMPTY
      const last = thread.messages[thread.messages.length - 1]
      const seenByMe = thread.reads[me] ?? 0

      return {
        person: people[uid] ?? toPerson(uid, null),
        messages: thread.messages,
        unread: thread.messages.filter(
          (message) => message.sender !== me && message.sentAt.getTime() > seenByMe,
        ).length,
        lastText: last?.deletedAt ? 'Message deleted' : (last?.text ?? ''),
        lastAt: last?.sentAt ?? null,
        seenAt: toDate(thread.reads[uid]),
        online: isOnline(status[uid]),
      }
    })

    return built.sort((left, right) => {
      const gap = (right.lastAt?.getTime() ?? 0) - (left.lastAt?.getTime() ?? 0)
      return gap !== 0 ? gap : left.person.name.localeCompare(right.person.name)
    })
  }, [me, uids, threads, people, status])
}

/* ---------------------------------------------------------------- display */

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
