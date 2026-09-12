import { currency } from '../data/dashboard'
import type { DerivedStats } from '../lib/stats'
import type { LeakState } from '../lib/insight'
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

export function SystemSignalCard({ stats }: { stats: DerivedStats }) {
  const best = stats.bestSetup

  return (
    <article className={`${CARD} ${CARD_HOVER} ${INSIGHT_CARD}`}>
      <p className={INSIGHT_KICKER}>
        <BoltIcon className="text-amber" />
        System Signal
      </p>
      <h3 className={INSIGHT_TITLE}>
        {best ? 'High Confidence Edge' : 'Not enough samples'}
      </h3>
      <p className={INSIGHT_BODY}>
        {best ? (
          <>
            Your <strong>{best.label}</strong> setup currently holds an{' '}
            <strong className={POS}>
              {Math.round((best.wins / best.count) * 100)}% win rate
            </strong>{' '}
            over {best.count} {best.count === 1 ? 'sample' : 'samples'}.
          </>
        ) : (
          'Log a few trades with a setup name and the coach will start ranking your edges.'
        )}
      </p>
    </article>
  )
}

/** Falls back to a local heuristic whenever the model has nothing to say. */
function HeuristicLeak({ stats }: { stats: DerivedStats }) {
  const leaking = stats.fatigueAfterHour !== null && stats.fatigueExpectancy < 0

  return (
    <p className={INSIGHT_BODY}>
      {leaking ? (
        <>
          Trading performance drops significantly after 2:00 PM. Expected value per
          trade:{' '}
          <strong className={NEG}>
            -{currency.format(Math.abs(stats.fatigueExpectancy))}
          </strong>
          .
        </>
      ) : (
        'Afternoon expectancy is holding up. Keep logging entry times to keep this honest.'
      )}
    </p>
  )
}

export function BehavioralLeakCard({
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
          Behavioral Leak
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
            {leak.needed - leak.have === 1 ? 'trade' : 'trades'} and the coach will
            analyse your execution patterns.
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
            Written from your logged trades
          </p>
        </>
      )}

      {/* Nothing configured server-side: keep the card useful anyway. */}
      {!leak.loading && leak.unavailable && !leak.result && (
        <>
          <h3 className={INSIGHT_TITLE}>
            {stats.fatigueAfterHour !== null && stats.fatigueExpectancy < 0
              ? 'Session Fatigue'
              : 'No leak detected'}
          </h3>
          <HeuristicLeak stats={stats} />
        </>
      )}
    </article>
  )
}
