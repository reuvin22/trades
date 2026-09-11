import { useMemo } from 'react'
import { compactCurrency, shortDate } from '../data/dashboard'
import { OPENING_BALANCE, type EquityPoint } from '../lib/stats'
import { smoothPath } from '../lib/curve'
import {
  AXIS_LEGEND,
  CARD,
  CARD_HEAD,
  CARD_TITLE,
  CHART_AREA,
  CHART_EMPTY,
  EQUITY_LINE,
  GRIDLINES,
  PLOT,
  PLOT_SVG,
  X_AXIS,
  Y_AXIS,
} from './ui'

const W = 1000
const H = 360
const PLOT_BOTTOM = 320

function buildScale(values: number[]) {
  const low = Math.min(OPENING_BALANCE, ...values)
  const high = Math.max(OPENING_BALANCE, ...values)
  const pad = Math.max((high - low) * 0.15, 500)

  const min = Math.floor((low - pad) / 1000) * 1000
  const max = Math.ceil((high + pad) / 1000) * 1000
  const step = Math.max(1000, Math.round((max - min) / 4 / 1000) * 1000)

  const ticks: number[] = []
  for (let value = max; value >= min; value -= step) ticks.push(value)

  return { min, max, ticks }
}

export function RollingEquityCurve({ equity }: { equity: EquityPoint[] }) {
  const series = useMemo(() => {
    if (equity.length === 0) return []
    const opening: EquityPoint = {
      date: equity[0].date,
      value: OPENING_BALANCE,
      index: -1,
    }
    return [opening, ...equity]
  }, [equity])

  const scale = useMemo(() => buildScale(series.map((point) => point.value)), [series])

  const scaleY = useMemo(
    () => (value: number) => {
      const ratio = (value - scale.min) / (scale.max - scale.min)
      return PLOT_BOTTOM - ratio * (PLOT_BOTTOM - 18)
    },
    [scale],
  )

  const paths = useMemo(() => {
    if (series.length < 2) return null

    const points = series.map((point, index) => ({
      x: (index / (series.length - 1)) * W,
      y: scaleY(point.value),
    }))

    // A flat reference line: where the account would sit at zero edge.
    const benchmark = smoothPath([
      { x: 0, y: scaleY(OPENING_BALANCE) },
      { x: W, y: scaleY(OPENING_BALANCE) },
    ])

    const realized = smoothPath(points)
    return {
      realized,
      benchmark,
      area: `${realized} L ${W} ${PLOT_BOTTOM} L 0 ${PLOT_BOTTOM} Z`,
    }
  }, [series, scaleY])

  const xLabels = useMemo(() => {
    if (series.length < 2) return []
    const last = series.length - 1
    const seen = new Set<number>()

    return [0, 0.25, 0.5, 0.75, 1]
      .map((fraction) => Math.round(fraction * last))
      .filter((index) => {
        if (seen.has(index)) return false
        seen.add(index)
        return true
      })
      .map((index) => ({ index, label: shortDate.format(series[index].date) }))
  }, [series])

  return (
    <section className={`${CARD} px-22 pt-20 pb-14`}>
      <div className={CARD_HEAD}>
        <h2 className={CARD_TITLE}>Rolling Equity Curve</h2>

        <div className="flex flex-none gap-16">
          <span className="inline-flex items-center gap-7 text-[11.5px] text-fg-dim before:size-8 before:rounded-full before:bg-chart-line before:content-['']">Realized</span>
          <span className="inline-flex items-center gap-7 text-[11.5px] text-fg-dim before:size-8 before:rounded-full before:border-[1.5px] before:border-fg-muted before:content-['']">Opening balance</span>
        </div>
      </div>

      <p className={AXIS_LEGEND}>
        x = Time
        <br />Y = Account Equity
      </p>

      {paths === null ? (
        <p className={CHART_EMPTY}>
          Two or more closed trades will draw your rolling curve here.
        </p>
      ) : (
        <>
          <div className={`${PLOT} h-300 [&>div>span]:text-[9.5px]`}>
            <div className={Y_AXIS} aria-hidden="true">
              {scale.ticks.map((tick) => (
                <span key={tick} style={{ top: `${(scaleY(tick) / H) * 100}%` }}>
                  {compactCurrency(tick).toUpperCase()}
                </span>
              ))}
            </div>

            <svg
              className={PLOT_SVG}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label="Rolling equity curve against the opening balance"
            >
              <defs>
                <linearGradient id="rolling-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-fill-mid)" />
                  <stop offset="100%" stopColor="var(--color-chart-fill-bottom)" />
                </linearGradient>
              </defs>

              <g className={GRIDLINES}>
                {scale.ticks.map((tick) => (
                  <line key={tick} x1="0" x2={W} y1={scaleY(tick)} y2={scaleY(tick)} />
                ))}
              </g>

              <path d={paths.area} fill="url(#rolling-fill)" className={CHART_AREA} />
              <path
                d={paths.benchmark}
                className="[animation:fade_0.9s_0.5s_ease_backwards] stroke-fg-muted opacity-70 [stroke-width:1.4] [stroke-dasharray:5_5]"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={paths.realized}
                className={EQUITY_LINE}
                pathLength={1}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className={`${X_AXIS} [&>span]:text-[10.5px]`} aria-hidden="true">
            {xLabels.map(({ index, label }) => (
              <span
                key={index}
                style={{ left: `${(index / (series.length - 1)) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
