import type { CSSProperties } from 'react'
import { AnimatedNumber } from '../AnimatedNumber'
import { REVENUE_BARS, USER_BARS } from '../../data/admin'
import { CardIcon, SnowflakeIcon, BoltIcon, UsersIcon } from '../Icons'
import {
  ADMIN_STAT,
  ADMIN_STAT_HEAD,
  ADMIN_STAT_LABEL,
  ADMIN_STAT_NOTE,
  ADMIN_STAT_ROW,
  ADMIN_STAT_VALUE,
  CARD,
  CARD_HOVER,
  METER,
  METER_FILL,
  METER_TALL,
  ROW_STAGGER,
  SPARKBARS,
  SPARKBARS_ACCENT,
  SPARKBARS_WARM,
  DOT,
  DOT_UP,
  STAT_GLYPH,
  TAG,
  TAG_POS,
} from '../ui'

function Sparkbars({ bars, tone }: { bars: number[]; tone: 'accent' | 'warm' }) {
  return (
    <div className={`${SPARKBARS} ${tone === 'warm' ? SPARKBARS_WARM : SPARKBARS_ACCENT}`} aria-hidden="true">
      {bars.map((height, index) => (
        <span
          key={index}
          style={{ height: `${height * 100}%`, '--i': index } as CSSProperties}
        />
      ))}
    </div>
  )
}

export function AdminStats() {
  return (
    <div className={`${ADMIN_STAT_ROW} ${ROW_STAGGER}`}>
      <article className={`${CARD} ${CARD_HOVER} ${ADMIN_STAT}`}>
        <div className={ADMIN_STAT_HEAD}>
          <span className={STAT_GLYPH}>
            <UsersIcon size={17} />
          </span>
          <span className={`${TAG} ${TAG_POS}`}>+12%</span>
        </div>
        <p className={ADMIN_STAT_LABEL}>Total Users</p>
        <p className={ADMIN_STAT_VALUE}>
          <AnimatedNumber value={124.5} format={(n) => `${n.toFixed(1)}k`} />
        </p>
        <Sparkbars bars={USER_BARS} tone="accent" />
      </article>

      <article className={`${CARD} ${CARD_HOVER} ${ADMIN_STAT}`}>
        <div className={ADMIN_STAT_HEAD}>
          <span className={STAT_GLYPH}>
            <CardIcon size={17} />
          </span>
          <span className={`${TAG} ${TAG_POS}`}>+5%</span>
        </div>
        <p className={ADMIN_STAT_LABEL}>Monthly Recurring Revenue</p>
        <p className={ADMIN_STAT_VALUE}>
          <AnimatedNumber value={1.2} format={(n) => `$${n.toFixed(1)}M`} />
        </p>
        <Sparkbars bars={REVENUE_BARS} tone="warm" />
      </article>

      <article className={`${CARD} ${CARD_HOVER} ${ADMIN_STAT}`}>
        <div className={ADMIN_STAT_HEAD}>
          <span className={STAT_GLYPH}>
            <SnowflakeIcon size={17} />
          </span>
          <span className={TAG}>Stable</span>
        </div>
        <p className={ADMIN_STAT_LABEL}>Active Brokers</p>
        <p className={ADMIN_STAT_VALUE}>
          <AnimatedNumber value={14} format={(n) => `${Math.round(n)}`} />
        </p>
        <p className={ADMIN_STAT_NOTE}>
          <span className={`${DOT} ${DOT_UP}`} />
          All integrations responding
        </p>
      </article>

      <article className={`${CARD} ${CARD_HOVER} ${ADMIN_STAT}`}>
        <div className={ADMIN_STAT_HEAD}>
          <span className={STAT_GLYPH}>
            <BoltIcon size={17} />
          </span>
          <span className={`${TAG} ${TAG_POS}`}>Optimal</span>
        </div>
        <p className={ADMIN_STAT_LABEL}>System Uptime (30d)</p>
        <p className={ADMIN_STAT_VALUE}>
          <AnimatedNumber value={99.98} format={(n) => `${n.toFixed(2)}%`} />
        </p>
        <div className={`${METER} ${METER_TALL}`}>
          <span className={`${METER_FILL} animate-meter origin-left`} style={{ width: '99.98%' }} />
        </div>
      </article>
    </div>
  )
}
