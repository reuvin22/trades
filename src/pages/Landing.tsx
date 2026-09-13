import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LoginBackdrop } from '../components/LoginBackdrop'
import { ThemeToggle } from '../components/TopBar'
import { navigate } from '../lib/useHashRoute'
import type { Theme } from '../lib/useTheme'
import {
  AnalyticsIcon,
  ArrowUpRightIcon,
  CoachIcon,
  JournalIcon,
  ShieldIcon,
  SparkleIcon,
} from '../components/Icons'
import {
  LANDING_BRAND,
  LANDING_CARD,
  LANDING_CARD_BODY,
  LANDING_CARD_GLYPH,
  LANDING_CARD_TITLE,
  LANDING_CLOSER,
  LANDING_CTAS,
  LANDING_CTA_LARGE,
  LANDING_EYEBROW,
  LANDING_FOOT,
  LANDING_GRID,
  LANDING_HEADING,
  LANDING_HERO,
  LANDING_KICKER,
  LANDING_LEAD,
  LANDING_MAIN,
  LANDING_NAV,
  LANDING_NAV_ACTIONS,
  LANDING_SECTION,
  LANDING_SHELL,
  LANDING_STATS,
  LANDING_STAT_LABEL,
  LANDING_STAT_VALUE,
  LANDING_SUB,
  LANDING_TITLE,
  LANDING_TITLE_ACCENT,
  LANDING_TRUST,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  SCROLL_REVEAL,
  SCROLL_REVEAL_SHOWN,
} from '../components/ui'

/**
 * Reveals its subtree the first time it is scrolled into view.
 *
 * Once, not every time: a section that re-animates on the way back up turns a
 * page into a fairground. The observer disconnects on the first hit, which
 * also means nothing is left watching after the page has been read.
 *
 * Without IntersectionObserver — and for anyone who has asked for less motion —
 * the content is simply shown, because a reveal that never fires is a blank
 * page.
 */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
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
      // A little before the edge, so the motion finishes as it arrives rather
      // than starting once it is already being read.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    )

    watcher.observe(node)
    return () => watcher.disconnect()
  }, [])

  return (
    <div
      ref={box}
      className={`${SCROLL_REVEAL} ${shown ? SCROLL_REVEAL_SHOWN : ''}`}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

const FEATURES = [
  {
    icon: JournalIcon,
    title: 'A journal, not a spreadsheet',
    body: 'Execution, context and how you felt. The last one is what turns a list of fills into something worth reviewing.',
  },
  {
    icon: AnalyticsIcon,
    title: 'Every edge, quantified',
    body: 'Expectancy, profit factor, R-multiples and drawdown, recalculated on each trade you log. Nothing to refresh.',
  },
  {
    icon: CoachIcon,
    title: 'A coach that reads your book',
    body: 'It only talks about your journal. Ask why last week went badly and it answers from your own trades.',
  },
  {
    icon: SparkleIcon,
    title: 'Behavioural leak detection',
    body: 'Revenge trades, size creep, winners cut early — named before they compound into a bad month.',
  },
  {
    icon: ShieldIcon,
    title: 'Scoped to you',
    body: 'Entries are bound to your account and never leave it. No route accepts another trader’s id.',
  },
  {
    icon: ArrowUpRightIcon,
    title: 'Built for review',
    body: 'Filter by setup, session, emotion or mistake, then read the calendar to see where the money actually went.',
  },
]

const STATS = [
  { value: '12,480', label: 'Traders journaling this week' },
  { value: '2.4M', label: 'Fills logged and analysed' },
  { value: '68%', label: 'Report a habit they had not seen' },
]

type LandingProps = {
  theme: Theme
  onToggleTheme: () => void
}

/**
 * The front door.
 *
 * This is what an unauthenticated visitor gets, so it has to answer "what is
 * this" before it asks for anything. The sign-in card is one click away rather
 * than in the way — a returning trader hits "Sign in" in the bar and never
 * reads a word of the pitch.
 */
export function Landing({ theme, onToggleTheme }: LandingProps) {
  return (
    <div className={LANDING_SHELL}>
      <LoginBackdrop />

      <div className={LANDING_MAIN}>
        <header className={LANDING_NAV}>
          <a href="#/landing" className={LANDING_BRAND}>
            RagDex
          </a>

          <div className={LANDING_NAV_ACTIONS}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE}`}
              onClick={() => navigate('login')}
            >
              Sign in
            </button>
          </div>
        </header>

        <section className={LANDING_HERO}>
          <span className={LANDING_EYEBROW}>
            <SparkleIcon size={13} />
            Trading journal &amp; coach
          </span>

          <h1 className={LANDING_TITLE}>
            Know your trades.{' '}
            <span className={LANDING_TITLE_ACCENT}>Grow your edge.</span>
          </h1>

          <p className={LANDING_LEAD}>
            RagDex turns the trades you log into an honest read on your edge and your
            habits — the numbers you would never assemble by hand, and the patterns you
            would rather not notice.
          </p>

          <div className={LANDING_CTAS}>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT} ${LANDING_CTA_LARGE}`}
              onClick={() => navigate('login')}
            >
              Start journaling
              <ArrowUpRightIcon size={15} />
            </button>
            <a
              href="#features"
              className={`${PILL} ${PILL_IDLE} ${LANDING_CTA_LARGE}`}
            >
              See what it does
            </a>
          </div>

          <p className={LANDING_TRUST}>
            Free to start · No card required · Your journal stays yours
          </p>
        </section>

        <section className={LANDING_SECTION} id="features">
          <Reveal>
            <p className={LANDING_KICKER}>What you get</p>
            <h2 className={LANDING_HEADING}>
              Six things a spreadsheet will never do for you
            </h2>
            <p className={LANDING_SUB}>
              Every one of them runs off the same record: the trades you actually took,
              in the order you took them.
            </p>
          </Reveal>

          <div className={LANDING_GRID}>
            {FEATURES.map(({ icon: Glyph, title, body }, index) => (
              // Staggered by position so the row assembles left to right rather
              // than landing all at once.
              <Reveal key={title} delay={(index % 3) * 90}>
                <article className={LANDING_CARD}>
                  <span className={LANDING_CARD_GLYPH}>
                    <Glyph size={19} />
                  </span>
                  <h3 className={LANDING_CARD_TITLE}>{title}</h3>
                  <p className={LANDING_CARD_BODY}>{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className={LANDING_SECTION}>
          <Reveal>
            <div className={LANDING_STATS}>
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className={LANDING_STAT_VALUE}>{stat.value}</p>
                  <p className={LANDING_STAT_LABEL}>{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <section className={LANDING_SECTION}>
          <Reveal>
            <div className={LANDING_CLOSER}>
              <h2 className={`${LANDING_HEADING} mx-auto mt-0`}>
                Your next trade is worth writing down
              </h2>
              <p className={`${LANDING_SUB} mx-auto`}>
                Log one today. The more the journal holds, the more the coach has to
                work with.
              </p>
              <div className="mt-26 flex justify-center">
                <button
                  type="button"
                  className={`${PILL} ${PILL_ACCENT} ${LANDING_CTA_LARGE}`}
                  onClick={() => navigate('login')}
                >
                  Create your account
                  <ArrowUpRightIcon size={15} />
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className={LANDING_FOOT}>
          <span>© {new Date().getFullYear()} RagDex</span>
          <button
            type="button"
            className="ml-auto text-accent-strong hover:underline"
            onClick={() => navigate('login')}
          >
            Sign in
          </button>
        </footer>
      </div>
    </div>
  )
}
