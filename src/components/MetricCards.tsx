import { AnimatedNumber } from './AnimatedNumber'
import { CARD, CARD_HOVER, DELTA, ROW_STAGGER, TABULAR } from './ui'
import { currency, shortDate } from '../data/dashboard'
import { formatFactor, formatHold, type DerivedStats } from '../lib/stats'
import {
  AlertIcon,
  ClockIcon,
  ExpectancyIcon,
  ScalesIcon,
  TrendIcon,
} from './Icons'

export function MetricCards({ stats }: { stats: DerivedStats }) {
  return (
    <div data-tour="metrics" className={`grid grid-cols-4 gap-16 max-[1180px]:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] ${ROW_STAGGER}`}>
      <article className={`${CARD} ${CARD_HOVER} flex flex-col gap-6 px-18 pt-16 pb-18`}>
        <div className="flex items-center justify-between gap-12">
          <p className="text-[12px] text-fg-muted">Expectancy</p>
          <ExpectancyIcon className="flex-none text-fg-muted opacity-70" />
        </div>
        <p className={`text-[25px] font-semibold leading-[1.2] tracking-[-0.025em] ${TABULAR} ${stats.expectancy < 0 ? 'text-red' : ''}`}>
          <AnimatedNumber value={stats.expectancy} format={(n) => currency.format(n)} />
        </p>
        <div className="text-[11.5px] text-fg-muted">
          <span className={`${DELTA} gap-4 text-[11.5px] ${stats.monthPct >= 0 ? '' : 'text-red [&>svg]:-scale-y-100'}`}>
            <TrendIcon size={13} />
            {stats.monthPct >= 0 ? '+' : ''}
            {stats.monthPct.toFixed(1)}%
          </span>
        </div>
      </article>

      <article className={`${CARD} ${CARD_HOVER} flex flex-col gap-6 px-18 pt-16 pb-18`}>
        <div className="flex items-center justify-between gap-12">
          <p className="text-[12px] text-fg-muted">Profit Factor</p>
          <ScalesIcon className="flex-none text-fg-muted opacity-70" />
        </div>
        <p className={`text-[25px] font-semibold leading-[1.2] tracking-[-0.025em] ${TABULAR}`}>{formatFactor(stats.profitFactor)}</p>
        <div className="text-[11.5px] text-fg-muted">
          {stats.profitFactor >= 2 ? 'Industry Top 5%' : 'Target: 2.0+'}
        </div>
      </article>

      <article className={`${CARD} ${CARD_HOVER} flex flex-col gap-6 px-18 pt-16 pb-18`}>
        <div className="flex items-center justify-between gap-12">
          <p className="text-[12px] text-fg-muted">Max Drawdown</p>
          <AlertIcon className="flex-none text-fg-muted opacity-70" />
        </div>
        <p className={`text-[25px] font-semibold leading-[1.2] tracking-[-0.025em] text-red ${TABULAR}`}>
          <AnimatedNumber
            value={stats.maxDrawdownPct}
            format={(n) => `-${n.toFixed(1)}%`}
          />
        </p>
        <div className="text-[11.5px] text-fg-muted">
          {stats.maxDrawdownAt ? `Last: ${shortDate.format(stats.maxDrawdownAt)}` : 'None yet'}
        </div>
      </article>

      <article className={`${CARD} ${CARD_HOVER} flex flex-col gap-6 px-18 pt-16 pb-18`}>
        <div className="flex items-center justify-between gap-12">
          <p className="text-[12px] text-fg-muted">Avg. Hold Time</p>
          <ClockIcon className="flex-none text-fg-muted opacity-70" />
        </div>
        <p className={`text-[25px] font-semibold leading-[1.2] tracking-[-0.025em] ${TABULAR}`}>{formatHold(stats.avgHoldMinutes)}</p>
        <div className="text-[11.5px] text-fg-muted">
          {stats.avgHoldMinutes > 480 ? 'Swing Focused' : 'Intraday Focused'}
        </div>
      </article>
    </div>
  )
}
