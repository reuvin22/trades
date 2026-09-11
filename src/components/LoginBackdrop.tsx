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

/** Blurred colour, drifting on its own clock so the three never sync up. */
const ORB = 'absolute rounded-full opacity-55 blur-[70px] will-change-transform'

const ORBS = [
  `${ORB} animate-orb-a -top-140 -left-80 size-460 bg-[color-mix(in_srgb,var(--color-accent)_60%,transparent)]`,
  `${ORB} animate-orb-b -bottom-120 left-[34%] size-380 bg-[color-mix(in_srgb,#3f6bff_55%,transparent)]`,
  `${ORB} animate-orb-c top-[18%] -right-150 size-420 bg-[color-mix(in_srgb,#a02ecb_45%,transparent)]`,
]

/** Each ribbon runs the same pair of animations, offset so they stagger. */
const RIBBON = 'animate-ribbon [stroke-width:1.6] [stroke-dasharray:1]'
const RIBBON_PHASE = [
  'opacity-50',
  'opacity-32 [animation-delay:-3s,-5s]',
  'opacity-20 [animation-delay:-6s,-11s]',
]

export function LoginBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {ORBS.map((orb) => (
        <span key={orb} className={orb} />
      ))}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ribbon-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-chart-line)" stopOpacity="0" />
            <stop offset="35%" stopColor="var(--color-chart-line)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-accent-strong)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {RIBBONS.map((ribbon, index) => (
          <path
            key={index}
            d={ribbon}
            className={`${RIBBON} ${RIBBON_PHASE[index]}`}
            pathLength={1}
            fill="none"
            stroke="url(#ribbon-stroke)"
          />
        ))}
      </svg>

      {/* Grid, faded out towards the edges by the mask. */}
      <span className="absolute inset-0 animate-veil bg-[linear-gradient(var(--color-grid)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid)_1px,transparent_1px)] bg-[size:64px_64px] opacity-25 [mask-image:radial-gradient(circle_at_50%_40%,#000_0%,transparent_72%)]" />
    </div>
  )
}
