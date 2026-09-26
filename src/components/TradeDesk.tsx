import { useEffect, useMemo, useRef, useState } from 'react'
import { ArenaChart } from './ArenaChart'
import {
  DESK,
  DESK_ACTIONS,
  DESK_BUY,
  DESK_DOWN,
  DESK_FLAT,
  DESK_LABEL,
  DESK_PANEL,
  DESK_PNL,
  DESK_PRICE,
  DESK_ROW,
  DESK_ROW_VALUE,
  DESK_SELL,
  DESK_SIDE,
  DESK_SIZE,
  DESK_SIZE_BTN,
  DESK_TOOL,
  DESK_TOOL_ON,
  DESK_TOOLS,
  DESK_UP,
} from './ui'
import { apiFetch } from '../lib/api'
import {
  INDICATORS,
  positionFrom,
  returnPercent,
  unrealised,
  type Fill,
  type IndicatorId,
} from '../lib/desk'
import type { Candle } from '../lib/market'

/** The notional every player is given. Matches BATTLE_STAKE on the server. */
const STAKE = 10_000

/** How often new bars are pulled while a match is running. */
const TICK_MS = 5000

const SIZES = [1, 2, 5, 10]

/**
 * Where a match is actually traded.
 *
 * A chart, a size, and buy / sell / flat. Positions are simulated against
 * real bars — nobody's money is at risk and nothing reaches a broker.
 *
 * **The numbers on this screen are a preview.** A fill is recorded as a time,
 * a side and a size, and the server prices every one of them against the same
 * market data when the match settles. That is deliberate: a client that could
 * name its own fill prices could name its own result, so this one is not
 * trusted to.
 */
export function TradeDesk({
  symbol,
  startsAt,
  endsAt,
  onFills,
}: {
  symbol: string
  startsAt: number
  endsAt: number
  /** Handed up so the panel can submit them when the bell goes. */
  onFills: (fills: Fill[]) => void
}) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [fills, setFills] = useState<Fill[]>([])
  const [size, setSize] = useState(1)
  const [indicators, setIndicators] = useState<IndicatorId[]>(['ema9', 'vwap'])
  const reported = useRef<Fill[]>([])

  /*
   * The fills are handed up when the desk closes, which is the bell.
   *
   * Mirrored into a ref from an effect rather than during render — writing a
   * ref while rendering is the thing the hook rules object to, and the reason
   * they do is that a render can be thrown away and the write cannot.
   */
  useEffect(() => {
    reported.current = fills
  }, [fills])

  useEffect(() => () => onFills(reported.current), [onFills])

  /*
   * Bars, pulled on a timer.
   *
   * The candles endpoint serves a window rather than a stream, so "live" here
   * is a poll — which for a ten-minute match on one-minute bars is the same
   * information a stream would carry, at a fraction of the machinery.
   */
  useEffect(() => {
    if (symbol === '') return

    let alive = true

    const pull = async () => {
      try {
        const wire = await apiFetch<{ candles?: Candle[]; empty?: boolean }>(
          '/api/v1/market/candles',
          { query: { ticker: symbol, from: startsAt, to: Date.now() } },
        )
        if (alive && wire.candles) setCandles(wire.candles)
      } catch {
        // Silent. A dropped poll should leave the last bars on screen rather
        // than blanking a chart somebody is trading on.
      }
    }

    void pull()
    const timer = window.setInterval(() => void pull(), TICK_MS)

    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [symbol, startsAt])

  const last = candles.at(-1)?.close ?? 0
  const position = useMemo(() => positionFrom(fills, candles), [fills, candles])
  const open = unrealised(position, last)
  const total = position.realised + open
  const percent = returnPercent(position, last, STAKE)

  function order(side: 'buy' | 'sell') {
    const at = Math.min(Date.now(), endsAt)
    setFills((current) => [...current, { at, side, size }])
  }

  function flatten() {
    if (position.size === 0) return
    order(position.size > 0 ? 'sell' : 'buy')
    setFills((current) => [
      ...current.slice(0, -1),
      {
        at: Math.min(Date.now(), endsAt),
        side: position.size > 0 ? 'sell' : 'buy',
        size: Math.abs(position.size),
      },
    ])
  }

  return (
    <div className={DESK}>
      <div>
        <div className={DESK_TOOLS}>
          {INDICATORS.map((spec) => {
            const on = indicators.includes(spec.id)

            return (
              <button
                key={spec.id}
                type="button"
                className={`${DESK_TOOL} ${on ? DESK_TOOL_ON : ''}`}
                aria-pressed={on}
                onClick={() =>
                  setIndicators((current) =>
                    on
                      ? current.filter((entry) => entry !== spec.id)
                      : [...current, spec.id],
                  )
                }
              >
                {spec.label}
              </button>
            )
          })}
        </div>

        <ArenaChart candles={candles} fills={fills} indicators={indicators} />
      </div>

      <div className={DESK_SIDE}>
        <div className={DESK_PANEL}>
          <span className={DESK_LABEL}>{symbol || 'Loading'}</span>
          <span className={DESK_PRICE}>{last === 0 ? '—' : last.toFixed(2)}</span>
        </div>

        <div className={DESK_PANEL}>
          <span className={DESK_LABEL}>Your return</span>
          <span className={`${DESK_PNL} ${total >= 0 ? DESK_UP : DESK_DOWN}`}>
            {percent >= 0 ? '+' : ''}
            {percent.toFixed(2)}%
          </span>

          <span className={DESK_ROW}>
            Position
            <span className={DESK_ROW_VALUE}>
              {position.size === 0
                ? 'Flat'
                : `${position.size > 0 ? 'Long' : 'Short'} ${Math.abs(position.size)}`}
            </span>
          </span>
          <span className={DESK_ROW}>
            Average
            <span className={DESK_ROW_VALUE}>
              {position.size === 0 ? '—' : position.average.toFixed(2)}
            </span>
          </span>
          <span className={DESK_ROW}>
            Open
            <span className={`${DESK_ROW_VALUE} ${open >= 0 ? DESK_UP : DESK_DOWN}`}>
              {open.toFixed(2)}
            </span>
          </span>
          <span className={DESK_ROW}>
            Banked
            <span
              className={`${DESK_ROW_VALUE} ${position.realised >= 0 ? DESK_UP : DESK_DOWN}`}
            >
              {position.realised.toFixed(2)}
            </span>
          </span>
        </div>

        <div className={DESK_PANEL}>
          <span className={DESK_LABEL}>Size</span>
          <div className={DESK_SIZE}>
            {SIZES.map((option) => (
              <button
                key={option}
                type="button"
                className={DESK_SIZE_BTN}
                aria-pressed={size === option}
                onClick={() => setSize(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <div className={DESK_ACTIONS}>
            <button
              type="button"
              className={DESK_BUY}
              disabled={last === 0}
              onClick={() => order('buy')}
            >
              Buy
            </button>
            <button
              type="button"
              className={DESK_SELL}
              disabled={last === 0}
              onClick={() => order('sell')}
            >
              Sell
            </button>
            <button
              type="button"
              className={DESK_FLAT}
              disabled={position.size === 0}
              onClick={flatten}
            >
              Close position
            </button>
          </div>
        </div>

        <p className={DESK_ROW}>
          {/*
            Said on the screen, not just in a docstring. Somebody about to
            press Buy should know what it does and does not do.
          */}
          Simulated. Nothing here reaches a broker, and the server prices every
          fill against real bars when the match settles.
        </p>
      </div>
    </div>
  )
}
