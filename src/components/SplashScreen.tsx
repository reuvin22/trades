import {
  SPLASH,
  SPLASH_AREA,
  SPLASH_BRAND,
  SPLASH_CHART,
  SPLASH_LINE,
  SPLASH_MARKER,
  SPLASH_STATUS,
  SPLASH_TAGLINE,
} from './ui'

/**
 * The screen shown while the session is being restored.
 *
 * An equity curve plotting itself, with the name and the tagline beneath — the
 * product's own subject rather than a spinner, which is both more interesting
 * to look at and says what the app is before it has loaded.
 *
 * The curve is not a smooth arc. It climbs, gives some back twice, and ends
 * higher than it started, because that is what an honest equity curve looks
 * like and this app is about not pretending otherwise.
 */

/*
 * One path, used twice: drawn as the line, and handed to the marker as its
 * `offset-path` so the dot rides exactly on the drawing tip. Declaring it once
 * is what keeps those two in step — two copies would drift the moment either
 * was tweaked.
 */
const CURVE =
  'M4 96 L36 88 L60 74 L84 80 L110 58 L134 64 L160 42 L186 50 L212 30 L238 36 L264 18 L292 8'

/** The same shape closed along the baseline, so the fill has something to fill. */
const AREA = `${CURVE} L292 110 L4 110 Z`

export function SplashScreen() {
  return (
    <div className={SPLASH} role="status" aria-label="Loading RagDex">
      <svg
        className={SPLASH_CHART}
        viewBox="0 0 296 116"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="splash-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-fill-top)" />
            <stop offset="55%" stopColor="var(--color-chart-fill-mid)" />
            <stop offset="100%" stopColor="var(--color-chart-fill-bottom)" />
          </linearGradient>

          <linearGradient id="splash-stroke" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-chart-line)" />
          </linearGradient>
        </defs>

        {/* Baseline, so the climb has something to be measured against. */}
        <line
          x1="4"
          y1="110"
          x2="292"
          y2="110"
          stroke="var(--color-line-strong)"
          strokeWidth="1"
        />

        <path className={SPLASH_AREA} d={AREA} fill="url(#splash-fill)" opacity="0" />

        <path className={SPLASH_LINE} d={CURVE} stroke="url(#splash-stroke)" />

        {/*
         * The marker. `offset-path` moves it along the curve; the halo is a
         * second, softer circle rather than a filter, because a blur filter on
         * an animating element forces a repaint every frame.
         */}
        <g className={SPLASH_MARKER} style={{ offsetPath: `path('${CURVE}')` }}>
          <circle r="9" fill="var(--color-chart-glow)" opacity="0.5" />
          <circle r="3.5" fill="var(--color-chart-line)" />
        </g>
      </svg>

      <div className="grid justify-items-center gap-10">
        <p className={SPLASH_BRAND}>RagDex</p>
        <p className={SPLASH_TAGLINE}>
          Know Your Trades.
          <br />
          Grow Your Edge.
        </p>
      </div>

      <p className={SPLASH_STATUS}>Restoring your session</p>
    </div>
  )
}
