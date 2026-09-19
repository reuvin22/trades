import { useEffect, useRef, useState } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  createSeriesMarkers,
  CrosshairMode,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { fetchCandles, type CandlesResult } from '../lib/market'
import type { StoredTrade } from '../lib/trades'
import {
  TV_BAND_STOP,
  TV_BAND_TARGET,
  TV_CANVAS,
  TV_EMPTY,
  TV_KEY,
  TV_KEY_DOT,
  TV_KEY_ROW,
  TV_NOTE,
  TV_PENDING,
  TV_WRAP,
} from './ui'

/**
 * The trade, drawn on the market it was taken in.
 *
 * Candles come from `GET /api/v1/market/candles`, which is the API proxying a
 * data provider — the browser never holds the key. When that returns nothing,
 * because the deployment has no provider configured or the symbol is one the
 * provider does not carry, the chart falls back to drawing the position from
 * the record alone: entry, exit, and the target and stop it worked between.
 * That fallback is deliberately not labelled as an error, because an
 * unconfigured deployment is a decision rather than a fault.
 *
 * Pan and zoom stay off in both cases. The target and stop zones are HTML
 * positioned from `priceToCoordinate`, and a price scale the reader can move
 * would slide the candles out from under them.
 */

/**
 * Epoch milliseconds to the chart's time axis, shifted into local time.
 *
 * Lightweight Charts always labels its axis in UTC, while the record beside
 * it is formatted with Intl in the reader's own zone. Feeding true epochs put
 * "Opened 22:42" next to an axis reading 14:42 for anyone east of Greenwich.
 * The offset is taken per timestamp rather than once, so a window spanning a
 * daylight-saving change does not bend by an hour in the middle.
 */
function chartTime(ms: number): UTCTimestamp {
  const at = new Date(ms)
  return (((ms - at.getTimezoneOffset() * 60_000) / 1000) | 0) as UTCTimestamp
}

function stamp(value: string): number | null {
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

/** Reads a theme token, so the chart follows whatever palette is active. */
function token(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value.trim() || fallback
}

type Band = { top: number; height: number } | null

export function TradeChart({ trade }: { trade: StoredTrade }) {
  const host = useRef<HTMLDivElement>(null)
  /** null while the request is in flight. */
  const [market, setMarket] = useState<CandlesResult | null>(null)
  const [target, setTarget] = useState<Band>(null)
  const [stop, setStop] = useState<Band>(null)

  const { entryPrice, exitPrice, stopLoss, takeProfit } = trade
  const long = trade.direction === 'Long'

  /*
   * No `setMarket(null)` to clear the previous trade's candles on the way in:
   * this component is keyed by trade id where it is mounted, so a different
   * record gets a fresh instance whose state already starts at null. Resetting
   * state by identity is what a key is for, and doing it with a synchronous
   * setState in an effect renders twice and trips the cascading-render rule.
   */
  useEffect(() => {
    const controller = new AbortController()
    let live = true

    void fetchCandles(trade, controller.signal).then((result) => {
      if (live) setMarket(result)
    })

    return () => {
      live = false
      controller.abort()
    }
  }, [trade])

  useEffect(() => {
    const node = host.current
    // Nothing to draw yet, or nothing to draw at all.
    if (!node || market === null || entryPrice === null) return

    const bars = market.state === 'ok' ? market.candles : []

    const opened = stamp(trade.entryAt) ?? 0
    const closedRaw = stamp(trade.exitAt)
    const closed = closedRaw !== null && closedRaw > opened ? closedRaw : opened + 60_000
    const close = exitPrice ?? entryPrice

    const fg = token('--color-fg-muted', '#718397')
    const grid = token('--color-line', 'rgba(255,255,255,0.07)')
    const green = token('--color-green', '#29ca94')
    const red = token('--color-red', '#ed6a70')
    const accent = token('--color-accent', '#20c99a')
    const won = close >= entryPrice === long

    const chart: IChartApi = createChart(node, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: fg,
        fontSize: 11,
      },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      rightPriceScale: { borderColor: grid },
      timeScale: { borderColor: grid, timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      // See the note above: the zones are drawn in HTML against fixed
      // coordinates, so the scale has to hold still.
      handleScroll: false,
      handleScale: false,
      autoSize: true,
    })

    /*
     * Every price the chart has to keep in view.
     *
     * Candles autoscale to themselves, which would push a target set well
     * above the session clean off the top — losing the part that makes this a
     * position rather than a price history. The range is therefore computed
     * once from the bars *and* the trade's levels together.
     */
    const levels = [entryPrice, close, stopLoss, takeProfit].filter(
      (value): value is number => value !== null,
    )
    const lows = bars.map((bar) => bar.low)
    const highs = bars.map((bar) => bar.high)
    const low = Math.min(...levels, ...(lows.length ? lows : levels))
    const high = Math.max(...levels, ...(highs.length ? highs : levels))
    // A flat trade with no bars would give a zero-height range to scale to.
    const pad = (high - low || Math.abs(high) || 1) * 0.12
    const priceRange = { minValue: low - pad, maxValue: high + pad }
    const autoscale = () => ({ priceRange })

    let scale: ISeriesApi<'Candlestick'> | ISeriesApi<'Line'>

    if (bars.length > 0) {
      const candles = chart.addSeries(CandlestickSeries, {
        upColor: green,
        downColor: red,
        wickUpColor: green,
        wickDownColor: red,
        borderVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: autoscale,
      })

      candles.setData(
        bars.map((bar) => ({
          time: chartTime(bar.time),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        })),
      )
      scale = candles
    } else {
      /*
       * No market data. The position itself becomes the series: two points,
       * entry to exit, so the chart still shows the shape of the trade.
       */
      const line = chart.addSeries(LineSeries, {
        color: won ? green : red,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        autoscaleInfoProvider: autoscale,
      })

      line.setData([
        { time: chartTime(opened), value: entryPrice },
        { time: chartTime(closed), value: close },
      ])
      scale = line
    }

    const priceLine = (price: number, color: string, title: string, dashed: boolean) =>
      scale.createPriceLine({
        price,
        color,
        lineWidth: 1,
        lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title,
      })

    priceLine(entryPrice, accent, 'Entry', false)
    if (takeProfit !== null) priceLine(takeProfit, green, 'TP', true)
    if (stopLoss !== null) priceLine(stopLoss, red, 'SL', true)
    if (exitPrice !== null) priceLine(exitPrice, won ? green : red, 'Exit', false)

    createSeriesMarkers(scale, [
      {
        time: chartTime(opened),
        position: long ? 'belowBar' : 'aboveBar',
        color: accent,
        shape: long ? 'arrowUp' : 'arrowDown',
        text: 'Entry',
      },
      ...(exitPrice === null
        ? []
        : [
            {
              time: chartTime(closed),
              position: long ? ('aboveBar' as const) : ('belowBar' as const),
              color: won ? green : red,
              shape: long ? ('arrowDown' as const) : ('arrowUp' as const),
              text: 'Exit',
            },
          ]),
    ])

    chart.timeScale().fitContent()

    /*
     * The target and stop zones are HTML over the canvas, not drawings in it.
     *
     * Lightweight Charts has no rectangle primitive without writing a custom
     * series plugin, and these always span the full width, so they only ever
     * need a top and a height. `priceToCoordinate` gives both, and CSS can
     * then colour them from the same tokens as everything else.
     */
    const measure = () => {
      const band = (from: number | null): Band => {
        if (from === null) return null
        const a = scale.priceToCoordinate(from)
        const b = scale.priceToCoordinate(entryPrice)
        if (a === null || b === null) return null
        return { top: Math.min(a, b), height: Math.abs(a - b) }
      }

      setTarget(band(takeProfit))
      setStop(band(stopLoss))
    }

    measure()
    // Coordinates only move when the box does, since pan and zoom are off.
    const observer = new ResizeObserver(measure)
    observer.observe(node)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [trade, market, entryPrice, exitPrice, stopLoss, takeProfit, long])

  if (entryPrice === null) {
    return (
      <div className={TV_WRAP}>
        <p className={TV_EMPTY}>
          This trade has no entry price recorded, so there is nothing to plot.
          Add one and the position will be drawn here.
        </p>
      </div>
    )
  }

  if (market === null) {
    return (
      <div className={TV_WRAP}>
        <div className={TV_PENDING} />
      </div>
    )
  }

  return (
    <div className={TV_WRAP}>
      <div className={TV_CANVAS} ref={host}>
        {target && (
          <span
            aria-hidden="true"
            className={TV_BAND_TARGET}
            style={{ top: target.top, height: target.height }}
          />
        )}
        {stop && (
          <span
            aria-hidden="true"
            className={TV_BAND_STOP}
            style={{ top: stop.top, height: stop.height }}
          />
        )}
      </div>

      <div className={TV_KEY}>
        <span className={TV_KEY_ROW}>
          <span className={`${TV_KEY_DOT} bg-accent`} /> Entry
        </span>
        {takeProfit !== null && (
          <span className={TV_KEY_ROW}>
            <span className={`${TV_KEY_DOT} bg-green`} /> Target
          </span>
        )}
        {stopLoss !== null && (
          <span className={TV_KEY_ROW}>
            <span className={`${TV_KEY_DOT} bg-red`} /> Stop
          </span>
        )}
      </div>

      {market.state !== 'ok' && (
        <p className={TV_NOTE}>
          {market.state === 'unconfigured'
            ? 'No market data provider is configured, so this shows the position only.'
            : market.state === 'empty'
              ? `No market data for ${trade.ticker || 'this symbol'} in this window — showing the position only.`
              : market.message}
        </p>
      )}
    </div>
  )
}
