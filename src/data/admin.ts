export type ActivityKind = 'signup' | 'error' | 'upgrade' | 'audit'

export type Activity = {
  id: string
  kind: ActivityKind
  title: string
  body: string
  highlight?: string
  action?: string
  age: string
}

export type Broker = {
  id: string
  name: string
  protocol: string
  initials: string
  accent: string
  health: 'healthy' | 'degraded'
  latency: string
  successRate: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const POINTS_PER_MONTH = 10
const REVENUE_KEYFRAMES: [number, number][] = [
  [0, 120_000],
  [6, 1_100_000],
  [12, 380_000],
  [18, 1_050_000],
  [24, 430_000],
  [30, 820_000],
  [36, 600_000],
  [42, 1_020_000],
  [46, 700_000],
  [52, 1_204_500],
  [56, 760_000],
  [59, 1_150_000],
]

/** The session the dashboard tooltip is pinned to. */
export const REVENUE_MARKER = 52

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function buildRevenueSeries(): number[] {
  const series: number[] = []

  for (let index = 0; index < MONTHS.length * POINTS_PER_MONTH; index++) {
    let segment = 0
    while (
      segment < REVENUE_KEYFRAMES.length - 2 &&
      REVENUE_KEYFRAMES[segment + 1][0] < index
    ) {
      segment++
    }

    const [fromIndex, fromValue] = REVENUE_KEYFRAMES[segment]
    const [toIndex, toValue] = REVENUE_KEYFRAMES[segment + 1]
    const t = smoothstep((index - fromIndex) / (toIndex - fromIndex))
    series.push(fromValue + (toValue - fromValue) * t)
  }

  return series
}

export const REVENUE_SERIES = buildRevenueSeries()
export const REVENUE_MONTHS = MONTHS
export const REVENUE_MARKER_LABEL = 'May 24'

/** Bar heights for the stat-card sparklines, as a share of the tallest bar. */
export const USER_BARS = [0.34, 0.28, 0.46, 0.4, 0.58, 0.52, 0.72, 0.66, 0.88, 1]
export const REVENUE_BARS = [0.3, 0.44, 0.38, 0.56, 0.5, 0.68, 0.62, 0.8, 0.74, 0.94]

export const PLATFORM_ACTIVITY: Activity[] = [
  {
    id: 'signup',
    kind: 'signup',
    title: 'New User Joined',
    body: 'David S. signed up via Enterprise Plan invitation.',
    age: '2m ago',
  },
  {
    id: 'sync',
    kind: 'error',
    title: 'Broker Sync Error',
    body: 'Handshake failed with Tradovate (Shard-2). Retrying in 30s.',
    action: 'View Logs',
    age: '14m ago',
  },
  {
    id: 'upgrade',
    kind: 'upgrade',
    title: 'Subscription Upgraded',
    body: 'Vertex Trading upgraded to Pro Max Tier.',
    age: '45m ago',
  },
  {
    id: 'audit',
    kind: 'audit',
    title: 'Security Audit',
    body: 'Automated vulnerability scan completed.',
    highlight: '0 Critical Threats',
    age: '2h ago',
  },
]

export const BROKERS: Broker[] = [
  {
    id: 'ibkr',
    name: 'Int.Brokers',
    protocol: 'API v4.2.1',
    initials: 'IB',
    accent: '#d23c3c',
    health: 'healthy',
    latency: '42ms',
    successRate: '99.9%',
  },
  {
    id: 'tradovate',
    name: 'Tradovate',
    protocol: 'WebSocketConn',
    initials: 'TV',
    accent: '#2e3550',
    health: 'degraded',
    latency: '890ms',
    successRate: '92.4%',
  },
  {
    id: 'binance',
    name: 'Binance',
    protocol: 'REST API',
    initials: 'BN',
    accent: '#f0b90b',
    health: 'healthy',
    latency: '112ms',
    successRate: '100%',
  },
]

export const revenueLabel = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function compactRevenue(value: number) {
  if (value === 0) return '0'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  return `${Math.round(value / 1000)}k`
}
