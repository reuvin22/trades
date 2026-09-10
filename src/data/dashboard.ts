export type EquityPoint = {
  day: number
  date: Date
  value: number
}

export type Range = '90D' | '30D' | '7D'

export type Trade = {
  id: string
  ticker: string
  company: string
  setup: string
  side: 'Long' | 'Short'
  entry: number
  exit: number | null
  pl: number
  status: 'open' | 'closed'
}

/** Day 90 of the curve — every other date is derived backwards from here. */
const LAST_SESSION = new Date(2023, 9, 24)

/** Shape of the equity curve as (day, account value) control points. */
const KEYFRAMES: [day: number, value: number][] = [
  [0, 10000],
  [8, 10120],
  [16, 10880],
  [22, 11390],
  [29, 11445],
  [37, 11075],
  [45, 11135],
  [56, 11690],
  [66, 12130],
  [78, 12385],
  [90, 12450.2],
]

/** Deterministic ±1 noise so the curve reads as real sessions, not a formula. */
function jitter(day: number) {
  const n = Math.sin(day * 12.9898) * 43758.5453
  return n - Math.floor(n) - 0.5
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function buildEquityCurve(): EquityPoint[] {
  const points: EquityPoint[] = []

  for (let day = 0; day <= 90; day++) {
    let segment = 0
    while (segment < KEYFRAMES.length - 2 && KEYFRAMES[segment + 1][0] < day) {
      segment++
    }

    const [fromDay, fromValue] = KEYFRAMES[segment]
    const [toDay, toValue] = KEYFRAMES[segment + 1]
    const t = smoothstep((day - fromDay) / (toDay - fromDay))
    const eased = fromValue + (toValue - fromValue) * t

    const date = new Date(LAST_SESSION)
    date.setDate(date.getDate() - (90 - day))

    points.push({
      day: day + 1,
      date,
      // Endpoints stay exact so the headline figure matches the curve.
      value: day === 90 ? toValue : eased + jitter(day) * 34,
    })
  }

  return points
}

export const EQUITY_CURVE = buildEquityCurve()

export const RANGE_DAYS: Record<Range, number> = {
  '90D': 90,
  '30D': 30,
  '7D': 7,
}

export function equityForRange(range: Range): EquityPoint[] {
  return EQUITY_CURVE.slice(-RANGE_DAYS[range] - 1)
}

/**
 * 16 weeks of daily outcomes, most recent week last. `null` marks a
 * non-trading day so the heatmap keeps its weekday rows aligned.
 */
export function buildPerformanceCalendar(): (number | null)[] {
  const cells: (number | null)[] = []

  for (let week = 0; week < 16; week++) {
    for (let weekday = 0; weekday < 7; weekday++) {
      if (weekday > 4) {
        cells.push(null)
        continue
      }
      const seed = Math.sin((week * 7 + weekday) * 78.233) * 43758.5453
      const noise = seed - Math.floor(seed)
      // Skew positive — the account is up over the window.
      cells.push(noise < 0.12 ? null : (noise - 0.42) * 2)
    }
  }

  return cells
}

export const PERFORMANCE_CALENDAR = buildPerformanceCalendar()

export const RECENT_TRADES: Trade[] = [
  {
    id: 'nvda-1024',
    ticker: 'NVDA',
    company: 'NVIDIA Corp',
    setup: 'VWAP Reclaim',
    side: 'Long',
    entry: 482.1,
    exit: 491.5,
    pl: 1410,
    status: 'closed',
  },
  {
    id: 'tsla-1024',
    ticker: 'TSLA',
    company: 'Tesla, Inc',
    setup: 'Gap & Go',
    side: 'Short',
    entry: 242.15,
    exit: 245.5,
    pl: -335,
    status: 'closed',
  },
  {
    id: 'spy-1024',
    ticker: 'SPY',
    company: 'S&P 500 ETF',
    setup: 'Breakout',
    side: 'Long',
    entry: 450.02,
    exit: null,
    pl: 820.4,
    status: 'open',
  },
]

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const compactCurrency = (value: number) =>
  value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value.toFixed(0)}`

export const signed = (value: number) =>
  `${value >= 0 ? '+' : '-'}${currency.format(Math.abs(value))}`

export const shortDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
