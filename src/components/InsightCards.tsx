import { currency } from '../data/dashboard'
import type { DerivedStats } from '../lib/stats'
import { AlertIcon, BoltIcon } from './Icons'

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

export function BehavioralLeakCard({ stats }: { stats: DerivedStats }) {
  const leaking = stats.fatigueAfterHour !== null && stats.fatigueExpectancy < 0

  return (
    <article className="card insight-card">
      <p className="insight-kicker">
        <AlertIcon className="kicker-icon warn" />
        Behavioral Leak
      </p>
      <h3 className="insight-title">{leaking ? 'Session Fatigue' : 'No leak detected'}</h3>
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
    </article>
  )
}
