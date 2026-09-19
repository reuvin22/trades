import { useEffect, useRef, useState } from 'react'
import {
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
import type { StoredTrade } from '../lib/trades'
import {
  TV_BAND_STOP,
  TV_BAND_TARGET,
  TV_CANVAS,
  TV_EMPTY,
  TV_KEY,
  TV_KEY_DOT,
  TV_KEY_ROW,
  TV_WRAP,
} from './ui'

/**
 * The trade, drawn as TradingView's Long/Short Position tool.
 *
 * There are no candles behind it, and that is not a shortcut — this system
 * holds no market data at all. Nothing in the API serves OHLC, and a trade
 * record carries four prices and two timestamps. Drawing a price history here
 * would mean inventing one, so the chart shows only what was actually
 * recorded: where the position was opened, where it closed, and the target
 * and stop it was working between.
 *
 * Read it as a diagram of the trade rather than a picture of the market.
 * Pan and zoom are switched off for the same reason: there is nothing off
 * screen to scroll to, and a chart that moves invites you to look for market
 * context that was never there.
 */

/** Seconds since epoch, which is what the chart wants for an intraday axis. */
function seconds(value: string): UTCTimestamp | null {
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? null : ((parsed / 1000) | 0) as UTCTimestamp
}

/** Reads a theme token, so the chart follows whatever palette is active. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value.trim() || fallback
}

type Band = { top: number; height: number } | null

export function TradeChart({ trade }: { trade: StoredTrade }) {
  const host = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState<Band>(null)
  const [stop, setStop] = useState<Band>(null)

  const { entryPrice, exitPrice, stopLoss, takeProfit } = trade
  const long = trade.direction === 'Long'

  useEffect(() => {
    const node = host.current
    if (!node || entryPrice === null) return

    /*
     * The two ends of the position. A trade still open, or one whose exit
     * timestamp did not survive the round trip, gets a second point a minute
     * later so the series has a direction to draw in — a single point renders
     * as nothing at all.
     */
    const opened = seconds(trade.entryAt) ?? (0 as UTCTimestamp)
    const closedRaw = seconds(trade.exitAt)
    const closed =
      closedRaw !== null && closedRaw > opened
        ? closedRaw
        : ((opened + 60) as UTCTimestamp)

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
      crosshair: { mode: CrosshairMode.Magnet },
      // Nothing exists outside the trade, so there is nowhere to pan to.
      handleScroll: false,
      handleScale: false,
      autoSize: true,
    })

    const series: ISeriesApi<'Line'> = chart.addSeries(LineSeries, {
      color: won ? green : red,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      /*
       * The series holds only entry and exit, so left to itself the chart
       * would scale to those two and push the stop and the target off screen
       * — losing the part that makes this a position rather than a line.
       * This widens the range to cover every level the trade involved.
       */
      autoscaleInfoProvider: () => {
        const levels = [entryPrice, close, stopLoss, takeProfit].filter(
          (value): value is number => value !== null,
        )
        const low = Math.min(...levels)
        const high = Math.max(...levels)
        // A flat trade (entry, exit, stop and target all equal) would give a
        // zero-height range, which the chart cannot scale to.
        const pad = (high - low || Math.abs(high) || 1) * 0.18
        return { priceRange: { minValue: low - pad, maxValue: high + pad } }
      },
    })

    series.setData([
      { time: opened, value: entryPrice },
      { time: closed, value: close },
    ])

    const line = (price: number, color: string, title: string, dashed: boolean) =>
      series.createPriceLine({
        price,
        color,
        lineWidth: 1,
        lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title,
      })

    line(entryPrice, accent, 'Entry', false)
    if (takeProfit !== null) line(takeProfit, green, 'TP', true)
    if (stopLoss !== null) line(stopLoss, red, 'SL', true)
    if (exitPrice !== null) line(exitPrice, won ? green : red, 'Exit', false)

    createSeriesMarkers(series, [
      {
        time: opened,
        position: long ? 'belowBar' : 'aboveBar',
        color: accent,
        shape: long ? 'arrowUp' : 'arrowDown',
        text: 'Entry',
      },
      ...(exitPrice === null
        ? []
        : [
            {
              time: closed,
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
     * series plugin, and the zones here always span the full width — there is
     * one trade on the chart and nothing beside it — so they only ever need a
     * top and a height. `priceToCoordinate` gives both, and CSS can then
     * colour them from the same tokens as everything else rather than having
     * the colours read out into script.
     */
    const measure = () => {
      const band = (from: number | null): Band => {
        if (from === null) return null
        const a = series.priceToCoordinate(from)
        const b = series.priceToCoordinate(entryPrice)
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
  }, [trade, entryPrice, exitPrice, stopLoss, takeProfit, long])

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
    </div>
  )
}
