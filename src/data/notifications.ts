export type NotificationKind = 'fill' | 'risk' | 'coach' | 'system'

export type Notification = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  age: string
  unread: boolean
}

/**
 * Seed notifications.
 *
 * These are local: nothing writes notifications yet, so the bell reads from
 * here and "read" state lives in the component for the session. When a real
 * source arrives it replaces this array and nothing else has to change.
 */
export const NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    kind: 'risk',
    title: 'Daily loss limit approaching',
    body: 'You are 78% of the way to your -$500 stop for the day, with two positions still open.',
    age: '4m',
    unread: true,
  },
  {
    id: 'n2',
    kind: 'fill',
    title: 'NVDA closed',
    body: 'Exit filled at $482.10 for +$1,240. Logged against your London Breakout setup.',
    age: '26m',
    unread: true,
  },
  {
    id: 'n3',
    kind: 'coach',
    title: 'The coach spotted a pattern',
    body: 'Three of your last four losses came in the hour after a loss. Worth a read.',
    age: '2h',
    unread: true,
  },
  {
    id: 'n4',
    kind: 'system',
    title: 'Broker reconnected',
    body: 'Your Interactive Brokers link is healthy again after a 6 minute outage.',
    age: 'Yesterday',
    unread: false,
  },
  {
    id: 'n5',
    kind: 'fill',
    title: 'EURUSD stopped out',
    body: 'Stop hit at 1.0842 for -$310. Your plan called for this exit — no rule broken.',
    age: 'Yesterday',
    unread: false,
  },
]
