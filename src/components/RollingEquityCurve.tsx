import { useMemo } from 'react'
import { compactCurrency, shortDate } from '../data/dashboard'
import { OPENING_BALANCE, type EquityPoint } from '../lib/stats'
import { smoothPath } from '../lib/curve'

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
    <section className="card chart-card rolling-card">
      <div className="card-head">
        <h2 className="card-title">Rolling Equity Curve</h2>

        <div className="series-legend">
          <span className="series realized">Realized</span>
          <span className="series benchmark">Opening balance</span>
        </div>
      </div>

      <p className="axis-legend">
        x = Time
        <br />Y = Account Equity
      </p>

      {paths === null ? (
        <p className="chart-empty">
          Two or more closed trades will draw your rolling curve here.
        </p>
      ) : (
        <>
          <div className="plot rolling-plot">
            <div className="y-axis" aria-hidden="true">
              {scale.ticks.map((tick) => (
                <span key={tick} style={{ top: `${(scaleY(tick) / H) * 100}%` }}>
                  {compactCurrency(tick).toUpperCase()}
                </span>
              ))}
            </div>

            <svg
              className="plot-svg"
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label="Rolling equity curve against the opening balance"
            >
              <defs>
                <linearGradient id="rolling-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-fill-mid)" />
                  <stop offset="100%" stopColor="var(--chart-fill-bottom)" />
                </linearGradient>
              </defs>

              <g className="gridlines">
                {scale.ticks.map((tick) => (
                  <line key={tick} x1="0" x2={W} y1={scaleY(tick)} y2={scaleY(tick)} />
                ))}
              </g>

              <path d={paths.area} fill="url(#rolling-fill)" className="chart-area" />
              <path
                d={paths.benchmark}
                className="benchmark-line"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={paths.realized}
                className="equity-line draw-line"
                pathLength={1}
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="x-axis" aria-hidden="true">
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
