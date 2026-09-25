/**
 * The community feed, as fixtures.
 *
 * Presentation data only, and deliberately not fetched: there is no community
 * endpoint yet. The shapes here are what the screen needs, so when the API
 * arrives it has something concrete to match rather than a wish — and the
 * page can keep its markup and swap where the array comes from.
 *
 * Nothing here touches the network. Attachments are numbers the page draws as
 * an SVG, not image URLs: the client has exactly one outbound destination and
 * a fixture is not a reason to add a second.
 */

import type { AccountType } from '../lib/profile'

export type CommunityPerson = {
  uid: string
  name: string
  email: string
  accountType: AccountType
  /** What they trade, in a few words. Shown under the name. */
  role: string
  online: boolean
}

export type PostComment = {
  id: string
  authorUid: string
  text: string
  age: string
}

/** A drawn attachment: an equity curve, not a screenshot. */
export type PostChart = {
  label: string
  /** Normalised 0–1 samples, oldest first. The page scales them to the box. */
  points: number[]
  delta: string
  positive: boolean
}

export type CommunityPost = {
  id: string
  authorUid: string
  age: string
  text: string
  tags: string[]
  chart?: PostChart
  likes: number
  /** Whether the signed-in reader has already liked it. */
  liked: boolean
  comments: PostComment[]
  /** Which rail filter this post belongs to, beyond the feed itself. */
  channel: 'following' | 'groups'
  /** The group it was posted in, when it was posted in one. */
  group?: string
}

export const PEOPLE: CommunityPerson[] = [
  {
    uid: 'p-mia',
    name: 'Mia Torres',
    email: 'mia.torres@example.com',
    accountType: 'student',
    role: 'Indices · London open',
    online: true,
  },
  {
    uid: 'p-dan',
    name: 'Daniel Okafor',
    email: 'd.okafor@example.com',
    accountType: 'coach',
    role: 'Coach · Risk and process',
    online: true,
  },
  {
    uid: 'p-sam',
    name: 'Sam Cole',
    email: 'sam.cole@example.com',
    accountType: 'individual',
    role: 'FX majors · swing',
    online: false,
  },
  {
    uid: 'p-priya',
    name: 'Priya Raman',
    email: 'priya.r@example.com',
    accountType: 'student',
    role: 'Futures · NQ scalps',
    online: true,
  },
  {
    uid: 'p-luc',
    name: 'Luc Berger',
    email: 'luc.berger@example.com',
    accountType: 'individual',
    role: 'Crypto perps',
    online: false,
  },
  {
    uid: 'p-ade',
    name: 'Ade Fashola',
    email: 'ade.f@example.com',
    accountType: 'student',
    role: 'Prop challenge, phase 2',
    online: true,
  },
]

export const PERSON_BY_UID: Record<string, CommunityPerson> = Object.fromEntries(
  PEOPLE.map((person) => [person.uid, person]),
)

export const POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    authorUid: 'p-dan',
    age: '40m',
    channel: 'following',
    text: "Reminder for anyone in the challenge group: a rule you break once is a rule you don't have.\n\nIf you moved your stop this week, log it as a rule break even though the trade closed green. The number that matters is how often you followed your own process, not how often it paid.",
    tags: ['discipline', 'risk'],
    likes: 34,
    liked: false,
    comments: [
      {
        id: 'c-1',
        authorUid: 'p-ade',
        text: 'Needed this one. Logged two breaks I was quietly rounding off.',
        age: '22m',
      },
    ],
  },
  {
    id: 'post-2',
    authorUid: 'p-mia',
    age: '2h',
    channel: 'following',
    text: 'Fourth green week on the indices book. Nothing clever — I stopped taking the 09:45 continuation and the whole curve changed shape.',
    tags: ['NAS100', 'london-open'],
    chart: {
      label: 'Equity · last 30 sessions',
      points: [
        0.18, 0.2, 0.15, 0.24, 0.29, 0.26, 0.33, 0.31, 0.38, 0.42, 0.39, 0.47, 0.52,
        0.5, 0.55, 0.61, 0.58, 0.64, 0.69, 0.66, 0.72, 0.78, 0.75, 0.81, 0.86, 0.83,
        0.88, 0.92, 0.9, 0.96,
      ],
      delta: '+18.4%',
      positive: true,
    },
    likes: 51,
    liked: true,
    comments: [
      {
        id: 'c-2',
        authorUid: 'p-priya',
        text: 'The 09:45 is a tax. Took me a year to stop paying it.',
        age: '1h',
      },
      {
        id: 'c-3',
        authorUid: 'p-sam',
        text: 'What are you using for the cut-off — time or the opening range?',
        age: '48m',
      },
    ],
  },
  {
    id: 'post-3',
    authorUid: 'p-priya',
    age: '5h',
    channel: 'groups',
    group: 'Futures Desk',
    text: 'Drawdown week. Posting it because the wins get posted and the other half does not.\n\nThree of the five losses were size, not direction. Same setup at half the risk and this is a flat week instead of a red one.',
    tags: ['NQ', 'position-sizing'],
    chart: {
      label: 'Equity · last 30 sessions',
      points: [
        0.82, 0.85, 0.8, 0.84, 0.78, 0.81, 0.74, 0.7, 0.73, 0.66, 0.62, 0.65, 0.58,
        0.55, 0.59, 0.52, 0.48, 0.51, 0.45, 0.42, 0.46, 0.39, 0.36, 0.4, 0.34, 0.3,
        0.33, 0.28, 0.25, 0.27,
      ],
      delta: '−9.1%',
      positive: false,
    },
    likes: 78,
    liked: false,
    comments: [
      {
        id: 'c-4',
        authorUid: 'p-dan',
        text: 'This is the most useful post on here this week. Size is the only variable most people never review.',
        age: '3h',
      },
    ],
  },
  {
    id: 'post-4',
    authorUid: 'p-luc',
    age: '1d',
    channel: 'groups',
    group: 'Crypto Perps',
    text: 'Funding flipped negative on the majors overnight and my whole thesis for the week is now a carry trade I did not sign up for. Flattening and re-reading tomorrow.',
    tags: ['funding', 'perps'],
    likes: 12,
    liked: false,
    comments: [],
  },
  {
    id: 'post-5',
    authorUid: 'p-sam',
    age: '1d',
    channel: 'following',
    text: 'Question for the room: does anyone actually review their journal weekly, or is it a thing we all say we do? Looking for what a real review looks like rather than the version in the course.',
    tags: ['journaling'],
    likes: 29,
    liked: false,
    comments: [
      {
        id: 'c-5',
        authorUid: 'p-mia',
        text: 'Friday, 20 minutes, three questions: what did I plan, what did I do, what was the gap.',
        age: '22h',
      },
    ],
  },
]

export type FeedFilter = {
  id: 'feed' | 'following' | 'groups' | 'saved'
  label: string
}

export const FEED_FILTERS: FeedFilter[] = [
  { id: 'feed', label: 'All posts' },
  { id: 'following', label: 'Following' },
  { id: 'groups', label: 'Groups' },
  { id: 'saved', label: 'Saved' },
]

export type CommunityGroup = {
  id: string
  name: string
  members: number
}

export const GROUPS: CommunityGroup[] = [
  { id: 'g-futures', name: 'Futures Desk', members: 412 },
  { id: 'g-crypto', name: 'Crypto Perps', members: 268 },
  { id: 'g-prop', name: 'Prop Challenge', members: 903 },
]

export type RecentChat = {
  uid: string
  preview: string
  age: string
  unread: number
}

/**
 * The conversations rail.
 *
 * Previews only, and fixtures at that. Real messages are end-to-end encrypted
 * and read straight from the Realtime Database by `lib/chat.ts` — they could
 * not be served from here even if there were an endpoint for it.
 */
export const RECENT_CHATS: RecentChat[] = [
  { uid: 'p-dan', preview: 'Sent you the review notes', age: '12m', unread: 2 },
  { uid: 'p-mia', preview: 'That cut-off is time based', age: '1h', unread: 0 },
  { uid: 'p-ade', preview: 'Passed phase 1 🎉', age: '4h', unread: 0 },
  { uid: 'p-priya', preview: 'Can you look at Thursday?', age: '1d', unread: 0 },
]
