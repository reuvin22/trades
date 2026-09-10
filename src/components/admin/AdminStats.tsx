import type { CSSProperties } from 'react'
import { AnimatedNumber } from '../AnimatedNumber'
import { REVENUE_BARS, USER_BARS } from '../../data/admin'
import { CardIcon, SnowflakeIcon, BoltIcon, UsersIcon } from '../Icons'

function Sparkbars({ bars, tone }: { bars: number[]; tone: 'accent' | 'warm' }) {
  return (
    <div className={`sparkbars ${tone}`} aria-hidden="true">
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
    <div className="admin-stat-row">
      <article className="card admin-stat">
        <div className="admin-stat-head">
          <span className="stat-glyph">
            <UsersIcon size={17} />
          </span>
          <span className="tag pos">+12%</span>
        </div>
        <p className="admin-stat-label">Total Users</p>
        <p className="admin-stat-value">
          <AnimatedNumber value={124.5} format={(n) => `${n.toFixed(1)}k`} />
        </p>
        <Sparkbars bars={USER_BARS} tone="accent" />
      </article>

      <article className="card admin-stat">
        <div className="admin-stat-head">
          <span className="stat-glyph">
            <CardIcon size={17} />
          </span>
          <span className="tag pos">+5%</span>
        </div>
        <p className="admin-stat-label">Monthly Recurring Revenue</p>
        <p className="admin-stat-value">
          <AnimatedNumber value={1.2} format={(n) => `$${n.toFixed(1)}M`} />
        </p>
        <Sparkbars bars={REVENUE_BARS} tone="warm" />
      </article>

      <article className="card admin-stat">
        <div className="admin-stat-head">
          <span className="stat-glyph">
            <SnowflakeIcon size={17} />
          </span>
          <span className="tag">Stable</span>
        </div>
        <p className="admin-stat-label">Active Brokers</p>
        <p className="admin-stat-value">
          <AnimatedNumber value={14} format={(n) => `${Math.round(n)}`} />
        </p>
        <p className="admin-stat-note">
          <span className="dot up" />
          All integrations responding
        </p>
      </article>

      <article className="card admin-stat">
        <div className="admin-stat-head">
          <span className="stat-glyph">
            <BoltIcon size={17} />
          </span>
          <span className="tag pos">Optimal</span>
        </div>
        <p className="admin-stat-label">System Uptime (30d)</p>
        <p className="admin-stat-value">
          <AnimatedNumber value={99.98} format={(n) => `${n.toFixed(2)}%`} />
        </p>
        <div className="meter tall">
          <span style={{ width: '99.98%' }} />
        </div>
      </article>
    </div>
  )
}
