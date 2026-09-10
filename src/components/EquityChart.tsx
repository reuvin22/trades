import { useMemo, useState, type PointerEvent } from 'react'
import { compactCurrency, currency, shortDate } from '../data/dashboard'
import { OPENING_BALANCE, type EquityPoint } from '../lib/stats'
import { smoothPath } from '../lib/curve'

const RANGES = ['90D', '30D', '7D'] as const
type Range = (typeof RANGES)[number]

const RANGE_DAYS: Record<Range, number> = { '90D': 90, '30D': 30, '7D': 7 }

const W = 1000
const H = 400
/** The value scale occupies the top slice; the rest is the drop to the zero rule. */
const PLOT_BOTTOM = 340

/** Rounds the axis out to whole thousands around the data. */
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

export function EquityChart({ equity }: { equity: EquityPoint[] }) {
  const [range, setRange] = useState<Range>('90D')
  const [hovered, setHovered] = useState<number | null>(null)

  const series = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range])
    const within = equity.filter((point) => point.date >= cutoff)

    // Always open on the starting balance so a single trade still draws a line.
    const opening: EquityPoint = {
      date: cutoff,
      value: within.length > 0 ? within[0].value - 0 : OPENING_BALANCE,
      index: -1,
    }

    return within.length === 0
      ? [opening, { ...opening, date: new Date(), index: 0 }]
      : [{ ...opening, value: OPENING_BALANCE }, ...within]
  }, [equity, range])

  const scale = useMemo(() => buildScale(series.map((point) => point.value)), [series])

  const scaleY = useMemo(
    () => (value: number) => {
      const ratio = (value - scale.min) / (scale.max - scale.min)
      return PLOT_BOTTOM - ratio * (PLOT_BOTTOM - 20)
    },
    [scale],
  )

  const geometry = useMemo(() => {
    const points = series.map((point, index) => ({
      x: (index / Math.max(1, series.length - 1)) * W,
      y: scaleY(point.value),
    }))

    const line = smoothPath(points)
    return { points, line, area: `${line} L ${W} ${H} L 0 ${H} Z` }
  }, [series, scaleY])

  const xLabels = useMemo(() => {
    const last = series.length - 1
    const wanted = [0, 0.25, 0.5, 0.75, 1]
    const seen = new Set<number>()

    return wanted
      .map((fraction) => Math.round(fraction * last))
      .filter((index) => {
        if (seen.has(index)) return false
        seen.add(index)
        return true
      })
      .map((index) => ({ index, label: shortDate.format(series[index].date) }))
  }, [series])

  const activeIndex = hovered ?? series.length - 1
  const activePoint = series[activeIndex]
  const activeGeometry = geometry.points[activeIndex]

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - bounds.left) / bounds.width
    const index = Math.round(ratio * (series.length - 1))
    setHovered(Math.min(series.length - 1, Math.max(0, index)))
  }

  return (
    <section className="card chart-card">
      <div className="card-head">
        <div>
          <h2 className="card-title">Cumulative Equity</h2>
          <p className="card-sub">
            Realized returns over the last {RANGE_DAYS[range]} days
          </p>
        </div>

        <div className="segmented" role="group" aria-label="Chart range">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              className={`segment${range === option ? ' is-active' : ''}`}
              aria-pressed={range === option}
              onClick={() => {
                setRange(option)
                setHovered(null)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="axis-legend">
        x = Time
        <br />Y = Account Equity
      </p>

      <div
        className="plot"
        onPointerMove={trackPointer}
        onPointerLeave={() => setHovered(null)}
      >
        <div className="y-axis" aria-hidden="true">
          {scale.ticks.map((tick) => (
            <span key={tick} style={{ top: `${(scaleY(tick) / H) * 100}%` }}>
              {compactCurrency(tick)}
            </span>
          ))}
        </div>

        <svg
          className="plot-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Cumulative equity over the last ${RANGE_DAYS[range]} days`}
        >
          <defs>
            <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-fill-top)" />
              <stop offset="45%" stopColor="var(--chart-fill-mid)" />
              <stop offset="100%" stopColor="var(--chart-fill-bottom)" />
            </linearGradient>
          </defs>

          <g className="gridlines">
            {scale.ticks.map((tick) => (
              <line key={tick} x1="0" x2={W} y1={scaleY(tick)} y2={scaleY(tick)} />
            ))}
          </g>

          <path d={geometry.area} fill="url(#equity-fill)" className="chart-area" />
          <path
            d={geometry.line}
            className="equity-line draw-line"
            pathLength={1}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />

          {hovered !== null && (
            <line
              className="crosshair"
              x1={activeGeometry.x}
              x2={activeGeometry.x}
              y1={activeGeometry.y}
              y2={H}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <div
          className="plot-marker"
          style={{
            left: `${(activeGeometry.x / W) * 100}%`,
            top: `${(activeGeometry.y / H) * 100}%`,
          }}
          aria-hidden="true"
        />

        <div
          className="tooltip"
          style={{
            left: `${(activeGeometry.x / W) * 100}%`,
            top: `${(activeGeometry.y / H) * 100}%`,
          }}
        >
          <span className="tooltip-date">{shortDate.format(activePoint.date)}</span>
          <strong className="tooltip-value">{currency.format(activePoint.value)}</strong>
        </div>
      </div>

      <div className="x-axis" aria-hidden="true">
        {xLabels.map(({ index, label }) => (
          <span
            key={index}
            style={{ left: `${(index / Math.max(1, series.length - 1)) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </section>
  )
}
