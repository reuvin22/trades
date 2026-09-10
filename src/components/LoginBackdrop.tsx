import { useMemo } from 'react'
import { smoothPath } from '../lib/curve'

const W = 1200
const H = 700

/** Three equity-curve ribbons that draw themselves and drift behind the form. */
const RIBBONS = [0, 1, 2].map((band) => {
  const points = Array.from({ length: 26 }, (_, index) => {
    const x = (index / 25) * W
    const wave =
      Math.sin(index * 0.42 + band * 1.7) * 46 +
      Math.sin(index * 0.19 + band * 0.6) * 78
    const drift = (index / 25) * -150

    return { x, y: H * 0.62 + band * 74 + wave + drift }
  })

  return smoothPath(points)
})

export function LoginBackdrop() {
  const orbs = useMemo(
    () => [
      { className: 'orb orb-a' },
      { className: 'orb orb-b' },
      { className: 'orb orb-c' },
    ],
    [],
  )

  return (
    <div className="login-backdrop" aria-hidden="true">
      {orbs.map((orb) => (
        <span key={orb.className} className={orb.className} />
      ))}

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="ribbon-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-line)" stopOpacity="0" />
            <stop offset="35%" stopColor="var(--chart-line)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {RIBBONS.map((ribbon, index) => (
          <path
            key={index}
            d={ribbon}
            className={`ribbon ribbon-${index + 1}`}
            pathLength={1}
            fill="none"
            stroke="url(#ribbon-stroke)"
          />
        ))}
      </svg>

      <span className="grid-veil" />
    </div>
  )
}
