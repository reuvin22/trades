export type CurvePoint = {
  index: number
  date: Date
  realized: number
  benchmark: number
}

export type LogEntry = {
  id: string
  ticker: string
  side: 'Long' | 'Short'
  strategy: string
  riskReward: string
  changePct: number
  win: boolean
}

export type EdgeSlice = {
  label: string
  share: number
  color: string
}

const SESSION_COUNT = 71
const FIRST_SESSION = new Date(2023, 7, 1)

/** (session index, account value) control points for the realized curve. */
const REALIZED_KEYFRAMES: [number, number][] = [
  [0, 8980],
  [10, 8890],
  [20, 9060],
  [30, 9010],
  [38, 9420],
  [46, 9880],
  [54, 10310],
  [62, 10810],
  [70, 11060],
]

const BENCHMARK_KEYFRAMES: [number, number][] = [
  [0, 8980],
  [18, 9040],
  [34, 9210],
  [50, 9380],
  [70, 9760],
]

function noise(index: number, salt: number) {
  const n = Math.sin((index + 1) * 91.7 + salt * 37.3) * 43758.5453
  return n - Math.floor(n) - 0.5
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function interpolate(keyframes: [number, number][], index: number) {
  let segment = 0
  while (segment < keyframes.length - 2 && keyframes[segment + 1][0] < index) {
    segment++
  }

  const [fromIndex, fromValue] = keyframes[segment]
  const [toIndex, toValue] = keyframes[segment + 1]
  const t = smoothstep((index - fromIndex) / (toIndex - fromIndex))

  return fromValue + (toValue - fromValue) * t
}

function buildRollingCurve(): CurvePoint[] {
  const points: CurvePoint[] = []

  for (let index = 0; index < SESSION_COUNT; index++) {
    const date = new Date(FIRST_SESSION)
    date.setDate(date.getDate() + index)

    // Chop is heaviest before the trend leg, then settles as the edge kicks in.
    const chop = index < 34 ? 210 : 70

    points.push({
      index,
      date,
      realized: interpolate(REALIZED_KEYFRAMES, index) + noise(index, 1) * chop,
      benchmark: interpolate(BENCHMARK_KEYFRAMES, index) + noise(index, 2) * 55,
    })
  }

  return points
}

export const ROLLING_CURVE = buildRollingCurve()

/** Sessions the x-axis is labelled at — the 1st and 15th of each month. */
export const CURVE_TICKS = ROLLING_CURVE.filter(
  (point) => point.date.getDate() === 1 || point.date.getDate() === 15,
).map((point) => point.index)

export const STRATEGY_EDGE: EdgeSlice[] = [
  { label: 'Trend Follow', share: 50, color: '#cfcbf2' },
  { label: 'Mean Rev.', share: 30, color: '#2f56d9' },
  { label: 'Breakout', share: 20, color: '#a02ecb' },
]

export const EDGE_WIN_RATE = 64

export const TRADE_LOG: LogEntry[] = [
  {
    id: 'nas100',
    ticker: 'NAS100',
    side: 'Long',
    strategy: 'London Breakout',
    riskReward: '1 : 3.4',
    changePct: 1.24,
    win: true,
  },
  {
    id: 'gold',
    ticker: 'GOLD',
    side: 'Short',
    strategy: 'Mean Reversion',
    riskReward: '1 : 1.5',
    changePct: -0.5,
    win: false,
  },
  {
    id: 'btcusdt',
    ticker: 'BTC/USDT',
    side: 'Long',
    strategy: 'Daily Pivot',
    riskReward: '1 : 5.1',
    changePct: 4.12,
    win: true,
  },
  {
    id: 'nvda',
    ticker: 'NVDA',
    side: 'Long',
    strategy: 'Momentum Gap',
    riskReward: '1 : 2.0',
    changePct: 2.45,
    win: true,
  },
]

export const tickDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})

export const percent = (value: number) =>
  `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`
