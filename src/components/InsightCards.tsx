import { currency } from '../data/dashboard'
import type { DerivedStats } from '../lib/stats'
import type { LeakState } from '../lib/insight'
import type { LeakCadence } from '../lib/profile'
import { AlertIcon, BoltIcon, RefreshIcon, SparkleIcon } from './Icons'
import {
  CARD,
  CARD_HOVER,
  INSIGHT_ACTION,
  INSIGHT_ACTION_TEXT,
  INSIGHT_BODY,
  INSIGHT_CARD,
  INSIGHT_COST,
  INSIGHT_COST_VALUE,
  INSIGHT_KICKER,
  INSIGHT_TITLE,
  NEG,
  POS,
  SHIMMER,
} from './ui'

const NOTE = 'mt-12 flex items-center gap-6 text-[10.5px] text-fg-muted'

/**
 * The stretch of trading this reading covers.
 *
 * The card is about behaviour, and behaviour only means something over a
 * span — "you size up after a loss" is a claim about a run of trades, not
 * about one. Naming the cadence is what tells the reader which span they are
 * looking at, and stops a monthly reading being taken for today's verdict.
 */
function overWhat(cadence: LeakCadence | null): string {
  if (cadence === 'weekly') return 'Re-read every week'
  if (cadence === 'monthly') return 'Re-read every month'
  if (cadence === 'daily') return 'Re-read at the end of each day'
  return 'Read from your logged trades'
}

/** How long ago the analysis ran, in the words someone would use out loud. */
function whenRead(at: Date): string {
  const minutes = Math.round((Date.now() - at.getTime()) / 60_000)

  if (minutes < 2) return 'just now'
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`

  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`

  const weeks = Math.round(days / 7)
  return weeks === 1 ? 'last week' : `${weeks} weeks ago`
}

export function BestSetupCard({ stats }: { stats: DerivedStats }) {
  const best = stats.bestSetup

  return (
    <article className={`${CARD} ${CARD_HOVER} ${INSIGHT_CARD}`}>
      <p className={INSIGHT_KICKER}>
        <BoltIcon className="text-amber" />
        What&apos;s working
      </p>
      <h3 className={INSIGHT_TITLE}>
        {best ? 'Your best setup' : 'Not enough trades yet'}
      </h3>
      <p className={INSIGHT_BODY}>
        {best ? (
          <>
            You win <strong className={POS}>
              {Math.round((best.wins / best.count) * 100)}% of the time
            </strong>{' '}
            on <strong>{best.label}</strong>, over {best.count}{' '}
            {best.count === 1 ? 'trade' : 'trades'}.
          </>
        ) : (
          'Log a few trades with a setup name and this will show which one works best for you.'
        )}
      </p>
    </article>
  )
}

/** Falls back to a local heuristic whenever the model has nothing to say. */
function HeuristicBehaviour({ stats }: { stats: DerivedStats }) {
  const leaking = stats.fatigueAfterHour !== null && stats.fatigueExpectancy < 0

  return (
    <p className={INSIGHT_BODY}>
      {leaking ? (
        <>
          You lose money after 2:00 PM. About{' '}
          <strong className={NEG}>
            -{currency.format(Math.abs(stats.fatigueExpectancy))}
          </strong>
          {' '}
          a trade.
        </>
      ) : (
        'Your afternoons are holding up. Keep logging entry times to keep this honest.'
      )}
    </p>
  )
}

export function TradingBehaviourCard({
  stats,
  leak,
}: {
  stats: DerivedStats
  leak: LeakState
}) {
  // Severity tints the border rather than shouting with a banner.
  const severity =
    leak.result?.severity === 'high'
      ? 'border-[color-mix(in_srgb,var(--color-red)_40%,transparent)]'
      : leak.result?.severity === 'medium'
        ? 'border-[color-mix(in_srgb,var(--color-amber)_36%,transparent)]'
        : ''

  return (
    <article className={`${CARD} ${CARD_HOVER} ${INSIGHT_CARD} ${severity}`}>
      <div className="flex items-center justify-between gap-12">
        <p className={INSIGHT_KICKER}>
          <AlertIcon className="text-red" />
          How you&apos;re trading
        </p>

        {leak.result && (
          <button
            type="button"
            className="grid size-26 place-items-center rounded-full text-fg-muted transition-[color,background-color] duration-150 hover:not-disabled:bg-tint-2 hover:not-disabled:text-fg-strong"
            onClick={leak.refresh}
            disabled={leak.loading}
            title="Re-analyse with the latest trades"
            aria-label="Re-analyse"
          >
            <RefreshIcon size={14} />
          </button>
        )}
      </div>

      {leak.loading && (
        <div className="mt-14 flex flex-col gap-9" aria-live="polite">
          <span className={`${SHIMMER} mb-4 h-16 w-[62%]`} />
          <span className={SHIMMER} />
          <span className={`${SHIMMER} w-[45%]`} />
          <p className={NOTE}>Reading your journal…</p>
        </div>
      )}

      {!leak.loading && leak.needed !== null && (
        <>
          <h3 className={INSIGHT_TITLE}>Not enough history</h3>
          <p className={INSIGHT_BODY}>
            Log {leak.needed - leak.have} more{' '}
            {leak.needed - leak.have === 1 ? 'trade' : 'trades'} and the coach can
            start reading the pattern in how you trade.
          </p>
        </>
      )}

      {!leak.loading && leak.error && (
        <>
          <h3 className={INSIGHT_TITLE}>Analysis unavailable</h3>
          <p className={INSIGHT_BODY}>{leak.error}</p>
        </>
      )}

      {!leak.loading && leak.result && (
        <>
          <h3 className={INSIGHT_TITLE}>{leak.result.title}</h3>
          <p className={INSIGHT_BODY}>{leak.result.finding}</p>

          {leak.result.costLabel && (
            <p className={INSIGHT_COST}>
              <span className="flex-none">Estimated cost</span>
              <strong className={`${NEG} ${INSIGHT_COST_VALUE}`}>
                {leak.result.costLabel}
              </strong>
            </p>
          )}

          {leak.result.recommendation && (
            <p className={INSIGHT_ACTION}>
              <SparkleIcon size={13} />
              <span className={INSIGHT_ACTION_TEXT}>{leak.result.recommendation}</span>
            </p>
          )}

          <p className={NOTE}>
            <SparkleIcon size={11} />
            {/* When, not just that. A monthly reading being read as a reaction
                to this morning's session is the misunderstanding worth
                spending a line to avoid. */}
            {overWhat(leak.cadence)}
            {leak.computedAt ? ` · last read ${whenRead(leak.computedAt)}` : ''}
          </p>
        </>
      )}

      {/* Nothing configured server-side: keep the card useful anyway. */}
      {!leak.loading && leak.unavailable && !leak.result && (
        <>
          <h3 className={INSIGHT_TITLE}>
            {stats.fatigueAfterHour !== null && stats.fatigueExpectancy < 0
              ? 'You fade in the afternoon'
              : 'Nothing obvious yet'}
          </h3>
          <HeuristicBehaviour stats={stats} />
        </>
      )}
    </article>
  )
}
