export type Direction = 'Long' | 'Short'
export type SizeUnit = 'Shares' | 'Lots' | 'Contracts'
export type Compliance = 'yes' | 'no' | ''

export type TradeEntry = {
  ticker: string
  direction: Direction
  size: string
  sizeUnit: SizeUnit
  entryPrice: string
  exitPrice: string
  entryAt: string
  exitAt: string

  setup: string
  rationale: string
  stopLoss: string
  takeProfit: string
  screenshot: string

  netPl: string
  compliedEntry: Compliance
  compliedExit: Compliance
  compliedManagement: Compliance
  emotionBefore: string
  emotionDuring: string
  mistakes: string[]
}

export const SETUPS = [
  'VWAP Reclaim',
  'VWAP Bounce',
  'Breakout',
  'Gap & Go',
  'Bull Flag',
  'Mean Reversion',
  'Continuation',
  'Daily Pivot',
  'London Breakout',
  'Momentum Gap',
  'Overextended',
]

export const EMOTIONS = [
  'Calm',
  'Focused',
  'Confident',
  'Impatient',
  'Anxious',
  'Fearful',
  'Greedy',
  'Frustrated',
  'Euphoric',
]

export const MISTAKE_TAGS = [
  'FOMO entry',
  'Moved stop',
  'Oversized',
  'Chased entry',
  'Exited early',
  'Held too long',
  'Revenge trade',
  'No stop set',
  'Ignored plan',
  'Averaged down',
]

export const EMPTY_TRADE: TradeEntry = {
  ticker: '',
  direction: 'Long',
  size: '',
  sizeUnit: 'Shares',
  entryPrice: '',
  exitPrice: '',
  entryAt: '',
  exitAt: '',
  setup: '',
  rationale: '',
  stopLoss: '',
  takeProfit: '',
  screenshot: '',
  netPl: '',
  compliedEntry: '',
  compliedExit: '',
  compliedManagement: '',
  emotionBefore: '',
  emotionDuring: '',
  mistakes: [],
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Planned reward divided by planned risk, from entry, stop and target. */
export function riskReward(trade: TradeEntry): number | null {
  const entry = toNumber(trade.entryPrice)
  const stop = toNumber(trade.stopLoss)
  const target = toNumber(trade.takeProfit)
  if (entry === null || stop === null || target === null) return null

  const risk = Math.abs(entry - stop)
  const reward = Math.abs(target - entry)
  if (risk === 0 || reward === 0) return null

  return reward / risk
}

/** Realized P&L, sign-corrected for shorts. */
export function netProfit(trade: TradeEntry): number | null {
  const entry = toNumber(trade.entryPrice)
  const exit = toNumber(trade.exitPrice)
  const size = toNumber(trade.size)
  if (entry === null || exit === null || size === null) return null

  const move = trade.direction === 'Long' ? exit - entry : entry - exit
  return move * size
}

/** Time in the position, formatted as `2d 3h 14m`. */
export function holdTime(trade: TradeEntry): string | null {
  if (trade.entryAt === '' || trade.exitAt === '') return null

  const opened = new Date(trade.entryAt).getTime()
  const closed = new Date(trade.exitAt).getTime()
  if (Number.isNaN(opened) || Number.isNaN(closed) || closed <= opened) return null

  const minutes = Math.round((closed - opened) / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)

  return [days && `${days}d`, hours && `${hours}h`, `${minutes % 60}m`]
    .filter(Boolean)
    .join(' ')
}

/** Fields the journal cannot be useful without. */
export function missingRequired(trade: TradeEntry): string[] {
  const gaps: string[] = []
  if (trade.ticker.trim() === '') gaps.push('Instrument / Ticker')
  if (toNumber(trade.size) === null) gaps.push('Position size')
  if (toNumber(trade.entryPrice) === null) gaps.push('Entry price')
  if (trade.entryAt === '') gaps.push('Entry timestamp')
  return gaps
}

/**
 * What is wrong with the entry beyond a field simply being blank.
 *
 * The API refuses an exit that precedes its entry, and rightly — every derived
 * figure is built on that ordering. But finding out by round trip returns a
 * validation envelope with an empty field name, which points at nothing the
 * form can highlight. Catching it here says which two inputs disagree, before
 * anything is sent.
 */
export function inconsistencies(trade: TradeEntry): string[] {
  const problems: string[] = []

  if (trade.entryAt !== '' && trade.exitAt !== '') {
    const opened = new Date(trade.entryAt).getTime()
    const closed = new Date(trade.exitAt).getTime()

    if (!Number.isNaN(opened) && !Number.isNaN(closed) && closed < opened) {
      problems.push('Exit time is before entry time')
    }
  }

  return problems
}
