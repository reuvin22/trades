import { useCallback, useState } from 'react'

/**
 * Group conversations — the list, and making one.
 *
 * **Not connected, and not a small job to connect.** One-to-one chat works
 * because a thread id is the two uids sorted and joined, which lets
 * `database.rules.json` read membership straight off the key and lets the API
 * derive the same symmetric key for both sides from an HMAC over that id. None
 * of that generalises:
 *
 * - A room's membership is not recoverable from its id, so the rules need a
 *   real member list to check against, written by something a member cannot
 *   forge.
 * - `GET /api/v1/chat/key/{uid}` derives a key for a pair. A room needs one key
 *   shared by n people that survives someone joining or leaving — a different
 *   scheme, not a wider version of this one.
 * - Creating a room is a write no client should make unilaterally, so it needs
 *   an endpoint, which is the one thing chat has deliberately avoided so far.
 *
 * So this holds the shape and says so plainly on screen. Rooms live in memory
 * for the session: not `localStorage`, because a room is shared state and
 * storing it per-browser would imply a durability that does not exist.
 */

/**
 * Somebody in a room.
 *
 * Carries the name as well as the uid. A uid is all a real membership record
 * would hold, but there is nothing here to resolve one against — the contact
 * list only knows people you already talk to one-to-one, and a room can hold
 * someone you do not.
 */
export type GroupMember = { uid: string; name: string }

export type ChatGroup = {
  id: string
  name: string
  /** Everyone in the room, the caller included. */
  members: GroupMember[]
  /** Last thing said, for the list row. Absent on a room nobody has used. */
  preview?: string
  age?: string
  unread: number
}

/** Rooms a trader is already in, to show the list holding something. */
const JOINED: ChatGroup[] = [
  {
    id: 'g-desk',
    name: 'Futures Desk',
    members: [
      { uid: 'g-1', name: 'Priya Raman' },
      { uid: 'g-2', name: 'Mia Torres' },
      { uid: 'g-3', name: 'Ade Fashola' },
      { uid: 'g-4', name: 'Luc Berger' },
    ],
    preview: 'Priya: size was the whole problem',
    age: '18m',
    unread: 3,
  },
  {
    id: 'g-cohort',
    name: 'Autumn cohort',
    members: [
      { uid: 'g-1', name: 'Priya Raman' },
      { uid: 'g-2', name: 'Mia Torres' },
      { uid: 'g-5', name: 'Daniel Okafor' },
      { uid: 'g-6', name: 'Jae Kwon' },
      { uid: 'g-7', name: 'Nadia Haddad' },
    ],
    preview: 'Daniel: reviews go out Friday',
    age: '2h',
    unread: 0,
  },
  {
    id: 'g-prop',
    name: 'Prop challenge',
    members: [
      { uid: 'g-3', name: 'Ade Fashola' },
      { uid: 'g-8', name: 'Marcus Bell' },
    ],
    preview: 'Ade: passed phase 2 🎉',
    age: '1d',
    unread: 0,
  },
]

/** Fixed hues, matched to how `data/messages.ts` colours a person. */
const TINTS = ['#6353e8', '#0d8ba4', '#b7791f', '#17914f', '#9333ea', '#c2410c']

export function groupTint(id: string): string {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0
  }
  return TINTS[hash % TINTS.length]
}

/** Up to two letters, from the first two words of the name. */
export function groupInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '#'
  const letters = words.length > 1 ? `${words[0][0]}${words[1][0]}` : words[0].slice(0, 2)
  return letters.toUpperCase()
}

export type GroupStore = {
  groups: ChatGroup[]
  create: (name: string, members: GroupMember[]) => ChatGroup
}

/**
 * The rooms this session knows about.
 *
 * State rather than a module singleton, because the dock is the only thing
 * that reads it and unmounting the dock should not strand a list somewhere
 * nothing can reach.
 */
export function useGroups(): GroupStore {
  const [groups, setGroups] = useState<ChatGroup[]>(JOINED)

  const create = useCallback((name: string, members: GroupMember[]): ChatGroup => {
    const room: ChatGroup = {
      id: `g-new-${Date.now()}`,
      name: name.trim(),
      members,
      unread: 0,
    }

    setGroups((current) => [room, ...current])
    return room
  }, [])

  return { groups, create }
}
