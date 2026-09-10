import { REVENGE_PHASE, REVENGE_TICKS, REVENGE_TOTAL } from '../data/coach'
import { currency } from '../data/dashboard'

const W = 1000
const H = 300
const PAD_TOP = 14
const PAD_BOTTOM = 18
const Y_MIN = 9000
const Y_MAX = 39000
const Y_TICKS = [39000, 36000, 33000, 30000, 27000, 24000, 21000, 18000, 15000, 12000, 9000]

function scaleY(value: number) {
  const ratio = (value - Y_MIN) / (Y_MAX - Y_MIN)
  return H - PAD_BOTTOM - ratio * (H - PAD_TOP - PAD_BOTTOM)
}

const scaleX = (index: number) => (index / (REVENGE_PHASE.length - 1)) * W

/** Deliberately angular — each vertex is one trade, so no smoothing. */
const LINE = REVENGE_PHASE.map(
  (value, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index).toFixed(1)} ${scaleY(value).toFixed(1)}`,
).join(' ')

export function RevengeChart() {
  return (
    <figure className="revenge-chart">
      <figcaption className="revenge-head">
        <span className="revenge-title">Equity Curve: Revenge Phase</span>
        <span className="revenge-total">
          &minus; {currency.format(Math.abs(REVENGE_TOTAL))}
        </span>
      </figcaption>

      <p className="revenge-axis">
        x = Trade Number
        <br />Y = Account Equity ($)
      </p>

      <div className="revenge-plot">
        <div className="revenge-y" aria-hidden="true">
          {Y_TICKS.map((tick) => (
            <span key={tick} style={{ top: `${(scaleY(tick) / H) * 100}%` }}>
              ${tick / 1000}k
            </span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Account equity declining across sixteen revenge trades"
        >
          <g className="gridlines">
            {Y_TICKS.map((tick) => (
              <line key={tick} x1="0" x2={W} y1={scaleY(tick)} y2={scaleY(tick)} />
            ))}
          </g>
          <path
            d={LINE}
            className="revenge-line draw-line"
            pathLength={1}
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="revenge-x" aria-hidden="true">
        {REVENGE_TICKS.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </figure>
  )
}
