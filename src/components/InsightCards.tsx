import { currency } from '../data/dashboard'
import type { DerivedStats } from '../lib/stats'
import type { LeakState } from '../lib/insight'
import { AlertIcon, BoltIcon, RefreshIcon, SparkleIcon } from './Icons'

export function SystemSignalCard({ stats }: { stats: DerivedStats }) {
  const best = stats.bestSetup

  return (
    <article className="card insight-card">
      <p className="insight-kicker">
        <BoltIcon className="kicker-icon accent" />
        System Signal
      </p>
      <h3 className="insight-title">
        {best ? 'High Confidence Edge' : 'Not enough samples'}
      </h3>
      <p className="insight-body">
        {best ? (
          <>
            Your <strong>{best.label}</strong> setup currently holds an{' '}
            <strong className="pos">
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
    <p className="insight-body">
      {leaking ? (
        <>
          Trading performance drops significantly after 2:00 PM. Expected value per
          trade:{' '}
          <strong className="neg">
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
  const severityClass =
    leak.result?.severity === 'high'
      ? ' is-high'
      : leak.result?.severity === 'medium'
        ? ' is-medium'
        : ''

  return (
    <article className={`card insight-card leak-card${severityClass}`}>
      <div className="insight-head">
        <p className="insight-kicker">
          <AlertIcon className="kicker-icon warn" />
          Behavioral Leak
        </p>

        {leak.result && (
          <button
            type="button"
            className="insight-refresh"
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
        <div className="leak-loading" aria-live="polite">
          <span className="shimmer title" />
          <span className="shimmer" />
          <span className="shimmer short" />
          <p className="leak-note">Reading your journal…</p>
        </div>
      )}

      {!leak.loading && leak.needed !== null && (
        <>
          <h3 className="insight-title">Not enough history</h3>
          <p className="insight-body">
            Log {leak.needed - leak.have} more{' '}
            {leak.needed - leak.have === 1 ? 'trade' : 'trades'} and the coach will
            analyse your execution patterns.
          </p>
        </>
      )}

      {!leak.loading && leak.error && (
        <>
          <h3 className="insight-title">Analysis unavailable</h3>
          <p className="insight-body">{leak.error}</p>
        </>
      )}

      {!leak.loading && leak.result && (
        <>
          <h3 className="insight-title">{leak.result.title}</h3>
          <p className="insight-body">{leak.result.finding}</p>

          {leak.result.costLabel && (
            <p className="leak-cost">
              <span>Estimated cost</span>
              <strong className="neg">{leak.result.costLabel}</strong>
            </p>
          )}

          {leak.result.recommendation && (
            <p className="leak-fix">
              <SparkleIcon size={13} />
              {leak.result.recommendation}
            </p>
          )}

          <p className="leak-note">
            <SparkleIcon size={11} />
            Written from your logged trades
          </p>
        </>
      )}

      {/* Nothing configured server-side: keep the card useful anyway. */}
      {!leak.loading && leak.unavailable && !leak.result && (
        <>
          <h3 className="insight-title">
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
