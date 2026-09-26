import { useEffect, useRef } from 'react'
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesMarkersPluginApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import { INDICATORS, type Fill, type IndicatorId } from '../lib/desk'
import type { Candle } from '../lib/market'
import { ARENA_CHART } from './ui'

/**
 * The chart a match is traded on.
 *
 * TradingView Lightweight, the same library `TradeChart` already uses — and
 * the reason this is a second component rather than a prop on that one is
 * that they are opposite things. That chart draws a position that is over and
 * holds perfectly still so annotations can be pinned to it; this one is live,
 * scrolls, and has to accept a new bar every few seconds without losing the
 * trader's place.
 *
 * Built once and updated in place. Recreating the chart on every poll would
 * reset the zoom, the crosshair and the scroll position four times a minute,
 * which is unusable while somebody is trying to trade on it.
 */
export function ArenaChart({
  candles,
  fills,
  indicators,
}: {
  candles: Candle[]
  fills: Fill[]
  indicators: IndicatorId[]
}) {
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi | null>(null)
  const price = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
  const lines = useRef<Map<IndicatorId, ReturnType<IChartApi['addSeries']>>>(
    new Map(),
  )
  // Typed against `Time` rather than inferred: `createSeriesMarkers` returns
  // a plugin generic over the series' time type, and inferring it from the
  // ref's initial null widens it to unknown.
  const markers = useRef<ISeriesMarkersPluginApi<Time> | null>(null)

  // -- build once ------------------------------------------------------
  useEffect(() => {
    const node = box.current
    if (node === null) return

    const instance = createChart(node, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8b8194',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: { borderColor: '#2e2733' },
      timeScale: {
        borderColor: '#2e2733',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: CrosshairMode.Normal },
      autoSize: true,
    })

    const series = instance.addSeries(CandlestickSeries, {
      upColor: '#54c48d',
      downColor: '#e0554a',
      wickUpColor: '#54c48d',
      wickDownColor: '#e0554a',
      borderVisible: false,
    })

    chart.current = instance
    price.current = series
    markers.current = createSeriesMarkers(series, [])

    // Captured now rather than read in the cleanup: the ref may point at a
    // different Map by the time teardown runs, and clearing the wrong one
    // would leave the old chart's series registered against the new chart.
    const overlays = lines.current

    return () => {
      instance.remove()
      chart.current = null
      price.current = null
      overlays.clear()
      markers.current = null
    }
  }, [])

  // -- bars, updated in place -----------------------------------------
  useEffect(() => {
    const series = price.current
    if (series === null || candles.length === 0) return

    series.setData(
      candles.map((bar) => ({
        time: (bar.time / 1000) as UTCTimestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    )
  }, [candles])

  // -- overlays, added and removed as they are switched ---------------
  useEffect(() => {
    const instance = chart.current
    if (instance === null) return

    for (const spec of INDICATORS) {
      const wanted = indicators.includes(spec.id)
      const existing = lines.current.get(spec.id)

      if (!wanted) {
        if (existing) {
          instance.removeSeries(existing)
          lines.current.delete(spec.id)
        }
        continue
      }

      const series =
        existing ??
        instance.addSeries(LineSeries, {
          color: spec.colour,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        })

      lines.current.set(spec.id, series)
      series.setData(
        spec
          .of(candles)
          .map((point) => ({
            time: (point.time / 1000) as UTCTimestamp,
            value: point.value,
          })),
      )
    }
  }, [indicators, candles])

  // -- the trader's own fills, on the bars they happened -------------
  useEffect(() => {
    const pins = markers.current
    if (pins === null) return

    pins.setMarkers(
      [...fills]
        .sort((a, b) => a.at - b.at)
        .map((fill) => ({
          time: (fill.at / 1000) as UTCTimestamp,
          position: fill.side === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
          color: fill.side === 'buy' ? '#54c48d' : '#e0554a',
          shape: fill.side === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
          text: `${fill.side === 'buy' ? 'B' : 'S'} ${fill.size}`,
        })),
    )
  }, [fills])

  return <div ref={box} className={ARENA_CHART} />
}
