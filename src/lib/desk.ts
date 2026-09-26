import type { Candle } from './market'

/**
 * The trading desk: positions, P&L and the indicators drawn beside them.
 *
 * Pure functions over candles and fills, with no React and no network in
 * here. That is deliberate — this is the arithmetic a match is decided by,
 * and arithmetic in a component is arithmetic nothing can test.
 *
 * **The client's numbers are a preview, not the verdict.** A fill is a time,
 * a side and a size; the price comes from the candles. The same computation
 * runs server-side against the same bars when a match settles, so a browser
 * cannot report a return it invented — see `services/competition.py`.
 */

export type Side = 'buy' | 'sell'

export type Fill = {
  /** Epoch milliseconds. The bar containing this is what prices it. */
  at: number
  side: Side
  size: number
}

export type Position = {
  /** Positive is long, negative is short, zero is flat. */
  size: number
  /** Volume-weighted entry of the open position. Zero when flat. */
  average: number
  /** Closed P&L, in price points times size. */
  realised: number
}

export const FLAT: Position = { size: 0, average: 0, realised: 0 }

/** The bar a moment falls in, or the last one before it. */
export function barAt(candles: Candle[], at: number): Candle | null {
  let found: Candle | null = null

  for (const candle of candles) {
    if (candle.time > at) break
    found = candle
  }

  return found ?? candles[0] ?? null
}

/**
 * Walk the fills and see where they leave you.
 *
 * Handles the case that trips a naive implementation: a fill that crosses
 * through flat — selling three while long two — closes the two and opens one
 * the other way, and the realised P&L has to come from the closed part only.
 */
export function positionFrom(fills: Fill[], candles: Candle[]): Position {
  let size = 0
  let average = 0
  let realised = 0

  for (const fill of [...fills].sort((a, b) => a.at - b.at)) {
    const bar = barAt(candles, fill.at)
    if (bar === null || fill.size <= 0) continue

    const price = bar.close
    const signed = fill.side === 'buy' ? fill.size : -fill.size

    // Same direction, or opening from flat: average in.
    if (size === 0 || Math.sign(signed) === Math.sign(size)) {
      average = (average * Math.abs(size) + price * Math.abs(signed)) /
        (Math.abs(size) + Math.abs(signed))
      size += signed
      continue
    }

    const closing = Math.min(Math.abs(signed), Math.abs(size))
    realised += (price - average) * closing * Math.sign(size)

    const remaining = Math.abs(signed) - closing
    size += signed

    // Crossed through flat — what is left opens the other way at this price.
    average = remaining > 0 ? price : size === 0 ? 0 : average
  }

  return { size, average, realised }
}

/** What the open position is worth right now, on top of what is banked. */
export function unrealised(position: Position, price: number): number {
  if (position.size === 0) return 0
  return (price - position.average) * position.size
}

/**
 * The match score: return as a percentage of the capital put up.
 *
 * A percentage rather than an amount, for the reason the whole arena scores
 * points rather than money — two amounts from different stakes is not a
 * contest. Everybody in a match trades the same notional, so the denominator
 * is the same for both and the comparison is honest.
 */
export function returnPercent(
  position: Position,
  price: number,
  stake: number,
): number {
  if (stake <= 0) return 0
  return ((position.realised + unrealised(position, price)) / stake) * 100
}

/* -------------------------------------------------------------- indicators */

export type Point = { time: number; value: number }

/** Simple moving average. Nothing before the window is full. */
export function sma(candles: Candle[], length: number): Point[] {
  if (length < 1) return []

  const out: Point[] = []
  let running = 0

  for (let index = 0; index < candles.length; index += 1) {
    running += candles[index].close
    if (index >= length) running -= candles[index - length].close
    if (index >= length - 1) {
      out.push({ time: candles[index].time, value: running / length })
    }
  }

  return out
}

/**
 * Exponential moving average.
 *
 * Seeded with the simple average of the first window rather than the first
 * close — seeding from one price makes the first fifty bars of the line a
 * picture of that one bar rather than of the market.
 */
export function ema(candles: Candle[], length: number): Point[] {
  if (length < 1 || candles.length < length) return []

  const k = 2 / (length + 1)
  const out: Point[] = []

  let value =
    candles.slice(0, length).reduce((sum, bar) => sum + bar.close, 0) / length
  out.push({ time: candles[length - 1].time, value })

  for (let index = length; index < candles.length; index += 1) {
    value = candles[index].close * k + value * (1 - k)
    out.push({ time: candles[index].time, value })
  }

  return out
}

/**
 * Volume-weighted average price, cumulative over the session shown.
 *
 * Typical price rather than close, which is what every desk means by VWAP.
 * Bars with no volume contribute nothing rather than dragging the line to
 * their price.
 */
export function vwap(candles: Candle[]): Point[] {
  const out: Point[] = []
  let volume = 0
  let notional = 0

  for (const bar of candles) {
    const typical = (bar.high + bar.low + bar.close) / 3
    volume += bar.volume
    notional += typical * bar.volume

    out.push({ time: bar.time, value: volume > 0 ? notional / volume : typical })
  }

  return out
}

/** Relative strength, Wilder's smoothing. Drawn on its own scale. */
export function rsi(candles: Candle[], length = 14): Point[] {
  if (candles.length <= length) return []

  const out: Point[] = []
  let gain = 0
  let loss = 0

  for (let index = 1; index <= length; index += 1) {
    const change = candles[index].close - candles[index - 1].close
    if (change >= 0) gain += change
    else loss -= change
  }

  gain /= length
  loss /= length

  const push = (time: number) => {
    // No losses at all is not an infinite ratio, it is 100 — the same answer
    // every platform gives, and one a chart can actually draw.
    const value = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)
    out.push({ time, value })
  }

  push(candles[length].time)

  for (let index = length + 1; index < candles.length; index += 1) {
    const change = candles[index].close - candles[index - 1].close
    gain = (gain * (length - 1) + Math.max(0, change)) / length
    loss = (loss * (length - 1) + Math.max(0, -change)) / length
    push(candles[index].time)
  }

  return out
}

/** Which overlays a trader can switch on, and how each is drawn. */
export type IndicatorId = 'ema9' | 'ema21' | 'sma50' | 'vwap'

export const INDICATORS: {
  id: IndicatorId
  label: string
  colour: string
  of: (candles: Candle[]) => Point[]
}[] = [
  { id: 'ema9', label: 'EMA 9', colour: '#ff6a1a', of: (c) => ema(c, 9) },
  { id: 'ema21', label: 'EMA 21', colour: '#6aa9ff', of: (c) => ema(c, 21) },
  { id: 'sma50', label: 'SMA 50', colour: '#9aa4b2', of: (c) => sma(c, 50) },
  { id: 'vwap', label: 'VWAP', colour: '#e0a020', of: vwap },
]
