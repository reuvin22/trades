import { BROKERS } from '../../data/admin'
import { ChevronRightIcon } from '../Icons'

export function BrokerStatus() {
  return (
    <section className="card broker-card">
      <div className="card-head">
        <h2 className="card-title small">Broker Integration Status</h2>
        <a className="link" href="#/admin/integrations">
          Manage All Brokers
          <ChevronRightIcon />
        </a>
      </div>

      <div className="broker-grid">
        {BROKERS.map((broker) => (
          <article key={broker.id} className="broker-tile">
            <div className="broker-head">
              <span className="broker-logo" style={{ background: broker.accent }}>
                {broker.initials}
              </span>
              <div className="broker-id">
                <p className="broker-name">{broker.name}</p>
                <p className="broker-protocol">{broker.protocol}</p>
              </div>
              <span className={`dot ${broker.health === 'healthy' ? 'up' : 'warn'}`} />
            </div>

            <dl className="broker-metrics">
              <div>
                <dt>Latency</dt>
                <dd className="mono">{broker.latency}</dd>
              </div>
              <div>
                <dt>Success Rate</dt>
                <dd className="mono">{broker.successRate}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
