import { useMemo, useState } from 'react'
import { EquityChart } from '../components/EquityChart'
import { DisciplineCard } from '../components/DisciplineCard'
import { PerformanceCalendar } from '../components/PerformanceCalendar'
import { RangeMenu } from '../components/RangeMenu'
import { RecentActivity } from '../components/RecentActivity'
import { SetupTable } from '../components/SetupTable'
import { StatCards } from '../components/StatCards'
import { deriveStats, startingCapital, tradeDate } from '../lib/stats'
import { greeting } from '../lib/dashboardStats'
import { moneyIn } from '../lib/journalStats'
import { rangeLabel, windowFor, within, type Preset } from '../lib/dateWindow'
import { GREETING, GREETING_ROW, GREETING_SPAN, GREETING_SUB, PAGE_ACTIONS } from '../components/ui'
import type { DateRange } from '../components/DateRangePicker'
import type { StoredTrade } from '../lib/trades'
import type { Profile } from '../lib/profile'

type DashboardProps = { trades: StoredTrade[]; profile: Profile | null; onQuickAdd: () => void }
const SPAN = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

function coverage(trades: StoredTrade[]): string | null {
  const dates = trades.map(tradeDate).filter((when): when is Date => when !== null).sort((a, b) => a.getTime() - b.getTime())
  if (!dates.length) return null
  const first = SPAN.format(dates[0])
  const last = SPAN.format(dates[dates.length - 1])
  return first === last ? first : `${first} - ${last}`
}

/** Fixed trading-terminal composition. Data, filters and actions remain shared. */
export function Dashboard({ trades, profile, onQuickAdd }: DashboardProps) {
  const [range, setRange] = useState<Preset>('ALL')
  const [custom, setCustom] = useState<DateRange | null>(null)
  const span = useMemo(() => windowFor(range, custom), [range, custom])
  const shown = useMemo(() => within(trades, span), [trades, span])
  const label = rangeLabel(range, custom)
  const opening = startingCapital(profile)
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])
  const stats = useMemo(() => deriveStats(shown, opening), [shown, opening])
  const name = profile?.displayName?.trim().split(' ')[0] ?? ''
  const covered = coverage(shown)

  return <>
    <div className={`${GREETING_ROW} dashboard-heading`}>
      <div><h2 className={GREETING}>{greeting()}{name && `, ${name}`}</h2><p className={GREETING_SUB}>Your trading performance at a glance.</p></div>
      <div className={PAGE_ACTIONS}>
        {covered && <span className={GREETING_SPAN}>{covered} · {shown.length} trades</span>}
        <RangeMenu presets={['ALL', '7D', '30D', '90D']} range={range} custom={custom} onPreset={(next) => { setRange(next); setCustom(null) }} onCustom={setCustom} />
        <button type="button" onClick={onQuickAdd} className="dashboard-log-trade">Log Trade</button>
      </div>
    </div>
    <div className="terminal-dashboard">
      <div className="terminal-equity"><EquityChart equity={stats.equity} opening={opening} spanLabel={label} /></div>
      <div className="terminal-metrics"><StatCards stats={stats} currency={money} opening={opening} /></div>
      <div className="terminal-side"><DisciplineCard trades={shown} /><PerformanceCalendar dailyPl={stats.dailyPl} /></div>
      <div className="terminal-trades"><RecentActivity trades={shown} /></div>
      <div className="terminal-strategies"><SetupTable trades={shown} money={money} /></div>
    </div>
  </>
}
