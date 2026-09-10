import { AnimatedNumber } from './AnimatedNumber'
import type { DerivedStats } from '../lib/stats'

const RADIUS = 62
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
/** Percentage points shaved off each arc to leave a visible gap between slices. */
const GAP = 1.2

const PALETTE = ['#cfcbf2', '#2f56d9', '#a02ecb', '#31a06a', '#e2755c']

export function StrategyEdge({ stats }: { stats: DerivedStats }) {
  // Only the leading setups get their own slice; the tail is grouped.
  const top = stats.setups.slice(0, 3)
  const rest = stats.setups.slice(3)
  const restShare = rest.reduce((sum, slice) => sum + slice.share, 0)

  const slices = [
    ...top.map((slice, index) => ({
      label: slice.label,
      share: slice.share,
      color: PALETTE[index],
    })),
    ...(restShare > 0
      ? [{ label: 'Other', share: restShare, color: PALETTE[3] }]
      : []),
  ]

  let cursor = 0
  const arcs = slices.map((slice) => {
    const dash = (Math.max(slice.share - GAP, 0.5) / 100) * CIRCUMFERENCE
    const arc = {
      ...slice,
      dashArray: `${dash} ${CIRCUMFERENCE - dash}`,
      dashOffset: -(cursor / 100) * CIRCUMFERENCE,
    }
    cursor += slice.share
    return arc
  })

  return (
    <section className="card edge-card">
      <h2 className="card-title">Strategy Edge</h2>

      {slices.length === 0 ? (
        <p className="card-sub edge-empty">
          Tag your trades with a setup name to see which edge carries your account.
        </p>
      ) : (
        <ul className="edge-legend">
          {slices.map((slice) => (
            <li key={slice.label}>
              <span className="edge-dot" style={{ background: slice.color }} />
              <span className="edge-label">{slice.label}</span>
              <span className="edge-share">{Math.round(slice.share)}%</span>
            </li>
          ))}
        </ul>
      )}

      <div className="donut">
        <svg
          viewBox="0 0 160 160"
          role="img"
          aria-label={`${Math.round(stats.winRate)} percent win rate`}
        >
          <g className="donut-arcs">
            <circle className="donut-track" cx="80" cy="80" r={RADIUS} />
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx="80"
                cy="80"
                r={RADIUS}
                stroke={arc.color}
                strokeDasharray={arc.dashArray}
                strokeDashoffset={arc.dashOffset}
              />
            ))}
          </g>
        </svg>

        <div className="donut-center">
          <strong>
            <AnimatedNumber value={stats.winRate} format={(n) => `${Math.round(n)}%`} />
          </strong>
          <span>Win Rate</span>
        </div>
      </div>
    </section>
  )
}
