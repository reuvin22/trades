import { useMemo, useState } from 'react'
import {
  AXIS_LEGEND,
  CARD,
  CARD_HEAD,
  CARD_SUB,
  CARD_TITLE,
  CHART_AREA,
  CROSSHAIR,
  EQUITY_LINE,
  GRIDLINES,
  PLOT,
  PLOT_SVG,
  SEGMENT,
  SEGMENTED,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  TOOLTIP,
  TOOLTIP_DATE,
  TOOLTIP_VALUE,
  X_AXIS_MONTHS,
  Y_AXIS,
} from '../ui'
import {
  compactRevenue,
  REVENUE_MARKER,
  REVENUE_MARKER_LABEL,
  REVENUE_MONTHS,
  REVENUE_SERIES,
  revenueLabel,
} from '../../data/admin'
import { smoothPath } from '../../lib/curve'

const RANGES = ['30D', '90D', '1Y'] as const

const W = 1000
const H = 340
const PAD_TOP = 16
const BASELINE = 300
const Y_TICKS = [1_800_000, 1_500_000, 1_200_000, 900_000, 600_000, 300_000, 0]
const Y_MAX = 1_900_000

function scaleY(value: number) {
  return BASELINE - (value / Y_MAX) * (BASELINE - PAD_TOP)
}

const scaleX = (index: number) => (index / (REVENUE_SERIES.length - 1)) * W

export function RevenueGrowth() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('30D')

  const paths = useMemo(() => {
    const line = smoothPath(
      REVENUE_SERIES.map((value, index) => ({ x: scaleX(index), y: scaleY(value) })),
    )
    return { line, area: `${line} L ${W} ${BASELINE} L 0 ${BASELINE} Z` }
  }, [])

  const marker = {
    x: scaleX(REVENUE_MARKER),
    y: scaleY(REVENUE_SERIES[REVENUE_MARKER]),
  }

  return (
    <section className={`${CARD} relative z-20 px-22 pt-20 pb-14`}>
      <div className={CARD_HEAD}>
        <div>
          <h2 className={CARD_TITLE}>Revenue Growth</h2>
          <p className={CARD_SUB}>
            Historical performance of subscription revenue across all tiers.
          </p>
        </div>

        <div className={SEGMENTED} role="group" aria-label="Revenue range">
          {RANGES.map((option) => (
            <button
              key={option}
              type="button"
              className={`${SEGMENT} ${range === option ? SEGMENT_ACTIVE : SEGMENT_IDLE}`}
              aria-pressed={range === option}
              onClick={() => setRange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className={AXIS_LEGEND}>
        x = Timeline
        <br />Y = Revenue (USD)
      </p>

      <div className={`${PLOT} h-300 [&>div>span]:text-[10px]`}>
        <div className={Y_AXIS} aria-hidden="true">
          {Y_TICKS.map((tick) => (
            <span key={tick} style={{ top: `${(scaleY(tick) / H) * 100}%` }}>
              {compactRevenue(tick)}
            </span>
          ))}
        </div>

        <svg
          className={PLOT_SVG}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Subscription revenue from January through June"
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-fill-top)" />
              <stop offset="55%" stopColor="var(--color-chart-fill-mid)" />
              <stop offset="100%" stopColor="var(--color-chart-fill-bottom)" />
            </linearGradient>
          </defs>

          <g className={GRIDLINES}>
            {Y_TICKS.map((tick) => (
              <line key={tick} x1="0" x2={W} y1={scaleY(tick)} y2={scaleY(tick)} />
            ))}
          </g>

          <path d={paths.area} fill="url(#revenue-fill)" className={CHART_AREA} />
          <path
            d={paths.line}
            className={EQUITY_LINE}
            pathLength={1}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          <line
            className={CROSSHAIR}
            x1={marker.x}
            x2={marker.x}
            y1={marker.y}
            y2={BASELINE}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div
          className={TOOLTIP}
          style={{ left: `${(marker.x / W) * 100}%`, top: `${(marker.y / H) * 100}%` }}
        >
          <span className={TOOLTIP_DATE}>{REVENUE_MARKER_LABEL.toUpperCase()}</span>
          <strong className={TOOLTIP_VALUE}>
            {revenueLabel.format(REVENUE_SERIES[REVENUE_MARKER])}
          </strong>
        </div>
      </div>

      <div className={X_AXIS_MONTHS} aria-hidden="true">
        {REVENUE_MONTHS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </section>
  )
}
