import { useMemo } from 'react'
import { riskHealth } from '../lib/dashboardStats'
import type { DerivedStats } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import {
  CARD,
  CARD_HOVER,
  NEG,
  PANEL,
  PANEL_EMPTY,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  POS,
  RISK_AGAINST,
  RISK_GRID,
  RISK_ITEM,
  RISK_LABEL,
  RISK_VALUE,
} from './ui'

/**
 * How much is being put at risk, against how much was meant to be.
 *
 * Every figure here is measured from the stop: distance to it, times size.
 * That means a trade filed without a stop cannot be read at all, which is why
 * the sample size sits beside the heading rather than being hidden — "0.9%
 * average risk" means something very different over forty trades than over
 * three.
 */
export function RiskHealthCard({
  trades,
  stats,
  capital,
  limitPct,
}: {
  trades: StoredTrade[]
  stats: DerivedStats
  capital: number
  /** The trader's own ceiling from Settings, if they set one. */
  limitPct: number | null
}) {
  const risk = useMemo(
    () => riskHealth(trades, capital, limitPct),
    [trades, capital, limitPct],
  )

  const percent = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`)

  return (
    <article className={`${CARD} ${CARD_HOVER} ${PANEL}`}>
      <div className={PANEL_HEAD}>
        <h3 className={PANEL_TITLE}>Risk health</h3>
        {risk.sample > 0 && (
          <span className={PANEL_NOTE}>
            from {risk.sample} of {risk.total} trades
          </span>
        )}
      </div>

      {risk.sample === 0 ? (
        <p className={PANEL_EMPTY}>
          Log a stop-loss and a size with your trades and this works out what
          you actually risk on each one.
        </p>
      ) : (
        <div className={RISK_GRID}>
          <div className={RISK_ITEM}>
            <span className={RISK_LABEL}>Average risk</span>
            <strong className={RISK_VALUE}>{percent(risk.averagePct)}</strong>
            {risk.limitPct !== null && (
              <span className={RISK_AGAINST}>your limit: {risk.limitPct}%</span>
            )}
          </div>

          <div className={RISK_ITEM}>
            <span className={RISK_LABEL}>Largest risk</span>
            <strong
              className={`${RISK_VALUE} ${
                risk.limitPct !== null &&
                risk.largestPct !== null &&
                risk.largestPct > risk.limitPct
                  ? NEG
                  : ''
              }`}
            >
              {percent(risk.largestPct)}
            </strong>
            {risk.breaches !== null && (
              <span className={RISK_AGAINST}>
                {risk.breaches === 0
                  ? 'never over'
                  : `${risk.breaches} over the limit`}
              </span>
            )}
          </div>

          <div className={RISK_ITEM}>
            <span className={RISK_LABEL}>Expectancy</span>
            <strong
              className={`${RISK_VALUE} ${
                risk.expectancyR === null ? '' : risk.expectancyR >= 0 ? POS : NEG
              }`}
            >
              {risk.expectancyR === null
                ? '—'
                : `${risk.expectancyR > 0 ? '+' : ''}${risk.expectancyR.toFixed(2)}R`}
            </strong>
            <span className={RISK_AGAINST}>
              {risk.rSample === 0 ? 'needs a stop' : `over ${risk.rSample} trades`}
            </span>
          </div>

          <div className={RISK_ITEM}>
            <span className={RISK_LABEL}>Max drawdown</span>
            <strong className={`${RISK_VALUE} ${stats.maxDrawdownPct > 0 ? NEG : ''}`}>
              {stats.maxDrawdownPct === 0 ? '—' : `-${stats.maxDrawdownPct.toFixed(1)}%`}
            </strong>
            <span className={RISK_AGAINST}>peak to trough</span>
          </div>
        </div>
      )}
    </article>
  )
}
