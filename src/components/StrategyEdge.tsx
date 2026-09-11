import { CARD, CARD_SUB, CARD_TITLE, CHART_EMPTY } from './ui'
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
    <section data-tour="edge" className={`${CARD} flex flex-col px-22 pt-20 pb-24`}>
      <h2 className={CARD_TITLE}>Strategy Edge</h2>

      {slices.length === 0 ? (
        <p className={`${CARD_SUB} ${CHART_EMPTY}`}>
          Tag your trades with a setup name to see which edge carries your account.
        </p>
      ) : (
        <ul className="mt-20 flex list-none flex-col gap-9 p-0 [&>li]:grid [&>li]:grid-cols-[auto_1fr_auto] [&>li]:items-center [&>li]:gap-9 [&>li]:text-[12px] [&>li]:animate-slide-left [&>li:nth-child(1)]:[animation-delay:160ms] [&>li:nth-child(2)]:[animation-delay:240ms] [&>li:nth-child(3)]:[animation-delay:320ms]">
          {slices.map((slice) => (
            <li key={slice.label}>
              <span className="size-7 rounded-full" style={{ background: slice.color }} />
              <span className="text-fg-dim">{slice.label}</span>
              <span className="font-medium text-fg">{Math.round(slice.share)}%</span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-auto grid place-items-center pt-22 [&>svg]:h-auto [&>svg]:w-full [&>svg]:max-w-170 max-[1180px]:[&>svg]:max-w-200 [&_circle]:fill-none [&_circle]:[stroke-width:15]">
        <svg
          viewBox="0 0 160 160"
          role="img"
          aria-label={`${Math.round(stats.winRate)} percent win rate`}
        >
          <g className="animate-donut [transform-box:view-box] [transform-origin:80px_80px] rotate-[-90deg]">
            <circle className="stroke-tint-1" cx="80" cy="80" r={RADIUS} />
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

        <div className="pointer-events-none absolute top-[calc(50%+11px)] grid -translate-y-1/2 animate-pop justify-items-center gap-1 [animation-delay:0.55s] [&>strong]:text-[25px] [&>strong]:font-semibold [&>strong]:tracking-[-0.02em] [&>strong]:tabular-nums [&>span]:text-[10.5px] [&>span]:text-fg-muted">
          <strong>
            <AnimatedNumber value={stats.winRate} format={(n) => `${Math.round(n)}%`} />
          </strong>
          <span>Win Rate</span>
        </div>
      </div>
    </section>
  )
}
