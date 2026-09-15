import { useEffect, useRef, useState, type ReactNode } from 'react'
import { navigate } from '../lib/useHashRoute'
import { smoothPath } from '../lib/curve'
import { PRICING_TIERS } from '../data/plans'
import {
  AnalyticsIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  ChartBarsIcon,
  ClockIcon,
  CheckIcon,
  CoachIcon,
  JournalIcon,
  ShieldIcon,
  SparkleIcon,
  TrendIcon,
  WalletIcon,
} from '../components/Icons'
import {
  LAND_ACTIONS,
  LAND_AXIS,
  LAND_BAR,
  LAND_BAR_LOSS,
  LAND_BAR_WIN,
  LAND_BARS,
  LAND_BENTO,
  LAND_BG,
  LAND_BG_BLOB,
  LAND_BG_BLOB_A,
  LAND_BG_BLOB_B,
  LAND_BG_BLOB_C,
  LAND_BG_GRID,
  LAND_BODY,
  LAND_BODY_DOWN,
  LAND_BODY_UP,
  LAND_BRAND,
  LAND_BRAND_MARK,
  LAND_CANDLE,
  LAND_CANDLES,
  LAND_CLOSER,
  LAND_CLOSER_ACTIONS,
  LAND_CLOSER_INNER,
  LAND_CLOSER_ORB,
  LAND_CTA,
  LAND_CTA_DOT,
  LAND_DOT,
  LAND_DOT_GREEN,
  LAND_DOT_RED,
  LAND_DOT_VIOLET,
  LAND_EYEBROW,
  LAND_FEATURE,
  LAND_FEATURE_BODY,
  LAND_FEATURE_ICON,
  LAND_FEATURE_TITLE,
  LAND_FLOAT_A,
  LAND_FLOAT_B,
  LAND_FLOAT_C,
  LAND_FOOT,
  LAND_FOOT_END,
  LAND_FRAME,
  LAND_GLASS,
  LAND_GLASS_CAPTION,
  LAND_GLASS_FIGURE,
  LAND_GLASS_ICON,
  LAND_GLASS_NAME,
  LAND_GLASS_MORE,
  LAND_GLASS_TOP,
  LAND_H2,
  LAND_HALO,
  LAND_HEAD_CENTER,
  LAND_HEADLINE,
  LAND_HEADLINE_SOFT,
  LAND_HERO,
  LAND_LEAD,
  LAND_LIMIT_ROW,
  LAND_LINKS,
  LAND_LOGIN,
  LAND_NAV,
  LAND_ORB,
  LAND_P,
  LAND_PAGE,
  LAND_PLAN,
  LAND_PLAN_BADGE,
  LAND_PLAN_BLURB,
  LAND_PLAN_CTA,
  LAND_PLAN_CTA_DISABLED,
  LAND_PLAN_CTA_FEATURED,
  LAND_PLAN_CTA_IDLE,
  LAND_PLAN_FEATURED,
  LAND_PLAN_FEATURES,
  LAND_PLAN_IDLE,
  LAND_PLAN_BLURRED,
  LAND_PLAN_LOCK_BADGE,
  LAND_PLAN_LOCKED,
  LAND_PLAN_SKELETON_BAR,
  LAND_PLAN_SKELETON_DOT,
  LAND_PLAN_SKELETON_ROW,
  LAND_PLAN_NAME,
  LAND_PLAN_NOTE,
  LAND_PLAN_PER,
  LAND_PLAN_PRICE,
  LAND_PLAN_PRICE_HIDDEN,
  LAND_PLAN_SOON,
  LAND_PLANS,
  LAND_SECTION,
  LAND_SETUP_FOOT,
  LAND_SLOT,
  LAND_SLOT_BARS,
  LAND_SLOT_EQUITY,
  LAND_SLOT_LIMIT,
  LAND_SLOT_SETUP,
  LAND_SLOT_TAGS,
  LAND_SPAN_2,
  LAND_SPARK,
  LAND_SPARK_AREA,
  LAND_SPARK_LINE,
  LAND_STAGE,
  LAND_STAT_LABEL,
  LAND_STAT_VALUE,
  LAND_STATS,
  LAND_STEP,
  LAND_STEP_NUM,
  LAND_STEPS,
  LAND_TAG,
  LAND_TAG_SHIFT,
  LAND_TEXT_LINK,
  LAND_TRACK,
  LAND_TRACK_FILL,
  LAND_UP,
  LAND_WICK,
  SCROLL_REVEAL,
  SCROLL_REVEAL_SHOWN,
} from '../components/ui'

/**
 * Scrolls to a section on this page.
 *
 * Not an `href="#pricing"` anchor: this app routes on the hash, so an anchor
 * like that changes the route to "pricing", which a signed-out visitor is not
 * allowed to hold — App sends them back to the landing page, at the top, and
 * the link appears to do nothing.
 */
function jump(id: string) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth' })
}

/**
 * Reveals its subtree the first time it is scrolled into view.
 *
 * Once, not every time: a section that re-animates on the way back up turns a
 * page into a fairground. Without IntersectionObserver — and for anyone who
 * has asked for less motion — the content is simply shown, because a reveal
 * that never fires is a blank page.
 *
 * `className` lands on the wrapper, which is the grid item: a tile that spans
 * two columns has to say so here, not on the card inside it.
 */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = box.current
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!node || still || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        watcher.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    watcher.observe(node)
    return () => watcher.disconnect()
  }, [])

  return (
    <div
      ref={box}
      className={`${SCROLL_REVEAL} ${shown ? SCROLL_REVEAL_SHOWN : ''} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ hero stage */

const SPARK_W = 260
const SPARK_H = 80

/** A climb with a drawdown in it, because a straight line up reads as fake. */
const SPARK_LINE = smoothPath(
  [62, 55, 60, 44, 50, 36, 41, 52, 38, 26, 31, 18, 22, 12].map((y, index, all) => ({
    x: (index / (all.length - 1)) * SPARK_W,
    y,
  })),
)
const SPARK_AREA = `${SPARK_LINE} L ${SPARK_W} ${SPARK_H} L 0 ${SPARK_H} Z`

/** R-multiples from losses on the left to winners on the right. */
const R_BARS = [14, 22, 30, 42, 26, 18, 34, 52, 70, 88, 64, 48, 36, 24, 16]
const ZERO_AT = 6

const CANDLES = [
  { top: 8, body: 18, bottom: 10, up: true },
  { top: 12, body: 26, bottom: 6, up: false },
  { top: 6, body: 14, bottom: 12, up: true },
  { top: 10, body: 30, bottom: 8, up: true },
  { top: 14, body: 20, bottom: 10, up: false },
  { top: 6, body: 34, bottom: 6, up: true },
  { top: 9, body: 24, bottom: 9, up: true },
]

/**
 * The product, in five floating cards.
 *
 * Decorative, so hidden from assistive technology — every figure on it is
 * illustrative and none of it is anyone's account. What it has to do is show,
 * before a word is read, that this is a journal with numbers in it.
 */
function HeroStage() {
  return (
    <div className={LAND_STAGE} aria-hidden="true">
      <div className={`${LAND_SLOT} ${LAND_SLOT_EQUITY}`}>
        <div className={`${LAND_GLASS} ${LAND_FLOAT_A}`}>
          <div className={LAND_GLASS_TOP}>
            <span className={LAND_GLASS_ICON}>
              <WalletIcon size={15} />
            </span>
            <span>
              <span className={LAND_GLASS_NAME}>$24,860.40</span>
              <span className={LAND_GLASS_CAPTION}>Account equity</span>
            </span>
            <span className={LAND_GLASS_MORE}>···</span>
          </div>

          <svg
            className={LAND_SPARK}
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="land-spark-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8f83ff" stopOpacity="0.45" />
                <stop offset="1" stopColor="#8f83ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className={LAND_SPARK_AREA} d={SPARK_AREA} fill="url(#land-spark-fill)" />
            <path className={LAND_SPARK_LINE} d={SPARK_LINE} pathLength={1} />
          </svg>
        </div>
      </div>

      <div className={`${LAND_SLOT} ${LAND_SLOT_TAGS}`}>
        <div className={LAND_FLOAT_B}>
          <p className={LAND_TAG}>
            <span className={`${LAND_DOT} ${LAND_DOT_RED}`} />
            Revenge trade flagged
          </p>
          <p className={`${LAND_TAG} ${LAND_TAG_SHIFT}`}>
            <span className={`${LAND_DOT} ${LAND_DOT_GREEN}`} />
            Win rate 62%
          </p>
          <p className={LAND_TAG}>
            <span className={`${LAND_DOT} ${LAND_DOT_VIOLET}`} />
            Journal synced
          </p>
        </div>
      </div>

      <div className={`${LAND_SLOT} ${LAND_SLOT_LIMIT}`}>
        <div className={`${LAND_GLASS} ${LAND_FLOAT_C}`}>
          <div className={LAND_LIMIT_ROW}>
            <span className={LAND_GLASS_TOP}>
              <span className={LAND_GLASS_ICON}>
                <ShieldIcon size={14} />
              </span>
              Daily loss limit
            </span>
            <span className={LAND_GLASS_FIGURE}>$180 / $500</span>
          </div>
          <div className={LAND_TRACK}>
            <div className={LAND_TRACK_FILL} style={{ width: '36%' }} />
          </div>
        </div>
      </div>

      <div className={`${LAND_SLOT} ${LAND_SLOT_BARS}`}>
        <div className={`${LAND_GLASS} ${LAND_FLOAT_B}`}>
          <div className={LAND_GLASS_TOP}>
            <span className={LAND_GLASS_ICON}>
              <ChartBarsIcon size={14} />
            </span>
            <span>
              <span className={LAND_GLASS_NAME}>R-multiples</span>
              <span className={LAND_GLASS_CAPTION}>Last 60 trades</span>
            </span>
          </div>
          <div className={LAND_BARS}>
            {R_BARS.map((height, index) => (
              <span
                key={index}
                className={`${LAND_BAR} ${index < ZERO_AT ? LAND_BAR_LOSS : LAND_BAR_WIN}`}
                style={{ height: `${height}%`, animationDelay: `${900 + index * 45}ms` }}
              />
            ))}
          </div>
          <div className={LAND_AXIS}>
            <span>−2R</span>
            <span>0</span>
            <span>+3R</span>
          </div>
        </div>
      </div>

      <div className={`${LAND_SLOT} ${LAND_SLOT_SETUP}`}>
        <div className={`${LAND_GLASS} ${LAND_FLOAT_A}`}>
          <div className={LAND_GLASS_TOP}>
            <span className={LAND_GLASS_ICON}>
              <TrendIcon size={14} />
            </span>
            <span>
              <span className={LAND_GLASS_NAME}>Breakout</span>
              <span className={LAND_GLASS_CAPTION}>Your best setup</span>
            </span>
          </div>
          <div className={LAND_CANDLES}>
            {CANDLES.map((candle, index) => (
              <span
                key={index}
                className={LAND_CANDLE}
                style={{ animationDelay: `${1050 + index * 60}ms` }}
              >
                <span className={LAND_WICK} style={{ height: candle.top }} />
                <span
                  className={candle.up ? LAND_BODY_UP : LAND_BODY_DOWN}
                  style={{ height: candle.body }}
                />
                <span className={LAND_WICK} style={{ height: candle.bottom }} />
              </span>
            ))}
          </div>
          <div className={LAND_SETUP_FOOT}>
            <span className={LAND_GLASS_FIGURE}>+2.1R</span>
            <span className={LAND_UP}>68% win</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- content */

const STATS = [
  { value: '12k+', label: 'Traders journaling' },
  { value: '4.8', label: 'Average rating' },
  { value: '2.4M', label: 'Trades logged' },
]

const FEATURES = [
  {
    icon: JournalIcon,
    title: 'A journal, not a spreadsheet',
    body: 'Execution, context and how you felt. The last one is what turns a list of fills into something worth reviewing — and it takes a minute to log.',
    wide: true,
  },
  {
    icon: AnalyticsIcon,
    title: 'Every edge, quantified',
    body: 'Expectancy, profit factor, drawdown and R-multiples, recalculated on each trade.',
  },
  {
    icon: CoachIcon,
    title: 'A coach that reads your book',
    body: 'Ask why last week went badly and it answers from your own trades, not a textbook.',
  },
  {
    icon: SparkleIcon,
    title: 'Leaks, named early',
    body: 'Revenge trades, size creep, winners cut short — flagged before they cost you a month.',
  },
  {
    icon: CalendarIcon,
    title: 'Built for review',
    body: 'Filter by setup, session, emotion or mistake, then read the calendar to see where the money went.',
  },
]

const STEPS = [
  {
    title: 'Log the trade',
    body: 'Entry, exit, size and setup — plus how you felt going in. Thirty seconds, from any device.',
  },
  {
    title: 'Let the numbers build',
    body: 'Every statistic recalculates as you log. There is nothing to refresh and no formula to maintain.',
  },
  {
    title: 'Ask what it means',
    body: 'The coach reads your journal and tells you, plainly, which habit is costing you the most.',
  },
]

/**
 * The front door.
 *
 * One fixed look rather than a light and a dark theme: a visitor arrives with
 * no preference to honour, and the page is designed as a single surface. A
 * returning trader skips it entirely — App sends a live session straight to
 * the dashboard.
 */
export function Landing() {
  const signIn = () => navigate('login')

  return (
    <div className={LAND_PAGE}>
      <div className={LAND_BG} aria-hidden="true">
        <span className={`${LAND_BG_BLOB} ${LAND_BG_BLOB_A}`} />
        <span className={`${LAND_BG_BLOB} ${LAND_BG_BLOB_B}`} />
        <span className={`${LAND_BG_BLOB} ${LAND_BG_BLOB_C}`} />
        <span className={LAND_BG_GRID} />
      </div>

      <div className={LAND_FRAME}>
        <span className={LAND_HALO} aria-hidden="true" />
        <span className={LAND_ORB} aria-hidden="true" />

        <header className={LAND_NAV}>
          <a href="#/landing" className={LAND_BRAND}>
            <span className={LAND_BRAND_MARK}>R</span>
            RagDex
          </a>

          <nav className={LAND_LINKS} aria-label="On this page">
            <button type="button" onClick={() => jump('features')}>
              Features
            </button>
            <button type="button" onClick={() => jump('how')}>
              How it works
            </button>
            <button type="button" onClick={() => jump('pricing')}>
              Pricing
            </button>
          </nav>

          <button type="button" className={LAND_LOGIN} onClick={signIn}>
            Sign in
          </button>
        </header>

        <section className={LAND_HERO}>
          <div>
            <h1 className={LAND_HEADLINE}>
              Journal every trade.
              <span className={LAND_HEADLINE_SOFT}>Trade with an edge.</span>
            </h1>

            <p className={LAND_LEAD}>
              RagDex turns the trades you log into an honest read on your edge and your
              habits — the numbers you would never assemble by hand.
            </p>

            <div className={LAND_ACTIONS}>
              <button type="button" className={LAND_CTA} onClick={signIn}>
                Start for free
                <span className={LAND_CTA_DOT}>
                  <ArrowUpRightIcon size={15} />
                </span>
              </button>
              <button type="button" className={LAND_TEXT_LINK} onClick={() => jump('pricing')}>
                See pricing
              </button>
            </div>
          </div>

          <HeroStage />
        </section>

        <div className={LAND_STATS}>
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className={LAND_STAT_VALUE}>{stat.value}</p>
              <p className={LAND_STAT_LABEL}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={LAND_BODY}>
        <section className={LAND_SECTION} id="features">
          <Reveal>
            <span className={LAND_EYEBROW}>Features</span>
            <h2 className={LAND_H2}>Everything a spreadsheet never did for you</h2>
            <p className={LAND_P}>
              All of it runs off one record: the trades you actually took, in the order
              you took them.
            </p>
          </Reveal>

          <div className={LAND_BENTO}>
            {FEATURES.map(({ icon: Glyph, title, body, wide }, index) => (
              <Reveal key={title} delay={index * 80} className={wide ? LAND_SPAN_2 : ''}>
                <article className={LAND_FEATURE}>
                  <span className={LAND_FEATURE_ICON}>
                    <Glyph size={20} />
                  </span>
                  <h3 className={LAND_FEATURE_TITLE}>{title}</h3>
                  <p className={LAND_FEATURE_BODY}>{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={LAND_SECTION} id="how">
          <Reveal>
            <span className={LAND_EYEBROW}>How it works</span>
            <h2 className={LAND_H2}>Three steps, and the third one talks back</h2>
          </Reveal>

          <div className={LAND_STEPS}>
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 100}>
                <article className={LAND_STEP}>
                  <span className={LAND_STEP_NUM}>{index + 1}</span>
                  <h3 className={LAND_FEATURE_TITLE}>{step.title}</h3>
                  <p className={LAND_FEATURE_BODY}>{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={LAND_SECTION} id="pricing">
          <Reveal className={LAND_HEAD_CENTER}>
            <span className={LAND_EYEBROW}>Pricing</span>
            <h2 className={LAND_H2}>Start free. Upgrade when it earns it.</h2>
            <p className={LAND_P}>
              Every tier keeps your whole journal. What changes is how deep the analysis
              goes — and whether you are reviewing only yourself.
            </p>
          </Reveal>

          <div className={LAND_PLANS}>
            {PRICING_TIERS.map((tier, index) => (
              <Reveal key={tier.id} delay={index * 90}>
                <article
                  className={`${LAND_PLAN} ${tier.featured ? LAND_PLAN_FEATURED : LAND_PLAN_IDLE}`}
                >
                  {tier.featured && <span className={LAND_PLAN_BADGE}>Most popular</span>}

                  <h3 className={LAND_PLAN_NAME}>{tier.name}</h3>
                  <p className={LAND_PLAN_BLURB}>{tier.blurb}</p>

                  <p className={LAND_PLAN_PRICE}>
                    {tier.inDevelopment ? (
                      // Not rendered, only its shape: a price for an unfinished
                      // tier is not a commitment worth publishing yet.
                      <span className={LAND_PLAN_PRICE_HIDDEN} aria-hidden="true" />
                    ) : tier.monthly === null ? (
                      // Quoted, not listed: the size of a coach's cohort sets
                      // the price, so there is no single figure to show.
                      'Custom'
                    ) : (
                      <>
                        ${tier.monthly}
                        <span className={LAND_PLAN_PER}>/month</span>
                      </>
                    )}
                  </p>

                  {tier.inDevelopment ? (
                    <div className={LAND_PLAN_LOCKED}>
                      {/* Placeholder lines, one per real feature and sized to
                          its length, so the card keeps its shape without
                          publishing what the tier will contain. */}
                      <div className={LAND_PLAN_BLURRED} aria-hidden="true">
                        {tier.features.map((feature, index) => {
                          const label = typeof feature === 'string' ? feature : feature.label
                          return (
                            <span key={index} className={LAND_PLAN_SKELETON_ROW}>
                              <span className={LAND_PLAN_SKELETON_DOT} />
                              <span
                                className={LAND_PLAN_SKELETON_BAR}
                                style={{ width: `${Math.min(90, 34 + label.length)}%` }}
                              />
                            </span>
                          )
                        })}
                      </div>
                      <span className={LAND_PLAN_LOCK_BADGE}>
                        <ClockIcon size={13} />
                        In development
                      </span>
                    </div>
                  ) : (
                  <ul className={LAND_PLAN_FEATURES}>
                    {tier.features.map((feature) => {
                      const label = typeof feature === 'string' ? feature : feature.label
                      return (
                        <li key={label}>
                          <CheckIcon size={14} />
                          <span>
                            {label}
                            {typeof feature !== 'string' && (
                              <span className={LAND_PLAN_SOON}>Soon</span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  )}

                  <button
                    type="button"
                    className={`${LAND_PLAN_CTA} ${
                      tier.inDevelopment
                        ? LAND_PLAN_CTA_DISABLED
                        : tier.featured
                          ? LAND_PLAN_CTA_FEATURED
                          : LAND_PLAN_CTA_IDLE
                    }`}
                    // A tier still being built cannot be chosen yet.
                    disabled={tier.inDevelopment}
                    onClick={tier.inDevelopment ? undefined : signIn}
                  >
                    {tier.inDevelopment ? 'Coming soon' : tier.cta}
                  </button>
                </article>
              </Reveal>
            ))}
          </div>

          <p className={LAND_PLAN_NOTE}>
            Prices in USD. No card needed to start, and you won't be charged while
            paid plans are still being set up.
          </p>
        </section>

        <Reveal>
          <section className={LAND_CLOSER}>
            <span className={LAND_CLOSER_ORB} aria-hidden="true" />
            <div className={LAND_CLOSER_INNER}>
              <h2 className={LAND_H2}>Your next trade is worth writing down</h2>
              <p className={LAND_P}>
                Log one today. The more the journal holds, the more it can tell you.
              </p>
              <div className={LAND_CLOSER_ACTIONS}>
                <button type="button" className={LAND_CTA} onClick={signIn}>
                  Create your account
                  <span className={LAND_CTA_DOT}>
                    <ArrowUpRightIcon size={15} />
                  </span>
                </button>
              </div>
            </div>
          </section>
        </Reveal>

        <footer className={LAND_FOOT}>
          <span>© {new Date().getFullYear()} RagDex</span>
          <button type="button" className={LAND_FOOT_END} onClick={() => jump('features')}>
            Features
          </button>
          <button type="button" onClick={() => jump('pricing')}>
            Pricing
          </button>
          <button type="button" onClick={signIn}>
            Sign in
          </button>
        </footer>
      </div>
    </div>
  )
}
