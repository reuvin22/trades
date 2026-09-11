import { BROKERS } from '../../data/admin'
import { ChevronRightIcon } from '../Icons'
import {
  BROKER_CARD,
  BROKER_GRID,
  BROKER_HEAD,
  BROKER_LOGO,
  BROKER_METRICS,
  BROKER_NAME,
  BROKER_PROTOCOL,
  BROKER_TILE,
  CARD,
  CARD_HEAD,
  CARD_HOVER,
  CARD_TITLE,
  CARD_TITLE_SMALL,
  DOT,
  DOT_UP,
  DOT_WARN,
  LINK,
  MONO,
  ROW_STAGGER,
} from '../ui'

export function BrokerStatus() {
  return (
    <section className={`${CARD} ${BROKER_CARD}`}>
      <div className={CARD_HEAD}>
        <h2 className={`${CARD_TITLE} ${CARD_TITLE_SMALL}`}>Broker Integration Status</h2>
        <a className={LINK} href="#/admin/integrations">
          Manage All Brokers
          <ChevronRightIcon />
        </a>
      </div>

      <div className={`${BROKER_GRID} ${ROW_STAGGER}`}>
        {BROKERS.map((broker) => (
          <article key={broker.id} className={`${BROKER_TILE} ${CARD_HOVER}`}>
            <div className={BROKER_HEAD}>
              <span className={BROKER_LOGO} style={{ background: broker.accent }}>
                {broker.initials}
              </span>
              <div className="min-w-0">
                <p className={BROKER_NAME}>{broker.name}</p>
                <p className={BROKER_PROTOCOL}>{broker.protocol}</p>
              </div>
              <span className={`${DOT} ${broker.health === 'healthy' ? DOT_UP : DOT_WARN}`} />
            </div>

            <dl className={BROKER_METRICS}>
              <div>
                <dt>Latency</dt>
                <dd className={MONO}>{broker.latency}</dd>
              </div>
              <div>
                <dt>Success Rate</dt>
                <dd className={MONO}>{broker.successRate}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
