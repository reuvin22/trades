export type ChatMessage = {
  id: string
  /** 'them' is the contact; 'me' is the signed-in trader. */
  from: 'them' | 'me'
  text: string
  at: string
}

export type Contact = {
  id: string
  name: string
  role: string
  initials: string
  /** Avatar tint. Fixed hues rather than theme tokens, so a person keeps the
   *  same colour in either theme. */
  accent: string
  online: boolean
  unread: number
  messages: ChatMessage[]
}

/**
 * Seed conversations.
 *
 * Local for now, the same as notifications: the dock reads this array and
 * keeps anything typed during the session in component state. Swapping in a
 * real transport means replacing this file and the send handler.
 */
export const CONTACTS: Contact[] = [
  {
    id: 'coach',
    name: 'RagDex Coach',
    role: 'Your AI coach',
    initials: 'RC',
    accent: '#6353e8',
    online: true,
    unread: 1,
    messages: [
      {
        id: 'c1',
        from: 'them',
        text: 'Your last four sessions all opened with a loss inside the first ten minutes. Want to look at that together?',
        at: '09:12',
      },
      {
        id: 'c2',
        from: 'me',
        text: 'Yeah. I think I am forcing the open.',
        at: '09:14',
      },
      {
        id: 'c3',
        from: 'them',
        text: 'That matches the journal. Your first trade of the day averages -$180; everything after averages +$95. One rule for tomorrow: no entries before 09:45.',
        at: '09:15',
      },
    ],
  },
  {
    id: 'mara',
    name: 'Mara Ellis',
    role: 'Accountability partner',
    initials: 'ME',
    accent: '#17914f',
    online: true,
    unread: 2,
    messages: [
      {
        id: 'm1',
        from: 'them',
        text: 'Did you hold the runner this time or cut it at 1R again?',
        at: '08:40',
      },
      {
        id: 'm2',
        from: 'me',
        text: 'Held it. Closed at 2.4R.',
        at: '08:52',
      },
      {
        id: 'm3',
        from: 'them',
        text: 'There it is. That is the whole edge, right there.',
        at: '08:53',
      },
    ],
  },
  {
    id: 'desk',
    name: 'Desk Support',
    role: 'RagDex team',
    initials: 'DS',
    accent: '#0d8ba4',
    online: false,
    unread: 0,
    messages: [
      {
        id: 'd1',
        from: 'me',
        text: 'My IBKR import skipped three fills from Tuesday.',
        at: 'Mon',
      },
      {
        id: 'd2',
        from: 'them',
        text: 'Found them — they came through as partials. Re-running the sync now, they should appear in your journal within the hour.',
        at: 'Mon',
      },
    ],
  },
  {
    id: 'tobi',
    name: 'Tobi Adeyemi',
    role: 'Study group',
    initials: 'TA',
    accent: '#b7791f',
    online: false,
    unread: 0,
    messages: [
      {
        id: 't1',
        from: 'them',
        text: 'Posting my week in the group tonight. Bring your worst trade, not your best.',
        at: 'Sun',
      },
    ],
  },
]
