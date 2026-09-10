export type JournalTrade = {
  id: string
  ticker: string
  side: 'Long' | 'Short'
  date: string
  time: string
  setup: string
  broker: string
  strategy: string
  result: 'Winner' | 'Loser'
  pl: number
}

export const JOURNAL_FILTERS = [
  { label: 'Strategy', options: ['All Strategies', 'VWAP Bounce', 'Bull Flag', 'Overextended'] },
  { label: 'Setup', options: ['All Setups', 'Breakout', 'Mean Reversion', 'Continuation'] },
  { label: 'Result', options: ['All Results', 'Winner', 'Loser'] },
]

export const TOTAL_TRADES = 42

export const JOURNAL_TRADES: JournalTrade[] = [
  {
    id: 'nvda-1024',
    ticker: 'NVDA',
    side: 'Long',
    date: 'Oct 24,',
    time: '09:45',
    setup: 'Breakout',
    broker: 'Interactive Brokers',
    strategy: 'VWAP Bounce',
    result: 'Winner',
    pl: 1420,
  },
  {
    id: 'tsla-1024',
    ticker: 'TSLA',
    side: 'Short',
    date: 'Oct 24,',
    time: '11:15',
    setup: 'Mean Reversion',
    broker: 'Charles Schwab',
    strategy: 'Overextended',
    result: 'Loser',
    pl: -450,
  },
  {
    id: 'aapl-1023',
    ticker: 'AAPL',
    side: 'Long',
    date: 'Oct 23,',
    time: '14:30',
    setup: 'Continuation',
    broker: 'Interactive Brokers',
    strategy: 'Bull Flag',
    result: 'Winner',
    pl: 890,
  },
]
